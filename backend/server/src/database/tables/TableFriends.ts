import Database from "@db/Database";
import BaseTable from "./BaseTable";
import { connectedSocketClients } from "@api/websocket";

class FriendsTable extends BaseTable<Friend, FriendParams> {
	protected _tableName = "friends";
	private _usersTableName;
	private _friendRequestsTableName

	protected _createStr;/* Defined in constructor */
	protected _insertStr = `INSERT INTO ${this._tableName} (userId, friendId) VALUES (?, ?)`;
	protected _deleteStr = `DELETE FROM ${this._tableName} WHERE userId = ? AND friendId = ?`;
	protected _updateStr = ""; // Not used
	protected _getFriendsWithInfoStr;/* Defined in constructor */
	protected _getPossibleFriendsStr;/* Defined in constructor */
	protected _getBlockedUsersWithInfoStr;/* Defined in constructor */

	constructor(database: Database, usersTableName: string, friendRequestsTableName: string) {
		super(database);
		this._usersTableName = usersTableName;
		this._friendRequestsTableName = friendRequestsTableName;
		this._createStr = `CREATE TABLE IF NOT EXISTS ${this._tableName} (
			userId INTEGER NOT NULL,
			friendId INTEGER NOT NULL,
			createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (userId, friendId),
			FOREIGN KEY (userId) REFERENCES ${this._usersTableName}(id),
			FOREIGN KEY (friendId) REFERENCES ${this._usersTableName}(id),
			UNIQUE(userId, friendId)
		);`;
		this._getFriendsWithInfoStr = `
			SELECT u.id, u.username, u.displayName, u.avatarUrl
			FROM ${this._tableName} f
			JOIN ${this._usersTableName} u ON u.id = f.friendId
			WHERE f.userId = ?
			ORDER BY u.username
			LIMIT ? OFFSET ?
		;`;
		this._getBlockedUsersWithInfoStr = `
			SELECT u.id, u.username, u.displayName, u.avatarUrl
			FROM ${this._friendRequestsTableName} fr
					 JOIN ${this._usersTableName} u ON u.id = fr.senderId
			WHERE fr.receiverId = ? AND fr.status = 'rejected'
			ORDER BY u.username
				LIMIT ? OFFSET ?
			;`;
		this._getPossibleFriendsStr = `
	SELECT 
		u.id, 
		u.username, 
		u.displayName, 
		u.avatarUrl,

		-- Flag: true if u.id sent a pending request to userId
		EXISTS (
			SELECT 1 
			FROM friend_requests 
			WHERE status = 'pending'
			AND senderId = u.id AND receiverId = ?
		) AS hasInvitedMe,

		-- Flag: true if there's any pending request between userId and u.id
		EXISTS (
			SELECT 1 
			FROM friend_requests 
			WHERE status = 'pending'
			AND senderId = ? AND receiverId = u.id
		) AS isPending

	FROM ${this._usersTableName} u

	WHERE u.id != ?
	-- Filter by name (starts with)
	AND (
		u.displayName LIKE ?
	)

	-- Exclude existing friends
	AND u.id NOT IN (
		SELECT friendId 
		FROM ${this._tableName} 
		WHERE userId = ?
	)

	-- Exclude rejections
	AND NOT EXISTS (
		SELECT 1
		FROM ${this._friendRequestsTableName}
		WHERE status = 'rejected'
		AND (
			(senderId = ? AND receiverId = u.id)
			OR (senderId = u.id AND receiverId = ?)
		)
	)

	-- Exclude users who have blocked me
	AND NOT EXISTS (
		SELECT 1
		FROM blocked_users
		WHERE userId = u.id AND blockedUserId = ?
	)

	ORDER BY hasInvitedMe DESC, isPending DESC, u.username
	LIMIT ? OFFSET ?
`;


		this.init();
	}

	private newTransaction = this.db.transaction((userId: number, friendId: number) => {
		const insert = this.db.prepare(this._insertStr)
		insert.run(userId, friendId)
		insert.run(friendId, userId)
		return { result: 2 }
	})
	async new(params: FriendParams): Promise<DatabaseResult<number>> {
		const { userId, friendId } = params;

		return new Promise((resolve, reject) => {
			try {
				resolve(this.newTransaction(userId, friendId))
			} catch (error) {
				resolve({ error: new Error("could not insert new rows ") })
				console.error(error)
			}
		});
	}

	/**
	 - Delete requires both userId and friendId or it will throw an Error
	*/
	private delTransaction = this.db.transaction((userId: number, friendId: number) => {
		const del = this.db.prepare(this._deleteStr)
		const del1 = del.run(userId, friendId)
		const del2 = del.run(friendId, userId)
		if (del1.changes === 0 || del2.changes === 0) {
			return { error: new Error("Error deleting from friendsTable") }
		}
		const delFriendRequest = this.db.prepare(`DELETE FROM ${this._friendRequestsTableName} WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)`)
		if (delFriendRequest.run(userId, friendId, friendId, userId).changes === 0) {
			return { error: new Error("Error deleting from friendRequestsTable") }
		}
		return { result: true }
	})
	async delete(userId: number, friendId?: number): Promise<DatabaseResult<boolean>> {
		if (friendId == null) {
			throw new Error(`${this._tableName}.delete requires both userId and friendId.`)
		}
		return new Promise((resolve, reject) => {
			try {
				resolve(this.delTransaction(userId, friendId))
			} catch (error) {
				resolve({ error: new Error("could not delete") })
				console.error(error)
			}
		});
	}

	async update(): Promise<DatabaseResult<number>> {
		return Promise.reject({ error: "update not supported for friends table" });
	}

	async getFriendsWithInfo(userId: number, offset = 0, limit = 50): Promise<DatabaseResult<FriendUser[]>> {
		return new Promise((resolve, reject) => {
			const getFriends = this.db.prepare(this._getFriendsWithInfoStr)
			const run1 = getFriends.all(userId, limit, offset)
			if (run1) {
				(run1 as FriendUser[]).forEach(friendUser => {
					const friendUserConnectedClient = connectedSocketClients.get(friendUser.id)
					friendUser.online = friendUserConnectedClient !== undefined && friendUserConnectedClient.connected
				})
				resolve({ result: run1 as FriendUser[] })
			}
			else resolve({ result: [] as FriendUser[] })
		});
	}

	async getBlockedUsersWithInfo(userId: number, offset = 0, limit = 50): Promise<DatabaseResult<FriendUser[]>> {
		return new Promise((resolve, reject) => {
			const getBlocked = this.db.prepare(this._getBlockedUsersWithInfoStr);
			const result = getBlocked.all(userId, limit, offset);
			if (result) resolve({ result: result as FriendUser[] });
			else resolve({ result: [] as FriendUser[] });
		});
	}

	getRelationBetweenUsers(receiverId: number, senderId: number): boolean {
		const stmt = this.database.database.prepare(`SELECT 1 FROM friend_requests
              WHERE (senderId = ? AND receiverId = ?)
                 OR (senderId = ? AND receiverId = ?) LIMIT 1
		`);

		const row = stmt.get(receiverId, senderId, senderId, receiverId);
		return !!row;
	}

	deleteSpecificRelation(receiverId: number, senderId: number, status: string): DatabaseResult<void> {
		try {
			if (status === "accepted") {
				// Удаляем из friends (в обе стороны)
				const deleteFromFriends = this.database.database.prepare(`
				DELETE FROM friends
				WHERE (userId = ? AND friendId = ?)
				   OR (userId = ? AND friendId = ?)
			`);
				deleteFromFriends.run(receiverId, senderId, senderId, receiverId);

				// Удаляем заявки из friends_request
				const deleteRequests = this.database.database.prepare(`
				DELETE FROM friend_requests
				WHERE (senderId = ? AND receiverId = ?)
				   OR (senderId = ? AND receiverId = ?)
			`);
				deleteRequests.run(receiverId, senderId, senderId, receiverId);

			} else if (status === "rejected") {
				// Только из friends_request
				const deleteRejected = this.database.database.prepare(`
				DELETE FROM friend_requests
				WHERE (senderId = ? AND receiverId = ?)
				   OR (senderId = ? AND receiverId = ?)
			`);
				deleteRejected.run(senderId, receiverId, receiverId, senderId);
			} else {
				return { error: new Error(`Unsupported status '${status}'`) };
			}

			return { result: undefined };
		} catch (error) {
			return { error: new Error("deleteSpecificRelation Error!") };
		}
	}

	/**
	 * @param userId - The ID of the user to search for possible friends.
	 * @param name - The name to search for (can be partial).
	 * @param offset - The offset for pagination (default is 0).
	 * @param limit - The maximum number of results to return (default is 50).
	 * @returns A promise that resolves to an array of possible friends.
	 */
	async getPossibleFriends(userId: number, name: string, offset = 0, limit = 50): Promise<DatabaseResult<PossibleFriendUser[]>> {
		const nameSearch = `%${name}%`;
		return new Promise((resolve, reject) => {
			const possibleFriends = this.db.prepare(this._getPossibleFriendsStr)
			const get1 = possibleFriends.all(
				userId,  // hasInvitedMe
				userId,  // isPending
				userId,  // u.id != ?
				nameSearch,  // displayName LIKE ?
				userId,  // exclude existing friends
				userId,  // rejection check (sender)
				userId,  // rejection check (receiver)
				userId,  // blocked_users check (blockedUserId)
				limit,
				offset
			)
			if (get1) {
				return resolve({ result: get1 as PossibleFriendUser[] })
			} else {
				return resolve({ result: [] })
			}
		});
	}

}

export default FriendsTable;