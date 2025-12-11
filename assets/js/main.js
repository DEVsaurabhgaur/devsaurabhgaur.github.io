/**
 * main.js (module)
 * - Dynamic background cycling + scroll parallax
 * - Masonry gallery (batch loading, lazy img)
 * - Wallpapers loader (batch)
 * - Lightbox
 * - JSON-driven index (assets/ART/gallery.json and assets/WALLPAPERS UHD/wallpapers.json)
 *
 * Important:
 *  - For production, create assets/ART/gallery.json and assets/WALLPAPERS UHD/wallpapers.json
 *    containing arrays of filenames (strings). Example:
 *    ["IMG_20221002_103510_251.jpg","deadpool.jpg","Picsart_23-09-20_19-29-23-455.jpg"]
 *
 *  - If no JSON present, the script falls back to ART_LIST / WALL_LIST inline arrays below.
 */

/* ======================
   CONFIG: edit if needed
   ====================== */
const ART_JSON = 'assets/ART/gallery.json';
const WALL_JSON = 'assets/WALLPAPERS UHD/wallpapers.json';
const ART_PATH = 'assets/ART/';
const WALL_PATH = 'assets/WALLPAPERS UHD/';
const BG_IMAGES = [
  'assets/bg/bg1.jpg',
  'assets/bg/bg2.jpg',
  'assets/bg/bg3.jpg',
  'assets/bg/bg4.jpg',
  'assets/bg/bg5.jpg',
  'assets/bg/bg6.jpg'
];
const BG_CHANGE_INTERVAL = 18000; // ms
const BATCH_SIZE = 24; // number of artwork cards per batch (scales well)
const WALL_BATCH = 12;

/* ===============
   FALLBACK LISTS
   (edit if you don't use JSON)
   =============== */
const ART_LIST = [
  // names I know you uploaded (edit as you add/remove)
  "IMG_20221002_103510_251.jpg",
  "Picsart_23-09-20_19-29-23-455.jpg",
  "captain carter.jpg",
  "deadpool.jpg",
  "ARTWORK PDF COLLECTION-images-5.jpg",
  "ARTWORK PDF COLLECTION-images-15.jpg",
  "ARTWORK PDF COLLECTION-images-19.jpg",
  "ARTWORK PDF COLLECTION-images-26.jpg",
  "ARTWORK PDF COLLECTION-images-27.jpg",
  "Picsart_23-09-23_21-02-34-210.png"
];

const WALL_LIST = [
  "wallpaper-1.jpg",
  "wallpaper-2.jpg",
  "wallpaper-3-mobile.jpg"
];

/* ---------------------------
   DYNAMIC BACKGROUND (cycle + parallax)
   --------------------------- */
const dynamicBg = document.getElementById('dynamic-bg');
let bgIndex = 0;
function setBackground(index){
  dynamicBg.style.backgroundImage = `url("${BG_IMAGES[index]}")`;
}
function startBgCycle(){
  setBackground(bgIndex);
  bgIndex = (bgIndex + 1) % BG_IMAGES.length;
  setInterval(()=>{
    setBackground(bgIndex);
    bgIndex = (bgIndex + 1) % BG_IMAGES.length;
  }, BG_CHANGE_INTERVAL);
}
// parallax on scroll: translateY for a subtle move
window.addEventListener('scroll', () => {
  const sc = window.scrollY * 0.18; // tune parallax depth
  dynamicBg.style.transform = `translateY(${sc}px) scale(1.02)`;
}, { passive: true });

startBgCycle();

/* ---------------------------
   UTIL: fetch JSON list with fallback
   --------------------------- */
async function fetchList(jsonPath, fallback){
  try{
    const r = await fetch(jsonPath, {cache: "no-cache"});
    if(!r.ok) throw new Error('no json');
    const arr = await r.json();
    if(Array.isArray(arr) && arr.length) return arr;
    throw new Error('json empty');
  }catch(e){
    console.warn('Using fallback list for', jsonPath);
    return fallback;
  }
}

/* ---------------------------
   MASONRY: progressive rendering
   --------------------------- */
const masonry = document.getElementById('masonry');
const masonryLoading = document.getElementById('masonryLoading');
const loadMoreBtn = document.getElementById('loadMoreBtn');
let ART = [];            // full artwork list
let artOffset = 0;       // next index to render
let filterType = 'all';  // filter (future: we can add tags in gallery.json)

/* utility: create card element */
function createArtCard(filename){
  const item = document.createElement('div');
  item.className = 'masonry-item';
  // image uses data-src for lazy observer
  const img = document.createElement('img');
  img.dataset.src = ART_PATH + filename;
  img.alt = filename.replace(/[-_\.]/g,' ').replace(/\.[^/.]+$/, "");
  img.loading = 'lazy';
  // meta
  const meta = document.createElement('div');
  meta.className = 'meta';
  const h3 = document.createElement('h3'); h3.textContent = img.alt;
  const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'Artwork';
  meta.appendChild(h3); meta.appendChild(p);
  item.appendChild(img); item.appendChild(meta);

  // click -> lightbox
  item.addEventListener('click', () => openLightbox(img.dataset.src, img.alt));

  return item;
}

/* render next batch */
function renderNextBatch(){
  if(artOffset >= ART.length){
    masonryLoading.textContent = 'No more artworks';
    loadMoreBtn.style.display = 'none';
    return;
  }
  masonryLoading.style.display = 'none';
  const end = Math.min(artOffset + BATCH_SIZE, ART.length);
  const frag = document.createDocumentFragment();
  for(let i = artOffset; i < end; ++i){
    const name = ART[i];
    // simple filter logic if you expand to categories in gallery.json
    if(filterType !== 'all'){
      // placeholder for future filters by metadata
    }
    const card = createArtCard(name);
    frag.appendChild(card);
  }
  masonry.appendChild(frag);
  artOffset = end;
  // after inserting, kick lazy observer
  lazyLoadObserver.observeAll();
}

/* load initial */
async function initMasonry(){
  masonryLoading.style.display = 'block';
  ART = await fetchList(ART_JSON, ART_LIST);
  artOffset = 0;
  masonry.innerHTML = ''; // reset
  renderNextBatch();
  // show Load More if remaining
  if(artOffset < ART.length) loadMoreBtn.style.display = 'inline-flex';
  else loadMoreBtn.style.display = 'none';
}

/* Load more button */
if(loadMoreBtn){
  loadMoreBtn.addEventListener('click', ()=> {
    renderNextBatch();
    if(artOffset >= ART.length) loadMoreBtn.style.display = 'none';
  });
}

/* ---------------------------
   LAZY-LOAD OBSERVER (for many images)
   - keeps memory low and speeds initial load
   --------------------------- */
const lazyLoadObserver = (function(){
  const intersection = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if(en.isIntersecting){
        const img = en.target;
        if(img.dataset.src){
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        obs.unobserve(img);
      }
    });
  }, { rootMargin: "400px 0px", threshold: 0.01 });

  return {
    observeAll: function(){
      const imgs = document.querySelectorAll('img[data-src]');
      imgs.forEach(img => intersection.observe(img));
    }
  };
})();

/* ---------------------------
   WALLPAPERS (grid, lazy)
   --------------------------- */
const wallGrid = document.getElementById('wallpaperGrid');
const wallpaperLoading = document.getElementById('wallpaperLoading');

async function initWallpapers(){
  wallpaperLoading.style.display = 'block';
  const WAL = await fetchList(WALL_JSON, WALL_LIST);
  wallpaperLoading.style.display = 'none';
  // render first batch (WALL_BATCH)
  const batch = WAL.slice(0, WALL_BATCH);
  const frag = document.createDocumentFragment();
  batch.forEach(fn => {
    const el = document.createElement('div'); el.className = 'card-wall';
    const img = document.createElement('img');
    img.className = 'card-wall__image';
    img.alt = fn.replace(/\.[^/.]+$/, "").replace(/[-_\.]/g,' ');
    img.dataset.src = WALL_PATH + fn;
    img.loading = 'lazy';
    el.appendChild(img);
    el.addEventListener('click', () => openLightbox(WALL_PATH + fn, img.alt));
    frag.appendChild(el);
  });
  wallGrid.appendChild(frag);
  lazyLoadObserver.observeAll();
}

/* ---------------------------
   LIGHTBOX (desktop-friendly)
   --------------------------- */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxDownload = document.getElementById('lightboxDownload');

function openLightbox(src, caption){
  lightboxImg.src = src;
  lightboxImg.alt = caption || '';
  lightboxCaption.textContent = caption || '';
  lightbox.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  if(lightboxDownload) { lightboxDownload.href = src; lightboxDownload.setAttribute('download',''); }
}
function closeLightbox(){
  lightbox.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  setTimeout(()=> lightboxImg.src = '', 200);
}
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => { if(e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeLightbox(); });

/* ---------------------------
   INIT
   --------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  // init masonry & wallpapers
  initMasonry();
  initWallpapers();

  // hide loading text after a short moment
  setTimeout(()=> {
    const l = document.getElementById('masonryLoading');
    if(l) l.style.display = 'none';
  }, 1500);

  // header year
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();
});
