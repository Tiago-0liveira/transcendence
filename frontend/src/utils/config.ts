const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
console.log(import.meta.env)

if (!BACKEND_PORT)
    throw new Error("VITE_BACKEND_PORT is necessary in the .env file! Please define it")
const BACKEND_URL = window.location.protocol + "//" +  window.location.hostname + ":" + BACKEND_PORT
const GOOGLE_OAUTH_ENABLED = Boolean(GOOGLE_CLIENT_ID);
if (!GOOGLE_OAUTH_ENABLED)
{
	console.warn("VITE_GOOGLE_CLIENT_ID is necessary in the .env file! Please define it")
}

export { 
	BACKEND_URL, 
	GOOGLE_OAUTH_ENABLED, GOOGLE_CLIENT_ID
}