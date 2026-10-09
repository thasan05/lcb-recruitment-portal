import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth, verifyCsrfOrigin } from '@/lib/auth';
import { importCandidates, MAX_IMPORT_ROWS } from '@/lib/db';

export async function POST(request: NextRequest) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 });
  }

  try {
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > 1048576) { // 1 MB limit for import payload
      return NextResponse.json({ error: 'Import payload exceeds maximum size limit (1MB)' }, { status: 413 });
    }

    const body = await request.json();
    const rows: { name?: string; email?: string }[] = body.candidates || [];

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'No valid candidate rows provided for import' },
        { status: 400 }
      );
    }

    if (rows.length > MAX_IMPORT_ROWS) {
      return NextResponse.json(
        { error: `Import batch exceeds maximum allowed limit of ${MAX_IMPORT_ROWS} candidates.` },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanRows = rows
      .filter((r) => r.name && r.email)
      .map((r) => ({
        name: String(r.name).trim().slice(0, 100),
        email: String(r.email).trim().toLowerCase().slice(0, 254),
      }))
      .filter((r) => r.name.length > 0 && emailRegex.test(r.email));

    if (cleanRows.length === 0) {
      return NextResponse.json(
        { error: 'No valid rows with both valid name and email found.' },
        { status: 400 }
      );
    }

    const result = await importCandidates(cleanRows);

    return NextResponse.json({
      success: true,
      message: `Import completed: ${result.inserted} new candidate(s) created, ${result.updated} existing updated.`,
      result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message?.includes('maximum') ? err.message : 'Import failed due to server error.' },
      { status: 500 }
    );
  }
}
