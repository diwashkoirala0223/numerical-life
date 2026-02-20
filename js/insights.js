/* ═══════════════════════════════════════════════════════════
   Insights — Animated Charts, Counters, Scroll Reveal
   ═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ── Utility ────────────────────────────────────────────────
    function fmt(n) {
        if (Math.abs(n) >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
        return '$' + Math.round(n).toLocaleString();
    }

    // ── Animated Counters ──────────────────────────────────────
    function animateCounter(el) {
        const target = parseFloat(el.dataset.count);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const duration = 2200;
        const start = performance.now();
        function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 4);
            const v = target * eased;
            if (target >= 1000) {
                el.textContent = prefix + Math.round(v).toLocaleString() + suffix;
            } else {
                el.textContent = prefix + Math.round(v) + suffix;
            }
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // ── Canvas Helpers ─────────────────────────────────────────
    function setupCanvas(canvas, h) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = h * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = h + 'px';
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { ctx, w: rect.width, h };
    }

    function animatedLineChart(canvasId, data, color, glowColor, label) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        function draw() {
            const { ctx, w, h } = setupCanvas(canvas, 220);
            const pad = { l: 55, r: 15, t: 15, b: 30 };
            const gw = w - pad.l - pad.r, gh = h - pad.t - pad.b;
            const maxV = Math.max(...data) * 1.1;
            const minV = Math.min(0, Math.min(...data));
            const range = maxV - minV;

            let progress = 0;
            function frame() {
                progress += 0.03;
                if (progress > 1) progress = 1;
                ctx.clearRect(0, 0, w, h);

                // Grid
                ctx.strokeStyle = 'rgba(255,255,255,0.04)';
                ctx.lineWidth = 1;
                for (let i = 0; i <= 3; i++) {
                    const y = pad.t + (gh / 3) * i;
                    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + gw, y); ctx.stroke();
                }

                // Y labels
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.font = '10px Inter, sans-serif';
                ctx.textAlign = 'right';
                for (let i = 0; i <= 3; i++) {
                    const y = pad.t + (gh / 3) * i;
                    const val = maxV - (range / 3) * i;
                    ctx.fillText(fmt(val), pad.l - 6, y + 3);
                }

                // X labels
                ctx.textAlign = 'center';
                for (let i = 0; i < data.length; i += 2) {
                    ctx.fillText('Y' + i, pad.l + (gw / (data.length - 1)) * i, h - 8);
                }

                // Line
                const count = Math.ceil(data.length * progress);
                ctx.save();
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = 10;
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.beginPath();
                for (let i = 0; i < count; i++) {
                    const x = pad.l + (gw / (data.length - 1)) * i;
                    const y = pad.t + gh - ((data[i] - minV) / range) * gh;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();

                // Area
                ctx.shadowBlur = 0;
                const li = count - 1;
                ctx.lineTo(pad.l + (gw / (data.length - 1)) * li, pad.t + gh);
                ctx.lineTo(pad.l, pad.t + gh);
                ctx.closePath();
                const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + gh);
                grad.addColorStop(0, glowColor);
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.restore();

                if (progress < 1) requestAnimationFrame(frame);
            }
            frame();
        }

        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) { draw(); obs.disconnect(); }
        }, { threshold: 0.3 });
        obs.observe(canvas);
    }

    // ── Generate Data ──────────────────────────────────────────

    // Opportunity cost: $12/day invested at 8%
    const oppData = [];
    let oppTotal = 0;
    for (let y = 0; y <= 10; y++) {
        if (y > 0) {
            oppTotal += 12 * 365;
            oppTotal *= 1.08;
        }
        oppData.push(oppTotal);
    }

    // Debt snowball: $30k at 7%, minimum payments
    const debtData = [];
    let debtBal = 30000;
    for (let y = 0; y <= 10; y++) {
        debtData.push(debtBal);
        const interest = debtBal * 0.07;
        const minPay = Math.max(debtBal * 0.02, 300);
        debtBal = Math.max(0, debtBal + interest - minPay);
    }

    // Inflation: purchasing power of $100
    const inflData = [];
    let purchase = 100;
    for (let y = 0; y <= 10; y++) {
        inflData.push(purchase);
        purchase *= (1 - 0.03);
    }

    // Draw insight cards
    animatedLineChart('opp-chart', oppData, '#fbbf24', 'rgba(251,191,36,0.15)', 'Invested');
    animatedLineChart('debt-chart', debtData, '#f87171', 'rgba(248,113,113,0.15)', 'Debt');
    animatedLineChart('inflation-chart', inflData, '#60a5fa', 'rgba(96,165,250,0.12)', 'Value');

    // ── Combined Chart ─────────────────────────────────────────
    function drawCombined() {
        const canvas = document.getElementById('combined-chart');
        if (!canvas) return;

        function draw() {
            const { ctx, w, h } = setupCanvas(canvas, 350);
            const pad = { l: 75, r: 30, t: 25, b: 50 };
            const gw = w - pad.l - pad.r, gh = h - pad.t - pad.b;
            const allVals = [...oppData, ...debtData, ...inflData.map(v => v * 1000)];
            const maxV = Math.max(...allVals) * 1.1;

            let progress = 0;
            function frame() {
                progress += 0.018;
                if (progress > 1) progress = 1;
                ctx.clearRect(0, 0, w, h);

                // Grid
                ctx.strokeStyle = 'rgba(255,255,255,0.04)';
                ctx.lineWidth = 1;
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.font = '11px Inter, sans-serif';
                ctx.textAlign = 'right';
                for (let i = 0; i <= 5; i++) {
                    const y = pad.t + (gh / 5) * i;
                    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + gw, y); ctx.stroke();
                    ctx.fillText(fmt(maxV * (1 - i / 5)), pad.l - 10, y + 4);
                }
                ctx.textAlign = 'center';
                for (let i = 0; i <= 10; i++) {
                    ctx.fillText('Y' + i, pad.l + (gw / 10) * i, h - 15);
                }

                function drawSeries(data, color, glow) {
                    const count = Math.ceil(data.length * progress);
                    ctx.save();
                    ctx.shadowColor = glow;
                    ctx.shadowBlur = 12;
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2.5;
                    ctx.lineJoin = 'round';
                    ctx.beginPath();
                    for (let i = 0; i < count; i++) {
                        const x = pad.l + (gw / 10) * i;
                        const y = pad.t + gh - (data[i] / maxV) * gh;
                        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                    const li = count - 1;
                    ctx.lineTo(pad.l + (gw / 10) * li, pad.t + gh);
                    ctx.lineTo(pad.l, pad.t + gh);
                    ctx.closePath();
                    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + gh);
                    grad.addColorStop(0, glow);
                    grad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = grad;
                    ctx.fill();
                    ctx.restore();
                }

                // Scale inflation to make it visible
                const inflScaled = inflData.map(v => v * (maxV / 150));
                drawSeries(inflScaled, '#60a5fa', 'rgba(96,165,250,0.1)');
                drawSeries(debtData, '#f87171', 'rgba(248,113,113,0.12)');
                drawSeries(oppData, '#10b981', 'rgba(16,185,129,0.15)');

                if (progress < 1) requestAnimationFrame(frame);
            }
            frame();
        }

        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) { draw(); obs.disconnect(); }
        }, { threshold: 0.2 });
        obs.observe(canvas);
    }
    drawCombined();

    // ── Counter Observers ──────────────────────────────────────
    ['oppCostNum', 'debtSnowNum', 'inflationNum'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) { animateCounter(el); obs.disconnect(); }
        }, { threshold: 0.5 });
        obs.observe(el);
    });

    // ── Scroll Reveal ──────────────────────────────────────────
    document.querySelectorAll('.reveal').forEach(el => {
        new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) el.classList.add('visible');
        }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }).observe(el);
    });

    // ── Mobile menu ────────────────────────────────────────────
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');
    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            const isOpen = navLinks.style.display === 'flex';
            navLinks.style.display = isOpen ? 'none' : 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '100%';
            navLinks.style.left = '0';
            navLinks.style.right = '0';
            navLinks.style.background = 'rgba(10,14,26,0.95)';
            navLinks.style.backdropFilter = 'blur(20px)';
            navLinks.style.padding = '1rem';
        });
    }

    // Resize
    window.addEventListener('resize', () => {
        animatedLineChart('opp-chart', oppData, '#fbbf24', 'rgba(251,191,36,0.15)');
        animatedLineChart('debt-chart', debtData, '#f87171', 'rgba(248,113,113,0.15)');
        animatedLineChart('inflation-chart', inflData, '#60a5fa', 'rgba(96,165,250,0.12)');
        drawCombined();
    });
})();
