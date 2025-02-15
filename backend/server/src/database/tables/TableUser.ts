import Database from "../Database";
import Table from "./table"


// TODO: display name can be null so it is defaulted to username
// TODO: avatarUrl can be defaulted to available avatars (add to public folder some avatars)
// TODO: password must be hashed before inserting in the db
class UserTable extends Table<User, UserParams> {
	protected _tableName: string = "users";

	protected _createStr = `CREATE TABLE IF NOT EXISTS ${this._tableName} (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL UNIQUE,
		displayName TEXT NOT NULL,
		avatarUrl TEXT NOT NULL,
		password TEXT NOT NULL,
		createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
		updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
	);`;
	protected _insertStr = `INSERT INTO ${this._tableName} (username, displayName, avatarUrl, password) VALUES (?, ?, ?, ?)`;
	protected _deleteStr = `DELETE FROM ${this._tableName} WHERE id = ?`;
	protected _updateStr = `UPDATE ${this._tableName} SET username = ?, displayName = ?, avatarUrl = ? WHERE id = ?`;
	private _updatePasswordStr = `UPDATE ${this._tableName} SET password = ? WHERE id = ?`;

	constructor(database: Database) {
		super(database);
		this.init()
	}

	async new(params: UserParams): Promise<DatabaseResult<number>> {
		return new Promise((resolve, reject) => {
			this.database.database.run(this._insertStr, [params.username, params.displayName, params.avatarUrl, params.password],
				function (err) {
					if (err) reject({ error: err })
					else resolve({ result: this.lastID });
				}
			)
		})
	}
	async delete(id: number): Promise<DatabaseResult<boolean>> {
		return new Promise((resolve, reject) => {
			this.database.database.run(this._deleteStr, [id], function (err) {
				if (err) reject({ error: err })
				else resolve({ result: true })
			})
		})
	}
	async update(id: number, params: Omit<UserParams, "password">): Promise<DatabaseResult<number>> {
		return new Promise((resolve, reject) => {
			this.database.database.run(this._updateStr, [params.username, params.displayName, params.avatarUrl, id],
				function (err) {
					if (err) reject({ error: err })
					else resolve({ result: this.lastID });
				}
			)
		})
	}
	async updatePassword(id: number, password: string): Promise<DatabaseResult<number>> {
		return new Promise((resolve, reject) => {
			this.database.database.run(this._updatePasswordStr, [password, id],
				function (err) {
					if (err) reject({ error: err })
					else resolve({ result: this.lastID });
				}
			)
		})
	}
}

export default UserTable;