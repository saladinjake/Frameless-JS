import { init as MyProfile } from './components/childComponentSample';

import { useStore, defineComponent } from "../lib/main";


defineComponent('my-profile', () => Promise.resolve({ init: MyProfile }));

export function init({ props = {} }) {

  //SAMPLE EXAMPLE
  // const store = useStore({
  //   name: 'Victor',
  //   image: 'https://placekitten.com/200/200',
  // });


  //FULL FORM BINDING EXAMPPLE



  const store = useStore({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
    address: '',
    accountType: '',
    initialDeposit: '',
    bvn: '',
    //  passport: null as File | null,
      photo: null as File | null,
  });




  return {
    store,
    props,
    template: `
    <main>
     <h2>Welcom to Frameless</h2>
     <div slot="header">Main Section</div>
      <div slot="sidebar">
       
        <my-profile :bio="this is a demo"  :age="44"></my-profile>
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
    onMount(option: any) {
      console.log('[home.js] Mounted', option);





    },
    onDestroy() {
      console.log('[home.js] Destroyed');
    },

    saveRecord(){
       // Gather form data
        const customerData = { ...store.state };

        console.log('Submitting Customer:', customerData);
    }
  };
}

// export {}





// export async function init({ props }: {props: any}) {
//   const store = useStore({ // or createStore
//     name: 'Victor',
//     count: 0,
//   });




// // type MyState = {
// //   count: number;
// //   name: string;
// // };

// // const store = createStore<MyState>({
// //   count: 0,
// //   name: 'Victor'
// // });

// // store.subscribe('count', (val) => {
// //   console.log('New count:', val);
// // });

// // store.setState('count', 5); // Logs: New count: 5


//   return {
//     store,
//     template: `
//       <div>
//         <h1>Hello, tester {{name}}!</h1>
//         <input type="text" data-model="name" placeholder="Enter your name" />

//         <p data-bind-text="name"></p>

//         <hr />

//         <button id="inc">Increment</button>
//         <p>Counter: {{count}}</p>
//       </div>
//     `,
//     onMount({ store }: {store: any}) {
//       const incBtn = document.getElementById('inc');
//       incBtn?.addEventListener('click', () => {
//         store.setState('count', store.state.count + 1);
//       });
//     },
//   };
// }
