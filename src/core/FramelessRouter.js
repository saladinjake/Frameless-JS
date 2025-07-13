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
  constructor({ routes = [], targetId = 'app', globalMiddleware = null }) {
    this.routes = routes;
    this.globalMiddleware = globalMiddleware;
    this.app = document.getElementById(targetId);
    this.loadedScriptSrcs = new Set();

    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('DOMContentLoaded', () => this.handleRoute());
  }

  getHashParts() {
    const hash = decodeURIComponent(location.hash.slice(1));
    const [path = 'home', qs = ''] = hash.split('?');
    const params = Object.fromEntries(new URLSearchParams(qs));
    return { path, params };
  }

  matchRoute(path) {
    for (const route of this.routes) {
      // 🔹 Static match
      if (typeof route.path === 'string' && !route.path.includes(':')) {
        if (route.path === path) return { route, match: null, params: {} };
      }

      // 🔹 Dynamic segment match (e.g. user/:id)
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
        const match = path.match(regex);
        if (match) {
          const params = Object.fromEntries(paramNames.map((key, i) => [key, match[i + 1]]));
          return { route, match, params };
        }
      }

      // 🔹 RegExp match
      if (route.path instanceof RegExp) {
        const match = path.match(route.path);
        if (match) return { route, match, params: {} };
      }
    }

    // 🔹 Wildcard fallback
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

  async handleRoute() {
    const { path, params: queryParams } = this.getHashParts();
    const matched = this.matchRoute(path);

    if (!matched) {
      this.app.innerHTML = `<h2>404 Not Found</h2>`;
      return;
    }

    const { route, match, params: pathParams } = matched;
    const params = { ...queryParams, ...pathParams };

    if (this.globalMiddleware) {
      const allowed = await this.globalMiddleware(route, params);
      if (!allowed) {
        this.app.innerHTML = `<p>Blocked by global middleware.</p>`;
        return;
      }
    }

    if (route.middleware) {
      const allowed = await route.middleware(match, params);
      if (!allowed) {
        this.app.innerHTML = `<p>Blocked by route middleware.</p>`;
        return;
      }
    }

    try {
      this.app.classList.remove('fade-in');

      const res = await fetch(route.view);
      const html = await res.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const content = doc.body;

      this.app.innerHTML = '';
      for (const child of content.children) {
        this.app.appendChild(child.cloneNode(true));
      }

      // ✅ Handle inline + src scripts
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

      // ✅ Import route script(s)
      const scriptPaths = route.scripts || (route.script ? [route.script] : []);
      for (const path of scriptPaths) {
        const mod = await import(`./${path}?t=${Date.now()}`);
        if (typeof mod.init === 'function') {
          const actions = mod.init(params);
          if (actions && typeof actions === 'object') {
            this.bindActions(actions);
          }
        }
      }

      requestAnimationFrame(() => this.app.classList.add('fade-in'));

    } catch (err) {
      console.error(err);
      this.app.innerHTML = `<h2>Error loading view</h2>`;
    }
  }
}
