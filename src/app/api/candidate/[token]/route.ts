import { NextRequest, NextResponse } from 'next/server';
import { getCandidateBySecureToken, isValidTokenFormat } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Rate limiter for candidate token lookups to protect against brute force / enumeration
const lookupAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOOKUPS = 60; // 60 lookups per 15 minutes per IP
const WINDOW_MS = 15 * 60 * 1000;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = lookupAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    lookupAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > MAX_LOOKUPS) {
    return true;
  }
  return false;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': '900',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  }

  try {
    const { token } = await params;
    const cleanToken = (token || '').trim();

    // Validate token format and length before querying to prevent enumeration attacks
    if (!cleanToken || !isValidTokenFormat(cleanToken)) {
      return NextResponse.json(
        { error: 'Application not found or link has expired' },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          },
        }
      );
    }

    const candidate = await getCandidateBySecureToken(cleanToken);
    if (!candidate) {
      // Generic error response — never reveal whether a token format was recognized
      return NextResponse.json(
        { error: 'Application not found or link has expired' },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          },
        }
      );
    }

    // Only return public-safe candidate status fields (never phone, internal IDs, email, or other candidates' data)
    return NextResponse.json(
      {
        candidate: {
          name: candidate.name,
          status: candidate.status,
          updated_at: candidate.updated_at,
          is_expired: candidate.is_expired,
          expired_at: candidate.expired_at,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  } catch {
    // Redact internal error details from response
    return NextResponse.json(
      { error: 'Unable to retrieve recruitment status' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  }
}
