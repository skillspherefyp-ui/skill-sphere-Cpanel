require('dotenv').config();
const key = process.env.BREVO_API_KEY;

fetch('https://api.brevo.com/v3/smtp/statistics/events?limit=20&sort=desc', {
  headers: { 'api-key': key, 'accept': 'application/json' }
}).then(r => r.json()).then(d => {
  if (d.events) {
    console.log('Recent email events (last 20):');
    d.events.forEach(e => {
      console.log(' ', e.event.padEnd(12), e.email, e.date);
    });
  } else {
    console.log('Response:', JSON.stringify(d, null, 2));
  }
}).catch(e => console.error(e.message));
