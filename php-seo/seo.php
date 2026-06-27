<?php
// ─── SkillSphere Dynamic SEO Injector ────────────────────────────────────────
// Place this file in your website ROOT (same folder as index.html)

function fetchApi($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 4);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
    curl_setopt($ch, CURLOPT_FAILONERROR, false);
    $raw = curl_exec($ch);
    curl_close($ch);
    return $raw ?: null;
}

$path  = strtok($_SERVER['REQUEST_URI'], '?');
$base  = 'https://skillsphere.com.pk';
$api   = 'http://127.0.0.1:5000/api';

// Default meta (used for /explore listing page)
$title = 'Explore Courses - SkillSphere';
$desc  = 'Browse AI-powered professional courses on SkillSphere. Learn Python, Web Development, Data Science and more. Get certified today.';
$image = $base . '/og-image.png';
$url   = $base . $path;

// ── If URL is /explore/{id}/{slug} → fetch course from API ───────────────────
if (preg_match('#^/explore/(\d+)/([^/?]+)#', $path, $m)) {
    $courseId = intval($m[1]);
    $raw = fetchApi($api . '/courses/' . $courseId);
    if ($raw) {
        $data = json_decode($raw, true);
        $c    = $data['course'] ?? null;
        if ($c) {
            $name  = $c['name'] ?? 'Course';
            $cdesc = strip_tags($c['description'] ?? '');
            $cdesc = mb_substr($cdesc, 0, 160);
            $title = $name . ' - SkillSphere';
            $desc  = $cdesc ?: $desc;
            if (!empty($c['thumbnailImage'])) {
                $image = $c['thumbnailImage'];
            }
        }
    }
}

// Escape for HTML attributes
$title = htmlspecialchars($title, ENT_QUOTES | ENT_HTML5);
$desc  = htmlspecialchars($desc,  ENT_QUOTES | ENT_HTML5);
$image = htmlspecialchars($image, ENT_QUOTES | ENT_HTML5);
$url   = htmlspecialchars($url,   ENT_QUOTES | ENT_HTML5);

// ── Read index.html ───────────────────────────────────────────────────────────
$html = file_get_contents(__DIR__ . '/index.html');

// ── Strip ALL existing conflicting tags so there are no duplicates ────────────
$html = preg_replace('/<title>[^<]*<\/title>/i', '', $html);
$html = preg_replace('/<meta\s+name=["\']description["\'][^>]*>/i', '', $html);
$html = preg_replace('/<meta\s+property=["\']og:[^"\']*["\'][^>]*>/i', '', $html);
$html = preg_replace('/<meta\s+name=["\']twitter:[^"\']*["\'][^>]*>/i', '', $html);

// ── Build clean meta block ────────────────────────────────────────────────────
$meta = <<<HTML
<title>{$title}</title>
<meta name="description" content="{$desc}">
<meta property="og:title" content="{$title}">
<meta property="og:description" content="{$desc}">
<meta property="og:image" content="{$image}">
<meta property="og:url" content="{$url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SkillSphere">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{$title}">
<meta name="twitter:description" content="{$desc}">
<meta name="twitter:image" content="{$image}">
HTML;

// ── Inject before </head> ─────────────────────────────────────────────────────
$html = str_replace('</head>', $meta . "\n</head>", $html);

header('Content-Type: text/html; charset=UTF-8');
echo $html;
