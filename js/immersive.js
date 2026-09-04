/* =========================================================
   EduAccess - Immersive UI Interactions
   Scroll progress, navbar hide, reveal on scroll, tilt, parallax
   ========================================================= */

(function(){
  // Scroll progress
  var progress = document.getElementById('scroll-progress');
  function updateProgress(){
    var h = document.documentElement;
    var scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    if(progress) progress.style.width = scrolled + '%';
    // Navbar scrolled state
    var nav = document.querySelector('.navbar');
    if(nav){
      if(window.scrollY > 10) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }
  }
  var lastY = 0;
  var ticking = false;
  window.addEventListener('scroll', function(){
    var y = window.scrollY;
    if(!ticking){
      requestAnimationFrame(function(){
        updateProgress();
        var nav = document.querySelector('.navbar');
        if(nav){
          if(y > lastY && y > 120) nav.classList.add('hidden');
          else nav.classList.remove('hidden');
          lastY = y;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, {passive:true});
  updateProgress();

  // Reveal on scroll
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, {threshold: 0.12, rootMargin: '0px 0px -40px 0px'});
    revealEls.forEach(function(el){ io.observe(el); });
    // Also observe sections and cards
    document.querySelectorAll('.feature-card, .lesson-progress-item, .sign-card, .quiz-card, .progress-card, .detect-video-card, .pdf-panel').forEach(function(el){
      el.classList.add('reveal');
      io.observe(el);
    });
  } else {
    revealEls.forEach(function(el){ el.classList.add('visible'); });
  }

  // Tilt ONLY for home feature cards — not for interactive panels (Detect/PDF)
  var tiltEls = document.querySelectorAll('.features .feature-card');
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if(!prefersReduced && !isTouch){
    tiltEls.forEach(function(card){
      var raf = null;
      card.addEventListener('mousemove', function(e){
        if(raf) return;
        raf = requestAnimationFrame(function(){
          var rect = card.getBoundingClientRect();
          var x = e.clientX - rect.left;
          var y = e.clientY - rect.top;
          var cx = rect.width/2, cy = rect.height/2;
          // subtler: divisor 28 not 18, scale 1.015
          var rx = (y - cy) / -28;
          var ry = (x - cx) / 28;
          rx = Math.max(-6, Math.min(6, rx));
          ry = Math.max(-6, Math.min(6, ry));
          card.style.transform = 'perspective(900px) rotateX('+rx+'deg) rotateY('+ry+'deg) translateY(-3px)';
          raf = null;
        });
      });
      card.addEventListener('mouseleave', function(){
        card.style.transform = '';
      });
    });
  }

  // Parallax for hero orbs
  var hero = document.querySelector('.hero');
  if(hero){
    hero.addEventListener('mousemove', function(e){
      var rect = hero.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      hero.querySelectorAll('.hero-orb').forEach(function(orb, i){
        var depth = (i+1)*0.6;
        orb.style.transform = 'translate('+(x*depth*18)+'px,'+(y*depth*14)+'px) scale(1.02)';
      });
      var glass = hero.querySelector('.hero-glass');
      if(glass) glass.style.transform = 'translate('+(x*10)+'px,'+(y*6)+'px)';
    });
    hero.addEventListener('mouseleave', function(){
      hero.querySelectorAll('.hero-orb').forEach(function(o){ o.style.transform=''; });
      var g = hero.querySelector('.hero-glass');
      if(g) g.style.transform='';
    });
  }

  // Add subtle hover glow to primary buttons
  document.querySelectorAll('.btn-primary, .speech-btn.primary, .nav-btn.primary').forEach(function(b){
    b.addEventListener('mousemove', function(e){
      var r = b.getBoundingClientRect();
      var x = ((e.clientX - r.left)/r.width)*100;
      b.style.setProperty('--mx', x+'%');
    });
  });

  // Ensure immersive-bg orbs float independently (already CSS), add random delays already

  // Expose
  window.immersiveInit = function(){ updateProgress(); };
})();
