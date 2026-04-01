import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  notes?: string;
  createdAt: string;
}

export function usePatients(search?: string) {
  return useQuery<Patient[]>({
    queryKey: ['patients', search],
    queryFn: () => api.get('/api/patients', { params: { search } }).then((r) => r.data),
  });
}

export function usePatient(id: string) {
  return useQuery<Patient & { appointments: unknown[] }>({
    queryKey: ['patients', id],
    queryFn: () => api.get(`/api/patients/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; phone: string; email?: string }) =>
      api.post('/api/patients', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}
