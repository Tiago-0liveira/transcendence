import { googleOauthCompleteSchema } from "@/auth/validation";
import Router from "@/router/Router";
import AuthManager from "@/auth/authManager";

const component = async () => {
	// Redirect if no temporary Google OAuth data
	if (!AuthManager.getInstance().isGoogleOAuthReady()) {
		await Router.getInstance().navigate("/auth/login");
		return;
	}

	const template = /*html*/`
  <div class="profile-card centered auth-box signup-box">
    <div class="settings-header login-section">Complete Google Signup</div>

    <form id="form-oauth-google-completeSignin" class="settings-form">
      <p id="error-form" class="form-message-error hidden"></p>

      <div class="form-input-group">
        <label for="username" class="form-input-label">Username</label>
        <input type="text" id="username" name="username" class="form-input" placeholder="Enter your username" required />
        <p id="error-username" class="form-message-error"></p>
      </div>

      <div class="form-input-group">
        <label for="displayName" class="form-input-label">Display Name</label>
        <input type="text" id="displayName" name="displayName" class="form-input" placeholder="Default to Google name" />
        <p id="error-displayName" class="form-message-error"></p>
      </div>

      <div class="form-input-group">
        <label for="avatarUrl" class="form-input-label">Avatar URL</label>
        <input type="text" id="avatarUrl" name="avatarUrl" class="form-input" placeholder="Default to Google avatar" />
        <p id="error-avatarUrl" class="form-message-error"></p>
      </div>

      <button id="submit-btn" type="submit" class="btn-steam-fixed">Complete Registration</button>
    </form>
  </div>
`;

	document.querySelector('#app')!.innerHTML = template;

	const form = document.getElementById("form-oauth-google-completeSignin") as HTMLFormElement;
	const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
	const errorMessageEl = document.getElementById("error-form") as HTMLParagraphElement;

	const formSubmitHandler = async (e: Event) => {
		e.preventDefault();

		// Очистка ошибок
		["username", "displayName", "avatarUrl"].forEach(field => {
			const el = document.getElementById(`error-${field}`);
			if (el) {
				el.textContent = "";
				el.classList.add("hidden");
			}
		});
		errorMessageEl.textContent = "";
		errorMessageEl.classList.add("hidden");

		const formData = new FormData(form);
		const raw = {
			username: formData.get("username")?.toString() ?? "",
			displayName: formData.get("displayName")?.toString() || undefined,
			avatarUrl: formData.get("avatarUrl")?.toString() || undefined,
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
		const error = await AuthManager.getInstance().oauthGoogleCompleteSignUp(parsed.data);
		submitBtn.disabled = false;

		if (error === null) {
			await Router.getInstance().returnToOrPath("/game");
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
