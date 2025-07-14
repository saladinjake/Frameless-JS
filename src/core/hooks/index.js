import { bindText } from '../bindings/index';
import { hydrateInputsBindings } from '../bindings/hydrateInputs';

export function createSignal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  const read = () => value;
  const write = (newValue) => {
    value = typeof newValue === 'function' ? newValue(value) : newValue;
    subscribers.forEach((fn) => fn(value));
  };

  const subscribe = (fn) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  };

  return [read, write, subscribe];
}

export function peekSignal(initialValue) {
  return createSignal(initialValue); // returns [get, set, subscribe]
}

// const stores = {};
const storeRegistry = new Map();
export function peekStore(key, initialValue) {
  if (!storeRegistry.has(key)) {
    storeRegistry.set(key, createSignal(initialValue)); // this  returns [store.get, store.set, store.subscribe];
  }
  return storeRegistry.get(key); // returns [get, set, subscribe]
}

export function peekComputed(getters, computeFn) {
  const [value, setValue, subscribe] = peekSignal(computeFn());

  const unsub = getters.map(([_, __, sub]) =>
    sub(() => {
      setValue(computeFn());
    }),
  );

  return [value, setValue, () => unsub.forEach((fn) => fn())];
}

export function peekDomRefs(scope = document) {
  const refs = {};
  const elements = scope.querySelectorAll('[id]');
  elements.forEach((el) => (refs[el.id] = el));

  return {
    refs,
    $: (id) => scope.getElementById?.(id) || scope.querySelector?.(`${id}`),
  };
}

const cleanupMap = new WeakMap();

export function seekDomWatch(fn, dependencies = []) {
  const cleanups = [];

  dependencies.forEach((dep) => {
    const unsubscribe = dep.subscribe(() => {
      cleanupMap.get(fn)?.(); // run cleanup if exists
      const cleanup = fn();
      if (typeof cleanup === 'function') cleanupMap.set(fn, cleanup);
    });
    cleanups.push(unsubscribe);
  });

  // Initial call
  const cleanup = fn();
  if (typeof cleanup === 'function') cleanupMap.set(fn, cleanup);

  // Return destroy logic
  return () => cleanups.forEach((unsub) => unsub());
}

const watchers = new WeakMap();

export function peekState(initialValue) {
  let value = initialValue;
  const listeners = [];

  function get() {
    return value;
  }

  function set(newVal) {
    value = typeof newVal === 'function' ? newVal(value) : newVal;
    listeners.forEach((fn) => fn(value));
  }

  set.watch = (fn) => listeners.push(fn);
  return [get, set];
}

export function peekDomInputsState(key, initialValue) {
  const [value, setValue, subscribe] = peekSignal(initialValue);

  // Wait till DOM is ready (after template inject)
  requestAnimationFrame(() => {
    const { refs } = peekDomRefs();

    // Bind text content (e.g., <span data-ref="userName">)
    if (refs[key]) {
      bindText(refs[key], value, subscribe);
    }

    // Bind form inputs (e.g., <input data-model="userName" />)
    hydrateInputsBindings(key, value, setValue);
  });

  return [value, setValue];
}

// Store
const globalStore = new Map();

export function peekGlobalStore(namespace, initial = {}) {
  if (!globalStore.has(namespace)) {
    let value = initial;
    const listeners = [];
    globalStore.set(namespace, [
      () => value,
      (v) => {
        value = typeof v === 'function' ? v(value) : v;
        listeners.forEach((fn) => fn(value));
      },
      listeners,
    ]);
  }
  const [get, set, listeners] = globalStore.get(namespace);
  set.watch = (fn) => listeners.push(fn);
  return [get, set];
}
