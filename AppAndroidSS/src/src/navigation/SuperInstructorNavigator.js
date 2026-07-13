import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SuperInstructorDashboard from '../screens/instructor/SuperInstructorDashboard';
import ManageUsersScreen from '../screens/instructor/ManageUsersScreen';
import SettingsScreen from '../screens/auth/SettingsScreen';
import CourseListScreen from '../screens/instructor/CourseListScreen';
import CreateCourseScreen from '../screens/instructor/CreateCourseScreen';
import CourseDetailScreen from '../screens/instructor/CourseDetailScreen';
import AddTopicsScreen from '../screens/instructor/AddTopicsScreen';
import GenerationLogsScreen from '../screens/instructor/GenerationLogsScreen';
import StudentListScreen from '../screens/instructor/StudentListScreen';
import StudentDetailScreen from '../screens/instructor/StudentDetailScreen';
import CategoryManagementScreen from '../screens/instructor/CategoryManagementScreen';
import CertificateManagementScreen from '../screens/instructor/CertificateManagementScreen';
import FeedbackScreen from '../screens/instructor/FeedbackScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import NotificationsScreen from '../screens/auth/NotificationsScreen';
import DiscussionScreen from '../screens/auth/DiscussionScreen';
import DiscussionThreadScreen from '../screens/auth/DiscussionThreadScreen';

const Stack = createStackNavigator();

const SuperInstructorNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="Dashboard" component={SuperInstructorDashboard} />
      <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
      <Stack.Screen name="ManageInstructors" component={ManageUsersScreen} />
      <Stack.Screen name="ManageExperts" component={ManageUsersScreen} />
      <Stack.Screen name="Courses" component={CourseListScreen} />
      <Stack.Screen name="CreateCourse" component={CreateCourseScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="AddTopics" component={AddTopicsScreen} />
      <Stack.Screen name="GenerationLogs" component={GenerationLogsScreen} />
      <Stack.Screen name="Students" component={StudentListScreen} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
      <Stack.Screen name="Categories" component={CategoryManagementScreen} />
      <Stack.Screen name="CategoryManagement" component={CategoryManagementScreen} />
      <Stack.Screen name="CertificateManagement" component={CertificateManagementScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Discussion" component={DiscussionScreen} />
      <Stack.Screen name="DiscussionThread" component={DiscussionThreadScreen} />
    </Stack.Navigator>
  );
};

export default SuperInstructorNavigator;
