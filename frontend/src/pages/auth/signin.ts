import { isValidLoginFormData } from "@/auth/validation";
import Router from "@/router/Router";
import AuthManager from "@/auth/authManager"
import { decodeURIfromRoute } from "@/uri-encoding";
import { BACKEND_URL } from "@/utils/config";
import { backendEndpoint, normalizePath } from "@/utils/path";



const component = async () => {
	const template = `
		<style>
			div.signin form#signinForm div.input-wrapper {
				box-shadow: 5px 5px 10px -1px rgba(80,80,80,0.51);
				-webkit-box-shadow: 5px 5px 10px -1px rgba(80,80,80,0.51);
				-moz-box-shadow: 5px 5px 10px -1px rgba(80,80,80,0.51);
			}
			div.signin form#signinForm div.input-wrapper a.oauth {
				box-shadow: 2px 2px 10px -1px rgba(80,80,80,0.51);
				-webkit-box-shadow: 2px 2px 10px -1px rgba(80,80,80,0.51);
				-moz-box-shadow: 2px 2px 10px -1px rgba(80,80,80,0.51);
			}
		</style>

		<div class="signin p-20 pb-30">
			<form id="signinForm" class="flex flex-col justify-around items-center min-w-full min-h-full">
				<h1 class="font-medium">Signin</h1>
				<div class="input-wrapper flex flex-col relative rounded-xl border-2 border-[rgb(80,80,80)] items-center justify-around min-w-sm max-w-120 min-h-110 max-h-140">
					<div class="inputs flex flex-col min-h-[80%]">
						<div class="flex flex-col mt-2 min-w-50 max-w-90">
							<label for="username" class="ml-1 text-left">Username</label>
							<input type="text" id="username" name="username" for="username" placeholder="Username" required minlength="5" maxlength="100"/>
						</div>
						<div class="flex flex-col mt-2 min-w-50 max-w-90">
							<label for="password" class="ml-1 text-left">Password</label>
							<input type="password" id="password" name="password" for="password" placeholder="Password" 
								required minlength="8" maxlength="100"
								class="TODO: this is commented this is a pattern that checks all it says below -->  pattern=\"(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}\""
								title="At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character"
								onpaste="return false;"
							/>
						</div>
						<div class="flex flex-col mt-2 min-w-50 max-w-90">
							<label for="displayName" class="ml-1 text-left">Display Name</label>
							<input type="text" name="displayName" id="displayName" for="displayName" placeholder="Display Name" />
						</div>
						<div class="flex flex-col mt-2 min-w-50 max-w-90">
							<label for="avatarUrl" class="ml-1 text-left">Avatar Url</label>
							<input type="url" name="avatarUrl" id="avatarUrl" for="avatarUrl" placeholder="Avatar Url" />
						</div>
					</div>
					<button class="w-40">Signin</button>
					<a href="/42-oauth" class="42 oauth absolute right-[-5rem] mb-[3.5rem]"><img class="aspect-auto w-8" src="42-logo.svg" alt="42 school logo svg"></a>
					<a href="/google-oauth" class="google oauth absolute right-[-5rem] mt-[3.5rem]"><img class="aspect-auto w-8" src="google-logo.svg" alt="Google logo svg"></a>
				</div>
			</form>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;

	const form = document.getElementById("signinForm")
	if (!form) return;

	form.addEventListener("submit", async (e) => {
		e.preventDefault()
		const data = new FormData(form as HTMLFormElement);
		// TODO: change this login form (needs validation here and in the backend)
		// TODO: just some tests and boilerplate code
		if (isValidLoginFormData(data)) {
			// TODO: validate in backend 
			// TODO: maybe send a notification here?
			const username = data.get("username")?.toString() ?? "";
			const password = data.get("password")?.toString() ?? "";
			const displayName = data.get("displayName")?.toString() ?? "";
			const avatarUrl = data.get("avatarUrl")?.toString() ?? "";

			const payload: UserParams = { username, password };
			if (displayName) payload["displayName"] = displayName;
			if (avatarUrl) payload["avatarUrl"] = avatarUrl;

			const res = await AuthManager.getInstance().register(payload);
			if (res) {
				Router.getInstance().navigate("/login");
			} else {
				console.error("Sigin failed");
			}
			/*window.user = { username };
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
			}*/
		}
	})
}

Router.getInstance().register({ path: '/signin', component });
