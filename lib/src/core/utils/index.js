export function getNestedValue(obj, keyPath) {
  return keyPath.split('.').reduce((acc, key) => acc?.[key], obj);
}
export function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const nested = keys.reduce((acc, key) => {
    acc[key] = acc[key] || {};
    return acc[key];
  }, obj);
  nested[last] = value;
}

export function bindPropsToStore(instance) {
  if (!instance?.props || !instance?.store) return;

  if (!instance.bindings) instance.bindings = {};

  for (const key of Object.keys(instance.props)) {
    if (!(key in instance.bindings)) {
      instance.bindings[key] = (val) => {
        if (val !== undefined) instance.store.state[key] = val;
        return instance.store.state[key];
      };
    }
  }
}

export function syncStoreAndProps(store, props = {}, delay = 3000) {
  if (!store?.state) return;

  setTimeout(() => {
    // Sync from props → store
    for (const key in props) {
      if (!(key in store.state)) {
        store.state[key] = props[key];
      }
    }

    // Sync from store → props
    for (const key in store.state) {
      if (!(key in props)) {
        props[key] = store.state[key];
      }
    }
  }, delay);
}

// /**
//  * Resolves a script path intelligently.
//  * @param {string} scriptFile - e.g., 'home', 'pages/about'
//  * @param {string} basePath - e.g., 'modules', 'src/scripts', or '/modules'
//  * @returns {string} A Vite-compatible path that can be passed into import()
//  */
// export function resolveScriptPath(scriptFile, basePath = 'modules') {
//   if (!scriptFile.endsWith('.js')) {
//     scriptFile += '.js';
//   }

//   const isAbsolute = scriptFile.startsWith('/');
//   const isBaseAbsolute = basePath.startsWith('/');
//   const pathsToTry = [];

//   // 1. User passed absolute path → use directly
//   if (isAbsolute) {
//     pathsToTry.push(`${scriptFile}`);
//   }

//   // 2. App-relative path (public/modules or public/scripts)
//   if (isBaseAbsolute) {
//     pathsToTry.push(`${basePath}/${scriptFile}`);
//   }

//   // 3. Lib-relative path (during dev)
//   try {
//     pathsToTry.push(
//       new URL(`../${basePath}/${scriptFile}`, import.meta.url).href,
//     );
//   } catch (e) {
//     // fallback if URL fails
//   }

//   // 4. App public root fallback (e.g., /modules/home.js)
//   pathsToTry.push(`/${basePath}/${scriptFile}`);

//   // 5. Optional: custom fallback logic can be added here (e.g., checking `window.location` or import.meta.env)

//   // You can add existence check here using `fetch(..., { method: 'HEAD' })` if needed
//   return pathsToTry[0]; // pick the first viable path
// }

// This will work if used within a Vite-powered app
export const loadModule = async (path) => {
  const modules = import.meta.glob('/src/**/*.{js,ts}');

  let normalized = path;
  if (!normalized.startsWith('/src')) normalized = `/src/${normalized}`;
  if (!normalized.endsWith('.js')) normalized += '.js';

  const loader = modules[normalized];
  if (!loader) {
    console.error('[Framework] Available:', Object.keys(modules));
    throw new Error(`[Framework] Cannot find module: ${normalized}`);
  }

  return loader();
};
