import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { aiTutorAPI, lectureChatAPI, API_BASE } from '../services/apiClient';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const WAVEFORM_BARS = 12;

// How long (ms) of silence after the user has spoken before we stop recording
const SILENCE_AFTER_SPEECH_MS = 5000;
// How long (ms) to wait for the user to start speaking at all
const INITIAL_WAIT_MS = 10000;
// RMS threshold below which audio is considered silence
// Slightly raised so residual fan/AC hum after filtering doesn't count as speech
const SILENCE_THRESHOLD = 0.018;

// Phases: 'speaking-prompt' | 'listening' | 'transcribing' | 'processing'
//         | 'speaking-answer' | 'speaking-closing' | 'done'

const VoiceQAOverlay = ({
  visible,
  onClose,
  sessionId,           // non-null → aiTutorAPI.askQuestion; null → lectureChatAPI.sendMessage
  courseId,
  topicId,
  studentName,
  theme,
  onQuestionAnswered,  // (question, answer, rawRes) => void
}) => {
  const [phase, setPhase] = useState('speaking-prompt');
  const [transcript, setTranscript] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [micError, setMicError] = useState(false);

  // ── Animation values ──────────────────────────────────────────────────────
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const orbScale      = useRef(new Animated.Value(1)).current;
  const ring1Scale    = useRef(new Animated.Value(1)).current;
  const ring1Opacity  = useRef(new Animated.Value(0)).current;
  const ring2Scale    = useRef(new Animated.Value(1)).current;
  const ring2Opacity  = useRef(new Animated.Value(0)).current;
  const waveAnims     = useRef(
    Array.from({ length: WAVEFORM_BARS }, () => new Animated.Value(8))
  ).current;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const phaseRef          = useRef(phase);
  phaseRef.current        = phase;
  const orbLoopRef        = useRef(null);
  const ringLoopRef       = useRef(null);
  const waveTimersRef     = useRef([]);
  const rafRef            = useRef(null);
  const mediaStreamRef    = useRef(null);
  const mediaRecorderRef  = useRef(null);
  const audioCtxRef       = useRef(null);
  const analyserRef       = useRef(null);
  const chunksRef         = useRef([]);
  const ttsAudioRef       = useRef(null); // for OpenAI TTS playback

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setPhase('speaking-prompt');
      setTranscript('');
      setAnswerText('');
      setMicError(false);
      fadeIn();
      setTimeout(() => speakPrompt(), 300);
    } else {
      cleanup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ── Orb pulse ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const active = ['speaking-prompt', 'listening', 'speaking-answer', 'speaking-closing'].includes(phase);
    const dur      = phase === 'listening' ? 600 : 900;
    const maxScale = phase === 'listening' ? 1.14 : 1.08;

    if (orbLoopRef.current) { orbLoopRef.current.stop(); orbLoopRef.current = null; }
    orbScale.setValue(1);

    if (active) {
      orbLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(orbScale, { toValue: maxScale, duration: dur, useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(orbScale, { toValue: 1,        duration: dur, useNativeDriver: USE_NATIVE_DRIVER }),
        ])
      );
      orbLoopRef.current.start();
    }
    return () => { if (orbLoopRef.current) { orbLoopRef.current.stop(); orbLoopRef.current = null; } };
  }, [phase]);

  // ── Concentric rings ──────────────────────────────────────────────────────
  useEffect(() => {
    const active = ['speaking-prompt', 'listening', 'speaking-answer'].includes(phase);
    if (ringLoopRef.current) { ringLoopRef.current.stop(); ringLoopRef.current = null; }
    ring1Scale.setValue(1); ring1Opacity.setValue(active ? 0.4 : 0);
    ring2Scale.setValue(1); ring2Opacity.setValue(active ? 0.4 : 0);

    if (active) {
      ringLoopRef.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.parallel([
              Animated.timing(ring1Scale,   { toValue: 2.4, duration: 1600, useNativeDriver: USE_NATIVE_DRIVER }),
              Animated.timing(ring1Opacity, { toValue: 0,   duration: 1600, useNativeDriver: USE_NATIVE_DRIVER }),
            ]),
            Animated.parallel([
              Animated.timing(ring1Scale,   { toValue: 1,   duration: 0,    useNativeDriver: USE_NATIVE_DRIVER }),
              Animated.timing(ring1Opacity, { toValue: 0.4, duration: 0,    useNativeDriver: USE_NATIVE_DRIVER }),
            ]),
          ]),
          Animated.sequence([
            Animated.delay(500),
            Animated.parallel([
              Animated.timing(ring2Scale,   { toValue: 2.4, duration: 1600, useNativeDriver: USE_NATIVE_DRIVER }),
              Animated.timing(ring2Opacity, { toValue: 0,   duration: 1600, useNativeDriver: USE_NATIVE_DRIVER }),
            ]),
            Animated.parallel([
              Animated.timing(ring2Scale,   { toValue: 1,   duration: 0,    useNativeDriver: USE_NATIVE_DRIVER }),
              Animated.timing(ring2Opacity, { toValue: 0.4, duration: 0,    useNativeDriver: USE_NATIVE_DRIVER }),
            ]),
          ]),
        ])
      );
      ringLoopRef.current.start();
    }
    return () => { if (ringLoopRef.current) { ringLoopRef.current.stop(); ringLoopRef.current = null; } };
  }, [phase]);

  // ── Waveform bars (random timers — used for non-listening phases) ──────────
  useEffect(() => {
    // During 'listening' the waveform is driven by real AudioContext data (RAF loop)
    if (phase === 'listening') return;

    const isAnimating = ['speaking-prompt', 'speaking-answer', 'speaking-closing'].includes(phase);
    const maxH = 28;

    waveTimersRef.current.forEach(t => clearTimeout(t));
    waveTimersRef.current = [];

    if (isAnimating) {
      waveAnims.forEach((anim, i) => {
        const animate = () => {
          if (!['speaking-prompt', 'speaking-answer', 'speaking-closing'].includes(phaseRef.current)) return;
          const target = 8 + Math.random() * (maxH - 8);
          Animated.timing(anim, { toValue: target, duration: 130 + Math.random() * 80, useNativeDriver: false })
            .start(({ finished }) => {
              if (finished) waveTimersRef.current[i] = setTimeout(animate, 40 + Math.random() * 80);
            });
        };
        waveTimersRef.current[i] = setTimeout(animate, i * 35);
      });
    } else {
      waveAnims.forEach(a =>
        Animated.timing(a, { toValue: 8, duration: 300, useNativeDriver: false }).start()
      );
    }

    return () => {
      waveTimersRef.current.forEach(t => clearTimeout(t));
      waveTimersRef.current = [];
    };
  }, [phase]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fadeIn = () => {
    overlayOpacity.setValue(0);
    Animated.timing(overlayOpacity, { toValue: 1, duration: 380, useNativeDriver: USE_NATIVE_DRIVER }).start();
  };

  const fadeOut = (cb) => {
    Animated.timing(overlayOpacity, { toValue: 0, duration: 320, useNativeDriver: USE_NATIVE_DRIVER }).start(cb);
  };

  const stopMic = () => {
    // Cancel RAF loop
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (_) {}
    }
    // Close AudioContext
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (_) {}
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    // Stop stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
  };

  const cleanup = useCallback(() => {
    stopMic();
    waveTimersRef.current.forEach(t => clearTimeout(t));
    waveTimersRef.current = [];
    if (orbLoopRef.current)  { orbLoopRef.current.stop();  orbLoopRef.current  = null; }
    if (ringLoopRef.current) { ringLoopRef.current.stop(); ringLoopRef.current = null; }
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    if (ttsAudioRef.current) {
      try { ttsAudioRef.current.pause(); ttsAudioRef.current.src = ''; } catch (_) {}
      ttsAudioRef.current = null;
    }
  }, []);

  const finishAndClose = useCallback(() => {
    cleanup();
    setPhase('done');
    fadeOut(() => onClose());
  }, [cleanup, onClose]);

  // ── TTS ───────────────────────────────────────────────────────────────────
  // Uses OpenAI TTS via backend — handles Urdu, English, and mixed speech correctly.
  // Falls back to window.speechSynthesis only if the API call fails.
  const baseHost = API_BASE.replace(/\/api$/, '');

  const speakFallback = useCallback((text, onEnd) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.rate   = 0.95;
    utter.onend  = () => onEnd?.();
    utter.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utter);
  }, []);

  const speak = useCallback(async (text, onEnd) => {
    if (phaseRef.current === 'done') return;

    // Stop any previous TTS audio
    if (ttsAudioRef.current) {
      try { ttsAudioRef.current.pause(); ttsAudioRef.current.src = ''; } catch (_) {}
      ttsAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    try {
      const res = await aiTutorAPI.speakText({ text, assetType: 'qa_answer' });
      if (phaseRef.current === 'done') return;

      const urlPath = res?.asset?.urlPath;
      if (!urlPath) { speakFallback(text, onEnd); return; }

      const audio = new Audio(`${baseHost}${urlPath}`);
      ttsAudioRef.current = audio;
      audio.onended = () => {
        ttsAudioRef.current = null;
        onEnd?.();
      };
      audio.onerror = () => {
        ttsAudioRef.current = null;
        speakFallback(text, onEnd);
      };
      audio.play();
    } catch (_) {
      if (phaseRef.current !== 'done') speakFallback(text, onEnd);
    }
  }, [speakFallback, baseHost]);

  // ── Phase transitions ─────────────────────────────────────────────────────
  const speakPrompt = useCallback(() => {
    setPhase('speaking-prompt');
    speak(
      `Hi ${studentName || 'there'}, what's your question? I've paused the lecture for you.`,
      () => { if (phaseRef.current !== 'done') startListening(); }
    );
  }, [studentName, speak]);

  const speakNoQuestion = useCallback(() => {
    setPhase('speaking-closing');
    speak("No questions — let's continue the lecture.", () => finishAndClose());
  }, [speak, finishAndClose]);

  const handleQuestion = useCallback(async (question) => {
    setPhase('processing');
    try {
      let answer  = '';
      let rawRes  = null;

      if (sessionId) {
        rawRes = await aiTutorAPI.askQuestion(sessionId, question);
        answer = rawRes?.aiMessage?.content || rawRes?.answer || '';
      } else {
        rawRes = await lectureChatAPI.sendMessage(courseId, topicId, question);
        answer = rawRes?.aiMessage?.content || rawRes?.content || '';
      }

      if (!answer) answer = "I couldn't find a specific answer right now.";
      if (phaseRef.current === 'done') return;

      onQuestionAnswered?.(question, answer, rawRes);
      setAnswerText(answer);
      setPhase('speaking-answer');
      speak(answer, () => { if (phaseRef.current !== 'done') finishAndClose(); });
    } catch (_) {
      if (phaseRef.current === 'done') return;
      setPhase('speaking-closing');
      speak("Sorry, I couldn't get an answer right now. Let's continue.", () => finishAndClose());
    }
  }, [sessionId, courseId, topicId, speak, finishAndClose, onQuestionAnswered]);

  // ── MediaRecorder + Whisper recording ────────────────────────────────────
  const startListening = useCallback(async () => {
    setPhase('listening');
    setTranscript('');
    chunksRef.current = [];

    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      speakNoQuestion();
      return;
    }

    let stream;
    try {
      // noiseSuppression / echoCancellation are safe constraints — widely supported
      // Avoid sampleRate constraint — not supported in most browsers, breaks the stream
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl:  true,
          channelCount:     1,
        },
      });
    } catch (_) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (__) {
        setMicError(true);
        speakNoQuestion();
        return;
      }
    }

    mediaStreamRef.current = stream;

    // ── AudioContext — analysis only (waveform + silence detection) ───────────
    // We do NOT route MediaRecorder through the AudioContext — that breaks in many
    // browsers. Instead MediaRecorder reads the raw mic stream directly (which
    // already has noiseSuppression applied by the browser), and AudioContext is
    // used only to analyse levels for the waveform and adaptive silence detection.
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();

    // Resume in case browser started it suspended
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    const source = audioCtx.createMediaStreamSource(stream);

    // High-pass filter — cuts fan/car rumble below 120 Hz from the analysis signal
    const highpass = audioCtx.createBiquadFilter();
    highpass.type            = 'highpass';
    highpass.frequency.value = 120;
    highpass.Q.value         = 0.7;

    // Analyser — reads filtered levels for waveform + adaptive silence detection
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize               = 512;
    analyser.smoothingTimeConstant = 0.65;

    // Chain: mic → highpass → analyser (analysis only, not recorded)
    source.connect(highpass);
    highpass.connect(analyser);

    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray    = new Uint8Array(bufferLength);

    let hasSpoken        = false;
    let silenceStart     = null;
    let recordingStopped = false;

    // ── Adaptive noise floor calibration ─────────────────────────────────────
    // Measure background noise (fan, AC, car) for 400ms before listening starts.
    // Speech threshold = 2.5× the measured floor, but never below SILENCE_THRESHOLD.
    // This means the mic won't react to constant background noise at any level.
    let adaptiveThreshold = SILENCE_THRESHOLD;
    const calibrationSamples = [];
    const CALIBRATION_MS = 400;
    const calibrationStart = Date.now();
    let calibrated = false;

    const stopRecording = () => {
      if (recordingStopped) return;
      recordingStopped = true;
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (_) {}
      }
    };

    const rafLoop = () => {
      if (phaseRef.current !== 'listening' || recordingStopped) return;

      analyser.getByteTimeDomainData(dataArray);

      // RMS
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const n = (dataArray[i] - 128) / 128;
        sum += n * n;
      }
      const rms = Math.sqrt(sum / bufferLength);

      // Calibration phase — collect background noise samples
      if (!calibrated) {
        calibrationSamples.push(rms);
        if (Date.now() - calibrationStart >= CALIBRATION_MS) {
          // Use 90th percentile of samples as the noise floor
          calibrationSamples.sort((a, b) => a - b);
          const p90 = calibrationSamples[Math.floor(calibrationSamples.length * 0.9)] || 0;
          // Speech threshold = 2.5× noise floor, min SILENCE_THRESHOLD
          adaptiveThreshold = Math.max(p90 * 2.5, SILENCE_THRESHOLD);
          calibrated = true;
        }
        rafRef.current = requestAnimationFrame(rafLoop);
        return;
      }

      // Drive waveform bars — show level relative to adaptive threshold so
      // background noise doesn't make the bars bounce
      const level = Math.min(1, Math.max(0, (rms - adaptiveThreshold * 0.4) / (adaptiveThreshold * 2)));
      waveAnims.forEach((anim, i) => {
        const spread  = 0.55 + 0.45 * Math.abs(Math.sin(i * 0.7 + Date.now() * 0.004));
        const targetH = 8 + level * 36 * spread;
        Animated.timing(anim, { toValue: targetH, duration: 60, useNativeDriver: false }).start();
      });

      // Silence detection uses adaptive threshold — fan noise stays below it
      const isSilent = rms < adaptiveThreshold;
      if (isSilent) {
        if (!silenceStart) silenceStart = Date.now();
        const elapsed = Date.now() - silenceStart;
        const limit   = hasSpoken ? SILENCE_AFTER_SPEECH_MS : INITIAL_WAIT_MS;
        if (elapsed >= limit) { stopRecording(); return; }
      } else {
        hasSpoken    = true;
        silenceStart = null;
      }

      rafRef.current = requestAnimationFrame(rafLoop);
    };

    // ── MediaRecorder ───────────────────────────────────────────────────────
    const mimeType = (() => {
      const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      return types.find(t => MediaRecorder.isTypeSupported(t)) || '';
    })();

    // Record from raw mic stream — most reliable across all browsers
    // noiseSuppression constraint already cleans the audio at the browser level
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      // Clean up audio context and stream
      try { audioCtxRef.current?.close(); } catch (_) {}
      audioCtxRef.current = null;
      analyserRef.current = null;
      stream.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;

      if (phaseRef.current === 'done') return;

      const chunks = chunksRef.current;
      if (!chunks.length) { speakNoQuestion(); return; }

      // Transcribe via Whisper
      setPhase('transcribing');
      setTranscript('Transcribing your question…');

      try {
        const ext      = (mimeType || 'audio/webm').includes('ogg') ? 'ogg' : 'webm';
        const blob     = new Blob(chunks, { type: mimeType || 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, `question.${ext}`);
        // Prompt tells Whisper to expect mixed Urdu/English (Roman Urdu + English code-switching).
        // Whisper uses the prompt to bias its language model — dramatically improves accuracy
        // for words like "kya", "hai", "samajh", "aap", "yeh", "lekin", "matlab", etc.
        formData.append('prompt', 'The speaker may use a mix of English and Urdu or Roman Urdu. For example: kya, hai, aap, yeh, matlab, lekin, samajh, sawaal, jawab, theek, bilkul, haan, nahi, karo, bata, please explain, what is, how does.');

        const res  = await aiTutorAPI.transcribeAudio(formData);
        const text = (res.transcript?.text || res.transcript || '').trim();

        if (!text) { speakNoQuestion(); return; }

        setTranscript(text);
        handleQuestion(text);
      } catch (_) {
        speakNoQuestion();
      }
    };

    // Collect data every 250ms so we don't lose audio if stop fires late
    recorder.start(250);
    rafRef.current = requestAnimationFrame(rafLoop);
  }, [speakNoQuestion, handleQuestion, waveAnims]);

  // ── Status label ──────────────────────────────────────────────────────────
  const getStatusLabel = () => {
    switch (phase) {
      case 'speaking-prompt':  return 'Preparing to listen…';
      case 'listening':        return transcript || (micError ? 'Mic access denied.' : 'Speak your question now…');
      case 'transcribing':     return transcript || 'Transcribing…';
      case 'processing':       return 'Getting your answer…';
      case 'speaking-answer':  return answerText;
      case 'speaking-closing': return "No questions — let's continue.";
      default:                 return '';
    }
  };

  const getPhaseIcon = () => {
    switch (phase) {
      case 'transcribing':
      case 'processing':    return 'hourglass-outline';
      case 'listening':     return 'mic';
      default:              return 'volume-high';
    }
  };

  const getPhaseTitle = () => {
    switch (phase) {
      case 'speaking-prompt':  return 'AI Tutor Speaking';
      case 'listening':        return 'Listening…';
      case 'transcribing':     return 'Transcribing…';
      case 'processing':       return 'Processing Question';
      case 'speaking-answer':  return 'AI Tutor Answering';
      case 'speaking-closing': return 'Resuming Lecture';
      default:                 return '';
    }
  };

  if (!visible) return null;

  const orbColor = theme?.colors?.primary || '#FF8C42';
  const isWeb    = Platform.OS === 'web';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={finishAndClose}
    >
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: overlayOpacity },
          isWeb && { backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' },
        ]}
      >
        {/* ── Close button ── */}
        <TouchableOpacity style={styles.closeBtn} onPress={finishAndClose} activeOpacity={0.7}>
          <Icon name="close" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>

        {/* ── Phase pill ── */}
        <View style={[styles.titlePill, { borderColor: orbColor + '50', backgroundColor: orbColor + '18' }]}>
          <Icon name={getPhaseIcon()} size={14} color={orbColor} />
          <Text style={[styles.titlePillText, { color: orbColor }]}>{getPhaseTitle()}</Text>
        </View>

        {/* ── Orb + rings ── */}
        <View style={styles.orbArea}>
          <Animated.View style={[styles.ring, { borderColor: orbColor + '30', transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />
          <Animated.View style={[styles.ring, { borderColor: orbColor + '50', transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />
          <Animated.View
            style={[
              styles.orb,
              { backgroundColor: orbColor, transform: [{ scale: orbScale }], shadowColor: orbColor },
              isWeb && { boxShadow: `0 0 40px 12px ${orbColor}55` },
            ]}
          >
            <Icon name={getPhaseIcon()} size={40} color="#fff" />
          </Animated.View>
        </View>

        {/* ── Waveform ── */}
        <View style={styles.waveform}>
          {waveAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[styles.waveBar, { height: anim, backgroundColor: orbColor, opacity: 0.6 + (i % 4) * 0.1 }]}
            />
          ))}
        </View>

        {/* ── Status text ── */}
        <Text style={styles.statusLabel} numberOfLines={5}>{getStatusLabel()}</Text>

        {/* ── Mic hint (listening only) ── */}
        {phase === 'listening' && !micError && (
          <Text style={styles.micHint}>Supports English, Urdu &amp; Roman Urdu</Text>
        )}

        {/* ── Skip button ── */}
        <TouchableOpacity style={styles.skipBtn} onPress={finishAndClose} activeOpacity={0.7}>
          <Icon name="play-skip-forward-outline" size={16} color="rgba(255,255,255,0.7)" />
          <Text style={styles.skipText}>Skip — Resume Lecture</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5,5,18,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  closeBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  titlePillText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  orbArea: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
  },
  orb: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 30,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 52,
  },
  waveBar: {
    width: 4,
    borderRadius: 3,
    minHeight: 8,
  },
  statusLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 26,
    paddingHorizontal: 24,
    fontStyle: 'italic',
  },
  micHint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    textAlign: 'center',
  },
  skipBtn: {
    position: 'absolute',
    bottom: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
});

export default VoiceQAOverlay;
