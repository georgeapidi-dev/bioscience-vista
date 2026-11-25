/* Nerve impulse laboratory · VistaEd · by George Apidi
   Membrane potential from the Hodgkin–Huxley equations (shifted so the resting potential is about −70 mV), and conduction speed along an axon
   from its diameter, myelin and temperature. Watch the Na⁺ and K⁺ channels open, measure the impulse at two electrodes and work out the speed. */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var DRUGS = [['none', 'No drug'], ['lido', 'Local anaesthetic (lidocaine): blocks some Na⁺ channels'], ['ttx', 'Tetrodotoxin (puffer-fish toxin): blocks all Na⁺ channels']];
  var MYEL = [['yes', 'Myelinated'], ['no', 'Unmyelinated']];
  var DIST = 0.1;   // metres between the two recording electrodes

  /* ---------- the model ---------- */
  function hh(o) {   // o: {I, delay2, temp, drug}; returns samples every 0.05 ms of display time
    var phi = Math.pow(3, (o.temp - 37) / 10), gNa = o.drug === 'ttx' ? 0 : o.drug === 'lido' ? 120 * 0.6 : 120, gK = 36, gL = 0.3, ENa = 50, EK = -77, EL = -54.387;
    var V = -65, n = 0.3177, m = 0.0529, h = 0.5961, dt = 0.01, Tend = Math.min(400, Math.max(o.tmin || 0, 22 / Math.max(phi, 0.2), o.delay2 > 0 ? 2 + o.delay2 + 12 / Math.max(phi, 0.2) : 0)), out = [], k = 0;
    var p1 = 1, p2 = o.delay2 > 0 ? 1 + o.delay2 : -1, pw = 1 / Math.max(phi, 0.2) * 0.6 + 0.4;   // pulse length grows a little when kinetics are slow
    function ex(x) { return Math.abs(x) < 1e-6 ? 1 : x / (1 - Math.exp(-x)); }
    for (var t = 0; t <= Tend; t += dt) {
      var I = (t >= p1 && t < p1 + pw) || (p2 > 0 && t >= p2 && t < p2 + pw) ? o.I : 0;
      var an = 0.1 * ex((V + 55) / 10), bn = 0.125 * Math.exp(-(V + 65) / 80), am = ex((V + 40) / 10), bm = 4 * Math.exp(-(V + 65) / 18), ah = 0.07 * Math.exp(-(V + 65) / 20), bh = 1 / (1 + Math.exp(-(V + 35) / 10));
      n += dt * phi * (an * (1 - n) - bn * n); m += dt * phi * (am * (1 - m) - bm * m); h += dt * phi * (ah * (1 - h) - bh * h);
      var iNa = gNa * m * m * m * h * (V - ENa), iK = gK * n * n * n * n * (V - EK), iL = gL * (V - EL);
      V += dt * (I - iNa - iK - iL);
      if (k++ % 5 === 0) out.push({ t: +t.toFixed(2), V: V - 5, na: m * m * m * h / 0.38 * (gNa ? 1 : 0), k: Math.pow(n, 4) / 0.45, stim: I > 0 });
    }
    var peak = -999, tPeak = 0, low = 999, rest = out[0].V, fired = 0, above = false, t55 = null, tBack = null, first = null;
    out.forEach(function (p) { if (p.V > peak) { peak = p.V; tPeak = p.t; } if (p.t > tPeak && p.V < low && peak > 0) low = p.V;
      if (p.V > 0 && !above) { above = true; fired++; if (first == null) first = p.t; } if (p.V < -20) above = false;
      if (t55 == null && p.V > -55 && peak > 0) t55 = p.t; });
    if (peak <= 0) low = Math.min.apply(null, out.map(function (p) { return p.V; }));
    out.forEach(function (p) { if (t55 != null && tBack == null && p.t > tPeak && p.V < -55) tBack = p.t; });
    return { s: out, phi: phi, peak: peak, low: low, rest: rest, fired: fired, first: first, dur: t55 != null && tBack != null ? tBack - t55 : null, Tend: Tend };
  }
  function speed(d, myel, temp, drug) {   // m/s
    if (drug === 'ttx') return 0;
    var v = myel === 'yes' ? 6 * d : 1.0 * Math.sqrt(d);   // myelinated: about 6 m/s per µm of diameter; unmyelinated: grows with √diameter
    v *= Math.sqrt(Math.pow(3, (temp - 37) / 10));         // warmer → faster channel kinetics
    if (drug === 'lido') v *= 0.55;
    return v;
  }

  LABS.neural = {
    id: 'neural', title: 'Nerve impulse laboratory',
    tags: ['Biology', 'Human physiology', 'MYP 4–5', 'IB DP C2.2 Neural signalling', 'IGCSE', 'A Level'],
    background: '<p>Neurones carry messages as <b>nerve impulses</b> (action potentials): fast changes in the voltage across the axon membrane.</p>' +
      '<p><b>Resting potential (about −70 mV).</b> The <b>sodium–potassium pump</b> uses ATP to move 3 Na⁺ out for every 2 K⁺ in. The membrane is more permeable to K⁺, which leaks out, so the inside is negative.</p>' +
      '<p><b>Action potential.</b> A stimulus makes the membrane less negative. If it reaches the <b>threshold (about −55 mV)</b>, voltage-gated <b>Na⁺ channels</b> open and Na⁺ rushes in: <b>depolarisation</b> to about +35 mV. Then Na⁺ channels close and voltage-gated <b>K⁺ channels</b> open; K⁺ flows out: <b>repolarisation</b>. Too much K⁺ leaves for a moment: <b>hyperpolarisation</b>. During the <b>refractory period</b> a second impulse cannot start (or needs a bigger stimulus). The impulse is <b>all or nothing</b>: a stronger stimulus does not make a bigger action potential.</p>' +
      '<p><b>Propagation.</b> Na⁺ entering one part of the axon spreads along inside and depolarises the next part, so the impulse travels in one direction. A <b>myelin sheath</b> insulates the axon: ion movement happens only at the <b>nodes of Ranvier</b>, and the impulse jumps from node to node (<b>saltatory conduction</b>), which is much faster. Wider axons also conduct faster.</p>',
    objectives: ['Describe the resting potential and the phases of an action potential in terms of Na⁺ and K⁺ movement.', 'Show the threshold, the all-or-nothing response and the refractory period.', 'Measure conduction speed between two electrodes: speed = distance ÷ time.', 'Investigate how axon diameter and myelination affect the speed of a nerve impulse.'],
    rq: 'How do axon diameter (1 to 20 µm) and myelination affect the speed of a nerve impulse?',
    hypPrompt: 'Predict how the speed of the impulse changes as the axon gets wider, and compare myelinated and unmyelinated axons. Explain your prediction.',
    hypothesis: { marks: 3, points: [
      { re: [/(wider|larger|bigger|greater|increase).*(diameter|axon).*(faster|increase|higher|quicker)|(diameter).*(increase|larger).*(speed|faster)|(faster|speed increases).*(diameter|wider)/], marks: 1, ok: 'You predict faster impulses in wider axons.', miss: 'Predict how the speed changes as the diameter increases.' },
      { re: [/myelin.*(faster|quicker|higher|more)|(faster|quicker).*myelin|unmyelinated.*slower/], marks: 1, ok: 'You predict myelinated axons are faster.', miss: 'Compare the speed in myelinated and unmyelinated axons.' },
      { re: [/node|ranvier|jump|saltatory|insulat|less resistance|resistance/], marks: 1, ok: 'You give a reason (nodes, saltatory conduction or resistance).', miss: 'Explain why: myelin insulates so the impulse jumps between nodes of Ranvier; wider axons have less resistance to the flow of ions inside.' }] },
    variables: { iv: 'axon diameter (µm) and myelination', dv: 'time for the impulse to travel 10 cm (ms) → conduction speed (m/s)', cv: ['temperature (37 °C)', 'distance between the electrodes (10 cm)', 'stimulus strength (above threshold)', 'no drug'] },
    apparatus: ['Model axon with a stimulating electrode and two recording electrodes 10 cm apart', 'Oscilloscope: membrane potential (mV) against time (ms) at both electrodes', 'Stimulator with adjustable current and a second, delayed pulse', 'In a real lab: frog sciatic nerve or earthworm giant fibres, a nerve chamber and a data logger'],
    safety: ['Virtual lab. Real nerve preparations use animal tissue: follow your school\'s ethics and hygiene rules. Never use toxins such as tetrodotoxin outside a licensed laboratory.'],
    method: ['Keep the stimulus at 10 µA/cm², no second pulse, temperature 37 °C and no drug.', 'Choose <b>Myelinated</b> and a diameter of 2 µm. Press <b>▶ Stimulate</b> and watch the impulse travel from electrode A to electrode B.', 'Read the <b>delay</b> between the two recordings and press <b>➕ Record trial</b>.', 'Repeat for diameters 2, 5, 10, 15 and 20 µm, then do the same for <b>Unmyelinated</b> axons.', 'Extra: lower the stimulus until no impulse fires (threshold), add a second pulse 2–30 ms later (refractory period), change the temperature or add a drug.'],
    controls: [
      { id: 'd', label: 'Axon diameter', min: 1, max: 20, step: 1, value: 10, unit: 'µm' },
      { id: 'my', label: 'Myelin sheath', type: 'select', value: 'yes', options: MYEL },
      { id: 'I', label: 'Stimulus strength', min: 0, max: 20, step: 0.5, value: 10, unit: 'µA/cm²', dp: 1 },
      { id: 'd2', label: 'Second stimulus after (0 = off)', min: 0, max: 30, step: 0.5, value: 0, unit: 'ms', dp: 1 },
      { id: 'temp', label: 'Temperature', min: 20, max: 42, step: 1, value: 37, unit: '°C' },
      { id: 'drug', label: 'Drug or toxin', type: 'select', value: 'none', options: DRUGS }
    ],
    columns: [
      { key: 'my', label: 'Myelin', num: false, group: true }, { key: 'd', label: 'Diameter', unit: 'µm', dp: 0 }, { key: 'temp', label: 'Temperature', unit: '°C', dp: 0 },
      { key: 'drug', label: 'Drug', num: false, group: true }, { key: 'I', label: 'Stimulus', unit: 'µA/cm²', dp: 1 }, { key: 'fired', label: 'Impulses fired', dp: 0 },
      { key: 'peak', label: 'Peak potential', unit: 'mV', dp: 0 }, { key: 'delay', label: 'Delay A → B', unit: 'ms', dp: 2 }, { key: 'v', label: 'Conduction speed', unit: 'm/s', dp: 1 }
    ],
    graph: { x: 'd', y: 'v', group: 'my' },
    hints: ['Speed = distance ÷ time. The electrodes are 0.10 m apart; change the delay from ms to s (÷ 1000) first.', 'The threshold is the smallest stimulus that makes the potential shoot up past 0 mV.', 'Look at the Na⁺ and K⁺ channel bars under the axon: which opens first?', 'Myelin stops ions crossing the membrane except at the nodes of Ranvier.'],
    analyse: [
      { id: 'calc', q: 'Use one of your trials: calculate the conduction speed from the delay. Show your working (distance 0.10 m).', marks: 2, lines: 2,
        check: function (ans, c) {
          var t = c.trials.filter(function (r) { return r.delay > 0; }); if (!t.length) return { score: 0, fb: 'Record a trial where the impulse reaches electrode B first.' };
          var nums = (String(ans).match(/\d+(\.\d+)?/g) || []).map(Number), ok = t.some(function (r) { return nums.some(function (v) { return Math.abs(v - r.v) <= 0.06 * r.v + 0.05; }); });
          return ok ? { score: 2, fb: '✓ Correct: speed = 0.10 m ÷ (delay in s).' } : { score: nums.length >= 2 ? 1 : 0, fb: '➜ Change the delay to seconds (÷ 1000), then speed = 0.10 ÷ time.' };
        } },
      { id: 'myel', q: 'Compare the speed in myelinated and unmyelinated axons of the same diameter. Use figures from your table, and explain the difference.', marks: 3, lines: 4, points: [
        { re: [/\d/], marks: 1, ok: 'You quote figures.', miss: 'Quote the two speeds at the same diameter.' },
        { re: [/node|ranvier/], marks: 1, ok: 'You use nodes of Ranvier.', miss: 'Mention the nodes of Ranvier (gaps in the myelin).' },
        { re: [/jump|saltatory|skip|insulat/], marks: 1, ok: 'You explain saltatory conduction.', miss: 'Explain that myelin insulates, so the impulse jumps from node to node (saltatory conduction).' }] },
      { id: 'thr', q: 'Find the threshold stimulus at 37 °C (the smallest stimulus that fires an impulse), to the nearest 0.5 µA/cm². What happens to the size of the action potential if you double the stimulus?', marks: 2, lines: 2, points: [
        { re: [/\b(5|5\.5|6|6\.5|7|7\.5)\b/], marks: 1, ok: 'A threshold in the right range.', miss: 'Lower the stimulus in 0.5 steps until no impulse fires.' },
        { re: [/same|does not change|doesn't change|no change|all.or.(nothing|none)|not bigger|unchanged/], marks: 1, ok: 'All or nothing.', miss: 'Compare the peak potentials: the action potential is all or nothing.' }] },
      { id: 'phase', q: 'Describe what happens to Na⁺ and K⁺ channels during depolarisation, repolarisation and hyperpolarisation.', marks: 3, lines: 4, points: [
        { re: [/(na|sodium).*(open|enter|in\b|into|flow in|diffuse in)/], marks: 1, ok: 'Depolarisation: Na⁺ channels open, Na⁺ enters.', miss: 'Depolarisation: voltage-gated Na⁺ channels open and Na⁺ diffuses in.' },
        { re: [/(k|potassium).*(open|leave|out|exit|flow out|diffuse out)/], marks: 1, ok: 'Repolarisation: K⁺ channels open, K⁺ leaves.', miss: 'Repolarisation: Na⁺ channels close, K⁺ channels open and K⁺ diffuses out.' },
        { re: [/hyperpolari[sz].*(k|potassium|too many|too much|more negative|slow|stay open|still open)|(k|potassium).*(slow|still open|stay open|too many|too much)|below.*-?70|more negative than/], marks: 1, ok: 'Hyperpolarisation: K⁺ channels close slowly.', miss: 'Hyperpolarisation: K⁺ channels stay open a little too long, so the inside becomes more negative than the resting potential.' }] },
      { id: 'ref', q: 'Set a second stimulus 2 ms and then 25 ms after the first. Explain what you see, using the term refractory period.', marks: 2, lines: 3, points: [
        { re: [/refractory/], marks: 1, ok: 'You use the refractory period.', miss: 'Use the term refractory period.' },
        { re: [/(no|not|doesn't|does not|fail).*(second|another|fire|impulse)|inactiv|cannot (fire|open)|(second|another).*(fires|works|appears).*(25|later|longer)/], marks: 1, ok: 'You describe the second impulse failing early and firing later.', miss: 'Say that at 2 ms no second impulse fires (Na⁺ channels inactivated), but at 25 ms it does.' }] }
    ],
    evaluate: [
      { id: 'drug', q: 'Choose tetrodotoxin and then the local anaesthetic. Explain how each one affects the nerve impulse and why this stops pain signals.', marks: 2, lines: 3, points: [
        { re: [/(block|stop).*(na|sodium)|(na|sodium).*(block|cannot|can't|no longer)/], marks: 1, ok: 'They block Na⁺ channels.', miss: 'Explain that both block Na⁺ channels, so Na⁺ cannot enter.' },
        { re: [/no (action potential|impulse|depolari)|cannot depolari|not reach|no signal|slower|smaller|pain/], marks: 1, ok: 'No (or weaker) impulse, so no pain signal reaches the brain.', miss: 'Without depolarisation no impulse travels to the brain, so no pain is felt.' }] },
      { id: 'model', q: 'State one way this model is simpler than a real nerve.', marks: 1, lines: 2, points: [
        { re: [/one (neurone|axon)|single|bundle|many|synapse|temperature|squid|hodgkin|equation|real nerve|myelin.*(constant|fixed|same)|formula|not (measured|real)/], marks: 1, ok: 'A valid simplification.', miss: 'For example: one axon instead of a nerve of many; no synapses; speed from a formula, not measured from ion flow along the axon.' }] }
    ],
    model: '<ul><li><b>Membrane potential</b>: the Hodgkin–Huxley equations (gNa 120, gK 36, leak 0.3 mS/cm²; E<sub>Na</sub> +50, E<sub>K</sub> −77 mV), shifted by −5 mV so rest is about −70 mV. Rates are scaled by 3<sup>(T−37)/10</sup>, so 37 °C gives a mammal-like action potential lasting about 2 ms.</li>' +
      '<li><b>Conduction speed</b>: myelinated axons about 6 m/s per µm of diameter; unmyelinated about 1 m/s × √(diameter in µm). Both × √(3<sup>(T−37)/10</sup>). These are typical values, not measurements of one nerve.</li>' +
      '<li>Lidocaine is modelled as blocking 40 % of Na⁺ channels (and slowing conduction); tetrodotoxin blocks all Na⁺ channels.</li><li>The channel bars show the open fraction of Na⁺ channels (m³h) and K⁺ channels (n⁴), scaled to their largest normal value.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, sim = null, raf = null, playing = false, t0 = 0, tCur = 0, DUR = 5000;
    api.stage.innerHTML = '<svg id="nv-sv" viewBox="0 0 640 230" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Axon with two recording electrodes and the ion channels"></svg>' +
      '<canvas class="vl-chart" id="nv-ch" style="height:240px"></canvas><div id="nv-lg"></div>';
    var sv = api.stage.querySelector('#nv-sv'), ch = api.stage.querySelector('#nv-ch');
    function compute() {
      var v = api.vals(), sp = speed(v.d, v.my, v.temp, v.drug), dl = sp ? DIST / sp * 1000 : 0;
      sim = hh({ I: v.I, delay2: v.d2, temp: v.temp, drug: v.drug, tmin: dl + 14 }); sim.v = v;
      sim.speed = sim.fired ? sp : 0; sim.delay = sim.speed ? dl : null;
      sim.win = Math.min(sim.Tend, Math.max(12, (sim.delay || 0) + 10 / Math.max(sim.phi, 0.25) + (v.d2 || 0)));
    }
    function at(t) { var s = sim.s, i = Math.max(0, Math.min(s.length - 1, Math.round(t / 0.05))); return s[i]; }
    function drawAxon(t) {
      var v = sim.v, p = at(t), h = '', x0 = 60, x1 = 600, y = 92, my = v.my === 'yes', th = 10 + v.d * 1.3;
      h += '<text x="320" y="20" text-anchor="middle" font-size="13" font-weight="700" fill="#334155">' + (my ? 'Myelinated' : 'Unmyelinated') + ' axon · diameter ' + v.d + ' µm · ' + v.temp + ' °C</text>';
      h += '<rect x="' + x0 + '" y="' + (y - th / 2) + '" width="' + (x1 - x0) + '" height="' + th + '" rx="' + th / 2 + '" fill="#fde68a" stroke="#b45309" stroke-width="2"/>';
      if (my) for (var k = 0; k < 9; k++) { var xa = x0 + 6 + k * 60; h += '<rect x="' + xa + '" y="' + (y - th / 2 - 8) + '" width="50" height="' + (th + 16) + '" rx="10" fill="#e0e7ff" stroke="#6366f1" stroke-width="1.5" opacity=".95"/>'; }
      // the impulse: where it is along the axon
      var travelled = sim.delay != null && sim.first != null ? (t - sim.first) / sim.delay : -1;
      if (travelled >= 0 && travelled <= 1.15) {
        var fr = Math.min(1, travelled), xi = x0 + 20 + fr * (x1 - x0 - 40);
        if (my) { var node = Math.round((xi - x0 - 3) / 60); xi = x0 + 3 + node * 60; }
        h += '<circle cx="' + xi + '" cy="' + y + '" r="' + (th / 2 + 10) + '" fill="#ef4444" opacity=".55"><title>impulse</title></circle><text x="' + xi + '" y="' + (y + th / 2 + 30) + '" text-anchor="middle" font-size="11" fill="#b91c1c" font-weight="700">' + (my ? 'impulse jumps node to node' : 'impulse') + '</text>';
      }
      [['A', x0 + 20, 0], ['B', x1 - 20, 1]].forEach(function (e) { h += '<line x1="' + e[1] + '" y1="38" x2="' + e[1] + '" y2="' + (y - th / 2) + '" stroke="#0f172a" stroke-width="2"/><circle cx="' + e[1] + '" cy="36" r="9" fill="#0f172a"/><text x="' + e[1] + '" y="40" text-anchor="middle" font-size="11" fill="#fff" font-weight="700">' + e[0] + '</text>'; });
      h += '<text x="320" y="' + (y + th / 2 + 14) + '" text-anchor="middle" font-size="11" fill="#475569">← 10 cm between electrodes A and B →</text>';
      // channels at electrode A
      var bar = function (x, lbl, f, col, ion) { f = Math.max(0, Math.min(1, f || 0)); return '<text x="' + x + '" y="178" font-size="12" font-weight="700" fill="' + col + '">' + lbl + '</text><rect x="' + x + '" y="184" width="150" height="14" rx="7" fill="#e2e8f0"/><rect x="' + x + '" y="184" width="' + (150 * f) + '" height="14" rx="7" fill="' + col + '"/><text x="' + (x + 158) + '" y="196" font-size="11" fill="#334155">' + (f > 0.08 ? 'open: ' + ion : 'mostly closed') + '</text>'; };
      h += bar(20, 'Na⁺ channels at A', p.na, '#ea580c', 'Na⁺ flows in') + bar(330, 'K⁺ channels at A', p.k, '#2563eb', 'K⁺ flows out');
      var phase = p.stim ? 'Stimulus' : p.V > -60 && p.na > 0.15 && p.V < 30 && p.k < 0.4 ? 'Depolarisation: Na⁺ rushes in' : p.V > 0 ? 'Peak: Na⁺ channels close, K⁺ channels open' : p.V > -68 && p.k > 0.25 ? 'Repolarisation: K⁺ flows out' : p.V < -72 ? 'Hyperpolarisation (refractory period)' : 'Resting potential: Na⁺/K⁺ pump keeps −70 mV';
      h += '<rect x="20" y="206" width="600" height="22" rx="8" fill="#fff"/><text x="320" y="221" text-anchor="middle" font-size="12.5" font-weight="700">At A, ' + fx(t, 2) + ' ms: ' + fx(p.V, 0) + ' mV · ' + phase + '</text>';
      sv.innerHTML = h;
    }
    function drawChart(t) {
      var A = [], B = [], step = Math.max(1, Math.round(sim.s.length / 500));
      for (var i = 0; i < sim.s.length; i += step) { var p = sim.s[i]; if (p.t > sim.win) break; A.push([p.t, p.V]); if (sim.delay != null) { var tb = p.t + sim.delay; if (tb <= sim.win) B.push([tb, p.V]); } }
      if (sim.delay != null && B.length) { B.unshift([0, sim.rest], [B[0][0], sim.rest]); }
      var series = [{ name: 'Electrode A', pts: A, color: '#D55E00' }, { name: 'Electrode B (10 cm along)', pts: sim.delay != null ? B : [[0, sim.rest], [sim.win, sim.rest]], color: '#0072B2' }, { name: 'Threshold −55 mV', pts: [[0, -55], [sim.win, -55]], color: '#94a3b8', dash: true }];
      api.chart(ch, { xLabel: 'Time / ms', yLabel: 'Membrane potential / mV', xmin: 0, xmax: +sim.win.toFixed(1), ymin: -90, ymax: 50, series: series, marks: t != null ? [{ x: t, label: '' }] : [] });
      api.stage.querySelector('#nv-lg').innerHTML = api.legend(series);
    }
    function readings() {
      api.readings([['Impulses fired', String(sim.fired)], ['Peak potential', sim.fired ? fx(sim.peak, 0) + ' mV' : 'no action potential'], ['Lowest potential', fx(sim.low, 0) + ' mV'],
        ['Delay A → B', sim.delay != null ? fx(sim.delay, 2) + ' ms' : 'no impulse at B'], ['Conduction speed', sim.speed ? fx(sim.speed, 1) + ' m/s' : '–'], ['Action potential length', sim.dur != null ? fx(sim.dur, 2) + ' ms' : '–']]);
    }
    function frame() {
      tCur = Math.min(sim.win, (performance.now() - t0) / DUR * sim.win); drawAxon(tCur); drawChart(tCur);
      if (tCur < sim.win && playing) raf = requestAnimationFrame(frame); else { playing = false; api.label('run', '▶ Stimulate'); }
    }
    function run() { compute(); readings(); playing = true; t0 = performance.now(); cancelAnimationFrame(raf); api.label('run', '⏸ Running…'); api.enable('rec', true); frame();
      api.status(sim.fired ? 'Impulse fired. Watch it travel from A to B, then record the trial.' : 'No action potential: the stimulus did not reach the threshold' + (sim.v.drug === 'ttx' ? ' (Na⁺ channels are blocked).' : '.')); }
    api.actions([
      { id: 'run', label: '▶ Stimulate', main: true, fn: function () { if (playing) { playing = false; cancelAnimationFrame(raf); api.label('run', '▶ Stimulate'); } else run(); } },
      { id: 'step', label: '⏭ Step 0.1 ms', fn: function () { playing = false; cancelAnimationFrame(raf); api.label('run', '▶ Stimulate'); tCur = Math.min(sim.win, tCur + 0.1); drawAxon(tCur); drawChart(tCur); } },
      { id: 'rec', label: '➕ Record trial', fn: function () {
        var v = sim.v; api.record({ my: v.my === 'yes' ? 'Myelinated' : 'Unmyelinated', d: v.d, temp: v.temp, drug: DRUGS.filter(function (x) { return x[0] === v.drug; })[0][1].split(' (')[0].split(':')[0], I: v.I, fired: sim.fired, peak: sim.fired ? sim.peak : null, delay: sim.delay, v: sim.speed || 0 });
      } }
    ]);
    api.onChange = function () { playing = false; cancelAnimationFrame(raf); api.label('run', '▶ Stimulate'); compute(); readings(); tCur = 0; drawAxon(0); drawChart(null); };
    compute(); readings(); drawAxon(0); drawChart(null);
    api.status('Press ▶ Stimulate to send an impulse along the axon.');
    window.BV_NEURAL = { hh: hh, speed: speed };   // for tests
  }
})();
