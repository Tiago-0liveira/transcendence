import Database from "@db/Database";
import BaseTable from "./BaseTable";

class FriendsTable extends BaseTable<Friend, FriendParams> {
	protected _tableName = "friends";
	private _usersTableName;

	protected _createStr;/* Defined in constructor */
	protected _insertStr = `INSERT INTO ${this._tableName} (userId, friendId) VALUES (?, ?)`;
	protected _deleteStr = `DELETE FROM ${this._tableName} WHERE userId = ? AND friendId = ?`;
	protected _updateStr = ""; // Not used
	protected _getFriendsWithInfoStr;/* Defined in constructor */

	constructor(database: Database, usersTableName: string) {
		super(database);
		this._usersTableName = usersTableName;
		this._createStr = `CREATE TABLE IF NOT EXISTS ${this._tableName} (
			userId INTEGER NOT NULL,
			friendId INTEGER NOT NULL,
			createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (userId, friendId),
			FOREIGN KEY (userId) REFERENCES ${this._usersTableName}(id),
			FOREIGN KEY (friendId) REFERENCES ${this._usersTableName}(id)
		);`
		this._getFriendsWithInfoStr = `
			SELECT u.id, u.username, u.displayName, u.avatarUrl
			FROM ${this._tableName} f
			JOIN ${this._usersTableName} u ON u.id = f.friendId
			WHERE f.userId = ?
			ORDER BY u.username
			LIMIT ? OFFSET ?
		;`
		this.init();
	}

	async new(params: FriendParams): Promise<DatabaseResult<number>> {
		
		const { userId, friendId } = params;

		return new Promise((resolve, reject) => {
			const db = this.database.database;
			db.serialize(() => {
				db.run("BEGIN TRANSACTION");
				db.run(this._insertStr, [userId, friendId]);
				db.run(this._insertStr, [friendId, userId]);
				db.run("COMMIT", function (err) {
					if (err) {
						db.run("ROLLBACK");
						resolve({ error: err });
					} else {
						resolve({ result: 2 }); // 2 rows inserted
					}
				});
			});
		});
	}

	/**
	 - Delete requires both userId and friendId or it will throw an Error
	*/
	async delete(userId: number, friendId?: number): Promise<DatabaseResult<boolean>> {
		if (friendId == null) {
			throw new Error("FriendsTable.delete requires both userId and friendId.")
		}
		const db = this.database.database;
		return new Promise((resolve, reject) => {
			db.serialize(() => {
				db.run("BEGIN TRANSACTION");
				db.run(this._deleteStr, [userId, friendId]);
				db.run(this._deleteStr, [friendId, userId]);
				db.run("COMMIT", function (err) {
					if (err) {
						db.run("ROLLBACK");
						reject({ error: err });
					} else {
						resolve({ result: true });
					}
				});
			});
		});
	}

	async update(): Promise<DatabaseResult<number>> {
		return Promise.reject({ error: "update not supported for friends table" });
	}

	async getFriendsWithInfo(userId: number, offset = 0, limit = 50): Promise<DatabaseResult<FriendUser[]>> {
		return new Promise((resolve, reject) => {
			this.database.database.all(
				this._getFriendsWithInfoStr,
				[userId, limit, offset],
				(err, rows: FriendUser[]) => {
					if (err) resolve({ error: err });
					else resolve({ result: rows });
				}
			);
		});
	}
	
}

export default FriendsTable;