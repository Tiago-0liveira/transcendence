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
		Router.instance = this;
	}

	public initializeRouter(): void {
		// Handle browser navigation events
		window.addEventListener('popstate', () => this.handleRoute());

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
		const path = this.normalizePath(config.path);
		this.routes.set(path, config);
	}

	public async navigate(url: string): Promise<void> {
		const fullUrl = new URL(url, window.location.origin);
		const path = this.mode === 'hash'
			? fullUrl.hash.slice(1) || '/'
			: fullUrl.pathname;

		if (this.mode === 'history') {
			window.history.pushState({}, '', url);
		} else {
			window.location.hash = path;
		}

		await this.handleRoute();
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

			// Render component
			await route.component();

			this.currentRoute = newRoute;

		} catch (error) {
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

	private normalizePath(path: string): string {
		return path.startsWith('/') ? path : `/${path}`;
	}

	private handleError(error: Error): void {
		// You can customize error handling here
		console.error('Router error:', error);
		this.rootElement.innerHTML = `
			<div class="error">
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