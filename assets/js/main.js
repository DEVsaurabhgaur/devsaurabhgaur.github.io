document.addEventListener("DOMContentLoaded", () => {
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
    // small delay before clearing src to avoid flashes
    setTimeout(() => {
      imageEl.src = "";
    }, 150);
  }

  // Click on artwork images
  document.querySelectorAll(".card-art__image").forEach((img) => {
    img.style.cursor = "zoom-in";

    img.addEventListener("click", () => {
      const fullSrc = img.dataset.fullSrc || img.src;
      const card = img.closest(".card-art");
      const titleEl = card ? card.querySelector(".card-art__title") : null;
      const caption = titleEl ? titleEl.textContent.trim() : "";
      openLightbox(fullSrc, caption);
    });
  });

  // Close handlers
  closeBtn.addEventListener("click", closeLightbox);
  backdrop.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("lightbox--open")) {
      closeLightbox();
    }
  });
});
