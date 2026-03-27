/**
 * Finish Line Studio — Global JavaScript
 * Handles: AOS scroll animation init, mobile nav toggle
 *
 * No build step. No dependencies beyond AOS CDN (loaded in HTML before this script).
 * ES2022+ syntax is fine — no IE11 support required.
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── Intro Overlay ─────────────────────────────────────────
  const introOverlay = document.getElementById('intro-overlay');

  if (introOverlay) {
    // Skip intro if already played this session
    if (sessionStorage.getItem('introPlayed')) {
      introOverlay.classList.add('intro-overlay--hidden');
    } else {
      // Lock page behind intro
      document.body.classList.add('intro-active');

      introOverlay.addEventListener('click', () => {
        // Prevent double-clicks
        if (introOverlay.dataset.triggered) return;
        introOverlay.dataset.triggered = 'true';

        // Play calming chime via Web Audio API
        playIntroChime();

        // Phase 1-3: zoom animation
        introOverlay.classList.add('intro-overlay--zooming');

        // Phase 4: after zoom completes, fade out overlay & reveal site
        setTimeout(() => {
          introOverlay.classList.add('intro-overlay--fadeout');
          document.body.classList.remove('intro-active');
          document.body.classList.add('intro-revealed');
        }, 3400);

        // Cleanup: fully hide overlay after fade
        setTimeout(() => {
          introOverlay.classList.add('intro-overlay--hidden');
          sessionStorage.setItem('introPlayed', 'true');
        }, 4100);
      });
    }
  }

  /** Synthesize a warm, calming chime — no external audio file needed */
  function playIntroChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();

      // Layer 1: warm fundamental tone
      createTone(ctx, 523.25, 0, 2.0, 0.12);   // C5
      // Layer 2: gentle fifth
      createTone(ctx, 659.25, 0.08, 1.8, 0.07); // E5
      // Layer 3: high shimmer
      createTone(ctx, 783.99, 0.15, 1.5, 0.05); // G5

    } catch (e) {
      // Web Audio not supported — fail silently
    }
  }

  function createTone(ctx, freq, startDelay, duration, volume) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    const now = ctx.currentTime + startDelay;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  // ── Initialize AOS scroll animations ──────────────────────
  // AOS is loaded via CDN in the HTML <head> before this script runs.
  // once: true — elements only animate once (not re-trigger on scroll up)
  AOS.init({
    duration: 700,
    easing: 'ease-out',
    once: true,
    offset: 80
  });

  // ── Mobile navigation toggle ───────────────────────────────
  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav    = document.querySelector('.site-nav');

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close nav when a nav link is clicked (mobile UX)
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        siteNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── Close nav on outside click ─────────────────────────────
  document.addEventListener('click', (e) => {
    if (siteNav && menuToggle &&
        !siteNav.contains(e.target) &&
        !menuToggle.contains(e.target)) {
      siteNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

});
