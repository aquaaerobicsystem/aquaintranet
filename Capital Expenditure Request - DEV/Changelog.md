# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
