import Router from "@/router/Router";
import { decodeURIfromRoute } from "@/uri-encoding";

const isValidLoginFormData = (_data: FormData): boolean => {
	return true;
}

const component = async () => {
	const template = `
		<div class="login">
			<form id="loginForm">
				<h1>Login</h1>
				<input type="text" name="username" for="username" placeholder="Username" />
				<button>Login</button>
			</form>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;

	const form = document.getElementById("loginForm")
	if (!form) return;

	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		const data = new FormData(form as HTMLFormElement);
		// TODO: change this login form (needs validation here and in the backend)
		// TODO: just some tests and boilerplate code
		if (isValidLoginFormData(data)) {
			// TODO: validate in backend 
			// TODO: maybe send a notification here?
			const username = data.get("username")?.toString() ?? "";
			window.user = { username };
			const route = Router.getInstance().getCurrentRoute();
			if (!route) {
				console.error("route is null");
			}
			else {
				try {
					const redirectUri = decodeURIfromRoute(route);
					console.log(redirectUri);
					Router.getInstance().navigate(redirectUri);

				} catch (error) {
					console.error(error);
				}
			}
		}
	})
}

Router.getInstance().register({ path: '/login', component });
