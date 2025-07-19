import { setupReactivity } from '../hooks/basic';

type BindFunction = () => any;
type ModelBindFunction = (value?: any) => any;
type ActionFunction = (params: {
  event: Event;
  element: HTMLElement;
  dataset: DOMStringMap;
  props: Record<string, any>;
  store?: any;
}) => void;

type EffectFunction = (args: { element: Element; context: ComponentContext }) => Promise<void> | void;

type OnPropsChangeFunction = (args: {
  props: Record<string, any>;
  element: Element;
  changed: Record<string, any>;
}) => Promise<void> | void;

interface ComponentContext {
  store?: any;
  bindings?: Record<string, BindFunction | ModelBindFunction>;
  effects?: EffectFunction[];
  actions?: Record<string, ActionFunction>;
  props?: Record<string, any>;
  onPropsChange?: OnPropsChangeFunction;
}

export async function hydrateComponent(
  element: Element | null,
  context: ComponentContext = {}
): Promise<void> {
  if (!element || element instanceof HTMLElement && element.dataset.hydrated === 'true') return;
  (element as HTMLElement).dataset.hydrated = 'true';

  const {
    store,
    bindings = {},
    effects = [],
    actions = {},
    props = {},
    onPropsChange,
  } = context;

  console.log('[hydrateComponent] Hydrating element:', element.tagName, { props });

  // Setup scoped reactivity
  if (store) {
    setupReactivity(store, element as HTMLElement);
  }

  // Run effects
  for (const effect of effects) {
    if (typeof effect === 'function') {
      await effect({ element, context });
    }
  }

  // TEXT bindings
  element.querySelectorAll<HTMLElement>('[data-bind-text]').forEach((el) => {
    const key = el.dataset.bindText!;
    const fn = bindings[key];
    if (typeof fn === 'function') {
      el.textContent = fn();
    }
  });

  // HTML bindings
  element.querySelectorAll<HTMLElement>('[data-bind-html]').forEach((el) => {
    const key = el.dataset.bindHtml!;
    const fn = bindings[key];
    if (typeof fn === 'function') {
      el.innerHTML = fn();
    }
  });

  // Model bindings
  element.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('[data-model]').forEach((el) => {
    const key = el.dataset.model!;
    const fn = bindings[key];

    if (typeof fn === 'function') {
      const val = fn();
      if (el.value !== val) el.value = val;

      el.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        fn(target.value);

        if (typeof onPropsChange === 'function') {
          onPropsChange({ props, element, changed: { [key]: target.value } });
        }
      });
    }
  });

  // Action/event bindings
  element.querySelectorAll<HTMLElement>('[data-action]').forEach((el) => {
    const actionName = el.dataset.action!;
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

  // Optional initial props callback
  if (typeof onPropsChange === 'function') {
    try {
      await onPropsChange({ props, element, changed: props });
    } catch (err) {
      console.warn('[hydrateComponent] onPropsChange error:', err);
    }
  }
}
