/* ============================================================
   nav.js — top-level page tabs + month tab navigation
   ============================================================ */

const PHASE_BASICS = {
  1: '1–2',
  2: '3–4',
  3: '5–6',
  4: '7–8',
};

function showPage(page) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.page-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.getElementById('ptab-' + page).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Render charts when switching to tracker so SVG width is calculated correctly
  if (page === 'tracker') renderBenchmarks();
}

// Off-ice training plan phase tabs
function showMonth(num) {
  document.querySelectorAll('.month-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.month-nav .month-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('month-' + num).classList.add('active');
  document.querySelectorAll('.month-nav .month-btn')[num - 1].classList.add('active');
  document.querySelector('.month-nav').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Update the overview strip's Basics Levels number
  const basicsEl = document.getElementById('overview-basics-num');
  if (basicsEl) basicsEl.textContent = PHASE_BASICS[num] || '1–2';
}

// On-ice program phase tabs
function showOnIceMonth(num) {
  document.querySelectorAll('#page-onice .month-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#onice-month-nav .month-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('onice-' + num).classList.add('active');
  document.querySelectorAll('#onice-month-nav .month-btn')[num - 1].classList.add('active');
  document.getElementById('onice-month-nav').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Update the on-ice overview strip's Basics Levels number
  const basicsEl = document.getElementById('onice-basics-num');
  if (basicsEl) basicsEl.textContent = PHASE_BASICS[num] || '1–2';
}
