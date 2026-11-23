/* PCR and gel electrophoresis laboratory · BioscienceVista · by George Apidi
   IB DP D1.1.4–D1.1.5: copy DNA in a thermocycler (denature, anneal, extend), then separate the fragments by gel electrophoresis and
   compare them with a DNA ladder. Applications: a forensic investigation, a paternity test and testing for a virus (COVID-19 RT-PCR). */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var LADDER = [1500, 1000, 700, 500, 400, 300, 200, 100];
  var CASES = {
    crime: { name: 'Forensic: whose DNA is at the crime scene?', lanes: [['Ladder', LADDER], ['Crime scene', [620, 410, 230]], ['Suspect A', [540, 410, 180]], ['Suspect B', [620, 410, 230]], ['Suspect C', [620, 300, 150]]] },
    pat: { name: 'Paternity: who is the biological father?', lanes: [['Ladder', LADDER], ['Mother', [800, 450, 260, 160]], ['Child', [800, 380, 260, 120]], ['Man 1', [650, 450, 210, 160]], ['Man 2', [900, 380, 300, 120]]] },
    virus: { name: 'Diagnosis: who has the virus? (RT-PCR)', lanes: [['Ladder', LADDER], ['Positive control', [350]], ['Negative control (water)', []], ['Patient 1', [350]], ['Patient 2', []]] }
  };
  var CL = [['crime', CASES.crime.name], ['pat', CASES.pat.name], ['virus', CASES.virus.name]];

  function copies(n, start) { var c = start || 1; for (var i = 0; i < n; i++) c *= i < 25 ? 2 : 1 + Math.max(0, 0.9 - (i - 25) * 0.15); return c; }
  function dist(bp, agar, volt, mins) { return Math.min(0.98, (volt * mins / 3000) * (3.6 - Math.log10(bp)) / 1.6 * Math.pow(1.5 / agar, 0.7) * 0.6 + 0.03); }   // fraction of the gel length travelled

  LABS.pcr = {
    id: 'pcr', title: 'PCR and gel electrophoresis laboratory',
    tags: ['Biology', 'Biotechnology', 'IB DP D1.1.4 PCR and gel electrophoresis', 'IB DP D1.1.5 applications', 'A Level'],
    background: '<p>The <b>polymerase chain reaction (PCR)</b> makes millions of copies of a chosen section of DNA. A tube holds the DNA sample, two <b>primers</b> (short single strands that match each end of the target), free <b>nucleotides</b> and a heat-stable <b>Taq DNA polymerase</b>. A <b>thermocycler</b> repeats three steps: <b>denaturation</b> at 95 °C (hydrogen bonds break, strands separate), <b>annealing</b> at about 55 °C (primers bind) and <b>extension</b> at 72 °C (Taq adds nucleotides from the primers). Each cycle doubles the number of copies: after n cycles there are 2ⁿ copies of each target, until the reagents run out.</p>' +
      '<p><b>Gel electrophoresis</b> separates DNA fragments by <b>size</b>. Samples are loaded into wells in an agarose gel; DNA is negatively charged (phosphate groups), so in an electric field it moves towards the <b>positive electrode</b>. Small fragments move faster through the pores of the gel. A <b>DNA ladder</b> of known sizes (base pairs, bp) is run alongside to estimate the size of each band.</p>' +
      '<p>Uses include <b>DNA profiling</b> (forensic investigations and paternity tests compare the lengths of short tandem repeats) and <b>diagnosis</b>: RT-PCR copies the RNA of a virus such as SARS-CoV-2 into DNA first, then amplifies it.</p>',
    objectives: ['Explain the three steps of a PCR cycle and why Taq polymerase is used.', 'Calculate the number of copies after n cycles.', 'Run a gel, and estimate fragment sizes using a DNA ladder.', 'Interpret DNA profiles for forensic, paternity and diagnostic tests.'],
    rq: 'Which suspect\'s DNA profile matches the DNA from the crime scene?',
    hypPrompt: 'Predict how bands of different sizes move in the gel, and how you will decide whether two profiles match.',
    hypothesis: { marks: 2, points: [
      { re: [/small(er)?.*(further|faster|more)|(larger|bigger|longer).*(less|slower|shorter)/], marks: 1, ok: 'Smaller fragments move further.', miss: 'Predict how fragment size affects how far a band moves.' },
      { re: [/same (bands|position|pattern)|all (the )?bands|match/], marks: 1, ok: 'All bands must match.', miss: 'Say how you will decide whether profiles match.' }] },
    variables: { iv: 'DNA sample in each lane (crime scene and suspects)', dv: 'distance moved by each band (mm), giving its size from the ladder', cv: ['number of PCR cycles', 'agarose concentration', 'voltage and running time', 'volume of sample loaded', 'same primers for all samples'] },
    apparatus: ['Thermocycler, PCR tubes, micropipettes with sterile tips', 'Primers, nucleotides (dNTPs), Taq polymerase, buffer with Mg²⁺', 'Agarose gel with wells, tank with buffer, power supply', 'DNA ladder, loading dye, DNA stain and UV or blue-light transilluminator'],
    safety: ['Wear gloves and eye protection; some DNA stains are irritants.', 'High voltage: switch off before opening the tank. UV light: use a screen.', 'Avoid contamination: sterile tips, and a negative control with water.'],
    method: ['Choose the case and the number of cycles. Press <b>▶ Run PCR and gel</b>: the thermocycler cycles, then the samples are loaded and the gel runs.', 'Read the distance each band moved; compare with the ladder bands of known size.', 'Press <b>➕ Record bands</b>. Change the cycles, agarose and running time to see their effect.'],
    controls: [
      { id: 'cs', label: 'Case', type: 'select', value: 'crime', options: CL },
      { id: 'cyc', label: 'PCR cycles', min: 0, max: 35, step: 5, value: 30 },
      { id: 'agar', label: 'Agarose', type: 'select', value: '1.5', options: [['0.8', '0.8 % (large fragments)'], ['1.5', '1.5 %'], ['2.5', '2.5 % (small fragments)']] },
      { id: 'mins', label: 'Running time at 100 V', min: 10, max: 60, step: 5, value: 40, unit: 'min' }
    ],
    columns: [
      { key: 'lane', label: 'Lane', num: false, group: true }, { key: 'band', label: 'Band', dp: 0 }, { key: 'mm', label: 'Distance moved', unit: 'mm', dp: 0 }, { key: 'bp', label: 'Size (from ladder)', unit: 'bp', dp: 0 }
    ],
    graph: { x: 'mm', y: 'bp', group: 'lane' },
    hints: ['Copies after n cycles = 2ⁿ (for each starting molecule).', 'DNA is negative: it moves towards the + electrode.', 'Plot ladder size (log scale) against distance to read off unknown sizes.', 'A child inherits one of each pair of bands from each parent.'],
    analyse: [
      { id: 'cop', q: 'How many copies of one DNA molecule are made after 20 PCR cycles (assume perfect doubling)?', marks: 1, lines: 1, number: { value: 1048576, tol: 0.01, dp: 0 } },
      { id: 'match', q: 'Which suspect matches the crime scene sample? Explain using the bands.', marks: 2, lines: 3, points: [
        { re: [/suspect b|\bb\b/], marks: 1, ok: 'Suspect B.', miss: 'Name the matching suspect.' }, { re: [/all (the )?bands|same (position|size|bands)|every band|three bands/], marks: 1, ok: 'All bands are in the same positions.', miss: 'Explain: every band is the same size (position).' }] },
      { id: 'pat', q: 'In the paternity case, which man is the biological father? Explain.', marks: 2, lines: 3, points: [
        { re: [/man 2/], marks: 1, ok: 'Man 2.', miss: 'Name the man.' }, { re: [/not (from|in) the mother|mother.*(other|rest)|every band.*(mother|man|father)|each band.*(mother|father)/], marks: 1, ok: 'Bands not from the mother are all in Man 2.', miss: 'Explain: every band in the child not from the mother must come from the father.' }] },
      { id: 'step', q: 'Explain why the PCR mixture is heated to 95 °C and then cooled to 55 °C in each cycle.', marks: 2, lines: 3, points: [
        { re: [/hydrogen bond|separate|denatur|single strand/], marks: 1, ok: '95 °C separates the strands.', miss: '95 °C breaks hydrogen bonds to separate the strands.' }, { re: [/primer.*(bind|anneal|attach)|anneal/], marks: 1, ok: '55 °C lets primers bind.', miss: '55 °C lets the primers bind (anneal).' }] }
    ],
    evaluate: [
      { id: 'ctl', q: 'In the virus test, why is a negative control with water included?', marks: 1, lines: 2, points: [
        { re: [/contamin|false positive|no dna|check|reagents|pure/], marks: 1, ok: 'To show the reagents are not contaminated.', miss: 'It checks the reagents are not contaminated (no false positives).' }] },
      { id: 'ethic', q: 'Suggest one ethical issue with storing DNA profiles in a national database.', marks: 1, lines: 2, points: [
        { re: [/privacy|consent|misuse|insur|employ|discrimin|innocent|secur|relatives|family/], marks: 1, ok: 'Valid.', miss: 'For example: privacy and consent, especially for innocent people and their relatives.' }] }
    ],
    model: '<ul><li>Copies double each cycle for 25 cycles, then the gain falls as primers and nucleotides run out (plateau).</li><li>Distance moved ∝ voltage × time × (3.6 − log₁₀ size) × (1.5 ÷ agarose %)<sup>0.7</sup> (a simplified linear relation between distance and the log of fragment size). Bands are only visible above about 10⁶ copies.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, raf = null, playing = false, t0 = 0, W = 680, H = 360, ran = false, stage = 0;
    api.stage.innerHTML = '<canvas id="pc-cv" width="680" height="360" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="A thermocycler and an agarose gel"></canvas><p class="small" id="pc-cap" style="margin:6px 0;font-weight:700" aria-live="polite"></p>';
    var cv = api.stage.querySelector('#pc-cv'), c = cv.getContext('2d'), cap = api.stage.querySelector('#pc-cap');
    var GX = 300, GY = 60, GW = 360, GH = 270;
    function drawCycler(cyc, sub) {
      var v = api.vals(), T = sub < 0.33 ? 95 : sub < 0.66 ? 55 : 72;
      c.fillStyle = '#e2e8f0'; c.fillRect(20, 60, 250, 170); c.fillStyle = '#334155'; c.fillRect(30, 70, 230, 40); c.fillStyle = '#22c55e'; c.font = 'bold 16px monospace'; c.textAlign = 'left';
      c.fillText(T + ' °C  cycle ' + Math.min(v.cyc, cyc) + '/' + v.cyc, 40, 96);
      c.fillStyle = '#0f172a'; c.font = 'bold 12px system-ui'; c.fillText(T === 95 ? 'Denaturation: strands separate' : T === 55 ? 'Annealing: primers bind' : 'Extension: Taq adds nucleotides', 30, 132);
      // DNA strands schematic
      var sep = T === 95 ? 18 : T === 55 ? 18 : 10, y0 = 160; c.lineWidth = 4;
      c.strokeStyle = '#2563eb'; c.beginPath(); c.moveTo(40, y0 - sep / 2); c.lineTo(250, y0 - sep / 2); c.stroke(); c.strokeStyle = '#dc2626'; c.beginPath(); c.moveTo(40, y0 + sep / 2); c.lineTo(250, y0 + sep / 2); c.stroke();
      if (T !== 95) { c.strokeStyle = '#16a34a'; c.lineWidth = 6; c.beginPath(); c.moveTo(220, y0 - sep / 2 + 6); c.lineTo(250, y0 - sep / 2 + 6); c.moveTo(40, y0 + sep / 2 - 6); c.lineTo(70, y0 + sep / 2 - 6); c.stroke(); }
      if (T === 72) { c.strokeStyle = '#a855f7'; c.lineWidth = 4; var ext = (sub - 0.66) / 0.34; c.beginPath(); c.moveTo(220, y0 - sep / 2 + 6); c.lineTo(220 - 180 * ext, y0 - sep / 2 + 6); c.moveTo(70, y0 + sep / 2 - 6); c.lineTo(70 + 180 * ext, y0 + sep / 2 - 6); c.stroke(); }
      c.fillStyle = '#0f172a'; c.font = '12px system-ui'; c.fillText('Copies of the target: ' + fmtBig(copies(Math.min(v.cyc, cyc))), 30, 215);
    }
    function fmtBig(n) { return n >= 1e6 ? (n / 1e6 >= 1000 ? (n / 1e9).toFixed(2) + ' billion' : (n / 1e6).toFixed(2) + ' million') : Math.round(n).toLocaleString(); }
    function lanes() { return CASES[api.vals().cs].lanes; }
    function drawGel(run) {
      var v = api.vals(), L = lanes(), n = L.length, lw = GW / n, cop = copies(v.cyc), vis = Math.min(1, Math.max(0, (Math.log10(cop) - 5.5) / 2));
      c.fillStyle = '#1e1b4b'; c.fillRect(GX, GY, GW, GH); c.fillStyle = '#0f172a'; c.font = 'bold 12px system-ui'; c.textAlign = 'center'; c.fillText('− (wells)', GX + GW / 2, GY - 8); c.fillText('+', GX + GW / 2, GY + GH + 16);
      L.forEach(function (ln, i) { var x = GX + lw * (i + 0.5); c.fillStyle = '#312e81'; c.fillRect(x - lw * 0.3, GY + 6, lw * 0.6, 8); c.save(); c.translate(x, GY + GH + 30); c.fillStyle = '#334155'; c.font = '10px system-ui'; c.fillText(ln[0], 0, 0); c.restore();
        var bright = ln[0] === 'Ladder' ? 1 : vis; ln[1].forEach(function (bp) { var d = dist(bp, +v.agar, 100, v.mins) * run, y = GY + 10 + d * (GH - 20); c.fillStyle = 'rgba(244,114,182,' + (0.15 + 0.85 * bright) + ')'; c.shadowColor = '#f472b6'; c.shadowBlur = 8 * bright; c.fillRect(x - lw * 0.3, y, lw * 0.6, 5); c.shadowBlur = 0;
          if (ln[0] === 'Ladder' && run >= 1) { c.fillStyle = '#cbd5e1'; c.font = '9px system-ui'; c.textAlign = 'right'; c.fillText(bp + ' bp', GX - 4, y + 5); c.textAlign = 'center'; } }); });
      // ruler (mm)
      c.fillStyle = '#fef9c3'; c.fillRect(GX + GW + 2, GY, 14, GH); c.fillStyle = '#713f12'; c.font = '8px system-ui'; c.textAlign = 'left'; for (var mm = 0; mm <= 60; mm += 10) { var yy = GY + 10 + mm / 60 * (GH - 20); c.fillRect(GX + GW + 2, yy, 6, 1); c.fillText(String(mm), GX + GW + 6, yy - 1); }
    }
    function bandRows() { var v = api.vals(), out = []; lanes().forEach(function (ln) { ln[1].forEach(function (bp, j) { out.push({ lane: ln[0], band: j + 1, mm: Math.round(dist(bp, +v.agar, 100, v.mins) * 60), bp: ln[0] === 'Ladder' ? bp : '' }); }); }); return out; }
    function draw(el) {
      var v = api.vals(); c.clearRect(0, 0, W, H);
      var pcrPart = Math.min(1, el / 0.55), cyc = Math.floor(pcrPart * v.cyc), sub = (pcrPart * v.cyc) % 1; drawCycler(el >= 0.55 ? v.cyc : cyc, el >= 0.55 ? 0.9 : sub);
      drawGel(el < 0.55 ? 0 : Math.min(1, (el - 0.55) / 0.42));
      c.fillStyle = '#0f172a'; c.font = 'bold 14px system-ui'; c.textAlign = 'left'; c.fillText(CASES[v.cs].name, 16, 26);
    }
    function readings() { var v = api.vals(), cop = copies(v.cyc); api.readings([['Cycles', String(v.cyc)], ['Copies of each target', fmtBig(cop)], ['Bands visible?', Math.log10(cop) > 6 ? 'yes' : 'too few copies'], ['Agarose', v.agar + ' %']]); }
    function frame() { var el = Math.min(1, (performance.now() - t0) / 12000); draw(el); cap.textContent = el < 0.55 ? 'Thermocycler: denature 95 °C → anneal 55 °C → extend 72 °C, repeated.' : 'Electrophoresis: negatively charged DNA moves towards +; small fragments move furthest.';
      if (el >= 1) { playing = false; ran = true; api.label('run', '▶ Run PCR and gel'); readings(); cap.textContent = Math.log10(copies(api.vals().cyc)) > 6 ? 'Compare the bands with the ladder and between lanes.' : 'Too few cycles: the sample bands are too faint to see.'; api.status('➕ Record bands.'); return; } if (playing) raf = requestAnimationFrame(frame); }
    api.actions([
      { id: 'run', label: '▶ Run PCR and gel', main: true, fn: function () { if (playing) return; playing = true; t0 = performance.now(); api.label('run', '⏳ Running…'); frame(); } },
      { id: 'rec', label: '➕ Record bands', fn: function () { if (!ran) return api.status('Run the PCR and gel first.'); if (Math.log10(copies(api.vals().cyc)) <= 6) return api.status('The sample bands are too faint to measure.'); bandRows().forEach(function (r) { api.record(r); }); } }
    ]);
    api.onChange = function () { ran = false; readings(); draw(0); cap.textContent = ''; };
    api.onChange();
    api.status('Press ▶ Run PCR and gel.');
    window.BV_PC = { copies: copies, dist: dist };
  }
})();
