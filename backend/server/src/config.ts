import * as dotenv from "dotenv";
import path, { dirname } from "path"
import fs from "fs"
import { fileURLToPath } from "url";

// Load environment variables from .env file
dotenv.config();

// Access environment variables
const PORT = Number(process.env.PORT) || 4000;
const DEV_MODE = process.env.NODE_ENV === "development";

/**
 * @description Will return false if in development mode otherwise check the flag for bool value
 */
function DEV_DEP_ENV_VAR(var_name: string): boolean {
	return DEV_MODE ? process.env[var_name] === "true" : false;
}

if (!process.env.JWT_SECRET)
	throw new Error("JWT_SECRET env variable must be defined!");
if (!process.env.JWT_REFRESH_SECRET)
	throw new Error("JWT_SECRET env variable must be defined!");
if (!process.env.FRONTEND_URL)
	throw new Error("FRONTEND_URL env variable must be defined!");

const FRONTEND_URL = process.env.FRONTEND_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET_ID;
const GOOGLE_AUTH_ENABLED = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET;
if (!GOOGLE_AUTH_ENABLED)
	console.warn("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET env variables are not defined! This will cause Google OAuth to fail.");
else 
	console.info("Google OAuth is enabled.");

// Drop the database on server start
// only works in development mode
const DEV_DROP_DB_ON_START = DEV_DEP_ENV_VAR("DEV_DROP_DB_ON_START");
const DEV_DB_INSERT_FAKE_DATA = DEV_DROP_DB_ON_START && DEV_DEP_ENV_VAR("DEV_DB_INSERT_FAKE_DATA");

// Get the directory name from the file path
const __project_root = "/app/";

const DATABASE_FILE_DIR = path.join(__project_root, "database");
fs.mkdir(DATABASE_FILE_DIR, {recursive: true}, (err) => {
	console.error(err);
});

const DATABASE_URI = path.join(DATABASE_FILE_DIR, DEV_MODE ? "dev.db" : "prod.db");

export { 
	PORT, DEV_MODE, 
	JWT_SECRET, JWT_REFRESH_SECRET,
	DATABASE_URI, DEV_DROP_DB_ON_START, DEV_DB_INSERT_FAKE_DATA,
	GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_AUTH_ENABLED,
	FRONTEND_URL
};