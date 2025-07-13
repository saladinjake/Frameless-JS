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

export function useSignal(initialValue) {
  return createSignal(initialValue); // returns [get, set, subscribe]
}
