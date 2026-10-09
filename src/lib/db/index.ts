import crypto from 'crypto';
import { Candidate, CandidateStatus, CandidatePublicView, normalizeCandidateStatus } from '@/types';
import { isSupabaseConfigured, supabaseAdmin } from '../supabase';
import seedCandidatesRaw from './candidates-seed.json';

// Compact cryptographic token length: 24 hex characters (96 bits of entropy, unguessable, short & mobile-friendly)
export const SECURE_TOKEN_LENGTH = 24;

// Generate unguessable cryptographic token for candidate access (compact 24-char random hex, 96 bits entropy)
export function generateSecureToken(): string {
  return crypto.randomBytes(12).toString('hex');
}

/**
 * Validates token string format and minimum length to prevent enumeration / wildcard attacks.
 */
export function isValidTokenFormat(token: string | undefined): boolean {
  if (!token) return false;
  const clean = token.trim().toLowerCase();
  // Modern canonical token: exactly 24 hexadecimal characters
  if (/^[a-f0-9]{24}$/.test(clean)) return true;
  // Legacy token format: tok_lcb_<alphanumeric_and_underscore>
  if (/^tok_lcb_[a-z0-9_]{6,40}$/.test(clean)) return true;
  return false;
}

/**
 * Formula injection sanitizer: neutralizes spreadsheet formula prefixes (=, +, -, @, \t, \r)
 */
export function sanitizeSpreadsheetCell(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

// Ensures a token is strictly a shortened 24-character random hex hash with ZERO names
export function ensureHashedToken(token: string | undefined, id: string): string {
  if (!token) {
    return crypto.createHash('sha256').update('lcb_salt_token_' + id).digest('hex').slice(0, SECURE_TOKEN_LENGTH);
  }
  const clean = token.trim().toLowerCase();
  // If token has names, prefixes (tok_), underscores, or non-hex characters
  if (
    clean.startsWith('tok_') ||
    clean.includes('_') ||
    !/^[a-f0-9]+$/.test(clean) ||
    /rahim|tanvir|sadia|nusrat|mehedi|lcb|demo|test/i.test(clean)
  ) {
    return crypto.createHash('sha256').update('lcb_salt_token_' + id).digest('hex').slice(0, SECURE_TOKEN_LENGTH);
  }
  // If already a clean hex string of appropriate length, return first 24 characters
  return clean.slice(0, SECURE_TOKEN_LENGTH);
}

// Token lifetime is 90 days to protect resources and cycle boundaries
export const TOKEN_EXPIRATION_DAYS = 90;
export const TOKEN_EXPIRATION_MS = TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

export function isTokenExpired(createdAt?: string | null): boolean {
  if (!createdAt) return false;
  const createdTime = new Date(createdAt).getTime();
  if (isNaN(createdTime)) return false;
  return Date.now() - createdTime > TOKEN_EXPIRATION_MS;
}

// In-Memory fallback store attached to globalThis to ensure sharing across Next.js App Router server chunks
const globalStore = globalThis as unknown as {
  __lcbCandidates?: Candidate[];
};

// Helper to normalize Supabase or seed row to Candidate interface
function normalizeCandidateRow(row: Record<string, unknown>): Candidate {
  const nameVal = (row.name ?? row.full_name ?? 'Candidate') as string;
  const emailVal = (row.email ?? '') as string;
  const statusVal = (row.status ?? 'decision_pending') as string;
  const tokenVal = (row.secure_token ?? '') as string;
  const idVal = (row.id ?? '') as string;
  const createdAtVal = (row.created_at ?? row.application_date ?? new Date().toISOString()) as string;
  const updatedAtVal = (row.updated_at ?? row.last_updated ?? new Date().toISOString()) as string;

  return {
    id: idVal,
    name: sanitizeSpreadsheetCell(nameVal).slice(0, 100),
    email: emailVal.trim().toLowerCase().slice(0, 254),
    status: normalizeCandidateStatus(statusVal),
    secure_token: ensureHashedToken(tokenVal, idVal),
    email_sent: Boolean(row.email_sent),
    email_sent_at: (row.email_sent_at as string | null) || null,
    created_at: createdAtVal,
    updated_at: updatedAtVal,
  };
}

if (!globalStore.__lcbCandidates) {
  const seeded = (seedCandidatesRaw as unknown as Record<string, unknown>[]).map((row) => normalizeCandidateRow(row));
  globalStore.__lcbCandidates = seeded;
}

const memoryCandidates: Candidate[] = globalStore.__lcbCandidates;

// Proactively sanitize all existing memory candidate tokens to guarantee 24-character hex format with ZERO names
for (const cand of memoryCandidates) {
  cand.secure_token = ensureHashedToken(cand.secure_token, cand.id);
}

export async function getCandidates(searchQuery?: string): Promise<Candidate[]> {
  const candidatesMap = new Map<string, Candidate>();
  let fetchedFromSupabase = false;

  // Sanitize search query to prevent PostgREST injection via commas or parentheses
  const sanitizedSearch = searchQuery
    ? searchQuery.trim().toLowerCase().replace(/[^a-z0-9@._\s-]/g, '').slice(0, 50)
    : undefined;

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      let query = supabaseAdmin
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (sanitizedSearch) {
        const q = `%${sanitizedSearch}%`;
        query = query.or(`name.ilike.${q},email.ilike.${q},full_name.ilike.${q}`);
      }

      const { data, error } = await query;
      if (!error && data) {
        fetchedFromSupabase = true;
        for (const row of data) {
          const c = normalizeCandidateRow(row);
          candidatesMap.set(c.id, c);
        }
      } else if (error) {
        console.warn('Supabase query error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase connection failed:', err);
    }
  }

  // If Supabase is configured and connected, return Supabase candidates directly
  if (fetchedFromSupabase) {
    let list = Array.from(candidatesMap.values());
    if (sanitizedSearch) {
      list = list.filter(
        (c) => c.name.toLowerCase().includes(sanitizedSearch) || c.email.toLowerCase().includes(sanitizedSearch)
      );
    }
    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Fallback to memory candidates only when Supabase is not connected
  for (const c of memoryCandidates) {
    const sanitizedCandidate: Candidate = {
      ...c,
      secure_token: ensureHashedToken(c.secure_token, c.id),
    };
    candidatesMap.set(c.id, sanitizedCandidate);
  }

  let list = Array.from(candidatesMap.values());
  if (sanitizedSearch) {
    list = list.filter(
      (c) => c.name.toLowerCase().includes(sanitizedSearch) || c.email.toLowerCase().includes(sanitizedSearch)
    );
  }

  return list.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getCandidateById(id: string): Promise<Candidate | null> {
  if (!id || typeof id !== 'string' || id.length > 64) return null;

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('candidates')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) {
        return normalizeCandidateRow(data);
      }
    } catch (err) {
      console.warn('Supabase getCandidateById failed:', err);
    }
  }

  const found = memoryCandidates.find((c) => c.id === id);
  return found
    ? {
        ...found,
        secure_token: ensureHashedToken(found.secure_token, found.id),
      }
    : null;
}

/**
 * Secure lookup of candidate by private bearer token.
 * 
 * SECURITY ENFORCEMENT:
 * 1. Requires valid token format and length (rejects short, wildcard, or malicious inputs).
 * 2. Uses STRICT EXACT MATCHING ONLY. No startsWith, no wildcards, no ilike substrings.
 * 3. Does NOT fall back to unrestricted table scans.
 * 4. Returns only the public-safe view (CandidatePublicView) to protect candidate privacy.
 */
export async function getCandidateBySecureToken(
  token: string
): Promise<CandidatePublicView | null> {
  if (!token || !isValidTokenFormat(token)) {
    return null;
  }

  const cleanToken = token.trim().toLowerCase();

  const toPublicView = (
    row: Candidate | Record<string, unknown>,
    canonicalToken: string,
    isLegacyToken: boolean
  ): CandidatePublicView => {
    const raw = row as Record<string, unknown>;
    const createdAt = (raw.created_at ?? raw.application_date ?? raw.date_added) as string | undefined;
    const nameVal = (raw.name ?? raw.full_name ?? 'Candidate') as string;
    const statusVal = (raw.status ?? 'decision_pending') as string;
    const updatedAtVal = (raw.updated_at ?? raw.last_updated ?? new Date().toISOString()) as string;
    const expired = isTokenExpired(createdAt);
    const expiredAt = createdAt
      ? new Date(new Date(createdAt).getTime() + TOKEN_EXPIRATION_MS).toISOString()
      : undefined;

    return {
      name: sanitizeSpreadsheetCell(nameVal).slice(0, 100),
      status: normalizeCandidateStatus(statusVal),
      updated_at: updatedAtVal,
      created_at: createdAt || undefined,
      is_expired: expired,
      expired_at: expiredAt,
      canonicalToken,
      isLegacyToken,
    };
  };

  // 1. Query Supabase FIRST using EXACT token match
  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data: matchedRow, error } = await supabaseAdmin
        .from('candidates')
        .select('*')
        .eq('secure_token', cleanToken)
        .maybeSingle();

      if (!error && matchedRow) {
        const canonical = ensureHashedToken(matchedRow.secure_token, matchedRow.id);
        const isExactCanonical = cleanToken === canonical && /^[a-f0-9]{24}$/.test(cleanToken);
        return toPublicView(matchedRow, canonical, !isExactCanonical);
      }
    } catch (err) {
      console.warn('Supabase exact token lookup failed:', err);
    }
  }

  // 2. Check in-memory store using STRICT EXACT MATCH ONLY
  for (const c of memoryCandidates) {
    const raw = (c.secure_token || '').toLowerCase().trim();
    const canonical = ensureHashedToken(c.secure_token, c.id).toLowerCase().trim();

    // STRICT EXACT MATCH ONLY
    if (raw === cleanToken || canonical === cleanToken) {
      const isExactCanonical = cleanToken === canonical && /^[a-f0-9]{24}$/.test(cleanToken);
      return toPublicView(c, canonical, !isExactCanonical);
    }
  }

  return null;
}

export async function updateCandidateDetails(
  id: string,
  updates: {
    name?: string;
    email?: string;
    status?: CandidateStatus;
  }
): Promise<Candidate | null> {
  if (!id || typeof id !== 'string') return null;

  const now = new Date().toISOString();
  const cleanName = updates.name ? sanitizeSpreadsheetCell(updates.name.trim()).slice(0, 100) : undefined;
  const cleanEmail = updates.email ? updates.email.trim().toLowerCase().slice(0, 254) : undefined;
  const normStatus = updates.status ? normalizeCandidateStatus(updates.status) : undefined;

  // 1. Update memory store
  let idx = memoryCandidates.findIndex((c) => c.id === id);
  if (idx === -1 && cleanEmail) {
    idx = memoryCandidates.findIndex((c) => c.email.toLowerCase() === cleanEmail);
  }

  let updatedCandidate: Candidate | null = null;

  if (idx !== -1) {
    memoryCandidates[idx] = {
      ...memoryCandidates[idx],
      ...(cleanName ? { name: cleanName } : {}),
      ...(cleanEmail ? { email: cleanEmail } : {}),
      ...(normStatus ? { status: normStatus } : {}),
      updated_at: now,
    };
    updatedCandidate = memoryCandidates[idx];
  } else {
    const existing = await getCandidateById(id);
    if (existing) {
      updatedCandidate = {
        ...existing,
        ...(cleanName ? { name: cleanName } : {}),
        ...(cleanEmail ? { email: cleanEmail } : {}),
        ...(normStatus ? { status: normStatus } : {}),
        updated_at: now,
      };
      memoryCandidates.unshift(updatedCandidate);
    }
  }

  // 2. Persist to Supabase if configured
  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const patchObj: Record<string, unknown> = { last_updated: now };
      if (cleanName) patchObj.full_name = cleanName;
      if (cleanEmail) patchObj.email = cleanEmail;
      if (normStatus) patchObj.status = normStatus;

      let { data, error } = await supabaseAdmin
        .from('candidates')
        .update(patchObj)
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if ((!data || error) && cleanEmail) {
        const emailUpdate = await supabaseAdmin
          .from('candidates')
          .update(patchObj)
          .eq('email', cleanEmail)
          .select('*')
          .maybeSingle();
        if (!emailUpdate.error && emailUpdate.data) {
          data = emailUpdate.data;
          error = null;
        }
      }

      if (!error && data) {
        const norm = normalizeCandidateRow(data);
        norm.updated_at = now;
        return norm;
      }
    } catch (err) {
      console.warn('Supabase candidate update failed:', err);
    }
  }

  return updatedCandidate;
}

export async function updateCandidateStatus(
  id: string,
  status: CandidateStatus
): Promise<Candidate | null> {
  return updateCandidateDetails(id, { status });
}

export async function createCandidate(data: {
  name: string;
  email: string;
  status?: CandidateStatus;
}): Promise<Candidate> {
  const cleanEmail = data.email.trim().toLowerCase().slice(0, 254);
  const cleanName = sanitizeSpreadsheetCell(data.name.trim()).slice(0, 100);
  const status: CandidateStatus = data.status || 'decision_pending';
  const token = generateSecureToken();
  const now = new Date().toISOString();
  const newId = crypto.randomUUID();

  let newCand: Candidate = {
    id: newId,
    name: cleanName,
    email: cleanEmail,
    status,
    secure_token: token,
    email_sent: false,
    email_sent_at: null,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const appId = 'LCB-2026-' + Math.floor(1000 + Math.random() * 9000);
      const { data: supaData, error: supaErr } = await supabaseAdmin
        .from('candidates')
        .insert({
          id: newId,
          application_id: appId,
          full_name: cleanName,
          email: cleanEmail,
          phone: 'N/A',
          position: 'Applicant',
          department: 'General',
          campaign: 'LCB Central Team Recruitment — 2026',
          status,
          secure_token: token,
          application_date: now,
          last_updated: now,
          created_at: now,
        })
        .select('*')
        .maybeSingle();

      if (!supaErr && supaData) {
        newCand = normalizeCandidateRow(supaData);
      }
    } catch (err: unknown) {
      console.warn('Supabase createCandidate failed:', err instanceof Error ? err.message : String(err));
    }
  }

  memoryCandidates.unshift(newCand);
  return newCand;
}

export async function markEmailSent(id: string): Promise<Candidate | null> {
  const now = new Date().toISOString();

  const idx = memoryCandidates.findIndex((c) => c.id === id);
  if (idx !== -1) {
    memoryCandidates[idx] = {
      ...memoryCandidates[idx],
      email_sent: true,
      email_sent_at: now,
      updated_at: now,
    };
  }

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('candidates')
        .update({
          email_sent: true,
          email_sent_at: now,
          last_updated: now,
        })
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (!error && data) {
        return normalizeCandidateRow(data);
      }
    } catch (err) {
      console.warn('Supabase markEmailSent failed:', err);
    }
  }

  if (idx !== -1) {
    return { ...memoryCandidates[idx] };
  }

  return null;
}

export interface ImportResult {
  totalParsed: number;
  inserted: number;
  updated: number;
  errors: string[];
}

export const MAX_IMPORT_ROWS = 500;

export async function importCandidates(
  entries: { name: string; email: string }[]
): Promise<ImportResult> {
  if (entries.length > MAX_IMPORT_ROWS) {
    throw new Error(`Exceeded maximum allowed import count of ${MAX_IMPORT_ROWS} candidates per batch.`);
  }

  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const entry of entries) {
    const cleanEmail = entry.email.trim().toLowerCase().slice(0, 254);
    const cleanName = sanitizeSpreadsheetCell(entry.name.trim()).slice(0, 100);

    if (!cleanEmail || !cleanName) {
      errors.push('Skipped row with missing name or email.');
      continue;
    }

    let savedToSupabase = false;
    const token = generateSecureToken();
    const now = new Date().toISOString();

    if (isSupabaseConfigured() && supabaseAdmin) {
      try {
        const { data: existing } = await supabaseAdmin
          .from('candidates')
          .select('id, secure_token, status')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (existing) {
          const { error: updErr } = await supabaseAdmin
            .from('candidates')
            .update({
              full_name: cleanName,
              last_updated: now,
            })
            .eq('id', existing.id);

          if (!updErr) {
            savedToSupabase = true;
            updated++;
          }
        } else {
          const newId = crypto.randomUUID();
          const appId = 'LCB-2026-' + newId.slice(0, 8).toUpperCase();
          const insertPayload: Record<string, unknown> = {
            id: newId,
            application_id: appId,
            full_name: cleanName,
            email: cleanEmail,
            phone: 'N/A',
            position: 'Applicant',
            department: 'General',
            campaign: 'LCB Central Team Recruitment — 2026',
            status: 'decision_pending',
            secure_token: token,
            application_date: now,
            last_updated: now,
            created_at: now,
          };

          const { error: insErr } = await supabaseAdmin.from('candidates').insert(insertPayload);
          if (!insErr) {
            savedToSupabase = true;
            inserted++;
          }
        }
      } catch (err: unknown) {
        console.warn('Supabase import caught error:', err instanceof Error ? err.message : String(err));
      }
    }

    // Update in-memory record
    const existingIdx = memoryCandidates.findIndex(
      (c) => c.email.toLowerCase() === cleanEmail
    );
    if (existingIdx !== -1) {
      memoryCandidates[existingIdx] = {
        ...memoryCandidates[existingIdx],
        name: cleanName,
        updated_at: now,
      };
      if (!savedToSupabase) updated++;
    } else {
      memoryCandidates.unshift({
        id: crypto.randomUUID(),
        name: cleanName,
        email: cleanEmail,
        status: 'decision_pending',
        secure_token: token,
        email_sent: false,
        email_sent_at: null,
        created_at: now,
        updated_at: now,
      });
      if (!savedToSupabase) inserted++;
    }
  }

  return {
    totalParsed: entries.length,
    inserted,
    updated,
    errors,
  };
}

export async function deleteCandidate(id: string): Promise<boolean> {
  if (!id || typeof id !== 'string') return false;

  const idx = memoryCandidates.findIndex((c) => c.id === id);
  if (idx !== -1) {
    memoryCandidates.splice(idx, 1);
  }

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.from('candidates').delete().eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase deleteCandidate failed:', err);
    }
  }

  return idx !== -1;
}

export async function resetAllCandidates(): Promise<{ success: boolean; count: number }> {
  const count = memoryCandidates.length;
  // Clear in-memory array completely
  memoryCandidates.splice(0, memoryCandidates.length);

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from('candidates')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        console.warn('Supabase reset candidates notice:', error.message);
      }
    } catch (err: unknown) {
      console.warn('Supabase reset caught error:', err instanceof Error ? err.message : String(err));
    }
  }

  return { success: true, count };
}

export async function purgeExpiredCandidates(days = TOKEN_EXPIRATION_DAYS): Promise<{ count: number }> {
  const thresholdTime = Date.now() - days * 24 * 60 * 60 * 1000;
  const thresholdIso = new Date(thresholdTime).toISOString();
  let count = 0;

  for (let i = memoryCandidates.length - 1; i >= 0; i--) {
    const item = memoryCandidates[i];
    if (new Date(item.created_at).getTime() < thresholdTime) {
      memoryCandidates.splice(i, 1);
      count++;
    }
  }

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('candidates')
        .delete()
        .lt('created_at', thresholdIso)
        .select('id');

      if (!error && data) {
        count = Math.max(count, data.length);
      }
    } catch (err: unknown) {
      console.warn('Supabase purge caught error:', err instanceof Error ? err.message : String(err));
    }
  }

  return { count };
}
