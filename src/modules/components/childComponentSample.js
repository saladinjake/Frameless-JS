import { useStore, watchEffect } from '../../core/hooks/basic';
import { setupBindingReactivity, setupModelBinding } from '../../core/utils';

export function init({ props }) {
  const store = useStore({
    bio: props?.bio,
  });

  watchEffect({
    props,
    store,
    callback: ({ props, state }) => {
      console.log('[watchEffect triggered]', { props, state });
      // 🔁 Optional: rerender logic or sync UI manually if needed
      console.log(state.bio);
    },
  });

  return {
    // store,
    // props,
    template: `
      <div>
        <h4>My Profile Component</h4>
        <input type="text" data-model="bio"  />
        <p>Live bio: <span data-bind-text="bio"></span></p>
      </div>
    `,
    onMount() {
      console.log('[my-profile] mounted', props);
      store.setState({ ...store.state, bio: props.bio });
    },
    onDestroy() {
      console.log('[my-profile] destroyed');
    },
  };
}
