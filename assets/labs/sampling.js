/* Ecological sampling laboratory · BioscienceVista · by BioscienceVista
   IB DP C4.1.3 random quadrat sampling (mean, standard deviation, population estimate), C4.1.4 capture–mark–release–recapture and the
   Lincoln index, C4.1.15 chi-squared test for association between two species. A virtual field 50 m × 50 m. */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var MODE = [['quad', 'Random quadrats: daisies (sessile)'], ['cmr', 'Capture–mark–release–recapture: ground beetles (motile)'], ['chi', 'Chi-squared: are two species associated?']];
  var SIDE = 50, TRUE_D = 12000, TRUE_B = 380;   // field side (m), daisies, beetles
  var CRIT = 3.84;   // χ² critical value, 1 degree of freedom, p = 0.05

  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function daisies(seed) {   // clumped: clusters
    var r = rng(seed), out = [], cl = []; for (var i = 0; i < 40; i++) cl.push([r() * SIDE, r() * SIDE]);
    for (i = 0; i < TRUE_D; i++) { if (r() < 0.55) { var q = cl[Math.floor(r() * cl.length)]; out.push([Math.min(SIDE - 0.01, Math.max(0, q[0] + (r() - 0.5) * 5)), Math.min(SIDE - 0.01, Math.max(0, q[1] + (r() - 0.5) * 5))]); } else out.push([r() * SIDE, r() * SIDE]); }
    return out;
  }
  function plants2(seed) {   // two species in a 10 × 10 grid of 1 m² quadrats; moist low ground favours A (rush), dry ground B (thistle): negative association
    var r = rng(seed + 7), out = []; for (var i = 0; i < 100; i++) { var moist = ((i % 10) + Math.floor(i / 10)) / 18; out.push({ a: r() < 0.15 + 0.7 * moist, b: r() < 0.75 - 0.6 * moist }); } return out;
  }
  function stats(a) { var n = a.length, m = a.reduce(function (x, y) { return x + y; }, 0) / n, sd = n > 1 ? Math.sqrt(a.reduce(function (x, y) { return x + (y - m) * (y - m); }, 0) / (n - 1)) : 0; return { n: n, mean: m, sd: sd }; }
  function chi(t) {   // t: [[both, A only], [B only, neither]] -> chi-squared
    var tot = t[0][0] + t[0][1] + t[1][0] + t[1][1], rA = t[0][0] + t[0][1], rN = t[1][0] + t[1][1], cB = t[0][0] + t[1][0], cN = t[0][1] + t[1][1];
    var E = [[rA * cB / tot, rA * cN / tot], [rN * cB / tot, rN * cN / tot]], x = 0; for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) x += E[i][j] ? Math.pow(t[i][j] - E[i][j], 2) / E[i][j] : 0;
    return { x: x, E: E };
  }

  LABS.sampling = {
    id: 'sampling', title: 'Ecological sampling laboratory: quadrats, Lincoln index and chi-squared',
    tags: ['Biology', 'Ecology', 'IB DP C4.1.3 quadrats', 'IB DP C4.1.4 Lincoln index', 'IB DP C4.1.15 chi-squared', 'IGCSE', 'A Level'],
    background: '<p>Populations are usually too large to count, so they are <b>estimated by sampling</b>. Samples must be <b>random</b> so every part of the habitat has an equal chance of being chosen (random coordinates from a number generator), and large enough to be representative.</p>' +
      '<p><b>Sessile organisms</b> (plants, barnacles) are sampled with <b>quadrats</b>: count the individuals in each quadrat, find the <b>mean per quadrat</b> and its <b>standard deviation</b> (how spread out the counts are), then population ≈ mean density × total area. <b>Motile animals</b> are estimated by <b>capture–mark–release–recapture</b>: catch and mark M animals, release them to mix, then catch a second sample of N, of which R are marked. <b>Lincoln index: population ≈ M × N ÷ R</b>. It assumes marks are not lost and do not affect survival, the marked animals mix fully, and there are no births, deaths or migration between samples.</p>' +
      '<p>To test whether two species are <b>associated</b>, record presence or absence of each in many quadrats and use a <b>chi-squared test</b> on a 2 × 2 contingency table. Expected frequency = row total × column total ÷ grand total; χ² = Σ (O − E)² ÷ E. With 1 degree of freedom, χ² > 3.84 means a significant association (p < 0.05) — positive (found together) or negative (found apart), which may show <b>different habitat needs</b> or <b>interspecific competition</b>.</p>',
    objectives: ['Use random coordinates to place quadrats, and estimate a population from the mean density.', 'Calculate a mean and standard deviation, and see how the number of quadrats affects the estimate.', 'Estimate a motile population with the Lincoln index and state its assumptions.', 'Use a chi-squared test to decide whether two species are associated.'],
    rq: 'How does the number of random quadrats sampled (5 to 40) affect the accuracy of the estimate of the daisy population in a 50 m × 50 m field?',
    hypPrompt: 'Predict how the estimate changes as you sample more quadrats. Explain why.',
    hypothesis: { marks: 2, points: [
      { re: [/more (quadrats|samples).*(closer|accurate|reliable|better|nearer)|(closer|accurate|reliable).*more (quadrats|samples)/], marks: 1, ok: 'More quadrats give a more accurate estimate.', miss: 'Say how the estimate changes with more quadrats.' },
      { re: [/represent|clump|uneven|variation|random|chance|patch/], marks: 1, ok: 'You explain using variation (clumping) and representativeness.', miss: 'Explain: daisies are clumped, so a few quadrats may not be representative.' }] },
    variables: { iv: 'number of random quadrats (1 m²)', dv: 'estimated population of daisies (and the mean and standard deviation per quadrat)', cv: ['quadrat size (1 m × 1 m)', 'rule for plants on the edge (count only those on two sides)', 'same field and day', 'random coordinates from a generator', 'same person counting'] },
    apparatus: ['Two 50 m tapes laid at right angles (axes)', '1 m² quadrat, random number generator for coordinates', 'Pitfall traps or sweep net, non-toxic marker pen (small dot under the wing case)', 'Recording sheet, calculator or spreadsheet'],
    safety: ['Check the site for hazards (water, steep ground); work in pairs.', 'Handle beetles gently, mark them where predators cannot see, return them where they were caught; check pitfall traps often.', 'Wash hands after fieldwork.'],
    method: ['<b>Quadrats:</b> choose the quadrat mode and the number of quadrats. Press <b>▶ Sample</b>: random coordinates place each quadrat and the daisies are counted. Press <b>➕ Record</b>. Repeat for 5, 10, 20, 30 and 40 quadrats.', '<b>Lincoln index:</b> choose capture–mark–recapture. Press <b>▶ Sample</b>: the first catch is marked and released, the beetles mix, then the second catch is counted. Record M, N and R.', '<b>Chi-squared:</b> choose the chi-squared mode. Press <b>▶ Sample</b> to record presence or absence of a rush and a thistle in each quadrat; record the observed table and χ².'],
    controls: [
      { id: 'mode', label: 'Method', type: 'select', value: 'quad', options: MODE },
      { id: 'n', label: 'Number of quadrats (or traps)', min: 5, max: 40, step: 5, value: 10 },
      { id: 'q', label: 'Quadrat size', type: 'select', value: '1', options: [['0.25', '0.5 m × 0.5 m'], ['1', '1 m × 1 m'], ['4', '2 m × 2 m']] }
    ],
    columns: [
      { key: 'mode', label: 'Method', num: false, group: true }, { key: 'n', label: 'Quadrats / traps', dp: 0 }, { key: 'mean', label: 'Mean per quadrat', dp: 2 }, { key: 'sd', label: 'Standard deviation', dp: 2 },
      { key: 'M', label: 'M (marked)', dp: 0 }, { key: 'N', label: 'N (2nd catch)', dp: 0 }, { key: 'R', label: 'R (recaptured marked)', dp: 0 }, { key: 'est', label: 'Population estimate', dp: 0 }, { key: 'chi', label: 'χ²', dp: 2 }
    ],
    graph: { x: 'n', y: 'est', group: 'mode' },
    hints: ['Population = mean per quadrat ÷ quadrat area (m²) × 2500 m².', 'Lincoln index = M × N ÷ R.', 'Expected = row total × column total ÷ grand total.', 'Degrees of freedom for a 2 × 2 table = 1; critical value 3.84.'],
    analyse: [
      { id: 'lin', q: 'In the first catch 50 beetles were marked. The second catch had 60 beetles, 8 of them marked. Estimate the population.', marks: 1, lines: 1, number: { value: 375, tol: 0.01, dp: 0 } },
      { id: 'acc', q: 'The true number of daisies is 12 000. Describe how the number of quadrats affected the accuracy of your estimates, using your data.', marks: 3, lines: 4, points: [
        { re: [/more (quadrats|samples).*(closer|accurate|nearer|less (vari|spread))|(closer|accurate).*more/], marks: 1, ok: 'More quadrats: closer to 2400.', miss: 'Describe how the estimates changed with more quadrats.' }, { re: [/\d{3,4}/], marks: 1, ok: 'You quote estimates.', miss: 'Quote estimates from your table.' },
        { re: [/clump|patch|uneven|variation|standard deviation|sd|spread/], marks: 1, ok: 'You explain with clumping / large SD.', miss: 'Explain: daisies are clumped, so counts vary a lot (large SD).' }] },
      { id: 'chi', q: 'Use your chi-squared value to decide whether the rush and the thistle are associated. State the type of association and suggest a reason.', marks: 3, lines: 4, points: [
        { re: [/3\.84|critical/], marks: 1, ok: 'You compare with the critical value 3.84.', miss: 'Compare χ² with the critical value 3.84 (1 degree of freedom, p = 0.05).' },
        { re: [/negative|apart|not found together|separate/], marks: 1, ok: 'A negative association.', miss: 'Say whether the association is positive or negative.' },
        { re: [/moist|wet|dry|water|soil|habitat|competition|compet/], marks: 1, ok: 'Different habitat needs (moisture) or competition.', miss: 'Suggest why: they need different soil moisture, or compete.' }] }
    ],
    evaluate: [
      { id: 'ass', q: 'State two assumptions of the Lincoln index and how one could be wrong for ground beetles.', marks: 2, lines: 4, points: [
        { re: [/mark.*(not|n.t) (lost|wash|rub|affect)|mix|no (births|deaths|migration|immigration|emigration)|closed population|equal chance/], marks: 1, ok: 'Valid assumptions.', miss: 'For example: marks are not lost, marked animals mix fully, no births, deaths or migration.' },
        { re: [/predat|visible|trap.?(happy|shy)|rub|lost|hide|death|migrat|left|moved/], marks: 1, ok: 'A way it could be wrong.', miss: 'For example: bright marks make beetles easier for predators to see, or beetles become trap-shy.' }] },
      { id: 'sd', q: 'What does a large standard deviation of the mean number per quadrat tell you about the daisies?', marks: 1, lines: 2, points: [
        { re: [/clump|patch|uneven|spread out|vary|variation|not (evenly|uniform)/], marks: 1, ok: 'They are unevenly (clumped) distributed.', miss: 'A large SD shows the counts vary a lot: the daisies are clumped.' }] }
    ],
    model: '<ul><li>Field 50 m × 50 m (2500 m²) with 12 000 daisies (4.8 per m²), 55 % of them in clumps; each run uses new random coordinates, so estimates vary like real ones.</li>' +
      '<li>380 ground beetles; each trap catches beetles at random; marked beetles mix completely between catches (the assumptions hold in the model).</li>' +
      '<li>Chi-squared: a 10 × 10 grid of 1 m² quadrats; ground slopes from dry (top left) to moist (bottom right). The rush is more likely on moist ground, the thistle on dry ground, so they show a negative association. Quadrats are chosen at random from the grid.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, sim = null, raf = null, playing = false, t0 = 0, W = 640, H = 420, seed = 1, run = null;
    api.stage.innerHTML = '<canvas id="sa-cv" width="640" height="420" style="width:100%;height:auto;background:#f0fdf4;border-radius:12px" role="img" aria-label="A field with daisies, beetles or plants being sampled"></canvas><p class="small" id="sa-cap" style="margin:6px 0;font-weight:700" aria-live="polite"></p><div id="sa-tab"></div>';
    var cv = api.stage.querySelector('#sa-cv'), c = cv.getContext('2d'), cap = api.stage.querySelector('#sa-cap'), tab = api.stage.querySelector('#sa-tab');
    var FX = 20, FY = 20, FS = 380, K = FS / SIDE;
    var D = daisies(11), BE = [], P2 = plants2(3);
    function beetles() { var r = rng(seed * 5 + 1), b = []; for (var i = 0; i < TRUE_B; i++) b.push({ x: r() * SIDE, y: r() * SIDE, m: false, vx: (r() - 0.5) * 4, vy: (r() - 0.5) * 4 }); return b; }
    function doRun(v) {
      var r = rng(seed * 131 + v.n * 7), out = { mode: v.mode, n: v.n, q: +v.q };
      if (v.mode === 'quad') {
        var s = Math.sqrt(+v.q), qs = [];
        for (var i = 0; i < v.n; i++) { var x = r() * (SIDE - s), y = r() * (SIDE - s), cnt = D.filter(function (d) { return d[0] >= x && d[0] < x + s && d[1] >= y && d[1] < y + s; }).length; qs.push({ x: x, y: y, s: s, c: cnt }); }
        var st = stats(qs.map(function (q) { return q.c; })); out.qs = qs; out.mean = st.mean; out.sd = st.sd; out.est = st.mean / +v.q * SIDE * SIDE;
      } else if (v.mode === 'cmr') {
        BE = beetles(); var p = Math.min(0.5, v.n * 0.007), M = 0, N = 0, R = 0; BE.forEach(function (b) { if (r() < p) { b.m = true; M++; } });
        out.first = BE.map(function (b) { return b.m; }); BE.forEach(function (b) { if (r() < p) { b.c2 = true; N++; if (b.m) R++; } });
        out.M = M; out.N = N; out.R = R; out.est = R ? M * N / R : NaN;
      } else {
        var idx = [], all = []; for (var j = 0; j < 100; j++) all.push(j); for (j = 0; j < Math.min(v.n, 40); j++) idx.push(all.splice(Math.floor(r() * all.length), 1)[0]);
        if (v.n >= 40) idx = idx.concat(all.splice(0, 0));
        var t = [[0, 0], [0, 0]]; idx.forEach(function (k) { var q = P2[k]; t[q.a ? 0 : 1][q.b ? 0 : 1]++; }); var ch = chi(t); out.idx = idx; out.t = t; out.chi = ch.x; out.E = ch.E;
      }
      return out;
    }
    function drawField(el) {
      var v = api.vals(); c.clearRect(0, 0, W, H); c.fillStyle = '#dcfce7'; c.fillRect(FX, FY, FS, FS); c.strokeStyle = '#166534'; c.lineWidth = 2; c.strokeRect(FX, FY, FS, FS);
      c.fillStyle = '#14532d'; c.font = '10px system-ui'; c.textAlign = 'center'; if (v.mode !== 'chi') for (var m = 0; m <= 50; m += 10) { c.fillText(m + ' m', FX + m * K, FY + FS + 14); c.fillText(m, FX - 10, FY + m * K + 3); }
      if (v.mode === 'quad') {
        c.fillStyle = '#ca8a04'; D.forEach(function (d) { c.fillRect(FX + d[0] * K - 0.7, FY + d[1] * K - 0.7, 1.4, 1.4); });
        if (run && run.mode === 'quad') { var show = Math.ceil(run.qs.length * Math.min(1, el)); run.qs.slice(0, show).forEach(function (q, i) { c.strokeStyle = '#dc2626'; c.lineWidth = 1.5; c.strokeRect(FX + q.x * K, FY + q.y * K, Math.max(3, q.s * K), Math.max(3, q.s * K)); if (i === show - 1) zoom(q); }); }
      } else if (v.mode === 'cmr') {
        var ph = el < 0.35 ? 1 : el < 0.65 ? 2 : 3;
        BE.forEach(function (b, i) { if (playing && ph === 2) { b.x = (b.x + b.vx * 0.05 + SIDE) % SIDE; b.y = (b.y + b.vy * 0.05 + SIDE) % SIDE; } var x = FX + b.x * K, y = FY + b.y * K;
          c.fillStyle = '#1f2937'; c.beginPath(); c.ellipse(x, y, 2.6, 1.8, 0, 0, 7); c.fill(); if (b.m && run && (ph >= 1 && el > 0.15)) { c.fillStyle = '#f472b6'; c.beginPath(); c.arc(x, y, 1.4, 0, 7); c.fill(); }
          if (ph === 3 && b.c2) { c.strokeStyle = b.m ? '#db2777' : '#2563eb'; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, 5, 0, 7); c.stroke(); } });
        c.fillStyle = '#0f172a'; c.font = 'bold 12px system-ui'; c.textAlign = 'left'; (ph === 1 ? ['1 · First catch:', 'mark (pink dot) and release'] : ph === 2 ? ['2 · Marked beetles mix', 'with the population'] : ['3 · Second catch:', 'blue ring = unmarked', 'pink ring = marked (recaptured)']).forEach(function (t, i) { c.fillText(t, FX + FS + 14, 40 + i * 18); });
      } else {
        P2.forEach(function (q, k) { var x = FX + (k % 10) * 38, y = FY + Math.floor(k / 10) * 38, sel = run && run.idx && run.idx.indexOf(k) >= 0 && run.idx.indexOf(k) < run.idx.length * Math.min(1, el);
          var moist = ((k % 10) + Math.floor(k / 10)) / 18; c.fillStyle = 'rgba(14,165,233,' + (0.05 + 0.35 * moist) + ')'; c.fillRect(x, y, 38, 38); c.strokeStyle = 'rgba(22,101,52,.3)'; c.strokeRect(x, y, 38, 38);
          if (q.a) { c.strokeStyle = '#166534'; c.lineWidth = 1.5; for (var s2 = 0; s2 < 4; s2++) { c.beginPath(); c.moveTo(x + 8 + s2 * 3, y + 30); c.lineTo(x + 6 + s2 * 4, y + 12); c.stroke(); } }
          if (q.b) { c.fillStyle = '#a21caf'; c.beginPath(); c.arc(x + 28, y + 14, 4, 0, 7); c.fill(); c.strokeStyle = '#4d7c0f'; c.beginPath(); c.moveTo(x + 28, y + 18); c.lineTo(x + 28, y + 32); c.stroke(); }
          if (sel) { c.strokeStyle = '#dc2626'; c.lineWidth = 2.5; c.strokeRect(x + 1, y + 1, 36, 36); } });
        c.fillStyle = '#0f172a'; c.font = '12px system-ui'; c.textAlign = 'left'; ['10 × 10 grid of 1 m² quadrats', 'Green tufts: rush', 'Purple flower: thistle', 'Bluer squares: wetter ground', 'Red squares: sampled'].forEach(function (t, i) { c.fillText(t, FX + FS + 20, 50 + i * 22); });
      }
    }
    function zoom(q) {   // close-up of the latest quadrat
      var x0 = 420, y0 = 40, s = 190; c.fillStyle = '#bbf7d0'; c.fillRect(x0, y0, s, s); c.strokeStyle = '#dc2626'; c.lineWidth = 3; c.strokeRect(x0, y0, s, s);
      D.forEach(function (d) { if (d[0] >= q.x && d[0] < q.x + q.s && d[1] >= q.y && d[1] < q.y + q.s) { var px = x0 + (d[0] - q.x) / q.s * s, py = y0 + (d[1] - q.y) / q.s * s; c.fillStyle = '#fff'; for (var p = 0; p < 8; p++) { c.beginPath(); c.ellipse(px + Math.cos(p * 0.785) * 5, py + Math.sin(p * 0.785) * 5, 4, 1.8, p * 0.785, 0, 7); c.fill(); } c.fillStyle = '#facc15'; c.beginPath(); c.arc(px, py, 2.8, 0, 7); c.fill(); } });
      c.fillStyle = '#0f172a'; c.font = 'bold 13px system-ui'; c.textAlign = 'left'; c.fillText('Quadrat at (' + fx(q.x, 1) + ' m, ' + fx(q.y, 1) + ' m): ' + q.c + ' daisies', x0 - 10, y0 + s + 20);
    }
    function showTable() {
      if (!run) { tab.innerHTML = ''; return; }
      if (run.mode === 'quad') tab.innerHTML = '<p class="small"><b>Counts:</b> ' + run.qs.map(function (q) { return q.c; }).join(', ') + '</p>';
      else if (run.mode === 'chi') { var t = run.t, E = run.E; tab.innerHTML = '<table class="small" style="border-collapse:collapse;margin:6px 0"><tr><th style="padding:4px 8px"></th><th style="padding:4px 8px">Thistle present</th><th style="padding:4px 8px">Thistle absent</th></tr>' +
        '<tr><th style="padding:4px 8px">Rush present</th><td style="padding:4px 8px">' + t[0][0] + ' (E ' + fx(E[0][0], 1) + ')</td><td style="padding:4px 8px">' + t[0][1] + ' (E ' + fx(E[0][1], 1) + ')</td></tr><tr><th style="padding:4px 8px">Rush absent</th><td style="padding:4px 8px">' + t[1][0] + ' (E ' + fx(E[1][0], 1) + ')</td><td style="padding:4px 8px">' + t[1][1] + ' (E ' + fx(E[1][1], 1) + ')</td></tr></table>'; }
      else tab.innerHTML = '';
    }
    function readings() {
      var v = api.vals(); if (!run || run.mode !== v.mode) return api.readings([['Method', MODE.filter(function (m) { return m[0] === v.mode; })[0][1]], ['Result', 'press ▶ Sample']]);
      if (run.mode === 'quad') api.readings([['Mean per quadrat', fx(run.mean, 2)], ['Standard deviation', fx(run.sd, 2)], ['Density', fx(run.mean / run.q, 2) + ' per m²'], ['Population estimate', fx(run.est, 0)]]);
      else if (run.mode === 'cmr') api.readings([['M (first catch, marked)', String(run.M)], ['N (second catch)', String(run.N)], ['R (marked in 2nd catch)', String(run.R)], ['Estimate M × N ÷ R', isNaN(run.est) ? 'R = 0: catch more' : fx(run.est, 0)]]);
      else api.readings([['Quadrats', String(run.idx.length)], ['χ²', fx(run.chi, 2)], ['Critical value (df 1, p 0.05)', '3.84'], ['Conclusion', run.chi > CRIT ? 'significant association' : 'no significant association']]);
    }
    function frame() { var el = Math.min(1, (performance.now() - t0) / 5000); drawField(el); if (el >= 1) { playing = false; api.label('run', '▶ Sample'); readings(); showTable(); cap.textContent = summary(); api.status('Done. ➕ Record, then sample again (new random positions).'); return; } if (playing) raf = requestAnimationFrame(frame); }
    function summary() { if (!run) return ''; if (run.mode === 'quad') return run.n + ' quadrats: mean ' + fx(run.mean, 2) + ' ± ' + fx(run.sd, 2) + ' daisies per quadrat → about ' + fx(run.est, 0) + ' daisies in the field.'; if (run.mode === 'cmr') return 'Lincoln index: ' + run.M + ' × ' + run.N + ' ÷ ' + run.R + ' ≈ ' + (isNaN(run.est) ? '?' : fx(run.est, 0)) + ' beetles.'; return 'χ² = ' + fx(run.chi, 2) + (run.chi > CRIT ? ' > 3.84: the species are significantly associated (' + (run.t[0][0] < run.E[0][0] ? 'negative' : 'positive') + ').' : ' < 3.84: no significant association.'); }
    api.actions([
      { id: 'run', label: '▶ Sample', main: true, fn: function () { if (playing) return; var v = api.vals(); seed++; if (v.mode === 'cmr') BE = beetles(); run = doRun(v); playing = true; t0 = performance.now(); api.label('run', '⏳ Sampling…'); frame(); } },
      { id: 'rec', label: '➕ Record', fn: function () { if (!run) return api.status('Sample first.'); var row = { mode: MODE.filter(function (m) { return m[0] === run.mode; })[0][1].split(':')[0], n: run.n, mean: '', sd: '', M: '', N: '', R: '', est: '', chi: '' };
        if (run.mode === 'quad') { row.mean = +run.mean.toFixed(2); row.sd = +run.sd.toFixed(2); row.est = Math.round(run.est); } else if (run.mode === 'cmr') { row.M = run.M; row.N = run.N; row.R = run.R; row.est = isNaN(run.est) ? '' : Math.round(run.est); } else row.chi = +run.chi.toFixed(2);
        api.record(row); } }
    ]);
    api.onChange = function () { if (run && run.mode !== api.vals().mode) { run = null; showTable(); } if (api.vals().mode === 'cmr' && !BE.length) BE = beetles(); readings(); drawField(1); cap.textContent = summary(); };
    BE = beetles(); readings(); drawField(1);
    api.status('Choose a method and press ▶ Sample.');
    window.BV_SA = { chi: chi };
  }
})();
