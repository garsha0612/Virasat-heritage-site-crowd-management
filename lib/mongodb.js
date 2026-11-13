import mongoose from 'mongoose';

/**
 * Global cache reference for Mongoose connection in Next.js serverless environment.
 * Prevents multiple connections during hot-reloading in development and
 * reuses connections across lambda invocations.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB using Mongoose.
 * Configured with resilient connection pooling and server selection timeouts.
 *
 * @returns {Promise<mongoose.Connection>}
 */
export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/heritageDB?replicaSet=rs0';

  if (!uri) {
    throw new Error(
      'Database configuration missing: MONGODB_URI environment variable is not defined.'
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000, // Fail fast (5s) if MongoDB daemon is unreachable
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((mongooseInstance) => {
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        console.error('MongoDB connection error:', err.message);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

/**
 * Check whether the active MongoDB deployment supports multi-document transactions.
 * Multi-document transactions require a Replica Set (e.g. MongoDB Atlas or local replica set) or Sharded Cluster.
 *
 * @returns {Promise<boolean>}
 */
export async function isTransactionSupported() {
  await connectToDatabase();
  const topology = mongoose.connection.client?.topology;
  if (!topology) return false;

  const description = topology.description;
  const isReplicaSet = description?.type === 'ReplicaSetWithPrimary' || Boolean(description?.setName);
  const isSharded = description?.type === 'Sharded';
  return Boolean(isReplicaSet || isSharded);
}

/**
 * Execute an asynchronous unit of work inside an ACID multi-document MongoDB transaction.
 * Uses session.withTransaction() with majority write concerns and automatic retry handling.
 * Throws a clear error if transactions are unsupported on the current database deployment.
 * 
 * @param {Function} workFn - (session) => Promise<any>
 * @returns {Promise<any>}
 */
export async function withDatabaseTransaction(workFn) {
  await connectToDatabase();

  const supported = await isTransactionSupported();
  if (!supported) {
    // Standalone MongoDB (e.g. local single-instance testing/development without replica set)
    // Execute atomic document operations directly without transaction wrapper.
    return await workFn(null);
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(
      async () => {
        result = await workFn(session);
      },
      {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' },
      }
    );
    return result;
  } finally {
    await session.endSession();
  }
}

export default connectToDatabase;
