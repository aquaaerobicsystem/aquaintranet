# Capital Expenditure Request — Test Cases

**Application URL:** http://www.aqua-aerobic.net:5030/  
**Date:** June 24, 2026  
**Version:** 1.1.0

---

## Access Model Summary

| Role | Access Method | Capabilities |
|------|--------------|-------------|
| All Employees | Visit app URL directly | Create new requests (no login) |
| Department Managers | Email link only | Approve/Deny requests assigned to them |
| President/CEO | Email link only | Approve/Deny requests > $25,000 |
| Accounting | Login with Aqua UserID + passcode | Full access: Dashboard, Financial, Admin, Delete |

---

## TC-01: Home Page & Navigation

### TC-01.1 — Home Page Loads
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open http://www.aqua-aerobic.net:5030/ in a browser | Home page loads with "Capital Expenditure Request" heading |
| 2 | Verify the "+ Create New Request" button is visible | Button is displayed and clickable |
| 3 | Verify the navigation bar shows: Home, Dashboard, Request, Department, Financial, Presidential, Admin, How To | All 8 nav links are visible on one line |

### TC-01.2 — Logo Click Navigation
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to any page (e.g., Request) | Page changes |
| 2 | Click the Aqua-Aerobic logo in the nav bar | Returns to Home page without full page reload |

### TC-01.3 — How To Page (No Auth Required)
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "How To" in the navigation bar | How To page loads without asking for authentication |
| 2 | Verify Quick Navigation grid is visible and sticky | 8 quick nav cards shown; they stick below nav bar when scrolling |
| 3 | Click each Quick Navigation card | Page smooth-scrolls to the correct section |
| 4 | Verify "Who Can Do What" section shows 3 role cards | All Employees, Managers & President, Accounting Only cards visible |
| 5 | Click FAQ questions | Accordion opens/closes with smooth animation |

---

## TC-02: Submit a New Request

### TC-02.1 — Successful Submission
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "+ Create New Request" on Home page | Request form loads |
| 2 | Fill in **Vendor**: "Test Vendor Inc." | Field accepts input |
| 3 | Fill in **Estimated Start Date**: select a future date | Date picker works |
| 4 | Fill in **Description**: "Testing capital expenditure system" | Text area accepts input |
| 5 | Fill in **Estimated Cost**: "5000" | Field accepts numeric input |
| 6 | Fill in **Your Full Name**: "John Tester" | Field accepts input |
| 7 | Fill in **Your Email (Aqua User ID)**: "jtester" | Field shows @aqua-aerobic.com suffix |
| 8 | Fill in **Department Manager Name**: "Jane Manager" | Field accepts input |
| 9 | Fill in **Department Manager Email**: "jmanager@aqua-aerobic.com" | Field accepts input |
| 10 | Click "✍️ Generate Signature" | Digital signature is rendered in the signature box |
| 11 | Click "📤 Submit Request" | Success toast appears with "Request submitted successfully" |
| 12 | Verify page redirects to Home | Home page is displayed |

### TC-02.2 — Submission with File Attachments
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Fill out the request form (all required fields) | Form is ready |
| 2 | Click the file upload area or drag a PDF file onto it | File appears in the attachment list with name and size |
| 3 | Upload a .docx file | File is added to the list |
| 4 | Upload a .xlsx file | File is added to the list |
| 5 | Click the "✕" button on one attachment | File is removed from the list |
| 6 | Submit the request | Request is created with remaining attachments |

### TC-02.3 — Submission with Cost > $25,000
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Fill out the request form with **Estimated Cost**: "30000" | Form accepts input |
| 2 | Submit the request | Request is created; will require Presidential approval after Financial |

### TC-02.4 — Validation Errors
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Leave all fields blank and click "📤 Submit Request" | Error toast: required fields must be provided |
| 2 | Fill all fields but skip the signature | Error toast: signature is required |
| 3 | Try uploading a .exe file | Error: "File type not allowed" |
| 4 | Try uploading a file > 10MB | Error: file too large |

---

## TC-03: Edit a Pending Request

### TC-03.1 — Edit While Pending Department
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Submit a new request | Request is in "Pending Department" status |
| 2 | Navigate to the Request page | The new request appears with an "✏ Edit" button |
| 3 | Click "✏ Edit" | Form loads with all previously entered data pre-filled |
| 4 | Change the **Vendor** to "Updated Vendor" | Field updates |
| 5 | Click "💾 Save Changes" | Success toast: "Request updated" |
| 6 | Verify the updated Vendor name appears in the request list | Shows "Updated Vendor" |

### TC-03.2 — Cannot Edit After Approval
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Find a request that has been approved by Department | Status is "Pending Financial" or later |
| 2 | Verify no "✏ Edit" button appears for this request | Edit button is not displayed |

---

## TC-04: Department Approval (Email Link Only)

### TC-04.1 — Approve via Email Link
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Submit a new request with a valid Department Manager email | Email is sent to the manager |
| 2 | Open the email sent to the Department Manager | Email contains request details and a clickable link |
| 3 | Click the link in the email (e.g., `http://.../#department?id=XX`) | App opens directly to the request details for that ID |
| 4 | Review the request details | Vendor, cost, description, requestor signature are all displayed |
| 5 | Click "✓ Approve Request" | Approval modal opens |
| 6 | Enter approver name: "Jane Manager" | Field accepts input |
| 7 | Click "✍️ Generate Signature" | Signature is rendered |
| 8 | Verify the date field is populated | Today's date is shown |
| 9 | Click "Confirm" | Success toast: approval recorded; status changes to "Pending Financial" |
| 10 | Verify an email is sent to the Accounting email | Email notification with link to Financial review |

### TC-04.2 — Deny via Email Link
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open a pending department request via the email link | Request details load |
| 2 | Click "✗ Deny Request" | Deny modal opens |
| 3 | Enter approver name and leave reason blank | Error: reason is mandatory |
| 4 | Enter a denial reason: "Budget not available" | Field accepts input |
| 5 | Click "Confirm" | Success toast; status changes to "Denied" |
| 6 | Verify an email is sent to the requestor about the denial | Requestor receives denial notification |

---

## TC-05: Financial Approval (Accounting Login Required)

### TC-05.1 — Login & Access Financial Page
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Financial" in the navigation bar | Authentication modal appears |
| 2 | Enter an invalid UserID/passcode | Error: "Invalid code" |
| 3 | Enter a valid Aqua UserID and system passcode | Financial page loads with pending requests |
| 4 | Verify only department-approved requests appear | Requests in "Pending Financial" status are shown |

### TC-05.2 — Enter Accounting Details & Approve
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Review" on a pending financial request | Request details and Accounting Details form appear |
| 2 | Fill in **B Number**: "B12345" | Field accepts input |
| 3 | Fill in **Fixed Asset Account**: "1500" | Field accepts input |
| 4 | Fill in **Property Type**: "Equipment" | Field accepts input |
| 5 | Fill in **Fiscal Year**: "FY2026" | Field accepts input |
| 6 | Fill in **Entered By**: "Accounting User" | Field accepts input |
| 7 | Fill in **Class**: "Machinery" | Field accepts input |
| 8 | Fill in **Accum. Depreciation Account**: "1501" | Field accepts input |
| 9 | Fill in **Depreciation Expense Account**: "6001" | Field accepts input |
| 10 | Toggle checkboxes: UseTax, Equipment Exempt, Tooling | Checkboxes toggle correctly |
| 11 | Click "💾 Save Accounting Details" | Success toast: "Accounting details saved" |
| 12 | Click "✓ Approve Request" | Approval modal opens |
| 13 | Enter name, generate signature, confirm | Request is approved |

### TC-05.3 — Financial Approval (Cost ≤ $25,000)
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Approve a request with cost ≤ $25,000 | Status changes to "Approved" (fully approved) |
| 2 | Verify requestor receives "Approved" email | Email notification sent |

### TC-05.4 — Financial Approval (Cost > $25,000)
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Approve a request with cost > $25,000 | Status changes to "Pending Presidential" |
| 2 | Verify an email is sent to the Presidential email | Email with direct link to presidential review |

---

## TC-06: Presidential Approval (Email Link Only)

### TC-06.1 — Approve via Email Link
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open the email sent to the President/CEO | Email contains request details and a direct link |
| 2 | Click the link (e.g., `http://.../#presidential?id=XX`) | App opens directly to the request |
| 3 | Review all details including prior department and financial approvals | All information is displayed |
| 4 | Click "✓ Approve Request" | Approval modal opens |
| 5 | Enter name, generate signature, confirm | Status changes to "Approved" |
| 6 | Verify requestor receives final approval email | Email notification sent |

### TC-06.2 — Deny via Email Link
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open a pending presidential request via email link | Request details load |
| 2 | Click "✗ Deny Request" | Deny modal opens |
| 3 | Enter name and mandatory reason | Fields accept input |
| 4 | Click "Confirm" | Status changes to "Denied"; requestor emailed |

---

## TC-07: Dashboard (Accounting Only)

### TC-07.1 — Access Dashboard
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Dashboard" in the nav bar | Authentication modal appears |
| 2 | Log in with Aqua UserID and passcode | Dashboard loads |
| 3 | Verify statistics strip shows counts | Total, Pending Dept, Pending Financial, Pending Presidential, Approved, Denied counts |
| 4 | Verify all requests appear in the table | Table shows all requests with status badges |

### TC-07.2 — Dashboard Actions
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "View" on any request | Request details are displayed |
| 2 | Click "🖨 Print" on an approved request | Print preview modal opens |
| 3 | Click "🗑 Delete" on a request | Delete confirmation modal opens |

---

## TC-08: Print Form

### TC-08.1 — Print an Approved Request
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open the print preview for an approved request | Print modal opens with formatted form |
| 2 | Verify Page 1: Request Information table | Vendor, cost, dates, description, requestor signature displayed |
| 3 | Verify Page 1: Approval Signatures table | Department and Financial signatures shown |
| 4 | Verify Page 1: Footer shows **copyright only** (no page number) | "Copyright © 2026 Aqua-Aerobic Systems, Inc. — All Rights Reserved" at the bottom; no "Page X of Y" |
| 5 | If cost > $25K: Verify Presidential signature row appears | Presidential approval row shown |

### TC-08.2 — Print with Accounting Details (Page 2)
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Print a request that has accounting details entered | Page 2 appears with "Accounting Details" table |
| 2 | Verify all accounting fields are populated | B Number, Fixed Asset Account, etc. shown |
| 3 | Verify Page 2 footer shows copyright **and** page number | "Copyright © 2026..." on left, "Page 2 of 2" on right |
| 4 | Click "🖨️ Print" button in modal footer | Browser print dialog opens |

### TC-08.3 — Print / Save as PDF
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "🖨️ Print" in the print preview modal | Browser print dialog opens |
| 2 | Select "Save as PDF" as the destination | PDF preview shows the form |
| 3 | Verify Page 1 footer appears in PDF | Copyright text visible at the bottom of page 1 (no page number) |
| 4 | Verify Page 2 footer appears in PDF (if 2 pages) | Copyright + "Page 2 of 2" visible at the bottom of page 2 |
| 5 | Save the PDF and open it | PDF is formatted correctly with all data, signatures, and footers |
| 6 | Change destination to a physical printer | Print dialog shows printer options |
| 7 | Print to the printer | Printed output matches the preview with footers on both pages |

### TC-08.4 — Print Single-Page Request (No Accounting)
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Print a request with no accounting details | Only 1 page is shown, no page break |
| 2 | Verify footer shows copyright only (no page number) | Copyright text at the bottom; no "Page X of Y" |

---

## TC-09: Admin Settings (Accounting Only)

### TC-09.1 — Access Admin Page
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Admin" in the nav bar | Authentication modal appears |
| 2 | Log in with Aqua UserID and passcode | Admin page loads |

### TC-09.2 — Activity Logs
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Verify activity log table shows recent entries | Logs display with Date & Time, Action, Details columns |
| 2 | Verify timestamps show **correct local time** (not UTC) | Times match current timezone (CDT) |
| 3 | Click "↻ Refresh" button | Logs table refreshes with latest data |
| 4 | Perform an action (e.g., save settings) then refresh logs | New log entry appears at top |

### TC-09.3 — Email & System Settings
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Email & System Settings" header | Settings panel expands (toggle) |
| 2 | Update **Accounting Email** | Field accepts new email |
| 3 | Update **Presidential Email** | Field accepts new email |
| 4 | Update **App Passcode** | Field accepts new passcode |
| 5 | Update SMTP settings (Host, Port, User, Pass, TLS) | Fields accept input |
| 6 | Click "💾 Save Settings" | Success toast: "Settings saved" |
| 7 | Refresh the page and return to Admin | Saved values persist |

---

## TC-10: Delete Request (Accounting Only)

### TC-10.1 — Successful Deletion
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Log in to Dashboard as Accounting | Dashboard loads |
| 2 | Click "🗑 Delete" on a request | Delete modal opens |
| 3 | Enter **Full Name** matching the requestor name | Field accepts input |
| 4 | Enter the correct **system passcode** | Field accepts input |
| 5 | Click "Confirm Delete" | Success toast; request is removed from the list |
| 6 | Verify activity log records the deletion | Log entry: "Request Deleted" with details |

### TC-10.2 — Deletion Validation
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "🗑 Delete" on a request | Delete modal opens |
| 2 | Enter wrong Full Name | Error: "Full Name does not match the requestor" |
| 3 | Enter wrong passcode | Error: "Invalid deletion code" |

---

## TC-11: Email Notifications

### TC-11.1 — Email Flow Verification
| Step | Trigger | Expected Email Recipient | Expected Content |
|------|---------|------------------------|-----------------|
| 1 | New request submitted | Department Manager | Request details + review link (`#department?id=XX`) |
| 2 | Department approved | Accounting Email | Request details + review link (`#financial?id=XX`) |
| 3 | Department approved | Requestor | Status update: "Approved by Department" |
| 4 | Department denied | Requestor | Status update: "Denied" + reason |
| 5 | Financial approved (≤$25K) | Requestor | Status update: "Fully Approved" |
| 6 | Financial approved (>$25K) | Presidential Email | Request details + review link (`#presidential?id=XX`) |
| 7 | Financial denied | Requestor | Status update: "Denied by Financial" |
| 8 | Presidential approved | Requestor | Status update: "Approved by President" |
| 9 | Presidential denied | Requestor | Status update: "Denied by President" |

---

## TC-12: Authentication & Access Control

### TC-12.1 — Protected Pages Require Login
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Dashboard" without being logged in | Auth modal appears |
| 2 | Click "Financial" without being logged in | Auth modal appears |
| 3 | Click "Admin" without being logged in | Auth modal appears |

### TC-12.2 — Unprotected Pages
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Home" | Loads without auth |
| 2 | Click "Request" | Loads without auth |
| 3 | Click "How To" | Loads without auth |

### TC-12.3 — Email Link Access (No Global Login)
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open `http://.../#department?id=XX` directly | Loads the specific request without auth modal |
| 2 | Open `http://.../#presidential?id=XX` directly | Loads the specific request without auth modal |

### TC-12.4 — Session Timeout
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Log in to Dashboard | Dashboard loads |
| 2 | Wait 1 hour and try to navigate to a protected page | Auth modal reappears |

---

## TC-13: File Attachments

### TC-13.1 — View & Download Attachments
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open a request that has file attachments | Attachments section shows uploaded files |
| 2 | Click on a file name to download | Browser downloads the file |
| 3 | Verify file opens correctly | Downloaded file matches the original |

### TC-13.2 — Allowed File Types
| File Type | Expected Result |
|-----------|----------------|
| .pdf | ✅ Accepted |
| .doc | ✅ Accepted |
| .docx | ✅ Accepted |
| .xls | ✅ Accepted |
| .xlsx | ✅ Accepted |
| .exe | ❌ Rejected — "File type not allowed" |
| .jpg | ❌ Rejected — "File type not allowed" |
| .zip | ❌ Rejected — "File type not allowed" |

---

## TC-14: Edge Cases & Negative Testing

### TC-14.1 — Cost Boundary ($25,000)
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Submit request with cost = $25,000.00 | Does NOT require Presidential approval |
| 2 | Submit request with cost = $25,000.01 | DOES require Presidential approval |

### TC-14.2 — Special Characters
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Enter vendor name with special chars: `O'Reilly & Sons "Ltd"` | Saved and displayed correctly |
| 2 | Enter description with HTML: `<script>alert('xss')</script>` | Displayed as text, not executed |

### TC-14.3 — Concurrent Access
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open the same request in two browser tabs | Both tabs show the request |
| 2 | Approve in one tab, then try to approve in the other | Second tab gets an error or shows already-approved status |

### TC-14.4 — Invalid Request IDs
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `#department?id=99999` (non-existent ID) | Error message: "Not found" |
| 2 | Navigate to `#department?id=abc` (invalid ID) | Error handled gracefully |

---

## TC-15: Responsive Design

### TC-15.1 — Mobile View
| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open app on a mobile device or resize browser to < 768px | Layout adjusts to single column |
| 2 | Verify nav links show icons only (text hidden) | Navigation is compact |
| 3 | Verify form fields stack vertically | Forms are usable on mobile |
| 4 | Verify How To quick nav shows 2 columns | Grid adjusts from 4 to 2 columns |

---

## Sign-Off

| Role | Name | Date | Pass/Fail |
|------|------|------|-----------|
| Tester | | | |
| Developer | | | |
| Project Manager | | | |
