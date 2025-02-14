
// Loading middleware example
const loadingMiddleware: Middleware = async (_to, _from) => {
	// Show loading state
	document.body.classList.add('loading');

	// Clean up after route change
	await new Promise(resolve => setTimeout(resolve, 0));
	document.body.classList.remove('loading');
};