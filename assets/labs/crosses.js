/* Dihybrid crosses and chi-squared laboratory · BioscienceVista · by George Apidi
   IB DP D3.2.21 (and D3.2 inheritance): cross maize plants for two genes (purple/yellow kernels, smooth/wrinkled), count the offspring on
   the cobs and use a chi-squared test to compare the observed numbers with the expected 9:3:3:1 or 1:1:1:1 ratio. Try linked genes. */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var CROSS = [['f1', 'F1 × F1: PpSs × PpSs (expect 9:3:3:1)'], ['test', 'Test cross: PpSs × ppss (expect 1:1:1:1)']];
  var LINK = [['un', 'Genes on different chromosomes'], ['link', 'Genes linked on one chromosome (20 cM apart)']];
  var CLASSES = ['Purple smooth', 'Purple wrinkled', 'Yellow smooth', 'Yellow wrinkled'];
  var CRIT3 = 7.815;   // 3 degrees of freedom, p = 0.05

  function probs(cross, link) {
    if (link === 'un') return cross === 'f1' ? [9, 3, 3, 1].map(function (x) { return x / 16; }) : [0.25, 0.25, 0.25, 0.25];
    var rf = 0.2, par = (1 - rf) / 2, rec = rf / 2;   // gametes PS and ps (parental), Ps and pS (recombinant)
    if (cross === 'test') return [par, rec, rec, par];
    var g = { PS: par, Ps: rec, pS: rec, ps: par }, out = [0, 0, 0, 0];
    Object.keys(g).forEach(function (a) { Object.keys(g).forEach(function (b) { var P = a[0] === 'P' || b[0] === 'P', S = a[1] === 'S' || b[1] === 'S'; out[(P ? 0 : 2) + (S ? 0 : 1)] += g[a] * g[b]; }); });
    return out;
  }
  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function chi(obs, exp) { return obs.reduce(function (a, o, i) { return a + (exp[i] ? Math.pow(o - exp[i], 2) / exp[i] : 0); }, 0); }

  LABS.crosses = {
    id: 'crosses', title: 'Genetic crosses laboratory: dihybrid ratios and chi-squared',
    tags: ['Biology', 'Genetics', 'IB DP D3.2.21 chi-squared for dihybrid crosses', 'IB DP D3.2 inheritance', 'A Level'],
    background: '<p>In maize, kernel colour is controlled by one gene (<b>P</b> purple, dominant; <b>p</b> yellow) and kernel shape by another (<b>S</b> smooth, dominant; <b>s</b> wrinkled, sugary). Each kernel on a cob is one offspring, so a cob gives a large sample.</p>' +
      '<p>If the two genes are on <b>different chromosomes</b>, their alleles are inherited independently (Mendel\'s law of independent assortment). Crossing two dihybrids <b>PpSs × PpSs</b> gives an expected <b>9 : 3 : 3 : 1</b> ratio of phenotypes; a <b>test cross</b> with the double recessive <b>ppss</b> gives <b>1 : 1 : 1 : 1</b>. If the genes are <b>linked</b> on the same chromosome, parental combinations are more common and recombinants (made by crossing over) are rarer, so the ratio differs.</p>' +
      '<p>Observed numbers never match expected ones exactly because fertilisation is random. The <b>chi-squared test</b> decides whether the difference is small enough to be due to chance: χ² = Σ (O − E)² ÷ E. With four classes there are <b>3 degrees of freedom</b>; the critical value at p = 0.05 is <b>7.815</b>. If χ² is below it, accept the null hypothesis (the data fit the ratio); if above, reject it (for example, the genes may be linked).</p>',
    objectives: ['Predict dihybrid ratios with Punnett grids.', 'Count offspring phenotypes on maize cobs.', 'Use a chi-squared test with 3 degrees of freedom to compare observed and expected numbers.', 'Recognise when results suggest gene linkage.'],
    rq: 'Do the kernels on a cob from PpSs × PpSs fit the 9 : 3 : 3 : 1 ratio expected for unlinked genes?',
    hypPrompt: 'Write a null hypothesis for the chi-squared test, and predict whether it will be accepted for unlinked and for linked genes.',
    hypothesis: { marks: 2, points: [
      { re: [/no (significant )?difference|fit|9 ?: ?3 ?: ?3 ?: ?1|due to chance|independent/], marks: 1, ok: 'A valid null hypothesis.', miss: 'Write the null hypothesis: no significant difference between observed and the 9:3:3:1 ratio.' },
      { re: [/link.*(reject|not fit|differ|significant)|reject.*link/], marks: 1, ok: 'Linked genes: reject.', miss: 'Predict what happens with linked genes.' }] },
    variables: { iv: 'type of cross and whether the genes are linked', dv: 'number of kernels of each phenotype; χ²', cv: ['parent genotypes', 'counting rule (each kernel once)', 'sample size (number of kernels counted)', 'same cob region / whole cob'] },
    apparatus: ['Maize cobs from the crosses (or photographs)', 'Pins or marker to mark counted rows', 'Calculator or spreadsheet, chi-squared table'],
    safety: ['No hazards. Wash hands if handling real cobs treated with fungicide.'],
    method: ['Choose the cross and whether the genes are linked, and how many kernels to count.', 'Press <b>▶ Grow and count</b>: the cob develops and each kernel is counted into its class.', 'Read the observed numbers, the expected numbers and χ². Press <b>➕ Record</b>.', 'Repeat with a new cob (each one differs), with linked genes, and with the test cross.'],
    controls: [
      { id: 'cross', label: 'Cross', type: 'select', value: 'f1', options: CROSS },
      { id: 'link', label: 'Genes', type: 'select', value: 'un', options: LINK },
      { id: 'n', label: 'Kernels counted', min: 80, max: 640, step: 80, value: 320 }
    ],
    columns: [
      { key: 'cross', label: 'Cross', num: false, group: true }, { key: 'link', label: 'Genes', num: false, group: true }, { key: 'ps', label: 'Purple smooth', dp: 0 }, { key: 'pw', label: 'Purple wrinkled', dp: 0 },
      { key: 'ys', label: 'Yellow smooth', dp: 0 }, { key: 'yw', label: 'Yellow wrinkled', dp: 0 }, { key: 'chi', label: 'χ²', dp: 2 }, { key: 'res', label: 'Null hypothesis', num: false }
    ],
    graph: { x: 'chi', y: 'ps', group: 'link' },
    hints: ['Expected number = total × fraction (9/16, 3/16, 3/16, 1/16).', 'Degrees of freedom = number of classes − 1 = 3.', 'Critical value at p = 0.05 with 3 df: 7.815.', 'Linked genes: which classes are too common?'],
    analyse: [
      { id: 'exp', q: 'A cob has 320 kernels from PpSs × PpSs. Calculate the expected number of yellow wrinkled kernels.', marks: 1, lines: 1, number: { value: 20, tol: 0.001, dp: 0 } },
      { id: 'chi', q: 'Observed: 172, 64, 61, 23 (total 320). Calculate χ² for a 9:3:3:1 ratio (to 2 decimal places) and state your conclusion.', marks: 3, lines: 4, points: [
        { re: [/\b1\.(0[89]|1\d?)\b/], marks: 1, ok: 'χ² ≈ 1.09.', miss: 'E = 180, 60, 60, 20, so χ² = 0.36 + 0.27 + 0.02 + 0.45 = 1.09.' },
        { re: [/7\.8/], marks: 1, ok: 'Compared with 7.815.', miss: 'Compare with the critical value 7.815 (3 df).' }, { re: [/accept|fit|not significant|chance/], marks: 1, ok: 'Accept the null hypothesis.', miss: 'Conclude: accept the null hypothesis — the data fit 9:3:3:1.' }] },
      { id: 'link', q: 'Explain the results for linked genes.', marks: 3, lines: 4, points: [
        { re: [/reject|significant|above|greater than 7/], marks: 1, ok: 'The null hypothesis is rejected.', miss: 'State the result of the test.' }, { re: [/parental.*(more|common)|purple smooth.*(more|too many)|yellow wrinkled.*(more|too many)|recombinant.*(fewer|less|rare)/], marks: 1, ok: 'Parental types too common, recombinants too rare.', miss: 'Say which classes are too common or too rare.' }, { re: [/same chromosome|together|crossing over|not (assort|independ)/], marks: 1, ok: 'Alleles on one chromosome are inherited together, except after crossing over.', miss: 'Explain: the genes are on the same chromosome; only crossing over separates them.' }] }
    ],
    evaluate: [
      { id: 'n', q: 'Why does counting a larger number of kernels make the chi-squared test more reliable?', marks: 1, lines: 2, points: [
        { re: [/chance|random|sampl|small numbers|variation|deviation|representative/], marks: 1, ok: 'Chance deviations matter less in a large sample.', miss: 'With more kernels, chance variation has less effect, so real differences are easier to detect.' }] },
      { id: 'mean', q: 'What does accepting the null hypothesis at p = 0.05 mean, and not mean?', marks: 2, lines: 3, points: [
        { re: [/chance|5 ?%|probability|random/], marks: 1, ok: 'Differences are probably due to chance.', miss: 'It means the differences could be due to chance (p > 0.05).' }, { re: [/not prove|doesn.t prove|does not prove|not certain|could still|cannot be sure/], marks: 1, ok: 'It does not prove the hypothesis.', miss: 'It does not prove the genes are unlinked; it only finds no significant evidence against it.' }] }
    ],
    model: '<ul><li>Unlinked genes: kernel phenotype probabilities 9/16, 3/16, 3/16, 1/16 (F1 × F1) or 1/4 each (test cross).</li><li>Linked genes with 20 % recombination (20 cM) in coupling (PS / ps): gametes PS and ps 0.4 each, Ps and pS 0.1 each. Each cob is a random sample, so χ² varies from cob to cob.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, raf = null, playing = false, t0 = 0, W = 680, H = 300, seed = 4, res = null;
    api.stage.innerHTML = '<canvas id="cr-cv" width="680" height="300" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="A maize cob with purple and yellow, smooth and wrinkled kernels"></canvas><p class="small" id="cr-cap" style="margin:6px 0;font-weight:700" aria-live="polite"></p><div id="cr-tab"></div>';
    var cv = api.stage.querySelector('#cr-cv'), c = cv.getContext('2d'), cap = api.stage.querySelector('#cr-cap'), tab = api.stage.querySelector('#cr-tab');
    function makeCob(v) { var r = rng(seed), p = probs(v.cross, v.link), k = []; for (var i = 0; i < v.n; i++) { var u = r(), j = 0, acc = p[0]; while (u > acc && j < 3) { j++; acc += p[j]; } k.push(j); } var obs = [0, 0, 0, 0]; k.forEach(function (j) { obs[j]++; }); var exp = (v.link === 'un' || true) ? probs(v.cross, 'un').map(function (x) { return x * v.n; }) : null; return { k: k, obs: obs, exp: exp, chi: chi(obs, exp) }; }
    function draw(el) {
      var v = api.vals(); c.clearRect(0, 0, W, H); var n = res ? res.k.length : v.n, shown = res ? Math.floor(n * el) : 0, cols = Math.ceil(n / 16);
      c.fillStyle = '#d9f99d'; c.beginPath(); c.ellipse(240, 150, 225, 95, 0, 0, 7); c.fill();
      var cnt = [0, 0, 0, 0];
      for (var i = 0; i < n; i++) { var col = Math.floor(i / 16), row = i % 16, x = 40 + col * (400 / cols) + 4, y = 75 + row * 9.5 + Math.abs(col - cols / 2) * 0, j = res ? res.k[i] : -1;
        var shape = Math.sin(((col + 0.5) / cols) * Math.PI); if (Math.abs(row - 7.5) > 7.5 * shape + 1.5) continue;
        if (i < shown && j >= 0) { cnt[j]++; c.fillStyle = j < 2 ? '#7e22ce' : '#facc15'; c.beginPath(); if (j % 2) c.ellipse(x, y, Math.min(4, 200 / cols), 3.2, 0, 0, 7); else c.arc(x, y, Math.min(4.2, 200 / cols), 0, 7); c.fill(); if (j % 2) { c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 2, y - 1); c.lineTo(x + 2, y + 1); c.stroke(); } }
        else { c.fillStyle = '#f5f5f4'; c.beginPath(); c.arc(x, y, Math.min(4, 200 / cols), 0, 7); c.fill(); } }
      c.fillStyle = '#0f172a'; c.font = 'bold 14px system-ui'; c.textAlign = 'left'; c.fillText(CROSS.filter(function (x) { return x[0] === v.cross; })[0][1].split(' (')[0] + ' · ' + (v.link === 'un' ? 'unlinked' : 'linked'), 16, 26);
      var obs = res ? res.obs.map(function (o, i2) { return el >= 1 ? o : cnt[i2]; }) : [0, 0, 0, 0];
      CLASSES.forEach(function (cl, i2) { var y = 70 + i2 * 46; c.fillStyle = i2 < 2 ? '#7e22ce' : '#facc15'; c.beginPath(); c.arc(500, y, 8, 0, 7); c.fill(); c.fillStyle = '#0f172a'; c.font = '12px system-ui'; c.fillText(cl, 515, y - 2); c.font = 'bold 15px system-ui'; c.fillText(String(obs[i2]), 515, y + 16); });
    }
    function showTab() { if (!res) { tab.innerHTML = ''; return; } tab.innerHTML = '<table class="small" style="border-collapse:collapse;margin:6px 0"><tr><th style="padding:3px 8px;text-align:left">Phenotype</th><th style="padding:3px 8px">O</th><th style="padding:3px 8px">E</th><th style="padding:3px 8px">(O − E)² ÷ E</th></tr>' + CLASSES.map(function (cl, i) { return '<tr><td style="padding:3px 8px">' + cl + '</td><td style="padding:3px 8px;text-align:center">' + res.obs[i] + '</td><td style="padding:3px 8px;text-align:center">' + fx(res.exp[i], 1) + '</td><td style="padding:3px 8px;text-align:center">' + fx(Math.pow(res.obs[i] - res.exp[i], 2) / res.exp[i], 2) + '</td></tr>'; }).join('') + '<tr><th colspan="3" style="padding:3px 8px;text-align:right">χ² =</th><th style="padding:3px 8px">' + fx(res.chi, 2) + '</th></tr></table>'; }
    function readings() { if (!res) return api.readings([['χ²', '—'], ['Critical value (3 df, p 0.05)', '7.815']]); api.readings([['Kernels', String(res.k.length)], ['χ²', fx(res.chi, 2)], ['Critical value (3 df, p 0.05)', '7.815'], ['Null hypothesis', res.chi < CRIT3 ? 'accepted' : 'rejected']]); }
    function frame() { var el = Math.min(1, (performance.now() - t0) / 6000); draw(el); if (el >= 1) { playing = false; api.label('run', '▶ Grow and count'); readings(); showTab(); cap.textContent = 'χ² = ' + fx(res.chi, 2) + (res.chi < CRIT3 ? ' < 7.815: no significant difference from the expected ratio (accept the null hypothesis).' : ' > 7.815: significantly different from the expected ratio (reject the null hypothesis).'); api.status('➕ Record, then count another cob.'); return; } if (playing) raf = requestAnimationFrame(frame); }
    api.actions([
      { id: 'run', label: '▶ Grow and count', main: true, fn: function () { if (playing) return; seed++; res = makeCob(api.vals()); playing = true; t0 = performance.now(); api.label('run', '⏳ Counting…'); tab.innerHTML = ''; frame(); } },
      { id: 'rec', label: '➕ Record', fn: function () { if (!res) return api.status('Count a cob first.'); var v = api.vals(); api.record({ cross: v.cross === 'f1' ? 'F1 × F1' : 'Test cross', link: v.link === 'un' ? 'Unlinked' : 'Linked', ps: res.obs[0], pw: res.obs[1], ys: res.obs[2], yw: res.obs[3], chi: +res.chi.toFixed(2), res: res.chi < CRIT3 ? 'accepted' : 'rejected' }); } }
    ]);
    api.onChange = function () { res = null; readings(); showTab(); draw(0); cap.textContent = ''; };
    api.onChange();
    api.status('Press ▶ Grow and count.');
    window.BV_CR = { probs: probs, chi: chi };
  }
})();
