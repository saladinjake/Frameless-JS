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
    view: './example/Views/home.html',
    onLoad: () => console.log('Home loaded'),
    layout: './example/layouts/default.html',
  },
  {
    path: 'login',
    view: './example/Views/login.html',
    onLoad: () => console.log('Login loaded'),
  },
  {
    path: 'profile/:id', // /^profile\/(\d+)$/,
    view: './example/Views/profile.html',
    onLoad: () => console.log('Profile loaded'),
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
    script: ['example/pages/about.js'], // accepts array of string
  },
  {
    path: 'about',
    view: './example/Views/about.html',
    middleware: () => {
      console.log('About middleware ran');
      return true; // must return true to continue
    },
    onLoad: () => console.log('About page is now visible'),
    script: 'example/pages/about.js',
  },
  {
    path: 'contact',
    view: './example/Views/contact.html',
    middleware: () => {
      console.log('Checking something before showing contact');
      return confirm('Do you really want to view the contact page?');
    },
  },

  /// test life cycle
  {
    path: 'dashboard',
    view: './example/Views/dashboard.html',
    script: 'example/pages/dashboard.js',
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
    view: './example/Views/404.html',
    script: 'example/pages/404.js',
  },
];
