import Router from "@/router/Router";


class AuthManager {
	private static instance: AuthManager;
	private user: UserNoPass | null;
	private accessToken: string | null;

	private constructor() {
		this.user = null;
		this.accessToken = null;
	}

	public getInstance() {
		if (!AuthManager.instance) {
			AuthManager.instance = new AuthManager();
		}
		return AuthManager.instance;
	}

	// TODO: uncomment this when coding the 2FA
	/*public get needs2FA(): boolean {
		return this.user && this.user.needs2FA;
	}*/
	public GetAccessToken(): string | null {
		return this.accessToken;
	}
	public GetRefreshToken(): string | null {
		return localStorage.getItem("refreshToken");
	}

	public async fetch(url: string, options: RequestInit = {}) {
		if (!this.accessToken)
		{
			console.info("No access token, trying to refresh!");
			await this.refreshToken();
		}
		const headers = new Headers(options.headers);
		headers.set("Authorization", `Bearer ${this.GetAccessToken()}`)

		const response = await fetch(url, {...options, headers});

		if (response.status === 401)
		{
			console.info("Access token expired, trying to refresh!");
			const refreshed = await this.refreshToken();
			if (!refreshed)
			{
				this.logout();
				return null;
			}
			headers.set("Authorization", `Bearer ${this.GetAccessToken()}`)
			return fetch(url, {...options, headers});
		}
		return response;
	}

	public async refreshToken() {
		try {
			const response = await fetch("/auth/refresh", { credentials: "include" });
	
			if (!response.ok) throw new Error("Refresh failed");
	
			const data = await response.json();
			this.accessToken = data.accessToken; // Store the new access token
			return true;
		} catch (error) {
			console.log("Refresh token invalid, logging out.");
			this.logout(true);
			return false;
		}
	}
	
	public async logout(redirect = false) {
		this.accessToken = null;
		this.user = null;
		if (redirect)
			Router.getInstance().navigate("/login")
	}
}

export default AuthManager;