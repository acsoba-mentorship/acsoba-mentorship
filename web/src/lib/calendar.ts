export type CalendarEventDetails = {
  title: string;
  description?: string;
  location?: string;
  startAt: number;
  endAt: number;
};

export type CalendarProviderLink = {
  provider: "Google" | "Outlook" | "Office 365" | "Yahoo";
  href: string;
};

function toUtcCalendarTimestamp(timestamp: number) {
  return new Date(timestamp)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function toIsoTimestamp(timestamp: number) {
  return new Date(timestamp).toISOString();
}

function buildSearchParams(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  return searchParams.toString();
}

function getGoogleCalendarUrl(event: CalendarEventDetails) {
  const query = buildSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toUtcCalendarTimestamp(event.startAt)}/${toUtcCalendarTimestamp(event.endAt)}`,
    details: event.description,
    location: event.location,
  });

  return `https://calendar.google.com/calendar/render?${query}`;
}

function getOutlookCalendarUrl(
  baseUrl: "https://outlook.live.com/calendar/0/deeplink/compose" | "https://outlook.office.com/calendar/0/deeplink/compose",
  event: CalendarEventDetails
) {
  const query = buildSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: toIsoTimestamp(event.startAt),
    enddt: toIsoTimestamp(event.endAt),
    body: event.description,
    location: event.location,
  });

  return `${baseUrl}?${query}`;
}

function getYahooCalendarUrl(event: CalendarEventDetails) {
  const query = buildSearchParams({
    v: "60",
    view: "d",
    type: "20",
    title: event.title,
    st: toUtcCalendarTimestamp(event.startAt),
    et: toUtcCalendarTimestamp(event.endAt),
    desc: event.description,
    in_loc: event.location,
  });

  return `https://calendar.yahoo.com/?${query}`;
}

export function buildExternalCalendarLinks(
  event: CalendarEventDetails
): CalendarProviderLink[] {
  return [
    {
      provider: "Google",
      href: getGoogleCalendarUrl(event),
    },
    {
      provider: "Outlook",
      href: getOutlookCalendarUrl(
        "https://outlook.live.com/calendar/0/deeplink/compose",
        event
      ),
    },
    {
      provider: "Office 365",
      href: getOutlookCalendarUrl(
        "https://outlook.office.com/calendar/0/deeplink/compose",
        event
      ),
    },
    {
      provider: "Yahoo",
      href: getYahooCalendarUrl(event),
    },
  ];
}

function escapeIcsValue(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function foldIcsLine(line: string) {
  const maxLength = 74;

  if (line.length <= maxLength) {
    return line;
  }

  const chunks: string[] = [];
  let remaining = line;

  while (remaining.length > maxLength) {
    chunks.push(remaining.slice(0, maxLength));
    remaining = ` ${remaining.slice(maxLength)}`;
  }

  chunks.push(remaining);

  return chunks.join("\r\n");
}

export function buildIcsContent(event: CalendarEventDetails) {
  const uid = `${event.startAt}-${event.endAt}-${event.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Shepherds Programme//Mentorship Portal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@shepherds-programme`,
    `DTSTAMP:${toUtcCalendarTimestamp(Date.now())}`,
    `DTSTART:${toUtcCalendarTimestamp(event.startAt)}`,
    `DTEND:${toUtcCalendarTimestamp(event.endAt)}`,
    `SUMMARY:${escapeIcsValue(event.title)}`,
    event.description
      ? `DESCRIPTION:${escapeIcsValue(event.description)}`
      : undefined,
    event.location ? `LOCATION:${escapeIcsValue(event.location)}` : undefined,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean) as string[];

  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

export function buildIcsDataUri(event: CalendarEventDetails) {
  return `data:text/calendar;charset=utf8,${encodeURIComponent(
    buildIcsContent(event)
  )}`;
}

export function buildIcsFileName(event: CalendarEventDetails) {
  const datePrefix = new Date(event.startAt).toISOString().slice(0, 10);
  const titleSlug = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${datePrefix}-${titleSlug || "mentoring-session"}.ics`;
}
