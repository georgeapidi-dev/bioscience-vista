/* Reactivity laboratory: displacement reactions and simple electrochemical cells · VistaEd · by George Apidi */
(function () {
  var LABS = window.LABS = window.LABS || {};
  // metal: name, standard electrode potential E° (V) of M^n+/M, charge n, colour of metal, colour of its salt solution
  var MET = { Mg: ['Magnesium', -2.37, 2, '#cbd5e1', '#f8fafc'], Zn: ['Zinc', -0.76, 2, '#94a3b8', '#f8fafc'], Fe: ['Iron', -0.44, 2, '#71717a', '#d9f99d'],
    Pb: ['Lead', -0.13, 2, '#64748b', '#f8fafc'], Cu: ['Copper', 0.34, 2, '#c2410c', '#60a5fa'], Ag: ['Silver', 0.80, 1, '#e5e7eb', '#f8fafc'] };
  var SALT = { Mg: 'magnesium sulfate', Zn: 'zinc sulfate', Fe: 'iron(II) sulfate', Pb: 'lead(II) nitrate', Cu: 'copper(II) sulfate', Ag: 'silver nitrate' };
  function run(v) {   // metal A dipped into the solution of metal B (displacement); and a cell made of A and B
    var A = MET[v.a], B = MET[v.b], dE = B[1] - A[1];
    var mol = 0.5 * 0.025, q = mol * B[2] * 96485 * Math.max(0, dE) * 0.7, dT = v.a === v.b ? 0 : q / (25 * 4.18);   // 25 cm³ of 0.50 mol/dm³ salt; 70 % of the energy shows as heat
    var cellV = v.a === v.b ? 0 : Math.abs(dE) * (v.a === 'Mg' || v.b === 'Mg' ? 0.82 : 0.97);   // magnesium's oxide layer lowers its real voltage
    return { dE: dE, dT: dE > 0 ? dT : 0, react: dE > 0 && v.a !== v.b, V: cellV, neg: dE >= 0 ? v.a : v.b };
  }
  LABS.cells = {
    id: 'cells', title: 'Reactivity laboratory: displacement reactions and electrochemical cells',
    tags: ['Chemistry', 'Reactivity and electrochemistry', 'MYP 3–5', 'IGCSE', 'Edexcel', 'IB DP R3.2', 'A Level'],
    background: '<figure style="margin:0 0 10px"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Reaction_of_zinc_metal_and_copper%28II%29_sulfate.jpg?width=640" alt="Zinc in copper(II) sulfate solution: red-brown copper forms on the zinc." loading="lazy" style="max-width:100%;max-height:320px;border-radius:10px"><figcaption style="font-size:.85rem;color:#475569">Zinc in copper(II) sulfate solution: red-brown copper forms on the zinc. Photo: Luyao, via <a href="https://commons.wikimedia.org/wiki/File:Reaction_of_zinc_metal_and_copper%28II%29_sulfate.jpg" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure><p>A more reactive metal <b>displaces</b> a less reactive metal from a solution of its salt, for example Zn(s) + CuSO₄(aq) → ZnSO₄(aq) + Cu(s). The more reactive metal loses electrons (is <b>oxidised</b>); the ions of the less reactive metal gain them (are <b>reduced</b>). The reaction is exothermic, so the temperature rises.</p>' +
      '<p>If the two metals are kept apart, in their own solutions joined by a <b>salt bridge</b>, the electrons flow through a wire instead: an <b>electrochemical (voltaic) cell</b>. The more reactive metal is the <b>negative</b> electrode. The further apart the two metals are in the reactivity series, the larger the voltage and the larger the temperature rise in displacement.</p>' +
      '<p>Reactivity series (most reactive first): magnesium &gt; zinc &gt; iron &gt; lead &gt; copper &gt; silver.</p>',
    objectives: ['Carry out displacement reactions and measure the temperature rise.', 'Build cells from pairs of metals and measure their voltage.', 'Use the results to place metals in a reactivity series.', 'Write ionic and half-equations; identify oxidation and reduction.'],
    rq: 'How does the difference in reactivity between two metals affect the temperature rise in displacement and the voltage of a cell made from them?',
    hypPrompt: 'Predict which pair of metals will give the largest voltage and the largest temperature rise, and explain why.',
    hypothesis: { marks: 3, points: [
      { re: [/magnesium|mg/], marks: 1, ok: 'Magnesium chosen.', miss: 'Pick the most reactive metal (magnesium).' },
      { re: [/silver|ag|copper|cu/], marks: 1, ok: 'A much less reactive partner.', miss: 'Pair it with the least reactive metal (silver or copper).' },
      { re: [/further apart|difference|gap|far apart|more reactive/], marks: 1, ok: 'Reactivity difference used.', miss: 'Explain: the bigger the difference in reactivity, the more energy is released.' }] },
    variables: { iv: 'the pair of metals', dv: 'temperature rise in displacement (°C); cell voltage (V)', cv: ['volume (25 cm³) and concentration (0.50 mol/dm³) of the salt solution', 'mass and surface area of metal powder (in excess)', 'the same polystyrene cup, thermometer and voltmeter', 'clean electrodes (sanded)'] },
    apparatus: ['Polystyrene cups and thermometer (±0.5 °C)', 'Metal powders and strips: Mg, Zn, Fe, Pb, Cu, Ag', '0.50 mol/dm³ solutions of each metal salt', 'Beakers, salt bridge (filter paper soaked in KNO₃)', 'High-resistance voltmeter and leads, emery paper'],
    safety: ['Wear eye protection. Silver nitrate stains and is corrosive; lead compounds are toxic.', 'Add magnesium powder slowly: the reaction can be vigorous.', 'Dispose of heavy-metal solutions in the residue bottle, not the sink.'],
    method: ['Choose metal A and the solution of metal B.', 'Press <b>Run</b>: metal A powder is added to 25 cm³ of the salt solution of B; record the highest temperature. The same pair is joined as a cell and the voltmeter read.', 'Press <b>Record</b>. Test every pair.', 'Use the results to put the six metals in order of reactivity.'],
    controls: [
      { id: 'a', label: 'Metal A (powder / electrode)', type: 'select', value: 'Zn', options: Object.keys(MET).map(function (k) { return [k, MET[k][0]]; }) },
      { id: 'b', label: 'Solution of metal B', type: 'select', value: 'Cu', options: Object.keys(MET).map(function (k) { return [k, SALT[k]]; }) }
    ],
    columns: [
      { key: 'pair', label: 'Metal A in solution of B', num: false }, { key: 'react', label: 'Reaction?', num: false, group: true },
      { key: 'dT', label: 'Temperature rise', unit: '°C', dp: 1 }, { key: 'V', label: 'Cell voltage', unit: 'V', dp: 2 }, { key: 'neg', label: 'Negative electrode', num: false }
    ],
    graph: { x: 'V', y: 'dT', group: 'react' },
    hints: ['No reaction means metal A is less reactive than metal B.', 'The negative electrode is the more reactive metal: it loses electrons.', 'Plot temperature rise (y) against voltage (x) for the pairs that reacted.', 'Magnesium often gives a lower voltage than expected because of its oxide layer.'],
    analyse: [
      { id: 'order', q: 'Use your results to list the six metals in order of reactivity, most reactive first.', marks: 2, lines: 2, points: [
        { re: [/mg.*zn.*fe.*pb.*cu.*ag|magnesium.*zinc.*iron.*lead.*copper.*silver/], marks: 2, ok: 'Correct order.', miss: 'Order: magnesium, zinc, iron, lead, copper, silver.' }] },
      { id: 'zncu', q: 'Write the ionic equation for zinc reacting with copper(II) sulfate, and state which species is oxidised.', marks: 2, lines: 3, points: [
        { re: [/zn.*cu ?2\+?.*zn ?2\+?.*cu|zn ?\+ ?cu/], marks: 1, ok: 'Equation.', miss: 'Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s).' },
        { re: [/zinc.*oxidi|zn.*oxidi|oxidi.*zinc|loses electrons/], marks: 1, ok: 'Zinc is oxidised.', miss: 'Zinc loses electrons, so it is oxidised.' }] },
      { id: 'rel', q: 'Describe the relationship between cell voltage and temperature rise. Explain it.', marks: 3, lines: 4, points: [
        { re: [/larger|greater|higher|increase|positive|proportional/], marks: 1, ok: 'Positive relationship.', miss: 'State: larger voltage, larger temperature rise.' },
        { re: [/reactiv.*(difference|apart|gap)|difference in reactiv|further apart/], marks: 1, ok: 'Reactivity difference.', miss: 'Both depend on how far apart the metals are in the reactivity series.' },
        { re: [/energy/], marks: 1, ok: 'Energy released.', miss: 'More energy is released, as heat in the cup or as electrical energy in the cell.' }] },
      { id: 'dncu', q: 'Predict the voltage of a zinc–copper cell from the data (E° Zn = −0.76 V, E° Cu = +0.34 V).', marks: 1, lines: 1, number: { value: 1.10, tol: 0.03, unit: 'V', dp: 2 } }
    ],
    evaluate: [
      { id: 'err', q: 'Give two reasons why the measured temperature rise is lower than the theoretical value, and an improvement for one.', marks: 3, lines: 4, points: [
        { re: [/heat (loss|lost)|surroundings|escape/], marks: 1, ok: 'Heat loss.', miss: 'Heat is lost to the surroundings.' },
        { re: [/cup|thermometer|incomplete|oxide|coat|slow|not all/], marks: 1, ok: 'A second reason.', miss: 'Some heat warms the cup and thermometer; an oxide coating slows the reaction.' },
        { re: [/lid|insulat|extrapolat|cooling curve|stir|powder|sand/], marks: 1, ok: 'An improvement.', miss: 'Use a lid and insulation, stir, and extrapolate a cooling curve.' }] },
      { id: 'lim', q: 'Give one simplification in this model.', marks: 1, lines: 2, points: [
        { re: [/standard|1 ?mol|concentration|70|fixed|no (internal )?resistance|ideal|instant|same efficiency/], marks: 1, ok: 'A valid simplification.', miss: 'For example: standard potentials are used at 0.50 mol/dm³, and the same 70 % of energy appears as heat.' }] }
    ],
    model: '<ul><li>Standard electrode potentials: Mg −2.37, Zn −0.76, Fe −0.44, Pb −0.13, Cu +0.34, Ag +0.80 V. Cell voltage = E°(B) − E°(A), reduced to 82 % when magnesium is used (oxide layer) and 97 % otherwise.</li>' +
      '<li>Temperature rise = 0.70 × n × F × ΔE × (0.0125 mol) ÷ (25 g × 4.18 J/g/°C), taking ΔH ≈ ΔG = −nFE and metal powder in excess.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var raf = 0, done = null;
    api.stage.innerHTML = '<svg viewBox="0 0 420 220" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Displacement in a cup and a cell with a salt bridge" id="ce-sv"></svg>';
    var sv = api.stage.querySelector('#ce-sv');
    function draw(f, r) {
      var v = api.vals(), A = MET[v.a], B = MET[v.b], h = '';
      // displacement cup
      var sol = r && r.react ? (v.b === 'Cu' ? 'rgb(' + Math.round(96 + 150 * f) + ',' + Math.round(165 + 80 * f) + ',' + Math.round(250 - 0 * f) + ')' : B[4]) : B[4];
      h += '<path d="M30,70 L42,190 L118,190 L130,70 Z" fill="#fff" stroke="#334155" stroke-width="2"/><path d="M34,100 L43,188 L117,188 L126,100 Z" fill="' + sol + '" stroke="none"/>';
      for (var i = 0; i < 18; i++) h += '<circle cx="' + (50 + (i * 11) % 60) + '" cy="' + (184 - (i % 3) * 3) + '" r="2.5" fill="' + (r && r.react && f > 0.3 && i % 2 ? B[3] : A[3]) + '"/>';
      var T = 20 + (r ? r.dT * f : 0); h += '<rect x="96" y="40" width="6" height="130" rx="3" fill="#fff" stroke="#334155"/><rect x="97" y="' + (160 - (T - 15) * 3) + '" width="4" height="' + ((T - 15) * 3 + 8) + '" fill="#ef4444"/>';
      h += '<text x="80" y="30" font-size="12" text-anchor="middle" font-weight="700">' + T.toFixed(1) + ' °C</text><text x="80" y="210" font-size="9" text-anchor="middle">' + A[0] + ' powder in ' + SALT[v.b] + '</text>';
      // cell
      h += '<rect x="200" y="110" width="70" height="80" fill="' + A[4] + '" stroke="#334155"/><rect x="320" y="110" width="70" height="80" fill="' + B[4] + '" stroke="#334155"/>';
      h += '<rect x="228" y="70" width="12" height="100" fill="' + A[3] + '" stroke="#334155"/><rect x="350" y="70" width="12" height="100" fill="' + B[3] + '" stroke="#334155"/>';
      h += '<path d="M250,120 q0,-40 45,-40 q45,0 45,40" fill="none" stroke="#fde68a" stroke-width="8"/><text x="295" y="72" font-size="9" text-anchor="middle">salt bridge</text>';
      h += '<path d="M234,70 L234,40 L280,40 M310,40 L356,40 L356,70" fill="none" stroke="#334155" stroke-width="2"/><circle cx="295" cy="40" r="15" fill="#fff" stroke="#334155" stroke-width="2"/><text x="295" y="44" font-size="11" text-anchor="middle" font-weight="700">V</text>';
      h += '<text x="295" y="18" font-size="12" text-anchor="middle" font-weight="700">' + (r ? (r.V * Math.min(1, f * 2)).toFixed(2) : '0.00') + ' V</text>';
      if (r && r.V > 0 && f > 0.3) for (var e = 0; e < 5; e++) { var p = ((performance.now() / 600 + e / 5) % 1), toRight = r.neg === v.a; var x = toRight ? 234 + p * 122 : 356 - p * 122; h += '<circle cx="' + x + '" cy="40" r="3" fill="#0072B2"/>'; }
      h += '<text x="234" y="205" font-size="9" text-anchor="middle">' + A[0] + '</text><text x="356" y="205" font-size="9" text-anchor="middle">' + B[0] + '</text>';
      sv.innerHTML = h;
    }
    function go() {
      cancelAnimationFrame(raf); var v = api.vals(), r = run(v), t0 = performance.now(); r.dT *= 1 + (Math.random() - 0.5) * 0.06; r.V *= 1 + (Math.random() - 0.5) * 0.02;
      api.enable('run', false); api.enable('rec', false);
      (function loop() { var f = Math.min(1, (performance.now() - t0) / 3500); draw(f, r);
        if (f < 1 || r.V > 0) raf = requestAnimationFrame(loop);
        if (f >= 1 && !done) { done = { v: v, r: r }; api.enable('run', true); api.enable('rec', true); api.readings([['Reaction', r.react ? 'yes' : 'no'], ['Temperature rise', r.dT.toFixed(1) + ' °C'], ['Cell voltage', r.V.toFixed(2) + ' V'], ['Negative electrode', MET[r.neg][0]]]); api.status(r.react ? A_(v) + ' displaces ' + MET[v.b][0].toLowerCase() + '. Press Record.' : 'No reaction: ' + MET[v.a][0].toLowerCase() + ' is less reactive. Press Record.'); }
      })();
    }
    function A_(v) { return MET[v.a][0]; }
    api.actions([
      { id: 'run', label: '▶ Run', main: true, fn: function () { done = null; go(); } },
      { id: 'rec', label: '➕ Record', fn: function () { if (!done) return; var v = done.v, r = done.r;
        api.record({ pair: MET[v.a][0] + ' in ' + SALT[v.b], react: r.react ? 'reacted' : 'no reaction', dT: +r.dT.toFixed(1), V: +r.V.toFixed(3), neg: v.a === v.b ? '—' : MET[r.neg][0] }); api.enable('rec', false); } }
    ]);
    api.onChange = function () { cancelAnimationFrame(raf); done = null; api.enable('run', true); api.enable('rec', false); draw(0, null); api.readings([['Metal A', MET[api.vals().a][0]], ['Solution', SALT[api.vals().b]]]); };
    api.onShow = function () { if (!done) draw(0, null); };
    api.status('Choose a metal and a solution, then press Run.');
    api.onChange();
  }
})();
