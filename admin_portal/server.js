const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

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

function getTargetFilePath(callback) {
    db.get(`SELECT value FROM settings WHERE key = 'target_file'`, (err, row) => {
        if (err || !row) return callback(err || new Error("Target file setting not found"));
        callback(null, path.join(__dirname, row.value));
    });
}

// Auth API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user || !bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: 'Invalid credentials' });
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
                    svg: $(el).find('svg').parent().html()?.trim() || $(el).find('svg').prop('outerHTML') || '',
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
