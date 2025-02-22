import Database from "../Database";
import Table from "./table"

class BlackListTokensTable extends Table<BlackListToken, BlackListToken> {
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
			try {
				this.database.database.run(this._insertStr, [params.token],
					function (err) {
						if (err) reject({ error: err })
						else resolve({ result: this.lastID });
					}
				)
			} catch (error) {
				reject({ error })
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
			this.database.database.get(this._getStr, [token],
				function (err, row) {
					if (err) reject({ error: err })
					else resolve(({ result: !!row }))
				}
			)
		})
	}
}

export default BlackListTokensTable;