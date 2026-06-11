/**
 * AI Learning Profile Screen (Phase 3)
 * Shows the student's AI-built learning memory: weaknesses, mastery, confusion patterns.
 * Allows clearing memory per course.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { aiTutorAPI } from '../../services/apiClient';

const GLASS = {
  backgroundColor: 'rgba(15,23,42,0.85)',
  borderWidth: 1,
  borderColor: 'rgba(51,65,85,0.5)',
  ...(Platform.OS === 'web' ? {
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  } : {}),
};

const TYPE_COLORS = {
  weakness: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5', label: '#ef4444' },
  confusion: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#fde68a', label: '#f59e0b' },
  mastery: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#6ee7b7', label: '#10b981' },
  strength: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#93c5fd', label: '#3b82f6' },
  question_pattern: { bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.3)', text: '#c4b5fd', label: '#7c3aed' },
};

const TYPE_ICONS = {
  weakness: 'warning-outline',
  confusion: 'help-circle-outline',
  mastery: 'checkmark-circle-outline',
  strength: 'star-outline',
  question_pattern: 'chatbubble-outline',
};

export default function AILearningProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId, courseTitle } = route.params || {};

  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId) { setLoading(false); return; }
    loadMemory();
  }, [courseId]);

  const loadMemory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiTutorAPI.getStudentMemory(courseId);
      setContext(res.context || null);
    } catch (err) {
      setError(err.message || 'Could not load learning profile');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await aiTutorAPI.clearStudentMemory(courseId);
      setContext(null);
    } catch { /* ignore */ }
    finally { setClearing(false); }
  };

  const renderContextLines = () => {
    if (!context) return null;
    return context.split('\n').filter(Boolean).map((line, i) => {
      let type = 'mastery';
      if (line.toLowerCase().includes('struggled') || line.toLowerCase().includes('incorrectly')) type = 'weakness';
      if (line.toLowerCase().includes('asked') || line.toLowerCase().includes('asked about')) type = 'confusion';
      if (line.toLowerCase().includes('mastery') || line.toLowerCase().includes('demonstrated')) type = 'mastery';

      const c = TYPE_COLORS[type] || TYPE_COLORS.mastery;
      const icon = TYPE_ICONS[type] || 'information-circle-outline';

      return (
        <View key={i} style={[styles.memoryCard, { backgroundColor: c.bg, borderColor: c.border }]}>
          <View style={styles.memoryHeader}>
            <Icon name={icon} size={15} color={c.label} />
            <Text style={[styles.memoryType, { color: c.label }]}>{type.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <Text style={[styles.memoryContent, { color: c.text }]}>{line}</Text>
        </View>
      );
    });
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={20} color="#9ca3af" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Learning Profile</Text>
          {courseTitle && <Text style={styles.headerSub} numberOfLines={1}>{courseTitle}</Text>}
        </View>
        <View style={styles.headerBadge}>
          <Icon name="brain" size={14} color="#7c3aed" />
          <Text style={styles.headerBadgeText}>AI Memory</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Info card */}
        <View style={[GLASS, styles.infoCard]}>
          <Icon name="information-circle-outline" size={18} color="#60a5fa" />
          <Text style={styles.infoText}>
            Your AI tutor builds a personalized learning profile as you study. It tracks your strengths,
            weaknesses, and confusion patterns to give you better explanations.
          </Text>
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color="#6C63FF" size="large" />
            <Text style={styles.loadingText}>Loading your learning profile...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.errorCard}>
            <Icon name="alert-circle-outline" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadMemory}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && !context && (
          <View style={styles.emptyState}>
            <Icon name="school-outline" size={48} color="#1e3a5f" />
            <Text style={styles.emptyTitle}>No Learning Data Yet</Text>
            <Text style={styles.emptyText}>
              Complete some AI lectures and quizzes to build your personalized learning profile.
            </Text>
          </View>
        )}

        {!loading && !error && context && (
          <>
            <Text style={styles.sectionLabel}>Your Learning Insights</Text>
            {renderContextLines()}

            <TouchableOpacity
              style={[styles.clearBtn, clearing && styles.clearBtnDisabled]}
              onPress={handleClear}
              disabled={clearing}
            >
              {clearing ? <ActivityIndicator color="#ef4444" size="small" /> : <Icon name="trash-outline" size={15} color="#ef4444" />}
              <Text style={styles.clearBtnText}>Clear Learning Memory</Text>
            </TouchableOpacity>
            <Text style={styles.clearNote}>
              Clearing memory lets the AI start fresh. Your lecture and quiz progress is not affected.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020817' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(2,8,23,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1, gap: 2 },
  headerTitle: { color: '#f1f5f9', fontSize: 17, fontWeight: '700' },
  headerSub: { color: '#64748b', fontSize: 12 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerBadgeText: { color: '#a78bfa', fontSize: 11, fontWeight: '600' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 40 },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    padding: 14,
  },
  infoText: { color: '#93c5fd', fontSize: 13, lineHeight: 20, flex: 1 },

  center: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14 },

  errorCard: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  errorText: { color: '#fca5a5', fontSize: 13, textAlign: 'center' },
  retryBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: { color: '#ef4444', fontWeight: '700', fontSize: 13 },

  emptyState: { alignItems: 'center', paddingVertical: 56, gap: 12 },
  emptyTitle: { color: '#334155', fontSize: 18, fontWeight: '700' },
  emptyText: { color: '#475569', fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 300 },

  sectionLabel: {
    color: '#4b5563',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  memoryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  memoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memoryType: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  memoryContent: { fontSize: 13, lineHeight: 20 },

  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: 'rgba(239,68,68,0.06)',
    marginTop: 8,
  },
  clearBtnDisabled: { opacity: 0.4 },
  clearBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  clearNote: { color: '#374151', fontSize: 11, textAlign: 'center', lineHeight: 17 },
});
