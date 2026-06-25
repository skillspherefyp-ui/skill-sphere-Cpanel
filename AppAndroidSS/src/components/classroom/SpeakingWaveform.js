import React, { useEffect, useRef } from 'react';
<<<<<<< HEAD
import { View, Animated, Easing, StyleSheet, Platform } from 'react-native';

function makeBars(count) {
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const peak = Math.sin(t * Math.PI);
    return {
      maxH:    Math.round(5 + peak * 46),
      idleH:   Math.round(3 + peak * 9),
      dur:     Math.round(340 - peak * 175),
      opacity: 0.22 + peak * 0.78,
    };
  });
}

const DEFAULT_BARS = makeBars(7);

export default function SpeakingWaveform({ active = false, color = '#6C63FF', numBars }) {
  const barsData = numBars ? makeBars(numBars) : DEFAULT_BARS;
  const anims = useRef(barsData.map(b => new Animated.Value(b.idleH / b.maxH))).current;
  const activeRef = useRef(false);
  const noiseRef = useRef(barsData.map(() => 0.9));
  const runningAnims = useRef([]);

  // Recursive per-bar animation — picks a new smoothed-noise target each cycle.
  // Avoids a secondary useEffect so nothing can interrupt the running animations.
  function startBar(i, bar, isFirst) {
    if (!activeRef.current) return;

    // Low-pass smoothed noise: blend previous target with a new random value
    const raw = 0.80 + Math.random() * 0.18;           // 0.80–0.98
    const smoothed = noiseRef.current[i] * 0.65 + raw * 0.35;
    noiseRef.current[i] = smoothed;
    const topVal = Math.min(0.97, smoothed);
    const botVal = 0.05 + Math.random() * 0.07;        // 0.05–0.12

    const phaseDelay = isFirst ? Math.round((i / barsData.length) * 280) : 0;
    const steps = [
      ...(phaseDelay > 0 ? [Animated.delay(phaseDelay)] : []),
      Animated.timing(anims[i], {
        toValue: topVal,
        duration: bar.dur,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(anims[i], {
        toValue: botVal,
        duration: bar.dur,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ];

    const seq = Animated.sequence(steps);
    runningAnims.current[i] = seq;
    seq.start(({ finished }) => {
      // Only continue if this cycle completed naturally AND we're still active
      if (finished && activeRef.current) startBar(i, bar, false);
    });
  }

  useEffect(() => {
    // Stop everything cleanly first
    runningAnims.current.forEach(a => a?.stop());
    runningAnims.current = [];
    activeRef.current = active;

    if (active) {
      noiseRef.current = barsData.map(() => 0.9);
      barsData.forEach((bar, i) => startBar(i, bar, true));
    } else {
      barsData.forEach((bar, i) => {
        Animated.spring(anims[i], {
          toValue: bar.idleH / bar.maxH,
          useNativeDriver: true,
          tension: 55,
          friction: 10,
=======
import { View, Animated, StyleSheet } from 'react-native';

const BARS = [
  { maxH: 14, dur: 340 },
  { maxH: 22, dur: 260 },
  { maxH: 32, dur: 200 },
  { maxH: 40, dur: 170 },
  { maxH: 32, dur: 200 },
  { maxH: 22, dur: 260 },
  { maxH: 14, dur: 340 },
];

export default function SpeakingWaveform({ active = false, color = '#6C63FF' }) {
  const anims = useRef(BARS.map(() => new Animated.Value(0.08))).current;
  const loops = useRef([]);

  useEffect(() => {
    loops.current.forEach(l => l && l.stop());
    loops.current = [];

    if (active) {
      BARS.forEach((bar, i) => {
        const delay = i * 55;
        const loop = Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anims[i], {
              toValue: 0.9,
              duration: bar.dur,
              useNativeDriver: true,
            }),
            Animated.timing(anims[i], {
              toValue: 0.1,
              duration: bar.dur,
              useNativeDriver: true,
            }),
          ])
        );
        loop.start();
        loops.current.push(loop);
      });
    } else {
      anims.forEach(anim => {
        Animated.spring(anim, {
          toValue: 0.08,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
        }).start();
      });
    }

<<<<<<< HEAD
    return () => {
      activeRef.current = false;
      runningAnims.current.forEach(a => a?.stop());
    };
=======
    return () => loops.current.forEach(l => l && l.stop());
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
  }, [active]);

  return (
    <View style={styles.container}>
<<<<<<< HEAD
      {barsData.map((bar, i) => (
=======
      {BARS.map((bar, i) => (
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              height: bar.maxH,
              backgroundColor: color,
<<<<<<< HEAD
              opacity: bar.opacity,
              transform: [{ scaleY: anims[i] }],
              ...(Platform.OS === 'web'
                ? { boxShadow: `0 0 8px ${color}cc, 0 0 3px ${color}` }
                : {}),
=======
              transform: [{ scaleY: anims[i] }],
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
<<<<<<< HEAD
    height: 52,
  },
  bar: {
    width: 3,
=======
    height: 44,
  },
  bar: {
    width: 4,
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
    borderRadius: 2,
  },
});
