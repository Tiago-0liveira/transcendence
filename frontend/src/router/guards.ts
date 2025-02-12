const checkAuth: () => Promise<boolean> = async () => true

// Authentication guard example
const authGuard: RouteGuard = async (to, from) => {
	const isAuthenticated = await checkAuth(); // Your auth check implementation
	if (!isAuthenticated) {
		window.router.navigate('/login');
		return false;
	}
	return true;
};