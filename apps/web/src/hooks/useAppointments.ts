import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  reason?: string;
  notes?: string;
  source: 'WEB' | 'VOICE';
  googleCalendarEventId?: string;
  confirmationSent: boolean;
  reminderSent: boolean;
  createdAt: string;
  patient: { id: string; name: string; phone: string; email?: string };
  doctor: { id: string; name: string; specialty: string };
}

interface AppointmentListResponse {
  appointments: Appointment[];
  total: number;
  page: number;
  limit: number;
}

interface ListParams {
  status?: string;
  doctorId?: string;
  date?: string;
  page?: number;
  limit?: number;
}

export function useAppointments(params: ListParams = {}) {
  return useQuery<AppointmentListResponse>({
    queryKey: ['appointments', params],
    queryFn: () =>
      api.get('/api/appointments', { params }).then((r) => r.data),
  });
}

export function useAppointment(id: string) {
  return useQuery<Appointment>({
    queryKey: ['appointments', id],
    queryFn: () => api.get(`/api/appointments/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      patientId: string;
      doctorId: string;
      startTime: string;
      endTime: string;
      reason?: string;
    }) => api.post('/api/appointments', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: string; notes?: string } }) =>
      api.patch(`/api/appointments/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/appointments/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}
