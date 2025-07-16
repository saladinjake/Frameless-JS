// import { routes } from '../AppRoutes';
// import { globalMiddleware } from './Plugins/utils/middlewares/middlewares';
import { hydrateComponent } from './core/hydrations/hydrateComponent';
import { setupReactivity } from './core/hooks/basic';

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

function htmlToDOM(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp;
}

function injectSlots(layout, view) {
  layout.querySelectorAll('slot[name]').forEach((slot) => {
    const name = slot.getAttribute('name');
    const template = view.querySelector(`template[slot="${name}"]`);
    if (template) {
      const frag = template.content.cloneNode(true);
      slot.replaceWith(frag);
    }
  });

  const defaultSlot = layout.querySelector('slot:not([name])');
  if (defaultSlot) {
    const nonSlotted = [...view.children].filter(
      (el) => !(el.tagName === 'TEMPLATE' && el.hasAttribute('slot')),
    );
    if (nonSlotted.length > 0) {
      defaultSlot.replaceWith(...nonSlotted);
    }
  }

  layout.querySelectorAll('template[slot]').forEach((tpl) => {
    const nestedName = tpl.getAttribute('slot');
    const nestedTarget = layout.querySelector(`slot[name="${nestedName}"]`);
    if (nestedTarget) {
      const frag = tpl.content.cloneNode(true);
      nestedTarget.replaceWith(frag);
    }
  });
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

function applyScopedStyle(cssText, scopeId) {
  const oldStyle = document.getElementById(scopeId);
  if (oldStyle) oldStyle.remove();

  const style = document.createElement('style');
  style.id = scopeId;
  style.textContent = cssText;
  document.head.appendChild(style);
}
export async function slotAwareRender({
  app,
  route,
  viewHTML,
  layoutHTML,
  params,
}) {
  const viewDOM = htmlToDOM(viewHTML);
  let finalDOM = viewDOM;

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

  const domClone = finalDOM.cloneNode(true);

  let actions = {};
  if (route.script || route.scripts) {
    const scriptPaths = Array.isArray(route.scripts || route.script)
      ? route.scripts || route.script
      : [route.script];

    const module = await import(`./${scriptPaths[0]}?t=${Date.now()}`);
    if (typeof module.init === 'function') {
      actions = module.init({ params, app }) || {};
      const template = actions.template;

      if (template && typeof template === 'string') {
        const container = document.createElement('div');
        container.innerHTML = template;

        const elements = [...container.children];
        for (const el of elements) {
          const slot = el.getAttribute('slot') || null;

          await hydrateComponent(el, actions);

          // ✅ Setup reactivity BEFORE slotting
          if (actions?.store) {
            setupReactivity(actions.store, el);
          }

          const target = slot
            ? domClone.querySelector(`slot[name="${slot}"]`)
            : domClone.querySelector('slot:not([name])');

          if (target) {
            target.replaceWith(el);
          }
        }
      }

      requestAnimationFrame(() => {
        actions.onMount?.({ app, params });
        window.__currentDestroy = () => actions.onDestroy?.();
      });
    }
  }

  requestAnimationFrame(() => {
    shallowDiffAndPatch(app, domClone.children);
  });

  const doc = new DOMParser().parseFromString(viewHTML, 'text/html');
  const scripts = doc.querySelectorAll('script');
  for (const oldScript of scripts) {
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
    const [viewRes, layoutRes] = await Promise.all([
      fetch(route.view),
      route.layout ? fetch(route.layout) : Promise.resolve({ text: () => '' }),
    ]);

    const [viewHTML, layoutHTML] = await Promise.all([
      viewRes.text(),
      layoutRes.text(),
    ]);

    await slotAwareRender({ app, route, viewHTML, layoutHTML, params });
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
