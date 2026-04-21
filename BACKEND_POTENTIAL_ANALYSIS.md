# SkillSphere Backend — Potential \& Gap Analysis

> \*\*Purpose:\*\* Internal team reference. Documents backend capabilities that are built but not fully surfaced in the frontend, and features that are entirely missing. Use this to prioritize the next development sprint.

\---

## Section 1 — Built But Not Fully Used

These features exist in the backend (routes, controllers, models, services) but have no or incomplete frontend integration.

\---

### 1.1 Voice Mode in AI Tutor

**What exists:**

* `AITutorSession.voiceModeEnabled` field on the session model
* TTS endpoint: `POST /api/ai-tutor/audio/speak` — generates MP3 audio from text
* STT endpoint: `POST /api/ai-tutor/audio/transcribe` — transcribes audio via OpenAI Whisper
* `AIAudioAsset` model with caching (avoids re-generating the same TTS audio)

**What's missing:**

* No end-to-end voice conversation loop in the AI Tutor screen
* The AI could read each lecture chunk aloud and listen to student voice responses
* `voiceModeEnabled` is never toggled from the frontend

\---

### 1.2 AI Tutor + AI Chat Are Disconnected

**What exists:**

* `POST /api/ai-chat/sessions/:id/messages` — free-form general AI chat
* `POST /api/ai-tutor/topics/:topicId/start` — structured tutor session (chunks, slides, flashcards, quizzes)

**What's missing:**

* No bridge between the two. A student in the chat screen cannot say "teach me Topic X" and be routed into a structured AI Tutor session.
* The two AI systems operate in silos with no cross-reference.

\---

### 1.3 TTS Read-Aloud on Chat Responses

**What exists:**

* `openaiService.generateSpeech(text)` — fully functional
* `POST /api/ai-tutor/audio/speak` — returns audio URL

**What's missing:**

* The AI Chat screen (`AIChatScreen.js`) never calls the TTS endpoint
* Every AI message could have a "Read aloud" / play button — infrastructure is 100% ready

\---

### 1.4 Lecture Chat (`/api/lecture-chat`)

**What exists:**

* `GET /api/lecture-chat/:courseId/:topicId` — fetch chat history for a lecture
* `POST /api/lecture-chat/:courseId/:topicId/messages` — send a context-aware question during a lecture
* `DELETE /api/lecture-chat/:courseId/:topicId` — clear history
* `LectureChatMessage` model in the database

**What's missing:**

* Unclear if the frontend material viewer actually calls these endpoints
* If not wired up, this is effectively dead code

\---

### 1.5 AI Student Progress Model

**What exists:**

* `AIStudentProgress` model tracks: completion percentage, last session, unlocked next topic — per student per lecture

**What's missing:**

* No student-facing analytics screen showing AI tutor progress
* No expert-facing view of how students are performing through AI tutor sessions

\---

### 1.6 `canViewFeedback` Permission

**What exists:**

* `canViewFeedback` is defined in the permissions system and middleware

**What's missing:**

* The feedback controller does not enforce this permission — it's checked nowhere in the feedback routes
* The permission exists but does nothing at runtime

\---

### 1.7 Material PDF Text Extraction

**What exists:**

* `Material.extractedText` field — text is async-extracted from uploaded PDFs and stored
* This text is fed to AI for lecture generation context

**What's missing:**

* No search over extracted text
* A "search inside course materials" feature requires zero new backend infrastructure — just a query endpoint

\---

### 1.8 Certificate Public Verification

**What exists:**

* `GET /api/certificates/verify/:certificateNumber` — fully public endpoint, no auth required

**What's missing:**

* No public-facing verification page in the frontend
* No QR code on the certificate PDF linking to the verification URL
* LinkedIn share structured data (JSON-LD) not implemented

\---

## Section 2 — Missing Features (Require New Code)

These do not exist in the backend and would need to be built.

\---

### 2.1 Search \& Filtering on Courses

**Current state:** `GET /api/courses` returns all courses with no filters.

**Missing:**

* Full-text search by course name, description, or material content
* Filter by: category, level, language, duration range, creation mode (ai/manual)
* Sort by: enrollment count, newest, rating (once ratings exist)

\---

### 2.2 Pagination Across All List Endpoints

**Current state:** Every list endpoint returns the full dataset in a single response.

**Affected endpoints:**

* `GET /api/courses`
* `GET /api/ai-chat/sessions`
* `GET /api/ai-chat/sessions/:id` (messages)
* `GET /api/users/students`
* `GET /api/enrollments/my`
* `GET /api/notifications/my`
* `GET /api/todos/my`
* All quiz results, progress records, etc.

**Risk:** Will break under real traffic with large datasets.

\---

### 2.3 Rate Limiting

**Current state:** Zero rate limiting on any endpoint.

**High-risk endpoints:**

* `POST /api/ai-chat/sessions/:id/messages` — each call hits OpenAI API (costs money)
* `POST /api/ai-tutor/courses/:courseId/generate` — expensive long-running OpenAI job
* `POST /api/auth/login` — brute-force risk
* `POST /api/auth/send-otp` — OTP spam risk

\---

### 2.4 Student Course Ratings \& Reviews

**Current state:** `Feedback` model exists but is expert-submitted internal feedback only. Students cannot rate or review courses.

**Missing:**

* `CourseReview` model (student, course, rating 1–5, comment, date)
* `POST /api/courses/:id/reviews` — submit review (enrolled students only)
* `GET /api/courses/:id/reviews` — public listing
* Aggregate rating on Course model

\---

\---

### 2.6 Discussion / Forum per Course

**Current state:** No student-to-student or student-to-expert communication per course.

**Missing:**

* `DiscussionPost` model (courseId, topicId, userId, content, parentId for threads)
* CRUD endpoints for posts and replies
* Expert ability to pin/respond to posts

\---

### 2.7 Course Prerequisites

**Current state:** No dependency system between courses or topics.

**Missing:**

* `Course.prerequisiteCourseIds` (JSON array) or a join table
* Enrollment blocked until prerequisites are met
* Frontend prerequisite display on course detail page

\---

\---

### 2.9 Bulk instructor Operations

**Current state:** All admin actions are per-record only.

**Missing:**

* Bulk-delete users
* Bulk-enroll students into a course
* Bulk-publish/unpublish courses
* CSV/Excel export for: enrollments, quiz results, certificate records, user lists

\---

### 2.10 Real-Time Notifications (WebSocket / SSE)

**Current state:** Notifications are written to DB and require REST polling to appear in the frontend.

**Missing:**

* WebSocket or Server-Sent Events for live notification delivery
* Real-time AI generation progress updates (instead of polling `/generate-status`)
* Live chat indicators

\---

### 2.11 AI-Powered Course Recommendations

**Current state:** `openaiService` is fully set up. Student enrollment history and progress are tracked.

**Missing:**

* `POST /api/courses/recommendations` — takes student context, returns suggested courses
* Could use OpenAI with student profile data as context
* Minimal new backend work given the AI service already exists

\---

### 2.12 Password Reset Frontend Flow

**Current state:** `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` are fully built on the backend.

**Missing (verify in frontend):**

* Forgot password screen
* OTP entry screen
* New password entry screen

\---

## Section 3 — Architectural Gaps

These are infrastructure-level issues that will cause problems at scale.

|#|Gap|Current State|Risk|
|-|-|-|-|
|1|**No pagination**|Full datasets returned always|Memory + latency at scale|
|2|**No rate limiting**|Open endpoints|AI cost abuse, brute force|
|3|**Local file storage**|Uploads saved to server disk|Files lost on redeploy/restart|
|4|**In-memory job tracker**|AI generation uses a JS `Map`|Jobs lost on server restart|
|5|**No WebSockets**|Polling only for notifications + generation status|Poor UX, unnecessary load|
|6|**No search index**|No full-text search anywhere|Can't scale course/material discovery|
|7|**No caching layer**|Every request hits MySQL|Slow repeated reads|

### Recommended Fixes

|Gap|Solution|
|-|-|
|File storage|Re-enable Cloudinary (config already exists in `config/cloudinary.js`)|
|Background jobs|Replace in-memory `Map` with Bull/BullMQ + Redis|
|Caching|Add Redis cache for course listings, lecture packages|
|Rate limiting|Add `express-rate-limit` middleware per route group|
|WebSockets|Add `socket.io` for notifications and generation progress|

\---

## Section 4 — Priority Recommendation

|Priority|Feature|Effort|Impact|
|-|-|-|-|
|P0|Pagination on all list endpoints|Low|Critical|
|P0|Rate limiting on AI + auth endpoints|Low|Critical|
|P0|Switch file storage back to Cloudinary|Low|Critical|
|P1|Student course ratings \& reviews|Medium|High|
|P1|Expert analytics dashboard|Medium|High|
|P1|TTS read-aloud button on AI chat responses|Low|High|
|P1|Certificate QR code + public verification page|Medium|High|
|P2|Real-time notifications (WebSocket)|Medium|Medium|
|P2|Persistent background job queue (Bull+Redis)|Medium|Medium|
|P2|AI course recommendations|Low|Medium|
|P2|Course search \& filtering|Medium|Medium|
|P3|Discussion forum per course|High|Medium|
|P3|Drip content scheduling|Medium|Low|
|P3|Course prerequisites|Medium|Low|
|P3|Bulk admin operations + CSV export|Medium|Low|

\---

*Generated: 2026-04-07 | SkillSphere Backend Analysis*

