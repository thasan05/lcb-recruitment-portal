# LinkedIn Community Bangladesh (LCB) HR Recruitment Portal
## Threat Model & Attack Surface Analysis

**Document Version:** 1.0.0  
**Assessment Date:** October 2026  
**Status:** Hardened & Verified  
**Target Repository:** `lcb-recruitment-portal`  
**Frameworks:** STRIDE, OWASP ASVS 5.0.0, OWASP Top 10  

---

### 1. Executive Architecture Overview

The LinkedIn Community Bangladesh (LCB) Recruitment Portal is a Next.js (App Router) web application designed for HR administrators to manage candidate interview pipelines, import candidate cohorts from spreadsheets, dispatch status notification emails via Resend, and provide candidates with private status tracking pages via unguessable bearer tokens.

```
                    +------------------------------------+
                    |        Public Internet / WAN       |
                    +-----------------+------------------+
                                      |
         +----------------------------+----------------------------+
         | (Public / HTTPS)                                        | (Bearer Token Link)
         v                                                         v
+-----------------------+                                 +-----------------------+
|  HR Admin Login       |                                 |  Candidate Status UI  |
|  /admin, /api/auth    |                                 |  /status/[token]      |
+-----------+-----------+                                 +-----------+-----------+
            | (HMAC Cookie)                                           | (Token Query)
            v                                                         v
+---------------------------------------------------------------------------------+
|                       Next.js App Server (Node.js Runtime)                     |
|                                                                                 |
|  - Middleware & Security Headers (CSP, HSTS, XFO, Anti-Sniff)                   |
|  - Auth Layer (Constant-time verification, HMAC-SHA256 session tokens)          |
|  - Rate Limiters (Login: 5/15m, Token: 60/15m, Email cooldown: 10s)             |
|  - Sanitizers (HTML escaping for emails, Spreadsheet formula neutralizer)       |
|  - Origin / CSRF Verification (Host & Origin validation)                        |
+------------------------+--------------------------------+-----------------------+
                         |                                |
         (Service Role / SSL)                             | (HTTPS API)
                         v                                v
+------------------------------------+       +------------------------------------+
|  Supabase PostgreSQL Database       |       |  Resend Email Delivery API         |
|  - Strict RLS on candidates table   |       |  - Transactional HTML Templates   |
|  - Public/Anon grants revoked       |       |  - Sanitized variables & headers   |
|  - Search-path locked RPC function  |       +------------------------------------+
+------------------------------------+
```

---

### 2. Assets & Sensitivity Classification

| Asset | Sensitivity | Impact of Compromise | Primary Safeguards |
| :--- | :--- | :--- | :--- |
| **Candidate PII** (Full Name, Email, Phone, University, LinkedIn URL) | **Confidential** | Privacy breach, reputational loss, GDPR / regional data compliance violation. | Strict RLS, minimal public API views, exact token matching only. |
| **Recruitment Status & Feedback** (Selection/Rejection, Interview Date/Venue) | **Confidential** | Unauthorized status disclosure, pipeline disruption, social engineering. | Private 96-bit bearer tokens, sanitized public view transformation. |
| **HR Admin Session Credentials** | **Critical** | Complete administrative takeover, unauthorized candidate modification/deletion, mass email abuse. | Environment-bound credentials, constant-time compare, HMAC cookies, rate limiting. |
| **Resend API Key & Supabase Service Role Key** | **Critical** | Database takeover, quota exhaustion, malicious mass mailing under domain reputation. | Server-only scope, hardcoded fallbacks eliminated, gitignored env files. |
| **Transactional Email Delivery Reputation** | **High** | Blacklisting of recruitment domain, spam classification. | HTML escaping, CRLF header injection neutralization, rate limits. |

---

### 3. Trust Boundaries & Zones

1. **Zone 0: Public / Untrusted Internet**
   - Untrusted applicants, automated web crawlers, credential-stuffing bots.
   - May interact only with the landing page (`/`), HR login interface (`/admin`), and token verification endpoints (`/status/:token`, `/api/candidate/:token`).
2. **Zone 1: Candidate Access Zone (Possession of Bearer Token)**
   - Holders of a unique status link containing a 24-character hex token (96-bit entropy).
   - Authorized solely to read their own public candidate status view via `/api/candidate/:token`.
   - Cannot query or infer any other candidate's status or details.
3. **Zone 2: Privileged HR Administrative Zone**
   - Authenticated HR personnel holding a valid `hr_admin_session` HMAC-signed cookie.
   - Authorized to create, update, delete, search, and bulk-import candidates, and trigger notification emails.
4. **Zone 3: Server Execution Environment**
   - Next.js server runtime running inside secure hosting (e.g. Vercel). Holds `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and `HR_ADMIN_PASSWORD`.
5. **Zone 4: Persistent Data Store (Supabase PostgreSQL)**
   - Database storage. Direct client access is restricted; all operations must proceed via hardened server functions or authorized service role queries.

---

### 4. Threat Actors

- **TA-01: Anonymous External Attacker (Script Kiddie / Botnet)**
  - Motive: Opportunistic exploitation, automated vulnerability scanning, brute-forcing admin logins, DoS.
- **TA-02: Malicious / Curious Candidate**
  - Motive: Discovering other applicants' statuses, enumerating the applicant pool, tampering with interview schedules, or escalating privileges to access the HR console.
- **TA-03: Compromised / Malicious File Provider**
  - Motive: Uploading malicious CSV/Excel files containing formula injection (`=cmd|' /C ...'`), payload bloat, or XSS vectors to compromise HR administrator workstations.
- **TA-04: Network Eavesdropper / Man-in-the-Middle (MitM)**
  - Motive: Intercepting session cookies or candidate bearer tokens over unencrypted channels.

---

### 5. STRIDE Threat Analysis

#### 5.1 Spoofing (Identity & Origin)
- **Threat S1: HR Admin Session Cookie Forgery**
  - *Risk:* Attacker fabricates an arbitrary admin session cookie to gain full access to `/admin` and `/api/admin/*`.
  - *Mitigations Implemented:* Enforced cryptographic HMAC-SHA256 signatures (`verifySessionToken`) using a high-entropy `SESSION_SECRET` with strict expiration (24h) and payload validation.
- **Threat S2: Cross-Site Request Forgery (CSRF)**
  - *Risk:* Attacker tricks an authenticated HR user into submitting state-changing requests (e.g., deleting candidates or mass sending emails) via a third-party website.
  - *Mitigations Implemented:* `verifyCsrfOrigin` strictly inspects `Origin` and `Host` request headers on all state-changing `POST`, `PUT`, `PATCH`, and `DELETE` admin routes; cookies set with `SameSite: Lax`.
- **Threat S3: Candidate Identity Spoofing**
  - *Risk:* Attacker impersonates another candidate by forging or guessing their bearer token.
  - *Mitigations Implemented:* 96-bit cryptographic entropy (`crypto.randomBytes(12).toString('hex')`), strict 24-character hex validation, removal of all wildcard/prefix matching.

#### 5.2 Tampering
- **Threat T1: Candidate Status & Information Tampering via Public API**
  - *Risk:* Unauthenticated users invoke candidate endpoints to alter recruitment status.
  - *Mitigations Implemented:* `/api/candidate/[token]` provides strictly read-only `GET` access; all mutation endpoints (`/api/admin/candidates/*`) enforce mandatory `checkAdminAuth` authentication.
- **Threat T2: Spreadsheet Formula Injection (CSV / Excel)**
  - *Risk:* Malicious candidate submits a formula in their name or details (`=HYPERLINK(...)` or `=cmd|...`) which executes when HR exports data into Microsoft Excel.
  - *Mitigations Implemented:* `sanitizeSpreadsheetCell` prefixes cells starting with `=`, `+`, `-`, or `@` with a single apostrophe (`'`) and strips control characters.
- **Threat T3: Database Tampering via Public Anon Role**
  - *Risk:* Anonymous attacker with the Supabase project URL and anon key writes directly to the `candidates` table.
  - *Mitigations Implemented:* Revoked all `anon` and `public` `INSERT`, `UPDATE`, and `DELETE` grants in migration `20261010_security_hardening.sql`; enabled strict RLS.

#### 5.3 Repudiation
- **Threat R1: Unaudited Mass Operations**
  - *Risk:* Unauthorized status changes or email blasts occur without trace.
  - *Mitigations Implemented:* Structured audit logging on server actions (recording candidate ID, action type, IP hash, and timestamp); detailed API response logging without exposing PII.

#### 5.4 Information Disclosure
- **Threat I1: Candidate Token Enumeration / Wildcard Leakage**
  - *Risk:* Prior implementation matched tokens using `raw.startsWith(token)` and `ilike('%token%')`, allowing single-character queries (e.g. `a`) to expose candidate records.
  - *Mitigations Implemented:* Removed all prefix and wildcard matching in both TypeScript and PostgreSQL; enforced exact string matching (`===`) and strict token length/format validation (`isValidTokenFormat`).
- **Threat I2: Over-Exposure of Private Fields in Candidate Status View**
  - *Risk:* Candidate status view returns internal HR notes, email addresses, phone numbers, or tokens of other applicants.
  - *Mitigations Implemented:* `toPublicView` projection strictly strips internal fields, returning only `name`, `status`, `interviewDate`, `interviewVenue`, and `interviewTime`.
- **Threat I3: Information Leakage via HTTP Headers & Error Traces**
  - *Risk:* Stack traces and server technology details leaked to untrusted clients.
  - *Mitigations Implemented:* Removed `X-Powered-By` header; added comprehensive security headers (CSP, HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: strict-origin-when-cross-origin); sanitized error messages across all API route handlers.

#### 5.5 Denial of Service (DoS)
- **Threat D1: HR Login Brute-Force & Credential Stuffing**
  - *Risk:* Attacker floods `/api/auth/login` to exhaust resources or guess passwords.
  - *Mitigations Implemented:* In-memory IP rate limiter restricts login attempts to 5 attempts per 15 minutes with exponential cool-off.
- **Threat D2: Candidate Status Endpoint Flooding**
  - *Risk:* Attacker floods `/api/candidate/[token]` causing database exhaustion.
  - *Mitigations Implemented:* Rate limited to 60 requests per 15 minutes per IP; response cached at edge with `Cache-Control: no-store, private` to prevent stale caching.
- **Threat D3: Large File Upload / Memory Exhaustion**
  - *Risk:* Uploading a 500 MB Excel file crashes the Next.js Node process.
  - *Mitigations Implemented:* Client and server request body limits (1 MB on import, 16 KB on JSON endpoints, max 500 candidate rows).
- **Threat D4: Email Flooding / Resend API Quota Exhaustion**
  - *Risk:* Script rapidly hits `/send-email` to spam candidates or deplete Resend quota.
  - *Mitigations Implemented:* Enforced 10-second per-candidate email cooldown.

#### 5.6 Elevation of Privilege
- **Threat E1: Supabase Function Search Path Hijacking**
  - *Risk:* A malicious user creates a conflicting function/table in an unprivileged schema to hijack `SECURITY DEFINER` execution in PostgreSQL.
  - *Mitigations Implemented:* Altered `get_candidate_status_by_token` to explicitly enforce `SET search_path = public, pg_temp;`.
- **Threat E2: Hardcoded Credential / Secret Fallbacks**
  - *Risk:* In unconfigured environments, default passwords (`admin`, `lcb_recruitment_2026!`) allow administrative takeover.
  - *Mitigations Implemented:* Completely removed all fallback credentials from `src/lib/auth.ts` and `src/lib/supabase.ts`; application refuses authentication unless cryptographically secure variables are explicitly defined.

---

### 6. Residual Risks & Operational Assumptions

1. **In-Memory Rate Limiting:**
   - *Observation:* The current rate limiters (`authRateLimiter`, `candidateRateLimiter`, `emailCooldown`) operate in-memory within each Node.js process. In multi-instance serverless deployments (e.g. Vercel with multiple lambdas), counters are per-container.
   - *Recommendation:* In high-traffic production environments, integrate an external Redis-backed rate limiter (e.g., Upstash Redis) to synchronize rate limits across distributed edge functions.
2. **Database Migration Execution:**
   - *Observation:* Migration `supabase/migrations/20261010_security_hardening.sql` is committed to the repository and ready for application, but requires execution against the live Supabase SQL editor by the database administrator.
