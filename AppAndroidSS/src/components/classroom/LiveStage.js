// LiveStage — the "Stage Director" layer that turns the backend's teaching
// decision (narration_segments + teaching_sequence + board_content) into a
// living, choreographed AI teacher: an avatar that changes what it is *doing*
// per beat, a synced live caption, a beat timeline, and animated reveals.
//
// Everything here is driven by `teachingProgress` (0..1) which the screen
// already keeps in lockstep with real audio position — so the choreography
// stays in sync with the tutor's actual voice for free.

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AITeacherAvatar from './AITeacherAvatar';

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

// ─── Per-beat "what the teacher is doing right now" metadata ────────────────
const ACTIVITY = {
  intro:      { label: 'Setting the scene', icon: 'navigate-outline',           color: '#8b5cf6' },
  explain:    { label: 'Explaining',         icon: 'chatbubble-ellipses-outline', color: '#6366f1' },
  code:       { label: 'Writing code',       icon: 'code-slash-outline',          color: '#22d3ee' },
  diagram:    { label: 'Drawing it out',     icon: 'git-network-outline',         color: '#8b5cf6' },
  comparison: { label: 'Comparing side by side', icon: 'swap-horizontal-outline', color: '#06b6d4' },
  whiteboard: { label: 'On the whiteboard',  icon: 'create-outline',              color: '#10b981' },
  slide:      { label: 'Walking the key points', icon: 'easel-outline',           color: '#f59e0b' },
  example:    { label: 'Giving an example',  icon: 'bulb-outline',                color: '#f59e0b' },
  analogy:    { label: 'A simple analogy',   icon: 'color-wand-outline',          color: '#ec4899' },
  checkpoint: { label: 'Quick check',        icon: 'help-circle-outline',         color: '#fb923c' },
  recap:      { label: 'Quick recap',        icon: 'repeat-outline',              color: '#34d399' },
};

export const beatActivity = (beat) => ACTIVITY[beat?.activity || beat?.kind] || ACTIVITY.explain;

// Map the backend's chosen board/visual mode to an "explain" sub-activity so the
// avatar says "Writing code" / "Drawing it out" instead of a flat "Explaining".
function explainActivityFor(board, visualMode) {
  const type = board?.type || '';
  if (type === 'code' || visualMode === 'code') return 'code';
  if (type === 'diagram' || type === 'flowchart' || visualMode === 'diagram' || visualMode === 'flowchart') return 'diagram';
  if (type === 'comparison_table' || visualMode === 'comparison_table') return 'comparison';
  if (type === 'slide_summary' || type === 'recap' || visualMode === 'slide') return 'slide';
  if (type === 'whiteboard_notes' || type === 'narration' || visualMode === 'whiteboard') return 'whiteboard';
  return 'explain';
}

// ─── Decompose a chunk into ordered teaching beats with progress windows ─────
export function buildTeachingBeats({ chunk, delivery, narration }) {
  if (!chunk) return [];
  const plan = delivery?.teaching_plan || {};
  const board = delivery?.board_content || null;
  const examples = Array.isArray(chunk.examples) ? chunk.examples : [];

  const transition = `${delivery?.transition_text || plan.transition_in || ''}`.trim();
  const explain = `${chunk.spokenExplanation || narration || chunk.text || ''}`.trim();
  const wantsExample = Boolean(plan.use_example ?? delivery?.use_example);
  const wantsAnalogy = Boolean(plan.use_analogy ?? delivery?.use_analogy);
  const example = wantsExample && examples[0] ? `${examples[0]}`.trim() : '';
  const analogy = wantsAnalogy ? `${chunk.analogyIfHelpful || ''}`.trim() : '';
  const checkpoint = `${delivery?.checkpoint_text || chunk.checkpointQuestion || ''}`.trim();

  const beats = [];
  if (transition) beats.push({ kind: 'intro', text: transition });
  if (explain) beats.push({ kind: 'explain', activity: explainActivityFor(board, chunk.visualMode), text: explain, showsBoard: true });
  if (example) beats.push({ kind: 'example', text: example });
  if (analogy) beats.push({ kind: 'analogy', text: analogy });
  if (checkpoint) beats.push({ kind: 'checkpoint', text: checkpoint });
  if (!beats.length) beats.push({ kind: 'explain', activity: explainActivityFor(board, chunk.visualMode), text: explain || chunk.summary || chunk.title || '', showsBoard: true });

  // Weight each beat's progress window by its spoken length so the active beat
  // tracks roughly where the voice actually is.
  const total = beats.reduce((s, b) => s + Math.max(12, b.text.length), 0) || 1;
  let acc = 0;
  return beats.map((b, i) => {
    const w = Math.max(12, b.text.length) / total;
    const start = acc;
    acc += w;
    return { ...b, id: `${chunk.id || 'c'}-${i}`, index: i, start, end: i === beats.length - 1 ? 1 : acc };
  });
}

export function activeBeatFor(beats, progress) {
  if (!beats || !beats.length) return null;
  const p = clamp(progress);
  return beats.find((b) => p >= b.start && p < b.end) || beats[beats.length - 1];
}

// ─── Animated entrance wrapper — nothing should ever just "pop" in ──────────
export function Reveal({ children, active = true, delay = 0, from = 14, style }) {
  const anim = useRef(new Animated.Value(active ? 0 : 0)).current;
  useEffect(() => {
    if (!active) return undefined;
    const a = Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    a.start();
    return () => a.stop();
  }, [active, delay]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ─── Live caption — reveals words in lockstep with the active beat's progress.
// Acts like real lecture subtitles: a sliding window of the most-recent spoken
// words so the height stays fixed and the leading word is always in view.
export function StageCaption({ text, progress = 1, color = '#a5b4fc', playing = true, windowWords = 0, size = 16 }) {
  const words = useMemo(() => `${text || ''}`.split(/\s+/).filter(Boolean), [text]);
  if (!words.length) return null;
  const shown = playing
    ? clamp(Math.ceil(words.length * clamp(progress)), 0, words.length)
    : words.length;
  const done = shown >= words.length;
  const start = windowWords > 0 ? Math.max(0, shown - windowWords) : 0;
  const visible = words.slice(start, shown).join(' ');
  return (
    <Text style={[captionStyles.text, { fontSize: size, lineHeight: Math.round(size * 1.5) }]}>
      {start > 0 ? '… ' : ''}
      {visible}
      {playing && !done ? <Text style={[captionStyles.cursor, { color }]}> ▍</Text> : null}
    </Text>
  );
}

// ─── The morphing "Now: <activity>" pill ────────────────────────────────────
export function ActivityPill({ beat, paused }) {
  const a = beatActivity(beat);
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    if (!paused) loop.start();
    return () => loop.stop();
  }, [beat?.id, paused]);
  const dotOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  return (
    <View style={[pillStyles.wrap, { borderColor: `${a.color}66`, backgroundColor: `${a.color}1f` }]}>
      <Animated.View style={[pillStyles.dot, { backgroundColor: a.color, opacity: paused ? 0.4 : dotOpacity }]} />
      <Icon name={a.icon} size={14} color={a.color} />
      <Text style={[pillStyles.label, { color: a.color }]}>{paused ? 'Paused' : a.label}</Text>
    </View>
  );
}

// ─── Beat timeline — the lesson choreography as a row of stepping dots ───────
export function BeatTimeline({ beats, activeIndex }) {
  if (!beats || beats.length < 2) return null;
  return (
    <View style={timelineStyles.row}>
      {beats.map((b, i) => {
        const a = beatActivity(b);
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;
        return (
          <View key={b.id} style={timelineStyles.item}>
            <View
              style={[
                timelineStyles.pip,
                { borderColor: a.color },
                isActive && { backgroundColor: a.color, transform: [{ scale: 1.25 }] },
                isDone && { backgroundColor: `${a.color}aa` },
              ]}
            >
              <Icon name={a.icon} size={11} color={isActive || isDone ? '#0b1020' : a.color} />
            </View>
            {i < beats.length - 1 && (
              <View style={[timelineStyles.line, { backgroundColor: isDone ? `${a.color}aa` : 'rgba(255,255,255,0.12)' }]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Tutor presence — the living teacher column ─────────────────────────────
export function TutorPresence({
  avatarState,
  beats,
  activeBeat,
  captionText,
  beatProgress,
  playing,
  compact = false,
}) {
  const a = beatActivity(activeBeat);
  return (
    <View style={[presenceStyles.wrap, compact && presenceStyles.wrapCompact, { borderColor: `${a.color}33` }]}>
      <View style={[presenceStyles.glow, { backgroundColor: a.color }]} pointerEvents="none" />
      <View style={compact ? presenceStyles.avatarRowCompact : presenceStyles.avatarWrap}>
        <AITeacherAvatar state={avatarState} size={compact ? 58 : 96} showLabel={false} />
        {compact && (
          <View style={presenceStyles.compactMeta}>
            <ActivityPill beat={activeBeat} paused={!playing} />
            <BeatTimeline beats={beats} activeIndex={activeBeat?.index ?? 0} />
          </View>
        )}
      </View>

      {!compact && (
        <>
          <ActivityPill beat={activeBeat} paused={!playing} />
          <BeatTimeline beats={beats} activeIndex={activeBeat?.index ?? 0} />
        </>
      )}

      <View style={[presenceStyles.captionCard, { borderColor: `${a.color}2e` }]}>
        <View style={presenceStyles.captionHeader}>
          <Icon name={a.icon} size={12} color={a.color} />
          <Text style={[presenceStyles.captionTag, { color: a.color }]}>{(activeBeat?.kind || 'explain').toUpperCase()}</Text>
        </View>
        <StageCaption text={captionText} progress={beatProgress} color={a.color} playing={playing} />
      </View>
    </View>
  );
}

const captionStyles = StyleSheet.create({
  text: { color: '#e2e8f0', fontSize: 14, lineHeight: 22 },
  cursor: { fontWeight: '700' },
});

const pillStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
});

const timelineStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  item: { flexDirection: 'row', alignItems: 'center' },
  pip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  line: { width: 18, height: 2, borderRadius: 1, marginHorizontal: 2 },
});

const presenceStyles = StyleSheet.create({
  wrap: {
    width: 250,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(8,10,24,0.55)',
    overflow: 'hidden',
  },
  wrapCompact: { width: '100%', alignItems: 'stretch', gap: 10, paddingVertical: 12 },
  glow: {
    position: 'absolute',
    top: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.16,
  },
  avatarWrap: { alignItems: 'center', justifyContent: 'center' },
  avatarRowCompact: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  compactMeta: { flex: 1, gap: 8 },
  captionCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(2,6,23,0.55)',
    minHeight: 92,
  },
  captionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  captionTag: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
});

export default TutorPresence;
