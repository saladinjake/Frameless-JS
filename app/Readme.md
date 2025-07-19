## Frameless.js – AProgressive Native, Component-First SPA Micro Framework
#             ````Rethink , Reshape And Rewind Back to Vanilla JS  ````

### - ⚡️The Most Un-opinionated Light weight  Modern  Javascript framework. 💡 Flexible. 🧩 Component-based. 🚫 No virtual DOM.
Perfect for building fast, modern single-page applications using just native JavaScript + HTML.

# 📦 Features
⚙️ SPA router with dynamic loading of HTML + JS

### ✨ Component system , without Xml related markup or need for a VDOM

### 🔄 init() or defineComponent() 

###  Full Lifecycle Flow
````
Phase	Hook	When it runs with lifecycle hooks: onMount, onDestroy, beforeEnter
Before inject	onDestroy()	Clean up old page (event listeners, etc)
After inject	onMount()	DOM is injected and visible
During usage	data-action	Bound actions like submitForm()

export function init(params) {
  return {
    viewCourse({ dataset }) {
      const id = dataset.id;
      location.hash = `#course/${id}`;
    },

    onMount() {
      console.log("Courses view mounted");
    },

    onDestroy() {
      console.log("Cleaning up course page");
    }
  };
}

````

### 🧠 Context API with provide(), inject() and provideGlobal()

### ⚡️ useKeep, useWatcher, useRef, useSignal + More built-in hooks

### 🔌 Plugin system (app.use(...))

### 🔐 Middleware/guards on routes

### 🧱 Layout engine with multi-slot support (<slot name="...">)

````
 Optional layout per route
 <slot> support like React
 useDomRefs() for cleaner DOM access
 $() helper like jQuery but scoped
 All works with lifecycle (onMount)
 Layouts are fully dynamic HTML, not hardcoded

 Nested Layouts with <slot> injection	
 Named Slots (<slot name="sidebar">)	
 Scoped DOM Access via useDomRefs() and $() like jquery	
 Optional Global State via useStore()	


<div class="layout">
  <header><h1>App Header</h1></header>
  <main><slot></slot></main>
  <footer><small>© 2025</small></footer>
</div>

````

### 🎯 Router link (<a router-link href="/dashboard">)

### 🌈 Transitions + Suspense support

### 🌍 SSR-friendly (static views, hydration-ready)

### 🚀 Zero-dependency + Vite-ready

### Extras
 Lifecycle Hooks 
 Dynamic Route Params	
 Middleware Support	
 Programmatic Navigation	
 Fancy Loading Animation


# 🚀 Quick Start
````
npx create-frmaeless-app my-app
cd my-app
npm install
npm run dev
````

###  📁 Folder Structure
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

### MVP FEATURES

````
⚙️ Core Routing & Page Features
Feature	Description
 Hash-based Routing	No server needed, works with static hosting
 Dynamic Parameters	e.g. /user/:id, auto-parsed into params
 RegExp Routes	e.g. /blog/(.*), for advanced flexibility
 Fallback Routes	Support * wildcard + /folder/index fallback
 Middleware Support	Per-route + global — auth, guards, logging
 Default Route / Landing Page	Load home or dashboard on empty hash
 Programmatic Navigation	navigate('route') from anywhere
 View Injection	Load partial HTML and inject into #app
 Scoped JS Execution	Each page module gets params and stays isolated
 Multiple Scripts per Route	Load pages/user.js, pages/user-stats.js, etc.

🧠 Developer Experience (DX)
Feature	Description
 init(params) Convention	Every page can return actions, lifecycle, etc.
 data-action Binding	Declarative events like data-action="submitForm"
 Built-in bindActions()	Auto-wires methods to elements with minimal code
 DOM-Ready Safety	Built-in requestAnimationFrame() for safe DOM use
 No Window Pollution	Keeps all logic modular, no globals
 Live Reloading via Vite	Full dev experience with no bundler
 Friendly Error Messages	Dev-time alerts when views or scripts are missing
 Named Route Helpers (optional)	navigateTo('user', { id: 4 })

⚡ Performance & Loading
Feature	Description
 On-demand JS Module Loading	No preload — each route loads only its JS
 HTML Fragment Injection	Avoids full page reloads
 Minimal JS Overhead	No framework dependency (Vanilla + Vite)
 Loading Spinner Support	Show/hide loader with async state
 Script Cache Busting	Prevent stale code via ?t=${Date.now()}

🏗️ Large App Support / Architecture
Feature	Description
 Modular Page Folder Structure	Each view has its own .html + .js
 Route-Level Middleware	Protect routes without mixing page logic
 Layouts / Nested Views	Optional shared layout container injection
 Shared Services/Utils	Central utility modules (auth, store, http)
 Simple Plugin System (optional)	Hook into route load lifecycle
 Nested Routing Support (optional)	Support /admin/users/:id style nesting
 Scoped Action Prefixes	Prevent action collision in deeply nested UIs
````

### 🧩 Routing
routes.js
````

 Summary of Router Features
Feature	 Supported
Static routes (home, about)	
Nested paths (admin/dashboard)	
Param parsing (?user=vic)	
Multiple scripts per route	
Middleware per route	
Global middleware	
Dynamic route with regex	
Extract match groups to params	

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

### ⚙️ Page: Home.js


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

### 🧠 Context API
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

### 🔄 Lifecycle Hooks

````
export const Page = defineComponent(() => {
  onMount(() => console.log('Mounted!'));
  onDestroy(() => console.log('Leaving...'));

  return {
    render: () => `<p>Hi!</p>`
  };
});

````

### 🪝 Built-in Hooks
```` 
Hook	Description
useKeep()	 state house with reactivity
useRef()	DOM ref, assigned post-render
useWatch()	Runs after render, with cleanup
useSignal()	Lightweight global signal/store
useStore()  stateManagement
...more
````

### 🧱 Layouts with Slots
````
layouts/MainLayout.html
<header>Main Header</header>
<main>
  <slot></slot>
</main>
<footer>Footer</footer>
Automatically used if layout: 'MainLayout.html' is set in route.
````

### 🔌 Plugin System
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

### 🛠 router-link Navigation


<a href="/about" router-link>Go to About</a>
Supports SPA navigation with history API.
````

### 🌈 Transition Support
````
#app.fade-in { animation: fadeIn 0.3s ease-in; }
#app.fade-out { animation: fadeOut 0.3s ease-out; }
Built-in support for basic transitions between pages.
````

### 📦 Vite + Build Setup
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
### ⚡️ Future Roadmap
- SSR support with hydration
- Static site generator (frameless export)
- DevTools Extension
- Form handling + Validation API
- Built-in transitions/animations system
- CLI plugin registry
- Native mobile output with Capacitor

### 🧠 Philosophy
- No Virtual DOM. No massive runtime.
- Just components, routing, lifecycle, and performance — all using native browser power.

### 🛠 How to Contribute
````
git clone https://github.com/saladinjake/Frameles-JS.git
cd frameless-app
npm install
npm run dev
📖 Documentation
See full docs at: comingsoon.dev (Coming soon)
````



# FUTURE ROAD

| Feature                                        | Description                                     |
| ---------------------------------------------- | ----------------------------------------------- |
| ⬜ Auth Guards + Redirects                      | Protect routes with `isLoggedIn()`              |
| ⬜ Route-Based Code Splitting                   | e.g. preload `pages/dashboard.js` in background |
| ⬜ Component Registry / Factory                 | Dynamically register and attach UI components   |
| ⬜ Virtual DOM (tiny layer)                     | Avoid re-renders or dom-diff heavy views        |
| ⬜ Mini Store (state manager)                   | Share global state across pages                 |
| ⬜ Configurable `preload()` / `cleanup()` hooks | Control lifecycle cleanups                      |

🧩 More to come
🔀 Route Transition Animations: fade, slide between views

🔌 Hot Module Override Support (in dev): reload only current view

🌐 Built-in i18n Utility: Replace strings from JSON

📦 Single HTML + Multi-Page SPA Feel

🧠 Dev Inspector UI: toggle route/params info in a sidebar

📝 Inline Markdown Rendering: render docs/blog from .md