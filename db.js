// db.js — SQLite via sql.js (pure JS, no native build needed)
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

// On Vercel, use /tmp for writable storage
const isVercel = !!process.env.VERCEL;
const DB_PATH = isVercel ? '/tmp/infinit.db.bin' : path.join(__dirname, 'infinit.db.bin');

let db = null;
let initPromise = null;

function getDb() {
  if (!db) throw new Error('Database not initialized. Call await initDb() first.');
  return db;
}

async function initDb() {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }

    db._save = function () {
      const data = db.export();
      fs.writeFileSync(DB_PATH, Buffer.from(data));
    };

    db.run(`PRAGMA foreign_keys = ON;`);
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student',
        avatar TEXT, is_banned INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY, value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS teacher (
        id INTEGER PRIMARY KEY DEFAULT 1, name TEXT NOT NULL, title TEXT NOT NULL,
        institution TEXT NOT NULL, qualification TEXT NOT NULL, bio TEXT NOT NULL,
        photo TEXT, updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS batches (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, subtitle TEXT NOT NULL,
        tag TEXT NOT NULL, schedule TEXT NOT NULL, location TEXT NOT NULL,
        room TEXT, start_date TEXT NOT NULL, total_seats INTEGER NOT NULL DEFAULT 30,
        enrolled INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'open',
        is_active INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS gallery (
        id TEXT PRIMARY KEY, url TEXT NOT NULL, caption TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT,
        is_pinned INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS memes (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, image_url TEXT NOT NULL,
        caption TEXT, category TEXT, status TEXT NOT NULL DEFAULT 'pending',
        mod_note TEXT, likes INTEGER NOT NULL DEFAULT 0,
        is_featured INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')), reviewed_at TEXT
      );
      CREATE TABLE IF NOT EXISTS testimonials (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, result TEXT, text TEXT NOT NULL,
        avatar TEXT, is_active INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0
      );
    `);

    db._save();
    console.log('  ✓ Database ready');
    return db;
  })();

  return initPromise;
}

function prepare(sql) {
  const d = getDb();
  return {
    run(...params) {
      d.run(sql, params);
      d._save();
      return { changes: 1 };
    },
    get(...params) {
      const stmt = d.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },
    all(...params) {
      const results = [];
      const stmt = d.prepare(sql);
      stmt.bind(params);
      while (stmt.step()) results.push(stmt.getAsObject());
      stmt.free();
      return results;
    }
  };
}

function run(sql, ...params) {
  const d = getDb();
  d.run(sql, params);
  d._save();
  return { changes: 1 };
}

function exec(sql) {
  getDb().run(sql);
  getDb()._save();
}

module.exports = { initDb, prepare, run, exec, getDb };
