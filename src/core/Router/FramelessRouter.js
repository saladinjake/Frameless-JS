/* eslint-disable import/prefer-default-export */

/****
 * @usage
 * const router = new Router({
        targetId: 'app',
        globalMiddleware: async (route, params) => {
            console.log("Global check:", route.path, params);
            return true;
        },
        routes:[{}]
     })
 */
export default class Router {
  constructor({ routes = [], targetId = 'app', globalMiddleware = null, defaultRoute = 'home' }) {
    this.routes = routes;
    this.defaultRoute = defaultRoute;
    this.globalMiddleware = globalMiddleware;
    this.app = document.getElementById(targetId);
    this.loadedScriptSrcs = new Set();

    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('DOMContentLoaded', () => this.handleRoute());
    return this
  }
  navigate(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  location.hash = query ? `${path}?${query}` : `${path}`;
}

  getHashParts() {
    const hash = decodeURIComponent(location.hash.slice(1));
    const [path = 'index', qs = ''] = hash.split('?');
    const params = Object.fromEntries(new URLSearchParams(qs));
    return { path : path || defaultRoute, params };
  }

  matchRoute(path) {
    const tryMatch = (tryPath) => {
      for (const route of this.routes) {
        // Static exact match
        if (typeof route.path === 'string' && route.path === tryPath) {
          return { route, match: null, params: {} };
        }

        // Dynamic pattern match: /user/:id
        if (typeof route.path === 'string' && route.path.includes(':')) {
          const paramNames = [];
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
    const fallback = this.routes.find(r => r.path === '*');
    if (fallback) return { route: fallback, match: null, params: {} };

    return null;
  }


  bindActions(actionHandlers = {}) {
    const elements = this.app.querySelectorAll('[data-action]');
    elements.forEach(el => {
      const action = el.dataset.action;
      const handler = actionHandlers[action];
      if (typeof handler !== 'function') return;
      el.addEventListener('click', event => {
        handler({ event, element: el, dataset: { ...el.dataset } });
      });
    });
  }





  handleRoute() {
    let { path, params: queryParams } = this.getHashParts();

    if (!path || path.trim() === '') {
      path = this.defaultRoute;
      location.hash = `#${path}`;
      return;
    }

    const matched = this.matchRoute(path);

    if (matched) {
      const { route, match, params: pathParams } = matched;
      const combinedParams = { ...queryParams, ...pathParams };
      this.loadPage(route, combinedParams, match);
    } else {
      this.app.innerHTML = `<h2>404 - Not Found</h2>`;
    }
  }
  showLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';
  }

  hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
  }



  async loadPage(route, params = {}, match = null) {
    try {
      this.showLoader(); //Show spinner immediately
      this.app.classList.remove('fade-in');

      if (!(await this.globalMiddleware?.(route, params))) {
        this.app.innerHTML = `<p>Blocked by global middleware.</p>`;
        this.hideLoader();
        return;
      }

      if (route.middleware && !(await route.middleware(match, params))) {
        this.app.innerHTML = `<p>Blocked by route middleware.</p>`;
        this.hideLoader();
        return;
      }

      const res = await fetch(route.view);
      const html = await res.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const content = doc.body;

      this.app.innerHTML = '';
      for (const child of content.children) {
        this.app.appendChild(child.cloneNode(true));
      }

      // Load inline and external <script> tags
      const scripts = content.querySelectorAll('script');
      for (const s of scripts) {
        const newScript = document.createElement('script');
        if (s.src) {
          if (this.loadedScriptSrcs.has(s.src)) continue;
          newScript.src = s.src;
          this.loadedScriptSrcs.add(s.src);
        } else {
          newScript.textContent = s.textContent;
        }
        if (s.type) newScript.type = s.type;
        document.body.appendChild(newScript);
      }

      // Load route modules
      const scriptPaths = route.scripts || (route.script ? [route.script] : []);
      for (const path of scriptPaths) {
        const mod = await import(`./${path}?t=${Date.now()}`);
        if (typeof mod.init === 'function') {
          const actions = mod.init(params);
          if (typeof actions === 'object') this.bindActions(actions);
        }
      }

      requestAnimationFrame(() => this.app.classList.add('fade-in'));
    } catch (err) {
      console.error(err);
      this.app.innerHTML = `<h2>Error loading view</h2>`;
    } finally {
      this.hideLoader(); // 👉 Hide spinner when done
    }
  }

}
