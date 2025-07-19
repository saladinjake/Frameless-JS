export const componentRegistry = new Map();

export function defineComponent(name: string, loaderFn: any) {
  componentRegistry.set(name, { lazy: loaderFn });
}
