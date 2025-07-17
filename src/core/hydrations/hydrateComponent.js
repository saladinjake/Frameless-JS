import { setupReactivity } from '../hooks/basic';

export async function hydrateComponent(element, context = {}) {
  if (!element || element.dataset.hydrated === 'true') return;
  element.dataset.hydrated = 'true';

  const {
    store,
    bindings = {},
    effects = [],
    actions = {},
    props = {},
    onPropsChange,
  } = context;

  console.log('[hydrateComponent] Hydrating element:', element.tagName, {
    props,
  });

  // Setup state reactivity on this element (if scoped)
  if (store) {
    setupReactivity(store, element);
  }

  // Run effects (lifecycles, async side-effects)
  for (const effect of effects) {
    if (typeof effect === 'function') {
      await effect({ element, context });
    }
  }

  // TEXT Bindings: <span data-bind-text="username"></span>
  element.querySelectorAll('[data-bind-text]').forEach((el) => {
    const key = el.dataset.bindText;
    const fn = bindings[key];
    if (typeof fn === 'function') {
      el.textContent = fn();
    }
  });

  // HTML Bindings: <div data-bind-html="htmlContent"></div>
  element.querySelectorAll('[data-bind-html]').forEach((el) => {
    const key = el.dataset.bindHtml;
    const fn = bindings[key];
    if (typeof fn === 'function') {
      el.innerHTML = fn();
    }
  });

  // Model Bindings (two-way): <input data-model="email" />
  element.querySelectorAll('[data-model]').forEach((el) => {
    const key = el.dataset.model;
    const fn = bindings[key];

    if (typeof fn === 'function') {
      // Set initial value
      const val = fn();
      if (el.value !== val) el.value = val;

      // Sync back on input
      el.addEventListener('input', (e) => {
        fn(e.target.value);
        // Optional: call onPropsChange if model is bound to props
        if (typeof onPropsChange === 'function') {
          onPropsChange({ props, element, changed: { [key]: e.target.value } });
        }
      });
    }
  });

  // Event Bindings: <button data-action="submit" data-event-type="click">
  element.querySelectorAll('[data-action]').forEach((el) => {
    const actionName = el.dataset.action;
    const eventType = el.dataset.eventType || 'click';
    const fn = actions[actionName];

    if (typeof fn === 'function') {
      el.addEventListener(eventType, (event) => {
        event.preventDefault();
        fn({
          event,
          element: el,
          dataset: { ...el.dataset },
          props,
          store,
        });
      });
    }
  });

  // Initial props callback (optional)
  if (typeof onPropsChange === 'function') {
    try {
      await onPropsChange({ props, element, changed: props });
    } catch (err) {
      console.warn('[hydrateComponent] onPropsChange error:', err);
    }
  }
}
