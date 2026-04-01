import cron from 'node-cron';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { prisma } from '../config/prisma';
import { sendReminderSMS } from './notification.service';

export function startReminderJob(): void {
  // Runs every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('[Reminder] Running daily reminder job...');

    const tomorrow = new Date();
    const tomorrowStart = startOfDay(addDays(tomorrow, 1));
    const tomorrowEnd = endOfDay(addDays(tomorrow, 1));

    try {
      const appointments = await prisma.appointment.findMany({
        where: {
          startTime: { gte: tomorrowStart, lte: tomorrowEnd },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          reminderSent: false,
        },
        include: { patient: true, doctor: true },
      });

      console.log(`[Reminder] Sending reminders for ${appointments.length} appointment(s)`);

      for (const appt of appointments) {
        await sendReminderSMS(appt);
      }
    } catch (err) {
      console.error('[Reminder] Job failed:', err);
    }
  });

  console.log('[Reminder] Daily reminder job scheduled (runs at 8:00 AM)');
}
