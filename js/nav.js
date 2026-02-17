/* ============================================================
   nav.js — top-level page tabs + month tab navigation
   ============================================================ */

function showPage(page) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.page-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.getElementById('ptab-' + page).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Render charts when switching to tracker so SVG width is calculated correctly
  if (page === 'tracker') renderBenchmarks();
}

function showMonth(num) {
  document.querySelectorAll('.month-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.month-nav .month-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('month-' + num).classList.add('active');
  document.querySelectorAll('.month-nav .month-btn')[num - 1].classList.add('active');
  document.querySelector('.month-nav').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
