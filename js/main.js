/* ============================================================
   个人主页 — 高级粒子系统 + 浮动光球 + 右滑动画
   零依赖，纯原生 JS
   ============================================================ */

(function () {
  'use strict';

  /* ==========================================================
     1. 高级粒子系统 (Canvas)
     ========================================================== */
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let mouseX = -1000, mouseY = -1000;
  let mouseActive = false;
  let animId;
  let time = 0;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  /* 粒子类 — 带颜色和发光 */
  class Particle {
    constructor(x, y) {
      this.x = x !== undefined ? x : Math.random() * canvas.width;
      this.y = y !== undefined ? y : Math.random() * canvas.height;
      this.baseSize = Math.random() * 2.8 + 1;
      this.size = this.baseSize;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.speedY = (Math.random() - 0.5) * 0.5;
      this.opacity = Math.random() * 0.6 + 0.2;
      this.opacitySpeed = (Math.random() - 0.5) * 0.006;

      // 每个粒子随机选一种颜色
      const colors = [
        { r: 168, g: 85, b: 247 },  // purple
        { r: 236, g: 72, b: 153 },  // pink
        { r: 6, g: 182, b: 212 },   // cyan
        { r: 245, g: 158, b: 11 },  // amber
        { r: 192, g: 132, b: 252 }, // light purple
      ];
      const c = colors[Math.floor(Math.random() * colors.length)];
      this.r = c.r; this.g = c.g; this.b = c.b;

      // 光晕参数
      this.glowPhase = Math.random() * Math.PI * 2;
      this.glowSpeed = 0.01 + Math.random() * 0.03;
    }

    update() {
      time += 0.001;
      this.x += this.speedX;
      this.y += this.speedY;
      this.opacity += this.opacitySpeed;

      if (this.opacity <= 0.08) { this.opacitySpeed = Math.abs(this.opacitySpeed); }
      if (this.opacity >= 0.7) { this.opacitySpeed = -Math.abs(this.opacitySpeed); }

      // 光晕脉动
      this.glowPhase += this.glowSpeed;
      this.size = this.baseSize + Math.sin(this.glowPhase) * 0.8;

      // 鼠标吸引（带力场）
      if (mouseActive) {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 200;
        if (dist < maxDist) {
          const force = (1 - dist / maxDist) * 0.04;
          this.x += dx * force;
          this.y += dy * force;
          // 靠近鼠标时更亮
          this.opacity = Math.min(0.8, this.opacity + 0.002);
        }
      }

      // 边界回环
      if (this.x < -20) this.x = canvas.width + 20;
      if (this.x > canvas.width + 20) this.x = -20;
      if (this.y < -20) this.y = canvas.height + 20;
      if (this.y > canvas.height + 20) this.y = -20;
    }

    draw() {
      ctx.save();
      // 外光晕
      const glowGrad = ctx.createRadialGradient(
        this.x, this.y, 0, this.x, this.y, this.size * 4
      );
      glowGrad.addColorStop(0, `rgba(${this.r},${this.g},${this.b},${this.opacity * 0.6})`);
      glowGrad.addColorStop(1, `rgba(${this.r},${this.g},${this.b},0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // 核心
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${this.opacity})`;
      ctx.fill();
      ctx.restore();
    }
  }

  /* 浮动光球 */
  const orbs = [];
  class FloatingOrb {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.radius = 40 + Math.random() * 80;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      const colors = [
        { r: 168, g: 85, b: 247 },
        { r: 236, g: 72, b: 153 },
        { r: 6, g: 182, b: 212 },
      ];
      const c = colors[Math.floor(Math.random() * colors.length)];
      this.r = c.r; this.g = c.g; this.b = c.b;
      this.phase = Math.random() * Math.PI * 2;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.phase += 0.005;
      if (this.x < -100) this.x = canvas.width + 100;
      if (this.x > canvas.width + 100) this.x = -100;
      if (this.y < -100) this.y = canvas.height + 100;
      if (this.y > canvas.height + 100) this.y = -100;
    }

    draw() {
      ctx.save();
      const pulse = 1 + Math.sin(this.phase) * 0.15;
      const r = this.radius * pulse;
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
      grad.addColorStop(0, `rgba(${this.r},${this.g},${this.b},0.06)`);
      grad.addColorStop(0.5, `rgba(${this.r},${this.g},${this.b},0.03)`);
      grad.addColorStop(1, `rgba(${this.r},${this.g},${this.b},0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }
  }

  function initParticles(count) {
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
    // 创建浮动光球
    orbs.length = 0;
    for (let i = 0; i < 4; i++) {
      orbs.push(new FloatingOrb());
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 浮动光球
    orbs.forEach(o => { o.update(); o.draw(); });

    // 粒子连线（带渐变颜色）
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const alpha = (1 - dist / 120) * 0.2;
          // 取两个粒子颜色的中间色
          const r = Math.floor((particles[i].r + particles[j].r) / 2);
          const g = Math.floor((particles[i].g + particles[j].g) / 2);
          const b = Math.floor((particles[i].b + particles[j].b) / 2);
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(animateParticles);
  }

  resizeCanvas();
  initParticles(Math.min(Math.floor(window.innerWidth / 8), 100));
  animateParticles();

  window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles(Math.min(Math.floor(window.innerWidth / 8), 100));
  });

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseActive = true;
  });
  document.addEventListener('mouseleave', () => { mouseActive = false; });

  /* ==========================================================
     2. 打字效果
     ========================================================== */
  const typingEl = document.getElementById('typing');
  const words = [
    '全栈开发者',
    'AI 工具链实践者',
    '开源爱好者',
    'Vibe Coder',
    '终身学习者'
  ];
  let wordIdx = 0, charIdx = 0, isDeleting = false;

  function typeEffect() {
    const current = words[wordIdx];
    const speed = isDeleting ? 38 : 95;
    const pauseEnd = 2200;
    const pauseStart = 400;

    if (!isDeleting && charIdx <= current.length) {
      typingEl.textContent = current.substring(0, charIdx);
      charIdx++;
    }
    if (isDeleting && charIdx >= 0) {
      typingEl.textContent = current.substring(0, charIdx);
      charIdx--;
    }

    let nextSpeed = speed;
    if (charIdx === current.length + 1) {
      nextSpeed = pauseEnd; isDeleting = true;
    }
    if (charIdx === -1) {
      isDeleting = false;
      wordIdx = (wordIdx + 1) % words.length;
      charIdx = 0; nextSpeed = pauseStart;
    }
    setTimeout(typeEffect, nextSpeed);
  }
  setTimeout(typeEffect, 600);

  /* ==========================================================
     3. 暗色/亮色主题切换
     ========================================================== */
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
  });

  function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }

  /* ==========================================================
     4. 导航栏效果
     ========================================================== */
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  const mobileMenu = document.getElementById('mobileMenu');
  const navContainer = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);

    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) current = s.getAttribute('id');
    });
    navLinks.forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === '#' + current);
    });
  });

  mobileMenu.addEventListener('click', () => {
    navContainer.classList.toggle('open');
  });
  navContainer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navContainer.classList.remove('open'));
  });

  /* ==========================================================
     5. 右滑入场动画 (Intersection Observer) + 延迟
     ========================================================== */
  function setupRevealAnimations() {
    // 卡片类：右滑入场 + 不同延迟
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach((card, i) => {
      card.classList.add('reveal');
      const groupEl = card.closest('.skills-categories, .projects-grid, .about-grid, .stats-grid, .contact-grid');
      if (groupEl) {
        const siblings = groupEl.querySelectorAll('.glass-card');
        const idx = Array.from(siblings).indexOf(card);
        if (idx > 0) card.classList.add('delay-' + Math.min(idx, 6));
      }
    });

    // Section header: 左滑入场（交替）
    document.querySelectorAll('.section-header').forEach(el => {
      el.classList.add('reveal-left');
    });

    // stat cards
    document.querySelectorAll('.stat-card').forEach(el => {
      el.classList.add('reveal');
    });
  }

  setupRevealAnimations();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal, .reveal-left').forEach(el => observer.observe(el));

  // Hero 立即显示
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    heroContent.classList.add('reveal', 'visible');
  }

  /* ==========================================================
     6. 数字滚动动画
     ========================================================== */
  const statNumbers = document.querySelectorAll('.stat-number');
  let statsAnimated = false;

  function animateStats() {
    if (statsAnimated) return;
    statsAnimated = true;

    statNumbers.forEach(el => {
      const target = parseInt(el.getAttribute('data-target'), 10);
      const duration = 2200;
      const startTime = performance.now();

      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutBack (bouncy!)
        const c1 = 1.70158;
        const c3 = c1 + 1;
        const eased = 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = target;
        }
      }
      requestAnimationFrame(update);
    });
  }

  const statsObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) { animateStats(); statsObserver.unobserve(entries[0].target); }
    },
    { threshold: 0.5 }
  );
  const statsSection = document.querySelector('.stats');
  if (statsSection) statsObserver.observe(statsSection);

  /* ==========================================================
     7. 项目筛选（带弹性动画）
     ========================================================== */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');

      projectCards.forEach((card, i) => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category.includes(filter)) {
          card.classList.remove('hidden');
          card.style.animation = 'none';
          card.offsetHeight; // trigger reflow
          card.style.animation = '';
          card.classList.remove('visible');
          setTimeout(() => card.classList.add('visible'), 50 + i * 60);
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  /* ==========================================================
     8. 联系表单 — FormSubmit.co 免费后端 (零注册)
     ========================================================== */
  const contactForm = document.getElementById('contactForm');
  const formMsg = document.getElementById('formMsg');

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
      formMsg.textContent = '请填写必填项（名字、邮箱、消息）';
      formMsg.className = 'form-msg error';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      formMsg.textContent = '请输入有效的邮箱地址';
      formMsg.className = 'form-msg error';
      return;
    }

    formMsg.textContent = '✨ 正在发送...';
    formMsg.className = 'form-msg';

    // FormSubmit.co — 完全免费，零注册
    // 首次使用会发一封确认邮件到 kuailj@163.com，点击确认后即可正常使用
    try {
      const res = await fetch('https://formsubmit.co/ajax/kuailj@163.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ name, email, subject, message })
      });

      if (res.ok) {
        contactForm.reset();
        formMsg.textContent = '✅ 消息已发送！感谢联系~';
        formMsg.className = 'form-msg success';
      } else {
        throw new Error('API error');
      }
    } catch (err) {
      // 降级方案：直接打开邮件客户端
      const body = `名字: ${name}\n邮箱: ${email}\n\n${message}`;
      const mailto = `mailto:kuailj@163.com?subject=${encodeURIComponent(
        subject || '来自个人主页的联系'
      )}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      contactForm.reset();
      formMsg.textContent = '📧 已打开邮件客户端（网络原因云端未响应）';
      formMsg.className = 'form-msg';
    }
  });

  /* ==========================================================
     9. 键盘快捷键
     ========================================================== */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') navContainer.classList.remove('open');
  });

  console.log('✨ 个人主页 v2 — 高级粒子 · 浮动光球 · 卡通玻璃 · 右滑动画');
  console.log('🔗 部署地址: https://kuailj1117-eng.github.io/personal-homepage/');
})();
