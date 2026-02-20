/* ═══════════════════════════════════════════════════════════
   Dashboard — Emotionally Intelligent Financial Simulator
   Persona engine · Stress meter · Micro-animations · Tooltips
   ═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ── Personas ─────────────────────────────────────────────────
    const PERSONAS = {
        student: {
            label: 'Student',
            income: 25000, savings: 10, loan: 40000, lifestyle: 800,
            returns: 6, inflation: 3,
            riskLabel: 'Conservative',
            tint: 'rgba(96,165,250,0.04)'
        },
        freelancer: {
            label: 'Freelancer',
            income: 55000, savings: 15, loan: 15000, lifestyle: 2500,
            returns: 9, inflation: 3,
            riskLabel: 'Moderate',
            tint: 'rgba(245,158,11,0.04)'
        },
        salaried: {
            label: 'Salaried Employee',
            income: 80000, savings: 25, loan: 20000, lifestyle: 2000,
            returns: 7, inflation: 3,
            riskLabel: 'Balanced',
            tint: 'rgba(16,185,129,0.04)'
        }
    };

    let activePersona = 'student';
    let previousInputs = null;

    // ── DOM ──────────────────────────────────────────────────────
    const sliders = {
        income: document.getElementById('incomeSlider'),
        savings: document.getElementById('savingsSlider'),
        loan: document.getElementById('loanSlider'),
        lifestyle: document.getElementById('lifestyleSlider'),
        returns: document.getElementById('returnSlider'),
        inflation: document.getElementById('inflationSlider')
    };

    const displays = {
        income: document.getElementById('incomeValue'),
        savings: document.getElementById('savingsValue'),
        loan: document.getElementById('loanValue'),
        lifestyle: document.getElementById('lifestyleValue'),
        returns: document.getElementById('returnValue'),
        inflation: document.getElementById('inflationValue')
    };

    const kpis = {
        netWorth: document.getElementById('kpiNetWorth'),
        saved: document.getElementById('kpiSaved'),
        debt: document.getElementById('kpiDebt'),
        roi: document.getElementById('kpiRoi')
    };
    const kpiCards = {
        netWorth: document.getElementById('kpiCardNetWorth'),
        saved: document.getElementById('kpiCardSaved'),
        debt: document.getElementById('kpiCardDebt'),
        roi: document.getElementById('kpiCardRoi')
    };

    const breakdowns = {
        savings: document.getElementById('bdSavings'),
        spending: document.getElementById('bdSpending'),
        growth: document.getElementById('bdGrowth'),
        loan: document.getElementById('bdLoan'),
        savingsBar: document.getElementById('bdSavingsBar'),
        spendingBar: document.getElementById('bdSpendingBar'),
        growthBar: document.getElementById('bdGrowthBar'),
        loanBar: document.getElementById('bdLoanBar')
    };

    const canvas = document.getElementById('main-chart');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const stressCanvas = document.getElementById('stressGauge');
    const stressCtx = stressCanvas ? stressCanvas.getContext('2d') : null;

    // Feedback elements
    const microFeedback = document.getElementById('microFeedback');
    const microIcon = document.getElementById('microIcon');
    const microText = document.getElementById('microText');
    const warningToast = document.getElementById('warningToast');
    const warningTextEl = document.getElementById('warningText');
    const stressMeter = document.getElementById('stressMeter');
    const stressLabel = document.getElementById('stressLabel');
    const stressSublabel = document.getElementById('stressSublabel');
    const stressScoreEl = document.getElementById('stressScore');
    const timelineProgress = document.getElementById('timelineProgress');
    const chartTooltip = document.getElementById('chartTooltip');

    let selectedYear = 10;
    let animatedKPIs = { netWorth: 0, saved: 0, debt: 0, roi: 0 };
    let targetKPIs = {};
    let kpiAnimFrame;
    let chartAnimProgress = 0;
    let chartAnimFrame;
    let currentChartData = null;
    let currentStressScore = 82;
    let targetStressScore = 82;
    let stressAnimFrame;
    let warningTimeout;
    let microTimeout;

    // For smooth year interpolation
    let interpolatingYear = false;
    let interpFrom = 10;
    let interpTo = 10;
    let interpProgress = 1;
    let interpAnimFrame;

    // ── Utility ─────────────────────────────────────────────────
    function fmt(n) {
        if (Math.abs(n) >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
        if (Math.abs(n) >= 1000) return '$' + Math.round(n).toLocaleString();
        return '$' + Math.round(n);
    }

    function getInputs() {
        return {
            income: +sliders.income.value,
            savingsRate: +sliders.savings.value / 100,
            loan: +sliders.loan.value,
            lifestyle: +sliders.lifestyle.value,
            returns: +sliders.returns.value / 100,
            inflation: +sliders.inflation.value / 100
        };
    }

    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    // ── Persona Switching ───────────────────────────────────────
    const personaBar = document.getElementById('personaBar');
    const personaBtns = document.querySelectorAll('.persona-btn');

    personaBtns.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.persona;
            if (key === activePersona) return;
            activePersona = key;
            personaBar.dataset.active = idx;
            personaBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyPersona(key);
        });
    });

    function applyPersona(key) {
        const p = PERSONAS[key];
        // Smooth slider transitions
        animateSlider(sliders.income, p.income, 600);
        animateSlider(sliders.savings, p.savings, 600);
        animateSlider(sliders.loan, p.loan, 600);
        animateSlider(sliders.lifestyle, p.lifestyle, 600);
        animateSlider(sliders.returns, p.returns, 600);
        animateSlider(sliders.inflation, p.inflation, 600);

        // Tint overlay
        document.body.style.background = `linear-gradient(135deg, var(--navy-900) 0%, var(--navy-800) 100%)`;
    }

    function animateSlider(slider, target, duration) {
        if (!slider) return;
        const start = +slider.value;
        const startTime = performance.now();
        function tick(now) {
            const t = clamp((now - startTime) / duration, 0, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            slider.value = lerp(start, target, eased);
            slider.dispatchEvent(new Event('input'));
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // ── Financial Engine ────────────────────────────────────────
    function calculate(inputs, years) {
        const data = { netWorth: [], savings: [], debt: [], year: [] };
        let totalSaved = 0;
        let loanRemaining = inputs.loan;
        const loanRate = 0.06;
        const annualLoanPayment = inputs.loan > 0 ? inputs.loan * 0.12 : 0;

        for (let y = 0; y <= years; y++) {
            const annualSavings = inputs.income * inputs.savingsRate;
            const investmentGrowth = totalSaved * inputs.returns;
            const loanInterest = loanRemaining * loanRate;
            const loanPay = Math.min(annualLoanPayment, loanRemaining + loanInterest);

            if (y > 0) {
                totalSaved += annualSavings + investmentGrowth;
                loanRemaining = Math.max(0, loanRemaining + loanInterest - loanPay);
            }

            data.netWorth.push(totalSaved - loanRemaining);
            data.savings.push(totalSaved);
            data.debt.push(loanRemaining);
            data.year.push(y);
        }
        return data;
    }

    // ── Stress Meter Calculation ────────────────────────────────
    function calcStress(inputs) {
        let score = 100; // start perfect

        // Debt ratio
        const debtRatio = inputs.loan / Math.max(inputs.income, 1);
        if (debtRatio > 0.6) score -= 30;
        else if (debtRatio > 0.4) score -= 20;
        else if (debtRatio > 0.2) score -= 10;

        // Savings rate
        if (inputs.savingsRate < 0.05) score -= 25;
        else if (inputs.savingsRate < 0.10) score -= 15;
        else if (inputs.savingsRate < 0.15) score -= 8;

        // Inflation exceeds returns
        if (inputs.inflation >= inputs.returns) score -= 20;
        else if (inputs.inflation > inputs.returns * 0.7) score -= 10;

        // Lifestyle spending as % of income
        const lifestylePct = (inputs.lifestyle * 12) / Math.max(inputs.income, 1);
        if (lifestylePct > 0.6) score -= 20;
        else if (lifestylePct > 0.4) score -= 10;
        else if (lifestylePct > 0.3) score -= 5;

        return clamp(Math.round(score), 0, 100);
    }

    function getStressState(score) {
        if (score >= 70) return { label: 'Financially Stable', sub: 'Your financial trajectory is healthy.', cls: 'stable', color: '#10b981' };
        if (score >= 50) return { label: 'Mild Risk', sub: 'Some adjustments could strengthen your position.', cls: 'risk', color: '#f59e0b' };
        if (score >= 30) return { label: 'Debt Pressure Building', sub: 'Your debt load is affecting your trajectory.', cls: 'danger', color: '#f87171' };
        return { label: 'High Financial Stress', sub: 'Immediate action recommended to improve outlook.', cls: 'danger', color: '#ef4444' };
    }

    // ── Stress Gauge Drawing ────────────────────────────────────
    function drawStressGauge(score) {
        if (!stressCtx) return;
        const dpr = window.devicePixelRatio || 1;
        stressCanvas.width = 240 * dpr;
        stressCanvas.height = 140 * dpr;
        stressCanvas.style.width = '120px';
        stressCanvas.style.height = '70px';
        stressCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const cx = 60, cy = 65, r = 48;
        const startAngle = Math.PI;
        const endAngle = 2 * Math.PI;

        // Background arc
        stressCtx.clearRect(0, 0, 120, 70);
        stressCtx.beginPath();
        stressCtx.arc(cx, cy, r, startAngle, endAngle);
        stressCtx.strokeStyle = 'rgba(255,255,255,0.06)';
        stressCtx.lineWidth = 8;
        stressCtx.lineCap = 'round';
        stressCtx.stroke();

        // Gradient arc
        const pct = score / 100;
        const sweepEnd = startAngle + (endAngle - startAngle) * pct;

        const grad = stressCtx.createLinearGradient(10, cy, 110, cy);
        grad.addColorStop(0, '#ef4444');
        grad.addColorStop(0.4, '#f59e0b');
        grad.addColorStop(0.7, '#10b981');
        grad.addColorStop(1, '#10b981');

        stressCtx.beginPath();
        stressCtx.arc(cx, cy, r, startAngle, sweepEnd);
        stressCtx.strokeStyle = grad;
        stressCtx.lineWidth = 8;
        stressCtx.lineCap = 'round';

        // Glow for danger zone
        if (score < 40) {
            stressCtx.shadowColor = 'rgba(239,68,68,0.4)';
            stressCtx.shadowBlur = 12;
        } else {
            stressCtx.shadowBlur = 6;
            stressCtx.shadowColor = 'rgba(16,185,129,0.2)';
        }
        stressCtx.stroke();
        stressCtx.shadowBlur = 0;

        // Needle
        const needleAngle = startAngle + (endAngle - startAngle) * pct;
        const nx = cx + Math.cos(needleAngle) * (r - 6);
        const ny = cy + Math.sin(needleAngle) * (r - 6);
        stressCtx.beginPath();
        stressCtx.arc(nx, ny, 4, 0, 2 * Math.PI);
        stressCtx.fillStyle = '#fff';
        stressCtx.fill();
    }

    function animateStress() {
        cancelAnimationFrame(stressAnimFrame);
        function tick() {
            const diff = targetStressScore - currentStressScore;
            if (Math.abs(diff) < 0.5) {
                currentStressScore = targetStressScore;
                drawStressGauge(currentStressScore);
                updateStressUI(currentStressScore);
                return;
            }
            currentStressScore += diff * 0.08;
            drawStressGauge(currentStressScore);
            updateStressUI(Math.round(currentStressScore));
            stressAnimFrame = requestAnimationFrame(tick);
        }
        tick();
    }

    function updateStressUI(score) {
        const state = getStressState(score);
        if (stressMeter) {
            stressMeter.classList.remove('stable', 'risk', 'danger');
            stressMeter.classList.add(state.cls);
        }
        if (stressLabel) {
            stressLabel.textContent = state.label;
            stressLabel.style.color = state.color;
        }
        if (stressSublabel) stressSublabel.textContent = state.sub;
        if (stressScoreEl) {
            stressScoreEl.textContent = score;
            stressScoreEl.style.color = state.color;
        }
    }

    // ── Micro-Copy Feedback ─────────────────────────────────────
    function showMicroFeedback(text, type) {
        if (!microFeedback) return;
        clearTimeout(microTimeout);
        microFeedback.classList.remove('visible', 'positive', 'warning', 'negative');

        const icons = { positive: '✦', warning: '⚡', negative: '⚠' };
        microIcon.textContent = icons[type] || '✦';
        microText.textContent = text;
        microFeedback.classList.add(type);

        requestAnimationFrame(() => {
            microFeedback.classList.add('visible');
        });

        microTimeout = setTimeout(() => {
            microFeedback.classList.remove('visible');
        }, 4000);
    }

    function evaluateMicroCopy(inputs) {
        const savPct = inputs.savingsRate;
        const debtRatio = inputs.loan / Math.max(inputs.income, 1);
        const inflVsRet = inputs.inflation >= inputs.returns;
        const lifePct = (inputs.lifestyle * 12) / Math.max(inputs.income, 1);

        if (savPct >= 0.3) {
            showMicroFeedback('Future You is proud. Exceptional saving discipline.', 'positive');
        } else if (debtRatio > 0.4) {
            showMicroFeedback('Debt pressure is increasing. Consider reducing obligations.', 'negative');
        } else if (inflVsRet) {
            showMicroFeedback('Purchasing power erosion detected. Returns lag inflation.', 'warning');
        } else if (lifePct > 0.5) {
            showMicroFeedback('Lifestyle spending is high relative to income.', 'warning');
        } else if (savPct >= 0.2) {
            showMicroFeedback('Solid saving trajectory. Keep building momentum.', 'positive');
        } else if (savPct < 0.05) {
            showMicroFeedback('Savings critically low. Small increases compound dramatically.', 'negative');
        } else {
            microFeedback.classList.remove('visible');
        }
    }

    // ── Warning Toast & Micro-Animations ────────────────────────
    let warningCooldown = false;

    function triggerWarning(text, severity) {
        if (warningCooldown) return;
        warningCooldown = true;
        setTimeout(() => { warningCooldown = false; }, 2000);

        if (warningTextEl) warningTextEl.textContent = text;
        if (warningToast) {
            warningToast.classList.remove('visible', 'severity-high');
            if (severity === 'high') warningToast.classList.add('severity-high');
            requestAnimationFrame(() => warningToast.classList.add('visible'));
            clearTimeout(warningTimeout);
            warningTimeout = setTimeout(() => warningToast.classList.remove('visible'), 3000);
        }
    }

    function shakeCard(el) {
        if (!el) return;
        el.classList.remove('shake');
        void el.offsetWidth; // trigger reflow
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 450);
    }

    function flashCard(el) {
        if (!el) return;
        el.classList.remove('flash-red');
        void el.offsetWidth;
        el.classList.add('flash-red');
        setTimeout(() => el.classList.remove('flash-red'), 500);
    }

    function detectBadDecisions(prev, curr) {
        if (!prev) return; // first load

        // Savings dropped significantly
        if (curr.savingsRate < prev.savingsRate - 0.08) {
            shakeCard(kpiCards.saved);
            triggerWarning('Warning: Savings reduction has long-term compounding impact.', 'normal');
        }

        // Lifestyle spiked
        if (curr.lifestyle > prev.lifestyle * 1.3 && curr.lifestyle > 2000) {
            shakeCard(kpiCards.netWorth);
            triggerWarning('Warning: Lifestyle inflation erodes future wealth faster than expected.', 'normal');
        }

        // Loan increased significantly
        if (curr.loan > prev.loan + 20000) {
            flashCard(kpiCards.debt);
            shakeCard(kpiCards.debt);
            triggerWarning('Caution: High-interest debt has exponential long-term impact.', 'high');
        }

        // Savings dropped below 5%
        if (curr.savingsRate < 0.05 && prev.savingsRate >= 0.05) {
            flashCard(kpiCards.saved);
            triggerWarning('Critical: Near-zero savings leaves no buffer for emergencies.', 'high');
        }
    }

    // ── Canvas Setup ────────────────────────────────────────────
    function resizeCanvas() {
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 380 * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = '380px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ── Chart Drawing ───────────────────────────────────────────
    function drawChart(data, progress) {
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const cw = canvas.width / dpr;
        const ch = canvas.height / dpr;

        ctx.clearRect(0, 0, cw, ch);

        const padL = 75, padR = 30, padT = 25, padB = 50;
        const gw = cw - padL - padR;
        const gh = ch - padT - padB;

        const allVals = [...data.netWorth, ...data.savings, ...data.debt];
        const maxVal = Math.max(...allVals) * 1.15 || 1000;
        const minVal = Math.min(0, Math.min(...allVals)) * 1.1;
        const range = maxVal - minVal;

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';

        for (let i = 0; i <= 5; i++) {
            const y = padT + (gh / 5) * i;
            ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + gw, y); ctx.stroke();
            ctx.fillText(fmt(maxVal - (range / 5) * i), padL - 10, y + 4);
        }

        ctx.textAlign = 'center';
        const years = data.year.length - 1;
        for (let i = 0; i <= years; i++) {
            ctx.fillText('Y' + i, padL + (gw / Math.max(years, 1)) * i, ch - 15);
        }

        function toX(i) { return padL + (gw / Math.max(years, 1)) * i; }
        function toY(v) { return padT + gh - ((v - minVal) / range) * gh; }

        function drawSeries(values, color, glow, prog) {
            const count = Math.max(2, Math.ceil(values.length * prog));
            ctx.save();
            ctx.shadowColor = glow;
            ctx.shadowBlur = 14;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.beginPath();

            for (let i = 0; i < count && i < values.length; i++) {
                const x = toX(i), y = toY(values[i]);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Area fill
            ctx.shadowBlur = 0;
            const lastI = Math.min(count - 1, values.length - 1);
            ctx.lineTo(toX(lastI), padT + gh);
            ctx.lineTo(toX(0), padT + gh);
            ctx.closePath();
            const grad = ctx.createLinearGradient(0, padT, 0, padT + gh);
            grad.addColorStop(0, glow);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();

            // End point with pulse
            if (prog >= 1 && values.length > 0) {
                const li = values.length - 1;
                const px = toX(li), py = toY(values[li]);

                // Pulse ring
                ctx.save();
                ctx.beginPath();
                ctx.arc(px, py, 8, 0, 2 * Math.PI);
                ctx.fillStyle = glow;
                ctx.fill();

                // Solid dot
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.shadowColor = glow;
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.restore();
            }
        }

        drawSeries(data.debt, '#f87171', 'rgba(248,113,113,0.12)', progress);
        drawSeries(data.savings, '#60a5fa', 'rgba(96,165,250,0.15)', progress);
        drawSeries(data.netWorth, '#10b981', 'rgba(16,185,129,0.18)', progress);

        // Zero line
        if (minVal < 0) {
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(padL, toY(0));
            ctx.lineTo(padL + gw, toY(0));
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Store coords for hover
        if (progress >= 1) {
            currentChartData = data;
            currentChartData._meta = { padL, padR, padT, padB, gw, gh, cw, ch, maxVal, minVal, range, years };
        }
    }

    function animateChart(data) {
        chartAnimProgress = 0;
        cancelAnimationFrame(chartAnimFrame);
        function tick() {
            chartAnimProgress += 0.03;
            if (chartAnimProgress > 1) chartAnimProgress = 1;
            drawChart(data, chartAnimProgress);
            if (chartAnimProgress < 1) chartAnimFrame = requestAnimationFrame(tick);
        }
        tick();
    }

    // ── Chart Hover Tooltip ─────────────────────────────────────
    if (canvas) {
        canvas.addEventListener('mousemove', (e) => {
            if (!currentChartData || !currentChartData._meta) return;
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const m = currentChartData._meta;
            const years = m.years;

            // Which year is closest?
            const yearFrac = (mx - m.padL) / m.gw * years;
            const yearIdx = clamp(Math.round(yearFrac), 0, years);

            if (yearIdx >= 0 && yearIdx < currentChartData.netWorth.length) {
                const tt = chartTooltip;
                document.getElementById('ttYear').textContent = 'Year ' + yearIdx;
                document.getElementById('ttNetWorth').textContent = 'Net Worth: ' + fmt(currentChartData.netWorth[yearIdx]);
                document.getElementById('ttSavings').textContent = 'Savings: ' + fmt(currentChartData.savings[yearIdx]);
                document.getElementById('ttDebt').textContent = 'Debt: ' + fmt(currentChartData.debt[yearIdx]);

                // Position
                const ttX = Math.min(e.clientX - rect.left + 15, rect.width - 200);
                const ttY = e.clientY - rect.top - 80;
                tt.style.left = ttX + 'px';
                tt.style.top = ttY + 'px';
                tt.classList.add('visible');

                // Draw hover line
                const dpr = window.devicePixelRatio || 1;
                drawChart(currentChartData, 1);
                ctx.save();
                const hx = m.padL + (m.gw / Math.max(years, 1)) * yearIdx;
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(hx, m.padT);
                ctx.lineTo(hx, m.padT + m.gh);
                ctx.stroke();
                ctx.setLineDash([]);

                // Highlight dots
                [
                    { val: currentChartData.netWorth[yearIdx], color: '#10b981' },
                    { val: currentChartData.savings[yearIdx], color: '#60a5fa' },
                    { val: currentChartData.debt[yearIdx], color: '#f87171' }
                ].forEach(({ val, color }) => {
                    const y = m.padT + m.gh - ((val - m.minVal) / m.range) * m.gh;
                    ctx.beginPath();
                    ctx.arc(hx, y, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = color;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 8;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                });
                ctx.restore();
            }
        });

        canvas.addEventListener('mouseleave', () => {
            if (chartTooltip) chartTooltip.classList.remove('visible');
            if (currentChartData && chartAnimProgress >= 1) drawChart(currentChartData, 1);
        });
    }

    // ── KPI Animation ──────────────────────────────────────────
    function animateKPIs() {
        cancelAnimationFrame(kpiAnimFrame);
        const speed = 0.08;
        let done = true;

        for (const key of Object.keys(targetKPIs)) {
            const diff = targetKPIs[key] - animatedKPIs[key];
            if (Math.abs(diff) > 0.5) {
                animatedKPIs[key] += diff * speed;
                done = false;
            } else {
                animatedKPIs[key] = targetKPIs[key];
            }
        }

        kpis.netWorth.textContent = fmt(animatedKPIs.netWorth);
        kpis.saved.textContent = fmt(animatedKPIs.saved);
        kpis.debt.textContent = fmt(animatedKPIs.debt);
        kpis.roi.textContent = Math.round(animatedKPIs.roi) + '%';

        if (!done) kpiAnimFrame = requestAnimationFrame(animateKPIs);
    }

    // ── Smooth Year Interpolation ───────────────────────────────
    function smoothTransitionToYear(targetYear) {
        interpFrom = selectedYear;
        interpTo = targetYear;
        interpProgress = 0;
        cancelAnimationFrame(interpAnimFrame);

        function tick() {
            interpProgress += 0.04;
            if (interpProgress >= 1) {
                interpProgress = 1;
                selectedYear = interpTo;
                update(false);
                return;
            }

            const eased = 1 - Math.pow(1 - interpProgress, 3);
            const currentYear = Math.round(lerp(interpFrom, interpTo, eased));
            selectedYear = currentYear;
            update(false);
            interpAnimFrame = requestAnimationFrame(tick);
        }
        tick();
    }

    // ── Main Update ─────────────────────────────────────────────
    function update(checkBadDecisions = true) {
        const inputs = getInputs();

        // Detect bad decisions before updating
        if (checkBadDecisions) {
            detectBadDecisions(previousInputs, inputs);
        }

        const data = calculate(inputs, selectedYear);

        // Display slider values
        displays.income.textContent = fmt(inputs.income);
        displays.savings.textContent = Math.round(inputs.savingsRate * 100) + '%';
        displays.loan.textContent = fmt(inputs.loan);
        displays.lifestyle.textContent = fmt(inputs.lifestyle) + '/mo';
        displays.returns.textContent = Math.round(inputs.returns * 100) + '%';
        displays.inflation.textContent = Math.round(inputs.inflation * 100) + '%';

        // KPIs
        const lastIdx = data.netWorth.length - 1;
        const annualSavings = inputs.income * inputs.savingsRate;
        const roi = annualSavings > 0
            ? ((data.savings[lastIdx] - annualSavings * selectedYear) / (annualSavings * selectedYear)) * 100
            : 0;

        targetKPIs = {
            netWorth: data.netWorth[lastIdx],
            saved: data.savings[lastIdx],
            debt: data.debt[lastIdx],
            roi: Math.max(0, roi)
        };
        animateKPIs();

        // Breakdown
        const annualSpending = inputs.lifestyle * 12;
        const investmentGrowth = data.savings[Math.min(1, lastIdx)] * inputs.returns;
        const annualLoanPayment = inputs.loan > 0 ? inputs.loan * 0.12 : 0;

        breakdowns.savings.textContent = fmt(annualSavings);
        breakdowns.spending.textContent = fmt(annualSpending);
        breakdowns.growth.textContent = fmt(Math.max(0, investmentGrowth));
        breakdowns.loan.textContent = fmt(annualLoanPayment);

        const maxBd = Math.max(annualSavings, annualSpending, investmentGrowth, annualLoanPayment) || 1;
        breakdowns.savingsBar.style.width = (annualSavings / maxBd * 100) + '%';
        breakdowns.spendingBar.style.width = (annualSpending / maxBd * 100) + '%';
        breakdowns.growthBar.style.width = (Math.max(0, investmentGrowth) / maxBd * 100) + '%';
        breakdowns.loanBar.style.width = (annualLoanPayment / maxBd * 100) + '%';

        // Timeline progress bar
        if (timelineProgress) {
            timelineProgress.style.width = (selectedYear / 10 * 100) + '%';
        }

        // Stress meter
        targetStressScore = calcStress(inputs);
        animateStress();

        // Micro-copy
        if (checkBadDecisions) evaluateMicroCopy(inputs);

        // Chart
        animateChart(data);

        // Store previous for next comparison
        if (checkBadDecisions) {
            previousInputs = { ...inputs };
        }
    }

    // ── Event Listeners ─────────────────────────────────────────
    Object.values(sliders).forEach(s => {
        if (s) s.addEventListener('input', () => update(true));
    });

    // Timeline with smooth transitions
    document.querySelectorAll('.timeline-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.timeline-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const targetYear = parseInt(btn.dataset.year);
            smoothTransitionToYear(targetYear);
        });
    });

    // Resize
    window.addEventListener('resize', () => { resizeCanvas(); update(false); });

    // Navbar scroll
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (navbar) navbar.classList.toggle('scrolled', true);
    });

    // Mobile menu
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

    // ── Init ───────────────────────────────────────────────────
    resizeCanvas();
    applyPersona('student');
})();
