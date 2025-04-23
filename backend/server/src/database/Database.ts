import sqlite3 from "sqlite3";
import { DATABASE_URI, DEV_DROP_DB_ON_START } from "@config"
import TableUser from "@db-table/TableUser";
import TableBlackListTokens from "@db-table/TableBlackListTokens";
import TableFriends from "@db-table/TableFriends";
import TableFriendRequests from "@db-table/TableFriendRequests";
import fs from "fs"

class Database {
	private static s_instance: Database | null;
	private _database: sqlite3.Database;

	private _userTable: TableUser;
	private _jwtBlackListTokensTable: TableBlackListTokens;
	private _friendsTable: TableFriends;
	private _friendRequestsTable: TableFriendRequests;

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
		this._friendsTable = new TableFriends(this, this._userTable.tableName);
		this._friendRequestsTable = new TableFriendRequests(this, this._userTable.tableName);
	}

	public get database() { return this._database; }

	// Tables getters
	public get userTable() { return this._userTable; }
	public get jwtBlackListTokensTable() { return this._jwtBlackListTokensTable; }
	public get friendsTable() { return this._friendsTable; }
	public get friendRequestsTable() { return this._friendRequestsTable; }
}

export default Database;