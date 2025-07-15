import { hydrateInputsBindings } from '../bindings/hydrateInputs';
import { resolveChildComponents } from '../components/resolveChildComponent';
import { hydrateElmentAttibutesBindings } from '../bindings/hydrateBindings';

export function hydrateComponent(root, props = {}, computed = {}) {
  // 1. Form input bindings
  Object.keys(props).forEach((key) => {
    hydrateInputsBindings(key, props[key], (val) => {
      props[key] = val;
    });
  });

  // element attributes bindings
  hydrateElmentAttibutesBindings(root, props);

  // 3. Resolve child components
  resolveChildComponents(root);
}
