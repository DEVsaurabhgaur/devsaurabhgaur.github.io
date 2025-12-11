// main.js (module) — background rotation, lightbox, nav highlight, small parallax

/* ----------------------
   DYNAMIC BACKGROUND ROTATION
   ---------------------- */
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
  if (!bgDiv) return;
  bgDiv.style.backgroundImage = `url("${bgImages[bgIndex]}")`;
  bgIndex = (bgIndex + 1) % bgImages.length;
}
updateBG();
setInterval(updateBG, 18000); // rotate every 18s

/* ----------------------
   LIGHTBOX (open on click)
   ---------------------- */
const gallery = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxClose = document.getElementById("lightboxClose");

if (gallery) {
  gallery.addEventListener("click", (e) => {
    const img = e.target.closest("img");
    if (!img) return;
    const src = img.dataset.full || img.src;
    const title = img.alt || img.getAttribute("data-title") || "";
    openLightbox(src, title);
  });
}

function openLightbox(src, caption) {
  lightboxImg.src = src;
  lightboxImg.alt = caption || "Artwork";
  lightboxCaption.textContent = caption || "";
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImg.src = "";
  document.body.style.overflow = "";
}

if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && lightbox.getAttribute("aria-hidden") === "false") {
    closeLightbox();
  }
});

/* ----------------------
   NAV ACTIVE LINK HIGHLIGHT (scroll spy)
   ---------------------- */
const navLinks = document.querySelectorAll(".nav__link[href^='#']");
const sections = Array.from(navLinks).map(a => document.querySelector(a.getAttribute("href")));

function onScroll() {
  const y = window.scrollY + (window.innerHeight * 0.15);
  let activeIndex = -1;
  sections.forEach((sec, idx) => {
    if (!sec) return;
    const rect = sec.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    if (y >= top) activeIndex = idx;
  });
  navLinks.forEach((a, i) => {
    if (i === activeIndex) a.classList.add("active");
    else a.classList.remove("active");
  });
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ----------------------
   SMALL PARALLAX / MOTION FOR HERO PREVIEW (subtle)
   ---------------------- */
const hero = document.querySelector(".hero");
if (hero) {
  hero.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    const previews = hero.querySelectorAll(".hero-card img");
    previews.forEach(p => {
      p.style.transform = `translate(${dx * 8}px, ${dy * 8}px) scale(1.01)`;
    });
  });
  hero.addEventListener("mouseleave", () => {
    const previews = hero.querySelectorAll(".hero-card img");
    previews.forEach(p => { p.style.transform = ""; });
  });
}

/* ----------------------
   Set current year in footer
   ---------------------- */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
