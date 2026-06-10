# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.4] - 2026-06-10
### Changed
- **`indexdev.html` footer** — moved "User Guide | Testing Tracker | Admin" links to their own line above the copyright notice.
- **`testing_tracker.html`** — renamed page `<title>` from "Beta Testing Tracker — Employee Hub" to "Employee Hub Issue Tracker".
- **`testing_tracker.html`** — renamed sticky header `<h1>` and hero `<h2>` from "Beta Testing Tracker" / "Intranet Beta Testing Tracker" to "Employee Hub Issue Tracker".
- **`testing_tracker.html`** — shortened hero subtitle from "Submit your test results, report issues, and share feedback on the new Employee Hub." to "Report issues, and share feedback on the new Employee Hub."
- **`testing_tracker.html`** — renamed "Testing Progress" section label to "Issue Progress".
- **`testing_tracker.html`** — renamed "Testing Requirements Tracker" table heading to "Testing Requirements Tracker (remove after testing)".
- **`testing_tracker.html`** — renamed "Submit Testing Results" accordion toggle to "Submit Testing Results (remove after testing)".

## [1.3.3] - 2026-06-10
### Added
- `express-ntlm` package installed (`admin_portal/`) for future Windows domain authentication investigation.

### Changed
- **`GET /api/me`** now includes `areas` in its response (`{ loggedIn, username, role, areas }`), making it a complete replacement for `/api/session` on the client side.
- **`checkSession()`** in `admin_portal/public/index.html` switched from `fetchAPI('/api/session')` (which returned HTTP 401 when not logged in, producing a red console error) to a raw `fetch('/api/me')` call (always returns HTTP 200 with `loggedIn: true/false`). Eliminates the spurious 401 console error on every page load.

### Fixed
- Removed broken NTLM auto-login implementation (`/api/ntlm-login`, `/api/whoami`, `tryAutoLogin()`, NTLM spinner UI) that caused repeated 500 and 401 errors. Root causes: (1) `express-ntlm` requires `debug` to be a function, not a boolean; (2) browser `fetch()` API does not auto-negotiate NTLM — only native browser navigations do, and only when the site is in the OS "Local Intranet" trusted zone via Group Policy. Reverted admin portal login to the reliable manual username/password form with session cookie persistence.

## [1.3.2] - 2026-06-09
### Added
- **User Guide** (`user_guide.html`) — complete redesign with hero banner, sticky sidebar table of contents, illustrated feature overview cards (Quick Search, Quick Access, Directory, Company Resources, AquaSearch, Testing Tracker), numbered step-by-step instructions for each feature, Beta Testing Tracker section (submit results, report issues, leave comments, edit submissions), Managing the Hub section, Tips & Shortcuts, and a CTA footer with links back to the Hub and Tracker. Fully mobile-responsive with sticky TOC.

### Fixed
- Logo in the upper-left of `testing_tracker.html` was linking to a broken relative path (`indexdev.html`); corrected to `http://www.aqua-aerobic.net/indexdev.html`.

## [1.3.1] - 2026-06-09
### Added
- **Admin Portal Guide** (`admin_portal/public/admin_guide.html`) — full step-by-step guide covering Manage Links, Categories, Quick Search Chips, Icons & Custom SVG, Reordering, Manage Users, Change Password, Testing Tracker, and Tips & Best Practices. Includes sticky TOC sidebar, hero banner, numbered step cards, role comparison table, and callout blocks.
- **📖 Admin Guide** link added to Admin Portal nav bar (`index.html`) — opens guide in a new tab.
- **← Return to Employee Hub** link added to Admin Portal nav bar (`index.html`) — links to `http://www.aqua-aerobic.net/indexdev.html`.
- **← Return to Aqua Intranet Admin** button in the Admin Guide sticky header — links back to `http://www.aqua-aerobic.net:5025/`.

## [1.3.0] - 2026-06-09
### Added
- **Beta Testing Tracker** (`testing_tracker.html`) — full visual redesign with hero banner, sticky header, card-based layout, animated accordion panels, polished checkbox rows, and live participant/issue count badges.
- **General Comments & Discussion** — threaded comment board at the bottom of the tracker with inline reply forms, admin delete, and real-time refresh.
- **File Attachments on Issues** — users can upload multiple PDFs, DOCXs, or images when submitting or editing an issue; attachments display as clickable chips with icons.
- **Attachment Management in Edit Modal** — existing attachments shown with individual ✕ remove buttons; new files can be added without closing the modal.
- **Admin-only Delete** — Delete buttons on Testing Requirements Tracker and Reported Issues are now restricted to logged-in admins only; regular users see only Edit.
- **Testing Tracker link** added to the Admin Portal nav bar (`admin_portal/public/index.html`).
- `tracker_attachments` SQLite table to persist issue file uploads.
- `tracker_comments` SQLite table with `parent_id` support for threaded replies.
- `POST /api/tracker/issue/:id/upload` — multipart file upload endpoint (multer, 20 MB/file limit).
- `DELETE /api/tracker/attachment/:id` — remove a single attachment from disk and database.
- `GET /api/tracker/comments`, `POST /api/tracker/comment`, `DELETE /api/tracker/comment/:id` API endpoints.
- **Notes field** in Submit Testing Results upgraded from single-line input to resizable textarea.
- **Contact note** at the bottom of the tracker: "Need to delete something? Contact ckonkol@ or cshields@".
- `multer` dependency added to `admin_portal/package.json`.

### Changed
- `GET /api/tracker` now includes `attachments` array nested inside each issue object.
- `POST /api/tracker/issue` now returns `{ success, id }` so the frontend can immediately upload files to the new issue.
- Issue form submit handler rewritten to use two-step flow: JSON post → FormData file upload.
- All visible references to the access code removed from page text and form placeholders.
- Admin banner updated to use gradient style with accent left-border.

### Fixed
- File uploads were silently ignored because the form used `application/json` instead of `multipart/form-data`; fixed by separating issue creation and file upload into two sequential requests.

## [1.2.0] - 2026-06-09
### Added
- **Beta Testing Tracker** page (`admin_portal/public/testing_tracker.html`) — tracks which users completed testing and submitted issues.
- **Admin Portal** edit/delete capabilities for tracker entries with session-based bypass of the access code.
- `admin_note` column on both `tracker_users` and `tracker_issues` tables; admins see a highlighted note field in the edit modal.
- `/api/me` endpoint to detect logged-in admin session from the frontend.
- `PUT /api/admin/tracker/user/:id` and `PUT /api/admin/tracker/issue/:id` admin-only edit endpoints.
- Edit and Delete action buttons in both tracker tables; edit opens a modal; delete prompts for confirmation.
- Collapsible `<details>` sections for "Submit Testing Results" and "Report an Issue" forms.
- Link to Beta Testing Tracker added to `indexdev.html` footer.

### Changed
- Testing Tracker moved to `admin_portal/public/` so it is served by the Express server.

## [1.1.1] - 2026-06-09
### Added
- "Restore Original Custom SVG" feature, providing a robust safety net when an unrecognized legacy SVG icon is overwritten.
- Robust UI-safe decoding algorithm to protect Javascript handlers from SVG-embedded strings, newlines, or quotes.
- Prompt-based Custom SVG input box allowing raw code pasting.
- 18 new built-in SVG icons to the dropdown (AI Chat, Building, Layers, Activity, Signal, Video, Camera, Zap, Shield, Support, Bag, Navigation, Compass, Box, Plane, Visitor, Packinglist, Products, Training).

### Fixed
- Infinite text duplication bug on Quick Search chips caused by aggressive text-node parsing in `server.js`.
- Custom SVG prompt syntax errors arising from double-escaping and newline injection.

## [1.1.0] - 2026-06-09
### Added
- Quick Search dropdown with Smart Types (Standard URL vs Aqua Search) inside the Admin Portal GUI Builder.
- Complete User Management system: View, Add, Edit (Username, Role, Areas), and Delete users via Admin interface.
- "Change Password" functionality for users to update their own credentials.
- Reorder buttons (Move Up / Move Down) for all Links, Quick Search Chips, Categories, and Sub-Categories.
- Over a dozen new icons added to the dropdown list.

### Fixed
- Directory parser properly reads both `<details class="sub">` and un-nested direct links.
- "Allowed Areas" listbox width increased for readability.
- Corrected a bug where the icon selector erroneously grabbed adjacent text, breaking the SVG structure.
- Fixed a bug where the icon selector always reverted to the "Default" icon by correcting the matcher's length logic.
- Prevented UI crash caused by obsolete legacy JavaScript code conflicting with new forms.
- Updated user table parser to safely handle older database formats for Allowed Areas.

## [1.0.0] - 2026-06-09
### Added
- Modified commit steps in comiit.txt.
- Created .gitignore to exclude existing folders and allow future folders.
- Initialized Git repository and connected to remote.
