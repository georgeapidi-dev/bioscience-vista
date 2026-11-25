/* Force and acceleration laboratory: Newton's second law with a trolley and light gates · VistaEd · by George Apidi */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var g = 9.81, CARD = 0.05, S = 0.50, X1 = 0.20;   // card length (m), distance between gates (m), first gate 0.20 m from the start
  function accel(v) {   // hanging mass m (g) pulls trolley M (kg); friction 0.04 N per kg of trolley unless the runway is tilted to compensate
    var m = v.hm / 1000, M = v.tm, fr = v.comp ? 0 : 0.04 * M * g / g * 1;   // friction force in N (μ ≈ 0.004 × g)
    return Math.max(0, (m * g - fr * 1) / (M + m));
  }
  LABS.motion = {
    id: 'motion', title: 'Force and acceleration laboratory: Newton\'s second law',
    tags: ['Physics', 'Forces and motion', 'MYP 3–5', 'IGCSE', 'Edexcel', 'IB DP A.2', 'A Level'],
    background: '<p>A resultant force makes an object accelerate. <b>Newton\'s second law</b>: F = ma, so for a fixed mass the acceleration is directly proportional to the resultant force, and for a fixed force it is inversely proportional to the mass.</p>' +
      '<p>A trolley on a runway is pulled by a string over a pulley to a hanging mass m. The pulling force is about the weight of the hanging mass, W = mg (g = 9.81 N/kg). The hanging mass also has to be accelerated, so the total accelerating mass is M + m.</p>' +
      '<p>Two <b>light gates</b> time a 5.0 cm card on the trolley. Speed at each gate v = card length ÷ time blocked. Then a = (v₂² − v₁²) ÷ 2s, where s is the distance between the gates. Friction is compensated by tilting the runway until the trolley rolls at constant speed.</p>',
    objectives: ['Measure speeds with light gates and calculate acceleration.', 'Investigate how acceleration depends on the resultant force at constant mass.', 'Investigate how acceleration depends on mass at constant force.', 'Explain why friction must be compensated.'],
    rq: 'How does the acceleration of a trolley depend on the resultant force acting on it?',
    hypPrompt: 'Predict what happens to the acceleration if you double the pulling force, and if you double the mass of the trolley.',
    hypothesis: { marks: 3, points: [
      { re: [/doubl|twice|proportional/], marks: 1, ok: 'Doubling force doubles a.', miss: 'Say doubling the force doubles the acceleration.' },
      { re: [/half|halv|inversely|decrease|less/], marks: 1, ok: 'More mass, less a.', miss: 'Say doubling the mass halves the acceleration.' },
      { re: [/f ?= ?ma|newton|second law/], marks: 1, ok: 'F = ma used.', miss: 'Use Newton\'s second law, F = ma.' }] },
    variables: { iv: 'pulling force (weight of the hanging mass, N)', dv: 'acceleration of the trolley (m/s²)', cv: ['total accelerating mass (move masses from trolley to hanger)', 'distance between the light gates (0.50 m)', 'friction compensated by tilting the runway', 'the same card (5.0 cm)'] },
    apparatus: ['Dynamics trolley with 5.0 cm card', 'Runway with pulley and wooden block to tilt it', 'Two light gates and data logger', 'String and mass hanger with 10 g masses', '0.25 kg masses for the trolley', 'Metre rule, balance'],
    safety: ['Place a box of padding where the masses land.', 'Stop the trolley before it reaches the pulley end; use a buffer.', 'Keep fingers clear of the pulley.'],
    method: ['Tick <b>Compensate friction</b> (tilt the runway).', 'Choose the hanging mass and the trolley mass.', 'Press <b>Release</b>: the light gates time the card at both gates.', 'Press <b>Record</b>. Repeat each force three times.', 'Change the hanging mass from 10 g to 80 g. Then keep the force fixed and change the trolley mass.'],
    controls: [
      { id: 'hm', label: 'Hanging mass', type: 'range', min: 10, max: 80, step: 10, value: 30, unit: 'g' },
      { id: 'tm', label: 'Trolley mass', type: 'range', min: 0.5, max: 2, step: 0.25, value: 1, dp: 2, unit: 'kg' },
      { id: 'comp', label: 'Compensate friction (tilted runway)', type: 'check', value: true }
    ],
    columns: [
      { key: 'set', label: 'Trolley mass', num: false, group: true }, { key: 'F', label: 'Force', unit: 'N', dp: 3 }, { key: 'M', label: 'Trolley mass', unit: 'kg', dp: 2 },
      { key: 't1', label: 'Time at gate 1', unit: 's', dp: 4 }, { key: 't2', label: 'Time at gate 2', unit: 's', dp: 4 },
      { key: 'v1', label: 'Speed 1', unit: 'm/s', dp: 3 }, { key: 'v2', label: 'Speed 2', unit: 'm/s', dp: 3 }, { key: 'a', label: 'Acceleration', unit: 'm/s²', dp: 3 }, { key: 'inv', label: '1 ÷ total mass', unit: 'kg⁻¹', dp: 3 }
    ],
    graph: { x: 'F', y: 'a', group: 'set' },
    hints: ['Speed = 0.050 m ÷ time the card blocks the gate.', 'a = (v₂² − v₁²) ÷ (2 × 0.50 m).', 'Plot acceleration (y) against force (x). The gradient is 1 ÷ total mass.', 'Without friction compensation, the line does not pass through the origin.'],
    analyse: [
      { id: 'calc', q: 'A card blocks gate 1 for 0.125 s and gate 2 for 0.0500 s. Calculate the acceleration.', marks: 2, lines: 2, number: { value: 0.84, tol: 0.02, unit: 'm/s²', dp: 2, hint: 'v₁ = 0.40 m/s, v₂ = 1.00 m/s.' } },
      { id: 'trend', q: 'Describe the relationship between force and acceleration shown by your graph (friction compensated).', marks: 2, lines: 3, points: [
        { re: [/proportional|straight line through (the )?origin|doubl/], marks: 1, ok: 'Directly proportional.', miss: 'State: a straight line through the origin, so a ∝ F.' },
        { re: [/\d/], marks: 1, ok: 'Values quoted.', miss: 'Quote values from your results.' }] },
      { id: 'grad', q: 'The gradient of a against F equals 1 ÷ (total mass). Use your graph for the 1.00 kg trolley to find the total accelerating mass.', marks: 2, lines: 2, number: { value: 1.04, abs: 0.06, tol: 0, unit: 'kg', dp: 2, hint: 'Total mass = trolley + hanging masses used.' } },
      { id: 'mass', q: 'Describe and explain how the acceleration changed when the trolley mass increased at constant force.', marks: 2, lines: 3, points: [
        { re: [/decreas|less|smaller|lower|halv/], marks: 1, ok: 'Acceleration decreases.', miss: 'State that the acceleration decreases.' },
        { re: [/inversely|1 ?(÷|\/) ?m|f ?= ?ma|same force|more mass/], marks: 1, ok: 'Explained with F = ma.', miss: 'Explain: a = F ÷ m, so a larger mass gives a smaller acceleration (inversely proportional).' }] },
      { id: 'fric', q: 'Explain how your results change when friction is not compensated.', marks: 2, lines: 3, points: [
        { re: [/not (through|pass)|intercept|cuts the (x|force)|lower|smaller|less/], marks: 1, ok: 'Line shifts.', miss: 'The line no longer passes through the origin; accelerations are smaller.' },
        { re: [/resultant|friction (opposes|subtract|reduces)|less than the weight|minus friction/], marks: 1, ok: 'Resultant force is smaller.', miss: 'Explain: the resultant force is the weight minus friction.' }] }
    ],
    evaluate: [
      { id: 'err', q: 'Explain why the total mass should be kept constant by moving masses from the trolley to the hanger.', marks: 2, lines: 3, points: [
        { re: [/total mass|m ?\+ ?m|both (masses|move)|hanging mass (also|is) accelerat/], marks: 1, ok: 'Hanging mass is accelerated too.', miss: 'The hanging mass is also accelerated, so it is part of the total mass.' },
        { re: [/control|fair|only (the )?force changes|one variable/], marks: 1, ok: 'Keeps a fair test.', miss: 'So that only the force changes (a fair test).' }] },
      { id: 'lim', q: 'Give one simplification in this model.', marks: 1, lines: 2, points: [
        { re: [/pulley|string|air resistance|massless|frictionless|constant friction|stretch|ideal/], marks: 1, ok: 'A valid simplification.', miss: 'For example: the string and pulley are massless and frictionless, and air resistance is ignored.' }] }
    ],
    model: '<ul><li>a = (mg − F<sub>friction</sub>) ÷ (M + m), g = 9.81 N/kg. Friction = 0.04 N per kg of trolley when not compensated, zero when compensated.</li><li>Gate 1 is 0.20 m and gate 2 0.70 m from the start: v² = 2ax. Times are card length ÷ speed, with ±0.5 % timing noise.</li>' +
      '<li>The string and pulley are massless and frictionless; air resistance is ignored.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var raf = 0, run = null;
    api.stage.innerHTML = '<svg viewBox="0 0 420 180" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Trolley on a runway pulled by a hanging mass through two light gates" id="mo-sv"></svg><canvas class="vl-chart" id="mo-ch" style="height:200px;margin-top:8px"></canvas>';
    var sv = api.stage.querySelector('#mo-sv'), ch = api.stage.querySelector('#mo-ch'), PX = 330 / 0.95;   // pixels per metre along the runway
    function draw(x, v) {
      var vv = api.vals(), h = '', tilt = vv.comp ? -1.2 : 0;
      h += '<g transform="rotate(' + tilt + ' 30 100)"><rect x="20" y="100" width="350" height="8" fill="#94a3b8"/>';
      [X1, X1 + S].forEach(function (gx, k) { var px = 30 + gx * PX; h += '<rect x="' + (px - 4) + '" y="58" width="8" height="42" fill="#334155"/><rect x="' + (px - 10) + '" y="52" width="20" height="8" rx="2" fill="#0f766e"/><text x="' + px + '" y="46" font-size="9" text-anchor="middle">gate ' + (k + 1) + '</text>'; });
      var tx = 30 + x * PX; h += '<rect x="' + (tx - 34) + '" y="78" width="40" height="20" rx="3" fill="#2563eb"/><rect x="' + (tx - 16) + '" y="66" width="2.5" height="12" fill="#111"/><circle cx="' + (tx - 26) + '" cy="99" r="4" fill="#111"/><circle cx="' + (tx - 2) + '" cy="99" r="4" fill="#111"/>';
      for (var i = 0; i < Math.round((vv.tm - 0.5) / 0.25); i++) h += '<rect x="' + (tx - 30 + i * 6) + '" y="72" width="5" height="6" fill="#78716c"/>';
      h += '<line x1="' + (tx + 6) + '" y1="86" x2="372" y2="86" stroke="#334155"/></g>';
      h += '<circle cx="376" cy="96" r="8" fill="#fff" stroke="#334155" stroke-width="2"/><line x1="384" y1="96" x2="384" y2="' + (110 + x * 60) + '" stroke="#334155"/><rect x="376" y="' + (110 + x * 60) + '" width="16" height="' + (6 + vv.hm / 8) + '" fill="#78716c" stroke="#292524"/>';
      h += '<rect x="360" y="168" width="50" height="8" fill="#fde68a"/><text x="14" y="160" font-size="11" fill="#475569">' + (vv.comp ? 'runway tilted to compensate friction' : 'level runway: friction acts') + '</text>';
      h += '<text x="14" y="20" font-size="12" font-weight="700">v = ' + v.toFixed(2) + ' m/s</text>';
      sv.innerHTML = h;
    }
    function chart(pts) { api.chart(ch, { xLabel: 'Time / s', yLabel: 'Velocity / m/s', xmin: 0, ymin: 0, series: [{ name: 'velocity', pts: pts.length ? pts : [[0, 0]], color: '#0072B2' }] }); }
    function idle() { cancelAnimationFrame(raf); draw(0, 0); chart([]); api.enable('rec', false); api.readings([['Force (mg)', (api.vals().hm / 1000 * g).toFixed(3) + ' N'], ['Total mass', (api.vals().tm + api.vals().hm / 1000).toFixed(2) + ' kg']]); }
    function release() {
      cancelAnimationFrame(raf); var v = api.vals(), a = accel(v), xEnd = 0.95, pts = [];
      if (a <= 0) { api.status('The trolley does not move: the pull is smaller than friction. Add mass or compensate friction.'); return; }
      var tEnd = Math.sqrt(2 * xEnd / a), t0 = performance.now(), slow = 1.5;
      var v1 = Math.sqrt(2 * a * X1), v2 = Math.sqrt(2 * a * (X1 + S)), noise = function () { return 1 + (Math.random() - 0.5) * 0.01; };
      run = { v: v, a: a, t1: CARD / v1 * noise(), t2: CARD / v2 * noise() };
      api.enable('rel', false); api.enable('rec', false);
      (function loop() {
        var t = Math.min(tEnd, (performance.now() - t0) / 1000 / slow), x = 0.5 * a * t * t, vel = a * t; pts.push([t, vel]); draw(x, vel); chart(pts);
        if (t < tEnd) raf = requestAnimationFrame(loop);
        else { api.enable('rel', true); api.enable('rec', true); var V1 = CARD / run.t1, V2 = CARD / run.t2; api.readings([['Gate 1 time', run.t1.toFixed(4) + ' s'], ['Gate 2 time', run.t2.toFixed(4) + ' s'], ['Speed 1', V1.toFixed(3) + ' m/s'], ['Speed 2', V2.toFixed(3) + ' m/s'], ['Acceleration', ((V2 * V2 - V1 * V1) / (2 * S)).toFixed(3) + ' m/s²']]); api.status('Finished. Press Record trial.'); }
      })();
    }
    api.actions([
      { id: 'rel', label: '▶ Release', main: true, fn: release },
      { id: 'rec', label: '➕ Record trial', fn: function () {
        if (!run) return; var v = run.v, V1 = CARD / run.t1, V2 = CARD / run.t2;
        api.record({ set: v.tm.toFixed(2) + ' kg' + (v.comp ? '' : ', friction'), F: +(v.hm / 1000 * g).toFixed(4), M: v.tm, t1: +run.t1.toFixed(5), t2: +run.t2.toFixed(5), v1: +V1.toFixed(4), v2: +V2.toFixed(4), a: +((V2 * V2 - V1 * V1) / (2 * S)).toFixed(4), inv: +(1 / (v.tm + v.hm / 1000)).toFixed(4) });
        api.enable('rec', false); } }
    ]);
    api.onChange = function () { run = null; api.enable('rel', true); idle(); };
    api.onShow = function () { if (!run) idle(); };
    api.status('Set the masses, then press Release.');
    idle();
  }
})();
