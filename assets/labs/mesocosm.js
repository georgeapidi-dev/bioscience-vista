/* Mesocosm laboratory · BioscienceVista · by BioscienceVista
   IB DP D4.2.4: use a sealed jar ecosystem (pond water, pondweed, snails, decomposers) as a model to investigate how light, producers,
   consumers and decomposers affect ecosystem stability. Track dissolved oxygen, carbon dioxide and the populations for 12 weeks. */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var LIGHT = [['0', 'Darkness (0 h)'], ['8', '8 hours light per day'], ['16', '16 hours light per day']];

  function simulate(o) {   // o: {light (h/day), plants (shoots), snails, decomp (bool), weeks}
    var P = o.plants * 10, S = o.snails, O2 = 8, CO2 = 2, D = 5, NUT = 4, out = [], dt = 1 / 7, L = +o.light / 16;
    for (var t = 0; t <= o.weeks + 1e-9; t += dt) {
      if (Math.abs(t * 7 - Math.round(t * 7)) < 1e-6) out.push({ t: t, P: P, S: S, O2: O2, CO2: CO2, D: D, NUT: NUT });
      var phot = 0.055 * P * L * Math.min(1, CO2 / 1.5) * Math.min(1, NUT / 2), respP = 0.012 * P, respS = 0.42 * S, decay = o.decomp ? 0.12 * D : 0.01 * D;
      O2 += (phot - respP - respS - decay * 0.6) * dt * 1.2; CO2 += (respP + respS + decay * 0.6 - phot) * dt * 1.2;
      O2 = Math.max(0, Math.min(14, O2)); CO2 = Math.max(0, Math.min(14, CO2));
      var graze = 0.09 * S * P / (P + 20);
      P += (phot * 0.9 - respP * 0.5 - graze - 0.004 * P * P / 20) * dt; NUT += (decay * 0.5 - phot * 0.22) * dt; NUT = Math.max(0, NUT);
      var g = O2 > 3 ? 0.65 * P / (P + 20) / (1 + 0.18 * S) - 0.3 : -2.5 * (3 - O2) / 3; S += S * g * dt;
      D += (respP * 0.2 + 0.03 * S + (g < 0 ? -S * g * dt : 0) - decay) * dt + (O2 < 1 ? 0.05 * P * dt : 0); if (O2 < 1) P -= 0.05 * P * dt; D = Math.max(0, D);
      P = Math.max(0, P); S = Math.max(0, S);
    }
    var last = out[out.length - 1], first = out[0];
    var stable = last.O2 > 4 && (first.S === 0 || last.S > 0.5 * first.S) && last.P > 0.5 * first.P && last.P > 0;
    return { pts: out, last: last, stable: stable };
  }

  LABS.mesocosm = {
    id: 'mesocosm', title: 'Mesocosm laboratory: what keeps an ecosystem stable?',
    tags: ['Biology', 'Ecology', 'IB DP D4.2.4 models of ecosystem stability', 'IB DP C4.2 energy and nutrients', 'MYP 4–5'],
    background: '<p>A <b>mesocosm</b> is a small, enclosed ecosystem (a sealed jar or tank) set up as a <b>model</b> of a natural one, so that variables can be controlled and changed. A sealed jar of pond water with pondweed, snails and microorganisms receives only <b>energy (light)</b>: matter must be <b>recycled</b>.</p>' +
      '<p>A <b>stable ecosystem</b> persists for a long time without large changes. It needs: a supply of <b>energy</b> for producers; <b>recycling of nutrients</b> by <b>decomposers</b> (bacteria and fungi break down dead matter and waste, releasing CO₂ and minerals); and a balance between <b>photosynthesis</b> (makes O₂, uses CO₂) and <b>respiration</b> by all organisms (uses O₂, makes CO₂). Too many consumers, too few producers, or too little light make oxygen fall and the system collapses.</p>' +
      '<p>Mesocosm results must be applied to real ecosystems with care: they are small, short-term and simplified, but they let ecologists test ideas such as tipping points.</p>',
    objectives: ['Set up a model ecosystem and identify the variables that can be changed.', 'Investigate how light, the number of producers and consumers, and decomposers affect stability.', 'Explain stability using energy flow, nutrient recycling and the balance of photosynthesis and respiration.', 'Evaluate the mesocosm as a model of a real ecosystem.'],
    rq: 'How does the number of snails (consumers) affect the stability of a sealed mesocosm with 4 pondweed shoots and 16 hours of light per day over 12 weeks?',
    hypPrompt: 'Predict what happens to oxygen and to the snails when there are many snails compared with few. Explain.',
    hypothesis: { marks: 2, points: [
      { re: [/many snails.*(oxygen|o2|o₂).*(fall|drop|decreas|low)|(oxygen|o2|o₂).*(fall|drop|decreas).*(many|more) snails|collapse|die/], marks: 1, ok: 'Many snails use up the oxygen.', miss: 'Predict the effect of many snails on oxygen and on the snails.' },
      { re: [/respir|photosynth|balance|graz|eat|consum/], marks: 1, ok: 'You explain with respiration, photosynthesis or grazing.', miss: 'Explain using respiration and photosynthesis (or grazing).' }] },
    variables: { iv: 'number of snails (consumers) in the jar', dv: 'dissolved oxygen (mg/dm³) and numbers of snails and pondweed after 12 weeks', cv: ['light (16 h per day) and temperature', 'volume of pond water and size of jar', 'number and length of pondweed shoots', 'decomposers present (pond sediment)', 'jar sealed'] },
    apparatus: ['Clear jars with airtight lids (1 dm³), pond water and a little sediment (decomposers)', 'Pondweed (Elodea) shoots of equal length, small pond snails', 'Lamp with timer, thermometer', 'Dissolved oxygen probe (or indicator); hydrogencarbonate indicator for CO₂'],
    safety: ['Wash hands after handling pond water and organisms; cover cuts.', 'Animals: keep numbers small, check them daily and return them to a pond at the end (IB animal experimentation guidelines).', 'Keep water away from the lamp and its plug.'],
    method: ['Choose 16 hours of light, 4 pondweed shoots, decomposers present, and 2 snails.', 'Press <b>▶ Run 12 weeks</b>: watch oxygen and carbon dioxide in the water and the numbers of organisms each week.', 'Press <b>➕ Record</b> to record the result after 12 weeks. Repeat with 0, 4, 6, 8 and 10 snails.', 'Investigate light (0, 8 h), fewer plants, and no decomposers.'],
    controls: [
      { id: 'light', label: 'Light', type: 'select', value: '16', options: LIGHT },
      { id: 'plants', label: 'Pondweed shoots (producers)', min: 0, max: 8, step: 1, value: 4 },
      { id: 'snails', label: 'Snails (consumers)', min: 0, max: 10, step: 1, value: 2 },
      { id: 'decomp', label: 'Decomposers present (pond sediment)', type: 'check', value: true },
      { id: 'weeks', label: 'Time', min: 2, max: 12, step: 1, value: 12, unit: 'weeks' }
    ],
    columns: [
      { key: 'light', label: 'Light', unit: 'h/day', dp: 0, group: true }, { key: 'plants', label: 'Pondweed at start', dp: 0 }, { key: 'snails', label: 'Snails at start', dp: 0 }, { key: 'dec', label: 'Decomposers', num: false, group: true },
      { key: 'weeks', label: 'Weeks', dp: 0 }, { key: 'O2', label: 'Dissolved O₂', unit: 'mg/dm³', dp: 1 }, { key: 'Sn', label: 'Snails alive', dp: 0 }, { key: 'Pl', label: 'Pondweed (relative)', dp: 0 }, { key: 'stab', label: 'Stable?', num: false }
    ],
    graph: { x: 'snails', y: 'O2', group: 'light' },
    hints: ['Below about 3 mg/dm³ of dissolved oxygen, snails start to die.', 'In the dark, plants respire but cannot photosynthesise.', 'Without decomposers, which nutrients run out?', 'A stable system keeps similar numbers and oxygen levels.'],
    analyse: [
      { id: 'snails', q: 'Describe how the number of snails affected dissolved oxygen and stability. Use your data.', marks: 3, lines: 4, points: [
        { re: [/more snails.*(less|lower|fall)|(lower|less) oxygen.*more snails|oxygen (fell|decreased|dropped)/], marks: 1, ok: 'More snails: lower oxygen.', miss: 'Describe the effect of more snails on oxygen.' }, { re: [/\d/], marks: 1, ok: 'You quote data.', miss: 'Quote oxygen values or numbers.' },
        { re: [/respir|graz|eat|fewer plants|photosynth/], marks: 1, ok: 'You explain with respiration and grazing.', miss: 'Explain: snails respire and graze the pondweed, so less O₂ is made and more is used.' }] },
      { id: 'dark', q: 'Explain what happened to the mesocosm kept in darkness.', marks: 2, lines: 3, points: [
        { re: [/no (light|photosynth)|cannot photosynth|without light/], marks: 1, ok: 'No photosynthesis.', miss: 'Explain: without light there is no photosynthesis.' }, { re: [/respir.*(use|oxygen)|oxygen (fell|ran out|used)|die|collapse/], marks: 1, ok: 'Respiration used up the oxygen and organisms died.', miss: 'Say what happened to oxygen and the organisms.' }] },
      { id: 'dec', q: 'Explain the role of decomposers in keeping the mesocosm stable.', marks: 2, lines: 3, points: [
        { re: [/recycl|nutrient|mineral|nitrate|phosphate|break down|decompos/], marks: 1, ok: 'They recycle nutrients from dead matter.', miss: 'Explain that decomposers break down dead matter and recycle nutrients.' }, { re: [/co2|co₂|carbon dioxide|photosynth|plant growth|grow/], marks: 1, ok: 'Releasing CO₂ and minerals for plants.', miss: 'Link to plants: they release CO₂ and minerals for photosynthesis and growth.' }] }
    ],
    evaluate: [
      { id: 'model', q: 'Give two ways a mesocosm is different from a real pond, and why that limits the conclusions.', marks: 2, lines: 4, points: [
        { re: [/small|size|few species|simple|closed|sealed|no (migration|immigration)|short/], marks: 1, ok: 'Smaller and simpler, closed.', miss: 'For example: far fewer species, closed to migration, short time.' },
        { re: [/real|nature|cannot|may not|apply|generali|predict|weather|season|temperature/], marks: 1, ok: 'Results may not apply to real ecosystems.', miss: 'Explain: results may not apply to large natural systems with weather, seasons and many species.' }] },
      { id: 'eth', q: 'State one ethical consideration when using animals in a mesocosm.', marks: 1, lines: 2, points: [
        { re: [/harm|suffer|die|return|minimi|few|welfare|check|remove|stress/], marks: 1, ok: 'Valid.', miss: 'For example: use few animals, check them daily, and remove them if oxygen falls; return them to the pond.' }] }
    ],
    model: '<ul><li>Daily steps: photosynthesis = 0.055 × pondweed × light fraction × CO₂ and nutrient limits; respiration by pondweed (0.012 per unit) and snails (0.18 per snail); decomposers break down detritus (0.12 per day, or 0.01 without them), using O₂ and releasing CO₂ and nutrients.</li>' +
      '<li>Snails graze pondweed and grow slowly when O₂ > 3 mg/dm³; below that they die. "Stable" means after the time O₂ > 4 mg/dm³ and snails and pondweed are at least half their starting numbers. The numbers are a simplified model, not measurements.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, raf = null, playing = false, t0 = 0, W = 680, H = 300, res = null;
    api.stage.innerHTML = '<canvas id="ms-cv" width="680" height="300" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="A sealed jar ecosystem with pondweed and snails"></canvas><p class="small" id="ms-cap" style="margin:6px 0;font-weight:700" aria-live="polite"></p><canvas class="vl-chart" id="ms-ch" style="height:220px"></canvas><div id="ms-lg"></div>';
    var cv = api.stage.querySelector('#ms-cv'), c = cv.getContext('2d'), ch = api.stage.querySelector('#ms-ch'), cap = api.stage.querySelector('#ms-cap');
    function vals() { var v = api.vals(); return { light: v.light, plants: v.plants, snails: v.snails, decomp: v.decomp, weeks: v.weeks }; }
    function draw(p) {
      var v = api.vals(), now = performance.now() / 1000; c.clearRect(0, 0, W, H);
      if (+v.light) { c.fillStyle = '#fde047'; c.beginPath(); c.arc(60, 50, 22, 0, 7); c.fill(); }
      var turb = Math.min(0.6, (p.D / 20)), wat = p.O2 > 4 ? 'rgba(186,230,253,' : p.O2 > 2 ? 'rgba(190,242,100,' : 'rgba(163,140,80,';
      c.fillStyle = wat + (0.45 + turb) + ')'; c.fillRect(150, 70, 230, 210); c.strokeStyle = '#475569'; c.lineWidth = 4; c.strokeRect(150, 60, 230, 222); c.fillStyle = '#64748b'; c.fillRect(140, 48, 250, 14);
      if (v.decomp) { c.fillStyle = '#78350f'; c.fillRect(152, 262, 226, 18); }
      var np = Math.round(p.P / 10 * 1.0); for (var i = 0; i < Math.min(12, Math.max(0, np)); i++) { var x = 170 + i * 18; c.strokeStyle = '#15803d'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, 262); c.bezierCurveTo(x - 6, 220, x + 8, 170, x, 120 + (i % 3) * 15); c.stroke(); for (var k = 0; k < 6; k++) { c.fillStyle = '#16a34a'; c.beginPath(); c.ellipse(x + (k % 2 ? 5 : -5), 250 - k * 22, 5, 2.2, k % 2 ? 0.4 : -0.4, 0, 7); c.fill(); } }
      var ns = Math.round(p.S); for (i = 0; i < Math.min(14, ns); i++) { var sx = 165 + ((i * 47 + now * 6 * (playing ? 1 : 0)) % 200), sy = 255 - (i % 4) * 40; c.fillStyle = '#a16207'; c.beginPath(); c.arc(sx, sy, 6, 0, 7); c.fill(); c.strokeStyle = '#713f12'; c.lineWidth = 1.5; c.beginPath(); c.arc(sx, sy, 3, 0, 5); c.stroke(); c.fillStyle = '#a8a29e'; c.fillRect(sx + 4, sy + 3, 7, 3); }
      if (p.O2 > 5 && +v.light) for (i = 0; i < 8; i++) { c.strokeStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(180 + i * 25, 250 - ((now * 30 + i * 37) % 170), 2.5, 0, 7); c.stroke(); }
      // gauges
      function gauge(x, label, val, max, col) { c.fillStyle = '#e2e8f0'; c.fillRect(x, 70, 30, 200); var h = Math.min(1, val / max) * 200; c.fillStyle = col; c.fillRect(x, 270 - h, 30, h); c.fillStyle = '#0f172a'; c.font = 'bold 11px system-ui'; c.textAlign = 'center'; c.fillText(label, x + 15, 290); c.fillText(fx(val, 1), x + 15, 64); }
      gauge(430, 'O₂', p.O2, 14, p.O2 > 4 ? '#0ea5e9' : '#ef4444'); gauge(490, 'CO₂', p.CO2, 14, '#64748b'); gauge(550, 'Snails', p.S, 14, '#a16207'); gauge(610, 'Weed', p.P / 10, 10, '#16a34a');
      c.fillStyle = '#0f172a'; c.font = 'bold 15px system-ui'; c.textAlign = 'left'; c.fillText('Week ' + fx(p.t, 1), 16, 26); c.font = '11px system-ui'; c.fillText('O₂ and CO₂ in mg/dm³', 430, 30);
    }
    function drawChart() {
      if (!res) return; var series = [{ name: 'Dissolved O₂ (mg/dm³)', pts: res.pts.map(function (p) { return [p.t, p.O2]; }), color: '#0072B2' }, { name: 'Snails', pts: res.pts.map(function (p) { return [p.t, p.S]; }), color: '#E69F00' }, { name: 'Pondweed ÷ 10', pts: res.pts.map(function (p) { return [p.t, p.P / 10]; }), color: '#009E73' }, { name: 'CO₂ (mg/dm³)', pts: res.pts.map(function (p) { return [p.t, p.CO2]; }), color: '#999', dash: true }];
      api.chart(ch, { xLabel: 'Time / weeks', yLabel: 'Amount', xmin: 0, xmax: api.vals().weeks, ymin: 0, ymax: 14, series: series });
      api.stage.querySelector('#ms-lg').innerHTML = api.legend(series);
    }
    function readings() { if (!res) return api.readings([['Result', 'press ▶ Run']]); var l = res.last; api.readings([['Dissolved O₂', fx(l.O2, 1) + ' mg/dm³'], ['CO₂', fx(l.CO2, 1) + ' mg/dm³'], ['Snails alive', fx(l.S, 0)], ['Pondweed (relative)', fx(l.P, 0)], ['Stable?', res.stable ? 'yes' : 'no']]); }
    function frame() { var el = Math.min(1, (performance.now() - t0) / 9000), i = Math.min(res.pts.length - 1, Math.floor(el * (res.pts.length - 1))); draw(res.pts[i]);
      if (el >= 1) { playing = false; api.label('run', '▶ Run'); readings(); drawChart(); var l = res.last; cap.textContent = (res.stable ? 'Stable: ' : 'Not stable: ') + 'after ' + api.vals().weeks + ' weeks O₂ is ' + fx(l.O2, 1) + ' mg/dm³, ' + fx(l.S, 0) + ' snails, pondweed ' + fx(l.P, 0) + '.'; api.status('➕ Record, then change one variable.'); return; } if (playing) raf = requestAnimationFrame(frame); }
    api.actions([
      { id: 'run', label: '▶ Run', main: true, fn: function () { if (playing) return; res = simulate(vals()); playing = true; t0 = performance.now(); api.label('run', '⏳ Running…'); frame(); } },
      { id: 'rec', label: '➕ Record', fn: function () { if (!res) return api.status('Run the mesocosm first.'); var v = api.vals(), l = res.last; api.record({ light: +v.light, plants: v.plants, snails: v.snails, dec: v.decomp ? 'yes' : 'no', weeks: v.weeks, O2: +l.O2.toFixed(1), Sn: Math.round(l.S), Pl: Math.round(l.P), stab: res.stable ? 'yes' : 'no' }); } }
    ]);
    api.onChange = function () { res = null; readings(); var v = vals(); draw({ t: 0, P: v.plants * 10, S: v.snails, O2: 8, CO2: 2, D: 5 }); cap.textContent = ''; };
    api.onChange();
    api.status('Press ▶ Run.');
    window.BV_MS = { simulate: simulate };
  }
})();
