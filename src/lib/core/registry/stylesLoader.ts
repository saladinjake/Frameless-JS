// my-lib/styleLoader.ts
import { getRegistry } from './registry';

export async function loadStyle(path: string): Promise<void> {
    try {
        // Attempt to load from public folder
        const res = await fetch(path);
        if (!res.ok) throw new Error('Not found in public');
        const css = await res.text();

        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    } catch (e) {
        const { styles } = getRegistry();
        let normalized = path.startsWith('/src') ? path : `/src/${path}`;
        const candidates = [`${normalized}`, `${normalized}.css`];

        for (const candidate of candidates) {
            const loader = styles[candidate];
            if (loader) {
                const mod = await loader();
                const css = typeof mod === 'string' ? mod : mod.default;

                const style = document.createElement('style');
                style.textContent = css;
                document.head.appendChild(style);
                return;
            }
        }

        throw new Error(`[Framework] Style not found: ${path}`);
    }
}
