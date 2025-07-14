import { bindText } from '.';

export function hydrateElmentAttibutesBindings(rootEl, props = {}) {
  const keys = Object.keys(props);

  // 2. data-ref text bindings
  keys.forEach((key) => {
    const el = rootEl.querySelector(`[data-ref="${key}"]`);
    if (el) {
      bindText(el, props[key], () => {});
    }
  });

  keys.forEach((key) => {
    const value = props[key];
    if (!value?.subscribe) return;

    // data-bind="name"
    rootEl.querySelectorAll(`[data-bind="${key}"]`).forEach((el) => {
      el.textContent = value.peek();
      value.subscribe((val) => (el.textContent = val));
    });

    // data-bind-attr="src:name, alt:title"
    rootEl.querySelectorAll('[data-bind-attr]').forEach((el) => {
      const bindings = el.getAttribute('data-bind-attr').split(',');
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
