
// export async function slotAwareRender({
//   app,
//   route,
//   viewHTML,
//   layoutHTML,
//   params,
//   match = null
// }: RenderOptions): Promise<void> {
//   const props = { ...params };
//   let baseContext = { app, params, props };
//   const viewDOM = htmlToDOM(viewHTML);
//   let finalDOM = viewDOM;
//   let actions: ComponentActions = {};
//   let module: any;

//   // If layout provided, inject slots into layout
//   if (layoutHTML) {
//     const layoutDOM = htmlToDOM(layoutHTML);
//     injectSlots(layoutDOM, viewDOM);
//     finalDOM = layoutDOM;
//   }

//   // Load scoped styles (CSS)
//   if (route.styles || route.style) {
//     const stylePaths: any = Array.isArray(route.styles || route.style)
//       ? (route.styles || route.style)
//       : [route.style];

//     for (const stylePath of stylePaths) {
//       const res = await fetch(stylePath);
//       const css = await res.text();
//       applyScopedStyle(css, `scoped-style-${route.path}`);
//     }
//   }

//   // Main render logic
//   const renderView = async (): Promise<void> => {
//     const domClone = finalDOM.cloneNode(true) as HTMLElement;

//     // Hydrate layout slots/components
//     if (route.script || route.scripts) {
//       const scriptPaths: any = Array.isArray(route.scripts || route.script)
//         ? (route.scripts || route.script)
//         : [route.script];

//       module = await loadModule(`${scriptPaths[0]}`, route.scriptBase || 'modules');

//       if (typeof module.init === 'function') {

//         actions = await module.init({ ...baseContext }) || {};
//         const { template } = actions;


//         if (template && typeof template === 'string') {
//           const container = document.createElement('div');
//           container.innerHTML = template;

//           for (const el of [...container.children]) {
//             const slot = el.getAttribute('slot') || null;

//             await hydrateComponent(el as HTMLElement, {
//               ...baseContext,
//               ...actions,
//               props: { ...actions?.props, ...props },
//             });

//             const target = slot
//               ? domClone.querySelector(`slot[name="${slot}"]`)
//               : domClone.querySelector('slot:not([name])');

//             if (target) target.replaceWith(el);
//           }
//         }

//         let interpolationObserver: any
//         let bindObserver: any;
//         requestAnimationFrame(() => {
//           actions.onMount?.({ ...baseContext, ...actions, ...props, ...actions?.props });
//           setTimeout(() => {
//             // Setup reactivity on both store and state if provided


//             if (actions.store) setupReactivity(actions.store, app);


//           }, 400)


//           const reactiveSources = {
//             ...(actions.store || {}),
//             // ...(actions.state || {}) // unwrap proxied state
//           };

//           // Delay binding to ensure DOM is updated
//           setTimeout(() => {
//             interpolationObserver = observeInterpolationBindings(domClone, reactiveSources, { ...props, ...actions?.props });
//             bindObserver = bindActionsWithObserver(app, actions);
//           }, 0);



//           currentDestroy = () => {
//             actions.onDestroy?.();
//             bindObserver?.disconnect()
//             interpolationObserver.disconnect()
//           }
//         });
//       }
//     }

//     // Hydrate view itself
//     await hydrateComponent(domClone, {
//       ...baseContext,
//       ...actions,
//       props: { ...props, ...actions?.props, ...baseContext, ...actions },
//     });





//     // Hydrate child components inside rendered view
//     await resolveChildComponents(domClone, {
//       ...baseContext,
//       ...actions.props,
//       props: { ...props, ...actions?.props, ...baseContext, ...actions }
//     });

//     // Diff and mount to DOM
//     requestAnimationFrame(() => {
//       if (!app || !domClone || !domClone.children) {
//         console.warn('[hydrate] Skipping patch - app or domClone is null');
//         return;
//       }

//       shallowDiffAndPatch(app, domClone.children);

//       Array.from(app.children).forEach((child: any) => {
//         if (actions.store) setupReactivity(actions.store, child);
//       });
//     });

//     // Execute scripts
//     const doc = new DOMParser().parseFromString(viewHTML, 'text/html');
//     for (const oldScript of doc.querySelectorAll('script')) {
//       const newScript = document.createElement('script');
//       if (oldScript.src) {
//         if (loadedScriptSrcs.has(oldScript.src)) continue;
//         newScript.src = oldScript.src;
//         loadedScriptSrcs.add(oldScript.src);
//       } else {
//         newScript.textContent = oldScript.textContent;
//       }
//       if (oldScript.type) newScript.type = oldScript.type;
//       document.body.appendChild(newScript);
//     }

//     // Final hook
//     route.onLoad?.();
//   };

//   await renderView();

// }
