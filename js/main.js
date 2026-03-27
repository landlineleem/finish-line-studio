/**
 * Finish Line Studio — Global JavaScript
 * Handles: Intro overlay (drone descent onto roof, radial mask reveal into living room),
 *          smooth jazz soundtrack, AOS scroll animations, mobile nav toggle
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── Intro Overlay ─────────────────────────────────────────
  const introOverlay = document.getElementById('intro-overlay');

  if (introOverlay) {
    if (sessionStorage.getItem('introPlayed')) {
      introOverlay.classList.add('intro-overlay--hidden');
    } else {
      document.body.classList.add('intro-active');

      const photo     = document.getElementById('intro-photo');
      const room      = document.getElementById('intro-room');
      const text      = document.getElementById('intro-text');
      const vignette  = document.getElementById('intro-vignette');

      if (photo) photo.classList.add('intro-photo--idle');

      introOverlay.addEventListener('click', () => {
        if (introOverlay.dataset.triggered) return;
        introOverlay.dataset.triggered = 'true';

        // Stop idle drift, set starting position
        if (photo) {
          photo.classList.remove('intro-photo--idle');
          photo.style.transform = 'scale(0.92) translateY(-3%) translateZ(0)';
        }

        const stopJazz = playSmoothJazz();

        // ── Single rAF-driven animation ──
        // Drone descends from elevated view → onto roof → through roof → into living room
        const duration = 5500;
        const start = performance.now();

        function tick(now) {
          const elapsed = now - start;
          const t = Math.min(elapsed / duration, 1);

          // Smooth easing (slow start, smooth middle, gentle landing)
          const ease = cubicBezier(t, 0.25, 0.1, 0.25, 1.0);

          // ── Text + vignette fade (first 12%) ──
          const textFade = 1 - Math.min(t / 0.12, 1);
          if (text)     text.style.opacity = textFade;
          if (vignette) vignette.style.opacity = textFade;

          // ── Drone descent: start pulled back (0.92), descend onto roof ──
          // Scale goes from 0.92 → ~20 (zooming into the roof)
          // translateY goes from -3% → +2% (simulating downward tilt/descent)
          const scale = 0.92 + ease * 22;
          const translateY = -3 + ease * 5;

          if (photo) {
            photo.style.transform = `scale(${scale}) translateY(${translateY}%) translateZ(0)`;
          }

          // ── Roof mask opening ──
          // Between 30%–65%: radial mask opens from the roof center,
          // as if the drone is descending through the roof into the room below
          if (photo) {
            if (t < 0.30) {
              // No mask — full mansion visible
              photo.style.webkitMaskImage = 'none';
              photo.style.maskImage = 'none';
            } else if (t < 0.65) {
              const maskT = (t - 0.30) / 0.35; // 0→1
              // Smooth mask opening with soft edges
              const hole = maskT * 60;
              const edge = hole + 6 + (1 - maskT) * 8; // wider soft edge at start
              const mask = `radial-gradient(ellipse at 50% 25%, transparent ${hole}%, rgba(0,0,0,0.2) ${hole + 2}%, black ${edge}%)`;
              photo.style.webkitMaskImage = mask;
              photo.style.maskImage = mask;
            } else {
              // Fully through — mansion gone
              photo.style.webkitMaskImage = 'radial-gradient(ellipse at 50% 25%, transparent 100%, transparent 100%)';
              photo.style.maskImage = 'radial-gradient(ellipse at 50% 25%, transparent 100%, transparent 100%)';
            }
          }

          // ── Living room reveal ──
          // Starts fading in at 25%, with a descending scale (1.25→1.0)
          // to simulate the drone settling into the room from above
          if (room) {
            if (t < 0.25) {
              room.style.opacity = 0;
              room.style.transform = 'scale(1.25) translateZ(0)';
            } else if (t < 0.75) {
              const roomT = (t - 0.25) / 0.5;
              const roomEase = roomT * roomT * (3 - 2 * roomT); // smoothstep
              room.style.opacity = roomEase;
              const roomScale = 1.25 - roomEase * 0.25;
              room.style.transform = `scale(${roomScale}) translateZ(0)`;
            } else {
              room.style.opacity = 1;
              room.style.transform = 'scale(1) translateZ(0)';
            }
          }

          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            // Fade out overlay, reveal site
            introOverlay.classList.add('intro-overlay--fadeout');
            document.body.classList.remove('intro-active');
            document.body.classList.add('intro-revealed');

            setTimeout(() => {
              introOverlay.classList.add('intro-overlay--hidden');
              sessionStorage.setItem('introPlayed', 'true');
              if (stopJazz) stopJazz();
            }, 900);
          }
        }

        requestAnimationFrame(tick);
      });
    }
  }

  // ── Cubic Bezier easing helper ────────────────────────────
  function cubicBezier(t, x1, y1, x2, y2) {
    // Simple approximation using de Casteljau for CSS-style cubic-bezier
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;

    function sampleX(t) { return ((ax * t + bx) * t + cx) * t; }
    function sampleY(t) { return ((ay * t + by) * t + cy) * t; }

    // Newton-Raphson to find t for given x
    let guessT = t;
    for (let i = 0; i < 8; i++) {
      const currentX = sampleX(guessT) - t;
      if (Math.abs(currentX) < 0.001) break;
      const dx = (3 * ax * guessT + 2 * bx) * guessT + cx;
      if (Math.abs(dx) < 1e-6) break;
      guessT -= currentX / dx;
    }
    return sampleY(guessT);
  }

  // ── Smooth Jazz Synthesizer ───────────────────────────────
  function playSmoothJazz() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.8);
      master.connect(ctx.destination);

      // Reverb
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

      // Rhodes chords
      const chords = [
        [261.63, 329.63, 392.00, 493.88, 587.33],
        [220.00, 261.63, 329.63, 392.00, 493.88],
        [293.66, 349.23, 440.00, 523.25, 659.25],
        [196.00, 246.94, 293.66, 349.23, 440.00],
      ];
      const beatDur = 2.2;
      chords.forEach((chord, ci) => {
        const t0 = now + ci * beatDur;
        chord.forEach((freq, ni) => {
          const osc = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const g = ctx.createGain();
          const g2 = ctx.createGain();
          osc.type = 'sine'; osc.frequency.value = freq;
          osc2.type = 'sine'; osc2.frequency.value = freq * 2.01;
          g2.gain.value = 0.07;
          const vel = ni === 0 ? 0.055 : ni === chord.length - 1 ? 0.045 : 0.03;
          g.gain.setValueAtTime(0, t0);
          g.gain.linearRampToValueAtTime(vel, t0 + 0.05);
          g.gain.exponentialRampToValueAtTime(vel * 0.55, t0 + 0.4);
          g.gain.exponentialRampToValueAtTime(0.001, t0 + beatDur + 0.4);
          osc.connect(g); osc2.connect(g2); g2.connect(g);
          g.connect(convolver); g.connect(dry);
          osc.start(t0); osc.stop(t0 + beatDur + 0.6);
          osc2.start(t0); osc2.stop(t0 + beatDur + 0.6);
        });
      });

      // Walking bass
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
        osc.type = 'triangle'; osc.frequency.value = freq;
        lp.type = 'lowpass'; lp.frequency.value = 380; lp.Q.value = 0.8;
        const t = now + start;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.09, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.05, t + 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.1);
        osc.connect(lp); lp.connect(g); g.connect(convolver); g.connect(dry);
        osc.start(t); osc.stop(t + dur + 0.2);
      });

      // Melody
      const melody = [
        [784.00,1.0,0.8,0.035],[698.46,2.0,0.5,0.025],
        [659.25,2.8,1.0,0.035],[587.33,5.0,0.7,0.03],
        [659.25,5.9,0.5,0.025],[523.25,6.6,1.2,0.035],
        [587.33,8.2,1.5,0.03],
      ];
      melody.forEach(([freq, start, dur, vel]) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        const t = now + start;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vel, t + 0.1);
        g.gain.setValueAtTime(vel * 0.8, t + 0.3);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        const vib = ctx.createOscillator();
        const vibG = ctx.createGain();
        vib.type = 'sine'; vib.frequency.value = 5; vibG.gain.value = 2;
        vib.connect(vibG); vibG.connect(osc.frequency);
        vib.start(t + 0.2); vib.stop(t + dur);
        osc.connect(g); g.connect(convolver); g.connect(dry);
        osc.start(t); osc.stop(t + dur + 0.1);
      });

      // Brushed hi-hat
      const swing = 0.12;
      for (let b = 0; b < 20; b++) {
        const t = now + b * 0.55;
        brush(ctx, t, 0.013, dry);
        if (b % 2 === 0) brush(ctx, t + 0.275 + swing, 0.007, dry);
      }
      function brush(ctx, time, vol, dest) {
        const len = ctx.sampleRate * 0.05;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
        const src = ctx.createBufferSource(); src.buffer = buf;
        const g = ctx.createGain();
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass'; hp.frequency.value = 7000;
        g.gain.setValueAtTime(vol, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
        src.connect(hp); hp.connect(g); g.connect(dest);
        src.start(time);
      }

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

  document.addEventListener('click', (e) => {
    if (siteNav && menuToggle &&
        !siteNav.contains(e.target) &&
        !menuToggle.contains(e.target)) {
      siteNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

});
