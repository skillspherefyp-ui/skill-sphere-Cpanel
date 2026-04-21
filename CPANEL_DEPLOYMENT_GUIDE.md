# SkillSphere cPanel Deployment Guide
### For Team Reference — Host N Solutions

---

## Pre-Requisites (Already Confirmed ✅)

| Item | Status | Detail |
|---|---|---|
| Node.js | ✅ | v20.20.2 |
| npm | ✅ | v10.8.2 |
| MariaDB | ✅ | 10.11.16 |
| SSH Access | ✅ | ssh username@skillsphere.com.pk |
| Domain | ✅ | skillsphere.com.pk |

---

## Step 1 — Install PM2

**Command:**
```bash
npm install -g pm2
```

**Purpose:** PM2 is a process manager. Without it, if the backend crashes or server restarts, your Node.js app dies. PM2 keeps it alive 24/7 automatically.

---

## Step 2 — Clone the Repository

**Command:**
```bash
cd ~
git clone https://github.com/skillspherefyp-ui/SkillSphere-cpanel.git skillsphere
cd skillsphere/backend
```

**Purpose:** Downloads your project code from GitHub onto the server.

---

## Step 3 — Install Backend Dependencies

**Command:**
```bash
npm install
```

**Purpose:** Installs all packages listed in `backend/package.json` (Express, Sequelize, OpenAI SDK, etc.) onto the server.

---

## Step 4 — Create Database

**Where:** cPanel → MySQL Databases

**Steps:**
1. Create database → `skillsphere_db`
2. Create user → `skillsphere_user` + strong password
3. Add user to database → All Privileges

**Purpose:** Creates the MariaDB database where all app data lives (users, courses, topics, enrollments, etc.)

---

## Step 5 — Create .env File

**Command:**
```bash
cd ~/skillsphere/backend
nano .env
```

**Paste:**
```
PORT=5000
NODE_ENV=production
JWT_SECRET=9f3a2c8e1d7b4f6a0e5c9d2b8f1a4e7c3d6b9f2a5e8c1d4b7f0a3e6c9d2b5f8

# Database (from Step 4)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=skillsphere_user
MYSQL_PASSWORD=your_db_password_here
MYSQL_DB=skillsphere_db

# Auth
SUPER_ADMIN_EMAIL=admin@skillsphere.com.pk
SUPER_ADMIN_PASSWORD=your_admin_password_here
SUPER_ADMIN_NAME=Super Admin

# OpenAI
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL_LECTURE=gpt-4o
OPENAI_MODEL_QA=gpt-4o
OPENAI_MODEL_TUTOR_PLANNER=gpt-4o
OPENAI_TTS_MODEL=tts-1
OPENAI_STT_MODEL=whisper-1

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Email
BREVO_API_KEY=your_brevo_key

# Frontend
FRONTEND_URL=https://skillsphere.com.pk
ALLOWED_ORIGINS=https://skillsphere.com.pk,https://api.skillsphere.com.pk
```

**Save:** `Ctrl+X` → `Y` → `Enter`

**Purpose:** All sensitive credentials and configuration the backend needs to connect to services. Never commit this file to GitHub.

---

## Step 6 — Start Backend with PM2

**Commands:**
```bash
pm2 start server.js --name skillsphere-api
pm2 save
pm2 startup
```

**Purpose:**
- `pm2 start` — runs the Express server
- `pm2 save` — saves the process list so PM2 remembers it
- `pm2 startup` — makes PM2 auto-start after server reboots

---

## Step 7 — Create API Subdomain

**Where:** cPanel → Subdomains

**Steps:**
1. Subdomain: `api`
2. Domain: `skillsphere.com.pk`
3. Result: `api.skillsphere.com.pk`
4. Note the folder path it creates

**Purpose:** Creates a separate URL for the backend API so the frontend can call `api.skillsphere.com.pk` instead of `skillsphere.com.pk:5000`

---

## Step 8 — Proxy Subdomain to Backend Port

**Command:**
```bash
nano ~/public_html/api/.htaccess
```

**Paste:**
```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
```

**Save:** `Ctrl+X` → `Y` → `Enter`

**Purpose:** Routes all traffic hitting `api.skillsphere.com.pk` to your Express backend running on port 5000. This is the bridge between the domain and your Node.js app.

> ⚠️ **If this doesn't work** — contact Host N Solutions support and ask:
> *"Can you enable mod_proxy on my account to proxy a subdomain to localhost:5000?"*

---

## Step 9 — Upload Frontend

**Option A — Via Terminal:**
```bash
cp -r ~/skillsphere/AppAndroidSS/web-build/* ~/public_html/
```

**Option B — Via cPanel File Manager:**
- Go to cPanel → File Manager → `public_html`
- Upload all files from your local `web-build/` folder

**Purpose:** Puts the built React Native Web frontend on the server so `skillsphere.com.pk` serves the app to users.

---

## Step 10 — Frontend Routing Fix

**Command:**
```bash
nano ~/public_html/.htaccess
```

**Paste:**
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ /index.html [L]
```

**Save:** `Ctrl+X` → `Y` → `Enter`

**Purpose:** Fixes page refresh issues on the frontend. Without this, refreshing any page other than `/` gives a 404 error.

---

## Step 11 — Seed Super Admin

**Command:**
```bash
cd ~/skillsphere/backend
node scripts/seedSuperAdmin.js
```

**Purpose:** Creates the first Super Admin account in the database using the credentials from `.env` so you can log in for the first time.

---

## PM2 Useful Commands

```bash
pm2 status                    # Check if backend is running
pm2 logs skillsphere-api      # View backend logs
pm2 restart skillsphere-api   # Restart backend
pm2 stop skillsphere-api      # Stop backend
```

---

## Final URLs

| URL | What it serves |
|---|---|
| `https://skillsphere.com.pk` | Frontend (React app) |
| `https://api.skillsphere.com.pk` | Backend API (Express) |
| `https://skillsphere.com.pk/login` | Login page |

---

## ⚠️ Things That Could Go Wrong

| Issue | Solution |
|---|---|
| Step 8 proxy doesn't work | Ask host to enable mod_proxy |
| `npm install` fails on `sharp` | Contact host or remove sharp dependency |
| Database connection fails | Double check .env credentials match cPanel DB |
| PM2 process dies after reboot | Run `pm2 startup` command again |

---

## Security Reminders

- Never commit `.env` to GitHub
- Never share the JWT secret publicly
- Use strong passwords for DB user and Super Admin

---

## JWT Secret Key
```
9f3a2c8e1d7b4f6a0e5c9d2b8f1a4e7c3d6b9f2a5e8c1d4b7f0a3e6c9d2b5f8
```
> ⚠️ Keep this private — do not share or commit to GitHub.
