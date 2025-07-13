// our custom like pure Functional Component
import { useDomRefs } from '../../src/core/hooks/useDomRefs';
import { useStore } from '../../src/core/hooks/useStore';
import { useDomWatch } from '../../src/core/hooks/useDomWatch';

export function init(params) {
  const { refs, $ } = useDomRefs();
  const [getUser, setUser, subscribe] = useStore('user', { name: 'Guest' });

  console.log(refs, $);

  requestAnimationFrame(() => {
    setUser({ name: 'Victor' });
  });

  console.log(getUser().name, '<<>?'); // Victor

  console.log(params, '>>>');
  return {
    onMount() {
      $('#title').textContent = 'Updated!';

      useDomWatch(() => {
        refs.welcome.textContent = `Hey there, ${getUser().name}!`;
      }, [{ subscribe }]);

      console.log('mounted...');
    },
    onDestroy() {
      console.log('About page cleanup.');
    },
  };
}
