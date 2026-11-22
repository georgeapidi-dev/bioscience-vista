/* Chemical signalling laboratory · BioscienceVista · by George Apidi
   Ligands bind receptors: transmembrane receptors (adrenaline → G protein → cAMP; insulin → tyrosine kinase → GLUT4) and an intracellular
   receptor (oestradiol → gene expression). Change the ligand concentration, the number of receptors, a competitive blocker and the cell type;
   measure receptor occupancy and the size and speed of the response. */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var LIG = {
    adr: { name: 'Adrenaline', kd: 5, tau: 12, time: 15, unit: 's', where: 'transmembrane', rec: 'β-adrenergic receptor (G-protein-coupled)', msg: 'cAMP (second messenger)', out: 'glucose released from glycogen' },
    ins: { name: 'Insulin', kd: 1, tau: 4, time: 5, unit: 'min', where: 'transmembrane', rec: 'insulin receptor (tyrosine kinase)', msg: 'phosphorylated proteins', out: 'GLUT4 moved to membrane: glucose taken in' },
    est: { name: 'Oestradiol', kd: 0.2, tau: 1.5, time: 2, unit: 'h', where: 'intracellular', rec: 'oestrogen receptor in the cytoplasm', msg: 'receptor–hormone complex in the nucleus', out: 'new protein made (gene switched on)' }
  };
  var LIGS = [['adr', 'Adrenaline (hydrophilic; transmembrane receptor)'], ['ins', 'Insulin (protein; transmembrane receptor)'], ['est', 'Oestradiol (steroid, hydrophobic; intracellular receptor)']];
  var RECS = [['0.25', 'Few receptors (25 %)'], ['0.5', 'Half the normal number'], ['1', 'Normal number of receptors'], ['2', 'Twice the normal number']];
  var BLOCK = [['0', 'No blocker'], ['3', 'Competitive blocker: low'], ['30', 'Competitive blocker: high']];
  var CELLS = [['target', 'Target cell (has the receptor)'], ['non', 'Non-target cell (no receptor)']];

  function model(o) {   // o: {lig, logc, rho, block, cell}
    var L = LIG[o.lig], c = Math.pow(10, o.logc), kd = L.kd * (1 + o.block), rho = o.cell === 'non' ? 0 : o.rho;
    var occ = rho ? c / (c + kd) : 0, S = L.tau * rho * occ, resp = S / (S + 1) * 100;
    var tr = L.tau * rho, ec50 = tr > 1 ? kd / (tr - 1) : null, max = tr / (tr + 1) * 100;
    var speedF = 1 / (0.35 + 0.65 * Math.min(1, occ * rho * 2 + 0.05));   // a weak signal builds up more slowly
    return { L: L, c: c, occ: occ * 100, resp: resp, ec50: ec50, max: max, time: resp > 1 ? L.time * speedF : null, messengers: Math.round(occ * rho * 1000 * L.tau / 3) };
  }

  LABS.signalling = {
    id: 'signalling', title: 'Chemical signalling laboratory: ligands and receptors',
    tags: ['Biology', 'Cell biology', 'MYP 4–5', 'IB DP C2.1 Chemical signalling', 'IGCSE hormones', 'A Level'],
    background: '<p>Cells communicate with <b>signalling chemicals (ligands)</b> such as <b>hormones</b>, neurotransmitters and cytokines. A ligand only affects a cell that has a matching <b>receptor</b>: a protein whose binding site fits the ligand. Those cells are its <b>target cells</b>.</p>' +
      '<p><b>Hydrophilic ligands</b> (adrenaline, insulin, peptide hormones) cannot cross the phospholipid bilayer. They bind <b>transmembrane receptors</b>. Binding changes the shape of the receptor and starts <b>signal transduction</b> inside the cell. Adrenaline\'s receptor activates a <b>G protein</b>, which activates adenylyl cyclase to make many <b>cAMP</b> molecules (a <b>second messenger</b>): one hormone molecule leads to thousands of product molecules (<b>amplification</b>). The insulin receptor is a <b>tyrosine kinase</b>: it phosphorylates itself and other proteins, so vesicles carrying <b>GLUT4</b> glucose transporters move to the membrane.</p>' +
      '<p><b>Hydrophobic ligands</b> (steroids such as oestradiol and testosterone) diffuse through the membrane and bind <b>intracellular receptors</b>. The hormone–receptor complex enters the nucleus and switches genes on or off, so the response (new proteins) is slower but lasts longer.</p>' +
      '<p>The response depends on the <b>ligand concentration</b> and the number of receptors: more ligand means more receptors are <b>occupied</b>, until nearly all are bound (saturation). A <b>competitive blocker</b> (antagonist) binds the same site without activating it, so more ligand is needed.</p>',
    objectives: ['Explain why only target cells respond to a hormone.', 'Compare transmembrane and intracellular receptors, and hydrophilic and hydrophobic ligands.', 'Investigate how ligand concentration affects receptor occupancy and the size of the response.', 'Explain amplification by second messengers and the effect of a competitive blocker.'],
    rq: 'How does the concentration of a hormone (0.001 to 1000 nmol/dm³) affect receptor occupancy and the size of the response of its target cells?',
    hypPrompt: 'Predict how the response changes as the hormone concentration increases from very low to very high. Explain using receptors.',
    hypothesis: { marks: 3, points: [
      { re: [/(increase|more|higher|greater).*(concentration|hormone|ligand).*(increase|more|greater|bigger|larger) (response|effect)|response.*(increase|rise)/], marks: 1, ok: 'You predict a bigger response at higher concentrations.', miss: 'Predict how the response changes as the concentration increases.' },
      { re: [/level|plateau|maximum|saturat|all (the )?receptors|stop increasing|no further/], marks: 1, ok: 'You predict the response levels off.', miss: 'What happens when almost all receptors are bound?' },
      { re: [/receptor.*(bound|occupied|bind)|bind.*receptor|more receptors (are )?(bound|occupied)|occupan/], marks: 1, ok: 'You explain with receptor binding.', miss: 'Explain using the number of receptors that are bound (occupied).' }] },
    variables: { iv: 'ligand concentration (nmol/dm³, plotted as log₁₀)', dv: 'response of the target cell (% of the largest possible) and receptor occupancy (%)', cv: ['type of ligand', 'number of receptors per cell', 'no blocker', 'temperature and time of exposure', 'type of cell (target cell)'] },
    apparatus: ['Model target cell with receptors (membrane or cytoplasm)', 'Hormone solutions from 0.001 to 1000 nmol/dm³ (serial dilution, 10× steps)', 'Sensor for the response: glucose released (adrenaline), glucose taken up (insulin) or new protein made (oestradiol)', 'In a real lab: cultured liver, muscle or breast cells, a plate reader and a serial dilution of the hormone'],
    safety: ['Virtual lab. In real cell-culture work, hormones and blockers are drugs: wear gloves, and follow aseptic technique.'],
    method: ['Choose <b>Adrenaline</b>, a <b>target cell</b> with the <b>normal number of receptors</b> and <b>no blocker</b>.', 'Set log₁₀ concentration to −3 (0.001 nmol/dm³) and press <b>▶ Add hormone</b>. Watch the ligands bind and the signal pass through the cell.', 'Press <b>➕ Record trial</b>. Repeat for log₁₀ concentration −3, −2, −1, 0, 1, 2 and 3 (each step is ten times stronger).', 'Repeat with <b>Insulin</b> and <b>Oestradiol</b>. Then try fewer receptors, a blocker, and a non-target cell.'],
    controls: [
      { id: 'lig', label: 'Ligand (signalling chemical)', type: 'select', value: 'adr', options: LIGS },
      { id: 'logc', label: 'Ligand concentration: log₁₀(nmol/dm³)', min: -3, max: 3, step: 0.5, value: 0, dp: 1 },
      { id: 'rho', label: 'Receptors per cell', type: 'select', value: '1', options: RECS },
      { id: 'block', label: 'Competitive blocker (antagonist)', type: 'select', value: '0', options: BLOCK },
      { id: 'cell', label: 'Cell', type: 'select', value: 'target', options: CELLS }
    ],
    columns: [
      { key: 'lig', label: 'Ligand', num: false, group: true }, { key: 'cell', label: 'Cell', num: false, group: true }, { key: 'rec', label: 'Receptors', num: false, group: true }, { key: 'blk', label: 'Blocker', num: false, group: true },
      { key: 'logc', label: 'log₁₀ concentration', dp: 1 }, { key: 'c', label: 'Concentration', unit: 'nmol/dm³', dp: 3 }, { key: 'occ', label: 'Receptors occupied', unit: '%', dp: 0 },
      { key: 'resp', label: 'Response', unit: '% of maximum', dp: 0 }, { key: 'time', label: 'Time to respond', num: false }
    ],
    graph: { x: 'logc', y: 'resp', group: 'lig' },
    hints: ['Each step of 1 on the log₁₀ scale is 10 times more concentrated.', 'Look at how many receptors are bound (occupied) as you add more ligand.', 'Why can oestradiol pass through the membrane but adrenaline cannot?', 'Compare the receptor occupancy with the response for adrenaline: amplification means a small occupancy can give a large response.'],
    analyse: [
      { id: 'ec50', q: 'From your graph for adrenaline (normal receptors, no blocker), estimate the concentration that gives 50 % of the maximum response, in nmol/dm³.', marks: 2, lines: 1,
        number: { value: function () { return model({ lig: 'adr', logc: 0, rho: 1, block: 0, cell: 'target' }).ec50; }, tol: 1.2, unit: 'nmol/dm³', dp: 2 } },
      { id: 'shape', q: 'Describe the shape of your graph and explain it using receptor occupancy.', marks: 3, lines: 4, points: [
        { re: [/s.shape|sigmoid|increase|rise/], marks: 1, ok: 'You describe the rise.', miss: 'Describe how the response rises as concentration increases.' },
        { re: [/level|plateau|maximum|saturat|flatten/], marks: 1, ok: 'You describe it levelling off.', miss: 'Describe the response levelling off at high concentrations.' },
        { re: [/(all|most|nearly all) (the )?receptors.*(occupied|bound|full)|occup.*(100|maximum)|no (more|free) receptors|saturat/], marks: 1, ok: 'You explain with saturated receptors.', miss: 'Explain: when nearly all receptors are occupied, more ligand cannot increase the response.' }] },
      { id: 'amp', q: 'At log₁₀ concentration −1, compare the receptor occupancy with the response for adrenaline. Explain the difference using second messengers.', marks: 3, lines: 4, points: [
        { re: [/\d/], marks: 1, ok: 'You quote figures.', miss: 'Quote the occupancy (%) and the response (%).' },
        { re: [/camp|second messenger|g.protein|adenylyl|cyclase/], marks: 1, ok: 'You name the second messenger pathway.', miss: 'Name the G protein / adenylyl cyclase / cAMP pathway.' },
        { re: [/amplif|many|thousands|one (hormone|molecule|receptor).*(many|lots)|cascade/], marks: 1, ok: 'You explain amplification.', miss: 'Explain amplification: one bound receptor makes many cAMP molecules, so a small occupancy gives a big response.' }] },
      { id: 'recep', q: 'Compare how adrenaline and oestradiol reach and use their receptors, and explain why oestradiol\'s response takes hours.', marks: 3, lines: 4, points: [
        { re: [/(adrenaline|hydrophilic).*(cannot|can't|does not|doesn't).*(cross|pass|enter)|transmembrane|(membrane|surface) receptor/], marks: 1, ok: 'Adrenaline: transmembrane receptor (cannot cross the membrane).', miss: 'Adrenaline is hydrophilic: it cannot cross the membrane, so it binds a transmembrane receptor.' },
        { re: [/(oestradiol|oestrogen|steroid|hydrophobic|lipid).*(cross|pass|diffuse|enter)|intracellular|inside the cell|cytoplasm/], marks: 1, ok: 'Oestradiol: crosses the membrane to an intracellular receptor.', miss: 'Oestradiol is hydrophobic: it diffuses through the membrane and binds a receptor in the cytoplasm.' },
        { re: [/gene|transcription|nucleus|mrna|protein synthesis|new protein|translation/], marks: 1, ok: 'Slow because genes are switched on.', miss: 'Explain that the complex switches genes on in the nucleus, and making new proteins takes time.' }] }
    ],
    evaluate: [
      { id: 'block', q: 'Add the high blocker to adrenaline. Describe how the graph moves and explain how a competitive blocker (such as a beta-blocker) works.', marks: 2, lines: 3, points: [
        { re: [/right|higher concentration|more (hormone|adrenaline|ligand)|shift/], marks: 1, ok: 'The curve shifts to the right.', miss: 'Say the curve shifts right: more adrenaline is needed for the same response.' },
        { re: [/same (site|shape|binding)|compet|bind.*receptor.*(without|not activat|no response)|occup.*receptor/], marks: 1, ok: 'It competes for the binding site without activating it.', miss: 'Explain that the blocker binds the same site on the receptor but does not activate it.' }] },
      { id: 'non', q: 'Why does a non-target cell not respond, even at a very high hormone concentration?', marks: 1, lines: 2, points: [
        { re: [/no (matching |specific )?receptor|lacks? (the )?receptor|not have (the|a|any) receptor|without (a |the )?receptor/], marks: 1, ok: 'No receptor for that hormone.', miss: 'A cell responds only if it has the receptor that fits the hormone.' }] },
      { id: 'model', q: 'State one way this model is simpler than real cell signalling.', marks: 1, lines: 2, points: [
        { re: [/one cell|single|time|break.?down|remov|feedback|desensiti|degrad|internal|equation|formula|constant|other (hormones|signals)|real cells/], marks: 1, ok: 'A valid simplification.', miss: 'For example: no breakdown or removal of the hormone, no feedback or desensitisation of receptors, one cell type only.' }] }
    ],
    model: '<ul><li><b>Occupancy</b> = [L] ÷ ([L] + K<sub>d</sub>), with K<sub>d</sub> 5 nmol/dm³ (adrenaline), 1 (insulin) and 0.2 (oestradiol). A competitive blocker multiplies K<sub>d</sub> by (1 + [B]/K<sub>B</sub>), with [B]/K<sub>B</sub> = 3 (low) or 30 (high).</li>' +
      '<li><b>Response</b> (operational model): S = τ × receptors × occupancy, response = S ÷ (S + 1). The transducer ratio τ shows amplification: 12 for adrenaline (G protein → cAMP), 4 for insulin, 1.5 for oestradiol. So adrenaline gives a large response with few receptors occupied.</li>' +
      '<li>Typical times to respond: seconds (adrenaline), minutes (insulin), hours (oestradiol); a weaker signal builds up more slowly. Values are typical, not measured from one cell type.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, sim = null, raf = null, playing = false, t0 = 0, parts = [], cv, c, W = 640, H = 330;
    api.stage.innerHTML = '<canvas id="sg-cv" width="640" height="330" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="A target cell with receptors; ligand molecules bind and pass the signal inside"></canvas>' +
      '<p class="small" id="sg-cap" style="margin:6px 0;font-weight:700"></p><canvas class="vl-chart" id="sg-ch" style="height:220px"></canvas><div id="sg-lg"></div>';
    cv = api.stage.querySelector('#sg-cv'); c = cv.getContext('2d');
    var ch = api.stage.querySelector('#sg-ch'), cap = api.stage.querySelector('#sg-cap');
    var CX = 330, CY = 200, RX = 230, RY = 105, NX = 380, NY = 215;
    function compute() { var v = api.vals(); sim = model({ lig: v.lig, logc: v.logc, rho: +v.rho, block: +v.block, cell: v.cell }); sim.v = v; }
    function recSites() {   // positions of receptors
      var n = Math.max(0, Math.round(8 * (+sim.v.rho))), out = [];
      if (sim.v.cell === 'non') return out;
      for (var i = 0; i < n; i++) {
        if (LIG[sim.v.lig].where === 'transmembrane') { var a = Math.PI * (1.08 + 0.84 * (i + 0.5) / n); out.push({ x: CX + RX * Math.cos(a), y: CY + RY * Math.sin(a), a: a }); }
        else out.push({ x: CX - 170 + (i % 8) * 34, y: CY - 30 + Math.floor(i / 8) * 26 + (i % 2) * 10, a: 0 });
      }
      return out;
    }
    function reset() {
      parts = []; var n = Math.round(4 + (sim.v.logc + 3) * 6);
      for (var i = 0; i < n; i++) parts.push({ x: 30 + Math.random() * 580, y: 10 + Math.random() * 70, vx: (Math.random() - 0.5) * 40, vy: 10 + Math.random() * 20, bound: -1, kind: 'L' });
      if (+sim.v.block) for (var j = 0; j < (+sim.v.block > 10 ? 10 : 4); j++) parts.push({ x: 30 + Math.random() * 580, y: 10 + Math.random() * 70, vx: (Math.random() - 0.5) * 40, vy: 10 + Math.random() * 20, bound: -1, kind: 'B' });
    }
    function draw(el) {
      var v = sim.v, L = LIG[v.lig], R = recSites(), hydro = L.where === 'intracellular', occN = Math.round(R.length * sim.occ / 100);
      c.clearRect(0, 0, W, H); c.fillStyle = '#fef2f2'; c.fillRect(0, 0, W, 92); c.fillStyle = '#991b1b'; c.font = 'bold 12px system-ui'; c.textAlign = 'left'; c.fillText('Blood / tissue fluid: ' + L.name + ' ' + fx(sim.c, sim.c < 0.1 ? 3 : 1) + ' nmol/dm³', 10, 16);
      // cell
      c.fillStyle = '#ecfeff'; c.strokeStyle = '#0e7490'; c.lineWidth = 7; c.beginPath(); c.ellipse(CX, CY, RX, RY, 0, Math.PI, 2 * Math.PI); c.lineTo(CX + RX, H + 10); c.lineTo(CX - RX, H + 10); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ddd6fe'; c.strokeStyle = '#6d28d9'; c.lineWidth = 2; c.beginPath(); c.ellipse(NX, NY + 40, 80, 50, 0, 0, Math.PI * 2); c.fill(); c.stroke(); c.fillStyle = '#5b21b6'; c.font = 'bold 12px system-ui'; c.textAlign = 'center'; c.fillText('nucleus', NX, NY + 44);
      c.fillStyle = '#0e7490'; c.textAlign = 'left'; c.fillText((v.cell === 'non' ? 'Non-target cell: no ' + L.name.toLowerCase() + ' receptors' : 'Target cell'), CX - 140, CY - 60);
      // receptors
      R.forEach(function (r, i) {
        var bound = i < occN && el > 0.25;
        c.save(); c.translate(r.x, r.y); if (!hydro) c.rotate(r.a + Math.PI / 2);
        c.fillStyle = bound ? '#16a34a' : '#64748b'; c.fillRect(-6, -12, 12, 24); c.beginPath(); c.arc(0, -14, 8, Math.PI, 0); c.fill();
        if (bound) { c.fillStyle = v.lig === 'est' ? '#f59e0b' : '#dc2626'; c.beginPath(); c.arc(0, -16, 6, 0, Math.PI * 2); c.fill(); }
        c.restore();
      });
      // free ligands and blockers (in the fluid; steroid ones drift into the cell)
      parts.forEach(function (p) {
        p.x += p.vx * 0.016; p.y += p.vy * 0.016; if (p.x < 10 || p.x > 630) p.vx *= -1;
        var lim = hydro && p.kind === 'L' ? 300 : 84; if (p.y > lim || p.y < 8) p.vy *= -1;
        c.fillStyle = p.kind === 'B' ? '#334155' : v.lig === 'est' ? '#f59e0b' : '#dc2626'; c.beginPath();
        if (p.kind === 'B') c.rect(p.x - 5, p.y - 5, 10, 10); else c.arc(p.x, p.y, 5, 0, Math.PI * 2); c.fill();
      });
      // inside: the signal
      var stage = el, k, sig = sim.resp / 100;
      if (v.cell !== 'non' && occN > 0 && stage > 0.35) {
        if (v.lig === 'adr') {
          c.fillStyle = '#7c3aed'; c.font = 'bold 11px system-ui'; c.textAlign = 'left'; c.fillText('G protein → adenylyl cyclase → cAMP', CX - 160, CY - 30);
          for (k = 0; k < Math.round(60 * sig); k++) { var ang = k * 2.4, rr = 20 + (k * 7) % 120 * Math.min(1, (stage - 0.35) * 2); c.fillStyle = '#8b5cf6'; c.beginPath(); c.arc(CX - 60 + Math.cos(ang) * rr, CY + 10 + Math.sin(ang) * rr * 0.4, 3, 0, 7); c.fill(); }
          if (stage > 0.7) for (k = 0; k < Math.round(14 * sig); k++) { c.fillStyle = '#0ea5e9'; c.beginPath(); c.arc(CX - RX + 40 + k * 10, 92 - ((el * 200 + k * 13) % 70), 4, 0, 7); c.fill(); }
        } else if (v.lig === 'ins') {
          c.fillStyle = '#7c3aed'; c.font = 'bold 11px system-ui'; c.textAlign = 'left'; c.fillText('receptor phosphorylates proteins (P) → GLUT4 vesicles move up', CX - 200, CY - 30);
          for (k = 0; k < Math.round(8 * sig) + 1; k++) { var yv = CY + 60 - Math.min(1, (stage - 0.35) * 1.6) * 80; c.strokeStyle = '#0284c7'; c.lineWidth = 2; c.beginPath(); c.arc(CX - 150 + k * 40, yv, 9, 0, 7); c.stroke(); c.fillStyle = '#0284c7'; c.fillRect(CX - 152 + k * 40, yv - 3, 4, 6); }
          if (stage > 0.75) for (k = 0; k < Math.round(16 * sig); k++) { c.fillStyle = '#0ea5e9'; c.beginPath(); c.arc(CX - 160 + k * 18, 70 + ((el * 160 + k * 11) % 60), 4, 0, 7); c.fill(); }
        } else {
          c.fillStyle = '#7c3aed'; c.font = 'bold 11px system-ui'; c.textAlign = 'left'; c.fillText('hormone–receptor complex → nucleus → mRNA → new protein', CX - 200, CY - 46);
          var mv = Math.min(1, Math.max(0, (stage - 0.4) * 2.2)); for (k = 0; k < Math.min(occN, 6); k++) { c.fillStyle = '#16a34a'; c.beginPath(); c.arc(CX - 120 + k * 25 + mv * (NX - (CX - 120 + k * 25)) * 0.8, CY - 10 + mv * 45, 6, 0, 7); c.fill(); }
          if (stage > 0.8) for (k = 0; k < Math.round(12 * sig) + 1; k++) { c.fillStyle = '#ea580c'; c.fillRect(CX - 200 + k * 16, CY + 70 + (k % 3) * 8, 9, 5); }
        }
      }
      cap.textContent = v.cell === 'non' ? 'No receptor: the ' + L.name.toLowerCase() + ' cannot bind, so there is no response.' :
        (stage < 0.3 ? L.name + ' molecules ' + (hydro ? 'diffuse through the membrane' : 'cannot cross the membrane: they bind receptors on the surface') + '…' :
          fx(sim.occ, 0) + ' % of receptors occupied (' + L.rec + ') → ' + L.msg + ' → ' + L.out + '. Response ' + fx(sim.resp, 0) + ' %.');
    }
    function drawChart() {
      var pts = [], ptsO = []; for (var x = -3; x <= 3.001; x += 0.1) { var m = model({ lig: sim.v.lig, logc: x, rho: +sim.v.rho, block: +sim.v.block, cell: sim.v.cell }); pts.push([+x.toFixed(1), m.resp]); ptsO.push([+x.toFixed(1), m.occ]); }
      var series = [{ name: 'Response (%)', pts: pts, color: '#D55E00' }, { name: 'Receptors occupied (%)', pts: ptsO, color: '#0072B2', dash: true }, { name: 'Now', pts: [[sim.v.logc, sim.resp]], color: '#000', dots: true, line: false }];
      api.chart(ch, { xLabel: 'log₁₀ (concentration / nmol dm⁻³)', yLabel: 'Percentage', xmin: -3, xmax: 3, ymin: 0, ymax: 100, series: series });
      api.stage.querySelector('#sg-lg').innerHTML = api.legend(series.slice(0, 2)) + '<p class="small muted" style="margin:4px 0 0">The curves show the model for the settings you chose. Your recorded trials make the graph in 4 Results.</p>';
    }
    function readings() {
      api.readings([['Concentration', fx(sim.c, sim.c < 0.1 ? 3 : 2) + ' nmol/dm³'], ['Receptors occupied', fx(sim.occ, 0) + ' %'], ['Response', fx(sim.resp, 0) + ' % of maximum'],
        ['Time to respond', sim.time != null ? '≈ ' + fx(sim.time, 1) + ' ' + sim.L.unit : 'no response'], ['Receptor', sim.v.cell === 'non' ? 'none on this cell' : sim.L.where], ['Signal molecules per cell', sim.v.cell === 'non' ? '0' : sim.messengers.toLocaleString()]]);
    }
    function frame() { var el = Math.min(1.2, (performance.now() - t0) / 6000); draw(el); if (playing) raf = requestAnimationFrame(frame); }
    api.actions([
      { id: 'run', label: '▶ Add hormone', main: true, fn: function () { if (playing) { playing = false; cancelAnimationFrame(raf); api.label('run', '▶ Add hormone'); return; } compute(); readings(); reset(); playing = true; t0 = performance.now(); api.label('run', '⏸ Pause'); api.enable('rec', true); frame(); api.status('Watch the hormone bind and the signal pass through the cell, then record the trial.'); } },
      { id: 'rec', label: '➕ Record trial', fn: function () {
        var v = sim.v, t = sim.time != null ? fx(sim.time, 1) + ' ' + sim.L.unit : 'none';
        api.record({ lig: sim.L.name, cell: v.cell === 'non' ? 'Non-target' : 'Target', rec: RECS.filter(function (x) { return x[0] === v.rho; })[0][1], blk: BLOCK.filter(function (x) { return x[0] === v.block; })[0][1].replace('Competitive blocker: ', ''), logc: v.logc, c: +sim.c.toPrecision(3), occ: sim.occ, resp: sim.resp, time: t });
      } }
    ]);
    api.onChange = function () { compute(); readings(); reset(); drawChart(); if (!playing) { t0 = performance.now() - 6000; draw(1.2); } };
    compute(); readings(); reset(); drawChart(); draw(0);
    api.status('Press ▶ Add hormone to add the ligand to the fluid around the cell.');
    window.BV_SIGNAL = { model: model };   // for tests
  }
})();
