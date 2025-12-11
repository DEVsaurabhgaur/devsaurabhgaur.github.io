/* main.js — interactions: hero reveal, parallax, lightbox, donate */
document.addEventListener('DOMContentLoaded', function(){
  // small staged reveal for hero title
  const title = document.querySelector('.hero__title');
  if(title){
    title.style.opacity = 0;
    title.style.transform = 'translateY(14px)';
    setTimeout(()=> {
      title.style.transition = 'all 700ms cubic-bezier(.2,.9,.2,1)';
      title.style.opacity = 1; title.style.transform = 'none';
    }, 200);
  }

  // mouse parallax on body for background position (hero)
  const hero = document.querySelector('.hero');
  if(hero){
    hero.addEventListener('mousemove', (e) => {
      const w = window.innerWidth, h = window.innerHeight;
      const nx = (e.clientX/w - 0.5) * 20;
      const ny = (e.clientY/h - 0.5) * 14;
      // apply subtle transform to the :before and :after via CSS variables if you prefer
      hero.style.setProperty('--px', nx + 'px');
      hero.style.setProperty('--py', ny + 'px');
      // move the hero preview slightly
      const preview = document.querySelector('.hero-preview');
      if(preview) preview.style.transform = `translate3d(${nx*0.6}px, ${ny*0.6}px, 0)`;
    });
  }

  // LIGHTBOX: open when clicking .card-art__image
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.querySelector('.lightbox__image');
  const lbCap = document.querySelector('.lightbox__caption');
  const closeBtn = document.querySelector('.lightbox__close');

  document.querySelectorAll('.card-art__image').forEach(img => {
    img.addEventListener('click', (ev) => {
      const src = img.getAttribute('src');
      const title = img.closest('.card-art').querySelector('.card-art__title')?.textContent || '';
      const desc = img.closest('.card-art').querySelector('.card-art__desc')?.textContent || '';
      lbImg.src = src;
      lbImg.alt = title;
      lbCap.textContent = title + (desc ? ' — ' + desc : '');
      lightbox.style.display = 'flex';
      lightbox.setAttribute('aria-hidden','false');
    });
  });

  function closeLightbox(){
    lightbox.style.display = 'none';
    lightbox.setAttribute('aria-hidden','true');
  }
  closeBtn?.addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox__backdrop')?.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeLightbox(); });

  // download anchors: small UX, open in new tab if needed
  document.querySelectorAll('a[download]').forEach(a=>{
    a.addEventListener('click', ()=> {
      // analytics or visual feedback could be added here
      a.textContent = 'Downloading...';
      setTimeout(()=> a.textContent = 'Download', 1800);
    });
  });

  // donation modal: open when element with class donate-btn is clicked
  const donateModal = document.createElement('div');
  donateModal.className = 'donate-modal';
  donateModal.innerHTML = `
    <button class="donate-close" style="position:absolute;right:8px;top:8px;background:none;border:none;color:#fff;font-size:20px">×</button>
    <h3 style="margin:0 0 12px">Support my work — UPI</h3>
    <img src="assets/upi/upi-qr.jpg" alt="Scan to donate" />
    <p style="color:var(--muted);margin:8px 0 0">If you love these wallpapers, scan the QR or use UPI id: <strong>saurabhgaur122000@okaxis</strong></p>
  `;
  document.body.appendChild(donateModal);
  document.querySelectorAll('.donate-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> donateModal.style.display = 'block');
  });
  donateModal.querySelector('.donate-close')?.addEventListener('click', ()=> donateModal.style.display = 'none');

});
