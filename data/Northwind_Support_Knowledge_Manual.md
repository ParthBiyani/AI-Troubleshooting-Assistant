---
title: "L1/L2 Technical Support Knowledge Manual"
subtitle: "Troubleshooting Guide for Payment Platform, POS Terminals and Supporting Infrastructure"
organization: "Northwind Payments (fictional organisation, sample data)"
document_id: "NWP-TSO-KB-001"
version: "3.2"
classification: "Internal — Sample / Simulated Data"
---

# L1/L2 Technical Support Knowledge Manual

**Troubleshooting Guide for the Payment Platform, POS Terminals and Supporting Infrastructure**

**Northwind Payments — Technology Support Operations**

> **Disclaimer:** Northwind Payments is a fictional organisation. Every system name, team, error code, threshold and procedure in this manual is simulated sample data, prepared for the *AI Troubleshooting Assistant for L1/L2 Support* assignment. None of it describes any real company's production environment.

---

## Document Control

| Field | Value |
|---|---|
| Document ID | NWP-TSO-KB-001 |
| Version | 3.2 |
| Status | Approved for internal use |
| Owner | Technology Support Operations (TSO) |
| Reviewers | Payments Platform Engineering, SRE, Terminal Engineering |
| Effective date | 01 October 2026 |
| Next review | 01 January 2027 |
| Classification | Internal — Sample / Simulated Data |

### Revision History

| Version | Date | Author | Summary of change |
|---|---|---|---|
| 1.0 | 15 Jan 2026 | TSO Knowledge Team | Initial release (22 entries) |
| 2.0 | 10 May 2026 | TSO Knowledge Team | Added POS terminal, EMI and settlement sections |
| 3.0 | 01 Sep 2026 | TSO Knowledge Team | Added infrastructure, release and observability sections; new entry format |
| 3.2 | 01 Oct 2026 | TSO Knowledge Team | Added UPI and card-network entries; updated escalation directory |

---

## Table of Contents

1. Purpose and Scope
2. How to Use This Manual
3. Incident Priority Definitions
4. Escalation Directory
5. Knowledge Entry Format
6. Section A — Payment API and Gateway (KB-PAY)
7. Section B — UPI Payments (KB-UPI)
8. Section C — Card Payments and Authentication (KB-CARD)
9. Section D — POS Terminals (KB-TRM)
10. Section E — EMI and Affordability (KB-EMI)
11. Section F — Settlement and Reconciliation (KB-STL)
12. Section G — Refunds (KB-RFD)
13. Section H — Databases (KB-DB)
14. Section I — Infrastructure and Network (KB-INF)
15. Section J — Identity and Access (KB-IAM)
16. Section K — Merchant Onboarding and Dashboard (KB-MER)
17. Section L — Releases and Configuration (KB-REL)
18. Section M — Observability and Batch Jobs (KB-OBS)
19. Appendix A — Glossary
20. Appendix B — Common Diagnostic Commands

---

## 1. Purpose and Scope

This manual is the reference for Level 1 (L1) and Level 2 (L2) support engineers handling recurring technical issues on the Northwind Payments platform. It covers:

- Online payments (Payments API, hosted checkout, webhooks)
- UPI and card payment flows
- Android POS terminals deployed at merchant locations
- EMI / affordability products
- Settlement, reconciliation and refunds
- The shared infrastructure underneath (databases, Kubernetes, network, caches, messaging)

**Out of scope:** product pricing questions, commercial disputes, legal and compliance interpretations, HR and IT-helpdesk issues (laptops, email, VPN for employees), and any issue not described here. For these, record the ticket and route it to the correct business owner. Do **not** improvise a technical resolution.

## 2. How to Use This Manual

1. **Match the symptom.** Search the entry titles, symptoms and keywords for what the merchant or the monitoring alert reports.
2. **Run the diagnostic checks in order.** They go from cheapest and least invasive to most invasive. Record the result of every check in the ticket.
3. **Apply only the documented resolution.** If the checks point to a cause the entry does not cover, stop and escalate.
4. **Escalate with evidence.** Every escalation must include the details listed in the entry's *Escalation* block (trace IDs, timestamps, MID/TID, error codes, check results).
5. **Never share** full card numbers (PAN), CVV, PINs, OTPs, API secrets or customer personal data in tickets, chat or email. Mask PANs as `XXXX XXXX XXXX 1234`.

L1 engineers may run all checks marked *(L1)*. Checks marked *(L2)* need production read access. Changes marked *(L2 + approval)* need a change ticket approved by the on-call lead.

## 3. Incident Priority Definitions

| Priority | Definition | Examples | Response target | Update cadence |
|---|---|---|---|---|
| **P1 — Critical** | Platform-wide or major outage; money movement stopped or at risk; security breach | Payment API failure rate above 5% for 5+ minutes, settlement run failed, expired production certificate, suspected data breach | 15 minutes | Every 30 minutes |
| **P2 — High** | Significant degradation or a large merchant / partner bank affected; workaround may exist | One issuing bank down, UPI success rate down 10+ points, refunds stuck for many merchants | 30 minutes | Every 1 hour |
| **P3 — Medium** | Single merchant or limited feature impact; business can continue | One terminal offline, report download failing for one merchant, webhook delays for one merchant | 4 business hours | Daily |
| **P4 — Low** | Cosmetic, informational or how-to request | Receipt formatting, documentation query | 2 business days | On resolution |

**Raise to P1 regardless of volume if** there is any suspected security incident, any possibility of double debit at scale, or any loss of transaction data.

## 4. Escalation Directory

| Team | Code | Owns | Channel | Hours |
|---|---|---|---|---|
| L1 Support Desk | L1-DESK | First response, triage, merchant communication | Ticket queue `TSO-L1` | 24x7 |
| L2 Application Support | L2-APP | Deep diagnosis, log analysis, known fixes | Ticket queue `TSO-L2`, Slack `#l2-app-support` | 24x7 |
| Payments Platform Engineering | PPE | Payments API, checkout, payment orchestration, webhooks | PagerDuty `ppe-oncall` | 24x7 on-call |
| Acquiring & Bank Partnerships | ABP | Bank / acquirer / NPCI connectivity, issuer escalations | Slack `#abp-bank-ops`, bank escalation matrix | 08:00–23:00, P1 on-call |
| Terminal Engineering | TERM-ENG | POS terminal app, terminal management system (TMS), key injection | PagerDuty `term-eng-oncall` | 24x7 on-call |
| Field Service Operations | FSO | On-site terminal replacement and repair | FSO portal | 09:00–21:00 |
| Settlement & Reconciliation Ops | SETTLE-OPS | Settlement runs, recon files, payouts, chargebacks | Slack `#settlement-ops` | 07:00–22:00, P1 on-call |
| Database Reliability Engineering | DBRE | PostgreSQL / MySQL clusters, replication, backups | PagerDuty `dbre-oncall` | 24x7 on-call |
| Site Reliability Engineering | SRE | Kubernetes, load balancers, Kafka, Redis, capacity | PagerDuty `sre-oncall` | 24x7 on-call |
| Network & Infrastructure | NET-INFRA | DNS, firewalls, VPN tunnels to banks, certificates | PagerDuty `netinfra-oncall` | 24x7 on-call |
| Information Security | INFOSEC | Security incidents, key compromise, fraud signals | `security@northwind.example`, PagerDuty `infosec` | 24x7 |
| Identity & Access Management | IAM | Merchant dashboard SSO, OTP delivery, internal RBAC | Ticket queue `IAM` | 09:00–21:00 |
| Merchant Onboarding & Risk | MOR | KYC, MID/TID activation, risk holds | Ticket queue `MOR` | 09:00–19:00 |
| Release Engineering | REL-ENG | Deployments, rollbacks, feature flags | Slack `#release-eng` | 09:00–23:00, on-call for P1 |
| Data Platform | DATA | Reporting pipelines, analytics, dashboard data | Ticket queue `DATA` | 09:00–19:00 |

## 5. Knowledge Entry Format

Every entry follows the same structure:

- **Header table:** ID, category, affected component, default priority, owning team, keywords / error codes
- **Symptoms:** what the merchant, customer or alert reports
- **Likely causes:** ordered from most to least common
- **Diagnostic checks:** numbered and tagged (L1) / (L2)
- **Resolution:** approved fixes for each cause
- **Escalation:** when to escalate, to which team, and what evidence to attach
- **Related entries**

---

## Section A — Payment API and Gateway (KB-PAY)

### KB-PAY-001 — Payments API returning HTTP 500 Internal Server Error

| Field | Value |
|---|---|
| Category | Payment API and Gateway |
| Component | Payments API v2 (`/v2/orders`, `/v2/payments`) |
| Default priority | P2 (P1 if 500s exceed 5% of requests for 5+ minutes) |
| Owning team | Payments Platform Engineering (PPE) |
| Keywords | HTTP 500, internal server error, payment API error, unhandled exception, `INTERNAL_ERROR` |

**Symptoms**

- Merchant reports `500 Internal Server Error` or error code `INTERNAL_ERROR` when creating an order or a payment.
- The Grafana *Payments API — Error Rate* panel shows a rise in 5xx responses.
- Customers see "Something went wrong, please try again" at checkout.

**Likely causes**

1. A downstream dependency (database, Redis, bank connector) is failing and the error is not handled cleanly.
2. A recent deployment introduced a bug (see KB-REL-001).
3. A malformed request payload is triggering an unhandled exception (usually affects only one merchant).
4. Missing configuration or secret after a deployment (see KB-REL-003).

**Diagnostic checks**

1. *(L1)* Check the status page and `#incident-room` for an ongoing incident. If one exists, link the ticket to it and stop.
2. *(L1)* Find out whether one merchant or many are affected: filter the Kibana dashboard *API Errors by MID* for the last 30 minutes.
3. *(L2)* Search application logs by the `trace_id` from the merchant's response header `X-Trace-Id`: `service:payments-api AND trace_id:<id>`. Read the stack trace.
4. *(L2)* Check dependency health on the Grafana *Payments Dependencies* panel: DB pool usage, Redis latency, bank connector error rate.
5. *(L2)* Check whether `payments-api` was deployed in the last 2 hours (`#release-eng` channel or `kubectl rollout history deploy/payments-api -n payments`).
6. *(L2)* For a single-merchant issue, compare the failing request body against the API schema. Look for null amounts, unsupported currency or bad `notes` JSON.

**Resolution**

- Dependency failure: follow the dependency's entry (KB-DB-001, KB-INF-006, KB-INF-008).
- Bad deployment: request a rollback from REL-ENG (KB-REL-001).
- Malformed payload: send the merchant the validation issue and the API reference section. No platform change is needed.

**Escalation**

- Escalate to **PPE** if 500s affect more than one merchant, or if the stack trace shows an unhandled exception in platform code.
- Attach: 3–5 sample `trace_id`s, time window, affected MIDs, error-rate screenshot, recent deploy details.

**Related entries:** KB-PAY-002, KB-DB-001, KB-REL-001, KB-REL-003

---

### KB-PAY-002 — Payments API timeouts / HTTP 504 Gateway Timeout

| Field | Value |
|---|---|
| Category | Payment API and Gateway |
| Component | Payments API, API gateway, bank connectors |
| Default priority | P2 (P1 if p95 latency > 10 s or timeout rate > 5%) |
| Owning team | Payments Platform Engineering (PPE) |
| Keywords | 504, gateway timeout, timeout, slow API, latency, `UPSTREAM_TIMEOUT`, read timed out |

**Symptoms**

- Merchants receive `504 Gateway Timeout` or the client times out after 30 s.
- Logs show `UPSTREAM_TIMEOUT` or `java.net.SocketTimeoutException: Read timed out`.
- The payment is sometimes still processed after the timeout, so the merchant's status is unknown.

**Likely causes**

1. Database slowness or connection pool exhaustion (KB-DB-001, KB-DB-002).
2. An issuing bank, acquirer or NPCI is responding slowly (KB-CARD-002, KB-UPI-005).
3. Pods are CPU-throttled or under-scaled during peak traffic (KB-INF-004).
4. Network problems between the gateway and the bank (KB-INF-008).

**Diagnostic checks**

1. *(L1)* Check whether timeouts are spread across all payment methods or limited to one bank or method (Kibana *Timeouts by Acquirer*).
2. *(L2)* Open the Grafana *Payments API Latency* panel and find which span is slow in the trace view: DB, bank call, or the service itself.
3. *(L2)* Check DB connection pool metrics `hikari_connections_pending` and `hikari_connections_active`.
4. *(L2)* Check pod CPU throttling and replica count: `kubectl top pods -n payments`, `kubectl get hpa -n payments`.
5. *(L2)* For bank-specific timeouts, check the bank connector's health panel and ABP's `#abp-bank-ops` channel for bank downtime notices.

**Resolution**

- Tell merchants to **check the payment status** (`GET /v2/payments/{id}`) before retrying, to avoid duplicate charges (KB-PAY-005).
- DB-related: follow KB-DB-001 / KB-DB-002.
- Bank-related: ABP can enable smart routing to an alternate acquirer for the affected method.
- Capacity: SRE can scale replicas (`kubectl scale`), but only with L2 + approval.

**Escalation**

- **PPE** for service-side latency; **ABP** for bank-side latency; **DBRE** if the DB span dominates; **SRE** for throttling.
- Attach: latency graphs, slowest spans from traces, affected acquirers or methods, start time.

**Related entries:** KB-PAY-008, KB-DB-001, KB-CARD-002, KB-INF-004

---

### KB-PAY-003 — HTTP 401 Unauthorized / authentication failed on API calls

| Field | Value |
|---|---|
| Category | Payment API and Gateway |
| Component | API gateway authentication |
| Default priority | P3 (P2 if many merchants are affected at once) |
| Owning team | L2 Application Support (L2-APP) |
| Keywords | 401, unauthorized, invalid API key, authentication failed, `AUTH_FAILED`, invalid credentials, key id |

**Symptoms**

- Every API call from one merchant fails with `401 Unauthorized` / `AUTH_FAILED`.
- This often starts just after the merchant went live, switched environment, or rotated keys.

**Likely causes**

1. The merchant is using **test (sandbox) keys against the production URL**, or the other way round.
2. The API key was rotated or revoked (KB-IAM-003).
3. The Basic-auth header is wrongly encoded (key and secret not base64-encoded as `key_id:key_secret`).
4. The merchant account is suspended by Risk (KB-MER-001).

**Diagnostic checks**

1. *(L1)* Ask for the key ID prefix only, **never the secret**. `nw_test_` keys only work on `sandbox-api`; `nw_live_` keys only on `api`.
2. *(L1)* In the Merchant Admin console, check the key's status (Active / Revoked) and its creation date.
3. *(L2)* Search gateway logs for the MID: `service:api-gateway AND mid:<MID> AND status:401`. Read the `auth_failure_reason` field (`KEY_NOT_FOUND`, `KEY_REVOKED`, `BAD_SIGNATURE`, `ACCOUNT_SUSPENDED`).

**Resolution**

- Environment mismatch: tell the merchant to use the key pair that matches the base URL.
- Revoked key: the merchant generates a new key in the dashboard and updates their integration.
- Encoding problem: share the authentication section of the API docs with a code sample.
- Account suspended: route to MOR. Do not reveal risk reasons to the merchant.

**Escalation**

- **IAM** if a valid, active key is rejected. **PPE** if 401s spike across many merchants (possible gateway fault). **MOR** for suspended accounts.

**Related entries:** KB-IAM-003, KB-PAY-007, KB-MER-001

---

### KB-PAY-004 — HTTP 429 Too Many Requests / rate limit exceeded

| Field | Value |
|---|---|
| Category | Payment API and Gateway |
| Component | API gateway rate limiter |
| Default priority | P3 |
| Owning team | L2 Application Support (L2-APP) |
| Keywords | 429, too many requests, rate limit, throttled, `RATE_LIMIT_EXCEEDED`, quota |

**Symptoms**

- Merchant gets `429 Too Many Requests` with header `Retry-After`.
- Usually seen during flash sales, or when a merchant polls the payment status API in a tight loop.

**Likely causes**

1. The merchant polls `GET /v2/payments/{id}` too often instead of using webhooks.
2. A genuine traffic spike (sale event) beyond the merchant's configured limit (default 100 requests/second).
3. A retry storm in the merchant's code after timeouts.

**Diagnostic checks**

1. *(L1)* Confirm the endpoint and the time window from the merchant.
2. *(L2)* Kibana: `service:api-gateway AND mid:<MID> AND status:429`. Group by `path` to see which endpoint is being hammered.
3. *(L2)* Check the merchant's configured rate-limit tier in Merchant Admin.

**Resolution**

- Polling: advise webhooks (KB-PAY-006), or polling with exponential backoff (2 s, 4 s, 8 s… up to 60 s).
- Planned sale event: the merchant raises a temporary limit increase at least 48 hours ahead. L2 + approval can apply it.
- Retry storm: the merchant must honour `Retry-After` and add jitter to retries.

**Escalation**

- **PPE** if 429s occur well below the configured limit (possible limiter misconfiguration).

**Related entries:** KB-PAY-006, KB-PAY-002

---

### KB-PAY-005 — Customer charged twice / duplicate payment

| Field | Value |
|---|---|
| Category | Payment API and Gateway |
| Component | Payment orchestration, idempotency layer |
| Default priority | P2 (P1 if duplicates are seen across many merchants) |
| Owning team | Payments Platform Engineering (PPE) |
| Keywords | double charge, duplicate payment, charged twice, double debit, idempotency, `Idempotency-Key` |

**Symptoms**

- A customer complains of two debits for one order.
- The merchant dashboard shows two `CAPTURED` payments for the same `order_id`.

**Likely causes**

1. The merchant retried after a timeout **without** an `Idempotency-Key` header.
2. The customer clicked "Pay" twice, or retried with a different method, and both attempts succeeded.
3. A bank-side duplicate (the issuer debited twice for one authorisation). Rare.

**Diagnostic checks**

1. *(L1)* Get the `order_id` and both payment IDs. Confirm both show `CAPTURED` (not one `CAPTURED` and one `FAILED`).
2. *(L2)* Check the request logs for both payments: same `Idempotency-Key`? Same source IP? Time gap between them?
3. *(L2)* If only one payment exists on our side but the customer sees two debits, it is a bank-side issue (see Resolution).

**Resolution**

- Duplicate captures on our side: refund the later payment (KB-RFD-001). Advise the merchant to send `Idempotency-Key` on every create-payment call.
- Customer-initiated double payment: the merchant decides whether to refund. Share the payment IDs.
- Bank-side duplicate: raise an issuer query through ABP. Tell the customer the extra debit is usually reversed by the bank within 5–7 working days.

**Escalation**

- **PPE immediately (P1)** if duplicates share an `Idempotency-Key`, because that means the idempotency layer failed.
- **ABP** for bank-side duplicates. Attach: payment IDs, RRN/UTR, timestamps, masked card / VPA.

**Related entries:** KB-RFD-001, KB-PAY-002, KB-PAY-008

---

### KB-PAY-006 — Merchant not receiving webhooks

| Field | Value |
|---|---|
| Category | Payment API and Gateway |
| Component | Webhook dispatcher |
| Default priority | P3 (P2 if the dispatcher backlog affects many merchants) |
| Owning team | Payments Platform Engineering (PPE) |
| Keywords | webhook not received, callback missing, notification, `payment.captured`, webhook failure, webhook delay |

**Symptoms**

- The merchant's order stays "pending" on their side while our dashboard shows `CAPTURED`.
- The merchant says no `payment.captured` event was received.

**Likely causes**

1. The merchant's endpoint returns non-2xx or takes longer than 10 s (our timeout), so delivery is retried and eventually given up.
2. The webhook URL is wrong or not configured for the event type.
3. The merchant's firewall blocks our egress IP range.
4. Dispatcher backlog on our side (Kafka consumer lag, KB-INF-005).

**Diagnostic checks**

1. *(L1)* Merchant Dashboard → Settings → Webhooks: confirm the URL, the subscribed events and the *Active* toggle.
2. *(L1)* Open *Webhook Delivery Logs* for the payment ID. Check the HTTP status our dispatcher received and the attempt count (max 8 attempts over 24 h).
3. *(L2)* If there are no delivery attempts, check dispatcher lag on the Grafana panel *webhook-dispatcher consumer lag*.

**Resolution**

- Merchant endpoint errors or timeouts: share the delivery log with the merchant. They must respond with 2xx within 10 s and do their processing asynchronously.
- Wrong URL or events: the merchant corrects the configuration. Use *Resend* in the dashboard for missed events.
- Firewall: share the published egress IP list (Developer Docs → IP Whitelisting).
- Our backlog: escalate. The merchant should use the status API as a fallback.

**Escalation**

- **PPE** if no attempts were made, or if dispatcher lag is above 5 minutes.

**Related entries:** KB-PAY-007, KB-PAY-008, KB-INF-005

---

### KB-PAY-007 — Webhook signature verification failing at merchant

| Field | Value |
|---|---|
| Category | Payment API and Gateway |
| Component | Webhook signing (HMAC-SHA256) |
| Default priority | P3 |
| Owning team | L2 Application Support (L2-APP) |
| Keywords | signature mismatch, invalid signature, `X-NW-Signature`, HMAC, webhook secret, signature verification failed |

**Symptoms**

- The merchant receives webhooks but rejects them because the signature does not match.

**Likely causes**

1. The merchant computes the HMAC over a **re-serialised** JSON body instead of the raw request body.
2. The merchant uses the API key secret instead of the **webhook secret**.
3. The webhook secret was regenerated in the dashboard but not updated in the merchant's server.

**Diagnostic checks**

1. *(L1)* Confirm which secret the merchant uses. The webhook secret is separate from the API key secret.
2. *(L1)* Ask whether the secret was regenerated recently (dashboard audit log).
3. *(L2)* Use the *Webhook Test* tool in Merchant Admin to send a sample event. The merchant compares the signature using the raw body.

**Resolution**

- Compute `HMAC_SHA256(webhook_secret, raw_body)` and compare it with `X-NW-Signature` using a constant-time compare.
- Update the secret on the merchant server if it was regenerated.

**Escalation**

- **PPE** only if the Webhook Test tool's sample event also fails verification with the correct secret and raw body.

**Related entries:** KB-PAY-006, KB-PAY-003

---

### KB-PAY-008 — Payment stuck in PENDING / status mismatch between merchant and platform

| Field | Value |
|---|---|
| Category | Payment API and Gateway |
| Component | Payment state machine, status reconciliation job |
| Default priority | P3 (P2 if more than 1% of the day's payments are pending beyond 30 min) |
| Owning team | L2 Application Support (L2-APP) |
| Keywords | pending, stuck payment, status mismatch, `PENDING`, `AUTHORIZED`, money debited but order failed |

**Symptoms**

- A customer says money was debited but the merchant shows the order as failed or pending.
- The payment stays `PENDING` for more than 15 minutes.

**Likely causes**

1. The bank or NPCI response was lost or timed out. The final status arrives later through the status-enquiry job.
2. The payment is `AUTHORIZED` but not `CAPTURED` (the merchant uses manual capture and has not captured it).
3. A webhook was missed by the merchant (KB-PAY-006).

**Diagnostic checks**

1. *(L1)* Look up the payment ID in the dashboard and note its exact state and timeline.
2. *(L1)* If `AUTHORIZED`: check the merchant's capture setting. Uncaptured authorisations auto-void after 5 days.
3. *(L2)* Check whether the *status-enquiry* job has polled the bank for this payment (logs: `job:status-enquiry AND payment_id:<id>`).
4. *(L2)* For UPI, see KB-UPI-002.

**Resolution**

- Wait for the status-enquiry job (it runs every 5 minutes for 48 hours). Most pending payments resolve automatically to `CAPTURED` or `FAILED`.
- If the final state is `FAILED` and the customer was debited, the bank auto-reverses within T+5 working days. Share the RRN/UTR with the customer.
- Manual capture: the merchant captures the payment through the API or dashboard.

**Escalation**

- **ABP** if still pending after 48 hours. **PPE** if the status-enquiry job is not running.

**Related entries:** KB-UPI-002, KB-PAY-006, KB-OBS-001

---

## Section B — UPI Payments (KB-UPI)

### KB-UPI-001 — UPI collect request not received by customer

| Field | Value |
|---|---|
| Category | UPI Payments |
| Component | UPI collect flow, PSP connector |
| Default priority | P3 (P2 if widespread) |
| Owning team | L2 Application Support (L2-APP) |
| Keywords | UPI collect, collect request not received, payment request not showing in app, UPI notification |

**Symptoms**

- Checkout says "Approve the request in your UPI app", but no request appears in the customer's app.
- The payment later expires with `COLLECT_EXPIRED`.

**Likely causes**

1. The VPA was entered wrongly but still exists, so the request went to someone else's handle, or the VPA is invalid (KB-UPI-006).
2. The customer's UPI app has notifications disabled. The request is visible under "Pending requests".
3. The customer's PSP or bank is having issues (KB-UPI-005).
4. The collect request was flagged and blocked by the customer's app as a suspected spam/fraud collect.

**Diagnostic checks**

1. *(L1)* Confirm the exact VPA the customer entered (shown in the payment details).
2. *(L1)* Ask the customer to open their UPI app → Pending requests.
3. *(L2)* Check the PSP response in logs: `service:upi-connector AND payment_id:<id>`. Look for `collect_status`.
4. *(L2)* Check the success rate for the customer's PSP handle (e.g. `@okbank`) on the Grafana *UPI by PSP* panel.

**Resolution**

- Ask the customer to retry with the correct VPA, or to use the **UPI Intent / QR** flow, which is more reliable than collect.
- PSP-wide issue: follow KB-UPI-005.

**Escalation**

- **ABP** if one PSP shows a collect delivery failure rate above 20%.

**Related entries:** KB-UPI-004, KB-UPI-005, KB-UPI-006

---

### KB-UPI-002 — UPI transaction pending or status unknown (deemed / timeout)

| Field | Value |
|---|---|
| Category | UPI Payments |
| Component | UPI connector, status-enquiry job |
| Default priority | P3 |
| Owning team | L2 Application Support (L2-APP) |
| Keywords | UPI pending, deemed, UPI timeout, money debited UPI, UTR, UPI status unknown |

**Symptoms**

- The customer's bank app shows "debited" but the payment is `PENDING` on our side.
- The response from NPCI was a timeout / deemed-approved status.

**Likely causes**

1. A timeout between the acquiring bank and NPCI. The final status comes through the status-check API.
2. A delay at the remitter bank.

**Diagnostic checks**

1. *(L1)* Collect the UTR (12-digit UPI reference) from the customer's bank app.
2. *(L2)* Check status-enquiry attempts for the payment ID in the logs.
3. *(L2)* Use the *UPI Status Check* tool in Merchant Admin (it calls the bank's status API) with the UTR.

**Resolution**

- If the status check returns `SUCCESS`, the platform updates the payment and sends a webhook. Confirm with the merchant.
- If `FAILED`, the remitter bank reverses the debit, normally within T+1 to T+5 working days. Share the UTR with the customer for follow-up with their bank.
- Never advise the customer to pay again until the original status is final.

**Escalation**

- **ABP** if the status is still unknown after 48 hours. Attach: payment ID, UTR, amount, timestamp, PSP handle.

**Related entries:** KB-PAY-008, KB-UPI-005

---

### KB-UPI-003 — Dynamic UPI QR not generating on checkout or terminal

| Field | Value |
|---|---|
| Category | UPI Payments |
| Component | QR service (`qr-service`), POS terminal QR module |
| Default priority | P3 (P2 if failing for all merchants) |
| Owning team | Payments Platform Engineering (PPE) |
| Keywords | QR not generating, dynamic QR, UPI QR error, `QR_GENERATION_FAILED`, blank QR |

**Symptoms**

- The terminal or checkout shows "Unable to generate QR" or a blank QR.
- The error `QR_GENERATION_FAILED` appears in API responses.

**Likely causes**

1. The merchant's UPI is not enabled, or the merchant VPA is not mapped to the MID (common for new merchants).
2. `qr-service` is degraded (pods crashing, KB-INF-003).
3. The terminal has no network, or is running an old app version (KB-TRM-001, KB-TRM-006).

**Diagnostic checks**

1. *(L1)* Merchant Admin → Payment Methods: confirm *UPI* is enabled and a merchant VPA is mapped.
2. *(L1)* Check whether static QR payments work for the same merchant.
3. *(L2)* `kubectl get pods -n payments -l app=qr-service`. Check restarts and error logs.

**Resolution**

- UPI not enabled / VPA missing: route to MOR for activation (KB-MER-002).
- Service degraded: escalate to PPE. Meanwhile the merchant can use the static QR.

**Escalation**

- **PPE** for service failures; **MOR** for configuration.

**Related entries:** KB-MER-002, KB-TRM-001, KB-INF-003

---

### KB-UPI-004 — UPI intent flow not opening UPI apps on mobile

| Field | Value |
|---|---|
| Category | UPI Payments |
| Component | Hosted checkout (mobile web), merchant SDK |
| Default priority | P3 |
| Owning team | L2 Application Support (L2-APP) |
| Keywords | UPI intent, app not opening, `upi://pay`, intent not working, no UPI apps found, iOS UPI |

**Symptoms**

- Tapping a UPI app at checkout does nothing, or shows "No apps found".
- Usually reported on iOS, or inside in-app browsers / web views.

**Likely causes**

1. The merchant's app opens checkout in a **WebView that blocks `upi://` deep links**.
2. iOS needs app-specific URL schemes, and the merchant's app has not declared `LSApplicationQueriesSchemes`.
3. The merchant is using an old SDK version.

**Diagnostic checks**

1. *(L1)* Ask for device OS, browser or app, and SDK version.
2. *(L1)* Test the same checkout link in the regular Chrome / Safari browser. If it works there, the problem is the merchant's WebView.

**Resolution**

- WebView: the merchant must handle `upi://` and app-scheme URLs and pass them to the OS (see the SDK docs section "Handling UPI Intents in WebViews").
- iOS: add the required schemes to `Info.plist`.
- Old SDK: upgrade to the latest SDK.
- Workaround: offer the UPI QR or collect flow.

**Escalation**

- **PPE** only if the flow fails in standard browsers on the latest SDK.

**Related entries:** KB-UPI-001

---

### KB-UPI-005 — Sudden spike in UPI failures for a specific bank or PSP

| Field | Value |
|---|---|
| Category | UPI Payments |
| Component | UPI connector, NPCI / remitter bank |
| Default priority | P2 (P1 if overall UPI success rate drops by more than 20 points) |
| Owning team | Acquiring & Bank Partnerships (ABP) |
| Keywords | UPI failure spike, bank down, PSP down, UPI success rate drop, remitter bank, NPCI downtime, `BANK_UNAVAILABLE` |

**Symptoms**

- The Grafana *UPI Success Rate* panel drops sharply. Failures are concentrated on one bank or PSP handle.
- Errors such as `BANK_UNAVAILABLE`, `REMITTER_TIMEOUT` or `NPCI_TIMEOUT` increase.

**Likely causes**

1. Remitter bank downtime, planned or unplanned.
2. NPCI switch degradation.
3. Our acquiring bank's UPI switch is having issues (then all PSPs are affected).

**Diagnostic checks**

1. *(L1)* Check `#abp-bank-ops` and the bank downtime calendar for planned maintenance.
2. *(L2)* Break failures down by remitter bank and by error code (Kibana *UPI Failures by Bank*).
3. *(L2)* If all banks are affected, check the acquirer connector health and network tunnels (KB-INF-008).

**Resolution**

- One remitter bank down: nothing to fix on our side. Post the status update. Merchants can ask customers to use another bank account or method.
- Acquirer switch issue: ABP fails over UPI traffic to the secondary acquirer (configured switch). This needs L2 + approval.

**Escalation**

- **ABP** immediately with failure counts by bank, error codes, start time and sample payment IDs.

**Related entries:** KB-UPI-001, KB-UPI-002, KB-INF-008

---

### KB-UPI-006 — "Invalid VPA" error during UPI payment

| Field | Value |
|---|---|
| Category | UPI Payments |
| Component | VPA validation API |
| Default priority | P4 (P3 if valid VPAs are rejected) |
| Owning team | L1 Support Desk (L1-DESK) |
| Keywords | invalid VPA, invalid UPI ID, VPA not found, `INVALID_VPA`, UPI ID error |

**Symptoms**

- The customer sees "Invalid UPI ID" when entering a VPA for a collect payment.

**Likely causes**

1. A typo in the VPA or handle (e.g. `name@okbnk`).
2. The VPA is deregistered or the linked account is closed.
3. The VPA validation service or PSP is temporarily unavailable, giving false negatives.

**Diagnostic checks**

1. *(L1)* Ask the customer to copy the VPA directly from their UPI app's profile screen.
2. *(L2)* Check the validation API error rate. A sudden spike across many users means a service issue, not user error.

**Resolution**

- User error: correct the VPA, or use UPI QR / intent.
- Service issue: escalate and advise the intent / QR flow meanwhile.

**Escalation**

- **PPE** if the validation API error rate is above 10% across many users.

**Related entries:** KB-UPI-001, KB-UPI-005

---

## Section C — Card Payments and Authentication (KB-CARD)

### KB-CARD-001 — 3D Secure / OTP page not loading or authentication failing

| Field | Value |
|---|---|
| Category | Card Payments and Authentication |
| Component | 3DS server, issuer ACS redirect |
| Default priority | P3 (P2 if many issuers are affected) |
| Owning team | L2 Application Support (L2-APP) |
| Keywords | 3DS, OTP page, OTP not received, authentication failed, ACS, `AUTHENTICATION_FAILED`, bank page not loading |

**Symptoms**

- The customer is stuck on a blank or loading bank OTP page, or sees "Authentication failed".
- The payment fails with `AUTHENTICATION_FAILED` or `3DS_TIMEOUT`.

**Likely causes**

1. The issuer's ACS (Access Control Server) is slow or down. Usually limited to one bank.
2. The customer did not receive the OTP (a telecom or issuer issue).
3. The merchant's checkout blocks redirects or iframes (Content Security Policy).
4. The customer entered the wrong OTP or the session expired (10 minutes).

**Diagnostic checks**

1. *(L1)* Identify the issuing bank (BIN lookup in Merchant Admin with the first 6 digits only).
2. *(L2)* Check the 3DS failure rate by issuer on Grafana *3DS by Issuer*.
3. *(L2)* For a single merchant, check whether 3DS works on hosted checkout. If it does, the merchant's custom page is blocking the redirect.

**Resolution**

- Issuer ACS issue: no platform fix. Advise the customer to retry later or use another card or method.
- Merchant CSP problem: the merchant must allow the ACS redirect domains (see Integration Guide → 3DS).

**Escalation**

- **ABP** if one issuer's 3DS failure rate is above 30% for 15+ minutes.

**Related entries:** KB-CARD-002, KB-IAM-002

---

### KB-CARD-002 — Spike in "Issuer unavailable" declines (ISO response 91 / 96)

| Field | Value |
|---|---|
| Category | Card Payments and Authentication |
| Component | Card switch, acquirer connectivity |
| Default priority | P2 (P1 if across multiple issuers) |
| Owning team | Acquiring & Bank Partnerships (ABP) |
| Keywords | response code 91, response code 96, issuer unavailable, system malfunction, issuer inoperative, card decline spike |

**Symptoms**

- A spike in card declines with ISO 8583 response code `91` (issuer or switch inoperative) or `96` (system malfunction).
- Failures cluster on one issuing bank, or on all cards routed through one acquirer.

**Likely causes**

1. The issuing bank's host is down.
2. The acquirer's link to the card network is degraded.
3. Network tunnel problems between Northwind and the acquirer (KB-INF-008).

**Diagnostic checks**

1. *(L2)* Group declines by issuer BIN range and by acquirer (Kibana *Card Declines by RC*).
2. *(L2)* One issuer across all acquirers points to the issuer. All issuers through one acquirer points to the acquirer or the link.
3. *(L2)* Check VPN / tunnel health to that acquirer on the network dashboard.

**Resolution**

- Issuer down: post a status update. No platform change.
- Acquirer or link problem: ABP enables routing to the secondary acquirer. NET-INFRA investigates the tunnel.

**Escalation**

- **ABP** immediately; **NET-INFRA** if tunnel metrics are unhealthy. Attach: RC distribution, affected BINs / acquirer, time window.

**Related entries:** KB-CARD-003, KB-INF-008, KB-PAY-002

---

### KB-CARD-003 — High rate of "Do Not Honour" (response code 05) declines

| Field | Value |
|---|---|
| Category | Card Payments and Authentication |
| Component | Card authorisation |
| Default priority | P3 |
| Owning team | L2 Application Support (L2-APP) |
| Keywords | response code 05, do not honour, do not honor, card declined, generic decline |

**Symptoms**

- A merchant reports many card declines with RC `05` (Do Not Honour).

**Likely causes**

1. Issuer-side risk rules. A generic decline is normal at a low rate (around 2–4% is typical).
2. Merchant category or international-card restrictions on the customer's card.
3. The merchant recently changed their MCC or descriptor, which can trigger issuer risk rules.

**Diagnostic checks**

1. *(L2)* Compare the merchant's RC 05 rate with its own 7-day baseline and with the platform average.
2. *(L2)* Check whether declines concentrate on one issuer, on international cards, or on high amounts.

**Resolution**

- Within baseline: explain to the merchant that RC 05 is an issuer decision. The customer should contact their bank or use another method.
- Above baseline and concentrated on one issuer: escalate to ABP for an issuer query.

**Escalation**

- **ABP** if the RC 05 rate is more than 2x the baseline for 24+ hours. **MOR** if the change followed an MCC change.

**Related entries:** KB-CARD-002

---

### KB-CARD-004 — Saved card / tokenised card payment failing

| Field | Value |
|---|---|
| Category | Card Payments and Authentication |
| Component | Card tokenisation service (network tokens) |
| Default priority | P3 |
| Owning team | Payments Platform Engineering (PPE) |
| Keywords | saved card, token, tokenisation, card on file, `TOKEN_INVALID`, `TOKEN_EXPIRED`, network token |

**Symptoms**

- Payments with saved cards fail with `TOKEN_INVALID` or `TOKEN_EXPIRED`, while entering the card manually works.

**Likely causes**

1. The token was deleted or suspended by the issuer (card reissued, lost or stolen).
2. The token's expiry date passed after a card renewal and was not updated yet.
3. The token service is degraded.

**Diagnostic checks**

1. *(L1)* Confirm that manual card entry works for the same customer.
2. *(L2)* Check the token status in the token vault console (Active / Suspended / Deleted).
3. *(L2)* Check the token-service error rate on Grafana.

**Resolution**

- Suspended or deleted token: the customer re-adds the card (a new token is created after 3DS).
- Service degraded: escalate. Customers can use manual card entry.

**Escalation**

- **PPE** if the token-service error rate is above 5%.

**Related entries:** KB-CARD-001

---

### KB-CARD-005 — Wrong card type detected / BIN lookup failing

| Field | Value |
|---|---|
| Category | Card Payments and Authentication |
| Component | BIN service |
| Default priority | P3 |
| Owning team | Payments Platform Engineering (PPE) |
| Keywords | BIN lookup, wrong card type, debit shown as credit, card network not detected, EMI not shown due to card type |

**Symptoms**

- Checkout identifies a debit card as credit (or the reverse), or shows the wrong card network.
- EMI options don't appear for an eligible card (see KB-EMI-001).

**Likely causes**

1. The card's BIN range is new and missing from the BIN table (a stale table).
2. The weekly BIN file import job failed (KB-OBS-001).

**Diagnostic checks**

1. *(L2)* Look up the first 6–8 digits in the BIN service admin. Check the issuer, type and network returned.
2. *(L2)* Check the last successful run of `job:bin-table-import`.

**Resolution**

- Missing BIN: PPE adds a manual BIN override (L2 + approval) and makes sure the next import succeeds.
- Failed import: re-run the job (KB-OBS-001).

**Escalation**

- **PPE** with the BIN (first 6–8 digits only), expected vs. detected attributes, and the import job status.

**Related entries:** KB-EMI-001, KB-OBS-001

---

## Section D — POS Terminals (KB-TRM)

### KB-TRM-001 — POS terminal offline / "Host not reachable"

| Field | Value |
|---|---|
| Category | POS Terminals |
| Component | Android POS terminal, terminal gateway (`term-gw`) |
| Default priority | P3 (P2 if more than 100 terminals in one city or on one telecom operator) |
| Owning team | L2 Application Support (L2-APP) |
| Keywords | terminal offline, host not reachable, no connection, POS not connecting, `HOST_UNREACHABLE`, SIM, Wi-Fi, terminal network error |

**Symptoms**

- The terminal shows "Host not reachable" or "No network" and cannot take payments.
- The Terminal Management System (TMS) shows the terminal's last heartbeat as more than 15 minutes ago.

**Likely causes**

1. Local connectivity: weak SIM signal, a SIM out of data, or merchant Wi-Fi down.
2. A telecom operator outage in that area (many terminals affected on the same operator).
3. The terminal's date/time is wrong, so the TLS handshake fails (KB-TRM-008).
4. The terminal gateway `term-gw` is degraded (all terminals affected).

**Diagnostic checks**

1. *(L1)* In TMS, check the last heartbeat, network type (SIM / Wi-Fi), signal strength and operator.
2. *(L1)* Ask the merchant to restart the terminal and toggle between SIM and Wi-Fi in Settings → Network.
3. *(L1)* Ask the merchant to check the date and time shown on the terminal.
4. *(L2)* TMS *Offline Terminals Map*: check whether offline terminals cluster by city or operator.
5. *(L2)* Check `term-gw` health and connection count on Grafana.

**Resolution**

- Local issue: switch the network, restart, or ask the merchant to recharge or replace the SIM (Northwind-provided SIMs: raise an FSO request).
- Wrong time: follow KB-TRM-008.
- Operator outage: post an advisory to affected merchants and suggest Wi-Fi as a fallback.
- `term-gw` issue: escalate as P1/P2.

**Escalation**

- **FSO** if the terminal still cannot connect after restart and a network switch (possible hardware fault).
- **SRE / TERM-ENG** if `term-gw` is unhealthy. Attach: TID, MID, last heartbeat, network type, operator.

**Related entries:** KB-TRM-008, KB-TRM-006, KB-INF-007

---

### KB-TRM-002 — "Card read error" / chip card not reading

| Field | Value |
|---|---|
| Category | POS Terminals |
| Component | Terminal card reader (EMV chip / magstripe) |
| Default priority | P3 |
| Owning team | L1 Support Desk (L1-DESK) |
| Keywords | card read error, chip not reading, insert card error, `CARD_READ_ERROR`, fallback, swipe, EMV error |

**Symptoms**

- The terminal shows "Card read error, please retry" when a chip card is inserted.
- It happens repeatedly with many cards (a terminal fault) or with only one card (a card fault).

**Likely causes**

1. A damaged or dirty chip on the customer's card (only one card affected).
2. A dirty or worn chip reader slot (many cards affected).
3. The terminal's EMV kernel configuration is outdated after an OTA update (many cards and terminals affected).

**Diagnostic checks**

1. *(L1)* Ask whether other cards work on the same terminal.
2. *(L1)* Ask the merchant to clean the reader slot with the cleaning card from the terminal kit.
3. *(L2)* In TMS, check the terminal's EMV config version against the current version (shown on the TMS dashboard).

**Resolution**

- Single card: the customer uses another card, tap, or UPI QR. The card may need replacing by the issuer.
- Dirty reader: clean the slot. If it still fails, raise an FSO replacement.
- Outdated EMV config: push the config from TMS (*Push Configuration*, L2).

**Escalation**

- **FSO** for hardware faults. **TERM-ENG** if many terminals on the same app version show read errors.

**Related entries:** KB-TRM-003, KB-TRM-006

---

### KB-TRM-003 — Contactless (tap to pay) not working on terminal

| Field | Value |
|---|---|
| Category | POS Terminals |
| Component | NFC reader, contactless configuration |
| Default priority | P3 |
| Owning team | L1 Support Desk (L1-DESK) |
| Keywords | contactless, tap not working, NFC, tap to pay, `CTLS_NOT_SUPPORTED`, "please insert card" |

**Symptoms**

- Tapping the card does nothing, or the terminal asks to insert the card instead.

**Likely causes**

1. The amount is above the contactless limit (₹5,000 without PIN). The terminal correctly asks for insert / PIN. This is expected behaviour.
2. Contactless is disabled for the MID / TID in the terminal profile.
3. An NFC hardware fault.
4. The card is not contactless-enabled, or contactless is disabled by the issuer.

**Diagnostic checks**

1. *(L1)* Check the transaction amount against the contactless limit.
2. *(L1)* Ask the merchant to try a known contactless card (or a phone wallet).
3. *(L2)* TMS → Terminal Profile: confirm `contactless_enabled = true`.

**Resolution**

- Above limit: explain the limit and use insert + PIN.
- Disabled in profile: enable it and push the profile from TMS (L2).
- Hardware fault: raise an FSO replacement.

**Escalation**

- **FSO** for NFC hardware faults. **TERM-ENG** if the profile is correct but many terminals fail.

**Related entries:** KB-TRM-002

---

### KB-TRM-004 — Terminal shows "Key Injection Required" / missing encryption keys

| Field | Value |
|---|---|
| Category | POS Terminals |
| Component | Terminal security module, key management |
| Default priority | P2 (the terminal cannot process card payments) |
| Owning team | Terminal Engineering (TERM-ENG) |
| Keywords | key injection, keys missing, tamper, `KEY_ERROR`, `TAMPERED`, PIN pad error, DUKPT, security error |

**Symptoms**

- The terminal shows "Key Injection Required", "Security Error" or "Tamper Detected" and refuses card transactions.

**Likely causes**

1. A **tamper event**: the device was opened, dropped hard or exposed to moisture. Keys are erased automatically.
2. The battery fully drained for a long period, so the secure memory was lost.
3. A failed remote key loading after an OTA update.

**Diagnostic checks**

1. *(L1)* Ask the merchant exactly what the screen says. Do **not** ask them to open or repair the device.
2. *(L2)* TMS → Security Events: check for a tamper flag and the remote key-loading status.

**Resolution**

- Tamper detected: the terminal **must be replaced**. Raise an FSO swap, mark the device "Tampered — quarantine" in TMS, and do not reactivate it.
- No tamper flag and remote key loading failed: TERM-ENG can retry remote key loading (L2 + approval).
- Meanwhile the merchant can accept UPI QR payments.

**Escalation**

- **TERM-ENG** for all cases. **INFOSEC** if tamper events appear on several terminals of the same merchant (possible skimming attempt).

**Related entries:** KB-TRM-006

---

### KB-TRM-005 — Terminal batch settlement / batch upload failing

| Field | Value |
|---|---|
| Category | POS Terminals |
| Component | Terminal batch close, settlement upload |
| Default priority | P2 (money movement affected) |
| Owning team | L2 Application Support (L2-APP) |
| Keywords | batch upload failed, settlement failed on terminal, batch close error, `BATCH_UPLOAD_FAILED`, end of day settlement terminal |

**Symptoms**

- The terminal shows "Settlement failed" or "Batch upload failed" during end-of-day close.
- The merchant's settlement for that day is missing transactions.

**Likely causes**

1. Connectivity dropped during the batch upload (KB-TRM-001).
2. A batch total mismatch between the terminal and the host (count or amount).
3. Auto-settlement was disabled and the batch is too old (more than 3 days).

**Diagnostic checks**

1. *(L1)* Ask the merchant to retry *Settlement* from the terminal menu with a stable network.
2. *(L2)* In TMS, compare the terminal batch totals with the host totals for that batch number.
3. *(L2)* Check the auto-settlement configuration and the open batch age.

**Resolution**

- Connectivity: retry when online.
- Total mismatch: L2 runs *Force Batch Reconcile* from TMS (L2 + approval). The host totals are used as the source of truth.
- Old batch: enable auto-settlement and process the pending batch manually (L2).

**Escalation**

- **TERM-ENG** if a mismatch persists after the force reconcile. **SETTLE-OPS** if settlement is already delayed (KB-STL-001).

**Related entries:** KB-STL-001, KB-TRM-001

---

### KB-TRM-006 — Terminal app crashing or freezing after an OTA update

| Field | Value |
|---|---|
| Category | POS Terminals |
| Component | Terminal payment app, OTA update pipeline |
| Default priority | P2 if many terminals on the new version are affected, otherwise P3 |
| Owning team | Terminal Engineering (TERM-ENG) |
| Keywords | app crash, terminal freeze, OTA update, app not opening, boot loop, terminal hang, app version |

**Symptoms**

- The payment app closes unexpectedly, freezes on the splash screen, or the terminal restarts repeatedly after an overnight update.

**Likely causes**

1. A defect in the new app version.
2. The update was only partly installed because power or network was lost during the update.
3. Low device storage.

**Diagnostic checks**

1. *(L1)* Note the app version from Settings → About, or from TMS.
2. *(L2)* TMS: compare the crash count by app version (*Crash Analytics* panel). Is it concentrated on the latest version?
3. *(L2)* Check the device storage and the update status (`INSTALLED`, `PARTIAL`, `FAILED`).

**Resolution**

- Partial update: re-push the update from TMS with the terminal on charge and on a stable network.
- Low storage: clear the cache through the TMS *Remote Maintenance* action.
- Version defect: TERM-ENG pauses the rollout and pushes the previous stable version to affected terminals.

**Escalation**

- **TERM-ENG** immediately if more than 1% of updated terminals report crashes. Attach: app version, affected TIDs, crash logs from TMS.

**Related entries:** KB-REL-001, KB-TRM-002

---

### KB-TRM-007 — Terminal receipt printer not printing

| Field | Value |
|---|---|
| Category | POS Terminals |
| Component | Thermal printer |
| Default priority | P4 (P3 if the merchant legally needs printed receipts) |
| Owning team | L1 Support Desk (L1-DESK) |
| Keywords | printer not working, receipt not printing, paper out, printer error, blank receipt |

**Symptoms**

- The transaction succeeds but no receipt prints, or the receipt comes out blank.

**Likely causes**

1. Paper roll empty or loaded the wrong way round (thermal paper prints on one side only).
2. Printer head overheated or dirty.
3. Printer hardware fault.

**Diagnostic checks**

1. *(L1)* Check that the paper roll is present and loaded with the shiny side facing the print head.
2. *(L1)* Run *Print Test Page* from the terminal settings.

**Resolution**

- Reload the paper correctly. Blank receipts almost always mean the roll is reversed.
- Let the terminal cool down for 10 minutes if it is overheated.
- Offer e-receipts via SMS / email (Settings → Receipt Mode) as a workaround.

**Escalation**

- **FSO** if the test page fails with correctly loaded paper.

**Related entries:** KB-TRM-006

---

### KB-TRM-008 — Terminal TLS / SSL handshake failure due to wrong date and time

| Field | Value |
|---|---|
| Category | POS Terminals |
| Component | Terminal clock, TLS connection to `term-gw` |
| Default priority | P3 |
| Owning team | L1 Support Desk (L1-DESK) |
| Keywords | SSL error, TLS handshake failed, certificate error on terminal, wrong date, clock, time sync, `SSL_HANDSHAKE_FAILED` |

**Symptoms**

- The terminal shows "SSL handshake failed" or "Certificate error" and cannot connect.
- The terminal shows a wrong date (often 01-01-2000 or 01-01-1970) after the battery drained.

**Likely causes**

1. The device clock reset after a long power-off. TLS certificates then look "not yet valid".
2. Automatic time sync is disabled.

**Diagnostic checks**

1. *(L1)* Ask the merchant to read out the date and time shown on the terminal.
2. *(L2)* Check `term-gw` logs for TLS errors from this TID with the reason `certificate not yet valid`.

**Resolution**

- Turn on automatic date and time (Settings → Date & Time → Network time), or set it manually, then restart.
- Charge the terminal fully to keep the clock battery healthy.

**Escalation**

- **FSO** if the clock keeps resetting (internal battery fault). **NET-INFRA** if many terminals with correct time fail TLS (possible server certificate issue, KB-INF-001).

**Related entries:** KB-TRM-001, KB-INF-001

---

## Section E — EMI and Affordability (KB-EMI)

### KB-EMI-001 — EMI options not shown at checkout or on terminal

| Field | Value |
|---|---|
| Category | EMI and Affordability |
| Component | EMI offer engine, BIN service |
| Default priority | P3 (P2 for a large merchant during a sale event) |
| Owning team | L2 Application Support (L2-APP) |
| Keywords | EMI not showing, no EMI option, EMI missing, instalment option not visible, card EMI, `EMI_NOT_ELIGIBLE` |

**Symptoms**

- The customer's credit card is eligible for EMI, but no EMI plans appear at checkout or on the terminal.

**Likely causes**

1. The transaction amount is below the bank's minimum EMI amount (commonly ₹2,500–₹3,000).
2. EMI is not enabled for this MID / TID, or the bank is not enabled for this merchant.
3. The card is detected wrongly as debit or another bank (KB-CARD-005).
4. The offer engine cache is stale after an offer update.

**Diagnostic checks**

1. *(L1)* Check the amount against the bank's minimum EMI amount in the *EMI Bank Matrix* (Merchant Admin → EMI).
2. *(L1)* Confirm EMI is enabled in the MID / TID configuration and that the issuing bank is enabled.
3. *(L2)* Run the BIN lookup for the card (first 6–8 digits).
4. *(L2)* Call the offer engine debug endpoint `GET /internal/emi/plans?mid=<MID>&bin=<BIN>&amount=<amt>` and check the returned plans and the rejection reason.

**Resolution**

- Below the minimum: explain the limit to the merchant and customer.
- Not enabled: route to MOR for EMI enablement.
- BIN problem: follow KB-CARD-005.
- Stale cache: L2 triggers *Refresh Offer Cache* for the MID.

**Escalation**

- **PPE** if the debug endpoint returns no plans for an eligible configuration.

**Related entries:** KB-EMI-002, KB-CARD-005, KB-MER-002

---

### KB-EMI-002 — Debit card / cardless EMI eligibility check failing

| Field | Value |
|---|---|
| Category | EMI and Affordability |
| Component | Bank eligibility API connector |
| Default priority | P3 (P2 if the bank is failing for all merchants) |
| Owning team | Acquiring & Bank Partnerships (ABP) |
| Keywords | debit card EMI, cardless EMI, eligibility failed, pre-approved, `ELIGIBILITY_CHECK_FAILED`, not eligible |

**Symptoms**

- The customer is told "Not eligible for EMI" or "Unable to check eligibility" for debit or cardless EMI.

**Likely causes**

1. The customer is genuinely not pre-approved by the bank (most common; a bank decision).
2. The bank's eligibility API is timing out or down.
3. The customer's mobile number does not match the one registered with the bank.

**Diagnostic checks**

1. *(L1)* Confirm the customer's registered mobile number is being used.
2. *(L2)* Check the eligibility API response code in the logs: `service:emi-connector AND bank:<bank>`. `NOT_ELIGIBLE` is a bank decision; `TIMEOUT` / `5xx` is a connectivity problem.
3. *(L2)* Check the bank's eligibility API success rate on Grafana.

**Resolution**

- Bank decision: tell the customer to check eligibility with their bank. We cannot override it.
- API issue: escalate. Meanwhile offer credit-card EMI or another bank.

**Escalation**

- **ABP** if the bank's eligibility API error rate is above 10%.

**Related entries:** KB-EMI-001

---

### KB-EMI-003 — Brand EMI cashback / instant discount not applied

| Field | Value |
|---|---|
| Category | EMI and Affordability |
| Component | Brand offer engine, subvention configuration |
| Default priority | P3 |
| Owning team | L2 Application Support (L2-APP) |
| Keywords | cashback not received, instant discount not applied, brand EMI, no cost EMI, subvention, offer not applied |

**Symptoms**

- A customer bought a product under a brand EMI / no-cost EMI offer, but the discount or cashback was not applied.

**Likely causes**

1. The product's SKU or serial number was not captured or validated at the time of sale.
2. The offer had expired or reached its budget cap.
3. The merchant selected normal bank EMI instead of brand EMI on the terminal.

**Diagnostic checks**

1. *(L1)* Get the transaction ID and check the *EMI type* (Bank EMI / Brand EMI) on the charge slip or dashboard.
2. *(L2)* Check the offer ID applied, its validity window and the remaining budget in the offer console.
3. *(L2)* Check the SKU / serial validation result in the transaction details.

**Resolution**

- Wrong EMI type: cannot be changed after the sale. The merchant may cancel (void the same day) and redo the sale.
- Offer expired or budget exhausted: inform the merchant. No retroactive application.
- Serial validation failed: raise a manual claim with the brand through the offer console (L2), attaching the invoice.

**Escalation**

- **PPE** if a valid offer with budget was not applied even though the SKU validated.

**Related entries:** KB-EMI-001, KB-EMI-004

---

### KB-EMI-004 — Converting a completed sale to EMI fails

| Field | Value |
|---|---|
| Category | EMI and Affordability |
| Component | Post-sale EMI conversion API |
| Default priority | P3 |
| Owning team | L2 Application Support (L2-APP) |
| Keywords | EMI conversion failed, convert to EMI, post-transaction EMI, `CONVERSION_NOT_ALLOWED` |

**Symptoms**

- The merchant tries to convert a completed card sale to EMI and gets `CONVERSION_NOT_ALLOWED`.

**Likely causes**

1. The conversion window has passed (allowed only before the batch is settled, usually the same day).
2. The issuing bank does not support post-sale conversion.
3. The original transaction was a debit card or a contactless no-PIN sale, which is not eligible.

**Diagnostic checks**

1. *(L1)* Check the original transaction time and whether the batch is already settled.
2. *(L1)* Check the bank's support for post-sale conversion in the *EMI Bank Matrix*.

**Resolution**

- Outside the window or bank unsupported: the customer can request EMI conversion directly from their card issuer (most banks offer this in their app).

**Escalation**

- **PPE** only if conversion fails inside the window for a supported bank.

**Related entries:** KB-EMI-001, KB-EMI-003

---

## Section F — Settlement and Reconciliation (KB-STL)

### KB-STL-001 — Merchant settlement delayed / not received

| Field | Value |
|---|---|
| Category | Settlement and Reconciliation |
| Component | Settlement engine, payout service |
| Default priority | P2 (P1 if the daily settlement run failed for all merchants) |
| Owning team | Settlement & Reconciliation Ops (SETTLE-OPS) |
| Keywords | settlement not received, settlement delayed, payout pending, T+1, money not credited, `SETTLEMENT_ON_HOLD` |

**Symptoms**

- The merchant has not received funds on the expected date (T+1 working day by default).

**Likely causes**

1. A bank holiday or weekend. Settlement moves to the next working day.
2. The settlement is **on hold** by Risk (KYC pending, chargeback reserve, unusual activity).
3. The payout failed because of invalid bank account details (KB-STL-005).
4. The daily settlement run failed or was delayed (KB-OBS-001).

**Diagnostic checks**

1. *(L1)* Merchant Dashboard → Settlements: check the settlement status (`PROCESSED`, `ON_HOLD`, `FAILED`, `SCHEDULED`) and the UTR if processed.
2. *(L1)* Check the bank holiday calendar.
3. *(L2)* If `PROCESSED` with a UTR: the money has left Northwind. The merchant should check with their bank using the UTR.
4. *(L2)* If `ON_HOLD`: check the hold reason code (visible to L2 only).
5. *(L2)* Check the daily settlement run status in the job scheduler.

**Resolution**

- Holiday: inform the merchant of the revised date.
- Processed: share the UTR. Bank credit can take up to 24 hours.
- On hold: route to MOR / Risk. Do not share internal risk reasons. Tell the merchant the account is under review and Risk will contact them.
- Run failure: escalate to SETTLE-OPS immediately.

**Escalation**

- **SETTLE-OPS** for run failures or `FAILED` payouts. **MOR** for holds.

**Related entries:** KB-STL-005, KB-TRM-005, KB-OBS-001

---

### KB-STL-002 — Settlement amount lower than expected / amount mismatch

| Field | Value |
|---|---|
| Category | Settlement and Reconciliation |
| Component | Settlement engine, fee computation |
| Default priority | P3 |
| Owning team | Settlement & Reconciliation Ops (SETTLE-OPS) |
| Keywords | settlement mismatch, less amount settled, MDR deducted, deduction, short settlement, fee mismatch |

**Symptoms**

- The merchant says the amount credited is less than their total sales for the day.

**Likely causes**

1. Normal deductions: MDR (merchant discount rate), GST on fees, refunds, chargebacks and reserve adjustments.
2. Some transactions belong to a different settlement cycle (cut-off time 23:00).
3. A wrong MDR configuration for the merchant (rare).

**Diagnostic checks**

1. *(L1)* Download the *Settlement Report* for that UTR. It itemises every transaction, fee, refund and adjustment.
2. *(L1)* Check whether any transactions were after the cut-off time.
3. *(L2)* Compare the applied MDR % with the merchant's agreement in Merchant Admin → Pricing.

**Resolution**

- Normal deductions: walk the merchant through the report.
- Cut-off: the transactions appear in the next settlement.
- Wrong MDR: escalate to SETTLE-OPS for correction and a refund of the difference in the next cycle.

**Escalation**

- **SETTLE-OPS** if the configured MDR doesn't match the agreement, or if the report totals don't add up.

**Related entries:** KB-STL-001, KB-STL-004

---

### KB-STL-003 — Acquirer reconciliation file missing or not processed

| Field | Value |
|---|---|
| Category | Settlement and Reconciliation |
| Component | Recon file ingestion (SFTP), recon engine |
| Default priority | P2 (it blocks settlement) |
| Owning team | Settlement & Reconciliation Ops (SETTLE-OPS) |
| Keywords | recon file missing, reconciliation file, SFTP, MIS file not received, recon failed, unreconciled transactions |

**Symptoms**

- An alert: `RECON_FILE_NOT_RECEIVED` for an acquirer by the 06:00 deadline.
- The recon dashboard shows a high count of unreconciled transactions.

**Likely causes**

1. The acquirer has not uploaded the file yet (a delay on their side).
2. SFTP connectivity or credential failure (password expired, key rotated, IP not whitelisted).
3. The file format changed (new columns), so the parser fails.

**Diagnostic checks**

1. *(L2)* Check the SFTP inbound folder for the expected file name pattern and date.
2. *(L2)* Check the ingestion job logs for connection errors (`Auth fail`, `Connection timed out`) or parse errors.
3. *(L2)* Confirm with the acquirer contact (through ABP) whether the file was sent.

**Resolution**

- Not sent: ABP follows up with the acquirer for the file.
- SFTP problem: NET-INFRA / ABP fix credentials or whitelisting, then re-run ingestion.
- Format change: SETTLE-OPS / DATA update the parser mapping, then re-run.

**Escalation**

- **SETTLE-OPS** at once (it can delay settlement); **NET-INFRA** for connectivity problems.

**Related entries:** KB-STL-001, KB-OBS-001, KB-INF-008

---

### KB-STL-004 — Chargeback / dispute raised against a merchant

| Field | Value |
|---|---|
| Category | Settlement and Reconciliation |
| Component | Dispute management |
| Default priority | P3 |
| Owning team | Settlement & Reconciliation Ops (SETTLE-OPS) |
| Keywords | chargeback, dispute, customer dispute, retrieval request, chargeback debit, representment |

**Symptoms**

- The merchant receives a chargeback notification, or sees a chargeback deduction in their settlement.

**Likely causes**

1. The customer disputed the transaction with their bank (not received, fraud, duplicate, wrong amount).

**Diagnostic checks**

1. *(L1)* Get the chargeback ID from the dashboard, the reason code and the response deadline.
2. *(L1)* Confirm the merchant has seen the evidence list for that reason code.

**Resolution**

- The merchant uploads evidence (invoice, delivery proof, signed charge slip) in Dashboard → Disputes **before the deadline** (usually 7 days).
- If the merchant accepts the chargeback, the amount is debited from the next settlement.
- L1 / L2 must not judge the dispute. Only SETTLE-OPS can.

**Escalation**

- **SETTLE-OPS** for any query on the dispute outcome or the deadline.

**Related entries:** KB-STL-002, KB-PAY-005

---

### KB-STL-005 — Merchant payout failed / bank account invalid

| Field | Value |
|---|---|
| Category | Settlement and Reconciliation |
| Component | Payout service |
| Default priority | P3 |
| Owning team | Settlement & Reconciliation Ops (SETTLE-OPS) |
| Keywords | payout failed, invalid account, IFSC invalid, account closed, beneficiary name mismatch, `PAYOUT_FAILED` |

**Symptoms**

- Settlement status `FAILED` with reasons such as `INVALID_ACCOUNT`, `ACCOUNT_CLOSED` or `IFSC_INVALID`.

**Likely causes**

1. The merchant changed or closed their bank account without updating Northwind.
2. The IFSC changed after a bank merger.

**Diagnostic checks**

1. *(L1)* Check the failure reason in Dashboard → Settlements.
2. *(L1)* Confirm the bank details on file (last 4 digits of the account plus the IFSC).

**Resolution**

- The merchant submits a bank account change request with a cancelled cheque or bank letter (Dashboard → Profile → Bank Details). MOR verifies it through a penny-drop.
- After verification, SETTLE-OPS reprocesses the failed payouts.

**Escalation**

- **MOR** for verification; **SETTLE-OPS** for reprocessing.

**Related entries:** KB-STL-001, KB-MER-001

---

## Section G — Refunds (KB-RFD)

### KB-RFD-001 — Refund stuck in "Processing" / customer has not received refund

| Field | Value |
|---|---|
| Category | Refunds |
| Component | Refund service, bank connectors |
| Default priority | P3 (P2 if refunds are stuck for many merchants) |
| Owning team | L2 Application Support (L2-APP) |
| Keywords | refund pending, refund not received, refund processing, refund stuck, ARN, `REFUND_PENDING` |

**Symptoms**

- The refund shows `PROCESSING` for more than 48 hours, or the customer says the money has not arrived.

**Likely causes**

1. Normal bank timelines: cards take 5–7 working days; UPI 1–3 working days after `PROCESSED`.
2. The refund batch to the acquirer failed (KB-OBS-001).
3. The refund is waiting for the original payment to settle (KB-RFD-003).

**Diagnostic checks**

1. *(L1)* Check the refund status and its ARN (Acquirer Reference Number, for cards) or UTR (for UPI).
2. *(L1)* If `PROCESSED` with an ARN / UTR: the refund has left Northwind. Share the reference with the customer.
3. *(L2)* If still `PROCESSING`: check the refund batch job logs for the batch containing this refund.

**Resolution**

- Processed: the customer contacts their bank with the ARN / UTR after the standard timeline.
- Batch failure: L2 requeues the refund (L2 + approval) once the batch issue is resolved.

**Escalation**

- **PPE** if the refund batch job failed; **ABP** if the acquirer rejected the batch.

**Related entries:** KB-RFD-003, KB-OBS-001, KB-PAY-005

---

### KB-RFD-002 — Refund rejected: amount exceeds refundable balance

| Field | Value |
|---|---|
| Category | Refunds |
| Component | Refund service validation |
| Default priority | P4 |
| Owning team | L1 Support Desk (L1-DESK) |
| Keywords | refund amount exceeds, `REFUND_AMOUNT_EXCEEDED`, partial refund, refund failed, over refund |

**Symptoms**

- The refund API or dashboard returns `REFUND_AMOUNT_EXCEEDED`.

**Likely causes**

1. Earlier partial refunds already used up part of the captured amount.
2. The merchant entered the amount in rupees while the API expects **paise** (or the reverse).

**Diagnostic checks**

1. *(L1)* Check the payment's captured amount and the list of previous refunds.
2. *(L1)* Check the units: the API takes amounts in paise (₹100 = `10000`).

**Resolution**

- Refund only the remaining balance. Correct the amount units.

**Escalation**

- Not normally needed. **PPE** if the refundable balance shown is wrong.

**Related entries:** KB-RFD-001

---

### KB-RFD-003 — Refund failing because the original payment is not settled

| Field | Value |
|---|---|
| Category | Refunds |
| Component | Refund service |
| Default priority | P4 |
| Owning team | L1 Support Desk (L1-DESK) |
| Keywords | refund before settlement, `PAYMENT_NOT_SETTLED`, void, cancel transaction, same day refund |

**Symptoms**

- The refund returns `PAYMENT_NOT_SETTLED` for a payment made earlier the same day.

**Likely causes**

1. For terminal card sales, the transaction is still in an open batch. It should be **voided**, not refunded.

**Diagnostic checks**

1. *(L1)* Check whether the transaction's batch is still open (TMS or dashboard).

**Resolution**

- Open batch: use **Void** on the terminal or dashboard. A void is instant and the customer's hold is released by the issuer.
- After the batch closes, a normal refund is allowed.

**Escalation**

- **L2-APP** if the void also fails.

**Related entries:** KB-RFD-001, KB-TRM-005

---

### KB-RFD-004 — Bulk refund file upload failing

| Field | Value |
|---|---|
| Category | Refunds |
| Component | Dashboard bulk upload |
| Default priority | P3 |
| Owning team | L2 Application Support (L2-APP) |
| Keywords | bulk refund, CSV upload failed, refund file error, `INVALID_FILE_FORMAT`, batch refund |

**Symptoms**

- Uploading a bulk refund CSV fails, or only some rows are processed.

**Likely causes**

1. The file does not match the template (column order, header names, extra blank rows).
2. The amount column contains commas or the ₹ symbol.
3. The file is larger than 5,000 rows (the maximum per file).

**Diagnostic checks**

1. *(L1)* Download the *error report* produced by the upload. It lists the failing rows and reasons.
2. *(L1)* Compare the file against the latest template from Dashboard → Refunds → Bulk.

**Resolution**

- Fix the rows using the error report, split files over 5,000 rows, and remove symbols from amounts. Re-upload only the failed rows to avoid duplicate refunds.

**Escalation**

- **PPE** if a file that matches the template exactly still fails.

**Related entries:** KB-RFD-002

---

## Section H — Databases (KB-DB)

### KB-DB-001 — Database connection pool exhausted

| Field | Value |
|---|---|
| Category | Databases |
| Component | Application connection pools (HikariCP), PostgreSQL primary |
| Default priority | P1 if on the payments path, otherwise P2 |
| Owning team | Database Reliability Engineering (DBRE) |
| Keywords | connection pool exhausted, `Connection is not available, request timed out after 30000ms`, HikariCP, too many connections, `FATAL: sorry, too many clients already`, DB connection failure |

**Symptoms**

- Application logs show `HikariPool-1 - Connection is not available, request timed out after 30000ms`.
- PostgreSQL logs show `FATAL: sorry, too many clients already`.
- API latency rises sharply and is followed by 500 / 504 errors (KB-PAY-001, KB-PAY-002).

**Likely causes**

1. Slow or long-running queries hold connections (KB-DB-002).
2. A connection leak in the application: connections are not returned after an exception, so active connections grow without limit.
3. A traffic spike or a scale-out of pods: each new pod opens its own pool, so total connections exceed the DB's `max_connections`.
4. Lock contention causes queries to wait (KB-DB-003).

**Diagnostic checks**

1. *(L2)* Grafana *DB Pool* panel: `hikari_connections_active`, `hikari_connections_pending`, and the pool max per service.
2. *(L2)* On the DB, count connections by application and state:
   `SELECT application_name, state, count(*) FROM pg_stat_activity GROUP BY 1,2 ORDER BY 3 DESC;`
3. *(L2)* Find long-running queries:
   `SELECT pid, now()-query_start AS duration, state, left(query,120) FROM pg_stat_activity WHERE state <> 'idle' ORDER BY duration DESC LIMIT 10;`
4. *(L2)* Check whether the pod count went up recently (`kubectl get hpa -n payments`).
5. *(L2)* Look for many connections in the `idle in transaction` state, which is a sign of a leak.

**Resolution**

- Long queries: follow KB-DB-002. DBRE may terminate a runaway query (`SELECT pg_terminate_backend(<pid>);`), with L2 + approval and DBRE present.
- Leak: restart the leaking service's pods in a rolling way as a stop-gap (`kubectl rollout restart deploy/<svc> -n <ns>`), then raise a defect with the owning team.
- Scale-out: SRE caps replicas or DBRE routes through the connection pooler (PgBouncer).

**Escalation**

- **DBRE** immediately for payments-path databases. Also inform **PPE** or the owning service team.
- Attach: pool metrics, the `pg_stat_activity` summary, top long-running queries, recent deploys or scaling events.

**Related entries:** KB-DB-002, KB-DB-003, KB-PAY-002, KB-INF-004

---

### KB-DB-002 — Slow queries / high database latency

| Field | Value |
|---|---|
| Category | Databases |
| Component | PostgreSQL / MySQL clusters |
| Default priority | P2 |
| Owning team | Database Reliability Engineering (DBRE) |
| Keywords | slow query, high DB latency, query timeout, `canceling statement due to statement timeout`, full table scan, missing index, DB CPU high |

**Symptoms**

- DB CPU above 80%, and query p95 latency far above baseline.
- Application logs show `canceling statement due to statement timeout`.

**Likely causes**

1. A new query, or a changed query plan, without a suitable index (often after a release).
2. A heavy reporting or ad-hoc query running on the primary instead of a replica.
3. Table bloat, or stale statistics after a large data change.

**Diagnostic checks**

1. *(L2)* Check the top queries by total time in `pg_stat_statements` (DBRE dashboard *Top Queries*).
2. *(L2)* Check whether the slowdown started after a deploy (KB-REL-001).
3. *(L2)* Check for ad-hoc sessions from reporting tools (`application_name` like `metabase` or `psql`).

**Resolution**

- Ad-hoc heavy query on the primary: ask the owner to stop it, and move reporting to a replica.
- Missing index or plan regression: DBRE adds an index or runs `ANALYZE` (a change request is needed). Consider rolling back the release.

**Escalation**

- **DBRE** with the query fingerprint, its latency trend, and the time it started.

**Related entries:** KB-DB-001, KB-DB-004, KB-REL-001

---

### KB-DB-003 — Database deadlocks / lock wait timeouts

| Field | Value |
|---|---|
| Category | Databases |
| Component | Transactional databases |
| Default priority | P2 |
| Owning team | Database Reliability Engineering (DBRE) |
| Keywords | deadlock detected, lock wait timeout, `ERROR: deadlock detected`, `Lock wait timeout exceeded`, blocked queries, row lock |

**Symptoms**

- Logs show `ERROR: deadlock detected` (PostgreSQL) or `Lock wait timeout exceeded; try restarting transaction` (MySQL).
- Specific operations (refunds, settlement updates) fail intermittently.

**Likely causes**

1. Two code paths update the same rows in different orders.
2. A long-running batch job (settlement, recon) holds row locks while online traffic tries to update the same rows.

**Diagnostic checks**

1. *(L2)* Find blocking sessions:
   `SELECT blocked.pid, blocking.pid AS blocking_pid, left(blocking.query,100) FROM pg_stat_activity blocked JOIN pg_stat_activity blocking ON blocking.pid = ANY(pg_blocking_pids(blocked.pid));`
2. *(L2)* Check whether a batch job (KB-OBS-001) was running at the same time.

**Resolution**

- Short term: DBRE terminates the blocking session if it belongs to a stuck batch job (approval needed). Then retry the failed operations.
- Long term: the owning team fixes the lock ordering or moves the batch outside peak hours.

**Escalation**

- **DBRE** and the owning service team, with deadlock log extracts and the job schedule.

**Related entries:** KB-DB-001, KB-OBS-001

---

### KB-DB-004 — Read replica lag causing stale data in dashboard or reports

| Field | Value |
|---|---|
| Category | Databases |
| Component | PostgreSQL read replicas |
| Default priority | P3 (P2 if lag exceeds 15 minutes) |
| Owning team | Database Reliability Engineering (DBRE) |
| Keywords | replication lag, replica lag, stale data, dashboard not updated, transactions not visible, read replica delay |

**Symptoms**

- Merchants see recent transactions missing from the dashboard, even though the API reports them as successful.
- Replica lag alert: `pg_replication_lag_seconds > 300`.

**Likely causes**

1. Heavy write load on the primary (bulk jobs, migrations).
2. Long-running queries on the replica conflict with replay.
3. Network or I/O saturation on the replica host.

**Diagnostic checks**

1. *(L2)* Grafana *Replication* panel: lag in seconds per replica.
2. *(L2)* On the replica: `SELECT now() - pg_last_xact_replay_timestamp() AS lag;`
3. *(L2)* Check for migrations or bulk jobs running on the primary.

**Resolution**

- Inform merchants that data will catch up. The API status is the source of truth.
- DBRE can temporarily route dashboard reads to a healthier replica, or pause the bulk job.

**Escalation**

- **DBRE** if lag is above 15 minutes or still growing. **DATA** if reports are affected.

**Related entries:** KB-MER-004, KB-DB-002

---

### KB-DB-005 — Database disk / storage almost full

| Field | Value |
|---|---|
| Category | Databases |
| Component | DB storage volumes |
| Default priority | P1 above 90% on a primary, P2 above 80% |
| Owning team | Database Reliability Engineering (DBRE) |
| Keywords | disk full, no space left on device, storage 90%, `could not extend file`, WAL growth, DB disk alert |

**Symptoms**

- Alert `db_disk_used_percent > 80`.
- At 100%, writes fail with `could not extend file ... No space left on device`.

**Likely causes**

1. WAL files are piling up because a replica or replication slot is lagging or inactive.
2. Large audit or log tables are growing without retention.
3. Old backups or dumps left on the data volume.

**Diagnostic checks**

1. *(L2)* Check the inactive replication slots:
   `SELECT slot_name, active, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) FROM pg_replication_slots;`
2. *(L2)* Find the largest tables (DBRE dashboard *Table Sizes*).

**Resolution**

- **Do not delete database files manually.** DBRE drops inactive slots, expands the volume, or archives old partitions.

**Escalation**

- **DBRE** immediately at 80% and above. Attach: usage trend, the growth rate, and the largest objects.

**Related entries:** KB-DB-004, KB-OBS-003

---

## Section I — Infrastructure and Network (KB-INF)

### KB-INF-001 — TLS / SSL certificate expired or expiring

| Field | Value |
|---|---|
| Category | Infrastructure and Network |
| Component | Public endpoints, internal mTLS, bank connections |
| Default priority | P1 if expired on a production endpoint; P3 if expiring in more than 7 days |
| Owning team | Network & Infrastructure (NET-INFRA) |
| Keywords | certificate expired, SSL expired, `CERT_HAS_EXPIRED`, `certificate has expired`, PKIX path, x509, handshake failure, cert expiry |

**Symptoms**

- Clients fail with `certificate has expired`, `x509: certificate has expired or is not yet valid` or `PKIX path validation failed`.
- A sudden total failure of one integration (e.g. one bank connector) at a specific time, often midnight UTC.

**Likely causes**

1. A server certificate on a public or internal endpoint was not renewed.
2. A client (mTLS) certificate used to connect to a bank expired.
3. The partner rotated their certificate or CA and our trust store doesn't have the new chain.

**Diagnostic checks**

1. *(L1)* Check the certificate expiry dashboard (*Cert Inventory*) for the affected domain.
2. *(L2)* Check the live certificate:
   `echo | openssl s_client -connect <host>:443 -servername <host> 2>/dev/null | openssl x509 -noout -dates -subject -issuer`
3. *(L2)* For bank connectors, check the connector logs for handshake errors and the client certificate's expiry.

**Resolution**

- Expired server or client certificate: NET-INFRA renews and deploys it (an emergency change is allowed for P1).
- The partner rotated their CA: import the new chain into the trust store and restart the connector (L2 + approval).

**Escalation**

- **NET-INFRA** immediately for P1. **ABP** to coordinate with the bank if it's the partner's certificate.

**Related entries:** KB-TRM-008, KB-INF-008, KB-CARD-002

---

### KB-INF-002 — DNS resolution failures

| Field | Value |
|---|---|
| Category | Infrastructure and Network |
| Component | Internal DNS (CoreDNS), external DNS |
| Default priority | P1 if widespread, P2 otherwise |
| Owning team | Network & Infrastructure (NET-INFRA) |
| Keywords | DNS failure, `UnknownHostException`, `NXDOMAIN`, `getaddrinfo ENOTFOUND`, name resolution failed, CoreDNS |

**Symptoms**

- Logs show `java.net.UnknownHostException`, `getaddrinfo ENOTFOUND` or `NXDOMAIN` for internal or partner hostnames.

**Likely causes**

1. CoreDNS pods are overloaded or crashing in the Kubernetes cluster.
2. A recent DNS record change, or a typo in a configured hostname.
3. The external DNS provider is having an incident.

**Diagnostic checks**

1. *(L2)* From an affected pod: `kubectl exec -it <pod> -n <ns> -- nslookup <hostname>`.
2. *(L2)* Check CoreDNS pod health: `kubectl get pods -n kube-system -l k8s-app=kube-dns`.
3. *(L2)* Check for recent DNS change requests.

**Resolution**

- CoreDNS unhealthy: SRE scales or restarts CoreDNS.
- Bad record or config: roll back the DNS change or the config.

**Escalation**

- **NET-INFRA** (and **SRE** for CoreDNS), with the failing hostnames, the source pods and the time it started.

**Related entries:** KB-INF-008, KB-REL-002

---

### KB-INF-003 — Pods OOMKilled / CrashLoopBackOff

| Field | Value |
|---|---|
| Category | Infrastructure and Network |
| Component | Kubernetes workloads |
| Default priority | P2 (P1 if on the payments path with no healthy replicas) |
| Owning team | Site Reliability Engineering (SRE) |
| Keywords | OOMKilled, CrashLoopBackOff, pod restarting, out of memory, `java.lang.OutOfMemoryError`, exit code 137, container restart |

**Symptoms**

- `kubectl get pods` shows `CrashLoopBackOff` or a high restart count. The last state is `OOMKilled` (exit code 137).
- Intermittent 502 / 503 errors as pods restart.

**Likely causes**

1. A memory leak in the application (memory grows steadily until the kill).
2. The memory limit is too low for the current load.
3. The app fails at startup because of bad config or a missing secret (exit code 1, not 137; see KB-REL-003).

**Diagnostic checks**

1. *(L2)* `kubectl describe pod <pod> -n <ns>`: check the `Last State`, `Reason` and `Exit Code`.
2. *(L2)* `kubectl logs <pod> -n <ns> --previous`: read the logs from the crashed container.
3. *(L2)* Grafana: memory usage against the limit for the deployment over 24 hours (a sawtooth pattern means a leak).

**Resolution**

- Startup failure: see KB-REL-003.
- OOM: SRE can raise the memory limit temporarily (L2 + approval). The owning team investigates the leak, using a heap dump if available.
- Recent deploy correlation: roll back (KB-REL-001).

**Escalation**

- **SRE** and the owning service team. Attach: pod describe output, previous logs, the memory graph.

**Related entries:** KB-INF-004, KB-REL-001, KB-REL-003

---

### KB-INF-004 — High CPU / service latency during peak traffic

| Field | Value |
|---|---|
| Category | Infrastructure and Network |
| Component | Kubernetes workloads, autoscaling |
| Default priority | P2 |
| Owning team | Site Reliability Engineering (SRE) |
| Keywords | high CPU, CPU throttling, latency spike, autoscaling, HPA, peak traffic, sale event, slow response |

**Symptoms**

- Pod CPU near its limit, CPU-throttling metrics rising, latency up.
- Usually during sale events, festivals, or end-of-month peaks.

**Likely causes**

1. HPA max replicas reached.
2. CPU limits too low, so pods are throttled.
3. Node capacity exhausted: new pods stuck `Pending`.

**Diagnostic checks**

1. *(L2)* `kubectl get hpa -n <ns>`: compare current and max replicas.
2. *(L2)* `kubectl get pods -n <ns> | grep Pending`, then `kubectl describe pod` to look for `Insufficient cpu`.
3. *(L2)* Grafana: the `container_cpu_cfs_throttled_seconds_total` rate.

**Resolution**

- SRE raises the HPA max or adds node capacity (L2 + approval).
- Check the DB pool impact before scaling out (KB-DB-001): more pods means more DB connections.

**Escalation**

- **SRE**, with HPA status, throttling graphs and the traffic trend.

**Related entries:** KB-DB-001, KB-PAY-002, KB-INF-003

---

### KB-INF-005 — Kafka consumer lag growing

| Field | Value |
|---|---|
| Category | Infrastructure and Network |
| Component | Kafka cluster and consumers (webhooks, notifications, ledger) |
| Default priority | P2 (P1 for the ledger consumer) |
| Owning team | Site Reliability Engineering (SRE) |
| Keywords | Kafka lag, consumer lag, events delayed, messages backlog, rebalance, partition lag |

**Symptoms**

- The consumer-group lag alert fires. Downstream effects: delayed webhooks (KB-PAY-006), delayed notifications, ledger delays.

**Likely causes**

1. Consumer pods crashed or are stuck (KB-INF-003).
2. A "poison" message causes repeated processing failure on one partition.
3. The consumer is slow because of a downstream dependency (DB, an external API).
4. Frequent consumer-group rebalances.

**Diagnostic checks**

1. *(L2)* Grafana *Kafka Lag*: lag per partition. Is it one partition or all of them?
2. *(L2)* Check the consumer pod status and logs for repeated errors on the same offset.
3. *(L2)* Check the logs for rebalance events.

**Resolution**

- Lag on one partition with repeated errors: the owning team moves the poison message to the dead-letter topic (L2 + approval).
- Consumers down: restore the pods (KB-INF-003).
- Slow downstream: fix the dependency first.

**Escalation**

- **SRE** and the consumer's owning team (PPE for webhooks).

**Related entries:** KB-PAY-006, KB-INF-003

---

### KB-INF-006 — Redis cache unavailable or high latency

| Field | Value |
|---|---|
| Category | Infrastructure and Network |
| Component | Redis cluster (sessions, idempotency keys, rate limiter) |
| Default priority | P1 (idempotency and rate limiting depend on it) |
| Owning team | Site Reliability Engineering (SRE) |
| Keywords | Redis down, Redis timeout, `RedisConnectionException`, cache unavailable, `READONLY You can't write against a read only replica`, Redis latency |

**Symptoms**

- Logs show `RedisConnectionException`, `Command timed out` or `READONLY You can't write against a read only replica`.
- Checkout sessions expire and rate-limiter errors appear.

**Likely causes**

1. A Redis primary failover in progress (brief `READONLY` errors).
2. Memory is full and the eviction policy is blocking writes.
3. A network partition between the app and Redis.

**Diagnostic checks**

1. *(L2)* Grafana *Redis*: memory usage, connected clients, ops/sec, latency.
2. *(L2)* `redis-cli -h <host> INFO replication` and `INFO memory`.
3. *(L2)* Check the logs for a failover event.

**Resolution**

- Failover: usually recovers on its own within 60 s. Restart clients that cached the old primary address.
- Memory full: SRE scales the cluster, or fixes keys without a TTL.

**Escalation**

- **SRE** immediately. Inform **PPE**, because idempotency protection may be degraded (KB-PAY-005).

**Related entries:** KB-PAY-005, KB-PAY-004

---

### KB-INF-007 — Load balancer returning 502 Bad Gateway / 503 Service Unavailable

| Field | Value |
|---|---|
| Category | Infrastructure and Network |
| Component | Ingress controller, cloud load balancer |
| Default priority | P1 if on the public API, otherwise P2 |
| Owning team | Site Reliability Engineering (SRE) |
| Keywords | 502 bad gateway, 503 service unavailable, no healthy upstream, ingress error, load balancer error, upstream connect error |

**Symptoms**

- Clients receive `502 Bad Gateway` / `503 Service Unavailable` or `no healthy upstream` from the edge.

**Likely causes**

1. No healthy backend pods (all failing readiness probes, or crashing).
2. A misconfigured ingress after a release (wrong service name or port).
3. Readiness probe too strict during a slow start, so pods are marked unready.

**Diagnostic checks**

1. *(L2)* `kubectl get endpoints <svc> -n <ns>`: are there any ready endpoints?
2. *(L2)* Check the ingress controller logs for upstream errors.
3. *(L2)* Check recent ingress or service changes (KB-REL-002).

**Resolution**

- No healthy pods: fix the pods first (KB-INF-003).
- Ingress misconfiguration: roll back the config change.

**Escalation**

- **SRE**, with endpoint status, ingress logs and recent changes.

**Related entries:** KB-INF-003, KB-REL-002, KB-PAY-001

---

### KB-INF-008 — Bank / partner endpoint unreachable (VPN tunnel, firewall, IP whitelisting)

| Field | Value |
|---|---|
| Category | Infrastructure and Network |
| Component | Site-to-site VPN tunnels, egress firewall, partner IP whitelists |
| Default priority | P1 if a primary acquirer is unreachable, P2 otherwise |
| Owning team | Network & Infrastructure (NET-INFRA) |
| Keywords | connection refused, connection timed out, tunnel down, VPN down, firewall, IP whitelist, partner unreachable, egress IP, bank connectivity |

**Symptoms**

- All calls to one bank or partner fail with `Connection timed out` or `Connection refused`.
- The VPN tunnel status shows `DOWN` on the network dashboard.

**Likely causes**

1. The site-to-site VPN tunnel to the bank is down (maintenance at the bank, or a phase-2 renegotiation failure).
2. Our egress IP changed (new NAT gateway) and is not whitelisted by the partner.
3. A firewall rule changed on either side.

**Diagnostic checks**

1. *(L2)* Network dashboard: tunnel status and the last state change for that bank.
2. *(L2)* From the connector pod: `nc -vz <bank_host> <port>` or `curl -v https://<bank_host>/health`.
3. *(L2)* Check for recent NAT or egress or firewall change requests.

**Resolution**

- Tunnel down: NET-INFRA re-establishes it. ABP contacts the bank's network team.
- Egress IP change: revert, or get the new IP whitelisted by the partner (this can take bank lead time).
- Meanwhile ABP routes traffic to the secondary acquirer if one is available.

**Escalation**

- **NET-INFRA** and **ABP** together. Attach: the tunnel graph, the connectivity test output, recent changes.

**Related entries:** KB-CARD-002, KB-UPI-005, KB-STL-003, KB-INF-001

---

## Section J — Identity and Access (KB-IAM)

### KB-IAM-001 — Merchant unable to log in to the dashboard

| Field | Value |
|---|---|
| Category | Identity and Access |
| Component | Merchant dashboard authentication, SSO |
| Default priority | P3 (P2 if logins fail for all merchants) |
| Owning team | Identity & Access Management (IAM) |
| Keywords | cannot login, login failed, dashboard login, account locked, password reset, SSO error, invalid credentials, `ACCOUNT_LOCKED` |

**Symptoms**

- The merchant sees "Invalid credentials", "Account locked" or a blank page after login.

**Likely causes**

1. The account is locked after 5 failed attempts (unlocks automatically after 30 minutes).
2. The password expired (90-day policy).
3. The user was deactivated by the merchant's own admin.
4. A browser cache or cookie issue after a dashboard release.

**Diagnostic checks**

1. *(L1)* Ask for the login email. Check the user status in Merchant Admin → Users (Active / Locked / Deactivated).
2. *(L1)* Ask the merchant to try an incognito window.
3. *(L2)* If many merchants are affected, check the auth service error rate.

**Resolution**

- Locked: wait 30 minutes, or use *Forgot password*. L1 can trigger a reset email but must **never** set or share passwords.
- Deactivated: the merchant's admin reactivates the user.
- Browser issue: clear cookies or use incognito.

**Escalation**

- **IAM** if the user is active and unlocked but still cannot log in, or if failures are widespread.

**Related entries:** KB-IAM-002

---

### KB-IAM-002 — OTP / 2FA code not received

| Field | Value |
|---|---|
| Category | Identity and Access |
| Component | OTP service, SMS / email gateway |
| Default priority | P3 (P2 if the SMS provider is failing broadly) |
| Owning team | Identity & Access Management (IAM) |
| Keywords | OTP not received, 2FA, verification code, SMS not delivered, OTP delay |

**Symptoms**

- The merchant does not receive the login OTP by SMS or email.

**Likely causes**

1. A wrong or old mobile number on file.
2. DND / operator filtering, or SMS provider delays.
3. Email OTP landing in spam.

**Diagnostic checks**

1. *(L1)* Confirm the last 4 digits of the registered mobile number.
2. *(L2)* Check the OTP delivery logs (provider status: `DELIVERED`, `FAILED`, `PENDING`).
3. *(L2)* Check the SMS provider's delivery-rate panel.

**Resolution**

- Wrong number: the update requires identity verification by MOR.
- Provider issue: IAM switches to the backup SMS provider. The merchant can use email OTP meanwhile.

**Escalation**

- **IAM** if the provider delivery rate is below 90%.

**Related entries:** KB-IAM-001, KB-CARD-001

---

### KB-IAM-003 — Integration broken after API key rotation

| Field | Value |
|---|---|
| Category | Identity and Access |
| Component | API key management |
| Default priority | P2 (the merchant cannot transact) |
| Owning team | L2 Application Support (L2-APP) |
| Keywords | API key rotation, key regenerated, new key not working, old key revoked, integration broke after rotation |

**Symptoms**

- All API calls fail with 401 right after the merchant regenerated the API keys.

**Likely causes**

1. The merchant regenerated the keys, which **immediately revokes** the old ones, but did not deploy the new keys everywhere (multiple servers, or a cached config).

**Diagnostic checks**

1. *(L1)* Check the key creation time in the dashboard against the time the failures started.
2. *(L2)* Gateway logs: the `auth_failure_reason = KEY_REVOKED` field confirms old keys are still in use.

**Resolution**

- The merchant updates the new key on all servers and restarts their apps.
- For future rotations, use *Rotate with overlap* (old key valid for 24 hours) instead of *Regenerate*.

**Escalation**

- **IAM** only if the new key is also rejected.

**Related entries:** KB-PAY-003

---

### KB-IAM-004 — Internal user gets "Permission denied" in support tools

| Field | Value |
|---|---|
| Category | Identity and Access |
| Component | Internal RBAC (Merchant Admin, TMS, Kibana) |
| Default priority | P4 |
| Owning team | Identity & Access Management (IAM) |
| Keywords | permission denied, access denied, 403 Forbidden, no access to Kibana, role, RBAC, access request |

**Symptoms**

- A support engineer gets `403 Forbidden` / "Permission denied" opening Merchant Admin, TMS or Kibana.

**Likely causes**

1. The role is not assigned, or the temporary access expired (L2 production access is granted for 30 days).
2. The user moved team and their role was removed.

**Diagnostic checks**

1. *(L1)* Check your active roles in the Access Portal.

**Resolution**

- Raise an access request in the Access Portal with your manager's approval. Do **not** share credentials or use another engineer's session.

**Escalation**

- **IAM** if access was approved but is still not working after 2 hours.

**Related entries:** KB-IAM-001

---

## Section K — Merchant Onboarding and Dashboard (KB-MER)

### KB-MER-001 — Merchant KYC stuck / account under review

| Field | Value |
|---|---|
| Category | Merchant Onboarding and Dashboard |
| Component | Onboarding workflow, KYC verification |
| Default priority | P3 |
| Owning team | Merchant Onboarding & Risk (MOR) |
| Keywords | KYC pending, KYC rejected, onboarding stuck, documents, account under review, activation pending, verification |

**Symptoms**

- The merchant's onboarding status shows "KYC under review" for more than 3 working days, or "KYC rejected".

**Likely causes**

1. Documents are unclear, expired, or the name doesn't match across documents (PAN, GST, bank proof).
2. A manual risk review is pending for higher-risk business categories.
3. Bank account penny-drop verification failed.

**Diagnostic checks**

1. *(L1)* Check the onboarding status and the rejection reason shown in Merchant Admin → Onboarding.

**Resolution**

- Rejected documents: the merchant re-uploads the correct documents through the dashboard.
- Under review: share the standard timeline (3–5 working days). L1 / L2 cannot speed up or approve KYC.

**Escalation**

- **MOR** if the review is older than 5 working days.

**Related entries:** KB-MER-002, KB-STL-005

---

### KB-MER-002 — New MID / TID or payment method not activated

| Field | Value |
|---|---|
| Category | Merchant Onboarding and Dashboard |
| Component | Merchant configuration, terminal provisioning |
| Default priority | P3 |
| Owning team | Merchant Onboarding & Risk (MOR) |
| Keywords | MID not active, TID not activated, terminal not mapped, payment method not enabled, `MERCHANT_NOT_ACTIVE`, `TERMINAL_NOT_MAPPED` |

**Symptoms**

- Transactions fail with `MERCHANT_NOT_ACTIVE` or `TERMINAL_NOT_MAPPED`, or a payment method (UPI, EMI, international cards) is missing.

**Likely causes**

1. Activation is pending after KYC approval (the configuration step is not complete).
2. The terminal's TID is not mapped to the MID in TMS.
3. The method needs a separate approval (e.g. international cards, EMI banks).

**Diagnostic checks**

1. *(L1)* Merchant Admin: check the MID status and the enabled payment methods.
2. *(L1)* TMS: check the TID → MID mapping.

**Resolution**

- TID mapping missing: L2 maps it in TMS (L2 + approval) and pushes the profile.
- Activation pending or method approval needed: route to MOR with the merchant's request.

**Escalation**

- **MOR** for activation; **TERM-ENG** if the mapping is correct but the terminal still reports `TERMINAL_NOT_MAPPED` after a profile push.

**Related entries:** KB-MER-001, KB-UPI-003, KB-EMI-001

---

### KB-MER-003 — Reports or statements not downloading

| Field | Value |
|---|---|
| Category | Merchant Onboarding and Dashboard |
| Component | Report generation service |
| Default priority | P3 |
| Owning team | Data Platform (DATA) |
| Keywords | report not downloading, statement download failed, report stuck, export failed, report generation, CSV download |

**Symptoms**

- The report stays "Generating" for a long time, or the download link gives an error.

**Likely causes**

1. The date range is too large (more than 90 days, or more than 1 million rows) and the report times out.
2. The report generation queue is backed up at month-end.
3. The download link expired (links are valid for 24 hours).

**Diagnostic checks**

1. *(L1)* Check the requested date range and the report type.
2. *(L2)* Check the report queue depth on the DATA dashboard.

**Resolution**

- Split the request into smaller date ranges (e.g. monthly).
- Expired link: generate the report again.
- Queue backlog: inform the merchant. Reports are emailed when ready.

**Escalation**

- **DATA** if a small report (under 7 days) fails or stays queued for more than 2 hours.

**Related entries:** KB-MER-004, KB-OBS-001

---

### KB-MER-004 — Dashboard showing missing or delayed transactions

| Field | Value |
|---|---|
| Category | Merchant Onboarding and Dashboard |
| Component | Dashboard data pipeline, read replicas |
| Default priority | P3 (P2 if more than 30 minutes of delay for all merchants) |
| Owning team | Data Platform (DATA) |
| Keywords | transactions missing dashboard, dashboard delay, data not updated, transaction not showing, analytics delay |

**Symptoms**

- Successful transactions (confirmed by the API or a webhook) don't appear in the dashboard.

**Likely causes**

1. Read replica lag (KB-DB-004).
2. Data pipeline (CDC / streaming) delay.
3. A dashboard filter (date or timezone, MID selection) hides the transactions.

**Diagnostic checks**

1. *(L1)* Confirm the filters: date range, timezone (IST), and the MID selected for multi-store merchants.
2. *(L2)* Check the replica lag and the pipeline freshness metric (*Dashboard Data Freshness* panel).

**Resolution**

- Filter issue: correct the filters.
- Lag: inform the merchant that the data will catch up. The API status is the source of truth.

**Escalation**

- **DATA** (and **DBRE** for replica lag) if the delay is more than 30 minutes.

**Related entries:** KB-DB-004, KB-MER-003

---

## Section L — Releases and Configuration (KB-REL)

### KB-REL-001 — Error spike right after a deployment

| Field | Value |
|---|---|
| Category | Releases and Configuration |
| Component | CI/CD (Argo CD), all services |
| Default priority | P1 if on the payments path, otherwise P2 |
| Owning team | Release Engineering (REL-ENG) |
| Keywords | after deployment, new release, error spike after deploy, rollback, regression, canary failure, bad deploy |

**Symptoms**

- Error rate or latency rises within minutes of a deployment of the affected service.

**Likely causes**

1. A code regression in the new version.
2. A database migration that is incompatible with the running code, or slow.
3. A config or secret change shipped with the release (KB-REL-002, KB-REL-003).

**Diagnostic checks**

1. *(L1)* Check `#release-eng` for deployments in the last 2 hours and match the times.
2. *(L2)* `kubectl rollout history deploy/<svc> -n <ns>` and Argo CD sync history.
3. *(L2)* Compare the error rates of pods on the new version vs. the old version (canary panel).

**Resolution**

- If the error spike matches a deploy and affects customers: **roll back first, investigate later.** REL-ENG performs the rollback (`argocd app rollback <app>` or `kubectl rollout undo deploy/<svc> -n <ns>`), with L2 + approval.
- If the release included a DB migration, check with the owning team before rolling back. Some migrations are not backward compatible.

**Escalation**

- **REL-ENG** and the owning service team. Attach: the deploy time, the version, the error graph, sample errors.

**Related entries:** KB-REL-002, KB-REL-003, KB-PAY-001, KB-TRM-006

---

### KB-REL-002 — Feature flag or configuration misconfiguration

| Field | Value |
|---|---|
| Category | Releases and Configuration |
| Component | Feature flag service, config maps |
| Default priority | P2 |
| Owning team | Release Engineering (REL-ENG) |
| Keywords | feature flag, config change, wrong configuration, flag enabled, configmap, toggle, misconfiguration |

**Symptoms**

- A behaviour changed suddenly without a code deploy (e.g. a payment method disappeared, or a new flow broke for some merchants).

**Likely causes**

1. A feature flag was toggled for the wrong merchant segment or for 100% of merchants.
2. A config map was edited with a wrong value (URL, timeout, limit).

**Diagnostic checks**

1. *(L2)* Check the feature-flag audit log for changes in the last 24 hours.
2. *(L2)* `kubectl get configmap <name> -n <ns> -o yaml` and compare it with git.

**Resolution**

- Revert the flag or config to its last known good value (L2 + approval), then restart pods if the config is only read at startup.

**Escalation**

- **REL-ENG** and the flag owner.

**Related entries:** KB-REL-001, KB-INF-007

---

### KB-REL-003 — Service failing to start: missing secret or environment variable

| Field | Value |
|---|---|
| Category | Releases and Configuration |
| Component | Kubernetes secrets, vault integration |
| Default priority | P2 (P1 on the payments path) |
| Owning team | Release Engineering (REL-ENG) |
| Keywords | missing secret, environment variable not set, `CreateContainerConfigError`, `secret not found`, vault, config error at startup, NullPointerException at startup |

**Symptoms**

- Pods stuck in `CreateContainerConfigError`, or crashing at startup with errors such as `Required environment variable DB_PASSWORD is not set`.

**Likely causes**

1. A new secret was referenced in the deployment but not created in this environment.
2. The vault sync failed or the secret expired.

**Diagnostic checks**

1. *(L2)* `kubectl describe pod <pod> -n <ns>`: the events show `secret "<name>" not found`.
2. *(L2)* `kubectl get secret <name> -n <ns>` (check that it exists; **never print secret values** in tickets).

**Resolution**

- REL-ENG creates or syncs the secret from vault, then restarts the deployment. Alternatively, roll back the deployment.

**Escalation**

- **REL-ENG**. **INFOSEC** if secret values were exposed in logs or tickets.

**Related entries:** KB-INF-003, KB-REL-001, KB-PAY-001

---

## Section M — Observability and Batch Jobs (KB-OBS)

### KB-OBS-001 — Scheduled batch job failed (settlement, refunds, recon, BIN import)

| Field | Value |
|---|---|
| Category | Observability and Batch Jobs |
| Component | Job scheduler (Airflow) |
| Default priority | P1 for the settlement run; P2 for refunds / recon; P3 for others |
| Owning team | L2 Application Support (L2-APP) |
| Keywords | job failed, batch failed, cron failed, Airflow DAG failed, scheduled job, settlement run failed, job did not run |

**Symptoms**

- An Airflow alert: a DAG run failed, or did not start by its SLA time.
- Downstream symptoms appear: settlements delayed, refunds stuck, stale BIN data.

**Likely causes**

1. A dependency was unavailable during the run (DB, SFTP, bank API).
2. Bad input data (malformed file, unexpected nulls).
3. The scheduler itself is unhealthy (no workers available).

**Diagnostic checks**

1. *(L2)* Airflow UI: find the failed task and read its logs.
2. *(L2)* Classify the error: connectivity (retryable), data (needs a fix), or code (needs the owner).
3. *(L2)* Check whether a partial run left a half-processed state (job-specific runbook).

**Resolution**

- Connectivity error: clear and re-run the failed task once the dependency is healthy. Most jobs are idempotent; confirm in the job runbook first.
- Data error: route to the owning team to fix the input, then re-run.
- **Settlement run:** never re-run without SETTLE-OPS approval (risk of double payouts).

**Escalation**

- **SETTLE-OPS** (settlement / recon), **PPE** (refunds, BIN import), **SRE** (scheduler health).

**Related entries:** KB-STL-001, KB-STL-003, KB-RFD-001, KB-CARD-005

---

### KB-OBS-002 — Alert storm / flapping alerts

| Field | Value |
|---|---|
| Category | Observability and Batch Jobs |
| Component | Alertmanager, PagerDuty |
| Default priority | P3 (assess the underlying alerts separately) |
| Owning team | Site Reliability Engineering (SRE) |
| Keywords | alert storm, too many alerts, flapping alert, alert noise, PagerDuty flood, duplicate alerts |

**Symptoms**

- Dozens of alerts fire at once, or the same alert fires and resolves repeatedly.

**Likely causes**

1. One root cause (e.g. a DB outage) triggers alerts in every dependent service.
2. The alert threshold is too close to normal behaviour (flapping).

**Diagnostic checks**

1. *(L2)* Sort the alerts by start time. The earliest alert is often closest to the root cause.
2. *(L2)* Group them by shared dependency (DB, Redis, network).

**Resolution**

- Focus on the earliest or common-dependency alert and follow its KB entry. Silence the duplicates with a time-limited silence (max 2 hours), linked to the incident.
- For flapping alerts: SRE tunes the threshold or the `for` duration after the incident.

**Escalation**

- **SRE** for alert tuning; the root-cause team for the underlying issue.

**Related entries:** KB-DB-001, KB-INF-006

---

### KB-OBS-003 — Logs missing or delayed in Kibana

| Field | Value |
|---|---|
| Category | Observability and Batch Jobs |
| Component | Logging pipeline (Fluent Bit → Kafka → Elasticsearch) |
| Default priority | P3 (P2 during an active incident) |
| Owning team | Site Reliability Engineering (SRE) |
| Keywords | logs missing, Kibana no data, log delay, Elasticsearch, Fluent Bit, cannot find logs |

**Symptoms**

- Kibana shows no logs for a service or time range, or the logs arrive minutes late.

**Likely causes**

1. A query problem: wrong index pattern, wrong time range or timezone.
2. A Fluent Bit agent is down on some nodes.
3. Elasticsearch disk watermark reached, so indices are read-only.

**Diagnostic checks**

1. *(L1)* Check the index pattern, the time range and the timezone in Kibana.
2. *(L2)* `kubectl get pods -n logging -l app=fluent-bit`: check for unhealthy agents.
3. *(L2)* Check the Elasticsearch cluster health (green / yellow / red) and disk usage.

**Resolution**

- Query problem: correct the search.
- Agents down or ES issue: SRE restores them. Meanwhile, read live logs with `kubectl logs <pod> -n <ns> --since=1h`.

**Escalation**

- **SRE**, with the affected services, nodes and time range.

**Related entries:** KB-DB-005, KB-OBS-002

---

## Appendix A — Glossary

| Term | Meaning |
|---|---|
| **ACS** | Access Control Server: the issuer system that runs 3DS / OTP authentication |
| **ARN** | Acquirer Reference Number: a unique reference for card refunds, used to trace them with the issuer |
| **BIN** | Bank Identification Number: the first 6–8 digits of a card, identifying the issuer and card type |
| **HPA** | Horizontal Pod Autoscaler (Kubernetes) |
| **MDR** | Merchant Discount Rate: the fee deducted from merchant settlements |
| **MID / TID** | Merchant ID / Terminal ID |
| **NPCI** | National Payments Corporation of India, which operates UPI |
| **PSP** | Payment Service Provider (in UPI: the app or bank providing the VPA handle) |
| **RC** | Response Code (ISO 8583 card authorisation response) |
| **RRN** | Retrieval Reference Number: a card transaction reference |
| **TMS** | Terminal Management System |
| **UTR** | Unique Transaction Reference: a bank / UPI transfer reference |
| **VPA** | Virtual Payment Address (UPI ID), e.g. `name@bank` |

## Appendix B — Common Diagnostic Commands

| Purpose | Command |
|---|---|
| Pod status | `kubectl get pods -n <ns> -o wide` |
| Pod details / events | `kubectl describe pod <pod> -n <ns>` |
| Logs of a crashed container | `kubectl logs <pod> -n <ns> --previous` |
| Rollout history | `kubectl rollout history deploy/<svc> -n <ns>` |
| Autoscaler state | `kubectl get hpa -n <ns>` |
| DB connections by state | `SELECT application_name, state, count(*) FROM pg_stat_activity GROUP BY 1,2;` |
| Certificate dates | `openssl s_client -connect <host>:443 -servername <host> </dev/null 2>/dev/null \| openssl x509 -noout -dates` |
| DNS lookup from pod | `kubectl exec -it <pod> -n <ns> -- nslookup <host>` |
| Port reachability | `nc -vz <host> <port>` |

*End of document — NWP-TSO-KB-001 v3.2*

