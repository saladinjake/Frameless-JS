export function useStore(initial) {
  const listeners = new Map();

  const notify = (key, value) => {
    const cbs = listeners.get(key);
    if (cbs) cbs.forEach((cb) => cb(value));
  };

  const state = new Proxy(
    { ...initial },
    {
      set(target, key, value) {
        if (target[key] !== value) {
          target[key] = value;
          notify(key, value);
        }
        return true;
      },
    },
  );

  const subscribe = (key, cb) => {
    if (!listeners.has(key)) listeners.set(key, []);
    listeners.get(key).push(cb);
    cb(state[key]); // initial update
  };

  return { state, subscribe };
}

// Bind input and text nodes
export function bind(store) {
  document.querySelectorAll('[data-bind]').forEach((el) => {
    const key = el.getAttribute('data-bind');

    // input → state
    el.addEventListener('input', (e) => {
      store.state[key] = e.target.value;
    });

    // state → input
    store.subscribe(key, (val) => {
      if (el.value !== val) el.value = val;
    });
  });

  document.querySelectorAll('[data-bind-text]').forEach((el) => {
    const key = el.getAttribute('data-bind-text');

    // state → text content
    store.subscribe(key, (val) => {
      el.textContent = val;
    });
  });
}
