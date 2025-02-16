import Router from "@/router/Router";

const component = async () => {

	const loggedIn = Boolean(window.user);
	const userElement = loggedIn ? 
		"<a href=\"/user\">My User</a>" : 
		"<a href=\"/login\">Login</a>"

	const template = `
		<div class="home h-40 flex flex-col justify-evenly">
			<h1 class="">Welcome Home</h1>
			<nav>
				<a href="/about">About</a>
				<a href="/contact">Contact</a>
				${userElement}
			</nav>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;
}

Router.getInstance().register({ path: '/', component });
