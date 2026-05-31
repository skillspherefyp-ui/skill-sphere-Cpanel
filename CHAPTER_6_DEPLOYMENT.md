# Chapter 6: Software Deployment

## 6.1 Installation / Deployment Process Description

SkillSphere follows a cloud-based deployment architecture with the backend and frontend hosted on cPanel shared hosting, and media/file storage managed through Cloudinary. The application is accessible at **skillsphere.com.pk**.

---

### Backend Deployment (cPanel)

1. The backend source code is deployed to the cPanel server by cloning the GitHub repository directly using the cPanel Terminal:
2. Node.js is configured in cPanel and the Express.js application is managed using **PM2** (Process Manager 2). PM2 keeps the server running in the background, automatically restarts it on crashes, and ensures the process survives server reboots.
3. cPanel's Nginx acts as a reverse proxy in front of the Node.js process; the server is configured with `app.set('trust proxy', 1)` to correctly handle forwarded client IPs and HTTPS headers behind Nginx.
4. The server listens on the port provided by the `PORT` environment variable (defaulting to `5000` if not set).
5. All environment variables (database credentials, JWT secret, Cloudinary keys, OpenAI API key, Firebase credentials, email service keys) are configured in cPanel's environment variable manager or a `.env` file on the server.
6. The backend API is served at `https://skillsphere.com.pk/api` (or a subdomain such as `api.skillsphere.com.pk` depending on cPanel virtual host configuration).

---

### Database Setup (cPanel MySQL)

SkillSphere uses MySQL provided by cPanel hosting. The database is configured using individual credentials rather than a connection URL:

- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DB` are set as environment variables.
- On startup, the `config/database.js` module automatically creates the database schema if it does not exist using `CREATE DATABASE IF NOT EXISTS` with `utf8mb4` character set and `utf8mb4_unicode_ci` collation.
- Sequelize ORM then synchronises all 34 models using `sync({ alter: { drop: false } })`, which automatically creates or modifies database tables without dropping existing data.
- Additionally, on first startup the `materials.extractedText` column is explicitly set to `LONGTEXT CHARACTER SET utf8mb4` to support non-Latin content such as Urdu and Arabic.

On first deployment:

- All **34 database tables** are automatically created.
- An Admin account is automatically created using `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` environment variables if no admin exists.
- A welcome email is sent to the Admin, and an in-app notification is created.

---

### Frontend Deployment (cPanel)

1. The React Native Web frontend (`AppAndroidSS/`) is built for production using Webpack:

   ```bash
   npm run build:web
   ```

   This produces a static build output in the `web-build/` directory.

2. The contents of `web-build/` are uploaded to the `public_html/` directory (or a subdirectory) on the cPanel server.
3. The `REACT_APP_API_URL` environment variable is set at build time to point to the production backend URL (e.g., `https://api.skillsphere.com.pk`), so the frontend communicates with the correct API endpoint.
4. cPanel's Apache or Nginx serves the static files. An `.htaccess` rewrite rule is configured to redirect all routes to `index.html` to support React's client-side routing (Single Page Application behaviour).
5. The application is accessible to users at **https://skillsphere.com.pk**.

For Android users, the React Native app can additionally be packaged as an APK using:

```bash
npx react-native run-android
```

The APK points to the same production backend URL and is distributed directly to Android users.

---

### File Storage (Cloudinary)

1. A Cloudinary account is set up and `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are configured as environment variables.
2. The `config/cloudinary.js` module initialises two storage configurations:
   - **`generalStorage`** — for course PDFs and images, stored under `skillsphere/uploads/` (PDFs are uploaded as `raw` resource type; images as `image`).
   - **`templateStorage`** — for certificate background images and instructor signatures, stored under `skillsphere/templates/`.
3. In the Cloudinary dashboard, **"Allow delivery of PDF and ZIP files"** must be enabled under Security settings so that raw PDF uploads can be delivered.
4. All files uploaded through the platform (course materials, profile images, certificate template backgrounds) are stored on Cloudinary and served via Cloudinary's CDN URLs, removing any storage load from the cPanel server.

---

## Environment Variables Required

**Table 49: Environment Variables Required**

| Variable | Description |
|---|---|
| `MYSQL_HOST` | cPanel MySQL host (usually `localhost`) |
| `MYSQL_PORT` | MySQL port (default `3306`) |
| `MYSQL_USER` | MySQL database username |
| `MYSQL_PASSWORD` | MySQL database password |
| `MYSQL_DB` | MySQL database name |
| `JWT_SECRET` | Secret key for JWT token signing |
| `ADMIN_EMAIL` | Initial Admin account email |
| `ADMIN_PASSWORD` | Initial Admin account password |
| `ADMIN_NAME` | Initial Admin account display name |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `OPENAI_API_KEY` | OpenAI API key for all AI features |
| `OPENAI_MODEL_LECTURE` | OpenAI model for AI lecture generation |
| `OPENAI_MODEL_QA` | OpenAI model for Q&A responses |
| `OPENAI_MODEL_TUTOR_PLANNER` | OpenAI model for AI tutor planning |
| `OPENAI_TTS_MODEL` | OpenAI model for text-to-speech |
| `OPENAI_STT_MODEL` | OpenAI model for speech-to-text |
| `FIREBASE_PROJECT_ID` | Firebase project ID for Google OAuth |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |
| `BREVO_API_KEY` | Brevo (Sendinblue) email service API key |
| `SMTP_HOST` | SMTP server host for Nodemailer |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM_EMAIL` | Sender email address |
| `FRONTEND_URL` | Frontend URL for CORS and redirects (e.g., `https://skillsphere.com.pk`) |
| `ALLOWED_ORIGINS` | Comma-separated list of additional allowed CORS origins |
