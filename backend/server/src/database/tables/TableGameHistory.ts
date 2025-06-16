import Database from "@db/Database";
import BaseTable from "@db-table/BaseTable"
import { generateGameHistory } from "@db/fakeData";

class GameHistoryTable extends BaseTable<GameHistory, GameHistoryParams> {
	protected _tableName: string = "game_history";

	protected _createStr = `CREATE TABLE IF NOT EXISTS ${this._tableName} (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		lobbyId TEXT,
		winnerId INTEGER NOT NULL,
		loserId INTEGER NOT NULL,
		scoreWinner INTEGER NOT NULL,
		scoreLoser INTEGER NOT NULL,
		startTime DATETIME DEFAULT CURRENT_TIMESTAMP,
		endTime DATETIME,
		duration INTEGER,
		FOREIGN KEY(winnerId) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY(loserId) REFERENCES users(id) ON DELETE CASCADE
	);`;
	protected _insertStr = `INSERT INTO ${this._tableName} (lobbyId, winnerId, loserId, scoreWinner, scoreLoser, startTime, endTime, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
	protected _deleteStr = `DELETE FROM ${this._tableName} WHERE id = ?`;
	protected _updateStr = ``; // Not typically updated after creation

	constructor(database: Database) {
		super(database);
		this.init()
	}

	async new(params: GameHistoryParams): Promise<DatabaseResult<number>> {
		try {
			const stmt = this.db.prepare(this._insertStr);
			const result = stmt.run(
				params.lobbyId,
				params.winnerId,
				params.loserId,
				params.scoreWinner,
				params.scoreLoser,
				params.startTime,
				params.endTime,
				params.duration
			);
			return { result: result.lastInsertRowid as number };
		} catch (err: any) {
			return { error: new Error(`Database error: ${err.message}`) };
		}
	}

	async delete(id: number): Promise<DatabaseResult<boolean>> {
		try {
			const stmt = this.db.prepare(this._deleteStr);
			const result = stmt.run(id);
			return { result: result.changes > 0 };
		} catch (err: any) {
			return { error: new Error(`Database error: ${err.message}`) };
		}
	}

	async update(id: number, params: GameHistoryParams): Promise<DatabaseResult<number>> {
		throw new Error("Game history records are immutable and cannot be updated.");
	}

    bulkInsertTransaction = this.db.transaction((count: number) => {
        if (count <= 0) throw new Error("Cannot call bulkInsert with count 0")
        const stmt = this.db.prepare(this._insertStr)
        for (let i = 0; i < count; i++) {
            const gameHistory = generateGameHistory(count);
            stmt.run(gameHistory.lobbyId, gameHistory.winnerId, gameHistory.loserId, gameHistory.scoreWinner, gameHistory.scoreLoser, gameHistory.startTime, gameHistory.endTime, gameHistory.duration);
        }
    })
    bulkInsert(count: number) {
        console.log(`||Database |INFO| || Will insert ${count} games to the ${this._tableName} table!`)
        try {
            this.bulkInsertTransaction(count)
        } catch (error) {
            console.log("Something went wrong when bulk inserting")
            console.error(error)
        }
    }
}

export default GameHistoryTable;