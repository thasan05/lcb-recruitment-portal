import crypto from 'crypto';
import { Candidate, CandidateStatus, CandidatePublicView, normalizeCandidateStatus } from '@/types';
import { isSupabaseConfigured, supabaseAdmin, supabaseClient } from '../supabase';
import seedCandidatesRaw from './candidates-seed.json';

// Compact cryptographic token length: 24 hex characters (96 bits of entropy, unguessable, short & mobile-friendly)
export const SECURE_TOKEN_LENGTH = 24;

// Generate unguessable cryptographic token for candidate access (compact 24-char random hex hash, zero names)
export function generateSecureToken(): string {
  return crypto.randomBytes(12).toString('hex');
}

// Ensures a token is strictly a shortened 24-character encrypted random hex hash with ZERO names
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
  // If already a clean hex string, return first 24 characters
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
function normalizeCandidateRow(row: any): Candidate {
  return {
    id: row.id,
    name: row.name || row.full_name || 'Candidate',
    email: row.email,
    status: normalizeCandidateStatus(row.status),
    secure_token: ensureHashedToken(row.secure_token, row.id),
    email_sent: Boolean(row.email_sent),
    email_sent_at: row.email_sent_at || null,
    created_at: row.created_at || row.application_date || new Date().toISOString(),
    updated_at: row.updated_at || row.last_updated || new Date().toISOString(),
  };
}

if (!globalStore.__lcbCandidates) {
  const seeded = (seedCandidatesRaw as any[]).map((row) => normalizeCandidateRow(row));
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

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      let query = supabaseAdmin
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchQuery && searchQuery.trim()) {
        const q = `%${searchQuery.trim().toLowerCase()}%`;
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
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
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
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }

  return list.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getCandidateById(id: string): Promise<Candidate | null> {
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

export async function getCandidateBySecureToken(
  token: string
): Promise<CandidatePublicView | null> {
  if (!token || token.trim().length === 0) return null;

  const cleanToken = token.trim().toLowerCase();

  const toPublicView = (
    row: any,
    canonicalToken: string,
    isLegacyToken: boolean
  ): CandidatePublicView | null => {
    const createdAt = row.created_at || row.application_date || row.date_added;
    const expired = isTokenExpired(createdAt);
    const expiredAt = createdAt
      ? new Date(new Date(createdAt).getTime() + TOKEN_EXPIRATION_MS).toISOString()
      : undefined;

    return {
      name: row.name || row.full_name || 'Candidate',
      status: normalizeCandidateStatus(row.status),
      updated_at: row.updated_at || row.last_updated || new Date().toISOString(),
      created_at: createdAt || undefined,
      is_expired: expired,
      expired_at: expiredAt,
      canonicalToken,
      isLegacyToken,
    };
  };

  const matchesCandidate = (candToken: string | undefined, candId: string) => {
    if (!candToken) return false;
    const raw = candToken.toLowerCase().trim();
    const canonical = ensureHashedToken(candToken, candId).toLowerCase().trim();
    return (
      raw === cleanToken ||
      canonical === cleanToken ||
      raw.startsWith(cleanToken) ||
      cleanToken.startsWith(raw) ||
      canonical.startsWith(cleanToken) ||
      cleanToken.startsWith(canonical) ||
      raw.slice(0, SECURE_TOKEN_LENGTH) === cleanToken.slice(0, SECURE_TOKEN_LENGTH) ||
      canonical.slice(0, SECURE_TOKEN_LENGTH) === cleanToken.slice(0, SECURE_TOKEN_LENGTH) ||
      ensureHashedToken(cleanToken, candId) === canonical
    );
  };

  // 1. Query Supabase FIRST if configured (primary authoritative database)
  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data: allRows, error } = await supabaseAdmin.from('candidates').select('*');
      if (!error && allRows) {
        for (const row of allRows) {
          const canonical = ensureHashedToken(row.secure_token, row.id);
          if (matchesCandidate(row.secure_token, row.id)) {
            const isExactCanonical = cleanToken === canonical && /^[a-f0-9]{24}$/.test(cleanToken);
            return toPublicView(row, canonical, !isExactCanonical);
          }
        }
      }
    } catch (err) {
      console.warn('Supabase token lookup failed:', err);
    }
  }

  // 2. Check in-memory store as fallback
  for (const c of memoryCandidates) {
    const canonical = ensureHashedToken(c.secure_token, c.id);
    if (matchesCandidate(c.secure_token, c.id)) {
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
  const now = new Date().toISOString();
  const cleanName = updates.name ? updates.name.trim() : undefined;
  const cleanEmail = updates.email ? updates.email.trim().toLowerCase() : undefined;
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
    // If candidate came from Supabase or was not in memory, pull existing record and store in memory
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
      const patchObj: Record<string, any> = { last_updated: now };
      if (cleanName) patchObj.full_name = cleanName;
      if (cleanEmail) patchObj.email = cleanEmail;
      if (normStatus) patchObj.status = normStatus;

      const { data, error } = await supabaseAdmin
        .from('candidates')
        .update(patchObj)
        .eq('id', id)
        .select('*')
        .maybeSingle();

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
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.name.trim();
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
    } catch (err: any) {
      console.warn('Supabase createCandidate failed:', err?.message);
    }
  }

  // Prepend to memory store so it appears at top of candidate list
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

export async function importCandidates(
  entries: { name: string; email: string }[]
): Promise<ImportResult> {
  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const entry of entries) {
    const cleanEmail = entry.email.trim().toLowerCase();
    const cleanName = entry.name.trim();

    if (!cleanEmail || !cleanName) {
      errors.push(`Skipped row with missing name or email: ${JSON.stringify(entry)}`);
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
          const insertPayload: Record<string, any> = {
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
      } catch (err: any) {
        console.warn('Supabase import caught error:', err?.message);
      }
    }

    // Always maintain or update in-memory record on globalThis to guarantee responsiveness
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
      // Delete all candidates from Supabase
      const { error } = await supabaseAdmin
        .from('candidates')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        console.warn('Supabase reset candidates notice:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase reset caught error:', err?.message);
    }
  }

  return { success: true, count };
}

export async function purgeExpiredCandidates(days = TOKEN_EXPIRATION_DAYS): Promise<{ count: number }> {
  const thresholdTime = Date.now() - days * 24 * 60 * 60 * 1000;
  const thresholdIso = new Date(thresholdTime).toISOString();
  let count = 0;

  // Clear expired in-memory entries
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
    } catch (err: any) {
      console.warn('Supabase purge caught error:', err?.message);
    }
  }

  return { count };
}

