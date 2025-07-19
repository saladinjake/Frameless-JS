import { bootstrapContainers } from 'frameless-js';
import { routes } from './AppRoutes';

// bootstrap the mini framework engine
const root = document.getElementById('app');
bootstrapContainers(routes).surge(root);
