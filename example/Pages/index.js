// our custom like pure Functional Component
import { useDomRefs } from '../../src/core/hooks/useDomRefs';
import { useStore } from '../../src/core/hooks/useStore';

export function init(params) {
  const { refs, $ } = useDomRefs();
  const [getUser, setUser] = useStore('user', { name: 'Guest' });

  console.log(refs, $);

  requestAnimationFrame(() => {
    setUser({ name: 'Victor' });
  });

  console.log(getUser().name, '<<>?'); // Victor

  console.log(params, '>>>');
  return {
    onMount() {
      refs.welcome.textContent = 'Hey there!';
      $('#title').textContent = 'Updated!';
    },
  };
}
