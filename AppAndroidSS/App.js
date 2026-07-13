import React, { useMemo, useRef, useEffect } from 'react';
import { NavigationContainer, getStateFromPath as defaultGetStateFromPath, CommonActions } from '@react-navigation/native';
import { StatusBar, StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { toastConfig } from './src/config/toastConfig';
import { HelmetProvider } from 'react-helmet-async';

// ── Static prefix list ────────────────────────────────────────────────────────
const PREFIXES = [
  'skillsphere://',
  ...(Platform.OS === 'web' && typeof window !== 'undefined'
    ? [window.location.origin]
    : []),
];

// ── Per-role screen maps ──────────────────────────────────────────────────────
const STUDENT_SCREENS = {
  Verify:             'verify/:certId',
  Dashboard:          'dashboard',
  Courses:            'courses',
  CourseDetail:       'course/:courseId/:courseName',
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
  Verify:                'verify/:certId',
  Dashboard:             'dashboard',
  Courses:               'courses',
  CreateCourse:          'courses/create',
  CourseDetail:          'course/:courseId/:courseName',
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
  Verify:       'verify/:certId',
  Dashboard:    'dashboard',
  Courses:      'courses',
  CourseDetail: 'course/:courseId/:courseName',
  FeedbackForm: 'feedback',
  Notifications:'notifications',
  Settings:     'settings',
};

const ADMIN_SCREENS = {
  Verify:                'verify/:certId',
  Dashboard:             'dashboard',
  ManageUsers:           'users',
  ManageInstructors:          'instructors',
  ManageExperts:         'experts',
  Courses:               'courses',
  CreateCourse:          'courses/create',
  CourseDetail:          'course/:courseId/:courseName',
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
  ExploreCourseDetail:  'explore/:courseId/:courseName',
  CertificateVerify:    'certificate-verify',
  Verify:               'verify/:certId',
  About:                'about',
  PrivacyPolicy:        'privacy',
  Terms:                'terms',
  HelpCenter:           'help',
  Blog:                 'blog',
  BlogPost:             'blog/:postId',
  Community:            'community',
  Ownership:            'ownership',
  RefundPolicy:         'refund-policy',
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
  const navigationRef = useRef(null);

  // Capture the URL the user was on BEFORE auth loads (only once, on mount)
  const initialPathRef = useRef(
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.pathname + window.location.search
      : null
  );

  // Inject browser history entries on direct URL navigation so the browser's
  // back button works correctly. pushState/replaceState do NOT fire popstate,
  // so React Navigation is not affected — only the browser history stack changes.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const path = window.location.pathname;
    if (path === '/' || path === '') return;

    // Return the ordered parent paths (root → immediate parent) for a given URL.
    const getParents = (p) => {
      if (/^\/explore\/.+/.test(p))  return ['/', '/explore'];
      if (/^\/blog\/.+/.test(p))     return ['/', '/blog'];
      if (/^\/verify\/.+/.test(p))   return ['/'];
      // Certificate preview and payment → back goes to Certificates list
      if (/^\/student\/(certificate\/|payment)/.test(p)) return ['/', '/student/dashboard', '/student/certificates'];
      // Certificates list → back goes to Dashboard
      if (/^\/student\/certificates/.test(p)) return ['/', '/student/dashboard'];
      // Any other student/instructor/admin/expert deep page → back to dashboard
      if (/^\/(student|instructor|admin|expert)\/.+/.test(p)) return ['/', `/${p.split('/')[1]}/dashboard`];
      return ['/'];
    };

    const parents = getParents(path);
    const current = path + window.location.search + window.location.hash;

    // Build stack: replace the current entry with root, push intermediates,
    // then push the actual URL back so the address bar is unchanged.
    window.history.replaceState(null, '', parents[0]);
    for (let i = 1; i < parents.length; i++) {
      window.history.pushState(null, '', parents[i]);
    }
    window.history.pushState(null, '', current);
  }, []); // runs once on mount only

  // After auth initializes, restore the URL the user was on when they refreshed.
  // This is needed because getStateFromPath runs BEFORE the role is known, so the
  // initial parse uses AUTH screens and falls back to root (Dashboard) for any
  // role-specific URL. Once auth resolves we re-parse with the correct config.
  useEffect(() => {
    if (!isInitialized || Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;

    // /verify/:certId — works for all roles
    const verifyMatch = window.location.pathname.match(/^\/verify\/([^?/]+)/);
    if (verifyMatch) {
      const certId = verifyMatch[1];
      const timer = setTimeout(() => {
        if (navigationRef.current?.isReady()) {
          navigationRef.current.navigate('Verify', { certId });
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    // Role-specific screens — re-parse original URL with role config
    const savedPath = initialPathRef.current;
    if (!savedPath || savedPath === '/' || !user) return;
    initialPathRef.current = null; // only do this once

    const role = user.role ?? null;
    const roleConfig = ROLE_CONFIG[role] ?? ROLE_CONFIG['null'];

    const timer = setTimeout(() => {
      if (!navigationRef.current?.isReady()) return;
      try {
        const state = defaultGetStateFromPath(savedPath, { screens: roleConfig.screens });
        if (state) {
          navigationRef.current.dispatch(CommonActions.reset(state));
        }
      } catch (_) {}
    }, 200);
    return () => clearTimeout(timer);
  }, [isInitialized]);

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
        // /verify/:certId must work for ALL roles at the root path (no role prefix)
        const verifyMatch = path.match(/^\/verify\/([^?/]+)/);
        if (verifyMatch) {
          return {
            routes: [{
              name: rootName,
              state: { routes: [{ name: 'Verify', params: { certId: verifyMatch[1] } }] },
            }],
          };
        }
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
      ref={navigationRef}
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
    <HelmetProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </HelmetProvider>
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
