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
