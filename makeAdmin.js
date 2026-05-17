const { initDb, prepare } = require('./db');

async function main() {
  await initDb();
  const uid = 'eCJJD4IwYrNy3ZBT1cTUW3bMNUw2';
  const existing = prepare('SELECT id,role FROM users WHERE id=?').get(uid);
  if (existing) {
    prepare("UPDATE users SET role='admin' WHERE id=?").run(uid);
    console.log('Updated user', uid, 'to admin');
  } else {
    console.log('User', uid, 'not found in DB');
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
