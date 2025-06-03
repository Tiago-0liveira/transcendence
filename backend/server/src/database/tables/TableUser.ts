import { UserAuthMethod } from "@enums/enums";
import Database from "@db/Database";
import BaseTable from "@db-table/BaseTable"
import { generateUser } from "@db/fakeData";
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

// TODO: avatarUrl can be defaulted to available avatars (add to public folder some avatars)
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
	protected _insertStr = `INSERT INTO ${this._tableName} (username, displayName, avatarUrl, password, 
                   authProvider, authProviderId) VALUES (?, ?, ?, ?, ?, ?)`;
	protected _deleteStr = `DELETE FROM ${this._tableName} WHERE id = ?`;
	protected _updateStr = `UPDATE ${this._tableName} SET username = ?, displayName = ?, avatarUrl = ?, 
                 updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
	private _updatePasswordStr = `UPDATE ${this._tableName} SET password = ?, 
                 updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;

	constructor(database: Database) {
		super(database);
		this.init()
	}

	async new(params: UserParams): Promise<DatabaseResult<number>> {
		// Checking for uniqueness
		const exists = await this.existsUsernameAndDisplayName(params.username, params.displayName);
		if (exists) {
			throw new Error('User already exists');
		}

		const userNameExist = await this.existsUsername(params.username);
		if (userNameExist) {
			throw new Error('Username already in use');
		}

		const displayNameExist = await this.existsDisplayName(params.displayName);
		if (displayNameExist) {
			throw new Error('Display name already in use');
		}

		// Hashing password
		const passwordHash = await bcrypt.hash(params.password, SALT_ROUNDS)

		//  Inserting data
		try {
			const stmt = this.database.database.prepare(this._insertStr);
			const result = stmt.run(
				params.username,
				params.displayName,
				params.avatarUrl,
				passwordHash,
				params.authProvider ?? UserAuthMethod.LOCAL,
				params.authProviderId ?? UserAuthMethod.LOCAL
			);
			await this.database.user2FATable.new({
				userId: result.lastInsertRowid as number,
				enabled: false,
				secret: ""
			});

			return { result: result.lastInsertRowid as number };

		} catch (err: any) {
			throw new Error(`Database error: ${err.message}`);
		}
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
	async login(username: string, password: string): Promise<DatabaseResult<Omit<UserParams, "password"> & UIDD>> {
		// 1. Check if a user exists
		const userExists = await this.existsUsername(username);
		if (!userExists) {
			throw new Error("User not found");
		}

		try {
			// 2. get user by name
			const stmt = this.database.database.prepare(`
			SELECT id, username, displayName, avatarUrl, password
			FROM ${this._tableName}
			WHERE username = ?
		`);
			const row = stmt.get(username) as (UserParams & UIDD & { password: string }) | undefined;
			if (!row) {
				return { error: new Error("User not found") };
			}

			// 3. password checking
			const isPasswordValid = await bcrypt.compare(password, row.password);
			if (!isPasswordValid) {
				return { error: new Error("Invalid password") };
			}

			// 4. delete password from user object
			const { password: _, ...userWithoutPassword } = row;
			return { result: userWithoutPassword };

		} catch (err: any) {
			return { error: new Error(err.message) };
		}
	}
	private async exists(
		args: Record<string, string>,
		logic: "OR" | "AND" = "OR"
	): Promise<boolean> {
		if (!args || Object.keys(args).length === 0) {
			throw new Error("No fields provided for existence check.");
		}

		// create SQL
		const condition = Object.keys(args)
			.map(key => `${key} = ?`)
			.join(` ${logic} `);

		const values = Object.values(args);
		const query = `SELECT 1 FROM ${this._tableName} WHERE ${condition} LIMIT 1`;

		try {
			const stmt = this.database.database.prepare(query);
			const row = stmt.get(...values);
			return !!row;
		} catch (err: any) {
			console.error("Database exists() error:", err);
			throw new Error(`Database exists() failed: ${err.message}`);
		}
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
	async existsUsernameAndDisplayName(username: string, displayName: string): Promise<boolean> {
		return this.exists({ username, displayName }, "AND")
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