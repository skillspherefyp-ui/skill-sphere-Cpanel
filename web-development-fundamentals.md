# Web Development Fundamentals

## Course Description

Learn the core skills of web development from scratch — HTML, CSS, and JavaScript.
This course takes you from understanding how the internet works all the way to building
your own responsive, interactive webpages. All resources are free and come from trusted
open educational sources (freeCodeCamp, MDN Web Docs, W3Schools, web.dev by Google).

What you will learn:
- How the internet and web browsers work
- Building web page structure with HTML
- Styling pages with CSS — colors, fonts, layout
- CSS Flexbox and Grid for modern layouts
- Making pages work on all screen sizes (Responsive Design)
- JavaScript basics — variables, functions, conditionals, loops
- Manipulating web pages dynamically with the DOM
- Building a complete personal webpage project

Who this course is for:
- Complete beginners with no web development experience
- Students who finished a programming basics course (C++/Python) and want to move to the web
- Anyone who wants to build websites from scratch

By the end of this course you will be able to:
- Build and style a complete multi-page website
- Make websites responsive for mobile and desktop
- Add interactive behavior to webpages using JavaScript
- Read and understand web development documentation

---

## Topic 1: How the Internet and Web Work

### Learning Objectives
- Understand the difference between the Internet and the World Wide Web
- Know how DNS resolves domain names to IP addresses
- Understand the HTTP request-response cycle
- Know how browsers receive and render web pages

### 1.1 The Internet vs the World Wide Web

The **Internet** is a global network of computers connected to each other using cables, fiber optics, and wireless signals. It is the physical infrastructure — the "roads" of the digital world.

The **World Wide Web (WWW)** is a service that runs on top of the Internet. It is a collection of web pages and resources (HTML, CSS, images, videos) that you access through a browser. Think of the Internet as the highway system, and the Web as the cars and destinations on those highways.

Other services that also use the Internet (but are not the Web):
- Email (SMTP / IMAP)
- File Transfer (FTP)
- Video calls (WebRTC)
- Online gaming

### 1.2 Clients and Servers

Every website interaction involves two sides:

- **Client** — Your browser (Chrome, Firefox, Safari). It requests and displays content.
- **Server** — A computer somewhere that stores web files and sends them when requested.

When you visit a website, your browser (client) sends a request to the server. The server responds with HTML, CSS, and JavaScript files. Your browser then renders them into the page you see.

### 1.3 IP Addresses and DNS

Every device on the Internet has a unique **IP address** (e.g., `192.168.1.1`). Servers also have IP addresses, but we use domain names like `google.com` instead of memorizing numbers.

**DNS (Domain Name System)** works like a phone book for the Internet:

1. You type `www.google.com` in your browser
2. Your computer asks a DNS server: "What is the IP address of google.com?"
3. The DNS server replies: "It is `142.250.80.46`"
4. Your browser connects to that IP address

### 1.4 HTTP and HTTPS

**HTTP (HyperText Transfer Protocol)** is the set of rules defining how browsers and servers communicate.

**HTTPS** is the secure version — all data is encrypted using TLS/SSL so that nobody can intercept it. Always look for the padlock icon in your browser. Modern websites must use HTTPS.

Common HTTP methods:
- `GET` — Request a web page or resource
- `POST` — Send data to the server (e.g., login form)
- `PUT` — Update existing data
- `DELETE` — Remove data

### 1.5 The Request-Response Cycle

Here is what happens when you type a URL and press Enter:

1. Browser checks its cache for a saved copy
2. DNS lookup — domain name converted to IP address
3. Browser opens a TCP connection to the server
4. Browser sends an HTTP GET request
5. Server responds with a status code and content
6. Browser receives HTML, then requests CSS and JS files
7. Browser parses and renders the full page

**HTTP Status Codes:**

| Code | Meaning |
|------|---------|
| 200 | OK — Request succeeded |
| 301 | Moved Permanently — Redirect |
| 404 | Not Found — Page does not exist |
| 500 | Internal Server Error — Server-side problem |

### 1.6 How Browsers Render a Web Page

Once the HTML file arrives, the browser follows these steps:

1. **Parse HTML** — builds the DOM (Document Object Model)
2. **Parse CSS** — builds the CSSOM (CSS Object Model)
3. **Combine DOM + CSSOM** — creates the Render Tree
4. **Layout** — calculates sizes and positions
5. **Paint** — draws pixels onto the screen

### Key Takeaways

- The Internet is physical infrastructure; the Web is a service on top of it
- Every website interaction is a client request and a server response
- DNS translates domain names to IP addresses
- HTTPS encrypts communication for security
- Browsers render pages by parsing HTML, CSS, then painting the screen

### Reference Materials

- YouTube: How The Web Works (Big Picture) — https://www.youtube.com/watch?v=hJHvdBlSxug
- YouTube: Internet vs World Wide Web — https://www.youtube.com/watch?v=-pKW2Ju12NA
- MDN: How the Web Works — https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_the_Web_works

### Quiz

**Question 1:** What does DNS stand for?
- A) Dynamic Network Service
- B) Domain Name System
- C) Digital Network Standard
- D) Data Naming Structure

**Correct Answer:** B — DNS (Domain Name System) translates human-readable domain names like google.com into the IP addresses computers use to connect.

**Question 2:** Which HTTP status code means the requested page was not found?
- A) 200
- B) 301
- C) 404
- D) 500

**Correct Answer:** C — HTTP 404 means "Not Found". The server received the request but could not locate the requested resource.

---

## Topic 2: HTML Basics — Structure of a Web Page

### Learning Objectives
- Understand what HTML is and what it does
- Write a valid HTML document structure
- Use common tags: headings, paragraphs, links, images, lists
- Understand attributes and nesting

### 2.1 What is HTML?

**HTML (HyperText Markup Language)** is the standard language for creating web pages. It defines the **structure and content** of a page using **tags**.

HTML is NOT a programming language — it is a **markup language**. It tells the browser what to display and how content is structured, but it does not contain logic.

HTML, CSS, and JavaScript work together:
- **HTML** — Structure (the skeleton)
- **CSS** — Style (the appearance)
- **JavaScript** — Behavior (the interactivity)

### 2.2 HTML Document Structure

Every HTML page must have this basic structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My First Web Page</title>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>This is my first web page.</p>
</body>
</html>
```

**What each part does:**
- `<!DOCTYPE html>` — Tells the browser this is an HTML5 document
- `<html>` — Root element of the page
- `<head>` — Contains metadata (not visible on page)
- `<meta charset="UTF-8">` — Character encoding for international text support
- `<title>` — Text shown in the browser tab
- `<body>` — All visible content goes here

### 2.3 HTML Tags and Elements

An HTML element has an opening tag, content, and a closing tag:

```html
<tagname>Content goes here</tagname>
```

Some elements are **self-closing** (they have no content and no closing tag):

```html
<img src="photo.jpg" alt="A photo">
<br>
<hr>
<input type="text">
```

### 2.4 Headings

HTML has six levels of headings, from largest to smallest:

```html
<h1>Main Page Title</h1>
<h2>Section Heading</h2>
<h3>Sub-section</h3>
<h4>Sub-sub-section</h4>
<h5>Small heading</h5>
<h6>Smallest heading</h6>
```

> Note: Use only one `<h1>` per page. It represents the main topic of the page.

### 2.5 Paragraphs and Text

```html
<p>This is a paragraph of text.</p>
<p>This is another paragraph. Browsers add spacing between paragraphs automatically.</p>

<strong>This text is bold.</strong>
<em>This text is italic.</em>

<br>  <!-- Forces a line break within a paragraph -->
<hr>  <!-- Draws a horizontal divider line -->
```

### 2.6 Links

```html
<!-- Link to an external website -->
<a href="https://www.google.com">Visit Google</a>

<!-- Link to another page in the same site -->
<a href="about.html">About Us</a>

<!-- Opens in a new browser tab -->
<a href="https://www.google.com" target="_blank">Google (new tab)</a>
```

The `href` attribute contains the destination URL.

### 2.7 Images

```html
<img src="cat.jpg" alt="A cute cat sitting on a chair" width="300">
```

- `src` — Path to the image file (relative or full URL)
- `alt` — Alternative text shown if image fails to load; required for accessibility
- `width` — Width in pixels (height adjusts proportionally)

### 2.8 Lists

**Unordered list (bullet points):**
```html
<ul>
  <li>HTML</li>
  <li>CSS</li>
  <li>JavaScript</li>
</ul>
```

**Ordered list (numbered):**
```html
<ol>
  <li>Install VS Code</li>
  <li>Create an HTML file</li>
  <li>Open it in the browser</li>
</ol>
```

**Nested list:**
```html
<ul>
  <li>Frontend
    <ul>
      <li>HTML</li>
      <li>CSS</li>
    </ul>
  </li>
  <li>Backend</li>
</ul>
```

### 2.9 HTML Attributes

Attributes provide extra information about an element. They go inside the opening tag:

```html
<element attribute="value">Content</element>
```

Common attributes:

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `id` | Unique identifier (one per page) | `id="main-title"` |
| `class` | Reusable group name for CSS/JS | `class="btn btn-primary"` |
| `src` | Source file path | `src="logo.png"` |
| `href` | Hyperlink destination | `href="page.html"` |
| `alt` | Alternative text for images | `alt="Company logo"` |
| `style` | Inline CSS styles | `style="color: red"` |

### 2.10 Nesting Rules

Elements must be properly nested — close the inner tag before closing the outer:

```html
<!-- Correct -->
<p>Visit <a href="..."><strong>Google</strong></a> now.</p>

<!-- Wrong — overlapping tags break the page -->
<p>Visit <a href="..."><strong>Google</a></strong> now.</p>
```

### Key Takeaways

- HTML defines structure and content — not appearance (that is CSS)
- Every page needs `<!DOCTYPE html>`, `<html>`, `<head>`, and `<body>`
- Tags describe the type of content (heading, paragraph, link, image, list)
- Attributes give extra information to elements
- Always close tags and nest them correctly

### Reference Materials

- YouTube: Learn HTML Full Tutorial (freeCodeCamp) — https://www.youtube.com/watch?v=kUMe1FH4CHE
- W3Schools HTML Introduction — https://www.w3schools.com/html/html_intro.asp
- MDN HTML Basics — https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics

### Quiz

**Question 1:** What does HTML stand for?
- A) Hyper Text Markup Language
- B) High Text Machine Language
- C) Hyperlink and Text Markup Language
- D) Home Tool Markup Language

**Correct Answer:** A — HTML stands for HyperText Markup Language. "HyperText" refers to links between pages, and "Markup" refers to the tags used to annotate content.

**Question 2:** Which HTML tag creates a clickable hyperlink?
- A) `<link>`
- B) `<href>`
- C) `<a>`
- D) `<url>`

**Correct Answer:** C — The `<a>` (anchor) tag creates hyperlinks. The destination is specified in the `href` attribute: `<a href="url">Link Text</a>`.

---

## Topic 3: HTML Forms, Tables, and Semantic HTML

### Learning Objectives
- Build interactive HTML forms with various input types
- Create structured data tables
- Use semantic HTML elements for better page structure
- Understand why semantic HTML matters for accessibility and SEO

### 3.1 HTML Forms

Forms allow users to enter and submit data. A complete form needs a `<form>` container, input elements, and a submit button.

```html
<form action="/submit" method="POST">
  <label for="name">Your Name:</label>
  <input type="text" id="name" name="name" placeholder="Enter name" required>

  <label for="email">Email:</label>
  <input type="email" id="email" name="email" required>

  <label for="password">Password:</label>
  <input type="password" id="password" name="password" required>

  <button type="submit">Register</button>
</form>
```

**Form attributes:**
- `action` — URL where form data is sent on submit
- `method` — `GET` (data visible in URL) or `POST` (hidden, used for passwords and private data)

### 3.2 Common Input Types

```html
<!-- Basic text -->
<input type="text" placeholder="Enter text">

<!-- Email — browser validates format -->
<input type="email" placeholder="you@example.com">

<!-- Password — characters are hidden -->
<input type="password">

<!-- Number with range -->
<input type="number" min="1" max="100">

<!-- Date picker -->
<input type="date">

<!-- Checkbox -->
<input type="checkbox" id="agree" name="agree">
<label for="agree">I agree to the terms</label>

<!-- Radio buttons — only one can be selected -->
<input type="radio" id="male" name="gender" value="male">
<label for="male">Male</label>
<input type="radio" id="female" name="gender" value="female">
<label for="female">Female</label>

<!-- Dropdown -->
<select name="country">
  <option value="pk">Pakistan</option>
  <option value="us">United States</option>
  <option value="uk">United Kingdom</option>
</select>

<!-- Multi-line text -->
<textarea name="message" rows="4" placeholder="Your message here"></textarea>
```

### 3.3 Labels and Accessibility

Always pair `<label>` with each `<input>` using the `for` attribute:

```html
<label for="username">Username:</label>
<input type="text" id="username" name="username">
```

The `for` value must match the input's `id`. This allows:
- Clicking the label to focus the input
- Screen readers to announce what the field is for

### 3.4 HTML Tables

Tables organize data into rows and columns:

```html
<table>
  <thead>
    <tr>
      <th>Student Name</th>
      <th>Grade</th>
      <th>Score</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Ahmed Ali</td>
      <td>A</td>
      <td>92</td>
    </tr>
    <tr>
      <td>Sara Khan</td>
      <td>B+</td>
      <td>87</td>
    </tr>
  </tbody>
</table>
```

**Table tags explained:**

| Tag | Purpose |
|-----|---------|
| `<table>` | The table container |
| `<thead>` | Header section of the table |
| `<tbody>` | Body section of the table |
| `<tr>` | A table row |
| `<th>` | Header cell (bold and centered by default) |
| `<td>` | Data cell |

> Note: Tables should only be used for tabular data, not for page layout.

### 3.5 Semantic HTML

**Semantic elements** describe the meaning of content, not just its appearance:

```html
<!-- Non-semantic approach (unclear) -->
<div id="header">...</div>
<div id="nav">...</div>
<div id="content">...</div>
<div id="footer">...</div>

<!-- Semantic approach (clear purpose) -->
<header>...</header>
<nav>...</nav>
<main>...</main>
<footer>...</footer>
```

**Common semantic elements:**

| Tag | Purpose |
|-----|---------|
| `<header>` | Page or section header (logo, site title) |
| `<nav>` | Navigation menu with links |
| `<main>` | Primary content of the page |
| `<section>` | Thematic group of content |
| `<article>` | Self-contained content (blog post, news item) |
| `<aside>` | Side content (sidebar, related links) |
| `<footer>` | Page or section footer |
| `<figure>` | Image or diagram with caption |
| `<figcaption>` | Caption text for a `<figure>` |

### 3.6 Why Semantic HTML Matters

1. **Accessibility** — Screen readers navigate pages using semantic landmarks, helping visually impaired users
2. **SEO** — Search engines understand content structure better, improving search rankings
3. **Readability** — Other developers can read and understand your code faster
4. **Maintainability** — Easier to update styling for specific sections of the page

### Key Takeaways

- Forms collect user input and send it to a server
- Use `method="POST"` for sensitive data like passwords
- Always pair `<label>` with `<input>` for accessibility
- Use tables for structured data rows and columns — not for page layout
- Semantic HTML improves accessibility, SEO, and code clarity

### Reference Materials

- YouTube: HTML Website Crash Course (freeCodeCamp) — https://www.youtube.com/watch?v=916GWv2Qs08
- W3Schools HTML Forms — https://www.w3schools.com/html/html_forms.asp
- W3Schools HTML Tables — https://www.w3schools.com/html/html_tables.asp
- MDN Semantic Elements — https://developer.mozilla.org/en-US/docs/Glossary/Semantics#semantics_in_html

### Quiz

**Question 1:** Which input type makes the browser automatically validate that the user entered a correctly formatted email address?
- A) `type="text"`
- B) `type="mail"`
- C) `type="email"`
- D) `type="address"`

**Correct Answer:** C — `type="email"` causes the browser to validate the format before allowing form submission. The field must contain an "@" symbol and a domain.

**Question 2:** Which semantic HTML element should wrap the main navigation links of a website?
- A) `<menu>`
- B) `<navbar>`
- C) `<nav>`
- D) `<header>`

**Correct Answer:** C — The `<nav>` element is specifically for navigation links. It improves accessibility (screen readers can jump directly to it) and helps search engines understand site structure.

---

## Topic 4: CSS Basics — Styling Web Pages

### Learning Objectives
- Understand what CSS is and how to apply it to HTML
- Write CSS rules using selectors, properties, and values
- Style text, colors, backgrounds, and borders
- Understand CSS specificity and the cascade

### 4.1 What is CSS?

**CSS (Cascading Style Sheets)** controls the visual appearance of HTML elements — colors, fonts, spacing, layout, and more. Without CSS, every web page would look like a plain text document.

**Three ways to add CSS:**

```html
<!-- 1. External stylesheet (recommended) -->
<link rel="stylesheet" href="styles.css">

<!-- 2. Internal style block (in <head>) -->
<style>
  h1 { color: blue; }
</style>

<!-- 3. Inline styles (avoid for large projects) -->
<h1 style="color: blue;">Hello</h1>
```

Always prefer **external stylesheets** — they separate HTML from CSS and allow one file to style an entire website.

### 4.2 CSS Rule Structure

```css
selector {
  property: value;
  property: value;
}
```

Example:

```css
h1 {
  color: #1d3557;
  font-size: 32px;
  font-weight: bold;
}

p {
  color: #333333;
  font-size: 16px;
  line-height: 1.6;
}
```

### 4.3 CSS Selectors

```css
/* Element selector — targets all <p> tags */
p {
  color: gray;
}

/* Class selector — targets elements with class="highlight" */
.highlight {
  background-color: yellow;
}

/* ID selector — targets element with id="title" */
#title {
  font-size: 28px;
}

/* Multiple selectors at once */
h1, h2, h3 {
  font-family: Arial, sans-serif;
}

/* Descendant — only <a> inside <nav> */
nav a {
  text-decoration: none;
}

/* Hover state */
a:hover {
  color: blue;
  text-decoration: underline;
}
```

### 4.4 Colors

```css
/* Color name */
color: red;
color: darkblue;

/* Hexadecimal (most common) */
color: #ff0000;    /* red */
color: #1d3557;    /* dark navy blue */
color: #ffffff;    /* white */
color: #000000;    /* black */

/* RGB */
color: rgb(255, 0, 0);

/* RGBA (with transparency: 0 = invisible, 1 = fully visible) */
color: rgba(29, 53, 87, 0.5);
```

### 4.5 Text Styling

```css
p {
  font-family: 'Arial', 'Helvetica', sans-serif;
  font-size: 16px;
  font-weight: bold;         /* normal, bold, or 100-900 */
  font-style: italic;
  text-decoration: underline;
  text-align: center;        /* left | right | center | justify */
  line-height: 1.6;          /* vertical spacing between lines */
  letter-spacing: 1px;       /* horizontal spacing between characters */
  text-transform: uppercase; /* lowercase | capitalize */
}
```

### 4.6 Backgrounds

```css
div {
  background-color: #f0f0f0;
  background-image: url('banner.jpg');
  background-size: cover;        /* fill the entire container */
  background-position: center;
  background-repeat: no-repeat;
}
```

### 4.7 Borders

```css
div {
  border: 2px solid #333333;
  border-top: 4px solid #3a86ff;   /* only top border */
  border-radius: 8px;              /* rounded corners */
  outline: 2px dashed red;         /* outline (outside border, no space) */
}
```

### 4.8 CSS Units

| Unit | Description | Best For |
|------|-------------|----------|
| `px` | Fixed pixels | Borders, images, fixed sizes |
| `%` | Relative to parent | Widths, responsive layouts |
| `em` | Relative to parent's font-size | Padding, margins |
| `rem` | Relative to root font-size | Font sizes (consistent) |
| `vw` | % of viewport width | Full-width sections |
| `vh` | % of viewport height | Full-height sections |

### 4.9 The Cascade and Specificity

When multiple rules target the same element, **specificity** determines which one wins:

**Priority order (highest to lowest):**
1. Inline styles (`style="..."`) — always wins
2. ID selectors (`#title`)
3. Class selectors (`.highlight`)
4. Element selectors (`p`, `h1`)

```css
/* All three rules target the same element */
/* <p class="intro" id="first">Hello</p> */

p        { color: gray; }    /* least specific — loses */
.intro   { color: blue; }    /* more specific — overrides p */
#first   { color: green; }   /* most specific — wins */
```

### Key Takeaways

- CSS controls visual appearance — colors, fonts, spacing, layout
- Use external stylesheets to separate CSS from HTML
- A CSS rule has a selector and a block of property-value pairs
- Hex color codes like `#1d3557` are the most common format
- Higher specificity (ID > class > element) wins when rules conflict

### Reference Materials

- YouTube: Learn HTML & CSS Full Course (freeCodeCamp) — https://www.youtube.com/watch?v=a_iQb1lnAEQ
- MDN CSS Basics — https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/CSS_basics
- W3Schools CSS Tutorial — https://www.w3schools.com/css/default.asp

### Quiz

**Question 1:** Which CSS property changes the text color of an element?
- A) `font-color`
- B) `text-color`
- C) `color`
- D) `foreground`

**Correct Answer:** C — The correct property is simply `color`. Properties like `font-color` and `text-color` do not exist in CSS.

**Question 2:** How do you write a CSS selector that targets an element with `id="title"`?
- A) `.title`
- B) `*title`
- C) `title`
- D) `#title`

**Correct Answer:** D — ID selectors use the `#` prefix (`#title`). Class selectors use `.` (`.title`). Element selectors use just the tag name (`p`, `h1`).

---

## Topic 5: CSS Box Model and Layout

### Learning Objectives
- Understand the four layers of the CSS box model
- Use margin, padding, and border correctly
- Apply `box-sizing: border-box` for predictable sizing
- Understand the difference between block and inline elements

### 5.1 The CSS Box Model

Every HTML element on a page is a rectangular box. The box model describes four layers:

```
+-------------------------------------------+
|                  MARGIN                   |
|   +-----------------------------------+   |
|   |              BORDER               |   |
|   |   +-----------------------------+ |   |
|   |   |          PADDING            | |   |
|   |   |   +---------------------+   | |   |
|   |   |   |       CONTENT       |   | |   |
|   |   |   +---------------------+   | |   |
|   |   +-----------------------------+ |   |
|   +-----------------------------------+   |
+-------------------------------------------+
```

- **Content** — The actual text, image, or other content inside the element
- **Padding** — Transparent space between the content and the border (inside the element)
- **Border** — A visible or invisible line around the padding and content
- **Margin** — Transparent space outside the border (between this element and others)

### 5.2 Setting Margin, Padding, and Border

```css
div {
  /* Single value — all four sides */
  padding: 20px;
  margin: 20px;

  /* Two values — vertical (top/bottom) | horizontal (left/right) */
  padding: 10px 20px;
  margin: 10px auto;   /* auto on sides = center horizontally */

  /* Four values — top | right | bottom | left (clockwise) */
  padding: 10px 20px 15px 20px;
  margin: 5px 10px 5px 10px;

  /* Individual sides */
  padding-top: 10px;
  padding-right: 20px;
  padding-bottom: 10px;
  padding-left: 20px;

  /* Border */
  border: 2px solid #333;
  border-radius: 8px;    /* rounded corners */
}
```

### 5.3 Width and Height

```css
div {
  width: 300px;
  height: 200px;
  max-width: 800px;    /* never wider than this */
  min-width: 200px;    /* never narrower than this */
}
```

### 5.4 The box-sizing Problem

By default, `width` only applies to the **content** area. Padding and border are added on top — making the element larger than expected:

```css
/* Default: content-box */
div {
  width: 200px;
  padding: 20px;
  border: 5px solid black;
  /* Actual rendered width = 200 + 20+20 + 5+5 = 250px */
}
```

**Fix with `border-box`:**

```css
div {
  width: 200px;
  padding: 20px;
  border: 5px solid black;
  box-sizing: border-box;
  /* Actual rendered width = exactly 200px */
}
```

**Best practice — apply globally to every element:**

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```

### 5.5 The display Property

The `display` property controls how an element behaves in the page flow:

**Block elements** (`display: block`):
- Start on a new line
- Take the full available width
- You can set width, height, margin, and padding freely
- Default for: `<div>`, `<p>`, `<h1>`–`<h6>`, `<section>`, `<ul>`, `<li>`

**Inline elements** (`display: inline`):
- Flow with the surrounding text — no new line
- Width and height have no effect
- Horizontal margin and padding work; vertical does not
- Default for: `<span>`, `<a>`, `<strong>`, `<em>`, `<img>`

**Inline-block** (`display: inline-block`):
- Flows inline (no new line before or after)
- But width, height, margin, and padding all work fully
- Useful for navigation buttons, icon + text combinations

```css
/* Side-by-side buttons without flexbox */
.btn {
  display: inline-block;
  width: 120px;
  padding: 10px 16px;
  background-color: #3a86ff;
  color: white;
  text-align: center;
  border-radius: 4px;
}
```

### 5.6 Practical Example

```html
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .card {
    width: 300px;
    padding: 20px;
    margin: 16px auto;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #fff;
  }

  .card h2 {
    font-size: 20px;
    margin-bottom: 8px;
    color: #1d3557;
  }

  .card p {
    color: #555;
    line-height: 1.5;
  }
</style>

<div class="card">
  <h2>Card Title</h2>
  <p>This is a simple card component using the box model.</p>
</div>
```

### 5.7 Inspecting the Box Model with DevTools

Open browser Developer Tools with `F12`, click on any element, then look at the **Computed** tab. You will see a color-coded box model diagram showing the exact margin, border, padding, and content dimensions.

### Key Takeaways

- Every element is a box: content + padding + border + margin
- **Padding** is space inside the element; **Margin** is space outside
- Always apply `box-sizing: border-box` globally with `*` selector
- **Block** elements take full width; **inline** elements flow with text
- Use `display: inline-block` when you need inline flow with width/height control
- Use browser DevTools to inspect and debug box model issues

### Reference Materials

- YouTube: CSS Box Model Explained — https://www.youtube.com/watch?v=a_iQb1lnAEQ (3:00:00 mark)
- MDN The Box Model — https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model
- W3Schools CSS Box Model — https://www.w3schools.com/css/css_boxmodel.asp

### Quiz

**Question 1:** In the CSS box model, which layer creates space between the element's content and its border?
- A) margin
- B) padding
- C) border
- D) outline

**Correct Answer:** B — Padding is the space inside the element between the content and the border. Margin is the space outside the border, between this element and neighboring elements.

**Question 2:** What does applying `box-sizing: border-box` to an element do?
- A) Adds a decorative box-style border
- B) Makes the declared width and height include padding and border
- C) Removes all margins from the element
- D) Turns the element into a flex container

**Correct Answer:** B — With `border-box`, the `width` and `height` values include padding and border, so the element stays exactly the size you specify without any surprise extra size.

---

## Topic 6: CSS Flexbox

### Materials to Upload:

**1. YouTube — CSS Flexbox Full Course (freeCodeCamp)**
- Type: YouTube Link
- URL: https://www.youtube.com/watch?v=H9PqIPqJvJg
- What it covers: flex container vs flex items, flex-direction, justify-content, align-items, flex-wrap, flex-grow, order

**2. MDN Web Docs — Flexbox**
- Type: Link / PDF
- URL: https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox
- What it covers: Complete flexbox guide with diagrams — axes, alignment, shorthand properties

**3. W3Schools — CSS Flexbox**
- Type: Link
- URL: https://www.w3schools.com/css/css3_flexbox.asp
- What it covers: Interactive examples for every flexbox property with live preview

### Quiz

**Question 1:** Which CSS declaration turns a container into a flex container?
- A) `display: grid`
- B) `display: flex`
- C) `flex: 1`
- D) `position: flex`

**Correct Answer:** B

**Question 2:** Which flexbox property aligns items along the main axis (horizontally by default)?
- A) `align-items`
- B) `align-content`
- C) `justify-content`
- D) `flex-direction`

**Correct Answer:** C

---

## Topic 7: CSS Grid

### Materials to Upload:

**1. YouTube — CSS Grid Crash Course (freeCodeCamp)**
- Type: YouTube Link
- URL: https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88
- What it covers: grid-template-columns, grid-template-rows, gap, grid areas, auto-fill/auto-fit

**2. MDN Web Docs — CSS Grid Layout**
- Type: Link / PDF
- URL: https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Grids
- What it covers: Defining a grid, line-based placement, named areas, implicit vs explicit grid

**3. W3Schools — CSS Grid**
- Type: Link
- URL: https://www.w3schools.com/css/css_grid.asp
- What it covers: Grid container and item properties with live examples

### Quiz

**Question 1:** Which CSS property defines the number and size of columns in a grid layout?
- A) `grid-columns`
- B) `column-template`
- C) `grid-template-columns`
- D) `grid-size`

**Correct Answer:** C

**Question 2:** What does the `gap` property control in a CSS grid?
- A) The number of columns
- B) The space between grid cells
- C) The alignment of grid items
- D) The size of the grid container

**Correct Answer:** B

---

## Topic 8: JavaScript Basics

### Materials to Upload:

**1. YouTube — Learn HTML5, CSS3, and JavaScript (freeCodeCamp)**
- Type: YouTube Link
- URL: https://www.youtube.com/watch?v=mU6anWqZJcc
- What it covers: JavaScript variables, data types, operators, conditionals, loops, functions, arrays, objects

**2. YouTube — Modern JavaScript From The Beginning (Traversy Media)**
- Type: YouTube Link
- URL: https://www.youtube.com/watch?v=BI1o2H9z9fo
- What it covers: var/let/const, arrow functions, template literals, destructuring, modules

**3. MDN Web Docs — JavaScript Basics**
- Type: Link / PDF
- URL: https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/JavaScript_basics
- What it covers: Variables, operators, conditionals, functions, events

**4. W3Schools — JavaScript Tutorial**
- Type: Link
- URL: https://www.w3schools.com/js/default.asp
- What it covers: Full JS reference with try-it examples for every concept

### Quiz

**Question 1:** Which keyword declares a variable that cannot be reassigned in JavaScript?
- A) `var`
- B) `let`
- C) `const`
- D) `static`

**Correct Answer:** C

**Question 2:** What does `typeof "hello"` return in JavaScript?
- A) `text`
- B) `string`
- C) `char`
- D) `word`

**Correct Answer:** B

---

## Topic 9: JavaScript and the DOM

### Materials to Upload:

**1. YouTube — JavaScript DOM Manipulation (freeCodeCamp)**
- Type: YouTube Link
- URL: https://www.youtube.com/watch?v=5fb2aPlgoys
- What it covers: Selecting elements, changing content and styles, click events, creating and removing elements

**2. MDN Web Docs — Introduction to the DOM**
- Type: Link / PDF
- URL: https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction
- What it covers: What the DOM is, DOM tree structure, node types, JS interacting with HTML

**3. W3Schools — JavaScript HTML DOM**
- Type: Link
- URL: https://www.w3schools.com/js/js_htmldom.asp
- What it covers: DOM methods, changing HTML content and attributes, event listeners

### Quiz

**Question 1:** Which JavaScript method selects the first element matching a CSS selector?
- A) `getElementById()`
- B) `getElementByClass()`
- C) `querySelector()`
- D) `findElement()`

**Correct Answer:** C

**Question 2:** Which event fires when a user clicks on an HTML element?
- A) `onhover`
- B) `onpress`
- C) `click`
- D) `ontap`

**Correct Answer:** C

---

## Topic 10: Responsive Web Design

### Materials to Upload:

**1. YouTube — Responsive Web Design Full Course (freeCodeCamp)**
- Type: YouTube Link
- URL: https://www.youtube.com/playlist?list=PLZgPFBGZXT2qrmC9154S5cXts1qG1Kbnn
- What it covers: Media queries, mobile-first design, viewport meta tag, responsive images

**2. web.dev by Google — Responsive Design Basics**
- Type: Link / PDF
- URL: https://web.dev/articles/responsive-web-design-basics
- What it covers: Setting the viewport, CSS media queries, breakpoints, flexbox/grid for responsive layouts

**3. MDN Web Docs — Responsive Design**
- Type: Link / PDF
- URL: https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design
- What it covers: Media queries, fluid grids, responsive images, breakpoints guide

### Quiz

**Question 1:** Which HTML meta tag is required to enable responsive design on mobile devices?
- A) `<meta name="mobile" content="yes">`
- B) `<meta name="viewport" content="width=device-width, initial-scale=1">`
- C) `<meta name="responsive" content="true">`
- D) `<meta name="screen" content="fluid">`

**Correct Answer:** B

**Question 2:** Which CSS feature applies different styles based on screen size?
- A) CSS Variables
- B) CSS Animations
- C) Media Queries
- D) CSS Transforms

**Correct Answer:** C

---

## Topic 11: Project — Build Your Personal Webpage

### Materials to Upload:

**1. YouTube — Build and Deploy a Portfolio Website (freeCodeCamp)**
- Type: YouTube Link
- URL: https://www.youtube.com/watch?v=916GWv2Qs08
- What it covers: Complete project — HTML structure, CSS styling, responsive layout, GitHub Pages deployment

**2. MDN Web Docs — Getting Started with the Web**
- Type: Link / PDF
- URL: https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web
- What it covers: Building a complete webpage: file structure, HTML, CSS, JavaScript together

**3. web.dev — Learn Web Development**
- Type: Link
- URL: https://web.dev/learn
- What it covers: Full structured learning path — HTML, CSS, JavaScript, forms, images — all free by Google

### Quiz

**Question 1:** Which free platform can you use to host and deploy a static website online?
- A) MySQL
- B) GitHub Pages
- C) Node.js
- D) MongoDB

**Correct Answer:** B

**Question 2:** What is the correct order for building a webpage from scratch?
- A) JavaScript -> CSS -> HTML
- B) CSS -> HTML -> JavaScript
- C) HTML -> CSS -> JavaScript
- D) JavaScript -> HTML -> CSS

**Correct Answer:** C

---

## All Sources Summary

| Topic | Source | Type | URL |
|-------|--------|------|-----|
| 1 | How The Web Works - Big Picture | YouTube | https://www.youtube.com/watch?v=hJHvdBlSxug |
| 1 | How the Web Works: Internet vs WWW | YouTube | https://www.youtube.com/watch?v=-pKW2Ju12NA |
| 1 | MDN - How the Web Works | Link | https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_the_Web_works |
| 2 | Learn HTML Full Tutorial (freeCodeCamp) | YouTube | https://www.youtube.com/watch?v=kUMe1FH4CHE |
| 2 | W3Schools HTML Intro | Link | https://www.w3schools.com/html/html_intro.asp |
| 2 | MDN HTML Basics | Link | https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics |
| 3 | HTML Website Crash Course (freeCodeCamp) | YouTube | https://www.youtube.com/watch?v=916GWv2Qs08 |
| 3 | W3Schools HTML Forms | Link | https://www.w3schools.com/html/html_forms.asp |
| 3 | W3Schools HTML Tables | Link | https://www.w3schools.com/html/html_tables.asp |
| 4 | Learn HTML & CSS Full Course (freeCodeCamp) | YouTube | https://www.youtube.com/watch?v=a_iQb1lnAEQ |
| 4 | MDN CSS Basics | Link | https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/CSS_basics |
| 4 | W3Schools CSS Tutorial | Link | https://www.w3schools.com/css/default.asp |
| 5 | MDN The Box Model | Link | https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model |
| 5 | W3Schools CSS Box Model | Link | https://www.w3schools.com/css/css_boxmodel.asp |
| 6 | CSS Flexbox freeCodeCamp | YouTube | https://www.youtube.com/watch?v=H9PqIPqJvJg |
| 6 | MDN Flexbox | Link | https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox |
| 6 | W3Schools Flexbox | Link | https://www.w3schools.com/css/css3_flexbox.asp |
| 7 | freeCodeCamp HTML & CSS Playlist | YouTube | https://www.youtube.com/playlist?list=PLWKjhJtqVAbnSe1qUNMG7AbPmjIG54u88 |
| 7 | MDN CSS Grid | Link | https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Grids |
| 7 | W3Schools CSS Grid | Link | https://www.w3schools.com/css/css_grid.asp |
| 8 | Learn HTML5/CSS3/JS (freeCodeCamp) | YouTube | https://www.youtube.com/watch?v=mU6anWqZJcc |
| 8 | Modern JavaScript (Traversy Media) | YouTube | https://www.youtube.com/watch?v=BI1o2H9z9fo |
| 8 | MDN JavaScript Basics | Link | https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/JavaScript_basics |
| 8 | W3Schools JavaScript | Link | https://www.w3schools.com/js/default.asp |
| 9 | JS DOM Manipulation (freeCodeCamp) | YouTube | https://www.youtube.com/watch?v=5fb2aPlgoys |
| 9 | MDN DOM Introduction | Link | https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction |
| 9 | W3Schools JS HTML DOM | Link | https://www.w3schools.com/js/js_htmldom.asp |
| 10 | Responsive Web Design Playlist (freeCodeCamp) | YouTube | https://www.youtube.com/playlist?list=PLZgPFBGZXT2qrmC9154S5cXts1qG1Kbnn |
| 10 | web.dev Responsive Design Basics | Link | https://web.dev/articles/responsive-web-design-basics |
| 10 | MDN Responsive Design | Link | https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design |
| 11 | Build Portfolio Website (freeCodeCamp) | YouTube | https://www.youtube.com/watch?v=916GWv2Qs08 |
| 11 | MDN Getting Started with the Web | Link | https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web |
| 11 | web.dev Learn Web Development | Link | https://web.dev/learn |
