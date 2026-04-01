import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@dentabook.com' },
    update: {},
    create: {
      email: 'admin@dentabook.com',
      passwordHash,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('Seeded admin user:', admin.email);

  const doctor = await prisma.doctor.upsert({
    where: { email: 'dr.smith@dentabook.com' },
    update: {},
    create: {
      name: 'Dr. Sarah Smith',
      specialty: 'General Dentistry',
      email: 'dr.smith@dentabook.com',
      phone: '+15005550001',
      googleCalendarId: 'primary', // replace with actual calendar ID
      availabilitySlots: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '13:00' },
      ],
    },
  });

  console.log('Seeded doctor:', doctor.name);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
