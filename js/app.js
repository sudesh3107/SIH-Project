var currentSection = 'home';
var currentLesson = 0;
var currentSignIndex = 0;
var currentFilterCategory = 'all';
var practiceScore = 0;
var practiceStreak = 0;
var practiceQuestion = null;

var sections = ['home', 'learn', 'dictionary', 'pdf', 'speech', 'subtitles', 'practice', 'quizzes', 'results', 'dashboard'];

function initApp() {
  loadPreferences();
  initSpeech();
  initSTT();
  try { if (typeof initPdfStudio === 'function') initPdfStudio(); } catch(e){ console.warn('pdfStudio init error', e); }
  try { if (typeof initQuizModule === 'function') initQuizModule(); } catch(e){ console.warn('quizModule init error', e); }
  // avatar3d.js is an ES module (deferred). It exposes window.initAvatar.
  // DOMContentLoaded fires after modules, so it should exist — fall back
  // to bare init() for older cached copies.
  try {
    if (typeof window.initAvatar === 'function') window.initAvatar();
    else if (typeof window.init === 'function') window.init();
    else if (typeof init === 'function') init();
    else console.warn('Avatar init not found (module may have failed to load)');
  } catch (e) {
    console.warn('Avatar init error:', e);
  }
  buildLessonTabs();
  buildDictionary();
  buildDashboard();
  try { loadPracticeProgress(); } catch(e){}
  showSection('home');
}

function showSection(section) {
  // alias: progress -> dashboard
  if (section === 'progress') section = 'dashboard';
  document.querySelectorAll('.nav-link').forEach(function(l) {
    l.classList.toggle('active', l.dataset.section === section);
  });
  currentSection = section;
  document.querySelectorAll('section[id^="sec-"]').forEach(function(s) {
    s.style.display = 'none';
  });
  var sec = document.getElementById('sec-' + section);
  // fallback for old id
  if (!sec && section === 'dashboard') sec = document.getElementById('sec-progress');
  if (sec) sec.style.display = 'block';
  if (section === 'learn') {
    currentSignIndex = 0;
    buildLessonTabs();
    loadCurrentLessonSigns();
    // Container was display:none until now, so force a resize + camera
    // fix once layout is available.
    setTimeout(function() {
      try {
        if (typeof window.resizeAvatar === 'function') window.resizeAvatar();
        if (typeof window.focusCamera === 'function') window.focusCamera();
        else if (typeof window.resetCamera === 'function') window.resetCamera();
      } catch (e) { console.warn('Camera fix error:', e); }
    }, 100);
  }
  if (section === 'dictionary') buildDictionary();
  if (section === 'dashboard') buildDashboard();
  if (section === 'pdf') {
    try { if (typeof initPdfStudio === 'function' && !window._pdfInited) { initPdfStudio(); window._pdfInited = true; } } catch(e){}
  }
  if (section === 'quizzes') {
    try { if (typeof buildQuizCatalog === 'function') { buildQuizCatalog(); renderQuizCatalog(); renderQuizStatsMini(); } } catch(e){}
  }
  if (section === 'results') {
    try { if (typeof buildResults === 'function') buildResults(); } catch(e){}
  }
  if (section === 'practice' && typeof generateQuestion === 'function') {
    try { generateQuestion(); } catch(e){}
  }
  // always stop global TTS when switching away from speech/pdf to avoid overlap
  if (section !== 'speech' && section !== 'pdf') {
    try { if (typeof stopTTS === 'function') stopTTS(); } catch(e){}
    try { if (typeof stopPdfAudio === 'function' && currentSection !== 'quizzes' && currentSection !== 'results') { /* keep pdf audio if user wants, but stop if leaving quizzes/results unrelated - no op */ } } catch(e){}
  }
  // pause quiz timer when leaving quizzes (optional)
}

function buildLessonTabs() {
  var container = document.getElementById('lesson-tabs');
  if (!container) return;
  container.innerHTML = '';
  SIGN_DATA.lessons.forEach(function(lesson, i) {
    var tab = document.createElement('button');
    tab.className = 'lesson-tab' + (currentLesson === i ? ' active' : '');
    tab.innerHTML = '<i class="fa-solid fa-book-open"></i> ' + lesson.title;
    tab.onclick = function() { currentLesson = i; currentSignIndex = 0; buildLessonTabs(); loadCurrentLessonSigns(); };
    container.appendChild(tab);
  });
}

function loadCurrentLessonSigns() {
  var lesson = SIGN_DATA.lessons[currentLesson];
  if (!lesson) return;
  currentSignIndex = 0;
  renderSignDisplay(lesson.signs[0]);
}

function renderSignDisplay(key) {
  var data = SIGN_DATA.alphabet[key] || SIGN_DATA.words[key];
  if (!data) return;
  var catEl = document.getElementById('sign-category');
  var nameEl = document.getElementById('sign-name');
  var dispEl = document.getElementById('sign-display');
  var descEl = document.getElementById('sign-desc');
  if (catEl) catEl.textContent = data.category;
  if (nameEl) nameEl.textContent = key;
  if (dispEl) dispEl.textContent = key;
  if (descEl) descEl.textContent = data.desc;
  try {
    if (typeof window.setSign === 'function') window.setSign(key);
    else if (typeof setSign === 'function') setSign(key);
  } catch (e) { console.warn('setSign error:', e); }
}

function navigateSign(dir) {
  var lesson = SIGN_DATA.lessons[currentLesson];
  if (!lesson) return;
  var signs = lesson.signs;
  currentSignIndex = (currentSignIndex + dir + signs.length) % signs.length;
  renderSignDisplay(signs[currentSignIndex]);
}

function playSignAnimation() {
  var lesson = SIGN_DATA.lessons[currentLesson];
  if (!lesson) return;
  var signs = lesson.signs;
  var key = signs[currentSignIndex];
  // Prefer the avatar module's replay (reads lesson state itself),
  // fall back to setSign for older copies.
  try {
    if (key && typeof window.setSign === 'function') window.setSign(key);
    else if (typeof window.playAvatarSignAnimation === 'function') window.playAvatarSignAnimation();
  } catch (e) { console.warn('playSignAnimation error:', e); }
  var container = document.getElementById('avatar-container');
  if (container) {
    container.classList.add('sign-flash');
    setTimeout(function() { container.classList.remove('sign-flash'); }, 500);
  }
}

function buildDictionary() {
  var filtersContainer = document.getElementById('cat-filters');
  var grid = document.getElementById('sign-grid');
  if (!filtersContainer || !grid) return;
  filtersContainer.innerHTML = '';

  var allCatBtn = document.createElement('button');
  allCatBtn.className = 'cat-filter' + (currentFilterCategory === 'all' ? ' active' : '');
  allCatBtn.textContent = 'All';
  allCatBtn.onclick = function() { currentFilterCategory = 'all'; buildDictionary(); };
  filtersContainer.appendChild(allCatBtn);

  SIGN_DATA.categories.forEach(function(cat) {
    var btn = document.createElement('button');
    btn.className = 'cat-filter' + (currentFilterCategory === cat.id ? ' active' : '');
    btn.innerHTML = '<i class="fa-solid ' + cat.icon + '"></i> ' + cat.name;
    btn.onclick = function() { currentFilterCategory = cat.id; buildDictionary(); };
    filtersContainer.appendChild(btn);
  });

  grid.innerHTML = '';
  var allSigns = [];
  Object.entries(SIGN_DATA.alphabet).forEach(function(entry) { allSigns.push({ key: entry[0], data: entry[1] }); });
  Object.entries(SIGN_DATA.words).forEach(function(entry) { allSigns.push({ key: entry[0], data: entry[1] }); });

  var searchInput = document.getElementById('dict-search');
  var search = searchInput ? searchInput.value : '';
  var filtered = allSigns;
  if (currentFilterCategory !== 'all') filtered = filtered.filter(function(s) { return s.data.category === currentFilterCategory; });
  if (search) {
    var q = search.toLowerCase();
    filtered = filtered.filter(function(s) { return s.key.toLowerCase().indexOf(q) !== -1 || s.data.desc.toLowerCase().indexOf(q) !== -1; });
  }

  filtered.forEach(function(item) {
    var card = document.createElement('div');
    card.className = 'sign-card';
    card.innerHTML = '<div class="sign-letter">' + item.key + '</div><div class="sign-word">' + item.key + '</div><div class="sign-desc">' + item.data.desc + '</div>';
    card.onclick = function() { try { if (typeof window.setSign === 'function') window.setSign(item.key); } catch (e) {} showSection('learn'); showToast('Showing sign: ' + item.key, 'info'); };
    grid.appendChild(card);
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;padding:40px;">No signs found matching your search.</p>';
  }
}

function filterDictionary() { buildDictionary(); }

/* =========================================================
   PRACTICE — FIXED: meaningful questions (no answer in question)
   Types:
     - desc2sign (70%): "Which sign matches this description?" → pick sign name
     - sign2desc (20%): "What does this sign mean?" → pick description
     - truefalse (10%): "True or False? Sign X means ..." → True/False
   ========================================================= */
function getAllSignPool() {
  var pool = [];
  Object.entries(SIGN_DATA.alphabet).forEach(function(e){ pool.push({ key: e[0], data: e[1] }); });
  Object.entries(SIGN_DATA.words).forEach(function(e){ pool.push({ key: e[0], data: e[1] }); });
  return pool;
}
function shuffleArr(a){
  var arr = a.slice();
  for(var i=arr.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=arr[i]; arr[i]=arr[j]; arr[j]=t; }
  return arr;
}
function loadPracticeProgress(){
  try {
    var p = loadProgress();
    if(p){
      if(typeof p.score === 'number'){ practiceScore = p.score; }
      if(typeof p.streak === 'number'){ practiceStreak = p.streak; }
    }
  }catch(e){}
  var scoreEl = document.getElementById('practice-score');
  var streakEl = document.getElementById('practice-streak');
  if(scoreEl) scoreEl.textContent = 'Score: ' + practiceScore;
  if(streakEl) streakEl.textContent = 'Streak: ' + practiceStreak;
}

function generateQuestion() {
  loadPracticeProgress();
  var pool = getAllSignPool();
  if(!pool.length) return;
  var item = pool[Math.floor(Math.random()*pool.length)];
  var roll = Math.random();
  var qType = roll < 0.70 ? 'desc2sign' : roll < 0.90 ? 'sign2desc' : 'truefalse';

  var qText = document.getElementById('practice-q-text');
  var qHint = document.getElementById('practice-q-hint');
  var qTypeEl = document.getElementById('practice-q-type');
  var container = document.getElementById('practice-options');
  if(!qText || !qHint || !container) return;
  container.innerHTML = '';
  container.className = 'practice-options';

  // reset type badge
  if(qTypeEl){
    var labels = { desc2sign: 'Description → Sign', sign2desc: 'Sign → Meaning', truefalse: 'True / False' };
    var icons = { desc2sign: 'fa-magnifying-glass', sign2desc: 'fa-book-open', truefalse: 'fa-check-double' };
    qTypeEl.innerHTML = '<i class="fa-solid '+(icons[qType]||'fa-circle-question')+'"></i> ' + (labels[qType]||qType);
    qTypeEl.className = 'practice-q-type ' + qType;
  }

  if(qType === 'desc2sign'){
    // Question: description → pick sign name
    var correctKey = item.key;
    var correctData = item.data;
    var distractors = shuffleArr(pool.filter(function(p){ return p.key !== correctKey; })).slice(0,3).map(function(p){ return p.key; });
    var options = shuffleArr([correctKey].concat(distractors));
    var answerIndex = options.indexOf(correctKey);
    practiceQuestion = {
      type: 'desc2sign',
      signKey: correctKey,
      desc: correctData.desc,
      category: correctData.category,
      options: options,
      answer: correctKey,
      answerIndex: answerIndex
    };
    qText.innerHTML = 'Which <span style="color:var(--primary)">sign</span> matches this description?';
    qHint.innerHTML = '<span class="practice-desc-quote">“' + escapeHtml(correctData.desc) + '”</span><br><span class="practice-category">Category: ' + escapeHtml(correctData.category) + '</span>';
    // render sign-name options
    options.forEach(function(opt, idx){
      var btn = document.createElement('button');
      btn.className = 'practice-option';
      btn.dataset.index = idx;
      btn.innerHTML = '<span class="practice-opt-letter">' + escapeHtml(opt) + '</span><span class="practice-opt-sub">' + escapeHtml((pool.find(function(p){return p.key===opt;})||{data:{category:''}}).data.category) + '</span>';
      btn.setAttribute('aria-label', 'Option ' + (idx+1) + ': ' + opt);
      btn.onclick = function(){ checkAnswer(idx); };
      container.appendChild(btn);
    });
  } else if(qType === 'sign2desc'){
    var correctKey2 = item.key;
    var correctDesc2 = item.data.desc;
    var otherDescs = shuffleArr(pool.filter(function(p){ return p.key !== correctKey2; })).slice(0,3).map(function(p){ return p.data.desc; });
    var options2 = shuffleArr([correctDesc2].concat(otherDescs));
    var answerIndex2 = options2.indexOf(correctDesc2);
    practiceQuestion = {
      type: 'sign2desc',
      signKey: correctKey2,
      desc: correctDesc2,
      category: item.data.category,
      options: options2,
      answer: correctDesc2,
      answerIndex: answerIndex2
    };
    qText.innerHTML = 'What does the sign <span class="practice-sign-inline">“' + escapeHtml(correctKey2) + '”</span> mean?';
    qHint.innerHTML = 'Choose the correct description • Category: ' + escapeHtml(item.data.category);
    container.classList.add('desc-options');
    options2.forEach(function(opt, idx){
      var btn = document.createElement('button');
      btn.className = 'practice-option desc';
      btn.dataset.index = idx;
      btn.innerHTML = '<span class="practice-opt-desc">' + escapeHtml(opt) + '</span>';
      btn.setAttribute('aria-label', 'Option ' + (idx+1));
      btn.onclick = function(){ checkAnswer(idx); };
      container.appendChild(btn);
    });
  } else {
    // true/false
    var isTrue = Math.random() < 0.5;
    var shownKey = item.key;
    var shownDesc = item.data.desc;
    var shownCategory = item.data.category;
    if(!isTrue){
      var other = shuffleArr(pool.filter(function(p){ return p.key !== shownKey; }))[0];
      if(other) shownDesc = other.data.desc;
    }
    var correctTF = isTrue ? 'True' : 'False';
    var optionsTF = ['True','False'];
    var answerIndexTF = isTrue ? 0 : 1;
    practiceQuestion = {
      type: 'truefalse',
      signKey: item.key,
      desc: item.data.desc,
      shownKey: shownKey,
      shownDesc: shownDesc,
      category: shownCategory,
      options: optionsTF,
      answer: correctTF,
      answerIndex: answerIndexTF,
      isTrue: isTrue
    };
    qText.innerHTML = 'True or False?';
    qHint.innerHTML = 'Sign <span class="practice-sign-inline">“' + escapeHtml(shownKey) + '”</span> means: <span class="practice-desc-quote">“' + escapeHtml(shownDesc) + '”</span>';
    optionsTF.forEach(function(opt, idx){
      var btn = document.createElement('button');
      btn.className = 'practice-option tf';
      btn.dataset.index = idx;
      btn.innerHTML = '<i class="fa-solid ' + (opt==='True'?'fa-check':'fa-xmark') + '" style="margin-right:8px;"></i>' + opt;
      btn.onclick = function(){ checkAnswer(idx); };
      container.appendChild(btn);
    });
  }

  // Hint / avatar: reset avatar hint if exists
  var hintBtn = document.getElementById('practice-hint-btn');
  if(hintBtn) hintBtn.style.display = 'inline-flex';
  var explainEl = document.getElementById('practice-explain');
  if(explainEl) explainEl.style.display = 'none';
  // Do NOT show correct sign on avatar during question (avoid leaking answer)
  // Optionally set avatar to neutral
  try { if(typeof window.restoreBody === 'function') window.restoreBody(); } catch(e){}
}

function checkAnswer(selectedIndex) {
  if(!practiceQuestion) return;
  var q = practiceQuestion;
  var container = document.getElementById('practice-options');
  if(!container) return;
  var isCorrect = selectedIndex === q.answerIndex;
  // also handle fill case if later added (string compare)
  if(typeof selectedIndex === 'string' && typeof q.answer === 'string'){
    isCorrect = selectedIndex.trim().toLowerCase() === q.answer.trim().toLowerCase();
  }

  // lock all options and mark
  var btns = container.querySelectorAll('.practice-option');
  btns.forEach(function(btn){
    btn.onclick = null;
    btn.style.pointerEvents = 'none';
    var idx = parseInt(btn.dataset.index,10);
    if(idx === q.answerIndex) btn.classList.add('correct');
    else if(idx === selectedIndex && !isCorrect) btn.classList.add('wrong');
  });

  // show explanation + avatar demo of correct sign
  var explainEl = document.getElementById('practice-explain');
  if(explainEl){
    var userChoice = (q.options && typeof selectedIndex==='number') ? q.options[selectedIndex] : selectedIndex;
    var correctChoice = q.options ? q.options[q.answerIndex] : q.answer;
    if(isCorrect){
      explainEl.innerHTML = '<i class="fa-solid fa-circle-check" style="color:var(--success)"></i> <strong style="color:var(--success)">Correct!</strong> — <strong>' + escapeHtml(q.signKey) + '</strong>: “' + escapeHtml(q.desc) + '”';
    } else {
      if(q.type==='desc2sign'){
        explainEl.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color:var(--danger)"></i> <strong style="color:var(--danger)">Wrong.</strong> Correct is <strong>' + escapeHtml(correctChoice) + '</strong> — “' + escapeHtml(q.desc) + '”' + (userChoice ? '<br><span style="color:var(--text-muted)">You chose: ' + escapeHtml(userChoice) + '</span>' : '');
      } else if(q.type==='sign2desc'){
        explainEl.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color:var(--danger)"></i> <strong style="color:var(--danger)">Wrong.</strong> <strong>' + escapeHtml(q.signKey) + '</strong> means “' + escapeHtml(correctChoice) + '”';
      } else {
        explainEl.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color:var(--danger)"></i> <strong style="color:var(--danger)">Wrong.</strong> It is <strong>' + escapeHtml(correctChoice) + '</strong> — ' + (q.isTrue ? 'the description is accurate.' : 'correct: “' + escapeHtml(q.desc) + '”');
      }
    }
    explainEl.style.display = 'block';
  }

  // animate avatar to show correct sign
  try {
    if(typeof window.setSign === 'function') window.setSign(q.signKey);
    else if(typeof setSign === 'function') setSign(q.signKey);
  } catch(e){}

  // speak feedback optionally (reuse speechSynthesis if enabled - no auto, just toast)
  if(isCorrect){
    practiceScore += 10;
    practiceStreak++;
    showToast('Correct! +10 points', 'success');
  } else {
    practiceStreak = 0;
    var msg = q.type==='desc2sign' ? 'Answer: ' + q.answer : q.type==='sign2desc' ? 'Answer: ' + q.signKey : 'Answer: ' + q.answer;
    showToast('Wrong! ' + (q.type==='truefalse' ? ('It is ' + q.answer) : msg), 'error');
  }
  var scoreEl = document.getElementById('practice-score');
  var streakEl = document.getElementById('practice-streak');
  if(scoreEl) scoreEl.textContent = 'Score: ' + practiceScore;
  if(streakEl) streakEl.textContent = 'Streak: ' + practiceStreak;
  saveProgress({ score: practiceScore, streak: practiceStreak });
  // also sync progress grid
  try { if(typeof buildProgress==='function') buildProgress(); } catch(e){}

  // hide hint button after answering
  var hintBtn = document.getElementById('practice-hint-btn');
  if(hintBtn) hintBtn.style.display = 'none';

  setTimeout(generateQuestion, 2200);
}

function showPracticeHint(){
  if(!practiceQuestion) return;
  var q = practiceQuestion;
  var hint = '';
  if(q.type==='desc2sign'){
    hint = 'Hint: starts with “' + q.signKey.charAt(0).toUpperCase() + '” • ' + q.category;
    showToast(hint, 'info');
  } else if(q.type==='sign2desc'){
    hint = 'Hint: ' + q.desc.slice(0, 28) + '...';
    showToast(hint, 'info');
  } else {
    hint = 'Think about category: ' + q.category;
    showToast(hint, 'info');
  }
  // speak hint via TTS if available
  try { if(typeof speakWord==='function') speakWord(hint); } catch(e){}
}

function buildDashboard() {
  var grid = document.getElementById('progress-grid') || document.getElementById('dashboard-grid');
  var grid2 = document.getElementById('dashboard-grid');
  var list = document.getElementById('lesson-list');
  if (!grid || !list) return;

  var progress = loadProgress();
  var score = progress ? progress.score || 0 : 0;
  var streak = progress ? progress.streak || 0 : 0;
  // include quiz history
  var quizCount = 0, quizAvg = 0, quizPoints = 0, totalTime = 0;
  try {
    var hist = JSON.parse(localStorage.getItem('eduaccess_quiz_history')||'[]');
    quizPoints = hist.reduce(function(s,a){return s+a.correct*10;},0);
    quizCount = hist.length;
    quizAvg = quizCount ? Math.round(hist.reduce(function(s,a){return s+a.percent;},0)/quizCount) : 0;
    totalTime = hist.reduce(function(s,a){return s+(a.seconds||0);},0);
    score += quizPoints;
  } catch(e){ quizCount=0; quizAvg=0; quizPoints=0; totalTime=0; }
  // PDF stats
  var pdfWords = 0, pdfPages = 0, pdfHas = false;
  try {
    if(window.pdfText && window.pdfText.length>50){ pdfHas = true; pdfWords = window.pdfText.split(/\s+/).length; pdfPages = window.pdfPageCount||0; }
  } catch(e){}

  var totalLessons = SIGN_DATA.lessons.length;
  var completedLessons = Math.min(Math.floor(score / 50), totalLessons);
  var totalSigns = Object.keys(SIGN_DATA.alphabet).length + Object.keys(SIGN_DATA.words).length;
  var minutes = Math.floor(totalTime/60);

  grid.innerHTML = '';
  var cards = [
    { number: score, label: 'Total Points', sub: 'incl. quizzes', width: Math.min(100, score / 5) + '%', icon:'fa-star' },
    { number: streak, label: 'Streak', sub: streak? streak+' correct in a row':'Play to start streak', icon:'fa-fire' },
    { number: completedLessons + '/' + totalLessons, label: 'Lessons Completed', width: (completedLessons / totalLessons * 100) + '%', icon:'fa-graduation-cap' },
    { number: totalSigns, label: 'Signs Available', icon:'fa-hand' },
    { number: quizCount, label: 'Quizzes Taken', sub: quizAvg? 'avg '+quizAvg+'%': 'No quizzes yet', width: (quizCount? Math.min(100, quizCount*10)+'%': undefined), icon:'fa-clipboard-question' },
    { number: quizAvg? quizAvg+'%':'—', label: 'Quiz Average', width: (quizAvg? quizAvg+'%': undefined), icon:'fa-chart-simple' },
    { number: pdfHas? pdfPages+' pg':'—', label: 'PDF Pages', sub: pdfHas? pdfWords+' words':'No PDF yet', icon:'fa-file-pdf' },
    { number: minutes? minutes+'m':'0m', label: 'Time Practiced', sub: totalTime? (totalTime%60)+'s':'—', icon:'fa-clock' }
  ];
  // keep 6-8 cards responsive; render into primary grid
  cards.forEach(function(card) {
    var div = document.createElement('div');
    div.className = 'progress-card';
    div.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;"><span style="color:var(--primary)"><i class="fa-solid '+(card.icon||'fa-chart-line')+'"></i></span><span style="font-size:0.68rem; font-weight:800; padding:4px 8px; background:#f1f5f9; border-radius:50px; color:var(--text-muted)">'+card.label+'</span></div>' +
      '<div class="progress-number" style="font-size:2rem">'+card.number+'</div>' +
      (card.sub ? '<div class="progress-label" style="font-size:0.82rem; margin-top:2px;">'+card.sub+'</div>' : '<div class="progress-label">'+card.label+'</div>') +
      (card.width ? '<div class="progress-bar"><div class="progress-fill" style="width:' + card.width + '"></div></div>' : '');
    grid.appendChild(div);
  });
  // mirror to dashboard-grid if both exist and are different elements
  if(grid2 && grid2 !== grid){
    grid2.innerHTML = grid.innerHTML;
    grid2.style.display = '';
  }

  list.innerHTML = '';
  SIGN_DATA.lessons.forEach(function(lesson, i) {
    var status = i < completedLessons ? 'done' : i === completedLessons ? 'current' : 'pending';
    var label = status === 'done' ? 'Completed' : status === 'current' ? 'In Progress' : 'Not Started';
    var numContent = status === 'done' ? '<i class="fa-solid fa-check"></i>' : lesson.id;
    var item = document.createElement('div');
    item.className = 'lesson-progress-item';
    item.style.cursor = 'pointer';
    item.title = 'Open ' + lesson.title;
    item.onclick = (function(idx){ return function(){ currentLesson = idx; buildLessonTabs(); showSection('learn'); }; })(i);
    item.innerHTML = '<div class="lesson-num ' + status + '">' + numContent + '</div>' +
      '<div class="lesson-info"><h4>' + lesson.title + '</h4><p>' + lesson.desc + ' &mdash; ' + lesson.signs.length + ' signs &middot; ' + lesson.difficulty + '</p></div>' +
      '<span style="font-size:0.8rem;color:var(--text-muted);font-weight:600;">' + label + '</span>';
    list.appendChild(item);
  });

  // dashboard extra: quick links
  var hist2 = [];
  try { hist2 = JSON.parse(localStorage.getItem('eduaccess_quiz_history')||'[]'); } catch(e){}
  if (hist2.length) {
    var linkRow = document.createElement('div');
    linkRow.style.cssText = 'margin-top:18px; display:flex; gap:10px; flex-wrap:wrap; justify-content:center;';
    linkRow.innerHTML = '<button class="speech-btn primary" onclick="showSection(\'quizzes\')"><i class="fa-solid fa-clipboard-question"></i> Go to Quizzes</button>' +
      '<button class="speech-btn secondary" onclick="showSection(\'results\')"><i class="fa-solid fa-square-poll-vertical"></i> View Results</button>';
    list.appendChild(linkRow);
  }

  // ===== Dashboard-only extras (if elements exist) =====
  // PDF card
  try {
    var pdfStatsEl = document.getElementById('dashboard-pdf-stats');
    if(pdfStatsEl){
      if(pdfHas){
        var fcCount = (window.pdfFlashcards && window.pdfFlashcards.length) || 0;
        var summSent = (window.pdfSummarySentences && window.pdfSummarySentences.length) || 0;
        pdfStatsEl.innerHTML = '<div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:8px;">' +
          '<span style="background:#fef3c7; color:#92400e; padding:4px 10px; border-radius:50px; font-weight:700; font-size:0.8rem;"><i class="fa-solid fa-file-lines"></i> ' + pdfPages + ' pages</span>' +
          '<span style="background:#eef2ff; color:var(--primary); padding:4px 10px; border-radius:50px; font-weight:700; font-size:0.8rem;"><i class="fa-solid fa-align-left"></i> ' + summSent + ' summary pts</span>' +
          '<span style="background:#ecfdf5; color:#065f46; padding:4px 10px; border-radius:50px; font-weight:700; font-size:0.8rem;"><i class="fa-solid fa-layer-group"></i> ' + fcCount + ' flashcards</span>' +
          '</div>' +
          '<div style="font-size:0.85rem; color:var(--text-secondary);">' + escapeHtml((window.pdfFileName||'Document')) + ' • ' + pdfWords + ' words • prepared for study</div>';
      } else {
        pdfStatsEl.textContent = 'No PDF loaded yet. Upload in PDF Studio to see summaries & flashcards here.';
      }
    }
  } catch(e){}

  // Streak
  try {
    var streakEl = document.getElementById('dashboard-streak');
    if(streakEl){
      var level = streak >= 10 ? 'On fire! 🔥' : streak >= 5 ? 'Great momentum!' : streak >= 2 ? 'Keep going!' : 'Start a streak';
      streakEl.innerHTML = '<div style="display:flex; align-items:center; gap:12px;">' +
        '<div style="width:48px; height:48px; border-radius:12px; background:linear-gradient(135deg,#f59e0b,#ef4444); color:white; display:flex; align-items:center; justify-content:center; font-size:1.4rem;"><i class="fa-solid fa-fire"></i></div>' +
        '<div><div style="font-size:1.6rem; font-weight:900; line-height:1;">'+streak+'</div><div style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">current streak • '+level+'</div></div>' +
        '</div>' +
        '<div class="progress-bar" style="margin-top:12px;"><div class="progress-fill" style="width:'+Math.min(100,streak*10)+'%"></div></div>';
    }
  } catch(e){}

  // Chart
  try {
    var chartEl = document.getElementById('dashboard-chart');
    if(chartEl){
      if(quizCount || score){
        var lessonPct = Math.round(completedLessons/totalLessons*100);
        chartEl.innerHTML = '<div style="display:grid; grid-template-columns: repeat(3,1fr); gap:12px; text-align:center;">' +
          '<div><div style="width:64px; height:64px; border-radius:50%; border:6px solid var(--primary); border-top-color:#e2e8f0; transform: rotate('+(lessonPct*3.6)+'deg); margin:0 auto 6px; display:flex; align-items:center; justify-content:center; font-weight:900;">'+lessonPct+'%</div><div style="font-size:0.78rem; font-weight:700; color:var(--text-muted)">Lessons</div></div>' +
          '<div><div style="width:64px; height:64px; border-radius:50%; border:6px solid var(--success); border-top-color:#e2e8f0; transform: rotate('+(quizAvg*3.6)+'deg); margin:0 auto 6px; display:flex; align-items:center; justify-content:center; font-weight:900;">'+quizAvg+'%</div><div style="font-size:0.78rem; font-weight:700; color:var(--text-muted)">Quiz Avg</div></div>' +
          '<div><div style="width:64px; height:64px; border-radius:50%; border:6px solid #f59e0b; border-top-color:#e2e8f0; transform: rotate('+(Math.min(100,streak*10)*3.6)+'deg); margin:0 auto 6px; display:flex; align-items:center; justify-content:center; font-weight:900;">'+streak+'</div><div style="font-size:0.78rem; font-weight:700; color:var(--text-muted)">Streak</div></div>' +
          '</div>';
      } else {
        chartEl.innerHTML = '<p class="pdf-empty" style="text-align:center; padding:10px;">Take lessons & quizzes to build your chart.</p>';
      }
    }
  } catch(e){}

  // Activity
  try {
    var actList = document.getElementById('dashboard-activity-list');
    var actEmpty = document.getElementById('dashboard-activity-empty');
    if(actList){
      hist = hist || [];
      var recent = hist.slice(-5).reverse();
      if(recent.length){
        if(actEmpty) actEmpty.style.display='none';
        actList.innerHTML = recent.map(function(a){
          var col = a.percent>=60? 'var(--success)' : 'var(--danger)';
          return '<div style="display:flex; gap:10px; align-items:center; padding:10px 0; border-bottom:1px solid var(--border);">' +
            '<span style="width:34px; height:34px; border-radius:50%; background:'+ (a.percent>=60?'#ecfdf5':'#fef2f2') +'; color:'+col+'; display:flex; align-items:center; justify-content:center; font-size:0.85rem;"><i class="fa-solid '+(a.type==='pdf'?'fa-file-pdf':'fa-clipboard-question')+'"></i></span>' +
            '<div style="flex:1;"><div style="font-weight:700; font-size:0.9rem;">'+escapeHtml(a.quizTitle)+' <span style="color:'+col+';">• '+a.percent+'%</span></div><div style="font-size:0.78rem; color:var(--text-muted);">'+escapeHtml(a.dateStr)+' • '+a.correct+'/'+a.total+' • '+a.timeStr+'</div></div>' +
            '<button class="speech-btn-sm" onclick="showSection(\'results\'); setTimeout(function(){ reviewAttempt(\''+a.id+'\'); },300)" style="padding:6px 10px; font-size:0.78rem;">Review</button>' +
            '</div>';
        }).join('');
      } else {
        actList.innerHTML = '';
        if(actEmpty) actEmpty.style.display='block';
      }
    }
  } catch(e){}
}
// alias for backward compat
function buildProgress(){ return buildDashboard(); }

// fallback escapeHtml if not yet loaded (pdfStudio defines it)
if(typeof escapeHtml === 'undefined'){
  var escapeHtml = function(s){
    if(!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  };
}
if(typeof escapeRegExp === 'undefined'){
  var escapeRegExp = function(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); };
}

document.addEventListener('DOMContentLoaded', initApp);

window.showSection = showSection;
window.navigateSign = navigateSign;
window.playSignAnimation = playSignAnimation;
window.filterDictionary = filterDictionary;
window.buildDictionary = buildDictionary;
window.generateQuestion = generateQuestion;
window.checkAnswer = checkAnswer;
window.showPracticeHint = showPracticeHint;
window.buildProgress = buildProgress;
window.buildDashboard = buildDashboard;