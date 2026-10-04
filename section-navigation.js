/* Clean section URLs without reloading the single-page portfolio. */
(() => {
  'use strict';
  const routes = new Map([
    ['/', 'home'], ['/work', 'work'], ['/about', 'about'],
    ['/approach', 'services'], ['/contact', 'contact'],
  ]);
  const paths = new Map([...routes].map(([path, section]) => [section, path]));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  history.scrollRestoration = 'manual';

  function currentSection() {
    const hash = location.hash.slice(1);
    if (paths.has(hash)) return hash; // Preserve links shared before clean URLs.
    return routes.get(location.pathname.replace(/\/$/, '') || '/');
  }

  function showSection(section, smooth, focus) {
    const target = document.getElementById(section);
    if (!target) return;
    target.scrollIntoView({ behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant', block: 'start' });
    if (focus) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    document.querySelectorAll('#navigation a').forEach(link => {
      if (new URL(link.href).pathname === paths.get(section)) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  function restoreSection(focus = false) {
    if (location.hash && !paths.has(location.hash.slice(1))) return;
    const section = currentSection();
    if (!section) return;
    if (paths.has(location.hash.slice(1))) {
      history.replaceState(null, '', paths.get(section) + location.search);
    }
    showSection(section, false, focus);
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.search !== location.search) return;
    const section = paths.get(url.hash.slice(1)) ? url.hash.slice(1) :
      (!url.hash ? routes.get(url.pathname.replace(/\/$/, '') || '/') : undefined);
    if (!section) return; // Leave skip links, downloads, and external links native.
    event.preventDefault();
    const path = paths.get(section) + location.search;
    if (location.pathname + location.search + location.hash !== path) history.pushState(null, '', path);
    showSection(section, true, true);
  });

  window.addEventListener('popstate', () => restoreSection(true));
  window.addEventListener('hashchange', () => restoreSection());
  // Fonts and images can affect section positions. Restore after the document
  // finishes loading, and when a browser brings it back from its page cache.
  window.addEventListener('pageshow', () => {
    if (!location.hash || paths.has(location.hash.slice(1))) restoreSection();
  });
  restoreSection();
})();
