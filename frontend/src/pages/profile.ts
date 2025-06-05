import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { authGuard } from "@/router/guards";

Router.getInstance().register({
    path: "/profile",
    guards: [authGuard],
    component: async () => {
        const auth = AuthManager.getInstance();
        const user = auth.User!;

        const template = /* html */`
			<div class="profile-card">
				<div class="profile-wrapper-row">
					<img class="steam-avatar" src="${user.avatarUrl}" alt="User avatar" />
					<div class="profile-info-block profile-text">
	                    <div class="profile-name-large">${user.displayName}</div>
	                    <div class="profile-stats-compact">
							<p>Status: Online</p>
							<p>Total games: 42</p>
							<p>Winrate: 42%</p>
							<p>Rank: GrandMa</p>
						</div>
					</div>
				</div>
			</div>
		`;

        document.querySelector("#app")!.innerHTML = template;
    }
});