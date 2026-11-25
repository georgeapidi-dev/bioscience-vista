/* Food tests laboratory: Benedict's, iodine, biuret and emulsion tests · VistaEd · by George Apidi */
(function () {
  var LABS = window.LABS = window.LABS || {};
  // g per 100 g (or 100 cm³): reducing sugar, non-reducing sugar (sucrose), starch, protein, lipid
  var FOOD = {
    water: ['Distilled water (control)', 0, 0, 0, 0, 0], glucose: ['Glucose solution (choose its concentration)', null, 0, 0, 0, 0],
    sucrose: ['Sucrose (table sugar) solution, 5%', 0, 5, 0, 0, 0], starch: ['Starch suspension, 1%', 0, 0, 1, 0, 0],
    egg: ['Egg white', 0, 0, 0, 10.5, 0.2], oil: ['Cooking oil', 0, 0, 0, 0, 100], milk: ['Milk', 4.8, 0, 0, 3.4, 3.6],
    apple: ['Apple juice', 9.6, 2.0, 0, 0.1, 0.1], onion: ['Onion juice', 3.5, 1.0, 0, 1.1, 0.1], potato: ['Raw potato, ground in water', 0.4, 0.2, 15, 2.0, 0.1],
    bread: ['White bread, ground in water', 2.5, 0.5, 40, 8, 2], peanut: ['Peanuts, ground in ethanol', 0.5, 4, 6, 25, 49], X: ['Unknown food X', 1.2, 0, 3, 6, 0]
  };
  var TEST = { ben: "Benedict's test (heat in a water bath)", nonred: "Non-reducing sugar test (boil with acid, neutralise, then Benedict's)", iod: 'Iodine test', biu: 'Biuret test', emu: 'Ethanol emulsion test' };
  function comp(v) { var f = FOOD[v.food].slice(); if (v.food === 'glucose') f[1] = v.conc; return f; }
  function result(v) {   // returns {col: hex, txt: colour name, pos: bool, score: 0–5 (Benedict's only)}
    var f = comp(v), t = v.test;
    if (t === 'ben' || t === 'nonred') {
      var s = f[1] + (t === 'nonred' ? f[2] * 1.05 : 0), steps = [[0.05, '#2563eb', 'blue', 0], [0.25, '#16a34a', 'green', 1], [0.6, '#ca8a04', 'yellow', 2], [1.2, '#ea580c', 'orange', 3], [2.0, '#c2410c', 'orange-red', 4], [1e9, '#991b1b', 'brick red', 5]];
      for (var i = 0; i < steps.length; i++) if (s < steps[i][0]) return { col: steps[i][1], txt: steps[i][2], pos: steps[i][3] > 0, score: steps[i][3], ppt: steps[i][3] > 0 };
    }
    if (t === 'iod') return f[3] > 0.05 ? { col: '#1e1b4b', txt: 'blue-black', pos: true } : { col: '#b45309', txt: 'orange-brown (no change)', pos: false };
    if (t === 'biu') return f[4] > 0.3 ? { col: '#7e22ce', txt: 'purple (lilac)', pos: true } : { col: '#3b82f6', txt: 'blue (no change)', pos: false };
    return f[5] > 0.5 ? { col: '#f8fafc', txt: 'cloudy white emulsion', pos: true, cloudy: true } : { col: '#e0f2fe', txt: 'clear (no change)', pos: false };
  }
  LABS.foodtests = {
    id: 'foodtests', title: 'Food tests laboratory: sugars, starch, protein and fat',
    tags: ['Biology', 'Nutrition and biological molecules', 'MYP 1–5', 'IGCSE', 'Edexcel', 'A Level'],
    background: '<figure style="margin:0 0 10px"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Benedict%27s_test_for_Sugars.png?width=640" alt="Benedict&#39;s test: the colour changes from blue to brick red as the amount of reducing sugar rises." loading="lazy" style="max-width:100%;max-height:320px;border-radius:10px"><figcaption style="font-size:.85rem;color:#475569">Benedict&#39;s test: the colour changes from blue to brick red as the amount of reducing sugar rises. Photo: Thebiologyprimer, via <a href="https://commons.wikimedia.org/wiki/File:Benedict%27s_test_for_Sugars.png" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure><p>Chemical tests show which <b>biological molecules</b> a food contains.</p><ul>' +
      '<li><b>Reducing sugars</b> (glucose, fructose, maltose, lactose): add Benedict\'s solution and heat in a water bath at about 80 °C. Blue → green → yellow → orange → brick red as the amount of sugar increases (a <b>semi-quantitative</b> test).</li>' +
      '<li><b>Non-reducing sugars</b> (sucrose): no change with Benedict\'s. First boil with dilute hydrochloric acid to hydrolyse it to glucose and fructose, neutralise with sodium hydrogencarbonate, then do the Benedict\'s test.</li>' +
      '<li><b>Starch</b>: iodine solution turns from orange-brown to blue-black.</li><li><b>Protein</b>: biuret reagent turns from blue to purple (lilac).</li>' +
      '<li><b>Lipids</b>: shake with ethanol, then pour into water. A cloudy white emulsion shows fat.</li></ul>',
    objectives: ['Carry out the Benedict\'s, iodine, biuret and emulsion tests and record colours.', 'Use a negative control (water) and positive controls.', 'Use glucose standards to estimate the sugar concentration of a food.', 'Identify the nutrients in an unknown food.'],
    rq: 'Which biological molecules are present in each food, and how much reducing sugar does each contain?',
    hypPrompt: 'Predict which nutrients milk and potato will contain, and explain how you will know from the colours.',
    hypothesis: { marks: 3, points: [
      { re: [/milk.*(sugar|protein|fat|lipid)|(sugar|protein|fat|lipid).*milk/], marks: 1, ok: 'Milk predicted.', miss: 'Predict the nutrients in milk.' },
      { re: [/potato.*starch|starch.*potato/], marks: 1, ok: 'Potato: starch.', miss: 'Predict what potato contains.' },
      { re: [/blue.?black|purple|lilac|brick|orange|emulsion|cloudy/], marks: 1, ok: 'You name a positive colour.', miss: 'Name the colour that would show a positive result.' }] },
    variables: { iv: 'the food tested (and the glucose concentration of the standards)', dv: 'the colour after each test; Benedict\'s colour score 0–5', cv: ['volume of food sample (2 cm³) and of reagent (2 cm³)', 'water bath temperature (80 °C) and heating time (5 minutes)', 'clean test tubes for every test'] },
    apparatus: ['Test tubes and rack', 'Water bath at 80 °C', "Benedict's solution, iodine solution, biuret reagent, ethanol", 'Dilute hydrochloric acid and sodium hydrogencarbonate', 'Pestle and mortar, 2 cm³ pipettes', 'Glucose solutions 0.1–3%'],
    safety: ['Wear eye protection throughout.', 'Ethanol is highly flammable: no flames nearby; use the water bath to heat.', 'Biuret reagent contains sodium hydroxide, which is corrosive; wash off splashes at once.', 'Point boiling tubes away from people; never taste the foods in the laboratory.'],
    method: ['Choose the food and the test.', 'Press <b>Run test</b>: 2 cm³ of sample and 2 cm³ of reagent are mixed (and heated for Benedict\'s).', 'Observe the final colour and press <b>Record</b>.', 'Test water as a negative control, and glucose standards from 0 to 3% to build a colour scale.', 'Test every food with every reagent, then identify the nutrients in food X.'],
    controls: [
      { id: 'food', label: 'Food sample', type: 'select', value: 'glucose', options: Object.keys(FOOD).map(function (k) { return [k, FOOD[k][0]]; }) },
      { id: 'test', label: 'Test', type: 'select', value: 'ben', options: Object.keys(TEST).map(function (k) { return [k, TEST[k]]; }) },
      { id: 'conc', label: 'Glucose standard concentration', type: 'range', min: 0, max: 3, step: 0.1, value: 1, dp: 1, unit: '%' }
    ],
    columns: [
      { key: 'food', label: 'Food', num: false }, { key: 'test', label: 'Test', num: false, group: true }, { key: 'conc', label: 'Glucose standard', unit: '%', dp: 1 },
      { key: 'colour', label: 'Final colour', num: false }, { key: 'res', label: 'Result', num: false }, { key: 'score', label: "Benedict's score (0–5)", dp: 0 }
    ],
    graph: { x: 'conc', y: 'score', group: 'test' },
    hints: ['Always run a water control: any colour change in water means the tube or reagent is contaminated.', 'Only Benedict\'s needs heating. Never heat the ethanol test.', 'Sucrose gives no change with Benedict\'s until it has been hydrolysed with acid.', "Match a food's Benedict's colour with your glucose standards to estimate its sugar content."],
    analyse: [
      { id: 'milk', q: 'Which nutrients did milk contain? Give the evidence for each.', marks: 3, lines: 4, points: [
        { re: [/reducing sugar|sugar|lactose/], marks: 1, ok: 'Reducing sugar.', miss: 'Reducing sugar: Benedict\'s turned orange.' },
        { re: [/protein.*(purple|lilac)|(purple|lilac).*protein|protein/], marks: 1, ok: 'Protein.', miss: 'Protein: biuret turned purple.' },
        { re: [/fat|lipid|emulsion/], marks: 1, ok: 'Lipid.', miss: 'Lipid: a white emulsion formed.' }] },
      { id: 'X', q: 'Identify the nutrients in food X. Give the evidence.', marks: 3, lines: 4, points: [
        { re: [/starch/], marks: 1, ok: 'Starch.', miss: 'Check the iodine result for X.' },
        { re: [/protein/], marks: 1, ok: 'Protein.', miss: 'Check the biuret result for X.' },
        { re: [/(reducing )?sugar|glucose/], marks: 1, ok: 'Reducing sugar.', miss: 'Check the Benedict\'s result for X.' }] },
      { id: 'suc', q: 'Explain why sucrose gave a negative Benedict\'s test but a positive non-reducing sugar test.', marks: 2, lines: 3, points: [
        { re: [/non.?reducing|not (a )?reducing/], marks: 1, ok: 'Sucrose is non-reducing.', miss: 'Say sucrose is a non-reducing sugar.' },
        { re: [/hydrolys|break(s)? down|glucose and fructose|monosaccharide|acid/], marks: 1, ok: 'Acid hydrolysis.', miss: 'Explain: boiling with acid hydrolyses it into glucose and fructose, which are reducing.' }] },
      { id: 'apple', q: "Use your glucose standards to estimate the reducing sugar concentration of apple juice.", marks: 2, lines: 2, points: [
        { re: [/(>|more than|above|over|at least) ?2|brick/], marks: 1, ok: 'Above about 2%.', miss: 'Apple juice matched the brick-red standards: above about 2%.' },
        { re: [/standard|match|compar|same colour/], marks: 1, ok: 'Method explained.', miss: 'Explain that you matched its colour against the standards.' }] }
    ],
    evaluate: [
      { id: 'err', q: 'The Benedict\'s test is only semi-quantitative. Explain why, and suggest how to measure sugar concentration more precisely.', marks: 2, lines: 3, points: [
        { re: [/colour.*(judge|subjective|opinion|hard|eye)|subjective|by eye|matching colours/], marks: 1, ok: 'Colour judging is subjective.', miss: 'Colours are judged by eye, so different people may disagree.' },
        { re: [/colorimeter|absorbance|transmission|filter (and )?(weigh|mass)|precipitate (mass|weigh)|dry (and )?weigh/], marks: 1, ok: 'A precise method.', miss: 'Use a colorimeter, or filter, dry and weigh the precipitate.' }] },
      { id: 'lim', q: 'Give one simplification in this model.', marks: 1, lines: 2, points: [
        { re: [/instant|exact|threshold|same (time|volume)|no (contamination|error)|ideal|perfect|colour (steps|bands)/], marks: 1, ok: 'A valid simplification.', miss: 'For example: colours change at fixed thresholds and there is no contamination.' }] }
    ],
    model: '<ul><li>Food compositions (g per 100 g) are typical illustrative values. Food X is invented.</li><li>Benedict\'s colour bands for reducing sugar: &lt; 0.05% blue, 0.05–0.25% green, 0.25–0.6% yellow, 0.6–1.2% orange, 1.2–2% orange-red, &gt; 2% brick red.</li>' +
      '<li>Iodine positive above 0.05% starch; biuret positive above 0.3% protein; emulsion positive above 0.5% lipid.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var raf = 0, done = null;
    api.stage.innerHTML = '<svg viewBox="0 0 420 220" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Test tube changing colour in a food test" id="ft-sv"></svg>';
    var sv = api.stage.querySelector('#ft-sv');
    function mix(a, b, f) { var p = function (h, i) { return parseInt(h.substr(1 + i * 2, 2), 16); }; return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(p(a, i) + (p(b, i) - p(a, i)) * f); }).join(',') + ')'; }
    var START = { ben: '#2563eb', nonred: '#2563eb', iod: '#b45309', biu: '#3b82f6', emu: '#e0f2fe' };
    function draw(f, res, bubbles) {
      var v = api.vals(), heat = v.test === 'ben' || v.test === 'nonred', col = mix(START[v.test], res ? res.col : START[v.test], f), h = '';
      if (heat) h += '<rect x="120" y="110" width="140" height="80" rx="6" fill="#bae6fd" opacity=".6" stroke="#0284c7"/><text x="190" y="205" font-size="10" text-anchor="middle">water bath 80 °C</text>';
      h += '<path d="M175,40 L175,170 q0,18 15,18 q15,0 15,-18 L205,40" fill="#fff" stroke="#334155" stroke-width="2"/>';
      h += '<path d="M176,110 L176,170 q0,17 14,17 q14,0 14,-17 L204,110 Z" fill="' + col + '"' + (res && res.cloudy ? ' opacity="' + (0.4 + 0.6 * f) + '"' : '') + '/>';
      if (res && res.ppt && f > 0.6) h += '<ellipse cx="190" cy="182" rx="11" ry="4" fill="' + res.col + '" opacity="' + (f - 0.6) * 2.5 + '"/>';
      (bubbles || []).forEach(function (b) { h += '<circle cx="' + b.x + '" cy="' + b.y + '" r="1.6" fill="#fff" opacity=".8"/>'; });
      h += '<text x="300" y="70" font-size="12" font-weight="700">' + FOOD[v.food][0].split(' (')[0].split(',')[0] + '</text><text x="300" y="88" font-size="10" fill="#475569">' + TEST[v.test].split(' (')[0] + '</text>';
      if (res && f >= 1) h += '<text x="300" y="120" font-size="12">Colour:</text><text x="300" y="138" font-size="13" font-weight="700" fill="' + (res.cloudy ? '#475569' : res.col) + '">' + res.txt + '</text>';
      sv.innerHTML = h;
    }
    function run() {
      cancelAnimationFrame(raf); var v = api.vals(), res = result(v), t0 = performance.now(), dur = (v.test === 'ben' || v.test === 'nonred') ? 4000 : 1800, bub = [];
      api.enable('run', false); api.enable('rec', false); api.status(v.test === 'ben' || v.test === 'nonred' ? 'Heating for 5 minutes (shown in 4 seconds)…' : 'Mixing…');
      (function loop() {
        var f = Math.min(1, (performance.now() - t0) / dur);
        if ((v.test === 'ben' || v.test === 'nonred') && Math.random() < 0.5) bub.push({ x: 180 + Math.random() * 20, y: 180 });
        bub.forEach(function (b) { b.y -= 2; }); bub = bub.filter(function (b) { return b.y > 112; });
        draw(f, res, bub);
        if (f < 1) raf = requestAnimationFrame(loop); else { done = { v: v, res: res }; api.enable('run', true); api.enable('rec', true); api.status('Result: ' + res.txt + (res.pos ? ' — positive.' : ' — negative.') + ' Press Record.'); api.readings([['Colour', res.txt], ['Result', res.pos ? 'positive' : 'negative']].concat(res.score != null ? [["Benedict's score", res.score + ' / 5']] : [])); }
      })();
    }
    api.actions([
      { id: 'run', label: '🧪 Run test', main: true, fn: run },
      { id: 'rec', label: '➕ Record', fn: function () { if (!done) return; var v = done.v, r = done.res;
        api.record({ food: FOOD[v.food][0].split(' (')[0], test: TEST[v.test].split(' (')[0], conc: v.food === 'glucose' ? v.conc : null, colour: r.txt, res: r.pos ? 'positive' : 'negative', score: r.score != null ? r.score : null }); api.enable('rec', false); } }
    ]);
    api.onChange = function () { cancelAnimationFrame(raf); done = null; api.enable('run', true); api.enable('rec', false); draw(0, null); api.readings([['Sample', '2 cm³'], ['Reagent', '2 cm³']]); };
    api.onShow = function () { if (!done) draw(0, null); };
    api.status('Choose a food and a test, then press Run test.');
    api.onChange();
  }
})();
