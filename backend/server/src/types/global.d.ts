// src/types/global.d.ts

declare namespace NodeJS {
	interface ProcessEnv {
		NODE_ENV: 'development' | 'production';
		PORT?: string;
	}
}

type Pair<T, U> = [T, U]
