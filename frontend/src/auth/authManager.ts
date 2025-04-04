import Router from "@/router/Router";
import { BACKEND_URL } from "@/utils/config";
import { backendEndpoint } from "@/utils/path";


class AuthManager {
	private static instance: AuthManager;
	private user: UserNoPass | null;
	private accessToken: string | null;

	private constructor() {
		this.user = null;
		this.accessToken = null;
		console.log("Will try to recover login")
		this.fetchUser().then((ok) => { console.log("AuthManager || fetchUser on constructor: ", ok); });
	}

	public static getInstance() {
		if (!AuthManager.instance) {
			AuthManager.instance = new AuthManager();
		}
		return AuthManager.instance;
	}

	public get loggedIn() {
		return Boolean(this.user);
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

	public get User() {
		return this.user;
	}

	public async fetchUser(): Promise<boolean> {
		const res = await this.authFetch("auth/me", { credentials: "include" });
		if (!res || !res.ok) return false;

		const body = await res.json();
		console.log("fetchUser", body);
		this.user = body.user;

		return true;
	}

	public async authFetch(url: string, options: RequestInit = {}) {
		url = backendEndpoint(url)
		const headers = new Headers(options.headers);
		headers.set("Authorization", `Bearer ${this.GetAccessToken()}`)

		const response = await fetch(url, { ...options, headers });
		console.info(response);

		if (!response.ok) {
			console.info("Access token expired, trying to refresh!");
			const refreshed = await this.refreshToken();
			if (!refreshed) {
				return null;
			}
			headers.set("Authorization", `Bearer ${this.GetAccessToken()}`)
			return fetch(url, { ...options });
		}
		return response;
	}

	public async register(userParams: UserParams): Promise<boolean> {
		const res = await fetch(backendEndpoint("user/signin"), {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(userParams)
		})
		if (!res.ok) return false;
		const data = await res.json();
		return new Promise((resolve, reject) => {
			if (data.ok) {
				resolve(true);
			} else {
				reject(false);
			}
		});
	}

	public async login(userParams: UserParams): Promise<boolean> {
		const res = await fetch(backendEndpoint("user/login"), {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(userParams),
			credentials: "include"
		})
		console.log("login res:", res);
		if (!res.ok) return false;
		const data = await res.json();
		this.accessToken = data.accessToken;
		this.user = data.user;
		return true;
	}

	public async refreshToken() {
		try {
			const response = await fetch(backendEndpoint("auth/refresh"), { credentials: "include" });

			if (!response.ok) throw new Error("Refresh failed");

			const data = await response.json();
			this.accessToken = data.accessToken; // Store the new access token
			return true;
		} catch (error) {
			console.log("Refresh token invalid, logging out.");
			/* this.logout(true); */
			return false;
		}
	}

	/* Sends the user to /login and resets accessToken and user in-memory stored data */
	public async logout(redirect = false) {
		try {
			const response = await this.authFetch("user/logout", { credentials: "include" });
			this.accessToken = null;
			this.user = null;
			if (!response || !response.ok) throw new Error("Refresh failed");
			return true;
		} catch (error) {
			console.log("Could not logout, maybe was already logged out?");
			if (redirect)
				Router.getInstance().navigate("/")
			return false;
		}
	}
}

export default AuthManager;