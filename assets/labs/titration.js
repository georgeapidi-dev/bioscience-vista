/* Acid–base titration laboratory · Learnova · by Learnova */
(function () {
  var M = window.LABM, LABS = window.LABS = window.LABS || {};
  LABS.titration = {
    id: 'titration', title: 'Acid–base titration laboratory',
    tags: ['Chemistry', 'Acids and bases', 'MYP 4–5', 'IB DP R3.1', 'IGCSE', 'A Level'],
    background: '<p>In a <b>titration</b> a solution of known concentration (the titrant, in the burette) is added to a measured volume of another solution until they have exactly reacted. This is the <b>equivalence point</b>. For an acid and an alkali: H⁺(aq) + OH⁻(aq) → H₂O(l).</p>' +
      '<p>The <b>pH curve</b> shows pH against the volume of titrant added. Near equivalence the pH changes very sharply: one drop can change it by several units.</p>' +
      '<p>A <b>strong acid</b> (hydrochloric acid) is fully ionised; a <b>weak acid</b> (ethanoic acid) is only partly ionised, so it starts at a higher pH and gives a buffer region. Halfway to equivalence, pH = pK<sub>a</sub> of the weak acid.</p>' +
      '<p>An <b>indicator</b> changes colour over a pH range. Choose one whose range lies inside the steep part of the curve: phenolphthalein (8.2–10.0) for weak acid + strong base, methyl orange (3.1–4.4) for strong acid + weak base.</p>' +
      '<p>From the titre: moles of base = concentration × volume; for a 1 : 1 reaction, moles of acid = moles of base, so acid concentration = moles ÷ volume of acid.</p>',
    objectives: ['Carry out a titration and record pH against volume added.', 'Identify the equivalence point from the steepest part of a pH curve.', 'Calculate an unknown concentration from a titre.', 'Choose a suitable indicator and find pKa from a weak-acid curve.'],
    rq: 'What is the concentration of the unknown hydrochloric acid, found by titration with 0.100 mol/dm³ sodium hydroxide? (Then compare the pH curves of strong and weak acids and bases.)',
    hypPrompt: 'Predict the shape of the pH curve when sodium hydroxide is added to hydrochloric acid, and where the equivalence point will be.',
    hypothesis: { marks: 3, points: [
      { re: [/low|acidic|ph ?(of )?1|starts? (at|low)/], marks: 1, ok: 'You predict a low starting pH.', miss: 'Say what the pH is at the start (low, about 1).' },
      { re: [/sharp|steep|sudden|rapid|jump/], marks: 1, ok: 'You predict a sharp rise at equivalence.', miss: 'Predict the sudden steep rise near equivalence.' },
      { re: [/\b7\b|neutral|equivalence|equal (moles|amounts)/], marks: 1, ok: 'You place the equivalence point.', miss: 'Say where the equivalence point is (pH 7 for strong acid + strong base).' }] },
    variables: { iv: 'volume of sodium hydroxide added (cm³)', dv: 'pH of the mixture in the flask',
      cv: ['volume of acid in the flask (25.0 cm³, by pipette)', 'concentration of the sodium hydroxide (0.100 mol/dm³)', 'temperature (25 °C)', 'the same indicator throughout'] },
    apparatus: ['50 cm³ burette, clamp and stand', '25.0 cm³ pipette and filler', 'Conical flask on a white tile', 'pH meter (calibrated) and/or indicator', 'Funnel (remove before titrating)', 'Solutions: hydrochloric acid, ethanoic acid, sodium hydroxide, ammonia'],
    safety: ['Wear eye protection: sodium hydroxide is corrosive to eyes, even when dilute.', 'Use a pipette filler; never pipette by mouth.', 'Fill the burette below eye level and remove the funnel.', 'Ammonia solution has an irritating vapour: work in a well-ventilated room.'],
    method: ['Choose the acid, its concentration (start with <b>Unknown</b>) and the base. Choose an indicator.', 'Press <b>Add</b> buttons to run base from the burette into the flask. Add 1 cm³ portions at first, then single drops (0.05 cm³) near the colour change.', 'After each addition press <b>Record reading</b> to save the burette volume and pH.', 'Find the equivalence point (the steepest part of the curve). Note the titre.', 'Press <b>New titration</b> to repeat, or to compare a weak acid or weak base.'],
    controls: [
      { id: 'acid', label: 'Acid in the flask (25.0 cm³)', type: 'select', value: 'HCl', options: [['HCl', 'Hydrochloric acid (strong)'], ['CH3COOH', 'Ethanoic acid (weak)']] },
      { id: 'Ca', label: 'Acid concentration', type: 'select', value: 'unknown', options: [['unknown', 'Unknown (find it!)'], ['0.050', '0.050 mol/dm³'], ['0.100', '0.100 mol/dm³'], ['0.200', '0.200 mol/dm³']] },
      { id: 'base', label: 'Base in the burette', type: 'select', value: 'NaOH', options: [['NaOH', 'Sodium hydroxide (strong)'], ['NH3', 'Ammonia (weak)']] },
      { id: 'Cb', label: 'Base concentration', type: 'select', value: '0.100', options: [['0.050', '0.050 mol/dm³'], ['0.100', '0.100 mol/dm³'], ['0.200', '0.200 mol/dm³']] },
      { id: 'ind', label: 'Indicator', type: 'select', value: 'phenolphthalein', options: [['phenolphthalein', 'Phenolphthalein (8.2–10.0)'], ['methylorange', 'Methyl orange (3.1–4.4)'], ['bromothymol', 'Bromothymol blue (6.0–7.6)'], ['none', 'None (pH meter only)']] }
    ],
    columns: [
      { key: 'run', label: 'Titration', num: false, group: true }, { key: 'acid', label: 'Acid', num: false }, { key: 'Ca', label: 'Acid conc.', num: false },
      { key: 'base', label: 'Base', num: false }, { key: 'Cb', label: 'Base conc.', unit: 'mol/dm³', dp: 3 }, { key: 'V', label: 'Volume of base added', unit: 'cm³', dp: 2 },
      { key: 'pH', label: 'pH', dp: 2 }, { key: 'colour', label: 'Indicator colour', num: false }
    ],
    graph: { x: 'V', y: 'pH', group: 'run' },
    hints: ['Add 1.00 cm³ at a time until the pH starts to change faster, then switch to drops (0.05 cm³).', 'The equivalence point is in the middle of the steep rise. Record many readings there.', 'Concentration of acid = (concentration of base × titre) ÷ 25.0 cm³ for a 1 : 1 reaction.', 'For ethanoic acid, read the pH at half the equivalence volume: that is the pKa.'],
    analyse: [
      { id: 'veq', q: 'What volume of base was needed to reach the equivalence point (the titre) in your unknown-acid titration?', marks: 1, lines: 1,
        number: { value: function (c) { return state.unknownTitre(); }, abs: 0.4, tol: 0, unit: 'cm³', dp: 2, missing: 'Do a titration of the unknown acid first.' } },
      { id: 'conc', q: 'Calculate the concentration of the unknown hydrochloric acid. Show your working.', marks: 3, lines: 4,
        check: function (ans, c) {
          var want = state.unknownCa, a = String(ans).toLowerCase(), nums = (a.match(/\d+\.\d+|\d+/g) || []).map(Number);
          if (!state.unknownTitre()) return { score: 0, fb: 'Do a titration of the unknown acid first.' };
          var final = nums.filter(function (v) { return v > 0.01 && v < 1; }), ok = final.some(function (v) { return Math.abs(v - want) <= want * 0.04; }), s = 0, fb = [];
          if (/mol|moles|×|x|\*/.test(a)) { s++; fb.push('✓ Working shown (moles of base).'); } else fb.push('➜ Show moles of NaOH = concentration × volume (in dm³).');
          if (/1 ?: ?1|same|equal|ratio/.test(a)) { s++; fb.push('✓ 1 : 1 ratio used.'); } else fb.push('➜ State that the reaction is 1 : 1, so moles of acid = moles of base.');
          if (ok) { s++; fb.push('✓ Correct: about ' + want.toFixed(3) + ' mol/dm³.'); } else fb.push('➜ Check the final value: divide moles by 0.0250 dm³.');
          return { score: s, fb: fb.join('<br>') };
        } },
      { id: 'pka', q: 'Titrate ethanoic acid with sodium hydroxide. What is the pH at half the equivalence volume? What does it tell you?', marks: 2, lines: 3,
        check: function (ans) { var a = String(ans).toLowerCase(), m = a.match(/\d+(\.\d+)?/g) || [], s = 0, fb = [];
          if (m.some(function (v) { return Math.abs(+v - 4.76) <= 0.2; })) { s++; fb.push('✓ About 4.76.'); } else fb.push('➜ Read the pH at half the equivalence volume (about 4.8).');
          if (/pka|dissociation constant|ka/.test(a)) { s++; fb.push('✓ It equals the pKa.'); } else fb.push('➜ At half-equivalence [HA] = [A⁻], so pH = pKa.');
          return { score: s, fb: fb.join('<br>') }; } },
      { id: 'ind', q: 'Which indicator would be unsuitable for titrating ethanoic acid with sodium hydroxide? Explain using your pH curve.', marks: 2, lines: 3, points: [
        { re: [/methyl orange/], marks: 1, ok: 'Methyl orange is unsuitable.', miss: 'Name the unsuitable indicator: methyl orange.' },
        { re: [/(range|changes?).*(not|outside|before|below).*(steep|vertical|equivalence)|steep.*(above|between 7|7 (and|to) 11|8.*10)|equivalence.*(above 7|about 8|8\.\d|9)/], marks: 1, ok: 'Explained with the steep region.', miss: 'Explain: its range (3.1–4.4) is below the steep part of the curve (about pH 7–11), so it changes too early.' }] }
    ],
    evaluate: [
      { id: 'drop', q: 'Why should you add the base drop by drop near the end point?', marks: 1, lines: 2, points: [
        { re: [/overshoot|go past|sharp|one drop|accura|precis|exact/], marks: 1, ok: 'Avoids overshooting the end point.', miss: 'One drop can change the pH by several units, so you could overshoot.' }] },
      { id: 'conc2', q: 'Real titrations are repeated until two titres agree within 0.10 cm³. Why?', marks: 2, lines: 3, points: [
        { re: [/concordant|agree|consistent|reliab|repeat/], marks: 1, ok: 'Concordant results show reliability.', miss: 'Concordant titres show the result is reliable.' },
        { re: [/mean|average|anomal|rough|random/], marks: 1, ok: 'Mean of concordant titres reduces random error.', miss: 'Take the mean of the concordant titres to reduce random error.' }] },
      { id: 'lim', q: 'Give one simplification in this model compared with a real titration.', marks: 1, lines: 2, points: [
        { re: [/temperature|activity|ideal|heat|meniscus|reading|parallax|calibrat|carbon dioxide|co2|drop size|instant|mix|swirl/], marks: 1, ok: 'A valid simplification.', miss: 'For example: the model assumes ideal solutions at 25 °C and perfect mixing.' }] }
    ],
    model: '<ul><li>pH is calculated exactly from the <b>charge balance</b> of the mixture: [H⁺] + [Na⁺] + [NH₄⁺] = [OH⁻] + [Cl⁻] + [CH₃COO⁻], solved numerically for [H⁺].</li>' +
      '<li>Constants at 25 °C: K<sub>w</sub> = 1.0 × 10⁻¹⁴, K<sub>a</sub>(ethanoic acid) = 1.74 × 10⁻⁵ (pK<sub>a</sub> 4.76), K<sub>b</sub>(ammonia) = 1.78 × 10⁻⁵.</li>' +
      '<li>Concentrations are used instead of activities (fine for dilute solutions). Volumes add exactly; mixing is instant; temperature stays at 25 °C (the reaction gives out a little heat in reality).</li>' +
      '<li>Indicator colours change gradually across each indicator\'s published range. The pH meter reading has a ±0.01 random error.</li>' +
      '<li>The unknown acid has a concentration between 0.060 and 0.150 mol/dm³, chosen at random for each new titration.</li></ul>',
    setup: setup
  };
  var state = { unknownCa: null, runs: [], unknownTitre: function () { return null; } };

  function setup(api) {
    var fx = api.fx, Va = 25.0, Vb = 0, run = 0, readings = [], cur = null;
    api.stage.innerHTML = '<div style="display:grid;grid-template-columns:200px 1fr;gap:10px;align-items:start"><svg id="ti-sv" viewBox="0 0 200 330" style="width:100%;height:auto" role="img" aria-label="Burette and conical flask"></svg>' +
      '<div><canvas class="vl-chart" id="ti-ch" style="height:260px"></canvas><div class="vl-btns" style="margin-top:6px" id="ti-add"></div></div></div>';
    var sv = api.stage.querySelector('#ti-sv'), ch = api.stage.querySelector('#ti-ch');
    api.stage.querySelector('#ti-add').innerHTML = [[0.05, '1 drop (0.05)'], [0.1, '+0.10'], [0.5, '+0.50'], [1, '+1.00'], [5, '+5.00']].map(function (a) { return '<button type="button" class="vl-btn" data-add="' + a[0] + '">' + a[1] + ' cm³</button>'; }).join('');
    api.stage.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () { add(+b.getAttribute('data-add')); }; });
    function conf() {
      var v = api.vals(), Ca = v.Ca === 'unknown' ? state.unknownCa : +v.Ca;
      return { acid: v.acid, Ca: Ca, base: v.base, Cb: +v.Cb, ind: v.ind, unknown: v.Ca === 'unknown' };
    }
    function newRun() {
      run++; Vb = 0; readings = [];
      if (api.vals().Ca === 'unknown') state.unknownCa = Math.round((0.06 + Math.random() * 0.09) * 1000) / 1000;
      cur = conf(); cur.name = 'T' + run + ' ' + (cur.acid === 'HCl' ? 'HCl' : 'CH₃COOH') + '/' + cur.base + (cur.unknown ? ' (unknown)' : '');
      draw(); api.status('New titration: 25.0 cm³ of ' + M.ACIDS[cur.acid].name + ' in the flask. Burette reads 0.00 cm³.');
    }
    function pH() { return M.titrationPH(cur.acid, cur.Ca, Va, cur.base, cur.Cb, Vb); }
    function colourName(p) {
      var d = M.INDICATORS[cur.ind]; if (cur.ind === 'none') return '—';
      var f = (p - d.lo) / (d.hi - d.lo), names = { phenolphthalein: ['colourless', 'pale pink', 'pink'], methylorange: ['red', 'orange', 'yellow'], bromothymol: ['yellow', 'green', 'blue'] }[cur.ind];
      return f <= 0.1 ? names[0] : f >= 0.9 ? names[2] : names[1];
    }
    function draw() {
      var p = pH(), col = M.indicatorColour(cur.ind, p), lvl = 30 + Vb / 50 * 200;
      var h = '<rect x="88" y="10" width="24" height="230" rx="3" fill="#fff" stroke="#334155" stroke-width="2"/>' +
        '<rect x="90" y="' + Math.min(238, lvl) + '" width="20" height="' + Math.max(0, 238 - lvl) + '" fill="#dbeafe"/>';
      for (var i = 0; i <= 50; i += 5) h += '<line x1="88" y1="' + (30 + i * 4) + '" x2="' + (i % 10 ? 96 : 100) + '" y2="' + (30 + i * 4) + '" stroke="#334155"/>' + (i % 10 ? '' : '<text x="84" y="' + (34 + i * 4) + '" font-size="9" text-anchor="end">' + i + '</text>');
      h += '<path d="M96,240 l0,14 l4,8 l4,-8 l0,-14" fill="#e5e7eb" stroke="#334155"/><rect x="104" y="244" width="14" height="5" fill="#64748b"/>' +
        '<path d="M70,270 l0,-6 l60,0 l0,6 l20,46 q2,8 -8,8 l-84,0 q-10,0 -8,-8 z" fill="#fff" stroke="#334155" stroke-width="2"/>' +
        '<path d="M58,300 l84,0 l6,14 q2,8 -8,8 l-80,0 q-10,0 -8,-8 z" fill="' + col + '" stroke="none"/>' +
        '<rect x="132" y="150" width="62" height="40" rx="6" fill="#0f172a"/><text x="163" y="168" font-size="10" fill="#94a3b8" text-anchor="middle">pH</text><text x="163" y="184" font-size="15" fill="#22c55e" text-anchor="middle" font-family="monospace">' + (p + (Math.random() - .5) * 0.02).toFixed(2) + '</text>' +
        '<path d="M150,190 q-10,60 -30,110" stroke="#334155" fill="none" stroke-width="1.5"/>' +
        '<text x="100" y="8" font-size="10" text-anchor="middle">' + Vb.toFixed(2) + ' cm³ added</text>';
      sv.innerHTML = h;
      var pts = readings.map(function (r) { return [r.V, r.pH]; }), prev = api.trials().filter(function (t) { return t.run !== cur.name; }), groups = {};
      prev.forEach(function (t) { (groups[t.run] = groups[t.run] || []).push([t.V, t.pH]); });
      var series = Object.keys(groups).slice(-3).map(function (k) { return { name: k, pts: groups[k].sort(function (a, b) { return a[0] - b[0]; }), color: '#cbd5e1', dots: false }; });
      series.push({ name: cur.name + ' (this titration)', pts: pts, dots: true, color: '#0072B2' });
      api.chart(ch, { xLabel: 'Volume of base added / cm³', yLabel: 'pH', xmin: 0, xmax: Math.max(50, Vb + 2), ymin: 0, ymax: 14, series: series });
      api.readings([['Burette', Vb.toFixed(2) + ' cm³'], ['pH', p.toFixed(2)], ['Indicator', colourName(p)], ['Acid', cur.unknown ? 'unknown conc.' : cur.Ca.toFixed(3) + ' mol/dm³'], ['Base', cur.Cb.toFixed(3) + ' mol/dm³'], ['Readings', readings.length]]);
    }
    function add(v) { if (Vb + v > 50.0001) { api.status('The burette only holds 50 cm³. Press New titration to refill.'); return; } Vb = Math.round((Vb + v) * 100) / 100; draw(); }
    function rec() {
      var p = +(pH() + (Math.random() - .5) * 0.02).toFixed(2), row = { run: cur.name, acid: M.ACIDS[cur.acid].name.split(' (')[0], Ca: cur.unknown ? 'unknown' : cur.Ca.toFixed(3), base: M.BASES[cur.base].name.split(' (')[0], Cb: cur.Cb, V: Vb, pH: p, colour: colourName(p), _unknownCa: cur.unknown ? cur.Ca : null };
      readings.push(row); api.record(row); draw();
    }
    state.unknownTitre = function () {   // the true titre of the most recent unknown titration that the student actually ran past equivalence
      var t = api.trials().filter(function (r) { return r.Ca === 'unknown' && r._unknownCa; }); if (!t.length) return null;
      var lastRun = t[t.length - 1].run, rows = t.filter(function (r) { return r.run === lastRun; }), ca = rows[0]._unknownCa, cb = rows[0].Cb;
      state.unknownCa = ca; var veq = ca * Va / cb;
      return rows.some(function (r) { return r.V >= veq; }) ? veq : null;
    };
    api.actions([
      { id: 'rec', label: '➕ Record reading', main: true, fn: rec },
      { id: 'new', label: '↺ New titration', fn: newRun }
    ]);
    api.onChange = function (v, id) { if (id) newRun(); };
    newRun();
  }
})();
