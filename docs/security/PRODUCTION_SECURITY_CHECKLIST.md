# LinkedIn Community Bangladesh (LCB) HR Recruitment Portal
## Production Security Deployment Checklist

**Document Version:** 1.0.0  
**Target Environment:** Production (Vercel / Supabase / Resend)  
**Applicability:** Pre-Launch & Maintenance  

---

### Phase 1: Environment Variables & Secret Generation

Ensure the following variables are securely configured in your production hosting provider (e.g. Vercel Project Settings > Environment Variables). **Never check production secrets into Git.**

- [ ] **1.1 Generate High-Entropy Session Secret**
  Generate a 64-character random hex string for signing HMAC cookies:
  ```bash
  openssl rand -hex 32
  ```
  Set this as `SESSION_SECRET` in production.

- [ ] **1.2 Configure Strong HR Administrator Password**
  Generate an unguessable password for the HR admin console:
  ```bash
  openssl rand -base64 24
  ```
  Set this as `HR_ADMIN_PASSWORD`. Confirm that legacy defaults (`admin` / `lcb_recruitment_2026!`) are completely omitted.

- [ ] **1.3 Secure Supabase API Keys**
  - Set `NEXT_PUBLIC_SUPABASE_URL` to your production Supabase project URL (`https://<project-ref>.supabase.co`).
  - Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your Supabase publishable anon key.
  - Set `SUPABASE_SERVICE_ROLE_KEY` **strictly as a server-side environment variable** (ensure it does **not** have the `NEXT_PUBLIC_` prefix).

- [ ] **1.4 Configure Resend Production API Key**
  - Set `RESEND_API_KEY` to your active Resend API key.
  - Set `EMAIL_FROM` to an authorized domain email (e.g., `HR Team <hr@community.linkedinbangladesh.org>`).

---

### Phase 2: Supabase Database Hardening & Migration

- [ ] **2.1 Execute Security Migration**
  Open the **Supabase Dashboard** > **SQL Editor** for your production project.  
  Paste and execute the contents of:
  ```
  supabase/migrations/20261010_security_hardening.sql
  ```
  This script performs the following critical actions:
  - Enables Row Level Security (RLS) on `candidates` table.
  - Drops legacy permissive public read/write policies (`USING (true)`).
  - Revokes `SELECT`, `INSERT`, `UPDATE`, and `DELETE` grants from `anon` and `public` roles.
  - Grants necessary operations strictly to `service_role`.
  - Hardens `get_candidate_status_by_token` with `SET search_path = public, pg_temp;`.

- [ ] **2.2 Verify RLS Status in Supabase Dashboard**
  Navigate to **Database** > **Tables** > `candidates`. Confirm that:
  - `RLS Enabled` is toggled **ON**.
  - No anonymous public policies exist allowing unconstrained queries.

- [ ] **2.3 Test Direct Anonymous Query Block**
  Using a REST client or browser console with your public Supabase URL and anon key, attempt to query the `candidates` table:
  ```bash
  curl -i -H "apikey: <ANON_KEY>" \
       -H "Authorization: Bearer <ANON_KEY>" \
       https://<project-ref>.supabase.co/rest/v1/candidates
  ```
  **Expected Result:** Empty array `[]` or `401/403 Permission Denied`.

---

### Phase 3: Email Domain Authentication (DNS Records)

To ensure reliable delivery and protect the domain against email spoofing:

- [ ] **3.1 SPF (Sender Policy Framework)**
  Add a TXT record for your sending domain:
  `v=spf1 include:amazonses.com include:resend.com ~all`
- [ ] **3.2 DKIM (DomainKeys Identified Mail)**
  Configure the 3 CNAME records generated in your Resend domain settings.
- [ ] **3.3 DMARC (Domain-based Message Authentication)**
  Configure a DMARC TXT record on `_dmarc.yourdomain.org`:
  `v=DMARC1; p=reject; rua=mailto:dmarc-reports@yourdomain.org;`

---

### Phase 4: Edge & Transport Security

- [ ] **4.1 Verify HTTPS & HSTS**
  Ensure Vercel / domain enforces SSL/TLS 1.3 with automatic HTTPS redirection.
- [ ] **4.2 Inspect Security Headers**
  Verify security headers on the production domain using `curl -I https://your-recruitment-domain.com`:
  - `Content-Security-Policy`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [ ] **4.3 Verify Cache-Control on Private Endpoints**
  Confirm that `https://your-recruitment-domain.com/status/<token>` responds with `Cache-Control: no-store, no-cache, must-revalidate` to prevent CDN or proxy caching of private candidate details.

---

### Phase 5: Distributed Rate Limiting & Monitoring

- [ ] **5.1 Upgrade to Redis-Backed Rate Limiting (Recommended for High Scale)**
  If deploying to multi-instance serverless environments, connect an Upstash Redis or Vercel KV instance to synchronize:
  - Login attempts (5 / 15 min).
  - Candidate status lookups (60 / 15 min).
  - Email dispatch cooldowns (10s per candidate).
- [ ] **5.2 Error Monitoring**
  Configure Sentry or Vercel Monitoring. Verify that:
  - Error logs **never** capture bearer tokens, candidate emails, or session secrets.
  - Generic user-facing error messages are displayed to clients.

---

### Phase 6: Emergency Incident Response & Token Revocation

- [ ] **6.1 Invalidate All Active HR Admin Sessions**
  In the event of suspected session compromise:
  1. Rotate `SESSION_SECRET` in environment variables.
  2. Redeploy the application.
  *Result:* All existing HMAC session tokens immediately fail signature verification.
- [ ] **6.2 Invalidate an Individual Candidate Token**
  In the event a candidate status link is leaked:
  1. Access the HR console or execute a direct Supabase update:
     ```sql
     UPDATE candidates 
     SET secure_token = encode(gen_random_bytes(12), 'hex'),
         updated_at = NOW()
     WHERE id = '<CANDIDATE_ID>';
     ```
  2. Re-send the updated notification email with the fresh token to the candidate.
