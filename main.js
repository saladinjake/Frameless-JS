const app = document.getElementById('app');

const routes = {
  home: './example/home.html',
  about: './example/about.html',
  contact: './example/contact.html',
};

async function loadPage(page) {
  const path = routes[page] || 'home.html';
  const res = await fetch(path);
  const html = await res.text();
  app.innerHTML = html;
}

function handleHashChange() {
  const page = location.hash.replace('#', '') || 'home';
  loadPage(page);
}

window.addEventListener('hashchange', handleHashChange);
window.addEventListener('DOMContentLoaded', handleHashChange);
