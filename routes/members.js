const router = require('express').Router();
const { v4: uuid } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.post('/memes', requireAuth, (req, res) => {
  const { image_url, caption, category } = req.body;
  if (!image_url) return res.status(400).json({ error: 'Image URL required' });
  if (image_url.length > 2048) return res.status(400).json({ error: 'Image URL too long' });
  const id = uuid();
  db.prepare('INSERT INTO memes(id,user_id,image_url,caption,category) VALUES(?,?,?,?,?)').run(id, req.user.id, image_url, caption||'', category||'general');
  res.json({ id, message: 'Submitted for moderation' });
});
router.post('/memes/:id/like', requireAuth, (req, res) => {
  const meme = db.prepare("SELECT id FROM memes WHERE id=? AND status='approved'").get(req.params.id);
  if (!meme) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE memes SET likes=likes+1 WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});
router.get('/my-memes', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM memes WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});
module.exports = router;
