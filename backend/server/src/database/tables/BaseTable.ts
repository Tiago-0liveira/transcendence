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

	async getById(id: number): Promise<DatabaseResult<T>> {
		try {
			const stmt = this.database.database.prepare(`
			SELECT id, username, displayName, avatarUrl, authProvider
			FROM ${this._tableName}
			WHERE id = ?
		`);
			const row = stmt.get(id);

			if (row) {
				return { result: row as T };
			} else {
				return { error: new Error(`User with id ${id} not found`) };
			}
		} catch (err: any) {
			return { error: new Error(`Database error: ${err.message}`) };
		}
	}


	abstract new(params: TPARAMS): Promise<DatabaseResult<number>>;
	abstract delete(id: number): Promise<DatabaseResult<boolean>>;
	abstract update(id: number, params: TPARAMS): Promise<DatabaseResult<number>>;
}

export default BaseTable;