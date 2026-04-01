import { Calendar, Users, Stethoscope, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStats } from '@/hooks/useStats';
import { useAppointments } from '@/hooks/useAppointments';
import { formatDateTime } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const STATUS_VARIANT: Record<string, 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'> = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
};

export default function DashboardPage() {
  const { data: stats } = useStats();
  const { data: upcoming } = useAppointments({ status: 'SCHEDULED', limit: 6 });

  const statCards = [
    {
      title: "Today's Appointments",
      value: stats?.todayCount ?? '—',
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'This Week',
      value: stats?.weekCount ?? '—',
      icon: Calendar,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Total Patients',
      value: stats?.totalPatients ?? '—',
      icon: Users,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      title: 'Active Doctors',
      value: stats?.activeDoctors ?? '—',
      icon: Stethoscope,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back. Here's what's happening today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ title, value, icon: Icon, color, bg }) => (
          <Card key={title}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Appointments — Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats?.last7Days ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Web</span>
              </div>
              <span className="text-lg font-bold text-blue-700">{stats?.bySource?.WEB ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700">Voice AI</span>
              </div>
              <span className="text-lg font-bold text-emerald-700">{stats?.bySource?.VOICE ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {!upcoming?.appointments?.length ? (
            <p className="text-sm text-slate-400 text-center py-8">No upcoming appointments</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcoming.appointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-semibold text-sm">
                      {appt.patient.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{appt.patient.name}</p>
                      <p className="text-xs text-slate-500">{appt.doctor.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">{formatDateTime(appt.startTime)}</p>
                    <Badge variant={STATUS_VARIANT[appt.status]} className="mt-0.5">
                      {appt.status.toLowerCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
