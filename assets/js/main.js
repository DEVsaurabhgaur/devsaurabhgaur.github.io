// ---------- robust reveal + debug (replace any prior cardReveal code) ----------
(function robustCardReveal(){
  try{
    const cards = Array.from(document.querySelectorAll('.card-art'));
    if(!cards.length){
      console.info("[reveal] No .card-art elements found.");
      return;
    }

    // helpful debug array on window for earlier capture
    window._lastErrors = window._lastErrors || [];

    function revealWithStagger(list){
      list.forEach((el, i) => {
        // set data attr for CSS delay classes
        const delayIndex = i % 6;
        el.setAttribute('data-reveal-delay', String(delayIndex));
        // use timeout for stagger; gives predictable animation
        setTimeout(() => {
          el.classList.add('revealed');
          el.setAttribute('aria-hidden', 'false');
        }, 120 + (i * 80));
      });
    }

    // if IO is available, prefer it for early reveal when in viewport
    if ('IntersectionObserver' in window) {
      const observed = new Set();
      const io = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          const el = entry.target;
          if (entry.isIntersecting && !observed.has(el)) {
            // reveal this element now
            const idx = cards.indexOf(el);
            const baseDelay = (idx >= 0) ? (idx * 70) : 0;
            setTimeout(() => {
              el.classList.add('revealed');
              el.setAttribute('aria-hidden', 'false');
            }, baseDelay);
            observed.add(el);
            observer.unobserve(el);
          }
        });
      }, {root:null, rootMargin:'0px 0px -80px 0px', threshold: 0.06});

      // observe all, but also have a safety fallback that reveals any that never enter
      cards.forEach(c => {
        c.setAttribute('aria-hidden','true');
        io.observe(c);
      });

      // safety: after X seconds reveal any remaining (handles IO mismatch)
      setTimeout(() => {
        const remaining = cards.filter(c => !c.classList.contains('revealed'));
        if (remaining.length) {
          console.info(`[reveal] Safety fallback revealing ${remaining.length} cards`);
          revealWithStagger(remaining);
        }
      }, 2200);
    } else {
      // no IO, reveal all with stagger
      revealWithStagger(cards);
    }

    console.info("[reveal] Started observing", cards.length, "cards");
  } catch(err){
    window._lastErrors = window._lastErrors || [];
    window._lastErrors.push(err);
    console.error("[reveal] error:", err);
    // fallback reveal all immediately
    document.querySelectorAll('.card-art').forEach((el)=> el.classList.add('revealed'));
  }
})();
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
// ---------- reveal cards (staggered) ----------
(function cardReveal(){
  const cards = document.querySelectorAll('.card-art');
  if (!cards.length) return;
  let idx = 0;
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // set stagger index
        el.setAttribute('data-reveal-delay', (idx % 5).toString());
        // small timeout ensures transition-delay applies
        requestAnimationFrame(() => el.classList.add('revealed'));
        idx++;
        o.unobserve(el);
      });
    }, {rootMargin:'0px 0px -80px 0px', threshold: 0.06});
    cards.forEach(c => obs.observe(c));
  } else {
    // fallback - reveal all
    cards.forEach((c,i) => {
      c.setAttribute('data-reveal-delay', (i % 5).toString());
      c.classList.add('revealed');
    });
  }
})();

