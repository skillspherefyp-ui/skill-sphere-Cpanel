import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet } from 'react-native';

export default function TypingText({ text = '', style, onDone, chunkMs = 28 }) {
  const [displayed, setDisplayed] = useState('');
  const timerRef = useRef(null);
  const indexRef = useRef(0);
  const textRef = useRef(text);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    indexRef.current = 0;
    textRef.current = text;
    setDisplayed('');

    if (!text) return;

    timerRef.current = setInterval(() => {
      indexRef.current += 1;
      const slice = textRef.current.slice(0, indexRef.current);
      setDisplayed(slice);

      if (indexRef.current >= textRef.current.length) {
        clearInterval(timerRef.current);
        if (onDone) onDone();
      }
    }, chunkMs);

    return () => clearInterval(timerRef.current);
  }, [text]);

  return (
    <Text style={[styles.text, style]}>
      {displayed}
      <Text style={styles.cursor}>|</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 24,
  },
  cursor: {
    color: '#6C63FF',
    fontWeight: '300',
    opacity: 0.8,
  },
});
