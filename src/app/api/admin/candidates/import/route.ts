import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { createCandidate } from '@/lib/db';
import { CandidateStatus } from '@/types';

export async function POST(req: NextRequest) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { rows } = await req.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'Valid rows array is required for import' },
        { status: 400 }
      );
    }

    const results = {
      imported: 0,
      failed: 0,
      errors: [] as string[],
      candidates: [] as any[],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      const name = row.name || row.Name || row.full_name || row['Full Name'];
      const email = row.email || row.Email || row['Email Address'];
      const phone = row.phone || row.Phone || row['Phone Number'] || '+880 1700-000000';
      const position = row.position || row.Position || 'Campus Lead';
      const department = row.department || row.Department || 'Campus Division';
      const campaign = row.campaign || row.Campaign || 'LCB Central Team Recruitment — 2026';
      const rawStatus = (row.status || row.Status || 'APPLICATION_RECEIVED')
        .toUpperCase()
        .replace(/\s+/g, '_');

      if (!name || !email) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Name and Email are mandatory.`);
        continue;
      }

      try {
        const candidate = await createCandidate(
          {
            full_name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            position: position.trim(),
            department: department.trim(),
            campaign: campaign.trim(),
            status: (rawStatus as CandidateStatus) || 'APPLICATION_RECEIVED',
            notes: row.notes || 'Imported via CSV',
          },
          'LCB HR Bulk Import'
        );

        results.imported++;
        results.candidates.push({
          id: candidate.id,
          name: candidate.full_name,
          application_id: candidate.application_id,
          secure_token: candidate.secure_token,
        });
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Row ${rowNum} (${name}): ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.imported,
      failed: results.failed,
      errors: results.errors,
      candidates: results.candidates,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Bulk import failed', details: error.message },
      { status: 500 }
    );
  }
}
