/**
 * Utility to generate and download standard iCalendar (.ics) files client-side
 * and to generate Google Calendar 1-click scheduling links for interview rounds.
 */

interface CalendarEventOptions {
  title: string;
  description?: string;
  location?: string;
  startDate: Date | string;
  endDate?: Date | string;
  durationMinutes?: number;
}

function formatDateToICS(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
}

/**
 * Generates an RFC 5545 formatted .ics blob and triggers a browser download.
 */
export function downloadIcsFile(options: CalendarEventOptions, fileName = 'interview.ics'): void {
  const start = new Date(options.startDate);
  const end = options.endDate
    ? new Date(options.endDate)
    : new Date(start.getTime() + (options.durationMinutes || 45) * 60 * 1000);

  const cleanDescription = (options.description || '').replace(/\n/g, '\\n').replace(/,/g, '\\,');
  const cleanTitle = options.title.replace(/,/g, '\\,');
  const cleanLocation = (options.location || '').replace(/,/g, '\\,');
  const dtStamp = formatDateToICS(new Date());
  const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@praman.app`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Praman Career Intelligence//Interview Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${formatDateToICS(start)}`,
    `DTEND:${formatDateToICS(end)}`,
    `SUMMARY:${cleanTitle}`,
    cleanDescription ? `DESCRIPTION:${cleanDescription}` : '',
    cleanLocation ? `LOCATION:${cleanLocation}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName.endsWith('.ics') ? fileName : `${fileName}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Creates a direct Google Calendar Web URL for 1-click event addition.
 */
export function getGoogleCalendarUrl(options: CalendarEventOptions): string {
  const start = new Date(options.startDate);
  const end = options.endDate
    ? new Date(options.endDate)
    : new Date(start.getTime() + (options.durationMinutes || 45) * 60 * 1000);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: options.title,
    dates: `${formatDateToICS(start)}/${formatDateToICS(end)}`,
  });

  if (options.description) {
    params.set('details', options.description);
  }
  if (options.location) {
    params.set('location', options.location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
