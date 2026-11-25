/* Hooke's law laboratory: springs, rubber bands and the elastic limit · VistaEd · by George Apidi */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var SPR = { A: ['Spring A (stiff)', 40, 0.20], B: ['Spring B (soft)', 20, 0.25], band: ['Rubber band', 0, 0.30] };   // name, k (N/m), extension at the elastic limit (m)
  var ARR = { one: 'One spring', series: 'Two springs in series', parallel: 'Two springs side by side (parallel)' };
  var g = 9.81;
  function kEff(v) { var k = SPR[v.spr][1]; return v.arr === 'series' ? k / 2 : v.arr === 'parallel' ? 2 * k : k; }
  // extension (m) for load F (N); beyond the elastic limit the spring stretches more and keeps a permanent set
  function ext(v, F, maxF) {
    if (v.spr === 'band') { var x = 0.06 * Math.log(1 + F / 0.6) + 0.004 * F * F; return v.arr === 'series' ? 2 * x : v.arr === 'parallel' ? x / 2 : x; }   // non-linear
    var k = kEff(v), lim = SPR[v.spr][2] * (v.arr === 'series' ? 2 : 1), Fl = k * lim;
    if (F <= Fl) return F / k + (maxF > Fl ? (maxF - Fl) / k * 1.5 : 0);
    return lim + (F - Fl) / k * 2.5;
  }
  LABS.hooke = {
    id: 'hooke', title: 'Hooke\'s law laboratory: springs, rubber bands and the elastic limit',
    tags: ['Physics', 'Forces and elasticity', 'MYP 3–5', 'IGCSE', 'Edexcel', 'A Level'],
    background: '<figure style="margin:0 0 10px"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Apparato_legge_di_Hooke.jpg?width=640" alt="A Hooke&#39;s law apparatus: spring, mass hanger and ruler on a stand." loading="lazy" style="max-width:100%;max-height:320px;border-radius:10px"><figcaption style="font-size:.85rem;color:#475569">A Hooke&#39;s law apparatus: spring, mass hanger and ruler on a stand. Photo: Ponscienze2019.devititriggiano, via <a href="https://commons.wikimedia.org/wiki/File:Apparato_legge_di_Hooke.jpg" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure><p>When a force stretches a spring, the <b>extension</b> x is the increase in length from its original (unstretched) length. <b>Hooke\'s law</b>: up to the <b>limit of proportionality</b>, extension is directly proportional to the force, F = kx, where k is the <b>spring constant</b> (N/m).</p>' +
      '<p>A stiffer spring has a larger k. Beyond the <b>elastic limit</b>, the spring does not return to its original length when the load is removed: it is permanently (plastically) deformed.</p>' +
      '<p>Two identical springs in <b>series</b> stretch twice as much (k halves); side by side in <b>parallel</b> they share the load (k doubles). A rubber band does not obey Hooke\'s law. The energy stored in a stretched spring is E = ½kx².</p>',
    objectives: ['Measure extension accurately with a ruler and pointer.', 'Plot a force–extension graph and find the spring constant from its gradient.', 'Identify the limit of proportionality and the elastic limit.', 'Compare springs in series and parallel, and a rubber band.'],
    rq: 'How does the extension of a spring depend on the force (load) applied to it?',
    hypPrompt: 'Predict how the extension changes as you double the load, and what happens if you load the spring too much.',
    hypothesis: { marks: 3, points: [
      { re: [/proportional|doubl|straight|linear/], marks: 1, ok: 'Proportional.', miss: 'Say extension is proportional to force (doubling the load doubles the extension).' },
      { re: [/limit|too (much|heavy)|beyond|eventually|point/], marks: 1, ok: 'A limit predicted.', miss: 'Mention the limit of proportionality or elastic limit.' },
      { re: [/permanent|not return|doesn.?t return|deform|original length/], marks: 1, ok: 'Permanent deformation.', miss: 'Explain: beyond the elastic limit the spring does not return to its original length.' }] },
    variables: { iv: 'load (weight of the masses, N)', dv: 'extension of the spring (cm)', cv: ['the same spring (material, diameter, number of coils)', 'eye level with the pointer when reading the ruler', 'the spring hangs still before reading'] },
    apparatus: ['Clamp stand, boss and clamp', 'Springs A and B, rubber band', 'Mass hanger and 50 g slotted masses', 'Metre rule with pointer fixed to the bottom of the spring', 'G-clamp to fix the stand to the bench'],
    safety: ['Clamp the stand to the bench so it cannot topple.', 'Wear eye protection: an overloaded spring can snap back.', 'Keep feet clear of the hanging masses; put a tray of sand underneath.'],
    method: ['Choose a spring and arrangement. Read the unstretched length.', 'Add the load and press <b>Measure</b>: read the pointer against the ruler at eye level.', 'Press <b>Record</b>. Increase the load in 0.5 N steps up to 10 N.', 'Press <b>Unload</b> to check whether the spring returns to its original length.', 'Repeat with spring B, the rubber band, and two springs in series and in parallel.'],
    controls: [
      { id: 'spr', label: 'Spring', type: 'select', value: 'A', options: Object.keys(SPR).map(function (k) { return [k, SPR[k][0]]; }) },
      { id: 'arr', label: 'Arrangement', type: 'select', value: 'one', options: Object.keys(ARR).map(function (k) { return [k, ARR[k]]; }) },
      { id: 'm', label: 'Load (mass on the hanger)', type: 'range', min: 0, max: 1000, step: 50, value: 100, unit: 'g' }
    ],
    columns: [
      { key: 'setup', label: 'Spring', num: false, group: true }, { key: 'F', label: 'Load', unit: 'N', dp: 2 },
      { key: 'len', label: 'Length', unit: 'cm', dp: 1 }, { key: 'x', label: 'Extension', unit: 'cm', dp: 1 }, { key: 'set', label: 'Permanent set after unloading', unit: 'cm', dp: 1 }
    ],
    graph: { x: 'F', y: 'x', group: 'setup' },
    hints: ['Extension = stretched length − original length, not the stretched length.', 'k = force ÷ extension. Convert cm to m first (divide by 100).', 'The straight part of the graph ends at the limit of proportionality.', 'Use Unload: if the length does not return to the start, you passed the elastic limit.'],
    analyse: [
      { id: 'kA', q: 'Use the gradient of your force–extension graph for spring A (one spring) to find its spring constant in N/m.', marks: 2, lines: 2, number: { value: 40, tol: 0.06, unit: 'N/m', dp: 0, hint: 'k = F ÷ x with x in metres.' } },
      { id: 'lim', q: 'At what load did spring A stop obeying Hooke\'s law? How can you tell from the graph?', marks: 2, lines: 3, points: [
        { re: [/\b8(\.\d)?\b|about 8|8 n/], marks: 1, ok: 'About 8 N.', miss: 'Read the load where the line starts to curve: about 8 N for spring A.' },
        { re: [/curve|no longer straight|steeper|bend|gradient changes|not (a )?straight/], marks: 1, ok: 'The line stops being straight.', miss: 'Say the graph stops being a straight line.' }] },
      { id: 'ser', q: 'Compare the spring constant of two springs in series and two in parallel with one spring. Explain.', marks: 3, lines: 4, points: [
        { re: [/series.*(half|halves|20|smaller|lower)|half.*series/], marks: 1, ok: 'Series: k halves.', miss: 'Series: k is half, because each spring carries the full load and both stretch.' },
        { re: [/parallel.*(double|twice|80|larger|higher)|double.*parallel/], marks: 1, ok: 'Parallel: k doubles.', miss: 'Parallel: k doubles, because each spring carries half the load.' },
        { re: [/each (spring )?(carries|takes|has)|share|half the (load|force)|full (load|force)/], marks: 1, ok: 'Load sharing explained.', miss: 'Explain how the load is shared.' }] },
      { id: 'energy', q: 'Calculate the energy stored in spring A when it is stretched by 10 cm.', marks: 1, lines: 1, number: { value: 0.2, tol: 0.03, unit: 'J', dp: 2 } },
      { id: 'band', q: 'Does the rubber band obey Hooke\'s law? Use your graph.', marks: 2, lines: 3, points: [
        { re: [/\bno\b|does not|doesn.?t|not obey/], marks: 1, ok: 'No.', miss: 'State that it does not obey Hooke\'s law.' },
        { re: [/curve|not (a )?straight|not proportional|non.?linear/], marks: 1, ok: 'Graph is curved.', miss: 'Give the reason: the force–extension graph is not a straight line.' }] }
    ],
    evaluate: [
      { id: 'err', q: 'Give two ways to make the extension readings more accurate.', marks: 2, lines: 3, points: [
        { re: [/eye level|parallax/], marks: 1, ok: 'Parallax.', miss: 'Read at eye level to avoid parallax error.' },
        { re: [/pointer|still|stop (moving|bouncing)|fiducial|set square|vertical|repeat|unload/], marks: 1, ok: 'A second improvement.', miss: 'Use a pointer, wait until the spring is still, or repeat while unloading.' }] },
      { id: 'lim2', q: 'Give one simplification in this model.', marks: 1, lines: 2, points: [
        { re: [/mass of (the )?spring|identical|perfect|ideal|temperature|no (noise|error)|instant|uniform/], marks: 1, ok: 'A valid simplification.', miss: 'For example: the mass of the spring is ignored, and all springs of a type are identical.' }] }
    ],
    model: '<ul><li>Spring A: k = 40 N/m, limit of proportionality at 0.20 m (8.0 N). Spring B: k = 20 N/m, limit at 0.25 m (5.0 N). g = 9.81 N/kg.</li><li>Beyond the limit the extension grows 2.5× faster, and after unloading the spring keeps a permanent set of 1.5 × (F<sub>max</sub> − F<sub>limit</sub>) ÷ k.</li>' +
      '<li>Series: k ÷ 2 (and the limit at twice the extension); parallel: 2k. Rubber band: x = 0.06 ln(1 + F/0.6) + 0.004F² (illustrative, non-linear). Readings to ±1 mm.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var maxF = 0, shown = 0, target = 0, raf = 0, L0 = 10;
    api.stage.innerHTML = '<svg viewBox="0 0 420 300" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Spring hanging from a clamp stand beside a metre rule" id="hk-sv"></svg>';
    var sv = api.stage.querySelector('#hk-sv');
    function F() { return api.vals().m / 1000 * g; }
    function coil(x, y0, y1, n) { var h = 'M' + x + ',' + y0, dy = (y1 - y0) / (n * 2); for (var i = 0; i < n * 2; i++) h += ' L' + (x + (i % 2 ? -9 : 9)) + ',' + (y0 + dy * (i + 1)); return '<path d="' + h + '" fill="none" stroke="#475569" stroke-width="2"/>'; }
    function draw() {
      var v = api.vals(), px = 2.4, h = '';   // px per cm
      h += '<rect x="20" y="285" width="200" height="8" fill="#94a3b8"/><rect x="40" y="10" width="8" height="278" fill="#64748b"/><rect x="40" y="16" width="160" height="7" fill="#64748b"/>';
      h += '<rect x="270" y="20" width="22" height="270" fill="#fef9c3" stroke="#a16207"/>';
      for (var c = 0; c <= 100; c += 5) { var y = 30 + c * px; if (y > 285) break; h += '<line x1="270" y1="' + y + '" x2="' + (c % 10 ? 278 : 284) + '" y2="' + y + '" stroke="#a16207"/>' + (c % 10 ? '' : '<text x="296" y="' + (y + 4) + '" font-size="9">' + c + '</text>'); }
      var top = 30, len = L0 + shown * 100, bottom = top + len * px, xs = v.arr === 'parallel' ? [140, 180] : [160];
      xs.forEach(function (x) {
        if (v.spr === 'band') h += '<path d="M' + x + ',' + top + ' L' + (x - 4) + ',' + bottom + ' L' + (x + 4) + ',' + bottom + ' Z" fill="#fca5a5" stroke="#b91c1c"/>';
        else if (v.arr === 'series') { var mid = (top + bottom) / 2; h += coil(x, top, mid - 3, 8) + '<circle cx="' + x + '" cy="' + mid + '" r="3" fill="#334155"/>' + coil(x, mid + 3, bottom, 8); }
        else h += coil(x, top, bottom, 12);
      });
      if (v.arr === 'parallel') h += '<rect x="132" y="' + bottom + '" width="56" height="4" fill="#334155"/>';
      h += '<line x1="160" y1="' + bottom + '" x2="160" y2="' + (bottom + 12) + '" stroke="#334155" stroke-width="2"/><line x1="160" y1="' + (bottom + 4) + '" x2="268" y2="' + (bottom + 4) + '" stroke="#dc2626" stroke-width="1.5"/>';
      var nm = Math.round(v.m / 50); h += '<rect x="150" y="' + (bottom + 12) + '" width="20" height="' + Math.max(4, Math.min(80, nm * 4)) + '" fill="#78716c" stroke="#292524"/>';
      h += '<text x="340" y="60" font-size="12" font-weight="700">' + (F()).toFixed(2) + ' N</text><text x="340" y="76" font-size="10" fill="#475569">load</text>';
      h += '<text x="340" y="110" font-size="12" font-weight="700">' + (shown * 100).toFixed(1) + ' cm</text><text x="340" y="126" font-size="10" fill="#475569">extension</text>';
      sv.innerHTML = h;
    }
    function animate() { cancelAnimationFrame(raf); (function step() { var d = target - shown; shown += d * 0.15 + (Math.abs(d) > 0.0005 ? Math.sin(performance.now() / 70) * 0.0008 * Math.min(1, Math.abs(d) * 50) : 0); draw(); if (Math.abs(d) > 0.0003) raf = requestAnimationFrame(step); else { shown = target; draw(); } })(); }
    function load() { var f = F(); maxF = Math.max(maxF, f); target = Math.min(1.0, ext(api.vals(), f, maxF)); animate(); api.readings([['Load', f.toFixed(2) + ' N'], ['Length', (L0 + target * 100).toFixed(1) + ' cm'], ['Extension', (target * 100).toFixed(1) + ' cm'], ['Original length', L0.toFixed(1) + ' cm']]); }
    function rd(x) { return Math.round(x * 1000) / 10; }   // to the nearest mm, in cm
    api.actions([
      { id: 'rec', label: '➕ Measure and record', main: true, fn: function () { var v = api.vals(); api.record({ setup: SPR[v.spr][0] + ', ' + ARR[v.arr].toLowerCase(), F: +F().toFixed(3), len: +(L0 + rd(target)).toFixed(1), x: rd(target), set: null }); } },
      { id: 'un', label: '↺ Unload', fn: function () { var v = api.vals(), set = Math.max(0, ext(v, 0, maxF)); target = set; animate(); api.status('Unloaded. Permanent set: ' + rd(set).toFixed(1) + ' cm' + (set > 0.0005 ? ' — the spring passed its elastic limit.' : ' — it returned to its original length.')); if (api.trials().length) { var t = api.trials(); t[t.length - 1].set = rd(set); } } },
      { id: 'new', label: '🆕 New spring', fn: function () { maxF = 0; load(); api.status('A fresh spring is hanging. Add load and record.'); } }
    ]);
    api.onChange = function (v, id) { if (id === 'spr' || id === 'arr') maxF = 0; load(); };
    api.onShow = function () { draw(); };
    api.status('Set the load, then press Measure and record. Use Unload to test the elastic limit.');
    load();
  }
})();
