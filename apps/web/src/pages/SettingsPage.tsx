import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">System configuration and service status</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clinic Information</CardTitle>
          <CardDescription>Basic details about your dental practice</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Clinic Name</span>
            <span className="text-sm font-medium text-slate-900">DentaBook Dental Clinic</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">System Version</span>
            <span className="text-sm font-medium text-slate-900">1.0.0</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrated Services</CardTitle>
          <CardDescription>External services powering DentaBook</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              name: 'Vapi AI Voice',
              description: 'Handles inbound patient phone calls and books appointments via AI',
              docs: 'Configure assistant at dashboard.vapi.ai — set Server URL to /api/webhooks/vapi',
            },
            {
              name: 'Google Calendar',
              description: 'Syncs doctor availability and creates appointment events',
              docs: 'Share each doctor\'s calendar with the service account email (Make changes to events)',
            },
            {
              name: 'Twilio SMS',
              description: 'Sends confirmation and 24h reminder messages to patients',
              docs: 'Set inbound webhook URL to /api/webhooks/twilio for CANCEL reply handling',
            },
          ].map(({ name, description, docs }) => (
            <div key={name} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-slate-900">{name}</span>
                <Badge variant="outline" className="text-xs text-slate-500">External</Badge>
              </div>
              <p className="text-xs text-slate-500 mb-2">{description}</p>
              <p className="text-xs text-slate-400 bg-slate-50 rounded p-2 font-mono">{docs}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vapi System Prompt</CardTitle>
          <CardDescription>Copy this into your Vapi assistant configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs text-slate-600 bg-slate-50 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`You are Sophie, a friendly and professional receptionist at DentaBook Dental Clinic. Your job is to help patients schedule dental appointments.

You must:
1. Greet the patient warmly by name once you have it.
2. Ask for their full name and phone number (in E.164 format, e.g. +1234567890).
3. Ask about their dental concern (check-up, cleaning, toothache, braces, surgery, etc.).
4. Ask for their preferred date (YYYY-MM-DD format).
5. Use the checkAvailability tool to find open slots matching their specialty.
6. Present up to 3 options clearly and let the patient choose.
7. Use the bookAppointment tool to finalize the booking with the chosen slot.
8. Confirm the booking details and inform them they'll receive a confirmation SMS.
9. Be concise, warm, and professional. Never provide medical advice.`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
