# SkillSphere — Changes Log

> **Purpose:** Full record of every feature built, bug fixed, and architectural decision made during development sessions. Includes what was done, which files were touched, and why each change was made.

---

## Table of Contents

1. [Database Auto-Schema Sync](#1-database-auto-schema-sync)
2. [Real-Time Notifications (SSE)](#2-real-time-notifications-sse)
3. [Discussion Forum](#3-discussion-forum)
4. [Profanity Filter + Auto-Suspend](#4-profanity-filter--auto-suspend)
5. [Course Prerequisites](#5-course-prerequisites)
6. [Rate Limiting](#6-rate-limiting)
7. [Pagination on List Endpoints](#7-pagination-on-list-endpoints)
8. [CSV Export Fix](#8-csv-export-fix)
9. [Email Delivery Fix](#9-email-delivery-fix)
10. [AI Chat Screen](#10-ai-chat-screen)
11. [Certificate Preview Screen](#11-certificate-preview-screen)
12. [Certificate Public Verification](#12-certificate-public-verification)
13. [UI Header Standardization](#13-ui-header-standardization)
14. [Pending / Not Yet Implemented](#14-pending--not-yet-implemented)

---

## 1. Database Auto-Schema Sync

**Why:** Every time a new column was added to a model, the database tables did not update automatically. Developers had to manually run `DROP TABLE` or write a migration script. This caused `Unknown column` errors in production and during development.

**What changed:**
- `backend/server.js` — changed `sequelize.sync()` to `sequelize.sync({ alter: true })`

**Effect:** On every server restart Sequelize compares the current model definitions against the live database schema and adds any missing columns automatically. Existing data is preserved. No manual migration scripts needed for additive changes.

**Trade-off:** `alter: true` is intentionally slower than `sync()` but safe for development and small-scale production. For destructive changes (rename/remove columns) a manual migration is still required.

---

## 2. Real-Time Notifications (SSE)

**Why:** The original notification system wrote records to the database but the frontend had to poll (repeatedly call the API) to see new notifications. This wasted bandwidth and added unnecessary delay. Students and instructors needed to see alerts (enrollment confirmations, course updates, certificate issued) instantly.

**What changed:**
- `backend/controllers/notificationController.js` — added `streamNotifications` endpoint using Server-Sent Events (SSE). The endpoint holds the HTTP connection open and pushes events as they arrive.
- `backend/controllers/notificationController.js` — added `pushToUser(userId, eventData)` helper function. Other controllers call this whenever they create a notification record, so the event is both saved to DB and pushed live simultaneously.
- `sseClients` — in-memory `Map` keyed by userId. Each connected browser tab is one entry. When a user opens the app they connect once; the SSE stream keeps them live.
- Route: `GET /api/notifications/stream`

**How it works:**
1. Frontend connects to `/api/notifications/stream` on login.
2. Server registers the response object in `sseClients`.
3. Any controller that creates a `Notification` also calls `pushToUser()`.
4. The message is written to the SSE stream immediately — no polling needed.
5. A heartbeat ping every 30 seconds keeps the connection alive through proxies.

---

## 3. Discussion Forum

**Why:** Students had no way to ask questions, share ideas, or discuss course material with each other or with the instructor. A per-course threaded forum was identified as a core social learning feature.

### Backend

**New files:**
- `backend/models/DiscussionPost.js` — model with fields: `courseId`, `topicId` (optional), `userId`, `content`, `parentId` (for replies, `null` = top-level post), `isPinned`, `isDeleted`
- `backend/controllers/discussionController.js` — CRUD for posts and replies
- `backend/routes/discussionRoutes.js` — mounted at `/api/discussions`

**Key routes:**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/discussions/:courseId` | Get all top-level posts for a course |
| GET | `/api/discussions/:courseId/:postId/replies` | Get replies to a post |
| POST | `/api/discussions/:courseId` | Create a new post |
| POST | `/api/discussions/:courseId/:postId/replies` | Reply to a post |
| DELETE | `/api/discussions/:postId` | Delete own post (or admin/instructor can delete any) |
| PATCH | `/api/discussions/:postId/pin` | Pin a post (instructor/admin only) |

### Frontend

**New files:**
- `AppAndroidSS/src/screens/student/DiscussionScreen.js` — lists all posts for the current course. Uses the `pageHeaderBanner` pattern (orange-tinted header with back button and icon). Has student sidebar, logout, and dark mode support.
- `AppAndroidSS/src/screens/student/DiscussionThreadScreen.js` — shows a single post and its full reply chain. Same header pattern. Allows students to reply.

**Wiring:** Both screens are reachable from the `CourseDetailScreen` via a "Discussion" button.

---

## 4. Profanity Filter + Auto-Suspend

**Why:** The discussion forum is open to all students. Without moderation, users could post offensive content. Manual moderation is not scalable. An automatic filter that blocks the message and suspends the account on first offence was chosen as a deterrent.

**Design decision:** The word list is kept out of version control and source-readable files intentionally. Only the detection method is visible in code. This prevents users from reading the source to find exactly what is and is not blocked.

**What changed:**
- `backend/utils/profanityFilter.js` — word list compiled as a single regex with word-boundary anchors (`\b`). Exports a single function `detectProfanity(text)` that returns the matched word or `null`.
- `backend/controllers/discussionController.js` — `createPost` checks content before saving. If a match is found: the post is rejected with HTTP 403, and the offending user's `isActive` is set to `false` (account suspended). The response includes `{ blocked: true }` so the frontend can handle it.
- `AppAndroidSS/src/screens/student/DiscussionScreen.js` — on `blocked: true` response, shows a Toast error and automatically calls `logout()` after 2 seconds so the suspended user is immediately signed out.
- `AppAndroidSS/src/screens/student/DiscussionThreadScreen.js` — same logout-on-block behaviour in the reply flow.

---

## 5. Course Prerequisites

**Why:** The platform had no course dependency system. An advanced course could be taken by a complete beginner with no background. Prerequisites enforce a learning path: students must complete Course A before enrolling in Course B.

### Backend

**Model change:**
- `Course` model — added `prerequisiteIds` column (`JSON` type, default `[]`). Stores an array of course IDs that must be 100% completed before enrollment is allowed.

**Controller changes:**
- `backend/controllers/courseController.js`:
  - `createCourse` — accepts `prerequisiteIds` array in request body, saves to the course record.
  - `updateCourse` — same; existing courses can have prerequisites added or changed.
  - `setPrerequisites` — dedicated `PATCH /api/courses/:id/prerequisites` endpoint.

- `backend/controllers/enrollmentController.js`:
  - `enrollInCourse` — before creating the enrollment record, checks that all courses in `course.prerequisiteIds` have a matching enrollment with `progressPercentage = 100` for that student.
  - If any prerequisite is incomplete, returns HTTP 400 with a list of the missing courses.
  - **Bug fixed:** original code used `progress` in the Sequelize WHERE clause. The actual column name is `progressPercentage`. This caused `ER_BAD_FIELD_ERROR: Unknown column 'Enrollment.progress'`. Fixed by using the correct field name.

### Frontend

**CreateCourseScreen (`AppAndroidSS/src/screens/instructor/CreateCourseScreen.js`):**
- Added a "Prerequisites" field — a multi-select modal dropdown (not a plain text input).
- The dropdown only shows courses in the **same category** as the course being created. Choosing a cross-category prerequisite would be nonsensical (e.g., a Python course should not require a Music Theory course).
- Filtering logic: `courses.filter(c => c.id !== courseId && c.category?.name === category)`
- Changing the category clears previously selected prerequisites automatically.
- The selected prerequisite IDs are included in the course creation/update payload.

**CourseDetailScreen (`AppAndroidSS/src/screens/student/CourseDetailScreen.js`):**
- Added a prerequisites card that lists each required course with a visual indicator:
  - Green dot — student has completed this prerequisite (progress = 100%).
  - Amber dot — prerequisite not yet completed.
- Each prerequisite row is tappable and navigates to that course's detail page so the student can enroll and work through it.

**EnrolledCoursesScreen / Enrollment flow:**
- Frontend now shows prerequisite courses on the enrollment screen so students understand what they need to complete first before they can enroll.

---

## 6. Rate Limiting

**Why:** With no rate limiting, anyone could:
- Brute-force the login endpoint (try thousands of password combinations).
- Spam OTP endpoints (generate hundreds of codes, drain email quota).
- Abuse AI endpoints (every request calls OpenAI, which costs real money per token).

**Package installed:** `express-rate-limit` v8.3.2

**New file:** `backend/middleware/rateLimiter.js`

Three limiters are defined:

| Limiter | Window | Max requests | Applied to |
|---------|--------|-------------|-----------|
| `authLimiter` | 15 minutes | 10 | login, register, all OTP routes, forgot/reset password |
| `aiLimiter` | 1 minute | 20 | AI Chat, AI Tutor, Lecture Chat |
| `generalLimiter` | 1 minute | 100 | Available for future use on any route |

All limiters return `429 Too Many Requests` with a plain JSON error message when the limit is exceeded. They are skipped entirely in `NODE_ENV=test` to avoid interfering with automated tests.

**Files changed:**
- `backend/routes/authRoutes.js` — `authLimiter` applied per-route to all sensitive auth endpoints.
- `backend/routes/aiChatRoutes.js` — `aiLimiter` applied via `router.use()` (covers all routes in the file).
- `backend/routes/aiTutorRoutes.js` — same.
- `backend/routes/lectureChatRoutes.js` — same.

---

## 7. Pagination on List Endpoints

**Why:** Every list endpoint returned the entire database table in a single HTTP response. With real usage (hundreds of courses, thousands of students, thousands of notifications) this would:
- Cause slow page loads.
- Consume excessive memory on the server.
- Transfer large payloads to mobile clients on slow connections.

**Approach:** Optional query parameters (`page`, `limit`, and filters) with sensible defaults. All existing clients continue to work because the `courses`/`students`/`notifications` array is still in the response — extra `total`, `page`, `totalPages` fields are additive.

### `GET /api/courses`

**File:** `backend/controllers/courseController.js` — `getAllCourses`

| Param | Default | Max | Description |
|-------|---------|-----|-------------|
| `page` | 1 | — | Page number |
| `limit` | 100 | 200 | Results per page |
| `search` | — | — | Filter by name or description (LIKE) |
| `category` | — | — | Filter by category name |
| `level` | — | — | Filter by level (Beginner/Intermediate/Advanced) |
| `sort` | newest | — | newest, oldest, name-asc, name-desc, popular |

Uses `findAndCountAll` with `distinct: true`. Popularity sort (by enrollment count) is applied after the DB query because enrollment counts require a separate COUNT query.

### `GET /api/users/students`

**File:** `backend/controllers/userController.js` — `getAllStudents`

| Param | Default | Max | Description |
|-------|---------|-----|-------------|
| `page` | 1 | — | Page number |
| `limit` | 50 | 100 | Results per page |
| `search` | — | — | Filter by name or email (LIKE) |

Pagination respects existing RBAC: admins see all students; instructors without `canManageStudents` permission only see students enrolled in their own courses.

### `GET /api/notifications/my`

**File:** `backend/controllers/notificationController.js` — `getMyNotifications`

| Param | Default | Max | Description |
|-------|---------|-----|-------------|
| `page` | 1 | — | Page number |
| `limit` | 20 | 100 | Results per page |
| `unreadOnly` | false | — | If `true`, only unread notifications |

### Frontend (`AppAndroidSS/src/services/apiClient.js`)

- `courseAPI.getAll(params)` — now accepts `{ page, limit, search, category, level, sort }` and builds a query string.
- `userAPI.getStudents(params)` — now accepts `{ page, limit, search }`.
- `notificationAPI.getMyNotifications(unreadOnly, page, limit)` — defaults fetch 50 notifications at a time (was unlimited).

---

## 8. CSV Export Fix

**Why:** The student CSV export endpoint was returning 403 Forbidden for instructors. The route had `requireAdmin` middleware applied twice — once at the router level and once on the specific route. Instructors have a legitimate need to export their student lists for record-keeping.

**What changed:**
- `backend/routes/userRoutes.js` — removed the redundant `requireAdmin` middleware from the `/export/csv` route. The route is now accessible to any authenticated user with appropriate role permissions.

---

## 9. Email Delivery Fix

**Background:** The system uses Brevo (formerly Sendinblue) to send transactional emails (OTP codes, certificates, welcome emails). Email is sent via the Brevo HTTP API using `skillspherefyp@gmail.com` as the sender address.

**What broke:** A change was made to set `SMTP_FROM_EMAIL` to `bcs223076@cust.pk` (a university email address that was not a verified sender in Brevo). Brevo rejected all outgoing email because the FROM address was not whitelisted in the account.

**Root cause of the underlying problem:** Using a Gmail address as the FROM address via a third-party relay (Brevo) triggers Gmail DMARC policy rejection when sending TO Gmail addresses. The correct long-term fix is to use a custom domain email (`noreply@skillsphere.com.pk`) verified in Brevo. This requires setting up the domain on cPanel first.

**What was done:**
- `backend/services/emailService.js` — reverted `SMTP_FROM_EMAIL` to empty, restoring the `|| 'skillspherefyp@gmail.com'` fallback that was working before.
- Email delivery confirmed working after revert.
- The correct cPanel domain email fix is documented in `PENDING_CHANGES.md` with step-by-step instructions for when the domain is ready.

---

## 10. AI Chat Screen

**Why:** Students needed a general-purpose AI assistant within the app — not tied to a specific course or topic. The AI Tutor is structured (chunks, slides, quizzes) but sometimes a student just wants to ask a question.

**What exists:**
- `AppAndroidSS/src/screens/student/AIChatScreen.js` — full chat UI with session management, message history, and streaming-style responses.
- Backend: `POST /api/ai-chat/sessions/:id/messages` calls OpenAI and returns a response.
- Sessions are persisted in the `AIChatSession` model so conversation history survives app restarts.

---

## 11. Certificate Preview Screen

**Why:** Students needed to view and download their completion certificates from within the app.

**What exists:**
- `AppAndroidSS/src/screens/student/CertificatePreviewScreen.js` — renders the certificate PDF in a WebView, with download and share options.
- Backend: `GET /api/certificates/my` returns all certificates for the authenticated student. `GET /api/certificates/:id/download` streams the PDF.
- Certificate generation is automatic: when a student's `progressPercentage` reaches 100 on any course, `certificateService.js` generates a PDF using `@react-pdf/renderer` and saves it via Cloudinary.

---

## 12. Certificate Public Verification

**Why:** Employers and institutions need to verify that a certificate is genuine without requiring a login.

**What exists (backend only):**
- `GET /api/certificates/verify/:certificateNumber` — fully public endpoint, no auth required. Returns certificate holder name, course name, issue date, and validity status.

**What is still missing (frontend):**
- A public-facing verification page that any browser can open.
- A QR code printed on the certificate PDF that links to the verification URL.
- These are documented in `PENDING_CHANGES.md`.

---

## 13. UI Header Standardization

**Why:** Different screens across the app used inconsistent header styles — some had plain text titles, some had custom-colored bars, some had no back button. This created a disjointed look.

**Standard pattern established (`pageHeaderBanner`):**
- Orange-tinted gradient/color banner at the top of each screen.
- Rounded bottom corners.
- Back button (chevron-left) on the left.
- Screen title centered.
- Icon circle on the right (decorative, screen-specific icon).

**Screens updated to match this standard:**
- `AppAndroidSS/src/screens/student/DiscussionScreen.js`
- `AppAndroidSS/src/screens/student/DiscussionThreadScreen.js`

All other screens in the student and instructor flows already use this pattern or a close equivalent. The goal is visual consistency across the entire app.

---

## 14. Pending / Not Yet Implemented

These are known gaps. See `PENDING_CHANGES.md` for implementation details.

| Feature | Status | Notes |
|---------|--------|-------|
| Switch email to cPanel domain (`noreply@skillsphere.com.pk`) | Documented, not implemented | Requires domain DNS + cPanel email account first |
| Certificate QR code + public verification page | Backend done, frontend missing | See `BACKEND_POTENTIAL_ANALYSIS.md` §1.8 |
| Student course ratings & reviews | Not started | `CourseReview` model + routes needed |
| Voice mode in AI Tutor | Backend done, frontend missing | TTS/STT endpoints exist, never called from frontend |
| AI course recommendations | Not started | Infrastructure ready (OpenAI service + enrollment data) |
| Read-aloud button on AI chat responses | Not started | TTS endpoint exists, never wired to chat UI |
| Persistent background job queue (Bull + Redis) | Not started | Current AI generation uses in-memory Map; lost on restart |
| Full-text search inside course materials | Not started | `Material.extractedText` field exists with content |

---

*Last updated: 2026-04-09*
