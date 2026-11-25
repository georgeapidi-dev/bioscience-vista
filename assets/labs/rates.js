/* Rates of reaction laboratory: marble chips and hydrochloric acid · VistaEd · by George Apidi */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var AREA = { large: ['Large chips', 1], medium: ['Medium chips', 1.6], small: ['Small chips', 2.6], powder: ['Powder', 8] };
  var MASS = 0.40, VMAX = MASS / 100.09 * 24000;   // 0.40 g CaCO3 → 0.0040 mol → 95.9 cm³ CO2 at RTP (acid in excess)
  function k(v) { return 0.0108 * v.c * AREA[v.size][1] * Math.exp(50000 / 8.314 * (1 / 298.15 - 1 / (v.T + 273.15))); }
  LABS.rates = {
    id: 'rates', title: 'Rates of reaction laboratory: marble chips and acid',
    tags: ['Chemistry', 'Rates of reaction', 'MYP 4–5', 'IB DP R2.2', 'IGCSE', 'A Level'],
    background: '<p>Calcium carbonate (marble) reacts with hydrochloric acid: CaCO₃(s) + 2HCl(aq) → CaCl₂(aq) + H₂O(l) + CO₂(g). Collecting the carbon dioxide in a <b>gas syringe</b> lets you follow the reaction.</p>' +
      '<p><b>Collision theory:</b> particles react only when they collide with the correct orientation and with at least the <b>activation energy</b>. The rate rises when collisions are more frequent or more of them are successful.</p>' +
      '<ul><li><b>Concentration:</b> more acid particles in the same volume, so more frequent collisions.</li><li><b>Surface area:</b> smaller pieces expose more particles to the acid.</li><li><b>Temperature:</b> particles move faster, collide more often and many more have energy ≥ E<sub>a</sub> (the Maxwell–Boltzmann distribution shifts). A 10 °C rise roughly doubles this rate.</li></ul>' +
      '<p>The <b>initial rate</b> is the gradient of the volume–time graph at t = 0. The total volume depends only on the amount of the limiting reactant (here the marble, with the acid in excess).</p>',
    objectives: ['Follow a reaction by measuring the volume of gas produced over time.', 'Find an initial rate from the gradient of a volume–time graph.', 'Explain the effects of concentration, surface area and temperature using collision theory.', 'Use a rate–concentration graph to deduce the order of reaction with respect to the acid.'],
    rq: 'How does the concentration of hydrochloric acid affect the initial rate of reaction with marble chips? (Then test surface area and temperature.)',
    hypPrompt: 'Predict how the initial rate changes as the acid concentration increases, and explain using collision theory.',
    hypothesis: { marks: 3, points: [
      { re: [/increase|faster|higher|more/], marks: 1, ok: 'You predict a faster rate.', miss: 'Say whether the rate increases or decreases.' },
      { re: [/collision|collide/], marks: 1, ok: 'You use collisions.', miss: 'Mention collisions between acid particles and the marble surface.' },
      { re: [/frequen|more often|per second|per unit time|more particles in|closer/], marks: 1, ok: 'You link concentration to collision frequency.', miss: 'Explain: more particles per unit volume means more frequent collisions.' }] },
    variables: { iv: 'concentration of hydrochloric acid (mol/dm³)', dv: 'volume of carbon dioxide collected (cm³) over time; initial rate (cm³/s)',
      cv: ['mass of marble (0.40 g) and chip size', 'volume of acid (50.0 cm³)', 'temperature of the acid', 'the same gas syringe, sealed apparatus'] },
    apparatus: ['Conical flask with bung and delivery tube', '100 cm³ gas syringe and clamp', 'Balance (±0.01 g)', 'Measuring cylinder (50 cm³)', 'Stopwatch', 'Water bath and thermometer', 'Marble chips of different sizes and powdered calcium carbonate', 'Hydrochloric acid 0.50–2.00 mol/dm³'],
    safety: ['Wear eye protection: hydrochloric acid is an irritant (corrosive above 2 mol/dm³).', 'Check the gas syringe plunger moves freely and is clamped; do not let it be pushed out.', 'Wipe up spills at once and wash skin with plenty of water.'],
    method: ['Choose the acid concentration, chip size and temperature.', 'Press <b>Start</b>: 0.40 g of marble drops into 50.0 cm³ of acid and the bung goes in.', 'Watch the gas syringe and the live graph (the first 3 minutes are shown in 9 seconds).', 'Press <b>Record trial</b> to save the volume at each time and the initial rate.', 'Repeat each concentration twice, then change one variable at a time.'],
    controls: [
      { id: 'c', label: 'Acid concentration', type: 'range', min: 0.5, max: 2, step: 0.25, value: 1, dp: 2, unit: 'mol/dm³' },
      { id: 'size', label: 'Size of the marble pieces', type: 'select', value: 'medium', options: [['large', 'Large chips'], ['medium', 'Medium chips'], ['small', 'Small chips'], ['powder', 'Powder']] },
      { id: 'T', label: 'Temperature', type: 'range', min: 15, max: 55, step: 5, value: 25, unit: '°C' }
    ],
    columns: [
      { key: 'series', label: 'Set', num: false, group: true }, { key: 'c', label: 'Acid conc.', unit: 'mol/dm³', dp: 2 }, { key: 'size', label: 'Pieces', num: false, group: true }, { key: 'T', label: 'Temperature', unit: '°C', dp: 0 },
      { key: 'v30', label: 'Volume at 30 s', unit: 'cm³', dp: 1 }, { key: 'v60', label: 'Volume at 60 s', unit: 'cm³', dp: 1 }, { key: 'v180', label: 'Volume at 180 s', unit: 'cm³', dp: 1 }, { key: 'rate', label: 'Initial rate', unit: 'cm³/s', dp: 2 }
    ],
    graph: { x: 'c', y: 'rate', group: 'size' },
    hints: ['Keep the chip size and temperature the same while you change the concentration.', 'The initial rate is the steepest part of the curve, at the very start.', 'If doubling the concentration doubles the initial rate, the reaction is first order with respect to the acid.', 'The final volume is the same for every concentration: the marble is the limiting reactant.'],
    analyse: [
      { id: 'trend', q: 'Describe the effect of acid concentration on the initial rate, using values from your table.', marks: 2, lines: 3, points: [
        { re: [/increas|higher|faster|more/], marks: 1, ok: 'Trend stated.', miss: 'State the trend: higher concentration, higher initial rate.' },
        { re: [/\d/], marks: 1, ok: 'Values quoted.', miss: 'Quote values from your table.' }] },
      { id: 'order', q: 'Use your rate–concentration graph to deduce the order of reaction with respect to hydrochloric acid. Explain.', marks: 2, lines: 3, points: [
        { re: [/first|1st|order (of )?1|order one/], marks: 1, ok: 'First order.', miss: 'Name the order (look at the shape of rate against concentration).' },
        { re: [/straight|proportional|doubl|linear|through (the )?origin/], marks: 1, ok: 'Proportional: a straight line through the origin.', miss: 'Explain: rate is proportional to concentration (straight line through the origin; doubling c doubles the rate).' }] },
      { id: 'vmax', q: 'What is the final volume of gas? Why is it the same for every concentration?', marks: 2, lines: 3, points: [
        { re: [/9[4-7]|96/], marks: 1, ok: 'About 96 cm³.', miss: 'Read the final volume: about 96 cm³.' },
        { re: [/limiting|excess|same (mass|amount) of (marble|calcium carbonate)|marble.*used up/], marks: 1, ok: 'Marble is limiting.', miss: 'Explain: the acid is in excess, so the amount of marble (0.40 g) decides how much CO₂ forms.' }] },
      { id: 'temp', q: 'Explain, using the Maxwell–Boltzmann distribution, why raising the temperature increases the rate so much.', marks: 3, lines: 4, points: [
        { re: [/activation energy|e ?a\b/], marks: 1, ok: 'Activation energy used.', miss: 'Mention the activation energy.' },
        { re: [/more (particles|molecules).*(energy|e ?a)|greater (proportion|fraction)|area under/], marks: 1, ok: 'More particles have E ≥ Ea.', miss: 'Say a greater proportion of particles have energy ≥ Ea.' },
        { re: [/more (frequent|often)|faster|frequency/], marks: 1, ok: 'More frequent collisions.', miss: 'Add: particles move faster, so collide more often (a smaller effect).' }] }
    ],
    evaluate: [
      { id: 'err', q: 'Give two sources of error in the real experiment and how to reduce each.', marks: 2, lines: 4, points: [
        { re: [/gas (escap|lost|leak)|before (the )?bung|delay|bung/], marks: 1, ok: 'Gas lost before sealing.', miss: 'Gas escapes before the bung is in: use a divided flask or tip the chips in from a tube on a thread.' },
        { re: [/chip (size|surface)|uneven|same size|mass|syringe (stick|friction)|temperature (change|rise)|exothermic|reading/], marks: 1, ok: 'A second valid source.', miss: 'Chips are never identical in size: use a powder or weigh and sort chips; syringes can stick.' }] },
      { id: 'lim', q: 'Give one simplification in this model compared with a real experiment.', marks: 1, lines: 2, points: [
        { re: [/acid (conc|used)|constant|exothermic|temperature|shape|uniform|ideal|solubility|dissolv|instant/], marks: 1, ok: 'A valid simplification.', miss: 'For example: the acid concentration and temperature are treated as constant, and every chip is identical.' }] }
    ],
    model: '<ul><li>Volume of CO₂: V(t) = V<sub>max</sub>(1 − e<sup>−kt</sup>), with V<sub>max</sub> = 0.40 g ÷ 100.09 g/mol × 24 000 cm³/mol = 95.9 cm³ (gas at room temperature and pressure).</li>' +
      '<li>k = k₀ × [HCl] × (surface-area factor) × e<sup>−Ea/R (1/T − 1/298 K)</sup> with E<sub>a</sub> = 50 kJ/mol, so the reaction is first order in acid and the rate about doubles every 10 °C.</li>' +
      '<li>Surface-area factors: large 1, medium 1.6, small 2.6, powder 8 (relative). The acid is in excess, so its concentration is treated as constant.</li>' +
      '<li>Each reading has a small random error (±0.5 cm³) and the rate a ±3 % run-to-run variation.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var raf = 0, run = null, last = null, bubbles = [];
    api.stage.innerHTML = '<svg viewBox="0 0 420 200" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Flask of acid connected to a gas syringe" id="rt-sv"></svg><canvas class="vl-chart" id="rt-ch" style="height:240px;margin-top:8px"></canvas>';
    var sv = api.stage.querySelector('#rt-sv'), ch = api.stage.querySelector('#rt-ch');
    function draw(V, live) {
      var v = api.vals(), fill = '#dbeafe', piece = v.size === 'powder' ? 1.6 : v.size === 'small' ? 4 : v.size === 'medium' ? 6 : 9, h = '';
      h += '<path d="M70,40 l0,40 l-40,80 q-4,10 8,10 l104,0 q12,0 8,-10 l-40,-80 l0,-40 z" fill="#fff" stroke="#334155" stroke-width="2"/>';
      h += '<path d="M44,130 l92,0 l18,30 q4,10 -8,10 l-112,0 q-12,0 -8,-10 z" fill="' + fill + '"/>';
      if (live) { for (var i = 0; i < (v.size === 'powder' ? 30 : 6); i++) h += '<circle cx="' + (60 + (i * 37) % 64) + '" cy="' + (160 - (i * 7) % 12) + '" r="' + piece * (1 - V / VMAX * 0.9) + '" fill="#e5e7eb" stroke="#64748b"/>'; }
      bubbles.forEach(function (b) { h += '<circle cx="' + b.x + '" cy="' + b.y + '" r="' + b.r + '" fill="none" stroke="#475569" stroke-width="1"/>'; });
      h += '<rect x="64" y="30" width="32" height="12" rx="3" fill="#78350f"/><path d="M80,30 l0,-14 l150,0 l0,30" stroke="#334155" stroke-width="3" fill="none"/>';
      var px = 240 + V * 1.5;
      h += '<rect x="230" y="38" width="160" height="22" rx="4" fill="#fff" stroke="#334155" stroke-width="2"/>';
      for (var g = 0; g <= 100; g += 10) h += '<line x1="' + (240 + g * 1.5) + '" y1="38" x2="' + (240 + g * 1.5) + '" y2="' + (g % 50 ? 44 : 48) + '" stroke="#334155"/>' + (g % 50 ? '' : '<text x="' + (240 + g * 1.5) + '" y="74" font-size="10" text-anchor="middle">' + g + '</text>');
      h += '<rect x="232" y="40" width="' + (px - 232) + '" height="18" fill="#fef3c7" opacity=".8"/><rect x="' + px + '" y="36" width="5" height="26" fill="#334155"/><line x1="' + (px + 5) + '" y1="49" x2="' + (px + 30) + '" y2="49" stroke="#334155" stroke-width="3"/>';
      h += '<text x="310" y="100" font-size="13" text-anchor="middle" font-weight="700">' + V.toFixed(1) + ' cm³ CO₂</text><text x="310" y="118" font-size="11" text-anchor="middle" fill="#475569">' + v.c.toFixed(2) + ' mol/dm³ HCl · ' + AREA[v.size][0].toLowerCase() + ' · ' + v.T + ' °C</text>';
      sv.innerHTML = h;
    }
    function series(pts) { return (last ? [{ name: 'last run', pts: last.pts, color: '#94a3b8', dash: true }] : []).concat(pts ? [{ name: 'this run', pts: pts, color: '#0072B2' }] : [{ pts: [] }]); }
    function chart(pts) { api.chart(ch, { xLabel: 'Time / s', yLabel: 'Volume of CO₂ / cm³', xmin: 0, xmax: 180, ymin: 0, ymax: 100, series: series(pts) }); }
    function idle() { cancelAnimationFrame(raf); bubbles = []; draw(0, false); chart(null); api.readings([['Time', '0 s'], ['Gas collected', '0.0 cm³'], ['Max possible', VMAX.toFixed(1) + ' cm³']]); api.status('Choose the conditions, then press Start.'); api.enable('rec', false); }
    function start() {
      cancelAnimationFrame(raf);
      var v = api.vals(), kk = k(v) * (1 + (Math.random() * 2 - 1) * 0.03), pts = [];
      for (var t = 0; t <= 180; t++) pts.push([t, Math.min(VMAX, VMAX * (1 - Math.exp(-kk * t)) + (t ? (Math.random() - .5) : 0))]);
      run = { v: v, pts: pts, rate: VMAX * kk }; api.enable('start', false); api.enable('rec', false); api.status('Reaction running… (3 minutes shown in 9 seconds)');
      var t0 = performance.now(), dur = 9000;
      (function loop() {
        var f = Math.min(1, (performance.now() - t0) / dur), t = Math.round(f * 180), V = pts[t][1], rnow = VMAX * kk * Math.exp(-kk * t);
        if (Math.random() < Math.min(0.9, rnow / 2)) bubbles.push({ x: 60 + Math.random() * 60, y: 160, r: 1.5 + Math.random() * 2 });
        bubbles.forEach(function (b) { b.y -= 2.2; }); bubbles = bubbles.filter(function (b) { return b.y > 132; });
        draw(V, true); chart(pts.slice(0, t + 1));
        api.readings([['Time', t + ' s'], ['Gas collected', V.toFixed(1) + ' cm³'], ['Rate now', rnow.toFixed(2) + ' cm³/s'], ['Max possible', VMAX.toFixed(1) + ' cm³']]);
        if (f < 1) raf = requestAnimationFrame(loop); else { api.enable('start', true); api.enable('rec', true); api.status('Finished. Initial rate ≈ ' + run.rate.toFixed(2) + ' cm³/s. Press Record trial.'); }
      })();
    }
    api.actions([
      { id: 'start', label: '▶ Start', main: true, fn: start },
      { id: 'stop', label: '■ Reset', fn: function () { if (run) last = run; run = null; api.enable('start', true); idle(); } },
      { id: 'rec', label: '➕ Record trial', fn: function () {
        if (!run) return; var v = run.v, p = run.pts;
        api.record({ series: AREA[v.size][0] + ', ' + v.T + ' °C', c: v.c, size: AREA[v.size][0], T: v.T, v30: +p[30][1].toFixed(1), v60: +p[60][1].toFixed(1), v180: +p[180][1].toFixed(1), rate: +run.rate.toFixed(3) });
        last = run; api.enable('rec', false);
      } }
    ]);
    api.onChange = function (v, id) { if (id) { if (run) last = run; run = null; api.enable('start', true); idle(); } };
    api.onShow = function () { if (!run) idle(); };
    idle();
  }
})();
