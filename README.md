# Varun Sharma Portfolio

A dark, responsive portfolio and Supabase-backed private content studio for projects, skills, certificates, achievements, updates, and visitor enquiries. Z answers questions from published portfolio records and can submit a visitor enquiry after an explicit review and confirmation. The site does not send email.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4, Framer Motion, Lucide React
- Supabase PostgreSQL, Auth, and Storage with `@supabase/ssr`
- Groq chat completions (`openai/gpt-oss-20b` by default)
- Zod validation

## Local setup

1. Install Node.js 20.9 or newer and npm.
2. Copy `.env.example` to `.env.local`.
3. Fill the required server variables listed below with values from Supabase and your administrator account. The example intentionally has empty values. Do not put secret keys in a `NEXT_PUBLIC_` variable.
4. Set `ADMIN_ROUTE_PREFIX` to a multi-segment random path of at least 32 characters, without leading or trailing slashes. Set `NEXT_PUBLIC_ADMIN_ROUTE_PREFIX` to the exact same path. The public copy is used to construct links; it does not authorize access.
5. Install dependencies and start Next.js:

   ```sh
   npm install
   npm run dev
   ```

   Visit `http://localhost:3000`. Restart the dev server after changing environment variables because the private route rewrite is built from `ADMIN_ROUTE_PREFIX`.

### Environment variables

These six variables are required by the current server configuration. If any are missing, the server reports their names in a `Missing required server configuration` error without printing any configured values:

| Variable                         | Purpose                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| `SUPABASE_URL`                   | Supabase project HTTPS URL.                                                             |
| `SUPABASE_PUBLISHABLE_KEY`       | Supabase publishable key for the public client and Auth session.                        |
| `SUPABASE_JWKS_URL`              | Supabase project's HTTPS JWKS URL; required and URL-validated by the app configuration. |
| `ADMIN_USER_ID`                  | UUID of the one allowed administrator Auth user.                                        |
| `ADMIN_ROUTE_PREFIX`             | Private multi-segment path prefix used by the server rewrite.                           |
| `NEXT_PUBLIC_ADMIN_ROUTE_PREFIX` | Same prefix, exposed only so client navigation can form the login and dashboard links.  |

Optional server variables enable additional features:

- `SUPABASE_SECRET_KEY` is needed for protected file storage operations and visitor enquiry submission. Keep it server-only.
- `GROQ_API_KEY` enables Z's AI chat. Without it, Z reports that chat is not configured.
- `GROQ_MODEL` overrides the default model (`openai/gpt-oss-20b`).

The Supabase secret and Groq key are never bundled into client code. Only `SUPABASE_PUBLISHABLE_KEY` and the public route prefix are exposed to browser code.

## Supabase setup

1. Create a Supabase project and put its URL, publishable key, secret key, and JWKS URL in `.env.local`.
2. In the Supabase SQL Editor, run [`supabase/migrations/0001_portfolio.sql`](supabase/migrations/0001_portfolio.sql).
3. Run [`supabase/migrations/0002_certificate_storage.sql`](supabase/migrations/0002_certificate_storage.sql). It safely restores the private `certificate-files` bucket and its administrator-only storage policy.
4. In **Authentication → Users**, choose **Add user** and create the administrator with an email and password you control. This project has no public registration flow; disable public signups in Supabase Auth settings as well.
5. Open the new user in **Authentication → Users** and copy its **User UID** (UUID). Put that value in `ADMIN_USER_ID` in `.env.local`.
6. Add the same UUID to the membership table created by the migration. In the SQL Editor, replace the placeholder below with the Auth **User UID**. This statement is safe to repeat:

   ```sql
   insert into public.admin_members(user_id)
   values ('YOUR_AUTH_USER_UUID'::uuid)
   on conflict (user_id) do nothing;
   ```

   The UUID in `admin_members.user_id` must match `ADMIN_USER_ID`. The server checks the Auth user's UUID, and the database's `is_portfolio_admin()` policy checks membership. Knowing the route prefix is not sufficient.

If login says **“This account is not registered as a portfolio administrator,”** Supabase accepted the credentials and the Auth UUID matched `ADMIN_USER_ID`, but `is_portfolio_admin()` returned false. Check membership using the same Auth User UID:

```sql
select exists (
  select 1
  from public.admin_members
  where user_id = 'YOUR_AUTH_USER_UUID'::uuid
) as is_registered_admin;
```

If the result is false, run the idempotent insert above. It adds only that Auth UUID to `admin_members`; it does not change RLS, other users, or portfolio data. If the query errors because the table is missing, apply `0001_portfolio.sql` once in the Supabase SQL Editor before registering the administrator.

7. The migrations create private storage buckets with size, MIME, and access policies. Project images, achievement images, and certificate files are served through short-lived signed URLs only after the corresponding content record is published.

To diagnose certificate uploads in the Supabase SQL Editor, run:

```sql
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'certificate-files';

select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname = 'admin manages certificate files';

select user_id
from public.admin_members
where user_id = 'YOUR_ADMIN_USER_UUID';
```

The bucket should have `public = false`, an 8 MB limit, and the four accepted MIME types. The policy must apply to `authenticated` and check `public.is_portfolio_admin()` for both `USING` and `WITH CHECK`. The membership query must return the Auth user UUID configured as `ADMIN_USER_ID`. If the bucket or policy is missing, run migration `0002`; if membership is missing, insert the UUID into `public.admin_members` as described above.

The enquiry API inserts through a server-only client after strict input validation and rate limiting. The table has no anonymous read policy. Authenticated administrators can read and manage enquiries through RLS. Never expose the secret key in a client component.

## Admin dashboard

Configure the route prefix in both `ADMIN_ROUTE_PREFIX` and `NEXT_PUBLIC_ADMIN_ROUTE_PREFIX` with the same multi-segment path (at least 32 characters total; each segment may contain letters, numbers, `_`, and `-`, and is limited to 64 characters). Do not add leading or trailing slashes. For example, a prefix `vault/random-secret-value` produces these paths:

- Login page: `/vault/random-secret-value/admin/login`
- Dashboard: `/vault/random-secret-value/admin/edit`

Open `http://localhost:3000/<ADMIN_ROUTE_PREFIX>/admin/login` locally, or use the same path on the deployed site. After an administrator signs in, the app redirects to `/<ADMIN_ROUTE_PREFIX>/admin/edit`. Use **Sign out** in the dashboard to log out. After changing either prefix, restart the dev server and rebuild/redeploy so Next.js creates the matching rewrite.

The private prefix is applied by a Next.js rewrite at build/start time. Direct `/admin` and `/admin/*` requests return 404. An unauthenticated visitor to a dashboard page is redirected to the prefixed login page. A signed-in account with any other UUID is rejected. Every dashboard page and each data, upload, and storage API operation checks the authenticated UUID against `ADMIN_USER_ID`; database access is further restricted by the `admin_members` membership function and RLS. The login endpoint is rate limited. Session cookies are HttpOnly, SameSite Lax, and Secure in production. The login page and dashboard are not accessible until all required variables are configured and the prefix rewrite is built.

The dashboard lets the administrator create, edit, publish, and remove projects, certificates, achievements, updates, skills, profile data, and enquiries. Upload files from the relevant manager using the file picker; the application does not scan or import any local folder. Supported project and achievement images are PNG, JPEG, or WebP. Certificates also allow PDF. The limit is 8 MB per file. File names are generated by the server.

In **Enquiries**, search or filter messages, update status, delete records, and use **Reply via email** to open the visitor's address in the administrator's default mail application. This only opens a `mailto:` link; the website does not send email.

## Z and enquiries

Z reads a bounded set of published public portfolio fields from Supabase. That safe context is cached for five minutes and invalidated after admin content changes. It sends the current question and up to three short prior user messages to the server-side Groq endpoint, then streams tokens to the browser. Browser-supplied assistant messages and private enquiries are never included. Server and browser timings record response start, first token, and total duration without recording message contents. The floating prompt is randomized between 15 and 20 seconds, remains for 2 seconds, and stops after opening or dismissing it.

When a visitor asks to contact Varun, the chat opens a form for name, email, subject, and message. It presents a review of those values and asks for explicit confirmation before submitting. The server validates the fields and request size, applies an in-memory per-instance rate limit and a honeypot, then stores the enquiry. The visitor receives a success or error status; no email is sent.

The privacy page explains that submitted enquiries are stored in Supabase and that chat requests are sent to Groq. Avoid asking visitors to share sensitive information.

## Commands and deployment

```sh
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run start
```

Deploy to a Node-compatible Next.js host. Configure the same environment variables in the deployment settings before building. The private route rewrite must be built with the configured prefix. Configure a custom domain and replace the `varun.sh` metadata base in `app/layout.tsx` and `app/sitemap.ts` if the deployed hostname differs.

Rate limiting uses in-process memory, so counts reset on restart and are not shared across serverless instances. For a horizontally scaled production deployment, connect a shared rate-limit store before relying on it against sustained abuse. Live Supabase Auth, RLS, Storage, and Groq behavior requires the project's credentials and cannot be verified from this repository alone.
# My_Portfolio
