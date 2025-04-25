type RouteParams = StringsObject;
type QueryParams = StringsObject;

interface RouteConfig {
	path: string;
	component: () => Promise<void | (() => void)>;
	guards?: RouteGuard[];
	middleware?: Middleware[];
}

type RouteGuard = (to: Route, from: Route | null) => boolean | Promise<boolean>;
type Middleware = (to: Route, from: Route | null) => void | Promise<void>;

interface Route {
	path: string;
	params: RouteParams;
	query: QueryParams;
	hash: string;
	cleanupFunc?: () => void;
}

interface RouterOptions {
	mode?: 'history' | 'hash';
	baseUrl?: string;
	rootElement?: string;
}

