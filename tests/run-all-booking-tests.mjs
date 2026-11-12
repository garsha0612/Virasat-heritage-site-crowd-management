import { spawn } from 'child_process';
import http from 'http';
import path from 'path';

try {
  process.loadEnvFile('.env.local');
} catch (e) {}

process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/heritageDB?replicaSet=rs0';

const PORT = 3015;

function waitForServer(port, timeoutMs = 45000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        return reject(new Error(`Timeout waiting for Next.js server on port ${port}`));
      }

      const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
        res.resume();
        clearInterval(interval);
        resolve();
      });

      req.on('error', (err) => {
        // Still waiting
      });

      req.setTimeout(3000, () => {
        req.destroy();
      });
    }, 500);
  });
}

async function main() {
  console.log(`Starting Next.js production server on port ${PORT}...`);
  
  // Explicitly bind to 127.0.0.1 so IPv4 loopback connection succeeds consistently on Windows
  const serverProcess = spawn('npx.cmd', ['next', 'start', '-p', String(PORT), '-H', '127.0.0.1'], {
    stdio: 'inherit',
    shell: true,
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to spawn Next.js server process:', err);
  });

  try {
    console.log(`Waiting for server to become ready on http://127.0.0.1:${PORT}...`);
    await waitForServer(PORT, 25000);
    process.env.TEST_APP_URL = `http://127.0.0.1:${PORT}`;
    console.log(`Next.js server is online on port ${PORT}. Running audit suites...\n`);

    // Run Suite 1-9: E2E Concurrency, Access Control, Pricing Security Audit
    const bookingAuditModule = await import('./booking-e2e-audit.mjs');
    await bookingAuditModule.runBookingAudit();

    // Run Suite 10: 20 Consolidated ACID Transaction & Consistency Scenarios
    const consolidationAuditModule = await import('./booking-consolidation-audit.mjs');
    await consolidationAuditModule.runConsolidationAudit();

    // Run Suite 11: Phase 6 Admin Dashboard, Heritage CRUD & Security Scenarios
    process.env.TEST_APP_URL = `http://127.0.0.1:${PORT}`;
    const adminAuditModule = await import('./admin-e2e-audit.mjs');
    await adminAuditModule.runAdminAudit();

    // Run Suite 12: Cashfree Sandbox Payment Gateway & Strict RBAC Audit
    const cashfreeRbacModule = await import('./cashfree-sandbox-and-rbac-audit.mjs');
    await cashfreeRbacModule.runCashfreeAndRbacAudit();

    console.log('\n================================================================');
    console.log('ALL ANVAYA PHASE 5, PHASE 6 & CASHFREE/RBAC AUDIT SUITES PASSED SUCCESSFULLY!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('Execution error during audit:', err);
    process.exitCode = 1;
  } finally {
    console.log('\nShutting down Next.js test server...');
    if (serverProcess && serverProcess.pid) {
      try {
        const { execSync } = await import('child_process');
        execSync(`taskkill /pid ${serverProcess.pid} /f /t`, { stdio: 'ignore' });
      } catch (e) {}
    }
    try {
      const mongoose = (await import('mongoose')).default;
      await mongoose.disconnect();
    } catch (e) {}

    setTimeout(() => {
      process.exit(process.exitCode || 0);
    }, 500);
  }
}

main();
