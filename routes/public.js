const router = require('express').Router();
const db = require('../db');

router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT key,value FROM settings').all();
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
});
router.get('/teacher', (req, res) => res.json(db.prepare('SELECT * FROM teacher WHERE id=1').get() || null));
router.get('/batches', (req, res) => res.json(db.prepare('SELECT * FROM batches WHERE is_active=1 ORDER BY sort_order ASC').all()));
router.get('/gallery', (req, res) => res.json(db.prepare('SELECT * FROM gallery WHERE is_active=1 ORDER BY sort_order ASC').all()));
router.get('/announcements', (req, res) => res.json(db.prepare('SELECT * FROM announcements WHERE is_active=1 ORDER BY is_pinned DESC,created_at DESC LIMIT 5').all()));
router.get('/testimonials', (req, res) => res.json(db.prepare('SELECT * FROM testimonials WHERE is_active=1 ORDER BY sort_order ASC').all()));
router.get('/memes/approved', (req, res) => {
  const page = parseInt(req.query.page) || 1, limit = 12, offset = (page-1)*limit;
  const memes = db.prepare("SELECT m.*,u.name as author_name FROM memes m JOIN users u ON m.user_id=u.id WHERE m.status='approved' ORDER BY m.is_featured DESC,m.likes DESC,m.created_at DESC LIMIT ? OFFSET ?").all(limit, offset);
  const total = db.prepare("SELECT COUNT(*) as c FROM memes WHERE status='approved'").get().c || 0;
  res.json({ memes, total, page, pages: Math.ceil(total/limit) });
});
module.exports = router;
