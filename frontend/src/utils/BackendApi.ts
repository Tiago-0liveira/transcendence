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
} as const;

const API = buildPaths(routeTree);
console.log(API)

export default API;