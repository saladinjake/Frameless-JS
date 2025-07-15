import { getDeep } from '../hooks/index';

export function bindText(el, get, subscribe) {
  if (el) {
    el.textContent = get();
    subscribe(() => {
      el.textContent = get();
    });
  }
}

// export function bindText(el, key, state, subscribe) {
//   const val = getDeep(state, key) ?? '';
//   console.log(el);
//   el.textContent = val;

//   if (typeof subscribe === 'function') {
//     subscribe((newState) => {
//       const newVal = getDeep(newState, key);
//       el.textContent = newVal;
//     });
//   }
// }

// export function bindText(el, getValue) {
//   const update = () => {
//     const val = typeof getValue === 'function' ? getValue() : getValue;
//     console.log(el, 'el');
//     el.textContent = val;
//   };
//   update();

//   const observer = new MutationObserver(update);
//   observer.observe(el, { childList: true, characterData: true, subtree: true });

//   // Optional cleanup if needed
//   el.__unbind = () => observer.disconnect();
// }

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
