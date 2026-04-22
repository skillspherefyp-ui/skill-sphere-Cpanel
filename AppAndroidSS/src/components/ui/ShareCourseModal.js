import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Platform,
  StyleSheet, Share, Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const ORANGE  = '#FF8C42';
const NAVY    = '#1A1A2E';
const SITE_BASE = 'https://skillsphere.com.pk';

// ─── helpers ──────────────────────────────────────────────────────────────────
const buildShareUrl  = (course) => `${SITE_BASE}/explore/${course.id}`;
const buildShareText = (course) => {
  const desc = course.description
    ? (course.description.length > 120
        ? course.description.slice(0, 117) + '…'
        : course.description)
    : '';
  return `🎓 Check out this course on SkillSphere!\n\n📚 ${course.name}${desc ? `\n${desc}` : ''}\n\n🌐 ${buildShareUrl(course)}`;
};

const openUrl = (url) => {
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    const { Linking } = require('react-native');
    Linking.openURL(url).catch(() => {});
  }
};

const copyToClipboard = async (text, onDone) => {
  try {
    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(text);
    } else {
      const Clipboard = require('@react-native-clipboard/clipboard').default;
      Clipboard.setString(text);
    }
    onDone(true);
    setTimeout(() => onDone(false), 2000);
  } catch {
    onDone(false);
  }
};

// ─── social buttons config ───────────────────────────────────────────────────
const getSocials = (text, url) => [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    icon: 'logo-whatsapp',
    onPress: () => openUrl(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`),
  },
  {
    key: 'twitter',
    label: 'X (Twitter)',
    color: '#000000',
    icon: 'logo-twitter',
    onPress: () =>
      openUrl(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&via=Skill___Sphere`
      ),
  },
  {
    key: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    icon: 'logo-facebook',
    onPress: () =>
      openUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`),
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    color: '#0A66C2',
    icon: 'logo-linkedin',
    onPress: () =>
      openUrl(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
      ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
const ShareCourseModal = ({ visible, onClose, course, isDark }) => {
  const [copied, setCopied] = useState(false);

  if (!course) return null;

  const shareUrl  = buildShareUrl(course);
  const shareText = buildShareText(course);
  const socials   = getSocials(shareText, shareUrl);

  const handleNativeShare = async () => {
    try {
      await Share.share({ message: shareText, url: SITE });
    } catch {}
  };

  const bg      = isDark ? '#1E1E38' : '#FFFFFF';
  const overlay = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.5)';
  const textCol = isDark ? '#FFFFFF' : NAVY;
  const subCol  = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.5)';
  const divCol  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const linkBg  = isDark ? 'rgba(255,255,255,0.05)' : '#F8F9FB';
  const linkBdr = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  if (Platform.OS === 'web') {
    if (!visible) return null;
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: overlay,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: bg, borderRadius: 20, width: '100%', maxWidth: 420,
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${divCol}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: ORANGE + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: ORANGE, fontSize: 18 }}>↑</span>
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: textCol }}>Share Course</p>
                <p style={{ margin: 0, fontSize: 12, color: subCol, marginTop: 2 }}>Spread the knowledge</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <span style={{ fontSize: 22, color: subCol, lineHeight: 1 }}>✕</span>
            </button>
          </div>

          {/* Course name pill */}
          <div style={{ padding: '14px 20px 10px' }}>
            <div style={{ background: ORANGE + '15', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15 }}>📚</span>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: ORANGE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {course.name}
              </p>
            </div>
          </div>

          {/* Social buttons */}
          <div style={{ padding: '6px 20px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {socials.map(s => (
              <button
                key={s.key}
                onClick={s.onPress}
                style={{
                  background: s.color + '12', border: `1.5px solid ${s.color}30`,
                  borderRadius: 12, padding: '11px 10px',
                  display: 'flex', alignItems: 'center', gap: 9,
                  cursor: 'pointer', transition: 'opacity 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >
                <span style={{ fontSize: 20 }}>
                  {s.key === 'whatsapp' && '💬'}
                  {s.key === 'twitter'  && '𝕏'}
                  {s.key === 'facebook' && '📘'}
                  {s.key === 'linkedin' && '💼'}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: divCol, margin: '0 20px' }} />

          {/* Copy link */}
          <div style={{ padding: '14px 20px 20px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: 12, fontWeight: 700, color: subCol, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Or copy link</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: linkBg, border: `1px solid ${linkBdr}`, borderRadius: 10, padding: '9px 14px', overflow: 'hidden' }}>
                <p style={{ margin: 0, fontSize: 13, color: subCol, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</p>
              </div>
              <button
                onClick={() => copyToClipboard(shareUrl, setCopied)}
                style={{
                  background: copied ? '#10B981' : ORANGE,
                  border: 'none', borderRadius: 10, padding: '9px 16px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'background 0.2s',
                }}
              >
                <span style={{ fontSize: 14 }}>{copied ? '✓' : '📋'}</span>
                <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Native ────────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: bg }]} onPress={() => {}}>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: divCol }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIcon, { backgroundColor: ORANGE + '20' }]}>
                <Icon name="share-social-outline" size={18} color={ORANGE} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: textCol }]}>Share Course</Text>
                <Text style={[styles.headerSub, { color: subCol }]}>Spread the knowledge</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color={subCol} />
            </TouchableOpacity>
          </View>

          {/* Course pill */}
          <View style={styles.coursePill}>
            <View style={[styles.pillInner, { backgroundColor: ORANGE + '15' }]}>
              <Text style={{ fontSize: 16 }}>📚</Text>
              <Text style={[styles.pillText, { color: ORANGE }]} numberOfLines={1}>{course.name}</Text>
            </View>
          </View>

          {/* Native share button */}
          <TouchableOpacity style={[styles.nativeShareBtn, { backgroundColor: ORANGE }]} onPress={handleNativeShare}>
            <Icon name="share-outline" size={18} color="#FFFFFF" />
            <Text style={styles.nativeShareText}>Share via…</Text>
          </TouchableOpacity>

          {/* Social buttons */}
          <View style={styles.socialGrid}>
            {socials.map(s => (
              <TouchableOpacity
                key={s.key}
                style={[styles.socialBtn, { backgroundColor: s.color + '12', borderColor: s.color + '30' }]}
                onPress={s.onPress}
                activeOpacity={0.75}
              >
                <Icon name={s.icon} size={22} color={s.color} />
                <Text style={[styles.socialLabel, { color: s.color }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Copy link */}
          <View style={[styles.copyRow, { borderTopColor: divCol }]}>
            <View style={[styles.copyUrl, { backgroundColor: linkBg, borderColor: linkBdr }]}>
              <Text style={[styles.copyUrlText, { color: subCol }]} numberOfLines={1}>{shareUrl}</Text>
            </View>
            <TouchableOpacity
              style={[styles.copyBtn, { backgroundColor: copied ? '#10B981' : ORANGE }]}
              onPress={() => copyToClipboard(shareUrl, setCopied)}
            >
              <Icon name={copied ? 'checkmark' : 'copy-outline'} size={16} color="#FFFFFF" />
              <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay:       { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  sheet:         { width: '100%', maxWidth: 420, borderRadius: 20, overflow: 'hidden' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1 },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon:    { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerTitle:   { fontWeight: '800', fontSize: 15 },
  headerSub:     { fontSize: 12, marginTop: 2 },
  closeBtn:      { padding: 4 },
  coursePill:    { padding: 14, paddingBottom: 10 },
  pillInner:     { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  pillText:      { fontSize: 13, fontWeight: '700', flex: 1 },
  nativeShareBtn:{ marginHorizontal: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 12 },
  nativeShareText:{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  socialGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 14, paddingTop: 4 },
  socialBtn:     { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 12, borderWidth: 1.5, paddingVertical: 11, paddingHorizontal: 10 },
  socialLabel:   { fontSize: 13, fontWeight: '700' },
  copyRow:       { flexDirection: 'row', gap: 8, padding: 14, borderTopWidth: 1 },
  copyUrl:       { flex: 1, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 },
  copyUrlText:   { fontSize: 13 },
  copyBtn:       { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  copyBtnText:   { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});

export default ShareCourseModal;
