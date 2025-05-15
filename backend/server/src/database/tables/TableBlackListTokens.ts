import Database from "@db/Database";
import BaseTable from "@db-table/BaseTable"

class BlackListTokensTable extends BaseTable<BlackListToken, BlackListToken> {
	protected _tableName: string = "black_list_jwt_refresh_tokens";

	protected _createStr = `CREATE TABLE IF NOT EXISTS ${this._tableName} (
		token TEXT NOT NULL UNIQUE
	);`;
	protected _insertStr = `INSERT INTO ${this._tableName} (token) VALUES (?)`;
	protected _getStr = `SELECT (token) FROM ${this._tableName} WHERE token = ?`
	protected _deleteStr = ``;
	protected _updateStr = ``;

	constructor(database: Database) {
		super(database);
		this.init()
	}

	async new(params: BlackListToken): Promise<DatabaseResult<number>> {
		return new Promise((resolve, reject) => {
			const insert = this.db.prepare(this._insertStr)
			const run1 = insert.run(params.token)
			if (run1.changes === 0) {
				resolve({ error: new Error(`Could not insert to ${this._tableName}`) })
			} else {
				resolve({ result: run1.lastInsertRowid as number })
			}
		})
	}
	async delete(id: number): Promise<DatabaseResult<boolean>> {
		throw Error("This table does not have a delete method!");
	}
	async update(id: number, params: BlackListToken): Promise<DatabaseResult<number>> {
		throw Error("This table does not have a update method!");
	}
	async updatePassword(id: number, password: string): Promise<DatabaseResult<number>> {
		throw Error("This table does not have a update method!");
	}
	async exists(token: string): Promise<DatabaseResult<boolean>> {
		return new Promise((resolve, reject) => {
			const get = this.db.prepare(this._getStr)
			const run = get.get(token)
			if (run) {
				resolve({ result: Boolean(run) })
			} else {
				resolve({ error: new Error("Token does not exist!") })
			}
		})
	}
}

export default BlackListTokensTable;