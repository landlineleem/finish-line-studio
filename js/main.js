/**
 * Finish Line Studio — Global JavaScript
 * Handles: AOS scroll animation init, mobile nav toggle
 *
 * No build step. No dependencies beyond AOS CDN (loaded in HTML before this script).
 * ES2022+ syntax is fine — no IE11 support required.
 */

document.addEventListener('DOMContentLoaded', () => {

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
