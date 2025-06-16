import BaseTable from "./BaseTable";
import Database from "@db/Database";

interface Room extends UIDD {
  name: string;
  topic: string;
  isPrivate: boolean;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface RoomParams {
  name: string;
  topic?: string;
  isPrivate: boolean;
  ownerId: number;
}

class RoomTable extends BaseTable<Room, RoomParams> {
  protected _tableName = "rooms";

  protected _createStr = `CREATE TABLE IF NOT EXISTS ${this._tableName} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          isPrivate BOOLEAN NOT NULL DEFAULT 0,
          ownerId INTEGER NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ownerId) REFERENCES users(id)
      );`;

  protected _insertStr = `INSERT INTO ${this._tableName} (name, description, isPrivate, ownerId) VALUES (?, ?, ?, ?)`;
  protected _deleteStr = `DELETE FROM ${this._tableName} WHERE id = ?`;
  protected _updateStr = `UPDATE ${this._tableName} SET name = ?, description = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;

  constructor(database: Database) {
    super(database);
    this.init();
  }
  async new(params: RoomParams): Promise<DatabaseResult<number>> {
    try {
      const stmt = this.database.database.prepare(this._insertStr);
      const result = stmt.run(
        params.name,
        params.topic || null,
        params.isPrivate ? 1 : 0,
        params.ownerId,
      );
      return { result: result.lastInsertedRowid as number };
    } catch (err: any) {
      return { error: new Error(`Database error: ${err.message}`) };
    }
  }
}

export default RoomTable;
