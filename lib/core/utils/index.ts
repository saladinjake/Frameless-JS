// utils/objectHelpers.ts

export function getNestedValue<T = any>(obj: Record<string, any>, keyPath: string): T | undefined {
  return keyPath.split('.').reduce((acc: any, key) => acc?.[key], obj);
}

export function setNestedValue(obj: Record<string, any>, path: string, value: any): void {
  const keys = path.split('.');
  const last = keys.pop();
  const nested = keys.reduce((acc, key) => {
    acc[key] = acc[key] || {};
    return acc[key];
  }, obj);
  if (last) nested[last] = value;
}

// types.ts
interface Store {
  state: Record<string, any>;
}

interface Instance {
  props: Record<string, any>;
  store: Store;
  bindings?: Record<string, (val?: any) => any>;
}

// utils/binding.ts

export function bindPropsToStore(instance: Instance | any): void {
  if (!instance?.props || !instance?.store) return;

  if (!instance.bindings) instance.bindings = {};

  for (const key of Object.keys(instance.props)) {
    if (!(key in instance.bindings)) {
      instance.bindings[key] = (val?: any) => {
        if (val !== undefined) instance.store.state[key] = val;
        return instance.store.state[key];
      };
    }
  }
}

export function syncStoreAndProps(
  store: Store,
  props: Record<string, any> = {},
  delay = 3000
): void {
  if (!store?.state) return;

  setTimeout(() => {
    // Sync from props → store
    for (const key in props) {
      if (!(key in store.state)) {
        store.state[key] = props[key];
      }
    }

    // Sync from store → props
    for (const key in store.state) {
      if (!(key in props)) {
        props[key] = store.state[key];
      }
    }
  }, delay);
}

// utils/moduleLoader.ts

export const loadModule = async (
  path: string,
  basePath?: string
): Promise<any> => {
  const modules: Record<string, () => Promise<any>> = import.meta.glob('/src/**/*.{js,ts}');
console.log(basePath)
  let normalized = path;
  if (!normalized.startsWith('/src')) normalized = `/src/${normalized}`;
  if (!normalized.endsWith('.js')) normalized += '.js';

  const loader = modules[normalized];
  if (!loader) {
    console.error('[Framework] Available:', Object.keys(modules));
    throw new Error(`[Framework] Cannot find module: ${normalized}`);
  }

  return loader();
};
