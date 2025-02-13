import Router from "@/router/Router";

const component = async () => {
	const template = `
		<div class="home">
			<h1>Welcome Home</h1>
			<nav>
				<a href="/about">About</a>
				<a href="/contact">Contact</a>
			</nav>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;
}

Router.getInstance().register({ path: '/', component });
