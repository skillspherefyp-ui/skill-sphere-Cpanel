import React, { useEffect, useRef } from 'react';
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
        }).start();
      });
    }

    return () => {
      activeRef.current = false;
      runningAnims.current.forEach(a => a?.stop());
    };
  }, [active]);

  return (
    <View style={styles.container}>
      {barsData.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              height: bar.maxH,
              backgroundColor: color,
              opacity: bar.opacity,
              transform: [{ scaleY: anims[i] }],
              ...(Platform.OS === 'web'
                ? { boxShadow: `0 0 8px ${color}cc, 0 0 3px ${color}` }
                : {}),
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
    height: 52,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});
