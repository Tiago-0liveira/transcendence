type RouteTree = {
	[key: string]: string | RouteTree;
};

type BuildPaths<T extends RouteTree, B extends string = ""> = {
	[K in keyof T]: T[K] extends string
	? `${B}/${T[K] & string}`
	: T[K] extends RouteTree
	? BuildPaths<T[K], `${B}/${Extract<K, string>}`> & { path: `${B}/${Extract<K, string>}` }
	: never;
};