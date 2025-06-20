import Database from "@db/Database";
import BaseTable from "./BaseTable";

class FriendRequestsTable extends BaseTable<FriendRequest, FriendRequestParams> {
	protected _tableName = "friend_requests";
	private _usersTableName: string;

	protected _createStr = `CREATE TABLE IF NOT EXISTS ${this._tableName} (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		senderId INTEGER NOT NULL,
		receiverId INTEGER NOT NULL,
		status TEXT NOT NULL DEFAULT 'pending',
		createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
		updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (senderId) REFERENCES users(id),
		FOREIGN KEY (receiverId) REFERENCES users(id),
		UNIQUE(senderId, receiverId)
	);`;
	protected _insertStr = `INSERT INTO ${this._tableName} (senderId, receiverId, status) VALUES (?, ?, ?)`;
	protected _deleteStr = `DELETE FROM ${this._tableName} WHERE senderId = ? AND receiverId = ?`;
	protected _updateStr = `UPDATE ${this._tableName} SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE senderId = ? AND receiverId = ?`;
	protected _getFriendRequests;

	constructor(database: Database, usersTableName: string) {
		super(database);
		this._usersTableName = usersTableName;
		this._getFriendRequests = `
			SELECT u.id, u.username, u.displayName, u.avatarUrl
			FROM ${this._tableName} f
			JOIN ${this._usersTableName} u ON u.id = f.senderId
			WHERE f.receiverId = ? AND f.status = 'pending'
			ORDER BY u.username
			LIMIT ? OFFSET ?
		;`;
		this.init();
	}

	async new(params: FriendRequestParams): Promise<DatabaseResult<number>> {
		return new Promise((resolve, reject) => {
			const insert = this.db.prepare(this._insertStr)
			const run1 = insert.run(params.senderId, params.receiverId, params.status ?? "pending")
			
			if (run1.changes === 0) {
				resolve({ error: new Error("Friend request already exists") })
			} else {
				resolve({ result: run1.lastInsertRowid as number })
			}
		});
	}
	
	/**
	 - Delete requires both userId and friendId or it will throw an Error
	*/
	async delete(userId: number, friendId?: number): Promise<DatabaseResult<boolean>> {
		if (friendId == null) {
			throw new Error(`${this._tableName}.delete requires both userId and friendId.`)
		}
		return new Promise((resolve, reject) => {
			const del = this.db.prepare(this._deleteStr)
			const run1 = del.run(userId, friendId)
			if (run1.changes === 0) {
				resolve({ error: new Error("Could not delete FriendRequest") })
			} else {
				resolve({ result: true })
			}
		});
	}

	/** 
	 * @deprecated
	 * @description Should not be used, just throws an Error, use `this.updateRequest` instead
	*/
	async update(id: number, params: FriendRequestParams): Promise<DatabaseResult<number>> {
		throw new Error("This function has no functionality! Do not use it!")
	}

	private async updateRequest(params: FriendRequestParams): Promise<DatabaseResult<number>> {
		return new Promise((resolve, reject) => {
			const insert = this.db.prepare(this._updateStr)
			const run1 = insert.run(params.status ?? "accepted", params.senderId, params.receiverId)
			if (run1.changes === 0) {
				resolve({ error: new Error("No request found to update.") });
			} else {
				resolve({ result: run1.lastInsertRowid as number });
			}
		});
	}

	async acceptRequest(senderId: number, receiverId: number): Promise<DatabaseResult<number>> {
		return this.updateRequest({ receiverId: senderId, senderId: receiverId, status: "accepted" });
	}	
	
	async rejectRequest(senderId: number, receiverId: number): Promise<DatabaseResult<boolean>> {
		return await this.delete(senderId, receiverId)
	}
	

	async getFriendRequestsWithInfo(userId: number, offset = 0, limit = 50): Promise<DatabaseResult<FriendUser[]>> {
		return new Promise((resolve, reject) => {
			const getFriends = this.db.prepare(this._getFriendRequests)
			const run1 = getFriends.all(userId, limit, offset)
			if (run1) {
				resolve({ result: run1 as FriendUser[] })
			} else {
				resolve({ result: [] })
			}
		});
	}
}

export default FriendRequestsTable;