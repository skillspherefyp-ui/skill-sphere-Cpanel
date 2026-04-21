# Voice Q&A Overlay — Implementation Plan

## Overview

Replace the "Ask Question" button behavior in both **AILearningScreen** and **LearningScreen**.
Instead of opening a text chat panel, tapping "Ask Question" triggers a full-screen animated voice overlay (like Gemini / ChatGPT live mode):

1. Overlay fades in, AI speaks the prompt aloud
2. Mic opens — user speaks their question
3. Silence detected (5 s) → AI says "No questions, let's continue" and closes
4. If question captured → AI answers aloud
5. Overlay fades out, lecture resumes automatically

---

## New File

```
AppAndroidSS/src/components/VoiceQAOverlay.js
```

---

## Props

| Prop | Type | Description |
|---|---|---|
| `visible` | `boolean` | Controls overlay mount/unmount |
| `onClose` | `() => void` | Called when overlay finishes (resume lecture after this) |
| `sessionId` | `string \| null` | AI tutor session ID — non-null for AILearningScreen, null for LearningScreen |
| `courseId` | `string \| number` | For `lectureChatAPI.sendMessage` fallback |
| `topicId` | `string \| number` | For `lectureChatAPI.sendMessage` fallback |
| `studentName` | `string` | Personalises the spoken prompt |
| `theme` | `object` | Theme object from `useTheme()` |

---

## State Machine

```
[idle]
   │  visible → true
   ▼
[speaking-prompt]   ← AI speaks: "Hi {name}, what's your question?"
   │  utterance ends
   ▼
[listening]         ← mic open, waveform animated
   │  5 s silence  ──────────────────────────────────────────────────────┐
   │  transcript received                                                 │
   ▼                                                                      ▼
[processing]                                                      [speaking-closing]
   │  API responds                                                   AI: "No questions,
   ▼                                                                  let's continue."
[speaking-answer]   ← AI speaks the answer aloud                         │
   │  utterance ends                                                      │
   ▼                                                                      │
[done] ◄─────────────────────────────────────────────────────────────────┘
   │  onClose() called → lecture resumes
```

---

## Animations (Gemini / ChatGPT live style)

### Orb (center circle)
- Radius: 80 px
- Background: radial gradient (primary color → transparent) using `LinearGradient` or a `View` overlay
- Continuous pulse: `scale 1.0 → 1.08 → 1.0`, 900 ms loop via `Animated.loop`
- During `listening` / `speaking-answer`: faster pulse (600 ms), slightly larger scale (1.14)

### Concentric Rings
- 2 rings expanding outward from orb center
- Ring 1: starts at orb size, expands to 2× orb size, `opacity 0.4 → 0`
- Ring 2: same but delayed 400 ms
- Loop continuously while in `listening` or `speaking-*` phases

### Waveform Bars (12 bars)
- Arranged horizontally below orb
- Each bar: width 4 px, borderRadius 2, height animated between 8 px and 40 px
- During `listening`: each bar height randomised every 150 ms using `Animated.timing`
- During `speaking-*`: same but slightly calmer (8–28 px range)
- During `processing`: all bars at minimum height, one centre bar does slow pulse

### Overlay backdrop
- `backgroundColor: 'rgba(0,0,0,0.85)'`
- Web: `backdropFilter: 'blur(12px)'`
- Fade in/out on mount/unmount: `Animated.timing` on an `opacity` value

---

## Speech Prompt Text

```
"Hi {studentName}, what's your question? I've paused the lecture for you."
```

No-question fallback:
```
"No questions — let's continue the lecture."
```

---

## Web Speech API — Recognition

```js
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = true;
recognition.lang = 'en-US';

recognition.onresult = (event) => {
  const transcript = Array.from(event.results)
    .map(r => r[0].transcript)
    .join('');
  setTranscript(transcript);
  resetSilenceTimer();
};

recognition.onend = () => {
  if (transcript) {
    setPhase('processing');
    callAnswerAPI(transcript);
  } else {
    speakNoQuestion();
  }
};
```

**Silence detection:** `setTimeout(5000)` started when recognition starts.
Reset on every `onresult`. On expiry → stop recognition → triggers `onend`.

---

## TTS — Speaking

Use `window.speechSynthesis` (browser native, no backend needed for prompts).

```js
const speak = (text, onEnd) => {
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.0;
  utter.pitch = 1.0;
  utter.onend = onEnd;
  window.speechSynthesis.speak(utter);
};
```

For the AI answer: same `window.speechSynthesis`.
Optional upgrade path: call `aiTutorAPI.speakText({ text })` to get an audio URL and play it via `<audio>` element — but this requires a backend round-trip and is not needed for v1.

---

## API Calls

### AILearningScreen mode (`sessionId` is non-null)
```js
const res = await aiTutorAPI.askQuestion(sessionId, transcript);
const answerText = res.answer || res.message || res.text;
```

### LearningScreen mode (`sessionId` is null)
```js
const res = await lectureChatAPI.sendMessage(courseId, topicId, transcript);
const answerText = res.message?.content || res.content || res.text;
```

---

## AILearningScreen Integration

**File:** `AppAndroidSS/src/screens/student/AILearningScreen.js`

### State to add
```js
const [showVoiceQA, setShowVoiceQA] = useState(false);
```

### New helper — pauseLecturePlayback
```js
const pauseLecturePlayback = () => {
  setIsPlaying(false);
  // Stop any ongoing TTS
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
};
```

### Replace handleRaiseHand
```js
const handleRaiseHand = () => {
  pauseLecturePlayback();
  setShowVoiceQA(true);
};
```

### Overlay usage (inside JSX, just before closing `</MainLayout>`)
```jsx
<VoiceQAOverlay
  visible={showVoiceQA}
  sessionId={session?.id ?? null}
  courseId={courseId}
  topicId={topicId}
  studentName={studentName}
  theme={theme}
  onClose={() => {
    setShowVoiceQA(false);
    // Resume lecture after a short pause
    setTimeout(() => setIsPlaying(true), 800);
  }}
/>
```

---

## LearningScreen Integration

**File:** `AppAndroidSS/src/screens/student/LearningScreen.js`

### State to add
```js
const [showVoiceQA, setShowVoiceQA] = useState(false);
```

### Replace handlePauseAsk
```js
const handlePauseAsk = () => {
  setIsPlaying(false);
  setAiSpeaking(false);
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  setShowVoiceQA(true);
};
```

### Overlay usage (inside JSX, just before closing `</MainLayout>`)
```jsx
<VoiceQAOverlay
  visible={showVoiceQA}
  sessionId={null}
  courseId={courseId}
  topicId={topicId}
  studentName={user?.name || user?.email?.split('@')[0] || 'student'}
  theme={theme}
  onClose={() => {
    setShowVoiceQA(false);
    setIsPlaying(true);
    setAiSpeaking(true);
  }}
/>
```

---

## Component Skeleton

```jsx
// AppAndroidSS/src/components/VoiceQAOverlay.js
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { aiTutorAPI, lectureChatAPI } from '../services/apiClient';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const SILENCE_TIMEOUT_MS = 5000;
const WAVEFORM_BARS = 12;

// Phases: 'speaking-prompt' | 'listening' | 'processing' | 'speaking-answer' | 'speaking-closing' | 'done'

const VoiceQAOverlay = ({ visible, onClose, sessionId, courseId, topicId, studentName, theme }) => {
  const [phase, setPhase] = useState('speaking-prompt');
  const [transcript, setTranscript] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const orbScale = useRef(new Animated.Value(1)).current;
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const waveAnims = useRef(
    Array.from({ length: WAVEFORM_BARS }, () => new Animated.Value(8))
  ).current;

  // Refs
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const animLoopRef = useRef(null);
  const orbLoopRef = useRef(null);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setPhase('speaking-prompt');
      setTranscript('');
      setAnswerText('');
      setErrorMsg('');
      fadeIn();
      speakPrompt();
    } else {
      cleanup();
    }
  }, [visible]);

  // ── Orb pulse loop ────────────────────────────────────────────────────────
  useEffect(() => {
    const isActive = ['listening', 'speaking-prompt', 'speaking-answer', 'speaking-closing'].includes(phase);
    const duration = phase === 'listening' ? 600 : 900;
    const toScale = phase === 'listening' ? 1.14 : 1.08;

    if (orbLoopRef.current) orbLoopRef.current.stop();
    if (isActive) {
      orbLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(orbScale, { toValue: toScale, duration, useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(orbScale, { toValue: 1, duration, useNativeDriver: USE_NATIVE_DRIVER }),
        ])
      );
      orbLoopRef.current.start();
    } else {
      Animated.timing(orbScale, { toValue: 1, duration: 300, useNativeDriver: USE_NATIVE_DRIVER }).start();
    }
  }, [phase]);

  // ── Ring expansion loop ───────────────────────────────────────────────────
  useEffect(() => {
    const shouldAnimate = ['listening', 'speaking-prompt', 'speaking-answer'].includes(phase);
    if (animLoopRef.current) animLoopRef.current.stop();
    ring1Scale.setValue(1); ring1Opacity.setValue(0);
    ring2Scale.setValue(1); ring2Opacity.setValue(0);
    if (shouldAnimate) {
      animLoopRef.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.parallel([
              Animated.timing(ring1Scale, { toValue: 2.2, duration: 1600, useNativeDriver: USE_NATIVE_DRIVER }),
              Animated.timing(ring1Opacity, { toValue: 0, duration: 1600, useNativeDriver: USE_NATIVE_DRIVER }),
            ]),
            Animated.parallel([
              Animated.timing(ring1Scale, { toValue: 1, duration: 0, useNativeDriver: USE_NATIVE_DRIVER }),
              Animated.timing(ring1Opacity, { toValue: 0.4, duration: 0, useNativeDriver: USE_NATIVE_DRIVER }),
            ]),
          ]),
          Animated.sequence([
            Animated.delay(400),
            Animated.parallel([
              Animated.timing(ring2Scale, { toValue: 2.2, duration: 1600, useNativeDriver: USE_NATIVE_DRIVER }),
              Animated.timing(ring2Opacity, { toValue: 0, duration: 1600, useNativeDriver: USE_NATIVE_DRIVER }),
            ]),
            Animated.parallel([
              Animated.timing(ring2Scale, { toValue: 1, duration: 0, useNativeDriver: USE_NATIVE_DRIVER }),
              Animated.timing(ring2Opacity, { toValue: 0.4, duration: 0, useNativeDriver: USE_NATIVE_DRIVER }),
            ]),
          ]),
        ])
      );
      animLoopRef.current.start();
    }
  }, [phase]);

  // ── Waveform bars ─────────────────────────────────────────────────────────
  useEffect(() => {
    const isAnimating = ['listening', 'speaking-prompt', 'speaking-answer', 'speaking-closing'].includes(phase);
    const minH = phase === 'speaking-answer' ? 8 : 8;
    const maxH = phase === 'listening' ? 40 : 28;
    let timers = [];
    if (isAnimating) {
      waveAnims.forEach((anim, i) => {
        const animate = () => {
          const target = minH + Math.random() * (maxH - minH);
          Animated.timing(anim, { toValue: target, duration: 120 + Math.random() * 80, useNativeDriver: false }).start(() => {
            timers[i] = setTimeout(animate, 50 + Math.random() * 100);
          });
        };
        timers[i] = setTimeout(animate, i * 40);
      });
    } else {
      waveAnims.forEach(a => Animated.timing(a, { toValue: 8, duration: 300, useNativeDriver: false }).start());
    }
    return () => timers.forEach(t => clearTimeout(t));
  }, [phase]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fadeIn = () => {
    Animated.timing(overlayOpacity, { toValue: 1, duration: 350, useNativeDriver: USE_NATIVE_DRIVER }).start();
  };

  const fadeOut = (cb) => {
    Animated.timing(overlayOpacity, { toValue: 0, duration: 300, useNativeDriver: USE_NATIVE_DRIVER }).start(cb);
  };

  const cleanup = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch (_) {} }
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    if (orbLoopRef.current) orbLoopRef.current.stop();
    if (animLoopRef.current) animLoopRef.current.stop();
  };

  const finishAndClose = () => {
    cleanup();
    setPhase('done');
    fadeOut(() => onClose());
  };

  const speak = (text, onEnd) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.05;
    utter.onend = () => onEnd?.();
    utter.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utter);
  };

  const speakPrompt = () => {
    setPhase('speaking-prompt');
    speak(
      `Hi ${studentName}, what's your question? I've paused the lecture for you.`,
      () => startListening()
    );
  };

  const startListening = () => {
    setPhase('listening');
    const SpeechRecognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

    if (!SpeechRecognition) {
      speakNoQuestion();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    const resetSilenceTimer = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        recognition.stop();
      }, SILENCE_TIMEOUT_MS);
    };

    resetSilenceTimer();

    recognition.onresult = (event) => {
      const text = Array.from(event.results).map(r => r[0].transcript).join('');
      finalTranscript = text;
      setTranscript(text);
      resetSilenceTimer();
    };

    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (finalTranscript.trim()) {
        handleQuestion(finalTranscript.trim());
      } else {
        speakNoQuestion();
      }
    };

    recognition.onerror = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      speakNoQuestion();
    };

    try { recognition.start(); } catch (_) { speakNoQuestion(); }
  };

  const speakNoQuestion = () => {
    setPhase('speaking-closing');
    speak("No questions — let's continue the lecture.", () => finishAndClose());
  };

  const handleQuestion = async (question) => {
    setPhase('processing');
    try {
      let answerText = '';
      if (sessionId) {
        const res = await aiTutorAPI.askQuestion(sessionId, question);
        answerText = res.answer || res.message || res.text || 'Here is what I found.';
      } else {
        const res = await lectureChatAPI.sendMessage(courseId, topicId, question);
        answerText = res.message?.content || res.content || res.text || 'Here is what I found.';
      }
      setAnswerText(answerText);
      setPhase('speaking-answer');
      speak(answerText, () => finishAndClose());
    } catch (err) {
      setPhase('speaking-closing');
      speak("Sorry, I couldn't get an answer right now. Let's continue the lecture.", () => finishAndClose());
    }
  };

  // ── Status label ──────────────────────────────────────────────────────────
  const phaseLabel = {
    'speaking-prompt': 'Listening for your question…',
    'listening': transcript ? `"${transcript}"` : 'Speak now…',
    'processing': 'Getting your answer…',
    'speaking-answer': answerText,
    'speaking-closing': "No questions — let's continue.",
    'done': '',
  }[phase] || '';

  if (!visible) return null;

  const orbColor = theme?.colors?.primary || '#FF8C42';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={finishAndClose}>
      <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={finishAndClose}>
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Rings + Orb */}
        <View style={styles.orbContainer}>
          <Animated.View style={[styles.ring, {
            borderColor: orbColor + '40',
            transform: [{ scale: ring1Scale }],
            opacity: ring1Opacity,
          }]} />
          <Animated.View style={[styles.ring, {
            borderColor: orbColor + '30',
            transform: [{ scale: ring2Scale }],
            opacity: ring2Opacity,
          }]} />
          <Animated.View style={[styles.orb, {
            backgroundColor: orbColor,
            transform: [{ scale: orbScale }],
            shadowColor: orbColor,
          }]}>
            {phase === 'processing' ? (
              <Icon name="sync" size={36} color="#fff" />
            ) : phase === 'listening' ? (
              <Icon name="mic" size={36} color="#fff" />
            ) : (
              <Icon name="volume-high" size={36} color="#fff" />
            )}
          </Animated.View>
        </View>

        {/* Waveform */}
        <View style={styles.waveform}>
          {waveAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[styles.waveBar, {
                height: anim,
                backgroundColor: orbColor,
                opacity: 0.7 + (i % 3) * 0.1,
              }]}
            />
          ))}
        </View>

        {/* Status text */}
        <Text style={styles.statusLabel} numberOfLines={4}>{phaseLabel}</Text>

        {/* Skip button */}
        <TouchableOpacity style={styles.skipBtn} onPress={finishAndClose}>
          <Text style={styles.skipText}>Skip — Resume Lecture</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } : {}),
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
  },
  orb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 48,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 8,
  },
  statusLabel: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 24,
    paddingHorizontal: 24,
  },
  skipBtn: {
    position: 'absolute',
    bottom: 48,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  skipText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default VoiceQAOverlay;
```

---

## Checklist

- [ ] Create `AppAndroidSS/src/components/VoiceQAOverlay.js` using skeleton above
- [ ] AILearningScreen: add `showVoiceQA` state, `pauseLecturePlayback` helper, replace `handleRaiseHand` body, add `<VoiceQAOverlay>` in JSX
- [ ] LearningScreen: add `showVoiceQA` state, replace `handlePauseAsk` body, add `<VoiceQAOverlay>` in JSX
- [ ] Test in browser: Web Speech API availability, TTS, silence timeout, API call
- [ ] Graceful fallback when `window.SpeechRecognition` is unavailable (e.g., Firefox without flag)

---

## Notes

- **No backend changes needed** — uses existing `aiTutorAPI.askQuestion` and `lectureChatAPI.sendMessage`
- **Web-only initially** — Web Speech API is available in Chrome/Edge; Safari/Firefox may need fallback. On native (Android/iOS), React Native `@react-native-voice/voice` would be needed — that's a separate task.
- **TTS quality** — `window.speechSynthesis` is free and instant but voice quality varies by OS. Upgrade path: call `aiTutorAPI.speakText({ text })` → get audio URL → `new Audio(url).play()`.
- The `useNativeDriver: false` is required for `waveBar` height animation (layout property).
