// our custom like pure Functional Component
import { bindText } from '../core/bindings';

import {
  seekDomWatch,
  peekComputed,
  peekDomRefs,
  peekSignal,
  peekStore,
} from '../core/hooks/index';

let unbindText;
export function init(params) {
  console.log('Route params:', params);
  const { refs, $ } = peekDomRefs();
  const [count, setCount, subscribe] = peekSignal(0);

  console.log(refs, '<<<');

  // can work with params
  if (params?.user) {
    const user = params?.user || 'Guest';
    const el = document.createElement('p');
    el.textContent = `Welcome, ${user}`;
    document.getElementById('app')?.appendChild(el);
  }

  return {
    sayHello({ event, element, dataset }) {
      alert(`Hello ${dataset.name}!`);
      element.style.background = '#ddd';
    },

    onMount() {
      bindText(refs.counterText, count, subscribe);
      $('#inc').addEventListener('click', () => {
        setCount((prev) => prev + 1);
      });
      $('#dec').addEventListener('click', () => {
        setCount((prev) => prev - 1);
      });
      console.log('About page loaded.');
      const el = document.getElementById('some_about_id');
      if (el) {
        const p = document.createElement('p');
        p.textContent = `Welcome, ${params.user || 'Guest'}!`;
        el.appendChild(p);
      }
    },
    onDestroy() {
      console.log('About page cleanup.');
      if (typeof unbindText === 'function') {
        unbindText(); //  Cleanup
      }
    },
  };
}
