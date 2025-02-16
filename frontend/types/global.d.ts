import Router from '@/router/Router.ts';

declare global {
  interface Window {
    user?: UserNoPass;
  }
}

// This ensures this file is treated as a module
export {};