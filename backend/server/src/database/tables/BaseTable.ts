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
		this.database.database.exec(this._createStr);
	}

	protected get db() { return this.database.database }

	public get tableName() { return this._tableName; }

	// TODO: do not fetch password from db, very insecure (easy fix)
	async getById(id: number): Promise<DatabaseResult<T>> {
		return new Promise((resolve, reject) => {
			const select = this.database.database.prepare(`SELECT * FROM ${this._tableName} WHERE id = ?`)
			const get1 = select.get(id)
			if (get1) resolve({result: get1 as T})
			reject({error: new Error(`Could not get by id: ${id}`)})
		})
	}
	abstract new(params: TPARAMS): Promise<DatabaseResult<number>>;
	abstract delete(id: number): Promise<DatabaseResult<boolean>>;
	abstract update(id: number, params: TPARAMS): Promise<DatabaseResult<number>>;
}

export default BaseTable;