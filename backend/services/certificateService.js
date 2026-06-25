const React = require('react');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { cloudinary } = require('../config/cloudinary');

// Try to load @react-pdf/renderer, fallback if ES Module issue
let Document, Page, Text, View, Image, StyleSheet, renderToBuffer, Font;
let Svg, SvgPath, SvgRect, Canvas;
let pdfAvailable = true;
try {
  const reactPdf = require('@react-pdf/renderer');
  Document = reactPdf.Document;
  Page = reactPdf.Page;
  Text = reactPdf.Text;
  View = reactPdf.View;
  Image = reactPdf.Image;
  StyleSheet = reactPdf.StyleSheet;
  renderToBuffer = reactPdf.renderToBuffer;
  Font = reactPdf.Font;
  Svg = reactPdf.Svg;
  SvgPath = reactPdf.Path;
  SvgRect = reactPdf.Rect;
  Canvas = reactPdf.Canvas;
} catch (error) {
  console.error('❌ @react-pdf/renderer failed to load:', error.message);
  console.error('   Full error:', error);
  pdfAvailable = false;
}

// No external font registration needed.
// Student name uses Times-BoldItalic — a built-in PDF font, always available,
// no network fetch required. This guarantees the name always renders.

// Logo path - automatically used for all certificates
const LOGO_PATH = path.join(__dirname, '../assets/skillsphere-logo.png');

/**
 * Colorize a transparent-background signature PNG.
 * Replaces all non-transparent pixels with the target RGB color.
 * @param {string} base64DataUri - data:image/png;base64,... string
 * @param {number[]} targetRgb   - [r, g, b] e.g. [255,255,255] for white
 * @returns {Promise<string>} colorized data URI
 */
const colorizeSignature = async (base64DataUri, targetRgb) => {
  try {
    const jimpModule = require('jimp');
    // Support both jimp v0.x (default export = class) and v1.x (named export)
    const Jimp = jimpModule.Jimp || jimpModule;
    const MIME_PNG = (jimpModule.JimpMime && jimpModule.JimpMime.png)
      || jimpModule.MIME_PNG
      || 'image/png';

    const base64Data = base64DataUri.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const image = await Jimp.read(buffer);
    const [r, g, b] = targetRgb;

    // Iterate pixels directly — works in both v0 and v1
    const { data } = image.bitmap;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 10) { // non-transparent pixel
        data[i]     = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }
    }

    // getBufferAsync (v0) or getBuffer (v1)
    const colorizedBuffer = typeof image.getBufferAsync === 'function'
      ? await image.getBufferAsync(MIME_PNG)
      : await image.getBuffer(MIME_PNG);

    return `data:image/png;base64,${colorizedBuffer.toString('base64')}`;
  } catch (err) {
    console.warn('colorizeSignature failed, using original:', err.message);
    return base64DataUri;
  }
};

/**
 * Rounded-rect SVG path helper (used for styled QR generation)
 */
const rRectPath = (x, y, w, h, r) => {
  const cr = Math.min(r, w / 2, h / 2);
  return `M${x+cr},${y}h${w-2*cr}a${cr},${cr},0,0,1,${cr},${cr}v${h-2*cr}a${cr},${cr},0,0,1,${-cr},${cr}h${-(w-2*cr)}a${cr},${cr},0,0,1,${-cr},${-cr}v${-(h-2*cr)}a${cr},${cr},0,0,1,${cr},${-cr}z`;
};

/**
 * Build a styled QR as a react-pdf Svg element.
 * Circular data dots, accent-colored rounded finder corners, SS badge at center.
 * dark template → white dots on template-bg; light template → dark dots on white.
 */
const createQRSvgElement = (text, { size = 54, accentColor = '#4F46E5', bgIsDark = false, bgColor = '#ffffff' } = {}) => {
  if (!Svg || !SvgPath || !SvgRect) return null;
  try {
    const QRCode = require('qrcode');
    const qr = QRCode.create(text, { errorCorrectionLevel: 'H' });
    const N = qr.modules.size;
    const D = qr.modules.data;
    const S = size;
    const m = S / N;
    const dark   = bgIsDark ? '#FFFFFF' : '#1A1A2E';
    const light  = bgIsDark ? bgColor   : '#FFFFFF';
    const accent = accentColor;
    const pad    = m * 0.12;
    const dw     = m - 2 * pad;

    const isFinder = (r, c) =>
      (r <= 7 && c <= 7) || (r <= 7 && c >= N - 8) || (r >= N - 8 && c <= 7);

    // Data modules path (fully rounded)
    let dp = '';
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (D[r * N + c] && !isFinder(r, c))
          dp += rRectPath(c * m + pad, r * m + pad, dw, dw, dw * 0.5);

    // Finder patterns: outer ring (evenodd) + inner dot, accent colored
    const finderEls = [];
    [[0, 0], [N - 7, 0], [0, N - 7]].forEach(([fc, fr], i) => {
      const ox = fc * m + pad * 0.5, oy = fr * m + pad * 0.5, ow = 7 * m - pad;
      const ring = `${rRectPath(ox,oy,ow,ow,m*1.5)} ${rRectPath(ox+m,oy+m,5*m-pad,5*m-pad,m*0.9)}`;
      finderEls.push(React.createElement(SvgPath, { key: `fr${i}`, fill: accent, fillRule: 'evenodd', d: ring }));
      const ds = 3 * m - pad;
      finderEls.push(React.createElement(SvgPath, { key: `fd${i}`, fill: accent, d: rRectPath(ox+2*m,oy+2*m,ds,ds,ds*0.4) }));
    });

    // SS badge: 30% of QR width with rounded corners (area 9% << H budget 30%)
    const bs = S * 0.30;
    const bx = (S - bs) / 2, by = (S - bs) / 2;

    const svgEl = React.createElement(Svg, { width: size, height: size, viewBox: `0 0 ${S} ${S}` },
      React.createElement(SvgRect, { x: 0, y: 0, width: S, height: S, fill: light }),
      React.createElement(SvgPath, { fill: dark, d: dp }),
      ...finderEls,
      React.createElement(SvgPath, { key: 'badge', fill: accent, d: rRectPath(bx, by, bs, bs, bs * 0.28) })
    );

    // Overlay a native PDF Text on top of the badge — SVG text is unreliable in react-pdf
    const textOverlay = React.createElement(View, {
      style: {
        position: 'absolute',
        top: by,
        left: bx,
        width: bs,
        height: bs,
        justifyContent: 'center',
        alignItems: 'center',
      }
    }, React.createElement(Text, {
      style: { color: '#FFFFFF', fontSize: bs * 0.40, fontWeight: 'bold', textAlign: 'center' }
    }, 'SS'));

    return React.createElement(View, { style: { position: 'relative', width: size, height: size } },
      svgEl,
      textOverlay
    );
  } catch (e) {
    console.warn('createQRSvgElement failed:', e.message);
    return null;
  }
};

/**
 * Build a PDFKit paint function for a styled QR code.
 * Uses react-pdf Canvas component → PDFKit painter API.
 * painter.roundedRect() for dots/finders, painter.text() for SS badge.
 */
const createQRPaintFn = (text, { accentColor = '#4F46E5', bgIsDark = false, bgColor = '#ffffff' } = {}) => {
  try {
    const QRCode = require('qrcode');
    const qr = QRCode.create(text, { errorCorrectionLevel: 'H' });
    const N  = qr.modules.size;
    const D  = qr.modules.data;

    return (painter, availableWidth, availableHeight) => {
      const SIZE = Math.min(availableWidth, availableHeight);
      const m    = SIZE / N;
      const dark   = bgIsDark ? '#FFFFFF' : '#1A1A2E';
      const light  = bgIsDark ? bgColor   : '#FFFFFF';
      const accent = accentColor;

      // Background
      painter.rect(0, 0, SIZE, SIZE).fill(light);

      const isFinder = (r, c) =>
        (r <= 7 && c <= 7) || (r <= 7 && c >= N - 8) || (r >= N - 8 && c <= 7);

      // Data modules — circular dots
      const pad = m * 0.10;
      const dw  = m - 2 * pad;
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (!D[r * N + c] || isFinder(r, c)) continue;
          painter.roundedRect(c * m + pad, r * m + pad, dw, dw, dw * 0.45).fill(dark);
        }
      }

      // Finder patterns: outer rounded ring → clear inner → inner dot
      const drawFinder = (fc, fr) => {
        const ox = fc * m, oy = fr * m, p = m * 0.06;
        painter.roundedRect(ox + p, oy + p, 7*m - 2*p, 7*m - 2*p, m * 1.3).fill(accent);
        painter.roundedRect(ox + m + p, oy + m + p, 5*m - 2*p, 5*m - 2*p, m * 0.8).fill(light);
        const ds = 3*m - 2*p;
        painter.roundedRect(ox + 2*m + p, oy + 2*m + p, ds, ds, ds * 0.35).fill(accent);
      };
      drawFinder(0, 0);
      drawFinder(N - 7, 0);
      drawFinder(0, N - 7);

      // SS badge — 30% of QR width (area 9% << H 30% budget)
      const bs = SIZE * 0.30;
      const bx = (SIZE - bs) / 2;
      const by = (SIZE - bs) / 2;
      painter.roundedRect(bx, by, bs, bs, bs * 0.18).fill(accent);

      // SS text using PDFKit built-in bold font
      const fz = bs * 0.40;
      painter
        .font('Helvetica-Bold')
        .fontSize(fz)
        .fillColor('#FFFFFF')
        .text('SS', bx, by + (bs - fz) / 2, { width: bs, align: 'center', lineBreak: false });
    };
  } catch (e) {
    console.warn('createQRPaintFn failed:', e.message);
    return null;
  }
};

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

/**
 * Calculate relative luminance of a color
 * Returns value between 0 (darkest) and 1 (lightest)
 */
const getLuminance = (hex) => {
  const rgb = hexToRgb(hex);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Determine if a color is light or dark
 */
const isLightColor = (hex) => {
  return getLuminance(hex) > 0.5;
};

/**
 * Get contrasting text color (black or white) for a background
 */
const getContrastColor = (bgColor, lightColor = '#FFFFFF', darkColor = '#333333') => {
  return isLightColor(bgColor) ? darkColor : lightColor;
};

/**
 * Create PDF styles - optimized for single landscape A4 page
 * @param {Object} template - Template settings
 */
const createStyles = (template) => {
  const primaryColor = template?.primaryColor || '#4F46E5';
  const secondaryColor = template?.secondaryColor || '#22D3EE';

  // Determine if background color is dark
  const solidBgIsDark = template?.backgroundColor
    ? !isLightColor(template.backgroundColor)
    : false;

  // Text colors - adapt to solid background color
  let titleColor, studentNameColor, brandColor;
  let subtitleColor, bodyTextColor, courseNameColor;
  let detailTextColor, footerTextColor, signatureLineColor, signatureTitleColor;
  let borderColor, innerBorderColor, watermarkColor;

  if (solidBgIsDark) {
    // Dark solid background — body text light, accented elements keep primary/secondary
    titleColor = '#FFFFFF';
    studentNameColor = primaryColor;
    brandColor = primaryColor;
    subtitleColor = '#D0D0D0';
    bodyTextColor = '#D0D0D0';
    courseNameColor = primaryColor;
    detailTextColor = '#BBBBBB';
    footerTextColor = '#AAAAAA';
    signatureLineColor = '#FFFFFF';
    signatureTitleColor = '#BBBBBB';
    borderColor = primaryColor;
    innerBorderColor = secondaryColor;
    watermarkColor = 'rgba(255, 255, 255, 0.04)';
  } else {
    // Light/white background — accented elements keep primary/secondary
    titleColor = primaryColor;
    studentNameColor = primaryColor;
    brandColor = primaryColor;
    subtitleColor = '#666666';
    bodyTextColor = '#666666';
    courseNameColor = primaryColor;
    detailTextColor = '#888888';
    footerTextColor = '#999999';
    signatureLineColor = '#333333';
    signatureTitleColor = '#888888';
    borderColor = primaryColor;
    innerBorderColor = secondaryColor;
    watermarkColor = 'rgba(79, 70, 229, 0.03)';
  }

  const pageBackground = template?.backgroundColor || '#ffffff';

  return StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: pageBackground,
      padding: 0,
      position: 'relative',
      width: '100%',
      height: '100%',
    },
    border: {
      position: 'absolute',
      top: 12,
      left: 12,
      right: 12,
      bottom: 12,
      borderWidth: 2.5,
      borderColor: borderColor,
      borderRadius: 6,
    },
    innerBorder: {
      position: 'absolute',
      top: 19,
      left: 19,
      right: 19,
      bottom: 19,
      borderWidth: 0.8,
      borderColor: innerBorderColor,
      borderRadius: 3,
    },
    watermark: {
      position: 'absolute',
      top: '38%',
      left: '12%',
      transform: 'rotate(-28deg)',
      fontSize: 64,
      color: watermarkColor,
      fontWeight: 'bold',
      letterSpacing: 14,
    },
    // ── Header: Logo + Brand + horizontal rule ──
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 34,
      paddingTop: 26,
      paddingBottom: 10,
    },
    headerLogo: {
      width: 46,
      height: 46,
      borderRadius: 8,
      marginRight: 10,
    },
    headerBrandBlock: {
      marginRight: 16,
    },
    headerBrandName: {
      fontSize: 10,
      fontWeight: 'bold',
      color: brandColor,
      letterSpacing: 2.5,
    },
    headerTagline: {
      fontSize: 6.5,
      color: detailTextColor,
      letterSpacing: 0.8,
      marginTop: 2,
    },
    headerDivider: {
      flex: 1,
      height: 1,
      backgroundColor: innerBorderColor,
    },
    accentBar: {
      height: 3,
      backgroundColor: primaryColor,
      marginHorizontal: 34,
      borderRadius: 2,
    },
    // ── Body ──
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 44,
      paddingTop: 8,
      paddingBottom: 108,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: titleColor,
      textTransform: 'uppercase',
      letterSpacing: 4,
      marginBottom: 10,
      textAlign: 'center',
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      width: 200,
    },
    dividerLine: {
      flex: 1,
      height: 0.8,
      backgroundColor: secondaryColor,
    },
    diamond: {
      width: 6,
      height: 6,
      backgroundColor: secondaryColor,
      transform: 'rotate(45deg)',
      marginHorizontal: 7,
    },
    subtitle: {
      fontSize: 9,
      color: subtitleColor,
      marginBottom: 12,
      letterSpacing: 1,
    },
    studentName: {
      fontSize: 30,
      fontFamily: 'Times-BoldItalic',
      color: studentNameColor,
      marginBottom: 6,
      textAlign: 'center',
    },
    nameUnderline: {
      width: 90,
      height: 2,
      backgroundColor: secondaryColor,
      borderRadius: 1,
      marginBottom: 10,
    },
    completionText: {
      fontSize: 9,
      color: bodyTextColor,
      marginBottom: 6,
      textAlign: 'center',
    },
    courseName: {
      fontSize: 13,
      fontWeight: 'bold',
      color: courseNameColor,
      textAlign: 'center',
      maxWidth: 360,
    },
    // ── Footer bar: QR | date+id | signature ──
    footerBar: {
      position: 'absolute',
      bottom: 22,
      left: 28,
      right: 28,
      height: 76,
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 0.8,
      borderTopColor: innerBorderColor,
      paddingTop: 6,
      paddingHorizontal: 6,
    },
    qrWrapper: {
      alignItems: 'center',
      marginRight: 12,
    },
    qrLabel: {
      fontSize: 4.5,
      color: footerTextColor,
      marginTop: 2,
      textAlign: 'center',
    },
    footerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    footerTagline: {
      fontSize: 6,
      color: footerTextColor,
      textAlign: 'center',
      fontStyle: 'italic',
      marginBottom: 4,
      maxWidth: 260,
    },
    footerText: {
      fontSize: 7,
      color: footerTextColor,
      marginBottom: 3,
    },
    signatureBlock: {
      alignItems: 'center',
      minWidth: 110,
    },
    signatureImage: {
      width: 100,
      height: 38,
      marginBottom: 3,
      objectFit: 'contain',
    },
    signatureLine: {
      width: 100,
      borderTopWidth: 0.8,
      borderTopColor: signatureLineColor,
      paddingTop: 3,
      fontSize: 7.5,
      color: bodyTextColor,
      textAlign: 'center',
    },
    signatureTitle: {
      fontSize: 6,
      color: signatureTitleColor,
      marginTop: 1,
      textAlign: 'center',
    },
  });
};

/**
 * Certificate Document Component - Single landscape A4 page
 * Layout: header (logo + brand + rule) → accent bar → centered body → footer bar (QR | date+ID | signature)
 */
const CertificateDocument = ({ data, template }) => {
  const styles = createStyles(template);
  const primaryColor = template?.primaryColor || '#4F46E5';
  const bgIsDark = template?.backgroundColor ? !isLightColor(template.backgroundColor) : false;
  const solidBgColor = template?.backgroundColor || '#ffffff';
  const titleText = template?.titleText || 'Certificate of Completion';
  const subtitleText = template?.subtitleText || 'This is to certify that';
  const footerText = template?.footerText || 'This certificate is awarded upon successful completion of the course requirements.';

  const issueDate = new Date(data.issueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const pageContent = [];

  // Absolute layers: borders + watermark
  pageContent.push(React.createElement(View, { key: 'border', style: styles.border }));
  pageContent.push(React.createElement(View, { key: 'innerBorder', style: styles.innerBorder }));
  pageContent.push(React.createElement(Text, { key: 'watermark', style: styles.watermark }, 'SKILLSPHERE'));

  // ── Header: Logo + Brand block + horizontal rule ──
  const headerChildren = [];
  if (data.logoPath) {
    headerChildren.push(React.createElement(Image, { key: 'logo', style: styles.headerLogo, src: data.logoPath }));
  }
  headerChildren.push(
    React.createElement(View, { key: 'brandBlock', style: styles.headerBrandBlock },
      React.createElement(Text, { style: styles.headerBrandName }, 'SKILLSPHERE'),
      React.createElement(Text, { style: styles.headerTagline }, 'Certificate of Achievement')
    )
  );
  headerChildren.push(React.createElement(View, { key: 'hRule', style: styles.headerDivider }));
  pageContent.push(React.createElement(View, { key: 'header', style: styles.header }, ...headerChildren));

  // Accent bar
  pageContent.push(React.createElement(View, { key: 'accent', style: styles.accentBar }));

  // ── Centered body ──
  const contentChildren = [];

  contentChildren.push(React.createElement(Text, { key: 'title', style: styles.title }, titleText));

  // Diamond divider
  contentChildren.push(
    React.createElement(View, { key: 'divider', style: styles.dividerRow },
      React.createElement(View, { style: styles.dividerLine }),
      React.createElement(View, { style: styles.diamond }),
      React.createElement(View, { style: styles.dividerLine })
    )
  );

  contentChildren.push(React.createElement(Text, { key: 'subtitle', style: styles.subtitle }, subtitleText));
  contentChildren.push(React.createElement(Text, { key: 'student', style: styles.studentName }, data.studentName));
  contentChildren.push(React.createElement(View, { key: 'nameUnderline', style: styles.nameUnderline }));
  contentChildren.push(React.createElement(Text, { key: 'completion', style: styles.completionText }, 'has successfully completed the course'));
  contentChildren.push(React.createElement(Text, { key: 'course', style: styles.courseName }, data.courseName));

  pageContent.push(React.createElement(View, { key: 'content', style: styles.content }, ...contentChildren));

  // ── Footer bar: [QR] | [date + cert ID] | [signature] ──
  const footerChildren = [];

  // QR — SVG with absolute Text overlay for the SS badge (painter.text() is a no-op in react-pdf Canvas)
  if (data.certificateNumber) {
    const qrEl = createQRSvgElement(
      data.verifyBaseUrl ? `${data.verifyBaseUrl}/verify/${data.certificateNumber}` : data.certificateNumber,
      { size: 54, accentColor: primaryColor, bgIsDark, bgColor: solidBgColor }
    );
    if (qrEl) {
      const qrItems = [
        React.cloneElement(qrEl, { key: 'qrSvg' }),
        React.createElement(Text, { key: 'qrScan', style: styles.qrLabel }, 'Scan to verify'),
      ];
      if (data.verifyBaseUrl) {
        qrItems.push(React.createElement(Text, { key: 'qrUrl', style: styles.qrLabel }, data.verifyBaseUrl));
      }
      footerChildren.push(React.createElement(View, { key: 'qrWrapper', style: styles.qrWrapper }, ...qrItems));
    }
  }

  // Center — footer text + issued date + cert ID
  footerChildren.push(
    React.createElement(View, { key: 'footerCenter', style: styles.footerCenter },
      React.createElement(Text, { style: styles.footerTagline }, footerText),
      React.createElement(Text, { style: styles.footerText }, `Issued on: ${issueDate}`),
      React.createElement(Text, { style: styles.footerText }, `Certificate ID: ${data.certificateNumber}`)
    )
  );

  // Signature — right
  const sigItems = [];
  if (data.instructorSignature) {
    sigItems.push(React.createElement(Image, { key: 'sig', style: styles.signatureImage, src: data.instructorSignature }));
  } else {
    sigItems.push(React.createElement(View, { key: 'sigSpace', style: { height: 38 } }));
  }
  sigItems.push(React.createElement(Text, { key: 'sigLine', style: styles.signatureLine }, 'Instructor'));
  sigItems.push(React.createElement(Text, { key: 'sigTitle', style: styles.signatureTitle }, 'SkillSphere'));
  footerChildren.push(React.createElement(View, { key: 'sigBlock', style: styles.signatureBlock }, ...sigItems));

  pageContent.push(React.createElement(View, { key: 'footerBar', style: styles.footerBar }, ...footerChildren));

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', orientation: 'landscape', style: styles.page, wrap: false },
      ...pageContent
    )
  );
};

/**
 * Convert file path to base64 data URI for images
 * @react-pdf/renderer works best with base64 encoded images
 */
const getImageSource = (imagePath) => {
  try {
    if (!imagePath) {
      console.log('getImageSource: No image path provided');
      return null;
    }

    console.log('getImageSource: Processing path:', imagePath);

    // If it's already a data URI, return as is
    if (imagePath.startsWith('data:')) {
      return imagePath;
    }

    // If it's an HTTP URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    let fullPath;

    // If it's a relative URL path (starts with /uploads/...)
    if (imagePath.startsWith('/uploads/') || imagePath.startsWith('\\uploads\\')) {
      // Remove leading slash and normalize path separators
      const relativePath = imagePath.replace(/^[/\\]/, '').replace(/\//g, path.sep);
      fullPath = path.join(__dirname, '..', relativePath);
    }
    // If it's already an absolute path
    else if (path.isAbsolute(imagePath)) {
      fullPath = imagePath;
    }
    // If it's a relative file path
    else {
      fullPath = path.join(__dirname, '..', imagePath);
    }

    // Normalize the path for the current OS
    fullPath = path.normalize(fullPath);

    console.log('getImageSource: Checking file:', fullPath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.warn(`getImageSource: Image not found at: ${fullPath}`);
      return null;
    }

    // Read file and convert to base64 data URI
    const fileBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    let mimeType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';

    const base64 = fileBuffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64}`;

    console.log(`getImageSource: SUCCESS - Converted ${fullPath} to base64 (${mimeType})`);
    return dataUri;
  } catch (error) {
    console.error('getImageSource: Error processing image:', error);
    return null;
  }
};


/**
 * Generate PDF certificate from data
 * @param {Object} data - Certificate data { studentName, courseName, certificateNumber, issueDate }
 * @param {Object} template - Template settings from database
 * @returns {Buffer} PDF buffer
 */
const generateCertificatePDF = async (data, template = null) => {
  // Check if PDF generation is available
  if (!pdfAvailable) {
    throw new Error('Certificate generation is temporarily unavailable. Please contact your administrator.');
  }

  try {
    // Get logo source
    console.log('Attempting to load logo from:', LOGO_PATH);
    console.log('Logo file exists:', fs.existsSync(LOGO_PATH));
    const logoPath = getImageSource(LOGO_PATH);
    console.log('Logo loaded as base64:', !!logoPath);

    // Determine if the background color is dark
    const bgIsDark = template?.backgroundColor ? !isLightColor(template.backgroundColor) : false;

    // Get instructor signature — passed via data (from creator user, not template)
    let instructorSignature = null;
    if (data.instructorSignature) {
      const targetRgb = bgIsDark ? [255, 255, 255] : [0, 0, 0];
      instructorSignature = await colorizeSignature(data.instructorSignature, targetRgb);
      console.log('Instructor signature colorized for', bgIsDark ? 'dark' : 'light', 'background');
    }

    // Base URL for display below the QR (never baked into the QR itself)
    const verifyBaseUrl = (data.frontendUrl || process.env.FRONTEND_URL || '').replace(/\/$/, '');

    // Prepare certificate data
    const certificateData = {
      ...data,
      logoPath,
      instructorSignature,
      verifyBaseUrl,
    };

    console.log('Generating certificate with data:', {
      studentName: certificateData.studentName,
      courseName: certificateData.courseName,
      hasLogo: !!certificateData.logoPath,
      hasSignature: !!certificateData.instructorSignature,
    });

    // Generate PDF buffer using React PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(CertificateDocument, { data: certificateData, template })
    );

    return pdfBuffer;
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    throw error;
  }
};

/**
 * Save PDF to storage and return URL
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {string} certificateNumber - Unique certificate number
 * @returns {string} File URL/path (Local path or Cloudinary URL)
 */
const saveCertificatePDF = async (pdfBuffer, certificateNumber) => {
  try {
    const filename = `Certificate_${certificateNumber}.pdf`;

    // Save to local uploads folder
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'certificates');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);

    // Write PDF buffer to file
    fs.writeFileSync(filePath, pdfBuffer);

    console.log('Certificate saved locally:', filePath);

    // Return local URL path
    const localUrl = `/uploads/certificates/${filename}`;
    return localUrl;
  } catch (error) {
    console.error('Error saving certificate PDF:', error);
    throw error;
  }
};

/**
 * Generate unique certificate number
 * @param {number} userId - User ID
 * @param {number} courseId - Course ID
 * @returns {string} Unique certificate number
 */
const generateCertificateNumber = (userId, courseId) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CERT-${userId}-${courseId}-${timestamp}-${random}`;
};

/**
 * Generate and save certificate
 * @param {Object} data - { studentName, courseName, certificateNumber, issueDate }
 * @param {Object} template - Template settings
 * @returns {Object} { pdfBuffer, certificateUrl }
 */
const generateAndSaveCertificate = async (data, template = null) => {
  try {
    // Generate PDF
    const pdfBuffer = await generateCertificatePDF(data, template);

    // Save PDF to storage
    const certificateUrl = await saveCertificatePDF(pdfBuffer, data.certificateNumber);

    return {
      pdfBuffer,
      certificateUrl
    };
  } catch (error) {
    console.error('Error generating and saving certificate:', error);
    throw error;
  }
};

module.exports = {
  generateCertificatePDF,
  saveCertificatePDF,
  generateCertificateNumber,
  generateAndSaveCertificate,
  getImageSource,
  CertificateDocument
};
