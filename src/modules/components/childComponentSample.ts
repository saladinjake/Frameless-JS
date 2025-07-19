import { useStore, watchEffect } from 'frameless-js';

export function init({ props }: {props: any}) {
  const store : any = useStore({
    bio: props?.bio || '',
  });

  watchEffect({
    props,
    store,
    callback: ({ props, state }: {props: any, state: any}) => {
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
    onMount({ props }: {props: any}) {
      console.log('[my-profile] onMount props', props);

      store.setState({ ...store.state, bio: props.bio });
    },
    onDestroy() {
      console.log('[my-profile] destroyed');
    },
    onPropsChange(newProps: any, oldState: any) {
      console.log('[my-profile] onMount props', props);
    },
  };
}

