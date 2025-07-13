export function init(params) {
  console.log('About page initialized with params:', params);

  const user = params.user || 'Guest';
  const el = document.createElement('p');
  el.textContent = `Welcome, ${user}`;
  document.getElementById('app')?.appendChild(el);
}
