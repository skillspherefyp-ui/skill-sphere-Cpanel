# SkillSphere PHP SEO Setup

This folder contains 3 files. Follow the steps below exactly.

---

## Files in this folder

| File | What it does |
|------|-------------|
| `seo.php` | Injects course title/description for Google when visiting `/explore/...` |
| `sitemap-courses.php` | Auto-generates sitemap with all published course URLs |
| `htaccess-addition.txt` | Lines to add to your existing `.htaccess` file |

---

## Step 1 — Upload files to CPanel

1. Open **CPanel → File Manager**
2. Go to your website root folder (the one that contains `index.html` and `.htaccess`)
3. Upload **`seo.php`** here
4. Upload **`sitemap-courses.php`** here

Do NOT upload `htaccess-addition.txt` or this README — they are instructions only.

---

## Step 2 — Edit .htaccess

1. In CPanel File Manager, find `.htaccess` in your website root
2. Right-click it → **Edit**
3. Find this line in your `.htaccess`:
   ```
   RewriteCond %{REQUEST_FILENAME} -f [OR]
   ```
4. Paste these **2 blocks** ABOVE that line:
   ```
   RewriteRule ^sitemap-courses\.xml$ sitemap-courses.php [QSA,L]

   RewriteCond %{REQUEST_URI} ^/explore(/|$)
   RewriteRule ^ seo.php [QSA,L]
   ```
5. Save

The `htaccess-addition.txt` file in this folder shows your full `.htaccess` as it should look after the change — use it as a reference if unsure.

---

## Step 3 — Test it is working

Open these URLs in your browser:

- `https://skillsphere.com.pk/explore` — should load normally
- `https://skillsphere.com.pk/explore/17/python-for-beginners` — should load normally
- `https://skillsphere.com.pk/sitemap-courses.xml` — should show an XML file with course URLs listed

To check SEO tags are injected, open any course URL and press **Ctrl+U** (View Source). You should see the course name in the `<title>` tag at the top of the HTML.

---

## Step 4 — Submit to Google Search Console

1. Go to **Google Search Console** → your skillsphere.com.pk property
2. Click **Sitemaps** in the left menu
3. In the "Add a new sitemap" box type:
   ```
   sitemap-courses.xml
   ```
4. Click **Submit**

That's it. Google will now automatically discover all course pages. When you add a new course, it will appear in the sitemap automatically — no action needed.

---

## Optional — robots.txt (recommended)

Open your `robots.txt` file on CPanel and add this one line at the bottom:

```
Sitemap: https://skillsphere.com.pk/sitemap-courses.xml
```

This is not required since you already submitted to Google Search Console, but it helps Bing and other crawlers find the course pages too. Your existing `robots.txt` content stays exactly the same — this is just an extra line at the end.

---

## Notes

- Your existing `sitemap.xml` in Google Search Console is NOT touched
- Your existing `index.html` file on the server is NOT modified
- `npm run build:web` workflow stays exactly the same — after each build just make sure `seo.php` and `sitemap-courses.php` are still in the root (they won't be deleted by the build, but double check)
- If your backend PORT changes from 5000, open `seo.php` and `sitemap-courses.php` and update the line that says `http://127.0.0.1:5000/api`
