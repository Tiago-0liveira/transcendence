import Database from "@db/Database";
import BaseTable from "@db-table/BaseTable";
import { generateUserStats } from "@db/fakeData";

class UserStatsTable extends BaseTable<UserStats, UserStatsParams> {
	protected _tableName: string = "user_stats";

	protected _createStr = `CREATE TABLE IF NOT EXISTS ${this._tableName} (
																			  userId INTEGER PRIMARY KEY,
																			  wins INTEGER NOT NULL DEFAULT 0,
																			  losses INTEGER NOT NULL DEFAULT 0,
																			  totalGames INTEGER NOT NULL DEFAULT 0,
																			  tournamentWins INTEGER NOT NULL DEFAULT 0,
																			  tournamentLosses INTEGER NOT NULL DEFAULT 0,
																			  FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
		);`;

	protected _insertStr = `INSERT INTO ${this._tableName} (userId) VALUES (?)`;
	protected _insertBulkStr = `INSERT INTO ${this._tableName} (userId, wins, losses, totalGames, tournamentWins, tournamentLosses) VALUES (?,?,?,?,?,?)`;
	protected _deleteStr = `DELETE FROM ${this._tableName} WHERE userId = ?`;

	protected _updateStr = `
		UPDATE ${this._tableName}
		SET
			wins = ?,
			losses = ?,
			totalGames = ?,
			tournamentWins = ?,
			tournamentLosses = ?
		WHERE userId = ?
	`;

	constructor(database: Database) {
		super(database);
		this.init();
	}

	async new(params: UserStatsParams): Promise<DatabaseResult<number>> {
		try {
			const existing = await this.getByUserId(params.userId);
			if ("result" in existing) {
				return { error: new Error(`Stats for userId ${params.userId} already exist`) };
			}
			const stmt = this.db.prepare(this._insertStr);
			const result = stmt.run(params.userId);
			return { result: result.lastInsertRowid as number };
		} catch (err: any) {
			return { error: new Error(`Database error: ${err.message}`) };
		}
	}

	async delete(userId: number): Promise<DatabaseResult<boolean>> {
		try {
			const stmt = this.db.prepare(this._deleteStr);
			const result = stmt.run(userId);
			return { result: result.changes > 0 };
		} catch (err: any) {
			return { error: new Error(`Database error: ${err.message}`) };
		}
	}

	async update(userId: number, params: UserStatsParams): Promise<DatabaseResult<number>> {
		try {
			const stmt = this.db.prepare(this._updateStr);
			const result = stmt.run(
				params.wins,
				params.losses,
				params.totalGames,
				params.tournamentWins,
				params.tournamentLosses,
				userId
			);
			return { result: result.changes as number };
		} catch (err: any) {
			return { error: new Error(`Database error: ${err.message}`) };
		}
	}

	async getByUserId(userId: number): Promise<DatabaseResult<UserStats>> {
		try {
			const stmt = this.db.prepare(`SELECT * FROM ${this._tableName} WHERE userId = ?`);
			const row = stmt.get(userId);
			if (row) {
				return { result: row as UserStats };
			} else {
				return { error: new Error(`User stats for userId ${userId} not found`) };
			}
		} catch (err: any) {
			return { error: new Error(`Failed to get user stats: ${err.message}`) };
		}
	}

	// 🔼 Increment methods
	private async _incrementField(userId: number, field: keyof UserStats): Promise<DatabaseResult<number>> {
		try {
			const stmt = this.db.prepare(`UPDATE ${this._tableName} SET ${field} = ${field} + 1 WHERE userId = ?`);
			const result = stmt.run(userId);
			return { result: result.changes };
		} catch (err: any) {
			return { error: new Error(`Failed to increment ${field}: ${err.message}`) };
		}
	}

	incrementWins(userId: number) {
		return this._incrementField(userId, "wins");
	}

	incrementLosses(userId: number) {
		return this._incrementField(userId, "losses");
	}

	incrementTotalGames(userId: number) {
		return this._incrementField(userId, "totalGames");
	}

	incrementTournamentWins(userId: number) {
		return this._incrementField(userId, "tournamentWins");
	}

	incrementTournamentLosses(userId: number) {
		return this._incrementField(userId, "tournamentLosses");
	}

	// 🔁 Reset all stats to 0
	async resetStats(userId: number): Promise<DatabaseResult<number>> {
		try {
			const stmt = this.db.prepare(`
				UPDATE ${this._tableName}
				SET wins = 0, losses = 0, totalGames = 0, tournamentWins = 0, tournamentLosses = 0
				WHERE userId = ?
			`);
			const result = stmt.run(userId);
			return { result: result.changes };
		} catch (err: any) {
			return { error: new Error(`Failed to reset stats: ${err.message}`) };
		}
	}

	// 🚀 Bulk insert with improved error handling
	bulkInsertTransaction = this.db.transaction((count: number) => {
		if (count <= 0) throw new Error("Cannot call bulkInsert with count 0");
		const stmt = this.db.prepare(this._insertBulkStr);
		for (let i = 1; i <= count; i++) {
			const s = generateUserStats(i);
			stmt.run(s.userId, s.wins, s.losses, s.totalGames, s.tournamentWins, s.tournamentLosses);
		}
	});

	bulkInsert(count: number) {
		console.log(`||Database |INFO| || Will insert ${count} user stats to the ${this._tableName} table.`);
		try {
			this.bulkInsertTransaction(count);
			console.log("||Database |INFO| || Bulk insert completed.");
		} catch (error) {
			console.error("||Database |ERROR| || Bulk insert failed:", error);
		}
	}
}

export default UserStatsTable;