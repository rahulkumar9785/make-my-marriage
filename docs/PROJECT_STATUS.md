# Project Status

Last updated: 2026-11-13

## Current state

The public homepage, account access, wedding setup, and private dashboard are
implemented. Signup, login, logout, password recovery, and saved wedding details
are validated with isolated database and browser tests. The live Atlas signup,
wedding setup, persistence, logout, and login flow was verified on 2026-11-12.
Live Resend delivery remains unverified. Events, tasks, guests, and budget
management remain planned.

## Milestone history

### 1. Application scaffold — Complete

- Established the Next.js App Router application with React and TypeScript, root
  layout, global styles, and development tooling.
- Added the application liveness endpoint at `GET /api/health`.
- Added product requirements, system design, database design, and API design
  documents in `docs/`, plus setup and deployment guidance in the README.
- Reference commit: `664875e`.
- Validation: the scaffold is included in the successful lint, typecheck,
  formatting, and production build checks recorded below.
- Limitations: the health endpoint checks liveness only. Database access,
  authentication, and external integrations remain planned.

### 2. Public homepage and interactive previews — Complete

- Built the wedding planning homepage with a sample dashboard, family workspace
  descriptions, capabilities, invitation preview, FAQs, and footer navigation.
- Added tabbed sample previews for budgets, event timelines, guests, and family
  tasks, plus a planning preview dialog and responsive navigation.
- Added keyboard navigation for preview tabs, a skip link, focus styles, and
  reduced motion support.
- Reference commit: `10518f5`, pushed to `origin/Dev`.
- Validation on 2026-11-11: `npm run lint`, `npm run typecheck`,
  `npm run format:check`, `npm run build`, and `git diff --check` passed.
- Limitations: sample data only; planning buttons open an informational dialog.
  Account creation, saved plans, and wedding management are still in development.
  Browser interaction and mobile layout were not verified in the recorded review.

### 3. Backend foundation, account access, and wedding setup — Implemented

- Implemented on 2026-11-12: MongoDB/Mongoose connection reuse, environment
  validation, Zod request validation, bounded JSON bodies, consistent API errors,
  and persistent atomic rate limits.
- Added signup, login, logout, current-account lookup, and password recovery using
  Resend, with secure session cookies, bcrypt passwords, hashed expiring tokens,
  single-use resets, and invalidation of existing sessions on password reset.
- Added account forms, protected onboarding, and a private dashboard displaying
  saved wedding details. Homepage planning links now lead to signup.
- Wedding creation and its Admin membership are transactional. Unique membership
  constraints prevent duplicate weddings, and private reads resolve wedding scope
  through authenticated membership.
- Clarified policies in [onboarding implementation decisions](ONBOARDING_IMPLEMENTATION.md)
  and documented local and deployment configuration in the README and `.env.example`.
- Validation: 16 integration tests and 6 browser tests passed, covering desktop
  and mobile signup, onboarding, persistence, login/logout, password reset,
  authorization, duplicate/concurrent operations, expiry, recovery delivery
  capture, rate limiting, and navigation widths from 320px to 1440px. Desktop/mobile screenshots were visually reviewed.
  Production cookie flags were checked in integration tests; browser tests use
  the development server. ESLint, TypeScript, formatting, production build, and
  `git diff --check` passed.
- Limitations: live Atlas and Resend delivery have not been exercised with the
  user's credentials. No real emails were sent by tests. Email verification is
  intentionally absent in V1. Planning modules show explicit future-feature
  placeholders. Local MongoDB must be a replica set to support transactions.

### 4. Development database setup — Verified

- Verified the configured Atlas database (`mm-db`) on 2026-11-12: connection,
  ping, and transaction support passed. Credentials remain in ignored `.env.local`.
- Started the development app at `http://localhost:3000` and verified the live
  browser flow: signup with automatic login, wedding creation with Admin
  membership, saved details after reload, logout, protected-page redirect, and
  returning login into the saved wedding.
- Removed the temporary test account, wedding, membership, and sessions after
  verification. No real emails were sent; Resend delivery is still unverified.

### Signup navigation clarity — 2026-11-12

- Replaced the homepage navigation’s “Begin Planning” label with “Sign up” and
  kept it visible next to “Log in” on mobile as well as desktop.
- The signup destination remains `/signup`; hero planning links also lead there.
- Browser checks passed at 320px, 390px, 800px, and 1440px: the link is visible,
  the header fits, and clicking “Sign up” opens the registration form.

### Chrome authentication checks — 2026-11-13

- Manually exercised the running app at `http://localhost:3000` in Google Chrome.
- Passed: existing-session login redirect, logout, protected dashboard/onboarding
  redirects after logout, signup password mismatch validation, successful signup
  and automatic login, wedding setup, session persistence after reload, rejection
  of incorrect passwords, returning login, authenticated signup redirect, and
  rejection of duplicate email registration.
- Verified the temporary signup in Atlas and removed its user, wedding,
  membership, and sessions. Left the test tab on the logged-out login page.
- Password recovery email delivery was not tested. The previously reviewed shared
  rate-limit quota and browser test-runner port ownership issues remain unresolved;
  passing these manual flows does not resolve those review findings.

## Known next steps

1. Verify password recovery delivery with the configured Resend sender. Atlas
   onboarding is verified. Keep credentials out of source control.
2. Build events and timeline, then family tasks, guest management, and budget.
3. Resolve family invitation, role-change/final-Admin, gallery sharing, and cron
   decisions before implementing those later features.

## Maintenance

Read this file at the start of each new project chat. For each major feature or
milestone, update the current state and append a dated progress entry describing
the delivered behavior, validation, limitations, and remaining work. Preserve
earlier entries. Planned work is not evidence of implementation.
