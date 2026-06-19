# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.1] - 2026-06-19
### Changed
- **`indexdev.html`** — ACE quick-link subtitle changed from "Corporate knowledge base" to "AI Company Knowledge Base".
- **`indexdev.html`** — ACE AI-Tools card tag changed from "Knowledge Base" to "AI Knowledge Base"; description updated to "Your AI company knowledge base."
- **`indexdev.html`** — AI Tools callout "Explore" button now toggles to "Close" when the panel is open (CSS-only, no JS) so users know they can click again to collapse.

## [1.5.0] - 2026-06-19
### Added
- **AI Tools callout** — replaced the single-purpose AquaSearch callout with a collapsible "AI Tools" panel featuring three tool cards (AquaSearch, AVA, ACE) in a premium glassmorphism grid. Includes animated grid background, glow orbs, staggered card entrance animations, hover glow line, and responsive layout (collapses to single-column on mobile).
- **AquaSearch action link** — added a direct "AquaSearch — Company File Search" button inside the Company Resources → AquaSearch sub-section.
- **IT HelpDesk action link** — added "Email IT HelpDesk" button inside the Company Resources → IT Help Desk & Requests sub-section.
- **PM2 restart reference** (`admin_portal/restartPM2.txt`) — quick-reference commands for restarting the admin portal PM2 process.

### Changed
- **`indexdev.html`** — "Search All Templates" button now calls `openAquaSearch('templates','')` instead of `openAquaSearch('template form')` for correct search behavior.
- **`indexdev.html`** — AquaSearch sub-section description shortened to "Search across Aqua's popular network drives, Engineering Index & Intranet pages!"
- **`indexdev.html`** — Workflows & Procedures category description shortened to "Workflows and procedures (coming soon!)"
- **`admin_portal/server.js`** — Directory parser jQuery selector changed from `.parent().next('.cat-grid')` to `.parent().nextAll('.cat-grid').first()` in both GET and POST `/api/areas/:name/json` routes, fixing a bug where the parser could select the wrong `.cat-grid` container when non-grid siblings sat between the heading and the grid.

## [1.4.0] - 2026-06-19
### Added
- **Scroll progress bar** — gradient indicator fixed at the top of the viewport showing page scroll position.
- **Glass-morphism header** — frosted glass effect with `backdrop-filter: blur(16px)` and enhanced shadow on scroll via `.scrolled` class.
- **Directory filter** — live type-to-filter input that hides non-matching category cards with a visible result count.
- **Expand/Collapse All button** — toggle in the Directory section header to bulk open or close all cards; syncs state when individual cards are manually toggled.
- **Back to Top button** — floating button appears after scrolling 400px, smooth-scrolls to top on click.
- **Staggered card entrance animations** — directory cards fade-in-up with cascading `animation-delay` on page load.
- **Accordion body animation** — `fadeSlideDown` keyframe on card content reveal for smoother open transitions.
- **Subtle body texture** — radial gradient overlays for visual depth without distraction.
- **Decorative callout elements** — AquaSearch callout now has floating decorative circles for premium feel.
- **Footer accent bar** — centered gradient divider above footer content.
- `indexdev2.html` dev copy created for iterative testing.

### Changed
- **CSS design system overhaul** — expanded variables: added `--accent-light`, `--gray-300`, `--gray-500`, `--radius-sm`, `--shadow-md`, `--transition-fast`, `--transition`, `--transition-spring` custom properties.
- **Border radius** increased from 10px → 12px globally for softer card edges.
- **Shadow system** refined to 4 tiers (`sm`, default, `md`, `lg`) with subtler values.
- **All transitions** switched from fixed durations to CSS variable-driven cubic-bezier easing.
- **Header** — upgraded from solid white to translucent glass with `backdrop-filter` and scroll-aware shadow.
- **Quick link cards** — enhanced hover with icon scale+rotate, gradient overlay, name color transition, and deeper lift.
- **Category cards** — added hover lift effect, larger icon (34→38px), and spring-curve icon scale on summary hover.
- **Chips** — increased padding, added shadow on hover, and SVG opacity transition.
- **Search input** — focus now highlights the search icon in blue and fades placeholder color.
- **Section headers** — font size 20→22px, added `letter-spacing: -0.01em`.
- **Directory section header** — moved `<span class="section-count">` outside `<h2>` to fix HTML nesting.
- **AquaSearch callout** — wider gradient stops, more padding, positioned content with `z-index`.
- **Search section buttons** — added `translateY(-1px)` hover lift and active press state.
- **Footer** — added gradient background and decorative accent bar.
- **Print styles** — added exclusions for new UI elements (back-to-top, scroll progress, filter, toggle button); ensured card animations are disabled in print.
- **Responsive** — added directory filter and back-to-top button responsive rules for mobile.

### Fixed
- **`indexdev.html`** — fixed broken URL `fhttp://www.aqua-aerobic.net/iles/...` → `http://www.aqua-aerobic.net/files/...` (Time Entry Quick Guide link).
- **`indexdev.html`** — added missing `target="_blank"` on Time Entry Quick Guide link.
- **`indexdev.html`** — removed redundant inline `onkeydown` handler with `&amp;&amp;` entity encoding on header search input (JS listener at bottom of file already handles this).
- **Expand/Collapse All** — added `_bulkToggle` flag so the accordion auto-close listener doesn't fight bulk toggle operations.



## [1.3.7] - 2026-06-18
### Changed
- **`indexdev.html`** — Increased "Employee Hub" header (`h1`) font size from 17px → 20px (desktop), 14px → 16px (≤960px), and 13px → 15px (≤768px) for better readability.
- **`indexdev.html`** — HTML formatting cleanup: collapsed multi-line attributes onto single lines throughout the file for consistency.

### Added
- **`indexdev.html`** — Added "Ask AVA" (Instant HR Answers) quick link to the Company Resources section.

## [1.3.6] - 2026-06-16
### Added
- **`indexdev.html`** — Added "Ask ACE" (Corporate knowledge base) link to the Quick Links section.

## [1.3.5] - 2026-06-16
### Changed
- **`indexdev.html`** — Added an accordion script to ensure only one details element is open at a time within its group, improving the collapse/expand flow.


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
