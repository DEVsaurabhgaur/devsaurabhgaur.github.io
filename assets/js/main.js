/* main.js — site interactions
   Place at: assets/js/main.js
*/

/* DOM helpers */
const $ = sel => document.querySelector(sel)
const $$ = sel => Array.from(document.querySelectorAll(sel))

document.addEventListener('DOMContentLoaded', () => {

  // MENU LINKS: smooth scroll
  $$('.nav__link').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href')
      if (!href || !href.startsWith('#')) return
      e.preventDefault()
      const target = document.querySelector(href)
      if (target) target.scrollIntoView({behavior:'smooth', block:'start'})
    })
  })

  // ART FILTERING (chips)
  const artChips = $$('.chips .chip')
  const artCards = $$('.grid--art .card-art')
  artChips.forEach(chip => {
    chip.addEventListener('click', () => {
      // manage active state
      artChips.forEach(c => c.classList.remove('chip--active'))
      chip.classList.add('chip--active')
      const filter = chip.dataset.filter || chip.getAttribute('data-filter') || chip.getAttribute('data-wall-filter') || 'all'

      // decide which grid: art or wall
      const parent = chip.closest('.container')
      const usingWall = !!chip.closest('#wallpapers')
      if (usingWall) {
        // wallpapers
        const walls = $$('.grid--wall .card-wall')
        walls.forEach(w => {
          const cat = w.getAttribute('data-category') || 'all'
          if (filter === 'all' || cat === filter) w.style.display = ''
          else w.style.display = 'none'
        })
      } else {
        artCards.forEach(card => {
          const cat = card.getAttribute('data-category') || 'all'
          if (filter === 'all' || cat === filter) card.style.display = ''
          else card.style.display = 'none'
        })
      }
    })
  })

  // Lightbox for art & wallpapers
  const lightbox = $('#lightbox')
  const lightboxImg = document.querySelector('.lightbox__image')
  const lightboxCaption = document.querySelector('.lightbox__caption')
  const lightboxClose = document.querySelector('.lightbox__close')
  const imageTriggers = $$('.card-art__image, .card-wall__image')

  imageTriggers.forEach(img => {
    img.style.cursor = 'zoom-in'
    img.addEventListener('click', e => {
      const src = img.getAttribute('src') || img.getAttribute('data-src')
      lightboxImg.src = src
      const title = img.closest('.card-art') ? img.closest('.card-art').querySelector('.card-art__title')?.textContent : img.closest('.card-wall')?.querySelector('.card-wall__title')?.textContent
      lightboxCaption.textContent = title || ''
      lightbox.style.display = 'flex'
      lightbox.setAttribute('aria-hidden', 'false')
      document.body.style.overflow = 'hidden'
    })
  })

  lightboxClose.addEventListener('click', closeLightbox)
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox || e.target.classList.contains('lightbox__backdrop')) closeLightbox() })

  function closeLightbox(){
    lightbox.style.display = 'none'
    lightbox.setAttribute('aria-hidden', 'true')
    lightboxImg.src = ''
    document.body.style.overflow = ''
  }

  // Download handler: ensures correct download attribute present
  $$('.btn--tiny').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // optionally add tracking here
      // default browser download works as anchor has download attribute in HTML
    })
  })

  // Floating parallax for hero layers (mouse)
  const heroGlow = document.querySelector('.hero__glow')
  if (heroGlow) {
    document.addEventListener('mousemove', (ev) => {
      const x = (ev.clientX / window.innerWidth - 0.5) * 16
      const y = (ev.clientY / window.innerHeight - 0.5) * 12
      heroGlow.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.01)`
    })
  }

  // Replace placeholders with NEON art thumbnails if available (graceful)
  try {
    const neonArt = ['../NEON/art1.png','../NEON/art2.png','../NEON/art3.png']
    const heroFront = document.querySelector('.hero-card--front img')
    const heroBack = document.querySelector('.hero-card--back img')
    if (heroFront && neonArt[0]) heroFront.src = neonArt[0]
    if (heroBack && neonArt[1]) heroBack.src = neonArt[1]
  } catch (e){ /* ignore if not present */ }

})
