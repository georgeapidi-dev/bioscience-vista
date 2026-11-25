/* Chemical equilibrium laboratory: N₂O₄ ⇌ 2NO₂ and Le Châtelier's principle · VistaEd · by George Apidi */
(function () {
  var LABS = window.LABS = window.LABS || {}, R = 8.314, DH = 57200, K298 = 4.6e-3, N0 = 0.0100;   // ΔH forward (J/mol), Kc at 298 K (mol/dm³), mol of N₂O₄ put in
  function Kc(T) { return K298 * Math.exp(-DH / R * (1 / (T + 273.15) - 1 / 298.15)); }
  function eq(T, Vcm3) {   // equilibrium concentrations for N0 mol N₂O₄ in V
    var c0 = N0 / (Vcm3 / 1000), K = Kc(T), x = (-K / 2 + Math.sqrt(K * K / 4 + 4 * K * c0)) / 2;   // x = [NO2]
    return { K: K, no2: x, n2o4: c0 - x / 2, c0: c0, alpha: x / 2 / c0 };
  }
  function brown(no2) { var a = Math.min(1, no2 / 0.06); return 'rgba(' + Math.round(150 - 40 * a) + ',' + Math.round(75 - 30 * a) + ',' + Math.round(20) + ',' + (0.08 + 0.85 * a).toFixed(2) + ')'; }
  LABS.equilibrium = {
    id: 'equilibrium', title: 'Chemical equilibrium laboratory: Le Châtelier\'s principle',
    tags: ['Chemistry', 'Equilibrium', 'MYP 5', 'IB DP R2.3', 'IGCSE', 'A Level'],
    background: '<p>Dinitrogen tetroxide (colourless) and nitrogen dioxide (brown) reach a <b>dynamic equilibrium</b> in a sealed syringe: N₂O₄(g) ⇌ 2NO₂(g), ΔH = +57.2 kJ/mol. At equilibrium the forward and backward rates are equal and the concentrations stay constant.</p>' +
      '<p>The <b>equilibrium constant</b> K<sub>c</sub> = [NO₂]² ÷ [N₂O₄]. It changes only with <b>temperature</b>.</p>' +
      '<p><b>Le Châtelier\'s principle:</b> if a system at equilibrium is disturbed, the position of equilibrium shifts to oppose the change. Heating favours the endothermic direction; increasing the pressure (smaller volume) favours the side with fewer gas molecules.</p>' +
      '<p>The brown colour shows the concentration of NO₂, so a colorimeter (absorbance) or the eye can follow the shifts.</p>',
    objectives: ['Explain dynamic equilibrium and write the expression for Kc.', 'Use Le Châtelier\'s principle to predict the effect of temperature and pressure.', 'Calculate Kc from equilibrium concentrations and show it is constant at a fixed temperature.', 'Deduce the sign of ΔH from how Kc changes with temperature.'],
    rq: 'How do temperature and pressure (volume) affect the position of the N₂O₄ ⇌ 2NO₂ equilibrium and the value of Kc?',
    hypPrompt: 'Predict what happens to the brown colour when the syringe is heated, and when it is pushed in to a smaller volume. Explain each using Le Châtelier\'s principle.',
    hypothesis: { marks: 3, points: [
      { re: [/heat.*(darker|more brown|more no2|right|forward)|darker.*heat|endotherm/], marks: 1, ok: 'Heating: darker (endothermic forward).', miss: 'Predict heating: equilibrium shifts in the endothermic direction (forward), so more brown NO₂.' },
      { re: [/(press|volume|push|compress).*(fewer|less).*(molecule|mole|particle)|fewer (gas )?(molecules|moles)|left|n2o4/], marks: 1, ok: 'Pressure: shifts to fewer molecules.', miss: 'Predict pressure: equilibrium shifts to the side with fewer gas molecules (N₂O₄).' },
      { re: [/oppos|counteract|minimi[sz]e|reduce the (change|effect)/], marks: 1, ok: 'Le Châtelier stated.', miss: 'State the principle: the equilibrium shifts to oppose the change.' }] },
    variables: { iv: 'temperature (°C) and volume of the syringe (cm³)', dv: 'equilibrium concentrations of NO₂ and N₂O₄ (from the absorbance), and Kc',
      cv: ['total amount of gas (0.0100 mol of N₂O₄ put in)', 'the syringe is sealed', 'wait for equilibrium before each reading'] },
    apparatus: ['Sealed gas syringe containing NO₂/N₂O₄ (prepared by the teacher)', 'Water baths: ice, room temperature, hot', 'Thermometer', 'Colorimeter with blue filter (or a white tile to compare colours)'],
    safety: ['Nitrogen dioxide is very toxic. In school this is a teacher demonstration in a sealed syringe in a fume cupboard; this lab lets you do it safely.', 'Take care with hot water baths.'],
    method: ['Choose a temperature and a volume.', 'Press <b>Set and wait</b>. Watch the colour change at once (the volume change) and then shift as equilibrium is restored.', 'Read the equilibrium concentrations and Kc, then press <b>Record trial</b>.', 'Keep the temperature the same and change the volume (pressure). Then keep the volume the same and change the temperature.'],
    controls: [
      { id: 'T', label: 'Temperature', type: 'range', min: 0, max: 100, step: 5, value: 25, unit: '°C' },
      { id: 'V', label: 'Syringe volume', type: 'range', min: 20, max: 100, step: 10, value: 60, unit: 'cm³' }
    ],
    columns: [
      { key: 'T', label: 'Temperature', unit: '°C', dp: 0, group: true }, { key: 'V', label: 'Volume', unit: 'cm³', dp: 0 },
      { key: 'no2', label: '[NO₂]', unit: 'mol/dm³', dp: 4 }, { key: 'n2o4', label: '[N₂O₄]', unit: 'mol/dm³', dp: 4 }, { key: 'pct', label: 'N₂O₄ dissociated', unit: '%', dp: 1 }, { key: 'Kc', label: 'Kc (calculated)', unit: 'mol/dm³', dp: 5 }, { key: 'colour', label: 'Colour', num: false }
    ],
    graph: { x: 'T', y: 'Kc', group: '' },
    hints: ['Kc = [NO₂]² ÷ [N₂O₄]. Calculate it from your two concentrations and compare with the table.', 'At a fixed temperature, Kc should stay the same at every volume, even though the concentrations change.', 'If Kc gets bigger as the temperature rises, the forward reaction is endothermic.', 'Right after you push the syringe in, everything is more concentrated, so it looks darker; then the colour fades a little as the equilibrium shifts left.'],
    analyse: [
      { id: 'kc', q: 'Use one of your trials to calculate Kc. Show the expression and your working.', marks: 2, lines: 4,
        check: function (ans, ctx) {
          var a = String(ans).toLowerCase(), s = 0, fb = [], nums = (a.match(/\d*\.\d+(e-?\d+)?|\d+(e-?\d+)?/g) || []).map(Number), t = ctx.trials;
          if (!t.length) return { score: 0, fb: 'Record a trial first.' };
          if (/\[?no2\]? ?(\^ ?2|²|squared)|no₂\]?²/.test(a) || /squared/.test(a)) { s++; fb.push('✓ Expression [NO₂]² ÷ [N₂O₄].'); } else fb.push('➜ Write Kc = [NO₂]² ÷ [N₂O₄].');
          if (t.some(function (r) { return nums.some(function (v) { return Math.abs(v - r.Kc) <= r.Kc * 0.06; }); })) { s++; fb.push('✓ Value matches one of your trials.'); } else fb.push('➜ Square [NO₂], divide by [N₂O₄], and compare with the Kc column.');
          return { score: s, fb: fb.join('<br>') };
        } },
      { id: 'press', q: 'At a fixed temperature, what happened to the colour and to Kc when you reduced the volume? Explain.', marks: 3, lines: 4, points: [
        { re: [/(kc|constant).*(same|unchanged|constant|did not change)|same kc|kc (stays|stayed|remain)/], marks: 1, ok: 'Kc unchanged.', miss: 'State that Kc stayed the same (it depends only on temperature).' },
        { re: [/fewer|less (gas )?(molecules|moles)|left|towards n2o4|n₂o₄/], marks: 1, ok: 'Shift to fewer molecules (left).', miss: 'Explain the shift: towards N₂O₄, the side with fewer gas molecules (1 vs 2).' },
        { re: [/darker.*(then|first)|first.*darker|immediately|initially|lighter|fade|percentage|proportion/], marks: 1, ok: 'Described the colour change.', miss: 'Describe the colour: darker at first (more concentrated), then a little lighter as it shifts left; a smaller % of N₂O₄ is dissociated.' }] },
      { id: 'dh', q: 'How does Kc change with temperature? What does this tell you about ΔH for the forward reaction?', marks: 2, lines: 3, points: [
        { re: [/increas|bigger|larger|rises/], marks: 1, ok: 'Kc increases with temperature.', miss: 'Describe: Kc increases as temperature increases.' },
        { re: [/endotherm|positive|\+/], marks: 1, ok: 'Forward reaction endothermic.', miss: 'Conclude: the forward reaction is endothermic (ΔH positive).' }] }
    ],
    evaluate: [
      { id: 'dyn', q: 'Explain why the equilibrium is described as dynamic, even though the colour stops changing.', marks: 2, lines: 3, points: [
        { re: [/both (directions|reactions)|forward and (backward|reverse)|still (react|happening)/], marks: 1, ok: 'Both reactions continue.', miss: 'Say that the forward and backward reactions both continue.' },
        { re: [/same rate|equal rate|rates? (are )?equal/], marks: 1, ok: 'At equal rates.', miss: 'Add: at equal rates, so concentrations stay constant.' }] },
      { id: 'lim', q: 'Give one simplification in this model.', marks: 1, lines: 2, points: [
        { re: [/ideal|instant|kp|pressure|temperature (of the gas|change)|van|δh constant|dh constant|constant δh|colour|absorb|concentration not activit|activit/], marks: 1, ok: 'A valid simplification.', miss: 'For example: ΔH is taken as constant with temperature and the gases behave ideally.' }] }
    ],
    model: '<ul><li>K<sub>c</sub>(T) = 4.6 × 10⁻³ mol/dm³ × e<sup>−ΔH/R (1/T − 1/298 K)</sup>, with ΔH = +57.2 kJ/mol taken as constant (van \'t Hoff).</li><li>0.0100 mol of N₂O₄ is put in. With x = [NO₂], K<sub>c</sub> = x² ÷ (c₀ − x/2), solved exactly as a quadratic.</li>' +
      '<li>The brown colour is drawn from [NO₂]. Concentrations are used instead of activities, and the gases are ideal. Each reading has about ±1 % random error.</li><li>When you change the volume, the colour first changes as all concentrations change, then relaxes to the new equilibrium over a few seconds.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var raf = 0, cur = null, now = null;
    api.stage.innerHTML = '<svg id="eq-sv" viewBox="0 0 440 170" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Sealed gas syringe of nitrogen dioxide"></svg><canvas class="vl-chart" id="eq-ch" style="height:220px;margin-top:8px"></canvas>';
    var sv = api.stage.querySelector('#eq-sv'), ch = api.stage.querySelector('#eq-ch'), hist = [];
    function draw(st, T, V) {
      var len = 40 + V * 2.6, h = '';
      var bath = T <= 5 ? '#dbeafe' : T >= 60 ? '#fee2e2' : '#f1f5f9';
      h += '<rect x="10" y="20" width="420" height="120" rx="12" fill="' + bath + '"/><text x="20" y="38" font-size="11" fill="#475569">' + (T <= 5 ? 'Ice bath' : T >= 60 ? 'Hot water bath' : 'Water bath') + ' · ' + T + ' °C</text>';
      h += '<rect x="40" y="60" width="300" height="50" rx="6" fill="#fff" stroke="#334155" stroke-width="2"/><rect x="42" y="62" width="' + len + '" height="46" fill="' + brown(st.no2) + '"/>';
      h += '<rect x="' + (42 + len) + '" y="56" width="8" height="58" fill="#334155"/><rect x="' + (50 + len) + '" y="80" width="' + (330 - len) + '" height="10" fill="#94a3b8"/><rect x="' + (378) + '" y="66" width="10" height="38" fill="#334155"/><rect x="30" y="78" width="12" height="14" fill="#334155"/>';
      var nN = Math.round(st.no2 / (st.no2 + st.n2o4) * 18), nD = 18 - nN;
      for (var i = 0; i < 18; i++) { var x = 52 + (i * 53) % Math.max(20, len - 20), y = 70 + (i * 17) % 32; h += i < nN ? '<circle cx="' + x + '" cy="' + y + '" r="4" fill="#92400e"/>' : '<g fill="#cbd5e1" stroke="#64748b"><circle cx="' + (x - 3) + '" cy="' + y + '" r="3.5"/><circle cx="' + (x + 3) + '" cy="' + y + '" r="3.5"/></g>'; }
      h += '<text x="220" y="158" font-size="12" text-anchor="middle">' + V + ' cm³ · [NO₂] ' + st.no2.toFixed(4) + ' · [N₂O₄] ' + st.n2o4.toFixed(4) + ' mol/dm³</text>';
      sv.innerHTML = h;
    }
    function chart() { api.chart(ch, { xLabel: 'Time / s', yLabel: 'Concentration / mol dm⁻³', xmin: 0, xmax: Math.max(10, hist.length ? hist[hist.length - 1][0] : 10), ymin: 0,
      series: [{ name: '[NO₂]', pts: hist.map(function (h) { return [h[0], h[1]]; }), color: '#D55E00' }, { name: '[N₂O₄]', pts: hist.map(function (h) { return [h[0], h[2]]; }), color: '#0072B2' }] }); }
    function settle() {
      cancelAnimationFrame(raf);
      var v = api.vals(), target = eq(v.T, v.V), from = now ? { no2: now.no2 * (now.V / v.V), n2o4: now.n2o4 * (now.V / v.V) } : target, t0 = performance.now(), tStart = hist.length ? hist[hist.length - 1][0] : 0;
      if (!now) hist = [];
      api.enable('set', false); api.enable('rec', false); api.status(now && now.V !== v.V ? 'Volume changed: every concentration jumps at once, then the equilibrium shifts…' : 'The equilibrium is shifting…');
      (function loop() {
        var s = Math.min(1, (performance.now() - t0) / 4000), e = 1 - Math.exp(-5 * s), st = { no2: from.no2 + (target.no2 - from.no2) * e, n2o4: from.n2o4 + (target.n2o4 - from.n2o4) * e };
        draw(st, v.T, v.V); hist.push([+(tStart + s * 20).toFixed(2), st.no2, st.n2o4]); if (hist.length > 600) hist.shift(); chart();
        api.readings([['Temperature', v.T + ' °C'], ['Volume', v.V + ' cm³'], ['[NO₂]', st.no2.toFixed(4)], ['[N₂O₄]', st.n2o4.toFixed(4)], ['Qc now', (st.no2 * st.no2 / st.n2o4).toExponential(2)], ['Kc at ' + v.T + ' °C', target.K.toExponential(2)]]);
        if (s < 1) raf = requestAnimationFrame(loop);
        else { now = { no2: target.no2, n2o4: target.n2o4, V: v.V }; cur = { v: v, e: target }; api.enable('set', true); api.enable('rec', true); api.status('At equilibrium: Qc = Kc. Press Record trial.'); }
      })();
    }
    api.actions([
      { id: 'set', label: '⏱ Set and wait', main: true, fn: settle },
      { id: 'rec', label: '➕ Record trial', fn: function () {
        if (!cur) return; var e = cur.e, n = function (x) { return x * (1 + (Math.random() - .5) * 0.02); }, a = n(e.no2), b = n(e.n2o4);
        api.record({ T: cur.v.T, V: cur.v.V, no2: +a.toFixed(4), n2o4: +b.toFixed(4), pct: +(e.alpha * 100).toFixed(1), Kc: +(a * a / b).toFixed(5), colour: e.no2 > 0.04 ? 'dark brown' : e.no2 > 0.02 ? 'brown' : e.no2 > 0.008 ? 'pale brown' : 'almost colourless' });
        api.enable('rec', false);
      } },
      { id: 'reset', label: '↺ New syringe', fn: function () { now = null; cur = null; hist = []; settle(); } }
    ]);
    api.onChange = function () { cur = null; api.enable('rec', false); api.status('Conditions changed. Press Set and wait.'); };
    api.onShow = function () { if (!now) settle(); };
    settle();
  }
})();
