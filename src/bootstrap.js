// import { routes } from '../AppRoutes';
// import { globalMiddleware } from './Plugins/utils/middlewares/middlewares';

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
      // Static exact match
      if (typeof route.path === 'string' && route.path === tryPath) {
        return { route, match: null, params: {} };
      }

      // Dynamic pattern match: /user/:id
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

      // RegExp route
      if (route.path instanceof RegExp) {
        const match = tryPath.match(route.path);
        if (match) return { route, match, params: {} };
      }
    }

    return null;
  };

  // Try the direct path first
  let result = tryMatch(path);
  if (result) return result;

  // Handle fallback to index/home if ends with slash
  if (path.endsWith('/')) {
    const fallbackPaths = [`${path}index`, `${path}home`];
    for (const fallbackPath of fallbackPaths) {
      result = tryMatch(fallbackPath);
      if (result) return result;
    }
  }

  // Fallback route `*`
  const fallback = routes.find((r) => r.path === '*');
  if (fallback) return { route: fallback, match: null, params: {} };

  return null;
}

const runScriptModule = async (scriptPath, params, app) => {
  console.log('here...');
  const module = await import(`./${scriptPath}?t=${Date.now()}`);
  if (typeof module.init === 'function') {
    const actions = module.init(params) || {};

    // before enter
    // Handle beforeEnter
    if (typeof actions.beforeEnter === 'function') {
      try {
        const allowed = actions.beforeEnter(params);
        if (!allowed) {
          app.innerHTML = `<p>Navigation blocked by beforeEnter()</p>`;
          hideLoader();
          return;
        }
      } catch (err) {
        console.warn('[Frameless] Error in beforeEnter():', err);
      }
    }

    console.log(actions, '<<<<<<<<');
    requestAnimationFrame(() => {
      if (typeof actions === 'object') {
        bindActions(app, actions);
        if (typeof actions.onMount === 'function') {
          try {
            requestAnimationFrame(() => actions.onMount(params));
          } catch (err) {
            console.warn('[MiniSPA] Error in onMount():', err);
          }
        }
        currentDestroy =
          typeof actions.onDestroy === 'function' ? actions.onDestroy : null;
      }
    });
  }
};

function showLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'flex';
}

function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';
}

// Slot Injection + Action Binding
function htmlToDOM(str) {
  const temp = document.createElement('div');
  temp.innerHTML = str;
  return temp;
}

function injectSlots(layout, view) {
  // Replace default slot
  const mainSlot = layout.querySelector('slot');
  if (mainSlot) {
    mainSlot.replaceWith(...view.children);
  }

  // Named slots

  layout.querySelectorAll('slot[name]').forEach((slot) => {
    if (slot) {
      const name = slot.getAttribute('name');
      const template = view.querySelector(`template[slot="${name}"]`);
      if (template) {
        const frag = template.content.cloneNode(true);
        slot.replaceWith(frag);
      }
    }
  });
}

async function loadPage(app, route, params = {}, match = null) {
  //  Run middleware
  if (route.middleware) {
    const result = await route.middleware(params);
    if (!result) {
      app.innerHTML = `<p>Access denied by middleware.</p>`;
      hideLoader();
      return;
    }
  }

  // Call previous onDestroy if exists
  try {
    if (typeof currentDestroy === 'function') currentDestroy();
  } catch (err) {
    console.warn('[Frameless] Error in onDestroy():', err);
  }
  try {
    showLoader();
    app.classList.remove('fade-in');

    const res = await fetch(route.view);
    const htmlText = await res.text();

    // to track previous dom
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const content = doc.body;

    //
    const viewDOM = htmlToDOM(htmlText);

    let finalDOM = viewDOM;
    if (route.layout) {
      const layoutRes = await fetch(route.layout);
      const layoutHTML = await layoutRes.text();
      const layoutDOM = htmlToDOM(layoutHTML);

      injectSlots(layoutDOM, viewDOM);
      finalDOM = layoutDOM;
    }

    app.innerHTML = '';
    requestAnimationFrame(() => {
      [...finalDOM.children].forEach((el) =>
        app.appendChild(el.cloneNode(true)),
      );
    });

    // Auto-execute inline and external scripts
    const scripts = content.querySelectorAll('script');
    for (const oldScript of scripts) {
      const newScript = document.createElement('script');

      // External script with deduplication
      if (oldScript.src) {
        if (loadedScriptSrcs.has(oldScript.src)) continue;
        newScript.src = oldScript.src;
        loadedScriptSrcs.add(oldScript.src);
      } else {
        // Inline script
        newScript.textContent = oldScript.textContent;
      }

      //  Preserve type (e.g., module)
      if (oldScript.type) {
        newScript.type = oldScript.type;
      }

      document.body.appendChild(newScript);
    }

    // Import scoped JS for this route
    if (
      (route.script && typeof route.script == 'string') ||
      (route.scripts && typeof route.scripts == 'string')
    ) {
      const module = await import(`./${route.script}?t=${Date.now()}`);
      console.log(module, 'cant reach');
      if (typeof module.init === 'function') {
        // const actions = module.init(params);
        // if (typeof actions === 'object') {
        // //   bindActions(actions);
        // }

        // actions and lifecycles are grouped to gether in the return object of our frmaeless functional component
        const actions = module.init(params) || {};

        // before enter
        // Handle beforeEnter
        if (typeof actions.beforeEnter === 'function') {
          try {
            const allowed = actions.beforeEnter(params);
            if (!allowed) {
              app.innerHTML = `<p>Navigation blocked by beforeEnter()</p>`;
              hideLoader();
              return;
            }
          } catch (err) {
            console.warn('[Frameless] Error in beforeEnter():', err);
          }
        }

        console.log(actions, '<<<<<<<<');
        requestAnimationFrame(() => {
          if (typeof actions === 'object') {
            bindActions(app, actions);
            if (typeof actions.onMount === 'function') {
              try {
                requestAnimationFrame(() => actions.onMount(params));
              } catch (err) {
                console.warn('[MiniSPA] Error in onMount():', err);
              }
            }
            currentDestroy =
              typeof actions.onDestroy === 'function'
                ? actions.onDestroy
                : null;
          }
        });
      }
    } else if (Array.isArray(route.script) || Array.isArray(route.scripts)) {
      if (route.scripts) {
        for (const scriptPath of route.scripts) {
          await runScriptModule(scriptPath, params, app);
        }
      } else if (route.script) {
        await runScriptModule(route.script, params, app);
      }
    }

    // route on load before script executiom
    route?.onLoad?.();
    // Add transition
    requestAnimationFrame(() => app.classList.add('fade-in'));
  } catch (err) {
    console.error(err);
    app.innerHTML = `<h2>Error loading ${route.view}</h2>`;
  } finally {
    hideLoader();
  }
}

function handleRoute(app, routes) {
  if (location.hash === '#') {
    history.replaceState(null, '', `#${DEFAULT_ROUTE}`);
    return;
  }

  const { path, params } = getRouteAndParams();
  const queryParams = params.queryParams;

  // ✅ Use fallback path if hash is empty or equals DEFAULT_ROUTE
  let targetPath = path;

  if (!location.hash || path === DEFAULT_ROUTE) {
    targetPath = DEFAULT_ROUTE;

    // ✅ Set hash if it's not already set
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
