export const componentRegistry = new Map();

export function defineComponent(name: string, loaderFn: any) {
  componentRegistry.set(name, { lazy: loaderFn });
}

// my-lib/registry.ts

export type FileRegistry = Record<string, () => Promise<any>>;

let _registry: {
  scripts: FileRegistry;
  templates: FileRegistry;
  styles: FileRegistry;
} = {
  scripts: {},
  templates: {},
  styles: {},
};

export function configureRegistry({
  scripts,
  templates,
  styles,
}: Partial<typeof _registry>) {
  if (scripts) _registry.scripts = scripts;
  if (templates) _registry.templates = templates;
  if (styles) _registry.styles = styles;
}

export function getRegistry() {
  return _registry;
}
