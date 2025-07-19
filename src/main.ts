import { bootstrapContainers } from 'frameless-js';
import { routes } from './AppRoutes';

// bootstrap the mini framework engine
const root = document.getElementById('app');
console.log(root)
console.log(routes)
bootstrapContainers(routes).surge(root);
