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
