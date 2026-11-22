/* Lung volumes laboratory: the spirometer · BioscienceVista · by George Apidi
   IB DP B3.1.6: breathe into a spirometer and read tidal volume, inspiratory and expiratory reserve volumes and vital capacity from the
   trace. Compare people and the effect of exercise; calculate ventilation rate. */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var PEOPLE = { f: ['Adult female, 165 cm', 0.45, 2.3, 0.95, 1.1, 12], m: ['Adult male, 178 cm', 0.5, 3.0, 1.2, 1.2, 12], ath: ['Trained athlete (male)', 0.55, 3.7, 1.5, 1.3, 10], asth: ['Adult male with asthma (between attacks)', 0.5, 2.4, 0.85, 1.6, 15] };   // name, TV, IRV, ERV, RV (dm³), rate
  var PL = [['f', PEOPLE.f[0]], ['m', PEOPLE.m[0]], ['ath', PEOPLE.ath[0]], ['asth', PEOPLE.asth[0]]];
  var ACT = [['rest', 'At rest'], ['walk', 'After walking (2 min)'], ['run', 'After running (2 min)']];

  function model(o) {
    var P = PEOPLE[o.who], k = o.act === 'rest' ? 0 : o.act === 'walk' ? 0.35 : 1;
    var inc = k * (o.who === 'ath' ? 1.6 : 1.3), TV = P[1] + inc, rate = P[5] + k * (o.who === 'ath' ? 10 : 14), VC = P[1] + P[2] + P[3];
    return { TV: TV, IRV: P[2] - inc * 0.65, ERV: P[3] - inc * 0.35, VC: VC, RV: P[4], TLC: VC + P[4], rate: rate, vent: TV * rate };
  }

  LABS.lungs = {
    id: 'lungs', title: 'Lung volumes laboratory: spirometry',
    tags: ['Biology', 'Human physiology', 'IB DP B3.1.6 lung volumes', 'IGCSE', 'A Level'],
    background: '<p>Ventilation moves air in and out of the lungs. A <b>spirometer</b> records the volume of air breathed in and out against time. From the trace:</p><ul><li><b>Tidal volume (TV)</b>: volume breathed in or out in one normal breath (about 0.5 dm³ at rest).</li><li><b>Inspiratory reserve volume (IRV)</b>: the extra volume that can be breathed in after a normal inhalation.</li><li><b>Expiratory reserve volume (ERV)</b>: the extra volume that can be forced out after a normal exhalation.</li><li><b>Vital capacity (VC)</b> = TV + IRV + ERV: the largest volume that can be breathed out after the deepest breath in.</li><li><b>Residual volume</b>: air that always stays in the lungs (cannot be measured with a simple spirometer).</li></ul>' +
      '<p><b>Ventilation rate</b> = tidal volume × breaths per minute. During exercise both tidal volume (using part of the reserve volumes) and breathing rate increase, to supply more oxygen and remove more carbon dioxide. Vital capacity depends on body size, sex and fitness; obstructive conditions such as asthma narrow the airways and reduce the volumes that can be moved quickly.</p>',
    objectives: ['Read tidal volume, IRV, ERV and vital capacity from a spirometer trace.', 'Calculate breathing rate and ventilation rate.', 'Compare lung volumes of different people.', 'Explain the changes in breathing during exercise.'],
    rq: 'How does exercise (rest, walking, running) affect tidal volume, breathing rate and ventilation rate?',
    hypPrompt: 'Predict how tidal volume and breathing rate change after running, and explain why.',
    hypothesis: { marks: 3, points: [
      { re: [/tidal.*(increase|larger|bigger|deeper)|deeper/], marks: 1, ok: 'Tidal volume increases.', miss: 'Predict the change in tidal volume.' },
      { re: [/rate.*(increase|faster|more)|faster|more breaths/], marks: 1, ok: 'Breathing rate increases.', miss: 'Predict the change in breathing rate.' },
      { re: [/oxygen|o2|o₂|carbon dioxide|co2|co₂|respiration|muscle/], marks: 1, ok: 'You explain with O₂ demand / CO₂ removal.', miss: 'Explain using oxygen for respiration and removing CO₂.' }] },
    variables: { iv: 'level of activity before the measurement', dv: 'tidal volume (dm³), breaths per minute and ventilation rate (dm³ min⁻¹)', cv: ['same person', 'standing posture', 'duration of exercise', 'nose clip and mouthpiece used the same way', 'time between exercise and measurement'] },
    apparatus: ['Spirometer with a soda-lime canister (or a digital spirometer with sensor)', 'Disposable mouthpiece and nose clip', 'Stopwatch', 'Medical-grade oxygen supply for the spirometer chamber'],
    safety: ['Only healthy volunteers; stop if dizzy. Do not use with people with heart or lung conditions without medical advice.', 'New sterile mouthpiece for each person; soda lime must be fresh (it absorbs CO₂ so it does not build up).', 'Ethical: volunteers can withdraw at any time; keep personal data private.'],
    method: ['Choose a person and <b>At rest</b>. Press <b>▶ Breathe</b>: 4 normal breaths, a maximum breath in, a maximum breath out, then normal breathing.', 'Read the volumes from the trace (grid lines every 0.5 dm³; time in seconds) and from the readings.', 'Press <b>➕ Record</b>. Repeat after walking and after running, and for the other people.'],
    controls: [
      { id: 'who', label: 'Volunteer', type: 'select', value: 'm', options: PL },
      { id: 'act', label: 'Activity before the test', type: 'select', value: 'rest', options: ACT }
    ],
    columns: [
      { key: 'who', label: 'Volunteer', num: false, group: true }, { key: 'act', label: 'Activity', num: false, group: true }, { key: 'TV', label: 'Tidal volume', unit: 'dm³', dp: 2 }, { key: 'IRV', label: 'IRV', unit: 'dm³', dp: 2 },
      { key: 'ERV', label: 'ERV', unit: 'dm³', dp: 2 }, { key: 'VC', label: 'Vital capacity', unit: 'dm³', dp: 2 }, { key: 'rate', label: 'Breaths', unit: 'per min', dp: 0 }, { key: 'vent', label: 'Ventilation rate', unit: 'dm³ min⁻¹', dp: 1 }
    ],
    graph: { x: 'rate', y: 'vent', group: 'who' },
    hints: ['TV: from a normal trough to the next peak.', 'IRV: from the top of a normal breath to the top of the deepest breath.', 'VC: from the top of the deepest breath in to the bottom of the deepest breath out.', 'Ventilation rate = TV × breaths per minute.'],
    analyse: [
      { id: 'vc', q: 'A trace shows TV 0.5 dm³, IRV 3.0 dm³ and ERV 1.2 dm³. Calculate the vital capacity.', marks: 1, lines: 1, number: { value: 4.7, tol: 0.01, unit: 'dm³', dp: 1 } },
      { id: 'vent', q: 'Calculate the ventilation rate of the adult male after running, using your readings.', marks: 2, lines: 2, number: { value: function () { return model({ who: 'm', act: 'run' }).vent; }, tol: 0.06, unit: 'dm³ min⁻¹', dp: 1 } },
      { id: 'ex', q: 'Describe and explain the changes in tidal volume, IRV and breathing rate after running.', marks: 3, lines: 5, points: [
        { re: [/tidal.*(increas|larger|bigger)/], marks: 1, ok: 'TV increases.', miss: 'Describe the change in TV.' }, { re: [/irv.*(decreas|smaller|less)|reserve.*(used|smaller)/], marks: 1, ok: 'IRV decreases (used for the deeper breaths).', miss: 'Describe the change in IRV.' }, { re: [/oxygen|co2|co₂|carbon dioxide|respir/], marks: 1, ok: 'More O₂ in, more CO₂ out for respiration.', miss: 'Explain with O₂ and CO₂.' }] }
    ],
    evaluate: [
      { id: 'cmp', q: 'Suggest two reasons why the vital capacity of the athlete is larger than that of the other adults.', marks: 2, lines: 3, points: [
        { re: [/train|exercise|stronger|muscle|diaphragm|intercostal/], marks: 1, ok: 'Training strengthens breathing muscles.', miss: 'For example: training strengthens the diaphragm and intercostal muscles.' }, { re: [/size|tall|height|body|larger (chest|lungs)|male|genetic/], marks: 1, ok: 'Body size / chest size.', miss: 'For example: larger body and chest size.' }] },
      { id: 'lim', q: 'Why can a spirometer not measure residual volume or total lung capacity directly?', marks: 1, lines: 2, points: [
        { re: [/always (stays|remains)|cannot (breathe|be breathed) out|never leaves|remains in|left in/], marks: 1, ok: 'Residual air never leaves the lungs.', miss: 'Residual air always stays in the lungs, so it never reaches the spirometer.' }] }
    ],
    model: '<ul><li>Resting values (dm³): female TV 0.45, IRV 2.3, ERV 0.95; male 0.50, 3.0, 1.2; athlete 0.55, 3.7, 1.5; asthma 0.50, 2.4, 0.85. Breaths per minute 12, 12, 10, 15. These are typical adult values.</li>' +
      '<li>After walking TV rises by 35 % of the exercise increase, after running by the full increase (1.3 dm³; 1.6 for the athlete), breathing rate by 14 (10 for the athlete) breaths per minute; IRV and ERV fall as TV uses part of them.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, raf = null, playing = false, t0 = 0, W = 680, H = 320, sim = null, trace = [];
    api.stage.innerHTML = '<canvas id="lu-cv" width="680" height="320" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="A spirometer trace and a person breathing"></canvas><p class="small" id="lu-cap" style="margin:6px 0;font-weight:700" aria-live="polite"></p>';
    var cv = api.stage.querySelector('#lu-cv'), c = cv.getContext('2d'), cap = api.stage.querySelector('#lu-cap');
    var GX = 230, GW = 430, GY = 20, GH = 270, VMAX = 6.5, TMAX = 40;
    function compute() { var v = api.vals(); sim = model(v); sim.v = v; }
    function vol(t) {   // lung air above residual: normal breaths, deep in at ~20 s, deep out, normal again
      var per = 60 / sim.rate, base = sim.ERV, phase = (t % per) / per, normal = base + sim.TV * (0.5 - 0.5 * Math.cos(phase * 2 * Math.PI));
      var tIn = per * 4, tOut = tIn + 4;
      if (t < tIn) return normal;
      if (t < tIn + 2.5) return base + sim.TV * 0 + (sim.VC - base) * Math.sin((t - tIn) / 2.5 * Math.PI / 2);   // deep breath in to VC (above 0 = after max exhale)
      if (t < tOut + 2.5) return sim.VC * (1 - Math.sin(Math.min(1, (t - tIn - 2.5) / 4) * Math.PI / 2));
      if (t < tOut + 5) return base * Math.sin((t - tOut - 2.5) / 2.5 * Math.PI / 2);
      return base + sim.TV * (0.5 - 0.5 * Math.cos(((t - tOut - 5) % per) / per * 2 * Math.PI));
    }
    function draw(tt) {
      c.clearRect(0, 0, W, H);
      // grid
      c.strokeStyle = '#e2e8f0'; c.lineWidth = 1; c.fillStyle = '#64748b'; c.font = '9px system-ui'; c.textAlign = 'right';
      for (var vv = 0; vv <= VMAX; vv += 0.5) { var y = GY + GH - vv / VMAX * GH; c.beginPath(); c.moveTo(GX, y); c.lineTo(GX + GW, y); c.stroke(); if (vv % 1 === 0) c.fillText(vv.toFixed(0), GX - 4, y + 3); }
      c.textAlign = 'center'; for (var s = 0; s <= TMAX; s += 5) { var x = GX + s / TMAX * GW; c.beginPath(); c.moveTo(x, GY); c.lineTo(x, GY + GH); c.stroke(); c.fillText(s + ' s', x, GY + GH + 12); }
      c.save(); c.translate(GX - 22, GY + GH / 2); c.rotate(-Math.PI / 2); c.fillText('Volume above residual / dm³', 0, 0); c.restore();
      // trace
      c.strokeStyle = '#2563eb'; c.lineWidth = 2; c.beginPath(); for (var t = 0; t <= tt; t += 0.05) { var x2 = GX + t / TMAX * GW, y2 = GY + GH - vol(t) / VMAX * GH; t ? c.lineTo(x2, y2) : c.moveTo(x2, y2); } c.stroke();
      // person and lungs
      var now = vol(tt), f = now / Math.max(sim.VC, 4);
      c.fillStyle = '#fde68a'; c.beginPath(); c.arc(90, 60, 24, 0, 7); c.fill(); c.fillStyle = '#93c5fd'; c.fillRect(56, 88, 68, 150); c.fillStyle = '#334155'; c.fillRect(110, 64, 40, 6); c.fillStyle = '#64748b'; c.fillRect(150, 50, 40, 34); c.fillStyle = '#0f172a'; c.font = '9px system-ui'; c.fillText('spirometer', 170, 98);
      [-1, 1].forEach(function (sd) { c.fillStyle = 'rgba(244,114,182,.85)'; c.beginPath(); c.ellipse(90 + sd * 15, 155, 12 + 8 * f, 30 + 22 * f, 0, 0, 7); c.fill(); });
      c.strokeStyle = '#be185d'; c.lineWidth = 3; c.beginPath(); c.moveTo(90, 100); c.lineTo(90, 125); c.stroke();
      c.strokeStyle = '#7c2d12'; c.lineWidth = 3; c.beginPath(); c.moveTo(60, 215 - 10 * f); c.quadraticCurveTo(90, 195 - 30 * f, 120, 215 - 10 * f); c.stroke(); c.fillStyle = '#7c2d12'; c.font = '9px system-ui'; c.fillText('diaphragm', 90, 232);
      // labels after the deep breath
      if (tt > 60 / sim.rate * 4 + 8) {
        var tIn = 60 / sim.rate * 4, xL = GX + (tIn + 2.6) / TMAX * GW; c.strokeStyle = '#dc2626'; c.lineWidth = 1.5; c.fillStyle = '#dc2626'; c.font = 'bold 10px system-ui'; c.textAlign = 'left';
        function bracket(x, v1, v2, lab) { var y1 = GY + GH - v1 / VMAX * GH, y2b = GY + GH - v2 / VMAX * GH; c.beginPath(); c.moveTo(x, y1); c.lineTo(x, y2b); c.moveTo(x - 4, y1); c.lineTo(x + 4, y1); c.moveTo(x - 4, y2b); c.lineTo(x + 4, y2b); c.stroke(); c.fillText(lab, x + 6, (y1 + y2b) / 2 + 3); }
        bracket(GX + 2.6 / TMAX * GW * 6, sim.ERV, sim.ERV + sim.TV, 'TV'); bracket(xL - 12, sim.ERV + sim.TV, sim.VC, 'IRV'); bracket(GX + 6, 0, sim.ERV, 'ERV'); bracket(xL + 34, 0, sim.VC, 'VC');
      }
      c.fillStyle = '#0f172a'; c.font = 'bold 13px system-ui'; c.textAlign = 'left'; c.fillText(PEOPLE[sim.v.who][0] + ' · ' + ACT.filter(function (a) { return a[0] === sim.v.act; })[0][1], 10, 300);
    }
    function readings() { api.readings([['Tidal volume', fx(sim.TV, 2) + ' dm³'], ['IRV', fx(sim.IRV, 2) + ' dm³'], ['ERV', fx(sim.ERV, 2) + ' dm³'], ['Vital capacity', fx(sim.VC, 2) + ' dm³'], ['Breaths per minute', fx(sim.rate, 0)], ['Ventilation rate', fx(sim.vent, 1) + ' dm³ min⁻¹']]); }
    function frame() { var el = Math.min(1, (performance.now() - t0) / 14000), tt = el * TMAX; draw(tt); var tIn = 60 / sim.rate * 4;
      cap.textContent = tt < tIn ? 'Normal breathing: each rise is one tidal volume.' : tt < tIn + 2.5 ? 'Deepest possible breath in…' : tt < tIn + 9 ? 'Deepest possible breath out: the full drop is the vital capacity.' : 'Normal breathing again.';
      if (el >= 1) { playing = false; api.label('run', '▶ Breathe'); readings(); api.status('Read the volumes from the trace, then ➕ Record.'); return; } if (playing) raf = requestAnimationFrame(frame); }
    api.actions([
      { id: 'run', label: '▶ Breathe', main: true, fn: function () { if (playing) return; compute(); playing = true; t0 = performance.now(); api.label('run', '⏳ Breathing…'); frame(); } },
      { id: 'rec', label: '➕ Record', fn: function () { var v = sim.v; api.record({ who: PEOPLE[v.who][0], act: ACT.filter(function (a) { return a[0] === v.act; })[0][1], TV: +sim.TV.toFixed(2), IRV: +sim.IRV.toFixed(2), ERV: +sim.ERV.toFixed(2), VC: +sim.VC.toFixed(2), rate: Math.round(sim.rate), vent: +sim.vent.toFixed(1) }); } }
    ]);
    api.onChange = function () { compute(); readings(); draw(TMAX); cap.textContent = ''; };
    compute(); readings(); draw(0);
    api.status('Press ▶ Breathe.');
    window.BV_LU = { model: model };
  }
})();
