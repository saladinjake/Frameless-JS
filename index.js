import { bootstrapContainers } from "./src/bootstrap";
import { defineComponent } from "./src/core/components/defineComponent";
import { bind, setupReactivity, useStore, watchEffect } from "./src/core/hooks/basic";
import Router from "./src/core/Router/FramelessRouter";





const frameless =  Object.assign({}, {
    useStore,
    watchEffect,
    defineComponent,
    bind,
    setupReactivity,
    Router,
    bootstrapContainers
})

export default framless