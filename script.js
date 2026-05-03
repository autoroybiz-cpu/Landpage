/* ============================================================
   AutoRoy AI — script.js
   Handles: navbar, mobile menu, scroll reveal, counters,
            FAQ accordion, hero stats bar, form → WhatsApp
============================================================ */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     NAVBAR — scroll state
  ---------------------------------------------------------- */
  const navbar = document.getElementById('navbar');

  function handleNavbarScroll() {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll();

  /* ----------------------------------------------------------
     SMOOTH SCROLLING — nav links
  ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = navbar.offsetHeight + 16;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      if (prefersReducedMotion) {
        window.scrollTo({ top: top });
      } else {
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
      // Close mobile menu if open
      closeMobileMenu();
    });
  });

  /* ----------------------------------------------------------
     MOBILE MENU
  ---------------------------------------------------------- */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  let menuOpen = false;

  function openMobileMenu() {
    menuOpen = true;
    navLinks.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    menuOpen = false;
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', function () {
    if (menuOpen) { closeMobileMenu(); } else { openMobileMenu(); }
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) closeMobileMenu();
  });

  /* ----------------------------------------------------------
     SCROLL REVEAL — IntersectionObserver
  ---------------------------------------------------------- */
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal, .reveal-left').forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // If reduced motion or no support, show everything immediately
    document.querySelectorAll('.reveal, .reveal-left').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ----------------------------------------------------------
     COUNTER ANIMATION — hero stats
  ---------------------------------------------------------- */
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = prefersReducedMotion ? 0 : 1400;
    const start = performance.now();
    const hasPct = el.classList.contains('stat-pct');

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      el.textContent = current + (hasPct ? '%' : '');
      if (progress < 1) requestAnimationFrame(step);
    }

    if (duration === 0) {
      el.textContent = target + (hasPct ? '%' : '');
    } else {
      requestAnimationFrame(step);
    }
  }

  // Also animate the stats bar fill
  function animateStatsBar() {
    const bar = document.querySelector('.stats-bar-fill');
    if (bar) bar.style.width = '94%';
  }

  // Animate strip counters — triggered on scroll via IntersectionObserver
  var stripTriggered = false;
  var stripEl = document.querySelector('.stats-strip');
  if (stripEl && 'IntersectionObserver' in window) {
    var stripObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !stripTriggered) {
          stripTriggered = true;
          document.querySelectorAll('.ss-counter').forEach(function (el) {
            var target = parseInt(el.dataset.target, 10);
            var suffix = el.dataset.suffix || '';
            var dur    = prefersReducedMotion ? 0 : 1600;
            var t0     = performance.now();
            if (dur === 0) { el.textContent = target + suffix; return; }
            (function tick(now) {
              var p = Math.min((now - t0) / dur, 1);
              el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target) + suffix;
              if (p < 1) requestAnimationFrame(tick);
            })(t0);
          });
          stripObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 }); // lower threshold = fires earlier as user scrolls in
    stripObserver.observe(stripEl);
  }

  // Hero stats-card counters — wait for the reveal animation to FINISH before
  // counting, because the card starts invisible (reveal-left) and the old
  // IntersectionObserver fired while the card was still transparent.
  var heroVisual   = document.querySelector('.hero-visual');
  var statsCard    = document.querySelector('.stats-card');
  var heroCountDone = false;

  function runHeroCounters() {
    if (heroCountDone) return;
    heroCountDone = true;
    // 850ms = reveal-left transition duration (0.8s) + small buffer
    var delay = prefersReducedMotion ? 0 : 850;
    setTimeout(function () {
      document.querySelectorAll('.stat-num').forEach(animateCounter);
      animateStatsBar();
    }, delay);
  }

  if (heroVisual && statsCard) {
    if (prefersReducedMotion) {
      // No transitions — just set values instantly
      runHeroCounters();
    } else if ('MutationObserver' in window) {
      // Watch for .visible being added to hero-visual by the reveal system
      var heroMO = new MutationObserver(function () {
        if (heroVisual.classList.contains('visible')) {
          runHeroCounters();
          heroMO.disconnect();
        }
      });
      heroMO.observe(heroVisual, { attributes: true, attributeFilter: ['class'] });
      // Handle case where .visible was already added before this code ran
      if (heroVisual.classList.contains('visible')) { heroMO.disconnect(); runHeroCounters(); }
    } else {
      // Fallback for old browsers
      var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { runHeroCounters(); counterObserver.unobserve(entry.target); }
        });
      }, { threshold: 0.5 });
      counterObserver.observe(statsCard);
    }
  }

  /* ----------------------------------------------------------
     FAQ ACCORDION
  ---------------------------------------------------------- */
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item   = this.closest('.faq-item');
      const answer = item.querySelector('.faq-a');
      const isOpen = item.classList.contains('open');

      // Close all open items
      document.querySelectorAll('.faq-item.open').forEach(function (openItem) {
        openItem.classList.remove('open');
        openItem.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        // Keep 'hidden' attribute removed but max-height at 0 for CSS animation
      });

      // Toggle clicked item
      if (!isOpen) {
        item.classList.add('open');
        this.setAttribute('aria-expanded', 'true');
        answer.removeAttribute('hidden');
      } else {
        answer.setAttribute('hidden', '');
      }
    });
  });

  /* ----------------------------------------------------------
     LEAD FORM — open WhatsApp with pre-filled message
  ---------------------------------------------------------- */
  const form = document.getElementById('leadForm');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const name       = document.getElementById('fullName').value.trim();
      const business   = document.getElementById('businessName').value.trim();
      const phone      = document.getElementById('phone').value.trim();
      const industry   = document.getElementById('industry').value;
      const automation = document.getElementById('automation').value.trim();

      // Validate
      let hasError = false;
      [
        { id: 'fullName',     val: name },
        { id: 'businessName', val: business },
        { id: 'phone',        val: phone },
        { id: 'industry',     val: industry },
        { id: 'automation',   val: automation },
      ].forEach(function (field) {
        const el = document.getElementById(field.id);
        if (!field.val) {
          el.classList.add('error');
          hasError = true;
          el.addEventListener('input', function () { el.classList.remove('error'); }, { once: true });
        }
      });

      if (hasError) {
        const firstError = form.querySelector('.error');
        if (firstError) firstError.focus();
        return;
      }

      // Build the WhatsApp message
      const message =
        'שלום AutoRoy,' + '\n\n' +
        'שמי: ' + name + '\n' +
        'עסק: ' + business + '\n' +
        'טלפון: ' + phone + '\n' +
        'תחום: ' + industry + '\n' +
        'מה אני רוצה לאוטומט: ' + automation + '\n\n' +
        'ראיתי את האתר ואשמח לשוחח.';

      const encoded = encodeURIComponent(message);
      window.open('https://wa.me/972547222023?text=' + encoded, '_blank', 'noopener,noreferrer');

      // Success feedback
      const submitBtn = form.querySelector('[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'הטופס נשלח — פותח וואטסאפ...';
      submitBtn.disabled = true;
      setTimeout(function () {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }, 4000);
    });
  }

  /* ----------------------------------------------------------
     PAGE ENTRANCE — fade in body on load
  ---------------------------------------------------------- */
  if (!prefersReducedMotion) {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    window.addEventListener('load', function () {
      document.body.style.opacity = '1';
    });
  }

  /* ----------------------------------------------------------
     THEME TOGGLE — light / dark mode with localStorage
  ---------------------------------------------------------- */
  const themeToggle = document.getElementById('themeToggle');

  // Apply saved theme before first paint flicker
  if (localStorage.getItem('autoroy-theme') === 'light') {
    document.body.classList.add('light-mode');
    if (themeToggle) themeToggle.setAttribute('aria-label', 'עבור למצב כהה');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      // Inline transition so the switch animates even if page-load inline style is set
      document.body.style.transition = 'background-color 0.4s ease, color 0.4s ease';

      var isLight = document.body.classList.toggle('light-mode');
      localStorage.setItem('autoroy-theme', isLight ? 'light' : 'dark');
      themeToggle.setAttribute('aria-label', isLight ? 'עבור למצב כהה' : 'עבור למצב בהיר');

      // Remove inline transition after switch completes
      setTimeout(function () { document.body.style.transition = ''; }, 500);
    });
  }

  /* ----------------------------------------------------------
     TOAST NOTIFICATION — appears after 40s, once per session
  ---------------------------------------------------------- */
  var toast     = document.getElementById('toastNotif');
  var toastClose = document.getElementById('toastClose');

  if (toast && toastClose && !sessionStorage.getItem('autoroy-toast-seen')) {
    var toastTimer = setTimeout(function () {
      toast.removeAttribute('hidden');
      sessionStorage.setItem('autoroy-toast-seen', '1');
    }, 40000);

    toastClose.addEventListener('click', function () {
      toast.classList.add('hiding');
      setTimeout(function () { toast.setAttribute('hidden', ''); }, 320);
    });

    // Also dismiss if user clicks the CTA inside the toast
    var toastCta = toast.querySelector('.toast-cta');
    if (toastCta) {
      toastCta.addEventListener('click', function () {
        setTimeout(function () { toast.setAttribute('hidden', ''); }, 800);
      });
    }
  }

  /* ----------------------------------------------------------
     SCROLL PROGRESS BAR
  ---------------------------------------------------------- */
  var progressBar = document.getElementById('scrollProgress');
  if (progressBar) {
    function updateProgress() {
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.transform = 'scaleX(' + (docH > 0 ? window.scrollY / docH : 0) + ')';
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  /* ----------------------------------------------------------
     STICKY CTA BAR — appears when hero leaves viewport
  ---------------------------------------------------------- */
  var stickyCta  = document.getElementById('stickyCta');
  var heroSect   = document.getElementById('hero');
  if (stickyCta && heroSect && 'IntersectionObserver' in window) {
    var stickyObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var visible = !entry.isIntersecting;
        stickyCta.classList.toggle('visible', visible);
        stickyCta.setAttribute('aria-hidden', visible ? 'false' : 'true');
      });
    }, { threshold: 0.1 });
    stickyObs.observe(heroSect);
  }

  /* ----------------------------------------------------------
     WHATSAPP TOOLTIP — appears 3s after load, fades out
  ---------------------------------------------------------- */
  var waTooltip = document.getElementById('waTooltip');
  if (waTooltip && !prefersReducedMotion) {
    setTimeout(function () {
      waTooltip.classList.add('visible');
      setTimeout(function () { waTooltip.classList.remove('visible'); }, 4500);
    }, 3000);
  }

  /* ----------------------------------------------------------
     HERO PARTICLES — floating dots in hero background
  ---------------------------------------------------------- */
  if (!prefersReducedMotion) {
    var heroBg = document.querySelector('.hero-bg');
    if (heroBg) {
      var pColors = ['var(--primary)', 'var(--purple)', 'var(--cyan)'];
      for (var pi = 0; pi < 14; pi++) {
        var pt = document.createElement('div');
        pt.className = 'hero-particle';
        pt.style.cssText =
          'left:' + (Math.random() * 100) + '%;' +
          'top:' + (Math.random() * 100) + '%;' +
          'width:' + (Math.random() * 3 + 1.5) + 'px;' +
          'height:' + (Math.random() * 3 + 1.5) + 'px;' +
          'background:' + pColors[Math.floor(Math.random() * 3)] + ';' +
          'animation-duration:' + (Math.random() * 10 + 8) + 's;' +
          'animation-delay:-' + (Math.random() * 14) + 's;';
        heroBg.appendChild(pt);
      }
    }
  }

  /* ----------------------------------------------------------
     ACCESSIBILITY WIDGET
  ---------------------------------------------------------- */
  var a11yToggle = document.getElementById('a11yToggle');
  var a11yPanel  = document.getElementById('a11yPanel');
  var a11yWidget = document.getElementById('a11yWidget');
  var a11yOpen   = false;

  // Font size (4 steps: 14 / 16 / 18 / 20px)
  var fontSizes = [14, 16, 18, 20];
  var fontIdx   = parseInt(localStorage.getItem('autoroy-font') || '1', 10);
  if (fontIdx !== 1) document.documentElement.style.fontSize = fontSizes[fontIdx] + 'px';

  function setFont(idx) {
    fontIdx = Math.max(0, Math.min(fontSizes.length - 1, idx));
    document.documentElement.style.fontSize = fontSizes[fontIdx] + 'px';
    localStorage.setItem('autoroy-font', fontIdx);
  }
  var fDec = document.getElementById('fontDecrease');
  var fRes = document.getElementById('fontReset');
  var fInc = document.getElementById('fontIncrease');
  if (fDec) fDec.addEventListener('click', function () { setFont(fontIdx - 1); });
  if (fRes) fRes.addEventListener('click', function () { setFont(1); });
  if (fInc) fInc.addEventListener('click', function () { setFont(fontIdx + 1); });

  // High contrast
  var cToggle = document.getElementById('contrastToggle');
  var hiCon   = localStorage.getItem('autoroy-contrast') === '1';
  function applyContrast(on) {
    document.body.classList.toggle('high-contrast', on);
    if (cToggle) { cToggle.textContent = on ? 'פעיל' : 'כבוי'; cToggle.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    localStorage.setItem('autoroy-contrast', on ? '1' : '0');
  }
  applyContrast(hiCon);
  if (cToggle) cToggle.addEventListener('click', function () { hiCon = !hiCon; applyContrast(hiCon); });

  // Stop animations
  var aPause  = document.getElementById('animPauseToggle');
  var animOff = localStorage.getItem('autoroy-noanim') === '1';
  function applyAnimPause(on) {
    document.body.classList.toggle('no-animations', on);
    if (aPause) { aPause.textContent = on ? 'פעיל' : 'כבוי'; aPause.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    localStorage.setItem('autoroy-noanim', on ? '1' : '0');
  }
  applyAnimPause(animOff);
  if (aPause) aPause.addEventListener('click', function () { animOff = !animOff; applyAnimPause(animOff); });

  // Panel toggle
  if (a11yToggle && a11yPanel) {
    a11yToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      a11yOpen = !a11yOpen;
      if (a11yOpen) { a11yPanel.removeAttribute('hidden'); } else { a11yPanel.setAttribute('hidden', ''); }
      a11yToggle.setAttribute('aria-expanded', a11yOpen ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (a11yOpen && a11yWidget && !a11yWidget.contains(e.target)) {
        a11yPanel.setAttribute('hidden', ''); a11yToggle.setAttribute('aria-expanded', 'false'); a11yOpen = false;
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && a11yOpen) {
        a11yPanel.setAttribute('hidden', ''); a11yToggle.setAttribute('aria-expanded', 'false');
        a11yOpen = false; a11yToggle.focus();
      }
    });
  }

  /* ----------------------------------------------------------
     ACTIVE NAV LINK — highlight based on scroll position
  ---------------------------------------------------------- */
  const sections  = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

  function updateActiveNav() {
    let current = '';
    const scrollY = window.scrollY + navbar.offsetHeight + 60;

    sections.forEach(function (section) {
      if (section.offsetTop <= scrollY) {
        current = '#' + section.id;
      }
    });

    navAnchors.forEach(function (a) {
      a.style.color = a.getAttribute('href') === current ? 'var(--text)' : '';
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });

})();
