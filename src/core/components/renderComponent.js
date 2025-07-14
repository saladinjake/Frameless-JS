import { hydrateComponent } from '../hydrations/hydrateComponent';

export function renderComponent(ComponentFn, props = {}) {
  const component = ComponentFn(props);
  const wrapper = document.createElement('div');

  const html =
    typeof component.template === 'string'
      ? component.template
      : '<div><slot></slot></div>';

  wrapper.innerHTML = html;

  requestAnimationFrame(() => {
    component.onMount?.(props);
    hydrateComponent(wrapper, props);
  });

  return wrapper.firstElementChild;
}
