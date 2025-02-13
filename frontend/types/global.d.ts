import Router from '@/router/Router.ts';

declare global {
  interface Window {
    user?: User;
  }
}

// This ensures this file is treated as a module
export {};