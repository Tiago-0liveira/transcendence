import { userLoginSchema } from "@/auth/validation";
import { toastHelper } from "@/utils/toastHelper";
import Router from "@/router/Router";
import AuthManager from "@/auth/authManager"
import { GOOGLE_CLIENT_ID } from "@/utils/config";


const component = async () => {
	const template = /* html */`
		<div class="flex-1 flex items-center justify-center bg-white">
			<div class="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm">
				<form id="loginForm" class="p-6 space-y-6" action="#">
					<h5 class="text-xl text-center font-medium mb-4 text-gray-900">Login</h5>

					<p id="login-error" class="text-center text-sm text-red-600 hidden"></p>

					<div>
						<label for="username" class="block mb-2 text-sm font-medium text-left text-gray-900 ">Your Username</label>
						<input type="text" name="username" id="username" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="username" required>
					</div>
					<div>
						<label for="password" class="block mb-2 text-sm font-medium text-left text-gray-900 ">Your Рassword</label>
						<input type="password" name="password" id="password" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="***********" required>
					</div>
					<div class="flex items-start">
						<div class="flex items-start">
							<div class="flex items-center h-5">
								<input id="remember" type="checkbox" value="" class="w-4 h-4 border border-gray-300 rounded-sm focus:ring-3 ring-white focus:ring-purple-500">
							</div>
							<label for="remember" class="ms-2 text-sm font-medium text-gray-900">Remember me</label>
						</div>
						<a href="#" class="ms-auto text-sm text-blue-700 hover:underline">Lost password</a>
					</div>
					<button type="submit" class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-1 text-center" >Sign In</button>
					<div class="flex justify-center flex-row space-x-6">
						<div id="google-oauth" class="border rounded-lg p-1 hover:cursor-pointer border-yellow-300">
							<span class="text-lg text-yellow-600 flex items-center">Login w/ <img class="w-7 h-7 rounded-full mx-1" src="/google-logo.svg" alt=""></span>
						</div>
						<div id="42-oauth" class="border rounded-lg p-1 hover:cursor-pointer border-gray-700">
							<span class="text-lg text-black flex items-center">Login w/ <img class="w-7 h-7 rounded-none mx-1" src="/42-logo.svg" alt=""></span>
						</div> 
					</div>  
					<div class="text-sm font-medium text-gray-500 dark:text-gray-300 space-x-1">
						<span class="">Not registered?</span>
						<a href="/auth/signup" class="text-blue-700 hover:underline dark:text-blue-500">Create account</a>
					</div>
				</form>
			</div>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;

	const form = document.getElementById("loginForm")
	if (!form) return;

	const errorElement = document.getElementById("login-error")!;

	const googleOauth = document.getElementById("google-oauth");
	const fortyTwoOauth = document.getElementById("42-oauth");

	const googleOauthLoginHandler = () => {
		google.accounts.oauth2.initCodeClient({
			client_id: GOOGLE_CLIENT_ID,
			scope: "profile email",
			ux_mode: "popup",
			callback: (response) => {
				if (response.error) {
					console.error("google callback error:", response.error)
					return;
				}

				AuthManager.getInstance().oauthGoogleLogin(response.code).then(err => {
					if (!err)
						Router.getInstance().returnToOrPath("/user")
					else
						console.error("oauthGoogleLogin err: ", err)
				})

			},
		}).requestCode();
	}

	const formSubmitHandler = async (e: Event) => {
		e.preventDefault();

		errorElement.textContent = "";
		errorElement.classList.add("hidden");

		const data = new FormData(form as HTMLFormElement);
		const username = data.get("username")?.toString() ?? "";
		const password = data.get("password")?.toString() ?? "";

		const result = userLoginSchema.safeParse({ username, password });

		try {
			await AuthManager.getInstance().login(result.data);
			await Router.getInstance().returnToOrPath("/user");
			toastHelper.success("Welcome back!", "Login Successful");

		} catch (err: any) {
			console.error("Login error:", err);
			errorElement.textContent = err?.message;
			errorElement.classList.remove("hidden");
		}
	};

	if (googleOauth && google?.accounts?.oauth2?.initCodeClient) {
		googleOauth.addEventListener("click", googleOauthLoginHandler)
	} else {
		console.log("here");
		googleOauth?.setAttribute("disabled", "true");
		/* disable button so user knows google auth is disabled */
	}

	form.addEventListener("submit", formSubmitHandler)
	return () => {
		if (googleOauth && google?.accounts?.oauth2?.initCodeClient) {
			googleOauth.removeEventListener("click", googleOauthLoginHandler)
		}
		form.removeEventListener("submit", formSubmitHandler)
	}
}

Router.getInstance().register({ path: '/auth/login', component });
