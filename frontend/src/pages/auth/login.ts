import { userLoginSchema } from "@/auth/validation";
import { toastHelper } from "@/utils/toastHelper";
import Router from "@/router/Router";
import AuthManager from "@/auth/authManager";
import { GOOGLE_CLIENT_ID } from "@/utils/config";

const component = async () => {
	const template = /* html */`
			<div class="profile-card centered auth-box">
				<div class="settings-header login-section">Login</div>
		
				<form id="loginForm" class="settings-form">
					<p id="login-error" class="form-message-error"></p>
		
					<div class="form-input-group">
						<label for="username" class="form-input-label">Username</label>
						<input type="text" id="username" name="username" class="form-input" placeholder="Enter your username" required />
					</div>
		
					<div class="form-input-group">
						<label for="password" class="form-input-label">Password</label>
						<input type="password" id="password" name="password" class="form-input" placeholder="Enter your password" required />
					</div>
		
					<div class="form-input-group horizontal-inputs">
						<div class="remember-checkbox">
							<input id="remember" type="checkbox" />
							<label for="remember" class="form-input-label inline-label">Remember me</label>
						</div>
					</div>
		
					<button type="submit" class="btn-steam-fixed">Sign In</button>
		
					<div class="form-section-divider"></div>
		
					<div class="form-section-title">Or login with</div>
					<div class="oauth-buttons">
						<div id="google-oauth" class="oauth-button">
							<span>Google</span>
							<img src="/google-logo.svg" alt="Google logo" class="oauth-logo" />
						</div>
					</div>
		
					<div class="form-section-divider"></div>
					
					<div class="form-section-title bottom">
						<span>Not registered?</span>
						<a href="/auth/signup" class="form-input-label create-account-link">Create account</a>
					</div>
				</form>
		</div>

<!-- 2FA MODAL -->
		<div id="twofa-modal" class="modal-overlay hidden">
			<div class="modal-content">
				<button id="twofa-close" class="modal-close">&times;</button>
				<h3 class="modal-title">Two-Factor Authentication</h3>
				<label for="twofa-code" class="modal-text">Enter 6-digit code</label>
				<input
					type="text"
					id="twofa-code"
					maxlength="6"
					inputmode="numeric"
					pattern="[0-9]*"
					class="form-input twofa-input"
					placeholder="______"
					autocomplete="one-time-code"
					autofocus
				/>
<!--				<p id="twofa-error" class="form-message-error hidden"></p>-->
				<p id="twofa-error" class="form-message-error error-2fa">Invalid code</p>
			</div>
		</div>
		`;

	document.querySelector('#app')!.innerHTML = template;

	const form = document.getElementById("loginForm");
	if (!form) return;

	const errorElement = document.getElementById("login-error")!;
	const googleOauth = document.getElementById("google-oauth");

	let savedLoginData: { username: string; password: string } | null = null;

	const showTwoFAModal = () => {
		const errorBox = document.getElementById("twofa-error")!;
		const codeInput = document.getElementById("twofa-code") as HTMLInputElement;
		errorBox.textContent = "";
		errorBox.style.opacity = "0";
		codeInput.value = "";
		codeInput.focus();
		document.getElementById("twofa-modal")!.classList.remove("hidden");
	};

	const hideTwoFAModal = () => {
		document.getElementById("twofa-modal")!.classList.add("hidden");
	};

	const googleOauthLoginHandler = () => {
		const codeClient = google.accounts.oauth2.initCodeClient({
			client_id: GOOGLE_CLIENT_ID,
			scope: "profile email",
			ux_mode: "popup",
			callback: async (response: { code?: string; error?: string }) => {
				if (response.error) {
					console.error("Google login callback error:", response.error);
					toastHelper.error("Google authorization failed or was cancelled.");
					return;
				}

				try {
					const err = await AuthManager.getInstance().oauthGoogleLogin(response.code);

					if (!err) {
						await Router.getInstance().returnToOrPath("/game");
						toastHelper.success("Login successful!");
					} else {
						const message = err || "Unknown error during login";
						console.error("oauthGoogleLogin error:", err);
						toastHelper.error(message);
					}
				} catch (e) {
					console.error("Unexpected error in oauthGoogleLogin:", e);
					toastHelper.error("Unexpected server error. Please try again later.");
				}
			},
		});

		codeClient.requestCode();
	};

	const formSubmitHandler = async (e: Event) => {
		e.preventDefault();

		errorElement.textContent = "";
		errorElement.classList.add("hidden");

		const data = new FormData(form as HTMLFormElement);
		const username = data.get("username")?.toString() ?? "";
		const password = data.get("password")?.toString() ?? "";

		const result = userLoginSchema.safeParse({ username, password });
		if (!result.success) {
			errorElement.textContent = "Invalid input data";
			errorElement.classList.remove("hidden");
			return;
		}

		try {
			await AuthManager.getInstance().login(result.data);
			await Router.getInstance().returnToOrPath("/game");
			toastHelper.success("Login Successful");
		} catch (err: any) {
			console.error("Login error:", err);
			if (err.message === "2FA_REQUIRED") {
				savedLoginData = result.data;
				showTwoFAModal();
			} else {
				errorElement.textContent = err?.message ?? "Login failed";
				errorElement.classList.remove("hidden");
			}
		}
	};

	form.addEventListener("submit", formSubmitHandler);

	const codeInput = document.getElementById("twofa-code") as HTMLInputElement;

	codeInput.addEventListener("input", () => {
		codeInput.value = codeInput.value.replace(/[^0-9]/g, "");
	});

	codeInput.addEventListener("paste", (e) => {
		e.preventDefault();
		const pasted = (e.clipboardData || (window as any).clipboardData).getData("text");
		const numbersOnly = pasted.replace(/[^0-9]/g, "").slice(0, 6);
		document.execCommand("insertText", false, numbersOnly);
	});

	codeInput.addEventListener("input", async () => {
		const code = codeInput.value;
		const errorBox = document.getElementById("twofa-error")!;
		errorBox.textContent = "";
		errorBox.style.opacity = "0";

		if (code.length === 6 && savedLoginData) {
			try {
				await AuthManager.getInstance().login({
					...savedLoginData,
					token: code
				});
				hideTwoFAModal();
				await Router.getInstance().returnToOrPath("/game");
				toastHelper.success("Login Successful");
			} catch (err: any) {
				console.error("2FA error:", err?.message);
				errorBox.textContent = err?.message ?? "Invalid 2FA code";
				errorBox.style.opacity = "1";
			}
		}
	});


	document.getElementById("twofa-close")?.addEventListener("click", () => {
		hideTwoFAModal();
	});

	if (googleOauth && google?.accounts?.oauth2?.initCodeClient) {
		googleOauth.addEventListener("click", googleOauthLoginHandler);
	} else {
		googleOauth?.setAttribute("disabled", "true");
	}

	return () => {
		if (googleOauth && google?.accounts?.oauth2?.initCodeClient) {
			googleOauth.removeEventListener("click", googleOauthLoginHandler);
		}
		form.removeEventListener("submit", formSubmitHandler);
	};
};

Router.getInstance().register({ path: '/auth/login', component });
