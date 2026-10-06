// Tara7ara Portfolio Interactions
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  // Aparición de bloques al entrar en pantalla
  const revealables = document.querySelectorAll('.section-header, .project-card, .timeline-item, .skill-box, .cta-card');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealables.forEach((el) => {
      // escalonado dentro de cada rejilla para que no aparezcan todas de golpe
      const siblings = [...el.parentElement.children].filter((s) => s.matches('.project-card, .skill-box'));
      const i = siblings.indexOf(el);
      if (i > 0) el.style.transitionDelay = `${(i % 4) * 90}ms`;
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  initScrollStory();

  // Visor de capturas en galería (TaraTrack, TaraScan, TarArch)
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImg');
  const modalCaption = document.getElementById('modalCaption');
  const modalCount = document.getElementById('modalCount');
  const modalClose = document.getElementById('modalClose');
  const modalPrev = document.getElementById('modalPrev');
  const modalNext = document.getElementById('modalNext');

  let gallery = [];
  let gIndex = 0;

  function renderShot() {
    if (!gallery.length || !modalImg) return;
    const shot = gallery[gIndex];
    modalImg.src = shot.src;
    modalImg.alt = shot.caption || 'Vista previa';
    if (modalCaption) modalCaption.textContent = shot.caption || '';
    const multi = gallery.length > 1;
    if (modalCount) modalCount.textContent = multi ? `${gIndex + 1} / ${gallery.length}` : '';
    if (modalPrev) modalPrev.hidden = !multi;
    if (modalNext) modalNext.hidden = !multi;
  }

  function openGallery(shots, start) {
    if (!modal || !shots.length) return;
    gallery = shots;
    gIndex = Math.min(Math.max(start || 0, 0), shots.length - 1);
    renderShot();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function step(d) {
    if (gallery.length < 2) return;
    gIndex = (gIndex + d + gallery.length) % gallery.length;
    renderShot();
  }

  // TaraTrack: abre la galería de sus capturas desde la que está activa
  const ttFrame = document.getElementById('ttFrame');
  if (ttFrame) {
    ttFrame.addEventListener('click', () => {
      const shotEls = [...ttFrame.querySelectorAll('.tt-shot')];
      const shots = shotEls.map((im) => ({ src: im.src, caption: im.dataset.caption || im.alt }));
      const start = shotEls.indexOf(ttFrame.querySelector('.tt-shot.active'));
      openGallery(shots, start);
    });
  }

  // Portadas de las tarjetas del carrusel (data-shots = "ruta|pie;;ruta|pie;...")
  document.querySelectorAll('.card-cover').forEach((btn) => {
    btn.addEventListener('click', () => {
      const shots = (btn.dataset.shots || '').split(';;').map((s) => {
        const [src, caption] = s.split('|');
        return { src, caption: caption || '' };
      }).filter((s) => s.src);
      openGallery(shots, 0);
    });
  });

  if (modal) {
    const closeModal = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    };
    if (modalClose) modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    if (modalPrev) modalPrev.addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
    if (modalNext) modalNext.addEventListener('click', (e) => { e.stopPropagation(); step(1); });
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('active')) return;
      if (e.key === 'Escape') closeModal();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
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

// Animaciones ligadas al scroll: portada, frase fija, TaraTrack y línea de tiempo
function initScrollStory() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // Parte la frase en palabras; las que van en <em> se marcan como clave
  const storyText = document.querySelector('.story-text');
  const words = [];
  if (storyText) {
    const nodes = [...storyText.childNodes];
    storyText.textContent = '';
    nodes.forEach((node) => {
      const key = node.nodeType === 1;
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { storyText.append(part); return; }
        const span = document.createElement('span');
        span.className = key ? 'w key' : 'w';
        span.textContent = part;
        storyText.append(span);
        words.push(span);
      });
    });
  }
  if (reduce) return;

  const hero = document.querySelector('.hero-full');
  const heroInner = document.querySelector('.hero-inner');
  const story = document.querySelector('.story');
  const timelines = [...document.querySelectorAll('.timeline')];
  const ttScroll = document.querySelector('.tt-scroll');
  const ttSteps = [...document.querySelectorAll('.tt-step')];
  const ttShots = [...document.querySelectorAll('.tt-shot')];
  const hscroll = document.querySelector('.hscroll');
  const hTrack = document.querySelector('.hscroll-track');
  const mqRows = [...document.querySelectorAll('.mq-row')];
  const marquee = document.querySelector('.marquee');
  const bigCta = document.querySelector('.big-cta');
  const pinned = window.matchMedia('(min-width: 901px) and (min-height: 700px)');
  let manualStep = -1;

  function setStep(i) {
    ttSteps.forEach((s, k) => s.classList.toggle('active', k === i));
    ttShots.forEach((s, k) => s.classList.toggle('active', k === i));
  }

  // Al pulsar un paso: en escritorio se baja hasta él, en móvil solo se cambia la captura
  ttSteps.forEach((step, i) => {
    step.querySelector('.tt-step-btn').addEventListener('click', () => {
      if (pinned.matches && ttScroll) {
        const range = ttScroll.offsetHeight - window.innerHeight;
        const top = ttScroll.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + range * ((i + 0.5) / ttSteps.length), behavior: 'smooth' });
      } else {
        manualStep = i;
        setStep(i);
      }
    });
  });

  // La altura del carrusel depende de lo ancho que sea: se recalcula al redimensionar
  function sizeHscroll() {
    if (!hscroll || !hTrack) return;
    if (pinned.matches) {
      const extra = hTrack.scrollWidth - window.innerWidth;
      hscroll.style.height = `${window.innerHeight + Math.max(0, extra) + 200}px`;
    } else {
      hscroll.style.height = '';
      hTrack.style.transform = '';
    }
  }
  sizeHscroll();
  window.addEventListener('resize', sizeHscroll);
  let ticking = false;

  function update() {
    ticking = false;
    const vh = window.innerHeight;

    if (hero && heroInner) {
      const p = clamp(window.scrollY / (hero.offsetHeight * 0.8));
      heroInner.style.transform = `translate3d(0, ${p * -90}px, 0)`;
      heroInner.style.opacity = String(1 - p * 1.1);
      window.inkScroll = p;
    }

    if (story && words.length) {
      const r = story.getBoundingClientRect();
      const p = clamp((-r.top + vh * 0.15) / (r.height - vh * 0.9));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < lit));
    }

    if (ttScroll && ttSteps.length && pinned.matches) {
      const r = ttScroll.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - vh));
      setStep(Math.min(ttSteps.length - 1, Math.floor(p * ttSteps.length)));
    }

    if (hscroll && hTrack && pinned.matches) {
      const r = hscroll.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - vh));
      const extra = Math.max(0, hTrack.scrollWidth - window.innerWidth);
      hTrack.style.transform = `translate3d(${-p * extra}px, 0, 0)`;
    }

    if (marquee) {
      const r = marquee.getBoundingClientRect();
      const p = clamp((vh - r.top) / (vh + r.height));
      mqRows.forEach((row) => {
        const dir = Number(row.dataset.dir);
        const shift = dir > 0 ? -p * 35 : -35 + p * 35;
        row.firstElementChild.style.transform = `translate3d(${shift}%, 0, 0)`;
      });
    }

    if (bigCta) {
      const r = bigCta.getBoundingClientRect();
      const p = clamp((vh - r.top) / (vh * 0.5));
      bigCta.style.transform = `scale(${0.55 + 0.45 * p})`;
      bigCta.style.opacity = String(0.15 + 0.85 * p);
    }

    timelines.forEach((tl) => {
      const r = tl.getBoundingClientRect();
      const fill = clamp((vh * 0.6 - r.top) / r.height);
      tl.style.setProperty('--fill', fill.toFixed(4));
      tl.querySelectorAll('.timeline-item').forEach((item) => {
        item.classList.toggle('passed', item.getBoundingClientRect().top < vh * 0.6);
      });
    });
  }

  // En móvil la barra se esconde al bajar y reaparece al subir
  const navWrap = document.querySelector('.nav-wrapper');
  const small = window.matchMedia('(max-width: 768px)');
  let lastY = window.scrollY;
  function toggleNav() {
    if (!navWrap) return;
    const y = window.scrollY;
    const down = y > lastY + 4;
    const up = y < lastY - 4;
    if (small.matches && down && y > 120) navWrap.classList.add('nav-hidden');
    else if (up || y <= 120 || !small.matches) navWrap.classList.remove('nav-hidden');
    if (down || up) lastY = y;
  }
  window.addEventListener('scroll', toggleNav, { passive: true });

  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
}
