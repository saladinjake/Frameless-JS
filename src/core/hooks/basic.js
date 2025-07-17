// 1. Minimal reactive store

export function useStore(initialState = {}) {
  const subscribers = new Set();

  const handler = {
    get(target, key) {
      return Reflect.get(target, key);
    },
    set(target, key, value) {
      const updated = Reflect.set(target, key, value);
      if (updated) {
        notify();
      } else {
        console.warn(`[useStore] Failed to set ${key}`);
      }
      return updated;
    },
  };

  const state = new Proxy({ ...initialState }, handler);

  function notify() {
    subscribers.forEach((fn) => {
      if (typeof fn === 'function') {
        fn(state);
      } else {
        console.warn('[useStore] Subscriber is not a function:', fn);
      }
    });
  }

  return {
    state,
    setState(key, value) {
      state[key] = value;
    },
    subscribe(fn) {
      if (typeof fn !== 'function') {
        console.warn('[useStore] Tried to subscribe a non-function:', fn);
        console.trace();
        return () => {};
      }
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}

export function usePropsStore(initial = {}, fallback = {}) {
  const listeners = new Map();

  const notify = (key, val) => {
    (listeners.get(key) || []).forEach((cb) => cb(val));
  };

  // Final initial state (props + fallbacks)
  const rawState = { ...fallback, ...initial };

  const state = new Proxy(rawState, {
    set(target, key, val) {
      if (target[key] !== val) {
        target[key] = val;
        notify(key, val);
      }
      return true;
    },
  });

  const subscribe = (key, cb) => {
    if (!listeners.has(key)) listeners.set(key, []);
    listeners.get(key).push(cb);
    cb(state[key]); // Initial emit
  };

  // Auto-generate bindings for data-model and data-bind-text
  const bindings = {};
  for (const key of Object.keys(state)) {
    bindings[key] = (val) => {
      if (val !== undefined) state[key] = val;
      return state[key];
    };
  }

  return { state, subscribe, bindings };
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
export function watchEffect({ props = {}, store, callback }) {
  if (!store || typeof callback !== 'function') return;

  let lastProps = JSON.stringify(props);
  let lastState = JSON.stringify(store.state);

  const checkForChanges = () => {
    const currentProps = JSON.stringify(props);
    const currentState = JSON.stringify(store.state);

    if (currentProps !== lastProps || currentState !== lastState) {
      lastProps = currentProps;
      lastState = currentState;
      callback({ props, state: store.state });
    }
  };

  // Subscribe to each store key
  Object.keys(store.state).forEach((key) => {
    store.subscribe(key, checkForChanges);
  });

  // Initial run
  callback({ props, state: store.state });
}
