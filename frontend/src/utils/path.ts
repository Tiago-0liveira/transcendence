import { BACKEND_URL } from "./config";

export const normalizePath = (...paths: string[]): string => {
	return paths.reduce((acc, path) => {
		if (!path) return acc; // Ignore empty strings

		if (acc.endsWith("/") && path.startsWith("/")) {
			return acc + path.slice(1);
		}

		return acc + (acc && !acc.endsWith("/") && !path.startsWith("/") ? "/" : "") + path;
	}, "");
};


export const backendEndpoint = (...paths: string[]) : string => {
	return normalizePath(BACKEND_URL, ...paths);
}