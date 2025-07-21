

// Reuse existing regexes
const PARTIAL_TAG_REGEX = /<partial\s+src=["']([^"']+)["']?[^>]*>([\s\S]*?)<\/partial>/gi;
const SLOT_TEMPLATE_REGEX = /<template\s+slot=["']?([\w-]+)["']?>([\s\S]*?)<\/template>/gi;
const SLOT_INNER_REGEX = /<slot(?:\s+name=["']?([\w-]+)["']?)?>([\s\S]*?)<\/slot>/gi;

const partialMap = new Map();

/**
 * Attempts to load a file from the Vite src directory using import.meta.glob
 * @param {string} filename - e.g. "Main.html" or "views/About.html"
 * @returns {Promise<string>} - raw file content
 */
export async function fallbackImportFromSrc(filename: string): Promise<string> {
  const cleanFilename = filename.replace(/^\/+/, '').replace(/^src\//, '');

  const templates: any = import.meta.glob('/src/**/*.{html,txt}', {
    as: 'raw',
    eager: false,
  });

  const candidates = Object.keys(templates);

  // Try to match based on common patterns
  const match = candidates.find(key =>
    key.endsWith(`/${cleanFilename}`) || key.endsWith(`src/${cleanFilename}`) || key.endsWith(cleanFilename)
  );

  if (!match) {
    console.error(`[fallbackImportFromSrc] Not found: '${filename}'`);
    console.error('Searched keys:', candidates);
    throw new Error(`[fallbackImportFromSrc] '${filename}' not found in src`);
  }

  try {
    return await templates[match]();
  } catch (err: any) {
    throw new Error(`[fallbackImportFromSrc] Failed to import '${filename}' from '${match}': ${err.message}`);
  }
}

function normalizePath(path: string) {
  return path.replace(/^\.?\/?/, '').replace(/^src\//, '');
}

async function loadPartialContent(src: string): Promise<string> {
  const key = normalizePath(src);
  if (partialMap.has(key)) return partialMap.get(key)!;

  try {
    const html = await fallbackImportFromSrc(src);
    partialMap.set(key, html);
    return html;
  } catch (err) {
    console.warn(`[resolveContent] Partial load failed: ${src}`, err);
    return `<!-- Failed to load: ${src} -->`;
  }
}

function extractSlotTemplates(html: string): Record<string, string> {
  const slots: Record<string, string> = {};
  let match;
  while ((match = SLOT_TEMPLATE_REGEX.exec(html))) {
    slots[match[1] || 'default'] = match[2].trim();
  }
  return slots;
}

function injectSlots(html: string, slots: Record<string, string>): string {
  return html.replace(SLOT_INNER_REGEX, (_, name, fallback) => {
    const slotName = name || 'default';
    return slots[slotName] || fallback || '';
  });
}

async function resolvePartials(html: string): Promise<string> {
  let match;
  while ((match = PARTIAL_TAG_REGEX.exec(html))) {
    const [fullMatch, src, inner] = match;
    const slots = extractSlotTemplates(inner);

    const rawPartial = await loadPartialContent(src);
    const resolvedPartial = await resolvePartials(rawPartial);
    const withSlots = injectSlots(resolvedPartial, slots);

    html = html.replace(fullMatch, withSlots);
    PARTIAL_TAG_REGEX.lastIndex = 0;
  }
  return html;
}

export function runInlineScripts(el: Element | DocumentFragment) {
  el.querySelectorAll('script').forEach(script => {
    const newScript = document.createElement('script');
    if (script.src) {
      newScript.src = script.src;
    } else {
      newScript.textContent = script.textContent;
    }
    for (const attr of script.attributes) {
      newScript.setAttribute(attr.name, attr.value);
    }
    script.replaceWith(newScript);
  });
}

export function bindModel(container: HTMLElement | DocumentFragment, model: Record<string, any> = {}) {
  container.querySelectorAll('[data-model]').forEach((el: any) => {
    const key = el.dataset.model;
    el.value = model[key] || '';
    el.addEventListener('input', () => {
      model[key] = el.value;
      const refs = container.querySelectorAll(`[data-ref="${key}"]`);
      refs.forEach(ref => (ref.textContent = el.value));
    });
  });
}

export async function resolveContent(
  input: string | (() => Promise<string | { default: string }>) | undefined
): Promise<HTMLElement | DocumentFragment> {
  if (!input) return document.createDocumentFragment();

  let rawHtml: string;

  if (typeof input === 'function') {
    const result = await input();
    rawHtml = typeof result === 'string' ? result : result?.default || '';
  } else if (typeof input === 'string' && /<\/?[a-z][\s\S]*>/i.test(input.trim())) {
    rawHtml = input;
  } else if (typeof input === 'string') {
    try {
      const res = await fetch(input);
      if (!res.ok) throw new Error('Not found in public');
      rawHtml = await res.text();
    } catch {
      try {
        rawHtml = await fallbackImportFromSrc(input);
      } catch (err: any) {
        console.error(err.message);
        throw new Error(`[resolveContent] Cannot resolve: ${input}`);
      }
    }
  } else {
    rawHtml = '';
  }

  //  Process all partials
  const resolvedHtml = await resolvePartials(rawHtml);

  //  Convert string to DOM fragment
  const wrapper = document.createElement('div');
  wrapper.innerHTML = resolvedHtml;
  const fragment = document.createDocumentFragment();
  [...wrapper.childNodes].forEach((node) => fragment.appendChild(node));

  // Scripts and data binding
  runInlineScripts(fragment);
  bindModel(fragment);

  return fragment;
}
