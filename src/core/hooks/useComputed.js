import { useSignal } from "./hooks/useSignals";
export function useComputed(getters, computeFn) {
  const [value, setValue, subscribe] = useSignal(computeFn());

  const unsub = getters.map(([_, __, sub]) => sub(() => {
    setValue(computeFn());
  }));

  return [value, setValue, () => unsub.forEach(fn => fn())];
}
