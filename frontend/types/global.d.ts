import Router from '@/router/Router.ts';

declare global {
	interface ImportMeta {
		env: {
			VITE_BACKEND_URL?: string;
			VITE_GOOGLE_CLIENT_ID?: string;
		}
	}
}

// This ensures this file is treated as a module
export { };