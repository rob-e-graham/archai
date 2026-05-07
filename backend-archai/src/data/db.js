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
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      moderated_at TEXT DEFAULT NULL,
      moderated_by TEXT DEFAULT NULL
    );
  `);
} else {
  // Migrate: add parent_id if missing
  const cols = db.prepare("PRAGMA table_info(comments)").all().map(c => c.name);
  if (!cols.includes('parent_id')) {
    db.exec('ALTER TABLE comments ADD COLUMN parent_id TEXT DEFAULT NULL');
  }
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_comments_object ON comments(object_id);
  CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
  CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at);
  CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
`);

export default db;
