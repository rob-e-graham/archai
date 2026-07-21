// Copyright (c) 2026 Rob Graham / FAMTEC. All rights reserved.
// Proprietary during the doctoral research period — see LICENSE.
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.ARCHAI_DATA_DIR || path.join(process.cwd(), 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const dbPath = path.join(DATA_DIR, 'archai.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Check if comments table exists
const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='comments'").get();

if (!tableExists) {
  db.exec(`
    CREATE TABLE comments (
      id TEXT PRIMARY KEY,
      parent_id TEXT DEFAULT NULL,
      object_id TEXT NOT NULL,
      collection TEXT NOT NULL DEFAULT 'archai_pilot',
      text TEXT NOT NULL,
      author_type TEXT NOT NULL DEFAULT 'visitor',
      author_name TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'visible',
      ai_flag TEXT DEFAULT NULL,
      ai_reason TEXT DEFAULT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      verified_by TEXT DEFAULT NULL,
      verified_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      moderated_at TEXT DEFAULT NULL,
      moderated_by TEXT DEFAULT NULL
    );
  `);
}

// Bring pre-existing databases up to the current schema. A community memory can
// be confirmed by a curator into a verified oral history, so comments carry the
// same verification line that object records do.
{
  const cols = db.prepare('PRAGMA table_info(comments)').all().map((c) => c.name);
  const migrations = [
    ['parent_id', "ALTER TABLE comments ADD COLUMN parent_id TEXT DEFAULT NULL"],
    ['verified', "ALTER TABLE comments ADD COLUMN verified INTEGER NOT NULL DEFAULT 0"],
    ['verified_by', "ALTER TABLE comments ADD COLUMN verified_by TEXT DEFAULT NULL"],
    ['verified_at', "ALTER TABLE comments ADD COLUMN verified_at TEXT DEFAULT NULL"],
  ];
  for (const [name, ddl] of migrations) {
    if (!cols.includes(name)) db.exec(ddl);
  }
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_comments_object ON comments(object_id);
  CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
  CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at);
  CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
`);

export default db;
