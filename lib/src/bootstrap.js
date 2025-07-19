import { handleHashChange } from './routecore';

// export const routes = [
//   {
//     path: '/',
//     layout: '/layouts/Main.html',                  // From public/
//     view: '/pages/Home.html',                      // From public/
//   },
//   {
//     path: '/about',
//     layout: () => import('../layouts/Main.html?raw'), // From src/ via dynamic import
//     view: 'About.html',                            // Auto fallback to /src/views/About.html
//   },
//   {
//     path: '/contact',
//     view: '<h2>Contact us directly!</h2>'          // Raw HTML string
//   },
// ];
// const app = document.getElementById("app")
//  bootstrapContainers(routes).surge(app)
export const bootstrapContainers = (routes) => {
  return {
    surge: (app) => {
      window.addEventListener('hashchange', () =>
        handleHashChange(app, routes),
      );
      window.addEventListener('DOMContentLoaded', () =>
        handleHashChange(app, routes),
      );
    },
  };
};
