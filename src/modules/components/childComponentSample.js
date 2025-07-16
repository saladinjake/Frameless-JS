import { useStore, setupReactivity } from '../../core/hooks/basic';

export function init() {
  const store = useStore({ bio: 'This is my profile' });

  return {
    store,
    template: `
      <div>
        <h4>My Profile Component</h4>
        <input type="text" data-model="bio" />
        <p>Live bio: <span data-bind-text="bio"></span></p>
      </div>
    `,
    onMount() {
      console.log('[my-profile] mounted');
    },
    onDestroy() {
      console.log('[my-profile] destroyed');
    },
  };
}
