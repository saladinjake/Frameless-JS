import { useStore, setupReactivity } from '../core/hooks/basic';

export function init({ params, app }) {
  // 3. Use it
  const store = useStore({ name: 'Victor' });

  // Reactive update example:
  setTimeout(() => {
    store.state.name = 'Juwa 🚀';
  }, 3000);
  return {
    store, //  expose this so slotAwareRender can use it
    template: `
      <div slot="sidebar">
        <p><strong>Injected Sidebar</strong> via init().template</p>
      </div>
      <div>
        <h3 slot="">Dynamic Section</h3>
        <p>This was injected at runtime and hydrated.</p>
        <div>
          <label>Your Name:</label>
          <h3>Hello, <strong data-bind-text="name"></strong>!</h3>
          <input type="text" data-model="name" />
          <img data-bind-attr="src:name" alt="User avatar" />
        </div>
      </div>
    `,
    onMount({ app }) {
      setupReactivity(store, app);
      console.log('[home.js] Mounted');

      // Example reactive update
      setTimeout(() => {
        store.state.name = 'Juwa 🚀';
      }, 3000);
    },

    onDestroy() {
      console.log('[home.js] Destroyed');
    },
  };
}
