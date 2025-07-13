import { createSignal } from './useSignals';
// const stores = {};
const storeRegistry = new Map();
export function useStore(key, initialValue) {
  // if (!stores[key]) {
  //   let state = { ...initial };
  //   const listeners = new Set();
  //   stores[key] = {
  //     get: () => state,
  //     set: (newVal) => {
  //       state = { ...state, ...newVal };
  //       listeners.forEach((fn) => fn());
  //     },
  //     subscribe: (fn) => {
  //       listeners.add(fn);
  //       return () => listeners.delete(fn);
  //     },
  //   };
  // }
  // const store = stores[key];
  // return [store.get, store.set, store.subscribe];

  if (!storeRegistry.has(key)) {
    storeRegistry.set(key, createSignal(initialValue));
  }
  return storeRegistry.get(key); // returns [get, set, subscribe]
}
