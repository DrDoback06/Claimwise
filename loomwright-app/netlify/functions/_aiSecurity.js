const crypto = require('crypto');

const RATE = new Map();
const WINDOW_MS = 60_000;
const LIMIT = 60;

const PROVIDER_ALLOWLIST = new Set(['openai', 'gemini', 'anthropic', 'groq', 'huggingface']);

function json(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  };
}

function sanitizeError(error, fallback = 'Request failed') {
  return { error: fallback, detail: String(error?.message || fallback).slice(0, 180) };
}

function getIp(event) {
  return event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
}

function rateLimit(event) {
  const ip = getIp(event);
  const now = Date.now();
  const bucket = RATE.get(ip) || [];
  const next = bucket.filter(ts => now - ts < WINDOW_MS);
  if (next.length >= LIMIT) {
    return false;
  }
  next.push(now);
  RATE.set(ip, next);
  return true;
}

function getAuthError(event) {
  const expected = process.env.CLAIMWISE_CLIENT_TOKEN;
  if (!expected) return null;
  const provided = event.headers['x-claimwise-client'];
  if (!provided || provided !== expected) {
    return 'Unauthorized client token';
  }
  return null;
}

function enforceBodyLimit(event, maxBytes = 50_000) {
  const len = Number(event.headers['content-length'] || 0);
  return Number.isFinite(len) && len <= maxBytes;
}

function parseCookies(cookieHeader = '') {
  return Object.fromEntries(cookieHeader.split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const idx = part.indexOf('=');
    return [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))];
  }));
}

function getSessionSecret() {
  const secret = process.env.BYOK_SESSION_SECRET || '';
  if (secret.length < 16) {
    throw new Error('BYOK_SESSION_SECRET must be set and at least 16 characters');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptSession(payload) {
  const key = getSessionSecret();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64url');
}

function decryptSession(token) {
  const key = getSessionSecret();
  const buf = Buffer.from(token, 'base64url');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  return JSON.parse(plaintext);
}

function validateProvider(provider) {
  return PROVIDER_ALLOWLIST.has(provider);
}

module.exports = {
  json,
  sanitizeError,
  rateLimit,
  getAuthError,
  enforceBodyLimit,
  parseCookies,
  encryptSession,
  decryptSession,
  validateProvider
};
