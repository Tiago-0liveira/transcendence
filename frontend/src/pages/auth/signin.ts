import { isValidLoginFormData } from "@/auth/validation";
import Router from "@/router/Router";
import AuthManager from "@/auth/authManager"
import { decodeURIfromRoute } from "@/uri-encoding";
import { BACKEND_URL, GOOGLE_CLIENT_ID } from "@/utils/config";
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
				<div class="input-wrapper flex flex-col relative rounded-xl border-2 border-[rgb(80,80,80)] items-center justify-around min-w-sm max-w-120 h-[32rem]">
					<div class="inputs flex flex-col min-h-[50%]">
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
					<div class="relative flex flex-col justify-between items-center h-40 w-44 mb-2">
						<div class="relative flex flex-col w-full">
							<a href="/auth/login" class="link h-10">Have an account?</a>
							<div class="flex flex-row justify-evenly w-full">
								<span id="42-oauth" class="hover:cursor-pointer rounded-md p-2 transition-colors hover:bg-zinc-900">
									<img class="aspect-auto w-8" src="/42-logo.svg" alt="42 school logo svg">
								</span>
								<span id="google-oauth" class="hover:cursor-pointer rounded-md p-2 transition-colors hover:bg-zinc-900">
									<img class="aspect-auto w-8" src="/google-logo.svg" alt="Google logo svg">
								</span>
							</div>
						</div>
						<button class="w-40">Signin</button>
					</div>
				</div>
			</form>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;

	const form = document.getElementById("signinForm")
	if (!form) return;

	const googleOauth = document.getElementById("google-oauth");
	const fortyTwoOauth = document.getElementById("42-oauth");

	const authMethodInput = document.getElementById("input-authMethod")

	console.log("google: ", google);

	if (googleOauth && google && google?.accounts?.oauth2?.initCodeClient) {
		googleOauth.addEventListener("click", () => {
			google.accounts.oauth2.initCodeClient({
				client_id: GOOGLE_CLIENT_ID,
				scope: "profile email",
				ux_mode: "popup",
				callback: (response) => {
					if (response.error)
					{
						/* did not accept the required permissions ti */
						console.warn(response.error);
						return ;
					}
					console.log("User google authenticated:", response);
					AuthManager.getInstance().oauthGoogleSignUp(response.code).then((err) => {
						if (!err) {
							Router.getInstance().navigate("/oauth/google/complete")
						} else {
							// TODO: deactivate google button and message (notification of the error)
						}
					})
				},
			}).requestCode();
		})
	} else {
		console.log("here");
		googleOauth?.setAttribute("disabled", "true");
		/* disable button so user knows google auth is disabled */
	}

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
				Router.getInstance().returnToOrPath("/user")
			} else {
				console.error("Sigin failed");
			}
		}
	})
}

Router.getInstance().register({ path: '/auth/signin', component });
