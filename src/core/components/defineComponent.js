const componentRegistry = new Map();

function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // camelCase → kebab-case
    .replace(/[\s_]+/g, '-') // spaces/underscores → dashes
    .toLowerCase();
}

//  Normalize component name to kebab-case before storing
export function defineComponent(name, loaderFn) {
  const key = toKebabCase(name);
  componentRegistry.set(key, loaderFn);
}

//  Normalize tag name to kebab-case before resolving
export function getComponentLoader(tagName) {
  const key = toKebabCase(tagName);

  if (componentRegistry.has(key)) return componentRegistry.get(key);

  // Optional fallback: dynamic import if not registered
  // const loader = () => import(`./components/${key}.js`);
  // componentRegistry.set(key, loader); // cache for next time
  // return loader;
}
