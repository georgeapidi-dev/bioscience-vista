/* Transect laboratory · BioscienceVista · by George Apidi
   IB DP B4.1.4 range of tolerance: a belt transect from inside a woodland into an open meadow. At each station measure light intensity and
   soil moisture, count the plants in a quadrat, and correlate distribution with an abiotic factor (Pearson's r). */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var SP = { blue: ['Bluebell (shade-tolerant)', '#6366f1'], grass: ['Meadow grass (light-demanding)', '#16a34a'], dand: ['Dandelion (light-demanding, tolerates dry soil)', '#eab308'], moss: ['Moss (needs moist shade)', '#65a30d'] };
  var SPL = [['blue', SP.blue[0]], ['grass', SP.grass[0]], ['dand', SP.dand[0]], ['moss', SP.moss[0]]];
  var LEN = 40;   // m; woodland edge at 16 m

  function env(x) { var s = 1 / (1 + Math.exp(-(x - 16) / 2.2)); return { light: 2 + 96 * s, moist: 62 - 34 * s }; }   // light % of full sun, soil moisture %
  function bell(v, opt, wid) { return Math.exp(-Math.pow((v - opt) / wid, 2)); }
  function abund(sp, e) {   // % cover expected
    if (sp === 'blue') return 70 * bell(e.light, 18, 22) * bell(e.moist, 58, 20);
    if (sp === 'grass') return 85 * Math.min(1, Math.max(0, (e.light - 25) / 55));
    if (sp === 'dand') return 30 * bell(e.light, 92, 25) * bell(e.moist, 32, 18);
    return 60 * bell(e.light, 8, 12) * bell(e.moist, 62, 10);
  }
  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function pearson(xs, ys) { var n = xs.length, mx = xs.reduce(function (a, b) { return a + b; }, 0) / n, my = ys.reduce(function (a, b) { return a + b; }, 0) / n, sxy = 0, sx = 0, sy = 0; for (var i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sx += Math.pow(xs[i] - mx, 2); sy += Math.pow(ys[i] - my, 2); } return sx && sy ? sxy / Math.sqrt(sx * sy) : 0; }
  function survey(sp, step, seed) {
    var r = rng(seed), pts = []; for (var x = 0; x <= LEN; x += step) { var e = env(x), a = abund(sp, e); pts.push({ x: x, light: Math.max(0, e.light * (1 + (r() - 0.5) * 0.12)), moist: Math.max(0, e.moist + (r() - 0.5) * 6), cover: Math.max(0, Math.min(100, a + (r() - 0.5) * (6 + a * 0.3))) }); }
    return pts;
  }

  LABS.transect = {
    id: 'transect', title: 'Transect laboratory: distribution and range of tolerance',
    tags: ['Biology', 'Ecology', 'IB DP B4.1.4 range of tolerance', 'IB DP fieldwork', 'IGCSE', 'A Level'],
    background: '<p>Each species can survive and reproduce only within a <b>range of tolerance</b> of each abiotic factor (light, temperature, water, pH, salinity). Within that range there is an <b>optimum</b>; towards the limits the population becomes smaller (zones of stress), and outside them the species is absent.</p>' +
      '<p>A <b>transect</b> is a line across a habitat where an abiotic factor changes, such as from inside a wood into a meadow. In a <b>belt transect</b> a quadrat is placed at regular intervals (stations) along the line; at each one the <b>abundance</b> of each species is recorded (percentage cover or number) and the <b>abiotic factors</b> are measured with a light meter, soil moisture probe or other sensors. Plotting abundance against the abiotic factor and calculating a <b>correlation coefficient</b> (Pearson\'s r, from −1 to +1) shows how strongly distribution is related to the factor. A correlation does not prove that the factor causes the distribution: other factors (moisture, competition, grazing) change along the same line.</p>',
    objectives: ['Carry out a belt transect with quadrats at regular stations.', 'Measure light intensity and soil moisture at each station.', 'Plot abundance against an abiotic factor and calculate Pearson\'s correlation coefficient.', 'Describe the range of tolerance of each species, and evaluate whether the factor causes the distribution.'],
    rq: 'How is the percentage cover of bluebells correlated with light intensity along a 40 m transect from woodland into a meadow?',
    hypPrompt: 'Predict how bluebell cover and grass cover change from the wood into the meadow, and how each correlates with light.',
    hypothesis: { marks: 2, points: [
      { re: [/bluebell.*(wood|shade|less light|decreas|negative)|negative.*bluebell/], marks: 1, ok: 'Bluebells decrease as light increases.', miss: 'Predict how bluebell cover changes with light.' },
      { re: [/grass.*(meadow|more light|increas|positive)|positive.*grass/], marks: 1, ok: 'Grass increases with light.', miss: 'Predict how grass cover changes with light.' }] },
    variables: { iv: 'position along the transect, giving light intensity (% of full sunlight) and soil moisture (%)', dv: 'percentage cover of the species in a 0.5 m × 0.5 m quadrat', cv: ['quadrat size', 'interval between stations', 'time of day and weather (light readings)', 'same observer judging cover', 'light meter held at the same height'] },
    apparatus: ['40 m measuring tape laid from the wood into the meadow', '0.5 m × 0.5 m quadrat divided into 100 squares (for % cover)', 'Light meter (lux; shown as % of full sunlight), soil moisture probe', 'Plant identification guide, recording sheet or spreadsheet'],
    safety: ['Check for hazards: stinging plants, uneven ground, ticks. Wear long trousers and wash hands afterwards.', 'Avoid trampling: walk on one side of the tape. Do not pick plants.'],
    method: ['Choose a species and the interval between stations.', 'Press <b>▶ Walk the transect</b>: at each station the quadrat is placed, cover is estimated and light and moisture are read.', 'Press <b>➕ Record stations</b> to put every station in the results table.', 'In 4 Results, plot cover against light (x = light). Read Pearson\'s r below the animation. Repeat for the other species.'],
    controls: [
      { id: 'sp', label: 'Species', type: 'select', value: 'blue', options: SPL },
      { id: 'step', label: 'Interval between stations', type: 'select', value: '2', options: [['1', '1 m (41 stations)'], ['2', '2 m (21 stations)'], ['5', '5 m (9 stations)']] }
    ],
    columns: [
      { key: 'sp', label: 'Species', num: false, group: true }, { key: 'x', label: 'Distance', unit: 'm', dp: 0 }, { key: 'light', label: 'Light', unit: '% of full sun', dp: 0 }, { key: 'moist', label: 'Soil moisture', unit: '%', dp: 0 }, { key: 'cover', label: 'Cover', unit: '%', dp: 0 }
    ],
    graph: { x: 'light', y: 'cover', group: 'sp' },
    hints: ['r close to −1: strong negative correlation; close to +1: strong positive; near 0: none.', 'The range of tolerance is the range of light over which the species is found at all.', 'Light and moisture change together along this transect.', 'Fewer stations: is the pattern still clear?'],
    analyse: [
      { id: 'r', q: 'State Pearson\'s r for bluebell cover against light intensity and describe the correlation.', marks: 2, lines: 2, points: [
        { re: [/−0\.\d|-0\.\d/], marks: 1, ok: 'A negative r.', miss: 'Quote the r value (it is negative).' }, { re: [/negative|strong|moderate/], marks: 1, ok: 'You describe the strength and direction.', miss: 'Describe the direction and strength (for example strong negative).' }] },
      { id: 'tol', q: 'Use your data to describe the range of tolerance of meadow grass for light, and its optimum.', marks: 2, lines: 3, points: [
        { re: [/\d+ ?%?.*(to|–|-).*\d+|above \d+|over \d+|more than \d+/], marks: 1, ok: 'You give a range of light.', miss: 'Give the range of light (%) where grass is found.' }, { re: [/optim|highest|most|maximum|full sun|100/], marks: 1, ok: 'You identify the optimum.', miss: 'Say where its cover is highest (the optimum).' }] },
      { id: 'cause', q: 'Bluebell cover correlates with both light and soil moisture. Explain why the transect cannot show which factor causes the distribution, and suggest an experiment that could.', marks: 3, lines: 5, points: [
        { re: [/both|together|same time|covar|confound|correlat.*not.*caus|causation/], marks: 1, ok: 'Light and moisture change together (correlation is not causation).', miss: 'Explain: light and moisture change together, so either could be the cause.' },
        { re: [/control|keep.*(same|constant)|one variable|manipulat|change only/], marks: 1, ok: 'Change one factor and control the other.', miss: 'Suggest changing one factor while keeping the other constant.' },
        { re: [/shade|net|cover|water|pot|greenhouse|experiment|plant (them|bluebells)/], marks: 1, ok: 'A practical experiment.', miss: 'For example: grow bluebells in pots under different shade nets with the same watering.' }] }
    ],
    evaluate: [
      { id: 'int', q: 'Compare the results with 1 m and 5 m intervals. Which is better, and what is the trade-off?', marks: 2, lines: 3, points: [
        { re: [/1 ?m.*(more detail|more stations|better|precise|clearer)|more stations|smaller interval/], marks: 1, ok: 'Smaller intervals show the pattern in more detail.', miss: 'Say which interval shows the change more clearly.' }, { re: [/time|longer|effort|work|trampl/], marks: 1, ok: 'But they take more time and trample more.', miss: 'Give the trade-off: more time and effort.' }] },
      { id: 'cov', q: 'Suggest one source of error in estimating percentage cover and how to reduce it.', marks: 1, lines: 2, points: [
        { re: [/subjective|judg|observer|estimate|overlap|layer|grid|point|same person|squares/], marks: 1, ok: 'Valid.', miss: 'For example: cover is a subjective estimate — use a gridded quadrat or point frame, same observer.' }] }
    ],
    model: '<ul><li>Light = 2 + 96 / (1 + e<sup>−(x − 16)/2.2</sup>) % of full sun (woodland edge at 16 m); soil moisture falls from 62 % to 28 % across the edge. Each reading varies a little, like real meters.</li>' +
      '<li>Expected cover: bluebell 70 % × bell(light, optimum 18 %) × bell(moisture, 58 %); grass rises from 25 % light to 85 % cover; dandelion peaks in full sun on drier soil; moss needs shade and moisture. Counts vary by about ±15 %.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, sim = null, raf = null, playing = false, t0 = 0, W = 680, H = 300, seed = 3, pts = [];
    api.stage.innerHTML = '<canvas id="tx-cv" width="680" height="300" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="A transect from woodland into a meadow"></canvas><p class="small" id="tx-cap" style="margin:6px 0;font-weight:700" aria-live="polite"></p><canvas class="vl-chart" id="tx-ch" style="height:220px"></canvas><div id="tx-lg"></div>';
    var cv = api.stage.querySelector('#tx-cv'), c = cv.getContext('2d'), ch = api.stage.querySelector('#tx-ch'), cap = api.stage.querySelector('#tx-cap'), X0 = 30, KX = 15.5;
    function draw(el) {
      var v = api.vals(), n = Math.ceil(pts.length * el);
      c.clearRect(0, 0, W, H); var g = c.createLinearGradient(X0, 0, X0 + LEN * KX, 0); g.addColorStop(0, '#14532d'); g.addColorStop(0.38, '#166534'); g.addColorStop(0.45, '#86efac'); g.addColorStop(1, '#bbf7d0'); c.fillStyle = g; c.fillRect(X0, 150, LEN * KX, 120);
      for (var i = 0; i < 9; i++) { var tx = X0 + 10 + i * 26; c.fillStyle = '#78350f'; c.fillRect(tx, 80, 7, 80); c.fillStyle = '#15803d'; c.beginPath(); c.arc(tx + 3, 72, 26, 0, 7); c.fill(); }
      c.fillStyle = '#fde047'; c.beginPath(); c.arc(640, 40, 20, 0, 7); c.fill();
      c.fillStyle = '#fef9c3'; c.fillRect(X0, 205, LEN * KX, 8); c.fillStyle = '#713f12'; c.font = '9px system-ui'; c.textAlign = 'center'; for (var m = 0; m <= LEN; m += 5) { c.fillRect(X0 + m * KX, 205, 1, 10); c.fillText(m + ' m', X0 + m * KX, 226); }
      c.fillStyle = '#0f172a'; c.font = 'bold 12px system-ui'; c.fillText('woodland', X0 + 100, 140); c.fillText('edge', X0 + 16 * KX, 140); c.fillText('meadow', X0 + 30 * KX, 140);
      pts.slice(0, n).forEach(function (p, j) {
        var x = X0 + p.x * KX; c.strokeStyle = '#dc2626'; c.lineWidth = 1.5; c.strokeRect(x - 6, 188, 12, 12); c.fillStyle = SP[v.sp][1]; var h = p.cover * 0.55; c.fillRect(x - 4, 182 - h, 8, h);
        if (j === n - 1 && playing) { c.fillStyle = '#0f172a'; c.font = 'bold 12px system-ui'; c.textAlign = 'left'; c.fillText('Station ' + p.x + ' m: light ' + fx(p.light, 0) + ' %, moisture ' + fx(p.moist, 0) + ' %, cover ' + fx(p.cover, 0) + ' %', 16, 22); c.fillStyle = '#1e293b'; c.beginPath(); c.arc(x, 170, 6, 0, 7); c.fill(); c.fillRect(x - 2, 176, 4, 12); }
      });
      c.fillStyle = '#334155'; c.font = '11px system-ui'; c.textAlign = 'left'; c.fillText('Bars: % cover of ' + SP[v.sp][0].split(' (')[0].toLowerCase() + ' in each quadrat', 16, 290);
    }
    function stats() { if (!pts.length) return null; return { rL: pearson(pts.map(function (p) { return p.light; }), pts.map(function (p) { return p.cover; })), rM: pearson(pts.map(function (p) { return p.moist; }), pts.map(function (p) { return p.cover; })), present: pts.filter(function (p) { return p.cover > 1; }) }; }
    function readings() { var s = stats(); if (!s) return api.readings([['Stations', '—']]); var lo = s.present.length ? Math.min.apply(null, s.present.map(function (p) { return p.light; })) : 0, hi = s.present.length ? Math.max.apply(null, s.present.map(function (p) { return p.light; })) : 0;
      api.readings([['Stations', String(pts.length)], ['Pearson r (cover vs light)', fx(s.rL, 2)], ['Pearson r (cover vs moisture)', fx(s.rM, 2)], ['Found between', s.present.length ? fx(lo, 0) + '–' + fx(hi, 0) + ' % light' : 'not found']]); }
    function drawChart() { var v = api.vals(), series = [{ name: SP[v.sp][0], pts: pts.map(function (p) { return [p.light, p.cover]; }), color: SP[v.sp][1], dots: true }];
      api.chart(ch, { xLabel: 'Light intensity / % of full sun', yLabel: 'Cover / %', xmin: 0, xmax: 100, ymin: 0, ymax: 100, series: series });
      var s = stats(); api.stage.querySelector('#tx-lg').innerHTML = '<p class="small muted" style="margin:4px 0 0">' + (s ? 'Scatter of this survey. r = ' + fx(s.rL, 2) + (Math.abs(s.rL) > 0.7 ? ' (strong ' : Math.abs(s.rL) > 0.4 ? ' (moderate ' : ' (weak ') + (s.rL < 0 ? 'negative)' : 'positive)') : 'Walk the transect to see the scatter graph.') + '</p>'; }
    function frame() { var el = Math.min(1, (performance.now() - t0) / 7000); draw(el); if (el >= 1) { playing = false; api.label('run', '▶ Walk the transect'); readings(); drawChart(); var s = stats(); cap.textContent = SP[api.vals().sp][0] + ': r = ' + fx(s.rL, 2) + ' with light, ' + fx(s.rM, 2) + ' with soil moisture.'; api.status('➕ Record stations, or walk again (new readings).'); return; } if (playing) raf = requestAnimationFrame(frame); }
    api.actions([
      { id: 'run', label: '▶ Walk the transect', main: true, fn: function () { if (playing) return; var v = api.vals(); seed++; pts = survey(v.sp, +v.step, seed); playing = true; t0 = performance.now(); api.label('run', '⏳ Walking…'); frame(); } },
      { id: 'rec', label: '➕ Record stations', fn: function () { if (!pts.length) return api.status('Walk the transect first.'); var name = SP[api.vals().sp][0].split(' (')[0]; pts.forEach(function (p) { api.record({ sp: name, x: p.x, light: Math.round(p.light), moist: Math.round(p.moist), cover: Math.round(p.cover) }); }); } }
    ]);
    api.onChange = function () { pts = []; readings(); drawChart(); draw(1); cap.textContent = ''; };
    readings(); drawChart(); draw(1);
    api.status('Press ▶ Walk the transect.');
    window.BV_TX = { pearson: pearson, survey: survey };
  }
})();
