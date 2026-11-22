/* Microscope laboratory · BioscienceVista · by George Apidi
   IB DP A2.2.2 microscopy skills (temporary mounts, staining, coarse and fine focus, eyepiece graticule, magnification and actual size),
   D2.1.8 and D2.1.17 phases of mitosis and the mitotic index, B3.1.10 stomatal density, B3.2.2 arteries and veins,
   B3.2.9–10 plan diagrams of dicot stem and root. One virtual light microscope with eight slides. */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var SPEC = [
    ['onion', 'Onion epidermis (temporary mount)'], ['cheek', 'Human cheek cells (temporary mount)'], ['elodea', 'Elodea leaf (temporary mount)'],
    ['root', 'Root tip squash: meristem (mitosis)'], ['rootold', 'Root tip squash: 5 mm behind the tip'], ['tumour', 'Tumour tissue (prepared slide)'],
    ['lower', 'Leaf cast: lower epidermis (stomata)'], ['upper', 'Leaf cast: upper epidermis (stomata)'],
    ['vessels', 'Artery and vein (transverse section)'], ['stem', 'Dicot stem (transverse section)'], ['droot', 'Dicot root (transverse section)']];
  var STAIN = [['none', 'No stain (water)'], ['iodine', 'Iodine solution'], ['mblue', 'Methylene blue'], ['orcein', 'Acetic orcein (stains chromosomes)']];
  var OBJ = [['4', '×4 objective (low power)'], ['10', '×10 objective (medium power)'], ['40', '×40 objective (high power)']];
  var EPU = { 4: 25, 10: 10, 40: 2.5 };   // µm per eyepiece graticule unit (from the stage micrometer)
  var FIELD = { 4: 4500, 10: 1800, 40: 450 };   // field of view diameter (µm)
  var MI = { root: 0.14, rootold: 0.015, tumour: 0.34 };
  var STOM = { lower: 260, upper: 45 };   // stomata per mm²
  var TARGET = { onion: [240, 'one onion cell (length)'], cheek: [62, 'one cheek cell (diameter)'], elodea: [58, 'one Elodea cell (length)'], root: [16, 'one meristem cell'], rootold: [16, 'one cell'], tumour: [16, 'one cell'], lower: [32, 'one pair of guard cells'], upper: [32, 'one pair of guard cells'], vessels: [860, 'the artery (outer diameter)'], stem: [3000, 'the stem (diameter)'], droot: [1500, 'the root (diameter)'] };

  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function cellsFor(sp, seed) {   // objects in a 2 mm × 2 mm area centred on 0,0 (µm)
    var r = rng(seed * 97 + sp.length * 13), out = [], i, x, y;
    if (sp === 'root' || sp === 'rootold' || sp === 'tumour') {
      var mi = MI[sp];
      for (x = -320; x < 320; x += 16) for (y = -320; y < 320; y += 16) {
        if (sp === 'rootold' && r() < 0.0) continue;
        var u = r(), ph = 'I'; if (u < mi) { var v = r(); ph = v < 0.42 ? 'P' : v < 0.62 ? 'M' : v < 0.78 ? 'A' : 'T'; }
        out.push({ x: x + (r() - 0.5) * 3, y: y + (r() - 0.5) * 3, w: sp === 'rootold' ? 15 : 14 + r() * 3, h: sp === 'rootold' ? 30 : 14 + r() * 3, ph: ph, a: r() * 6.28 });
      }
    } else if (sp === 'lower' || sp === 'upper') {
      var n = Math.round(STOM[sp] * 1.0 * 1.0 * (0.85 + r() * 0.3));   // per mm² over 1 mm²
      for (i = 0; i < n; i++) out.push({ x: (r() - 0.5) * 1000, y: (r() - 0.5) * 1000, a: r() * 3.14, s: 1 });
    } else if (sp === 'cheek') {
      for (i = 0; i < 70; i++) out.push({ x: (r() - 0.5) * 1400, y: (r() - 0.5) * 1400, rr: 25 + r() * 12, a: r() * 6.28, k: r() });
    }
    return out;
  }
  function inField(o, obj) { var R = FIELD[obj] / 2; return o.x * o.x + o.y * o.y < R * R; }
  function model(o) {   // o: {spec, obj, coarse, fine, stain, seed}
    var obj = +o.obj, objs = cellsFor(o.spec, o.seed), shown = objs.filter(function (c) { return inField(c, obj); });
    var blur = Math.abs(o.coarse - 50) * (obj === 40 ? 0.5 : obj === 10 ? 0.25 : 0.12) * (obj === 40 ? 1.6 : 1) + Math.abs(o.fine - 50) * (obj === 40 ? 0.12 : 0.04);
    var t = TARGET[o.spec], epu = t[0] / EPU[obj], res = { obj: obj, mag: obj * 10, epuSize: EPU[obj], target: t, epu: epu, blur: blur, n: shown.length };
    if (MI[o.spec] != null) { res.cells = shown.length; res.mit = shown.filter(function (c) { return c.ph !== 'I'; }).length; res.mi = res.cells ? res.mit / res.cells : 0; ['P', 'M', 'A', 'T'].forEach(function (k) { res[k] = shown.filter(function (c) { return c.ph === k; }).length; }); }
    if (STOM[o.spec] != null) { var area = Math.PI * Math.pow(FIELD[obj] / 2000, 2); res.stomata = shown.length; res.area = area; res.density = shown.length / area; }
    return res;
  }

  LABS.microscope = {
    id: 'microscope', title: 'Microscope laboratory: mounts, measuring cells, mitotic index and stomata',
    tags: ['Biology', 'Cells', 'IB DP A2.2.2 microscopy skills', 'IB DP D2.1.17 mitotic index', 'IB DP B3.1.10 stomatal density', 'IB DP B3.2.2 · B3.2.9–10 sections', 'IGCSE', 'A Level'],
    background: '<p>A <b>light microscope</b> magnifies with two lenses: total magnification = eyepiece (×10) × objective (×4, ×10 or ×40). Always start with the <b>low-power objective</b> and the <b>coarse focus</b>; change to higher power and use only the <b>fine focus</b>. Thin specimens are made into <b>temporary mounts</b>: a drop of water or <b>stain</b> on a slide, the tissue, and a <b>coverslip</b> lowered at an angle to avoid air bubbles. <b>Iodine</b> stains starch and nuclei of plant cells yellow-brown; <b>methylene blue</b> stains animal nuclei blue; <b>acetic orcein</b> stains chromosomes red-purple.</p>' +
      '<p>To <b>measure</b> cells, an <b>eyepiece graticule</b> (a scale in the eyepiece) is calibrated against a <b>stage micrometer</b> for each objective. Actual size = number of eyepiece units × µm per unit. Magnification = image size ÷ actual size. A <b>scale bar</b> shows actual size on a drawing or photo.</p>' +
      '<p>The <b>mitotic index</b> = number of cells in mitosis ÷ total number of cells. It is high where cells divide fast: the root tip <b>meristem</b>, and <b>tumours</b>. <b>Stomatal density</b> = number of stomata ÷ area of the field of view (π r²); leaf casts with clear nail varnish show the epidermis. Transverse sections show the tissues of <b>arteries and veins</b>, and the arrangement of xylem and phloem in <b>dicot stems and roots</b> (drawn as plan diagrams).</p>',
    objectives: ['Make a temporary mount, stain it and focus with coarse and fine adjustment.', 'Calibrate an eyepiece graticule and calculate the actual size of cells, the magnification and a scale bar.', 'Identify the phases of mitosis and calculate the mitotic index of meristem, older root and tumour tissue.', 'Calculate stomatal density, and identify arteries, veins and the tissues of stems and roots.'],
    rq: 'How does the mitotic index differ between the root tip meristem, the root 5 mm behind the tip and tumour tissue?',
    hypPrompt: 'Predict which tissue has the highest mitotic index, and explain why.',
    hypothesis: { marks: 2, points: [
      { re: [/tumou?r|meristem|tip/], marks: 1, ok: 'You predict the fast-dividing tissue has the highest index.', miss: 'Say which tissue you expect to have the highest mitotic index.' },
      { re: [/divid|mitosis|uncontroll|growth|grow/], marks: 1, ok: 'You explain with the rate of cell division.', miss: 'Explain using how fast cells divide.' }] },
    variables: { iv: 'type of tissue (meristem, older root, tumour)', dv: 'mitotic index (cells in mitosis ÷ total cells)', cv: ['objective (×40)', 'stain and squash method', 'number of cells counted (at least 100, several fields)', 'how a cell is classed as in mitosis', 'age of the root'] },
    apparatus: ['Light microscope with ×10 eyepiece, ×4, ×10 and ×40 objectives', 'Eyepiece graticule and stage micrometer (1 mm in 100 divisions)', 'Slides, coverslips, mounted needle, forceps, dropper, filter paper', 'Stains: iodine, methylene blue, acetic orcein; 1 M HCl to soften root tips', 'Onion, Elodea, garlic or onion root tips, clear nail varnish for leaf casts'],
    safety: ['Hydrochloric acid and acetic orcein are corrosive: wear eye protection and gloves.', 'Cheek cells: use your own cells only, a clean cotton bud, and put used buds and slides into disinfectant.', 'Never use direct sunlight with a mirror: it can damage the eyes.'],
    method: ['Choose a slide and stain, then press <b>▶ Prepare and look</b> to make the mount and see the field of view.', 'Start with the <b>×4</b> objective and focus with <b>coarse focus</b>; change to ×10 and ×40 and use only the <b>fine focus</b>.', 'Read the size of the target cell in eyepiece units from the graticule; actual size = units × µm per unit (shown for each objective).', 'For root tips and leaf casts use ×40 and press <b>🔢 Count this field</b>; press <b>➕ Record</b>, then <b>↻ New field</b> and count at least 5 fields.'],
    controls: [
      { id: 'spec', label: 'Slide', type: 'select', value: 'onion', options: SPEC },
      { id: 'stain', label: 'Stain', type: 'select', value: 'iodine', options: STAIN },
      { id: 'obj', label: 'Objective', type: 'select', value: '10', options: OBJ },
      { id: 'coarse', label: 'Coarse focus', min: 0, max: 100, step: 1, value: 40 },
      { id: 'fine', label: 'Fine focus', min: 0, max: 100, step: 1, value: 50 }
    ],
    columns: [
      { key: 'spec', label: 'Slide', num: false, group: true }, { key: 'obj', label: 'Objective', unit: '×', dp: 0 }, { key: 'field', label: 'Field', dp: 0 },
      { key: 'epu', label: 'Target size', unit: 'eyepiece units', dp: 0 }, { key: 'um', label: 'Actual size', unit: 'µm', dp: 1 },
      { key: 'cells', label: 'Cells counted', dp: 0 }, { key: 'mit', label: 'Cells in mitosis', dp: 0 }, { key: 'mi', label: 'Mitotic index', dp: 3 }, { key: 'stom', label: 'Stomata', dp: 0 }, { key: 'dens', label: 'Stomatal density', unit: 'per mm²', dp: 0 }
    ],
    graph: { x: 'field', y: 'mi', group: 'spec' },
    hints: ['At ×40, 1 eyepiece unit = 2.5 µm; at ×10, 10 µm; at ×4, 25 µm.', 'Mitotic index = cells in prophase + metaphase + anaphase + telophase ÷ all cells counted.', 'Field of view area = π r²; at ×40 the diameter is 0.45 mm.', 'Only use the fine focus at ×40, or the objective may hit the slide.'],
    analyse: [
      { id: 'size', q: 'At ×40 an onion cell is 96 eyepiece units long (1 unit = 2.5 µm). Calculate its actual length in µm, and the magnification of a drawing where it is 60 mm long.', marks: 2, lines: 2, points: [
        { re: [/\b240\b/], marks: 1, ok: 'Actual length 240 µm.', miss: '96 × 2.5 = 240 µm.' }, { re: [/\b250\b|×\s*250|x\s*250/], marks: 1, ok: 'Magnification ×250.', miss: 'Magnification = 60 000 µm ÷ 240 µm = ×250.' }] },
      { id: 'mi', q: 'Calculate the mitotic index of the meristem from your counts (give it to 2 decimal places).', marks: 2, lines: 2, number: { value: function (ctx) { var r = ctx.trials.filter(function (t) { return /meristem/.test(t.spec) && t.cells; }); if (!r.length) return null; var c = 0, m = 0; r.forEach(function (t) { c += t.cells; m += t.mit; }); return m / c; }, tol: 0.06, abs: 0.01, dp: 2, missing: 'Count and record some meristem fields first.' } },
      { id: 'cmp', q: 'Compare the mitotic index of the meristem, the older root and the tumour. Explain the differences.', marks: 3, lines: 4, points: [
        { re: [/tumou?r.*(highest|most|greatest)|(highest|greatest).*tumou?r/], marks: 1, ok: 'Tumour highest.', miss: 'Say which tissue had the highest index.' },
        { re: [/(older|behind|5 mm|elongat).*(lowest|least|low|few)|(lowest|least).*(older|behind|5 mm)/], marks: 1, ok: 'Older root lowest: cells elongate and differentiate.', miss: 'Explain the low index behind the tip (cells elongate and differentiate).' },
        { re: [/uncontroll|mutation|oncogene|cell cycle|not regulated|repeated|tumour suppressor|checkpoint/], marks: 1, ok: 'Tumour cells divide without control.', miss: 'Explain the tumour: mutations remove control of the cell cycle.' }] },
      { id: 'stom', q: 'Compare the stomatal density of the lower and upper epidermis and suggest why they differ.', marks: 2, lines: 3, points: [
        { re: [/lower.*(more|higher|greater)|(more|higher).*lower/], marks: 1, ok: 'Lower epidermis has more stomata.', miss: 'Say which surface has more stomata.' },
        { re: [/water loss|transpir|evaporat|sun|heat|shad|cooler|dry/], marks: 1, ok: 'Less water loss on the shaded, cooler lower side.', miss: 'Explain: the lower surface is shaded and cooler, so less water is lost.' }] }
    ],
    evaluate: [
      { id: 'fields', q: 'Why should you count cells in several fields of view, and at least 100 cells?', marks: 2, lines: 3, points: [
        { re: [/represent|vary|variation|differ|uneven|random|whole/], marks: 1, ok: 'Fields vary: more fields are more representative.', miss: 'Fields differ, so several give a representative sample.' }, { re: [/reliab|mean|precis|chance|accura/], marks: 1, ok: 'A larger sample gives a more reliable mean.', miss: 'More cells give a more reliable estimate.' }] },
      { id: 'mount', q: 'Give two features of good technique when making a temporary mount and focusing.', marks: 2, lines: 3, points: [
        { re: [/angle|air bubble|coverslip|thin|one layer|single layer|stain/], marks: 1, ok: 'Thin layer, coverslip lowered at an angle.', miss: 'For example: a thin single layer, coverslip lowered at an angle to avoid bubbles.' },
        { re: [/low power|×4|x4|coarse.*(low|first)|fine.*(high|×40|x40)|only fine/], marks: 1, ok: 'Start on low power; fine focus only at high power.', miss: 'For example: focus first on low power with coarse focus; use only fine focus at ×40.' }] }
    ],
    model: '<ul><li>Calibration: 1 eyepiece unit = 25 µm (×4), 10 µm (×10), 2.5 µm (×40). Field of view diameter 4.5 mm, 1.8 mm and 0.45 mm. Total magnification = 10 × objective.</li>' +
      '<li>Typical sizes: onion cell 240 µm, cheek cell 62 µm, Elodea cell 58 µm, root meristem cell 16 µm, guard cell pair 32 µm. Mitotic index: meristem 0.14, 5 mm behind the tip 0.015, tumour 0.34 (each field is a random sample, so counts vary). Stomatal density: lower epidermis about 260, upper about 45 per mm².</li>' +
      '<li>Blur increases with distance from the best focus, much more at ×40; there the coarse focus is too crude, so the fine focus is needed.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, sim = null, raf = null, playing = false, t0 = 0, W = 640, H = 420, seed = 1, counted = false, prepared = false;
    api.stage.innerHTML = '<canvas id="mc-cv" width="640" height="420" style="width:100%;height:auto;background:#0f172a;border-radius:12px" role="img" aria-label="The view down the microscope"></canvas><p class="small" id="mc-cap" style="margin:6px 0;font-weight:700" aria-live="polite"></p>';
    var cv = api.stage.querySelector('#mc-cv'), c = cv.getContext('2d'), cap = api.stage.querySelector('#mc-cap'), CX = 320, CY = 210, RAD = 195;
    function compute() { var v = api.vals(); v.seed = seed; sim = model(v); sim.v = v; }
    function stainCol(st, a) { return st === 'iodine' ? 'rgba(180,120,30,' + a + ')' : st === 'mblue' ? 'rgba(37,99,235,' + a + ')' : st === 'orcein' ? 'rgba(157,23,77,' + a + ')' : 'rgba(100,116,139,' + a * 0.5 + ')'; }
    function drawSpecimen(v, k) {   // k = px per µm
      var sp = v.spec, st = v.stain, r = rng(seed * 31 + sp.length), i, x, y;
      if (sp === 'onion' || sp === 'elodea') {
        var cw = sp === 'onion' ? 240 : 58, chh = sp === 'onion' ? 62 : 26, off = 0;
        for (y = -1200; y < 1200; y += chh) { off = (Math.round(y / chh) % 2) * cw / 2;
          for (x = -1500 - off; x < 1500; x += cw) {
            var px = CX + x * k, py = CY + y * k, pw = cw * k, ph = chh * k; if (px > W || px + pw < 0 || py > H || py + ph < 0) continue;
            c.fillStyle = sp === 'elodea' ? 'rgba(220,252,231,.9)' : st === 'iodine' ? 'rgba(253,230,138,.85)' : st === 'none' ? 'rgba(241,245,249,.9)' : stainCol(st, 0.15);
            c.fillRect(px, py, pw, ph); c.strokeStyle = sp === 'elodea' ? '#166534' : st === 'none' ? 'rgba(148,163,184,.6)' : '#92400e'; c.lineWidth = Math.max(0.5, 2 * k); c.strokeRect(px, py, pw, ph);
            if (sp === 'onion') { c.fillStyle = st === 'none' ? 'rgba(148,163,184,.4)' : st === 'iodine' ? 'rgba(120,53,15,.85)' : stainCol(st, 0.8); c.beginPath(); c.ellipse(px + pw * (0.3 + 0.4 * ((x * 7 + y * 3) % 100 + 100) % 100 / 100), py + ph / 2, 11 * k, 9 * k, 0, 0, 7); c.fill(); }
            else for (i = 0; i < 14; i++) { c.fillStyle = '#16a34a'; c.beginPath(); c.ellipse(px + (0.12 + 0.76 * ((i * 37 + x) % 100 + 100) % 100 / 100) * pw, py + (0.2 + 0.6 * ((i * 53 + y) % 100 + 100) % 100 / 100) * ph, 2.6 * k, 1.8 * k, i, 0, 7); c.fill(); }
          } }
      } else if (sp === 'cheek') {
        cellsFor(sp, seed).forEach(function (o) { var px = CX + o.x * k, py = CY + o.y * k, rr = o.rr * k; c.fillStyle = st === 'mblue' ? 'rgba(191,219,254,.75)' : st === 'none' ? 'rgba(226,232,240,.5)' : stainCol(st, 0.25); c.strokeStyle = st === 'none' ? 'rgba(148,163,184,.6)' : '#1e3a8a';
          c.lineWidth = Math.max(0.5, 1.5 * k); c.beginPath(); for (var a = 0; a < 6.3; a += 0.5) { var q = rr * (0.8 + 0.25 * Math.sin(a * 3 + o.a)); c.lineTo(px + Math.cos(a) * q, py + Math.sin(a) * q * 0.85); } c.closePath(); c.fill(); c.stroke();
          c.fillStyle = st === 'mblue' ? '#1d4ed8' : st === 'none' ? 'rgba(100,116,139,.5)' : stainCol(st, 0.9); c.beginPath(); c.arc(px + 3 * k, py, 5 * k, 0, 7); c.fill(); });
      } else if (MI[sp] != null) {
        var nucCol = st === 'orcein' ? '#831843' : st === 'none' ? 'rgba(100,116,139,.5)' : stainCol(st, 0.9);
        cellsFor(sp, seed).forEach(function (o) {
          var px = CX + o.x * k, py = CY + o.y * k, w = o.w * k, h = o.h * k; if (px < -40 || px > W + 40 || py < -40 || py > H + 40) return;
          c.fillStyle = st === 'orcein' ? 'rgba(252,231,243,.85)' : 'rgba(241,245,249,.85)'; c.strokeStyle = 'rgba(157,23,77,.35)'; c.lineWidth = Math.max(0.5, k); c.fillRect(px - w / 2, py - h / 2, w, h); c.strokeRect(px - w / 2, py - h / 2, w, h);
          c.fillStyle = nucCol; c.strokeStyle = nucCol; c.lineWidth = Math.max(1, 1.2 * k);
          if (o.ph === 'I') { c.beginPath(); c.arc(px, py, 3.6 * k, 0, 7); c.fill(); }
          else if (o.ph === 'P') { for (i = 0; i < 6; i++) { c.beginPath(); c.moveTo(px - 3 * k + i * k, py - 3 * k); c.quadraticCurveTo(px + 2 * k, py, px - 2 * k + i * k, py + 3.5 * k); c.stroke(); } }
          else if (o.ph === 'M') { c.fillRect(px - 0.9 * k, py - 5 * k, 1.8 * k, 10 * k); }
          else if (o.ph === 'A') { c.fillRect(px - 0.8 * k, py - 6 * k, 1.6 * k, 3 * k); c.fillRect(px - 0.8 * k, py + 3 * k, 1.6 * k, 3 * k); c.fillRect(px - 4 * k, py - 6.5 * k, 8 * k, 1.4 * k); c.fillRect(px - 4 * k, py + 5 * k, 8 * k, 1.4 * k); }
          else { c.beginPath(); c.arc(px, py - 4.5 * k, 2.8 * k, 0, 7); c.arc(px, py + 4.5 * k, 2.8 * k, 0, 7); c.fill(); c.strokeStyle = 'rgba(157,23,77,.6)'; c.beginPath(); c.moveTo(px - w / 2, py); c.lineTo(px + w / 2, py); c.stroke(); }
          if (counted && inField(o, +v.obj) && o.ph !== 'I' && k > 0.4) { c.strokeStyle = '#facc15'; c.lineWidth = 1.5; c.strokeRect(px - w / 2 - 1, py - h / 2 - 1, w + 2, h + 2); c.fillStyle = '#facc15'; c.font = 'bold ' + Math.round(Math.max(8, 4 * k)) + 'px system-ui'; c.fillText(o.ph, px + w / 2 - 6, py - h / 2 + 8); }
        });
      } else if (STOM[sp] != null) {
        for (y = -700; y < 700; y += 40) for (x = -700; x < 700; x += 55) { var qx = CX + (x + (Math.round(y / 40) % 2) * 27) * k, qy = CY + y * k; c.strokeStyle = 'rgba(100,116,139,.5)'; c.lineWidth = Math.max(0.5, k); c.beginPath(); for (var a2 = 0; a2 < 6.3; a2 += 0.4) { var rr2 = 26 * k * (1 + 0.18 * Math.sin(a2 * 5 + x)); c.lineTo(qx + Math.cos(a2) * rr2 * 1.1, qy + Math.sin(a2) * rr2 * 0.75); } c.closePath(); c.stroke(); }
        cellsFor(sp, seed).forEach(function (o) { var px = CX + o.x * k, py = CY + o.y * k; if (px < -20 || px > W + 20 || py < -20 || py > H + 20) return; c.save(); c.translate(px, py); c.rotate(o.a);
          c.fillStyle = 'rgba(134,239,172,.85)'; c.strokeStyle = '#166534'; c.lineWidth = Math.max(0.6, 1.2 * k); [-1, 1].forEach(function (s) { c.beginPath(); c.ellipse(s * 5 * k, 0, 5 * k, 15 * k, 0, 0, 7); c.fill(); c.stroke(); });
          c.fillStyle = '#334155'; c.beginPath(); c.ellipse(0, 0, 1.6 * k, 9 * k, 0, 0, 7); c.fill(); c.restore();
          if (counted && inField(o, +v.obj)) { c.strokeStyle = '#facc15'; c.lineWidth = 1.5; c.beginPath(); c.arc(px, py, Math.max(6, 19 * k), 0, 7); c.stroke(); } });
      } else if (sp === 'vessels') {
        // artery: thick wall, small round lumen; vein: thin wall, wide flattened lumen
        [[-560, 0, 430, 'artery'], [600, 40, 540, 'vein']].forEach(function (o) {
          var px = CX + o[0] * k, py = CY + o[1] * k, R = o[2] * k;
          if (o[3] === 'artery') { c.fillStyle = '#fecdd3'; c.beginPath(); c.arc(px, py, R, 0, 7); c.fill(); c.fillStyle = '#f9a8d4'; c.beginPath(); c.arc(px, py, R * 0.78, 0, 7); c.fill(); c.strokeStyle = '#be123c'; c.lineWidth = Math.max(1, 3 * k); for (var w2 = 0.45; w2 < 0.76; w2 += 0.06) { c.beginPath(); c.arc(px, py, R * w2, 0, 7); c.stroke(); } c.fillStyle = '#fff1f2'; c.beginPath(); c.arc(px, py, R * 0.38, 0, 7); c.fill(); c.strokeStyle = '#9f1239'; c.lineWidth = Math.max(1, 2 * k); c.beginPath(); for (var a3 = 0; a3 < 6.3; a3 += 0.2) c.lineTo(px + Math.cos(a3) * R * (0.38 + 0.02 * Math.sin(a3 * 18)), py + Math.sin(a3) * R * (0.38 + 0.02 * Math.sin(a3 * 18))); c.closePath(); c.stroke(); }
          else { c.fillStyle = '#fbcfe8'; c.beginPath(); c.ellipse(px, py, R, R * 0.62, 0.3, 0, 7); c.fill(); c.fillStyle = '#fff1f2'; c.beginPath(); c.ellipse(px, py, R * 0.86, R * 0.48, 0.3, 0, 7); c.fill(); c.fillStyle = 'rgba(220,38,38,.5)'; for (i = 0; i < 25; i++) { c.beginPath(); c.arc(px + (r() - 0.5) * R, py + (r() - 0.5) * R * 0.6, 4 * k, 0, 7); c.fill(); } }
          c.fillStyle = '#fff'; c.font = 'bold 12px system-ui'; c.textAlign = 'center'; if (k < 0.6) c.fillText(o[3] === 'artery' ? 'A' : 'B', px, py - R - 8);
        });
      } else if (sp === 'stem' || sp === 'droot') {
        var R2 = (sp === 'stem' ? 1500 : 750) * k; c.fillStyle = '#ecfccb'; c.beginPath(); c.arc(CX, CY, R2, 0, 7); c.fill(); c.strokeStyle = '#3f6212'; c.lineWidth = Math.max(1, 3 * k); c.stroke();
        if (sp === 'stem') { for (i = 0; i < 8; i++) { var an = i * Math.PI / 4, bx = CX + Math.cos(an) * R2 * 0.62, by = CY + Math.sin(an) * R2 * 0.62; c.save(); c.translate(bx, by); c.rotate(an); c.fillStyle = '#86efac'; c.beginPath(); c.ellipse(0, 0, R2 * 0.17, R2 * 0.1, 0, 0, 7); c.fill(); c.fillStyle = '#b91c1c'; c.beginPath(); c.ellipse(-R2 * 0.05, 0, R2 * 0.07, R2 * 0.08, 0, 0, 7); c.fill(); c.fillStyle = '#7c3aed'; c.beginPath(); c.ellipse(R2 * 0.09, 0, R2 * 0.05, R2 * 0.07, 0, 0, 7); c.fill(); c.restore(); } }
        else { c.fillStyle = '#d9f99d'; c.beginPath(); c.arc(CX, CY, R2 * 0.32, 0, 7); c.fill(); c.fillStyle = '#b91c1c'; c.beginPath(); for (i = 0; i < 8; i++) { var a4 = i * Math.PI / 2 / 2; c.lineTo(CX + Math.cos(a4) * R2 * (i % 2 ? 0.08 : 0.26), CY + Math.sin(a4) * R2 * (i % 2 ? 0.08 : 0.26)); } c.closePath(); c.fill(); c.fillStyle = '#7c3aed'; for (i = 0; i < 4; i++) { var a5 = Math.PI / 4 + i * Math.PI / 2; c.beginPath(); c.arc(CX + Math.cos(a5) * R2 * 0.2, CY + Math.sin(a5) * R2 * 0.2, R2 * 0.05, 0, 7); c.fill(); } }
      }
    }
    function draw(prepT) {
      var v = sim.v, obj = +v.obj, k = (2 * RAD) / FIELD[obj];
      c.clearRect(0, 0, W, H); c.fillStyle = '#0f172a'; c.fillRect(0, 0, W, H);
      if (prepT != null && prepT < 1) { drawPrep(prepT, v); return; }
      c.save(); c.beginPath(); c.arc(CX, CY, RAD, 0, 7); c.clip(); c.fillStyle = '#f8fafc'; c.fillRect(0, 0, W, H);
      if (prepared) { c.filter = 'blur(' + Math.min(14, sim.blur).toFixed(1) + 'px)'; drawSpecimen(v, k); c.filter = 'none'; }
      // eyepiece graticule: 100 units
      var gl = 100 * EPU[obj] * k, gx = CX - gl / 2, gy = CY + RAD * 0.62; c.strokeStyle = '#111827'; c.lineWidth = 1; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + gl, gy); c.stroke();
      for (var i = 0; i <= 100; i++) { var tl = i % 10 ? (i % 5 ? 4 : 7) : 11; c.beginPath(); c.moveTo(gx + i * gl / 100, gy); c.lineTo(gx + i * gl / 100, gy - tl); c.stroke(); if (i % 10 === 0) { c.fillStyle = '#111827'; c.font = '9px system-ui'; c.textAlign = 'center'; c.fillText(String(i), gx + i * gl / 100, gy + 11); } }
      c.restore(); c.strokeStyle = '#475569'; c.lineWidth = 6; c.beginPath(); c.arc(CX, CY, RAD + 3, 0, 7); c.stroke();
      c.fillStyle = '#e2e8f0'; c.font = 'bold 13px system-ui'; c.textAlign = 'left'; c.fillText('×' + sim.mag, 12, 22); c.font = '11px system-ui'; c.fillText('1 eyepiece unit = ' + EPU[obj] + ' µm', 12, 40); c.fillText('field ' + fx(FIELD[obj] / 1000, 2) + ' mm', 12, 56);
      c.textAlign = 'right'; c.fillText('Field ' + seed, W - 12, 22);
      cap.textContent = !prepared ? 'Press ▶ Prepare and look to make the slide.' : sim.blur > 3 ? 'Out of focus: ' + (obj === 40 ? 'at ×40 use the fine focus (and only small coarse changes).' : 'turn the coarse focus slowly.') :
        'In focus. Target: ' + sim.target[1] + ' ≈ ' + fx(sim.epu, 0) + ' eyepiece units' + (MI[v.spec] != null ? '. ' + (obj === 40 ? 'Press 🔢 Count this field.' : 'Use ×40 to see the chromosomes.') : STOM[v.spec] != null ? '. ' + (obj === 40 ? 'Press 🔢 Count this field.' : 'Use ×40 to count stomata.') : '.');
    }
    function drawPrep(t, v) {   // animation: drop of stain, specimen, coverslip lowered at an angle
      c.fillStyle = '#f1f5f9'; c.fillRect(0, 0, W, H); c.fillStyle = '#e0f2fe'; c.fillRect(120, 220, 400, 70); c.strokeStyle = '#94a3b8'; c.strokeRect(120, 220, 400, 70);
      c.fillStyle = '#0f172a'; c.font = 'bold 14px system-ui'; c.textAlign = 'center';
      if (t < 0.3) { var dy = 60 + t / 0.3 * 140; c.fillStyle = stainCol(v.stain, 0.9); c.beginPath(); c.arc(320, dy, 7, 0, 7); c.fill(); c.fillStyle = '#334155'; c.fillRect(312, 20, 16, 40); c.fillText('1 · A drop of ' + (v.stain === 'none' ? 'water' : STAIN.filter(function (s) { return s[0] === v.stain; })[0][1].toLowerCase()), 320, 330); }
      else if (t < 0.55) { c.fillStyle = stainCol(v.stain, 0.6); c.beginPath(); c.ellipse(320, 255, 34, 10, 0, 0, 7); c.fill(); c.fillStyle = '#86efac'; c.fillRect(300 - (1 - (t - 0.3) / 0.25) * 120, 248, 40, 8); c.fillStyle = '#0f172a'; c.fillText('2 · Add a thin layer of the specimen', 320, 330); }
      else { var ang = (1 - Math.min(1, (t - 0.55) / 0.4)) * 0.6; c.fillStyle = stainCol(v.stain, 0.6); c.beginPath(); c.ellipse(320, 255, 40, 10, 0, 0, 7); c.fill(); c.save(); c.translate(270, 252); c.rotate(-ang); c.fillStyle = 'rgba(203,213,225,.7)'; c.fillRect(0, -3, 110, 4); c.restore(); c.strokeStyle = '#475569'; c.beginPath(); c.moveTo(380, 252 - 110 * Math.sin(ang)); c.lineTo(390, 120); c.stroke(); c.fillStyle = '#0f172a'; c.fillText('3 · Lower the coverslip at an angle with a mounted needle (no air bubbles)', 320, 330); }
    }
    function readings() {
      var list = [['Magnification', '×' + sim.mag], ['1 eyepiece unit', EPU[sim.obj] + ' µm'], ['Target size', prepared && sim.blur < 3 ? fx(sim.epu, 0) + ' units' : '—']];
      if (sim.cells != null) list.push(['Cells in field', counted ? String(sim.cells) : '—'], ['In mitosis (P, M, A, T)', counted ? sim.mit + ' (' + sim.P + ', ' + sim.M + ', ' + sim.A + ', ' + sim.T + ')' : '—']);
      if (sim.stomata != null) list.push(['Stomata in field', counted ? String(sim.stomata) : '—'], ['Field area', fx(sim.area, 3) + ' mm²']);
      api.readings(list);
    }
    function frame() { var el = Math.min(1, (performance.now() - t0) / 4000); draw(el); if (el >= 1) { playing = false; prepared = true; api.label('run', '▶ Prepare and look'); compute(); draw(); readings(); api.status('Slide on the stage. Focus, measure, and count.'); return; } if (playing) raf = requestAnimationFrame(frame); }
    api.actions([
      { id: 'run', label: '▶ Prepare and look', main: true, fn: function () { if (playing) return; compute(); counted = false; playing = true; t0 = performance.now(); frame(); } },
      { id: 'count', label: '🔢 Count this field', fn: function () { if (!prepared) return api.status('Prepare the slide first.'); if (sim.cells == null && sim.stomata == null) return api.status('Counting is for root tips, tumour tissue and leaf casts.'); if (+sim.v.obj !== 40) return api.status('Count at ×40.'); if (sim.blur > 3) return api.status('Focus first.'); counted = true; draw(); readings(); api.status('Counted: yellow boxes mark cells in mitosis (or stomata). ➕ Record, then ↻ New field.'); } },
      { id: 'field', label: '↻ New field', fn: function () { seed++; counted = false; compute(); draw(); readings(); } },
      { id: 'rec', label: '➕ Record', fn: function () {
        if (!prepared || sim.blur > 3) return api.status('Prepare and focus first.');
        var v = sim.v, row = { spec: SPEC.filter(function (s) { return s[0] === v.spec; })[0][1], obj: +v.obj, field: seed, epu: Math.round(sim.epu), um: +(Math.round(sim.epu) * EPU[+v.obj]).toFixed(1), cells: '', mit: '', mi: '', stom: '', dens: '' };
        if (counted && sim.cells != null) { row.cells = sim.cells; row.mit = sim.mit; row.mi = +sim.mi.toFixed(3); }
        if (counted && sim.stomata != null) { row.stom = sim.stomata; row.dens = Math.round(sim.density); }
        api.record(row);
      } }
    ]);
    api.onChange = function (v, id) { var old = sim && sim.v; compute(); if (old && (old.spec !== sim.v.spec || old.stain !== sim.v.stain)) { prepared = false; } if (old && old.obj !== sim.v.obj) counted = false; draw(); readings(); };
    compute(); readings(); draw();
    api.status('Choose a slide and stain, then press ▶ Prepare and look.');
    window.BV_MC = { model: model };
  }
})();
