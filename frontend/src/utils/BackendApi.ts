import { buildPaths } from "@/utils/path";

const routeTree = {
	auth: {
		me: "me",
		signup: "signup",
		login: "login",
		friends: {
			possibleFriends: "possibleFriends",
			me: "me",
			blocked: "blocked",
			add: "add",
			remove: "remove",
			requests: {
				pending: {
					cancel: "cancel",
				},
				accept: "accept",
				reject: "reject",
			},
		}
	},
	oauth: {
		google: {
			login: "login",
			signup: {
				complete: "complete",
			},
		},
	},
	jwt: {
		refresh: {
			logout: "logout",
		},
	},
	settings: {
		update: "update",
		password: "password",
		account: "account",
		twofa: {
			toggle: "toggle",
			verify: "verify",
			status: "status",
		},
	},
	profile: "profile",
	games: {
		rooms: "rooms"
	},
	blocked: {
		block: "block",
		unblock: "unblock",
		blocked: "blocked"
	}
} as const;

const API = buildPaths(routeTree);

export default API;