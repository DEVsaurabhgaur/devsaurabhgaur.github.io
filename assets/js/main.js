/**
 * assets/js/main.js
 * Main site JS (module, defer)
 *
 * Responsibilities:
 *  - Build bg container (bg layers + overlays)
 *  - Observe sections -> swap background layers + parallax
 *  - Load manifests (ART and WALLPAPERS) and render cards
 *  - Implement lazy-loading, srcset placeholders, infinite scroll via sentinel
 *  - Lightbox with keyboard nav
 *  - Donate modal
 *
 * Note: Because JS in a browser can't list server files, this code relies on:
 *   - assets/ART/manifest.json
 *   - assets/WALLPAPERS UHD/manifest.json
 *
 * If manifests are not present, the page will fallback to static placeholders.
 */

const CONFIG = {
  artManifest: 'assets/ART/manifest.json',
  wallpapersManifest: 'assets/WALLPAPERS UHD/manifest.json',
  artBatch: 24,
  wallpaperBatch: 24,
  bgPaths: [
    'assets/bg/bg1.jpg','assets/bg/bg2.jpg','assets/bg/bg3.jpg',
    'assets/bg/bg4.jpg','assets/bg/bg5.jpg','assets/bg/bg6.jpg'
  ],
  overlays: {
    noise: 'assets/bg/noise.png',
    slices: 'assets/bg/slices.jpg',
    smoke: 'assets/bg/smoke.jpg'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initUI();
  initBgLayers();
  observeSections();
  initGallery();
  initWallpapers();
  initLightbox();
  initDonateModal();
  document.getElementById('current-year').textContent = new Date().getFullYear();
  // hide preloader if any
  const pre = document.getElementById('preloader');
  if (pre) pre.classList.add('hidden');
});

/* -----------------------------
   UI helpers
   ----------------------------- */
function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function initUI(){
  // Smooth scroll for internal links
  document.querySelectorAll('a[data-scroll]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const id = a.getAttribute('href');
      const el = document.querySelector(id);
      if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
      // close mobile nav if open
      const mobile = document.getElementById('mobile-nav');
      if (mobile && !mobile.hidden) { mobile.hidden = true; document.getElementById('menu-toggle').setAttribute('aria-expanded','false'); }
    });
  });

  // mobile menu
  const menuToggle = $('#menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', ()=>{
      const m = document.getElementById('mobile-nav');
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!expanded));
      if (m) { m.hidden = !m.hidden; }
    });
  }
}

/* -----------------------------
   Background layers & parallax
   ----------------------------- */
function initBgLayers(){
  const container = document.getElementById('bg-container');
  if (!container) return;

  // Clear container if anything pre-exists
  container.innerHTML = '';

  // Add bg layers in order
  CONFIG.bgPaths.forEach((p, idx) => {
    const div = document.createElement('div');
    div.className = 'bg-layer';
    div.dataset.bg = p;
    div.dataset.index = idx;
    // lazy set background image to avoid blocking
    // set background-image but keep opacity 0 until activated
    div.style.backgroundImage = `url("${p}")`;
    container.appendChild(div);
  });

  // overlays
  const noise = document.createElement('div');
  noise.className = 'bg-overlay noise';
  noise.style.backgroundImage = `url("${CONFIG.overlays.noise}")`;
  container.appendChild(noise);

  const slices = document.createElement('div');
  slices.className = 'bg-overlay slices';
  slices.style.backgroundImage = `url("${CONFIG.overlays.slices}")`;
  container.appendChild(slices);

  const smoke = document.createElement('div');
  smoke.className = 'bg-overlay smoke';
  smoke.style.backgroundImage = `url("${CONFIG.overlays.smoke}")`;
  container.appendChild(smoke);

  // ensure at least first layer is active
  const first = container.querySelector('.bg-layer');
  if (first) first.classList.add('active');

  // Parallax on scroll — lightweight: adjust transform translateY based on scroll position within active section
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        applyParallax();
        ticking = false;
      });
      ticking = true;
    }
  }, {passive:true});
}

function applyParallax(){
  // Find active layer
  const active = document.querySelector('#bg-container .bg-layer.active');
  if (!active) return;
  // compute how far user scrolled relative to viewport center
  const rect = active.getBoundingClientRect();
  // small translate for cinematic effect
  const max = 40; // px
  const center = (rect.top + rect.bottom) / 2;
  const viewCenter = window.innerHeight / 2;
  const diff = (center - viewCenter) / viewCenter; // -1..1
  const y = Math.max(-max, Math.min(max, -diff * max));
  active.style.transform = `translateY(${y}px)`;
}

/* -----------------------------
   Section observation (swap bg layers)
   ----------------------------- */
function observeSections(){
  const sections = document.querySelectorAll('main section[data-bg-index]');
  const bgLayers = document.querySelectorAll('#bg-container .bg-layer');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = Number(entry.target.dataset.bgIndex) || 0;
        bgLayers.forEach((b, i) => {
          b.classList.toggle('active', i === idx);
        });
        // preload next bg
        prefetchNextBg(idx + 1);
      }
    });
  }, {threshold: 0.45});

  sections.forEach(s => io.observe(s));
}

function prefetchNextBg(index){
  if (!index || index >= CONFIG.bgPaths.length) return;
  const p = CONFIG.bgPaths[index];
  const img = new Image();
  img.src = p;
  img.onload = ()=>{/*prefetched*/};
}

/* -----------------------------
   Gallery (ART)
   ----------------------------- */

async function initGallery(){
  const grid = document.getElementById('gallery-grid');
  const sentinel = document.getElementById('gallery-sentinel');
  if (!grid || !sentinel) return;

  let manifest = await fetchManifest(CONFIG.artManifest);
  if (!manifest || !manifest.items) manifest = {items:[]};

  // keep an index
  let idx = 0;

  function createCard(item){
    const card = document.createElement('article');
    card.className = 'card-art';
    card.setAttribute('role','listitem');
    card.tabIndex = 0;

    const img = document.createElement('img');
    img.loading = 'lazy';
    // progressive: use thumbnail if provided else use full path
    img.src = item.thumb || `assets/ART/${item.file}`;
    img.alt = item.title || item.file;
    img.dataset.full = item.full || (`assets/ART/${item.file}`);
    if (item.srcset) img.srcset = item.srcset;
    card.appendChild(img);

    const body = document.createElement('div');
    body.className = 'card-body';

    const left = document.createElement('div');
    left.innerHTML = `<div class="card-title">${escapeHtml(item.title || item.file)}</div>
                      <div class="card-meta">${escapeHtml(item.caption || '')}</div>`;
    left.style.flex = '1';

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const dl = document.createElement('a');
    dl.href = img.dataset.full;
    dl.download = '';
    dl.className = 'download';
    dl.textContent = 'Download';
    dl.setAttribute('aria-label', `Download ${item.title || item.file}`);

    const view = document.createElement('button');
    view.type = 'button';
    view.className = 'view';
    view.textContent = 'Preview';
    view.setAttribute('aria-label', `Preview ${item.title || item.file}`);
    view.addEventListener('click', ()=> openLightboxFor(img));

    actions.appendChild(dl);
    actions.appendChild(view);

    body.appendChild(left);
    body.appendChild(actions);
    card.appendChild(body);

    // clicking image opens lightbox too
    img.addEventListener('click', ()=> openLightboxFor(img));
    return card;
  }

  function loadBatch(){
    const slice = manifest.items.slice(idx, idx + CONFIG.artBatch);
    slice.forEach(item => {
      const c = createCard(item);
      grid.appendChild(c);
    });
    idx += slice.length;
    // if no more items, stop observer
    if (idx >= manifest.items.length) {
      galleryObserver.disconnect();
      sentinel.style.display = 'none';
    }
  }

  // initial load
  loadBatch();

  // infinite scroll sentinel
  const galleryObserver = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if (e.isIntersecting) {
        loadBatch();
      }
    });
  }, {rootMargin: '300px'});
  galleryObserver.observe(sentinel);
}

/* -----------------------------
   Wallpapers
   ----------------------------- */
async function initWallpapers(){
  const grid = document.getElementById('wallpapers-grid');
  const sentinel = document.getElementById('wallpapers-sentinel');
  if (!grid || !sentinel) return;

  let manifest = await fetchManifest(CONFIG.wallpapersManifest);
  if (!manifest || !manifest.items) manifest = {items:[]};

  let idx = 0;

  function makeTile(item){
    const el = document.createElement('div');
    el.className = 'wallpaper-tile';
    el.setAttribute('role','listitem');

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = item.title || item.file;
    img.src = item.thumb || (`assets/WALLPAPERS UHD/${item.file}`);
    img.dataset.full = item.full || (`assets/WALLPAPERS UHD/${item.file}`);

    // actions
    const actions = document.createElement('div');
    actions.className = 'wallpaper-actions';

    const apply = document.createElement('button');
    apply.type = 'button';
    apply.textContent = 'Use as Background';
    apply.addEventListener('click', ()=>{
      // set bg-container active background to this wallpaper on the active layer
      applyWallpaperToActiveLayer(img.dataset.full);
    });

    const dl = document.createElement('a');
    dl.href = img.dataset.full;
    dl.download = '';
    dl.textContent = 'Download';

    actions.appendChild(apply);
    actions.appendChild(dl);

    el.appendChild(img);
    el.appendChild(actions);
    return el;
  }

  function loadBatch(){
    const slice = manifest.items.slice(idx, idx + CONFIG.wallpaperBatch);
    slice.forEach(item => {
      const t = makeTile(item);
      grid.appendChild(t);
    });
    idx += slice.length;
    if (idx >= manifest.items.length) {
      wallpaperObserver.disconnect();
      sentinel.style.display = 'none';
    }
  }

  loadBatch();

  const wallpaperObserver = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if (e.isIntersecting) loadBatch();
    });
  }, {rootMargin: '300px'});
  wallpaperObserver.observe(sentinel);
}

function applyWallpaperToActiveLayer(url){
  const active = document.querySelector('#bg-container .bg-layer.active');
  if (!active) return;
  active.style.backgroundImage = `url("${url}")`;
  // gentle fade by toggling opacity off and on (smooth because active stays)
  active.classList.add('active');
}

/* -----------------------------
   Lightbox Implementation
   ----------------------------- */

function initLightbox(){
  const lb = $('#lightbox');
  const lbImg = $('#lb-image');
  const lbCaption = $('#lb-caption');
  const lbDownload = $('#lb-download');
  const closeBtn = $('#lb-close');
  const prevBtn = $('#lb-prev');
  const nextBtn = $('#lb-next');

  let galleryImgs = []; // list of image data {src, caption}
  // populate from DOM on first open
  function scanGallery(){
    galleryImgs = [];
    document.querySelectorAll('#gallery-grid img').forEach(img=>{
      galleryImgs.push({src: img.dataset.full || img.src, caption: img.alt || '', el: img});
    });
  }

  let currentIndex = 0;

  function openAt(index){
    scanGallery();
    if (!galleryImgs.length) return;
    currentIndex = (index + galleryImgs.length) % galleryImgs.length;
    const item = galleryImgs[currentIndex];
    lbImg.src = item.src;
    lbImg.alt = item.caption || '';
    lbCaption.textContent = item.caption || '';
    lbDownload.href = item.src;
    lbDownload.setAttribute('download','');
    lb.setAttribute('aria-hidden','false');
    lb.style.visibility = 'visible';
    lb.style.opacity = '1';
    // focus for keyboard nav
    lb.focus();
  }

  window.openLightboxFor = function(imgElement){
    // determine index from node list
    scanGallery();
    const full = imgElement.dataset.full || imgElement.src;
    const i = galleryImgs.findIndex(g => g.src === full);
    openAt(i >= 0 ? i : 0);
  };

  function close(){
    lbImg.src = '';
    lb.setAttribute('aria-hidden','true');
    lb.style.opacity = '0';
    lb.style.visibility = 'hidden';
  }

  function nav(offset){
    scanGallery();
    if (!galleryImgs.length) return;
    currentIndex = (currentIndex + galleryImgs.length + offset) % galleryImgs.length;
    const item = galleryImgs[currentIndex];
    lbImg.src = item.src;
    lbImg.alt = item.caption || '';
    lbCaption.textContent = item.caption || '';
    lbDownload.href = item.src;
  }

  // button handlers
  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', ()=>nav(-1));
  nextBtn.addEventListener('click', ()=>nav(1));

  // keyboard
  document.addEventListener('keydown', (e)=>{
    if (!lb || lb.getAttribute('aria-hidden') === 'true') return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') nav(-1);
    if (e.key === 'ArrowRight') nav(1);
  });
}

/* -----------------------------
   Donate modal
   ----------------------------- */
function initDonateModal(){
  const donateBtns = document.querySelectorAll('#donate-btn, #donate-btn-2');
  const modal = document.getElementById('donate-modal');
  const close = modal ? modal.querySelector('.modal-close') : null;
  donateBtns.forEach(b => {
    b.addEventListener('click', ()=> {
      if (!modal) return;
      modal.setAttribute('aria-hidden','false');
      modal.style.visibility = 'visible';
    });
  });
  if (close) close.addEventListener('click', ()=>{
    modal.setAttribute('aria-hidden','true');
    modal.style.visibility = 'hidden';
  });
}

/* -----------------------------
   Manifest fetch & fallback
   ----------------------------- */
async function fetchManifest(path){
  try {
    const res = await fetch(path, {cache: 'no-cache'});
    if (!res.ok) throw new Error('manifest fetch failed');
    return res.json();
  } catch (err){
    console.warn('Manifest not found or failed to load:', path, err);
    return null;
  }
}

/* -----------------------------
   Small helpers
   ----------------------------- */
function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, (m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
