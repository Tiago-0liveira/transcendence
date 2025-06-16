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
			await this.database.userStatsTable.new({ userId: result.lastInsertRowid as number })

			return { result: result.lastInsertRowid as number };

		} catch (err: any) {
			throw new Error(`Database error: ${err.message}`);
		}
	}
	async delete(id: number): Promise<DatabaseResult<boolean>> {
		try {
			const stmt = this.database.database.prepare(this._deleteStr);
			const result = stmt.run(id);

			if (result.changes === 0) {
				return { error: new Error(`User with ID ${id} not found or already deleted.`) };
			}

			return { result: true };
		} catch (err) {
			return { error: err instanceof Error ? err : new Error("Unknown database error") };
		}
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
	async updatePassword(userId: number, oldPassword: string, newPassword: string): Promise<DatabaseResult<boolean>> {
		try {
			const user = await this.findById(userId);

			if (!user) {
				return { error: new Error(`User not found.`) };
			}

			const isValid = bcrypt.compareSync(oldPassword, user.password);
			if (!isValid) {
				return { error: new Error("Incorrect current password") };
			}

			if (oldPassword === newPassword) {
				return { error: new Error("New password must be different from current password") };
			}

			const newHash = bcrypt.hashSync(newPassword, 10);

			const stmtUpdate = this.database.database.prepare(this._updatePasswordStr);
			const result = stmtUpdate.run(newHash, userId);

			if (result.changes === 0) {
				return { error: new Error(`Failed to update password.`) };
			}

			return { result: true };
		} catch (err) {
			return { error: err instanceof Error ? err : new Error("Unknown database error") };
		}
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

	async findById(userId: number): Promise<{
		username: string;
		displayName: string;
		avatarUrl: string | null;
		password: string;
		authProvider: string;
	} | undefined> {
		const stmt = this.database.database.prepare(`
		SELECT username, displayName, avatarUrl, password, authProvider
		FROM ${this._tableName}
		WHERE id = ?
	`);
		const row = stmt.get(userId);

		if (!row) {
			return undefined;
		}

		return row as {
			username: string;
			displayName: string;
			avatarUrl: string | null;
			password: string;
			authProvider: string;
		};
	}

	async existsUsernameOrDisplayName(username: string, displayName: string): Promise<boolean> {
		return this.exists({ username, displayName })
	}
	async existsUsernameAndDisplayName(username: string, displayName: string): Promise<boolean> {
		return this.exists({ username, displayName }, "AND")
	}
	async existsGoogleId(googleId: number): Promise<DatabaseResult<UIDD | null>> {
		try {
			const stmt = this.db.prepare(
				`SELECT id FROM ${this._tableName} WHERE authProvider = ? AND authProviderId = ?`
			);

			const row = stmt.get(UserAuthMethod.GOOGLE, googleId);
			console.log("existsGoogleId:", row);

			return { result: row ? (row as UIDD) : null };

		} catch (err) {
			return { error: err instanceof Error ? err : new Error("Unknown error in existsGoogleId") };
		}
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
	async updateDisplayNameAndAvatarById(
		userId: number,
		displayName: string | null,
		avatarUrl: string | null
	): Promise<DatabaseResult<true>> {
		try {
			const fields: string[] = [];
			const values: any[] = [];

			if (displayName !== null) {
				fields.push("displayName = ?");
				values.push(displayName);
			}
			if (avatarUrl !== null) {
				fields.push("avatarUrl = ?");
				values.push(avatarUrl);
			}

			// Нечего обновлять — защита на всякий случай
			if (fields.length === 0) {
				return { result: true };
			}

			const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
			values.push(userId);

			const stmt = this.database.database.prepare(sql);
			const res = stmt.run(...values);

			if (res.changes === 0) {
				throw new Error("No rows updated");
			}

			return { result: true };
		} catch (err: any) {
			throw new Error(`Database error: ${err.message}`);
		}
	}
}

export default UserTable;