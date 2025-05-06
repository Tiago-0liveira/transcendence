const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

console.log(import.meta.env)

if (!BACKEND_URL)
    throw new Error("VITE_BACKEND_URL is necessary in the .env file! Please define it")
const GOOGLE_OAUTH_ENABLED = Boolean(GOOGLE_CLIENT_ID);
if (!GOOGLE_OAUTH_ENABLED)
{
	console.warn("VITE_GOOGLE_CLIENT_ID is necessary in the .env file! Please define it")
}

export { 
	BACKEND_URL, 
	GOOGLE_OAUTH_ENABLED, GOOGLE_CLIENT_ID
}