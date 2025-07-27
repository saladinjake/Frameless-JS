import { getRegistry } from './registry';
/*
usage

export const routes = [
  {
    path: 'home',
    view: () => loadTemplate('./views/home'), // can omit extension
    layout: () => loadTemplate(['./views/layouts/default']),
    styles: [
      '.some-class { background: red; }',           // raw CSS
      'styles/home',                                // path without ext
      'styles/extra.css',                           // path with ext
    ],
    scripts: ['modules/home']
  }
];


*/

const EXTENSIONS = ['.html', '.tpl', '.partial', '.partials']; // accepts any of these ext

function generateCandidates(path: string): string[] {
  const hasExt = /\.\w+$/.test(path);
  const clean = path.replace(/\.(html|tpl|partial|partials)$/, '');
  return hasExt ? [path] : EXTENSIONS.map(ext => `${clean}${ext}`);
}

async function tryFetch(candidate: string): Promise<string | null> {
  try {
    const res = await fetch(candidate);
    if (res.ok) return await res.text();
  } catch {
    // ignore
  }
  return null;
}

async function tryImport(candidate: string): Promise<string | null> {
  const { templates } = getRegistry();
  const key = candidate.startsWith('/src') ? candidate : `/src/${candidate}--`;
  const loader = templates[key];
  if (loader) {
    const mod = await loader();
    return typeof mod === 'string' ? mod : mod.default;
  }
  return null;
}

export async function loadTemplate(pathOrPaths: string | string[]): Promise<string> {
  const paths = Array.isArray(pathOrPaths) ? pathOrPaths : [pathOrPaths];
  const merged: string[] = [];

  for (const basePath of paths) {
    const candidates = generateCandidates(basePath);

    let content: string | null = null;

    // Try fetch first
    for (const candidate of candidates) {
      content = await tryFetch(candidate);
      if (content) break;
    }

    // If not found, try import fallback
    if (!content) {
      for (const candidate of candidates) {
        content = await tryImport(candidate);
        if (content) break;
      }
    }

    if (!content) {
      throw new Error(`[Framework] Template not found: ${basePath}`);
    }

    merged.push(content);
  }

  return merged.join('\n');
}
