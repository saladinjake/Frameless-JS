import { useStore, watchEffect } from '../../lib/main';

export function init({ props }: {props: any}) {
  const store : any = useStore({
    bio: props?.bio || '',
    age: props?.age
  });

  // watchEffect({
  //   props,
  //   store,
  //   callback: ({ props, state }: {props: any, state: any}) => {
  //     console.log('[watchEffect:my-profile]', { props, state });
  //     store.setState({ ...state, bio: state.bio });
  //   },
  // });

  return {
    store,
    props,
    template: `
      <div>
        <h4>My Profile Component</h4>
        <input type="text" data-model="bio" />
           <input type="text" data-model="age" />
        <p>Live bio: <span data-bind-text="bio"></span>   Has Age :<span data-bind-text="age"></span></p>
      </div>
    `,
    onMount({ props }: {props: any}) {
      console.log('[my-profile] onMount props', props);

       store.setState('bio', props.bio);
       store.setState('age', props.age);
    },
    onDestroy() {
      console.log('[my-profile] destroyed');
    },
    onPropsChange(newProps: any, oldState: any) {
      console.log('[my-profile] onMount props', props);
    },
  };
}

export {}