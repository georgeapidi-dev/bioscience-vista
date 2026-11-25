/* Electrolysis laboratory: products, masses and Faraday's law · VistaEd · by George Apidi */
(function () {
  var LABS = window.LABS = window.LABS || {}, F = 96485, VM = 24.0;   // C/mol; dm³/mol at RTP
  // cathode and anode: product, electrons per mole of product, and kind: metal (mass) or gas (volume); sign of mass change
  var CELLS = {
    cuso4c: { name: 'Copper(II) sulfate, copper electrodes', short: 'CuSO₄ / Cu electrodes', ion: '#2563eb', sol: '#bfdbfe',
      cat: { p: 'copper', eq: 'Cu²⁺(aq) + 2e⁻ → Cu(s)', z: 2, M: 63.55, kind: 'metal', sign: 1 }, an: { p: 'copper dissolves', eq: 'Cu(s) → Cu²⁺(aq) + 2e⁻', z: 2, M: 63.55, kind: 'metal', sign: -1 }, keep: true },
    cuso4i: { name: 'Copper(II) sulfate, graphite electrodes', short: 'CuSO₄ / graphite', ion: '#2563eb', sol: '#bfdbfe', fade: true,
      cat: { p: 'copper', eq: 'Cu²⁺(aq) + 2e⁻ → Cu(s)', z: 2, M: 63.55, kind: 'metal', sign: 1 }, an: { p: 'oxygen', eq: '2H₂O(l) → O₂(g) + 4H⁺(aq) + 4e⁻', z: 4, kind: 'gas' } },
    brine: { name: 'Concentrated sodium chloride (brine), graphite', short: 'brine', ion: '#16a34a', sol: '#f1f5f9',
      cat: { p: 'hydrogen', eq: '2H₂O(l) + 2e⁻ → H₂(g) + 2OH⁻(aq)', z: 2, kind: 'gas' }, an: { p: 'chlorine', eq: '2Cl⁻(aq) → Cl₂(g) + 2e⁻', z: 2, kind: 'gas' } },
    h2so4: { name: 'Dilute sulfuric acid, platinum electrodes', short: 'dilute H₂SO₄', ion: '#dc2626', sol: '#f8fafc',
      cat: { p: 'hydrogen', eq: '2H⁺(aq) + 2e⁻ → H₂(g)', z: 2, kind: 'gas' }, an: { p: 'oxygen', eq: '2H₂O(l) → O₂(g) + 4H⁺(aq) + 4e⁻', z: 4, kind: 'gas' } },
    agno3: { name: 'Silver nitrate, silver electrodes', short: 'AgNO₃ / Ag electrodes', ion: '#64748b', sol: '#f8fafc',
      cat: { p: 'silver', eq: 'Ag⁺(aq) + e⁻ → Ag(s)', z: 1, M: 107.87, kind: 'metal', sign: 1 }, an: { p: 'silver dissolves', eq: 'Ag(s) → Ag⁺(aq) + e⁻', z: 1, M: 107.87, kind: 'metal', sign: -1 } }
  };
  function amount(side, Q, eff) { var mol = Q / (side.z * F) * eff; return side.kind === 'metal' ? { mol: mol, val: side.sign * mol * side.M, unit: 'g' } : { mol: mol, val: mol * VM * 1000, unit: 'cm³' }; }
  LABS.electrolysis = {
    id: 'electrolysis', title: 'Electrolysis laboratory: products and Faraday\'s law',
    tags: ['Chemistry', 'Electrochemistry', 'MYP 4–5', 'IB DP R3.2', 'IGCSE', 'A Level'],
    background: '<p>In <b>electrolysis</b> a direct current decomposes an electrolyte. Positive ions (cations) move to the <b>cathode</b> (negative electrode) and gain electrons: <b>reduction</b>. Negative ions (anions) move to the <b>anode</b> (positive electrode) and lose electrons: <b>oxidation</b>.</p>' +
      '<p>In aqueous solutions water can be oxidised or reduced too. At the cathode, a metal less reactive than hydrogen (copper, silver) is deposited; otherwise hydrogen forms. At the anode, a concentrated halide gives the halogen; otherwise oxygen forms. An <b>active</b> anode (copper in copper sulfate) dissolves instead.</p>' +
      '<p><b>Charge:</b> Q = I × t (coulombs = amperes × seconds). One mole of electrons carries one <b>faraday</b>, F = 96 485 C/mol. So moles of product = Q ÷ (z × F), where z is the number of electrons in the half-equation.</p>',
    objectives: ['Predict and explain the products at each electrode for different electrolytes.', 'Write half-equations for oxidation at the anode and reduction at the cathode.', 'Show that the mass of metal deposited is proportional to the charge passed.', 'Use Q = It and F to calculate masses and gas volumes, and estimate the Faraday constant.'],
    rq: 'How does the charge passed (current × time) affect the mass of copper deposited on the cathode in copper(II) sulfate solution?',
    hypPrompt: 'Predict how the mass of copper deposited depends on the current and the time, and give a reason.',
    hypothesis: { marks: 3, points: [
      { re: [/proportional|doubl|directly|linear/], marks: 1, ok: 'Proportional relationship predicted.', miss: 'Say how mass depends on charge (for example, doubling the time doubles the mass).' },
      { re: [/charge|current.*time|q ?= ?it|coulomb/], marks: 1, ok: 'You link it to the charge passed.', miss: 'Link the mass to the charge passed: Q = I × t.' },
      { re: [/electron|cu2\+|cu ?2\+|copper ions?.*(gain|reduc)|reduc/], marks: 1, ok: 'You explain with electrons and reduction.', miss: 'Explain: each Cu²⁺ ion needs 2 electrons to become a copper atom.' }] },
    variables: { iv: 'current (A) and time (s), so the charge passed (C)', dv: 'change in mass of each electrode (g) or volume of gas (cm³)',
      cv: ['electrolyte and its concentration', 'electrode material and size', 'temperature', 'distance between the electrodes'] },
    apparatus: ['Power pack (d.c.) with ammeter and variable resistor', 'Beaker or electrolysis cell; inverted tubes for gases', 'Electrodes: copper, graphite, platinum, silver', 'Balance (±0.001 g)', 'Stopwatch', 'Solutions: copper(II) sulfate, sodium chloride, dilute sulfuric acid, silver nitrate', 'Propanone and a hair dryer to dry the electrodes'],
    safety: ['Wear eye protection. Copper sulfate is harmful; silver nitrate stains skin and is corrosive.', 'Chlorine is toxic: electrolyse brine only for short times in a well-ventilated room or fume cupboard.', 'Keep propanone away from flames. Use low voltages only.'],
    method: ['Choose the electrolyte and electrodes. Weigh the clean, dry electrodes (the model does this).', 'Set the current and the time, then press <b>Switch on</b>.', 'Watch the ions move and the products form. When the time is up the electrodes are washed, dried and reweighed, or the gas volumes read.', 'Press <b>Record trial</b>. Change the time or current one at a time and repeat.', 'Compare electrolytes to see how the products change.'],
    controls: [
      { id: 'cell', label: 'Electrolyte and electrodes', type: 'select', value: 'cuso4c', options: Object.keys(CELLS).map(function (k) { return [k, CELLS[k].name]; }) },
      { id: 'I', label: 'Current', type: 'range', min: 0.1, max: 1.0, step: 0.1, value: 0.5, dp: 1, unit: 'A' },
      { id: 'tmin', label: 'Time', type: 'range', min: 5, max: 40, step: 5, value: 20, unit: 'min' }
    ],
    columns: [
      { key: 'cell', label: 'Electrolyte', num: false, group: true }, { key: 'I', label: 'Current', unit: 'A', dp: 1 }, { key: 't', label: 'Time', unit: 's', dp: 0 }, { key: 'Q', label: 'Charge', unit: 'C', dp: 0 },
      { key: 'cat', label: 'Cathode product', num: false }, { key: 'dc', label: 'Cathode change', unit: 'g or cm³', dp: 3 }, { key: 'an', label: 'Anode product', num: false }, { key: 'da', label: 'Anode change', unit: 'g or cm³', dp: 3 }
    ],
    graph: { x: 'Q', y: 'dc', group: 'cell' },
    hints: ['Plot cathode change against charge for copper sulfate: it should be a straight line through the origin.', 'Q = I × t with t in seconds: 20 minutes = 1200 s.', 'Moles of copper = mass ÷ 63.55. Moles of electrons = 2 × moles of copper. F = Q ÷ moles of electrons.', 'In dilute sulfuric acid the hydrogen volume is twice the oxygen volume: 4 electrons make 2 H₂ but only 1 O₂.'],
    analyse: [
      { id: 'prop', q: 'Describe the relationship between the charge passed and the mass of copper deposited, using your graph.', marks: 2, lines: 3, points: [
        { re: [/proportional|straight line|linear|doubl/], marks: 1, ok: 'Proportional.', miss: 'Describe the shape: a straight line through the origin (proportional).' },
        { re: [/origin|zero|\d/], marks: 1, ok: 'Supported with the graph or data.', miss: 'Use the graph: it passes through the origin, or quote values.' }] },
      { id: 'faraday', q: 'Use one copper sulfate trial to calculate the Faraday constant. Show your working.', marks: 3, lines: 5,
        check: function (ans, ctx) {
          var a = String(ans).toLowerCase(), nums = (a.replace(/,/g, '').match(/\d+(\.\d+)?/g) || []).map(Number), s = 0, fb = [];
          if (!ctx.trials.some(function (r) { return /CuSO₄/.test(r.cell) && r.dc > 0; })) return { score: 0, fb: 'Record a copper sulfate trial first.' };
          if (/63\.5|moles? of copper|mol cu|÷ ?63|\/ ?63/.test(a)) { s++; fb.push('✓ Moles of copper from mass ÷ 63.55.'); } else fb.push('➜ Find moles of copper = mass ÷ 63.55 g/mol.');
          if (/2 ?(×|x|\*)|× ?2|twice|2e|two electrons|moles? of electrons/.test(a)) { s++; fb.push('✓ Two moles of electrons per mole of copper.'); } else fb.push('➜ Moles of electrons = 2 × moles of copper (Cu²⁺ + 2e⁻ → Cu).');
          if (nums.some(function (v) { return v > 90000 && v < 102000; })) { s++; fb.push('✓ About 96 500 C/mol.'); } else fb.push('➜ F = Q ÷ moles of electrons; your answer should be close to 96 500 C/mol.');
          return { score: s, fb: fb.join('<br>') };
        } },
      { id: 'half', q: 'For copper sulfate with copper electrodes, write the half-equations at each electrode and explain why the anode loses as much mass as the cathode gains.', marks: 3, lines: 4, points: [
        { re: [/cu2\+ ?\+ ?2e|cu²⁺ ?\+ ?2e|cathode.*(gain|reduc)/], marks: 1, ok: 'Cathode: Cu²⁺ + 2e⁻ → Cu.', miss: 'Cathode: Cu²⁺(aq) + 2e⁻ → Cu(s) (reduction).' },
        { re: [/cu ?→ ?cu|cu -> ?cu|anode.*(oxidi|dissolv|lose)/], marks: 1, ok: 'Anode: Cu → Cu²⁺ + 2e⁻.', miss: 'Anode: Cu(s) → Cu²⁺(aq) + 2e⁻ (oxidation: the copper dissolves).' },
        { re: [/same (number of )?electrons|same charge|equal|every electron/], marks: 1, ok: 'Same number of electrons at each electrode.', miss: 'Explain: the same charge flows through both electrodes, so equal moles of copper are removed and deposited.' }] },
      { id: 'brine', q: 'Explain why electrolysing concentrated brine gives hydrogen, not sodium, at the cathode.', marks: 2, lines: 3, points: [
        { re: [/reactiv|more easily reduc|less easily reduc|electrode potential|e ?°|sodium.*(more reactive|above hydrogen)/], marks: 1, ok: 'Reactivity / ease of reduction used.', miss: 'Sodium is more reactive than hydrogen, so water (H⁺) is reduced more easily than Na⁺.' },
        { re: [/water|h\+|h2o/], marks: 1, ok: 'Water is reduced.', miss: 'Say what is reduced instead: water, 2H₂O + 2e⁻ → H₂ + 2OH⁻.' }] }
    ],
    evaluate: [
      { id: 'err', q: 'Why might the measured gain in mass of the cathode be lower than the theoretical value in a real experiment?', marks: 2, lines: 3, points: [
        { re: [/flak|fall|loose|brush|wash/], marks: 1, ok: 'Copper flakes off.', miss: 'Loosely attached copper can fall off when the electrode is washed.' },
        { re: [/current (vary|change|fluctuat|not constant)|ammeter|not dry|wet|propanone|side reaction|hydrogen/], marks: 1, ok: 'A second valid reason.', miss: 'The current may drift, or side reactions (hydrogen) use some charge.' }] },
      { id: 'lim', q: 'Give one simplification in this model.', marks: 1, lines: 2, points: [
        { re: [/constant|perfect|100 ?%|efficien|ideal|instant|temperature|resistance|dissolv/], marks: 1, ok: 'A valid simplification.', miss: 'For example: the current is perfectly constant and nearly all the charge makes the main product.' }] }
    ],
    model: '<ul><li>Charge Q = I × t. Moles of product = Q ÷ (z F) × efficiency, with F = 96 485 C/mol and z from the half-equation.</li><li>Metals: mass = moles × molar mass (Cu 63.55, Ag 107.87 g/mol). Gases: volume = moles × 24.0 dm³/mol (room temperature and pressure); gases are treated as insoluble.</li>' +
      '<li>Current efficiency is 98–100 % for each run, and the balance reads to ±0.001 g. The current is held constant.</li><li>In copper sulfate with graphite electrodes the blue colour fades as Cu²⁺ ions are removed; with copper electrodes it stays the same.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var raf = 0, run = null, ions = [];
    api.stage.innerHTML = '<canvas id="el-cv" style="width:100%;height:270px;display:block;border-radius:12px;background:#f8fafc" role="img" aria-label="Electrolysis cell with moving ions"></canvas><div id="el-eq" class="vl-note" style="margin-top:6px"></div>';
    var cv = api.stage.querySelector('#el-cv'), eqs = api.stage.querySelector('#el-eq');
    function build() { ions = []; for (var i = 0; i < 26; i++) ions.push({ x: Math.random(), y: Math.random(), pos: i % 2 === 0 }); }
    function draw(f, on) {
      var v = api.vals(), C = CELLS[v.cell], dpr = window.devicePixelRatio || 1, W = cv.clientWidth || 520, H = 270; cv.width = W * dpr; cv.height = H * dpr;
      var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
      var bx = W * 0.15, bw = W * 0.7, by = 80, bh = 170, cx = bx + bw * 0.25, ax = bx + bw * 0.75;
      // wires and power pack
      c.strokeStyle = '#334155'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, by - 10); c.lineTo(cx, 30); c.lineTo(W / 2 - 30, 30); c.moveTo(W / 2 + 30, 30); c.lineTo(ax, 30); c.lineTo(ax, by - 10); c.stroke();
      c.fillStyle = on ? '#fde68a' : '#e2e8f0'; c.fillRect(W / 2 - 30, 16, 60, 28); c.fillStyle = '#0f172a'; c.font = '12px system-ui'; c.textAlign = 'center'; c.fillText(on ? v.I.toFixed(1) + ' A' : 'off', W / 2, 35);
      c.fillText('− cathode', cx, 62); c.fillText('anode +', ax, 62);
      // solution
      var col = C.sol; if (C.fade) { var a = Math.max(0.25, 1 - f * 0.6); col = 'rgba(147,197,253,' + a + ')'; }
      c.fillStyle = col; c.fillRect(bx, by + 30, bw, bh - 30); c.strokeStyle = '#334155'; c.strokeRect(bx, by, bw, bh);
      // electrodes
      var metalC = C.cat.kind === 'metal', metalA = C.an.kind === 'metal';
      c.fillStyle = '#475569'; c.fillRect(cx - 7, by - 10, 14, bh - 20); c.fillRect(ax - 7, by - 10, 14, bh - 20);
      if (metalC) { c.fillStyle = C.cat.p === 'silver' ? '#cbd5e1' : '#b45309'; c.fillRect(cx - 7 - 4 * f, by + 30, 14 + 8 * f, bh - 50); }
      if (metalA) { c.fillStyle = C.an.p.indexOf('silver') === 0 ? '#cbd5e1' : '#b45309'; c.fillRect(ax - 7 + 3 * f, by + 30, Math.max(4, 14 - 6 * f), bh - 50); }
      // ions
      ions.forEach(function (p) {
        if (on) { p.x += (p.pos ? -1 : 1) * 0.004 * v.I * 2 + (Math.random() - .5) * 0.006; p.y += (Math.random() - .5) * 0.01; if (p.x < 0.05) p.x = 0.95; if (p.x > 0.95) p.x = 0.05; p.y = Math.max(0.05, Math.min(0.95, p.y)); }
        var X = bx + 20 + p.x * (bw - 40), Y = by + 40 + p.y * (bh - 60);
        c.fillStyle = p.pos ? C.ion : '#7c3aed'; c.beginPath(); c.arc(X, Y, 6, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 10px system-ui'; c.fillText(p.pos ? '+' : '−', X, Y + 3.5);
      });
      // gas bubbles
      if (on) [[C.cat, cx], [C.an, ax]].forEach(function (s) { if (s[0].kind !== 'gas') return; c.strokeStyle = '#334155'; c.lineWidth = 1; for (var b = 0; b < (s[0].p === 'oxygen' && C.cat.p === 'hydrogen' ? 3 : 6); b++) { var yy = by + 40 + ((performance.now() / 12 + b * 37) % (bh - 60)); c.beginPath(); c.arc(s[1] + 12 + (b % 2) * 5, by + bh - (yy - by), 2.5, 0, 7); c.stroke(); } });
      c.fillStyle = '#0f172a'; c.font = '12px system-ui'; c.textAlign = 'left'; c.fillText(C.short, bx, by + bh + 16);
      eqs.innerHTML = '<b>Cathode (reduction):</b> ' + C.cat.eq + ' &nbsp; · &nbsp; <b>Anode (oxidation):</b> ' + C.an.eq;
    }
    function idle() { cancelAnimationFrame(raf); build(); (function loop() { draw(0, false); raf = requestAnimationFrame(loop); })(); api.readings([['Current', '0 A'], ['Time', '0 s'], ['Charge', '0 C']]); api.status('Choose the cell, current and time, then press Switch on.'); api.enable('rec', false); }
    function start() {
      cancelAnimationFrame(raf); build();
      var v = api.vals(), C = CELLS[v.cell], t = v.tmin * 60, eff = 0.98 + Math.random() * 0.02, t0 = performance.now(), dur = 6000;
      run = { v: v, C: C, t: t, eff: eff }; api.enable('start', false); api.enable('rec', false); api.status('Current flowing… (' + v.tmin + ' minutes shown in 6 seconds)');
      (function loop() {
        var f = Math.min(1, (performance.now() - t0) / dur), Q = v.I * t * f, ca = amount(C.cat, Q, eff), an = amount(C.an, Q, eff);
        draw(f, f < 1);
        api.readings([['Current', v.I.toFixed(1) + ' A'], ['Time', Math.round(t * f) + ' s'], ['Charge', Math.round(Q) + ' C'], ['Cathode: ' + C.cat.p, (ca.val >= 0 ? '+' : '') + ca.val.toFixed(ca.unit === 'g' ? 3 : 1) + ' ' + ca.unit], ['Anode: ' + C.an.p, (an.val >= 0 && an.unit === 'g' ? '+' : '') + an.val.toFixed(an.unit === 'g' ? 3 : 1) + ' ' + an.unit]]);
        if (f < 1) raf = requestAnimationFrame(loop);
        else { run.ca = ca; run.an = an; run.Q = v.I * t; api.enable('start', true); api.enable('rec', true); api.status('Switched off. Electrodes washed, dried and weighed. Press Record trial.'); (function idl() { draw(1, false); raf = requestAnimationFrame(idl); })(); }
      })();
    }
    api.actions([
      { id: 'start', label: '⚡ Switch on', main: true, fn: start },
      { id: 'stop', label: '■ Reset', fn: function () { run = null; api.enable('start', true); idle(); } },
      { id: 'rec', label: '➕ Record trial', fn: function () {
        if (!run || !run.ca) return; var r = run, noise = function (x, u) { return u === 'g' ? +(x + (Math.random() - .5) * 0.002).toFixed(3) : +(x + (Math.random() - .5) * 0.6).toFixed(1); };
        api.record({ cell: r.C.short, I: r.v.I, t: r.t, Q: Math.round(r.Q), cat: r.C.cat.p + (r.ca.unit === 'g' ? ' (mass)' : ' (gas)'), dc: noise(r.ca.val, r.ca.unit), an: r.C.an.p + (r.an.unit === 'g' ? ' (mass)' : ' (gas)'), da: noise(r.an.val, r.an.unit) });
        api.enable('rec', false);
      } }
    ]);
    api.onChange = function (v, id) { if (id) { run = null; api.enable('start', true); idle(); } };
    api.onShow = function () { if (!run) idle(); };
    idle();
  }
})();
