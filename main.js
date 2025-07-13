const app = document.getElementById('app');

const Config = {
  fetchOverNetworkFiles: false,
};

const routes = [
  {
    path: 'home',
    view: './example/home.html',
    onLoad: () => console.log('Home loaded'),
    script: 'pages/home.js',
  },
  {
    path: 'about',
    view: './example/about.html',
    middleware: () => {
      console.log('About middleware ran');
      return true; // must return true to continue
    },
    onLoad: () => console.log('About page is now visible'),
  },
  {
    path: 'contact',
    view: './example/contact.html',
    middleware: () => {
      console.log('Checking something before showing contact');
      return confirm('Do you really want to view the contact page?');
    },
  },
];

// Optional: parse params like #about?user=vic
function getRouteAndParams() {
  const [hashPath, queryString = ''] = location.hash
    .replace('#', '')
    .split('?');
  const params = Object.fromEntries(new URLSearchParams(queryString));
  return { path: hashPath || 'home', params };
}

function loadScriptElements(fragment) {
  const scripts = fragment.querySelectorAll('script');
  scripts.forEach((oldScript) => {
    const newScript = document.createElement('script');
    if (oldScript.src) {
      newScript.src = oldScript.src;
    } else {
      newScript.textContent = oldScript.textContent;
    }
    document.body.appendChild(newScript); // executes immediately
    oldScript.remove();
  });
}

async function loadPage(route) {
  if (route.middleware && !route.middleware()) {
    app.innerHTML = `<p>Access denied or cancelled.</p>`;
    return;
  }

  try {
    const res = await fetch(route.view);
    const htmlText = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const content = doc.body;

    app.innerHTML = ''; // clear existing content
    Array.from(content.children).forEach((child) =>
      app.appendChild(child.cloneNode(true)),
    );

    loadScriptElements(content); // re-run embedded scripts

    // if external script exist in route object
    if (route.script) {
      const module = await import(`${route.script}?t=${Date.now()}`); // cache-bust
      if (module?.init) {
        module.init(params); // pass params like { user: "vic" }
      }
    }

    // if onLoad option in route ..
    route.onLoad?.();
  } catch (err) {
    app.innerHTML = `<h2>Error loading ${route.view}</h2>`;
    console.error(err);
  }
}

function handleHashChange() {
  const { path, params } = getRouteAndParams();
  const route = routes.find((r) => r.path === path);
  if (route) {
    loadPage(route, params);
  } else {
    app.innerHTML = `<h2>404 - Not Found</h2>`;
  }
}

window.addEventListener('hashchange', handleHashChange);
window.addEventListener('DOMContentLoaded', handleHashChange);
