import { userLoginSchema } from "@/auth/validation";
import { toastHelper } from "@/utils/toastHelper";
import Router from "@/router/Router";
import AuthManager from "@/auth/authManager";
import { GOOGLE_CLIENT_ID } from "@/utils/config";

const component = async () => {
	const template = /* html */`
		<div class="flex-1 flex items-center justify-center bg-white">
			<div class="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm">
				<form id="loginForm" class="p-6 space-y-6" action="#">
					<div class="relative mb-8">
						<h5 class="text-xl text-center font-medium text-gray-900">Login</h5>
						<p id="login-error" class="text-sm text-red-600 absolute w-full text-center left-0 -bottom-5 hidden"></p>
					</div>

					<div>
						<label for="username" class="block mb-2 text-sm font-medium text-left text-gray-900">Your Username</label>
						<input type="text" name="username" id="username" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="username" required>
					</div>
					<div>
						<label for="password" class="block mb-2 text-sm font-medium text-left text-gray-900">Your Password</label>
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
					<button type="submit" class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-1 text-center">Sign In</button>
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

		<div id="twofa-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="relative bg-white px-4 py-4 rounded-lg shadow-lg w-[320px] flex flex-col items-center">
				<button id="twofa-close"
					class="absolute top-1.5 right-1.5 text-gray-400 hover:text-gray-600 text-base font-semibold leading-none focus:outline-none"
					title="Close"
					aria-label="Close"
				>
					&times;
				</button>

				<label for="twofa-code" class="text-sm font-medium text-gray-700 mb-2 text-center">Enter 6-digit code</label>
				<input
					type="text"
					id="twofa-code"
					maxlength="6"
					inputmode="numeric"
					pattern="[0-9]*"
					class="w-40 h-11 text-center text-xl border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
					placeholder="хххххх"
					autocomplete="one-time-code"
					autofocus
				>
				<p id="twofa-error"
					class="text-sm text-red-600 text-center mt-2 transition-opacity duration-200"
					style="min-height: 1.25rem; opacity: 0;">
				</p>
			</div>
		</div>
	`;

	document.querySelector('#app')!.innerHTML = template;

	const form = document.getElementById("loginForm");
	if (!form) return;

	const errorElement = document.getElementById("login-error")!;
	const googleOauth = document.getElementById("google-oauth");

	let savedLoginData: { username: string; password: string } | null = null;
	let savedGoogleCode: string | null = null;

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
						await Router.getInstance().returnToOrPath("/user");
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
			await Router.getInstance().returnToOrPath("/user");
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

		if (code.length === 6) {
			try {
				if (savedLoginData) {
					await AuthManager.getInstance().login({
						...savedLoginData,
						token: code
					});
				} else if (savedGoogleCode) {
					const err = await AuthManager.getInstance().verifyTwoFAGoogleLogin(code);
					if (err) throw new Error(err);
				} else {
					throw new Error("No login data available for 2FA");
				}

				hideTwoFAModal();
				await Router.getInstance().returnToOrPath("/user");
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
