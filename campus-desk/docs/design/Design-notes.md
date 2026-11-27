# Campus Desk UI mockups

[Figma design](https://www.figma.com/design/rQ6UIsvVyf3ZrO5AecdvZU/Kevin-s-Figma-Project?node-id=0-1)

The Figma file contains 13 separate frames with editable text and shapes. The original student dashboard is retained at node `3:2`. Screens are arranged in rows: authentication, student pages, staff pages, then mobile views. The examples use synthetic names and requests.

| Frame | Role | Purpose | Local SVG |
| --- | --- | --- | --- |
| 01 Login | Both | Email and password login | `screens/login.svg` |
| 02 Create account | Student | Registration with name, email and password | `screens/register.svg` |
| 03 Student - Dashboard | Student | Own request counts and recent requests | `dashboard-desktop.svg` |
| 04 Student - My requests | Student | Search, filter, sort and view own requests | `screens/student-requests.svg` |
| 05 Student - Request detail | Student | Read details and access open-request actions | `screens/student-request-detail.svg` |
| 06 Student - New request | Student | Choose a category and submit a request | `screens/student-new-request.svg` |
| 07 Student - Edit request | Student | Update an open request | `screens/student-edit-request.svg` |
| 08 Staff - Dashboard | Staff | Counts and recent requests across students | `screens/staff-dashboard.svg` |
| 09 Staff - All requests | Staff | Search, filter, sort and review all requests | `screens/staff-requests.svg` |
| 10 Staff - Resolve request | Staff | Review a request and enter a resolution note | `screens/staff-request-detail.svg` |
| 11 Staff - Categories | Staff | Create, rename, activate, deactivate and delete categories | `screens/staff-categories.svg` |
| 12 Mobile - Student dashboard | Student | Stacked cards, recent requests and mobile navigation | `dashboard-mobile.svg` |
| 13 Mobile - New request | Student | A single-column request form | `screens/mobile-new-request.svg` |

Desktop frames are 1280 by 900 pixels. Mobile frames are 390 pixels wide. `figma-screens.jpg` shows the staff detail screen in the editor; `figma-screen-overview.jpg` shows the canvas arrangement. The SVG files can be imported separately.

## Visual style

Use dark green navigation, a pale gray page background, white cards and plain status labels. Typography is Arial or a matching system sans-serif. Body text is 14 to 16 pixels; desktop headings are 30 to 34 pixels. Primary green is `#1d6257`, main text is `#172c35`, and the background is `#f6f7f9`. Status labels include text alongside color. Keep visible keyboard focus in the implemented interface.

## Role and workflow rules

- Students see their own requests. They can edit or delete only while the status is Open.
- Staff see all requests and manage categories. Staff do not create student requests.
- The workflow is Open to In progress to Resolved. Open requests show Start work; in-progress requests show the resolution form. Resolving requires a note.
- Registration creates a student account. Staff accounts are provisioned separately.
- Categories are staff-created records. Examples include Transcripts, Student ID cards, IT support, Facilities and Letters. Categories with linked requests can be deactivated but cannot be deleted.
- Transcript and ID card requests track staff work; the website does not generate official documents.

These are static mockups, without prototype connections. The SRS defines validation, loading, empty and error behavior.

## Development board

[Trello board](https://trello.com/b/aoQSuZMB/campus-desk) contains ten development cards with To Do, Doing and Done lists. `tasks.csv` provides descriptions and a suggested split for two people.
