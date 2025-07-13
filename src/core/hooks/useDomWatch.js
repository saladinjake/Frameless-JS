const cleanupMap = new WeakMap();

export function useDomWatch(fn, dependencies = []) {
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
