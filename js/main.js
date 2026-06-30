/* ============================================================
   个人主页 — 粒子背景 + 打字效果 + 交互逻辑
   零依赖，纯原生 JS
   ============================================================ */

(function () {
  'use strict';

  /* ==========================================================
     1. 粒子背景 (Canvas)
     ========================================================== */
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let mouseX = -1000, mouseY = -1000;
  let animId;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2.5 + 0.8;
      this.speedX = (Math.random() - 0.5) * 0.6;
      this.speedY = (Math.random() - 0.5) * 0.6;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.opacitySpeed = (Math.random() - 0.5) * 0.008;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.opacity += this.opacitySpeed;

      if (this.opacity <= 0.05 || this.opacity >= 0.6) {
        this.opacitySpeed *= -1;
      }

      // 鼠标吸引
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const force = (150 - dist) / 150 * 0.03;
        this.x += dx * force;
        this.y += dy * force;
      }

      // 边界回环
      if (this.x < -10) this.x = canvas.width + 10;
      if (this.x > canvas.width + 10) this.x = -10;
      if (this.y < -10) this.y = canvas.height + 10;
      if (this.y > canvas.height + 10) this.y = -10;
    }

    draw() {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const r = isLight ? 108 : 162;
      const g = isLight ? 92 : 155;
      const b = isLight ? 231 : 254;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${this.opacity})`;
      ctx.fill();
    }
  }

  function initParticles(count) {
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 连线
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const isLight = document.documentElement.getAttribute('data-theme') === 'light';
          const alpha = (1 - dist / 100) * 0.12;
          const r = isLight ? 108 : 162;
          const g = isLight ? 92 : 155;
          const b = isLight ? 231 : 254;
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.lineWidth = 0.5;
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
  initParticles(Math.min(Math.floor(window.innerWidth / 10), 90));
  animateParticles();

  window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles(Math.min(Math.floor(window.innerWidth / 10), 90));
  });

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

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
    const speed = isDeleting ? 40 : 100;
    const pauseEnd = 2000;
    const pauseStart = 500;

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
      nextSpeed = pauseEnd;
      isDeleting = true;
    }

    if (charIdx === -1) {
      isDeleting = false;
      wordIdx = (wordIdx + 1) % words.length;
      charIdx = 0;
      nextSpeed = pauseStart;
    }

    setTimeout(typeEffect, nextSpeed);
  }

  setTimeout(typeEffect, 500);

  /* ==========================================================
     3. 暗色/亮色模式切换
     ========================================================== */
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;

  // 读取保存的主题
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
     4. 导航栏滚动效果
     ========================================================== */
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    // 导航栏阴影
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // 活动导航链接
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 100;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  });

  /* ==========================================================
     5. 移动端菜单
     ========================================================== */
  const mobileMenu = document.getElementById('mobileMenu');
  const navLinksContainer = document.querySelector('.nav-links');

  mobileMenu.addEventListener('click', () => {
    navLinksContainer.classList.toggle('open');
  });

  // 点击链接关闭菜单
  navLinksContainer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinksContainer.classList.remove('open');
    });
  });

  /* ==========================================================
     6. 滚动渐入动画 (Intersection Observer)
     ========================================================== */
  const revealElements = document.querySelectorAll(
    '.glass-card, .section-header, .hero-content, .stat-card'
  );

  revealElements.forEach(el => {
    el.classList.add('reveal');
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
  );

  revealElements.forEach(el => observer.observe(el));

  // Hero 立即显示
  document.querySelector('.hero-content').classList.add('visible');

  /* ==========================================================
     7. 数字滚动动画
     ========================================================== */
  const statNumbers = document.querySelectorAll('.stat-number');

  function animateStats() {
    statNumbers.forEach(el => {
      const target = parseInt(el.getAttribute('data-target'), 10);
      const duration = 2000;
      const startTime = performance.now();

      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutExpo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
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
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateStats();
          statsObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  const statsSection = document.querySelector('.stats');
  if (statsSection) statsObserver.observe(statsSection);

  /* ==========================================================
     8. 项目筛选
     ========================================================== */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category.includes(filter)) {
          card.classList.remove('hidden');
          // 重新触发动画
          card.classList.remove('visible');
          setTimeout(() => card.classList.add('visible'), 50);
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  /* ==========================================================
     9. 联系表单
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

    // 使用 Formspree 或邮件客户端
    const mailtoLink = `mailto:kuailj@163.com?subject=${encodeURIComponent(
      subject || '来自个人主页的联系'
    )}&body=${encodeURIComponent(
      `名字: ${name}\n邮箱: ${email}\n\n${message}`
    )}`;

    formMsg.textContent = '正在打开邮件客户端...';
    formMsg.className = 'form-msg success';

    window.location.href = mailtoLink;

    setTimeout(() => {
      contactForm.reset();
      formMsg.textContent = '消息已发送，感谢联系！';
    }, 1000);
  });

  /* ==========================================================
     10. 键盘快捷键
     ========================================================== */
  document.addEventListener('keydown', (e) => {
    // Ctrl+K 或 / 聚焦搜索（如果将来添加）
    // Esc 关闭菜单
    if (e.key === 'Escape') {
      navLinksContainer.classList.remove('open');
    }
  });

  console.log('✨ 个人主页已就绪 — 粒子背景 · 打字效果 · 暗色模式 · 滚动动画');
  console.log('🏠 本地预览: 右键 index.html → Open with Live Server');
})();
