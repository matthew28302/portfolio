import * as THREE from 'three';

/**
 * ThreeUI Interactive 3D Canvas Engine
 * Created by Senior UI/UX Creative Technologist
 * Features:
 * - Procedural Frosted Glass & Holographic Wireframe Torus Knot
 * - Real-time Pointer Parallax & Inertia Spring Physics
 * - Theme-reactive lighting (Warm Studio Light vs Dark Obsidian Glow)
 * - Click & Drag rotation physics with damping
 * - Performance optimized (60 FPS, downscaling, pause on tab inactive)
 */
export class ThreeUIHero {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.drag = { isDragging: false, prevX: 0, prevY: 0, velX: 0, velY: 0 };
    this.rotation = { x: 0, y: 0 };
    this.isTabActive = true;
    this.isVisible = true;

    this.init();
    this.createScene();
    this.setupEvents();
    this.animate();
  }

  init() {
    this.width = this.container.clientWidth || 400;
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
    this.renderer.toneMappingExposure = 1.1;

    // Canvas styling
    this.renderer.domElement.className = 'w-full h-full object-contain cursor-grab active:cursor-grabbing select-none pointer-events-auto';
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);
  }

  createScene() {
    // 1. Group for interactive transformation
    this.meshGroup = new THREE.Group();
    this.scene.add(this.meshGroup);

    // 2. High-aesthetic Torus Knot geometry (Symbolizing interconnection & fluid UX)
    const geometry = new THREE.TorusKnotGeometry(1.05, 0.32, 140, 28, 2, 3);

    // 3. Glass / Physical Material
    const isDark = document.documentElement.classList.contains('dark');
    this.material = new THREE.MeshPhysicalMaterial({
      color: isDark ? new THREE.Color('#38BDF8') : new THREE.Color('#C2410C'),
      emissive: isDark ? new THREE.Color('#0369A1') : new THREE.Color('#7C2D12'),
      emissiveIntensity: 0.25,
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.65, // Glass effect
      ior: 1.5,
      thickness: 1.2,
      specularIntensity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      wireframe: false
    });

    this.mainMesh = new THREE.Mesh(geometry, this.material);
    this.meshGroup.add(this.mainMesh);

    // 4. Subtle Outer Wireframe Halo (Technical Computer Networks aesthetic)
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: isDark ? new THREE.Color('#34D399') : new THREE.Color('#FB923C'),
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.18 : 0.12
    });
    const wireGeom = new THREE.TorusKnotGeometry(1.08, 0.33, 60, 16, 2, 3);
    this.wireMesh = new THREE.Mesh(wireGeom, wireMaterial);
    this.meshGroup.add(this.wireMesh);

    // 5. Floating Orbital Stardust Particles
    const particleCount = 45;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 1.9 + Math.random() * 0.8;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      scales[i] = Math.random();
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: isDark ? '#34D399' : '#C2410C',
      size: 0.045,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    this.particles = new THREE.Points(particleGeom, particleMat);
    this.meshGroup.add(this.particles);

    // 6. Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.7 : 0.9);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(isDark ? 0x38bdf8 : 0xffedd5, 2.4);
    this.keyLight.position.set(4, 5, 4);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(isDark ? 0x34d399 : 0xfb923c, 2.0);
    this.rimLight.position.set(-4, -3, -2);
    this.scene.add(this.rimLight);
  }

  setupEvents() {
    // Resize Observer
    const resizeObserver = new ResizeObserver(() => this.onResize());
    resizeObserver.observe(this.container);

    // Mouse Parallax & Drag Interaction
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

    // Theme changes
    window.addEventListener('themeChanged', (e) => this.onThemeChange(e.detail.isDark));

    // Visibility & Intersection
    document.addEventListener('visibilitychange', () => {
      this.isTabActive = !document.hidden;
      if (this.isTabActive && this.isVisible) {
        this.lastTime = performance.now();
        this.animate();
      }
    });

    const observer = new IntersectionObserver((entries) => {
      this.isVisible = entries[0].isIntersecting;
      if (this.isVisible && this.isTabActive) {
        this.lastTime = performance.now();
        this.animate();
      }
    }, { threshold: 0.1 });
    observer.observe(this.container);
  }

  onThemeChange(isDark) {
    if (!this.material) return;
    this.material.color.set(isDark ? '#38BDF8' : '#C2410C');
    this.material.emissive.set(isDark ? '#0369A1' : '#7C2D12');
    if (this.wireMesh) {
      this.wireMesh.material.color.set(isDark ? '#34D399' : '#FB923C');
      this.wireMesh.material.opacity = isDark ? 0.2 : 0.12;
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

    // Inertia & Damping
    if (!this.drag.isDragging) {
      this.drag.velX *= 0.94;
      this.drag.velY *= 0.94;
      this.rotation.y += this.drag.velX + 0.005; // Idle ambient auto-spin
      this.rotation.x += this.drag.velY + 0.002;
    }

    // Parallax mouse follow
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.06;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.06;

    // Apply rotation
    this.meshGroup.rotation.y = this.rotation.y + this.mouse.x * 0.45;
    this.meshGroup.rotation.x = this.rotation.x - this.mouse.y * 0.35;

    // Floating bobbing motion
    const t = performance.now() * 0.0015;
    this.meshGroup.position.y = Math.sin(t) * 0.08;

    if (this.particles) {
      this.particles.rotation.y -= 0.003;
      this.particles.rotation.x += 0.001;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.renderer.dispose();
    this.scene.clear();
  }
}
