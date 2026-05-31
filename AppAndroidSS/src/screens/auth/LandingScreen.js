import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  useWindowDimensions,
  Animated,
  StatusBar,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import AppHeader from '../../components/ui/AppHeader';
import { courseAPI, contactAPI, categoryAPI } from '../../services/apiClient';
import { resolveFileUrl, slugify } from '../../utils/urlHelpers';
import { Helmet } from 'react-helmet-async';

const LOGO   = require('../../assets/images/skillsphere-logo.png');
const ORANGE = '#F68B3C';
const NAVY   = '#1A1A2E';
const NAVY2  = '#16213E';

// ─── Section title ────────────────────────────────────────────────────────────
const SectionTitle = ({ tag, title, subtitle, center = true, theme, isMobile }) => (
  <View style={{ alignItems: center ? 'center' : 'flex-start', marginBottom: isMobile ? 28 : 40 }}>
    {tag ? (
      <View style={{
        backgroundColor: ORANGE + '20', borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 5, marginBottom: 10,
      }}>
        <Text style={{ color: ORANGE, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>
          {tag.toUpperCase()}
        </Text>
      </View>
    ) : null}
    <Text style={{
      fontSize: isMobile ? 22 : 30, fontWeight: '800',
      color: theme.colors.textPrimary,
      textAlign: center ? 'center' : 'left',
      lineHeight: isMobile ? 30 : 38, marginBottom: 10,
    }}>
      {title}
    </Text>
    {subtitle ? (
      <Text style={{
        fontSize: isMobile ? 14 : 16, color: theme.colors.textSecondary,
        textAlign: center ? 'center' : 'left',
        lineHeight: isMobile ? 22 : 26, maxWidth: 560,
      }}>
        {subtitle}
      </Text>
    ) : null}
  </View>
);

// ─── Searchable sections & pages ──────────────────────────────────────────────
const SEARCH_SECTIONS = [
  { id: 'features',  label: 'Features',      icon: 'grid-outline' },
  { id: 'how',       label: 'How It Works',  icon: 'git-branch-outline' },
  { id: 'courses',   label: 'Courses',       icon: 'library-outline' },
  { id: 'faq',       label: 'FAQ',           icon: 'help-circle-outline' },
  { id: 'contact',   label: 'Contact',       icon: 'mail-outline' },
];

const SEARCH_PAGES = [
  { label: 'Blog',                 icon: 'newspaper-outline',        route: 'Blog' },
  { label: 'About Us',             icon: 'information-circle-outline',route: 'About' },
  { label: 'Explore Courses',      icon: 'compass-outline',           route: 'ExploreCourses' },
  { label: 'Verify Certificate',   icon: 'shield-checkmark-outline',  route: 'CertificateVerify' },
  { label: 'Login',                icon: 'log-in-outline',            route: 'Login' },
  { label: 'Sign Up',              icon: 'person-add-outline',        route: 'Signup' },
];

// ─── Nav links (AppHeader format) ────────────────────────────────────────────
const NAV_LINKS = [
  { route: 'features', label: 'Features',     icon: 'grid-outline',        iconActive: 'grid' },
  { route: 'how',      label: 'How It Works', icon: 'git-branch-outline',  iconActive: 'git-branch' },
  { route: 'courses',  label: 'Courses',      icon: 'library-outline',     iconActive: 'library' },
  { route: 'faq',      label: 'FAQ',          icon: 'help-circle-outline', iconActive: 'help-circle' },
  { route: 'contact',  label: 'Contact',      icon: 'mail-outline',        iconActive: 'mail' },
];

// ─── 1. NAVBAR — replaced by AppHeader component ──────────────────────────────
const _Navbar = ({ navigation, isDark, isMobile, isDesktop, scrollToSection, activeSection }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;
  const isWeb = Platform.OS === 'web';

  const openMenu = () => {
    setMenuOpen(true);
    Animated.spring(menuAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }).start();
  };
  const closeMenu = () => {
    Animated.timing(menuAnim, { toValue: 0, duration: 180, useNativeDriver: true })
      .start(() => setMenuOpen(false));
  };
  const handleLink = (id) => { closeMenu(); setTimeout(() => scrollToSection(id), 120); };

  const MobileDropdown = () => (
    <Modal visible={menuOpen} transparent animationType="none" onRequestClose={closeMenu}>
      <TouchableOpacity
        style={[
          ns.modalBackdrop,
          isWeb && { backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' },
        ]}
        onPress={closeMenu} activeOpacity={1}
      >
        <Animated.View style={[
          ns.dropdownCard,
          isWeb ? {
            backgroundColor: 'rgba(22,22,46,0.82)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          } : { backgroundColor: 'rgba(22,22,46,0.97)' },
          {
            borderColor: 'rgba(255,140,66,0.25)',
            top: 80,
            opacity: menuAnim,
            transform: [
              { translateY: menuAnim.interpolate({ inputRange: [0,1], outputRange: [-12,0] }) },
              { scale:      menuAnim.interpolate({ inputRange: [0,1], outputRange: [0.95,1] }) },
            ],
          },
        ]}>
          {NAV_LINKS.map(link => {
            const isActive = activeSection === link.id;
            return (
              <TouchableOpacity key={link.id}
                style={[ns.dropdownItem, isActive && ns.dropdownItemActive]}
                onPress={() => handleLink(link.id)} activeOpacity={0.7}
              >
                <View style={[ns.dropdownItemIcon, isActive && ns.dropdownItemIconActive]}>
                  <Icon name={isActive ? link.iconActive : link.icon} size={18}
                    color={isActive ? '#FFFFFF' : ORANGE} />
                </View>
                <Text style={[ns.dropdownItemLabel,
                  { color: 'rgba(255,255,255,0.85)' },
                  isActive && ns.dropdownItemLabelActive]}>
                  {link.label}
                </Text>
                {isActive && <View style={ns.dropdownActiveDot} />}
              </TouchableOpacity>
            );
          })}

          <View style={[ns.dropdownDivider, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />

          <View style={ns.dropdownItem}>
            <View style={[ns.dropdownItemIcon, { backgroundColor: 'rgba(124,111,205,0.15)' }]}>
              <Icon name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color="#7C6FCD" />
            </View>
            <Text style={[ns.dropdownItemLabel, { color: 'rgba(255,255,255,0.85)' }]}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Text>
            <ThemeToggle iconColor={isDark ? '#F5C842' : '#7C6FCD'} />
          </View>

          <View style={[ns.dropdownDivider, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />

          <TouchableOpacity style={ns.dropdownItem}
            onPress={() => { closeMenu(); navigation.navigate('CertificateVerify'); }} activeOpacity={0.7}>
            <View style={[ns.dropdownItemIcon, { backgroundColor: 'rgba(255,140,66,0.1)' }]}>
              <Icon name="shield-checkmark-outline" size={18} color={ORANGE} />
            </View>
            <Text style={[ns.dropdownItemLabel, { color: 'rgba(255,255,255,0.85)' }]}>Verify Certificate</Text>
          </TouchableOpacity>

          <View style={[ns.dropdownDivider, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />

          <TouchableOpacity style={ns.dropdownItem}
            onPress={() => { closeMenu(); navigation.navigate('Login'); }} activeOpacity={0.7}>
            <View style={[ns.dropdownItemIcon, { backgroundColor: 'rgba(255,140,66,0.1)' }]}>
              <Icon name="log-in-outline" size={18} color={ORANGE} />
            </View>
            <Text style={[ns.dropdownItemLabel, { color: 'rgba(255,255,255,0.85)' }]}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[ns.dropdownItem, ns.getStartedRow]}
            onPress={() => { closeMenu(); navigation.navigate('Signup'); }} activeOpacity={0.7}>
            <View style={[ns.dropdownItemIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Icon name="rocket-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={[ns.dropdownItemLabel, { color: '#FFFFFF', fontWeight: '800' }]}>Get Started</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );

  const stickyStyle = isWeb ? { position: 'sticky', top: 0, zIndex: 999, paddingTop: 10 } : {};

  const Inner = () => (
    <View style={ns.content}>
      <View style={ns.leftSection}>
        <Image source={LOGO} style={ns.logoImg} resizeMode="cover" />
        <Text style={ns.logoText}>
          SKILL<Text style={{ color: ORANGE }}>SPHERE</Text>
        </Text>
      </View>

      {!isMobile && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={ns.navPillsScroll} contentContainerStyle={ns.navPillsWrap}>
          {NAV_LINKS.map(link => {
            const isActive = activeSection === link.id;
            return (
              <TouchableOpacity key={link.id}
                style={[ns.navPill, isActive && ns.navPillActive]}
                onPress={() => scrollToSection(link.id)} activeOpacity={0.7}>
                <Icon
                  name={isActive ? link.iconActive : link.icon}
                  size={isDesktop ? 13 : 12}
                  color={isActive ? NAVY : 'rgba(255,255,255,0.6)'}
                />
                {isActive && (
                  <Text style={ns.navPillTextActive}>{link.label}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={ns.rightSection}>
        {!isMobile && (
          <>
            <ThemeToggle iconColor="#FFFFFF" />
            <TouchableOpacity style={ns.verifyBtn} onPress={() => navigation.navigate('CertificateVerify')}>
              <Icon name="shield-checkmark-outline" size={14} color={ORANGE} />
              <Text style={ns.verifyBtnText}>Verify</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ns.signInBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={ns.signInText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ns.getStartedBtn} onPress={() => navigation.navigate('Signup')}>
              <Text style={ns.getStartedText}>Get Started</Text>
            </TouchableOpacity>
          </>
        )}
        {isMobile && (
          <TouchableOpacity onPress={menuOpen ? closeMenu : openMenu}
            style={[ns.menuTrigger, menuOpen && ns.menuTriggerOpen]} activeOpacity={0.8}>
            <Animated.View style={{
              transform: [{ rotate: menuAnim.interpolate({ inputRange:[0,1], outputRange:['0deg','90deg'] }) }],
            }}>
              <Icon name={menuOpen ? 'close' : 'apps'} size={20} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const glassBg = 'rgba(22,22,46,0.82)';

  if (isWeb) {
    return (
      <>
        <View style={[
          ns.container,
          {
            backgroundColor: glassBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          },
          stickyStyle,
        ]}>
          <Inner />
        </View>
        {isMobile && <MobileDropdown />}
      </>
    );
  }
  const LG = require('react-native-linear-gradient').default;
  return (
    <>
      <LG colors={['#1A1A2E','#1E1E38']} style={ns.container} start={{x:0,y:0}} end={{x:1,y:1}}>
        <Inner />
      </LG>
      {isMobile && <MobileDropdown />}
    </>
  );
};

const ns = StyleSheet.create({
  container: { height: 62, paddingHorizontal: 20, marginHorizontal: 12, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOffset:{width:0,height:8}, shadowOpacity:0.4, shadowRadius:20, elevation:16 },
  content: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  leftSection: { flexDirection:'row', alignItems:'center', gap:8, flexShrink:0 },
  logoImg: { width:46, height:46, borderRadius:13 },
  logoText: { color:'#FFFFFF', fontWeight:'800', fontSize:16, letterSpacing:1.2 },
  navPillsScroll: { flex:1, marginHorizontal:8 },
  navPillsWrap: { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'#252540', borderRadius:14, padding:4, gap:2, flexGrow:1 },
  navPill: { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:6, borderRadius:8 },
  navPillActive: { backgroundColor:'#FFFFFF' },
  navPillTextActive: { color:NAVY, fontSize:11, fontWeight:'700' },
  rightSection: { flexDirection:'row', alignItems:'center', gap:10, flexShrink:0 },
  verifyBtn: { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:13, paddingVertical:7, borderRadius:10, borderWidth:1.5, borderColor:ORANGE+'60', backgroundColor:ORANGE+'12' },
  verifyBtnText: { color:ORANGE, fontSize:13, fontWeight:'600' },
  signInBtn: { paddingHorizontal:16, paddingVertical:8, borderRadius:10, borderWidth:1.5, borderColor:'rgba(255,255,255,0.25)' },
  signInText: { color:'#FFFFFF', fontSize:13, fontWeight:'600' },
  getStartedBtn: { paddingHorizontal:16, paddingVertical:8, borderRadius:10, backgroundColor:ORANGE, borderWidth:1, borderColor:'#E77828', shadowColor:'#C96A24', shadowOffset:{width:0,height:3}, shadowOpacity:0.14, shadowRadius:6, elevation:3 },
  getStartedText: { color:'#FFFFFF', fontSize:13, fontWeight:'700' },
  menuTrigger: { width:38, height:38, borderRadius:19, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(255,140,66,0.2)', borderWidth:1.5, borderColor:'rgba(255,140,66,0.5)' },
  menuTriggerOpen: { backgroundColor:'rgba(255,140,66,0.35)', borderColor:ORANGE },
  modalBackdrop: { flex:1, backgroundColor:'rgba(10,10,30,0.5)' },
  dropdownCard: { position:'absolute', right:12, width:230, borderRadius:20, paddingVertical:8, shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:0.3, shadowRadius:20, elevation:20, borderWidth:1, overflow:'hidden' },
  dropdownItem: { flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:10, marginHorizontal:6, marginVertical:1, borderRadius:12, gap:12 },
  dropdownItemActive: { backgroundColor:'rgba(255,140,66,0.1)' },
  dropdownItemIcon: { width:36, height:36, borderRadius:10, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(255,140,66,0.1)' },
  dropdownItemIconActive: { backgroundColor:ORANGE },
  dropdownItemLabel: { flex:1, fontSize:14, fontWeight:'600' },
  dropdownItemLabelActive: { color:ORANGE, fontWeight:'700', letterSpacing:0.1 },
  dropdownActiveDot: { width:7, height:7, borderRadius:4, backgroundColor:ORANGE },
  dropdownDivider: { height:1, marginVertical:4, marginHorizontal:12 },
  getStartedRow: { backgroundColor:ORANGE, marginHorizontal:10, marginBottom:6, borderWidth:1, borderColor:'#E77828', shadowColor:'#C96A24', shadowOffset:{width:0,height:3}, shadowOpacity:0.14, shadowRadius:6, elevation:3 },
});

// ─── 2. HERO ──────────────────────────────────────────────────────────────────
const HeroSection = ({ navigation, theme, isDark, isMobile, scrollToSection }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const [heroSearch, setHeroSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [allCourses, setAllCourses] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const searchRef = useRef(null);
  const dropdownPressedRef = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue:1, duration:800, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:700, useNativeDriver:true }),
    ]).start();
    // Prefetch for instant dropdown
    Promise.all([courseAPI.getAll(), categoryAPI.getAll()]).then(([cr, catR]) => {
      setAllCourses((cr.courses || []).filter(c => c.status === 'published'));
      setAllCategories(catR.categories || []);
    }).catch(() => {});
  }, []);

  const q = heroSearch.trim().toLowerCase();
  const filteredCourses = q
    ? allCourses.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];
  const filteredCategories = q
    ? allCategories.filter(c => c.name?.toLowerCase().includes(q)).slice(0, 3)
    : [];
  const filteredSections = q
    ? SEARCH_SECTIONS.filter(s => s.label.toLowerCase().includes(q))
    : [];
  const filteredPages = q
    ? SEARCH_PAGES.filter(p => p.label.toLowerCase().includes(q))
    : [];
  const hasResults =
    filteredCourses.length > 0 || filteredCategories.length > 0 ||
    filteredSections.length > 0 || filteredPages.length > 0;

  const handleHeroSearch = () => {
    const query = heroSearch.trim();
    setShowDropdown(false);
    navigation.navigate('ExploreCourses', query ? { search: query } : {});
  };

  const handleSelectCourse = (course) => {
    setHeroSearch('');
    setShowDropdown(false);
    navigation.navigate('ExploreCourseDetail', { courseId: course.id, courseName: slugify(course.name) });
  };

  const handleSelectCategory = (cat) => {
    setHeroSearch('');
    setShowDropdown(false);
    navigation.navigate('ExploreCourses', { search: cat.name });
  };

  const handleSelectSection = (section) => {
    setHeroSearch('');
    setShowDropdown(false);
    scrollToSection?.(section.id);
  };

  const handleSelectPage = (page) => {
    setHeroSearch('');
    setShowDropdown(false);
    navigation.navigate(page.route);
  };

  const stats = [
    { value:'10K+', label:'Students' },
    { value:'200+', label:'Courses' },
    { value:'50+',  label:'Experts' },
    { value:'95%',  label:'Success' },
  ];

  return (
    <View style={[styles.hero, { backgroundColor: isDark ? NAVY : '#F8F9FF' }]}>
      <View style={[styles.heroBlobLeft, { backgroundColor: ORANGE + (isDark ? '15':'10') }]} />
      <View style={[styles.heroBlobRight, { backgroundColor: isDark ? 'rgba(255,140,66,0.06)' : 'rgba(26,26,46,0.04)' }]} />

      <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}], alignItems:'center', zIndex:2, width:'100%' }}>
        <View style={styles.heroBadge}>
          <Icon name="sparkles" size={13} color={ORANGE} />
          <Text style={styles.heroBadgeText}>AI-Powered Learning Platform</Text>
        </View>

        <Text style={[
          styles.heroHeadline, { color: theme.colors.textPrimary },
          isMobile && { fontSize:28, lineHeight:36, marginBottom:14 },
        ]}>
          Empower Your Skills,{'\n'}
          <Text style={{ color:ORANGE }}>Expand Your Sphere</Text>
        </Text>

        <Text style={[
          styles.heroSub, { color: theme.colors.textSecondary },
          isMobile && { fontSize:14, lineHeight:22, paddingHorizontal:8, marginBottom:24 },
        ]}>
          Learn from industry experts with hands-on projects,{'\n'}
          AI-assisted tutoring, and globally recognised certificates.
        </Text>

        {/* Hero Search Bar + Dropdown */}
        <View style={[styles.heroSearchContainer, isMobile && { width: '90%' }]}>
          <View style={[
            styles.heroSearchWrap,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#fff',
              borderColor: showDropdown && hasResults
                ? ORANGE
                : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.12)',
              borderBottomLeftRadius: showDropdown && hasResults ? 0 : 50,
              borderBottomRightRadius: showDropdown && hasResults ? 0 : 50,
            },
          ]}>
            <Icon name="search-outline" size={20} color={isDark ? 'rgba(255,255,255,0.45)' : 'rgba(26,26,46,0.4)'} />
            <TextInput
              ref={searchRef}
              style={[styles.heroSearchInput, { color: isDark ? '#fff' : NAVY }]}
              placeholder="Search courses, topics, skills…"
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(26,26,46,0.35)'}
              value={heroSearch}
              onChangeText={v => { setHeroSearch(v); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => {
                setTimeout(() => {
                  if (!dropdownPressedRef.current) setShowDropdown(false);
                  dropdownPressedRef.current = false;
                }, 200);
              }}
              onSubmitEditing={handleHeroSearch}
              returnKeyType="search"
            />
            {heroSearch.length > 0 && (
              <TouchableOpacity onPress={() => { setHeroSearch(''); setShowDropdown(false); }} activeOpacity={0.7}>
                <Icon name="close-circle" size={18} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(26,26,46,0.3)'} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.heroSearchBtn, { backgroundColor: ORANGE }, isMobile && { paddingHorizontal: 10 }]}
              onPress={handleHeroSearch}
              activeOpacity={0.85}
            >
              {isMobile
                ? <Icon name="search" size={18} color="#fff" />
                : <Text style={styles.heroSearchBtnText}>Search</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Dropdown */}
          {showDropdown && hasResults && (
            <View style={[styles.heroDropdown, {
              backgroundColor: isDark ? '#1a1a2e' : '#fff',
              borderColor: ORANGE,
              shadowColor: '#000',
            }]}>
              {filteredCourses.length > 0 && (
                <>
                  <View style={styles.heroDropdownSection}>
                    <Icon name="library-outline" size={13} color={ORANGE} />
                    <Text style={[styles.heroDropdownHeading, { color: ORANGE }]}>Courses</Text>
                  </View>
                  {filteredCourses.map(course => (
                    <TouchableOpacity
                      key={course.id}
                      style={[styles.heroDropdownItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,46,0.06)' }]}
                      onPressIn={() => { dropdownPressedRef.current = true; }}
                      onPress={() => handleSelectCourse(course)}
                      activeOpacity={0.75}
                    >
                      <Icon name="book-outline" size={15} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.4)'} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.heroDropdownItemText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                          {course.name}
                        </Text>
                        {course.category?.name && (
                          <Text style={[styles.heroDropdownItemMeta, { color: theme.colors.textSecondary }]}>
                            {course.category.name} · {course.level}
                          </Text>
                        )}
                      </View>
                      <Icon name="arrow-forward" size={13} color={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(26,26,46,0.25)'} />
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {filteredCategories.length > 0 && (
                <>
                  <View style={[styles.heroDropdownSection, filteredCourses.length > 0 && { marginTop: 6 }]}>
                    <Icon name="grid-outline" size={13} color={ORANGE} />
                    <Text style={[styles.heroDropdownHeading, { color: ORANGE }]}>Categories</Text>
                  </View>
                  {filteredCategories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.heroDropdownItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,46,0.06)' }]}
                      onPressIn={() => { dropdownPressedRef.current = true; }}
                      onPress={() => handleSelectCategory(cat)}
                      activeOpacity={0.75}
                    >
                      <Icon name="folder-outline" size={15} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.4)'} />
                      <Text style={[styles.heroDropdownItemText, { color: theme.colors.textPrimary, flex: 1 }]} numberOfLines={1}>
                        {cat.name}
                      </Text>
                      <Icon name="arrow-forward" size={13} color={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(26,26,46,0.25)'} />
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {filteredSections.length > 0 && (
                <>
                  <View style={[styles.heroDropdownSection, { marginTop: (filteredCourses.length > 0 || filteredCategories.length > 0) ? 6 : 0 }]}>
                    <Icon name="navigate-outline" size={13} color={ORANGE} />
                    <Text style={[styles.heroDropdownHeading, { color: ORANGE }]}>Sections</Text>
                  </View>
                  {filteredSections.map(sec => (
                    <TouchableOpacity
                      key={sec.id}
                      style={[styles.heroDropdownItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,46,0.06)' }]}
                      onPressIn={() => { dropdownPressedRef.current = true; }}
                      onPress={() => handleSelectSection(sec)}
                      activeOpacity={0.75}
                    >
                      <Icon name={sec.icon} size={15} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.4)'} />
                      <Text style={[styles.heroDropdownItemText, { color: theme.colors.textPrimary, flex: 1 }]} numberOfLines={1}>
                        {sec.label}
                      </Text>
                      <Text style={[styles.heroDropdownItemMeta, { color: ORANGE }]}>on this page</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {filteredPages.length > 0 && (
                <>
                  <View style={[styles.heroDropdownSection, { marginTop: (filteredCourses.length > 0 || filteredCategories.length > 0 || filteredSections.length > 0) ? 6 : 0 }]}>
                    <Icon name="albums-outline" size={13} color={ORANGE} />
                    <Text style={[styles.heroDropdownHeading, { color: ORANGE }]}>Pages</Text>
                  </View>
                  {filteredPages.map(page => (
                    <TouchableOpacity
                      key={page.route}
                      style={[styles.heroDropdownItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,46,0.06)' }]}
                      onPressIn={() => { dropdownPressedRef.current = true; }}
                      onPress={() => handleSelectPage(page)}
                      activeOpacity={0.75}
                    >
                      <Icon name={page.icon} size={15} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.4)'} />
                      <Text style={[styles.heroDropdownItemText, { color: theme.colors.textPrimary, flex: 1 }]} numberOfLines={1}>
                        {page.label}
                      </Text>
                      <Icon name="arrow-forward" size={13} color={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(26,26,46,0.25)'} />
                    </TouchableOpacity>
                  ))}
                </>
              )}

              <TouchableOpacity
                style={[styles.heroDropdownSeeAll, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)' }]}
                onPressIn={() => { dropdownPressedRef.current = true; }}
                onPress={handleHeroSearch}
                activeOpacity={0.8}
              >
                <Icon name="search" size={14} color={ORANGE} />
                <Text style={[styles.heroDropdownSeeAllText, { color: ORANGE }]}>
                  See all results for "{heroSearch.trim()}"
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.heroCTAs, isMobile && { flexDirection:'column', width:'100%', paddingHorizontal:20, gap:10 }]}>
          <TouchableOpacity
            style={[styles.heroCtaPrimary, isMobile && { width:'100%', justifyContent:'center' }]}
            onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.heroCtaPrimaryText}>Start Learning Free</Text>
            <Icon name="arrow-forward" size={17} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.heroCtaSecondary, {
              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(26,26,46,0.2)',
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,46,0.04)',
            }, isMobile && { width:'100%', justifyContent:'center' }]}
            onPress={() => navigation.navigate('ExploreCourses')}>
            <Icon name="compass-outline" size={17} color={ORANGE} />
            <Text style={[styles.heroCtaSecondaryText, { color: theme.colors.textPrimary }]}>Explore Courses</Text>
          </TouchableOpacity>
        </View>

        {/* Stats strip – 2×2 grid on mobile, single row on desktop */}
        {isMobile ? (
          <View style={[styles.heroStatsMobile, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(26,26,46,0.05)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.1)',
          }]}>
            {stats.map(s => (
              <View key={s.label} style={styles.statItemMobile}>
                <Text style={[styles.statValue, { color:ORANGE }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.heroStats, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(26,26,46,0.05)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.1)',
          }]}>
            {stats.map((s,i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={[styles.statsDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)':'rgba(0,0,0,0.12)' }]} />}
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color:ORANGE }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  );
};

// ─── 4. FEATURES ──────────────────────────────────────────────────────────────
const FeaturesSection = ({ theme, isDark, isMobile, onLayout }) => {
  const features = [
    { icon:'school-outline',     title:'Expert Instructors', desc:'Learn from certified professionals with real-world industry experience.' },
    { icon:'time-outline',       title:'Flexible Learning',  desc:'Study at your own pace with lifetime access to all course materials.' },
    { icon:'ribbon-outline',     title:'Certificates',       desc:'Earn industry-recognised certificates that boost your career prospects.' },
    { icon:'construct-outline',  title:'Live Projects',      desc:'Apply knowledge with hands-on projects that build your portfolio.' },
    { icon:'chatbubbles-outline',title:'AI Assistant',       desc:'Get instant help from our integrated AI tutor, available 24/7.' },
    { icon:'bar-chart-outline',  title:'Track Progress',     desc:'Monitor your learning journey with detailed analytics and insights.' },
  ];

  return (
    <View style={[styles.section, { backgroundColor: isDark ? NAVY2 : '#FFFFFF', paddingVertical: isMobile ? 48 : 72 }]} onLayout={onLayout}>
      <SectionTitle tag="Why Us" title="Everything You Need to Succeed"
        subtitle="We combine cutting-edge technology with expert knowledge to deliver an unparalleled learning experience."
        theme={theme} isMobile={isMobile} />
      <View style={[styles.featuresGrid, isMobile && { flexDirection:'column', gap:12 }]}>
        {features.map(f => (
          <View key={f.title} style={[
            styles.featureCard,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8F9FF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)',
              width: isMobile ? '100%' : '31%',
            },
          ]}>
            <View style={[styles.featureIconBox, { backgroundColor: ORANGE+'18' }]}>
              <Icon name={f.icon} size={24} color={ORANGE} />
            </View>
            <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }, isMobile && { fontSize:15 }]}>{f.title}</Text>
            <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }, isMobile && { fontSize:13 }]}>{f.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── 5. HOW IT WORKS ──────────────────────────────────────────────────────────
const HowItWorksSection = ({ theme, isDark, isMobile, onLayout }) => {
  const steps = [
    { icon:'search-outline',     num:'01', title:'Browse Courses',  desc:'Explore our library of courses across technology, business, design, and more.' },
    { icon:'person-add-outline', num:'02', title:'Enroll & Learn',  desc:'Enroll and learn with video lessons, hands-on projects, and quizzes.' },
    { icon:'medal-outline',      num:'03', title:'Earn Certificate',desc:'Complete the course, pass the assessment, and download your certificate.' },
  ];

  return (
    <View style={[styles.section, { backgroundColor: isDark ? NAVY : '#F8F9FF', paddingVertical: isMobile ? 48 : 72 }]} onLayout={onLayout}>
      <SectionTitle tag="The Process" title="How It Works"
        subtitle="Get started on your learning journey in three simple steps."
        theme={theme} isMobile={isMobile} />
      <View style={[styles.stepsRow, isMobile && { flexDirection:'column', gap:16 }]}>
        {steps.map((step, i) => (
          <React.Fragment key={step.num}>
            <View style={[
              styles.stepCard,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)',
                flex: isMobile ? undefined : 1,
                width: isMobile ? '100%' : undefined,
                padding: isMobile ? 20 : 28,
              },
            ]}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNum}>{step.num}</Text>
              </View>
              <View style={[styles.stepIconCircle, { backgroundColor: ORANGE+'1A' }]}>
                <Icon name={step.icon} size={isMobile ? 26 : 30} color={ORANGE} />
              </View>
              <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }, isMobile && { fontSize:16 }]}>{step.title}</Text>
              <Text style={[styles.stepDesc, { color: theme.colors.textSecondary }, isMobile && { fontSize:13 }]}>{step.desc}</Text>
            </View>
            {!isMobile && i < steps.length-1 && (
              <View style={styles.stepArrow}>
                <Icon name="chevron-forward" size={26} color={ORANGE+'60'} />
              </View>
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

// ─── 6. COURSES CAROUSEL ──────────────────────────────────────────────────────
const CAT_COLORS = {
  Technology: '#6366F1', Design: '#EC4899', Business: '#10B981',
  'Data Science': '#3B82F6', Data: '#3B82F6', Marketing: '#F59E0B',
};

const CoursesCarousel = ({ navigation, theme, isDark, isMobile, onLayout }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true); setError(false);
    courseAPI.getTopCourses(3)
      .then(res => setCourses(res.courses || []))
      .catch(() => { setCourses([]); setError(true); })
      .finally(() => setLoading(false));
  }, []);

  const cardBg     = isDark ? 'rgba(255,255,255,0.06)' : '#F8F9FF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)';
  const CARD_W     = isMobile ? 220 : 240;

  return (
    <View style={[styles.section, { backgroundColor: isDark ? NAVY2 : '#FFFFFF', paddingVertical: isMobile ? 48 : 72 }]} onLayout={onLayout}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: isMobile ? 20 : 32, width:'100%' }}>
        <View>
          <View style={{ backgroundColor: ORANGE+'20', borderRadius:20, paddingHorizontal:12, paddingVertical:4, alignSelf:'flex-start', marginBottom:8 }}>
            <Text style={{ color:ORANGE, fontSize:11, fontWeight:'700', letterSpacing:1.2 }}>LEARN NOW</Text>
          </View>
          <Text style={{ fontSize: isMobile ? 20 : 26, fontWeight:'800', color: theme.colors.textPrimary }}>Top Courses</Text>
        </View>
        <TouchableOpacity
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            borderWidth: 1.5, borderColor: ORANGE,
            backgroundColor: ORANGE + '12',
            borderRadius: 20,
            paddingHorizontal: isMobile ? 12 : 16,
            paddingVertical: isMobile ? 7 : 9,
          }}
          onPress={() => navigation.navigate('ExploreCourses')}
          activeOpacity={0.75}
        >
          <Text style={{ color: ORANGE, fontSize: isMobile ? 12 : 13, fontWeight: '700' }}>View All</Text>
          <Icon name="arrow-forward" size={isMobile ? 12 : 13} color={ORANGE} />
        </TouchableOpacity>
      </View>

      {loading && (
        isMobile ? (
          <View style={{ gap:12 }}>
            {[1,2,3].map(i => (
              <View key={i} style={[styles.courseCard, { width:'100%', backgroundColor:cardBg, borderColor:cardBorder, flexDirection:'row', height:100 }]}>
                <View style={{ width:100, backgroundColor: isDark ? 'rgba(255,255,255,0.04)':'#ECECEC', borderTopLeftRadius:14, borderBottomLeftRadius:14 }} />
                <View style={{ flex:1, padding:14, gap:10, justifyContent:'center' }}>
                  <View style={{ height:11, borderRadius:6, backgroundColor: isDark ? 'rgba(255,255,255,0.08)':'#E0E0E0', width:'40%' }} />
                  <View style={{ height:13, borderRadius:6, backgroundColor: isDark ? 'rgba(255,255,255,0.08)':'#E0E0E0', width:'90%' }} />
                  <View style={{ height:11, borderRadius:6, backgroundColor: isDark ? 'rgba(255,255,255,0.06)':'#EBEBEB', width:'55%' }} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:14, paddingBottom:8 }}>
            {[1,2,3].map(i => (
              <View key={i} style={[styles.courseCard, { width:CARD_W, backgroundColor:cardBg, borderColor:cardBorder }]}>
                <View style={[styles.courseThumb, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)':'#ECECEC' }]} />
                <View style={{ padding:14, gap:10 }}>
                  <View style={{ height:11, borderRadius:6, backgroundColor: isDark ? 'rgba(255,255,255,0.08)':'#E0E0E0', width:'40%' }} />
                  <View style={{ height:13, borderRadius:6, backgroundColor: isDark ? 'rgba(255,255,255,0.08)':'#E0E0E0', width:'90%' }} />
                  <View style={{ height:13, borderRadius:6, backgroundColor: isDark ? 'rgba(255,255,255,0.06)':'#EBEBEB', width:'65%' }} />
                </View>
              </View>
            ))}
          </ScrollView>
        )
      )}

      {!loading && error && (
        <View style={{ alignItems:'center', paddingVertical:28 }}>
          <Icon name="cloud-offline-outline" size={36} color={theme.colors.textSecondary} />
          <Text style={{ color: theme.colors.textSecondary, marginTop:10, fontSize:13 }}>
            Could not load courses. Check your connection.
          </Text>
        </View>
      )}

      {!loading && !error && courses.length === 0 && (
        <View style={{ alignItems:'center', paddingVertical:28 }}>
          <Icon name="book-outline" size={36} color={theme.colors.textSecondary} />
          <Text style={{ color: theme.colors.textSecondary, marginTop:10, fontSize:13 }}>
            No published courses yet.
          </Text>
        </View>
      )}

      {!loading && !error && courses.length > 0 && (() => {
        const renderCard = (course, horizontal) => {
          const catName = course.category?.name || 'General';
          const catColor = CAT_COLORS[catName] || ORANGE;
          const thumb = course.thumbnailImage ? resolveFileUrl(course.thumbnailImage) : null;
          const instructor = course.user?.name || null;

          if (horizontal) {
            // Desktop/tablet: vertical card (image on top)
            return (
              <TouchableOpacity key={course.id}
                style={[styles.courseCard, { width:CARD_W, backgroundColor:cardBg, borderColor:cardBorder }]}
                onPress={() => navigation.navigate('ExploreCourseDetail', { courseId: course.id, courseName: slugify(course.name) })}
                activeOpacity={0.85}>
                <View style={[styles.courseThumb, { backgroundColor: catColor+'20' }]}>
                  {thumb ? (
                    <Image source={{ uri:thumb }}
                      style={{ width:'100%', height:'100%', borderTopLeftRadius:14, borderTopRightRadius:14 }}
                      resizeMode="cover" />
                  ) : (
                    <Icon name="book-outline" size={38} color={catColor} />
                  )}
                </View>
                <View style={[styles.courseCatBadge, { backgroundColor: catColor+'20' }]}>
                  <Text style={[styles.courseCatText, { color:catColor }]}>{catName}</Text>
                </View>
                <View style={styles.courseInfo}>
                  <Text style={[styles.courseTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>{course.name}</Text>
                  {instructor && (
                    <View style={{ flexDirection:'row', alignItems:'center', gap:5, marginTop:5 }}>
                      <Icon name="person-circle-outline" size={13} color={theme.colors.textSecondary} />
                      <Text style={[styles.courseInstructor, { color: theme.colors.textSecondary }]}>{instructor}</Text>
                    </View>
                  )}
                  <View style={styles.courseFooter}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                      <Icon name="people-outline" size={12} color={theme.colors.textSecondary} />
                      <Text style={[styles.courseEnroll, { color: theme.colors.textSecondary }]}>
                        {(course.enrollmentCount||0).toLocaleString()} enrolled
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.enrollBtn} onPress={() => navigation.navigate('Signup')}>
                      <Text style={styles.enrollBtnText}>Enroll</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }

          // Mobile: horizontal card (image on left, info on right)
          return (
            <TouchableOpacity key={course.id}
              style={[styles.courseCard, { width:'100%', backgroundColor:cardBg, borderColor:cardBorder, flexDirection:'row', overflow:'hidden' }]}
              onPress={() => navigation.navigate('ExploreCourseDetail', { courseId: course.id, courseName: slugify(course.name) })}
              activeOpacity={0.85}>
              <View style={{ width:110, height:110, backgroundColor: catColor+'20', justifyContent:'center', alignItems:'center', flexShrink:0 }}>
                {thumb ? (
                  <Image source={{ uri:thumb }} style={{ width:'100%', height:'100%' }} resizeMode="cover" />
                ) : (
                  <Icon name="book-outline" size={34} color={catColor} />
                )}
              </View>
              <View style={{ flex:1, padding:12, justifyContent:'space-between' }}>
                <View>
                  <View style={{ backgroundColor: catColor+'20', borderRadius:8, paddingHorizontal:8, paddingVertical:3, alignSelf:'flex-start', marginBottom:6 }}>
                    <Text style={{ color:catColor, fontSize:10, fontWeight:'700' }}>{catName}</Text>
                  </View>
                  <Text style={{ fontSize:14, fontWeight:'700', color: theme.colors.textPrimary, lineHeight:20 }} numberOfLines={2}>
                    {course.name}
                  </Text>
                  {instructor && (
                    <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:4 }}>
                      <Icon name="person-circle-outline" size={12} color={theme.colors.textSecondary} />
                      <Text style={{ fontSize:11, color: theme.colors.textSecondary }}>{instructor}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                    <Icon name="people-outline" size={12} color={theme.colors.textSecondary} />
                    <Text style={{ fontSize:11, color: theme.colors.textSecondary }}>
                      {(course.enrollmentCount||0).toLocaleString()} enrolled
                    </Text>
                  </View>
                  <TouchableOpacity style={[styles.enrollBtn, { paddingHorizontal:14, paddingVertical:6 }]}
                    onPress={() => navigation.navigate('Signup')}>
                    <Text style={styles.enrollBtnText}>Enroll</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        };

        return isMobile ? (
          <View style={{ gap:12 }}>
            {courses.map(c => renderCard(c, false))}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap:14, paddingBottom:8, paddingHorizontal:2 }}>
            {courses.map(c => renderCard(c, true))}
          </ScrollView>
        );
      })()}
    </View>
  );
};

// ─── 7. STATISTICS ────────────────────────────────────────────────────────────
const StatisticsSection = ({ isMobile }) => {
  const stats = [
    { icon:'people',  value:'10,000+', label:'Active Students' },
    { icon:'library', value:'200+',    label:'Expert Courses' },
    { icon:'school',  value:'50+',     label:'Instructors' },
    { icon:'trophy',  value:'95%',     label:'Completion Rate' },
  ];
  return (
    <View style={[styles.statsSection, { paddingVertical: isMobile ? 40 : 60 }]}>
      <View style={[styles.statsGrid, isMobile && { flexWrap:'wrap', justifyContent:'center' }]}>
        {stats.map(s => (
          <View key={s.label} style={[styles.statBlock, isMobile && { width:'50%', marginBottom:24 }]}>
            <View style={[styles.statIconCircle, { backgroundColor: ORANGE+'25' }]}>
              <Icon name={s.icon} size={isMobile ? 22 : 26} color={ORANGE} />
            </View>
            <Text style={[styles.statBigValue, isMobile && { fontSize:26 }]}>{s.value}</Text>
            <Text style={[styles.statBigLabel, isMobile && { fontSize:12 }]}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── 10. FAQ ──────────────────────────────────────────────────────────────────
const FAQSection = ({ theme, isDark, isMobile, onLayout }) => {
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = [
    { q:'Is SkillSphere free to use?', a:'Yes! You can sign up for free and access a selection of free courses. Premium courses may have fees set by the instructor.' },
    { q:'How do I get a certificate?', a:"After completing all topics and passing the final quiz with 70%+, you'll automatically receive a personalized certificate to download as a PDF." },
    { q:'Can I learn on mobile devices?', a:'Absolutely. SkillSphere works seamlessly on web, Android, and iOS. Your progress is synced across all platforms.' },
    { q:'What is the AI Assistant feature?', a:'Our AI Assistant is powered by an advanced language model inside each course. Ask questions about lesson content, get explanations, or request practice exercises.' },
    { q:'How do instructors apply to teach?', a:'Experts can register an account and apply to become an instructor. After instructor approval, you can create and publish courses.' },
    { q:'Is my payment information secure?', a:'SkillSphere uses industry-standard encryption and trusted payment processors to ensure your financial data is always protected.' },
  ];
  return (
    <View style={[styles.section, { backgroundColor: isDark ? NAVY : '#F8F9FF', paddingVertical: isMobile ? 48 : 72 }]} onLayout={onLayout}>
      <SectionTitle tag="FAQ" title="Frequently Asked Questions"
        subtitle="Have questions? We've got answers." theme={theme} isMobile={isMobile} />
      <View style={{ maxWidth:720, width:'100%', alignSelf:'center' }}>
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <TouchableOpacity key={i}
              style={[styles.faqItem, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                borderColor: isOpen ? ORANGE : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)'),
                marginBottom:10,
              }]}
              onPress={() => setOpenIndex(isOpen ? null : i)} activeOpacity={0.85}>
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: theme.colors.textPrimary }, isMobile && { fontSize:14 }]}>{faq.q}</Text>
                <View style={[styles.faqChevron, { backgroundColor: isOpen ? ORANGE+'18' : (isDark ? 'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)') }]}>
                  <Icon name={isOpen ? 'chevron-up':'chevron-down'} size={15} color={isOpen ? ORANGE : theme.colors.textSecondary} />
                </View>
              </View>
              {isOpen && (
                <Text style={[styles.faqAnswer, { color: theme.colors.textSecondary }, isMobile && { fontSize:13 }]}>{faq.a}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ─── 11. CTA BANNER ───────────────────────────────────────────────────────────
const CTABanner = ({ navigation, isMobile }) => (
  <View style={[styles.ctaBanner, { paddingVertical: isMobile ? 52 : 72 }]}>
    <View style={[styles.ctaBlobLeft, { backgroundColor: ORANGE+'18' }]} />
    <View style={[styles.ctaBlobRight, { backgroundColor: ORANGE+'0F' }]} />
    <Text style={[styles.ctaTitle, isMobile && { fontSize:24, lineHeight:32 }]}>
      Ready to Start Learning?
    </Text>
    <Text style={[styles.ctaSub, isMobile && { fontSize:14 }]}>
      Join over 10,000 students already learning on SkillSphere
    </Text>
    <View style={[styles.ctaButtons, isMobile && { flexDirection:'column', width:'100%', paddingHorizontal:24, gap:10 }]}>
      <TouchableOpacity
        style={[styles.ctaPrimary, isMobile && { width:'100%', justifyContent:'center' }]}
        onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.ctaPrimaryText}>Create Free Account</Text>
        <Icon name="rocket-outline" size={17} color={NAVY} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.ctaSecondary, isMobile && { width:'100%', justifyContent:'center' }]}
        onPress={() => navigation.navigate('Login')}>
        <Text style={styles.ctaSecondaryText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── 12. CONTACT FORM ─────────────────────────────────────────────────────────
const ContactForm = ({ theme, isDark, isMobile, onLayout }) => {
  const [form, setForm] = useState({ name:'', email:'', message:'' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSending(true);
    try {
      await contactAPI.send(form);
      setSent(true);
      setForm({ name:'', email:'', message:'' });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const inputStyle = [styles.contactInput, {
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8F9FF',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.12)',
    color: theme.colors.textPrimary,
  }];
  const placeholderColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(26,26,46,0.35)';

  return (
    <View style={[styles.section, { backgroundColor: isDark ? NAVY2 : '#FFFFFF', paddingVertical: isMobile ? 48 : 72 }]} onLayout={onLayout}>
      <SectionTitle tag="Contact" title="Get In Touch"
        subtitle="Have a question or feedback? We'd love to hear from you."
        theme={theme} isMobile={isMobile} />
      <View style={[styles.contactCard, {
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8F9FF',
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)',
        width: isMobile ? '100%' : 560,
        padding: isMobile ? 20 : 28,
      }]}>
        {sent ? (
          <View style={{ alignItems:'center', paddingVertical:20 }}>
            <View style={{ width:60, height:60, borderRadius:30, backgroundColor: ORANGE+'20', justifyContent:'center', alignItems:'center', marginBottom:14 }}>
              <Icon name="checkmark-circle" size={34} color={ORANGE} />
            </View>
            <Text style={{ fontSize:18, fontWeight:'700', color: theme.colors.textPrimary, marginBottom:8 }}>Message Sent!</Text>
            <Text style={{ color: theme.colors.textSecondary, textAlign:'center', fontSize:13 }}>
              Thank you for reaching out. We'll get back to you within 24 hours.
            </Text>
            <TouchableOpacity style={[styles.sendBtn, { marginTop:18, width:150 }]} onPress={() => setSent(false)}>
              <Text style={styles.sendBtnText}>Send Another</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.contactRow, isMobile && { flexDirection:'column', gap:0 }]}>
              <View style={{ flex:1 }}>
                <Text style={[styles.contactLabel, { color: theme.colors.textSecondary }]}>Your Name</Text>
                <TextInput style={inputStyle} placeholder="John Doe"
                  placeholderTextColor={placeholderColor} value={form.name}
                  onChangeText={v => setForm(p => ({...p, name:v}))} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={[styles.contactLabel, { color: theme.colors.textSecondary }]}>Email Address</Text>
                <TextInput style={inputStyle} placeholder="john@example.com"
                  placeholderTextColor={placeholderColor} keyboardType="email-address"
                  value={form.email} onChangeText={v => setForm(p => ({...p, email:v}))} />
              </View>
            </View>
            <Text style={[styles.contactLabel, { color: theme.colors.textSecondary }]}>Message</Text>
            <TextInput style={[inputStyle, styles.contactTextarea]}
              placeholder="Tell us how we can help..."
              placeholderTextColor={placeholderColor} multiline numberOfLines={4}
              value={form.message} onChangeText={v => setForm(p => ({...p, message:v}))}
              textAlignVertical="top" />
            <TouchableOpacity style={[styles.sendBtn, { opacity: sending ? 0.7 : 1 }]}
              onPress={handleSend} disabled={sending}>
              {sending ? (
                <Text style={styles.sendBtnText}>Sending...</Text>
              ) : (
                <>
                  <Text style={styles.sendBtnText}>Send Message</Text>
                  <Icon name="send" size={15} color={NAVY} />
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

// ─── 13. FOOTER ───────────────────────────────────────────────────────────────
const Footer = ({ navigation, theme, isDark, isMobile, scrollToSection }) => {
  const [topCategories, setTopCategories] = useState([]);

  useEffect(() => {
    categoryAPI.getAll()
      .then(res => {
        const cats = (res.categories || []).slice(0, 5);
        if (cats.length) setTopCategories(cats);
      })
      .catch(() => {}); // fail silently — footer falls back to hardcoded list
  }, []);

  const handleFooterLink = (link) => {
    switch (link) {
      case 'About Us':         navigation.navigate('About');          break;
      case 'Blog':             navigation.navigate('Blog');           break;
      case 'Learn With Us':    navigation.navigate('Signup');         break;
      case 'Partners':         navigation.navigate('About');          break;
      case 'Help Center':      navigation.navigate('HelpCenter');     break;
      case 'Privacy Policy':   navigation.navigate('PrivacyPolicy');  break;
      case 'Terms of Service': navigation.navigate('Terms');          break;
      case 'Cookie Policy':    navigation.navigate('PrivacyPolicy');  break;
      case 'Contact Us':       scrollToSection?.('contact');          break;
      case 'Community':        navigation.navigate('Community');      break;
      default:
        // dynamic category link
        navigation.navigate('ExploreCourses', { category: link });
    }
  };

  const categoryLinks = topCategories.length > 0
    ? topCategories.map(c => c.name)
    : ['Technology', 'Design', 'Business', 'Data Science', 'Marketing'];

  const cols = [
    { title:'Courses',  links: categoryLinks },
    { title:'Company',  links:['About Us','Blog','Learn With Us','Partners'] },
    { title:'Support',  links:['Help Center','Contact Us','Community'], actions:[{ label:'Verify Certificate', route:'CertificateVerify' }] },
    { title:'Legal',    links:['Privacy Policy','Terms of Service','Cookie Policy'] },
  ];
  const socials = [
    { icon:'x-twitter',      label:'X',         url: 'https://x.com/Skill___Sphere' },
    { icon:'logo-linkedin',  label:'LinkedIn',  url: 'https://www.linkedin.com/in/skill-sphere-pk/' },
    { icon:'logo-instagram', label:'Instagram', url: 'https://www.instagram.com/skill._.sphere/' },
    { icon:'logo-youtube',   label:'YouTube',   url: 'https://www.youtube.com/@SkillSphere-learning' },
  ];
  const BrandBlock = () => (
    <View style={{ marginBottom: isMobile ? 24 : 0 }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 }}>
        <Image source={LOGO} style={styles.footerLogoImg} resizeMode="contain" />
        <Text style={styles.footerLogoName}>Skill<Text style={{ color:ORANGE }}>Sphere</Text></Text>
      </View>
      <Text style={[styles.footerTagline, { fontSize: isMobile ? 13 : 13 }]}>
        Empowering learners worldwide with expert knowledge, AI assistance, and industry-recognised certifications.
      </Text>
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:9 }}>
        {socials.map(s => (
          <TouchableOpacity key={s.label} style={styles.socialBtn}
            onPress={() => s.url && Linking.openURL(s.url)}
            activeOpacity={s.url ? 0.7 : 1}>
            {s.icon === 'x-twitter'
              ? <Text style={{ fontSize:15, fontWeight:'800', color: s.url ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)', lineHeight:17 }}>𝕏</Text>
              : <Icon name={s.icon} size={17} color={s.url ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)'} />
            }
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const ColsBlock = () => (
    <View style={{ flexDirection:'row', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: isMobile ? 0 : 24 }}>
      {cols.map(col => (
        <View key={col.title} style={{ width: isMobile ? '50%' : undefined, flex: isMobile ? undefined : 1, marginBottom:24, paddingRight: isMobile ? 8 : 0 }}>
          <Text style={styles.footerColTitle}>{col.title}</Text>
          {col.links.map(link => (
            <TouchableOpacity key={link} style={{ marginBottom:9 }} onPress={() => handleFooterLink(link)}>
              <Text style={[styles.footerLink, { fontSize: isMobile ? 12 : 12 }]}>{link}</Text>
            </TouchableOpacity>
          ))}
          {(col.actions || []).map(action => (
            <TouchableOpacity key={action.label} style={{ marginBottom:9, flexDirection:'row', alignItems:'center', gap:5 }}
              onPress={() => navigation.navigate(action.route)}>
              <Icon name="shield-checkmark-outline" size={12} color={ORANGE} />
              <Text style={[styles.footerLink, { color:ORANGE, fontWeight:'600', fontSize: isMobile ? 12 : 12 }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.footer, { paddingHorizontal: isMobile ? 20 : 32 }]}>
      {isMobile ? (
        <View style={{ flexDirection:'column', marginBottom:28 }}>
          <BrandBlock />
          <ColsBlock />
        </View>
      ) : (
        <View style={styles.footerGrid}>
          <View style={styles.footerBrand}><BrandBlock /></View>
          <View style={styles.footerCols}><ColsBlock /></View>
        </View>
      )}

      <View style={[styles.footerBottom, { borderTopColor:'rgba(255,255,255,0.1)' }, isMobile && { flexDirection:'column', alignItems:'center', gap:10 }]}>
        <Text style={styles.footerCopy}>© {new Date().getFullYear()} SkillSphere. All rights reserved.</Text>
        <View style={{ flexDirection:'row', gap:20 }}>
          <TouchableOpacity><Text style={styles.footerBottomLink}>Privacy</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.footerBottomLink}>Terms</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.footerBottomLink}>Cookies</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const LandingScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile  = width < 768;
  const isDesktop = width >= 1024;

  const scrollViewRef    = useRef(null);
  const sectionOffsets   = useRef({});
  const [activeSection, setActiveSection] = useState(null);


  const registerSection = useCallback((id) => (event) => {
    sectionOffsets.current[id] = event.nativeEvent.layout.y;
  }, []);

  // On web: IntersectionObserver tracks which section is visible while scrolling
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const ids = ['features', 'how', 'courses', 'faq', 'contact'];
    const observers = [];
    const timer = setTimeout(() => {
      ids.forEach(id => {
        const el = document.getElementById('landing-' + id);
        if (!el) return;
        const obs = new IntersectionObserver(
          ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
          { threshold: 0.25 }
        );
        obs.observe(el);
        observers.push(obs);
      });
    }, 400);
    return () => { clearTimeout(timer); observers.forEach(o => o.disconnect()); };
  }, []);

  // ── SEO meta tags (web only) ──────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const setMeta = (name, content, property = false) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };

    document.title = 'SkillSphere — Learn Smarter with AI-Powered Courses';

    setMeta('description', 'SkillSphere is an AI-powered Learning Management System offering expert-taught courses, certifications, and personalised learning paths for students worldwide.');
    setMeta('keywords', 'online learning, AI courses, LMS, certifications, SkillSphere, e-learning Pakistan, programming courses, skill development');
    setMeta('robots', 'index, follow');

    // Open Graph (Facebook, WhatsApp previews)
    setMeta('og:type',        'website',                                          true);
    setMeta('og:url',         'https://skillsphere.com.pk/',                      true);
    setMeta('og:title',       'SkillSphere — Learn Smarter with AI-Powered Courses', true);
    setMeta('og:description', 'Expert-taught courses, AI tutoring, and industry-recognised certifications. Start learning today.', true);
    setMeta('og:image',       'https://skillsphere.com.pk/og-image.png',          true);
    setMeta('og:site_name',   'SkillSphere',                                      true);

    // Twitter card
    setMeta('twitter:card',        'summary_large_image');
    setMeta('twitter:title',       'SkillSphere — Learn Smarter with AI-Powered Courses');
    setMeta('twitter:description', 'Expert-taught courses, AI tutoring, and industry-recognised certifications.');
    setMeta('twitter:image',       'https://skillsphere.com.pk/og-image.png');

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.setAttribute('rel', 'canonical'); document.head.appendChild(canonical); }
    canonical.setAttribute('href', 'https://skillsphere.com.pk/');
  }, []);

  const scrollToSection = useCallback((id) => {
    setActiveSection(id); // immediate highlight on click
    if (Platform.OS === 'web') {
      const el = document.getElementById('landing-' + id);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    }
    const offset = sectionOffsets.current[id];
    if (offset !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: offset, animated: true });
    }
  }, []);

  // Native scroll tracking
  const handleScroll = useCallback((event) => {
    if (Platform.OS === 'web') return;
    const scrollY = event.nativeEvent.contentOffset.y;
    const offsets = sectionOffsets.current;
    let active = null;
    for (const id of ['features','how','courses','faq','contact']) {
      if (offsets[id] !== undefined && scrollY >= offsets[id] - 100) active = id;
    }
    setActiveSection(active);
  }, []);

  return (
    <View style={{ flex:1, backgroundColor: isDark ? NAVY : '#F8F9FF' }}>
      <Helmet>
        <title>SkillSphere - Online Courses &amp; AI Learning Platform Pakistan</title>
        <meta name="description" content="Pakistan's #1 AI-powered online learning platform. Enroll in expert-led courses, learn with AI tutors, earn verified certificates, and master in-demand skills." />
        <link rel="canonical" href="https://skillsphere.com.pk/" />
        <meta property="og:url" content="https://skillsphere.com.pk/" />
        <meta property="og:title" content="SkillSphere - Online Courses & AI Learning Platform Pakistan" />
      </Helmet>
      {/* Hero blobs extended into navbar gap — positioned to match hero section's blob exactly */}
      <View style={{ position:'absolute', width:360, height:360, borderRadius:180, top:-8, left:-100, backgroundColor: ORANGE + (isDark ? '15' : '10'), pointerEvents:'none' }} />
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <AppHeader
        showBack={false}
        showDateTime={false}
        navItems={NAV_LINKS}
        activeRoute={activeSection}
        onNavigate={(route) => {
          const sectionIds = NAV_LINKS.map(n => n.route);
          if (sectionIds.includes(route)) scrollToSection(route);
          else navigation.navigate(route);
        }}
        leftComponent={isMobile ? (
          <Text style={{ color:'#FFFFFF', fontWeight:'800', fontSize:15, letterSpacing:1 }}>
            SKILL<Text style={{ color: ORANGE }}>SPHERE</Text>
          </Text>
        ) : null}
        rightActions={!isMobile ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={{ flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:13, paddingVertical:7, borderRadius:10, borderWidth:1.5, borderColor:ORANGE+'60', backgroundColor:ORANGE+'12' }}
              onPress={() => navigation.navigate('CertificateVerify')}
            >
              <Icon name="shield-checkmark-outline" size={14} color={ORANGE} />
              <Text style={{ color:ORANGE, fontSize:13, fontWeight:'600' }}>Verify</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingHorizontal:16, paddingVertical:8, borderRadius:10, borderWidth:1.5, borderColor:'rgba(255,255,255,0.25)' }}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={{ color:'#FFFFFF', fontSize:13, fontWeight:'600' }}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingHorizontal:16, paddingVertical:8, borderRadius:10, backgroundColor:ORANGE }}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={{ color:'#FFFFFF', fontSize:13, fontWeight:'700' }}>Get Started</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        mobileDropdownFooter={(close) => (
          <>
            <View style={{ height:1, backgroundColor:'rgba(255,255,255,0.1)', marginVertical:4, marginHorizontal:12 }} />
            <TouchableOpacity
              style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:10, marginHorizontal:6, marginVertical:1, borderRadius:12, gap:12 }}
              onPress={() => { close(); setTimeout(() => navigation.navigate('CertificateVerify'), 100); }}
              activeOpacity={0.7}
            >
              <View style={{ width:36, height:36, borderRadius:10, justifyContent:'center', alignItems:'center', backgroundColor:ORANGE+'18' }}>
                <Icon name="shield-checkmark-outline" size={18} color={ORANGE} />
              </View>
              <Text style={{ flex:1, fontSize:14, fontWeight:'600', color:'rgba(255,255,255,0.85)' }}>Verify Certificate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:10, marginHorizontal:6, marginVertical:1, borderRadius:12, gap:12 }}
              onPress={() => { close(); setTimeout(() => navigation.navigate('Login'), 100); }}
              activeOpacity={0.7}
            >
              <View style={{ width:36, height:36, borderRadius:10, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(255,255,255,0.08)' }}>
                <Icon name="log-in-outline" size={18} color="#FFFFFF" />
              </View>
              <Text style={{ flex:1, fontSize:14, fontWeight:'600', color:'rgba(255,255,255,0.85)' }}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:10, marginHorizontal:6, marginVertical:1, borderRadius:12, gap:12, backgroundColor:ORANGE+'22' }}
              onPress={() => { close(); setTimeout(() => navigation.navigate('Signup'), 100); }}
              activeOpacity={0.7}
            >
              <View style={{ width:36, height:36, borderRadius:10, justifyContent:'center', alignItems:'center', backgroundColor:ORANGE+'30' }}>
                <Icon name="rocket-outline" size={18} color={ORANGE} />
              </View>
              <Text style={{ flex:1, fontSize:14, fontWeight:'700', color:ORANGE }}>Get Started</Text>
            </TouchableOpacity>
          </>
        )}
      />
      <ScrollView
        ref={scrollViewRef}
        style={{ flex:1 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <HeroSection navigation={navigation} theme={theme} isDark={isDark} isMobile={isMobile} scrollToSection={scrollToSection} />
        <View nativeID="landing-features" onLayout={registerSection('features')}>
          <FeaturesSection   theme={theme} isDark={isDark} isMobile={isMobile} />
        </View>
        <View nativeID="landing-how" onLayout={registerSection('how')}>
          <HowItWorksSection theme={theme} isDark={isDark} isMobile={isMobile} />
        </View>
        <View nativeID="landing-courses" onLayout={registerSection('courses')}>
          <CoursesCarousel   navigation={navigation} theme={theme} isDark={isDark} isMobile={isMobile} />
        </View>
        <StatisticsSection isMobile={isMobile} />
        <View nativeID="landing-faq" onLayout={registerSection('faq')}>
          <FAQSection        theme={theme} isDark={isDark} isMobile={isMobile} />
        </View>
        <CTABanner         navigation={navigation} isMobile={isMobile} />
        <View nativeID="landing-contact" onLayout={registerSection('contact')}>
          <ContactForm       theme={theme} isDark={isDark} isMobile={isMobile} />
        </View>
        <Footer            navigation={navigation} theme={theme} isDark={isDark} isMobile={isMobile} scrollToSection={scrollToSection} />
      </ScrollView>
    </View>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Hero
  hero: { paddingTop:72, paddingBottom:56, paddingHorizontal:20, alignItems:'center', overflow:'hidden', minHeight:520, justifyContent:'center' },
  heroBlobLeft:  { position:'absolute', width:360, height:360, borderRadius:180, top:-80, left:-100 },
  heroBlobRight: { position:'absolute', width:300, height:300, borderRadius:150, bottom:-80, right:-60 },
  heroBadge: { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:ORANGE+'18', borderRadius:20, paddingHorizontal:14, paddingVertical:6, marginBottom:20 },
  heroBadgeText: { color:ORANGE, fontSize:12, fontWeight:'600', letterSpacing:0.3 },
  heroHeadline: { fontSize:48, fontWeight:'900', textAlign:'center', lineHeight:58, marginBottom:18, letterSpacing:-1 },
  heroSub: { fontSize:16, textAlign:'center', lineHeight:26, maxWidth:500, marginBottom:28 },
  heroSearchContainer: { width:'100%', maxWidth:540, marginBottom:28, zIndex:100 },
  heroSearchWrap: { flexDirection:'row', alignItems:'center', gap:10, borderRadius:50, borderWidth:1.5, paddingHorizontal:18, paddingVertical:10, width:'100%', shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.08, shadowRadius:12, elevation:4 },
  heroSearchInput: { flex:1, fontSize:15, outlineStyle:'none' },
  heroSearchBtn: { paddingHorizontal:18, paddingVertical:8, borderRadius:30 },
  heroSearchBtnText: { color:'#fff', fontWeight:'700', fontSize:14 },
  heroDropdown: { borderLeftWidth:1.5, borderRightWidth:1.5, borderBottomWidth:1.5, borderBottomLeftRadius:18, borderBottomRightRadius:18, overflow:'hidden', shadowOffset:{width:0,height:8}, shadowOpacity:0.12, shadowRadius:16, elevation:8 },
  heroDropdownSection: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:16, paddingTop:12, paddingBottom:4 },
  heroDropdownHeading: { fontSize:11, fontWeight:'800', letterSpacing:1, textTransform:'uppercase' },
  heroDropdownItem: { flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:16, paddingVertical:11, borderBottomWidth:1 },
  heroDropdownItemText: { fontSize:14, fontWeight:'500' },
  heroDropdownItemMeta: { fontSize:11, marginTop:1 },
  heroDropdownSeeAll: { flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:16, paddingVertical:12, borderTopWidth:1 },
  heroDropdownSeeAllText: { fontSize:13, fontWeight:'700' },
  heroCTAs: { flexDirection:'row', gap:12, marginBottom:40, alignItems:'center', width:'100%', justifyContent:'center' },
  heroCtaPrimary: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:ORANGE, paddingHorizontal:26, paddingVertical:14, borderRadius:14, borderWidth:1, borderColor:'#E77828', shadowColor:'#C96A24', shadowOffset:{width:0,height:3}, shadowOpacity:0.16, shadowRadius:6, elevation:3 },
  heroCtaPrimaryText: { color:'#FFFFFF', fontSize:15, fontWeight:'700', letterSpacing:0.12 },
  heroCtaSecondary: { flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:22, paddingVertical:13, borderRadius:14, borderWidth:1.5 },
  heroCtaSecondaryText: { fontSize:15, fontWeight:'600' },
  // Desktop stats row
  heroStats: { flexDirection:'row', alignItems:'center', borderRadius:16, paddingVertical:16, paddingHorizontal:24, borderWidth:1 },
  statItem: { alignItems:'center', paddingHorizontal:18 },
  statsDivider: { width:1, height:32 },
  // Mobile stats 2x2 grid
  heroStatsMobile: { flexDirection:'row', flexWrap:'wrap', borderRadius:16, paddingVertical:12, paddingHorizontal:8, borderWidth:1, width:'100%' },
  statItemMobile: { width:'50%', alignItems:'center', paddingVertical:12 },
  statValue: { fontSize:20, fontWeight:'800', marginBottom:2 },
  statLabel: { fontSize:11, fontWeight:'500' },

  // Sections
  section: { paddingVertical:72, paddingHorizontal:20, alignItems:'center' },

  // Features
  featuresGrid: { flexDirection:'row', flexWrap:'wrap', gap:16, justifyContent:'center', maxWidth:1100, width:'100%' },
  featureCard: { borderRadius:16, padding:24, borderWidth:1, alignItems:'flex-start', minWidth:220 },
  featureIconBox: { width:48, height:48, borderRadius:13, justifyContent:'center', alignItems:'center', marginBottom:14 },
  featureTitle: { fontSize:16, fontWeight:'700', marginBottom:7 },
  featureDesc: { fontSize:13, lineHeight:21 },

  // How It Works
  stepsRow: { flexDirection:'row', alignItems:'stretch', gap:0, maxWidth:960, width:'100%' },
  stepCard: { borderRadius:18, padding:28, borderWidth:1, alignItems:'center', position:'relative' },
  stepNumBadge: { position:'absolute', top:14, right:14, backgroundColor:ORANGE+'15', borderRadius:7, paddingHorizontal:7, paddingVertical:2 },
  stepNum: { color:ORANGE, fontSize:11, fontWeight:'800', letterSpacing:0.5 },
  stepIconCircle: { width:64, height:64, borderRadius:32, justifyContent:'center', alignItems:'center', marginBottom:16, marginTop:6 },
  stepTitle: { fontSize:17, fontWeight:'700', marginBottom:9, textAlign:'center' },
  stepDesc: { fontSize:13, lineHeight:21, textAlign:'center' },
  stepArrow: { alignSelf:'center', paddingHorizontal:6, paddingTop:10 },

  // Courses
  courseCard: { borderRadius:14, borderWidth:1, overflow:'hidden' },
  courseThumb: { width:'100%', height:120, justifyContent:'center', alignItems:'center' },
  courseCatBadge: { alignSelf:'flex-start', marginHorizontal:12, marginTop:10, paddingHorizontal:9, paddingVertical:3, borderRadius:7 },
  courseCatText: { fontSize:10, fontWeight:'700', letterSpacing:0.4 },
  courseInfo: { padding:12, paddingTop:7 },
  courseTitle: { fontSize:13, fontWeight:'700', lineHeight:19, marginTop:4 },
  courseInstructor: { fontSize:11 },
  courseFooter: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:10 },
  courseEnroll: { fontSize:11 },
  enrollBtn: { backgroundColor:ORANGE, paddingHorizontal:11, paddingVertical:5, borderRadius:7, borderWidth:1, borderColor:'#E77828' },
  enrollBtnText: { color:'#FFFFFF', fontSize:11, fontWeight:'700', letterSpacing:0.1 },

  // Statistics
  statsSection: { paddingHorizontal:20, alignItems:'center', backgroundColor:NAVY },
  statsGrid: { flexDirection:'row', justifyContent:'center', maxWidth:860, width:'100%' },
  statBlock: { flex:1, alignItems:'center', paddingVertical:16, paddingHorizontal:12 },
  statIconCircle: { width:52, height:52, borderRadius:26, justifyContent:'center', alignItems:'center', marginBottom:12 },
  statBigValue: { fontSize:30, fontWeight:'900', color:'#FFFFFF', marginBottom:4, letterSpacing:-0.5 },
  statBigLabel: { fontSize:12, color:'rgba(255,255,255,0.6)', fontWeight:'500', textAlign:'center' },

  // FAQ
  faqItem: { borderRadius:13, borderWidth:1, padding:16, overflow:'hidden' },
  faqHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:10 },
  faqQuestion: { flex:1, fontSize:14, fontWeight:'600', lineHeight:21 },
  faqChevron: { width:28, height:28, borderRadius:7, justifyContent:'center', alignItems:'center' },
  faqAnswer: { fontSize:13, lineHeight:22, marginTop:10 },

  // CTA Banner
  ctaBanner: { paddingHorizontal:24, alignItems:'center', overflow:'hidden', backgroundColor:NAVY },
  ctaBlobLeft:  { position:'absolute', width:260, height:260, borderRadius:130, top:-70, left:-50 },
  ctaBlobRight: { position:'absolute', width:220, height:220, borderRadius:110, bottom:-50, right:-30 },
  ctaTitle: { fontSize:34, fontWeight:'900', color:'#FFFFFF', textAlign:'center', marginBottom:12, letterSpacing:-0.5 },
  ctaSub: { fontSize:15, color:'rgba(255,255,255,0.7)', textAlign:'center', marginBottom:32 },
  ctaButtons: { flexDirection:'row', gap:12, alignItems:'center' },
  ctaPrimary: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:ORANGE, paddingHorizontal:26, paddingVertical:14, borderRadius:13, borderWidth:1, borderColor:'#E77828', shadowColor:'#C96A24', shadowOffset:{width:0,height:3}, shadowOpacity:0.16, shadowRadius:6, elevation:3 },
  ctaPrimaryText: { color:NAVY, fontSize:15, fontWeight:'800', letterSpacing:0.1 },
  ctaSecondary: { alignItems:'center', justifyContent:'center', paddingHorizontal:26, paddingVertical:13, borderRadius:13, borderWidth:1.5, borderColor:'rgba(255,255,255,0.35)' },
  ctaSecondaryText: { color:'#FFFFFF', fontSize:15, fontWeight:'600' },

  // Contact
  contactCard: { borderRadius:18, borderWidth:1, alignSelf:'center' },
  contactRow: { flexDirection:'row', gap:14, marginBottom:2 },
  contactLabel: { fontSize:12, fontWeight:'600', marginBottom:6, marginTop:10, letterSpacing:0.2 },
  contactInput: { borderRadius:11, borderWidth:1.5, paddingHorizontal:13, paddingVertical:11, fontSize:13, marginBottom:2 },
  contactTextarea: { minHeight:110, paddingTop:11, marginBottom:16 },
  sendBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:ORANGE, paddingVertical:13, borderRadius:11, borderWidth:1, borderColor:'#E77828', shadowColor:'#C96A24', shadowOffset:{width:0,height:3}, shadowOpacity:0.14, shadowRadius:6, elevation:3 },
  sendBtnText: { color:NAVY, fontSize:14, fontWeight:'800', letterSpacing:0.1 },

  // Footer
  footer: { paddingTop:48, backgroundColor:NAVY },
  footerGrid: { flexDirection:'row', gap:36, marginBottom:36 },
  footerBrand: { flex:1.4, minWidth:200 },
  footerLogoImg: { width:36, height:36, borderRadius:8 },
  footerLogoName: { color:'#FFFFFF', fontSize:19, fontWeight:'800' },
  footerTagline: { color:'rgba(255,255,255,0.6)', fontSize:13, lineHeight:21, marginBottom:18 },
  footerSocials: { flexDirection:'row', gap:9 },
  socialBtn: { width:36, height:36, borderRadius:9, backgroundColor:'rgba(255,255,255,0.08)', justifyContent:'center', alignItems:'center' },
  footerCols: { flex:3 },
  footerCol: { flex:1, minWidth:90 },
  footerColTitle: { color:'#FFFFFF', fontSize:13, fontWeight:'700', marginBottom:14, letterSpacing:0.3 },
  footerLink: { color:'rgba(255,255,255,0.55)', fontSize:12, lineHeight:17 },
  footerBottom: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:18, borderTopWidth:1, flexWrap:'wrap', gap:10 },
  footerCopy: { color:'rgba(255,255,255,0.4)', fontSize:12 },
  footerBottomLink: { color:'rgba(255,255,255,0.45)', fontSize:12 },
});

export default LandingScreen;
