import { useStore, bind } from '../core/hooks/basic';

export function init(params) {
  // using store
  const store = useStore({ name: 'Victor' });
  setTimeout(() => {
    store.state.name = 'Juwa';
  }, 3000);
  console.log(params, '>>>');

  return {
    template: `
     
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
