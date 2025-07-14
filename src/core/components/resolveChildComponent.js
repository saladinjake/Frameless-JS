import { renderComponent } from './renderComponent';

export function resolveChildComponents(root) {
  const nodes = root.querySelectorAll('[data-component]');
  nodes.forEach((node) => {
    const name = node.getAttribute('data-component');
    const componentFn = window.__components?.[name];
    if (componentFn) {
      const props = JSON.parse(node.dataset.props || '{}');
      const rendered = renderComponent(componentFn, props);
      node.replaceWith(rendered);
    }
  });
}
