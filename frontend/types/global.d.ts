import Router from '@/router/Router.ts';

declare global {
  interface Window {
    Router: typeof Router;
    router: InstanceType<typeof Router>;
  }
}

// This ensures this file is treated as a module
export {};