import { useStore } from "./basic";


//const [count, setCount] = useState(0);

// console.log(count); // 0

// setCount(prev => prev + 1); // count is now 1
// setCount(42); // count is now 42

// const [obj, setObj] = useState({ x: 1, y: 2 });

// store.watch(() => {
//   console.log('State changed to:', store.state.value);
// });
export function useState<T>(initialValue: T, keyName?: string): [T, (v: T | ((prev: T) => T)) => void, ReturnType<typeof useStore>] {
  const key = keyName || 'value';
  const store = useStore({ [key]: initialValue } as Record<string, T>);

  function setState(next: T | ((prev: T) => T)) {
    const current = store.state[key];
    const resolved = typeof next === 'function' ? (next as (prev: T) => T)(current) : next;
    store.setState(key, resolved);
  }

  return [store.state[key], setState, store];
}



// export function useState<T>(initialValue: T) {
//   const store = useStore({ value: initialValue });

//   function setValue(
//     newValue: T | ((prev: T) => T)
//   ) {
//     const value =
//       typeof newValue === 'function'
//         ? (newValue as (prev: T) => T)(store.state.value)
//         : newValue;

//     store.setState('value', value);
//   }

//   return {
//     get value() {
//       return store.state.value;
//     },
//     setValue,
//     // Optional passthrough for subscription/reactivity
//     subscribe: (fn: (val: T) => void) => store.subscribe('value', fn),
//     watch: store.watch.bind(store)
//   };
// }
