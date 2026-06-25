// IntelligentWhiteboard — the AI tutor "writes" on a real whiteboard as it
// teaches: a heading with a hand-drawn underline, notes written marker-by-marker
// (word-by-word, synced to the voice via `progress`), key terms in sketchy
// boxes, and a highlighted takeaway. Everything reveals in lockstep with the
// narration so it feels like a teacher writing live on the board.

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';

const HAND_FONT = Platform.OS === 'web'
  ? "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', 'Comic Sans', cursive"
  : undefined;

// A teacher's marker set — notes cycle through these "ink" colours.
const MARKERS = ['#1e293b', '#2563eb', '#dc2626', '#7c3aed', '#0d9488'];

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

// Reveal text word-by-word up to localProgress (0..1). When not playing, show all.
function visibleWords(text, localProgress, playing) {
  const words = `${text || ''}`.split(/\s+/).filter(Boolean);
  if (!words.length) return { text: '', done: true };
  if (!playing) return { text: words.join(' '), done: true };
  const shown = clamp(Math.ceil(words.length * clamp(localProgress)), 0, words.length);
  return { text: words.slice(0, shown).join(' '), done: shown >= words.length };
}

// Blinking marker tip shown at the line currently being written.
function MarkerTip({ color }) {
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(blink, { toValue: 0.2, duration: 380, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(blink, { toValue: 1, duration: 380, useNativeDriver: Platform.OS !== 'web' }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.Text style={[styles.markerTip, { color, opacity: blink }]}> ✎</Animated.Text>;
}

export default function IntelligentWhiteboard({
  title,
  notes = [],
  keyTerms = [],
  emphasis = '',
  progress = 1,
  playing = true,
  width,
  accent = '#2563eb',
}) {
  const cleanNotes = useMemo(
    () => (Array.isArray(notes) ? notes.map((n) => `${n}`.trim()).filter(Boolean) : []),
    [notes]
  );
  const cleanTerms = useMemo(
    () => (Array.isArray(keyTerms) ? keyTerms
      .map((t) => (t && typeof t === 'object' ? `${t.term || t.label || t.name || ''}` : `${t}`))
      .map((t) => t.trim()).filter(Boolean).slice(0, 6) : []),
    [keyTerms]
  );

  // Build a timeline: heading → notes (weighted by length) → key terms → takeaway.
  const timeline = useMemo(() => {
    const HEAD = 0.1;
    const TERMS = cleanTerms.length ? 0.12 : 0;
    const EMPH = emphasis ? 0.1 : 0;
    const notesSpan = Math.max(0.001, 1 - HEAD - TERMS - EMPH);
    const totalLen = cleanNotes.reduce((s, n) => s + Math.max(10, n.length), 0) || 1;
    let acc = HEAD;
    const noteWindows = cleanNotes.map((n) => {
      const w = (Math.max(10, n.length) / totalLen) * notesSpan;
      const start = acc; acc += w;
      return { start, end: acc };
    });
    return {
      heading: { start: 0, end: HEAD },
      notes: noteWindows,
      terms: { start: acc, end: acc + TERMS },
      emphasis: { start: acc + TERMS, end: 1 },
    };
  }, [cleanNotes, cleanTerms.length, emphasis]);

  const p = clamp(progress);
  const headLocal = clamp(p / Math.max(0.0001, timeline.heading.end));
  // Active note = the one currently being written.
  const activeNoteIdx = playing
    ? timeline.notes.findIndex((w) => p >= w.start && p < w.end)
    : -1;
  const termsLocal = clamp((p - timeline.terms.start) / Math.max(0.0001, timeline.terms.end - timeline.terms.start));
  const emphLocal = clamp((p - timeline.emphasis.start) / Math.max(0.0001, timeline.emphasis.end - timeline.emphasis.start));

  return (
    <View style={[styles.board, width ? { width, maxWidth: width } : null]}>
      {/* marker tray */}
      <View style={styles.tray}>
        <View style={[styles.trayMarker, { backgroundColor: '#dc2626' }]} />
        <View style={[styles.trayMarker, { backgroundColor: '#2563eb' }]} />
        <View style={[styles.trayMarker, { backgroundColor: '#059669' }]} />
        <View style={styles.trayEraser} />
      </View>

      <View style={styles.surface}>
        {/* Heading with hand-drawn underline */}
        {!!title && (
          <View style={styles.headingWrap}>
            <Text style={[styles.heading, { color: '#0f172a' }]} numberOfLines={2}>
              {visibleWords(title, headLocal, playing).text}
              {playing && headLocal < 1 ? <MarkerTip color={accent} /> : null}
            </Text>
            <View style={[styles.underline, { backgroundColor: accent, width: `${Math.round(clamp(headLocal) * 100)}%` }]} />
          </View>
        )}

        {/* Notes — written marker-by-marker */}
        <View style={styles.notes}>
          {cleanNotes.map((note, i) => {
            const win = timeline.notes[i] || { start: 0, end: 1 };
            const localP = clamp((p - win.start) / Math.max(0.0001, win.end - win.start));
            if (playing && p < win.start) return null; // not written yet
            const ink = MARKERS[i % MARKERS.length];
            const v = visibleWords(note, localP, playing);
            return (
              <View key={`wbn-${i}`} style={styles.noteRow}>
                <Text style={[styles.noteBullet, { color: ink }]}>▸</Text>
                <Text style={[styles.noteText, { color: ink }]}>
                  {v.text}
                  {playing && i === activeNoteIdx && !v.done ? <MarkerTip color={ink} /> : null}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Key terms in sketchy boxes */}
        {cleanTerms.length > 0 && (!playing || p >= timeline.terms.start) && (
          <View style={styles.termsWrap}>
            {cleanTerms.map((t, i) => {
              const reveal = !playing || termsLocal >= (i + 1) / (cleanTerms.length + 0.5);
              if (!reveal) return null;
              const tilt = (i % 2 === 0 ? -1 : 1) * (1 + (i % 3));
              return (
                <View key={`wbt-${i}`} style={[styles.termBox, { borderColor: MARKERS[(i + 1) % MARKERS.length], transform: [{ rotate: `${tilt}deg` }] }]}>
                  <Text style={[styles.termText, { color: MARKERS[(i + 1) % MARKERS.length] }]}>{t}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Highlighted takeaway */}
        {!!emphasis && (!playing || p >= timeline.emphasis.start) && (
          <View style={styles.emphWrap}>
            <View style={styles.highlight} />
            <Text style={styles.emphText}>{visibleWords(emphasis, emphLocal, playing).text}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    width: '100%',
    maxWidth: 880,
    alignSelf: 'center',
    borderRadius: 14,
    backgroundColor: '#5b4636', // wooden frame
    padding: 10,
    ...(Platform.OS === 'web' ? { boxShadow: '0 16px 44px rgba(0,0,0,0.45)' } : {}),
  },
  tray: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingBottom: 8 },
  trayMarker: { width: 34, height: 7, borderRadius: 4 },
  trayEraser: { width: 26, height: 12, borderRadius: 3, backgroundColor: '#cbd5e1', marginLeft: 6 },
  surface: {
    backgroundColor: '#fcfcf7',
    borderRadius: 8,
    padding: 22,
    minHeight: 220,
    gap: 16,
    ...(Platform.OS === 'web'
      ? { backgroundImage: 'linear-gradient(180deg,#ffffff,#f6f6ef)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.06)' }
      : {}),
  },
  headingWrap: { gap: 6 },
  heading: { fontSize: 26, fontWeight: '800', fontFamily: HAND_FONT, lineHeight: 34 },
  underline: { height: 4, borderRadius: 3, maxWidth: '100%' },
  notes: { gap: 12 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  noteBullet: { fontSize: 20, lineHeight: 28, fontWeight: '900' },
  noteText: { flex: 1, fontSize: 20, lineHeight: 30, fontFamily: HAND_FONT, fontWeight: '600' },
  markerTip: { fontSize: 18, fontWeight: '900' },
  termsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  termBox: {
    borderWidth: 2, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  termText: { fontSize: 16, fontWeight: '800', fontFamily: HAND_FONT },
  emphWrap: { marginTop: 4, justifyContent: 'center' },
  highlight: {
    position: 'absolute', left: -4, right: -4, top: 4, bottom: 4,
    backgroundColor: 'rgba(250,204,21,0.55)', borderRadius: 4,
    transform: [{ rotate: '-0.6deg' }],
  },
  emphText: { fontSize: 18, lineHeight: 27, color: '#1f2937', fontWeight: '700', fontFamily: HAND_FONT, paddingHorizontal: 4, paddingVertical: 2 },
});
