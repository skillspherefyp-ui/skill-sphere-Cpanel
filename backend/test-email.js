require('dotenv').config();

const key = process.env.BREVO_API_KEY;
const from = process.env.SMTP_FROM_EMAIL || 'skillspherefyp@gmail.com';

console.log('API Key set:', key ? 'YES' : 'NO');
console.log('Key prefix:', key ? key.substring(0, 20) + '...' : 'NONE');
console.log('From email:', from);

// Check account status
fetch('https://api.brevo.com/v3/account', {
  headers: { 'api-key': key, 'accept': 'application/json' }
})
  .then(r => r.json())
  .then(d => {
    if (d.email) {
      console.log('\nBrevo account OK:');
      console.log('  Account email:', d.email);
      console.log('  Plan:', d.plan ? d.plan[0]?.type : 'unknown');
    } else {
      console.log('\nBrevo account error:', JSON.stringify(d, null, 2));
    }

    // Check senders
    return fetch('https://api.brevo.com/v3/senders', {
      headers: { 'api-key': key, 'accept': 'application/json' }
    });
  })
  .then(r => r.json())
  .then(d => {
    console.log('\nVerified senders:');
    if (d.senders && d.senders.length > 0) {
      d.senders.forEach(s => console.log(' -', s.email, s.active ? '(active)' : '(inactive)'));
    } else {
      console.log('  No verified senders found or error:', JSON.stringify(d));
    }
  })
  .catch(e => console.error('Fetch error:', e.message));
