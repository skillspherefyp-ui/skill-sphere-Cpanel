import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ExpertDashboard from '../screens/expert/ExpertDashboard';
import ExpertCourseListScreen from '../screens/expert/ExpertCourseListScreen';
import ExpertCourseDetailScreen from '../screens/expert/ExpertCourseDetailScreen';
import FeedbackFormScreen from '../screens/expert/FeedbackFormScreen';
import SettingsScreen from '../screens/auth/SettingsScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import NotificationsScreen from '../screens/auth/NotificationsScreen';
import DiscussionScreen from '../screens/auth/DiscussionScreen';
import DiscussionThreadScreen from '../screens/auth/DiscussionThreadScreen';

const Stack = createStackNavigator();

const ExpertNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="Dashboard" component={ExpertDashboard} />
      <Stack.Screen name="Courses" component={ExpertCourseListScreen} />
      <Stack.Screen name="CourseDetail" component={ExpertCourseDetailScreen} />
      <Stack.Screen name="FeedbackForm" component={FeedbackFormScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Discussion" component={DiscussionScreen} />
      <Stack.Screen name="DiscussionThread" component={DiscussionThreadScreen} />
    </Stack.Navigator>
  );
};

export default ExpertNavigator;
