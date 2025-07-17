// import { routes } from '../AppRoutes';
// import { globalMiddleware } from './Plugins/utils/middlewares/middlewares';
import { hydrateComponent } from './core/hydrations/hydrateComponent';
import { setupReactivity, bind, watchEffect } from './core/hooks/basic';
import { resolveChildComponents } from './core/components/resolveChildComponent';

const loadedScriptSrcs = new Set();
const DEFAULT_ROUTE = 'home';
const currentDestroy = null;

function getRouteAndParams() {
  const hash = decodeURIComponent(location.hash.slice(1));
  const [path = 'home', qs = ''] = hash.split('?');
  const params = Object.fromEntries(new URLSearchParams(qs));
  return { path, params };
}

function matchRoute(path, routes) {
  const tryMatch = (tryPath) => {
    for (const route of routes) {
      if (typeof route.path === 'string' && route.path === tryPath) {
        return { route, match: null, params: {} };
      }

      if (typeof route.path === 'string' && route.path.includes(':')) {
        const paramNames = [];
        const regexStr = route.path
          .split('/')
          .map((part) => {
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
          const params = Object.fromEntries(
            paramNames.map((key, i) => [key, match[i + 1]]),
          );
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
    const fallbackPaths = [`${path}index`, `${path}home`];
    for (const fallbackPath of fallbackPaths) {
      result = tryMatch(fallbackPath);
      if (result) return result;
    }
  }

  const fallback = routes.find((r) => r.path === '*');
  if (fallback) return { route: fallback, match: null, params: {} };

  return null;
}

function showLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'flex';
}

function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';
}

function shallowDiffAndPatch(parent, newChildren) {
  const existing = [...parent.children];
  const incoming = [...newChildren];

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

function htmlToDOM(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp;
}

function injectSlots(layout, view) {
  const inject = (host, content) => {
    host.querySelectorAll('slot[name]').forEach((slot) => {
      const name = slot.getAttribute('name');
      const tpl = content.querySelector(`template[slot="${name}"]`);
      if (tpl) {
        const frag = tpl.content.cloneNode(true);
        injectSlots(frag, content);
        slot.replaceWith(frag);
        return;
      }
      const node = content.querySelector(`[slot="${name}"]:not(template)`);
      if (node) {
        slot.replaceWith(node.cloneNode(true));
      }
    });

    const defaultSlot = host.querySelector('slot:not([name])');
    if (defaultSlot) {
      const tpl = content.querySelector('template:not([slot])');
      if (tpl) {
        const frag = tpl.content.cloneNode(true);
        injectSlots(frag, content);
        defaultSlot.replaceWith(frag);
        return;
      }

      const fallbackNodes = [...content.children].filter(
        (el) => el.tagName !== 'TEMPLATE' && !el.hasAttribute('slot'),
      );
      if (fallbackNodes.length > 0) {
        defaultSlot.replaceWith(...fallbackNodes.map((n) => n.cloneNode(true)));
      }
    }
  };

  inject(layout, view);
}

function applyScopedStyle(cssText, scopeId) {
  const oldStyle = document.getElementById(scopeId);
  if (oldStyle) oldStyle.remove();

  const style = document.createElement('style');
  style.id = scopeId;
  style.textContent = cssText;
  document.head.appendChild(style);
}

// Updated slotAwareRender with full support for:
// ✡ layouts with <slot> + components
// ✡ views with <template slot> + nested components
// ✡ reactivity and hydration end-to-end

export async function slotAwareRender({
  app,
  route,
  viewHTML,
  layoutHTML,
  params,
}) {
  const props = { ...params };
  const baseContext = { app, params, props };
  const viewDOM = htmlToDOM(viewHTML);
  let finalDOM = viewDOM;

  let actions = {};
  let module;

  if (layoutHTML) {
    const layoutDOM = htmlToDOM(layoutHTML);
    injectSlots(layoutDOM, viewDOM);
    finalDOM = layoutDOM;
  }

  if (route.styles || route.style) {
    const stylePaths = Array.isArray(route.styles || route.style)
      ? route.styles || route.style
      : [route.style];
    for (const stylePath of stylePaths) {
      const res = await fetch(stylePath);
      const css = await res.text();
      applyScopedStyle(css, `scoped-style-${route.path}`);
    }
  }

  const renderView = async () => {
    const domClone = finalDOM.cloneNode(true);

    if (route.script || route.scripts) {
      const scriptPaths = Array.isArray(route.scripts || route.script)
        ? route.scripts || route.script
        : [route.script];

      module = await import(`./${scriptPaths[0]}?t=${Date.now()}`);

      if (typeof module.init === 'function') {
        actions = (await module.init({ ...baseContext })) || {};
        const template = actions.template;

        if (template && typeof template === 'string') {
          const container = document.createElement('div');
          container.innerHTML = template;

          for (const el of [...container.children]) {
            const slot = el.getAttribute('slot') || null;

            await hydrateComponent(el, {
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
          setupReactivity(actions.store, app);
          window.__currentDestroy = () => actions.onDestroy?.();
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
      shallowDiffAndPatch(app, domClone.children);
      [...app.children].forEach((child) => {
        if (actions.store) setupReactivity(actions.store, child);
      });
    });

    // Run inline scripts
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

    route?.onLoad?.();
  };

  await renderView();

  // Re-run renderView when props or store changes
  watchEffect({
    props,
    store: actions.store,
    callback: async ({ props: newProps, state }) => {
      if (typeof actions.onPropsChanged === 'function') {
        await actions.onPropsChanged({
          props: newProps,
          state,
          context: { ...baseContext, ...actions },
        });
      }

      console.log('[slotAwareRender] Watch triggered', { newProps, state });
      await renderView();
    },
  });
}
function handleRoute(app, routes) {
  if (location.hash === '#') {
    history.replaceState(null, '', `#${DEFAULT_ROUTE}`);
    return;
  }

  const { path, params } = getRouteAndParams();
  const queryParams = params.queryParams;
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
    const combinedParams = { ...queryParams, ...pathParams };
    loadPage(app, route, combinedParams, match);
  } else {
    app.innerHTML = `<h2>404 - Not Found</h2>`;
  }
}

async function loadPage(app, route, params = {}, match = null) {
  try {
    window.__currentDestroy?.();

    const resolveContent = async (input) => {
      if (!input) return '';

      // Function (dynamic import or async loader)
      if (typeof input === 'function') {
        const result = await input();
        return typeof result === 'string' ? result : result?.default || '';
      }

      // Inline HTML string
      if (typeof input === 'string') {
        const isHTML = /<\/?[a-z][\s\S]*>/i.test(input.trim());
        if (isHTML) return input;

        // Treat as a file path
        return fetch(input).then((res) => res.text());
      }

      return '';
    };

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
  } catch (err) {
    console.error('Render error:', err);
    app.innerHTML = `<h2>Error loading page</h2>`;
  }
}

function handleHashChange(app, routes) {
  handleRoute(app, routes);
}

export const bootstrapContainers = (routes) => {
  return {
    surge: (app) => {
      window.addEventListener('hashchange', () =>
        handleHashChange(app, routes),
      );
      window.addEventListener('DOMContentLoaded', () =>
        handleHashChange(app, routes),
      );
    },
  };
};
