import { bootstrapContainers } from "./src/bootstrap";
import { defineComponent } from "./src/core/components/defineComponent";
import { bind, setupReactivity, useStore, watchEffect } from "./src/core/hooks/basic";
import Router from "./src/core/Router/FramelessRouter";


export {
    useStore,
    watchEffect,
    defineComponent,
    bind,
    setupReactivity,
    Router,
    bootstrapContainers
}
