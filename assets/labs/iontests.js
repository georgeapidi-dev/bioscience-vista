/* Identifying ions laboratory: flame tests, precipitates and gas tests · VistaEd · by George Apidi */
(function () {
  var LABS = window.LABS = window.LABS || {};
  // cation, anion of each solution
  var SALT = { LiCl: ['Lithium chloride', 'Li', 'Cl'], NaI: ['Sodium iodide', 'Na', 'I'], KBr: ['Potassium bromide', 'K', 'Br'], CaCl2: ['Calcium chloride', 'Ca', 'Cl'],
    CuSO4: ['Copper(II) sulfate', 'Cu', 'SO4'], FeSO4: ['Iron(II) sulfate', 'Fe2', 'SO4'], FeCl3: ['Iron(III) chloride', 'Fe3', 'Cl'], AlNO3: ['Aluminium nitrate', 'Al', 'NO3'],
    NH4Cl: ['Ammonium chloride', 'NH4', 'Cl'], Na2CO3: ['Sodium carbonate', 'Na', 'CO3'], ZnSO4: ['Zinc sulfate', 'Zn', 'SO4'],
    A: ['Unknown A', 'Cu', 'Cl'], B: ['Unknown B', 'K', 'CO3'], C: ['Unknown C', 'Fe3', 'SO4'], D: ['Unknown D', 'Ca', 'I'] };
  var FLAME = { Li: ['crimson red', '#dc143c', 671], Na: ['yellow-orange', '#fbbf24', 589], K: ['lilac', '#c084fc', 404], Ca: ['orange-red (brick red)', '#ea580c', 622], Cu: ['blue-green', '#10b981', 515], Fe2: ['no distinctive colour', '#f59e0b', null], Fe3: ['no distinctive colour', '#f59e0b', null], Al: ['no colour', '#93c5fd', null], NH4: ['no colour', '#93c5fd', null], Zn: ['no colour', '#93c5fd', null] };
  var NAOH = { Cu: ['blue precipitate', '#2563eb', 'insoluble in excess'], Fe2: ['green precipitate', '#4d7c0f', 'insoluble in excess (turns brown on standing)'], Fe3: ['orange-brown precipitate', '#b45309', 'insoluble in excess'],
    Al: ['white precipitate', '#f1f5f9', 'dissolves in excess, giving a colourless solution'], Zn: ['white precipitate', '#f1f5f9', 'dissolves in excess, giving a colourless solution'], Ca: ['white precipitate', '#f1f5f9', 'insoluble in excess'] };
  var TEST = { flame: 'Flame test (nichrome wire)', naoh: 'Sodium hydroxide solution, a few drops then excess', nh4: 'Warm with sodium hydroxide; damp red litmus at the mouth', halide: 'Dilute nitric acid, then silver nitrate solution', sulf: 'Dilute hydrochloric acid, then barium chloride solution', carb: 'Dilute hydrochloric acid; bubble gas through limewater', nitr: 'Sodium hydroxide and aluminium foil, warm; damp red litmus' };
  function obs(v) {
    var s = SALT[v.sol], cat = s[1], an = s[2], t = v.test;
    if (t === 'flame') { var f = FLAME[cat]; return { txt: f[0], col: f[1], wl: f[2], pos: f[2] != null }; }
    if (t === 'naoh') { var n = NAOH[cat]; return n ? { txt: n[0] + ', ' + n[2], col: n[1], ppt: true, excess: /dissolves/.test(n[2]), pos: true } : { txt: 'no precipitate', col: '#e0f2fe', pos: false }; }
    if (t === 'nh4') return cat === 'NH4' ? { txt: 'gas turns damp red litmus blue (ammonia)', col: '#e0f2fe', gas: '#3b82f6', pos: true } : { txt: 'no gas; litmus stays red', col: '#e0f2fe', gas: '#ef4444', pos: false };
    if (t === 'halide') { var H = { Cl: ['white precipitate (silver chloride)', '#f8fafc'], Br: ['cream precipitate (silver bromide)', '#fef3c7'], I: ['yellow precipitate (silver iodide)', '#fde047'] }[an]; return H ? { txt: H[0], col: H[1], ppt: true, pos: true } : { txt: an === 'CO3' ? 'fizzing with nitric acid, then no precipitate' : 'no precipitate', col: '#e0f2fe', pos: false }; }
    if (t === 'sulf') return an === 'SO4' ? { txt: 'white precipitate (barium sulfate)', col: '#f8fafc', ppt: true, pos: true } : { txt: an === 'CO3' ? 'fizzing with the acid, then no precipitate' : 'no precipitate', col: '#e0f2fe', pos: false };
    if (t === 'carb') return an === 'CO3' ? { txt: 'fizzing; gas turns limewater milky (carbon dioxide)', col: '#e0f2fe', fizz: true, pos: true } : { txt: 'no fizzing; limewater stays clear', col: '#e0f2fe', pos: false };
    return an === 'NO3' || cat === 'NH4' ? { txt: 'gas turns damp red litmus blue (ammonia)', col: '#e0f2fe', gas: '#3b82f6', pos: true } : { txt: 'no gas; litmus stays red', col: '#e0f2fe', gas: '#ef4444', pos: false };
  }
  LABS.iontests = {
    id: 'iontests', title: 'Identifying ions laboratory: flame tests, precipitates and gas tests',
    tags: ['Chemistry', 'Chemical analysis', 'MYP 3–5', 'IGCSE', 'Edexcel', 'A Level'],
    background: '<figure style="margin:0 0 10px"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Coloured_flames_of_methanol_solutions_of_metal_salts_and_compounds.jpg?width=640" alt="Real flame colours, left to right: lithium, strontium, calcium, sodium, barium, boron, copper, caesium, potassium compounds." loading="lazy" style="max-width:100%;max-height:320px;border-radius:10px"><figcaption style="font-size:.85rem;color:#475569">Real flame colours, left to right: lithium, strontium, calcium, sodium, barium, boron, copper, caesium, potassium compounds. Photo: Wikimedia Commons contributors, via <a href="https://commons.wikimedia.org/wiki/File:Coloured_flames_of_methanol_solutions_of_metal_salts_and_compounds.jpg" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure><p>Ions in a salt can be identified by tests that give a <b>distinctive, observable</b> result.</p><ul>' +
      '<li><b>Flame tests (cations):</b> Li⁺ crimson, Na⁺ yellow, K⁺ lilac, Ca²⁺ orange-red, Cu²⁺ blue-green. Heat excites electrons; light of a particular wavelength is given out as they fall back.</li>' +
      '<li><b>Sodium hydroxide (cations):</b> Cu²⁺ blue, Fe²⁺ green, Fe³⁺ orange-brown precipitate; Al³⁺, Zn²⁺ and Ca²⁺ white, but only Al³⁺ and Zn²⁺ dissolve in excess. NH₄⁺ gives ammonia on warming, which turns damp red litmus blue.</li>' +
      '<li><b>Anions:</b> halides with acidified silver nitrate (Cl⁻ white, Br⁻ cream, I⁻ yellow); sulfate with acidified barium chloride (white); carbonate fizzes with acid and the CO₂ turns limewater milky; nitrate gives ammonia when warmed with NaOH and aluminium.</li></ul>' +
      '<p>Acid is added first in the anion tests to remove carbonate ions, which would also form precipitates.</p>',
    objectives: ['Carry out flame tests and precipitate tests for cations.', 'Carry out tests for halide, sulfate, carbonate and nitrate ions.', 'Write ionic equations for precipitation reactions.', 'Identify the ions in four unknown salts.'],
    rq: 'Which cation and which anion are present in each unknown salt?',
    hypPrompt: 'Choose a test you would do first on an unknown salt, and say what result would show a copper(II) ion.',
    hypothesis: { marks: 2, points: [
      { re: [/flame|sodium hydroxide|naoh/], marks: 1, ok: 'A suitable first test.', miss: 'Name a test: a flame test or sodium hydroxide.' },
      { re: [/blue.?green|green.?blue|blue precipitate/], marks: 1, ok: 'Copper result.', miss: 'Copper(II): blue-green flame or a blue precipitate with NaOH.' }] },
    variables: { iv: 'the solution tested and the reagent used', dv: 'the observation (colour of flame or precipitate, gas produced)', cv: ['a clean wire (dipped in acid and heated until no colour)', 'fresh reagents and clean test tubes', 'same volumes (about 1 cm³ of solution)'] },
    apparatus: ['Nichrome wire loop and Bunsen burner', 'Test tubes, droppers', 'Sodium hydroxide solution, dilute nitric and hydrochloric acids', 'Silver nitrate and barium chloride solutions', 'Limewater, red litmus paper, aluminium foil', 'Labelled salt solutions and unknowns A–D'],
    safety: ['Wear eye protection. Sodium hydroxide is corrosive; nitric acid is corrosive.', 'Silver nitrate stains skin; barium chloride is toxic: wash hands after use.', 'Warm tubes gently, pointing away from people; ammonia is an irritant.'],
    method: ['Choose a solution and a test.', 'Press <b>Do test</b> and observe carefully.', 'Press <b>Record</b>.', 'Test the known salts first to see each positive result.', 'Then test unknowns A–D with enough tests to identify both ions.'],
    controls: [
      { id: 'sol', label: 'Solution', type: 'select', value: 'CuSO4', options: Object.keys(SALT).map(function (k) { return [k, SALT[k][0]]; }) },
      { id: 'test', label: 'Test', type: 'select', value: 'flame', options: Object.keys(TEST).map(function (k) { return [k, TEST[k]]; }) }
    ],
    columns: [
      { key: 'sol', label: 'Solution', num: false }, { key: 'test', label: 'Test', num: false, group: true }, { key: 'obs', label: 'Observation', num: false }, { key: 'res', label: 'Result', num: false },
      { key: 'wl', label: 'Flame wavelength', unit: 'nm', dp: 0 }, { key: 'ev', label: 'Photon energy', unit: 'eV', dp: 2 }
    ],
    graph: { x: 'wl', y: 'ev', group: 'test' },
    hints: ['Clean the flame-test wire in acid between samples, or colours mix.', 'Sodium\'s yellow flame can hide other colours.', 'For a white precipitate with NaOH, add excess: Al³⁺ and Zn²⁺ dissolve, Ca²⁺ does not.', 'Photon energy E = hc/λ: in eV, E = 1240 ÷ wavelength in nm.'],
    analyse: [
      { id: 'A', q: 'Identify the ions in unknown A. Give your evidence.', marks: 2, lines: 3, points: [
        { re: [/copper|cu/], marks: 1, ok: 'Copper(II).', miss: 'Find the cation (flame or NaOH test).' }, { re: [/chloride|cl/], marks: 1, ok: 'Chloride.', miss: 'Find the anion (silver nitrate test).' }] },
      { id: 'B', q: 'Identify the ions in unknown B. Give your evidence.', marks: 2, lines: 3, points: [
        { re: [/potassium|\bk\b/], marks: 1, ok: 'Potassium.', miss: 'Try a flame test on B.' }, { re: [/carbonate|co3/], marks: 1, ok: 'Carbonate.', miss: 'Try the acid and limewater test on B.' }] },
      { id: 'C', q: 'Identify the ions in unknown C. Give your evidence.', marks: 2, lines: 3, points: [
        { re: [/iron ?\(?iii|fe ?3|fe3\+|ferric/], marks: 1, ok: 'Iron(III).', miss: 'Use sodium hydroxide on C.' }, { re: [/sulfate|sulphate|so4/], marks: 1, ok: 'Sulfate.', miss: 'Use barium chloride on C.' }] },
      { id: 'D', q: 'Identify the ions in unknown D. Give your evidence.', marks: 2, lines: 3, points: [
        { re: [/calcium|ca/], marks: 1, ok: 'Calcium.', miss: 'Use a flame test and NaOH on D.' }, { re: [/iodide|\bi-|\bi\b/], marks: 1, ok: 'Iodide.', miss: 'Use silver nitrate on D.' }] },
      { id: 'eq', q: 'Write the ionic equation for the reaction of copper(II) ions with hydroxide ions.', marks: 2, lines: 2, points: [
        { re: [/cu.?2\+?.*2 ?oh|2 ?oh.*cu/], marks: 1, ok: 'Reactants.', miss: 'Reactants: Cu²⁺(aq) + 2OH⁻(aq).' }, { re: [/cu ?\(oh\) ?2/], marks: 1, ok: 'Product.', miss: 'Product: Cu(OH)₂(s).' }] },
      { id: 'ev', q: 'Use your flame-test data: which flame colour has the highest-energy photons? Explain.', marks: 2, lines: 3, points: [
        { re: [/lilac|potassium|violet/], marks: 1, ok: 'Lilac (potassium).', miss: 'Look for the shortest wavelength: lilac (potassium, 404 nm).' },
        { re: [/short(est)? wavelength|lower wavelength|1240|inversely|e ?= ?hc/], marks: 1, ok: 'Energy is inversely related to wavelength.', miss: 'Explain: E = hc/λ, so the shortest wavelength has the most energy.' }] }
    ],
    evaluate: [
      { id: 'err', q: 'Explain why dilute acid is added before silver nitrate or barium chloride.', marks: 2, lines: 3, points: [
        { re: [/carbonate/], marks: 1, ok: 'Removes carbonate.', miss: 'The acid removes carbonate ions.' },
        { re: [/precipitate|false positive|also (form|give)|white/], marks: 1, ok: 'Avoids a false positive.', miss: 'Carbonates would also form a precipitate and give a false positive.' }] },
      { id: 'lim', q: 'Give one limitation of flame tests, and an instrumental method that overcomes it.', marks: 2, lines: 3, points: [
        { re: [/mask|hide|mixture|sodium|faint|similar colour|subjective|some (ions|metals) (give )?no/], marks: 1, ok: 'A limitation.', miss: 'For example: sodium\'s yellow masks other colours in a mixture.' },
        { re: [/spectroscop|spectrometer|emission|flame photometr|aas|atomic absorption/], marks: 1, ok: 'An instrumental method.', miss: 'Flame emission spectroscopy identifies each ion\'s line spectrum.' }] }
    ],
    model: '<ul><li>Observations follow the standard results for IGCSE and Edexcel qualitative analysis. Wavelengths are the strongest visible emission lines: Li 671 nm, Na 589 nm, K 404 nm (with a red line at 766 nm, seen through cobalt glass), Ca 622 nm, Cu 515 nm.</li><li>Unknowns: A copper(II) chloride, B potassium carbonate, C iron(III) sulfate, D calcium iodide (shown only in this panel).</li></ul>',
    setup: setup
  };

  function setup(api) {
    var raf = 0, done = null;
    api.stage.innerHTML = '<svg viewBox="0 0 420 220" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Chemical test in progress" id="it-sv"></svg>';
    var sv = api.stage.querySelector('#it-sv');
    function draw(f, o) {
      var v = api.vals(), h = '';
      if (v.test === 'flame') {
        h += '<rect x="170" y="160" width="40" height="45" fill="#64748b"/><rect x="160" y="200" width="60" height="8" fill="#334155"/>';
        var c = o && f > 0.2 ? o.col : '#60a5fa', fl = 40 + 10 * Math.sin(performance.now() / 90);
        h += '<path d="M178,160 q12,-' + (fl + 40) + ' 12,-' + (fl + 60) + ' q0,' + (fl + 20) + ' 12,' + (fl + 60) + ' z" fill="' + c + '" opacity=".85"/><path d="M184,160 q6,-30 6,-45 q0,15 6,45 z" fill="#bfdbfe"/>';
        h += '<line x1="300" y1="40" x2="196" y2="' + (110 - 30 * (1 - f)) + '" stroke="#78716c" stroke-width="2"/><circle cx="194" cy="' + (112 - 30 * (1 - f)) + '" r="4" fill="none" stroke="#78716c" stroke-width="2"/>';
      } else {
        h += '<path d="M180,30 L180,170 q0,18 15,18 q15,0 15,-18 L210,30" fill="#fff" stroke="#334155" stroke-width="2"/>';
        var base = '#e0f2fe'; if (/Cu|Fe|Unknown/.test(SALT[v.sol][0])) base = { Cu: '#bfdbfe', Fe2: '#d9f99d', Fe3: '#fde68a' }[SALT[v.sol][1]] || base;
        h += '<path d="M181,120 L181,170 q0,17 14,17 q14,0 14,-17 L209,120 Z" fill="' + base + '"/>';
        if (o && o.ppt) { var a = o.excess && f > 0.7 ? Math.max(0, 1 - (f - 0.7) * 3.3) : Math.min(1, f * 1.6); for (var i = 0; i < 26; i++) h += '<circle cx="' + (184 + (i * 7) % 22) + '" cy="' + (126 + (i * 13) % 56) + '" r="2.6" fill="' + o.col + '" stroke="#94a3b8" stroke-width=".4" opacity="' + a + '"/>'; }
        if (o && o.fizz) for (var j = 0; j < 8; j++) h += '<circle cx="' + (186 + (j * 5) % 18) + '" cy="' + (180 - ((performance.now() / 8 + j * 20) % 60)) + '" r="2" fill="none" stroke="#475569"/>';
        if (o && o.gas) h += '<rect x="186" y="10" width="18" height="22" rx="2" fill="' + (f > 0.5 ? o.gas : '#ef4444') + '"/><text x="195" y="8" font-size="9" text-anchor="middle">litmus</text>';
        if (v.test === 'carb' && o) h += '<path d="M210,60 L280,60 L280,140" fill="none" stroke="#334155" stroke-width="2"/><rect x="262" y="120" width="36" height="70" rx="4" fill="' + (o.pos && f > 0.5 ? '#f1f5f9' : '#f8fafc') + '" stroke="#334155"/><text x="280" y="205" font-size="9" text-anchor="middle">limewater</text>';
        h += '<text x="120" y="205" font-size="10" text-anchor="middle">' + SALT[v.sol][0] + '</text>';
      }
      if (o && f >= 1) h += '<foreignObject x="250" y="20" width="160" height="90"><div xmlns="http://www.w3.org/1999/xhtml" style="font:12px system-ui;color:#0f172a"><b>Observation</b><br>' + api.E(o.txt) + '</div></foreignObject>';
      sv.innerHTML = h;
    }
    function run() {
      cancelAnimationFrame(raf); var v = api.vals(), o = obs(v), t0 = performance.now(); api.enable('run', false); api.enable('rec', false);
      (function loop() { var f = Math.min(1, (performance.now() - t0) / 2600); draw(f, o); if (f < 1) raf = requestAnimationFrame(loop); else { done = { v: v, o: o }; api.enable('run', true); api.enable('rec', true); api.status('Observation: ' + o.txt + '. Press Record.'); api.readings([['Observation', o.txt.split(',')[0]]].concat(o.wl ? [['Wavelength', o.wl + ' nm']] : [])); } })();
    }
    api.actions([
      { id: 'run', label: '🧪 Do test', main: true, fn: run },
      { id: 'rec', label: '➕ Record', fn: function () { if (!done) return; var v = done.v, o = done.o;
        api.record({ sol: SALT[v.sol][0], test: TEST[v.test].split(';')[0].split(',')[0], obs: o.txt, res: o.pos ? 'positive' : 'negative', wl: o.wl || null, ev: o.wl ? +(1240 / o.wl).toFixed(3) : null }); api.enable('rec', false); } }
    ]);
    api.onChange = function () { cancelAnimationFrame(raf); done = null; api.enable('run', true); api.enable('rec', false); draw(0, null); api.readings([['Solution', SALT[api.vals().sol][0]]]); };
    api.onShow = function () { if (!done) draw(0, null); };
    api.status('Choose a solution and a test, then press Do test.');
    api.onChange();
  }
})();
