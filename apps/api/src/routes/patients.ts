import { Router, Response } from 'express';
import { prisma } from '../config/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { AppError } from '../middleware/error';
import { CreatePatientSchema, UpdatePatientSchema } from '@dentabook/shared';

const router: ReturnType<typeof Router> = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const search = req.query.search as string | undefined;

  const patients = await prisma.patient.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        }
      : undefined,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json(patients);
});

router.post('/', validateBody(CreatePatientSchema), async (req: AuthRequest, res: Response) => {
  const patient = await prisma.patient.create({ data: req.body });
  res.status(201).json(patient);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const patient = await prisma.patient.findUnique({
    where: { id: req.params.id },
    include: {
      appointments: {
        orderBy: { startTime: 'desc' },
        include: { doctor: true },
      },
    },
  });
  if (!patient) throw new AppError(404, 'Patient not found');
  res.json(patient);
});

router.patch('/:id', validateBody(UpdatePatientSchema), async (req: AuthRequest, res: Response) => {
  const patient = await prisma.patient.findUnique({ where: { id: req.params.id } });
  if (!patient) throw new AppError(404, 'Patient not found');

  const updated = await prisma.patient.update({ where: { id: req.params.id }, data: req.body });
  res.json(updated);
});

export default router;
