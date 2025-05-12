// src/types/global.d.ts
import "fastify";

declare namespace NodeJS {
	interface ProcessEnv {
		NODE_ENV: 'development' | 'production';

		PORT?: string;
		JWT_SECRET: string;
		JWT_REFRESH_SECRET: string;
		FRONTEND_URL: string;

		DEV_DROP_DB_ON_START?: string;
		/**
		 * @description Only works if :
		 *  - `NODE_ENV='development'` and
		 *  - `DEV_DROP_DB_ON_START='true'`
		 */
		DEV_DB_INSERT_FAKE_DATA?: string;

		GOOGLE_CLIENT_ID: string;
		GOOGLE_CLIENT_SECRET_ID: string;
	}
}

declare module 'fastify' {
	interface FastifyRequest {
		/**
		 * @description Only available after passing by authJwtMiddleware
		 */
		user: RequestUser;
		/**
		 * @description Only available after passing by oauthJwtMiddleware
		 */
		googlePayload: RequestGooglePayload
	}
}
