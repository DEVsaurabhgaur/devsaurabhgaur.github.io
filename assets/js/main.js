// main.js - hero parallax, reveal, lightbox, downloads
(function(){
  // small helpers
  const q = s => document.querySelector(s)
  const qa = s => Array.from(document.querySelectorAll(s))

  // hero parallax for background layers
  const hero = q('.hero')
  if(hero){
    const slice = document.createElement('div')
    slice.className = 'hero-bg-slice'
    hero.appendChild(slice)

    document.addEventListener('mousemove', e=>{
      const x = (e.clientX/window.innerWidth - 0.5) * 24
      const y = (e.clientY/window.innerHeight - 0.5) * 18
      // move background layers subtly
      hero.style.setProperty('--mx', x+'px')
      hero.style.setProperty('--my', y+'px')
      // apply transforms
      hero.querySelectorAll('.hero-bg-slice, .hero::before, .hero::after').forEach(()=>{})
      // individual transforms:
      hero.querySelector('.hero-bg-slice').style.transform = `translate3d(${x*0.5}px, ${y*0.4}px, 0) scale(1.02)`
      hero.style.backgroundPosition = `${50 - x/4}% ${50 - y/6}%`
    })
  }

  // hero card subtle float on mouse enter
  qa('.hero-card').forEach(card=>{
    card.addEventListener('mouseenter', ()=>{
      qa('.hero-card').forEach(c => c.style.transform = c.classList.contains('hero-card--front')
        ? 'translate3d(-28px,-10px,48px) rotate(6deg) scale(1.02)'
        : 'translate3d(40px,20px,0) rotate(-6deg) scale(.98)'
      )
    })
    card.addEventListener('mouseleave', ()=>{
      document.querySelectorAll('.hero-card--front').forEach(c => c.style.transform = '')
      document.querySelectorAll('.hero-card--back').forEach(c => c.style.transform = '')
    })
  })

  // reveal on scroll
  const revealEls = qa('.section__title, .card-art, .card-wall, .quote')
  const reveal = (entries, obs) => {
    entries.forEach(e=>{
      if(e.isIntersecting) {
        e.target.style.opacity = 1
        e.target.style.transform = 'none'
        obs.unobserve(e.target)
      }
    })
  }
  const obs = new IntersectionObserver(reveal, {threshold:0.12})
  revealEls.forEach(el=>{
    el.style.opacity = 0
    el.style.transform = 'translateY(18px)'
    el.style.transition = 'all .7s cubic-bezier(.2,.9,.2,1)'
    obs.observe(el)
  })

  // thumbnails and lightbox (works for .card-art images and wallpapers)
  const lightbox = q('#lightbox')
  const lightboxImage = q('.lightbox__image')
  const lightboxCaption = q('.lightbox__caption')
  const closeBtn = q('.lightbox__close')
  qa('.card-art__image, .card-wall__image').forEach(img=>{
    img.style.cursor = 'zoom-in'
    img.addEventListener('click', (e)=>{
      lightboxImage.src = img.src
      lightboxCaption.textContent = img.closest('.card-art') ? img.closest('.card-art').querySelector('.card-art__title').textContent : ''
      lightbox.classList.add('active')
      lightbox.setAttribute('aria-hidden','false')
    })
  })
  closeBtn.addEventListener('click', ()=>{ lightbox.classList.remove('active'); lightbox.setAttribute('aria-hidden','true') })
  lightbox.addEventListener('click', (e)=>{ if(e.target === lightbox) { lightbox.classList.remove('active') } })

  // download buttons: ensure they trigger download with original filename
  qa('.card-wall a[download]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      // nothing needed: native browser download works; can add analytics here
    })
  })

  // simple smooth scroll for nav links
  qa('.nav__link').forEach(a=>{
    a.addEventListener('click', (ev)=>{
      ev.preventDefault()
      const href = a.getAttribute('href'); if(!href || href === '#') return
      const el = document.querySelector(href)
      if(el) el.scrollIntoView({behavior:'smooth', block:'start'})
    })
  })

  // set current year (already in HTML but keep safe)
  const yr = document.getElementById('year'); if(yr) yr.textContent = new Date().getFullYear()

})()
