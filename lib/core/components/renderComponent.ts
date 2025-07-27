import { hydrateComponent } from '../hydrations/hydrateComponent';
import { setupReactivity, watchEffect } from '../hooks/basic';
import { bindPropsToStore } from '../utils';

type Props = Record<string, any>;
type State = Record<string, any>;


interface Store {
  state: State;
  setState: (key: string, value: any) => void;
}

interface ComponentInstance {
  template?: string;
  store?: Store;
  onMount?: (ctx: any) => void;
  onPropsChanged?: (ctx: { props: Props; state: State }) => void;
}

type ComponentFn = (props: Props) => ComponentInstance;

/**
 * Renders a component and sets up its reactive lifecycle.
 * 
 * @param ComponentFn - The function that returns the component definition.
 * @param props - Initial props to pass to the component.
 * @returns HTMLElement root of the component.
 */
export function renderComponent(ComponentFn: ComponentFn, props: Props = {}): HTMLElement {
  const instance = ComponentFn(props);
  const wrapper = document.createElement('div');

  // Default to <slot> if no template
  const html = typeof instance.template === 'string'
    ? instance.template
    : '<div><slot></slot></div>';

  wrapper.innerHTML = html;
  const root = wrapper.firstElementChild as HTMLElement;

  const context = {
    props,
    ...instance,
  };

  // Sync props into store state if store is present
  if (instance.store?.state) {
    for (const [key, val] of Object.entries(props)) {
      if (typeof instance.store.state[key] === 'undefined') {
        instance.store.setState(key, val);
      }
    }

    bindPropsToStore(instance);

    watchEffect({
      props,
      store: instance.store,
      callback: ({
        props,
        state,
      }: {
        props: Record<string, any>;
        state: Record<string, any>;
      }) => {
        for (const [key, val] of Object.entries(props)) {
          if (typeof state[key] === 'undefined') {
            instance.store!.setState(key, val);
          }
        }

        if (typeof instance.onPropsChanged === 'function') {
          instance.onPropsChanged({ props, state });
        }
      },
    });
  }

  // Hydrate and call lifecycle hooks after DOM paints
  requestAnimationFrame(async () => {
    if (instance.store) {
      setupReactivity(instance.store as any, root);
    }

    await hydrateComponent(root, context);

    if (typeof instance.onMount === 'function') {
      instance.onMount(context);
    }
  });

  return root;
}