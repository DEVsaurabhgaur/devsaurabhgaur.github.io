// main.js (module) - dynamic background, cinematic gallery, lazy batching, lightbox

/* ------------- CONFIG ------------- */
/*
  How it scales:
  - Place a JSON manifest at assets/art_manifest.json with structure:
    { "art": ["ART/filename1.jpg","ART/filename2.jpg", ...] }

  - Place a JSON manifest at assets/wallpapers_manifest.json:
    { "wallpapers": ["WALLPAPERS UHD/wall1.jpg", ...] }

  If manifests exist, script fetches them. If not, it falls back to the built-in arrays below.
*/

const CONFIG = {
  artBatchSize: 6,        // number of cinematic cards to create per batch
  wallBatchSize: 6,       // wallpapers per batch
  backgroundRotateSec: 18 // background rotation interval
};

/* ------------- BACKGROUNDS ------------- */
const bgImages = [
  "assets/bg/bg1.jpg",
  "assets/bg/bg2.jpg",
  "assets/bg/bg3.jpg",
  "assets/bg/bg4.jpg",
  "assets/bg/bg5.jpg",
  "assets/bg/bg6.jpg"
];

let bgIndex = 0;
const bgDiv = document.getElementById("dynamic-bg");
function updateBG() {
  bgDiv.style.backgroundImage = `url("${bgImages[bgIndex]}")`;
  bgIndex = (bgIndex + 1) % bgImages.length;
}
if (bgDiv) {
  updateBG();
  setInterval(updateBG, CONFIG.backgroundRotateSec * 1000);
  // parallax on scroll - subtle translate on Y
  window.addEventListener('scroll', () => {
    const y = window.scrollY * 0.12; // slower movement
    bgDiv.style.transform = `translateY(${y}px)`;
  }, { passive: true });
}

/* ------------- ARTWORK / WALLPAPER SOURCE FALLBACKS ------------- */
/* Built-in fallback list (your currently uploaded filenames).
   When you add a manifest file to assets/, the manifest will be used instead.
   Add new images to assets/ART and ideally update the manifest (optional).
*/
const EMBEDDED_ART = [
  "assets/ART/ARTWORK PDF COLLECTION-images-5.jpg",
  "assets/ART/ARTWORK PDF COLLECTION-images-15.jpg",
  "assets/ART/ARTWORK PDF COLLECTION-images-19.jpg",
  "assets/ART/ARTWORK PDF COLLECTION-images-26.jpg",
  "assets/ART/ARTWORK PDF COLLECTION-images-27.jpg",
  "assets/ART/captain carter.jpg",
  "assets/ART/deadpool.jpg",
  "assets/ART/IMG_20221002_103510_251.jpg",
  "assets/ART/Picsart_23-09-20_19-29-23-455.jpg",
  "assets/ART/Picsart_23-09-23_21-02-34-210.png"
];

const EMBEDDED_WALLPAPERS = [
  "assets/WALLPAPERS UHD/wallpaper-1.jpg",
  "assets/WALLPAPERS UHD/wallpaper-2.jpg",
  "assets/WALLPAPERS UHD/wallpaper-3-mobile.jpg"
];

/* Utility: try fetch JSON manifest else fallback to embed */
async function loadManifest(path, key, fallback) {
  try {
    const r = await fetch(path, { cache: "no-cache" });
    if (!r.ok) throw new Error("no manifest");
    const json = await r.json();
    if (Array.isArray(json[key])) return json[key];
    // support top-level array
    if (Array.isArray(json)) return json;
    return fallback;
  } catch (e) {
    return fallback;
  }
}

/* ------------- BATCHED RENDERING ------------- */
const artGrid = document.getElementById('artGrid');
const loadMoreArtBtn = document.getElementById('loadMoreArt');
const wallGrid = document.getElementById('wallGrid');
const loadMoreWallBtn = document.getElementById('loadMoreWall');

let artList = [];
let wallList = [];
let artPos = 0;
let wallPos = 0;

/* IntersectionObserver to lazy-load images (switch data-src -> src when entering view) */
const io = new IntersectionObserver((entries) => {
  entries.forEach(ent => {
    if (ent.isIntersecting) {
      const img = ent.target;
      const src = img.dataset.src;
      if (src && !img.src) {
        img.src = src;
        img.removeAttribute('data-src');
      }
      io.unobserve(img);
    }
  });
}, { rootMargin: '200px 0px', threshold: 0.01 });

/* create cinematic card markup and attach lazy-loaded image */
function createCinematicCard(src, index) {
  const wrap = document.createElement('article');
  wrap.className = 'cinema-card';
  wrap.dataset.index = index;

  const media = document.createElement('div');
  media.className = 'cinema-card__media';

  const img = document.createElement('img');
  img.alt = ''; // will set alt from filename if needed
  img.loading = 'lazy';
  img.dataset.src = src; // lazy load via observer
  img.className = 'cinema-img';
  img.style.opacity = '0';
  img.addEventListener('load', () => { img.style.opacity = '1'; });
  media.appendChild(img);

  const meta = document.createElement('div');
  meta.className = 'cinema-card__meta';
  const title = document.createElement('h3');
  title.className = 'cinema-card__title';
  // derive title from filename (clean)
  const name = src.split('/').pop().replace(/[-_]/g, ' ').replace(/\.(jpe?g|png|webp|gif|svg)$/i,'');
  title.textContent = name.length > 36 ? name.slice(0,36) + '…' : name;
  const desc = document.createElement('p');
  desc.className = 'cinema-card__desc';
  desc.textContent = 'Handmade — high resolution';

  const tags = document.createElement('div');
  tags.className = 'cinema-card__tags';
  const t1 = document.createElement('span'); t1.className = 'cinema-tag'; t1.textContent = 'Original';
  const t2 = document.createElement('span'); t2.className = 'cinema-tag'; t2.textContent = 'Portrait';
  tags.append(t1, t2);

  meta.appendChild(title);
  meta.appendChild(desc);
  meta.appendChild(tags);

  wrap.appendChild(media);
  wrap.appendChild(meta);

  // open lightbox on click anywhere in card
  wrap.addEventListener('click', () => openLightbox(index, 'art'));
  // observe image
  io.observe(img);

  // store full src on element dataset for lightbox
  wrap.dataset.full = src;

  return wrap;
}

/* create wallpaper card */
function createWallCard(src, index) {
  const wrap = document.createElement('article');
  wrap.className = 'wall-card';
  wrap.dataset.index = index;

  const img = document.createElement('img');
  img.loading = 'lazy';
  img.alt = '';
  img.dataset.src = src;
  wrap.appendChild(img);

  // click -> open lightbox (type wallpapers)
  wrap.addEventListener('click', () => openLightbox(index, 'wall'));
  io.observe(img);
  wrap.dataset.full = src;

  return wrap;
}

/* render next batch of art */
function renderNextArtBatch() {
  if (!artGrid || artPos >= artList.length) return;
  const batch = artList.slice(artPos, artPos + CONFIG.artBatchSize);
  batch.forEach((src, i) => {
    const card = createCinematicCard(src, artPos + i);
    artGrid.appendChild(card);
  });
  artPos += batch.length;
  // hide button when done
  if (artPos >= artList.length) loadMoreArtBtn.style.display = 'none';
}

/* render next batch of wallpapers */
function renderNextWallBatch() {
  if (!wallGrid || wallPos >= wallList.length) return;
  const batch = wallList.slice(wallPos, wallPos + CONFIG.wallBatchSize);
  batch.forEach((src, i) => {
    const card = createWallCard(src, wallPos + i);
    wallGrid.appendChild(card);
  });
  wallPos += batch.length;
  if (wallPos >= wallList.length) loadMoreWallBtn.style.display = 'none';
}

/* ------------- LIGHTBOX ------------- */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');
const lbClose = document.getElementById('lightboxClose');
const lbDownload = document.getElementById('lightboxDownload');

let lbType = 'art'; // 'art' or 'wall'
let lbIndex = 0;

function openLightbox(index, type='art') {
  lbType = type;
  lbIndex = index;
  const list = (type === 'art') ? artList : wallList;
  const src = list[index];
  if (!src) return;
  lightboxImg.src = src;
  lightboxCaption.textContent = src.split('/').pop();
  lbDownload.href = src;
  lightbox.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.setAttribute('aria-hidden','true');
  lightboxImg.src = '';
  document.body.style.overflow = '';
}

function lbPrevFn() {
  const list = (lbType === 'art') ? artList : wallList;
  lbIndex = (lbIndex - 1 + list.length) % list.length;
  openLightbox(lbIndex, lbType);
}
function lbNextFn() {
  const list = (lbType === 'art') ? artList : wallList;
  lbIndex = (lbIndex + 1) % list.length;
  openLightbox(lbIndex, lbType);
}

lbPrev && lbPrev.addEventListener('click', (e) => { e.stopPropagation(); lbPrevFn(); });
lbNext && lbNext.addEventListener('click', (e) => { e.stopPropagation(); lbNextFn(); });
lbClose && lbClose.addEventListener('click', closeLightbox);
lightbox && lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (lightbox.getAttribute('aria-hidden') === 'false') {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lbPrevFn();
    if (e.key === 'ArrowRight') lbNextFn();
  }
});

/* ------------- INIT: load manifests or fallback, then render first batch ------------- */
async function init() {
  artList = await loadManifest('assets/art_manifest.json','art', EMBEDDED_ART);
  wallList = await loadManifest('assets/wallpapers_manifest.json','wallpapers', EMBEDDED_WALLPAPERS);

  // ensure arrays of strings
  artList = Array.isArray(artList) ? artList : [];
  wallList = Array.isArray(wallList) ? wallList : [];

  renderNextArtBatch();
  renderNextWallBatch();

  // connect load more buttons
  loadMoreArtBtn && loadMoreArtBtn.addEventListener('click', () => { renderNextArtBatch(); window.scrollTo({top: document.getElementById('art').offsetTop - 80, behavior:'smooth'}); });
  loadMoreWallBtn && loadMoreWallBtn.addEventListener('click', () => { renderNextWallBatch(); window.scrollTo({top: document.getElementById('wallpapers').offsetTop - 80, behavior:'smooth'}); });

  // optional: infinite scroll auto-load (when reaching bottom of artGrid area)
  const sentinel = document.createElement('div');
  sentinel.style.height = '2px';
  sentinel.style.width = '100%';
  artGrid.parentNode.appendChild(sentinel);
  const sentinelObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting && artPos < artList.length) {
        renderNextArtBatch();
      }
    });
  }, { root: null, rootMargin: '400px', threshold: 0.01 });
  sentinelObserver.observe(sentinel);
}

/* start */
init();

/* ------------- NAV SCROLL HIGHLIGHT (small) ------------- */
const navLinks = document.querySelectorAll('.nav__link[href^="#"]');
const sections = Array.from(navLinks).map(a => document.querySelector(a.getAttribute('href')));
function onScrollSpy() {
  const y = window.scrollY + (window.innerHeight * 0.18);
  let activeIndex = -1;
  sections.forEach((sec, idx) => {
    if (!sec) return;
    const top = sec.getBoundingClientRect().top + window.scrollY;
    if (y >= top) activeIndex = idx;
  });
  navLinks.forEach((a, i) => a.classList.toggle('active', i === activeIndex));
}
window.addEventListener('scroll', onScrollSpy, { passive: true });
onScrollSpy();

/* ------------- FOOTER YEAR ------------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

