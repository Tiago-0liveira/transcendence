import Router from "@/router/Router";

const component = async () => {
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

Router.getInstance().register({ path: '/404', component });
