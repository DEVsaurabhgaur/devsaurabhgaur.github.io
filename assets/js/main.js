/**
 * main.js (module)
 * - Dynamic background cycling + scroll parallax (uses bg1..bg6)
 * - Masonry gallery (batch loading, lazy img)
 * - Wallpaper grid
 * - Download button on each artwork card + lightbox download
 *
 * NOTE:
 * - Create assets/ART/gallery.json and assets/WALLPAPERS UHD/wallpapers.json for automatic indexing.
 * - If JSON absent, script falls back to ART_LIST / WALL_LIST arrays below.
 */

/* CONFIG */
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
const BG_CHANGE_INTERVAL = 20000; // 20s
const BATCH_SIZE = 24;
const WALL_BATCH = 12;

/* FALLBACK ARRAYS (edit as you add files) */
const ART_LIST = [
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

/* DYNAMIC BACKGROUND */
const dynamicBg = document.getElementById('dynamic-bg');
let bgIndex = 0;
function setBackground(i){ dynamicBg.style.backgroundImage = `url("${BG_IMAGES[i]}")`; }
function startBgCycle(){
  setBackground(bgIndex);
  bgIndex = (bgIndex + 1) % BG_IMAGES.length;
  setInterval(()=>{ setBackground(bgIndex); bgIndex = (bgIndex + 1) % BG_IMAGES.length; }, BG_CHANGE_INTERVAL);
}
window.addEventListener('scroll', () => {
  const sc = window.scrollY * 0.18;
  dynamicBg.style.transform = `translateY(${sc}px) scale(1.02)`;
}, { passive:true });
startBgCycle();

/* JSON fetch with fallback */
async function fetchList(path, fallback){
  try{
    const r = await fetch(path, {cache: "no-cache"});
    if(!r.ok) throw new Error('json not found');
    const arr = await r.json();
    if(Array.isArray(arr)) return arr;
    return fallback;
  }catch(e){
    console.warn('Fallback list used for', path);
    return fallback;
  }
}

/* MASONRY */
const masonry = document.getElementById('masonry');
const masonryLoading = document.getElementById('masonryLoading');
const loadMoreBtn = document.getElementById('loadMoreBtn');
let ART = [], artOffset = 0;

function createArtCard(filename){
  const item = document.createElement('div'); item.className = 'masonry-item';
  const img = document.createElement('img');
  img.dataset.src = ART_PATH + filename;
  img.alt = filename.replace(/\.[^/.]+$/, "").replace(/[-_\.]/g,' ');
  img.loading = 'lazy';

  const meta = document.createElement('div'); meta.className = 'meta';
  const h3 = document.createElement('h3'); h3.textContent = img.alt;

  const metaRight = document.createElement('div'); metaRight.className = 'meta-right';
  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'download-btn';
  downloadBtn.textContent = 'Download';
  downloadBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = ART_PATH + filename;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  });

  metaRight.appendChild(downloadBtn);
  meta.appendChild(h3);
  meta.appendChild(metaRight);

  item.appendChild(img);
  item.appendChild(meta);

  // click opens lightbox
  item.addEventListener('click', () => openLightbox(ART_PATH + filename, img.alt));

  return item;
}

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
    frag.appendChild(createArtCard(ART[i]));
  }
  masonry.appendChild(frag);
  artOffset = end;
  lazyLoadObserver.observeAll();
}

async function initMasonry(){
  masonryLoading.style.display = 'block';
  ART = await fetchList(ART_JSON, ART_LIST);
  artOffset = 0; masonry.innerHTML = '';
  renderNextBatch();
  if(artOffset < ART.length) loadMoreBtn.style.display = 'inline-flex';
  else loadMoreBtn.style.display = 'none';
}
if(loadMoreBtn) loadMoreBtn.addEventListener('click', ()=> renderNextBatch());

/* LAZY LOADER */
const lazyLoadObserver = (() => {
  const io = new IntersectionObserver((entries, obs) => {
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
    observeAll: () => {
      document.querySelectorAll('img[data-src]').forEach(i => io.observe(i));
    }
  };
})();

/* WALLPAPERS */
const wallGrid = document.getElementById('wallpaperGrid');
const wallpaperLoading = document.getElementById('wallpaperLoading');

async function initWallpapers(){
  wallpaperLoading.style.display = 'block';
  const WALL = await fetchList(WALL_JSON, WALL_LIST);
  wallpaperLoading.style.display = 'none';
  const frag = document.createDocumentFragment();
  WALL.slice(0, WALL_BATCH).forEach(fn => {
    const el = document.createElement('div'); el.className = 'card-wall';
    const img = document.createElement('img'); img.className = 'card-wall__image';
    img.dataset.src = WALL_PATH + fn; img.alt = fn.replace(/\.[^/.]+$/, "").replace(/[-_\.]/g,' ');
    img.loading = 'lazy';
    el.appendChild(img);
    el.addEventListener('click', (e) => openLightbox(WALL_PATH + fn, img.alt));
    frag.appendChild(el);
  });
  wallGrid.appendChild(frag);
  lazyLoadObserver.observeAll();
}

/* LIGHTBOX */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxDownload = document.getElementById('lightboxDownload');

function openLightbox(src, caption){
  lightboxImg.src = src;
  lightboxImg.alt = caption || '';
  lightboxCaption.textContent = caption || '';
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if(lightboxDownload){ lightboxDownload.href = src; lightboxDownload.setAttribute('download',''); }
}
function closeLightbox(){
  lightbox.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  setTimeout(()=> lightboxImg.src = '', 200);
}
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => { if(e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeLightbox(); });

/* INIT */
document.addEventListener('DOMContentLoaded', () => {
  initMasonry();
  initWallpapers();
  setTimeout(()=> {
    const l = document.getElementById('masonryLoading'); if(l) l.style.display = 'none';
  }, 1400);
  const year = document.getElementById('year'); if(year) year.textContent = new Date().getFullYear();
});
