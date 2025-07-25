import LoginTemplate from './components/Login.html?raw';

export function init({ params} : {params: any}) {
  return {
    template: LoginTemplate,
    onMount() {},
  };
}
