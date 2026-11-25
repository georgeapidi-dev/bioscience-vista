/* Enthalpy of combustion laboratory: burning alcohols · VistaEd · by George Apidi */
(function () {
  var LABS = window.LABS = window.LABS || {};
  // name, formula, carbons, molar mass (g/mol), data-book ΔcH (kJ/mol)
  var ALC = { methanol: ['Methanol', 'CH₃OH', 1, 32.04, -726], ethanol: ['Ethanol', 'C₂H₅OH', 2, 46.07, -1367], propanol: ['Propan-1-ol', 'C₃H₇OH', 3, 60.10, -2021], butanol: ['Butan-1-ol', 'C₄H₉OH', 4, 74.12, -2676], pentanol: ['Pentan-1-ol', 'C₅H₁₁OH', 5, 88.15, -3329] };
  var EFF = { none: ['No shield, no lid', 0.42], shield: ['Draught shield', 0.55], both: ['Draught shield and lid', 0.66] };
  LABS.calorimetry = {
    id: 'calorimetry', title: 'Enthalpy of combustion laboratory: burning alcohols',
    tags: ['Chemistry', 'Energetics', 'MYP 4–5', 'IB DP R1.1', 'IGCSE', 'A Level'],
    background: '<p>When a fuel burns, energy is transferred to the surroundings: combustion is <b>exothermic</b> and ΔH is negative. The <b>standard enthalpy of combustion</b>, Δ<sub>c</sub>H°, is the enthalpy change when one mole of a substance burns completely in oxygen under standard conditions.</p>' +
      '<p>In a <b>calorimetry</b> experiment a spirit burner heats a known mass of water in a copper can. The energy absorbed by the water is <b>Q = m c ΔT</b> (m in g, c = 4.18 J g⁻¹ K⁻¹, ΔT in K). Dividing by the moles of alcohol burned gives ΔH = −Q ÷ n.</p>' +
      '<p>Each extra CH₂ group in the homologous series adds about −650 kJ/mol to the enthalpy of combustion (one more C–C and two more C–H bonds broken, more C=O and O–H bonds made). Experimental values are always less exothermic than data-book values, mainly because heat is lost to the surroundings.</p>',
    objectives: ['Measure the energy released when an alcohol burns, using Q = mcΔT.', 'Calculate an experimental enthalpy of combustion in kJ/mol.', 'Find the trend in ΔcH along the homologous series of alcohols.', 'Evaluate heat loss and incomplete combustion as systematic errors, and improve the method.'],
    rq: 'How does the number of carbon atoms in an alcohol affect its enthalpy of combustion?',
    hypPrompt: 'Predict how the enthalpy of combustion changes from methanol to pentan-1-ol, and give a reason based on bonds.',
    hypothesis: { marks: 3, points: [
      { re: [/more (negative|exotherm|energy|heat)|increas|larger|bigger/], marks: 1, ok: 'More exothermic with more carbons.', miss: 'Predict the direction: more carbon atoms, more negative (more energy released).' },
      { re: [/bond/], marks: 1, ok: 'You reason with bonds.', miss: 'Use bonds: more bonds are broken and made.' },
      { re: [/ch2|constant|same amount|regular|linear|about 6[0-9]0|each (extra )?carbon/], marks: 1, ok: 'Regular increase per CH₂.', miss: 'Say the change is regular: each extra CH₂ adds about the same amount.' }] },
    variables: { iv: 'the alcohol (number of carbon atoms, 1–5)', dv: 'temperature rise of the water (°C) and mass of alcohol burned (g), giving ΔcH (kJ/mol)',
      cv: ['mass of water (100 g)', 'height of the can above the wick', 'the same copper can, shield and lid', 'temperature rise aimed for (about 20 °C)'] },
    apparatus: ['Spirit burners with alcohols (methanol to pentan-1-ol)', 'Copper calorimeter can, clamp and stand', 'Thermometer (±0.1 °C) and stirrer', 'Balance (±0.01 g)', 'Measuring cylinder (100 cm³)', 'Draught shield and lid'],
    safety: ['Alcohols are highly flammable: keep stock bottles away from flames; replace burner caps to put them out.', 'Methanol is toxic. Work in a ventilated room and wear eye protection.', 'Let the can cool before touching it.'],
    method: ['Choose the alcohol and the insulation.', 'Press <b>Light the burner</b>. The burner is weighed, the water temperature recorded, and the flame heats 100 g of water while you watch the thermometer.', 'Press <b>Put out</b> when the temperature has risen by about 20 °C. The burner is reweighed.', 'Press <b>Record trial</b>. Repeat each alcohol, then compare all five.'],
    controls: [
      { id: 'alc', label: 'Alcohol', type: 'select', value: 'ethanol', options: Object.keys(ALC).map(function (k) { return [k, ALC[k][0] + ' ' + ALC[k][1]]; }) },
      { id: 'ins', label: 'Insulation', type: 'select', value: 'none', options: Object.keys(EFF).map(function (k) { return [k, EFF[k][0]]; }) }
    ],
    columns: [
      { key: 'alc', label: 'Alcohol', num: false, group: true }, { key: 'nC', label: 'Carbon atoms', dp: 0 }, { key: 'ins', label: 'Insulation', num: false, group: true },
      { key: 'm1', label: 'Burner before', unit: 'g', dp: 2 }, { key: 'm2', label: 'Burner after', unit: 'g', dp: 2 }, { key: 'T1', label: 'Start temp.', unit: '°C', dp: 1 }, { key: 'T2', label: 'Highest temp.', unit: '°C', dp: 1 },
      { key: 'dH', label: 'ΔcH (experiment)', unit: 'kJ/mol', dp: 0 }, { key: 'book', label: 'ΔcH (data book)', unit: 'kJ/mol', dp: 0 }
    ],
    graph: { x: 'nC', y: 'dH', group: 'ins' },
    hints: ['Mass burned = mass before − mass after. Moles = mass burned ÷ molar mass.', 'Q = 100 g × 4.18 J g⁻¹ K⁻¹ × ΔT. Convert to kJ by dividing by 1000.', 'ΔcH = −Q ÷ moles. It must be negative: combustion is exothermic.', 'Plot ΔcH against the number of carbons: the gradient is the change per CH₂ group.'],
    analyse: [
      { id: 'calc', q: 'Using your ethanol trial, calculate the enthalpy of combustion of ethanol. Show every step.', marks: 3, lines: 6,
        check: function (ans, ctx) {
          var a = String(ans).toLowerCase(), s = 0, fb = [], nums = (a.replace(/,/g, '').match(/-?\d+(\.\d+)?/g) || []).map(Number), t = ctx.trials.filter(function (r) { return r.alc === 'Ethanol'; });
          if (!t.length) return { score: 0, fb: 'Record an ethanol trial first.' };
          if (/4\.18|mc ?δ ?t|mcdt|m ?c ?∆t|q ?=/.test(a)) { s++; fb.push('✓ Q = mcΔT used.'); } else fb.push('➜ Start with Q = m × c × ΔT = 100 × 4.18 × ΔT.');
          if (/46|mol/.test(a)) { s++; fb.push('✓ Moles of ethanol found.'); } else fb.push('➜ Moles = mass burned ÷ 46.07 g/mol.');
          if (t.some(function (r) { return nums.some(function (v) { return Math.abs(Math.abs(v) - Math.abs(r.dH)) <= Math.abs(r.dH) * 0.06; }); }) && /-|negative|exotherm/.test(a)) { s++; fb.push('✓ Value and negative sign correct.'); } else fb.push('➜ ΔH = −Q (kJ) ÷ moles; check the value against your table and include the negative sign.');
          return { score: s, fb: fb.join('<br>') };
        } },
      { id: 'trend', q: 'Describe the trend in ΔcH from methanol to pentan-1-ol and estimate the change per CH₂ group from your graph.', marks: 2, lines: 3, points: [
        { re: [/more (negative|exotherm)|increas|larger|bigger|linear|straight/], marks: 1, ok: 'Trend described.', miss: 'Describe it: more negative (more exothermic) with each extra carbon, roughly a straight line.' },
        { re: [/[3-7]\d\d/], marks: 1, ok: 'Change per CH₂ estimated.', miss: 'Estimate the gradient in kJ/mol per carbon atom (your values will be smaller than the data-book 650).' }] },
      { id: 'compare', q: 'Compare your values with the data-book values. Explain the main reason for the difference.', marks: 2, lines: 3, points: [
        { re: [/less (negative|exotherm)|smaller|lower|less than/], marks: 1, ok: 'Experimental values less exothermic.', miss: 'Compare: your values are less negative than the data-book values.' },
        { re: [/heat (loss|lost)|lost to (the )?(surroundings|air)|incomplete|soot|can|evaporat/], marks: 1, ok: 'Heat loss identified.', miss: 'Explain: heat is lost to the air and the can, and combustion may be incomplete (soot).' }] }
    ],
    evaluate: [
      { id: 'imp', q: 'Use your results with different insulation to suggest how to improve the method.', marks: 2, lines: 3, points: [
        { re: [/shield|lid|insulat|closer|height|draught/], marks: 1, ok: 'Reduce heat loss.', miss: 'Use a draught shield and lid, and keep the flame close to the can.' },
        { re: [/closer to|nearer|more accurate|less (heat )?lost|improv|data.?book|\d/], marks: 1, ok: 'Supported by the results.', miss: 'Support it: quote how much closer your ΔcH got to the data-book value with the shield and lid.' }] },
      { id: 'sys', q: 'Is heat loss a random or a systematic error? Explain.', marks: 1, lines: 2, points: [
        { re: [/systematic/], marks: 1, ok: 'Systematic: it always makes ΔH less exothermic.', miss: 'Systematic: it always pushes the value in the same direction (less exothermic), so repeats do not remove it.' }] }
    ],
    model: '<ul><li>Energy released by burning = mass burned ÷ M × |Δ<sub>c</sub>H°(data book)|. A fraction reaches the water: 42 % with no shield, 55 % with a draught shield, 66 % with a shield and lid (±3 % each run).</li><li>Temperature rise of 100 g of water: ΔT = Q ÷ (100 × 4.18). The heat capacity of the copper can is ignored.</li>' +
      '<li>The burner uses about 0.25 g of alcohol per minute. The balance reads ±0.01 g and the thermometer ±0.1 °C.</li><li>Combustion is treated as complete; in reality longer alcohols make more soot, which makes their results worse.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var raf = 0, run = null, burning = false;
    api.stage.innerHTML = '<svg id="ca-sv" viewBox="0 0 420 260" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Spirit burner heating a copper can of water"></svg>';
    var sv = api.stage.querySelector('#ca-sv');
    function draw(T, burnt, flame) {
      var v = api.vals(), h = '';
      h += '<rect x="250" y="20" width="10" height="200" fill="#94a3b8"/><rect x="200" y="50" width="70" height="8" fill="#64748b"/>';
      if (v.ins !== 'none') h += '<path d="M90,40 l0,190 M210,40 l0,190" stroke="#cbd5e1" stroke-width="8"/>';
      h += '<rect x="110" y="60" width="80" height="70" rx="6" fill="#d97706" stroke="#92400e" stroke-width="2"/><rect x="114" y="74" width="72" height="52" fill="#bfdbfe"/>';
      if (v.ins === 'both') h += '<rect x="106" y="54" width="88" height="8" rx="3" fill="#475569"/>';
      h += '<line x1="160" y1="20" x2="160" y2="115" stroke="#334155" stroke-width="3"/><circle cx="160" cy="116" r="4" fill="#dc2626"/><text x="172" y="30" font-size="13" font-weight="700">' + T.toFixed(1) + ' °C</text>';
      if (flame) { var w = 8 + Math.random() * 3, fh = 34 + Math.random() * 8; h += '<path d="M150,190 q10,-' + fh + ' 10,-' + (fh + 6) + ' q0,' + (fh + 6) + ' 10,' + (fh + 6) + ' z" fill="#f59e0b" opacity=".9"/><path d="M155,190 q5,-' + (fh * 0.6) + ' 5,-' + (fh * 0.7) + ' q0,' + (fh * 0.7) + ' 5,' + (fh * 0.7) + ' z" fill="#2563eb" opacity=".7"/>'; }
      h += '<rect x="140" y="190" width="40" height="8" fill="#475569"/><path d="M128,198 l64,0 l6,36 l-76,0 z" fill="#e0f2fe" stroke="#334155" stroke-width="2"/><rect x="131" y="' + (214 + burnt * 4) + '" width="58" height="' + (18 - burnt * 4) + '" fill="#a5f3fc"/>';
      h += '<rect x="110" y="236" width="100" height="14" rx="3" fill="#0f172a"/><text x="160" y="247" font-size="10" fill="#22c55e" text-anchor="middle" font-family="monospace">' + (run ? (run.m1 - burnt).toFixed(2) : '—') + ' g</text>';
      h += '<text x="300" y="120" font-size="12">' + ALC[v.alc][0] + ' ' + ALC[v.alc][1] + '</text><text x="300" y="138" font-size="11" fill="#475569">' + EFF[v.ins][0] + '</text><text x="300" y="156" font-size="11" fill="#475569">100 g of water</text>';
      sv.innerHTML = h;
    }
    function idle() { cancelAnimationFrame(raf); burning = false; run = null; draw(api.vals().alc ? 21 : 21, 0, false); api.readings([['Water', '21.0 °C'], ['Temperature rise', '0.0 °C'], ['Alcohol burned', '0.00 g']]); api.status('Press Light the burner, and Put out when the water is about 20 °C warmer.'); api.enable('out', false); api.enable('rec', false); }
    function light() {
      cancelAnimationFrame(raf); var v = api.vals(), A = ALC[v.alc], eff = EFF[v.ins][1] * (1 + (Math.random() - .5) * 0.06), T1 = 20 + Math.round(Math.random() * 30) / 10, m1 = 150 + Math.round(Math.random() * 3000) / 100;
      run = { v: v, A: A, eff: eff, T1: T1, m1: m1, burnt: 0, T: T1 }; burning = true; api.enable('light', false); api.enable('out', true); api.enable('rec', false); api.status('Burning… watch the thermometer (time runs 10 times faster than real life).');
      var last = performance.now();
      (function loop(now) {
        now = now || performance.now(); var dt = Math.min(0.1, (now - last) / 1000); last = now;
        if (burning) { var dm = 0.25 / 60 * 10 * dt; run.burnt += dm; run.T += dm / A[3] * Math.abs(A[4]) * 1000 * run.eff / (100 * 4.18); }
        draw(run.T, run.burnt, burning);
        api.readings([['Water', run.T.toFixed(1) + ' °C'], ['Temperature rise', (run.T - run.T1).toFixed(1) + ' °C'], ['Alcohol burned', run.burnt.toFixed(2) + ' g'], ['Burner mass', (run.m1 - run.burnt).toFixed(2) + ' g']]);
        if (burning && run.T - run.T1 > 45) { burning = false; api.status('Stopped: the water is getting too hot. Press Record trial.'); api.enable('out', false); api.enable('rec', true); api.enable('light', true); }
        if (burning) raf = requestAnimationFrame(loop);
      })();
    }
    function out() {
      if (!run || !burning) return; burning = false; cancelAnimationFrame(raf);
      run.T += (run.T - run.T1) * 0.03;   // the highest reading comes a few seconds after the flame is out
      draw(run.T, run.burnt, false); api.enable('out', false); api.enable('light', true); api.enable('rec', true);
      api.status('Flame out. Highest temperature ' + run.T.toFixed(1) + ' °C; burner reweighed. Press Record trial.');
    }
    api.actions([
      { id: 'light', label: '🔥 Light the burner', main: true, fn: light },
      { id: 'out', label: '🧯 Put out', fn: out },
      { id: 'rec', label: '➕ Record trial', fn: function () {
        if (!run || burning) return; var r = run, m1 = +r.m1.toFixed(2), m2 = +(r.m1 - r.burnt + (Math.random() - .5) * 0.01).toFixed(2), T2 = +(r.T + (Math.random() - .5) * 0.1).toFixed(1), n = (m1 - m2) / r.A[3], q = 100 * 4.18 * (T2 - r.T1) / 1000;
        if (m1 - m2 <= 0.05) { api.status('Burn more alcohol before recording (at least a few tenths of a gram).'); return; }
        api.record({ alc: r.A[0], nC: r.A[2], ins: EFF[r.v.ins][0], m1: m1, m2: m2, T1: r.T1, T2: T2, dH: Math.round(-q / n), book: r.A[4] });
        api.enable('rec', false);
      } }
    ]);
    api.onChange = function (v, id) { if (id) idle(); };
    api.onShow = function () { if (!run) idle(); };
    idle();
  }
})();
