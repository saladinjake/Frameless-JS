import { handleHashChange } from './routecore';


interface IRoutes {
  path: string | RegExp;
  view: string | (() => Promise<string | { default: string }>) | any;
  layout?: string | (() => Promise<string | { default: string }>) | any;
  style?: string | string[];
  styles?: string | string[];
  script?: string | string[];
  scripts?: string | string[];
  scriptBase?: string;
  onLoad?: () => void;
}
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
export const bootstrapContainers = (routes: IRoutes[]) => {
  return {
    surge: (app: HTMLElement | Document | any) => {
      window.addEventListener('hashchange', () =>
        handleHashChange(app, routes),
      );
      window.addEventListener('DOMContentLoaded', () =>
        handleHashChange(app, routes),
      );
    },
  };
};
