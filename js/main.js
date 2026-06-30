/* ============================================================
   Personal Homepage — taste-skill MOTION_INTENSITY: 7
   IntersectionObserver + magnetic hover + advanced particles
   Zero window.addEventListener('scroll')
   ============================================================ */

(function () {
  'use strict';

  /* ==========================================================
     1. Advanced Particle System
     ========================================================== */
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let particles = [];
  let mouseX = -500, mouseY = -500;
  let mouseActive = false;
  let animId;
  let particleCount;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial) {
      this.x = initial ? Math.random() * canvas.width : (Math.random() < 0.5 ? -20 : canvas.width + 20);
      this.y = initial ? Math.random() * canvas.height : Math.random() * canvas.height;
      this.baseR = 0.8 + Math.random() * 2.2;
      this.r = this.baseR;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = (Math.random() - 0.5) * 0.35;
      this.alpha = 0.15 + Math.random() * 0.45;
      this.alphaDir = Math.random() < 0.5 ? 0.003 : -0.003;
      this.glowPhase = Math.random() * Math.PI * 2;
      this.glowSpeed = 0.02 + Math.random() * 0.04;

      const palettes = [
        [168, 85, 247], [192, 132, 252], [236, 72, 153],
        [244, 114, 182], [6, 182, 212], [129, 230, 217]
      ];
      const c = palettes[Math.floor(Math.random() * palettes.length)];
      this.cr = c[0]; this.cg = c[1]; this.cb = c[2];
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha += this.alphaDir;
      this.glowPhase += this.glowSpeed;
      this.r = this.baseR + Math.sin(this.glowPhase) * 0.5;

      if (this.alpha <= 0.08) this.alphaDir = Math.abs(this.alphaDir);
      if (this.alpha >= 0.55) this.alphaDir = -Math.abs(this.alphaDir);

      if (mouseActive) {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 180) {
          const f = (1 - d / 180) * 0.035;
          this.x += dx * f;
          this.y += dy * f;
          this.alpha = Math.min(0.7, this.alpha + 0.001);
        }
      }

      if (this.x < -30 || this.x > canvas.width + 30 ||
          this.y < -30 || this.y > canvas.height + 30) {
        this.reset(false);
      }
    }

    draw() {
      ctx.save();
      // Outer glow
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 3.5);
      grad.addColorStop(0, `rgba(${this.cr},${this.cg},${this.cb},${this.alpha * 0.5})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      // Core
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${this.alpha})`;
      ctx.fill();
      ctx.restore();
    }
  }

  function initParticles() {
    particleCount = Math.min(Math.floor(window.innerWidth / 7), 110);
    particles = [];
    for (let i = 0; i < particleCount; i++) particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Inter-particle connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 110) {
          const a = (1 - d / 110) * 0.15;
          const mr = Math.floor((particles[i].cr + particles[j].cr) / 2);
          const mg = Math.floor((particles[i].cg + particles[j].cg) / 2);
          const mb = Math.floor((particles[i].cb + particles[j].cb) / 2);
          ctx.strokeStyle = `rgba(${mr},${mg},${mb},${a})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(animate);
  }

  if (!prefersReduced) {
    resize();
    initParticles();
    animate();

    window.addEventListener('resize', () => {
      resize();
      initParticles();
    });
  }

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    mouseActive = true;
  });
  document.addEventListener('mouseleave', () => { mouseActive = false; });

  /* ==========================================================
     2. Theme toggle
     ========================================================== */
  const html = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
  });

  function updateThemeIcon(t) {
    themeToggle.querySelector('i').className = t === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }

  /* ==========================================================
     3. Navigation — IntersectionObserver for active link
     ========================================================== */
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const mobileMenu = document.getElementById('mobileMenu');
  const navContainer = document.querySelector('.nav-links');
  const sections = document.querySelectorAll('section[id]');

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navbar.classList.toggle('scrolled', entry.target.id !== 'hero');
          navLinks.forEach(l => {
            l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id);
          });
        }
      });
    },
    { rootMargin: '-20% 0px -75% 0px', threshold: 0 }
  );
  sections.forEach(s => navObserver.observe(s));

  mobileMenu.addEventListener('click', () => navContainer.classList.toggle('open'));
  navContainer.querySelectorAll('a').forEach(l => {
    l.addEventListener('click', () => navContainer.classList.remove('open'));
  });

  /* ==========================================================
     4. Scroll reveal — IntersectionObserver + right-slide
     ========================================================== */
  if (!prefersReduced) {
    function setupReveal() {
      document.querySelectorAll('.glass-card, .hero-text, .section-headline, .section-sub, .stats-strip').forEach(el => {
        el.classList.add('reveal');
      });
      document.querySelectorAll('.section-headline, .section-sub').forEach(el => {
        el.classList.add('reveal-left');
      });
      // Stagger within groups
      document.querySelectorAll('.work-grid .work-card').forEach((el, i) => {
        el.classList.add('stagger-' + Math.min(i + 1, 5));
      });
      document.querySelectorAll('.projects-bento .project-tile').forEach((el, i) => {
        el.classList.add('stagger-' + Math.min(i + 1, 5));
      });
    }
    setupReveal();

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
      },
      { threshold: 0.10, rootMargin: '0px 0px -30px 0px' }
    );

    document.querySelectorAll('.reveal, .reveal-left').forEach(el => revealObserver.observe(el));
    // Hero visible immediately
    const heroText = document.querySelector('.hero-text');
    if (heroText) { heroText.classList.add('visible'); }
  }

  /* ==========================================================
     5. Magnetic hover on buttons (MOTION_INTENSITY 7)
     ========================================================== */
  if (!prefersReduced) {
    document.querySelectorAll('.btn-primary, .btn-ghost, .social-link, .craft-chip').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });
      btn.addEventListener('mouseleave', (e) => {
        btn.style.transform = '';
      });
    });
  }

  /* ==========================================================
     6. Stats counter animation
     ========================================================== */
  let statsDone = false;
  const statNums = document.querySelectorAll('.stat-num');
  const statsObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !statsDone) {
        statsDone = true;
        statNums.forEach(el => {
          const target = parseInt(el.getAttribute('data-target'), 10);
          const dur = 2000;
          const start = performance.now();

          function update(now) {
            const p = Math.min((now - start) / dur, 1);
            // easeOutBack
            const c1 = 1.70158;
            const eased = 1 + (c1 + 1) * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
            el.textContent = Math.round(eased * target);
            if (p < 1) requestAnimationFrame(update);
            else el.textContent = target;
          }
          requestAnimationFrame(update);
        });
        statsObserver.unobserve(entries[0].target);
      }
    },
    { threshold: 0.5 }
  );
  if (statNums.length) statsObserver.observe(document.querySelector('.stats-strip'));

  /* ==========================================================
     7. Contact form (FormSubmit.co + mailto fallback)
     ========================================================== */
  const form = document.getElementById('contactForm');
  const formMsg = document.getElementById('formMsg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
      formMsg.textContent = 'Please fill in name, email, and message.';
      formMsg.className = 'form-msg error'; return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      formMsg.textContent = 'Please enter a valid email address.';
      formMsg.className = 'form-msg error'; return;
    }

    formMsg.textContent = 'Sending...'; formMsg.className = 'form-msg';

    try {
      const res = await fetch('https://formsubmit.co/ajax/kuailj@163.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      });
      if (res.ok) {
        form.reset();
        formMsg.textContent = 'Message sent. Thanks!';
        formMsg.className = 'form-msg success';
      } else { throw new Error(); }
    } catch {
      const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
      window.location.href = `mailto:kuailj@163.com?subject=${encodeURIComponent(subject || 'Portfolio contact')}&body=${encodeURIComponent(body)}`;
      form.reset();
      formMsg.textContent = 'Opening email client...';
      formMsg.className = 'form-msg';
    }
  });

  /* ==========================================================
     8. Pause marquee on hover
     ========================================================== */
  document.querySelectorAll('.craft-track').forEach(track => {
    track.addEventListener('mouseenter', () => { track.style.animationPlayState = 'paused'; });
    track.addEventListener('mouseleave', () => { track.style.animationPlayState = 'running'; });
  });

  console.log('%cPortfolio v3%c taste-skill redesign %cDESIGN_VARIANCE:8 MOTION:7 DENSITY:3',
    'font-weight:bold;color:#a855f7', '', 'color:#888');
  console.log('%chttps://kuailj1117-eng.github.io/personal-homepage/', 'color:#a855f7');
})();
