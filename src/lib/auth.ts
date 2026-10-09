import crypto from 'crypto';

const ADMIN_COOKIE_NAME = 'lcb_admin_token';

// Session secret MUST be configured via environment variable.
// No hardcoded fallback — absence is a startup-time configuration error.
function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    // In development, log a clear warning. In production, this should block startup.
    console.error(
      '[SECURITY] ADMIN_SESSION_SECRET is missing or too short (min 32 chars). ' +
      'Session tokens will be rejected. Set this in your .env.local or Vercel environment variables.'
    );
    // Return empty string — all token validations will fail safely
    return '';
  }
  return secret;
}

/**
 * Returns the configured admin username.
 * Only environment-configured values are accepted — no hardcoded fallbacks.
 */
function getAdminUsername(): string | null {
  const username = (
    process.env.ADMIN_USERNAME ||
    process.env.ADMIN_USER ||
    process.env.ADMIN_EMAIL ||
    ''
  ).trim().toLowerCase();

  return username || null;
}

/**
 * Returns the configured admin password.
 * Only environment-configured values are accepted — no hardcoded fallbacks.
 */
function getAdminPassword(): string | null {
  const password = (process.env.ADMIN_PASSWORD || '').trim();
  return password || null;
}

/**
 * Timing-safe string comparison to prevent timing attacks on password verification.
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Compare against a dummy of matching length to avoid early return timing leak
    const dummy = crypto.randomBytes(b.length).toString('hex');
    crypto.timingSafeEqual(Buffer.from(a.padEnd(dummy.length, '\0')), Buffer.from(dummy));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Verifies admin credentials using timing-safe comparison.
 * Returns true only if both username AND password match the configured values.
 * No hardcoded fallback credentials exist.
 */
export function verifyAdminCredentials(identifier: string, pass: string): boolean {
  if (!identifier || !pass) return false;

  const configuredUsername = getAdminUsername();
  const configuredPassword = getAdminPassword();

  // If credentials are not configured, authentication always fails
  if (!configuredUsername || !configuredPassword) {
    console.error('[SECURITY] Admin credentials not configured. Login is disabled.');
    return false;
  }

  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = pass.trim();

  // Timing-safe comparison for both username and password
  const usernameMatch = timingSafeCompare(cleanId, configuredUsername);
  const passwordMatch = timingSafeCompare(cleanPass, configuredPassword);

  return usernameMatch && passwordMatch;
}

/**
 * Generates a secure HMAC-based session token.
 * Token format: lcb_adm_<base64(timestamp:username:hmac)>
 * The HMAC prevents forgery without knowing the session secret.
 */
export function generateSessionToken(username?: string): string {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error('Session secret not configured. Cannot generate session token.');
  }

  const timestamp = Date.now().toString();
  const user = (username || getAdminUsername() || 'admin').trim().toLowerCase();
  const payload = `${timestamp}:${user}`;

  // HMAC-SHA256 signature prevents token forgery
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const raw = `${payload}:${hmac}`;
  const b64 = Buffer.from(raw).toString('base64');
  return `lcb_adm_${b64}`;
}

/**
 * Validates a session token by verifying its HMAC signature and checking expiration.
 * Session expires after 24 hours (reduced from 7 days for security).
 */
export function isValidSessionToken(token: string | undefined): boolean {
  if (!token || !token.startsWith('lcb_adm_')) return false;

  const secret = getSessionSecret();
  if (!secret) return false;

  try {
    const raw = Buffer.from(token.replace('lcb_adm_', ''), 'base64').toString('utf-8');
    const parts = raw.split(':');
    if (parts.length !== 3) return false;

    const [timestamp, user, providedHmac] = parts;

    // Recompute HMAC to verify integrity (prevents forgery)
    const payload = `${timestamp}:${user}`;
    const expectedHmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    // Timing-safe comparison of HMAC signatures
    if (!timingSafeCompare(providedHmac, expectedHmac)) return false;

    // Session expires after 24 hours
    const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
    const age = Date.now() - parseInt(timestamp, 10);
    if (isNaN(age) || age < 0 || age > SESSION_MAX_AGE_MS) return false;

    return true;
  } catch {
    return false;
  }
}

export async function checkAdminAuth(): Promise<boolean> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    return isValidSessionToken(token);
  } catch {
    return false;
  }
}

/**
 * Verifies that the Origin or Referer header matches the host for state-changing requests (CSRF protection).
 */
export function verifyCsrfOrigin(request: { headers: { get: (name: string) => string | null } }): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host');

  if (!origin) {
    const referer = request.headers.get('referer');
    if (referer && host) {
      try {
        const refUrl = new URL(referer);
        return refUrl.host === host;
      } catch {
        return false;
      }
    }
    return true;
  }

  if (!host) return false;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

export { ADMIN_COOKIE_NAME };

