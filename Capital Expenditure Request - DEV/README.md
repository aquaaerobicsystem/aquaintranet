# Capital Expenditure Request - README

## How to Start the Application

Open a **Command Prompt** or **PowerShell** window in this folder and run:

```
node server.js
```

Or:

```
npm start
```

The app will be available at: **http://localhost:5030**

---

## Project Structure

```
Capital Expenditure Request - DEV/
├── server.js          ← Node.js/Express API server (port 5030)
├── package.json       ← Project dependencies
├── node_modules/      ← Installed packages
└── public/
    ├── index.html     ← Main HTML (single-page app)
    ├── style.css      ← Dark theme stylesheet
    └── app.js         ← Frontend JavaScript
```

---

## Database

- **SQL Server:** aquaerpdb
- **Database:** AcquaAutomate
- **Tables created automatically on first run:**
  - `ExRequest_Requests` — Main request data
  - `ExRequest_Approvals` — Approval signatures & dates
  - `ExRequest_Accounting` — Accounting details (B#, account code, etc.)

---

## Application Pages

| Page | URL | Role |
|------|-----|------|
| Home | `http://localhost:5030/#home` | View all requests & stats |
| Request | `http://localhost:5030/#requestor` | Submit / edit requests |
| Department | `http://localhost:5030/#department` | Department approval |
| Financial | `http://localhost:5030/#financial` | Financial approval + accounting |
| Presidential | `http://localhost:5030/#presidential` | Presidential approval (>$25k) |

---

## Process Flow

1. **Requestor** fills in the form (Vendor, Description, Cost, Date, Name, Signature) → submits
2. **Department** reviews → Approves with signature & date (or Denies)
3. **Financial** reviews → Enters accounting details (B#, account code, etc.) → Approves
4. If **Estimated Cost > $25,000** → **Presidential** approval required
5. Once fully approved → Print Form button available

---

## Notes

- Signatures are captured via draw pad (touch/mouse supported)
- The "Requested By" signature is **mandatory** to submit
- Approvals require a typed name + drawn signature + date
- Requests can only be edited while in **"Pending Department"** status
- Print form generates a formatted report with all signatures
