/**
 * AI Course Generator Screen (Instructor)
 * Phase 1: Connects to real course creation workflow.
 * Generated curriculum creates real Course + Topic DB records,
 * triggers lecture generation, then navigates to AddTopicsScreen.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { startCourseGeneration } from '../../services/aiClassroomClient';
import { aiTutorAPI, categoryAPI } from '../../services/apiClient';

const GLASS = {
  backgroundColor: 'rgba(15,23,42,0.8)',
  borderWidth: 1,
  borderColor: 'rgba(51,65,85,0.5)',
  ...(Platform.OS === 'web' ? {
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  } : {}),
};

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const LANGUAGES = ['English', 'Urdu'];
const STEPS = ['Course Details', 'Generating', 'Ready'];

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current, steps }) {
  return (
    <View style={si.container}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <View style={si.stepWrap}>
            <View style={[si.circle, current > i ? si.done : current === i ? si.active : si.pending]}>
              {current > i
                ? <Icon name="checkmark" size={12} color="#fff" />
                : <Text style={[si.circleText, current === i ? si.circleTextActive : si.circleTextPending]}>{i + 1}</Text>
              }
            </View>
            <Text style={[si.label, current === i ? si.labelActive : si.labelInactive]}>{s}</Text>
          </View>
          {i < steps.length - 1 && (
            <View style={[si.line, current > i ? si.lineDone : si.linePending]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const si = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 16 },
  stepWrap: { alignItems: 'center', gap: 4 },
  circle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  done: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  active: { backgroundColor: 'transparent', borderColor: '#3b82f6' },
  pending: { backgroundColor: 'transparent', borderColor: '#334155' },
  circleText: { fontSize: 12, fontWeight: '700' },
  circleTextActive: { color: '#3b82f6' },
  circleTextPending: { color: '#4b5563' },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  labelActive: { color: '#3b82f6' },
  labelInactive: { color: '#4b5563' },
  line: { flex: 1, height: 2, borderRadius: 1, marginBottom: 14 },
  lineDone: { backgroundColor: '#1d4ed8' },
  linePending: { backgroundColor: '#1e293b' },
});

// ── Form field ────────────────────────────────────────────────────────────────

function FormField({ label, hint, value, onChangeText, multiline = false, required = false, ...rest }) {
  return (
    <View style={ff.container}>
      <Text style={ff.label}>{label}{required && <Text style={ff.required}> *</Text>}</Text>
      {hint && <Text style={ff.hint}>{hint}</Text>}
      <TextInput
        style={[ff.input, multiline && ff.multiline]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        placeholderTextColor="#4b5563"
        {...rest}
      />
    </View>
  );
}

const ff = StyleSheet.create({
  container: { gap: 5, marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  required: { color: '#ef4444' },
  hint: { color: '#4b5563', fontSize: 11 },
  input: {
    backgroundColor: 'rgba(30,41,59,0.7)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    color: '#f1f5f9',
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
});

// ── Pill selector ─────────────────────────────────────────────────────────────

function PillSelector({ label, required, options, value, onSelect, keyFn = (o) => o, labelFn = (o) => o }) {
  return (
    <View style={ps.container}>
      <Text style={ps.label}>{label}{required && <Text style={{ color: '#ef4444' }}> *</Text>}</Text>
      <View style={ps.row}>
        {options.map((opt) => {
          const k = keyFn(opt);
          const active = value === k;
          return (
            <TouchableOpacity
              key={k}
              style={[ps.pill, active && ps.pillActive]}
              onPress={() => onSelect(k)}
            >
              <Text style={[ps.pillText, active && ps.pillTextActive]}>{labelFn(opt)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const ps = StyleSheet.create({
  container: { gap: 8, marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: 'transparent',
  },
  pillActive: { backgroundColor: 'rgba(29,78,216,0.2)', borderColor: '#1d4ed8' },
  pillText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: '#60a5fa' },
});

// ── Generation progress ───────────────────────────────────────────────────────

function GenerationProgress({ status }) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const summary = status?.summary || {};
  const total = summary.total || 1;
  const ready = summary.ready || 0;
  const pct = Math.round((ready / total) * 100);

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: ready / total,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [ready, total]);

  const barWidth = fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={gp.container}>
      <View style={gp.header}>
        <ActivityIndicator size="small" color="#3b82f6" animating={!status?.isCompleted} />
        <Text style={gp.phase}>
          {status?.isCompleted ? 'Lectures Ready' : `Generating lectures... ${ready}/${total} complete`}
        </Text>
        <Text style={gp.pct}>{pct}%</Text>
      </View>
      <View style={gp.track}>
        <Animated.View style={[gp.fill, { width: barWidth }]} />
      </View>
      {(status?.topics || []).length > 0 && (
        <View style={gp.topicList}>
          {status.topics.slice(0, 6).map((t) => (
            <View key={t.topicId} style={gp.topicRow}>
              <View style={[gp.dot, t.status === 'ready' ? gp.dotReady : t.status === 'failed' ? gp.dotFailed : gp.dotPending]} />
              <Text style={gp.topicTitle} numberOfLines={1}>{t.title}</Text>
              <Text style={[gp.topicStatus, t.status === 'ready' ? gp.statusReady : t.status === 'failed' ? gp.statusFailed : gp.statusPending]}>
                {t.status}
              </Text>
            </View>
          ))}
          {status.topics.length > 6 && (
            <Text style={gp.more}>+{status.topics.length - 6} more topics</Text>
          )}
        </View>
      )}
    </View>
  );
}

const gp = StyleSheet.create({
  container: { ...GLASS, borderRadius: 12, padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  phase: { fontSize: 13, fontWeight: '600', color: '#60a5fa', flex: 1 },
  pct: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  track: { height: 4, backgroundColor: '#1e293b', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2, backgroundColor: '#3b82f6' },
  topicList: { gap: 6 },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  dotReady: { backgroundColor: '#10b981' },
  dotFailed: { backgroundColor: '#ef4444' },
  dotPending: { backgroundColor: '#334155' },
  topicTitle: { flex: 1, color: '#cbd5e1', fontSize: 12 },
  topicStatus: { fontSize: 11, fontWeight: '600' },
  statusReady: { color: '#10b981' },
  statusFailed: { color: '#ef4444' },
  statusPending: { color: '#64748b' },
  more: { color: '#4b5563', fontSize: 11, marginTop: 2 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function AICourseGeneratorScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: '',
    description: '',
    outcomes: '',
    pdfText: '',
    language: 'English',
    level: 'Beginner',
    categoryId: null,
  });
  const [categories, setCategories] = useState([]);
  const [courseId, setCourseId] = useState(null);
  const [genStatus, setGenStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const pollTimer = useRef(null);

  useEffect(() => {
    categoryAPI.getAll()
      .then((res) => setCategories(Array.isArray(res) ? res : res.categories || []))
      .catch(() => {});
    return () => clearInterval(pollTimer.current);
  }, []);

  const handleGenerate = async () => {
    if (!form.title.trim()) { setError('Course title is required'); return; }
    if (!form.categoryId) { setError('Please select a category'); return; }
    setError(null);
    setSubmitting(true);

    try {
      const res = await startCourseGeneration({
        title: form.title.trim(),
        description: form.description.trim(),
        outcomes: form.outcomes.trim(),
        pdfText: form.pdfText.trim(),
        language: form.language,
        level: form.level,
        categoryId: form.categoryId,
      });
      if (!res.success) throw new Error(res.error || 'Failed to start generation');
      setCourseId(res.courseId);
      setStep(1);
      startPolling(res.courseId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startPolling = (id) => {
    pollTimer.current = setInterval(async () => {
      try {
        const status = await aiTutorAPI.getGenerationStatus(id);
        setGenStatus(status);
        if (status?.isCompleted) {
          clearInterval(pollTimer.current);
          setStep(2);
        }
      } catch { /* poll silently */ }
    }, 3500);
  };

  const handleGoToTopics = () => {
    if (courseId) {
      navigation.navigate('AddTopics', { courseId, creationMode: 'ai' });
    }
  };

  const resetForm = () => {
    clearInterval(pollTimer.current);
    setStep(0);
    setForm({ title: '', description: '', outcomes: '', pdfText: '', language: 'English', level: 'Beginner', categoryId: null });
    setCourseId(null);
    setGenStatus(null);
    setError(null);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={20} color="#9ca3af" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>AI Course Generator</Text>
          <Text style={styles.headerSub}>Build a full curriculum with AI</Text>
        </View>
        <View style={styles.headerBadge}>
          <Icon name="sparkles" size={14} color="#7c3aed" />
          <Text style={styles.headerBadgeText}>Powered by AI</Text>
        </View>
      </View>

      <StepIndicator current={step} steps={STEPS} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Step 0: Form ── */}
        {step === 0 && (
          <View style={[styles.card, GLASS, { borderRadius: 16 }]}>
            <Text style={styles.cardTitle}>Course Details</Text>
            <Text style={styles.cardSubtitle}>
              Provide course information and AI will generate a complete curriculum with lectures,
              quizzes, and flashcards for every topic.
            </Text>

            {error && (
              <View style={styles.errorBanner}>
                <Icon name="alert-circle-outline" size={14} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <FormField
              label="Course Title"
              required
              value={form.title}
              onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
              placeholder="e.g. Introduction to Machine Learning"
            />

            <FormField
              label="Course Description"
              hint="What will students learn in this course?"
              value={form.description}
              onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
              placeholder="Brief description of the course..."
              multiline
            />

            <FormField
              label="Learning Outcomes"
              hint="What should students be able to do after completing this course?"
              value={form.outcomes}
              onChangeText={(v) => setForm((p) => ({ ...p, outcomes: v }))}
              placeholder="By the end of this course, students will be able to..."
              multiline
            />

            <FormField
              label="Reference Material (Optional)"
              hint="Paste text from syllabi, PDFs, or notes."
              value={form.pdfText}
              onChangeText={(v) => setForm((p) => ({ ...p, pdfText: v }))}
              placeholder="Paste reference text here..."
              multiline
            />

            {categories.length > 0 && (
              <PillSelector
                label="Category"
                required
                options={categories}
                value={form.categoryId}
                onSelect={(v) => setForm((p) => ({ ...p, categoryId: v }))}
                keyFn={(c) => c.id}
                labelFn={(c) => c.name}
              />
            )}

            <PillSelector
              label="Level"
              options={LEVELS}
              value={form.level}
              onSelect={(v) => setForm((p) => ({ ...p, level: v }))}
            />

            <PillSelector
              label="Language"
              options={LANGUAGES}
              value={form.language}
              onSelect={(v) => setForm((p) => ({ ...p, language: v }))}
            />

            <View style={styles.estimateCard}>
              <Icon name="time-outline" size={14} color="#f59e0b" />
              <Text style={styles.estimateText}>
                Estimated time: 3–8 minutes. Lectures are generated in the background —
                you can track progress from the Courses screen.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.generateBtn, submitting && styles.generateBtnDisabled]}
              onPress={handleGenerate}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Icon name="sparkles" size={18} color="#fff" />
              }
              <Text style={styles.generateBtnText}>
                {submitting ? 'Starting...' : 'Generate Course with AI'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 1: Generation in progress ── */}
        {step === 1 && (
          <View style={[styles.card, GLASS, { borderRadius: 16 }]}>
            <View style={styles.generatingHeader}>
              <View style={styles.generatingIcon}>
                <ActivityIndicator color="#3b82f6" size="large" />
              </View>
              <Text style={styles.generatingTitle}>Generating Your Course</Text>
              <Text style={styles.generatingSubtitle}>
                AI is writing lectures, creating examples, diagrams, flashcards, and quizzes
                for every topic. This usually takes 3–8 minutes.
              </Text>
            </View>

            <GenerationProgress status={genStatus} />

            <View style={styles.earlyAccessCard}>
              <Icon name="information-circle-outline" size={16} color="#60a5fa" />
              <Text style={styles.earlyAccessText}>
                Your course is already saved. You can leave this screen — generation continues
                in the background. Come back via Courses to view progress.
              </Text>
            </View>

            <TouchableOpacity style={styles.goToTopicsBtn} onPress={handleGoToTopics}>
              <Icon name="list-outline" size={16} color="#60a5fa" />
              <Text style={styles.goToTopicsBtnText}>View Course Topics</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2: Ready ── */}
        {step === 2 && (
          <View style={styles.reviewContainer}>
            <View style={styles.successBanner}>
              <Icon name="checkmark-circle" size={22} color="#10b981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.successText}>Course Generated Successfully!</Text>
                <Text style={styles.successSub}>All lectures, quizzes, and flashcards are ready.</Text>
              </View>
            </View>

            {genStatus && (
              <View style={[GLASS, { borderRadius: 12, padding: 16, gap: 8 }]}>
                <Text style={styles.summaryTitle}>Generation Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Topics</Text>
                  <Text style={styles.summaryValue}>{genStatus.summary?.total || 0}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Lectures Ready</Text>
                  <Text style={[styles.summaryValue, { color: '#10b981' }]}>{genStatus.summary?.ready || 0}</Text>
                </View>
                {(genStatus.summary?.failed || 0) > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Failed</Text>
                    <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{genStatus.summary.failed}</Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleGoToTopics}>
              <Icon name="school-outline" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Go to Course Topics</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={resetForm}>
              <Icon name="add-circle-outline" size={16} color="#3b82f6" />
              <Text style={styles.secondaryBtnText}>Generate Another Course</Text>
            </TouchableOpacity>
          </View>
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
  scrollContent: { padding: 16, gap: 14, paddingBottom: 40 },
  scrollContentWide: { maxWidth: 700, alignSelf: 'center', width: '100%' },

  card: { borderRadius: 16, padding: 22, gap: 14 },
  cardTitle: { color: '#f1f5f9', fontSize: 20, fontWeight: '700' },
  cardSubtitle: { color: '#64748b', fontSize: 13, lineHeight: 20 },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 8,
    padding: 10,
  },
  errorText: { color: '#fca5a5', fontSize: 13, flex: 1 },

  estimateCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: 'rgba(245,158,11,0.07)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  estimateText: { color: '#fde68a', fontSize: 12, lineHeight: 18, flex: 1 },

  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1d4ed8',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  generateBtnDisabled: { opacity: 0.5 },
  generateBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  generatingHeader: { alignItems: 'center', gap: 12, paddingBottom: 8 },
  generatingIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(29,78,216,0.1)',
    borderWidth: 2,
    borderColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatingTitle: { color: '#f1f5f9', fontSize: 20, fontWeight: '700' },
  generatingSubtitle: { color: '#64748b', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  earlyAccessCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(59,130,246,0.07)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  earlyAccessText: { color: '#93c5fd', fontSize: 12, lineHeight: 18, flex: 1 },

  goToTopicsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    borderRadius: 10,
    paddingVertical: 11,
    backgroundColor: 'rgba(59,130,246,0.07)',
  },
  goToTopicsBtnText: { color: '#60a5fa', fontSize: 14, fontWeight: '600' },

  reviewContainer: { gap: 14 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    borderRadius: 12,
    padding: 14,
  },
  successText: { color: '#10b981', fontSize: 15, fontWeight: '700' },
  successSub: { color: '#6ee7b7', fontSize: 12, marginTop: 2 },

  summaryTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: '#64748b', fontSize: 13 },
  summaryValue: { color: '#f1f5f9', fontSize: 14, fontWeight: '700' },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1d4ed8',
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(29,78,216,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(29,78,216,0.3)',
    borderRadius: 10,
    paddingVertical: 12,
  },
  secondaryBtnText: { color: '#60a5fa', fontSize: 14, fontWeight: '600' },
});
