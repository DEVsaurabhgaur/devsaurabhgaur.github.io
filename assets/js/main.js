document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. QUOTE ROTATOR ---
    const quotes = [
        { text: "He who has a why to live can bear almost any how.", author: "NIETZSCHE" },
        { text: "The wound is the place where the Light enters you.", author: "RUMI" },
        { text: "Man is condemned to be free.", author: "SARTRE" },
        { text: "We suffer more often in imagination than in reality.", author: "SENECA" },
        { text: "To be is to be perceived.", author: "BERKELEY" }
    ];

    let qIndex = 0;
    const qText = document.querySelector('.quote-text');
    const qAuth = document.getElementById('quote-author');

    setInterval(() => {
        // Fade out
        qText.style.opacity = 0;
        qAuth.style.opacity = 0;
        qText.style.transition = "opacity 0.5s";
        qAuth.style.transition = "opacity 0.5s";

        setTimeout(() => {
            // Update Text
            qIndex = (qIndex + 1) % quotes.length;
            qText.innerText = `"${quotes[qIndex].text}"`;
            qAuth.innerText = `— ${quotes[qIndex].author}`;
            
            // Fade in
            qText.style.opacity = 1;
            qAuth.style.opacity = 1;
        }, 500); 
    }, 6000); // Change every 6 seconds

    // --- 2. LIGHTBOX ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCap = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.close-btn');

    document.querySelectorAll('.card-gallery img').forEach(img => {
        img.addEventListener('click', () => {
            lightbox.style.display = 'flex';
            lightboxImg.src = img.src;
            lightboxCap.innerText = img.alt;
        });
    });

    // Close Actions
    closeBtn.addEventListener('click', () => {
        lightbox.style.display = 'none';
    });

    lightbox.addEventListener('click', (e) => {
        if(e.target === lightbox) lightbox.style.display = 'none';
    });
});
