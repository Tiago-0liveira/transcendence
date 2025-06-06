import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { authGuard } from "@/router/guards";
import QRCode from "qrcode";
import { settingsFormSchema, passwordFormSchema } from "@/auth/validation";
import {toastHelper} from "@/utils/toastHelper";
import API from "@/utils/BackendApi";

const component = async () => {
    const auth = AuthManager.getInstance();
    const user = auth.User!;
    const isGoogleUser = user.authProvider === "google";

    const template = /* html */`
		<div class="profile-card">
			<h1 class="settings-header password-section">User Settings</h1>

			<form id="settings-form" class="settings-form">
			    <div class="form-input-group">
                    <label for="username" class="form-input-label">Username</label>
                    <input type="text" id="username" class="form-input" value="${user.username}" disabled>
                </div>

			    <div class="form-input-group">
					<label for="displayName" class="form-input-label">Nickname</label>
					<input type="text" id="displayName" class="form-input" placeholder="Enter your nickname" value="${user.displayName || ""}">
					<div class="error-text" id="displayName-error"></div>
				</div>
				
				<div class="form-input-group">
					<label for="avatar" class="form-input-label">Avatar URL</label>
					<input type="text" id="avatar" class="form-input" placeholder="Link to avatar image" value="${user.avatarUrl || ""}">
					<div class="error-text" id="avatarUrl-error"></div>
				</div>

				<button type="submit" class="btn-steam-fixed">Save Changes</button>
			</form>

			${!isGoogleUser ? /* html */`
				<h2 class="settings-header password-section">Change Password</h2>
				<form id="password-form" class="settings-form">
					<div class="form-input-group">
						<label for="oldPassword" class="form-input-label">Current Password</label>
						<input type="password" id="oldPassword" class="form-input" placeholder="Enter current password">
						<div class="error-text" id="oldPassword-error"></div>
					</div>
					<div class="form-input-group">
						<label for="newPassword" class="form-input-label">New Password</label>
						<input type="password" id="newPassword" class="form-input" placeholder="Enter new password">
						<div class="error-text" id="newPassword-error"></div>
					</div>
					<button type="submit" class="btn-steam-fixed">Change Password</button>
				</form>

				<div class="twofa-toggle-group">
					<input type="checkbox" id="twofa-checkbox" class="sr-only">
					<div class="toggle-bg" id="toggle-visual"></div>
					<label id="twofa-label" for="toggle-visual" class="toggle-label">Enable 2FA</label>
				</div>
				<div id="twofa-modal" class="modal-overlay hidden">
					<div class="modal-content">
						<h3 class="modal-title">2FA Setup</h3>
						<p class="modal-text">Scan the QR code using your authenticator app:</p>
						<img id="qr-image" class="modal-qr" alt=""/>
						<p class="modal-code">Or enter manually: <span id="qr-secret" class="modal-secret"></span></p>
						<button id="twofa-done" class="modal-done">Done</button>
					</div>
				</div>
			` : ""}
		</div>
	`;

    document.querySelector("#app")!.innerHTML = template;

    const showErrors = (errors: any[]) => {
        document.querySelectorAll(".error-text").forEach(el => el.textContent = "");
        document.querySelectorAll(".form-input").forEach(el => el.classList.remove("input-error"));
        for (const error of errors) {
            const field = error.path[0];
            const input = document.getElementById(field) as HTMLInputElement;
            const errorDiv = document.getElementById(`${field}-error`);
            if (input) input.classList.add("input-error");
            if (errorDiv) errorDiv.textContent = error.message;
        }
    };

    if (!isGoogleUser) {
        const checkbox = document.querySelector("#twofa-checkbox") as HTMLInputElement;
        const label = document.querySelector("#twofa-label")!;
        const visual = document.querySelector("#toggle-visual")!;
        const modal = document.getElementById("twofa-modal")!;
        const qrImage = document.getElementById("qr-image") as HTMLImageElement;
        const qrSecret = document.getElementById("qr-secret")!;
        const doneBtn = document.getElementById("twofa-done")!;

        const update2faStatus = (enabled: boolean) => {
            checkbox.checked = enabled;
            label.textContent = enabled ? "2FA Enabled" : "2FA Disabled";
            visual.classList.toggle("enabled", enabled);
        };

        const res = await auth.authFetch(API.settings.twofa.status, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id })
        });
        const data = await res.json();
        update2faStatus(!!data.enabled);

        visual.addEventListener("click", async () => {
            const enabled = !checkbox.checked;

            try {
                const res = await auth.authFetch(API.settings.twofa.toggle, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: user.id, enabled })
                });
                const result = await res.json();
                update2faStatus(enabled);

                if (enabled && result.secret && result.otpauth_url) {
                    const qrDataUrl = await QRCode.toDataURL(result.otpauth_url);
                    qrImage.src = qrDataUrl;
                    qrSecret.textContent = result.secret;
                    document.body.classList.add("overflow-hidden");
                    modal.classList.remove("hidden");
                    setTimeout(() => modal.classList.add("opacity-100"), 10);
                } else {
                    modal.classList.remove("opacity-100");
                    modal.classList.add("opacity-0");
                    setTimeout(() => {
                        modal.classList.add("hidden");
                        document.body.classList.remove("overflow-hidden");
                    }, 300);
                    qrImage.src = "";
                    qrSecret.textContent = "";
                }
            } catch (err) {
                console.error("Error toggling 2FA:", err);
            }
        });

        doneBtn.addEventListener("click", () => {
            modal.classList.remove("opacity-100");
            modal.classList.add("opacity-0");
            setTimeout(() => {
                modal.classList.add("hidden");
                document.body.classList.remove("overflow-hidden");
            }, 300);
        });
    }

    const settingsForm = document.getElementById("settings-form") as HTMLFormElement;
    settingsForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const displayName = (document.getElementById("displayName") as HTMLInputElement).value.trim();
        const avatarUrl = (document.getElementById("avatar") as HTMLInputElement).value.trim();

        const parse = settingsFormSchema.safeParse({ displayName, avatarUrl });
        if (!parse.success) {
            showErrors(parse.error.errors);
            return;
        }

        try {
            const res = await auth.authFetch(API.settings.update, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: user.username,
                    displayName,
                    avatarUrl
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data?.error || "Update failed");
            }
            if (data.message) {
                toastHelper.success(data.message);
            }
        } catch (err) {
            console.error("Settings update error:", err);
            toastHelper.error(err);
        }
    });

    const passwordForm = document.getElementById("password-form") as HTMLFormElement | null;
    passwordForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const oldPassword = (document.getElementById("oldPassword") as HTMLInputElement).value;
        const newPassword = (document.getElementById("newPassword") as HTMLInputElement).value;

        const parse = passwordFormSchema.safeParse({ oldPassword, newPassword });
        if (!parse.success) {
            showErrors(parse.error.errors);
            return;
        }

        try {
            const res = await auth.authFetch(API.settings.password, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, oldPassword, newPassword }),
            });
            if (!res.ok) throw new Error("Server error");
            alert("Password changed successfully!");
        } catch (err) {
            console.error("Password change error:", err);
            alert("Error changing password.");
        }
    });
};

Router.getInstance().register({ path: "/settings", guards: [authGuard], component });
