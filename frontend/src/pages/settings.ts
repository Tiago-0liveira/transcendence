import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { authGuard } from "@/router/guards";
import QRCode from "qrcode";

const component = async () => {
    const auth = AuthManager.getInstance();
    const user = auth.User!;
    const isGoogleUser = user.authProvider === "GOOGLE";

    const template = /* html */`
		<div class="profile-card">
			<h1 class="settings-header password-section">User Settings</h1>

			<form id="settings-form" class="settings-form">
				<div class="form-input-group">
					<label for="avatar" class="form-input-label">Avatar URL</label>
					<input type="text" id="avatar" class="form-input" placeholder="Link to avatar image" value="${user.avatarUrl || ""}">
				</div>

				<div class="form-input-group">
					<label for="login" class="form-input-label">Login</label>
					<input type="text" id="login" class="form-input" placeholder="Enter your login" value="${user.login || ""}">
				</div>

				<div class="form-input-group">
					<label for="displayName" class="form-input-label">Nickname</label>
					<input type="text" id="displayName" class="form-input" placeholder="Enter your nickname" value="${user.displayName || ""}">
				</div>

				<button type="submit" class="btn-steam-fixed">Save Changes</button>
			</form>

			${!isGoogleUser ? /* html */`
				<h2 class="settings-header password-section">Change Password</h2>
				<form id="password-form" class="settings-form">
					<div class="form-input-group">
						<label for="oldPassword" class="form-input-label">Current Password</label>
						<input type="password" id="oldPassword" class="form-input" placeholder="Enter current password">
					</div>
					<div class="form-input-group">
						<label for="newPassword" class="form-input-label">New Password</label>
						<input type="password" id="newPassword" class="form-input" placeholder="Enter new password">
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

        const res = await auth.authFetch("/auth/2fa/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id })
        });
        const data = await res.json();
        update2faStatus(!!data.enabled);

        visual.addEventListener("click", async () => {
            const enabled = !checkbox.checked;
            try {
                const res = await auth.authFetch("/auth/2fa/toggle", {
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

    // TODO: Добавить обработчики отправки форм (settings-form, password-form)
};

Router.getInstance().register({ path: "/settings", guards: [authGuard], component });
