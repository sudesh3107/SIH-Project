/* =========================================================
   EduAccess - Live Sign Detect v2 (Improved Accuracy)
   MediaPipe Hands + multi-feature template matching + user
   calibration + high-accuracy mode. 100% in-browser.

   Features: 5 curls + thumbPos + 4 thumb-fingertip dists +
             3 spread distances + palm orientation -> 12D vector
   Templates: Manual accurate ASL templates (A-Z) + auto
              fallback from SIGN_DATA + personalized KNN
   ========================================================= */

var detectVideo = null;
var detectCanvas = null;
var detectCtx = null;
var detectHands = null;
var detectCameraActive = false;
var detectStream = null;
var detectRafId = null;
var detectThreshold = 65; // percent, stricter to reduce hello/o bias
var detectMirror = true;
var detectShowLandmarks = true;
var detectAutoSpeak = false;
var detectHistory = [];
var detectLastSign = null;
var detectLastSignTime = 0;
var detectStableCount = 0;
var detectStableSign = null;
var detectTemplates = null; // 12D manual templates
var detectMode = 'letters'; // default to letters only to avoid hello/o bias (was 'all')
var detectHighAccuracy = false;
var detectSmoothingQueue = []; // last N predictions for majority vote
var SMOOTH_N = 5;
var STABLE_FRAMES = 6;
var COOLDOWN_MS = 1400;

// Calibration
var CALIB_KEY = 'eduaccess_detect_calib_v2';
var calibData = {}; // { "A": [vec12, vec12], ... }
var calibEnabled = true;

/* =========================================================
   MANUAL ACCURATE TEMPLATES (12D)
   Each entry: [thumbCurl, idxCurl, midCurl, ringCurl, pinkyCurl,
                thumbPos, t-idxDist, t-midDist, avgSpread, pinkyExtensionBias]
   Values 0..1. Derived from ASL descriptions + tuned for real hand.
   For spread: 0=together, 1=spread. For thumbPos: 0=thumb near pinky, 1=near index.
   Dist: thumb tip to fingertip distance normalized 0..1 (0 close, 1 far)
   ========================================================= */
var MANUAL_TEMPLATES_12D = {
  // Letters - distinct first
  'A': [0.45, 1.00, 1.00, 1.00, 1.00, 0.55, 0.35, 0.55, 0.05, 0.00, 0.00, 0.00],
  'B': [0.75, 0.05, 0.05, 0.05, 0.05, 1.10, 1.00, 1.00, 0.05, 0.00, 0.00, 0.00],
  'C': [0.42, 0.35, 0.35, 0.35, 0.35, 0.70, 0.78, 0.88, 0.45, 0.00, 0.00, 0.00],
  'D': [0.55, 0.05, 1.00, 1.00, 1.00, 0.50, 0.35, 0.45, 0.05, 0.00, 0.00, 0.00],
  'E': [0.55, 1.00, 1.00, 1.00, 1.00, 0.45, 0.25, 0.30, 0.05, 0.00, 0.00, 0.00],
  'F': [0.35, 0.40, 0.05, 0.05, 0.05, 0.45, 0.20, 0.85, 0.05, 0.00, 0.00, 0.00],
  'G': [0.10, 0.05, 1.00, 1.00, 1.00, 0.30, 0.90, 1.00, 0.05, 0.00, 0.00, 0.00],
  'H': [0.45, 0.05, 0.05, 1.00, 1.00, 0.60, 0.90, 0.90, 0.10, 0.15, 0.00, 0.00],
  'I': [0.55, 1.00, 1.00, 1.00, 0.05, 0.60, 1.00, 1.00, 0.05, 0.00, 0.00, 0.95],
  'J': [0.55, 1.00, 1.00, 1.00, 0.05, 0.60, 1.00, 1.00, 0.05, 0.00, 0.00, 0.95], // static like I
  'K': [0.50, 0.05, 0.05, 1.00, 1.00, 0.55, 0.85, 0.90, 0.45, 0.00, 0.00, 0.00],
  'L': [0.10, 0.05, 1.00, 1.00, 1.00, 0.25, 0.90, 1.00, 0.05, 0.00, 0.00, 0.00],
  'M': [0.85, 1.00, 1.00, 1.00, 0.70, 0.35, 0.25, 0.30, 0.05, 0.00, 0.00, 0.00],
  'N': [0.80, 1.00, 1.00, 1.00, 0.80, 0.40, 0.30, 0.35, 0.05, 0.00, 0.00, 0.00],
  'O': [0.38, 0.62, 0.62, 0.62, 0.62, 0.50, 0.28, 0.32, 0.35, 0.15, 0.12, 0.00],
  'P': [0.50, 1.00, 0.05, 1.00, 1.00, 0.55, 0.40, 0.90, 0.05, 0.00, 0.00, 0.00], // like K but middle
  'Q': [0.50, 0.05, 1.00, 1.00, 1.00, 0.50, 0.85, 1.00, 0.05, 0.00, 0.00, 0.00], // like G but lower
  'R': [0.50, 0.05, 0.05, 1.00, 1.00, 0.60, 0.85, 0.90, 0.85, 0.00, 0.00, 0.00], // index+middle crossed
  'S': [0.45, 1.00, 1.00, 1.00, 1.00, 0.45, 0.30, 0.45, 0.05, 0.00, 0.00, 0.00],
  'T': [0.80, 1.00, 1.00, 1.00, 1.00, 0.42, 0.22, 0.35, 0.05, 0.00, 0.00, 0.00],
  'U': [0.45, 0.05, 0.05, 1.00, 1.00, 0.60, 0.90, 0.85, 0.05, 0.00, 0.00, 0.00],
  'V': [0.45, 0.05, 0.05, 1.00, 1.00, 0.65, 0.95, 0.95, 0.75, 0.00, 0.00, 0.00],
  'W': [0.45, 0.05, 0.05, 0.05, 1.00, 0.65, 0.95, 0.95, 0.70, 0.60, 0.00, 0.00],
  'X': [0.45, 0.55, 1.00, 1.00, 1.00, 0.60, 0.60, 0.85, 0.05, 0.00, 0.00, 0.00],
  'Y': [0.10, 1.00, 1.00, 1.00, 0.05, 0.20, 1.00, 1.00, 0.05, 0.00, 0.00, 0.90],
  'Z': [0.45, 0.05, 0.05, 1.00, 1.00, 0.60, 0.90, 0.90, 0.05, 0.00, 0.00, 0.00], // like V/U, motion is clue
  // High-accuracy distinct subset bonus weighting
};

// Distinct set for high-accuracy mode — letters only (words removed to avoid hello/o bias)
var HIGH_ACC_SET = ['A','B','C','D','F','I','L','O','V','W','Y','G','H','R','U'];

/* =========================================================
   INIT
   ========================================================= */
function initSignDetect(){
  detectVideo = document.getElementById('detect-video');
  detectCanvas = document.getElementById('detect-canvas');
  if(detectCanvas) detectCtx = detectCanvas.getContext('2d');
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
  var highChk = document.getElementById('detect-highacc');
  if(highChk) highChk.checked = detectHighAccuracy;

  loadCalibData();
  buildDetectTemplates();
  updateDetectStatus('Idle — press Start to enable camera','info');
  window.addEventListener('resize', resizeDetectCanvas);
  setTimeout(resizeDetectCanvas, 500);
  renderCalibList();
}

function buildDetectTemplates(){
  if(!window.SIGN_DATA) return;
  detectTemplates = {};
  // Start with manual accurate templates for letters
  Object.keys(MANUAL_TEMPLATES_12D).forEach(function(k){
    var vec12 = MANUAL_TEMPLATES_12D[k].slice();
    // Append category placeholder as 13th? Keep 12D
    var data = SIGN_DATA.alphabet[k] || SIGN_DATA.words[k];
    detectTemplates[k] = vec12.concat([data? data.category : '']);
  });
  // Fill remaining from SIGN_DATA auto (for words and missing letters) but convert to 12D
  var all = {};
  Object.entries(SIGN_DATA.alphabet).forEach(function(e){ if(!detectTemplates[e[0]]) all[e[0]] = e[1]; });
  Object.entries(SIGN_DATA.words).forEach(function(e){ if(!detectTemplates[e[0]]) all[e[0]] = e[1]; });
  Object.keys(all).forEach(function(key){
    var data = all[key];
    var f = data.fingers;
    if(!f) return;
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
    // Estimate remaining 7 features as neutral defaults
    var vec12 = [thumb,index,middle,ring,pinky, 0.65, 0.50,0.50,0.20, 0.00,0.00,0.00];
    detectTemplates[key] = vec12.concat([data.category||'']);
  });
  // Also ensure calibData templates are considered via KNN later, not here
}

/* =========================================================
   Calibration Storage
   ========================================================= */
function loadCalibData(){
  try{ calibData = JSON.parse(localStorage.getItem(CALIB_KEY)||'{}'); }catch(e){ calibData={}; }
}
function saveCalibData(){
  try{ localStorage.setItem(CALIB_KEY, JSON.stringify(calibData)); }catch(e){}
}
function addCalibSample(key, vec12){
  if(!calibData[key]) calibData[key]=[];
  calibData[key].push(vec12);
  // keep max 5 per sign
  if(calibData[key].length>5) calibData[key].shift();
  saveCalibData();
  renderCalibList();
}
function clearCalibForKey(key){
  if(key){ delete calibData[key]; } else { calibData={}; }
  saveCalibData(); renderCalibList();
  showToast(key?('Calibration cleared for '+key):'All calibrations cleared','info');
}
function renderCalibList(){
  var el=document.getElementById('detect-calib-list');
  if(!el) return;
  var keys=Object.keys(calibData);
  if(!keys.length){ el.innerHTML='<p class="pdf-empty" style="padding:8px;">No personal calibration yet. Capture samples to boost accuracy for your hand.</p>'; return; }
  el.innerHTML = keys.map(function(k){
    return '<div style="display:flex; align-items:center; gap:8px; padding:6px 8px; border:1px solid var(--border); border-radius:8px; background:#f8fafc; margin-bottom:6px;">' +
      '<span style="font-weight:900; min-width:32px;">'+escapeHtml(k)+'</span>' +
      '<span style="font-size:0.8rem; color:var(--text-muted);">'+calibData[k].length+' sample(s)</span>' +
      '<span style="flex:1"></span>' +
      '<button class="speech-btn-sm" onclick="clearCalibForKey(\''+escapeHtml(k)+'\')" style="padding:4px 8px; font-size:0.75rem;">Clear</button></div>';
  }).join('') + '<button class="speech-btn-sm" onclick="clearCalibForKey()" style="margin-top:6px; width:100%;"><i class="fa-solid fa-trash"></i> Clear All Personal Data</button>';
}
window.clearCalibForKey = clearCalibForKey;

/* =========================================================
   MediaPipe Loader
   ========================================================= */
function loadMediaPipeHands(){
  return new Promise(function(resolve, reject){
    if(window.Hands){ resolve(); return; }
    var s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js';
    s.onload=function(){
      var s2=document.createElement('script');
      s2.src='https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1620248257/drawing_utils.js';
      s2.onload=function(){ resolve(); };
      s2.onerror=function(){ resolve(); };
      document.head.appendChild(s2);
    };
    s.onerror=function(){ reject(new Error('Failed to load MediaPipe Hands')); };
    document.head.appendChild(s);
  });
}
function resizeDetectCanvas(){
  if(!detectCanvas || !detectVideo) return;
  var wrap=detectCanvas.parentElement;
  if(!wrap) return;
  var w=wrap.clientWidth;
  var h=Math.round(w*0.75);
  detectCanvas.width=w;
  detectCanvas.height=h;
  if(detectVideo){ detectVideo.style.width=w+'px'; detectVideo.style.height=h+'px'; }
}

/* =========================================================
   Camera
   ========================================================= */
async function toggleDetect(){ if(detectCameraActive) stopDetect(); else startDetect(); }
async function startDetect(){
  var btn=document.getElementById('detect-start');
  if(btn){ btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Starting...'; btn.disabled=true; }
  updateDetectStatus('Requesting camera permission...','info');
  try{
    try{ await loadMediaPipeHands(); }catch(e){ console.warn('MediaPipe load failed, demo mode',e); }
    var stream=await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user', width:{ideal:640}, height:{ideal:480} }, audio:false });
    detectStream=stream;
    detectVideo.srcObject=stream;
    await detectVideo.play();
    detectCameraActive=true;
    resizeDetectCanvas();
    document.getElementById('detect-overlay').style.display='none';
    updateDetectStatus('Camera active — initializing hand tracking...','info');
    if(btn){ btn.innerHTML='<i class="fa-solid fa-stop"></i> Stop Camera'; btn.disabled=false; btn.classList.remove('primary'); btn.classList.add('danger'); }
    if(window.Hands){
      await initHands();
      startDetectLoop();
      updateDetectStatus('Tracking active — hold sign steady, palm forward, good light','success');
      showToast('Camera + tracking started','success');
    } else {
      startDemoLoop();
      updateDetectStatus('Camera active — demo mode (MediaPipe unavailable)','info');
      showToast('Camera started (demo)','info');
    }
  }catch(err){
    console.error(err);
    updateDetectStatus('Camera error: '+(err.message||err)+' — check permission & HTTPS','error');
    showToast('Camera failed: '+(err.message||'permission'),'error');
    if(btn){ btn.innerHTML='<i class="fa-solid fa-play"></i> Start Camera'; btn.disabled=false; }
    detectCameraActive=false;
  }
}
function stopDetect(){
  detectCameraActive=false;
  if(detectRafId){ cancelAnimationFrame(detectRafId); detectRafId=null; }
  if(detectStream){ detectStream.getTracks().forEach(function(t){t.stop();}); detectStream=null; }
  if(detectVideo) detectVideo.srcObject=null;
  if(detectHands){ try{detectHands.close();}catch(e){} detectHands=null; }
  var btn=document.getElementById('detect-start');
  if(btn){ btn.innerHTML='<i class="fa-solid fa-play"></i> Start Camera'; btn.disabled=false; btn.classList.remove('danger'); btn.classList.add('primary'); }
  var overlay=document.getElementById('detect-overlay');
  if(overlay) overlay.style.display='flex';
  updateDetectStatus('Stopped — press Start to resume','info');
  clearDetectCanvas();
  detectSmoothingQueue=[];
  detectStableSign=null; detectStableCount=0;
}
async function initHands(){
  if(!window.Hands) throw new Error('Hands not loaded');
  detectHands=new Hands({ locateFile:function(file){ return 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/'+file; } });
  detectHands.setOptions({ maxNumHands:1, modelComplexity:1, minDetectionConfidence:0.68, minTrackingConfidence:0.60 });
  detectHands.onResults(onHandsResults);
}
function startDetectLoop(){
  var lastSend=0;
  async function loop(ts){
    if(!detectCameraActive) return;
    if(ts-lastSend>66){
      lastSend=ts;
      if(detectVideo && detectVideo.readyState>=2 && detectHands){
        try{ await detectHands.send({image: detectVideo}); }catch(e){}
      }
    }
    detectRafId=requestAnimationFrame(loop);
  }
  detectRafId=requestAnimationFrame(loop);
}
function startDemoLoop(){
  var demoKeys=['A','B','C','L','V','W','O','I','Y','hello','thank','yes','no','help','love'];
  var idx=0;
  function demoTick(){
    if(!detectCameraActive) return;
    var key=demoKeys[idx% demoKeys.length]; idx++;
    var mock=generateMockPrediction(key);
    handlePrediction(mock.best, mock.alts, null);
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
    setTimeout(demoTick, 1700);
  }
  demoTick();
}
function generateMockPrediction(key){
  var data=(window.SIGN_DATA && (SIGN_DATA.alphabet[key]||SIGN_DATA.words[key]))||{desc:'Simulated',category:'Demo'};
  var alts=[];
  var pool=Object.keys(detectTemplates||{});
  for(var i=0;i<2;i++){
    var rk=pool[Math.floor(Math.random()*pool.length)];
    if(rk===key) continue;
    var d=SIGN_DATA.alphabet[rk]||SIGN_DATA.words[rk];
    alts.push({key:rk, confidence:30+Math.random()*15, desc:(d&&d.desc)||'', category:(d&&d.category)||''});
  }
  return {best:{key:key, confidence:82+Math.random()*12, desc:data.desc, category:data.category}, alts:alts};
}

/* =========================================================
   Results
   ========================================================= */
function onHandsResults(results){
  if(!detectCanvas||!detectCtx) return;
  clearDetectCanvas();
  var hasHand=results.multiHandLandmarks && results.multiHandLandmarks.length>0;
  if(!hasHand){
    updateDetectStatus('No hand detected — center hand, palm forward','info');
    detectStableCount=Math.max(0,detectStableCount-1);
    if(detectStableCount===0) detectStableSign=null;
    // smoothing queue decay
    detectSmoothingQueue=[];
    return;
  }
  var landmarks=results.multiHandLandmarks[0];
  if(detectShowLandmarks) drawLandmarks(landmarks);
  var detection=classifySign(landmarks);
  if(detection){
    handlePrediction(detection.best, detection.alternatives, landmarks);
  } else {
    updateDetectStatus('Hand detected but no confident match — try clearer pose / adjust confidence','info');
  }
}
function clearDetectCanvas(){
  if(!detectCtx||!detectCanvas) return;
  detectCtx.clearRect(0,0,detectCanvas.width,detectCanvas.height);
}
function drawLandmarks(landmarks){
  if(!detectCtx) return;
  var w=detectCanvas.width,h=detectCanvas.height;
  detectCtx.save();
  if(detectMirror){ detectCtx.translate(w,0); detectCtx.scale(-1,1); }
  if(window.HAND_CONNECTIONS && window.drawConnectors){
    drawConnectors(detectCtx, landmarks, HAND_CONNECTIONS, {color:'#6366f1', lineWidth:2});
  } else {
    var conns=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]];
    detectCtx.strokeStyle='#6366f1'; detectCtx.lineWidth=2; detectCtx.beginPath();
    conns.forEach(function(c){ var a=landmarks[c[0]],b=landmarks[c[1]]; detectCtx.moveTo(a.x*w,a.y*h); detectCtx.lineTo(b.x*w,b.y*h); });
    detectCtx.stroke();
  }
  if(window.drawLandmarks){
    drawLandmarks(detectCtx, landmarks, {color:'#06b6d4', lineWidth:1, radius: detectCanvas.width<400?3:4});
  } else {
    landmarks.forEach(function(pt){
      detectCtx.beginPath();
      detectCtx.arc(pt.x*w, pt.y*h, 4,0,Math.PI*2);
      detectCtx.fillStyle='#06b6d4'; detectCtx.fill();
      detectCtx.strokeStyle='white'; detectCtx.lineWidth=1; detectCtx.stroke();
    });
  }
  detectCtx.restore();
}

/* =========================================================
   Feature Extraction (12D)
   ========================================================= */
function angleBetween(a,b,c){
  var ba={x:a.x-b.x,y:a.y-b.y,z:a.z-b.z};
  var bc={x:c.x-b.x,y:c.y-b.y,z:c.z-b.z};
  var dot=ba.x*bc.x+ba.y*bc.y+ba.z*bc.z;
  var magBa=Math.sqrt(ba.x*ba.x+ba.y*ba.y+ba.z*ba.z);
  var magBc=Math.sqrt(bc.x*bc.x+bc.y*bc.y+bc.z*bc.z);
  if(magBa===0||magBc===0) return 180;
  var cos=dot/(magBa*magBc);
  cos=Math.max(-1,Math.min(1,cos));
  return Math.acos(cos)*180/Math.PI;
}
function fingerCurlAngle(landmarks, idx){
  var ids=[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]];
  var chain=ids[idx];
  // 3D angle at PIP and DIP
  var a=angleBetween(landmarks[chain[0]],landmarks[chain[1]],landmarks[chain[2]]);
  var b=angleBetween(landmarks[chain[1]],landmarks[chain[2]],landmarks[chain[3]]);
  var avg=(a+b)/2;
  var angleCurl=1-(avg/180);
  // 2D xy angle as fallback (more stable for front-facing)
  var a2=angleBetween2D(landmarks[chain[0]],landmarks[chain[1]],landmarks[chain[2]]);
  var b2=angleBetween2D(landmarks[chain[1]],landmarks[chain[2]],landmarks[chain[3]]);
  var avg2=(a2+b2)/2;
  var angleCurl2D=1-(avg2/180);
  // distance method: tip vs pip distance from wrist
  var wrist=landmarks[0];
  var tip=landmarks[chain[3]];
  var pip=landmarks[chain[1]];
  var mcp=landmarks[chain[0]];
  var dTip=Math.hypot(tip.x-wrist.x, tip.y-wrist.y);
  var dPip=Math.hypot(pip.x-wrist.x, pip.y-wrist.y);
  var dMcp=Math.hypot(mcp.x-wrist.x, mcp.y-wrist.y);
  var scale=(dMcp||0.2);
  var distRatio=(dTip - dPip)/scale; // >0.3 extended, < -0.1 folded
  var distCurl= distRatio > 0.25 ? 0.05 : distRatio < -0.08 ? 0.95 : 0.5;
  // blend: 50% angle3D, 30% angle2D, 20% distance
  var blended = angleCurl*0.5 + angleCurl2D*0.3 + distCurl*0.2;
  // sharpen with threshold to reduce 0.5 central bias
  if(blended < 0.30) return blended*0.7; // push extended closer to 0
  if(blended > 0.70) return 0.7 + (blended-0.7)*1.0; // keep folded high
  return blended;
}
function angleBetween2D(a,b,c){
  var ba={x:a.x-b.x, y:a.y-b.y};
  var bc={x:c.x-b.x, y:c.y-b.y};
  var dot=ba.x*bc.x + ba.y*bc.y;
  var magBa=Math.hypot(ba.x,ba.y);
  var magBc=Math.hypot(bc.x,bc.y);
  if(magBa===0||magBc===0) return 180;
  var cos=dot/(magBa*magBc);
  cos=Math.max(-1,Math.min(1,cos));
  return Math.acos(cos)*180/Math.PI;
}
function estimateFeatures(landmarks){
  // 5 curls
  var curls=[];
  for(var i=0;i<5;i++) curls.push(fingerCurlAngle(landmarks,i));
  // thumbPos ratio
  var thumbTip=landmarks[4], idxMcp=landmarks[5], pinkyMcp=landmarks[17];
  var dIdx=Math.hypot(thumbTip.x-idxMcp.x, thumbTip.y-idxMcp.y, thumbTip.z-idxMcp.z);
  var dPinky=Math.hypot(thumbTip.x-pinkyMcp.x, thumbTip.y-pinkyMcp.y, thumbTip.z-pinkyMcp.z);
  var thumbPos=dIdx/(dPinky||1); // 0..~2
  // normalize to 0..1 (clamp 0.3..1.4)
  var thumbPosN=Math.max(0,Math.min(1,(thumbPos-0.3)/1.1));
  // thumb tip to each fingertip distances (normalized by hand scale)
  var wrist=landmarks[0], middleMcp=landmarks[9];
  var handScale=Math.hypot(wrist.x-middleMcp.x,wrist.y-middleMcp.y,wrist.z-middleMcp.z)||0.2;
  function normDist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)/handScale; }
  var dThumbIdx=normDist(landmarks[4],landmarks[8]);
  var dThumbMid=normDist(landmarks[4],landmarks[12]);
  var dThumbRing=normDist(landmarks[4],landmarks[16]);
  var dThumbPinky=normDist(landmarks[4],landmarks[20]);
  // map distances 0.2 close .. 2.0 far -> 0..1
  function mapD(d){ return Math.max(0,Math.min(1,(d-0.2)/1.6)); }
  // spread: distance between index-middle, middle-ring, index-pinky (when extended)
  var dIdxMid=normDist(landmarks[8],landmarks[12]);
  var dMidRing=normDist(landmarks[12],landmarks[16]);
  var dIdxPinky=normDist(landmarks[8],landmarks[20]);
  var spreadIdxMid=Math.max(0,Math.min(1,(dIdxMid-0.15)/0.5));
  var spreadMidRing=Math.max(0,Math.min(1,(dMidRing-0.15)/0.5));
  var spreadIdxPinky=Math.max(0,Math.min(1,(dIdxPinky-0.3)/0.8));
  // average spread
  var avgSpread=(spreadIdxMid+spreadMidRing+spreadIdxPinky)/3;

  // 12D vector: 5 curls + thumbPosN + dThumbIdxN + dThumbMidN + avgSpread + pinkyCurl bias + ringCurl bias (for W etc)
  // Actually 12: [thumb,idx,mid,ring,pinky, thumbPosN, dThumbIdxN, dThumbMidN, avgSpread, dThumbRingN, dThumbPinkyN, palmOrientation]
  // Palm orientation: estimate palm normal z vs y: compute palm facing forward vs sideways via landmarks 5,17,0
  var palmVec={x: landmarks[17].x - landmarks[5].x, y: landmarks[17].y - landmarks[5].y, z: landmarks[17].z - landmarks[5].z};
  var palmAngle=Math.atan2(palmVec.y, palmVec.x)*180/Math.PI; // -180..180
  var palmNorm=(palmAngle+180)/360; // 0..1

  return [curls[0],curls[1],curls[2],curls[3],curls[4], thumbPosN, mapD(dThumbIdx), mapD(dThumbMid), avgSpread, mapD(dThumbRing), mapD(dThumbPinky), palmNorm];
}

/* =========================================================
   Classification (12D distance + KNN calib + smoothing)
   ========================================================= */
function classifySign(landmarks){
  if(!detectTemplates) buildDetectTemplates();
  var poolKeys=Object.keys(detectTemplates);
  if(!poolKeys.length) return null;
  var filterKeys=poolKeys;
  if(detectHighAccuracy){
    filterKeys=HIGH_ACC_SET.filter(function(k){return poolKeys.indexOf(k)!==-1;});
    if(!filterKeys.length) filterKeys=poolKeys;
  } else if(detectMode==='letters'){
    filterKeys=poolKeys.filter(function(k){ return k.length===1 && k>='A'&&k<='Z'; });
  } else if(detectMode==='words'){
    filterKeys=poolKeys.filter(function(k){ return k.length>1; });
  }
  if(!filterKeys.length) filterKeys=poolKeys;

  var detected=estimateFeatures(landmarks);

  // First, check personalized calib KNN if available and enabled
  var bestCalib=null, bestCalibDist=Infinity, bestCalibKey=null;
  if(calibEnabled && Object.keys(calibData).length){
    // For each calibrated sign that is in filterKeys
    var calibCandidates=Object.keys(calibData).filter(function(k){ return filterKeys.indexOf(k)!==-1; });
    calibCandidates.forEach(function(key){
      var samples=calibData[key];
      samples.forEach(function(vec){
        var sum=0;
        for(var i=0;i<12;i++){
          var diff=detected[i]-vec[i];
          // weight first 5 curls higher, thumb distances medium, spread/palm lower
          var w = i<5?1.2 : (i<8?0.9 : 0.6);
          sum+=w*diff*diff;
        }
        var dist=Math.sqrt(sum);
        if(dist<bestCalibDist){ bestCalibDist=dist; bestCalibKey=key; }
      });
    });
    if(bestCalibKey){
      var maxDistCalib=Math.sqrt(12*1.4); // approx
      var confCalib=Math.max(0,1-bestCalibDist/maxDistCalib)*100;
      // If calib confidence decent (>55) prefer it
      if(confCalib>55){
        var dCalib=window.SIGN_DATA && (SIGN_DATA.alphabet[bestCalibKey]||SIGN_DATA.words[bestCalibKey]);
        // also compute generic alternatives for UI
        var scoredTmp=[];
        filterKeys.forEach(function(k){
          var tmpl=detectTemplates[k].slice(0,12);
          var s=0; for(var i=0;i<12;i++){ var d=detected[i]-tmpl[i]; var w=i<5?1.2:0.7; s+=w*d*d; } scoredTmp.push({key:k, dist:Math.sqrt(s)});
        });
        scoredTmp.sort(function(a,b){return a.dist-b.dist;});
        var altsTmp=scoredTmp.slice(0,3).filter(function(s){return s.key!==bestCalibKey;}).map(function(s){
          var d=window.SIGN_DATA&&(SIGN_DATA.alphabet[s.key]||SIGN_DATA.words[s.key]);
          var conf=Math.max(0,1-s.dist/Math.sqrt(12))*100;
          return {key:s.key, confidence:Math.round(conf), desc:d?d.desc:'', category:d?d.category:''};
        });
        return { best:{key:bestCalibKey, confidence:Math.round(confCalib), desc:dCalib?dCalib.desc:'', category:dCalib?dCalib.category:'', dist:bestCalibDist, source:'personal'}, alternatives: altsTmp, detectedVec:detected };
      }
    }
  }

  // Generic template matching 12D
  var scored=[];
  filterKeys.forEach(function(key){
    var tmpl=detectTemplates[key].slice(0,12);
    var sum=0;
    for(var i=0;i<12;i++){
      var diff=detected[i]-tmpl[i];
      var w = i<5?1.3 : (i===5?1.0 : (i<8?0.85:0.55)); // curls weighted most
      sum+=w*diff*diff;
    }
    var dist=Math.sqrt(sum);
    // penalize generic central templates (e.g., O/C) that are near 0.5 and flat — they attract false positives
    var avg5=(tmpl[0]+tmpl[1]+tmpl[2]+tmpl[3]+tmpl[4])/5;
    var var5=((tmpl[0]-avg5)*(tmpl[0]-avg5)+(tmpl[1]-avg5)*(tmpl[1]-avg5)+(tmpl[2]-avg5)*(tmpl[2]-avg5)+(tmpl[3]-avg5)*(tmpl[3]-avg5)+(tmpl[4]-avg5)*(tmpl[4]-avg5))/5;
    var centrality=Math.max(0,1-Math.abs(avg5-0.5)*2); // 1 when avg 0.5, 0 when avg 0/1
    var flatness=Math.max(0,1-Math.min(1,var5*10)); // 1 when all curls similar, 0 when varied
    var penalty=centrality*flatness*0.18; // up to 0.18
    // extra penalty for hello-like open hand when hand is not clearly open (thumb not far)
    if(key==='hello' && detected[0] < 0.4) penalty+=0.12;
    dist+=penalty;
    var maxDist=Math.sqrt(12*1.4);
    var conf=Math.max(0,1-dist/maxDist)*100;
    scored.push({key:key, dist:dist, confidence:conf, tmpl:tmpl});
  });
  scored.sort(function(a,b){return a.dist-b.dist;});
  var best=scored[0];
  if(!best) return null;
  if(best.confidence < detectThreshold) return null;

  // Smoothing: majority vote among last SMOOTH_N raw best predictions
  // Push current best key to queue
  detectSmoothingQueue.push(best.key);
  if(detectSmoothingQueue.length>SMOOTH_N) detectSmoothingQueue.shift();
  // Find most frequent in queue
  var freq={}; detectSmoothingQueue.forEach(function(k){ freq[k]=(freq[k]||0)+1; });
  var mostKey=best.key, mostCount=freq[best.key]||0;
  Object.keys(freq).forEach(function(k){ if(freq[k]>mostCount){ mostCount=freq[k]; mostKey=k; } });
  // If most frequent not same as best, but has >=3 votes, use it if its confidence within 10% of best
  var mostEntry=scored.find(function(s){return s.key===mostKey;});
  if(mostEntry && mostKey!==best.key && mostCount>=3 && mostEntry.confidence> best.confidence-12){
    best=mostEntry;
  }

  var alts=scored.slice(1,4).map(function(s){
    var d=window.SIGN_DATA&&(SIGN_DATA.alphabet[s.key]||SIGN_DATA.words[s.key]);
    return {key:s.key, confidence:Math.round(s.confidence), desc:d?d.desc:'', category:d?d.category:''};
  });
  var dBest=window.SIGN_DATA&&(SIGN_DATA.alphabet[best.key]||SIGN_DATA.words[best.key]);
  return { best:{key:best.key, confidence:Math.round(best.confidence), desc:dBest?dBest.desc:'', category:dBest?dBest.category:'', dist:best.dist}, alternatives:alts, detectedVec:detected };
}

/* =========================================================
   Handle Prediction (stability + UI)
   ========================================================= */
function handlePrediction(best, alts, landmarks){
  var now=Date.now();
  if(detectStableSign===best.key && (now-detectLastTime)<1800){
    detectStableCount++;
  } else {
    detectStableSign=best.key;
    detectStableCount=1;
  }
  detectLastTime=now;
  var isStable=detectStableCount>=STABLE_FRAMES || best.confidence>=86;
  if(!isStable){
    updateDetectStatus('Seeing: '+best.key+' ('+best.confidence+'%) — hold steady...','info');
    renderDetectResult(best, alts, false);
    return;
  }
  if(detectLastSign===best.key && (now-(detectLastSignTime||0))<COOLDOWN_MS) return;
  detectLastSign=best.key; detectLastSignTime=now; detectStableCount=0;
  renderDetectResult(best, alts, true);
  addDetectHistory(best);
  updateDetectStatus('Detected: '+best.key+' — '+best.desc+' ('+best.confidence+'%'+(best.source==='personal'?' • personal':'')+')','success');
  try{ if(window.setSign) window.setSign(best.key); }catch(e){}
  if(detectAutoSpeak){
    try{ if(typeof speakWord==='function') speakWord(best.key+' means '+best.desc); else { var u=new SpeechSynthesisUtterance(best.key+' means '+best.desc); window.speechSynthesis.speak(u);} }catch(e){}
  }
  var wrap=document.querySelector('.detect-video-wrap');
  if(wrap){ wrap.classList.add('flash'); setTimeout(function(){wrap.classList.remove('flash');},500); }
}
function renderDetectResult(best, alts, isConfirmed){
  var card=document.getElementById('detect-result-card');
  if(!card) return;
  card.classList.remove('empty');
  var confColor=best.confidence>=76?'var(--success)':best.confidence>=60?'#d97706':'var(--danger)';
  var confWidth=best.confidence+'%';
  var isWord=best.key.length>1;
  var srcBadge=best.source==='personal'?'<span style="background:#6366f1; color:white; padding:2px 6px; border-radius:4px; font-size:0.65rem; margin-left:6px;">PERSONAL</span>':'';
  card.innerHTML=
    '<div class="detect-result-header"><span class="detect-result-badge '+(isConfirmed?'confirmed':'tentative')+'">'+(isConfirmed?'<i class="fa-solid fa-check"></i> Detected':'<i class="fa-solid fa-eye"></i> Seeing')+'</span><span class="detect-result-confidence" style="color:'+confColor+'">'+best.confidence+'% confidence'+srcBadge+'</span></div>'+
    '<div class="detect-result-main"><div class="detect-result-sign">'+escapeHtml(best.key)+'</div><div class="detect-result-desc">'+escapeHtml(best.desc||'No description')+'</div><div class="detect-result-category"><i class="fa-solid fa-tag"></i> '+escapeHtml(best.category||'Sign')+' • '+(isWord?'Word':'Letter')+'</div></div>'+
    '<div class="detect-confidence-bar"><div class="detect-confidence-fill" style="width:'+confWidth+'; background:'+confColor+'"></div></div>'+
    '<div class="detect-result-actions"><button class="speech-btn primary" onclick="speakDetectResult()"><i class="fa-solid fa-volume-high"></i> Speak</button><button class="speech-btn secondary" onclick="showDetectInLearn()"><i class="fa-solid fa-hand"></i> Show in Lab</button><button class="speech-btn secondary" onclick="copyDetectResult()"><i class="fa-solid fa-copy"></i> Copy</button></div>';
  card.dataset.key=best.key; card.dataset.desc=best.desc; card.dataset.category=best.category;
  var altEl=document.getElementById('detect-alternatives');
  if(altEl){
    if(alts&&alts.length){
      altEl.innerHTML='<div class="detect-alts-title">Also considered:</div><div class="detect-alts-list">'+
        alts.map(function(a){ return '<button class="detect-alt" onclick="selectAlternative(\''+escapeHtml(a.key)+'\')"><span class="detect-alt-key">'+escapeHtml(a.key)+'</span><span class="detect-alt-conf">'+a.confidence+'%</span><span class="detect-alt-desc">'+escapeHtml(a.desc.slice(0,36))+(a.desc.length>36?'...':'')+'</span></button>'; }).join('')+'</div>';
      altEl.style.display='block';
    } else altEl.style.display='none';
  }
}
function selectAlternative(key){
  var data=window.SIGN_DATA&&(SIGN_DATA.alphabet[key]||SIGN_DATA.words[key]);
  if(!data) return;
  var mockBest={key:key, confidence:55, desc:data.desc, category:data.category};
  renderDetectResult(mockBest, [], true);
  try{ if(window.setSign) window.setSign(key);}catch(e){}
  updateDetectStatus('Selected alternative: '+key+' — '+data.desc,'info');
}
function speakDetectResult(){
  var card=document.getElementById('detect-result-card');
  if(!card||!card.dataset.key) return;
  var text=card.dataset.key+' means '+card.dataset.desc;
  try{ if(typeof speakWord==='function') speakWord(text); else { var u=new SpeechSynthesisUtterance(text); window.speechSynthesis.speak(u);} showToast('Speaking: '+card.dataset.key,'info'); }catch(e){ showToast('TTS not available','error'); }
}
function copyDetectResult(){
  var card=document.getElementById('detect-result-card');
  if(!card||!card.dataset.key) return;
  var text=card.dataset.key+' — '+card.dataset.desc+' ('+card.dataset.category+')';
  navigator.clipboard.writeText(text).then(function(){ showToast('Copied: '+card.dataset.key,'success'); }).catch(function(){ showToast('Copy failed','error'); });
}
function showDetectInLearn(){
  var card=document.getElementById('detect-result-card');
  if(!card||!card.dataset.key) return;
  var key=card.dataset.key;
  if(typeof showSection==='function') showSection('learn');
  setTimeout(function(){
    try{ if(window.setSign) window.setSign(key);}catch(e){}
    var catEl=document.getElementById('sign-category'), nameEl=document.getElementById('sign-name'), dispEl=document.getElementById('sign-display'), descEl=document.getElementById('sign-desc');
    var data=window.SIGN_DATA&&(SIGN_DATA.alphabet[key]||SIGN_DATA.words[key]);
    if(data&&catEl) catEl.textContent=data.category;
    if(nameEl) nameEl.textContent=key;
    if(dispEl) dispEl.textContent=key;
    if(descEl) descEl.textContent=data?data.desc:'';
  },300);
}

/* =========================================================
   History
   ========================================================= */
function addDetectHistory(best){
  detectHistory.unshift({key:best.key, desc:best.desc, category:best.category, confidence:best.confidence, time:new Date().toLocaleTimeString(), source:best.source});
  if(detectHistory.length>14) detectHistory.pop();
  renderDetectHistory();
}
function renderDetectHistory(){
  var el=document.getElementById('detect-history-list');
  if(!el) return;
  if(!detectHistory.length){ el.innerHTML='<p class="pdf-empty" style="padding:10px;">No detections yet.</p>'; return; }
  el.innerHTML=detectHistory.map(function(h){
    return '<div class="detect-history-item" onclick="selectAlternative(\''+escapeHtml(h.key)+'\')" title="Click to view"><span class="detect-history-key">'+escapeHtml(h.key)+'</span><span class="detect-history-desc">'+escapeHtml(h.desc.slice(0,32))+(h.desc.length>32?'...':'')+'</span><span class="detect-history-conf">'+h.confidence+'%'+(h.source==='personal'?'*':'')+'</span><span class="detect-history-time">'+h.time+'</span></div>';
  }).join('');
}
function clearDetectHistory(){ detectHistory=[]; renderDetectHistory(); showToast('History cleared','info'); }

/* =========================================================
   Calibration Actions
   ========================================================= */
function captureCalibSample(){
  var sel=document.getElementById('detect-calib-select');
  if(!sel){ showToast('Select a sign first','error'); return; }
  var key=sel.value;
  if(!key){ showToast('Select a sign to calibrate','error'); return; }
  if(!detectCameraActive){ showToast('Start camera first','error'); return; }
  // Need current landmarks - we could store last detected vector
  // For now, if no recent detection, ask to hold sign
  // We will capture current detectedVec from last classification attempt
  // If none, we create a mock from template + noise as fallback for demo
  // Better: grab last successful detectedVec from global
  var lastVec = window._lastDetectedVec;
  if(!lastVec){
    // Try to get current hand landmarks via one-shot? Instead fallback to template with jitter for demo
    if(window.detectTemplates && window.detectTemplates[key]){
      var tmpl=window.detectTemplates[key].slice(0,12);
      // add small noise
      var noisy=tmpl.map(function(v){ return Math.max(0,Math.min(1, v + (Math.random()*0.08-0.04))); });
      addCalibSample(key, noisy);
      showToast('Captured calibration for '+key+' (simulated) — hold real sign for better sample','success');
      return;
    }
    showToast('No hand detected — hold the sign steady in frame','error');
    return;
  }
  addCalibSample(key, lastVec.slice());
  showToast('Captured calibration for '+key+' — '+(calibData[key].length)+' sample(s)','success');
}
// expose for onHandsResults to store last vec
window._lastDetectedVec=null;

/* Hook to store last vec on each classification */
var _origClassify = null; // will wrap

/* =========================================================
   Controls
   ========================================================= */
function updateDetectStatus(msg,type){
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
  detectMirror=chk?chk.checked:!detectMirror;
  var video=document.getElementById('detect-video');
  if(video) video.style.transform=detectMirror?'scaleX(-1)':'none';
}
function toggleLandmarks(){
  var chk=document.getElementById('detect-landmarks');
  detectShowLandmarks=chk?chk.checked:true;
}
function toggleAutoSpeak(){
  var chk=document.getElementById('detect-autospeak');
  detectAutoSpeak=chk?chk.checked:false;
  if(detectAutoSpeak) showToast('Auto-speak enabled','info');
}
function toggleHighAccuracy(){
  var chk=document.getElementById('detect-highacc');
  detectHighAccuracy=chk?chk.checked:false;
  detectSmoothingQueue=[];
  showToast(detectHighAccuracy?'High-accuracy mode: 17 distinct signs':'Full mode: all signs','info');
}
function changeDetectMode(val){
  detectMode=val||'all';
  detectSmoothingQueue=[];
  showToast('Detect mode: '+detectMode,'info');
}
function captureDetect(){
  if(!detectCanvas||!detectVideo) return;
  var tmp=document.createElement('canvas');
  tmp.width=detectCanvas.width; tmp.height=detectCanvas.height;
  var tctx=tmp.getContext('2d');
  tctx.save();
  if(detectMirror){ tctx.translate(tmp.width,0); tctx.scale(-1,1); }
  tctx.drawImage(detectVideo,0,0,tmp.width,tmp.height);
  tctx.restore();
  tctx.drawImage(detectCanvas,0,0);
  var url=tmp.toDataURL('image/png');
  var a=document.createElement('a');
  a.href=url; a.download='EduAccess-detect-'+(detectLastSign||'snapshot')+'.png';
  a.click();
  showToast('Snapshot saved','success');
}

/* Wrap estimate to store last vec */
var origEstimate=null;
function wrapEstimate(){
  // Monkey patch estimateFeatures to store last
  var orig=estimateFeatures;
  estimateFeatures=function(landmarks){
    var vec=orig(landmarks);
    window._lastDetectedVec=vec.slice();
    return vec;
  };
}
setTimeout(wrapEstimate, 800);

/* Expose */
window.initSignDetect=initSignDetect;
window.toggleDetect=toggleDetect;
window.startDetect=startDetect;
window.stopDetect=stopDetect;
window.updateDetectThreshold=updateDetectThreshold;
window.toggleMirror=toggleMirror;
window.toggleLandmarks=toggleLandmarks;
window.toggleAutoSpeak=toggleAutoSpeak;
window.toggleHighAccuracy=toggleHighAccuracy;
window.changeDetectMode=changeDetectMode;
window.captureDetect=captureDetect;
window.clearDetectHistory=clearDetectHistory;
window.speakDetectResult=speakDetectResult;
window.copyDetectResult=copyDetectResult;
window.showDetectInLearn=showDetectInLearn;
window.selectAlternative=selectAlternative;
window.captureCalibSample=captureCalibSample;
window.renderCalibList=renderCalibList;

if(typeof escapeHtml==='undefined'){
  window.escapeHtml=function(s){ if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); };
}
