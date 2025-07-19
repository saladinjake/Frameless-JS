// import { bindText } from './';

type Signal<T> = {
  peek: () => T;
  subscribe: (callback: (val: T) => void) => void;
};

type Props = Record<string, any>;

function bindText(el: Element, value: any, callback: () => void): void {
  // Dummy binding logic — replace with actual if needed
  el.textContent = typeof value === 'function' ? value() : value;
  callback();
}

export function hydrateElmentAttibutesBindings(rootEl: HTMLElement, props: Props = {}): void {
  const keys = Object.keys(props);

  // 1. data-ref text bindings
  keys.forEach((key) => {
    const el = rootEl.querySelector<HTMLElement>(`[data-ref="${key}"]`);
    if (el) {
      bindText(el, props[key], () => {});
    }
  });

  // 2. data-bind and data-bind-attr signal bindings
  keys.forEach((key) => {
    const value = props[key] as Signal<any>;
    if (typeof value?.subscribe !== 'function' || typeof value?.peek !== 'function') return;

    // Handle data-bind="key"
    rootEl.querySelectorAll<HTMLElement>(`[data-bind="${key}"]`).forEach((el) => {
      el.textContent = value.peek();
      value.subscribe((val) => (el.textContent = val));
    });

    // Handle data-bind-attr="src:name, alt:title"
    rootEl.querySelectorAll<HTMLElement>('[data-bind-attr]').forEach((el) => {
      const bindings = el.getAttribute('data-bind-attr')?.split(',') || [];
      bindings.forEach((pair) => {
        const [attr, signalKey] = pair.trim().split(':');
        if (signalKey === key) {
          el.setAttribute(attr, value.peek());
          value.subscribe((val) => el.setAttribute(attr, val));
        }
      });
    });
  });
}
