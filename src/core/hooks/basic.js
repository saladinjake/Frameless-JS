// 1. Minimal reactive store
export function useStore(initial = {}) {
  const listeners = new Map();

  const notify = (key, val) => {
    (listeners.get(key) || []).forEach((cb) => cb(val));
  };

  const state = new Proxy(
    { ...initial },
    {
      set(target, key, val) {
        if (target[key] !== val) {
          target[key] = val;
          notify(key, val);
        }
        return true;
      },
    },
  );

  const subscribe = (key, cb) => {
    if (!listeners.has(key)) listeners.set(key, []);
    listeners.get(key).push(cb);
    cb(state[key]);
  };

  return { state, subscribe };
}

// 2. Bind input and text nodes
export function bind(store) {
  // data-bind and data-model (two-way input binding)
  document.querySelectorAll('[data-bind], [data-model]').forEach((el) => {
    const key = el.getAttribute('data-bind') || el.getAttribute('data-model');

    el.addEventListener('input', (e) => {
      store.state[key] = e.target.value;
    });

    store.subscribe(key, (val) => {
      if (el.value !== val) el.value = val;
    });
  });

  // text binding
  document.querySelectorAll('[data-bind-text]').forEach((el) => {
    const key = el.getAttribute('data-bind-text');
    store.subscribe(key, (val) => {
      el.textContent = val;
    });
  });
}

export function setupReactivity(store, root = document) {
  const all = (sel) => root.querySelectorAll(sel);

  // Unified: data-bind + data-model
  all('[data-bind], [data-model]').forEach((el) => {
    const key = el.getAttribute('data-bind') || el.getAttribute('data-model');
    el.addEventListener('input', (e) => {
      store.state[key] = e.target.value;
    });
    store.subscribe(key, (val) => {
      if (el.value !== val) el.value = val;
    });
  });

  // Text content binding
  all('[data-bind-text]').forEach((el) => {
    const key = el.getAttribute('data-bind-text');
    store.subscribe(key, (val) => (el.textContent = val));
  });

  // Attribute bindings: data-bind-attr="src:image, alt:desc"
  all('[data-bind-attr]').forEach((el) => {
    const attrMap = el.getAttribute('data-bind-attr').split(',');
    attrMap.forEach((pair) => {
      const [attr, key] = pair.trim().split(':');
      store.subscribe(key, (val) => el.setAttribute(attr, val));
    });
  });
}
