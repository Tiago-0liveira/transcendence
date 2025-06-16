import NavBar from "@/components/NavBar";
import Router from "@/router/Router";
import API from "@/utils/BackendApi";
import { backendEndpoint } from "@/utils/path";
import { toastHelper } from "@/utils/toastHelper";
import SocketHandler from "./socketHandler";
import {objectOutputType, ZodOptional, ZodString, ZodType} from "zod";


class AuthManager {
	private static instance: AuthManager;
	private user: UserNoPass | null;
	private accessToken: string | null;
	/*private*/

	private constructor() {
		this.user = null;
		this.accessToken = null;
		console.log("Will try to recover login")
		/* Add loading spinner on notification that resolves when this.fetchUser resolves */
		this.fetchUser().then((ok) => { 
			if (ok) {
				Router.getInstance().returnToOrPath("/")
				toastHelper.info("Welcome Back!")
			}
		});
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
		const res = await this.authFetch(API.auth.me, { credentials: "include" });
		if (!res || !res.ok) return false;

		const body = await res.json();
		this.user = body.user;
		SocketHandler.getInstance().connect();
		NavBar.updateNav()
		return true;
	}

	public async authFetch(url: string, options: RequestInit = {}) {
		let response: Response | null = null;
		const headers = new Headers(options.headers)
		url = backendEndpoint(url)
		if (options.method !== "GET") {
			headers.set("Accept", "application/json");
		}
		headers.set("Content-Type", "application/json");
		
		// Do not make the request if accessToken is null (there's no need if we know it requires authentication)
		if (this.accessToken) {
			headers.set("Authorization", `Bearer ${this.GetAccessToken()}`)
			response = await fetch(url, { ...options, headers });
		}

		if (!this.accessToken || response?.status === 401) {
			console.info("Access token expired, trying to refresh!");
			const refreshed = await this.refreshToken();
			if (!refreshed) {
				return null;
			}
			headers.set("Authorization", `Bearer ${this.GetAccessToken()}`)
			return fetch(url, { ...options, headers });
		}
		return response;
	}

	/* Default sign up */
	/* TODO: make this request get the jwt cookie from the backend so it logins right after sign up UX all the way */
	public async register(userParams: UserParams): Promise<{ success: boolean; message?: string }> {
		try {
			const res = await fetch(backendEndpoint(API.auth.signup), {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify(userParams),
				credentials: "include"
			});

			const data = await res.json();

			if (!res.ok) {
				return {
					success: false,
					message: data?.error
				};
			}

			this.accessToken = data.accessToken;
			await this.fetchUser();

			return {
				success: true
			};
		} catch (error: any) {
			console.error("Register request failed", error);
			return {
				success: false,
				message: "Network or server error"
			};
		}
	}

	public async oauthGoogleLogin(googleCode: string | undefined): Promise<string | null> {
		const res = await fetch(backendEndpoint(API.oauth.google.login), {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ code: googleCode }),
			credentials: "include"
		});

		const data = await res.json();
		console.log("Данные data: ", data);

		if (!res.ok) {
			console.error(`${API.oauth.google.login} error:`, data.message || data.error);
			return data.error;
		}

		this.accessToken = data.accessToken;
		await this.fetchUser();
		return null;
	}

	public async oauthGoogleSignUp(googleCode: string | undefined): Promise<string | null> {
		const res = await fetch(backendEndpoint(API.oauth.google.signup.path), {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ code: googleCode }),
			credentials: "include"
		})
		const data = await res.json();
		if (!res.ok) {
			console.error(`${API.oauth.google.signup.path} error:`, data.error)
			return data.error;
		}
		return data.error || null;
	}

	public async oauthGoogleCompleteSignUp(userParams: objectOutputType<{
		username: ZodString;
		displayName: ZodOptional<ZodString>;
		avatarUrl: ZodOptional<ZodString>
	}, ZodType<any, any, any>, "strip">): Promise<string | null> {
		const res = await fetch(backendEndpoint(API.oauth.google.signup.complete), {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(userParams),
			credentials: "include"
		})
		const data = await res.json()
		if (!res.ok) {
			console.error(`${API.oauth.google.signup.complete}:`, data.error);
			if (res.status === 401) {
				await Router.getInstance().navigate("/auth/login")
			}

			return data.error;
		}
		this.accessToken = data.accessToken;

		await this.fetchUser()
		return data.error || null;
	}

	public async login(userParams: {
		username: string;
		password: string;
		token?: string;
	}): Promise<boolean> {
		const res = await fetch(backendEndpoint(API.auth.login), {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(userParams),
			credentials: "include"
		});

		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			const message = errorData?.error;
			throw new Error(message);
		}

		const data = await res.json();
		if (!data.accessToken) {
			throw new Error("Access token not received");
		}

		this.accessToken = data.accessToken;
		await this.fetchUser();

		return true;
	}


	public async refreshToken() {
		try {
			const response = await fetch(backendEndpoint(API.jwt.refresh.path), { credentials: "include" });

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
			const response = await this.authFetch(API.jwt.refresh.logout, { method: "GET", credentials: "include" });
			SocketHandler.getInstance().disconnect();
			this.accessToken = null;
			this.user = null;
			NavBar.updateNav()
			if (!response || !response.ok) throw new Error("Logout failed");
			return true;
		} catch (error) {
			console.log("Could not logout, maybe was already logged out?");
			if (redirect)
				await Router.getInstance().navigate("/")
			return false;
		}
	}

	public isGoogleOAuthReady(): boolean {
		// Пока нет accessToken и user, но мы уже авторизовались через Google
		return !this.user && !this.accessToken;
	}

	public async updateProfile(updateData: {
		displayName?: string;
		avatarUrl?: string;
	}): Promise<void> {
		const res = await this.authFetch(API.settings.update, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(updateData),
		});

		const data = await res.json().catch(() => ({}));
		if (!res.ok || !data.ok) {
			throw new Error(data?.error || data?.message || "Update failed");
		}

		this.accessToken = data.accessToken;
		await this.fetchUser();
	}
}

export default AuthManager;