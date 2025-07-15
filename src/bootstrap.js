// import { routes } from '../AppRoutes';
// import { globalMiddleware } from './Plugins/utils/middlewares/middlewares';
import { hydrateComponent } from './core/hydrations/hydrateComponent';

const loadedScriptSrcs = new Set();
const DEFAULT_ROUTE = 'home';
let currentDestroy = null;

function getRouteAndParams() {
  const hash = decodeURIComponent(location.hash.slice(1));
  const [path = 'home', qs = ''] = hash.split('?');
  const params = Object.fromEntries(new URLSearchParams(qs));
  return { path, params };
}

function bindActions(app, handlers = {}) {
  const elements = app.querySelectorAll('[data-action]');
  elements.forEach((el) => {
    const { action, eventType = null } = el.dataset;
    const fn = handlers[action];
    if (typeof fn !== 'function') return;

    el.addEventListener(eventType != null ? eventType : 'click', (event) => {
      event.preventDefault();
      fn({ event, element: el, dataset: { ...el.dataset } });
    });
  });
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

// Helpers

function htmlToDOM(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp;
}

function injectSlots(layout, view) {
  // Default unnamed slot
  const defaultSlot = layout.querySelector('slot:not([name])');
  if (defaultSlot) {
    defaultSlot.replaceWith(...view.children);
  }

  // Named slots
  layout.querySelectorAll('slot[name]').forEach((slot) => {
    const name = slot.getAttribute('name');
    const templates = view.querySelectorAll(`template[slot="${name}"]`);
    if (templates.length > 0) {
      const frag = document.createDocumentFragment();
      templates.forEach((tpl) => {
        frag.appendChild(tpl.content.cloneNode(true));
      });
      slot.replaceWith(frag);
    }
  });
}

const runScriptModule = async (scriptFile, params, app) => {
  const scriptPaths = scriptFile;
  const hydratedTemplates = [];
  let actions = {};

  for (const scriptPath of scriptPaths) {
    if (!scriptPath) continue;

    const module = await import(`./${scriptPath}?t=${Date.now()}`);
    if (typeof module.init === 'function') {
      actions = module.init(params) || {};
      const template = actions?.template;

      if (typeof actions.beforeEnter === 'function') {
        const allowed = actions.beforeEnter(params);
        if (!allowed) {
          app.innerHTML = `<p>Navigation blocked by beforeEnter()</p>`;
          hideLoader();
          return { hydratedTemplates, actions };
        }
      }

      if (template && typeof template === 'string') {
        const container = document.createElement('div');
        container.innerHTML = template;
        const templates = [...container.children];

        for (const el of templates) {
          const slotName = el.getAttribute?.('slot') || null;
          await hydrateComponent(el, actions);

          // Run any inline or external scripts inside the template
          const scripts = el.querySelectorAll('script');
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

          hydratedTemplates.push({ el, slot: slotName });
        }
      }

      requestAnimationFrame(() => {
        bindActions(app, actions);
        actions.onMount?.({ app, params });

        currentDestroy = () => {
          actions.onDestroy?.();
          hydratedTemplates.forEach(({ el }) => el.remove?.());
        };
      });
    }
  }

  return { hydratedTemplates, actions };
};

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

    await slotAwareRender({
      app,
      route,
      viewHTML,
      layoutHTML,
      params,
    });
  } catch (err) {
    console.error('Render error:', err);
    app.innerHTML = `<h2>Error loading page</h2>`;
  }
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

  // 1. Parse layout and inject view template slots (if any)
  if (layoutHTML) {
    const layoutDOM = htmlToDOM(layoutHTML);
    injectSlots(layoutDOM, viewDOM); // from view.html into layout slots
    finalDOM = layoutDOM;
  }

  // 2. Clone DOM before rendering
  const domClone = finalDOM.cloneNode(true);

  // 3. If there are scripts/modules, run and extract hydratedTemplates
  const hydratedTemplates = [];
  let actions = {};
  if (route.script || route.scripts) {
    const scriptPaths = Array.isArray(route.scripts || route.script)
      ? route.scripts || route.script
      : [route.script];

    const module = await import(`./${scriptPaths[0]}?t=${Date.now()}`);
    if (typeof module.init === 'function') {
      actions = module.init(params) || {};
      const template = actions.template;

      if (template && typeof template === 'string') {
        const container = document.createElement('div');
        container.innerHTML = template;

        const elements = [...container.children];
        for (const el of elements) {
          const slot = el.getAttribute('slot') || null;
          await hydrateComponent(el, actions);

          // Inject into the domClone before anything is rendered
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

        // set onDestroy handler
        window.__currentDestroy = () => {
          actions.onDestroy?.();
        };
      });
    }
  }

  // 4. Replace <slot> tags with actual hydrated templates done above

  // 5. Replace app content with final DOM
  app.innerHTML = '';
  requestAnimationFrame(() => {
    [...domClone.children].forEach((el) => app.appendChild(el.cloneNode(true)));
    app.classList.add('fade-in');
  });

  // 6. Execute inline/external scripts from viewHTML or layout
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

    console.log(
      '[Frameless] Matched route:',
      route.path,
      route,
      combinedParams,
      match,
    );
    loadPage(app, route, combinedParams, match);
  } else {
    console.warn('[Frameless] No matching route for:', targetPath);
    app.innerHTML = `<h2>404 - Not Found</h2>`;
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
