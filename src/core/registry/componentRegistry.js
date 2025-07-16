export const componentRegistry = new Map();

export function defineComponent(name, loaderFn) {
  componentRegistry.set(name, { lazy: loaderFn });
}
