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

  // Observe the stats card
  const statsCard = document.querySelector('.stats-card');
  if (statsCard && 'IntersectionObserver' in window) {
    let countersTriggered = false;
    const counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !countersTriggered) {
          countersTriggered = true;
          document.querySelectorAll('.stat-num').forEach(animateCounter);
          animateStatsBar();
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counterObserver.observe(statsCard);
  } else if (statsCard) {
    // Fallback: animate on load
    document.querySelectorAll('.stat-num').forEach(animateCounter);
    animateStatsBar();
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
