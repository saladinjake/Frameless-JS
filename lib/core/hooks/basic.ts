// type Subscriber<T> = (value: T) => void;

export function useStore<T extends Record<string, any>>(initialState: T) {
  const subscribers = new Map<keyof T, ((value: T[keyof T]) => void)[]>();
  const rawState = { ...initialState } as T;

  const notify = (key: keyof T) => {
    const fns = subscribers.get(key) || [];
    fns.forEach(fn => fn(state[key]));
  };



  const state: any = new Proxy(rawState, {
    get(target, prop, receiver) {
      if (typeof prop === 'string' && prop in target) {
        return target[prop as keyof T];
      }
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      if (typeof prop === 'string' && prop in target) {
        const key = prop as keyof T;
        if (target[key] !== value) {
          target[key] = value;
          notify(key);
        }
        return true;
      }
      return Reflect.set(target, prop, value, receiver);
    },
  });

  return {
    state,
    setState<K extends keyof T>(key: K, val: T[K]) {
      state[key] = val;
    },
    subscribe<K extends keyof T>(key: K, fn: any /*(val: T[K]) => void | any*/) {
      if (!subscribers.has(key)) subscribers.set(key, []);
      subscribers.get(key)!.push(fn);
      fn(state[key]); // initial run
    },
    watch(fn: () => void) {
      fn(); // initial run
      Object.keys(state).forEach((key) => {
        this.subscribe(key as keyof T, () => fn());
      });
    },

    migrateKeyIfNeeded(expectedKey: any) {
      if ('value' in state && !(expectedKey in state)) {
        // Migrate
        state[expectedKey] = state['value'];
        delete state['value'];

        // Move subscribers
        const subs = subscribers.get('value' as keyof T);
        if (subs) {
          subscribers.set(expectedKey as keyof T, subs);
          subscribers.delete('value' as keyof T);
        }

        // Notify new key
        notify(expectedKey as keyof T);

        console.warn(`[useStore] Migrated 'value' → '${expectedKey}' for better dev ergonomics.`);
      }
    }


  };
}






type Listener<T> = (value: T) => void;

type StoreState<T> = {
  [K in keyof T]: T[K];
};

type Store<T> = {
  state: StoreState<T>;
  setState<K extends keyof T>(key: K, value: T[K]): void;
  getState<K extends keyof T>(key: K): T[K];
  subscribe<K extends keyof T>(key: K, callback: Listener<T[K]>): void;
  unsubscribe<K extends keyof T>(key: K, callback: Listener<T[K]>): void;
};

export function createStore<T extends Record<string, any>>(initialState: T): Store<T> {
  const state = { ...initialState } as StoreState<T>;
  const listeners: Partial<{ [K in keyof T]: Listener<T[K]>[] }> = {};

  function notify<K extends keyof T>(key: K): void {
    const currentListeners = listeners[key];
    if (currentListeners) {
      for (const fn of currentListeners) {
        fn(state[key]);
      }
    }
  }

  return {
    state,

    setState<K extends keyof T>(key: K, value: T[K]): void {
      if (state[key] !== value) {
        state[key] = value;
        notify(key);
      }
    },

    getState<K extends keyof T>(key: K): T[K] {
      return state[key];
    },

    subscribe<K extends keyof T>(key: K, callback: Listener<T[K]>): void {
      if (!listeners[key]) {
        listeners[key] = [];
      }
      listeners[key]!.push(callback);
      callback(state[key]);
    },

    unsubscribe<K extends keyof T>(key: K, callback: Listener<T[K]>): void {
      const currentListeners = listeners[key];
      if (currentListeners) {
        listeners[key] = currentListeners.filter(fn => fn !== callback);
      }
    }
  };
}





//const store = makeReactive({ count: 0, show: true })
const dependencyMap = new WeakMap<object, Map<string, Set<() => void>>>();

export function makeReactive<T extends object>(obj: T): T {
  return new Proxy(obj, {
    get(target, key: string) {
      if (currentWatcher) {
        trackDependency(target, key, currentWatcher);
      }
      return Reflect.get(target, key);
    },
    set(target, key: string, value) {
      const result = Reflect.set(target, key, value);
      triggerDependency(target, key);
      return result;
    },
  });
}

let currentWatcher: (() => void) | null = null;

function trackDependency(target: object, key: string, watcher: () => void) {
  if (!dependencyMap.has(target)) dependencyMap.set(target, new Map());
  const deps = dependencyMap.get(target)!;
  if (!deps.has(key)) deps.set(key, new Set());
  deps.get(key)!.add(watcher);
}

function triggerDependency(target: object, key: string) {
  const deps = dependencyMap.get(target)?.get(key);
  deps?.forEach((watcher) => watcher());
}

export function watch(fn: () => void) {
  const runner = () => {
    currentWatcher = runner;
    fn();
    currentWatcher = null;
  };
  runner();
}




type Callback<T> = (val: T) => void;

export function usePropsStore<T extends Record<string, any>>(initial: Partial<T> = {}, fallback: T) {
  const listeners = new Map<keyof T, Callback<T[keyof T]>[]>();

  const notify = (key: keyof T, val: T[keyof T]) => {
    (listeners.get(key) || []).forEach((cb) => cb(val));
  };

  const rawState: T = { ...fallback, ...initial } as T;

  const state = new Proxy(rawState, {
    set(target: T, prop: string | symbol, value: any, receiver: any): boolean {
      console.log(receiver)
      if (typeof prop === 'string' && Object.prototype.hasOwnProperty.call(target, prop)) {
        const key = prop as keyof T;
        if (target[key] !== value) {
          target[key] = value;
          notify(key, value);
        }
      }
      return true;
    },
  });

  const subscribe = <K extends keyof T>(key: K, cb: Callback<T[K]> | any) => {
    if (!listeners.has(key)) listeners.set(key, []);
    listeners.get(key)!.push(cb);
    cb(state[key]); // initial emit
  };

  const bindings: {
    [K in keyof T]: (val?: T[K]) => T[K];
  } = {} as any;

  for (const key of Object.keys(state) as (keyof T)[]) {
    bindings[key] = (val?: T[typeof key]) => {
      if (val !== undefined) state[key] = val;
      return state[key];
    };
  }

  return { state, subscribe, bindings };
}




export function bind<T extends Record<string, any>>(store: {
  state: T | any;
  subscribe: <K extends keyof T>(key: K, cb: (val: T[K]) => void) => void;
}) {
  document.querySelectorAll<HTMLInputElement>('[data-bind], [data-model]').forEach((el) => {
    const key = el.getAttribute('data-bind') || el.getAttribute('data-model');
    if (!key) return;

    el.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      store.state[key] = target.value;
    });

    store.subscribe(key, (val) => {
      if (el.value !== val) el.value = val;
    });
  });

  document.querySelectorAll<HTMLElement>('[data-bind-text]').forEach((el) => {
    const key = el.getAttribute('data-bind-text');
    if (!key) return;

    store.subscribe(key, (val) => {
      el.textContent = val;
    });
  });
}




export function setupReactivity<T extends Record<string, any>>(
  store: {
    state: T;
    setState: <K extends keyof T>(key: K, val: T[K]) => void;
    subscribe: <K extends keyof T>(key: K, cb: (val: T[K]) => void) => void;
  },
  root: HTMLElement | Document = document
) {
  const all = (sel: string) => root.querySelectorAll<HTMLElement>(sel);

  all('[data-bind], [data-model]').forEach((el) => {
    const key = el.getAttribute('data-bind') || el.getAttribute('data-model');
    if (!key) return;

    const inputEl = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const type = inputEl.getAttribute('type');

    // --- INIT VALUE ---
    if (store.state[key] === undefined || store.state[key] === null) {
      let initialVal: any;

      if (type === 'checkbox') {
        initialVal = (inputEl as HTMLInputElement).checked;
      } else if (type === 'radio') {
        if ((inputEl as HTMLInputElement).checked) {
          initialVal = inputEl.value;
        }
      } else if (inputEl instanceof HTMLSelectElement && inputEl.multiple) {
        initialVal = Array.from(inputEl.selectedOptions).map(opt => opt.value);
      } else {
        initialVal = inputEl.value;
      }

      store.setState(key, initialVal);
      console.warn(`[setupReactivity] [hydrate] "${key}" missing in store, initialized from DOM:`, initialVal);
    } else {
      hydrateInputValue(inputEl, store.state[key]);
    }

    // --- DOM → STATE ---
    inputEl.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      let val: any;

      if (type === 'checkbox') {
        val = (target as HTMLInputElement).checked;
      } else if (type === 'radio') {
        if ((target as HTMLInputElement).checked) {
          val = target.value;
        } else return;
      } else if (target instanceof HTMLSelectElement && target.multiple) {
        val = Array.from(target.selectedOptions).map(opt => opt.value);
      } else {
        val = target.value;
      }

      store.setState(key, val);
    });

    // --- STATE → DOM ---
    store.subscribe(key, (val: any) => {
      if (!inputEl) return;
      updateInputValue(inputEl, val);
    });
  });

  all('[data-bind-text]').forEach((el) => {
    const key = el.getAttribute('data-bind-text');
    if (!key) return;
    store.subscribe(key, (val: any) => {
      el.textContent = val ?? '';
    });
  });

  all('[data-bind-attr]').forEach((el) => {
    const pairs = el.getAttribute('data-bind-attr')?.split(',') ?? [];
    pairs.forEach((pair) => {
      const [attr, key] = pair.trim().split(':').map((x) => x.trim());
      if (!attr || !key) return;
      store.subscribe(key, (val: any) => el.setAttribute(attr, val));
    });
  });
}

function hydrateInputValue(
  el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  val: any
) {
  const type = el.getAttribute('type');

  if (type === 'checkbox') {
    (el as HTMLInputElement).checked = Boolean(val);
  } else if (type === 'radio') {
    (el as HTMLInputElement).checked = el.value === val;
  } else if (el instanceof HTMLSelectElement && el.multiple) {
    Array.from(el.options).forEach(opt => {
      opt.selected = Array.isArray(val) && val.includes(opt.value);
    });
  } else {
    el.value = val ?? '';
  }
}

function updateInputValue(
  el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  val: any
) {
  const type = el.getAttribute('type');

  if (type === 'checkbox') {
    const input = el as HTMLInputElement;
    if (input.checked !== Boolean(val)) {
      input.checked = Boolean(val);
    }
  } else if (type === 'radio') {
    const input = el as HTMLInputElement;
    input.checked = input.value === val;
  } else if (el instanceof HTMLSelectElement && el.multiple) {
    Array.from(el.options).forEach(opt => {
      opt.selected = Array.isArray(val) && val.includes(opt.value);
    });
  } else {
    if (el.value !== val) {
      el.value = val ?? '';
    }
  }
}


type Props = Record<string, any>;
// type State = Record<string, any>;



type WatchEffectArgs = {
  props: Record<string, any>;
  store: any;
  callback: (ctx: { props: Record<string, any>; state: Record<string, any> }) => void;
};

export function watchEffect<T extends Record<string, any>>({
  props = {},
  store,
  callback,
}: {
  props: Props;
  store: {
    state: T;
    subscribe: <K extends keyof T>(key: K, cb: () => void) => void;
  } | any;
  callback: (args: { props: Props; state: T }) => void;
} | WatchEffectArgs) {
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

  Object.keys(store.state).forEach((key) => {
    store.subscribe(key, checkForChanges);
  });

  callback({ props, state: store.state });
}
