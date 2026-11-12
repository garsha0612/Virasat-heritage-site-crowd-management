import mongoose from 'mongoose';

async function inspectUser() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/heritageDB';
  const conn = await mongoose.connect(uri);
  const users = await conn.connection.db.collection('users').find({}).toArray();
  console.log('Total users in DB:', users.length);
  for (const u of users) {
    console.log({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      passwordHashPrefix: u.password?.slice(0, 10),
      hasPlaintextPassword: u.password?.includes('Password') || false,
      nationality: u.nationality,
      isActive: u.isActive,
      createdAt: u.createdAt,
    });
  }
  await mongoose.disconnect();
}

inspectUser();
