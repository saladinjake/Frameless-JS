import { peekSignal, useFormBinding } from '../../core/hooks';

export function init() {
  const [profile, setProfile] = peekSignal({ name: 'Victor', city: 'Lagos' });
  console.log(profile);
  return {
    template: `
      <div class="card">
        <h3>Hello <span data-ref="profile.name"></span></h3>
        <input data-model="profile.name" placeholder="Name" />

        <p>City: <span data-ref="profile.city"></span></p>
        <input data-model="profile.city" placeholder="City" />
      </div>
    `,
    onMount() {
      useFormBinding(profile, setProfile);
    },
  };
}
