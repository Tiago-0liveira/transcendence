import type Router from "@/router/Router";

export function setup404Route(router: Router) {
	router.register({
		path: '/404',
		component: async () => {
			const template = `
				<div class="home">
					<h1>Page not found!</h1>
					<nav>
						<a href="/">Home</a>
					</nav>
				</div>
			`;
			document.querySelector('#app')!.innerHTML = template;
		}
	});
}