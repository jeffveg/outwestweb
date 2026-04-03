/**
 * Out West Glow Golf — Main JavaScript
 *
 * Sections:
 *  1. Navigation (sticky, hamburger, active link)
 *  2. Phone Number Protection (anti-scraping)
 *  3. Slideshow
 *  4. Email Signup Form
 *  5. Contact Form (AJAX submission)
 *  6. Scroll animations
 */

(function () {
  'use strict';

  /* ───────────────────────────────────────────────
     1. NAVIGATION
     ─────────────────────────────────────────────── */
  const nav         = document.querySelector('.nav');
  const hamburger   = document.querySelector('.nav__hamburger');
  const mobileMenu  = document.querySelector('.nav__mobile');

  // Sticky nav — add .scrolled class after scrolling 20px
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Hamburger toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close mobile menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !mobileMenu.contains(e.target)) {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  // Mark active nav link based on current page
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a, .nav__mobile a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === currentPath || (currentPath === '' && href === 'index.html'))) {
      link.classList.add('active');
    }
  });

  /* ───────────────────────────────────────────────
     2. PHONE NUMBER PROTECTION
     Anti-scraping: phone is base64-encoded in HTML
     data-p attribute and decoded here at runtime.
     Automated scrapers that don't execute JS will
     not retrieve the real phone number.
     ─────────────────────────────────────────────── */
  function decodePhone(encoded) {
    try {
      return atob(encoded);
    } catch (e) {
      return null;
    }
  }

  function formatPhoneDisplay(digits) {
    // Expects "6234007775" → "(623) 400-7775"
    const d = digits.replace(/\D/g, '');
    if (d.length === 10) {
      return '(' + d.slice(0,3) + ') ' + d.slice(3,6) + '-' + d.slice(6);
    }
    return digits;
  }

  document.querySelectorAll('[data-p]').forEach(el => {
    const decoded = decodePhone(el.dataset.p);
    if (!decoded) return;

    const digitsOnly = decoded.replace(/\D/g, '');
    el.href        = 'tel:+1' + digitsOnly;
    el.textContent = formatPhoneDisplay(decoded);
    el.removeAttribute('data-p'); // Remove after use
  });

  /* ───────────────────────────────────────────────
     3. SLIDESHOW
     ─────────────────────────────────────────────── */
  document.querySelectorAll('.slideshow').forEach(slideshow => {
    const track  = slideshow.querySelector('.slideshow__track');
    const slides = slideshow.querySelectorAll('.slideshow__slide');
    const dots   = slideshow.querySelectorAll('.slideshow__dot');
    const prevBtn = slideshow.querySelector('.slideshow__btn--prev');
    const nextBtn = slideshow.querySelector('.slideshow__btn--next');

    if (!track || slides.length < 2) return;

    let current = 0;
    let timer   = null;

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
    }

    function startAuto() {
      timer = setInterval(() => goTo(current + 1), 5000);
    }

    function stopAuto() {
      clearInterval(timer);
    }

    if (prevBtn) prevBtn.addEventListener('click', () => { stopAuto(); goTo(current - 1); startAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { stopAuto(); goTo(current + 1); startAuto(); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { stopAuto(); goTo(i); startAuto(); }));

    // Pause on hover
    slideshow.addEventListener('mouseenter', stopAuto);
    slideshow.addEventListener('mouseleave', startAuto);

    // Touch swipe
    let touchStartX = 0;
    slideshow.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    slideshow.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        stopAuto();
        goTo(diff > 0 ? current + 1 : current - 1);
        startAuto();
      }
    });

    goTo(0);
    startAuto();
  });

  /* ───────────────────────────────────────────────
     4. EMAIL SIGNUP (hero / CTA sections)
     ─────────────────────────────────────────────── */
  document.querySelectorAll('.email-signup').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input  = form.querySelector('.email-signup__input');
      const btn    = form.querySelector('.email-signup__btn');
      const email  = input ? input.value.trim() : '';

      if (!email || !email.includes('@')) {
        input && input.focus();
        return;
      }

      // Disable while "submitting"
      if (btn) btn.textContent = 'Joining...';
      if (btn) btn.disabled = true;

      // TODO: Replace this with your actual email list service endpoint
      // e.g., Mailchimp, ConvertKit, EmailOctopus, etc.
      // For now, simulate success after a short delay.
      setTimeout(() => {
        form.innerHTML = '<p style="color:var(--brand-accent);font-family:var(--font-display);font-weight:700;font-size:1.1rem;">You\'re on the list! We\'ll be in touch before we open.</p>';
      }, 600);
    });
  });

  /* ───────────────────────────────────────────────
     5. CONTACT FORM (AJAX)
     ─────────────────────────────────────────────── */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const statusEl  = document.getElementById('form-status');
      const submitBtn = contactForm.querySelector('[type="submit"]');

      // Hide previous status
      if (statusEl) {
        statusEl.className = 'form-status';
        statusEl.textContent = '';
      }

      // Check honeypot
      const honeypot = contactForm.querySelector('.form-honeypot input');
      if (honeypot && honeypot.value) {
        // Bot detected — silently succeed from bot's perspective
        if (statusEl) {
          statusEl.textContent = 'Thank you! Your message has been sent.';
          statusEl.className   = 'form-status success';
        }
        return;
      }

      // Disable submit
      const originalText = submitBtn ? submitBtn.textContent : 'Send';
      if (submitBtn) {
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled    = true;
      }

      try {
        const formData = new FormData(contactForm);
        const response = await fetch('php/contact.php', {
          method: 'POST',
          body:   formData,
        });

        const data = await response.json();

        if (data.success) {
          contactForm.reset();
          if (statusEl) {
            statusEl.textContent = data.message || 'Thank you! We\'ll be in touch soon.';
            statusEl.className   = 'form-status success';
          }
        } else {
          throw new Error(data.message || 'Something went wrong.');
        }
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = err.message || 'There was a problem sending your message. Please try calling us directly.';
          statusEl.className   = 'form-status error';
        }
      } finally {
        if (submitBtn) {
          submitBtn.textContent = originalText;
          submitBtn.disabled    = false;
        }
      }
    });
  }

  /* ───────────────────────────────────────────────
     6. SCROLL ANIMATIONS
     Elements with class .reveal animate in when
     they enter the viewport.
     ─────────────────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));
  } else {
    // Fallback: just show everything
    revealEls.forEach(el => el.classList.add('revealed'));
  }

})();
