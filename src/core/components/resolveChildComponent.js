import { hydrateComponent } from '../hydrations/hydrateComponent';
import { setupReactivity } from '../hooks/basic';
import { getComponentLoader } from './defineComponent';

// Native HTML tags to skip
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
  const hasDash = tag.includes('-');
  const hasUpper = /[A-Z]/.test(tagName);
  return (hasDash || hasUpper) && !nativeTags.has(tag);
}

export async function resolveChildComponents(root, context = {}) {
  const customTags = [...root.querySelectorAll('*')].filter((el) => {
    return isCustomComponent(el.tagName);
  });

  for (const el of customTags) {
    const tagName = el.tagName.toLowerCase();
    let loader;

    try {
      loader = getComponentLoader(tagName);
      if (!loader) continue;

      const mod = await loader();
      const init = mod?.init;

      if (typeof init !== 'function') continue;

      // Convert dash-case and camelCase attributes to props
      const props = {};
      for (const attr of el.attributes) {
        const key = attr.name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        props[key] = attr.value;
      }

      const result = await init({ props, context });
      if (!result?.template) continue;

      const compRoot = document.createElement('div');

      //  Always wrap to ensure consistent child structure
      compRoot.innerHTML = `<div>${result.template}</div>`;
      const domNodes = [...compRoot.firstElementChild.children];
      if (domNodes.length === 0) {
        console.warn(`<${tagName}> returned empty or invalid HTML`);
        continue;
      }

      domNodes.forEach((node) => {
        hydrateComponent(node, result);
        if (result.store) setupReactivity(result.store, node);
      });

      // Inject slots, if any
      [...el.children].forEach((tpl) => {
        if (tpl.tagName === 'TEMPLATE') {
          const name = tpl.getAttribute('slot');
          const slotTarget = name
            ? compRoot.querySelector(`slot[name="${name}"]`)
            : compRoot.querySelector('slot:not([name])');

          if (slotTarget) {
            slotTarget.replaceWith(tpl.content.cloneNode(true));
          }
        }
      });

      // Recurse
      await resolveChildComponents(compRoot, result);

      el.replaceWith(...compRoot.firstElementChild.children);

      if (typeof result.onMount === 'function') {
        requestAnimationFrame(() => result.onMount({ props, context }));
      }
    } catch (err) {
      console.warn(`Failed to load component <${tagName}>`, err);
    }
  }
}
