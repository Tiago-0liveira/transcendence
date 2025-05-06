import { isValidLoginFormData } from "@/auth/validation";
import Router from "@/router/Router";
import AuthManager from "@/auth/authManager"
import { GOOGLE_CLIENT_ID } from "@/utils/config";


const component = async () => {
	const template = /* html */`
		 <div class="flex-1 flex items-center justify-center">
    		<div class="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm">
				<form id="form-signup" class="p-6 space-y-6" action="#">
					<h5 class="text-xl text-center font-medium mb-4 text-gray-900">Sign Up</h5> 
					<div>
						<label for="username" class="block mb-0.5 text-sm font-medium text-gray-900 text-left">Your username</label>
						<input type="username" name="username" id="username" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="Username" required>
					</div>
					<div>
						<label for="displayName" class="block mb-0.5 text-sm font-medium text-gray-900 text-left">Your displayName</label>
						<input type="text" name="displayName" id="displayName" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="Display Name" required>
					</div>
					<div>
						<label for="avatarUrl" class="block mb-0.5 text-sm font-medium text-gray-900 text-left">Your Avatar Url</label>
						<input type="text" name="avatarUrl" id="avatarUrl" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="https://avatar.xxxxxx" required>
					</div>
					<div>
						<label for="password" class="block mb-0.5 text-sm font-medium text-gray-900 text-left">Your password</label>
						<input type="password" name="password" id="password" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="***********" required>
					</div>
					<div class="flex items-start">
						<div class="flex items-start">
							<div class="flex items-center h-5">
								<input id="remember" type="checkbox" value="" class="w-4 h-4 border border-gray-300 rounded-sm bg-gray-50 focus:ring-3 focus:ring-purple-500">
							</div>
							<label for="remember" class="ms-2 text-sm font-medium text-gray-900">Remember me</label>
						</div>
					</div>
					<button type="submit" class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-1 text-center" >Sign Up</button>
					<div class="flex justify-center flex-row space-x-6">
						<div id="google-oauth" class="border rounded-lg p-1 hover:cursor-pointer border-yellow-300">
							<span class="text-lg text-yellow-600 flex items-center">Sign Up w/ <img class="w-7 h-7 rounded-full mx-1" src="/google-logo.svg" alt=""></span>
						</div>
						<div id="42-oauth" class="border rounded-lg p-1 hover:cursor-pointer border-gray-700">
							<span class="text-lg text-black flex items-center">Sign Up w/ <img class="w-7 h-7 rounded-none mx-1" src="/42-logo.svg" alt=""></span>
						</div> 
					</div>
					<div class="text-sm font-medium text-gray-500 dark:text-gray-300 space-x-1">
						<span class="">Already registered?</span>
						<a href="/auth/login" class="text-blue-700 hover:underline dark:text-blue-500">Login</a>
					</div>
				</form>
			</div>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;

	const form = document.getElementById("form-signup")
	if (!form) return;

	const googleOauth = document.getElementById("google-oauth");
	const fortyTwoOauth = document.getElementById("42-oauth");

	const authMethodInput = document.getElementById("input-authMethod")

	const googleSignUpWithGoogleHandler = () => {
		google.accounts.oauth2.initCodeClient({
			client_id: GOOGLE_CLIENT_ID,
			scope: "profile email",
			ux_mode: "popup",
			callback: (response) => {
				if (response.error) {
					/* did not accept the required permissions ti */
					console.warn(response.error);
					return;
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
	}

	const formSubmitHandler = async (e) => {
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
	}

	if (googleOauth && google?.accounts?.oauth2?.initCodeClient) {
		googleOauth.addEventListener("click", googleSignUpWithGoogleHandler)
	} else {
		console.log("here");
		googleOauth?.setAttribute("disabled", "true");
		/* disable button so user knows google auth is disabled */
	}

	form.addEventListener("submit", formSubmitHandler)
	return () => {
		if (googleOauth && google?.accounts?.oauth2?.initCodeClient) {
			googleOauth.removeEventListener("click", googleSignUpWithGoogleHandler)
		}
		form.removeEventListener("submit", formSubmitHandler)
	}
}

Router.getInstance().register({ path: '/auth/signup', component });
