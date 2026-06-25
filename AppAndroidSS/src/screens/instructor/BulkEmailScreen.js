import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Platform, useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import MainLayout from '../../components/ui/MainLayout';
import UserAvatar from '../../components/ui/UserAvatar';
import { bulkEmailAPI, newsletterAPI } from '../../services/apiClient';
import { getSidebarItems } from '../../utils/sidebarItems';
import Toast from 'react-native-toast-message';

const ORANGE = '#FF8C42';
const NAVY   = '#1A1A2E';

const TABS = [
  { key: 'all',          label: 'All',         icon: 'people' },
  { key: 'student',      label: 'Students',    icon: 'school' },
  { key: 'instructor',   label: 'Instructors', icon: 'person' },
  { key: 'expert',       label: 'Experts',     icon: 'star' },
  { key: 'subscribers',  label: 'Subscribers', icon: 'mail' },
];

const ROLE_COLOR = {
  student:    '#3B82F6',
  instructor: '#8B5CF6',
  expert:     '#10B981',
};

const BulkEmailScreen = () => {
  const navigation   = useNavigation();
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const c = theme.colors;

  const [activeTab,   setActiveTab]   = useState('all');
  const [allUsers,    setAllUsers]    = useState([]);
  const [selected,    setSelected]    = useState(new Set());
  const [search,      setSearch]      = useState('');
  const [subject,        setSubject]        = useState('');
  const [message,        setMessage]        = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [sending,        setSending]        = useState(false);
  const [sentResult,     setSentResult]     = useState(null);
  const [togglingId,     setTogglingId]     = useState(null);

  const sidebarItems = getSidebarItems(user?.role);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [recipientsRes, subscribersRes] = await Promise.all([
          bulkEmailAPI.getRecipients(),
          newsletterAPI.getSubscribers(),
        ]);
        const subscribedEmails = new Set(
          (subscribersRes.subscribers || []).map(s => s.email.toLowerCase())
        );
        const combined = [
          ...(recipientsRes.students    || []),
          ...(recipientsRes.instructors || []),
          ...(recipientsRes.experts     || []),
        ].map(u => ({ ...u, isNewsletterSubscriber: subscribedEmails.has(u.email?.toLowerCase()) }));
        setAllUsers(combined);
      } catch (e) {
        Toast.show({ type: 'error', text1: 'Failed to load users' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visibleUsers = allUsers.filter(u => {
    const matchesTab = activeTab === 'all'
      ? true
      : activeTab === 'subscribers'
      ? u.isNewsletterSubscriber
      : u.role === activeTab;
    const q = search.toLowerCase();
    const matchesSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const allVisibleSelected = visibleUsers.length > 0 && visibleUsers.every(u => selected.has(u.id));

  const toggleSelectAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleUsers.forEach(u => next.delete(u.id));
      } else {
        visibleUsers.forEach(u => next.add(u.id));
      }
      return next;
    });
  };

  const toggleUser = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleToggleSubscriber = async (u) => {
    setTogglingId(u.id);
    try {
      if (u.isNewsletterSubscriber) {
        await newsletterAPI.unsubscribe(u.id);
      } else {
        await newsletterAPI.subscribe(u.id);
      }
      setAllUsers(prev => prev.map(x =>
        x.id === u.id ? { ...x, isNewsletterSubscriber: !x.isNewsletterSubscriber } : x
      ));
      Toast.show({
        type: 'success',
        text1: u.isNewsletterSubscriber ? `${u.name} unsubscribed` : `${u.name} subscribed`,
      });
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message || 'Failed to update subscriber' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleSend = async () => {
    if (!selected.size) {
      Toast.show({ type: 'error', text1: 'No recipients selected' });
      return;
    }
    if (!subject.trim()) {
      Toast.show({ type: 'error', text1: 'Subject is required' });
      return;
    }
    if (!message.trim()) {
      Toast.show({ type: 'error', text1: 'Message is required' });
      return;
    }

    setSending(true);
    setSentResult(null);
    try {
      const res = await bulkEmailAPI.send({
        userIds: Array.from(selected),
        subject: subject.trim(),
        message: message.trim(),
        isAnnouncement,
      });
      setSentResult(res);
      Toast.show({ type: 'success', text1: res.message });
      setSelected(new Set());
      setSubject('');
      setMessage('');
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message || 'Failed to send emails' });
    } finally {
      setSending(false);
    }
  };

  const cardBg     = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const isWide     = width >= 900;

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      activeRoute="BulkEmail"
      onNavigate={r => navigation.navigate(r)}
      userInfo={{ name: user?.name, role: user?.role, avatar: user?.avatar }}
      onLogout={logout}
      onSettings={() => navigation.navigate('Settings')}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: c.background }}
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View style={[styles.pageHeader, { backgroundColor: NAVY }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={[styles.headerIconCircle, { backgroundColor: ORANGE + '25' }]}>
            <Icon name="mail" size={22} color={ORANGE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Send Email</Text>
            <Text style={styles.pageSub}>Broadcast a message to your users</Text>
          </View>
          {selected.size > 0 && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>{selected.size} selected</Text>
            </View>
          )}
        </View>

        <View style={[styles.row, isWide && { flexDirection: 'row', gap: 20, alignItems: 'flex-start' }]}>

          {/* ── Left: Recipients ── */}
          <View style={[styles.panel, { backgroundColor: cardBg, borderColor: cardBorder }, isWide && { flex: 1 }]}>
            <Text style={[styles.panelTitle, { color: c.textPrimary }]}>
              Recipients
              {allUsers.length > 0 && (
                <Text style={[styles.panelCount, { color: c.textTertiary }]}> ({allUsers.length} total)</Text>
              )}
            </Text>

            {/* Role tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={styles.tabs}>
                {TABS.map(tab => {
                  const count = tab.key === 'all'
                    ? allUsers.length
                    : tab.key === 'subscribers'
                    ? allUsers.filter(u => u.isNewsletterSubscriber).length
                    : allUsers.filter(u => u.role === tab.key).length;
                  const active = activeTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.tab, active && { backgroundColor: ORANGE }]}
                      onPress={() => setActiveTab(tab.key)}
                    >
                      <Icon name={tab.icon} size={13} color={active ? '#fff' : c.textSecondary} />
                      <Text style={[styles.tabLabel, { color: active ? '#fff' : c.textSecondary }]}>
                        {tab.label}
                      </Text>
                      <View style={[styles.tabCount, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)') }]}>
                        <Text style={[styles.tabCountText, { color: active ? '#fff' : c.textTertiary }]}>{count}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Search */}
            <View style={[styles.searchBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f4f5f7', borderColor: cardBorder }]}>
              <Icon name="search-outline" size={16} color={c.textTertiary} />
              <TextInput
                style={[styles.searchInput, { color: c.textPrimary }]}
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name or email…"
                placeholderTextColor={c.textTertiary}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Icon name="close-circle" size={16} color={c.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Select all row */}
            {visibleUsers.length > 0 && (
              <TouchableOpacity style={styles.selectAllRow} onPress={toggleSelectAll}>
                <View style={[styles.checkbox, { borderColor: allVisibleSelected ? ORANGE : cardBorder, backgroundColor: allVisibleSelected ? ORANGE : 'transparent' }]}>
                  {allVisibleSelected && <Icon name="checkmark" size={12} color="#fff" />}
                </View>
                <Text style={[styles.selectAllText, { color: c.textSecondary }]}>
                  {allVisibleSelected ? 'Deselect all' : `Select all ${visibleUsers.length}`}
                </Text>
              </TouchableOpacity>
            )}

            {/* User list */}
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={ORANGE} />
              </View>
            ) : visibleUsers.length === 0 ? (
              <View style={styles.emptyBox}>
                <Icon name="people-outline" size={32} color={c.textTertiary} />
                <Text style={[styles.emptyText, { color: c.textTertiary }]}>No users found</Text>
              </View>
            ) : (
              visibleUsers.map(u => {
                const isSelected = selected.has(u.id);
                return (
                  <TouchableOpacity
                    key={u.id}
                    style={[
                      styles.userRow,
                      { borderBottomColor: cardBorder },
                      isSelected && { backgroundColor: isDark ? 'rgba(255,140,66,0.08)' : '#fff8f3' },
                    ]}
                    onPress={() => toggleUser(u.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, { borderColor: isSelected ? ORANGE : cardBorder, backgroundColor: isSelected ? ORANGE : 'transparent' }]}>
                      {isSelected && <Icon name="checkmark" size={12} color="#fff" />}
                    </View>
                    <UserAvatar user={{ name: u.name, profilePicture: u.profilePicture }} size={34} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.userName, { color: c.textPrimary }]} numberOfLines={1}>{u.name}</Text>
                      <Text style={[styles.userEmail, { color: c.textSecondary }]} numberOfLines={1}>{u.email}</Text>
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: (ROLE_COLOR[u.role] || '#6B7280') + '18' }]}>
                      <Text style={[styles.roleBadgeText, { color: ROLE_COLOR[u.role] || '#6B7280' }]}>
                        {u.role}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleToggleSubscriber(u)}
                      disabled={togglingId === u.id}
                      style={[
                        styles.subBtn,
                        { backgroundColor: u.isNewsletterSubscriber ? ORANGE + '20' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)') },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Icon
                        name={u.isNewsletterSubscriber ? 'mail' : 'mail-outline'}
                        size={15}
                        color={u.isNewsletterSubscriber ? ORANGE : c.textTertiary}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* ── Right: Compose ── */}
          <View style={[styles.panel, { backgroundColor: cardBg, borderColor: cardBorder }, isWide && { flex: 1 }]}>
            <Text style={[styles.panelTitle, { color: c.textPrimary }]}>Compose</Text>

            {/* Subject */}
            <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Subject</Text>
            <TextInput
              style={[styles.fieldInput, { color: c.textPrimary, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f4f5f7', borderColor: cardBorder }]}
              value={subject}
              onChangeText={setSubject}
              placeholder="Email subject…"
              placeholderTextColor={c.textTertiary}
              maxLength={150}
            />
            <Text style={[styles.charHint, { color: c.textTertiary }]}>{subject.length}/150</Text>

            {/* Message */}
            <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Message</Text>
            <TextInput
              style={[styles.fieldTextarea, { color: c.textPrimary, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f4f5f7', borderColor: cardBorder }]}
              value={message}
              onChangeText={setMessage}
              placeholder="Write your message here…"
              placeholderTextColor={c.textTertiary}
              multiline
              numberOfLines={10}
              maxLength={2000}
              textAlignVertical="top"
            />
            <Text style={[styles.charHint, { color: c.textTertiary }]}>{message.length}/2000</Text>

            {/* Announcement toggle */}
            <TouchableOpacity
              style={[
                styles.announcementRow,
                {
                  backgroundColor: isAnnouncement
                    ? (isDark ? 'rgba(99,102,241,0.12)' : '#eef2ff')
                    : (isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'),
                  borderColor: isAnnouncement ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                },
              ]}
              onPress={() => setIsAnnouncement(prev => !prev)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.checkbox,
                {
                  borderColor: isAnnouncement ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                  backgroundColor: isAnnouncement ? '#6366f1' : 'transparent',
                },
              ]}>
                {isAnnouncement && <Icon name="checkmark" size={12} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.announcementLabel, { color: isAnnouncement ? '#6366f1' : c.textPrimary }]}>
                  Post as Announcement
                </Text>
                <Text style={[styles.announcementSub, { color: c.textSecondary }]}>
                  Also appears in recipients' Notifications tab inside the app
                </Text>
              </View>
              <Icon name="notifications-outline" size={18} color={isAnnouncement ? '#6366f1' : c.textTertiary} />
            </TouchableOpacity>

            {/* Result banner */}
            {sentResult && (
              <View style={[styles.resultBanner, { backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#d1fae5' }]}>
                <Icon name="checkmark-circle" size={18} color="#10B981" />
                <Text style={[styles.resultText, { color: isDark ? '#6ee7b7' : '#065f46' }]}>
                  {sentResult.message}
                  {sentResult.results?.failed > 0 && ` (${sentResult.results.failed} failed)`}
                </Text>
              </View>
            )}

            {/* Send button */}
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: selected.size && subject.trim() && message.trim() ? ORANGE : (isDark ? '#333' : '#e0e0e0') }]}
              onPress={handleSend}
              disabled={sending || !selected.size || !subject.trim() || !message.trim()}
              activeOpacity={0.85}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Icon name="send" size={18} color={selected.size && subject.trim() && message.trim() ? '#fff' : (isDark ? '#555' : '#aaa')} />
                  <Text style={[styles.sendBtnText, { color: selected.size && subject.trim() && message.trim() ? '#fff' : (isDark ? '#555' : '#aaa') }]}>
                    {selected.size ? `Send to ${selected.size} recipient${selected.size > 1 ? 's' : ''}` : 'Select recipients first'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Tips */}
            <View style={[styles.tipBox, { backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : '#eef2ff', borderColor: '#c7d2fe' }]}>
              <Icon name="bulb-outline" size={15} color="#6366f1" style={{ marginTop: 1 }} />
              <Text style={[styles.tipText, { color: isDark ? '#a5b4fc' : '#4338ca' }]}>
                Sending emails to your users regularly helps build your domain reputation and keeps emails out of spam.
              </Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  pageTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  pageSub:   { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  selectedBadge: {
    backgroundColor: ORANGE,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
  },
  selectedBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  row: { gap: 20 },
  panel: {
    borderRadius: 16, borderWidth: 1,
    padding: 16, marginBottom: 20,
  },
  panelTitle: { fontSize: 15, fontWeight: '800', marginBottom: 14 },
  panelCount: { fontSize: 13, fontWeight: '500' },

  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  tabLabel: { fontSize: 13, fontWeight: '600' },
  tabCount: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tabCountText: { fontSize: 11, fontWeight: '700' },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1, marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 13 },

  selectAllRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, marginBottom: 4,
  },
  selectAllText: { fontSize: 13, fontWeight: '600' },

  checkbox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },

  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  userName:  { fontSize: 13, fontWeight: '600' },
  userEmail: { fontSize: 11, marginTop: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexShrink: 0 },
  roleBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  subBtn: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },

  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  emptyBox:   { paddingVertical: 40, alignItems: 'center', gap: 8 },
  emptyText:  { fontSize: 13 },

  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  fieldInput: {
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14,
  },
  fieldTextarea: {
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, minHeight: 180,
  },
  charHint: { fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 10 },

  announcementRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 14,
  },
  announcementLabel: { fontSize: 13, fontWeight: '700' },
  announcementSub:   { fontSize: 11, marginTop: 2 },

  resultBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, marginBottom: 12,
  },
  resultText: { flex: 1, fontSize: 13, fontWeight: '500' },

  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, marginBottom: 14,
  },
  sendBtnText: { fontSize: 15, fontWeight: '700' },

  tipBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  tipText: { flex: 1, fontSize: 12, lineHeight: 17 },
});

export default BulkEmailScreen;
