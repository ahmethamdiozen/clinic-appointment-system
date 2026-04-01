import { google } from 'googleapis';
import { env } from '../config/env';
import { AvailabilitySlot, TimeSlot } from '@dentabook/shared';
import {
  startOfDay,
  endOfDay,
  addMinutes,
  parseISO,
  format,
  getDay,
  isAfter,
} from 'date-fns';

function getAuthClient() {
  if (!env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not configured');
  }
  const credentials = JSON.parse(
    Buffer.from(env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8')
  );
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

export async function getAvailableSlots(
  calendarId: string,
  doctorId: string,
  doctorName: string,
  availabilitySlots: AvailabilitySlot[],
  date: string, // YYYY-MM-DD
  slotDurationMinutes = 30
): Promise<TimeSlot[]> {
  const targetDate = parseISO(date);
  const dayOfWeek = getDay(targetDate);

  const workingHours = availabilitySlots.find((s) => s.dayOfWeek === dayOfWeek);
  if (!workingHours) return [];

  const [startHour, startMin] = workingHours.startTime.split(':').map(Number);
  const [endHour, endMin] = workingHours.endTime.split(':').map(Number);

  const workStart = new Date(targetDate);
  workStart.setHours(startHour, startMin, 0, 0);

  const workEnd = new Date(targetDate);
  workEnd.setHours(endHour, endMin, 0, 0);

  const timeMin = startOfDay(targetDate).toISOString();
  const timeMax = endOfDay(targetDate).toISOString();

  let busyPeriods: { start: string; end: string }[] = [];

  try {
    const auth = getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });
    const freeBusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: calendarId }],
      },
    });

    busyPeriods =
      (freeBusyResponse.data.calendars?.[calendarId]?.busy as { start: string; end: string }[]) ??
      [];
  } catch (err) {
    console.warn('Google Calendar freebusy query failed, returning all slots as available:', err);
  }

  const slots: TimeSlot[] = [];
  let current = new Date(workStart);
  const now = new Date();

  while (current < workEnd) {
    const slotEnd = addMinutes(current, slotDurationMinutes);
    if (slotEnd > workEnd) break;

    if (!isAfter(current, now)) {
      current = slotEnd;
      continue;
    }

    const overlaps = busyPeriods.some((busy) => {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      return current < busyEnd && slotEnd > busyStart;
    });

    if (!overlaps) {
      slots.push({
        doctorId,
        doctorName,
        startTime: current.toISOString(),
        endTime: slotEnd.toISOString(),
      });
    }

    current = slotEnd;
  }

  return slots;
}

export async function createCalendarEvent(params: {
  calendarId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendeeEmail?: string;
}): Promise<string> {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const event = await calendar.events.insert({
    calendarId: params.calendarId,
    requestBody: {
      summary: params.title,
      description: params.description,
      start: { dateTime: params.startTime.toISOString() },
      end: { dateTime: params.endTime.toISOString() },
      attendees: params.attendeeEmail ? [{ email: params.attendeeEmail }] : [],
      reminders: { useDefault: false },
    },
  });

  return event.data.id!;
}

export async function deleteCalendarEvent(
  calendarId: string,
  eventId: string
): Promise<void> {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  await calendar.events.delete({ calendarId, eventId });
}

export function formatSlotsForVapi(slots: TimeSlot[]): string {
  if (slots.length === 0) return 'No available slots found for that date.';

  const lines = slots.slice(0, 5).map((s) => {
    const start = parseISO(s.startTime);
    return `${s.doctorName} at ${format(start, 'h:mm a')}`;
  });

  return `Available slots: ${lines.join(', ')}.`;
}
