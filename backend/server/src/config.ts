import * as dotenv from "dotenv";
import path, { dirname } from "path"
import fs from "fs"
import { fileURLToPath } from "url";

// Load environment variables from .env file
dotenv.config();

// Access environment variables
const PORT = Number(process.env.PORT) || 4000;
const DEV_MODE = process.env.NODE_ENV === "development";


// Get the directory name from the file path
const __project_root = "/app/";

const DATABASE_FILE_DIR = path.join(__project_root, "database");
fs.mkdir(DATABASE_FILE_DIR, {recursive: true}, (err) => {
	console.error(err);
});
const DATABASE_URI = path.join(DATABASE_FILE_DIR, DEV_MODE ? "dev.db" : "prod.db");
console.log(DATABASE_URI);
export { PORT, DEV_MODE, DATABASE_URI };