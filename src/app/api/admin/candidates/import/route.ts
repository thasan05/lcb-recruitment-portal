import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { importCandidates } from '@/lib/db';

export async function POST(request: NextRequest) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rows: { name?: string; email?: string }[] = body.candidates || [];

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'No valid candidate rows provided for import' },
        { status: 400 }
      );
    }

    const cleanRows = rows
      .filter((r) => r.name && r.email)
      .map((r) => ({
        name: String(r.name).trim(),
        email: String(r.email).trim().toLowerCase(),
      }));

    if (cleanRows.length === 0) {
      return NextResponse.json(
        { error: 'No valid rows with both name and email found.' },
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
