# infiniT — Physics Coaching Website

> "T for Turag, T for Top in Physics"

## Stack
- **Backend:** Node.js + Express + better-sqlite3
- **Auth:** JWT (bcryptjs)
- **Frontend:** Vanilla HTML/CSS/JS + Three.js 3D
- **Storage:** Local file uploads (`/uploads/`)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Seed the database (creates admin user + demo data)
npm run seed

# 3. Start the server
npm start

# Dev mode (auto-restart)
npm run dev
```

Server runs at: **http://localhost:3001**

---

## Admin Credentials (after seed)
```
Email:    admin@infinit.edu
Password: admin1234
```
Change these immediately in production!

---

## API Endpoints

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/settings | Site settings |
| GET | /api/teacher | Teacher profile |
| GET | /api/batches | Active batches |
| GET | /api/gallery | Gallery images |
| GET | /api/announcements | Pinned notices |
| GET | /api/testimonials | Student testimonials |
| GET | /api/memes/approved | Approved memes gallery |

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register student |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

### Members (requires JWT)
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/members/memes | Submit meme |
| POST | /api/members/memes/:id/like | Like a meme |
| GET | /api/members/my-memes | My submissions |

### Admin (requires JWT + admin role)
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/admin/stats | Dashboard stats |
| GET/PUT | /api/admin/settings | Site settings |
| GET/PUT | /api/admin/teacher | Teacher profile |
| GET/POST/PUT/DELETE | /api/admin/batches | Batch CRUD |
| GET/POST/DELETE | /api/admin/gallery | Gallery CRUD |
| GET/POST/DELETE | /api/admin/announcements | Notices CRUD |
| GET | /api/admin/memes?status=pending | Meme queue |
| PUT | /api/admin/memes/:id/approve | Approve meme |
| PUT | /api/admin/memes/:id/reject | Reject meme |
| PUT | /api/admin/memes/:id/feature | Feature meme |
| DELETE | /api/admin/memes/:id | Delete meme |
| GET | /api/admin/users | All users |
| PUT | /api/admin/users/:id/ban | Ban/unban user |
| GET/POST/DELETE | /api/admin/testimonials | Testimonials CRUD |

### File Upload
```
POST /api/upload
Body: multipart/form-data, field name: "image"
Returns: { url: "http://localhost:3001/uploads/filename.jpg" }
```

---

## Environment Variables
Create a `.env` file:
```
PORT=3001
JWT_SECRET=your-super-secret-key-here
```

---

## Production Deployment

1. Set strong `JWT_SECRET` in `.env`
2. Put behind Nginx/Caddy reverse proxy
3. Use PM2: `pm2 start server.js --name infinit`
4. Point domain to server
5. Enable HTTPS via Let's Encrypt
