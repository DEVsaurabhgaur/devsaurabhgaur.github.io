/* =========================================
   USER CONFIGURATION (EDIT THIS PART ONLY)
   ========================================= */
const portfolioItems = [
    // ⬇️ COPY PASTE THIS BLOCK FOR NEW ART ⬇️
    {
        file: 'assets/images/my_art_1.jpg',  // Path to your image
        title: 'The Silent Assassin',        // Name of the art
        category: 'art',                     // 'art' or 'wallpaper'
        description: 'Handmade portrait.'    // Optional description
    },
    // ⬆️ END BLOCK ⬆️

    // Example Item 2
    {
        file: 'assets/images/wallpaper_city.jpg',
        title: 'Neon Tokyo 2077',
        category: 'wallpaper',
        description: '4K Desktop Wallpaper'
    },
    
    // Example Item 3 (Add as many as you want)
    {
        file: 'assets/images/sketch_naruto.jpg',
        title: 'Pain Arc Sketch',
        category: 'art',
        description: 'Pencil on paper'
    },
     {
        file: 'assets/images/wallpaper_nature.jpg',
        title: 'Dark Forest',
        category: 'wallpaper',
        description: 'Mobile Wallpaper'
    }
];

/* =========================================
   SYSTEM LOGIC (DO NOT TOUCH BELOW)
   ========================================= */

const grid = document.getElementById('masonry-grid');
const filterBtns = document.querySelectorAll('.nav-btn[data-filter]');

// 1. Render Gallery Function
function renderGallery(filterType) {
    grid.innerHTML = ''; // Clear current grid
    grid.style.opacity = '0'; // Fade out effect

    setTimeout(() => {
        portfolioItems.forEach(item => {
            // Check filter match
            if (filterType === 'all' || item.category === filterType) {
                const card = document.createElement('div');
                card.classList.add('grid-item');
                
                // HTML Template for each card
                card.innerHTML = `
                    <img src="${item.file}" loading="lazy" alt="${item.title}">
                    <div class="item-overlay">
                        <span class="item-cat">// ${item.category.toUpperCase()}</span>
                        <h3 class="item-title">${item.title}</h3>
                    </div>
                `;

                // Add Click Event for Lightbox
                card.addEventListener('click', () => openLightbox(item));
                grid.appendChild(card);
            }
        });
        grid.style.opacity = '1'; // Fade in
    }, 200);
}

// 2. Lightbox Logic
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbTitle = document.getElementById('lb-title');
const lbDl = document.getElementById('lb-dl');
const lbClose = document.getElementById('lb-close');
const lbBackdrop = document.querySelector('.lightbox-backdrop');

function openLightbox(item) {
    lbImg.src = item.file;
    lbTitle.innerText = item.title;
    lbDl.href = item.file; // Sets the download link
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Lock scroll
}

function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto'; // Unlock scroll
    setTimeout(() => { lbImg.src = ''; }, 300);
}

// Close events
lbClose.addEventListener('click', closeLightbox);
lbBackdrop.addEventListener('click', closeLightbox);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
});

// 3. Filter Button Logic
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        filterBtns.forEach(b => b.classList.remove('active'));
        // Add active to clicked
        btn.classList.add('active');
        // Render
        renderGallery(btn.dataset.filter);
    });
});

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    renderGallery('all');
});
