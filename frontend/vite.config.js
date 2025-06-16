import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	css: {
		postcss: './postcss.config.cjs', // Optional if PostCSS is in the root
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@component': path.resolve(__dirname, './src/components/'),
			'@page': path.resolve(__dirname, './src/pages/'),
			'@types': path.resolve(__dirname, './types'),
		}
	},
	build: {
		sourcemap: true,
	},
	server: {
		watch: {
			usePolling: true,
		},
		https: {
			cert: '/etc/nginx/ssl/nginx-selfsigned.crt',
			key: '/etc/nginx/ssl/nginx-selfsigned.key'
		},
		port: 2000,
		strictPort: true,
		historyApiFallback: true,
		host: "0.0.0.0",
		headers: {
			"Cross-Origin-Opener-Policy": "same-origin-allow-popups"
		}
	}
});