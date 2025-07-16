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
