import React, { useEffect, useRef } from 'react';
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
        }).start();
      });
    }

    return () => loops.current.forEach(l => l && l.stop());
  }, [active]);

  return (
    <View style={styles.container}>
      {BARS.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              height: bar.maxH,
              backgroundColor: color,
              transform: [{ scaleY: anims[i] }],
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
    height: 44,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});
