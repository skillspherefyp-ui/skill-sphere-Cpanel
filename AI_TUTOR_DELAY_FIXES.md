# AI Tutor — Delay Fixes, Consequences & Safety Guide

---

## PART 1 — How It Currently Works (Do NOT Break This)

Before touching anything, understand exactly what the AI tutor does today
so nothing gets accidentally broken.

### What happens when a student opens a topic

1. The frontend calls `POST /ai-tutor/topics/:topicId/start`
2. The server loads the full lecture from the database (all sections, chunks,
   flashcards, quiz, visuals) and creates or resumes a session for that student
3. The server decides how to teach the first chunk — teaching style, visual mode,
   transition text, board content — based on stored data (no OpenAI call here,
   it uses pre-generated data)
4. The first chunk is returned to the frontend with all display info

### What happens on every "Next Chunk" click

1. Frontend calls `POST /ai-tutor/sessions/:sessionId/next`
2. Server loads the ENTIRE lecture again from the database
3. Server finds the next chunk in order
4. Server decides how to teach it (again from stored data, no live OpenAI call
   unless the micro-planner env variable `ENABLE_TUTOR_MICRO_PLANNER=true` is set)
5. Progress is saved to database in two steps
6. New chunk is returned to the frontend

### What happens when the student raises their hand and asks a question

1. Frontend calls `POST /ai-tutor/sessions/:sessionId/questions`
2. Server loads the ENTIRE lecture again from the database
3. Server fetches the course language from the database (English or Urdu)
4. Session is marked as paused, user message is saved to database
5. **A live OpenAI API call is made** — the server waits for the COMPLETE answer
6. AI answer is saved to database
7. Session is reloaded with all messages from database
8. Everything is returned to the frontend at once

### Language support — what must never change

- Every chunk, question answer, and teaching decision already has full
  Urdu and English support built in
- The course language (English or Urdu) is fetched from the database and
  passed to every OpenAI prompt as a rule
- English courses get English prompts, Urdu courses get Urdu prompts
- **All fixes must preserve this — the language routing must never be removed
  or bypassed, only made faster**

### Voice (TTS) — what must never change

- The AI tutor speaks chunks aloud using OpenAI TTS via
  `POST /ai-tutor/audio/speak`
- Voice QA is handled by `VoiceQAOverlay.js` which records audio,
  transcribes it via STT, submits the question, and plays back the answer
  via TTS
- The spoken text is always the same as the written text — no separate
  content path
- **All fixes are only about speed of delivery — the spoken/written content
  must remain identical to today**

---

## PART 2 — Why There Is Delay

### Delay 1: Moving from one chunk to the next is slow

Every time the student clicks "Next", the server:

1. **Loads the ENTIRE lecture from the database** — all sections, all chunks,
   all flashcards, all quiz questions, all slide outlines, all visual suggestions.
   We only need the next chunk but we load everything every single time.
   The more content a course has, the worse this gets.

2. **Makes a separate database call just to get the course language** — we
   already know if the course is English or Urdu, but we ask the database
   for it again on every single chunk navigation.

3. **Saves progress in two separate database steps** — first it checks if a
   progress record exists, then it updates it. These two round trips could
   be one.

### Delay 2: Question answers take too long

When the student asks a question:

1. **The server waits for the COMPLETE OpenAI answer before sending anything.**
   OpenAI can take 5–15 seconds to write a full answer. The worst case
   timeout is 45 seconds. The student sees a loading spinner for the entire
   duration.

2. **The entire lecture is loaded from the database again** inside the question
   handler — even though the frontend already has it loaded.

3. **After saving the answer, the server reloads the full session** with all
   20 messages before returning the response. This adds extra time at the
   very end and is completely unnecessary since the frontend only needs the
   answer text.

---

## PART 3 — The Fixes (What to Change, What Not to Touch)

---

### Fix 1 — Stream the question answer word by word
**Impact: Highest. This alone makes questions feel instant.**

#### What to change

| File | What to do |
|---|---|
| `backend/services/openaiService.js` | In `answerLectureQuestion()` — add `stream: true` to the OpenAI call. Return an async stream iterator instead of awaiting the full completion object |
| `backend/services/aiTutorService.js` | In `submitQuestion()` — restructure into two phases: Phase 1 saves the user message and starts the stream. Phase 2 saves the complete AI message to DB only after the stream finishes |
| `backend/controllers/aiTutorController.js` | In `submitQuestion` handler — set SSE response headers, write each token chunk as it arrives, close the connection when stream ends |
| `AppAndroidSS/src/services/apiClient.js` | Add a new `streamPost()` helper that uses raw `fetch` with a readable stream instead of the normal `post()` which waits for full JSON |
| `AppAndroidSS/src/screens/student/AILearningScreen.js` | In `submitLectureQuestion()` — instead of awaiting a full response, open the stream, create an empty AI chat bubble immediately, and append tokens to it as they arrive |
| `AppAndroidSS/src/components/VoiceQAOverlay.js` | Line 297 also calls `aiTutorAPI.askQuestion()` — needs the same streaming treatment |

#### What must NOT change

- The Urdu/English language rule inside `answerLectureQuestion()` must stay
  exactly as it is — only the delivery mechanism changes from "wait for all"
  to "send as it comes". The prompt, the model, and the language logic are
  untouched.
- The answer content itself does not change — streaming just makes the same
  answer arrive faster from the student's perspective.
- TTS (voice playback) of the answer in `VoiceQAOverlay.js` must still work.
  The full answer text is assembled from the stream tokens and then passed
  to TTS at the end, same as today.

#### Consequences and how to handle them

**Consequence 1: React Native mobile (Android/iOS) does not support streaming fetch natively.**
React Native's built-in `fetch` on Android and iOS does not expose
`ReadableStream`. Attempting to stream on mobile will silently fail or error.

How to handle: Use `Platform.OS === 'web'` (already used throughout the app)
to decide which path to take. On web → use streaming. On mobile → keep the
existing non-streaming behaviour unchanged. Add a package like
`react-native-fetch-api` only if mobile streaming is needed later.

**Consequence 2: The AI message cannot be saved to the database until the stream finishes.**
Currently `submitQuestion()` saves the AI message right after the OpenAI call.
With streaming, the full text only exists after all tokens arrive.

How to handle: Collect all tokens into a string as they stream. Save the
complete string to the database in the `finally` block after the stream ends.
If the stream errors midway, save whatever partial text was collected with a
note that it was incomplete, so the chat history is not empty.

**Consequence 3: If the stream disconnects halfway, the student sees a cut-off answer.**
Network interruptions or server errors can cut the stream.

How to handle: Send a final SSE event of type `error` with a message like
"Answer was cut short. Please ask again." The frontend catches this event
type and appends it to the bubble so the student knows to retry.

**Consequence 4: The loading spinner behaviour changes.**
Today the spinner shows for the full wait time. With streaming, the spinner
should show only until the first token arrives, then disappear as text appears.

How to handle: Keep the `submittingQuestion` state set to `true` until the
first token arrives, then set it to `false`. The bubble stays and fills in.
No visual change needed on the loading state UI — it just resolves faster.

**Consequence 5: VoiceQAOverlay TTS could speak before the full answer is ready.**
VoiceQAOverlay currently awaits the full answer then passes it to TTS.
With streaming, the full text is only ready at end of stream.

How to handle: In VoiceQAOverlay, collect the full streamed text first before
calling `aiTutorAPI.speakText()`. Do not start TTS until the stream is
complete. The voice behaviour stays exactly as it is today.

---

### Fix 2 — Load only what is needed when navigating chunks
**Impact: High. Removes the heaviest repeated database query.**

#### What to change

| File | What to do |
|---|---|
| `backend/services/aiTutorService.js` | Add a new function `getLectureChunksOnly(topicId)` that queries only `AILectureSection` and `AIVisualSuggestion`. Replace `getLectureByTopicId()` inside `getNextLectureChunk()`, `getSessionState()`, `restartTutorSession()`, and `submitQuestion()` with this lean version |

Keep `getLectureByTopicId()` (the full heavy query) only where everything
is actually needed:
- `ensureLectureReadyForTopic()` — called once when a session starts
- `getLecturePackage` controller endpoint — instructor-facing view

#### What must NOT change

- `AIVisualSuggestion` must still be included in the lean query. The function
  `getVisualSuggestionForChunk()` reads from `lecture.visualSuggestions` —
  if this is removed, visual panels (diagrams, flowcharts, comparison tables)
  will stop showing.
- The chunk object returned to the frontend is built from `AILectureSection`
  rows only — its shape does not change at all.
- The Urdu/English language decision happens in `attachTeachingDecision()`,
  which reads from `session.courseLanguage` (after Fix 3 is applied) or from
  a separate `Course.findByPk()`. Either way, this is separate from the
  lecture query and is not affected by this fix.

#### Consequences and how to handle them

**Consequence 1: Visual panels break if `AIVisualSuggestion` is accidentally excluded.**
Diagrams, flowcharts, and comparison tables are pulled from
`lecture.visualSuggestions` inside `getVisualSuggestionForChunk()`.

How to handle: Always include `{ model: AIVisualSuggestion, as: 'visualSuggestions' }`
in the lean query. Test by opening a chunk that shows a diagram or flowchart
and confirming it still renders after the change.

**Consequence 2: Flashcards or quiz disappear mid-session.**
This will not happen because flashcards and quiz are loaded by their own
separate endpoints (`/lectures/:lectureId/flashcards` and
`/lectures/:lectureId/quiz`), not from the navigation path.

**Consequence 3: Restart session shows wrong chunk.**
`restartTutorSession()` calls `getLectureByTopicId()` to find chunk 0,0.
With the lean version it will still find chunk 0,0 from `AILectureSection`.
No behaviour change.

---

### Fix 3 — Save course language in session once
**Impact: Medium. Removes one database call per chunk and per question.**

#### What to change

| File | What to do |
|---|---|
| `backend/models/AITutorSession.js` | Add one new field: `courseLanguage` with type `STRING(20)` and default value `'English'` |
| `backend/services/aiTutorService.js` | In `startTutorSession()` — fetch the course language once from `Course.findByPk()` and save it into the session record. In `attachTeachingDecision()` — read `session.courseLanguage` instead of calling `Course.findByPk()`. In `submitQuestion()` — same, read from session instead of `Course.findByPk()` |

Also needed: a one-time database migration script to add the column:
`ALTER TABLE ai_tutor_sessions ADD COLUMN courseLanguage VARCHAR(20) NOT NULL DEFAULT 'English'`
Place this in `backend/scripts/addCourseLanguageToSessions.js`

#### What must NOT change

- The language value passed to OpenAI prompts must be exactly the same string
  as before (`'English'` or `'Urdu'`). Only where it comes from changes —
  from a live DB call to a cached session field.
- The Urdu prompt rules in `openaiService.js` and `aiTeachingOrchestrator.js`
  must not be touched at all.

#### Consequences and how to handle them

**Consequence 1: Existing sessions in the database have no `courseLanguage` value.**
Sessions that were created before this migration will have `null` in this field
(or the default `'English'` if the column is added with a DEFAULT).

How to handle: In every place that reads `session.courseLanguage`, always
write `session.courseLanguage || 'English'` as a fallback. This means the
worst case for old sessions is they fall back to English, which is the same
behaviour as if the course language query had defaulted.

**Consequence 2: An Urdu course session created before the migration gets English responses.**
Old sessions will have `courseLanguage = 'English'` (the column default).
If a student was mid-session on an Urdu course before the migration, their
session will use English prompts after the fix.

How to handle: The migration script can update existing sessions by joining
to the courses table:
`UPDATE ai_tutor_sessions s JOIN courses c ON s.courseId = c.id SET s.courseLanguage = c.language`
Run this as part of the same migration so all existing sessions get the
correct language immediately.

**Consequence 3: The DB column does not exist yet and the server crashes on boot.**
If the model is updated before the migration script is run, Sequelize will
try to read a column that does not exist.

How to handle: Run the migration script BEFORE deploying the updated model.
Or use `alter: true` in the Sequelize sync for one deployment only, which
will auto-add the column, then remove `alter: true` afterward.

---

### Fix 4 — Remove the unnecessary session reload after an answer
**Impact: Small but free. Zero risk.**

#### What to change

| File | What to do |
|---|---|
| `backend/services/aiTutorService.js` | In `submitQuestion()` — delete the `session.reload(...)` block. Return `{ session, lecture, userMessage, aiMessage }` directly without the reload |

#### What must NOT change

- The response shape stays identical. The frontend reads
  `response.aiMessage.content` — that field comes from `aiMessage` which is
  saved before the reload, so it is unaffected.
- `VoiceQAOverlay.js` reads `rawRes?.aiMessage?.content` — same, unaffected.

#### Consequences and how to handle them

**There are no meaningful consequences.** The session object returned after
the reload would have been identical to the one before it, because the only
write that happened between the two was saving the AI message — and that
field is already in `aiMessage` which is returned separately.

If something unexpected breaks: add the reload back in. It was not doing
harm, only wasting time.

---

### Fix 5 — Combine the two progress save steps into one
**Impact: Small. Saves one database round trip per chunk navigation.**

#### What to change

| File | What to do |
|---|---|
| `backend/services/aiTutorService.js` | In `getNextLectureChunk()` — replace `AIStudentProgress.findOrCreate()` followed by `progress.update()` with a single `AIStudentProgress.upsert()` call |

#### What must NOT change

- The fields saved to progress must stay the same: `lectureId`,
  `currentSectionIndex`, `currentChunkIndex`, `lastSessionId`.
- The `lectureCompleted` flag logic (set to `true` when no more chunks)
  must stay separate and untouched.

#### Consequences and how to handle them

**Consequence 1: `upsert()` requires a unique index on `(userId, courseId, topicId)`.**
Sequelize's `upsert()` in MySQL uses `INSERT ... ON DUPLICATE KEY UPDATE`.
If the unique constraint does not exist on `AIStudentProgress`, the upsert
will always insert and create duplicates instead of updating.

How to handle: Before implementing, check the `AIStudentProgress` model for
`unique: true` or a `uniqueKeys` option on those three columns. If the
constraint is missing, keep the `findOrCreate` + `update` pattern and skip
this fix — it is the lowest priority and not worth the risk.

---

## PART 4 — Summary Tables

### What causes each delay right now

| Delay | Root cause | Severity |
|---|---|---|
| Slow chunk navigation | Full lecture (flashcards + quiz + all) loaded every click | High |
| Slow chunk navigation | Course language queried from DB every click | Medium |
| Slow chunk navigation | Two DB saves instead of one | Low |
| Slow question answer | Full OpenAI response awaited before anything sent back | Critical |
| Slow question answer | Full lecture loaded again inside question handler | High |
| Slow question answer | Session reloaded with 20 messages after answer saved | Low |

### Which files each fix touches

| Fix | Service | Controller | Model | DB Migration | Screen | Component | apiClient |
|---|---|---|---|---|---|---|---|
| 1. Stream answers | Yes | Yes | No | No | Yes | Yes | Yes |
| 2. Lean lecture query | Yes | No | No | No | No | No | No |
| 3. Cache language | Yes | No | Yes | Yes | No | No | No |
| 4. Remove reload | Yes | No | No | No | No | No | No |
| 5. Combine save | Yes | No | No | No | No | No | No |

### Recommended order to implement

| Order | Fix | Effort | Risk |
|---|---|---|---|
| 1st | Fix 4 — Remove session reload | 5 min | Zero |
| 2nd | Fix 5 — Combine progress save | 10 min | Zero (check unique index first) |
| 3rd | Fix 3 — Cache course language | 20 min | Low (run migration first) |
| 4th | Fix 2 — Lean lecture query | 30 min | Low (keep visualSuggestions) |
| 5th | Fix 1 — Stream answers | Large | Medium (mobile needs special handling) |

---

## PART 5 — The One Rule That Must Be Followed For All Fixes

> **None of these fixes change what the AI tutor says or how it teaches.
> They only change how fast the data moves between the database, the server,
> and the student's screen.**
>
> The OpenAI prompts, the Urdu language rules, the English language rules,
> the teaching plan logic, the voice/TTS path, the visual panel content,
> the diagram data, the flashcards, the quiz — all of this stays exactly
> as it is. Only the plumbing gets faster.
