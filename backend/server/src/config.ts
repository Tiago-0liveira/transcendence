import * as dotenv from "dotenv";
import path, { dirname } from "path"
import fs from "fs"
import { fileURLToPath } from "url";

// Load environment variables from .env file
dotenv.config();

// Access environment variables
const PORT = Number(process.env.PORT) || 4000;
const DEV_MODE = process.env.NODE_ENV === "development";

if (!process.env.JWT_SECRET)
	throw new Error("JWT_SECRET env variable must be defined!");
if (!process.env.FRONTEND_URL)
	throw new Error("FRONTEND_URL env variable must be defined!");

const FRONTEND_URL = process.env.FRONTEND_URL;
const JWT_SECRET = process.env.JWT_SECRET;

// Get the directory name from the file path
const __project_root = "/app/";

const DATABASE_FILE_DIR = path.join(__project_root, "database");
fs.mkdir(DATABASE_FILE_DIR, {recursive: true}, (err) => {
	console.error(err);
});

const DATABASE_URI = path.join(DATABASE_FILE_DIR, DEV_MODE ? "dev.db" : "prod.db");

export { PORT, DEV_MODE, JWT_SECRET, DATABASE_URI, FRONTEND_URL };