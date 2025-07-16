import { useStore, setupReactivity } from '../core/hooks/basic';
import { defineComponent } from '../core/components/defineComponent';

import { init as MyProfile } from './components/childComponentSample';

defineComponent('my-profile', () => Promise.resolve({ init: MyProfile }));

export function init({ params, app }) {
  const store = useStore({
    name: 'Victor',
    image: 'https://placekitten.com/200/200',
  });

  // Just change name after 3s to prove it's reactive
  setTimeout(() => {
    store.state.name = 'Juwa 🚀';
  }, 3000);

  return {
    store,
    template: `
    <main>
     <h2>Welcom to Frameless</h2>
     <div slot="header">Main Section</div>
      <div slot="sidebar">
       
        <my-profile></my-profile>
      </div>

      <div>
       
        <label>Your Name:</label>
        <h3>Hello, <strong data-bind-text="name"></strong>!</h3>
        <input type="text" data-model="name" />
       
      </div>

      <!-- Type 1: Template slot -->
<template slot="more1">
  <h1>This is the header</h1>
</template>

<!-- Type 2: Component slot -->
<my-profile slot="more2"></my-profile>

<!-- Type 3: Fallback unnamed content -->
<div>
  <p>This is default content in the unnamed slot</p>
     <my-profile></my-profile>
</div>
      </main>
    `,
    onMount(option) {
      console.log('[home.js] Mounted', option);
    },
    onDestroy() {
      console.log('[home.js] Destroyed');
    },
  };
}
