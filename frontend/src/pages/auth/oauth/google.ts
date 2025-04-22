import { isValidGoogleOauthFormData, isValidLoginFormData } from "@/auth/validation";
import Router from "@/router/Router";
import AuthManager from "@/auth/authManager"
import { decodeURIfromRoute } from "@/uri-encoding";
import { BACKEND_URL, GOOGLE_CLIENT_ID } from "@/utils/config";
import { backendEndpoint, normalizePath } from "@/utils/path";



const component = async () => {
	/* TODO: check if google Oauth is active, if not redirect back to signin */
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

		<div class="signin p-20 pb-20">
			<form id="signinForm" class="flex flex-col justify-around items-center min-w-full min-h-full">
				<h1 class="font-medium flex items-center justify-between">
					<span id="42-oauth" class="hover:cursor-pointer rounded-md p-2 transition-colors hover:bg-zinc-900">
						<img class="mr-4 aspect-auto w-12" src="/google-logo.svg" alt="42 school logo svg">
					</span>
					<span>Complete Signin</span>
				</h1>
				<div class="input-wrapper flex flex-col relative rounded-xl border-2 border-[rgb(80,80,80)] items-center justify-around min-w-sm max-w-120 h-[24rem]">
					<div class="inputs flex flex-col min-h-[50%]">
						<div class="flex flex-col mt-2 min-w-50 max-w-90 cursor-not-allowed">
							<label for="username" class="ml-1 text-left">Username</label>
							<input type="text" id="username" name="username" for="username" placeholder="Username" required minlength="5" maxlength="100"/>
						</div>
						<div class="flex flex-col mt-2 min-w-50 max-w-90">
							<label for="displayName" class="ml-1 text-left">Display Name (Google avatar)</label>
							<input type="text" name="displayName" id="displayName" for="displayName" placeholder="Default is Username" />
						</div>
						<div class="flex flex-col mt-2 min-w-50 max-w-90">
							<label for="avatarUrl" class="ml-1 text-left">Avatar Url</label>
							<input type="url" name="avatarUrl" id="avatarUrl" for="avatarUrl" placeholder="Default is google Avatar" />
						</div>
						<input class="hidden" id="googleId" for="googleId" />
					</div>
					<div class="relative flex flex-col justify-between items-center h-12 w-44 mb-2">
						<button class="w-40" type="submit">Signin</button>
					</div>
				</div>
			</form>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;

	const form = document.getElementById("signinForm")
	if (!form) return;

	form.addEventListener("submit", async (e) => {
		e.preventDefault()
		console.log("ola");
		const data = new FormData(form as HTMLFormElement);
		// TODO: change this login form (needs validation here and in the backend)
		if (isValidGoogleOauthFormData(data)) {
			// TODO: validate in backend 
			// TODO: maybe send a notification here?
			const username = data.get("username")?.toString() ?? "";
			const displayName = data.get("displayName")?.toString() ?? "";
			const avatarUrl = data.get("avatarUrl")?.toString() ?? "";

			if (!username)
			{
				// TODO: error notification here
				console.warn("Username cannot be empty");
			}

			const payload: UserParamsNoPass = { username };
			if (displayName) payload["displayName"] = displayName
			if (avatarUrl) payload["avatarUrl"] = avatarUrl

			/* disable form submit and enable right after this line */
			const res = await AuthManager.getInstance().oauthGoogleCompleteSignUp(payload)
			if (!res)
			{
				Router.getInstance().navigate("/user")
			} else {
				console.error("res: ", res);
			}
		}
	})
}

Router.getInstance().register({ path: '/oauth/google/complete', component });
