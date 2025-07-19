import { defineComponent } from './core/components/defineComponent';
import {
  useStore,
  watchEffect,
  usePropsStore,
  bind,
  setupReactivity,
} from './core/hooks/basic';
import { bindPropsToStore, syncStoreAndProps } from './core/utils';
import { bootstrapContainers } from './bootstrap';
// version 0.1
const FramelessApp = {};

export const FramelessJS = Object.assign(FramelessApp, {
  usePropsStore,
  useStore,
  bind,
  setupReactivity,
  watchEffect,

  // utils
  bindPropsToStore,
  syncStoreAndProps,

  defineComponent,
  bootstrapContainers
});


