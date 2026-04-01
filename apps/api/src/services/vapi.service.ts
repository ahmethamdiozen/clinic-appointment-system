import { prisma } from '../config/prisma';
import { getAvailableSlots, createCalendarEvent, formatSlotsForVapi } from './calendar.service';
import { sendConfirmationSMS } from './notification.service';
import { AvailabilitySlot } from '@dentabook/shared';
import { addMinutes, parseISO } from 'date-fns';

interface CheckAvailabilityParams {
  specialty?: string;
  preferredDate?: string; // YYYY-MM-DD
}

interface BookAppointmentParams {
  patientName: string;
  patientPhone: string;
  doctorId: string;
  startTime: string; // ISO datetime
  reason?: string;
}

export async function checkAvailability(params: CheckAvailabilityParams): Promise<string> {
  const { specialty, preferredDate } = params;

  const date = preferredDate ?? new Date().toISOString().split('T')[0];

  const doctors = await prisma.doctor.findMany({
    where: {
      isActive: true,
      ...(specialty
        ? { specialty: { contains: specialty, mode: 'insensitive' } }
        : {}),
    },
  });

  if (doctors.length === 0) {
    return `I'm sorry, we don't have any available doctors for ${specialty ?? 'that specialty'} right now. Can I help you with anything else?`;
  }

  const allSlots = await Promise.all(
    doctors.map((doc) =>
      getAvailableSlots(
        doc.googleCalendarId,
        doc.id,
        doc.name,
        doc.availabilitySlots as unknown as AvailabilitySlot[],
        date
      )
    )
  );

  const slots = allSlots.flat();

  return formatSlotsForVapi(slots);
}

export async function bookAppointment(params: BookAppointmentParams): Promise<string> {
  const { patientName, patientPhone, doctorId, startTime, reason } = params;

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    return 'Sorry, I could not find that doctor. Please call back and try again.';
  }

  const patient = await prisma.patient.upsert({
    where: { phone: patientPhone },
    update: { name: patientName },
    create: { name: patientName, phone: patientPhone },
  });

  const start = parseISO(startTime);
  const end = addMinutes(start, 30);

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      startTime: start,
      endTime: end,
      reason,
      source: 'VOICE',
      status: 'SCHEDULED',
    },
    include: { patient: true, doctor: true },
  });

  // Create Google Calendar event
  try {
    const eventId = await createCalendarEvent({
      calendarId: doctor.googleCalendarId,
      title: `Appointment — ${patient.name}`,
      description: reason ?? 'Dental appointment booked via phone',
      startTime: start,
      endTime: end,
      attendeeEmail: patient.email ?? undefined,
    });

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { googleCalendarEventId: eventId },
    });
  } catch (err) {
    console.error('[Vapi] Failed to create Google Calendar event:', err);
  }

  // Send SMS confirmation
  try {
    await sendConfirmationSMS(appointment);
  } catch (err) {
    console.error('[Vapi] Failed to send confirmation SMS:', err);
  }

  return (
    `Great! Your appointment with ${doctor.name} has been confirmed for ` +
    `${start.toDateString()} at ${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}. ` +
    `You'll receive a confirmation text shortly. Is there anything else I can help you with?`
  );
}
