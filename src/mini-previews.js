/**
 * MiniThreePreviewEngine
 * Ultra-performance 60 FPS visual preview simulations for all 12 ThreeUI scenes.
 * Fully GPU-vectorized, zero-CPU shadowBlur overhead, lightweight memory footprint.
 */
export class MiniThreePreviewEngine {
  constructor() {
    this.items = [];
    this.animationFrameId = null;
    this.isRunning = false;
    this.isInitialized = false;
    this.startTime = Date.now();
  }

  init(containerEl) {
    if (!containerEl) return;
    this.stop();
    this.items = [];

    const canvasElements = containerEl.querySelectorAll('.mini-preview-canvas');
    // Cap DPR at 1.25 for small preview canvases to reduce pixel rasterization by 4x
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);

    canvasElements.forEach(canvas => {
      const idx = parseInt(canvas.getAttribute('data-preview-idx'), 10);
      const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const width = Math.round(rect.width || 170);
        const height = Math.round(rect.height || 106);

        if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
          canvas.width = Math.round(width * dpr);
          canvas.height = Math.round(height * dpr);
        }

        this.items.push({
          canvas,
          ctx,
          idx,
          w: width,
          h: height,
          dpr
        });
      }
    });

    this.isInitialized = true;
    this.start();
  }

  start() {
    if (this.isRunning || !this.items.length) return;
    this.isRunning = true;
    this.startTime = Date.now();

    const loop = () => {
      if (!this.isRunning) return;
      this.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  render() {
    const isDark = document.documentElement.classList.contains('dark');
    const primary = isDark ? '#38BDF8' : '#C2410C';
    const secondary = isDark ? '#34D399' : '#FB923C';
    const accent = isDark ? '#A855F7' : '#EA580C';
    const time = (Date.now() - this.startTime) * 0.0016;

    const itemCount = this.items.length;
    for (let i = 0; i < itemCount; i++) {
      const item = this.items[i];
      const { canvas, ctx, w, h, idx, dpr } = item;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      // Deep cosmic gradient background for each card preview
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 5, w / 2, h / 2, Math.max(w, h) * 0.7);
      bgGrad.addColorStop(0, isDark ? 'rgba(20, 26, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)');
      bgGrad.addColorStop(1, isDark ? 'rgba(8, 10, 16, 0.98)' : 'rgba(240, 237, 230, 0.98)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      switch (idx) {
        case 0:
          this.drawTorusKnot(ctx, cx, cy, time, primary, secondary);
          break;
        case 1:
          this.drawWaveGrid(ctx, w, h, time, primary, secondary);
          break;
        case 2:
          this.drawCosmicNetwork(ctx, w, h, time, primary, secondary);
          break;
        case 3:
          this.drawGlassSpheres(ctx, cx, cy, time, primary, secondary);
          break;
        case 4:
          this.drawBlackHole(ctx, cx, cy, time, primary, secondary);
          break;
        case 5:
          this.drawWarpTunnel(ctx, cx, cy, time, primary, secondary);
          break;
        case 6:
          this.drawDNAHelix(ctx, cx, cy, time, primary, secondary);
          break;
        case 7:
          this.drawSilkRibbon(ctx, w, h, time, primary, secondary);
          break;
        case 8:
          this.drawMatrixRain(ctx, w, h, time, isDark ? '#10B981' : '#059669');
          break;
        case 9:
          this.drawFlowField(ctx, w, h, time, primary, accent);
          break;
        case 10:
          this.drawSupernova(ctx, cx, cy, time, primary, secondary);
          break;
        case 11:
          this.drawMonoliths(ctx, cx, cy, time, primary, secondary);
          break;
      }

      ctx.restore();
    }
  }

  // 1. Hologram Torus Knot
  drawTorusKnot(ctx, cx, cy, time, primary, secondary) {
    const p = 2;
    const q = 3;
    const steps = 70;
    const scale = 11.2;
    const rotX = time * 0.25;
    const rotY = time * 0.35;

    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const phi = (i / steps) * Math.PI * 2;
      const r = Math.cos(q * phi) * 0.6 + 1.8;
      const x = r * Math.cos(p * phi) * scale;
      const y = r * Math.sin(p * phi) * scale;
      const z = -Math.sin(q * phi) * scale * 1.4;

      const x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
      const z1 = x * Math.sin(rotY) + z * Math.cos(rotY);
      const y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);

      pts.push({ x: cx + x1, y: cy + y2 });
    }

    // Outer glow stroke (hardware accelerated, zero shadowBlur)
    ctx.strokeStyle = primary;
    ctx.lineWidth = 3.4;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    pts.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // Crisp inner stroke
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.95;
    ctx.stroke();

    // Orbiting Stardust Particles
    ctx.fillStyle = secondary;
    ctx.globalAlpha = 0.85;
    for (let d = 0; d < 10; d++) {
      const angle = d * 0.85 + time * 0.9;
      const rad = 27 + Math.sin(d * 1.5 + time) * 5;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad * 0.65, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Cyber Wave Grid (3D perspective undulating wireframe)
  drawWaveGrid(ctx, w, h, time, primary, secondary) {
    const lines = 6;
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = primary;
    ctx.globalAlpha = 0.85;

    // Longitudinal sine curves with perspective
    for (let i = 0; i < lines; i++) {
      const factor = (i + 1) / (lines + 1);
      const baseY = h * 0.4 + factor * (h * 0.54);
      const amplitude = 3 + factor * 4.5;

      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const wave = Math.sin(x * 0.05 + time * 3.2 + i * 0.85) * amplitude;
        const y = baseY + wave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Perspective converging rays
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = secondary;
    ctx.globalAlpha = 0.4;
    const cols = 8;
    const vanishY = h * 0.32;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(w / 2 + (c - cols / 2) * (w * 0.04), vanishY);
      ctx.lineTo((c / cols) * w, h);
      ctx.stroke();
    }
  }

  // 3. Cosmic Constellation Network
  drawCosmicNetwork(ctx, w, h, time, primary, secondary) {
    const nodeCount = 8;
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      const a = i * 1.6 + time * 0.65;
      const b = i * 2.3 + time * 0.55;
      const x = (w * 0.5) + Math.cos(a) * (w * 0.33);
      const y = (h * 0.5) + Math.sin(b) * (h * 0.31);
      nodes.push({ x, y });
    }

    // Dynamic Connection Beams
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = secondary;
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 48) {
          ctx.globalAlpha = Math.max(0.12, 1 - dist / 48);
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Glowing Star Nodes
    nodes.forEach((n, idx) => {
      const color = idx % 2 === 0 ? primary : secondary;
      // Soft corona
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 5.2, 0, Math.PI * 2);
      ctx.fill();

      // Sharp core
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 4. Floating Glass Spheres
  drawGlassSpheres(ctx, cx, cy, time, primary, secondary) {
    const spheres = [
      { x: -55, y: -22, r: 7.5, speed: 0.9, phase: 0 },
      { x: 50, y: -24, r: 8.0, speed: 0.8, phase: 1.5 },
      { x: -45, y: 22, r: 6.5, speed: 1.1, phase: 3.2 },
      { x: 48, y: 20, r: 7.0, speed: 0.95, phase: 2.1 },
      { x: -12, y: -26, r: 6.0, speed: 1.2, phase: 4.0 },
      { x: 14, y: 25, r: 6.5, speed: 1.0, phase: 5.1 },
      { x: 0, y: 0, r: 9.0, speed: 0.7, phase: 0.8 }
    ];

    spheres.forEach((s, idx) => {
      const y = cy + s.y + Math.sin(time * s.speed + s.phase) * 3.5;
      const x = cx + s.x;

      // Radial Glass Body
      const grad = ctx.createRadialGradient(x - s.r * 0.35, y - s.r * 0.35, s.r * 0.1, x, y, s.r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, idx % 2 === 0 ? primary : secondary);
      grad.addColorStop(0.85, 'rgba(15, 23, 42, 0.7)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.9)');

      ctx.globalAlpha = 0.88;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fill();

      // Glass Specular Rim
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.stroke();

      // Crescent light reflection
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(x, y, s.r * 0.75, -Math.PI * 0.75, -Math.PI * 0.25);
      ctx.stroke();
    });
  }

  // 5. Black Hole Singularity
  drawBlackHole(ctx, cx, cy, time, primary, secondary) {
    // Event horizon (pitch black center)
    ctx.fillStyle = '#020202';
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.fill();

    // Blazing photon sphere ring
    ctx.strokeStyle = primary;
    ctx.lineWidth = 2.4;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Swirling accretion disk particles in perspective
    const count = 28;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + time * 1.8 + (i % 3) * 0.4;
      const r = 14 + (i % 12) * 1.4;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * (r * 0.42);

      ctx.fillStyle = i % 2 === 0 ? primary : secondary;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 6. Hyperspace Warp Tunnel
  drawWarpTunnel(ctx, cx, cy, time, primary, secondary) {
    const starCount = 32;
    ctx.lineWidth = 1.5;

    for (let i = 0; i < starCount; i++) {
      const angle = (i / starCount) * Math.PI * 2 + time * 0.25;
      const speed = 0.85 + (i % 5) * 0.25;
      const progress = ((time * speed + i * 0.16) % 1.0);
      const r1 = progress * 38;
      const r2 = r1 + 5 + progress * 15;

      const x1 = cx + Math.cos(angle) * r1;
      const y1 = cy + Math.sin(angle) * (r1 * 0.72);
      const x2 = cx + Math.cos(angle) * r2;
      const y2 = cy + Math.sin(angle) * (r2 * 0.72);

      ctx.strokeStyle = i % 2 === 0 ? primary : secondary;
      ctx.globalAlpha = 0.2 + progress * 0.75;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Warp Rings expanding outward
    for (let ring = 1; ring <= 3; ring++) {
      const r = ((time * 20 + ring * 13) % 42);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 0.9;
      ctx.globalAlpha = 1 - r / 42;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 7. DNA Double Helix
  drawDNAHelix(ctx, cx, cy, time, primary, secondary) {
    const count = 13;
    const spacing = 4.6;
    const startY = cy - (count * spacing) / 2;
    const radius = 19;

    for (let i = 0; i < count; i++) {
      const y = startY + i * spacing;
      const angle = i * 0.5 + time * 2.2;
      const x1 = cx + Math.cos(angle) * radius;
      const x2 = cx + Math.cos(angle + Math.PI) * radius;
      const z = Math.sin(angle);

      // Connecting ladder rung
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();

      // Strand A Node
      ctx.fillStyle = primary;
      ctx.globalAlpha = 0.65 + (z + 1) * 0.2;
      ctx.beginPath();
      ctx.arc(x1, y, 2.2 + z * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Strand B Node
      ctx.fillStyle = secondary;
      ctx.globalAlpha = 0.65 - (z - 1) * 0.2;
      ctx.beginPath();
      ctx.arc(x2, y, 2.2 - z * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 8. Digital Silk Ribbon
  drawSilkRibbon(ctx, w, h, time, primary, secondary) {
    const cy = h / 2;
    const steps = 26;

    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * w;
      const wave = Math.sin(x * 0.05 + time * 2.8) * 12;
      const y = cy + wave - 7;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let i = steps; i >= 0; i--) {
      const x = (i / steps) * w;
      const wave = Math.sin(x * 0.05 + time * 2.8 + 0.6) * 12;
      const y = cy + wave + 7;
      ctx.lineTo(x, y);
    }
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, primary);
    grad.addColorStop(1, secondary);

    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.32;
    ctx.fill();

    ctx.strokeStyle = primary;
    ctx.globalAlpha = 0.88;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // 9. Matrix Cyber Rain
  drawMatrixRain(ctx, w, h, time, color) {
    const cols = 8;
    const colWidth = w / cols;

    for (let c = 0; c < cols; c++) {
      const x = c * colWidth + colWidth / 2;
      const speed = 8 + (c % 4) * 3;
      const headY = ((time * speed + c * 16) % (h + 28)) - 14;

      for (let d = 0; d < 5; d++) {
        const y = headY - d * 5.2;
        if (y > 0 && y < h) {
          const alpha = 1.0 - d * 0.18;
          ctx.globalAlpha = Math.max(alpha, 0.1);
          ctx.fillStyle = d === 0 ? '#ffffff' : color;
          ctx.fillRect(x - 1.1, y - 2, 2.2, 3.8);
        }
      }
    }
  }

  // 10. Flow Field Fluid (3D Vector Fluid Stream - Orange Theme)
  drawFlowField(ctx, w, h, time, primary, accent) {
    const count = 14;
    ctx.lineWidth = 1.3;

    for (let i = 0; i < count; i++) {
      const startY = (i / count) * h + 4;
      ctx.strokeStyle = i % 2 === 0 ? '#FB923C' : '#EA580C';
      ctx.globalAlpha = 0.65;
      ctx.beginPath();

      for (let x = 0; x <= w; x += 6) {
        const y = startY + Math.sin(x * 0.04 + time * 2.2 + i * 0.7) * 9 + Math.cos(x * 0.02 + time * 1.4) * 5;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  // 11. Supernova Stellar Ring
  drawSupernova(ctx, cx, cy, time, primary, secondary) {
    const pulse = 1 + Math.sin(time * 2.2) * 0.14;
    const baseR = 20 * pulse;
    const count = 16;

    // Center star with soft corona
    ctx.fillStyle = primary;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(cx, cy, 7 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Pulsing particle halo
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + time * 1.1;
      const r = baseR + Math.sin(i * 1.5 + time * 3) * 2.4;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * (r * 0.72);

      ctx.fillStyle = i % 2 === 0 ? primary : secondary;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Subtle light ray
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }

  // 12. Floating Tech Monoliths
  drawMonoliths(ctx, cx, cy, time, primary, secondary) {
    const count = 5;
    const radius = 22;

    const monoList = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + time * 0.75;
      const x = cx + Math.cos(angle) * radius;
      const z = Math.sin(angle);
      const baseY = cy + z * (radius * 0.35);
      const bob = Math.sin(time * 1.6 + i) * 2.8;
      const y = baseY + bob;
      monoList.push({ x, y, z, i });
    }
    monoList.sort((a, b) => a.z - b.z);

    monoList.forEach(m => {
      const scale = 0.8 + (m.z + 1) * 0.2;
      const w = 6.5 * scale;
      const h = 19 * scale;

      ctx.strokeStyle = primary;
      ctx.lineWidth = 1.1;
      ctx.fillStyle = m.i === 0 ? secondary : 'rgba(255, 255, 255, 0.15)';
      ctx.globalAlpha = 0.5 + (m.z + 1) * 0.25;

      ctx.fillRect(m.x - w / 2, m.y - h / 2, w, h);
      ctx.strokeRect(m.x - w / 2, m.y - h / 2, w, h);
    });
  }
}
