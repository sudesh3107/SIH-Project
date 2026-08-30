function toggleDyslexia() {
  document.body.classList.toggle('dyslexia-active');
  var btn = document.getElementById('btn-dyslexia');
  if (btn) btn.classList.toggle('active');
  var isActive = btn && btn.classList.contains('active');
  showToast(isActive ? 'Dyslexia mode enabled' : 'Dyslexia mode disabled', 'info');
  savePreference('dyslexia', isActive);
}

function toggleContrast() {
  document.body.classList.toggle('high-contrast-mode');
  var btn = document.getElementById('btn-contrast');
  if (btn) btn.classList.toggle('active');
  var isActive = btn && btn.classList.contains('active');
  showToast(isActive ? 'High contrast mode enabled' : 'High contrast mode disabled', 'info');
  savePreference('contrast', isActive);
}

function adjustFont(step) {
  var body = document.body;
  var currentSize = parseFloat(getComputedStyle(body).fontSize) || 16;
  var newSize = Math.max(12, Math.min(24, currentSize + step));
  body.style.fontSize = newSize + 'px';
  showToast('Font size: ' + newSize + 'px', 'info');
  savePreference('fontSize', newSize);
}

function loadPreferences() {
  try {
    var prefs = JSON.parse(localStorage.getItem('edubridge_prefs') || '{}');
    if (prefs.dyslexia) { toggleDyslexia(); var btn = document.getElementById('btn-dyslexia'); if (btn) btn.classList.add('active'); }
    if (prefs.contrast) { toggleContrast(); var btn2 = document.getElementById('btn-contrast'); if (btn2) btn2.classList.add('active'); }
    if (prefs.fontSize) document.body.style.fontSize = prefs.fontSize + 'px';
  } catch (e) {}
}

function savePreference(key, value) {
  try {
    var prefs = JSON.parse(localStorage.getItem('edubridge_prefs') || '{}');
    prefs[key] = value;
    localStorage.setItem('edubridge_prefs', JSON.stringify(prefs));
  } catch (e) {}
}

function saveProgress(data) {
  try { localStorage.setItem('edubridge_progress', JSON.stringify(data)); } catch (e) {}
}

function loadProgress() {
  try { return JSON.parse(localStorage.getItem('edubridge_progress') || 'null'); } catch (e) { return null; }
}

function showToast(message, type) {
  type = type || 'info';
  var container = document.getElementById('toast-container');
  if (!container) return;
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  toast.innerHTML = '<i class="fa-solid ' + (icons[type] || icons.info) + '"></i> ' + message;
  container.appendChild(toast);
  setTimeout(function() { toast.style.opacity = '0'; toast.style.transform = 'translateX(-100%)'; toast.style.transition = 'all 0.3s'; }, 2700);
  setTimeout(function() { if (toast.parentNode) toast.remove(); }, 3000);
}

window.toggleDyslexia = toggleDyslexia;
window.toggleContrast = toggleContrast;
window.adjustFont = adjustFont;
window.loadPreferences = loadPreferences;
window.savePreference = savePreference;
window.saveProgress = saveProgress;
window.loadProgress = loadProgress;
window.showToast = showToast;