import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_SQLITE_PATH = process.env.SQLITE_PATH ?? '/data/poe_cards.sqlite';

export function openSqliteDatabase(databasePath = DEFAULT_SQLITE_PATH): Database.Database {
  const directory = path.dirname(databasePath);
  fs.mkdirSync(directory, { recursive: true });

  const db = new Database(databasePath);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  return db;
}

export function applySqliteSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leagues (
      name TEXT PRIMARY KEY,
      updated_at TEXT NOT NULL,
      entry_count INTEGER NOT NULL,
      currency_rates_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS league_payloads (
      league_name TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      FOREIGN KEY (league_name) REFERENCES leagues(name) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS refresh_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      processed_count INTEGER,
      failed_count INTEGER,
      error_message TEXT
    );
  `);
}
