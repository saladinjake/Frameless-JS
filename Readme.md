#### HTML POWERED PAGES  => HPP


# Project Name

HTML POWERED PAGES  => HPP

### Motivation

A need to build a simple html based lib for easy route configuration
Lazy loading javascript files on demand
My own custom made SPA application starter kit that makes the approach less hassel and developer friendly.

All you need is this

```
import './public/css/index.css';
import { routes } from './AppRoutes';
import { bootstrapContainers } from './src/bootstrap';
// bootstrap the mini framework engine
const app = document.getElementById('app');
bootstrapContainers(routes).runFramework(app);

export const routes = [
  // index or home
  {
    path: 'index',
    view: 'src/Views/Home/index.html',
    script: ['./Modules/HomeManagement.js'],
  },

  {
    path: 'home',
    view: 'src/Views/Home/index.html',
    script: ['./Modules/HomeManagement.js'],
  },

  // auth routes students

  {
    path: 'login',
    view: 'src/Views/Home/login.html',
    script: ['Modules/AuthManager/Auth.js'],
    // middleware: () => confirm('see details'),
  },

  {
    path: 'signup',
    view: 'src/Views/Students/signup.html',
    script: ['Modules/AuthManager/Auth.js'],
    // middleware: () => confirm('see details'),
  },

  /** *************   ADMIN  *********** */

  {
    path: 'admin/login',
    view: 'src/Views/Admin/login.html',
    script: ['Modules/AdminManagement/Login.js'],
  },
];

```

---


## 📂 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [Issue Reporting](#issue-reporting)
- [License](#license)

---

## ✨ MVP Features
- Vanilla js custom routing  => Using hashchanges
- custom made tailwind style css utility classes from scratch
- Responsive css 
- Mini render engine to make htmlpages feel like an spa application from  a framwork or lib
- Mini Engine understand the way bind to action happens under the hood
``` no more 

    <button onclick="handleClick('hello')">Press Me!!</button>

    rather we have
  <button data-action="handleClick" data-message="hello">Press Me!!</button>

```
---

## 🚀 Installation

```bash
git clone this repo
cd your-repo-name
npm install  # or yarn



### Enjoy the demo
-- for full functionality check the elearning project sample in the html version