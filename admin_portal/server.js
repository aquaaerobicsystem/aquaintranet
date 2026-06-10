const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const multer = require('multer');

// ── Multer setup for issue attachments ────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, Date.now() + '_' + safe);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB per file
    fileFilter: (req, file, cb) => {
        const allowed = /\.(pdf|docx|doc|png|jpg|jpeg|gif|webp|bmp)$/i;
        if (allowed.test(path.extname(file.originalname))) cb(null, true);
        else cb(new Error('Only PDF, DOCX, DOC, and image files are allowed'));
    }
});
// ──────────────────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 5025;

app.use(cors());
app.use(bodyParser.json({limit: '10mb'}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'aqua-intranet-secret-key',
    resave: false,
    saveUninitialized: true,
}));

const dbFile = path.join(__dirname, 'admin.db');
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, role TEXT, areas TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS tracker_users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, links_tested TEXT, search_tested TEXT, layout_reviewed TEXT, status TEXT, notes TEXT, admin_note TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS tracker_issues (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, reported_by TEXT, category TEXT, description TEXT, status TEXT, admin_note TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS tracker_attachments (id INTEGER PRIMARY KEY AUTOINCREMENT, issue_id INTEGER, filename TEXT, originalname TEXT, uploaded_at TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS tracker_comments (id INTEGER PRIMARY KEY AUTOINCREMENT, parent_id INTEGER DEFAULT NULL, name TEXT, comment TEXT, date TEXT)`);
    // Add admin_note columns to existing tables if they don't exist
    db.run(`ALTER TABLE tracker_users ADD COLUMN admin_note TEXT DEFAULT ''`, () => {});
    db.run(`ALTER TABLE tracker_issues ADD COLUMN admin_note TEXT DEFAULT ''`, () => {});
    db.get(`SELECT id FROM users WHERE username = 'admin'`, (err, row) => {
        if (!row) {
            const hash = bcrypt.hashSync('admin123', 8);
            db.run(`INSERT INTO users (username, password, role, areas) VALUES (?, ?, ?, ?)`, ['admin', hash, 'admin', '["Quick Access", "Directory", "Company Resources"]']);
        }
    });
    db.get(`SELECT value FROM settings WHERE key = 'target_file'`, (err, row) => {
        if (!row) db.run(`INSERT INTO settings (key, value) VALUES ('target_file', '../indexdev.html')`);
    });
});

function requireAuth(req, res, next) {
    if (req.session && req.session.userId) next();
    else res.status(401).json({ error: 'Unauthorized' });
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.role === 'admin') next();
    else res.status(403).json({ error: 'Forbidden' });
}

// -----------------------------------------------------------------------------
// TRACKER API
// -----------------------------------------------------------------------------
app.get('/api/tracker/comments', (req, res) => {
    db.all(`SELECT * FROM tracker_comments ORDER BY id ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // Build threaded structure: top-level comments with nested replies
        const topLevel = (rows || []).filter(r => !r.parent_id);
        const withReplies = topLevel.map(c => ({
            ...c,
            replies: (rows || []).filter(r => r.parent_id === c.id)
        }));
        res.json(withReplies);
    });
});

app.post('/api/tracker/comment', (req, res) => {
    const { code, name, comment, parent_id } = req.body;
    if (code !== '1969') return res.status(403).json({ error: 'Invalid code' });
    if (!name || !comment) return res.status(400).json({ error: 'Name and comment required' });
    const date = new Date().toLocaleString();
    db.run(`INSERT INTO tracker_comments (parent_id, name, comment, date) VALUES (?, ?, ?, ?)`,
        [parent_id || null, name, comment, date],
        function(err) { res.json({ success: true, id: this.lastID }); });
});

app.delete('/api/tracker/comment/:id', requireAdmin, (req, res) => {
    db.run(`DELETE FROM tracker_comments WHERE id = ? OR parent_id = ?`,
        [req.params.id, req.params.id], () => res.json({ success: true }));
});
// -----------------------------------------------------------------------------
app.get('/api/tracker', (req, res) => {
    db.all(`SELECT * FROM tracker_users`, [], (err, users) => {
        db.all(`SELECT * FROM tracker_issues`, [], (err2, issues) => {
            db.all(`SELECT * FROM tracker_attachments`, [], (err3, attachments) => {
                const issuesWithAttachments = (issues || []).map(issue => ({
                    ...issue,
                    attachments: (attachments || []).filter(a => a.issue_id === issue.id)
                }));
                res.json({ users: users || [], issues: issuesWithAttachments });
            });
        });
    });
});

app.post('/api/tracker/user', (req, res) => {
    const { code, name, links_tested, search_tested, layout_reviewed, notes } = req.body;
    if (code !== '1969') return res.status(403).json({ error: 'Invalid code' });
    if (!name) return res.status(400).json({ error: 'Name is required' });
    
    const status = (links_tested && search_tested && layout_reviewed) ? 'Completed' : 'Pending';
    const l = links_tested ? '✅ Completed' : '❌ Pending';
    const s = search_tested ? '✅ Completed' : '❌ Pending';
    const r = layout_reviewed ? '✅ Completed' : '❌ Pending';

    db.get(`SELECT id FROM tracker_users WHERE name = ?`, [name], (err, row) => {
        if (row) {
            db.run(`UPDATE tracker_users SET links_tested=?, search_tested=?, layout_reviewed=?, status=?, notes=? WHERE name=?`,
                [l, s, r, status, notes || '', name], () => res.json({ success: true }));
        } else {
            db.run(`INSERT INTO tracker_users (name, links_tested, search_tested, layout_reviewed, status, notes) VALUES (?, ?, ?, ?, ?, ?)`, 
                [name, l, s, r, status, notes || ''], () => res.json({ success: true }));
        }
    });
});

app.post('/api/tracker/issue', (req, res) => {
    const { code, reported_by, category, description } = req.body;
    if (code !== '1969') return res.status(403).json({ error: 'Invalid code' });
    if (!reported_by || !description) return res.status(400).json({ error: 'Name and description required' });
    
    const date = new Date().toLocaleDateString();
    db.run(`INSERT INTO tracker_issues (date, reported_by, category, description, status) VALUES (?, ?, ?, ?, ?)`, 
      [date, reported_by, category || 'General', description, 'Open'], function(err) {
        res.json({ success: true, id: this.lastID });
    });
});

app.post('/api/tracker/issue/:id/resolve', requireAdmin, (req, res) => {
    db.run(`UPDATE tracker_issues SET status = 'Resolved' WHERE id = ?`, [req.params.id], () => res.json({ success: true }));
});

app.put('/api/tracker/user/:id', (req, res) => {
    const { code, links_tested, search_tested, layout_reviewed, notes } = req.body;
    if (code !== '1969') return res.status(403).json({ error: 'Invalid code' });
    const status = (links_tested && search_tested && layout_reviewed) ? 'Completed' : 'Pending';
    const l = links_tested ? '✅ Completed' : '❌ Pending';
    const s = search_tested ? '✅ Completed' : '❌ Pending';
    const r = layout_reviewed ? '✅ Completed' : '❌ Pending';
    db.run(`UPDATE tracker_users SET links_tested=?, search_tested=?, layout_reviewed=?, status=?, notes=? WHERE id=?`,
        [l, s, r, status, notes || '', req.params.id], () => res.json({ success: true }));
});

app.delete('/api/tracker/user/:id', (req, res) => {
    const { code } = req.body;
    if (code !== '1969') return res.status(403).json({ error: 'Invalid code' });
    db.run(`DELETE FROM tracker_users WHERE id = ?`, [req.params.id], () => res.json({ success: true }));
});

app.put('/api/tracker/issue/:id', (req, res) => {
    const { code, category, description, status } = req.body;
    if (code !== '1969') return res.status(403).json({ error: 'Invalid code' });
    db.run(`UPDATE tracker_issues SET category=?, description=?, status=? WHERE id=?`,
        [category, description, status || 'Open', req.params.id], () => res.json({ success: true }));
});

app.delete('/api/tracker/issue/:id', (req, res) => {
    const { code } = req.body;
    if (code !== '1969') return res.status(403).json({ error: 'Invalid code' });
    db.run(`DELETE FROM tracker_issues WHERE id = ?`, [req.params.id], () => res.json({ success: true }));
});

// Upload attachments to an issue (code 1969 or admin session)
app.post('/api/tracker/issue/:id/upload', upload.array('files', 10), (req, res) => {
    const code = req.body.code;
    const isAdminSession = req.session && req.session.role === 'admin';
    if (!isAdminSession && code !== '1969') return res.status(403).json({ error: 'Invalid code' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
    const issueId = req.params.id;
    const uploadedAt = new Date().toLocaleDateString();
    const stmt = db.prepare(`INSERT INTO tracker_attachments (issue_id, filename, originalname, uploaded_at) VALUES (?, ?, ?, ?)`);
    req.files.forEach(f => stmt.run(issueId, f.filename, f.originalname, uploadedAt));
    stmt.finalize(() => res.json({ success: true, count: req.files.length }));
});

// Delete a single attachment (code 1969 or admin)
app.delete('/api/tracker/attachment/:id', (req, res) => {
    const code = req.body.code;
    const isAdminSession = req.session && req.session.role === 'admin';
    if (!isAdminSession && code !== '1969') return res.status(403).json({ error: 'Invalid code' });
    db.get(`SELECT filename FROM tracker_attachments WHERE id = ?`, [req.params.id], (err, row) => {
        if (!row) return res.status(404).json({ error: 'Not found' });
        const filePath = path.join(uploadsDir, row.filename);
        fs.unlink(filePath, () => {}); // delete file from disk
        db.run(`DELETE FROM tracker_attachments WHERE id = ?`, [req.params.id], () => res.json({ success: true }));
    });
});

// Admin-only tracker edits (session-based, no code needed)
app.put('/api/admin/tracker/user/:id', requireAdmin, (req, res) => {
    const { links_tested, search_tested, layout_reviewed, notes, admin_note, status } = req.body;
    const l = links_tested !== undefined ? (links_tested ? '✅ Completed' : '❌ Pending') : null;
    const s = search_tested !== undefined ? (search_tested ? '✅ Completed' : '❌ Pending') : null;
    const r = layout_reviewed !== undefined ? (layout_reviewed ? '✅ Completed' : '❌ Pending') : null;
    const computedStatus = (links_tested && search_tested && layout_reviewed) ? 'Completed' : (status || 'Pending');
    db.get(`SELECT * FROM tracker_users WHERE id = ?`, [req.params.id], (err, row) => {
        if (!row) return res.status(404).json({ error: 'Not found' });
        db.run(`UPDATE tracker_users SET links_tested=?, search_tested=?, layout_reviewed=?, status=?, notes=?, admin_note=? WHERE id=?`,
            [l || row.links_tested, s || row.search_tested, r || row.layout_reviewed,
             computedStatus, notes !== undefined ? notes : row.notes,
             admin_note !== undefined ? admin_note : (row.admin_note || ''), req.params.id],
            () => res.json({ success: true }));
    });
});

app.put('/api/admin/tracker/issue/:id', requireAdmin, (req, res) => {
    const { category, description, status, admin_note } = req.body;
    db.get(`SELECT * FROM tracker_issues WHERE id = ?`, [req.params.id], (err, row) => {
        if (!row) return res.status(404).json({ error: 'Not found' });
        db.run(`UPDATE tracker_issues SET category=?, description=?, status=?, admin_note=? WHERE id=?`,
            [category || row.category, description || row.description,
             status || row.status, admin_note !== undefined ? admin_note : (row.admin_note || ''), req.params.id],
            () => res.json({ success: true }));
    });
});
// -----------------------------------------------------------------------------



function getTargetFilePath(callback) {
    db.get(`SELECT value FROM settings WHERE key = 'target_file'`, (err, row) => {
        if (err || !row) return callback(err || new Error("Target file setting not found"));
        callback(null, path.join(__dirname, row.value));
    });
}

// Auth API
const loginAttempts = {};


app.get('/api/me', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ loggedIn: true, username: req.session.username, role: req.session.role, areas: req.session.areas || [] });
    } else {
        res.json({ loggedIn: false });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    if (!loginAttempts[ip]) loginAttempts[ip] = { count: 0, lockUntil: 0 };
    if (loginAttempts[ip].lockUntil > Date.now()) {
        const remaining = Math.ceil((loginAttempts[ip].lockUntil - Date.now()) / 60000);
        return res.status(429).json({ error: `Too many failed attempts. Try again in ${remaining} minutes.` });
    }

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (!user || !bcrypt.compareSync(password, user.password)) {
            loginAttempts[ip].count++;
            if (loginAttempts[ip].count >= 3) {
                loginAttempts[ip].lockUntil = Date.now() + 10 * 60 * 1000; // 10 minutes
            }
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Reset on success
        loginAttempts[ip].count = 0;
        loginAttempts[ip].lockUntil = 0;

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        req.session.areas = JSON.parse(user.areas || '[]');
        res.json({ message: 'Logged in', user: { username: user.username, role: user.role, areas: req.session.areas } });
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out' });
});

app.get('/api/session', (req, res) => {
    if (req.session.userId) res.json({ user: { username: req.session.username, role: req.session.role, areas: req.session.areas } });
    else res.status(401).json({ error: 'Not logged in' });
});

// Settings & Users
app.get('/api/settings', requireAuth, (req, res) => {
    db.get(`SELECT value FROM settings WHERE key = 'target_file'`, (err, row) => res.json({ target_file: row ? row.value : '' }));
});
app.post('/api/settings', requireAdmin, (req, res) => {
    db.run(`UPDATE settings SET value = ? WHERE key = 'target_file'`, [req.body.target_file], (err) => res.json({ message: 'Settings updated' }));
});

// GET users
app.get('/api/users', requireAdmin, (req, res) => {
    db.all("SELECT username, role, areas FROM users", (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows.map(r => {
            let areas = [];
            try { areas = JSON.parse(r.areas || '[]'); } catch(e){}
            return {...r, areas};
        }));
    });
});

// POST user
app.post('/api/users', requireAdmin, async (req, res) => {
    const { username, password, role, areas } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        db.run("INSERT INTO users (username, password, role, areas) VALUES (?, ?, ?, ?)",
            [username, hash, role, JSON.stringify(areas)],
            (err) => {
                if (err) return res.status(500).json({ error: 'User creation failed' });
                res.json({ success: true });
            }
        );
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE user
app.delete('/api/users/:username', requireAdmin, (req, res) => {
    const { username } = req.params;
    if (username === 'admin') return res.status(400).json({error: "Cannot delete the default admin user"});
    db.run("DELETE FROM users WHERE username = ?", [username], (err) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({success: true});
    });
});

// PUT user (edit)
app.put('/api/users/:username', requireAdmin, async (req, res) => {
    const { username } = req.params;
    const { newUsername, password, role, areas } = req.body;
    let updateQ = "UPDATE users SET role = ?, areas = ?, username = ? WHERE username = ?";
    let params = [role, JSON.stringify(areas), newUsername || username, username];
    
    if (password) {
        const hash = await bcrypt.hash(password, 10);
        updateQ = "UPDATE users SET role = ?, areas = ?, username = ?, password = ? WHERE username = ?";
        params = [role, JSON.stringify(areas), newUsername || username, hash, username];
    }
    
    db.run(updateQ, params, (err) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({success: true});
    });
});

// PUT my password (for normal users)
app.put('/api/users/me/password', requireAuth, async (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({error: "Password required"});
    const hash = await bcrypt.hash(password, 10);
    db.run("UPDATE users SET password = ? WHERE username = ?", [hash, req.session.username], (err) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({success: true});
    });
});

// --------------------------------------------------------------------------------
// JSON GUI BUILDER ENDPOINTS
// --------------------------------------------------------------------------------
app.get('/api/areas/:name/json', requireAuth, (req, res) => {
    const areaName = req.params.name;
    getTargetFilePath((err, filePath) => {
        if (err || !fs.existsSync(filePath)) return res.status(404).json({ error: 'Target file not found' });
        
        const $ = cheerio.load(fs.readFileSync(filePath, 'utf8'));
        const type = areaName === 'Directory' ? 'nested' : (areaName === 'Quick Search' ? 'chips' : 'flat');
        const result = { type, items: [] };

        if (type === 'flat') {
            const container = $(`h2:contains("${areaName}")`).parent().next('.quick-links');
            container.find('.quick-link').each((i, el) => {
                result.items.push({
                    url: $(el).attr('href') || '',
                    title: $(el).attr('title') || '',
                    svg: $(el).find('.quick-link-icon').html()?.trim() || '',
                    name: $(el).find('.quick-link-name').text().trim(),
                    desc: $(el).find('.quick-link-desc').text().trim()
                });
            });
        } else if (type === 'chips') {
            const container = $('.search-chips');
            container.find('.chip').each((i, el) => {
                const clone = $(el).clone();
                clone.find('svg').remove();
                
                const rawOnClick = $(el).attr('onclick') || '';
                let actionType = 'window';
                let actionUrl = '';
                let searchArgs = ['', '', ''];

                if (rawOnClick.includes('openAquaSearch')) {
                    actionType = 'search';
                    const match = rawOnClick.match(/openAquaSearch\((.*?)\)/);
                    if (match) {
                        const args = match[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
                        searchArgs[0] = args[0] || '';
                        searchArgs[1] = args[1] || '';
                        searchArgs[2] = args[2] || '';
                    }
                } else if (rawOnClick.includes('window.open')) {
                    const match = rawOnClick.match(/window\.open\(['"](.*?)['"]/);
                    if (match) actionUrl = match[1];
                } else {
                    actionUrl = rawOnClick;
                }

                result.items.push({
                    actionType: actionType,
                    url: actionUrl,
                    query: searchArgs[0],
                    source: searchArgs[1],
                    ext: searchArgs[2],
                    title: $(el).attr('title') || '',
                    svg: $(el).find('svg').prop('outerHTML') || '',
                    name: clone.text().trim(),
                    desc: ''
                });
            });
        } else {
            const container = $(`h2:contains("Directory")`).parent().next('.cat-grid');
            container.find('.cat-card').each((i, card) => {
                const cat = {
                    id: $(card).attr('id') || `cat-${i}`,
                    title: $(card).find('summary .cat-title').text().trim(),
                    iconSvg: $(card).find('summary .cat-icon').html()?.trim() || '',
                    desc: $(card).find('.cat-body > .cat-desc').text().trim(),
                    modals: []
                };
                $(card).find('.cat-body > details').each((j, mod) => {
                    const sum = $(mod).find('summary').clone();
                    sum.find('svg').remove();
                    const modal = {
                        title: sum.text().trim(),
                        desc: $(mod).find('.sub-body p, .modal-body p').first().text().trim(),
                        links: []
                    };
                    $(mod).find('.sub-body a, .modal-body a').each((k, a) => {
                        modal.links.push({
                            url: $(a).attr('href') || $(a).attr('onclick') || '',
                            title: $(a).attr('title') || '',
                            text: $(a).text().trim()
                        });
                    });
                    cat.modals.push(modal);
                });
                
                // Parse loose links directly in cat-body
                const looseLinks = [];
                $(card).find('.cat-body > a').each((k, a) => {
                    looseLinks.push({
                        url: $(a).attr('href') || $(a).attr('onclick') || '',
                        title: $(a).attr('title') || '',
                        text: $(a).text().trim()
                    });
                });
                if (looseLinks.length > 0) {
                    cat.modals.push({
                        title: 'General Links',
                        desc: '',
                        links: looseLinks
                    });
                }
                
                result.items.push(cat);
            });
        }
        res.json(result);
    });
});

app.post('/api/areas/:name/json', requireAuth, (req, res) => {
    const areaName = req.params.name;
    const { type, items } = req.body;
    
    if (req.session.role !== 'admin' && !req.session.areas.includes(areaName)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    getTargetFilePath((err, filePath) => {
        if (err || !fs.existsSync(filePath)) return res.status(404).json({ error: 'Target file not found' });
        
        const html = fs.readFileSync(filePath, 'utf8');
        const $ = cheerio.load(html);
        
        if (type === 'flat') {
            const container = $(`h2:contains("${areaName}")`).parent().next('.quick-links');
            container.empty();
            items.forEach(l => {
                const svg = l.svg || '<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>';
                container.append(`
      <a class="quick-link" href="${l.url}" target="_blank" title="${l.title}">
        <span class="quick-link-icon">${svg}</span>
        <span class="quick-link-text">
          <span class="quick-link-name">${l.name}</span>
          <span class="quick-link-desc">${l.desc}</span>
        </span>
      </a>`);
            });
        } else if (type === 'chips') {
            const container = $('.search-chips');
            container.empty();
            items.forEach(l => {
                const svg = l.svg || '<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>';
                let action = '';
                if (l.actionType === 'search') {
                    const args = [];
                    if (l.query) args.push(`'${l.query}'`); else args.push("''");
                    if (l.source) args.push(`'${l.source}'`); else if(l.ext) args.push("''");
                    if (l.ext) args.push(`'${l.ext}'`);
                    action = `openAquaSearch(${args.join(', ')})`;
                } else {
                    let u = l.url || '';
                    if (!u.includes('window.open') && u.startsWith('http')) {
                        action = `window.open('${u}', '_blank')`;
                    } else if (!u.includes('window.open') && u) {
                        action = `window.open('${u}', '_blank')`;
                    } else {
                        action = u;
                    }
                }
                container.append(`
        <button class="chip" onclick="${action.replace(/"/g, '&quot;')}" title="${(l.title||'').replace(/"/g, '&quot;')}">
          ${svg}
          ${l.name}
        </button>`);
            });
        } else {
            const container = $(`h2:contains("Directory")`).parent().next('.cat-grid');
            container.empty();
            items.forEach(cat => {
                const svg = cat.iconSvg || '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
                let modalsHtml = '';
                cat.modals.forEach(mod => {
                    let linksHtml = '';
                    mod.links.forEach(l => {
                        let action = l.url;
                        let attr = '';
                        if (action.startsWith('http')) {
                            attr = `href="${action}" target="_blank"`;
                        } else if (action.includes('(')) {
                            attr = `onclick="${action.replace(/"/g, '&quot;')}"`;
                        } else {
                            attr = `href="${action}"`;
                        }
                        linksHtml += `<a ${attr} class="search-section-btn" title="${l.title.replace(/"/g, '&quot;')}">${l.text}</a>`;
                    });
                    modalsHtml += `
          <details class="sub">
            <summary title="Expand/Collapse ${mod.title}">${mod.title}<svg class="sub-arrow" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6" /></svg></summary>
            <div class="sub-body">
              ${mod.desc ? `<p>${mod.desc}</p>` : ''}
              ${linksHtml}
            </div>
          </details>`;
                });
                
                container.append(`
      <details class="cat-card" id="${cat.id}">
        <summary title="Expand/Collapse ${cat.title}">
          <span class="cat-icon">${svg}</span>
          <span class="cat-title">${cat.title}</span>
          <svg class="cat-arrow" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </summary>
        <div class="cat-body">
          <p class="cat-desc">${cat.desc}</p>
          ${modalsHtml}
        </div>
      </details>`);
            });
        }
        
        fs.writeFileSync(filePath, $.html());
        res.json({ message: 'Area updated successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Admin portal running on http://localhost:${PORT}`);
});
