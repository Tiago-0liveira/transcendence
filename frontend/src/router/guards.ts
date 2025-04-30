import AuthManager from "@/auth/authManager";
import Router from "@/router/Router"

const checkAuth: () => Promise<boolean> = async () => {
	/*if (!AuthManager.getInstance().loggedIn)
	{
		AuthManager.getInstance().fetchUser()
	}*/
	return AuthManager.getInstance().loggedIn;
}

// Authentication guard example
export const authGuard: RouteGuard = async (to, _from) => {
	const isAuthenticated = await checkAuth(); // Your auth check implementation
	console.log("authGuard: ", to, _from);
	if (!isAuthenticated) {
		Router.getInstance().navigate("/login", {}, { returnTo: Router.makeUrl(to.path, to.params, to.query) });
		return false;
	}
	return true;
};