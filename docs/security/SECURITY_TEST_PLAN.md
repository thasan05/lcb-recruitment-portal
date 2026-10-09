# LinkedIn Community Bangladesh (LCB) HR Recruitment Portal
## Security Test Plan & Verification Matrix

**Document Version:** 1.0.0  
**Assessment Date:** October 2026  
**Scope:** Automated & Manual Security Verification  
**Standard:** OWASP ASVS 5.0.0 Level 2 / OWASP Top 10  
**Target Repository:** `lcb-recruitment-portal`  

---

### 1. Test Objectives & Framework

The Security Test Plan provides a structured, repeatable methodology for verifying security controls implemented across the LCB HR Recruitment Portal. It encompasses:
1. **Automated Unit & Integration Security Tests** executing within `tests/security.test.mjs`.
2. **Manual Penetration Testing Steps** for validating controls in staging or local environments.
3. **Continuous Integration (CI) Verification** to prevent security regressions during ongoing development.

---

### 2. Automated Test Execution

#### 2.1 Running the Security Suite
The automated security tests leverage Node.js’s native test runner with `tsx` for TypeScript execution:

```bash
# Execute the full automated security test suite
npm test

# Alternatively, execute the security-specific script
npm run test:security
```

Expected Execution Output:
```
✔ 1. Authentication & Session Management Security (8 tests pass)
✔ 2. Candidate Private Link & Token Isolation (5 tests pass)
✔ 3. Input Validation & Injection Prevention (2 tests pass)
✔ 4. Email Security & XSS Prevention (2 tests pass)
✔ 5. CSRF Origin Verification (2 tests pass)
✔ 6. Security Headers Configuration (1 test pass)
ℹ tests 20 | pass 20 | fail 0
```

---

### 3. Automated Test Matrix

| Test ID | Test Category | Target Component / Function | Verification Assertion | OWASP ASVS | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST-01** | Authentication | `verifyCredentials` | Accepts valid configured credentials via `crypto.timingSafeEqual` | V2.1.1 | 🟢 Pass |
| **TEST-02** | Authentication | `verifyCredentials` | Rejects legacy hardcoded default password (`admin` / `lcb_recruitment_2026!`) | V2.1.2 | 🟢 Pass |
| **TEST-03** | Authentication | `verifyCredentials` | Rejects unconfigured default username when custom username is set | V2.1.2 | 🟢 Pass |
| **TEST-04** | Authentication | `verifyCredentials` | Rejects empty or missing username/password inputs | V2.1.7 | 🟢 Pass |
| **TEST-05** | Session Mgmt | `createSessionToken` / `verifySessionToken` | Successfully creates and validates HMAC-SHA256 signed session tokens | V3.2.1 | 🟢 Pass |
| **TEST-06** | Session Mgmt | `verifySessionToken` | Rejects forged signatures and tampered nonces | V3.2.2 | 🟢 Pass |
| **TEST-07** | Session Mgmt | `verifySessionToken` | Rejects expired session tokens (> 24-hour lifetime) | V3.4.1 | 🟢 Pass |
| **TEST-08** | Session Mgmt | `verifySessionToken` | Rejects malformed strings and non-base64 tokens | V3.2.3 | 🟢 Pass |
| **TEST-09** | Token Isolation | `generateSecureToken` | Token has 96 bits of cryptographic entropy (24 hex characters) | V9.1.1 | 🟢 Pass |
| **TEST-10** | Token Isolation | `isValidTokenFormat` | Rejects invalid characters, lengths != 24 or 32, and special symbols | V9.1.2 | 🟢 Pass |
| **TEST-11** | Token Isolation | `getCandidateByToken` | Prevents wildcard (`%`), prefix (`starts_with`), and partial matches | V4.1.1 | 🟢 Pass |
| **TEST-12** | Token Isolation | `getCandidateByToken` / `toPublicView` | Resolves strictly by exact token match and strips private PII fields | V4.2.1 | 🟢 Pass |
| **TEST-13** | Token Isolation | `isTokenExpired` | Correctly flags tokens past the 90-day validity window | V3.4.2 | 🟢 Pass |
| **TEST-14** | Input Validation | `sanitizeSpreadsheetCell` | Neutralizes formula injection payloads starting with `=`, `+`, `-`, `@` | V5.1.4 | 🟢 Pass |
| **TEST-15** | Input Validation | `MAX_IMPORT_ROWS` | Enforces hard ceiling of 500 rows per spreadsheet import | V11.1.1 | 🟢 Pass |
| **TEST-16** | Email Security | `escapeHtml` / `generateEmailHtml` | Prevents HTML injection & XSS from candidate names and custom messages | V5.3.1 | 🟢 Pass |
| **TEST-17** | Email Security | `sendCandidateEmail` | Rejects invalid or malformed recipient email addresses | V5.1.3 | 🟢 Pass |
| **TEST-18** | CSRF Protection | `verifyCsrfOrigin` | Permits valid same-origin requests matching `Origin` or `Host` | V4.2.2 | 🟢 Pass |
| **TEST-19** | CSRF Protection | `verifyCsrfOrigin` | Rejects cross-origin requests from unauthorized origins | V4.2.2 | 🟢 Pass |
| **TEST-20** | HTTP Headers | `next.config.ts` | Enforces CSP, HSTS, X-Frame-Options: DENY, and nosniff headers | V14.4.1 | 🟢 Pass |

---

### 4. Manual Verification Procedures

In addition to automated tests, the following manual procedures should be performed periodically:

#### Procedure 1: Candidate Token Enumeration Attempt
1. Start the local server: `npm run dev`.
2. Issue a curl request with a 1-character token:
   ```bash
   curl -i http://localhost:3000/api/candidate/a
   ```
3. **Expected Result:** HTTP 404 with JSON `{ "error": "Candidate not found" }` and `Cache-Control: no-store`.
4. Issue a curl request with a wildcard token:
   ```bash
   curl -i http://localhost:3000/api/candidate/%25
   ```
5. **Expected Result:** HTTP 404 (rejected by `isValidTokenFormat`).

#### Procedure 2: CSRF Validation on Admin Mutation
1. Obtain an authenticated `hr_admin_session` cookie.
2. Issue a `POST` request with an external `Origin` header:
   ```bash
   curl -i -X POST http://localhost:3000/api/admin/candidates \
     -H "Cookie: hr_admin_session=<SESSION_TOKEN>" \
     -H "Origin: https://malicious-site.com" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@example.com"}'
   ```
3. **Expected Result:** HTTP 403 Forbidden with JSON `{ "error": "Invalid request origin (CSRF protection)" }`.

#### Procedure 3: Login Rate Limit Verification
1. Attempt 6 rapid invalid logins to `/api/auth/login`:
   ```bash
   for i in {1..6}; do
     curl -i -X POST http://localhost:3000/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"username":"admin","password":"wrongpassword"}'
   done
   ```
2. **Expected Result:** The 6th attempt returns HTTP 429 Too Many Requests with `{ "error": "Too many failed login attempts. Please try again in 15 minutes." }`.

---

### 5. Continuous Integration (CI) Guidelines

To maintain security posture over time, configure GitHub Actions or your deployment pipeline to run the security verification on every push:

```yaml
name: Security & Build Verification
on: [push, pull_request]

jobs:
  security-verification:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npx tsc --noEmit
      - run: npm run build
```
