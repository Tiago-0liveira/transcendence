/*import sqlite3 from "sqlite3";*/
import Sqlite3Database from 'better-sqlite3';
import type { Database as Sqlite3DatabaseType } from "better-sqlite3"
import { DATABASE_URI, DEV_DB_INSERT_FAKE_DATA, DEV_DROP_DB_ON_START } from "@config"
import TableUser from "@db-table/TableUser";
import TableBlackListTokens from "@db-table/TableBlackListTokens";
import TableFriends from "@db-table/TableFriends";
import TableFriendRequests from "@db-table/TableFriendRequests";
import User2FATable from "@db-table/User2FATable";
import fs from "fs"

class Database {
	private static s_instance: Database | null;
	private _database: Sqlite3DatabaseType;

	private _userTable: TableUser;
	private _jwtBlackListTokensTable: TableBlackListTokens;
	private _friendsTable: TableFriends;
	private _friendRequestsTable: TableFriendRequests;
	private _user2FATable: User2FATable;

	public static getInstance(): Database {
		if (!Database.s_instance) {
			Database.s_instance = new Database();

			if (DEV_DB_INSERT_FAKE_DATA) {
				Database.s_instance.userTable.bulkInsert(200);
			}
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
		this._database = new Sqlite3Database(DATABASE_URI);
		this._database.pragma('journal_mode = WAL');/* Increases overall database performance */

		// Tables constructors
		// TODO: instead of passing tableName as params, just move the JOIN sql statements to this class
		this._userTable = new TableUser(this);
		this._jwtBlackListTokensTable = new TableBlackListTokens(this);
		this._friendRequestsTable = new TableFriendRequests(this, this._userTable.tableName);
		this._friendsTable = new TableFriends(this, this._userTable.tableName, this._friendRequestsTable.tableName);
		this._user2FATable = new User2FATable(this);
	}

	public get database() { return this._database; }

	// Tables getters
	public get userTable() { return this._userTable; }
	public get jwtBlackListTokensTable() { return this._jwtBlackListTokensTable; }
	public get friendsTable() { return this._friendsTable; }
	public get friendRequestsTable() { return this._friendRequestsTable; }
	public get user2FATable() { return this._user2FATable; }
}

export default Database;