import { Router, Response } from 'express';
import { prisma } from '../config/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays, format } from 'date-fns';

const router: ReturnType<typeof Router> = Router();
router.use(authenticate);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const now = new Date();

  const [todayCount, weekCount, totalPatients, activeDoctors, bySource, last7Days] =
    await Promise.all([
      prisma.appointment.count({
        where: {
          startTime: { gte: startOfDay(now), lte: endOfDay(now) },
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.appointment.count({
        where: {
          startTime: { gte: startOfWeek(now), lte: endOfWeek(now) },
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.patient.count(),
      prisma.doctor.count({ where: { isActive: true } }),
      prisma.appointment.groupBy({
        by: ['source'],
        _count: { source: true },
        where: { status: { not: 'CANCELLED' } },
      }),
      // Last 7 days daily counts
      Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const d = subDays(now, 6 - i);
          return prisma.appointment
            .count({
              where: {
                startTime: { gte: startOfDay(d), lte: endOfDay(d) },
                status: { not: 'CANCELLED' },
              },
            })
            .then((count) => ({ date: format(d, 'MMM d'), count }));
        })
      ),
    ]);

  res.json({
    todayCount,
    weekCount,
    totalPatients,
    activeDoctors,
    bySource: Object.fromEntries(bySource.map((r) => [r.source, r._count.source])),
    last7Days,
  });
});

export default router;
