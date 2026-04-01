export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type AppointmentSource = 'WEB' | 'VOICE';
export type UserRole = 'ADMIN' | 'STAFF';

export interface TimeSlot {
  doctorId: string;
  doctorName: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
}

export interface AvailabilitySlot {
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}
