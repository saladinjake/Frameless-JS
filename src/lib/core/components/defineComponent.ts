// Component loader function type
type ComponentLoader = () => Promise<any>;

// Registry map for components
const componentRegistry = new Map<string, ComponentLoader>();

// Converts PascalCase or camelCase to kebab-case
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Registers a component loader function under a normalized kebab-case name.
 * 
 * @param name - The component's name (e.g., `MyComponent`).
 * @param loaderFn - A function that returns a dynamic import promise.
 */
export function defineComponent(name: string, loaderFn: ComponentLoader): void {
  const key = toKebabCase(name);
  componentRegistry.set(key, loaderFn);
}

/**
 * Resolves a component loader function by tag name.
 * 
 * @param tagName - The tag name to look up (e.g., `my-component`).
 * @returns The registered loader function, or undefined if not found.
 */
export function getComponentLoader(tagName: string): ComponentLoader | undefined {
  const key = toKebabCase(tagName);

  if (componentRegistry.has(key)) {
    return componentRegistry.get(key);
  }

  // Optional fallback:
  // const loader = () => import(`./components/${key}.js`);
  // componentRegistry.set(key, loader);
  // return loader;

  return undefined;
}
