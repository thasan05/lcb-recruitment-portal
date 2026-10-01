import { Interview } from '@/types';

function parseDateTimeToISO(dateStr: string, timeStr: string): { startISO: string; endISO: string; gCalStart: string; gCalEnd: string } {
  // e.g. date: "2026-10-02", time: "09:20 PM" or "21:20"
  let hours = 21;
  let minutes = 20;

  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  // Bangladesh is GMT+6
  const pad = (n: number) => String(n).padStart(2, '0');
  const [year, month, day] = dateStr.split('-').map(Number);

  const startDate = new Date(Date.UTC(year, (month || 1) - 1, day || 1, hours - 6, minutes));
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 min duration default

  const formatGCal = (d: Date) =>
    d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  return {
    startISO: startDate.toISOString(),
    endISO: endDate.toISOString(),
    gCalStart: formatGCal(startDate),
    gCalEnd: formatGCal(endDate),
  };
}

export function generateGoogleCalendarUrl(
  interview: Interview,
  candidate: { full_name: string; position: string }
): string {
  const { gCalStart, gCalEnd } = parseDateTimeToISO(interview.date, interview.time);
  const title = encodeURIComponent(`LCB Interview — ${candidate.position} (${candidate.full_name})`);
  const details = encodeURIComponent(
    `LinkedIn Community Bangladesh Interview\n\nRole: ${candidate.position}\nInterviewer: ${interview.interviewer}\nMeeting Link: ${interview.meeting_link || 'See candidate portal'}\n\nInstructions: ${interview.instructions || 'Please join on time with camera enabled.'}`
  );
  const location = encodeURIComponent(interview.meeting_link || interview.meeting_platform || 'Google Meet');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${gCalStart}/${gCalEnd}&details=${details}&location=${location}`;
}

export function generateIcsContent(
  interview: Interview,
  candidate: { full_name: string; position: string }
): string {
  const { gCalStart, gCalEnd } = parseDateTimeToISO(interview.date, interview.time);
  const now = new Date().toISOString().replace(/-|:|\.\d\d\d/g, '');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LinkedIn Community Bangladesh//Recruitment Portal//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:lcb-interview-${interview.id}@linkedincommunitybangladesh.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${gCalStart}`,
    `DTEND:${gCalEnd}`,
    `SUMMARY:LCB Interview: ${candidate.position} - ${candidate.full_name}`,
    `DESCRIPTION:LCB Interview for ${candidate.position}\\nPlatform: ${interview.meeting_platform}\\nLink: ${interview.meeting_link || ''}\\nPanel: ${interview.interviewer}`,
    `LOCATION:${interview.meeting_link || interview.meeting_platform}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcsFile(
  interview: Interview,
  candidate: { full_name: string; position: string }
) {
  if (typeof window === 'undefined') return;
  const icsData = generateIcsContent(interview, candidate);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `lcb-interview-${interview.date}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
