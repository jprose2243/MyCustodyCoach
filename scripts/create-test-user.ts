import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const hashedPassword = await bcrypt.hash('test123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      state: 'CO',
      emailVerified: null,
    },
  });

  console.log('✅ Test user created or already exists:', user.email);
}

main()
  .catch((e) => {
    console.error('❌ Failed to seed test user:', e);
    process.exit(1);
  })
  .finally(() => process.exit());