import { useState } from 'react';
import { Plus, Mail, Phone, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useDoctors, useCreateDoctor, useUpdateDoctor } from '@/hooks/useDoctors';
import { useToast } from '@/hooks/useToast';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SPECIALTIES = [
  'General Dentistry',
  'Orthodontics',
  'Oral Surgery',
  'Periodontics',
  'Endodontics',
  'Pediatric Dentistry',
  'Prosthodontics',
];

function DoctorForm({ onClose }: { onClose: () => void }) {
  const createDoctor = useCreateDoctor();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    specialty: '',
    email: '',
    phone: '',
    googleCalendarId: '',
  });

  const [availability, setAvailability] = useState<{ dayOfWeek: number; startTime: string; endTime: string }[]>([]);

  function toggleDay(day: number) {
    if (availability.find((a) => a.dayOfWeek === day)) {
      setAvailability(availability.filter((a) => a.dayOfWeek !== day));
    } else {
      setAvailability([...availability, { dayOfWeek: day, startTime: '09:00', endTime: '17:00' }]);
    }
  }

  function updateSlot(day: number, field: 'startTime' | 'endTime', value: string) {
    setAvailability(
      availability.map((a) => (a.dayOfWeek === day ? { ...a, [field]: value } : a))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createDoctor.mutateAsync({ ...form, availabilitySlots: availability });
    toast({ title: 'Doctor added successfully', variant: 'success' as never });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Full Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Dr. Jane Smith" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Specialty</Label>
          <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} required placeholder="General Dentistry" list="specialties" />
          <datalist id="specialties">
            {SPECIALTIES.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1234567890" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Google Calendar ID</Label>
          <Input value={form.googleCalendarId} onChange={(e) => setForm({ ...form, googleCalendarId: e.target.value })} required placeholder="doctor@gmail.com or calendar ID" />
          <p className="text-xs text-slate-400">Share this calendar with the service account email</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Weekly Availability</Label>
        <div className="space-y-2">
          {DAYS.map((day, i) => {
            const slot = availability.find((a) => a.dayOfWeek === i);
            return (
              <div key={day} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`w-10 text-xs font-medium rounded px-1.5 py-1 transition-colors ${
                    slot ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {day}
                </button>
                {slot && (
                  <div className="flex items-center gap-2 text-sm">
                    <Input type="time" value={slot.startTime} onChange={(e) => updateSlot(i, 'startTime', e.target.value)} className="h-8 w-28" />
                    <span className="text-slate-400">—</span>
                    <Input type="time" value={slot.endTime} onChange={(e) => updateSlot(i, 'endTime', e.target.value)} className="h-8 w-28" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={createDoctor.isPending}>
        {createDoctor.isPending ? 'Adding...' : 'Add Doctor'}
      </Button>
    </form>
  );
}

export default function DoctorsPage() {
  const { data: doctors, isLoading } = useDoctors();
  const updateDoctor = useUpdateDoctor();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctors</h1>
          <p className="text-sm text-slate-500 mt-1">{doctors?.length ?? 0} registered</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Doctor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Doctor</DialogTitle></DialogHeader>
            <DoctorForm onClose={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400">Loading...</div>
      ) : !doctors?.length ? (
        <div className="text-center py-20 text-slate-400">No doctors yet. Add one to get started.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => (
            <Card key={doctor.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
                    {doctor.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <button
                    onClick={() => updateDoctor.mutate({ id: doctor.id, data: { isActive: !doctor.isActive } })}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    title={doctor.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {doctor.isActive ? (
                      <ToggleRight className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6" />
                    )}
                  </button>
                </div>
                <h3 className="font-semibold text-slate-900">{doctor.name}</h3>
                <p className="text-sm text-slate-500 mb-3">{doctor.specialty}</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="h-3 w-3" /> {doctor.email}
                  </div>
                  {doctor.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone className="h-3 w-3" /> {doctor.phone}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {(doctor.availabilitySlots ?? []).map((slot: { dayOfWeek: number; startTime: string; endTime: string }) => (
                    <span key={slot.dayOfWeek} className="text-xs bg-slate-100 text-slate-600 rounded px-2 py-0.5">
                      {DAYS[slot.dayOfWeek]}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
