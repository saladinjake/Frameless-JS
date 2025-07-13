const app = document.getElementById('app');
const loadedScriptSrcs = new Set();
const DEFAULT_ROUTE = 'index';
let currentDestroy = null;

export function navigate(path, query = {}) {
  const queryStr = new URLSearchParams(query).toString();
  location.hash = queryStr ? `#${path}?${queryStr}` : `#${path}`;
}

async function checkLoginStatus(boolVal) {
  // toggle
  return boolVal;
}
const routes = [
  {
    path: 'home',
    view: './example/Views/home.html',
    onLoad: () => console.log('Home loaded'),
  },
  {
    path: 'login',
    view: './example/Views/login.html',
    onLoad: () => console.log('Login loaded'),
  },
  {
    path: 'profile/:id', // /^profile\/(\d+)$/,
    view: './example/Views/profile.html',
    onLoad: () => console.log('Profile loaded'),
    middleware: async (params) => {
      // midleware by params value
      console.log(params, '>>>>');
      if (params?.user) {
        if (params.user != 'banned') return true;
        return false;
      }

      // meddle ware by function call
      const toggleTestValue = false;
      const user = await checkLoginStatus(toggleTestValue);
      if (!user) {
        location.hash = '#login';
        return false;
      }
      return true;
    },
    script: ['example/pages/about.js'], // accepts array of string
  },
  {
    path: 'about',
    view: './example/Views/about.html',
    middleware: () => {
      console.log('About middleware ran');
      return true; // must return true to continue
    },
    onLoad: () => console.log('About page is now visible'),
    script: 'example/pages/about.js',
  },
  {
    path: 'contact',
    view: './example/Views/contact.html',
    middleware: () => {
      console.log('Checking something before showing contact');
      return confirm('Do you really want to view the contact page?');
    },
  },

  /// test life cycle
  //   {
  //     path: 'dashboard',
  //     view: 'views/dashboard.html',
  //     // script: 'pages/dashboard.js',
  //     beforeEnter: (params) => {
  //       if (!checkLoginStatus(false)) {
  //         navigate('login');
  //         return false;
  //       }
  //       return true;
  //     },
  //   },
  {
    path: '*',
    view: './example/Views/404.html',
    script: 'example/pages/404.js',
  },
];

function getRouteAndParams() {
  const hash = decodeURIComponent(location.hash.slice(1));
  const [path = 'home', qs = ''] = hash.split('?');
  const params = Object.fromEntries(new URLSearchParams(qs));
  return { path, params };
}

function bindActions(actionHandlers = {}) {
  const elements = app.querySelectorAll('[data-action]');
  elements.forEach((el) => {
    const actionName = el.dataset.action;
    const handler = actionHandlers[actionName];
    if (!handler) return;

    el.addEventListener('click', (event) => {
      const dataset = { ...el.dataset }; // includes data-id, data-name, etc.
      handler({ event, element: el, dataset });
    });
  });
}
function matchRoute(path) {
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

const runScriptModule = async (scriptPath, params) => {
  const module = await import(`./${scriptPath}?t=${Date.now()}`);
  if (typeof module.init === 'function') {
    const actions = module.init(params);
    if (typeof actions === 'object') bindActions(actions);
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

async function loadPage(route, params = {}, match = null) {
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

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const content = doc.body;

    requestAnimationFrame(() => {
      app.innerHTML = '';
      Array.from(content.children).forEach((child) =>
        app.appendChild(child.cloneNode(true)),
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

    // ✅ Import scoped JS for this route
    if (
      (route.script && typeof route.script == 'string') ||
      (route.scripts && typeof route.scripts == 'string')
    ) {
      const module = await import(`./${route.script}?t=${Date.now()}`);
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
            const allowed = actions.beforeEnter(allParams);
            if (!allowed) {
              app.innerHTML = `<p>Navigation blocked by beforeEnter()</p>`;
              hideLoader();
              return;
            }
          } catch (err) {
            console.warn('[Frameless] Error in beforeEnter():', err);
          }
        }

        requestAnimationFrame(() => {
          if (typeof actions === 'object') {
            bindActions(actions);
            if (typeof actions.onMount === 'function') {
              try {
                actions.onMount(params);
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
          await runScriptModule(scriptPath, params);
        }
      } else if (route.script) {
        await runScriptModule(route.script, params);
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

function handleRoute() {
  const { path, params } = getRouteAndParams();

  const queryParams = params.queryParams;
  if (!path || path.trim() === '') {
    const newPath = DEFAULT_ROUTE;
    location.hash = `#${newPath}`;
    return;
  }

  const matched = matchRoute(path);

  if (matched) {
    const { route, match, params: pathParams } = matched;
    const combinedParams = { ...queryParams, ...pathParams };
    loadPage(route, combinedParams, match);
  } else {
    this.app.innerHTML = `<h2>404 - Not Found</h2>`;
  }
}

function handleHashChange() {
  handleRoute();
}

window.addEventListener('hashchange', handleHashChange);
window.addEventListener('DOMContentLoaded', handleHashChange);
