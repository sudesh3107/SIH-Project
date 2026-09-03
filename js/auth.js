/* =========================================================
   EduAccess - Auth (Login / Registration) - Client Demo
   Stores users in localStorage (eduaccess_users) + session
   eduaccess_current_user. Passwords are hashed with simple
   base64+salt for demo only - NOT for production.
   ========================================================= */

var LS_USERS = 'eduaccess_users';
var LS_CURRENT = 'eduaccess_current_user';
var LS_REMEMBER = 'eduaccess_remember_email';

// --- helpers ---
function hashPassword(pwd){
  // NOT secure - demo only. Real app should use bcrypt on server.
  try { return btoa(unescape(encodeURIComponent(pwd + '::eduaccess_salt'))); } catch(e){ return btoa(pwd); }
}
function validateEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}
function validatePassword(pwd){
  // At least 6 chars, one letter and one number for moderate strength
  if(!pwd || pwd.length < 6) return 'Password must be at least 6 characters.';
  if(pwd.length > 64) return 'Password too long.';
  return null;
}
function getUsers(){
  try { return JSON.parse(localStorage.getItem(LS_USERS) || '[]'); } catch(e){ return []; }
}
function saveUsers(arr){
  try { localStorage.setItem(LS_USERS, JSON.stringify(arr)); } catch(e){}
}
function getCurrentUser(){
  try { return JSON.parse(localStorage.getItem(LS_CURRENT) || 'null'); } catch(e){ return null; }
}
function setCurrentUser(u){
  try {
    if(u) localStorage.setItem(LS_CURRENT, JSON.stringify(u));
    else localStorage.removeItem(LS_CURRENT);
  } catch(e){}
}
function isLoggedIn(){ return !!getCurrentUser(); }

// Demo seed: create a demo user if none exists
function seedDemoUser(){
  var users = getUsers();
  if(users.length===0){
    var demo = {
      id: 'u_demo_' + Date.now(),
      name: 'Demo Learner',
      email: 'demo@eduaccess.local',
      passwordHash: hashPassword('demo123'),
      createdAt: new Date().toISOString(),
      avatarColor: '#6366f1',
      role: 'learner'
    };
    users.push(demo);
    saveUsers(users);
  }
}

// --- UI ---
function initAuth(){
  seedDemoUser();
  updateNavbarAuth();
  // Auto-show auth if not logged in and trying to access protected? We keep home open.
  // Prefill remembered email
  try{
    var remembered = localStorage.getItem(LS_REMEMBER);
    if(remembered){
      var em = document.getElementById('login-email');
      var rm = document.getElementById('login-remember');
      if(em) em.value = remembered;
      if(rm) rm.checked = true;
    }
  } catch(e){}
  // Close modal on Esc / outside click
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape') hideAuthModal();
  });
  var overlay = document.getElementById('auth-overlay');
  if(overlay){
    overlay.addEventListener('click', function(e){
      if(e.target===overlay) hideAuthModal();
    });
  }
  // If user is logged in, show their name in dashboard subtitle etc.
  refreshUserGreeting();
}

function updateNavbarAuth(){
  var user = getCurrentUser();
  var nav = document.querySelector('.navbar-nav');
  // Remove old auth nodes if re-render
  var oldAuth = document.getElementById('nav-auth-area');
  if(oldAuth) oldAuth.remove();
  var oldMobile = document.getElementById('mobile-auth-bar');
  if(oldMobile) oldMobile.remove();

  var authArea = document.createElement('div');
  authArea.id = 'nav-auth-area';
  authArea.style.display='flex';
  authArea.style.alignItems='center';
  authArea.style.gap='8px';
  authArea.style.marginLeft='10px';
  authArea.style.paddingLeft='10px';
  authArea.style.borderLeft='1px solid var(--border)';

  if(user){
    var avatar = document.createElement('div');
    avatar.style.width='36px'; avatar.style.height='36px'; avatar.style.borderRadius='50%';
    avatar.style.background = user.avatarColor || '#6366f1';
    avatar.style.color='white'; avatar.style.display='flex'; avatar.style.alignItems='center'; avatar.style.justifyContent='center';
    avatar.style.fontWeight='800'; avatar.style.fontSize='0.9rem'; avatar.style.cursor='pointer';
    avatar.title = user.name + ' ('+user.email+')';
    avatar.textContent = (user.name||user.email||'?').trim().charAt(0).toUpperCase();
    avatar.onclick = function(){ showSection('dashboard'); showToast('Hi '+user.name+'!','info'); };

    var nameWrap = document.createElement('div');
    nameWrap.style.display='flex'; nameWrap.style.flexDirection='column'; nameWrap.style.lineHeight='1.1';
    nameWrap.style.cursor='pointer';
    nameWrap.onclick = function(){ showSection('dashboard'); };
    nameWrap.innerHTML = '<span style="font-size:0.82rem; font-weight:800; max-width:110px; overflow:hidden; textOverflow:ellipsis; whiteSpace:nowrap;">'+escapeHtml(user.name||'User')+'</span><span style="font-size:0.68rem; color:var(--text-muted);">'+escapeHtml(user.email)+'</span>';

    var logoutBtn = document.createElement('button');
    logoutBtn.className='speech-btn-sm';
    logoutBtn.style.padding='6px 10px';
    logoutBtn.innerHTML='<i class="fa-solid fa-right-from-bracket"></i> Logout';
    logoutBtn.onclick = logout;

    authArea.appendChild(avatar);
    authArea.appendChild(nameWrap);
    authArea.appendChild(logoutBtn);
  } else {
    var loginBtn = document.createElement('button');
    loginBtn.className='speech-btn-sm';
    loginBtn.style.background='var(--primary)'; loginBtn.style.color='white'; loginBtn.style.borderColor='var(--primary)';
    loginBtn.innerHTML='<i class="fa-solid fa-right-to-bracket"></i> Login';
    loginBtn.onclick = function(){ showAuthModal('login'); };

    var regBtn = document.createElement('button');
    regBtn.className='speech-btn-sm';
    regBtn.innerHTML='<i class="fa-solid fa-user-plus"></i> Register';
    regBtn.onclick = function(){ showAuthModal('register'); };

    authArea.appendChild(loginBtn);
    authArea.appendChild(regBtn);
  }

  if(nav) nav.appendChild(authArea);

  // Also update hero buttons if not logged in -> show CTA to login
  var heroCta = document.getElementById('hero-auth-cta');
  if(heroCta){
    if(user){
      heroCta.innerHTML = '<span style="display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.2); padding:8px 14px; border-radius:50px; font-size:0.85rem; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Signed in as '+escapeHtml(user.name)+' • <a href="#" onclick="showSection(\'dashboard\');return false;" style="color:white; text-decoration:underline;">Go to Dashboard</a></span>';
      heroCta.style.display='block';
    } else {
      heroCta.innerHTML = '<button class="btn-primary" onclick="showAuthModal(\'register\')" style="background:white; color:var(--primary);"><i class="fa-solid fa-user-plus"></i> Create free account</button> <button class="btn-secondary" onclick="showAuthModal(\'login\')" style="margin-left:8px;"><i class="fa-solid fa-right-to-bracket"></i> Login</button> <div style="margin-top:10px; font-size:0.78rem; opacity:0.85;">Demo: demo@eduaccess.local / demo123</div>';
      heroCta.style.display='block';
    }
  }

  refreshUserGreeting();
}

function refreshUserGreeting(){
  var user = getCurrentUser();
  var els = document.querySelectorAll('[data-user-greeting]');
  els.forEach(function(el){
    if(user){
      el.textContent = 'Hi, ' + (user.name.split(' ')[0] || 'there') + '!';
      el.style.display='';
    } else {
      el.style.display='none';
    }
  });
  var dashTitle = document.getElementById('dashboard-user-title');
  if(dashTitle){
    if(user) dashTitle.textContent = 'Welcome back, ' + user.name.split(' ')[0] + ' 👋';
    else dashTitle.textContent = 'Dashboard';
  }
}

function showAuthModal(mode){
  mode = mode==='register' ? 'register' : 'login';
  var overlay = document.getElementById('auth-overlay');
  if(!overlay) return;
  overlay.style.display='flex';
  document.body.style.overflow='hidden';
  switchAuthTab(mode);
  // Focus first input
  setTimeout(function(){
    var inp = document.getElementById(mode==='login' ? 'login-email' : 'reg-name');
    if(inp) inp.focus();
  }, 80);
  // Clear errors
  hideAuthError('login'); hideAuthError('register');
}

function hideAuthModal(){
  var overlay = document.getElementById('auth-overlay');
  if(!overlay) return;
  overlay.style.display='none';
  document.body.style.overflow='';
}

function switchAuthTab(mode){
  var loginTab = document.getElementById('auth-tab-login');
  var regTab = document.getElementById('auth-tab-register');
  var loginPane = document.getElementById('auth-pane-login');
  var regPane = document.getElementById('auth-pane-register');
  if(!loginTab || !regTab || !loginPane || !regPane) return;
  if(mode==='register'){
    loginTab.classList.remove('active'); regTab.classList.add('active');
    loginPane.style.display='none'; regPane.style.display='block';
  } else {
    regTab.classList.remove('active'); loginTab.classList.add('active');
    regPane.style.display='none'; loginPane.style.display='block';
  }
  hideAuthError('login'); hideAuthError('register');
}

function showAuthError(which, msg){
  var el = document.getElementById(which==='register' ? 'reg-error' : 'login-error');
  if(!el) return;
  if(!msg){ el.style.display='none'; el.textContent=''; return; }
  el.textContent = msg;
  el.style.display='block';
}
function hideAuthError(which){ showAuthError(which, ''); }

// --- Handlers ---
function handleRegister(e){
  if(e) e.preventDefault();
  var nameEl = document.getElementById('reg-name');
  var emailEl = document.getElementById('reg-email');
  var pwdEl = document.getElementById('reg-password');
  var cpwdEl = document.getElementById('reg-confirm');
  var btn = document.getElementById('reg-submit');
  var name = nameEl ? nameEl.value.trim() : '';
  var email = emailEl ? emailEl.value.trim().toLowerCase() : '';
  var pwd = pwdEl ? pwdEl.value : '';
  var cpwd = cpwdEl ? cpwdEl.value : '';

  if(!name || name.length < 2) return showAuthError('register','Please enter your full name (at least 2 characters).');
  if(!validateEmail(email)) return showAuthError('register','Please enter a valid email address.');
  var pwdErr = validatePassword(pwd);
  if(pwdErr) return showAuthError('register', pwdErr);
  if(pwd !== cpwd) return showAuthError('register','Passwords do not match.');

  var users = getUsers();
  if(users.some(function(u){ return u.email.toLowerCase()===email; })){
    return showAuthError('register','An account with this email already exists. Try logging in.');
  }

  if(btn){ btn.disabled=true; btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Creating...'; }

  // Simulate network delay
  setTimeout(function(){
    var newUser = {
      id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
      name: name,
      email: email,
      passwordHash: hashPassword(pwd),
      createdAt: new Date().toISOString(),
      avatarColor: ['#6366f1','#06b6d4','#10b981','#f59e0b','#ec4899','#8b5cf6'][Math.floor(Math.random()*6)],
      role: 'learner'
    };
    users.push(newUser);
    saveUsers(users);
    setCurrentUser({ id:newUser.id, name:newUser.name, email:newUser.email, avatarColor:newUser.avatarColor, role:newUser.role, createdAt:newUser.createdAt });
    updateNavbarAuth();
    hideAuthModal();
    showToast('Welcome, '+newUser.name+'! Registration successful.','success');
    // Clear form
    if(nameEl) nameEl.value=''; if(emailEl) emailEl.value=''; if(pwdEl) pwdEl.value=''; if(cpwdEl) cpwdEl.value='';
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-user-plus"></i> Create account'; }
    // Refresh dashboard to show personal data
    try{ if(typeof buildDashboard==='function') buildDashboard(); }catch(e){}
    // If user was gated, redirect to intended section
    var intended = window._authIntendedSection;
    if(intended){ showSection(intended); window._authIntendedSection=null; }
    else showSection('dashboard');
  }, 650);
  return false;
}

function handleLogin(e){
  if(e) e.preventDefault();
  var emailEl = document.getElementById('login-email');
  var pwdEl = document.getElementById('login-password');
  var rememberEl = document.getElementById('login-remember');
  var btn = document.getElementById('login-submit');
  var email = emailEl ? emailEl.value.trim().toLowerCase() : '';
  var pwd = pwdEl ? pwdEl.value : '';

  if(!validateEmail(email)) return showAuthError('login','Please enter a valid email.');
  if(!pwd) return showAuthError('login','Please enter your password.');

  var users = getUsers();
  var user = users.find(function(u){ return u.email.toLowerCase()===email; });
  if(!user) return showAuthError('login','No account found for this email. Please register first.');
  if(user.passwordHash !== hashPassword(pwd)){
    return showAuthError('login','Incorrect password. Try again or use demo: demo123');
  }

  if(btn){ btn.disabled=true; btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Signing in...'; }

  setTimeout(function(){
    setCurrentUser({ id:user.id, name:user.name, email:user.email, avatarColor:user.avatarColor, role:user.role, createdAt:user.createdAt });
    try{
      if(rememberEl && rememberEl.checked) localStorage.setItem(LS_REMEMBER, email);
      else localStorage.removeItem(LS_REMEMBER);
    }catch(e){}
    updateNavbarAuth();
    hideAuthModal();
    showToast('Welcome back, '+user.name+'!','success');
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-right-to-bracket"></i> Login'; }
    try{ if(typeof buildDashboard==='function') buildDashboard(); }catch(e){}
    var intended = window._authIntendedSection;
    if(intended){ showSection(intended); window._authIntendedSection=null; }
    else showSection('dashboard');
  }, 550);
  return false;
}

function logout(){
  var user = getCurrentUser();
  setCurrentUser(null);
  updateNavbarAuth();
  showToast(user ? 'Signed out. See you soon, '+user.name+'!' : 'Signed out.','info');
  // Optionally clear per-user temp? Keep users.
  try{ if(typeof buildDashboard==='function') buildDashboard(); }catch(e){}
  showSection('home');
}

// Gate: require login for protected sections
var PROTECTED_SECTIONS = ['detect','pdf','practice','quizzes','results','dashboard'];

function checkAuthForSection(section){
  if(PROTECTED_SECTIONS.indexOf(section)===-1) return true;
  if(isLoggedIn()) return true;
  // Not logged in -> prompt
  window._authIntendedSection = section;
  showAuthModal('login');
  showToast('Please login or register to use '+section+'','info');
  return false;
}

// Also expose per-user namespaced storage helpers (optional)
function getUserKey(base){
  var u = getCurrentUser();
  if(!u) return base;
  return base + '__' + u.id;
}
function getUserData(key, defVal){
  var k = getUserKey(key);
  try{
    var v = localStorage.getItem(k);
    if(v!==null) return JSON.parse(v);
    // Fallback to global key for migration
    var gv = localStorage.getItem(key);
    if(gv!==null) return JSON.parse(gv);
  }catch(e){}
  return defVal;
}
function setUserData(key, val){
  var k = getUserKey(key);
  try{ localStorage.setItem(k, JSON.stringify(val)); }catch(e){}
}

function toggleAuthEye(inputId, btn){
  var inp = document.getElementById(inputId);
  if(!inp) return;
  var isPwd = inp.type === 'password';
  inp.type = isPwd ? 'text' : 'password';
  if(btn) btn.innerHTML = isPwd ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
}
function fillDemo(){
  var em = document.getElementById('login-email');
  var pw = document.getElementById('login-password');
  if(em) em.value = 'demo@eduaccess.local';
  if(pw) pw.value = 'demo123';
  showToast('Demo credentials filled — click Login','info');
  if(pw) pw.focus();
}

// Init on DOM ready will be called from app.js

// Expose
window.initAuth = initAuth;
window.showAuthModal = showAuthModal;
window.hideAuthModal = hideAuthModal;
window.switchAuthTab = switchAuthTab;
window.handleRegister = handleRegister;
window.handleLogin = handleLogin;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.isLoggedIn = isLoggedIn;
window.checkAuthForSection = checkAuthForSection;
window.getUserKey = getUserKey;
window.getUserData = getUserData;
window.setUserData = setUserData;
window.hashPassword = hashPassword;
window.toggleAuthEye = toggleAuthEye;
window.fillDemo = fillDemo;
