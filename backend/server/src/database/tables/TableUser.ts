import { UserAuthMethod } from "@enums/enums";
import Database from "@db/Database";
import BaseTable from "@db-table/BaseTable"
import { generateUser } from "@db/fakeData";


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
		authProviderId INTEGER NOT NULL DEFAULT \`${UserAuthMethod.LOCAL}\`,
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
			const insert = this.database.database.prepare(this._insertStr)
			const run1 = insert.run(params.username, params.displayName, params.avatarUrl, params.password, params.authProvider ?? UserAuthMethod.LOCAL, params.authProviderId ?? UserAuthMethod.LOCAL)
			if (run1.changes === 0) {
				reject({ error: new Error("could not insert") })
			}
			resolve({ result: run1.lastInsertRowid as number })
		})
	}
	async delete(id: number): Promise<DatabaseResult<boolean>> {
		return new Promise((resolve, reject) => {
			const del = this.database.database.prepare(this._deleteStr)
			const run1 = del.run(id);
			if (run1.changes === 0) {
				reject({ error: new Error(`could not delete ${id}`) })
			}
			resolve({ result: true })
		})
	}
	async update(id: number, params: UserParamsNoPass): Promise<DatabaseResult<number>> {
		return new Promise((resolve, reject) => {
			const update = this.db.prepare(this._updateStr)
			const update1 = update.run(params.username, params.displayName, params.avatarUrl, id)
			if (update1.changes === 0) {
				reject({ error: new Error("Could not update ") })
			}
			resolve({ result: update1.lastInsertRowid as number })
		})
	}
	async updatePassword(id: number, password: string): Promise<DatabaseResult<number>> {
		return new Promise((resolve, reject) => {
			const update = this.db.prepare(this._updatePasswordStr)
			const update1 = update.run(password, id)
			if (update1.changes === 0) {
				reject({ error: new Error("Could not update ") })
			}
			resolve({ result: update1.lastInsertRowid as number })
		})
	}
	async login(username: string, password: string): Promise<DatabaseResult<UserParamsNoPass & UIDD>> {
		const userIsRegistered = await this.existsUsername(username);
		if (!userIsRegistered) return Promise.resolve({ error: new Error("User not found!") });

		return new Promise((resolve, reject) => {
			const select = this.db.prepare(`SELECT id, username, displayName, avatarUrl FROM ${this._tableName} WHERE username = ? AND password = ?`)
			const select1 = select.get(username, password)
			if (select1) {
				resolve({ result: select1 as UserParamsNoPass & UIDD })
			} else
				resolve({ error: new Error("Invalid login credentials!") })
		})
	}
	/* args properties must be valid table column names */
	private async exists(args: Record<string, string>): Promise<boolean> {
		return new Promise((resolve, reject) => {
			const propertiesJoined = Object.keys(args).map((s) => s + " = ? ").join(" OR ")
			const select = this.db.prepare(`SELECT 1 FROM ${this._tableName} WHERE ${propertiesJoined}`)
			const select1 = select.get(Object.values(args))

			resolve(Boolean(select1))
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
	async existsGoogleId(googleId: number): Promise<UIDD | null> {
		return new Promise((resolve, reject) => {
			const select = this.db.prepare(`SELECT id FROM ${this._tableName} WHERE authProvider = ? AND authProviderId = ?`)
			const select1 = select.get(UserAuthMethod.GOOGLE, googleId)
			console.log("existsGoogleId:", select1)
			if (select1) resolve(select1 as UIDD)
			else resolve(null)
		})
	}

	bulkInsertTransaction = this.db.transaction((count: number) => {
		if (count <= 0) throw new Error("Cannot call bulkInsert with count 0")
		const stmt = this.db.prepare(this._insertStr)
		for (let i = 0; i < count; i++) {
			const user = generateUser();
			stmt.run(user.username, user.displayName, user.avatarUrl, user.password, UserAuthMethod.LOCAL, "");
		}
	})
	bulkInsert(count: number) {
		console.log(`||Database |INFO| || Will insert ${count} users to the ${this._tableName} table!`)
		try {
			this.bulkInsertTransaction(count)
		} catch (error) {
			console.log("Something went wrong when bulk inserting")
			console.error(error)
		}
	}
}

export default UserTable;