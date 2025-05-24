import Database from "@db/Database";
import BaseTable from "@db-table/BaseTable";

class User2FATable extends BaseTable<User2FA, User2FAParams> {
    protected _tableName = "user2fa";

    protected _createStr = `CREATE TABLE IF NOT EXISTS ${this._tableName} (
        userId INTEGER PRIMARY KEY,
        enabled BOOLEAN NOT NULL DEFAULT 0,
        secret TEXT,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );`;

    protected _insertStr = `INSERT INTO ${this._tableName} (userId, enabled, secret) VALUES (?, ?, ?)`;
    protected _deleteStr = `DELETE FROM ${this._tableName} WHERE userId = ?`;
    protected _updateStr = `UPDATE ${this._tableName} SET enabled = ?, secret = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?`;

    constructor(database: Database) {
        super(database);
        this.init();
    }

    async new(params: User2FAParams): Promise<DatabaseResult<number>> {
        const stmt = this.db.prepare(this._insertStr);
        const result = stmt.run(params.userId, params.enabled ? 1 : 0, params.secret);
        return { result: result.lastInsertRowid as number };
    }

    async update(userId: number, params: User2FAParams): Promise<DatabaseResult<number>> {
        const stmt = this.db.prepare(this._updateStr);
        const result = stmt.run(params.enabled ? 1 : 0, params.secret, userId);
        return { result: result.lastInsertRowid as number };
    }

    async delete(userId: number): Promise<DatabaseResult<boolean>> {
        const stmt = this.db.prepare(this._deleteStr);
        const result = stmt.run(userId);
        return { result: result.changes > 0 };
    }

    async getByUserId(userId: number): Promise<DatabaseResult<User2FA>> {
        try {
            const stmt = this.db.prepare(`SELECT * FROM ${this._tableName} WHERE userId = ?`);
            const row = stmt.get(userId);
            return { result: row as User2FA };
        } catch (err: any) {
            return { error: new Error(`Failed to get 2FA info: ${err.message}`) };
        }
    }
}

export default User2FATable;
