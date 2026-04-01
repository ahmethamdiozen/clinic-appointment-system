import { z } from 'zod';

export const CreatePatientSchema = z.object({
  name: z.string().min(1),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone must be in E.164 format (+1234567890)'),
  email: z.string().email().optional(),
  dateOfBirth: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const UpdatePatientSchema = CreatePatientSchema.partial();

export type CreatePatientInput = z.infer<typeof CreatePatientSchema>;
export type UpdatePatientInput = z.infer<typeof UpdatePatientSchema>;
