import { useStore, usePropsStore, watchEffect } from '../../core/hooks/basic';
import { syncStoreAndProps } from '../../core/utils';

export function init({ props }) {
  const store = useStore({
    bio: props?.bio,
  });

  setTimeout(() => {
    store.state.bio = 'Updated after 2s';
  }, 2000);

  watchEffect({
    props,
    store,
    callback: ({ props, state }) => {
      console.log('[watchEffect triggered]', { props, state });
      // You can re-render or update something here
    },
  });

  return {
    store,
    props,
    template: `
      <div>
        <h4>My Profile Component</h4>
        <input type="text" data-model="bio"  />
        <p>Live bio: <span data-bind-text="bio"></span></p>
      </div>
    `,
    onMount() {
      console.log('[my-profile] mounted', props);
      syncStoreAndProps(store, props, 3000);
    },
    onDestroy() {
      console.log('[my-profile] destroyed');
    },
  };
}
