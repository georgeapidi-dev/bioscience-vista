/* Tropisms laboratory · VistaEd · by George Apidi
   IB DP C3.1.17 (and C3.1 auxin): grow seedlings with light from one side, all round or none; lay them on their side, or turn them on a
   clinostat. Remove or cover the tip, insert mica, or add an agar block with auxin. Watch auxin move and the shoots bend; measure the angle
   of curvature of ten seedlings over time. */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var STIM = [['side', 'Light from one side (left)'], ['all', 'Light from all sides (control)'], ['dark', 'Darkness'], ['grav', 'Laid on its side (gravity)'], ['clino', 'On its side on a rotating clinostat']];
  var TREAT = [['none', 'No treatment'], ['cut', 'Tip removed'], ['foil', 'Tip covered with a foil cap'], ['base', 'Foil around the base only'], ['mica', 'Mica sheet through the tip (stops sideways movement)'], ['agar', 'Tip removed, agar block with auxin on the right side']];

  function model(o) {   // o: {stim, treat, t (h)} -> mean angle (°): + = towards the left (towards the light), and growth (mm)
    var k = 1 - Math.exp(-o.t / 6), ang = 0, grow = (o.treat === 'cut' ? 0.2 : 1.1) * o.t, why = '';
    if (o.treat === 'agar') { ang = 28 * k; grow = 0.8 * o.t; why = 'Auxin from the block diffuses down the right side only: those cells elongate more, so the shoot bends to the left (no light needed).'; }
    else if (o.stim === 'side') {
      if (o.treat === 'none' || o.treat === 'base') { ang = 38 * k; why = 'The tip detects light; auxin moves to the shaded (right) side, cells there elongate more, so the shoot bends towards the light.'; }
      else if (o.treat === 'cut') why = 'No tip: no light detected and little auxin made, so no bending and little growth.';
      else if (o.treat === 'foil') why = 'The tip is covered: it cannot detect the direction of light, so it grows straight.';
      else why = 'The mica stops auxin moving sideways to the shaded side, so both sides grow equally: no bending.';
    } else if (o.stim === 'grav') { ang = o.treat === 'cut' ? 6 * k : 80 * k; why = 'Gravity: auxin collects on the lower side of the shoot, which elongates more, so the shoot bends upwards (negative gravitropism); the root bends down.'; }
    else if (o.stim === 'clino') why = 'Rotation spreads the effect of gravity evenly on all sides, so auxin is evenly spread and the shoot grows straight out sideways.';
    else why = o.stim === 'all' ? 'Light is even on all sides, so auxin is evenly spread and the shoot grows straight up.' : 'In darkness shoots grow straight, tall and pale (etiolated).';
    if (o.stim === 'dark' && o.treat !== 'cut') grow *= 1.5;
    return { ang: ang, grow: grow, why: why };
  }

  LABS.tropism = {
    id: 'tropism', title: 'Tropisms laboratory: phototropism, gravitropism and auxin',
    tags: ['Biology', 'Plants', 'IB DP C3.1.17 tropic responses', 'IB DP C3.1 auxin', 'IGCSE', 'A Level'],
    background: '<p>A <b>tropism</b> is a growth response of a plant towards or away from a directional stimulus. Shoots show positive <b>phototropism</b> (they grow towards light) and negative <b>gravitropism</b> (they grow upwards, against gravity); roots show positive gravitropism.</p>' +
      '<p>The response is controlled by the plant hormone <b>auxin</b> (indole-3-acetic acid, IAA), made in the shoot tip. In a shoot lit from one side, <b>phototropins</b> in the tip detect the light and auxin efflux carriers (PIN proteins) move auxin to the <b>shaded side</b>. Auxin travels down that side and makes the cells <b>elongate</b> more (it causes proton pumping, so the cell walls loosen). The shaded side grows faster, so the shoot <b>bends towards the light</b>.</p>' +
      '<p>Classic experiments by Darwin, Boysen-Jensen and Went used oat <b>coleoptiles</b>: removing or covering the tip stops bending; mica (which auxin cannot pass) stops it moving sideways; an agar block soaked in auxin and put on one side causes bending in the dark. A <b>clinostat</b> rotates seedlings so a stimulus acts evenly on all sides (a control).</p>',
    objectives: ['Record tropic responses of seedlings with annotated drawings.', 'Measure the angle of curvature and calculate a mean and standard deviation.', 'Explain phototropism and gravitropism using auxin.', 'Interpret classic experiments that removed or covered the tip, used mica or agar blocks, or a clinostat.'],
    rq: 'How does light from one side affect the angle of curvature of oat coleoptiles over 24 hours, and which part of the shoot detects the light?',
    hypPrompt: 'Predict what happens to seedlings lit from one side, and to seedlings whose tip is covered with foil. Explain using auxin.',
    hypothesis: { marks: 3, points: [
      { re: [/toward|bend.*light|grow.*light/], marks: 1, ok: 'Shoots bend towards the light.', miss: 'Predict the direction of bending.' },
      { re: [/(foil|cover|tip).*(straight|not bend|no bend|no curv)|straight.*(foil|cover)/], marks: 1, ok: 'Covered tips grow straight.', miss: 'Predict what the foil cap does.' },
      { re: [/auxin|iaa|hormone/], marks: 1, ok: 'You explain with auxin.', miss: 'Explain using auxin.' }] },
    variables: { iv: 'direction of the stimulus (light from one side, all sides, none; gravity) and treatment of the tip', dv: 'angle of curvature of the shoot (°) after a set time, mean of 10 seedlings', cv: ['species and age of seedlings', 'light intensity and distance', 'temperature', 'water and compost', 'time (h)'] },
    apparatus: ['Oat or cress seedlings, 10 per group, in pots', 'Box with a slit (light from one side), lamp', 'Foil caps, razor blade, mica sheets, agar blocks with auxin', 'Clinostat', 'Protractor or photo with image-analysis software (angle tool)'],
    safety: ['Take care with razor blades: cut on a tile, away from fingers.', 'Keep water away from the lamp.'],
    method: ['Choose <b>Light from one side</b> and <b>No treatment</b>; set 0 h.', 'Press <b>▶ Grow</b>: time passes to the chosen hour; watch auxin (orange dots) move and the shoots bend.', 'Read the mean angle of 10 seedlings and press <b>➕ Record trial</b>. Record at 2, 4, 6, 12 and 24 h.', 'Repeat with the other treatments and stimuli, and draw annotated diagrams of what you see.'],
    controls: [
      { id: 'stim', label: 'Stimulus', type: 'select', value: 'side', options: STIM },
      { id: 'treat', label: 'Treatment of the shoot tip', type: 'select', value: 'none', options: TREAT },
      { id: 't', label: 'Time', min: 0, max: 24, step: 2, value: 12, unit: 'h' }
    ],
    columns: [
      { key: 'stim', label: 'Stimulus', num: false, group: true }, { key: 'treat', label: 'Treatment', num: false, group: true }, { key: 't', label: 'Time', unit: 'h', dp: 0 },
      { key: 'ang', label: 'Mean angle of curvature', unit: '°', dp: 1 }, { key: 'sd', label: 'Standard deviation', unit: '°', dp: 1 }, { key: 'grow', label: 'Growth in length', unit: 'mm', dp: 0 }
    ],
    graph: { x: 't', y: 'ang', group: 'treat' },
    hints: ['Measure the angle between the original vertical and the tip of the shoot.', 'Where is auxin made, and which way does it move in light from one side?', 'Mica blocks auxin; agar lets it diffuse.', 'What does the clinostat control for?'],
    analyse: [
      { id: 'a12', q: 'State the mean angle of curvature after 12 h with light from one side and no treatment.', marks: 1, lines: 1, number: { value: function () { return model({ stim: 'side', treat: 'none', t: 12 }).ang; }, tol: 0.1, unit: '°', dp: 1 } },
      { id: 'tip', q: 'Compare the results for tip removed, foil cap on the tip and foil around the base. What do they show?', marks: 3, lines: 4, points: [
        { re: [/(removed|cut|foil cap|covered).*(no|not|straight|0)/], marks: 1, ok: 'No bending without an uncovered tip.', miss: 'Describe the results with the tip removed or covered.' },
        { re: [/base.*(bend|curv|toward)/], marks: 1, ok: 'Covering the base still allows bending.', miss: 'Describe the foil-around-the-base result.' },
        { re: [/tip (detects|senses|is sensitive|perceives)|light is detected (by|in) the tip|receptor.*tip|photo.*tip/], marks: 1, ok: 'The tip detects light.', miss: 'Conclude: the tip detects the light.' }] },
      { id: 'aux', q: 'Explain how auxin causes a shoot lit from one side to bend towards the light.', marks: 3, lines: 5, points: [
        { re: [/shad|dark side|away from the light/], marks: 1, ok: 'Auxin moves to the shaded side.', miss: 'Say where auxin moves to.' },
        { re: [/elongat|longer|cell.*(expand|stretch|grow)/], marks: 1, ok: 'Cells there elongate.', miss: 'Say what auxin does to the cells.' },
        { re: [/faster|more growth|grow more|unequal|uneven/], marks: 1, ok: 'Uneven growth bends the shoot.', miss: 'Explain the bending: the shaded side grows faster.' }] }
    ],
    evaluate: [
      { id: 'sd', q: 'What does the standard deviation show about your results, and why measure 10 seedlings?', marks: 2, lines: 3, points: [
        { re: [/spread|variation|vary|dispers|consisten|reliab/], marks: 1, ok: 'SD shows the spread around the mean.', miss: 'SD shows how spread out the angles are around the mean.' },
        { re: [/variation|differ|individual|outlier|reliab|representative|anomal/], marks: 1, ok: 'Seedlings vary, so a mean of many is more reliable.', miss: 'Seedlings vary naturally; a mean of 10 is more reliable.' }] },
      { id: 'clino', q: 'Explain the purpose of the clinostat.', marks: 1, lines: 2, points: [
        { re: [/even|all sides|equal|cancel|control|no (one )?direction|remov.*(effect|stimulus)/], marks: 1, ok: 'It spreads the stimulus evenly: a control.', miss: 'It rotates the plant so gravity (or light) acts evenly on all sides: a control.' }] }
    ],
    model: '<ul><li>Mean angle = A × (1 − e<sup>−t/6 h</sup>), with A = 38° (light from one side, tip uncovered), 80° (laid on its side), 28° (auxin agar block, bending away from the block), 0° with the tip removed or covered, mica through the tip, light from all sides, darkness or a clinostat.</li>' +
      '<li>Each of the 10 seedlings varies by a standard deviation of about 12 % of the mean (+1.5°). Growth ≈ 1.1 mm/h (×1.5 in darkness, much less without the tip).</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, sim = null, raf = null, playing = false, t0 = 0, W = 680, H = 330, seeds = [];
    api.stage.innerHTML = '<canvas id="tr-cv" width="680" height="330" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Seedlings bending as auxin moves"></canvas><p class="small" id="tr-cap" style="margin:6px 0;font-weight:700" aria-live="polite"></p><canvas class="vl-chart" id="tr-ch" style="height:200px"></canvas><div id="tr-lg"></div>';
    var cv = api.stage.querySelector('#tr-cv'), c = cv.getContext('2d'), ch = api.stage.querySelector('#tr-ch'), cap = api.stage.querySelector('#tr-cap');
    function compute() { var v = api.vals(); sim = model(v); sim.v = v; }
    function newSeeds() { seeds = []; for (var i = 0; i < 10; i++) seeds.push(1 + (Math.random() + Math.random() + Math.random() - 1.5) * 0.24); }
    function shoot(x, y, len, ang, horizontal, treat, auxSide, rootDown) {   // draw a coleoptile from base (x,y); ang in degrees (+ = left)
      var base = horizontal ? -Math.PI : -Math.PI / 2, n = 14, px = x, py = y, a = base, step = len / n, pts = [[x, y]];
      for (var i = 0; i < n; i++) { a = base + (horizontal ? 1 : -1) * (ang * Math.PI / 180) * (i / n) * (horizontal ? 1 : 1); px += Math.cos(a) * step; py += Math.sin(a) * step; pts.push([px, py]); }
      c.strokeStyle = '#65a30d'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); pts.forEach(function (p, i) { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.stroke();
      var tip = pts[pts.length - 1];
      if (treat === 'cut') { c.fillStyle = '#a16207'; c.fillRect(tip[0] - 5, tip[1] - 2, 10, 4); }
      else if (treat === 'foil') { c.fillStyle = '#9ca3af'; c.beginPath(); c.arc(tip[0], tip[1], 7, 0, 7); c.fill(); }
      else { c.fillStyle = '#84cc16'; c.beginPath(); c.arc(tip[0], tip[1], 5, 0, 7); c.fill(); }
      if (treat === 'base') { c.strokeStyle = '#9ca3af'; c.lineWidth = 12; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[4][0], pts[4][1]); c.stroke(); }
      if (treat === 'mica') { c.strokeStyle = '#1e293b'; c.lineWidth = 2; c.beginPath(); c.moveTo(tip[0], tip[1] - 6); c.lineTo(pts[n - 3][0], pts[n - 3][1] + 4); c.stroke(); }
      if (treat === 'agar') { c.fillStyle = '#fde68a'; c.strokeStyle = '#b45309'; c.lineWidth = 1; c.fillRect(tip[0], tip[1] - 6, 9, 8); c.strokeRect(tip[0], tip[1] - 6, 9, 8); }
      // auxin dots on one side of the stem
      if (auxSide) for (var j = 2; j < n; j += 2) { var p = pts[j], q = pts[j - 1], nx = -(p[1] - q[1]), ny = p[0] - q[0], L = Math.sqrt(nx * nx + ny * ny) || 1; c.fillStyle = '#f97316'; c.beginPath(); c.arc(p[0] + auxSide * nx / L * 3, p[1] + auxSide * ny / L * 3, 2.2, 0, 7); c.fill(); }
      if (rootDown) { c.strokeStyle = '#d6d3d1'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 14, y + 4, x + 18, y + 4 + rootDown); c.stroke(); }
    }
    function draw(tt) {
      var v = sim.v, m = model({ stim: v.stim, treat: v.treat, t: tt }), hz = v.stim === 'grav' || v.stim === 'clino', now = performance.now() / 1000;
      c.clearRect(0, 0, W, H);
      if (v.stim === 'dark') { c.fillStyle = '#1e293b'; c.fillRect(0, 0, W, H); }
      if (v.stim === 'side') { var g = c.createLinearGradient(0, 0, 300, 0); g.addColorStop(0, 'rgba(253,224,71,.7)'); g.addColorStop(1, 'rgba(253,224,71,0)'); c.fillStyle = g; c.fillRect(0, 0, 400, H); c.fillStyle = '#facc15'; c.beginPath(); c.arc(18, 120, 14, 0, 7); c.fill(); }
      if (v.stim === 'all') { c.fillStyle = 'rgba(253,224,71,.25)'; c.fillRect(0, 0, W, H); }
      c.fillStyle = '#78350f'; c.fillRect(40, 270, 600, 40);
      var aux = 0; if (v.treat === 'agar') aux = 1; else if (m.ang > 1 && v.stim === 'side') aux = 1; else if (m.ang > 1 && v.stim === 'grav') aux = 1; else if (v.treat !== 'cut') aux = 0;
      for (var i = 0; i < 10; i++) {
        var x = hz ? 120 + (i % 5) * 110 : 80 + i * 56, y = hz ? 120 + Math.floor(i / 5) * 110 : 270, len = 60 + m.grow * 2.2;
        if (v.stim === 'clino') { c.save(); c.translate(x, y); c.rotate(now * (playing ? 1.5 : 0)); c.translate(-x, -y); }
        shoot(x, y, Math.min(120, len), m.ang * seeds[i], hz, v.treat, aux ? (hz ? -1 : 1) : 0, v.stim === 'grav' ? 10 + 30 * (1 - Math.exp(-tt / 6)) : 0);
        if (v.stim === 'clino') c.restore();
      }
      c.fillStyle = v.stim === 'dark' ? '#f8fafc' : '#0f172a'; c.font = 'bold 15px system-ui'; c.textAlign = 'left'; c.fillText('Time ' + fx(tt, 1) + ' h · mean angle ' + fx(m.ang, 1) + '°', 16, 26);
      c.font = '12px system-ui'; c.fillText('Orange dots: auxin moving down the side that grows faster', 16, 46);
      cap.textContent = m.why;
    }
    function stats(ang) { var a = seeds.map(function (s) { return ang * s + (Math.random() - 0.5) * 3; }), mean = a.reduce(function (x, y) { return x + y; }, 0) / a.length, sd = Math.sqrt(a.reduce(function (x, y) { return x + (y - mean) * (y - mean); }, 0) / (a.length - 1)); return [mean, sd]; }
    function drawChart() {
      var v = sim.v, series = [];
      [['none', '#009E73'], ['foil', '#D55E00'], ['agar', '#0072B2']].forEach(function (s) { var pts = []; for (var t = 0; t <= 24.001; t += 0.5) pts.push([t, model({ stim: v.stim, treat: s[0], t: t }).ang]); series.push({ name: TREAT.filter(function (x) { return x[0] === s[0]; })[0][1], pts: pts, color: s[1], dash: s[0] !== v.treat }); });
      series.push({ name: 'Now', pts: [[v.t, sim.ang]], color: '#000', dots: true });
      api.chart(ch, { xLabel: 'Time / h', yLabel: 'Mean angle of curvature / °', xmin: 0, xmax: 24, ymin: 0, ymax: 90, series: series });
      api.stage.querySelector('#tr-lg').innerHTML = api.legend(series.slice(0, 3)) + '<p class="small muted" style="margin:4px 0 0">Model curves for the stimulus you chose.</p>';
    }
    function readings() { var s = stats(sim.ang); api.readings([['Mean angle (10 seedlings)', fx(s[0], 1) + '°'], ['Standard deviation', fx(s[1], 1) + '°'], ['Growth in length', fx(sim.grow, 0) + ' mm'], ['Time', sim.v.t + ' h']]); }
    function frame() { var el = Math.min(1, (performance.now() - t0) / 6000), tt = el * sim.v.t; draw(tt); if (el >= 1) { playing = false; api.label('run', '▶ Grow'); readings(); api.status('Measure the angle, then ➕ Record trial.'); return; } if (playing) raf = requestAnimationFrame(frame); }
    api.actions([
      { id: 'run', label: '▶ Grow', main: true, fn: function () { if (playing) { playing = false; cancelAnimationFrame(raf); api.label('run', '▶ Grow'); return; } compute(); newSeeds(); playing = true; t0 = performance.now(); api.label('run', '⏸ Pause'); frame(); } },
      { id: 'rec', label: '➕ Record trial', fn: function () { var v = sim.v, s = stats(sim.ang); api.record({ stim: STIM.filter(function (x) { return x[0] === v.stim; })[0][1], treat: TREAT.filter(function (x) { return x[0] === v.treat; })[0][1], t: v.t, ang: +Math.max(0, s[0]).toFixed(1), sd: +s[1].toFixed(1), grow: Math.round(sim.grow) }); } }
    ]);
    api.onChange = function () { compute(); readings(); drawChart(); if (!playing) draw(api.vals().t); };
    newSeeds(); compute(); readings(); drawChart(); draw(0);
    api.status('Press ▶ Grow.');
    window.BV_TR = { model: model };
  }
})();
