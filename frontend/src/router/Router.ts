import { normalizePath } from "@/utils/path";

class Router {
	private static instance: Router | null;
	private routes: Map<string, RouteConfig> = new Map();
	private currentRoute: Route | null = null;
	private loadingElement: HTMLElement | null;
	private mode: 'history' | 'hash';
	private baseUrl: string;
	private rootElement: HTMLElement;

	public static getInstance(): Router {
		if (!Router.instance) {
			Router.instance = new Router();
		}
		return Router.instance;
	}

	private constructor(options: RouterOptions = {}) {
		this.routes = new Map();
		this.currentRoute = null;
		this.mode = options.mode || 'history';
		this.baseUrl = options.baseUrl || '';
		this.rootElement = document.querySelector(options.rootElement || '#app') as HTMLElement;
		this.loadingElement = document.querySelector('#loading');

		if (!this.rootElement) {
			throw new Error('Root element not found');
		}
	}

	public initializeRouter(): void {
		// Handle browser navigation events
		window.addEventListener('popstate', () => {
			this.handleComponentUnmount()
			this.handleRoute()
		});

		// Intercept link clicks for SPA navigation
		document.addEventListener('click', (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const anchor = target.closest('a');

			if (anchor && anchor.href && !anchor.getAttribute('external')) {
				e.preventDefault();
				this.navigate(anchor.href);
			}
		});

		// Handle initial route
		this.handleRoute();
	}

	public register(config: RouteConfig): void {
		// Convert path pattern to regex for matching
		const path = normalizePath(config.path);
		this.routes.set(path, config);
	}

	private handleComponentUnmount() {
		const oldRoute = this.currentRoute;
		if (oldRoute) {
			const oldRouteCleanupFunc = oldRoute.cleanupFunc;
			if (oldRouteCleanupFunc) {
				oldRouteCleanupFunc();
				oldRoute.cleanupFunc = undefined;
			}
		}
	}

	public async navigate(pathOrUrl: string, routeParams: RouteParams = {}, queryParams: QueryParams = {}): Promise<void> {
		this.handleComponentUnmount()

		let url = Router.makeUrl(pathOrUrl, routeParams, queryParams);

		const currentPath = this.getCurrentPath()
		const currentRoute = this.getCurrentRoute()
		// Persist returnTo query param whitin /auth and /oauth
		const fullToUrl = new URL(url, window.location.origin)
		if ((currentPath.startsWith("/auth") || currentPath.startsWith("/oauth")) &&
			(fullToUrl.pathname.startsWith("/auth") || fullToUrl.pathname.startsWith("/oauth")) && currentRoute?.query.returnTo) {
			url = Router.makeUrl(pathOrUrl, routeParams, {...queryParams, returnTo: currentRoute.query.returnTo})
		}

		const fullUrl = new URL(url, window.location.origin);
		if (this.mode === 'history') {
			window.history.pushState({}, '', url);
		} else {
			const locationHash = this.mode === 'hash'
				? fullUrl.hash.slice(1) || '/'
				: fullUrl.pathname;
			window.location.hash = locationHash;
		}

		await this.handleRoute();
	}

	/**
	 * @description this function tries to check if this.getCurrentRoute().query.returnTo is set and returns otherwise uses argument
	 * @argument 
	 */
	public async returnToOrPath(fallbackPath: string, routeParams: RouteParams = {}, queryParams: QueryParams = {}) {
		const currentRoute = this.getCurrentRoute()
		if (currentRoute?.query.returnTo) {
			this.navigate(currentRoute.query.returnTo)
		} else {
			this.navigate(fallbackPath, routeParams, queryParams)
		}
	}

	public parseUri(uri: string): {
		path: string;
		params: RouteParams;
		query: QueryParams;
	} {
		const url = new URL(uri, window.location.origin);

		// Extract the path based on the router mode
		const path = this.mode === 'hash'
			? url.hash.slice(1) || '/'
			: url.pathname.slice(this.baseUrl.length) || '/';

		// Use existing methods to find matching route and extract params
		const { params } = this.findMatchingRoute(path);

		// Use existing method to parse query params
		const query = this.parseQueryParams(url.search);

		return { path, params, query };
	}

	private async handleRoute(): Promise<void> {
		try {
			const path = this.getCurrentPath();
			const { route, params } = this.findMatchingRoute(path);

			if (!route) {
				throw new Error(`No route found for path: ${path}`);
			}

			const newRoute: Route = {
				path,
				params,
				query: this.parseQueryParams(window.location.search),
				hash: window.location.hash
			};

			// Check guards
			if (route.guards) {
				for (const guard of route.guards) {
					const canProceed = await guard(newRoute, this.currentRoute);
					if (!canProceed) {
						return;
					}
				}
			}

			// Show loading state
			if (this.loadingElement) {
				this.loadingElement.style.display = 'block';
			}

			// Execute middleware
			if (route.middleware) {
				for (const middleware of route.middleware) {
					await middleware(newRoute, this.currentRoute);
				}
			}

			this.currentRoute = newRoute;
			// Render component
			const componentCleanupFunc = await route.component();
			if (componentCleanupFunc) {
				if (this.currentRoute) {
					this.currentRoute.cleanupFunc = componentCleanupFunc || undefined;
				}
			}

		} catch (error: any) {
			console.error('Routing error:', error);
			this.handleError(error);
		} finally {
			if (this.loadingElement) {
				this.loadingElement.style.display = 'none';
			}
		}
	}

	private getCurrentPath(): string {
		if (this.mode === 'hash') {
			return window.location.hash.slice(1) || '/';
		}
		return window.location.pathname.slice(this.baseUrl.length) || '/';
	}

	private findMatchingRoute(path: string): { route: RouteConfig | null; params: RouteParams } {
		for (const [routePath, config] of this.routes) {
			const params = this.matchRoute(routePath, path);
			if (params) {
				return { route: config, params };
			}
		}
		if (this.routes.has("/404")) {
			return { route: this.routes.get("/404") as RouteConfig, params: {} }
		}
		return { route: null, params: {} };
	}

	private matchRoute(routePath: string, currentPath: string): RouteParams | null {
		const routeParts = routePath.split('/');
		const currentParts = currentPath.split('/');

		if (routeParts.length !== currentParts.length) {
			return null;
		}

		const params: RouteParams = {};

		for (let i = 0; i < routeParts.length; i++) {
			const routePart = routeParts[i];
			const currentPart = currentParts[i];

			if (routePart.startsWith(':')) {
				params[routePart.slice(1)] = currentPart;
			} else if (routePart !== currentPart) {
				return null;
			}
		}

		return params;
	}

	private parseQueryParams(search: string): QueryParams {
		const params: QueryParams = {};
		new URLSearchParams(search).forEach((value, key) => {
			params[key] = value;
		});
		return params;
	}

	static makeUrl(pathOrUrl: string, routeParams?: RouteParams, queryParams?: QueryParams): string {
		let url = pathOrUrl;

		if (routeParams) {
			Object.entries(routeParams).forEach(([key, value]) => {
				url = url.replace(`:${key}`, encodeURIComponent(String(value)));
			});
		}

		if (queryParams && Object.keys(queryParams).length > 0) {
			const searchParams = new URLSearchParams();
			Object.entries(queryParams).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					searchParams.append(key, String(value));
				}
			});

			const queryString = searchParams.toString();
			if (queryString) {
				url += (url.includes('?') ? '&' : '?') + queryString;
			}
		}

		return url;
	}

	private handleError(error: Error): void {
		// You can customize error handling here
		console.error('Router error:', error);
		this.rootElement.innerHTML = `
			<div class="flex-1 text-red-500">
				<h1>Error</h1>
				<p>${error.message}</p>
			</div>
		`;
	}

	// Public API methods
	public back(): void {
		window.history.back();
	}

	public forward(): void {
		window.history.forward();
	}

	public getCurrentRoute(): Route | null {
		return this.currentRoute;
	}
}


export default Router