import { hydrateComponent } from '../hydrations/hydrateComponent';

export function renderComponent(ComponentFn, props = {}) {
  const component = ComponentFn(props);
  const wrapper = document.createElement('div');

  const html =
    typeof component.template === 'string'
      ? component.template
      : '<div><slot></slot></div>';

  wrapper.innerHTML = html;

  // Automatically hydrate on the next frame
  requestAnimationFrame(() => {
    const root = wrapper.firstElementChild;

    // Call onMount and hydrate props/dom
    component.onMount?.(props);

    //  Hydration hidden from user
    hydrateComponent(root, props, component.computed || {});
  });

  return wrapper.firstElementChild;
}
