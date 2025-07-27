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

const STYLE_EXTENSIONS = ['.css', '.scss', '.postcss'];

function generateStyleCandidates(path: string): string[] {
  const hasExt = /\.\w+$/.test(path);
  const clean = path.replace(/\.(css|scss|postcss)$/, '');
  return hasExt ? [path] : STYLE_EXTENSIONS.map(ext => `${clean}${ext}`);
}

async function tryStyleFetch(candidate: string): Promise<string | null> {
  try {
    const res = await fetch(candidate);
    if (res.ok) return await res.text();
  } catch {
    // Silent fail
  }
  return null;
}

async function tryStyleImport(candidate: string): Promise<string | null> {
  const { styles } = getRegistry();
  const key = candidate.startsWith('/src') ? candidate : `/src/${candidate}`;
  const loader = styles[key];
  if (loader) {
    const mod = await loader();
    return typeof mod === 'string' ? mod : mod.default;
  }
  return null;
}

export async function loadStyle(paths: string | string[]): Promise<void> {
  const styleItems = Array.isArray(paths) ? paths : [paths];
  let combinedCSS = '';

  for (const item of styleItems) {
    // Handle direct raw CSS (e.g., `.my-class {}`)
    if (/[{].+[}]/.test(item.trim()) && !item.includes('/') && !item.includes('\\')) {
      combinedCSS += item + '\n';
      continue;
    }

    const candidates = generateStyleCandidates(item);
    let css: string | null = null;

    // Try fetching from public path
    for (const candidate of candidates) {
      css = await tryStyleFetch(candidate);
      if (css) break;
    }

    // Fallback to module import (via registry)
    if (!css) {
      for (const candidate of candidates) {
        css = await tryStyleImport(candidate);
        if (css) break;
      }
    }

    if (!css) {
      throw new Error(`[Framework] Style not found: ${item}`);
    }

    combinedCSS += css + '\n';
  }

  // Inject combined CSS
  if (combinedCSS.trim()) {
    const styleEl = document.createElement('style');
    styleEl.textContent = combinedCSS;
    document.head.appendChild(styleEl);
  }
}
