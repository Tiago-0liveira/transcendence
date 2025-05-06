import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { conditionalRender } from "@/utils/conditionalRender";

const component = async () => {

	const loggedIn = Boolean(AuthManager.getInstance().User);

	const template = /* html */`
		<div class="home flex-1 flex flex-col justify-evenly">
			<h1 class="text-black">Welcome Home</h1>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;
}

Router.getInstance().register({ path: '/', component });
