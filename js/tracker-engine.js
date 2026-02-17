/* ============================================================
   tracker-engine.js — reads TRACKER_CONFIGS, builds all UI
   Don't edit this file to add trackers — edit tracker-config.js
   ============================================================ */

let activeTrackerIdx = 0;

function getConfig() { return TRACKER_CONFIGS[activeTrackerIdx]; }

// ── Storage ──────────────────────────────────────────────────
function getEntries(cfg) {
  cfg = cfg || getConfig();
  try { return JSON.parse(localStorage.getItem(cfg.storageKey) || '[]'); } catch { return []; }
}

function saveEntries(entries, cfg) {
  cfg = cfg || getConfig();
  localStorage.setItem(cfg.storageKey, JSON.stringify(entries));
}

// ── Build full tracker UI from config ────────────────────────
function buildTrackerUI() {
  const cfg = getConfig();

  // Type nav tabs (one per TRACKER_CONFIGS entry)
  const nav = document.getElementById('tracker-type-nav');
  nav.innerHTML = TRACKER_CONFIGS.map((c, i) =>
    `<button class="month-btn ${i === activeTrackerIdx ? 'active' : ''}"
      style="--accent-color:#a8d8ea"
      onclick="switchTracker(${i})">${c.label}</button>`
  ).join('');

  // Sub-tabs + panels
  const container = document.getElementById('tracker-dynamic-container');
  container.innerHTML = `
    <div style="display:flex;gap:4px;border-bottom:1px solid rgba(168,216,234,0.1);margin-bottom:32px;">
      <button class="month-btn active" id="tab-log"        style="--accent-color:#a8d8ea" onclick="showTrackerTab('log')">Log Entry</button>
      <button class="month-btn"        id="tab-history"    style="--accent-color:#a8d8ea" onclick="showTrackerTab('history')">History</button>
      <button class="month-btn"        id="tab-benchmarks" style="--accent-color:#a8d8ea" onclick="showTrackerTab('benchmarks')">Benchmarks</button>
    </div>
    <div id="tracker-log">${buildLogForm(cfg)}</div>
    <div id="tracker-history"    style="display:none;">${buildHistoryShell()}</div>
    <div id="tracker-benchmarks" style="display:none;">${buildBenchmarksShell(cfg)}</div>`;

  // Set today's date as default
  const dateEl = document.getElementById('field-date');
  if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
}

function switchTracker(idx) {
  activeTrackerIdx = idx;
  buildTrackerUI();
}

function showTrackerTab(tab) {
  ['log','history','benchmarks'].forEach(t => {
    document.getElementById('tracker-' + t).style.display = t === tab ? 'block' : 'none';
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
  });
  if (tab === 'history')    renderHistory();
  if (tab === 'benchmarks') renderBenchmarks();
}

// ── Build log form HTML ───────────────────────────────────────
function buildLogForm(cfg) {
  const metaFields = cfg.meta.map(f =>
    `<div class="tracker-field">${fieldLabel(f)}${fieldInput(f)}</div>`
  ).join('');
  const metaRow = `<div style="grid-column:1/-1;display:grid;grid-template-columns:repeat(${cfg.meta.length},1fr);gap:16px;">${metaFields}</div>`;

  const cards = cfg.cards.map(card => {
    const style = card.fullWidth ? 'grid-column:1/-1;' : '';
    let fieldsHTML;
    if (card.inlineGrid) {
      const inline = card.fields.slice(0, card.inlineGrid);
      const rest   = card.fields.slice(card.inlineGrid);
      fieldsHTML =
        `<div style="display:grid;grid-template-columns:repeat(${card.inlineGrid},1fr);gap:16px;">` +
        inline.map(f => `<div class="tracker-field">${fieldLabel(f)}${fieldInput(f)}</div>`).join('') +
        `</div>` +
        rest.map(f => `<div class="tracker-field" style="margin-top:8px;">${fieldLabel(f)}${fieldInput(f)}</div>`).join('');
    } else {
      fieldsHTML = card.fields.map(f =>
        `<div class="tracker-field">${fieldLabel(f)}${fieldInput(f)}</div>`
      ).join('');
    }
    return `<div class="tracker-card" style="${style}">
      <div class="tracker-card-title">${card.title}</div>${fieldsHTML}</div>`;
  }).join('');

  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      ${metaRow}${cards}
    </div>
    <div style="display:flex;gap:12px;margin-top:24px;align-items:center;flex-wrap:wrap;">
      <button class="save-btn" onclick="saveEntry()">💾 Save Entry</button>
      <button class="clear-btn" onclick="clearForm()">Clear Form</button>
      <span id="save-confirm" style="font-family:'DM Mono',monospace;font-size:12px;color:#3a9e7a;opacity:0;transition:opacity 0.5s;">✓ Entry saved!</span>
    </div>`;
}

function fieldLabel(f) {
  return `<label>${f.label}</label>`;
}

function fieldInput(f) {
  const id = `field-${f.key}`;
  switch (f.type) {
    case 'date':
      return `<input type="date" id="${id}">`;
    case 'number':
      return `<input type="number" id="${id}" placeholder="${f.placeholder||''}" min="0" ${f.step ? `step="${f.step}"` : ''}>`;
    case 'select': {
      const opts = (f.options||[]).map(o => `<option value="${o}">${o}</option>`).join('');
      return `<select id="${id}"><option value="">— select —</option>${opts}</select>`;
    }
    case 'range': {
      const def   = f.default || 5;
      const valId = `val-${f.key}`;
      return `<input type="range" id="${id}" min="${f.min||1}" max="${f.max||10}" value="${def}"
        oninput="document.getElementById('${valId}').textContent=this.value">
        <span id="${valId}" class="range-val">${def}</span>`;
    }
    case 'textarea':
      return `<textarea id="${id}" rows="3" placeholder="${f.placeholder||''}"></textarea>`;
    default:
      return `<input type="text" id="${id}">`;
  }
}

// ── Build history shell ───────────────────────────────────────
function buildHistoryShell() {
  return `
    <div style="background:rgba(168,216,234,0.04);border:1px solid rgba(168,216,234,0.1);border-radius:6px;padding:16px 20px;margin-bottom:24px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;justify-content:space-between;">
      <div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--ice-deep);margin-bottom:4px;">Data Backup</div>
        <div style="font-size:13px;font-style:italic;color:var(--muted);">Export your data as a JSON file to back it up or move to a new browser.</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <button class="save-btn" onclick="exportData()" style="padding:9px 18px;font-size:11px;">⬇ Export JSON</button>
        <button class="save-btn" onclick="document.getElementById('import-file').click()" style="padding:9px 18px;font-size:11px;background:rgba(201,169,110,0.1);border-color:rgba(201,169,110,0.3);color:var(--gold-light);">⬆ Import JSON</button>
        <input type="file" id="import-file" accept=".json" style="display:none;" onchange="importData(event)">
        <span id="import-confirm" style="font-family:'DM Mono',monospace;font-size:11px;color:#3a9e7a;opacity:0;transition:opacity 0.5s;">✓ Imported!</span>
        <span id="import-error"   style="font-family:'DM Mono',monospace;font-size:11px;color:#e08080;opacity:0;transition:opacity 0.5s;">✕ Invalid file</span>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
      <div style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);">All Logged Sessions</div>
      <button id="clear-all-btn" class="clear-btn" onclick="clearAllData()" style="background:rgba(192,80,80,0.1);border-color:rgba(192,80,80,0.3);color:#e08080;">🗑 Clear All Data</button>
    </div>
    <div id="history-list"></div>
    <div id="history-empty" style="text-align:center;padding:60px 20px;color:var(--muted);font-style:italic;font-size:16px;">No entries yet. Log your first session above!</div>`;
}

// ── Build benchmarks shell ────────────────────────────────────
function buildBenchmarksShell(cfg) {
  const pbCards = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px;" id="pb-grid"></div>`;
  const charts  = cfg.charts.map(ch => `
    <div style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin:32px 0 16px;">${ch.title}</div>
    <div id="${ch.id}-chart-wrap" style="background:rgba(17,34,64,0.6);border:1px solid rgba(168,216,234,0.1);border-radius:6px;padding:24px;">
      <canvas id="${ch.id}-chart"></canvas>
      <div id="${ch.id}-empty" style="text-align:center;color:var(--muted);font-style:italic;padding:40px 0;display:none;">Log data to see this chart.</div>
    </div>`).join('');
  return `
    <div style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:24px;">Personal Bests & Progress Over Time</div>
    ${pbCards}${charts}`;
}

// ── Save entry ────────────────────────────────────────────────
function saveEntry() {
  const cfg   = getConfig();
  const entry = { id: Date.now() };
  cfg.meta.forEach(f => {
    const el = document.getElementById(`field-${f.key}`);
    if (el) entry[f.key] = el.value;
  });
  cfg.cards.forEach(card => {
    card.fields.forEach(f => {
      const el = document.getElementById(`field-${f.key}`);
      if (el) entry[f.key] = el.value;
    });
  });
  const entries = getEntries();
  entries.unshift(entry);
  saveEntries(entries);

  const confirmEl = document.getElementById('save-confirm');
  confirmEl.style.opacity = '1';
  setTimeout(() => confirmEl.style.opacity = '0', 2500);
}

// ── Clear form ────────────────────────────────────────────────
function clearForm() {
  const cfg       = getConfig();
  const allFields = [...cfg.meta, ...cfg.cards.flatMap(c => c.fields)];
  allFields.forEach(f => {
    const el = document.getElementById(`field-${f.key}`);
    if (!el) return;
    if (f.type === 'range') {
      el.value = f.default || 5;
      const valEl = document.getElementById(`val-${f.key}`);
      if (valEl) valEl.textContent = f.default || 5;
    } else if (f.type === 'date') {
      el.value = new Date().toISOString().split('T')[0];
    } else {
      el.value = '';
    }
  });
}

// ── Clear all / delete entry ──────────────────────────────────
function clearAllData() {
  const btn = document.getElementById('clear-all-btn');
  if (btn.dataset.confirming === 'true') {
    localStorage.removeItem(getConfig().storageKey);
    btn.textContent = '🗑 Clear All Data';
    btn.dataset.confirming = 'false';
    btn.style.background = 'rgba(192,80,80,0.1)';
    renderHistory();
    renderBenchmarks();
  } else {
    btn.textContent = '⚠ Click again to confirm';
    btn.dataset.confirming = 'true';
    btn.style.background = 'rgba(192,80,80,0.25)';
    setTimeout(() => {
      if (btn.dataset.confirming === 'true') {
        btn.textContent = '🗑 Clear All Data';
        btn.dataset.confirming = 'false';
        btn.style.background = 'rgba(192,80,80,0.1)';
      }
    }, 4000);
  }
}

function deleteEntry(id) {
  const entries = getEntries().filter(e => e.id !== id);
  saveEntries(entries);
  renderHistory();
  renderBenchmarks();
}

// ── Helpers ───────────────────────────────────────────────────
function fmtDate(str) {
  if (!str) return '—';
  return new Date(str + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

// ── Render history ────────────────────────────────────────────
function renderHistory() {
  const cfg     = getConfig();
  const entries = getEntries();
  const list    = document.getElementById('history-list');
  const empty   = document.getElementById('history-empty');
  if (!list) return;

  if (entries.length === 0) { list.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  list.innerHTML = entries.map(e => {
    const stats = cfg.historyStats
      .filter(s => e[s.key])
      .map(s => `${s.label}: <span>${e[s.key]}${s.suffix(e)}</span>`);

    const selectStats = (cfg.historySelectStats || [])
      .filter(k => e[k])
      .map(k => `${k}: <span>${e[k]}</span>`);

    const metaMonthVal = e.month ? parseInt(e.month) - 1 : 0;
    const color        = (cfg.metaColorKeys || [])[metaMonthVal] || '#4a90b8';
    const monthField   = cfg.meta.find(f => f.key === 'month');
    const metaTag      = (monthField && e.month) ? `M${e.month} · W${e.week||'?'}` : fmtDate(e.date);

    return `<div class="history-entry">
      <button class="delete-btn" onclick="deleteEntry(${e.id})" title="Delete entry">✕</button>
      <div class="history-entry-header">
        <div class="history-entry-date">${fmtDate(e.date)}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <div class="history-entry-tag" style="color:${color};border-color:${color}40;">${metaTag}</div>
          ${e.day ? `<div class="history-entry-tag">${e.day}</div>` : ''}
        </div>
      </div>
      ${stats.length ? `<div class="history-entry-stats">${stats.map(s=>`<div class="history-stat">${s}</div>`).join('')}</div>` : ''}
      ${selectStats.length ? `<div class="history-entry-stats" style="margin-top:8px;">${selectStats.map(s=>`<div class="history-stat">${s}</div>`).join('')}</div>` : ''}
      ${e.notes ? `<div class="history-notes">"${e.notes}"</div>` : ''}
    </div>`;
  }).join('');
}

// ── Render benchmarks ─────────────────────────────────────────
function renderBenchmarks() {
  const cfg     = getConfig();
  const entries = getEntries().slice().reverse(); // chronological
  const pbGrid  = document.getElementById('pb-grid');
  if (!pbGrid) return;

  pbGrid.innerHTML = cfg.benchmarks.map(b => {
    const best = entries.reduce((max, e) => {
      const v = parseFloat(e[b.key]);
      return (!isNaN(v) && v > max) ? v : max;
    }, 0);
    const has = best > 0;
    return `<div class="pb-card">
      <div class="pb-card-label">${b.label}</div>
      <div class="pb-card-value" style="color:${has ? b.color : 'var(--muted)'};">${has ? best : '—'}</div>
      <div class="pb-card-unit">${has ? b.unit : 'no data yet'}</div>
    </div>`;
  }).join('');

  cfg.charts.forEach(ch => {
    const datasets = ch.fields.map(f => ({
      key: f.key, label: f.label, color: f.color,
      points: entries
        .filter(e => e[f.key] && !isNaN(parseFloat(e[f.key])))
        .map(e => ({ label: fmtDate(e.date).replace(/,.*/, ''), v: parseFloat(e[f.key]) }))
    })).filter(d => d.points.length >= 1);

    const wrapEl = document.getElementById(`${ch.id}-chart-wrap`);
    if (!wrapEl) return;
    makeSVGLineChart({
      wrap: wrapEl,
      canvasId: `${ch.id}-chart`,
      emptyId:  `${ch.id}-empty`,
      datasets,
      height: 200,
      showLegend: ch.fields.length > 1,
    });
  });
}

// ── Init ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => { buildTrackerUI(); });
