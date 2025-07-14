// define your routes

function navigate(path, query = {}) {
  const queryStr = new URLSearchParams(query).toString();
  location.hash = queryStr ? `#${path}?${queryStr}` : `#${path}`;
}

function checkLoginStatus(boolVal) {
  // toggle
  return boolVal;
}

export const routes = [
  {
    path: 'home',
    view: './views/home.html',
    onLoad: () => console.log('Home loaded'),
    layout: './views/layouts/default.html',
    scripts: ['./modules/home.js'], // accepts array of string
  },

  {
    path: 'login',
    view: './views/login.html',
    onLoad: () => console.log('Login loaded'),
    layout: './views/layouts/default.html',
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
      const toggleTestValue = false;
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
