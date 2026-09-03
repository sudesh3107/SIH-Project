/* =========================================================
   EduAccess - Live Sign Detect (Webcam -> Sign + Meaning)
   Uses MediaPipe Hands (landmarks) + template matching against
   SIGN_DATA finger curls. 100% in-browser.
   ========================================================= */

var detectVideo = null;
var detectCanvas = null;
var detectCtx = null;
var detectHands = null;
var detectCameraActive = false;
var detectStream = null;
var detectRafId = null;
var detectThreshold = 60; // percent
var detectMirror = true;
var detectShowLandmarks = true;
var detectAutoSpeak = false;
var detectHistory = [];
var detectLastSign = null;
var detectLastTime = 0;
var detectStableCount = 0;
var detectStableSign = null;
var detectTemplates = null; // cached {key: vector5}
var detectMode = 'all'; // all | letters | words

// Tuning
var STABLE_FRAMES = 8; // need 8 consistent frames to confirm
var COOLDOWN_MS = 1200;

/* =========================================================
   INIT
   ========================================================= */
function initSignDetect(){
  detectVideo = document.getElementById('detect-video');
  detectCanvas = document.getElementById('detect-canvas');
  if(detectCanvas) detectCtx = detectCanvas.getContext('2d');
  // controls
  var thresh = document.getElementById('detect-thresh');
  if(thresh) thresh.value = detectThreshold;
  var modeSel = document.getElementById('detect-mode');
  if(modeSel) modeSel.value = detectMode;
  var mirrorChk = document.getElementById('detect-mirror');
  if(mirrorChk) mirrorChk.checked = detectMirror;
  var lmChk = document.getElementById('detect-landmarks');
  if(lmChk) lmChk.checked = detectShowLandmarks;
  var autoChk = document.getElementById('detect-autospeak');
  if(autoChk) autoChk.checked = detectAutoSpeak;

  buildDetectTemplates();
  updateDetectStatus('Idle — press Start to enable camera','info');
  // Ensure canvas size matches video container on resize
  window.addEventListener('resize', resizeDetectCanvas);
  setTimeout(resizeDetectCanvas, 500);
}

function buildDetectTemplates(){
  if(!window.SIGN_DATA) return;
  detectTemplates = {};
  var all = {};
  Object.entries(SIGN_DATA.alphabet).forEach(function(e){ all[e[0]] = e[1]; });
  Object.entries(SIGN_DATA.words).forEach(function(e){ all[e[0]] = e[1]; });
  Object.keys(all).forEach(function(key){
    var data = all[key];
    var f = data.fingers;
    if(!f) return;
    // finger curl 0..1 (0 extended, 1 folded) avg of joints /90
    function curlVals(obj){
      if(!obj) return 0.5;
      var vals = [];
      if(typeof obj.cx !== 'undefined') vals.push(obj.cx);
      if(typeof obj.mx !== 'undefined') vals.push(obj.mx);
      if(typeof obj.px !== 'undefined') vals.push(obj.px);
      if(typeof obj.dx !== 'undefined') vals.push(obj.dx);
      if(typeof obj.ix !== 'undefined') vals.push(obj.ix);
      if(!vals.length) return 0.5;
      var avg = vals.reduce(function(s,v){return s+v;},0)/vals.length;
      return Math.max(0, Math.min(1, avg/90));
    }
    var thumb = curlVals(f.thumb);
    var index = curlVals(f.index);
    var middle = curlVals(f.middle);
    var ring = curlVals(f.ring);
    var pinky = curlVals(f.pinky);
    // encode spread? For thumb opposition, use thumb Cx already; for finger spread we approximate via category? keep simple 5D
    detectTemplates[key] = [thumb, index, middle, ring, pinky, data.category || ''];
  });
}

/* =========================================================
   MediaPipe Hands Loader (lazy)
   ========================================================= */
function loadMediaPipeHands(){
  return new Promise(function(resolve, reject){
    if(window.Hands){
      resolve(); return;
    }
    // Load hands.js
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js';
    s.onload = function(){
      // also try drawing_utils for overlay (optional)
      var s2 = document.createElement('script');
      s2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1620248257/drawing_utils.js';
      s2.onload = function(){ resolve(); };
      s2.onerror = function(){ resolve(); }; // not critical
      document.head.appendChild(s2);
    };
    s.onerror = function(){ reject(new Error('Failed to load MediaPipe Hands')); };
    document.head.appendChild(s);
  });
}

function resizeDetectCanvas(){
  if(!detectCanvas || !detectVideo) return;
  var wrap = detectCanvas.parentElement;
  if(!wrap) return;
  var w = wrap.clientWidth;
  var h = Math.round(w * 0.75);
  // keep video aspect
  detectCanvas.width = w;
  detectCanvas.height = h;
  if(detectVideo){
    detectVideo.style.width = w+'px';
    detectVideo.style.height = h+'px';
  }
}

/* =========================================================
   Camera Control
   ========================================================= */
async function toggleDetect(){
  if(detectCameraActive) { stopDetect(); } else { startDetect(); }
}

async function startDetect(){
  var btn = document.getElementById('detect-start');
  if(btn){ btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Starting...'; btn.disabled=true; }
  updateDetectStatus('Requesting camera permission...','info');
  try {
    // Load Hands first (may need internet)
    try { await loadMediaPipeHands(); } catch(e){ console.warn('MediaPipe load failed, will use demo mode', e); }

    var stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: {ideal:640}, height:{ideal:480} }, audio:false });
    detectStream = stream;
    detectVideo.srcObject = stream;
    await detectVideo.play();
    detectCameraActive = true;
    resizeDetectCanvas();
    document.getElementById('detect-overlay').style.display='none';
    updateDetectStatus('Camera active — initializing hand tracking...','info');
    if(btn){ btn.innerHTML='<i class="fa-solid fa-stop"></i> Stop Camera'; btn.disabled=false; btn.classList.remove('primary'); btn.classList.add('danger'); }

    // Init Hands if available
    if(window.Hands){
      await initHands();
      startDetectLoop();
      updateDetectStatus('Hand tracking active — show a sign, palm forward, good lighting','success');
      showToast('Camera + hand tracking started','success');
    } else {
      // Demo fallback: simulate detections
      startDemoLoop();
      updateDetectStatus('Camera active — demo mode (MediaPipe unavailable, simulating). Hold signs for simulation.','info');
      showToast('Camera started (demo mode)','info');
    }

  } catch(err){
    console.error('startDetect error', err);
    updateDetectStatus('Camera error: ' + (err.message||err) + ' — check permission & use HTTPS','error');
    showToast('Camera failed: '+ (err.message||'permission'), 'error');
    if(btn){ btn.innerHTML='<i class="fa-solid fa-play"></i> Start Camera'; btn.disabled=false; }
    detectCameraActive=false;
  }
}

function stopDetect(){
  detectCameraActive=false;
  if(detectRafId){ cancelAnimationFrame(detectRafId); detectRafId=null; }
  if(detectStream){
    detectStream.getTracks().forEach(function(t){ t.stop(); });
    detectStream=null;
  }
  if(detectVideo){ detectVideo.srcObject=null; }
  if(detectHands){
    try { detectHands.close(); } catch(e){}
    detectHands=null;
  }
  var btn=document.getElementById('detect-start');
  if(btn){ btn.innerHTML='<i class="fa-solid fa-play"></i> Start Camera'; btn.disabled=false; btn.classList.remove('danger'); btn.classList.add('primary'); }
  var overlay=document.getElementById('detect-overlay');
  if(overlay) overlay.style.display='flex';
  updateDetectStatus('Stopped — press Start to resume','info');
  clearDetectCanvas();
}

async function initHands(){
  if(!window.Hands) throw new Error('Hands not loaded');
  detectHands = new Hands({
    locateFile: function(file){ return 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/' + file; }
  });
  detectHands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.6
  });
  detectHands.onResults(onHandsResults);
}

function startDetectLoop(){
  var lastSend = 0;
  async function loop(ts){
    if(!detectCameraActive) return;
    // throttle to ~15 fps to save CPU
    if(ts - lastSend > 66){
      lastSend = ts;
      if(detectVideo && detectVideo.readyState >= 2 && detectHands){
        try { await detectHands.send({image: detectVideo}); } catch(e){}
      }
    }
    detectRafId = requestAnimationFrame(loop);
  }
  detectRafId = requestAnimationFrame(loop);
}

function startDemoLoop(){
  // Simulate a detection every 1.8s cycling through meaningful signs
  var demoKeys = ['A','B','C','L','V','W','O','I','Y','hello','thank','yes','no','help','love'];
  var idx=0;
  function demoTick(){
    if(!detectCameraActive) return;
    var key = demoKeys[idx % demoKeys.length];
    idx++;
    // fabricate a vector: use template + small noise
    var fakeLandmarks = null; // not needed, we directly mock result
    var mockResult = generateMockPrediction(key);
    handlePrediction(mockResult.best, mockResult.alts, null);
    // draw fake placeholder on canvas
    if(detectCtx && detectCanvas){
      clearDetectCanvas();
      detectCtx.save();
      detectCtx.fillStyle='rgba(99,102,241,0.08)';
      detectCtx.fillRect(0,0,detectCanvas.width,detectCanvas.height);
      detectCtx.fillStyle='rgba(99,102,241,0.9)';
      detectCtx.font='16px Plus Jakarta Sans';
      detectCtx.textAlign='center';
      detectCtx.fillText('Demo: simulating "'+key+'" — MediaPipe unavailable', detectCanvas.width/2, 24);
      detectCtx.restore();
    }
    setTimeout(demoTick, 1800);
  }
  demoTick();
}

function generateMockPrediction(key){
  var data = (window.SIGN_DATA && (SIGN_DATA.alphabet[key] || SIGN_DATA.words[key])) || {desc:'Simulated', category:'Demo'};
  var alts = [];
  var pool = Object.keys(detectTemplates || {});
  // pick 2 random alternates distinct
  for(var i=0;i<2;i++){
    var rk = pool[Math.floor(Math.random()*pool.length)];
    if(rk===key) continue;
    var d = SIGN_DATA.alphabet[rk] || SIGN_DATA.words[rk];
    alts.push({key:rk, confidence: 30+Math.random()*15, desc:(d&&d.desc)||'', category:(d&&d.category)||''});
  }
  return { best:{key:key, confidence:82+Math.random()*12, desc:data.desc, category:data.category}, alts: alts };
}

/* =========================================================
   Hands Results -> Landmarks + Classification
   ========================================================= */
function onHandsResults(results){
  if(!detectCanvas || !detectCtx) return;
  clearDetectCanvas();
  // Mirror handling is done via canvas transform, not landmark transform
  // Draw video frame? We have video element underneath, canvas is overlay transparent
  // So we only draw landmarks
  var hasHand = results.multiHandLandmarks && results.multiHandLandmarks.length>0;
  if(!hasHand){
    // No hand
    updateDetectStatus('No hand detected — center your hand, palm forward','info');
    // decay stable
    detectStableCount = Math.max(0, detectStableCount-1);
    if(detectStableCount===0) detectStableSign=null;
    return;
  }
  var landmarks = results.multiHandLandmarks[0];
  // Draw
  if(detectShowLandmarks){
    drawLandmarks(landmarks);
  }
  // Classify
  var detection = classifySign(landmarks);
  if(detection){
    handlePrediction(detection.best, detection.alternatives, landmarks);
  } else {
    updateDetectStatus('Hand detected but no confident match — try clearer pose','info');
  }
}

function clearDetectCanvas(){
  if(!detectCtx || !detectCanvas) return;
  detectCtx.clearRect(0,0,detectCanvas.width,detectCanvas.height);
  // optional mirror transform? We handle via CSS, but for drawing we need to mirror x
  // MediaPipe landmarks are not mirrored; if video is mirrored via CSS, landmarks x should be mirrored for overlay alignment
  // We will apply mirror in drawLandmarks
}

function drawLandmarks(landmarks){
  if(!detectCtx) return;
  var w = detectCanvas.width, h = detectCanvas.height;
  detectCtx.save();
  // If mirror enabled, flip horizontal for overlay to match video CSS mirror
  if(detectMirror){
    detectCtx.translate(w,0);
    detectCtx.scale(-1,1);
  }
  // Draw connections if HAND_CONNECTIONS available
  if(window.HAND_CONNECTIONS && window.drawConnectors){
    drawConnectors(detectCtx, landmarks, HAND_CONNECTIONS, {color:'#6366f1', lineWidth:2});
  } else {
    // simple lines fallback: connect finger chains manually
    var conns = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]];
    detectCtx.strokeStyle='#6366f1'; detectCtx.lineWidth=2; detectCtx.beginPath();
    conns.forEach(function(c){
      var a=landmarks[c[0]], b=landmarks[c[1]];
      detectCtx.moveTo(a.x*w, a.y*h);
      detectCtx.lineTo(b.x*w, b.y*h);
    });
    detectCtx.stroke();
  }
  // Draw points
  if(window.drawLandmarks){
    drawLandmarks(detectCtx, landmarks, {color:'#06b6d4', lineWidth:1, radius: detectCanvas.width<400?3:4});
  } else {
    landmarks.forEach(function(pt){
      detectCtx.beginPath();
      detectCtx.arc(pt.x*w, pt.y*h, 4, 0, Math.PI*2);
      detectCtx.fillStyle='#06b6d4';
      detectCtx.fill();
      detectCtx.strokeStyle='white';
      detectCtx.lineWidth=1;
      detectCtx.stroke();
    });
  }
  detectCtx.restore();
}

/* =========================================================
   Classification — vector distance to templates
   ========================================================= */
function fingerCurlAngle(landmarks, idx){
  // idx: finger 0 thumb,1 index,2 middle,3 ring,4 pinky
  var ids = [
    [1,2,3,4], // thumb: cmc, mcp, ip, tip (1,2,3,4) — note 0 is wrist
    [5,6,7,8], // index
    [9,10,11,12],
    [13,14,15,16],
    [17,18,19,20]
  ];
  var chain = ids[idx];
  // compute two angles: at pip and dip
  var a = angleBetween(landmarks[chain[0]], landmarks[chain[1]], landmarks[chain[2]]);
  var b = angleBetween(landmarks[chain[1]], landmarks[chain[2]], landmarks[chain[3]]);
  // thumb has only 2 angles but similar
  var avg = (a+b)/2;
  // Convert to curl 0..1: 180 deg => 0 (extended), 0 deg =>1 (folded)
  // clamp
  var curl = 1 - (avg / 180);
  // sharpen: extended if avg>150 => ~0.16, half ~0.5, folded ~0.85
  return Math.max(0, Math.min(1, curl));
}
function angleBetween(a,b,c){
  // angle at b between a-b and c-b
  var ba = {x:a.x-b.x, y:a.y-b.y, z:a.z-b.z};
  var bc = {x:c.x-b.x, y:c.y-b.y, z:c.z-b.z};
  var dot = ba.x*bc.x + ba.y*bc.y + ba.z*bc.z;
  var magBa = Math.sqrt(ba.x*ba.x + ba.y*ba.y + ba.z*ba.z);
  var magBc = Math.sqrt(bc.x*bc.x + bc.y*bc.y + bc.z*bc.z);
  if(magBa===0 || magBc===0) return 180;
  var cos = dot/(magBa*magBc);
  cos = Math.max(-1, Math.min(1, cos));
  return Math.acos(cos)*180/Math.PI;
}

function estimateCurls(landmarks){
  var curls=[];
  for(var i=0;i<5;i++){
    curls.push(fingerCurlAngle(landmarks,i));
  }
  return curls; // thumb,index,middle,ring,pinky
}

function classifySign(landmarks){
  if(!detectTemplates) buildDetectTemplates();
  var poolKeys = Object.keys(detectTemplates);
  if(!poolKeys.length) return null;
  // filter by mode
  var filterKeys = poolKeys;
  if(detectMode==='letters'){
    filterKeys = poolKeys.filter(function(k){ return k.length===1 && k>='A' && k<='Z'; });
  } else if(detectMode==='words'){
    filterKeys = poolKeys.filter(function(k){ return k.length>1; });
  }
  if(!filterKeys.length) filterKeys = poolKeys;

  var detected = estimateCurls(landmarks);
  // Add thumb-index distance as extra feature for letters like A vs S vs T (thumb position)
  // Compute normalized distance thumb tip (4) to index mcp (5) vs thumb tip to pinky mcp (17)
  var thumbTip = landmarks[4], idxMcp = landmarks[5], pinkyMcp = landmarks[17];
  var dThumbIdx = Math.hypot(thumbTip.x-idxMcp.x, thumbTip.y-idxMcp.y, thumbTip.z-idxMcp.z);
  var dThumbPinky = Math.hypot(thumbTip.x-pinkyMcp.x, thumbTip.y-pinkyMcp.y, thumbTip.z-pinkyMcp.z);
  var thumbPos = dThumbIdx / (dThumbPinky||1); // ratio <1 thumb near index, >1 near pinky

  var scored=[];
  filterKeys.forEach(function(key){
    var tmpl = detectTemplates[key]; // [thumb,idx,mid,ring,pinky, category]
    var tmplVec = tmpl.slice(0,5);
    // distance
    var sum=0;
    for(var i=0;i<5;i++){
      var diff = detected[i] - tmplVec[i];
      // weight thumb less? thumb is noisy, weight 0.8
      var w = i===0?0.9:1;
      sum += w*diff*diff;
    }
    // add thumbPos penalty for certain signs where thumb across vs side matters
    // For template, we don't have thumbPos, but we can approximate: thumb curl 0.5 => thumb half = across, thumb 0 => thumb side
    // We'll compare thumbPos to expected: if template thumb <0.3 (extended side) expect thumbPos ~1.2, if thumb ~0.5 expect ~0.6
    // Simplified: expectedThumbPos = tmplVec[0] <0.3 ? 1.2 : tmplVec[0] >0.7 ? 0.5 : 0.8
    var expPos = tmplVec[0] <0.3 ? 1.2 : tmplVec[0] >0.7 ? 0.5 : 0.8;
    var posDiff = thumbPos - expPos;
    sum += 0.3*posDiff*posDiff;

    var dist = Math.sqrt(sum);
    var maxDist = Math.sqrt(5.3); // 5 + 0.3
    var conf = Math.max(0, 1 - dist / maxDist) * 100;
    // small bonus for palm orientation? ignore
    scored.push({key:key, dist:dist, confidence:conf, tmpl:tmpl});
  });
  scored.sort(function(a,b){ return a.dist - b.dist; });
  var best = scored[0];
  if(!best) return null;
  // Need confidence > threshold
  if(best.confidence < detectThreshold) return null;
  // Build alternatives top 3
  var alts = scored.slice(1,4).map(function(s){
    var d = window.SIGN_DATA && (SIGN_DATA.alphabet[s.key] || SIGN_DATA.words[s.key]);
    return {key:s.key, confidence: Math.round(s.confidence), desc: d?d.desc:'', category: d?d.category:''};
  });
  var dBest = window.SIGN_DATA && (SIGN_DATA.alphabet[best.key] || SIGN_DATA.words[best.key]);
  return {
    best: {key: best.key, confidence: Math.round(best.confidence), desc: dBest?dBest.desc:'', category: dBest?dBest.category:'', dist: best.dist},
    alternatives: alts,
    detectedVec: detected,
    thumbPos: thumbPos
  };
}

/* =========================================================
   Handle Prediction (stability + UI)
   ========================================================= */
function handlePrediction(best, alts, landmarks){
  var now = Date.now();
  // Stability: require same sign for STABLE_FRAMES consecutive
  if(detectStableSign === best.key && (now - detectLastTime) < 2000){
    detectStableCount++;
  } else {
    detectStableSign = best.key;
    detectStableCount = 1;
  }
  detectLastTime = now;

  // Only update UI if stable or high confidence >80 immediate
  var isStable = detectStableCount >= STABLE_FRAMES || best.confidence >= 85;
  if(!isStable){
    // Show interim low-confidence preview? Update status but not history
    updateDetectStatus('Seeing: ' + best.key + ' ('+best.confidence+'%) — hold steady...','info');
    // still show preview card as tentative
    renderDetectResult(best, alts, false);
    return;
  }

  // Cooldown to avoid spamming same sign repeatedly
  if(detectLastSign === best.key && (now - (detectLastSignTime||0)) < COOLDOWN_MS){
    return;
  }
  detectLastSign = best.key;
  detectLastSignTime = now;
  detectStableCount = 0; // reset after commit

  // Commit
  renderDetectResult(best, alts, true);
  addDetectHistory(best);
  updateDetectStatus('Detected: ' + best.key + ' — ' + best.desc + ' ('+best.confidence+'%)','success');
  // Avatar
  try { if(window.setSign) window.setSign(best.key); else if(window.SIGN_DATA) console.log('Would setSign', best.key); } catch(e){}
  // TTS
  if(detectAutoSpeak){
    try { if(typeof speakWord==='function') speakWord(best.key + ' means ' + best.desc); else if(window.speechSynthesis){
      var u = new SpeechSynthesisUtterance(best.key + ' means ' + best.desc);
      window.speechSynthesis.speak(u);
    } } catch(e){}
  }
  // Update dashboard pdf? not needed

  // Also flash video wrap
  var wrap = document.querySelector('.detect-video-wrap');
  if(wrap){ wrap.classList.add('flash'); setTimeout(function(){ wrap.classList.remove('flash'); }, 500); }
}

function renderDetectResult(best, alts, isConfirmed){
  var card = document.getElementById('detect-result-card');
  if(!card) return;
  card.classList.remove('empty');
  var confColor = best.confidence >= 75 ? 'var(--success)' : best.confidence >= 60 ? '#d97706' : 'var(--danger)';
  var confWidth = best.confidence + '%';
  var isWord = best.key.length>1;
  card.innerHTML =
    '<div class="detect-result-header">'+
      '<span class="detect-result-badge '+(isConfirmed?'confirmed':'tentative')+'">'+(isConfirmed?'<i class="fa-solid fa-check"></i> Detected':'<i class="fa-solid fa-eye"></i> Seeing')+'</span>'+
      '<span class="detect-result-confidence" style="color:'+confColor+'">'+best.confidence+'% confidence</span>'+
    '</div>'+
    '<div class="detect-result-main">'+
      '<div class="detect-result-sign">'+escapeHtml(best.key)+'</div>'+
      '<div class="detect-result-desc">'+escapeHtml(best.desc||'No description')+'</div>'+
      '<div class="detect-result-category"><i class="fa-solid fa-tag"></i> '+escapeHtml(best.category||'Sign')+' • '+(isWord?'Word':'Letter')+'</div>'+
    '</div>'+
    '<div class="detect-confidence-bar"><div class="detect-confidence-fill" style="width:'+confWidth+'; background:'+confColor+'"></div></div>'+
    '<div class="detect-result-actions">'+
      '<button class="speech-btn primary" onclick="speakDetectResult()"><i class="fa-solid fa-volume-high"></i> Speak</button>'+
      '<button class="speech-btn secondary" onclick="showDetectInLearn()"><i class="fa-solid fa-hand"></i> Show in Lab</button>'+
      '<button class="speech-btn secondary" onclick="copyDetectResult()"><i class="fa-solid fa-copy"></i> Copy</button>'+
    '</div>';
  // Save current best for actions
  card.dataset.key = best.key;
  card.dataset.desc = best.desc;
  card.dataset.category = best.category;

  // Alternatives
  var altEl = document.getElementById('detect-alternatives');
  if(altEl){
    if(alts && alts.length){
      altEl.innerHTML = '<div class="detect-alts-title">Also considered:</div><div class="detect-alts-list">' +
        alts.map(function(a){
          return '<button class="detect-alt" onclick="selectAlternative(\''+escapeHtml(a.key)+'\')"><span class="detect-alt-key">'+escapeHtml(a.key)+'</span><span class="detect-alt-conf">'+a.confidence+'%</span><span class="detect-alt-desc">'+escapeHtml(a.desc.slice(0,36))+(a.desc.length>36?'...':'')+'</span></button>';
        }).join('') + '</div>';
      altEl.style.display='block';
    } else {
      altEl.style.display='none';
    }
  }
}

function selectAlternative(key){
  var data = window.SIGN_DATA && (SIGN_DATA.alphabet[key] || SIGN_DATA.words[key]);
  if(!data) return;
  var mockBest = {key:key, confidence: 55, desc:data.desc, category:data.category};
  renderDetectResult(mockBest, [], true);
  try { if(window.setSign) window.setSign(key); } catch(e){}
  updateDetectStatus('Selected alternative: '+key+' — '+data.desc,'info');
}

function speakDetectResult(){
  var card = document.getElementById('detect-result-card');
  if(!card || !card.dataset.key) return;
  var text = card.dataset.key + ' means ' + card.dataset.desc;
  try {
    if(typeof speakWord==='function') speakWord(text);
    else {
      var u = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(u);
    }
    showToast('Speaking: '+card.dataset.key,'info');
  } catch(e){ showToast('TTS not available','error'); }
}
function copyDetectResult(){
  var card = document.getElementById('detect-result-card');
  if(!card || !card.dataset.key) return;
  var text = card.dataset.key + ' — ' + card.dataset.desc + ' ('+card.dataset.category+')';
  navigator.clipboard.writeText(text).then(function(){ showToast('Copied: '+card.dataset.key,'success'); }).catch(function(){ showToast('Copy failed','error'); });
}
function showDetectInLearn(){
  var card = document.getElementById('detect-result-card');
  if(!card || !card.dataset.key) return;
  var key = card.dataset.key;
  // Switch to learn section and show sign
  if(typeof showSection==='function') showSection('learn');
  setTimeout(function(){
    try { if(window.setSign) window.setSign(key); } catch(e){}
    // update learn UI if exists
    var catEl=document.getElementById('sign-category'), nameEl=document.getElementById('sign-name'), dispEl=document.getElementById('sign-display'), descEl=document.getElementById('sign-desc');
    var data = window.SIGN_DATA && (SIGN_DATA.alphabet[key] || SIGN_DATA.words[key]);
    if(data && catEl) catEl.textContent=data.category;
    if(nameEl) nameEl.textContent=key;
    if(dispEl) dispEl.textContent=key;
    if(descEl) descEl.textContent=data?data.desc:'';
  }, 300);
}

/* =========================================================
   History
   ========================================================= */
function addDetectHistory(best){
  detectHistory.unshift({key:best.key, desc:best.desc, category:best.category, confidence:best.confidence, time: new Date().toLocaleTimeString()});
  if(detectHistory.length>12) detectHistory.pop();
  renderDetectHistory();
}
function renderDetectHistory(){
  var el = document.getElementById('detect-history-list');
  if(!el) return;
  if(!detectHistory.length){ el.innerHTML='<p class="pdf-empty" style="padding:10px;">No detections yet.</p>'; return; }
  el.innerHTML = detectHistory.map(function(h){
    return '<div class="detect-history-item" onclick="selectAlternative(\''+escapeHtml(h.key)+'\')" title="Click to view">' +
      '<span class="detect-history-key">'+escapeHtml(h.key)+'</span>' +
      '<span class="detect-history-desc">'+escapeHtml(h.desc.slice(0,32))+(h.desc.length>32?'...':'')+'</span>' +
      '<span class="detect-history-conf">'+h.confidence+'%</span>' +
      '<span class="detect-history-time">'+h.time+'</span></div>';
  }).join('');
}
function clearDetectHistory(){
  detectHistory=[];
  renderDetectHistory();
  showToast('History cleared','info');
}

/* =========================================================
   Controls Helpers
   ========================================================= */
function updateDetectStatus(msg, type){
  var el=document.getElementById('detect-status');
  if(!el) return;
  el.textContent=msg;
  el.className='detect-status '+(type||'info');
}
function updateDetectThreshold(val){
  detectThreshold=parseInt(val,10)||60;
  var el=document.getElementById('detect-thresh-val');
  if(el) el.textContent=detectThreshold+'%';
}
function toggleMirror(){
  var chk=document.getElementById('detect-mirror');
  detectMirror = chk? chk.checked : !detectMirror;
  var video=document.getElementById('detect-video');
  if(video) video.style.transform = detectMirror? 'scaleX(-1)':'none';
  var canvas=document.getElementById('detect-canvas');
  // canvas mirroring handled in drawLandmarks via ctx transform, keep in sync
}
function toggleLandmarks(){
  var chk=document.getElementById('detect-landmarks');
  detectShowLandmarks = chk? chk.checked : true;
}
function toggleAutoSpeak(){
  var chk=document.getElementById('detect-autospeak');
  detectAutoSpeak = chk? chk.checked : false;
  if(detectAutoSpeak) showToast('Auto-speak enabled','info');
}
function changeDetectMode(val){
  detectMode = val||'all';
  showToast('Detect mode: '+detectMode,'info');
}
function captureDetect(){
  if(!detectCanvas || !detectVideo) return;
  // Create snapshot: draw video + canvas overlay onto temp canvas
  var tmp=document.createElement('canvas');
  tmp.width=detectCanvas.width;
  tmp.height=detectCanvas.height;
  var tctx=tmp.getContext('2d');
  // draw video frame (mirrored if needed)
  tctx.save();
  if(detectMirror){ tctx.translate(tmp.width,0); tctx.scale(-1,1); }
  tctx.drawImage(detectVideo,0,0,tmp.width,tmp.height);
  tctx.restore();
  // draw overlay
  tctx.drawImage(detectCanvas,0,0);
  // download
  var url=tmp.toDataURL('image/png');
  var a=document.createElement('a');
  a.href=url; a.download='EduAccess-detect-'+(detectLastSign||'snapshot')+'.png';
  a.click();
  showToast('Snapshot saved','success');
}

/* Expose */
window.initSignDetect = initSignDetect;
window.toggleDetect = toggleDetect;
window.startDetect = startDetect;
window.stopDetect = stopDetect;
window.updateDetectThreshold = updateDetectThreshold;
window.toggleMirror = toggleMirror;
window.toggleLandmarks = toggleLandmarks;
window.toggleAutoSpeak = toggleAutoSpeak;
window.changeDetectMode = changeDetectMode;
window.captureDetect = captureDetect;
window.clearDetectHistory = clearDetectHistory;
window.speakDetectResult = speakDetectResult;
window.copyDetectResult = copyDetectResult;
window.showDetectInLearn = showDetectInLearn;
window.selectAlternative = selectAlternative;

// Fallback escapeHtml if not loaded
if(typeof escapeHtml==='undefined'){
  window.escapeHtml = function(s){ if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); };
}
