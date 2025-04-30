import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { conditionalRender } from "@/utils/conditionalRender";

const component = async () => {

	const loggedIn = Boolean(AuthManager.getInstance().User);

	const template = `
		<div class="home h-40 flex flex-col justify-evenly">
			<h1 class="">Welcome Home</h1>
			<nav>
				<a href="/players" ${conditionalRender(!loggedIn, `class="text-gray-400 cursor-not-allowed pointer-events-none"`)}>Players</a>
				${conditionalRender(loggedIn, `
					<a href="/user">My User</a>
					<a href="/auth/logout">Logout</a>
				`, `
					<a href="/auth/login">Login</a>
				`)}
			</nav>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;
}

Router.getInstance().register({ path: '/', component });
