/* Diffusion and surface area to volume laboratory: agar cubes · VistaEd · by George Apidi */
(function () {
  var LABS = window.LABS = window.LABS || {};
  // depth (cm) that acid has diffused into the agar after t seconds: d = k √t, with k from the acid concentration and temperature
  function kk(v) { return 0.01225 * Math.sqrt(v.c / 0.1) * Math.sqrt((v.T + 273.15) / 293.15) * (1 + 0.012 * (v.T - 20)); }
  function depth(v, t) { return kk(v) * Math.sqrt(t); }
  function clearFrac(s, d) { var inner = Math.max(0, s - 2 * d); return 1 - Math.pow(inner / s, 3); }
  function tClear(v, s) { var k = kk(v); return Math.pow(s / 2 / k, 2); }
  LABS.agarcubes = {
    id: 'agarcubes', title: 'Diffusion laboratory: agar cubes and surface area to volume ratio',
    tags: ['Biology', 'Cells and transport', 'MYP 3–5', 'IGCSE', 'Edexcel', 'IB DP', 'A Level'],
    background: '<figure style="margin:0 0 10px"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Phenolphthalein-at-pH-9.jpg?width=640" alt="Phenolphthalein is pink in alkali; it turns colourless when acid neutralises the alkali." loading="lazy" style="max-width:100%;max-height:320px;border-radius:10px"><figcaption style="font-size:.85rem;color:#475569">Phenolphthalein is pink in alkali; it turns colourless when acid neutralises the alkali. Photo: Ben Mills, via <a href="https://commons.wikimedia.org/wiki/File:Phenolphthalein-at-pH-9.jpg" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure><p><b>Diffusion</b> is the net movement of particles from a region of higher concentration to a region of lower concentration, down a concentration gradient. It is fast over short distances but very slow over long ones.</p>' +
      '<p>Agar cubes containing phenolphthalein indicator and a little alkali are pink. When they sit in hydrochloric acid, acid diffuses in from every face and the agar turns <b>colourless</b>.</p>' +
      '<p>As a cube gets bigger, its volume (s³) grows faster than its surface area (6s²), so its <b>surface area to volume ratio</b> (6/s) falls. A smaller fraction of a large cube is reached in a given time. This is why cells are small, and why large organisms need specialised exchange surfaces (lungs, gills, villi, leaves) and transport systems.</p>',
    objectives: ['Calculate the surface area, volume and SA:V ratio of cubes.', 'Measure how far acid diffuses into agar in a fixed time.', 'Relate SA:V ratio to the percentage of a cube reached by diffusion.', 'Explain why large organisms need exchange surfaces and transport systems.'],
    rq: 'How does the surface area to volume ratio of an agar cube affect the percentage of its volume reached by acid in 10 minutes?',
    hypPrompt: 'Predict which cube will turn completely colourless first, and explain using the surface area to volume ratio.',
    hypothesis: { marks: 3, points: [
      { re: [/small/], marks: 1, ok: 'Smallest cube first.', miss: 'Say which cube clears first: the smallest.' },
      { re: [/ratio|sa ?: ?v|surface area to volume|larger surface area (relative|compared)/], marks: 1, ok: 'SA:V used.', miss: 'Use the surface area to volume ratio.' },
      { re: [/distance|centre|center|shorter|travel|reach/], marks: 1, ok: 'Distance to the centre.', miss: 'Explain: acid has a shorter distance to diffuse to the centre.' }] },
    variables: { iv: 'side length of the cube (cm), giving the SA:V ratio', dv: 'percentage of the cube\'s volume turned colourless after 10 minutes', cv: ['concentration of the acid', 'temperature of the acid', 'volume of acid (cubes fully covered)', 'time in the acid (10 minutes)', 'the same batch of agar'] },
    apparatus: ['Pink phenolphthalein agar (with dilute sodium hydroxide)', 'Scalpel, white tile and ruler', 'Beakers of hydrochloric acid 0.05–0.2 mol/dm³', 'Stopwatch, forceps, paper towels', 'Thermometer, water bath'],
    safety: ['Wear eye protection: hydrochloric acid and sodium hydroxide are irritants.', 'Cut on a tile away from your fingers.', 'Use forceps to lift cubes out of the acid.'],
    method: ['Cut cubes with sides 0.5, 1, 1.5, 2, 2.5 and 3 cm. Calculate surface area, volume and SA:V.', 'Choose the cube, acid concentration and temperature.', 'Press <b>Start</b>: the cube sits in acid for 10 minutes (shown in 8 seconds).', 'Lift it out, blot it, cut it in half and measure the depth of the colourless layer.', 'Press <b>Record</b>. Repeat each size three times.'],
    controls: [
      { id: 's', label: 'Side length of the cube', type: 'range', min: 0.5, max: 3, step: 0.5, value: 1, dp: 1, unit: 'cm' },
      { id: 'c', label: 'Hydrochloric acid concentration', type: 'range', min: 0.05, max: 0.2, step: 0.05, value: 0.1, dp: 2, unit: 'mol/dm³' },
      { id: 'T', label: 'Temperature', type: 'range', min: 10, max: 40, step: 5, value: 20, unit: '°C' }
    ],
    columns: [
      { key: 'set', label: 'Acid and temperature', num: false, group: true }, { key: 's', label: 'Side', unit: 'cm', dp: 1 }, { key: 'sa', label: 'Surface area', unit: 'cm²', dp: 2 }, { key: 'vol', label: 'Volume', unit: 'cm³', dp: 3 },
      { key: 'ratio', label: 'SA:V ratio', unit: 'cm⁻¹', dp: 1 }, { key: 'd', label: 'Depth after 10 min', unit: 'mm', dp: 1 }, { key: 'pc', label: 'Volume cleared', unit: '%', dp: 0 }, { key: 'tc', label: 'Time to clear fully', unit: 'min', dp: 1 }
    ],
    graph: { x: 'ratio', y: 'pc', group: 'set' },
    hints: ['Surface area = 6 × s². Volume = s³. SA:V = 6 ÷ s.', 'The depth of the colourless layer is almost the same for every cube: it depends on time, not size.', 'Percentage cleared = (1 − (s − 2d)³ ÷ s³) × 100.', 'Change one variable at a time.'],
    analyse: [
      { id: 'sav', q: 'Calculate the SA:V ratio of a 2 cm cube.', marks: 1, lines: 1, number: { value: 3, tol: 0.01, unit: 'cm⁻¹', dp: 1 } },
      { id: 'trend', q: 'Describe the relationship between SA:V ratio and the percentage of the cube cleared, using values.', marks: 2, lines: 3, points: [
        { re: [/(higher|larger|greater|bigger|increas).*(more|higher|greater|larger|increas)|positive|smaller cube.*more/], marks: 1, ok: 'Higher SA:V, more cleared.', miss: 'State: the higher the SA:V ratio, the larger the percentage cleared.' },
        { re: [/\d/], marks: 1, ok: 'Values quoted.', miss: 'Quote values.' }] },
      { id: 'depth', q: 'Was the depth of the colourless layer different for different cubes? Explain why.', marks: 2, lines: 3, points: [
        { re: [/same|similar|equal|constant|(did ?n.?t|did not|no(t)?) (change|differ)/], marks: 1, ok: 'About the same.', miss: 'The depth was about the same for every size.' },
        { re: [/same (time|rate|speed)|depends on time|rate of diffusion|diffuses? at the same/], marks: 1, ok: 'Same diffusion rate.', miss: 'Explain: acid diffuses at the same rate into every cube, so it reaches the same depth in the same time.' }] },
      { id: 'org', q: 'Use your results to explain why a large organism such as a human needs lungs and a circulatory system.', marks: 3, lines: 4, points: [
        { re: [/small (sa|surface)|low (sa|ratio)|sa ?: ?v (is )?(small|low)|smaller ratio/], marks: 1, ok: 'Low SA:V.', miss: 'A large organism has a small SA:V ratio.' },
        { re: [/distance|too (slow|far)|centre|center|deep|inner cells|takes too long/], marks: 1, ok: 'Diffusion too slow over long distances.', miss: 'Diffusion over long distances is too slow to supply inner cells.' },
        { re: [/lung|alveol|exchange surface|increase (the )?surface|transport|blood|circulat/], marks: 1, ok: 'Exchange surface and transport.', miss: 'Lungs increase the surface area; blood carries substances over long distances.' }] }
    ],
    evaluate: [
      { id: 'err', q: 'Give two sources of error in the real experiment, and how to reduce each.', marks: 2, lines: 4, points: [
        { re: [/cut|not (exact|perfect)|uneven|size|shape|ruler/], marks: 1, ok: 'Cutting accuracy.', miss: 'Cubes are hard to cut exactly: use a template and measure each one.' },
        { re: [/time|timing|blot|continue|carry on|judg|edge|colour|faint|stir|surface (touch|resting)|bottom/], marks: 1, ok: 'A second source.', miss: 'Acid keeps diffusing until blotted; the faint edge is hard to judge; the face on the beaker floor gets less acid (stand cubes on a mesh).' }] },
      { id: 'lim', q: 'Give one way in which an agar cube is a poor model of a real cell.', marks: 1, lines: 2, points: [
        { re: [/membrane|active|alive|living|shape|not (a )?cube|organelle|cytoplasm|use(s|d)? (up )?(the )?substance|respir/], marks: 1, ok: 'A valid limitation.', miss: 'For example: cells have membranes and use up the substances; agar does not.' }] }
    ],
    model: '<ul><li>Depth reached d = k√t, with k = 0.0123 cm s<sup>−½</sup> at 0.10 mol/dm³ and 20 °C (about 3 mm in 10 minutes). k rises with √(concentration) and with temperature (about 1.4 % per °C).</li>' +
      '<li>Percentage cleared = 1 − (s − 2d)³ ÷ s³. Time to clear fully = (s/2 ÷ k)². Each cube varies by ±3 %.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var raf = 0, run = null;
    api.stage.innerHTML = '<svg viewBox="0 0 420 220" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Pink agar cube in acid, and its cut face" id="ag-sv"></svg>';
    var sv = api.stage.querySelector('#ag-sv');
    function draw(t, noise) {
      var v = api.vals(), s = v.s, d = Math.min(s / 2, depth(v, t) * (noise || 1)), px = 40, w = s * px, h = '';
      h += '<rect x="20" y="60" width="160" height="140" rx="8" fill="#e0f2fe" stroke="#0284c7"/><text x="100" y="214" font-size="10" text-anchor="middle">beaker of acid</text>';
      var x0 = 100 - w / 2, y0 = 190 - w;
      h += '<polygon points="' + x0 + ',' + y0 + ' ' + (x0 + w) + ',' + y0 + ' ' + (x0 + w + w * 0.35) + ',' + (y0 - w * 0.3) + ' ' + (x0 + w * 0.35) + ',' + (y0 - w * 0.3) + '" fill="#f9a8d4" stroke="#9d174d"/>';
      h += '<polygon points="' + (x0 + w) + ',' + y0 + ' ' + (x0 + w + w * 0.35) + ',' + (y0 - w * 0.3) + ' ' + (x0 + w + w * 0.35) + ',' + (y0 + w - w * 0.3) + ' ' + (x0 + w) + ',' + (y0 + w) + '" fill="#f472b6" stroke="#9d174d"/>';
      h += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + w + '" fill="#ec4899" stroke="#9d174d"/>';
      var big = 120, sc = big / s, cx = 300, cy = 110, inner = Math.max(0, s - 2 * d) * sc;
      h += '<text x="' + cx + '" y="30" font-size="11" text-anchor="middle">cut face (enlarged)</text><rect x="' + (cx - big / 2) + '" y="' + (cy - big / 2) + '" width="' + big + '" height="' + big + '" fill="#f8fafc" stroke="#9d174d" stroke-width="2"/>';
      if (inner > 0) h += '<rect x="' + (cx - inner / 2) + '" y="' + (cy - inner / 2) + '" width="' + inner + '" height="' + inner + '" fill="#ec4899"/>';
      h += '<text x="' + cx + '" y="' + (cy + big / 2 + 18) + '" font-size="11" text-anchor="middle">colourless depth ' + (d * 10).toFixed(1) + ' mm</text>';
      sv.innerHTML = h;
      return d;
    }
    function sizes(s) { return { sa: 6 * s * s, vol: s * s * s, ratio: 6 / s }; }
    function idle() { cancelAnimationFrame(raf); draw(0); var z = sizes(api.vals().s); api.readings([['Surface area', z.sa.toFixed(2) + ' cm²'], ['Volume', z.vol.toFixed(3) + ' cm³'], ['SA:V', z.ratio.toFixed(1) + ' : 1']]); api.enable('rec', false); }
    function start() {
      cancelAnimationFrame(raf); var v = api.vals(), n = 1 + (Math.random() - 0.5) * 0.06, t0 = performance.now(); api.enable('start', false); api.enable('rec', false);
      (function loop() {
        var f = Math.min(1, (performance.now() - t0) / 8000), t = f * 600, d = draw(t, n), z = sizes(v.s);
        api.readings([['Time', (t / 60).toFixed(1) + ' min'], ['Depth', (d * 10).toFixed(1) + ' mm'], ['Cleared', (clearFrac(v.s, d) * 100).toFixed(0) + ' %'], ['SA:V', z.ratio.toFixed(1) + ' : 1']]);
        if (f < 1) raf = requestAnimationFrame(loop); else { run = { v: v, d: d, n: n }; api.enable('start', true); api.enable('rec', true); api.status('10 minutes done. Press Record trial.'); }
      })();
    }
    api.actions([
      { id: 'start', label: '▶ Start (10 min)', main: true, fn: start },
      { id: 'rec', label: '➕ Record trial', fn: function () { if (!run) return; var v = run.v, z = sizes(v.s);
        api.record({ set: v.c.toFixed(2) + ' mol/dm³, ' + v.T + ' °C', s: v.s, sa: +z.sa.toFixed(3), vol: +z.vol.toFixed(4), ratio: +z.ratio.toFixed(2), d: +(run.d * 10).toFixed(1), pc: Math.round(clearFrac(v.s, run.d) * 100), tc: +(tClear(v, v.s) / run.n / run.n / 60).toFixed(1) }); api.enable('rec', false); } }
    ]);
    api.onChange = function () { run = null; api.enable('start', true); idle(); };
    api.onShow = function () { if (!run) idle(); };
    api.status('Choose the cube size, then press Start.');
    idle();
  }
})();
