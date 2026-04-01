import { useState } from 'react';
import { Plus, Search, Phone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAppointments, useCreateAppointment, useCancelAppointment } from '@/hooks/useAppointments';
import { useDoctors, useDoctorAvailability } from '@/hooks/useDoctors';
import { usePatients, useCreatePatient } from '@/hooks/usePatients';
import { formatDateTime } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { format } from 'date-fns';

const STATUS_VARIANT: Record<string, 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'> = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
};

const STATUS_FILTERS = ['ALL', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

function NewAppointmentDialog({ onClose }: { onClose: () => void }) {
  const { data: doctors } = useDoctors();
  const { data: patients } = usePatients();
  const createAppointment = useCreateAppointment();
  const createPatient = useCreatePatient();
  const { toast } = useToast();

  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [patientId, setPatientId] = useState('');
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [showNewPatient, setShowNewPatient] = useState(false);

  const { data: slots } = useDoctorAvailability(doctorId, date);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let finalPatientId = patientId;

    if (showNewPatient) {
      const p = await createPatient.mutateAsync({ name: newPatientName, phone: newPatientPhone });
      finalPatientId = p.id;
    }

    if (!finalPatientId || !selectedSlot) return;

    const slot = slots?.find((s) => s.startTime === selectedSlot);
    if (!slot) return;

    await createAppointment.mutateAsync({
      patientId: finalPatientId,
      doctorId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      reason,
    });

    toast({ title: 'Appointment booked', variant: 'success' as never });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label>Doctor</Label>
        <Select onValueChange={setDoctorId} required>
          <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
          <SelectContent>
            {doctors?.filter((d) => d.isActive).map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name} — {d.specialty}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={format(new Date(), 'yyyy-MM-dd')} required />
      </div>

      {doctorId && date && (
        <div className="space-y-2">
          <Label>Available Slots</Label>
          {!slots?.length ? (
            <p className="text-sm text-slate-400">No available slots for this date</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.startTime}
                  type="button"
                  onClick={() => setSelectedSlot(slot.startTime)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selectedSlot === slot.startTime
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  {format(new Date(slot.startTime), 'h:mm a')}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Patient</Label>
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline"
            onClick={() => setShowNewPatient(!showNewPatient)}
          >
            {showNewPatient ? 'Select existing' : '+ New patient'}
          </button>
        </div>
        {showNewPatient ? (
          <div className="space-y-2">
            <Input placeholder="Full name" value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} required />
            <Input placeholder="+1234567890" value={newPatientPhone} onChange={(e) => setNewPatientPhone(e.target.value)} required />
          </div>
        ) : (
          <Select onValueChange={setPatientId}>
            <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
            <SelectContent>
              {patients?.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name} ({p.phone})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <Label>Reason (optional)</Label>
        <Input placeholder="Check-up, cleaning, pain..." value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>

      <Button type="submit" className="w-full" disabled={createAppointment.isPending}>
        {createAppointment.isPending ? 'Booking...' : 'Book Appointment'}
      </Button>
    </form>
  );
}

export default function AppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const cancelAppointment = useCancelAppointment();
  const { toast } = useToast();

  const { data, isLoading } = useAppointments({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page,
    limit: 15,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total ?? 0} total</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Appointment</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Book Appointment</DialogTitle>
            </DialogHeader>
            <NewAppointmentDialog onClose={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-4">
          {/* Status tabs */}
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">Loading...</div>
          ) : !data?.appointments?.length ? (
            <div className="text-center py-12 text-slate-400">No appointments found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Patient</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Doctor</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Date & Time</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Source</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{appt.patient.name}</p>
                          <p className="text-xs text-slate-400">{appt.patient.phone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-slate-700">{appt.doctor.name}</p>
                          <p className="text-xs text-slate-400">{appt.doctor.specialty}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatDateTime(appt.startTime)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={STATUS_VARIANT[appt.status]}>
                          {appt.status.toLowerCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          {appt.source === 'VOICE' ? (
                            <><Phone className="h-3 w-3" /> Voice</>
                          ) : (
                            <><Monitor className="h-3 w-3" /> Web</>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={async () => {
                              await cancelAppointment.mutateAsync(appt.id);
                              toast({ title: 'Appointment cancelled', variant: 'default' });
                            }}
                          >
                            Cancel
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.total > 15 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
              <p className="text-sm text-slate-500">
                Page {page} of {Math.ceil(data.total / 15)}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(data.total / 15)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
