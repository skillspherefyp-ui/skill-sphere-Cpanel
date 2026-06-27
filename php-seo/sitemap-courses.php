<?php
// ─── SkillSphere Dynamic Course Sitemap ──────────────────────────────────────
// Place this file in your website ROOT (same folder as index.html)
// Accessible at: https://skillsphere.com.pk/sitemap-courses.xml
// Submit this URL in Google Search Console as a second sitemap.

function fetchApi($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_FAILONERROR, false);
    $raw = curl_exec($ch);
    curl_close($ch);
    return $raw ?: null;
}

$base = 'https://skillsphere.com.pk';
$api  = 'http://127.0.0.1:5000/api';

// ── Fetch all courses from backend ────────────────────────────────────────────
$raw     = fetchApi($api . '/courses?limit=500');
$courses = [];
if ($raw) {
    $data    = json_decode($raw, true);
    $courses = $data['courses'] ?? [];
}

// ── Helper: convert course name to URL slug ───────────────────────────────────
function toSlug($name) {
    $slug = strtolower(trim($name));
    $slug = str_replace('+', '-plus', $slug);
    $slug = str_replace('&', '-and', $slug);
    $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
    $slug = preg_replace('/[\s-]+/', '-', $slug);
    return trim($slug, '-');
}

// ── Output XML ────────────────────────────────────────────────────────────────
header('Content-Type: application/xml; charset=UTF-8');
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

// Explore listing page
echo "  <url>\n";
echo "    <loc>{$base}/explore</loc>\n";
echo "    <changefreq>daily</changefreq>\n";
echo "    <priority>0.8</priority>\n";
echo "  </url>\n";

// Individual course pages
foreach ($courses as $course) {
    if (($course['status'] ?? '') !== 'published') continue;

    $id   = intval($course['id']);
    $slug = toSlug($course['name'] ?? 'course');
    $loc  = htmlspecialchars("{$base}/explore/{$id}/{$slug}", ENT_XML1);
    $mod  = date('Y-m-d', strtotime($course['updatedAt'] ?? $course['createdAt'] ?? 'now'));

    echo "  <url>\n";
    echo "    <loc>{$loc}</loc>\n";
    echo "    <lastmod>{$mod}</lastmod>\n";
    echo "    <changefreq>weekly</changefreq>\n";
    echo "    <priority>0.7</priority>\n";
    echo "  </url>\n";
}

echo '</urlset>';
