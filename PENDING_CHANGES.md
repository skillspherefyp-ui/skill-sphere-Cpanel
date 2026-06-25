# Pending Changes — To Do Later

Changes that have been planned but not yet implemented.

---

## 1. Switch Email Service to cPanel Domain Email

**Current:** Brevo HTTP API (`BREVO_API_KEY`)
**Change to:** SMTP using `noreply@skillsphere.com.pk` via cPanel

### Steps

**Step 1 — Create email account in cPanel**
- cPanel → Email Accounts
- Create `noreply@skillsphere.com.pk`
- Set a strong password

**Step 2 — Update `backend/services/emailService.js`**

At the top of the file, add:
```js
const nodemailer = require('nodemailer');
const useSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
```

Add this function before the brand colors section:
```js
const sendEmailWithSMTP = async (emailData) => {
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"SkillSphere" <${fromEmail}>`,
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text,
  };

  if (emailData.attachments && emailData.attachments.length > 0) {
    mailOptions.attachments = emailData.attachments
      .filter(att => att.content && att.filename)
      .map(att => ({ filename: att.filename, content: att.content }));
  }

  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
};

const sendEmail = async (emailData) => {
  if (useSmtp) return sendEmailWithSMTP(emailData);
  return sendEmailWithBrevoAPI(emailData);
};
```

Replace all occurrences of:
```js
return await sendEmailWithBrevoAPI({
```
With:
```js
return await sendEmail({
```

**Step 3 — Update `.env` on the server**
```env
SMTP_HOST=mail.skillsphere.com.pk
SMTP_PORT=587
SMTP_USER=noreply@skillsphere.com.pk
SMTP_PASS=your_email_password_here
SMTP_FROM_EMAIL=noreply@skillsphere.com.pk
```

**Result:** When SMTP vars are set → uses domain email. Otherwise → falls back to Brevo.

---
