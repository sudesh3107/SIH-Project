/* =========================================================
   EDUACCESS - PDF STUDIO
   PDF -> Summarized Text, Flashcards, Audible Format
   Client-side: pdf.js + extractive summarizer + TTS
   ========================================================= */

var pdfText = "";
var pdfSummary = "";
var pdfSummarySentences = [];
var pdfFlashcards = [];
var pdfCurrentCard = 0;
var pdfCardFlipped = false;
var pdfRawSentences = [];
var pdfFileName = "";
var pdfPageCount = 0;
var pdfSummaryLevel = "medium"; // short | medium | detailed

// Audio state
var pdfSpeechQueue = [];
var pdfCurrentUtterance = null;
var pdfIsSpeaking = false;
var pdfIsPaused = false;
var pdfCurrentSentenceIdx = 0;
var pdfAudioSpeed = 1;
var pdfVoices = [];
var pdfSelectedVoiceURI = null;

// PDF.js handle
var pdfJsLib = null;

/* =========================================================
   INIT
   ========================================================= */
function initPdfStudio() {
  setupPdfJs();
  setupPdfDropZone();
  setupPdfInput();
  loadPdfVoices();
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadPdfVoices;
  }
  updatePdfUIState("idle");
}

function setupPdfJs() {
  try {
    if (window.pdfjsLib) {
      pdfJsLib = window.pdfjsLib;
      if (pdfJsLib.GlobalWorkerOptions) {
        pdfJsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }
      console.log("PDF.js loaded via window.pdfjsLib");
      return;
    }
    // fallback: check for pdfjs-dist global
    if (window.pdfjsDistBuildPdf) {
      pdfJsLib = window.pdfjsDistBuildPdf;
    }
  } catch (e) {
    console.warn("PDF.js setup warn:", e);
  }
}

// Lazy load pdf.js if not already present (CDN fallback)
function ensurePdfJs() {
  return new Promise(function(resolve, reject) {
    if (pdfJsLib || window.pdfjsLib) {
      pdfJsLib = pdfJsLib || window.pdfjsLib;
      resolve(pdfJsLib);
      return;
    }
    var script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = function() {
      pdfJsLib = window.pdfjsLib;
      if (pdfJsLib && pdfJsLib.GlobalWorkerOptions) {
        pdfJsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }
      console.log("PDF.js lazy loaded");
      resolve(pdfJsLib);
    };
    script.onerror = function() {
      reject(new Error("Failed to load PDF.js"));
    };
    document.head.appendChild(script);
  });
}

/* =========================================================
   DROP ZONE + INPUT
   ========================================================= */
function setupPdfDropZone() {
  var zone = document.getElementById("pdf-drop-zone");
  if (!zone) return;
  ["dragenter", "dragover"].forEach(function(evt) {
    zone.addEventListener(evt, function(e) {
      e.preventDefault(); e.stopPropagation();
      zone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach(function(evt) {
    zone.addEventListener(evt, function(e) {
      e.preventDefault(); e.stopPropagation();
      if (evt === "dragleave" || evt === "drop") zone.classList.remove("dragover");
    });
  });
  zone.addEventListener("drop", function(e) {
    var files = e.dataTransfer && e.dataTransfer.files;
    if (files && files.length) handlePdfFile(files[0]);
  });
  zone.addEventListener("click", function() {
    var input = document.getElementById("pdf-file-input");
    if (input) input.click();
  });
  zone.addEventListener("keydown", function(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      var input = document.getElementById("pdf-file-input");
      if (input) input.click();
    }
  });
}

function setupPdfInput() {
  var input = document.getElementById("pdf-file-input");
  if (!input) return;
  input.addEventListener("change", function(e) {
    var file = e.target.files && e.target.files[0];
    if (file) handlePdfFile(file);
  });
}

/* =========================================================
   HANDLE FILE
   ========================================================= */
async function handlePdfFile(file) {
  if (!file) return;
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    showToast("Please upload a valid PDF file", "error");
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    showToast("File too large (max 20MB)", "error");
    return;
  }
  pdfFileName = file.name;
  updatePdfUIState("loading");
  setPdfStatus("Loading PDF: " + file.name + " ...", "info");
  showToast("Reading " + file.name, "info");

  try {
    await ensurePdfJs();
    var textData = await extractTextFromPdf(file);
    pdfText = textData.text;
    pdfPageCount = textData.pageCount;
    pdfRawSentences = splitIntoSentences(pdfText);

    if (!pdfText || pdfText.trim().length < 50) {
      setPdfStatus("Could not extract readable text (scanned PDF may need OCR).", "error");
      showToast("No readable text found in PDF", "error");
      updatePdfUIState("idle");
      return;
    }

    document.getElementById("pdf-file-meta").textContent =
      pdfFileName + " • " + pdfPageCount + " page(s) • " + pdfRawSentences.length + " sentences • " + pdfText.split(/\s+/).length + " words";
    document.getElementById("pdf-file-meta").style.display = "block";

    // Show raw preview (collapsible)
    var rawPreview = document.getElementById("pdf-raw-preview");
    if (rawPreview) {
      rawPreview.textContent = pdfText.slice(0, 4000) + (pdfText.length > 4000 ? " ..." : "");
    }

    // Auto-generate outputs
    regenerateSummary();
    generateFlashcardsFromText();
    prepareAudioQueue();

    updatePdfUIState("ready");
    setPdfStatus("PDF processed successfully — choose a tab below: Summary, Flashcards, Audio", "success");
    showToast("PDF processed: " + pdfPageCount + " pages", "success");

    // Switch to summary tab by default
    switchPdfTab("summary");
  } catch (err) {
    console.error("PDF extract error:", err);
    var msg = err && err.message ? err.message : String(err);
    if (msg.indexOf("password") !== -1 || msg.indexOf("encrypted") !== -1) {
      setPdfStatus("This PDF is password-protected / encrypted.", "error");
      showToast("Encrypted PDF not supported", "error");
    } else {
      setPdfStatus("Failed to read PDF: " + msg, "error");
      showToast("Failed to read PDF", "error");
    }
    updatePdfUIState("idle");
  } finally {
    // reset input so same file can be re-selected
    var inp = document.getElementById("pdf-file-input");
    if (inp) inp.value = "";
  }
}

/* =========================================================
   EXTRACT TEXT WITH PDF.JS
   ========================================================= */
function extractTextFromPdf(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = async function(e) {
      try {
        var typed = new Uint8Array(e.target.result);
        var loadingTask = pdfJsLib.getDocument({ data: typed, useWorkerFetch: false, isEvalSupported: false });
        var pdf = await loadingTask.promise;
        var pageCount = pdf.numPages;
        var fullText = "";
        var progressEl = document.getElementById("pdf-extract-progress");
        if (progressEl) {
          progressEl.style.display = "block";
          progressEl.textContent = "Extracting 0 / " + pageCount + " pages...";
        }
        for (var i = 1; i <= pageCount; i++) {
          var page = await pdf.getPage(i);
          var content = await page.getTextContent();
          var pageText = content.items.map(function(item) { return item.str; }).join(" ");
          // add line breaks per page + heuristic paragraph
          fullText += pageText + "\n\n";
          if (progressEl) progressEl.textContent = "Extracting " + i + " / " + pageCount + " pages...";
          // yield to UI
          await new Promise(function(r){ setTimeout(r, 0); });
        }
        if (progressEl) progressEl.style.display = "none";
        // clean: collapse multiple spaces, normalize
        fullText = fullText.replace(/\s+/g, " ").replace(/\s*([.!?])\s*/g, "$1 ").trim();
        resolve({ text: fullText, pageCount: pageCount });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = function() { reject(new Error("Failed to read file")); };
    reader.readAsArrayBuffer(file);
  });
}

/* =========================================================
   SUMMARIZER — TF-based extractive
   ========================================================= */
var STOPWORDS = new Set([
  "a","an","the","and","or","but","is","are","was","were","be","been","being","to","of","in","on","at","for","with","about","against","between","into","through","during","before","after","above","below","from","up","down","out","over","under","again","further","then","once","here","there","when","where","why","how","all","any","both","each","few","more","most","other","some","such","no","nor","not","only","own","same","so","than","too","very","can","will","just","don","should","now","i","me","my","myself","we","our","ours","ourselves","you","your","yours","yourself","yourselves","he","him","his","himself","she","her","hers","herself","it","its","itself","they","them","their","theirs","themselves","what","which","who","whom","this","that","that'll","these","those","am","has","have","had","having","do","does","did","doing","because","until","while","by","as","if","into","isnt","arent","wasnt","werent","hasnt","havent","hadnt","would","could","should","might","must","shall","may","also","however","therefore","thus","hence","among","within","without","per","via","above","below","using","used","use","uses","including","include","includes","based","may","many","much","every","shall"
]);

function splitIntoSentences(text) {
  if (!text) return [];
  // Robust split: keep abbreviations roughly safe, split on .!? followed by space+capital
  var raw = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g);
  if (!raw) return [text.trim()];
  return raw.map(function(s){ return s.trim(); }).filter(function(s){ return s.length > 15; });
}

function tokenizeWords(sentence) {
  return sentence.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

function regenerateSummary() {
  if (!pdfText) return;
  var level = pdfSummaryLevel || "medium";
  var sentences = pdfRawSentences.slice();
  if (sentences.length === 0) return;

  // Compute word frequencies
  var freq = {};
  sentences.forEach(function(s){
    var words = tokenizeWords(s);
    words.forEach(function(w){
      if (STOPWORDS.has(w) || w.length < 3) return;
      freq[w] = (freq[w] || 0) + 1;
    });
  });
  // Normalize by max freq
  var maxFreq = 0;
  Object.keys(freq).forEach(function(k){ if (freq[k] > maxFreq) maxFreq = freq[k]; });
  if (maxFreq === 0) maxFreq = 1;

  // Score sentences
  var scored = sentences.map(function(s, idx){
    var words = tokenizeWords(s);
    var score = 0;
    var meaningful = 0;
    words.forEach(function(w){
      if (STOPWORDS.has(w) || w.length < 3) return;
      meaningful++;
      var f = (freq[w] || 0) / maxFreq;
      score += f;
    });
    // length normalization: prefer 10-28 words, penalize very short/long
    var len = words.length;
    var lenPenalty = 1;
    if (len < 8) lenPenalty = 0.6;
    else if (len > 32) lenPenalty = 0.85;
    // position bonus: first 3 and last 2 sentences slightly boosted (lead bias)
    var posBonus = 1;
    if (idx < 3) posBonus = 1.15;
    else if (idx >= sentences.length - 2) posBonus = 1.05;
    // keyword bonus: sentences containing numbers / capitalized phrases?
    var kwBonus = 1;
    if (/[A-Z][a-z]+ [A-Z][a-z]+/.test(s)) kwBonus = 1.08;
    var final = meaningful ? (score / Math.sqrt(meaningful)) * lenPenalty * posBonus * kwBonus : 0;
    return { idx: idx, sentence: s, score: final, len: len };
  });

  // Determine summary size
  var total = sentences.length;
  var n;
  if (level === "short") n = Math.max(3, Math.min(5, Math.ceil(total * 0.12)));
  else if (level === "detailed") n = Math.max(7, Math.min(14, Math.ceil(total * 0.30)));
  else n = Math.max(5, Math.min(8, Math.ceil(total * 0.20))); // medium

  n = Math.min(n, total);

  // Pick top N by score, then restore original order
  var top = scored.slice().sort(function(a,b){ return b.score - a.score; }).slice(0, n);
  top.sort(function(a,b){ return a.idx - b.idx; });

  pdfSummarySentences = top.map(function(x){ return x.sentence; });
  pdfSummary = pdfSummarySentences.join(" ");

  renderSummary();
  // also update audio if needed
  prepareAudioQueue();
}

function setSummaryLevel(level) {
  pdfSummaryLevel = level;
  // update button actives
  document.querySelectorAll(".pdf-summary-level-btn").forEach(function(b){
    b.classList.toggle("active", b.dataset.level === level);
  });
  if (pdfText) {
    regenerateSummary();
    generateFlashcardsFromText();
    showToast("Summary: " + level + " length", "info");
  }
}

function renderSummary() {
  var container = document.getElementById("pdf-summary-content");
  var bulletsEl = document.getElementById("pdf-summary-bullets");
  var statsEl = document.getElementById("pdf-summary-stats");
  if (!container) return;

  if (!pdfSummary) {
    container.innerHTML = '<p class="pdf-empty">No summary yet. Upload a PDF to generate one.</p>';
    if (bulletsEl) bulletsEl.innerHTML = "";
    if (statsEl) statsEl.textContent = "";
    return;
  }

  // Display as paragraph + bullet points
  container.innerHTML = '<p class="pdf-summary-para">' + escapeHtml(pdfSummary) + '</p>';

  if (bulletsEl) {
    bulletsEl.innerHTML = pdfSummarySentences.map(function(s, i){
      return '<li class="pdf-bullet"><span class="pdf-bullet-num">' + (i+1) + '</span><span>' + escapeHtml(s) + '</span></li>';
    }).join("");
  }
  if (statsEl) {
    var origWords = pdfText.split(/\s+/).length;
    var summWords = pdfSummary.split(/\s+/).length;
    var compression = origWords ? Math.round((1 - summWords/origWords)*100) : 0;
    statsEl.textContent = pdfSummarySentences.length + " sentences • " + summWords + " words • " + compression + "% shorter than original (" + origWords + " words)";
  }

  // Enable copy/download buttons
  var has = !!pdfSummary;
  ["pdf-btn-copy-summary","pdf-btn-download-summary","pdf-btn-speak-summary","pdf-btn-audio-summary"].forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.disabled = !has;
  });
}

/* =========================================================
   FLASHCARDS — generation + UI
   ========================================================= */
function generateFlashcardsFromText() {
  if (!pdfSummarySentences || !pdfSummarySentences.length) {
    if (pdfRawSentences.length) pdfSummarySentences = pdfRawSentences.slice(0, 5);
    else return;
  }
  // Use summary sentences as source, top up to 8
  var source = pdfSummarySentences.slice(0, 8);
  // If short, pad with top scored sentences
  if (source.length < 5 && pdfRawSentences.length > source.length) {
    var extra = pdfRawSentences.filter(function(s){ return source.indexOf(s)===-1; }).slice(0, 5 - source.length);
    source = source.concat(extra);
  }

  // Word freq for keyword extraction (reuse)
  var freq = {};
  source.forEach(function(s){
    tokenizeWords(s).forEach(function(w){
      if (STOPWORDS.has(w) || w.length < 4) return;
      freq[w] = (freq[w]||0)+1;
    });
  });

  var cards = [];
  source.forEach(function(sentence, idx){
    var words = sentence.split(/\s+/);
    var tokens = tokenizeWords(sentence);
    // find best keyword: highest freq, longest, not stopword, prefer capitalized
    var best = null, bestScore = -1;
    tokens.forEach(function(w){
      if (STOPWORDS.has(w) || w.length < 4) return;
      var score = (freq[w]||0)*2 + w.length*0.3;
      // bonus if appears capitalized in original sentence
      if (new RegExp("\\b" + w + "\\b","i").test(sentence) && /[A-Z]/.test(sentence.match(new RegExp("\\b" + escapeRegExp(w) + "\\b","i"))||[""])[0]) score+=1;
      if (score > bestScore) { bestScore = score; best = w; }
    });
    if (!best) best = tokens.filter(function(w){ return w.length > 4 && !STOPWORDS.has(w); })[0] || tokens[0] || "concept";

    // Clean keyword: original casing from sentence
    var keywordOriginal = "";
    var m = sentence.match(new RegExp("\\b" + escapeRegExp(best) + "\\b","i"));
    keywordOriginal = m ? m[0] : best;

    // Cloze question
    var cloze = sentence.replace(new RegExp("\\b" + escapeRegExp(keywordOriginal) + "\\b","i"), "______");
    // Only replace first occurrence
    // Types: 1) cloze, 2) what does doc say about keyword, 3) true/false via sentence
    var qType = idx % 3;
    var q, a, hint;
    if (qType === 0) {
      q = cloze;
      a = keywordOriginal;
      hint = "Fill in the blank";
    } else if (qType === 1) {
      q = "What does the document state about \"" + keywordOriginal + "\"?";
      a = sentence;
      hint = "Key point";
    } else {
      q = "Explain in your own words: " + sentence.slice(0, 80) + (sentence.length>80 ? "..." : "");
      a = sentence;
      hint = "Recall & explain";
    }

    cards.push({
      id: idx+1,
      question: q,
      answer: a,
      keyword: keywordOriginal,
      source: sentence,
      hint: hint,
      fullSentence: sentence
    });
  });

  pdfFlashcards = cards;
  pdfCurrentCard = 0;
  pdfCardFlipped = false;
  renderFlashcards();
}

function renderFlashcards() {
  var container = document.getElementById("pdf-flashcards-area");
  var counter = document.getElementById("pdf-fc-counter");
  var progress = document.getElementById("pdf-fc-progress");
  var empty = document.getElementById("pdf-fc-empty");
  if (!container) return;

  if (!pdfFlashcards || !pdfFlashcards.length) {
    container.innerHTML = "";
    if (counter) counter.textContent = "No cards yet";
    if (progress) progress.style.width = "0%";
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  var card = pdfFlashcards[pdfCurrentCard];
  var isFlipped = pdfCardFlipped;

  container.innerHTML =
    '<div class="pdf-flashcard ' + (isFlipped ? 'flipped' : '') + '" onclick="flipPdfCard()" role="button" tabindex="0" aria-label="Flashcard ' + (pdfCurrentCard+1) + ' of ' + pdfFlashcards.length + ', click to flip">' +
      '<div class="pdf-flashcard-inner">' +
        '<div class="pdf-flashcard-front">' +
          '<div class="pdf-fc-badge">' + escapeHtml(card.hint) + ' • Card ' + (pdfCurrentCard+1) + '/' + pdfFlashcards.length + '</div>' +
          '<div class="pdf-fc-question">' + escapeHtml(card.question) + '</div>' +
          '<div class="pdf-fc-keyword-hint">Keyword: <strong>' + escapeHtml(card.keyword) + '</strong></div>' +
          '<div class="pdf-fc-flip-hint"><i class="fa-solid fa-rotate"></i> Click to reveal answer</div>' +
        '</div>' +
        '<div class="pdf-flashcard-back">' +
          '<div class="pdf-fc-badge success"><i class="fa-solid fa-check"></i> Answer</div>' +
          '<div class="pdf-fc-answer">' + escapeHtml(card.answer) + '</div>' +
          '<div class="pdf-fc-source"><i class="fa-solid fa-book-open"></i> Source: ' + escapeHtml(card.source.slice(0,120)) + (card.source.length>120?'...':'') + '</div>' +
          '<div class="pdf-fc-flip-hint"><i class="fa-solid fa-rotate-left"></i> Click to hide</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  // add keyboard flip
  var el = container.querySelector(".pdf-flashcard");
  if (el) el.addEventListener("keydown", function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); flipPdfCard(); }});

  if (counter) counter.textContent = (pdfCurrentCard+1) + " / " + pdfFlashcards.length;
  if (progress) progress.style.width = ((pdfCurrentCard+1)/pdfFlashcards.length*100) + "%";

  // update nav buttons
  var prev = document.getElementById("pdf-fc-prev");
  var next = document.getElementById("pdf-fc-next");
  if (prev) prev.disabled = pdfCurrentCard === 0;
  if (next) next.disabled = pdfCurrentCard === pdfFlashcards.length -1;
  var flipBtn = document.getElementById("pdf-fc-flip");
  if (flipBtn) flipBtn.innerHTML = isFlipped ? '<i class="fa-solid fa-eye-slash"></i> Hide' : '<i class="fa-solid fa-eye"></i> Reveal';

  // dots
  var dots = document.getElementById("pdf-fc-dots");
  if (dots) {
    dots.innerHTML = pdfFlashcards.map(function(_, i){
      return '<span class="pdf-fc-dot ' + (i===pdfCurrentCard ? 'active' : '') + (i<pdfCurrentCard ? ' seen' : '') + '" onclick="goToPdfCard('+i+')"></span>';
    }).join("");
  }
}

function flipPdfCard() {
  pdfCardFlipped = !pdfCardFlipped;
  renderFlashcards();
  // optional haptic/toast not needed
}

function navigatePdfCard(dir) {
  var next = pdfCurrentCard + dir;
  if (next < 0 || next >= pdfFlashcards.length) return;
  pdfCurrentCard = next;
  pdfCardFlipped = false;
  renderFlashcards();
}

function goToPdfCard(idx) {
  if (idx <0 || idx >= pdfFlashcards.length) return;
  pdfCurrentCard = idx;
  pdfCardFlipped = false;
  renderFlashcards();
}

function shufflePdfCards() {
  if (!pdfFlashcards.length) return;
  // Fisher-Yates
  for (var i = pdfFlashcards.length -1; i>0; i--) {
    var j = Math.floor(Math.random()*(i+1));
    var tmp = pdfFlashcards[i]; pdfFlashcards[i]=pdfFlashcards[j]; pdfFlashcards[j]=tmp;
  }
  pdfCurrentCard = 0;
  pdfCardFlipped = false;
  renderFlashcards();
  showToast("Flashcards shuffled", "info");
}

/* =========================================================
   AUDIO — TTS for pdf summary/full
   ========================================================= */
function loadPdfVoices() {
  try {
    var voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    pdfVoices = voices;
    var sel = document.getElementById("pdf-voice-select");
    if (!sel) return;
    sel.innerHTML = "";
    if (!voices.length) {
      sel.innerHTML = '<option value="">Default voice</option>';
      return;
    }
    voices.forEach(function(v, i){
      var opt = document.createElement("option");
      opt.value = v.voiceURI;
      opt.textContent = v.name + " (" + v.lang + ")" + (v.default ? " — default" : "");
      if (pdfSelectedVoiceURI === v.voiceURI) opt.selected = true;
      sel.appendChild(opt);
    });
    // auto-select English if none selected
    if (!pdfSelectedVoiceURI) {
      var en = voices.find(function(v){ return v.lang && v.lang.toLowerCase().startsWith("en"); });
      if (en) {
        pdfSelectedVoiceURI = en.voiceURI;
        sel.value = en.voiceURI;
      }
    }
    sel.onchange = function(){
      pdfSelectedVoiceURI = sel.value;
      showToast("Voice changed", "info");
    };
  } catch(e) {}
}

function prepareAudioQueue() {
  // Build queue from current summary (or full text if user toggles)
  var audioSource = document.getElementById("pdf-audio-source");
  var useFull = audioSource && audioSource.value === "full";
  var text = useFull ? pdfText : pdfSummary;
  if (!text) pdfSpeechQueue = [];
  else pdfSpeechQueue = splitIntoSentences(text);
  renderAudioQueue();
}

function renderAudioQueue() {
  var list = document.getElementById("pdf-audio-sentences");
  var count = document.getElementById("pdf-audio-count");
  if (!list) return;
  if (!pdfSpeechQueue.length) {
    list.innerHTML = '<p class="pdf-empty" style="padding:12px">No audio queue. Generate a summary first.</p>';
    if (count) count.textContent = "0 sentences";
    return;
  }
  if (count) count.textContent = pdfSpeechQueue.length + " sentence(s) • ~" + Math.ceil(pdfSpeechQueue.join(" ").split(/\s+/).length/150) + " min";
  list.innerHTML = pdfSpeechQueue.map(function(s, i){
    var isActive = pdfIsSpeaking && i === pdfCurrentSentenceIdx;
    var isPast = i < pdfCurrentSentenceIdx && pdfIsSpeaking;
    return '<div class="pdf-audio-sentence ' + (isActive ? 'active' : '') + (isPast ? ' past' : '') + '" onclick="playPdfFromSentence('+i+')" title="Click to play from here">' +
             '<span class="pdf-audio-idx">' + (i+1) + '</span>' +
             '<span class="pdf-audio-text">' + escapeHtml(s) + '</span>' +
             (isActive ? '<span class="pdf-audio-now"><i class="fa-solid fa-volume-high"></i> Playing</span>' : '') +
           '</div>';
  }).join("");
  // scroll active into view
  if (pdfIsSpeaking) {
    var activeEl = list.querySelector(".pdf-audio-sentence.active");
    if (activeEl) activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function updatePdfAudioControls() {
  var playBtn = document.getElementById("pdf-audio-play");
  var pauseBtn = document.getElementById("pdf-audio-pause");
  var stopBtn = document.getElementById("pdf-audio-stop");
  if (!playBtn) return;
  if (pdfIsSpeaking && !pdfIsPaused) {
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    playBtn.onclick = pausePdfAudio;
    if (pauseBtn) pauseBtn.style.display = "none";
  } else if (pdfIsPaused) {
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
    playBtn.onclick = resumePdfAudio;
  } else {
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i> Play';
    playBtn.onclick = function(){ playPdfFromSentence(0); };
  }
  if (stopBtn) stopBtn.disabled = !pdfIsSpeaking && !pdfIsPaused;
}

function playPdfFromSentence(idx) {
  stopPdfAudio(false);
  if (!pdfSpeechQueue.length) {
    showToast("No text to play", "error");
    return;
  }
  pdfCurrentSentenceIdx = Math.max(0, Math.min(idx, pdfSpeechQueue.length -1));
  pdfIsSpeaking = true;
  pdfIsPaused = false;
  setPdfStatus("Speaking... (" + (pdfCurrentSentenceIdx+1) + "/" + pdfSpeechQueue.length + ")", "info");
  updatePdfAudioControls();
  speakPdfNext();
  renderAudioQueue();
}

function speakPdfNext() {
  if (pdfCurrentSentenceIdx >= pdfSpeechQueue.length) {
    // done
    pdfIsSpeaking = false;
    pdfIsPaused = false;
    setPdfStatus("Playback finished", "success");
    showToast("Audio finished", "success");
    updatePdfAudioControls();
    renderAudioQueue();
    return;
  }
  var text = pdfSpeechQueue[pdfCurrentSentenceIdx];
  if (!window.speechSynthesis) {
    showToast("Text-to-speech not supported in this browser", "error");
    pdfIsSpeaking = false;
    return;
  }
  // cancel any stale
  window.speechSynthesis.cancel();
  var utter = new SpeechSynthesisUtterance(text);
  utter.rate = pdfAudioSpeed || 1;
  utter.pitch = 1;
  utter.volume = 1;
  // voice
  if (pdfSelectedVoiceURI && pdfVoices.length) {
    var v = pdfVoices.find(function(x){ return x.voiceURI === pdfSelectedVoiceURI; });
    if (v) utter.voice = v;
  } else if (pdfVoices.length) {
    // prefer en
    var en = pdfVoices.find(function(v){ return v.lang && v.lang.toLowerCase().startsWith("en"); });
    if (en) utter.voice = en;
  }
  pdfCurrentUtterance = utter;
  utter.onend = function(){
    if (pdfIsPaused) return;
    pdfCurrentSentenceIdx++;
    renderAudioQueue();
    setPdfStatus("Speaking... (" + (pdfCurrentSentenceIdx+1) + "/" + pdfSpeechQueue.length + ")", "info");
    // small pause between sentences
    setTimeout(function(){
      if (pdfIsSpeaking && !pdfIsPaused) speakPdfNext();
    }, 180);
  };
  utter.onerror = function(e){
    console.warn("TTS error", e);
    pdfIsPaused = false;
    pdfIsSpeaking = false;
    updatePdfAudioControls();
    setPdfStatus("Audio error", "error");
  };
  utter.onpause = function(){};
  // highlight
  renderAudioQueue();
  updatePdfAudioControls();
  window.speechSynthesis.speak(utter);
}

function pausePdfAudio() {
  if (!pdfIsSpeaking || pdfIsPaused) return;
  try { window.speechSynthesis.pause(); } catch(e){}
  pdfIsPaused = true;
  setPdfStatus("Paused at sentence " + (pdfCurrentSentenceIdx+1), "info");
  showToast("Paused", "info");
  updatePdfAudioControls();
}

function resumePdfAudio() {
  if (!pdfIsPaused) return;
  try { window.speechSynthesis.resume(); } catch(e){}
  pdfIsPaused = false;
  setPdfStatus("Resumed", "info");
  showToast("Resumed", "info");
  // edge: chrome may need to re-trigger if queue ended while paused (rare)
  if (!window.speechSynthesis.speaking) {
    speakPdfNext();
  }
  updatePdfAudioControls();
}

function stopPdfAudio(showMsg) {
  if (typeof showMsg === "undefined") showMsg = true;
  pdfIsSpeaking = false;
  pdfIsPaused = false;
  pdfCurrentSentenceIdx = 0;
  try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch(e){}
  pdfCurrentUtterance = null;
  updatePdfAudioControls();
  renderAudioQueue();
  if (showMsg) {
    setPdfStatus("Stopped", "info");
    showToast("Audio stopped", "info");
  }
}

function updatePdfAudioSpeed(val) {
  pdfAudioSpeed = parseFloat(val) || 1;
  var el = document.getElementById("pdf-speed-value");
  if (el) el.textContent = pdfAudioSpeed.toFixed(1) + "x";
  if (pdfCurrentUtterance) pdfCurrentUtterance.rate = pdfAudioSpeed;
  // global speechSpeed compat
  if (typeof speechSpeed !== "undefined") speechSpeed = pdfAudioSpeed;
}

function onPdfAudioSourceChange() {
  prepareAudioQueue();
  renderAudioQueue();
  // reset playing
  stopPdfAudio(false);
  showToast("Audio source updated", "info");
}

/* =========================================================
   EXPORT / COPY / DOWNLOAD
   ========================================================= */
function copyPdfSummary() {
  if (!pdfSummary) { showToast("No summary to copy", "error"); return; }
  navigator.clipboard.writeText(pdfSummary).then(function(){
    showToast("Summary copied!", "success");
  }).catch(function(){
    // fallback
    var ta = document.createElement("textarea");
    ta.value = pdfSummary;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); showToast("Summary copied!", "success"); } catch(e){ showToast("Copy failed", "error"); }
    ta.remove();
  });
}

function downloadPdfSummary() {
  if (!pdfSummary) { showToast("No summary to download", "error"); return; }
  var blob = new Blob([pdfSummary + "\n\n---\nSource: " + pdfFileName + "\nPages: " + pdfPageCount + "\nGenerated: " + new Date().toLocaleString() + "\n"], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, pdfFileName.replace(/\.pdf$/i,"") + "-summary.txt");
  showToast("Summary downloaded", "success");
}

function downloadPdfFlashcards() {
  if (!pdfFlashcards.length) { showToast("No flashcards to export", "error"); return; }
  var lines = [];
  lines.push("Flashcards — " + pdfFileName);
  lines.push("Generated: " + new Date().toLocaleString());
  lines.push("=".repeat(60));
  pdfFlashcards.forEach(function(c, i){
    lines.push("");
    lines.push("Card " + (i+1) + " [" + c.hint + "]");
    lines.push("Q: " + c.question);
    lines.push("A: " + c.answer);
    lines.push("Keyword: " + c.keyword);
    lines.push("---");
  });
  var blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, pdfFileName.replace(/\.pdf$/i,"") + "-flashcards.txt");
  showToast("Flashcards downloaded", "success");
}

function downloadPdfFlashcardsCSV() {
  if (!pdfFlashcards.length) { showToast("No flashcards", "error"); return; }
  var csv = 'Question,Answer,Keyword,Hint,Source\n';
  pdfFlashcards.forEach(function(c){
    csv += csvEscape(c.question) + "," + csvEscape(c.answer) + "," + csvEscape(c.keyword) + "," + csvEscape(c.hint) + "," + csvEscape(c.source) + "\n";
  });
  var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, pdfFileName.replace(/\.pdf$/i,"") + "-flashcards.csv");
  showToast("CSV downloaded", "success");
}

function downloadPdfAudioTranscript() {
  var text = pdfSpeechQueue.join(" ");
  if (!text) { showToast("No audio transcript", "error"); return; }
  var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, pdfFileName.replace(/\.pdf$/i,"") + "-audio-transcript.txt");
  showToast("Transcript downloaded", "success");
}

function triggerDownload(blob, filename) {
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); }, 500);
}

function csvEscape(s) {
  s = String(s||"").replace(/"/g,'""');
  if (/[",\n]/.test(s)) return '"' + s + '"';
  return '"' + s + '"';
}

function togglePdfRawPreview() {
  var box = document.getElementById("pdf-raw-box");
  var btn = document.getElementById("pdf-btn-toggle-raw");
  if (!box) return;
  var isHidden = box.style.display === "none" || !box.style.display;
  // check computed? just toggle based on current
  if (box.style.display === "none" || getComputedStyle(box).display === "none") {
    box.style.display = "block";
    if (btn) btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i> Hide extracted text';
  } else {
    box.style.display = "none";
    if (btn) btn.innerHTML = '<i class="fa-solid fa-eye"></i> Show extracted text';
  }
}

/* =========================================================
   TABS
   ========================================================= */
function switchPdfTab(tab) {
  var tabs = ["summary","flashcards","audio"];
  tabs.forEach(function(t){
    var btn = document.getElementById("pdf-tab-" + t);
    var panel = document.getElementById("pdf-panel-" + t);
    if (btn) btn.classList.toggle("active", t === tab);
    if (panel) panel.style.display = t === tab ? "block" : "none";
  });
  // ensure flashcards rendered when switching
  if (tab === "flashcards") renderFlashcards();
  if (tab === "audio") { prepareAudioQueue(); renderAudioQueue(); loadPdfVoices(); }
}

/* =========================================================
   DEMO — load sample text without PDF (for testing)
   ========================================================= */
function loadPdfDemo() {
  var demo = "EduAccess is an inclusive learning platform built for every learner. It empowers disabled learners through sign language avatars, text-to-speech, real-time captions, and accessible design. The platform provides 3D sign language demonstrations for every letter and common word, helping students learn American Sign Language interactively. Speech Mode reads content aloud for visually impaired learners and supports multiple voices and speeds. Live Captions convert spoken words into subtitles in real time, aiding hearing-impaired users during lessons and presentations. Full accessibility features include dyslexia-friendly fonts, high-contrast mode, adjustable text size, and screen reader support. Practice Mode lets learners quiz themselves on sign language with fun, interactive exercises that reinforce memory through repetition and streaks. Progress tracking shows total points, current streak, lessons completed, and signs available, while structured learning paths guide students from alphabet basics to advanced communication. The sign language lab displays a 3D avatar that can animate finger positions for each sign, with navigation controls to browse forward and backward through lessons. The dictionary allows searching and filtering by category such as Greetings, Essential Words, Family, Feelings, Technology, and Fun & Activities. Lessons range from The ASL Alphabet and Friendly Greetings to Essential Communication, Family & Feelings, and Tech & Modern Signs. Teachers can use EduAccess to create inclusive classrooms where every student, regardless of ability, can participate equally and learn at their own pace. Future work includes PDF Studio, which extracts text from uploaded documents and automatically produces concise summaries, study flashcards with cloze questions, and audible narration via text-to-speech. This removes barriers for students who need simplified reading, quick revision, or audio alternatives, and it works entirely in the browser without sending data to external servers.";
  pdfText = demo;
  pdfFileName = "EduAccess-demo.txt";
  pdfPageCount = 1;
  pdfRawSentences = splitIntoSentences(pdfText);
  var meta = document.getElementById("pdf-file-meta");
  if (meta) {
    meta.textContent = pdfFileName + " • Demo text • " + pdfRawSentences.length + " sentences • " + pdfText.split(/\s+/).length + " words";
    meta.style.display = "block";
  }
  var rawPreview = document.getElementById("pdf-raw-preview");
  if (rawPreview) rawPreview.textContent = pdfText.slice(0, 4000);
  regenerateSummary();
  generateFlashcardsFromText();
  prepareAudioQueue();
  updatePdfUIState("ready");
  switchPdfTab("summary");
  setPdfStatus("Demo loaded — try Summaries, Flashcards, Audio. Upload a PDF to replace it.", "info");
  showToast("Demo loaded", "success");
}

/* =========================================================
   UI STATE
   ========================================================= */
function updatePdfUIState(state) {
  var drop = document.getElementById("pdf-drop-zone");
  var loading = document.getElementById("pdf-loading");
  var ready = document.getElementById("pdf-ready");
  var tabsRow = document.getElementById("pdf-tabs-row");
  if (!drop || !loading || !ready) return;
  if (state === "loading") {
    loading.style.display = "flex";
    ready.style.display = "none";
    drop.style.opacity = "0.7";
    drop.style.pointerEvents = "none";
  } else if (state === "ready") {
    loading.style.display = "none";
    ready.style.display = "block";
    if (tabsRow) tabsRow.style.display = "flex";
    drop.style.opacity = "1";
    drop.style.pointerEvents = "auto";
  } else {
    loading.style.display = "none";
    if (!pdfText) {
      ready.style.display = "none";
      if (tabsRow) tabsRow.style.display = "none";
    } else {
      ready.style.display = "block";
    }
    drop.style.opacity = "1";
    drop.style.pointerEvents = "auto";
  }
}

function setPdfStatus(msg, type) {
  var el = document.getElementById("pdf-status");
  if (!el) return;
  el.textContent = msg;
  el.className = "pdf-status " + (type || "info");
}

function clearPdfStudio() {
  stopPdfAudio(false);
  pdfText = "";
  pdfSummary = "";
  pdfSummarySentences = [];
  pdfFlashcards = [];
  pdfCurrentCard = 0;
  pdfCardFlipped = false;
  pdfRawSentences = [];
  pdfPageCount = 0;
  pdfFileName = "";
  pdfSpeechQueue = [];
  pdfCurrentSentenceIdx = 0;
  var meta = document.getElementById("pdf-file-meta");
  if (meta) meta.style.display = "none";
  var raw = document.getElementById("pdf-raw-preview");
  if (raw) raw.textContent = "";
  var box = document.getElementById("pdf-raw-box");
  if (box) box.style.display = "none";
  updatePdfUIState("idle");
  setPdfStatus("Ready — upload a PDF to begin", "info");
  showToast("Cleared", "info");
  renderSummary();
  renderFlashcards();
  renderAudioQueue();
}

/* =========================================================
   HELPERS
   ========================================================= */
function escapeHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escapeRegExp(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

/* Expose globals for inline handlers */
window.initPdfStudio = initPdfStudio;
window.handlePdfFile = handlePdfFile;
window.switchPdfTab = switchPdfTab;
window.setSummaryLevel = setSummaryLevel;
window.copyPdfSummary = copyPdfSummary;
window.downloadPdfSummary = downloadPdfSummary;
window.downloadPdfFlashcards = downloadPdfFlashcards;
window.downloadPdfFlashcardsCSV = downloadPdfFlashcardsCSV;
window.downloadPdfAudioTranscript = downloadPdfAudioTranscript;
window.flipPdfCard = flipPdfCard;
window.navigatePdfCard = navigatePdfCard;
window.goToPdfCard = goToPdfCard;
window.shufflePdfCards = shufflePdfCards;
window.playPdfFromSentence = playPdfFromSentence;
window.pausePdfAudio = pausePdfAudio;
window.resumePdfAudio = resumePdfAudio;
window.stopPdfAudio = stopPdfAudio;
window.updatePdfAudioSpeed = updatePdfAudioSpeed;
window.onPdfAudioSourceChange = onPdfAudioSourceChange;
window.togglePdfRawPreview = togglePdfRawPreview;
window.clearPdfStudio = clearPdfStudio;
window.loadPdfDemo = loadPdfDemo;
