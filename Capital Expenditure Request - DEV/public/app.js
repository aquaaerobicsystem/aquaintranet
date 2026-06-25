/**
 * Capital Expenditure Request - Frontend Application
 * Connects to Express API at the same origin (port 5030)
 */

'use strict';

const API = ''; // same origin

// ══════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════
let allRequests = [];
let currentApprovalRequestId = null;
let currentApprovalType = null;
let currentDenyRequestId = null;
let currentDenyType = null;
let currentDeleteRequestId = null;
let reqFormMode = 'new'; // 'new' | 'edit'
let isAuthenticated = false;
let authTargetPage = null;

// Pagination state
const ROWS_PER_PAGE = 25;
let paginationState = {
  home: { page: 1, total: 0 },
  req: { page: 1, total: 0 },
  dept: { page: 1, total: 0 },
  fin: { page: 1, total: 0 },
  pres: { page: 1, total: 0 },
};

// ══════════════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════════════
function navigate(hashStr) {
  let page = hashStr;
  let targetId = null;
  if (hashStr.includes('?')) {
    const [p, q] = hashStr.split('?');
    page = p;
    const urlParams = new URLSearchParams(q);
    targetId = urlParams.get('id');
  }

  if (!isAuthenticated) {
    const authTime = localStorage.getItem('capex_auth_time');
    if (authTime && (Date.now() - parseInt(authTime)) < 3600000) { // 1 hour in ms
      isAuthenticated = true;
    }
  }

  if (page !== 'home' && page !== 'howto' && page !== 'requestor' && !targetId && !isAuthenticated) {
    authTargetPage = hashStr;
    document.getElementById('auth-name').value = '';
    document.getElementById('auth-code').value = '';
    openModal('auth-modal');
    return;
  }

  // Update hash
  if (window.location.hash !== '#' + hashStr) {
    history.pushState(null, '', '#' + hashStr);
  }

  // Hide all page views
  document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));
  // Update nav
  document.querySelectorAll('.nav-links a').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  // Show target
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  // Load page data
  switch (page) {
    case 'home':       loadHome();       break;
    case 'dashboard':  loadDashboard();  break;
    case 'requestor':  loadRequestor(targetId);  break;
    case 'department': loadDepartment(targetId); break;
    case 'financial':  loadFinancial(targetId);  break;
    case 'presidential': loadPresidential(targetId); break;
    case 'admin':      loadAdmin();      break;
    case 'howto':      break; // static page, no data to load
  }
}

function scrollToHowto(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    navigate(link.dataset.page);
  });
});

// ══════════════════════════════════════════════════════════════
// API HELPERS
// ══════════════════════════════════════════════════════════════
async function apiFetch(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...options.headers };
  if (method !== 'GET') headers['Content-Type'] = 'application/json';
  const res = await fetch(API + endpoint, {
    cache: 'no-store',
    ...options,
    headers,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function loadAllRequests() {
  allRequests = await apiFetch('/api/requests');
  return allRequests;
}

// ══════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ══════════════════════════════════════════════════════════════
function toast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✓', error: '✗', info: 'ℹ' };
  el.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ══════════════════════════════════════════════════════════════
// LOADING
// ══════════════════════════════════════════════════════════════
function showLoading() { document.getElementById('loading').classList.remove('hidden'); }
function hideLoading() { document.getElementById('loading').classList.add('hidden'); }

// ══════════════════════════════════════════════════════════════
// MODALS
// ══════════════════════════════════════════════════════════════
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Close modals on backdrop click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ══════════════════════════════════════════════════════════════
// SIGNATURE PAD
// ══════════════════════════════════════════════════════════════
class SignaturePad {
  constructor(containerId, canvasId) {
    this.container = document.getElementById(containerId);
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.hasSig = false;

    this._resize();
  }

  _resize() {
    const ratio = window.devicePixelRatio || 1;
    const w = this.container.clientWidth || 480;
    this.canvas.width = w * ratio;
    this.canvas.height = this.canvas.height || 100 * ratio;
    this.ctx.scale(ratio, ratio);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = (this.canvas.height / ratio) + 'px';
  }

  generate(name) {
    this.clear();
    if (!name) return;
    
    this.container.style.display = 'block';
    const ratio = window.devicePixelRatio || 1;
    const w = this.canvas.width / ratio;
    const h = this.canvas.height / ratio;

    // Fill white background so the exported PNG is visible on any background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, w, h);

    // Draw signature text in dark navy blue
    this.ctx.font = 'italic 600 52px "Caveat", "Brush Script MT", "Segoe Script", cursive';
    this.ctx.fillStyle = '#003366';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(name, w / 2, h / 2);
    
    this.hasSig = true;
    this.container.classList.add('has-sig');
  }

  clear() {
    const ratio = window.devicePixelRatio || 1;
    this.ctx.clearRect(0, 0, this.canvas.width / ratio, this.canvas.height / ratio);
    this.hasSig = false;
    this.container.classList.remove('has-sig');
    this.container.style.display = 'none';
  }

  getDataURL() {
    return this.hasSig ? this.canvas.toDataURL('image/png') : null;
  }

  isEmpty() { return !this.hasSig; }

  setFromDataURL(dataUrl) {
    if (!dataUrl) return;
    this.container.style.display = 'block';
    const img = new Image();
    img.onload = () => {
      const ratio = window.devicePixelRatio || 1;
      this.ctx.drawImage(img, 0, 0, this.canvas.width / ratio, this.canvas.height / ratio);
      this.hasSig = true;
      this.container.classList.add('has-sig');
    };
    img.src = dataUrl;
  }
}

// Create signature pads
let reqSigPad;
let approvalSigPad;

function initSigPads() {
  reqSigPad = new SignaturePad('req-sig-container', 'req-sig-canvas');
  approvalSigPad = new SignaturePad('approval-sig-container', 'approval-sig-canvas');

  document.getElementById('req-btn-generate-sig').addEventListener('click', () => {
    const name = document.getElementById('req-name').value.trim();
    if (!name) { toast('Please enter your Full Name first.', 'error'); return; }
    reqSigPad.generate(name);
    document.getElementById('req-sig-clear').style.display = 'inline-block';
    document.getElementById('req-btn-generate-sig').style.display = 'none';
  });

  document.getElementById('approval-btn-generate-sig').addEventListener('click', () => {
    const name = document.getElementById('approver-name').value.trim();
    if (!name) { toast('Please enter your Approver Name first.', 'error'); return; }
    approvalSigPad.generate(name);
    document.getElementById('approval-sig-clear').style.display = 'inline-block';
    document.getElementById('approval-btn-generate-sig').style.display = 'none';
  });

  document.getElementById('req-sig-clear').addEventListener('click', () => {
    reqSigPad.clear();
    document.getElementById('req-sig-clear').style.display = 'none';
    document.getElementById('req-btn-generate-sig').style.display = 'inline-block';
  });

  document.getElementById('approval-sig-clear').addEventListener('click', () => {
    approvalSigPad.clear();
    document.getElementById('approval-sig-clear').style.display = 'none';
    document.getElementById('approval-btn-generate-sig').style.display = 'inline-block';
  });
}

// ══════════════════════════════════════════════════════════════
// UTILITY
// ══════════════════════════════════════════════════════════════
function fmt(val) { return val ?? '–'; }

function fmtCurrency(val) {
  if (val == null) return '–';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

function fmtDate(val) {
  if (!val) return '–';
  return new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtSmartDate(r) {
  if (r.UpdatedAt && r.UpdatedAt !== r.CreatedAt) {
    return `<span title="Updated: ${new Date(String(r.UpdatedAt).replace(/Z$/i, '')).toLocaleString()}">${fmtDate(r.UpdatedAt)}</span>`;
  }
  return `<span title="Created: ${new Date(String(r.CreatedAt).replace(/Z$/i, '')).toLocaleString()}">${fmtDate(r.CreatedAt)}</span>`;
}

function paginateRows(rows, stateKey) {
  const state = paginationState[stateKey];
  state.total = Math.ceil(rows.length / ROWS_PER_PAGE);
  if (state.page > state.total) state.page = state.total || 1;
  const start = (state.page - 1) * ROWS_PER_PAGE;
  return rows.slice(start, start + ROWS_PER_PAGE);
}

function renderPagination(containerId, stateKey, renderFn) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const state = paginationState[stateKey];
  if (state.total <= 1) { container.innerHTML = ''; return; }

  let html = '<div class="pagination">';
  html += `<button class="btn btn-ghost btn-sm" ${state.page <= 1 ? 'disabled' : ''} onclick="paginateTo('${stateKey}', ${state.page - 1}, '${renderFn.name}')">← Prev</button>`;
  html += `<span class="pagination-info">Page ${state.page} of ${state.total}</span>`;
  html += `<button class="btn btn-ghost btn-sm" ${state.page >= state.total ? 'disabled' : ''} onclick="paginateTo('${stateKey}', ${state.page + 1}, '${renderFn.name}')">Next →</button>`;
  html += '</div>';
  container.innerHTML = html;
}

function paginateTo(stateKey, page, renderFnName) {
  paginationState[stateKey].page = page;
  const fnMap = {
    renderDashboardTable, renderReqListTable, renderDeptTable, renderFinTable, renderPresTable
  };
  if (fnMap[renderFnName]) fnMap[renderFnName]();
}

function statusBadge(status) {
  const map = {
    'Pending Department': ['badge-pending', '⏳ Pending Dept.'],
    'Pending Financial':  ['badge-financial', '💰 Pending Fin.'],
    'Pending Presidential': ['badge-pres', '👑 Pending Pres.'],
    'Approved': ['badge-approved', '✓ Approved'],
    'Denied':   ['badge-denied', '✗ Denied'],
  };
  const [cls, label] = map[status] || ['badge-info', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function showAlert(containerId, msg, type = 'error') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}"><span>${type === 'error' ? '✗' : '✓'}</span><span>${msg}</span></div>`;
  setTimeout(() => { if (el) el.innerHTML = ''; }, 6000);
}

function clearAlert(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = '';
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// ══════════════════════════════════════════════════════════════
// DETAIL VIEW HTML
// ══════════════════════════════════════════════════════════════
function renderRequestDetail(r, showAccounting = true) {
  const costFlag = parseFloat(r.EstimatedCost) > 25000;
  return `
    <div class="grid-2 mb-3">
      <div>
        <div class="text-xs text-muted mb-1">VENDOR</div>
        <div class="font-semibold">${fmt(r.Vendor)}</div>
      </div>
      <div>
        <div class="text-xs text-muted mb-1">ESTIMATED COST</div>
        <div class="font-semibold ${costFlag ? 'text-warning' : ''}">
          ${fmtCurrency(r.EstimatedCost)} ${costFlag ? '<span class="badge badge-warning">⚠ Requires Presidential Approval</span>' : ''}
        </div>
      </div>
      <div>
        <div class="text-xs text-muted mb-1">REQUESTED BY</div>
        <div>${fmt(r.RequestedBy)} <br><span class="text-xs text-muted">${fmt(r.RequestorEmail)}</span></div>
      </div>
      <div>
        <div class="text-xs text-muted mb-1">DEPT. MANAGER</div>
        <div>${fmt(r.DeptManagerName)} <br><span class="text-xs text-muted">${fmt(r.DeptManagerEmail)}</span></div>
      </div>
      <div>
        <div class="text-xs text-muted mb-1">ESTIMATED START DATE</div>
        <div>${fmtDate(r.StartDate)}</div>
      </div>
    </div>
    <div class="mb-3">
      <div class="text-xs text-muted mb-1">DESCRIPTION</div>
      <div style="background:var(--bg-input);padding:0.75rem;border-radius:var(--radius-sm);font-size:0.9rem">${fmt(r.Description)}</div>
    </div>
    ${r.Comments ? `<div class="mb-3"><div class="text-xs text-muted mb-1">COMMENTS</div><div style="font-size:0.875rem">${r.Comments}</div></div>` : ''}
    ${r.ReqSignature ? `<div class="mb-3"><div class="text-xs text-muted mb-1">REQUESTOR SIGNATURE</div><img src="${r.ReqSignature}" style="max-height:70px;border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px;background:var(--bg-input)"></div>` : ''}

    <div class="mb-3" id="detail-attachments-${r.Id}"></div>

    <div style="border-top:1px solid var(--border);padding-top:1rem;margin-top:1rem">
      <h4 class="mb-2">Approval Status</h4>
      <div class="grid-3">
        ${approvalBlock('Department', r.DeptStatus, r.DeptApproverName, r.DeptApprovalDate, r.DeptSignature, r.DeptComments)}
        ${approvalBlock('Financial', r.FinStatus, r.FinApproverName, r.FinApprovalDate, r.FinSignature, r.FinComments)}
        ${approvalBlock('Presidential', r.PresStatus, r.PresApproverName, r.PresApprovalDate, r.PresSignature, r.PresComments)}
      </div>
    </div>

    ${showAccounting && (r.BNumber || r.FixedAssetAccount || r.FiscalYear) ? `
    <div style="border-top:1px solid var(--border);padding-top:1rem;margin-top:1rem">
      <h4 class="mb-2">📊 Accounting Details</h4>
      <div class="grid-3">
        <div><div class="text-xs text-muted mb-1">B NUMBER</div><div class="font-semibold">${fmt(r.BNumber)}</div></div>
        <div><div class="text-xs text-muted mb-1">FIXED ASSET ACCOUNT</div><div>${fmt(r.FixedAssetAccount)}</div></div>
        <div><div class="text-xs text-muted mb-1">PROPERTY TYPE</div><div>${fmt(r.PropertyType)}</div></div>
        <div><div class="text-xs text-muted mb-1">FISCAL YEAR</div><div>${fmt(r.FiscalYear)}</div></div>
        <div><div class="text-xs text-muted mb-1">ENTERED BY</div><div>${fmt(r.EnteredBy)}</div></div>
        <div><div class="text-xs text-muted mb-1">CLASS</div><div>${fmt(r.Class)}</div></div>
        <div><div class="text-xs text-muted mb-1">ACCUM. DEPR. ACCOUNT</div><div>${fmt(r.AccumulatedDepreciationAccount)}</div></div>
        <div><div class="text-xs text-muted mb-1">DEPR. EXPENSE ACCOUNT</div><div>${fmt(r.DepreciationExpenseAccount)}</div></div>
      </div>
      <div class="grid-3" style="margin-top:0.75rem">
        <div><div class="text-xs text-muted mb-1">USETAX</div><div>${r.UseTax ? '✓ Yes' : 'No'}</div></div>
        <div><div class="text-xs text-muted mb-1">EQUIPMENT EXEMPT</div><div>${r.EquipmentExempt ? '✓ Yes' : 'No'}</div></div>
        <div><div class="text-xs text-muted mb-1">TOOLING</div><div>${r.Tooling ? '✓ Yes' : 'No'}</div></div>
      </div>
      ${r.AccNotes ? `<div style="margin-top:0.75rem"><div class="text-xs text-muted mb-1">NOTES</div><div>${r.AccNotes}</div></div>` : ''}
    </div>` : ''}
  `;
}

async function loadAttachments(requestId) {
  const container = document.getElementById(`detail-attachments-${requestId}`);
  if (!container) return;
  try {
    const res = await fetch(`/api/requests/${requestId}/attachments`);
    const files = await res.json();
    if (!files.length) { container.innerHTML = ''; return; }
    const fileIcons = { '.pdf': '📄', '.doc': '📝', '.docx': '📝', '.xls': '📊', '.xlsx': '📊' };
    container.innerHTML = `
      <div class="text-xs text-muted mb-1">📎 ATTACHED DOCUMENTS</div>
      <div class="file-list">
        ${files.map(f => {
          const ext = '.' + f.OriginalName.split('.').pop().toLowerCase();
          const icon = fileIcons[ext] || '📎';
          const size = f.FileSize < 1024 * 1024
            ? (f.FileSize / 1024).toFixed(1) + ' KB'
            : (f.FileSize / (1024 * 1024)).toFixed(1) + ' MB';
          return `<div class="file-item">
            <div class="file-item-info">
              <span>${icon}</span>
              <span class="file-item-name">${f.OriginalName}</span>
              <span class="file-item-size">${size}</span>
            </div>
            <a href="/api/attachments/${f.Id}/download" class="btn btn-ghost btn-sm" style="font-size:0.75rem;padding:0.25rem 0.5rem;">⬇ Download</a>
          </div>`;
        }).join('')}
      </div>
    `;
  } catch (err) {
    console.error('Failed to load attachments:', err);
  }
}

function approvalBlock(type, status, approver, date, sig, comments) {
  const icons = { Department: '🏢', Financial: '💰', Presidential: '👑' };
  const cls = status === 'Approved' ? 'badge-approved' : status === 'Denied' ? 'badge-denied' : 'badge-info';
  const label = status || 'Not Yet Reviewed';
  return `
    <div style="background:var(--bg-input);border-radius:var(--radius-sm);padding:0.75rem">
      <div class="flex justify-between items-center mb-1">
        <span class="text-xs font-semibold">${icons[type]} ${type}</span>
        <span class="badge ${cls}">${label}</span>
      </div>
      ${approver ? `<div class="text-xs text-muted">By: ${approver}</div>` : ''}
      ${date ? `<div class="text-xs text-muted">${fmtDate(date)}</div>` : ''}
      ${sig ? `<img src="${sig}" style="max-height:45px;margin-top:4px;border-radius:4px;padding:4px;">` : ''}
      ${comments ? `<div class="text-xs text-muted mt-1">${comments}</div>` : ''}
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════════════════════
async function loadHome() {
  try {
    const stats = await apiFetch('/api/stats');
    document.getElementById('hp-total').textContent = stats.total || 0;
    const pending = (stats.pendingDept || 0) + (stats.pendingFin || 0) + (stats.pendingPres || 0);
    document.getElementById('hp-pending').textContent = pending;
    document.getElementById('hp-approved').textContent = stats.approved || 0;
    document.getElementById('hp-denied').textContent = stats.denied || 0;
  } catch (e) {
    // Stats are best-effort on Home; fail silently
    console.log('Could not load home stats:', e.message);
  }
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ══════════════════════════════════════════════════════════════
async function loadDashboard() {
  showLoading();
  try {
    await loadAllRequests();
    renderDashboardTable();
    updateStats();
  } catch (e) {
    toast('Failed to load requests: ' + e.message, 'error');
  } finally {
    hideLoading();
  }
}

function updateStats() {
  const counts = {
    total: allRequests.length,
    pendingDept: allRequests.filter(r => r.Status === 'Pending Department').length,
    pendingFin:  allRequests.filter(r => r.Status === 'Pending Financial').length,
    pendingPres: allRequests.filter(r => r.Status === 'Pending Presidential').length,
    approved:    allRequests.filter(r => r.Status === 'Approved').length,
    denied:      allRequests.filter(r => r.Status === 'Denied').length,
  };
  document.getElementById('stat-total').textContent = counts.total;
  document.getElementById('stat-pending-dept').textContent = counts.pendingDept;
  document.getElementById('stat-pending-fin').textContent = counts.pendingFin;
  document.getElementById('stat-pending-pres').textContent = counts.pendingPres;
  document.getElementById('stat-approved').textContent = counts.approved;
  document.getElementById('stat-denied').textContent = counts.denied;
}

function searchFilter(rows, searchId) {
  const el = document.getElementById(searchId);
  if (!el) return rows;
  const q = el.value.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(r =>
    String(r.Id).includes(q) ||
    (r.RequestedBy || '').toLowerCase().includes(q) ||
    (r.Vendor || '').toLowerCase().includes(q) ||
    (r.Description || '').toLowerCase().includes(q) ||
    (r.Status || '').toLowerCase().includes(q) ||
    String(r.EstimatedCost || '').includes(q)
  );
}

function renderDashboardTable() {
  const tbody = document.getElementById('home-tbody');
  if (!allRequests.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted" style="padding:2rem">No requests found. <a href="#" onclick="navigate(\'requestor\')">Create one!</a></td></tr>';
    document.getElementById('home-pagination').innerHTML = '';
    return;
  }
  const filtered = searchFilter(allRequests, 'search-home');
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted" style="padding:2rem">No matching requests.</td></tr>';
    document.getElementById('home-pagination').innerHTML = '';
    return;
  }
  const pageRows = paginateRows(filtered, 'home');
  tbody.innerHTML = pageRows.map(r => `
    <tr>
      <td class="font-semibold text-accent">#${r.Id}</td>
      <td>${fmtSmartDate(r)}</td>
      <td>${fmt(r.RequestedBy)}</td>
      <td>${fmt(r.Vendor)}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${fmt(r.Description)}</td>
      <td>${fmtCurrency(r.EstimatedCost)}</td>
      <td>${fmtDate(r.StartDate)}</td>
      <td>${statusBadge(r.Status)}</td>
      <td>
        <div class="flex gap-1">
          <button class="btn btn-ghost btn-sm" onclick="viewRequestDetail(${r.Id})">👁 View</button>
          ${r.Status === 'Approved' ? `<button class="btn btn-teal btn-sm" onclick="openPrintModal(${r.Id})">🖨 Print</button>` : ''}
          <button class="btn btn-danger btn-sm" onclick="openDeleteModal(${r.Id})">🗑 Remove</button>
        </div>
      </td>
    </tr>
  `).join('');
  renderPagination('home-pagination', 'home', renderDashboardTable);
}

document.getElementById('btn-refresh-home').addEventListener('click', async () => {
  const s = document.getElementById('search-home'); if (s) s.value = '';
  paginationState.home.page = 1;
  await loadDashboard();
  toast('Dashboard refreshed.', 'info');
});

// ══════════════════════════════════════════════════════════════
// REQUESTOR PAGE
// ══════════════════════════════════════════════════════════════
async function loadRequestor(targetId) {
  if (targetId) {
    // Direct link from email — load requests and try to find the specific one
    await loadAllRequests();
    const r = allRequests.find(x => x.Id === parseInt(targetId));
    if (r) {
      showReqList();
      viewReqDetail(parseInt(targetId));
    } else {
      // Request not found — likely removed or invalid ID
      toast('⚠️ Request #' + targetId + ' is no longer available. It may have been removed. Please contact the Accounting department if you have any questions.', 'error', 8000);
      navigate('home');
    }
    return;
  }
  showReqList();
  await loadReqList();
}

function showReqList() {
  document.getElementById('req-list-card').classList.remove('hidden');
  document.getElementById('req-form-card').classList.add('hidden');
  document.getElementById('req-detail-card').classList.add('hidden');
}

function showReqForm(mode = 'new', request = null) {
  reqFormMode = mode;
  document.getElementById('req-list-card').classList.add('hidden');
  document.getElementById('req-form-card').classList.remove('hidden');
  document.getElementById('req-detail-card').classList.add('hidden');

  clearAlert('req-form-alert');
  pendingFiles = [];
  renderFileList();
  document.getElementById('req-id').value = '';
  document.getElementById('req-form-title').textContent = 'New Capital Expenditure Request';
  document.getElementById('req-form').reset();
  if (reqSigPad) {
    reqSigPad.clear();
    document.getElementById('req-sig-clear').style.display = 'none';
    document.getElementById('req-btn-generate-sig').style.display = 'inline-block';
  }

  if (mode === 'edit' && request) {
    document.getElementById('req-id').value = request.Id;
    document.getElementById('req-form-title').textContent = `Edit Request #${request.Id}`;
    document.getElementById('req-vendor').value = request.Vendor || '';
    document.getElementById('req-start-date').value = request.StartDate ? request.StartDate.split('T')[0] : '';
    document.getElementById('req-description').value = request.Description || '';
    document.getElementById('req-cost').value = request.EstimatedCost || '';
    document.getElementById('req-name').value = request.RequestedBy || '';
    document.getElementById('req-email').value = (request.RequestorEmail || '').replace('@aqua-aerobic.com', '');
    document.getElementById('req-dept-manager').value = request.DeptManagerName || '';
    document.getElementById('req-dept-manager-email').value = (request.DeptManagerEmail || '').replace('@aqua-aerobic.com', '');
    document.getElementById('req-comments').value = request.Comments || '';
    if (request.ReqSignature && reqSigPad) {
      reqSigPad.setFromDataURL(request.ReqSignature);
      document.getElementById('req-sig-clear').style.display = 'inline-block';
      document.getElementById('req-btn-generate-sig').style.display = 'none';
    }
    updateCostHint();
  }
}

async function loadReqList() {
  showLoading();
  try {
    await loadAllRequests();
    renderReqListTable();
  } catch (e) {
    toast('Error loading requests: ' + e.message, 'error');
  } finally {
    hideLoading();
  }
}

function renderReqListTable() {
  const tbody = document.getElementById('req-list-tbody');
  if (!allRequests.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:2rem">No requests yet. Click "+ New Request" to get started.</td></tr>';
    document.getElementById('req-pagination').innerHTML = '';
    return;
  }
  const filtered = searchFilter(allRequests, 'search-req');
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:2rem">No matching requests.</td></tr>';
    document.getElementById('req-pagination').innerHTML = '';
    return;
  }
  const pageRows = paginateRows(filtered, 'req');
  tbody.innerHTML = pageRows.map(r => `
    <tr>
      <td class="font-semibold text-accent">#${r.Id}</td>
      <td>${fmtSmartDate(r)}</td>
      <td>${fmt(r.Vendor)}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${fmt(r.Description)}</td>
      <td>${fmtCurrency(r.EstimatedCost)}</td>
      <td>${fmtDate(r.StartDate)}</td>
      <td>${statusBadge(r.Status)}</td>
      <td>
        <div class="flex gap-1">
          ${r.Status === 'Pending Department' 
            ? `<button class="btn btn-ghost btn-sm" onclick="editRequest(${r.Id})">✏ Edit</button>` 
            : `<button class="btn btn-ghost btn-sm" onclick="viewReqDetail(${r.Id})">👁 View</button>`}
          ${r.Status === 'Approved' ? `<button class="btn btn-teal btn-sm" onclick="openPrintModal(${r.Id})">🖨 Print</button>` : ''}
          <button class="btn btn-danger btn-sm" onclick="openDeleteModal(${r.Id})">🗑 Remove</button>
        </div>
      </td>
    </tr>
  `).join('');
  renderPagination('req-pagination', 'req', renderReqListTable);
}

function editRequest(id) {
  const r = allRequests.find(x => x.Id === id);
  if (!r) return;
  showReqForm('edit', r);
}

function viewReqDetail(id) {
  const r = allRequests.find(x => x.Id === id);
  if (!r) return;
  document.getElementById('req-list-card').classList.add('hidden');
  document.getElementById('req-form-card').classList.add('hidden');
  document.getElementById('req-detail-card').classList.remove('hidden');
  document.getElementById('req-detail-title').textContent = `Request #${r.Id} - ${r.Vendor}`;
  document.getElementById('req-detail-content').innerHTML = renderRequestDetail(r);
  loadAttachments(r.Id);

  // Show edit button if request is still editable (Pending Department)
  const editBtn = document.getElementById('btn-edit-from-detail');
  if (r.Status === 'Pending Department') {
    editBtn.style.display = 'inline-flex';
    editBtn.onclick = () => editRequest(r.Id);
  } else {
    editBtn.style.display = 'none';
  }
}

document.getElementById('btn-new-request').addEventListener('click', () => showReqForm('new'));
document.getElementById('btn-cancel-req').addEventListener('click', showReqList);
document.getElementById('btn-cancel-req-2').addEventListener('click', showReqList);
document.getElementById('btn-close-detail').addEventListener('click', showReqList);

// Cost hint
document.getElementById('req-cost').addEventListener('input', updateCostHint);
function updateCostHint() {
  const cost = parseFloat(document.getElementById('req-cost').value) || 0;
  const hint = document.getElementById('cost-hint');
  if (cost > 25000) {
    hint.innerHTML = '⚠️ This request requires <strong>Presidential Approval</strong> (cost exceeds $25,000).';
    hint.style.color = 'var(--warning)';
  } else {
    hint.innerHTML = '';
  }
}

// ── File Upload Handling ──────────────────────────────────────
let pendingFiles = [];

function renderFileList() {
  const container = document.getElementById('file-list');
  if (!pendingFiles.length) { container.innerHTML = ''; return; }
  container.innerHTML = pendingFiles.map((f, i) => {
    const icon = f.name.endsWith('.pdf') ? '📄' : f.name.match(/\.xlsx?$/i) ? '📊' : '📝';
    const size = f.size < 1024 * 1024 
      ? (f.size / 1024).toFixed(1) + ' KB' 
      : (f.size / (1024 * 1024)).toFixed(1) + ' MB';
    return `<div class="file-item">
      <div class="file-item-info">
        <span>${icon}</span>
        <span class="file-item-name">${f.name}</span>
        <span class="file-item-size">${size}</span>
      </div>
      <button type="button" class="file-item-remove" onclick="removeFile(${i})">✕</button>
    </div>`;
  }).join('');
}

function removeFile(idx) {
  pendingFiles.splice(idx, 1);
  renderFileList();
}

function addFiles(files) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
  for (const f of files) {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) { toast(`File "${f.name}" is not an allowed type.`, 'error'); continue; }
    if (f.size > maxSize) { toast(`File "${f.name}" exceeds 10MB limit.`, 'error'); continue; }
    if (pendingFiles.some(pf => pf.name === f.name)) continue; // skip duplicates
    pendingFiles.push(f);
  }
  renderFileList();
}

async function uploadFiles(requestId) {
  if (!pendingFiles.length) return;
  for (const f of pendingFiles) {
    const formData = new FormData();
    formData.append('file', f);
    try {
      await fetch(`/api/requests/${requestId}/attachments`, { method: 'POST', body: formData });
    } catch (err) {
      console.error('File upload error:', err);
    }
  }
  pendingFiles = [];
  renderFileList();
}

// File input and drag-drop
document.getElementById('req-files').addEventListener('change', (e) => {
  addFiles(e.target.files);
  e.target.value = ''; // reset so same file can be re-added
});

const uploadArea = document.getElementById('file-upload-area');
uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  addFiles(e.dataTransfer.files);
});

// Submit form
document.getElementById('req-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert('req-form-alert');

  // Validate required fields
  const requiredFields = [
    { id: 'req-vendor', label: 'Vendor' },
    { id: 'req-start-date', label: 'Estimated Start Date' },
    { id: 'req-description', label: 'Description' },
    { id: 'req-cost', label: 'Estimated Cost' },
    { id: 'req-name', label: 'Full Name' },
    { id: 'req-email', label: 'Requestor Email' },
    { id: 'req-dept-manager', label: 'Department Manager Name' },
    { id: 'req-dept-manager-email', label: 'Dept Manager Email' },
  ];
  const missing = requiredFields.filter(f => !document.getElementById(f.id).value.trim());
  if (missing.length) {
    const msg = 'Required fields must be provided: ' + missing.map(f => f.label).join(', ');
    showAlert('req-form-alert', msg, 'error');
    toast('Required fields must be provided.', 'error');
    return;
  }

  if (!reqSigPad || reqSigPad.isEmpty()) {
    showAlert('req-form-alert', 'Signature is required. Please sign the form before submitting.', 'error');
    toast('Signature is required.', 'error');
    return;
  }

  const id = document.getElementById('req-id').value;
  let reqId = document.getElementById('req-email').value.trim();
  let reqEmail = reqId.includes('@') ? reqId : reqId + '@aqua-aerobic.com';
  
  let mgrId = document.getElementById('req-dept-manager-email').value.trim();
  let mgrEmail = mgrId.includes('@') ? mgrId : mgrId + '@aqua-aerobic.com';

  const body = {
    vendor:        document.getElementById('req-vendor').value.trim(),
    description:   document.getElementById('req-description').value.trim(),
    startDate:     document.getElementById('req-start-date').value,
    estimatedCost: parseFloat(document.getElementById('req-cost').value),
    requestedBy:   document.getElementById('req-name').value.trim(),
    requestorEmail: reqEmail,
    deptManagerName: document.getElementById('req-dept-manager').value.trim(),
    deptManagerEmail: mgrEmail,
    comments:      document.getElementById('req-comments').value.trim(),
    signature:     reqSigPad.getDataURL(),
  };

  const btn = document.getElementById('btn-submit-req');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Submitting...';
  showLoading();

  try {
    let requestId = id;
    if (reqFormMode === 'edit' && id) {
      await apiFetch(`/api/requests/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      await uploadFiles(id);
      toast('Request #' + id + ' updated! Notification email sent to department manager.', 'success');
    } else {
      const result = await apiFetch('/api/requests', { method: 'POST', body: JSON.stringify(body) });
      requestId = result.id;
      await uploadFiles(requestId);
      toast('Request #' + requestId + ' submitted! Confirmation email sent.', 'success');
    }
    // Navigate to home page — user can use the email link to return and check status
    navigate('home');
  } catch (err) {
    showAlert('req-form-alert', err.message, 'error');
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Submit Request</span>';
    hideLoading();
  }
});

// ══════════════════════════════════════════════════════════════
// DEPARTMENT PAGE
// ══════════════════════════════════════════════════════════════
async function loadDepartment(targetId) {
  document.getElementById('dept-detail-card').classList.add('hidden');
  document.getElementById('dept-table-card').classList.remove('hidden');
  document.getElementById('btn-close-dept-detail').style.display = 'inline-flex';
  showLoading();
  try {
    await loadAllRequests();
    renderDeptTable();
    if (targetId) {
      const r = allRequests.find(x => x.Id === parseInt(targetId));
      if (!r) {
        toast('⚠️ Request #' + targetId + ' is no longer available. It may have been removed. Please contact the Accounting department if you have any questions.', 'error', 8000);
        navigate('home');
        return;
      }
      document.getElementById('dept-table-card').classList.add('hidden');
      document.getElementById('btn-close-dept-detail').style.display = 'none';
      viewDeptDetail(parseInt(targetId));
    }
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  } finally {
    hideLoading();
  }
}

function renderDeptTable() {
  const reqs = allRequests.filter(r => r.Status === 'Pending Department' || r.DeptStatus);
  const filtered = searchFilter(reqs, 'search-dept');
  const tbody = document.getElementById('dept-tbody');
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:2rem">No requests pending department approval.</td></tr>';
    document.getElementById('dept-pagination').innerHTML = '';
    return;
  }
  const pageRows = paginateRows(filtered, 'dept');
  tbody.innerHTML = pageRows.map(r => `
    <tr>
      <td class="font-semibold text-accent">#${r.Id}</td>
      <td>${fmtSmartDate(r)}</td>
      <td>${fmt(r.RequestedBy)}</td>
      <td>${fmt(r.Vendor)}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${fmt(r.Description)}</td>
      <td>${fmtCurrency(r.EstimatedCost)}</td>
      <td>${statusBadge(r.Status)}</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="viewDeptDetail(${r.Id})">Review</button>
      </td>
    </tr>
  `).join('');
  renderPagination('dept-pagination', 'dept', renderDeptTable);
}

function viewDeptDetail(id) {
  const r = allRequests.find(x => x.Id === id);
  if (!r) return;
  document.getElementById('dept-detail-card').classList.remove('hidden');
  document.getElementById('dept-detail-title').textContent = `Review Request #${r.Id} - ${r.Vendor}`;
  document.getElementById('dept-detail-content').innerHTML = renderRequestDetail(r, false);
  loadAttachments(r.Id);
  const actBtns = document.getElementById('dept-action-btns');
  actBtns.style.display = r.Status === 'Pending Department' ? 'flex' : 'none';
  currentApprovalRequestId = id;
  currentApprovalType = 'Department';
  currentDenyRequestId = id;
  currentDenyType = 'Department';
}

document.getElementById('btn-refresh-dept').addEventListener('click', async () => {
  const s = document.getElementById('search-dept'); if (s) s.value = '';
  paginationState.dept.page = 1;
  await loadDepartment();
  toast('Department refreshed.', 'info');
});
document.getElementById('btn-close-dept-detail').addEventListener('click', () => {
  document.getElementById('dept-detail-card').classList.add('hidden');
});
document.getElementById('btn-dept-approve').addEventListener('click', () => openApprovalModal('Department', 'Approve'));
document.getElementById('btn-dept-deny').addEventListener('click', openDenyModal);

// ══════════════════════════════════════════════════════════════
// FINANCIAL PAGE
// ══════════════════════════════════════════════════════════════
async function loadFinancial(targetId) {
  document.getElementById('fin-detail-card').classList.add('hidden');
  document.getElementById('fin-acc-card').style.display = 'none';
  document.getElementById('fin-table-card').classList.remove('hidden');
  document.getElementById('btn-close-fin-detail').style.display = 'inline-flex';
  showLoading();
  try {
    await loadAllRequests();
    renderFinTable();
    if (targetId) {
      const r = allRequests.find(x => x.Id === parseInt(targetId));
      if (!r) {
        toast('⚠️ Request #' + targetId + ' is no longer available. It may have been removed. Please contact the Accounting department if you have any questions.', 'error', 8000);
        navigate('home');
        return;
      }
      document.getElementById('fin-table-card').classList.add('hidden');
      document.getElementById('btn-close-fin-detail').style.display = 'none';
      viewFinDetail(parseInt(targetId));
    }
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  } finally {
    hideLoading();
  }
}

function renderFinTable() {
  const reqs = allRequests.filter(r => r.Status === 'Pending Financial' || r.FinStatus);
  const filtered = searchFilter(reqs, 'search-fin');
  const tbody = document.getElementById('fin-tbody');
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:2rem">No requests pending financial approval.</td></tr>';
    document.getElementById('fin-pagination').innerHTML = '';
    return;
  }
  const pageRows = paginateRows(filtered, 'fin');
  tbody.innerHTML = pageRows.map(r => `
    <tr>
      <td class="font-semibold text-accent">#${r.Id}</td>
      <td>${fmtSmartDate(r)}</td>
      <td>${fmt(r.RequestedBy)}</td>
      <td>${fmt(r.Vendor)}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${fmt(r.Description)}</td>
      <td>${fmtCurrency(r.EstimatedCost)}</td>
      <td>${statusBadge(r.Status)}</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="viewFinDetail(${r.Id})">Review</button>
      </td>
    </tr>
  `).join('');
  renderPagination('fin-pagination', 'fin', renderFinTable);
}

function viewFinDetail(id) {
  const r = allRequests.find(x => x.Id === id);
  if (!r) return;
  document.getElementById('fin-detail-card').classList.remove('hidden');
  document.getElementById('fin-detail-title').textContent = `Review Request #${r.Id} - ${r.Vendor}`;
  document.getElementById('fin-detail-content').innerHTML = renderRequestDetail(r);
  loadAttachments(r.Id);
  const actBtns = document.getElementById('fin-action-btns');
  actBtns.style.display = r.Status === 'Pending Financial' ? 'flex' : 'none';
  currentApprovalRequestId = id;
  currentApprovalType = 'Financial';
  currentDenyRequestId = id;
  currentDenyType = 'Financial';

  // Show accounting form
  document.getElementById('fin-acc-card').style.display = 'block';
  document.getElementById('fin-acc-req-id').textContent = id;
  document.getElementById('fin-acc-req-id-hidden').value = id;
  document.getElementById('fin-b-number').value = r.BNumber || '';
  document.getElementById('fin-fiscal-year').value = r.FiscalYear || '';
  document.getElementById('fin-acc-notes').value = r.AccNotes || '';
  document.getElementById('fin-entered-by').value = r.EnteredBy || '';
  document.getElementById('fin-class').value = r.Class || '';
  document.getElementById('fin-property-type').value = r.PropertyType || '';
  document.getElementById('fin-fixed-asset').value = r.FixedAssetAccount || '';
  document.getElementById('fin-accum-dep').value = r.AccumulatedDepreciationAccount || '';
  document.getElementById('fin-dep-exp').value = r.DepreciationExpenseAccount || '';
  document.getElementById('fin-use-tax').checked = !!r.UseTax;
  document.getElementById('fin-equipment-exempt').checked = !!r.EquipmentExempt;
  document.getElementById('fin-tooling').checked = !!r.Tooling;
}

document.getElementById('btn-refresh-fin').addEventListener('click', async () => {
  const s = document.getElementById('search-fin'); if (s) s.value = '';
  paginationState.fin.page = 1;
  await loadFinancial();
  toast('Financial refreshed.', 'info');
});
document.getElementById('btn-close-fin-detail').addEventListener('click', () => {
  document.getElementById('fin-detail-card').classList.add('hidden');
  document.getElementById('fin-acc-card').style.display = 'none';
});
document.getElementById('btn-fin-approve').addEventListener('click', () => {
  // Verify accounting details have been saved before allowing approval
  const r = allRequests.find(x => x.Id === currentApprovalRequestId);
  if (r && !r.EnteredBy) {
    toast('Please save Accounting Details before approving.', 'error');
    return;
  }
  openApprovalModal('Financial', 'Approve');
});
document.getElementById('btn-fin-deny').addEventListener('click', openDenyModal);

// Accounting form submit
document.getElementById('fin-acc-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const rid = document.getElementById('fin-acc-req-id-hidden').value;
  const body = {
    bNumber:      document.getElementById('fin-b-number').value.trim(),
    fiscalYear:   document.getElementById('fin-fiscal-year').value.trim(),
    notes:        document.getElementById('fin-acc-notes').value.trim(),
    enteredBy:    document.getElementById('fin-entered-by').value.trim(),
    accClass:     document.getElementById('fin-class').value.trim(),
    propertyType: document.getElementById('fin-property-type').value.trim(),
    fixedAssetAccount: document.getElementById('fin-fixed-asset').value.trim(),
    accumulatedDepreciationAccount: document.getElementById('fin-accum-dep').value.trim(),
    depreciationExpenseAccount: document.getElementById('fin-dep-exp').value.trim(),
    useTax:       document.getElementById('fin-use-tax').checked,
    equipmentExempt: document.getElementById('fin-equipment-exempt').checked,
    tooling:      document.getElementById('fin-tooling').checked,
  };
  showLoading();
  try {
    await apiFetch(`/api/requests/${rid}/accounting`, { method: 'POST', body: JSON.stringify(body) });
    toast('Accounting details saved!', 'success');
    await loadAllRequests();
  } catch (err) {
    toast('Error saving accounting: ' + err.message, 'error');
  } finally {
    hideLoading();
  }
});

// ══════════════════════════════════════════════════════════════
// PRESIDENTIAL PAGE
// ══════════════════════════════════════════════════════════════
async function loadPresidential(targetId) {
  document.getElementById('pres-detail-card').classList.add('hidden');
  document.getElementById('pres-table-card').classList.remove('hidden');
  document.getElementById('btn-close-pres-detail').style.display = 'inline-flex';
  showLoading();
  try {
    await loadAllRequests();
    renderPresTable();
    if (targetId) {
      const r = allRequests.find(x => x.Id === parseInt(targetId));
      if (!r) {
        toast('⚠️ Request #' + targetId + ' is no longer available. It may have been removed. Please contact the Accounting department if you have any questions.', 'error', 8000);
        navigate('home');
        return;
      }
      document.getElementById('pres-table-card').classList.add('hidden');
      document.getElementById('btn-close-pres-detail').style.display = 'none';
      viewPresDetail(parseInt(targetId));
    }
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  } finally {
    hideLoading();
  }
}

function renderPresTable() {
  const reqs = allRequests.filter(r => r.Status === 'Pending Presidential' || r.PresStatus);
  const filtered = searchFilter(reqs, 'search-pres');
  const tbody = document.getElementById('pres-tbody');
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:2rem">No requests pending presidential approval.</td></tr>';
    document.getElementById('pres-pagination').innerHTML = '';
    return;
  }
  const pageRows = paginateRows(filtered, 'pres');
  tbody.innerHTML = pageRows.map(r => `
    <tr>
      <td class="font-semibold text-accent">#${r.Id}</td>
      <td>${fmtSmartDate(r)}</td>
      <td>${fmt(r.RequestedBy)}</td>
      <td>${fmt(r.Vendor)}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${fmt(r.Description)}</td>
      <td class="text-warning font-bold">${fmtCurrency(r.EstimatedCost)}</td>
      <td>${statusBadge(r.Status)}</td>
      <td>
        <button class="btn btn-purple btn-sm" onclick="viewPresDetail(${r.Id})">Review</button>
      </td>
    </tr>
  `).join('');
  renderPagination('pres-pagination', 'pres', renderPresTable);
}

function viewPresDetail(id) {
  const r = allRequests.find(x => x.Id === id);
  if (!r) return;
  document.getElementById('pres-detail-card').classList.remove('hidden');
  document.getElementById('pres-detail-title').textContent = `Review Request #${r.Id} - ${r.Vendor}`;
  document.getElementById('pres-detail-content').innerHTML = renderRequestDetail(r);
  loadAttachments(r.Id);
  const actBtns = document.getElementById('pres-action-btns');
  actBtns.style.display = r.Status === 'Pending Presidential' ? 'flex' : 'none';
  currentApprovalRequestId = id;
  currentApprovalType = 'Presidential';
  currentDenyRequestId = id;
  currentDenyType = 'Presidential';
}

document.getElementById('btn-refresh-pres').addEventListener('click', async () => {
  const s = document.getElementById('search-pres'); if (s) s.value = '';
  paginationState.pres.page = 1;
  await loadPresidential();
  toast('Presidential refreshed.', 'info');
});
document.getElementById('btn-close-pres-detail').addEventListener('click', () => {
  document.getElementById('pres-detail-card').classList.add('hidden');
});
document.getElementById('btn-pres-approve').addEventListener('click', () => openApprovalModal('Presidential', 'Approve'));
document.getElementById('btn-pres-deny').addEventListener('click', openDenyModal);

// ══════════════════════════════════════════════════════════════
// APPROVAL MODAL
// ══════════════════════════════════════════════════════════════
function openApprovalModal(type, action) {
  const titleMap = {
    Department:   '🏢 Department Approval',
    Financial:    '💰 Financial Approval',
    Presidential: '👑 Presidential Approval',
  };
  document.getElementById('approval-modal-title').textContent = titleMap[type] || `${type} Approval`;
  document.getElementById('approver-name').value = '';
  document.getElementById('approval-date').value = today();
  document.getElementById('approval-comments').value = '';
  if (approvalSigPad) {
    approvalSigPad.clear();
    document.getElementById('approval-sig-clear').style.display = 'none';
    document.getElementById('approval-btn-generate-sig').style.display = 'inline-block';
  }
  clearAlert('approval-modal-alert');

  const btn = document.getElementById('approval-confirm-btn');
  btn.className = 'btn btn-success';
  btn.textContent = '✓ Confirm Approval';

  openModal('approval-modal');
}

async function confirmApproval() {
  clearAlert('approval-modal-alert');
  const name = document.getElementById('approver-name').value.trim();
  const date = document.getElementById('approval-date').value;
  const comments = document.getElementById('approval-comments').value.trim();

  if (!name) { showAlert('approval-modal-alert', 'Please enter your name.', 'error'); return; }
  if (!date) { showAlert('approval-modal-alert', 'Please enter the approval date.', 'error'); return; }
  if (!approvalSigPad || approvalSigPad.isEmpty()) {
    showAlert('approval-modal-alert', 'Signature is required.', 'error');
    return;
  }

  const body = {
    approvalType:  currentApprovalType,
    approverName:  name,
    signature:     approvalSigPad.getDataURL(),
    approvalDate:  date,
    status:        'Approved',
    comments,
  };

  const btn = document.getElementById('approval-confirm-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Processing...';
  showLoading();

  try {
    const result = await apiFetch(`/api/requests/${currentApprovalRequestId}/approve`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    toast(result.message, 'success');
    closeModal('approval-modal');
    // Send user to home page (approvers arrive via email link, not authenticated)
    navigate('home');
  } catch (err) {
    showAlert('approval-modal-alert', err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✓ Confirm Approval';
    hideLoading();
  }
}

// ══════════════════════════════════════════════════════════════
// DENY MODAL
// ══════════════════════════════════════════════════════════════
function openDenyModal() {
  document.getElementById('deny-approver-name').value = '';
  document.getElementById('deny-comments').value = '';
  openModal('deny-modal');
}

async function confirmDeny() {
  const name = document.getElementById('deny-approver-name').value.trim();
  const comments = document.getElementById('deny-comments').value.trim();
  if (!name) { toast('Please enter your name.', 'error'); return; }
  if (!comments) { toast('Please provide a reason for denial.', 'error'); return; }

  const body = {
    approvalType: currentDenyType,
    approverName: name,
    signature:    '',
    approvalDate: today(),
    status:       'Denied',
    comments,
  };

  showLoading();
  try {
    const result = await apiFetch(`/api/requests/${currentDenyRequestId}/approve`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    toast(result.message, 'info');
    closeModal('deny-modal');
    navigate('home');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

// ══════════════════════════════════════════════════════════════
// DELETE MODAL
// ══════════════════════════════════════════════════════════════
function openDeleteModal(id) {
  currentDeleteRequestId = id;
  document.getElementById('delete-fullname').value = '';
  document.getElementById('delete-code').value = '';
  openModal('delete-modal');
}

async function confirmDelete() {
  const fullName = document.getElementById('delete-fullname').value.trim();
  const code = document.getElementById('delete-code').value.trim();
  if (!fullName) { toast('Please enter your full name.', 'error'); return; }
  if (!code) { toast('Please enter the deletion code.', 'error'); return; }

  showLoading();
  try {
    const result = await apiFetch(`/api/requests/${currentDeleteRequestId}`, {
      method: 'DELETE',
      body: JSON.stringify({ fullName, code }),
    });
    toast(result.message, 'success');
    closeModal('delete-modal');
    const activePage = document.querySelector('.page-view.active').id.replace('page-', '');
    navigate(activePage);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

// ══════════════════════════════════════════════════════════════
// VIEW DETAIL (from home)
// ══════════════════════════════════════════════════════════════
function viewRequestDetail(id) {
  const r = allRequests.find(x => x.Id === id);
  if (!r) return;
  // Navigate to appropriate detail page based on status
  navigate('requestor');
  setTimeout(() => viewReqDetail(id), 100);
}

// ══════════════════════════════════════════════════════════════
// PRINT MODAL
// ══════════════════════════════════════════════════════════════
function openPrintModal(id) {
  const r = allRequests.find(x => x.Id === id);
  if (!r) return;

  const printYear = new Date().getFullYear();
  const printHeader = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
      <img src="/images/newlogo.png" alt="Aqua-Aerobic Systems" style="max-height:36px;">
    </div>
    <h2>CAPITAL EXPENDITURE REQUEST FORM</h2>`;
  const makePrintFooter = (pageNum, totalPages, showPageNum = true) => `
    <div class="print-footer">
      <div style="border-top:1px solid #ccc;padding-top:0.5rem;display:flex;justify-content:space-between;align-items:center;font-size:0.7rem;color:#888;">
        <span>Copyright &copy; ${printYear} Aqua-Aerobic Systems, Inc. — All Rights Reserved</span>
        ${showPageNum ? `<span>Page ${pageNum} of ${totalPages}</span>` : ''}
      </div>
    </div>`;

  const hasAccounting = !!(r.BNumber || r.FixedAssetAccount || r.FiscalYear);
  const totalPages = hasAccounting ? 2 : 1;

  const html = `
    <div class="print-form">
      <!-- ═══ PAGE 1 ═══ -->
      <div class="print-page">
        <div class="print-page-content">
          ${printHeader}
          <table class="print-table">
            <tr><th colspan="4" style="background:#003366;color:#fff;text-align:center;font-size:1rem;">Request Information</th></tr>
            <tr>
              <th>Request #</th><td>#${r.Id}</td>
              <th>Date Submitted</th><td>${fmtDate(r.CreatedAt)}</td>
            </tr>
            <tr>
              <th>Requested By</th><td>${r.RequestedBy}</td>
              <th>Vendor</th><td>${r.Vendor}</td>
            </tr>
            <tr>
              <th>Estimated Start Date</th><td>${fmtDate(r.StartDate)}</td>
              <th>Estimated Cost</th><td><strong>${fmtCurrency(r.EstimatedCost)}</strong></td>
            </tr>
            <tr>
              <th>Description</th><td colspan="3">${r.Description}</td>
            </tr>
            ${r.Comments ? `<tr><th>Comments</th><td colspan="3">${r.Comments}</td></tr>` : ''}
            <tr>
              <th>Requestor Signature</th>
              <td colspan="3">
                ${r.ReqSignature ? `<img src="${r.ReqSignature}" class="print-sig">` : '____________________________'}
              </td>
            </tr>
          </table>

          <table class="print-table">
            <tr><th colspan="4" style="background:#003366;color:#fff;text-align:center;font-size:1rem;">Approval Signatures</th></tr>
            <tr>
              <th>Approval Level</th><th>Approver</th><th>Date</th><th>Signature</th>
            </tr>
            <tr>
              <td>Department</td>
              <td>${r.DeptApproverName || ''}</td>
              <td>${fmtDate(r.DeptApprovalDate)}</td>
              <td>${r.DeptSignature ? `<img src="${r.DeptSignature}" class="print-sig">` : '____________________________'}</td>
            </tr>
            <tr>
              <td>Financial</td>
              <td>${r.FinApproverName || ''}</td>
              <td>${fmtDate(r.FinApprovalDate)}</td>
              <td>${r.FinSignature ? `<img src="${r.FinSignature}" class="print-sig">` : '____________________________'}</td>
            </tr>
            ${parseFloat(r.EstimatedCost) > 25000 ? `
            <tr>
              <td>Presidential</td>
              <td>${r.PresApproverName || ''}</td>
              <td>${fmtDate(r.PresApprovalDate)}</td>
              <td>${r.PresSignature ? `<img src="${r.PresSignature}" class="print-sig">` : '____________________________'}</td>
            </tr>` : ''}
          </table>
        </div>
        ${makePrintFooter(1, totalPages, false)}
      </div>

      ${hasAccounting ? `
      <!-- ═══ PAGE 2 ═══ -->
      <div class="print-page" style="page-break-before:always;">
        <div class="print-page-content">
          ${printHeader}
          <table class="print-table print-table-accounting">
            <tr><th colspan="4" style="background:#003366;color:#fff;text-align:center;font-size:1rem;">Accounting Details</th></tr>
            <tr>
              <th>B Number</th><td>${r.BNumber || ''}</td>
              <th>Fixed Asset Account</th><td>${r.FixedAssetAccount || ''}</td>
            </tr>
            <tr>
              <th>Property Type</th><td>${r.PropertyType || ''}</td>
              <th>Fiscal Year</th><td>${r.FiscalYear || ''}</td>
            </tr>
            <tr>
              <th>Entered By</th><td>${r.EnteredBy || ''}</td>
              <th>Class</th><td>${r.Class || ''}</td>
            </tr>
            <tr>
              <th>Accum. Depr. Account</th><td>${r.AccumulatedDepreciationAccount || ''}</td>
              <th>Depr. Expense Account</th><td>${r.DepreciationExpenseAccount || ''}</td>
            </tr>
            <tr>
              <th>UseTax</th><td>${r.UseTax ? '✓ Yes' : 'No'}</td>
              <th>Equipment Exempt</th><td>${r.EquipmentExempt ? '✓ Yes' : 'No'}</td>
            </tr>
            <tr>
              <th>Tooling</th><td>${r.Tooling ? '✓ Yes' : 'No'}</td>
              <td colspan="2"></td>
            </tr>
            ${r.AccNotes ? `<tr><th>Notes</th><td colspan="3">${r.AccNotes}</td></tr>` : ''}
          </table>
        </div>
        ${makePrintFooter(2, totalPages)}
      </div>
      ` : ''}
    </div>
  `;

  document.getElementById('print-form-content').innerHTML = html;
  openModal('print-modal');
}

// ══════════════════════════════════════════════════════════════
// ADMIN PAGE
// ══════════════════════════════════════════════════════════════
async function loadAdmin() {
  showLoading();
  try {
    const settings = await apiFetch('/api/settings');
    document.getElementById('admin-accounting-email').value = settings.accountingEmail || '';
    document.getElementById('admin-presidential-email').value = settings.presidentialEmail || '';
    document.getElementById('admin-smtp-host').value = settings.smtpHost || '';
    document.getElementById('admin-smtp-port').value = settings.smtpPort || '';
    document.getElementById('admin-smtp-user').value = settings.smtpUser || '';
    document.getElementById('admin-smtp-pass').value = settings.smtpPass || '';
    document.getElementById('admin-smtp-secure').value = settings.smtpSecure || 'false';
    document.getElementById('admin-from-email').value = settings.fromEmail || '';
    document.getElementById('admin-from-email-name').value = settings.fromEmailName || '';
    document.getElementById('admin-app-passcode').value = settings.appPasscode || '1969';
    
    // Load logs
    await loadAdminLogs();
  } catch (e) {
    toast('Error loading admin data: ' + e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function loadAdminLogs() {
  const tbody = document.getElementById('admin-logs-tbody');
  try {
    const logs = await apiFetch('/api/logs');
    if (!logs.length) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted" style="padding:2rem">No logs found.</td></tr>';
      return;
    }
    tbody.innerHTML = logs.map(l => `
      <tr>
        <td style="white-space:nowrap" class="text-xs text-muted">${new Date(String(l.CreatedAt).replace(/Z$/i, '')).toLocaleString()}</td>
        <td class="font-semibold">${fmt(l.Action)}</td>
        <td style="font-size: 0.9rem">${fmt(l.Details)}</td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger" style="padding:2rem">Failed to load logs.</td></tr>`;
  }
}

document.getElementById('btn-refresh-logs')?.addEventListener('click', async () => {
  showLoading();
  try {
    await loadAdminLogs();
    toast('Logs refreshed.', 'info');
  } finally {
    hideLoading();
  }
});

document.getElementById('admin-settings-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    accountingEmail: document.getElementById('admin-accounting-email').value.trim(),
    presidentialEmail: document.getElementById('admin-presidential-email').value.trim(),
    smtpHost: document.getElementById('admin-smtp-host').value.trim(),
    smtpPort: document.getElementById('admin-smtp-port').value.trim(),
    smtpUser: document.getElementById('admin-smtp-user').value.trim(),
    smtpPass: document.getElementById('admin-smtp-pass').value,
    smtpSecure: document.getElementById('admin-smtp-secure').value,
    fromEmail: document.getElementById('admin-from-email').value.trim(),
    fromEmailName: document.getElementById('admin-from-email-name').value.trim(),
    appPasscode: document.getElementById('admin-app-passcode').value.trim() || '1969',
  };

  const btn = document.getElementById('btn-save-settings');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Saving...';
  showLoading();

  try {
    await apiFetch('/api/settings', { method: 'POST', body: JSON.stringify(body) });
    toast('Settings saved successfully!', 'success');
  } catch (err) {
    toast('Error saving settings: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '💾 Save Settings';
    hideLoading();
  }
});

// ── Removed Requests (Soft-Deleted) ──
let allRemovedRequests = [];

async function loadRemovedRequests() {
  const tbody = document.getElementById('removed-tbody');
  tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:2rem">Loading...</td></tr>';
  try {
    allRemovedRequests = await apiFetch('/api/requests-removed');
    renderRemovedTable();
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger" style="padding:2rem">Failed to load removed requests.</td></tr>';
  }
}

function renderRemovedTable() {
  const tbody = document.getElementById('removed-tbody');
  const filtered = searchFilter(allRemovedRequests, 'search-removed');
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:2rem">No removed requests.</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(r => {
    const prevStatus = r.Status.replace(/^X/, '');
    return `
      <tr>
        <td class="font-semibold text-accent">#${r.Id}</td>
        <td>${fmtDate(r.UpdatedAt)}</td>
        <td>${fmt(r.RequestedBy)}</td>
        <td>${fmt(r.Vendor)}</td>
        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${fmt(r.Description)}</td>
        <td>${fmtCurrency(r.EstimatedCost)}</td>
        <td>${statusBadge(prevStatus)}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="restoreRequest(${r.Id})">♻ Restore</button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterRemovedRequests() {
  renderRemovedTable();
}

async function restoreRequest(id) {
  if (!confirm(`Are you sure you want to restore Request #${id}?`)) return;
  showLoading();
  try {
    const result = await apiFetch(`/api/requests/${id}/restore`, { method: 'POST' });
    toast(`Request #${id} restored to "${result.restoredStatus}".`, 'success');
    await loadRemovedRequests();
  } catch (e) {
    toast('Error restoring request: ' + e.message, 'error');
  } finally {
    hideLoading();
  }
}

// ══════════════════════════════════════════════════════════════
// AUTHENTICATION
// ══════════════════════════════════════════════════════════════
function cancelAuth() {
  closeModal('auth-modal');
  authTargetPage = null;
}

async function confirmAuth() {
  const code = document.getElementById('auth-code').value.trim();
  const name = document.getElementById('auth-name').value.trim();
  if (!name) { toast('Please enter your UserID.', 'error'); return; }
  if (!code) { toast('Please enter passcode.', 'error'); return; }
  
  showLoading();
  try {
    const res = await apiFetch('/api/verify-code', { method: 'POST', body: JSON.stringify({ code }) });
    if (res.valid) {
      isAuthenticated = true;
      localStorage.setItem('capex_auth_time', Date.now().toString());
      closeModal('auth-modal');
      if (authTargetPage) {
        navigate(authTargetPage);
        authTargetPage = null;
      }
    } else {
      toast('Invalid passcode.', 'error');
    }
  } catch (e) {
    toast('Error verifying code.', 'error');
  } finally {
    hideLoading();
  }
}

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  const pageStr = hash.split('?')[0];
  if (hash === 'new-request' || hash === 'requestor') {
    navigate('requestor');
    if (hash === 'new-request') setTimeout(() => showReqForm('new'), 100);
  } else if (pageStr && document.getElementById('page-' + pageStr)) {
    navigate(hash);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  initSigPads();
  
  // Set default approval date to today
  document.getElementById('approval-date').value = today();
  document.getElementById('req-start-date').min = today();

  const hash = window.location.hash.replace('#', '');
  const pageStr = hash.split('?')[0];
  if (hash === 'new-request' || hash === 'requestor') {
    navigate('requestor');
    if (hash === 'new-request') setTimeout(() => showReqForm('new'), 200);
  } else if (pageStr && document.getElementById('page-' + pageStr)) {
    navigate(hash);
  } else {
    navigate('home');
  }
});
