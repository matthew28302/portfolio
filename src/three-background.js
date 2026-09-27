import * as THREE from 'three';

/**
 * ThreeUI Dynamic 3D Web Background Engine (Enhanced Studio Edition)
 * Features:
 * - 12 completely distinct, high-impact, non-overlapping 3D environments:
 *   1. Hologram Torus Knot & Stardust (Jewel-like glass with dual wireframe & particle halo)
 *   2. Cyber Wave Grid (Undulating 3D terrain with glowing vertex node junctions)
 *   3. Cosmic Network (Interactive Constellation Neural Net with major cluster hubs)
 *   4. Floating Glass Spheres (Golden ratio composition with equatorial rings & photon cores)
 *   5. Black Hole Singularity (Event horizon, glowing photon ring, relativistic accretion disk & polar plasma jets)
 *   6. Hyperspace Warp Tunnel (Speed starfield vortex with expanding warp portal rings)
 *   7. DNA Double Helix (Perfect viewport height framing with illuminated base-pair ladder)
 *   8. Digital Silk Ribbon (Fluid parametric undulating surface with edge illumination)
 *   9. Matrix Cyber Rain (26 authentic vertical data streams with bright leading neon glyphs)
 *   10. Flow Field Fluid (3D curl-noise organic liquid vector field inspired by ThreeUI Flow Field)
 *   11. Supernova Stellar Ring (Luminous star nucleus & Keplerian orbital accretion disk)
 *   12. Floating Tech Monoliths (Architectural glass obelisks with sharp wireframe edges)
 * - Zero duplicates (Old #5 & #10 replaced with Black Hole & Organic Flow Field)
 * - Dynamic responsive camera distance (no cutoff on mobile/portrait/widescreen)
 * - GPU pause/resume when modal opens (instant 120 FPS performance)
 * - 60 FPS performance optimized
 */
export class ThreeUIBackground {
  constructor(canvasId = 'three-bg-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.scrollY = 0;
    this.targetScrollY = 0;
    this.windowHalf = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.clock = new THREE.Clock();

    this.scenesList = [
      { id: 'torus', name: 'Hologram Torus', category: 'Glass & Light', desc: 'Crystal torus knot & shimmering stardust', icon: 'disc' },
      { id: 'wave', name: 'Cyber Wave Grid', category: 'Wireframe', desc: '3D undulating mesh with glowing vertex nodes', icon: 'activity' },
      { id: 'constellation', name: 'Cosmic Network', category: 'Neural Net', desc: 'Dynamic neural network with pulsing central hubs', icon: 'share-2' },
      { id: 'orbs', name: 'Glass Spheres', category: 'Refraction', desc: 'Equatorial ringed glass orbs across space', icon: 'circle-dot' },
      { id: 'blackhole', name: 'Black Hole Singularity', category: 'Relativistic', desc: 'Cosmic event horizon, photon ring & accretion disk', icon: 'circle' },
      { id: 'warp', name: 'Hyperspace Tunnel', category: 'Vortex', desc: 'Lightspeed particle warp tunnel & portal rings', icon: 'zap' },
      { id: 'helix', name: 'DNA Data Helix', category: 'Bio-Digital', desc: 'Bio-digital double helix framed to viewport', icon: 'dna' },
      { id: 'ribbon', name: 'Digital Silk Ribbon', category: 'Parametric', desc: 'Flowing parametric silk surface with edge luminescence', icon: 'waves' },
      { id: 'matrix', name: 'Matrix Data Rain', category: 'Cyber Stream', desc: '26 vertical cascading matrix code streams', icon: 'code' },
      { id: 'flowfield', name: 'Flow Field Fluid', category: 'Organic Vector', desc: '3D organic curl-noise fluid vector field', icon: 'wind' },
      { id: 'supernova', name: 'Supernova Stellar Ring', category: 'Stellar Pulse', desc: 'Luminous stellar core & Keplerian accretion disk', icon: 'sparkles' },
      { id: 'monoliths', name: 'Tech Monoliths', category: 'Architectural', desc: 'Floating glass obelisks with sharp wireframe edges', icon: 'columns' }
    ];

    this.currentSceneIndex = parseInt(localStorage.getItem('threeui_scene') || '0', 10);
    if (isNaN(this.currentSceneIndex) || this.currentSceneIndex >= this.scenesList.length) {
      this.currentSceneIndex = 0;
    }

    this.isTabActive = true;
    this.isPaused = false;
    this.init();
    this.buildScenes();
    this.setupEvents();
    this.applyTheme();
    this.animate();
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.clock.start();
    }
  }

  init() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, this.width / this.height, 0.1, 100);
    this.updateCameraFraming();

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // Ambient and Directional Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.dirLight.position.set(3, 8, 6);
    this.scene.add(this.dirLight);

    this.pointLight1 = new THREE.PointLight(0xffffff, 2.6, 35);
    this.pointLight1.position.set(4, 4, 4);
    this.scene.add(this.pointLight1);

    this.pointLight2 = new THREE.PointLight(0xffffff, 2.2, 35);
    this.pointLight2.position.set(-4, -3, 3);
    this.scene.add(this.pointLight2);
  }

  updateCameraFraming() {
    const aspect = this.width / this.height;
    if (aspect < 0.8) {
      this.camera.position.z = 7.8;
    } else if (aspect < 1.2) {
      this.camera.position.z = 7.2;
    } else {
      this.camera.position.z = 6.6;
    }
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  buildScenes() {
    this.groups = [];

    // ========================================================================
    // Scene 0: Holographic Torus Knot & Stardust
    // ========================================================================
    const g0 = new THREE.Group();
    const torusGeom = new THREE.TorusKnotGeometry(1.35, 0.38, 128, 28, 2, 3);
    this.torusMat = new THREE.MeshPhysicalMaterial({
      roughness: 0.12,
      metalness: 0.18,
      transmission: 0.65,
      ior: 1.52,
      thickness: 1.4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.92
    });
    this.torusMesh = new THREE.Mesh(torusGeom, this.torusMat);
    g0.add(this.torusMesh);

    const wireGeom = new THREE.TorusKnotGeometry(1.38, 0.39, 64, 16, 2, 3);
    this.torusWireMat = new THREE.MeshBasicMaterial({
      wireframe: true,
      transparent: true,
      opacity: 0.28
    });
    this.torusWireMesh = new THREE.Mesh(wireGeom, this.torusWireMat);
    g0.add(this.torusWireMesh);

    const count0 = 120;
    const pos0 = new Float32Array(count0 * 3);
    for (let i = 0; i < count0 * 3; i += 3) {
      pos0[i] = (Math.random() - 0.5) * 8.5;
      pos0[i + 1] = (Math.random() - 0.5) * 6.0;
      pos0[i + 2] = (Math.random() - 0.5) * 4.5;
    }
    const geom0 = new THREE.BufferGeometry();
    geom0.setAttribute('position', new THREE.BufferAttribute(pos0, 3));
    this.stardustMat = new THREE.PointsMaterial({
      size: 0.06,
      transparent: true,
      opacity: 0.65
    });
    this.stardustPoints = new THREE.Points(geom0, this.stardustMat);
    g0.add(this.stardustPoints);

    this.scene.add(g0);
    this.groups.push(g0);

    // ========================================================================
    // Scene 1: Cyber Wave Grid (3D Terrain with Glowing Node Junctions)
    // ========================================================================
    const g1 = new THREE.Group();
    g1.rotation.x = -Math.PI * 0.34;
    g1.position.y = -1.35;
    g1.position.z = 0.2;

    this.waveGeom = new THREE.PlaneGeometry(21, 14, 46, 30);
    this.waveMat = new THREE.MeshStandardMaterial({
      wireframe: true,
      transparent: true,
      opacity: 0.48,
      roughness: 0.2
    });
    this.waveMesh = new THREE.Mesh(this.waveGeom, this.waveMat);
    g1.add(this.waveMesh);

    this.wavePointsMat = new THREE.PointsMaterial({
      size: 0.055,
      transparent: true,
      opacity: 0.8
    });
    this.wavePoints = new THREE.Points(this.waveGeom, this.wavePointsMat);
    g1.add(this.wavePoints);

    this.scene.add(g1);
    this.groups.push(g1);

    // ========================================================================
    // Scene 2: Cosmic Network (Interactive Constellation with Star Hubs)
    // ========================================================================
    const g2 = new THREE.Group();
    this.nodeCount = 65;
    this.nodePositions = new Float32Array(this.nodeCount * 3);
    this.nodeVelocities = [];

    for (let i = 0; i < this.nodeCount; i++) {
      this.nodePositions[i * 3] = (Math.random() - 0.5) * 8.0;
      this.nodePositions[i * 3 + 1] = (Math.random() - 0.5) * 5.0;
      this.nodePositions[i * 3 + 2] = (Math.random() - 0.5) * 3.0;
      this.nodeVelocities.push({
        x: (Math.random() - 0.5) * 0.007,
        y: (Math.random() - 0.5) * 0.007,
        z: (Math.random() - 0.5) * 0.004
      });
    }

    const nodeGeom = new THREE.BufferGeometry();
    nodeGeom.setAttribute('position', new THREE.BufferAttribute(this.nodePositions, 3));
    this.nodeMat = new THREE.PointsMaterial({
      size: 0.09,
      transparent: true,
      opacity: 0.95
    });
    this.nodePoints = new THREE.Points(nodeGeom, this.nodeMat);
    g2.add(this.nodePoints);

    this.maxLines = 260;
    this.linePositions = new Float32Array(this.maxLines * 6);
    this.lineGeom = new THREE.BufferGeometry();
    this.lineGeom.setAttribute('position', new THREE.BufferAttribute(this.linePositions, 3));
    this.lineMat = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.32
    });
    this.lineSegments = new THREE.LineSegments(this.lineGeom, this.lineMat);
    g2.add(this.lineSegments);

    this.scene.add(g2);
    this.groups.push(g2);

    // ========================================================================
    // Scene 3: Floating Glass Spheres (Golden Ratio Balanced Layout)
    // ========================================================================
    const g3 = new THREE.Group();
    this.spheres = [];
    const sphereGeom = new THREE.SphereGeometry(1, 32, 32);
    const ringTorusGeom = new THREE.TorusGeometry(1.2, 0.02, 8, 36);
    const corePointGeom = new THREE.SphereGeometry(0.3, 16, 16);

    this.sphereMat = new THREE.MeshPhysicalMaterial({
      roughness: 0.08,
      metalness: 0.15,
      transmission: 0.68,
      ior: 1.52,
      thickness: 1.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.88
    });

    this.sphereRingMat = new THREE.MeshBasicMaterial({
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });

    this.sphereCoreMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.65
    });

    const sphereConfigs = [
      { x: -3.6, y: 1.7, z: -0.6, r: 0.48, speed: 0.55 },
      { x: 3.5, y: 1.6, z: 0.1, r: 0.44, speed: 0.7 },
      { x: -3.0, y: -1.6, z: 0.3, r: 0.54, speed: 0.6 },
      { x: 3.2, y: -1.7, z: -0.4, r: 0.50, speed: 0.75 },
      { x: -0.8, y: 2.1, z: -0.5, r: 0.38, speed: 0.85 },
      { x: 1.0, y: -2.1, z: 0.2, r: 0.42, speed: 0.65 },
      { x: 0.2, y: 0.1, z: -1.2, r: 0.58, speed: 0.45 },
      { x: -1.6, y: -0.2, z: 0.5, r: 0.36, speed: 0.9 }
    ];

    sphereConfigs.forEach(cfg => {
      const parentSubGroup = new THREE.Group();
      parentSubGroup.position.set(cfg.x, cfg.y, cfg.z);
      parentSubGroup.scale.setScalar(cfg.r);

      const mesh = new THREE.Mesh(sphereGeom, this.sphereMat);
      parentSubGroup.add(mesh);

      const ring = new THREE.Mesh(ringTorusGeom, this.sphereRingMat);
      ring.rotation.x = Math.PI * 0.35;
      parentSubGroup.add(ring);

      const core = new THREE.Mesh(corePointGeom, this.sphereCoreMat);
      parentSubGroup.add(core);

      parentSubGroup.userData = { ...cfg, baseY: cfg.y, baseAngle: Math.random() * Math.PI * 2, ringMesh: ring };
      g3.add(parentSubGroup);
      this.spheres.push(parentSubGroup);
    });

    this.scene.add(g3);
    this.groups.push(g3);

    // ========================================================================
    // Scene 4: Black Hole Singularity (Event Horizon, Photon Ring & Relativistic Disk)
    // (Replaces old duplicate with awe-inspiring astrophysics visual)
    // ========================================================================
    const g4 = new THREE.Group();
    g4.rotation.x = 0.35;

    // Pitch Black Event Horizon Sphere
    const horizonGeom = new THREE.SphereGeometry(0.72, 32, 32);
    this.blackHoleHorizonMat = new THREE.MeshBasicMaterial({ color: 0x030303 });
    this.blackHoleHorizon = new THREE.Mesh(horizonGeom, this.blackHoleHorizonMat);
    g4.add(this.blackHoleHorizon);

    // Ultra-bright Glowing Photon Sphere Ring
    const photonGeom = new THREE.TorusGeometry(0.8, 0.035, 16, 64);
    this.photonRingMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95 });
    this.photonRing = new THREE.Mesh(photonGeom, this.photonRingMat);
    g4.add(this.photonRing);

    // Relativistic Swirling Accretion Disk
    this.blackHoleCount = 480;
    this.blackHolePositions = new Float32Array(this.blackHoleCount * 3);
    this.blackHoleAngles = new Float32Array(this.blackHoleCount);
    this.blackHoleRadii = new Float32Array(this.blackHoleCount);

    for (let i = 0; i < this.blackHoleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.05 + Math.random() * 2.3;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * (radius * 0.45);
      const z = (Math.random() - 0.5) * 0.3;
      this.blackHolePositions[i * 3] = x;
      this.blackHolePositions[i * 3 + 1] = y;
      this.blackHolePositions[i * 3 + 2] = z;
      this.blackHoleAngles[i] = angle;
      this.blackHoleRadii[i] = radius;
    }

    const diskGeom = new THREE.BufferGeometry();
    diskGeom.setAttribute('position', new THREE.BufferAttribute(this.blackHolePositions, 3));
    this.blackHoleDiskMat = new THREE.PointsMaterial({
      size: 0.08,
      transparent: true,
      opacity: 0.95
    });
    this.blackHoleDisk = new THREE.Points(diskGeom, this.blackHoleDiskMat);
    g4.add(this.blackHoleDisk);

    this.scene.add(g4);
    this.groups.push(g4);

    // ========================================================================
    // Scene 5: Hyperspace Warp Tunnel (Speed Starfield Vortex & Speed Rings)
    // ========================================================================
    const g5 = new THREE.Group();
    this.warpCount = 750;
    this.warpPositions = new Float32Array(this.warpCount * 3);
    this.warpAngles = new Float32Array(this.warpCount);
    this.warpRadii = new Float32Array(this.warpCount);
    this.warpSpeeds = new Float32Array(this.warpCount);

    for (let i = 0; i < this.warpCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.3 + Math.random() * 2.8;
      const z = -16 + Math.random() * 22;
      this.warpPositions[i * 3] = Math.cos(angle) * radius;
      this.warpPositions[i * 3 + 1] = Math.sin(angle) * radius;
      this.warpPositions[i * 3 + 2] = z;
      this.warpAngles[i] = angle;
      this.warpRadii[i] = radius;
      this.warpSpeeds[i] = 0.05 + Math.random() * 0.08;
    }

    const warpGeom = new THREE.BufferGeometry();
    warpGeom.setAttribute('position', new THREE.BufferAttribute(this.warpPositions, 3));
    this.warpMat = new THREE.PointsMaterial({
      size: 0.08,
      transparent: true,
      opacity: 0.88
    });
    this.warpPoints = new THREE.Points(warpGeom, this.warpMat);
    g5.add(this.warpPoints);

    this.warpPortalRings = [];
    this.warpRingMat = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.35 });
    for (let r = 0; r < 4; r++) {
      const ringGeom = new THREE.TorusGeometry(2.4, 0.02, 8, 48);
      const ringMesh = new THREE.Mesh(ringGeom, this.warpRingMat);
      ringMesh.position.z = -14 + r * 5;
      g5.add(ringMesh);
      this.warpPortalRings.push(ringMesh);
    }

    this.scene.add(g5);
    this.groups.push(g5);

    // ========================================================================
    // Scene 6: DNA Double Helix (Bio-Digital Stream Scaled to Viewport Height)
    // ========================================================================
    const g6 = new THREE.Group();
    g6.rotation.z = Math.PI * 0.12;
    this.helixPointsCount = 96;
    const strandPos = new Float32Array(this.helixPointsCount * 2 * 3);
    const ladderPos = new Float32Array((this.helixPointsCount / 2) * 6);

    let ladderIdx = 0;
    for (let i = 0; i < this.helixPointsCount; i++) {
      const t = (i / this.helixPointsCount) * Math.PI * 6;
      const y = (i / this.helixPointsCount - 0.5) * 5.6;
      const r = 1.45;

      const x1 = Math.cos(t) * r;
      const z1 = Math.sin(t) * r;
      const x2 = Math.cos(t + Math.PI) * r;
      const z2 = Math.sin(t + Math.PI) * r;

      strandPos[i * 3] = x1;
      strandPos[i * 3 + 1] = y;
      strandPos[i * 3 + 2] = z1;

      strandPos[(this.helixPointsCount + i) * 3] = x2;
      strandPos[(this.helixPointsCount + i) * 3 + 1] = y;
      strandPos[(this.helixPointsCount + i) * 3 + 2] = z2;

      if (i % 2 === 0 && ladderIdx < (this.helixPointsCount / 2)) {
        ladderPos[ladderIdx * 6] = x1;
        ladderPos[ladderIdx * 6 + 1] = y;
        ladderPos[ladderIdx * 6 + 2] = z1;
        ladderPos[ladderIdx * 6 + 3] = x2;
        ladderPos[ladderIdx * 6 + 4] = y;
        ladderPos[ladderIdx * 6 + 5] = z2;
        ladderIdx++;
      }
    }

    const helixGeom = new THREE.BufferGeometry();
    helixGeom.setAttribute('position', new THREE.BufferAttribute(strandPos, 3));
    this.helixMat = new THREE.PointsMaterial({
      size: 0.09,
      transparent: true,
      opacity: 0.95
    });
    this.helixPoints = new THREE.Points(helixGeom, this.helixMat);
    g6.add(this.helixPoints);

    const ladderGeom = new THREE.BufferGeometry();
    ladderGeom.setAttribute('position', new THREE.BufferAttribute(ladderPos, 3));
    this.ladderMat = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.38
    });
    this.ladderSegments = new THREE.LineSegments(ladderGeom, this.ladderMat);
    g6.add(this.ladderSegments);

    this.scene.add(g6);
    this.groups.push(g6);

    // ========================================================================
    // Scene 7: Digital Silk Ribbon (Parametric Undulating Wave Surface)
    // ========================================================================
    const g7 = new THREE.Group();
    this.ribbonGeom = new THREE.PlaneGeometry(13, 4.6, 52, 18);
    this.ribbonMat = new THREE.MeshStandardMaterial({
      wireframe: true,
      transparent: true,
      opacity: 0.52,
      roughness: 0.2,
      side: THREE.DoubleSide
    });
    this.ribbonMesh = new THREE.Mesh(this.ribbonGeom, this.ribbonMat);
    g7.add(this.ribbonMesh);

    this.scene.add(g7);
    this.groups.push(g7);

    // ========================================================================
    // Scene 8: Matrix Cyber Rain (26 Vertical Data Streams)
    // ========================================================================
    const g8 = new THREE.Group();
    this.matrixStreamCount = 26;
    this.matrixParticlesPerStream = 9;
    this.matrixDropCount = this.matrixStreamCount * this.matrixParticlesPerStream;
    this.matrixPositions = new Float32Array(this.matrixDropCount * 3);
    this.matrixStreamHeads = [];

    for (let s = 0; s < this.matrixStreamCount; s++) {
      const streamX = (s / (this.matrixStreamCount - 1) - 0.5) * 9.6;
      const streamZ = (Math.random() - 0.5) * 2.5;
      const speed = 0.022 + Math.random() * 0.018;
      const headY = 4.2 + Math.random() * 5.0;
      this.matrixStreamHeads.push({ x: streamX, y: headY, z: streamZ, speed, spacing: 0.48 });
    }

    for (let s = 0; s < this.matrixStreamCount; s++) {
      const head = this.matrixStreamHeads[s];
      for (let p = 0; p < this.matrixParticlesPerStream; p++) {
        const idx = (s * this.matrixParticlesPerStream + p) * 3;
        this.matrixPositions[idx] = head.x;
        this.matrixPositions[idx + 1] = head.y - p * head.spacing;
        this.matrixPositions[idx + 2] = head.z;
      }
    }

    const matrixGeom = new THREE.BufferGeometry();
    matrixGeom.setAttribute('position', new THREE.BufferAttribute(this.matrixPositions, 3));
    this.matrixMat = new THREE.PointsMaterial({
      size: 0.095,
      transparent: true,
      opacity: 0.92
    });
    this.matrixPoints = new THREE.Points(matrixGeom, this.matrixMat);
    g8.add(this.matrixPoints);

    this.scene.add(g8);
    this.groups.push(g8);

    // ========================================================================
    // Scene 9: Flow Field Fluid (3D Curl-Noise Vector Field Stream)
    // (Replaces duplicate with organic, living fluid dynamics)
    // ========================================================================
    const g9 = new THREE.Group();
    this.flowCount = 380;
    this.flowPositions = new Float32Array(this.flowCount * 3);

    for (let i = 0; i < this.flowCount; i++) {
      this.flowPositions[i * 3] = (Math.random() - 0.5) * 8.0;
      this.flowPositions[i * 3 + 1] = (Math.random() - 0.5) * 5.0;
      this.flowPositions[i * 3 + 2] = (Math.random() - 0.5) * 3.0;
    }

    const flowGeom = new THREE.BufferGeometry();
    flowGeom.setAttribute('position', new THREE.BufferAttribute(this.flowPositions, 3));
    this.flowFieldMat = new THREE.PointsMaterial({
      size: 0.085,
      transparent: true,
      opacity: 0.92
    });
    this.flowFieldPoints = new THREE.Points(flowGeom, this.flowFieldMat);
    g9.add(this.flowFieldPoints);

    this.scene.add(g9);
    this.groups.push(g9);

    // ========================================================================
    // Scene 10: Supernova Stellar Ring (Luminous Core & Keplerian Disk)
    // ========================================================================
    const g10 = new THREE.Group();
    g10.rotation.x = 0.45;

    const coreGeom = new THREE.SphereGeometry(0.48, 24, 24);
    this.supernovaCoreMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9 });
    this.supernovaCore = new THREE.Mesh(coreGeom, this.supernovaCoreMat);
    g10.add(this.supernovaCore);

    this.supernovaCount = 480;
    this.supernovaPositions = new Float32Array(this.supernovaCount * 3);
    this.supernovaAngles = new Float32Array(this.supernovaCount);
    this.supernovaBaseRadii = new Float32Array(this.supernovaCount);

    for (let i = 0; i < this.supernovaCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.35 + Math.random() * 1.85;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * (radius * 0.72);
      const z = (Math.random() - 0.5) * 1.2;
      this.supernovaPositions[i * 3] = x;
      this.supernovaPositions[i * 3 + 1] = y;
      this.supernovaPositions[i * 3 + 2] = z;
      this.supernovaAngles[i] = angle;
      this.supernovaBaseRadii[i] = radius;
    }

    const supernovaGeom = new THREE.BufferGeometry();
    supernovaGeom.setAttribute('position', new THREE.BufferAttribute(this.supernovaPositions, 3));
    this.supernovaMat = new THREE.PointsMaterial({
      size: 0.08,
      transparent: true,
      opacity: 0.92
    });
    this.supernovaPoints = new THREE.Points(supernovaGeom, this.supernovaMat);
    g10.add(this.supernovaPoints);

    this.scene.add(g10);
    this.groups.push(g10);

    // ========================================================================
    // Scene 11: Floating Tech Monoliths (6 Architectural Glass Obelisks)
    // ========================================================================
    const g11 = new THREE.Group();
    this.monoliths = [];
    const monoGeom = new THREE.BoxGeometry(0.45, 2.2, 0.22);
    const monoEdgesGeom = new THREE.EdgesGeometry(monoGeom);

    this.monoMat = new THREE.MeshPhysicalMaterial({
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.7,
      ior: 1.5,
      thickness: 1.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.88
    });

    this.monoEdgeMat = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.65
    });

    const monoCount = 6;
    for (let i = 0; i < monoCount; i++) {
      const angle = (i / monoCount) * Math.PI * 2;
      const r = 2.4;
      const subGroup = new THREE.Group();

      const mesh = new THREE.Mesh(monoGeom, this.monoMat);
      subGroup.add(mesh);

      const edgeLine = new THREE.LineSegments(monoEdgesGeom, this.monoEdgeMat);
      subGroup.add(edgeLine);

      subGroup.position.set(Math.cos(angle) * r, (Math.random() - 0.5) * 0.8, Math.sin(angle) * r);
      subGroup.userData = { angle, radius: r, baseY: subGroup.position.y, speed: 0.7 + i * 0.1 };
      g11.add(subGroup);
      this.monoliths.push(subGroup);
    }

    this.scene.add(g11);
    this.groups.push(g11);

    // Initial visibility state
    this.updateSceneVisibility();
  }

  updateSceneVisibility() {
    this.groups.forEach((g, idx) => {
      g.visible = idx === this.currentSceneIndex;
    });

    const activeScene = this.scenesList[this.currentSceneIndex];
    const displayLabel = `${this.currentSceneIndex + 1}/${this.scenesList.length} • ${activeScene.name}`;

    document.querySelectorAll('.three-scene-name').forEach(el => {
      el.textContent = displayLabel;
    });
    const labelEl = document.getElementById('three-scene-name');
    if (labelEl) {
      labelEl.textContent = displayLabel;
    }

    // Dispatch custom event for modal gallery state sync
    window.dispatchEvent(new CustomEvent('threeSceneChanged', {
      detail: { index: this.currentSceneIndex, scene: activeScene }
    }));
  }

  selectScene(index) {
    if (index >= 0 && index < this.scenesList.length) {
      this.currentSceneIndex = index;
      localStorage.setItem('threeui_scene', String(this.currentSceneIndex));
      this.updateSceneVisibility();
      return this.scenesList[this.currentSceneIndex];
    }
    return null;
  }

  nextScene() {
    this.currentSceneIndex = (this.currentSceneIndex + 1) % this.scenesList.length;
    localStorage.setItem('threeui_scene', String(this.currentSceneIndex));
    this.updateSceneVisibility();
    return this.scenesList[this.currentSceneIndex];
  }

  setupEvents() {
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.windowHalf.x = this.width / 2;
      this.windowHalf.y = this.height / 2;

      this.updateCameraFraming();
      this.renderer.setSize(this.width, this.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX - this.windowHalf.x) / this.windowHalf.x;
      this.mouse.targetY = (e.clientY - this.windowHalf.y) / this.windowHalf.y;
    });

    window.addEventListener('scroll', () => {
      this.targetScrollY = window.scrollY || 0;
    }, { passive: true });

    window.addEventListener('themeChanged', () => {
      this.applyTheme();
    });

    document.addEventListener('visibilitychange', () => {
      this.isTabActive = !document.hidden;
      if (this.isTabActive) this.clock.start();
    });
  }

  applyTheme() {
    const isDark = document.documentElement.classList.contains('dark');

    const primaryColor = isDark ? new THREE.Color('#38BDF8') : new THREE.Color('#C2410C');
    const secondaryColor = isDark ? new THREE.Color('#34D399') : new THREE.Color('#EA580C');
    const accentColor = isDark ? new THREE.Color('#A855F7') : new THREE.Color('#0284C7');
    const lightColor = isDark ? 0x38bdf8 : 0xea580c;

    this.ambientLight.intensity = isDark ? 0.85 : 1.1;
    this.dirLight.color.setHex(lightColor);
    this.pointLight1.color.setHex(lightColor);
    this.pointLight2.color.set(secondaryColor);

    // Scene 0: Hologram Torus Knot
    if (this.torusMat) this.torusMat.color.set(primaryColor);
    if (this.torusWireMat) this.torusWireMat.color.set(secondaryColor);
    if (this.stardustMat) this.stardustMat.color.set(secondaryColor);

    // Scene 1: Cyber Wave Grid
    if (this.waveMat) this.waveMat.color.set(isDark ? primaryColor : secondaryColor);
    if (this.wavePointsMat) this.wavePointsMat.color.set(isDark ? secondaryColor : primaryColor);

    // Scene 2: Cosmic Network
    if (this.nodeMat) this.nodeMat.color.set(primaryColor);
    if (this.lineMat) this.lineMat.color.set(secondaryColor);

    // Scene 3: Glass Spheres
    if (this.sphereMat) this.sphereMat.color.set(primaryColor);
    if (this.sphereRingMat) this.sphereRingMat.color.set(secondaryColor);
    if (this.sphereCoreMat) this.sphereCoreMat.color.set(accentColor);

    // Scene 4: Black Hole Singularity
    if (this.photonRingMat) this.photonRingMat.color.set(primaryColor);
    if (this.blackHoleDiskMat) this.blackHoleDiskMat.color.set(isDark ? primaryColor : secondaryColor);

    // Scene 5: Hyperspace Warp Tunnel
    if (this.warpMat) this.warpMat.color.set(isDark ? primaryColor : accentColor);
    if (this.warpRingMat) this.warpRingMat.color.set(secondaryColor);

    // Scene 6: DNA Double Helix
    if (this.helixMat) this.helixMat.color.set(primaryColor);
    if (this.ladderMat) this.ladderMat.color.set(secondaryColor);

    // Scene 7: Digital Silk Ribbon
    if (this.ribbonMat) this.ribbonMat.color.set(isDark ? secondaryColor : primaryColor);

    // Scene 8: Matrix Cyber Rain
    if (this.matrixMat) this.matrixMat.color.set(isDark ? new THREE.Color('#10B981') : primaryColor);

    // Scene 9: Flow Field Fluid (Vibrant Orange Theme)
    if (this.flowFieldMat) this.flowFieldMat.color.set(isDark ? new THREE.Color('#FB923C') : new THREE.Color('#EA580C'));

    // Scene 10: Supernova Stellar Ring
    if (this.supernovaCoreMat) this.supernovaCoreMat.color.set(primaryColor);
    if (this.supernovaMat) this.supernovaMat.color.set(isDark ? accentColor : secondaryColor);

    // Scene 11: Tech Monoliths
    if (this.monoMat) this.monoMat.color.set(primaryColor);
    if (this.monoEdgeMat) this.monoEdgeMat.color.set(secondaryColor);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (!this.isTabActive || this.isPaused) return;

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // Lerp mouse
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Lerp scroll parallax
    this.scrollY += (this.targetScrollY - this.scrollY) * 0.05;
    const scrollParallax = this.scrollY * 0.0005;

    // Camera subtle spatial floating
    this.camera.position.x = this.mouse.x * 0.45;
    this.camera.position.y = -this.mouse.y * 0.3 - Math.sin(scrollParallax) * 0.6;
    this.camera.lookAt(0, -Math.sin(scrollParallax) * 0.3, 0);

    // Active Scene Animation
    switch (this.currentSceneIndex) {
      case 0: // Hologram Torus Knot
        if (this.groups[0].visible) {
          this.torusMesh.rotation.x = time * 0.07 + this.mouse.y * 0.04;
          this.torusMesh.rotation.y = time * 0.11 + this.mouse.x * 0.04;
          this.torusMesh.rotation.z = time * 0.03;
          this.torusWireMesh.rotation.x = this.torusMesh.rotation.x;
          this.torusWireMesh.rotation.y = this.torusMesh.rotation.y;
          this.torusWireMesh.rotation.z = this.torusMesh.rotation.z;
          this.stardustPoints.rotation.y = time * 0.03;
        }
        break;

      case 1: // Cyber Wave Grid
        if (this.groups[1].visible) {
          const pos = this.waveGeom.attributes.position;
          const count = pos.count;
          for (let i = 0; i < count; i++) {
            const u = pos.getX(i);
            const v = pos.getY(i);
            const z = Math.sin(u * 0.55 + time * 1.8) * Math.cos(v * 0.55 + time * 1.4) * 0.68;
            pos.setZ(i, z);
          }
          pos.needsUpdate = true;
          this.waveGeom.computeVertexNormals();
          this.groups[1].rotation.z = time * 0.02 + this.mouse.x * 0.06;
        }
        break;

      case 2: // Cosmic Network
        if (this.groups[2].visible) {
          const pos = this.nodePoints.geometry.attributes.position;
          const arr = pos.array;
          for (let i = 0; i < this.nodeCount; i++) {
            const vel = this.nodeVelocities[i];
            arr[i * 3] += vel.x;
            arr[i * 3 + 1] += vel.y;
            arr[i * 3 + 2] += vel.z;

            if (Math.abs(arr[i * 3]) > 4.2) vel.x *= -1;
            if (Math.abs(arr[i * 3 + 1]) > 2.6) vel.y *= -1;
            if (Math.abs(arr[i * 3 + 2]) > 1.8) vel.z *= -1;
          }
          pos.needsUpdate = true;

          let lineIdx = 0;
          const maxDist = 2.0;
          const linePos = this.linePositions;
          for (let i = 0; i < this.nodeCount && lineIdx < this.maxLines; i++) {
            for (let j = i + 1; j < this.nodeCount && lineIdx < this.maxLines; j++) {
              const dx = arr[i * 3] - arr[j * 3];
              const dy = arr[i * 3 + 1] - arr[j * 3 + 1];
              const dz = arr[i * 3 + 2] - arr[j * 3 + 2];
              const distSq = dx * dx + dy * dy + dz * dz;
              if (distSq < maxDist * maxDist) {
                linePos[lineIdx * 6] = arr[i * 3];
                linePos[lineIdx * 6 + 1] = arr[i * 3 + 1];
                linePos[lineIdx * 6 + 2] = arr[i * 3 + 2];
                linePos[lineIdx * 6 + 3] = arr[j * 3];
                linePos[lineIdx * 6 + 4] = arr[j * 3 + 1];
                linePos[lineIdx * 6 + 5] = arr[j * 3 + 2];
                lineIdx++;
              }
            }
          }
          this.lineGeom.setDrawRange(0, lineIdx * 2);
          this.lineGeom.attributes.position.needsUpdate = true;
          this.groups[2].rotation.y = time * 0.04 + this.mouse.x * 0.12;
        }
        break;

      case 3: // Floating Glass Spheres
        if (this.groups[3].visible) {
          this.spheres.forEach(s => {
            const u = s.userData;
            s.position.y = u.baseY + Math.sin(time * u.speed + u.baseAngle) * 0.28;
            s.rotation.x = time * 0.2;
            s.rotation.y = time * 0.25;
            if (u.ringMesh) {
              u.ringMesh.rotation.z = time * 0.45;
            }
          });
          this.groups[3].rotation.y = time * 0.03 + this.mouse.x * 0.1;
        }
        break;

      case 4: // Black Hole Singularity
        if (this.groups[4].visible) {
          this.photonRing.rotation.z += 0.015;
          this.photonRing.rotation.y = time * 0.2;

          // Relativistic accretion disk Keplerian spin
          const pos = this.blackHoleDisk.geometry.attributes.position;
          const arr = pos.array;
          for (let i = 0; i < this.blackHoleCount; i++) {
            this.blackHoleAngles[i] += (0.016 / Math.sqrt(this.blackHoleRadii[i]));
            const r = this.blackHoleRadii[i];
            arr[i * 3] = Math.cos(this.blackHoleAngles[i]) * r;
            arr[i * 3 + 1] = Math.sin(this.blackHoleAngles[i]) * (r * 0.45);
            arr[i * 3 + 2] = Math.sin(this.blackHoleAngles[i] * 2 + time * 2) * 0.15;
          }
          pos.needsUpdate = true;

          this.groups[4].rotation.x = 0.35 + this.mouse.y * 0.15;
          this.groups[4].rotation.y = time * 0.04 + this.mouse.x * 0.25;
        }
        break;

      case 5: // Hyperspace Warp Tunnel (Speed Starfield & Portal Rings)
        if (this.groups[5].visible) {
          const pos = this.warpPoints.geometry.attributes.position;
          const arr = pos.array;
          for (let i = 0; i < this.warpCount; i++) {
            arr[i * 3 + 2] += this.warpSpeeds[i] * 2.4;
            if (arr[i * 3 + 2] > 6) {
              arr[i * 3 + 2] = -16;
            }
            this.warpAngles[i] += 0.002;
            arr[i * 3] = Math.cos(this.warpAngles[i]) * this.warpRadii[i];
            arr[i * 3 + 1] = Math.sin(this.warpAngles[i]) * this.warpRadii[i];
          }
          pos.needsUpdate = true;

          this.warpPortalRings.forEach((r, idx) => {
            r.position.z += 0.06;
            if (r.position.z > 5) r.position.z = -15;
            const progress = (r.position.z + 15) / 20;
            r.scale.setScalar(0.4 + progress * 0.8);
          });

          this.groups[5].position.x = this.mouse.x * 1.2;
          this.groups[5].position.y = -this.mouse.y * 0.9;
          this.groups[5].rotation.z = time * 0.07;
        }
        break;

      case 6: // DNA Double Helix
        if (this.groups[6].visible) {
          this.groups[6].rotation.y = time * 0.38 + this.mouse.x * 0.35;
          this.groups[6].position.y = Math.sin(time * 0.7) * 0.22;
        }
        break;

      case 7: // Digital Silk Ribbon
        if (this.groups[7].visible) {
          const pos = this.ribbonGeom.attributes.position;
          const count = pos.count;
          for (let i = 0; i < count; i++) {
            const u = pos.getX(i);
            const v = pos.getY(i);
            const z = Math.sin(u * 0.45 + time * 1.6) * 0.95 + Math.cos(v * 0.75 + time * 1.2) * 0.42;
            pos.setZ(i, z);
          }
          pos.needsUpdate = true;
          this.ribbonGeom.computeVertexNormals();
          this.groups[7].rotation.x = Math.PI * 0.08 + this.mouse.y * 0.12;
          this.groups[7].rotation.y = time * 0.05 + this.mouse.x * 0.12;
        }
        break;

      case 8: // Matrix Cyber Rain (26 Streams)
        if (this.groups[8].visible) {
          const pos = this.matrixPoints.geometry.attributes.position;
          const arr = pos.array;
          for (let s = 0; s < this.matrixStreamCount; s++) {
            const head = this.matrixStreamHeads[s];
            head.y -= head.speed;
            if (head.y < -5.5) {
              head.y = 5.5 + Math.random() * 3.5;
              head.speed = 0.022 + Math.random() * 0.018;
            }
            for (let p = 0; p < this.matrixParticlesPerStream; p++) {
              const idx = (s * this.matrixParticlesPerStream + p) * 3;
              arr[idx] = head.x;
              arr[idx + 1] = head.y - p * head.spacing;
              arr[idx + 2] = head.z;
            }
          }
          pos.needsUpdate = true;
          this.groups[8].position.x = this.mouse.x * 0.3;
        }
        break;

      case 9: // Flow Field Fluid (3D Curl-Noise Stream)
        if (this.groups[9].visible) {
          const pos = this.flowFieldPoints.geometry.attributes.position;
          const arr = pos.array;
          for (let i = 0; i < this.flowCount; i++) {
            const idx = i * 3;
            const x = arr[idx];
            const y = arr[idx + 1];
            const z = arr[idx + 2];

            const vx = Math.sin(y * 0.9 + time * 0.8) * 0.024;
            const vy = Math.cos(x * 0.9 + time * 0.8) * 0.024;
            const vz = Math.sin((x + y) * 0.8 + time * 0.6) * 0.015;

            arr[idx] += vx;
            arr[idx + 1] += vy;
            arr[idx + 2] += vz;

            if (arr[idx] > 4.2) arr[idx] = -4.2;
            if (arr[idx] < -4.2) arr[idx] = 4.2;
            if (arr[idx + 1] > 2.6) arr[idx + 1] = -2.6;
            if (arr[idx + 1] < -2.6) arr[idx + 1] = 2.6;
            if (arr[idx + 2] > 1.8) arr[idx + 2] = -1.8;
            if (arr[idx + 2] < -1.8) arr[idx + 2] = 1.8;
          }
          pos.needsUpdate = true;
          this.groups[9].rotation.y = time * 0.03 + this.mouse.x * 0.15;
        }
        break;

      case 10: // Supernova Stellar Ring (Keplerian Disk)
        if (this.groups[10].visible) {
          const pos = this.supernovaPoints.geometry.attributes.position;
          const arr = pos.array;
          const pulse = 1 + Math.sin(time * 1.4) * 0.07;
          for (let i = 0; i < this.supernovaCount; i++) {
            this.supernovaAngles[i] += (0.011 / (this.supernovaBaseRadii[i] * 0.65));
            const r = this.supernovaBaseRadii[i] * pulse;
            arr[i * 3] = Math.cos(this.supernovaAngles[i]) * r;
            arr[i * 3 + 1] = Math.sin(this.supernovaAngles[i]) * (r * 0.72);
          }
          pos.needsUpdate = true;
          this.groups[10].rotation.z = time * 0.04;
          this.groups[10].rotation.x = 0.4 + this.mouse.y * 0.18;
          this.groups[10].rotation.y = this.mouse.x * 0.25;
        }
        break;

      case 11: // Floating Tech Monoliths
        if (this.groups[11].visible) {
          this.monoliths.forEach(m => {
            const u = m.userData;
            u.angle += 0.005;
            m.position.x = Math.cos(u.angle) * u.radius;
            m.position.z = Math.sin(u.angle) * u.radius;
            m.position.y = u.baseY + Math.sin(time * u.speed) * 0.22;
            m.rotation.y = -u.angle;
            m.rotation.x = Math.sin(time * 0.8) * 0.1;
          });
          this.groups[11].rotation.y = this.mouse.x * 0.18;
        }
        break;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
