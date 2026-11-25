/* Natural and sexual selection laboratory: Endler's guppies · VistaEd · by George Apidi
   IB DP D4.1.8: John Endler's experiments with guppies (Poecilia reticulata). Females prefer males with more coloured spots (sexual
   selection); predators find colourful males more easily (natural selection). Change the predator and the gravel, run 20 generations and
   track the mean number of spots per male. */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var PRED = [['none', 'No predator'], ['rivulus', 'Rivulus (weak predator, eats young guppies)'], ['crenicichla', 'Crenicichla (strong predator of adults)']];
  var GRAV = [['coarse', 'Coarse gravel (large spots blend in)'], ['fine', 'Fine gravel (small spots blend in)']];
  var PSTR = { none: 0, rivulus: 0.15, crenicichla: 1 };

  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function simulate(o) {   // o: {pred, grav, mate (0–1), gens, seed} -> mean spots and spot size per generation
    var r = rng(o.seed || 7), pop = [], i, g, out = [];
    for (i = 0; i < 200; i++) pop.push({ s: Math.max(0, Math.round(8 + (r() + r() + r() - 1.5) * 6)), z: 0.5 + (r() - 0.5) * 0.6 });
    function rec(gen) { var m = pop.reduce(function (a, b) { return a + b.s; }, 0) / pop.length, z = pop.reduce(function (a, b) { return a + b.z; }, 0) / pop.length; out.push({ gen: gen, spots: m, size: z }); }
    rec(0);
    for (g = 1; g <= o.gens; g++) {
      var P = PSTR[o.pred], match = o.grav === 'coarse' ? 1 : 0;
      var surv = pop.filter(function (f) { var vis = f.s / 14 * (0.6 + 0.4 * Math.abs(f.z - match)); return r() > P * 0.9 * Math.min(1, vis); });
      if (surv.length < 20) surv = pop.slice(0, 20);
      var w = surv.map(function (f) { return Math.pow(1 + f.s / 10, 0.9 * o.mate); }), W = w.reduce(function (a, b) { return a + b; }, 0), next = [];
      for (i = 0; i < 200; i++) { var x = r() * W, k = 0; while (x > w[k]) { x -= w[k]; k++; } var p = surv[Math.min(k, surv.length - 1)]; next.push({ s: Math.max(0, Math.round(p.s + (r() - 0.5) * 2.4)), z: Math.min(1, Math.max(0, p.z + (r() - 0.5) * 0.08)) }); }
      pop = next; rec(g);
    }
    return { pts: out, pop: pop };
  }

  LABS.guppies = {
    id: 'guppies', title: 'Natural and sexual selection laboratory: Endler\'s guppies',
    tags: ['Biology', 'Evolution', 'IB DP D4.1.8 Endler\'s guppies', 'IB DP D4.1 natural selection', 'A Level'],
    background: '<p>Male guppies in the streams of Trinidad have coloured spots. <b>Sexual selection</b>: females prefer to mate with males that have more and brighter spots, so those males leave more offspring. <b>Natural selection</b>: predators such as the pike cichlid <i>Crenicichla</i> see and eat colourful males more easily, while the small killifish <i>Rivulus</i> eats mostly young guppies and has little effect on adult colour.</p>' +
      '<p>In the 1970s <b>John Endler</b> tested this in large greenhouse ponds. He started with mixed guppy populations, then added <i>Crenicichla</i>, <i>Rivulus</i> or no predator, on coarse or fine gravel. After about 14 generations, males in ponds with no predator or only <i>Rivulus</i> had <b>more spots</b>; with <i>Crenicichla</i> they had <b>fewer spots</b>, and the spots were closer in size to the gravel (better camouflage). He then repeated it in the field by moving guppies to a stream above a waterfall without <i>Crenicichla</i>: within two years the males became more colourful.</p>' +
      '<p>The experiment shows that the balance between sexual selection and predation (selection pressures) changes allele frequencies, and that controlled experiments can test hypotheses about natural selection.</p>',
    objectives: ['Explain how sexual selection and natural selection act on male colour.', 'Model Endler\'s experiment by changing the selection pressures.', 'Interpret graphs of the mean number of spots over generations.', 'Evaluate how Endler controlled variables in the ponds and in the field.'],
    rq: 'How does the type of predator affect the mean number of spots on male guppies over 20 generations?',
    hypPrompt: 'Predict how the mean number of spots changes with no predator and with Crenicichla. Explain.',
    hypothesis: { marks: 3, points: [
      { re: [/no predator.*(more|increase)|(increase|more).*no predator/], marks: 1, ok: 'No predator: more spots.', miss: 'Predict the result with no predator.' },
      { re: [/crenicichla.*(fewer|less|decrease)|(fewer|decrease).*crenicichla|strong predator.*(fewer|less)/], marks: 1, ok: 'Crenicichla: fewer spots.', miss: 'Predict the result with Crenicichla.' },
      { re: [/female|mate|sexual/], marks: 1, ok: 'You use female choice (sexual selection).', miss: 'Explain using female choice and predation.' }] },
    variables: { iv: 'predator in the pond (none, Rivulus, Crenicichla)', dv: 'mean number of spots per male after each generation', cv: ['gravel type', 'pond size and starting population', 'female preference', 'food and temperature', 'number of generations'] },
    apparatus: ['10 large ponds with gravel and plants (greenhouse)', 'Starting population of guppies from many streams (high variation)', 'Predators: Crenicichla alata, Rivulus hartii', 'Photographs of males to count and measure spots each generation'],
    safety: ['Virtual model. Real experiments with vertebrates need ethical approval, and must keep suffering and numbers to a minimum.'],
    method: ['Choose <b>No predator</b>, coarse gravel and normal female preference.', 'Press <b>▶ Run 20 generations</b>: watch males (spots) and females in the pond, and the graph of mean spots.', 'Press <b>➕ Record</b> to put each generation in the results table.', 'Repeat with Rivulus and Crenicichla; then change the gravel and switch female preference off.'],
    controls: [
      { id: 'pred', label: 'Predator', type: 'select', value: 'none', options: PRED },
      { id: 'grav', label: 'Gravel', type: 'select', value: 'coarse', options: GRAV },
      { id: 'mate', label: 'Female preference for spots', min: 0, max: 1, step: 0.25, value: 1, dp: 2 },
      { id: 'gens', label: 'Generations', min: 5, max: 30, step: 5, value: 20 }
    ],
    columns: [
      { key: 'pred', label: 'Predator', num: false, group: true }, { key: 'grav', label: 'Gravel', num: false }, { key: 'mate', label: 'Female preference', dp: 2 }, { key: 'gen', label: 'Generation', dp: 0 }, { key: 'spots', label: 'Mean spots per male', dp: 2 }
    ],
    graph: { x: 'gen', y: 'spots', group: 'pred' },
    hints: ['Which predator sees and eats adult males?', 'With no female preference, what keeps spots high?', 'Large spots on fine gravel stand out.', 'Endler started with a mixed population: why?'],
    analyse: [
      { id: 'cmp', q: 'Compare the mean number of spots after 20 generations with no predator, Rivulus and Crenicichla. Use figures.', marks: 3, lines: 4, points: [
        { re: [/\d/], marks: 1, ok: 'You quote figures.', miss: 'Quote the mean spots.' }, { re: [/(no predator|rivulus).*(more|higher|increas)/], marks: 1, ok: 'More spots with no predator / Rivulus.', miss: 'Describe the result with no predator and Rivulus.' }, { re: [/crenicichla.*(fewer|lower|decreas|less)/], marks: 1, ok: 'Fewer spots with Crenicichla.', miss: 'Describe the result with Crenicichla.' }] },
      { id: 'expl', q: 'Explain the change in mean spots with Crenicichla in terms of selection pressures and allele frequencies.', marks: 3, lines: 5, points: [
        { re: [/eaten|predat|caught|seen|visible|conspicuous/], marks: 1, ok: 'Colourful males are eaten more.', miss: 'Explain what happens to colourful males.' }, { re: [/surviv|reproduc|offspring|pass on/], marks: 1, ok: 'Less colourful males survive to reproduce.', miss: 'Say which males survive and reproduce.' }, { re: [/allele|gene|frequen|inherit/], marks: 1, ok: 'Alleles for fewer spots increase in frequency.', miss: 'Link to allele frequencies.' }] },
      { id: 'mate', q: 'What happened when female preference was 0 with no predator? What does this show?', marks: 2, lines: 3, points: [
        { re: [/same|no change|stay|constant|not increase|drift|random/], marks: 1, ok: 'Spots did not increase.', miss: 'Describe what happened to the mean spots.' }, { re: [/female|sexual selection|mate choice|preference (causes|drives)/], marks: 1, ok: 'Female choice drives the increase.', miss: 'Conclude: female choice (sexual selection) causes the increase.' }] }
    ],
    evaluate: [
      { id: 'ctl', q: 'How did Endler control variables, and why did he also do a field experiment?', marks: 2, lines: 4, points: [
        { re: [/same|identical|control|pond|gravel|replica|random/], marks: 1, ok: 'Identical ponds, only the predator changed.', miss: 'For example: identical ponds and starting populations; only the predator differed.' }, { re: [/natural|real|field|wild|realistic|nature/], marks: 1, ok: 'To test it in natural conditions.', miss: 'The field experiment tested whether the same happens in natural conditions.' }] },
      { id: 'mod', q: 'State one way this computer model is simpler than real guppy populations.', marks: 1, lines: 2, points: [
        { re: [/colour|size|spot only|genetic|single|one trait|mutation|random|female|environment|other|food|disease/], marks: 1, ok: 'Valid.', miss: 'For example: only spot number is inherited; no other traits, disease or food differences.' }] }
    ],
    model: '<ul><li>200 guppies per generation. Each male has a number of spots (inherited from a parent ± 1) and a spot size (0 small, 1 large). Survival: a male is eaten with probability strength × 0.9 × visibility (max 1); visibility rises with spots and with spots that do not match the gravel. Strength: none 0, Rivulus 0.15, Crenicichla 1.</li>' +
      '<li>Mating success ∝ (1 + spots ÷ 10)<sup>0.9 × preference</sup>. Each run uses new random numbers, so repeats differ slightly.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, raf = null, playing = false, t0 = 0, W = 680, H = 280, res = null, seed = 5, fish = [];
    api.stage.innerHTML = '<canvas id="gu-cv" width="680" height="280" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="A pond with guppies and a predator"></canvas><p class="small" id="gu-cap" style="margin:6px 0;font-weight:700" aria-live="polite"></p><canvas class="vl-chart" id="gu-ch" style="height:220px"></canvas><div id="gu-lg"></div>';
    var cv = api.stage.querySelector('#gu-cv'), c = cv.getContext('2d'), ch = api.stage.querySelector('#gu-ch'), cap = api.stage.querySelector('#gu-cap');
    function makeFish(pop) { var r = rng(seed); fish = []; for (var i = 0; i < 22; i++) { var p = pop[Math.floor(r() * pop.length)]; fish.push({ x: r() * 600 + 30, y: 60 + r() * 170, vx: (r() - 0.5) * 60, male: i % 2 === 0, s: p.s, z: p.z }); } }
    function draw(gen, mean) {
      var v = api.vals(), now = performance.now() / 1000; c.clearRect(0, 0, W, H); c.fillStyle = 'rgba(56,189,248,.35)'; c.fillRect(10, 40, 660, 230);
      for (var i = 0; i < 140; i++) { c.fillStyle = ['#a8a29e', '#78716c', '#d6d3d1'][i % 3]; var gs = v.grav === 'coarse' ? 7 : 3; c.beginPath(); c.arc(14 + (i * 47) % 656, 262 + (i % 3) * 3, gs, 0, 7); c.fill(); }
      fish.forEach(function (f) { if (playing) { f.x += f.vx * 0.016; if (f.x < 30 || f.x > 650) f.vx *= -1; }
        c.save(); c.translate(f.x, f.y + Math.sin(now * 3 + f.x) * 3); if (f.vx < 0) c.scale(-1, 1);
        c.fillStyle = f.male ? '#cbd5e1' : '#94a3b8'; c.beginPath(); c.ellipse(0, 0, f.male ? 11 : 14, f.male ? 4 : 5.5, 0, 0, 7); c.fill();
        c.fillStyle = f.male ? '#38bdf8' : '#94a3b8'; c.beginPath(); c.moveTo(-10, 0); c.lineTo(-20, -6); c.lineTo(-20, 6); c.closePath(); c.fill();
        if (f.male) for (var k = 0; k < Math.min(16, f.s); k++) { c.fillStyle = ['#f97316', '#ef4444', '#facc15', '#111827'][k % 4]; c.beginPath(); c.arc(-7 + (k % 6) * 3, -2 + Math.floor(k / 6) * 2, 0.8 + f.z * 1.4, 0, 7); c.fill(); }
        c.restore(); });
      if (v.pred === 'crenicichla') { var px = 340 + Math.sin(now * 0.7) * 260; c.fillStyle = '#4d7c0f'; c.beginPath(); c.ellipse(px, 150, 38, 11, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(px - 36, 150); c.lineTo(px - 54, 138); c.lineTo(px - 54, 162); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(px + 26, 147, 2.5, 0, 7); c.fill(); }
      if (v.pred === 'rivulus') { var rx = 340 + Math.sin(now * 0.9) * 260; c.fillStyle = '#a16207'; c.beginPath(); c.ellipse(rx, 220, 18, 5, 0, 0, 7); c.fill(); }
      c.fillStyle = '#0f172a'; c.font = 'bold 15px system-ui'; c.textAlign = 'left'; c.fillText('Generation ' + gen + ' · mean spots per male ' + fx(mean, 1), 16, 26);
    }
    function drawChart() { var series = []; if (res) series.push({ name: PRED.filter(function (p) { return p[0] === api.vals().pred; })[0][1].split(' (')[0], pts: res.pts.map(function (p) { return [p.gen, p.spots]; }), color: '#D55E00' });
      api.chart(ch, { xLabel: 'Generation', yLabel: 'Mean spots per male', xmin: 0, xmax: api.vals().gens, ymin: 0, ymax: 24, series: series }); api.stage.querySelector('#gu-lg').innerHTML = res ? api.legend(series) : ''; }
    function readings() { if (!res) return api.readings([['Mean spots', '—']]); var a = res.pts[0], b = res.pts[res.pts.length - 1]; api.readings([['Mean spots at start', fx(a.spots, 2)], ['Mean spots now', fx(b.spots, 2)], ['Change', (b.spots >= a.spots ? '+' : '') + fx(b.spots - a.spots, 2)], ['Mean spot size (0 small – 1 large)', fx(b.size, 2)]]); }
    function frame() { var el = Math.min(1, (performance.now() - t0) / 8000), i = Math.min(res.pts.length - 1, Math.floor(el * (res.pts.length - 1) + 1e-9)), p = res.pts[i];
      if (i !== frame.last) { frame.last = i; fish.forEach(function (f) { if (f.male) f.s = Math.max(0, Math.round(p.spots + (Math.random() - 0.5) * 5)); f.z = p.size; }); }
      draw(p.gen, p.spots); if (el >= 1) { playing = false; api.label('run', '▶ Run generations'); readings(); drawChart(); var a = res.pts[0], b = res.pts[res.pts.length - 1]; cap.textContent = 'After ' + b.gen + ' generations the mean number of spots changed from ' + fx(a.spots, 1) + ' to ' + fx(b.spots, 1) + '.'; api.status('➕ Record, then change the predator.'); return; } if (playing) raf = requestAnimationFrame(frame); }
    api.actions([
      { id: 'run', label: '▶ Run generations', main: true, fn: function () { if (playing) return; var v = api.vals(); seed++; res = simulate({ pred: v.pred, grav: v.grav, mate: v.mate, gens: v.gens, seed: seed }); makeFish(res.pop); frame.last = -1; playing = true; t0 = performance.now(); api.label('run', '⏳ Evolving…'); drawChart(); frame(); } },
      { id: 'rec', label: '➕ Record', fn: function () { if (!res) return api.status('Run first.'); var v = api.vals(), pn = PRED.filter(function (p) { return p[0] === v.pred; })[0][1].split(' (')[0]; res.pts.forEach(function (p) { api.record({ pred: pn, grav: v.grav, mate: v.mate, gen: p.gen, spots: +p.spots.toFixed(2) }); }); } }
    ]);
    api.onChange = function () { res = null; readings(); drawChart(); var s = simulate({ pred: 'none', grav: 'coarse', mate: 1, gens: 0, seed: 3 }); makeFish(s.pop); draw(0, s.pts[0].spots); cap.textContent = ''; };
    api.onChange();
    api.status('Press ▶ Run generations.');
    window.BV_GU = { simulate: simulate };
  }
})();
