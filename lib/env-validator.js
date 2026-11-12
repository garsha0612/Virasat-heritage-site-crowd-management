/**
 * ANVAYA – Environment Configuration Validator
 * 
 * Validates required environment variables and enforces security constraints
 * for Cashfree Payment Gateway integration (SANDBOX ONLY).
 */

/**
 * Validates that Cashfree environment is set to SANDBOX only
 * @throws {Error} If production/live credentials are detected
 */
export function validateCashfreeEnvironment() {
  const env = process.env.CASHFREE_ENV;
  const clientId = process.env.CASHFREE_CLIENT_ID || '';
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET || '';

  // Ensure environment variable is set
  if (!env) {
    throw new Error(
      'CASHFREE_ENV is not defined in environment variables. ' +
      'Set CASHFREE_ENV=SANDBOX in your .env.local file.'
    );
  }

  // CRITICAL: Block production/live environments
  if (env.toUpperCase() !== 'SANDBOX') {
    throw new Error(
      `CRITICAL SECURITY ERROR: CASHFREE_ENV is set to "${env}". ` +
      'This application ONLY supports SANDBOX environment. ' +
      'Production/live payments are DISABLED by design. ' +
      'Change CASHFREE_ENV to "SANDBOX" in your .env.local file.'
    );
  }

  // Validate test credentials format
  if (!clientId.startsWith('TEST')) {
    console.warn(
      '⚠️  WARNING: CASHFREE_CLIENT_ID does not start with "TEST". ' +
      'Ensure you are using sandbox test credentials, not production credentials.'
    );
  }

  if (!clientSecret.includes('_test_')) {
    console.warn(
      '⚠️  WARNING: CASHFREE_CLIENT_SECRET does not contain "_test_". ' +
      'Ensure you are using sandbox test credentials, not production credentials.'
    );
  }

  // Validate all required Cashfree variables are present
  const required = [
    'CASHFREE_CLIENT_ID',
    'CASHFREE_CLIENT_SECRET',
    'CASHFREE_ENV',
    'CASHFREE_API_VERSION'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required Cashfree environment variables: ${missing.join(', ')}. ` +
      'Add these to your .env.local file.'
    );
  }

  return {
    clientId: process.env.CASHFREE_CLIENT_ID,
    clientSecret: process.env.CASHFREE_CLIENT_SECRET,
    environment: process.env.CASHFREE_ENV,
    apiVersion: process.env.CASHFREE_API_VERSION,
    webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET
  };
}

/**
 * Validates MongoDB connection for transaction support
 * @throws {Error} If MongoDB URI is invalid or missing replica set
 */
export function validateMongoDBEnvironment() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not defined. Set it in your .env.local file.'
    );
  }

  // Check for replica set (required for transactions)
  if (!uri.includes('replicaSet=') && !uri.includes('mongodb+srv://')) {
    console.warn(
      '⚠️  WARNING: MongoDB URI may not support transactions. ' +
      'Ensure your MongoDB instance is configured as a replica set. ' +
      'Atlas clusters have replica sets by default.'
    );
  }

  return { uri };
}

/**
 * Validates JWT secret strength
 * @throws {Error} If JWT secret is weak or missing
 */
export function validateJWTEnvironment() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      'JWT_SECRET is not defined. Set it in your .env.local file.'
    );
  }

  if (secret.length < 32) {
    throw new Error(
      `JWT_SECRET is too short (${secret.length} characters). ` +
      'Use at least 32 characters for security.'
    );
  }

  return { secret };
}

/**
 * Validates all critical environment variables at application startup
 * @throws {Error} If any validation fails
 */
export function validateEnvironment() {
  try {
    validateMongoDBEnvironment();
    validateJWTEnvironment();
    validateCashfreeEnvironment();
    
    console.log('✅ Environment validation passed (Cashfree SANDBOX mode confirmed)');
    
    return true;
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    throw error;
  }
}
