

import { hydrateComponent } from './core/hydrations/hydrateComponent';
import { setupReactivity } from './core/hooks/basic';
import { resolveChildComponents } from './core/components/resolveChildComponent';
import { loadModule } from './core/kernel/fileloader.kernel';
// import { applyBindings } from './core/bindings/interpolationBindings';
// import { processDirectives, interpolateBindings } from './core/directives/processDirectives';
import { bindActionsWithObserver } from './core/bindings/mutationObservers/bindMutations';
import { observeInterpolationBindings } from './core/bindings/mutationObservers/interpolationMutation';

const loadedScriptSrcs = new Set<string>();
const DEFAULT_ROUTE = 'home';
// let currentDestroy
let currentDestroy: (() => void) | null | any = null;
console.log(currentDestroy)

interface Route {
  path: string | RegExp;
  view: string | (() => Promise<string | { default: string }>);
  layout?: string | (() => Promise<string | { default: string }>);
  style?: string | string[];
  styles?: string | string[];
  script?: string | string[];
  scripts?: string | string[];
  scriptBase?: string;
  onLoad?: () => void;
}



declare global {
  interface Window {
    __currentDestroy?: () => void;
  }
}

interface RenderOptions {
  app: HTMLElement;
  route: Route;
  viewHTML: string;
  layoutHTML?: string;
  params: Record<string, any>;
  match?: any
}

function getRouteAndParams(): { path: string; params: Record<string, string> } {
  const hash = decodeURIComponent(location.hash.slice(1));
  const [path = DEFAULT_ROUTE, qs = ''] = hash.split('?');
  const params = Object.fromEntries(new URLSearchParams(qs));
  return { path, params };
}




function matchRoute(path: string, routes: Route[]): { route: Route; match: RegExpMatchArray | null; params: Record<string, string> } | null {
  const tryMatch = (tryPath: string) => {
    for (const route of routes) {
      if (typeof route.path === 'string' && route.path === tryPath) {
        return { route, match: null, params: {} };
      }

      if (typeof route.path === 'string' && route.path.includes(':')) {
        const paramNames: string[] = [];
        const regexStr = route.path
          .split('/')
          .map(part => {
            if (part.startsWith(':')) {
              paramNames.push(part.slice(1));
              return '([^/]+)';
            }
            return part;
          })
          .join('/');
        const regex = new RegExp(`^${regexStr}$`);
        const match = tryPath.match(regex);
        if (match) {
          const params = Object.fromEntries(paramNames.map((key, i) => [key, match[i + 1]]));
          return { route, match, params };
        }
      }

      if (route.path instanceof RegExp) {
        const match = tryPath.match(route.path);
        if (match) return { route, match, params: {} };
      }
    }
    return null;
  };

  let result = tryMatch(path);
  if (result) return result;

  if (path.endsWith('/')) {
    for (const fallback of [`${path}index`, `${path}home`]) {
      result = tryMatch(fallback);
      if (result) return result;
    }
  }

  const fallback = routes.find(r => r.path === '*');
  return fallback ? { route: fallback, match: null, params: {} } : null;
}

// function showLoader(): void {
//   const loader = document.getElementById('loader');
//   if (loader) loader.style.display = 'flex';
// }

// function hideLoader(): void {
//   const loader = document.getElementById('loader');
//   if (loader) loader.style.display = 'none';
// }

function shallowDiffAndPatch(parent: HTMLElement | null | undefined, newChildren: HTMLCollection | Element[] | null | undefined): void {
  if (!parent || !newChildren) {
    console.warn('shallowDiffAndPatch: parent or newChildren is null/undefined');
    return;
  }

  const existing = Array.from(parent.children);
  const incoming = Array.from(newChildren);

  for (let i = 0; i < incoming.length; i++) {
    const newNode = incoming[i];
    const oldNode = existing[i];

    if (!oldNode) {
      parent.appendChild(newNode);
    } else if (!newNode.isEqualNode(oldNode)) {
      parent.replaceChild(newNode, oldNode);
    }
  }

  for (let j = incoming.length; j < existing.length; j++) {
    existing[j].remove();
  }
}


function htmlToDOM(html: string): HTMLElement {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp;
}

function injectSlots(layout: HTMLElement, view: HTMLElement): void {
  const inject = (host: HTMLElement, content: HTMLElement): void => {
    host.querySelectorAll('slot[name]').forEach((slot) => {
      const name = slot.getAttribute('name');
      const tpl = content.querySelector(`template[slot="${name}"]`) as HTMLTemplateElement | null;
      if (tpl) {
        const frag = tpl.content.cloneNode(true) as DocumentFragment;
        injectSlots(frag as unknown as HTMLElement, content);
        slot.replaceWith(frag);
        return;
      }

      const node = content.querySelector(`[slot="${name}"]:not(template)`);
      if (node) slot.replaceWith(node.cloneNode(true));
    });

    const defaultSlot = host.querySelector('slot:not([name])');
    if (defaultSlot) {
      const tpl = content.querySelector('template:not([slot])') as HTMLTemplateElement | null;
      if (tpl) {
        const frag = tpl.content.cloneNode(true);
        injectSlots(frag as unknown as HTMLElement, content);
        defaultSlot.replaceWith(frag);
        return;
      }

      const fallbackNodes = [...content.children].filter(
        el => el.tagName !== 'TEMPLATE' && !el.hasAttribute('slot')
      );
      if (fallbackNodes.length > 0) {
        defaultSlot.replaceWith(...fallbackNodes.map(n => n.cloneNode(true)));
      }
    }
  };

  inject(layout, view);
}

function applyScopedStyle(cssText: string, scopeId: string): void {
  const oldStyle = document.getElementById(scopeId);
  if (oldStyle) oldStyle.remove();

  const style = document.createElement('style');
  style.id = scopeId;
  style.textContent = cssText;
  document.head.appendChild(style);
}

interface ComponentActions {
  template?: string;
  store?: any;
  onMount?: (ctx: any) => void;
  onDestroy?: () => void;
  onPropsChanged?: (ctx: {
    props: Record<string, any>;
    state: any;
    context: any;
  }) => void | Promise<void>;
  [key: string]: any;
}

// type Actions = {
//   store?: ReturnType<typeof useStore>;
//   props?: Record<string, any>;
// };


export async function slotAwareRender({
  app,
  route,
  viewHTML,
  layoutHTML,
  params,
  match = null,
}: RenderOptions): Promise<void> {
  const props = { ...params };
  const baseContext = { app, params, props };
  let actions: ComponentActions = {};
  let module: any;
  console.log(match)

  const viewDOM = htmlToDOM(viewHTML);
  let finalDOM = viewDOM;

  // 1. Handle layout if provided
  if (layoutHTML) {
    const layoutDOM = htmlToDOM(layoutHTML);
    injectSlots(layoutDOM, viewDOM); // inject <slot> with view content
    finalDOM = layoutDOM;
  }

  // 2. Load scoped styles
  const stylePaths = Array.isArray(route.styles || route.style)
    ? (route.styles || route.style)
    : route.style ? [route.style] : [];

 const paths = Array.isArray(stylePaths) ? stylePaths : (stylePaths ? [stylePaths] : []);

for (const path of paths) {
  if (typeof path === "string") {
    const css = await (await fetch(path)).text();
    applyScopedStyle(css, `scoped-style-${route.path}`);
  }
}


  // 3. Clean up previous state if any
  currentDestroy?.();

  // 4. Render process
  const renderView = async () => {
    const domClone = finalDOM.cloneNode(true) as HTMLElement;

    // 5. Load module
    if (route.script || route.scripts) {
      const scripts = route.scripts ?? route.script ?? [];
      const scriptList = Array.isArray(scripts) ? scripts : [scripts];
      const newScript = scriptList[0];

      if (typeof newScript === 'string' && newScript.trim().length > 0) {
        module = await loadModule(newScript, route.scriptBase || 'modules');
      }


      if (typeof module?.init === 'function') {
        actions = await module.init({ ...baseContext }) || {};
        const mergedProps = { ...props, ...(actions.props || {}) };

        // 6. Replace slots if template is given
        if (actions.template && typeof actions.template === 'string') {
          const container = document.createElement('div');
          container.innerHTML = actions.template;

          for (const el of [...container.children]) {
            const slot = el.getAttribute('slot') || null;
            const target = slot
              ? domClone.querySelector(`slot[name="${slot}"]`)
              : domClone.querySelector('slot:not([name])');

            if (target) {
              await hydrateComponent(el as HTMLElement, {
                ...baseContext,
                ...actions,
                props: mergedProps,
              });
              target.replaceWith(el);
            }
          }
        }

        // 7. Set up reactive state before anything
        const reactiveSources = actions.store || {};
        setupReactivity(reactiveSources, app);

        // 8. Run interpolation before binding
        const interpolationObserver = observeInterpolationBindings(domClone, reactiveSources, mergedProps);

        // 9. Bind declared actions like click handlers
        const bindObserver = bindActionsWithObserver(app, actions);

        // 10. Hydrate the full DOM tree
        await hydrateComponent(domClone, {
          ...baseContext,
          ...actions,
          props: mergedProps,
        });

        // 11. Hydrate any <component> children
        await resolveChildComponents(domClone, {
          ...baseContext,
          ...actions,
          props: mergedProps,
        });

        // 12. Patch the DOM in
        requestAnimationFrame(() => {
          shallowDiffAndPatch(app, domClone.children);

          // Re-apply reactivity on direct children
          if (actions.store) {
            Array.from(app.children).forEach(child => {
              setupReactivity(actions.store, child as HTMLElement);
            });
          }

          // 13. Call mount hook
          actions.onMount?.({
            ...baseContext,
            ...actions,
            props: mergedProps,
          });

          // 14. Setup destroy hook
          currentDestroy = () => {
            actions.onDestroy?.();
            bindObserver?.disconnect();
            interpolationObserver?.disconnect?.();
          };
        });
      }
    }

    // 15. Inline <script> execution (non-module)
    const doc = new DOMParser().parseFromString(viewHTML, 'text/html');
    for (const oldScript of doc.querySelectorAll('script')) {
      const newScript = document.createElement('script');
      if (oldScript.src) {
        if (loadedScriptSrcs.has(oldScript.src)) continue;
        newScript.src = oldScript.src;
        loadedScriptSrcs.add(oldScript.src);
      } else {
        newScript.textContent = oldScript.textContent;
      }
      if (oldScript.type) newScript.type = oldScript.type;
      document.body.appendChild(newScript);
    }

    // 16. Route-level lifecycle
    route.onLoad?.();
  };

  await renderView();
}



export function handleRoute(app: HTMLElement, routes: Route[]): void {
  if (location.hash === '#') {
    history.replaceState(null, '', `#${DEFAULT_ROUTE}`);
    return;
  }

  const { path, params } = getRouteAndParams();
  const queryParams: any = params.queryParams;
  let targetPath = path;

  if (!location.hash || path === DEFAULT_ROUTE) {
    targetPath = DEFAULT_ROUTE;
    if (!location.hash) {
      history.replaceState(null, '', `#${DEFAULT_ROUTE}`);
    }
  }

  const matched = matchRoute(targetPath, routes);

  if (matched) {
    const { route, match, params: pathParams } = matched;

    const combinedParams: Record<string, string> = {
      ...(queryParams || {}),
      ...(pathParams || {}),
    };

    loadPage(app, route, combinedParams, match);
  } else {
    app.innerHTML = `<h2>404 - Not Found</h2>`;
  }
}



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


export async function resolveContent(
  input: string | (() => Promise<string | { default: string }>) | undefined
): Promise<string> {
  if (!input) return '';

  let html: string;

  // Run function to get HTML
  if (typeof input === 'function') {
    const result = await input();
    html = typeof result === 'string' ? result : result?.default || '';
  }

  // Raw inline HTML
  else if (typeof input === 'string' && /<\/?[a-z][\s\S]*>/i.test(input.trim())) {
    html = input;
  }

  // External path
  else if (typeof input === 'string') {
    try {
      const res = await fetch(input);
      if (!res.ok) throw new Error('Not found in public');
      html = await res.text();
    } catch {
      try {
        html = await fallbackImportFromSrc(input); // fallback via Vite
      } catch (err: any) {
        console.error(err.message);
        throw new Error(`[resolveContent] Cannot resolve: ${input}`);
      }
    }
  } else {
    html = '';
  }

  //  Recursively resolve all <partial src="..."/>
  html = await resolvePartials(html);

  //  Optionally: Apply post-processing steps (reactivity, data-bind rewrites, etc.)
  // For now, just return the string, as in your original version
  return html;
}



export async function resolvePartials(html: string): Promise<string> {
  const PARTIAL_TAG_REGEX = /<partial\s+src=["']([^"']+)["']\s*\/?>/gi;

  let match: RegExpExecArray | null;

  while ((match = PARTIAL_TAG_REGEX.exec(html))) {
    const src = match[1];
    const partialHtml = await loadPartialContent(src);
    const resolved = await resolvePartials(partialHtml); // recursive
    html = html.replace(match[0], resolved);
    PARTIAL_TAG_REGEX.lastIndex = 0;
  }

  return html;
}


function normalizePath(input: string): string {
  return input.replace(/^\.?\/?/, '').replace(/^src\//, '');
}

async function loadPartialContent(src: string): Promise<string> {
  const normalized = `/src/${normalizePath(src)}`;

  try {
    return await fallbackImportFromSrc(normalized);
  } catch (err) {
    console.warn(`[resolvePartials] Could not load: ${src}`);
    return `<!-- Failed to load partial: ${src} -->`;
  }
}


export async function resolveScript(filename: string): Promise<any> {
  const cleanFilename = filename
    .replace(/^\/+/, '')       // remove leading slashes
    .replace(/^src\//, '')     // normalize "src/" if passed
    .replace(/\.(js|ts)$/, ''); // strip extension for flexible match

  const scripts: Record<string, () => Promise<any>> = import.meta.glob('/src/**/*.{js,ts}', {
    eager: false,
  });

  const candidates = Object.keys(scripts);

  const match = candidates.find(key => {
    const base = key
      .replace(/^\/src\//, '')
      .replace(/\.(js|ts)$/, '');

    return (
      base === cleanFilename ||             // exact
      base.endsWith('/' + cleanFilename)    // relative path
    );
  });

  if (!match) {
    console.error(`[resolveScript] Not found: '${filename}'`);
    console.error('Available scripts:', candidates);
    throw new Error(`[resolveScript] '${filename}' not found in src`);
  }

  try {
    const mod = await scripts[match]();
    return mod;
  } catch (err: any) {
    throw new Error(`[resolveScript] Failed to import '${filename}' from '${match}': ${err.message}`);
  }
}



export async function loadPage(
  app: HTMLElement,
  route: Route,
  params: Record<string, any> = {},
  match: RegExpMatchArray | null = null
): Promise<void> {

  try {
    window.__currentDestroy?.();

    const [viewHTML, layoutHTML] = await Promise.all([
      resolveContent(route.view),
      resolveContent(route.layout),
    ]);

    await slotAwareRender({
      app,
      route,
      viewHTML,
      layoutHTML,
      params,
      match,
    });



    console.log('running...');
  } catch (err) {
    console.error('Render error:', err);
    app.innerHTML = `<h2>Error loading page</h2>`;
  }
}
export function handleHashChange(app: HTMLElement | Document | any = document.getElementById("app"), routes: Route[]): void {

  handleRoute(app, routes);
}



