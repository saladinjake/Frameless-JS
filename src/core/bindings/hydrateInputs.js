import { getDeep, setDeep } from '../hooks';

import { getNestedValue, setNestedValue } from '../utils/index';

export function hydrateInputsBindings(key, value, setter) {
  const inputs = document.querySelectorAll(`[data-model="${key}"]`);
  inputs.forEach((input) => {
    // Get deep value if needed
    const val = getDeep(value, key) ?? value[key] ?? '';
    input.value = val;

    const update = (e) => {
      const newVal = e.target.value;
      setDeep(value, key, newVal); // update object deeply
      setter(value); // notify store
    };

    input.removeEventListener('input', update);
    input.addEventListener('input', update);
  });
}

export function hydrateInputs(keyPath, state, setter, root = document) {
  const inputs = root.querySelectorAll(`[data-model="${keyPath}"]`);
  inputs.forEach((input) => {
    const value = getNestedValue(state(), keyPath);
    if (input.value !== value) input.value = value;

    input.addEventListener('input', (e) => {
      setter(e.target.value);
    });
  });
}
