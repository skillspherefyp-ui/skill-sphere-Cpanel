<<<<<<< HEAD
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, useWindowDimensions, ActivityIndicator, AppState } from 'react-native';
=======
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, useWindowDimensions, ActivityIndicator } from 'react-native';
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeIn } from 'react-native-reanimated';
import MainLayout from '../../components/ui/MainLayout';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import ProgressBar from '../../components/ui/ProgressBar';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { quizAPI } from '../../services/apiClient';
import { useData } from '../../context/DataContext';
import AIQuizScreen from './AIQuizScreen';
import { getSidebarItems } from '../../utils/sidebarItems';

<<<<<<< HEAD
const SECONDS_PER_QUESTION = 30;

=======
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
const QuizScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const courseId  = typeof params.courseId  === 'string' ? parseInt(params.courseId,  10) : params.courseId;
  const topicId   = typeof params.topicId   === 'string' ? parseInt(params.topicId,   10) : params.topicId;
  const lectureId = typeof params.lectureId === 'string' ? parseInt(params.lectureId, 10) : params.lectureId;
  const topics    = params.topics;
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const { fetchCourses } = useData();
  const { user, logout } = useAuth();

  const sidebarItems = getSidebarItems(user?.role);
  const handleNavigate = (route) => {
    if (route === 'CertificateVerify') {
      navigation.navigate(route, { fromStudent: true });
    } else {
      navigation.navigate(route);
    }
  };

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});

<<<<<<< HEAD
  // Timer
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef(null);
  const submittingRef = useRef(false);
  const cheatingRef = useRef(false);
  const quizRef = useRef(null);

=======
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
  const isWeb = Platform.OS === 'web';
  const maxWidth = isWeb && width > 1200 ? 1200 : '100%';

  useEffect(() => {
    if (!lectureId) fetchQuiz();
  }, [topicId, lectureId]);

  if (lectureId) {
    return <AIQuizScreen />;
  }

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const data = await quizAPI.getByTopic(topicId);
      setQuiz(data.quiz);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to load quiz' });
    } finally {
      setLoading(false);
    }
  };

  const question = quiz?.questions?.[currentQuestion];
  const totalQuestions = quiz?.questions?.length || 0;

<<<<<<< HEAD
  // Keep ref in sync so cheat handler can read latest value without stale closure
  useEffect(() => { quizRef.current = quiz; }, [quiz]);

  // Cheat detection — tab switch (web) or app background (native)
  const handleCheat = () => {
    if (cheatingRef.current || submittingRef.current) return;
    cheatingRef.current = true;
    submittingRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    const total = quizRef.current?.questions?.length || 0;
    Toast.show({ type: 'error', text1: 'Quiz Terminated', text2: 'Tab switching detected. Score: 0%', visibilityTime: 3000 });
    setTimeout(() => {
      navigation.replace('QuizResult', {
        courseId, topicId,
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

=======
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
  const handleSelectAnswer = (optionIndex) => {
    if (!question) return;
    setSelectedAnswers(prev => ({ ...prev, [question.id]: optionIndex }));
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
<<<<<<< HEAD
    if (submitting || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
=======
    if (submitting) return;
    setSubmitting(true);
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
    try {
      const data = await quizAPI.submit({
        quizId: quiz.id,
        answers: selectedAnswers,
      });
      const result = data.result;

      if (result.passed) {
        Toast.show({
          type: 'success',
          text1: '🎉 Quiz Passed!',
          text2: `Score: ${result.score}% — Moving to next topic...`,
        });
<<<<<<< HEAD
        await fetchCourses();
        const targetTopicId = result.nextTopicId;
=======

        // Refresh DataContext so completion state is current
        await fetchCourses();

        // Use nextTopicId from backend response (most reliable)
        const targetTopicId = result.nextTopicId;

>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
        setTimeout(() => {
          if (targetTopicId) {
            navigation.replace('Learning', { courseId, topicId: targetTopicId });
          } else {
<<<<<<< HEAD
            navigation.navigate('QuizResult', {
              courseId, topicId,
=======
            // Course complete
            navigation.navigate('QuizResult', {
              courseId,
              topicId,
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
              score: result.score,
              totalQuestions: result.totalQuestions,
              correctCount: result.correctAnswers,
              passed: result.passed,
              courseComplete: result.courseComplete,
            });
          }
        }, 2000);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Quiz Not Passed',
          text2: `Score: ${result.score}% — Need ${quiz.passingScore || 70}% to pass`,
        });
        setTimeout(() => {
          navigation.navigate('QuizResult', {
<<<<<<< HEAD
            courseId, topicId,
=======
            courseId,
            topicId,
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
            score: result.score,
            totalQuestions: result.totalQuestions,
            correctCount: result.correctAnswers,
            passed: result.passed,
            courseComplete: false,
          });
        }, 1500);
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to submit quiz' });
<<<<<<< HEAD
      submittingRef.current = false;
=======
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
<<<<<<< HEAD
      <MainLayout showSidebar={true} sidebarItems={sidebarItems} activeRoute="EnrolledCourses" onNavigate={handleNavigate}>
=======
      <MainLayout
        showSidebar={true}
        sidebarItems={sidebarItems}
        activeRoute="EnrolledCourses"
        onNavigate={handleNavigate}
      >
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading quiz...</Text>
        </View>
      </MainLayout>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
<<<<<<< HEAD
      <MainLayout showSidebar={true} sidebarItems={sidebarItems} activeRoute="EnrolledCourses" onNavigate={handleNavigate}>
=======
      <MainLayout
        showSidebar={true}
        sidebarItems={sidebarItems}
        activeRoute="EnrolledCourses"
        onNavigate={handleNavigate}
      >
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
        <View style={styles.centered}>
          <Icon name="help-circle-outline" size={64} color={theme.colors.textTertiary} />
          <Text style={[styles.noQuizText, { color: theme.colors.textSecondary }]}>
            No quiz available for this topic yet.
          </Text>
          <AppButton title="Go Back" onPress={() => navigation.goBack()} variant="outline" style={{ marginTop: 16 }} />
        </View>
      </MainLayout>
    );
  }

  const isLastQuestion = currentQuestion === totalQuestions - 1;
  const hasAnswered = question && selectedAnswers[question.id] !== undefined;
<<<<<<< HEAD
  const isTimeLow = timeLeft <= 10;

  return (
    <MainLayout showSidebar={true} sidebarItems={sidebarItems} activeRoute="EnrolledCourses" onNavigate={handleNavigate}>
=======

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="EnrolledCourses"
      onNavigate={handleNavigate}
    >
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
      <ProgressBar
        progress={((currentQuestion + 1) / totalQuestions) * 100}
        style={styles.progressBar}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { maxWidth, alignSelf: 'center', width: '100%' }]}
      >
<<<<<<< HEAD
        {/* Question card */}
        <AppCard style={styles.questionContainer}>
          {/* Header row: question number + timer */}
          <View style={styles.questionHeaderRow}>
            <Text style={[styles.questionNumber, { color: theme.colors.primary }]} selectable={false}>
              Question {currentQuestion + 1} of {totalQuestions}
            </Text>
            <View style={[styles.timerBadge, { backgroundColor: isTimeLow ? 'rgba(239,68,68,0.12)' : 'rgba(34,211,238,0.1)', borderColor: isTimeLow ? 'rgba(239,68,68,0.3)' : 'rgba(34,211,238,0.2)' }]}>
              <Icon name="time-outline" size={14} color={isTimeLow ? '#EF4444' : '#22D3EE'} />
              <Text style={[styles.timerText, { color: isTimeLow ? '#EF4444' : '#22D3EE' }]} selectable={false}>
                {timeLeft}s
              </Text>
            </View>
          </View>

          {/* Timer bar */}
          <View style={[styles.timerBarBg, { backgroundColor: theme.colors.border }]}>
            <View style={[styles.timerBarFill, {
              width: `${(timeLeft / SECONDS_PER_QUESTION) * 100}%`,
              backgroundColor: isTimeLow ? '#EF4444' : '#22D3EE',
            }]} />
          </View>

          <Text
            style={[styles.questionText, { color: theme.colors.textPrimary }, isWeb && { userSelect: 'none' }]}
            selectable={false}
          >
=======
        <AppCard style={styles.questionContainer}>
          <Text style={[styles.questionNumber, { color: theme.colors.primary }]}>
            Question {currentQuestion + 1} of {totalQuestions}
          </Text>
          <Text style={[styles.questionText, { color: theme.colors.textPrimary }]}>
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
            {question.question}
          </Text>
        </AppCard>

<<<<<<< HEAD
        {/* Options */}
=======
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => {
            const isSelected = selectedAnswers[question.id] === index;
            return (
              <Animated.View key={index} entering={FadeIn.duration(300).delay(index * 80)}>
                <TouchableOpacity
                  style={[
                    styles.option,
                    {
                      backgroundColor: isSelected ? theme.colors.primary + '18' : theme.colors.card,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    }
                  ]}
                  onPress={() => handleSelectAnswer(index)}
                >
                  <View style={styles.optionContent}>
                    <View style={[styles.optionLetter, { backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface }]}>
<<<<<<< HEAD
                      <Text style={[styles.optionLetterText, { color: isSelected ? '#fff' : theme.colors.textSecondary }]} selectable={false}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text style={[styles.optionText, { color: theme.colors.textPrimary }, isWeb && { userSelect: 'none' }]} selectable={false}>
                      {option}
                    </Text>
                    {isSelected && <Icon name="checkmark-circle" size={20} color={theme.colors.primary} />}
=======
                      <Text style={[styles.optionLetterText, { color: isSelected ? '#fff' : theme.colors.textSecondary }]}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text style={[styles.optionText, { color: theme.colors.textPrimary }]}>{option}</Text>
                    {isSelected && (
                      <Icon name="checkmark-circle" size={20} color={theme.colors.primary} />
                    )}
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

<<<<<<< HEAD
        <Text style={[styles.passingInfo, { color: theme.colors.textTertiary }]} selectable={false}>
=======
        {/* Passing score info */}
        <Text style={[styles.passingInfo, { color: theme.colors.textTertiary }]}>
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
          Passing score: {quiz.passingScore || 70}%
        </Text>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
        <AppButton
          title="Previous"
          onPress={handlePrevious}
          variant="outline"
          disabled={currentQuestion === 0 || submitting}
          leftIcon="chevron-back"
          style={styles.footerButton}
        />
        <AppButton
          title={submitting ? 'Submitting...' : isLastQuestion ? 'Submit' : 'Next'}
          onPress={handleNext}
          variant="primary"
          disabled={!hasAnswered || submitting}
          leftIcon={isLastQuestion ? 'checkmark' : 'chevron-forward'}
          style={styles.footerButton}
        />
      </View>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
<<<<<<< HEAD
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  loadingText: { fontSize: 16, marginTop: 8 },
  noQuizText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  progressBar: { marginBottom: 0, backgroundColor: '#FF8C42' },
  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 32 },
  questionContainer: { marginBottom: 24, padding: 20, borderTopWidth: 3, borderTopColor: '#FF8C42' },
  questionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  questionNumber: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  timerText: { fontSize: 13, fontWeight: '700' },
  timerBarBg: { height: 3, borderRadius: 2, marginBottom: 14, overflow: 'hidden' },
  timerBarFill: { height: '100%', borderRadius: 2 },
  questionText: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  optionsContainer: { gap: 12 },
  option: { borderRadius: 12, padding: 16 },
  optionContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionLetter: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  optionLetterText: { fontSize: 14, fontWeight: '700' },
  optionText: { flex: 1, fontSize: 15, lineHeight: 22 },
  passingInfo: { marginTop: 24, fontSize: 13, textAlign: 'center' },
  footer: { flexDirection: 'row', padding: 20, borderTopWidth: 1, gap: 12 },
  footerButton: { flex: 1 },
=======
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
  noQuizText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  progressBar: {
    marginBottom: 0,
    backgroundColor: '#FF8C42',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  questionContainer: {
    marginBottom: 24,
    padding: 20,
    borderTopWidth: 3,
    borderTopColor: '#FF8C42',
  },
  questionNumber: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 0,
    // Active state border is handled inline via isSelected ? theme.colors.primary : theme.colors.border
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLetterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  passingInfo: {
    marginTop: 24,
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
});

export default QuizScreen;
