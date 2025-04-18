import sqlite3 from "sqlite3";
import { DATABASE_URI, DEV_DROP_DB_ON_START } from "@config"
import TableUser from "@db-table/TableUser";
import TableBlackListTokens from "@db-table/TableBlackListTokens";
import fs from "fs"

class Database {
	private static s_instance: Database | null;
	private _database: sqlite3.Database;

	private _userTable: TableUser;
	private _jwtBlackListTokensTable: TableBlackListTokens;

	public static getInstance(): Database {
		if (!Database.s_instance) {
			Database.s_instance = new Database();
		}
		return Database.s_instance;
	}

	private constructor() {
		if (DEV_DROP_DB_ON_START) {
			console.log("DEV_DROP_DB_ON_START is enabled || Dropping database...");
			try {
				fs.unlinkSync(DATABASE_URI);
			} catch (err) {
				console.error(err);
			}
		}
		this._database = new sqlite3.Database(DATABASE_URI);

		// Tables constructors
		this._userTable = new TableUser(this);
		this._jwtBlackListTokensTable = new TableBlackListTokens(this);
	}

	public get database() { return this._database; }

	// Tables getters
	public get userTable() { return this._userTable; }
	public get jwtBlackListTokensTable() { return this._jwtBlackListTokensTable; }
}

export default Database;