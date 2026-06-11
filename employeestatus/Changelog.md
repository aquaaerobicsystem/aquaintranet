# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-06-11

### Added
- `index.html` — Professional dark-themed landing page for the Aqua Employee Status SSRS report
- Filter panel with all four SSRS parameters: Status, Departments, Status Date From, Status Date To
- Department dropdown populated with all 37 exact `DeptDesc` values from the live SSRS report
- **Open Report** button linking to SSRS ReportViewer with selected filters applied via URL params
- **Reset Filters** button to clear all inputs back to defaults
- Quick Access cards: Active Employees, Inactive Employees, AquaLocator
- **⚡ Pro Tips** section with three interactive tip cards (Clickable Departments, Interactive Pie Chart, Status Date Explained)
- AquaLocator link (`https://aqualocator.github.io/`) in topbar nav and Quick Access section
- `newlogo.png` — Aqua-Aerobic Systems logo displayed in topbar with white background
- Status Date footnote matching SSRS report header text
- Copyright footer: *Copyright © 2026 Aqua-Aerobic Systems, Inc. — All Rights Reserved | Internal Use Only*

### Fixed
- URL parameter separator: modern portal URL (`/Reports/report/`) now uses `?` instead of `&` to avoid `rsInvalidItemPath` SSRS error
- `InActive` casing corrected to match SSRS parameter value exactly
- All department `option value` attributes updated to exactly match live SSRS `DeptDesc` values (removed abbreviated/incorrect names like `HR`, `IT`, `Shipping & Receiving`)
- Filter labels updated to match SSRS report prompts: *Status*, *Departments*, *Status Date From*, *Status Date To*

### Changed
- Badge renamed from "SSRS Portal" to "⚡ Live Insight Engine"
- Hero eyebrow renamed from "Employee Intelligence" to "Real-Time Workforce Analytics"
- Quick card "Inactive / Terminated" renamed to "Inactive Employees"
- Info banner replaced with premium Pro Tips card grid
- Removed all references to internal database names and views
- Removed "AquaERP" branding from topbar and footer
