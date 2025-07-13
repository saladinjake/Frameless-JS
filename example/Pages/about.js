// our custom like pure Functional Component

export function init(params) {
  console.log('Route params:', params);

  // can work with params
  if (params?.user) {
    const user = params?.user || 'Guest';
    const el = document.createElement('p');
    el.textContent = `Welcome, ${user}`;
    document.getElementById('app')?.appendChild(el);
  }

  return {
    sayHello({ event, element, dataset }) {
      alert(`Hello ${dataset.name}!`);
      element.style.background = '#ddd';
    },

    onMount() {
      requestAnimationFrame(() => {
        console.log('About page loaded.');
        const el = document.getElementById('some_about_id');
        if (el) {
          const p = document.createElement('p');
          p.textContent = `Welcome, ${params.user || 'Guest'}!`;
          el.appendChild(p);
        }
      });
    },
    onDestroy() {
      console.log('About page cleanup.');
    },
  };
}
