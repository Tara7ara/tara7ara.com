// Tara7ara Portfolio Interactions
document.addEventListener('DOMContentLoaded', () => {
  // TaraTrack Screenshot Switcher
  const mainImg = document.getElementById('previewMainImg');
  const thumbBtns = document.querySelectorAll('.thumb-btn');
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImg');
  const modalCaption = document.getElementById('modalCaption');
  const modalClose = document.getElementById('modalClose');

  if (thumbBtns.length > 0 && mainImg) {
    thumbBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const src = btn.getAttribute('data-img');
        const caption = btn.getAttribute('data-caption');
        
        thumbBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        mainImg.src = src;
        mainImg.alt = caption;
      });
    });
  }

  // Lightbox
  const previewWrap = document.getElementById('previewImgWrap');
  if (previewWrap && modal && modalImg) {
    previewWrap.addEventListener('click', () => {
      const activeBtn = document.querySelector('.thumb-btn.active');
      modalImg.src = mainImg.src;
      modalCaption.textContent = activeBtn ? activeBtn.getAttribute('data-caption') : mainImg.alt;
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (modalClose && modal) {
    const closeModal = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    };

    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });
  }

  // Copy email functionality
  const copyBtns = document.querySelectorAll('[data-copy-email]');
  copyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const email = 'taratara@tara7ara.com';
      navigator.clipboard.writeText(email).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ ¡Copiado!';
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 2000);
      });
    });
  });
});
