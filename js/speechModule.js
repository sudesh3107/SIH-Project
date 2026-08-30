var speechSynthesis = window.speechSynthesis;
var currentUtterance = null;
var speechSpeed = 1;
var isSpeaking = false;
var recognition = null;
var isListening = false;
var capturedText = '';
var animationFrameId = null;

function initSpeech() {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech Synthesis not supported');
  }
}

function initSTT() {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = function(event) {
    var transcript = '';
    var interimTranscript = '';
    for (var i = event.resultIndex; i < event.results.length; i++) {
      var result = event.results[i];
      if (result.isFinal) { transcript += result[0].transcript; }
      else { interimTranscript += result[0].transcript; }
    }
    capturedText = transcript;
    var display = document.getElementById('subtitle-display');
    var input = document.getElementById('subtitle-input');
    if (display) display.innerHTML = '<span class="subtitle-caption">' + (transcript || interimTranscript || 'Listening...') + '</span>';
    if (input) input.value = transcript + interimTranscript;
  };

  recognition.onerror = function(event) {
    if (event.error === 'not-allowed') {
      showToast('Microphone access denied. Please allow microphone permissions.', 'error');
    } else if (event.error === 'no-speech') {
      showToast('No speech detected. Please try again.', 'info');
    } else {
      showToast('Speech recognition error: ' + event.error, 'error');
    }
    setSTTStatus('Error: ' + event.error);
  };

  recognition.onend = function() {
    if (isListening) {
      try { recognition.start(); } catch (e) {}
    }
  };
}

function loadSampleText(type) {
  var samples = {
    greeting: "Welcome to EduBridge! We are so glad you are here. Learning sign language is a wonderful way to connect with others and make communication accessible for everyone.",
    lesson: "Today's lesson is about the ASL alphabet. Each letter has a unique hand shape. Practice each sign carefully and try to remember the hand positions.",
    story: "Once upon a time, there was a young girl named Maya who loved learning new things. Every day, she practiced her sign language with her friends at the community center.",
    news: "In a groundbreaking development, schools across the country are now integrating sign language into their core curriculum for all students."
  };
  var text = samples[type] || samples.greeting;
  document.getElementById('speech-text').value = text;
  showToast('Loaded ' + type + ' sample text', 'info');
}

function updateSpeed(value) {
  speechSpeed = parseFloat(value);
  var el = document.getElementById('speed-value');
  if (el) el.textContent = speechSpeed.toFixed(1) + 'x';
  if (currentUtterance) currentUtterance.rate = speechSpeed;
}

function speakSelected() {
  var textarea = document.getElementById('speech-text');
  var selection = window.getSelection().toString();
  var text = selection || textarea.value;
  if (!text || !text.trim()) { showToast('Please select text or add text to speak', 'error'); return; }
  stopTTS();
  speakText(text);
}

function speakText(text) {
  if (!speechSynthesis) { showToast('Text-to-Speech is not supported in this browser', 'error'); return; }
  stopTTS();
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.rate = speechSpeed;
  currentUtterance.pitch = 1;
  currentUtterance.volume = 1;
  var voices = speechSynthesis.getVoices();
  var preferredVoice = null;
  for (var i = 0; i < voices.length; i++) {
    if (voices[i].lang.startsWith('en')) { preferredVoice = voices[i]; break; }
  }
  if (preferredVoice) currentUtterance.voice = preferredVoice;
  currentUtterance.onend = function() {
    isSpeaking = false;
    updateTTSButton('play');
    setSpeechStatus('Finished speaking');
  };
  currentUtterance.onerror = function() {
    isSpeaking = false;
    updateTTSButton('play');
    setSpeechStatus('Speech error occurred');
  };
  isSpeaking = true;
  updateTTSButton('stop');
  setSpeechStatus('Speaking...');
  speechSynthesis.speak(currentUtterance);
}

function toggleTTS() { if (isSpeaking) stopTTS(); else speakSelected(); }

function stopTTS() {
  if (speechSynthesis) speechSynthesis.cancel();
  isSpeaking = false;
  updateTTSButton('play');
  setSpeechStatus('Stopped');
}

function updateTTSButton(state) {
  var btn = document.getElementById('tts-btn');
  if (!btn) return;
  if (state === 'play') {
    btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Play';
    btn.className = 'speech-btn primary';
  } else if (state === 'stop') {
    btn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop Speaking';
    btn.className = 'speech-btn danger';
  }
}

function setSpeechStatus(msg) { var el = document.getElementById('speech-status'); if (el) el.textContent = msg; }

function toggleSTT() {
  if (!recognition) { showToast('Speech recognition is supported in Google Chrome or Microsoft Edge.', 'error'); return; }
  var btn = document.getElementById('stt-btn');
  if (isListening) {
    recognition.stop();
    isListening = false;
    btn.innerHTML = '<i class="fa-solid fa-microphone"></i> Start Listening';
    btn.className = 'speech-btn primary';
    setSTTStatus('Microphone inactive');
  } else {
    try {
      recognition.start();
      isListening = true;
      btn.innerHTML = '<i class="fa-solid fa-pause"></i> Stop Listening';
      btn.className = 'speech-btn danger';
      setSTTStatus('Listening...');
    } catch (e) { showToast('Could not start speech recognition', 'error'); }
  }
}

function clearCaption() {
  capturedText = '';
  var display = document.getElementById('subtitle-display');
  var input = document.getElementById('subtitle-input');
  if (display) display.innerHTML = '<span class="subtitle-caption">Waiting for speech input...</span>';
  if (input) input.value = '';
  showToast('Captions cleared', 'info');
}

function copyCaption() {
  if (!capturedText) { showToast('No text to copy', 'error'); return; }
  navigator.clipboard.writeText(capturedText).then(function() {
    showToast('Copied to clipboard!', 'success');
  }).catch(function() { showToast('Failed to copy', 'error'); });
}

function updateCaptionDisplay() {
  var input = document.getElementById('subtitle-input');
  var display = document.getElementById('subtitle-display');
  if (input && display) {
    var text = input.value;
    if (text.trim()) display.innerHTML = '<span class="subtitle-caption">' + text + '</span>';
    else display.innerHTML = '<span class="subtitle-caption">Waiting for speech input...</span>';
  }
}

function setSTTStatus(msg) { var el = document.getElementById('stt-status'); if (el) el.textContent = msg; }

function speakWord(text) {
  if (!speechSynthesis) return;
  speechSynthesis.cancel();
  var utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = speechSpeed;
  speechSynthesis.speak(utterance);
}

window.initSpeech = initSpeech;
window.initSTT = initSTT;
window.toggleSTT = toggleSTT;
window.clearCaption = clearCaption;
window.copyCaption = copyCaption;
window.toggleTTS = toggleTTS;
window.stopTTS = stopTTS;
window.loadSampleText = loadSampleText;
window.updateSpeed = updateSpeed;
window.updateCaptionDisplay = updateCaptionDisplay;
window.speakWord = speakWord;