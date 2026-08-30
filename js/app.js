var currentSection = 'home';
var currentLesson = 0;
var currentSignIndex = 0;
var currentFilterCategory = 'all';
var practiceScore = 0;
var practiceStreak = 0;
var practiceQuestion = null;

var sections = ['home', 'learn', 'dictionary', 'speech', 'subtitles', 'practice', 'progress'];

function initApp() {
  loadPreferences();
  initSpeech();
  initSTT();
  init();
  buildLessonTabs();
  buildDictionary();
  buildProgress();
  showSection('home');
}

function showSection(section) {
  document.querySelectorAll('.nav-link').forEach(function(l) {
    l.classList.toggle('active', l.dataset.section === section);
  });
  currentSection = section;
  document.querySelectorAll('section[id^="sec-"]').forEach(function(s) {
    s.style.display = 'none';
  });
  var sec = document.getElementById('sec-' + section);
  if (sec) sec.style.display = 'block';
  if (section === 'learn') {
    currentSignIndex = 0;
    buildLessonTabs();
    loadCurrentLessonSigns();
    setTimeout(function() { focusCamera(); }, 100);
  }
  if (section === 'dictionary') buildDictionary();
  if (section === 'progress') buildProgress();
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
  setSign(key);
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
  if (key) setSign(key);
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
    card.onclick = function() { setSign(item.key); showSection('learn'); showToast('Showing sign: ' + item.key, 'info'); };
    grid.appendChild(card);
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;padding:40px;">No signs found matching your search.</p>';
  }
}

function filterDictionary() { buildDictionary(); }

function generateQuestion() {
  var allKeys = Object.keys(SIGN_DATA.alphabet);
  var correctKey = allKeys[Math.floor(Math.random() * allKeys.length)];
  var correctData = SIGN_DATA.alphabet[correctKey];
  var wrongKeys = allKeys.filter(function(k) { return k !== correctKey; }).sort(function() { return Math.random() - 0.5; }).slice(0, 3);
  var options = [correctKey].concat(wrongKeys).sort(function() { return Math.random() - 0.5; });

  practiceQuestion = { correctKey: correctKey, options: options };
  var qText = document.getElementById('practice-q-text');
  var qHint = document.getElementById('practice-q-hint');
  if (qText) qText.textContent = 'What sign is "' + correctKey + '"?';
  if (qHint) qHint.textContent = correctData.desc;

  var container = document.getElementById('practice-options');
  if (!container) return;
  container.innerHTML = '';
  options.forEach(function(opt) {
    var btn = document.createElement('button');
    btn.className = 'practice-option';
    btn.textContent = opt;
    btn.onclick = function() { checkAnswer(opt, correctKey, btn); };
    container.appendChild(btn);
  });
}

function checkAnswer(selected, correct, btnEl) {
  var options = document.querySelectorAll('.practice-option');
  options.forEach(function(btn) {
    btn.onclick = null;
    if (btn.textContent === correct) btn.className = 'practice-option correct';
    if (btn.textContent === selected && selected !== correct) btn.className = 'practice-option wrong';
  });

  if (selected === correct) {
    practiceScore += 10;
    practiceStreak++;
    showToast('Correct! +10 points', 'success');
  } else {
    practiceStreak = 0;
    showToast('Wrong! The answer was ' + correct, 'error');
  }
  var scoreEl = document.getElementById('practice-score');
  var streakEl = document.getElementById('practice-streak');
  if (scoreEl) scoreEl.textContent = 'Score: ' + practiceScore;
  if (streakEl) streakEl.textContent = 'Streak: ' + practiceStreak;
  saveProgress({ score: practiceScore, streak: practiceStreak });
  setTimeout(generateQuestion, 1500);
}

function buildProgress() {
  var grid = document.getElementById('progress-grid');
  var list = document.getElementById('lesson-list');
  if (!grid || !list) return;

  var progress = loadProgress();
  var score = progress ? progress.score || 0 : 0;
  var streak = progress ? progress.streak || 0 : 0;
  var totalLessons = SIGN_DATA.lessons.length;
  var completedLessons = Math.min(Math.floor(score / 50), totalLessons);
  var totalSigns = Object.keys(SIGN_DATA.alphabet).length + Object.keys(SIGN_DATA.words).length;

  grid.innerHTML = '';
  var cards = [
    { number: score, label: 'Total Points', width: Math.min(100, score / 5) + '%' },
    { number: streak, label: 'Current Streak' },
    { number: completedLessons + '/' + totalLessons, label: 'Lessons Completed', width: (completedLessons / totalLessons * 100) + '%' },
    { number: totalSigns, label: 'Signs Available' }
  ];
  cards.forEach(function(card) {
    var div = document.createElement('div');
    div.className = 'progress-card';
    div.innerHTML = '<div class="progress-number">' + card.number + '</div><div class="progress-label">' + card.label + '</div>' +
      (card.width ? '<div class="progress-bar"><div class="progress-fill" style="width:' + card.width + '"></div></div>' : '');
    grid.appendChild(div);
  });

  list.innerHTML = '';
  SIGN_DATA.lessons.forEach(function(lesson, i) {
    var status = i < completedLessons ? 'done' : i === completedLessons ? 'current' : 'pending';
    var label = status === 'done' ? 'Completed' : status === 'current' ? 'In Progress' : 'Not Started';
    var numContent = status === 'done' ? '<i class="fa-solid fa-check"></i>' : lesson.id;
    var item = document.createElement('div');
    item.className = 'lesson-progress-item';
    item.innerHTML = '<div class="lesson-num ' + status + '">' + numContent + '</div>' +
      '<div class="lesson-info"><h4>' + lesson.title + '</h4><p>' + lesson.desc + ' &mdash; ' + lesson.signs.length + ' signs &middot; ' + lesson.difficulty + '</p></div>' +
      '<span style="font-size:0.8rem;color:var(--text-muted);font-weight:600;">' + label + '</span>';
    list.appendChild(item);
  });
}

document.addEventListener('DOMContentLoaded', initApp);

window.showSection = showSection;
window.navigateSign = navigateSign;
window.playSignAnimation = playSignAnimation;
window.filterDictionary = filterDictionary;
window.buildDictionary = buildDictionary;