// ==============================
// MAIN JS – LIGHTBOX + FILTERS
// ==============================

document.addEventListener("DOMContentLoaded", () => {
  setupLightbox();
  setupArtFilters();
  setupWallpaperFilters();
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

  // Event delegation – works for all current + future images
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".card-art__image, .card-wall__image");
    if (!img) return;

    const fullSrc = img.dataset.fullSrc || img.src;
    const card = img.closest(".card-art, .card-wall");
    const titleEl = card
      ? card.querySelector(".card-art__title, .card-wall__title")
      : null;
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
// ART FILTERS
// ==============================

function setupArtFilters() {
  const chips = document.querySelectorAll("[data-filter]");
  const cards = document.querySelectorAll(".card-art");
  if (!chips.length || !cards.length) return;

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const filter = chip.dataset.filter;
      chips.forEach((c) => c.classList.remove("chip--active"));
      chip.classList.add("chip--active");

      cards.forEach((card) => {
        const cat = card.dataset.category || "all";
        if (filter === "all" || filter === cat) {
          card.style.display = "";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}

// ==============================
// WALLPAPER FILTERS
// ==============================

function setupWallpaperFilters() {
  const chips = document.querySelectorAll("[data-wall-filter]");
  const cards = document.querySelectorAll(".card-wall");
  if (!chips.length || !cards.length) return;

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const filter = chip.dataset.wallFilter;
      chips.forEach((c) => c.classList.remove("chip--active"));
      chip.classList.add("chip--active");

      cards.forEach((card) => {
        const cat = card.dataset.category || "all";
        if (filter === "all" || filter === cat) {
          card.style.display = "";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}
