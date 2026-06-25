import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';

export default function LectureProgressTracker({ sections = [], currentSectionIndex = 0, currentChunkIndex = 0 }) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lecture Progress</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {sections.map((section, si) => {
          const isActive = si === currentSectionIndex;
          const isDone = si < currentSectionIndex;
          const isPending = si > currentSectionIndex;

          return (
            <View key={si} style={styles.sectionRow}>
              <View style={styles.timelineCol}>
                <View
                  style={[
                    styles.dot,
                    isDone && styles.dotDone,
                    isActive && styles.dotActive,
                    isPending && styles.dotPending,
                  ]}
                >
                  {isDone && <Text style={styles.dotCheck}>✓</Text>}
                  {isActive && <View style={styles.dotPulse} />}
                </View>
                {si < sections.length - 1 && (
                  <View style={[styles.line, isDone && styles.lineDone]} />
                )}
              </View>

              <View style={styles.labelCol}>
                <Text
                  style={[
                    styles.sectionTitle,
                    isActive && styles.sectionTitleActive,
                    isDone && styles.sectionTitleDone,
                  ]}
                  numberOfLines={2}
                >
                  {section.title || `Section ${si + 1}`}
                </Text>
                {isActive && section.chunks && (
                  <View style={styles.chunkBar}>
                    <View
                      style={[
                        styles.chunkFill,
                        {
                          width: `${Math.round(
                            ((currentChunkIndex + 1) / section.chunks.length) * 100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  header: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  dotActive: {
    backgroundColor: 'rgba(108,99,255,0.3)',
    borderColor: '#6C63FF',
  },
  dotPending: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  dotCheck: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  dotPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6C63FF',
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 2,
  },
  lineDone: {
    backgroundColor: '#10b981',
  },
  labelCol: {
    flex: 1,
    paddingBottom: 16,
    justifyContent: 'flex-start',
    paddingTop: 1,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  sectionTitleActive: {
    color: '#fff',
    fontWeight: '700',
  },
  sectionTitleDone: {
    color: 'rgba(16,185,129,0.8)',
  },
  chunkBar: {
    height: 3,
    backgroundColor: 'rgba(108,99,255,0.2)',
    borderRadius: 2,
    marginTop: 5,
    overflow: 'hidden',
  },
  chunkFill: {
    height: 3,
    backgroundColor: '#6C63FF',
    borderRadius: 2,
  },
});
