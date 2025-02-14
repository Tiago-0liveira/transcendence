import Router from "@/router/Router";

const component = async () => {
	const template = `
		<div class="home h-40 flex flex-col justify-evenly">
			<h1 class="">Welcome Home</h1>
			<nav>
				<a href="/about">About</a>
				<a href="/contact">Contact</a>
				<a href="/user">My User</a>
			</nav>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;
}

Router.getInstance().register({ path: '/', component });
