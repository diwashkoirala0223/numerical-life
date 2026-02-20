/* ═══════════════════════════════════════════════════════════
   Landing Page — Particles, Animated Line, Counters, Scroll Reveal
   ═══════════════════════════════════════════════════════════ */

// ── Particle Canvas ──────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.r = Math.random() * 1.5 + 0.5;
      this.alpha = Math.random() * 0.3 + 0.05;
      this.color = Math.random() > 0.5
        ? `rgba(16, 185, 129, ${this.alpha})`
        : `rgba(59, 130, 246, ${this.alpha})`;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > w) this.vx *= -1;
      if (this.y < 0 || this.y > h) this.vy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  const count = Math.min(Math.floor(w * h / 8000), 120);
  for (let i = 0; i < count; i++) particles.push(new Particle());

  function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(59, 130, 246, ${0.04 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => { p.update(); p.draw(); });
    connectParticles();
    requestAnimationFrame(loop);
  }
  loop();
})();

// ── Hero SVG Line Animation ─────────────────────────────────
(function animateHeroLine() {
  const path = document.getElementById('hero-path');
  const area = document.getElementById('hero-area');
  if (!path) return;

  // Generate wealth growth curve points
  const points = [];
  const steps = 50;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 850;
    const progress = i / steps;
    // Exponential growth curve with some noise
    const base = 250 - (progress * progress * 200);
    const noise = Math.sin(progress * 12) * 8 + Math.sin(progress * 5) * 5;
    const y = Math.max(20, Math.min(260, base + noise));
    points.push({ x, y });
  }

  // Build SVG path
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) / 3;
    const cp1y = points[i - 1].y;
    const cp2x = points[i].x - (points[i].x - points[i - 1].x) / 3;
    const cp2y = points[i].y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
  }

  path.setAttribute('d', d);

  // Area path
  const areaD = d + ` L 850 280 L 0 280 Z`;
  area.setAttribute('d', areaD);

  // Animate line drawing
  const length = path.getTotalLength();
  path.style.strokeDasharray = length;
  path.style.strokeDashoffset = length;

  setTimeout(() => {
    path.style.transition = 'stroke-dashoffset 2.5s cubic-bezier(0.16, 1, 0.3, 1)';
    path.style.strokeDashoffset = '0';

    // Fade in area
    setTimeout(() => {
      area.style.transition = 'opacity 1s ease';
      area.style.opacity = '0.6';
    }, 1200);
  }, 800);
})();

// ── Demo Chart ──────────────────────────────────────────────
(function initDemoChart() {
  const canvas = document.getElementById('demo-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 350 * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '350px';
    ctx.scale(dpr, dpr);
  }
  resize();

  const w = () => canvas.width / dpr;
  const h = () => canvas.height / dpr;

  // Generate data
  const years = 10;
  const smartData = [];
  const impulsiveData = [];
  let smartVal = 20000, impVal = 20000;

  for (let i = 0; i <= years; i++) {
    smartData.push(smartVal);
    impulsiveData.push(impVal);
    smartVal *= 1.12 + Math.random() * 0.03;
    impVal *= 1.02 + Math.random() * 0.02;
  }

  let animProgress = 0;
  let started = false;

  function drawGrid() {
    const cw = w(), ch = h();
    const padL = 70, padR = 30, padT = 30, padB = 50;
    const gw = cw - padL - padR;
    const gh = ch - padT - padB;

    // Horizontal grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (gh / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + gw, y);
      ctx.stroke();
    }

    // Year labels
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= years; i++) {
      const x = padL + (gw / years) * i;
      ctx.fillText(`Y${i}`, x, ch - 15);
    }

    // Value labels
    const maxVal = Math.max(...smartData);
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padT + (gh / 4) * i;
      const val = maxVal * (1 - i / 4);
      ctx.fillText('$' + Math.round(val / 1000) + 'k', padL - 10, y + 4);
    }

    return { padL, padR, padT, padB, gw, gh, maxVal };
  }

  function drawLine(data, color, glowColor, progress, dims) {
    const { padL, padT, gw, gh, maxVal } = dims;
    const drawCount = Math.floor(data.length * progress);
    if (drawCount < 2) return;

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();

    for (let i = 0; i < drawCount; i++) {
      const x = padL + (gw / years) * i;
      const y = padT + gh - (data[i] / maxVal) * gh;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Area fill
    ctx.shadowBlur = 0;
    const gradient = ctx.createLinearGradient(0, padT, 0, padT + gh);
    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.lineTo(padL + (gw / years) * (drawCount - 1), padT + gh);
    ctx.lineTo(padL, padT + gh);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function render() {
    const cw = w(), ch = h();
    ctx.clearRect(0, 0, cw, ch);
    const dims = drawGrid();

    drawLine(smartData, '#10b981', 'rgba(16,185,129,0.2)', animProgress, dims);
    drawLine(impulsiveData, '#f87171', 'rgba(248,113,113,0.15)', animProgress, dims);

    // Legend
    ctx.font = '600 13px Inter, sans-serif';
    
    ctx.fillStyle = '#10b981';
    ctx.fillRect(cw - 200, 15, 12, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'left';
    ctx.fillText('Smart You', cw - 182, 25);

    ctx.fillStyle = '#f87171';
    ctx.fillRect(cw - 200, 35, 12, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Impulsive You', cw - 182, 45);

    if (animProgress < 1 && started) {
      animProgress += 0.012;
      requestAnimationFrame(render);
    }
  }

  // Start animation when in view
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !started) {
      started = true;
      render();
    }
  }, { threshold: 0.3 });
  observer.observe(canvas);

  // Initial static render
  render();

  window.addEventListener('resize', () => {
    resize();
    render();
  });
})();

// ── Navbar Scroll Effect ────────────────────────────────────
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
  });
})();

// ── Scroll Reveal ───────────────────────────────────────────
(function initReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => observer.observe(el));
})();

// ── Counter Animation ───────────────────────────────────────
(function initCounters() {
  const counters = document.querySelectorAll('.counter');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => observer.observe(el));

  function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = target * eased;

      if (target >= 1000000) {
        el.textContent = prefix + (current / 1000000).toFixed(1) + 'M' + suffix;
      } else if (target >= 1000) {
        el.textContent = prefix + Math.round(current).toLocaleString() + suffix;
      } else if (target < 10) {
        el.textContent = prefix + current.toFixed(1) + suffix;
      } else {
        el.textContent = prefix + Math.round(current) + suffix;
      }

      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();

// ── Mobile Menu ─────────────────────────────────────────────
(function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const links = document.querySelector('.nav-links');
  if (!btn || !links) return;

  btn.addEventListener('click', () => {
    const isOpen = links.style.display === 'flex';
    links.style.display = isOpen ? 'none' : 'flex';
    links.style.flexDirection = 'column';
    links.style.position = 'absolute';
    links.style.top = '100%';
    links.style.left = '0';
    links.style.right = '0';
    links.style.background = 'rgba(10,14,26,0.95)';
    links.style.backdropFilter = 'blur(20px)';
    links.style.padding = '1rem';
    links.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
  });
})();
