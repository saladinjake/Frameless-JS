// import { routes } from '../AppRoutes';
// import { globalMiddleware } from './Plugins/utils/middlewares/middlewares';
import { hydrateComponent } from './core/hydrations/hydrateComponent';
import { setupReactivity, } from './core/hooks/basic';
import { resolveChildComponents } from './core/components/resolveChildComponent';
import { loadModule } from './core/utils';

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

// interface MatchResult {
//   route: Route;
//   match: RegExpMatchArray | null;
//   params: Record<string, string>;
// }

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

export async function slotAwareRender({
  app,
  route,
  viewHTML,
  layoutHTML,
  params,
  match = null
}: RenderOptions): Promise<void> {
  const props = { ...params };
  const baseContext = { app, params, props };
  const viewDOM = htmlToDOM(viewHTML);
  let finalDOM = viewDOM;
  let actions: ComponentActions = {};
  let module: any;

  console.log(match)

  if (layoutHTML) {
    const layoutDOM = htmlToDOM(layoutHTML);
    injectSlots(layoutDOM, viewDOM);
    finalDOM = layoutDOM;
  }

  const rawStyles = route.styles ?? route.style;

  const stylePaths: string[] = Array.isArray(rawStyles)
    ? rawStyles
    : typeof rawStyles === 'string'
      ? [rawStyles]
      : [];

  for (const stylePath of stylePaths ?? []) {
    if (typeof stylePath === 'string') {
      try {
        const css = await (await fetch(stylePath)).text();

        applyScopedStyle(css, `scoped-style-${route.path}`);
      } catch (err) {
        console.warn(`Failed to fetch style from: ${stylePath}`, err);
      }
    }
  }


  const renderView = async (): Promise<void> => {
    const domClone = finalDOM.cloneNode(true) as HTMLElement;

    if (route.script || route.scripts) {
      const scriptPaths: any = Array.isArray(route.scripts || route.script)
        ? (route.scripts || route.script)
        : [route.script];

      // Add optional chaining and type check
      const firstScript = Array.isArray(scriptPaths) ? scriptPaths[0] : scriptPaths;
      if (typeof firstScript === 'string') {
        module = await loadModule(firstScript, route.scriptBase || 'modules');
      }






      if (typeof module.init === 'function') {
        actions = await module.init({ ...baseContext }) || {};
        const { template } = actions;

        if (template && typeof template === 'string') {
          const container = document.createElement('div');
          container.innerHTML = template;

          for (const el of [...container.children]) {
            const slot = el.getAttribute('slot') || null;

            await hydrateComponent(el as HTMLElement, {
              ...baseContext,
              ...actions,
              props: { ...props },
            });

            const target = slot
              ? domClone.querySelector(`slot[name="${slot}"]`)
              : domClone.querySelector('slot:not([name])');

            if (target) target.replaceWith(el);
          }
        }

        requestAnimationFrame(() => {
          actions.onMount?.({ ...baseContext, ...actions, props });
          if (actions.store) setupReactivity(actions.store, app);
          currentDestroy = () => actions.onDestroy?.();
        });
      }
    }

    await hydrateComponent(domClone, {
      ...baseContext,
      ...actions,
      props: { ...props },
    });

    await resolveChildComponents(domClone, {
      ...baseContext,
      ...actions,
      props: { ...props },
    });



    requestAnimationFrame(() => {
      if (!app || !domClone || !domClone.children) {
        console.warn('[hydrate] Skipping patch - app or domClone is null');
        return;
      }

      shallowDiffAndPatch(app, domClone.children);

      Array.from(app.children).forEach((child: any) => {
        if (actions.store) setupReactivity(actions.store, child);
      });
    });


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

    route.onLoad?.();
  };

  await renderView();

  // watchEffect({
  //   props,
  //   store: actions.store,
  //   callback: async ({ props: newProps, state }: { props: any, state: any }) => {
  //     if (typeof actions.onPropsChanged === 'function') {
  //       await actions.onPropsChanged({
  //         props: newProps,
  //         state,
  //         context: { ...baseContext, ...actions },
  //       });
  //     }

  //     console.log('[slotAwareRender] Watch triggered', { newProps, state });
  //     await renderView();
  //   },
  // });
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


// core/utils/loaders.js
// core/utils/loaders.js

/**
 * Attempts to load a file from the Vite src directory using import.meta.glob
 * @param {string} filename - e.g. "Main.html" or "views/About.html"
 * @returns {Promise<string>} - raw file content
 */
export async function fallbackImportFromSrc(filename: string): Promise<string> {
  const cleanFilename = filename.replace(/^\/+/, '');

  const templates: Record<string, () => Promise<string>> | any = import.meta.glob('/src/**/*.{html,txt}', {
    as: 'raw',
    eager: false,
  });

  const match = Object.keys(templates).find(key =>
    key.endsWith(`/${cleanFilename}`) || key.endsWith(cleanFilename)
  );

  if (!match) {
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

  if (typeof input === 'function') {
    const result = await input();
    return typeof result === 'string' ? result : result?.default || '';
  }

  if (typeof input === 'string') {
    const isHTML = /<\/?[a-z][\s\S]*>/i.test(input.trim());
    if (isHTML) return input;

    try {
      const res = await fetch(input);
      if (!res.ok) throw new Error('Not found in public');
      return await res.text();
    } catch {
      try {
        return await fallbackImportFromSrc(input);
      } catch (importErr: any) {
        console.error(importErr.message);
        throw new Error(`[resolveContent] Cannot resolve: ${input}`);
      }
    }
  }

  return '';
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