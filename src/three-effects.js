import * as THREE from 'three';

/**
 * ThreeUI Dedicated Website Effects Suite
 * 
 * Includes:
 * 1. ThreeUIHeroArtefact - Interactive 3D physical Torus Knot in the Hero Studio Card
 *    Features: Glass refraction, holographic wireframe, orbiting stardust, drag-to-spin physics
 * 2. ThreeUICursorEngine - Three.js WebGL interactive particle aura with cursor vortex & click shockwave
 * 3. ThreeUISpatialBento - Interactive 3D Icosahedron Crystal in the Bento Skills section
 */

// ============================================================================
// 1. HERO 3D SPATIAL ARTEFACT (STUDIO CARD 3D VIEW)
// ============================================================================
export class ThreeUIHeroArtefact {
  constructor(containerId = 'hero-three-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.drag = { isDragging: false, prevX: 0, prevY: 0, velX: 0, velY: 0 };
    this.rotation = { x: 0.2, y: 0.4 };
    this.isTabActive = true;
    this.isVisible = true;

    this.init();
    this.createScene();
    this.setupEvents();
    this.animate();
  }

  init() {
    this.width = this.container.clientWidth || 320;
    this.height = this.container.clientHeight || 400;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.camera.position.z = 4.2;

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.renderer.domElement.className = 'w-full h-full object-contain cursor-grab active:cursor-grabbing select-none pointer-events-auto';
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);
  }

  createScene() {
    this.meshGroup = new THREE.Group();
    this.scene.add(this.meshGroup);

    // Geometry: Elegant Torus Knot
    const geometry = new THREE.TorusKnotGeometry(1.02, 0.32, 120, 24, 2, 3);

    const isDark = document.documentElement.classList.contains('dark');
    this.material = new THREE.MeshPhysicalMaterial({
      color: isDark ? new THREE.Color('#38BDF8') : new THREE.Color('#EA580C'),
      emissive: isDark ? new THREE.Color('#0369A1') : new THREE.Color('#9A3412'),
      emissiveIntensity: 0.22,
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.6,
      ior: 1.5,
      thickness: 1.2,
      specularIntensity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });

    this.mainMesh = new THREE.Mesh(geometry, this.material);
    this.meshGroup.add(this.mainMesh);

    // Outer Tech Wireframe
    const wireGeom = new THREE.TorusKnotGeometry(1.05, 0.33, 50, 14, 2, 3);
    this.wireMaterial = new THREE.MeshBasicMaterial({
      color: isDark ? new THREE.Color('#34D399') : new THREE.Color('#FB923C'),
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.22 : 0.14
    });
    this.wireMesh = new THREE.Mesh(wireGeom, this.wireMaterial);
    this.meshGroup.add(this.wireMesh);

    // Orbital Stardust Ring
    const particleCount = 45;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 1.85 + Math.random() * 0.7;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.particleMat = new THREE.PointsMaterial({
      color: isDark ? '#34D399' : '#C2410C',
      size: 0.05,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    this.particles = new THREE.Points(particleGeom, particleMat);
    this.meshGroup.add(this.particles);

    // Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.75 : 0.95);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(isDark ? 0x38bdf8 : 0xffedd5, 2.2);
    this.keyLight.position.set(4, 5, 4);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(isDark ? 0x34d399 : 0xfb923c, 1.8);
    this.rimLight.position.set(-4, -3, -2);
    this.scene.add(this.rimLight);
  }

  setupEvents() {
    const resizeObserver = new ResizeObserver(() => this.onResize());
    resizeObserver.observe(this.container);

    const dom = this.renderer.domElement;

    const onPointerMove = (e) => {
      const rect = this.container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      this.mouse.targetX = Math.max(-1.5, Math.min(1.5, x));
      this.mouse.targetY = Math.max(-1.5, Math.min(1.5, y));

      if (this.drag.isDragging) {
        const deltaX = e.clientX - this.drag.prevX;
        const deltaY = e.clientY - this.drag.prevY;
        this.drag.velX = deltaX * 0.008;
        this.drag.velY = deltaY * 0.008;
        this.rotation.y += this.drag.velX;
        this.rotation.x += this.drag.velY;
        this.drag.prevX = e.clientX;
        this.drag.prevY = e.clientY;
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    dom.addEventListener('pointerdown', (e) => {
      this.drag.isDragging = true;
      this.drag.prevX = e.clientX;
      this.drag.prevY = e.clientY;
      this.drag.velX = 0;
      this.drag.velY = 0;
      dom.setPointerCapture(e.pointerId);
    });

    const stopDrag = (e) => {
      if (this.drag.isDragging) {
        this.drag.isDragging = false;
        try { dom.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };

    dom.addEventListener('pointerup', stopDrag);
    dom.addEventListener('pointercancel', stopDrag);

    window.addEventListener('themeChanged', (e) => this.onThemeChange(e.detail.isDark));

    document.addEventListener('visibilitychange', () => {
      this.isTabActive = !document.hidden;
      if (this.isTabActive && this.isVisible) {
        this.animate();
      }
    });

    const observer = new IntersectionObserver((entries) => {
      this.isVisible = entries[0].isIntersecting;
      if (this.isVisible && this.isTabActive) {
        this.animate();
      }
    }, { threshold: 0.1 });
    observer.observe(this.container);
  }

  onThemeChange(isDark) {
    if (!this.material) return;
    this.material.color.set(isDark ? '#38BDF8' : '#EA580C');
    this.material.emissive.set(isDark ? '#0369A1' : '#9A3412');
    if (this.wireMesh) {
      this.wireMesh.material.color.set(isDark ? '#34D399' : '#FB923C');
      this.wireMesh.material.opacity = isDark ? 0.22 : 0.14;
    }
    if (this.particles) {
      this.particles.material.color.set(isDark ? '#34D399' : '#C2410C');
    }
    if (this.keyLight) {
      this.keyLight.color.set(isDark ? 0x38bdf8 : 0xffedd5);
    }
    if (this.rimLight) {
      this.rimLight.color.set(isDark ? 0x34d399 : 0xfb923c);
    }
  }

  onResize() {
    if (!this.container) return;
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    if (this.width === 0 || this.height === 0) return;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  animate() {
    if (!this.isTabActive || !this.isVisible) return;
    this.animId = requestAnimationFrame(() => this.animate());

    if (!this.drag.isDragging) {
      this.drag.velX *= 0.94;
      this.drag.velY *= 0.94;
      this.rotation.y += this.drag.velX + 0.005;
      this.rotation.x += this.drag.velY + 0.002;
    }

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.06;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.06;

    this.meshGroup.rotation.y = this.rotation.y + this.mouse.x * 0.4;
    this.meshGroup.rotation.x = this.rotation.x - this.mouse.y * 0.3;

    const t = performance.now() * 0.0015;
    this.meshGroup.position.y = Math.sin(t) * 0.08;

    if (this.particles) {
      this.particles.rotation.y -= 0.003;
      this.particles.rotation.x += 0.001;
    }

    this.renderer.render(this.scene, this.camera);
  }

  pause() {
    this.isVisible = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  resume() {
    this.isVisible = true;
    this.onResize();
    if (!this.animId) {
      this.animate();
    }
  }
}

// ============================================================================
// 2. THREE.JS WEBGL CURSOR STARDUST & INTERACTIVE SHOCKWAVE ENGINE
// (Smooth 3D particles that gravitate toward cursor & burst on click)
// ============================================================================
export class ThreeUICursorEngine {
  constructor(canvasId = 'ambient-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.mouse = new THREE.Vector2(-999, -999);
    this.targetMouse = new THREE.Vector2(-999, -999);
    this.mouseVelocity = new THREE.Vector2(0, 0);
    this.prevMouse = new THREE.Vector2(-999, -999);
    this.shockwaves = [];
    this.isTabActive = true;

    this.init();
    this.createParticles();
    this.setupEvents();
    this.animate();
  }

  init() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 100);
    this.camera.position.z = 30;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(this.width, this.height);
  }

  createParticles() {
    this.particleCount = 140;
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.particleCount * 3);
    this.originalPositions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.scales = new Float32Array(this.particleCount);

    const isDark = document.documentElement.classList.contains('dark');

    // Scatter particles across true 3D spatial box
    for (let i = 0; i < this.particleCount; i++) {
      const x = (Math.random() - 0.5) * 44;
      const y = (Math.random() - 0.5) * 28;
      const z = (Math.random() - 0.5) * 20;

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;

      this.originalPositions[i * 3] = x;
      this.originalPositions[i * 3 + 1] = y;
      this.originalPositions[i * 3 + 2] = z;

      this.velocities[i * 3] = 0;
      this.velocities[i * 3 + 1] = 0;
      this.velocities[i * 3 + 2] = 0;

      this.scales[i] = 0.5 + Math.random() * 1.5;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    // Custom circle particle texture generated with HTML5 Canvas (high quality, soft edge)
    const texture = this.createParticleTexture();

    this.material = new THREE.PointsMaterial({
      size: 0.45,
      map: texture,
      transparent: true,
      opacity: isDark ? 0.45 : 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: isDark ? new THREE.Color('#38BDF8') : new THREE.Color('#C2410C')
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  createParticleTexture() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  setupEvents() {
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    });

    window.addEventListener('pointermove', (e) => {
      // Map 2D screen coordinate to 3D world plane at z=0
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;

      // Unproject to z=0
      const vec = new THREE.Vector3(normX, normY, 0.5);
      vec.unproject(this.camera);
      vec.sub(this.camera.position).normalize();
      const distance = -this.camera.position.z / vec.z;
      const worldPos = this.camera.position.clone().add(vec.multiplyScalar(distance));

      this.targetMouse.x = worldPos.x;
      this.targetMouse.y = worldPos.y;
    }, { passive: true });

    // Click Shockwave
    window.addEventListener('click', (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;

      const vec = new THREE.Vector3(normX, normY, 0.5);
      vec.unproject(this.camera);
      vec.sub(this.camera.position).normalize();
      const distance = -this.camera.position.z / vec.z;
      const worldPos = this.camera.position.clone().add(vec.multiplyScalar(distance));

      this.shockwaves.push({
        x: worldPos.x,
        y: worldPos.y,
        radius: 0.1,
        maxRadius: 12.0,
        strength: 0.7,
        alpha: 1.0
      });
    });

    window.addEventListener('themeChanged', (e) => {
      const isDark = e.detail.isDark;
      if (this.material) {
        this.material.color.set(isDark ? '#38BDF8' : '#C2410C');
        this.material.opacity = isDark ? 0.45 : 0.28;
      }
    });

    document.addEventListener('visibilitychange', () => {
      this.isTabActive = !document.hidden;
      if (this.isTabActive) this.animate();
    });
  }

  animate() {
    if (!this.isTabActive) return;
    this.animId = requestAnimationFrame(() => this.animate());

    // Mouse velocity calculation
    if (this.prevMouse.x !== -999) {
      this.mouseVelocity.x = this.targetMouse.x - this.prevMouse.x;
      this.mouseVelocity.y = this.targetMouse.y - this.prevMouse.y;
    }
    this.prevMouse.copy(this.targetMouse);

    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.08;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.08;

    const pos = this.geometry.attributes.position.array;
    const time = performance.now() * 0.001;

    // Process active shockwaves
    for (let s = this.shockwaves.length - 1; s >= 0; s--) {
      const sw = this.shockwaves[s];
      sw.radius += 0.35;
      sw.alpha *= 0.94;
      if (sw.radius > sw.maxRadius || sw.alpha < 0.02) {
        this.shockwaves.splice(s, 1);
      }
    }

    // Update each particle with 3D physics
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      let px = pos[i3];
      let py = pos[i3 + 1];
      let pz = pos[i3 + 2];

      const ox = this.originalPositions[i3];
      const oy = this.originalPositions[i3 + 1];
      const oz = this.originalPositions[i3 + 2];

      // Idle drifting
      const driftX = Math.sin(time * 0.3 + i) * 0.015;
      const driftY = Math.cos(time * 0.4 + i * 1.5) * 0.015;

      // Mouse attraction / vortex force
      const dx = this.mouse.x - px;
      const dy = this.mouse.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 8.0 && dist > 0.1) {
        const force = (1.0 - dist / 8.0) * 0.045;
        this.velocities[i3] += dx * force * 0.15;
        this.velocities[i3 + 1] += dy * force * 0.15;
        // Orbit angular momentum
        this.velocities[i3] += -dy * force * 0.1;
        this.velocities[i3 + 1] += dx * force * 0.1;
      }

      // Shockwave repulsion
      for (let s = 0; s < this.shockwaves.length; s++) {
        const sw = this.shockwaves[s];
        const swDx = px - sw.x;
        const swDy = py - sw.y;
        const swDist = Math.sqrt(swDx * swDx + swDy * swDy);
        const ringDiff = Math.abs(swDist - sw.radius);
        if (ringDiff < 2.0 && swDist > 0.01) {
          const push = (1.0 - ringDiff / 2.0) * sw.alpha * sw.strength * 0.25;
          this.velocities[i3] += (swDx / swDist) * push;
          this.velocities[i3 + 1] += (swDy / swDist) * push;
        }
      }

      // Spring restore to original grid position
      const restoreX = (ox - px) * 0.018;
      const restoreY = (oy - py) * 0.018;
      const restoreZ = (oz - pz) * 0.018;

      this.velocities[i3] = (this.velocities[i3] + restoreX + driftX) * 0.92;
      this.velocities[i3 + 1] = (this.velocities[i3 + 1] + restoreY + driftY) * 0.92;
      this.velocities[i3 + 2] = (this.velocities[i3 + 2] + restoreZ) * 0.92;

      pos[i3] += this.velocities[i3];
      pos[i3 + 1] += this.velocities[i3 + 1];
      pos[i3 + 2] += this.velocities[i3 + 2];
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }
}

// ============================================================================
// 3. SPATIAL BENTO 3D CRYSTAL VIEWPORT (SECTION 04 BENTO CARD)
// ============================================================================
export class ThreeUISpatialBento {
  constructor(containerId = 'bento-three-canvas') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.isTabActive = true;
    this.isVisible = true;

    this.init();
    this.createObject();
    this.setupEvents();
    this.animate();
  }

  init() {
    this.width = this.container.clientWidth || 180;
    this.height = this.container.clientHeight || 180;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 50);
    this.camera.position.z = 3.6;

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.width, this.height);

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);
  }

  createObject() {
    this.group = new THREE.Group();
    this.scene.add(this.group);

    const isDark = document.documentElement.classList.contains('dark');

    // 3D Icosahedron Crystal
    const geometry = new THREE.IcosahedronGeometry(1.0, 0);

    this.material = new THREE.MeshPhysicalMaterial({
      color: isDark ? new THREE.Color('#38BDF8') : new THREE.Color('#C2410C'),
      emissive: isDark ? new THREE.Color('#0369A1') : new THREE.Color('#7C2D12'),
      emissiveIntensity: 0.25,
      roughness: 0.1,
      metalness: 0.15,
      transmission: 0.7,
      ior: 1.6,
      thickness: 1.0,
      clearcoat: 1.0
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.group.add(this.mesh);

    // Glowing Wireframe Cage
    const wireGeom = new THREE.IcosahedronGeometry(1.02, 0);
    this.wireMaterial = new THREE.MeshBasicMaterial({
      color: isDark ? new THREE.Color('#34D399') : new THREE.Color('#FB923C'),
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.35 : 0.25
    });
    this.wireMesh = new THREE.Mesh(wireGeom, this.wireMaterial);
    this.group.add(this.wireMesh);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, isDark ? 0.7 : 0.9);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(3, 4, 3);
    this.scene.add(dirLight);
  }

  setupEvents() {
    const observer = new ResizeObserver(() => {
      if (!this.container) return;
      this.width = this.container.clientWidth;
      this.height = this.container.clientHeight;
      if (this.width === 0 || this.height === 0) return;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    });
    observer.observe(this.container);

    window.addEventListener('themeChanged', (e) => {
      const isDark = e.detail.isDark;
      if (this.material) {
        this.material.color.set(isDark ? '#38BDF8' : '#C2410C');
        this.material.emissive.set(isDark ? '#0369A1' : '#7C2D12');
      }
      if (this.wireMaterial) {
        this.wireMaterial.color.set(isDark ? '#34D399' : '#FB923C');
      }
    });

    const interObserver = new IntersectionObserver((entries) => {
      this.isVisible = entries[0].isIntersecting;
      if (this.isVisible && this.isTabActive) this.animate();
    }, { threshold: 0.1 });
    interObserver.observe(this.container);
  }

  animate() {
    if (!this.isTabActive || !this.isVisible) return;
    this.animId = requestAnimationFrame(() => this.animate());

    this.group.rotation.x += 0.008;
    this.group.rotation.y += 0.012;

    const t = performance.now() * 0.002;
    this.group.position.y = Math.sin(t) * 0.05;

    this.renderer.render(this.scene, this.camera);
  }

  pause() {
    this.isVisible = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  resume() {
    this.isVisible = true;
    if (!this.animId) {
      this.animate();
    }
  }
}

// ============================================================================
// 4. CONTACT 3D SPATIAL BEACON (SECTION 05 KINETIC GYROSCOPIC CORE)
// ============================================================================
export class ThreeUIContactBeacon {
  constructor(containerId = 'contact-three-canvas') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.drag = { isDragging: false, prevX: 0, prevY: 0, velX: 0, velY: 0 };
    this.rotation = { x: 0.32, y: 0.45 };
    this.isTabActive = true;
    this.isVisible = true;

    this.init();
    this.createArmillarySphere();
    this.setupEvents();
    this.animate();
  }

  init() {
    this.width = this.container.clientWidth || 240;
    this.height = this.container.clientHeight || 240;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0, 5.8);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;

    this.renderer.domElement.className = 'w-full h-full object-contain cursor-grab active:cursor-grabbing select-none';
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);
  }

  // Cel-shading stepped tone ramp for hand-drawn anime aesthetic (Dạng vẽ Ghibli)
  createToonRamp() {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    // 4 crisp stepped tones: deep shadow -> mid shadow -> warm gold -> sunlit highlight
    ctx.fillStyle = '#78350f'; ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = '#b45309'; ctx.fillRect(1, 0, 1, 1);
    ctx.fillStyle = '#f59e0b'; ctx.fillRect(2, 0, 1, 1);
    ctx.fillStyle = '#fef08a'; ctx.fillRect(3, 0, 1, 1);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    return tex;
  }

  // 1. Hand-Drawn Anime Parchment Zodiac Ecliptic Band Canvas Texture
  createZodiacTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Warm illustrated parchment paper gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#fef3c7');
    grad.addColorStop(0.3, '#fde68a');
    grad.addColorStop(0.7, '#fef08a');
    grad.addColorStop(1, '#fde68a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 256);

    // Delicate hand-drawn paper grain / stippling
    ctx.fillStyle = 'rgba(120, 53, 15, 0.04)';
    for (let i = 0; i < 350; i++) {
      const rx = Math.random() * 2048;
      const ry = Math.random() * 256;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }

    // Upper and lower hand-drawn ink border bands
    ctx.fillStyle = '#451a03';
    ctx.fillRect(0, 12, 2048, 3.5);
    ctx.fillRect(0, 20, 2048, 1.8);
    ctx.fillRect(0, 234, 2048, 1.8);
    ctx.fillRect(0, 240, 2048, 3.5);

    const signs = [
      { name: 'CAPRICORN', sym: '♑' },
      { name: 'AQUARIUS', sym: '♒' },
      { name: 'PISCES', sym: '♓' },
      { name: 'ARIES', sym: '♈' },
      { name: 'TAURUS', sym: '♉' },
      { name: 'GEMINI', sym: '♊' },
      { name: 'CANCER', sym: '♋' },
      { name: 'LEO', sym: '♌' },
      { name: 'VIRGO', sym: '♍' },
      { name: 'LIBRA', sym: '♎' },
      { name: 'SCORPIO', sym: '♏' },
      { name: 'SAGITTARIUS', sym: '♐' }
    ];

    const signWidth = 2048 / 12;

    // 12 Constellation panels with hand-drawn ink divisions & glyphs
    signs.forEach((s, idx) => {
      const startX = idx * signWidth;

      // Segment divider line
      ctx.fillStyle = '#451a03';
      ctx.fillRect(startX, 20, 2.5, 214);

      // Degree tick marks along top and bottom (30 degrees per sign)
      for (let deg = 0; deg < 30; deg++) {
        const tx = startX + (deg / 30) * signWidth;
        const isTen = deg % 10 === 0;
        const isFive = deg % 5 === 0;
        const tickH = isTen ? 20 : (isFive ? 12 : 7);

        ctx.fillStyle = '#78350f';
        ctx.fillRect(tx, 22, isTen ? 2.2 : 1.2, tickH);
        ctx.fillRect(tx, 234 - tickH, isTen ? 2.2 : 1.2, tickH);

        if (isTen && deg > 0) {
          ctx.font = 'bold 14px monospace';
          ctx.fillStyle = '#451a03';
          ctx.textAlign = 'center';
          ctx.fillText(deg.toString(), tx, 58);
          ctx.fillText(deg.toString(), tx, 206);
        }
      }

      // Constellation Name in Hand-Drawn Anime Editorial Typography
      const midX = startX + signWidth * 0.5;
      ctx.font = 'bold 22px "Times New Roman", Georgia, serif';
      ctx.fillStyle = '#451a03';
      ctx.textAlign = 'center';
      ctx.fillText(s.name + '  ' + s.sym, midX, 136);

      // Star dots
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(midX - 45, 105, 2.5, 0, Math.PI * 2);
      ctx.arc(midX + 45, 105, 2.5, 0, Math.PI * 2);
      ctx.arc(midX, 90, 3.0, 0, Math.PI * 2);
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  // 2. Hand-Drawn Anime Parchment Horizon Ring Canvas Texture
  createHorizonTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const cx = 512, cy = 512;

    // Warm illustrated parchment background
    const grad = ctx.createRadialGradient(cx, cy, 370, cx, cy, 510);
    grad.addColorStop(0, '#fef3c7');
    grad.addColorStop(0.5, '#fde68a');
    grad.addColorStop(1, '#fef08a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Circular hand-drawn ink borders
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 506, 0, Math.PI * 2);
    ctx.arc(cx, cy, 412, 0, Math.PI * 2);
    ctx.stroke();

    // Quadrant degree marks (0° to 90° in 4 quadrants)
    for (let i = 0; i < 360; i++) {
      const rad = (i * Math.PI) / 180;
      const isTen = i % 10 === 0;
      const isFive = i % 5 === 0;
      const len = isTen ? 30 : (isFive ? 18 : 10);

      const x1 = cx + Math.cos(rad) * 504;
      const y1 = cy + Math.sin(rad) * 504;
      const x2 = cx + Math.cos(rad) * (504 - len);
      const y2 = cy + Math.sin(rad) * (504 - len);

      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = isTen ? 2.5 : 1.2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (isTen) {
        const qVal = Math.abs((i % 180) > 90 ? 180 - (i % 180) : (i % 180));
        const tx = cx + Math.cos(rad) * 448;
        const ty = cy + Math.sin(rad) * 448;

        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(rad + Math.PI / 2);
        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = '#451a03';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(qVal.toString(), 0, 0);
        ctx.restore();
      }
    }

    return new THREE.CanvasTexture(canvas);
  }

  // 3. Assemble Illustrated Anime Armillary Sphere (Dạng Vẽ Hoạt Hình - Không Chân Đế)
  createArmillarySphere() {
    this.group = new THREE.Group();
    this.group.scale.setScalar(0.72);
    this.group.position.set(0, 0, 0);
    this.scene.add(this.group);

    // Procedural Toon Textures
    this.zodiacTexture = this.createZodiacTexture();
    this.horizonTexture = this.createHorizonTexture();

    // Cel-Shaded Illustrated Materials (MeshToonMaterial - Dạng Vẽ Anime)
    this.brassMaterial = new THREE.MeshToonMaterial({
      color: new THREE.Color('#f59e0b'),
      gradientMap: this.toonRamp
    });

    this.darkBrassMaterial = new THREE.MeshToonMaterial({
      color: new THREE.Color('#b45309'),
      gradientMap: this.toonRamp
    });

    this.polishedBrassMaterial = new THREE.MeshToonMaterial({
      color: new THREE.Color('#fde047'),
      gradientMap: this.toonRamp
    });

    this.zodiacMaterial = new THREE.MeshToonMaterial({
      map: this.zodiacTexture,
      gradientMap: this.toonRamp,
      side: THREE.DoubleSide
    });

    this.horizonMaterial = new THREE.MeshToonMaterial({
      map: this.horizonTexture,
      gradientMap: this.toonRamp,
      side: THREE.DoubleSide
    });

    // ========================================================
    // PART A: OUTER STATIONARY MOUNT (Horizon + Meridian + Pedestal)
    // ========================================================
    this.outerMountGroup = new THREE.Group();
    this.group.add(this.outerMountGroup);

    // 1. Broad Horizontal Horizon Ring (Địa bình quyển)
    const horizonTopGeom = new THREE.RingGeometry(1.44, 1.82, 80);
    this.horizonTopMesh = new THREE.Mesh(horizonTopGeom, this.horizonMaterial);
    this.horizonTopMesh.rotation.x = -Math.PI / 2;
    this.outerMountGroup.add(this.horizonTopMesh);

    const horizonBottomGeom = new THREE.RingGeometry(1.44, 1.82, 80);
    this.horizonBottomMesh = new THREE.Mesh(horizonBottomGeom, this.brassMaterial);
    this.horizonBottomMesh.rotation.x = Math.PI / 2;
    this.horizonBottomMesh.position.y = -0.025;
    this.outerMountGroup.add(this.horizonBottomMesh);

    // Outer & inner protective beveled rim edges
    const horizonOuterRimGeom = new THREE.TorusGeometry(1.82, 0.022, 16, 80);
    this.horizonOuterRim = new THREE.Mesh(horizonOuterRimGeom, this.brassMaterial);
    this.horizonOuterRim.rotation.x = Math.PI / 2;
    this.outerMountGroup.add(this.horizonOuterRim);

    const horizonInnerRimGeom = new THREE.TorusGeometry(1.44, 0.018, 16, 80);
    this.horizonInnerRim = new THREE.Mesh(horizonInnerRimGeom, this.brassMaterial);
    this.horizonInnerRim.rotation.x = Math.PI / 2;
    this.outerMountGroup.add(this.horizonInnerRim);

    // 2. Vertical Standing Meridian Ring (Tử ngọ quyển)
    const meridianGeom = new THREE.TorusGeometry(1.74, 0.042, 16, 96);
    this.meridianMesh = new THREE.Mesh(meridianGeom, this.brassMaterial);
    this.outerMountGroup.add(this.meridianMesh);

    // (CHÂN ĐẾ ĐÃ ĐƯỢC LOẠI BỎ THEO YÊU CẦU - HOÀN TOÀN BAY LƠ LỬNG)

    // ========================================================
    // PART B: INNER CELESTIAL GIMBAL ASSEMBLY (Hỗn Thiên Nghi Cơ Chế)
    // Mounted along the Polar Axis Spindle, inclined at -23.5 degrees
    // ========================================================
    this.celestialGroup = new THREE.Group();
    this.celestialGroup.rotation.z = THREE.MathUtils.degToRad(-23.5);
    this.group.add(this.celestialGroup);

    // 1. Polar Axis Spindle (Trục địa cực)
    const spindleGeom = new THREE.CylinderGeometry(0.025, 0.025, 3.65, 24);
    this.spindle = new THREE.Mesh(spindleGeom, this.brassMaterial);
    this.celestialGroup.add(this.spindle);

    // North & South Pole Decorative Turned Acorn Finials
    const finialTopGeom = new THREE.SphereGeometry(0.065, 16, 16);
    const finialTop = new THREE.Mesh(finialTopGeom, this.darkBrassMaterial);
    finialTop.position.set(0, 1.76, 0);
    this.celestialGroup.add(finialTop);

    const finialBotGeom = new THREE.SphereGeometry(0.065, 16, 16);
    const finialBot = new THREE.Mesh(finialBotGeom, this.darkBrassMaterial);
    finialBot.position.set(0, -1.76, 0);
    this.celestialGroup.add(finialBot);

    // 2. Celestial Equator Ring (Xích đạo quyển - perpendicular to polar axis)
    const equatorGeom = new THREE.TorusGeometry(1.36, 0.028, 16, 80);
    this.equatorRing = new THREE.Mesh(equatorGeom, this.brassMaterial);
    this.equatorRing.rotation.x = Math.PI / 2;
    this.celestialGroup.add(this.equatorRing);

    // 3. Solstitial Colure Ring (Nhị chí quyển - aligned in XY)
    const solstitialGeom = new THREE.TorusGeometry(1.35, 0.025, 16, 80);
    this.solstitialRing = new THREE.Mesh(solstitialGeom, this.brassMaterial);
    this.celestialGroup.add(this.solstitialRing);

    // 4. Equinoctial Colure Ring (Nhị phân quyển - perpendicular in YZ)
    const equinoctialGeom = new THREE.TorusGeometry(1.35, 0.025, 16, 80);
    this.equinoctialRing = new THREE.Mesh(equinoctialGeom, this.brassMaterial);
    this.equinoctialRing.rotation.y = Math.PI / 2;
    this.celestialGroup.add(this.equinoctialRing);

    // 5. Tropic of Cancer Ring (Bắc hồi quy tuyến: +23.5° lat, y = +0.54, r = 1.24)
    const tropicCancerGeom = new THREE.TorusGeometry(1.24, 0.020, 16, 64);
    this.tropicCancer = new THREE.Mesh(tropicCancerGeom, this.brassMaterial);
    this.tropicCancer.rotation.x = Math.PI / 2;
    this.tropicCancer.position.y = 0.54;
    this.celestialGroup.add(this.tropicCancer);

    // 6. Tropic of Capricorn Ring (Nam hồi quy tuyến: -23.5° lat, y = -0.54, r = 1.24)
    const tropicCapriGeom = new THREE.TorusGeometry(1.24, 0.020, 16, 64);
    this.tropicCapri = new THREE.Mesh(tropicCapriGeom, this.brassMaterial);
    this.tropicCapri.rotation.x = Math.PI / 2;
    this.tropicCapri.position.y = -0.54;
    this.celestialGroup.add(this.tropicCapri);

    // 7. Arctic & Antarctic Circles (Cực quyển: y = +/- 1.15, r = 0.58)
    const arcticGeom = new THREE.TorusGeometry(0.58, 0.018, 16, 48);
    const arcticRing = new THREE.Mesh(arcticGeom, this.brassMaterial);
    arcticRing.rotation.x = Math.PI / 2;
    arcticRing.position.y = 1.15;
    this.celestialGroup.add(arcticRing);

    const antarcticRing = new THREE.Mesh(arcticGeom, this.brassMaterial);
    antarcticRing.rotation.x = Math.PI / 2;
    antarcticRing.position.y = -1.15;
    this.celestialGroup.add(antarcticRing);

    // 8. Central Terrestrial Core Globe (Quả địa cầu trung tâm)
    const globeGeom = new THREE.SphereGeometry(0.28, 32, 32);
    this.globeMesh = new THREE.Mesh(globeGeom, this.polishedBrassMaterial);
    this.celestialGroup.add(this.globeMesh);

    const globeSeamGeom = new THREE.TorusGeometry(0.285, 0.012, 16, 48);
    const globeSeam = new THREE.Mesh(globeSeamGeom, this.darkBrassMaterial);
    globeSeam.rotation.x = Math.PI / 2;
    this.celestialGroup.add(globeSeam);

    // 9. Broad Zodiac / Ecliptic Band (Hoàng đạo quyển - tilted at 23.5 degrees to the equator)
    this.zodiacGroup = new THREE.Group();
    this.zodiacGroup.rotation.x = THREE.MathUtils.degToRad(23.5);

    const zodiacGeom = new THREE.CylinderGeometry(1.25, 1.25, 0.32, 72, 1, true);
    this.zodiacMesh = new THREE.Mesh(zodiacGeom, this.zodiacMaterial);
    this.zodiacGroup.add(this.zodiacMesh);

    // Upper and lower brass edge trims on the Zodiac Band
    const zodiacRimGeom = new THREE.TorusGeometry(1.25, 0.018, 16, 72);
    const zodiacRimTop = new THREE.Mesh(zodiacRimGeom, this.brassMaterial);
    zodiacRimTop.rotation.x = Math.PI / 2;
    zodiacRimTop.position.y = 0.16;
    this.zodiacGroup.add(zodiacRimTop);

    const zodiacRimBot = new THREE.Mesh(zodiacRimGeom, this.brassMaterial);
    zodiacRimBot.rotation.x = Math.PI / 2;
    zodiacRimBot.position.y = -0.16;
    this.zodiacGroup.add(zodiacRimBot);

    this.celestialGroup.add(this.zodiacGroup);

    // ========================================================
    // Warm Toon Anime Lighting Setup (Dạng vẽ anime cel-shaded)
    // ========================================================
    this.ambientLight = new THREE.AmbientLight(0xfffbeb, 1.8);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xffedd5, 1.9);
    this.keyLight.position.set(3, 4, 3);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0xbfdbfe, 0.85);
    this.rimLight.position.set(-3, -2, -2);
    this.scene.add(this.rimLight);
  }

  setupEvents() {
    const dom = this.renderer.domElement;

    const onPointerMove = (e) => {
      const rect = this.container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      this.mouse.targetX = Math.max(-1.5, Math.min(1.5, x));
      this.mouse.targetY = Math.max(-1.5, Math.min(1.5, y));

      if (this.drag.isDragging) {
        const deltaX = e.clientX - this.drag.prevX;
        const deltaY = e.clientY - this.drag.prevY;
        this.drag.velX = deltaX * 0.007;
        this.drag.velY = deltaY * 0.007;
        this.rotation.y += this.drag.velX;
        this.rotation.x += this.drag.velY;
        this.drag.prevX = e.clientX;
        this.drag.prevY = e.clientY;
      }
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    dom.addEventListener('pointerdown', (e) => {
      this.drag.isDragging = true;
      this.drag.prevX = e.clientX;
      this.drag.prevY = e.clientY;
      this.drag.velX = 0;
      this.drag.velY = 0;
      dom.setPointerCapture(e.pointerId);
    });

    const stopDrag = (e) => {
      if (this.drag.isDragging) {
        this.drag.isDragging = false;
        try { dom.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };
    dom.addEventListener('pointerup', stopDrag);
    dom.addEventListener('pointercancel', stopDrag);

    // Theme changes
    window.addEventListener('themeChanged', (e) => this.onThemeChange(e.detail.isDark));

    // Resize Observer
    const resObserver = new ResizeObserver(() => this.onResize());
    resObserver.observe(this.container);

    // Intersection Observer
    const interObserver = new IntersectionObserver((entries) => {
      this.isVisible = entries[0].isIntersecting;
      if (this.isVisible && this.isTabActive) this.animate();
    }, { threshold: 0.1 });
    interObserver.observe(this.container);

    document.addEventListener('visibilitychange', () => {
      this.isTabActive = !document.hidden;
      if (this.isTabActive && this.isVisible) this.animate();
    });
  }

  onResize() {
    if (!this.container) return;
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    if (this.width === 0 || this.height === 0) return;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  onThemeChange(isDark) {
    if (this.keyLight) this.keyLight.intensity = isDark ? 3.4 : 3.0;
    if (this.rimLight) this.rimLight.color.set(isDark ? 0x60a5fa : 0x93c5fd);
  }

  pause() {
    this.isVisible = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  resume() {
    this.isVisible = true;
    this.onResize();
    if (!this.animId) {
      this.animate();
    }
  }

  animate() {
    if (!this.isTabActive || !this.isVisible) return;
    this.animId = requestAnimationFrame(() => this.animate());

    // Free 3D Physics Drag & Damping
    if (!this.drag.isDragging) {
      this.drag.velX *= 0.94;
      this.drag.velY *= 0.94;
      this.rotation.y += this.drag.velX + 0.005;
      this.rotation.x += this.drag.velY;
    }

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.06;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.06;

    // Outer orientation with mouse parallax
    this.group.rotation.y = this.rotation.y + this.mouse.x * 0.25;
    this.group.rotation.x = this.rotation.x - this.mouse.y * 0.20;

    // CELESTIAL MECHANICS OF THE ARMILLARY SPHERE (Cơ chế Hỗn Thiên Nghi)
    // 1. Inner celestial gimbal assembly rotates smoothly along the polar axis
    if (this.celestialGroup) {
      this.celestialGroup.rotation.y += 0.007;
    }

    // 2. Zodiac Ecliptic Band has independent celestial precession
    if (this.zodiacGroup) {
      this.zodiacGroup.rotation.y += 0.0035;
    }

    // 3. Subtle floating levitation
    const t = performance.now() * 0.0016;
    this.group.position.y = Math.sin(t) * 0.05;

    this.renderer.render(this.scene, this.camera);
  }
}
