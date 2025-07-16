export function init(params) {
  // const [profile, setProfile] = peekSignal({ name: 'Victor', city: 'Lagos' });
  // console.log(profile);
  return {
    template: `
      <div class="card">
        <h3>Hello <span data-ref="profile.name"></span></h3>
        <input data-model="profile.name" placeholder="Name" />

        <p>City: <span data-ref="profile.city"></span></p>
        <input data-model="profile.city" placeholder="City" />
      </div>

<template slot="more">
  <h1>This is the header</h1>
</template>


<my-profile slot="more2"></my-profile>


<div>
  <p>This is default content in the unnamed slot</p>
  <another-component></another-component>
</div>

    `,
    onMount() {
      useFormBinding(profile, setProfile);
    },
  };
}
