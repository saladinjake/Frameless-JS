export function useDomRefs(scope = document) {
  const refs = {};
  const elements = scope.querySelectorAll('[id]');
  elements.forEach((el) => (refs[el.id] = el));

  return {
    refs,
    $: (id) => scope.getElementById?.(id) || scope.querySelector?.(`${id}`),
  };
}
