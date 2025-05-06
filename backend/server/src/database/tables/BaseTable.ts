import Database from "@db/Database";

abstract class BaseTable<T, TPARAMS> {
	protected database: Database;

	protected abstract _tableName: string;
	protected abstract _createStr: string;
	protected abstract _insertStr: string;
	protected abstract _deleteStr: string;
	protected abstract _updateStr: string;

	constructor(database: Database) {
		this.database = database;
		/*this.init();*/
	}

	// INFO: needs to be called only after super(...)
	protected init() {
		this.database.database.run(this._createStr);
	}


	// TODO: do not fetch password from db, very insecure (easy fix)
	async getById(id: number): Promise<DatabaseResult<T>> {
		return new Promise((resolve, reject) => {
			this.database.database.get(`SELECT * FROM ${this._tableName} WHERE id = ?`, [id], function (err, row: T) {
				if (err) reject({ error: err })
				else resolve({ result: row })
			})
		})
	}
	abstract new(params: TPARAMS): Promise<DatabaseResult<number>>;
	abstract delete(id: number): Promise<DatabaseResult<boolean>>;
	abstract update(id: number, params: TPARAMS): Promise<DatabaseResult<number>>;
}

export default BaseTable;