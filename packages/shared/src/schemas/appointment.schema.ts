import { z } from 'zod';

export const CreateAppointmentSchema = z.object({
  patientId: z.string().cuid(),
  doctorId: z.string().cuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateAppointmentSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
  reason: z.string().optional(),
});

export const AppointmentQuerySchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  doctorId: z.string().optional(),
  date: z.string().optional(), // YYYY-MM-DD
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;
export type AppointmentQueryInput = z.infer<typeof AppointmentQuerySchema>;
