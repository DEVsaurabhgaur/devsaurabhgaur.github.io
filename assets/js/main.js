/**
 * main.js — redesigned background swap + gallery + lightbox
 * Keep directory structure exactly:
 * - assets/bg/bg1.jpg ... bg6.jpg
 * - assets/bg/noise.png, slices.jpg, smoke.jpg
 * - assets/ART/  (artworks)
 * - assets/WALLPAPERS UHD/ (wallpapers)
 *
 * Recommended: create assets/ART/gallery.json for auto-indexing
 */

const BG_FOLDER = "assets/bg";
const ART_FOLDER = "assets/ART";
const WALL_FOLDER = "assets/WALLPAPERS UHD";

/* ---------- Background system (NO overlap) ---------- 
   Two fixed layers (bgA, bgB). When swapping, we set next image on inactive layer
   then crossfade it in. Parallax is applied to the active layer only.
*/
const bgFiles = [
  `${BG_FOLDER}/bg1.jpg`,
  `${BG_FOLDER}/bg2.jpg`,
  `${BG_FOLDER}/bg3.jpg`,
  `${BG_FOLDER}/bg4.jpg`,
  `${BG_FOLDER}/bg5.jpg`,
  `${BG_FOLDER}/bg6.jpg`
];

// DOM
const bgA = document.getElementById("bg-a");
const bgB = document.getElementById("bg-b");
const sections = Array.from(document.querySelectorAll(".section-swap"));

// initialize layers
bgA.style.backgroundImage = `url('${bgFiles[0]}')`;
bgB.style.backgroundImage = `url('${bgFiles[1] || bgFiles[0]}')`;
bgA.classList.add("active");
let activeLayer = bgA; // element
let inactiveLayer = bgB;
let activeIndex = 0;

// crossfade helper
function crossfadeTo(index) {
  if (index < 0 || index >= bgFiles.length) return;
  if (bgFiles[index] === getComputedStyle(activeLayer).backgroundImage) return;
  // set on inactive
  inactiveLayer.style.backgroundImage = `url('${bgFiles[index]}')`;
  // ensure top layering
  inactiveLayer.classList.add("active");
  activeLayer.classList.remove("active");
  // swap references
  [activeLayer, inactiveLayer] = [inactiveLayer, activeLayer];
  activeIndex = index;
  // subtle transform reset
  activeLayer.style.transform = `translateY(0px)`;
}

// parallax update on scroll
function updateParallax() {
  const scroll = window.scrollY;
  // small translate on the active layer
  const speed = 0.06;
  const y = Math.round(scroll * speed);
  activeLayer.style.transform = `translateY(${y}px)`;
}

// detect which section is mostly in view and set BG accordingly
function updateBackgroundBySection() {
  const middle = window.scrollY + (window.innerHeight/2);
  let winnerIndex = 0;
  for (let i=0;i<sections.length;i++){
    const s = sections[i];
    const top = s.offsetTop;
    const bottom = top + s.offsetHeight;
    if (middle >= top && middle <= bottom) {
      winnerIndex = i;
      break;
    }
  }
  // map section index to bgFiles index (cycle if needed)
  const bgIndex = Math.min(winnerIndex, bgFiles.length-1);
  crossfadeTo(bgIndex);
}

/* throttle using rAF */
let ticking = false;
window.addEventListener("scroll", () => {
  if (!ticking) {
    window.requestAnimationFrame(()=> {
      updateBackgroundBySection();
      updateParallax();
      ticking = false;
    });
    ticking = true;
  }
});

// run initial
updateBackgroundBySection();


/* ---------- Gallery loader (batch + lazy + lightbox) ---------- */

const galleryGrid = document.getElementById("gallery-grid");
const loadMoreBtn = document.getElementById("load-more");
const infiniteLoader = document.getElementById("infinite-loader");

const BATCH = 9;
let galleryIndex = 0;
let galleryList = []; // will populate from gallery.json or embedded list

// fallback inline list (edit in future if you do not provide gallery.json)
galleryList = [
  {file:"IMG_20221002_103510_251.jpg", title:"Static Noise", alt:"charcoal portrait"},
  {file:"Picsart_23-09-20_19-29-23-455.jpg", title:"Blue portrait", alt:"mixed media"},
  {file:"deadpool.jpg", title:"Deadpool", alt:"fan art"},
  {file:"captain carter.jpg", title:"Captain Carter", alt:"fan art"},
  {file:"ARTWORK PDF COLLECTION-images-5.jpg", title:"ART PDF 5", alt:"pdf sample"},
  {file:"ARTWORK PDF COLLECTION-images-15.jpg", title:"ART PDF 15", alt:"pdf sample"},
  {file:"ARTWORK PDF COLLECTION-images-19.jpg", title:"ART PDF 19", alt:"pdf sample"},
  {file:"ARTWORK PDF COLLECTION-images-26.jpg", title:"ART PDF 26", alt:"pdf sample"},
  {file:"ARTWORK PDF COLLECTION-images-27.jpg", title:"ART PDF 27", alt:"pdf sample"}
];

// try fetch gallery.json to override inline
fetch(`${ART_FOLDER}/gallery.json`).then(r=>{
  if (!r.ok) throw new Error("no gallery.json");
  return r.json();
}).then(js=>{
  if (Array.isArray(js) && js.length) {
    galleryList = js;
  }
}).catch(()=>{}).finally(()=>{ initGallery(); initWallpapers(); });

function makeCard(it){
  const src = `${ART_FOLDER}/${it.file}`;
  const title = it.title || it.file;
  const alt = it.alt || title;
  const el = document.createElement("article");
  el.className = "gallery-card";
  el.innerHTML = `
    <a class="media" href="${src}" data-title="${escapeHtml(title)}" data-alt="${escapeHtml(alt)}">
      <img data-src="${src}" alt="${escapeHtml(alt)}" class="lazy" loading="lazy">
    </a>
    <div class="card-meta">
      <div class="card-title">${escapeHtml(title)}</div>
      <a class="card-download" href="${src}" download>Download</a>
    </div>
  `;
  return el;
}

function renderBatch(){
  const items = galleryList.slice(galleryIndex, galleryIndex + BATCH);
  if (!items.length) {
    loadMoreBtn.style.display = "none";
    infiniteLoader.textContent = "No more artworks";
    return;
  }
  const frag = document.createDocumentFragment();
  items.forEach(it => frag.appendChild(makeCard(it)));
  galleryGrid.appendChild(frag);
  observeLazy();
  attachLightbox();
  galleryIndex += items.length;
  if (galleryIndex >= galleryList.length) loadMoreBtn.style.display = "none";
  else loadMoreBtn.style.display = "inline-block";
}

loadMoreBtn.addEventListener("click", ()=>{
  infiniteLoader.style.display = "block";
  infiniteLoader.textContent = "Loading…";
  setTimeout(()=>{ renderBatch(); infiniteLoader.style.display = "none"; }, 250);
});

// auto-load when near bottom
window.addEventListener("scroll", () => {
  const bottom = document.documentElement.scrollHeight - (window.innerHeight + window.scrollY);
  if (bottom < 700 && galleryIndex < galleryList.length) {
    if (!loadMoreBtn.disabled) {
      loadMoreBtn.disabled = true;
      renderBatch();
      setTimeout(()=> loadMoreBtn.disabled = false, 900);
    }
  }
});

/* lazy load */
let lazyObserver;
function observeLazy(){
  const lazyImgs = document.querySelectorAll("img.lazy");
  if (!("IntersectionObserver" in window)) {
    lazyImgs.forEach(i => { if (i.dataset.src) i.src = i.dataset.src; i.classList.remove("lazy"); });
    return;
  }
  if (!lazyObserver) {
    lazyObserver = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if (e.isIntersecting){
          const img = e.target;
          img.src = img.dataset.src;
          img.classList.remove("lazy");
          lazyObserver.unobserve(img);
        }
      });
    }, {rootMargin:"300px 0px 300px 0px"});
  }
  lazyImgs.forEach(img => lazyObserver.observe(img));
}

/* lightbox */
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbClose = document.getElementById("lb-close");
const lbDownload = document.getElementById("lb-download");

function attachLightbox(){
  document.querySelectorAll(".media").forEach(a=>{
    if (a.dataset.bound) return;
    a.dataset.bound = "1";
    a.addEventListener("click", (e)=>{
      e.preventDefault();
      const src = a.href;
      const title = a.dataset.title || "";
      openLightbox(src,title);
    });
  });
}
function openLightbox(src,title){
  lbImg.src = src;
  lbImg.alt = title || "";
  lbDownload.href = src;
  lbDownload.setAttribute("download", title || "artwork");
  lightbox.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
}
function closeLightbox(){
  lightbox.setAttribute("aria-hidden","true");
  lbImg.src = "";
  document.body.style.overflow = "";
}
lbClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e)=> { if (e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown",(e)=> { if (e.key === "Escape") closeLightbox(); });

/* init gallery */
function initGallery(){
  galleryGrid.innerHTML = "";
  galleryIndex = 0;
  renderBatch();
}

/* ---------- Wallpapers grid ---------- 
   Keep wallpaper filenames here or create an index file to load automatically.
*/
const wallpaperGrid = document.getElementById("wallpaper-grid");
const wallpapers = [
  {file:"bg1.jpg", title:"bg1"}, {file:"bg2.jpg", title:"bg2"},
  {file:"bg3.jpg", title:"bg3"}, {file:"bg4.jpg", title:"bg4"},
  {file:"bg5.jpg", title:"bg5"}, {file:"bg6.jpg", title:"bg6"}
];

function initWallpapers(){
  if (!wallpaperGrid) return;
  wallpaperGrid.innerHTML = "";
  wallpapers.forEach(w=>{
    const src = `${WALL_FOLDER}/${w.file}`;
    const card = document.createElement("div");
    card.className = "wallpaper-card";
    card.innerHTML = `<a href="${src}" download><img loading="lazy" src="${src}" alt="${escapeHtml(w.title)}"></a>`;
    wallpaperGrid.appendChild(card);
  });
}

/* small escape util */
function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, (m)=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* initial run */
updateBackgroundInitial();
// set first BG based on hero's data-bg-index
function updateBackgroundInitial(){
  // find first visible section's bg-index (or 0)
  const idx = (sections[0] && Number(sections[0].dataset.bgIndex)) || 0;
  crossfadeToInitial(idx);
}
function crossfadeToInitial(index){
  if (index < 0 || index >= bgFiles.length) index = 0;
  bgA.style.backgroundImage = `url('${bgFiles[index]}')`;
  bgA.classList.add("active");
  activeLayer = bgA; inactiveLayer = bgB; activeIndex = index;
  // preload other layers (set images on inactive but keep opacity 0)
  for (let i=0;i<bgFiles.length;i++){
    // no preloading heavy — skip
  }
}

/* --- End of main.js --- */
