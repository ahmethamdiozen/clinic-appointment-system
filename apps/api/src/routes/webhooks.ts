import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { checkAvailability, bookAppointment } from '../services/vapi.service';
import { deleteCalendarEvent } from '../services/calendar.service';

const router: ReturnType<typeof Router> = Router();

function verifyVapiSecret(req: Request, res: Response, next: () => void): void {
  if (!env.VAPI_WEBHOOK_SECRET) { next(); return; }

  const signature = req.headers['x-vapi-secret'];
  if (signature !== env.VAPI_WEBHOOK_SECRET) {
    res.status(401).json({ error: 'Invalid webhook secret' });
    return;
  }
  next();
}

// Vapi tool call webhook
router.post('/vapi', verifyVapiSecret, async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message || message.type !== 'tool-calls') {
    res.json({ results: [] });
    return;
  }

  const results = await Promise.all(
    message.toolCallList.map(async (toolCall: { id: string; function: { name: string; arguments: Record<string, unknown> } }) => {
      const { name, arguments: args } = toolCall.function;

      let result: string;
      try {
        if (name === 'checkAvailability') {
          result = await checkAvailability(args as { specialty?: string; preferredDate?: string });
        } else if (name === 'bookAppointment') {
          result = await bookAppointment(args as {
            patientName: string;
            patientPhone: string;
            doctorId: string;
            startTime: string;
            reason?: string;
          });
        } else {
          result = `Unknown tool: ${name}`;
        }
      } catch (err) {
        console.error(`[Vapi] Tool ${name} error:`, err);
        result = 'Sorry, something went wrong. Please try again.';
      }

      return { toolCallId: toolCall.id, result };
    })
  );

  res.json({ results });
});

// Twilio inbound SMS — handle CANCEL replies
router.post('/twilio', async (req: Request, res: Response) => {
  const from: string = req.body?.From ?? '';
  const body: string = (req.body?.Body ?? '').trim().toUpperCase();

  if (body !== 'CANCEL') {
    res.type('text/xml').send('<Response/>');
    return;
  }

  // Normalize phone: Twilio sends E.164 format (+1234567890)
  const patient = await prisma.patient.findUnique({ where: { phone: from } });

  if (!patient) {
    res.type('text/xml').send(
      `<Response><Message>We couldn't find your number in our system. Please call us directly.</Message></Response>`
    );
    return;
  }

  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const appointment = await prisma.appointment.findFirst({
    where: {
      patientId: patient.id,
      status: { in: ['SCHEDULED', 'CONFIRMED'] },
      startTime: { gte: twoHoursFromNow },
    },
    orderBy: { startTime: 'asc' },
    include: { doctor: true },
  });

  if (!appointment) {
    res.type('text/xml').send(
      `<Response><Message>No upcoming appointments found that can be cancelled (appointments must be cancelled 2+ hours in advance).</Message></Response>`
    );
    return;
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: 'CANCELLED' },
  });

  if (appointment.googleCalendarEventId && appointment.doctor?.googleCalendarId) {
    deleteCalendarEvent(
      appointment.doctor.googleCalendarId,
      appointment.googleCalendarEventId
    ).catch(console.error);
  }

  res.type('text/xml').send(
    `<Response><Message>Your appointment on ${appointment.startTime.toDateString()} has been cancelled. Call us to rebook. — DentaBook</Message></Response>`
  );
});

export default router;
