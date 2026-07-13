import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, useWindowDimensions, ActivityIndicator, AppState } from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeIn } from 'react-native-reanimated';
import MainLayout from '../../components/ui/MainLayout';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import ProgressBar from '../../components/ui/ProgressBar';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { aiTutorAPI } from '../../services/apiClient';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getSidebarItems } from '../../utils/sidebarItems';

const SECONDS_PER_QUESTION = 30;

const QuizScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const { fetchCourses } = useData();
  const { user } = useAuth();
  const { courseId, topicId, lectureId } = route.params || {};

  const sidebarItems = getSidebarItems(user?.role);
  const handleNavigate = (routeName) => {
    if (routeName === 'CertificateVerify') {
      navigation.navigate(routeName, { fromStudent: true });
    } else {
      navigation.navigate(routeName);
    }
  };

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  // Timer
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef(null);
  const submittingRef = useRef(false);
  const cheatingRef = useRef(false);
  const quizRef = useRef(null);

  const isWeb = Platform.OS === 'web';
  const maxWidth = isWeb && width > 1200 ? 1200 : '100%';
  const questions = quiz?.questions || [];
  const question = questions[currentQuestion];
  const totalQuestions = questions.length;

  useEffect(() => {
    if (!lectureId) { setLoading(false); return; }
    loadQuiz();
  }, [lectureId]);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const response = await aiTutorAPI.getQuiz(lectureId);
      if (!response.success) throw new Error(response.error || 'Unable to load quiz');
      setQuiz(response.quiz);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Quiz Unavailable', text2: error.message || 'Unable to load the stored quiz.' });
    } finally {
      setLoading(false);
    }
  };

  // Keep ref in sync
  useEffect(() => { quizRef.current = quiz; }, [quiz]);

  // Cheat detection
  const handleCheat = () => {
    if (cheatingRef.current || submittingRef.current) return;
    cheatingRef.current = true;
    submittingRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    const total = quizRef.current?.questions?.length || 0;
    Toast.show({ type: 'error', text1: 'Quiz Terminated', text2: 'Tab switching detected. Score: 0%', visibilityTime: 3000 });
    setTimeout(() => {
      navigation.replace('QuizResult', {
        courseId, topicId, lectureId,
        score: 0,
        totalQuestions: total,
        correctCount: 0,
        passed: false,
        courseComplete: false,
      });
    }, 1500);
  };

  // Web: visibilitychange
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onVisibility = () => { if (document.hidden) handleCheat(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Native: AppState background
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', state => {
      if (state === 'background' || state === 'inactive') handleCheat();
    });
    return () => sub.remove();
  }, []);

  // Reset timer on every question change
  useEffect(() => {
    if (!quiz) return;
    setTimeLeft(SECONDS_PER_QUESTION);
    setTimedOut(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimedOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentQuestion, quiz]);

  // Auto-advance when time runs out
  useEffect(() => {
    if (!timedOut || submittingRef.current) return;
    Toast.show({ type: 'error', text1: 'Time Up!', text2: 'Moving to next question...', visibilityTime: 1200 });
    if (currentQuestion < totalQuestions - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 500);
    } else {
      setTimeout(() => handleSubmit(), 500);
    }
  }, [timedOut]);

  const canAdvance = useMemo(() => selectedAnswers[question?.id] !== undefined, [selectedAnswers, question]);

  const handleSelectAnswer = (optionIndex) => {
    if (!question) return;
    setSelectedAnswers(prev => ({ ...prev, [question.id]: optionIndex }));
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
      return;
    }
    handleSubmit();
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) setCurrentQuestion(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!quiz || !lectureId || submitting || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const response = await aiTutorAPI.submitQuiz(lectureId, selectedAnswers);
      if (!response.success) throw new Error(response.error || 'Unable to submit quiz');
      await fetchCourses();
      const result = response.result;
      Toast.show({
        type: result.passed ? 'success' : 'info',
        text1: result.passed ? 'Quiz Passed' : 'Quiz Submitted',
        text2: `Score: ${result.score}%`,
      });
      navigation.replace('QuizResult', { courseId, topicId, lectureId, ...result });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Submission Failed', text2: error.message || 'Unable to submit quiz answers.' });
      submittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout showSidebar={true} sidebarItems={sidebarItems} activeRoute="EnrolledCourses" onNavigate={handleNavigate}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading lecture quiz...</Text>
        </View>
      </MainLayout>
    );
  }

  if (!quiz || !question) {
    return (
      <MainLayout showSidebar={true} sidebarItems={sidebarItems} activeRoute="EnrolledCourses" onNavigate={handleNavigate}>
        <View style={styles.loadingWrap}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Quiz not available for this lecture.</Text>
        </View>
      </MainLayout>
    );
  }

  const isTimeLow = timeLeft <= 10;
  const parsedOptions = Array.isArray(question.options)
    ? question.options
    : (() => { try { return JSON.parse(question.options); } catch { return []; } })();

  return (
    <MainLayout showSidebar={true} sidebarItems={sidebarItems} activeRoute="EnrolledCourses" onNavigate={handleNavigate}>
      <ProgressBar progress={((currentQuestion + 1) / totalQuestions) * 100} style={styles.progressBar} />

      <ScrollView style={styles.content} contentContainerStyle={[styles.contentContainer, { maxWidth, alignSelf: 'center', width: '100%' }]}>

        {/* Summary bar */}
        <AppCard style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]} selectable={false}>Stored lecture quiz</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]} selectable={false}>
                Question {currentQuestion + 1} of {totalQuestions}
              </Text>
            </View>
            <View style={[styles.timerBadge, { backgroundColor: isTimeLow ? 'rgba(239,68,68,0.12)' : 'rgba(34,211,238,0.1)', borderColor: isTimeLow ? 'rgba(239,68,68,0.3)' : 'rgba(34,211,238,0.2)' }]}>
              <Icon name="time-outline" size={14} color={isTimeLow ? '#EF4444' : '#22D3EE'} />
              <Text style={[styles.timerText, { color: isTimeLow ? '#EF4444' : '#22D3EE' }]} selectable={false}>
                {timeLeft}s
              </Text>
            </View>
          </View>

          {/* Timer bar */}
          <View style={[styles.timerBarBg, { backgroundColor: theme.colors.border, marginTop: 10 }]}>
            <View style={[styles.timerBarFill, {
              width: `${(timeLeft / SECONDS_PER_QUESTION) * 100}%`,
              backgroundColor: isTimeLow ? '#EF4444' : '#22D3EE',
            }]} />
          </View>
        </AppCard>

        {/* Question */}
        <AppCard style={styles.questionContainer}>
          <Text style={[styles.questionNumber, { color: theme.colors.primary }]} selectable={false}>
            Question {currentQuestion + 1}
          </Text>
          <Text style={[styles.questionText, { color: theme.colors.textPrimary }, isWeb && { userSelect: 'none' }]} selectable={false}>
            {question.prompt}
          </Text>
        </AppCard>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {parsedOptions.map((option, index) => {
            const isSelected = selectedAnswers[question.id] === index;
            return (
              <Animated.View key={index} entering={FadeIn.duration(300).delay(index * 80)}>
                <TouchableOpacity
                  style={[
                    styles.option,
                    {
                      backgroundColor: isSelected ? `${theme.colors.primary}12` : theme.colors.card,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => handleSelectAnswer(index)}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionIndicator}>
                      <Icon name={isSelected ? 'radio-button-on' : 'radio-button-off'} size={22} color={isSelected ? theme.colors.primary : theme.colors.textTertiary} />
                    </View>
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionLabel, { color: isSelected ? theme.colors.primary : theme.colors.textSecondary }]} selectable={false}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                      <Text style={[styles.optionText, { color: theme.colors.textPrimary }, isWeb && { userSelect: 'none' }]} selectable={false}>
                        {option}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
        <AppButton
          title="Previous"
          onPress={handlePrevious}
          variant="outline"
          disabled={currentQuestion === 0 || submitting}
          icon={<Icon name="chevron-back" size={16} color={currentQuestion === 0 ? theme.colors.textTertiary : theme.colors.primary} />}
          iconPosition="left"
          style={styles.footerButton}
        />
        <AppButton
          title={currentQuestion === totalQuestions - 1 ? (submitting ? 'Submitting...' : 'Submit') : 'Next'}
          onPress={handleNext}
          variant="primary"
          disabled={!canAdvance || submitting}
          icon={<Icon name="chevron-forward" size={16} color="#ffffff" />}
          iconPosition="right"
          style={styles.footerButton}
        />
      </View>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  progressBar: { marginBottom: 0 },
  content: { flex: 1 },
  contentContainer: { padding: 20 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15 },
  summaryCard: { marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  summaryLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  timerText: { fontSize: 13, fontWeight: '700' },
  timerBarBg: { height: 3, borderRadius: 2, overflow: 'hidden' },
  timerBarFill: { height: '100%', borderRadius: 2 },
  questionContainer: { marginBottom: 24 },
  questionNumber: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  questionText: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  optionsContainer: { gap: 12 },
  option: { borderRadius: 16, padding: 16, borderWidth: 2 },
  optionContent: { flexDirection: 'row', alignItems: 'center' },
  optionIndicator: { marginRight: 12 },
  optionTextWrap: { flex: 1 },
  optionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  optionText: { flex: 1, fontSize: 16 },
  footer: { flexDirection: 'row', padding: 20, borderTopWidth: 1, gap: 12 },
  footerButton: { flex: 1 },
});

export default QuizScreen;
