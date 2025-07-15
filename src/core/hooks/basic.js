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

// reactivity
let currentComponent = null;
function createStore(initialState) {
  const subscribers = new Map();
  const state = new Proxy(
    { ...initialState },
    {
      set(target, key, value) {
        if (target[key] !== value) {
          target[key] = value;
          if (subscribers.has(key)) {
            for (const fn of subscribers.get(key)) fn(value);
          }
        }
        return true;
      },
    },
  );
  const subscribe = (key, fn) => {
    if (!subscribers.has(key)) subscribers.set(key, []);
    subscribers.get(key).push(fn);
    fn(state[key]);
  };
  return { state, subscribe };
}

// ✅ Hook: useState
function useState(initial) {
  const id = currentComponent.hookIndex++;
  if (!currentComponent.hooks[id]) {
    const store = createStore({ value: initial });
    currentComponent.hooks[id] = store;
  }
  const hook = currentComponent.hooks[id];
  return [() => hook.state.value, (val) => (hook.state.value = val)];
}

// Hook: useEffect
function useEffect(effectFn, deps) {
  const id = currentComponent.hookIndex++;
  const hasChanged =
    !currentComponent.hooks[id] ||
    deps.some((dep, i) => dep !== currentComponent.hooks[id][1][i]);

  if (hasChanged) {
    currentComponent.hooks[id] = [effectFn(), deps];
  }
}

// Hook: useBind
function useBind(el, valueGetter, setValue) {
  el.value = valueGetter();
  el.addEventListener('input', (e) => setValue(e.target.value));

  // Subscribe to changes and update input
  useEffect(() => {
    const value = valueGetter();
    el.value = value;
  }, [valueGetter()]);
}

// Mini render system
function render(componentFn, root) {
  currentComponent = { hooks: [], hookIndex: 0 };
  root.innerHTML = '';
  const dom = componentFn();
  root.appendChild(dom);
}

// ✅ Example Component
function App() {
  const [getName, setName] = useState('Victor');

  const container = document.createElement('div');

  const input = document.createElement('input');
  useBind(input, getName, setName);

  const output = document.createElement('p');
  useEffect(() => {
    output.textContent = `Hello, ${getName()}!`;
  }, [getName()]);

  container.appendChild(input);
  container.appendChild(output);
  return container;
}

// ✅ Mount App
render(App, document.getElementById('app'));
