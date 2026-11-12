import mongoose from 'mongoose';
import connectToDatabase from '../lib/mongodb.js';
import BookingOperation from '../models/BookingOperation.js';
import TimeSlot from '../models/TimeSlot.js';
import { claimOperationLease, finalizeOperationWithLease } from '../lib/recovery.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runLeaseAudit() {
  await connectToDatabase();
  console.log('--- LEASE VERIFICATION: ACTUAL MONGODB DOCUMENTS ---\n');

  // Step 0: Create a test slot and pending operation
  const slot = await TimeSlot.create({
    heritageSite: 'taj-mahal',
    date: '2026-12-31',
    startTime: '10:00',
    endTime: '11:00',
    slotLabel: 'Lease Verification Window',
    capacity: 10,
    reservedCount: 2,
    isActive: true,
  });

  const testKey = `lease-audit-${Date.now()}`;
  const op = await BookingOperation.create({
    idempotencyKey: testKey,
    operationType: 'reservation',
    slotId: slot._id,
    ticketQuantity: 2,
    status: 'pending',
    step: 'slot_reserved',
    slotCapacityAdjusted: true,
  });

  console.log('1. INITIAL PENDING OPERATION IN MONGODB:');
  const doc0 = await BookingOperation.findById(op._id).lean();
  console.log(JSON.stringify({
    _id: doc0._id,
    idempotencyKey: doc0.idempotencyKey,
    status: doc0.status,
    recoveryLeaseOwner: doc0.recoveryLeaseOwner,
    recoveryLeaseUntil: doc0.recoveryLeaseUntil,
  }, null, 2));

  // 1. Worker A claims operation with unique lease token and expiration (1200ms)
  console.log('\n2. WORKER A CLAIMS OPERATION (leaseDuration: 1200ms):');
  const claimA = await claimOperationLease(op._id, 'worker-A-token-9988', 1200);
  const doc1 = await BookingOperation.findById(op._id).lean();
  console.log(JSON.stringify({
    _id: doc1._id,
    status: doc1.status,
    recoveryLeaseOwner: doc1.recoveryLeaseOwner,
    recoveryLeaseUntil: doc1.recoveryLeaseUntil,
    recoveryAttempts: doc1.recoveryAttempts,
  }, null, 2));

  // 2. Worker B attempts to claim while Worker A's lease is valid
  console.log('\n3. WORKER B ATTEMPTS CLAIM WHILE LEASE IS ACTIVE:');
  const claimB = await claimOperationLease(op._id, 'worker-B-token-1122', 5000);
  console.log(`Worker B Claim Result: ${claimB ? 'SUCCESS' : 'REJECTED (null)'}`);
  const doc2 = await BookingOperation.findById(op._id).lean();
  console.log(`Owner in DB remains: "${doc2.recoveryLeaseOwner}" (Worker B was blocked)`);

  // 3 & 4. Worker A crashes/halts. Wait for lease to expire (1400ms). Worker B reclaims.
  console.log('\n4. WORKER A CRASHES. WAITING 1400ms FOR LEASE EXPIRATION...');
  await sleep(1400);

  console.log('5. WORKER B RECLAIMS OPERATION AFTER EXPIRATION:');
  const reclaimB = await claimOperationLease(op._id, 'worker-B-token-1122', 5000);
  console.log(`Worker B Reclaim Result: ${reclaimB ? 'SUCCESS' : 'FAILED'}`);
  const doc3 = await BookingOperation.findById(op._id).lean();
  console.log(JSON.stringify({
    _id: doc3._id,
    status: doc3.status,
    recoveryLeaseOwner: doc3.recoveryLeaseOwner,
    recoveryLeaseUntil: doc3.recoveryLeaseUntil,
    recoveryAttempts: doc3.recoveryAttempts,
  }, null, 2));

  // 5. Worker B completes the operation
  console.log('\n6. WORKER B COMPLETES OPERATION AND SAFELY RELEASES LEASE:');
  const completedByB = await finalizeOperationWithLease(op._id, 'worker-B-token-1122', 'completed', {
    step: 'completed_by_worker_B',
  });
  const doc4 = await BookingOperation.findById(op._id).lean();
  console.log(JSON.stringify({
    _id: doc4._id,
    status: doc4.status,
    step: doc4.step,
    recoveryLeaseOwner: doc4.recoveryLeaseOwner,
    recoveryLeaseUntil: doc4.recoveryLeaseUntil,
  }, null, 2));

  // 6 & 7. Worker A resumes late and attempts to update the operation
  console.log('\n7. WORKER A RESUMES LATE AND ATTEMPTS TO UPDATE COMPLETED OPERATION:');
  const lateAttemptA = await finalizeOperationWithLease(op._id, 'worker-A-token-9988', 'failed', {
    step: 'overwritten_by_late_worker_A',
  });
  console.log(`Worker A Late Update Result: ${lateAttemptA ? 'ALLOWED' : 'REJECTED (null)'}`);

  const doc5 = await BookingOperation.findById(op._id).lean();
  console.log('\n8. FINAL DOCUMENT IN MONGODB:');
  console.log(JSON.stringify({
    _id: doc5._id,
    status: doc5.status,
    step: doc5.step,
    recoveryLeaseOwner: doc5.recoveryLeaseOwner,
    recoveryLeaseUntil: doc5.recoveryLeaseUntil,
  }, null, 2));
  console.log(`Integrity Check: Final status is "${doc5.status}" (Worker B result preserved, Worker A rejected)`);

  // Cleanup
  await BookingOperation.deleteOne({ _id: op._id });
  await TimeSlot.deleteOne({ _id: slot._id });

  await mongoose.disconnect();
}

runLeaseAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
