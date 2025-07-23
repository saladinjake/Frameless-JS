export function bindActionsWithObserver(app: HTMLElement, handlers: Record<string, Function| any>) {
  const alreadyBound = new WeakSet<Element>();

  const bindElement = (el: any) => {
    if (!el.hasAttribute('data-action') || alreadyBound.has(el)) return;

    const { action, eventType = null } = el.dataset;
    const fn = handlers[action!];
    if (typeof fn !== 'function') {
      console.warn(`[bindActions] No function found for action "${action}"`);
      return;
    }

    el.addEventListener(eventType ?? 'click', (event: any) => {
      event.preventDefault();
      fn({ event, element: el, dataset: { ...el.dataset } });
    });

    alreadyBound.add(el);
  };

  const bindAll = (root: Element) => {
    if (root.hasAttribute && root.hasAttribute('data-action')) {
      bindElement(root);
    }
    root.querySelectorAll?.('[data-action]')?.forEach(bindElement);
  };

  // Initial binding
  bindAll(app);

  // Set up observer
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        bindAll(node);
      });
    }
  });

  observer.observe(app, {
    childList: true,
    subtree: true,
  });

  // Optionally return observer to allow disconnecting it later
  return observer;
}
