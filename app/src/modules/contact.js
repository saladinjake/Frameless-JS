// import { useReactive, useBind } from "../core/hooks/prod";

//     const { state, watch, setValueByPath } = useReactive({
//   user: {
//     name: '',
//     active: false,
//     role: 'editor',
//     gender: 'female'
//   }
// })

// // Bind all inputs automatically
// document.querySelectorAll('#myForm [name]').forEach(el => {
//   const path = el.name
//   useBind(el, state, path, { watch, setValueByPath })
// })

// // Debug UI
// watch('user.name', () => debug())
// watch('user.active', () => debug())
// watch('user.role', () => debug())
// watch('user.gender', () => debug())

// function debug() {
//   document.getElementById('debug').textContent = JSON.stringify(state.user, null, 2)
// }