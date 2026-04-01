import { Router, Response } from 'express';
import { prisma } from '../config/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { AppError } from '../middleware/error';
import {
  CreateAppointmentSchema,
  UpdateAppointmentSchema,
  AppointmentQuerySchema,
} from '@dentabook/shared';
import { createCalendarEvent, deleteCalendarEvent } from '../services/calendar.service';
import { sendConfirmationSMS } from '../services/notification.service';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

const router: ReturnType<typeof Router> = Router();
router.use(authenticate);

router.get('/', validateQuery(AppointmentQuerySchema), async (req: AuthRequest, res: Response) => {
  const query = req.query as unknown as {
    status?: string;
    doctorId?: string;
    date?: string;
    page: number;
    limit: number;
  };
  const { status, doctorId, date, page, limit } = query;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (doctorId) where.doctorId = doctorId;
  if (date) {
    const d = parseISO(date as string);
    where.startTime = { gte: startOfDay(d), lte: endOfDay(d) };
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: { patient: true, doctor: true },
      orderBy: { startTime: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.appointment.count({ where }),
  ]);

  res.json({ appointments, total, page, limit });
});

router.post('/', validateBody(CreateAppointmentSchema), async (req: AuthRequest, res: Response) => {
  const { patientId, doctorId, startTime, endTime, reason, notes } = req.body;

  const [patient, doctor] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId } }),
    prisma.doctor.findUnique({ where: { id: doctorId } }),
  ]);

  if (!patient) throw new AppError(404, 'Patient not found');
  if (!doctor) throw new AppError(404, 'Doctor not found');

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      reason,
      notes,
      source: 'WEB',
    },
    include: { patient: true, doctor: true },
  });

  // Fire-and-forget: calendar + SMS
  createCalendarEvent({
    calendarId: doctor.googleCalendarId,
    title: `Appointment — ${patient.name}`,
    description: reason ?? 'Dental appointment',
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    attendeeEmail: patient.email ?? undefined,
  })
    .then((eventId) =>
      prisma.appointment.update({
        where: { id: appointment.id },
        data: { googleCalendarEventId: eventId },
      })
    )
    .catch(console.error);

  sendConfirmationSMS(appointment).catch(console.error);

  res.status(201).json(appointment);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    include: { patient: true, doctor: true },
  });
  if (!appointment) throw new AppError(404, 'Appointment not found');
  res.json(appointment);
});

router.patch('/:id', validateBody(UpdateAppointmentSchema), async (req: AuthRequest, res: Response) => {
  const appointment = await prisma.appointment.findUnique({ where: { id: req.params.id } });
  if (!appointment) throw new AppError(404, 'Appointment not found');

  const updated = await prisma.appointment.update({
    where: { id: req.params.id },
    data: req.body,
    include: { patient: true, doctor: true },
  });

  res.json(updated);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    include: { doctor: true },
  });
  if (!appointment) throw new AppError(404, 'Appointment not found');

  await prisma.appointment.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' },
  });

  if (appointment.googleCalendarEventId && appointment.doctor?.googleCalendarId) {
    deleteCalendarEvent(
      appointment.doctor.googleCalendarId,
      appointment.googleCalendarEventId
    ).catch(console.error);
  }

  res.json({ message: 'Appointment cancelled' });
});

export default router;
