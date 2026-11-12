import mongoose from 'mongoose';

async function checkMongo() {
  console.log('Connecting to process.env.MONGODB_URI or default...');
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/heritageDB';
  console.log('URI:', uri);
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('CONNECTED TO MONGODB SUCCESSFULLY!');
    console.log('Database Name:', conn.connection.name);
    console.log('Host:', conn.connection.host);
    console.log('Port:', conn.connection.port);
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    // Check indexes on users collection
    if (collections.some(c => c.name === 'users')) {
      const indexes = await conn.connection.db.collection('users').indexes();
      console.log('Indexes on "users" collection:');
      console.dir(indexes, { depth: null });

      const count = await conn.connection.db.collection('users').countDocuments();
      console.log('User documents count:', count);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.log('Connection failed:', err.message);
  }
}

checkMongo();
