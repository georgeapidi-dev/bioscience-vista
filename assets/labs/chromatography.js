/* Paper chromatography laboratory: food colourings and Rf values · VistaEd · by George Apidi */
(function () {
  var LABS = window.LABS = window.LABS || {};
  // each dye: name, colour, Rf in each solvent [water, 1% salt water, 50% ethanol]
  var DYE = { Y: ['Yellow dye E102', '#facc15', [0.86, 0.72, 0.55]], R: ['Red dye E129', '#dc2626', [0.62, 0.38, 0.70]], B: ['Blue dye E133', '#2563eb', [0.93, 0.84, 0.38]], O: ['Orange dye E110', '#f97316', [0.74, 0.55, 0.63]], P: ['Purple dye E122', '#9333ea', [0.30, 0.18, 0.47]] };
  var SAMPLE = { Y: ['Yellow E102 (reference)', ['Y']], R: ['Red E129 (reference)', ['R']], B: ['Blue E133 (reference)', ['B']], O: ['Orange E110 (reference)', ['O']], P: ['Purple E122 (reference)', ['P']],
    green: ['Green sweet coating', ['Y', 'B']], brown: ['Brown sweet coating', ['R', 'B', 'Y']], ink: ['Black felt-tip ink', ['P', 'Y', 'B']], X: ['Unknown drink X', ['R', 'O']] };
  var SOLV = [['water', 'Water'], ['salt', '1% salt water'], ['eth', '50% ethanol']];
  var SI = { water: 0, salt: 1, eth: 2 }, PAPER = 9.0;   // cm from the pencil line to the top of the usable paper
  function front(t) { return PAPER * (1 - Math.exp(-t / 5)); }   // solvent front (cm) after t minutes
  LABS.chromatography = {
    id: 'chromatography', title: 'Paper chromatography laboratory: food colourings and Rf values',
    tags: ['Chemistry', 'Separating mixtures', 'MYP 1–5', 'IGCSE', 'Edexcel', 'A Level'],
    background: '<figure style="margin:0 0 10px"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Paper_chromatography_in_progress.jpg?width=640" alt="Paper chromatography in a school laboratory." loading="lazy" style="max-width:100%;max-height:320px;border-radius:10px"><figcaption style="font-size:.85rem;color:#475569">Paper chromatography in a school laboratory. Photo: Amitchell125, via <a href="https://commons.wikimedia.org/wiki/File:Paper_chromatography_in_progress.jpg" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure><p><b>Paper chromatography</b> separates the soluble substances in a mixture. A spot is placed on a <b>pencil</b> start line; the solvent (<b>mobile phase</b>) moves up the paper (<b>stationary phase</b>) by capillary action.</p>' +
      '<p>Each substance is distributed between the two phases. Substances that are more soluble in the solvent and less attracted to the paper travel further. A <b>pure</b> substance gives one spot; a mixture gives several.</p>' +
      '<p>The <b>R<sub>f</sub> value</b> = distance moved by the spot ÷ distance moved by the solvent front. In a given solvent each substance has its own R<sub>f</sub>, so comparing with reference dyes identifies the substances in a mixture.</p>',
    objectives: ['Set up a paper chromatogram with a pencil start line above the solvent.', 'Measure distances and calculate Rf values.', 'Identify the dyes in mixtures by comparing Rf values with references.', 'Explain why a different solvent changes the Rf values.'],
    rq: 'Which food dyes are present in the green and brown sweet coatings and in drink X?',
    hypPrompt: 'Predict how many spots the green sweet coating will give, and explain how you will identify them.',
    hypothesis: { marks: 3, points: [
      { re: [/\b2\b|two|more than one|several/], marks: 1, ok: 'More than one spot.', miss: 'Predict the number of spots: green is usually a mixture of two dyes.' },
      { re: [/yellow|blue/], marks: 1, ok: 'Dyes named.', miss: 'Name the dyes you expect (yellow and blue make green).' },
      { re: [/r ?f|same (height|distance)|compare|reference|match/], marks: 1, ok: 'Identification method.', miss: 'Explain: compare Rf values (or spot heights) with reference dyes.' }] },
    variables: { iv: 'the sample spotted (and the solvent)', dv: 'distance moved by each spot and by the solvent front (cm); Rf value', cv: ['the same chromatography paper', 'start line 1.5 cm from the bottom, above the solvent', 'spot size', 'time allowed (the same solvent front distance)'] },
    apparatus: ['Chromatography paper and pencil', 'Capillary tubes for spotting', 'Beaker with lid (or watch glass)', 'Solvents: water, 1% salt water, 50% ethanol', 'Ruler (mm)', 'Reference dyes E102, E110, E122, E129, E133'],
    safety: ['Ethanol is highly flammable: no flames.', 'Do not eat the sweets in the laboratory.', 'Wash hands after handling dyes.'],
    method: ['Draw a pencil line 1.5 cm from the bottom of the paper (ink would run).', 'Choose a sample and spot it on the line; let it dry and spot again.', 'Choose a solvent and run time; press <b>Run</b>. The solvent level is below the line.', 'Remove the paper, mark the solvent front, and measure each spot to its centre.', 'Press <b>Record</b>. Run every reference dye and every mixture in the same solvent.'],
    controls: [
      { id: 'sam', label: 'Sample', type: 'select', value: 'green', options: Object.keys(SAMPLE).map(function (k) { return [k, SAMPLE[k][0]]; }) },
      { id: 'solv', label: 'Solvent', type: 'select', value: 'salt', options: SOLV },
      { id: 't', label: 'Run time', type: 'range', min: 2, max: 20, step: 1, value: 15, unit: 'min' }
    ],
    columns: [
      { key: 'sam', label: 'Sample', num: false }, { key: 'solv', label: 'Solvent', num: false, group: true }, { key: 't', label: 'Run time', unit: 'min', dp: 0 },
      { key: 'front', label: 'Solvent front', unit: 'cm', dp: 1 }, { key: 'n', label: 'Spots', dp: 0 },
      { key: 'd1', label: 'Spot 1 distance', unit: 'cm', dp: 1 }, { key: 'rf1', label: 'Rf 1', dp: 2 }, { key: 'd2', label: 'Spot 2 distance', unit: 'cm', dp: 1 }, { key: 'rf2', label: 'Rf 2', dp: 2 }, { key: 'd3', label: 'Spot 3 distance', unit: 'cm', dp: 1 }, { key: 'rf3', label: 'Rf 3', dp: 2 }
    ],
    graph: { x: 't', y: 'front', group: 'solv' },
    hints: ['Measure from the start line to the centre of each spot.', 'Rf = spot distance ÷ solvent front distance. It is always less than 1.', 'Compare Rf values only within the same solvent.', 'If two dyes have the same Rf in one solvent, try another solvent.'],
    analyse: [
      { id: 'rf', q: 'A spot moved 4.2 cm when the solvent front moved 7.5 cm. Calculate its Rf value.', marks: 1, lines: 1, number: { value: 0.56, tol: 0.02, dp: 2 } },
      { id: 'green', q: 'Identify the dyes in the green sweet coating, using your Rf values.', marks: 2, lines: 3, points: [
        { re: [/yellow|e102/], marks: 1, ok: 'Yellow E102.', miss: 'Compare the spots with the reference Rf values.' }, { re: [/blue|e133/], marks: 1, ok: 'Blue E133.', miss: 'Find the second dye.' }] },
      { id: 'X', q: 'Identify the dyes in drink X. Explain your evidence.', marks: 3, lines: 4, points: [
        { re: [/red|e129/], marks: 1, ok: 'Red E129.', miss: 'Find one dye in X.' }, { re: [/orange|e110/], marks: 1, ok: 'Orange E110.', miss: 'Find the second dye in X.' },
        { re: [/same r ?f|matching r ?f|r ?f.*(same|match)|same (height|distance)/], marks: 1, ok: 'Matching Rf values.', miss: 'Explain: each spot has the same Rf as a reference dye in the same solvent.' }] },
      { id: 'solv', q: 'Explain why the Rf value of a dye depends on the solvent.', marks: 2, lines: 3, points: [
        { re: [/solub/], marks: 1, ok: 'Solubility.', miss: 'The dye has a different solubility in each solvent.' },
        { re: [/attract|paper|stationary|distribut|affinity/], marks: 1, ok: 'Attraction to the paper.', miss: 'Its distribution between the solvent and the paper changes.' }] },
      { id: 'pure', q: 'How does a chromatogram show that a substance is pure?', marks: 1, lines: 2, points: [
        { re: [/one spot|single spot|only one/], marks: 1, ok: 'One spot.', miss: 'A pure substance gives a single spot (in every solvent).' }] }
    ],
    evaluate: [
      { id: 'err', q: 'Give two precautions that make Rf values more accurate.', marks: 2, lines: 3, points: [
        { re: [/pencil|small spot|concentrated|dry/], marks: 1, ok: 'Spot or line precaution.', miss: 'Use a pencil line and small, concentrated spots.' },
        { re: [/lid|cover|evaporat|below the line|front (quickly|immediately|straight away)|mark the front|centre|center/], marks: 1, ok: 'A second precaution.', miss: 'Cover the beaker, keep the solvent below the line and mark the front at once.' }] },
      { id: 'lim', q: 'Give one simplification in this model.', marks: 1, lines: 2, points: [
        { re: [/round|perfect|no (tailing|spreading)|same size|exact|fixed r ?f|evaporat|constant/], marks: 1, ok: 'A valid simplification.', miss: 'For example: spots stay perfectly round and every dye has a fixed Rf.' }] }
    ],
    model: '<ul><li>Solvent front f = 9.0 cm × (1 − e<sup>−t/5 min</sup>). Each spot moves Rf × f.</li><li>Rf values (water / 1% salt / 50% ethanol) are illustrative: E102 0.86/0.72/0.55, E129 0.62/0.38/0.70, E133 0.93/0.84/0.38, E110 0.74/0.55/0.63, E122 0.30/0.18/0.47. Measurements to ±0.1 cm.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var raf = 0, done = null;
    api.stage.innerHTML = '<svg viewBox="0 0 420 240" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Chromatography paper in a beaker of solvent" id="ch-sv"></svg>';
    var sv = api.stage.querySelector('#ch-sv'), PX = 18, y0 = 200;   // px per cm; start line at y0
    function spots(v, f) { var si = SI[v.solv]; return SAMPLE[v.sam][1].map(function (k) { return { k: k, col: DYE[k][1], d: DYE[k][2][si] * f }; }).sort(function (a, b) { return a.d - b.d; }); }
    function draw(f, show) {
      var v = api.vals(), h = '';
      h += '<rect x="130" y="20" width="160" height="210" rx="8" fill="#e0f2fe" opacity=".5" stroke="#0284c7"/><rect x="131" y="205" width="158" height="24" fill="' + (v.solv === 'eth' ? '#e9d5ff' : '#bae6fd') + '"/>';
      h += '<rect x="175" y="30" width="70" height="198" fill="#fff" stroke="#94a3b8"/>';
      h += '<rect x="176" y="' + (y0 - f * PX) + '" width="68" height="' + (f * PX + 27) + '" fill="#dbeafe" opacity=".55"/>';
      h += '<line x1="176" y1="' + y0 + '" x2="244" y2="' + y0 + '" stroke="#64748b" stroke-dasharray="2 2"/><text x="250" y="' + (y0 + 4) + '" font-size="9">pencil line</text>';
      if (f > 0.2) h += '<line x1="176" y1="' + (y0 - f * PX) + '" x2="244" y2="' + (y0 - f * PX) + '" stroke="#0369a1"/><text x="250" y="' + (y0 - f * PX + 4) + '" font-size="9">solvent front</text>';
      spots(v, f).forEach(function (s, i) { h += '<ellipse cx="210" cy="' + (y0 - s.d * PX) + '" rx="' + (6 + s.d * 0.4) + '" ry="' + (4 + s.d * 0.5) + '" fill="' + s.col + '" opacity=".85"/>'; });
      if (show) spots(v, f).forEach(function (s, i) { h += '<text x="30" y="' + (40 + i * 18) + '" font-size="11" fill="' + s.col + '">spot ' + (i + 1) + ': ' + s.d.toFixed(1) + ' cm</text>'; });
      if (show) h += '<text x="30" y="' + (40 + spots(v, f).length * 18) + '" font-size="11">front: ' + f.toFixed(1) + ' cm</text>';
      sv.innerHTML = h;
    }
    function run() {
      cancelAnimationFrame(raf); var v = api.vals(), t0 = performance.now(), dur = 600 * v.t; api.enable('run', false); api.enable('rec', false);
      (function loop() { var tt = Math.min(v.t, (performance.now() - t0) / dur * v.t), f = front(tt); draw(f, false); api.readings([['Time', tt.toFixed(1) + ' min'], ['Solvent front', f.toFixed(1) + ' cm']]);
        if (tt < v.t) raf = requestAnimationFrame(loop); else { done = { v: v, f: f, sp: spots(v, f) }; draw(f, true); api.enable('run', true); api.enable('rec', true); api.status(done.sp.length + ' spot' + (done.sp.length > 1 ? 's' : '') + '. Measure them, then press Record.'); } })();
    }
    function r1(x) { return Math.round(x * 10) / 10; }
    api.actions([
      { id: 'run', label: '▶ Run', main: true, fn: run },
      { id: 'rec', label: '➕ Record', fn: function () { if (!done) return; var v = done.v, f = r1(done.f), row = { sam: SAMPLE[v.sam][0], solv: SOLV[SI[v.solv]][1], t: v.t, front: f, n: done.sp.length };
        done.sp.forEach(function (s, i) { var d = r1(s.d); row['d' + (i + 1)] = d; row['rf' + (i + 1)] = +(d / f).toFixed(2); }); api.record(row); api.enable('rec', false); } }
    ]);
    api.onChange = function () { cancelAnimationFrame(raf); done = null; api.enable('run', true); api.enable('rec', false); draw(0, false); api.readings([['Sample', SAMPLE[api.vals().sam][0]]]); };
    api.onShow = function () { if (!done) draw(0, false); };
    api.status('Choose a sample, a solvent and a run time, then press Run.');
    api.onChange();
  }
})();
