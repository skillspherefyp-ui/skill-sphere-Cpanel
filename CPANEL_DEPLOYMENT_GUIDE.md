# SkillSphere cPanel Deployment Guide

---

## Step 1 — Create MySQL Database

1. Login to **cPanel** → **MySQL Databases**
2. Under **Create New Database** → type `skillsphere` → click **Create Database**
3. Under **MySQL Users** → type username `dbuser`, set a strong password → click **Create User**
4. Under **Add User To Database** → select both → click **Add** → grant **All Privileges**

> **Note:** cPanel auto-prefixes your username. If your cPanel account is `skillsph`, your DB becomes `skillsph_skillsphere` and user becomes `skillsph_dbuser`

---

## Step 2 — Clone the Repository

Open SSH terminal and run:

```bash
cd ~
git clone https://github.com/skillspherefyp-ui/skill-sphere-Cpanel.git
cd skill-sphere-Cpanel/backend
```

---

## Step 3 — Install Dependencies

```bash
npm install
```

---

## Step 4 — Create .env File

```bash
nano .env
```

Fill in the following — only values marked CHANGE THIS need to be updated:

```
MYSQL_URL=
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=skillsph_dbuser
MYSQL_PASSWORD=your_db_password
MYSQL_DB=skillsph_skillsphere

PORT=5000
NODE_ENV=production

JWT_SECRET=any_long_random_string_here

ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password
ADMIN_NAME=Admin

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=465
SMTP_USER=your_brevo_smtp_user
SMTP_PASS=your_brevo_smtp_password
SMTP_FROM_EMAIL=your_sender_email
BREVO_API_KEY=your_brevo_api_key

FRONTEND_URL=https://skillsphere.com.pk
ALLOWED_ORIGINS=https://skillsphere.com.pk,https://www.skillsphere.com.pk,http://localhost:3000

OPENAI_API_KEY=your_openai_key
OPENAI_MODEL_LECTURE=gpt-4.1-mini
OPENAI_MODEL_QA=gpt-4.1-mini
OPENAI_STT_MODEL=gpt-4o-mini-transcribe
OPENAI_TTS_MODEL=gpt-4o-mini-tts

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
```

Save the file: **Ctrl+X** then **Y** then **Enter**

---

## Step 5 — Install PM2

```bash
npm install --prefix ~/.local pm2
echo 'export PATH=$PATH:/home/skillsph/.local/node_modules/.bin' >> ~/.bashrc && source ~/.bashrc
```

> Replace `skillsph` with your actual cPanel username

---

## Step 6 — Start Backend

```bash
pm2 start server.js --name skillsphere
pm2 save
```

Check it is running:

```bash
pm2 status
```

Check logs:

```bash
pm2 logs skillsphere
```

---

## Step 7 — Build Frontend (on your local machine)

```bash
cd AppAndroidSS
npm run build:web
```

This generates a `web-build/` folder. Upload its contents to `public_html` on cPanel via **File Manager**.

---

## Step 8 — Set API URL in Frontend

Before building in Step 7, create `AppAndroidSS/.env` file on your local machine:

```
REACT_APP_API_URL=https://skillsphere.com.pk:5000/api
```

> This is the only frontend env variable needed. It tells the frontend where the backend API is running.
> Replace `skillsphere.com.pk` with your actual domain.

Then rebuild and re-upload.

---

## Step 9 — Future Updates

When you make changes, push to GitHub then on SSH:

```bash
cd ~/skill-sphere-Cpanel/backend
git pull origin main
pm2 restart skillsphere
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Server not starting | `pm2 logs skillsphere` to see the error |
| Database connection error | Double check `.env` MySQL credentials |
| Frontend cant reach API | Check `REACT_APP_API_URL` and `ALLOWED_ORIGINS` |
| PM2 not found | Re-run the PATH export command in Step 5 |
| Port 5000 blocked | Ask your hosting provider to open port 5000 |
