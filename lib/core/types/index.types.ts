import { useStore } from "../hooks/basic";
export interface Route {
  path: string | RegExp;
  view: string | (() => Promise<string | { default: string }>);
  layout?: string | (() => Promise<string | { default: string }>);
  style?: string | string[];
  styles?: string | string[];
  script?: string | string[];
  scripts?: string | string[];
  scriptBase?: string;
  onLoad?: () => void;
}



declare global {
  interface Window {
    __currentDestroy?: () => void;
  }
}

export interface RenderOptions {
  app: HTMLElement;
  route: Route;
  viewHTML: string;
  layoutHTML?: string;
  params: Record<string, any>;
  match?: any
}




export interface ComponentActions {
  template?: string;
  store?: any;
  onMount?: (ctx: any) => void;
  onDestroy?: () => void;
  onPropsChanged?: (ctx: {
    props: Record<string, any>;
    state: any;
    context: any;
  }) => void | Promise<void>;
  [key: string]: any;
}

export type Actions = {
  store?: ReturnType<typeof useStore>;
  props?: Record<string, any>;
};

