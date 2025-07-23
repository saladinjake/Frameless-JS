type Subscriber<T> = (value: T) => void;

export function useStore<T extends Record<string, any>>(initialState: T) {
  const subscribers = new Map<keyof T, Subscriber<T[keyof T]>[]>();

  const notify = (key: keyof T) => {
    const fns = subscribers.get(key) || [];
    fns.forEach((fn) => fn(state[key]));
  };

  const rawState = { ...initialState } as T;

  const state = new Proxy(rawState, {
    get(target, prop: string | symbol, receiver: any) {
      if (typeof prop === 'string' && prop in target) {
        return target[prop as keyof T];
      }
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop: string | symbol, value: any, receiver: any) {
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
    subscribe<K extends keyof T>(key: K, fn: Subscriber<T[K] | any>) {
      if (!subscribers.has(key)) subscribers.set(key, []);
      subscribers.get(key)!.push(fn);
      fn(state[key]); // initial emit
    },
  };
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
    setState: <K extends keyof T>(key: K, val: T[K]) => void | any;
    subscribe: <K extends keyof T>(key: K, cb: (val: T[K]) => void) => void;
  } | any,
  root: HTMLElement | Document = document
) {
  const all = (sel: string) => root.querySelectorAll<HTMLElement>(sel);

  // Handle text/select inputs via data-bind / data-model
  all('[data-bind], [data-model]').forEach((el) => {
    const key = el.getAttribute('data-bind') || el.getAttribute('data-model');
    if (!key) return;

    // Init value on load
    if ((el as HTMLInputElement).value !== store.state[key]) {
      (el as HTMLInputElement).value = store.state[key] ?? '';
    }

    el.addEventListener('input', (e) => {
      const target: any = e.target as HTMLInputElement;
      store.setState(key, target.value);
    });

    store.subscribe(key, (val: any) => {
      if ((el as HTMLInputElement).value !== val) {
        (el as HTMLInputElement).value = val ?? '';
      }
    });
  });

  // Handle text content updates
  all('[data-bind-text]').forEach((el) => {
    const key = el.getAttribute('data-bind-text');
    if (!key) return;

    store.subscribe(key, (val: any) => {
      el.textContent = val ?? '';
    });
  });

  // Handle dynamic attributes
  all('[data-bind-attr]').forEach((el) => {
    const pairs = el.getAttribute('data-bind-attr')?.split(',') ?? [];
    pairs.forEach((pair) => {
      const [attr, key] = pair.trim().split(':').map((x) => x.trim());
      store.subscribe(key, (val: any) => el.setAttribute(attr, val));
    });
  });

  // // File input support (data-file)
  all('[data-file]').forEach((el) => {
    const key = el.getAttribute('data-file');
    if (!key) return;

    const input = el as HTMLInputElement;

    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const file: any = target.files?.[0] || null;
      store.setState(key, file);
    });

    store.subscribe(key, (val: File | null) => {
      // You can't programmatically set input.files for security reasons
      // Optional: Update filename preview
      const label = root.querySelector<HTMLElement>(`[data-file-label="${key}"]`);
      if (label) {
        label.textContent = val?.name || 'No file selected';
      }
    });
  });


  // Drag and drop support
  all('[data-dropzone]').forEach((dropzone) => {
    const key = dropzone.getAttribute('data-dropzone');
    if (!key) return;

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-over');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      const file : any = e.dataTransfer?.files?.[0] ?? null;
      if (file) store.setState(key, file);
    });
  });

  // Image preview
  all('[data-preview]').forEach((el) => {
    const key = el.getAttribute('data-preview');
    if (!key) return;

    const img = el as HTMLImageElement;
    store.subscribe(key, (val: any) => {
      if (val instanceof File) {
        const url = URL.createObjectURL(val);
        img.src = url;
      } else if (typeof val === 'string') {
        img.src = val;
      } else {
        img.removeAttribute('src');
      }
    });
  });
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
}  |  WatchEffectArgs) {
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
