export function getNestedValue(obj, keyPath) {
  return keyPath.split('.').reduce((acc, key) => acc?.[key], obj);
}
export function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const nested = keys.reduce((acc, key) => {
    acc[key] = acc[key] || {};
    return acc[key];
  }, obj);
  nested[last] = value;
}

export function bindPropsToStore(instance) {
  if (!instance?.props || !instance?.store) return;

  if (!instance.bindings) instance.bindings = {};

  for (const key of Object.keys(instance.props)) {
    if (!(key in instance.bindings)) {
      instance.bindings[key] = (val) => {
        if (val !== undefined) instance.store.state[key] = val;
        return instance.store.state[key];
      };
    }
  }
}

export function syncStoreAndProps(store, props = {}, delay = 3000) {
  if (!store?.state) return;

  setTimeout(() => {
    // Sync from props → store
    for (const key in props) {
      if (!(key in store.state)) {
        store.state[key] = props[key];
      }
    }

    // Sync from store → props
    for (const key in store.state) {
      if (!(key in props)) {
        props[key] = store.state[key];
      }
    }
  }, delay);
}

export function syncPropsToStore(instance, props = {}) {
  if (!instance?.store?.state) return;

  const state = instance.store.state;
  instance.__syncedKeys = instance.__syncedKeys || new Set();

  for (const [key, value] of Object.entries(props)) {
    const current = state[key];

    if (
      value !== undefined &&
      current !== value &&
      !instance.__syncedKeys.has(key)
    ) {
      state[key] = value;
      instance.__syncedKeys.add(key);
      console.log(` [sync] ${key} =`, value);
    } else {
      console.log(`[skip sync] ${key} already set or undefined`);
    }
  }
}

export function setupBindingReactivity(store, rootEl) {
  store.subscribe((state) => {
    const elements = rootEl.querySelectorAll('[data-bind], [data-model]');

    elements.forEach((el) => {
      const key = el.getAttribute('data-bind') || el.getAttribute('data-model');
      const value = state[key];

      // Update inputs
      if (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.tagName === 'SELECT'
      ) {
        if (el.value !== value) {
          el.value = value ?? '';
        } else {
          console.log(el.value, value);
        }
      } else {
        // Update innerText for others
        if (el.textContent !== value) {
          el.textContent = value ?? '';
        } else {
          console.log(el.value, value, 'inner text');
        }
      }
    });
  });
}

export function setupModelBinding(store, rootEl) {
  const inputs = rootEl.querySelectorAll('[data-model]');
  inputs.forEach((el) => {
    const key = el.getAttribute('data-model');
    el.addEventListener('input', (e) => {
      store.setState(key, el.value);
    });
  });
}
