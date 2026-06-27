# SkillSphere PHP SEO — Code Explained Simply

---

## File 1: seo.php

This file runs every time someone (or Google) visits a course page like:
`skillsphere.com.pk/explore/17/python-for-beginners`

---

### Step 1 — Read the URL

```php
$path = strtok($_SERVER['REQUEST_URI'], '?');
```

This reads the URL from the browser. For example it reads `/explore/17/python-for-beginners`.
The `?` part removes any extra stuff after the URL like `?page=1`.

---

### Step 2 — Set default values

```php
$title = 'Explore Courses - SkillSphere';
$desc  = 'Browse AI-powered professional courses...';
$image = 'https://skillsphere.com.pk/og-image.png';
```

These are the default title and description used if no specific course is found.
Think of it as a backup — if something goes wrong, Google still sees something useful.

---

### Step 3 — Check if URL has a course ID

```php
if (preg_match('#^/explore/(\d+)/([^/?]+)#', $path, $m)) {
    $courseId = intval($m[1]);
```

This checks if the URL looks like `/explore/17/something`.
If yes, it takes out the number `17` — that is the course ID.

---

### Step 4 — Fetch course details from the backend

```php
$raw = fetchApi($api . '/courses/' . $courseId);
```

This goes to our backend server and asks for the course with ID 17.
The backend returns the course name, description, and image.

---

### Step 5 — Set the course specific title and description

```php
$title = $name . ' - SkillSphere';
$desc  = $cdesc ?: $desc;
$image = $c['thumbnailImage'];
```

Now the title becomes `Python for Beginners - SkillSphere` instead of the generic one.
The description becomes the actual course description from the database.
The image becomes the course thumbnail.

---

### Step 6 — Read index.html and remove old tags

```php
$html = file_get_contents(__DIR__ . '/index.html');
$html = preg_replace('/<title>[^<]*<\/title>/i', '', $html);
$html = preg_replace('/<meta name="description"...', '', $html);
```

This reads the website's main HTML file into memory (does NOT change the file on disk).
Then it removes the old generic title and description tags so there are no duplicates.

---

### Step 7 — Inject the new tags and send to Google

```php
$meta = '<title>Python for Beginners - SkillSphere</title>
<meta name="description" content="Master Python...">
<meta property="og:title" content="Python for Beginners - SkillSphere">
...';

$html = str_replace('</head>', $meta . '</head>', $html);
echo $html;
```

It puts the new course specific tags into the HTML and sends it to Google.
Google now sees the correct title and description for that specific course.

---

### What Google sees for each course

```
Title:       Python for Beginners - SkillSphere
Description: Master the fundamentals of programming using Python...
Image:       (course thumbnail from Cloudinary)
URL:         https://skillsphere.com.pk/explore/17/python-for-beginners
```

---

---

## File 2: sitemap-courses.php

This file tells Google which course pages exist on our website.
Google visits `skillsphere.com.pk/sitemap-courses.xml` and gets a full list.

---

### Step 1 — Fetch all courses from backend

```php
$raw = fetchApi($api . '/courses?limit=500');
$courses = $data['courses'] ?? [];
```

This asks our backend for all courses (up to 500).
The backend returns the full list of courses from the database.

---

### Step 2 — Convert course name to URL format

```php
function toSlug($name) {
    $slug = strtolower(trim($name));
    $slug = str_replace('+', '-plus', $slug);
    $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
    $slug = preg_replace('/[\s-]+/', '-', $slug);
    return trim($slug, '-');
}
```

This converts the course name into a URL friendly format:

- `Python for Beginners` becomes `python-for-beginners`
- `C++ Programming` becomes `c-plus-plus-programming`
- All spaces become dashes, all uppercase becomes lowercase

---

### Step 3 — Only include published courses

```php
if (($course['status'] ?? '') !== 'published') continue;
```

This skips any course that is not published yet.
Only published courses appear in the sitemap so Google does not find unpublished ones.

---

### Step 4 — Output the XML list

```php
echo '<url>';
echo '  <loc>https://skillsphere.com.pk/explore/17/python-for-beginners</loc>';
echo '  <lastmod>2026-06-14</lastmod>';
echo '  <changefreq>weekly</changefreq>';
echo '  <priority>0.7</priority>';
echo '</url>';
```

For each published course it outputs one URL block.
`lastmod` is the date the course was last updated — Google uses this to know if it needs to re-crawl.
`changefreq weekly` tells Google to check this page once a week.
`priority 0.7` tells Google this page is fairly important.

---

### What Google receives when it visits sitemap-courses.xml

```xml
<urlset>
  <url>
    <loc>https://skillsphere.com.pk/explore</loc>
  </url>
  <url>
    <loc>https://skillsphere.com.pk/explore/17/python-for-beginners</loc>
    <lastmod>2026-06-14</lastmod>
  </url>
  <url>
    <loc>https://skillsphere.com.pk/explore/18/web-development-fundamentals</loc>
    <lastmod>2026-06-14</lastmod>
  </url>
  ... and so on for every published course
</urlset>
```

---

## How Both Files Work Together

```
sitemap-courses.xml  →  tells Google WHERE to go
seo.php              →  tells Google WHAT each page is about
```

- Sitemap says: go visit `/explore/17/python-for-beginners`
- Google visits that URL
- seo.php gives Google the correct title and description
- Google indexes the page with the right information
- Page appears in search results
