# Make My Marriage

A wedding management web application for couples and their families.

## Current milestone

The application scaffold and public homepage with interactive sample previews are
implemented, including global styles, root layout, and an application health
endpoint. Authentication, wedding modules, database access, and external
integrations are planned for subsequent milestones. See the
[project status](docs/PROJECT_STATUS.md) for progress, validation, and limitations.

## Local development

Use Node.js 24 LTS (see `.nvmrc`) and npm. If you use nvm, run `nvm use` first.
Install the locked dependencies with `npm ci`, then run `npm run dev` and open
<http://localhost:3000>.

No environment variables or external accounts are required for this milestone.
`.env.example` documents the proposed application origin and future server-only
configuration. When needed, copy it to `.env.local`; never commit secrets.

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

Run lint, typecheck, format checking, and the production build before submitting a
change. The formatter excludes the approved design documents. A testing framework
will be introduced with the backend foundation in Phase 2.

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
Later milestones add custom server-side sessions, Cloudflare R2, Resend, Google
Places, and YouTube embedding, with Vercel hosting and scheduled email processing.

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

Vercel can build the application using `npm run build`; no custom hosting or cron
configuration is required for Phase 1. Select Node.js 24 for hosting. Add separate
development, Preview, and production credentials as integrations are implemented.
Never expose server secrets through `NEXT_PUBLIC_` variables.

## Next milestones

1. Backend foundation: connection reuse, environment validation, API errors and
   responses, validation conventions, and meaningful tests.
2. Authentication and wedding management, including membership authorization and
   cross-wedding isolation.

Before those features, resolve the review's token storage/hashing, authentication
policy, rate-limit persistence, invitation expiry, final-Admin concurrency, and
cron HTTP-method decisions in the relevant approved documents.
