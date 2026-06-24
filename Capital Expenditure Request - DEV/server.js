/**
 * Capital Expenditure Request - Express API Server
 * Port: 5030
 * Database: AcquaAutomate on aquaerpdb SQL Server
 */

const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5030;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // large limit for base64 signatures
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config for file uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'req-' + req.params.id + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('File type not allowed.'));
  }
});

// SQL Server Configuration
const dbConfig = {
  server: 'aquaerpdb',
  database: 'AcquaAutomate',
  user: 'sa',
  password: 'house/fire',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Global SQL pool
let pool;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}

// ─────────────────────────────────────────────
// DB INIT: Create tables if not exist
// ─────────────────────────────────────────────
async function initDatabase() {
  const p = await getPool();

  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ExRequest_Requests' AND xtype='U')
    CREATE TABLE ExRequest_Requests (
      Id            INT IDENTITY(1,1) PRIMARY KEY,
      Vendor        NVARCHAR(255) NOT NULL,
      Description   NVARCHAR(MAX) NOT NULL,
      StartDate     DATE NOT NULL,
      EstimatedCost DECIMAL(18,2) NOT NULL,
      RequestedBy   NVARCHAR(255) NOT NULL,
      RequestorEmail NVARCHAR(255),
      DeptManagerName NVARCHAR(255),
      DeptManagerEmail NVARCHAR(255),
      Comments      NVARCHAR(MAX),
      ReqSignature  NVARCHAR(MAX),        -- base64 signature image
      Status        NVARCHAR(50) NOT NULL DEFAULT 'Pending Department',
      CreatedAt     DATETIME DEFAULT GETDATE(),
      UpdatedAt     DATETIME DEFAULT GETDATE()
    )
    ELSE BEGIN
      -- Add new columns if they don't exist
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'RequestorEmail' AND Object_ID = Object_ID(N'ExRequest_Requests'))
        ALTER TABLE ExRequest_Requests ADD RequestorEmail NVARCHAR(255);
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'DeptManagerName' AND Object_ID = Object_ID(N'ExRequest_Requests'))
        ALTER TABLE ExRequest_Requests ADD DeptManagerName NVARCHAR(255);
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'DeptManagerEmail' AND Object_ID = Object_ID(N'ExRequest_Requests'))
        ALTER TABLE ExRequest_Requests ADD DeptManagerEmail NVARCHAR(255);
    END
  `);

  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ExRequest_Approvals' AND xtype='U')
    CREATE TABLE ExRequest_Approvals (
      Id              INT IDENTITY(1,1) PRIMARY KEY,
      RequestId       INT NOT NULL REFERENCES ExRequest_Requests(Id),
      ApprovalType    NVARCHAR(50) NOT NULL,  -- 'Department', 'Financial', 'Presidential'
      ApproverName    NVARCHAR(255),
      Signature       NVARCHAR(MAX),          -- base64 signature image
      ApprovalDate    DATE,
      Status          NVARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Approved', 'Denied', 'Pending'
      Comments        NVARCHAR(MAX),
      CreatedAt       DATETIME DEFAULT GETDATE()
    )
  `);

  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ExRequest_Accounting' AND xtype='U')
    CREATE TABLE ExRequest_Accounting (
      Id              INT IDENTITY(1,1) PRIMARY KEY,
      RequestId       INT NOT NULL REFERENCES ExRequest_Requests(Id),
      BNumber         NVARCHAR(100),
      AccountCode     NVARCHAR(100),
      CostCenter      NVARCHAR(100),
      FiscalYear      NVARCHAR(20),
      Notes           NVARCHAR(MAX),
      EnteredBy       NVARCHAR(255),
      Class           NVARCHAR(255),
      PropertyType    NVARCHAR(255),
      FixedAssetAccount NVARCHAR(255),
      AccumulatedDepreciationAccount NVARCHAR(255),
      DepreciationExpenseAccount NVARCHAR(255),
      UseTax          BIT,
      EquipmentExempt BIT,
      Tooling         BIT,
      EnteredAt       DATETIME DEFAULT GETDATE()
    )
    ELSE BEGIN
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'Class' AND Object_ID = Object_ID(N'ExRequest_Accounting'))
        ALTER TABLE ExRequest_Accounting ADD Class NVARCHAR(255);
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'PropertyType' AND Object_ID = Object_ID(N'ExRequest_Accounting'))
        ALTER TABLE ExRequest_Accounting ADD PropertyType NVARCHAR(255);
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'FixedAssetAccount' AND Object_ID = Object_ID(N'ExRequest_Accounting'))
        ALTER TABLE ExRequest_Accounting ADD FixedAssetAccount NVARCHAR(255);
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'AccumulatedDepreciationAccount' AND Object_ID = Object_ID(N'ExRequest_Accounting'))
        ALTER TABLE ExRequest_Accounting ADD AccumulatedDepreciationAccount NVARCHAR(255);
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'DepreciationExpenseAccount' AND Object_ID = Object_ID(N'ExRequest_Accounting'))
        ALTER TABLE ExRequest_Accounting ADD DepreciationExpenseAccount NVARCHAR(255);
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'UseTax' AND Object_ID = Object_ID(N'ExRequest_Accounting'))
        ALTER TABLE ExRequest_Accounting ADD UseTax BIT;
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'EquipmentExempt' AND Object_ID = Object_ID(N'ExRequest_Accounting'))
        ALTER TABLE ExRequest_Accounting ADD EquipmentExempt BIT;
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'Tooling' AND Object_ID = Object_ID(N'ExRequest_Accounting'))
        ALTER TABLE ExRequest_Accounting ADD Tooling BIT;
    END
  `);

  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ExRequest_Settings' AND xtype='U')
    CREATE TABLE ExRequest_Settings (
      SettingKey    NVARCHAR(100) PRIMARY KEY,
      SettingValue  NVARCHAR(MAX)
    )
  `);

  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ExRequest_ActivityLogs' AND xtype='U')
    CREATE TABLE ExRequest_ActivityLogs (
      Id            INT IDENTITY(1,1) PRIMARY KEY,
      Action        NVARCHAR(255) NOT NULL,
      Details       NVARCHAR(MAX),
      CreatedAt     DATETIME DEFAULT GETDATE()
    )
  `);
  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ExRequest_Attachments' AND xtype='U')
    CREATE TABLE ExRequest_Attachments (
      Id              INT IDENTITY(1,1) PRIMARY KEY,
      RequestId       INT NOT NULL REFERENCES ExRequest_Requests(Id),
      OriginalName    NVARCHAR(500),
      StoredName      NVARCHAR(500),
      FileSize        INT,
      MimeType        NVARCHAR(100),
      UploadedAt      DATETIME DEFAULT GETDATE()
    )
  `);

  console.log('✅ Database tables verified/created.');
}

async function logActivity(action, details = '') {
  try {
    const p = await getPool();
    await p.request()
      .input('action', sql.NVarChar(255), action)
      .input('details', sql.NVarChar(sql.MAX), details)
      .query('INSERT INTO ExRequest_ActivityLogs (Action, Details) VALUES (@action, @details)');
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

// ─────────────────────────────────────────────
// EMAIL LOGIC
// ─────────────────────────────────────────────
async function getSettings() {
  const p = await getPool();
  const result = await p.request().query('SELECT * FROM ExRequest_Settings');
  const settings = {};
  result.recordset.forEach(row => {
    settings[row.SettingKey] = row.SettingValue;
  });
  return settings;
}

async function sendEmail(to, subject, html) {
  if (!to) return;
  try {
    const settings = await getSettings();
    if (!settings.smtpHost) return console.log('Email skipped: SMTP Host not configured.');

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort || 25,
      secure: settings.smtpSecure === 'true',
      auth: settings.smtpUser ? {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      } : undefined,
      tls: { rejectUnauthorized: false }
    });

    await transporter.sendMail({
      from: settings.fromEmail || '"CapEx System" <noreply@example.com>',
      to,
      subject,
      html
    });
    console.log(`✉️ Email sent to ${to}`);
  } catch (err) {
    console.error('⚠️ Failed to send email to', to, err.message);
  }
}

// ─────────────────────────────────────────────
// ROUTES: Requests
// ─────────────────────────────────────────────

// GET all requests (with approval status joined)
app.get('/api/requests', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query(`
      SELECT 
        r.*,
        dept.Status  AS DeptStatus,
        dept.Signature AS DeptSignature,
        dept.ApprovalDate AS DeptApprovalDate,
        dept.Comments AS DeptComments,
        dept.ApproverName AS DeptApproverName,
        fin.Status   AS FinStatus,
        fin.Signature AS FinSignature,
        fin.ApprovalDate AS FinApprovalDate,
        fin.Comments AS FinComments,
        fin.ApproverName AS FinApproverName,
        pres.Status  AS PresStatus,
        pres.Signature AS PresSignature,
        pres.ApprovalDate AS PresApprovalDate,
        pres.Comments AS PresComments,
        pres.ApproverName AS PresApproverName,
        acc.BNumber, acc.AccountCode, acc.CostCenter, acc.FiscalYear, acc.Notes AS AccNotes, acc.EnteredBy,
        acc.Class, acc.PropertyType, acc.FixedAssetAccount, acc.AccumulatedDepreciationAccount, acc.DepreciationExpenseAccount, acc.UseTax, acc.EquipmentExempt, acc.Tooling
      FROM ExRequest_Requests r
      LEFT JOIN ExRequest_Approvals dept  ON dept.RequestId  = r.Id AND dept.ApprovalType  = 'Department'
      LEFT JOIN ExRequest_Approvals fin   ON fin.RequestId   = r.Id AND fin.ApprovalType   = 'Financial'
      LEFT JOIN ExRequest_Approvals pres  ON pres.RequestId  = r.Id AND pres.ApprovalType  = 'Presidential'
      LEFT JOIN ExRequest_Accounting acc  ON acc.RequestId   = r.Id
      ORDER BY r.CreatedAt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET single request
app.get('/api/requests/:id', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT 
          r.*,
          dept.Status  AS DeptStatus,
          dept.Signature AS DeptSignature,
          dept.ApprovalDate AS DeptApprovalDate,
          dept.Comments AS DeptComments,
          dept.ApproverName AS DeptApproverName,
          fin.Status   AS FinStatus,
          fin.Signature AS FinSignature,
          fin.ApprovalDate AS FinApprovalDate,
          fin.Comments AS FinComments,
          fin.ApproverName AS FinApproverName,
          pres.Status  AS PresStatus,
          pres.Signature AS PresSignature,
          pres.ApprovalDate AS PresApprovalDate,
          pres.Comments AS PresComments,
          pres.ApproverName AS PresApproverName,
          acc.BNumber, acc.AccountCode, acc.CostCenter, acc.FiscalYear, acc.Notes AS AccNotes, acc.EnteredBy,
          acc.Class, acc.PropertyType, acc.FixedAssetAccount, acc.AccumulatedDepreciationAccount, acc.DepreciationExpenseAccount, acc.UseTax, acc.EquipmentExempt, acc.Tooling
        FROM ExRequest_Requests r
        LEFT JOIN ExRequest_Approvals dept  ON dept.RequestId  = r.Id AND dept.ApprovalType  = 'Department'
        LEFT JOIN ExRequest_Approvals fin   ON fin.RequestId   = r.Id AND fin.ApprovalType   = 'Financial'
        LEFT JOIN ExRequest_Approvals pres  ON pres.RequestId  = r.Id AND pres.ApprovalType  = 'Presidential'
        LEFT JOIN ExRequest_Accounting acc  ON acc.RequestId   = r.Id
        WHERE r.Id = @id
      `);
    if (result.recordset.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST create new request
app.post('/api/requests', async (req, res) => {
  try {
    const { vendor, description, startDate, estimatedCost, requestedBy, requestorEmail, deptManagerName, deptManagerEmail, comments, signature } = req.body;
    if (!vendor || !description || !startDate || !estimatedCost || !requestedBy || !signature || !requestorEmail || !deptManagerName || !deptManagerEmail) {
      return res.status(400).json({ error: 'All required fields must be provided including signature and emails.' });
    }
    const p = await getPool();
    const result = await p.request()
      .input('vendor', sql.NVarChar(255), vendor)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('startDate', sql.Date, startDate)
      .input('estimatedCost', sql.Decimal(18, 2), estimatedCost)
      .input('requestedBy', sql.NVarChar(255), requestedBy)
      .input('requestorEmail', sql.NVarChar(255), requestorEmail)
      .input('deptManagerName', sql.NVarChar(255), deptManagerName)
      .input('deptManagerEmail', sql.NVarChar(255), deptManagerEmail)
      .input('comments', sql.NVarChar(sql.MAX), comments || '')
      .input('signature', sql.NVarChar(sql.MAX), signature)
      .query(`
        INSERT INTO ExRequest_Requests (Vendor, Description, StartDate, EstimatedCost, RequestedBy, RequestorEmail, DeptManagerName, DeptManagerEmail, Comments, ReqSignature, Status)
        OUTPUT INSERTED.Id
        VALUES (@vendor, @description, @startDate, @estimatedCost, @requestedBy, @requestorEmail, @deptManagerName, @deptManagerEmail, @comments, @signature, 'Pending Department')
      `);
    const newId = result.recordset[0].Id;
    
    // Send email to department manager
    const hostUrl = req.protocol + '://' + req.get('host');
    await sendEmail(
      deptManagerEmail,
      `Action Required: New CapEx Request #${newId}`,
      `<p>Hello ${deptManagerName},</p>
       <p>A new Capital Expenditure Request has been submitted by ${requestedBy} and is pending your approval.</p>
       <p><strong>Vendor:</strong> ${vendor}<br/>
       <strong>Cost:</strong> $${estimatedCost}</p>
       <p><a href="${hostUrl}/#department?id=${newId}">Click here to review and approve</a></p>`
    );

    await logActivity('Request Created', `Request #${newId} created by ${requestedBy} for vendor ${vendor}.`);

    res.json({ id: newId, message: 'Request submitted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update request fields (for requestor edits while still pending)
app.put('/api/requests/:id', async (req, res) => {
  try {
    const { vendor, description, startDate, estimatedCost, requestedBy, requestorEmail, deptManagerName, deptManagerEmail, comments, signature } = req.body;
    const p = await getPool();
    // Check current status
    const check = await p.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT Status FROM ExRequest_Requests WHERE Id = @id`);
    if (check.recordset.length === 0) return res.status(404).json({ error: 'Not found' });
    const status = check.recordset[0].Status;
    if (status !== 'Pending Department') {
      return res.status(403).json({ error: 'Request can only be edited while pending department approval.' });
    }
    await p.request()
      .input('id', sql.Int, req.params.id)
      .input('vendor', sql.NVarChar(255), vendor)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('startDate', sql.Date, startDate)
      .input('estimatedCost', sql.Decimal(18, 2), estimatedCost)
      .input('requestedBy', sql.NVarChar(255), requestedBy)
      .input('requestorEmail', sql.NVarChar(255), requestorEmail)
      .input('deptManagerName', sql.NVarChar(255), deptManagerName)
      .input('deptManagerEmail', sql.NVarChar(255), deptManagerEmail)
      .input('comments', sql.NVarChar(sql.MAX), comments || '')
      .input('signature', sql.NVarChar(sql.MAX), signature || '')
      .query(`
        UPDATE ExRequest_Requests SET
          Vendor=@vendor, Description=@description, StartDate=@startDate,
          EstimatedCost=@estimatedCost, RequestedBy=@requestedBy,
          RequestorEmail=@requestorEmail, DeptManagerName=@deptManagerName, DeptManagerEmail=@deptManagerEmail,
          Comments=@comments, ReqSignature=@signature, UpdatedAt=GETDATE()
        WHERE Id=@id
      `);
    
    await logActivity('Request Updated', `Request #${req.params.id} updated by ${requestedBy}.`);
    res.json({ message: 'Request updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE single request
app.delete('/api/requests/:id', async (req, res) => {
  try {
    const { code, fullName } = req.body;
    const settings = await getSettings();
    const expectedCode = settings.appPasscode || '1969';
    if (code !== expectedCode) {
      return res.status(403).json({ error: 'Invalid deletion code.' });
    }
    
    const p = await getPool();
    // Verify the Full Name matches (case-insensitive)
    const check = await p.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT RequestedBy FROM ExRequest_Requests WHERE Id = @id`);
    
    if (check.recordset.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    if (check.recordset[0].RequestedBy.toLowerCase() !== (fullName || '').toLowerCase()) {
      return res.status(403).json({ error: 'Full Name does not match the requestor.' });
    }

    // Delete child records first to avoid foreign key constraints
    await p.request().input('rid', sql.Int, req.params.id).query('DELETE FROM ExRequest_Accounting WHERE RequestId = @rid');
    await p.request().input('rid', sql.Int, req.params.id).query('DELETE FROM ExRequest_Approvals WHERE RequestId = @rid');
    
    // Delete main record
    await p.request().input('rid', sql.Int, req.params.id).query('DELETE FROM ExRequest_Requests WHERE Id = @rid');
    
    await logActivity('Request Deleted', `Request #${req.params.id} was deleted by ${fullName}.`);
    res.json({ message: 'Request deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// ROUTES: Approvals
// ─────────────────────────────────────────────

// POST approve/deny
app.post('/api/requests/:id/approve', async (req, res) => {
  try {
    const { approvalType, approverName, signature, approvalDate, status, comments } = req.body;
    // status: 'Approved' or 'Denied'
    const p = await getPool();

    // Upsert approval record
    const existing = await p.request()
      .input('rid', sql.Int, req.params.id)
      .input('type', sql.NVarChar(50), approvalType)
      .query(`SELECT Id FROM ExRequest_Approvals WHERE RequestId=@rid AND ApprovalType=@type`);

    if (existing.recordset.length > 0) {
      await p.request()
        .input('rid', sql.Int, req.params.id)
        .input('type', sql.NVarChar(50), approvalType)
        .input('name', sql.NVarChar(255), approverName)
        .input('sig', sql.NVarChar(sql.MAX), signature || '')
        .input('date', sql.Date, approvalDate)
        .input('stat', sql.NVarChar(50), status)
        .input('comments', sql.NVarChar(sql.MAX), comments || '')
        .query(`
          UPDATE ExRequest_Approvals SET
            ApproverName=@name, Signature=@sig, ApprovalDate=@date,
            Status=@stat, Comments=@comments
          WHERE RequestId=@rid AND ApprovalType=@type
        `);
    } else {
      await p.request()
        .input('rid', sql.Int, req.params.id)
        .input('type', sql.NVarChar(50), approvalType)
        .input('name', sql.NVarChar(255), approverName)
        .input('sig', sql.NVarChar(sql.MAX), signature || '')
        .input('date', sql.Date, approvalDate)
        .input('stat', sql.NVarChar(50), status)
        .input('comments', sql.NVarChar(sql.MAX), comments || '')
        .query(`
          INSERT INTO ExRequest_Approvals (RequestId, ApprovalType, ApproverName, Signature, ApprovalDate, Status, Comments)
          VALUES (@rid, @type, @name, @sig, @date, @stat, @comments)
        `);
    }

    // Fetch request details for emails
    const reqResult = await p.request()
      .input('rid', sql.Int, req.params.id)
      .query(`SELECT EstimatedCost, RequestorEmail, RequestedBy, Vendor FROM ExRequest_Requests WHERE Id=@rid`);
    const reqData = reqResult.recordset[0];
    const cost = reqData ? parseFloat(reqData.EstimatedCost) : 0;
    const requestorEmail = reqData ? reqData.RequestorEmail : null;
    
    const settings = await getSettings();
    const hostUrl = req.protocol + '://' + req.get('host');

    // Update main request status based on approval flow
    let newStatus = 'Pending Department';
    if (approvalType === 'Department') {
      if (status === 'Denied') {
        newStatus = 'Denied';
      } else {
        newStatus = 'Pending Financial';
        // Email Accounting/Financial if approved by Dept
        await sendEmail(
          settings.accountingEmail,
          `Action Required: CapEx Request #${req.params.id} Pending Financial Approval`,
          `<p>A Capital Expenditure Request for ${reqData.Vendor} ($${cost}) has been approved by the department and is awaiting your financial review/accounting details.</p>
           <p><a href="${hostUrl}/#financial?id=${req.params.id}">Click here to review</a></p>`
        );
      }
      
      // Email requestor about department decision
      await sendEmail(
        requestorEmail,
        `Update on CapEx Request #${req.params.id}`,
        `<p>Hello ${reqData.RequestedBy},</p>
         <p>Your request for ${reqData.Vendor} has been <strong>${status}</strong> by the Department Manager.</p>`
      );

    } else if (approvalType === 'Financial') {
      if (status === 'Denied') {
        newStatus = 'Denied';
        // Email requestor
        await sendEmail(
          requestorEmail,
          `Update on CapEx Request #${req.params.id}`,
          `<p>Hello ${reqData.RequestedBy},</p><p>Your request for ${reqData.Vendor} has been <strong>Denied</strong> by Financial.</p>`
        );
      } else {
        if (cost > 25000) {
          newStatus = 'Pending Presidential';
          // Email CEO/Presidential
          await sendEmail(
            settings.presidentialEmail,
            `Action Required: CapEx Request #${req.params.id} Pending Presidential Approval`,
            `<p>A Capital Expenditure Request for ${reqData.Vendor} ($${cost}) has passed financial review and requires Presidential approval.</p>
             <p><a href="${hostUrl}/#presidential?id=${req.params.id}">Click here to review</a></p>`
          );
        } else {
          newStatus = 'Approved';
          // Email requestor that it's fully approved
          await sendEmail(
            requestorEmail,
            `CapEx Request #${req.params.id} Approved`,
            `<p>Hello ${reqData.RequestedBy},</p><p>Your request for ${reqData.Vendor} has been fully <strong>Approved</strong>.</p>`
          );
        }
      }
    } else if (approvalType === 'Presidential') {
      newStatus = status === 'Denied' ? 'Denied' : 'Approved';
      // Email requestor
      await sendEmail(
        requestorEmail,
        `Update on CapEx Request #${req.params.id}`,
        `<p>Hello ${reqData.RequestedBy},</p><p>Your request for ${reqData.Vendor} has been <strong>${status}</strong> by the President/CEO.</p>`
      );
    }

    await p.request()
      .input('rid', sql.Int, req.params.id)
      .input('stat', sql.NVarChar(50), newStatus)
      .query(`UPDATE ExRequest_Requests SET Status=@stat, UpdatedAt=GETDATE() WHERE Id=@rid`);

    await logActivity('Approval Action', `Request #${req.params.id} - ${approvalType} marked as ${status} by ${approverName}.`);

    res.json({ message: `${approvalType} approval recorded. Status: ${newStatus}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// ROUTES: Settings (Admin)
// ─────────────────────────────────────────────
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST verify access code
app.post('/api/verify-code', async (req, res) => {
  try {
    const { code } = req.body;
    const settings = await getSettings();
    const expectedCode = settings.appPasscode || '1969';
    res.json({ valid: code === expectedCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query('SELECT TOP 100 * FROM ExRequest_ActivityLogs ORDER BY CreatedAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const settings = req.body;
    const p = await getPool();
    for (const [key, value] of Object.entries(settings)) {
      const existing = await p.request().input('k', sql.NVarChar(100), key).query('SELECT 1 FROM ExRequest_Settings WHERE SettingKey=@k');
      if (existing.recordset.length > 0) {
        await p.request()
          .input('k', sql.NVarChar(100), key)
          .input('v', sql.NVarChar(sql.MAX), value || '')
          .query('UPDATE ExRequest_Settings SET SettingValue=@v WHERE SettingKey=@k');
      } else {
        await p.request()
          .input('k', sql.NVarChar(100), key)
          .input('v', sql.NVarChar(sql.MAX), value || '')
          .query('INSERT INTO ExRequest_Settings (SettingKey, SettingValue) VALUES (@k, @v)');
      }
    }
    await logActivity('Settings Updated', 'System settings were updated by an administrator.');
    res.json({ message: 'Settings saved successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// ROUTES: Accounting Details
// ─────────────────────────────────────────────

app.post('/api/requests/:id/accounting', async (req, res) => {
  try {
    const { bNumber, accountCode, costCenter, fiscalYear, notes, enteredBy, accClass, propertyType, fixedAssetAccount, accumulatedDepreciationAccount, depreciationExpenseAccount, useTax, equipmentExempt, tooling } = req.body;
    const p = await getPool();
    const existing = await p.request()
      .input('rid', sql.Int, req.params.id)
      .query(`SELECT Id FROM ExRequest_Accounting WHERE RequestId=@rid`);

    let request = p.request()
      .input('rid', sql.Int, req.params.id)
      .input('b', sql.NVarChar(100), bNumber || '')
      .input('ac', sql.NVarChar(100), accountCode || '')
      .input('cc', sql.NVarChar(100), costCenter || '')
      .input('fy', sql.NVarChar(20), fiscalYear || '')
      .input('notes', sql.NVarChar(sql.MAX), notes || '')
      .input('by', sql.NVarChar(255), enteredBy || '')
      .input('cls', sql.NVarChar(255), accClass || '')
      .input('pt', sql.NVarChar(255), propertyType || '')
      .input('faa', sql.NVarChar(255), fixedAssetAccount || '')
      .input('ada', sql.NVarChar(255), accumulatedDepreciationAccount || '')
      .input('dea', sql.NVarChar(255), depreciationExpenseAccount || '')
      .input('ut', sql.Bit, useTax ? 1 : 0)
      .input('ee', sql.Bit, equipmentExempt ? 1 : 0)
      .input('tl', sql.Bit, tooling ? 1 : 0);

    if (existing.recordset.length > 0) {
      await request.query(`
          UPDATE ExRequest_Accounting SET
            BNumber=@b, AccountCode=@ac, CostCenter=@cc, FiscalYear=@fy,
            Notes=@notes, EnteredBy=@by,
            Class=@cls, PropertyType=@pt, FixedAssetAccount=@faa,
            AccumulatedDepreciationAccount=@ada, DepreciationExpenseAccount=@dea,
            UseTax=@ut, EquipmentExempt=@ee, Tooling=@tl, EnteredAt=GETDATE()
          WHERE RequestId=@rid
        `);
    } else {
      await request.query(`
          INSERT INTO ExRequest_Accounting (RequestId, BNumber, AccountCode, CostCenter, FiscalYear, Notes, EnteredBy, Class, PropertyType, FixedAssetAccount, AccumulatedDepreciationAccount, DepreciationExpenseAccount, UseTax, EquipmentExempt, Tooling)
          VALUES (@rid, @b, @ac, @cc, @fy, @notes, @by, @cls, @pt, @faa, @ada, @dea, @ut, @ee, @tl)
        `);
    }
    await logActivity('Accounting Added', `Accounting details for Request #${req.params.id} were updated by ${enteredBy}.`);
    res.json({ message: 'Accounting details saved.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// ROUTES: Attachments
// ─────────────────────────────────────────────

// Upload files for a request
app.post('/api/requests/:id/attachments', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided.' });
    const p = await getPool();
    await p.request()
      .input('requestId', sql.Int, req.params.id)
      .input('originalName', sql.NVarChar(500), req.file.originalname)
      .input('storedName', sql.NVarChar(500), req.file.filename)
      .input('fileSize', sql.Int, req.file.size)
      .input('mimeType', sql.NVarChar(100), req.file.mimetype)
      .query(`INSERT INTO ExRequest_Attachments (RequestId, OriginalName, StoredName, FileSize, MimeType)
              VALUES (@requestId, @originalName, @storedName, @fileSize, @mimeType)`);
    await logActivity('File Uploaded', `File "${req.file.originalname}" uploaded for Request #${req.params.id}`);
    res.json({ message: 'File uploaded.', filename: req.file.filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// List attachments for a request
app.get('/api/requests/:id/attachments', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request()
      .input('requestId', sql.Int, req.params.id)
      .query('SELECT * FROM ExRequest_Attachments WHERE RequestId = @requestId ORDER BY UploadedAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Download a specific attachment
app.get('/api/attachments/:id/download', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM ExRequest_Attachments WHERE Id = @id');
    if (result.recordset.length === 0) return res.status(404).json({ error: 'File not found.' });
    const file = result.recordset[0];
    const filePath = path.join(uploadsDir, file.StoredName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk.' });
    res.download(filePath, file.OriginalName);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// SPA Fallback
// ─────────────────────────────────────────────
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
// Always start listening first so the frontend is served,
// then attempt DB connection/init in the background.
app.listen(PORT, () => {
  console.log(`\n🚀 Capital Expenditure Request App running at http://localhost:${PORT}\n`);
  // Try to connect to the database after the HTTP server is up
  initDatabase()
    .then(() => console.log('✅ Database connected and ready.'))
    .catch(err => {
      console.error('⚠️  Database connection failed:', err.message);
      console.error('   The frontend will still be served. Fix the DB connection and restart.');
    });
});
