// FILE: backend/prisma/seed.js
// Seed script: creates admin user, sample user, tags, and demo files

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Admin user ──────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vault.dev' },
    update: {},
    create: {
      email: 'admin@vault.dev',
      passwordHash: adminPassword,
      name: 'System Admin',
      role: 'admin',
      storageQuota: BigInt(1073741824), // 1 GB for admin
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // ── Regular user ────────────────────────────
  const userPassword = await bcrypt.hash('User@123456', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@vault.dev' },
    update: {},
    create: {
      email: 'user@vault.dev',
      passwordHash: userPassword,
      name: 'Demo User',
      role: 'user',
    },
  });
  console.log('✅ Regular user created:', user.email);

  // ── Tags ────────────────────────────────────
  const tagNames = ['documents', 'images', 'videos', 'archives', 'code', 'personal', 'work'];
  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );
  console.log('✅ Tags created:', tagNames.join(', '));

  console.log('\n🎉 Seeding complete!\n');
  console.log('Credentials:');
  console.log('  Admin → admin@vault.dev / Admin@123456');
  console.log('  User  → user@vault.dev  / User@123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
