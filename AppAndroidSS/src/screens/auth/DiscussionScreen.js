import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, useWindowDimensions, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import UserAvatar from '../../components/ui/UserAvatar';
import MainLayout from '../../components/ui/MainLayout';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { discussionAPI, courseAPI } from '../../services/apiClient';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { getSidebarItems } from '../../utils/sidebarItems';

const ORANGE = '#FF8C42';
const avatarPalette = ['#6366F1', '#22D3EE', '#10B981', ORANGE, '#8B5CF6', '#EC4899', '#F59E0B', '#3B82F6'];
const nameColor = (name = '') => avatarPalette[(name.charCodeAt(0) || 0) % avatarPalette.length];

const ROLE_META = {
  student:          { label: 'Student',       color: '#3B82F6' },
  instructor:       { label: 'Instructor',     color: '#8B5CF6' },
  expert:           { label: 'Expert',         color: '#10B981' },
  admin:            { label: 'Admin',          color: '#EF4444' },
  superadmin:       { label: 'Super Admin',    color: ORANGE },
  superinstructor:  { label: 'Super Instructor', color: ORANGE },
};

const getRoleMeta = (role) => ROLE_META[role] || { label: role || 'Member', color: '#6B7280' };


const DiscussionScreen = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { height } = useWindowDimensions();
  const scrollRef = useRef(null);
  const isWeb = Platform.OS === 'web';

  const sidebarItems = getSidebarItems(user?.role);
  const canModerate = ['instructor', 'admin', 'expert', 'superadmin', 'superinstructor'].includes(user?.role);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);

  // @mention state
  const [publishedCourses, setPublishedCourses] = useState([]);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null); // null = not active

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await discussionAPI.getPosts();
      setPosts(res.posts || []);
    } catch (e) {
      console.error('Fetch posts error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Re-filter suggestions whenever publishedCourses loads in
  useEffect(() => {
    if (mentionQuery !== null && publishedCourses.length > 0) {
      setMentionSuggestions(
        publishedCourses.filter(c =>
          c.name?.toLowerCase().includes(mentionQuery)
        ).slice(0, 6)
      );
    }
  }, [publishedCourses, mentionQuery]);

  // Load published courses lazily (once) when @ is first typed
  const loadCourses = useCallback(async () => {
    if (publishedCourses.length > 0) return;
    try {
      const res = await courseAPI.getAll({ limit: 200 });
      const courses = (res.courses || res.data || res || []);
      setPublishedCourses(courses.filter(c => c.status === 'published'));
    } catch (e) {
      console.error('Load courses error:', e);
    }
  }, [publishedCourses.length]);

  const handleComposerChange = useCallback((text) => {
    setNewPost(text);
    // Detect the @word at the end of the current typed segment
    const match = text.match(/@([^\s@]*)$/);
    if (match) {
      const query = match[1].toLowerCase();
      setMentionQuery(query);
      loadCourses();
      setMentionSuggestions(
        publishedCourses.filter(c =>
          c.name?.toLowerCase().includes(query)
        ).slice(0, 6)
      );
    } else {
      setMentionQuery(null);
      setMentionSuggestions([]);
    }
  }, [publishedCourses, loadCourses]);

  const handleMentionSelect = useCallback((course) => {
    // Replace the trailing @query with @CourseName
    const updated = newPost.replace(/@([^\s@]*)$/, `@${course.name} `);
    setNewPost(updated);
    setMentionQuery(null);
    setMentionSuggestions([]);
  }, [newPost]);

  const handlePost = async () => {
    if (!newPost.trim() || posting) return;
    setPosting(true);
    try {
      await discussionAPI.createPost({ content: newPost.trim() });
      setNewPost('');
      setComposerFocused(false);
      fetchPosts();
    } catch (e) {
      if (e.message?.includes('inappropriate language') || e.blocked) {
        Toast.show({
          type: 'error',
          text1: 'Account Suspended',
          text2: 'Your message contained inappropriate language. Your account has been suspended.',
          visibilityTime: 5000,
        });
        setTimeout(() => logout(), 2000);
      } else {
        console.error('Create post error:', e);
      }
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await discussionAPI.deletePost(id);
      fetchPosts();
    } catch (e) {
      console.error('Delete post error:', e);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMins = Math.floor((now - d) / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOwn = (item) => item.userId === user?.id || item.author?.id === user?.id;

  const renderRoleBadge = (role) => {
    const { label, color } = getRoleMeta(role);
    return (
      <View style={[styles.roleBadge, { backgroundColor: color + '20', borderColor: color + '50' }]}>
        <Text style={[styles.roleBadgeText, { color }]}>{label}</Text>
      </View>
    );
  };

  const renderPost = (item, index) => {
    const name = item.author?.name || 'Unknown';
    const role = item.author?.role;
    const color = nameColor(name);
    const initials = name.charAt(0).toUpperCase();
    const replyCount = item.replies?.length || 0;
    const mine = isOwn(item);

    return (
      <Animated.View
        key={String(item.id)}
        entering={FadeInDown.duration(300).delay(index * 50)}
        style={[styles.msgRow, mine ? styles.msgRowRight : styles.msgRowLeft]}
      >
        {!mine && (
          <View style={styles.avatarOuter}>
            <UserAvatar user={{ name, profilePicture: item.author?.profilePicture }} size={36} />
          </View>
        )}

        <View style={[styles.bubbleCol, mine && { alignItems: 'flex-end' }]}>
          <View style={[styles.metaRow, mine && { flexDirection: 'row-reverse' }]}>
            {!mine && <Text style={[styles.authorName, { color }]}>{name}</Text>}
            {mine && (
              <View style={[styles.youBadge, { backgroundColor: ORANGE + '20' }]}>
                <Text style={[styles.youBadgeText, { color: ORANGE }]}>You</Text>
              </View>
            )}
            {role && renderRoleBadge(role)}
            {item.isPinned && (
              <View style={styles.pinnedChip}>
                <Icon name="pin" size={10} color={ORANGE} />
                <Text style={[styles.pinnedChipText, { color: ORANGE }]}>pinned</Text>
              </View>
            )}
            <Text style={[styles.postTime, { color: theme.colors.textTertiary }]}>
              {formatTime(item.createdAt)}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate('DiscussionThread', {
              postId: item.id,
              postContent: item.content,
              authorName: name,
              authorRole: role,
              authorId: item.userId,
            })}
            style={[
              styles.bubble,
              mine
                ? [styles.bubbleMine, { backgroundColor: isDark ? '#3d2a1a' : '#fff3ea', borderColor: ORANGE + '55' }]
                : [styles.bubbleOther, {
                    backgroundColor: isDark ? '#1e2230' : '#f0f4ff',
                    borderColor: isDark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.2)',
                    borderLeftColor: color,
                  }],
            ]}
          >
            <Text style={[styles.bubbleText, { color: theme.colors.textPrimary }]} numberOfLines={6}>
              {item.content}
            </Text>

            <View style={styles.bubbleFooter}>
              {replyCount > 0 ? (
                <View style={[styles.replyPill, { backgroundColor: mine ? ORANGE + '25' : color + '20' }]}>
                  <Icon name="chatbubble-ellipses-outline" size={11} color={mine ? ORANGE : color} />
                  <Text style={[styles.replyPillText, { color: mine ? ORANGE : color }]}>
                    {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.noReplyText, { color: theme.colors.textTertiary }]}>no replies yet</Text>
              )}
              <View style={styles.bubbleActions}>
                {canModerate && (
                  <TouchableOpacity
                    onPress={() => discussionAPI.pinPost(item.id).then(fetchPosts)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Icon name={item.isPinned ? 'pin' : 'pin-outline'} size={13} color={ORANGE} />
                  </TouchableOpacity>
                )}
                {(mine || canModerate) && (
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Icon name="trash-outline" size={13} color="#EF4444" />
                  </TouchableOpacity>
                )}
                <Icon name="chevron-forward" size={13} color={theme.colors.textTertiary} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {mine && (
          <View style={styles.avatarOuter}>
            <UserAvatar user={user} size={36} />
          </View>
        )}
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconWrap, { backgroundColor: ORANGE + '12', borderColor: ORANGE + '25', borderWidth: 1 }]}>
        <Icon name="chatbubbles-outline" size={36} color={ORANGE} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No discussions yet</Text>
      <Text style={[styles.emptySub, { color: theme.colors.textSecondary }]}>
        Be the first to start a conversation
      </Text>
    </View>
  );

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="Discussion"
      onNavigate={(r) => navigation.navigate(r)}
      userInfo={{ name: user?.name, role: getRoleMeta(user?.role).label, avatar: user?.avatar }}
      onLogout={logout}
      onSettings={() => navigation.navigate('Settings')}
    >
      <View style={[
        styles.root,
        {
          backgroundColor: isDark ? theme.colors.background : '#f4f5f7',
          ...(isWeb ? { height: height - 64, overflow: 'hidden' } : { flex: 1 }),
        },
      ]}>

        {/* Header */}
        <View style={[styles.header, {
          backgroundColor: isDark ? theme.colors.card : '#fff',
          borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        }]}>
          <View style={[styles.headerIconWrap, { backgroundColor: ORANGE + '15' }]}>
            <Icon name="chatbubbles" size={18} color={ORANGE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Community Forum</Text>
            <Text style={[styles.headerSub, { color: theme.colors.textSecondary }]}>Open to all members</Text>
          </View>
          {posts.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: ORANGE + '15' }]}>
              <Text style={[styles.countBadgeText, { color: ORANGE }]}>{posts.length}</Text>
            </View>
          )}
        </View>

        {/* Feed */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={ORANGE} size="large" />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={[styles.feed, posts.length === 0 && styles.feedEmpty]}
            showsVerticalScrollIndicator={false}
          >
            {posts.length === 0 ? renderEmpty() : posts.map((item, index) => renderPost(item, index))}
          </ScrollView>
        )}

        {/* @mention course suggestions */}
        {mentionSuggestions.length > 0 && (
          <View style={[styles.mentionBox, {
            backgroundColor: isDark ? theme.colors.card : '#fff',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }]}>
            {mentionSuggestions.map((course) => (
              <TouchableOpacity
                key={String(course.id)}
                style={[styles.mentionItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}
                onPress={() => handleMentionSelect(course)}
              >
                <View style={[styles.mentionIcon, { backgroundColor: ORANGE + '18' }]}>
                  <Icon name="book-outline" size={14} color={ORANGE} />
                </View>
                <Text style={[styles.mentionName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  {course.name}
                </Text>
                {course.level && (
                  <Text style={[styles.mentionLevel, { color: theme.colors.textTertiary }]}>{course.level}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Composer */}
        <View style={[styles.composer, {
          backgroundColor: isDark ? theme.colors.card : '#fff',
          borderTopColor: composerFocused ? ORANGE + '50' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
        }]}>
          <View style={styles.composerAvatarOuter}>
            <UserAvatar user={user} size={36} />
          </View>
          <View style={[styles.composerBox, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f4f5f7',
            borderColor: composerFocused ? ORANGE + '70' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
          }]}>
            <TextInput
              style={[styles.composerInput, { color: theme.colors.textPrimary }]}
              value={newPost}
              onChangeText={handleComposerChange}
              onFocus={() => setComposerFocused(true)}
              onBlur={() => setComposerFocused(false)}
              placeholder="Share something with the community… (type @ to mention a course)"
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              maxLength={1000}
            />
            {(composerFocused || newPost.length > 0) && (
              <View style={styles.composerFooter}>
                <Text style={[styles.charCount, { color: newPost.length > 900 ? '#EF4444' : theme.colors.textTertiary }]}>
                  {newPost.length}/1000
                </Text>
                <TouchableOpacity
                  style={[styles.postBtn, {
                    backgroundColor: newPost.trim() && !posting ? ORANGE : (isDark ? '#3a3a3a' : '#e0e0e0'),
                  }]}
                  onPress={handlePost}
                  disabled={!newPost.trim() || posting}
                >
                  {posting
                    ? <ActivityIndicator size="small" color="#fff" />
                    : (
                      <View style={styles.postBtnInner}>
                        <Icon name="arrow-up" size={15} color={newPost.trim() ? '#fff' : (isDark ? '#666' : '#aaa')} />
                        <Text style={[styles.postBtnText, { color: newPost.trim() ? '#fff' : (isDark ? '#666' : '#aaa') }]}>Post</Text>
                      </View>
                    )
                  }
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

      </View>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  root: { flexDirection: 'column' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSub: { fontSize: 11, marginTop: 1 },
  countBadge: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  countBadgeText: { fontSize: 13, fontWeight: '700' },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  feed: { paddingHorizontal: 12, paddingVertical: 14, gap: 6 },
  feedEmpty: { flex: 1 },

  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },

  avatarOuter: { flexShrink: 0, marginTop: 22 },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  bubbleCol: { flex: 1, maxWidth: '85%', gap: 4 },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 2,
    flexWrap: 'wrap',
  },
  authorName: { fontSize: 13, fontWeight: '700' },
  postTime: { fontSize: 11 },
  youBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  youBadgeText: { fontSize: 10, fontWeight: '800' },
  roleBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, borderWidth: 1,
  },
  roleBadgeText: { fontSize: 10, fontWeight: '700' },
  pinnedChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  pinnedChipText: { fontSize: 10, fontWeight: '600' },

  bubble: { borderRadius: 10, borderWidth: 1, padding: 12 },
  bubbleOther: { borderLeftWidth: 3 },
  bubbleMine: { borderRadius: 10 },
  bubbleText: { fontSize: 14, lineHeight: 21, marginBottom: 8 },

  bubbleFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  replyPillText: { fontSize: 11, fontWeight: '600' },
  noReplyText: { fontSize: 11, flex: 1 },
  bubbleActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 'auto' },

  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 60, gap: 10,
  },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', maxWidth: 260 },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  composerAvatarOuter: { flexShrink: 0, marginBottom: 4 },
  composerBox: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8,
  },
  composerInput: { fontSize: 14, lineHeight: 21, maxHeight: 110, minHeight: 22 },
  composerFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end', gap: 10, marginTop: 8,
  },
  charCount: { fontSize: 11, flex: 1 },
  postBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7, minWidth: 60, alignItems: 'center', justifyContent: 'center' },
  postBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  postBtnText: { fontSize: 13, fontWeight: '700' },

  mentionBox: {
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 14,
    marginBottom: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
  },
  mentionIcon: {
    width: 28, height: 28, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  mentionName: { fontSize: 13, fontWeight: '600', flex: 1 },
  mentionLevel: { fontSize: 11 },
});

export default DiscussionScreen;
