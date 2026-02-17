/* ============================================================
   charts.js — SVG line graph engine
   Called by tracker-engine.js via makeSVGLineChart()
   ============================================================ */

function makeSVGLineChart({ wrap, canvasId, emptyId, datasets, height = 180, showLegend = true }) {
  const canvas = document.getElementById(canvasId);
  const empty  = document.getElementById(emptyId);
  canvas.style.display = 'none';
  const existing = wrap.querySelector('.svg-chart-wrap');
  if (existing) existing.remove();

  const valid = datasets.filter(d => d.points.length >= 1);
  if (valid.length === 0) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  const W   = wrap.clientWidth || 700;
  const PAD = { top: 24, right: 24, bottom: 48, left: 48 };
  const cW  = W - PAD.left - PAD.right;
  const cH  = height - PAD.top - PAD.bottom;

  // ── Y-axis range ───────────────────────────────────────────
  const allVals = valid.flatMap(d => d.points.map(p => p.v));
  const rawMin  = Math.min(...allVals);
  const rawMax  = Math.max(...allVals);
  const range   = rawMax - rawMin;
  const pad     = range > 0 ? range * 0.2 : (rawMin * 0.05 || 0.5);
  const yMin    = rawMin - pad;
  const yMax    = rawMax + pad;

  // Smart decimal precision so small ranges (e.g. 100.0–100.7) show distinct labels
  const tickRange = yMax - yMin;
  const magnitude = tickRange / 5;
  const decimals  = magnitude >= 10  ? 0
                  : magnitude >= 1   ? 1
                  : magnitude >= 0.1 ? 2
                  :                    3;
  const fmtTick = v => v.toFixed(decimals);

  // ── X-axis ─────────────────────────────────────────────────
  const longestDs = valid.reduce((a, b) => a.points.length >= b.points.length ? a : b);
  const xLabels   = longestDs.points.map(p => p.label);
  const xCount    = xLabels.length;

  const xPos = i => PAD.left + (xCount <= 1 ? cW / 2 : (i / (xCount - 1)) * cW);
  const yPos = v => PAD.top  + cH - ((v - yMin) / (yMax - yMin)) * cH;

  // ── Gridlines & axis labels ────────────────────────────────
  const yTicks = 5;
  let gridLines = '', yAxisLabels = '';
  for (let i = 0; i <= yTicks; i++) {
    const v = yMin + (yMax - yMin) * (i / yTicks);
    const y = yPos(v);
    gridLines    += `<line x1="${PAD.left}" y1="${y}" x2="${PAD.left + cW}" y2="${y}" stroke="rgba(168,216,234,0.07)" stroke-width="1"/>`;
    yAxisLabels  += `<text x="${PAD.left - 8}" y="${y + 4}" fill="rgba(168,216,234,0.35)" font-family="DM Mono,monospace" font-size="10" text-anchor="end">${fmtTick(v)}</text>`;
  }

  let xAxisLabels = '';
  const step = xCount <= 8 ? 1 : Math.ceil(xCount / 8);
  for (let i = 0; i < xCount; i += step) {
    xAxisLabels += `<text x="${xPos(i)}" y="${PAD.top + cH + 20}" fill="rgba(168,216,234,0.35)" font-family="DM Mono,monospace" font-size="9" text-anchor="middle">${xLabels[i]}</text>`;
  }

  // ── Paths, dots, tooltips ──────────────────────────────────
  let paths = '', dots = '', areas = '', tooltipTargets = '';

  valid.forEach(ds => {
    const pts = ds.points;
    if (pts.length === 0) return;

    const coords = pts.map((p, i) => {
      const xi = xLabels.indexOf(p.label);
      const x  = xi >= 0 ? xPos(xi) : xPos(i);
      return { x, y: yPos(p.v), v: p.v, label: p.label };
    });

    // Area fill
    let areaD = `M ${coords[0].x} ${PAD.top + cH} L ${coords[0].x} ${coords[0].y}`;
    if (coords.length === 1) {
      areaD += ` L ${coords[0].x} ${PAD.top + cH} Z`;
    } else {
      for (let i = 1; i < coords.length; i++) {
        const prev = coords[i - 1], curr = coords[i];
        const cpx1 = prev.x + (curr.x - prev.x) / 3;
        const cpx2 = curr.x - (curr.x - prev.x) / 3;
        areaD += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
      }
      areaD += ` L ${coords[coords.length - 1].x} ${PAD.top + cH} Z`;
    }

    // Line
    let lineD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1], curr = coords[i];
      const cpx1 = prev.x + (curr.x - prev.x) / 3;
      const cpx2 = curr.x - (curr.x - prev.x) / 3;
      lineD += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const gradId = `grad_${ds.key || ds.label.replace(/\W/g, '_')}`;

    areas += `
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="${ds.color}" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="${ds.color}" stop-opacity="0.01"/>
        </linearGradient>
      </defs>
      <path d="${areaD}" fill="url(#${gradId})"/>`;

    paths += `<path d="${lineD}" fill="none" stroke="${ds.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>`;

    coords.forEach(c => {
      dots += `<circle cx="${c.x}" cy="${c.y}" r="4" fill="${ds.color}" stroke="#0b1a2e" stroke-width="2"/>`;
      tooltipTargets += `
        <g class="chart-point" data-val="${c.v}" data-label="${c.label}" data-metric="${ds.label}" data-color="${ds.color}">
          <circle cx="${c.x}" cy="${c.y}" r="14" fill="transparent" style="cursor:pointer"/>
        </g>`;
    });
  });

  // ── Legend ─────────────────────────────────────────────────
  let legendHTML = '';
  if (showLegend && valid.length > 1) {
    legendHTML = `<div class="chart-legend">` +
      valid.map(d => `<div class="chart-legend-item"><div class="chart-legend-dot" style="background:${d.color}"></div>${d.label}</div>`).join('') +
      `</div>`;
  }

  // ── Assemble SVG ───────────────────────────────────────────
  const tooltipId = `tt_${canvasId}`;
  const svgHTML = `
    <div class="svg-chart-wrap" style="position:relative;">
      <svg width="100%" viewBox="0 0 ${W} ${height}" style="overflow:visible;display:block;">
        ${gridLines}
        <line x1="${PAD.left}" y1="${PAD.top}" x2="${PAD.left}" y2="${PAD.top + cH}" stroke="rgba(168,216,234,0.15)" stroke-width="1"/>
        <line x1="${PAD.left}" y1="${PAD.top + cH}" x2="${PAD.left + cW}" y2="${PAD.top + cH}" stroke="rgba(168,216,234,0.15)" stroke-width="1"/>
        ${yAxisLabels}
        ${xAxisLabels}
        ${areas}
        ${paths}
        ${dots}
        ${tooltipTargets}
      </svg>
      <div id="${tooltipId}" style="
        display:none; position:absolute; pointer-events:none;
        background:rgba(11,26,46,0.95); border:1px solid rgba(168,216,234,0.25);
        border-radius:5px; padding:8px 14px; font-family:DM Mono,monospace;
        font-size:11px; color:#e8f4f8; white-space:nowrap; z-index:99;
        box-shadow:0 4px 20px rgba(0,0,0,0.4);
      "></div>
      ${legendHTML}
    </div>`;

  wrap.insertAdjacentHTML('beforeend', svgHTML);

  // ── Tooltip interaction ────────────────────────────────────
  const ttEl = document.getElementById(tooltipId);
  wrap.querySelectorAll('.chart-point').forEach(pt => {
    pt.addEventListener('mouseenter', () => {
      const rect   = wrap.getBoundingClientRect();
      const ptRect = pt.querySelector('circle').getBoundingClientRect();
      ttEl.innerHTML = `<span style="color:${pt.dataset.color}">●</span> <strong style="color:#fff">${pt.dataset.val}</strong> <span style="color:rgba(168,216,234,0.6)">${pt.dataset.metric}</span><br><span style="color:rgba(168,216,234,0.4);font-size:10px;">${pt.dataset.label}</span>`;
      ttEl.style.display = 'block';
      const x = ptRect.left - rect.left + 10;
      const y = ptRect.top  - rect.top  - 60;
      ttEl.style.left = Math.max(0, Math.min(x, wrap.clientWidth - 160)) + 'px';
      ttEl.style.top  = Math.max(0, y) + 'px';
    });
    pt.addEventListener('mouseleave', () => { ttEl.style.display = 'none'; });
  });
}
