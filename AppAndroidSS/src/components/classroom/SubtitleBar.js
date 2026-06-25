import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';

export default function SubtitleBar({ text = '', visible = true, color = '#3b82f6' }) {
  const [displayed, setDisplayed] = useState('');
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  useEffect(() => {
    if (!text) {
      setDisplayed('');
      return;
    }

    // Typewriter effect — reveal word by word for readability
    const words = text.split(' ');
    indexRef.current = 0;
    setDisplayed('');

    const tick = () => {
      if (indexRef.current >= words.length) return;
      const chunk = Math.min(3, words.length - indexRef.current); // 3 words at a time
      indexRef.current += chunk;
      setDisplayed(words.slice(0, indexRef.current).join(' '));
      if (indexRef.current < words.length) {
        timerRef.current = setTimeout(tick, 120);
      }
    };

    timerRef.current = setTimeout(tick, 60);
    return () => clearTimeout(timerRef.current);
  }, [text]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
      <View style={[styles.bar, { borderTopColor: color }]}>
        <View style={[styles.indicator, { backgroundColor: color }]} />
        <Text style={styles.text} numberOfLines={3}>{displayed || ' '}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 56,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  bar: {
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderTopWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    } : {}),
  },
  indicator: {
    width: 3,
    height: '100%',
    minHeight: 20,
    borderRadius: 2,
    marginTop: 2,
    flexShrink: 0,
  },
  text: {
    color: '#f1f5f9',
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
});
