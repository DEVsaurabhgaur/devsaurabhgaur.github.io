/**
 * main.js
 * - dynamic background (parallax + section swap)
 * - gallery lazy-loader + lightbox + download links
 * - wallpaper cards load
 *
 * NOTE:
 * - For automatic long-term updates: put an index file at `assets/ART/gallery.json`
 *   Format: [{ "file": "IMG_20221002_103510_251.jpg", "title":"...", "alt":"..." }, ...]
 * - Otherwise edit `galleryList` array below.
 */

const BG_PATH = "assets/bg";             // bg folder (bg1..bg6, noise.png, slices.jpg, smoke.jpg)
const ART_PATH = "assets/ART";           // artwork folder
const WALL_PATH = "assets/WALLPAPERS UHD"; // wallpaper folder

/* -------- Dynamic Background Setup -------- */
const bgImages = [
  `${BG_PATH}/bg1.jpg`,
  `${BG_PATH}/bg2.jpg`,
  `${BG_PATH}/bg3.jpg`,
  `${BG_PATH}/bg4.jpg`,
  `${BG_PATH}/bg5.jpg`,
  `${BG_PATH}/bg6.jpg`,
];

const bgLayers = Array.from(document.querySelectorAll(".bg-layer"));
bgLayers.forEach((layer, i) => {
  layer.style.backgroundImage = `url('${bgImages[i]}')`;
  // small parallax offset start
  layer.style.transform = `translateY(0px)`;
});

// overlays already set by CSS (noise/slices/smoke)

/* Parallax / swap logic: on scroll set transform by speed */
function updateBackground() {
  const docHeight = document.body.scrollHeight - window.innerHeight;
  const scroll = window.scrollY;
  const t = docHeight > 0 ? (scroll / docHeight) : 0;

  // simple layered parallax (different speed factors)
  bgLayers.forEach((layer, idx) => {
    const speed = 0.06 + idx * 0.03; // layer-specific speed
    const y = Math.round(scroll * speed);
    layer.style.transform = `translateY(${y}px)`;
    // fade out layers not needed as user scrolls (optional)
    // compute opacity fade so later layers can subtly show through
    const layerThreshold = idx / bgLayers.length;
    layer.style.opacity = Math.max(0.35, 1 - Math.abs(t - layerThreshold) * 2.0);
  });

  // Progressive BG swap effect:
  // As user scrolls, gradually reveal next layer by opacity (handled above).
}

// throttle scroll updates using requestAnimationFrame
let ticking = false;
window.addEventListener("scroll", () => {
  if (!ticking) {
    window.requestAnimationFrame(() => { updateBackground(); ticking = false; });
    ticking = true;
  }
});

/* -------- Gallery loader --------
   Approach:
   - Try fetching assets/ART/gallery.json
   - If not found, fallback to inline galleryList array below
   - Load in batches for infinite scroll
*/
const GALLERY_BATCH = 9; // items per load

// fallback inline list (edit quickly) — filenames must exist in assets/ART/
let galleryList = [
  { file: "IMG_20221002_103510_251.jpg", title: "IMG 20221002 103510 251", alt: "Portrait sketch" },
  { file: "Picsart_23-09-20_19-29-23-455.jpg", title: "Abstract sketch", alt: "Color sketch" },
  { file: "captain carter.jpg", title: "Captain Carter", alt: "Fan art" },
  { file: "deadpool.jpg", title: "Deadpool", alt: "Fan art" },
  { file: "ARTWORK PDF COLLECTION-images-5.jpg", title: "ART PDF 5", alt: "Artwork PDF sample" },
  { file: "ARTWORK PDF COLLECTION-images-15.jpg", title: "ART PDF 15", alt: "Artwork PDF sample" },
  { file: "ARTWORK PDF COLLECTION-images-19.jpg", title: "ART PDF 19", alt: "Artwork PDF sample" },
  { file: "ARTWORK PDF COLLECTION-images-26.jpg", title: "ART PDF 26", alt: "Artwork PDF sample" },
  { file: "ARTWORK PDF COLLECTION-images-27.jpg", title: "ART PDF 27", alt: "Artwork PDF sample" },
  // add more filenames here...
];

// Attempt to fetch gallery.json to override inline list
fetch(`${ART_PATH}/gallery.json`).then(r => {
  if (!r.ok) throw new Error("no gallery.json");
  return r.json();
}).then(json => {
  if (Array.isArray(json) && json.length) {
    galleryList = json;
  }
}).catch(() => {
  // gallery.json missing — fallback to inline list (ok)
}).finally(() => {
  // after galleryList is set, initialize gallery UI
  initGallery();
  initWallpapers();
});

/* DOM references */
const galleryGrid = document.getElementById("gallery-grid");
const loadMoreBtn = document.getElementById("load-more");
const infiniteLoader = document.getElementById("infinite-loader");

let galleryIndex = 0;

function makeCardObj(item){
  const src = `${ART_PATH}/${item.file}`;
  const title = item.title || item.file;
  const alt = item.alt || title;
  return { src, title, alt };
}

function renderGalleryBatch(){
  const batch = galleryList.slice(galleryIndex, galleryIndex + GALLERY_BATCH);
  if (!batch.length) {
    loadMoreBtn.style.display = "none";
    infiniteLoader.textContent = "No more artworks";
    return;
  }
  infiniteLoader.style.display = "none";
  const frag = document.createDocumentFragment();
  batch.forEach(it => {
    const {src,title,alt} = makeCardObj(it);
    const card = document.createElement("article");
    card.className = "gallery-card";
    card.innerHTML = `
      <a class="media" href="${src}" data-title="${escapeHtml(title)}" data-alt="${escapeHtml(alt)}">
        <img data-src="${src}" alt="${escapeHtml(alt)}" class="lazy" loading="lazy">
      </a>
      <div class="card-meta">
        <div class="card-title">${escapeHtml(title)}</div>
        <a class="card-download" href="${src}" download>Download</a>
      </div>
    `;
    frag.appendChild(card);
  });
  galleryGrid.appendChild(frag);
  // observe lazy images in newly appended content
  observeLazyImages();
  // re-hook lightbox links
  attachLightboxLinks();
  galleryIndex += batch.length;
  if (galleryIndex >= galleryList.length) {
    loadMoreBtn.style.display = "none";
  } else {
    loadMoreBtn.style.display = "inline-block";
  }
}

/* load more button */
loadMoreBtn.addEventListener("click", () => {
  infiniteLoader.style.display = "block";
  infiniteLoader.textContent = "Loading…";
  setTimeout(() => {
    renderGalleryBatch();
  }, 300);
});

/* infinite-scroll trigger (near bottom) */
window.addEventListener("scroll", () => {
  const bottom = document.documentElement.scrollHeight - (window.innerHeight + window.scrollY);
  // when bottom < 800px and there are more items, auto-load
  if (bottom < 800 && galleryIndex < galleryList.length) {
    // prevent repeated triggers
    if (!loadMoreBtn.disabled) {
      loadMoreBtn.disabled = true;
      renderGalleryBatch();
      setTimeout(() => loadMoreBtn.disabled = false, 900);
    }
  }
});

/* Lazy-loading using IntersectionObserver */
let lazyObserver;
function observeLazyImages(){
  const lazyImages = document.querySelectorAll("img.lazy");
  if (!("IntersectionObserver" in window)) {
    // fallback: load all images
    lazyImages.forEach(img => {
      if (img.dataset.src) img.src = img.dataset.src;
      img.classList.remove("lazy");
    });
    return;
  }
  if (!lazyObserver){
    lazyObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting){
          const img = e.target;
          if (img.dataset.src) img.src = img.dataset.src;
          img.classList.remove("lazy");
          lazyObserver.unobserve(img);
        }
      });
    }, {rootMargin: "200px 0px 200px 0px", threshold: 0.01});
  }
  lazyImages.forEach(img => lazyObserver.observe(img));
}

/* Lightbox */
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lightbox-img");
const lbDownload = document.getElementById("lightbox-download");
const lbClose = document.getElementById("lightbox-close");

function attachLightboxLinks(){
  document.querySelectorAll(".media").forEach(a => {
    if (a.dataset.bound) return;
    a.dataset.bound = "1";
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      const src = a.href;
      const title = a.dataset.title || "";
      const alt = a.dataset.alt || "";
      openLightbox(src, title, alt);
    });
  });
}

function openLightbox(src, title, alt){
  lbImg.src = src;
  lbImg.alt = alt || title || "";
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
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

/* initialize gallery */
function initGallery(){
  // initial batch
  galleryIndex = 0;
  // clear grid
  galleryGrid.innerHTML = "";
  renderGalleryBatch();
}

/* -------- Wallpapers loader (simple grid) --------
   For background parallax you're already using bg1..bg6.
   Wallpapers are independent downloads and are shown in grid here.
*/
const wallpaperGrid = document.getElementById("wallpaper-grid");
const wallpapers = [
  { file: "wallpaper-1.jpg", title: "wallpaper 1" },
  { file: "wallpaper-2.jpg", title: "wallpaper 2" },
  { file: "wallpaper-3-mobile.jpg", title: "wallpaper 3 mobile" },
  // add more filenames present in assets/WALLPAPERS UHD/
];

function initWallpapers(){
  if (!wallpaperGrid) return;
  wallpaperGrid.innerHTML = "";
  wallpapers.forEach(w => {
    const src = `${WALL_PATH}/${w.file}`;
    const card = document.createElement("div");
    card.className = "wallpaper-card";
    card.innerHTML = `
      <a href="${src}" download style="text-decoration:none;color:inherit">
        <img loading="lazy" src="${src}" alt="${escapeHtml(w.title)}">
      </a>
    `;
    wallpaperGrid.appendChild(card);
  });
}

/* small utility */
function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, (m)=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* initial run: update bg position (in case page already scrolled) */
updateBackground();

/* Accessibility: focus outlines for keyboard users */
document.body.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') document.documentElement.classList.add('show-focus');
}, { once:true });

/* ---- End main.js ---- */
