function navigate(path, query = {}) {
  const queryStr = new URLSearchParams(query).toString();
  location.hash = queryStr ? `#${path}?${queryStr}` : `#${path}`;
}
let isAuth = false;
function checkLoginStatus(boolVal) {
  // toggle
  isAuth = boolVal;
  return isAuth;
}

export async function loadTemplate(path) {
  try {
    // Attempt to load from public folder
    const res = await fetch(path);
    if (!res.ok) throw new Error('Not found in public');
    return await res.text();
  } catch (e) {
    console.warn(`[TemplateLoader] Falling back to src for: ${path}`);

    // Use Vite dynamic glob import from src (non-eager, async)
    const pages = import.meta.glob('/src/**/*.{html,txt}', {
      as: 'raw',
      eager: false,
    });

    const filename = path.split('/').pop() || '';
    const matchedKey = Object.keys(pages).find((key) =>
      key.endsWith(`/${filename}`),
    );

    if (!matchedKey) {
      throw new Error(`Template '${filename}' not found in src fallback`);
    }

    // Call the lazy-loaded function
    return pages[matchedKey]();
  }
}

// interface Route {
//   path: string;
//   view: () => Promise<string>;
//   script?: string;
//   scriptBase?: string;
//   layout?: string;
//   scripts?: string[]; // optional multiple scripts support
// }

export const routes = [
  {
    path: 'home',
    view: () => loadTemplate('./views/home.html'),
    onLoad: () => console.log('Home loaded'),
    layout: './views/layouts/default.html',
    // scriptBase: 'src/modules',
    scripts: ['modules/home.js'], // accepts array of string
  },

  {
    path: 'login',
    view: './views/login.html',
    onLoad: () => console.log('Login loaded'),
    layout: './views/layouts/default.html',
    scripts: ['./modules/Login/Login.js'], // accepts array of string
  },
  {
    path: 'profile/:id', // /^profile\/(\d+)$/,
    view: './views/profile.html',
    onLoad: () => console.log('Profile loaded'),
    layout: './views/layouts/default.html',
    middleware: async (params) => {
      // midleware by params value
      console.log(params, '>>>>');
      if (params?.user) {
        if (params.user != 'banned') return true;
        return false;
      }

      // meddle ware by function call
      const toggleTestValue = !!params.user;
      const user = await checkLoginStatus(toggleTestValue);
      if (!user) {
        location.hash = '#login';
        return false;
      }
      return true;
    },
    script: ['./modules/about.js'], // accepts array of string
  },
  {
    path: 'about',
    view: './views/about.html',
    layout: './views/layouts/default.html',
    middleware: () => {
      console.log('About middleware ran');
      return true; // must return true to continue
    },
    onLoad: () => console.log('About page is now visible'),
    script: './modules/about.js',
  },
  {
    path: 'contact',
    view: './views/contact.html',
    layout: './views/layouts/default.html',
    middleware: () => {
      console.log('Checking something before showing contact');
      return confirm('Do you really want to view the contact page?');
    },
  },

  /// test life cycle
  {
    path: 'dashboard',
    view: './views/dashboard.html',
    script: './modules/dashboard.js',
    layout: './views/layouts/dashboard.html',
    // todo add route beforeEnter and beforeLeave
    // beforeEnter: (params) => {
    //   if (!checkLoginStatus(false)) {
    //     navigate('login');
    //     return false;
    //   }
    //   return true;
    // },
  },
  {
    path: '*',
    view: './views/404.html',
    script: './modules/404.js',
  },
];
