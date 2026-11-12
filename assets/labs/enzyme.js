/* Enzyme activity laboratory · Learnova · by George Apidi */
(function () {
  var M = window.LABM, LABS = window.LABS = window.LABS || {};
  LABS.enzyme = {
    id: 'enzyme', title: 'Enzyme activity laboratory',
    tags: ['Biology', 'Molecular biology', 'MYP 4–5', 'IB DP C1.1', 'IGCSE', 'A Level'],
    background: '<p>Enzymes are globular proteins that speed up reactions. The substrate binds to the <b>active site</b>, forming an enzyme–substrate complex, and leaves as product. The enzyme is not used up.</p>' +
      '<p><b>Temperature.</b> Warmer molecules move faster, so enzyme and substrate collide more often and with more energy: the rate rises. Above the optimum, bonds holding the enzyme\'s shape break, the active site changes shape and the enzyme is <b>denatured</b>; the rate falls steeply.</p>' +
      '<p><b>pH</b> changes the charges on the active site. Each enzyme has an optimum pH: pepsin in the stomach works best near pH 2, salivary amylase near pH 7.</p>' +
      '<p><b>Substrate concentration.</b> More substrate means more collisions until every active site is busy (saturated). Then the rate levels off at V<sub>max</sub>.</p>' +
      '<p><b>Inhibitors.</b> A competitive inhibitor fits the active site and competes with the substrate, so lots of substrate overcomes it. A non-competitive inhibitor binds elsewhere and changes the active site, so extra substrate cannot overcome it.</p>',
    objectives: ['Measure the initial rate of an enzyme-controlled reaction.', 'Find the optimum temperature and pH of an enzyme from your own data.', 'Explain the shape of rate graphs using collisions, active sites and denaturation.', 'Compare competitive and non-competitive inhibition.'],
    rq: 'How does temperature affect the initial rate of reaction of salivary amylase? (Then extend it: pH, substrate concentration, enzyme concentration and inhibitors.)',
    hypPrompt: 'Predict how the rate will change from 0 °C to 70 °C, and explain why: "If … then … because …"',
    hypothesis: { marks: 3, points: [
      { re: [/\bif\b.*\bthen\b|\bas\b.*\b(increase|rise)s?\b/], marks: 1, ok: 'Clear prediction.', miss: 'Write the prediction as "If … then …".' },
      { re: [/kinetic|collision|collide|move faster|more energy/], marks: 1, ok: 'You explain the rise with kinetic energy and collisions.', miss: 'Explain the rise: molecules gain kinetic energy and collide more often.' },
      { re: [/denatur|active site.*(shape|change)|shape.*active site/], marks: 1, ok: 'You explain the fall with denaturation.', miss: 'Explain what happens above the optimum: the active site changes shape (denaturation).' }],
      wrong: [{ re: /enzymes? (are|is|get|gets)? ?killed|kills? the enzyme/, msg: 'Enzymes are not alive, so they are not killed: they are denatured.' }] },
    variables: { iv: 'temperature (°C)', dv: 'initial rate of reaction (mmol/dm³ of product per minute), measured over the first minute',
      cv: ['pH of the buffer (pH 6.8 for amylase)', 'starting substrate concentration (20 mmol/dm³)', 'enzyme concentration (1.0, relative)', 'no inhibitor', 'time over which the rate is measured (60 s)'] },
    apparatus: ['Enzyme solution and buffer solutions (pH 1–12)', 'Substrate solution (e.g. 1 % starch for amylase)', 'Thermostatic water baths, 0–90 °C', 'Thermometer, stopwatch, pipettes', 'Colorimeter or iodine test to follow the reaction', 'Test tubes and rack'],
    safety: ['Wear eye protection: buffers can be acidic or alkaline.', 'Take care with water baths above 50 °C: use tongs or a test-tube holder.', 'Hydrogen peroxide (catalase) is an irritant: wash off spills with water.', 'Enzymes can cause allergies: avoid skin contact and do not breathe in powders.'],
    method: ['Choose the enzyme and set the pH, substrate and enzyme concentration. Leave them the same for the whole temperature investigation.', 'Set the temperature and press <b>Start</b>. The model runs for 3 minutes (shown faster).', 'When it stops, press <b>Record trial</b> to add the initial rate to your results table.', 'Repeat each temperature three times. Change the temperature in steps of 10 °C (smaller steps near the optimum).', 'In <b>4 Results</b>, plot the mean initial rate against temperature.'],
    controls: [
      { id: 'enz', label: 'Enzyme', type: 'select', value: 'amylase', options: Object.keys(M.ENZYMES).map(function (k) { return [k, M.ENZYMES[k].name]; }) },
      { id: 'T', label: 'Temperature', min: 0, max: 90, step: 1, value: 37, unit: '°C' },
      { id: 'pH', label: 'pH', min: 1, max: 12, step: 0.1, value: 6.8, dp: 1 },
      { id: 'S', label: 'Substrate concentration', min: 1, max: 100, step: 1, value: 20, unit: 'mmol/dm³' },
      { id: 'E', label: 'Enzyme concentration (relative)', min: 0.2, max: 2, step: 0.1, value: 1, dp: 1 },
      { id: 'inh', label: 'Inhibitor', type: 'select', value: 'none', options: [['none', 'None'], ['comp', 'Competitive'], ['non', 'Non-competitive']] },
      { id: 'I', label: 'Inhibitor concentration', min: 0, max: 10, step: 0.5, value: 4, unit: 'mmol/dm³', dp: 1 }
    ],
    columns: [
      { key: 'enzyme', label: 'Enzyme', num: false, group: true }, { key: 'T', label: 'Temperature', unit: '°C', dp: 0 }, { key: 'pH', label: 'pH', dp: 1 },
      { key: 'S', label: 'Substrate', unit: 'mmol/dm³', dp: 0 }, { key: 'E', label: 'Enzyme conc.', dp: 1 }, { key: 'inh', label: 'Inhibitor', num: false, group: true },
      { key: 'rate', label: 'Initial rate', unit: 'mmol/dm³/min', dp: 2 }, { key: 'P3', label: 'Product after 3 min', unit: 'mmol/dm³', dp: 2 }
    ],
    graph: { x: 'T', y: 'rate', group: 'enzyme' },
    hints: ['Keep everything except temperature the same. Change only one control at a time.', 'Repeat each temperature three times; the results table and graph use the mean.', 'Near the peak, try steps of 2–5 °C to find the optimum more precisely.', 'To compare inhibitors, set the temperature and pH to the optimum, then vary the substrate concentration from 1 to 100 mmol/dm³ with each inhibitor.'],
    analyse: [
      { id: 'opt', q: 'From your results, what is the optimum temperature of the enzyme you tested most? Give a number.', marks: 1, lines: 1,
        number: { value: function (c) { return bestX(c.trials, 'T'); }, abs: 4, tol: 0, unit: '°C', dp: 0, missing: 'Record trials at several temperatures (with the same enzyme) first.' } },
      { id: 'shape', q: 'Describe and explain the shape of your graph of initial rate against temperature.', marks: 4, lines: 5, points: [
        { re: [/(increase|rise|go(es)? up).*(optimum|peak|maximum)|up to/], marks: 1, ok: 'You describe the rise to a peak.', miss: 'Describe the rise up to the optimum.' },
        { re: [/kinetic|collision|collide/], marks: 1, ok: 'Rise explained with kinetic energy / collisions.', miss: 'Explain the rise: more kinetic energy, more frequent successful collisions.' },
        { re: [/(decrease|fall|drop|go(es)? down)/], marks: 1, ok: 'You describe the fall.', miss: 'Describe the steep fall above the optimum.' },
        { re: [/denatur|active site.*shape|shape.*active site|bonds? break/], marks: 1, ok: 'Fall explained with denaturation.', miss: 'Explain the fall: bonds break, the active site changes shape, substrate no longer fits.' }],
        wrong: [{ re: /killed|dies|die\b/, msg: 'Enzymes are not living, so they cannot be killed; they are denatured.', minus: 1 }] },
      { id: 'inhib', q: 'Compare the effect of a competitive and a non-competitive inhibitor at high substrate concentration. Explain the difference.', marks: 3, lines: 4, points: [
        { re: [/competitive.*(overcome|same|reach|catch up|no (real )?effect|little effect)|(overcome|outcompete).*competitive/], marks: 1, ok: 'Competitive inhibition is overcome by more substrate.', miss: 'State that at high substrate the competitive inhibitor has little effect.' },
        { re: [/non.?competitive.*(lower|still|cannot|can\'t|reduced|less)|(lower|reduced) (vmax|maximum)/], marks: 1, ok: 'Non-competitive lowers the maximum rate.', miss: 'State that the non-competitive inhibitor still lowers the maximum rate.' },
        { re: [/(compete|same shape|binds? to the active site|fits? the active site).*|allosteric|another site|different site|elsewhere|changes? the (shape of the )?active site/], marks: 1, ok: 'Mechanism explained.', miss: 'Explain where each inhibitor binds: active site, or another (allosteric) site that changes the active site.' }] },
      { id: 'concl', q: 'Write a conclusion that answers the research question. Quote figures from your results.', marks: 3, lines: 4, points: [
        { re: [/\d/], marks: 1, ok: 'You quote data.', miss: 'Quote at least two values from your table (temperature and rate).' },
        { re: [/optimum|peak|maximum|highest/], marks: 1, ok: 'You state the optimum.', miss: 'State the optimum temperature.' },
        { re: [/(as|when) (the )?temperature (increase|rise)|increas.*then.*decreas|rise.*then.*fall/], marks: 1, ok: 'You describe the overall relationship.', miss: 'Describe the trend: rate rises to the optimum, then falls.' }] }
    ],
    evaluate: [
      { id: 'rep', q: 'Why did you repeat each temperature and calculate a mean?', marks: 2, lines: 3, points: [
        { re: [/anomal|outlier|odd result/], marks: 1, ok: 'Repeats help spot anomalies.', miss: 'Mention spotting anomalies.' },
        { re: [/reliab|random error|variation|precis|consistent/], marks: 1, ok: 'A mean reduces the effect of random error.', miss: 'Mention random error / reliability.' }] },
      { id: 'lim', q: 'Give one way a real laboratory experiment would differ from this model, and how you would control it.', marks: 2, lines: 3, points: [
        { re: [/temperature.*(change|drop|vary|not constant)|water bath|equilibrat|pre.?warm|acclimat/], marks: 1, ok: 'Temperature control is a real issue.', miss: 'For example: solutions must reach the bath temperature before mixing (equilibrate for 5 minutes).' },
        { re: [/timing|reaction time|end.?point|colou?r.*judg|subjective|human|colorimeter|stopwatch|data logger/], marks: 1, ok: 'Measurement error in the real lab.', miss: 'Mention a measurement problem, e.g. judging a colour change, and a fix (colorimeter, data logger).' }] },
      { id: 'ext', q: 'Suggest a further investigation you could carry out with this lab, and predict its result.', marks: 2, lines: 3, points: [
        { re: [/ph|substrate|enzyme concentration|inhibitor|pepsin|catalase|thermostable|taq/], marks: 1, ok: 'A suitable new independent variable.', miss: 'Name one new variable to change.' },
        { re: [/predict|expect|will|would/], marks: 1, ok: 'You make a prediction.', miss: 'Say what you expect to happen.' }] }
    ],
    model: '<ul><li>Rate follows the <b>Michaelis–Menten</b> equation: v = V<sub>max</sub>[S] / (K<sub>m</sub> + [S]), with V<sub>max</sub> proportional to enzyme concentration.</li>' +
      '<li><b>Temperature</b>: the rate constant follows the Arrhenius equation (activation energy 50 kJ/mol, so about ×1.9 per 10 °C) multiplied by the fraction of enzyme still folded (a two-state unfolding curve). Denaturation in the model is instant; in real enzymes it also depends on how long they are heated.</li>' +
      '<li><b>pH</b>: activity is a bell-shaped curve around each enzyme\'s optimum pH.</li>' +
      '<li><b>Inhibitors</b>: competitive raises K<sub>m</sub> to K<sub>m</sub>(1 + [I]/K<sub>i</sub>); non-competitive lowers V<sub>max</sub> to V<sub>max</sub>/(1 + [I]/K<sub>i</sub>), with K<sub>i</sub> = 2 mmol/dm³.</li>' +
      '<li>Substrate is used up as the reaction runs, so the product curve flattens over time. The <b>initial rate</b> is product formed in the first minute.</li>' +
      '<li>Each reading has a random error of about ±3 %, like a real measurement. The particles on screen show proportions, not real numbers of molecules.</li>' +
      '<li>Enzyme constants are typical classroom values, not measured data for one particular enzyme.</li></ul>',
    setup: setup
  };

  function bestX(trials, key) {   // x with the highest mean rate, using the enzyme with most trials
    if (!trials.length) return null;
    var cnt = {}; trials.forEach(function (t) { cnt[t.enzyme] = (cnt[t.enzyme] || 0) + 1; });
    var enz = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0], by = {};
    trials.filter(function (t) { return t.enzyme === enz; }).forEach(function (t) { (by[t[key]] = by[t[key]] || []).push(t.rate); });
    var best = null, bv = -1; Object.keys(by).forEach(function (x) { var m = by[x].reduce(function (s, v) { return s + v; }, 0) / by[x].length; if (m > bv) { bv = m; best = +x; } });
    return Object.keys(by).length >= 3 ? best : null;
  }

  function setup(api) {
    var E = api.E, fx = api.fx;
    api.stage.innerHTML = '<canvas class="vl-stage" id="ez-cv" height="260" aria-label="Particles in the reaction mixture"></canvas>' +
      '<p class="vl-note" style="margin:.4em 0"><span style="color:#0072B2">● enzyme</span> · <span style="color:#E69F00">● substrate</span> · <span style="color:#009E73">● product</span> · <span style="color:#D55E00">● inhibitor</span></p>' +
      '<canvas class="vl-chart" id="ez-ch" style="height:220px"></canvas>';
    var cv = api.stage.querySelector('#ez-cv'), ch = api.stage.querySelector('#ez-ch'), raf = null, run = null, last = null, parts = [], enzymes = [], inhs = [];
    function o() { var v = api.vals(); return { enzyme: v.enz, T: v.T, pH: v.pH, S: v.S, E: v.E, inh: v.inh, I: v.inh === 'none' ? 0 : v.I }; }
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function build() {
      var W = cv.clientWidth || 500, H = 260, v = o(); parts = []; enzymes = []; inhs = [];
      var n = Math.max(6, Math.min(140, Math.round(v.S * 1.4)));
      for (var i = 0; i < n; i++) parts.push({ x: rnd(10, W - 10), y: rnd(10, H - 10), vx: rnd(-1, 1), vy: rnd(-1, 1), p: false });
      for (var j = 0; j < Math.round(v.E * 6); j++) enzymes.push({ x: rnd(30, W - 30), y: rnd(30, H - 30), vx: rnd(-.4, .4), vy: rnd(-.4, .4), a: rnd(0, 6) });
      for (var k = 0; k < Math.round(v.I * 2); k++) if (v.inh !== 'none') inhs.push({ x: rnd(10, W - 10), y: rnd(10, H - 10), vx: rnd(-1, 1), vy: rnd(-1, 1) });
    }
    function draw(frac) {
      var dpr = window.devicePixelRatio || 1, W = cv.clientWidth || 500, H = 260; cv.width = W * dpr; cv.height = H * dpr;
      var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
      var v = o(), f = M.enzymeFactors(M.ENZYMES[v.enzyme], v.T, v.pH), sp = 0.4 + v.T / 40;
      var want = Math.round(parts.length * frac), have = parts.filter(function (p) { return p.p; }).length;
      for (var i = 0; i < parts.length && have < want; i++) if (!parts[i].p) { parts[i].p = true; have++; }
      function move(p, s) { p.x += p.vx * s; p.y += p.vy * s; if (p.x < 6 || p.x > W - 6) p.vx *= -1; if (p.y < 6 || p.y > H - 6) p.vy *= -1; p.x = Math.max(6, Math.min(W - 6, p.x)); p.y = Math.max(6, Math.min(H - 6, p.y)); }
      parts.forEach(function (p) { move(p, sp); c.fillStyle = p.p ? '#009E73' : '#E69F00'; c.beginPath(); if (p.p) { c.arc(p.x - 2, p.y, 2.6, 0, 7); c.arc(p.x + 3, p.y, 2.6, 0, 7); } else c.arc(p.x, p.y, 3.6, 0, 7); c.fill(); });
      inhs.forEach(function (p) { move(p, sp); c.fillStyle = '#D55E00'; c.fillRect(p.x - 3, p.y - 3, 6, 6); });
      var denat = 1 - f.folded, phOff = 1 - f.ph;
      enzymes.forEach(function (e) {
        move(e, sp * 0.4); e.a += 0.01;
        c.save(); c.translate(e.x, e.y); c.rotate(e.a); c.fillStyle = '#0072B2'; c.beginPath();
        for (var k = 0; k <= 40; k++) { var t = k / 40 * Math.PI * 2, r = 16 + (denat * 6 + phOff * 3) * Math.sin(5 * t + e.a * 3);
          var notch = denat < 0.5 && Math.abs(Math.atan2(Math.sin(t), Math.cos(t))) < 0.45 ? 7 * (1 - denat * 2) * (1 - phOff * 0.6) : 0;
          var rr = r - notch; k ? c.lineTo(rr * Math.cos(t), rr * Math.sin(t)) : c.moveTo(rr * Math.cos(t), rr * Math.sin(t)); }
        c.fill(); c.restore();
      });
      c.fillStyle = '#334155'; c.font = '12px system-ui'; c.fillText(v.T + ' °C · pH ' + fx(v.pH, 1) + (denat > 0.5 ? ' · enzyme denatured (active site lost its shape)' : phOff > 0.7 ? ' · active site charges changed by pH' : ''), 8, 16);
    }
    function liveChart(series) {
      api.chart(ch, { xLabel: 'Time / s', yLabel: 'Product / mmol dm⁻³', xmin: 0, xmax: 180, ymin: 0, series: series });
    }
    function readings(r, P, t) {
      var v = o();
      api.readings([['Time', t + ' s'], ['Product', fx(P, 2) + ' mmol/dm³'], ['Rate now', fx(r.v, 2) + ' mmol/dm³/min'], ['V max', fx(r.Vmax, 2) + ' mmol/dm³/min'], ['Active enzyme', Math.round(r.f.folded * r.f.ph * 100) + ' %'], ['Km', fx(r.Km, 1) + ' mmol/dm³']]);
    }
    function idle() {
      cancelAnimationFrame(raf); var r = M.enzymeRate(o()); build();
      (function loop() { draw(0); raf = requestAnimationFrame(loop); })();
      readings(r, 0, 0); api.status('Set the conditions, then press Start.');
      liveChart(last ? [{ name: 'last run', pts: last.pts, color: '#94a3b8', dash: true }] : [{ pts: [] }]);
      api.enable('rec', false);
    }
    function start() {
      cancelAnimationFrame(raf); build();
      var v = o(), course = M.enzymeTimeCourse(v, 180), noise = 1 + (Math.random() * 2 - 1) * 0.03, t0 = performance.now(), dur = 6000;
      var pts = course.map(function (p) { return [p.t, p.P * noise]; });
      run = { v: v, pts: pts, noise: noise };
      api.enable('start', false); api.enable('rec', false); api.status('Reaction running… (3 minutes shown in 6 seconds)');
      (function loop() {
        var k = Math.min(1, (performance.now() - t0) / dur), t = Math.round(k * 180), P = pts[t][1];
        draw(Math.min(1, P / v.S)); readings(M.enzymeRate(Object.assign({}, v, { S: Math.max(0, v.S - P) })), P, t);
        liveChart((last ? [{ name: 'last run', pts: last.pts, color: '#94a3b8', dash: true }] : []).concat([{ name: 'this run', pts: pts.slice(0, t + 1), color: '#0072B2' }]));
        if (k < 1) raf = requestAnimationFrame(loop);
        else { api.enable('start', true); api.enable('rec', true); api.status('Finished. Initial rate = ' + fx(pts[60][1], 2) + ' mmol/dm³ per min. Press Record trial.'); (function idleLoop() { draw(Math.min(1, P / v.S)); raf = requestAnimationFrame(idleLoop); })(); }
      })();
    }
    api.actions([
      { id: 'start', label: '▶ Start', main: true, fn: start },
      { id: 'stop', label: '■ Stop / reset', fn: function () { if (run && run.pts) last = run; run = null; api.enable('start', true); idle(); } },
      { id: 'rec', label: '➕ Record trial', fn: function () {
        if (!run) return; var v = run.v, e = M.ENZYMES[v.enzyme];
        api.record({ enzyme: e.name.split(' (')[0], T: v.T, pH: v.pH, S: v.S, E: v.E, inh: v.inh === 'none' ? 'none' : v.inh === 'comp' ? 'competitive' : 'non-competitive', rate: run.pts[60][1], P3: run.pts[180][1] });
        last = run; api.enable('rec', false);
      } }
    ]);
    api.onChange = function (v, id) { if (id) { if (run) last = run; run = null; api.enable('start', true); idle(); } };
    api.onShow = function () { if (!run) idle(); };
    idle();
  }
})();
