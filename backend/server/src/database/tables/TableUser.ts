import { UserAuthMethod } from "@enums/enums";
import Database from "@db/Database";
import BaseTable from "@db-table/BaseTable"
import { generateUser } from "@db/fakeData";
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

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
		const passwordHash = params.password
			? await bcrypt.hash(params.password, SALT_ROUNDS)
			: null

		//  Inserting data
		return new Promise((resolve, reject) => {
			this.database.database.run(
				this._insertStr,
				[
					params.username,
					params.displayName,
					params.avatarUrl,
					passwordHash,
					params.authProvider ?? UserAuthMethod.LOCAL,
					params.authProviderId ?? UserAuthMethod.LOCAL
				],
				function (err) {
					if (err) {
						reject(new Error(`Database error: ${err.message}`));
					} else {
						resolve({ result: this.lastID });
					}
				}
			);
		});
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
		// 1. Check if a user exists
		const userExists = await this.existsUsername(username);
		if (!userExists) {
			throw new Error("User not found");
		}

		// 2. Retrieve user data and validate password
		return new Promise((resolve, reject) => {
			this.database.database.get(
				`SELECT id, username, displayName, avatarUrl, password FROM ${this._tableName} WHERE username = ?`,
				[username],
				async (err, row: (UserParams & UIDD) | undefined) => {
					if (err) {
						return reject(new Error(`Database error: ${err.message}`));
					}

					if (!row) {
						return reject(new Error("User not found"));
					}

					try {
						const isPasswordValid = await bcrypt.compare(password, row.password);
						if (!isPasswordValid) {
							return reject(new Error("Invalid password"));
						}

						// Remove password from result
						const { password: _, ...userWithoutPassword } = row;
						resolve({ result: userWithoutPassword });
					} catch (compareErr: any) {
						reject(new Error(`Password comparison failed: ${compareErr.message}`));
					}
				}
			);
		});
	}
	private async exists(
		args: Record<string, string>,
		logic: "OR" | "AND" = "OR"
	): Promise<boolean> {
		if (!args || Object.keys(args).length === 0) {
			throw new Error("No fields provided for existence check.");
		}

		// create sql string
		const condition = Object.keys(args)
			.map(key => `${key} = ?`)
			.join(` ${logic} `);

		const values = Object.values(args);

		const query = `SELECT 1 FROM ${this._tableName} WHERE ${condition} LIMIT 1`;

		return new Promise((resolve, reject) => {
			this.database.database.get(query, values, (err, row) => {
				if (err) {
					console.error("Database exists() error:", err);
					return reject(err);
				}
				resolve(!!row); // true found something
			});
		});
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
	async existsGoogleId(googleId: string): Promise<{id: string} | undefined> {
		return new Promise((resolve, reject) => {
			this.database.database.get(`SELECT id FROM ${this._tableName} WHERE authProvider = ? AND authProviderId = ?`, [UserAuthMethod.GOOGLE, googleId], (err, row: {id: string} | undefined) => {
				console.log("existsGoogleId::err:", err, "||row:", row)
				if (err) reject(err);
				else resolve(row);
			})
		})
	}
	bulkInsert(count: number) {
		const rawDb = this.database.database;
		console.log(`||Database |INFO| || Will insert ${count} users to the ${this._tableName} table!`)
		rawDb.serialize(() => {
			rawDb.run("BEGIN TRANSACTION")
			for (let i = 0; i < count; i++) {
				const user = generateUser();
				console.log(`User< username=${user.username} displayName=${user.displayName} password=${user.password} ...>`)
				rawDb.run(this._insertStr, [user.username, user.displayName, user.avatarUrl, user.password, UserAuthMethod.LOCAL, ""]);
			}
			rawDb.run("COMMIT", (err) => {
				if (err) {
					console.error("Seeding failed:", err);
					rawDb.close();
				}
				else console.log(`||Database |INFO| || ${count} users inserted successfully.`);
			});
		})
	}
}

export default UserTable;