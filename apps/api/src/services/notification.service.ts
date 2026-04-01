import twilio from 'twilio';
import { env } from '../config/env';
import { format } from 'date-fns';
import { prisma } from '../config/prisma';

function getClient() {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    return null;
  }
  return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
}

async function sendSMS(to: string, body: string): Promise<void> {
  const client = getClient();
  if (!client || !env.TWILIO_PHONE_NUMBER) {
    console.log(`[SMS MOCK] To: ${to}\n${body}`);
    return;
  }
  await client.messages.create({ to, from: env.TWILIO_PHONE_NUMBER, body });
}

type AppointmentWithRelations = {
  id: string;
  startTime: Date;
  patient: { name: string; phone: string };
  doctor: { name: string };
};

export async function sendConfirmationSMS(
  appointment: AppointmentWithRelations
): Promise<void> {
  const dateStr = format(appointment.startTime, 'EEEE, MMMM d');
  const timeStr = format(appointment.startTime, 'h:mm a');

  const message =
    `Hi ${appointment.patient.name}, your appointment with ` +
    `${appointment.doctor.name} is confirmed for ${dateStr} at ${timeStr}. ` +
    `Reply CANCEL to cancel. — DentaBook`;

  await sendSMS(appointment.patient.phone, message);

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { confirmationSent: true },
  });
}

export async function sendReminderSMS(
  appointment: AppointmentWithRelations
): Promise<void> {
  const timeStr = format(appointment.startTime, 'h:mm a');

  const message =
    `Reminder: You have an appointment with ${appointment.doctor.name} ` +
    `tomorrow at ${timeStr}. Reply CANCEL to cancel (2+ hours in advance). — DentaBook`;

  await sendSMS(appointment.patient.phone, message);

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { reminderSent: true },
  });
}
