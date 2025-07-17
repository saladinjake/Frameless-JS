import { hydrateComponent } from '../hydrations/hydrateComponent';
import { setupReactivity, watchEffect } from '../hooks/basic';
import { bindPropsToStore } from '../utils';

export function renderComponent(ComponentFn, props = {}) {
  const instance = ComponentFn(props);
  const wrapper = document.createElement('div');

  const html =
    typeof instance.template === 'string'
      ? instance.template
      : '<div><slot></slot></div>';

  wrapper.innerHTML = html;
  const root = wrapper.firstElementChild;

  const context = {
    props,
    ...instance,
  };

  // Bind props → state if available
  if (instance.store?.state) {
    for (const [key, val] of Object.entries(props)) {
      if (typeof instance.store.state[key] === 'undefined') {
        instance.store.setState(key, val);
      }
    }

    bindPropsToStore(instance);

    // Enable reactivity from props to store and call onPropsChanged
    watchEffect({
      props,
      store: instance.store,
      callback: ({ props, state }) => {
        for (const [key, val] of Object.entries(props)) {
          if (typeof state[key] === 'undefined') {
            instance.store.setState(key, val);
          }
        }

        if (typeof instance.onPropsChanged === 'function') {
          instance.onPropsChanged({ props, state });
        }
      },
    });
  }

  // Hydrate after DOM is ready
  requestAnimationFrame(async () => {
    if (instance.store) {
      setupReactivity(instance.store, root);
    }

    await hydrateComponent(root, context);

    if (typeof instance.onMount === 'function') {
      instance.onMount(context);
    }
  });

  return root;
}
