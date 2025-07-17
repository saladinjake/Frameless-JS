// 1. Minimal reactive store
export function useStore(initialState = {}) {
  const subscribers = new Map(); // key → [fns]

  const state = new Proxy(
    { ...initialState },
    {
      get(target, key) {
        return target[key];
      },
      set(target, key, value) {
        if (target[key] !== value) {
          target[key] = value;
          notify(key); // notify per key
        }
        return true;
      },
    },
  );

  function notify(key) {
    const fns = subscribers.get(key) || [];
    fns.forEach((fn) => fn(state[key]));
  }

  return {
    state,
    setState(key, val) {
      state[key] = val;
    },
    subscribe(key, fn) {
      if (!subscribers.has(key)) subscribers.set(key, []);
      subscribers.get(key).push(fn);
      fn(state[key]); // initial emit
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

  all('[data-bind], [data-model]').forEach((el) => {
    const key = el.getAttribute('data-bind') || el.getAttribute('data-model');

    // Input → store
    el.addEventListener('input', (e) => {
      store.setState(key, e.target.value);
    });

    // store → DOM
    store.subscribe(key, (val) => {
      if (el.value !== val) el.value = val ?? '';
    });
  });

  all('[data-bind-text]').forEach((el) => {
    const key = el.getAttribute('data-bind-text');
    store.subscribe(key, (val) => {
      el.textContent = val ?? '';
    });
  });

  all('[data-bind-attr]').forEach((el) => {
    const pairs = el.getAttribute('data-bind-attr').split(',');
    pairs.forEach((pair) => {
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
