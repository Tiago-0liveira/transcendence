import { isValidGoogleOauthFormData } from "@/auth/validation";
import Router from "@/router/Router";
import AuthManager from "@/auth/authManager"


const component = async () => {
	/* TODO: check if google Oauth is active, if not redirect back to signin */
	const template = /*html*/`
		<div class="flex-1 flex items-center justify-center bg-white">
			<div class="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm">
				<form id="form-oauth-google-completeSignin" class="p-6 space-y-7">
					<span class="text-2xl text-center flex space-x-2 items-center justify-center font-medium mb-4 text-gray-900">
						<img class="aspect-auto w-11 h-11" src="/google-logo.svg" alt="">
						<span >Complete Signup</span>
					</span>
					<div>
						<label for="username" class="form-input-label">Your Username</label>
						<input type="text" name="username" id="username" placeholder="Username" required class="form-input">
					</div>
					<div>
						<label for="displayName" class="form-input-label">Display Name</label>
						<input type="text" name="displayName" id="displayName" placeholder="Default to Username" class="form-input">
					</div>
					<div>
						<label for="avatarUrl" class="form-input-label">Your avatarUrl</label>
						<input type="text" name="avatarUrl" id="avatarUrl" placeholder="Default to Google avatar" class="form-input">
					</div>
					<button class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-1 text-center" >Sign In</button>
				</form>
			</div>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;

	const form = document.getElementById("form-oauth-google-completeSignin")
	if (!form) return;

	const formSubmitHandler = async (e) => {
		e.preventDefault()
		const data = new FormData(form as HTMLFormElement);
		// TODO: change this login form (needs validation here and in the backend)
		if (isValidGoogleOauthFormData(data)) {
			// TODO: validate in backend 
			// TODO: maybe send a notification here?
			const username = data.get("username")?.toString() ?? "";
			const displayName = data.get("displayName")?.toString() ?? "";
			const avatarUrl = data.get("avatarUrl")?.toString() ?? "";

			if (!username) {
				// TODO: error notification here
				console.warn("Username cannot be empty");
			}

			const payload: UserParamsNoPass = { username };
			if (displayName) payload["displayName"] = displayName
			if (avatarUrl) payload["avatarUrl"] = avatarUrl

			/* TODO: disable form submit and enable right after this line */
			const res = await AuthManager.getInstance().oauthGoogleCompleteSignUp(payload)
			if (!res) {
				Router.getInstance().returnToOrPath("/user")
			} else {
				console.error("res: ", res);
			}
		}
	}

	form.addEventListener("submit", formSubmitHandler)
	return () => {
		form.removeEventListener("submit", formSubmitHandler)
	}
}

Router.getInstance().register({ path: '/oauth/google/complete', component });
