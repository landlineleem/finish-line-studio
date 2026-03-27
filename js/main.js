/**
 * Finish Line Studio — Global JavaScript
 * Handles: Intro overlay (particles, smooth jazz, zoom), AOS, mobile nav
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
      initParticles();

      introOverlay.addEventListener('click', () => {
        if (introOverlay.dataset.triggered) return;
        introOverlay.dataset.triggered = 'true';

        // Start smooth jazz
        const stopJazz = playSmoothJazz();

        // Start zoom animation
        introOverlay.classList.add('intro-overlay--zooming');

        // After zoom, fade out overlay and reveal site
        setTimeout(() => {
          introOverlay.classList.add('intro-overlay--fadeout');
          document.body.classList.remove('intro-active');
          document.body.classList.add('intro-revealed');
        }, 3600);

        // Cleanup: hide overlay, fade out music
        setTimeout(() => {
          introOverlay.classList.add('intro-overlay--hidden');
          sessionStorage.setItem('introPlayed', 'true');
          if (stopJazz) stopJazz();
        }, 4500);
      });
    }
  }

  // ── Floating Particles ────────────────────────────────────
  function initParticles() {
    const canvas = document.getElementById('intro-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Create particles (warm firefly-like dots)
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.2 - 0.1,
        opacity: Math.random() * 0.5 + 0.1,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.005
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        p.pulse += p.pulseSpeed;

        // Wrap around
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        const alpha = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));

        // Warm gold glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196, 168, 130, ${alpha * 0.15})`;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(250, 248, 245, ${alpha})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    // Stop when overlay is hidden
    const observer = new MutationObserver(() => {
      if (introOverlay.classList.contains('intro-overlay--hidden')) {
        cancelAnimationFrame(animId);
        observer.disconnect();
      }
    });
    observer.observe(introOverlay, { attributes: true, attributeFilter: ['class'] });
  }

  // ── Smooth Jazz Synthesizer ───────────────────────────────
  function playSmoothJazz() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.5);
      masterGain.connect(ctx.destination);

      // Reverb via convolver (simple impulse)
      const convolver = ctx.createConvolver();
      const reverbLen = ctx.sampleRate * 2;
      const impulse = ctx.createBuffer(2, reverbLen, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = 0; i < reverbLen; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 2.5);
        }
      }
      convolver.buffer = impulse;

      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.15;
      convolver.connect(reverbGain);
      reverbGain.connect(masterGain);

      const dryGain = ctx.createGain();
      dryGain.gain.value = 0.85;
      dryGain.connect(masterGain);

      // ── Rhodes-style electric piano pad ──
      // Jazz chord voicings: Cmaj9 → Am9 → Dm9 → G13
      const chords = [
        [261.63, 329.63, 392.00, 493.88, 587.33],  // Cmaj9: C4 E4 G4 B4 D5
        [220.00, 261.63, 329.63, 392.00, 493.88],  // Am9: A3 C4 E4 G4 B4
        [293.66, 349.23, 440.00, 523.25, 659.25],  // Dm9: D4 F4 A4 C5 E5
        [196.00, 246.94, 293.66, 349.23, 440.00],  // G13: G3 B3 D4 F4 A4
      ];

      const beatDur = 2.2; // seconds per chord
      const now = ctx.currentTime;

      chords.forEach((chord, ci) => {
        const chordStart = now + ci * beatDur;
        chord.forEach((freq, ni) => {
          // Rhodes = sine + slight overtone, with bell-like attack
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const noteGain = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.value = freq;
          osc2.type = 'sine';
          osc2.frequency.value = freq * 2.01; // slight detuned overtone
          const osc2gain = ctx.createGain();
          osc2gain.gain.value = 0.08; // subtle bell character

          // Velocity: inner voices quieter
          const vel = ni === 0 ? 0.06 : ni === chord.length - 1 ? 0.05 : 0.035;

          // Soft attack, gentle decay into sustain
          noteGain.gain.setValueAtTime(0, chordStart);
          noteGain.gain.linearRampToValueAtTime(vel, chordStart + 0.06);
          noteGain.gain.exponentialRampToValueAtTime(vel * 0.6, chordStart + 0.4);
          noteGain.gain.exponentialRampToValueAtTime(0.001, chordStart + beatDur + 0.3);

          osc1.connect(noteGain);
          osc2.connect(osc2gain);
          osc2gain.connect(noteGain);
          noteGain.connect(convolver);
          noteGain.connect(dryGain);

          osc1.start(chordStart);
          osc1.stop(chordStart + beatDur + 0.5);
          osc2.start(chordStart);
          osc2.stop(chordStart + beatDur + 0.5);
        });
      });

      // ── Walking bass line ──
      const bassNotes = [
        // Each: [freq, startBeat (relative), duration]
        [130.81, 0, 0.5],     // C3
        [146.83, 0.55, 0.4],  // D3
        [164.81, 1.1, 0.5],   // E3
        [174.61, 1.65, 0.4],  // F3 (walk up)
        [110.00, 2.2, 0.5],   // A2
        [123.47, 2.75, 0.4],  // B2
        [130.81, 3.3, 0.5],   // C3
        [146.83, 3.85, 0.4],  // D3
        [146.83, 4.4, 0.5],   // D3
        [164.81, 4.95, 0.4],  // E3
        [174.61, 5.5, 0.5],   // F3
        [196.00, 6.05, 0.4],  // G3
        [98.00, 6.6, 0.5],    // G2
        [110.00, 7.15, 0.4],  // A2
        [123.47, 7.7, 0.6],   // B2
        [130.81, 8.3, 0.8],   // C3 (resolve)
      ];

      bassNotes.forEach(([freq, start, dur]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        // Warm, round bass sound
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        filter.Q.value = 1;

        const t = now + start;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.06, t + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.1);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(convolver);
        gain.connect(dryGain);

        osc.start(t);
        osc.stop(t + dur + 0.2);
      });

      // ── Gentle melody (soprano, sparse) ──
      const melodyNotes = [
        // [freq, start, duration, velocity]
        [784.00, 1.0, 0.8, 0.04],   // G5
        [698.46, 2.0, 0.5, 0.03],   // F5
        [659.25, 2.8, 1.0, 0.04],   // E5
        [587.33, 5.0, 0.7, 0.035],  // D5
        [659.25, 5.9, 0.5, 0.03],   // E5
        [523.25, 6.6, 1.2, 0.04],   // C5
        [587.33, 8.2, 1.5, 0.035],  // D5 (resolve)
      ];

      melodyNotes.forEach(([freq, start, dur, vel]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        // Gentle, breathy attack
        const t = now + start;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vel, t + 0.1);
        gain.gain.setValueAtTime(vel * 0.85, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        // Slight vibrato
        const vibrato = ctx.createOscillator();
        const vibratoGain = ctx.createGain();
        vibrato.type = 'sine';
        vibrato.frequency.value = 5;
        vibratoGain.gain.value = 2;
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        vibrato.start(t + 0.2);
        vibrato.stop(t + dur);

        osc.connect(gain);
        gain.connect(convolver);
        gain.connect(dryGain);

        osc.start(t);
        osc.stop(t + dur + 0.1);
      });

      // ── Soft brush/hi-hat rhythm ──
      function playBrush(time, vol) {
        const bufferSize = ctx.sampleRate * 0.06;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 6000;
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(dryGain);
        src.start(time);
      }

      // Swing eighth-note pattern
      const swingOffset = 0.12;
      for (let beat = 0; beat < 18; beat++) {
        const t = now + beat * 0.55;
        playBrush(t, 0.015);
        if (beat % 2 === 0) {
          playBrush(t + 0.275 + swingOffset, 0.008); // swung upbeat
        }
      }

      // Return a fade-out function
      return () => {
        masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
        setTimeout(() => ctx.close(), 2000);
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
