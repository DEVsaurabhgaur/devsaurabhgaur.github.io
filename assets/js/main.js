/* main.js
   Lightbox, filters, parallax, lazy-loading, donation modal, keyboard nav
   Small, dependency-free, accessible.
*/

(function () {
  // Helpers
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const isHidden = el => !el || el.getAttribute('aria-hidden') === 'true';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initFilters();
    initLightbox();
    initParallax();
    initLazyLoad();
    initDonationModal();
    smallUXTweaks();
  }

  /* -------------------------
     Filters
  ------------------------- */
  function initFilters() {
    const filters = $$('.filter');
    const cards = $$('.card-art');
    filters.forEach(btn => {
      btn.addEventListener('click', () => {
        filters.forEach(f => f.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.getAttribute('data-filter');
        cards.forEach(card => {
          if (type === '*' || card.dataset.category === type) {
            card.style.display = '';
            // animate
            requestAnimationFrame(() => card.style.transform = 'translateY(0) scale(1)');
            card.style.opacity = '1';
          } else {
            // hide with subtle animation
            card.style.transform = 'translateY(8px) scale(.98)';
            card.style.opacity = '0';
            setTimeout(() => card.style.display = 'none', 240);
          }
        });
      });
    });
  }

  /* -------------------------
     Lightbox
  ------------------------- */
  function initLightbox() {
    const mediaButtons = $$('.media');
    const lightbox = $('#lightbox');
    const lbImg = $('.lightbox-img', lightbox);
    const lbCaption = $('.lightbox-caption', lightbox);
    const lbClose = $('.lightbox-close', lightbox);
    const prevBtn = $('#prevBtn');
    const nextBtn = $('#nextBtn');
    const downloadBtn = $('#downloadBtn');

    // Build list from all media buttons (gallery + wallpapers)
    const items = mediaButtons.map(btn => ({
      src: btn.dataset.src,
      title: btn.dataset.title || '',
      el: btn
    }));

    let current = -1;

    function openAt(index) {
      if (!items[index]) return;
      current = index;
      const it = items[index];
      lbImg.src = it.src;
      lbImg.alt = it.title || 'Artwork by SAURABH GAUR';
      lbCaption.textContent = it.title || '';
      downloadBtn.href = it.src;
      lightbox.setAttribute('aria-hidden', 'false');
      lightbox.focus();
      document.body.style.overflow = 'hidden';
      // preload neighbors
      preloadIndex(index + 1);
      preloadIndex(index - 1);
    }

    function close() {
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lbImg.src = '';
      current = -1;
    }

    function next() {
      if (current < items.length - 1) openAt(current + 1);
    }

    function prev() {
      if (current > 0) openAt(current - 1);
    }

    function preloadIndex(i) {
      if (!items[i]) return;
      const img = new Image();
      img.src = items[i].src;
    }

    // attach to each media button to open correct index
    mediaButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = items.findIndex(it => it.el === btn);
        openAt(idx);
      });
      // keyboard accessibility
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });

    // lightbox controls
    lbClose.addEventListener('click', close);
    nextBtn && nextBtn.addEventListener('click', next);
    prevBtn && prevBtn.addEventListener('click', prev);

    // keyboard nav inside lightbox (left/right/escape)
    document.addEventListener('keydown', (e) => {
      if (isHidden(lightbox)) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') close();
    });

    // click outside image to close
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) close();
    });

    // touch/swipe support (basic)
    let touchStartX = 0;
    lbImg.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, {passive:true});
    lbImg.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (dx > 60) prev();
      if (dx < -60) next();
    }, {passive:true});
  }

  /* -------------------------
     Parallax (background layers)
     uses data-parallax-speed on elements
  ------------------------- */
  function initParallax() {
    const bgLayers = $$('.bg-layer');
    // throttle scroll
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY;
          bgLayers.forEach(layer => {
            const speed = parseFloat(layer.dataset.parallaxSpeed) || 0.2;
            // translateY slightly for parallax feel
            layer.style.transform = `translate3d(0, ${-(scrolled * speed)}px, 0) scale(1.02)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    }, {passive:true});
  }

  /* -------------------------
     Lazy load enhancements
  ------------------------- */
  function initLazyLoad() {
    const imgs = $$('img[loading="lazy"]');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            // if image has data-src (progressive pattern), swap; else it already has src
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            img.classList.add('revealed');
            obs.unobserve(img);
          }
        });
      }, {rootMargin: '200px 0px', threshold: 0.01});
      imgs.forEach(i => io.observe(i));
    } else {
      // fallback: mark all as revealed
      imgs.forEach(i => i.classList.add('revealed'));
    }
  }

  /* -------------------------
     Donation modal (UPI)
  ------------------------- */
  function initDonationModal() {
    const donateBtn = $('#donateBtn');
    const openDonate = $('#openDonate');
    const donationModal = $('#donationModal');
    const modalClose = donationModal && donationModal.querySelector('.modal-close');
    const upiLink = $('#modalUpiLink');
    // open
    [donateBtn, openDonate].forEach(el => {
      if (!el) return;
      el.addEventListener('click', () => {
        donationModal.setAttribute('aria-hidden', 'false');
        // focus management
        const close = donationModal.querySelector('.modal-close');
        if (close) close.focus();
        document.body.style.overflow = 'hidden';
      });
    });
    // close
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        donationModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    }
    // click outside to close
    donationModal && donationModal.addEventListener('click', (e) => {
      if (e.target === donationModal) {
        donationModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });

    // fallback: ensure UPI link has proper URI (replace placeholder if needed)
    if (upiLink && upiLink.href.indexOf('upi://') === -1) {
      // keep it functional but non-breaking
      upiLink.href = upiLink.href || '#';
    }

    // keyboard: Escape handled by global listener in index.html's inline script
  }

  /* -------------------------
     Small UX touches & accessibility
  ------------------------- */
  function smallUXTweaks() {
    // Make image cards slightly lift on hover
    $$('.card-art').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-6px) scale(1.01)';
        card.style.boxShadow = '0 20px 60px rgba(0,0,0,0.6)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.boxShadow = '';
      });
    });

    // Add aria-hidden default states (defensive)
    const lightbox = $('#lightbox');
    if (lightbox && !lightbox.hasAttribute('aria-hidden')) lightbox.setAttribute('aria-hidden','true');
    const modal = $('#donationModal');
    if (modal && !modal.hasAttribute('aria-hidden')) modal.setAttribute('aria-hidden','true');

    // ensure smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (href === '#' || href === '#!') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({behavior:'smooth', block:'start'});
        }
      });
    });

    // set download attribute behaviour for large images (download button is set in lightbox open)
    const downloadBtn = $('#downloadBtn');
    if (downloadBtn) downloadBtn.addEventListener('click', () => {
      // if target is external or upi, let browser handle it
    });
  }

})();
