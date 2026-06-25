# SkillSphere — Ideal AI Virtual Classroom & Tutor

A blueprint for a virtual classroom that makes **anyone who sees it stop and say "wow"** — and that feels equally polished on a laptop and a phone. This document describes the target experience, the frontend, the backend, and the OpenAI usage that powers it.

> Stack today: **Frontend** React Native Web (one codebase → web + Android), **Backend** Node/Express + Sequelize + MySQL, **AI** OpenAI API (GPT for content & teaching decisions, TTS for voice, Whisper for speech-to-text).

---

## 1. The Vision (what makes it "wow")

A student opens a topic and it doesn't feel like a webpage — it feels like **a live teacher walked up to a smart board and started teaching just for them.**

Five principles drive every decision:

1. **A present teacher, not a text dump.** A living AI avatar that *speaks*, *changes what it is doing* (explaining → drawing → coding → asking), and reacts to the student.
2. **One continuous flow.** No "Chunk 4 of 11" mechanics in the student's face. It feels like one seamless lecture, even though it's chunked under the hood for pacing and checkpoints.
3. **The board is the hero.** A big, smart-board surface where content is *revealed and built up* in sync with the voice — bullets appear, diagrams draw themselves, code types out.
4. **Intelligent media choice.** The tutor decides *on its own* when to show a slide, draw a diagram, write code, use the whiteboard, or pause for a checkpoint — because the lesson was authored with that intent.
5. **Interruptible like a real class.** The student can "raise their hand" any second; the lecture pauses, the doubt is answered *on the same board* (with a diagram/code if it helps), then the lecture resumes exactly where it left off.

If it's done right, a viewer should not be able to tell it's templated — every second should feel authored and alive.

---

## 2. The Experience (a student's eyes)

### Laptop (the cinematic stage)
```
┌───────────────────────────────────────────────────────────────────────┐
│ ←  Introduction to Networks ▓▓▓▓▓▓▓▓░░░░░░░░░░░░  36%                    │  slim top bar
├───────────────────────────────────────────────────────────────────────┤
│ ● LIVE  Protocols in Networking          ✍️ Drawing it out   🔊 ⏸ ⏭     │  stage header
│                                                                         │
│                                                                         │
│        ┌──────────┐         ┌──────────┐        ┌──────────┐            │
│        │ Device A  │──uses──▶│ Protocol  │─────▶ │ Device B  │           │  HERO BOARD
│        └──────────┘         └──────────┘        └──────────┘            │  (diagram drawing
│   🟣                                                                     │   itself, or slide
│  avatar                       KEY TERMS:  TCP/IP   HTTP   Packet         │   bullets, or code
│ (speaking)                    💡 EXAMPLE: A browser loading a page...    │   typing out)
│                                                                         │
├───────────────────────────────────────────────────────────────────────┤
│ ✍️  "Protocols are the rules every device follows so they can talk…" ▍  │  live caption (synced)
└───────────────────────────────────────────────────────────────────────┘
```
- **Top bar:** back arrow (stops the lecture), lesson title, one continuous progress bar.
- **Stage header:** a pulsing `● LIVE` chip, the current concept title, a **morphing activity pill** ("Explaining" → "Drawing it out" → "Writing code" → "Quick check"), and compact transport controls.
- **Hero board:** dominates the screen, smart-board dotted texture, soft depth. This is where diagrams animate node-by-node, slides reveal bullet-by-bullet, code types line-by-line, the whiteboard "writes."
- **Presenter avatar:** a glowing orb docked in the corner with a speaking waveform — the teacher's presence.
- **Live caption bar:** the spoken sentence streams word-by-word, in lockstep with the actual audio.

### Phone (the same soul, re-stacked)
```
┌───────────────────────────┐
│ ←  Introduction… ▓▓▓░░ 36% │
├───────────────────────────┤
│ ●LIVE Protocols  ✍️drawing │
│ ┌───────────────────────┐ │
│ │   [ diagram / slide ] │ │   board takes the top 55–65%
│ │      (scrolls)        │ │
│ └───────────────────────┘ │
│ 🟣 small avatar + waveform │
├───────────────────────────┤
│ ✍️ "Protocols are the…" ▍  │   caption
├───────────────────────────┤
│  ✋ Ask    ⏸ Pause   ⏭ Next │   thumb-reachable bar
└───────────────────────────┘
```
- Single column, board on top, caption below, controls in a bottom bar within thumb reach.
- Avatar shrinks to a compact orb; the activity pill collapses to just its icon.
- Side tools (Topics, Notes, Cards, Q&A) become a bottom sheet / slide-over instead of a left rail.
- Tap targets ≥ 44px; text scales down one step; diagrams fit width and scroll vertically.

### The "raise your hand" moment (the showstopper)
1. Student taps **Ask** (or the mic) → lecture **freezes instantly** (voice stops mid-word).
2. A focused **Question board** slides over the stage: "Question break."
3. Student **types or speaks** the doubt (Whisper transcribes voice). Quick-ask chips offer "Give an example / Draw a diagram / Explain simply / Show me code."
4. The tutor answers **on the board, concisely** — 2–3 sentences, plus a **diagram or code block when it helps** — and speaks it.
5. Student hits **Resume** (or Ask another) → the lecture continues **from the exact spot**.

This single interaction is what makes people lean in: it behaves like a teacher who paused class to clear one doubt at the board.

---

## 3. Frontend Specification

### 3.1 Responsive system (one layout, two feels)
- A single breakpoint at **768px**: `isMobile = width < 768`.
- **Laptop:** left icon rail + main stage + optional slide-over panels; large fonts; presenter as corner cam.
- **Phone:** board-first vertical stack; controls in a bottom bar; panels as bottom sheets; compact avatar.
- Everything sized from `useWindowDimensions()` so it adapts to any screen, including split-screen and tablets.
- Board visuals (diagrams/code/tables) are given an explicit pixel width derived from the viewport so they never overflow or look cramped.
- **Critical rule:** use **explicit/known heights** for the stage regions (header / board / caption / footer) rather than relying on nested percentage-flex — RN-Web does not resolve deep `flex:1`/`%` height chains reliably. The board gets every remaining pixel; the caption and controls are pinned.

### 3.2 The Stage Director (the brain of the UI)
The backend sends, per chunk, a rich **teaching decision** (narration broken into segments, an ordered `teaching_sequence`, and the chosen `board_content`). The frontend turns this into a **choreographed timeline of beats**:

| Beat | Avatar state | Board action | Caption |
|------|--------------|--------------|---------|
| intro | speaking | board fades in | transition line |
| explain | speaking + "Explaining/Drawing/Coding" | reveal slide/diagram/code progressively | main explanation |
| example | speaking + "Giving an example" | example card pops | the example |
| analogy | speaking + "A simple analogy" | analogy note slides in | the analogy |
| checkpoint | thinking + "Quick check" | question spotlight | the question |

- Each beat owns a slice of the chunk's playback progress (weighted by text length), so the **avatar state, the visible board content, and the caption all advance in sync with the real voice**.
- Progress is read from the **actual audio element's position** (falling back to a wall-clock timer / TTS word-boundary events) so reveals never drift from the narration.

### 3.3 Board renderers (the smart board)
A single `renderBoard()` switches on `board_content.type`:
- **Slide / notes:** numbered points + **key-term chips** + **example card** + **analogy note** — a full, structured slide (never a lonely sentence).
- **Diagram / flowchart:** animated `DiagramCanvas` — nodes scale-in one by one, connectors draw with arrowheads, BFS auto-layout, labels on edges.
- **Comparison:** a clean two-column table with a VS/→ badge.
- **Code:** a terminal-style block with traffic-light header, language tag, line numbers, lines revealing progressively.
- **Checkpoint:** a spotlighted question card.

### 3.4 Presence & motion
- `AITeacherAvatar`: orbiting particles, glow halo, speaking waveform, and a compact "minimal" variant for headers/phones.
- Every element enters with a **fade + slide + subtle scale** (`Reveal`) — nothing ever just "pops" in.
- A morphing **activity pill** and **beat-timeline dots** communicate "what the teacher is doing now."

### 3.5 Interactions
- **Transport:** play/pause, skip, mute; back arrow stops the lecture and persists the pause point.
- **Inline Q&A:** full-height question board, voice (record → Whisper) + text, Enter/mic/Ask to submit, quick-ask chips, answer rendered as text + code + diagram, Resume/Ask-another.
- **Tools:** Topics, Notes (auto-saved), Flashcards, Subtitles toggle — slide-over on laptop, bottom sheet on phone.
- **Accessibility:** captions always available, keyboard submit, ARIA labels, reduced-motion respected, color-contrast safe.

---

## 4. Backend Specification (powered by the OpenAI API)

### 4.1 Models & roles (env-configured)
| Purpose | Env var | Typical model | Why |
|--------|---------|---------------|-----|
| Course/lecture authoring | `OPENAI_MODEL_*` | a strong GPT (e.g. GPT-4-class) | quality of teaching content |
| Runtime teaching micro-planner | `OPENAI_MODEL_TUTOR_PLANNER` | fast GPT (JSON mode) | decide how to teach a chunk |
| In-lecture Q&A | `OPENAI_MODEL_QA` | fast GPT (JSON mode) | concise answers + optional diagram |
| Voice (TTS) | `OPENAI_STT`/TTS model | OpenAI TTS | the tutor's spoken voice |
| Speech-to-text | `OPENAI_STT_MODEL` | Whisper | reliable mic capture everywhere |

All calls go through a **timeout wrapper**, use **temperature ~0.2** for consistency, and **JSON mode** wherever structured output is needed.

### 4.2 Lecture authoring pipeline (offline, once per topic)
From a topic + source material, generate and **persist** a teaching package so playback is instant and cheap:
- `AILecture` — title, summary, `teachingScript`, duration, passing threshold.
- `AILectureSection` (the chunks) — `spokenExplanation`, `whiteboardExplanation`, `keyTerms`, `examples`, `analogyIfHelpful`, `slideBullets`, `visualMode`, **`diagramData` (nodes/edges)**, `teachingSequence`, `checkpointQuestion`, `estimatedDurationSeconds`, `difficultyLevel`.
- `AIFlashcard`, `AIQuiz` — generated alongside.

> Authoring once and storing it is what makes the live class feel instant and keeps OpenAI cost bounded — playback replays stored content, not fresh generations.

### 4.3 Teaching orchestrator (the per-chunk director)
On each chunk request, `aiTeachingOrchestrator.getTeachingDecision()` returns a **delivery object** the frontend choreographs:
- `narration_segments[]` + composed `narration_text`
- `teaching_sequence[]` (e.g. `["speak","visual","whiteboard"]`)
- `classroom_mode` (diagram_explainer / code_walkthrough / slide_summary / whiteboard_notes / checkpoint / recap / narration)
- `board_content` (the exact thing to render)
- `transition_text`, `checkpoint_text`, `recommended_duration_seconds`, teacher tone, likely confusion points, reinforcement points.

Mostly derived from stored fields (free, instant); an **optional runtime micro-planner** (GPT, JSON mode) refines pacing only when signals warrant — gated behind a flag and cached per chunk to control cost.

### 4.4 Voice (TTS)
- `getOrCreateAudioAsset()` synthesizes narration to an **mp3 on disk**, stores only the **path + cache key** in the DB (never audio bytes in MySQL).
- **Cache-keyed by text** → identical lines are synthesized once and reused across students. The frontend syncs the board/caption to this exact audio's playback position.

### 4.5 In-lecture Q&A (with diagrams)
`submitQuestion()` → `openaiService.answerLectureQuestion()` (JSON mode), given the current lecture/section context:
```json
{ "answer": "≤2–3 sentence markdown (code/bullets allowed)",
  "diagram": null | { "caption": "...", "nodes": [{"id","label"}], "edges": [{"from","to","label"}] } }
```
- **Concise by contract**, on-topic only, answer text always present.
- A **diagram is returned only when a process/structure/relationship genuinely needs one**, validated into the same shape `DiagramCanvas` renders.
- The answer is spoken (TTS) and rendered on the board; the session is paused with a `resumeLeadIn` so resuming feels like "now that that's clear, let's continue."

### 4.6 Speech-to-text
`/audio/transcribe` (Whisper) accepts the recorded clip and returns `{ text }` — used for spoken questions across all browsers (more reliable than the Web Speech API).

### 4.7 Reliability & cost
- Stored-content-first playback; OpenAI hit live only for authoring, optional micro-planning, Q&A, and first-time TTS.
- Audio + plan **caching**; JSON-mode validation with safe fallbacks; per-call timeouts.
- MySQL `max_allowed_packet` raised so full lectures (many long-text sections) load without packet errors; large blobs (audio) never stored in the DB.

---

## 5. End-to-End Workflow

```
Author (once):  Topic + material ──GPT──▶ AILecture + Sections (+flashcards, quiz) ──▶ MySQL

Live class:
  Student opens topic
     └─▶ startSession ──▶ first chunk + teaching decision
            └─▶ TTS (cached) plays  ◀── Stage Director syncs board + caption + avatar
                   └─▶ chunk ends ──▶ next chunk (seamless, ~250ms, "moving on" beat)
                          └─▶ … repeat as one flowing lecture …
                                 └─▶ last chunk ──▶ "Lecture complete" ──▶ Quiz unlocks next topic

  Anytime — Raise hand:
     pause ──▶ Whisper(voice)/text ──▶ answerLectureQuestion (concise + optional diagram)
            ──▶ speak + render on board ──▶ Resume from exact chunk
```

---

## 6. Definition of "Perfect"

A build is done when:
- On **laptop and phone**, the board is the hero, the teacher feels present, and the caption tracks the voice.
- The tutor **switches media on its own** (slide ↔ diagram ↔ code ↔ whiteboard ↔ checkpoint) and it always feels intentional.
- **No dead air** between chunks; transitions feel like a teacher moving to the next point.
- A student can **interrupt, get a concise board-level answer (with a diagram/code when useful), and resume** without losing place.
- Nothing looks templated or empty; every screen is full, animated, and readable.
- It runs on **stored content + cached audio**, so it's instant and affordable, hitting OpenAI only where it adds real value.

> North star: a stranger watching over the student's shoulder should believe a real teacher is teaching a real class — and want one too.
