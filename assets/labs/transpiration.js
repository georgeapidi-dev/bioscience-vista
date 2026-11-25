/* Transpiration laboratory: the bubble potometer · VistaEd · by George Apidi */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var WIND = { still: ['Still air', 1], fan: ['Fan on low', 1.6], fanhi: ['Fan on high', 2.1] };
  var LEAF = { none: ['No grease', 1], upper: ['Upper surface greased', 0.88], lower: ['Lower surface greased', 0.22], both: ['Both surfaces greased', 0.06] };
  var RAD = 0.5;   // capillary radius, mm
  function es(T) { return 0.611 * Math.exp(17.27 * T / (T + 237.3)); }   // saturation vapour pressure, kPa
  function rate(v) {   // bubble speed, mm per minute
    var stom = 0.12 + 0.88 * v.light / (v.light + 25);   // stomata open in light (light as % of full lamp)
    var vpd = es(v.T) * (1 - v.RH / 100);
    return 7.5 * stom * vpd * WIND[v.wind][1] * LEAF[v.leaf][1];
  }
  LABS.transpiration = {
    id: 'transpiration', title: 'Transpiration laboratory: the bubble potometer',
    tags: ['Biology', 'Plant transport', 'MYP 3–5', 'IGCSE', 'Edexcel', 'IB DP B3.2', 'A Level'],
    background: '<figure style="margin:0 0 10px"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Potetometer.svg?width=640" alt="Diagram of a potometer with a leafy shoot." loading="lazy" style="max-width:100%;max-height:320px;border-radius:10px"><figcaption style="font-size:.85rem;color:#475569">Diagram of a potometer with a leafy shoot. Photo: Wikimedia Commons contributors, via <a href="https://commons.wikimedia.org/wiki/File:Potetometer.svg" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure><p><b>Transpiration</b> is the loss of water vapour from the leaves, mainly through the <b>stomata</b>. Water evaporates from the walls of the mesophyll cells into the air spaces and diffuses out down a water vapour concentration gradient. This pulls water up the <b>xylem</b> in a continuous column (cohesion–tension).</p>' +
      '<p>A <b>potometer</b> measures the rate of <b>water uptake</b> by a leafy shoot, which is close to the rate of transpiration. An air bubble in the capillary tube moves as the shoot takes up water.</p>' +
      '<ul><li><b>Light:</b> stomata open, so more water vapour escapes.</li><li><b>Temperature:</b> more evaporation and faster diffusion.</li><li><b>Humidity:</b> humid air reduces the concentration gradient.</li><li><b>Wind:</b> moves humid air away from the leaf surface.</li></ul>' +
      '<p>Most stomata are on the <b>lower</b> surface of a leaf, so greasing it with petroleum jelly cuts water loss most.</p>',
    objectives: ['Set up a potometer and measure the distance moved by a bubble.', 'Convert distance to volume of water taken up using πr²d.', 'Investigate how light, temperature, humidity and wind affect transpiration.', 'Use greased leaves to find where most stomata are.'],
    rq: 'How does light intensity affect the rate of water uptake by a leafy shoot?',
    hypPrompt: 'Predict how the rate of water uptake changes as light intensity increases, and explain.',
    hypothesis: { marks: 3, points: [
      { re: [/increas|faster|more|higher/], marks: 1, ok: 'Rate increases.', miss: 'Say whether the rate increases or decreases.' },
      { re: [/stomata|stoma|guard cell/], marks: 1, ok: 'Stomata used.', miss: 'Mention the stomata.' },
      { re: [/open/], marks: 1, ok: 'Stomata open in light.', miss: 'Explain: in light the stomata open, so more water vapour diffuses out.' }] },
    variables: { iv: 'light intensity (% of the full lamp)', dv: 'distance moved by the bubble in 5 minutes (mm); rate of water uptake (mm³/min)', cv: ['the same shoot', 'temperature', 'humidity', 'air movement', 'time allowed for the shoot to adjust (5 minutes)'] },
    apparatus: ['Potometer with capillary tube (radius 0.5 mm) and scale', 'Leafy shoot cut under water', 'Reservoir with tap to reset the bubble', 'Lamp and dimmer, fan', 'Thermometer and humidity sensor', 'Petroleum jelly', 'Stopwatch'],
    safety: ['Cut the shoot away from you on a tile; carry scalpels blade down.', 'Keep water away from the lamp and fan sockets.', 'The lamp gets hot: do not touch the bulb.'],
    method: ['Cut the shoot under water so no air enters the xylem; fit it into the potometer under water and seal with petroleum jelly.', 'Choose the conditions and wait 5 minutes for the shoot to adjust.', 'Press <b>Start</b>: the bubble moves along the scale for 5 minutes (shown in 10 seconds).', 'Press <b>Record</b>, then <b>Reset bubble</b> (open the reservoir tap).', 'Repeat three times at each light intensity, then test temperature, humidity, wind and greased leaves.'],
    controls: [
      { id: 'light', label: 'Light intensity', type: 'range', min: 0, max: 100, step: 10, value: 50, unit: '%' },
      { id: 'T', label: 'Air temperature', type: 'range', min: 15, max: 35, step: 5, value: 25, unit: '°C' },
      { id: 'RH', label: 'Relative humidity', type: 'range', min: 30, max: 90, step: 10, value: 50, unit: '%' },
      { id: 'wind', label: 'Air movement', type: 'select', value: 'still', options: Object.keys(WIND).map(function (k) { return [k, WIND[k][0]]; }) },
      { id: 'leaf', label: 'Leaves greased', type: 'select', value: 'none', options: Object.keys(LEAF).map(function (k) { return [k, LEAF[k][0]]; }) }
    ],
    columns: [
      { key: 'set', label: 'Conditions', num: false, group: true }, { key: 'light', label: 'Light', unit: '%', dp: 0 }, { key: 'T', label: 'Temperature', unit: '°C', dp: 0 }, { key: 'RH', label: 'Humidity', unit: '%', dp: 0 },
      { key: 'd', label: 'Distance in 5 min', unit: 'mm', dp: 0 }, { key: 'r', label: 'Rate of uptake', unit: 'mm³/min', dp: 2 }
    ],
    graph: { x: 'light', y: 'r', group: 'set' },
    hints: ['Change one factor at a time and keep the others at the default values.', 'Volume = π × r² × distance, with r = 0.5 mm.', 'Rate = volume ÷ 5 minutes.', 'Compare the greased leaves with the ungreased shoot under the same conditions.'],
    analyse: [
      { id: 'vol', q: 'A bubble moves 40 mm in 5 minutes in a capillary of radius 0.5 mm. Calculate the rate of water uptake in mm³/min.', marks: 2, lines: 2, number: { value: 6.28, tol: 0.02, unit: 'mm³/min', dp: 2 } },
      { id: 'light', q: 'Describe and explain the effect of light intensity on the rate of water uptake.', marks: 3, lines: 4, points: [
        { re: [/increas|higher|faster|more/], marks: 1, ok: 'Rate increases.', miss: 'State that the rate increases with light intensity.' },
        { re: [/level|plateau|slows|less steep|max/], marks: 1, ok: 'It levels off.', miss: 'Describe how it levels off at high light.' },
        { re: [/stomata.*open|open.*stomata/], marks: 1, ok: 'Stomata open.', miss: 'Explain: light opens the stomata; once all are open, other factors limit the rate.' }] },
      { id: 'hum', q: 'Explain why humid air reduces the rate of transpiration.', marks: 2, lines: 3, points: [
        { re: [/gradient|concentration|difference/], marks: 1, ok: 'Concentration gradient.', miss: 'Mention the water vapour concentration gradient.' },
        { re: [/less (steep|diffusion)|smaller|reduc|slower diffusion|diffus/], marks: 1, ok: 'Less diffusion.', miss: 'Explain: the gradient is smaller, so water vapour diffuses out more slowly.' }] },
      { id: 'grease', q: 'What do the greased-leaf results show about where the stomata are? Use values.', marks: 2, lines: 3, points: [
        { re: [/lower|underside|bottom|abaxial/], marks: 1, ok: 'Mostly on the lower surface.', miss: 'Conclude that most stomata are on the lower surface.' },
        { re: [/\d/], marks: 1, ok: 'Values quoted.', miss: 'Compare the rates with numbers.' }] }
    ],
    evaluate: [
      { id: 'err', q: 'Explain why a potometer measures water uptake rather than transpiration, and give one other source of error.', marks: 2, lines: 3, points: [
        { re: [/photosynthesis|turgor|cells? (use|keep|store)|support|not all (the )?water/], marks: 1, ok: 'Some water is used by the plant.', miss: 'Some water taken up is used in photosynthesis or kept in cells, not transpired.' },
        { re: [/air (bubble|lock|enter|leak)|seal|leak|cut (under|in) water|temperature (change|varies)|one shoot|different shoot/], marks: 1, ok: 'A second source.', miss: 'For example: air leaks at the seal, or air entering the xylem when the shoot was cut.' }] },
      { id: 'lim', q: 'Give one simplification in this model.', marks: 1, lines: 2, points: [
        { re: [/instant|stomata respond|constant|same shoot|identical|leaf area|no (noise|error)|steady/], marks: 1, ok: 'A valid simplification.', miss: 'For example: stomata respond instantly and the leaf area never changes.' }] }
    ],
    model: '<ul><li>Bubble speed (mm/min) = 7.5 × stomatal opening × VPD × wind factor × grease factor.</li><li>Stomatal opening = 0.12 + 0.88 × L ÷ (L + 25), L = light in %. VPD (kPa) = e<sub>s</sub>(T) × (1 − RH), e<sub>s</sub> = 0.611 e<sup>17.27T/(T+237.3)</sup>.</li>' +
      '<li>Wind: still 1, low 1.6, high 2.1. Grease: upper 0.88, lower 0.22, both 0.06. Each run varies by ±4 %. Capillary radius 0.5 mm.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var raf = 0, run = null, bubble = 0;
    api.stage.innerHTML = '<svg viewBox="0 0 420 220" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Leafy shoot in a bubble potometer" id="tp-sv"></svg>';
    var sv = api.stage.querySelector('#tp-sv');
    function draw(drops) {
      var v = api.vals(), h = '', lit = v.light / 100, gr = LEAF[v.leaf][1] < 1;
      h += '<circle cx="380" cy="30" r="' + (10 + 10 * lit) + '" fill="rgba(253,224,71,' + (0.2 + 0.8 * lit) + ')"/><text x="380" y="62" font-size="9" text-anchor="middle">lamp ' + v.light + '%</text>';
      if (v.wind !== 'still') h += '<text x="20" y="40" font-size="18">🌀</text><path d="M44,40 q20,-8 40,0 M44,52 q20,-8 40,0" stroke="#94a3b8" fill="none"/>';
      h += '<path d="M130,140 L130,90" stroke="#15803d" stroke-width="4"/>';
      [[-1, 70], [1, 80], [-1, 100], [1, 110]].forEach(function (L) { h += '<ellipse cx="' + (130 + L[0] * 24) + '" cy="' + L[1] + '" rx="24" ry="9" transform="rotate(' + (L[0] * -20) + ' ' + (130 + L[0] * 24) + ' ' + L[1] + ')" fill="' + (gr ? '#4d7c0f' : '#22c55e') + '" stroke="#166534"/>'; });
      (drops || []).forEach(function (d) { h += '<circle cx="' + d.x + '" cy="' + d.y + '" r="1.8" fill="#38bdf8" opacity="' + d.o + '"/>'; });
      h += '<rect x="118" y="140" width="24" height="14" fill="#a8a29e"/><path d="M120,154 L120,175 L380,175 M140,154 L140,165 L380,165" fill="none" stroke="#334155" stroke-width="2"/><rect x="141" y="166" width="239" height="8" fill="#bae6fd"/>';
      h += '<rect x="250" y="120" width="26" height="40" fill="#bae6fd" stroke="#334155"/><text x="263" y="114" font-size="9" text-anchor="middle">reservoir</text>';
      for (var mm = 0; mm <= 300; mm += 25) h += '<line x1="' + (380 - mm * 0.77) + '" y1="178" x2="' + (380 - mm * 0.77) + '" y2="' + (mm % 100 ? 183 : 188) + '" stroke="#334155"/>' + (mm % 100 ? '' : '<text x="' + (380 - mm * 0.77) + '" y="200" font-size="9" text-anchor="middle">' + mm + '</text>');
      h += '<rect x="' + (380 - bubble * 0.77) + '" y="166" width="7" height="8" fill="#fff" stroke="#334155"/><text x="300" y="214" font-size="9" text-anchor="middle">scale / mm (bubble moves towards the shoot)</text>';
      h += '<text x="300" y="30" font-size="10" text-anchor="middle">' + v.T + ' °C · ' + v.RH + ' % humidity</text>';
      sv.innerHTML = h;
    }
    function idle() { cancelAnimationFrame(raf); draw([]); api.readings([['Bubble position', bubble.toFixed(0) + ' mm'], ['Time', '0 min']]); api.enable('rec', false); }
    function start() {
      cancelAnimationFrame(raf); var v = api.vals(), r = rate(v) * (1 + (Math.random() - 0.5) * 0.08), start = 0, drops = [], t0 = performance.now();
            run = { v: v, r: r, start: start }; api.enable('start', false); api.enable('rec', false);
      (function loop() {
        var f = Math.min(1, (performance.now() - t0) / 10000); bubble = start + r * 5 * f;
        if (Math.random() < Math.min(0.8, r / 15)) drops.push({ x: 106 + Math.random() * 48, y: 70 + Math.random() * 40, o: 1 });
        drops.forEach(function (d) { d.y -= 0.8; d.x += (v.wind === 'still' ? 0 : 1.2); d.o -= 0.02; }); drops = drops.filter(function (d) { return d.o > 0; });
        draw(drops); api.readings([['Bubble position', bubble.toFixed(1) + ' mm'], ['Time', (f * 5).toFixed(1) + ' min'], ['Distance moved', (bubble - start).toFixed(1) + ' mm']]);
        if (f < 1) raf = requestAnimationFrame(loop); else { api.enable('start', true); api.enable('rec', true); api.status('5 minutes done. Distance ' + (r * 5).toFixed(0) + ' mm. Press Record trial.'); }
      })();
    }
    api.actions([
      { id: 'start', label: '▶ Start (5 min)', main: true, fn: start },
      { id: 'rec', label: '➕ Record trial', fn: function () {
        if (!run) return; var v = run.v, d = Math.round(run.r * 5), vol = Math.PI * RAD * RAD * d;
        api.record({ set: WIND[v.wind][0] + ', ' + LEAF[v.leaf][0].toLowerCase(), light: v.light, T: v.T, RH: v.RH, d: d, r: +(vol / 5).toFixed(3) }); api.enable('rec', false); } },
      { id: 'reset', label: '↺ Reset bubble', fn: function () { bubble = 0; run = null; api.enable('start', true); idle(); api.status('Bubble reset to 0 mm.'); } }
    ]);
    api.onChange = function () { run = null; api.enable('start', true); idle(); };
    api.onShow = function () { draw([]); };
    api.status('Choose the conditions, then press Start.');
    idle();
  }
})();
