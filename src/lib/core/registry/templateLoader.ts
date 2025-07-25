
import { getRegistry } from './registry';

export async function loadTemplate(path: string): Promise<string> {
    try {
        // Attempt to load from public folder
        const res = await fetch(path);
        if (!res.ok) throw new Error('Not found in public');
        return await res.text();
    } catch (e) {
        console.warn(`[TemplateLoader] Falling back to src for: ${path}`);

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
}




