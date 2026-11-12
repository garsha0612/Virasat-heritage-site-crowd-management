import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * VIRASAT Administrator Account Provisioning Bootstrap Script
 * 
 * Usage:
 *   node scripts/seed-admin.mjs
 * Or with custom credentials via environment:
 *   ADMIN_EMAIL=custom@domain.gov.in ADMIN_PASSWORD=SecretPassword123! node scripts/seed-admin.mjs
 * Or with CLI arguments:
 *   node scripts/seed-admin.mjs --email custom@domain.gov.in --password SecretPassword123! --name "Director General"
 */

const MONGO_URI =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27018/heritageDB?replicaSet=rs0';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) options.email = args[++i];
    if (args[i] === '--password' && args[i + 1]) options.password = args[++i];
    if (args[i] === '--name' && args[i + 1]) options.name = args[++i];
  }
  return options;
}

const cliOptions = parseArgs();

const adminEmail = (cliOptions.email || process.env.ADMIN_EMAIL || 'admin@virasat.gov.in').toLowerCase().trim();
const adminPassword = cliOptions.password || process.env.ADMIN_PASSWORD || 'Virasat@Admin2026!';
const adminName = cliOptions.name || process.env.ADMIN_NAME || 'Super Administrator';

async function bootstrapAdmin() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected successfully to database.');

  const usersCollection = mongoose.connection.db.collection('users');

  const existing = await usersCollection.findOne({ email: adminEmail });

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(adminPassword, salt);

  if (existing) {
    console.log(`Updating existing user "${adminEmail}" to ensure active administrator privileges...`);
    await usersCollection.updateOne(
      { email: adminEmail },
      {
        $set: {
          name: adminName,
          password: hashedPassword,
          role: 'admin',
          isActive: true,
          updatedAt: new Date(),
        },
      }
    );
    console.log(`[SUCCESS] User "${adminEmail}" is now configured with active role: "admin".`);
  } else {
    console.log(`Creating initial administrator account "${adminEmail}"...`);
    await usersCollection.insertOne({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      phone: '+919876543210',
      nationality: 'Indian',
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`[SUCCESS] Created new administrator account "${adminEmail}".`);
  }

  await mongoose.disconnect();
  console.log('Database connection closed. Admin provisioning complete.');
}

bootstrapAdmin().catch((err) => {
  console.error('[ERROR] Administrator provisioning failed:', err);
  process.exit(1);
});
