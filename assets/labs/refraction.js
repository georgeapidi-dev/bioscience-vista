/* Refraction laboratory: Snell's law, refractive index and total internal reflection · VistaEd · by George Apidi */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var MAT = { glass: ['Glass block', 1.52], perspex: ['Perspex (acrylic) block', 1.49], water: ['Water in a clear box', 1.33], diamond: ['Diamond (simulated)', 2.42] };
  var D = Math.PI / 180;
  function result(v) {   // angles in degrees; dir 'in' = air → material through the flat face; 'out' = material → air (semicircular block)
    var n = MAT[v.mat][1], i = v.i * D;
    if (v.dir === 'in') { var r = Math.asin(Math.sin(i) / n); return { r: r / D, tir: false, n: n, c: Math.asin(1 / n) / D }; }
    var s = n * Math.sin(i); if (s >= 1) return { r: null, tir: true, n: n, c: Math.asin(1 / n) / D };
    return { r: Math.asin(s) / D, tir: false, n: n, c: Math.asin(1 / n) / D };
  }
  function reflectFrac(v, res) {   // Fresnel (unpolarised) for the brightness of the reflected ray
    if (res.tir) return 1; var n1 = v.dir === 'in' ? 1 : res.n, n2 = v.dir === 'in' ? res.n : 1, a = v.i * D, b = res.r * D, ca = Math.cos(a), cb = Math.cos(b);
    var rs = Math.pow((n1 * ca - n2 * cb) / (n1 * ca + n2 * cb), 2), rp = Math.pow((n1 * cb - n2 * ca) / (n1 * cb + n2 * ca), 2); return (rs + rp) / 2;
  }
  LABS.refraction = {
    id: 'refraction', title: 'Refraction laboratory: Snell\'s law and total internal reflection',
    tags: ['Physics', 'Light and waves', 'MYP 3–5', 'IGCSE', 'Edexcel', 'IB DP C.2', 'A Level'],
    background: '<figure style="margin:0 0 10px"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Refraction_photo.png?width=640" alt="A real ray of light refracting as it enters and leaves a plastic block." loading="lazy" style="max-width:100%;max-height:320px;border-radius:10px"><figcaption style="font-size:.85rem;color:#475569">A real ray of light refracting as it enters and leaves a plastic block. Photo: aj, via <a href="https://commons.wikimedia.org/wiki/File:Refraction_photo.png" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure><p>Light changes speed when it crosses a boundary between two materials, so it changes direction: <b>refraction</b>. Angles are measured from the <b>normal</b>, a line at 90° to the surface.</p>' +
      '<p>Going into a denser medium (air → glass) light slows down and bends <b>towards</b> the normal. <b>Snell\'s law</b>: n = sin i ÷ sin r, where n is the <b>refractive index</b> (n = speed of light in a vacuum ÷ speed in the material).</p>' +
      '<p>Going from glass into air, light bends <b>away</b> from the normal. At the <b>critical angle</b> c the refracted ray runs along the surface; sin c = 1/n. Above c, all the light is reflected: <b>total internal reflection</b>, used in optical fibres and endoscopes.</p>',
    objectives: ['Measure angles of incidence and refraction with a protractor from the normal.', 'Plot sin i against sin r and find the refractive index from the gradient.', 'Measure the critical angle and check sin c = 1/n.', 'Explain total internal reflection and its uses.'],
    rq: 'How does the angle of refraction depend on the angle of incidence when light enters a glass block?',
    hypPrompt: 'Predict how the angle of refraction compares with the angle of incidence for light entering glass, and explain why.',
    hypothesis: { marks: 3, points: [
      { re: [/smaller|less|towards (the )?normal/], marks: 1, ok: 'Refraction angle is smaller.', miss: 'Say the angle of refraction is smaller than the angle of incidence (bends towards the normal).' },
      { re: [/slow|speed/], marks: 1, ok: 'Speed change used.', miss: 'Explain: light slows down in glass.' },
      { re: [/sin|ratio|constant|snell|increase/], marks: 1, ok: 'Relationship given.', miss: 'Say both angles increase together, with sin i ÷ sin r constant.' }] },
    variables: { iv: 'angle of incidence i (°)', dv: 'angle of refraction r (°)', cv: ['the same block and the same face', 'a narrow single ray from the ray box', 'angles measured from the normal'] },
    apparatus: ['Ray box with single slit and power supply', 'Rectangular and semicircular glass blocks', 'Protractor and sharp pencil', 'Plain paper and ruler', 'Darkened room'],
    safety: ['The ray box lamp gets hot: do not touch the hood.', 'Do not look directly into the ray box.', 'Carry glass blocks with two hands; report chips or cracks.'],
    method: ['Choose the material and the direction of the ray.', 'Set the angle of incidence with the slider.', 'Press <b>Measure</b>: read the refracted angle on the protractor.', 'Press <b>Record</b>. Repeat for 10° to 80° in 10° steps.', 'For the critical angle, choose <i>material → air</i> and raise i slowly until the refracted ray just disappears.'],
    controls: [
      { id: 'mat', label: 'Material', type: 'select', value: 'glass', options: Object.keys(MAT).map(function (k) { return [k, MAT[k][0]]; }) },
      { id: 'dir', label: 'Direction of the ray', type: 'select', value: 'in', options: [['in', 'Air → material (flat face)'], ['out', 'Material → air (semicircular block)']] },
      { id: 'i', label: 'Angle of incidence', type: 'range', min: 0, max: 85, step: 1, value: 30, unit: '°' }
    ],
    columns: [
      { key: 'mat', label: 'Material', num: false, group: true }, { key: 'dir', label: 'Direction', num: false },
      { key: 'i', label: 'Angle i', unit: '°', dp: 0 }, { key: 'r', label: 'Angle r', unit: '°', dp: 0 },
      { key: 'sini', label: 'sin i', dp: 3 }, { key: 'sinr', label: 'sin r', dp: 3 }, { key: 'ratio', label: 'sin i ÷ sin r', dp: 2 }
    ],
    graph: { x: 'sinr', y: 'sini', group: 'mat' },
    hints: ['Measure angles from the normal, never from the surface.', 'Plot sin i (y) against sin r (x): the gradient is the refractive index.', 'Going out of the block, use n = sin r ÷ sin i (r is the angle in air).', 'The critical angle is where the refracted angle reaches 90°.'],
    analyse: [
      { id: 'n', q: 'Use the gradient of your sin i against sin r graph to find the refractive index of glass.', marks: 2, lines: 2, number: { value: 1.52, tol: 0.03, dp: 2 } },
      { id: 'trend', q: 'Describe how the angle of refraction changes as the angle of incidence increases, with values.', marks: 2, lines: 3, points: [
        { re: [/increas|rises|bigger/], marks: 1, ok: 'Both increase.', miss: 'State that r increases as i increases.' },
        { re: [/\d/], marks: 1, ok: 'Values quoted.', miss: 'Quote values from your table.' }] },
      { id: 'crit', q: 'Measure the critical angle for glass. Check it with sin c = 1/n.', marks: 2, lines: 2, number: { value: 41.1, abs: 1.2, tol: 0, unit: '°', dp: 1 } },
      { id: 'speed', q: 'Calculate the speed of light in glass (speed in air = 3.00 × 10⁸ m/s). Give the answer in units of 10⁸ m/s.', marks: 1, lines: 1, number: { value: 1.97, tol: 0.02, unit: '× 10⁸ m/s', dp: 2 } },
      { id: 'tir', q: 'Explain the two conditions for total internal reflection, and give one use.', marks: 3, lines: 4, points: [
        { re: [/denser|higher (refractive )?index|glass (to|into) air|inside|leaving/], marks: 1, ok: 'From the denser medium.', miss: 'Light must travel from the denser medium towards the less dense one (glass → air).' },
        { re: [/greater than (the )?critical|above (the )?critical|bigger than (the )?critical|exceed/], marks: 1, ok: 'Above the critical angle.', miss: 'The angle of incidence must be greater than the critical angle.' },
        { re: [/fibre|fiber|endoscop|periscope|prism|binocular|reflector|cat.?s eye|diamond|internet|broadband/], marks: 1, ok: 'A use given.', miss: 'Give a use: optical fibres, endoscopes, prism periscopes.' }] }
    ],
    evaluate: [
      { id: 'err', q: 'Give two sources of error when measuring angles with a real ray box, and how to reduce them.', marks: 2, lines: 4, points: [
        { re: [/wide|thick|beam|narrow|slit/], marks: 1, ok: 'Ray width.', miss: 'A wide ray is hard to centre: use a narrow slit and mark the middle of the ray.' },
        { re: [/protractor|normal|pencil|mark|dark|faint|parallax|line up|repeat/], marks: 1, ok: 'A second source.', miss: 'Draw the normal accurately, mark rays with crosses far apart, repeat readings.' }] },
      { id: 'lim', q: 'Give one simplification in this model.', marks: 1, lines: 2, points: [
        { re: [/one (colour|wavelength)|dispersion|white light|perfect|precise|exact|no error|absor|reflect/], marks: 1, ok: 'A valid simplification.', miss: 'For example: one wavelength only (no dispersion), and angles are exact to 1°.' }] }
    ],
    model: '<ul><li>Snell\'s law n₁ sin θ₁ = n₂ sin θ₂ with n(glass) = 1.52, perspex 1.49, water 1.33, diamond 2.42, air 1.00.</li><li>Critical angle c = sin⁻¹(1/n): glass 41.1°, perspex 42.2°, water 48.8°, diamond 24.4°.</li>' +
      '<li>The brightness of the partly reflected ray follows the Fresnel equations for unpolarised light. The protractor reads to the nearest degree.</li></ul>',
    setup: setup
  };

  function setup(api) {
    api.stage.innerHTML = '<svg viewBox="0 0 420 300" style="width:100%;height:auto;background:#0f172a;border-radius:12px" role="img" aria-label="Ray of light refracting at a block, with protractor" id="rf-sv"></svg>';
    var sv = api.stage.querySelector('#rf-sv'), cx = 210, cy = 150, R = 125;
    function pt(angDeg, len, below) { var a = angDeg * D; return [cx + (below ? 1 : -1) * len * Math.sin(a), cy + (below ? 1 : -1) * len * Math.cos(a)]; }
    function draw() {
      var v = api.vals(), res = result(v), h = '', inB = v.dir === 'in';
      if (inB) h += '<rect x="40" y="' + cy + '" width="340" height="140" fill="rgba(147,197,253,.28)" stroke="#93c5fd"/>';
      else h += '<path d="M' + (cx - 120) + ',' + cy + ' A120,120 0 0 1 ' + (cx + 120) + ',' + cy + ' Z" fill="rgba(147,197,253,.28)" stroke="#93c5fd"/>';
      for (var a = 0; a < 360; a += 10) { var p1 = [cx + (R + 6) * Math.cos(a * D), cy + (R + 6) * Math.sin(a * D)], p2 = [cx + (R + (a % 30 ? 10 : 14)) * Math.cos(a * D), cy + (R + (a % 30 ? 10 : 14)) * Math.sin(a * D)]; h += '<line x1="' + p1[0] + '" y1="' + p1[1] + '" x2="' + p2[0] + '" y2="' + p2[1] + '" stroke="#64748b"/>'; }
      h += '<line x1="' + cx + '" y1="12" x2="' + cx + '" y2="288" stroke="#cbd5e1" stroke-dasharray="5 4"/><text x="' + (cx + 4) + '" y="22" font-size="10" fill="#cbd5e1">normal</text>';
      var s = pt(v.i, R, false), rf = reflectFrac(v, res), col = '#fde047';
      h += '<line x1="' + s[0] + '" y1="' + s[1] + '" x2="' + cx + '" y2="' + cy + '" stroke="' + col + '" stroke-width="3"/>';
      var rp = [cx + R * Math.sin(v.i * D), cy - R * Math.cos(v.i * D)];
      h += '<line x1="' + cx + '" y1="' + cy + '" x2="' + rp[0] + '" y2="' + rp[1] + '" stroke="' + col + '" stroke-width="' + (0.6 + 2.4 * rf) + '" opacity="' + (0.25 + 0.75 * rf) + '"/>';
      if (!res.tir) { var q = pt(res.r, R, true); h += '<line x1="' + cx + '" y1="' + cy + '" x2="' + q[0] + '" y2="' + q[1] + '" stroke="' + col + '" stroke-width="' + (3 * (1 - rf) + 0.5) + '"/>'; }
      h += '<path d="M' + cx + ',' + (cy - 40) + ' A40,40 0 0 0 ' + (cx - 40 * Math.sin(v.i * D)) + ',' + (cy - 40 * Math.cos(v.i * D)) + '" fill="none" stroke="#f472b6" stroke-width="1.5"/><text x="' + (cx - 30) + '" y="' + (cy - 46) + '" font-size="11" fill="#f472b6">i</text>';
      if (!res.tir) h += '<path d="M' + cx + ',' + (cy + 40) + ' A40,40 0 0 0 ' + (cx + 40 * Math.sin(res.r * D)) + ',' + (cy + 40 * Math.cos(res.r * D)) + '" fill="none" stroke="#34d399" stroke-width="1.5"/><text x="' + (cx + 14) + '" y="' + (cy + 56) + '" font-size="11" fill="#34d399">r</text>';
      h += '<text x="12" y="20" font-size="11" fill="#e2e8f0">' + (inB ? 'air' : MAT[v.mat][0].split(' (')[0].toLowerCase()) + '</text><text x="12" y="' + (cy + 20) + '" font-size="11" fill="#e2e8f0">' + (inB ? MAT[v.mat][0].split(' (')[0].toLowerCase() : 'air') + '</text>';
      if (res.tir) h += '<text x="' + cx + '" y="285" font-size="13" fill="#fca5a5" text-anchor="middle" font-weight="700">Total internal reflection</text>';
      sv.innerHTML = h;
      api.readings([['Angle of incidence', v.i + '°'], ['Angle of refraction', res.tir ? '— (TIR)' : Math.round(res.r) + '°'], ['Reflected light', Math.round(rf * 100) + ' %'], ['sin i ÷ sin r', res.tir || !v.i ? '—' : (inB ? Math.sin(v.i * D) / Math.sin(Math.round(res.r) * D) : Math.sin(Math.round(res.r) * D) / Math.sin(v.i * D)).toFixed(2)]]);
    }
    api.actions([{ id: 'rec', label: '➕ Measure and record', main: true, fn: function () {
      var v = api.vals(), res = result(v), r = res.tir ? null : Math.round(res.r), si = Math.sin(v.i * D), sr = r == null ? null : Math.sin(r * D);
      api.record({ mat: MAT[v.mat][0], dir: v.dir === 'in' ? 'air → material' : 'material → air', i: v.i, r: r, sini: +si.toFixed(4), sinr: sr == null ? null : +sr.toFixed(4), ratio: sr && si ? +(v.dir === 'in' ? si / sr : sr / si).toFixed(3) : null });
      if (res.tir) api.status('Recorded: total internal reflection at i = ' + v.i + '°. No refracted ray.');
    } }]);
    api.onChange = function () { draw(); };
    api.onShow = function () { draw(); };
    api.status('Move the angle of incidence and watch both the refracted and the reflected ray.');
    draw();
  }
})();
