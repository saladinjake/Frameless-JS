import { hydrateComponent } from '../hydrations/hydrateComponent';
import { setupReactivity, watchEffect } from '../hooks/basic';
import { getComponentLoader } from './defineComponent';
import { bindPropsToStore, setupBindingReactivity } from '../utils';

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

function extractProps(el) {
  const props = {};
  for (const attr of el.attributes) {
    let name = attr.name;
    if (name.startsWith(':')) name = name.slice(1); // allow :prop
    name = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    props[name] = attr.value;
  }
  return props;
}

export async function resolveChildComponents(root, parentContext = {}) {
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
      console.log(currentProps, 'changeing...');
      const instance = await init({ ...parentContext, props: currentProps });
      if (!instance) continue;

      if (instance.store?.state) {
        for (const [key, val] of Object.entries(currentProps)) {
          if (typeof instance.store.state[key] === 'undefined') {
            instance.store.setState(key, val);
          }
        }
      }

      bindPropsToStore(instance);

      watchEffect({
        props: currentProps,
        store: instance.store,
        callback: ({ props, state }) => {
          for (const [key, val] of Object.entries(props)) {
            console.log(currentProps, props, key, val, '..............');
            if (typeof state[key] === 'undefined') {
              instance.store.setState(key, val);
            }
          }

          if (typeof instance.onPropsChanged === 'function') {
            instance.onPropsChanged({ props, state });
          }
        },
      });

      const wrapper = document.createElement('div');
      wrapper.innerHTML = `<div>${instance.template}</div>`;
      const compRoot = wrapper.firstElementChild;

      const componentContext = {
        ...parentContext,
        ...instance,
        props: currentProps,
        bindings: instance.bindings || {},
      };

      if (instance.store) setupReactivity(instance.store, compRoot);
      await hydrateComponent(compRoot, componentContext);

      for (const tpl of [...el.children]) {
        if (tpl.tagName === 'TEMPLATE') {
          const name = tpl.getAttribute('slot');
          const target = name
            ? compRoot.querySelector(`slot[name="${name}"]`)
            : compRoot.querySelector('slot:not([name])');

          if (target) {
            target.replaceWith(tpl.content.cloneNode(true));
          }
        }
      }

      await resolveChildComponents(compRoot, componentContext);

      const hydratedChildren = [...compRoot.children];
      el.replaceWith(...hydratedChildren);

      hydratedChildren.forEach((child) => {
        if (instance.store) setupReactivity(instance.store, child);
        console.log(instance, '.............');
        setupBindingReactivity(instance.store, child);
      });

      if (typeof instance.onMount === 'function') {
        requestAnimationFrame(() => {
          instance.onMount({ ...componentContext });
        });
      }
    } catch (err) {
      console.warn(`Failed to load component <${tagName}>`, err);
    }
  }
}
