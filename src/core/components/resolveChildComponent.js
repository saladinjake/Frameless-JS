import { hydrateComponent } from '../hydrations/hydrateComponent';
import { setupReactivity } from '../hooks/basic';
import { getComponentLoader } from './defineComponent';
import { bindPropsToStore } from '../utils';

const nativeTags = new Set([
  'html',
  'head',
  'body',
  'base',
  'link',
  'meta',
  'style',
  'title',
  'address',
  'article',
  'aside',
  'footer',
  'header',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'main',
  'nav',
  'section',
  'div',
  'span',
  'a',
  'p',
  'ul',
  'li',
  'ol',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'form',
  'input',
  'button',
  'select',
  'option',
  'textarea',
  'label',
  'fieldset',
  'legend',
  'script',
  'noscript',
  'template',
  'slot',
  'img',
  'video',
  'audio',
  'canvas',
  'iframe',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'small',
  'br',
  'hr',
]);

function isCustomComponent(tagName) {
  const tag = tagName.toLowerCase();
  return !nativeTags.has(tag) && (tag.includes('-') || /[A-Z]/.test(tagName));
}

function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

const componentPropsMap = new WeakMap();
const componentPropsCache = new Map();

function extractProps(el) {
  const props = {};
  for (const attr of el.attributes) {
    const key = attr.name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    props[key] = attr.value;
  }
  return props;
}

function getComponentKey(el) {
  const tag = el.tagName.toLowerCase();
  const slot = el.getAttribute('slot') || '';
  return `${tag}::${slot}`;
}

export async function resolveChildComponents(root, context = {}) {
  const customTags = [...root.querySelectorAll('*')].filter((el) =>
    isCustomComponent(el.tagName),
  );

  for (const el of customTags) {
    const tagName = el.tagName.toLowerCase();

    try {
      const loader = getComponentLoader(tagName);
      if (!loader) continue;

      const mod = await loader();
      const init = mod?.init;
      if (typeof init !== 'function') continue;

      const currentProps = extractProps(el);
      const key = getComponentKey(el);
      const previousProps = componentPropsCache.get(key) || {};
      const mergedProps = { ...previousProps, ...currentProps };

      componentPropsCache.set(key, mergedProps);

      console.log('resolveChild', { tagName, mergedProps });

      const instance = await init({ ...context, props: mergedProps });
      // 🧠 Sync props → store.state (but don’t override)
      if (instance?.store?.state) {
        for (const [key, val] of Object.entries(mergedProps)) {
          if (typeof instance.store.state[key] === 'undefined') {
            instance.store.state[key] = val;
          }
        }
      }

      bindPropsToStore(instance); // Create data-model compatible bindings

      if (!instance?.template) continue;

      const wrapper = document.createElement('div');
      wrapper.innerHTML = `<div>${instance.template}</div>`;
      const compRoot = wrapper.firstElementChild;

      const componentContext = {
        ...context,
        ...instance,
        props: mergedProps,
        bindings: instance.bindings || {},
      };

      for (const node of [...compRoot.children]) {
        if (instance.store) setupReactivity(instance.store, node);
        await hydrateComponent(node, componentContext);
      }

      for (const tpl of [...el.children]) {
        if (tpl.tagName === 'TEMPLATE') {
          const name = tpl.getAttribute('slot');
          const target = name
            ? compRoot.querySelector(`slot[name="${name}"]`)
            : compRoot.querySelector('slot:not([name])');

          if (target) target.replaceWith(tpl.content.cloneNode(true));
        }
      }

      await resolveChildComponents(compRoot, componentContext);

      el.replaceWith(...compRoot.children);

      // At the end of the loop, after replaceWith:
      if (typeof instance.onMount === 'function') {
        requestAnimationFrame(() => {
          instance.onMount({ ...context, ...instance, props: mergedProps }); //
        });
      }
    } catch (err) {
      console.warn(`❌ Failed to load component <${tagName}>`, err);
    }
  }
}
