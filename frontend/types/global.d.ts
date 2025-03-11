import Router from '@/router/Router.ts';

declare global {
	interface ImportMeta {
		env: {
			VITE_BACKEND_URL?: string;
		}
	}
}

// This ensures this file is treated as a module
export { };