/* Electric circuits laboratory: I–V characteristics, series and parallel · VistaEd · by George Apidi */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var COMP = { res: 'Fixed resistor (22 Ω)', lamp: 'Filament lamp (6 V, 0.5 A)', diode: 'Diode with 100 Ω protective resistor', therm: 'Thermistor (NTC)', series: 'Two resistors in series', parallel: 'Two resistors in parallel' };
  function thermR(T) { return 2200 * Math.exp(3500 * (1 / (T + 273.15) - 1 / 298.15)); }
  // returns {V: p.d. across the component (or combination), I: current in A, extra readings}
  function solve(v) {
    var Vs = v.Vs, s = Vs < 0 ? -1 : 1, a = Math.abs(Vs);
    if (v.comp === 'res') return { V: Vs, I: Vs / 22 };
    if (v.comp === 'lamp') { var I = 0.5 * Math.pow(a / 6, 0.55); return { V: Vs, I: s * I }; }   // resistance rises as the filament heats up
    if (v.comp === 'therm') return { V: Vs, I: Vs / thermR(v.T), R: thermR(v.T) };
    if (v.comp === 'diode') {   // Shockley diode in series with 100 Ω; find Vd by bisection
      var Is = 1e-12, nVt = 1.8 * 0.0257, lo = Math.min(0, Vs), hi = Math.max(0, Vs);
      for (var k = 0; k < 80; k++) { var m = (lo + hi) / 2, f = Is * (Math.exp(m / nVt) - 1) - (Vs - m) / 100; if (f > 0) hi = m; else lo = m; }
      var Vd = (lo + hi) / 2; return { V: Vd, I: (Vs - Vd) / 100 };
    }
    var R1 = v.R1, R2 = v.R2;
    if (v.comp === 'series') { var Is2 = Vs / (R1 + R2); return { V: Vs, I: Is2, V1: Is2 * R1, V2: Is2 * R2, I1: Is2, I2: Is2 }; }
    return { V: Vs, I: Vs / R1 + Vs / R2, V1: Vs, V2: Vs, I1: Vs / R1, I2: Vs / R2 };
  }
  function noisy(x) { return x * (1 + (Math.random() - 0.5) * 0.01); }
  LABS.circuits = {
    id: 'circuits', title: 'Electric circuits laboratory: I–V characteristics, series and parallel',
    tags: ['Physics', 'Electricity', 'MYP 3–5', 'IGCSE', 'Edexcel', 'IB DP B.5', 'A Level'],
    background: '<figure style="margin:0 0 10px"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Electric_circuit_with_voltmeter_and_ammeter.JPG?width=640" alt="A real circuit with an ammeter in series and a voltmeter in parallel." loading="lazy" style="max-width:100%;max-height:320px;border-radius:10px"><figcaption style="font-size:.85rem;color:#475569">A real circuit with an ammeter in series and a voltmeter in parallel. Photo: Meganbeckett27, via <a href="https://commons.wikimedia.org/wiki/File:Electric_circuit_with_voltmeter_and_ammeter.JPG" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure><p>The <b>current</b> I (amperes, A) is the rate of flow of charge; the <b>potential difference</b> V (volts, V) is the energy transferred per unit charge. <b>Resistance</b> R = V ÷ I (ohms, Ω).</p>' +
      '<ul><li>An <b>ohmic conductor</b> (a fixed resistor at constant temperature) has I ∝ V: a straight line through the origin.</li><li>In a <b>filament lamp</b> the wire heats up, its ions vibrate more and its resistance rises, so the I–V graph curves towards the V axis.</li>' +
      '<li>A <b>diode</b> lets current flow one way only, and only above about 0.6 V.</li><li>An <b>NTC thermistor</b>\'s resistance falls as its temperature rises.</li></ul>' +
      '<p><b>Series:</b> the same current flows through each component and the p.d.s add up: R = R₁ + R₂. <b>Parallel:</b> each branch has the full p.d. and the currents add: 1/R = 1/R₁ + 1/R₂.</p>',
    objectives: ['Measure current and p.d. with an ammeter in series and a voltmeter in parallel.', 'Plot and interpret I–V characteristics for a resistor, a filament lamp and a diode.', 'Show how a thermistor\'s resistance depends on temperature.', 'Test the rules for current, p.d. and resistance in series and parallel circuits.'],
    rq: 'How does the current through a component depend on the potential difference across it? (Then: how do resistors combine in series and in parallel?)',
    hypPrompt: 'Predict the shape of the I–V graph for a fixed resistor and for a filament lamp, and explain the difference.',
    hypothesis: { marks: 3, points: [
      { re: [/straight|proportional|linear/], marks: 1, ok: 'Resistor: straight line.', miss: 'Say the resistor gives a straight line through the origin (I ∝ V).' },
      { re: [/curve|not straight|levels|less steep|flatten/], marks: 1, ok: 'Lamp: a curve.', miss: 'Say the lamp\'s graph curves (gets less steep).' },
      { re: [/hot|heat|temperature|vibrat/], marks: 1, ok: 'You link it to heating.', miss: 'Explain: the filament gets hot, so its resistance increases.' }] },
    variables: { iv: 'potential difference set on the supply (V)', dv: 'current through the component (A)', cv: ['the same component and wires', 'temperature of the resistor (switch off between readings)', 'the same meters and ranges'] },
    apparatus: ['Variable d.c. power supply (−6 V to +6 V)', 'Ammeter and voltmeter (digital)', 'Fixed resistors, 6 V filament lamp, diode with 100 Ω resistor, NTC thermistor', 'Beaker of water and thermometer (for the thermistor)', 'Connecting leads and crocodile clips'],
    safety: ['Keep the current low and switch off between readings: resistors and lamps get hot.', 'Never connect the ammeter directly across the supply.', 'Keep water away from the supply; use only low voltages.'],
    method: ['Choose the component and set the supply p.d.', 'Press <b>Measure</b>: read the ammeter and voltmeter.', 'Press <b>Record</b>. Repeat from −6 V to +6 V in 1 V steps (reverse the supply for negative values).', 'For the thermistor, keep the p.d. at 3 V and change the water temperature.', 'For series and parallel, choose R₁ and R₂ and compare the meter readings.'],
    controls: [
      { id: 'comp', label: 'Component or circuit', type: 'select', value: 'res', options: Object.keys(COMP).map(function (k) { return [k, COMP[k]]; }) },
      { id: 'Vs', label: 'Supply p.d.', type: 'range', min: -6, max: 6, step: 0.5, value: 3, dp: 1, unit: 'V' },
      { id: 'T', label: 'Thermistor temperature', type: 'range', min: 0, max: 100, step: 10, value: 20, unit: '°C' },
      { id: 'R1', label: 'R₁ (series and parallel)', type: 'range', min: 10, max: 100, step: 10, value: 20, unit: 'Ω' },
      { id: 'R2', label: 'R₂ (series and parallel)', type: 'range', min: 10, max: 100, step: 10, value: 30, unit: 'Ω' }
    ],
    columns: [
      { key: 'comp', label: 'Component', num: false, group: true }, { key: 'T', label: 'Temperature', unit: '°C', dp: 0 },
      { key: 'V', label: 'p.d.', unit: 'V', dp: 2 }, { key: 'I', label: 'Current', unit: 'A', dp: 4 }, { key: 'R', label: 'Resistance', unit: 'Ω', dp: 1 },
      { key: 'V1', label: 'p.d. across R₁', unit: 'V', dp: 2 }, { key: 'V2', label: 'p.d. across R₂', unit: 'V', dp: 2 }
    ],
    graph: { x: 'V', y: 'I', group: 'comp' },
    hints: ['Change only the p.d. for one component; plot current (y) against p.d. (x).', 'Resistance at a point is V ÷ I, not the gradient of the curve.', 'For the diode, look closely between 0 and 1 V.', 'In series, add R₁ and R₂. In parallel, the combined resistance is less than the smallest resistor.'],
    analyse: [
      { id: 'rres', q: 'Use your results to calculate the resistance of the fixed resistor.', marks: 1, lines: 1, number: { value: 22, tol: 0.05, unit: 'Ω', dp: 0 } },
      { id: 'lamp', q: 'Describe and explain the shape of the I–V graph for the filament lamp.', marks: 3, lines: 4, points: [
        { re: [/curve|less steep|flatten|not (a )?straight/], marks: 1, ok: 'Shape described.', miss: 'Describe the curve: it gets less steep at higher p.d.' },
        { re: [/resistance (increas|rises|goes up)|higher resistance/], marks: 1, ok: 'Resistance increases.', miss: 'State that the resistance increases.' },
        { re: [/hot|heat|temperature|vibrat/], marks: 1, ok: 'Heating explained.', miss: 'Explain: the filament heats up, ions vibrate more and impede the electrons.' }] },
      { id: 'diode', q: 'Describe how a diode behaves, using values from your results.', marks: 2, lines: 3, points: [
        { re: [/one (way|direction)|revers|negative.*(no|zero)|no current/], marks: 1, ok: 'Current one way only.', miss: 'Say no current flows in reverse (negative p.d.).' },
        { re: [/0\.[5-7]|threshold|switch(es)? on/], marks: 1, ok: 'Threshold about 0.6 V.', miss: 'Quote the p.d. at which current starts: about 0.6 V.' }] },
      { id: 'par', q: 'R₁ = 20 Ω and R₂ = 30 Ω are connected in parallel. Calculate their combined resistance.', marks: 1, lines: 1, number: { value: 12, tol: 0.03, unit: 'Ω', dp: 0 } },
      { id: 'therm', q: 'Describe how the resistance of the thermistor changes with temperature, and give one use.', marks: 2, lines: 3, points: [
        { re: [/(decreas|falls|lower|drops).*(temperature|hot|warm)|temperature (rises|increases).*(decreas|falls|lower)|inversely/], marks: 1, ok: 'Resistance falls as temperature rises.', miss: 'State: as temperature rises, resistance falls.' },
        { re: [/thermostat|fire alarm|sensor|fridge|oven|heating|thermometer|incubator/], marks: 1, ok: 'A use given.', miss: 'Give a use: a temperature sensor, thermostat or fire alarm.' }] }
    ],
    evaluate: [
      { id: 'err', q: 'Explain why the resistor\'s readings may drift if it is left switched on, and how to prevent this.', marks: 2, lines: 3, points: [
        { re: [/heat|hot|temperature/], marks: 1, ok: 'Heating.', miss: 'The current heats the resistor and changes its resistance.' },
        { re: [/switch off|between readings|low current|quickly|small current/], marks: 1, ok: 'Prevention.', miss: 'Switch off between readings and keep the current small.' }] },
      { id: 'lim', q: 'Give one way in which real meters differ from the ideal meters in this model.', marks: 1, lines: 2, points: [
        { re: [/resistance|zero|infinite|draw|current through (the )?voltmeter|precision|resolution|calibrat|zero error/], marks: 1, ok: 'A valid difference.', miss: 'For example: a real ammeter has a small resistance and a real voltmeter draws a small current.' }] }
    ],
    model: '<ul><li>Resistor: I = V ÷ 22 Ω. Lamp: I = 0.5 A × (|V| ÷ 6 V)<sup>0.55</sup>, so resistance rises with p.d.</li><li>Diode: Shockley equation I = I<sub>s</sub>(e<sup>V/nV<sub>T</sub></sup> − 1) with I<sub>s</sub> = 10⁻¹² A, n = 1.8, in series with 100 Ω, solved numerically.</li>' +
      '<li>Thermistor: R = 2200 Ω × e<sup>3500 (1/T − 1/298 K)</sup>. Series: R = R₁ + R₂; parallel: 1/R = 1/R₁ + 1/R₂. Ideal meters; ±0.5 % reading noise.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var last = null;
    api.stage.innerHTML = '<svg viewBox="0 0 420 230" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Circuit diagram with supply, ammeter, voltmeter and component" id="ci-sv"></svg>';
    var sv = api.stage.querySelector('#ci-sv'), t0 = performance.now(), raf = 0;
    function meter(x, y, l, val) { return '<circle cx="' + x + '" cy="' + y + '" r="17" fill="#fff" stroke="#334155" stroke-width="2"/><text x="' + x + '" y="' + (y + 5) + '" font-size="14" text-anchor="middle" font-weight="700">' + l + '</text><text x="' + x + '" y="' + (y + 34) + '" font-size="11" text-anchor="middle" fill="#0f766e" font-weight="700">' + val + '</text>'; }
    function compSVG(v, r) {
      var c = v.comp, h = '';
      if (c === 'res' || c === 'therm') { h += '<rect x="185" y="38" width="50" height="18" fill="#fff" stroke="#334155" stroke-width="2"/>'; if (c === 'therm') h += '<line x1="180" y1="62" x2="240" y2="32" stroke="#334155" stroke-width="1.5"/><text x="210" y="80" font-size="10" text-anchor="middle">' + v.T + ' °C</text>'; }
      if (c === 'lamp') { var glow = Math.min(1, Math.abs(r.I) / 0.5); h += '<circle cx="210" cy="47" r="16" fill="rgba(253,224,71,' + glow + ')" stroke="#334155" stroke-width="2"/><line x1="199" y1="36" x2="221" y2="58" stroke="#334155" stroke-width="2"/><line x1="221" y1="36" x2="199" y2="58" stroke="#334155" stroke-width="2"/>'; }
      if (c === 'diode') h += '<polygon points="196,35 196,59 220,47" fill="#334155"/><line x1="222" y1="35" x2="222" y2="59" stroke="#334155" stroke-width="3"/><rect x="240" y="40" width="24" height="14" fill="#fff" stroke="#334155" stroke-width="1.5"/>';
      if (c === 'series') h += '<rect x="160" y="38" width="40" height="18" fill="#fff" stroke="#334155" stroke-width="2"/><rect x="225" y="38" width="40" height="18" fill="#fff" stroke="#334155" stroke-width="2"/><text x="180" y="30" font-size="10" text-anchor="middle">R₁ ' + v.R1 + ' Ω</text><text x="245" y="30" font-size="10" text-anchor="middle">R₂ ' + v.R2 + ' Ω</text>';
      if (c === 'parallel') h += '<path d="M150,47 l20,0 l0,-22 l80,0 l0,22 l20,0 M170,47 l0,22 l80,0 l0,-22" fill="none" stroke="#334155" stroke-width="2"/><rect x="190" y="16" width="40" height="18" fill="#fff" stroke="#334155" stroke-width="2"/><rect x="190" y="60" width="40" height="18" fill="#fff" stroke="#334155" stroke-width="2"/><text x="210" y="12" font-size="10" text-anchor="middle">R₁ ' + v.R1 + ' Ω</text><text x="210" y="92" font-size="10" text-anchor="middle">R₂ ' + v.R2 + ' Ω</text>';
      return h;
    }
    function draw() {
      var v = api.vals(), r = solve(v), h = '', ph = ((performance.now() - t0) / 1000 * Math.min(4, Math.abs(r.I) * 40)) % 1;
      h += '<path d="M60,47 L' + (v.comp === 'parallel' ? 150 : 160) + ',47 M' + (v.comp === 'parallel' ? 270 : 280) + ',47 L360,47 L360,180 L60,180 L60,47" fill="none" stroke="#334155" stroke-width="2"/>';
      if (v.comp !== 'parallel' && v.comp !== 'series') h += '<path d="M160,47 L185,47 M235,47 L280,47" stroke="#334155" stroke-width="2"/>';
      if (v.comp === 'series') h += '<path d="M200,47 L225,47 M265,47 L280,47" stroke="#334155" stroke-width="2"/>';
      h += compSVG(v, r);
      h += '<rect x="190" y="170" width="40" height="20" fill="#f8fafc"/><line x1="200" y1="165" x2="200" y2="195" stroke="#334155" stroke-width="2"/><line x1="214" y1="172" x2="214" y2="188" stroke="#334155" stroke-width="4"/><text x="210" y="215" font-size="11" text-anchor="middle">supply ' + v.Vs.toFixed(1) + ' V</text>';
      h += '<rect x="45" y="100" width="30" height="40" fill="#f8fafc"/>' + meter(60, 120, 'A', (r.I * 1000).toFixed(1) + ' mA');
      h += '<path d="M150,47 L150,110 L190,110 M270,47 L270,110 L230,110" fill="none" stroke="#64748b" stroke-dasharray="4 3"/>' + meter(210, 110, 'V', r.V.toFixed(2) + ' V');
      // moving charge (conventional current direction)
      var path = [[60, 180], [60, 47], [360, 47], [360, 180]], L = [133, 300, 133, 300], tot = 866;
      for (var k = 0; k < 10 && Math.abs(r.I) > 1e-5; k++) {
        var d = ((k / 10 + (r.I > 0 ? ph : -ph)) % 1 + 1) % 1 * tot, i = 0; while (d > L[i]) { d -= L[i]; i++; }
        var a = path[i], b = i < 3 ? path[i + 1] : [60, 180], f = d / L[i];
        h += '<circle cx="' + (a[0] + (b[0] - a[0]) * f) + '" cy="' + (a[1] + (b[1] - a[1]) * f) + '" r="3.5" fill="#E69F00"/>';
      }
      sv.innerHTML = h;
      var rd = [['Supply', v.Vs.toFixed(1) + ' V'], ['p.d. across', r.V.toFixed(2) + ' V'], ['Current', (r.I * 1000).toFixed(2) + ' mA'], ['Resistance', Math.abs(r.I) > 1e-6 ? (r.V / r.I).toFixed(1) + ' Ω' : '—']];
      if (r.V1 != null) rd.push(['p.d. R₁ / R₂', r.V1.toFixed(2) + ' / ' + r.V2.toFixed(2) + ' V'], ['Current R₁ / R₂', (r.I1 * 1000).toFixed(0) + ' / ' + (r.I2 * 1000).toFixed(0) + ' mA']);
      api.readings(rd);
      raf = requestAnimationFrame(draw);
    }
    api.actions([{ id: 'rec', label: '➕ Measure and record', main: true, fn: function () {
      var v = api.vals(), r = solve(v), V = noisy(r.V), I = noisy(r.I);
      api.record({ comp: COMP[v.comp], T: v.comp === 'therm' ? v.T : null, V: +V.toFixed(3), I: +I.toFixed(5), R: Math.abs(I) > 1e-6 ? +(V / I).toFixed(2) : null, V1: r.V1 != null ? +noisy(r.V1).toFixed(3) : null, V2: r.V2 != null ? +noisy(r.V2).toFixed(3) : null });
    } }]);
    api.onShow = function () { cancelAnimationFrame(raf); draw(); };
    api.status('Choose a component, set the p.d., then press Measure and record. Dots show the direction of conventional current.');
    draw();
  }
})();
