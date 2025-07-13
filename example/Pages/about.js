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
      console.log('About page loaded.');
    },
    onDestroy() {
      console.log('About page cleanup.');
    },
  };
}
