export function bindText(el, get, subscribe) {
  if (el) {
    el.textContent = get();
    subscribe(() => {
      el.textContent = get();
    });
  }
}
