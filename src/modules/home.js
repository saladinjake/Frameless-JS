// our custom like pure Functional Component
import { peekDomRefs, peekStore, seekDomWatch } from '../core/hooks/index';

export function init(params) {
  const { refs, $ } = peekDomRefs();
  const [getUser, setUser, subscribe] = peekStore('user', { name: 'Guest' });

  console.log(refs, $);

  requestAnimationFrame(() => {
    setUser({ name: 'Victor' });
  });

  console.log(getUser().name, '<<>?'); // Victor

  console.log(params, '>>>');
  return {
    template: `
       <!--free to write html codes -->
    `,
    onMount() {
      $('#title').textContent = 'Updated!';
      seekDomWatch(() => {
        refs.welcome.textContent = `Hey there, ${getUser().name}!`;
      }, [{ subscribe }]);
      console.log('mounted...');
    },
    onDestroy() {
      console.log('About page cleanup.');
    },
  };
}
