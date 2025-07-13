const app = document.getElementById('app');

const routes = [
  {
    path: 'home',
    view: './example/home.html',
    onLoad: () => console.log('Home loaded'),
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

async function loadPage(route) {
  if (route.middleware && !route.middleware()) {
    return (app.innerHTML = `<p>Access denied or cancelled.</p>`);
  }

  try {
    const res = await fetch(route.view);
    const html = await res.text();
    app.innerHTML = html;

    if (typeof route.onLoad === 'function') {
      route.onLoad();
    }
  } catch (err) {
    app.innerHTML = `<h2>Error loading ${route.view}</h2>`;
  }
}

function handleHashChange() {
  const hash = location.hash.replace('#', '') || 'home';
  const route = routes.find((r) => r.path === hash);

  if (route) {
    loadPage(route);
  } else {
    app.innerHTML = `<h2>404 - Page not found</h2>`;
  }
}

window.addEventListener('hashchange', handleHashChange);
window.addEventListener('DOMContentLoaded', handleHashChange);
