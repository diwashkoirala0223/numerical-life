/* ═══════════════════════════════════════════════════════════
   Projection — Smart vs Impulsive Comparison Engine
   Level 10: Inflation-Aware Projections & Future You
   ═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ── Scenarios ──────────────────────────────────────────────
    const income = 70000;
    const inflation = 0.03; // Base inflation assumption

    const smart = {
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

    let inflationAdjusted = false;

    function simulate(scenario, years) {
        const data = { netWorth: [], savings: [], debt: [], realNetWorth: [] };
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
            const nominal = saved - debt;
            const real = nominal / Math.pow(1 + inflation, y);

            data.netWorth.push(nominal);
            data.realNetWorth.push(real);
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

    // ── Update Logic ───────────────────────────────────────────
    function getActiveData(data) {
        return inflationAdjusted ? data.realNetWorth : data.netWorth;
    }

    function updateStats() {
        const last = 10;
        // Smart
        const sNW = getActiveData(smartData)[last];
        const sSaved = smartData.savings[last]; // Savings amount stays nominal usually in stats unless specified
        // For consistency, let's keep sub-stats nominal but main NW dynamic, or all dynamic? 
        // User asked for "Real Values" toggle. Usually applies to monetary amounts.
        // We'll adjust NW. Savings/Debt are less intuitive in real terms for "Account Balance" metaphor.
        // However, "Real Value" implies purchasing power. Let's adjust all for consistency if they represent value.

        const adj = (val) => inflationAdjusted ? val / Math.pow(1 + inflation, last) : val;

        document.getElementById('smartNetWorth').textContent = fmt(adj(smartData.netWorth[last]));
        document.getElementById('smartSaved').textContent = fmt(adj(smartData.savings[last]));
        document.getElementById('smartDebt').textContent = fmt(adj(smartData.debt[last]));
        document.getElementById('smartFreedom').textContent = fmt(adj((smartData.savings[last] * smart.returnRate) / 12));

        // Impulsive
        document.getElementById('impNetWorth').textContent = fmt(adj(impData.netWorth[last]));
        document.getElementById('impSaved').textContent = fmt(adj(impData.savings[last]));
        document.getElementById('impDebt').textContent = fmt(adj(impData.debt[last]));
        document.getElementById('impFreedom').textContent = fmt(adj((impData.savings[last] * impulsive.returnRate) / 12));
    }

    // ── Charting ───────────────────────────────────────────────
    function drawMiniChart(canvasId, dataObj, color, glowColor) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Resize logic reused? simplified here
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 200 * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = '200px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const dataset = getActiveData(dataObj);
        const cw = rect.width, ch = 200;
        const pad = { l: 10, r: 10, t: 15, b: 15 };
        const gw = cw - pad.l - pad.r, gh = ch - pad.t - pad.b;

        // Determine global min/max to keep comparison scale valid? 
        // Or per chart? Mini charts usually independent but here comparison matters.
        // Let's scale per chart for visual trend.
        const maxV = Math.max(...dataset) * 1.1 || 1;
        const minV = Math.min(0, Math.min(...dataset));
        const range = maxV - minV;

        ctx.clearRect(0, 0, cw, ch);

        // Draw
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();

        for (let i = 0; i < dataset.length; i++) {
            const x = pad.l + (gw / (dataset.length - 1)) * i;
            const y = pad.t + gh - ((dataset[i] - minV) / range) * gh;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Area
        ctx.shadowBlur = 0;
        ctx.lineTo(pad.l + gw, pad.t + gh);
        ctx.lineTo(pad.l, pad.t + gh);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + gh);
        grad.addColorStop(0, glowColor);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
    }

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

        const sData = getActiveData(smartData);
        const iData = getActiveData(impData);
        const all = [...sData, ...iData];
        const maxV = Math.max(...all) * 1.15;
        const minV = Math.min(0, Math.min(...all)) * 1.1;
        const range = maxV - minV;

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
            ctx.save();
            ctx.shadowColor = glow;
            ctx.shadowBlur = 14;
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            for (let i = 0; i < data.length; i++) {
                const x = pad.l + (gw / 10) * i;
                const y = pad.t + gh - ((data[i] - minV) / range) * gh;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Area
            ctx.shadowBlur = 0;
            ctx.lineTo(pad.l + gw, pad.t + gh);
            ctx.lineTo(pad.l, pad.t + gh);
            ctx.closePath();
            const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + gh);
            grad.addColorStop(0, glow);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();
        }

        drawLine(iData, '#f87171', 'rgba(248,113,113,0.12)');
        drawLine(sData, '#10b981', 'rgba(16,185,129,0.18)');
    }

    // ── Table Update ──────────────────────────────────────────
    function updateTable() {
        const tbody = document.getElementById('yearTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        const sData = getActiveData(smartData);
        const iData = getActiveData(impData);
        const adj = (val, y) => inflationAdjusted ? val / Math.pow(1 + inflation, y) : val;

        for (let y = 0; y <= 10; y++) {
            const diff = sData[y] - iData[y];
            const tr = document.createElement('tr');
            // Savings are stored nominal in data.savings, adjust for table if Real mode
            const sSav = adj(smartData.savings[y], y);
            const iSav = adj(impData.savings[y], y);

            tr.innerHTML = `
        <td style="font-weight:600;">Year ${y}</td>
        <td class="val-positive">${fmt(sData[y])}</td>
        <td class="val-neutral">${fmt(sSav)}</td>
        <td class="val-negative">${fmt(iData[y])}</td>
        <td class="val-neutral">${fmt(iSav)}</td>
        <td style="color:var(--emerald-400);font-weight:700;">${y === 0 ? '-' : '+' + fmt(diff)}</td>
      `;
            tbody.appendChild(tr);
        }
    }

    // ── Future You Logic (Preserved) ───────────────────────────
    function updateFutureYou() {
        const card = document.getElementById('futureYouCard');
        const avatar = document.getElementById('fyAvatar');
        const moodText = document.getElementById('fyMood');
        const msgText = document.getElementById('fyMessage');
        const dot = document.getElementById('fyStatusDot');

        if (!card) return;

        // Use real values for Future You? 
        // Usually psychology works on today's value perception, but Future You lives in the future.
        // Let's use Real Values to be honest about wealth.
        const last = 10;
        const smartNW = smartData.realNetWorth[last];
        const impNW = impData.realNetWorth[last];
        const diff = smartNW - impNW;
        const advantage = (diff / (impNW || 1)) * 100;

        let state = {
            face: '😐',
            mood: 'is waiting...',
            msg: 'Make choices to see my reaction.',
            status: 'neutral'
        };

        if (advantage > 200) {
            state = { face: '🤩', mood: 'is thrilled!', msg: `Smart choices made you ${fmt(diff)} richer (Real Value). I'm living my best life!`, status: 'positive' };
        } else if (advantage > 50) {
            state = { face: '🙂', mood: 'is content.', msg: `A solid ${fmt(diff)} gap. We're secure.`, status: 'positive' };
        } else if (advantage > 0) {
            state = { face: '🤔', mood: 'is unsure.', msg: 'Better than impulsive, but we could optimize.', status: 'warning' };
        } else {
            state = { face: '😰', mood: 'is panicked.', msg: 'The impulsive path is ruining us. Please reconsider!', status: 'negative' };
        }

        if (avatar) avatar.textContent = state.face;
        if (moodText) moodText.textContent = state.mood;
        if (msgText) msgText.textContent = state.msg;
        if (dot) dot.className = 'fy-status-dot ' + state.status;

        setTimeout(() => { card.classList.add('visible'); }, 1500);
    }

    // ── Gauge (Static for Projection) ──────────────────────────
    function drawGauge() {
        const canvas = document.getElementById('health-gauge');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = 260 * dpr; canvas.height = 160 * dpr;
        const cx = 130, cy = 140, radius = 110;
        const score = 78;
        // ... (standard gauge drawing code, abridged for brevity but functional) ...
        // Re-implementing simplified draw to ensure it works
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, 260, 160);

        ctx.beginPath(); ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI);
        ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.stroke();

        const end = Math.PI + (Math.PI * score / 100);
        ctx.beginPath(); ctx.arc(cx, cy, radius, Math.PI, end);
        ctx.lineWidth = 14; ctx.strokeStyle = '#10b981'; ctx.stroke();

        ctx.fillStyle = 'white'; ctx.font = '900 40px Inter'; ctx.textAlign = 'center';
        ctx.fillText(score, cx, cy - 10);
        ctx.font = '14px Inter'; ctx.fillStyle = '#aaa';
        ctx.fillText('Composite Score', cx, cy + 20);
    }

    // ── Main Render ────────────────────────────────────────────
    function render() {
        updateStats();
        drawMiniChart('smart-chart', smartData, '#10b981', 'rgba(16,185,129,0.2)');
        drawMiniChart('impulsive-chart', impData, '#f87171', 'rgba(248,113,113,0.15)');
        drawComparison();
        updateTable();
        // Future You update (optional to re-trigger on toggle, but maybe just once is fine)
        // updateFutureYou(); 
    }

    // ── Events ─────────────────────────────────────────────────
    const toggle = document.getElementById('projInflationToggle');
    if (toggle) {
        toggle.addEventListener('change', (e) => {
            inflationAdjusted = e.target.checked;
            render();
        });
    }

    window.addEventListener('resize', render);

    // Initial Run
    setTimeout(() => {
        render();
        drawGauge();
        updateFutureYou();
    }, 100);

})();
