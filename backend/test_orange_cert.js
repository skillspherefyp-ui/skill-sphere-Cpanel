/**
 * Certificate test script — generates a sample PDF using the live certificate service.
 * QR code encodes the URL below so scanning it opens the website.
 *
 * HOW TO USE:
 *   1. Uncomment ONE template block below (and comment out the active one)
 *   2. Run: node backend/test_orange_cert.js
 *   3. Output: backend/orange_cert_test.pdf
 */
const path = require('path');
const fs   = require('fs');
const { generateCertificatePDF } = require('./services/certificateService');

// ─────────────────────────────────────────────────────────────
// DESIGN 1: Dark background + Orange  ✅ ACTIVE
// ─────────────────────────────────────────────────────────────
const activeTemplate = {
  primaryColor:    '#FF6B00',
  secondaryColor:  '#FF9B40',
  backgroundColor: '#1A1A1A',
  titleText:   'Certificate of Completion',
  subtitleText: 'This is to certify that',
  footerText:  'This certificate is awarded upon successful completion of the course requirements.',
};

// ─────────────────────────────────────────────────────────────
// DESIGN 2: Light background + Indigo (default app style)
// ─────────────────────────────────────────────────────────────
// const activeTemplate = {
//   primaryColor:    '#4F46E5',
//   secondaryColor:  '#22D3EE',
//   backgroundColor: '#FFFFFF',
//   titleText:   'Certificate of Completion',
//   subtitleText: 'This is to certify that',
//   footerText:  'This certificate is awarded upon successful completion of the course requirements.',
// };

// ─────────────────────────────────────────────────────────────
// DESIGN 3: Dark background + Purple / Cyan
// ─────────────────────────────────────────────────────────────
// const activeTemplate = {
//   primaryColor:    '#7C3AED',
//   secondaryColor:  '#06B6D4',
//   backgroundColor: '#0F0F1A',
//   titleText:   'Certificate of Completion',
//   subtitleText: 'This is to certify that',
//   footerText:  'This certificate is awarded upon successful completion of the course requirements.',
// };

// ─────────────────────────────────────────────────────────────
// DESIGN 4: Light background + Green / Teal
// ─────────────────────────────────────────────────────────────
// const activeTemplate = {
//   primaryColor:    '#059669',
//   secondaryColor:  '#34D399',
//   backgroundColor: '#FFFFFF',
//   titleText:   'Certificate of Completion',
//   subtitleText: 'This is to certify that',
//   footerText:  'This certificate is awarded upon successful completion of the course requirements.',
// };

// ─────────────────────────────────────────────────────────────
// DESIGN 5: Dark background + Gold / Amber (premium look)
// ─────────────────────────────────────────────────────────────
// const activeTemplate = {
//   primaryColor:    '#D97706',
//   secondaryColor:  '#FCD34D',
//   backgroundColor: '#111111',
//   titleText:   'Certificate of Completion',
//   subtitleText: 'This is to certify that',
//   footerText:  'This certificate is awarded upon successful completion of the course requirements.',
// };

// ─────────────────────────────────────────────────────────────
// DESIGN 6: Light background + Rose / Pink
// ─────────────────────────────────────────────────────────────
// const activeTemplate = {
//   primaryColor:    '#E11D48',
//   secondaryColor:  '#FB7185',
//   backgroundColor: '#FFFFFF',
//   titleText:   'Certificate of Completion',
//   subtitleText: 'This is to certify that',
//   footerText:  'This certificate is awarded upon successful completion of the course requirements.',
// };

// ─────────────────────────────────────────────────────────────
// DESIGN 7: Dark background + Blue / Sky
// ─────────────────────────────────────────────────────────────
// const activeTemplate = {
//   primaryColor:    '#2563EB',
//   secondaryColor:  '#38BDF8',
//   backgroundColor: '#0D1117',
//   titleText:   'Certificate of Completion',
//   subtitleText: 'This is to certify that',
//   footerText:  'This certificate is awarded upon successful completion of the course requirements.',
// };

// ─────────────────────────────────────────────────────────────
// Sample student/course data — edit freely
// ─────────────────────────────────────────────────────────────
const certData = {
  studentName:       'Ahmad Ali',
  courseName:        'Advanced Web Development',
  // QR encodes this value — scanning it opens the URL
  certificateNumber: 'https://skillsphere.com.pk',
  issueDate:         new Date().toISOString(),
  frontendUrl:       'skillsphere.com.pk',
};

(async () => {
  console.log('Generating certificate...');
  const pdfBuffer = await generateCertificatePDF(certData, activeTemplate);

  const outPath = path.join(__dirname, 'orange_cert_test.pdf');
  fs.writeFileSync(outPath, pdfBuffer);
  console.log('Done! Saved to:', outPath);
})().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
