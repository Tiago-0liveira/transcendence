import Router from "@/router/Router"
import { encodeURIforLogin } from "@/uri-encoding";

const checkAuth: () => Promise<boolean> = async () => {
	return window.user != undefined;
}

// Authentication guard example
export const authGuard: RouteGuard = async (to, from) => {
	const isAuthenticated = await checkAuth(); // Your auth check implementation
	if (!isAuthenticated) {
		const uri = encodeURIforLogin("login", to);
		console.log(uri);
		Router.getInstance().navigate(uri);
		return false;
	}
	return true;
};