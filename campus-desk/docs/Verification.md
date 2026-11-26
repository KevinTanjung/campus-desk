# Verification

Checked locally on 27 November 2026 with Node.js 26.13.0, Next.js 16.4.6 and a MongoDB replica set on loopback. Tests use synthetic data.

## Automated checks

- Seven Node test cases cover strict validation boundaries, protected input fields, expired-session save recovery, auth error messages, bounded streaming JSON, invalid origins and safe database-outage responses.
- The production build and TypeScript checks pass.
- The HTTP integration suite passes 71 assertions against a production-build server and a separate test database. It covers two students and staff, real sessions, ownership and current roles, request/category CRUD, inactive categories, atomic status transitions, category deletion races, sorting, filtering, pagination, dashboard totals, invalid JSON, oversized auth/business bodies, origin checks, logout, expiry, persistent throttling and isolation of two client IPs.
- A local load check with 1,000 requests, ten signed-in users and 100 warmed reads measured a 27 ms p95. The first measured read was 17 ms. This run used an already-running local server; it does not measure a fresh Vercel instance or network latency to Atlas.

## Browser checks

The connected Chromium browser was used to register a synthetic student, log in/out, create staff categories, create and edit a student request, progress it through the staff workflow to resolved, navigate the mobile menu and inspect the dashboard. Dashboard checks at 360, 768 and 1440 CSS pixels showed no page-level horizontal overflow. Screenshots are in `docs/screenshots`.

## Review fixes

The review identified shared production auth throttling without trusted IP configuration, overly broad test-database access, failed-save navigation that discarded draft text, and misleading login errors. Production now uses Vercel's client IP header or requires an explicitly configured trusted proxy header. Tests are restricted to a separate local database and port. Expired-session writes retain the form, and auth errors distinguish throttling and unavailable service. Authentication bodies are read once through the bounded reader before being forwarded.

## Production deployment

Deployed on 27 November 2026 at https://uph-akk-1912-campus-desk.vercel.app using Vercel Hobby and a personal MongoDB Atlas Free cluster in Singapore. Database initialization and staff provisioning completed successfully. The application uses server-only production variables.

A focused HTTPS check passed 26 assertions covering registration, staff login, student role assignment, category permissions and updates, request validation, creation, editing, deletion, search and sorting, staff status changes, locked requests, dashboard access and logout. Session cookies have `Secure`, `HttpOnly` and `SameSite=Lax` attributes. The deployed staff dashboard loads in Chromium.

The saved request and its resolved status survived a fresh Vercel deployment. A category update also succeeded after redeployment. The check's synthetic request, category, student account and related sessions were then removed; the staff account remains ready for use.

## Remaining release checks

Firefox, Safari, mobile Safari and a complete WCAG contrast/accessibility audit have not been run. No production load or cold-start performance result is claimed.
