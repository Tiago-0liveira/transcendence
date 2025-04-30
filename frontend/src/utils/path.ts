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


export const backendEndpoint = (...paths: string[]): string => {
	return normalizePath(BACKEND_URL, ...paths);
}

export function buildPaths<T extends RouteTree, B extends string = "">(tree: T, basePath = "" as B): BuildPaths<T, B> {
	const result: any = {};

	for (const key in tree) {
		const value = tree[key];

		if (typeof value === "string") {
			result[key] = `${basePath}/${value}`;
		} else if (typeof value === "object" && value !== null) {
			const subBase = `${basePath}/${key}`;
			const node: any = buildPaths(value, subBase);

			node.path = subBase;
			result[key] = node;
		}
	}

	return result;
}