export function navigate(path, query = {}) {
  const queryStr = new URLSearchParams(query).toString();
  location.hash = queryStr ? `#${path}?${queryStr}` : `#${path}`;
}

export function init(params) {
  return {
    template: `
      <div slot="sidebar">
        <p><strong>Injected Sidebar</strong> via init().template</p>
      </div>
      <div>
        <h3 slot="">Dynamic Section</h3>
        <p>This was injected at runtime and hydrated.</p>
      </div>
    `,
    onMount({ app }) {
      console.log('[home.js] Mounted');
    },
    onDestroy() {
      console.log('[home.js] Destroyed');
    },
  };
}

// export function init(params) {
//   return {
//     onMount() {
//       const el = document.getElementById('some_dashboard_id');
//       if (el) {
//         const msg = document.createElement('p');
//         msg.textContent = `Hello, ${params.user || 'Guest'}!`;
//         el.appendChild(msg);
//       }
//     },

//     onDestroy() {
//       console.log('about.js cleanup');
//     },

//     beforeEnter(params) {
//       if (!params.user) {
//         alert('Please provide a user!');
//         navigate('login');
//         return false;
//       }
//       return true;
//     },

//     greet({ dataset }) {
//       alert(`Hello ${dataset.name}`);
//     },
//   };
// }
