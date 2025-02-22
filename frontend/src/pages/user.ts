import Router from "@/router/Router";
import { authGuard } from "@/router/guards"

const component = async () => {


	const template = `
		<div class="user">
			<h1>Hello ${window.user?.username}</h1>
			<nav>
				<a href="/">Home</a>
			</nav>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;
	
}

Router.getInstance().register({ path: '/user', guards: [authGuard], component });
