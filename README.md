# Entriseq Estate Access Management System

Entriseq is a Next.js and Supabase application for managing visitor access in a gated residential estate. The current MVP focuses on the existing visitor-management scope: residents create visitor passes, security officers verify and check visitors in/out, and administrators manage residents, security personnel, visitor history, access logs, analytics, and privileged administrator access.

Postponed product areas such as resident ID cards, landlord/tenant credentials, worker credentials, NFC, card replacement, property management, and multi-estate support are intentionally out of scope for this codebase phase.

## Architecture

- **Frontend:** Next.js App Router, React 19, Tailwind CSS v4, shadcn theme tokens, lucide icons.
- **Backend:** Supabase Auth, Postgres, RLS policies, and server-side Next.js API routes.
- **Auth model:** Supabase Auth user IDs are linked to `public.profiles.id`.
- **Privileged writes:** Administrative and security-sensitive mutations use server API routes with `SUPABASE_SERVICE_ROLE_KEY`.
- **Client reads:** Role-protected pages read scoped data through Supabase browser clients where RLS allows it.
- **Visitor lifecycle:** Visitor status transitions are centralized in `lib/visitor-status.ts` and enforced by server API routes.

## Folder Structure

```txt
app/
  admin/                    Admin and Super Admin dashboards
  api/                      Server-side API routes for privileged actions
  components/               Shared form, profile, and UI components
  residents/                Resident dashboard and visitor-pass screens
  security/                 Security officer verification workflow
  update-password/          Password reset/update flow
lib/
  auth/                     Route/API authorization helpers
  supabase.ts               Browser Supabase client
  supabase-admin.ts         Server service-role Supabase client
  supabase/server.ts        Server cookie-aware Supabase client
  visitor-status.ts         Visitor status display and transition rules
supabase/migrations/        Database migrations applied through Supabase
tests/                      Node test runner tests for auth and visitor rules
types/                      Shared TypeScript interfaces
```

## Environment Variables

Create `.env.local` for local development:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ADMIN_REDIRECT_URL=
```

Notes:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe browser-facing Supabase values.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it with a `NEXT_PUBLIC_` prefix.
- `SUPABASE_ADMIN_REDIRECT_URL` is optional locally, but recommended for deployed administrator invitation links.

## Development Setup

```powershell
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Verification Commands

Run these before committing or deploying:

```powershell
npm run lint
npm test
npm run build
```

The test suite currently covers:

- Role authorization rules
- Super Admin protection rules
- Visitor display status
- Visitor check-in/check-out/revocation transition rules

## Deployment

The app is intended to deploy on Vercel.

Required Vercel environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Recommended:

```env
SUPABASE_ADMIN_REDIRECT_URL
```

After updating Vercel environment variables, redeploy the project. A missing `SUPABASE_SERVICE_ROLE_KEY` will block production build/page-data collection because API routes import the server-side admin client.

## Authentication Flow

1. Users sign in from `/`.
2. The app loads the user profile from `public.profiles`.
3. Inactive users are signed out or blocked.
4. Users with `must_change_password = true` are sent to `/update-password`.
5. Admin and Super Admin users with incomplete onboarding are sent to `/administrator-onboarding`.
6. Completed users are redirected by role:
   - `resident` -> `/residents`
   - `security` -> `/security`
   - `admin` -> `/admin`
   - `super_admin` -> `/admin/super-admin`

Route protection is enforced by role-specific layouts through `lib/auth/requireRole.ts`. API routes use `lib/auth/api-authorization.ts`.

## Role Model

Supported profile roles:

- `super_admin`
- `admin`
- `resident`
- `security`

Super Admins can manage administrator access. Admins can manage current resident and security personnel records. Residents create and view visitor passes for their home. Security officers verify, check in, and check out visitors.

## Database Overview

Current core tables:

- `profiles` — Auth-linked account profile, role, active state, onboarding/password flags.
- `residents` — Resident records linked to Auth users.
- `security_personnel` — Security officer records linked to Auth users.
- `visitors` — Visitor passes, access codes, expiry, and check-in/check-out status.
- `admin_invitations` — Administrator invitation/onboarding records.
- `admin_audit_logs` — Super Admin and administrator invitation audit trail.

Important current migrations:

- `super_admin_foundation`
- `lock_down_admin_rpc`
- `add_visitor_pass_details`
- `lock_down_visitor_updates`

`public.visitors` has no authenticated direct `UPDATE` RLS policy. Visitor mutations are performed through server API routes.

## Visitor Lifecycle

1. Resident generates a visitor pass.
2. The app creates a unique access code and expiry.
3. Resident shares the access code/QR pass.
4. Security verifies the code from `/security`.
5. Server API checks that the pass is pending and unexpired before check-in.
6. Server API checks that the pass is entered before check-out.
7. Residents may revoke only their own pending passes through a server API.

Transition rules live in:

```txt
lib/visitor-status.ts
```

## Reusable Components

Common UI components live in `app/components/ui`:

- `AppShell`
- `Card`
- `ConfirmationDialog`
- `EmptyState`
- `PageHeader`
- `StatCard`
- `StatusBadge`
- `SuccessDialog`

Form-oriented shared components:

- `InputField`
- `PrimaryButton`
- `PasswordRequirements`

## Operational Notes

- Keep Supabase migrations and live schema aligned before deployment.
- Do not expose service-role keys in browser code.
- Keep visitor status transitions server-enforced.
- Run lint, tests, and production build after auth, API, RLS, or visitor-flow changes.
