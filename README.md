# Entriseq Estate Access Management System

Entriseq is a Next.js and Supabase application for managing visitor access in a gated residential estate. The current MVP focuses on the existing visitor-management scope: residents create visitor passes, security officers verify and check visitors in/out, and administrators manage residents, security personnel, visitor history, access logs, analytics, and privileged administrator access.

Postponed product areas such as resident ID cards, landlord/tenant credentials, worker credentials, NFC, card replacement, property management, and multi-estate support are intentionally out of scope for this codebase phase.

## Latest Feature Updates

- Resident and security accounts now use a server-enforced temporary password of `000000`. The creation forms display the password as a read-only value, and new users are required to change it after signing in.
- Random password generation and the related Generate button have been removed from the account-creation flow.
- The resident dashboard has a cleaner header with the duplicate green Generate Pass button removed. Visitor passes remain accessible from the primary visitor-access card and navigation.
- Admin, Super Admin, resident, and security screens now share consistent responsive page margins and a common maximum content width.
- Admin and Super Admin navigation now includes the same light/dark theme control available to residents.
- Dark mode now uses one softer cool-charcoal palette across backgrounds, cards, sidebars, inputs, and borders.
- Account forms now use improved input types, browser autocomplete hints, required-field validation, and clearer temporary-password guidance.

The temporary password is defined once in `lib/auth/temporary-password.ts` and enforced by the server API routes. Clients cannot override it by submitting a different password.

## Architecture

- **Frontend:** Next.js App Router, React 19, Tailwind CSS v4, shadcn theme tokens, lucide icons.
- **Backend:** Supabase Auth, Postgres, RLS policies, and server-side Next.js API routes.
- **Auth model:** Supabase Auth user IDs are linked to `public.profiles.id`.
- **Privileged writes:** Administrative and security-sensitive mutations use server API routes with `SUPABASE_SERVICE_ROLE_KEY`.
- **Client reads:** Role-protected pages read scoped data through Supabase browser clients where RLS allows it.
- **Visitor lifecycle:** Visitor status transitions are centralized in `lib/visitor-status.ts` and enforced by server API routes.
- **WhatsApp bot:** Meta WhatsApp Cloud API messages are signature-verified, matched to active residents by registered phone number, and processed by `/api/webhooks/whatsapp`.

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
NEXT_PUBLIC_SITE_URL=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_GRAPH_API_VERSION=
WHATSAPP_LINK_SECRET=
WHATSAPP_WORKER_SECRET=
WHATSAPP_MONTHLY_MESSAGE_LIMIT=900
ESTATE_SECURITY_CONTACT=
```

Notes:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe browser-facing Supabase values.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it with a `NEXT_PUBLIC_` prefix.
- `SUPABASE_ADMIN_REDIRECT_URL` is optional locally, but recommended for deployed administrator invitation links.
- All `WHATSAPP_*` variables are server-only and must never use a `NEXT_PUBLIC_` prefix.
- `WHATSAPP_VERIFY_TOKEN` is a private value you choose and enter in the Meta webhook configuration.
- `WHATSAPP_APP_SECRET`, `WHATSAPP_ACCESS_TOKEN`, and `WHATSAPP_PHONE_NUMBER_ID` come from the Meta app connected to the estate's WhatsApp Business number.
- Set `WHATSAPP_GRAPH_API_VERSION` to the active Graph API version configured for the Meta app, including the `v` prefix.
- `WHATSAPP_LINK_SECRET` and `WHATSAPP_WORKER_SECRET` must be independently generated secrets of at least 32 characters.
- `WHATSAPP_MONTHLY_MESSAGE_LIMIT` defaults to `900` and is capped at `1000` in code.
- `ESTATE_SECURITY_CONTACT` is optional; leave it unset rather than inventing contact details.

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
- WhatsApp phone verification, webhook signatures, message parsing, and bot conversation rules

## Deployment

The production domain, `entriseq.com`, is deployed through Hostinger from the Git repository. The `npm run build` script uses Next.js' supported Webpack production bundler because Hostinger's build container cannot reliably start the Turbopack CSS worker. Local development continues to use Turbopack through `npm run dev`.

A Vercel deployment is also available as a secondary deployment target.

Required Vercel environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
WHATSAPP_VERIFY_TOKEN
WHATSAPP_APP_SECRET
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_GRAPH_API_VERSION
WHATSAPP_LINK_SECRET
WHATSAPP_WORKER_SECRET
WHATSAPP_MONTHLY_MESSAGE_LIMIT
```

Recommended:

```env
SUPABASE_ADMIN_REDIRECT_URL
```

After updating Vercel environment variables, redeploy the project. A missing `SUPABASE_SERVICE_ROLE_KEY` will block production build/page-data collection because API routes import the server-side admin client.

## WhatsApp Visitor-Pass Bot

The bot uses the official Meta WhatsApp Cloud API. A normal personal WhatsApp number cannot call this webhook directly; the estate number must be registered or connected as a WhatsApp Business Platform number in a Meta app.

Configure the Meta webhook callback as:

```txt
https://your-domain.example/api/webhooks/whatsapp
```

Use the same private value for the Meta Verify Token and `WHATSAPP_VERIFY_TOKEN`, then subscribe the WhatsApp Business Account to the `messages` webhook field. Meta signs every POST using the app secret; unsigned or invalid requests are rejected.

Residents interact with the bot as follows:

1. The resident signs in, opens `/residents/settings`, and creates a ten-minute linking code for their WhatsApp number.
2. The resident sends the one-time `LINK-######` code from that number to the estate bot.
3. The bot links the verified WhatsApp identity to the active resident account.
4. The resident uses the interactive menu to generate, list, or revoke visitor passes.
5. Website and WhatsApp creation use the same server-authoritative visitor-pass service and database function.
6. Public QR links use a 192-bit random token; the existing six-digit gate code remains compatible with security verification.

The bot accepts `BACK`, `CANCEL`, `RESET`, and `MENU`. WhatsApp validity choices are 2, 6, 12, or 24 hours, and all new passes are capped at 24 hours server-side.

Webhook events are stored before processing. The webhook performs a best-effort post-response drain, while a Hostinger cron job provides durable recovery. Configure the cron job to send an authenticated `POST` request to:

```txt
https://entriseq.com/api/internal/whatsapp/process
Authorization: Bearer <WHATSAPP_WORKER_SECRET>
```

Run it once per minute. The database queue uses idempotent Meta message IDs, bounded retries, and dead-letter status. Processed message bodies are cleared. Outbound messages are transactionally capped at 900 per UTC billing month unless a smaller configured limit is used.

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
