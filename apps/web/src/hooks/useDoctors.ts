import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  email: string;
  phone?: string;
  googleCalendarId: string;
  isActive: boolean;
  availabilitySlots: { dayOfWeek: number; startTime: string; endTime: string }[];
  createdAt: string;
}

export interface TimeSlot {
  doctorId: string;
  doctorName: string;
  startTime: string;
  endTime: string;
}

export function useDoctors() {
  return useQuery<Doctor[]>({
    queryKey: ['doctors'],
    queryFn: () => api.get('/api/doctors').then((r) => r.data),
  });
}

export function useDoctor(id: string) {
  return useQuery<Doctor & { appointments: unknown[] }>({
    queryKey: ['doctors', id],
    queryFn: () => api.get(`/api/doctors/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useDoctorAvailability(doctorId: string, date: string) {
  return useQuery<TimeSlot[]>({
    queryKey: ['doctors', doctorId, 'availability', date],
    queryFn: () =>
      api.get(`/api/doctors/${doctorId}/availability`, { params: { date } }).then((r) => r.data),
    enabled: !!doctorId && !!date,
  });
}

export function useCreateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Doctor, 'id' | 'createdAt' | 'isActive'>) =>
      api.post('/api/doctors', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  });
}

export function useUpdateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Doctor> }) =>
      api.patch(`/api/doctors/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  });
}
