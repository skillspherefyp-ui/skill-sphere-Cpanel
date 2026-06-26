import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Platform, useWindowDimensions, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import UserAvatar from '../../components/ui/UserAvatar';
import MainLayout from '../../components/ui/MainLayout';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { discussionAPI } from '../../services/apiClient';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { getSidebarItems } from '../../utils/sidebarItems';

const ORANGE = '#FF8C42';
const avatarPalette = ['#6366F1', '#22D3EE', '#10B981', ORANGE, '#8B5CF6', '#EC4899', '#F59E0B', '#3B82F6'];
const nameColor = (name = '') => avatarPalette[(name.charCodeAt(0) || 0) % avatarPalette.length];

const ROLE_META = {
  student:          { label: 'Student',         color: '#3B82F6' },
  instructor:       { label: 'Instructor',       color: '#8B5CF6' },
  expert:           { label: 'Expert',           color: '#10B981' },
  admin:            { label: 'Admin',            color: '#EF4444' },
  superadmin:       { label: 'Super Admin',      color: ORANGE },
  superinstructor:  { label: 'Super Instructor', color: ORANGE },
};
const getRoleMeta = (role) => ROLE_META[role] || { label: role || 'Member', color: '#6B7280' };


const DiscussionThreadScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { postId, postContent, authorName, authorRole, authorId, authorProfilePicture } = route.params || {};
  const { theme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { height } = useWindowDimensions();
  const scrollRef = useRef(null);
  const isWeb = Platform.OS === 'web';

  const sidebarItems = getSidebarItems(user?.role);
  const canModerate = ['instructor', 'admin', 'expert', 'superadmin', 'superinstructor'].includes(user?.role);

  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchThread = useCallback(async () => {
    try {
      const res = await discussionAPI.getPosts();
      const parent = (res.posts || []).find(p => p.id === postId);
      const sorted = (parent?.replies || []).slice().sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      setReplies(sorted);
    } catch (e) {
      console.error('Fetch thread error:', e);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { fetchThread(); }, [fetchThread]);

  useEffect(() => {
    if (replies.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [replies.length]);

  const handleReply = async () => {
    if (!newReply.trim() || posting) return;
    setPosting(true);
    try {
      await discussionAPI.createPost({ content: newReply.trim(), parentId: postId });
      setNewReply('');
      fetchThread();
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
        console.error('Create reply error:', e);
      }
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await discussionAPI.deletePost(id);
      fetchThread();
    } catch (e) {
      console.error('Delete reply error:', e);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    if (diffMs < 60000) return 'Just now'; // handles negatives (clock skew) and < 1 min
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isMine = (id) => String(id) === String(user?.id);

  const renderRoleBadge = (role) => {
    const { label, color } = getRoleMeta(role);
    return (
      <View style={[styles.roleBadge, { backgroundColor: color + '20', borderColor: color + '50' }]}>
        <Text style={[styles.roleBadgeText, { color }]}>{label}</Text>
      </View>
    );
  };

  const renderOriginalPost = () => {
    if (!postContent) return null;
    const opIsOwn = isMine(authorId);
    const color = nameColor(authorName);
    const initials = (authorName || '?').charAt(0).toUpperCase();
    const { label: roleLabel, color: roleColor } = getRoleMeta(authorRole);

    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[styles.msgRow, opIsOwn ? styles.msgRowRight : styles.msgRowLeft]}
      >
        {!opIsOwn && (
          <UserAvatar user={{ name: authorName, profilePicture: authorProfilePicture }} size={32} />
        )}
        <View style={{ maxWidth: '78%', gap: 4, alignItems: opIsOwn ? 'flex-end' : 'flex-start' }}>
          {/* Name + role row */}
          <View style={[styles.metaRow, opIsOwn && { flexDirection: 'row-reverse' }]}>
            <Text style={[styles.senderName, { color: opIsOwn ? ORANGE : color }]}>
              {authorName || 'Unknown'}
            </Text>
            {renderRoleBadge(authorRole)}
            <View style={[styles.opBadge, { backgroundColor: ORANGE + '20', borderColor: ORANGE + '40' }]}>
              <Icon name="pin" size={11} color={ORANGE} />
              <Text style={[styles.opBadgeText, { color: ORANGE }]}>OP</Text>
            </View>
          </View>
          <View style={[
            styles.msgBubble,
            opIsOwn
              ? { backgroundColor: ORANGE, borderBottomRightRadius: 4 }
              : { backgroundColor: isDark ? '#2a2218' : '#fff5ed', borderColor: ORANGE + '30', borderWidth: 1, borderBottomLeftRadius: 4 },
          ]}>
            <Text style={[styles.msgText, { color: opIsOwn ? '#fff' : theme.colors.textPrimary }]}>
              {postContent}
            </Text>
          </View>
        </View>
        {opIsOwn && (
          <UserAvatar user={user} size={32} />
        )}
      </Animated.View>
    );
  };

  const renderReply = (item, index) => {
    const isOwn = isMine(item.userId) || isMine(item.author?.id);
    const name = item.author?.name || 'Unknown';
    const role = item.author?.role;
    const color = nameColor(name);
    const initials = name.charAt(0).toUpperCase();
    const canDelete = isOwn || canModerate;

    return (
      <Animated.View
        key={String(item.id)}
        entering={FadeInDown.duration(250).delay(index * 30)}
        style={[styles.msgRow, isOwn ? styles.msgRowRight : styles.msgRowLeft]}
      >
        {!isOwn && (
          <UserAvatar user={{ name, profilePicture: item.author?.profilePicture }} size={32} />
        )}
        <View style={{ maxWidth: '78%', gap: 3, alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
          {/* Name + role */}
          <View style={[styles.metaRow, isOwn && { flexDirection: 'row-reverse' }]}>
            <Text style={[styles.senderName, { color: isOwn ? ORANGE : color }]}>{isOwn ? 'You' : name}</Text>
            {role && renderRoleBadge(role)}
          </View>
          <View style={[
            styles.msgBubble,
            isOwn
              ? { backgroundColor: ORANGE, borderBottomRightRadius: 4 }
              : {
                  backgroundColor: isDark ? '#2f2f2f' : theme.colors.backgroundSecondary,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  borderBottomLeftRadius: 4,
                },
          ]}>
            <Text style={[styles.msgText, { color: isOwn ? '#fff' : theme.colors.textPrimary }]}>
              {item.content}
            </Text>
            <View style={styles.msgMeta}>
              <Text style={[styles.msgTime, { color: isOwn ? 'rgba(255,255,255,0.6)' : theme.colors.textTertiary }]}>
                {formatTime(item.createdAt)}
              </Text>
              {canDelete && (
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                  <Icon name="trash-outline" size={12} color={isOwn ? 'rgba(255,255,255,0.6)' : '#EF4444'} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        {isOwn && (
          <UserAvatar user={user} size={32} />
        )}
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: ORANGE + '15' }]}>
        <Icon name="chatbubbles-outline" size={32} color={ORANGE} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No replies yet</Text>
      <Text style={[styles.emptySub, { color: theme.colors.textSecondary }]}>Be the first to reply!</Text>
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
          backgroundColor: theme.colors.background,
          ...(isWeb ? { height: height - 64, overflow: 'hidden' } : { flex: 1 }),
        },
      ]}>

        {/* Sub-header */}
        <View style={[styles.subHeader, {
          backgroundColor: isDark ? theme.colors.card : theme.colors.surface,
          borderBottomColor: theme.colors.border,
        }]}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.backgroundSecondary }]}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={18} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={[styles.threadIconCircle, { backgroundColor: ORANGE + '18' }]}>
            <Icon name="chatbubble-ellipses" size={16} color={ORANGE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.subHeaderTitle, { color: theme.colors.textPrimary }]}>Thread</Text>
            <Text style={[styles.subHeaderSub, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              Community Forum
            </Text>
          </View>
          <View style={[styles.replyCount, { backgroundColor: ORANGE + '18' }]}>
            <Text style={[styles.replyCountText, { color: ORANGE }]}>
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </Text>
          </View>
        </View>

        {/* Messages */}
        {loading ? (
          <View style={styles.loadingBox}><ActivityIndicator color={ORANGE} /></View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={[styles.messagesList, replies.length === 0 && styles.messagesListEmpty]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {renderOriginalPost()}
            {replies.length === 0 ? renderEmpty() : replies.map((item, index) => renderReply(item, index))}
          </ScrollView>
        )}

        {/* Input area */}
        <View style={[styles.inputArea, {
          backgroundColor: isDark ? theme.colors.background : '#fff',
          borderTopColor: theme.colors.border,
        }]}>
          <View style={[styles.inputBox, {
            backgroundColor: isDark ? '#2f2f2f' : theme.colors.backgroundSecondary,
            borderColor: newReply.trim() ? ORANGE + '60' : theme.colors.border,
          }]}>
            <TextInput
              style={[styles.textInput, { color: theme.colors.textPrimary }]}
              value={newReply}
              onChangeText={setNewReply}
              placeholder="Write a reply…"
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              maxLength={500}
              onKeyPress={(e) => {
                if (e?.nativeEvent?.key === 'Enter' && !e?.nativeEvent?.shiftKey) {
                  e.preventDefault?.();
                  if (newReply.trim() && !posting) handleReply();
                }
              }}
            />
            <View style={styles.inputBtns}>
              <Text style={[styles.charCount, { color: newReply.length > 450 ? '#EF4444' : theme.colors.textTertiary }]}>
                {newReply.length}/500
              </Text>
              <TouchableOpacity
                style={[styles.sendBtn, {
                  backgroundColor: newReply.trim() && !posting ? ORANGE : (isDark ? '#444' : '#d4d4d4'),
                }]}
                onPress={handleReply}
                disabled={!newReply.trim() || posting}
              >
                {posting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Icon name="arrow-up" size={18} color={newReply.trim() ? '#fff' : (isDark ? '#888' : '#aaa')} />
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </View>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  root: { flexDirection: 'column' },

  subHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, gap: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  threadIconCircle: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  subHeaderTitle: { fontSize: 15, fontWeight: '700' },
  subHeaderSub: { fontSize: 11, marginTop: 1 },
  replyCount: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  replyCountText: { fontSize: 12, fontWeight: '600' },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  messagesList: { paddingHorizontal: 16, paddingVertical: 16, gap: 4 },
  messagesListEmpty: { flex: 1 },

  msgRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end', gap: 8 },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },

  avatarCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  senderName: { fontSize: 12, fontWeight: '700' },
  roleBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  roleBadgeText: { fontSize: 10, fontWeight: '700' },

  opBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1,
  },
  opBadgeText: { fontSize: 10, fontWeight: '600' },

  msgBubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  msgText: { fontSize: 14, lineHeight: 21 },
  msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  msgTime: { fontSize: 11 },
  deleteBtn: { padding: 2 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center' },

  inputArea: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  inputBox: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 8 },
  textInput: { fontSize: 14, lineHeight: 21, maxHeight: 100, minHeight: 24 },
  inputBtns: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  charCount: { fontSize: 11 },
  sendBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});

export default DiscussionThreadScreen;
