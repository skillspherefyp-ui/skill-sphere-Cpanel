import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Animated } from 'react-native';

function NoteEntry({ note, index }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.noteEntry,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.noteHeader}>
        <View style={styles.noteDot} />
        <Text style={styles.noteSection} numberOfLines={1}>
          {note.sectionTitle}
        </Text>
      </View>

      {note.keyTerms && note.keyTerms.length > 0 && (
        <View style={styles.termsRow}>
          {note.keyTerms.slice(0, 4).map((term, ti) => (
            <View key={ti} style={styles.termChip}>
              <Text style={styles.termText}>{term}</Text>
            </View>
          ))}
        </View>
      )}

      {note.summary && (
        <Text style={styles.noteSummary} numberOfLines={3}>
          {note.summary}
        </Text>
      )}
    </Animated.View>
  );
}

export default function AutoNotes({ notes = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (notes.length > 0 && scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [notes.length]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerIcon}>📝</Text>
        <Text style={styles.headerText}>Auto Notes</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{notes.length}</Text>
        </View>
      </View>

      {notes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✨</Text>
          <Text style={styles.emptyText}>Notes appear as the lecture progresses</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {notes.map((note, i) => (
            <NoteEntry key={i} note={note} index={i} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  headerIcon: {
    fontSize: 13,
  },
  headerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    flex: 1,
  },
  badge: {
    backgroundColor: 'rgba(108,99,255,0.3)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#a78bfa',
    fontSize: 10,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  noteEntry: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#6C63FF',
    padding: 10,
    marginBottom: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  noteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6C63FF',
  },
  noteSection: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  termsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  termChip: {
    backgroundColor: 'rgba(108,99,255,0.2)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
  },
  termText: {
    color: '#c4b5fd',
    fontSize: 10,
    fontWeight: '600',
  },
  noteSummary: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    lineHeight: 17,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 24,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    textAlign: 'center',
  },
});
