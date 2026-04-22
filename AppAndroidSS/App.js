import React, { useMemo } from 'react';
import { NavigationContainer, getStateFromPath as defaultGetStateFromPath } from '@react-navigation/native';
import { StatusBar, StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { toastConfig } from './src/config/toastConfig';

// ── Static prefix list ────────────────────────────────────────────────────────
const PREFIXES = [
  'skillsphere://',
  ...(Platform.OS === 'web' && typeof window !== 'undefined'
    ? [window.location.origin]
    : []),
];

// ── Per-role screen maps ──────────────────────────────────────────────────────
const STUDENT_SCREENS = {
  Dashboard:          'dashboard',
  Courses:            'courses',
  CourseDetail:       'course/:courseId',
  EnrolledCourses:    'my-courses',
  Learning:           'learning',
  AILearning:         'ai-learning',
  AITutor:            'ai-tutor',
  Quiz:               'quiz',
  QuizResult:         'quiz-result',
  Certificates:       'certificates',
  CertificatePreview: 'certificate/:certId',
  Todo:               'todo',
  Categories:         'categories',
  ProgressDetail:     'progress',
  Notifications:      'notifications',
  Settings:           'settings',
  Payment:            'payment',
};

const INSTRUCTOR_SCREENS = {
  Dashboard:             'dashboard',
  Courses:               'courses',
  CreateCourse:          'courses/create',
  CourseDetail:          'course/:courseId',
  AddTopics:             'course/:courseId/topics',
  GenerationLogs:        'generation-logs',
  Students:              'students',
  StudentDetail:         'student/:studentId',
  CertificateManagement: 'certificates',
  Feedback:              'feedback',
  CategoryManagement:    'categories',
  ManageUsers:           'users',
  Notifications:         'notifications',
  Settings:              'settings',
};

const EXPERT_SCREENS = {
  Dashboard:    'dashboard',
  Courses:      'courses',
  CourseDetail: 'course/:courseId',
  FeedbackForm: 'feedback',
  Notifications:'notifications',
  Settings:     'settings',
};

const ADMIN_SCREENS = {
  Dashboard:             'dashboard',
  ManageUsers:           'users',
  ManageInstructors:          'instructors',
  ManageExperts:         'experts',
  Courses:               'courses',
  CreateCourse:          'courses/create',
  CourseDetail:          'course/:courseId',
  AddTopics:             'course/:courseId/topics',
  GenerationLogs:        'generation-logs',
  Students:              'students',
  StudentDetail:         'student/:studentId',
  CategoryManagement:    'categories',
  CertificateManagement: 'certificates',
  Feedback:              'feedback',
  Notifications:         'notifications',
  Settings:              'settings',
};

const AUTH_SCREENS = {
  Landing:              '',
  Login:                'login',
  Signup:               'signup',
  ExploreCourses:       'explore',
  ExploreCourseDetail:  'explore/:courseId',
};

const ROLE_CONFIG = {
  null:       { screens: { Auth:       { path: '',           screens: AUTH_SCREENS       } }, rootName: 'Auth'       },
  student:    { screens: { Student:    { path: 'student',    screens: STUDENT_SCREENS    } }, rootName: 'Student'    },
  instructor: { screens: { Instructor: { path: 'instructor', screens: INSTRUCTOR_SCREENS } }, rootName: 'Instructor' },
  expert:     { screens: { Expert:     { path: 'expert',     screens: EXPERT_SCREENS     } }, rootName: 'Expert'     },
  admin:      { screens: { Admin:      { path: 'admin',      screens: ADMIN_SCREENS      } }, rootName: 'Admin'      },
};

// ── NavigationWrapper — sits inside AuthProvider so it can read auth state ────
// The linking config is derived from the user's role so it always matches
// exactly the navigator that AppNavigator will mount. This prevents the
// "Cannot read properties of undefined (reading 'routes')" crash that happens
// when linking tries to resetRoot into a screen that isn't currently rendered.
const NavigationWrapper = ({ theme }) => {
  const { user, isInitialized } = useAuth();

  const linking = useMemo(() => {
    const role = isInitialized ? (user?.role ?? 'null') : 'null';
    const roleConfig = ROLE_CONFIG[role] ?? ROLE_CONFIG['null'];
    // The root screen name that AppNavigator actually mounts for this role.
    // Used as fallback so resetRoot never receives undefined (which crashes).
    const rootName = roleConfig?.rootName ?? 'Auth';
    const screens  = roleConfig?.screens  ?? {};

    return {
      prefixes: PREFIXES,
      config: { screens },
      getStateFromPath(path, options) {
        try {
          const state = defaultGetStateFromPath(path, options);
          if (state) return state;
        } catch (_) {}
        // useLinking calls resetRoot(state) even when state is undefined,
        // which crashes StackRouter. Return a valid root state instead.
        return { routes: [{ name: rootName }] };
      },
    };
  }, [user?.role, isInitialized]);

  return (
    <NavigationContainer
      linking={linking}
      theme={{
        dark: theme.mode === 'dark',
        colors: {
          primary:      theme.colors.primary,
          background:   theme.colors.background,
          card:         theme.colors.card,
          text:         theme.colors.text,
          border:       theme.colors.border,
          notification: theme.colors.primary,
        },
      }}
    >
      <AppNavigator />
    </NavigationContainer>
  );
};

// ── AppContent — ThemeContext is available here ───────────────────────────────
const AppContent = () => {
  const { theme } = useTheme();

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <AuthProvider>
        <DataProvider>
          <NavigationWrapper theme={theme} />
        </DataProvider>
      </AuthProvider>
      <Toast config={toastConfig(theme)} />
    </GestureHandlerRootView>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      width: '100%',
      height: '100%',
      minHeight: '100vh',
    }),
  },
});
