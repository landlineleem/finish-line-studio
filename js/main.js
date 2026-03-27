/**
 * Finish Line Studio — Global JavaScript
 * Handles: Intro overlay (photo zoom, smooth jazz), AOS, mobile nav
 *
 * No build step. No dependencies beyond AOS CDN (loaded in HTML before this script).
 * ES2022+ syntax is fine — no IE11 support required.
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── Intro Overlay ─────────────────────────────────────────
  const introOverlay = document.getElementById('intro-overlay');

  if (introOverlay) {
    if (sessionStorage.getItem('introPlayed')) {
      introOverlay.classList.add('intro-overlay--hidden');
    } else {
      document.body.classList.add('intro-active');

      // Start subtle ken burns drift on the photo
      const introPhoto = document.getElementById('intro-photo');
      if (introPhoto) introPhoto.classList.add('intro-photo--idle');

      introOverlay.addEventListener('click', () => {
        if (introOverlay.dataset.triggered) return;
        introOverlay.dataset.triggered = 'true';

        // Stop the idle drift and start zoom
        if (introPhoto) {
          introPhoto.classList.remove('intro-photo--idle');
          // Force a reflow so the browser picks up the new animation
          void introPhoto.offsetHeight;
        }

        // Start smooth jazz soundtrack
        const stopJazz = playSmoothJazz();

        // Trigger zoom animation
        introOverlay.classList.add('intro-overlay--zooming');

        // After zoom completes, fade out overlay and reveal site
        setTimeout(() => {
          introOverlay.classList.add('intro-overlay--fadeout');
          document.body.classList.remove('intro-active');
          document.body.classList.add('intro-revealed');
        }, 3800);

        // Final cleanup
        setTimeout(() => {
          introOverlay.classList.add('intro-overlay--hidden');
          sessionStorage.setItem('introPlayed', 'true');
          if (stopJazz) stopJazz();
        }, 4700);
      });
    }
  }

  // ── Smooth Jazz Synthesizer ───────────────────────────────
  function playSmoothJazz() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.8);
      master.connect(ctx.destination);

      // ── Reverb (convolver with synthetic impulse) ──
      const convolver = ctx.createConvolver();
      const reverbLen = ctx.sampleRate * 2.5;
      const impulse = ctx.createBuffer(2, reverbLen, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = impulse.getChannelData(ch);
        for (let i = 0; i < reverbLen; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 2.8);
        }
      }
      convolver.buffer = impulse;

      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.18;
      convolver.connect(reverbGain);
      reverbGain.connect(master);

      const dry = ctx.createGain();
      dry.gain.value = 0.82;
      dry.connect(master);

      const now = ctx.currentTime;

      // ── Rhodes-style chords (jazz voicings) ──
      const chords = [
        [261.63, 329.63, 392.00, 493.88, 587.33],  // Cmaj9
        [220.00, 261.63, 329.63, 392.00, 493.88],  // Am9
        [293.66, 349.23, 440.00, 523.25, 659.25],  // Dm9
        [196.00, 246.94, 293.66, 349.23, 440.00],  // G13
      ];
      const beatDur = 2.2;

      chords.forEach((chord, ci) => {
        const t0 = now + ci * beatDur;
        chord.forEach((freq, ni) => {
          const osc = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const g = ctx.createGain();
          const g2 = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.value = freq;
          osc2.type = 'sine';
          osc2.frequency.value = freq * 2.01;
          g2.gain.value = 0.07;

          const vel = ni === 0 ? 0.055 : ni === chord.length - 1 ? 0.045 : 0.03;
          g.gain.setValueAtTime(0, t0);
          g.gain.linearRampToValueAtTime(vel, t0 + 0.05);
          g.gain.exponentialRampToValueAtTime(vel * 0.55, t0 + 0.4);
          g.gain.exponentialRampToValueAtTime(0.001, t0 + beatDur + 0.4);

          osc.connect(g);
          osc2.connect(g2);
          g2.connect(g);
          g.connect(convolver);
          g.connect(dry);

          osc.start(t0); osc.stop(t0 + beatDur + 0.6);
          osc2.start(t0); osc2.stop(t0 + beatDur + 0.6);
        });
      });

      // ── Walking bass ──
      const bass = [
        [130.81,0,0.5],[146.83,0.55,0.4],[164.81,1.1,0.5],[174.61,1.65,0.4],
        [110.00,2.2,0.5],[123.47,2.75,0.4],[130.81,3.3,0.5],[146.83,3.85,0.4],
        [146.83,4.4,0.5],[164.81,4.95,0.4],[174.61,5.5,0.5],[196.00,6.05,0.4],
        [98.00,6.6,0.5],[110.00,7.15,0.4],[123.47,7.7,0.6],[130.81,8.3,0.8],
      ];

      bass.forEach(([freq, start, dur]) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const lp = ctx.createBiquadFilter();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        lp.type = 'lowpass';
        lp.frequency.value = 380;
        lp.Q.value = 0.8;
        const t = now + start;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.09, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.05, t + 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.1);
        osc.connect(lp); lp.connect(g);
        g.connect(convolver); g.connect(dry);
        osc.start(t); osc.stop(t + dur + 0.2);
      });

      // ── Melody (sparse, breathy) ──
      const melody = [
        [784.00,1.0,0.8,0.035],[698.46,2.0,0.5,0.025],
        [659.25,2.8,1.0,0.035],[587.33,5.0,0.7,0.03],
        [659.25,5.9,0.5,0.025],[523.25,6.6,1.2,0.035],
        [587.33,8.2,1.5,0.03],
      ];

      melody.forEach(([freq, start, dur, vel]) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = now + start;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vel, t + 0.1);
        g.gain.setValueAtTime(vel * 0.8, t + 0.3);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);

        // Vibrato
        const vib = ctx.createOscillator();
        const vibG = ctx.createGain();
        vib.type = 'sine'; vib.frequency.value = 5; vibG.gain.value = 2;
        vib.connect(vibG); vibG.connect(osc.frequency);
        vib.start(t + 0.2); vib.stop(t + dur);

        osc.connect(g); g.connect(convolver); g.connect(dry);
        osc.start(t); osc.stop(t + dur + 0.1);
      });

      // ── Brushed hi-hat (swing feel) ──
      const swing = 0.12;
      for (let b = 0; b < 18; b++) {
        const t = now + b * 0.55;
        brush(ctx, t, 0.013, dry);
        if (b % 2 === 0) brush(ctx, t + 0.275 + swing, 0.007, dry);
      }

      function brush(ctx, time, vol, dest) {
        const len = ctx.sampleRate * 0.05;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass'; hp.frequency.value = 7000;
        g.gain.setValueAtTime(vol, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
        src.connect(hp); hp.connect(g); g.connect(dest);
        src.start(time);
      }

      // Return fade-out function
      return () => {
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
        setTimeout(() => ctx.close(), 2500);
      };
    } catch (e) {
      return null;
    }
  }

  // ── Initialize AOS scroll animations ──────────────────────
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
