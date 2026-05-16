const router = require('express').Router();
const { v4: uuid } = require('uuid');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
router.use(requireAdmin);

router.get('/stats', (req, res) => {
  res.json({
    students: (db.prepare("SELECT COUNT(*) c FROM users WHERE role='student'").get()||{c:0}).c,
    batches: (db.prepare("SELECT COUNT(*) c FROM batches WHERE is_active=1").get()||{c:0}).c,
    pendingMemes: (db.prepare("SELECT COUNT(*) c FROM memes WHERE status='pending'").get()||{c:0}).c,
    approvedMemes: (db.prepare("SELECT COUNT(*) c FROM memes WHERE status='approved'").get()||{c:0}).c,
    enrolled: (db.prepare("SELECT SUM(enrolled) c FROM batches").get()||{c:0}).c || 0,
  });
});

router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT key,value FROM settings').all();
  res.json(Object.fromEntries(rows.map(r=>[r.key,r.value])));
});
router.put('/settings', (req, res) => {
  if (!req.body || typeof req.body !== 'object') return res.status(400).json({ error: 'Invalid body' });
  for (const [key,value] of Object.entries(req.body))
    db.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(key,String(value));
  res.json({ ok: true });
});

router.get('/teacher', (req, res) => res.json(db.prepare('SELECT * FROM teacher WHERE id=1').get()));
router.put('/teacher', (req, res) => {
  const { name,title,institution,qualification,bio,photo } = req.body;
  if (!name || !title || !bio) return res.status(400).json({ error: 'Name, title, and bio required' });
  if (db.prepare('SELECT id FROM teacher WHERE id=1').get())
    db.prepare("UPDATE teacher SET name=?,title=?,institution=?,qualification=?,bio=?,photo=?,updated_at=datetime('now') WHERE id=1").run(name,title,institution||'',qualification||'',bio,photo||'');
  else
    db.prepare('INSERT INTO teacher(id,name,title,institution,qualification,bio,photo) VALUES(1,?,?,?,?,?,?)').run(name,title,institution||'',qualification||'',bio,photo||'');
  res.json({ ok: true });
});

router.get('/batches', (req, res) => res.json(db.prepare('SELECT * FROM batches ORDER BY sort_order,created_at').all()));
router.post('/batches', (req, res) => {
  const { name,subtitle,tag,schedule,location,start_date,total_seats,status } = req.body;
  if (!name || !subtitle || !schedule || !location || !start_date) return res.status(400).json({ error: 'Name, subtitle, schedule, location, and start_date required' });
  const id = uuid();
  db.prepare('INSERT INTO batches(id,name,subtitle,tag,schedule,location,room,start_date,total_seats,enrolled,status,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(id,name,subtitle,tag||'',schedule,location,req.body.room||'',start_date,total_seats||30,0,status||'open',0);
  res.json({ id });
});
router.put('/batches/:id', (req, res) => {
  const batch = db.prepare('SELECT id FROM batches WHERE id=?').get(req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });
  const { name,subtitle,tag,schedule,location,room,start_date,total_seats,enrolled,status,is_active,sort_order } = req.body;
  if (!name || !schedule || !start_date) return res.status(400).json({ error: 'Name, schedule, and start_date required' });
  db.prepare("UPDATE batches SET name=?,subtitle=?,tag=?,schedule=?,location=?,room=?,start_date=?,total_seats=?,enrolled=?,status=?,is_active=?,sort_order=? WHERE id=?").run(name,subtitle,tag||'',schedule,location,room||'',start_date,total_seats||30,enrolled||0,status||'open',is_active?1:0,sort_order||0,req.params.id);
  res.json({ ok: true });
});
router.delete('/batches/:id', (req, res) => {
  const batch = db.prepare('SELECT id FROM batches WHERE id=?').get(req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });
  db.prepare('DELETE FROM batches WHERE id=?').run(req.params.id);
  res.json({ok:true});
});

router.get('/gallery', (req, res) => res.json(db.prepare('SELECT * FROM gallery ORDER BY sort_order').all()));
router.post('/gallery', (req, res) => {
  const { url,caption,sort_order } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  const id = uuid();
  db.prepare('INSERT INTO gallery(id,url,caption,sort_order,is_active) VALUES(?,?,?,?,?)').run(id,url,caption||'',sort_order||0,1);
  res.json({ id });
});
router.put('/gallery/:id', (req, res) => {
  const item = db.prepare('SELECT id FROM gallery WHERE id=?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Gallery item not found' });
  const { url,caption,sort_order,is_active } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  db.prepare("UPDATE gallery SET url=?,caption=?,sort_order=?,is_active=? WHERE id=?").run(url,caption||'',sort_order||0,is_active?1:0,req.params.id);
  res.json({ ok: true });
});
router.delete('/gallery/:id', (req, res) => {
  const item = db.prepare('SELECT id FROM gallery WHERE id=?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Gallery item not found' });
  db.prepare('DELETE FROM gallery WHERE id=?').run(req.params.id);
  res.json({ok:true});
});

router.get('/announcements', (req, res) => res.json(db.prepare('SELECT * FROM announcements ORDER BY is_pinned DESC,created_at DESC').all()));
router.post('/announcements', (req, res) => {
  const { title,body,is_pinned } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const id = uuid();
  db.prepare('INSERT INTO announcements(id,title,body,is_pinned,is_active) VALUES(?,?,?,?,?)').run(id,title,body||'',is_pinned?1:0,1);
  res.json({ id });
});
router.put('/announcements/:id', (req, res) => {
  const item = db.prepare('SELECT id FROM announcements WHERE id=?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Announcement not found' });
  const { title,body,is_pinned,is_active } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  db.prepare("UPDATE announcements SET title=?,body=?,is_pinned=?,is_active=? WHERE id=?").run(title,body||'',is_pinned?1:0,is_active?1:0,req.params.id);
  res.json({ ok: true });
});
router.delete('/announcements/:id', (req, res) => {
  const item = db.prepare('SELECT id FROM announcements WHERE id=?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Announcement not found' });
  db.prepare('DELETE FROM announcements WHERE id=?').run(req.params.id);
  res.json({ok:true});
});

router.get('/memes', (req, res) => {
  const status = req.query.status || 'pending';
  res.json(db.prepare("SELECT m.*,u.name as author_name,u.email as author_email FROM memes m JOIN users u ON m.user_id=u.id WHERE m.status=? ORDER BY m.created_at DESC").all(status));
});
router.put('/memes/:id/approve', (req, res) => {
  const meme = db.prepare('SELECT id FROM memes WHERE id=?').get(req.params.id);
  if (!meme) return res.status(404).json({ error: 'Meme not found' });
  db.prepare("UPDATE memes SET status='approved',reviewed_at=datetime('now') WHERE id=?").run(req.params.id);
  res.json({ok:true});
});
router.put('/memes/:id/reject', (req, res) => {
  const meme = db.prepare('SELECT id FROM memes WHERE id=?').get(req.params.id);
  if (!meme) return res.status(404).json({ error: 'Meme not found' });
  db.prepare("UPDATE memes SET status='rejected',mod_note=?,reviewed_at=datetime('now') WHERE id=?").run(req.body.note||'',req.params.id);
  res.json({ok:true});
});
router.put('/memes/:id/feature', (req, res) => {
  const meme = db.prepare('SELECT id FROM memes WHERE id=?').get(req.params.id);
  if (!meme) return res.status(404).json({ error: 'Meme not found' });
  db.prepare("UPDATE memes SET is_featured=1-is_featured WHERE id=?").run(req.params.id);
  res.json({ok:true});
});
router.delete('/memes/:id', (req, res) => {
  const meme = db.prepare('SELECT id FROM memes WHERE id=?').get(req.params.id);
  if (!meme) return res.status(404).json({ error: 'Meme not found' });
  db.prepare('DELETE FROM memes WHERE id=?').run(req.params.id);
  res.json({ok:true});
});

router.get('/users', (req, res) => res.json(db.prepare('SELECT id,name,email,role,is_banned,created_at FROM users ORDER BY created_at DESC').all()));
router.put('/users/:id/ban', (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ error: 'Cannot ban admin' });
  db.prepare('UPDATE users SET is_banned=1-is_banned WHERE id=?').run(req.params.id);
  res.json({ok:true});
});

router.get('/testimonials', (req, res) => res.json(db.prepare('SELECT * FROM testimonials ORDER BY sort_order').all()));
router.post('/testimonials', (req, res) => {
  const { name,result,text,avatar,sort_order } = req.body;
  if (!name || !text) return res.status(400).json({ error: 'Name and text required' });
  const id = uuid();
  db.prepare('INSERT INTO testimonials(id,name,result,text,avatar,is_active,sort_order) VALUES(?,?,?,?,?,?,?)').run(id,name,result||'',text,avatar||'',1,sort_order||0);
  res.json({ id });
});
router.put('/testimonials/:id', (req, res) => {
  const item = db.prepare('SELECT id FROM testimonials WHERE id=?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Testimonial not found' });
  const { name,result,text,avatar,is_active,sort_order } = req.body;
  if (!name || !text) return res.status(400).json({ error: 'Name and text required' });
  db.prepare("UPDATE testimonials SET name=?,result=?,text=?,avatar=?,is_active=?,sort_order=? WHERE id=?").run(name,result||'',text,avatar||'',is_active?1:0,sort_order||0,req.params.id);
  res.json({ ok: true });
});
router.delete('/testimonials/:id', (req, res) => {
  const item = db.prepare('SELECT id FROM testimonials WHERE id=?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Testimonial not found' });
  db.prepare('DELETE FROM testimonials WHERE id=?').run(req.params.id);
  res.json({ok:true});
});

module.exports = router;
