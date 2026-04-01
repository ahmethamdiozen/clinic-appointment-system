import { useState } from 'react';
import { Search, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePatients, useCreatePatient } from '@/hooks/usePatients';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

function NewPatientDialog({ onClose }: { onClose: () => void }) {
  const createPatient = useCreatePatient();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createPatient.mutateAsync({ name: form.name, phone: form.phone, email: form.email || undefined });
    toast({ title: 'Patient added', variant: 'success' as never });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label>Full Name</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="space-y-1.5">
        <Label>Phone (E.164)</Label>
        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1234567890" required />
      </div>
      <div className="space-y-1.5">
        <Label>Email (optional)</Label>
        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <Button type="submit" className="w-full" disabled={createPatient.isPending}>
        {createPatient.isPending ? 'Adding...' : 'Add Patient'}
      </Button>
    </form>
  );
}

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: patients, isLoading } = usePatients(search || undefined);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-500 mt-1">{patients?.length ?? 0} registered</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Patient</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Add Patient</DialogTitle></DialogHeader>
            <NewPatientDialog onClose={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400">Loading...</div>
      ) : !patients?.length ? (
        <div className="text-center py-20 text-slate-400">No patients found</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Patient</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-medium text-xs">
                          {patient.name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{patient.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{patient.phone}</td>
                    <td className="py-3 px-4 text-slate-500">{patient.email ?? '—'}</td>
                    <td className="py-3 px-4 text-slate-400">{formatDate(patient.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
