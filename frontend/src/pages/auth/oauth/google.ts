import { googleOauthCompleteSchema } from "@/auth/validation";
import Router from "@/router/Router";
import AuthManager from "@/auth/authManager";

const component = async () => {
	const template = /*html*/`
	<div class="flex-1 flex items-center justify-center bg-white">
		<div class="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm">
			<form id="form-oauth-google-completeSignin" class="p-6 space-y-7">
				<div class="relative mb-6">
					<div class="text-2xl text-center flex space-x-2 items-center justify-center font-medium text-gray-900">
						<img class="aspect-auto w-11 h-11" src="/google-logo.svg" alt="">
						<span>Complete Signup</span>
					</div>
					<p id="form-error-message" class="hidden text-sm text-red-600 absolute w-full text-center left-0 -bottom-5"></p>
				</div>
				
				<div class="relative">
					<label for="username" class="form-input-label">Your Username</label>
					<input type="text" name="username" id="username" placeholder="Username" required class="form-input">
					<p id="error-username" class="hidden text-sm text-red-600 absolute left-0 -bottom-5"></p>
				</div>

				<div class="relative">
					<label for="displayName" class="form-input-label">Display Name</label>
					<input type="text" name="displayName" id="displayName" placeholder="Default to Username" class="form-input">
					<p id="error-displayName" class="hidden text-sm text-red-600 absolute left-0 -bottom-5"></p>
				</div>

				<div class="relative">
					<label for="avatarUrl" class="form-input-label">Your avatarUrl</label>
					<input type="text" name="avatarUrl" id="avatarUrl" placeholder="Default to Google avatar" class="form-input">
					<p id="error-avatarUrl" class="hidden text-sm text-red-600 absolute left-0 -bottom-5"></p>
				</div>

				<button id="submit-btn" class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-1 text-center">
					Sign In
				</button>
			</form>
		</div>
	</div>
`;

	document.querySelector('#app')!.innerHTML = template;

	const form = document.getElementById("form-oauth-google-completeSignin");
	const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
	const errorMessageEl = document.getElementById("form-error-message") as HTMLParagraphElement;

	if (!form || !submitBtn) return;

	const formSubmitHandler = async (e: Event) => {
		e.preventDefault();

		["username", "displayName", "avatarUrl"].forEach(field => {
			const el = document.getElementById(`error-${field}`);
			if (el) {
				el.textContent = "";
				el.classList.add("hidden");
			}
		});

		errorMessageEl.textContent = "";
		errorMessageEl.classList.add("hidden");

		const data = new FormData(form as HTMLFormElement);
		const raw = {
			username: data.get("username")?.toString() ?? "",
			displayName: data.get("displayName")?.toString() || undefined,
			avatarUrl: data.get("avatarUrl")?.toString() || undefined,
		};

		const parsed = googleOauthCompleteSchema.safeParse(raw);
		if (!parsed.success) {
			const errors = parsed.error.flatten().fieldErrors;
			Object.entries(errors).forEach(([key, value]) => {
				const el = document.getElementById(`error-${key}`);
				if (el) {
					el.textContent = value?.[0] ?? "";
					el.classList.remove("hidden");
				}
			});
			return;
		}

		submitBtn.disabled = true;

		const payload = parsed.data;
		const error = await AuthManager.getInstance().oauthGoogleCompleteSignUp(payload);

		submitBtn.disabled = false;

		if (error === null) {
			await Router.getInstance().returnToOrPath("/user");
		} else {
			console.error("Signup error:", error);
			errorMessageEl.textContent = error;
			errorMessageEl.classList.remove("hidden");
		}
	};

	form.addEventListener("submit", formSubmitHandler);
	return () => {
		form.removeEventListener("submit", formSubmitHandler);
	};
};

Router.getInstance().register({ path: "/oauth/google/complete", component });
