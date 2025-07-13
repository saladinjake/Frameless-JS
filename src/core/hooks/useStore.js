const store = new Map();

export function useStore(key, defaultValue = {}) {
  if (!store.has(key)) {
    store.set(key, { ...defaultValue });
  }

  const get = () => store.get(key);
  const set = (value) => {
    store.set(key, { ...store.get(key), ...value });
  };

  return [get, set];
}
