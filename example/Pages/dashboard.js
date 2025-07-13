export function navigate(path, query = {}) {
  const queryStr = new URLSearchParams(query).toString();
  location.hash = queryStr ? `#${path}?${queryStr}` : `#${path}`;
}

export function init(params) {
  return {
    onMount() {
      const el = document.getElementById('some_dashboard_id');
      if (el) {
        const msg = document.createElement('p');
        msg.textContent = `Hello, ${params.user || 'Guest'}!`;
        el.appendChild(msg);
      }
    },

    onDestroy() {
      console.log('about.js cleanup');
    },

    beforeEnter(params) {
      if (!params.user) {
        alert('Please provide a user!');
        navigate('login');
        return false;
      }
      return true;
    },

    greet({ dataset }) {
      alert(`Hello ${dataset.name}`);
    },
  };
}
