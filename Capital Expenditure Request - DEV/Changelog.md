# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
