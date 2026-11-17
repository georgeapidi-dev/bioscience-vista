/* Cell respiration laboratory: the respirometer · BioscienceVista · by BioscienceVista
   IB DP C1.2.6: germinating seeds in a sealed tube with soda lime (absorbs CO₂). As they take in oxygen the coloured liquid in the capillary
   moves towards them. Change the temperature, the seeds and their mass; measure the distance moved and calculate the rate of respiration. */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var SEEDS = { pea: ['Germinating peas', 1], mung: ['Germinating mung beans', 1.35], dry: ['Dry (dormant) peas', 0.06], boiled: ['Boiled peas (dead)', 0], beads: ['Glass beads (control)', 0] };
  var SL = [['pea', 'Germinating peas'], ['mung', 'Germinating mung beans'], ['dry', 'Dry (dormant) peas'], ['boiled', 'Boiled peas (dead)'], ['beads', 'Glass beads (control)']];
  var R = 0.5;   // capillary radius, mm

  function model(o) {   // o: {seed, T, m (g), t (min)}
    var base = 0.9 * SEEDS[o.seed][1];   // mm³ O₂ per g per min at 20 °C
    var f = Math.pow(2, (o.T - 20) / 10); if (o.T > 35) f *= Math.exp(-Math.pow((o.T - 35) / 5, 2));
    var rate = base * f, vol = rate * o.m * o.t, dist = vol / (Math.PI * R * R);
    return { rate: rate, vol: vol, dist: dist, f: f };
  }

  LABS.respiration = {
    id: 'respiration', title: 'Cell respiration laboratory: measuring the rate with a respirometer',
    tags: ['Biology', 'Cell respiration', 'IB DP C1.2.6', 'IGCSE', 'A Level'],
    background: '<p><b>Aerobic respiration</b> releases energy from glucose in every living cell: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O, making ATP. Its rate can be measured from the oxygen used or the carbon dioxide produced.</p>' +
      '<p>A <b>respirometer</b> measures oxygen uptake. Living organisms (for example <b>germinating seeds</b>) are sealed in a tube with <b>soda lime or potassium hydroxide</b>, which absorbs the carbon dioxide they release. As oxygen is used, the gas volume and pressure in the tube fall, so a drop of coloured liquid in a <b>capillary tube</b> moves towards the organisms. The <b>volume of oxygen</b> used = π r² × distance moved. A <b>control tube</b> with glass beads of the same volume shows changes caused by temperature or pressure, not respiration.</p>' +
      '<p>Respiration is controlled by <b>enzymes</b>, so it speeds up with temperature (roughly doubling every 10 °C) up to an optimum, then falls as enzymes denature. Germinating seeds respire fast because they use stored starch to grow; dormant seeds respire very slowly and dead seeds not at all.</p>',
    objectives: ['Use a respirometer to measure oxygen uptake.', 'Calculate the volume of oxygen and the rate of respiration per gram per minute.', 'Investigate how temperature affects the rate of respiration.', 'Explain the purpose of soda lime, the control tube and the water bath.'],
    rq: 'How does temperature (10–45 °C) affect the rate of oxygen uptake by germinating peas?',
    hypPrompt: 'Predict how the rate of respiration changes from 10 °C to 45 °C. Explain using enzymes.',
    hypothesis: { marks: 3, points: [
      { re: [/increas|faster|higher|more/], marks: 1, ok: 'The rate increases with temperature.', miss: 'Say how the rate changes as temperature rises.' },
      { re: [/optimum|peak|maximum|then (fall|decreas|drop)|denatur/], marks: 1, ok: 'You predict an optimum then a fall.', miss: 'Predict what happens at high temperatures.' },
      { re: [/enzyme|kinetic|collision|active site/], marks: 1, ok: 'You explain with enzymes.', miss: 'Explain using enzymes (more collisions; denaturing).' }] },
    variables: { iv: 'temperature of the water bath (°C)', dv: 'distance moved by the coloured liquid in 10 minutes (mm), giving the rate of O₂ uptake (mm³ g⁻¹ min⁻¹)', cv: ['mass and type of seeds (germinated for the same time)', 'mass of soda lime', 'capillary radius (0.5 mm)', 'time (10 min) and acclimatisation time', 'control tube with glass beads'] },
    apparatus: ['2 boiling tubes with bungs, capillary tubes (radius 0.5 mm) and scales', 'Germinating peas; glass beads of the same volume (control)', 'Soda lime in a gauze cage (absorbs CO₂)', 'Coloured liquid, syringe and three-way tap to reset the drop', 'Thermostatic water bath, stopwatch, balance'],
    safety: ['Soda lime and potassium hydroxide are corrosive: wear eye protection and gloves; keep them in a gauze cage, away from the seeds.', 'Seeds can grow fungi: wash hands afterwards.'],
    method: ['Put 5 g of germinating peas in the tube, the control tube has glass beads. Set 20 °C.', 'Press <b>▶ Start (10 min)</b>. After acclimatising, the tap closes and the coloured liquid moves; read the distance after 10 minutes.', 'Press <b>➕ Record trial</b>, then repeat at 10, 15, 25, 30, 35, 40 and 45 °C (3 repeats each).', 'Compare dry, boiled and germinating seeds, and germinating mung beans.'],
    controls: [
      { id: 'seed', label: 'Organisms in the tube', type: 'select', value: 'pea', options: SL },
      { id: 'T', label: 'Water bath temperature', min: 10, max: 45, step: 5, value: 20, unit: '°C' },
      { id: 'm', label: 'Mass of seeds', min: 2, max: 10, step: 1, value: 5, unit: 'g' },
      { id: 't', label: 'Time', min: 5, max: 20, step: 5, value: 10, unit: 'min' }
    ],
    columns: [
      { key: 'seed', label: 'Organisms', num: false, group: true }, { key: 'T', label: 'Temperature', unit: '°C', dp: 0 }, { key: 'm', label: 'Mass', unit: 'g', dp: 0 }, { key: 't', label: 'Time', unit: 'min', dp: 0 },
      { key: 'dist', label: 'Distance moved', unit: 'mm', dp: 1 }, { key: 'vol', label: 'O₂ used (πr²d)', unit: 'mm³', dp: 1 }, { key: 'rate', label: 'Rate', unit: 'mm³ g⁻¹ min⁻¹', dp: 2 }
    ],
    graph: { x: 'T', y: 'rate', group: 'seed' },
    hints: ['Volume = π r² × distance, with r = 0.5 mm.', 'Rate = volume ÷ (mass × time).', 'Why must the CO₂ be absorbed? What would happen without soda lime?', 'What should the liquid in the control tube do?'],
    analyse: [
      { id: 'calc', q: 'At 20 °C, 5 g of peas moved the liquid 57.3 mm in 10 minutes (r = 0.5 mm). Calculate the rate of oxygen uptake in mm³ g⁻¹ min⁻¹.', marks: 2, lines: 2, number: { value: 0.9, tol: 0.05, unit: 'mm³ g⁻¹ min⁻¹', dp: 2 } },
      { id: 'pattern', q: 'Describe and explain the effect of temperature on the rate of respiration. Use your data.', marks: 3, lines: 4, points: [
        { re: [/increas|rise|faster/], marks: 1, ok: 'The rate rises with temperature.', miss: 'Describe the rise in rate.' },
        { re: [/35|optimum|peak|maximum|(fall|decreas|drop).*(40|45)/], marks: 1, ok: 'You describe the optimum and the fall.', miss: 'Give the optimum and describe the fall above it.' },
        { re: [/denatur|active site|enzyme/], marks: 1, ok: 'Enzymes denature above the optimum.', miss: 'Explain using enzymes: more kinetic energy, then denaturation.' }] },
      { id: 'q10', q: 'Use your results to calculate how many times faster the rate is at 30 °C than at 20 °C (the Q₁₀).', marks: 1, lines: 1, number: { value: function () { return model({ seed: 'pea', T: 30, m: 5, t: 10 }).rate / model({ seed: 'pea', T: 20, m: 5, t: 10 }).rate; }, tol: 0.08, dp: 1 } },
      { id: 'seeds', q: 'Compare germinating, dry and boiled peas. Explain the differences.', marks: 3, lines: 4, points: [
        { re: [/germinat.*(fastest|highest|most|more)/], marks: 1, ok: 'Germinating seeds respire fastest.', miss: 'Say which seeds respired fastest.' },
        { re: [/dry|dormant/], marks: 1, ok: 'Dry seeds: very slow (dormant, little water).', miss: 'Explain the dry seeds: dormant, little water for enzymes.' },
        { re: [/boil.*(dead|denatur|no|zero)|(dead|denatur).*boil/], marks: 1, ok: 'Boiled seeds: dead, enzymes denatured.', miss: 'Explain the boiled seeds: enzymes denatured, no respiration.' }] }
    ],
    evaluate: [
      { id: 'soda', q: 'Explain why soda lime is needed and why the control tube is used.', marks: 2, lines: 3, points: [
        { re: [/absorb.*(co2|co₂|carbon dioxide)|(co2|co₂|carbon dioxide).*absorb/], marks: 1, ok: 'It absorbs CO₂, so the volume change is O₂ uptake only.', miss: 'Soda lime absorbs the CO₂ released, so the liquid moves only because O₂ is used.' },
        { re: [/control|temperature|pressure|atmospher|compare|correct|beads/], marks: 1, ok: 'The control corrects for temperature and pressure changes.', miss: 'The control shows movement caused by temperature or pressure changes, not respiration.' }] },
      { id: 'imp', q: 'Suggest two sources of error and how to reduce them.', marks: 2, lines: 4, points: [
        { re: [/leak|seal|vaseline|airtight/], marks: 1, ok: 'Leaks: seal joints.', miss: 'For example: leaks — seal the bungs with petroleum jelly.' },
        { re: [/acclimat|equilibr|temperature (change|fluctuat)|water bath|repeat|mean|same (germination|age)|read|meniscus|parallax/], marks: 1, ok: 'A second valid error and fix.', miss: 'For example: acclimatise before closing the tap; repeat and use a mean; seeds of the same age.' }] }
    ],
    model: '<ul><li>O₂ uptake rate = 0.9 mm³ g⁻¹ min⁻¹ × seed factor × 2<sup>(T − 20)/10</sup> (Q₁₀ = 2), multiplied by e<sup>−((T − 35)/5)²</sup> above 35 °C. Seed factors: germinating peas 1, mung beans 1.35, dry peas 0.06, boiled peas and glass beads 0.</li>' +
      '<li>Volume = rate × mass × time; distance = volume ÷ (π × 0.5² mm²). Each recorded trial varies by about ±4 %.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, sim = null, raf = null, playing = false, t0 = 0, W = 680, H = 330;
    api.stage.innerHTML = '<canvas id="rs-cv" width="680" height="330" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Respirometer: tubes of seeds and glass beads in a water bath with capillary tubes"></canvas><p class="small" id="rs-cap" style="margin:6px 0;font-weight:700" aria-live="polite"></p><canvas class="vl-chart" id="rs-ch" style="height:220px"></canvas><div id="rs-lg"></div>';
    var cv = api.stage.querySelector('#rs-cv'), c = cv.getContext('2d'), ch = api.stage.querySelector('#rs-ch'), cap = api.stage.querySelector('#rs-cap');
    function compute() { var v = api.vals(); sim = model(v); sim.v = v; }
    function tubeSet(x, y, label, seeds, dist, scale) {
      c.fillStyle = 'rgba(241,245,249,.95)'; c.strokeStyle = '#475569'; c.lineWidth = 2; c.fillRect(x, y, 60, 150); c.strokeRect(x, y, 60, 150);
      c.fillStyle = '#94a3b8'; c.fillRect(x - 4, y - 14, 68, 16);   // bung
      // seeds or beads at the bottom
      for (var i = 0; i < 16; i++) { var sx = x + 10 + (i % 4) * 13, sy = y + 140 - Math.floor(i / 4) * 12; c.fillStyle = seeds === 'beads' ? '#e2e8f0' : seeds === 'boiled' ? '#a3a380' : seeds === 'dry' ? '#ca8a04' : '#84cc16'; c.strokeStyle = '#64748b'; c.lineWidth = 1; c.beginPath(); c.arc(sx, sy, 5.5, 0, 7); c.fill(); c.stroke();
        if (seeds === 'pea' || seeds === 'mung') { c.strokeStyle = '#f5f5f4'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(sx, sy - 5); c.lineTo(sx + 2, sy - 10); c.stroke(); } }
      // gauze with soda lime
      c.strokeStyle = '#64748b'; c.setLineDash([2, 2]); c.strokeRect(x + 6, y + 30, 48, 40); c.setLineDash([]); for (i = 0; i < 12; i++) { c.fillStyle = '#f8fafc'; c.strokeStyle = '#94a3b8'; c.beginPath(); c.arc(x + 12 + (i % 6) * 7, y + 42 + Math.floor(i / 6) * 14, 3, 0, 7); c.fill(); c.stroke(); }
      c.fillStyle = '#475569'; c.font = '9px system-ui'; c.textAlign = 'center'; c.fillText('soda lime', x + 30, y + 82);
      // capillary to the right with scale, the drop moves left (towards the tube) as O2 is used
      var cy = y - 30; c.strokeStyle = '#64748b'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 30, y - 14); c.lineTo(x + 30, cy); c.lineTo(x + 300, cy); c.stroke();
      c.fillStyle = '#fef9c3'; c.fillRect(x + 50, cy + 6, 250, 12); c.fillStyle = '#713f12'; c.font = '8px system-ui';
      for (var mm = 0; mm <= 200; mm += 20) { var tx = x + 290 - mm * scale; c.fillRect(tx, cy + 6, 1, 5); c.fillText(String(mm), tx, cy + 26); }
      var dx = x + 290 - Math.min(200, dist) * scale; c.fillStyle = '#dc2626'; c.fillRect(dx - 6, cy - 3, 12, 6);
      c.fillStyle = '#0f172a'; c.font = 'bold 11px system-ui'; c.fillText(label, x + 30, y + 168);
    }
    function draw(el) {
      var v = sim.v, tt = el * v.t, d = model({ seed: v.seed, T: v.T, m: v.m, t: tt }).dist * (playing ? 1 : 1), dC = 0;
      c.clearRect(0, 0, W, H);
      c.fillStyle = 'rgba(186,230,253,.35)'; c.fillRect(20, 120, 640, 200); c.strokeStyle = '#0284c7'; c.lineWidth = 2; c.strokeRect(20, 120, 640, 200);
      c.fillStyle = '#0369a1'; c.font = 'bold 12px system-ui'; c.textAlign = 'right'; c.fillText('Water bath ' + v.T + ' °C', 650, 138);
      tubeSet(40, 140, SEEDS[v.seed][0] + ' (' + v.m + ' g)', v.seed, d, 1.2);
      tubeSet(360, 140, 'Control: glass beads', 'beads', dC, 1.2);
      c.fillStyle = '#0f172a'; c.font = 'bold 15px system-ui'; c.textAlign = 'left'; c.fillText(playing && el < 0.12 ? 'Acclimatising (tap open)…' : 'Time ' + fx(tt, 1) + ' of ' + v.t + ' min · liquid moved ' + fx(d, 1) + ' mm', 16, 26);
      c.font = '12px system-ui'; c.fillText('Coloured liquid (red) moves towards the seeds as they take in oxygen. Scale in mm.', 16, 46);
      cap.textContent = SEEDS[v.seed][1] === 0 ? 'No movement: ' + (v.seed === 'beads' ? 'glass beads do not respire.' : 'dead seeds do not respire (enzymes denatured).') : 'O₂ used: ' + fx(sim.vol, 1) + ' mm³ in ' + v.t + ' min → rate ' + fx(sim.rate, 2) + ' mm³ g⁻¹ min⁻¹. CO₂ released is absorbed by the soda lime.';
    }
    function drawChart() {
      var v = sim.v, series = [];
      [['pea', '#009E73'], ['mung', '#0072B2'], ['dry', '#E69F00']].forEach(function (s) { var pts = []; for (var T = 10; T <= 45.001; T += 1) pts.push([T, model({ seed: s[0], T: T, m: v.m, t: v.t }).rate]); series.push({ name: SEEDS[s[0]][0], pts: pts, color: s[1], dash: s[0] !== v.seed }); });
      series.push({ name: 'Now', pts: [[v.T, sim.rate]], color: '#000', dots: true });
      api.chart(ch, { xLabel: 'Temperature / °C', yLabel: 'Rate / mm³ O₂ g⁻¹ min⁻¹', xmin: 10, xmax: 45, ymin: 0, ymax: 4, series: series });
      api.stage.querySelector('#rs-lg').innerHTML = api.legend(series.slice(0, 3)) + '<p class="small muted" style="margin:4px 0 0">Model curves. Your recorded trials make the graph in 4 Results.</p>';
    }
    function readings() { api.readings([['Distance moved', fx(sim.dist, 1) + ' mm'], ['O₂ used', fx(sim.vol, 1) + ' mm³'], ['Rate', fx(sim.rate, 2) + ' mm³ g⁻¹ min⁻¹'], ['Control tube', '0 mm']]); }
    function frame() { var el = Math.min(1, (performance.now() - t0) / 9000); draw(Math.max(0, (el - 0.12) / 0.88)); if (el >= 1) { playing = false; api.label('run', '▶ Start (' + sim.v.t + ' min)'); api.status('Finished. Read the distance, then ➕ Record trial.'); return; } if (playing) raf = requestAnimationFrame(frame); }
    api.actions([
      { id: 'run', label: '▶ Start (10 min)', main: true, fn: function () { if (playing) { playing = false; cancelAnimationFrame(raf); api.label('run', '▶ Start (' + sim.v.t + ' min)'); return; } compute(); readings(); playing = true; t0 = performance.now(); api.label('run', '⏸ Pause'); frame(); } },
      { id: 'rec', label: '➕ Record trial', fn: function () { var v = sim.v, k = 1 + (Math.random() - 0.5) * 0.08, d = sim.dist * k; api.record({ seed: SEEDS[v.seed][0], T: v.T, m: v.m, t: v.t, dist: +d.toFixed(1), vol: +(d * Math.PI * R * R).toFixed(1), rate: +(d * Math.PI * R * R / (v.m * v.t)).toFixed(2) }); } }
    ]);
    api.onChange = function () { compute(); readings(); drawChart(); api.label('run', '▶ Start (' + sim.v.t + ' min)'); if (!playing) draw(1); };
    compute(); readings(); drawChart(); draw(0);
    api.status('Press ▶ Start to close the tap and time the movement.');
    window.BV_RS = { model: model };
  }
})();
