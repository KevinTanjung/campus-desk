# Campus Desk

Campus Desk lets students request campus services and staff manage the work. It includes student and staff roles, request and category management, status updates, search, sorting and a responsive dashboard.

[Open Campus Desk](https://uph-akk-1912-campus-desk.vercel.app)

Use Node.js 24 or 26 LTS, npm, and a MongoDB replica set. The dependency versions are pinned in package-lock.json. Production uses Vercel Hobby and MongoDB Atlas Free. Styling uses Tailwind CSS.

## Local setup

The application is in the `campus-desk` directory. Start with:

```sh
cd campus-desk
```

1. Run `npm ci` in the campus-desk directory.
2. Copy `.env.example` to `.env.local`. Set your MongoDB connection string and database name. Generate an authentication secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and put it in `BETTER_AUTH_SECRET`.
3. Run `npm run db:init`. The command checks transaction support and creates indexes before the app accepts data.
4. Provide `STAFF_NAME`, `STAFF_EMAIL` and `STAFF_PASSWORD` through your environment, then run `npm run seed:staff`. The command is idempotent and refuses to convert an existing student into staff. It does not reset an existing staff password.
5. Run `npm run dev`. Open http://127.0.0.1:3000. Log in as staff and add categories; students can then register and submit requests.

A standalone mongod without a replica set is insufficient because account creation and category references use transactions. For a local MongoDB installation, start a dedicated instance with `mongod --dbpath /your/local/data --port 27028 --bind_ip 127.0.0.1 --replSet campusDesk`, then initialize the set with `rs.initiate()` in mongosh connected to that port. Keep this instance bound to loopback.

Never commit `.env.local`, database connection credentials or staff passwords. The example files contain no real credentials. Public registration creates students only. No password-reset or email-delivery workflow is included.

## Checks

- `npm test`: validation, error handling, bounded streaming bodies and expired-session save behavior.
- `npm run typecheck`: TypeScript checks.
- `npm run build`: production compilation and route generation.

Integration and performance tests require a separate local server and database. Copy `.env.test.example` to `.env.test.local`, generate its secret, and leave the database name as `campus_desk_test` and the URL on port 3001. Run `npm run build`, then `npm run start:test` in a second terminal. Run `npm run test:integration` and `npm run test:performance` from the first terminal. Stop the test server when done.

Tests refuse remote servers and database names outside the `campus_desk_test` prefix. They create synthetic accounts and remove their own requests, categories, accounts and sessions. The integration suite also clears auth rate-limit records inside that dedicated test database. Do not use this database for development or real records.

Local development without a proxy intentionally shares an auth rate-limit bucket. Production on Vercel reads the client address from its overwritten `x-forwarded-for` header. Outside Vercel, production requires `AUTH_IP_HEADER` to name a header that the trusted proxy replaces; direct public access to the app must be blocked. Never trust an arbitrary client-supplied IP header on a public server. The isolated loopback test server uses a test header to verify that one client does not exhaust another client's allowance.

## Vercel and Atlas deployment

1. Create a MongoDB Atlas Free cluster and a database user restricted to the Campus Desk database. Use Singapore to match the Vercel function region configured in `vercel.json`. Configure Atlas network access for the deployment's egress; do not widen access without reviewing that change.
2. Put the project in a personal Git repository and import it into Vercel. Set the Vercel project root to `campus-desk`. Use the Next.js preset and the build command `npm run build`.
3. Add server-only environment variables: `MONGODB_URI`, `MONGODB_DB`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`. Use the exact production HTTPS origin for `BETTER_AUTH_URL`. The Vercel runtime supplies `VERCEL=1`; no custom IP header setting is needed there. No variable needs a `NEXT_PUBLIC_` prefix.
4. Run database initialization and staff provisioning from a trusted terminal with the production environment loaded, then deploy. Do not run those commands from the build hook or expose a setup endpoint.
5. Verify registration, login, logout, both roles, request CRUD, category management, status transitions and persistence on the deployed HTTPS URL. Repeat a save after an app restart.

Production runs on Vercel Hobby with MongoDB Atlas Free in Singapore, under the personal Atlas organization `Kevin Tanjung Personal`, project `Campus Desk`, cluster `campus-desk`. The database user has `readWrite` access only to `campus_desk` on that cluster. The approved `0.0.0.0/0` network rule supports Vercel's changing outbound addresses; database authentication remains required. Pushes to `main` trigger Vercel deployments.

For production setup from the `campus-desk` directory, load the protected, Git-ignored `.env.production.local` file explicitly:

```sh
node --env-file=.env.production.local --import tsx scripts/init-db.ts
node --env-file=.env.production.local --import tsx scripts/seed-staff.ts
```

The staff login is in `STAFF_EMAIL` and `STAFF_PASSWORD` in that local file. Keep the file private with `chmod 600 .env.production.local`. It must never enter Git or client-side environment variables.

Preview deployments need their own matching auth origin and a separate database if enabled. Do not point untrusted previews at production data. Keep the project within the providers' free-plan limits. Account creation and database provisioning are manual.

## Session expiry

A failed save leaves the current form and its values in place. If the session expired, open the login link in a new tab, log in to the same account, return to the original tab and retry. Draft text is not saved in browser storage.

## Project documents

- [Software requirements specification](campus-desk/docs/SRS.md)
- [SRS Word document](campus-desk/docs/Campus-Desk-SRS.docx)
- [SRS PDF](campus-desk/docs/Campus-Desk-SRS.pdf)
- [Verification results](campus-desk/docs/Verification.md)
