// ==============================
// MAIN JS – LIGHTBOX + AUTO GALLERY
// ==============================

document.addEventListener("DOMContentLoaded", () => {
  setupLightbox();
  autoLoadArt();
  autoLoadWallpapers();
});

// ==============================
// LIGHTBOX
// ==============================

function setupLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;

  const imageEl = lightbox.querySelector(".lightbox__image");
  const captionEl = lightbox.querySelector(".lightbox__caption");
  const closeBtn = lightbox.querySelector(".lightbox__close");
  const backdrop = lightbox.querySelector(".lightbox__backdrop");

  function openLightbox(src, caption) {
    imageEl.src = src;
    imageEl.alt = caption || "Artwork preview";
    captionEl.textContent = caption || "";
    lightbox.classList.add("lightbox--open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("lightbox--open");
    document.body.style.overflow = "";
    setTimeout(() => {
      imageEl.src = "";
    }, 150);
  }

  // Event delegation: works for existing + future images
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".card-art__image, .card-wall__image");
    if (!img) return;

    const fullSrc = img.dataset.fullSrc || img.src;
    const card = img.closest(".card-art, .card-wall");
    const titleEl = card ? card.querySelector(".card-art__title, .card-wall__title") : null;
    const caption = titleEl ? titleEl.textContent.trim() : "";
    openLightbox(fullSrc, caption);
  });

  closeBtn.addEventListener("click", closeLightbox);
  backdrop.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("lightbox--open")) {
      closeLightbox();
    }
  });
}

// ==============================
// AUTO ART GALLERY
// ==============================

const AUTO_ART_CONFIG = {
  basePath: "assets/ART/",
  prefix: "auto-art-",
  maxItems: 99, // support up to 99 artworks
};

function autoLoadArt() {
  const container = document.querySelector(".grid--art");
  if (!container) return;

  for (let i = 1; i <= AUTO_ART_CONFIG.maxItems; i++) {
    const num = String(i).padStart(2, "0");

    // Expected filename format:
    // auto-art-01__Title-With-Dashes__category.jpg
    const baseName = `${AUTO_ART_CONFIG.prefix}${num}`;
    const fileName = `${baseName}.jpg`;
    const src = `${AUTO_ART_CONFIG.basePath}${fileName}`;

    const probe = new Image();
    probe.onload = () => {
      const meta = parseAutoName(baseName, "art", i);
      const card = createArtCard(src, meta);
      container.appendChild(card);
    };
    probe.onerror = () => {
      // no file with this number, just ignore
    };
    probe.src = src;
  }
}

function parseAutoName(baseName, type, index) {
  // baseName like "auto-art-01__Title-With-Dashes__category"
  const parts = baseName.split("__");
  const rawTitle = parts[1] || `${type === "art" ? "Artwork" : "Wallpaper"} #${index}`;
  const title = rawTitle.replace(/-/g, " ");
  const rawCategory = (parts[2] || "").toLowerCase();

  let category = "other";
  if (type === "art") {
    const allowed = ["portrait", "devotional", "shiva", "fanart", "other"];
    if (allowed.includes(rawCategory)) category = rawCategory;
  } else {
    const allowed = ["dark", "minimal", "mobile", "other"];
    if (allowed.includes(rawCategory)) category = rawCategory;
  }

  const alt =
    type === "art"
      ? `Handmade artwork: ${title}`
      : `Wallpaper: ${title}`;

  return {
    title,
    category,
    alt,
    // short generic text so height stable
    desc:
      type === "art"
        ? "Original handmade artwork from Saurabh’s auto gallery collection."
        : "UHD wallpaper generated from Saurabh’s artwork collection.",
    meta:
      type === "art"
        ? "Original artwork · Auto gallery"
        : "UHD · Auto gallery",
  };
}

function createArtCard(src, meta) {
  const article = document.createElement("article");
  article.className = "card-art";
  article.dataset.category = meta.category;

  article.innerHTML = `
    <div class="card-art__image-wrapper">
      <img
        src="${src}"
        alt="${meta.alt}"
        class="card-art__image"
        loading="lazy"
      />
    </div>
    <div class="card-art__body">
      <h3 class="card-art__title">${meta.title}</h3>
      <p class="card-art__desc">${meta.desc}</p>
      <p class="card-art__meta">${meta.meta}</p>
    </div>
  `;
  return article;
}

// ==============================
// AUTO WALLPAPER GALLERY
// ==============================

const AUTO_WALL_CONFIG = {
  basePath: "assets/WALLPAPERS UHD/",
  prefix: "auto-wall-",
  maxItems: 99,
};

function autoLoadWallpapers() {
  const container = document.querySelector(".grid--wall");
  if (!container) return;

  for (let i = 1; i <= AUTO_WALL_CONFIG.maxItems; i++) {
    const num = String(i).padStart(2, "0");
    // auto-wall-01__Title-With-Dashes__category.jpg
    const baseName = `${AUTO_WALL_CONFIG.prefix}${num}`;
    const fileName = `${baseName}.jpg`;
    const src = `${AUTO_WALL_CONFIG.basePath}${fileName}`;

    const probe = new Image();
    probe.onload = () => {
      const meta = parseAutoName(baseName, "wall", i);
      const card = createWallCard(src, meta);
      container.appendChild(card);
    };
    probe.onerror = () => {};
    probe.src = src;
  }
}

function createWallCard(src, meta) {
  const article = document.createElement("article");
  article.className = "card-wall";
  article.dataset.category = meta.category;

  article.innerHTML = `
    <div class="card-wall__image-wrapper">
      <img
        src="${src}"
        alt="${meta.alt}"
        class="card-wall__image"
        loading="lazy"
      />
    </div>
    <div class="card-wall__body">
      <div>
        <h3 class="card-wall__title">${meta.title}</h3>
        <p class="card-wall__meta">${meta.meta}</p>
      </div>
      <a href="${src}" download class="btn btn--tiny">Download</a>
    </div>
  `;
  return article;
}
