/**
 * Ghibli 4-Seasons Morphing Canvas Engine (Day / Night & 30/70 Split Composition)
 * 
 * Hand-painted 2D Anime aesthetic inspired by Studio Ghibli.
 * Features:
 * - Full-screen background canvas with left ~30% focal point (sacred tree, lake, fauna, person).
 * - Light Mode: Person sitting by the lake peacefully fishing with bamboo rod & floating bobber.
 * - Dark Mode: Cozy night atmosphere with twinkling stars, glowing moon, and person sitting by a crackling campfire of branches with glowing embers!
 * - Fast, buttery-smooth timelapse morphing between the 4 seasons as the user scrolls.
 * - 100% PURE VISUALS: Zero text or watermarks on the painting.
 * - High-DPR Retina 2x rendering for razor-sharp anime graphics.
 * - Living Fauna: Animated deer (ear twitch, breathing) and rabbit (nose twitch, hop).
 * - Seasonal weather particles: Sakura petals, Sun motes, Momiji leaves, Snowflakes.
 */

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function parseColor(c) {
  if (!c) return [0, 0, 0, 1];
  if (Array.isArray(c)) return c;
  c = String(c).trim();
  if (c.startsWith('#')) {
    let hex = c.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(x => x + x).join('');
    }
    const num = parseInt(hex, 16);
    if (isNaN(num)) return [0, 0, 0, 1];
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 1];
  }
  const m = c.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (m) {
    return [
      parseInt(m[1], 10),
      parseInt(m[2], 10),
      parseInt(m[3], 10),
      m[4] !== undefined ? parseFloat(m[4]) : 1
    ];
  }
  return [0, 0, 0, 1];
}

function lerpColor(cA, cB, t) {
  const a = parseColor(cA);
  const b = parseColor(cB);
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bl = Math.round(lerp(a[2], b[2], t));
  return `rgb(${r},${g},${bl})`;
}

function lerpColorRgba(cA, cB, t, alpha = 1) {
  const a = parseColor(cA);
  const b = parseColor(cB);
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bl = Math.round(lerp(a[2], b[2], t));
  return `rgba(${r},${g},${bl},${alpha})`;
}

// ============================================================================
// 1. PROCEDURAL WEB AUDIO ENGINE (Offline, Zero-Dependency)
// ============================================================================
export class GhibliAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.currentSeason = 0;
    this.birdTimer = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupAtmosphere();
      this.startBirdLoop();
    } catch (e) {
      console.warn('Web Audio not supported', e);
    }
  }

  setupAtmosphere() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.11;
    }

    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = noiseBuffer;
    this.noiseSource.loop = true;

    this.ambFilter = this.ctx.createBiquadFilter();
    this.ambFilter.type = 'bandpass';
    this.ambFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.ambFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.ambGain = this.ctx.createGain();
    this.ambGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    this.noiseSource.connect(this.ambFilter);
    this.ambFilter.connect(this.ambGain);
    this.ambGain.connect(this.masterGain);

    this.noiseSource.start(0);
  }

  setMute(mute) {
    this.isMuted = mute;
    if (!this.ctx) {
      if (!mute) this.init();
      else return;
    }
    if (this.ctx.state === 'suspended' && !mute) {
      this.ctx.resume();
    }
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.4, t, 0.2);
  }

  setSeason(seasonIdx) {
    this.currentSeason = seasonIdx;
    if (!this.ctx || !this.ambFilter) return;
    const t = this.ctx.currentTime;
    const freqs = [550, 900, 400, 750];
    const qVals = [1.8, 3.2, 1.4, 2.8];
    const targetFreq = freqs[Math.min(3, Math.max(0, Math.floor(seasonIdx)))];
    const targetQ = qVals[Math.min(3, Math.max(0, Math.floor(seasonIdx)))];
    this.ambFilter.frequency.setTargetAtTime(targetFreq, t, 0.5);
    this.ambFilter.Q.setTargetAtTime(targetQ, t, 0.5);
  }

  startBirdLoop() {
    const playChirp = () => {
      if (!this.isMuted && this.ctx && this.currentSeason < 1.5) {
        this.playBirdChirp();
      }
      const nextTime = 2500 + Math.random() * 4500;
      this.birdTimer = setTimeout(playChirp, nextTime);
    };
    this.birdTimer = setTimeout(playChirp, 3000);
  }

  playBirdChirp() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 2200 + Math.random() * 800;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + 600, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq - 200, t + 0.16);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  destroy() {
    clearTimeout(this.birdTimer);
    if (this.ctx) {
      try { this.ctx.close(); } catch (_) {}
    }
  }
}

// ============================================================================
// 2. GHIBLI 4-SEASONS FULL BACKGROUND CANVAS ENGINE
// ============================================================================
export class GhibliSeasonsCanvas {
  constructor(canvasId = 'ghibli-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.audio = new GhibliAudioEngine();

    this.seasonProgress = 0.0;
    this.targetSeasonProgress = 0.0;

    // Dark mode transition factor (0.0 = Light/Day -> 1.0 = Dark/Night)
    const isDark = document.documentElement.classList.contains('dark');
    this.darkFactor = isDark ? 1.0 : 0.0;
    this.targetDarkFactor = isDark ? 1.0 : 0.0;

    this.dpr = 1;
    this.width = 0;
    this.height = 0;
    this.isRunning = true;

    // Animals and campfire embers
    this.initFauna();
    this.initParticles();
    this.initNightStars();
    this.initCampfireEmbers();

    // Palettes configuration
    this.initPalettes();

    this.handleResize();
    this.setupEvents();
    this.animate();
  }

  initPalettes() {
    // 4 Seasons Daylight Palettes
    this.seasonsDay = [
      {
        skyTop: '#2563eb',
        skyMid: '#60a5fa',
        skyBottom: '#fef9c3',
        cloudColor: '#ffffff',
        mountainFar: '#5d7699',
        mountainNear: '#2d8659',
        forestDeep: '#059669',
        trunkColor: '#451a03',
        foliagePrimary: '#f472b6',
        foliageSecondary: '#fda4af',
        foliageHighlight: '#fff1f2',
        lakeTop: '#06b6d4',
        lakeBottom: '#0891b2',
        lakeHighlight: '#a5f3fc',
        grassFar: '#65a30d',
        grassNear: '#84cc16',
        deerCoat: '#9a3412',
        rabbitFur: '#ffffff',
        particleColor: '#fbcfe8'
      },
      {
        skyTop: '#1d4ed8',
        skyMid: '#3b82f6',
        skyBottom: '#dbeafe',
        cloudColor: '#ffffff',
        mountainFar: '#1d428a',
        mountainNear: '#15803d',
        forestDeep: '#065f46',
        trunkColor: '#2e1908',
        foliagePrimary: '#15803d',
        foliageSecondary: '#22c55e',
        foliageHighlight: '#86efac',
        lakeTop: '#0284c7',
        lakeBottom: '#0369a1',
        lakeHighlight: '#7dd3fc',
        grassFar: '#166534',
        grassNear: '#15803d',
        deerCoat: '#854d0e',
        rabbitFur: '#ffffff',
        particleColor: '#fde047'
      },
      {
        skyTop: '#7c2d12',
        skyMid: '#ea580c',
        skyBottom: '#fde047',
        cloudColor: '#ffedd5',
        mountainFar: '#581c87',
        mountainNear: '#b45309',
        forestDeep: '#78350f',
        trunkColor: '#261204',
        foliagePrimary: '#dc2626',
        foliageSecondary: '#ea580c',
        foliageHighlight: '#fbbf24',
        lakeTop: '#0284c7',
        lakeBottom: '#0c4a6e',
        lakeHighlight: '#bae6fd',
        grassFar: '#b45309',
        grassNear: '#d97706',
        deerCoat: '#78350f',
        rabbitFur: '#ffffff',
        particleColor: '#f97316'
      },
      {
        skyTop: '#1e293b',
        skyMid: '#64748b',
        skyBottom: '#cbd5e1',
        cloudColor: '#f1f5f9',
        mountainFar: '#334155',
        mountainNear: '#64748b',
        forestDeep: '#1e293b',
        trunkColor: '#18181b',
        foliagePrimary: '#f8fafc',
        foliageSecondary: '#e2e8f0',
        foliageHighlight: '#ffffff',
        lakeTop: '#e0f2fe',
        lakeBottom: '#38bdf8',
        lakeHighlight: '#ffffff',
        grassFar: '#cbd5e1',
        grassNear: '#f8fafc',
        deerCoat: '#854d0e',
        rabbitFur: '#ffffff',
        particleColor: '#ffffff'
      }
    ];

    // 4 Seasons Night Palettes (Dark mode - cool black-gray / dark charcoal slate tones like Image 3 & 4)
    this.seasonsNight = [
      {
        // Spring Night
        skyTop: '#04060a',
        skyMid: '#0a101a',
        skyBottom: '#131b28',
        cloudColor: '#172233',
        mountainFar: '#090e18',
        mountainNear: '#101724',
        forestDeep: '#0b121b',
        trunkColor: '#151311',
        foliagePrimary: '#1b2330',
        foliageSecondary: '#242e3f',
        foliageHighlight: '#333f54',
        lakeTop: '#09111c',
        lakeBottom: '#0d1827',
        lakeHighlight: '#38bdf8',
        grassFar: '#101826',
        grassNear: '#162032',
        deerCoat: '#7c2d12',
        rabbitFur: '#f8fafc',
        particleColor: '#fbcfe8'
      },
      {
        // Summer Night (Deep Pine Forest Camp Vibe - Image 4)
        skyTop: '#03060c',
        skyMid: '#08111d',
        skyBottom: '#101e2e',
        cloudColor: '#152538',
        mountainFar: '#070f1a',
        mountainNear: '#0c1a27',
        forestDeep: '#08131d',
        trunkColor: '#161311',
        foliagePrimary: '#142433',
        foliageSecondary: '#1d3244',
        foliageHighlight: '#29455d',
        lakeTop: '#081422',
        lakeBottom: '#0c1c2e',
        lakeHighlight: '#38bdf8',
        grassFar: '#0d1a27',
        grassNear: '#132333',
        deerCoat: '#78350f',
        rabbitFur: '#f8fafc',
        particleColor: '#fef08a'
      },
      {
        // Autumn Night
        skyTop: '#060507',
        skyMid: '#100d15',
        skyBottom: '#1a1421',
        cloudColor: '#201828',
        mountainFar: '#0c0a11',
        mountainNear: '#15111d',
        forestDeep: '#0c0a12',
        trunkColor: '#161311',
        foliagePrimary: '#201b2a',
        foliageSecondary: '#2b2337',
        foliageHighlight: '#3d324c',
        lakeTop: '#0d0a15',
        lakeBottom: '#130f1d',
        lakeHighlight: '#fbbf24',
        grassFar: '#14101e',
        grassNear: '#1c1729',
        deerCoat: '#713f12',
        rabbitFur: '#f8fafc',
        particleColor: '#f97316'
      },
      {
        // Winter Night
        skyTop: '#020408',
        skyMid: '#070b13',
        skyBottom: '#0e1420',
        cloudColor: '#141d2e',
        mountainFar: '#060910',
        mountainNear: '#0c121c',
        forestDeep: '#060a12',
        trunkColor: '#111215',
        foliagePrimary: '#171e2c',
        foliageSecondary: '#202a3d',
        foliageHighlight: '#303d54',
        lakeTop: '#060d17',
        lakeBottom: '#0a1423',
        lakeHighlight: '#e0f2fe',
        grassFar: '#111724',
        grassNear: '#182132',
        deerCoat: '#78350f',
        rabbitFur: '#f8fafc',
        particleColor: '#ffffff'
      }
    ];
  }

  initFauna() {
    this.deer = {
      xRatio: 0.26,
      yRatio: 0.77,
      isPerked: false,
      perkTimer: null
    };

    this.rabbit = {
      xRatio: 0.08,
      yRatio: 0.81,
      isBouncing: false,
      bounceTimer: null
    };

    this.person = {
      xRatio: 0.125,
      yRatio: 0.745
    };

    // 10-second dynamic fishing cast cycle & blue water coordinates
    this.fishing = {
      currentXRatio: 0.155,
      currentYRatio: 0.705,
      targetXRatio: 0.155,
      targetYRatio: 0.705,
      startXRatio: 0.155,
      startYRatio: 0.705,
      lastCastCycle: -1,
      splashRipples: []
    };
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        size: 2.2 + Math.random() * 4.0,
        speedX: 0.0003 + Math.random() * 0.0006,
        speedY: 0.0004 + Math.random() * 0.0009,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.035,
        swayAmp: 0.001 + Math.random() * 0.002,
        swayFreq: 1 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  initNightStars() {
    this.stars = [];
    for (let i = 0; i < 70; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random() * 0.55,
        radius: 0.8 + Math.random() * 1.6,
        blinkSpeed: 0.8 + Math.random() * 2.0,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  initCampfireEmbers() {
    this.embers = [];
    for (let i = 0; i < 18; i++) {
      this.embers.push({
        x: 0,
        y: 0,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -1.2 - Math.random() * 1.8,
        life: Math.random(),
        size: 1.2 + Math.random() * 2.2
      });
    }
  }

  handleResize() {
    if (!this.canvas) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  setupEvents() {
    window.addEventListener('resize', () => this.handleResize());

    window.addEventListener('themeChanged', (e) => {
      this.targetDarkFactor = e.detail.isDark ? 1.0 : 0.0;
    });

    const checkDark = () => {
      const isDark = document.documentElement.classList.contains('dark');
      this.targetDarkFactor = isDark ? 1.0 : 0.0;
    };
    window.addEventListener('storage', checkDark);

    if (this.canvas) {
      this.canvas.addEventListener('click', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const W = this.width;
        const H = this.height;
        const cx = W * 0.22;
        const lakeRadius = Math.min(W * 0.17, H * 0.26);
        
        const deerX = cx + lakeRadius * 0.75;
        const deerY = H * 0.70;
        const rabX = cx - lakeRadius * 0.72;
        const rabY = H * 0.72;
        
        const distDeer = Math.hypot(x - deerX, y - deerY);
        const distRab = Math.hypot(x - rabX, y - rabY);
        
        if (distDeer < 65) {
          window.dispatchEvent(new CustomEvent('ghibliAnimalClick', { detail: { animal: 'deer' } }));
        } else if (distRab < 55) {
          window.dispatchEvent(new CustomEvent('ghibliAnimalClick', { detail: { animal: 'rabbit' } }));
        }
      });
    }
  }

  setSeasonProgress(progress) {
    this.targetSeasonProgress = Math.max(0, Math.min(3, progress));
  }

  toggleAudio() {
    return this.audio.isMuted;
  }

  sampleColor(prop) {
    const p = Math.max(0, Math.min(3, this.seasonProgress));
    const idx1 = Math.floor(p);
    const idx2 = Math.min(3, idx1 + 1);
    const t = p - idx1;

    const dayColor = lerpColor(this.seasonsDay[idx1][prop], this.seasonsDay[idx2][prop], t);
    const nightColor = lerpColor(this.seasonsNight[idx1][prop], this.seasonsNight[idx2][prop], t);

    return lerpColor(dayColor, nightColor, this.darkFactor);
  }

  sampleColorRgba(prop, alpha = 1) {
    const p = Math.max(0, Math.min(3, this.seasonProgress));
    const idx1 = Math.floor(p);
    const idx2 = Math.min(3, idx1 + 1);
    const t = p - idx1;

    const dayColor = lerpColorRgba(this.seasonsDay[idx1][prop], this.seasonsDay[idx2][prop], t, alpha);
    const nightColor = lerpColorRgba(this.seasonsNight[idx1][prop], this.seasonsNight[idx2][prop], t, alpha);

    return lerpColorRgba(dayColor, nightColor, this.darkFactor, alpha);
  }

  // ==========================================================================
  // RENDER PIPELINE
  // ==========================================================================
  render(time) {
    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;

    // Fast, buttery-smooth timelapse scrub
    this.seasonProgress += (this.targetSeasonProgress - this.seasonProgress) * 0.18;
    this.darkFactor += (this.targetDarkFactor - this.darkFactor) * 0.09;
    this.audio.setSeason(this.seasonProgress);

    ctx.clearRect(0, 0, W, H);

    // 1. SKY & CELESTIAL
    this.drawSky(ctx, W, H, time);
    if (this.darkFactor > 0.08) {
      this.drawStarsAndMoon(ctx, W, H, time);
    }
    this.drawClouds(ctx, W, H, time);

    // 2. MOUNTAINS & CANOPY
    this.drawMountains(ctx, W, H);
    this.drawFramingForest(ctx, W, H, time);

    // 3. SACRED LAKE & ISLAND WITH SACRED TREE (Framed left ~30%)
    this.drawLake(ctx, W, H, time);
    this.drawIslandAndTree(ctx, W, H, time);

    // 4. SHORELINE MEADOW
    this.drawShoreline(ctx, W, H, time);

    // 5. PERSON (FISHING IN LIGHT MODE / CAMPFIRE IN DARK MODE)
    if (this.darkFactor < 0.85) {
      this.drawPersonFishing(ctx, W, H, time, 1.0 - this.darkFactor);
    }
    if (this.darkFactor > 0.15) {
      this.drawPersonCampfire(ctx, W, H, time, this.darkFactor);
    }

    // 6. FAUNA (DEER & RABBIT)
    this.drawDeer(ctx, W, H, time);
    this.drawRabbit(ctx, W, H, time);

    // 7. SEASONAL WEATHER PARTICLES (Sakura, Sunbeams, Momiji, Snow)
    this.drawWeatherParticles(ctx, W, H, time);

    // 8. RIGHT-SIDE GRADIENT SHIELD (Smoothly ensures portfolio content readability)
    this.drawRightGradientShield(ctx, W, H);
  }

  // 1. SKY GRADIENT
  drawSky(ctx, W, H, time) {
    const skyTop = this.sampleColor('skyTop');
    const skyMid = this.sampleColor('skyMid');
    const skyBottom = this.sampleColor('skyBottom');

    const grad = ctx.createLinearGradient(0, 0, 0, H * 0.78);
    grad.addColorStop(0, skyTop);
    grad.addColorStop(0.55, skyMid);
    grad.addColorStop(1, skyBottom);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // 1.1 STARS AND GLOWING MOON IN DARK MODE
  drawStarsAndMoon(ctx, W, H, time) {
    ctx.save();
    ctx.globalAlpha = Math.min(1.0, this.darkFactor);

    // Twinkling Stars
    this.stars.forEach(st => {
      const flicker = 0.4 + Math.sin(time * 0.002 * st.blinkSpeed + st.phase) * 0.4;
      ctx.fillStyle = `rgba(255, 255, 255, ${flicker})`;
      ctx.beginPath();
      ctx.arc(st.x * W, st.y * H, st.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Glowing Moon (over the mountains on the left/mid-left)
    const moonX = W * 0.24;
    const moonY = H * 0.18;
    const moonRadius = 24;

    // Outer moon glow
    const moonGlow = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.5, moonX, moonY, moonRadius * 3.5);
    moonGlow.addColorStop(0, 'rgba(254, 243, 199, 0.45)');
    moonGlow.addColorStop(0.5, 'rgba(254, 243, 199, 0.12)');
    moonGlow.addColorStop(1, 'rgba(254, 243, 199, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Crescent Moon body
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();

    // Shadow cutout for crescent
    ctx.fillStyle = this.sampleColor('skyTop');
    ctx.beginPath();
    ctx.arc(moonX + 9, moonY - 5, moonRadius * 0.95, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 1.2 GHIBLI CUMULUS CLOUDS (Billowing anime clouds drifting across the full panoramic sky)
  drawClouds(ctx, W, H, time) {
    const cloudColor = this.sampleColor('cloudColor');
    const cloudBase = this.sampleColorRgba('cloudColor', 0.40);
    
    // Multiple cloud tiers drifting across the vast horizon
    const clouds = [
      { x: ((time * 0.008) % (W + 280)) - 140, y: H * 0.13, scale: 1.15 },
      { x: ((time * 0.005 + 240) % (W + 320)) - 160, y: H * 0.08, scale: 1.35 },
      { x: ((time * 0.010 + 500) % (W + 260)) - 130, y: H * 0.19, scale: 0.88 },
      { x: ((time * 0.007 + 760) % (W + 300)) - 150, y: H * 0.11, scale: 1.05 }
    ];

    clouds.forEach(c => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(c.scale, c.scale);

      // 1. Base shadow / underbelly of the cloud
      ctx.fillStyle = cloudBase;
      ctx.beginPath();
      ctx.ellipse(36, 14, 54, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Main anime cumulus billow lobes
      ctx.fillStyle = cloudColor;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.arc(22, -12, 32, 0, Math.PI * 2);
      ctx.arc(52, -8, 28, 0, Math.PI * 2);
      ctx.arc(72, 2, 22, 0, Math.PI * 2);
      ctx.arc(38, 6, 28, 0, Math.PI * 2);
      ctx.fill();

      // 3. Glowing sunlit rim highlights along upper contours
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.arc(22, -14, 28, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.arc(52, -10, 24, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.fill();

      ctx.restore();
    });
  }

  // 1.3 PAINTERLY STUDIO GHIBLI MOUNTAINS (Panoramic Alpine Ridges & Mount Fuji with Seasonal Snow Cap)
  drawMountains(ctx, W, H) {
    const mountainFar = this.sampleColor('mountainFar');
    const mountainNear = this.sampleColor('mountainNear');
    const skyBottom = this.sampleColor('skyBottom');
    const forestDeep = this.sampleColor('forestDeep');

    const p = Math.max(0, Math.min(3, this.seasonProgress));

    // Winter factor: smoothly ramps up from Autumn (2.0) to Winter (3.0)
    const winterFactor = Math.max(0, Math.min(1, (p - 1.8) / 1.2));
    
    // Mount Fuji snow cap factor across the 4 seasons:
    // Winter (p=3): 1.0 (grand, thick snow cap covering upper ~38% of peak)
    // Spring (p=0): ~0.55 (iconic spring snow cap on Fuji during sakura season)
    // Summer (p=1): ~0.08 (slight summit crevasse snow glint)
    // Autumn (p=2): ~0.35 (early autumn frost crown on Fuji's crater)
    let fujiSnowFactor = 0;
    if (p <= 1.0) {
      fujiSnowFactor = 0.55 * (1 - p) + 0.08 * p;
    } else if (p <= 2.0) {
      fujiSnowFactor = 0.08 * (2 - p) + 0.35 * (p - 1);
    } else {
      fujiSnowFactor = 0.35 * (3 - p) + 1.0 * (p - 2);
    }

    // -------------------------------------------------------------
    // Tier 1: Majestic Distant Alpine Mountain Range (Full-Bleed Panoramic Crests)
    // Organic, flowing bezier ridges without sharp triangle zigzags
    // -------------------------------------------------------------
    const farGrad = ctx.createLinearGradient(0, H * 0.18, 0, H * 0.62);
    farGrad.addColorStop(0, mountainFar);
    farGrad.addColorStop(1, skyBottom);

    ctx.fillStyle = farGrad;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.54);
    // Western ridgeline: rolling organic peaks & saddles
    ctx.bezierCurveTo(W * 0.04, H * 0.44, W * 0.08, H * 0.34, W * 0.14, H * 0.35);
    ctx.bezierCurveTo(W * 0.18, H * 0.36, W * 0.22, H * 0.44, W * 0.28, H * 0.40);
    ctx.bezierCurveTo(W * 0.33, H * 0.37, W * 0.37, H * 0.32, W * 0.42, H * 0.34);
    ctx.bezierCurveTo(W * 0.46, H * 0.36, W * 0.50, H * 0.42, W * 0.55, H * 0.41);
    // Eastern ridgeline
    ctx.bezierCurveTo(W * 0.62, H * 0.40, W * 0.68, H * 0.33, W * 0.74, H * 0.34);
    ctx.bezierCurveTo(W * 0.79, H * 0.35, W * 0.83, H * 0.43, W * 0.88, H * 0.38);
    ctx.bezierCurveTo(W * 0.92, H * 0.34, W * 0.96, H * 0.42, W, H * 0.48);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // In Winter: Soft snow caps along the distant high mountain crests
    if (winterFactor > 0.05) {
      ctx.save();
      const snowAlpha = (this.darkFactor > 0.5 ? 0.35 : 0.65) * winterFactor;
      ctx.fillStyle = `rgba(255, 255, 255, ${snowAlpha})`;
      // Western alpine snow crests
      ctx.beginPath();
      ctx.moveTo(W * 0.09, H * 0.39);
      ctx.bezierCurveTo(W * 0.11, H * 0.35, W * 0.13, H * 0.34, W * 0.14, H * 0.35);
      ctx.bezierCurveTo(W * 0.16, H * 0.36, W * 0.18, H * 0.40, W * 0.20, H * 0.41);
      ctx.bezierCurveTo(W * 0.16, H * 0.43, W * 0.12, H * 0.42, W * 0.09, H * 0.39);
      ctx.closePath();
      ctx.fill();

      // Eastern alpine snow crests
      ctx.beginPath();
      ctx.moveTo(W * 0.70, H * 0.38);
      ctx.bezierCurveTo(W * 0.72, H * 0.34, W * 0.74, H * 0.34, W * 0.76, H * 0.36);
      ctx.bezierCurveTo(W * 0.78, H * 0.38, W * 0.80, H * 0.42, W * 0.82, H * 0.42);
      ctx.bezierCurveTo(W * 0.76, H * 0.43, W * 0.72, H * 0.41, W * 0.70, H * 0.38);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // -------------------------------------------------------------
    // Tier 2: The Iconic MOUNT FUJI (Focal stratovolcano with flared slopes & snow cap)
    // Majestic vista positioning (W * 0.36 to W * 0.78), summit reaches up to H * 0.20
    // -------------------------------------------------------------
    const fx = W * 0.57; // Peak center x
    const fy = H * 0.20; // Peak summit y (majestic tall peak)
    const craterHalfW = Math.max(14, W * 0.022); // Stratovolcano gentle crater rim width
    const fujiBaseL = fx - W * 0.24; // Base left
    const fujiBaseR = fx + W * 0.24; // Base right
    const fujiBaseY = H * 0.58;

    // Fuji Body Gradient
    const fujiGrad = ctx.createLinearGradient(0, fy, 0, fujiBaseY);
    fujiGrad.addColorStop(0, mountainFar);
    fujiGrad.addColorStop(0.65, mountainNear);
    fujiGrad.addColorStop(1, skyBottom);

    ctx.save();
    ctx.fillStyle = fujiGrad;
    ctx.beginPath();
    ctx.moveTo(fujiBaseL, fujiBaseY);
    // Sweeping concave flared volcanic left slope (classic Fuji stratovolcano geometry)
    ctx.bezierCurveTo(
      fx - W * 0.16, fujiBaseY - H * 0.04,
      fx - W * 0.08, fy + H * 0.12,
      fx - craterHalfW, fy
    );
    // Summit caldera rim (gently scalloped volcanic crater)
    ctx.bezierCurveTo(
      fx - craterHalfW * 0.3, fy + 3,
      fx + craterHalfW * 0.3, fy + 3,
      fx + craterHalfW, fy
    );
    // Sweeping concave flared volcanic right slope
    ctx.bezierCurveTo(
      fx + W * 0.08, fy + H * 0.12,
      fx + W * 0.16, fujiBaseY - H * 0.04,
      fujiBaseR, fujiBaseY
    );
    ctx.lineTo(fujiBaseR, H);
    ctx.lineTo(fujiBaseL, H);
    ctx.closePath();
    ctx.fill();

    // Subtle right-face shade on Mount Fuji (giving 3D atmospheric volume)
    const fujiShadeAlpha = this.darkFactor > 0.5 ? 0.20 : 0.16;
    ctx.fillStyle = `rgba(0, 15, 45, ${fujiShadeAlpha})`;
    ctx.beginPath();
    ctx.moveTo(fx, fy + 2);
    ctx.bezierCurveTo(
      fx + W * 0.02, fy + H * 0.12,
      fx + W * 0.04, fy + H * 0.26,
      fx + W * 0.06, fujiBaseY
    );
    ctx.lineTo(fujiBaseR, fujiBaseY);
    ctx.bezierCurveTo(
      fx + W * 0.16, fujiBaseY - H * 0.04,
      fx + W * 0.08, fy + H * 0.12,
      fx + craterHalfW, fy
    );
    ctx.closePath();
    ctx.fill();

    // -------------------------------------------------------------
    // Mount Fuji Iconic Snow Cap (Tuyết phủ đỉnh núi Phú Sĩ)
    // Especially prominent in Winter with natural snow tongues down the ravines
    // -------------------------------------------------------------
    if (fujiSnowFactor > 0.03) {
      const snowHeightFactor = 0.18 + fujiSnowFactor * 0.22; // Covers upper 20% to 40% of Fuji
      const snowBottomY = fy + (fujiBaseY - fy) * snowHeightFactor;
      
      // Calculate boundary widths at snowBottomY along the concave slopes
      const snowHalfW = craterHalfW + (W * 0.09) * (snowHeightFactor / 0.40);

      // Create snow cap path with authentic scalloped snow tongues (Hokusai & Ghibli aesthetic)
      ctx.beginPath();
      // Start at left summit crater rim
      ctx.moveTo(fx - craterHalfW, fy);
      // Summit crater
      ctx.bezierCurveTo(
        fx - craterHalfW * 0.3, fy + 3,
        fx + craterHalfW * 0.3, fy + 3,
        fx + craterHalfW, fy
      );
      // Down right flank to snow line
      ctx.bezierCurveTo(
        fx + craterHalfW + (snowHalfW - craterHalfW) * 0.45, fy + (snowBottomY - fy) * 0.50,
        fx + craterHalfW + (snowHalfW - craterHalfW) * 0.85, fy + (snowBottomY - fy) * 0.85,
        fx + snowHalfW, snowBottomY
      );

      // Scalloped / serrated bottom snow line with descending tongues along volcanic chutes
      const numTongues = 8;
      const tongueWidth = (snowHalfW * 2) / numTongues;
      for (let i = numTongues; i >= 1; i--) {
        const segRightX = fx - snowHalfW + i * tongueWidth;
        const segLeftX = fx - snowHalfW + (i - 1) * tongueWidth;
        const midX = (segRightX + segLeftX) / 2;
        // Natural tongue protrusion
        const tongueDrop = ((i * 37) % 11) * 2.2 * fujiSnowFactor;
        const controlY = snowBottomY + 8 + tongueDrop;
        ctx.quadraticCurveTo(midX, controlY, segLeftX, snowBottomY - (i % 2 === 0 ? 3 : 0));
      }

      // Up left flank back to summit
      ctx.bezierCurveTo(
        fx - craterHalfW - (snowHalfW - craterHalfW) * 0.85, fy + (snowBottomY - fy) * 0.85,
        fx - craterHalfW - (snowHalfW - craterHalfW) * 0.45, fy + (snowBottomY - fy) * 0.50,
        fx - craterHalfW, fy
      );
      ctx.closePath();

      // Sunlit Snow Cap Base
      const isNight = this.darkFactor > 0.5;
      const snowGrad = ctx.createLinearGradient(0, fy, 0, snowBottomY);
      if (isNight) {
        snowGrad.addColorStop(0, `rgba(226, 232, 240, ${0.75 * fujiSnowFactor})`);
        snowGrad.addColorStop(1, `rgba(148, 163, 184, ${0.55 * fujiSnowFactor})`);
      } else {
        snowGrad.addColorStop(0, `rgba(255, 255, 255, ${0.98 * fujiSnowFactor})`);
        snowGrad.addColorStop(0.7, `rgba(248, 250, 252, ${0.92 * fujiSnowFactor})`);
        snowGrad.addColorStop(1, `rgba(224, 242, 254, ${0.85 * fujiSnowFactor})`);
      }
      ctx.fillStyle = snowGrad;
      ctx.fill();

      // Right shadow facet on the snow cap
      ctx.save();
      ctx.clip(); // clip to the snow cap
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + W * 0.04, snowBottomY + 15);
      ctx.lineTo(fx + snowHalfW + 10, snowBottomY + 15);
      ctx.lineTo(fx + snowHalfW + 10, fy);
      ctx.closePath();
      ctx.fillStyle = isNight ? 'rgba(30, 41, 59, 0.45)' : 'rgba(186, 210, 238, 0.55)';
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // -------------------------------------------------------------
    // Tier 3: Drifting Valley Mist Ribbons across the full panoramic width
    // -------------------------------------------------------------
    const mistGrad = ctx.createLinearGradient(0, H * 0.38, 0, H * 0.54);
    mistGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    mistGrad.addColorStop(0.5, this.darkFactor > 0.5 ? 'rgba(148, 163, 184, 0.08)' : 'rgba(255, 255, 255, 0.24)');
    mistGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, H * 0.38, W, H * 0.16);

    // -------------------------------------------------------------
    // Tier 4: Mid-range Rolling Forest Slopes (Smooth Bezier Hills)
    // -------------------------------------------------------------
    const midGrad = ctx.createLinearGradient(0, H * 0.40, 0, H * 0.68);
    midGrad.addColorStop(0, mountainNear);
    midGrad.addColorStop(1, mountainFar);

    ctx.fillStyle = midGrad;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.62);
    ctx.bezierCurveTo(W * 0.10, H * 0.46, W * 0.20, H * 0.44, W * 0.30, H * 0.52);
    ctx.bezierCurveTo(W * 0.40, H * 0.48, W * 0.50, H * 0.46, W * 0.60, H * 0.54);
    ctx.bezierCurveTo(W * 0.70, H * 0.48, W * 0.80, H * 0.46, W * 0.90, H * 0.55);
    ctx.bezierCurveTo(W * 0.95, H * 0.51, W * 0.98, H * 0.56, W, H * 0.58);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // In Winter: Frosted snow accents on mid-range hill crests
    if (winterFactor > 0.1) {
      ctx.save();
      const hillSnowAlpha = (this.darkFactor > 0.5 ? 0.25 : 0.50) * winterFactor;
      ctx.fillStyle = `rgba(255, 255, 255, ${hillSnowAlpha})`;
      ctx.beginPath();
      ctx.moveTo(W * 0.12, H * 0.47);
      ctx.bezierCurveTo(W * 0.18, H * 0.44, W * 0.22, H * 0.45, W * 0.28, H * 0.51);
      ctx.bezierCurveTo(W * 0.24, H * 0.52, W * 0.18, H * 0.50, W * 0.12, H * 0.47);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(W * 0.62, H * 0.51);
      ctx.bezierCurveTo(W * 0.70, H * 0.47, W * 0.76, H * 0.46, W * 0.82, H * 0.51);
      ctx.bezierCurveTo(W * 0.78, H * 0.53, W * 0.72, H * 0.52, W * 0.62, H * 0.51);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // -------------------------------------------------------------
    // Tier 5: Foreground Forest Ridge with Organic Pine Clusters
    // -------------------------------------------------------------
    ctx.fillStyle = forestDeep;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.65);
    ctx.bezierCurveTo(W * 0.15, H * 0.56, W * 0.35, H * 0.58, W * 0.55, H * 0.54);
    ctx.bezierCurveTo(W * 0.75, H * 0.52, W * 0.90, H * 0.58, W, H * 0.62);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // Natural clustering pine trees across the panoramic ridge crest
    const pineSpacing = 26;
    const numPines = Math.floor(W / pineSpacing) + 1;
    ctx.fillStyle = forestDeep;
    for (let i = 0; i < numPines; i++) {
      const px = i * pineSpacing + 6;
      const wave = Math.sin(i * 0.35);
      const py = H * 0.57 - wave * (H * 0.035);
      const pHeight = 16 + Math.abs(Math.sin(i * 1.7)) * 11;
      const pWidth = 11 + (i % 3) * 3;

      // Tier 1 (Top tip)
      ctx.beginPath();
      ctx.moveTo(px, py - pHeight);
      ctx.lineTo(px - pWidth * 0.35, py - pHeight * 0.6);
      ctx.lineTo(px + pWidth * 0.35, py - pHeight * 0.6);
      ctx.closePath();
      ctx.fill();
      // Tier 2 (Mid tier)
      ctx.beginPath();
      ctx.moveTo(px, py - pHeight * 0.7);
      ctx.lineTo(px - pWidth * 0.5, py - pHeight * 0.3);
      ctx.lineTo(px + pWidth * 0.5, py - pHeight * 0.3);
      ctx.closePath();
      ctx.fill();
      // Tier 3 (Base skirt)
      ctx.beginPath();
      ctx.moveTo(px, py - pHeight * 0.4);
      ctx.lineTo(px - pWidth * 0.65, py);
      ctx.lineTo(px + pWidth * 0.65, py);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 2. FRAMING ANCIENT FOREST BOUGHS (Overarching organic canopy - ZERO floating balls!)
  drawFramingForest(ctx, W, H, time) {
    const trunkColor = this.sampleColor('trunkColor');
    const foliagePrimary = this.sampleColor('foliagePrimary');
    const foliageSecondary = this.sampleColor('foliageSecondary');
    const foliageHighlight = this.sampleColor('foliageHighlight');

    const windSway = Math.sin(time * 0.0012) * 3;

    ctx.save();
    // 1. Organic Ancient Bough growing naturally from top-left corner
    ctx.fillStyle = trunkColor;
    ctx.beginPath();
    ctx.moveTo(-20, -20);
    // Upper contour of the main branch
    ctx.bezierCurveTo(W * 0.08, -10, W * 0.15, H * 0.04, W * 0.22, H * 0.10);
    // Branch tip
    ctx.lineTo(W * 0.21, H * 0.12);
    // Lower contour returning to border
    ctx.bezierCurveTo(W * 0.13, H * 0.12, W * 0.06, H * 0.15, -20, H * 0.36);
    ctx.closePath();
    ctx.fill();

    // Secondary smaller hanging bough fork
    ctx.beginPath();
    ctx.moveTo(W * 0.11, H * 0.06);
    ctx.bezierCurveTo(W * 0.12, H * 0.14, W * 0.10, H * 0.19, W * 0.08, H * 0.23);
    ctx.lineTo(W * 0.07, H * 0.22);
    ctx.bezierCurveTo(W * 0.09, H * 0.17, W * 0.10, H * 0.11, W * 0.09, H * 0.07);
    ctx.closePath();
    ctx.fill();

    // 2. Naturally Draped Cascading Anime Foliage Sprays along the branch (Scalloped lobes, NO balls!)
    this.drawAnimeLeafSpray(ctx, W * 0.04, H * 0.03 + windSway * 0.5, 68, foliagePrimary, foliageSecondary, foliageHighlight);
    this.drawAnimeLeafSpray(ctx, W * 0.12, H * 0.08 + windSway * 0.7, 52, foliagePrimary, foliageSecondary, foliageHighlight);
    this.drawAnimeLeafSpray(ctx, W * 0.08, H * 0.22 + windSway, 42, foliagePrimary, foliageSecondary, foliageHighlight);
    this.drawAnimeLeafSpray(ctx, W * 0.19, H * 0.11 + windSway * 0.8, 38, foliagePrimary, foliageSecondary, foliageHighlight);

    ctx.restore();
  }

  // Authentic Anime Foliage Spray (Organic scalloped lobes with depth - NO simple geometric circles!)
  drawAnimeLeafSpray(ctx, cx, cy, radius, primary, secondary, highlight) {
    // Pass 1: Deep shadow under-layer
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.ellipse(cx, cy + radius * 0.15, radius * 0.85, radius * 0.65, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Pass 2: Main lush anime leaf lobes (clustered scalloped arcs)
    ctx.fillStyle = primary;
    ctx.beginPath();
    const lobes = [
      { ox: 0, oy: -radius * 0.2, r: radius * 0.55 },
      { ox: -radius * 0.35, oy: 0, r: radius * 0.45 },
      { ox: radius * 0.35, oy: -radius * 0.05, r: radius * 0.48 },
      { ox: -radius * 0.2, oy: radius * 0.25, r: radius * 0.40 },
      { ox: radius * 0.2, oy: radius * 0.22, r: radius * 0.42 }
    ];
    lobes.forEach(l => {
      ctx.arc(cx + l.ox, cy + l.oy, l.r, 0, Math.PI * 2);
    });
    ctx.fill();

    // Pass 3: Sunlit rim / blossom highlight on top lobes
    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.arc(cx, cy - radius * 0.22, radius * 0.32, -Math.PI * 0.9, -Math.PI * 0.1);
    ctx.arc(cx + radius * 0.32, cy - radius * 0.1, radius * 0.28, -Math.PI * 0.9, -Math.PI * 0.1);
    ctx.fill();
  }

  // 3. SACRED SERENE LAKE WITH WATERCOLOR REFLECTIONS & LILIES
  drawLake(ctx, W, H, time) {
    const lakeTop = this.sampleColor('lakeTop');
    const lakeBottom = this.sampleColor('lakeBottom');
    const lakeHighlight = this.sampleColorRgba('lakeHighlight', 0.55);

    const lakeCenterX = W * 0.19;
    const lakeCenterY = H * 0.67;
    const lakeRadiusX = W * 0.22;
    const lakeRadiusY = H * 0.15;

    // Lake Water Gradient (Deep jewel watercolor with soft sunlit sheen)
    const lakeGrad = ctx.createRadialGradient(
      lakeCenterX, lakeCenterY - 10, lakeRadiusX * 0.08,
      lakeCenterX, lakeCenterY, lakeRadiusX
    );
    lakeGrad.addColorStop(0, lakeHighlight);
    lakeGrad.addColorStop(0.35, lakeTop);
    lakeGrad.addColorStop(1, lakeBottom);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(lakeCenterX, lakeCenterY, lakeRadiusX, lakeRadiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = lakeGrad;
    ctx.fill();

    // Watercolor Reflection of the Great Giant Ancient Tree on the Water Surface
    const trunkReflect = this.sampleColorRgba('trunkColor', 0.22);
    const foliageReflect = this.sampleColorRgba('foliagePrimary', 0.20);
    const waveShimmer = Math.sin(time * 0.002) * 5;

    // Giant Trunk reflection
    ctx.fillStyle = trunkReflect;
    ctx.beginPath();
    ctx.ellipse(lakeCenterX + waveShimmer * 0.5, lakeCenterY + 32, 28, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    // Giant Canopy reflection
    ctx.fillStyle = foliageReflect;
    ctx.beginPath();
    ctx.ellipse(lakeCenterX + waveShimmer, lakeCenterY + 46, 95, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Water Surface Concentric Ripples
    const ripplePhases = [0, 0.33, 0.66];
    ripplePhases.forEach((phase) => {
      const progress = ((time * 0.0006 + phase) % 1.0);
      const rx = 30 + progress * (lakeRadiusX * 0.70);
      const ry = 10 + progress * (lakeRadiusY * 0.70);
      const alpha = (1 - progress) * 0.28;

      ctx.beginPath();
      ctx.ellipse(lakeCenterX, lakeCenterY + 8, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = this.sampleColorRgba('lakeHighlight', alpha);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    // Floating Water Lily Pads near quiet shoreline edges
    const lilyPads = [
      { x: lakeCenterX - 55, y: lakeCenterY + 12, r: 9, rot: 0.4 },
      { x: lakeCenterX - 72, y: lakeCenterY - 4, r: 7, rot: 1.2 },
      { x: lakeCenterX + 62, y: lakeCenterY + 18, r: 8, rot: 2.1 }
    ];
    lilyPads.forEach(lp => {
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(lp.x, lp.y, lp.r, lp.rot + 0.3, lp.rot + Math.PI * 2 - 0.3);
      ctx.lineTo(lp.x, lp.y);
      ctx.closePath();
      ctx.fill();

      // Tiny pink/white lotus flower bud
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.arc(lp.x - 1, lp.y - 1, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Winter Ice Sheet Cracks
    if (this.seasonProgress > 2.2) {
      const iceAlpha = Math.min(1, (this.seasonProgress - 2.2) / 0.8);
      ctx.strokeStyle = `rgba(255, 255, 255, ${iceAlpha * 0.75})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lakeCenterX - 45, lakeCenterY - 14);
      ctx.lineTo(lakeCenterX - 10, lakeCenterY + 10);
      ctx.lineTo(lakeCenterX + 35, lakeCenterY - 6);
      ctx.lineTo(lakeCenterX + 68, lakeCenterY + 18);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 3.1 MOSSY ISLAND AND GREAT SACRED ANCIENT TREE (3x Grand Ancient Divine Tree)
  drawIslandAndTree(ctx, W, H, time) {
    const islandX = W * 0.18;
    const islandY = H * 0.64;
    const trunkColor = this.sampleColor('trunkColor');
    const foliagePrimary = this.sampleColor('foliagePrimary');
    const foliageSecondary = this.sampleColor('foliageSecondary');
    const foliageHighlight = this.sampleColor('foliageHighlight');

    // 1. Natural Compact Tree Root Mound (Leaves plenty of open blue water all around!)
    const islandGrad = ctx.createRadialGradient(islandX, islandY + 6, 8, islandX, islandY + 6, 52);
    islandGrad.addColorStop(0, this.sampleColor('grassNear'));
    islandGrad.addColorStop(0.75, this.sampleColor('grassFar'));
    islandGrad.addColorStop(1, '#3f3f46');

    ctx.beginPath();
    ctx.ellipse(islandX, islandY + 6, 48, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = islandGrad;
    ctx.fill();

    // Shoreline river pebbles hugging the roots
    const pebbles = [
      { ox: -36, oy: 6, rx: 6, ry: 3.5, col: '#78716c' },
      { ox: 38, oy: 5, rx: 7, ry: 3.5, col: '#57534e' },
      { ox: -16, oy: 12, rx: 5, ry: 3, col: '#a8a29e' },
      { ox: 18, oy: 11, rx: 6, ry: 3, col: '#78716c' },
      { ox: 2, oy: 13, rx: 5, ry: 2.5, col: '#57534e' }
    ];
    pebbles.forEach(pb => {
      ctx.fillStyle = pb.col;
      ctx.beginPath();
      ctx.ellipse(islandX + pb.ox, islandY + pb.oy, pb.rx, pb.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Massive Ancient Gnarled Sacred Tree Trunk & Deep Root Flares (3x SCALE)
    ctx.fillStyle = trunkColor;
    ctx.beginPath();
    // Massive root spreading into the left earth
    ctx.moveTo(islandX - 68, islandY + 18);
    ctx.bezierCurveTo(islandX - 52, islandY + 6, islandX - 44, islandY - 25, islandX - 36, islandY - 75);
    // Left giant bough reaching out wide
    ctx.bezierCurveTo(islandX - 55, islandY - 145, islandX - 80, islandY - 210, islandX - 110, islandY - 265);
    ctx.lineTo(islandX - 86, islandY - 260);
    ctx.bezierCurveTo(islandX - 58, islandY - 200, islandX - 28, islandY - 160, islandX - 16, islandY - 135);
    // Towering central crown trunk climbing high into the sky
    ctx.bezierCurveTo(islandX - 12, islandY - 200, islandX - 6, islandY - 270, islandX + 2, islandY - 335);
    ctx.lineTo(islandX + 18, islandY - 330);
    ctx.bezierCurveTo(islandX + 14, islandY - 250, islandX + 18, islandY - 175, islandX + 28, islandY - 135);
    // Right giant bough reaching out wide
    ctx.bezierCurveTo(islandX + 55, islandY - 165, islandX + 85, islandY - 215, islandX + 118, islandY - 275);
    ctx.lineTo(islandX + 96, islandY - 265);
    ctx.bezierCurveTo(islandX + 68, islandY - 205, islandX + 44, islandY - 140, islandX + 36, islandY - 70);
    // Massive root spreading into the right earth
    ctx.bezierCurveTo(islandX + 44, islandY - 25, islandX + 56, islandY + 8, islandX + 70, islandY + 18);
    ctx.closePath();
    ctx.fill();

    // Trunk Bark Striations, Growth Rings & Ancient Knots
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.40)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    // Left ridge lines
    ctx.moveTo(islandX - 20, islandY + 12);
    ctx.bezierCurveTo(islandX - 25, islandY - 45, islandX - 14, islandY - 110, islandX - 35, islandY - 190);
    // Center ridge lines
    ctx.moveTo(islandX + 2, islandY + 14);
    ctx.bezierCurveTo(islandX + 4, islandY - 50, islandX + 8, islandY - 130, islandX + 6, islandY - 240);
    // Right ridge lines
    ctx.moveTo(islandX + 24, islandY + 12);
    ctx.bezierCurveTo(islandX + 28, islandY - 40, islandX + 35, islandY - 105, islandX + 55, islandY - 180);
    ctx.stroke();

    // 3. Multi-Layered Painterly Anime Foliage Canopy (3x GRAND VOLUMES)
    const isWinter = this.seasonProgress > 2.4;
    const winterFactor = Math.max(0, Math.min(1, (this.seasonProgress - 2.4) / 0.6));

    if (!isWinter || winterFactor < 0.95) {
      const alpha = 1.0 - winterFactor * 0.9;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);

      const treeWind = Math.sin(time * 0.0015) * 3.5;

      // Grand Billowing Canopy Sprays (3x Massive Scale)
      this.drawAnimeLeafSpray(ctx, islandX - 95, islandY - 255 + treeWind * 0.8, 125, foliagePrimary, foliageSecondary, foliageHighlight);
      this.drawAnimeLeafSpray(ctx, islandX + 105, islandY - 250 - treeWind * 0.8, 120, foliagePrimary, foliageSecondary, foliageHighlight);
      this.drawAnimeLeafSpray(ctx, islandX, islandY - 335 + treeWind, 145, foliageHighlight, foliagePrimary, foliageSecondary);
      this.drawAnimeLeafSpray(ctx, islandX - 45, islandY - 190 + treeWind * 0.5, 105, foliagePrimary, foliageSecondary, foliageHighlight);
      this.drawAnimeLeafSpray(ctx, islandX + 55, islandY - 180 - treeWind * 0.5, 100, foliageHighlight, foliageSecondary, foliagePrimary);
      this.drawAnimeLeafSpray(ctx, islandX, islandY - 240, 115, foliageSecondary, foliagePrimary, foliageHighlight);

      ctx.restore();
    }

    // Winter Soft Frost & Snow Dusting along Branch Ridges (Natural painterly strokes for 3x limbs)
    if (this.seasonProgress > 2.1) {
      const snowAlpha = Math.min(1, (this.seasonProgress - 2.1) / 0.9);
      ctx.save();
      ctx.globalAlpha = snowAlpha * 0.92;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Left giant bough snow crest
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(islandX - 38, islandY - 80);
      ctx.bezierCurveTo(islandX - 55, islandY - 145, islandX - 78, islandY - 210, islandX - 106, islandY - 262);
      ctx.stroke();

      // Right giant bough snow crest
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      ctx.moveTo(islandX + 35, islandY - 75);
      ctx.bezierCurveTo(islandX + 55, islandY - 160, islandX + 82, islandY - 210, islandX + 114, islandY - 270);
      ctx.stroke();

      // Center towering crown snow crest
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(islandX - 10, islandY - 145);
      ctx.bezierCurveTo(islandX - 8, islandY - 205, islandX - 4, islandY - 270, islandX + 8, islandY - 330);
      ctx.stroke();

      // Fresh snow blanket resting naturally across the island moss & roots
      const snowIslandGrad = ctx.createLinearGradient(islandX, islandY - 6, islandX, islandY + 28);
      snowIslandGrad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
      snowIslandGrad.addColorStop(0.7, 'rgba(226, 232, 240, 0.75)');
      snowIslandGrad.addColorStop(1, 'rgba(203, 213, 225, 0)');
      ctx.fillStyle = snowIslandGrad;
      ctx.beginPath();
      ctx.ellipse(islandX, islandY + 6, 44, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // 4. FOREGROUND SHORELINE MEADOW WITH WILDFLOWERS
  drawShoreline(ctx, W, H, time) {
    const grassNear = this.sampleColor('grassNear');
    const grassFar = this.sampleColor('grassFar');

    const meadowGrad = ctx.createLinearGradient(0, H * 0.72, 0, H);
    meadowGrad.addColorStop(0, grassFar);
    meadowGrad.addColorStop(0.35, grassNear);
    meadowGrad.addColorStop(1, grassFar);

    ctx.fillStyle = meadowGrad;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.74);
    ctx.bezierCurveTo(W * 0.14, H * 0.71, W * 0.28, H * 0.72, W * 0.44, H * 0.76);
    ctx.bezierCurveTo(W * 0.65, H * 0.78, W * 0.85, H * 0.75, W, H * 0.76);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // Grass Tufts along the shoreline edge
    ctx.strokeStyle = grassNear;
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    const tuftCount = 14;
    for (let i = 0; i < tuftCount; i++) {
      const tx = (i / tuftCount) * (W * 0.36) + 12;
      const ty = H * 0.74 + Math.sin(i * 0.9) * 8;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - 3, ty - 8);
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx, ty - 11);
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + 4, ty - 7);
      ctx.stroke();
    }

    // Delicate Anime Wildflowers in the meadow (Spring/Summer)
    if (this.seasonProgress < 2.2) {
      const flowers = [
        { x: W * 0.05, y: H * 0.77, col: '#ffffff' },
        { x: W * 0.10, y: H * 0.79, col: '#fde047' },
        { x: W * 0.14, y: H * 0.82, col: '#ffffff' },
        { x: W * 0.23, y: H * 0.79, col: '#f472b6' },
        { x: W * 0.29, y: H * 0.81, col: '#ffffff' }
      ];
      flowers.forEach(fl => {
        ctx.fillStyle = fl.col;
        ctx.beginPath();
        ctx.arc(fl.x, fl.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.arc(fl.x, fl.y, 1.0, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  // Helper: Pick a random spot strictly inside the open BLUE WATER region
  getRandomWaterCoord() {
    const spots = [
      { x: 0.142, y: 0.708 },
      { x: 0.155, y: 0.702 },
      { x: 0.165, y: 0.715 },
      { x: 0.150, y: 0.722 },
      { x: 0.160, y: 0.695 },
      { x: 0.170, y: 0.710 }
    ];
    const currX = this.fishing.currentXRatio;
    const currY = this.fishing.currentYRatio;
    const valid = spots.filter(s => Math.hypot(s.x - currX, (s.y - currY) * 2) > 0.015);
    return valid[Math.floor(Math.random() * valid.length)] || spots[0];
  }

  // 5. LIGHT MODE: ANIME GIRL FISHING WITH 10S CASTING CYCLE (Strictly in Blue Water)
  drawPersonFishing(ctx, W, H, time, opacity) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

    // Ground position on the meadow grass right at the lake shore bank
    const px = W * 0.125;
    const py = H * 0.745;

    // 10s Dynamic Fishing Cast Cycle
    // 0s - 7.4s: Resting in blue water with gentle waves and swimming fish
    // 7.4s - 8.2s: Pull / Reel rod UP HIGH ("10s kéo cần câu lên cao")
    // 8.2s - 9.2s: Whip forward and cast to new random spot in blue water ("thả qua chỗ khác ngẫu nhiên")
    // 9.2s - 10.0s: Splashdown into blue water & settle
    const cycleDuration = 10000;
    const cycleTime = time % cycleDuration;
    const cycleIndex = Math.floor(time / cycleDuration);

    if (this.fishing.lastCastCycle !== cycleIndex) {
      this.fishing.lastCastCycle = cycleIndex;
      this.fishing.startXRatio = this.fishing.targetXRatio;
      this.fishing.startYRatio = this.fishing.targetYRatio;
      const nextSpot = this.getRandomWaterCoord();
      this.fishing.targetXRatio = nextSpot.x;
      this.fishing.targetYRatio = nextSpot.y;
    }

    const idleRodTipX = px + 44;
    const idleRodTipY = py - 72;
    let rodTipX = idleRodTipX;
    let rodTipY = idleRodTipY;
    let bobberX = W * this.fishing.startXRatio;
    let bobberY = H * this.fishing.startYRatio;
    let inWater = true;
    let girlLeanX = 0;
    let armLiftY = 0;

    if (cycleTime < 7400) {
      // Phase 1: Relaxed fishing in blue water (0s - 7.4s)
      bobberY += Math.sin(time * 0.003) * 1.5;
      inWater = true;
    } else if (cycleTime < 8200) {
      // Phase 2: Pull / Reel rod UP HIGH (7.4s - 8.2s) - "10s kéo cần câu lên cao"
      const t = (cycleTime - 7400) / 800;
      const easeLift = Math.sin(t * Math.PI * 0.5);
      girlLeanX = -easeLift * 5;
      armLiftY = -easeLift * 4;
      rodTipX = lerp(idleRodTipX, px + 14, easeLift);
      rodTipY = lerp(idleRodTipY, py - 95, easeLift);
      bobberX = lerp(W * this.fishing.startXRatio, px + 26, easeLift);
      bobberY = lerp(H * this.fishing.startYRatio, py - 55, easeLift) - Math.sin(t * Math.PI) * 45;
      inWater = false;
    } else if (cycleTime < 9200) {
      // Phase 3: Whip and cast to new random water spot (8.2s - 9.2s) - "thả qua chỗ khác ngẫu nhiên"
      const t = (cycleTime - 8200) / 1000;
      const easeCast = 1 - Math.pow(1 - t, 3);
      girlLeanX = Math.sin(t * Math.PI) * 4;
      rodTipX = lerp(px + 14, idleRodTipX, easeCast) + Math.sin(t * Math.PI) * 14;
      rodTipY = lerp(py - 95, idleRodTipY, easeCast);
      bobberX = lerp(px + 26, W * this.fishing.targetXRatio, easeCast);
      bobberY = lerp(py - 55, H * this.fishing.targetYRatio, easeCast) - Math.sin(t * Math.PI) * 65;
      inWater = false;
    } else {
      // Phase 4: Splashdown into blue water & settle (9.2s - 10.0s)
      const t = (cycleTime - 9200) / 800;
      this.fishing.currentXRatio = this.fishing.targetXRatio;
      this.fishing.currentYRatio = this.fishing.targetYRatio;
      bobberX = W * this.fishing.targetXRatio;
      bobberY = H * this.fishing.targetYRatio + Math.sin(time * 0.003) * 1.5;
      rodTipX = idleRodTipX + Math.sin(t * Math.PI * 3) * (1 - t) * 4;
      rodTipY = idleRodTipY + Math.cos(t * Math.PI * 3) * (1 - t) * 3;
      inWater = true;
    }

    // Soft contact shadow on the grass
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(px + 4 + girlLeanX, py + 16, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Woven Wicker Picnic Basket beside her on the grass
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(px - 22, py + 4, 13, 11, 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Basket handle & white napkin cloth
    ctx.strokeStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(px - 15.5, py + 4, 6, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(px - 19, py + 5);
    ctx.lineTo(px - 14, py + 8);
    ctx.lineTo(px - 11, py + 4);
    ctx.fill();

    // ── Female Anime Character (Consistent Model) ──
    // Folded Legs seated gracefully on the meadow
    ctx.fillStyle = '#1e293b'; // Dark indigo trousers
    ctx.beginPath();
    ctx.ellipse(px + 2 + girlLeanX, py + 12, 11, 7, 0.15, 0, Math.PI * 2);
    ctx.fill();
    // Little brown leather walking boot resting on grass
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(px + 12 + girlLeanX, py + 15, 5.5, 3.2, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#292524'; // boot sole
    ctx.fillRect(px + 8 + girlLeanX, py + 17, 9, 1.8);

    // Torso / Terracotta Red Anime Sweater/Jacket
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(px - 2 + girlLeanX, py + 1, 9, 12, 0.12, 0, Math.PI * 2);
    ctx.fill();
    // Jacket shadow crease
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.ellipse(px - 4 + girlLeanX, py + 3, 6, 9, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Cozy Knitted Ivory Scarf around her neck
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(px + 2 + girlLeanX, py - 9, 7.5, 4.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Scarf tail fluttering softly
    ctx.beginPath();
    ctx.moveTo(px - 3 + girlLeanX, py - 8);
    ctx.quadraticCurveTo(px - 10 + girlLeanX, py - 3, px - 11 + girlLeanX, py + 5);
    ctx.lineTo(px - 7 + girlLeanX, py + 6);
    ctx.quadraticCurveTo(px - 6 + girlLeanX, py - 2, px - 1 + girlLeanX, py - 7);
    ctx.closePath();
    ctx.fill();

    // Hands holding the slender bamboo fishing rod
    const handX = px + 8 + girlLeanX;
    const handY = py - 3 + armLiftY;
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(handX, handY, 3.0, 0, Math.PI * 2);
    ctx.fill();

    // ── Slender Bamboo Fishing Rod (Dynamic Spring & Cast Flex) ──
    const rodBaseX = px + 6 + girlLeanX;
    const rodBaseY = py - 4 + armLiftY;

    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(rodBaseX, rodBaseY);
    // Bends forward during cast or flexes high
    const midRodBendX = (rodBaseX + rodTipX) * 0.5 + (cycleTime >= 8200 && cycleTime < 9200 ? 10 : 0);
    const midRodBendY = (rodBaseY + rodTipY) * 0.5 + (cycleTime >= 7400 && cycleTime < 8200 ? -8 : 3);
    ctx.quadraticCurveTo(midRodBendX, midRodBendY, rodTipX, rodTipY);
    ctx.stroke();

    // Segment rings on bamboo rod
    ctx.strokeStyle = '#5c330a';
    ctx.lineWidth = 1.0;
    const knots = [0.25, 0.5, 0.75, 0.9];
    knots.forEach(kt => {
      const kx = lerp(rodBaseX, rodTipX, kt);
      const ky = lerp(rodBaseY, rodTipY, kt);
      ctx.beginPath();
      ctx.arc(kx, ky, 1.6, 0, Math.PI * 2);
      ctx.stroke();
    });

    // ── Fine Fishing Line descending to the bobber (Clean, Straight & Taut) ──
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(rodTipX, rodTipY);
    ctx.lineTo(bobberX, bobberY);
    ctx.stroke();

    // When bobber is IN BLUE WATER
    if (inWater) {
      // ── Curious Tiny Little Fish swimming in the clear blue lake ──
      const fishColor = this.sampleColorRgba('lakeHighlight', 0.40);
      const fishShimmer = Math.sin(time * 0.004) * 3;
      ctx.fillStyle = fishColor;
      // Little fish 1
      ctx.beginPath();
      ctx.ellipse(bobberX - 18 + fishShimmer, bobberY + 12, 7.5, 2.8, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bobberX - 24 + fishShimmer, bobberY + 14);
      ctx.lineTo(bobberX - 28 + fishShimmer, bobberY + 11);
      ctx.lineTo(bobberX - 28 + fishShimmer, bobberY + 17);
      ctx.closePath();
      ctx.fill();
      // Little fish 2
      ctx.beginPath();
      ctx.ellipse(bobberX + 22 - fishShimmer, bobberY + 18, 6.0, 2.2, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Gentle expanding water ripples around bobber
      const ripProgress = (time * 0.001) % 1.0;
      ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - ripProgress) * 0.65})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.ellipse(bobberX, bobberY, 5 + ripProgress * 18, 2.2 + ripProgress * 6, 0, 0, Math.PI * 2);
      ctx.stroke();

      const ripProgress2 = (time * 0.001 + 0.5) % 1.0;
      ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - ripProgress2) * 0.45})`;
      ctx.beginPath();
      ctx.ellipse(bobberX, bobberY, 4 + ripProgress2 * 14, 1.8 + ripProgress2 * 4.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // If just splashed down (9.3s - 10.0s), draw additional impact splash rings
      if (cycleTime >= 9300) {
        const splashT = (cycleTime - 9300) / 700;
        ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - splashT) * 0.85})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(bobberX, bobberY, 6 + splashT * 26, 2.5 + splashT * 9, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      // Flying in mid-air: motion dash trails
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(bobberX - 6, bobberY + 4);
      ctx.lineTo(bobberX - 14, bobberY + 8);
      ctx.stroke();

      // Water spray droplets popping up from old water spot at start of pull
      if (cycleTime >= 7400 && cycleTime < 7800) {
        const dt = (cycleTime - 7400) / 400;
        const oldX = W * this.fishing.startXRatio;
        const oldY = H * this.fishing.startYRatio;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        for (let s = 0; s < 4; s++) {
          const sx = oldX + (s - 1.5) * 6;
          const sy = oldY - dt * (12 + s * 4);
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // ── Fishing Bobber (Red upper, White lower) ──
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(bobberX, bobberY - 2.8, 3.5, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bobberX, bobberY - 2.8, 3.5, 0, Math.PI);
    ctx.fill();

    // ── Female Anime Head, Hair & Facial Profile ──
    const hairSway = Math.sin(time * 0.002) * 1.8;

    // High Ponytail cascading behind her head
    ctx.fillStyle = '#1c1917'; // Silky dark hair
    ctx.beginPath();
    ctx.moveTo(px - 3 + girlLeanX, py - 20);
    ctx.bezierCurveTo(px - 14 + girlLeanX, py - 26 + hairSway, px - 22 + girlLeanX, py - 18 + hairSway, px - 24 + girlLeanX, py - 8 + hairSway);
    ctx.bezierCurveTo(px - 18 + girlLeanX, py - 6 + hairSway, px - 11 + girlLeanX, py - 14, px - 2 + girlLeanX, py - 16);
    ctx.closePath();
    ctx.fill();

    // Red hair ribbon tying the ponytail
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(px - 3 + girlLeanX, py - 19, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Base Head Shape
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(px + 1 + girlLeanX, py - 18, 8.5, 0, Math.PI * 2);
    ctx.fill();

    // Porcelain Peach Anime Face Profile
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.moveTo(px + 1 + girlLeanX, py - 24);
    ctx.lineTo(px + 6 + girlLeanX, py - 22);
    ctx.lineTo(px + 8 + girlLeanX, py - 18); // cute nose tip
    ctx.lineTo(px + 6 + girlLeanX, py - 15);
    ctx.lineTo(px + 5 + girlLeanX, py - 12); // chin
    ctx.lineTo(px + 1 + girlLeanX, py - 11);
    ctx.closePath();
    ctx.fill();

    // Soft Anime Bangs framing forehead & temple
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(px - 1 + girlLeanX, py - 25);
    ctx.quadraticCurveTo(px + 4 + girlLeanX, py - 25, px + 6 + girlLeanX, py - 20);
    ctx.lineTo(px + 4 + girlLeanX, py - 19);
    ctx.quadraticCurveTo(px + 2 + girlLeanX, py - 22, px - 1 + girlLeanX, py - 22);
    ctx.fill();

    // Cute Anime Eye looking gently toward the water / rod tip
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(px + 5.5 + girlLeanX, py - 18, 1.4, 2.0, 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Catchlight in eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px + 5.8 + girlLeanX, py - 18.5, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Soft rosy cheek blush
    ctx.fillStyle = 'rgba(244, 114, 182, 0.55)';
    ctx.beginPath();
    ctx.ellipse(px + 4.5 + girlLeanX, py - 15.5, 2.2, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 5.1 DARK MODE: SAME ANIME GIRL WITH BBQ SKEWER & 10S ROAST/EAT ANIMATION
  drawPersonCampfire(ctx, W, H, time, opacity) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

    // EXACT SAME location on the meadow ground
    const px = W * 0.125;
    const py = H * 0.745;
    const fireX = px + 45;
    const fireY = py + 4;

    // 10s BBQ Skewer Cycle:
    // 0s - 6.5s: Roasting skewer over campfire embers
    // 6.5s - 7.4s: Bringing skewer to mouth
    // 7.4s - 8.6s: Eating from skewer ("10s làm động tác ăn thịt nướng từ xiên") with cute chewing & happy smile
    // 8.6s - 10.0s: Extending skewer back to campfire to roast more ("và sau đó đem ra nướng tiếp")
    const cycleDuration = 10000;
    const cycleTimeNight = time % cycleDuration;

    let armEndX = px + 18;
    let armEndY = py - 3;
    let skewerEndX = fireX - 12 + Math.sin(time * 0.003) * 2;
    let skewerEndY = fireY - 12 + Math.sin(time * 0.004) * 1.5;
    let isEating = false;

    if (cycleTimeNight < 6500) {
      // Roasting over campfire
      isEating = false;
    } else if (cycleTimeNight < 7400) {
      // Bringing up to mouth
      const t = (cycleTimeNight - 6500) / 900;
      const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
      armEndX = lerp(px + 18, px + 5, ease);
      armEndY = lerp(py - 3, py - 9, ease);
      skewerEndX = lerp(fireX - 12, px + 8.5, ease);
      skewerEndY = lerp(fireY - 12, py - 14.5, ease);
      isEating = false;
    } else if (cycleTimeNight < 8600) {
      // Eating / Taking bites! ("làm động tác ăn thịt nướng")
      armEndX = px + 5;
      armEndY = py - 9;
      skewerEndX = px + 8.5;
      skewerEndY = py - 14.5;
      isEating = true;
    } else {
      // Returning back to campfire ("đem ra nướng tiếp")
      const t = (cycleTimeNight - 8600) / 1400;
      const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
      armEndX = lerp(px + 5, px + 18, ease);
      armEndY = lerp(py - 9, py - 3, ease);
      skewerEndX = lerp(px + 8.5, fireX - 12, ease);
      skewerEndY = lerp(py - 14.5, fireY - 12, ease);
      isEating = false;
    }

    // 1. INVERSE-SQUARE AMBER GROUND ILLUMINATION
    const groundGlow = ctx.createRadialGradient(fireX, fireY, 6, fireX, fireY, 260);
    groundGlow.addColorStop(0, 'rgba(255, 180, 80, 0.95)');
    groundGlow.addColorStop(0.12, 'rgba(249, 115, 22, 0.72)');
    groundGlow.addColorStop(0.32, 'rgba(217, 119, 6, 0.40)');
    groundGlow.addColorStop(0.60, 'rgba(146, 64, 14, 0.14)');
    groundGlow.addColorStop(0.85, 'rgba(67, 20, 7, 0.04)');
    groundGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.save();
    ctx.fillStyle = groundGlow;
    ctx.beginPath();
    ctx.ellipse(fireX, fireY + 8, 250, 120, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Lake Water Edge Firelight Shimmer
    const lakeReflect = ctx.createRadialGradient(fireX, fireY - 24, 4, fireX, fireY - 24, 75);
    lakeReflect.addColorStop(0, 'rgba(249, 115, 22, 0.35)');
    lakeReflect.addColorStop(0.6, 'rgba(217, 119, 6, 0.10)');
    lakeReflect.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lakeReflect;
    ctx.beginPath();
    ctx.ellipse(fireX, fireY - 24, 75, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. CAMPFIRE STONE HEARTH & FIREWOOD
    const stoneColors = ['#44403c', '#292524', '#57534e', '#3f3f46'];
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const sx = fireX + Math.cos(angle) * 24;
      const sy = fireY + Math.sin(angle) * 10 + 2;
      ctx.fillStyle = stoneColors[i % stoneColors.length];
      ctx.beginPath();
      ctx.ellipse(sx, sy, 5.5, 3.2, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    // Criss-Crossed Radial Firewood Branches
    const logAngles = [0.2, 0.9, 1.8, 2.7, 3.8, 5.0];
    logAngles.forEach(ang => {
      ctx.save();
      ctx.translate(fireX, fireY);
      ctx.rotate(ang);
      ctx.fillStyle = '#271406';
      ctx.beginPath();
      ctx.roundRect(-20, -3.0, 40, 6, 2.5);
      ctx.fill();
      ctx.fillStyle = 'rgba(249, 115, 22, 0.65)';
      ctx.fillRect(-7, -1.5, 14, 3);
      ctx.restore();
    });

    // Glowing Ember Bed in hearth center
    const emberBed = ctx.createRadialGradient(fireX, fireY, 2, fireX, fireY, 15);
    emberBed.addColorStop(0, '#fef08a');
    emberBed.addColorStop(0.4, '#ea580c');
    emberBed.addColorStop(1, '#451a03');
    ctx.fillStyle = emberBed;
    ctx.beginPath();
    ctx.ellipse(fireX, fireY, 14, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. VIBRANT STYLIZED ANIME CAMPFIRE FLAMES
    const wave1 = Math.sin(time * 0.022) * 3.5;
    const wave2 = Math.cos(time * 0.031) * 2.8;
    const wave3 = Math.sin(time * 0.045) * 1.8;

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(fireX - 14, fireY + 2);
    ctx.quadraticCurveTo(fireX - 20 + wave1, fireY - 20, fireX - 3 + wave2, fireY - 42 + wave1);
    ctx.quadraticCurveTo(fireX + 7 + wave3, fireY - 25, fireX + 14, fireY + 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(fireX - 10, fireY);
    ctx.quadraticCurveTo(fireX - 12 + wave2, fireY - 16, fireX + wave1, fireY - 34 + wave2);
    ctx.quadraticCurveTo(fireX + 12 + wave1, fireY - 16, fireX + 10, fireY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(fireX - 5, fireY - 2);
    ctx.quadraticCurveTo(fireX - 7 + wave3, fireY - 14, fireX - 1 + wave1, fireY - 26 + wave3);
    ctx.quadraticCurveTo(fireX + 7 + wave2, fireY - 12, fireX + 5, fireY - 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(fireX, fireY - 4, 3.2, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Floating Rising Embers & Sparks
    this.embers.forEach(em => {
      em.life += 0.018;
      if (em.life > 1.0) {
        em.life = 0;
        em.x = fireX + (Math.random() - 0.5) * 14;
        em.y = fireY - 8;
        em.vx = (Math.random() - 0.5) * 1.0;
        em.vy = -1.4 - Math.random() * 2.0;
      }
      em.x += em.vx + Math.sin(time * 0.005 + em.y * 0.05) * 0.4;
      em.y += em.vy;

      const alpha = (1.0 - em.life) * 0.95;
      const size = em.size * (1.0 - em.life * 0.4);

      ctx.fillStyle = `rgba(254, 240, 138, ${alpha})`;
      ctx.beginPath();
      ctx.arc(em.x, em.y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. SAME FEMALE ANIME CHARACTER SEATED BY CAMPFIRE
    // Soft shadow cast behind her
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(px - 8, py + 15, 14, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Folded Legs seated on the meadow (identical pose)
    ctx.fillStyle = '#1e293b'; // dark trousers
    ctx.beginPath();
    ctx.ellipse(px + 2, py + 12, 11, 7, 0.15, 0, Math.PI * 2);
    ctx.fill();
    // Warm firelight rim on knees facing the campfire
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(px + 9, py + 11, 5.5, 4.5, 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Leather boot resting on grass
    ctx.fillStyle = '#5c2b0e';
    ctx.beginPath();
    ctx.ellipse(px + 12, py + 15, 5.5, 3.2, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Torso / Terracotta Red Sweater (identical Ghibli outfit)
    ctx.fillStyle = '#991b1b'; // Base shadow side
    ctx.beginPath();
    ctx.ellipse(px - 2, py + 1, 9, 12, 0.12, 0, Math.PI * 2);
    ctx.fill();
    // Warm firelight highlight on front facing fire
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(px + 2, py + 1, 6.5, 11, 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Ivory Scarf warmly lit by fire
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.ellipse(px + 2, py - 9, 7.5, 4.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Scarf tail
    ctx.beginPath();
    ctx.moveTo(px - 3, py - 8);
    ctx.quadraticCurveTo(px - 10, py - 3, px - 11, py + 5);
    ctx.lineTo(px - 7, py + 6);
    ctx.quadraticCurveTo(px - 6, py - 2, px - 1, py - 7);
    ctx.closePath();
    ctx.fill();

    // ── Animated Arm holding the Barbecue Skewer ──
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(px + 2, py - 4);
    ctx.quadraticCurveTo((px + armEndX) * 0.5, (py + armEndY) * 0.5 - 3, armEndX, armEndY);
    ctx.stroke();

    // Hand holding skewer
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(armEndX, armEndY, 3.0, 0, Math.PI * 2);
    ctx.fill();

    // ── Barbecue Skewer (Xiên Thịt Nướng Thơm Phức) ──
    ctx.strokeStyle = '#d97706'; // Bamboo skewer stick
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(armEndX - 3, armEndY + 2);
    ctx.lineTo(skewerEndX, skewerEndY);
    ctx.stroke();

    // Meat cubes and charred bell pepper pieces on the skewer
    const meatCount = 3;
    for (let m = 0; m < meatCount; m++) {
      const frac = 0.45 + (m / meatCount) * 0.50;
      const mx = lerp(armEndX, skewerEndX, frac);
      const my = lerp(armEndY, skewerEndY, frac);

      // Grilled meat cube
      ctx.fillStyle = '#9a3412';
      ctx.beginPath();
      ctx.roundRect(mx - 3.5, my - 3.5, 7, 7, 2);
      ctx.fill();

      // Fire glaze highlight
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(mx - 2, my - 2.5, 4, 2.5);

      // Charred BBQ grill marks
      ctx.fillStyle = '#451a03';
      ctx.fillRect(mx - 2.5, my + 1, 5, 1.2);

      // Charred green pepper piece between meats
      if (m < 2) {
        const pxFrac = frac + 0.12;
        const pmx = lerp(armEndX, skewerEndX, pxFrac);
        const pmy = lerp(armEndY, skewerEndY, pxFrac);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(pmx - 2, pmy - 2, 4, 4);
        ctx.fillStyle = '#14532d';
        ctx.fillRect(pmx - 1, pmy + 1, 3, 1);
      }
    }

    // Little wisps of fragrant steam rising from sizzling BBQ
    if (!isEating) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.0;
      const steamY1 = skewerEndY - 4 - ((time * 0.02) % 18);
      ctx.beginPath();
      ctx.moveTo(skewerEndX - 6, skewerEndY - 4);
      ctx.quadraticCurveTo(skewerEndX - 3, steamY1, skewerEndX - 8, steamY1 - 6);
      ctx.stroke();
    }

    // ── Female Anime Head, Hair & Profile (Identical Model) ──
    const hairSwayNight = Math.sin(time * 0.002) * 1.8;

    // Ponytail behind her head
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(px - 3, py - 20);
    ctx.bezierCurveTo(px - 14, py - 26 + hairSwayNight, px - 22, py - 18 + hairSwayNight, px - 24, py - 8 + hairSwayNight);
    ctx.bezierCurveTo(px - 18, py - 6 + hairSwayNight, px - 11, py - 14, px - 2, py - 16);
    ctx.closePath();
    ctx.fill();

    // Hair ribbon
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(px - 3, py - 19, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Base head
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(px + 1, py - 18, 8.5, 0, Math.PI * 2);
    ctx.fill();

    // Porcelain Peach Face Profile warmly bathed in campfire light
    const chewOffset = isEating ? Math.sin(time * 0.02) * 1.4 : 0;
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.moveTo(px + 1, py - 24);
    ctx.lineTo(px + 6, py - 22);
    ctx.lineTo(px + 8, py - 18); // cute nose tip
    ctx.lineTo(px + 6 + chewOffset * 0.6, py - 15);
    ctx.lineTo(px + 5 + chewOffset * 0.4, py - 12); // chin
    ctx.lineTo(px + 1, py - 11);
    ctx.closePath();
    ctx.fill();

    // Bangs
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(px - 1, py - 25);
    ctx.quadraticCurveTo(px + 4, py - 25, px + 6, py - 20);
    ctx.lineTo(px + 4, py - 19);
    ctx.quadraticCurveTo(px + 2, py - 22, px - 1, py - 22);
    ctx.fill();

    // Eye expression:
    if (isEating) {
      // Cute Anime Happy Eating Closed Smile Eye (^.^)
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(px + 5.6, py - 17.5, 2.2, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();

      // Extra happy blush pink while eating
      ctx.fillStyle = 'rgba(244, 114, 182, 0.75)';
      ctx.beginPath();
      ctx.ellipse(px + 4.8, py - 15.0, 2.8, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Little happy food sparkle / musical note ♪
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('♪', px + 14, py - 24 + Math.sin(time * 0.005) * 2);
    } else {
      // Expressive gentle anime eye watching the fire
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.ellipse(px + 5.5, py - 18, 1.4, 2.0, 0.1, 0, Math.PI * 2);
      ctx.fill();
      // Warm fire reflection twinkle in her eye
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(px + 5.8, py - 18.5, 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Warm firelight glow blush on cheek
      ctx.fillStyle = 'rgba(249, 115, 22, 0.65)';
      ctx.beginPath();
      ctx.ellipse(px + 5.0, py - 15.5, 2.4, 1.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 6. ANIMATED BROWN DEER (Authentic 2D Anime Forest Fawn)
  drawDeer(ctx, W, H, time) {
    const isAutumn = this.seasonProgress >= 1.6 && this.seasonProgress <= 2.5;

    const bx = W * this.deer.xRatio;
    const by = H * this.deer.yRatio;

    const breathe = Math.sin(time * 0.003) * 1.8;
    const earTwitch = Math.sin(time * 0.006) * 2.8;
    const headLift = this.deer.isPerked ? -12 : 0;

    ctx.save();
    ctx.translate(bx, by + breathe);

    // Soft ground shadow under deer
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 26, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Slender Articulated Legs with Dark Hooves ──
    ctx.fillStyle = '#854d0e'; // Back left leg
    ctx.beginPath();
    ctx.moveTo(-11, 8);
    ctx.quadraticCurveTo(-14, 16, -13, 23);
    ctx.lineTo(-10, 23);
    ctx.quadraticCurveTo(-11, 16, -8, 8);
    ctx.fill();

    ctx.fillStyle = '#854d0e'; // Back right leg
    ctx.beginPath();
    ctx.moveTo(10, 7);
    ctx.quadraticCurveTo(12, 16, 14, 23);
    ctx.lineTo(17, 23);
    ctx.quadraticCurveTo(15, 16, 13, 7);
    ctx.fill();

    // Front legs with gentle shoulder curve
    ctx.fillStyle = '#9a3412'; // Foreleg left (warm brown)
    ctx.beginPath();
    ctx.moveTo(-14, 9);
    ctx.quadraticCurveTo(-17, 17, -16, 24);
    ctx.lineTo(-13, 24);
    ctx.quadraticCurveTo(-14, 17, -11, 9);
    ctx.fill();

    ctx.fillStyle = '#9a3412'; // Foreleg right (warm brown)
    ctx.beginPath();
    ctx.moveTo(7, 8);
    ctx.quadraticCurveTo(8, 17, 10, 24);
    ctx.lineTo(13, 24);
    ctx.quadraticCurveTo(11, 17, 10, 8);
    ctx.fill();

    // Dark neat hooves
    ctx.fillStyle = '#292524';
    ctx.fillRect(-16.5, 23, 3.5, 2.5);
    ctx.fillRect(-13.5, 22, 3.5, 2.5);
    ctx.fillRect(9.5, 23, 3.5, 2.5);
    ctx.fillRect(13.5, 22, 3.5, 2.5);

    // ── Torso (Warm Chestnut Brown Anime Coat) ──
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.moveTo(-18, 5);
    ctx.bezierCurveTo(-22, -4, -14, -12, -2, -11);
    ctx.bezierCurveTo(8, -10, 18, -4, 18, 5);
    ctx.bezierCurveTo(18, 12, 4, 13, -2, 12);
    ctx.bezierCurveTo(-10, 11, -16, 11, -18, 5);
    ctx.closePath();
    ctx.fill();

    // Cream / Ivory Soft Underbelly & Chest
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.moveTo(-8, 5);
    ctx.bezierCurveTo(0, 11, 8, 10, 12, 5);
    ctx.bezierCurveTo(8, 7, 0, 7, -8, 5);
    ctx.fill();

    // Delicate white fawn spots along the upper back
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    const spots = [
      { x: -10, y: -6, r: 1.2 }, { x: -5, y: -8, r: 1.4 }, { x: 0, y: -7, r: 1.3 },
      { x: 5, y: -5, r: 1.2 }, { x: 9, y: -3, r: 1.1 }, { x: -3, y: -4, r: 1.2 }
    ];
    spots.forEach(sp => {
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Short tail (Brown with white underside)
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.ellipse(18, 2, 4, 7, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(19, 3, 2.5, 5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // ── Graceful Arched Neck & Chest Flare ──
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.bezierCurveTo(-18, -12 + headLift * 0.5, -20, -26 + headLift, -22, -34 + headLift);
    ctx.lineTo(-14, -34 + headLift);
    ctx.bezierCurveTo(-11, -22 + headLift * 0.5, -6, -10, 0, -2);
    ctx.closePath();
    ctx.fill();

    // Cream throat patch
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.moveTo(-16, -14 + headLift * 0.5);
    ctx.bezierCurveTo(-18, -24 + headLift, -18, -30 + headLift, -17, -33 + headLift);
    ctx.lineTo(-14, -33 + headLift);
    ctx.bezierCurveTo(-13, -24 + headLift, -11, -16, -9, -10);
    ctx.closePath();
    ctx.fill();

    // ── Gentle Anime Doe Head ──
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.ellipse(-22, -34 + headLift, 9.5, 6.5, -0.35, 0, Math.PI * 2);
    ctx.fill();

    // Slender muzzle & dark nose tip
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(-28, -32 + headLift, 4.2, 3.2, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1917'; // nose
    ctx.beginPath();
    ctx.arc(-30.5, -32.5 + headLift, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Large, Sweet Anime Doe Eye
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(-23, -36 + headLift, 2.4, 3.0, 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Catchlight twinkle in eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-22.2, -37 + headLift, 0.9, 0, Math.PI * 2);
    ctx.arc(-23.5, -35.2 + headLift, 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Long attentive brown ear with cream inner fluff
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.ellipse(-14, -43 + headLift + earTwitch, 3.8, 9, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(-14.5, -43 + headLift + earTwitch, 2.0, 6.5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Elegant Branching Antlers in Autumn
    if (isAutumn) {
      ctx.strokeStyle = '#52290a';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      // Main beam
      ctx.moveTo(-19, -41 + headLift);
      ctx.quadraticCurveTo(-23, -52 + headLift, -25, -64 + headLift);
      // Tines
      ctx.moveTo(-21, -49 + headLift);
      ctx.lineTo(-29, -56 + headLift);
      ctx.moveTo(-23, -56 + headLift);
      ctx.lineTo(-17, -62 + headLift);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 6.1 ANIMATED PURE WHITE RABBIT (Chubby Fluffy Anime Bunny)
  drawRabbit(ctx, W, H, time) {
    const bx = W * this.rabbit.xRatio;
    const by = H * this.rabbit.yRatio;

    let hopY = 0;
    if (this.rabbit.isBouncing) {
      hopY = -Math.abs(Math.sin(time * 0.02)) * 16;
    }
    const breathe = Math.sin(time * 0.004 + 1) * 1.0;
    const earWiggle = Math.sin(time * 0.008) * 2.0;

    ctx.save();
    ctx.translate(bx, by + hopY + breathe);

    // Soft ground shadow under rabbit
    ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
    ctx.beginPath();
    ctx.ellipse(0, 11, 14, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Pure White Fluffy Body & Haunch ──
    // Subtle shadow underbody
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.ellipse(1, 4, 13, 9.5, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Main snowy white coat
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 2, 12.5, 9, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Tucked front paws on the grass
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-7, 9, 3.5, 2.2, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Fluffy round cotton-ball tail
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(12, 1, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.arc(12, 2.5, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // ── Chubby Round Anime Bunny Head ──
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-8, -4, 8, 7.5, 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Soft pink twitching nose
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(-15, -3, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Delicate bunny mouth line
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-15, -1.6);
    ctx.lineTo(-14, 0.2);
    ctx.stroke();

    // Big, Shiny Anime Bunny Eye
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(-10.5, -6, 2.0, 2.5, 0.05, 0, Math.PI * 2);
    ctx.fill();
    // Catchlight sparkles in eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-9.8, -6.8, 0.9, 0, Math.PI * 2);
    ctx.arc(-11.0, -5.2, 0.45, 0, Math.PI * 2);
    ctx.fill();

    // ── Upright Soft Ears with Pink Inner Ear ──
    // Left ear (behind)
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.ellipse(-4, -17 + earWiggle * 0.7, 2.6, 9.5, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Right ear (front)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-7, -16 + earWiggle, 3.0, 9.5, -0.22, 0, Math.PI * 2);
    ctx.fill();
    // Soft warm-pink inner ear fluff
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(-7, -16 + earWiggle, 1.6, 6.8, -0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 7. SEASONAL WEATHER PARTICLES (Sakura, Sunbeams, Momiji, Snow)
  drawWeatherParticles(ctx, W, H, time) {
    const seasonType = Math.floor(this.seasonProgress + 0.5);

    this.particles.forEach((p, idx) => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.angle += p.rotSpeed;

      if (p.x > 1.05) p.x = -0.05;
      if (p.y > 1.05) p.y = -0.05;

      const px = (p.x + Math.sin(time * 0.001 * p.swayFreq + p.phase) * p.swayAmp) * W;
      const py = p.y * H;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(p.angle);

      if (seasonType === 0) {
        // Spring: Pink Sakura Petal
        ctx.fillStyle = 'rgba(251, 207, 232, 0.85)';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (seasonType === 1) {
        // Summer: Golden Sunbeam Dust Mote
        ctx.fillStyle = 'rgba(254, 240, 138, 0.75)';
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (seasonType === 2) {
        // Autumn: Red/Amber Momiji Leaf
        ctx.fillStyle = (idx % 2 === 0) ? 'rgba(239, 68, 68, 0.85)' : 'rgba(245, 158, 11, 0.85)';
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.6, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.6, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        // Winter: White Snowflake
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  // 8. RIGHT-SIDE ATMOSPHERIC MIST (Studio Ghibli Aerial Perspective)
  drawRightGradientShield(ctx, W, H) {
    // Studio Ghibli style: The entire landscape is 100% continuous and full-bleed across the screen.
    // A feather-light, sheer atmospheric mist feathers gently over the right content pane
    // to provide optimal text contrast while keeping all mountains, sky, pine ridges,
    // and valley mist vividly visible beneath the translucent glass UI cards.
    const darkR = 15, darkG = 14, darkB = 13;
    const lightR = 255, lightG = 255, lightB = 255;
    
    const r = Math.round(lerp(lightR, darkR, this.darkFactor));
    const g = Math.round(lerp(lightG, darkG, this.darkFactor));
    const b = Math.round(lerp(lightB, darkB, this.darkFactor));

    if (W < 1024) {
      // Mobile screens: Gentle sheer atmospheric veil (10% light, 18% dark), completely transparent to the painting
      const mobAlpha = lerp(0.10, 0.18, this.darkFactor);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${mobAlpha})`;
      ctx.fillRect(0, 0, W, H);
      return;
    }
    
    // Desktop: Left ~28% is pure crystal anime focal clearing (sacred lake, mossy island, tree, deer, campfire).
    // From W * 0.28 across to W, a feather-light gradient veil provides delicate softening
    // with NO solid opaque white block.
    const shield = ctx.createLinearGradient(W * 0.28, 0, W, 0);
    const maxAlpha = lerp(0.10, 0.18, this.darkFactor);

    shield.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
    shield.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${maxAlpha * 0.4})`);
    shield.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${maxAlpha})`);

    ctx.fillStyle = shield;
    ctx.fillRect(W * 0.28, 0, W * 0.72, H);
  }

  animate() {
    if (!this.isRunning) return;
    this.animId = requestAnimationFrame((t) => {
      this.render(t);
      this.animate();
    });
  }

  destroy() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    this.audio.destroy();
  }
}
