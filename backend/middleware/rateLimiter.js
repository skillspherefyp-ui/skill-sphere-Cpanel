const rateLimit = require('express-rate-limit');

// cPanel/Nginx sends X-Forwarded-For — disable the header validation to prevent ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
const proxyFix = { validate: { xForwardedForHeader: false } };

// Strict limiter for auth endpoints (login, register, OTP, password reset)
const authLimiter = rateLimit({
  ...proxyFix,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Moderate limiter for AI endpoints (expensive OpenAI calls)
const aiLimiter = rateLimit({
  ...proxyFix,
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached, please wait a moment.' },
  skip: (req) => process.env.NODE_ENV === 'test',
});

// General API limiter (broad protection)
const generalLimiter = rateLimit({
  ...proxyFix,
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
  skip: (req) => process.env.NODE_ENV === 'test',
});

module.exports = { authLimiter, aiLimiter, generalLimiter };
