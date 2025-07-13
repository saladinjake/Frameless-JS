# Frameless.js – A Native, Component-First SPA Micro Framework

- ⚡️ Lightweight. 💡 Flexible. 🧩 Component-based. 🚫 No virtual DOM.
Perfect for building fast, modern single-page applications using just native JavaScript + HTML.

# 📦 Features
⚙️ SPA router with dynamic loading of HTML + JS

## ✨ Component system , without Xml related markup or need for a VDOM

## 🔄 init() or defineComponent() with lifecycle hooks: onMount, onDestroy, beforeEnter

## 🧠 Context API with provide(), inject() and provideGlobal()

## ⚡️ useState, useEffect, useRef, useSignal – built-in hooks

## 🔌 Plugin system (app.use(...))

## 🔐 Middleware/guards on routes

## 🧱 Layout engine with multi-slot support (<slot name="...">)

## 🎯 Router link (<a router-link href="/dashboard">)

## 🌈 Transitions + Suspense support

## 🌍 SSR-friendly (static views, hydration-ready)

## 🚀 Zero-dependency + Vite-ready

# 🚀 Quick Start
````
npx create-frmaeless-app my-app
cd my-app
npm install
npm run dev
````

##  📁 Folder Structure
````
my-app/
├── index.html
├── vite.config.js
├── public/
│   └── views/
│       ├── home.html
│       └── about.html
├── src/
│   ├── main.js             # App entry
│   ├── routes.js           # SPA route definitions
│   ├── pages/
│   │   ├── Home.js
│   │   └── About.js
│   ├── components/
│   │   └── Card.js
│   ├── layouts/
│   │   └── MainLayout.html
│   ├── hooks/
│   │   └── useAuth.js
│   ├── middlewares/
│   │   └── authGuard.js
│   ├── plugins/
│   │   └── logger.js
│   └── router/
│       ├── router.js
│       └── scripts.js
└── core/                   # Core  engine (if local)
    ├── app.js
    ├── context.js
    ├── layout.js
    ├── lifecycle.js
    └── utils/
````

## 🧩 Routing
routes.js
````
export const routes = [
  {
    path: '/',
    view: 'home.html',
    script: 'Home.js',
    layout: 'MainLayout.html',
    middleware: ['authGuard']
  },
  {
    path: '/about',
    view: 'about.html',
    script: 'About.js'
  },
  {
    path: '*',
    view: '404.html'
  }
];
````

## ⚙️ Page: Home.js


````
Option 1: Classic init()

export function init(params) {
  document.querySelector('[data-id="user"]').textContent = `Welcome ${params.user.name}`;
}

Option 2: defineComponent() (with render return)

export const Home = defineComponent(({ props }) => {
  return {
    render: () => `
      <section>
        <h1>Hello, ${props.user}</h1>
        ${Card({ title: "Hot", description: "🔥🔥🔥" })}
      </section>
    `
  };
});

````

## 🧠 Context API
````
In root:
provideGlobal('auth', {
  user: { name: 'Juwa' },
  login() { ... }
});

In component:

const auth = inject('auth');
auth.login();

````

## 🔄 Lifecycle Hooks

````
export const Page = defineComponent(() => {
  onMount(() => console.log('Mounted!'));
  onDestroy(() => console.log('Leaving...'));

  return {
    render: () => `<p>Hi!</p>`
  };
});

````

## 🪝 Built-in Hooks
```` 
Hook	Description
useKeep()	 state house with reactivity
useRef()	DOM ref, assigned post-render
useWatch()	Runs after render, with cleanup
useSignal()	Lightweight global signal/store
useStore()  stateManagement
...more
````

## 🧱 Layouts with Slots
````
layouts/MainLayout.html
<header>Main Header</header>
<main>
  <slot></slot>
</main>
<footer>Footer</footer>
Automatically used if layout: 'MainLayout.html' is set in route.
````

## 🔌 Plugin System
````
export default function LoggerPlugin(app) {
  app.provideGlobal('logger', {
    log: (...args) => console.log('[LOG]', ...args)
  });
}


// main.js
import LoggerPlugin from './plugins/logger.js';
app.use(LoggerPlugin);
````

## 🛠 router-link Navigation


<a href="/about" router-link>Go to About</a>
Supports SPA navigation with history API.
````

## 🌈 Transition Support
````
#app.fade-in { animation: fadeIn 0.3s ease-in; }
#app.fade-out { animation: fadeOut 0.3s ease-out; }
Built-in support for basic transitions between pages.
````

## 📦 Vite + Build Setup
````
// vite.config.js
export default {
  base: './'
};

Use import.meta.glob() for dynamic JS imports.

🧪 Example Component

export const Card = defineComponent(({ title, description }) => `
  <div class="card">
    <h3>${title}</h3>
    <p>${description}</p>
  </div>
`);

````
## ⚡️ Future Roadmap
- SSR support with hydration
- Static site generator (frameless export)
- DevTools Extension
- Form handling + Validation API
- Built-in transitions/animations system
- CLI plugin registry
- Native mobile output with Capacitor

## 🧠 Philosophy
- No Virtual DOM. No massive runtime.
- Just components, routing, lifecycle, and performance — all using native browser power.

## 🛠 How to Contribute
````
git clone https://github.com/saladinjake/Frameles-JS.git
cd frameless-app
npm install
npm run dev
📖 Documentation
See full docs at: comingsoon.dev (Coming soon)
````
