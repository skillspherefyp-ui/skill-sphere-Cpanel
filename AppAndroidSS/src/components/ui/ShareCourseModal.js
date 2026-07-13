import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Platform,
  StyleSheet, Share, Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { slugify } from '../../utils/urlHelpers';

// ─── UI SVG icons ────────────────────────────────────────────────────────────
const ICON_SHARE = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#FF8C42" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>`;
const ICON_BOOK  = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#FF8C42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
const ICON_COPY  = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const ICON_CHECK = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

// ─── Official brand SVG logos ────────────────────────────────────────────────
const SVG_LOGOS = {
  whatsapp: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#25D366"><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.12 1.534 5.847L.036 24l6.302-1.654A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm6.21 16.924c-.262.737-1.53 1.41-2.1 1.5-.569.087-1.283.123-2.069-.13a19.137 19.137 0 01-1.875-.693C9.23 16.359 7.26 13.9 7.103 13.696c-.158-.204-1.286-1.713-1.286-3.267 0-1.554.812-2.319 1.1-2.636a1.16 1.16 0 01.842-.394c.21 0 .42.004.604.012.194.009.454-.073.71.541.263.63.893 2.177.97 2.337.079.16.132.347.027.557-.106.21-.16.34-.316.524-.157.184-.33.41-.472.55-.156.157-.32.327-.138.642.183.316.812 1.34 1.743 2.17 1.198 1.068 2.208 1.399 2.524 1.557.316.157.5.132.685-.08.184-.21.79-.92 1-.236.21-.316.42-.263.71-.158.29.106 1.84.868 2.156 1.026.316.158.526.237.605.368.079.131.079.762-.184 1.499z"/></svg>`,
  twitter:  `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
};

const ORANGE  = '#FF8C42';
const NAVY    = '#1A1A2E';
const SITE_BASE = 'https://skillsphere.com.pk';

const buildShareUrl  = (course) =>
  `${SITE_BASE}/explore/${course.id}/${slugify(course.name)}`;
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
    // Use ReactDOM.createPortal so the overlay is mounted directly on document.body.
    // This bypasses any ancestor element with CSS transform (used by RN animations),
    // which would otherwise break position:fixed and push the modal off-screen on scroll.
    const { createPortal } = require('react-dom');

    const modalContent = (
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
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
          <div style={{ padding: '18px 20px 16px', borderBottom: `1px solid ${divCol}`, background: isDark ? 'rgba(255,140,66,0.06)' : 'rgba(255,140,66,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: `linear-gradient(135deg, ${ORANGE}22 0%, ${ORANGE}10 100%)`,
                  border: `1.5px solid ${ORANGE}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ width: 22, height: 22, display: 'flex' }} dangerouslySetInnerHTML={{ __html: ICON_SHARE }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: textCol, letterSpacing: '-0.2px' }}>Share Course</p>
                  <p style={{ margin: 0, fontSize: 12, color: subCol, marginTop: 3, fontWeight: 500 }}>Spread the knowledge</p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 2, transition: 'background 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)'}
                onMouseOut={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={subCol} strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Course name pill — inside header */}
            <div style={{
              marginTop: 14,
              background: isDark ? 'rgba(255,255,255,0.05)' : NAVY + '08',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : NAVY + '14'}`,
              borderRadius: 10, padding: '9px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ width: 18, height: 18, display: 'flex', flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: ICON_BOOK }} />
              <p style={{
                margin: 0, fontSize: 13, fontWeight: 700,
                color: textCol,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
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
                <span
                  style={{ width: 22, height: 22, display: 'flex', flexShrink: 0 }}
                  dangerouslySetInnerHTML={{ __html: SVG_LOGOS[s.key] }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: divCol, margin: '0 20px' }} />

          {/* Copy link */}
          <div style={{ padding: '14px 20px 20px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: 11, fontWeight: 700, color: subCol, textTransform: 'uppercase', letterSpacing: '1px' }}>Or copy link</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
              <div style={{
                flex: 1, background: linkBg, border: `1px solid ${linkBdr}`,
                borderRadius: 10, padding: '10px 14px', overflow: 'hidden',
                display: 'flex', alignItems: 'center',
              }}>
                <p style={{ margin: 0, fontSize: 12, color: subCol, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{shareUrl}</p>
              </div>
              <button
                onClick={() => copyToClipboard(shareUrl, setCopied)}
                style={{
                  background: copied ? '#10B981' : ORANGE,
                  border: 'none', borderRadius: 10, padding: '10px 16px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                  transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <span style={{ width: 15, height: 15, display: 'flex', flexShrink: 0 }}
                  dangerouslySetInnerHTML={{ __html: copied ? ICON_CHECK : ICON_COPY }}
                />
                <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    return createPortal(modalContent, document.body);
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
