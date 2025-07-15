import { useStore, bind } from '../core/hooks/basic';

export function init(params) {
  const store = useStore({ name: 'Victor' });

  setTimeout(() => {
    store.state.name = 'Juwa';
  }, 3000);

  console.log(params, '>>>');
  return {
    template: `
        <input data-bind="name" />
  <p>Hello, <span data-bind-text="name"></span>!</p>
    `,
    onMount() {
      bind(store);
      console.log('mounted...');
    },
    onDestroy() {
      console.log('About page cleanup.');
    },
  };
}
