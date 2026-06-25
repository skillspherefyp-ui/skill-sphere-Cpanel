require('dotenv').config();
const { sendOTPEmail } = require('./services/emailService');

const testEmail = process.env.ADMIN_EMAIL || 'skillspherefyp@gmail.com';
console.log('Sending test OTP email to:', testEmail);

sendOTPEmail(testEmail, '123456', 'Test User')
  .then(result => {
    console.log('SUCCESS:', JSON.stringify(result));
  })
  .catch(err => {
    console.error('FAILED:', err.message);
  });
