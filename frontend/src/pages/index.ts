import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { conditionalRender } from "@/utils/conditionalRender";

const component = async () => {
	const loggedIn = Boolean(AuthManager.getInstance().User);

	const template = /* html */ `
		<div class="home flex-1 flex flex-col justify-normal">
			<h1 class="text-black">Welcome Home</h1>
			<div class="flex justify-center space-x-8">
				<a href="/games/new-config" class="link">Games</a>
				<a href="/games/rooms" class="link">Rooms</a>
				<a href="/players" class="link">Players</a>	
				<a href="/chat" class="link">Chat</a>	
			</div>
		</div>
	`;
	document.querySelector("#app")!.innerHTML = template;
};

Router.getInstance().register({ path: "/", component });
