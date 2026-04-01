import { Router } from 'express';
import authRoutes from './auth';
import appointmentRoutes from './appointments';
import doctorRoutes from './doctors';
import patientRoutes from './patients';
import statsRoutes from './stats';
import webhookRoutes from './webhooks';

const router: ReturnType<typeof Router> = Router();

router.use('/auth', authRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/doctors', doctorRoutes);
router.use('/patients', patientRoutes);
router.use('/stats', statsRoutes);
router.use('/webhooks', webhookRoutes);

export default router;
