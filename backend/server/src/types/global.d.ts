// src/types/global.d.ts

declare namespace NodeJS {
	interface ProcessEnv {
		NODE_ENV: 'development' | 'production';
		PORT?: string;
		JWT_SECRET: string;
		GOOGLE_CLIENT_ID: string;
		GOOGLE_CLIENT_SECRET_ID: string;
		FRONTEND_URL: string;
	}

	interface FastifyRequest {
		accessToken: string
	}
}
