// import { applyBindings } from "../bindings/interpolationBindings";
// type DirectiveContext = {
//   el: HTMLElement;
//   store: Record<string, any>;
//   props: Record<string, any>;
// };

// type Watcher = () => void;

// const directiveWatchers = new WeakMap<HTMLElement, Watcher[]>();




export function processDirectives(root: HTMLElement | DocumentFragment| any, store: any, props: any = {}) {
  interpolateBindings(root, store, props); // 1. Interpolation

  console.log(store.state, "nnn")
  const nodes = root.querySelectorAll('*');
  nodes.forEach( (el: any) => {
    if (!(el instanceof HTMLElement)) return;

    // 2. Standard directives
    if (el.hasAttribute('x-if')) applyXIf(el, store, props);
    if (el.hasAttribute('x-show')) applyXShow(el, store, props);
    if (el.hasAttribute('x-model')) applyXModel(el as HTMLInputElement, store, props);
    if (el.hasAttribute('x-text')) applyXText(el, store, props);
    if (el.hasAttribute('x-for')) applyXFor(el, store, props);
    if (el.hasAttribute('x-class')) applyXClass(el, store, props);
    if (el.hasAttribute('x-bind')) applyXBind(el, store, props);
    if (el.hasAttribute('x-on')) applyXOn(el, store, props);
    if ([...el.attributes].some(attr => attr.name.startsWith('x-bind:'))) {
      applyXBindColon(el, store, props);
    }

    // 3. Dynamic x-bind:attr
    [...el.attributes].forEach(attr => {
      if (attr.name.startsWith('x-bind:')) {
        const attrName = attr.name.split(':')[1];
        store.watch(() => {
          const val = Function('state', 'props', `with(state) with(props) { return ${attr.value} }`)(store.state, props);
          if (val === false || val == null) {
            el.removeAttribute(attrName);
          } else {
            el.setAttribute(attrName, String(val));
          }
        });
      }
    });
  });
}


















export function safeEval(expr: string, state: any = {}, props: any = {}) {
  console.log(expr, state, "<<>>....")
  try {
    return Function('state', 'props', `with(state) with(props) { return ${expr} }`)(state, props);
  } catch (err) {
    console.error(`safeEval error in "${expr}":`, err);
    return null;
  }
}


export function applyXText(el: HTMLElement, store: any, props: any = {}) {
  const expr = el.getAttribute('x-text');
  store.watch(() => {
    const value = safeEval(expr!, store.state, props);
    el.textContent = value ?? '';
  });
}


export function applyXShow(el: HTMLElement, store: any, props: any) {
  store.watch(() => {
    const value = safeEval(el.getAttribute('x-show')!, store.state, props);
    el.style.display = value ? '' : 'none';
  });
}

export function applyXIf(el: HTMLElement, store: any, props: any) {
  const comment = document.createComment('x-if');
  const parent = el.parentNode!;
  const placeholder = el.cloneNode(true) as HTMLElement;

  const render = () => {
    const value = safeEval(el.getAttribute('x-if')!, store.state, props);
    if (value) {
      if (!parent.contains(el)) parent.replaceChild(placeholder.cloneNode(true), comment);
    } else {
      if (parent.contains(el)) parent.replaceChild(comment, el);
    }
  };

  store.watch(render);
}

export function applyXModel(el: HTMLInputElement, store: any, props: any) {
  console.log(props)
  const key = el.getAttribute('x-model')!;
  el.addEventListener('input', () => store.setState(key, el.value));
  store.subscribe(key, (val: any) => {
    if (el.value !== val) el.value = val;
  });
}

export function applyXClass(el: HTMLElement, store: any, props: any) {
  store.watch(() => {
    const expr = el.getAttribute('x-class')!;
    const result = safeEval(expr, store.state, props);
    el.className = typeof result === 'object'
      ? Object.entries(result).filter(([_, v]) => v).map(([k]) => k).join(' ')
      : result;
  });
}

export function applyXOn(el: HTMLElement, store: any, props: any = {}) {
  [...el.attributes].forEach(attr => {
    if (!attr.name.startsWith('x-on:')) return;

    const eventName = attr.name.slice(5); // get event type, e.g., "click"
    const expr = attr.value;

    const handler = (e: Event) => {
      try {
        Function('event', 'state', 'props', `with(state) with(props) { ${expr} }`)(e, store.state, props);
      } catch (err) {
        console.error(`x-on error in "${expr}":`, err);
      }
    };

    el.addEventListener(eventName, handler);
  });
}


export function applyXFor(el: HTMLElement, store: any, outerProps: any = {}) {
  const expr = el.getAttribute('x-for');
  if (!expr) return;

  const parent = el.parentElement!;
  const template = el.cloneNode(true) as HTMLElement;
  el.remove(); // remove the original node

  // Ensure a marker exists to insert before
  let endMarker: any = parent.querySelector('[x-for-end]');
  if (!endMarker) {
    endMarker = document.createComment('x-for-end');
    endMarker.nodeType === 8 && parent.appendChild(endMarker); // insert once
  }

  const render = () => {
    // Remove previously rendered clones
    parent.querySelectorAll('[x-for-item]').forEach(n => n.remove());

    const match = expr.match(/^\s*\(?\s*([a-zA-Z0-9_$]+)(\s*,\s*([a-zA-Z0-9_$]+))?\s*\)?\s+in\s+(.*)$/);
    if (!match) {
      console.error(`Invalid x-for expression: "${expr}"`);
      return;
    }

    const itemVar = match[1];
    const indexVar = match[3] || 'index';
    const listExpr = match[4];

    let list: any[] = [];

    try {
      list = Function('state', 'props', `with(state) with(props) { return ${listExpr} }`)(store.state, outerProps);
      if (!Array.isArray(list)) list = [];
    } catch (e) {
      console.error(`x-for list eval failed: "${listExpr}"`, e);
    }

    list.forEach((item, index) => {
      const clone = template.cloneNode(true) as HTMLElement;
      clone.removeAttribute('x-for');
      clone.setAttribute('x-for-item', '');

      const localScope = {
        ...outerProps,
        [itemVar]: item,
        [indexVar]: index,
      };

      // Insert first before processing directives (important for live DOM)
      parent.insertBefore(clone, endMarker);

      // Now hydrate the inserted node
      interpolateBindings(clone, store, localScope); // handles {{ }}
      processDirectives(clone, store, localScope);   // handles x-on, etc.
    });
  };

  store.watch(render);
  render();
}


export function applyXBind(el: HTMLElement, store: any, props: any) {
  store.watch(() => {
    const value = safeEval(el.getAttribute('x-bind')!, store.state, props);
    if (typeof value === 'object') {
      Object.entries(value).forEach(([key, val]) => {
        if (val === false || val == null) {
          el.removeAttribute(key);
        } else {
          el.setAttribute(key, String(val));
        }
      });
    }
  });
}

export function applyXBindColon(el: HTMLElement, store: any, props: any) {

  [...el.attributes].forEach(attr => {
    if (attr.name.startsWith('x-bind:')) {
      const attrName = attr.name.split(':')[1];
      store.watch(() => {
        const val = safeEval(attr.value, store.state, props);
        if (val === false || val == null) {
          el.removeAttribute(attrName);
        } else {
          el.setAttribute(attrName, String(val));
        }
      });
    }
  });
}





const INTERPOLATION_REGEX = /\{\{\s*(.*?)\s*\}\}/g;

export function interpolateBindings(root: HTMLElement | DocumentFragment | any, store: any, props: any = {}) {
  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE && INTERPOLATION_REGEX.test(node.textContent || '')) {
      const rawText = node.textContent!;
      const expressions = [...rawText.matchAll(INTERPOLATION_REGEX)];

      const render = () => {
        let newText = rawText;
        for (const match of expressions) {
          const expr = match[1];
          try {
            const result = safeEval(expr, store.state, props);
            newText = newText.replace(match[0], result ?? '');
          } catch (e) {
            console.warn(`Interpolation error in "${expr}":`, e);
          }
        }
        node.textContent = newText;
      };

      render();
      store.watch(render);
    }

    // Attribute interpolation
    if (node instanceof HTMLElement) {
      for (const attr of [...node.attributes]) {
        if (INTERPOLATION_REGEX.test(attr.value)) {
          const rawVal = attr.value;
          const renderAttr = () => {
            let newVal = rawVal;
            for (const match of rawVal.matchAll(INTERPOLATION_REGEX)) {
              const expr = match[1];
              try {
                const result = safeEval(expr, store.state, props);
                newVal = newVal.replace(match[0], result ?? '');
              } catch (e) {
                console.warn(`Attr interpolation error in "${expr}":`, e);
              }
            }
            node.setAttribute(attr.name, newVal);
          };
          renderAttr();
          store.watch(renderAttr);
        }
      }
    }

    // Process children recursively (except x-for)
    if (node instanceof Element && !node.hasAttribute('x-for')) {
      [...node.childNodes].forEach(processNode);
    }
  };

  [...root.childNodes].forEach(processNode);
}
