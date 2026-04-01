import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Stats {
  todayCount: number;
  weekCount: number;
  totalPatients: number;
  activeDoctors: number;
  bySource: { WEB?: number; VOICE?: number };
  last7Days: { date: string; count: number }[];
}

export function useStats() {
  return useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: () => api.get('/api/stats').then((r) => r.data),
    refetchInterval: 60_000,
  });
}
