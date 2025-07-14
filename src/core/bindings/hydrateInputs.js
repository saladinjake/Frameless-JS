export function hydrateInputsBindings(key, value, setValue) {
  const inputEls = document.querySelectorAll(`[data-model="${key}"]`);

  inputEls.forEach((input) => {
    // Initial value
    input.value = value;

    // Update on user input
    input.addEventListener('input', (e) => {
      setValue(e.target.value);
    });

    // Reflect changes from code (reactivity)
    const updateInput = (val) => {
      if (input.value !== val) {
        input.value = val;
      }
    };

    // Custom subscription for reactivity
    requestAnimationFrame(() => {
      updateInput(value);
    });
  });
}
