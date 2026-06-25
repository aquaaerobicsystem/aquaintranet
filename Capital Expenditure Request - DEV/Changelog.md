# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.8.0] - 2026-06-25
### Added
- **`public/demo.html`** — **Voice-over narration** using the Web Speech API. Each demo step is spoken aloud when enabled. No external services or API keys required.
- **`public/demo.html`** — **Voice toggle button** (🔇/🔊) in the demo controls bar with green active state indicator.
- **`public/demo.html`** — **Voice selector dropdown** showing available US English voices (Microsoft Zira, David, Mark, Google US English). Sorted by preference with Zira (female) as the default.
- **`public/demo.html`** — Voice preferences (enabled state and selected voice) persist in `localStorage` across sessions.
- **`public/demo.html`** — Speech pauses/resumes with the demo play/pause toggle and cancels on restart.
- **`public/demo.html`** — Emoji characters are stripped from narration text before speaking for cleaner TTS output.
- **`public/demo.html`** — **Print preview auto-scroll**: The print modal now slowly scrolls from top to bottom (~4 seconds), pauses at the bottom (2 seconds), then scrolls back to the top — showing both pages of the approved request form. Scroll speed respects the demo speed factor.

### Changed
- **`public/demo.html`** — Print preview narration updated: "Scrolling through the approved form" with descriptive subtext about form contents.
- **`public/demo.html`** — Print form footer changed from "Page 1 of 1" to "Page 1 of 2".

## [1.7.0] - 2026-06-25
### Added
- **`public/index.html`** — **Login/Logout toggle button** in the navigation bar (far right). Shows "🔒 Login" when not authenticated and switches to "🔓 Logout" when logged in. Always visible for easy access.
- **`public/index.html`** — **Separate SMTP Configuration card** on the Admin page with IT passcode authentication gate. SMTP fields are hidden behind a "🔓 Unlock SMTP Settings" prompt and only visible after entering the IT Passcode.
- **`public/index.html`** — **"🔑 Change IT Passcode"** section inside the unlocked SMTP form, allowing IT staff to update their own passcode from within the restricted area (not visible to Accounting).
- **`public/index.html`** — **IT Department role card** added to the How To → Overview "Who Can Do What" section (purple-themed, 4-column grid).
- **`public/index.html`** — **New FAQ**: "How do I log out?" explaining the Logout button behavior and automatic 1-hour session expiry.
- **`public/app.js`** — `handleAuthToggle()` — single function that routes to login (opens auth modal) or logout (clears session, navigates home) based on current auth state.
- **`public/app.js`** — `updateAuthButton()` — toggles button icon (🔒/🔓), label (Login/Logout), title, and `.authenticated` CSS class.
- **`public/app.js`** — `unlockSmtpConfig()` — verifies IT passcode via `/api/verify-it-code`, then loads and displays SMTP fields.
- **`public/app.js`** — `saveItPasscode()` — saves a new IT passcode from within the SMTP section (min 4 characters).
- **`public/app.js`** — Separate `smtp-settings-form` submit handler for saving SMTP settings independently from main admin settings.
- **`public/app.js`** — `confirmAuth()` now tries both App Passcode and IT Passcode (fallback), granting IT staff full app access via the standard login prompt.
- **`public/app.js`** — Login success toast ("Logged in successfully") shown when logging in via the Login button (not via restricted page redirect).
- **`public/style.css`** — `.nav-auth-btn` styles with dual-state design: teal/accent border for login state, red border for authenticated/logout state. Responsive mobile support hides label, shows icon only.
- **`server.js`** — `POST /api/verify-it-code` endpoint for IT passcode verification (default: `IT2026`). Separate from the App Passcode verification.

### Changed
- **`public/index.html`** — **SMTP fields removed from Email & System Settings form**. SMTP is now exclusively managed in its own IT-only card.
- **`public/index.html`** — **IT Passcode field removed from Admin settings** (no longer visible to Accounting staff). IT passcode is self-managed by IT from within the SMTP section.
- **`public/index.html`** — App Passcode hint updated to "Used for Accounting authentication and deleting requests."
- **`public/index.html`** — How To: Printing section updated from "Accounting Department Only" badge references to include IT staff. Tip now mentions "🔒 Login" button.
- **`public/index.html`** — How To: Admin Settings badge changed from "Accounting Department Only" to "Accounting & IT". Tip updated to mention both passcodes and the Login button.
- **`public/index.html`** — How To: Financial Approval Step 1 updated to mention "🔒 Login" button as primary action with auto-prompt as fallback.
- **`public/index.html`** — How To: FAQ "Who needs to log in?" expanded with two login methods (Login button + auto-prompt), button state change note, and both passcode types.
- **`public/index.html`** — How To: FAQ "Who can remove a request?" and "What does the Dashboard show?" updated to include IT staff.
- **`public/index.html`** — How To: Step 5 (SMTP Configuration) fully rewritten with IT-only badge, default passcode reference, "Change IT Passcode" instructions, full-access login tip, and separation warning.
- **`public/app.js`** — `loadAdmin()` no longer pre-populates SMTP fields; resets SMTP section to locked state on each load.
- **`public/app.js`** — Admin settings save now only includes `accountingEmail`, `presidentialEmail`, and `appPasscode` (SMTP and IT passcode saved separately).


## [1.6.0] - 2026-06-25
### Added
- **`public/demo.html`** — Added a **simulated mouse cursor** (white SVG arrow with drop shadow) that smoothly animates to each interactive element throughout the demo. Integrated into `showClickAt`, `typeInto`, and `setDate` with click animation.
- **`public/demo.html`** — **Blocked user input** on the demo viewport (`pointer-events: none`, `user-select: none`). Clicking the viewport shows a rotating set of professional toast messages explaining it's an automated demo.
- **`public/app.js`** — **Removed-request protection**: when navigating to a request via email link (`#requestor?id=X`, `#department?id=X`, `#financial?id=X`, `#presidential?id=X`) and the request has been removed, shows an 8-second error toast ("Request is no longer available — contact Accounting") and redirects to Home.
- **`public/app.js`** — Added optional `duration` parameter to `toast()` function (defaults to 4000ms).
- **`public/index.html`** — **How To page**: Added 🎬 "Watch Demo" button in the Quick Navigation card header (right-aligned, green gradient). Added full "Interactive Demo" section with feature list, controls guide, and launch button.
- **`public/index.html`** — **How To page**: Updated Step 5 (Submit) to mention both emails and home redirect. Added new Step 6 (View, Edit & Track) with email link instructions, bookmark tip, and edit window warning. Updated FAQ "Can I edit?" answer.

### Changed
- **`public/demo.html`** — Default auto-play speed changed from **1×** to **0.75×** for easier following.
- **`public/demo.html`** — **Email link flow**: Department, Financial, and Presidential approval steps now go **directly to the request detail view** (skip table list) to match real app email link behavior.
- **`public/demo.html`** — Removed intermediate Home page transition between submission emails and department approval.
- **`public/demo.html`** — **Status badges** now update correctly: Financial step shows "⏳ Pending Fin." and Presidential step shows "⏳ Pending Pres." instead of all showing "Pending Dept."
- **`public/demo.html`** — Step count reduced from 21 to 18 (removed table/review intermediate steps).
- **`public/app.js`** — After approving or denying a request, **always navigate to Home page** (previously stayed on approval page for authenticated users).

## [1.5.0] - 2026-06-25
### Added
- **`server.js`** — After creating a new request, a **confirmation email** is now sent to the requestor containing request details (ID, Vendor, Cost, Status) and a "View / Edit Request" button linking to `#requestor?id=X`.
- **`server.js`** — After editing a request (PUT), a **notification email** is sent to the department manager informing them the request was updated, with a "Review Request" button.
- **`server.js`** — All requestor-facing status update emails (department approval/denial, financial denial, full approval, presidential approval/denial) now include a **"View Request"** button linking back to `#requestor?id=X`.
- **`public/app.js`** — `loadRequestor()` now accepts a `targetId` parameter. Navigating to `#requestor?id=X` directly opens the request detail view (no auth required).
- **`public/index.html`** — Added **"✏️ Edit Request"** button to the request detail card header. Shown only when request status is "Pending Department".
- **`public/app.js`** — `viewReqDetail()` dynamically shows/hides the Edit button based on request status and wires `editRequest()` on click.
- **`public/index.html`** — How To page updated:
  - Submit Step 5 now documents both emails (approval request + confirmation) and home page redirect.
  - New Step 6 "View, Edit & Track Your Request" explains the email link, editing, bookmark tip, and edit window warning.
  - FAQ "Can I edit?" updated to reference the email link and ✏️ Edit Request button.
- **`public/demo.html`** — Demo now shows **requestor confirmation email** preview (with details table and View/Edit button) after submission, before the dept manager email.
- **`public/demo.html`** — Demo briefly shows **Home page** after submission with narration "Redirected to Home page after submission".

### Changed
- **`public/app.js`** — After both new submission and edit, user is navigated to the **Home page** instead of the requestor list (which requires auth).
- **`public/app.js`** — Edit toast updated to: "Request #X updated! Notification email sent to department manager."
- **`public/app.js`** — `navigate()` now passes `targetId` to `loadRequestor()`.

## [1.4.0] - 2026-06-25
### Added
- **`public/demo.html`** — Added `DEMO_CONFIG` configuration object at the top of the demo script, allowing easy customization of all names, userIDs, emails, vendor, cost, description, and accounting details from a single location.
- **`public/demo.html`** — Added **Print Preview** step (Step 18) to the automated demo, displaying a full-page printable form with Request Information, Approval Signatures (with cursive font rendering), and Accounting Details tables — matching the real app's print modal layout.
- **`public/demo.html`** — Added **Email Notification Previews** at 4 key workflow points:
  - After request submission → email to Department Manager
  - After department approval → email to Accounting/Financial
  - After financial approval → email to President/CEO
  - After presidential approval → email to Requestor (fully approved)
  - Each email preview shows From/To/Subject headers, formatted body, and corporate signature with logo.
- **`public/demo.html`** — Added **Manual Advance Mode** toggle (`AUTO` / `MANUAL`) on the controls bar. In MANUAL mode, a green "Next ▶" button appears at step transitions, allowing users to advance at their own pace.
- **`public/demo.html`** — Added **Speed Control** (`−` / `+` buttons) on the controls bar with 6 speed levels (0.5×, 0.75×, 1×, 1.5×, 2×, 3×). All `wait()` delays are scaled by the speed factor in real-time. Speed label changes color: green when slow, amber when fast.
- **`public/demo.html`** — Added Email Preview Modal HTML and CSS with email-client styling (header bar with From/To/Subject fields, body area, corporate signature block).
- **`public/demo.html`** — Added print-form CSS styles (`.print-form`, `.print-table`, `.print-sig`, `.print-footer-bar`, `.print-table-accounting`) for the in-demo print preview.
- **`public/demo.html`** — Expanded Accounting Details form in the demo to include: Class, Accum. Depreciation Account, Depreciation Expense Account, UseTax, Equipment Exempt, Tooling (with checkbox interaction), and Notes fields.

### Changed
- **`public/demo.html`** — All hardcoded names, emails, vendor, cost, and description values throughout the demo script (form fields, table rows, approval modals, signatures, dashboard, print preview) now reference `DEMO_CONFIG` instead of inline strings.
- **`public/demo.html`** — `newReq` object now derives all values from `DEMO_CONFIG` (moved `DEMO_CONFIG` declaration before `newReq`).
- **`public/demo.html`** — Demo step count increased from 20 to 21 (added Print Preview step; Dashboard → Step 19, Home → Step 20, Done → Step 21).
- **`public/demo.html`** — `wait()` function now applies a speed multiplier (`ms / speedFactor`) for real-time speed adjustment.
- **`public/demo.html`** — Controls bar expanded with Next Step button, AUTO/MANUAL mode toggle, and Speed ± controls.

## [1.3.0] - 2026-06-24
### Added
- **`public/index.html`** — Added 🔍 search input to all 5 data grid card headers (Dashboard, Requestor, Department, Financial, Presidential) for live text filtering across ID, Requested By, Vendor, Description, Status, and Est. Cost.
- **`public/index.html`** — Added 🔍 search input to Admin → Removed Requests section.
- **`public/app.js`** — Added `searchFilter()` helper function for reusable client-side text filtering across all grids.
- **`public/app.js`** — Added `filterRemovedRequests()` and `renderRemovedTable()` for search support on removed requests.
- **`public/index.html`** — Redesigned Home page with summary stat cards (Total Requests, In Progress, Approved, Denied) fetched from a lightweight public API.
- **`public/index.html`** — Added premium hero CTA button on Home page with gradient background, glow animation, and hover effects.
- **`public/style.css`** — Added `.btn-hero` styles with gradient, pill shape, `heroGlow` keyframe animation, and hover/active transitions.
- **`server.js`** — Added `GET /api/stats` public endpoint returning aggregate request counts by status without exposing request data.
- **`public/app.js`** — Added `loadHome()` function and wired into navigation switch to load stats on Home page visit.
- **`public/app.js`** — All 5 refresh buttons now show a toast notification on successful refresh (e.g., "Dashboard refreshed.").

### Changed
- **`public/index.html`** — Removed 📝 Request nav tab from navigation bar (redundant with Dashboard).
- **`public/index.html`** — Dashboard "New Request" button renamed to "Create New Request" and now opens the submission form directly (same behavior as Home page CTA).
- **`public/index.html`** — Authentication modal info text updated to explain that only the Accounting department has access to restricted areas.
- **`public/app.js`** — All refresh button handlers now clear search input and reset pagination before reloading data.
- **`public/app.js`** — Admin logs refresh button now shows loading spinner and toast feedback.

### Fixed
- **`public/app.js`** — Fixed Department, Financial, and Presidential refresh buttons showing blank page. Root cause: click `Event` object was passed as `targetId` parameter (truthy), causing the table to hide and attempt loading an invalid detail view. Fixed by wrapping handlers in arrow functions.
- **`public/index.html`** — Fixed search pagination bug: `oninput` handlers were resetting page to 0 (pagination is 1-indexed), causing `paginateRows` to return empty arrays. Changed to `page=1`.

### Documentation
- **`public/index.html`** — Updated How To page:
  - Submit Step 1: Updated to mention Home page summary stats and "Create New Request" button.
  - Admin section: Renumbered steps (1–4), added new step for "Removed Requests" section.
  - Admin section: Changed "deletions" to "removals", "request deletion" to "removing requests".
  - FAQ: Updated "Can I edit?" to reference Dashboard instead of removed Request page.
  - FAQ: Updated "What does the Dashboard show?" with search bar, Create New Request button, and public Home page stats.

## [1.2.0] - 2026-06-24
### Added
- **`public/index.html`** — Added "Date" column to all 5 data grids (Dashboard, Requestor, Department, Financial, Presidential) showing `CreatedAt` when created and `UpdatedAt` when updated, with hover tooltip displaying full timestamp.
- **`public/app.js`** — Added `fmtSmartDate()` helper that intelligently displays either the created or updated date with a descriptive tooltip.
- **`public/app.js`** — Added 25-row pagination system across all data grids with Prev/Next controls and "Page X of Y" indicator. New functions: `paginateRows()`, `renderPagination()`, `paginateTo()`, and `renderReqListTable()`.
- **`public/style.css`** — Added `.pagination-controls`, `.pagination`, and `.pagination-info` styles for pagination UI.
- **`public/index.html`** — Added pagination container `<div>` elements after each data grid table.
- **`public/TestCases.html`** — Added toast notification system (CSS + `showToast()` function) for user feedback messages.

### Changed
- **`public/index.html`** — Renamed "Requested By" column to "Req By" on Dashboard, Department, Financial, and Presidential grids for a more compact fit.
- **`public/index.html`** — Moved "Date" column to the 2nd position (after `#`) on all data grids.
- **`public/index.html`** — Renamed "Created" column header (Requestor grid) and "Dept. Approved" / "Fin. Approved" column headers (Financial / Presidential grids) to unified "Date" column.
- **`public/app.js`** — Reordered `<td>` cell rendering in all 5 render functions to match new column order: `#, Date, Req By, Vendor, ...`.
- **`public/app.js`** — Fixed timezone offset in Date column tooltips: stripped trailing `Z` from database timestamps (which are local time, not UTC) to prevent -5 hour display error, matching the pattern already used in admin logs.
- **`public/style.css`** — Reduced table cell padding (`0.875rem 1rem` → `0.625rem 0.75rem`), cell font-size (`0.875rem` → `0.8rem`), and header font-size (`0.75rem` → `0.7rem`) for more compact data grids. Added `white-space: nowrap` to table headers.
- **`public/TestCases.html`** — When Tester Name is cleared: all test results, counts, progress, and sign-off data are now reset, and a toast notification prompts the user to enter their name.

## [1.1.0] - 2026-06-24
### Added
- **`public/index.html`** — New "How To" page with comprehensive user guide:
  - Quick Navigation grid with sticky positioning (floats below nav bar while scrolling).
  - Workflow Overview with visual flow diagram and "Who Can Do What" role cards.
  - Step-by-step guides for: Submit a Request, Department Approval, Financial Approval, Presidential Approval, Printing, and Admin Settings.
  - Interactive FAQ accordion with 8 questions covering editing, denial, file uploads, login, signatures, email notifications, dashboard, and deletion.
- **`public/index.html`** — Added ❓ How To nav link in the navigation bar.
- **`public/app.js`** — Added `howto` page routing, `scrollToHowto()` helper, and auth bypass for the How To page.
- **`public/style.css`** — Added ~300 lines of How To page styles: sticky quick nav, flow diagram, step cards, tip/warning callouts, approve/deny action cards, FAQ accordion, and responsive breakpoints.

### Changed
- **`public/index.html`** — Department and Presidential approval steps now instruct users to access requests exclusively via the email link (e.g. `#department?id=123`), not through the nav menu.
- **`public/index.html`** — Updated access model throughout How To page: Accounting department has global access with UserID/passcode; all other users create requests via URL (`http://www.aqua-aerobic.net:5030/`) and approve/deny via email links.
- **`public/index.html`** — Financial Approval and Admin Settings sections now labeled "Accounting Department Only" with 🔐 callouts.
- **`public/index.html`** — Deletion restricted to Accounting department only (updated in Admin section and new FAQ entry).
- **`public/style.css`** — Compacted nav bar: reduced brand font size, nav link padding, and font size to fit all 8 nav items on one line without wrapping.
- **`public/style.css`** — Code formatting: expanded single-line CSS rules to multi-line for improved readability.

## [1.0.0] - 2026-06-24
### Changed
- **`public/index.html`** — Logo / nav-brand click now navigates to `#home` (via `navigate('home')`) instead of performing a full page reload (`window.location.reload()`).

### Added
- Initial commit of Capital Expenditure Request application to repository.
- **`public/index.html`** — Multi-page SPA with Home, Dashboard, Request Submission, Department Approval, Financial Approval, Presidential Approval, and Admin pages.
- **`public/app.js`** — Client-side application logic: hash-based routing, form handling, digital signature generation, file uploads, approval/deny modals, print view, and authentication.
- **`public/style.css`** — Complete design system with dark theme, glassmorphism nav, responsive layout, form components, modals, tables, and print styles.
- **`server.js`** — Express backend with SQLite database, multi-level approval workflow, nodemailer email notifications, file upload support, and activity logging.
- **`Changelog.md`** — Project changelog.
- **`commit.txt`** — Commit workflow instructions.
