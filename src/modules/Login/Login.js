// import LoginTemplate from './components/Login.html';
import { peekDomInputsState } from '../../core/hooks/index';

export function init(params) {
  const [userName, setUserName] = peekDomInputsState(
    'userName',
    params?.user || '',
  );

  return {
    template: `
      <div>
  <h2>Hello <span data-ref="userName"></span>!</h2>

  <input
    type="text"
    placeholder="Enter name"
    data-model="userName"
  />
</div>
    `,
    onMount() {
      console.log('User name:', userName());
    },
    onDestroy() {
      console.log('Clean up...');
    },
    onComputed() {
      // Optional computed logic
    },
  };
}
