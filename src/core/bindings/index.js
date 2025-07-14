export function bindText(el, get, subscribe) {
  if (el) {
    el.textContent = get();
    subscribe(() => {
      el.textContent = get();
    });
  }
}

export function bindAttr(el, attrName, get, subscribe) {
  el.setAttribute(attrName, get());
  subscribe(() => {
    el.setAttribute(attrName, get());
  });
}

export function bindClass(el, className, get, subscribe) {
  if (get()) el.classList.add(className);
  else el.classList.remove(className);

  subscribe(() => {
    if (get()) el.classList.add(className);
    else el.classList.remove(className);
  });
}
