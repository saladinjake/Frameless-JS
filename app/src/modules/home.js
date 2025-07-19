import { init as MyProfile } from './components/childComponentSample';

import { useStore, setupReactivity } from '../../../lib/src';
import { defineComponent } from '../../../lib/src/core/components/defineComponent';

defineComponent('my-profile', () => Promise.resolve({ init: MyProfile }));

export function init({ props = {} }) {
  const store = useStore({
    name: 'Victor',
    image: 'https://placekitten.com/200/200',
  });

  return {
    store,
    template: `
    <main>
     <h2>Welcom to Frameless</h2>
     <div slot="header">Main Section</div>
      <div slot="sidebar">
       
        <my-profile :bio="this is a demo"></my-profile>
      </div>

      <div style="margin-top:20px">
       
        <label>Your Name:</label>
        <h3>Hello, <strong data-bind-text="name"></strong>!</h3>
        <input type="text" data-model="name" />
       
      </div>

      <!-- Type 1: Template slot -->
<template slot="more1">
  <h1>This is the header</h1>
</template>

<!-- Type 2: Component slot -->
<div slot="more2">
  another slot method
</div>

<!-- Type 3: Fallback unnamed content -->
<div>
  <p>This is default content in the unnamed slot</p>
   
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
