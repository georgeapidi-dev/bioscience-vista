/* Osmosis and diffusion laboratory · Learnova · by George Apidi */
(function () {
  var M = window.LABM, LABS = window.LABS = window.LABS || {};
  LABS.osmosis = {
    id: 'osmosis', title: 'Osmosis laboratory: plant and animal cells',
    tags: ['Biology', 'Cell biology', 'MYP 3–5', 'IB DP B2.1', 'IGCSE', 'A Level'],
    background: '<p><b>Diffusion</b> is the net movement of particles from a higher to a lower concentration, by random motion. <b>Osmosis</b> is the diffusion of <b>water</b> across a partially permeable membrane.</p>' +
      '<p>Scientists describe the tendency of water to move with <b>water potential</b> (Ψ, in kPa). Pure water has Ψ = 0; dissolving solutes makes Ψ negative. Water always moves from a higher (less negative) to a lower (more negative) water potential.</p>' +
      '<p>A <b>plant cell</b> has a strong cellulose wall. When water enters, the cell pushes on the wall and becomes <b>turgid</b>; the wall stops it bursting. In a concentrated solution the cell loses water, becomes <b>flaccid</b>, and the membrane pulls away from the wall: <b>plasmolysis</b>.</p>' +
      '<p>An <b>animal cell</b> such as a red blood cell has no wall. In pure water it swells and bursts (<b>haemolysis</b>); in a concentrated solution it shrinks and crinkles (<b>crenation</b>).</p>' +
      '<p>When the solution outside has the same water potential as the cell, there is no net movement: the solution is <b>isotonic</b>.</p>',
    objectives: ['Predict the direction of water movement using water potential.', 'Measure the percentage change in cell volume in sucrose solutions of different concentrations.', 'Estimate the isotonic concentration of a tissue from a graph.', 'Explain why plant cells become turgid but red blood cells burst.'],
    rq: 'How does the concentration of sucrose solution (0 to 1.0 mol/dm³) affect the percentage change in volume of plant cells (potato tissue)?',
    hypPrompt: 'Predict what happens to the volume of potato cells in pure water and in 1.0 mol/dm³ sucrose, and explain using the words water potential or concentration and osmosis.',
    hypothesis: { marks: 3, points: [
      { re: [/\bif\b.*\bthen\b|\bas\b.*(increase|decrease)/], marks: 1, ok: 'Clear prediction.', miss: 'Write the prediction as "If … then …".' },
      { re: [/(water|pure).*(gain|increase|swell|bigger|turgid|enter)|(gain|increase|swell).*water/], marks: 1, ok: 'Cells gain water in dilute solutions.', miss: 'Predict what happens in pure water (volume increases).' },
      { re: [/water potential|osmosis|partially permeable|concentration gradient|higher.*lower|dilute.*concentrated/], marks: 1, ok: 'You give a scientific reason.', miss: 'Explain with osmosis: water moves from higher to lower water potential across the membrane.' }],
      wrong: [{ re: /(sugar|sucrose|salt|solute)s? (move|moves|diffuse|go|goes|enter)/, msg: 'In osmosis it is water that crosses the membrane, not the sugar.' }] },
    variables: { iv: 'concentration of the sucrose solution (mol/dm³)', dv: 'percentage change in cell volume after 30 minutes (in a real lab: % change in mass of potato cylinders)',
      cv: ['temperature (20 °C)', 'membrane permeability (normal)', 'time in solution (30 minutes)', 'same type of tissue (potato)', 'volume of solution'] },
    apparatus: ['Potato, cork borer and ruler (for cylinders of equal size)', 'Sucrose solutions 0, 0.2, 0.4, 0.6, 0.8 and 1.0 mol/dm³', 'Boiling tubes and rack, labels', 'Paper towel to blot cylinders', 'Balance (±0.01 g), stopwatch', 'Microscope, slides and red onion or blood cell images for the cell views'],
    safety: ['Cut away from your body with the cork borer and knife, on a tile.', 'Wipe up spills of sugar solution so nobody slips.', 'Do not taste any solution in the laboratory.'],
    method: ['Choose <b>Plant cell (potato)</b>. Leave permeability at 1.0 and temperature at 20 °C.', 'Set the sucrose concentration and press <b>Start</b>. The cell sits in the solution for 30 minutes (shown faster).', 'Press <b>Record trial</b> to add the % volume change to your table. Repeat each concentration.', 'Use at least six concentrations from 0 to 1.0 mol/dm³.', 'Plot % change against concentration. Where the line crosses 0 % is the isotonic concentration.', 'Then try the <b>red blood cell</b>, and change permeability or temperature to see how the <i>rate</i> changes.'],
    controls: [
      { id: 'cell', label: 'Cell', type: 'select', value: 'plant', options: [['plant', 'Plant cell (potato tissue)'], ['animal', 'Animal cell (red blood cell)']] },
      { id: 'C', label: 'Sucrose concentration outside', min: 0, max: 1, step: 0.05, value: 0.4, unit: 'mol/dm³', dp: 2 },
      { id: 'perm', label: 'Membrane water permeability (relative; aquaporins)', min: 0.2, max: 2, step: 0.1, value: 1, dp: 1 },
      { id: 'T', label: 'Temperature', min: 5, max: 40, step: 1, value: 20, unit: '°C' }
    ],
    columns: [
      { key: 'cell', label: 'Cell', num: false, group: true }, { key: 'C', label: 'Sucrose', unit: 'mol/dm³', dp: 2 }, { key: 'perm', label: 'Permeability', dp: 1 },
      { key: 'T', label: 'Temperature', unit: '°C', dp: 0 }, { key: 'mins', label: 'Time', unit: 'min', dp: 0 }, { key: 'pc', label: 'Volume change', unit: '%', dp: 1 },
      { key: 'half', label: 'Time to half change', unit: 'min', dp: 1 }, { key: 'state', label: 'Cell state', num: false }, { key: 'psiOut', label: 'Ψ outside', unit: 'kPa', dp: 0 }
    ],
    graph: { x: 'C', y: 'pc', group: 'cell' },
    hints: ['Water moves from a dilute solution (high water potential) into a more concentrated one (lower water potential).', 'Record the 0 mol/dm³ trial first: the cell should gain water.', 'The isotonic point is where the line crosses 0 % change. Read it from the x-axis.', 'Changing permeability or temperature changes how fast water moves, not where it ends up. Compare the "time to half change" column.'],
    analyse: [
      { id: 'iso', q: 'Use your plant-cell results to estimate the isotonic sucrose concentration (where there is no change in volume).', marks: 2, lines: 1,
        number: { value: function (c) { return isotonic(c.trials); }, abs: 0.05, tol: 0, unit: 'mol/dm³', dp: 2, missing: 'Record plant-cell trials on both sides of 0 % change first.', hint: 'Find where your line crosses 0 % on the x-axis.' } },
      { id: 'dir', q: 'Explain why the potato cells increased in volume in 0.1 mol/dm³ sucrose but decreased in 0.8 mol/dm³.', marks: 4, lines: 5, points: [
        { re: [/water potential|concentration/], marks: 1, ok: 'You use water potential / concentration.', miss: 'Compare the water potential (or solute concentration) inside and outside.' },
        { re: [/higher.*(outside|solution).*(0\.1|dilute)|0\.1.*higher|dilute.*(higher water potential|into the cell|enter)|water (moves|enters|goes) in/], marks: 1, ok: 'Water enters in the dilute solution.', miss: 'In 0.1 mol/dm³ the solution has a higher water potential than the cell, so water enters.' },
        { re: [/0\.8.*(lower|leaves|out)|(leaves|moves out|lost).*0\.8|concentrated.*(leave|out|lose)|water (moves|leaves|goes) out/], marks: 1, ok: 'Water leaves in the concentrated solution.', miss: 'In 0.8 mol/dm³ the solution has a lower water potential, so water leaves.' },
        { re: [/osmosis/], marks: 1, ok: 'You name osmosis.', miss: 'Name the process: osmosis across the partially permeable membrane.' }],
        wrong: [{ re: /(sugar|sucrose|solute)s? (move|moves|diffus|enter|went|go)/, msg: 'Sucrose does not cross the membrane in this model; only water moves.', minus: 1 }] },
      { id: 'burst', q: 'In pure water the red blood cell bursts but the plant cell does not. Explain why.', marks: 3, lines: 4, points: [
        { re: [/cell wall|cellulose/], marks: 1, ok: 'The cell wall is the key.', miss: 'Mention the cellulose cell wall.' },
        { re: [/pressure|turgid|turgor|pushes|resist/], marks: 1, ok: 'Wall pressure stops further water entry.', miss: 'Explain that the wall pushes back (turgor / wall pressure), so the cell becomes turgid.' },
        { re: [/no (cell )?wall|lack|without|does not have|doesn\'t have/], marks: 1, ok: 'The animal cell has no wall.', miss: 'Say that the red blood cell has no wall, so it keeps swelling until the membrane breaks (haemolysis).' }] },
      { id: 'concl', q: 'Write a conclusion answering the research question. Include your isotonic concentration and figures from your table.', marks: 3, lines: 4, points: [
        { re: [/\d/], marks: 1, ok: 'You quote data.', miss: 'Quote values from your table.' },
        { re: [/(as|when).*concentration (increase|rise).*(decrease|smaller|less|fall)|higher concentration.*(decrease|loss|lose)|negative correlation/], marks: 1, ok: 'You state the trend.', miss: 'State the trend: as the concentration increases, the % change in volume decreases.' },
        { re: [/isotonic|no (net )?change|0 ?%/], marks: 1, ok: 'You include the isotonic point.', miss: 'Include the isotonic concentration.' }] }
    ],
    evaluate: [
      { id: 'pc', q: 'Why do scientists record percentage change instead of the final volume or mass?', marks: 2, lines: 3, points: [
        { re: [/different (starting|initial|start)|not (all )?the same (size|mass)|start(ing)? (mass|size|volume)/], marks: 1, ok: 'Samples start at different sizes.', miss: 'The pieces do not all start at the same mass or volume.' },
        { re: [/compar/], marks: 1, ok: 'Percentage change lets you compare.', miss: 'Percentage change allows a fair comparison.' }] },
      { id: 'lim', q: 'Give one source of error in the real potato experiment that this model does not have, and how to reduce it.', marks: 2, lines: 3, points: [
        { re: [/blot|dry|surface water|towel/], marks: 1, ok: 'Surface water is a real error.', miss: 'For example: water left on the surface; blot every cylinder in the same way.' },
        { re: [/size|cut|cork borer|same length|surface area|balance|precision|evaporat|cover/], marks: 1, ok: 'A second control or improvement.', miss: 'Mention cutting identical cylinders, or covering tubes to stop evaporation.' }] },
      { id: 'rate', q: 'You changed the permeability or temperature. Did it change the final % change, the rate, or both? Use your table.', marks: 2, lines: 3, points: [
        { re: [/rate|faster|slower|quicker|time to half|speed/], marks: 1, ok: 'You comment on the rate.', miss: 'Compare the "time to half change": the rate changes.' },
        { re: [/(final|end|equilibrium).*(same|similar|not change|unchanged)|same (final|end)/], marks: 1, ok: 'The end point stays the same.', miss: 'State that the final change (equilibrium) is the same, because it depends on the water potentials.' }] }
    ],
    model: '<ul><li>Water flux J = L<sub>p</sub> × (Ψ<sub>outside</sub> − Ψ<sub>cell</sub>), where L<sub>p</sub> is the membrane\'s water permeability.</li>' +
      '<li>Solute potential is calculated from the van \'t Hoff equation ψ<sub>s</sub> = −CRT (C in mol/dm³, R = 8.314, T in K, giving kPa). Sucrose cannot cross the membrane.</li>' +
      '<li>The cell contents equal 0.40 mol/dm³ (potato) or 0.30 mol/dm³ (red blood cell). About 30 % of a cell\'s volume is solid material that does not change.</li>' +
      '<li>Plant cell: the wall acts like a stiff spring (elastic modulus 3 MPa). Above its relaxed size, pressure potential rises; below it, the protoplast pulls away from the wall (plasmolysis) and pressure potential is 0.</li>' +
      '<li>Red blood cell: no wall, pressure potential 0. It bursts at 1.6 times its starting volume. Its membrane is about 10 times more permeable to water than potato cells, so it reaches equilibrium in minutes.</li>' +
      '<li>Permeability rises about 2.4 % per °C (water is less viscous when warm). Temperature hardly changes the final volume.</li>' +
      '<li>Real potato cylinders also lose or gain water through damaged cells and surface films, so real results scatter more.</li></ul>',
    setup: setup
  };

  function isotonic(trials) {
    var by = {}; trials.filter(function (t) { return t.cell === 'plant'; }).forEach(function (t) { (by[t.C] = by[t.C] || []).push(t.pc); });
    var pts = Object.keys(by).map(function (c) { var a = by[c]; return [+c, a.reduce(function (s, v) { return s + v; }, 0) / a.length]; }).sort(function (a, b) { return a[0] - b[0]; });
    for (var i = 1; i < pts.length; i++) if (pts[i - 1][1] >= 0 && pts[i][1] <= 0) { var a = pts[i - 1], b = pts[i]; return a[1] === b[1] ? a[0] : a[0] + (b[0] - a[0]) * a[1] / (a[1] - b[1]); }
    return null;
  }

  function setup(api) {
    var fx = api.fx;
    api.stage.innerHTML = '<svg id="os-sv" viewBox="0 0 520 280" style="width:100%;height:auto;background:#f4f7fb;border-radius:12px" role="img" aria-label="Cell in solution"></svg><canvas class="vl-chart" id="os-ch" style="height:210px"></canvas>';
    var sv = api.stage.querySelector('#os-sv'), ch = api.stage.querySelector('#os-ch'), raf = null, run = null, last = null;
    function o() { var v = api.vals(); return { cell: v.cell, Cout: v.C, perm: v.perm, T: v.T, minutes: v.cell === 'plant' ? 30 : 5 }; }
    function stateOf(r, cell) {
      if (cell === 'animal') return r.burst ? 'burst (haemolysis)' : r.change > 3 ? 'swollen' : r.change < -3 ? 'shrunken (crenated)' : 'normal';
      return r.plasmolysed ? 'plasmolysed' : r.change > 1 ? 'turgid' : r.change < -1 ? 'flaccid' : 'unchanged';
    }
    function draw(V, cell, psiCell, psiOut, burst) {
      var water = Math.max(0, Math.min(1, 1 - api.vals().C)), bg = 'rgb(' + Math.round(255 - 60 * (1 - water)) + ',' + Math.round(250 - 20 * (1 - water)) + ',' + Math.round(255 - 140 * (1 - water)) + ')';
      var h = '<rect x="0" y="0" width="520" height="280" fill="' + bg + '"/><text x="12" y="20" font-size="13" fill="#334155">Outside: ' + fx(api.vals().C, 2) + ' mol/dm³ sucrose · Ψ = ' + fx(psiOut, 0) + ' kPa</text>';
      var cx = 200, cy = 150;
      if (cell === 'plant') {
        var Vw = 1 - 300 / 3000, s = Math.sqrt(Math.max(V, 0.33) / 1), wallS = Math.sqrt(Math.max(V, Vw) / 1);
        var w = 200 * wallS, hh = 130 * wallS, pw = 196 * s * (V < Vw ? 0.98 : 1), ph = 126 * s * (V < Vw ? 0.98 : 1);
        h += '<rect x="' + (cx - w / 2 - 6) + '" y="' + (cy - hh / 2 - 6) + '" width="' + (w + 12) + '" height="' + (hh + 12) + '" rx="6" fill="#c8e6c9" stroke="#2e7d32" stroke-width="5"/>';
        h += '<rect x="' + (cx - pw / 2) + '" y="' + (cy - ph / 2) + '" width="' + pw + '" height="' + ph + '" rx="' + (V < Vw ? 30 : 6) + '" fill="#e8f5e9" stroke="#1b5e20" stroke-width="1.5"/>';
        h += '<rect x="' + (cx - pw * 0.36) + '" y="' + (cy - ph * 0.32) + '" width="' + pw * 0.72 + '" height="' + ph * 0.64 + '" rx="14" fill="#e1f5fe" stroke="#0277bd" stroke-width="1.2"/>';
        h += '<circle cx="' + (cx - pw * 0.4) + '" cy="' + (cy - ph * 0.3) + '" r="10" fill="#f8bbd0" stroke="#880e4f"/>';
        for (var i = 0; i < 6; i++) h += '<ellipse cx="' + (cx - pw * 0.42 + (i % 3) * pw * 0.42) + '" cy="' + (cy + (i < 3 ? -1 : 1) * ph * 0.42) + '" rx="8" ry="4" fill="#66bb6a"/>';
        h += '<text x="' + cx + '" y="' + (cy + hh / 2 + 30) + '" text-anchor="middle" font-size="12" fill="#1b5e20">cell wall (green) · membrane · vacuole (blue)</text>';
      } else {
        var r = 60 * Math.cbrt(Math.max(V, 0.33)), thick = V < 1.25 ? Math.max(0.15, 1 - (V - 0.6) * 1.2) : 0;
        if (burst) { for (var k = 0; k < 9; k++) { var a = k * 0.7; h += '<path d="M' + (cx + 70 * Math.cos(a)) + ',' + (cy + 70 * Math.sin(a)) + ' q10,-12 22,0" stroke="#c62828" stroke-width="4" fill="none"/>'; } h += '<text x="' + cx + '" y="' + cy + '" text-anchor="middle" font-size="15" fill="#b71c1c">Membrane burst (haemolysis)</text>'; }
        else if (V < 0.95) { var pts = []; for (var j = 0; j < 48; j++) { var t = j / 48 * Math.PI * 2, rr = r * (1 + 0.12 * Math.sin(9 * t) * Math.min(1, (1 - V) * 3)); pts.push((cx + rr * Math.cos(t)).toFixed(1) + ',' + (cy + rr * Math.sin(t)).toFixed(1)); } h += '<polygon points="' + pts.join(' ') + '" fill="#e57373" stroke="#b71c1c" stroke-width="2"/>'; }
        else { h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#e57373" stroke="#b71c1c" stroke-width="2"/>'; if (thick > 0.2) h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r * 0.45 * thick + '" fill="#ef9a9a"/>'; }
        h += '<text x="' + cx + '" y="' + (cy + 105) + '" text-anchor="middle" font-size="12" fill="#b71c1c">red blood cell (no wall)</text>';
      }
      var net = psiOut - psiCell, n = burst ? 0 : Math.min(5, Math.round(Math.abs(net) / 60));
      for (var q = 0; q < n; q++) { var y = 70 + q * 32, inward = net > 0;
        h += '<line x1="' + (inward ? 440 : 360) + '" y1="' + y + '" x2="' + (inward ? 360 : 440) + '" y2="' + y + '" stroke="#0072B2" stroke-width="3" marker-end="url(#ar)"/>'; }
      h += '<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="#0072B2"/></marker></defs>';
      h += '<text x="400" y="250" text-anchor="middle" font-size="12" fill="#334155">' + (burst ? '' : n ? 'net water movement ' + (net > 0 ? 'INTO' : 'OUT OF') + ' the cell' : 'no net water movement') + '</text>';
      sv.innerHTML = h;
    }
    function readings(p, cell, state) {
      api.readings([['Time', fx(p.t, 1) + ' min'], ['Volume change', fx((p.V - 1) * 100, 1) + ' %'], ['Ψ cell', fx(p.psi, 0) + ' kPa'], ['Solute potential ψs', fx(p.psiS, 0) + ' kPa'], ['Pressure potential ψp', fx(p.psiP, 0) + ' kPa'], ['Ψ outside', fx(p.psiOut, 0) + ' kPa'], ['State', state || '']]);
    }
    function chart(pts, mins) {
      api.chart(ch, { xLabel: 'Time / min', yLabel: 'Volume change / %', xmin: 0, xmax: mins, series: (last && last.mins === mins ? [{ name: 'last run', pts: last.pts, color: '#94a3b8', dash: true }] : []).concat([{ name: 'this run', pts: pts, color: '#0072B2' }]) });
    }
    function idle() {
      cancelAnimationFrame(raf); var v = o(), r = M.osmosis(Object.assign({}, v, { minutes: 0.001 })), p = r.series[0];
      draw(1, v.cell, p.psi, p.psiOut, false); readings(p, v.cell, ''); chart([], v.minutes); api.enable('rec', false);
      api.status('Set the solution, then press Start.');
    }
    function start() {
      cancelAnimationFrame(raf); var v = o(), r = M.osmosis(v), noise = (Math.random() * 2 - 1) * 0.6, t0 = performance.now(), dur = 6000;
      var pts = r.series.map(function (p) { return [p.t, (p.V - 1) * 100 + noise * Math.min(1, p.t / 3)]; });
      var fin = r.series[r.series.length - 1].V - 1, half = null;
      r.series.some(function (p) { if (Math.abs(p.V - 1) >= Math.abs(fin) / 2 && Math.abs(fin) > 0.005) { half = p.t; return true; } });
      run = { v: v, r: r, pts: pts, half: half, mins: v.minutes };
      api.enable('start', false); api.enable('rec', false); api.status('Cell in solution… (' + v.minutes + ' minutes shown in 6 seconds)');
      (function loop() {
        var k = Math.min(1, (performance.now() - t0) / dur), idx = Math.min(r.series.length - 1, Math.round(k * (r.series.length - 1))), p = r.series[idx];
        var burstNow = r.burst && p.V >= 1.6 - 1e-6, st = stateOf({ change: (p.V - 1) * 100, burst: burstNow, plasmolysed: v.cell === 'plant' && p.V < 0.88 }, v.cell);
        draw(p.V, v.cell, p.psi, p.psiOut, burstNow); readings(p, v.cell, st); chart(pts.slice(0, idx + 1), v.minutes);
        if (k < 1) raf = requestAnimationFrame(loop);
        else { run.state = st; api.enable('start', true); api.enable('rec', true); api.status('Finished: volume change ' + fx(pts[pts.length - 1][1], 1) + ' % (' + st + '). Press Record trial.'); }
      })();
    }
    api.actions([
      { id: 'start', label: '▶ Start', main: true, fn: start },
      { id: 'stop', label: '■ Reset', fn: function () { if (run) last = run; run = null; api.enable('start', true); idle(); } },
      { id: 'rec', label: '➕ Record trial', fn: function () {
        if (!run) return; var v = run.v;
        api.record({ cell: v.cell === 'plant' ? 'plant' : 'red blood cell', C: v.Cout, perm: v.perm, T: v.T, mins: v.minutes, pc: run.pts[run.pts.length - 1][1], half: run.half, state: run.state, psiOut: run.r.psiOut });
        last = run; api.enable('rec', false);
      } }
    ]);
    api.onChange = function (v, id) { if (id) { if (run) last = run; run = null; api.enable('start', true); idle(); } };
    idle();
  }
})();
