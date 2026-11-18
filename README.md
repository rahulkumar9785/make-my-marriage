# Make My Marriage

A wedding management web application for couples and their families.

## Current milestone

The public homepage, account access (signup, login, logout, and password recovery),
wedding setup, and private dashboard are implemented. Wedding details persist in
MongoDB; events, tasks, guests, and budget modules remain planned. See the
[project status](docs/PROJECT_STATUS.md) for progress and validation, and
[onboarding implementation decisions](docs/ONBOARDING_IMPLEMENTATION.md) for the
security policies and scope of this milestone.

## Local development

Use Node.js 24 LTS (see `.nvmrc`) and npm. If you use nvm, run `nvm use` first.
Install the locked dependencies with `npm ci`, then run `npm run dev` and open
<http://localhost:3000>.

The homepage and liveness endpoint run without external services. To use accounts
and wedding workspaces:

1. Copy `.env.example` to `.env.local`.
2. Set `MONGODB_URI` to a development Atlas connection string (or a local MongoDB
   replica set). Enable network access for your development machine and give the
   database user access only to the application database. Transactions are required.
3. Generate `AUTH_SECRET` using the command in `.env.example`.
4. Set `APP_URL` to the exact local origin you open, such as
   `http://localhost:3000`. Mutations from other origins are rejected.
5. Set `RESEND_API_KEY` and `EMAIL_FROM` using your verified Resend domain for
   password recovery. Signup and login do not require email delivery.
6. Restart the development server after changing environment variables.

Never commit secrets. Use separate databases, keys, and senders for development and
production. Indexes, including unique constraints and expiry indexes, are initialized
before database-backed requests are accepted. A missing configuration or unavailable
database produces a generic availability error; there is no fake persistence fallback.

## Commands

| Command                | Purpose                                           |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | Start the development server                      |
| `npm run build`        | Create a production build                         |
| `npm start`            | Serve the production build                        |
| `npm run lint`         | Run ESLint                                        |
| `npm run typecheck`    | Generate Next.js route types and check TypeScript |
| `npm run format:check` | Check formatting                                  |
| `npm run format`       | Format application and tooling files              |
| `npm test`             | Run validation and MongoDB integration tests      |
| `npm run test:e2e`     | Run desktop and mobile onboarding browser tests   |

Run lint, typecheck, format checking, and the production build before submitting a
change. The formatter excludes the design documents.

The integration suite uses Vitest with an isolated temporary MongoDB replica set;
it never uses your Atlas database. The browser suite also owns a temporary replica
set and runs a local server on an OS-selected available loopback port. It waits
for its own child server to report readiness before checking health, and aborts
if that child exits. It tests the actual forms and routes;
email delivery is captured in integration tests, and reset tokens are seeded only
in the isolated browser-test database. No test sends real emails.

Run `npx playwright install chromium` once before browser tests, or use
`PLAYWRIGHT_CHANNEL=chrome npm run test:e2e` with an installed Chrome. The MongoDB
test package downloads a test binary on first use; an existing local binary can be
selected with `MONGOMS_SYSTEM_BINARY` and its matching `MONGOMS_VERSION`. Test
processes need permission to open local ports. Screenshots and failure traces go
to ignored `test-results/`. Stop other Next.js dev servers before browser tests,
and do not run a build concurrently. The test runner clears the generated dev
cache before starting to avoid reload loops when switching from a production build.

Tooling limitation: the bundled Next.js lint plugins currently require ESLint 9,
which npm marks unsupported. ESLint 10 produces peer-dependency conflicts. npm also
reports seven moderate development-tool advisories stemming from transitive
`minimatch`; a compatible `npm audit fix` does not resolve them. Revisit the lint
toolchain when upstream compatibility is available, rather than forcing a major
transitive override. These dependencies are not application runtime dependencies.

## Health endpoint

`GET /api/health` returns HTTP 200 with `{ "data": { "status": "ok" } }` and
`Cache-Control: no-store`. It reports application liveness only; it does not check
database connectivity or provider readiness. It exposes no credentials or runtime
configuration.

## Architecture and source documents

The approved stack is a TypeScript modular monolith: Next.js and React for the
frontend, Node.js Route Handlers for REST APIs, MongoDB Atlas with Mongoose, and Zod.
Custom server-side sessions and Resend password recovery are implemented. Later
milestones add Cloudflare R2, Google Places, YouTube embedding, and scheduled email
processing, with Vercel hosting.

- [Product requirements](docs/PRD.md)
- [Project status and milestone history](docs/PROJECT_STATUS.md)
- [System design](docs/SYSTEM_DESIGN.md)
- [Database design](docs/DATABASE_DESIGN.md)
- [API design](docs/API_DESIGN.md)

These documents govern implementation. Report contradictions before implementing
an interpretation. Some dated notes describe implementations that are not present
in this initial checkout; they are not evidence that a feature exists here.

`src/app` currently owns routing, layout, and global styles. Add domain modules,
shared components, and server facilities only when they contain real functionality.
Business rules belong in services, and every private wedding-owned operation must
derive its wedding context from authenticated membership.

## Deployment preparation

Vercel builds the application using `npm run build`. Select Node.js 24 and configure
`APP_URL` as the deployment's actual HTTPS origin, plus `MONGODB_URI`, `AUTH_SECRET`,
`RESEND_API_KEY`, and `EMAIL_FROM`. Production cookies require HTTPS. Configure a
separate exact origin and credentials for each Preview deployment you use for
onboarding. No cron configuration is needed for this milestone. Never expose
server secrets through `NEXT_PUBLIC_` variables.

## Next milestones

1. Verify password recovery delivery with the Resend sender. Live development
   Atlas onboarding was verified on 2026-11-12; automated tests use isolated
   infrastructure.
2. Build events and timeline, followed by family tasks, guest management, and budget.
3. Settle invitation expiry, role-change/final-Admin concurrency, stable gallery
   sharing, and cron HTTP-method decisions before implementing those features.
