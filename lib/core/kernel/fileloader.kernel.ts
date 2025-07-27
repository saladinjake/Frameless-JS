


export const loadModule = async (
  path: any,
  basePath?: string
): Promise<any> => {
  const modules: Record<string, () => Promise<any>> = import.meta.glob('/src/**/*.{js,ts}');
console.log(basePath)
  // Normalize input path
  let normalized = path;
  if (!normalized.startsWith('/src')) normalized = `/src/${normalized}`;

  const hasExtension = /\.[jt]s$/.test(normalized);

  // Candidate paths
  const candidates = hasExtension
    ? [normalized]
    : [`${normalized}.js`, `${normalized}.ts`];

  // Try to find a match
  for (const candidate of candidates) {
    const loader = modules[candidate];
    if (loader) {
      return loader();
    }
  }

  console.error('[Framework] Available modules:', Object.keys(modules));
  throw new Error(`[Framework] Cannot find module for path: ${normalized}`);
};
