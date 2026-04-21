import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';

const ORANGE = '#F68B3C';
const NAVY   = '#1A1A2E';

const FAQS = [
  {
    category: 'Getting Started',
    icon: 'rocket-outline',
    items: [
      {
        q: 'How do I create an account?',
        a: 'Tap "Get Started" on the landing page, enter your name, email, and password, then verify your email with the OTP code we send you.',
      },
      {
        q: 'Can I use SkillSphere on my phone?',
        a: 'Yes. SkillSphere works on web browsers, Android, and iOS. Your progress is synced across all your devices automatically.',
      },
      {
        q: 'Is SkillSphere free?',
        a: 'Creating an account is free. Course availability depends on the instructor — some courses are free, others may have a fee set by the instructor.',
      },
    ],
  },
  {
    category: 'Courses & Enrolment',
    icon: 'library-outline',
    items: [
      {
        q: 'How do I enrol in a course?',
        a: 'Browse courses from the Explore page, open the course you want, and tap "Enrol". If the course has prerequisites, you must complete those first.',
      },
      {
        q: 'What are course prerequisites?',
        a: 'Some courses require you to complete one or more other courses first. You can see the prerequisites on the course detail page — green means completed, amber means still needed.',
      },
      {
        q: 'How is my progress tracked?',
        a: 'As you view each material in a course, your progress is tracked automatically. The progress bar on your course page shows your overall completion percentage.',
      },
      {
        q: 'Can I access course materials offline?',
        a: 'Not currently. Course materials require an internet connection. We plan to add offline support in a future update.',
      },
    ],
  },
  {
    category: 'Certificates',
    icon: 'ribbon-outline',
    items: [
      {
        q: 'How do I earn a certificate?',
        a: 'Complete all materials in a course (100% progress). Your certificate is generated and emailed to you automatically — no need to request it manually.',
      },
      {
        q: 'Where can I find my certificates?',
        a: 'Go to your profile or the "My Certificates" section in the app. From there you can view, download, and share your certificates.',
      },
      {
        q: 'Can employers verify my certificate?',
        a: 'Yes. Each certificate has a unique certificate number. Anyone can verify it using the "Verify Certificate" page on the SkillSphere website — no account required.',
      },
    ],
  },
  {
    category: 'AI Features',
    icon: 'sparkles-outline',
    items: [
      {
        q: 'What is the AI Tutor?',
        a: 'The AI Tutor delivers structured lessons with slides, diagrams, and quizzes tailored to your level. You can access it from within any course.',
      },
      {
        q: 'What is AI Chat?',
        a: 'AI Chat is a general-purpose assistant inside the app. You can ask any learning-related question and get instant responses. Your chat history is saved between sessions.',
      },
      {
        q: 'Are AI responses always accurate?',
        a: 'AI can make mistakes. Always cross-check important information with trusted sources. AI responses are meant to support your learning, not replace expert advice.',
      },
    ],
  },
  {
    category: 'Account & Profile',
    icon: 'person-circle-outline',
    items: [
      {
        q: 'How do I change my password?',
        a: 'Go to your profile settings and select "Change Password". You can also use the "Forgot Password" option on the login page if you\'ve been locked out.',
      },
      {
        q: 'How do I update my profile?',
        a: 'Tap your profile picture or name to open your profile settings. You can update your name, photo, and other details there.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Contact us at skillspherefyp@gmail.com to request account deletion. We will process your request within 7 business days.',
      },
    ],
  },
];

const HelpCenterScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const [openItem, setOpenItem] = useState(null); // 'cat-idx'

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <View style={[s.header, { paddingTop: Platform.OS === 'ios' ? 50 : 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Help Center</Text>
        <ThemeToggle iconColor="#FFFFFF" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>

        <Text style={[s.intro, { color: c.textSecondary }]}>
          Browse the frequently asked questions below or contact us at{' '}
          <Text style={{ color: ORANGE, fontWeight: '600' }}>skillspherefyp@gmail.com</Text>
        </Text>

        {FAQS.map((cat) => (
          <View key={cat.category} style={{ marginBottom: 24 }}>

            {/* Category header */}
            <View style={s.catHeader}>
              <View style={[s.catIconBox, { backgroundColor: ORANGE + '18' }]}>
                <Icon name={cat.icon} size={18} color={ORANGE} />
              </View>
              <Text style={[s.catTitle, { color: c.textPrimary }]}>{cat.category}</Text>
            </View>

            {/* FAQ items */}
            {cat.items.map((item, idx) => {
              const key = `${cat.category}-${idx}`;
              const isOpen = openItem === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[s.faqItem, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                    borderColor: isOpen ? ORANGE : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)'),
                  }]}
                  onPress={() => setOpenItem(isOpen ? null : key)}
                  activeOpacity={0.85}>
                  <View style={s.faqRow}>
                    <Text style={[s.faqQ, { color: c.textPrimary, flex: 1 }]}>{item.q}</Text>
                    <View style={[s.chevronBox, {
                      backgroundColor: isOpen ? ORANGE + '18' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                    }]}>
                      <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={14}
                        color={isOpen ? ORANGE : c.textSecondary} />
                    </View>
                  </View>
                  {isOpen && (
                    <Text style={[s.faqA, { color: c.textSecondary }]}>{item.a}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Still need help? */}
        <View style={[s.contactCard, {
          backgroundColor: isDark ? 'rgba(246,139,60,0.08)' : 'rgba(246,139,60,0.06)',
          borderColor: ORANGE + '30',
        }]}>
          <Icon name="mail-outline" size={24} color={ORANGE} style={{ marginBottom: 10 }} />
          <Text style={[s.contactTitle, { color: c.textPrimary }]}>Still need help?</Text>
          <Text style={[s.contactSub, { color: c.textSecondary }]}>
            Can't find the answer you're looking for? Send us a message through the contact form on our home page or email us directly.
          </Text>
          <Text style={[s.contactEmail, { color: ORANGE }]}>skillspherefyp@gmail.com</Text>
        </View>

      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  header: {
    backgroundColor: NAVY, paddingHorizontal: 16, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headerIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(246,139,60,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  intro: { fontSize: 14, lineHeight: 22, marginBottom: 24 },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  catIconBox: { width: 34, height: 34, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  catTitle: { fontSize: 15, fontWeight: '800' },
  faqItem: {
    borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8,
  },
  faqRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqQ: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  chevronBox: { width: 26, height: 26, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  faqA: { fontSize: 13, lineHeight: 21, marginTop: 10 },
  contactCard: {
    borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center', marginTop: 8,
  },
  contactTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  contactSub: { fontSize: 13, lineHeight: 21, textAlign: 'center', marginBottom: 10 },
  contactEmail: { fontSize: 14, fontWeight: '700' },
});

export default HelpCenterScreen;
