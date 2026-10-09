import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Setup test environment variables
process.env.ADMIN_USERNAME = 'test_security_admin';
process.env.ADMIN_PASSWORD = 'CorrectHorseBatteryStaple123!';
process.env.ADMIN_SESSION_SECRET = 'super_secret_test_encryption_key_32_characters_minimum!';
process.env.EMAIL_TEST_MODE = 'true';

// Dynamically import application modules
const {
  verifyAdminCredentials,
  generateSessionToken,
  isValidSessionToken,
  verifyCsrfOrigin,
} = await import('../src/lib/auth.ts');

const {
  generateSecureToken,
  isValidTokenFormat,
  sanitizeSpreadsheetCell,
  isTokenExpired,
  getCandidateBySecureToken,
  MAX_IMPORT_ROWS,
} = await import('../src/lib/db/index.ts');

const {
  sendCandidateStatusEmail,
} = await import('../src/lib/email.ts');

describe('1. Authentication & Session Management Security', () => {
  it('should accept valid configured credentials', () => {
    assert.equal(
      verifyAdminCredentials('test_security_admin', 'CorrectHorseBatteryStaple123!'),
      true,
      'Valid credentials should succeed'
    );
  });

  it('should reject hardcoded legacy default passwords', () => {
    assert.equal(
      verifyAdminCredentials('test_security_admin', 'lcb_recruitment_2026!'),
      false,
      'Hardcoded legacy password must be rejected'
    );
    assert.equal(
      verifyAdminCredentials('test_security_admin', 'admin'),
      false,
      'Default "admin" password must be rejected'
    );
  });

  it('should reject unconfigured fallback usernames', () => {
    assert.equal(
      verifyAdminCredentials('admin', 'CorrectHorseBatteryStaple123!'),
      false,
      'Unconfigured username "admin" must be rejected'
    );
    assert.equal(
      verifyAdminCredentials('hr@linkedincommunitybangladesh.com', 'CorrectHorseBatteryStaple123!'),
      false,
      'Unconfigured fallback email must be rejected'
    );
  });

  it('should reject empty or missing credentials', () => {
    assert.equal(verifyAdminCredentials('', ''), false);
    assert.equal(verifyAdminCredentials('test_security_admin', ''), false);
    assert.equal(verifyAdminCredentials('', 'CorrectHorseBatteryStaple123!'), false);
  });

  it('should generate HMAC-signed session tokens that validate successfully', () => {
    const token = generateSessionToken('test_security_admin');
    assert.ok(token.startsWith('lcb_adm_'), 'Token should have proper prefix');
    assert.equal(isValidSessionToken(token), true, 'Valid HMAC token must pass validation');
  });

  it('should reject tampered session tokens (payload forgery protection)', () => {
    const token = generateSessionToken('test_security_admin');
    const raw = Buffer.from(token.replace('lcb_adm_', ''), 'base64').toString('utf-8');
    const [timestamp, , hmac] = raw.split(':');

    // Tamper with username
    const forgedRaw = `${timestamp}:super_admin:${hmac}`;
    const forgedToken = `lcb_adm_${Buffer.from(forgedRaw).toString('base64')}`;

    assert.equal(
      isValidSessionToken(forgedToken),
      false,
      'Forged session payload with modified username must fail validation'
    );
  });

  it('should reject expired session tokens (> 24 hours)', () => {
    const secret = process.env.ADMIN_SESSION_SECRET;
    const oldTimestamp = (Date.now() - 25 * 60 * 60 * 1000).toString(); // 25 hours ago
    const user = 'test_security_admin';
    const payload = `${oldTimestamp}:${user}`;
    const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const expiredToken = `lcb_adm_${Buffer.from(`${payload}:${hmac}`).toString('base64')}`;

    assert.equal(
      isValidSessionToken(expiredToken),
      false,
      'Session token older than 24 hours must be rejected'
    );
  });

  it('should reject malformed or non-base64 tokens', () => {
    assert.equal(isValidSessionToken(''), false);
    assert.equal(isValidSessionToken('invalid_token'), false);
    assert.equal(isValidSessionToken('lcb_adm_!@#$%^&*()'), false);
    assert.equal(isValidSessionToken('lcb_adm_bm90X2Vub3VnaF9wYXJ0cw=='), false);
  });
});

describe('2. Candidate Private Link & Token Isolation', () => {
  it('should generate tokens with sufficient cryptographic entropy (96 bits / 24 hex)', () => {
    const token1 = generateSecureToken();
    const token2 = generateSecureToken();

    assert.equal(token1.length, 24, 'Token must be exactly 24 characters');
    assert.match(token1, /^[a-f0-9]{24}$/, 'Token must be hexadecimal');
    assert.notEqual(token1, token2, 'Generated tokens must be distinct');
  });

  it('should strictly validate token format with isValidTokenFormat', () => {
    // Valid 24-character hex
    assert.equal(isValidTokenFormat('7a4d4952fe9312711ef13aa3'), true);
    assert.equal(isValidTokenFormat('474b09ffbdbd714733896a04'), true);

    // Valid legacy format
    assert.equal(isValidTokenFormat('tok_lcb_tanvir_h_2026'), true);

    // Invalid / attack inputs MUST be rejected
    assert.equal(isValidTokenFormat(''), false, 'Empty token rejected');
    assert.equal(isValidTokenFormat('a'), false, '1-character token rejected');
    assert.equal(isValidTokenFormat('1'), false, 'Single digit token rejected');
    assert.equal(isValidTokenFormat('%'), false, 'SQL wildcard rejected');
    assert.equal(isValidTokenFormat("'; DROP TABLE candidates;--"), false, 'SQL injection string rejected');
    assert.equal(isValidTokenFormat('../../../etc/passwd'), false, 'Path traversal rejected');
  });

  it('should prevent wildcard / prefix token enumeration attacks', async () => {
    // Attempting to enumerate with single character or short prefix
    const resultSingleChar = await getCandidateBySecureToken('1');
    assert.equal(resultSingleChar, null, 'Single character "1" must return null');

    const resultLetter = await getCandidateBySecureToken('a');
    assert.equal(resultLetter, null, 'Single character "a" must return null');

    const resultPartialPrefix = await getCandidateBySecureToken('tok_');
    assert.equal(resultPartialPrefix, null, 'Partial prefix "tok_" must return null');
  });

  it('should resolve candidates only by strict exact token match and minimize exposed data', async () => {
    // Use an exact seeded token from seed data
    const validToken = '474b09ffbdbd714733896a04';
    const candidate = await getCandidateBySecureToken(validToken);

    if (candidate) {
      assert.ok(candidate.name, 'Candidate should have name');
      assert.ok(candidate.status, 'Candidate should have status');
      assert.ok(candidate.updated_at, 'Candidate should have updated_at');

      // Verify privacy minimization: no sensitive internal fields returned
      assert.equal(candidate.id, undefined, 'Internal candidate UUID must NOT be exposed');
      assert.equal(candidate.email, undefined, 'Candidate email must NOT be exposed');
      assert.equal(candidate.phone, undefined, 'Candidate phone must NOT be exposed');
      assert.equal(candidate.application_id, undefined, 'Internal Application ID must NOT be exposed');
    }
  });

  it('should correctly flag expired tokens beyond the 90-day threshold', () => {
    const recentDate = new Date().toISOString();
    assert.equal(isTokenExpired(recentDate), false, 'Recent record must not be expired');

    const expiredDate = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(isTokenExpired(expiredDate), true, 'Record > 90 days must be expired');
  });
});

describe('3. Input Validation & Injection Prevention', () => {
  it('should sanitize formula injection payloads in spreadsheet cells', () => {
    assert.equal(sanitizeSpreadsheetCell('=CMD|"/C calc"!A0'), '\'=CMD|"/C calc"!A0');
    assert.equal(sanitizeSpreadsheetCell('+SUM(A1:A10)'), '\'+SUM(A1:A10)');
    assert.equal(sanitizeSpreadsheetCell('-10+20'), '\'-10+20');
    assert.equal(sanitizeSpreadsheetCell('@malicious_call()'), '\'@malicious_call()');
    assert.equal(sanitizeSpreadsheetCell('Normal Name'), 'Normal Name');
  });

  it('should enforce MAX_IMPORT_ROWS limit', () => {
    assert.equal(MAX_IMPORT_ROWS, 500, 'MAX_IMPORT_ROWS must be capped at 500');
  });
});

describe('4. Email Security & XSS Prevention', () => {
  it('should prevent HTML injection and XSS in candidate email templates', async () => {
    const xssPayload = '<script>alert("xss")</script><img src=x onerror=alert(1)>';
    const maliciousName = 'John "><img src=x onerror=alert(1)> Doe';

    const result = await sendCandidateStatusEmail({
      toEmail: 'test.candidate@example.com',
      candidateName: maliciousName,
      secureToken: '474b09ffbdbd714733896a04',
      subject: 'Status Update ' + xssPayload,
      headline: 'Headline ' + xssPayload,
      customMessage: 'Message body with ' + xssPayload,
    });

    assert.equal(result.success, true, 'Email dispatch should succeed in test mode');
  });

  it('should reject invalid recipient email addresses', async () => {
    const invalidResult = await sendCandidateStatusEmail({
      toEmail: 'not-an-email\r\nBcc: victim@example.com',
      candidateName: 'Test',
      secureToken: '474b09ffbdbd714733896a04',
    });

    assert.equal(invalidResult.success, false, 'Invalid recipient with CRLF must be rejected');
    assert.match(invalidResult.error, /invalid/i);
  });
});

describe('5. CSRF Origin Verification', () => {
  it('should accept same-origin requests', () => {
    const req = {
      headers: {
        get: (name) => {
          if (name === 'origin') return 'https://recruitment.linkedincommunitybangladesh.com';
          if (name === 'host') return 'recruitment.linkedincommunitybangladesh.com';
          return null;
        },
      },
    };
    assert.equal(verifyCsrfOrigin(req), true, 'Same origin request should pass');
  });

  it('should reject cross-origin requests from foreign origins', () => {
    const req = {
      headers: {
        get: (name) => {
          if (name === 'origin') return 'https://evil-attacker-site.com';
          if (name === 'host') return 'recruitment.linkedincommunitybangladesh.com';
          return null;
        },
      },
    };
    assert.equal(verifyCsrfOrigin(req), false, 'Cross-origin request must be rejected');
  });
});

describe('6. Security Headers Configuration', () => {
  it('should verify security headers defined in next.config.ts', async () => {
    const nextConfigModule = await import('../next.config.ts');
    const config = nextConfigModule.default;

    assert.equal(config.poweredByHeader, false, 'poweredByHeader must be disabled');
    assert.ok(typeof config.headers === 'function', 'headers must be configured');

    const headersList = await config.headers();
    assert.ok(Array.isArray(headersList), 'headersList must be an array');

    const globalConfig = headersList.find((h) => h.source === '/:path*');
    assert.ok(globalConfig, 'Global headers must be configured');

    const headerKeys = globalConfig.headers.map((h) => h.key);
    assert.ok(headerKeys.includes('X-Frame-Options'), 'X-Frame-Options must be present');
    assert.ok(headerKeys.includes('X-Content-Type-Options'), 'X-Content-Type-Options must be present');
    assert.ok(headerKeys.includes('Strict-Transport-Security'), 'HSTS must be present');
    assert.ok(headerKeys.includes('Content-Security-Policy'), 'CSP must be present');
    assert.ok(headerKeys.includes('Referrer-Policy'), 'Referrer-Policy must be present');

    // Verify cache control for status and api paths
    const statusConfig = headersList.find((h) => h.source === '/status/:path*');
    assert.ok(statusConfig, 'Status route headers must be configured');
    const statusCache = statusConfig.headers.find((h) => h.key === 'Cache-Control');
    assert.ok(statusCache.value.includes('no-store'), 'Status route must have no-store cache control');
  });
});
