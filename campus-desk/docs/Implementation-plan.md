# Campus Desk Implementation Plan

Goal: implement the approved SRS using Next.js, TypeScript, MongoDB, Better Auth, Zod and Tailwind CSS.

Spec: docs/SRS.md. Next.js was approved on 27 November 2026. Existing unrelated UPH files must remain untouched. No README changes, new optional product features, external deployment, or account changes are needed to build and verify locally.

1. Foundation: package scripts and pinned dependencies, environment example, Next configuration, shared domain types and strict input schemas. Verify schema boundaries with the Node test runner. Commit separately.
2. Authentication: MongoDB connection/index setup, Better Auth configuration and guarded auth routes, current-role checks, staff seed command. Verify registration, session expiry/logout, role injection and auth throttling against a temporary MongoDB replica set. Commit separately.
3. Service API: request ownership, atomic open-only changes, status transitions, category transactions, filtered/sorted lists and dashboard counts. Verify two students and staff through HTTP, including concurrent category and status changes. Commit separately.
4. Interface: shared responsive shell, registration/login/logout, dashboard, request list/detail/forms and staff categories. Reuse the agreed Figma layout. Verify browser flows at desktop/mobile widths, keyboard controls and error states. Commit in small functional groups.
5. Delivery: setup/deployment instructions in docs/Development.md, repeatable integration/performance checks, production build and final review. Record actual results and remaining hosting decisions. Commit fixes independently.

Review focus: direct API access bypassing UI; stale sessions and roles; category deletion during request creation; staff updates racing student edits; failed database writes retaining form input. Tests must exercise these conditions instead of only happy paths.

Local verification uses synthetic data and a dedicated temporary database. Application secrets are generated locally and ignored by Git. Production hosting remains a separate account-dependent step.
