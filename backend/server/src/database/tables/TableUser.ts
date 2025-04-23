import { UserAuthMethod } from "@enums/enums";
import Database from "@db/Database";
import BaseTable from "@db-table/BaseTable"


// TODO: display name can be null so it is defaulted to username
// TODO: avatarUrl can be defaulted to available avatars (add to public folder some avatars)
// TODO: password must be hashed before inserting in the db
class UserTable extends BaseTable<User, UserParams> {
	protected _tableName: string = "users";

	protected _createStr = `CREATE TABLE IF NOT EXISTS ${this._tableName} (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL UNIQUE,
		displayName TEXT NOT NULL UNIQUE,
		avatarUrl TEXT NOT NULL,
		password TEXT,
		authProvider TEXT NOT NULL DEFAULT \`${UserAuthMethod.LOCAL}\`,
		authProviderId TEXT NOT NULL DEFAULT \`${UserAuthMethod.LOCAL}\`,
		createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
		updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
	);`;
	protected _insertStr = `INSERT INTO ${this._tableName} (username, displayName, avatarUrl, password, authProvider, authProviderId) VALUES (?, ?, ?, ?, ?, ?)`;
	protected _deleteStr = `DELETE FROM ${this._tableName} WHERE id = ?`;
	protected _updateStr = `UPDATE ${this._tableName} SET username = ?, displayName = ?, avatarUrl = ? WHERE id = ?`;
	private _updatePasswordStr = `UPDATE ${this._tableName} SET password = ? WHERE id = ?`;

	constructor(database: Database) {
		super(database);
		this.init()
	}

	async new(params: UserParams): Promise<DatabaseResult<number>> {
		if (await this.existsUsernameOrDisplayName(params.username, params.displayName)) {
			return Promise.reject({ error: "User already exists!" });
		}
		return new Promise((resolve, reject) => {
			this.database.database.run(this._insertStr, [params.username, params.displayName, params.avatarUrl, params.password, params.authProvider ?? UserAuthMethod.LOCAL, params.authProviderId ?? UserAuthMethod.LOCAL],
				function (err) {
					if (err) reject({ error: err });
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
	async login(username: string, password: string): Promise<DatabaseResult<Omit<UserParams, "password"> & UIDD>> {
		const userIsRegistered = await this.existsUsername(username);
		if (!userIsRegistered) return Promise.reject({ error: "User not found!" });

		return new Promise((resolve, reject) => {
			this.database.database.get(`SELECT id, username, displayName, avatarUrl FROM ${this._tableName} WHERE username = ? AND password = ?`, [username, password], (err, row: Omit<UserParams, "password"> & UIDD) => {
				if (err) reject({ error: err });
				else resolve({ result: row });
			})
		})
	}
	/* args properties must be valid table column names */
	private async exists(args: Record<string, string>): Promise<boolean> {
		return new Promise((resolve, reject) => {
			const propertiesJoined = Object.keys(args).map((s) => s + " = ? ").join(" OR ")
			this.database.database.get(`SELECT 1 FROM ${this._tableName} WHERE ${propertiesJoined}`, [Object.values(args)], (err, row) => {
				if (err) {
					console.log(err);
					console.log(err.message)
					reject(err)
				}
				else resolve(!!row);
			})
		})
	}
	async existsDisplayName(displayName: string): Promise<boolean> {
		return this.exists({ displayName })
	}
	async existsUsername(username: string): Promise<boolean> {
		return this.exists({ username })
	}
	async existsUsernameOrDisplayName(username: string, displayName: string): Promise<boolean> {
		return this.exists({ username, displayName })
	}
	async existsGoogleId(googleId: string): Promise<{id: string} | undefined> {
		return new Promise((resolve, reject) => {
			this.database.database.get(`SELECT id FROM ${this._tableName} WHERE authProvider = ? AND authProviderId = ?`, [UserAuthMethod.GOOGLE, googleId], (err, row: {id: string} | undefined) => {
				console.log("existsGoogleId::err:", err, "||row:", row)
				if (err) reject(err);
				else resolve(row);
			})
		})
	}

}

export default UserTable;