# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
