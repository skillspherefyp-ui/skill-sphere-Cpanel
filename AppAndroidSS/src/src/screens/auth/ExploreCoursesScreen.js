import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, useWindowDimensions, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import ThemedView from '../../components/ThemedView';
import AppHeader from '../../components/ui/AppHeader';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { categoryAPI, courseAPI } from '../../services/apiClient';
import { resolveFileUrl, slugify } from '../../utils/urlHelpers';
import { Helmet } from 'react-helmet-async';

const ORANGE = '#F68B3C';
const NAVY   = '#1A1A2E';

const stripMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/^[-•]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^---$/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
};
const NAVY2  = '#16213E';


const CAT_COLORS = {
  Programming: '#6366F1', Technology: '#6366F1', Design: '#EC4899',
  Business: '#10B981', 'Data Science': '#3B82F6', Data: '#3B82F6',
  Marketing: '#F59E0B', General: ORANGE,
};


// ── Course Card ───────────────────────────────────────────────────────────────
const CourseCard = ({ course, isDark, theme, isMobile, isTablet, onDetails, onEnroll }) => {
  const catName  = course.category?.name || 'General';
  const catColor = CAT_COLORS[catName] || ORANGE;
  const thumb    = course.thumbnailImage ? resolveFileUrl(course.thumbnailImage) : null;
  const cardBg   = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  return (
    <View style={[cc.card, { backgroundColor: cardBg, borderColor: cardBorder }, isMobile && cc.cardMobile]}>
      {/* Thumbnail */}
      <View style={[cc.thumb, isMobile && cc.thumbMobile, { backgroundColor: catColor + '20' }]}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Icon name="book-outline" size={isMobile ? 32 : 44} color={catColor} />
        )}
      </View>

      <View style={[cc.body, isMobile && cc.bodyMobile]}>
        {/* Category + Course Type badges */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <View style={[cc.catBadge, { backgroundColor: catColor + '20', marginBottom: 0 }]}>
            <Text style={[cc.catText, { color: catColor }]}>{catName}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, backgroundColor: course.creationMode === 'ai' ? 'rgba(139,92,246,0.12)' : 'rgba(34,211,238,0.1)', borderColor: course.creationMode === 'ai' ? 'rgba(139,92,246,0.3)' : 'rgba(34,211,238,0.25)' }}>
            <Icon name={course.creationMode === 'ai' ? 'sparkles' : 'person'} size={10} color={course.creationMode === 'ai' ? '#8B5CF6' : '#22D3EE'} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: course.creationMode === 'ai' ? '#8B5CF6' : '#22D3EE' }}>
              {course.creationMode === 'ai' ? 'AI-Powered' : 'Instructor-Led'}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[cc.title, { color: theme.colors.textPrimary }]} numberOfLines={2}>
          {course.name}
        </Text>

        {/* Description */}
        {!isMobile && (
          <Text style={[cc.desc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {stripMarkdown(course.description)}
          </Text>
        )}

        {/* Meta row */}
        <View style={cc.metaRow}>
          <View style={cc.metaItem}>
            <Icon name="bar-chart-outline" size={12} color={theme.colors.textSecondary} />
            <Text style={[cc.metaText, { color: theme.colors.textSecondary }]}>{course.level || 'All levels'}</Text>
          </View>
          <View style={cc.metaItem}>
            <Icon name="time-outline" size={12} color={theme.colors.textSecondary} />
            <Text style={[cc.metaText, { color: theme.colors.textSecondary }]}>{course.duration || 'Self-paced'}</Text>
          </View>
          {!isMobile && (
            <View style={cc.metaItem}>
              <Icon name="people-outline" size={12} color={theme.colors.textSecondary} />
              <Text style={[cc.metaText, { color: theme.colors.textSecondary }]}>
                {(course.enrollmentCount || 0).toLocaleString()} enrolled
              </Text>
            </View>
          )}
        </View>

        {/* Instructor */}
        {course.user?.name && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: isMobile ? 8 : 12 }}>
            <Icon name="person-circle-outline" size={13} color={theme.colors.textSecondary} />
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>{course.user.name}</Text>
          </View>
        )}

        {/* Buttons */}
        <View style={[cc.btnRow, isMobile && { flexDirection: 'column', gap: 6 }]}>
          <TouchableOpacity style={[cc.detailBtn, { borderColor: ORANGE }]} onPress={onDetails} activeOpacity={0.8}>
            <Icon name="eye-outline" size={14} color={ORANGE} />
            <Text style={[cc.detailBtnText, { color: ORANGE }]}>See Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cc.enrollBtn} onPress={onEnroll} activeOpacity={0.8}>
            <Icon name="person-add-outline" size={14} color="#FFFFFF" />
            <Text style={cc.enrollBtnText}>Sign Up to Enroll</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const cc = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  cardMobile: { flexDirection: 'row' },
  thumb: { height: 180, justifyContent: 'center', alignItems: 'center' },
  thumbMobile: { width: 120, height: 'auto', minHeight: 140, borderRadius: 0 },
  body: { padding: 16 },
  bodyMobile: { flex: 1, padding: 12 },
  catBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  catText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 16, fontWeight: '800', lineHeight: 22, marginBottom: 6 },
  desc: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  detailBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5 },
  detailBtnText: { fontSize: 13, fontWeight: '700' },
  enrollBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, backgroundColor: ORANGE, borderWidth: 1, borderColor: '#E77828', shadowColor: '#C96A24', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 },
  enrollBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.1 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const ExploreCoursesScreen = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();

  const isMobile  = width < 768;
  const isTablet  = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const maxW      = isDesktop ? 1200 : '100%';

  const [categories, setCategories]         = useState([]);
  const [courses, setCourses]               = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch]                 = useState(route.params?.search || '');
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.search !== undefined) {
        setSearch(route.params.search);
      }
      setLoading(true);
      setError(false);
      Promise.all([categoryAPI.getAll(), courseAPI.getAll()])
        .then(([catRes, courseRes]) => {
          setCategories(catRes.categories || []);
          setCourses((courseRes.courses || []).filter(c => c.status === 'published'));
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }, [route.params?.search])
  );

  const filtered = courses.filter(c => {
    const matchCat = selectedCategory === 'all' || c.categoryId === selectedCategory;
    const matchSearch = !search.trim() ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const numCols = isDesktop ? 3 : isTablet ? 2 : 1;

  const bgMain = isDark ? NAVY  : '#F0F2FF';
  const bgCard = isDark ? NAVY2 : '#FFFFFF';

  return (
    <ThemedView colorKey="background" style={{ flex: 1 }}>
      <Helmet>
        <title>Explore Courses - SkillSphere Pakistan</title>
        <meta name="description" content="Browse hundreds of expert-led online courses on SkillSphere. Learn programming, cybersecurity, data science, business, design and more in Pakistan." />
        <link rel="canonical" href="https://skillsphere.com.pk/explore" />
      </Helmet>
      <AppHeader
        showBack={true}
        showDateTime={false}
        minimal={true}
        title="Explore Courses"
        rightActions={!isMobile ? (
          <>
            <TouchableOpacity style={ec.signInBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={ec.signInText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ec.getStartedBtn} onPress={() => navigation.navigate('Signup')}>
              <Text style={ec.getStartedText}>Get Started</Text>
            </TouchableOpacity>
          </>
        ) : null}
        mobileDropdownFooter={(close) => (
          <>
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 4, marginHorizontal: 12 }} />
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, marginHorizontal: 6, marginVertical: 1, borderRadius: 12, gap: 12 }}
              onPress={() => { close(); setTimeout(() => navigation.navigate('Login'), 100); }}
              activeOpacity={0.7}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,140,66,0.1)' }}>
                <Icon name="log-in-outline" size={18} color="#FF8C42" />
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.85)' }}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, marginHorizontal: 6, marginVertical: 1, borderRadius: 12, gap: 12 }}
              onPress={() => { close(); setTimeout(() => navigation.navigate('Signup'), 100); }}
              activeOpacity={0.7}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,140,66,0.1)' }}>
                <Icon name="rocket-outline" size={18} color="#FF8C42" />
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.85)' }}>Get Started</Text>
            </TouchableOpacity>
          </>
        )}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: maxW, alignSelf: 'center', width: '100%' }}>

          {/* ── Hero ── */}
          <View style={[s.hero, { backgroundColor: isDark ? NAVY2 : '#FFFFFF' }]}>
            <View style={s.heroTag}>
              <Text style={{ color: ORANGE, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>ALL COURSES</Text>
            </View>
            <Text style={[s.heroTitle, { color: isDark ? '#FFFFFF' : NAVY }]}>
              Explore Our <Text style={{ color: ORANGE }}>Course Library</Text>
            </Text>
            <Text style={[s.heroSub, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(26,26,46,0.6)' }]}>
              Browse {courses.length} published courses. Sign up to start learning and earn certificates.
            </Text>

            {/* Search bar */}
            <View style={[s.searchWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F0F2FF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.1)' }]}>
              <Icon name="search-outline" size={18} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(26,26,46,0.4)'} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search courses..."
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(26,26,46,0.35)'}
                style={[s.searchInput, { color: isDark ? '#FFFFFF' : NAVY }]}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Icon name="close-circle" size={16} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(26,26,46,0.4)'} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Category chips ── */}
          <View style={[s.catSection, { backgroundColor: bgMain }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
              {[{ id: 'all', name: `All (${courses.length})` }, ...categories.map(c => ({
                ...c, name: `${c.name} (${courses.filter(x => x.categoryId === c.id).length})`
              }))].map(cat => {
                const isActive = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[s.catChip, isActive && s.catChipActive, !isActive && { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(26,26,46,0.15)', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF' }]}
                    onPress={() => setSelectedCategory(cat.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.catChipText, { color: isActive ? '#FFFFFF' : isDark ? 'rgba(255,255,255,0.7)' : NAVY }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Courses ── */}
          <View style={[s.coursesSection, { backgroundColor: bgMain, paddingHorizontal: isMobile ? 16 : 24 }]}>
            {/* Results header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#FFFFFF' : NAVY }}>
                {filtered.length} {filtered.length === 1 ? 'Course' : 'Courses'} Found
              </Text>
              {search.trim().length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Text style={{ color: ORANGE, fontSize: 13, fontWeight: '600' }}>Clear search</Text>
                </TouchableOpacity>
              )}
            </View>

            {loading && (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <ActivityIndicator size="large" color={ORANGE} />
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.5)', marginTop: 14, fontSize: 14 }}>
                  Loading courses...
                </Text>
              </View>
            )}

            {!loading && error && (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Icon name="cloud-offline-outline" size={48} color={ORANGE + '80'} />
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.5)', marginTop: 14, fontSize: 14 }}>
                  Could not load courses. Check your connection.
                </Text>
              </View>
            )}

            {!loading && !error && filtered.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Icon name="search-outline" size={48} color={ORANGE + '80'} />
                <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#FFFFFF' : NAVY, marginTop: 16 }}>
                  No courses found
                </Text>
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.5)', marginTop: 8, fontSize: 14 }}>
                  Try a different search term or category
                </Text>
              </View>
            )}

            {!loading && !error && filtered.length > 0 && (() => {
              // Build rows for grid layout on desktop/tablet
              if (!isMobile && numCols > 1) {
                const rows = [];
                for (let i = 0; i < filtered.length; i += numCols) {
                  rows.push(filtered.slice(i, i + numCols));
                }
                return rows.map((row, ri) => (
                  <View key={ri} style={{ flexDirection: 'row', gap: 16, marginBottom: 0 }}>
                    {row.map(course => (
                      <View key={course.id} style={{ flex: 1 }}>
                        <CourseCard
                          course={course} isDark={isDark} theme={theme}
                          isMobile={false} isTablet={isTablet}
                          onDetails={() => navigation.navigate('ExploreCourseDetail', { courseId: course.id, courseName: slugify(course.name) })}
                          onEnroll={() => navigation.navigate('Signup')}
                        />
                      </View>
                    ))}
                    {/* Fill empty cells */}
                    {row.length < numCols && Array(numCols - row.length).fill(0).map((_, i) => (
                      <View key={`empty-${i}`} style={{ flex: 1 }} />
                    ))}
                  </View>
                ));
              }
              // Mobile: single column
              return filtered.map(course => (
                <CourseCard
                  key={course.id}
                  course={course} isDark={isDark} theme={theme}
                  isMobile={true} isTablet={false}
                  onDetails={() => navigation.navigate('ExploreCourseDetail', { courseId: course.id, courseName: slugify(course.name) })}
                  onEnroll={() => navigation.navigate('Signup')}
                />
              ));
            })()}
          </View>

          {/* ── CTA Banner ── */}
          {!loading && (
            <View style={[s.ctaBanner, { backgroundColor: isDark ? NAVY2 : NAVY }]}>
              <View style={s.ctaInner}>
                <Icon name="school-outline" size={40} color={ORANGE} style={{ marginBottom: 16 }} />
                <Text style={s.ctaTitle}>Ready to Start Learning?</Text>
                <Text style={s.ctaSub}>
                  Create a free account and get instant access to all courses, AI tutor, and certificates.
                </Text>
                <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 12, marginTop: 20 }}>
                  <TouchableOpacity style={s.ctaBtnPrimary} onPress={() => navigation.navigate('Signup')}>
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Create Free Account</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.ctaBtnSecondary} onPress={() => navigation.navigate('Login')}>
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const s = StyleSheet.create({
  hero: { paddingVertical: 52, paddingHorizontal: 24, alignItems: 'center' },
  heroTag: { backgroundColor: ORANGE + '20', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 14 },
  heroTitle: { fontSize: 32, fontWeight: '900', textAlign: 'center', lineHeight: 40, marginBottom: 12 },
  heroSub: { fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: 540, marginBottom: 28 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, width: '100%', maxWidth: 520 },
  searchInput: { flex: 1, fontSize: 14, outlineStyle: 'none' },
  catSection: { paddingVertical: 16, paddingHorizontal: 24 },
  catScroll: { gap: 8, paddingVertical: 4 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  catChipActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  catChipText: { fontSize: 13, fontWeight: '600' },
  coursesSection: { paddingTop: 8, paddingBottom: 40 },
  ctaBanner: { marginHorizontal: 24, marginBottom: 0, borderRadius: 20, overflow: 'hidden' },
  ctaInner: { padding: 48, alignItems: 'center' },
  ctaTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 10 },
  ctaSub: { fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 24, maxWidth: 480 },
  ctaBtnPrimary: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, backgroundColor: ORANGE, borderWidth: 1, borderColor: '#E77828', shadowColor: '#C96A24', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.16, shadowRadius: 6, elevation: 3 },
  ctaBtnSecondary: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
});

const ec = StyleSheet.create({
  signInBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)' },
  signInText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  getStartedBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: ORANGE, borderWidth: 1, borderColor: '#E77828' },
  getStartedText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});

export default ExploreCoursesScreen;
