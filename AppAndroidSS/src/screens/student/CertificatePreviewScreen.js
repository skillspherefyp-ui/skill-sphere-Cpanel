import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, useWindowDimensions, Platform, Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MainLayout from '../../components/ui/MainLayout';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { certificateAPI, certificateTemplateAPI } from '../../services/apiClient';
import CertificateCard from '../../components/CertificateCard';
import { getSidebarItems } from '../../utils/sidebarItems';

// ── Certificate Card — now in src/components/CertificateCard.js ─────────────
const __CERT_CARD_STUB_DELETE_ME__ = ({ template, certificate, studentName, courseName, cardWidth }) => {
  const primary   = template?.primaryColor   || '#4F46E5';
  const secondary = template?.secondaryColor || '#22D3EE';
  const titleText    = template?.titleText    || 'Certificate of Completion';
  const subtitleText = template?.subtitleText || 'This is to certify that';
  const footerText   = template?.footerText   || 'This certificate is awarded upon successful completion of the course requirements.';
  const isPending    = !certificate;

  const [logoFailed, setLogoFailed] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const hasSignature = !!template?.hasSignature;
  const logoUri = resolveFileUrl('/assets/skillsphere-logo.png');

  // Generate QR code on web — real cert number if paid, dummy if preview
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    const generate = async () => {
      try {
        const QRCode = require('qrcode');
        const content = certificate?.certificateNumber || 'SKILLSPHERE-PREVIEW';
        const dataUrl = await QRCode.toDataURL(content, {
          width: 200, margin: 1,
          errorCorrectionLevel: 'H',
          color: { dark: '#000000', light: '#FFFFFF' },
        });
        if (!cancelled) setQrDataUrl(dataUrl);
      } catch (e) {
        console.warn('QR generation failed:', e.message);
      }
    };
    generate();
    return () => { cancelled = true; };
  }, [certificate?.certificateNumber]);

  // Check if the solid backgroundColor is dark
  const solidBgIsDark = (() => {
    const bg = template?.backgroundColor;
    if (!bg) return false;
    const hex = bg.replace('#', '');
    if (hex.length < 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  })();

  const isDarkSurface = solidBgIsDark;

  const titleColor   = isDarkSurface ? '#FFFFFF'  : primary;
  const nameColor    = primary;
  const brandColor   = primary;
  const bodyColor    = isDarkSurface ? '#D0D0D0'  : '#666666';
  const courseColor  = primary;
  const detailColor  = isDarkSurface ? '#BBBBBB'  : '#888888';
  const footerColor  = isDarkSurface ? '#AAAAAA'  : '#999999';
  const sigLineColor = isDarkSurface ? '#FFFFFF'  : '#333333';
  const borderColor  = primary;
  const innerBorderColor = secondary;
  const bgColor      = template?.backgroundColor || '#ffffff';

  // Landscape A4 ratio 297:210 ≈ 1.414
  const cardHeight = Math.round(cardWidth / 1.414);

  const issueDate = certificate
    ? new Date(certificate.issuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const certNumber = certificate?.certificateNumber || null;
  const grade      = certificate?.grade || 'Pass';

  // Scale factor so fonts adapt to card width
  const s = cardWidth / 620;

  const content = (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Borders */}
      <View style={[cc.outerBorder, { borderColor, top: 10 * s, left: 10 * s, right: 10 * s, bottom: 10 * s }]} />
      <View style={[cc.outerBorder, { borderColor: innerBorderColor, borderWidth: 0.7, top: 16 * s, left: 16 * s, right: 16 * s, bottom: 16 * s }]} />

      {/* Watermark */}
      <Text style={[cc.watermark, { color: isDarkSurface ? 'rgba(255,255,255,0.04)' : 'rgba(79,70,229,0.04)', fontSize: 48 * s }]}>
        SKILLSPHERE
      </Text>

      {/* ── Header: Logo + Brand + horizontal rule ── */}
      <View style={[cc.header, { paddingHorizontal: 22 * s, paddingTop: 18 * s, paddingBottom: 7 * s }]}>
        {!logoFailed ? (
          <Image
            source={{ uri: logoUri }}
            style={{ width: 34 * s, height: 34 * s, borderRadius: 6 * s, marginRight: 8 * s }}
            resizeMode="contain"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <View style={{
            width: 34 * s, height: 34 * s, borderRadius: 6 * s, marginRight: 8 * s,
            backgroundColor: primary, justifyContent: 'center', alignItems: 'center',
          }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 9 * s, letterSpacing: 0.5 }}>SS</Text>
          </View>
        )}
        <View style={{ marginRight: 12 * s }}>
          <Text style={[cc.brandName, { color: brandColor, fontSize: 8 * s, letterSpacing: 2 }]}>SKILLSPHERE</Text>
          <Text style={{ color: detailColor, fontSize: 5.5 * s, letterSpacing: 0.5, marginTop: 1 }}>Certificate of Achievement</Text>
        </View>
        <View style={{ flex: 1, height: 0.8, backgroundColor: innerBorderColor }} />
      </View>

      {/* Accent bar */}
      <View style={{ height: 2.5 * s, backgroundColor: primary, marginHorizontal: 22 * s, borderRadius: 2 }} />

      {/* ── Centered body ── */}
      <View style={[cc.content, { paddingHorizontal: 32 * s, paddingTop: 6 * s, paddingBottom: 78 * s }]}>

        {/* Title */}
        <Text style={[cc.certTitle, { color: titleColor, fontSize: 13 * s, letterSpacing: 3 }]}>
          {titleText.toUpperCase()}
        </Text>

        {/* Diamond divider */}
        <View style={[cc.dividerRow, { width: 150 * s, marginBottom: 7 * s }]}>
          <View style={{ flex: 1, height: 0.7, backgroundColor: secondary }} />
          <View style={{ width: 5 * s, height: 5 * s, backgroundColor: secondary, transform: [{ rotate: '45deg' }], marginHorizontal: 5 * s }} />
          <View style={{ flex: 1, height: 0.7, backgroundColor: secondary }} />
        </View>

        {/* Subtitle */}
        <Text style={[cc.subtitle, { color: bodyColor, fontSize: 7.5 * s }]}>{subtitleText}</Text>

        {/* Student name */}
        <Text style={[cc.studentName, { color: nameColor, fontSize: 20 * s, fontFamily: Platform.OS === 'web' ? 'Dancing Script' : undefined }]}>
          {studentName}
        </Text>

        {/* Name underline */}
        <View style={{ width: 70 * s, height: 1.5 * s, backgroundColor: secondary, borderRadius: 1, marginBottom: 7 * s }} />

        {/* Completion text */}
        <Text style={[cc.completionText, { color: bodyColor, fontSize: 7.5 * s }]}>
          has successfully completed the course
        </Text>

        {/* Course name */}
        <Text style={[cc.courseName, { color: courseColor, fontSize: 10 * s }]} numberOfLines={2}>
          {courseName}
        </Text>
      </View>

      {/* ── Footer bar: QR | date+ID | signature ── */}
      <View style={[cc.footerBar, { bottom: 16 * s, left: 22 * s, right: 22 * s, borderTopColor: innerBorderColor, paddingTop: 5 * s }]}>

        {/* QR code — real if paid, dummy if preview */}
        <View style={[cc.qrBox, { marginRight: 10 * s }]}>
          {qrDataUrl ? (
            <View style={{ position: 'relative', width: 42 * s, height: 42 * s }}>
              {/* QR image with rounded container */}
              <View style={{
                width: 42 * s, height: 42 * s,
                borderRadius: 5 * s,
                overflow: 'hidden',
                borderWidth: 1.5,
                borderColor: isPending ? 'rgba(128,128,128,0.3)' : secondary,
                backgroundColor: '#FFFFFF',
              }}>
                <Image
                  source={{ uri: qrDataUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>
              {/* Center SS badge */}
              <View style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: 11 * s, height: 11 * s,
                marginTop: -5.5 * s, marginLeft: -5.5 * s,
                borderRadius: 2 * s,
                backgroundColor: primary,
                justifyContent: 'center', alignItems: 'center',
              }}>
                <Text style={{ color: '#fff', fontSize: 4.5 * s, fontWeight: '800' }}>SS</Text>
              </View>
              {/* Lock overlay for preview (not paid) */}
              {isPending && (
                <View style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(255,255,255,0.65)',
                  borderRadius: 5 * s,
                  justifyContent: 'center', alignItems: 'center',
                }}>
                  <Icon name="lock-closed" size={10 * s} color="#666" />
                </View>
              )}
            </View>
          ) : (
            <View style={{
              width: 42 * s, height: 42 * s, borderRadius: 5 * s,
              borderWidth: 1, borderColor: innerBorderColor,
              justifyContent: 'center', alignItems: 'center',
              backgroundColor: isDarkSurface ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            }}>
              <Icon name="qr-code-outline" size={22 * s} color={isDarkSurface ? '#FFFFFF' : '#1A1A2E'} />
            </View>
          )}
          <Text style={{ color: footerColor, fontSize: 4.5 * s, marginTop: 2 * s }}>
            {isPending ? 'Preview only' : 'Scan to verify'}
          </Text>
        </View>

        {/* Center: footer tagline + date + cert ID */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[cc.footerText, { color: footerColor, fontSize: 5 * s, fontStyle: 'italic', marginBottom: 2 * s }]} numberOfLines={2}>{footerText}</Text>
          <Text style={[cc.footerText, { color: footerColor, fontSize: 6 * s }]}>Issued on: {issueDate}</Text>
          {certNumber ? (
            <Text style={[cc.footerText, { color: footerColor, fontSize: 6 * s }]} numberOfLines={1}>
              Certificate ID: {certNumber}
            </Text>
          ) : (
            <Text style={[cc.footerText, { color: '#f59e0b', fontSize: 6 * s }]}>Status: Preview</Text>
          )}
        </View>

        {/* Signature — right */}
        <View style={[cc.sigBlock, { minWidth: 80 * s }]}>
          {hasSignature ? (
            <View style={{ width: 80 * s, height: 30 * s, marginBottom: 2 * s, justifyContent: 'flex-end', alignItems: 'center' }}>
              <Text style={{
                fontSize: 15 * s,
                color: isDarkSurface ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.55)',
                fontStyle: 'italic',
                fontFamily: Platform.OS === 'web' ? 'cursive' : undefined,
                letterSpacing: 1,
                marginBottom: 1,
              }}>
                {'~ ~ ~'}
              </Text>
            </View>
          ) : (
            <View style={{ height: 30 * s }} />
          )}
          <View style={[cc.sigLine, { borderTopColor: sigLineColor, borderTopWidth: 0.7, width: 70 * s, paddingTop: 2 * s }]}>
            <Text style={[cc.sigName, { color: bodyColor, fontSize: 6.5 * s }]}>Instructor</Text>
            <Text style={[cc.sigTitle, { color: detailColor, fontSize: 5.5 * s }]}>SkillSphere</Text>
          </View>
        </View>
      </View>

      {/* PREVIEW diagonal stamp */}
      {isPending && (
        <View style={cc.previewStamp} pointerEvents="none">
          <Text style={[cc.previewStampText, { fontSize: 28 * s }]}>PREVIEW</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[cc.cardOuter, { borderColor, width: cardWidth, height: cardHeight,
      shadowColor: primary, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 }]}>
      {content}
    </View>
  );
};

// ── Main Screen ──────────────────────────────────────────────────────────────
const CertificatePreviewScreen = () => {
  const navigation = useNavigation();
  const route      = useRoute();
  const { theme, isDark } = useTheme();
  const { user, logout }  = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const { courseId, courseName } = route.params || {};

  const [certificate,   setCertificate]   = useState(null);
  const [template,      setTemplate]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [signatureUri,  setSignatureUri]  = useState(null);
  const [copied,        setCopied]        = useState(false);

  const handleShareLinkedIn = () => {
    if (!certificate) return;
    const certDate = new Date(certificate.issuedDate);
    const year  = certDate.getFullYear();
    const month = certDate.getMonth() + 1;
    const certUrl = `https://skillsphere.com.pk/verify/${certificate.certificateNumber}`;
    const query = [
      'startTask=CERTIFICATION_NAME',
      `name=${encodeURIComponent(courseName || certificate.courseName || 'Course')}`,
      'organizationName=SkillSphere',
      `issueYear=${year}`,
      `issueMonth=${month}`,
      `certUrl=${encodeURIComponent(certUrl)}`,
      `certId=${encodeURIComponent(certificate.certificateNumber)}`,
    ].join('&');
    const url = `https://www.linkedin.com/profile/add?${query}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const handleCopyLink = async () => {
    if (!certificate) return;
    const link = `https://skillsphere.com.pk/verify/${certificate.certificateNumber}`;
    try {
      if (Platform.OS === 'web' && navigator?.clipboard) {
        await navigator.clipboard.writeText(link);
      } else {
        const Clipboard = require('@react-native-clipboard/clipboard').default;
        Clipboard.setString(link);
      }
    } catch (_) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Card width: screen width minus padding, capped at 700
  const cardWidth = Math.min(windowWidth - 40, 700);

  useFocusEffect(useCallback(() => { loadData(); }, [courseId]));

  const loadData = async () => {
    setLoading(true);
    try {
      const [certRes, tplRes] = await Promise.allSettled([
        certificateAPI.getMyCertificates(),
        certificateTemplateAPI.getForCourse(courseId),
      ]);

      let existingCert = null;
      if (certRes.status === 'fulfilled' && certRes.value?.success) {
        existingCert = certRes.value.certificates.find(
          c => String(c.courseId) === String(courseId)
        ) || null;
        setCertificate(existingCert);
      }

      let resolvedTemplate = null;
      if (tplRes.status === 'fulfilled' && tplRes.value?.template) {
        resolvedTemplate = tplRes.value.template;
        console.log('[CertPreview] template:', JSON.stringify({
          id: resolvedTemplate.id, name: resolvedTemplate.name,
          hasSignature: resolvedTemplate.hasSignature,
          primaryColor: resolvedTemplate.primaryColor,
        }));
        setTemplate(resolvedTemplate);
      } else {
        try {
          const activeRes = await certificateTemplateAPI.getActive();
          if (activeRes?.template) {
            resolvedTemplate = activeRes.template;
            console.log('[CertPreview] fallback template:', JSON.stringify({
              id: resolvedTemplate.id, name: resolvedTemplate.name,
              hasSignature: resolvedTemplate.hasSignature,
            }));
            setTemplate(resolvedTemplate);
          }
        } catch (_) {}
      }

      // Fetch actual signature image when student has earned the certificate
      if (existingCert && resolvedTemplate?.id && resolvedTemplate?.hasSignature) {
        try {
          const sigRes = await certificateTemplateAPI.getSignatureImage(resolvedTemplate.id, courseId);
          if (sigRes?.signatureDataUri) setSignatureUri(sigRes.signatureDataUri);
        } catch (_) {}
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout showSidebar={true} sidebarItems={getSidebarItems(user?.role)} activeRoute="Certificates"
        onNavigate={r => navigation.navigate(r)}
        userInfo={{ name: user?.name, role: 'Student', avatar: user?.avatar }} onLogout={logout}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout showSidebar={true} sidebarItems={getSidebarItems(user?.role)} activeRoute="Certificates"
      onNavigate={r => navigation.navigate(r)}
      userInfo={{ name: user?.name, role: 'Student', avatar: user?.avatar }} onLogout={logout}>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.inner, { maxWidth: 740, alignSelf: 'center', width: '100%' }]}>

          {/* Page Header Banner */}
          <View style={[styles.pageHeaderBanner, {
            backgroundColor: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.05)',
            borderColor: 'rgba(16,185,129,0.15)',
          }]}>
            <View style={styles.bannerLeft}>
              <TouchableOpacity
                style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.06)' }]}
                onPress={() => navigation.navigate('Certificates')}
              >
                <Icon name="arrow-back" size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>
              <View style={[styles.bannerIconCircle, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                <Icon name="ribbon" size={22} color="#10B981" />
              </View>
              <View style={styles.bannerTextGroup}>
                <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>
                  {certificate ? 'Your Certificate' : 'Certificate Preview'}
                </Text>
                <Text style={[styles.pageSub, { color: theme.colors.textSecondary }]}>
                  {certificate
                    ? 'Issued and sent to your email'
                    : 'Preview — complete payment to receive your official certificate'}
                </Text>
              </View>
            </View>
          </View>

          {/* Certificate visual — full design with background + signature */}
          <View style={styles.cardWrapper}>
            <CertificateCard
              template={template}
              certificate={certificate}
              studentName={user?.name || 'Student'}
              courseName={courseName || 'Course'}
              cardWidth={cardWidth}
              signatureUri={signatureUri}
            />
          </View>

          {/* Template info */}
          {template && (
            <View style={[styles.templateRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderColor: theme.colors.border }]}>
              <View style={[styles.templateDot, { backgroundColor: template.primaryColor || '#4F46E5' }]} />
              <Text style={[styles.templateName, { color: theme.colors.textSecondary }]}>
                Template: <Text style={{ fontWeight: '600', color: theme.colors.textPrimary }}>{template.name || 'Default Template'}</Text>
              </Text>
              {template.backgroundImage && (
                <View style={styles.templateBadge}>
                  <Icon name="image-outline" size={12} color={theme.colors.textTertiary} />
                  <Text style={[styles.templateBadgeText, { color: theme.colors.textTertiary }]}>Custom BG</Text>
                </View>
              )}
              {template.hasSignature && (
                <View style={styles.templateBadge}>
                  <Icon name="create-outline" size={12} color={theme.colors.textTertiary} />
                  <Text style={[styles.templateBadgeText, { color: theme.colors.textTertiary }]}>Signed</Text>
                </View>
              )}
            </View>
          )}

          {/* Info note */}
          <View style={[styles.noteRow, { backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : '#eef2ff', borderColor: '#c7d2fe' }]}>
            <Icon name="information-circle-outline" size={18} color="#6366f1" />
            <Text style={[styles.noteText, { color: isDark ? '#a5b4fc' : '#4338ca' }]}>
              {certificate
                ? `The official PDF certificate has been sent to ${user?.email}.`
                : 'This preview uses your actual template design. Pay to receive the official signed PDF via email.'}
            </Text>
          </View>

          {certificate ? (
            <View style={styles.actionGroup}>
              <View style={[styles.successBanner, { backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#d1fae5' }]}>
                <Icon name="checkmark-circle" size={22} color="#10b981" />
                <Text style={[styles.successText, { color: isDark ? '#6ee7b7' : '#065f46' }]}>
                  Certificate issued &amp; emailed successfully
                </Text>
              </View>

              {/* Share buttons */}
              <View style={styles.shareRow}>
                <TouchableOpacity
                  style={styles.linkedinBtn}
                  onPress={handleShareLinkedIn}
                  activeOpacity={0.85}
                >
                  <Icon name="logo-linkedin" size={18} color="#fff" />
                  <Text style={styles.linkedinBtnText}>Add to LinkedIn</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.copyBtn, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                    borderColor: copied ? '#10B981' : theme.colors.border,
                  }]}
                  onPress={handleCopyLink}
                  activeOpacity={0.85}
                >
                  <Icon name={copied ? 'checkmark' : 'link-outline'} size={17} color={copied ? '#10B981' : theme.colors.textSecondary} />
                  <Text style={[styles.copyBtnText, { color: copied ? '#10B981' : theme.colors.textSecondary }]}>
                    {copied ? 'Copied!' : 'Copy Verify Link'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('Certificates')}
              >
                <Icon name="ribbon-outline" size={18} color={theme.colors.primary} />
                <Text style={[styles.outlineBtnText, { color: theme.colors.primary }]}>View All Certificates</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionGroup}>
              <View style={[styles.feeCard, {
                backgroundColor: isDark ? 'rgba(79,70,229,0.1)' : '#f0f0ff',
                borderColor: theme.colors.primary + '30',
              }]}>
                <MaterialIcon name="certificate-outline" size={30} color={theme.colors.primary} style={{ marginBottom: 8 }} />
                <Text style={[styles.feeLabel, { color: theme.colors.textSecondary }]}>Certificate Fee</Text>
                <Text style={[styles.feeAmount, { color: theme.colors.primary }]}>PKR 2,000</Text>
                <Text style={[styles.feeNote, { color: theme.colors.textTertiary }]}>
                  Official signed PDF delivered to your email
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.payBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('Payment', { courseId, courseName, amount: 2000 })}
                activeOpacity={0.85}
              >
                <MaterialIcon name="credit-card-outline" size={20} color="#fff" />
                <Text style={styles.payBtnText}>Proceed to Pay</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>
    </MainLayout>
  );
};

// ── Certificate Card Styles ──────────────────────────────────────────────────
const cc = StyleSheet.create({
  cardOuter: {
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
  },
  outerBorder: {
    position: 'absolute',
    borderWidth: 1.2,
    borderRadius: 5,
  },
  watermark: {
    position: 'absolute',
    top: '36%',
    alignSelf: 'center',
    fontWeight: '800',
    letterSpacing: 8,
    transform: [{ rotate: '-28deg' }],
    zIndex: 0,
  },
  // Header row
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  brandName: {
    fontWeight: '700',
    textAlign: 'left',
  },
  // Body
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  certTitle: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 7,
  },
  subtitle: {
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
  studentName: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 5,
  },
  completionText: {
    marginBottom: 4,
    textAlign: 'center',
  },
  courseName: {
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
    maxWidth: '80%',
  },
  // Footer bar
  footerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 0.7,
    zIndex: 1,
  },
  qrBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    textAlign: 'center',
    marginBottom: 1,
  },
  sigBlock: {
    alignItems: 'center',
  },
  sigLine: {
    alignItems: 'center',
  },
  sigName: {
    textAlign: 'center',
    fontWeight: '500',
  },
  sigTitle: {
    textAlign: 'center',
    marginTop: 1,
  },
  previewStamp: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  previewStampText: {
    fontWeight: '900',
    color: 'rgba(100,100,100,0.10)',
    letterSpacing: 12,
    transform: [{ rotate: '-35deg' }],
  },
});

// ── Screen Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 48 },
  inner: { gap: 16 },

  pageHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  bannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextGroup: { flex: 1 },
  pageTitle: { fontSize: 18, fontWeight: '700' },
  pageSub: { fontSize: 12, marginTop: 2 },

  cardWrapper: { alignItems: 'center' },

  templateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 10, borderWidth: 1,
    borderLeftWidth: 3, borderLeftColor: '#F5C842',
  },
  templateDot: { width: 10, height: 10, borderRadius: 5 },
  templateName: { fontSize: 12, flex: 1 },
  templateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  templateBadgeText: { fontSize: 10 },

  noteRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 17 },

  actionGroup: { gap: 12 },
  feeCard: {
    borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', gap: 4,
    borderTopWidth: 3, borderTopColor: '#F5C842', overflow: 'hidden',
  },
  feeLabel: { fontSize: 13 },
  feeAmount: { fontSize: 36, fontWeight: '800', marginVertical: 4 },
  feeNote: { fontSize: 12, textAlign: 'center', lineHeight: 18, maxWidth: 260 },

  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 14,
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 12,
  },
  successText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },

  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 2,
  },
  outlineBtnText: { fontSize: 15, fontWeight: '700' },

  shareRow: {
    flexDirection: 'row', gap: 10,
  },
  linkedinBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12,
    backgroundColor: '#0A66C2',
  },
  linkedinBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  copyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1.5,
  },
  copyBtnText: { fontSize: 14, fontWeight: '600' },
});

export default CertificatePreviewScreen;
