import { useStore } from "../../../lib/src/core/hooks/basic";

export function init({ params, app }) {
  // 3. Use it
  const store = useStore({ name: 'Victor' });

  return {
    store, //  expose this so slotAwareRender can use it
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
      <!--<img data-bind-attr="src:name" alt="User avatar" />-->
</div>
      </main>
     
    `,
    onMount({ app }) {
      console.log('[home.js] Mounted');
    },

    onDestroy() {
      console.log('[home.js] Destroyed');
    },
  };
}
