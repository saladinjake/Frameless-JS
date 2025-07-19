import { bootstrapContainers } from './lib/bootstrap';
import { routes } from './AppRoutes';

// bootstrap the mini framework engine
  const root = document.getElementById('app');
  if (!root) {
    throw new Error('❌ Could not find #app in DOM');
  }
  bootstrapContainers(routes).surge(root);
