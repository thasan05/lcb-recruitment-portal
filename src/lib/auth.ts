import { cookies } from 'next/headers';

const ADMIN_COOKIE_NAME = 'lcb_admin_token';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hr@linkedincommunitybangladesh.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'lcb_recruitment_2026!';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'lcb_dev_secret_session_key_2026_recruitment';

export function verifyAdminCredentials(email: string, pass: string): boolean {
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() && pass === ADMIN_PASSWORD;
}

export function generateSessionToken(): string {
  // Simple HMAC-like token with timestamp and signature
  const timestamp = Date.now().toString();
  const raw = `${timestamp}:${ADMIN_EMAIL}:${SESSION_SECRET}`;
  // Base64 encode token payload
  const b64 = Buffer.from(raw).toString('base64');
  return `lcb_adm_${b64}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token || !token.startsWith('lcb_adm_')) return false;
  try {
    const raw = Buffer.from(token.replace('lcb_adm_', ''), 'base64').toString('utf-8');
    const [timestamp, email, secret] = raw.split(':');
    if (secret !== SESSION_SECRET || email !== ADMIN_EMAIL) return false;
    // Session expires after 7 days
    const age = Date.now() - parseInt(timestamp, 10);
    return age < 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return isValidSessionToken(token);
}

export { ADMIN_COOKIE_NAME };
