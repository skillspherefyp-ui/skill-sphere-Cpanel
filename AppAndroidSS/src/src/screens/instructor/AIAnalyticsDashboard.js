/**
 * AI Analytics Dashboard (Phase 5)
 * Shows instructor-level AI tutor analytics:
 * — Overview stats across all courses
 * — Per-course engagement, confusion areas, and student list
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { analyticsAPI, courseAPI } from '../../services/apiClient';

const GLASS = {
  backgroundColor: 'rgba(15,23,42,0.8)',
  borderWidth: 1,
  borderColor: 'rgba(51,65,85,0.5)',
  ...(Platform.OS === 'web' ? {
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  } : {}),
};

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }) {
  return (
    <View style={[sc.card, GLASS, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Icon name={icon} size={20} color={color} />
      <Text style={sc.value}>{value ?? '—'}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  value: { color: '#f1f5f9', fontSize: 26, fontWeight: '800' },
  label: { color: '#64748b', fontSize: 11, fontWeight: '600', textAlign: 'center' },
});

// ── Term pill ─────────────────────────────────────────────────────────────────

function TermPill({ term, count }) {
  return (
    <View style={tp.pill}>
      <Text style={tp.term}>{term}</Text>
      <Text style={tp.count}>{count}</Text>
    </View>
  );
}

const tp = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  term: { color: '#fca5a5', fontSize: 12, fontWeight: '500' },
  count: { color: '#ef4444', fontSize: 11, fontWeight: '700', backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function AIAnalyticsDashboard() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [overview, setOverview] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [confusion, setConfusion] = useState(null);
  const [students, setStudents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courseLoading, setCourseLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovRes, cRes] = await Promise.all([
        analyticsAPI.getOverview(),
        courseAPI.getAll({ limit: 50 }),
      ]);
      setOverview(ovRes.overview);
      const courseList = cRes.courses || cRes || [];
      setCourses(courseList);
    } catch (err) {
      setError(err.message || 'Could not load analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseAnalytics = async (course) => {
    setSelectedCourse(course);
    setEngagement(null);
    setConfusion(null);
    setStudents(null);
    setCourseLoading(true);
    try {
      const [engRes, confRes, studRes] = await Promise.all([
        analyticsAPI.getEngagement(course.id),
        analyticsAPI.getConfusion(course.id),
        analyticsAPI.getStudents(course.id),
      ]);
      setEngagement(engRes.engagement);
      setConfusion(confRes.confusion);
      setStudents(studRes.students);
    } catch { /* show partial */ }
    finally { setCourseLoading(false); }
  };

  const ov = overview || {};

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={20} color="#9ca3af" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>AI Analytics Dashboard</Text>
          <Text style={styles.headerSub}>AI Tutor engagement & learning insights</Text>
        </View>
        <View style={styles.headerBadge}>
          <Icon name="bar-chart-outline" size={14} color="#7c3aed" />
          <Text style={styles.headerBadgeText}>Analytics</Text>
        </View>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color="#7c3aed" size="large" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Icon name="alert-circle-outline" size={36} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadInitial}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}>

          {/* ── Overview Stats ── */}
          <Text style={styles.sectionTitle}>Platform Overview</Text>
          <View style={styles.statsRow}>
            <StatCard icon="people-outline" label="AI Sessions" value={ov.totalSessions} color="#6C63FF" />
            <StatCard icon="chatbubble-outline" label="Questions Asked" value={ov.totalQuestions} color="#3b82f6" />
            <StatCard icon="school-outline" label="Students" value={ov.totalStudents} color="#10b981" />
            <StatCard icon="checkmark-circle-outline" label="Quiz Pass Rate" value={ov.quizPassRate != null ? `${ov.quizPassRate}%` : '—'} color="#f59e0b" />
          </View>

          {/* ── Course Selector ── */}
          <Text style={styles.sectionTitle}>Course Breakdown</Text>
          {courses.length === 0 ? (
            <View style={[GLASS, styles.emptyCard]}>
              <Icon name="book-outline" size={32} color="#1e3a5f" />
              <Text style={styles.emptyText}>No courses found</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseScroll} contentContainerStyle={styles.courseScrollContent}>
              {courses.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.coursePill, selectedCourse?.id === c.id && styles.coursePillActive]}
                  onPress={() => loadCourseAnalytics(c)}
                >
                  <Text style={[styles.coursePillText, selectedCourse?.id === c.id && styles.coursePillTextActive]} numberOfLines={1}>
                    {c.name || c.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* ── Course Analytics ── */}
          {selectedCourse && (
            <>
              <View style={styles.courseHeader}>
                <Text style={styles.courseTitle}>{selectedCourse.name || selectedCourse.title}</Text>
              </View>

              {courseLoading && (
                <View style={[GLASS, styles.loadingCard]}>
                  <ActivityIndicator color="#7c3aed" />
                  <Text style={styles.loadingText}>Loading course analytics...</Text>
                </View>
              )}

              {!courseLoading && engagement && (
                <View style={[GLASS, styles.section]}>
                  <Text style={styles.sectionLabel}>Engagement</Text>
                  <View style={styles.engagementGrid}>
                    <View style={styles.engagementStat}>
                      <Text style={styles.engagementValue}>{engagement.totalSessions}</Text>
                      <Text style={styles.engagementLabel}>Sessions</Text>
                    </View>
                    <View style={styles.engagementStat}>
                      <Text style={styles.engagementValue}>{engagement.completedSessions}</Text>
                      <Text style={styles.engagementLabel}>Completed</Text>
                    </View>
                    <View style={styles.engagementStat}>
                      <Text style={styles.engagementValue}>{engagement.totalQuestions}</Text>
                      <Text style={styles.engagementLabel}>Questions</Text>
                    </View>
                    <View style={styles.engagementStat}>
                      <Text style={styles.engagementValue}>{engagement.lectureCompletions}</Text>
                      <Text style={styles.engagementLabel}>Completions</Text>
                    </View>
                  </View>

                  {(engagement.topicBreakdown || []).length > 0 && (
                    <>
                      <Text style={styles.subLabel}>Sessions by Topic</Text>
                      {engagement.topicBreakdown.slice(0, 5).map((t) => (
                        <View key={t.topicId} style={styles.topicRow}>
                          <Text style={styles.topicName} numberOfLines={1}>{t.title}</Text>
                          <View style={styles.topicBar}>
                            <View style={[styles.topicBarFill, {
                              width: `${Math.min(100, (t.sessions / (engagement.totalSessions || 1)) * 100)}%`
                            }]} />
                          </View>
                          <Text style={styles.topicSessions}>{t.sessions}</Text>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              )}

              {!courseLoading && confusion && confusion.topTerms?.length > 0 && (
                <View style={[GLASS, styles.section]}>
                  <Text style={styles.sectionLabel}>Confusion Areas</Text>
                  <Text style={styles.sectionHint}>Most-repeated concepts students struggled with</Text>
                  <View style={styles.termCloud}>
                    {confusion.topTerms.slice(0, 12).map((t, i) => (
                      <TermPill key={i} term={t.term} count={t.count} />
                    ))}
                  </View>

                  {(confusion.byTopic || []).length > 0 && (
                    <>
                      <Text style={styles.subLabel}>By Topic</Text>
                      {confusion.byTopic.slice(0, 5).map((t) => (
                        <View key={t.topicId} style={styles.confusionTopic}>
                          <View style={styles.confusionTopicHeader}>
                            <Text style={styles.confusionTopicName} numberOfLines={1}>{t.title}</Text>
                            <View style={styles.confusionBadge}>
                              <Text style={styles.confusionBadgeText}>{t.count}</Text>
                            </View>
                          </View>
                          <View style={styles.termCloud}>
                            {(t.topTerms || []).slice(0, 5).map((term, i) => (
                              <TermPill key={i} term={term.term} count={term.count} />
                            ))}
                          </View>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              )}

              {!courseLoading && students && (
                <View style={[GLASS, styles.section]}>
                  <Text style={styles.sectionLabel}>Students ({students.length})</Text>
                  {students.length === 0 ? (
                    <Text style={styles.emptyText}>No enrolled students yet</Text>
                  ) : (
                    students.map((s) => (
                      <View key={s.userId} style={styles.studentRow}>
                        <View style={styles.studentAvatar}>
                          <Text style={styles.studentAvatarText}>{(s.name || 'S')[0].toUpperCase()}</Text>
                        </View>
                        <View style={styles.studentInfo}>
                          <Text style={styles.studentName}>{s.name || 'Student'}</Text>
                          <Text style={styles.studentMeta}>
                            {s.sessions?.total || 0} sessions · {s.questions || 0} questions
                            {(s.progress?.bestScore || 0) > 0 ? ` · ${s.progress.bestScore}% best` : ''}
                          </Text>
                        </View>
                        {(s.memories?.weakness || 0) > 0 && (
                          <View style={styles.weaknessBadge}>
                            <Text style={styles.weaknessBadgeText}>{s.memories.weakness} weak</Text>
                          </View>
                        )}
                        {(s.memories?.mastery || 0) > 0 && (
                          <View style={styles.masteryBadge}>
                            <Text style={styles.masteryBadgeText}>{s.memories.mastery} mastered</Text>
                          </View>
                        )}
                      </View>
                    ))
                  )}
                </View>
              )}
            </>
          )}

          {!selectedCourse && !loading && (
            <View style={[GLASS, styles.emptyCard]}>
              <Icon name="bar-chart-outline" size={36} color="#1e3a5f" />
              <Text style={styles.emptyTitle}>Select a Course</Text>
              <Text style={styles.emptyText}>Choose a course above to see engagement details, confusion areas, and student insights.</Text>
            </View>
          )}

        </ScrollView>
      )}
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

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadingText: { color: '#64748b', fontSize: 14 },
  errorText: { color: '#fca5a5', fontSize: 13, textAlign: 'center' },
  retryBtn: { backgroundColor: 'rgba(124,58,237,0.2)', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8 },
  retryText: { color: '#a78bfa', fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 40 },
  scrollContentWide: { maxWidth: 900, alignSelf: 'center', width: '100%' },

  sectionTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  courseScroll: { marginHorizontal: -16 },
  courseScrollContent: { paddingHorizontal: 16, gap: 8, flexDirection: 'row' },
  coursePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: 'rgba(30,41,59,0.5)',
    maxWidth: 200,
  },
  coursePillActive: { backgroundColor: 'rgba(124,58,237,0.15)', borderColor: '#7c3aed' },
  coursePillText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  coursePillTextActive: { color: '#a78bfa' },

  courseHeader: { marginTop: 4 },
  courseTitle: { color: '#f1f5f9', fontSize: 16, fontWeight: '700' },

  loadingCard: { borderRadius: 12, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },

  section: { borderRadius: 14, padding: 16, gap: 10 },
  sectionLabel: { color: '#64748b', fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  sectionHint: { color: '#475569', fontSize: 12, marginTop: -4 },
  subLabel: { color: '#4b5563', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 6 },

  engagementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  engagementStat: { flex: 1, minWidth: 70, alignItems: 'center' },
  engagementValue: { color: '#f1f5f9', fontSize: 22, fontWeight: '800' },
  engagementLabel: { color: '#4b5563', fontSize: 11, fontWeight: '600', textAlign: 'center' },

  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topicName: { flex: 1, color: '#94a3b8', fontSize: 12 },
  topicBar: { width: 80, height: 4, backgroundColor: '#1e293b', borderRadius: 2, overflow: 'hidden' },
  topicBarFill: { height: 4, backgroundColor: '#6C63FF', borderRadius: 2 },
  topicSessions: { color: '#64748b', fontSize: 12, fontWeight: '700', minWidth: 20, textAlign: 'right' },

  termCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  confusionTopic: { gap: 6 },
  confusionTopicHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confusionTopicName: { flex: 1, color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  confusionBadge: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  confusionBadgeText: { color: '#ef4444', fontSize: 11, fontWeight: '700' },

  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(108,99,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
  },
  studentAvatarText: { color: '#a78bfa', fontSize: 15, fontWeight: '700' },
  studentInfo: { flex: 1 },
  studentName: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  studentMeta: { color: '#475569', fontSize: 12 },
  weaknessBadge: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  weaknessBadgeText: { color: '#fca5a5', fontSize: 10, fontWeight: '600' },
  masteryBadge: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  masteryBadgeText: { color: '#6ee7b7', fontSize: 10, fontWeight: '600' },

  emptyCard: { borderRadius: 12, padding: 32, alignItems: 'center', gap: 10 },
  emptyTitle: { color: '#334155', fontSize: 16, fontWeight: '700' },
  emptyText: { color: '#475569', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
