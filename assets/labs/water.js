/* Properties of water laboratory · BioscienceVista · by George Apidi
   Animations of water's polarity and hydrogen bonds, cohesion and surface tension, adhesion and capillary action, high specific heat
   capacity, water as a solvent, and ice floating. Investigation: how tube width and the liquid affect capillary rise, and how much a
   liquid warms when the same energy is supplied. */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var LIQ = {
    water: { name: 'Water', g: 0.0728, rho: 998, th: 0, c: 4180, col: 'rgba(56,189,248,.55)', why: 'polar; strong hydrogen bonds' },
    ethanol: { name: 'Ethanol', g: 0.0223, rho: 789, th: 0, c: 2440, col: 'rgba(196,181,253,.55)', why: 'one O–H group: fewer hydrogen bonds' },
    oil: { name: 'Vegetable oil', g: 0.032, rho: 920, th: 25, c: 1970, col: 'rgba(250,204,21,.55)', why: 'non-polar: no hydrogen bonds' },
    mercury: { name: 'Mercury', g: 0.485, rho: 13534, th: 140, c: 140, col: 'rgba(148,163,184,.95)', why: 'metal: cohesion far stronger than adhesion to glass' }
  };
  var LIQL = [['water', 'Water'], ['ethanol', 'Ethanol'], ['oil', 'Vegetable oil'], ['mercury', 'Mercury (demonstration only)']];
  var SHOW = [['hb', '1 · Polarity and hydrogen bonds'], ['coh', '2 · Cohesion and surface tension'], ['cap', '3 · Adhesion and capillary action'], ['heat', '4 · Specific heat capacity'], ['sol', '5 · Water as a solvent'], ['ice', '6 · Ice floats']];
  var MASS = 0.1, POWER = 50, TIME = 60;   // 100 g heated by 50 W for 60 s

  function model(o) {   // o: {liq, r (mm)}
    var L = LIQ[o.liq], r = o.r / 1000, h = 2 * L.g * Math.cos(L.th * Math.PI / 180) / (L.rho * 9.81 * r) * 1000;   // mm (Jurin's law)
    var dT = o.liq === 'mercury' ? null : POWER * TIME / (MASS * L.c);
    return { L: L, h: h, dT: dT };
  }

  LABS.water = {
    id: 'water', title: 'Properties of water laboratory: hydrogen bonds in action',
    tags: ['Biology', 'Chemistry', 'MYP 3–5', 'IB DP A1.1 Water', 'IGCSE', 'A Level'],
    background: '<p>A water molecule (H₂O) is <b>polar</b>: oxygen attracts the shared electrons more strongly than hydrogen (it is more <b>electronegative</b>), so the oxygen carries a small negative charge (δ−) and each hydrogen a small positive charge (δ+). The δ+ hydrogen of one molecule is attracted to the δ− oxygen of another: a <b>hydrogen bond</b>. Each bond is weak, but there are huge numbers of them, and they explain water\'s properties.</p>' +
      '<p><b>Cohesion</b>: water molecules stick to each other, giving <b>surface tension</b> (insects can walk on water) and letting the water column in xylem be pulled up without breaking. <b>Adhesion</b>: water sticks to other polar or charged surfaces such as glass and cellulose; with cohesion this gives <b>capillary action</b>, which is greater in narrower tubes. Water has a <b>high specific heat capacity</b> (4.18 J g⁻¹ °C⁻¹): energy is needed to break hydrogen bonds before molecules move faster, so oceans and bodies change temperature slowly. Water is a good <b>solvent</b> for polar and charged substances: water molecules surround ions (hydration shells) and polar molecules, which is why it is the medium for metabolism and transport. Hydrophobic substances such as oils do not dissolve. When water freezes, hydrogen bonds hold the molecules in an open lattice, so <b>ice is less dense than liquid water</b> and floats, insulating the water below.</p>',
    objectives: ['Explain the polarity of water and how hydrogen bonds form.', 'Relate cohesion, adhesion, high specific heat capacity, solvent properties and the density of ice to hydrogen bonding.', 'Investigate how the width of a tube affects capillary rise.', 'Compare how much water and other liquids warm when the same energy is supplied, and link this to living things.'],
    rq: 'How does the radius of a glass capillary tube (0.1 to 1.0 mm) affect the height that water rises?',
    hypPrompt: 'Predict how the height of the water changes as the tube gets narrower. Explain using adhesion and cohesion.',
    hypothesis: { marks: 3, points: [
      { re: [/narrow|thin|small(er)? (radius|tube|diameter)|less (wide|radius)/], marks: 1, ok: 'You predict a higher rise in narrower tubes.', miss: 'Say how the height changes as the tube gets narrower.' },
      { re: [/adhesi|stick.*(glass|wall|tube)|attract.*(glass|wall)/], marks: 1, ok: 'You use adhesion to the glass.', miss: 'Use adhesion: water molecules are attracted to the glass.' },
      { re: [/cohesi|stick.*(each other|together)|hydrogen bond|pull.*(up|other)/], marks: 1, ok: 'You use cohesion (hydrogen bonds between water molecules).', miss: 'Use cohesion: the molecules pull each other up.' }] },
    variables: { iv: 'radius of the capillary tube (mm)', dv: 'height the liquid rises above the surface (mm)', cv: ['type of liquid (water)', 'clean glass tubes', 'temperature of the liquid', 'tubes held vertical', 'height read at the bottom of the meniscus'] },
    apparatus: ['Capillary tubes of different internal radius (0.1–1.0 mm)', 'Dish of water with a few drops of food colouring', 'Ruler (mm) or travelling microscope', 'Clamp to hold the tubes vertical', 'For heat capacity: 100 g of each liquid in a beaker, 50 W immersion heater, thermometer and stopwatch'],
    safety: ['Virtual lab. Ethanol is highly flammable: no flames, heat it only in a water bath.', 'Mercury is toxic: it is shown here as a demonstration only and is not used in school labs.', 'Glass capillary tubes break easily into sharp pieces.'],
    method: ['Choose an animation (1–6) to see how hydrogen bonds cause each property. Press <b>▶ Play</b>.', 'For the investigation choose <b>3 · Adhesion and capillary action</b> and <b>Water</b>.', 'Set the tube radius to 1.0 mm, press <b>▶ Play</b> and read the height. Press <b>➕ Record trial</b>.', 'Repeat for radii 0.8, 0.6, 0.4, 0.3, 0.2 and 0.1 mm. Then compare ethanol, oil and mercury.', 'Choose <b>4 · Specific heat capacity</b>: heat 100 g of each liquid with 50 W for 60 s and record the temperature rise.'],
    controls: [
      { id: 'show', label: 'Animation', type: 'select', value: 'hb', options: SHOW },
      { id: 'liq', label: 'Liquid', type: 'select', value: 'water', options: LIQL },
      { id: 'r', label: 'Capillary tube radius', min: 0.1, max: 1, step: 0.05, value: 0.5, dp: 2, unit: 'mm' }
    ],
    columns: [
      { key: 'liq', label: 'Liquid', num: false, group: true }, { key: 'r', label: 'Tube radius', unit: 'mm', dp: 2 }, { key: 'inv', label: '1 ÷ radius', unit: 'mm⁻¹', dp: 2 },
      { key: 'h', label: 'Capillary rise', unit: 'mm', dp: 1 }, { key: 'dT', label: 'Temperature rise (50 W, 60 s)', unit: '°C', dp: 1 }
    ],
    graph: { x: 'r', y: 'h', group: 'liq' },
    hints: ['Narrower tube: more of the water touches the glass compared with the weight of water to lift.', 'Plot the height against 1 ÷ radius: a straight line means height is inversely proportional to radius.', 'Energy is used to break hydrogen bonds before the molecules move faster.', 'Mercury atoms attract each other far more than they attract glass.'],
    analyse: [
      { id: 'h05', q: 'State the capillary rise of water in a tube of radius 0.5 mm.', marks: 1, lines: 1, number: { value: function () { return model({ liq: 'water', r: 0.5 }).h; }, tol: 0.06, unit: 'mm', dp: 1 } },
      { id: 'pattern', q: 'Describe the relationship between tube radius and capillary rise. Use your data.', marks: 3, lines: 4, points: [
        { re: [/narrow|small(er)? radius|radius (decreas|gets smaller)|thinner/], marks: 1, ok: 'Narrower tubes give a higher rise.', miss: 'Describe what happens to the height as the radius decreases.' },
        { re: [/invers|1 ?(÷|\/) ?r|halv.*doubl|doubl.*halv|proportional/], marks: 1, ok: 'Inversely proportional.', miss: 'State the relationship: height is inversely proportional to radius (halving r doubles h).' },
        { re: [/\d/], marks: 1, ok: 'You quote data.', miss: 'Quote heights from your table.' }] },
      { id: 'heat', q: 'Compare the temperature rise of water with ethanol and oil, and explain the difference.', marks: 3, lines: 4, points: [
        { re: [/water.*(least|smallest|lowest|less)|(least|smallest|lowest).*water/], marks: 1, ok: 'Water warms the least.', miss: 'State which liquid warmed least.' },
        { re: [/specific heat|heat capacity|4\.?18|4180/], marks: 1, ok: 'You use specific heat capacity.', miss: 'Use the term specific heat capacity.' },
        { re: [/hydrogen bond.*(break|broken|overcome)|(break|overcome).*hydrogen bond|energy.*hydrogen bond/], marks: 1, ok: 'Energy breaks hydrogen bonds first.', miss: 'Explain that energy is used to break hydrogen bonds before the molecules move faster.' }] }
    ],
    evaluate: [
      { id: 'merc', q: 'Mercury falls below the surface in a glass tube and its meniscus curves up. Explain why.', marks: 2, lines: 3, points: [
        { re: [/cohesi.*(greater|stronger|more)|(greater|stronger|more).*cohesi|attract each other more/], marks: 1, ok: 'Cohesion is stronger than adhesion.', miss: 'Compare cohesion with adhesion for mercury.' },
        { re: [/adhesi.*(weak|less|small)|not (attracted|stick).*glass|non.?polar|metal/], marks: 1, ok: 'Little adhesion to glass.', miss: 'Mercury atoms are hardly attracted to glass (weak adhesion).' }] },
      { id: 'life', q: 'Give two ways these properties of water matter for living things.', marks: 2, lines: 4, points: [
        { re: [/xylem|transpiration|plant.*(water|transport)|cohesion.tension/], marks: 1, ok: 'Cohesion and adhesion in xylem transport.', miss: 'For example: cohesion and adhesion pull water up the xylem.' },
        { re: [/temperature|stable|sweat|cool|ocean|habitat|thermal|blood|solvent|dissolv|transport|ice|insulat|float|pond/], marks: 1, ok: 'A second valid use.', miss: 'For example: stable temperatures in oceans and cells, cooling by sweating, a solvent for transport, or ice insulating ponds.' }] },
      { id: 'model', q: 'The heights come from a formula for perfectly clean, vertical tubes. Suggest one reason real measurements might be different.', marks: 1, lines: 2, points: [
        { re: [/dirt|clean|grease|tilt|angle|vertical|temperature|impur|colour|dye|meniscus|read|parallax|width (not|varies)|uneven/], marks: 1, ok: 'A valid reason.', miss: 'For example: dirty or greasy glass, a tilted tube, temperature changes, or reading the meniscus.' }] }
    ],
    model: '<ul><li>Capillary rise (Jurin\'s law): h = 2γ cos θ ÷ (ρ g r), with surface tension γ (water 0.0728, ethanol 0.0223, oil 0.032, mercury 0.485 N/m), contact angle θ (water and ethanol 0°, oil 25°, mercury 140°), density ρ and g = 9.81 m/s².</li>' +
      '<li>Temperature rise: ΔT = P t ÷ (m c) for 100 g heated with 50 W for 60 s, with specific heat capacity c = 4180 (water), 2440 (ethanol) and 1970 (oil) J kg⁻¹ °C⁻¹. No heat lost to the surroundings in the model.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, sim = null, raf = null, playing = false, t0 = 0, W = 680, H = 360, P = [];
    api.stage.innerHTML = '<canvas id="wa-cv" width="680" height="360" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Animation of water molecules and hydrogen bonds"></canvas>' +
      '<p class="small" id="wa-cap" style="margin:6px 0;font-weight:700" aria-live="polite"></p><canvas class="vl-chart" id="wa-ch" style="height:220px"></canvas><div id="wa-lg"></div>';
    var cv = api.stage.querySelector('#wa-cv'), c = cv.getContext('2d'), ch = api.stage.querySelector('#wa-ch'), cap = api.stage.querySelector('#wa-cap');
    function compute() { var v = api.vals(); sim = model({ liq: v.liq, r: v.r }); sim.v = v; }
    function reset() { P = []; for (var i = 0; i < 32; i++) P.push({ x: 60 + (i % 8) * 78 + Math.random() * 16, y: 70 + Math.floor(i / 8) * 68 + Math.random() * 14, a: Math.random() * 6.28, va: (Math.random() - 0.5) * 1.5, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30 }); }
    function mol(x, y, a, s, lab) {   // a water molecule: red O, two white H at 104.5°
      s = s || 1; var d = 17 * s;
      [a - 0.91, a + 0.91].forEach(function (b) { c.strokeStyle = '#94a3b8'; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(b) * d, y + Math.sin(b) * d); c.stroke(); c.fillStyle = '#fff'; c.strokeStyle = '#64748b'; c.lineWidth = 1.2; c.beginPath(); c.arc(x + Math.cos(b) * d, y + Math.sin(b) * d, 6 * s, 0, 7); c.fill(); c.stroke();
        if (lab) { c.fillStyle = '#2563eb'; c.font = 'bold ' + Math.round(11 * s) + 'px system-ui'; c.fillText('δ+', x + Math.cos(b) * (d + 15 * s), y + Math.sin(b) * (d + 15 * s) + 4); } });
      c.fillStyle = '#ef4444'; c.beginPath(); c.arc(x, y, 10 * s, 0, 7); c.fill();
      if (lab) { c.fillStyle = '#b91c1c'; c.font = 'bold ' + Math.round(11 * s) + 'px system-ui'; c.fillText('δ−', x - Math.cos(a) * 22 * s, y - Math.sin(a) * 22 * s + 4); }
    }
    function hpos(m, k) { var b = m.a + (k ? 0.91 : -0.91); return [m.x + Math.cos(b) * 17, m.y + Math.sin(b) * 17]; }
    function title(t) { c.fillStyle = '#0f172a'; c.font = 'bold 15px system-ui'; c.textAlign = 'left'; c.fillText(t, 14, 24); c.textAlign = 'center'; }
    function beaker(x, y, w, h, fill, lvl) { c.fillStyle = fill; c.fillRect(x, y + h * (1 - lvl), w, h * lvl); c.strokeStyle = '#475569'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + h); c.lineTo(x + w, y + h); c.lineTo(x + w, y); c.stroke(); }
    function draw(el) {
      var v = sim.v, L = sim.L, t = performance.now() / 1000, k, i; c.clearRect(0, 0, W, H); c.textAlign = 'center';
      if (v.show === 'hb') {
        title('Polar water molecules form hydrogen bonds');
        P.forEach(function (m) { if (playing) { m.x += m.vx * 0.016; m.y += m.vy * 0.016; m.a += m.va * 0.016; if (m.x < 30 || m.x > W - 30) m.vx *= -1; if (m.y < 50 || m.y > H - 30) m.vy *= -1; } });
        P.forEach(function (m) { [0, 1].forEach(function (kk) { var h = hpos(m, kk); P.forEach(function (o) { if (o === m) return; var dx = o.x - h[0], dy = o.y - h[1], d = Math.sqrt(dx * dx + dy * dy); if (d < 54 && d > 14) { c.strokeStyle = '#16a34a'; c.setLineDash([3, 3]); c.lineWidth = 1.6; c.beginPath(); c.moveTo(h[0], h[1]); c.lineTo(o.x, o.y); c.stroke(); c.setLineDash([]); } }); }); });
        P.forEach(function (m, j) { mol(m.x, m.y, m.a, 1, j === 7); });
        c.fillStyle = '#16a34a'; c.font = 'bold 12px system-ui'; c.textAlign = 'left'; c.fillText('- - -  hydrogen bond (δ+ H … δ− O)', 14, H - 12);
        cap.textContent = 'Oxygen is more electronegative, so it is δ− and the hydrogens are δ+. Hydrogen bonds form and break constantly between neighbouring molecules.';
      } else if (v.show === 'coh') {
        title('Cohesion: hydrogen bonds pull surface molecules together');
        beaker(80, 70, 520, 270, 'rgba(56,189,248,.35)', 0.85);
        var sy = 70 + 270 * 0.15;
        for (i = 0; i < 9; i++) { var x = 120 + i * 55, dip = Math.max(0, 22 - Math.abs(x - 360) * 0.25); mol(x, sy + 12 + dip * (el > 0.2 ? 1 : 0), Math.PI / 2 + Math.sin(t * 2 + i) * 0.2, 0.8);
          c.strokeStyle = '#16a34a'; c.lineWidth = 2; if (i < 8) { c.beginPath(); c.moveTo(x + 10, sy + 12); c.lineTo(x + 45, sy + 12); c.stroke(); } c.beginPath(); c.moveTo(x, sy + 22); c.lineTo(x, sy + 40); c.stroke(); }
        for (i = 0; i < 5; i++) { var xx = 170 + i * 85, yy = 250; mol(xx, yy, Math.sin(t + i), 0.8); c.strokeStyle = '#16a34a'; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { c.beginPath(); c.moveTo(xx + d[0] * 14, yy + d[1] * 14); c.lineTo(xx + d[0] * 30, yy + d[1] * 30); c.stroke(); }); }
        if (el > 0.2) { var bx = 360, by = sy + 4 - 22 + 22 * Math.min(1, (el - 0.2) * 3); c.fillStyle = '#334155'; c.beginPath(); c.ellipse(bx, by, 26, 7, 0, 0, 7); c.fill(); c.strokeStyle = '#334155'; c.lineWidth = 2; [-1, 1].forEach(function (s) { c.beginPath(); c.moveTo(bx + 10 * s, by); c.lineTo(bx + 44 * s, by - 16); c.lineTo(bx + 62 * s, by + 10); c.stroke(); }); c.fillStyle = '#334155'; c.font = 'bold 12px system-ui'; c.fillText('pond skater: held up by surface tension', bx, 60); }
        cap.textContent = 'Inside the liquid, hydrogen bonds pull each molecule equally in all directions. At the surface they pull sideways and down, making a "skin": surface tension. ' + L.name + ' surface tension: ' + fx(L.g * 1000, 1) + ' mN/m.';
      } else if (v.show === 'cap') {
        title('Adhesion and cohesion: capillary action');
        var base = 300, scale = Math.min(2.4, 200 / Math.max(10, Math.abs(model({ liq: v.liq, r: 0.1 }).h))), rise = sim.h * Math.min(1, el * 1.4);
        c.fillStyle = L.col; c.fillRect(40, base, 420, 50); c.strokeStyle = '#475569'; c.lineWidth = 3; c.strokeRect(40, base - 20, 420, 70);
        [1, 0.5, 0.25, 0.1].forEach(function (r, j) {
          var rr = r === 0.1 ? v.r : r, hh = model({ liq: v.liq, r: rr }).h * Math.min(1, el * 1.4), wpx = Math.max(6, rr * 34), x = 90 + j * 105, top = base - hh * scale;
          c.fillStyle = L.col; c.fillRect(x - wpx / 2, Math.min(top, base), wpx, Math.abs(base - top) + 10);
          c.strokeStyle = '#64748b'; c.lineWidth = 2; c.strokeRect(x - wpx / 2 - 2, 70, wpx + 4, 270);
          c.strokeStyle = '#0f172a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - wpx / 2, top); c.quadraticCurveTo(x, top + (L.th > 90 ? -1 : 1) * Math.min(8, wpx * 0.3), x + wpx / 2, top); c.stroke();
          c.fillStyle = '#0f172a'; c.font = 'bold 11px system-ui'; c.fillText((r === 0.1 ? 'your tube: ' + fx(v.r, 2) : 'r = ' + r) + ' mm', x, 64); c.fillText(fx(hh, 1) + ' mm', x, Math.min(top, base) - 6 < 80 ? 92 : Math.min(top, base) - 6);
        });
        c.fillStyle = '#eef2ff'; c.fillRect(490, 70, 175, 220); c.strokeStyle = '#6366f1'; c.strokeRect(490, 70, 175, 220); c.fillStyle = '#3730a3'; c.font = 'bold 11px system-ui'; c.fillText('Close up at the glass', 577, 88);
        c.fillStyle = '#cbd5e1'; c.fillRect(495, 95, 16, 190); for (i = 0; i < 6; i++) { mol(540 + (i % 2) * 40, 110 + i * 30, Math.PI, 0.7); c.strokeStyle = '#16a34a'; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(511, 110 + i * 30); c.lineTo(528, 110 + i * 30); c.stroke(); c.setLineDash([]); }
        c.fillStyle = '#3730a3'; c.font = '10px system-ui'; c.fillText('adhesion: H-bonds to glass (–OH)', 577, 300 > H ? H - 20 : 300);
        cap.textContent = v.liq === 'mercury' ? 'Mercury: cohesion is much stronger than adhesion to glass, so the level falls (' + fx(sim.h, 1) + ' mm) and the meniscus curves up.' :
          L.name + ' in a ' + fx(v.r, 2) + ' mm tube rises ' + fx(sim.h, 1) + ' mm. Adhesion pulls the liquid up the glass; cohesion pulls the rest along. Narrower tube → higher rise.';
      } else if (v.show === 'heat') {
        title('Specific heat capacity: 100 g heated with 50 W for 60 s');
        var tsec = Math.min(TIME, el * TIME), list = [['water', 120], [v.liq === 'water' || v.liq === 'mercury' ? 'ethanol' : v.liq, 400]];
        list.forEach(function (p) { var LL = LIQ[p[0]], x = p[1], dT = POWER * tsec / (MASS * LL.c);
          beaker(x, 110, 150, 170, LL.col, 0.75); c.fillStyle = '#dc2626'; c.fillRect(x + 20, 290, 110, 14); c.fillStyle = '#334155'; c.font = 'bold 12px system-ui'; c.fillText(LL.name, x + 75, 100); c.fillText('heater 50 W', x + 75, 322);
          c.fillStyle = '#e2e8f0'; c.fillRect(x + 165, 80, 14, 220); c.fillStyle = '#ef4444'; var th = Math.min(210, 30 + dT * 6); c.fillRect(x + 168, 295 - th, 8, th); c.beginPath(); c.arc(x + 172, 300, 11, 0, 7); c.fill();
          c.fillStyle = '#0f172a'; c.font = 'bold 13px system-ui'; c.fillText(fx(20 + dT, 1) + ' °C', x + 172, 72);
          for (k = 0; k < 10; k++) { var mx = x + 20 + (k % 5) * 27 + Math.sin(t * (2 + dT / 5) + k) * (2 + dT / 3), my = 180 + Math.floor(k / 5) * 40 + Math.cos(t * (2 + dT / 5) + k) * (2 + dT / 3); c.fillStyle = p[0] === 'water' ? '#ef4444' : '#7c3aed'; c.beginPath(); c.arc(mx, my, 5, 0, 7); c.fill(); }
        });
        c.fillStyle = '#334155'; c.font = '12px system-ui'; c.fillText('Time ' + fx(tsec, 0) + ' s', 340, 52);
        cap.textContent = 'Same energy (' + POWER * TIME + ' J) to each: water rises ' + fx(model({ liq: 'water', r: 1 }).dT, 1) + ' °C, ' + LIQ[list[1][0]].name.toLowerCase() + ' ' + fx(model({ liq: list[1][0], r: 1 }).dT, 1) + ' °C. In water much of the energy breaks hydrogen bonds before molecules move faster.';
      } else if (v.show === 'sol') {
        title('Water dissolves ions and polar molecules, not oils');
        beaker(40, 60, 600, 280, 'rgba(56,189,248,.25)', 0.9);
        var spread = Math.min(1, el * 1.3);
        for (i = 0; i < 8; i++) { var ion = i % 2 ? 'Cl⁻' : 'Na⁺', gx = 120 + (i % 4) * 22, gy = 250 + Math.floor(i / 4) * 22, tx = 110 + (i % 4) * 120 + 40 * Math.floor(i / 4), ty = 120 + Math.floor(i / 4) * 110, x2 = gx + (tx - gx) * spread, y2 = gy + (ty - gy) * spread;
          c.fillStyle = i % 2 ? '#22c55e' : '#a855f7'; c.beginPath(); c.arc(x2, y2, i % 2 ? 11 : 8, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 9px system-ui'; c.fillText(ion, x2, y2 + 3);
          if (spread > 0.6) for (k = 0; k < 5; k++) { var an = k * 1.26 + t * 0.3, mx2 = x2 + Math.cos(an) * 30, my2 = y2 + Math.sin(an) * 30; mol(mx2, my2, i % 2 ? an + Math.PI : an, 0.55); } }
        c.fillStyle = 'rgba(250,204,21,.85)'; c.beginPath(); c.ellipse(560, 90 + Math.sin(t) * 3, 50, 18, 0, 0, 7); c.fill(); c.fillStyle = '#713f12'; c.font = 'bold 11px system-ui'; c.fillText('oil: stays separate', 560, 125);
        cap.textContent = 'δ− oxygens face the Na⁺ ions and δ+ hydrogens face the Cl⁻ ions: each ion gets a hydration shell and dissolves. Non-polar oil cannot form hydrogen bonds with water, so it does not dissolve (hydrophobic).';
      } else {
        title('Ice is less dense than liquid water, so it floats');
        beaker(60, 70, 560, 270, 'rgba(56,189,248,.35)', 0.8); var fy = 70 + 270 * 0.2;
        c.fillStyle = 'rgba(224,242,254,.95)'; c.strokeStyle = '#7dd3fc'; c.lineWidth = 2; c.fillRect(120, fy - 12, 230, 76); c.strokeRect(120, fy - 12, 230, 76);
        for (i = 0; i < 6; i++) for (k = 0; k < 2; k++) { var hx = 140 + i * 38 + (k % 2) * 19, hy = fy + 8 + k * 32; mol(hx, hy, Math.PI / 2 + (i + k) % 2 * Math.PI, 0.5); }
        c.fillStyle = '#0369a1'; c.font = 'bold 11px system-ui'; c.fillText('ice: open lattice, each molecule H-bonded to 4 others', 235, fy - 22);
        for (i = 0; i < 14; i++) mol(110 + (i % 7) * 66 + Math.sin(t * 2 + i) * 6, 230 + Math.floor(i / 7) * 45 + Math.cos(t * 2 + i) * 6, t + i, 0.6);
        c.fillStyle = '#0f172a'; c.fillText('liquid water: molecules packed closer', 340, 330);
        c.font = 'bold 13px system-ui'; c.textAlign = 'right'; c.fillText('Density: ice 0.92 g/cm³ · liquid water 1.00 g/cm³', W - 14, 24); c.textAlign = 'center';
        cap.textContent = 'In ice hydrogen bonds hold the molecules apart in a hexagonal lattice, so ice is less dense and floats. It insulates the water below, so ponds do not freeze solid and organisms survive.';
      }
    }
    function drawChart() {
      var series = [];
      ['water', 'ethanol', 'oil'].forEach(function (q, i) { var pts = []; for (var r = 0.1; r <= 1.0001; r += 0.025) pts.push([+r.toFixed(3), model({ liq: q, r: r }).h]); series.push({ name: LIQ[q].name, pts: pts, color: ['#0072B2', '#CC79A7', '#E69F00'][i], dash: q !== sim.v.liq }); });
      series.push({ name: 'Now', pts: [[sim.v.r, sim.h]], color: '#000', dots: true });
      api.chart(ch, { xLabel: 'Tube radius / mm', yLabel: 'Capillary rise / mm', xmin: 0, xmax: 1, ymin: sim.v.liq === 'mercury' ? -150 : 0, ymax: 160, series: series });
      api.stage.querySelector('#wa-lg').innerHTML = api.legend(series.slice(0, 3)) + '<p class="small muted" style="margin:4px 0 0">Model curves for capillary rise. Your recorded trials make the graph in 4 Results (try plotting against 1 ÷ radius).</p>';
    }
    function readings() {
      api.readings([['Capillary rise', fx(sim.h, 1) + ' mm'], ['Tube radius', fx(sim.v.r, 2) + ' mm'], ['Temperature rise (50 W, 60 s)', sim.dT == null ? 'not tested' : fx(sim.dT, 1) + ' °C'],
        ['Surface tension', fx(sim.L.g * 1000, 1) + ' mN/m'], ['Specific heat capacity', fx(sim.L.c / 1000, 2) + ' J g⁻¹ °C⁻¹'], ['Why', sim.L.why]]);
    }
    function frame() { var el = Math.min(1, (performance.now() - t0) / 6000); draw(el); if (playing) raf = requestAnimationFrame(frame); }
    api.actions([
      { id: 'run', label: '▶ Play', main: true, fn: function () { if (playing) { playing = false; cancelAnimationFrame(raf); api.label('run', '▶ Play'); return; } compute(); readings(); reset(); playing = true; t0 = performance.now(); api.label('run', '⏸ Pause'); frame(); } },
      { id: 'rec', label: '➕ Record trial', fn: function () { api.record({ liq: sim.L.name, r: +sim.v.r.toFixed(2), inv: +(1 / sim.v.r).toFixed(2), h: +sim.h.toFixed(1), dT: sim.dT == null ? '' : +sim.dT.toFixed(1) }); } }
    ]);
    api.onChange = function () { compute(); readings(); drawChart(); if (!playing) { reset(); t0 = performance.now() - 6000; draw(1); } };
    compute(); readings(); reset(); drawChart(); draw(1);
    api.status('Choose an animation and press ▶ Play. For the investigation use 3 · Adhesion and capillary action.');
    window.BV_WATER = { model: model };   // for tests
  }
})();
