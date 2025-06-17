import { userSignupSchema } from "@/auth/validation";
import Router from "@/router/Router";
import AuthManager from "@/auth/authManager"
import { GOOGLE_CLIENT_ID } from "@/utils/config";
import {toastHelper} from "@/utils/toastHelper";


const component = async () => {
		const template = /* html */`
			  <div class="profile-card centered auth-box signup-box">
				<div class="settings-header login-section">Sign Up</div>
			
				<form id="form-signup" class="settings-form">
				  <p id="error-form" class="form-message-error"></p>
			
				  <div class="form-input-group">
					<label for="username" class="form-input-label">Username</label>
					<input type="text" id="username" name="username" class="form-input" placeholder="Enter your username" required />
					<p id="error-username" class="form-message-error"></p>
				  </div>
			
				  <div class="form-input-group">
					<label for="displayName" class="form-input-label">Display Name</label>
					<input type="text" id="displayName" name="displayName" class="form-input" placeholder="Optional display name" />
					<p id="error-displayName" class="form-message-error"></p>
				  </div>
			
				  <div class="form-input-group">
					<label for="avatarUrl" class="form-input-label">Avatar URL</label>
					<input type="text" id="avatarUrl" name="avatarUrl" class="form-input" placeholder="Optional avatar URL" />
					<p id="error-avatarUrl" class="form-message-error"></p>
				  </div>
			
				  <div class="form-input-group">
					<label for="password" class="form-input-label">Password</label>
					<input type="password" id="password" name="password" class="form-input" placeholder="Enter your password" required />
					<p id="error-password" class="form-message-error"></p>
				  </div>
			
				  <div class="form-input-group horizontal-inputs">
					<div class="remember-checkbox">
					  <input id="remember" type="checkbox" />
					  <label for="remember" class="form-input-label inline-label">Remember me</label>
					</div>
				  </div>
			
				  <button type="submit" class="btn-steam-fixed">Sign Up</button>
			
				  <div class="form-section-divider"></div>
			
				  <div class="form-section-title">Or sign up with</div>
				  <div class="oauth-buttons">
					<div id="google-oauth" class="oauth-button">
					  <span>Google</span>
					  <img src="/google-logo.svg" alt="Google logo" class="oauth-logo" />
					</div>
				  </div>
			
				  <div class="form-section-divider"></div>
			
				  <div class="form-section-title bottom">
					<span>Already registered?</span>
					<a href="/auth/login" class="form-input-label create-account-link">Login</a>
				  </div>
				</form>
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
			await Router.getInstance().returnToOrPath("/profile");
			toastHelper.success("Registration Successful");
		} else {
			//Show backend/server error message under "Sign Up"
			if (formError) {
				formError.textContent = res.message ?? "Registration failed";
				formError.classList.remove("hidden"); //ak
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
