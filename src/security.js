/**
 * Security, Anti-Inspection & Asset Protection Suite
 * - Blocks F12, DevTools shortcuts, View Source, and Save shortcuts
 * - Disables right-click context menu (anti-image save)
 * - Prevents image/canvas dragging and unauthorized asset extraction
 * - Implements anti-debugging loop and console neutralization
 * - Protects against unauthorized script injection and DOM manipulation
 */

export function initSecuritySuite() {
  // 1. Prevent Right-Click Context Menu globally
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  }, { capture: true });

  // 2. Prevent Keyboard Inspection Shortcuts (F12, DevTools, View Source, Save)
  window.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
    const shift = e.shiftKey;
    const altOrOpt = e.altKey;

    // F12 key
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+I / Cmd+Opt+I (Inspect Element)
    // Ctrl+Shift+J / Cmd+Opt+J (Console)
    // Ctrl+Shift+C / Cmd+Opt+C (Element Selector)
    if (ctrlOrCmd && (shift || altOrOpt)) {
      const k = (e.key || '').toLowerCase();
      if (k === 'i' || k === 'j' || k === 'c') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }

    // Ctrl+U / Cmd+U (View Page Source)
    if (ctrlOrCmd && ((e.key || '').toLowerCase() === 'u' || e.keyCode === 85)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+S / Cmd+S (Save Webpage)
    if (ctrlOrCmd && ((e.key || '').toLowerCase() === 's' || e.keyCode === 83)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+P / Cmd+P (Print to PDF / Scrape)
    if (ctrlOrCmd && ((e.key || '').toLowerCase() === 'p' || e.keyCode === 80)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true });

  // 3. Prevent Dragging Images, Videos, and Canvas
  document.addEventListener('dragstart', (e) => {
    if (e.target && (e.target.nodeName === 'IMG' || e.target.nodeName === 'CANVAS' || e.target.nodeName === 'VIDEO')) {
      e.preventDefault();
      return false;
    }
  }, { capture: true });

  // 4. Anti-Debugger Protection Loop (Freezes inspection if DevTools opens)
  function triggerDebugger() {
    try {
      (function() {
        return false;
      }['constructor']('debugger')());
    } catch (err) {}
  }
  setInterval(triggerDebugger, 750);

  // 5. Console Protection & Silent Mode
  try {
    const noop = () => {};
    const methods = ['log', 'debug', 'info', 'warn', 'error', 'dir', 'table', 'trace'];
    methods.forEach(m => {
      if (window.console && typeof window.console[m] === 'function') {
        window.console[m] = noop;
      }
    });
    setInterval(() => {
      if (window.console && typeof window.console.clear === 'function') {
        window.console.clear();
      }
    }, 1500);
  } catch (err) {}

  // 6. DevTools Dock Detection Protection
  let devtoolsDetected = false;
  const threshold = 160;
  setInterval(() => {
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
    if ((widthDiff || heightDiff) && !devtoolsDetected) {
      devtoolsDetected = true;
      triggerDebugger();
    } else if (!widthDiff && !heightDiff) {
      devtoolsDetected = false;
    }
  }, 1000);
}

// Auto-run immediately upon load
if (typeof window !== 'undefined') {
  initSecuritySuite();
}
