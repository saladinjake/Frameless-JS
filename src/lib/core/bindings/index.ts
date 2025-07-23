export function bindText(
  el: HTMLElement | null,
  get: () => string,
  subscribe: (callback: () => void) => void
): void {
  if (!el) return;

  el.textContent = get();

  subscribe(() => {
    el.textContent = get();
  });
}


export function bindActions(app: HTMLElement, handlers: any = {}) {
  const elements = app.querySelectorAll('[data-action]');
  elements.forEach((el: any) => {
    const { action, eventType = null } = el.dataset;
    const fn = handlers[action];
    if (typeof fn !== 'function') return;

    el.addEventListener(eventType != null ? eventType : 'click', (event: any) => {
      event.preventDefault();
      fn({ event, element: el, dataset: { ...el.dataset } });
    });
  });
}
