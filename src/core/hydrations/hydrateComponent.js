import { setupReactivity } from '../hooks/basic';

export async function hydrateComponent(element, context = {}) {
  if (element.dataset.hydrated) return;
  element.dataset.hydrated = 'true';

  const { store, bindings = {}, effects = [], actions = {} } = context;

  if (store) {
    setupReactivity(store, element);
  }

  for (const effect of effects) {
    if (typeof effect === 'function') {
      await effect({ element, context });
    }
  }

  element.querySelectorAll('[data-bind-text]').forEach((el) => {
    const key = el.dataset.bindText;
    const fn = bindings[key];
    if (typeof fn === 'function') el.textContent = fn();
  });

  element.querySelectorAll('[data-model]').forEach((el) => {
    const key = el.dataset.model;
    const fn = bindings[key];

    // Add this here:
    console.log('[hydrate:model]', { key, fn: typeof fn, value: fn?.() });

    if (typeof fn === 'function') {
      const current = fn();
      if (el.value !== current) el.value = current;
      el.addEventListener('input', (e) => fn(e.target.value));
    }
  });

  element.querySelectorAll('[data-action]').forEach((el) => {
    const { action, eventType = 'click' } = el.dataset;
    const fn = actions[action];
    if (typeof fn === 'function') {
      el.addEventListener(eventType, (event) => {
        event.preventDefault();
        fn({ event, element: el, dataset: { ...el.dataset } });
      });
    }
  });
}
