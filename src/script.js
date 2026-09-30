import './security.js';
import { ThreeUIBackground } from './three-background.js';
import { MiniThreePreviewEngine } from './mini-previews.js';
import { ThreeUIHeroArtefact, ThreeUISpatialBento, ThreeUIContactBeacon } from './three-effects.js';
import { GhibliSeasonsCanvas } from './ghibli-canvas.js';

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Theme Management (Studio Light / Studio Dark) ---
  const themeToggleButtons = document.querySelectorAll('.theme-toggle');
  
  const savedTheme = localStorage.getItem('theme');
  const isDarkMode = savedTheme === 'dark';

  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  function updateThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    document.querySelectorAll('.sun-icon').forEach(el => el.classList.toggle('hidden', !isDark));
    document.querySelectorAll('.moon-icon').forEach(el => el.classList.toggle('hidden', isDark));
  }
  updateThemeIcons();

  themeToggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      updateThemeIcons();
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark } }));
    });
  });

  // --- 2. Interactive Mockup Switcher (Tabs, Dots & Auto-cycle) ---
  const projectContainers = document.querySelectorAll('[data-project-switcher]');
  projectContainers.forEach(container => {
    const mainImg = container.querySelector('.project-main-image');
    const tabBtns = container.querySelectorAll('.switcher-tab-btn');
    const dots = container.querySelectorAll('.img-switcher-dot');
    const imagesAttr = container.getAttribute('data-images');

    if (mainImg && imagesAttr) {
      try {
        const imagesList = JSON.parse(imagesAttr);
        const descAttr = container.getAttribute('data-descriptions');
        const descriptionsList = descAttr ? JSON.parse(descAttr) : null;
        const descEl = container.querySelector('.project-switcher-desc');

        const titleAttr = container.getAttribute('data-titles');
        const titlesList = titleAttr ? JSON.parse(titleAttr) : null;
        const titleEl = container.querySelector('.project-switcher-title');

        const subtitleAttr = container.getAttribute('data-subtitles');
        const subtitlesList = subtitleAttr ? JSON.parse(subtitleAttr) : null;
        const subtitleEl = container.querySelector('.project-switcher-subtitle');

        let currentIndex = 0;
        let autoCycleTimer = null;

        const updateActiveVisuals = (index) => {
          if (index < 0 || index >= imagesList.length) return;
          currentIndex = index;
          
          // Image Transition
          mainImg.style.opacity = '0.2';
          mainImg.style.transform = 'scale(0.99)';
          
          setTimeout(() => {
            mainImg.src = imagesList[index];
            mainImg.style.opacity = '1';
            mainImg.style.transform = 'scale(1)';
            const phoneScroll = container.querySelector('.phone-screen-scroll');
            if (phoneScroll) {
              phoneScroll.scrollTop = 0;
              const hint = container.querySelector('.phone-scroll-hint');
              if (hint) hint.classList.remove('opacity-0', 'pointer-events-none');
            }
          }, 100);

          // Update Dynamic Text Descriptions (if present)
          if (descEl && descriptionsList && descriptionsList[index]) {
            descEl.style.opacity = '0.2';
            setTimeout(() => {
              descEl.textContent = descriptionsList[index];
              descEl.style.opacity = '1';
            }, 100);
          }

          if (titleEl && titlesList && titlesList[index]) {
            titleEl.textContent = titlesList[index];
          }

          if (subtitleEl && subtitlesList && subtitlesList[index]) {
            subtitleEl.textContent = subtitlesList[index];
          }

          // Update Tab Buttons (if present)
          const isGreenProject = container.querySelector('a[href*="id=5"]') || container.querySelector('.text-emerald-700') || container.querySelector('.bg-emerald-600');
          const activeClass = isGreenProject ? 'active-green' : 'active-neutral';

          tabBtns.forEach((tab, tIdx) => {
            if (tIdx === index) {
              tab.classList.remove('active-green', 'active-neutral');
              tab.classList.add(activeClass);
            } else {
              tab.classList.remove('active-green', 'active-neutral');
            }
          });

          // Update Dots (if present)
          dots.forEach((dot, dIdx) => {
            if (dIdx === index) {
              dot.classList.remove('bg-zinc-300', 'bg-slate-300', 'bg-[#D1CCC2]', 'dark:bg-zinc-700', 'w-2');
              dot.classList.add('bg-[#1A1917]', 'dark:bg-[#F5F3EF]', 'w-6');
            } else {
              dot.classList.remove('bg-blue-500', 'bg-emerald-600', 'bg-indigo-600', 'bg-[#1A1917]', 'dark:bg-[#F5F3EF]', 'w-6');
              dot.classList.add('bg-[#D1CCC2]', 'dark:bg-[#3D3A35]', 'w-2');
            }
          });
        };

        // Continuous auto-cycle every 2.6 seconds
        const startAutoCycle = () => {
          if (autoCycleTimer) clearInterval(autoCycleTimer);
          autoCycleTimer = setInterval(() => {
            const nextIndex = (currentIndex + 1) % imagesList.length;
            updateActiveVisuals(nextIndex);
          }, 2600);
        };

        // Start auto cycle immediately on page load
        startAutoCycle();

        // Manual Tab click switches immediately and refreshes the timer
        tabBtns.forEach((tab, tIdx) => {
          tab.addEventListener('click', (e) => {
            e.preventDefault();
            updateActiveVisuals(tIdx);
            startAutoCycle();
          });
        });

        // Dot click switches immediately and refreshes the timer
        dots.forEach((dot, dIdx) => {
          dot.addEventListener('click', (e) => {
            e.preventDefault();
            updateActiveVisuals(dIdx);
            startAutoCycle();
          });
        });
      } catch (err) {
        console.error('Error initializing switcher', err);
      }
    }
  });

  // --- 3. Ambient Generative Background ---
  initAmbientCanvas();

  // --- 4. Floating Navbar Shrink on Scroll (Optimized with RAF & Passive) ---
  const navbar = document.getElementById('navbar');
  const navContainer = document.getElementById('nav-container');
  
  if (navbar && navContainer) {
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        requestAnimationFrame(() => {
          if (window.scrollY > 20) {
            navbar.classList.remove('py-5');
            navbar.classList.add('py-2.5');
          } else {
            navbar.classList.add('py-5');
            navbar.classList.remove('py-2.5');
          }
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true });
  }

  // --- 5. Smooth Scroll for Internal Anchors ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const offset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // --- 6. Mobile Menu Logic ---
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIcon = document.getElementById('menu-icon');
  const closeIcon = document.getElementById('close-icon');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = !mobileMenu.classList.contains('hidden');
      if (isOpen) {
        mobileMenu.classList.add('hidden');
        if (menuIcon) menuIcon.classList.remove('hidden');
        if (closeIcon) closeIcon.classList.add('hidden');
      } else {
        mobileMenu.classList.remove('hidden');
        if (menuIcon) menuIcon.classList.add('hidden');
        if (closeIcon) closeIcon.classList.remove('hidden');
      }
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        if (menuIcon) menuIcon.classList.remove('hidden');
        if (closeIcon) closeIcon.classList.add('hidden');
      });
    });
  }

  // --- 7. Project Filter Tabs ---
  const filterBtns = document.querySelectorAll('.project-filter-btn');
  const projectItems = document.querySelectorAll('[data-category]');
  if (filterBtns.length > 0 && projectItems.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');

        filterBtns.forEach(b => {
          b.classList.remove('bg-blue-600', 'text-white');
          b.classList.add('text-zinc-600', 'dark:text-zinc-400');
        });
        btn.classList.add('bg-blue-600', 'text-white');
        btn.classList.remove('text-zinc-600', 'dark:text-zinc-400');

        projectItems.forEach(item => {
          const category = item.getAttribute('data-category');
          if (filter === 'all' || category.includes(filter)) {
            item.style.display = '';
            setTimeout(() => item.classList.add('animate-in'), 30);
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  // --- 8. Copy Email with Toast Feedback ---
  const copyEmailBtns = document.querySelectorAll('.copy-email-btn');
  copyEmailBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const email = 'xuanmai032004@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-500"></i> Copied!`;
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => {
          btn.innerHTML = originalText;
          if (window.lucide) window.lucide.createIcons();
        }, 2000);
      });
    });
  });

  // --- 8b. Drag-to-Scroll for Phone Mockup Screens ---
  const phoneScrollContainers = document.querySelectorAll('.phone-screen-scroll');
  phoneScrollContainers.forEach(container => {
    let isDown = false;
    let startY = 0;
    let scrollTop = 0;
    const parent = container.closest('.phone-mockup-frame') || container.parentElement;
    const hint = parent ? parent.querySelector('.phone-scroll-hint') : null;

    const hideHint = () => {
      if (hint && !hint.classList.contains('opacity-0')) {
        hint.classList.add('opacity-0', 'pointer-events-none');
      }
    };

    container.addEventListener('mousedown', (e) => {
      isDown = true;
      container.classList.add('cursor-grabbing');
      container.classList.remove('cursor-grab');
      startY = e.pageY - container.offsetTop;
      scrollTop = container.scrollTop;
    });

    const stopDrag = () => {
      if (!isDown) return;
      isDown = false;
      container.classList.remove('cursor-grabbing');
      container.classList.add('cursor-grab');
    };

    container.addEventListener('mouseleave', stopDrag);
    container.addEventListener('mouseup', stopDrag);

    container.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const y = e.pageY - container.offsetTop;
      const walk = (y - startY) * 1.5;
      container.scrollTop = scrollTop - walk;
      hideHint();
    });

    container.addEventListener('scroll', hideHint, { passive: true });
  });

  // --- 9. Scroll Reveal with IntersectionObserver ---
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -30px 0px'
  });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // --- 10. Dynamic Year ---
  document.querySelectorAll('.current-year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  // --- 10. Ghibli 4-Seasons Morphing Living Canvas Engine ---
  const ghibliCanvas = document.getElementById('ghibli-canvas');
  let ghibliInstance = null;
  if (ghibliCanvas) {
    ghibliInstance = new GhibliSeasonsCanvas('ghibli-canvas');
    initGhibliControls(ghibliInstance);
  }

  // --- 11. Full-screen ThreeUI 3D Background Engine & Interactive Spatial Gallery ---
  const threeBgCanvas = document.getElementById('three-bg-canvas');
  let threeBgInstance = null;
  if (threeBgCanvas) {
    threeBgInstance = new ThreeUIBackground('three-bg-canvas');
    initThreeGalleryModal(threeBgInstance);
  }

  // --- 12. Interactive Micro-Interactions & Physics Suite ---
  initSpotlightCards();
  initMagneticButtons();

  // --- 13. Dedicated In-Page Three.js Spatial Effects Suite ---
  initDedicatedThreeEffects();

  // --- 14. Re-initialize Lucide Icons ---
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// ============================================================================
// -1. Ghibli 4-Seasons Morphing Controller (Fast Scroll Sync, Dynamic Contrast & Nature Audio)
// ============================================================================
function parseHexColor(c) {
  let h = c.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpColorRgb(c1, c2, t) {
  const [r1, g1, b1] = parseHexColor(c1);
  const [r2, g2, b2] = parseHexColor(c2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

const adaptiveTextDay = [
  // 0: Spring (Crisp deep slate on warm linen)
  {
    heading: '#0f172a',
    body: '#334155',
    muted: '#475569',
    accent: '#be185d',
    badgeBg: 'rgba(190, 24, 93, 0.12)',
    badgeBorder: 'rgba(190, 24, 93, 0.28)',
    navText: '#0f172a',
    shadow: 'none',
    subtleShadow: 'none',
    cardBg: 'rgba(255, 255, 255, 0.10)',
    cardBorder: 'rgba(255, 255, 255, 0.25)'
  },
  // 1: Summer (Crisp deep slate with forest emerald accent)
  {
    heading: '#0f172a',
    body: '#334155',
    muted: '#475569',
    accent: '#047857',
    badgeBg: 'rgba(4, 120, 87, 0.12)',
    badgeBorder: 'rgba(4, 120, 87, 0.28)',
    navText: '#0f172a',
    shadow: 'none',
    subtleShadow: 'none',
    cardBg: 'rgba(255, 255, 255, 0.10)',
    cardBorder: 'rgba(255, 255, 255, 0.25)'
  },
  // 2: Autumn (Crisp deep slate with warm terracotta accent)
  {
    heading: '#0f172a',
    body: '#334155',
    muted: '#475569',
    accent: '#c2410c',
    badgeBg: 'rgba(194, 65, 12, 0.12)',
    badgeBorder: 'rgba(194, 65, 12, 0.28)',
    navText: '#0f172a',
    shadow: 'none',
    subtleShadow: 'none',
    cardBg: 'rgba(255, 255, 255, 0.10)',
    cardBorder: 'rgba(255, 255, 255, 0.25)'
  },
  // 3: Winter (Crisp deep slate with deep alpine azure accent)
  {
    heading: '#0f172a',
    body: '#334155',
    muted: '#475569',
    accent: '#0369a1',
    badgeBg: 'rgba(3, 105, 161, 0.12)',
    badgeBorder: 'rgba(3, 105, 161, 0.28)',
    navText: '#0f172a',
    shadow: 'none',
    subtleShadow: 'none',
    cardBg: 'rgba(255, 255, 255, 0.10)',
    cardBorder: 'rgba(255, 255, 255, 0.25)'
  }
];

const adaptiveTextNight = [
  // 0: Spring Night (Pure light slate on obsidian with sakura glow)
  {
    heading: '#f8fafc',
    body: '#cbd5e1',
    muted: '#94a3b8',
    accent: '#f472b6',
    badgeBg: 'rgba(244, 114, 182, 0.18)',
    badgeBorder: 'rgba(244, 114, 182, 0.35)',
    navText: '#f8fafc',
    shadow: '0 2px 12px rgba(0, 0, 0, 0.85)',
    subtleShadow: '0 1px 6px rgba(0, 0, 0, 0.65)',
    cardBg: 'rgba(18, 17, 16, 0.15)',
    cardBorder: 'rgba(255, 255, 255, 0.08)'
  },
  // 1: Summer Night (Pure light slate on obsidian with cyan glow)
  {
    heading: '#f8fafc',
    body: '#cbd5e1',
    muted: '#94a3b8',
    accent: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.18)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    navText: '#f8fafc',
    shadow: '0 2px 12px rgba(0, 0, 0, 0.85)',
    subtleShadow: '0 1px 6px rgba(0, 0, 0, 0.65)',
    cardBg: 'rgba(18, 17, 16, 0.15)',
    cardBorder: 'rgba(255, 255, 255, 0.08)'
  },
  // 2: Autumn Night (Pure light slate on obsidian with amber glow)
  {
    heading: '#f8fafc',
    body: '#cbd5e1',
    muted: '#94a3b8',
    accent: '#fb923c',
    badgeBg: 'rgba(251, 146, 60, 0.18)',
    badgeBorder: 'rgba(251, 146, 60, 0.35)',
    navText: '#f8fafc',
    shadow: '0 2px 12px rgba(0, 0, 0, 0.85)',
    subtleShadow: '0 1px 6px rgba(0, 0, 0, 0.65)',
    cardBg: 'rgba(18, 17, 16, 0.15)',
    cardBorder: 'rgba(255, 255, 255, 0.08)'
  },
  // 3: Winter Night (Pure light slate on obsidian with ice cyan glow)
  {
    heading: '#f8fafc',
    body: '#cbd5e1',
    muted: '#94a3b8',
    accent: '#67e8f9',
    badgeBg: 'rgba(103, 232, 249, 0.18)',
    badgeBorder: 'rgba(103, 232, 249, 0.35)',
    navText: '#f8fafc',
    shadow: '0 2px 12px rgba(0, 0, 0, 0.85)',
    subtleShadow: '0 1px 6px rgba(0, 0, 0, 0.65)',
    cardBg: 'rgba(18, 17, 16, 0.15)',
    cardBorder: 'rgba(255, 255, 255, 0.08)'
  }
];

function applyAdaptiveTextColors(progress) {
  const isDark = document.documentElement.classList.contains('dark');
  const palette = isDark ? adaptiveTextNight : adaptiveTextDay;

  const p = Math.max(0, Math.min(3, progress));
  const idx1 = Math.floor(p);
  const idx2 = Math.min(3, idx1 + 1);
  const t = p - idx1;

  const p1 = palette[idx1];
  const p2 = palette[idx2];

  const root = document.documentElement;

  // Real-time smooth continuous interpolation of text colors
  const heading = lerpColorRgb(p1.heading, p2.heading, t);
  const body = lerpColorRgb(p1.body, p2.body, t);
  const muted = lerpColorRgb(p1.muted, p2.muted, t);
  const accent = lerpColorRgb(p1.accent, p2.accent, t);
  const navText = lerpColorRgb(p1.navText, p2.navText, t);

  root.style.setProperty('--season-heading', heading);
  root.style.setProperty('--season-body', body);
  root.style.setProperty('--season-muted', muted);
  root.style.setProperty('--season-accent', accent);
  root.style.setProperty('--season-nav-text', navText);
  root.style.setProperty('--season-badge-bg', p1.badgeBg);
  root.style.setProperty('--season-badge-border', p1.badgeBorder);
  root.style.setProperty('--season-text-shadow', p1.shadow);
  root.style.setProperty('--season-subtle-shadow', p1.subtleShadow);
  root.style.setProperty('--season-card-bg', p1.cardBg);
  root.style.setProperty('--season-card-border', p1.cardBorder);
}

function initGhibliControls(ghibliInstance) {
  if (!ghibliInstance) return;

  const heroSection = document.getElementById('hero-section');
  const workSection = document.getElementById('work');
  const aboutSection = document.getElementById('about');
  const contactSection = document.getElementById('contact');

  const seasonNames = ['spring', 'summer', 'autumn', 'winter'];
  let currentActiveIndex = 0;
  let currentProgress = 0;

  function updateActiveSeasonUI(seasonIdx) {
    const sId = seasonNames[seasonIdx];
    if (!sId) return;

    // Update body & html data-season attribute for CSS color token morphing
    document.body.setAttribute('data-season', sId);
    document.documentElement.setAttribute('data-season', sId);
    currentActiveIndex = seasonIdx;
  }

  // Set initial season attribute (supports default season from data-season, e.g. Summer for project.html)
  const explicitSeason = document.body.getAttribute('data-season') || document.documentElement.getAttribute('data-season');
  const defaultIdx = explicitSeason && seasonNames.indexOf(explicitSeason) >= 0 ? seasonNames.indexOf(explicitSeason) : (heroSection ? 0 : 1);
  updateActiveSeasonUI(defaultIdx);
  ghibliInstance.setSeasonProgress(defaultIdx);
  currentProgress = defaultIdx;
  applyAdaptiveTextColors(defaultIdx);

  // Re-apply on dark/light mode toggle
  window.addEventListener('themeChanged', () => {
    applyAdaptiveTextColors(currentProgress);
  });

  if (!heroSection || !workSection || !aboutSection || !contactSection) {
    // Project detail page: divide the entire page scroll into 4 seasonal sections (Spring -> Summer -> Autumn -> Winter)
    let isProjectTicking = false;
    function calculateProjectScrollProgress() {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
      );
      const winHeight = window.innerHeight || document.documentElement.clientHeight;
      const maxScroll = Math.max(1, docHeight - winHeight);
      const ratio = Math.max(0, Math.min(1, scrollY / maxScroll));
      const progress = ratio * 3.0; // 0: Spring -> 1: Summer -> 2: Autumn -> 3: Winter

      currentProgress = progress;
      ghibliInstance.setSeasonProgress(progress);
      applyAdaptiveTextColors(progress);

      const activeIdx = Math.min(3, Math.max(0, Math.round(progress)));
      if (activeIdx !== currentActiveIndex) {
        updateActiveSeasonUI(activeIdx);
      }
    }

    function handleProjectScroll() {
      if (!isProjectTicking) {
        requestAnimationFrame(() => {
          calculateProjectScrollProgress();
          isProjectTicking = false;
        });
        isProjectTicking = true;
      }
    }

    window.addEventListener('scroll', handleProjectScroll, { passive: true });
    window.addEventListener('resize', handleProjectScroll, { passive: true });
    
    // Initial sync & periodic check after dynamic images render
    calculateProjectScrollProgress();
    setTimeout(calculateProjectScrollProgress, 120);
    setTimeout(calculateProjectScrollProgress, 400);
    setTimeout(calculateProjectScrollProgress, 1200);
    return;
  }

  // Fast, buttery-smooth scroll progress calculation
  let isTicking = false;
  function handleScroll() {
    if (!isTicking) {
      requestAnimationFrame(() => {
        calculateScrollProgress();
        isTicking = false;
      });
      isTicking = true;
    }
  }

  function calculateScrollProgress() {
    if (!heroSection || !workSection || !aboutSection || !contactSection) return;

    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const vh = window.innerHeight;
    const triggerOffset = vh * 0.35;

    const p0 = heroSection.offsetTop;
    const p1 = workSection.offsetTop;
    const p2 = aboutSection.offsetTop;
    const p3 = contactSection.offsetTop;

    let progress = 0;
    if (scrollY < p1 - triggerOffset) {
      // 0 to 1 (Spring to Summer)
      const range = Math.max(1, (p1 - triggerOffset) - p0);
      progress = Math.max(0, Math.min(1, (scrollY - p0) / range));
    } else if (scrollY < p2 - triggerOffset) {
      // 1 to 2 (Summer to Autumn)
      const range = Math.max(1, (p2 - triggerOffset) - (p1 - triggerOffset));
      progress = 1.0 + Math.max(0, Math.min(1, (scrollY - (p1 - triggerOffset)) / range));
    } else {
      // 2 to 3 (Autumn to Winter)
      const range = Math.max(1, (p3 - triggerOffset) - (p2 - triggerOffset));
      progress = 2.0 + Math.max(0, Math.min(1, (scrollY - (p2 - triggerOffset)) / range));
    }

    currentProgress = progress;
    ghibliInstance.setSeasonProgress(progress);
    applyAdaptiveTextColors(progress);

    const activeIdx = Math.min(3, Math.max(0, Math.round(progress)));
    if (activeIdx !== currentActiveIndex) {
      updateActiveSeasonUI(activeIdx);
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  calculateScrollProgress();

  // Audio Toggle
  const audioBtn = document.getElementById('ghibli-audio-toggle');
  const audioIcon = document.getElementById('audio-icon');

  if (audioBtn) {
    audioBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isMuted = ghibliInstance.toggleAudio();
      if (audioIcon) {
        audioIcon.setAttribute('data-lucide', isMuted ? 'volume-x' : 'volume-2');
        audioIcon.className = isMuted ? 'w-4 h-4 text-zinc-400' : 'w-4 h-4 text-emerald-500 animate-pulse';
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }

  // Animal Interactive Click Toast Feedback
  let toastTimer = null;
  window.addEventListener('ghibliAnimalClick', (e) => {
    const animal = e.detail.animal;
    let toast = document.getElementById('ghibli-animal-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ghibli-animal-toast';
      toast.className = 'fixed bottom-16 left-6 z-50 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-mono shadow-xl transition-all duration-300 opacity-0 pointer-events-none flex items-center gap-2';
      document.body.appendChild(toast);
    }

    if (animal === 'deer') {
      toast.innerHTML = `<span class="text-amber-400 text-sm">🦌</span><span>The sacred deer perks its ears and greets you!</span>`;
    } else if (animal === 'owl') {
      toast.innerHTML = `<span class="text-amber-300 text-sm">🦉</span><span>The guardian owl hoots gently and blinks its luminous eyes!</span>`;
    } else {
      toast.innerHTML = `<span class="text-pink-400 text-sm">🐇</span><span>The woodland bunny happily hops in the clover!</span>`;
    }

    toast.classList.remove('opacity-0', 'translate-y-2');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
    }, 2400);
  });
}

// ============================================================================
// 0. Dedicated In-Page Three.js Spatial Effects Suite
// (Bespoke 3D Artefacts embedded directly into UI components)
// ============================================================================
function initDedicatedThreeEffects() {
  // 1. Hero Profile Card: 3D Kinetic Torus Knot vs Portrait Photo Toggle
  const tabPhoto = document.getElementById('tab-profile-photo');
  const tab3D = document.getElementById('tab-profile-3d');
  const photoLayer = document.getElementById('profile-photo-layer');
  const layer3D = document.getElementById('profile-3d-layer');
  const heroContainer = document.getElementById('hero-three-container');

  let heroArtefactInstance = null;

  if (tabPhoto && tab3D && photoLayer && layer3D && heroContainer) {
    const switchView = (mode) => {
      if (mode === '3d') {
        // Activate 3D Artefact
        photoLayer.classList.add('hidden', 'opacity-0');
        layer3D.classList.remove('hidden');
        requestAnimationFrame(() => {
          layer3D.classList.remove('opacity-0');
        });

        // Update tab styles
        tab3D.className = 'profile-view-tab flex-1 py-1.5 px-3 rounded-xl font-bold transition-all bg-white dark:bg-[#262421] text-[#1A1917] dark:text-[#F5F3EF] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer';
        tabPhoto.className = 'profile-view-tab flex-1 py-1.5 px-3 rounded-xl font-bold transition-all text-[#78716C] dark:text-[#A8A29E] hover:text-[#1A1917] dark:hover:text-[#F5F3EF] flex items-center justify-center gap-1.5 cursor-pointer';

        if (!heroArtefactInstance) {
          heroArtefactInstance = new ThreeUIHeroArtefact('hero-three-container');
        } else {
          heroArtefactInstance.resume();
        }
      } else {
        // Activate Photo
        layer3D.classList.add('opacity-0');
        setTimeout(() => {
          layer3D.classList.add('hidden');
        }, 150);
        photoLayer.classList.remove('hidden', 'opacity-0');

        // Update tab styles
        tabPhoto.className = 'profile-view-tab flex-1 py-1.5 px-3 rounded-xl font-bold transition-all bg-white dark:bg-[#262421] text-[#1A1917] dark:text-[#F5F3EF] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer';
        tab3D.className = 'profile-view-tab flex-1 py-1.5 px-3 rounded-xl font-bold transition-all text-[#78716C] dark:text-[#A8A29E] hover:text-[#1A1917] dark:hover:text-[#F5F3EF] flex items-center justify-center gap-1.5 cursor-pointer';

        if (heroArtefactInstance) {
          heroArtefactInstance.pause();
        }
      }
    };

    tabPhoto.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('photo');
    });

    tab3D.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('3d');
    });

    const quickTryBtn = document.getElementById('quick-try-3d-btn');
    if (quickTryBtn) {
      quickTryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        switchView('3d');
      });
    }
  }

  // 2. Bento Grid: 3D Crystal Lab in "Interactive UI" Card
  const bentoCanvas = document.getElementById('bento-three-canvas');
  if (bentoCanvas) {
    new ThreeUISpatialBento('bento-three-canvas');
  }

  // 3. Contact Section: 3D Interactive Spatial Beacon
  const contactCanvas = document.getElementById('contact-three-canvas');
  if (contactCanvas) {
    new ThreeUIContactBeacon('contact-three-canvas');
  }
}

// ============================================================================
// 1. Ambient Spotlight & Luminous Floating Stardust Background Engine
// (The industry-standard effect used by Linear, Vercel, Stripe & Apple)
// ============================================================================
function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, dpr = 1;
  let time = 0;
  let lastT = performance.now();

  let targetMouseX = -1000;
  let targetMouseY = -1000;
  let currentMouseX = -1000;
  let currentMouseY = -1000;

  // Theme tracking
  let isDark = document.documentElement.classList.contains('dark');
  let darkFactor = isDark ? 1 : 0;
  let darkTarget = darkFactor;

  window.addEventListener('themeChanged', (e) => {
    isDark = e.detail.isDark;
    darkTarget = isDark ? 1 : 0;
  });

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('mousemove', (e) => {
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    targetMouseX = -1000;
    targetMouseY = -1000;
  });

  // Stardust Particles
  const PARTICLE_COUNT = 65;
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random(),
      y: Math.random(),
      radius: 0.8 + Math.random() * 1.8,
      speedY: -0.0001 - Math.random() * 0.00025,
      driftX: (Math.random() - 0.5) * 0.00015,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.6 + Math.random() * 0.8,
      baseAlpha: 0.15 + Math.random() * 0.35,
    });
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function lerp3(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  function col(l, d) {
    return lerp3(l, d, darkFactor);
  }
  function rgba(c, a) {
    return `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${Math.max(0, Math.min(1, a))})`;
  }

  // Palettes (Warm Gallery Paper & Warm Espresso Obsidian)
  const L_BG = [251, 249, 245]; // Warm Gallery Linen #FBF9F5
  const D_BG = [21, 20, 19];    // Warm Espresso Obsidian #151413

  let animId = null;

  function render(now) {
    const dt = Math.min((now - lastT) / 1000, 0.1);
    lastT = now;
    time += dt;

    darkFactor += (darkTarget - darkFactor) * 0.08;

    // Clean Organic Warm Background Fill
    const bg = col(L_BG, D_BG);
    ctx.fillStyle = rgba(bg, 1);
    ctx.fillRect(0, 0, W, H);

    // Subtle gentle warmth gradient at the top (Natural studio lighting)
    const topGlow = ctx.createLinearGradient(0, 0, 0, H * 0.6);
    const topC = col([255, 255, 255], [28, 26, 24]);
    const topAlpha = lerp(0.35, 0.25, darkFactor);
    topGlow.addColorStop(0, rgba(topC, topAlpha));
    topGlow.addColorStop(1, rgba(topC, 0));
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, W, H * 0.6);

    animId = requestAnimationFrame(render);
  }

  animId = requestAnimationFrame(render);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      lastT = performance.now();
      animId = requestAnimationFrame(render);
    }
  });
}

// ============================================================================
// 2. Linear / Aceternity Style Spotlight Card Tracking (Ultra-Smooth 120Hz)
// ============================================================================
function initSpotlightCards() {
  const cards = document.querySelectorAll('.spotlight-card');
  cards.forEach(card => {
    let ticking = false;

    card.addEventListener('mousemove', (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          card.style.setProperty('--mouse-x', `${x}px`);
          card.style.setProperty('--mouse-y', `${y}px`);
          ticking = false;
        });
        ticking = true;
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.removeProperty('--mouse-x');
      card.style.removeProperty('--mouse-y');
    });
  });
}


// ============================================================================
// 3. Tactile Magnetic Physics on Interactive Action Buttons
// ============================================================================
function initMagneticButtons() {
  const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');

  buttons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      btn.style.transform = `translate(${x * 0.22}px, ${y * 0.22}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// ============================================================================
// 4. ThreeUI 3D Spatial Gallery Modal (Ultra-Performance Singleton Modal)
// ============================================================================
function initThreeGalleryModal(threeBgInstance) {
  if (!threeBgInstance) return;

  const miniPreviewEngine = new MiniThreePreviewEngine();
  const scenes = threeBgInstance.scenesList;
  let previewInitTimer = null;

  // Create Modal Element if not already in DOM
  let modal = document.getElementById('three-gallery-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'three-gallery-modal';
    modal.className = 'fixed inset-0 z-50 bg-black/75 backdrop-blur-sm hidden flex items-center justify-center p-3.5 sm:p-6 transition-opacity duration-200 opacity-0 pointer-events-none will-change-[opacity]';
    document.body.appendChild(modal);
  }

  // Pre-render Modal DOM ONCE on startup (Zero reconstruction lag on click)
  modal.innerHTML = `
    <div class="relative bg-[#FBF9F5] dark:bg-[#1A1917] border border-[#DDD8CE] dark:border-white/10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-[#1A1917] dark:text-[#F5F3EF] transform-gpu will-change-transform">
      
      <!-- Modal Header -->
      <div class="p-5 sm:p-6 border-b border-[#E8E5DF] dark:border-white/10 flex items-center justify-between bg-[#F5F2EB]/50 dark:bg-white/[0.02]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-[#C2410C]/10 dark:bg-sky-500/10 text-[#C2410C] dark:text-[#38BDF8] flex items-center justify-center font-bold shadow-xs">
            <i data-lucide="sparkles" class="w-5 h-5 animate-pulse"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-display font-bold text-base sm:text-lg text-[#1A1917] dark:text-[#F5F3EF]">
                ThreeUI Spatial Gallery
              </h3>
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/20">
                12 Live Previews
              </span>
            </div>
            <p class="text-xs text-[#78716C] dark:text-[#A8A29E] font-normal">
              Select any scene to apply live 3D background immediately
            </p>
          </div>
        </div>

        <button type="button" id="close-three-modal" class="w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-[#78716C] dark:text-[#A8A29E] hover:text-[#1A1917] dark:hover:text-white transition-all cursor-pointer" aria-label="Close">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Grid Layout of 12 Miniature 3D Tiles -->
      <div class="three-gallery-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5 p-4 sm:p-5 overflow-y-auto max-h-[calc(92vh-140px)]">
        ${scenes.map((scene, idx) => {
          const isActive = idx === threeBgInstance.currentSceneIndex;
          const screenNum = String(idx + 1).padStart(2, '0');
          return `
            <div data-scene-idx="${idx}" class="three-tile-card group relative p-3 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[195px] select-none ${
              isActive 
                ? 'bg-white dark:bg-[#262421] border-[#C2410C] dark:border-sky-400 ring-2 ring-[#C2410C]/25 dark:ring-sky-400/25 shadow-md scale-[1.01]' 
                : 'bg-[#F2EFE9]/60 dark:bg-white/[0.03] border-[#DDD8CE] dark:border-white/10 hover:border-[#C2410C]/40 dark:hover:border-sky-400/40 hover:bg-white dark:hover:bg-white/5'
            }">
              
              <!-- Card Top: Number & Category Badge -->
              <div class="flex items-center justify-between w-full mb-1">
                <span class="text-[10px] font-mono font-bold uppercase tracking-wider ${isActive ? 'text-[#C2410C] dark:text-sky-400' : 'text-[#78716C] dark:text-[#A8A29E]'}">
                  ${screenNum}
                </span>
                <div class="status-badge-container">
                  ${isActive ? `
                    <span class="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-bold flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active
                    </span>
                  ` : `
                    <span class="text-[10px] font-mono text-[#A8A29E] dark:text-[#78716C]">
                      ${scene.category}
                    </span>
                  `}
                </div>
              </div>

              <!-- Miniature 3D Canvas Preview Window -->
              <div class="w-full aspect-[16/10] rounded-xl overflow-hidden bg-black/60 dark:bg-black/90 relative my-1.5 border border-black/10 dark:border-white/10 group-hover:border-[#C2410C]/30 dark:group-hover:border-sky-400/30 transition-all flex items-center justify-center shrink-0">
                <canvas class="mini-preview-canvas w-full h-full pointer-events-none" data-preview-idx="${idx}"></canvas>
                <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
                <div class="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[8px] font-mono text-zinc-300 pointer-events-none flex items-center gap-1 border border-white/10">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  LIVE 3D
                </div>
              </div>

              <!-- Card Bottom: Name & Description -->
              <div class="w-full text-center mt-1">
                <h4 class="font-display font-bold text-xs leading-snug text-[#1A1917] dark:text-[#F5F3EF] truncate">
                  ${scene.name}
                </h4>
                <p class="text-[9.5px] text-[#78716C] dark:text-[#A8A29E] leading-tight mt-0.5 line-clamp-1 font-normal">
                  ${scene.desc}
                </p>
              </div>

            </div>
          `;
        }).join('')}
      </div>

      <!-- Modal Footer -->
      <div class="p-4 sm:p-4.5 border-t border-[#E8E5DF] dark:border-white/10 bg-[#F5F2EB]/50 dark:bg-white/[0.02] flex items-center justify-between">
        <div class="text-[11px] font-mono text-[#78716C] dark:text-[#A8A29E] flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          Click any card to switch canvas environment
        </div>
        <button type="button" id="confirm-three-modal" class="btn-primary text-xs py-2 px-4.5">
          Apply & Close
        </button>
      </div>

    </div>
  `;

  // Scope Lucide icon creation strictly to the modal container (takes ~0.5ms instead of full DOM scan)
  if (window.lucide) {
    window.lucide.createIcons({ root: modal });
  }

  // Fast Active State Synchronizer (Zero DOM creation, pure class toggles)
  const updateActiveCard = (targetIdx) => {
    const cards = modal.querySelectorAll('.three-tile-card');
    cards.forEach((card, idx) => {
      const isAct = idx === targetIdx;
      const badge = card.querySelector('.status-badge-container');
      const numSpan = card.querySelector('span.font-mono');

      if (isAct) {
        card.classList.add('bg-white', 'dark:bg-[#262421]', 'border-[#C2410C]', 'dark:border-sky-400', 'ring-2', 'ring-[#C2410C]/25', 'dark:ring-sky-400/25', 'shadow-md', 'scale-[1.01]');
        card.classList.remove('bg-[#F2EFE9]/60', 'dark:bg-white/[0.03]', 'border-[#DDD8CE]', 'dark:border-white/10');
        if (numSpan) {
          numSpan.className = 'text-[10px] font-mono font-bold uppercase tracking-wider text-[#C2410C] dark:text-sky-400';
        }
        if (badge) {
          badge.innerHTML = `<span class="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-bold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Active</span>`;
        }
      } else {
        card.classList.remove('bg-white', 'dark:bg-[#262421]', 'border-[#C2410C]', 'dark:border-sky-400', 'ring-2', 'ring-[#C2410C]/25', 'dark:ring-sky-400/25', 'shadow-md', 'scale-[1.01]');
        card.classList.add('bg-[#F2EFE9]/60', 'dark:bg-white/[0.03]', 'border-[#DDD8CE]', 'dark:border-white/10');
        if (numSpan) {
          numSpan.className = 'text-[10px] font-mono font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E]';
        }
        if (badge) {
          badge.innerHTML = `<span class="text-[10px] font-mono text-[#A8A29E] dark:text-[#78716C]">${scenes[idx].category}</span>`;
        }
      }
    });
  };

  // High-performance Event Delegation for Card Clicks (Single event listener)
  const gridContainer = modal.querySelector('.three-gallery-grid');
  if (gridContainer) {
    gridContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.three-tile-card');
      if (!card) return;
      const idx = parseInt(card.getAttribute('data-scene-idx'), 10);
      threeBgInstance.selectScene(idx);
      updateActiveCard(idx);
    });
  }

  // Smooth Opening without Jank
  const openModal = () => {
    // 1. Pause background Three.js scene to free 100% GPU/CPU for modal
    threeBgInstance.pause();

    // 2. Instantly update active card state (< 0.2ms)
    updateActiveCard(threeBgInstance.currentSceneIndex);

    // 3. Make modal visible and animate opacity with GPU acceleration
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
      modal.classList.remove('opacity-0', 'pointer-events-none');
    });

    // 4. Stagger: start mini previews AFTER entrance fade-in transition settles (200ms)
    clearTimeout(previewInitTimer);
    previewInitTimer = setTimeout(() => {
      if (!modal.classList.contains('hidden')) {
        miniPreviewEngine.init(modal);
      }
    }, 200);
  };

  // Clean Closing
  const closeModal = () => {
    clearTimeout(previewInitTimer);
    miniPreviewEngine.stop(); // Stop canvas animation loop immediately

    modal.classList.add('opacity-0', 'pointer-events-none');

    // Resume full-screen 3D background
    threeBgInstance.resume();

    setTimeout(() => {
      modal.classList.add('hidden');
    }, 200);
  };

  // Close buttons
  const closeBtn = modal.querySelector('#close-three-modal');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  const confirmBtn = modal.querySelector('#confirm-three-modal');
  if (confirmBtn) confirmBtn.addEventListener('click', closeModal);

  // Close when clicking backdrop
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on ESC key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  // Attach openModal to all scene toggle buttons
  const toggleBtns = document.querySelectorAll('.three-scene-toggle-btn');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });
}
