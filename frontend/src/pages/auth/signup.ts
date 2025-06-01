import { userSignupSchema } from "@/auth/validation";
import Router from "@/router/Router";
import AuthManager from "@/auth/authManager"
import { GOOGLE_CLIENT_ID } from "@/utils/config";
import {toastHelper} from "@/utils/toastHelper";


const component = async () => {
	const template = /* html */`
		 <div class="flex-1 flex items-center justify-center">
    		<div class="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm">
				<form id="form-signup" class="p-6 space-y-6" action="#">
					<h5 class="text-xl text-center font-medium mb-4 text-gray-900">Sign Up</h5> 
					<p id="error-form" class="text-red-600 text-sm text-center mb-2"></p>
					<div>
						<label for="username" class="block mb-0.5 text-sm font-medium text-gray-900 text-left">Your Username</label>
						<input type="text" name="username" id="username" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="Username" required>
						<p id="error-username" class="text-red-600 text-sm mt-1"></p>
					</div>

					<div>
						<label for="displayName" class="block mb-0.5 text-sm font-medium text-gray-900 text-left">Your Display Name</label>
						<input type="text" name="displayName" id="displayName" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="Display Name">
						<p id="error-displayName" class="text-red-600 text-sm mt-1"></p>
					</div>

					<div>
						<label for="avatarUrl" class="block mb-0.5 text-sm font-medium text-gray-900 text-left">Your Avatar Url</label>
						<input type="text" name="avatarUrl" id="avatarUrl" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="https://avatar.xxxxxx">
						<p id="error-avatarUrl" class="text-red-600 text-sm mt-1"></p>
					</div>

					<div>
						<label for="password" class="block mb-0.5 text-sm font-medium text-gray-900 text-left">Your Password</label>
						<input type="password" name="password" id="password" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="***********" required>
						<p id="error-password" class="text-red-600 text-sm mt-1"></p>
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
	// const fortyTwoOauth = document.getElementById("42-oauth");

	// const authMethodInput = document.getElementById("input-authMethod")

	// Get references to error display elements
	const errorFields = {
		username: document.getElementById("error-username"),
		displayName: document.getElementById("error-displayName"),
		avatarUrl: document.getElementById("error-avatarUrl"),
		password: document.getElementById("error-password"),
	};

	// Clear all error messages before re-validation
	const clearErrors = () => {
		Object.values(errorFields).forEach((el) => {
			if (el) el.textContent = "";
		});
	};

	const googleSignUpWithGoogleHandler = () => {
		const codeClient = google.accounts.oauth2.initCodeClient({
			client_id: GOOGLE_CLIENT_ID,
			scope: "profile email",
			ux_mode: "popup",
			callback: async (response: { code?: string; error?: string }) => {
				if (response.error) {
					console.warn(response.error);
					toastHelper.error("Google authorization was cancelled or failed.");
					return;
				}

				console.log("User google authenticated:", response);

				try {
					const err = await AuthManager.getInstance().oauthGoogleSignUp(response.code);

					if (!err) {
						await Router.getInstance().navigate("/oauth/google/complete");
					} else {
						const message = err || "Unknown error during registration";
						console.error("Google signup backend error:", err);
						toastHelper.error(message);
					}
				} catch (e) {
					console.error("Unexpected error in oauthGoogleSignUp:", e);
					toastHelper.error("Unexpected server error. Please try again later.");
				}
			},
		});

		codeClient.requestCode();
	};

	const formSubmitHandler = async (e: Event) => {
		e.preventDefault();

		// Clear all field validation errors
		clearErrors();

		// Clear backend/server error under the "Sign Up" title
		const formError = document.getElementById("error-form");
		if (formError) {
			formError.textContent = "";
		}

		const formEl = form as HTMLFormElement;
		const formData = new FormData(formEl);

		// Extract values from form
		const username = formData.get("username")?.toString() ?? "";
		const password = formData.get("password")?.toString() ?? "";
		const displayName = formData.get("displayName")?.toString() || undefined;
		const avatarUrl = formData.get("avatarUrl")?.toString() || undefined;

		const payload = { username, password, displayName, avatarUrl };

		const result = userSignupSchema.safeParse(payload);
		if (!result.success) {
			const formatted = result.error.format();

			if (formatted.username?._errors?.[0]) {
				errorFields.username!.textContent = formatted.username._errors[0];
			}
			if (formatted.password?._errors?.[0]) {
				errorFields.password!.textContent = formatted.password._errors[0];
			}
			if (formatted.displayName?._errors?.[0]) {
				errorFields.displayName!.textContent = formatted.displayName._errors[0];
			}
			if (formatted.avatarUrl?._errors?.[0]) {
				errorFields.avatarUrl!.textContent = formatted.avatarUrl._errors[0];
			}
			return;
		}

		const res = await AuthManager.getInstance().register(result.data);

		if (res.success) {
			//Clear server error again just in case
			if (formError) {
				formError.textContent = "";
			}
			await Router.getInstance().returnToOrPath("/user");
			toastHelper.success("Registration Successful");
		} else {
			//Show backend/server error message under "Sign Up"
			if (formError) {
				formError.textContent = res.message ?? "Registration failed";
			}
		}
	};

	["username", "password", "displayName", "avatarUrl"].forEach((id) => {
		const input = document.getElementById(id) as HTMLInputElement;
		input?.addEventListener("input", () => {
			// Clear individual field error
			errorFields[id as keyof typeof errorFields]!.textContent = "";

			// Clear top-level form/server error
			const formError = document.getElementById("error-form");
			if (formError) {
				formError.textContent = "";
			}
		});
	});

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
			googleOauth.removeEventListener("click", googleSignUpWithGoogleHandler);
		}
		form.removeEventListener("submit", formSubmitHandler);
	};
}

Router.getInstance().register({ path: '/auth/signup', component });
