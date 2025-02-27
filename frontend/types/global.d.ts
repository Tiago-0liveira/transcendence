import Router from '@/router/Router.ts';

declare global {
	interface Window {
		user?: UserNoPass;
	}
	interface ImportMeta {
		env: {
			VITE_BACKEND_URL?: string;
		}
	}
}

// This ensures this file is treated as a module
export { };