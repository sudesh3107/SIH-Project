/* =========================================================
   EDUACCESS - QUIZZES & RESULTS MODULE
   Generates adaptive quizzes from SIGN_DATA + PDF Studio
   Persists results in localStorage, provides analytics
   ========================================================= */

var quizCatalog = [];
var currentQuiz = null;
var currentQuizAnswers = [];
var currentQIndex = 0;
var quizScore = 0;
var quizTimer = null;
var quizSeconds = 0;
var quizTimed = false;
var quizStartTime = null;
var quizFilter = 'all';
var resultsFilter = 'all';
var reviewAttemptId = null;

// Keys
var LS_QUIZ_HISTORY = 'eduaccess_quiz_history';
var LS_QUIZ_STATS = 'eduaccess_quiz_stats';

/* =========================================================
   INIT
   ========================================================= */
function initQuizModule() {
  buildQuizCatalog();
  buildQuizFilters();
  renderQuizCatalog();
  renderQuizStatsMini();
  buildResults();
  // hook PDF studio updates to refresh catalog
  setInterval(function() {
    // if PDF content now exists but catalog has no pdf quiz, rebuild
    var hasPdf = !!(window.pdfText && window.pdfText.length > 50);
    var hasPdfQuiz = quizCatalog.some(function(q){ return q.id === 'pdf-dynamic'; });
    if (hasPdf && !hasPdfQuiz) {
      buildQuizCatalog(); renderQuizCatalog();
    }
    if (!hasPdf && hasPdfQuiz) {
      buildQuizCatalog(); renderQuizCatalog();
    }
  }, 1500);
}

/* =========================================================
   CATALOG — predefined + dynamic
   ========================================================= */
function buildQuizCatalog() {
  var base = [
    {
      id: 'alphabet-az',
      title: 'ASL Alphabet A–Z',
      desc: '26 letters • hand shapes • descriptions',
      icon: 'fa-font',
      color: 'indigo',
      type: 'sign',
      difficulty: 'Beginner',
      questions: 10,
      time: 5,
      tags: ['Letters','Beginner'],
      source: 'alphabet'
    },
    {
      id: 'alphabet-mixed',
      title: 'Mixed Letters Sprint',
      desc: 'Random 15 letters — speed & accuracy',
      icon: 'fa-bolt',
      color: 'cyan',
      type: 'sign',
      difficulty: 'Intermediate',
      questions: 15,
      time: 4,
      tags: ['Letters','Speed'],
      source: 'alphabet'
    },
    {
      id: 'greetings',
      title: 'Greetings & Manners',
      desc: 'hello, thank, please, sorry, love...',
      icon: 'fa-handshake',
      color: 'green',
      type: 'sign',
      difficulty: 'Beginner',
      questions: 8,
      time: 4,
      tags: ['Greetings'],
      source: 'greetings'
    },
    {
      id: 'essential',
      title: 'Essential Words',
      desc: 'water, eat, drink, sleep, school, book...',
      icon: 'fa-star',
      color: 'orange',
      type: 'sign',
      difficulty: 'Intermediate',
      questions: 8,
      time: 4,
      tags: ['Essential'],
      source: 'essential'
    },
    {
      id: 'family-feelings',
      title: 'Family & Feelings',
      desc: 'mother, father, happy, sad, heart...',
      icon: 'fa-heart',
      color: 'pink',
      type: 'sign',
      difficulty: 'Intermediate',
      questions: 10,
      time: 5,
      tags: ['Family','Feelings'],
      source: 'family-feelings'
    },
    {
      id: 'tech-fun',
      title: 'Tech & Fun',
      desc: 'computer, phone, music, dance, rainbow...',
      icon: 'fa-laptop',
      color: 'indigo',
      type: 'sign',
      difficulty: 'Advanced',
      questions: 6,
      time: 3,
      tags: ['Tech','Fun'],
      source: 'tech-fun'
    },
    {
      id: 'comprehensive',
      title: 'Comprehensive Challenge',
      desc: 'All categories — the ultimate test (20 Q)',
      icon: 'fa-trophy',
      color: 'green',
      type: 'sign',
      difficulty: 'Advanced',
      questions: 20,
      time: 8,
      tags: ['All','Challenge'],
      source: 'all'
    },
    {
      id: 'truefalse',
      title: 'True / False Drill',
      desc: 'Quick-fire true vs false sign descriptions',
      icon: 'fa-check-double',
      color: 'cyan',
      type: 'sign',
      difficulty: 'Beginner',
      questions: 10,
      time: 3,
      tags: ['TF','Speed'],
      source: 'truefalse'
    }
  ];

  // PDF dynamic
  var pdfQuiz = null;
  try {
    var hasPdf = window.pdfText && window.pdfText.trim().length > 100;
    if (hasPdf) {
      var sCount = (window.pdfSummarySentences && window.pdfSummarySentences.length) || (window.pdfRawSentences && window.pdfRawSentences.length) || 0;
      var wCount = window.pdfText.split(/\s+/).length;
      pdfQuiz = {
        id: 'pdf-dynamic',
        title: 'PDF: ' + (window.pdfFileName || 'Document') .replace(/\.pdf$/i,'').slice(0,22),
        desc: wCount + ' words • ' + sCount + ' key points • auto-generated',
        icon: 'fa-file-pdf',
        color: 'orange',
        type: 'pdf',
        difficulty: 'Adaptive',
        questions: Math.min(15, Math.max(5, sCount || 7)),
        time: 6,
        tags: ['PDF','Adaptive'],
        source: 'pdf'
      };
    }
  } catch(e) {}

  quizCatalog = pdfQuiz ? [pdfQuiz].concat(base) : base.slice();

  // add custom counter for history-aware "Continue" etc — not needed now
}

function buildQuizFilters() {
  var el = document.getElementById('quiz-filter-row');
  if (!el) return;
  var cats = [
    { id:'all', label:'All', icon:'fa-layer-group' },
    { id:'sign', label:'Sign Language', icon:'fa-hand' },
    { id:'pdf', label:'PDF Based', icon:'fa-file-pdf' },
    { id:'mixed', label:'Mixed', icon:'fa-shuffle' }
  ];
  el.innerHTML = cats.map(function(c){
    return '<button class="cat-filter' + (quizFilter===c.id?' active':'') + '" onclick="setQuizFilter(\''+c.id+'\')"><i class="fa-solid '+c.icon+'"></i> '+c.label+'</button>';
  }).join('');
}

function setQuizFilter(f) {
  quizFilter = f;
  buildQuizFilters();
  renderQuizCatalog();
}

function renderQuizCatalog() {
  var grid = document.getElementById('quiz-catalog-grid');
  var empty = document.getElementById('quiz-catalog-empty');
  var searchEl = document.getElementById('quiz-search');
  if (!grid) return;
  var q = searchEl ? (searchEl.value||'').toLowerCase().trim() : '';
  var filtered = quizCatalog.filter(function(item){
    if (quizFilter !== 'all') {
      if (quizFilter === 'mixed') { /* show all */ }
      else if (item.type !== quizFilter) return false;
    }
    if (q) {
      var hay = (item.title + ' ' + item.desc + ' ' + item.tags.join(' ') + ' ' + item.difficulty).toLowerCase();
      if (hay.indexOf(q)===-1) return false;
    }
    return true;
  });

  if (!filtered.length) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  var history = loadQuizHistory();
  grid.innerHTML = filtered.map(function(item){
    var attempts = history.filter(function(h){ return h.quizId === item.id; });
    var best = attempts.length ? Math.max.apply(null, attempts.map(function(a){return a.percent;})) : null;
    var last = attempts.length ? attempts[attempts.length-1] : null;
    return ''+
      '<div class="quiz-card" data-quiz="'+item.id+'">'+
        '<div class="quiz-card-top">'+
          '<div class="feature-icon '+item.color+'"><i class="fa-solid '+item.icon+'"></i></div>'+
          '<span class="quiz-badge '+item.type+'">'+item.type.toUpperCase()+'</span>'+
        '</div>'+
        '<h3 class="quiz-card-title">'+escapeHtml(item.title)+'</h3>'+
        '<p class="quiz-card-desc">'+escapeHtml(item.desc)+'</p>'+
        '<div class="quiz-card-meta">'+
          '<span><i class="fa-solid fa-signal"></i> '+item.difficulty+'</span>'+
          '<span><i class="fa-solid fa-list-ol"></i> '+item.questions+' Q</span>'+
          '<span><i class="fa-solid fa-clock"></i> ~'+item.time+' min</span>'+
        '</div>'+
        '<div class="quiz-card-tags">'+item.tags.map(function(t){return '<span class="quiz-tag">'+escapeHtml(t)+'</span>';}).join('')+'</div>'+
        (best!==null ? '<div class="quiz-card-best"><i class="fa-solid fa-trophy"></i> Best: '+best+'% • '+attempts.length+' attempt(s)</div>' : '<div class="quiz-card-best muted"><i class="fa-solid fa-circle-play"></i> Not attempted yet</div>')+
        '<div class="quiz-card-actions">'+
          '<button class="speech-btn primary" onclick="startQuiz(\''+item.id+'\')"><i class="fa-solid fa-play"></i> Start</button>'+
          (last ? '<button class="speech-btn secondary" onclick="reviewLastAttempt(\''+item.id+'\')"><i class="fa-solid fa-eye"></i> Last Result</button>' : '')+
        '</div>'+
      '</div>';
  }).join('');
}

function filterQuizCatalog() { renderQuizCatalog(); }

function renderQuizStatsMini() {
  var el = document.getElementById('quiz-mini-stats');
  if (!el) return;
  var h = loadQuizHistory();
  var total = h.length;
  var avg = total ? Math.round(h.reduce(function(s,a){return s+a.percent;},0)/total) : 0;
  var txt = total ? total + ' taken • avg ' + avg + '% • best ' + Math.max.apply(null,h.map(function(a){return a.percent;})) + '%' : 'No attempts yet';
  el.textContent = txt;
}

/* =========================================================
   CUSTOM QUIZ CREATOR
   ========================================================= */
function createCustomQuiz() {
  var sourceSel = document.getElementById('custom-quiz-source');
  var numSel = document.getElementById('custom-quiz-num');
  var diffSel = document.getElementById('custom-quiz-diff');
  var timedChk = document.getElementById('custom-quiz-timed');
  if (!sourceSel || !numSel) return;
  var source = sourceSel.value;
  var num = parseInt(numSel.value,10) || 10;
  var diff = diffSel ? diffSel.value : 'Beginner';
  var timed = timedChk ? timedChk.checked : false;

  // Validate PDF
  if (source === 'pdf' && !(window.pdfText && window.pdfText.length > 100)) {
    showToast('Load a PDF in PDF Studio first, or try Demo', 'error');
    showSection('pdf');
    return;
  }
  var id = 'custom-' + Date.now();
  // push ephemeral catalog entry
  quizCatalog.unshift({
    id: id,
    title: 'Custom: ' + sourceSel.options[sourceSel.selectedIndex].text + ' • ' + num + 'Q',
    desc: 'Custom • ' + diff + ' • ' + (timed?'Timed':'Untimed'),
    icon: source==='pdf' ? 'fa-file-pdf' : 'fa-wand-magic-sparkles',
    color: 'indigo',
    type: source==='pdf' ? 'pdf' : 'sign',
    difficulty: diff,
    questions: num,
    time: Math.ceil(num*0.4),
    tags: ['Custom', diff],
    source: source,
    custom: true,
    timed: timed
  });
  renderQuizCatalog();
  showToast('Custom quiz created — starting...', 'success');
  setTimeout(function(){ startQuiz(id); }, 400);
}

/* =========================================================
   QUIZ GENERATION
   ========================================================= */
function generateQuizQuestions(quizDef) {
  var n = quizDef.questions || 10;
  var src = quizDef.source;
  var diff = quizDef.difficulty;
  var questions = [];

  if (src === 'pdf' || quizDef.type==='pdf') {
    questions = generatePdfQuizQuestions(n);
  } else if (src === 'truefalse') {
    questions = generateTrueFalseQuestions(n);
  } else if (src === 'all') {
    questions = generateSignQuestions(n, null, diff);
  } else if (src === 'alphabet' || src === 'greetings' || src === 'essential' || src === 'family-feelings' || src === 'tech-fun') {
    questions = generateSignQuestions(n, src, diff);
  } else {
    // custom source mapping
    if (src === 'alphabet') questions = generateSignQuestions(n,'alphabet',diff);
    else if (src === 'pdf') questions = generatePdfQuizQuestions(n);
    else questions = generateSignQuestions(n, src, diff);
  }

  // shuffle and trim
  questions = shuffleArray(questions).slice(0, n);
  // ensure at least n (if short, duplicate with variation)
  while (questions.length < n) {
    var extra = generateSignQuestions(n - questions.length, null, diff);
    questions = questions.concat(extra);
    questions = shuffleArray(questions).slice(0,n);
    if (questions.length === n) break;
    // prevent infinite loop
    if (extra.length===0) break;
  }
  return questions;
}

function generateSignQuestions(n, source, difficulty) {
  var pools = [];
  var alphaKeys = Object.keys(SIGN_DATA.alphabet);
  var wordKeys = Object.keys(SIGN_DATA.words);

  if (source === 'alphabet') pools = alphaKeys.map(function(k){ return {key:k, data:SIGN_DATA.alphabet[k]}; });
  else if (source === 'greetings') pools = (SIGN_DATA.categories.find(function(c){return c.id==='greetings';})||{signs:[]}).signs.map(function(k){ return {key:k, data:SIGN_DATA.words[k]||SIGN_DATA.alphabet[k]}; }).filter(function(x){return x.data;});
  else if (source === 'essential') pools = (SIGN_DATA.categories.find(function(c){return c.id==='essential';})||{signs:[]}).signs.map(function(k){ return {key:k, data:SIGN_DATA.words[k]}; }).filter(function(x){return x.data;});
  else if (source === 'family-feelings') {
    var fam = (SIGN_DATA.categories.find(function(c){return c.id==='family';})||{signs:[]}).signs;
    var feel = (SIGN_DATA.categories.find(function(c){return c.id==='feelings';})||{signs:[]}).signs;
    pools = fam.concat(feel).map(function(k){ return {key:k, data:SIGN_DATA.words[k]}; }).filter(function(x){return x.data;});
  }
  else if (source === 'tech-fun') {
    var t = (SIGN_DATA.categories.find(function(c){return c.id==='tech';})||{signs:[]}).signs;
    var fu = (SIGN_DATA.categories.find(function(c){return c.id==='fun';})||{signs:[]}).signs;
    pools = t.concat(fu).map(function(k){ return {key:k, data:SIGN_DATA.words[k]}; }).filter(function(x){return x.data;});
  }
  else { // all
    alphaKeys.forEach(function(k){ pools.push({key:k, data:SIGN_DATA.alphabet[k]}); });
    wordKeys.forEach(function(k){ pools.push({key:k, data:SIGN_DATA.words[k]}); });
  }

  if (!pools.length) pools = alphaKeys.map(function(k){return {key:k,data:SIGN_DATA.alphabet[k]};});

  var qs = [];
  var used = new Set();
  var attempts = 0;
  while (qs.length < n && attempts < n*6) {
    attempts++;
    var item = pools[Math.floor(Math.random()*pools.length)];
    if (!item || used.has(item.key) && pools.length > n) continue;
    used.add(item.key);

    var typeRoll = Math.random();
    var q;
    if (typeRoll < 0.6) q = makeSignMCQ(item, pools);
    else if (typeRoll < 0.8) q = makeSignTF(item, pools);
    else q = makeSignFillBlanks(item);

    if (q) qs.push(q);
  }
  return qs;
}

function makeSignMCQ(item, pool) {
  // Question: "What sign is described as: '... desc ...' ?" options = 4 keys
  var correct = item.key;
  var others = pool.filter(function(p){ return p.key !== correct; });
  shuffleArray(others);
  var distractors = others.slice(0,3).map(function(p){return p.key;});
  if (distractors.length<3) {
    // pad from alphabet
    var alpha = Object.keys(SIGN_DATA.alphabet).filter(function(k){return k!==correct && distractors.indexOf(k)===-1;});
    shuffleArray(alpha);
    while (distractors.length<3 && alpha.length) distractors.push(alpha.pop());
  }
  var options = shuffleArray([correct].concat(distractors));
  return {
    type: 'mcq',
    prompt: 'Which sign matches this description?',
    question: '"' + item.data.desc + '"',
    hint: 'Category: ' + item.data.category,
    options: options,
    answer: correct,
    answerIndex: options.indexOf(correct),
    explanation: 'The sign <strong>' + escapeHtml(correct) + '</strong> is described as: ' + escapeHtml(item.data.desc) + ' — Category ' + escapeHtml(item.data.category),
    signKey: correct,
    category: item.data.category
  };
}

function makeSignTF(item, pool) {
  var isTrue = Math.random() < 0.5;
  var correct = item.key;
  var desc = item.data.desc;
  var shownDesc = desc;
  var shownKey = correct;
  if (!isTrue) {
    // pick a different description
    var other = pool.filter(function(p){return p.key!==correct;})[Math.floor(Math.random()*Math.max(1,pool.length-1))];
    if (other) shownDesc = other.data.desc;
    // 50% mismatch key vs desc
  }
  return {
    type: 'tf',
    prompt: 'True or False?',
    question: 'Sign <strong>' + escapeHtml(shownKey) + '</strong> means: "' + escapeHtml(shownDesc) + '"',
    hint: 'Read carefully',
    options: ['True','False'],
    answer: isTrue ? 'True' : 'False',
    answerIndex: isTrue ? 0 : 1,
    explanation: isTrue ? 'Correct — that description is accurate.' : 'False — the correct description for <strong>' + escapeHtml(correct) + '</strong> is: ' + escapeHtml(desc),
    signKey: correct
  };
}

function makeSignFillBlanks(item) {
  // Fill the sign name from description
  return {
    type: 'fill',
    prompt: 'Fill in the blank (type the sign name):',
    question: 'Description: "' + escapeHtml(item.data.desc) + '" — Which sign is this? <br><span style="color:var(--text-muted);font-size:0.85rem">Category: ' + escapeHtml(item.data.category) + '</span>',
    hint: 'Type exactly, e.g., A or hello',
    answer: item.key,
    explanation: 'Answer: <strong>' + escapeHtml(item.key) + '</strong> — ' + escapeHtml(item.data.desc),
    signKey: item.key
  };
}

function generateTrueFalseQuestions(n) {
  var qs = [];
  for(var i=0;i<n;i++){
    var keys = Object.keys(SIGN_DATA.alphabet).concat(Object.keys(SIGN_DATA.words));
    var k = keys[Math.floor(Math.random()*keys.length)];
    var data = SIGN_DATA.alphabet[k] || SIGN_DATA.words[k];
    var item = {key:k, data:data};
    var pool = keys.map(function(k2){ return {key:k2, data: SIGN_DATA.alphabet[k2]||SIGN_DATA.words[k2]}; });
    qs.push(makeSignTF(item, pool));
  }
  return qs;
}

function generatePdfQuizQuestions(n) {
  // Use pdfSummarySentences + pdfFlashcards logic, generate MCQ/TF/Fill
  var sentences = [];
  try {
    if (window.pdfSummarySentences && window.pdfSummarySentences.length) sentences = window.pdfSummarySentences.slice();
    else if (window.pdfRawSentences && window.pdfRawSentences.length) sentences = window.pdfRawSentences.slice(0, 8);
    else if (window.pdfText) sentences = splitIntoSentences(window.pdfText).slice(0,8);
  } catch(e){ sentences = []; }

  if (!sentences.length) {
    // fallback demo sentences
    sentences = [
      "EduAccess empowers disabled learners through sign language avatars and speech.",
      "The PDF Studio extracts text and creates summaries, flashcards, and audio.",
      "Practice Mode helps learners quiz themselves with interactive exercises.",
      "Progress tracking shows points, streak, lessons completed, and signs available."
    ];
  }

  // Need word freq for keyword extraction + distractors
  var stop = window.STOPWORDS || new Set(["the","is","and","a","an","of","in","on","at","for","with","to","are","was","were","be","been","this","that","these","those","it","its","as","by","from","about","into","through","during","before","after","above","below","up","down","out","over","under"]);
  function tokenize(s){ return s.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean).filter(function(w){return !stop.has(w) && w.length>2;}); }
  var freq={};
  sentences.forEach(function(s){ tokenize(s).forEach(function(w){ freq[w]=(freq[w]||0)+1; }); });

  var allWords = Object.keys(freq);
  var qs=[];

  sentences.forEach(function(sentence, idx){
    if (qs.length >= n) return;
    var toks = tokenize(sentence);
    if (!toks.length) return;
    // pick keyword
    var best = toks.slice().sort(function(a,b){ return (freq[b]||0)-(freq[a]||0) || b.length-a.length; })[0] || toks[0];
    var original = (sentence.match(new RegExp("\\b"+escapeRegExp(best)+"\\b","i"))||[best])[0];
    var typeIdx = idx % 3;
    var q;
    if (typeIdx===0) {
      // MCQ cloze: sentence with ______ , options = keyword + 3 distractors
      var cloze = sentence.replace(new RegExp("\\b"+escapeRegExp(original)+"\\b","i"), "______");
      var distractors = allWords.filter(function(w){return w!==best;});
      shuffleArray(distractors);
      distractors = distractors.slice(0,3);
      // ensure have 3
      while(distractors.length<3){ distractors.push("concept","learning","access"); distractors=distractors.slice(0,3); }
      var opts = shuffleArray([original].concat(distractors.map(function(d){ return (sentence.match(new RegExp("\\b"+escapeRegExp(d)+"\\b","i"))||[d])[0]; })));
      // normalize to original casing choices? keep lower for comparison but display as is
      q = {
        type:'mcq',
        prompt: 'Complete the sentence from the PDF:',
        question: '"' + escapeHtml(cloze) + '"',
        hint: 'Choose the missing word',
        options: opts,
        answer: original,
        answerIndex: opts.map(function(o){return o.toLowerCase();}).indexOf(original.toLowerCase()),
        explanation: 'Full sentence: "' + escapeHtml(sentence) + '" — answer is <strong>' + escapeHtml(original) + '</strong>',
        source: sentence
      };
      // fix index if case mismatch: fallback
      if (q.answerIndex===-1) q.answerIndex = opts.indexOf(original);
    } else if (typeIdx===1) {
      // True/False: statement about sentence
      var isTrue = Math.random()<0.5;
      var statement = sentence;
      if (!isTrue) {
        // mutate by swapping keyword with distractor
        var dist = allWords.filter(function(w){return w!==best;})[0] || "unknown";
        statement = sentence.replace(new RegExp("\\b"+escapeRegExp(original)+"\\b","i"), dist);
      }
      q = {
        type:'tf',
        prompt: 'Based on the PDF, True or False?',
        question: '"' + escapeHtml(statement) + '"',
        hint: 'Refer to extracted text',
        options: ['True','False'],
        answer: isTrue ? 'True':'False',
        answerIndex: isTrue?0:1,
        explanation: isTrue ? 'True — this is in the document.' : 'False — the document states: "' + escapeHtml(sentence) + '"',
        source: sentence
      };
    } else {
      // Fill
      q = {
        type:'fill',
        prompt: 'From the PDF — fill the keyword:',
        question: '"' + escapeHtml(sentence.replace(new RegExp("\\b"+escapeRegExp(original)+"\\b","i"), "______")) + '" <br><span style="color:var(--text-muted);font-size:0.85rem">Type the missing word</span>',
        hint: 'One word',
        answer: original,
        explanation: 'Answer: <strong>' + escapeHtml(original) + '</strong> — full: "' + escapeHtml(sentence) + '"',
        source: sentence
      };
    }
    if (q) qs.push(q);
  });

  // if still short, generate more by reusing sentences with different types
  while(qs.length < n) {
    var s = sentences[Math.floor(Math.random()*sentences.length)];
    var toks2 = tokenize(s);
    if (!toks2.length) break;
    var best2 = toks2[0];
    var orig2 = (s.match(new RegExp("\\b"+escapeRegExp(best2)+"\\b","i"))||[best2])[0];
    var q2 = {
      type:'mcq',
      prompt:'From the PDF:',
      question: '"' + escapeHtml(s.slice(0,90)) + '..." — What is the key term?',
      hint:'Pick one',
      options: shuffleArray([orig2].concat(allWords.filter(function(w){return w!==best2;}).slice(0,3))),
      answer: orig2,
      answerIndex: 0,
      explanation: '"' + escapeHtml(s) + '"',
      source: s
    };
    q2.answerIndex = q2.options.map(function(o){return o.toLowerCase();}).indexOf(orig2.toLowerCase());
    if (q2.answerIndex===-1) q2.answerIndex=0;
    qs.push(q2);
  }

  return shuffleArray(qs).slice(0,n);
}

/* =========================================================
   START / PLAYER
   ========================================================= */
function startQuiz(quizId) {
  var def = quizCatalog.find(function(q){return q.id===quizId;});
  if (!def) { showToast('Quiz not found','error'); return; }
  // Check PDF availability
  if ((def.type==='pdf' || def.source==='pdf') && !(window.pdfText && window.pdfText.length>100)) {
    showToast('No PDF loaded — load one in PDF Studio first','error');
    showSection('pdf');
    return;
  }
  var questions = generateQuizQuestions(def);
  if (!questions.length) { showToast('Could not generate questions','error'); return; }

  currentQuiz = def;
  currentQuizAnswers = new Array(questions.length).fill(null);
  currentQuiz._questions = questions;
  currentQIndex = 0;
  quizScore = 0;
  quizSeconds = 0;
  quizTimed = !!def.timed || (document.getElementById('custom-quiz-timed') && document.getElementById('custom-quiz-timed').checked);
  // ensure timed from def if custom
  if (def.timed) quizTimed = true;

  quizStartTime = Date.now();
  startQuizTimer();

  // show player, hide catalog
  document.getElementById('quiz-catalog-view').style.display = 'none';
  document.getElementById('quiz-player').style.display = 'block';
  document.getElementById('quiz-player').scrollIntoView({ behavior:'smooth', block:'start' });

  renderQuizPlayer();
  showToast('Quiz started: ' + def.title, 'success');
}

function startQuizTimer() {
  clearInterval(quizTimer);
  quizSeconds = 0;
  var el = document.getElementById('quiz-timer');
  if (el) el.textContent = '00:00';
  quizTimer = setInterval(function(){
    quizSeconds++;
    if (el) {
      var m = String(Math.floor(quizSeconds/60)).padStart(2,'0');
      var s = String(quizSeconds%60).padStart(2,'0');
      el.textContent = m+':'+s;
    }
  }, 1000);
}

function stopQuizTimer() { clearInterval(quizTimer); quizTimer=null; }

function renderQuizPlayer() {
  if (!currentQuiz || !currentQuiz._questions) return;
  var qs = currentQuiz._questions;
  var q = qs[currentQIndex];
  var total = qs.length;

  // header
  document.getElementById('quiz-player-title').textContent = currentQuiz.title;
  document.getElementById('quiz-player-subtitle').textContent = currentQuiz.difficulty + ' • ' + total + ' questions' + (quizTimed ? ' • Timed' : '');
  document.getElementById('quiz-progress-text').textContent = 'Question ' + (currentQIndex+1) + ' of ' + total;
  document.getElementById('quiz-progress-bar').style.width = ((currentQIndex)/total*100)+'%';
  document.getElementById('quiz-score-live').textContent = 'Score: ' + quizScore;
  // dots
  var dots = document.getElementById('quiz-dots');
  if (dots) {
    dots.innerHTML = qs.map(function(_,i){
      var cls = 'quiz-dot';
      if (i < currentQIndex) cls += ' done';
      if (i === currentQIndex) cls += ' active';
      if (currentQuizAnswers[i] !== null && currentQuizAnswers[i] !== undefined) {
        // mark answered
        var isCorrect = isAnswerCorrect(qs[i], currentQuizAnswers[i]);
        // but for past dots, color by correctness
        if (i !== currentQIndex) cls += isCorrect ? ' correct' : ' wrong';
      }
      return '<span class="'+cls+'" onclick="jumpToQuestion('+i+')"></span>';
    }).join('');
  }

  // question body
  var body = document.getElementById('quiz-question-body');
  var isAnswered = currentQuizAnswers[currentQIndex] !== null && currentQuizAnswers[currentQIndex] !== undefined;
  var html = '';
  html += '<div class="quiz-q-type">'+escapeHtml(q.prompt)+'</div>';
  html += '<div class="quiz-q-text">'+ q.question +'</div>';
  if (q.hint) html += '<div class="quiz-q-hint"><i class="fa-solid fa-lightbulb"></i> '+escapeHtml(q.hint)+'</div>';

  if (q.type === 'mcq' || q.type === 'tf') {
    html += '<div class="quiz-options">';
    q.options.forEach(function(opt, idx){
      var selected = currentQuizAnswers[currentQIndex] === idx;
      var correct = q.answerIndex === idx;
      var cls = 'quiz-option';
      if (isAnswered) {
        if (correct) cls += ' correct';
        else if (selected && !correct) cls += ' wrong';
        else if (selected) cls += ' selected';
      } else if (selected) cls += ' selected';
      var disabled = isAnswered ? ' disabled' : '';
      html += '<button class="'+cls+'" onclick="answerMCQ('+idx+')"'+disabled+'>'+
                '<span class="quiz-opt-letter">'+String.fromCharCode(65+idx)+'</span>'+
                '<span class="quiz-opt-text">'+escapeHtml(opt)+'</span>'+
                (isAnswered && correct ? '<span class="quiz-opt-icon"><i class="fa-solid fa-check"></i></span>' : '')+
                (isAnswered && selected && !correct ? '<span class="quiz-opt-icon"><i class="fa-solid fa-xmark"></i></span>' : '')+
              '</button>';
    });
    html += '</div>';
  } else if (q.type === 'fill') {
    var val = currentQuizAnswers[currentQIndex];
    var valStr = (val !== null && val !== undefined) ? escapeHtml(val) : '';
    if (isAnswered) {
      var userAns = currentQuizAnswers[currentQIndex];
      var correctAns = q.answer;
      var isCorrect = isAnswerCorrect(q, userAns);
      html += '<div class="quiz-fill-answered '+(isCorrect?'correct':'wrong')+'">';
      html += '<div>Your answer: <strong>'+escapeHtml(userAns)+'</strong> '+(isCorrect?'<i class="fa-solid fa-check" style="color:var(--success)"></i>':'<i class="fa-solid fa-xmark" style="color:var(--danger)"></i>')+'</div>';
      if (!isCorrect) html += '<div>Correct: <strong>'+escapeHtml(correctAns)+'</strong></div>';
      html += '</div>';
    } else {
      html += '<div class="quiz-fill-row">';
      html += '<input type="text" id="quiz-fill-input" class="quiz-fill-input" placeholder="Type your answer..." autocomplete="off" onkeydown="if(event.key===\'Enter\') submitFill()">';
      html += '<button class="speech-btn primary" onclick="submitFill()"><i class="fa-solid fa-paper-plane"></i> Submit</button>';
      html += '</div>';
      html += '<div style="margin-top:8px; font-size:0.8rem; color:var(--text-muted);">Press Enter to submit • not case-sensitive</div>';
    }
  }

  if (isAnswered) {
    html += '<div class="quiz-explain"><i class="fa-solid fa-circle-info"></i> '+ q.explanation +'</div>';
  }

  body.innerHTML = html;
  // focus fill input
  if (q.type==='fill' && !isAnswered) {
    setTimeout(function(){ var inp=document.getElementById('quiz-fill-input'); if(inp) inp.focus(); }, 80);
  }

  // footer buttons
  var prevBtn = document.getElementById('quiz-btn-prev');
  var nextBtn = document.getElementById('quiz-btn-next');
  var submitBtn = document.getElementById('quiz-btn-submit');
  if (prevBtn) prevBtn.disabled = currentQIndex===0;
  if (nextBtn) {
    if (currentQIndex === total-1) {
      nextBtn.style.display='none';
      if (submitBtn) submitBtn.style.display='inline-flex';
      if (submitBtn) submitBtn.disabled = currentQuizAnswers.includes(null) || currentQuizAnswers.includes(undefined);
    } else {
      nextBtn.style.display='inline-flex';
      if (submitBtn) submitBtn.style.display='none';
      nextBtn.disabled = currentQuizAnswers[currentQIndex]===null || currentQuizAnswers[currentQIndex]===undefined;
    }
  }
  // update overall progress bar to include current if answered?
}

function isAnswerCorrect(question, userAnswer) {
  if (userAnswer===null || userAnswer===undefined) return false;
  if (question.type==='mcq' || question.type==='tf') {
    return userAnswer === question.answerIndex;
  } else if (question.type==='fill') {
    var a = String(userAnswer).trim().toLowerCase();
    var b = String(question.answer).trim().toLowerCase();
    // allow exact or contains (for multi-word, check equality)
    return a===b || (a.length>2 && b.indexOf(a)!==-1) || (b.length>2 && a.indexOf(b)!==-1);
  }
  return false;
}

function answerMCQ(idx) {
  if (!currentQuiz) return;
  var q = currentQuiz._questions[currentQIndex];
  if (currentQuizAnswers[currentQIndex] !== null && currentQuizAnswers[currentQIndex] !== undefined) return; // already answered
  currentQuizAnswers[currentQIndex] = idx;
  var correct = isAnswerCorrect(q, idx);
  if (correct) { quizScore++; showToast('Correct!','success'); }
  else { showToast('Wrong — ' + escapeHtml(q.answer), 'error'); }
  document.getElementById('quiz-score-live').textContent = 'Score: ' + quizScore;
  renderQuizPlayer();
  // auto-advance after 1s if not last
  if (currentQIndex < currentQuiz._questions.length-1) {
    setTimeout(function(){
      // only auto if still on same question and answered
      if (currentQuizAnswers[currentQIndex]!==null) nextQuestion();
    }, 900);
  }
}

function submitFill() {
  var inp = document.getElementById('quiz-fill-input');
  if (!inp) return;
  var val = inp.value.trim();
  if (!val) { showToast('Please type an answer','error'); inp.focus(); return; }
  var q = currentQuiz._questions[currentQIndex];
  currentQuizAnswers[currentQIndex] = val;
  var correct = isAnswerCorrect(q, val);
  if (correct) { quizScore++; showToast('Correct!','success'); }
  else { showToast('Answer: ' + q.answer, 'error'); }
  document.getElementById('quiz-score-live').textContent = 'Score: ' + quizScore;
  renderQuizPlayer();
  if (currentQIndex < currentQuiz._questions.length-1) {
    setTimeout(nextQuestion, 900);
  }
}

function nextQuestion() {
  if (currentQIndex < currentQuiz._questions.length-1) {
    currentQIndex++;
    renderQuizPlayer();
  }
}
function prevQuestion() {
  if (currentQIndex>0) { currentQIndex--; renderQuizPlayer(); }
}
function jumpToQuestion(idx) {
  if (idx>=0 && idx < currentQuiz._questions.length) {
    currentQIndex = idx;
    renderQuizPlayer();
  }
}

function exitQuiz() {
  if (!confirm('Exit quiz? Progress will be lost.')) return;
  stopQuizTimer();
  currentQuiz = null;
  currentQuizAnswers = [];
  document.getElementById('quiz-player').style.display='none';
  document.getElementById('quiz-catalog-view').style.display='block';
  showToast('Quiz exited','info');
}

function submitQuiz() {
  if (currentQuizAnswers.includes(null) || currentQuizAnswers.includes(undefined)) {
    if (!confirm('You have unanswered questions. Submit anyway?')) return;
    // fill unanswered as wrong (keep null)
  }
  stopQuizTimer();
  var total = currentQuiz._questions.length;
  var correct = 0;
  currentQuiz._questions.forEach(function(q,i){
    if (isAnswerCorrect(q, currentQuizAnswers[i])) correct++;
  });
  var percent = Math.round(correct/total*100);
  var timeStr = document.getElementById('quiz-timer') ? document.getElementById('quiz-timer').textContent : '00:00';
  // save
  var attempt = {
    id: 'att-'+Date.now(),
    quizId: currentQuiz.id,
    quizTitle: currentQuiz.title,
    type: currentQuiz.type,
    difficulty: currentQuiz.difficulty,
    date: new Date().toISOString(),
    dateStr: new Date().toLocaleString(),
    total: total,
    correct: correct,
    percent: percent,
    seconds: quizSeconds,
    timeStr: timeStr,
    answers: currentQuizAnswers.slice(),
    questions: JSON.parse(JSON.stringify(currentQuiz._questions)), // deep copy for review
    timed: quizTimed
  };
  saveQuizAttempt(attempt);

  // update global progress (practiceScore) as well
  if (typeof practiceScore !== 'undefined') {
    practiceScore += correct*10;
    if (typeof saveProgress === 'function') saveProgress({ score: practiceScore, streak: (typeof practiceStreak!=='undefined'?practiceStreak:0) });
  }

  showQuizResult(attempt);

  // refresh catalog + results
  renderQuizCatalog();
  renderQuizStatsMini();
  buildResults();
}

/* =========================================================
   RESULT VIEW (after submit)
   ========================================================= */
function showQuizResult(attempt) {
  document.getElementById('quiz-player').style.display='none';
  var res = document.getElementById('quiz-result-view');
  res.style.display='block';
  res.scrollIntoView({ behavior:'smooth', block:'start' });

  var grade = getGrade(attempt.percent);
  var msg = grade.msg;
  var color = grade.color;

  document.getElementById('quiz-result-score').innerHTML =
    '<div class="quiz-result-circle" style="border-color:'+color+'"><span class="quiz-result-percent" style="color:'+color+'">'+attempt.percent+'%</span><span class="quiz-result-frac">'+attempt.correct+'/'+attempt.total+'</span></div>'+
    '<div class="quiz-result-grade" style="color:'+color+'"><i class="'+grade.icon+'"></i> '+grade.label+'</div>'+
    '<p class="quiz-result-msg">'+msg+'</p>';

  document.getElementById('quiz-result-meta').innerHTML =
    '<span><i class="fa-solid fa-file-lines"></i> '+escapeHtml(attempt.quizTitle)+'</span>'+
    '<span><i class="fa-solid fa-clock"></i> '+attempt.timeStr+'</span>'+
    '<span><i class="fa-solid fa-calendar"></i> '+attempt.dateStr+'</span>'+
    '<span><i class="fa-solid fa-signal"></i> '+attempt.difficulty+'</span>';

  // breakdown
  var breakdown = document.getElementById('quiz-result-breakdown');
  breakdown.innerHTML = attempt.questions.map(function(q,i){
    var userAns = attempt.answers[i];
    var correct = isAnswerCorrect(q, userAns);
    var userDisplay = '';
    if (q.type==='mcq' || q.type==='tf') {
      userDisplay = (userAns!==null && userAns!==undefined && q.options[userAns]) ? escapeHtml(q.options[userAns]) : '<em>— no answer —</em>';
      var correctDisplay = escapeHtml(q.options[q.answerIndex]);
    } else {
      userDisplay = userAns ? escapeHtml(userAns) : '<em>— no answer —</em>';
      correctDisplay = escapeHtml(q.answer);
    }
    return ''+
      '<div class="quiz-review-item '+(correct?'correct':'wrong')+'">'+
        '<div class="quiz-review-head"><span class="quiz-review-num">Q'+(i+1)+'</span><span class="quiz-review-status '+(correct?'correct':'wrong')+'">'+(correct?'<i class="fa-solid fa-check"></i> Correct':'<i class="fa-solid fa-xmark"></i> Wrong')+'</span></div>'+
        '<div class="quiz-review-q">'+q.question+'</div>'+
        '<div class="quiz-review-ans"><span>Your: <strong>'+userDisplay+'</strong></span> '+(correct?'':'<span>Correct: <strong>'+correctDisplay+'</strong></span>')+'</div>'+
        '<div class="quiz-review-explain">'+q.explanation+'</div>'+
      '</div>';
  }).join('');

  // actions: store current attempt id for retake/share
  reviewAttemptId = attempt.id;
  // certificate if >=80
  var certBtn = document.getElementById('quiz-btn-certificate');
  if (certBtn) certBtn.style.display = attempt.percent >= 60 ? 'inline-flex' : 'none';
}

function getGrade(p) {
  if (p>=90) return { label:'Outstanding!', msg:'You mastered this topic. Keep the streak!', color:'#059669', icon:'fa-solid fa-trophy' };
  if (p>=75) return { label:'Great Job!', msg:'Strong performance — review the misses to reach 90%+', color:'#6366f1', icon:'fa-solid fa-medal' };
  if (p>=60) return { label:'Good Effort', msg:'You passed. Retake to improve.', color:'#d97706', icon:'fa-solid fa-thumbs-up' };
  if (p>=40) return { label:'Needs Work', msg:'Review lessons and try again. You\'ve got this!', color:'#e11d48', icon:'fa-solid fa-rotate' };
  return { label:'Keep Practicing', msg:'Don\'t give up — each attempt builds memory.', color:'#991b1b', icon:'fa-solid fa-heart' };
}

function closeQuizResult() {
  document.getElementById('quiz-result-view').style.display='none';
  document.getElementById('quiz-catalog-view').style.display='block';
  currentQuiz=null;
  window.scrollTo({ top:0, behavior:'smooth'});
  // if we came from results section, maybe stay there — but default to quizzes
}

function retakeCurrentQuiz() {
  if (!currentQuiz) {
    // try to find by last attempt
    var h = loadQuizHistory();
    var last = h.length ? h[h.length-1] : null;
    if (last) { startQuiz(last.quizId); document.getElementById('quiz-result-view').style.display='none'; return; }
  }
  var id = currentQuiz ? currentQuiz.id : null;
  document.getElementById('quiz-result-view').style.display='none';
  if (id) startQuiz(id);
}

/* =========================================================
   PERSISTENCE
   ========================================================= */
function loadQuizHistory() {
  try { return JSON.parse(localStorage.getItem(LS_QUIZ_HISTORY)||'[]'); } catch(e){ return []; }
}
function saveQuizAttempt(attempt) {
  var hist = loadQuizHistory();
  hist.push(attempt);
  localStorage.setItem(LS_QUIZ_HISTORY, JSON.stringify(hist));
  // also update stats
  try {
    var stats = JSON.parse(localStorage.getItem(LS_QUIZ_STATS)||'{}');
    stats.total = hist.length;
    stats.avg = Math.round(hist.reduce(function(s,a){return s+a.percent;},0)/hist.length);
    localStorage.setItem(LS_QUIZ_STATS, JSON.stringify(stats));
  } catch(e){}
}

function clearAllQuizHistory() {
  if (!confirm('Delete ALL quiz history? This cannot be undone.')) return;
  localStorage.removeItem(LS_QUIZ_HISTORY);
  localStorage.removeItem(LS_QUIZ_STATS);
  buildResults();
  renderQuizCatalog();
  renderQuizStatsMini();
  showToast('All quiz history cleared','info');
}

/* =========================================================
   RESULTS SECTION
   ========================================================= */
function buildResults() {
  var hist = loadQuizHistory();
  renderResultsStats(hist);
  renderResultsHistory(hist);
  renderResultsChart(hist);
}

function renderResultsStats(hist) {
  var total = hist.length;
  var avg = total ? Math.round(hist.reduce(function(s,a){return s+a.percent;},0)/total) : 0;
  var best = total ? Math.max.apply(null, hist.map(function(a){return a.percent;})) : 0;
  var totalTime = hist.reduce(function(s,a){return s+(a.seconds||0);},0);
  var minutes = Math.floor(totalTime/60);
  var accuracy = avg; // same
  var streak = 0; // consecutive >=60 ?
  // compute current streak of passes (>=60)
  for(var i=hist.length-1;i>=0;i--){ if(hist[i].percent>=60) streak++; else break; }

  var grid = document.getElementById('results-stats-grid');
  if (!grid) return;
  var cards = [
    { val: total, label:'Quizzes Taken', sub: total? 'Keep going!':'No attempts yet', icon:'fa-clipboard-check', color:'indigo' },
    { val: avg+'%', label:'Average Score', sub: avg>=60?'Above passing':'Below passing', icon:'fa-chart-simple', color:'cyan', bar: avg+'%' },
    { val: best+'%', label:'Best Score', sub: best>=90?'Outstanding!':best>=60?'Good':'Keep trying', icon:'fa-trophy', color:'green', bar: best+'%' },
    { val: (minutes? minutes+'m':'0m'), label:'Time Spent', sub: totalTime? (totalTime%60)+'s extra' : '—', icon:'fa-clock', color:'orange' },
    { val: streak, label:'Pass Streak', sub: streak? 'Consecutive ≥60%':'—', icon:'fa-fire', color:'pink' },
    { val: hist.length? hist[hist.length-1].percent+'%':'—', label:'Last Score', sub: hist.length? hist[hist.length-1].quizTitle.slice(0,18):'—', icon:'fa-star', color:'indigo' }
  ];
  grid.innerHTML = cards.map(function(c){
    return '<div class="progress-card">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><span style="font-size:1.1rem;color:var(--primary)"><i class="fa-solid '+c.icon+'"></i></span><span style="font-size:0.7rem;font-weight:800;padding:4px 8px;background:#f1f5f9;border-radius:50px;color:var(--text-muted)">'+escapeHtml(c.label)+'</span></div>'+
      '<div class="progress-number" style="font-size:2rem">'+escapeHtml(String(c.val))+'</div>'+
      '<div class="progress-label">'+escapeHtml(c.sub)+'</div>'+
      (c.bar ? '<div class="progress-bar"><div class="progress-fill" style="width:'+c.bar+'"></div></div>' : '')+
    '</div>';
  }).join('');
}

function renderResultsHistory(hist) {
  var container = document.getElementById('results-history-list');
  var empty = document.getElementById('results-history-empty');
  var countEl = document.getElementById('results-count');
  if (!container) return;

  // filter
  var filtered = hist.slice().reverse(); // newest first
  if (resultsFilter !== 'all') {
    filtered = filtered.filter(function(a){ return a.type === resultsFilter; });
  }
  // search
  var searchEl = document.getElementById('results-search');
  var q = searchEl ? (searchEl.value||'').toLowerCase().trim() : '';
  if (q) filtered = filtered.filter(function(a){ return (a.quizTitle+' '+a.difficulty).toLowerCase().indexOf(q)!==-1; });

  if (countEl) countEl.textContent = filtered.length + ' result(s)' + (hist.length!==filtered.length ? ' (filtered from '+hist.length+')' : '');

  if (!filtered.length) {
    container.innerHTML = '';
    if (empty) empty.style.display='block';
    return;
  }
  if (empty) empty.style.display='none';

  container.innerHTML = filtered.map(function(a){
    var grade = getGrade(a.percent);
    return ''+
      '<div class="result-row">'+
        '<div class="result-row-main">'+
          '<div class="result-row-title"><span class="result-badge '+a.type+'">'+a.type+'</span> '+escapeHtml(a.quizTitle)+'</div>'+
          '<div class="result-row-meta"><span><i class="fa-solid fa-calendar"></i> '+escapeHtml(a.dateStr)+'</span> <span><i class="fa-solid fa-clock"></i> '+a.timeStr+'</span> <span><i class="fa-solid fa-signal"></i> '+escapeHtml(a.difficulty)+'</span></div>'+
          '<div class="progress-bar" style="margin-top:8px;height:6px;"><div class="progress-fill" style="width:'+a.percent+'%;background:'+grade.color+'"></div></div>'+
        '</div>'+
        '<div class="result-row-score" style="color:'+grade.color+'">'+a.percent+'%<span>'+a.correct+'/'+a.total+'</span></div>'+
        '<div class="result-row-actions">'+
          '<button class="speech-btn-sm" onclick="reviewAttempt(\''+a.id+'\')"><i class="fa-solid fa-eye"></i> Review</button>'+
          '<button class="speech-btn-sm" onclick="retakeQuiz(\''+a.quizId+'\')"><i class="fa-solid fa-rotate"></i> Retake</button>'+
          '<button class="speech-btn-sm" style="color:var(--danger);border-color:#fecaca" onclick="deleteAttempt(\''+a.id+'\')" title="Delete"><i class="fa-solid fa-trash"></i></button>'+
        '</div>'+
      '</div>';
  }).join('');
}

function renderResultsChart(hist) {
  var chart = document.getElementById('results-chart');
  if (!chart) return;
  if (!hist.length) { chart.innerHTML = '<p class="pdf-empty" style="text-align:center;padding:20px">No data yet — take a quiz to see your progress chart.</p>'; return; }
  var last10 = hist.slice(-10);
  var max = 100;
  chart.innerHTML =
    '<div class="results-chart-bars">' +
      last10.map(function(a,i){
        var h = (a.percent/max*100);
        var col = getGrade(a.percent).color;
        return '<div class="results-chart-col" title="'+escapeHtml(a.quizTitle)+' — '+a.percent+'%">'+
                 '<div class="results-chart-bar" style="height:'+h+'%;background:'+col+'"><span>'+a.percent+'%</span></div>'+
                 '<div class="results-chart-label">Q'+(hist.length - last10.length + i +1)+'</div>'+
               '</div>';
      }).join('') +
    '</div>' +
    '<div class="results-chart-legend"><span>Avg: '+Math.round(hist.reduce(function(s,a){return s+a.percent;},0)/hist.length)+'%</span> • <span>Last 10 attempts</span></div>';
}

function setResultsFilter(f) {
  resultsFilter = f;
  document.querySelectorAll('#results-filter-row .cat-filter').forEach(function(b){
    b.classList.toggle('active', b.dataset.filter===f);
  });
  // also fallback if not using dataset: check onclick contains
  buildResults();
  // ensure active class set manually for our generated buttons (we use onclick not dataset)
  // re-apply after build
  document.querySelectorAll('#results-filter-row .cat-filter').forEach(function(b){
    var isActive = b.getAttribute('onclick') && b.getAttribute('onclick').indexOf("'"+f+"'")!==-1;
    b.classList.toggle('active', isActive);
  });
}

function filterResultsHistory() { renderResultsHistory(loadQuizHistory()); }

function reviewAttempt(id) {
  var hist = loadQuizHistory();
  var att = hist.find(function(a){return a.id===id;});
  if (!att) { showToast('Result not found','error'); return; }
  // show in results detail panel
  var detail = document.getElementById('results-detail');
  var list = document.getElementById('results-detail-list');
  var title = document.getElementById('results-detail-title');
  if (!detail || !list) return;
  title.textContent = att.quizTitle + ' — ' + att.percent + '% ('+att.correct+'/'+att.total+') • ' + att.dateStr;
  list.innerHTML = att.questions.map(function(q,i){
    var userAns = att.answers[i];
    var correct = isAnswerCorrect(q, userAns);
    var userDisplay, correctDisplay;
    if (q.type==='mcq' || q.type==='tf') {
      userDisplay = (userAns!==null && q.options[userAns]) ? escapeHtml(q.options[userAns]) : '<em>—</em>';
      correctDisplay = escapeHtml(q.options[q.answerIndex]);
    } else {
      userDisplay = userAns ? escapeHtml(userAns) : '<em>—</em>';
      correctDisplay = escapeHtml(q.answer);
    }
    return '<div class="quiz-review-item '+(correct?'correct':'wrong')+'">'+
      '<div class="quiz-review-head"><span class="quiz-review-num">Q'+(i+1)+'</span><span class="quiz-review-status '+(correct?'correct':'wrong')+'">'+(correct?'<i class="fa-solid fa-check"></i> Correct':'<i class="fa-solid fa-xmark"></i> Wrong')+'</span></div>'+
      '<div class="quiz-review-q">'+q.question+'</div>'+
      '<div class="quiz-review-ans"><span>Your: <strong>'+userDisplay+'</strong></span> '+(correct?'':'<span>Correct: <strong>'+correctDisplay+'</strong></span>')+'</div>'+
      '<div class="quiz-review-explain">'+q.explanation+'</div>'+
    '</div>';
  }).join('');
  detail.style.display='block';
  detail.scrollIntoView({ behavior:'smooth', block:'nearest'});
  reviewAttemptId = id;
  showToast('Reviewing attempt','info');
}

function closeResultsDetail(){ var d=document.getElementById('results-detail'); if(d) d.style.display='none'; reviewAttemptId=null; }

function retakeQuiz(quizId) {
  showSection('quizzes');
  setTimeout(function(){ startQuiz(quizId); }, 300);
}

function reviewLastAttempt(quizId){
  var hist = loadQuizHistory().filter(function(a){return a.quizId===quizId;});
  if (!hist.length) { showToast('No attempts for this quiz','info'); return; }
  var last = hist[hist.length-1];
  showSection('results');
  setTimeout(function(){ buildResults(); reviewAttempt(last.id); }, 300);
}

function deleteAttempt(id){
  if (!confirm('Delete this result?')) return;
  var hist = loadQuizHistory();
  var idx = hist.findIndex(function(a){return a.id===id;});
  if (idx===-1) return;
  hist.splice(idx,1);
  localStorage.setItem(LS_QUIZ_HISTORY, JSON.stringify(hist));
  buildResults();
  renderQuizCatalog();
  renderQuizStatsMini();
  showToast('Result deleted','info');
  var d=document.getElementById('results-detail'); if(d) d.style.display='none';
}

function exportResults() {
  var hist = loadQuizHistory();
  if (!hist.length) { showToast('No results to export','error'); return; }
  var csv = 'Date,Quiz,Type,Difficulty,Correct,Total,Percent,Time\n';
  hist.forEach(function(a){
    csv += csvEscapeQ(a.dateStr)+','+csvEscapeQ(a.quizTitle)+','+csvEscapeQ(a.type)+','+csvEscapeQ(a.difficulty)+','+a.correct+','+a.total+','+a.percent+','+csvEscapeQ(a.timeStr)+'\n';
  });
  var blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
  triggerDownloadQ(blob, 'eduaccess-quiz-results.csv');
  showToast('Results exported CSV','success');
}
function exportResultsJSON(){
  var hist = loadQuizHistory();
  if (!hist.length) { showToast('No results','error'); return; }
  var blob = new Blob([JSON.stringify(hist,null,2)], {type:'application/json'});
  triggerDownloadQ(blob, 'eduaccess-quiz-results.json');
  showToast('Results exported JSON','success');
}
function csvEscapeQ(s){ s=String(s||'').replace(/"/g,'""'); return /[",\n]/.test(s) ? '"'+s+'"' : '"'+s+'"'; }
function triggerDownloadQ(blob, name){
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); }, 600);
}

function shareLastResult(){
  var hist = loadQuizHistory();
  if (!hist.length) { showToast('No results to share','error'); return; }
  var last = hist[hist.length-1];
  var text = 'EduAccess Quiz: ' + last.quizTitle + ' — ' + last.percent + '% ('+last.correct+'/'+last.total+') in '+last.timeStr;
  if (navigator.share) {
    navigator.share({ title:'EduAccess Result', text:text }).catch(function(){});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function(){ showToast('Result copied to clipboard','success'); });
  } else {
    showToast(text,'info');
  }
}

function downloadCertificate() {
  var hist = loadQuizHistory();
  var att = null;
  if (reviewAttemptId) att = hist.find(function(a){return a.id===reviewAttemptId;});
  if (!att) att = hist.length ? hist[hist.length-1] : null;
  if (!att) { showToast('No result for certificate','error'); return; }
  var grade = getGrade(att.percent);
  var txt = '';
  txt += '╔════════════════════════════════════════════════╗\n';
  txt += '║         EDUACCESS — CERTIFICATE               ║\n';
  txt += '╠════════════════════════════════════════════════╣\n';
  txt += '║  Quiz: ' + att.quizTitle.padEnd(38) + '║\n';
  txt += '║  Score: ' + (att.correct+'/'+att.total+' ('+att.percent+'%) — '+grade.label).padEnd(37) + '║\n';
  txt += '║  Date: ' + att.dateStr.padEnd(38) + '║\n';
  txt += '║  Time: ' + att.timeStr.padEnd(38) + '║\n';
  txt += '║  Difficulty: ' + att.difficulty.padEnd(33) + '║\n';
  txt += '╠════════════════════════════════════════════════╣\n';
  txt += '║  EduAccess • Inclusive Learning Platform      ║\n';
  txt += '║  Verified in-browser result • '+ new Date().toLocaleDateString().padEnd(19) +'║\n';
  txt += '╚════════════════════════════════════════════════╝\n';
  var blob = new Blob([txt], {type:'text/plain;charset=utf-8'});
  triggerDownloadQ(blob, 'EduAccess-Certificate-'+att.percent+'pct.txt');
  showToast('Certificate downloaded','success');
}

/* =========================================================
   UTILS
   ========================================================= */
function shuffleArray(arr){
  var a = arr.slice();
  for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
  // copy back to original if needed — we return new
  return a;
}
function escapeHtmlQC(s){
  if(!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function splitIntoSentencesQC(text){
  if (!text) return [];
  var raw = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g);
  if (!raw) return [text.trim()];
  return raw.map(function(s){return s.trim();}).filter(function(s){return s.length>15;});
}

/* expose */
window.initQuizModule = initQuizModule;
window.setQuizFilter = setQuizFilter;
window.filterQuizCatalog = filterQuizCatalog;
window.createCustomQuiz = createCustomQuiz;
window.startQuiz = startQuiz;
window.answerMCQ = answerMCQ;
window.submitFill = submitFill;
window.nextQuestion = nextQuestion;
window.prevQuestion = prevQuestion;
window.jumpToQuestion = jumpToQuestion;
window.exitQuiz = exitQuiz;
window.submitQuiz = submitQuiz;
window.closeQuizResult = closeQuizResult;
window.retakeCurrentQuiz = retakeCurrentQuiz;
window.setResultsFilter = setResultsFilter;
window.filterResultsHistory = filterResultsHistory;
window.reviewAttempt = reviewAttempt;
window.closeResultsDetail = closeResultsDetail;
window.retakeQuiz = retakeQuiz;
window.reviewLastAttempt = reviewLastAttempt;
window.deleteAttempt = deleteAttempt;
window.exportResults = exportResults;
window.exportResultsJSON = exportResultsJSON;
window.clearAllQuizHistory = clearAllQuizHistory;
window.shareLastResult = shareLastResult;
window.downloadCertificate = downloadCertificate;
window.buildResults = buildResults;

// ensure escapeHtml available (re-use from pdfStudio)
if (typeof escapeHtml === 'undefined') {
  window.escapeHtml = function(s){
    if(!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  };
}
if (typeof escapeRegExp === 'undefined') {
  window.escapeRegExp = function(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); };
}
