/* Miller–Urey laboratory · VistaEd · by George Apidi
   The 1953 spark-discharge experiment: water boils in one flask, vapour and the "early atmosphere" gases pass sparks between two electrodes,
   a condenser cools them and the products collect in a U-trap. Change the gas mixture, the spark energy and the time; measure the amino acid
   yield and identify the amino acids by paper chromatography. */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var GASES = {
    red: { name: 'Reducing: CH₄, NH₃, H₂, H₂O (Miller 1953)', short: 'Reducing (CH₄, NH₃, H₂)', ymax: 4.0, mols: ['CH₄', 'NH₃', 'H₂', 'H₂O'], col: ['#f59e0b', '#8b5cf6', '#94a3b8', '#38bdf8'] },
    neu: { name: 'Neutral: CO₂, N₂, H₂O (volcanic gases)', short: 'Neutral (CO₂, N₂)', ymax: 0.35, mols: ['CO₂', 'N₂', 'H₂O'], col: ['#64748b', '#22c55e', '#38bdf8'] },
    oxi: { name: 'Oxidising: CO₂, N₂, O₂, H₂O (today\'s air)', short: 'Oxidising (with O₂)', ymax: 0.0, mols: ['CO₂', 'N₂', 'O₂', 'H₂O'], col: ['#64748b', '#22c55e', '#ef4444', '#38bdf8'] }
  };
  var GASL = [['red', GASES.red.name], ['neu', GASES.neu.name], ['oxi', GASES.oxi.name]];
  var SPARK = [['0', 'No spark (control)'], ['0.5', 'Weak spark'], ['1', 'Normal spark (60 000 V)'], ['1.5', 'Strong spark']];
  var AA = [['Glycine', 0.05, 0.36], ['Alanine', 0.25, 0.48], ['Aspartic acid', 0.8, 0.22], ['β-Alanine', 1.3, 0.55], ['α-Aminobutyric acid', 1.8, 0.62]];   // name, yield needed to detect, Rf
  var TAU = 2.2;   // days

  function model(o) {   // o: {gas, spark, days}
    var G = GASES[o.gas], sp = +o.spark, f = sp ? sp / (sp + 0.35) * 1.35 : 0;
    var yld = G.ymax * f * (1 - Math.exp(-o.days / TAU));   // amino acids, % of the carbon
    var org = (G.ymax ? 12 : 0.4) * f * (1 - Math.exp(-o.days / (TAU * 1.3)));   // all organic compounds (tar, aldehydes, HCN…), % of carbon
    var found = AA.filter(function (a) { return yld >= a[1]; });
    return { G: G, yld: yld, org: G.ymax ? org : Math.min(org, 0.3), found: found, colour: Math.min(1, org / 9) };
  }

  LABS.millerurey = {
    id: 'millerurey', title: 'Miller–Urey laboratory: the origin of organic molecules',
    tags: ['Biology', 'Origins of life', 'MYP 4–5', 'IB DP A2.1 Origins of cells', 'A Level'],
    background: '<p>How did the first carbon compounds of life form before there were cells? In the 1920s <b>Oparin</b> and <b>Haldane</b> suggested that the early Earth had a <b>reducing atmosphere</b> (rich in hydrogen, with no free oxygen) and that energy from lightning and ultraviolet light turned simple gases into organic molecules, which built up in the oceans as a "primordial soup".</p>' +
      '<p>In 1953 <b>Stanley Miller</b>, working with <b>Harold Urey</b>, tested the idea. Water was <b>boiled</b> in a small flask; the water vapour mixed with <b>methane (CH₄), ammonia (NH₃) and hydrogen (H₂)</b> in a large flask where <b>electric sparks</b> (60 000 V) imitated lightning. A <b>condenser</b> cooled the gases so droplets ran into a <b>U-trap</b> (the "ocean") and back to the boiling flask. The apparatus was sealed and sterilised first, so no living things could add organic matter.</p>' +
      '<p>After a week the water had turned pink, then deep red-brown. <b>Paper chromatography</b> showed <b>amino acids</b>, including glycine and alanine. Later analysis of Miller\'s sealed samples (2008) found more than 20 amino acids. The experiment showed that <b>organic molecules can form from inorganic ones without living things</b> (abiotic synthesis). Today many scientists think the early atmosphere was less reducing (mostly CO₂ and N₂), which gives far lower yields; organic molecules may also have formed at <b>deep-sea hydrothermal vents</b> or arrived in <b>meteorites</b>.</p>',
    objectives: ['Describe the Miller–Urey apparatus and what each part imitated.', 'Investigate how the gas mixture, the energy supplied and the time affect the yield of amino acids.', 'Identify amino acids from a paper chromatogram using Rf values.', 'Evaluate what the experiment shows, and does not show, about the origin of life.'],
    rq: 'How does the composition of the gas mixture (reducing, neutral or oxidising) affect the yield of amino acids made in 7 days?',
    hypPrompt: 'Predict which gas mixture gives the most amino acids, and explain why. What do you expect with no spark?',
    hypothesis: { marks: 3, points: [
      { re: [/reducing|methane|ch4|ch₄|ammonia|nh3|nh₃|hydrogen|h2\b|h₂/], marks: 1, ok: 'You predict the reducing mixture gives most.', miss: 'Say which mixture you think gives the most amino acids.' },
      { re: [/oxygen|o2|o₂|oxidis|oxidiz|breaks? down|destroy|react with/], marks: 1, ok: 'You explain the effect of oxygen.', miss: 'Explain what oxygen would do to the organic molecules.' },
      { re: [/no spark|without (a |the )?spark|energy|lightning|electric/], marks: 1, ok: 'You link the result to energy (the spark).', miss: 'Explain the role of the spark (energy) in your prediction.' }] },
    variables: { iv: 'composition of the gas mixture (reducing, neutral, oxidising)', dv: 'yield of amino acids (% of the carbon in the gases) and the number of amino acids found by chromatography', cv: ['time the apparatus runs (7 days)', 'spark voltage and frequency', 'volume of water and gas pressure', 'temperature of boiling and of the condenser', 'apparatus sterilised and sealed'] },
    apparatus: ['500 cm³ flask of boiling water (the ocean, heated)', '5 dm³ flask with two tungsten electrodes and an induction coil (60 000 V sparks: lightning)', 'Condenser with cold water (cooling: rain)', 'U-trap to collect the condensed liquid (the ocean collecting products)', 'Vacuum pump and gas supply: CH₄, NH₃, H₂ (or CO₂, N₂, O₂)', 'Paper chromatography: chromatography paper, solvent, ninhydrin spray (turns amino acids purple)'],
    safety: ['Virtual lab. The real experiment uses high voltage, flammable and explosive gases (CH₄, H₂), toxic ammonia and glass under vacuum: only trained scientists in a fume cupboard behind a safety screen.', 'Ninhydrin is harmful: spray in a fume cupboard and wear gloves and eye protection.'],
    method: ['Choose the <b>reducing</b> mixture, a <b>normal spark</b> and <b>7 days</b>.', 'Press <b>▶ Run the apparatus</b>. Watch water vapour circulate, sparks pass, droplets condense and the trap liquid change colour.', 'Read the amino acid yield and look at the chromatogram. Press <b>➕ Record trial</b>.', 'Repeat with the <b>neutral</b> and <b>oxidising</b> mixtures, then with <b>no spark</b> (a control). Repeat each one to check your results.', 'Extension: keep the reducing mixture and record the yield after 1, 2, 3, 5, 7, 10 and 14 days.'],
    controls: [
      { id: 'gas', label: 'Gas mixture (the early atmosphere)', type: 'select', value: 'red', options: GASL },
      { id: 'spark', label: 'Energy: electric spark', type: 'select', value: '1', options: SPARK },
      { id: 'days', label: 'Time the apparatus runs', min: 1, max: 14, step: 1, value: 7, unit: 'days' }
    ],
    columns: [
      { key: 'gas', label: 'Gas mixture', num: false, group: true }, { key: 'spark', label: 'Spark', num: false, group: true },
      { key: 'days', label: 'Time', unit: 'days', dp: 0 }, { key: 'yld', label: 'Amino acid yield', unit: '% of carbon', dp: 2 },
      { key: 'org', label: 'All organic compounds', unit: '% of carbon', dp: 1 }, { key: 'n', label: 'Amino acids identified', dp: 0 }, { key: 'aa', label: 'Which', num: false }
    ],
    graph: { x: 'days', y: 'yld', group: 'gas' },
    hints: ['The spark supplies the energy to break bonds in the gas molecules, so new bonds can form.', 'Oxygen reacts with (oxidises) organic molecules and breaks them down.', 'Rf = distance moved by the spot ÷ distance moved by the solvent front.', 'Why did Miller sterilise and seal the apparatus?'],
    analyse: [
      { id: 'yield', q: 'State the amino acid yield after 7 days with the reducing mixture and a normal spark, in % of the carbon.', marks: 1, lines: 1,
        number: { value: function () { return model({ gas: 'red', spark: '1', days: 7 }).yld; }, tol: 0.08, unit: '% of carbon', dp: 2 } },
      { id: 'compare', q: 'Compare the yields from the three gas mixtures and explain the difference.', marks: 3, lines: 4, points: [
        { re: [/reducing.*(most|highest|greatest|more)|(most|highest|greatest).*reducing/], marks: 1, ok: 'The reducing mixture gives the most.', miss: 'Say which mixture gave the most amino acids.' },
        { re: [/\d/], marks: 1, ok: 'You quote figures.', miss: 'Quote the yields (%) for the mixtures.' },
        { re: [/oxygen|o2|o₂|oxidi[sz]/], marks: 1, ok: 'You explain the effect of oxygen.', miss: 'Explain that oxygen oxidises (breaks down) the organic molecules, so none build up.' }] },
      { id: 'rf', q: 'On the chromatogram the solvent front moved 10.0 cm. One spot moved 4.8 cm. Calculate its Rf value and identify the amino acid.', marks: 2, lines: 2, points: [
        { re: [/0?\.48\b/], marks: 1, ok: 'Rf = 0.48.', miss: 'Rf = 4.8 ÷ 10.0 = 0.48.' },
        { re: [/alanine/], marks: 1, ok: 'Alanine (Rf 0.48).', miss: 'Use the Rf values in the key: 0.48 is alanine.' }] },
      { id: 'time', q: 'Describe how the yield changes with time and suggest why it levels off.', marks: 2, lines: 3, points: [
        { re: [/increase|rise|more/], marks: 1, ok: 'The yield increases with time.', miss: 'Describe the rise in yield over the days.' },
        { re: [/level|plateau|slow|run out|used up|less (gas|methane|ammonia)|break.?down|destroy|equilibr/], marks: 1, ok: 'You explain the levelling off.', miss: 'Suggest why: the reacting gases are used up, and sparks also break down some products.' }] }
    ],
    evaluate: [
      { id: 'control', q: 'Why did Miller run the apparatus with no spark, and sterilise it before starting?', marks: 2, lines: 3, points: [
        { re: [/no spark|control|compare|energy|spark (is|was) (needed|necessary)/], marks: 1, ok: 'The no-spark control shows the spark (energy) is needed.', miss: 'Explain the no-spark control: it shows the amino acids need the energy of the spark.' },
        { re: [/steril|bacteria|microb|living|contamin|organism/], marks: 1, ok: 'Sterilising rules out living things making the molecules.', miss: 'Explain sterilising: no microorganisms could have made the organic molecules.' }] },
      { id: 'limits', q: 'Suggest two reasons why the Miller–Urey experiment does not show how life itself began.', marks: 2, lines: 4, points: [
        { re: [/atmosphere.*(not|less|wrong|different|co2|co₂|neutral)|not (a )?reducing|co2|co₂|n2|n₂ and/], marks: 1, ok: 'The early atmosphere may not have been reducing.', miss: 'For example: the early atmosphere was probably not as reducing as Miller\'s gases.' },
        { re: [/polymer|protein|rna|dna|nucleic|membrane|self.?replic|cell|enzyme|metabolism|not (alive|life)|monomer/], marks: 1, ok: 'Making monomers is not making polymers, membranes or self-replicating molecules.', miss: 'For example: it made monomers only, not polymers, membranes, RNA or a cell.' }] },
      { id: 'other', q: 'Name one other place or source where the first organic molecules may have come from.', marks: 1, lines: 2, points: [
        { re: [/vent|hydrothermal|meteor|comet|space|asteroid|clay|volcan|ice/], marks: 1, ok: 'A valid source.', miss: 'For example: deep-sea hydrothermal vents, or meteorites from space.' }] }
    ],
    model: '<ul><li>Amino acid yield (% of the carbon) = Y<sub>max</sub> × spark factor × (1 − e<sup>−t/2.2 days</sup>). Y<sub>max</sub> is 4.0 % for the reducing mixture (Miller found about 2 % as glycine and 1.7 % as alanine in his best runs), 0.35 % for the neutral mixture and 0 with oxygen.</li>' +
      '<li>Spark factor = 1.35 × E ÷ (E + 0.35) for spark energy E (0 with no spark). All organic compounds (tar, aldehydes, hydrogen cyanide and acids) are about three times the amino acid yield: they turn the trap liquid pink, then red-brown.</li>' +
      '<li>Amino acids show on the chromatogram once enough is made: glycine (Rf 0.36), alanine (0.48), aspartic acid (0.22), β-alanine (0.55), α-aminobutyric acid (0.62). Rf values are for a typical butanol–ethanoic acid–water solvent. Values are typical, not one measured run.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, sim = null, raf = null, playing = false, t0 = 0, W = 680, H = 380, mols = [], drops = [];
    api.stage.innerHTML = '<canvas id="mu-cv" width="680" height="380" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="The Miller–Urey apparatus: boiling flask, spark flask with electrodes, condenser and U-trap"></canvas>' +
      '<p class="small" id="mu-cap" style="margin:6px 0;font-weight:700" aria-live="polite"></p>' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start"><canvas id="mu-ch" class="vl-chart" style="height:220px;flex:2 1 320px"></canvas><div style="flex:1 1 200px"><b class="small">Paper chromatogram (ninhydrin)</b><canvas id="mu-pc" width="240" height="260" style="width:100%;max-width:260px;background:#fffbeb;border:1px solid #e5e7eb;border-radius:8px"></canvas></div></div><div id="mu-lg"></div>';
    var cv = api.stage.querySelector('#mu-cv'), c = cv.getContext('2d'), ch = api.stage.querySelector('#mu-ch'), pc = api.stage.querySelector('#mu-pc'), cap = api.stage.querySelector('#mu-cap');
    var SP = { x: 420, y: 120, r: 92 }, BF = { x: 120, y: 262, r: 52 }, TRAP = { x: 300, y: 330 };
    function compute() { var v = api.vals(); sim = model({ gas: v.gas, spark: v.spark, days: v.days }); sim.v = v; }
    function reset() {
      mols = []; var G = sim.G;
      for (var i = 0; i < 26; i++) { var a = Math.random() * 6.28, rr = Math.random() * (SP.r - 14); mols.push({ k: i % G.mols.length, x: SP.x + Math.cos(a) * rr, y: SP.y + Math.sin(a) * rr, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, made: false }); }
      drops = [];
    }
    function tube(pts, w, col) { c.strokeStyle = col; c.lineWidth = w; c.lineJoin = 'round'; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); }
    function draw(el) {   // el: 0..1 of the run
      var v = sim.v, G = sim.G, day = Math.min(v.days, el * v.days), now = model({ gas: v.gas, spark: v.spark, days: Math.max(0.001, day) }), t = performance.now() / 1000;
      c.clearRect(0, 0, W, H);
      // glass tubing: boiling flask → up → spark flask → condenser → trap → back
      var path = [[BF.x, BF.y - BF.r], [BF.x, 60], [SP.x - 70, 60], [SP.x - SP.r * 0.7, SP.y - SP.r * 0.6]];
      var down = [[SP.x + SP.r * 0.6, SP.y + SP.r * 0.75], [SP.x + 70, 250], [600, 250], [600, 330], [TRAP.x + 40, 330]];
      var back = [[TRAP.x - 40, 330], [BF.x + BF.r * 0.8, 330], [BF.x + BF.r * 0.6, BF.y + BF.r * 0.6]];
      [path, down, back].forEach(function (p) { tube(p, 12, '#cbd5e1'); tube(p, 7, '#f1f5f9'); });
      // condenser jacket
      c.fillStyle = 'rgba(56,189,248,.25)'; c.strokeStyle = '#0284c7'; c.lineWidth = 2; c.beginPath(); c.roundRect ? c.roundRect(SP.x + 60, 236, 160, 28, 12) : c.rect(SP.x + 60, 236, 160, 28); c.fill(); c.stroke();
      c.fillStyle = '#0369a1'; c.font = 'bold 11px system-ui'; c.textAlign = 'center'; c.fillText('Condenser (cold water)', SP.x + 140, 228);
      for (var k = 0; k < 6; k++) { c.fillStyle = '#0ea5e9'; c.beginPath(); c.arc(SP.x + 70 + ((t * 40 + k * 28) % 150), 250, 2.5, 0, 7); c.fill(); }
      // boiling flask
      c.fillStyle = '#e0f2fe'; c.strokeStyle = '#475569'; c.lineWidth = 3; c.beginPath(); c.arc(BF.x, BF.y, BF.r, 0, 7); c.fill(); c.stroke();
      c.fillStyle = 'rgba(56,189,248,.55)'; c.beginPath(); c.arc(BF.x, BF.y, BF.r - 3, 0.15 * Math.PI, 0.85 * Math.PI); c.fill();
      if (playing || el > 0) for (k = 0; k < 7; k++) { var by = BF.y + 30 - ((t * 50 + k * 17) % 40); c.strokeStyle = '#0284c7'; c.lineWidth = 1.2; c.beginPath(); c.arc(BF.x - 30 + k * 10, by, 3, 0, 7); c.stroke(); }
      c.fillStyle = '#dc2626'; for (k = 0; k < 5; k++) { var fh = 10 + 6 * Math.sin(t * 9 + k); c.beginPath(); c.moveTo(BF.x - 24 + k * 12, BF.y + BF.r + 26); c.lineTo(BF.x - 18 + k * 12, BF.y + BF.r + 26 - fh); c.lineTo(BF.x - 12 + k * 12, BF.y + BF.r + 26); c.fill(); }
      c.fillStyle = '#334155'; c.font = 'bold 11px system-ui'; c.fillText('Boiling water ("ocean")', BF.x, BF.y + BF.r + 42);
      // water vapour rising in the left tube
      for (k = 0; k < 8; k++) { var yy = BF.y - BF.r - ((t * 60 + k * 30) % (BF.y - BF.r - 60)); c.fillStyle = 'rgba(56,189,248,.7)'; c.beginPath(); c.arc(BF.x, yy, 2.5, 0, 7); c.fill(); }
      // spark flask
      c.fillStyle = 'rgba(254,243,199,.6)'; c.strokeStyle = '#475569'; c.lineWidth = 3; c.beginPath(); c.arc(SP.x, SP.y, SP.r, 0, 7); c.fill(); c.stroke();
      c.fillStyle = '#334155'; c.fillText('Spark flask: "atmosphere" + lightning', SP.x, SP.y - SP.r - 10);
      // electrodes
      c.strokeStyle = '#1f2937'; c.lineWidth = 4; c.beginPath(); c.moveTo(SP.x - SP.r - 16, SP.y); c.lineTo(SP.x - 14, SP.y); c.moveTo(SP.x + SP.r + 16, SP.y); c.lineTo(SP.x + 14, SP.y); c.stroke();
      c.fillStyle = '#1f2937'; c.font = '10px system-ui'; c.fillText('electrode', SP.x - SP.r - 2, SP.y + 18); c.fillText('electrode', SP.x + SP.r + 2, SP.y + 18);
      if (+v.spark && (playing || el > 0) && Math.sin(t * 23) > 0.2 - 0.3 * (+v.spark - 1)) {   // the spark
        c.strokeStyle = '#facc15'; c.lineWidth = 2 + +v.spark; c.shadowColor = '#fde047'; c.shadowBlur = 14; c.beginPath(); c.moveTo(SP.x - 14, SP.y);
        for (k = 1; k < 7; k++) c.lineTo(SP.x - 14 + k * 4.7, SP.y + (Math.random() - 0.5) * 16); c.lineTo(SP.x + 14, SP.y); c.stroke(); c.shadowBlur = 0;
      }
      // gas molecules; near the spark some become organic molecules (if the mixture allows)
      mols.forEach(function (m) {
        if (playing) { m.x += m.vx * 0.016; m.y += m.vy * 0.016; var dx = m.x - SP.x, dy = m.y - SP.y, d = Math.sqrt(dx * dx + dy * dy); if (d > SP.r - 10) { m.vx = -m.vx; m.vy = -m.vy; m.x = SP.x + dx * (SP.r - 11) / d; m.y = SP.y + dy * (SP.r - 11) / d; }
          if (!m.made && +v.spark && G.ymax && Math.abs(dy) < 14 && Math.abs(dx) < 20 && Math.random() < 0.03 * +v.spark * G.ymax / 4) m.made = true; }
        if (m.made) { c.fillStyle = '#9333ea'; c.beginPath(); c.arc(m.x, m.y, 6, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 8px system-ui'; c.fillText('aa', m.x, m.y + 3); }
        else { c.fillStyle = G.col[m.k]; c.beginPath(); c.arc(m.x, m.y, 7, 0, 7); c.fill(); c.fillStyle = '#111827'; c.font = 'bold 8px system-ui'; c.fillText(G.mols[m.k], m.x, m.y + 3); }
      });
      // droplets running down to the trap
      if (playing && Math.random() < 0.25) drops.push({ s: 0 });
      drops = drops.filter(function (d) { d.s += 0.012; return d.s < 1; });
      drops.forEach(function (d) { var x = 600, y = 250 + d.s * 80; if (d.s > 0.5) { x = 600 - (d.s - 0.5) * 2 * (600 - TRAP.x - 40); y = 330; } c.fillStyle = sim.org > 0.5 ? 'rgba(180,83,9,.8)' : 'rgba(14,165,233,.8)'; c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); });
      // U-trap: its colour shows the organic products
      var col = now.colour, rC = Math.round(224 - 70 * col), gC = Math.round(242 - 170 * col), bC = Math.round(254 - 200 * col);
      c.strokeStyle = '#475569'; c.lineWidth = 3; c.fillStyle = 'rgb(' + rC + ',' + gC + ',' + bC + ')';
      c.beginPath(); c.moveTo(TRAP.x - 40, 300); c.lineTo(TRAP.x - 40, 345); c.quadraticCurveTo(TRAP.x, 380, TRAP.x + 40, 345); c.lineTo(TRAP.x + 40, 300); c.lineTo(TRAP.x + 26, 300); c.lineTo(TRAP.x + 26, 340); c.quadraticCurveTo(TRAP.x, 360, TRAP.x - 26, 340); c.lineTo(TRAP.x - 26, 300); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#334155'; c.font = 'bold 11px system-ui'; c.fillText('U-trap: products collect', TRAP.x, 292);
      // day counter
      c.fillStyle = '#0f172a'; c.font = 'bold 15px system-ui'; c.textAlign = 'left'; c.fillText('Day ' + fx(day, 1) + ' of ' + v.days, 16, 26);
      c.font = '12px system-ui'; c.fillText('Amino acids: ' + fx(now.yld, 2) + ' % of carbon', 16, 44); c.textAlign = 'center';
      drawPaper(now, el);
      cap.textContent = !+v.spark ? 'No spark: the gases have no energy to react, so no amino acids form (control).' :
        !G.ymax ? 'Oxygen oxidises any organic molecules as soon as they form, so none build up.' :
        el < 0.15 ? 'Water boils, the vapour carries the gases past the sparks…' :
        'Sparks break bonds in ' + G.mols.join(', ') + '; new organic molecules (purple) dissolve in the condensed water. Trap liquid: ' + (now.colour > 0.6 ? 'deep red-brown' : now.colour > 0.25 ? 'pink' : now.colour > 0.05 ? 'faintly coloured' : 'clear') + '.';
    }
    function drawPaper(now, el) {   // chromatogram: spots of the amino acids found so far (shown at the end of the run)
      var p = pc.getContext('2d'), PW = 240, PH = 260, base = 228, front = 30, show = el >= 0.98 || !playing && el > 0, SX = 50, KX = 108;
      p.clearRect(0, 0, PW, PH); p.strokeStyle = '#94a3b8'; p.setLineDash([4, 3]); p.beginPath(); p.moveTo(10, base); p.lineTo(PW - 10, base); p.moveTo(10, front); p.lineTo(PW - 10, front); p.stroke(); p.setLineDash([]);
      p.fillStyle = '#475569'; p.font = '10px system-ui'; p.textAlign = 'left'; p.fillText('solvent front', 12, front - 6); p.fillText('start line', 12, base + 14);
      p.strokeStyle = '#e5e7eb'; p.beginPath(); p.moveTo(100, front); p.lineTo(100, base); p.stroke();
      p.fillStyle = '#334155'; p.font = 'bold 10px system-ui'; p.textAlign = 'center'; p.fillText('sample', SX, PH - 6); p.textAlign = 'left'; p.fillText('key (Rf)', KX - 6, PH - 6);
      p.beginPath(); p.arc(SX, base, 3, 0, 7); p.fill();
      AA.forEach(function (a) { var y = base - a[2] * (base - front); p.fillStyle = 'rgba(126,34,206,.35)'; p.beginPath(); p.arc(KX, y, 4, 0, 7); p.fill(); p.fillStyle = '#4b5563'; p.font = '9px system-ui'; p.fillText(a[0].replace('Aspartic acid', 'Aspartic') + ' ' + a[2].toFixed(2), KX + 8, y + 3); });
      p.textAlign = 'center'; p.font = '9px system-ui'; p.fillStyle = '#6b7280';
      if (!show) { p.fillText('Spots appear', SX, 120); p.fillText('when the run ends', SX, 132); return; }
      now.found.forEach(function (a) { var y = base - a[2] * (base - front), s = Math.min(1, now.yld / (a[1] * 3 + 0.3)); p.fillStyle = 'rgba(126,34,206,' + (0.35 + 0.6 * s) + ')'; p.beginPath(); p.ellipse(SX, y, 9, 6, 0, 0, 7); p.fill(); });
      if (!now.found.length) { p.fillText('No spots:', SX, 120); p.fillText('no amino acids', SX, 132); }
    }
    function drawChart() {
      var series = [], v = sim.v;
      GASL.forEach(function (g, i) { var pts = []; for (var d = 0; d <= 14.001; d += 0.5) pts.push([d, model({ gas: g[0], spark: v.spark, days: d }).yld]); series.push({ name: GASES[g[0]].short, pts: pts, color: ['#D55E00', '#0072B2', '#009E73'][i], dash: g[0] !== v.gas }); });
      series.push({ name: 'Now', pts: [[v.days, sim.yld]], color: '#000', dots: true });
      api.chart(ch, { xLabel: 'Time / days', yLabel: 'Amino acid yield / % of carbon', xmin: 0, xmax: 14, ymin: 0, ymax: 6, series: series });
      api.stage.querySelector('#mu-lg').innerHTML = api.legend(series.slice(0, 3)) + '<p class="small muted" style="margin:4px 0 0">The curves show the model for the spark you chose. Your recorded trials make the graph in 4 Results.</p>';
    }
    function readings() {
      api.readings([['Amino acid yield', fx(sim.yld, 2) + ' % of carbon'], ['All organic compounds', fx(sim.org, 1) + ' % of carbon'], ['Amino acids identified', String(sim.found.length)],
        ['Found', sim.found.length ? sim.found.map(function (a) { return a[0]; }).join(', ') : 'none'], ['Trap liquid', sim.colour > 0.6 ? 'deep red-brown' : sim.colour > 0.25 ? 'pink' : sim.colour > 0.05 ? 'faint' : 'clear']]);
    }
    function frame() { var el = Math.min(1, (performance.now() - t0) / 8000); draw(el); if (el >= 1) { playing = false; api.label('run', '▶ Run the apparatus'); api.status('Run finished: read the yield and the chromatogram, then press ➕ Record trial.'); draw(1); return; } if (playing) raf = requestAnimationFrame(frame); }
    api.actions([
      { id: 'run', label: '▶ Run the apparatus', main: true, fn: function () { if (playing) { playing = false; cancelAnimationFrame(raf); api.label('run', '▶ Run the apparatus'); return; } compute(); readings(); reset(); playing = true; t0 = performance.now(); api.label('run', '⏸ Pause'); api.status('Running: ' + sim.v.days + ' days in 8 seconds.'); frame(); } },
      { id: 'rec', label: '➕ Record trial', fn: function () {
        var v = sim.v; api.record({ gas: sim.G.short, spark: SPARK.filter(function (x) { return x[0] === v.spark; })[0][1], days: v.days, yld: +sim.yld.toFixed(2), org: +sim.org.toFixed(1), n: sim.found.length, aa: sim.found.map(function (a) { return a[0]; }).join(', ') || 'none' });
      } }
    ]);
    api.onChange = function () { compute(); readings(); reset(); drawChart(); if (!playing) draw(1); };
    compute(); readings(); reset(); drawChart(); draw(0);
    api.status('Press ▶ Run the apparatus to boil the water and switch on the sparks.');
    window.BV_MU = { model: model };   // for tests
  }
})();
