# Aqua Intranet Admin Portal

This is a Node.js backend with a web-based frontend to manage the `indexdev.html` (or other production HTML files) for the Aqua Intranet.
It uses SQLite to store user accounts, roles, and settings. It parses and injects HTML directly into the target file using Cheerio.

## Features
- **Admin & Editor Roles**: Granular access control. Admin can add users, change settings, and edit all areas. Editors can only edit the specific areas assigned to them.
- **Dynamic File Targeting**: The admin portal reads and modifies the static HTML file. You can change which file is modified in the **Settings** tab (e.g. `../index_dev.html` or `../index.html`).
- **Raw HTML Editing**: Editors can safely replace the HTML contents of the `Quick Access`, `Directory`, and `Company Resources` sections without having to manually modify the massive HTML file.

## How to Install and Run

Due to Windows UNC path restrictions with NPM, you should map the network drive to a letter (e.g. `Z:`) before running `npm install`, or copy this folder locally, install dependencies, and copy it back.

1. **Open PowerShell or CMD** and navigate to this folder.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Start the Server**:
   ```bash
   npm start
   ```
   Or run it using Node directly: `node server.js`
4. **Access the Portal**:
   Open a web browser and go to `http://localhost:5025`
   
## Default Credentials
- **Username**: admin
- **Password**: admin123

*Please change the admin password or create a new admin account and delete the default one.*
