import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { resolveFileUrl } from '../utils/urlHelpers';

/**
 * Draw a rounded rect on a canvas context.
 */
const canvasRoundRect = (ctx, x, y, w, h, r) => {
  const cr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + cr, y);
  ctx.lineTo(x + w - cr, y);
  ctx.arcTo(x + w, y, x + w, y + cr, cr);
  ctx.lineTo(x + w, y + h - cr);
  ctx.arcTo(x + w, y + h, x + w - cr, y + h, cr);
  ctx.lineTo(x + cr, y + h);
  ctx.arcTo(x, y + h, x, y + h - cr, cr);
  ctx.lineTo(x, y + cr);
  ctx.arcTo(x, y, x + cr, y, cr);
  ctx.closePath();
};

/**
 * Generate a styled QR as a PNG data URL using the Canvas 2D API directly.
 * Bypasses SVG-as-image so ctx.fillText() always renders the SS badge text.
 */
const buildStyledQR = (content, { bgIsDark = false, bgColor = '#ffffff', accentColor = '#4F46E5' } = {}) => {
  try {
    const QRCode = require('qrcode');
    const qr = QRCode.create(content, { errorCorrectionLevel: 'H' });
    const N  = qr.modules.size;
    const D  = qr.modules.data;
    const S  = 400;
    const m  = S / N;

    const dark   = bgIsDark ? '#FFFFFF' : '#1A1A2E';
    const light  = bgIsDark ? bgColor   : '#FFFFFF';
    const accent = accentColor;

    const canvas = document.createElement('canvas');
    canvas.width  = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, S, S);

    const isFinder = (r, c) =>
      (r <= 7 && c <= 7) || (r <= 7 && c >= N - 8) || (r >= N - 8 && c <= 7);

    // Data modules — circular dots
    const pad = m * 0.1;
    const dw  = m - 2 * pad;
    ctx.fillStyle = dark;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!D[r * N + c] || isFinder(r, c)) continue;
        canvasRoundRect(ctx, c * m + pad, r * m + pad, dw, dw, dw * 0.5);
        ctx.fill();
      }
    }

    // Finder patterns: outer ring (accent) → inner clear → inner dot (accent)
    const drawFinder = (fc, fr) => {
      const ox = fc * m, oy = fr * m, p = m * 0.06;
      // Outer rounded square (7×7 modules)
      ctx.fillStyle = accent;
      canvasRoundRect(ctx, ox + p, oy + p, 7 * m - 2 * p, 7 * m - 2 * p, m * 1.4);
      ctx.fill();
      // Clear inner area (5×5)
      ctx.fillStyle = light;
      canvasRoundRect(ctx, ox + m + p, oy + m + p, 5 * m - 2 * p, 5 * m - 2 * p, m * 0.8);
      ctx.fill();
      // Inner dot (3×3)
      ctx.fillStyle = accent;
      const ds = 3 * m - 2 * p;
      canvasRoundRect(ctx, ox + 2 * m + p, oy + 2 * m + p, ds, ds, ds * 0.35);
      ctx.fill();
    };
    drawFinder(0, 0);
    drawFinder(N - 7, 0);
    drawFinder(0, N - 7);

    // SS badge at center — 22% of S wide (area ≈ 4.8%, well within H 30% budget)
    // Text is NOT drawn here; it's rendered as a native RN Text overlay for crisp display.
    const bs = Math.round(S * 0.22);
    const br = Math.round(bs * 0.18);
    const bx = (S - bs) / 2;
    const by = (S - bs) / 2;
    ctx.fillStyle = accent;
    canvasRoundRect(ctx, bx, by, bs, bs, br);
    ctx.fill();

    return canvas.toDataURL('image/png');
  } catch (e) {
    console.warn('buildStyledQR failed:', e.message);
    return null;
  }
};

const CertificateCard = ({ template, certificate, studentName, courseName, cardWidth, isInstructorPreview = false, signatureUri = null }) => {
  // Prefer live template from API (course-specific); fall back to frozen snapshot only if no live template available
  const activeTemplate = template || (certificate?.templateSnapshot) || null;
  const primary        = activeTemplate?.primaryColor   || '#4F46E5';
  const secondary      = activeTemplate?.secondaryColor || '#22D3EE';
  const titleText      = activeTemplate?.titleText    || 'Certificate of Completion';
  const subtitleText   = activeTemplate?.subtitleText || 'This is to certify that';
  const footerText     = activeTemplate?.footerText   || 'This certificate is awarded upon successful completion of the course requirements.';
  const isPending      = !certificate;

  const [logoFailed, setLogoFailed] = useState(false);
  const [qrDataUrl,  setQrDataUrl]  = useState(null);
  const hasSignature = !!template?.hasSignature;
  const logoUri      = resolveFileUrl('/api/certificate-templates/cert-logo');

  // Generate styled QR PNG on web (synchronous canvas draw)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const bg      = activeTemplate?.backgroundColor || '#ffffff';
    const hex     = bg.replace('#', '');
    const r       = parseInt(hex.substring(0, 2), 16) || 255;
    const g       = parseInt(hex.substring(2, 4), 16) || 255;
    const b       = parseInt(hex.substring(4, 6), 16) || 255;
    const bgIsDark = (r * 299 + g * 587 + b * 114) / 1000 < 128;
    const content  = certificate?.certificateNumber || 'SKILLSPHERE-PREVIEW';
    const url = buildStyledQR(content, {
      bgIsDark,
      bgColor: bg,
      accentColor: activeTemplate?.primaryColor || '#4F46E5',
    });
    if (url) setQrDataUrl(url);
  }, [certificate?.certificateNumber, activeTemplate?.backgroundColor, activeTemplate?.primaryColor]);

  // Dark surface detection
  const solidBgIsDark = (() => {
    const bg = activeTemplate?.backgroundColor;
    if (!bg) return false;
    const hex = bg.replace('#', '');
    if (hex.length < 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  })();

  const isDarkSurface    = solidBgIsDark;
  const titleColor       = isDarkSurface ? '#FFFFFF'  : primary;
  const nameColor        = primary;
  const brandColor       = primary;
  const bodyColor        = isDarkSurface ? '#D0D0D0'  : '#666666';
  const courseColor      = primary;
  const detailColor      = isDarkSurface ? '#BBBBBB'  : '#888888';
  const footerColor      = isDarkSurface ? '#AAAAAA'  : '#999999';
  const sigLineColor     = isDarkSurface ? '#FFFFFF'  : '#333333';
  const borderColor      = primary;
  const innerBorderColor = secondary;
  const bgColor          = activeTemplate?.backgroundColor || '#ffffff';
  const cardHeight       = Math.round(cardWidth / 1.414);

  const issueDate = certificate
    ? new Date(certificate.issuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const certNumber = certificate?.certificateNumber || null;
  const s = cardWidth / 620;

  const showLock = isPending || isInstructorPreview;

  return (
    <View style={[cc.cardOuter, {
      borderColor, width: cardWidth, height: cardHeight,
      shadowColor: primary, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
    }]}>
      <View style={{ flex: 1, backgroundColor: bgColor }}>
        {/* Borders */}
        <View style={[cc.outerBorder, { borderColor, top: 10 * s, left: 10 * s, right: 10 * s, bottom: 10 * s }]} />
        <View style={[cc.outerBorder, { borderColor: innerBorderColor, borderWidth: 0.7, top: 16 * s, left: 16 * s, right: 16 * s, bottom: 16 * s }]} />

        {/* Watermark */}
        <Text style={[cc.watermark, { color: isDarkSurface ? 'rgba(255,255,255,0.04)' : 'rgba(79,70,229,0.04)', fontSize: 48 * s }]}>
          SKILLSPHERE
        </Text>

        {/* Header: Logo + Brand + rule */}
        <View style={[cc.header, { paddingHorizontal: 22 * s, paddingTop: 18 * s, paddingBottom: 7 * s }]}>
          {!logoFailed ? (
            <Image
              source={{ uri: logoUri }}
              style={{ width: 34 * s, height: 34 * s, marginRight: 8 * s }}
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

        {/* Body */}
        <View style={[cc.content, { paddingHorizontal: 32 * s, paddingTop: 6 * s, paddingBottom: 86 * s }]}>
          <Text style={[cc.certTitle, { color: titleColor, fontSize: 13 * s, letterSpacing: 3 }]}>
            {titleText.toUpperCase()}
          </Text>
          <View style={[cc.dividerRow, { width: 150 * s, marginBottom: 7 * s }]}>
            <View style={{ flex: 1, height: 0.7, backgroundColor: secondary }} />
            <View style={{ width: 5 * s, height: 5 * s, backgroundColor: secondary, transform: [{ rotate: '45deg' }], marginHorizontal: 5 * s }} />
            <View style={{ flex: 1, height: 0.7, backgroundColor: secondary }} />
          </View>
          <Text style={[cc.subtitle, { color: bodyColor, fontSize: 7.5 * s }]}>{subtitleText}</Text>
          <Text style={[cc.studentName, { color: nameColor, fontSize: 20 * s, fontFamily: Platform.OS === 'web' ? 'Dancing Script' : undefined }]}>
            {studentName}
          </Text>
          <View style={{ width: 70 * s, height: 1.5 * s, backgroundColor: secondary, borderRadius: 1, marginBottom: 7 * s }} />
          <Text style={[cc.completionText, { color: bodyColor, fontSize: 7.5 * s }]}>
            has successfully completed the course
          </Text>
          <Text style={[cc.courseName, { color: courseColor, fontSize: 10 * s }]} numberOfLines={2}>
            {courseName}
          </Text>
        </View>

        {/* Footer bar */}
        <View style={[cc.footerBar, { bottom: 22 * s, left: 22 * s, right: 22 * s, borderTopColor: innerBorderColor, paddingTop: 5 * s }]}>
          {/* QR */}
          <View style={[cc.qrBox, { marginRight: 10 * s }]}>
            {qrDataUrl ? (
              <View style={{ width: 44 * s, height: 44 * s }}>
                <Image
                  source={{ uri: qrDataUrl }}
                  style={{ width: 44 * s, height: 44 * s }}
                  resizeMode="contain"
                />
                {/* SS text overlay — native Text renders at display resolution, always crisp */}
                {!showLock && (
                  <View style={{
                    position: 'absolute',
                    top:  44 * s * 0.39,
                    left: 44 * s * 0.39,
                    width:  44 * s * 0.22,
                    height: 44 * s * 0.22,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 44 * s * 0.09, letterSpacing: 0.3 }}>SS</Text>
                  </View>
                )}
                {showLock && (
                  <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: isDarkSurface ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)',
                    borderRadius: 4 * s,
                    justifyContent: 'center', alignItems: 'center',
                  }}>
                    <Icon name="lock-closed" size={12 * s} color={isDarkSurface ? '#fff' : '#555'} />
                  </View>
                )}
              </View>
            ) : (
              <View style={{
                width: 44 * s, height: 44 * s, borderRadius: 6 * s,
                justifyContent: 'center', alignItems: 'center',
                backgroundColor: isDarkSurface ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              }}>
                <Icon name="qr-code-outline" size={22 * s} color={isDarkSurface ? '#FFFFFF' : '#1A1A2E'} />
              </View>
            )}
            <Text style={{ color: footerColor, fontSize: 4.5 * s, marginTop: 2 * s }}>
              {showLock ? 'Preview only' : 'Scan to verify'}
            </Text>
          </View>

          {/* Center: tagline + date + cert ID */}
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

          {/* Signature */}
          <View style={[cc.sigBlock, { minWidth: 80 * s }]}>
            {signatureUri ? (
              <Image
                source={{ uri: signatureUri }}
                style={{ width: 80 * s, height: 30 * s, marginBottom: 2 * s, tintColor: isDarkSurface ? '#FFFFFF' : undefined }}
                resizeMode="contain"
              />
            ) : hasSignature ? (
              <View style={{ width: 80 * s, height: 30 * s, marginBottom: 2 * s, justifyContent: 'flex-end', alignItems: 'center' }}>
                <Text style={{
                  fontSize: 15 * s,
                  color: isDarkSurface ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.55)',
                  fontStyle: 'italic',
                  fontFamily: Platform.OS === 'web' ? 'cursive' : undefined,
                  letterSpacing: 1, marginBottom: 1,
                }}>{'~ ~ ~'}</Text>
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

        {/* PREVIEW stamp */}
        {showLock && (
          <View style={cc.previewStamp} pointerEvents="none">
            <Text style={[cc.previewStampText, { fontSize: 28 * s }]}>PREVIEW</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const cc = StyleSheet.create({
  cardOuter: { borderRadius: 10, borderWidth: 2, overflow: 'hidden', shadowOffset: { width: 0, height: 6 } },
  outerBorder: { position: 'absolute', borderWidth: 1.2, borderRadius: 5 },
  watermark: { position: 'absolute', top: '36%', alignSelf: 'center', fontWeight: '800', letterSpacing: 8, transform: [{ rotate: '-28deg' }], zIndex: 0 },
  header: { flexDirection: 'row', alignItems: 'center', zIndex: 1 },
  brandName: { fontWeight: '700', textAlign: 'left' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  dividerRow: { flexDirection: 'row', alignItems: 'center' },
  certTitle: { fontWeight: '800', textAlign: 'center', marginBottom: 7 },
  subtitle: { fontStyle: 'italic', marginBottom: 8, textAlign: 'center' },
  studentName: { fontWeight: '700', textAlign: 'center', marginBottom: 5 },
  completionText: { marginBottom: 4, textAlign: 'center' },
  courseName: { fontWeight: '700', textAlign: 'center', lineHeight: 14, maxWidth: '80%' },
  footerBar: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', borderTopWidth: 0.7, zIndex: 1 },
  qrBox: { alignItems: 'center', justifyContent: 'center' },
  footerText: { textAlign: 'center', marginBottom: 1 },
  sigBlock: { alignItems: 'center' },
  sigLine: { alignItems: 'center' },
  sigName: { textAlign: 'center', fontWeight: '500' },
  sigTitle: { textAlign: 'center', marginTop: 1 },
  previewStamp: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  previewStampText: { fontWeight: '900', color: 'rgba(100,100,100,0.10)', letterSpacing: 12, transform: [{ rotate: '-35deg' }] },
});

export default CertificateCard;
