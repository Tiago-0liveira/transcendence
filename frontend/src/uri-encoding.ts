

export const encodeURIforLogin = (to: string, route: Route): string => {
	let path = encodeURIComponent(route.path);

	// TODO: encode route.params in the future
	/*path += encodeURIComponent(JSON.stringify(route.params));*/
	if (Object.keys(route.query).length > 0)
		path += "?" + new URLSearchParams(route.query).toString();
	
	return `/${to}?returnTo=${path}`;
}

export const decodeURIfromRoute = (route: Route): string => {
    try {
        // Get URL parameters from the current route
        /*const params = JSON.parse(decodeURIComponent(route.params.params || '{}'));*/
        const query = JSON.parse(decodeURIComponent(route.params.query || '{}'));
        const returnTo = decodeURIComponent(route.query.returnTo || '/');

        // Build the final URL starting with the path
        let finalUrl = returnTo;

        // Add query parameters if they exist
        if (Object.keys(query).length > 0) {
            const queryString = new URLSearchParams(query).toString();
            finalUrl += `?${queryString}`;
        }

        return finalUrl;
    } catch (error) {
        console.error('Error decoding return URL:', error);
        return '/'; // Return to home page as fallback
    }
}