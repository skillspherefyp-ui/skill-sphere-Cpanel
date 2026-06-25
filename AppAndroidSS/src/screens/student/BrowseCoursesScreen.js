<<<<<<< HEAD
import React, { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
=======
import React, { useState, useEffect, useMemo, useCallback } from 'react';
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';

const ORANGE = '#FF8C42';
<<<<<<< HEAD

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
=======
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import MainLayout from '../../components/ui/MainLayout';
import AppCard from '../../components/ui/AppCard';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { resolveFileUrl, slugify } from '../../utils/urlHelpers';
import { getSidebarItems } from '../../utils/sidebarItems';

const BrowseCoursesScreen = () => {
  const { courses, categories, enrollments, fetchCourses, fetchCategories } = useData();
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(route.params?.category || 'All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
<<<<<<< HEAD
  const [roadmapMode, setRoadmapMode] = useState(true);
=======
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821

  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width > 1024;
  const isTablet = width > 768;
  const isMobile = width <= 480;

  // Student sidebar navigation items
  const sidebarItems = getSidebarItems(user?.role);

  const levelOptions = [
    { label: 'All Levels', value: 'All' },
    { label: 'Beginner', value: 'Beginner' },
    { label: 'Intermediate', value: 'Intermediate' },
    { label: 'Advanced', value: 'Advanced' },
  ];

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Name A-Z', value: 'name-asc' },
    { label: 'Name Z-A', value: 'name-desc' },
    { label: 'Most Popular', value: 'popular' },
<<<<<<< HEAD
    { label: 'Learning Roadmap', value: 'roadmap' },
=======
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
  ];

  const handleNavigate = (routeName) => {
    navigation.navigate(routeName);
  };

  useEffect(() => {
    if (route.params?.category) {
      setSelectedCategory(route.params.category);
    }
  }, [route.params?.category]);

  // Fetch data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([fetchCourses(), fetchCategories()]);
    } catch (error) {
      console.error('Error loading courses:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load courses' });
    } finally {
      setLoading(false);
    }
  }, [fetchCourses, fetchCategories]);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Get enrolled course IDs
  const enrolledCourseIds = useMemo(() => {
    return new Set(enrollments.map(e => e.courseId || e.course?.id));
  }, [enrollments]);

  // Stats calculation
  const stats = useMemo(() => {
    const publishedCourses = courses.filter(c => c.status === 'published');
    const totalCourses = publishedCourses.length;
    const totalCategories = categories.length;
    const beginnerCourses = publishedCourses.filter(c => c.level === 'Beginner').length;
    const advancedCourses = publishedCourses.filter(c => c.level === 'Advanced').length;

    return { totalCourses, totalCategories, beginnerCourses, advancedCourses };
  }, [courses, categories]);

<<<<<<< HEAD
  // Build chains for roadmap mode.
  // If a root has multiple children, creates one separate chain per child (root duplicated).
  const buildChains = (courseList) => {
    const filteredIds = new Set(courseList.map(c => c.id));
    const visited = new Set();
    const chains = [];

    const roots = courseList.filter(c =>
      !(c.prerequisiteIds || []).some(pid => filteredIds.has(pid))
    );

    const followLinear = (start) => {
      const chain = [start];
      visited.add(start.id);
      let current = start;
      while (true) {
        const next = courseList.filter(c =>
          !visited.has(c.id) && (c.prerequisiteIds || []).includes(current.id)
        );
        if (next.length !== 1) break;
        chain.push(next[0]);
        visited.add(next[0].id);
        current = next[0];
      }
      return chain;
    };

    roots.forEach(root => {
      if (visited.has(root.id)) return;
      const children = courseList.filter(c =>
        !visited.has(c.id) && (c.prerequisiteIds || []).includes(root.id)
      );
      if (children.length <= 1) {
        chains.push(followLinear(root));
      } else {
        visited.add(root.id);
        children.forEach(child => chains.push([root, ...followLinear(child)]));
      }
    });

    courseList.forEach(c => {
      if (!visited.has(c.id)) chains.push([c]);
    });

    return chains;
  };

=======
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let filtered = courses.filter(course => {
      // Only show published courses
      if (course.status !== 'published') return false;

      // Search filter
      const matchesSearch =
        course.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategory === 'All' || course.category?.name === selectedCategory;

      // Level filter
      const matchesLevel =
        selectedLevel === 'All' || course.level === selectedLevel;

      return matchesSearch && matchesCategory && matchesLevel;
    });

<<<<<<< HEAD
    // Roadmap mode handled separately via buildChains
    if (roadmapMode) return filtered;

=======
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
    // Sort
    switch (sortOrder) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'name-asc':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.studentsCount || 0) - (a.studentsCount || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    return filtered;
<<<<<<< HEAD
  }, [courses, searchQuery, selectedCategory, selectedLevel, sortOrder, roadmapMode]);

  const styles = getStyles(theme, isDark, isLargeScreen, isTablet, isMobile);

  const renderChainBlock = (chain, chainIndex) => (
    <Animated.View key={chainIndex} entering={FadeInDown.duration(400).delay(chainIndex * 80)} style={[styles.chainBlock, { backgroundColor: isDark ? theme.colors.card : '#fff', borderColor: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.15)' }]}>
      <View style={styles.chainHeader}>
        <View style={[styles.chainHeaderIcon, { backgroundColor: '#8B5CF620' }]}>
          <Icon name="git-branch-outline" size={16} color="#8B5CF6" />
        </View>
        <Text style={[styles.chainHeaderTitle, { color: theme.colors.textPrimary }]}>
          {chain.length > 1 ? `Learning Path · ${chain.length} Courses` : 'Standalone Course'}
        </Text>
        <View style={[styles.chainHeaderPill, { backgroundColor: chain.length > 1 ? '#8B5CF620' : '#10B98120' }]}>
          <Text style={[styles.chainHeaderPillText, { color: chain.length > 1 ? '#8B5CF6' : '#10B981' }]}>
            {chain.length > 1 ? 'Sequential' : 'Independent'}
          </Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chainScroll}>
        {chain.map((course, stepIndex) => {
          const isEnrolled = enrolledCourseIds.has(course.id);
          return (
            <View key={course.id} style={styles.chainStepRow}>
              {renderRoadmapCard(course, stepIndex, isEnrolled)}
              {stepIndex < chain.length - 1 && (
                <View style={styles.chainArrow}>
                  <View style={[styles.chainArrowLine, { backgroundColor: '#8B5CF640' }]} />
                  <Icon name="chevron-forward" size={18} color="#8B5CF6" />
                  <View style={[styles.chainArrowLine, { backgroundColor: '#8B5CF640' }]} />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );

  const renderRoadmapCard = (course, stepIndex, isEnrolled) => (
    <TouchableOpacity
      style={[styles.roadmapCard, {
        backgroundColor: isDark ? '#1a1f35' : '#f8f7ff',
        borderColor: isEnrolled ? '#10B981' : 'rgba(139,92,246,0.25)',
      }]}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('CourseDetail', { courseId: course.id, courseName: slugify(course.name) })}
    >
      <View style={[styles.stepBadge, { backgroundColor: isEnrolled ? '#10B981' : '#8B5CF6' }]}>
        {isEnrolled
          ? <Icon name="checkmark" size={12} color="#fff" />
          : <Text style={styles.stepBadgeText}>{stepIndex + 1}</Text>
        }
      </View>
      {course.thumbnailImage ? (
        <Image source={{ uri: resolveFileUrl(course.thumbnailImage) }} style={styles.roadmapCardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.roadmapCardImagePlaceholder, { backgroundColor: theme.colors.primary + '15' }]}>
          <Icon name="image-outline" size={28} color={theme.colors.primary} />
        </View>
      )}
      <View style={styles.roadmapCardBody}>
        <Text style={[styles.roadmapCardCategory, { color: '#8B5CF6' }]} numberOfLines={1}>
          {course.category?.name || 'Course'}
        </Text>
        <Text style={[styles.roadmapCardTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>
          {course.name}
        </Text>
        <View style={styles.roadmapCardMeta}>
          <View style={styles.metaItem}>
            <Icon name="book-outline" size={12} color={theme.colors.textTertiary} />
            <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>{course.topics?.length || 0} topics</Text>
          </View>
          <View style={[styles.roadmapLevelDot, { backgroundColor: getLevelColor(course.level) }]} />
          <Text style={[styles.metaText, { color: getLevelColor(course.level) }]}>{course.level || 'All'}</Text>
        </View>
        <View style={[styles.roadmapCardBtn, { backgroundColor: isEnrolled ? '#10B981' : '#8B5CF6' }]}>
          <Text style={styles.roadmapCardBtnText}>{isEnrolled ? 'Continue' : 'View'}</Text>
          <Icon name="arrow-forward" size={12} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );

=======
  }, [courses, searchQuery, selectedCategory, selectedLevel, sortOrder]);

  const styles = getStyles(theme, isDark, isLargeScreen, isTablet, isMobile);

>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
  // Loading state
  if (loading) {
    return (
      <MainLayout
        showSidebar={true}
        sidebarItems={sidebarItems}
        activeRoute="Courses"
        onNavigate={handleNavigate}
        userInfo={{ name: user?.name, role: 'Student', avatar: user?.avatar }}
        onLogout={logout}
        onSettings={() => navigation.navigate('Settings')}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading courses...
          </Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="Courses"
      onNavigate={handleNavigate}
      userInfo={{ name: user?.name, role: 'Student', avatar: user?.avatar }}
      onLogout={logout}
      onSettings={() => navigation.navigate('Settings')}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Page Header Banner */}
        <View style={[styles.pageHeaderBanner, {
          backgroundColor: isDark ? 'rgba(255,140,66,0.06)' : 'rgba(255,140,66,0.05)',
          borderColor: 'rgba(255,140,66,0.15)',
        }]}>
          <View style={styles.bannerLeft}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.06)' }]}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.bannerIconCircle}>
              <Icon name="library" size={22} color={ORANGE} />
            </View>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>Browse Courses</Text>
              <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>Discover your next learning adventure</Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <AppCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <Icon name="library" size={24} color={theme.colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {stats.totalCourses}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Total Courses
            </Text>
          </AppCard>
          <AppCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF615' }]}>
              <Icon name="layers" size={24} color="#8B5CF6" />
            </View>
            <Text style={[styles.statValue, { color: '#8B5CF6' }]}>
              {stats.totalCategories}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Categories
            </Text>
          </AppCard>
          <AppCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#10B98115' }]}>
              <Icon name="leaf" size={24} color="#10B981" />
            </View>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              {stats.beginnerCourses}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Beginner
            </Text>
          </AppCard>
          <AppCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B15' }]}>
              <Icon name="rocket" size={24} color="#F59E0B" />
            </View>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>
              {stats.advancedCourses}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Advanced
            </Text>
          </AppCard>
        </View>

        {/* Search & Filter Section */}
        <AppCard style={styles.filterCard} allowOverflow>
          <AppInput
            placeholder="Search courses by name or description..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Icon name="search" size={20} color={theme.colors.textSecondary} />}
            containerStyle={styles.searchInputContainer}
          />

          {/* Category Filter - Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === 'All' ? theme.colors.primary : 'transparent',
                  borderColor: selectedCategory === 'All' ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setSelectedCategory('All')}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  { color: selectedCategory === 'All' ? '#ffffff' : theme.colors.textSecondary },
                ]}
              >
                All Categories
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selectedCategory === category.name ? theme.colors.primary : 'transparent',
                    borderColor: selectedCategory === category.name ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(category.name)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: selectedCategory === category.name ? '#ffffff' : theme.colors.textSecondary },
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Additional Filters Row */}
          <View style={styles.filterRow}>
            {/* Level Filter */}
            <View style={styles.filterDropdownContainer}>
              <TouchableOpacity
                style={[styles.filterBtn, { borderColor: theme.colors.border, backgroundColor: isDark ? theme.colors.card : theme.colors.background }]}
                onPress={() => {
                  setShowLevelDropdown(!showLevelDropdown);
                  setShowSortDropdown(false);
                }}
              >
                <Icon name="speedometer-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.filterBtnText, { color: theme.colors.textPrimary }]}>
                  {levelOptions.find(o => o.value === selectedLevel)?.label || 'Level'}
                </Text>
                <Icon name="chevron-down" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              {showLevelDropdown && (
                <View style={[styles.dropdown, { backgroundColor: isDark ? theme.colors.card : theme.colors.surface, borderColor: theme.colors.border }]}>
                  {levelOptions.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        selectedLevel === option.value && { backgroundColor: theme.colors.primary + '15' }
                      ]}
                      onPress={() => {
                        setSelectedLevel(option.value);
                        setShowLevelDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, { color: theme.colors.textPrimary }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Sort Filter */}
            <View style={[styles.filterDropdownContainer, { zIndex: 90 }]}>
              <TouchableOpacity
<<<<<<< HEAD
                style={[styles.filterBtn, {
                  borderColor: roadmapMode ? '#8B5CF6' : theme.colors.border,
                  backgroundColor: roadmapMode ? '#8B5CF615' : (isDark ? theme.colors.card : theme.colors.background),
                }]}
=======
                style={[styles.filterBtn, { borderColor: theme.colors.border, backgroundColor: isDark ? theme.colors.card : theme.colors.background }]}
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
                onPress={() => {
                  setShowSortDropdown(!showSortDropdown);
                  setShowLevelDropdown(false);
                }}
              >
<<<<<<< HEAD
                <Icon name={roadmapMode ? 'git-branch-outline' : 'swap-vertical'} size={16} color={roadmapMode ? '#8B5CF6' : theme.colors.textSecondary} />
                <Text style={[styles.filterBtnText, { color: roadmapMode ? '#8B5CF6' : theme.colors.textPrimary }]}>
                  {roadmapMode ? 'Learning Roadmap' : (sortOptions.find(o => o.value === sortOrder)?.label || 'Sort')}
                </Text>
                <Icon name="chevron-down" size={16} color={roadmapMode ? '#8B5CF6' : theme.colors.textSecondary} />
=======
                <Icon name="swap-vertical" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.filterBtnText, { color: theme.colors.textPrimary }]}>
                  {sortOptions.find(o => o.value === sortOrder)?.label || 'Sort'}
                </Text>
                <Icon name="chevron-down" size={16} color={theme.colors.textSecondary} />
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
              </TouchableOpacity>
              {showSortDropdown && (
                <View style={[styles.dropdown, { backgroundColor: isDark ? theme.colors.card : theme.colors.surface, borderColor: theme.colors.border }]}>
                  {sortOptions.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
<<<<<<< HEAD
                        { flexDirection: 'row', alignItems: 'center' },
                        option.value === 'roadmap'
                          ? roadmapMode && { backgroundColor: '#8B5CF615' }
                          : (!roadmapMode && sortOrder === option.value) && { backgroundColor: theme.colors.primary + '15' },
                      ]}
                      onPress={() => {
                        if (option.value === 'roadmap') {
                          setRoadmapMode(true);
                        } else {
                          setRoadmapMode(false);
                          setSortOrder(option.value);
                        }
                        setShowSortDropdown(false);
                      }}
                    >
                      {option.value === 'roadmap' && (
                        <Icon name="git-branch-outline" size={14} color="#8B5CF6" style={{ marginRight: 6 }} />
                      )}
                      <Text style={[styles.dropdownItemText, { color: option.value === 'roadmap' ? '#8B5CF6' : theme.colors.textPrimary }]}>
=======
                        sortOrder === option.value && { backgroundColor: theme.colors.primary + '15' }
                      ]}
                      onPress={() => {
                        setSortOrder(option.value);
                        setShowSortDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, { color: theme.colors.textPrimary }]}>
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Results count */}
            <Text style={[styles.resultsCount, { color: theme.colors.textTertiary }]}>
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
            </Text>
          </View>
        </AppCard>

<<<<<<< HEAD
        {/* Courses Grid / Roadmap */}
        {filteredCourses.length > 0 ? (
          roadmapMode ? (
            /* ── Roadmap View ── */
            <View style={styles.roadmapContainer}>
              {selectedCategory === 'All'
                ? Object.entries(
                    filteredCourses.reduce((acc, c) => {
                      const cat = c.category?.name || 'Uncategorized';
                      (acc[cat] = acc[cat] || []).push(c);
                      return acc;
                    }, {})
                  ).map(([catName, catCourses]) => (
                    <View key={catName} style={styles.roadmapCategoryGroup}>
                      <View style={styles.roadmapCategoryHeader}>
                        <Icon name="folder-outline" size={15} color={ORANGE} />
                        <Text style={[styles.roadmapCategoryTitle, { color: theme.colors.textPrimary }]}>{catName}</Text>
                        <View style={[styles.roadmapCategoryDivider, { backgroundColor: theme.colors.border }]} />
                      </View>
                      {buildChains(catCourses).map((chain, ci) => renderChainBlock(chain, ci))}
                    </View>
                  ))
                : buildChains(filteredCourses).map((chain, ci) => renderChainBlock(chain, ci))
              }
            </View>
          ) : (
          /* ── Normal Grid View ── */
=======
        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
          <View style={styles.coursesGrid}>
            {filteredCourses.map((course, index) => {
              const isEnrolled = enrolledCourseIds.has(course.id);
              return (
                <Animated.View
                  key={course.id}
                  entering={FadeInDown.duration(400).delay(index * 60)}
                  style={styles.courseCardWrapper}
                >
                  <TouchableOpacity
<<<<<<< HEAD
                    style={[styles.courseCard, { backgroundColor: isDark ? theme.colors.card : theme.colors.surface }]}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('CourseDetail', { courseId: course.id, courseName: slugify(course.name) })}
                  >
                    {course.thumbnailImage ? (
                      <Image source={{ uri: resolveFileUrl(course.thumbnailImage) }} style={styles.courseImage} resizeMode="cover" />
=======
                    style={[
                      styles.courseCard,
                      { backgroundColor: isDark ? theme.colors.card : theme.colors.surface },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('CourseDetail', { courseId: course.id, courseName: slugify(course.name) })}
                  >
                    {/* Course Image */}
                    {course.thumbnailImage ? (
                      <Image
                        source={{ uri: resolveFileUrl(course.thumbnailImage) }}
                        style={styles.courseImage}
                        resizeMode="cover"
                      />
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
                    ) : (
                      <View style={[styles.courseImagePlaceholder, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Icon name="image-outline" size={40} color={theme.colors.primary} />
                      </View>
                    )}
<<<<<<< HEAD
=======

                    {/* Enrolled Badge */}
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
                    {isEnrolled && (
                      <View style={[styles.enrolledBadge, { backgroundColor: '#10B981' }]}>
                        <Icon name="checkmark-circle" size={12} color="#FFFFFF" />
                        <Text style={styles.enrolledBadgeText}>Enrolled</Text>
                      </View>
                    )}
<<<<<<< HEAD
                    <View style={[styles.levelBadge, { backgroundColor: getLevelColor(course.level) + '20' }]}>
                      <Text style={[styles.levelBadgeText, { color: getLevelColor(course.level) }]}>{course.level || 'All Levels'}</Text>
                    </View>
                    <View style={styles.courseContent}>
                      <Text style={[styles.courseCategory, { color: theme.colors.primary }]}>{course.category?.name || 'Uncategorized'}</Text>
                      <Text style={[styles.courseTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>{course.name}</Text>
                      <Text style={[styles.courseDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>{stripMarkdown(course.description) || 'No description available'}</Text>
                      <View style={styles.courseMeta}>
                        <View style={styles.metaItem}>
                          <Icon name="book-outline" size={14} color={theme.colors.textTertiary} />
                          <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>{course.topics?.length || 0} topics</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Icon name="time-outline" size={14} color={theme.colors.textTertiary} />
                          <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>{course.duration || 'N/A'}</Text>
=======

                    {/* Level Badge */}
                    <View style={[styles.levelBadge, { backgroundColor: getLevelColor(course.level) + '20' }]}>
                      <Text style={[styles.levelBadgeText, { color: getLevelColor(course.level) }]}>
                        {course.level || 'All Levels'}
                      </Text>
                    </View>

                    {/* Course Content */}
                    <View style={styles.courseContent}>
                      {/* Category */}
                      <Text style={[styles.courseCategory, { color: theme.colors.primary }]}>
                        {course.category?.name || 'Uncategorized'}
                      </Text>

                      {/* Title */}
                      <Text style={[styles.courseTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                        {course.name}
                      </Text>

                      {/* Description */}
                      <Text style={[styles.courseDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                        {course.description || 'No description available'}
                      </Text>

                      {/* Meta Info */}
                      <View style={styles.courseMeta}>
                        <View style={styles.metaItem}>
                          <Icon name="book-outline" size={14} color={theme.colors.textTertiary} />
                          <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                            {course.topics?.length || 0} topics
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Icon name="time-outline" size={14} color={theme.colors.textTertiary} />
                          <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                            {course.duration || 'N/A'}
                          </Text>
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
                        </View>
                        {course.studentsCount > 0 && (
                          <View style={styles.metaItem}>
                            <Icon name="people-outline" size={14} color={theme.colors.textTertiary} />
<<<<<<< HEAD
                            <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>{course.studentsCount}</Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[styles.courseActionBtn, { backgroundColor: isEnrolled ? '#10B981' : theme.colors.primary }]}
                        onPress={() => navigation.navigate('CourseDetail', { courseId: course.id, courseName: slugify(course.name) })}
                      >
                        <Text style={styles.courseActionText}>{isEnrolled ? 'Continue Learning' : 'View Course'}</Text>
=======
                            <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
                              {course.studentsCount}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Action Button */}
                      <TouchableOpacity
                        style={[
                          styles.courseActionBtn,
                          { backgroundColor: isEnrolled ? '#10B981' : theme.colors.primary }
                        ]}
                        onPress={() => navigation.navigate('CourseDetail', { courseId: course.id, courseName: slugify(course.name) })}
                      >
                        <Text style={styles.courseActionText}>
                          {isEnrolled ? 'Continue Learning' : 'View Course'}
                        </Text>
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
                        <Icon name="arrow-forward" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
<<<<<<< HEAD
          )
=======
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
        ) : (
          <AppCard style={styles.emptyContainer}>
            <EmptyState
              icon="library-outline"
              title={searchQuery || selectedCategory !== 'All' || selectedLevel !== 'All'
                ? 'No courses found'
                : 'No courses available'}
              subtitle={searchQuery || selectedCategory !== 'All' || selectedLevel !== 'All'
                ? 'Try adjusting your filters or search term'
                : 'Check back later for new courses'}
            />
            {(searchQuery || selectedCategory !== 'All' || selectedLevel !== 'All') && (
              <AppButton
                title="Clear Filters"
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedLevel('All');
                }}
                variant="outline"
                leftIcon="close-circle-outline"
                style={styles.clearFiltersBtn}
              />
            )}
          </AppCard>
        )}
      </ScrollView>
    </MainLayout>
  );
};

// Helper function to get level color
const getLevelColor = (level) => {
  switch (level) {
    case 'Beginner':
      return '#10B981';
    case 'Intermediate':
      return '#F59E0B';
    case 'Advanced':
      return '#EF4444';
    default:
      return '#6366F1';
  }
};

const getStyles = (theme, isDark, isLargeScreen, isTablet, isMobile) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: isMobile ? 16 : 24,
      paddingBottom: 40,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
    },

    // Page Header Banner
    pageHeaderBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: isMobile ? 14 : 18,
      marginBottom: 24,
      borderRadius: 16,
      borderWidth: 1,
    },
    bannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bannerIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,140,66,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bannerTextGroup: {
      flex: 1,
    },
    pageTitle: {
      fontSize: isMobile ? 18 : 22,
      fontWeight: '700',
      fontFamily: theme.typography.fontFamily.bold,
      marginBottom: 2,
    },
    pageSubtitle: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
    },

    // Header Section
    pageHeader: {
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.primary + '30',
    },

    // Section Title with left orange border accent
    sectionTitle: {
      fontSize: isMobile ? 16 : 18,
      fontWeight: '700',
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
      paddingLeft: 10,
      marginBottom: 16,
    },

    // Stats Section
    statsSection: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: isMobile ? 12 : 16,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      minWidth: isMobile ? '47%' : isTablet ? 140 : 160,
      maxWidth: isLargeScreen ? 220 : undefined,
      padding: isMobile ? 14 : 18,
      alignItems: 'center',
    },
    statIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    statValue: {
      fontSize: isMobile ? 24 : 30,
      fontWeight: '700',
      fontFamily: theme.typography.fontFamily.bold,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.regular,
      textAlign: 'center',
    },

    // Filter Section
    filterCard: {
      padding: isMobile ? 12 : 16,
      marginBottom: isMobile ? 16 : 24,
      overflow: 'visible',
      zIndex: 20,
    },
    searchInputContainer: {
      marginBottom: 12,
    },
    categoryScroll: {
      marginBottom: 12,
    },
    categoryScrollContent: {
      gap: 8,
      paddingVertical: 4,
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    categoryChipText: {
      fontSize: 13,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
    },
    filterRow: {
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center',
      gap: 12,
      zIndex: 15,
    },
    filterDropdownContainer: {
      position: 'relative',
      zIndex: 100,
      ...(isMobile && { width: '100%' }),
    },
    filterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: isMobile ? 'space-between' : 'flex-start',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      gap: 8,
      width: isMobile ? '100%' : 'auto',
    },
    filterBtnText: {
      fontSize: 13,
      fontWeight: '500',
      fontFamily: theme.typography.fontFamily.medium,
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: isMobile ? 0 : undefined,
      minWidth: isMobile ? undefined : 160,
      width: isMobile ? '100%' : undefined,
      borderRadius: 8,
      borderWidth: 1,
      marginTop: 4,
      zIndex: 1000,
      overflow: 'hidden',
      ...theme.shadows.lg,
      ...(Platform.OS === 'web' && {
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }),
    },
    dropdownItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    dropdownItemText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
    },
    resultsCount: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
      marginLeft: isMobile ? 0 : 'auto',
    },

    // Courses Grid
    coursesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
<<<<<<< HEAD
    roadmapList: {
      flexDirection: 'column',
      gap: 0,
      alignItems: 'center',
    },
    roadmapCardWrapper: {
      width: '100%',
      maxWidth: 640,
    },
=======
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
    courseCardWrapper: {
      width: isLargeScreen
        ? 'calc(33.333% - 11px)'
        : isTablet
          ? 'calc(50% - 8px)'
          : '100%',
      ...(Platform.OS !== 'web' && {
        width: isLargeScreen ? '31%' : isTablet ? '48%' : '100%',
      }),
    },
    courseCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : theme.colors.border,
      overflow: 'hidden',
      borderTopWidth: 3,
      borderTopColor: theme.colors.primary,
      ...theme.shadows.sm,
    },
    courseImage: {
      width: '100%',
      height: 160,
    },
    courseImagePlaceholder: {
      width: '100%',
      height: 160,
      justifyContent: 'center',
      alignItems: 'center',
    },
    enrolledBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    enrolledBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    levelBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    levelBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    courseContent: {
      padding: 16,
    },
    courseCategory: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    courseTitle: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily.semiBold,
      marginBottom: 8,
      lineHeight: 22,
    },
    courseDescription: {
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 12,
    },
    courseMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 14,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 12,
    },
    courseActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 8,
      gap: 6,
    },
    courseActionText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#FFFFFF',
    },

<<<<<<< HEAD
    // Roadmap
    roadmapContainer: { gap: 20 },
    roadmapCategoryGroup: { gap: 12 },
    roadmapCategoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    roadmapCategoryTitle: {
      fontSize: 15,
      fontWeight: '700',
    },
    roadmapCategoryDivider: {
      flex: 1,
      height: 1,
    },
    treeRootCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1.5,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 12,
      marginTop: 12,
    },
    treeRootStep: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    treeRootThumb: {
      width: 52,
      height: 52,
      borderRadius: 8,
    },
    treeBranchSeparator: {
      width: 1,
      height: 140,
      alignSelf: 'center',
      marginHorizontal: 8,
    },
    treeRootStepText: { color: '#fff', fontSize: 13, fontWeight: '800' },
    treeRootInfo: { flex: 1 },
    treeRootLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
    treeRootTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4, lineHeight: 18 },
    treeRootMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    treeRootMetaText: { fontSize: 11 },
    treeRootBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
    },
    treeRootBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    treeSplitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 10,
      gap: 8,
    },
    treeSplitLine: { flex: 1, height: 1 },
    treeSplitBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: 1,
    },
    treeSplitText: { fontSize: 11, fontWeight: '700' },
    treeBranchesRow: { gap: 10, paddingVertical: 2 },
    treeBranchCard: {
      width: 150,
      borderRadius: 12,
      borderWidth: 1.5,
      padding: 12,
    },
    treeBranchStep: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    treeBranchStepText: { color: '#fff', fontSize: 11, fontWeight: '800' },
    treeBranchTitle: { fontSize: 13, fontWeight: '700', lineHeight: 17, marginBottom: 6 },
    treeBranchMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
    treeBranchMetaText: { fontSize: 11 },
    treeBranchMore: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingTop: 6,
      marginBottom: 8,
      borderTopWidth: 1,
    },
    treeBranchMoreText: { fontSize: 10, fontWeight: '600' },
    treeBranchBtn: { alignItems: 'center', paddingVertical: 6, borderRadius: 7 },
    treeBranchBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    chainBlock: {
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
      ...(Platform.OS === 'web' ? { boxShadow: '0 2px 16px rgba(139,92,246,0.08)' } : {}),
    },
    chainHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(139,92,246,0.1)',
    },
    chainHeaderIcon: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chainHeaderTitle: {
      fontSize: 14,
      fontWeight: '700',
      flex: 1,
    },
    chainHeaderPill: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 20,
    },
    chainHeaderPillText: {
      fontSize: 11,
      fontWeight: '700',
    },
    chainScroll: {
      padding: 16,
      gap: 0,
      alignItems: 'flex-start',
    },
    chainStepRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    chainArrow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    chainArrowLine: {
      width: 16,
      height: 2,
    },
    roadmapCard: {
      width: 200,
      borderRadius: 14,
      borderWidth: 1.5,
      overflow: 'hidden',
    },
    stepBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    stepBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    roadmapCardImage: { width: '100%', height: 100 },
    roadmapCardImagePlaceholder: {
      width: '100%',
      height: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    roadmapCardBody: { padding: 12 },
    roadmapCardCategory: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    roadmapCardTitle: {
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 18,
      marginBottom: 8,
    },
    roadmapCardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
    },
    roadmapLevelDot: { width: 6, height: 6, borderRadius: 3 },
    roadmapCardBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 7,
      borderRadius: 8,
    },
    roadmapCardBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    roadmapList: { flexDirection: 'column', gap: 0, alignItems: 'center' },
    roadmapCardWrapper: { width: '100%', maxWidth: 640 },

=======
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
    // Empty State
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    clearFiltersBtn: {
      marginTop: 16,
    },
  });

export default BrowseCoursesScreen;
