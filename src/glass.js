/**
 * Apple iOS 26 "Liquid Glass" Engine — src/glass.js
 * ============================================================================
 * - Procedurally generates a rounded-rect convex lens displacement map (PNG)
 *   and injects SVG <feDisplacementMap> filters (#glass-refraction and
 *   #glass-refraction-strong) for true edge refraction in Chromium/Edge.
 * - Safari & Firefox do not yet support SVG url() inside CSS backdrop-filter;
 *   we detect engine support and let those browsers gracefully fall back to
 *   the translucent blur + pointer-reactive specular rim defined in glass.css.
 * - Handles rAF-throttled pointer specular highlights (--pointer-x / --pointer-y),
 *   fluid navbar morphing on scroll, and live prefers-reduced-motion /
 *   prefers-reduced-transparency accessibility listeners.
 */

function isLowEndDevice() {
  const cores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 4;
  const mem = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : 4;
  return cores <= 2 || mem <= 2;
}

/**
 * Detect whether the current browser supports SVG filter url() inside CSS
 * backdrop-filter. Currently Blink (Chrome, Edge, Opera, Brave, Arc) renders
 * backdrop-filter: url(#id) with real <feDisplacementMap> refraction;
 * WebKit (Safari) and Gecko (Firefox) ignore url() inside backdrop-filter
 * and fall back to the translucent blur + specular highlight layer in glass.css.
 */
function supportsBackdropSvgRefraction() {
  if (typeof window === 'undefined' || typeof CSS === 'undefined' || !CSS.supports) {
    return false;
  }
  const cssOk = CSS.supports('backdrop-filter', 'url(#glass-refraction)');
  if (!cssOk) return false;
  const ua = navigator.userAgent || '';
  const isFirefox = /Firefox\//i.test(ua);
  const isSafariOnly = /Safari\//i.test(ua) && !/Chrome\/|Chromium\/|Edg\//i.test(ua);
  return !isFirefox && !isSafariOnly;
}

/**
 * Generates a 256x256 PNG displacement map encoding a convex rounded-rect glass
 * bezel: neutral (R=128, G=128) across the center so text stays razor-sharp,
 * and smoothly curved outward normals along the outer bezel so background lines
 * and colors visibly bend/refract at the glass perimeter.
 */
function buildRefractionMapDataURL(bezelRatio = 0.24, cornerRadius = 0.28) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const img = ctx.createImageData(size, size);
  const data = img.data;
  const half = 0.5;
  const r = cornerRadius;
  const bx = half - r;
  const by = half - r;

  for (let y = 0; y < size; y++) {
    const ny = (y + 0.5) / size - 0.5; // -0.5 .. +0.5
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5) / size - 0.5;

      // Signed distance to rounded-rectangle edge (negative inside, 0 at edge)
      const qx = Math.abs(nx) - bx;
      const qy = Math.abs(ny) - by;
      const outX = Math.max(qx, 0);
      const outY = Math.max(qy, 0);
      const outDist = Math.hypot(outX, outY);
      const inDist = Math.min(Math.max(qx, qy), 0);
      const sdf = outDist + inDist - r; // negative inside shape

      let dx = 0;
      let dy = 0;

      // Inside the curved bezel band (-bezelRatio .. 0)
      if (sdf > -bezelRatio && sdf <= 0.02) {
        const t = Math.max(0, Math.min(1, (sdf + bezelRatio) / bezelRatio));
        // Smooth optical lens profile: subtle start, strongest refraction near the rim
        const lensCurve = Math.pow(t, 1.9);

        // Compute outward normal of the rounded rectangle
        let gx = 0;
        let gy = 0;
        if (outDist > 1e-5) {
          gx = (outX / outDist) * Math.sign(nx);
          gy = (outY / outDist) * Math.sign(ny);
        } else if (qx > qy) {
          gx = Math.sign(nx);
          gy = 0;
        } else {
          gx = 0;
          gy = Math.sign(ny);
        }

        // Convex lens pulls peripheral rays slightly inward toward the rim
        dx = -gx * lensCurve;
        dy = -gy * lensCurve;
      }

      const idx = (y * size + x) * 4;
      data[idx] = Math.max(0, Math.min(255, Math.round(128 + dx * 127)));
      data[idx + 1] = Math.max(0, Math.min(255, Math.round(128 + dy * 127)));
      data[idx + 2] = 128;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}

function injectRefractionSVG() {
  if (document.getElementById('liquid-glass-svg')) return;

  const mapUrl = buildRefractionMapDataURL(0.24, 0.26);
  if (!mapUrl) return;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.id = 'liquid-glass-svg';
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.cssText = 'position:fixed;width:0;height:0;pointer-events:none;overflow:hidden;';

  svg.innerHTML = `
    <defs>
      <filter id="glass-refraction" x="-12%" y="-12%" width="124%" height="124%" color-interpolation-filters="sRGB">
        <feImage href="${mapUrl}" preserveAspectRatio="none" result="refractMap" />
        <feDisplacementMap in="SourceGraphic" in2="refractMap" scale="44" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="glass-refraction-strong" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
        <feImage href="${mapUrl}" preserveAspectRatio="none" result="refractMapStrong" />
        <feDisplacementMap in="SourceGraphic" in2="refractMapStrong" scale="72" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  `;

  document.body.appendChild(svg);
}

export function initLiquidGlass() {
  if (typeof window === 'undefined' || window.__liquidGlassInitialized) return;
  window.__liquidGlassInitialized = true;

  const root = document.documentElement;
  const reducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reducedTransparencyMQ = window.matchMedia('(prefers-reduced-transparency: reduce)');

  // 1. Sync data-theme attribute with existing html.dark toggle & prefers-color-scheme
  const syncThemeAttr = () => {
    const isDark = root.classList.contains('dark');
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  };
  syncThemeAttr();
  window.addEventListener('themeChanged', syncThemeAttr);

  // 2. Enable true SVG refraction if supported and accessible
  const updateRefractionCapability = () => {
    const allowRefraction =
      supportsBackdropSvgRefraction() &&
      !isLowEndDevice() &&
      !reducedTransparencyMQ.matches;

    if (allowRefraction) {
      injectRefractionSVG();
      root.classList.add('glass-refraction-supported');
      root.classList.remove('no-svg-refraction');
    } else {
      root.classList.remove('glass-refraction-supported');
      root.classList.add('no-svg-refraction');
    }
  };
  updateRefractionCapability();
  if (reducedTransparencyMQ.addEventListener) {
    reducedTransparencyMQ.addEventListener('change', updateRefractionCapability);
  }

  // 3. Delegated rAF-throttled pointer specular highlights (--pointer-x / --pointer-y)
  let activeGlassEl = null;
  let cachedRect = null;
  let pointerRaf = 0;
  let pendingX = 0;
  let pendingY = 0;

  const clearActivePointer = () => {
    if (activeGlassEl) {
      activeGlassEl.style.setProperty('--pointer-opacity', '0');
      activeGlassEl = null;
      cachedRect = null;
    }
  };

  document.addEventListener('pointerover', (e) => {
    if (reducedMotionMQ.matches || e.pointerType === 'touch') return;
    const target = e.target && e.target.closest ? e.target.closest('.glass-specular') : null;
    if (target === activeGlassEl) return;

    clearActivePointer();
    if (target) {
      activeGlassEl = target;
      cachedRect = target.getBoundingClientRect();
      target.style.setProperty('--pointer-opacity', '1');
    }
  }, { passive: true });

  document.addEventListener('pointermove', (e) => {
    if (!activeGlassEl || !cachedRect || reducedMotionMQ.matches) return;
    pendingX = e.clientX;
    pendingY = e.clientY;

    if (!pointerRaf) {
      pointerRaf = requestAnimationFrame(() => {
        pointerRaf = 0;
        if (!activeGlassEl || !cachedRect) return;
        const x = Math.max(0, Math.min(cachedRect.width, pendingX - cachedRect.left));
        const y = Math.max(0, Math.min(cachedRect.height, pendingY - cachedRect.top));
        activeGlassEl.style.setProperty('--pointer-x', `${x.toFixed(1)}px`);
        activeGlassEl.style.setProperty('--pointer-y', `${y.toFixed(1)}px`);
      });
    }
  }, { passive: true });

  document.addEventListener('pointerout', (e) => {
    if (!activeGlassEl) return;
    const related = e.relatedTarget && e.relatedTarget.closest
      ? e.relatedTarget.closest('.glass-specular')
      : null;
    if (related !== activeGlassEl) {
      clearActivePointer();
    }
  }, { passive: true });

  // Refresh cached rect on scroll/resize if pointer stays over fixed nav
  const invalidateRect = () => {
    if (activeGlassEl) {
      cachedRect = activeGlassEl.getBoundingClientRect();
    }
  };
  window.addEventListener('resize', invalidateRect, { passive: true });

  // 4. Fluid Morphing Top Navbar (shrink on scroll down, expand on scroll up)
  const navbar = document.getElementById('navbar');
  if (navbar) {
    let lastScrollY = window.scrollY || 0;
    let navRaf = 0;
    let currentState = 'expanded';
    navbar.setAttribute('data-nav-state', 'expanded');

    const updateNavMorph = () => {
      navRaf = 0;
      if (reducedMotionMQ.matches) {
        if (currentState !== 'expanded') {
          currentState = 'expanded';
          navbar.setAttribute('data-nav-state', 'expanded');
        }
        return;
      }

      const y = window.scrollY || 0;
      const delta = y - lastScrollY;

      let nextState = currentState;
      if (y < 48) {
        nextState = 'expanded';
      } else if (delta > 8 && y > 80) {
        nextState = 'compact';
      } else if (delta < -10) {
        nextState = 'expanded';
      }

      if (nextState !== currentState) {
        currentState = nextState;
        navbar.setAttribute('data-nav-state', nextState);
        invalidateRect();
      }
      lastScrollY = y;
    };

    window.addEventListener('scroll', () => {
      if (!navRaf) {
        navRaf = requestAnimationFrame(updateNavMorph);
      }
    }, { passive: true });
  }
}

// Auto-initialize when loaded directly (e.g. on glass-demo.html)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initLiquidGlass());
} else {
  initLiquidGlass();
}
