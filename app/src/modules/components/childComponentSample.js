import { useStore, watchEffect } from '../../../../lib/src/core/hooks/basic';

export function init({ props }) {
  const store = useStore({
    bio: props?.bio || '',
  });

  watchEffect({
    props,
    store,
    callback: ({ props, state }) => {
      console.log('[watchEffect:my-profile]', { props, state });
      store.setState({ ...state, bio: state.bio });
    },
  });

  return {
    store,
    template: `
      <div>
        <h4>My Profile Component</h4>
        <input type="text" data-model="bio" />
        <p>Live bio: <span data-bind-text="bio"></span></p>
      </div>
    `,
    onMount({ props }) {
      console.log('[my-profile] onMount props', props);

      store.setState({ ...store.state, bio: props.bio });
    },
    onDestroy() {
      console.log('[my-profile] destroyed');
    },
    onPropsChange(newProps, oldState) {
      console.log('[my-profile] onMount props', props);
    },
  };
}
