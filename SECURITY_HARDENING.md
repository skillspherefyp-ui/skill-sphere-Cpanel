# SkillSphere — Security Hardening Todo

Steps to implement to make the app more resistant to cyber attacks.
Each section is self-contained and can be implemented independently.

---

## 1. HTTP Security Headers — `helmet.js`

**What it protects against:** Clickjacking, MIME sniffing, XSS via CSP, protocol downgrade attacks.

**Steps:**
1. Install: `npm install helmet`
2. In `backend/server.js`, add near the top:
   ```js
   const helmet = require('helmet');
   app.use(helmet());
   ```
3. Optionally configure CSP to whitelist your frontend origin:
   ```js
   app.use(helmet.contentSecurityPolicy({
     directives: {
       defaultSrc: ["'self'"],
       scriptSrc: ["'self'"],
       imgSrc: ["'self'", "https://res.cloudinary.com"],
     }
   }));
   ```

---

## 2. Input Validation — `express-validator`

**What it protects against:** Malformed data, unexpected types, oversized payloads, injection attempts.

**Steps:**
1. Install: `npm install express-validator`
2. Add validation middleware to high-risk routes (auth, course creation, discussion posts):
   ```js
   const { body, validationResult } = require('express-validator');

   router.post('/register', [
     body('email').isEmail().normalizeEmail(),
     body('password').isLength({ min: 8 }),
     body('name').trim().isLength({ min: 2, max: 100 }),
   ], (req, res, next) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
     next();
   });
   ```
3. Apply to: `/api/auth/*`, `/api/courses`, `/api/discussion/*`, `/api/upload`

---

## 3. Input Sanitization — Strip HTML/XSS

**What it protects against:** Stored XSS — attacker posts HTML/JS in discussion posts or course content that runs in other users' browsers.

**Steps:**
1. Install: `npm install sanitize-html`
2. In `backend/controllers/discussionController.js`, sanitize content before saving:
   ```js
   const sanitizeHtml = require('sanitize-html');

   // In createPost and updatePost, before saving:
   const cleanContent = sanitizeHtml(content, {
     allowedTags: [], // strip all HTML — plain text only
     allowedAttributes: {},
   });
   post.content = cleanContent;
   ```
3. Apply the same to course descriptions in `courseController.js`

---

## 4. JWT Hardening — Short Expiry + Refresh Tokens

**What it protects against:** Stolen tokens being used indefinitely.

**Steps:**
1. Change JWT sign in `authController.js` to expire in 30 minutes:
   ```js
   const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30m' });
   ```
2. Issue a separate refresh token (long-lived, e.g. 7 days), store it in the DB in a `RefreshToken` table.
3. Add `POST /api/auth/refresh` endpoint — validates refresh token, issues new access token.
4. On the frontend (`apiClient.js`), intercept 401 responses and call `/refresh` automatically before retrying the original request.

---

## 5. Token Blacklist on Logout

**What it protects against:** Stolen tokens being used after the user has logged out.

**Steps:**
1. Create a `BlacklistedToken` Sequelize model with fields: `token` (string), `expiresAt` (date).
2. In `authController.logout`, add the current token to the blacklist table.
3. In `middleware/auth.js` (`authenticateToken`), after verifying the JWT, check if it exists in the blacklist:
   ```js
   const blacklisted = await BlacklistedToken.findOne({ where: { token } });
   if (blacklisted) return res.status(401).json({ error: 'Token revoked' });
   ```
4. Add a cron job or cleanup on startup to purge expired blacklisted tokens.

---

## 6. Account Lockout After Failed Logins

**What it protects against:** Brute-force password attacks (supplements rate limiting).

**Steps:**
1. Add `failedLoginAttempts` (integer, default 0) and `lockedUntil` (date, nullable) columns to the `Users` table.
2. In `authController.login`:
   - On wrong password: increment `failedLoginAttempts`
   - If `failedLoginAttempts >= 5`: set `lockedUntil = now + 15 minutes`
   - On successful login: reset `failedLoginAttempts = 0`, `lockedUntil = null`
   - At login start: check `lockedUntil > now` and reject with `"Account temporarily locked"`

---

## 7. Password Strength Policy

**What it protects against:** Weak passwords that are easy to brute-force or guess.

**Steps:**
1. In `authController.js` register/reset-password, add validation before hashing:
   ```js
   const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
   if (!passwordRegex.test(password)) {
     return res.status(400).json({
       error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
     });
   }
   ```
2. Mirror this validation on the frontend signup/reset forms for immediate feedback.
3. Verify bcrypt salt rounds are at least 12 in `authController.js`.

---

## 8. OTP Security

**What it protects against:** OTP brute-force, reuse of expired OTPs.

**Steps:**
1. Add `otpAttempts` (integer, default 0) column to wherever OTPs are stored.
2. On each failed OTP attempt: increment `otpAttempts`; if >= 3, invalidate the OTP (force resend).
3. Ensure OTP expiry is enforced server-side (max 10 minutes). Check `otpExpiresAt < now` and reject.
4. After successful OTP use, immediately null out `otp` and `otpExpiresAt` in the DB.

---

## 9. Prevent Account Enumeration

**What it protects against:** Attackers discovering which emails are registered by analyzing error messages.

**Steps:**
1. In `authController.login`, change:
   - Current: `"Email not found"` / `"Wrong password"` (reveals if email exists)
   - Fixed: always return `"Invalid email or password"` for both cases
2. In `authController.forgotPassword`:
   - Current: may return `"Email not found"`
   - Fixed: always return `"If this email is registered, you will receive a reset link"` — same response whether email exists or not

---

## 10. Production Error Message Hardening

**What it protects against:** Stack traces and internal details leaking to attackers in production.

**Steps:**
1. In `backend/server.js`, add a global error handler at the bottom (after all routes):
   ```js
   app.use((err, req, res, next) => {
     console.error(err); // log internally
     if (process.env.NODE_ENV === 'production') {
       return res.status(500).json({ error: 'Internal server error' });
     }
     res.status(500).json({ error: err.message, stack: err.stack });
   });
   ```
2. Audit all `catch` blocks in controllers — replace `res.json({ error: err.message })` with generic messages in production.

---

## 11. File Upload Security

**What it protects against:** Malicious file uploads (executable scripts disguised as images/PDFs).

**Steps:**
1. In `backend/routes/uploadRoutes.js`, add a file type whitelist to the multer config:
   ```js
   fileFilter: (req, file, cb) => {
     const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
     if (allowed.includes(file.mimetype)) cb(null, true);
     else cb(new Error('Invalid file type'), false);
   }
   ```
2. Add size limits:
   ```js
   limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
   ```
3. Never trust the file extension — always check `file.mimetype`.

---

## 12. Dependency Vulnerability Audit

**What it protects against:** Known CVEs in your npm packages being exploited.

**Steps:**
1. Run in both `backend/` and `AppAndroidSS/`:
   ```bash
   npm audit
   npm audit fix
   ```
2. For breaking-change fixes, review manually: `npm audit fix --force`
3. Set up a recurring reminder to run `npm audit` monthly or add it to your CI pipeline.
4. Key packages to keep updated: `openai`, `sequelize`, `jsonwebtoken`, `express`, `multer`

---

## 13. CORS Tightening

**What it protects against:** Unauthorized origins making API requests on behalf of logged-in users.

**Steps:**
1. In `backend/server.js`, verify `ALLOWED_ORIGINS` env var is set and not `*` in production:
   ```js
   const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
   app.use(cors({
     origin: (origin, callback) => {
       if (!origin || allowedOrigins.includes(origin)) callback(null, true);
       else callback(new Error('Not allowed by CORS'));
     },
     credentials: true,
   }));
   ```
2. Set `ALLOWED_ORIGINS=https://yourfrontenddomain.com` in production `.env`

---

## 14. Security Event Logging

**What it protects against:** Undetected attacks — you can't respond to what you can't see.

**Steps:**
1. Install: `npm install morgan`
2. Add HTTP request logging in `server.js`:
   ```js
   const morgan = require('morgan');
   app.use(morgan('combined')); // logs IP, method, path, status, response time
   ```
3. Add structured security event logs in controllers:
   - Failed logins (log email + IP)
   - Account lockouts
   - Profanity suspensions (already have `console.warn`, make it structured)
   - Repeated 403s from the same IP
   - OTP failures

---

## Priority Order (Implement in this order)

| Priority | Item | Effort |
|----------|------|--------|
| 1 | Account enumeration fix (#9) | Low — 2 line changes |
| 2 | Production error hardening (#10) | Low — add one middleware |
| 3 | `helmet.js` (#1) | Low — 2 lines |
| 4 | `npm audit` (#12) | Low — run a command |
| 5 | Password strength policy (#7) | Low — add regex check |
| 6 | Input validation `express-validator` (#2) | Medium |
| 7 | Input sanitization (#3) | Medium |
| 8 | OTP security (#8) | Medium — DB column + logic |
| 9 | Account lockout (#6) | Medium — DB columns + logic |
| 10 | File upload security (#11) | Medium — update multer config |
| 11 | CORS tightening (#13) | Low — verify env var |
| 12 | Security event logging (#14) | Medium |
| 13 | JWT short expiry + refresh tokens (#4) | High effort — requires frontend changes |
| 14 | Token blacklist on logout (#5) | High effort — new DB model |
