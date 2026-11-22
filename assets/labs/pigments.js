/* Photosynthetic pigments laboratory · BioscienceVista · by George Apidi
   IB DP C1.3.4: extract pigments from leaves, spot them on a TLC plate or chromatography paper, run the solvent, then measure the distances
   and calculate Rf values to identify carotene, pheophytin, chlorophyll a, chlorophyll b and the xanthophylls. */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var PIG = [   // name, colour, Rf on TLC (silica, petroleum ether : propanone 9:1), Rf on paper (same solvent)
    ['β-Carotene', '#f59e0b', 0.95, 0.95], ['Pheophytin a', '#6b7280', 0.81, 0.86], ['Chlorophyll a', '#0f766e', 0.61, 0.65],
    ['Chlorophyll b', '#65a30d', 0.50, 0.45], ['Lutein (xanthophyll)', '#facc15', 0.38, 0.71], ['Violaxanthin (xanthophyll)', '#fde047', 0.27, 0.55], ['Neoxanthin (xanthophyll)', '#fef08a', 0.15, 0.36]];
  var PLANTS = {   // relative amount of each pigment (0–1) in the extract
    spinach: { name: 'Spinach leaf', amt: [0.7, 0.15, 1, 0.55, 0.6, 0.3, 0.25] },
    autumn: { name: 'Autumn (yellowing) leaf', amt: [0.8, 0.35, 0.18, 0.1, 0.75, 0.45, 0.3] },
    shade: { name: 'Shade plant leaf', amt: [0.5, 0.15, 1, 0.85, 0.55, 0.2, 0.25] }
  };
  var PL = [['spinach', 'Spinach leaf'], ['autumn', 'Autumn (yellowing) leaf'], ['shade', 'Shade plant leaf (more chlorophyll b)']];
  var MET = [['tlc', 'Thin-layer chromatography (silica plate)'], ['paper', 'Paper chromatography']];
  var LOAD = [['1', '1 small spot (dilute)'], ['5', '5 spots on top of each other'], ['15', '15 spots (concentrated)']];
  var FRONT = 8.0;   // cm the solvent front can travel

  function model(o) {   // o: {plant, met, load, t}
    var k = o.met === 'tlc' ? 2 : 3, front = FRONT * (1 - Math.exp(-o.t / (o.met === 'tlc' ? 4 : 7)));   // front position (cm above the start line)
    var load = +o.load, bands = [];
    PIG.forEach(function (p, i) {
      var a = PLANTS[o.plant].amt[i] * Math.min(1, load / 5) * (load > 10 ? 1.25 : 1), rf = p[k];
      if (a < 0.08) return;
      bands.push({ name: p[0], col: p[1], rf: rf, d: rf * front, a: Math.min(1, a), w: 0.12 + 0.05 * load / 5 + (load > 10 ? 0.25 : 0) });
    });
    return { front: front, bands: bands, streak: load > 10 };
  }

  LABS.pigments = {
    id: 'pigments', title: 'Photosynthetic pigments laboratory: chromatography and Rf values',
    tags: ['Biology', 'Photosynthesis', 'IB DP C1.3.4', 'A Level', 'Tool 1: chromatography'],
    background: '<p>Chloroplasts contain several <b>photosynthetic pigments</b>. <b>Chlorophyll a</b> (blue-green) is the main pigment at the reaction centre of each photosystem; <b>chlorophyll b</b> (yellow-green) and the <b>carotenoids</b>, <b>carotene</b> (orange) and the <b>xanthophylls</b> (yellow), are <b>accessory pigments</b> that absorb other wavelengths and pass the energy on. <b>Pheophytin</b> (grey) is chlorophyll without its magnesium ion; it forms when extracts are old or heated.</p>' +
      '<p>In <b>chromatography</b> a small concentrated spot of pigment extract is put on a <b>start line</b> on a <b>stationary phase</b> (a silica TLC plate or chromatography paper). The bottom edge stands in a <b>solvent</b> (the mobile phase), which moves up by capillary action. Each pigment moves at its own rate, depending on how soluble it is in the solvent and how strongly it sticks to the stationary phase, so the pigments separate. Carotene is the least polar, so it moves furthest.</p>' +
      '<p>Each pigment is identified by its colour and its <b>Rf value</b>: <b>Rf = distance moved by the pigment ÷ distance moved by the solvent front</b> (both measured from the start line). Rf is always between 0 and 1 and is the same for a pigment under the same conditions.</p>',
    objectives: ['Separate photosynthetic pigments by thin-layer or paper chromatography.', 'Measure distances and calculate Rf values.', 'Identify pigments by colour and Rf value.', 'Compare the pigments of different leaves and explain the differences.'],
    rq: 'Which photosynthetic pigments are present in spinach leaves, and what are their Rf values on a silica TLC plate?',
    hypPrompt: 'Predict how many pigments you will see, and which one will move furthest. Explain why pigments separate.',
    hypothesis: { marks: 3, points: [
      { re: [/\b(4|four|5|five|6|six|7|seven|several|many)\b/], marks: 1, ok: 'You predict several pigments.', miss: 'Predict how many pigments you expect.' },
      { re: [/carotene.*(furthest|top|highest|most)|(furthest|top|highest).*carotene/], marks: 1, ok: 'You predict carotene moves furthest.', miss: 'Say which pigment you expect at the top.' },
      { re: [/solub|dissolv|stick|attract|adsor|polar|stationary/], marks: 1, ok: 'You explain using solubility and attraction to the stationary phase.', miss: 'Explain why they separate: solubility in the solvent and attraction to the plate.' }] },
    variables: { iv: 'pigment (each band on the chromatogram)', dv: 'distance moved by each pigment and by the solvent front (cm), and the Rf value', cv: ['type of stationary phase (TLC silica plate)', 'solvent (petroleum ether : propanone 9:1)', 'temperature', 'start line above the solvent level', 'jar covered so the air is saturated with solvent'] },
    apparatus: ['Fresh spinach leaves, sand, propanone, pestle and mortar', 'Silica TLC plate (or chromatography paper) with a pencil start line 1.5 cm from the bottom', 'Fine capillary tube to spot the extract', 'Chromatography jar with a lid, solvent 1 cm deep', 'Ruler (mm)'],
    safety: ['Petroleum ether and propanone are highly flammable and harmful: no flames, use a fume cupboard, wear eye protection and gloves.', 'Draw the start line in pencil: ink would separate too.'],
    method: ['Grind leaves with sand and a little propanone; let the extract settle.', 'Choose a method and how many times to spot the extract (dry the spot between loads).', 'Press <b>▶ Run the chromatogram</b>: the plate stands in the solvent and the front rises. Stop when the front is near the top (move the time slider).', 'Measure: the readings give the distance of the solvent front and of each band from the start line.', 'Press <b>➕ Record bands</b> to put every band in the results table, then calculate and check the Rf values. Repeat for the other leaves and paper.'],
    controls: [
      { id: 'plant', label: 'Leaf', type: 'select', value: 'spinach', options: PL },
      { id: 'met', label: 'Stationary phase', type: 'select', value: 'tlc', options: MET },
      { id: 'load', label: 'Spotting the extract', type: 'select', value: '5', options: LOAD },
      { id: 't', label: 'Time in the solvent', min: 1, max: 20, step: 1, value: 12, unit: 'min' }
    ],
    columns: [
      { key: 'plant', label: 'Leaf', num: false, group: true }, { key: 'met', label: 'Method', num: false, group: true }, { key: 'band', label: 'Band (from top)', dp: 0 },
      { key: 'colour', label: 'Colour / pigment', num: false }, { key: 'd', label: 'Pigment distance', unit: 'cm', dp: 1 }, { key: 'f', label: 'Solvent front', unit: 'cm', dp: 1 }, { key: 'rf', label: 'Rf', dp: 2 }
    ],
    graph: { x: 'band', y: 'rf', group: 'plant' },
    hints: ['Rf = pigment distance ÷ solvent front distance, both from the start line.', 'Measure to the centre of each band.', 'If the front has not moved far, the bands are too close to measure well.', 'Too much extract makes the bands spread and streak.'],
    analyse: [
      { id: 'rfa', q: 'On a TLC plate the solvent front moved 7.5 cm and the blue-green band moved 4.6 cm. Calculate its Rf value and name the pigment.', marks: 2, lines: 2, points: [
        { re: [/0?\.6[01]\b/], marks: 1, ok: 'Rf = 4.6 ÷ 7.5 = 0.61.', miss: 'Rf = 4.6 ÷ 7.5 = 0.61.' }, { re: [/chlorophyll a\b/], marks: 1, ok: 'Chlorophyll a.', miss: 'Blue-green with Rf 0.61 is chlorophyll a.' }] },
      { id: 'top', q: 'State the pigment with the highest Rf value and suggest why it moves furthest.', marks: 2, lines: 3, points: [
        { re: [/carotene/], marks: 1, ok: 'Carotene.', miss: 'Name carotene (orange).' }, { re: [/solub|non.?polar|least polar|not (attracted|stick)|less attract|weak(ly)? (attract|bound|adsorb)/], marks: 1, ok: 'Most soluble in the solvent / least attracted to the plate.', miss: 'Explain: it is the most soluble in the non-polar solvent and least attracted to the plate.' }] },
      { id: 'autumn', q: 'Compare the chromatograms of the spinach leaf and the autumn leaf. Explain the difference.', marks: 3, lines: 4, points: [
        { re: [/chlorophyll.*(less|fainter|smaller|weaker|missing|lower)|(less|fainter|less intense).*chlorophyll/], marks: 1, ok: 'Less chlorophyll in the autumn leaf.', miss: 'Describe the chlorophyll bands of the autumn leaf.' },
        { re: [/carotene|xanthophyll|carotenoid|yellow|orange/], marks: 1, ok: 'Carotenoids remain.', miss: 'Describe the carotene and xanthophyll bands.' },
        { re: [/broken? down|breakdown|degrad|recycl|reabsorb|nitrogen|magnesium|pheophytin/], marks: 1, ok: 'Chlorophyll is broken down (and its Mg and N recycled).', miss: 'Explain: in autumn chlorophyll is broken down, so the yellow/orange carotenoids show.' }] }
    ],
    evaluate: [
      { id: 'load', q: 'What happened when you used 15 spots of extract? Explain how this affects the Rf values you can measure.', marks: 2, lines: 3, points: [
        { re: [/streak|smear|spread|wide|overlap|merge|blur/], marks: 1, ok: 'Bands streak and overlap.', miss: 'Describe the bands: they streak and overlap.' }, { re: [/centre|middle|hard|difficult|uncertain|inaccura|less precise|error/], marks: 1, ok: 'Hard to find the centre: less precise Rf.', miss: 'Explain: the centre of a wide band is hard to judge, so Rf is less precise.' }] },
      { id: 'improve', q: 'Suggest two ways to improve the reliability of the Rf values.', marks: 2, lines: 3, points: [
        { re: [/repeat|replicate|mean|average|several (plates|runs)/], marks: 1, ok: 'Repeat and find a mean.', miss: 'For example: repeat with several plates and calculate a mean Rf.' },
        { re: [/lid|cover|saturat|small spot|dry|pencil|level|start line|fresh|dark|same|ruler|mm|known standard|standard/], marks: 1, ok: 'A valid control or technique.', miss: 'For example: small dry spots, keep the lid on, start line above the solvent, fresh extract kept dark, run known standards.' }] }
    ],
    model: '<ul><li>Rf values (silica TLC, petroleum ether : propanone 9:1): carotene 0.95, pheophytin a 0.81, chlorophyll a 0.61, chlorophyll b 0.50, lutein 0.38, violaxanthin 0.27, neoxanthin 0.15. Paper: 0.95, 0.86, 0.65, 0.45, 0.71, 0.55, 0.36. Real values change with the solvent, temperature and paper or plate, so always quote the conditions.</li>' +
      '<li>The solvent front rises as front = 8 cm × (1 − e<sup>−t/τ</sup>), τ = 4 min (TLC) or 7 min (paper). Pigment amounts are typical relative values for each leaf.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, sim = null, raf = null, playing = false, t0 = 0, W = 640, H = 360;
    api.stage.innerHTML = '<canvas id="pg-cv" width="640" height="360" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Chromatography jar with a plate; pigments separate as the solvent rises"></canvas><p class="small" id="pg-cap" style="margin:6px 0;font-weight:700" aria-live="polite"></p>';
    var cv = api.stage.querySelector('#pg-cv'), c = cv.getContext('2d'), cap = api.stage.querySelector('#pg-cap');
    var PX = 150, PW = 90, BASE = 320, SC = 30;   // plate x, width, start line y, px per cm
    function compute(tt) { var v = api.vals(); sim = model({ plant: v.plant, met: v.met, load: v.load, t: tt == null ? v.t : tt }); sim.v = v; }
    function draw(tt) {
      var v = api.vals(), m = model({ plant: v.plant, met: v.met, load: v.load, t: tt }), ft = BASE - m.front * SC;
      c.clearRect(0, 0, W, H);
      // jar
      c.strokeStyle = '#64748b'; c.lineWidth = 3; c.beginPath(); c.moveTo(90, 50); c.lineTo(90, 350); c.lineTo(300, 350); c.lineTo(300, 50); c.stroke(); c.fillStyle = '#cbd5e1'; c.fillRect(82, 40, 226, 10);
      c.fillStyle = 'rgba(186,230,253,.6)'; c.fillRect(92, 330, 206, 18);
      // plate
      c.fillStyle = v.met === 'tlc' ? '#f8fafc' : '#fffbeb'; c.strokeStyle = '#94a3b8'; c.lineWidth = 1.5; c.fillRect(PX, 60, PW, 285); c.strokeRect(PX, 60, PW, 285);
      c.fillStyle = 'rgba(186,230,253,.45)'; c.fillRect(PX, ft, PW, 345 - ft);
      c.strokeStyle = '#334155'; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(PX, BASE); c.lineTo(PX + PW, BASE); c.stroke(); c.setLineDash([]);
      c.strokeStyle = '#0284c7'; c.beginPath(); c.moveTo(PX, ft); c.lineTo(PX + PW, ft); c.stroke();
      // bands
      m.bands.forEach(function (b) {
        var y = BASE - b.d * SC, h = Math.max(7, b.w * SC * (0.5 + tt / 16));
        c.globalAlpha = 0.25 + 0.7 * b.a; c.fillStyle = b.col; c.beginPath(); c.ellipse(PX + PW / 2, y, PW * 0.32, h / 2, 0, 0, 7); c.fill();
        if (m.streak) { c.globalAlpha = 0.18; c.fillRect(PX + PW * 0.25, y, PW * 0.5, BASE - y); }
        c.globalAlpha = 1;
      });
      c.fillStyle = '#065f46'; c.beginPath(); c.arc(PX + PW / 2, BASE, 4, 0, 7); c.fill();
      // ruler
      c.fillStyle = '#fef9c3'; c.fillRect(PX + PW + 6, 60, 22, 285); c.strokeStyle = '#a16207'; c.strokeRect(PX + PW + 6, 60, 22, 285);
      c.fillStyle = '#713f12'; c.font = '9px system-ui'; c.textAlign = 'left';
      for (var cm = 0; cm <= 8; cm++) { var y = BASE - cm * SC; c.fillRect(PX + PW + 6, y, 10, 1); c.fillText(String(cm), PX + PW + 18, y + 3); for (var mm = 1; mm < 10 && cm < 8; mm++) c.fillRect(PX + PW + 6, y - mm * SC / 10, mm === 5 ? 7 : 4, 1); }
      // labels
      c.fillStyle = '#0f172a'; c.font = 'bold 12px system-ui'; c.fillText('solvent front', 14, ft + 4); c.fillText('start line', 14, BASE + 4); c.fillText('solvent', 14, 342);
      c.textAlign = 'left'; c.font = 'bold 13px system-ui'; c.fillText(PLANTS[v.plant].name + ' · ' + (v.met === 'tlc' ? 'TLC plate' : 'paper'), 330, 30);
      c.font = '12px system-ui'; c.fillText('Time: ' + fx(tt, 1) + ' min · front ' + fx(m.front, 1) + ' cm', 330, 50);
      m.bands.slice().sort(function (a, b) { return b.d - a.d; }).forEach(function (b, i) {
        var y = 80 + i * 34; c.fillStyle = b.col; c.fillRect(330, y - 10, 18, 14); c.fillStyle = '#0f172a'; c.font = '12px system-ui';
        c.fillText('Band ' + (i + 1) + ': ' + fx(b.d, 1) + ' cm', 356, y + 1); c.fillStyle = '#64748b'; c.font = '11px system-ui'; c.fillText(colourName(b.col), 356, y + 15);
      });
      cap.textContent = m.front < 1.5 ? 'The solvent rises up the plate by capillary action…' : m.bands.length + ' bands separated. Measure each from the start line and divide by the solvent front (' + fx(m.front, 1) + ' cm) to get Rf.' + (m.streak ? ' Too much extract: the bands streak.' : '');
      return m;
    }
    function colourName(col) { return { '#f59e0b': 'orange', '#6b7280': 'grey', '#0f766e': 'blue-green', '#65a30d': 'yellow-green', '#facc15': 'yellow', '#fde047': 'pale yellow', '#fef08a': 'very pale yellow' }[col] || ''; }
    function readings() {
      var m = sim; api.readings([['Solvent front', fx(m.front, 1) + ' cm'], ['Bands seen', String(m.bands.length)]].concat(m.bands.slice().sort(function (a, b) { return b.d - a.d; }).slice(0, 4).map(function (b, i) { return ['Band ' + (i + 1) + ' (' + colourName(b.col) + ')', fx(b.d, 1) + ' cm']; })));
    }
    function frame() { var tt = Math.min(api.vals().t, (performance.now() - t0) / 1000 * api.vals().t / 7); draw(tt); if (tt >= api.vals().t) { playing = false; api.label('run', '▶ Run the chromatogram'); api.status('Finished: measure the bands, then ➕ Record bands.'); return; } if (playing) raf = requestAnimationFrame(frame); }
    api.actions([
      { id: 'run', label: '▶ Run the chromatogram', main: true, fn: function () { if (playing) { playing = false; cancelAnimationFrame(raf); api.label('run', '▶ Run the chromatogram'); return; } compute(); readings(); playing = true; t0 = performance.now(); api.label('run', '⏸ Pause'); frame(); } },
      { id: 'rec', label: '➕ Record bands', fn: function () {
        var bs = sim.bands.slice().sort(function (a, b) { return b.d - a.d; });
        bs.forEach(function (b, i) { api.record({ plant: PLANTS[sim.v.plant].name, met: sim.v.met === 'tlc' ? 'TLC' : 'Paper', band: i + 1, colour: colourName(b.col) + ' · ' + b.name, d: +b.d.toFixed(1), f: +sim.front.toFixed(1), rf: +(b.d / sim.front).toFixed(2) }); });
      } }
    ]);
    api.onChange = function () { compute(); readings(); if (!playing) draw(api.vals().t); };
    compute(); readings(); draw(0);
    api.status('Press ▶ Run the chromatogram.');
    window.BV_PIG = { model: model };
  }
})();
