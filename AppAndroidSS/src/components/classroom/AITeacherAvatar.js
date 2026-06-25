import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import SpeakingWaveform from './SpeakingWaveform';

const STATES = {
  idle:      { label: 'Ready',     color: '#7c3aed', bg: '#1e1040', icon: 'school-outline',         pulse: false },
  speaking:  { label: 'Speaking',  color: '#6C63FF', bg: '#0d0d2b', icon: 'volume-high-outline',     pulse: true  },
  thinking:  { label: 'Thinking',  color: '#f59e0b', bg: '#1c1400', icon: 'bulb-outline',            pulse: true  },
  listening: { label: 'Listening', color: '#10b981', bg: '#001a14', icon: 'mic-outline',             pulse: true  },
  complete:  { label: 'Done',      color: '#34d399', bg: '#002918', icon: 'checkmark-circle-outline', pulse: false },
};

const NUM_PARTICLES = 6;

function OrbitParticle({ color, index, total, orbitRadius, active }) {
  const angleAnim = useRef(new Animated.Value((index / total) * Math.PI * 2)).current;
  const opacityAnim = useRef(new Animated.Value(active ? 0.7 : 0)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.timing(angleAnim, {
          toValue: (index / total) * Math.PI * 2 + Math.PI * 2,
          duration: 3200 + index * 300,
          useNativeDriver: true,
        })
      ).start();
      Animated.timing(opacityAnim, { toValue: 0.7, duration: 400, useNativeDriver: true }).start();
    } else {
      Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [active]);

  const x = angleAnim.interpolate({
    inputRange: [0, Math.PI * 2],
    outputRange: [orbitRadius, orbitRadius],
  });

  const translateX = angleAnim.interpolate({
    inputRange: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, Math.PI * 2],
    outputRange: [orbitRadius, 0, -orbitRadius, 0, orbitRadius],
  });
  const translateY = angleAnim.interpolate({
    inputRange: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, Math.PI * 2],
    outputRange: [0, orbitRadius * 0.4, 0, -orbitRadius * 0.4, 0],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          opacity: opacityAnim,
          transform: [{ translateX }, { translateY }],
        },
      ]}
    />
  );
}

export default function AITeacherAvatar({ state = 'idle', size = 110, showLabel = true, minimal = false, compact = false }) {
  const cfg = STATES[state] || STATES.idle;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const ringScaleAnim = useRef(new Animated.Value(1)).current;
  const loopRef = useRef(null);
  const spinRef = useRef(null);

  useEffect(() => {
    if (loopRef.current) loopRef.current.stop();
    if (spinRef.current) spinRef.current.stop();

    if (cfg.pulse) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 1, duration: 900, useNativeDriver: false }),
            Animated.timing(ringScaleAnim, { toValue: 1.18, duration: 900, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.3, duration: 900, useNativeDriver: false }),
            Animated.timing(ringScaleAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          ]),
        ])
      );
      loopRef.current.start();
    } else {
      Animated.parallel([
        Animated.timing(pulseAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 350, useNativeDriver: false }),
        Animated.timing(ringScaleAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
    }

    if (state === 'thinking') {
      spinRef.current = Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 2800, useNativeDriver: true })
      );
      spinRef.current.start();
    } else {
      rotateAnim.setValue(0);
    }

    return () => {
      loopRef.current?.stop();
      spinRef.current?.stop();
    };
  }, [state]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.55] });
  const iconSize = size * 0.36;
  const orbitRadius = size * 0.58;
  const particlesActive = cfg.pulse;

  if (compact) {
    return (
      <Animated.View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: cfg.bg,
            borderColor: cfg.color,
            transform: [{ scale: pulseAnim }],
            ...(Platform.OS === 'web'
              ? { boxShadow: `0 0 10px ${cfg.color}99, 0 0 20px ${cfg.color}44` }
              : {}),
          },
        ]}
      >
        <Animated.View style={state === 'thinking' ? { transform: [{ rotate }] } : null}>
          <Icon name={cfg.icon} size={size * 0.44} color={cfg.color} />
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <View style={[styles.wrapper, { width: minimal ? size * 1.3 : size * 2.2, paddingVertical: minimal ? 2 : 12 }]}>
      {/* Outer glow halo */}
      {!minimal && (
      <Animated.View
        style={[
          styles.halo,
          {
            width: size * 1.7,
            height: size * 1.7,
            borderRadius: (size * 1.7) / 2,
            backgroundColor: cfg.color,
            opacity: glowOpacity,
            transform: [{ scale: ringScaleAnim }],
          },
        ]}
      />
      )}

      {/* Orbit ring */}
      {!minimal && (
      <Animated.View
        style={[
          styles.orbitRing,
          {
            width: size * 1.45,
            height: size * 1.45,
            borderRadius: (size * 1.45) / 2,
            borderColor: cfg.color,
            opacity: glowOpacity,
            transform: [{ scale: ringScaleAnim }],
          },
        ]}
      />
      )}

      {/* Orbiting particles */}
      {!minimal && (
      <View
        style={[
          styles.particleContainer,
          { width: size * 1.45, height: size * 1.45 },
        ]}
      >
        {Array.from({ length: NUM_PARTICLES }).map((_, i) => (
          <OrbitParticle
            key={i}
            color={cfg.color}
            index={i}
            total={NUM_PARTICLES}
            orbitRadius={orbitRadius}
            active={particlesActive}
          />
        ))}
      </View>
      )}

      {/* Avatar core */}
      <Animated.View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: cfg.bg,
            borderColor: cfg.color,
            transform: [{ scale: pulseAnim }],
            ...(Platform.OS === 'web'
              ? { boxShadow: `0 0 40px ${cfg.color}66, 0 0 80px ${cfg.color}33` }
              : {}),
          },
        ]}
      >
        <Animated.View style={state === 'thinking' ? { transform: [{ rotate }] } : null}>
          <Icon name={cfg.icon} size={iconSize} color={cfg.color} />
        </Animated.View>
      </Animated.View>

      {/* Speaking waveform */}
      {!minimal && (
        <View style={styles.waveformRow}>
          <SpeakingWaveform active={state === 'speaking'} color={cfg.color} />
        </View>
      )}

      {/* Status badge */}
      {showLabel && !minimal && (
        <View style={[styles.statusBadge, { borderColor: cfg.color }]}>
          <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      )}

      {!minimal && <Text style={styles.brandLabel}>SkillSphere AI</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  halo: {
    position: 'absolute',
  },
  orbitRing: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  particleContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    zIndex: 2,
  },
  waveformRow: {
    marginTop: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    marginTop: 6,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  brandLabel: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    marginTop: 7,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
