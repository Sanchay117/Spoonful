const pad = (n: number) => String(n).padStart(2, '0');

const utcStamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

const localDate = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

export function buildReminderIcs(
  time: string,
  now: Date = new Date(),
  url: string = typeof location !== 'undefined' ? location.origin : 'https://spoonful.app'
): string {
  const [rawH = '09', rawM = '00'] = time.split(':');
  const hh = pad(Number(rawH) || 0);
  const mm = pad(Number(rawM) || 0);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Spoonful//Daily check-in//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:spoonful-check-in-${now.getTime()}@spoonful.app`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${localDate(now)}T${hh}${mm}00`,
    'DURATION:PT5M',
    'RRULE:FREQ=DAILY',
    "SUMMARY:How's your energy today?",
    'DESCRIPTION:Open Spoonful and pick Good\\, Okay or Low. Any answer is fine.',
    `URL:${url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    "DESCRIPTION:How's your energy today?",
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return `${lines.join('\r\n')}\r\n`;
}
