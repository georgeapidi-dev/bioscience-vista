/* Population growth laboratory · BioscienceVista · by George Apidi
   IB DP C4.1.7–C4.1.8: grow yeast in a flask (count cells with a haemocytometer) or duckweed in a beaker (count fronds). Change the food,
   temperature and starting number; plot the growth curve on normal and logarithmic scales and find the carrying capacity. */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var ORG = { yeast: { name: 'Yeast in glucose solution', unit: 'thousand cells per mm³', K: 120, r: 0.42, n0: 1, tmax: 48, tu: 'h', step: 4 }, duck: { name: 'Duckweed (Lemna) in a beaker', unit: 'fronds', K: 400, r: 0.23, n0: 6, tmax: 35, tu: 'days', step: 3 } };
  var OL = [['yeast', 'Yeast in glucose solution (haemocytometer)'], ['duck', 'Duckweed in a beaker (count fronds)']];

  function model(o) {   // o: {org, food (%), T, n0, t}
    var O = ORG[o.org], K = O.K * Math.min(1.6, o.food / 2), tf = Math.exp(-Math.pow((o.T - (o.org === 'yeast' ? 30 : 25)) / 10, 2)), r = O.r * tf, n0 = o.n0 * O.n0;
    var N = K / (1 + (K - n0) / n0 * Math.exp(-r * o.t));
    if (o.org === 'yeast' && o.t > 30) N *= Math.max(0.55, 1 - (o.t - 30) * 0.012 * (o.food < 2 ? 1.5 : 1));   // decline: ethanol builds up, food runs out
    var phase = N < K * 0.08 ? 'lag/exponential phase' : N < K * 0.85 ? 'exponential → transitional phase' : 'plateau (stationary) phase';
    if (o.org === 'yeast' && o.t > 34) phase = 'decline: ethanol and lack of glucose';
    return { N: N, K: K, r: r, phase: phase, dbl: r ? Math.log(2) / r : Infinity };
  }

  LABS.popgrowth = {
    id: 'popgrowth', title: 'Population growth laboratory: yeast and duckweed',
    tags: ['Biology', 'Ecology', 'IB DP C4.1.7 growth curves', 'IB DP C4.1.8 sigmoid curve', 'A Level'],
    background: '<p>When a few individuals colonise a new environment with plenty of resources, the population grows <b>exponentially</b>: each generation is a constant multiple of the last, because births greatly exceed deaths. On a graph with a <b>logarithmic scale</b> for population size, exponential growth is a <b>straight line</b>.</p>' +
      '<p>As the population grows, <b>density-dependent limiting factors</b> increase: competition for food, space and light, build-up of toxic wastes (ethanol for yeast), predation and disease. Growth slows (<b>transitional phase</b>) until births equal deaths at the <b>carrying capacity (K)</b>, the largest population the environment can support: a <b>sigmoid (S-shaped) curve</b>. In a closed flask, yeast may then <b>decline</b> as food runs out and ethanol accumulates.</p>' +
      '<p>Yeast cells are counted with a <b>haemocytometer</b>, a slide with a grid of known volume: count the cells in several squares and scale up (with dilution). Duckweed (<i>Lemna</i>) is easy to count as fronds floating on the surface.</p>',
    objectives: ['Collect data on population growth of yeast or duckweed over time.', 'Plot the growth on normal and logarithmic scales and identify exponential growth.', 'Identify the phases of a sigmoid curve and the carrying capacity.', 'Explain how limiting factors such as food and temperature change the curve.'],
    rq: 'How does the concentration of glucose (1–4 %) affect the carrying capacity of a yeast population over 48 hours?',
    hypPrompt: 'Predict the shape of the growth curve and how more glucose changes it.',
    hypothesis: { marks: 3, points: [
      { re: [/s.?shape|sigmoid|level|plateau|exponential/], marks: 1, ok: 'You predict a sigmoid curve.', miss: 'Describe the shape you expect.' },
      { re: [/more glucose.*(higher|larger|more)|higher (carrying capacity|k|plateau)/], marks: 1, ok: 'More glucose raises the carrying capacity.', miss: 'Say how more glucose changes the plateau.' },
      { re: [/food|resource|competition|limit|ethanol|toxic/], marks: 1, ok: 'You explain with limiting factors.', miss: 'Explain using limiting factors such as food.' }] },
    variables: { iv: 'glucose concentration (%) (or nutrient level for duckweed)', dv: 'population size (yeast cells per mm³ or number of fronds) over time', cv: ['temperature', 'starting number of cells or fronds', 'volume of culture and size of beaker', 'light (duckweed)', 'counting method (same haemocytometer squares)'] },
    apparatus: ['Yeast suspension, glucose solutions, conical flasks with cotton wool bungs, water bath', 'Haemocytometer, coverslip, microscope, methylene blue (to tell dead cells)', 'Duckweed, beakers of pond water with a nutrient solution, a lamp', 'Spreadsheet to plot normal and log graphs'],
    safety: ['Use aseptic technique and disinfect cultures before disposal.', 'Glass haemocytometers and coverslips are fragile.'],
    method: ['Choose yeast, 2 % glucose, 30 °C and a starting number of 1 unit.', 'Press <b>▶ Grow</b>: watch the culture and the count rise; samples are taken at regular times.', 'Press <b>➕ Record samples</b> to put each sample in the results table.', 'Repeat at 1, 3 and 4 % glucose and other temperatures; try duckweed. In 4 Results plot population against time; then switch the graph to a log scale (use log₁₀ column).'],
    controls: [
      { id: 'org', label: 'Organism', type: 'select', value: 'yeast', options: OL },
      { id: 'food', label: 'Glucose (yeast) or nutrient (duckweed)', min: 1, max: 4, step: 0.5, value: 2, dp: 1, unit: '%' },
      { id: 'T', label: 'Temperature', min: 10, max: 40, step: 5, value: 30, unit: '°C' },
      { id: 'n0', label: 'Starting number (× normal)', min: 0.5, max: 4, step: 0.5, value: 1, dp: 1 }
    ],
    columns: [
      { key: 'org', label: 'Organism', num: false, group: true }, { key: 'food', label: 'Food', unit: '%', dp: 1, group: true }, { key: 'T', label: 'Temperature', unit: '°C', dp: 0 },
      { key: 't', label: 'Time', unit: 'h or days', dp: 0 }, { key: 'N', label: 'Population', dp: 1 }, { key: 'logN', label: 'log₁₀ population', dp: 2 }
    ],
    graph: { x: 't', y: 'N', group: 'food' },
    hints: ['Exponential growth is a straight line on a log scale.', 'Carrying capacity: where the curve levels off.', 'Why might the yeast population fall at the end, in a closed flask?', 'Temperature changes the growth rate r more than the carrying capacity.'],
    analyse: [
      { id: 'K', q: 'Estimate the carrying capacity of yeast at 2 % glucose and 30 °C (in thousand cells per mm³).', marks: 1, lines: 1, number: { value: function () { return ORG.yeast.K * 1; }, tol: 0.12, dp: 0 } },
      { id: 'log', q: 'Describe the shape of your graph on the log scale during the first hours, and explain what it shows.', marks: 2, lines: 3, points: [
        { re: [/straight|linear/], marks: 1, ok: 'A straight line.', miss: 'Describe the shape on the log scale.' }, { re: [/exponential|constant (rate|proportion)|doubl/], marks: 1, ok: 'It shows exponential growth.', miss: 'Explain: a straight line on a log scale shows exponential growth.' }] },
      { id: 'phases', q: 'Name the phases of the sigmoid curve and explain why growth slows down.', marks: 3, lines: 5, points: [
        { re: [/exponential|log phase/], marks: 1, ok: 'Exponential phase.', miss: 'Name the exponential phase.' }, { re: [/transition|plateau|stationary/], marks: 1, ok: 'Transitional and plateau phases.', miss: 'Name the transitional and plateau phases.' },
        { re: [/compet|food|glucose|resource|ethanol|toxic|waste|density.dependent/], marks: 1, ok: 'Density-dependent limiting factors increase.', miss: 'Explain with limiting factors: competition for food, build-up of ethanol.' }] }
    ],
    evaluate: [
      { id: 'haem', q: 'Suggest two sources of error when counting yeast with a haemocytometer, and how to reduce them.', marks: 2, lines: 4, points: [
        { re: [/clump|bud|mix|shake|settle|uneven/], marks: 1, ok: 'Clumping or settling: mix well before sampling.', miss: 'For example: cells clump or settle — mix the flask before each sample.' },
        { re: [/dead|methylene|edge|boundar|squares|dilut|count (more|several)|repeat/], marks: 1, ok: 'A second valid error and fix.', miss: 'For example: dead cells counted (use methylene blue), cells on the lines (count two sides only), count several squares.' }] },
      { id: 'model', q: 'Explain why a flask of yeast is only a simple model of population growth in nature.', marks: 1, lines: 2, points: [
        { re: [/closed|no (migration|predat|disease)|single species|one species|constant|controlled|not natural|batch/], marks: 1, ok: 'Valid.', miss: 'For example: it is closed (no immigration, emigration or new food), and has no predators or other species.' }] }
    ],
    model: '<ul><li>Logistic growth N = K ÷ (1 + ((K − N₀) ÷ N₀) e<sup>−rt</sup>). Yeast: K = 120 thousand cells per mm³ × glucose ÷ 2 % (max ×1.6), r = 0.42 per hour at 30 °C. Duckweed: K = 400 fronds, r = 0.23 per day at 25 °C.</li>' +
      '<li>Temperature scales r by e<sup>−((T − optimum)/10)²</sup>. After 30 h yeast declines by about 1.2 % per hour (faster at low glucose). Each sample varies by about ±6 %.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, raf = null, playing = false, t0 = 0, W = 680, H = 300, samples = [];
    api.stage.innerHTML = '<canvas id="pgw-cv" width="680" height="300" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="A culture growing over time"></canvas><p class="small" id="pgw-cap" style="margin:6px 0;font-weight:700" aria-live="polite"></p>' +
      '<label class="small"><input type="checkbox" id="pgw-log"> Logarithmic scale for population</label><canvas class="vl-chart" id="pgw-ch" style="height:220px"></canvas>';
    var cv = api.stage.querySelector('#pgw-cv'), c = cv.getContext('2d'), ch = api.stage.querySelector('#pgw-ch'), cap = api.stage.querySelector('#pgw-cap'), lg = api.stage.querySelector('#pgw-log');
    lg.onchange = drawChart;
    function v() { return api.vals(); }
    function draw(t) {
      var o = v(), O = ORG[o.org], m = model({ org: o.org, food: o.food, T: o.T, n0: o.n0, t: t }), frac = Math.min(1, m.N / (O.K * 1.6));
      c.clearRect(0, 0, W, H);
      if (o.org === 'yeast') {
        c.fillStyle = 'rgba(254,249,195,' + (0.4 + 0.5 * frac) + ')'; c.beginPath(); c.moveTo(120, 60); c.lineTo(120, 120); c.lineTo(50, 270); c.lineTo(250, 270); c.lineTo(180, 120); c.lineTo(180, 60); c.closePath(); c.fill(); c.strokeStyle = '#475569'; c.lineWidth = 3; c.stroke(); c.fillStyle = '#e5e7eb'; c.fillRect(112, 44, 76, 18);
        // haemocytometer view
        c.fillStyle = '#fff'; c.fillRect(330, 40, 220, 220); c.strokeStyle = '#64748b'; c.lineWidth = 1; for (var g = 0; g <= 4; g++) { c.beginPath(); c.moveTo(330 + g * 55, 40); c.lineTo(330 + g * 55, 260); c.moveTo(330, 40 + g * 55); c.lineTo(550, 40 + g * 55); c.stroke(); }
        var n = Math.round(m.N * 0.8), rr = 7; for (var i = 0; i < Math.min(160, n); i++) { var x = 334 + ((i * 97) % 212), y = 44 + ((i * 53 + Math.floor(i / 4) * 29) % 212); c.fillStyle = 'rgba(253,230,138,.9)'; c.strokeStyle = '#a16207'; c.beginPath(); c.ellipse(x, y, 4, 3.2, i, 0, 7); c.fill(); c.stroke(); if (i % 5 === 0) { c.beginPath(); c.arc(x + 4, y - 2, 1.8, 0, 7); c.fill(); c.stroke(); } }
        c.fillStyle = '#0f172a'; c.font = 'bold 12px system-ui'; c.textAlign = 'center'; c.fillText('Haemocytometer (×400)', 440, 30); c.fillText(fx(o.food, 1) + ' % glucose, ' + o.T + ' °C', 150, 290);
      } else {
        c.fillStyle = 'rgba(186,230,253,.6)'; c.beginPath(); c.ellipse(230, 160, 190, 110, 0, 0, 7); c.fill(); c.strokeStyle = '#0369a1'; c.lineWidth = 3; c.stroke();
        var nf = Math.round(m.N); for (var j = 0; j < Math.min(420, nf); j++) { var a = j * 2.39996, rad = 10 * Math.sqrt(j) * 0.86; if (rad > 100) rad = 100 * ((j * 0.618) % 1); var fx2 = 230 + Math.cos(a) * rad * 1.7, fy = 160 + Math.sin(a) * rad; c.fillStyle = '#4ade80'; c.strokeStyle = '#15803d'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(fx2, fy, 5, 3.5, a, 0, 7); c.fill(); c.stroke(); }
        c.fillStyle = '#0f172a'; c.font = 'bold 12px system-ui'; c.textAlign = 'center'; c.fillText('Beaker seen from above', 230, 290);
      }
      c.fillStyle = '#0f172a'; c.font = 'bold 15px system-ui'; c.textAlign = 'left'; c.fillText(o.org === 'yeast' ? 't = ' + fx(t, 0) + ' h' : 'day ' + fx(t, 0), 570, 40);
      c.font = '13px system-ui'; c.fillText(fx(m.N, 1), 570, 64); c.font = '11px system-ui'; c.fillText(o.org === 'yeast' ? 'thousand cells/mm³' : 'fronds', 570, 80); m.phase.split(/: | → /).forEach(function (t, i) { c.fillText(t, 570, 104 + i * 15); });
      cap.textContent = O.name + ': ' + fx(m.N, 1) + ' ' + O.unit + ' at ' + fx(t, 0) + ' ' + O.tu + ' (' + m.phase + '). Carrying capacity ≈ ' + fx(m.K, 0) + '.';
    }
    function drawChart() {
      var o = v(), O = ORG[o.org], pts = [], log = lg.checked; for (var t = 0; t <= O.tmax + 0.001; t += O.tmax / 120) { var N = model({ org: o.org, food: o.food, T: o.T, n0: o.n0, t: t }).N; pts.push([t, log ? Math.log10(N) : N]); }
      var series = [{ name: 'Model', pts: pts, color: '#009E73', dash: true }, { name: 'Your samples', pts: samples.map(function (s) { return [s.t, log ? Math.log10(s.N) : s.N]; }), color: '#000', dots: true }];
      api.chart(ch, { xLabel: 'Time / ' + O.tu, yLabel: log ? 'log₁₀ population' : 'Population / ' + O.unit, xmin: 0, xmax: O.tmax, ymin: log ? -0.5 : 0, ymax: log ? 3 : O.K * 1.7, series: series });
    }
    function readings(t) { var o = v(), m = model({ org: o.org, food: o.food, T: o.T, n0: o.n0, t: t }); api.readings([['Population', fx(m.N, 1)], ['Carrying capacity K', fx(m.K, 0)], ['Growth rate r', fx(m.r, 3) + ' per ' + ORG[o.org].tu.replace(/s$/, '')], ['Doubling time (early)', isFinite(m.dbl) ? fx(m.dbl, 1) + ' ' + ORG[o.org].tu : '—']]); }
    function frame() { var o = v(), O = ORG[o.org], el = Math.min(1, (performance.now() - t0) / 8000), t = el * O.tmax; draw(t);
      var due = Math.floor(t / O.step + 1e-6) * O.step; if (!samples.length || samples[samples.length - 1].t < due) { var N = model({ org: o.org, food: o.food, T: o.T, n0: o.n0, t: due }).N * (1 + (Math.random() - 0.5) * 0.12); samples.push({ t: due, N: Math.max(0.1, N) }); drawChart(); }
      if (el >= 1) { playing = false; api.label('run', '▶ Grow'); readings(t); api.status(samples.length + ' samples taken. ➕ Record samples.'); return; } if (playing) raf = requestAnimationFrame(frame); }
    api.actions([
      { id: 'run', label: '▶ Grow', main: true, fn: function () { if (playing) return; samples = []; playing = true; t0 = performance.now(); api.label('run', '⏳ Growing…'); frame(); } },
      { id: 'rec', label: '➕ Record samples', fn: function () { if (!samples.length) return api.status('Grow the culture first.'); var o = v(); samples.forEach(function (s) { api.record({ org: o.org === 'yeast' ? 'Yeast' : 'Duckweed', food: o.food, T: o.T, t: s.t, N: +s.N.toFixed(1), logN: +Math.log10(s.N).toFixed(2) }); }); } }
    ]);
    api.onChange = function () { samples = []; readings(0); drawChart(); draw(0); };
    readings(0); drawChart(); draw(0);
    api.status('Press ▶ Grow.');
    window.BV_PGW = { model: model };
  }
})();
