type Store<T> = {
  state: T;
  subscribe<K extends keyof T>(key: K, fn: (val: T[K]) => void): void;
  setState<K extends keyof T>(key: K, val: T[K]): void;
};

type Context = Record<string, any>;

export function applyBindings<T extends Record<string, any>>(root: HTMLElement | any, store: Store<T>, extraContext: Context = {}) {
  const evaluate = (expression: string, context: Context) => {
    try {
      const fn = new Function(...Object.keys(context), `return ${expression}`);
      return fn(...Object.values(context));
    } catch (e) {
      console.warn(`Interpolation error in "${expression}":`, e);
      return '';
    }
  };

  // const interpolate = (str: string, context: Context = {}) => {
  //   console.log(str,context,"<<<<")
  //   return str.replace(/\{\{(.+?)\}\}/g, (_, expr) => {
  //     return evaluate(expr.trim(), { ...store.state, ...context });
  //   });
  // };


  function interpolate(str: string, context: Record<string, any> = {}) {
  return str.replace(/\{\{(.+?)\}\}/g, (_, expr) => {
    try {
      const expected = expr.trim(); // what template is trying to access, e.g., 'text'

      const stateKeys = Object.keys(store.state);
      const stateValues = Object.values(store.state);

      let actualKeys = [...Object.keys(context), ...stateKeys];
      let actualValues = [...Object.values(context), ...stateValues];

      // 💡 Migration alias: if store has only `value` but template uses `text`, alias `value -> text`
      if (
        stateKeys.length === 1 &&
        stateKeys[0] === "value" &&
        !(expected in store.state)
      ) {
        // inject alias
        actualKeys.push(expected);
        actualValues.push(store.state.value);

        //  Helpful debug hint for devs
        if (import.meta.env?.DEV || typeof process !== "undefined") {
          console.info(
            `[DevHint] Aliasing 'value' → '${expected}' during interpolation. Consider renaming in store for clarity.`
          );
        }
      }

      const fn = new Function(...actualKeys, `return ${expr};`);
      return fn(...actualValues);
    } catch (err) {
      console.warn("Interpolation error in expression:", expr, err);
      return "";
    }
  });
}

  const bindText = (el: HTMLElement, key: keyof T) => {
    store.subscribe(key, (val) => {
      el.textContent = String(val);
    });
  };

  const bindModel = (el: HTMLInputElement, key: keyof T) => {
    el.value = store.state[key];
    el.addEventListener('input', (e) => {
      store.setState(key, (e.target as any).value);
    });
    store.subscribe(key, (val) => {
      if (el.value !== val) el.value = val;
    });
  };

  const traverse = (el: HTMLElement, context: Context = {}) => {
    if (el.hasAttribute('data-bind-text')) {
      const key = el.getAttribute('data-bind-text') as keyof T;
      bindText(el, key);
    }

    if (el.hasAttribute('data-model')) {
      const key = el.getAttribute('data-model') as keyof T;
      if (el instanceof HTMLInputElement) {
        bindModel(el, key);
      }
    }




    // Interpolation in plain text nodes
    if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
      const originalText = el.textContent || '';
      const mergedContext = { ...context, ...extraContext };
      console.log(originalText, mergedContext,"ABCD")
      if (originalText.includes('{{')) {

        const update = () => {
          el.textContent = interpolate(originalText, mergedContext);
        };

        // watch all store keys to re-evaluate
        for (const key of Object.keys(store.state)) {
          store.subscribe(key as keyof T, update);
        }

        update(); // initial render
      }
    }

    // Handle children
    for (const child of Array.from(el.children)) {
      console.log(child)
      traverse(child as HTMLElement, context);
    }
  };

  traverse(root, extraContext);
}
