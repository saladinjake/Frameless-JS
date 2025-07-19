import { getNestedValue } from '../utils';
// Utility for deep property access
export function getDeep<T = any>(obj: Record<string, any>, path: string): T | undefined | any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

// Utility for deep property setting
export function setDeep(obj: Record<string, any>, path: string, value: any): void {
  const parts = path.split('.');
  const last = parts.pop();
  if (!last) return;

  const target = parts.reduce((acc, part) => {
    if (acc[part] === undefined) acc[part] = {};
    return acc[part];
  }, obj);

  target[last] = value;
}

// Hydrate inputs using deep paths from a state object (e.g., two-way binding)
export function hydrateInputsBindings(
  key: string,
  valueObj: Record<string, any>,
  setter: (updatedValue: Record<string, any>) => void
): void {
  const inputs = document.querySelectorAll<HTMLInputElement>(`[data-model="${key}"]`);
  inputs.forEach((input) => {
    const val = getDeep<string>(valueObj, key) ?? '';
    if (input.value !== val) input.value = val;

    const update = (e: Event) => {
      const newVal = (e.target as HTMLInputElement).value;
      setDeep(valueObj, key, newVal);
      setter({ ...valueObj }); // ensure state change is detected
    };

    input.removeEventListener('input', update); // prevent duplicates
    input.addEventListener('input', update);
  });
}

// A simpler one-way hydration (state → input), with setter triggered on input
export function hydrateInputs(
  keyPath: string,
  state: () => Record<string, any>,
  setter: (val: string) => void,
  root: Document | HTMLElement = document
): void {
  const inputs = root.querySelectorAll<HTMLInputElement>(`[data-model="${keyPath}"]`);
  const value = getNestedValue(state(), keyPath);

  inputs.forEach((input) => {
    if (input.value !== value) input.value = value;

    input.addEventListener('input', (e: Event) => {
      const newVal = (e.target as HTMLInputElement).value;
      setter(newVal);
    });
  });
}
