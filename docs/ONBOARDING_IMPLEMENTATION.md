# Account access and wedding setup

Status: implemented and tested locally; live Atlas onboarding verified on
2026-11-12. Live Resend delivery verification remains pending.

## Scope

Homepage → signup/login → wedding setup → private dashboard. Includes password
recovery, persistence, and authorization. Events, tasks, guest management, family
invitations, and public gallery functionality are future milestones.

## Decisions for this milestone

These clarify the earlier conceptual designs where they disagree or leave policy
open. Earlier dated implementation notes do not describe the current checkout.

- Passwords: bcrypt with cost 12, minimum 12 characters, maximum 72 UTF-8 bytes
  (reject longer values to prevent bcrypt truncation). No arbitrary composition
  rules. Email normalization is trimming and lowercasing only.
- Sessions: 32 random bytes; only HMAC-SHA-256 hashes persisted, with a server-only
  secret of at least 32 characters. This resolves the database document's earlier
  generic SHA-256 wording in favor of the later HMAC convention.
- Session lifetime: fixed 30 days, checked on every read independently of TTL
  cleanup. Cookies are HttpOnly, SameSite=Lax, Path=/, Secure in production.
- Reset tokens: 32 random bytes, HMAC hashed, single-use, expire after 30 minutes.
  Password reset invalidates all existing sessions and reset tokens transactionally.
  Recovery uses Resend. No reset URLs or credentials are logged or returned.
- No email verification in V1, as already approved. Recovery requests always give
  the same success response for known and unknown accounts when the provider is
  available. Delivery failures preserve that generic response and emit a sanitized
  operational warning. Configuration failures return a generic availability error.
- Mutation APIs require a matching Origin and JSON content type. APP_URL is the
  trusted origin; host and forwarded-host headers cannot override it.
- Rate limits use atomic MongoDB fixed-window counters (TTL cleanup), shared
  across instances for each identity. Login: 10/email/minute; signup:
  5/email/hour; recovery: 3/email/hour; reset: 10/token/hour. Identifiers are HMAC
  hashed. Application-wide hard quotas were removed on 2026-11-18 because a
  caller could exhaust them and deny account access to unrelated users. Rejected
  attempts affect only their own identity's counter. Limits do not trust client
  IP headers; broader per-source traffic controls belong at a trusted deployment
  edge rather than an application-wide account-access lockout.
- Wedding creation and its Admin membership are one transaction. Unique user
  membership prevents duplicate weddings under concurrent submissions. Transaction
  support (Atlas or a replica set) is required. Private data is resolved through
  the authenticated membership, never a client-provided wedding ID.
- Manual location entry for onboarding; Google Places is a later integration.
  Wedding date remains a date-only string; timezone is validated as an IANA zone.
- Generate an unpublished website slug and a hashed gallery token at creation to
  match the creation contract; gallery stays disabled. Stable gallery sharing
  policy must be settled when that feature is implemented.
- Invitation expiry, final-Admin changes, and cron HTTP methods are deferred because
  this milestone provides no invitations, role editing, or cron worker.

## Delivery checks

Lint, TypeScript, formatting, production build, database integration tests with an
isolated replica set, and browser tests for account access, onboarding, persistence,
logout, recovery, authorization, and responsive layouts. Live Atlas and Resend
verification needs local credentials and a verified sender.

## Browser test server isolation

The runner selects an available loopback port and passes the same origin to the
app and Playwright. It waits for the spawned Next.js child’s own listening-ready
output before sending a health request, rejects startup failure or timeout, and
stops browser tests if that child exits. A healthy response from another service
cannot independently mark the test server ready. Regression tests cover an occupied
port, a healthy unrelated listener without child readiness, successful startup,
and exit after readiness. Only the temporary test replica set is used.
