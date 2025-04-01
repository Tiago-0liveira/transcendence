const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

console.log(import.meta.env)

if (!BACKEND_URL)
    throw new Error("VITE_BACKEND_URL is necessary in the .env file! Please define it")
if (!GOOGLE_CLIENT_ID)
	throw new Error("VITE_GOOGLE_CLIENT_ID is necessary in the .env file! Please define it")

export { BACKEND_URL, GOOGLE_CLIENT_ID }