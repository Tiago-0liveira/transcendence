import { buildPaths } from "@/utils/path";

const routeTree = {
	auth: {
		me: "me",
		signup: "signup",
		login: "login",
		friends: {
			possibleFriends: "possibleFriends",
			me: "me",
			add: "add",
			remove: "remove",
			requests: {
				pending: {
					cancel: "cancel",
				},
				accept: "accept",
				reject: "reject",
			},
		},
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
		account: "account",
		twofa: {
			toggle: "2fa/toggle",
			verify: "2fa/verify",
			status: "2fa/status",
		},
	},
} as const;

const API = buildPaths(routeTree);

export default API;