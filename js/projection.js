/* ═══════════════════════════════════════════════════════════
   Projection — Smart vs Impulsive Comparison Engine
   ═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ── Scenarios ──────────────────────────────────────────────

    // Load data saved from dashboard.html (if available)
    let dashData = null;
    try {
        const raw = localStorage.getItem('lin_dashboard');
        if (raw) dashData = JSON.parse(raw);
    } catch (e) { /* storage unavailable */ }

    // Use dashboard inputs for the "smart" (user) scenario when available,
    // otherwise fall back to the original hardcoded defaults.
    const income = dashData ? dashData.income : 70000;

    const smart = dashData ? {
        savingsRate: dashData.savingsRate,
        lifestyle: dashData.lifestyle,
        loan: dashData.loan,
        returnRate: dashData.returns,
        loanRate: 0.05,
        loanPayRate: 0.15
    } : {
        savingsRate: 0.25,
        lifestyle: 1800,
        loan: 10000,
        returnRate: 0.08,
        loanRate: 0.05,
        loanPayRate: 0.15
    };

    const impulsive = {
        savingsRate: 0.05,
        lifestyle: 4500,
        loan: 50000,
        returnRate: 0.04,
        loanRate: 0.08,
        loanPayRate: 0.06
    };

    function simulate(scenario, years) {
        const data = { netWorth: [], savings: [], debt: [] };
        let saved = 0, debt = scenario.loan;

        for (let y = 0; y <= years; y++) {
            if (y > 0) {
                const annualSave = income * scenario.savingsRate;
                const growth = saved * scenario.returnRate;
                saved += annualSave + growth;
                const interest = debt * scenario.loanRate;
                const pay = Math.min(scenario.loan * scenario.loanPayRate, debt + interest);
                debt = Math.max(0, debt + interest - pay);
            }
            data.netWorth.push(saved - debt);
            data.savings.push(saved);
            data.debt.push(debt);
        }
        return data;
    }

    const smartData = simulate(smart, 10);
    const impData = simulate(impulsive, 10);

    // ── Utility ────────────────────────────────────────────────
    function fmt(n) {
        if (Math.abs(n) >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
        return '$' + Math.round(n).toLocaleString();
    }

    // ── Populate Stats ─────────────────────────────────────────
    function animateValue(el, target, duration) {
        const start = performance.now();
        const isNeg = target < 0;
        function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 4);
            el.textContent = fmt(target * eased);
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    const last = 10;
    setTimeout(() => {
        animateValue(document.getElementById('smartNetWorth'), smartData.netWorth[last], 2000);
        animateValue(document.getElementById('smartSaved'), smartData.savings[last], 2000);
        animateValue(document.getElementById('smartDebt'), smartData.debt[last], 2000);
        animateValue(document.getElementById('smartFreedom'), (smartData.savings[last] * smart.returnRate) / 12, 2000);

        animateValue(document.getElementById('impNetWorth'), impData.netWorth[last], 2000);
        animateValue(document.getElementById('impSaved'), impData.savings[last], 2000);
        animateValue(document.getElementById('impDebt'), impData.debt[last], 2000);
        animateValue(document.getElementById('impFreedom'), (impData.savings[last] * impulsive.returnRate) / 12, 2000);
    }, 600);

    // ── Draw Mini Charts ───────────────────────────────────────
    function drawMiniChart(canvasId, data, color, glowColor) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 200 * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = '200px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const cw = rect.width, ch = 200;
        const pad = { l: 10, r: 10, t: 15, b: 15 };
        const gw = cw - pad.l - pad.r, gh = ch - pad.t - pad.b;
        const maxV = Math.max(...data) * 1.1 || 1;
        const minV = Math.min(0, Math.min(...data));
        const range = maxV - minV;

        let progress = 0;
        function frame() {
            progress += 0.03;
            if (progress > 1) progress = 1;
            ctx.clearRect(0, 0, cw, ch);

            const count = Math.ceil(data.length * progress);
            ctx.save();
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
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

        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) { frame(); obs.disconnect(); }
        }, { threshold: 0.3 });
        obs.observe(canvas);
    }

    drawMiniChart('smart-chart', smartData.netWorth, '#10b981', 'rgba(16,185,129,0.2)');
    drawMiniChart('impulsive-chart', impData.netWorth, '#f87171', 'rgba(248,113,113,0.15)');

    // ── Comparison Chart ───────────────────────────────────────
    function drawComparison() {
        const canvas = document.getElementById('comparison-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 400 * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = '400px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const cw = rect.width, ch = 400;
        const pad = { l: 80, r: 30, t: 25, b: 50 };
        const gw = cw - pad.l - pad.r, gh = ch - pad.t - pad.b;
        const all = [...smartData.netWorth, ...impData.netWorth];
        const maxV = Math.max(...all) * 1.15;
        const minV = Math.min(0, Math.min(...all)) * 1.1;
        const range = maxV - minV;

        let progress = 0;
        function frame() {
            progress += 0.02;
            if (progress > 1) progress = 1;
            ctx.clearRect(0, 0, cw, ch);

            // Grid
            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.lineWidth = 1;
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'right';
            for (let i = 0; i <= 5; i++) {
                const y = pad.t + (gh / 5) * i;
                ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + gw, y); ctx.stroke();
                const val = maxV - (range / 5) * i;
                ctx.fillText(fmt(val), pad.l - 10, y + 4);
            }
            ctx.textAlign = 'center';
            for (let i = 0; i <= 10; i++) {
                ctx.fillText('Y' + i, pad.l + (gw / 10) * i, ch - 15);
            }

            function drawLine(data, color, glow) {
                const count = Math.ceil(data.length * progress);
                ctx.save();
                ctx.shadowColor = glow;
                ctx.shadowBlur = 14;
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.lineJoin = 'round';
                ctx.beginPath();
                for (let i = 0; i < count; i++) {
                    const x = pad.l + (gw / 10) * i;
                    const y = pad.t + gh - ((data[i] - minV) / range) * gh;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();

                // Area
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

            drawLine(impData.netWorth, '#f87171', 'rgba(248,113,113,0.12)');
            drawLine(smartData.netWorth, '#10b981', 'rgba(16,185,129,0.18)');

            // Difference annotation at end
            if (progress >= 1) {
                const sx = pad.l + gw;
                const sy = pad.t + gh - ((smartData.netWorth[10] - minV) / range) * gh;
                const iy = pad.t + gh - ((impData.netWorth[10] - minV) / range) * gh;
                ctx.setLineDash([3, 3]);
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(sx - 5, sy); ctx.lineTo(sx - 5, iy); ctx.stroke();
                ctx.setLineDash([]);

                const diff = smartData.netWorth[10] - impData.netWorth[10];
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.font = '600 12px Inter, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Δ ' + fmt(diff), sx + 5, (sy + iy) / 2 + 4);
            }

            if (progress < 1) requestAnimationFrame(frame);
        }

        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) { frame(); obs.disconnect(); }
        }, { threshold: 0.2 });
        obs.observe(canvas);
    }
    drawComparison();

    // ── Health Gauge ───────────────────────────────────────────
    function calcStressScore(d) {
        // Mirrors the logic in dashboard.js calcStress()
        let s = 100;
        const debtRatio = d.loan / Math.max(d.income, 1);
        if (debtRatio > 0.6) s -= 30; else if (debtRatio > 0.4) s -= 20; else if (debtRatio > 0.2) s -= 10;
        if (d.savingsRate < 0.05) s -= 25; else if (d.savingsRate < 0.10) s -= 15; else if (d.savingsRate < 0.15) s -= 8;
        if (d.inflation >= d.returns) s -= 20; else if (d.inflation > d.returns * 0.7) s -= 10;
        const lifePct = (d.lifestyle * 12) / Math.max(d.income, 1);
        if (lifePct > 0.6) s -= 20; else if (lifePct > 0.4) s -= 10; else if (lifePct > 0.3) s -= 5;
        return Math.max(0, Math.min(100, Math.round(s)));
    }

    const userStressScore = dashData ? calcStressScore({
        income: dashData.income,
        loan: dashData.loan,
        savingsRate: dashData.savingsRate,
        inflation: dashData.inflation,
        returns: dashData.returns,
        lifestyle: dashData.lifestyle
    }) : 78;

    function drawGauge() {
        const canvas = document.getElementById('health-gauge');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = 260 * dpr;
        canvas.height = 160 * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const cx = 130, cy = 140, radius = 110;
        const score = userStressScore;
        const startAngle = Math.PI;
        const endAngle = 2 * Math.PI;
        const scoreAngle = startAngle + (score / 100) * Math.PI;

        let current = startAngle;
        const target = scoreAngle;

        function frame() {
            current += 0.03;
            if (current > target) current = target;

            ctx.clearRect(0, 0, 260, 160);

            // Background arc
            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.lineWidth = 14;
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.lineCap = 'round';
            ctx.stroke();

            // Score arc with gradient
            const grad = ctx.createLinearGradient(20, 0, 240, 0);
            grad.addColorStop(0, '#ef4444');
            grad.addColorStop(0.3, '#f59e0b');
            grad.addColorStop(0.6, '#10b981');
            grad.addColorStop(1, '#06d6a0');

            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, current);
            ctx.lineWidth = 14;
            ctx.strokeStyle = grad;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Glow
            ctx.save();
            ctx.shadowColor = 'rgba(16,185,129,0.4)';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, Math.max(startAngle, current - 0.1), current);
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#10b981';
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.restore();

            // Labels
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('0', 20, cy + 12);
            ctx.fillText('100', 240, cy + 12);
            ctx.fillText('50', cx, 25);

            if (current < target) requestAnimationFrame(frame);
        }

        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) { frame(); obs.disconnect(); }
        }, { threshold: 0.3 });
        obs.observe(canvas);
    }
    drawGauge();

    // ── Year Table ─────────────────────────────────────────────
    const tbody = document.getElementById('yearTableBody');
    if (tbody) {
        for (let y = 0; y <= 10; y++) {
            const diff = smartData.netWorth[y] - impData.netWorth[y];
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td style="font-weight:600;">Year ${y}</td>
        <td class="val-positive">${fmt(smartData.netWorth[y])}</td>
        <td class="val-neutral">${fmt(smartData.savings[y])}</td>
        <td class="val-negative">${fmt(impData.netWorth[y])}</td>
        <td class="val-neutral">${fmt(impData.savings[y])}</td>
        <td style="color:var(--emerald-400);font-weight:700;">${y === 0 ? '-' : '+' + fmt(diff)}</td>
      `;
            tbody.appendChild(tr);
        }
    }

    // ── Projection Stress Meter ──────────────────────────────────
    (function drawProjStress() {
        const sc = document.getElementById('projStressGauge');
        if (!sc) return;
        const sctx = sc.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        sc.width = 240 * dpr; sc.height = 140 * dpr;
        sc.style.width = '120px'; sc.style.height = '70px';
        sctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const score = userStressScore;
        const cx = 60, cy = 65, r = 48;
        const startA = Math.PI, endA = 2 * Math.PI;
        let cur = 0;

        function tick() {
            cur += 0.02; if (cur > 1) cur = 1;
            sctx.clearRect(0, 0, 120, 70);

            // BG arc
            sctx.beginPath();
            sctx.arc(cx, cy, r, startA, endA);
            sctx.strokeStyle = 'rgba(255,255,255,0.06)';
            sctx.lineWidth = 8; sctx.lineCap = 'round';
            sctx.stroke();

            // Gradient arc
            const sweepEnd = startA + (endA - startA) * (score / 100) * cur;
            const grad = sctx.createLinearGradient(10, cy, 110, cy);
            grad.addColorStop(0, '#ef4444');
            grad.addColorStop(0.4, '#f59e0b');
            grad.addColorStop(0.7, '#10b981');
            grad.addColorStop(1, '#10b981');
            sctx.beginPath();
            sctx.arc(cx, cy, r, startA, sweepEnd);
            sctx.strokeStyle = grad;
            sctx.lineWidth = 8; sctx.lineCap = 'round';
            sctx.shadowColor = 'rgba(16,185,129,0.25)'; sctx.shadowBlur = 8;
            sctx.stroke();
            sctx.shadowBlur = 0;

            // Needle dot
            const na = startA + (endA - startA) * (score / 100) * cur;
            sctx.beginPath();
            sctx.arc(cx + Math.cos(na) * (r - 6), cy + Math.sin(na) * (r - 6), 4, 0, 2 * Math.PI);
            sctx.fillStyle = '#fff'; sctx.fill();

            if (cur < 1) requestAnimationFrame(tick);
        }

        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) { tick(); obs.disconnect(); }
        }, { threshold: 0.3 });
        obs.observe(sc);

        // Update labels
        const meter = document.getElementById('projStressMeter');
        const label = document.getElementById('projStressLabel');
        const sub = document.getElementById('projStressSub');
        const scoreEl = document.getElementById('projStressScore');

        let stateColor, stateLabel, stateSub, stateCls;
        if (userStressScore >= 70) {
            stateColor = '#10b981'; stateLabel = 'Financially Stable';
            stateSub = 'Smart decisions build resilience over time.'; stateCls = 'stable';
        } else if (userStressScore >= 50) {
            stateColor = '#f59e0b'; stateLabel = 'Mild Risk';
            stateSub = 'Some adjustments could strengthen your position.'; stateCls = 'risk';
        } else if (userStressScore >= 30) {
            stateColor = '#f87171'; stateLabel = 'Debt Pressure Building';
            stateSub = 'Your debt load is affecting your trajectory.'; stateCls = 'danger';
        } else {
            stateColor = '#ef4444'; stateLabel = 'High Financial Stress';
            stateSub = 'Immediate action recommended to improve outlook.'; stateCls = 'danger';
        }

        if (meter) { meter.classList.remove('stable', 'risk', 'danger'); meter.classList.add(stateCls); }
        if (label) { label.textContent = stateLabel; label.style.color = stateColor; }
        if (sub) sub.textContent = stateSub;
        if (scoreEl) { scoreEl.textContent = userStressScore; scoreEl.style.color = stateColor; }
    })();

    // ── Scroll Reveal ──────────────────────────────────────────
    document.querySelectorAll('.reveal').forEach(el => {
        new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) el.classList.add('visible');
        }, { threshold: 0.1 }).observe(el);
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
        drawMiniChart('smart-chart', smartData.netWorth, '#10b981', 'rgba(16,185,129,0.2)');
        drawMiniChart('impulsive-chart', impData.netWorth, '#f87171', 'rgba(248,113,113,0.15)');
        drawComparison();
    });
})();
