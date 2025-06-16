import BaseTable from "./BaseTable";
import Database from "@db/Database";

interface BlockedUser extends UIDD {
  userId: number; // The user who blocked someone
  blockedUserId: number; // The user who was blocked
  createdAt: Date;
}

interface BlockedUserParams {
  userId: number;
  blockedUserId: number;
}

class BlockedUsersTable extends BaseTable<BlockedUser, BlockedUserParams> {
  protected _tableName = "blocked_users";

  protected _createStr = `CREATE TABLE IF NOT EXISTS ${this._tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        blockedUserId INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(userId, blockedUserId),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (blockedUserId) REFERENCES users(id)
    );`;

  protected _insertStr = `INSERT INTO ${this._tableName} (userId, blockedUserId) VALUES (?, ?)`;
  protected _deleteStr = `DELETE FROM ${this._tableName} WHERE userId = ? AND blockedUserId = ?`;
  protected _updateStr = "";

  constructor(database: Database) {
    super(database);
    this.init();
  }

  async new(params: BlockedUserParams): Promise<DatabaseResult<number>> {
    try {
      // Prevent users from blocking themselves
      if (params.userId === params.blockedUserId) {
        return { error: new Error("Cannot block yourself") };
      }

      const stmt = this.database.database.prepare(this._insertStr);
      const result = stmt.run(params.userId, params.blockedUserId);
      return { result: result.lastInsertRowid as number };
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return { error: new Error("User already blocked") };
      }
      return { error: new Error(`Database error: ${err.message}`) };
    }
  }

  async unblock(
    userId: number,
    blockedUserId: number,
  ): Promise<DatabaseResult<boolean>> {
    try {
      const stmt = this.database.database.prepare(this._deleteStr);
      const result = stmt.run(userId, blockedUserId);
      return { result: result.changes > 0 };
    } catch (err: any) {
      return { error: new Error(`Database error: ${err.message}`) };
    }
  }

  async isBlocked(
    userId: number,
    potentialBlockedUserId: number,
  ): Promise<boolean> {
    try {
      const stmt = this.database.database.prepare(`
                SELECT 1 FROM ${this._tableName}
                WHERE userId = ? AND blockedUserId = ?
                LIMIT 1
            `);
      const result = stmt.get(userId, potentialBlockedUserId);
      return !!result;
    } catch (err: any) {
      console.error("Error checking if user is blocked:", err);
      return false;
    }
  }

  async getBlockedUsers(userId: number): Promise<DatabaseResult<FriendUser[]>> {
    try {
      const stmt = this.database.database.prepare(`
                SELECT u.id, u.username, u.displayName, u.avatarUrl
                FROM ${this._tableName} b
                JOIN users u ON b.blockedUserId = u.id
                WHERE b.userId = ?
                ORDER BY u.displayName
            `);
      const rows = stmt.all(userId) as FriendUser[];
      return { result: rows };
    } catch (err: any) {
      return { error: new Error(`Database error: ${err.message}`) };
    }
  }

  async getUsersWhoBlockedMe(
    userId: number,
  ): Promise<DatabaseResult<number[]>> {
    try {
      const stmt = this.database.database.prepare(`
                SELECT userId FROM ${this._tableName}
                WHERE blockedUserId = ?
            `);
      const rows = stmt.all(userId) as { userId: number }[];
      return { result: rows.map((row) => row.userId) };
    } catch (err: any) {
      return { error: new Error(`Database error: ${err.message}`) };
    }
  }
}

export default BlockedUsersTable;
