/**
 * ClassroomQuizPanel — server-side grading flow.
 *
 * Flow: collect all answers → submit all at once via onSubmit(answers)
 * where answers = {[questionId]: selectedOptionIndex}
 * Results come from server gradedQuestions (which include correctAnswer).
 *
 * Props:
 *   quiz       — {questions: [{id, prompt, options, questionIndex}]}
 *   onSubmit   — async (answers) => {score, passed, gradedQuestions, totalQuestions}
 *   onClose    — () => void
 *   onComplete — (result) => void  — called after results shown
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';

const LABELS = ['A', 'B', 'C', 'D'];

function OptionRow({ option, index, selected, gradedResult, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isSelected = selected === index;

  // After grading: gradedResult = {isCorrect, correctAnswer}
  const isRevealed = !!gradedResult;
  const isCorrect = isRevealed && index === gradedResult.correctAnswer;
  const isWrong = isRevealed && isSelected && !isCorrect;

  useEffect(() => {
    if (isSelected && !isRevealed) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
  }, [isSelected]);

  const borderColor = isCorrect ? '#10b981' : isWrong ? '#ef4444' : isSelected ? '#6C63FF' : 'rgba(255,255,255,0.1)';

  return (
    <TouchableOpacity onPress={() => !isRevealed && onPress(index)} activeOpacity={0.8}>
      <Animated.View style={[styles.optionRow, { borderColor, transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.optionLabel, { borderColor }]}>
          <Text style={[styles.optionLabelText, { color: borderColor }]}>{LABELS[index]}</Text>
        </View>
        <Text style={styles.optionText}>{option}</Text>
        {isCorrect && <Text style={styles.optionIcon}>✓</Text>}
        {isWrong && <Text style={[styles.optionIcon, { color: '#ef4444' }]}>✗</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function ClassroomQuizPanel({ quiz, onSubmit, onClose, onComplete }) {
  const questions = (quiz?.questions || []).slice().sort((a, b) => a.questionIndex - b.questionIndex);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});       // {[questionId]: selectedOptionIndex}
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);        // server response after submit
  const [error, setError] = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const current = questions[questionIndex];
  const selectedForCurrent = answers[current?.id] ?? null;
  const gradedForCurrent = result?.gradedQuestions?.find((g) => g.id === current?.id) || null;

  if (!quiz || questions.length === 0) return null;

  const handleSelect = (idx) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [current.id]: idx }));
  };

  const handleNext = () => {
    if (questionIndex < questions.length - 1) {
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: -16, duration: 120, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
      setQuestionIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (questionIndex > 0) {
      setQuestionIndex((i) => i - 1);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await onSubmit(answers);
      setResult(res);
      setQuestionIndex(0);
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const isLastQuestion = questionIndex === questions.length - 1;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  const pct = result ? Math.round((result.score || 0)) : 0;
  const passed = result?.passed;

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.panelHeader}>
          <View style={styles.quizBadge}>
            <Text style={styles.quizBadgeText}>Quiz</Text>
          </View>
          {!result && (
            <Text style={styles.counter}>{questionIndex + 1} / {questions.length}</Text>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Results view */}
        {result ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.resultsContainer}>
              <Text style={styles.resultEmoji}>{pct >= 70 ? '🏆' : pct >= 50 ? '👍' : '📚'}</Text>
              <Text style={styles.resultScore}>{pct}%</Text>
              <Text style={styles.resultLabel}>{result.correctAnswers ?? 0} / {result.totalQuestions ?? questions.length} correct</Text>
              <Text style={[styles.resultMsg, passed ? styles.passedMsg : styles.failedMsg]}>
                {passed ? 'Passed! Great work.' : 'Not quite — review the explanations below.'}
              </Text>
            </View>

            {/* Per-question review */}
            {questions.map((q, i) => {
              const graded = (result.gradedQuestions || []).find((g) => g.id === q.id);
              return (
                <View key={q.id} style={[styles.reviewQuestion, graded?.isCorrect ? styles.reviewCorrect : styles.reviewWrong]}>
                  <Text style={styles.reviewQNum}>Q{i + 1}</Text>
                  <Text style={styles.reviewQText}>{q.prompt || q.question}</Text>
                  <Text style={styles.reviewAnswer}>
                    Correct: {q.options?.[graded?.correctAnswer] ?? '—'}
                  </Text>
                  {graded?.explanation ? (
                    <Text style={styles.reviewExplanation}>{graded.explanation}</Text>
                  ) : null}
                </View>
              );
            })}

            <TouchableOpacity style={styles.nextBtn} onPress={() => onComplete && onComplete(result)}>
              <Text style={styles.nextBtnText}>Continue</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          /* Quiz in progress */
          <>
            {/* Progress bar */}
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${((questionIndex + 1) / questions.length) * 100}%` }]} />
              </View>
            </View>

            <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
              <Text style={styles.questionText}>{current?.prompt || current?.question}</Text>
            </Animated.View>

            <ScrollView style={styles.optionsScroll} showsVerticalScrollIndicator={false}>
              {(current?.options || []).map((opt, i) => (
                <OptionRow
                  key={i}
                  option={opt}
                  index={i}
                  selected={selectedForCurrent}
                  gradedResult={null}
                  onPress={handleSelect}
                />
              ))}
            </ScrollView>

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Navigation */}
            <View style={styles.navRow}>
              <TouchableOpacity
                style={[styles.navBtn, questionIndex === 0 && styles.navBtnDisabled]}
                onPress={handlePrev}
                disabled={questionIndex === 0}
              >
                <Text style={styles.navBtnText}>← Prev</Text>
              </TouchableOpacity>

              {!isLastQuestion ? (
                <TouchableOpacity style={styles.navBtn} onPress={handleNext}>
                  <Text style={styles.navBtnText}>Next →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.submitBtn, (!allAnswered || submitting) && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={!allAnswered || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.nextBtnText}>Submit Quiz</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {!allAnswered && isLastQuestion && (
              <Text style={styles.warningText}>Answer all questions to submit</Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.80)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 16,
  },
  panel: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
    padding: 20,
    maxHeight: '92%',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } : {}),
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  quizBadge: {
    backgroundColor: 'rgba(108,99,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quizBadgeText: { color: '#a78bfa', fontSize: 13, fontWeight: '700' },
  counter: { flex: 1, color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center' },
  closeBtn: { padding: 8 },
  closeBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 16 },

  progressRow: { marginBottom: 16 },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: '#6C63FF', borderRadius: 2 },

  questionText: { color: '#fff', fontSize: 16, fontWeight: '600', lineHeight: 24, marginBottom: 16 },
  optionsScroll: { maxHeight: 260 },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  optionLabel: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  optionLabelText: { fontSize: 12, fontWeight: '700' },
  optionText: { flex: 1, color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 20 },
  optionIcon: { color: '#10b981', fontSize: 16, fontWeight: '700' },

  errorText: { color: '#fca5a5', fontSize: 13, textAlign: 'center', marginVertical: 8 },
  warningText: { color: '#fbbf24', fontSize: 12, textAlign: 'center', marginTop: 8 },

  navRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  navBtn: {
    flex: 1,
    backgroundColor: 'rgba(108,99,255,0.15)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: '#a78bfa', fontSize: 14, fontWeight: '600' },
  submitBtn: {
    flex: 1,
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  nextBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
  },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Results
  resultsContainer: { alignItems: 'center', paddingVertical: 16, gap: 6, marginBottom: 16 },
  resultEmoji: { fontSize: 44 },
  resultScore: { color: '#fff', fontSize: 40, fontWeight: '800', marginTop: 6 },
  resultLabel: { color: '#a78bfa', fontSize: 15, fontWeight: '600' },
  resultMsg: { fontSize: 14, textAlign: 'center', lineHeight: 21, marginVertical: 6, paddingHorizontal: 12 },
  passedMsg: { color: '#6ee7b7' },
  failedMsg: { color: '#fca5a5' },

  reviewQuestion: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    gap: 4,
  },
  reviewCorrect: { backgroundColor: 'rgba(16,185,129,0.08)', borderLeftColor: '#10b981' },
  reviewWrong: { backgroundColor: 'rgba(239,68,68,0.08)', borderLeftColor: '#ef4444' },
  reviewQNum: { color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  reviewQText: { color: '#e2e8f0', fontSize: 13, fontWeight: '500', lineHeight: 20 },
  reviewAnswer: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  reviewExplanation: { color: '#64748b', fontSize: 12, lineHeight: 18, marginTop: 4 },
});
