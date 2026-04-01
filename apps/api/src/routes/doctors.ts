import { Router, Response } from 'express';
import { prisma } from '../config/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { AppError } from '../middleware/error';
import { CreateDoctorSchema, UpdateDoctorSchema, AvailabilitySlot } from '@dentabook/shared';
import { getAvailableSlots } from '../services/calendar.service';
import { z } from 'zod';

const router: ReturnType<typeof Router> = Router();
router.use(authenticate);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const doctors = await prisma.doctor.findMany({ orderBy: { name: 'asc' } });
  res.json(doctors);
});

router.post('/', validateBody(CreateDoctorSchema), async (req: AuthRequest, res: Response) => {
  const doctor = await prisma.doctor.create({ data: req.body });
  res.status(201).json(doctor);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: req.params.id },
    include: {
      appointments: {
        orderBy: { startTime: 'desc' },
        take: 10,
        include: { patient: true },
      },
    },
  });
  if (!doctor) throw new AppError(404, 'Doctor not found');
  res.json(doctor);
});

router.patch('/:id', validateBody(UpdateDoctorSchema), async (req: AuthRequest, res: Response) => {
  const doctor = await prisma.doctor.findUnique({ where: { id: req.params.id } });
  if (!doctor) throw new AppError(404, 'Doctor not found');

  const updated = await prisma.doctor.update({ where: { id: req.params.id }, data: req.body });
  res.json(updated);
});

const AvailabilityQuerySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

router.get('/:id/availability', async (req: AuthRequest, res: Response) => {
  const query = AvailabilityQuerySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: 'date parameter required (YYYY-MM-DD)' });
    return;
  }

  const doctor = await prisma.doctor.findUnique({ where: { id: req.params.id } });
  if (!doctor) throw new AppError(404, 'Doctor not found');

  const slots = await getAvailableSlots(
    doctor.googleCalendarId,
    doctor.id,
    doctor.name,
    doctor.availabilitySlots as unknown as AvailabilitySlot[],
    query.data.date
  );

  res.json(slots);
});

export default router;
