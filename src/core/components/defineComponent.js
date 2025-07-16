const componentRegistry = new Map();

export function defineComponent(name, loaderFn) {
  componentRegistry.set(name.toLowerCase(), loaderFn);
}

export function getComponentLoader(tagName) {
  const key = tagName.toLowerCase();
  if (componentRegistry.has(key)) return componentRegistry.get(key);

  // Auto fallback for unknown tags
  const fileName = key.includes('-') ? key : toKebabCase(key);
  const loader = () => import(`./components/${fileName}.js`);
  componentRegistry.set(key, loader);
  return loader;
}

function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}
