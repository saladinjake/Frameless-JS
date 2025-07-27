
import { getRegistry } from './registry';

export async function loadTemplate(path: string): Promise<string> {
  const { templates } = getRegistry();
  let normalized = path.startsWith('/src') ? path : `/src/${path}`;

  const candidates = [`${normalized}`, `${normalized}.html`];

  for (const candidate of candidates) {
    const loader = templates[candidate];
    if (loader) {
      const mod = await loader();
      return typeof mod === 'string' ? mod : mod.default;
    }
  }

  throw new Error(`[Framework] Template not found: ${path}`);
}
