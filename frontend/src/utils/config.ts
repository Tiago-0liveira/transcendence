const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

console.log(import.meta.env)

if (!BACKEND_URL)
    throw new Error("VITE_BACKEND_URL is necessary in the .env file! Please define it")

export { BACKEND_URL }