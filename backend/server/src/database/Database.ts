import sqlite3 from "sqlite3";
import { DATABASE_URI } from "../config"
import TableUser from "./tables/TableUser";

class Database {
	private static s_instance: Database | null;
	private _database: sqlite3.Database;

	private _userTable: TableUser;

	public static getInstance(): Database {
		if (!Database.s_instance) {
			Database.s_instance = new Database();
		}
		return Database.s_instance;
	}

	private constructor() {
		this._database = new sqlite3.Database(DATABASE_URI);

		// Tables constructors
		this._userTable = new TableUser(this);
	}

	public get database() { return this._database; }

	// Tables getters
	public get userTable() { return this._userTable; }
}

export default Database;