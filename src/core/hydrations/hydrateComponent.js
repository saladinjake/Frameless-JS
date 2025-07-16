import { setupReactivity } from '../hooks/basic';

export async function hydrateComponent(element, context = {}) {
  const { store, bindings = {}, effects = [], actions = {} } = context;

  if (store) {
    setupReactivity(store, element);
  }

  for (const effect of effects) {
    if (typeof effect === 'function') {
      await effect({ element, context });
    }
  }

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
