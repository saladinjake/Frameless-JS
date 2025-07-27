// my-lib/moduleLoader.ts
import { getRegistry } from './registry';

export async function loadModule(path: string): Promise<any> {
  const { scripts } = getRegistry();
  let normalized = path.startsWith('/src') ? path : `/src/${path}`;
  const hasExtension = /\.[jt]s$/.test(normalized);
  const candidates = hasExtension
    ? [normalized]
    : [`${normalized}.js`, `${normalized}.ts`];

  for (const candidate of candidates) {
    if (scripts[candidate]) return scripts[candidate]();
  }

  console.error('[Framework] Module candidates not found:', candidates);
  throw new Error(`[Framework] Cannot load module: ${path}`);
}
