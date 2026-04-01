import { z } from 'zod';

export const AvailabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const CreateDoctorSchema = z.object({
  name: z.string().min(1),
  specialty: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  googleCalendarId: z.string().min(1),
  availabilitySlots: z.array(AvailabilitySlotSchema).default([]),
});

export const UpdateDoctorSchema = CreateDoctorSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateDoctorInput = z.infer<typeof CreateDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof UpdateDoctorSchema>;
