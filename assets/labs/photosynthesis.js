/* Photosynthesis laboratory · BioscienceVista · by George Apidi
   IB DP C1.3.6–C1.3.8: pondweed (Elodea) in hydrogencarbonate solution under a lamp. Change light intensity (lamp distance), carbon dioxide
   (hydrogencarbonate concentration), temperature and the colour (wavelength) of the light; count oxygen bubbles to find the rate. Find the
   limiting factor, build an action spectrum and model carbon dioxide enrichment. */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var WL = [['white', 'White light'], ['450', 'Blue (450 nm)'], ['500', 'Blue-green (500 nm)'], ['550', 'Green (550 nm)'], ['600', 'Orange (600 nm)'], ['680', 'Red (680 nm)']];
  var ACT = { white: 1, '450': 0.92, '500': 0.55, '550': 0.3, '600': 0.62, '680': 1 };
  var COL = { white: '#fde68a', '450': '#3b82f6', '500': '#06b6d4', '550': '#22c55e', '600': '#f97316', '680': '#ef4444' };
  var PMAX = 60;   // bubbles per minute when nothing limits

  function model(o) {   // o: {d (cm), co2 (% hydrogencarbonate), T (°C), wl}
    var I = 100 * Math.pow(10 / o.d, 2), Le = I * ACT[o.wl];   // relative light intensity, effective for photosynthesis
    var pL = Le / (Le + 18), pC = o.co2 / (o.co2 + 0.18);
    var tf = o.T <= 30 ? Math.exp(-Math.pow((o.T - 30) / 13, 2)) : Math.exp(-Math.pow((o.T - 30) / 7, 2));
    var lim = Math.min(pL, pC), rate = PMAX * lim * tf, factor = pL < pC * 0.97 ? 'light' : pC < pL * 0.97 ? 'carbon dioxide' : 'light and carbon dioxide';
    if (tf < 0.6 && o.T > 30) factor = 'temperature (enzymes such as Rubisco start to denature)'; else if (tf < 0.6) factor = 'temperature (enzymes slow in the cold)';
    return { I: I, rate: rate, factor: factor, tf: tf };
  }

  LABS.photosynthesis = {
    id: 'photosynthesis', title: 'Photosynthesis laboratory: limiting factors and the action spectrum',
    tags: ['Biology', 'Plants', 'IB DP C1.3.6 action spectrum', 'IB DP C1.3.7 limiting factors', 'IB DP C1.3.8 CO₂ enrichment', 'IGCSE', 'A Level'],
    background: '<p>In photosynthesis light energy is used to make glucose: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂. The oxygen comes from splitting water. The <b>rate</b> can be measured from the oxygen released (bubbles from pondweed, or an oxygen sensor) or the carbon dioxide taken in.</p>' +
      '<p>The rate depends on <b>light intensity</b>, <b>carbon dioxide concentration</b> and <b>temperature</b>. At any moment the factor in shortest supply is the <b>limiting factor</b>: increasing it raises the rate; increasing the others does not. Light intensity falls with the square of the distance from a lamp (inverse square law). Hydrogencarbonate (HCO₃⁻) in the water supplies carbon dioxide. Temperature affects the enzymes of the Calvin cycle (such as Rubisco): the rate rises to an optimum and then falls.</p>' +
      '<p>Chlorophyll absorbs mainly <b>blue and red</b> light and reflects green. Plotting the rate of photosynthesis against wavelength gives an <b>action spectrum</b>, which closely matches the <b>absorption spectrum</b> of the pigments. <b>Carbon dioxide enrichment</b> experiments (greenhouses, and free-air CO₂ enrichment, FACE, in fields and forests) test how plants may grow as atmospheric CO₂ rises.</p>',
    objectives: ['Measure the rate of photosynthesis by counting oxygen bubbles.', 'Investigate the effect of light intensity, carbon dioxide and temperature, and identify the limiting factor.', 'Plot an action spectrum and compare it with the absorption spectrum.', 'Evaluate carbon dioxide enrichment as a way to predict future plant growth.'],
    rq: 'How does light intensity (lamp distance 10–60 cm) affect the rate of photosynthesis of Elodea, at two concentrations of hydrogencarbonate?',
    hypPrompt: 'Predict how the rate changes as the lamp moves closer, and what happens at high light intensity with little carbon dioxide.',
    hypothesis: { marks: 3, points: [
      { re: [/closer|nearer|(more|higher|brighter|greater) (light|intensity)/], marks: 1, ok: 'More light gives a faster rate.', miss: 'Say how the rate changes as the lamp gets closer (more light).' },
      { re: [/level|plateau|stop increas|no (further|more) (increase|effect)|maximum/], marks: 1, ok: 'You predict the rate levels off.', miss: 'Predict what happens at very high light intensity.' },
      { re: [/limit|carbon dioxide|co2|co₂|hydrogencarbonate|bicarbonate/], marks: 1, ok: 'You name the limiting factor.', miss: 'Explain using a limiting factor (carbon dioxide).' }] },
    variables: { iv: 'light intensity (distance of the lamp, cm; relative intensity ∝ 1/d²)', dv: 'rate of photosynthesis (oxygen bubbles per minute)', cv: ['hydrogencarbonate concentration', 'temperature (water bath)', 'same piece of pondweed, same length', 'wavelength (white light)', 'acclimatise 2 minutes before counting'] },
    apparatus: ['Elodea (pondweed) with the stem cut at an angle, weighted with a paper clip', 'Boiling tube in a beaker of water (heat shield and water bath)', 'Sodium hydrogencarbonate solution 0–2 %', 'Lamp (LED, little heat), metre rule, coloured filters', 'Thermometer, stopwatch (or an oxygen sensor / gas syringe)'],
    safety: ['Keep water away from the lamp and mains plugs.', 'Old filament lamps get hot: use an LED lamp or a heat shield.', 'Wash hands after handling pondweed.'],
    method: ['Set 1 % hydrogencarbonate, 25 °C and white light. Put the lamp 60 cm away.', 'Press <b>▶ Start counting</b>: the plant acclimatises, then watch the bubbles; the count per minute appears.', 'Press <b>➕ Record trial</b>. Move the lamp to 50, 40, 30, 20, 15 and 10 cm and repeat (3 repeats each).', 'Repeat at 0.1 % hydrogencarbonate. Then change the temperature, and the colour of the light at 10 cm for an action spectrum.'],
    controls: [
      { id: 'd', label: 'Lamp distance', min: 10, max: 60, step: 5, value: 30, unit: 'cm' },
      { id: 'co2', label: 'Sodium hydrogencarbonate (CO₂ supply)', min: 0, max: 2, step: 0.1, value: 1, dp: 1, unit: '%' },
      { id: 'T', label: 'Temperature of the water bath', min: 5, max: 45, step: 5, value: 25, unit: '°C' },
      { id: 'wl', label: 'Colour of light (filter)', type: 'select', value: 'white', options: WL }
    ],
    columns: [
      { key: 'co2', label: 'Hydrogencarbonate', unit: '%', dp: 1, group: true }, { key: 'T', label: 'Temperature', unit: '°C', dp: 0, group: true }, { key: 'wl', label: 'Light', num: false, group: true },
      { key: 'd', label: 'Lamp distance', unit: 'cm', dp: 0 }, { key: 'I', label: 'Relative light intensity (1/d²)', unit: 'a.u.', dp: 1 }, { key: 'rate', label: 'Rate', unit: 'bubbles/min', dp: 0 }
    ],
    graph: { x: 'I', y: 'rate', group: 'co2' },
    hints: ['Light intensity is proportional to 1 ÷ distance²: halving the distance gives four times the light.', 'If increasing a factor does not raise the rate, something else is limiting.', 'Green light: which colour does a leaf reflect?', 'Bubbles vary in size: what is a better measure of oxygen?'],
    analyse: [
      { id: 'r20', q: 'State the rate at 20 cm with 1 % hydrogencarbonate, 25 °C and white light.', marks: 1, lines: 1, number: { value: function () { return model({ d: 20, co2: 1, T: 25, wl: 'white' }).rate; }, tol: 0.12, unit: 'bubbles/min', dp: 0 } },
      { id: 'lim', q: 'Compare your two graphs (1 % and 0.1 % hydrogencarbonate). Identify the limiting factor at low light and at high light.', marks: 3, lines: 4, points: [
        { re: [/low light.*(light|intensity)|light (is|was) limiting.*low|at low.*light.*limit/], marks: 1, ok: 'At low light, light limits.', miss: 'At low light intensity, light is the limiting factor.' },
        { re: [/high light.*(carbon dioxide|co2|co₂|hydrogencarbonate|bicarbonate)|(carbon dioxide|co2|co₂).*limit.*high/], marks: 1, ok: 'At high light, CO₂ limits.', miss: 'At high light the curve levels off because CO₂ limits.' },
        { re: [/0\.1.*(lower|less|level).*|level.*(lower|earlier)|plateau.*(lower|earlier)|higher plateau|1 ?%.*(higher|more)/], marks: 1, ok: 'You compare the plateaus.', miss: 'Compare where each curve levels off: lower with 0.1 %.' }] },
      { id: 'act', q: 'Describe your action spectrum and explain it using the absorption spectrum of chlorophyll.', marks: 3, lines: 4, points: [
        { re: [/blue|red|450|680/], marks: 1, ok: 'Highest in blue and red.', miss: 'Say which colours give the highest rate.' }, { re: [/green|550/], marks: 1, ok: 'Lowest in green.', miss: 'Say which colour gives the lowest rate.' },
        { re: [/absorb|reflect/], marks: 1, ok: 'Chlorophyll absorbs blue and red, reflects green.', miss: 'Explain with absorption: chlorophyll absorbs blue and red and reflects green.' }] },
      { id: 'temp', q: 'Explain the effect of temperature above 35 °C on the rate.', marks: 2, lines: 3, points: [
        { re: [/fall|decreas|drop|lower|slow/], marks: 1, ok: 'The rate falls.', miss: 'Describe what happens to the rate.' }, { re: [/enzyme|rubisco|denatur|active site/], marks: 1, ok: 'Enzymes (Rubisco) denature.', miss: 'Explain with enzymes: Calvin cycle enzymes such as Rubisco denature.' }] }
    ],
    evaluate: [
      { id: 'bub', q: 'Counting bubbles is not very accurate. Suggest two improvements to the method.', marks: 2, lines: 3, points: [
        { re: [/syringe|volume|capillary|sensor|probe|measure.*oxygen|photosynthometer|audus/], marks: 1, ok: 'Measure volume of oxygen (gas syringe / sensor).', miss: 'For example: collect the gas in a syringe or use an oxygen sensor.' },
        { re: [/repeat|mean|acclimat|heat shield|led|dark|water bath|same (plant|piece)|background light/], marks: 1, ok: 'A valid control.', miss: 'For example: repeat for a mean, acclimatise, use an LED or heat shield, darken the room.' }] },
      { id: 'face', q: 'Free-air CO₂ enrichment (FACE) raises CO₂ around plants in a field. Suggest one advantage over a greenhouse experiment and one limitation of predicting future growth from it.', marks: 2, lines: 4, points: [
        { re: [/natural|real|field|outdoor|realistic|wind|weather|ecosystem|large/], marks: 1, ok: 'Natural conditions.', miss: 'Advantage: plants grow in natural field conditions.' },
        { re: [/temperature|water|nitrogen|nutrient|drought|other factor|limit|cost|only co2|short|years|adapt|pest/], marks: 1, ok: 'Other factors may limit growth.', miss: 'Limitation: future climates also change temperature, water and nutrients, which may limit growth.' }] }
    ],
    model: '<ul><li>Relative light intensity I = 100 × (10 cm ÷ d)². Effective light = I × action factor (blue 0.92, blue-green 0.55, green 0.30, orange 0.62, red 1.0, white 1.0).</li>' +
      '<li>Rate = 60 bubbles/min × min(I<sub>e</sub> ÷ (I<sub>e</sub> + 18), C ÷ (C + 0.18)) × temperature factor (optimum 30 °C, falls faster above it). The minimum of the two terms models the limiting factor. Each recorded trial varies by about ±5 %, like real bubble counts.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, sim = null, raf = null, playing = false, t0 = 0, W = 680, H = 340, bubbles = [], last = 0, count = 0;
    api.stage.innerHTML = '<canvas id="ps-cv" width="680" height="340" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Pondweed in a tube under a lamp, releasing oxygen bubbles"></canvas><p class="small" id="ps-cap" style="margin:6px 0;font-weight:700" aria-live="polite"></p><canvas class="vl-chart" id="ps-ch" style="height:220px"></canvas><div id="ps-lg"></div>';
    var cv = api.stage.querySelector('#ps-cv'), c = cv.getContext('2d'), ch = api.stage.querySelector('#ps-ch'), cap = api.stage.querySelector('#ps-cap');
    var TX = 470;
    function compute() { var v = api.vals(); sim = model(v); sim.v = v; }
    function draw(el) {
      var v = sim.v, now = performance.now() / 1000, lampX = TX - 40 - v.d * 6;
      c.clearRect(0, 0, W, H);
      // light beam
      var g = c.createLinearGradient(lampX, 0, TX, 0); g.addColorStop(0, COL[v.wl]); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.globalAlpha = 0.35 + 0.4 * Math.min(1, sim.I / 100); c.fillStyle = g; c.beginPath(); c.moveTo(lampX + 20, 150); c.lineTo(TX + 30, 70); c.lineTo(TX + 30, 300); c.closePath(); c.fill(); c.globalAlpha = 1;
      // lamp
      c.fillStyle = '#334155'; c.fillRect(lampX - 30, 130, 34, 40); c.fillStyle = COL[v.wl]; c.beginPath(); c.arc(lampX + 8, 150, 16, -1.2, 1.2); c.fill(); c.fillStyle = '#334155'; c.fillRect(lampX - 18, 170, 8, 150);
      // ruler
      c.fillStyle = '#fef9c3'; c.fillRect(60, 316, TX - 60, 14); c.fillStyle = '#713f12'; c.font = '9px system-ui'; c.textAlign = 'center';
      for (var dcm = 0; dcm <= 60; dcm += 10) { var x = TX - 40 - dcm * 6; c.fillRect(x, 316, 1, 7); c.fillText(dcm + ' cm', x, 338); }
      // beaker (water bath) and tube
      c.fillStyle = 'rgba(186,230,253,.5)'; c.fillRect(TX - 10, 100, 120, 200); c.strokeStyle = '#475569'; c.lineWidth = 3; c.strokeRect(TX - 10, 90, 120, 210);
      c.fillStyle = 'rgba(224,242,254,.9)'; c.fillRect(TX + 30, 60, 40, 230); c.strokeStyle = '#64748b'; c.lineWidth = 2; c.strokeRect(TX + 30, 60, 40, 230);
      // pondweed
      c.strokeStyle = '#15803d'; c.lineWidth = 4; c.beginPath(); c.moveTo(TX + 50, 280); c.bezierCurveTo(TX + 40, 230, TX + 60, 200, TX + 50, 150); c.stroke();
      for (var k = 0; k < 9; k++) { var ly = 270 - k * 13; c.fillStyle = '#16a34a'; [-1, 1].forEach(function (s) { c.beginPath(); c.ellipse(TX + 50 + s * 9, ly, 8, 3, s * 0.5, 0, 7); c.fill(); }); }
      // bubbles
      if (playing && el > 0.15) { var per = 15 / Math.max(0.25, sim.rate); if (now - last > per) { last = now; bubbles.push({ y: 150, x: TX + 50 + (Math.random() - 0.5) * 4, s: 2 + Math.random() * 2 }); count++; } }
      bubbles = bubbles.filter(function (b) { b.y -= 1.6; return b.y > 64; });
      bubbles.forEach(function (b) { c.strokeStyle = '#0369a1'; c.fillStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1; c.beginPath(); c.arc(b.x, b.y, b.s, 0, 7); c.fill(); c.stroke(); });
      // thermometer
      c.fillStyle = '#e2e8f0'; c.fillRect(TX + 90, 80, 8, 200); c.fillStyle = '#ef4444'; var th = 20 + v.T * 3.6; c.fillRect(TX + 91, 280 - th, 6, th); c.beginPath(); c.arc(TX + 94, 284, 7, 0, 7); c.fill();
      c.fillStyle = '#0f172a'; c.font = 'bold 12px system-ui'; c.textAlign = 'left'; c.fillText(v.T + ' °C', TX + 104, 90);
      c.fillText(fx(v.co2, 1) + ' % HCO₃⁻', TX - 6, 84);
      // counter
      c.font = 'bold 15px system-ui'; c.fillText(playing ? (el < 0.15 ? 'Acclimatising…' : 'Bubbles counted: ' + count) : 'Rate ≈ ' + fx(sim.rate, 0) + ' bubbles/min', 16, 26);
      c.font = '12px system-ui'; c.fillText('Light intensity ' + fx(sim.I, 1) + ' (relative) · limiting: ' + sim.factor, 16, 46);
      cap.textContent = sim.rate < 1 ? 'Almost no bubbles: photosynthesis is limited by ' + sim.factor + '.' : 'About ' + fx(sim.rate, 0) + ' bubbles of oxygen per minute. The limiting factor now is ' + sim.factor + '.';
    }
    function drawChart() {
      var v = sim.v, s1 = [], s2 = [], sp = [];
      for (var d = 10; d <= 60.001; d += 1) { var I = 100 * Math.pow(10 / d, 2); s1.push([I, model({ d: d, co2: v.co2, T: v.T, wl: v.wl }).rate]); s2.push([I, model({ d: d, co2: 0.1, T: v.T, wl: v.wl }).rate]); }
      ['450', '500', '550', '600', '680'].forEach(function (w) { sp.push([+w, model({ d: 10, co2: 2, T: 25, wl: w }).rate]); });
      var series = [{ name: fx(v.co2, 1) + ' % hydrogencarbonate', pts: s1, color: '#009E73' }, { name: '0.1 % hydrogencarbonate', pts: s2, color: '#D55E00', dash: true }, { name: 'Now', pts: [[sim.I, sim.rate]], color: '#000', dots: true }];
      api.chart(ch, { xLabel: 'Relative light intensity (1/d²)', yLabel: 'Rate / bubbles per min', xmin: 0, xmax: 100, ymin: 0, ymax: 65, series: series });
      api.stage.querySelector('#ps-lg').innerHTML = api.legend(series.slice(0, 2)) + '<p class="small muted" style="margin:4px 0 0">Action spectrum at 10 cm, 2 % HCO₃⁻: ' + sp.map(function (p) { return p[0] + ' nm ' + fx(p[1], 0); }).join(' · ') + ' bubbles/min. Record your own trials to plot it in 4 Results.</p>';
    }
    function readings() { api.readings([['Rate', fx(sim.rate, 0) + ' bubbles/min'], ['Light intensity', fx(sim.I, 1) + ' (relative)'], ['Limiting factor', sim.factor], ['Temperature factor', fx(sim.tf * 100, 0) + ' % of optimum']]); }
    function frame() { var el = Math.min(1, (performance.now() - t0) / 15000); draw(el); if (el >= 1) { playing = false; api.label('run', '▶ Start counting'); api.status('One minute counted (' + count + ' bubbles). ➕ Record the trial.'); return; } if (playing) raf = requestAnimationFrame(frame); }
    api.actions([
      { id: 'run', label: '▶ Start counting', main: true, fn: function () { if (playing) { playing = false; cancelAnimationFrame(raf); api.label('run', '▶ Start counting'); return; } compute(); readings(); bubbles = []; count = 0; last = 0; playing = true; t0 = performance.now(); api.label('run', '⏸ Pause'); api.status('Acclimatising, then counting for one minute (shown 4× faster).'); frame(); } },
      { id: 'rec', label: '➕ Record trial', fn: function () { var v = sim.v, r = Math.max(0, sim.rate * (1 + (Math.random() - 0.5) * 0.1)); api.record({ co2: v.co2, T: v.T, wl: WL.filter(function (w) { return w[0] === v.wl; })[0][1], d: v.d, I: +sim.I.toFixed(1), rate: Math.round(r) }); } }
    ]);
    api.onChange = function () { compute(); readings(); drawChart(); if (!playing) draw(0); };
    compute(); readings(); drawChart(); draw(0);
    api.status('Press ▶ Start counting.');
    window.BV_PS = { model: model };
  }
})();
