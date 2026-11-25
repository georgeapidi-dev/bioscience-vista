/* VistaEd · Games (/games/) · by George Apidi
   Educational games in Biology, Chemistry, Physics, Mathematics and general Science, with gamification:
   XP and levels, stars for every game, a daily challenge (double XP), a day streak, badges and, for signed-in
   students, cloud save and a leaderboard of their classes (migration 047). Without an account everything is kept
   on this device. Every game works with mouse, touch and keyboard. */
(function () {
  var app = document.getElementById('app'); if (!app) return;
  var S = window.BVS || null, E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ME = null, CLOUD = false, BOARD = null;

  /* ------------------------------------------------------------------ helpers */
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); }
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dayNo(s) { return Math.floor(new Date(s + 'T12:00:00').getTime() / 864e5); }
  function sub(n) { return String(n).replace(/\d/g, function (d) { return '₀₁₂₃₄₅₆₇₈₉'[d]; }); }
  function sup(s) { return String(s).replace(/[0-9+\-]/g, function (c) { return { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻' }[c]; }); }
  function nice(x) { return Math.round(x * 100) / 100; }
  function el(h) { var d = document.createElement('div'); d.innerHTML = h; return d.firstElementChild; }

  /* ------------------------------------------------------------------ the player's progress */
  var KEY = 'bv-games-v1';
  function blank() { return { xp: 0, best: {}, stars: {}, plays: {}, days: [], badges: [], total: 0, subj: {} }; }
  function load() { try { var o = JSON.parse(localStorage.getItem(KEY) || 'null'); return o && typeof o === 'object' ? Object.assign(blank(), o) : blank(); } catch (e) { return blank(); } }
  var P = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} }
  var TITLES = ['Curious Beginner', 'Explorer', 'Investigator', 'Lab Assistant', 'Young Scientist', 'Researcher', 'Senior Researcher', 'Professor', 'Distinguished Professor', 'Nobel Laureate'];
  function level(xp) { var L = Math.floor((Math.sqrt(1 + 8 * xp / 100) - 1) / 2) + 1, base = 100 * (L - 1) * L / 2, next = 100 * L * (L + 1) / 2; return { n: L, title: TITLES[Math.min(L - 1, TITLES.length - 1)], from: base, to: next, pct: Math.round((xp - base) / (next - base) * 100) }; }
  function streak() {
    var d = (P.days || []).slice().sort(), t = dayNo(today()), n = 0;
    if (!d.length) return 0; var last = dayNo(d[d.length - 1]); if (t - last > 1) return 0;
    for (var i = d.length - 1; i >= 0; i--) { if (dayNo(d[i]) === last - n) n++; else break; }
    return n;
  }

  /* ------------------------------------------------------------------ content (checked science) */
  var ORGANELLES = [['Nucleus', 'Contains DNA and controls the cell'], ['Mitochondrion', 'Site of aerobic respiration'], ['Ribosome', 'Makes proteins'], ['Chloroplast', 'Site of photosynthesis'],
    ['Cell membrane', 'Controls what enters and leaves'], ['Cell wall', 'Made of cellulose; supports plant cells'], ['Vacuole', 'Stores cell sap and keeps the cell firm'], ['Rough ER', 'Folds and transports proteins'], ['Golgi apparatus', 'Packages proteins for secretion'], ['Lysosome', 'Contains digestive enzymes']];
  var UNITS = [['Force', 'newton (N)'], ['Energy', 'joule (J)'], ['Power', 'watt (W)'], ['Current', 'ampere (A)'], ['Potential difference', 'volt (V)'], ['Resistance', 'ohm (Ω)'], ['Frequency', 'hertz (Hz)'], ['Pressure', 'pascal (Pa)'], ['Mass', 'kilogram (kg)'], ['Temperature', 'kelvin (K)'], ['Charge', 'coulomb (C)'], ['Amount of substance', 'mole (mol)']];
  var SYSTEMS = { bins: ['Digestive', 'Circulatory', 'Respiratory', 'Nervous', 'Excretory'], items: [['Stomach', 0], ['Small intestine', 0], ['Oesophagus', 0], ['Large intestine', 0], ['Pancreas', 0], ['Heart', 1], ['Artery', 1], ['Vein', 1], ['Capillary', 1], ['Red blood cell', 1], ['Lungs', 2], ['Trachea', 2], ['Bronchus', 2], ['Alveoli', 2], ['Diaphragm', 2], ['Brain', 3], ['Spinal cord', 3], ['Neurone', 3], ['Sensory receptor', 3], ['Kidney', 4], ['Bladder', 4], ['Ureter', 4], ['Urethra', 4]] };
  var PH = { bins: ['Acidic (pH below 7)', 'Neutral (pH 7)', 'Alkaline (pH above 7)'], items: [['Lemon juice', 0], ['Vinegar', 0], ['Stomach acid', 0], ['Cola', 0], ['Black coffee', 0], ['Tomato juice', 0], ['Hydrochloric acid', 0], ['Pure water', 1], ['Sodium chloride solution', 1], ['Sugar solution', 1], ['Soap', 2], ['Bleach', 2], ['Baking soda solution', 2], ['Milk of magnesia', 2], ['Oven cleaner', 2], ['Ammonia solution', 2], ['Sodium hydroxide solution', 2], ['Seawater', 2]] };
  var ENERGY = { bins: ['Renewable', 'Non-renewable'], items: [['Solar', 0], ['Wind', 0], ['Hydroelectric', 0], ['Geothermal', 0], ['Tidal', 0], ['Wave', 0], ['Biomass (wood from managed forests)', 0], ['Coal', 1], ['Crude oil', 1], ['Natural gas', 1], ['Nuclear (uranium)', 1], ['Petrol', 1], ['Diesel', 1]] };
  var SAFETY = { bins: ['✅ Safe practice', '⛔ Unsafe practice'], items: [['Wearing eye protection when heating', 0], ['Tying back long hair near a flame', 0], ['Pointing a test tube away from people when heating', 0], ['Adding acid to water, not water to acid', 0], ['Reporting a broken beaker to the teacher', 0], ['Using a lit Bunsen burner on the safety (yellow) flame when not heating', 0], ['Washing hands after the practical', 0],
    ['Eating your lunch at the bench', 1], ['Smelling a gas by putting your nose over the tube', 1], ['Pouring leftover chemicals back into the bottle', 1], ['Running in the laboratory', 1], ['Heating a test tube with the stopper on', 1], ['Picking up broken glass with bare hands', 1], ['Leaving a lit Bunsen burner unattended', 1]] };
  var STATES = { bins: ['Solid', 'Liquid', 'Gas'], items: [['Iron', 0], ['Sodium chloride (salt)', 0], ['Sand', 0], ['Copper', 0], ['Candle wax', 0], ['Glass', 0], ['Sulfur', 0], ['Iodine', 0], ['Water', 1], ['Mercury', 1], ['Bromine', 1], ['Ethanol', 1], ['Olive oil', 1], ['Petrol', 1], ['Oxygen', 2], ['Nitrogen', 2], ['Carbon dioxide', 2], ['Helium', 2], ['Chlorine', 2], ['Methane', 2], ['Neon', 2]] };
  var CHAINS = [['Grass', 'Zebra', 'Lion'], ['Grass', 'Grasshopper', 'Frog', 'Snake', 'Eagle'], ['Phytoplankton', 'Zooplankton', 'Small fish', 'Seal', 'Orca'], ['Acacia leaves', 'Giraffe', 'Lion'], ['Oak leaves', 'Caterpillar', 'Blue tit', 'Sparrowhawk'], ['Algae', 'Mayfly larva', 'Trout', 'Heron'], ['Seeds', 'Mouse', 'Owl'], ['Grass', 'Rabbit', 'Fox']];
  var SEQS = [['Scientific method', ['Ask a question', 'Write a hypothesis', 'Plan a fair test', 'Collect data', 'Analyse the results', 'Write a conclusion', 'Evaluate the method']],
    ['Planets from the Sun', ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']],
    ['Phases of mitosis', ['Prophase', 'Metaphase', 'Anaphase', 'Telophase']],
    ['The water cycle (starting at the sea)', ['Evaporation', 'Condensation', 'Precipitation', 'Collection (run-off)']],
    ['Path of air into the lungs', ['Nose or mouth', 'Trachea', 'Bronchus', 'Bronchiole', 'Alveolus']],
    ['Electromagnetic spectrum (longest wavelength first)', ['Radio waves', 'Microwaves', 'Infrared', 'Visible light', 'Ultraviolet', 'X-rays', 'Gamma rays']],
    ['Levels of organisation (smallest first)', ['Cell', 'Tissue', 'Organ', 'Organ system', 'Organism']],
    ['Making a salt from an insoluble base', ['Warm the acid', 'Add the base until no more reacts', 'Filter off the excess base', 'Evaporate some of the water', 'Leave to crystallise']],
    ['Heating ice (from the start)', ['Solid ice warms up', 'Ice melts', 'Liquid water warms up', 'Water boils', 'Steam forms']]];
  // the first 36 elements: [symbol, name, period (row), group (column 1-18)]
  var ELEMENTS = [['H', 'Hydrogen', 1, 1], ['He', 'Helium', 1, 18], ['Li', 'Lithium', 2, 1], ['Be', 'Beryllium', 2, 2], ['B', 'Boron', 2, 13], ['C', 'Carbon', 2, 14], ['N', 'Nitrogen', 2, 15], ['O', 'Oxygen', 2, 16], ['F', 'Fluorine', 2, 17], ['Ne', 'Neon', 2, 18],
    ['Na', 'Sodium', 3, 1], ['Mg', 'Magnesium', 3, 2], ['Al', 'Aluminium', 3, 13], ['Si', 'Silicon', 3, 14], ['P', 'Phosphorus', 3, 15], ['S', 'Sulfur', 3, 16], ['Cl', 'Chlorine', 3, 17], ['Ar', 'Argon', 3, 18],
    ['K', 'Potassium', 4, 1], ['Ca', 'Calcium', 4, 2], ['Sc', 'Scandium', 4, 3], ['Ti', 'Titanium', 4, 4], ['V', 'Vanadium', 4, 5], ['Cr', 'Chromium', 4, 6], ['Mn', 'Manganese', 4, 7], ['Fe', 'Iron', 4, 8], ['Co', 'Cobalt', 4, 9], ['Ni', 'Nickel', 4, 10], ['Cu', 'Copper', 4, 11], ['Zn', 'Zinc', 4, 12], ['Ga', 'Gallium', 4, 13], ['Ge', 'Germanium', 4, 14], ['As', 'Arsenic', 4, 15], ['Se', 'Selenium', 4, 16], ['Br', 'Bromine', 4, 17], ['Kr', 'Krypton', 4, 18]];
  // equations to balance: reactants and products as [formula, {element: count}], with the smallest whole-number answer
  var EQS = [
    { r: [['H2', { H: 2 }], ['O2', { O: 2 }]], p: [['H2O', { H: 2, O: 1 }]], a: [2, 1, 2] },
    { r: [['Mg', { Mg: 1 }], ['O2', { O: 2 }]], p: [['MgO', { Mg: 1, O: 1 }]], a: [2, 1, 2] },
    { r: [['N2', { N: 2 }], ['H2', { H: 2 }]], p: [['NH3', { N: 1, H: 3 }]], a: [1, 3, 2] },
    { r: [['CH4', { C: 1, H: 4 }], ['O2', { O: 2 }]], p: [['CO2', { C: 1, O: 2 }], ['H2O', { H: 2, O: 1 }]], a: [1, 2, 1, 2] },
    { r: [['Na', { Na: 1 }], ['Cl2', { Cl: 2 }]], p: [['NaCl', { Na: 1, Cl: 1 }]], a: [2, 1, 2] },
    { r: [['Fe', { Fe: 1 }], ['O2', { O: 2 }]], p: [['Fe2O3', { Fe: 2, O: 3 }]], a: [4, 3, 2] },
    { r: [['Al', { Al: 1 }], ['O2', { O: 2 }]], p: [['Al2O3', { Al: 2, O: 3 }]], a: [4, 3, 2] },
    { r: [['Zn', { Zn: 1 }], ['HCl', { H: 1, Cl: 1 }]], p: [['ZnCl2', { Zn: 1, Cl: 2 }], ['H2', { H: 2 }]], a: [1, 2, 1, 1] },
    { r: [['C3H8', { C: 3, H: 8 }], ['O2', { O: 2 }]], p: [['CO2', { C: 1, O: 2 }], ['H2O', { H: 2, O: 1 }]], a: [1, 5, 3, 4] },
    { r: [['Na', { Na: 1 }], ['H2O', { H: 2, O: 1 }]], p: [['NaOH', { Na: 1, O: 1, H: 1 }], ['H2', { H: 2 }]], a: [2, 2, 2, 1] },
    { r: [['C6H12O6', { C: 6, H: 12, O: 6 }], ['O2', { O: 2 }]], p: [['CO2', { C: 1, O: 2 }], ['H2O', { H: 2, O: 1 }]], a: [1, 6, 6, 6] },
    { r: [['CaCO3', { Ca: 1, C: 1, O: 3 }], ['HCl', { H: 1, Cl: 1 }]], p: [['CaCl2', { Ca: 1, Cl: 2 }], ['H2O', { H: 2, O: 1 }], ['CO2', { C: 1, O: 2 }]], a: [1, 2, 1, 1, 1] },
    { r: [['K', { K: 1 }], ['H2O', { H: 2, O: 1 }]], p: [['KOH', { K: 1, O: 1, H: 1 }], ['H2', { H: 2 }]], a: [2, 2, 2, 1] },
    { r: [['Cu', { Cu: 1 }], ['O2', { O: 2 }]], p: [['CuO', { Cu: 1, O: 1 }]], a: [2, 1, 2] }];
  var CATIONS = [['Na', 1, 'sodium'], ['K', 1, 'potassium'], ['Mg', 2, 'magnesium'], ['Ca', 2, 'calcium'], ['Al', 3, 'aluminium'], ['Zn', 2, 'zinc'], ['Li', 1, 'lithium'], ['Fe', 3, 'iron(III)'], ['Cu', 2, 'copper(II)'], ['NH4', 1, 'ammonium']];
  var ANIONS = [['Cl', 1, 'chloride'], ['O', 2, 'oxide'], ['S', 2, 'sulfide'], ['Br', 1, 'bromide'], ['OH', 1, 'hydroxide'], ['NO3', 1, 'nitrate'], ['SO4', 2, 'sulfate'], ['CO3', 2, 'carbonate']];

  /* question generators for the sprint games: each returns {q, options[], a (index), pic?} */
  /* ---- data for the games added 16 Nov 2026 */
  var TRAITS = [['tall stems', 'short stems', 'T'], ['purple flowers', 'white flowers', 'P'], ['round seeds', 'wrinkled seeds', 'R'], ['black fur', 'brown fur', 'B'], ['yellow seeds', 'green seeds', 'Y'], ['free earlobes', 'attached earlobes', 'E']];
  var SUBST = [['water', 'H₂O', 18], ['carbon dioxide', 'CO₂', 44], ['sodium chloride', 'NaCl', 58.5], ['calcium carbonate', 'CaCO₃', 100], ['magnesium oxide', 'MgO', 40], ['sodium hydroxide', 'NaOH', 40], ['glucose', 'C₆H₁₂O₆', 180], ['oxygen', 'O₂', 32], ['methane', 'CH₄', 16], ['sulfuric acid', 'H₂SO₄', 98], ['copper(II) sulfate', 'CuSO₄', 159.5], ['ammonia', 'NH₃', 17]];
  var DENSITY = { bins: ['Floats in water', 'Sinks in water'], items: [['Cork (0.24 g/cm³)', 0], ['Ice (0.92 g/cm³)', 0], ['Oak wood (0.75 g/cm³)', 0], ['Candle wax (0.90 g/cm³)', 0], ['Polystyrene (0.05 g/cm³)', 0], ['Pumice stone (0.64 g/cm³)', 0], ['Olive oil (0.92 g/cm³)', 0], ['Petrol (0.74 g/cm³)', 0], ['Butter (0.91 g/cm³)', 0],
    ['Iron (7.9 g/cm³)', 1], ['Glass (2.5 g/cm³)', 1], ['Aluminium (2.7 g/cm³)', 1], ['Copper (8.9 g/cm³)', 1], ['Gold (19.3 g/cm³)', 1], ['Granite (2.7 g/cm³)', 1], ['PVC plastic (1.4 g/cm³)', 1], ['Ebony wood (1.2 g/cm³)', 1], ['Rubber eraser (1.5 g/cm³)', 1], ['Honey (1.4 g/cm³)', 1], ['Bone (1.9 g/cm³)', 1]] };
  var CELLPARTS = [['wall', 'Cell wall', 'the part made of cellulose that keeps the cell its shape'], ['membrane', 'Cell membrane', 'the part that controls what enters and leaves the cell'], ['cytoplasm', 'Cytoplasm', 'the jelly where most of the cell\'s chemical reactions happen'],
    ['nucleus', 'Nucleus', 'the part that contains DNA and controls the cell'], ['vacuole', 'Vacuole', 'the part that stores cell sap and keeps the cell firm'], ['chloroplast', 'Chloroplast', 'the part where photosynthesis happens'],
    ['mitochondrion', 'Mitochondrion', 'the part where aerobic respiration releases energy'], ['ribosome', 'Ribosomes', 'the tiny parts where proteins are made']];
  var WORDS = [['OSMOSIS', 'Movement of water across a partially permeable membrane'], ['ENZYME', 'A biological catalyst made of protein'], ['MITOSIS', 'Cell division that makes two identical cells'], ['DIFFUSION', 'Net movement of particles from high to low concentration'],
    ['CHLOROPHYLL', 'Green pigment that absorbs light'], ['RESPIRATION', 'Releases energy from glucose in every cell'], ['ALLELE', 'A different version of the same gene'], ['GENOTYPE', 'The alleles an organism has, such as Tt'], ['HABITAT', 'The place where an organism lives'],
    ['ECOSYSTEM', 'A community and its non-living environment'], ['PROTEIN', 'Made from amino acids'], ['ANTIBODY', 'Made by white blood cells to fight pathogens'], ['NEUTRON', 'A particle in the nucleus with no charge'], ['ELECTRON', 'Negative particle in shells around the nucleus'],
    ['ISOTOPE', 'Same element, different number of neutrons'], ['CATALYST', 'Speeds up a reaction without being used up'], ['ALKALI', 'A soluble base: pH above 7'], ['MOLECULE', 'Two or more atoms joined together'], ['POLYMER', 'A long chain made of many monomers'],
    ['OXIDATION', 'Gain of oxygen or loss of electrons'], ['DENSITY', 'Mass divided by volume'], ['VELOCITY', 'Speed in a given direction'], ['FRICTION', 'A force that opposes motion between surfaces'], ['GRAVITY', 'The force that pulls masses together'],
    ['VOLTAGE', 'Another name for potential difference'], ['FREQUENCY', 'Number of waves each second'], ['MOMENTUM', 'Mass multiplied by velocity'], ['EVAPORATE', 'Change from liquid to gas below the boiling point'], ['HYPOTHESIS', 'A testable prediction'], ['VARIABLE', 'A factor that can change in an experiment']];
  var SYM = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca'.split(' '), ENAME = 'Hydrogen Helium Lithium Beryllium Boron Carbon Nitrogen Oxygen Fluorine Neon Sodium Magnesium Aluminium Silicon Phosphorus Sulfur Chlorine Argon Potassium Calcium'.split(' ');
  function shellsOf(z) { var s = [], cap = [2, 8, 8, 2]; for (var i = 0; i < 4 && z > 0; i++) { s.push(Math.min(z, cap[i])); z -= cap[i]; } while (s.length < 4) s.push(0); return s; }

  function mcq(q, right, wrongs, extra, fill) {   // four different options, the right one at a random place
    var R = String(right), seen = {}, w = []; seen[R] = 1;
    shuffle(wrongs).forEach(function (x) { x = String(x); if (!seen[x] && w.length < 3) { seen[x] = 1; w.push(x); } });
    var m = /^(-?\d+(?:\.\d+)?)(.*)$/.exec(R.replace(/^x = /, '')), pre = /^x = /.test(R) ? 'x = ' : '', k = 1;
    while (w.length < 3 && k < 60) {   // not enough different wrong answers: make more near the right one
      var c = fill ? fill(k) : m ? pre + nice(+m[1] + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Math.abs(+m[1]) >= 20 ? 10 : 1)) + m[2] : R + ' ' + k;
      c = String(c); if (!seen[c]) { seen[c] = 1; w.push(c); } k++;
    }
    var o = shuffle([R].concat(w)); return Object.assign({ q: q, options: o, a: o.indexOf(R) }, extra || {});
  }
  function numWrongs(x, dp) { var r = function (v) { return dp ? nice(v) : Math.round(v); }, set = {}; [x * 2, x / 2, x + (x > 10 ? 10 : 1), x - (x > 10 ? 10 : 1), x * 10, x / 10, x + 2, x - 2].forEach(function (v) { v = r(v); if (v !== r(x) && v > 0) set[v] = 1; }); return Object.keys(set).map(Number); }
  var GEN = {
    dna: function () {
      var b = 'ATGC', n = 6, s = ''; for (var i = 0; i < n; i++) s += pick(b.split(''));
      var rna = Math.random() < 0.4, comp = s.split('').map(function (c) { return rna ? { A: 'U', T: 'A', G: 'C', C: 'G' }[c] : { A: 'T', T: 'A', G: 'C', C: 'G' }[c]; }).join('');
      var w = [comp.split('').reverse().join(''), s, comp.replace(/./, function (c) { return c === 'A' ? 'G' : 'A'; }), rna ? comp.replace(/U/g, 'T') : comp.replace(/T/g, 'U')];
      return mcq((rna ? 'mRNA made from this DNA template strand: ' : 'Complementary DNA strand for: ') + '<b class="gm-mono">' + s + '</b>', comp, w, { mono: true }, function () { var a = comp.split(''), i = rnd(0, a.length - 1); a[i] = pick((rna ? 'AUGC' : 'ATGC').split('').filter(function (x) { return x !== a[i]; })); return a.join(''); });
    },
    formula: function () {
      var c = pick(CATIONS), a = pick(ANIONS), L = lcm(c[1], a[1]), nc = L / c[1], na = L / a[1];
      var disp = function (sym) { return sym.replace(/\d/g, function (d) { return sub(d); }); }, poly = function (sym) { return /^(NH4|NO3|SO4|CO3|OH)$/.test(sym); };
      var part = function (sym, n) { return n === 1 ? disp(sym) : poly(sym) ? '(' + disp(sym) + ')' + sub(n) : disp(sym) + sub(n); };
      var f = function (x, y) { return part(c[0], x) + part(a[0], y); };
      var ion = function (sym, n, sign) { return disp(sym) + sup((n > 1 ? n : '') + sign); };
      var right = f(nc, na), wr = [[na, nc], [1, 1], [nc + 1, na], [nc, na + 1], [na + 1, nc], [2, 1], [1, 2]].map(function (p) { return f(p[0], p[1]); }).filter(function (x) { return x !== 'NaN'; });   // "NaN" (Na + N) would look like a computer error
      return mcq('Formula of <b>' + c[2] + ' ' + a[2] + '</b>?<br><span class="small muted">Ions: ' + ion(c[0], c[1], '+') + ' and ' + ion(a[0], a[1], '-') + '</span>', right, wr, null, function (k) { return f(nc + k, na + (k > 2 ? 1 : 0)); });
    },
    physics: function () {
      var k = rnd(0, 5), x;
      if (k === 0) { var I = pick([0.5, 1, 1.5, 2, 2.5, 3, 4, 5]), R = pick([2, 4, 5, 6, 10, 12, 20]); x = nice(I * R); return mcq('A current of <b>' + I + ' A</b> flows through a <b>' + R + ' Ω</b> resistor. What is the potential difference? <span class="small muted">(V = I R)</span>', x + ' V', numWrongs(x, 1).map(function (v) { return v + ' V'; })); }
      if (k === 1) { var V = pick([3, 6, 9, 12, 24, 230]), R2 = pick([2, 3, 4, 6, 12]); x = nice(V / R2); return mcq('A <b>' + V + ' V</b> supply is connected across a <b>' + R2 + ' Ω</b> resistor. What is the current? <span class="small muted">(I = V ÷ R)</span>', x + ' A', numWrongs(x, 1).map(function (v) { return v + ' A'; })); }
      if (k === 2) { var d = pick([100, 200, 400, 1500, 3000]), t = pick([10, 20, 25, 50]); x = nice(d / t); return mcq('A runner covers <b>' + d + ' m</b> in <b>' + t + ' s</b>. What is the average speed? <span class="small muted">(v = d ÷ t)</span>', x + ' m/s', numWrongs(x, 1).map(function (v) { return v + ' m/s'; })); }
      if (k === 3) { var m = pick([2, 5, 10, 50, 1200]), a = pick([2, 3, 4, 5]); x = m * a; return mcq('A force accelerates a <b>' + m + ' kg</b> mass at <b>' + a + ' m/s²</b>. What is the resultant force? <span class="small muted">(F = m a)</span>', x + ' N', numWrongs(x).map(function (v) { return v + ' N'; })); }
      if (k === 4) { var m2 = pick([2, 5, 10, 60, 70]); x = m2 * 10; return mcq('What is the weight of a <b>' + m2 + ' kg</b> mass on Earth? <span class="small muted">(W = m g, g = 10 N/kg)</span>', x + ' N', numWrongs(x).map(function (v) { return v + ' N'; }).concat([m2 + ' N'])); }
      var V2 = pick([6, 12, 230]), I2 = pick([0.5, 2, 3, 5]); x = nice(V2 * I2); return mcq('A device uses <b>' + I2 + ' A</b> at <b>' + V2 + ' V</b>. What is its power? <span class="small muted">(P = V I)</span>', x + ' W', numWrongs(x, 1).map(function (v) { return v + ' W'; }));
    },
    mental: function (lv) {
      var k = rnd(0, 4), a, b, x, q;
      var big = lv > 4 ? 2 : 1;
      if (k === 0) { a = rnd(12, 99 * big); b = rnd(11, 99 * big); x = a + b; q = a + ' + ' + b; }
      else if (k === 1) { a = rnd(40, 150 * big); b = rnd(11, a - 1); x = a - b; q = a + ' − ' + b; }
      else if (k === 2) { a = rnd(3, 12 + lv); b = rnd(3, 12); x = a * b; q = a + ' × ' + b; }
      else if (k === 3) { b = rnd(2, 12); x = rnd(2, 12 + lv); a = b * x; q = a + ' ÷ ' + b; }
      else { a = pick([10, 20, 25, 50, 5, 75]); b = pick([40, 60, 80, 120, 200, 360]); x = a * b / 100; q = a + '% of ' + b; }
      return mcq('<span class="gm-big">' + q + ' = ?</span>', x, numWrongs(x).concat([x + 1, x - 1]));
    },
    algebra: function () {
      var x = rnd(-6, 12), a = rnd(2, 9), b = rnd(-15, 20), k = rnd(0, 2), q, ans = x;
      var lin = function (m, c) { return (m === 1 ? '' : m) + 'x' + (c ? (c < 0 ? ' − ' + (-c) : ' + ' + c) : ''); };
      if (k === 0) q = lin(a, b) + ' = ' + (a * x + b);
      else if (k === 1) { var d = rnd(1, a - 1), r = (a - d) * x + b; q = lin(a, b) + ' = ' + lin(d, r); }   // ax + b = dx + r  →  x = (r − b) ÷ (a − d)
      else { var m = rnd(2, 5); ans = x * m; q = 'x ÷ ' + m + ' = ' + x; }
      return mcq('Solve: <b class="gm-mono" style="letter-spacing:.04em">' + q + '</b>', 'x = ' + ans, [ans + 1, ans - 1, -ans, ans * 2, ans + 2].map(function (v) { return 'x = ' + v; }));
    },
    graph: function () {
      var m = pick([-3, -2, -1, -0.5, 0.5, 1, 2, 3]), c = rnd(-4, 4), quad = Math.random() < 0.3, a = pick([1, -1]);
      var fmt = function (m, c) { var ms = m === 1 ? '' : m === -1 ? '−' : m === 0.5 ? '½' : m === -0.5 ? '−½' : String(m).replace('-', '−'); return 'y = ' + ms + 'x' + (c ? (c > 0 ? ' + ' + c : ' − ' + (-c)) : ''); };
      var fq = function (a, c) { return 'y = ' + (a < 0 ? '−' : '') + 'x²' + (c ? (c > 0 ? ' + ' + c : ' − ' + (-c)) : ''); };
      var right = quad ? fq(a, c) : fmt(m, c), wr = quad ? [fq(-a, c), fq(a, -c || 2), fmt(a * 2, c), fq(a, c + 2)] : [fmt(-m, c), fmt(m, -c || 3), fmt(m * 2 === m ? 3 : m * 2, c), fmt(m, c + 2), quad ? '' : fq(1, c)];
      var fn = quad ? function (x) { return a * x * x + c; } : function (x) { return m * x + c; };
      return mcq('Which equation matches the graph?', right, wr.filter(Boolean), { plot: fn }, function (k) { return quad ? fq(a, c + k + 2) : fmt(m, c - k - 2); });
    },
    genetics: function () {
      var T = pick(TRAITS), L = T[2], l = L.toLowerCase(), G = [L + L, L + l, l + l], p1 = pick(G), p2 = pick(G), kids = {};
      [0, 1].forEach(function (i) { [0, 1].forEach(function (j) { var x = [p1[i], p2[j]].sort().join(''); kids[x] = (kids[x] || 0) + 1; }); });
      var n = function (x) { return kids[x] || 0; }, dom = n(L + L) + n(L + l), rec = n(l + l), het = n(L + l), k = rnd(0, 2), pct = function (x) { return x * 25 + '%'; }, PCT = ['0%', '25%', '50%', '75%', '100%'];
      var cross = 'Cross: <b class="gm-mono">' + p1 + ' × ' + p2 + '</b><br><span class="small muted">' + L + ' = ' + T[0] + ' (dominant), ' + l + ' = ' + T[1] + ' (recessive). Draw a Punnett square in your head!</span><br>';
      if (k === 0) return mcq(cross + 'What percentage of the offspring will have <b>' + T[1] + '</b>?', pct(rec), PCT);
      if (k === 1) return mcq(cross + 'What percentage of the offspring will be <b>heterozygous (' + L + l + ')</b>?', pct(het), PCT);
      var d = gcd(dom, rec) || 1, r = rec === 0 ? 'all ' + T[0] : dom === 0 ? 'all ' + T[1] : dom / d + ' ' + T[0] + ' : ' + rec / d + ' ' + T[1];
      return mcq(cross + 'What is the expected ratio of phenotypes in the offspring?', r, ['3 ' + T[0] + ' : 1 ' + T[1], '1 ' + T[0] + ' : 1 ' + T[1], '1 ' + T[0] + ' : 3 ' + T[1], 'all ' + T[0], 'all ' + T[1]]);
    },
    magnify: function () {
      var a = pick([2, 5, 10, 20, 25, 50, 100]), M = pick([100, 200, 400, 500, 1000]), img = a * M / 1000, k = rnd(0, 2), mw = function (x) { return [x * 10, x / 10, x * 2, x / 2, x * 100]; };
      if (k === 0) return mcq('A drawing of a cell is <b>' + img + ' mm</b> long. The real cell is <b>' + a + ' µm</b> long. What is the magnification? <span class="small muted">(M = image ÷ actual; 1 mm = 1000 µm)</span>', '×' + M, mw(M).map(function (v) { return '×' + v; }));
      if (k === 1) return mcq('An image is <b>' + img + ' mm</b> long at a magnification of <b>×' + M + '</b>. How long is the real object? <span class="small muted">(actual = image ÷ M)</span>', a + ' µm', mw(a).map(function (v) { return nice(v) + ' µm'; }).concat([nice(a / 1000) + ' mm']));
      var mm = pick([0.5, 1.2, 2, 3.5, 0.08, 0.25]); return mcq('Convert <b>' + mm + ' mm</b> into micrometres (µm).', nice(mm * 1000) + ' µm', [mm * 100, mm * 10, mm * 10000, mm / 1000].map(function (v) { return nice(v) + ' µm'; }));
    },
    moles: function () {
      var s = pick(SUBST), k = rnd(0, 2), u = function (x, t) { return nice(x) + ' ' + t; };
      if (k === 0) { var n = pick([0.1, 0.2, 0.25, 0.5, 1, 2, 3]), m = nice(n * s[2]); return mcq('How many moles are in <b>' + m + ' g</b> of ' + s[0] + ', ' + s[1] + '? <span class="small muted">(Mr = ' + s[2] + '; n = m ÷ Mr)</span>', u(n, 'mol'), [n * 10, n / 10, n * 2, n / 2, m * s[2]].map(function (v) { return u(v, 'mol'); })); }
      if (k === 1) { var n2 = pick([0.1, 0.2, 0.5, 1.5, 2, 4]), m2 = n2 * s[2]; return mcq('What is the mass of <b>' + n2 + ' mol</b> of ' + s[0] + ', ' + s[1] + '? <span class="small muted">(Mr = ' + s[2] + '; m = n × Mr)</span>', u(m2, 'g'), [m2 * 10, m2 / 10, s[2] / n2, m2 + s[2], m2 / 2].map(function (v) { return u(v, 'g'); })); }
      var n3 = pick([0.1, 0.2, 0.5, 1, 2]), V = pick([0.1, 0.25, 0.5, 1, 2]); return mcq('<b>' + n3 + ' mol</b> of ' + s[0] + ' is dissolved to make <b>' + V + ' dm³</b> of solution. What is the concentration? <span class="small muted">(c = n ÷ V)</span>', u(n3 / V, 'mol/dm³'), [n3 * V, V / n3, n3 / V * 10, n3 / V / 10, n3 / V * 2].map(function (v) { return u(v, 'mol/dm³'); }));
    },
    circuits: function () {
      var k = rnd(0, 3), O = function (x) { return nice(x) + ' Ω'; }, A = function (x) { return nice(x) + ' A'; };
      if (k === 0) { var r = [pick([2, 3, 4, 5, 6, 10]), pick([2, 4, 6, 8, 12, 20])], three = Math.random() < 0.4; if (three) r.push(pick([1, 5, 10])); var t = r.reduce(function (a, b) { return a + b; }, 0);
        return mcq('Resistors of <b>' + r.join(' Ω, ') + ' Ω</b> are connected <b>in series</b>. What is the total resistance?', O(t), [t - r[0], r[0] * r[1] / (r[0] + r[1]), t * 2, t + 2, t - 1].map(O)); }
      if (k === 1) { var p = pick([[6, 3, 2], [4, 4, 2], [12, 6, 4], [10, 10, 5], [20, 5, 4], [6, 12, 4], [3, 6, 2], [2, 2, 1], [30, 60, 20]]);
        return mcq('A <b>' + p[0] + ' Ω</b> and a <b>' + p[1] + ' Ω</b> resistor are connected <b>in parallel</b>. What is the total resistance? <span class="small muted">(1/R = 1/R₁ + 1/R₂)</span>', O(p[2]), [p[0] + p[1], (p[0] + p[1]) / 2, p[2] * 2, Math.min(p[0], p[1])].map(O)); }
      if (k === 2) { var I = pick([0.5, 1, 2, 3]), r1 = pick([2, 3, 4, 5, 6]), r2 = pick([2, 4, 6, 10]), V = I * (r1 + r2);
        return mcq('A <b>' + V + ' V</b> battery is connected to a <b>' + r1 + ' Ω</b> and a <b>' + r2 + ' Ω</b> resistor <b>in series</b>. What is the current?', A(I), [V / r1, V / r2, I * 2, V * (r1 + r2), I / 2].map(A)); }
      var i1 = pick([0.2, 0.4, 0.5, 1, 1.5]), i2 = pick([0.3, 0.5, 0.8, 1, 2]);
      return mcq('Two branches are connected <b>in parallel</b>. One carries <b>' + i1 + ' A</b> and the other <b>' + i2 + ' A</b>. What current flows from the battery?', A(i1 + i2), [Math.abs(i1 - i2), i1 * i2, (i1 + i2) / 2, i1].map(A));
    }
  };

  /* ------------------------------------------------------------------ the games */
  var SUBJ = { bio: ['Biology', '🧬', '#16a34a'], chem: ['Chemistry', '⚗️', '#7c3aed'], phys: ['Physics', '⚡', '#2563eb'], math: ['Mathematics', '📐', '#ea580c'], sci: ['Science', '🔭', '#0891b2'] };
  var GAMES = [
    { id: 'organelles', subj: 'bio', icon: '🔬', title: 'Organelle Match', desc: 'Flip the cards and match each organelle to its job.', type: 'memory', pairs: ORGANELLES, stars: [300, 550, 750] },
    { id: 'systems', subj: 'bio', icon: '🫀', title: 'Body Systems Sort', desc: 'Send each organ to its body system before time runs out.', type: 'sort', set: SYSTEMS, stars: [100, 180, 260] },
    { id: 'foodchain', subj: 'bio', icon: '🦁', title: 'Food Chain Builder', desc: 'Put the living things in order, from producer to top predator.', type: 'order', seqs: CHAINS.map(function (c) { return ['Food chain ending with the ' + c[c.length - 1].toLowerCase() + ' (producer first)', c]; }), stars: [150, 300, 450] },
    { id: 'dna', subj: 'bio', icon: '🧬', title: 'DNA Base Pair Blitz', desc: 'A–T, G–C… and U in RNA. Pair the bases as fast as you can.', type: 'sprint', gen: 'dna', stars: [120, 220, 330] },
    { id: 'elements', subj: 'chem', icon: '🧪', title: 'Element Hunt', desc: 'Find each element on the periodic table against the clock.', type: 'ptable', stars: [100, 180, 260] },
    { id: 'balance', subj: 'chem', icon: '⚖️', title: 'Equation Balancer', desc: 'Change the numbers in front until every atom balances.', type: 'balance', stars: [200, 400, 600] },
    { id: 'ph', subj: 'chem', icon: '🍋', title: 'Acid or Alkali?', desc: 'Sort everyday substances by pH.', type: 'sort', set: PH, stars: [100, 180, 260] },
    { id: 'formulas', subj: 'chem', icon: '🧂', title: 'Ionic Formula Rush', desc: 'Balance the charges and pick the right formula.', type: 'sprint', gen: 'formula', stars: [100, 200, 300] },
    { id: 'launch', subj: 'phys', icon: '🎯', title: 'Projectile Launcher', desc: 'Set the angle and speed to land on the target.', type: 'launch', stars: [200, 350, 500] },
    { id: 'formula-rush', subj: 'phys', icon: '🔌', title: 'Physics Formula Rush', desc: 'V = IR, F = ma, P = VI… calculate quickly and correctly.', type: 'sprint', gen: 'physics', stars: [100, 200, 300] },
    { id: 'energy', subj: 'phys', icon: '🌞', title: 'Energy Resources Sort', desc: 'Renewable or non-renewable? Sort them all.', type: 'sort', set: ENERGY, stars: [90, 150, 210] },
    { id: 'units', subj: 'phys', icon: '📏', title: 'SI Units Match', desc: 'Match each quantity to its SI unit.', type: 'memory', pairs: UNITS, stars: [300, 550, 750] },
    { id: 'mental', subj: 'math', icon: '🧮', title: 'Mental Maths Sprint', desc: 'Add, subtract, multiply, divide and percentages. It gets harder!', type: 'sprint', gen: 'mental', stars: [150, 280, 420] },
    { id: 'algebra', subj: 'math', icon: '✖️', title: 'Solve for x', desc: 'Solve linear equations against the clock.', type: 'sprint', gen: 'algebra', stars: [100, 200, 300] },
    { id: 'graphs', subj: 'math', icon: '📈', title: 'Graph Match', desc: 'Look at the graph and choose its equation.', type: 'sprint', gen: 'graph', stars: [90, 180, 270] },
    { id: 'safety', subj: 'sci', icon: '🥽', title: 'Lab Safety Check', desc: 'Safe or unsafe? Keep the laboratory safe.', type: 'sort', set: SAFETY, stars: [90, 150, 210] },
    { id: 'states', subj: 'sci', icon: '🧊', title: 'Solid, Liquid or Gas?', desc: 'What state is each substance in at room temperature (25 °C)?', type: 'sort', set: STATES, stars: [100, 170, 240] },
    { id: 'sequences', subj: 'sci', icon: '🔢', title: 'Science Sequences', desc: 'Planets, the scientific method, mitosis, the EM spectrum… put them in order.', type: 'order', seqs: SEQS, stars: [150, 300, 450] },
    { id: 'cellmap', subj: 'bio', icon: '🌿', title: 'Plant Cell Explorer', desc: 'Click the right part of a plant cell: by name, then by what it does.', type: 'cellmap', stars: [100, 200, 300] },
    { id: 'enzyme', subj: 'bio', icon: '🔑', title: 'Enzyme Catcher', desc: 'Arcade! Catch the substrate that fits the active site. Dodge inhibitors and heat.', type: 'catcher', stars: [150, 300, 450] },
    { id: 'genetics', subj: 'bio', icon: '🧫', title: 'Punnett Square Challenge', desc: 'Work out the offspring of genetic crosses: percentages and ratios.', type: 'sprint', gen: 'genetics', stars: [100, 200, 300] },
    { id: 'magnify', subj: 'bio', icon: '🔍', title: 'Microscope Maths', desc: 'Magnification, real size and mm ↔ µm conversions.', type: 'sprint', gen: 'magnify', stars: [90, 180, 270] },
    { id: 'shells', subj: 'chem', icon: '⚛️', title: 'Electron Shell Builder', desc: 'Click the shells to place every electron: 2, 8, 8, 2…', type: 'shells', stars: [120, 250, 380] },
    { id: 'moles', subj: 'chem', icon: '🥄', title: 'Mole Calculator Race', desc: 'Moles, masses and concentrations: n = m ÷ Mr and c = n ÷ V.', type: 'sprint', gen: 'moles', stars: [90, 180, 270] },
    { id: 'circuits', subj: 'phys', icon: '💡', title: 'Circuit Solver', desc: 'Series and parallel: total resistance and current.', type: 'sprint', gen: 'circuits', stars: [100, 200, 300] },
    { id: 'density', subj: 'phys', icon: '🛟', title: 'Sink or Float?', desc: 'Water is 1.0 g/cm³. Will each material float or sink?', type: 'sort', set: DENSITY, stars: [100, 180, 260] },
    { id: 'numline', subj: 'math', icon: '📍', title: 'Number Line Ninja', desc: 'Place whole numbers, decimals, fractions, percentages and negatives on the line.', type: 'numline', stars: [150, 300, 450] },
    { id: 'scramble', subj: 'sci', icon: '🔤', title: 'Science Word Scramble', desc: 'Read the clue and unscramble the key word. Type or tap the tiles.', type: 'scramble', stars: [100, 220, 340] },
    { id: 'neuron', subj: 'bio', icon: '⚡', title: 'Fire the Neuron', desc: 'Neural signalling: you are the ion channels! Open Na⁺ and K⁺ channels at the right moment.', type: 'impulse', stars: [150, 300, 450] },
    { id: 'hormones', subj: 'bio', icon: '📨', title: 'Hormone Dispatch', desc: 'Chemical signalling: pick the gland, the hormone, the target organ and the receptor.', type: 'hormone', stars: [200, 400, 600] }];
  var BY = {}; GAMES.forEach(function (g) { BY[g.id] = g; });
  function daily() { return GAMES[dayNo(today()) % GAMES.length]; }

  var BADGES = [
    ['first', '🎉', 'First game', 'Finish your first game'], ['ten', '🔟', 'Regular', 'Finish 10 games'], ['fifty', '🏅', 'Dedicated', 'Finish 50 games'],
    ['perfect', '💯', 'Perfect', 'Finish a game with no mistakes'], ['combo10', '🔥', 'On fire', 'Get 10 right in a row'], ['star3', '⭐', 'Three stars', 'Earn 3 stars in a game'],
    ['streak3', '📅', '3-day streak', 'Play on 3 days in a row'], ['streak7', '🗓️', '7-day streak', 'Play on 7 days in a row'], ['daily', '☀️', 'Daily challenger', 'Finish a daily challenge'],
    ['allround', '🌍', 'All-rounder', 'Play a game in every subject'], ['bio', '🧬', 'Biologist', 'Earn a star in every Biology game'], ['chem', '⚗️', 'Chemist', 'Earn a star in every Chemistry game'],
    ['phys', '⚡', 'Physicist', 'Earn a star in every Physics game'], ['math', '📐', 'Mathematician', 'Earn a star in every Maths game'], ['sci', '🔭', 'Scientist', 'Earn a star in every Science game'],
    ['xp1000', '🚀', '1,000 XP', 'Reach 1,000 XP'], ['xp5000', '🌟', '5,000 XP', 'Reach 5,000 XP'], ['collector', '👑', 'Collector', 'Earn 3 stars in every game']];

  /* ------------------------------------------------------------------ styles */
  var css = document.createElement('style');
  css.textContent = '.gm{--gk:#4f46e5}.gm-hero{border-radius:24px;padding:20px 22px;color:#fff;background:radial-gradient(circle at 85% 20%,rgba(255,255,255,.25),transparent 40%),linear-gradient(120deg,#4f46e5,#db2777 55%,#f59e0b);box-shadow:0 14px 40px rgba(79,70,229,.25);display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center}@media(max-width:700px){.gm-hero{grid-template-columns:1fr}}.gm-hero h2{margin:0;color:#fff;font-size:1.5rem}.gm-hero p{margin:4px 0 0;opacity:.95}' +
    '.gm-lv{display:flex;gap:14px;align-items:center}.gm-ring{width:84px;height:84px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#fde047 calc(var(--p)*1%),rgba(255,255,255,.25) 0);flex:none}.gm-ring b{width:66px;height:66px;border-radius:50%;display:grid;place-items:center;background:#312e81;font-size:1.6rem;color:#fff}.gm-stats{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.gm-stats span{background:rgba(255,255,255,.18);border-radius:999px;padding:4px 10px;font-weight:700;font-size:.9rem}' +
    '.gm-daily{margin:14px 0;border-radius:18px;padding:14px 16px;background:linear-gradient(120deg,#fef3c7,#fde68a);border:1px solid #f59e0b;display:flex;gap:12px;align-items:center;flex-wrap:wrap;color:#78350f}.gm-daily b{font-size:1.05rem}.gm-daily .btn{margin-left:auto}' +
    '.gm-chips{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}.gm-chips button{border:2px solid var(--line,#e2e8f0);background:var(--card,#fff);border-radius:999px;padding:7px 14px;font:inherit;font-weight:700;cursor:pointer;color:inherit}.gm-chips button[aria-pressed=true]{background:#312e81;color:#fff;border-color:#312e81}' +
    '.gm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}.gm-card{position:relative;display:flex;flex-direction:column;gap:6px;text-align:left;border-radius:20px;padding:16px;background:var(--card,#fff);border:1px solid var(--line,#e2e8f0);border-top:6px solid var(--gk);box-shadow:0 6px 18px rgba(15,23,42,.07);cursor:pointer;font:inherit;color:inherit;transition:transform .15s,box-shadow .15s}.gm-card:hover,.gm-card:focus-visible{transform:translateY(-3px);box-shadow:0 12px 26px rgba(15,23,42,.12);outline:none}.gm-card .ic{font-size:2.1rem}.gm-card h3{margin:0;font-size:1.08rem}.gm-card p{margin:0;color:#64748b;font-size:.9rem;flex:1}.gm-card .meta{display:flex;justify-content:space-between;align-items:center;font-size:.85rem;color:#475569}.gm-card .sj{position:absolute;top:12px;right:12px;font-size:.75rem;font-weight:800;color:var(--gk);text-transform:uppercase;letter-spacing:.05em}.gm-card .dbl{position:absolute;top:-10px;left:12px;background:#f59e0b;color:#fff;border-radius:999px;padding:2px 8px;font-size:.72rem;font-weight:800}' +
    '.gm-stars{color:#f59e0b;letter-spacing:1px}.gm-stars i{color:#cbd5e1;font-style:normal}.gm-badges{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}.gm-badge{border-radius:14px;padding:10px;border:1px solid var(--line,#e2e8f0);background:var(--card,#fff);text-align:center;font-size:.85rem}.gm-badge span{font-size:1.7rem;display:block}.gm-badge.off{opacity:.38;filter:grayscale(1)}.gm-badge b{display:block}' +
    '.gm-board{width:100%;border-collapse:collapse}.gm-board td,.gm-board th{padding:6px 8px;border-bottom:1px solid var(--line,#e2e8f0);text-align:left}.gm-board tr.me{background:#eef2ff;font-weight:700}' +
    '.gm-play{max-width:880px;margin:0 auto;min-width:0}.gm,.gm-stage{min-width:0;max-width:100%;box-sizing:border-box}.gm-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 10px}.gm-bar .pill{background:var(--card,#fff);border:1px solid var(--line,#e2e8f0);border-radius:999px;padding:6px 12px;font-weight:800}.gm-bar .pill.t{color:#b91c1c}.gm-time{height:10px;border-radius:6px;background:#e2e8f0;overflow:hidden;flex:1 1 160px}.gm-time i{display:block;height:100%;background:linear-gradient(90deg,#22c55e,#eab308,#ef4444);transition:width .25s linear}' +
    '.gm-stage{border-radius:22px;padding:18px;background:var(--card,#fff);border:1px solid var(--line,#e2e8f0);box-shadow:0 8px 24px rgba(15,23,42,.07);min-height:300px}.gm-q{font-size:1.2rem;margin:0 0 12px;line-height:1.5}.gm-big{font-size:2rem;font-weight:800}.gm-mono{font-family:ui-monospace,Menlo,Consolas,monospace;letter-spacing:.18em}' +
    '.gm-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:560px){.gm-opts{grid-template-columns:1fr}}.gm-opt{border:2px solid var(--line,#cbd5e1);border-radius:16px;padding:14px;font:inherit;font-size:1.1rem;font-weight:700;background:#f8fafc;cursor:pointer;color:#172033;text-align:left;display:flex;gap:10px;align-items:center}.gm-opt kbd{background:#e2e8f0;border-radius:6px;padding:0 6px;font-size:.8rem}.gm-opt:hover,.gm-opt:focus-visible{border-color:#4f46e5;background:#eef2ff;outline:none}.gm-opt.ok{border-color:#16a34a;background:#dcfce7}.gm-opt.no{border-color:#dc2626;background:#fee2e2}' +
    '.gm-fb{min-height:1.6em;font-weight:800;margin:10px 0 0}.gm-fb.ok{color:#15803d}.gm-fb.no{color:#b91c1c}.gm-pop{animation:gmpop .35s}@keyframes gmpop{0%{transform:scale(1)}40%{transform:scale(1.06)}100%{transform:scale(1)}}.gm-shake{animation:gmshake .35s}@keyframes gmshake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}' +
    '.gm-mem{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}@media(max-width:560px){.gm-mem{grid-template-columns:repeat(3,minmax(0,1fr))}}.gm-tile{min-height:92px;border-radius:14px;border:0;font:inherit;font-weight:700;cursor:pointer;padding:8px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-size:1.6rem}.gm-tile.up{background:#fff;color:#1e293b;border:2px solid #a5b4fc;font-size:.92rem}.gm-tile.done{background:#dcfce7;color:#14532d;border:2px solid #22c55e;font-size:.92rem;cursor:default}' +
    '.gm-item{font-size:1.5rem;font-weight:800;text-align:center;margin:14px 0 18px;padding:18px;border-radius:16px;background:#f1f5f9}.gm-bins{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}.gm-bin{border:3px dashed #94a3b8;border-radius:16px;padding:16px 10px;font:inherit;font-weight:800;cursor:pointer;background:#fff;color:#1e293b;min-height:80px}.gm-bin:hover,.gm-bin:focus-visible{border-color:#4f46e5;background:#eef2ff;outline:none}' +
    '.gm-order{list-style:none;padding:0;margin:0;display:grid;gap:6px}.gm-order li{display:flex;gap:8px;align-items:center;border:2px solid #e2e8f0;border-radius:12px;padding:8px 10px;background:#fff;font-weight:700}.gm-order li.ok{border-color:#22c55e;background:#dcfce7}.gm-order li.no{border-color:#ef4444;background:#fee2e2}.gm-order li span{flex:1}.gm-order button{border:1px solid #cbd5e1;background:#f8fafc;border-radius:8px;padding:4px 9px;cursor:pointer;font:inherit}' +
    '.gm-ptw{overflow-x:auto;padding-bottom:4px}.gm-pt{display:grid;grid-template-columns:repeat(18,minmax(0,1fr));gap:3px;min-width:500px}@media(min-width:561px){.gm-ptw .gm-hint{display:none}}.gm-el{aspect-ratio:1;border-radius:6px;border:1px solid #cbd5e1;background:#f8fafc;font:inherit;font-weight:800;font-size:clamp(.55rem,1.6vw,.95rem);cursor:pointer;padding:0;color:#1e293b}.gm-el:hover,.gm-el:focus-visible{background:#eef2ff;border-color:#4f46e5;outline:none}.gm-el.ok{background:#22c55e;color:#fff}.gm-el.no{background:#ef4444;color:#fff}.gm-el.g1{background:#fee2e2}.gm-el.g2{background:#ffedd5}.gm-el.tm{background:#e0f2fe}.gm-el.g18{background:#ede9fe}.gm-el.hal{background:#dcfce7}' +
    '.gm-eq{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;font-size:1.25rem;font-weight:800;margin:10px 0}.gm-co{display:inline-flex;flex-direction:column;align-items:center;gap:2px}.gm-co button{border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;width:34px;cursor:pointer;font:inherit;line-height:1.2}.gm-co output{font-size:1.4rem;color:#4f46e5;min-width:1.4em;text-align:center}.gm-atoms{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:10px 0}.gm-atoms span{border-radius:999px;padding:4px 12px;font-weight:700;border:2px solid #e2e8f0}.gm-atoms span.ok{border-color:#22c55e;background:#dcfce7}.gm-atoms span.no{border-color:#f59e0b;background:#fef3c7}' +
    '.gm-cv{width:100%;max-width:820px;display:block;margin:0 auto;border-radius:14px;background:linear-gradient(#e0f2fe,#f0f9ff 70%,#bbf7d0 70%);touch-action:none}.gm-ctl{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin:10px 0}.gm-ctl label{display:grid;gap:4px;font-weight:700}.gm-ctl input[type=range]{width:100%}' +
    '.gm-end{text-align:center;padding:10px}.gm-end .bigstars{font-size:3rem;letter-spacing:6px}.gm-end .xp{display:inline-block;margin:8px 0;background:#312e81;color:#fff;border-radius:999px;padding:6px 16px;font-weight:800}.gm-end .newb{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:10px 0}.gm-end .newb span{background:#fef3c7;border:1px solid #f59e0b;border-radius:999px;padding:4px 12px;font-weight:700}.gm-acts{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px}' +
    '.gm-cellw{max-width:640px;margin:0 auto}.gm-cell{width:100%;height:auto;display:block}.gm-cell [data-part]{cursor:pointer;outline:none}.gm-cell [data-part]:hover,.gm-cell [data-part]:focus-visible{filter:brightness(1.12) drop-shadow(0 0 4px #4f46e5)}.gm-cell .gm-glow{filter:drop-shadow(0 0 6px #facc15) drop-shadow(0 0 10px #facc15)}.gm-cv.gm-dark{background:#0f172a;cursor:none}' +
    '.gm-atomw{display:flex;gap:16px;flex-wrap:wrap;align-items:center;justify-content:center}.gm-atom{width:min(300px,100%);height:auto}.gm-atom [data-sh]{cursor:pointer}.gm-atom [data-sh]:hover{stroke-opacity:.6}.gm-shctl{display:grid;gap:8px}.gm-shctl div{display:flex;align-items:center;gap:8px}.gm-shctl span{width:64px;font-weight:700}.gm-shctl output{min-width:2ch;text-align:center;font-weight:800;font-size:1.2rem}.gm-shctl div button{width:38px;height:38px;border-radius:10px;border:2px solid #cbd5e1;background:#fff;font:inherit;font-weight:800;font-size:1.2rem;cursor:pointer}' +
    '.gm-nl{width:100%;height:auto;display:block;cursor:crosshair;margin:8px 0}.gm-big{font-size:1.6rem}.gm-slots{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:12px 0}.gm-slots span{width:38px;height:46px;border-bottom:4px solid #4f46e5;display:grid;place-items:center;font-size:1.5rem;font-weight:800}.gm-slots span.h{color:#b45309}' +
    '.gm-tiles{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:8px 0 12px}.gm-tiles button{width:46px;height:52px;border-radius:12px;border:0;background:linear-gradient(#fde68a,#f59e0b);box-shadow:0 4px 0 #b45309;font:inherit;font-size:1.4rem;font-weight:900;color:#422006;cursor:pointer}.gm-tiles button:disabled{opacity:.25;box-shadow:none;cursor:default}' +
    '.gm-ion svg{width:100%;max-width:420px;height:auto;display:block;margin:6px auto 0}.gm-hw{display:grid;grid-template-columns:minmax(0,260px) minmax(0,1fr);gap:14px;align-items:start}@media(max-width:600px){.gm-hw{grid-template-columns:1fr}.gm-bodyw{max-width:240px;margin:0 auto}}' +
    '.gm-body{width:100%;height:auto;display:block}.gm-body [data-o]{cursor:pointer;outline:none}.gm-body [data-o]:hover,.gm-body [data-o]:focus-visible{filter:drop-shadow(0 0 5px #4f46e5) brightness(1.1)}.gm-path{margin:0 0 10px;padding-left:1.2em;color:#15803d;font-weight:700}' +
    '.gm-confetti{position:fixed;inset:0;pointer-events:none;z-index:60}.gm-sec{margin-top:22px}.gm-sec h2{margin:0 0 10px}' +
    '@media (prefers-reduced-motion:reduce){.gm-pop,.gm-shake,.gm-card{animation:none!important;transition:none!important}}';
  document.head.appendChild(css);

  /* ------------------------------------------------------------------ sounds (tiny, off by default on first visit until the player clicks) */
  var AC = null, SOUND = true; try { SOUND = localStorage.getItem('bv-games-sound') !== '0'; } catch (e) {}
  function beep(ok) { if (!SOUND) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); var o = AC.createOscillator(), g = AC.createGain(); o.connect(g); g.connect(AC.destination); o.frequency.value = ok ? 660 : 180; o.type = ok ? 'sine' : 'square'; g.gain.setValueAtTime(0.08, AC.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + (ok ? 0.18 : 0.25)); o.start(); o.stop(AC.currentTime + 0.3); } catch (e) {} }
  function confetti() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var c = document.createElement('canvas'), g = c.getContext('2d'), W = c.width = innerWidth, H = c.height = innerHeight, parts = [], t = 0; c.className = 'gm-confetti'; document.body.appendChild(c);
    for (var i = 0; i < 120; i++) parts.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.4, v: 2 + Math.random() * 4, s: 4 + Math.random() * 6, c: pick(['#f59e0b', '#ec4899', '#22c55e', '#3b82f6', '#a855f7']), r: Math.random() * 6 });
    (function f() { g.clearRect(0, 0, W, H); parts.forEach(function (p) { p.y += p.v; p.x += Math.sin((t + p.r) / 10); g.fillStyle = p.c; g.fillRect(p.x, p.y, p.s, p.s * 0.6); }); t++; if (t < 160) requestAnimationFrame(f); else c.remove(); })();
  }

  /* ------------------------------------------------------------------ hub */
  var FILTER = 'all';
  function starsHtml(n) { n = n || 0; return '<span class="gm-stars" aria-label="' + n + ' of 3 stars">' + '★'.repeat(n) + '<i>' + '★'.repeat(3 - n) + '</i></span>'; }
  function hub() {
    stopAll(); var L = level(P.xp), st = streak(), d = daily(), done = P.days.indexOf(today()) >= 0;
    var nStars = Object.keys(P.stars).reduce(function (a, k) { return a + (P.stars[k] || 0); }, 0);
    app.innerHTML = '<div class="gm">' +
      '<section class="gm-hero"><div><p class="label" style="color:#fff;opacity:.85;margin:0">VistaEd games</p><h1 style="margin:0;color:#fff;font-size:1.6rem">Games: play, learn and level up</h1><p>Biology, Chemistry, Physics, Maths and Science games. Earn XP, collect stars and badges, and keep your streak going.</p>' +
        '<div class="gm-stats"><span>🔥 ' + st + '-day streak</span><span>⭐ ' + nStars + ' / ' + GAMES.length * 3 + ' stars</span><span>🏅 ' + P.badges.length + ' / ' + BADGES.length + ' badges</span><span>🎮 ' + (P.total || 0) + ' games</span></div></div>' +
        '<div class="gm-lv"><div class="gm-ring" style="--p:' + L.pct + '" title="' + (P.xp - L.from) + ' of ' + (L.to - L.from) + ' XP to the next level"><b>' + L.n + '</b></div><div><b style="font-size:1.1rem">' + E(L.title) + '</b><br>' + P.xp.toLocaleString() + ' XP<br><span class="small" style="opacity:.9">' + (L.to - P.xp) + ' XP to level ' + (L.n + 1) + '</span></div></div></section>' +
      '<div class="gm-daily"><span style="font-size:2rem">☀️</span><div><b>Daily challenge: ' + E(d.title) + '</b><br><span class="small">Double XP today' + (done ? '' : ' · play any game today to keep your streak') + '</span></div><button class="btn main" type="button" data-play="' + d.id + '">Play ×2 XP</button></div>' +
      '<div class="gm-chips" role="group" aria-label="Subject">' + [['all', 'All games', '🎮']].concat(Object.keys(SUBJ).map(function (k) { return [k, SUBJ[k][0], SUBJ[k][1]]; })).map(function (c) { return '<button type="button" data-f="' + c[0] + '" aria-pressed="' + (FILTER === c[0]) + '">' + c[2] + ' ' + c[1] + '</button>'; }).join('') +
        '<button type="button" id="gm-snd" aria-pressed="' + SOUND + '" style="margin-left:auto">' + (SOUND ? '🔊 Sound on' : '🔇 Sound off') + '</button></div>' +
      '<div class="gm-grid">' + GAMES.filter(function (g) { return FILTER === 'all' || g.subj === FILTER; }).map(function (g) {
        var s = SUBJ[g.subj]; return '<button type="button" class="gm-card" style="--gk:' + s[2] + '" data-play="' + g.id + '">' + (g === d ? '<span class="dbl">×2 XP today</span>' : '') + '<span class="sj">' + s[0] + '</span><span class="ic" aria-hidden="true">' + g.icon + '</span><h3>' + E(g.title) + '</h3><p>' + E(g.desc) + '</p>' +
          '<span class="meta">' + starsHtml(P.stars[g.id]) + '<span>' + (P.best[g.id] ? 'Best ' + P.best[g.id] : 'New') + '</span></span></button>'; }).join('') + '</div>' +
      '<section class="gm-sec"><h2>🏅 Badges</h2><div class="gm-badges">' + BADGES.map(function (b) { var on = P.badges.indexOf(b[0]) >= 0; return '<div class="gm-badge' + (on ? '' : ' off') + '" title="' + E(b[3]) + '"><span aria-hidden="true">' + b[1] + '</span><b>' + E(b[2]) + '</b>' + E(b[3]) + (on ? '' : '<span class="sr-only"> (not yet earned)</span>') + '</div>'; }).join('') + '</div></section>' +
      '<section class="gm-sec" id="gm-lb"></section>' +
      '<p class="small muted gm-sec">' + (ME ? (CLOUD ? '☁️ Your XP, stars and badges are saved to your VistaEd account.' : 'Your progress is kept on this device.') : 'Your progress is kept on this device. <a href="/login/?next=/games/">Log in</a> to save it to your account and join your class leaderboard.') + ' Games by George Apidi.</p></div>';
    app.querySelectorAll('[data-play]').forEach(function (b) { b.onclick = function () { location.hash = 'play/' + b.getAttribute('data-play'); }; });
    app.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { FILTER = b.getAttribute('data-f'); hub(); var x = app.querySelector('[data-f="' + FILTER + '"]'); if (x) x.focus(); }; });
    app.querySelector('#gm-snd').onclick = function () { SOUND = !SOUND; try { localStorage.setItem('bv-games-sound', SOUND ? '1' : '0'); } catch (e) {} hub(); app.querySelector('#gm-snd').focus(); };
    board();
  }
  function board() {
    var box = app.querySelector('#gm-lb'); if (!box || !CLOUD) return;
    S.db.rpc('game_board').then(function (r) {
      if (r.error || !(r.data || []).length) return;
      box.innerHTML = '<h2>🏆 Class leaderboard</h2><p class="small muted">Students in your classes, by XP. Only first names and initials are shown.</p><table class="gm-board"><thead><tr><th>#</th><th>Player</th><th>Level</th><th>XP</th><th>Stars</th></tr></thead><tbody>' +
        r.data.map(function (x) { return '<tr' + (x.me ? ' class="me"' : '') + '><td>' + x.rank + '</td><td>' + E(x.name) + (x.me ? ' (you)' : '') + '</td><td>' + level(x.xp).n + '</td><td>' + Number(x.xp).toLocaleString() + '</td><td>⭐ ' + x.stars + '</td></tr>'; }).join('') + '</tbody></table>';
    });
  }

  /* ------------------------------------------------------------------ playing: the frame every game uses */
  var RUN = null;   // the game being played: {g, score, right, wrong, combo, best combo, timer}
  function stopAll() { if (RUN) { clearInterval(RUN.tick); if (RUN.raf) cancelAnimationFrame(RUN.raf); RUN = null; } }
  document.addEventListener('keydown', function (e) { if (RUN && RUN.keys && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '')) RUN.keys(e); });
  function play(id) {
    stopAll(); var g = BY[id]; if (!g) { location.hash = ''; return; }
    var s = SUBJ[g.subj];
    app.innerHTML = '<div class="gm gm-play"><p><a href="#" id="gm-back">← All games</a></p><h2 style="margin:0 0 8px">' + g.icon + ' ' + E(g.title) + (g === daily() ? ' <span class="small" style="background:#f59e0b;color:#fff;border-radius:999px;padding:2px 8px">×2 XP today</span>' : '') + '</h2>' +
      '<div class="gm-bar"><span class="pill" id="gm-sc">Score 0</span><span class="pill" id="gm-cb" hidden>🔥 ×1</span><span class="gm-time" id="gm-tw" hidden><i id="gm-t" style="width:100%"></i></span><span class="pill t" id="gm-tl" hidden></span></div>' +
      '<div class="gm-stage" id="gm-stage" style="border-top:6px solid ' + s[2] + '"></div><p class="sr-only" aria-live="polite" id="gm-live"></p></div>';
    app.querySelector('#gm-back').onclick = function (e) { e.preventDefault(); location.hash = ''; };
    RUN = { g: g, score: 0, right: 0, wrong: 0, combo: 0, maxCombo: 0, keys: function () {} };
    var stage = app.querySelector('#gm-stage');
    ({ sprint: sprint, memory: memory, sort: sorter, order: order, ptable: ptable, balance: balance, launch: launch, cellmap: cellmap, catcher: catcher, shells: shells, numline: numline, scramble: scramble, impulse: impulse, hormone: hormone })[g.type](g, stage);
    window.scrollTo(0, 0);
  }
  function sayLive(t) { var l = app.querySelector('#gm-live'); if (l) l.textContent = t; }
  function addScore(ok, base) {
    if (!RUN) return 0;
    if (ok) { RUN.right++; RUN.combo++; RUN.maxCombo = Math.max(RUN.maxCombo, RUN.combo); var mult = Math.min(4, 1 + Math.floor(RUN.combo / 3)), pts = (base || 10) * mult; RUN.score += pts; beep(true); }
    else { RUN.wrong++; RUN.combo = 0; beep(false); }
    var sc = app.querySelector('#gm-sc'), cb = app.querySelector('#gm-cb');
    if (sc) { sc.textContent = 'Score ' + RUN.score; sc.classList.remove('gm-pop'); void sc.offsetWidth; sc.classList.add('gm-pop'); }
    if (cb) { var m = Math.min(4, 1 + Math.floor(RUN.combo / 3)); cb.hidden = m < 2; cb.textContent = '🔥 ×' + m + ' combo'; }
    return ok ? pts : 0;
  }
  function timer(sec, onEnd) {
    var tw = app.querySelector('#gm-tw'), t = app.querySelector('#gm-t'), tl = app.querySelector('#gm-tl'), left = sec, end = Date.now() + sec * 1000;
    tw.hidden = false; tl.hidden = false; tl.textContent = sec + ' s';
    RUN.tick = setInterval(function () { if (!RUN) return; left = Math.max(0, (end - Date.now()) / 1000); t.style.width = (left / sec * 100) + '%'; tl.textContent = Math.ceil(left) + ' s'; if (left <= 0) { clearInterval(RUN.tick); onEnd(); } }, 200);
    return { add: function (s) { end += s * 1000; } };
  }

  /* --- sprint: multiple-choice questions for 60 seconds */
  function sprint(g, stage) {
    var lv = 1, cur = null, lock = false;
    function next() {
      if (!RUN) return; lv = 1 + Math.floor(RUN.right / 5); cur = GEN[g.gen](lv); lock = false;
      stage.innerHTML = '<p class="gm-q">' + cur.q + '</p>' + (cur.plot ? '<canvas class="gm-cv" id="gm-plot" width="420" height="300" style="max-width:420px;background:#fff;border:1px solid #e2e8f0;margin-bottom:12px" role="img" aria-label="A graph of the equation"></canvas>' : '') +
        '<div class="gm-opts">' + cur.options.map(function (o, i) { return '<button type="button" class="gm-opt' + (cur.mono ? ' gm-mono' : '') + '" data-o="' + i + '"><kbd>' + (i + 1) + '</kbd>' + o + '</button>'; }).join('') + '</div><p class="gm-fb" id="gm-fb" aria-live="polite"></p>';
      if (cur.plot) drawPlot(stage.querySelector('#gm-plot'), cur.plot);
      stage.querySelectorAll('[data-o]').forEach(function (b) { b.onclick = function () { answer(+b.getAttribute('data-o')); }; });
      var f = stage.querySelector('[data-o]'); if (f && document.activeElement === document.body) f.focus({ preventScroll: true });
    }
    function answer(i) {
      if (lock || !RUN) return; lock = true; var ok = i === cur.a, bs = stage.querySelectorAll('[data-o]'), fb = stage.querySelector('#gm-fb');
      bs[cur.a].classList.add('ok'); if (!ok) { bs[i].classList.add('no'); stage.classList.add('gm-shake'); setTimeout(function () { stage.classList.remove('gm-shake'); }, 400); }
      var pts = addScore(ok, 10 + 2 * Math.min(lv, 5)); fb.className = 'gm-fb ' + (ok ? 'ok' : 'no'); fb.innerHTML = ok ? '✓ +' + pts : '✗ The answer was ' + bs[cur.a].innerHTML.replace(/<kbd>\d<\/kbd>/, '');
      sayLive(ok ? 'Correct' : 'Not quite'); setTimeout(next, ok ? 450 : 1300);
    }
    RUN.keys = function (e) { var n = +e.key; if (n >= 1 && n <= 4 && cur && !e.target.closest('input,textarea')) answer(n - 1); };
    timer(60, function () { finish(); }); next();
  }
  function drawPlot(cv, fn) {
    var g = cv.getContext('2d'), W = cv.width, H = cv.height, X = function (x) { return W / 2 + x * W / 16; }, Y = function (y) { return H / 2 - y * H / 16; };
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.strokeStyle = '#e2e8f0'; g.lineWidth = 1;
    for (var i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(X(i), 0); g.lineTo(X(i), H); g.stroke(); g.beginPath(); g.moveTo(0, Y(i)); g.lineTo(W, Y(i)); g.stroke(); }
    g.strokeStyle = '#334155'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(W, Y(0)); g.moveTo(X(0), 0); g.lineTo(X(0), H); g.stroke();
    g.fillStyle = '#334155'; g.font = '12px sans-serif'; [-6, -4, -2, 2, 4, 6].forEach(function (v) { g.fillText(v, X(v) - 6, Y(0) + 14); g.fillText(v, X(0) + 4, Y(v) + 4); }); g.fillText('x', W - 12, Y(0) - 6); g.fillText('y', X(0) + 6, 12);
    g.strokeStyle = '#db2777'; g.lineWidth = 3; g.beginPath(); var first = true;
    for (var x = -8; x <= 8; x += 0.05) { var y = fn(x); if (Math.abs(y) > 20) { first = true; continue; } if (first) { g.moveTo(X(x), Y(y)); first = false; } else g.lineTo(X(x), Y(y)); }
    g.stroke();
  }

  /* --- memory: flip pairs */
  function memory(g, stage) {
    var pairs = shuffle(g.pairs).slice(0, 6), cards = shuffle([].concat.apply([], pairs.map(function (p, i) { return [{ t: p[0], k: i, side: 'a' }, { t: p[1], k: i, side: 'b' }]; }))), open = [], moves = 0, found = 0, lock = false, t0 = Date.now();
    stage.innerHTML = '<p class="small muted" style="margin-top:0">Turn over two cards. Keep them if they match. Fewer turns and less time earn more points.</p><div class="gm-mem">' + cards.map(function (c, i) { return '<button type="button" class="gm-tile" data-c="' + i + '" aria-label="Card ' + (i + 1) + ', face down">?</button>'; }).join('') + '</div><p class="gm-fb" id="gm-fb" aria-live="polite"></p>';
    var bs = stage.querySelectorAll('[data-c]');
    bs.forEach(function (b) { b.onclick = function () {
      var i = +b.getAttribute('data-c'), c = cards[i]; if (lock || c.done || open.indexOf(i) >= 0) return;
      b.classList.add('up'); b.textContent = c.t; b.setAttribute('aria-label', c.t); open.push(i);
      if (open.length === 2) { moves++; lock = true; var a = cards[open[0]], d = cards[open[1]];
        if (a.k === d.k && a.side !== d.side) { a.done = d.done = true; found++; open.forEach(function (j) { bs[j].classList.add('done'); }); addScore(true, 20); sayLive('Match: ' + a.t + ' and ' + d.t); open = []; lock = false;
          if (found === pairs.length) { var secs = (Date.now() - t0) / 1000; RUN.score += Math.max(0, Math.round(300 - secs * 2 - (moves - pairs.length) * 15)); RUN.wrong = Math.max(0, moves - pairs.length); RUN.memory = true; setTimeout(finish, 600); } }
        else { beep(false); RUN.combo = 0; setTimeout(function () { open.forEach(function (j) { bs[j].classList.remove('up'); bs[j].textContent = '?'; bs[j].setAttribute('aria-label', 'Card ' + (j + 1) + ', face down'); }); open = []; lock = false; }, 900); } }
    }; });
  }

  /* --- sort: one item at a time into the right group */
  function sorter(g, stage) {
    var items = shuffle(g.set.items), i = 0, lock = false;
    function show() {
      if (!RUN) return; if (i >= items.length) { RUN.score += 30; return finish(); }
      var it = items[i];
      stage.innerHTML = '<p class="small muted" style="margin-top:0">Item ' + (i + 1) + ' of ' + items.length + ' · click the right group or press its number key</p><div class="gm-item gm-pop">' + E(it[0]) + '</div><div class="gm-bins">' + g.set.bins.map(function (b, k) { return '<button type="button" class="gm-bin" data-b="' + k + '"><kbd>' + (k + 1) + '</kbd> ' + E(b) + '</button>'; }).join('') + '</div><p class="gm-fb" id="gm-fb" aria-live="polite"></p>';
      stage.querySelectorAll('[data-b]').forEach(function (b) { b.onclick = function () { choose(+b.getAttribute('data-b')); }; }); lock = false;
    }
    function choose(k) {
      if (lock || !RUN) return; lock = true; var it = items[i], ok = k === it[1], fb = stage.querySelector('#gm-fb'), bs = stage.querySelectorAll('[data-b]');
      bs[it[1]].style.borderColor = '#16a34a'; bs[it[1]].style.background = '#dcfce7'; if (!ok) { bs[k].style.borderColor = '#dc2626'; bs[k].style.background = '#fee2e2'; }
      var pts = addScore(ok, 10); fb.className = 'gm-fb ' + (ok ? 'ok' : 'no'); fb.textContent = ok ? '✓ +' + pts : '✗ ' + it[0] + ' → ' + g.set.bins[it[1]];
      i++; setTimeout(show, ok ? 450 : 1300);
    }
    RUN.keys = function (e) { var n = +e.key; if (n >= 1 && n <= g.set.bins.length) choose(n - 1); };
    timer(90, function () { finish(); }); show();
  }

  /* --- order: three rounds of putting things in order */
  function order(g, stage) {
    var rounds = shuffle(g.seqs).slice(0, 3), r = 0;
    function round() {
      if (!RUN) return; if (r >= rounds.length) return finish();
      var name = rounds[r][0], right = rounds[r][1], cur = shuffle(right); while (cur.join() === right.join()) cur = shuffle(right);
      var tries = 0;
      function paint(mark) {
        stage.innerHTML = '<p class="small muted" style="margin-top:0">Round ' + (r + 1) + ' of ' + rounds.length + '</p><p class="gm-q"><b>' + E(name) + '</b></p><ol class="gm-order">' + cur.map(function (t, k) {
          return '<li class="' + (mark ? (t === right[k] ? 'ok' : 'no') : '') + '"><b>' + (k + 1) + '.</b><span>' + E(t) + '</span><button type="button" data-u="' + k + '" aria-label="Move ' + E(t) + ' up"' + (k ? '' : ' disabled') + '>▲</button><button type="button" data-d="' + k + '" aria-label="Move ' + E(t) + ' down"' + (k < cur.length - 1 ? '' : ' disabled') + '>▼</button></li>'; }).join('') +
          '</ol><div class="gm-acts"><button class="btn main" type="button" id="gm-chk">Check the order</button></div><p class="gm-fb" id="gm-fb" aria-live="polite"></p>';
        stage.querySelectorAll('[data-u]').forEach(function (b) { b.onclick = function () { var k = +b.getAttribute('data-u'); var t = cur[k - 1]; cur[k - 1] = cur[k]; cur[k] = t; paint(); var x = stage.querySelector('[data-u="' + (k - 1) + '"]') || stage.querySelector('[data-d="' + (k - 1) + '"]'); if (x) x.focus(); }; });
        stage.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { var k = +b.getAttribute('data-d'); var t = cur[k + 1]; cur[k + 1] = cur[k]; cur[k] = t; paint(); var x = stage.querySelector('[data-d="' + (k + 1) + '"]') || stage.querySelector('[data-u="' + (k + 1) + '"]'); if (x) x.focus(); }; });
        stage.querySelector('#gm-chk').onclick = function () {
          tries++; var n = cur.filter(function (t, k) { return t === right[k]; }).length, all = n === right.length; paint(true);
          var fb = stage.querySelector('#gm-fb');
          if (all) { var pts = addScore(true, Math.max(20, 60 - (tries - 1) * 20) + right.length * 5); fb.className = 'gm-fb ok'; fb.textContent = '✓ Perfect order! +' + pts; stage.querySelector('#gm-chk').disabled = true; r++; setTimeout(round, 1200); }
          else { addScore(false); fb.className = 'gm-fb no'; fb.textContent = n + ' of ' + right.length + ' in the right place. Green ones are correct: move the red ones.' + (tries >= 3 ? ' (Last try gives fewer points.)' : ''); }
        };
      }
      paint();
    }
    round();
  }

  /* --- ptable: find the element */
  function ptable(g, stage) {
    var target = null, lock = false;
    var cls = function (e) { return e[3] === 1 && e[0] !== 'H' ? 'g1' : e[3] === 2 ? 'g2' : e[3] >= 3 && e[3] <= 12 ? 'tm' : e[3] === 18 ? 'g18' : e[3] === 17 ? 'hal' : ''; };
    stage.innerHTML = '<p class="gm-q" id="gm-ask"></p><div class="gm-ptw"><p class="small muted gm-hint" style="margin:0 0 4px">↔ Swipe sideways to see the whole table.</p><div class="gm-pt" role="grid" aria-label="Periodic table, periods 1 to 4">' + ELEMENTS.map(function (e, i) { return '<button type="button" class="gm-el ' + cls(e) + '" data-e="' + i + '" style="grid-row:' + e[2] + ';grid-column:' + e[3] + '" aria-label="' + e[1] + '">' + e[0] + '</button>'; }).join('') + '</div></div><p class="gm-fb" id="gm-fb" aria-live="polite"></p>';
    var bs = stage.querySelectorAll('[data-e]');
    function next() { if (!RUN) return; var prev = target; while (target === prev) target = rnd(0, ELEMENTS.length - 1); var e = ELEMENTS[target], mode = RUN.right > 6 && Math.random() < 0.5 ? 'pos' : 'name';
      stage.querySelector('#gm-ask').innerHTML = mode === 'pos' ? 'Find the element in <b>period ' + e[2] + ', group ' + (e[3] > 12 ? e[3] - 10 + ' (' + e[3] + ')' : e[3]) + '</b>' : 'Find <b>' + e[1] + '</b>'; lock = false; }
    bs.forEach(function (b) { b.onclick = function () {
      if (lock || !RUN) return; var i = +b.getAttribute('data-e'), ok = i === target, fb = stage.querySelector('#gm-fb'); lock = true;
      bs[target].classList.add('ok'); if (!ok) b.classList.add('no'); var pts = addScore(ok, 10); fb.className = 'gm-fb ' + (ok ? 'ok' : 'no'); fb.textContent = ok ? '✓ ' + ELEMENTS[target][1] + ' (' + ELEMENTS[target][0] + ') +' + pts : '✗ That is ' + ELEMENTS[i][1] + '. ' + ELEMENTS[target][1] + ' is ' + ELEMENTS[target][0] + '.';
      setTimeout(function () { bs[target].classList.remove('ok'); b.classList.remove('no'); next(); }, ok ? 500 : 1400); }; });
    timer(75, function () { finish(); }); next();
  }

  /* --- balance: equations */
  function balance(g, stage) {
    var list = shuffle(EQS).slice(0, 5), q = 0;
    function eq() {
      if (!RUN) return; if (q >= list.length) return finish();
      var e = list[q], all = e.r.concat(e.p), co = all.map(function () { return 1; }), tries = 0;
      function count(side, off) { var t = {}; side.forEach(function (s, i) { Object.keys(s[1]).forEach(function (k) { t[k] = (t[k] || 0) + s[1][k] * co[i + off]; }); }); return t; }
      function paint() {
        var L = count(e.r, 0), R = count(e.p, e.r.length), els = Object.keys(Object.assign({}, L, R)), ok = els.every(function (k) { return L[k] === R[k]; });
        var term = function (s, i) { return '<span class="gm-co"><button type="button" data-p="' + i + '" aria-label="More ' + s[0] + '">▲</button><output aria-label="Number of ' + s[0] + '">' + co[i] + '</output><button type="button" data-m="' + i + '" aria-label="Fewer ' + s[0] + '">▼</button></span><span>' + s[0].replace(/(\d+)/g, function (n) { return sub(n); }) + '</span>'; };
        stage.innerHTML = '<p class="small muted" style="margin-top:0">Equation ' + (q + 1) + ' of ' + list.length + ' · change the big numbers (coefficients), never the small ones</p><div class="gm-eq">' +
          e.r.map(function (s, i) { return term(s, i); }).join('<span>+</span>') + '<span aria-label="gives">→</span>' + e.p.map(function (s, i) { return term(s, i + e.r.length); }).join('<span>+</span>') + '</div>' +
          '<div class="gm-atoms">' + els.map(function (k) { return '<span class="' + (L[k] === R[k] ? 'ok' : 'no') + '">' + k + ': ' + (L[k] || 0) + ' | ' + (R[k] || 0) + '</span>'; }).join('') + '</div>' +
          '<div class="gm-acts"><button class="btn main" type="button" id="gm-chk">Check</button><button class="btn" type="button" id="gm-skip">Skip</button></div><p class="gm-fb" id="gm-fb" aria-live="polite">' + (ok ? 'Every atom balances: press Check.' : '') + '</p>';
        stage.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-p'); if (co[i] < 12) co[i]++; paint(); stage.querySelector('[data-p="' + i + '"]').focus(); }; });
        stage.querySelectorAll('[data-m]').forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-m'); if (co[i] > 1) co[i]--; paint(); stage.querySelector('[data-m="' + i + '"]').focus(); }; });
        stage.querySelector('#gm-chk').onclick = function () {
          tries++; var gg = co.reduce(function (a, b) { return gcd(a, b); }), fb = stage.querySelector('#gm-fb');
          if (ok && gg === 1) { var pts = addScore(true, Math.max(30, 90 - (tries - 1) * 20)); fb.className = 'gm-fb ok'; fb.textContent = '✓ Balanced! +' + pts; stage.querySelector('#gm-chk').disabled = true; q++; setTimeout(eq, 1100); }
          else if (ok) { fb.className = 'gm-fb no'; fb.textContent = 'Balanced, but use the smallest whole numbers (divide them all by ' + gg + ').'; }
          else { addScore(false); fb.className = 'gm-fb no'; fb.textContent = 'Not balanced yet: look at the orange atoms.'; }
        };
        stage.querySelector('#gm-skip').onclick = function () { addScore(false); q++; eq(); };
      }
      paint();
    }
    eq();
  }

  /* --- launch: projectile motion on a canvas */
  function launch(g, stage) {
    var shot = 0, SHOTS = 6, G = 9.8, target, busy = false, scaleM = 8;   // pixels per metre
    stage.innerHTML = '<p class="small muted" style="margin-top:0">Land the ball on the flag. Range = v² sin 2θ ÷ g (g = 9.8 m/s², no air resistance). ' + SHOTS + ' shots.</p><canvas class="gm-cv" id="gm-cv" width="820" height="360" role="img" aria-label="Projectile launcher: cannon on the left, target flag on the right"></canvas>' +
      '<div class="gm-ctl"><label>Angle: <output id="gm-ao">45</output>°<input type="range" id="gm-a" min="5" max="85" value="45"></label><label>Launch speed: <output id="gm-vo">20</output> m/s<input type="range" id="gm-v" min="5" max="30" value="20"></label></div>' +
      '<div class="gm-acts"><button class="btn main" type="button" id="gm-fire">🚀 Launch</button></div><p class="gm-fb" id="gm-fb" aria-live="polite"></p>';
    var cv = stage.querySelector('#gm-cv'), c = cv.getContext('2d'), W = cv.width, H = cv.height, ground = H - 40, x0 = 40;
    var a = stage.querySelector('#gm-a'), v = stage.querySelector('#gm-v');
    a.oninput = function () { stage.querySelector('#gm-ao').textContent = a.value; scene(); }; v.oninput = function () { stage.querySelector('#gm-vo').textContent = v.value; scene(); };
    function newTarget() { target = rnd(20, 90); RUN.target = target; }
    function scene(path, land) {
      c.clearRect(0, 0, W, H); c.fillStyle = '#86efac'; c.fillRect(0, ground, W, H - ground);
      c.fillStyle = '#334155'; c.font = '12px sans-serif'; for (var m = 0; m <= 100; m += 10) { var px = x0 + m * scaleM; c.fillRect(px, ground, 1, 6); c.fillText(m + ' m', px - 10, ground + 20); }
      var tx = x0 + target * scaleM; c.fillStyle = '#ef4444'; c.fillRect(tx - 16, ground - 4, 32, 4); c.fillStyle = '#7f1d1d'; c.fillRect(tx - 1, ground - 46, 2, 42); c.fillStyle = '#ef4444'; c.beginPath(); c.moveTo(tx + 1, ground - 46); c.lineTo(tx + 24, ground - 38); c.lineTo(tx + 1, ground - 30); c.fill(); c.fillStyle = '#7f1d1d'; c.fillText(target + ' m', tx - 12, ground - 52);
      var ang = +a.value * Math.PI / 180; c.save(); c.translate(x0, ground - 8); c.rotate(-ang); c.fillStyle = '#1e293b'; c.fillRect(0, -6, 34, 12); c.restore(); c.fillStyle = '#475569'; c.beginPath(); c.arc(x0, ground - 6, 12, 0, Math.PI * 2); c.fill();
      if (path) { c.strokeStyle = '#4f46e5'; c.setLineDash([5, 5]); c.lineWidth = 2; c.beginPath(); path.forEach(function (p, i) { var X = x0 + p[0] * scaleM, Y = ground - 8 - p[1] * scaleM; if (i) c.lineTo(X, Y); else c.moveTo(X, Y); }); c.stroke(); c.setLineDash([]); var last = path[path.length - 1]; c.fillStyle = '#4f46e5'; c.beginPath(); c.arc(x0 + last[0] * scaleM, ground - 8 - last[1] * scaleM, 7, 0, Math.PI * 2); c.fill(); }
      if (land != null) { c.fillStyle = '#1e293b'; c.fillText('landed at ' + nice(land) + ' m', x0 + land * scaleM - 30, ground + 34); }
    }
    stage.querySelector('#gm-fire').onclick = function () {
      if (busy || !RUN) return; busy = true; shot++;
      var ang = +a.value * Math.PI / 180, sp = +v.value, vx = sp * Math.cos(ang), vy = sp * Math.sin(ang), T = 2 * vy / G, R = sp * sp * Math.sin(2 * ang) / G, path = [], t = 0, startT = performance.now();
      (function fly() {
        if (!RUN) return; t = Math.min(T, (performance.now() - startT) / 1000 * 1.6); path.push([vx * t, vy * t - 0.5 * G * t * t]); scene(path);
        if (t < T) { RUN.raf = requestAnimationFrame(fly); return; }
        var miss = Math.abs(R - target), fb = stage.querySelector('#gm-fb'); scene(path, R);
        if (miss <= 2) { var pts = addScore(true, miss <= 0.7 ? 100 : 60); fb.className = 'gm-fb ok'; fb.textContent = (miss <= 0.7 ? '🎯 Bullseye! ' : '✓ Hit! ') + 'Range ' + nice(R) + ' m. +' + pts; confettiSmall(); newTarget(); }
        else { addScore(false); fb.className = 'gm-fb no'; fb.textContent = (R < target ? 'Too short' : 'Too far') + ' by ' + nice(miss) + ' m (range ' + nice(R) + ' m). ' + (R < target ? 'More speed, or an angle nearer 45°.' : 'Less speed, or move the angle away from 45°.'); }
        busy = false; stage.querySelector('#gm-fire').textContent = '🚀 Launch (' + (SHOTS - shot) + ' left)';
        if (shot >= SHOTS) { stage.querySelector('#gm-fire').disabled = true; setTimeout(finish, 1500); }
      })();
    };
    function confettiSmall() { var sc = app.querySelector('#gm-sc'); if (sc) sc.classList.add('gm-pop'); }
    newTarget(); scene(); stage.querySelector('#gm-fire').textContent = '🚀 Launch (' + SHOTS + ' left)';
  }

  /* --- cellmap: click the part of a plant cell (added 16 Nov 2026) */
  function cellmap(g, stage) {
    var target = null, lock = false, n = 0;
    var svg = '<svg viewBox="0 0 400 260" class="gm-cell" role="group" aria-label="Diagram of a plant cell. Each part is a button.">' +
      '<rect data-part="wall" x="6" y="6" width="388" height="248" rx="30" fill="#86efac" stroke="#15803d" stroke-width="3"/>' +
      '<rect data-part="cytoplasm" x="24" y="24" width="352" height="212" rx="20" fill="#ecfccb"/>' +
      '<rect data-part="membrane" x="22" y="22" width="356" height="216" rx="21" fill="none" stroke="#65a30d" stroke-width="9" pointer-events="stroke" stroke-opacity=".9"/>' +
      '<ellipse data-part="vacuole" cx="228" cy="136" rx="92" ry="66" fill="#bae6fd" stroke="#0284c7" stroke-width="2"/>' +
      '<g data-part="nucleus"><circle cx="78" cy="78" r="34" fill="#c4b5fd" stroke="#6d28d9" stroke-width="3"/><circle cx="84" cy="72" r="10" fill="#7c3aed"/></g>' +
      [[60, 192], [150, 44], [332, 54], [346, 204], [252, 222]].map(function (p) { return '<g data-part="chloroplast"><ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="22" ry="11" fill="#16a34a" stroke="#14532d" stroke-width="2"/><path d="M' + (p[0] - 14) + ' ' + p[1] + 'h28M' + (p[0] - 10) + ' ' + (p[1] - 4) + 'h20M' + (p[0] - 10) + ' ' + (p[1] + 4) + 'h20" stroke="#bbf7d0" stroke-width="1.5"/></g>'; }).join('') +
      [[112, 142], [356, 128], [205, 40]].map(function (p) { return '<g data-part="mitochondrion"><ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="15" ry="8" fill="#fb923c" stroke="#9a3412" stroke-width="2"/><path d="M' + (p[0] - 10) + ' ' + p[1] + 'q3-5 6 0t6 0t6 0" fill="none" stroke="#7c2d12" stroke-width="1.4"/></g>'; }).join('') +
      [[52, 128], [300, 226]].map(function (p) { return '<g data-part="ribosome"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="13" fill="transparent"/>' + [[-6, -4], [3, -6], [6, 3], [-3, 5], [0, 0]].map(function (d) { return '<circle cx="' + (p[0] + d[0]) + '" cy="' + (p[1] + d[1]) + '" r="2.4" fill="#1e293b"/>'; }).join('') + '</g>'; }).join('') +
      '</svg>';
    stage.innerHTML = '<p class="gm-q" id="gm-ask"></p><div class="gm-cellw">' + svg + '</div><p class="small muted" style="margin:6px 0 0">Click (or tab to and press Enter on) the part of the plant cell.</p><p class="gm-fb" id="gm-fb" aria-live="polite"></p>';
    var parts = stage.querySelectorAll('[data-part]');
    parts.forEach(function (p, i) { p.setAttribute('tabindex', '0'); p.setAttribute('role', 'button'); p.setAttribute('aria-label', 'Part ' + (i + 1)); });
    function next() {
      if (!RUN) return; var prev = target; while (target === prev) target = pick(CELLPARTS); n++;
      var byJob = RUN.right >= 4 && Math.random() < 0.6;
      stage.querySelector('#gm-ask').innerHTML = byJob ? 'Click <b>' + E(target[2]) + '</b>.' : 'Click the <b>' + E(target[1].toLowerCase()) + '</b>.'; lock = false;
    }
    function hit(el) {
      if (lock || !RUN || !el) return; lock = true; var k = el.getAttribute('data-part'), ok = k === target[0], fb = stage.querySelector('#gm-fb');
      var name = CELLPARTS.filter(function (c) { return c[0] === k; })[0][1];
      stage.querySelectorAll('[data-part="' + target[0] + '"]').forEach(function (x) { x.classList.add('gm-glow'); });
      var pts = addScore(ok, 10); fb.className = 'gm-fb ' + (ok ? 'ok' : 'no'); fb.textContent = ok ? '✓ ' + target[1] + ' +' + pts : '✗ That is the ' + name.toLowerCase() + '. The glowing part is the ' + target[1].toLowerCase() + '.';
      sayLive(ok ? 'Correct' : 'Not quite'); setTimeout(function () { stage.querySelectorAll('.gm-glow').forEach(function (x) { x.classList.remove('gm-glow'); }); next(); }, ok ? 600 : 1600);
    }
    stage.querySelector('svg').addEventListener('click', function (e) { hit(e.target.closest('[data-part]')); });
    stage.querySelector('svg').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hit(e.target.closest('[data-part]')); } });
    timer(75, function () { finish(); }); next();
  }

  /* --- catcher: Enzyme Catcher, an arcade game about specificity, inhibitors and denaturing */
  function catcher(g, stage) {
    stage.innerHTML = '<p class="small muted" style="margin-top:0">Move the enzyme with ← → (or A / D), your mouse or your finger. Catch only the <b>substrate</b> that fits the <b>active site</b>. Avoid other molecules, <b>inhibitors</b> (grey with ✕) and <b>heat</b> 🔥, which denatures the enzyme.</p>' +
      '<canvas class="gm-cv gm-dark" id="gm-cv" width="820" height="420" role="img" aria-label="Enzyme catcher: shapes fall from the top; the enzyme moves along the bottom"></canvas><p class="gm-fb" id="gm-fb" aria-live="polite"></p>';
    var cv = stage.querySelector('#gm-cv'), c = cv.getContext('2d'), W = cv.width, H = cv.height, EW = 120, ex = W / 2, KINDS = ['tri', 'sq', 'circ', 'dia'], site = pick(KINDS), items = [], last = performance.now(), nextSpawn = 0, blocked = 0, msg = '', msgT = 0, t0 = performance.now(), swap = performance.now() + 20000, fb = stage.querySelector('#gm-fb');
    var COL = { tri: '#f59e0b', sq: '#ec4899', circ: '#22c55e', dia: '#38bdf8' };
    function shape(k, x, y, r, fill) {
      c.beginPath();
      if (k === 'tri') { c.moveTo(x, y - r); c.lineTo(x + r, y + r * 0.8); c.lineTo(x - r, y + r * 0.8); c.closePath(); }
      else if (k === 'sq') c.rect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7);
      else if (k === 'dia') { c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath(); }
      else c.arc(x, y, r, 0, Math.PI * 2);
      c.fillStyle = fill; c.fill();
    }
    function say(t, ok) { msg = t; msgT = performance.now() + 1400; fb.className = 'gm-fb ' + (ok ? 'ok' : 'no'); fb.textContent = t; }
    function spawn(now) {
      var r = Math.random(), sp = 110 + Math.min(160, (now - t0) / 1000 * 3.2), it = { x: rnd(30, W - 30), y: -20, v: sp * (0.8 + Math.random() * 0.4) };
      if (r < 0.45) { it.k = 'sub'; it.s = site; } else if (r < 0.8) { it.k = 'other'; it.s = pick(KINDS.filter(function (x) { return x !== site; })); } else if (r < 0.92) { it.k = 'inh'; it.s = site; } else it.k = 'heat';
      items.push(it);
    }
    function move(dx) { ex = Math.max(EW / 2, Math.min(W - EW / 2, ex + dx)); }
    RUN.keys = function (e) { if (/^(ArrowLeft|a|A)$/.test(e.key)) { e.preventDefault(); move(-45); } else if (/^(ArrowRight|d|D)$/.test(e.key)) { e.preventDefault(); move(45); } };
    var point = function (e) { var b = cv.getBoundingClientRect(); ex = Math.max(EW / 2, Math.min(W - EW / 2, (e.clientX - b.left) / b.width * W)); };
    cv.addEventListener('pointermove', point); cv.addEventListener('pointerdown', function (e) { point(e); try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
    function frame(now) {
      if (!RUN || RUN.over) return; var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (now >= nextSpawn) { spawn(now); nextSpawn = now + Math.max(380, 820 - (now - t0) / 1000 * 7); }
      if (now >= swap) { var old = site; while (site === old) site = pick(KINDS); swap = now + 20000; items = items.filter(function (it) { return it.k === 'heat'; }); say('New enzyme! Its active site fits a different substrate.', true); }
      c.fillStyle = '#0f172a'; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(148,163,184,.08)'; for (var i = 0; i < 30; i++) c.fillRect((i * 97) % W, (i * 53 + now / 30) % H, 3, 3);
      var by = H - 46, dead = now < blocked;
      items.forEach(function (it) {
        it.y += it.v * dt;
        if (!it.done && it.y >= by - 10 && it.y <= by + 14 && Math.abs(it.x - ex) < EW / 2) {
          it.done = true;
          if (dead) return;
          if (it.k === 'sub') { var p = addScore(true, 10); say('✓ Substrate fits the active site: product made! +' + p, true); }
          else if (it.k === 'other') { addScore(false); say('✗ Wrong shape: that molecule does not fit this active site.', false); }
          else if (it.k === 'inh') { addScore(false); blocked = now + 1500; say('✗ An inhibitor blocked the active site!', false); }
          else { addScore(false); blocked = now + 2200; say('🔥 Too hot! The active site changed shape: the enzyme is denatured. A new enzyme is coming…', false); }
        }
      });
      items = items.filter(function (it) { return !it.done && it.y < H + 30; });
      items.forEach(function (it) {
        if (it.k === 'heat') { c.font = '30px sans-serif'; c.textAlign = 'center'; c.fillText('🔥', it.x, it.y + 10); return; }
        shape(it.s, it.x, it.y, 16, it.k === 'inh' ? '#64748b' : COL[it.s]);
        if (it.k === 'inh') { c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(it.x - 7, it.y - 7); c.lineTo(it.x + 7, it.y + 7); c.moveTo(it.x + 7, it.y - 7); c.lineTo(it.x - 7, it.y + 7); c.stroke(); }
      });
      // the enzyme with its active site
      c.globalAlpha = dead ? 0.35 : 1; c.fillStyle = '#7c3aed'; c.beginPath(); c.moveTo(ex - EW / 2, by + 30); c.lineTo(ex - EW / 2, by + 6); c.quadraticCurveTo(ex - EW / 2, by - 8, ex - EW / 2 + 16, by - 8); c.lineTo(ex + EW / 2 - 16, by - 8); c.quadraticCurveTo(ex + EW / 2, by - 8, ex + EW / 2, by + 6); c.lineTo(ex + EW / 2, by + 30); c.closePath(); c.fill();
      shape(site, ex, by - 2, 15, '#0f172a'); c.globalAlpha = 1;
      c.fillStyle = '#e2e8f0'; c.font = 'bold 13px sans-serif'; c.textAlign = 'center'; c.fillText(dead ? 'denatured / blocked' : 'enzyme', ex, by + 26);
      c.textAlign = 'left'; c.font = 'bold 14px sans-serif'; c.fillStyle = '#e2e8f0'; c.fillText('Substrate for this enzyme:', 12, 22); shape(site, 214, 17, 9, COL[site]);
      if (now < msgT) { c.textAlign = 'center'; c.font = 'bold 16px sans-serif'; c.fillStyle = '#fde68a'; c.fillText(msg.slice(0, 70), W / 2, 52); }
      RUN.raf = requestAnimationFrame(frame);
    }
    timer(60, function () { finish(); }); RUN.raf = requestAnimationFrame(frame);
  }

  /* --- shells: build the electron arrangement of an atom */
  function shells(g, stage) {
    var list = shuffle(SYM.map(function (s, i) { return i + 1; }).filter(function (z) { return z > 2; })).slice(0, 6), r = 0;
    function round() {
      if (!RUN) return; if (r >= list.length) return finish();
      var z = list[r], right = shellsOf(z), cur = [0, 0, 0, 0], tries = 0;
      function paint(note, cls) {
        var tot = cur.reduce(function (a, b) { return a + b; }, 0), R = [44, 74, 104, 134], s = '<svg viewBox="0 0 300 300" class="gm-atom" role="img" aria-label="Atom of ' + ENAME[z - 1] + ' with ' + cur.join(', ') + ' electrons in shells 1 to 4">';
        R.forEach(function (rr, i) { s += '<circle data-sh="' + i + '" cx="150" cy="150" r="' + rr + '" fill="none" stroke="#94a3b8" stroke-width="10" stroke-opacity=".25" pointer-events="stroke"/><circle cx="150" cy="150" r="' + rr + '" fill="none" stroke="#64748b" stroke-width="1.5" pointer-events="none"/>';
          for (var e = 0; e < cur[i]; e++) { var a = e / cur[i] * Math.PI * 2 - Math.PI / 2; s += '<circle cx="' + (150 + rr * Math.cos(a)) + '" cy="' + (150 + rr * Math.sin(a)) + '" r="7" fill="#2563eb" stroke="#fff" stroke-width="2" pointer-events="none"/>'; } });
        s += '<circle cx="150" cy="150" r="24" fill="#f97316" pointer-events="none"/><text pointer-events="none" x="150" y="147" text-anchor="middle" font-weight="800" font-size="15" fill="#fff">' + SYM[z - 1] + '</text><text pointer-events="none" x="150" y="163" text-anchor="middle" font-size="10" fill="#fff">' + z + 'p</text></svg>';
        stage.innerHTML = '<p class="small muted" style="margin-top:0">Atom ' + (r + 1) + ' of ' + list.length + ' · click a shell to add an electron, or use the buttons</p><p class="gm-q"><b>' + ENAME[z - 1] + '</b> (atomic number ' + z + '): place all ' + z + ' electrons. <span class="small muted">Electrons placed: ' + tot + '</span></p>' +
          '<div class="gm-atomw">' + s + '<div class="gm-shctl">' + [0, 1, 2, 3].map(function (i) { return '<div><span>Shell ' + (i + 1) + '</span><button type="button" data-m="' + i + '" aria-label="Remove an electron from shell ' + (i + 1) + '">−</button><output>' + cur[i] + '</output><button type="button" data-p="' + i + '" aria-label="Add an electron to shell ' + (i + 1) + '">+</button></div>'; }).join('') +
          '<button class="btn main" type="button" id="gm-chk">Check</button><button class="btn" type="button" id="gm-clr">Clear</button></div></div><p class="gm-fb ' + (cls || '') + '" id="gm-fb" aria-live="polite">' + (note || '') + '</p>';
        var add = function (i, d) { cur[i] = Math.max(0, Math.min(18, cur[i] + d)); paint(); };
        stage.querySelectorAll('[data-sh]').forEach(function (c) { c.onclick = function () { add(+c.getAttribute('data-sh'), 1); }; });
        stage.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { add(+b.getAttribute('data-p'), 1); var x = stage.querySelector('[data-p="' + b.getAttribute('data-p') + '"]'); if (x) x.focus(); }; });
        stage.querySelectorAll('[data-m]').forEach(function (b) { b.onclick = function () { add(+b.getAttribute('data-m'), -1); var x = stage.querySelector('[data-m="' + b.getAttribute('data-m') + '"]'); if (x) x.focus(); }; });
        stage.querySelector('#gm-clr').onclick = function () { cur = [0, 0, 0, 0]; paint(); };
        stage.querySelector('#gm-chk').onclick = function () {
          tries++;
          if (cur.join() === right.join()) { var pts = addScore(true, Math.max(15, 40 - (tries - 1) * 10)); r++; paint('✓ ' + ENAME[z - 1] + ' is ' + right.filter(Boolean).join(', ') + '. +' + pts, 'ok'); stage.querySelector('#gm-chk').disabled = true; setTimeout(round, 1300); return; }
          addScore(false); var t = cur.reduce(function (a, b) { return a + b; }, 0), hint = t !== z ? 'You placed ' + t + ' electrons; ' + ENAME[z - 1] + ' has ' + z + '.' : 'Right number, wrong shells. Shell 1 holds 2, shells 2 and 3 hold up to 8: fill the inner shells first.';
          if (tries >= 3) { r++; paint('The answer is ' + right.filter(Boolean).join(', ') + '. On to the next atom…', 'no'); setTimeout(round, 2200); } else paint('✗ ' + hint, 'no');
        };
      }
      paint();
    }
    round();
  }

  /* --- numline: estimate where a number goes on a number line */
  function numline(g, stage) {
    var R = 0, ROUNDS = 10, cur;
    function make(i) {
      var k = i % 5, t = [0, 1];
      if (k === 0) { var v = rnd(3, 97); return { lo: 0, hi: 100, v: v, show: String(v) }; }
      if (k === 1) { var d = rnd(1, 99) / 100; return { lo: 0, hi: 1, v: d, show: String(d) }; }
      if (k === 2) { var den = pick([3, 4, 5, 8, 10]), num = rnd(1, den - 1); return { lo: 0, hi: 1, v: num / den, show: num + '/' + den }; }
      if (k === 3) { var n = rnd(-9, 9) || 4; return { lo: -10, hi: 10, v: n, show: String(n).replace('-', '−') }; }
      var b = pick([[0, 1000, rnd(30, 970)], [0, 1, rnd(5, 95) / 100]]); return b[1] === 1 ? { lo: 0, hi: 1, v: b[2], show: Math.round(b[2] * 100) + '%' } : { lo: 0, hi: 1000, v: b[2], show: String(b[2]) };
    }
    function paint() {
      if (!RUN) return; if (R >= ROUNDS) return finish(); cur = make(R);
      var fmt = function (x) { return String(x).replace('-', '−'); };
      stage.innerHTML = '<p class="small muted" style="margin-top:0">Round ' + (R + 1) + ' of ' + ROUNDS + ' · click on the line, or use the slider and press Place</p><p class="gm-q">Where is <b class="gm-big">' + cur.show + '</b>?</p>' +
        '<svg viewBox="0 0 820 120" class="gm-nl" role="img" aria-label="Number line from ' + fmt(cur.lo) + ' to ' + fmt(cur.hi) + '"><rect x="0" y="0" width="820" height="120" fill="transparent"/><line x1="40" y1="60" x2="780" y2="60" stroke="#334155" stroke-width="4" stroke-linecap="round"/>' +
        [0, 0.5, 1].map(function (f) { return '<line x1="' + (40 + f * 740) + '" y1="44" x2="' + (40 + f * 740) + '" y2="76" stroke="#334155" stroke-width="3"/><text x="' + (40 + f * 740) + '" y="102" text-anchor="middle" font-size="20" font-weight="700" fill="#334155">' + fmt(nice(cur.lo + f * (cur.hi - cur.lo))) + '</text>'; }).join('') + '<g id="gm-marks"></g></svg>' +
        '<div class="gm-ctl"><label>Your guess: <output id="gm-nlo">–</output><input type="range" id="gm-nlr" min="0" max="1000" value="500" aria-label="Position on the number line"></label></div><div class="gm-acts"><button class="btn main" type="button" id="gm-place">Place</button></div><p class="gm-fb" id="gm-fb" aria-live="polite"></p>';
      var sv = stage.querySelector('.gm-nl'), rg = stage.querySelector('#gm-nlr'), done = false;
      var val = function (f) { return cur.lo + f * (cur.hi - cur.lo); };
      rg.oninput = function () { stage.querySelector('#gm-nlo').textContent = fmt(nice(val(rg.value / 1000))); };
      function place(f) {
        if (done || !RUN) return; done = true; f = Math.max(0, Math.min(1, f)); var tf = (cur.v - cur.lo) / (cur.hi - cur.lo), err = Math.abs(f - tf), fb = stage.querySelector('#gm-fb');
        stage.querySelector('#gm-marks').innerHTML = '<line x1="' + (40 + f * 740) + '" y1="20" x2="' + (40 + f * 740) + '" y2="60" stroke="#2563eb" stroke-width="4"/><circle cx="' + (40 + f * 740) + '" cy="20" r="8" fill="#2563eb"/><line x1="' + (40 + tf * 740) + '" y1="60" x2="' + (40 + tf * 740) + '" y2="86" stroke="#16a34a" stroke-width="4"/><text x="' + (40 + tf * 740) + '" y="118" text-anchor="middle" font-size="16" font-weight="800" fill="#16a34a">' + cur.show + '</text>';
        var ok = err <= 0.06, pts = addScore(ok, err <= 0.01 ? 30 : err <= 0.03 ? 20 : 10);
        fb.className = 'gm-fb ' + (ok ? 'ok' : 'no'); fb.textContent = ok ? (err <= 0.01 ? '🎯 Spot on! +' : '✓ Close! +') + pts : '✗ Too far: you placed ' + fmt(nice(val(f))) + '. The green mark shows ' + cur.show + '.';
        R++; setTimeout(paint, ok ? 1100 : 1900);
      }
      sv.addEventListener('click', function (e) { var b = sv.getBoundingClientRect(), x = (e.clientX - b.left) / b.width * 820; place((x - 40) / 740); });
      stage.querySelector('#gm-place').onclick = function () { place(rg.value / 1000); };
    }
    paint();
  }

  /* --- scramble: unscramble science words from a clue */
  function scramble(g, stage) {
    var deck = shuffle(WORDS), w = 0;
    function next() {
      if (!RUN) return; if (w >= deck.length) { w = 0; deck = shuffle(WORDS); }
      var word = deck[w][0], clue = deck[w][1], letters = shuffle(word.split('')), used = [], hinted = 0, lock = false;
      while (letters.join('') === word) letters = shuffle(word.split(''));
      function paint(note, cls) {
        var typed = used.map(function (i) { return letters[i]; }).join('');
        stage.innerHTML = '<p class="gm-q">🔎 ' + E(clue) + ' <span class="small muted">(' + word.length + ' letters)</span></p>' +
          '<div class="gm-slots" aria-label="Your word so far: ' + (typed || 'empty') + '">' + word.split('').map(function (ch, i) { return '<span class="' + (i < hinted ? 'h' : '') + '">' + (typed[i] || '') + '</span>'; }).join('') + '</div>' +
          '<div class="gm-tiles">' + letters.map(function (ch, i) { return '<button type="button" data-l="' + i + '"' + (used.indexOf(i) >= 0 ? ' disabled' : '') + '>' + ch + '</button>'; }).join('') + '</div>' +
          '<div class="gm-acts"><button class="btn" type="button" id="gm-bk">⌫ Back</button><button class="btn" type="button" id="gm-hint">💡 Hint (−5)</button><button class="btn" type="button" id="gm-skip">Skip</button></div><p class="small muted">You can also type the letters on your keyboard.</p><p class="gm-fb ' + (cls || '') + '" id="gm-fb" aria-live="polite">' + (note || '') + '</p>';
        stage.querySelectorAll('[data-l]').forEach(function (b) { b.onclick = function () { tap(+b.getAttribute('data-l')); }; });
        stage.querySelector('#gm-bk').onclick = back; stage.querySelector('#gm-skip').onclick = function () { if (lock) return; lock = true; addScore(false); paint('The word was ' + word + '.', 'no'); w++; setTimeout(next, 1400); };
        stage.querySelector('#gm-hint').onclick = function () {
          if (lock || hinted >= word.length - 1) return; hinted++; RUN.score = Math.max(0, RUN.score - 5);
          used = []; for (var k = 0; k < hinted; k++) { for (var j = 0; j < letters.length; j++) if (used.indexOf(j) < 0 && letters[j] === word[k]) { used.push(j); break; } }
          paint('First ' + hinted + ' letter' + (hinted > 1 ? 's' : '') + ' placed.');
        };
      }
      function back() { if (lock || used.length <= hinted) return; used.pop(); paint(); }
      function tap(i) {
        if (lock || used.indexOf(i) >= 0) return; used.push(i);
        if (used.length === word.length) {
          var typed = used.map(function (k) { return letters[k]; }).join('');
          if (typed === word) { lock = true; var pts = addScore(true, 10 + word.length * 2 - hinted * 3); paint('✓ ' + word + '! +' + pts, 'ok'); w++; setTimeout(next, 900); return; }
          addScore(false); var keep = used.slice(0, hinted); paint('✗ ' + typed + ' is not it. Try again.', 'no'); used = keep; setTimeout(function () { if (!lock) paint(); }, 900); return;
        }
        paint();
      }
      RUN.keys = function (e) {
        if (e.key === 'Backspace') { e.preventDefault(); return back(); }
        var ch = String(e.key || '').toUpperCase(); if (!/^[A-Z]$/.test(ch)) return;
        for (var j = 0; j < letters.length; j++) if (used.indexOf(j) < 0 && letters[j] === ch) return tap(j);
      };
      paint();
    }
    timer(90, function () { finish(); }); next();
  }

  /* --- impulse: Fire the Neuron. The player is the voltage-gated channels (added 16 Nov 2026) */
  function impulse(g, stage) {
    var ROUNDS = 8, r = 0, plan = shuffle([-62, -59, -46, -42, -40, -44, -48, -60]).slice(0, ROUNDS), st, V, t, raf, last;
    stage.innerHTML = '<p class="small muted" style="margin-top:0">You are the ion channels of an axon. Press each button at the right moment: <b>1</b> open Na⁺ channels when the potential reaches the <b>threshold (−55 mV)</b>, <b>2</b> open K⁺ channels at the <b>peak</b>, <b>3</b> run the Na⁺/K⁺ pump when the membrane is <b>hyperpolarised</b>. If the stimulus never reaches the threshold, do nothing: no impulse (all or nothing)!</p>' +
      '<canvas class="gm-cv" id="gm-cv" width="820" height="300" style="background:#fff;border:1px solid #e2e8f0" role="img" aria-label="Membrane potential trace"></canvas>' +
      '<div class="gm-ion"><svg viewBox="0 0 360 70" id="gm-mem" aria-hidden="true"></svg></div>' +
      '<div class="gm-bins" style="margin-top:8px"><button type="button" class="gm-bin" data-k="na"><kbd>1</kbd> Open Na⁺ channels</button><button type="button" class="gm-bin" data-k="k"><kbd>2</kbd> Open K⁺ channels</button><button type="button" class="gm-bin" data-k="pump"><kbd>3</kbd> Na⁺/K⁺ pump: restore −70 mV</button></div><p class="gm-fb" id="gm-fb" aria-live="polite"></p>';
    var cv = stage.querySelector('#gm-cv'), c = cv.getContext('2d'), W = cv.width, H = cv.height, trace = [], fb = stage.querySelector('#gm-fb'), mem = stage.querySelector('#gm-mem');
    var Y = function (v) { return 20 + (50 - v) / 140 * (H - 50); };
    function say(txt, ok) { fb.className = 'gm-fb ' + (ok ? 'ok' : 'no'); fb.textContent = txt; sayLive(txt); }
    function newRound() { if (!RUN) return; if (r >= ROUNDS) return finish(); st = { phase: 'stim', S: plan[r], tPh: 0 }; V = -70; t = 0; trace = []; r++; say('Round ' + r + ' of ' + ROUNDS + ': a stimulus arrives…', true); fb.className = 'gm-fb'; }
    function phase(p) { st.phase = p; st.tPh = 0; }
    function act(k) {
      if (!RUN || !st || st.done) return;
      if (k === 'na') {
        if (st.phase !== 'stim' && st.phase !== 'subdecay') { addScore(false); return say('✗ The Na⁺ channels are not the next step now.', false); }
        if (V < -55.5) { addScore(false); say(st.S < -55 ? '✗ This stimulus never reaches the threshold: no impulse should fire!' : '✗ Too early: the threshold (−55 mV) is not reached yet.', false); if (st.S < -55) { st.done = true; setTimeout(newRound, 1400); } return; }
        var p = addScore(true, V < -50 ? 20 : 10); say('✓ Threshold reached: Na⁺ channels open, Na⁺ rushes in: depolarisation! +' + p, true); phase('depol');
      } else if (k === 'k') {
        if (st.phase !== 'depol' && st.phase !== 'peak') { addScore(false); return say('✗ Not yet: K⁺ channels open after depolarisation.', false); }
        if (V < 25) { addScore(false); return say('✗ Too early: wait for the peak (about +40 mV).', false); }
        var p2 = addScore(true, st.phase === 'peak' && st.tPh < 0.5 || V > 35 ? 20 : 10); say('✓ Peak: Na⁺ channels close, K⁺ channels open, K⁺ flows out: repolarisation. +' + p2, true); phase('repol');
      } else {
        if (st.phase !== 'hyper' && st.phase !== 'repol') { addScore(false); return say('✗ The pump restores the resting potential after the impulse.', false); }
        if (V > -72) { addScore(false); return say('✗ Wait: the membrane is not hyperpolarised yet.', false); }
        var p3 = addScore(true, 15); say('✓ Hyperpolarised: the Na⁺/K⁺ pump restores the resting potential (−70 mV). +' + p3, true); phase('restore');
      }
    }
    function step(dt) {
      st.tPh += dt; t += dt;
      if (st.phase === 'stim') { V = -70 + (st.S + 70) * Math.min(1, st.tPh / 1.6); if (st.S >= -55 && V >= -55 && st.tPh > 1.6 + 0.9) { addScore(false); say('✗ Too slow: at the threshold the Na⁺ channels should open.', false); phase('depol'); } else if (st.S < -55 && st.tPh > 1.6) phase('subdecay'); }
      else if (st.phase === 'subdecay') { V = st.S + (-70 - st.S) * Math.min(1, st.tPh / 1.2); if (st.tPh > 1.3 && !st.done) { st.done = true; var p = addScore(true, 20); say('✓ Below the threshold, so no action potential: all or nothing! +' + p, true); setTimeout(newRound, 1200); } }
      else if (st.phase === 'depol') { V = Math.min(40, V + dt * 160); if (V >= 40) phase('peak'); }
      else if (st.phase === 'peak') { V = 40; if (st.tPh > 1.1) { addScore(false); say('✗ Missed the peak: the K⁺ channels should open now.', false); phase('repol'); } }
      else if (st.phase === 'repol') { V = Math.max(-82, V - dt * 120); if (V <= -82) phase('hyper'); }
      else if (st.phase === 'hyper') { V = -82; if (st.tPh > 1.3) { addScore(false); say('✗ Missed it: the Na⁺/K⁺ pump should restore −70 mV.', false); phase('restore'); } }
      else if (st.phase === 'restore') { V = Math.min(-70, V + dt * 20); if (V >= -70 && !st.done) { st.done = true; setTimeout(newRound, 700); } }
    }
    function draw() {
      c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.font = '12px system-ui'; c.textAlign = 'right';
      [40, 0, -55, -70, -90].forEach(function (v) { c.strokeStyle = v === -55 ? '#f97316' : '#e2e8f0'; c.setLineDash(v === -55 ? [6, 4] : []); c.beginPath(); c.moveTo(50, Y(v)); c.lineTo(W - 10, Y(v)); c.stroke(); c.setLineDash([]); c.fillStyle = v === -55 ? '#c2410c' : '#475569'; c.fillText(v + ' mV', 46, Y(v) + 4); });
      c.textAlign = 'left'; c.fillStyle = '#c2410c'; c.fillText('threshold', 56, Y(-55) - 4);
      c.strokeStyle = '#2563eb'; c.lineWidth = 3; c.beginPath(); trace.forEach(function (p, i) { var x = 50 + p[0] / 7 * (W - 60); i ? c.lineTo(x, Y(p[1])) : c.moveTo(x, Y(p[1])); }); c.stroke();
      var ph = st ? { stim: 'Stimulus', subdecay: 'Too weak: back to rest', depol: 'Depolarisation', peak: 'Peak', repol: 'Repolarisation', hyper: 'Hyperpolarisation', restore: 'Restoring the resting potential' }[st.phase] : '';
      c.fillStyle = '#0f172a'; c.font = 'bold 15px system-ui'; c.fillText(Math.round(V) + ' mV · ' + ph, 60, 16);
      var na = st && (st.phase === 'depol' || st.phase === 'peak'), kk = st && (st.phase === 'repol' || st.phase === 'hyper'), pump = st && st.phase === 'restore';
      mem.innerHTML = '<rect x="0" y="22" width="360" height="26" fill="#fde68a"/><text x="4" y="14" font-size="10" fill="#475569">outside</text><text x="4" y="66" font-size="10" fill="#475569">inside the axon</text>' +
        '<rect x="70" y="18" width="34" height="34" rx="6" fill="' + (na ? '#ea580c' : '#94a3b8') + '"/><text x="87" y="40" font-size="10" text-anchor="middle" fill="#fff" font-weight="700">Na⁺</text>' + (na ? '<text x="112" y="62" font-size="11" fill="#ea580c" font-weight="700">↓ Na⁺ in</text>' : '') +
        '<rect x="170" y="18" width="34" height="34" rx="6" fill="' + (kk ? '#2563eb' : '#94a3b8') + '"/><text x="187" y="40" font-size="10" text-anchor="middle" fill="#fff" font-weight="700">K⁺</text>' + (kk ? '<text x="212" y="14" font-size="11" fill="#2563eb" font-weight="700">↑ K⁺ out</text>' : '') +
        '<rect x="270" y="18" width="44" height="34" rx="14" fill="' + (pump ? '#16a34a' : '#94a3b8') + '"/><text x="292" y="40" font-size="9" text-anchor="middle" fill="#fff" font-weight="700">pump</text>';
    }
    function loop(now) { if (!RUN || RUN.over) return; var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; if (st) { step(dt); trace.push([Math.min(7, t), V]); } draw(); RUN.raf = requestAnimationFrame(loop); }
    stage.querySelectorAll('[data-k]').forEach(function (b) { b.onclick = function () { act(b.getAttribute('data-k')); }; });
    RUN.keys = function (e) { var k = { '1': 'na', '2': 'k', '3': 'pump' }[e.key]; if (k) act(k); };
    RUN.dbg = function () { return { V: V, phase: st && st.phase, S: st && st.S, done: st && st.done }; };   // for tests
    newRound(); RUN.raf = requestAnimationFrame(loop);
  }

  /* --- hormone: Hormone Dispatch. Gland → hormone → target organ → receptor (added 16 Nov 2026) */
  var HORMONES = ['Insulin', 'Glucagon', 'Adrenaline', 'ADH', 'Thyroxine', 'FSH', 'LH', 'Oestrogen', 'Progesterone', 'Growth hormone', 'TSH'];
  var JOBS = [
    ['After a big meal, blood glucose is too high.', 'pancreas', 'Insulin', ['liver', 'muscle'], 'm', 'Insulin makes the liver and muscles take in glucose and store it as glycogen.'],
    ['It is many hours since you ate: blood glucose is too low.', 'pancreas', 'Glucagon', ['liver'], 'm', 'Glucagon makes the liver break glycogen down into glucose.'],
    ['A snake appears on the path! Get ready for fight or flight.', 'adrenal', 'Adrenaline', ['heart', 'liver', 'muscle'], 'm', 'Adrenaline raises heart rate and releases glucose for the muscles.'],
    ['After a long run in the heat, the blood is too concentrated.', 'pituitary', 'ADH', ['kidney'], 'm', 'ADH makes the kidney collecting ducts reabsorb more water.'],
    ['The body\'s metabolic rate is too low.', 'thyroid', 'Thyroxine', ['cells'], 'i', 'Thyroxine raises the metabolic rate of almost every body cell. It is hydrophobic and acts on receptors inside cells.'],
    ['The thyroid gland needs a signal to make more thyroxine.', 'pituitary', 'TSH', ['thyroid'], 'm', 'TSH (thyroid-stimulating hormone) from the pituitary stimulates the thyroid.'],
    ['Start of the menstrual cycle: an egg follicle needs to develop.', 'pituitary', 'FSH', ['ovary'], 'm', 'FSH stimulates a follicle to develop in the ovary.'],
    ['Middle of the menstrual cycle: time for ovulation.', 'pituitary', 'LH', ['ovary'], 'm', 'A surge of LH triggers the release of an egg from the ovary.'],
    ['After menstruation, the uterus lining must be rebuilt.', 'ovary', 'Oestrogen', ['uterus'], 'i', 'Oestrogen (a steroid) makes the uterus lining thicken. It acts on receptors inside the cells.'],
    ['After ovulation, the thick uterus lining must be maintained.', 'ovary', 'Progesterone', ['uterus'], 'i', 'Progesterone (a steroid) maintains the uterus lining.'],
    ['A child\'s bones and muscles need to grow.', 'pituitary', 'Growth hormone', ['cells', 'muscle'], 'm', 'Growth hormone from the pituitary stimulates growth of bones and muscles.']];
  var ORGNAME = { pituitary: 'pituitary gland', thyroid: 'thyroid gland', adrenal: 'adrenal glands', pancreas: 'pancreas', ovary: 'ovaries', liver: 'liver', muscle: 'muscles', heart: 'heart', kidney: 'kidneys', uterus: 'uterus', cells: 'all body cells' };
  function hormone(g, stage) {
    var list = shuffle(JOBS).slice(0, 6), q = 0, step = 0, job, lock = false;
    var body = '<svg viewBox="0 0 320 470" class="gm-body" role="group" aria-label="Human body with glands and organs. Each one is a button.">' +
      '<g fill="#fde7d7" stroke="#d6a07e" stroke-width="2"><circle cx="160" cy="55" r="42"/><rect x="146" y="92" width="28" height="22"/><rect x="100" y="110" width="120" height="210" rx="38"/><rect x="62" y="122" width="34" height="150" rx="16"/><rect x="224" y="122" width="34" height="150" rx="16"/><rect x="112" y="300" width="40" height="160" rx="18"/><rect x="168" y="300" width="40" height="160" rx="18"/></g>' +
      '<g data-o="pituitary"><circle cx="160" cy="62" r="9" fill="#a855f7" stroke="#6b21a8" stroke-width="2"/></g>' +
      '<g data-o="thyroid"><path d="M146 104c6-8 10-2 14 2c4-4 8-10 14-2c0 10-28 10-28 0z" fill="#ec4899" stroke="#9d174d" stroke-width="2"/></g>' +
      '<g data-o="heart"><path d="M146 160c-12-14-30 2-14 18l14 12l14-12c16-16-2-32-14-18z" fill="#ef4444" stroke="#991b1b" stroke-width="2"/></g>' +
      '<g data-o="liver"><path d="M150 196c30-14 62-8 60 10c-2 14-30 18-60 10z" fill="#92400e" stroke="#451a03" stroke-width="2"/></g>' +
      '<g data-o="pancreas"><ellipse cx="150" cy="236" rx="30" ry="7" fill="#fbbf24" stroke="#92400e" stroke-width="2"/></g>' +
      '<g data-o="kidney"><ellipse cx="128" cy="262" rx="10" ry="15" fill="#b91c1c" stroke="#7f1d1d" stroke-width="2"/><ellipse cx="192" cy="262" rx="10" ry="15" fill="#b91c1c" stroke="#7f1d1d" stroke-width="2"/></g>' +
      '<g data-o="adrenal"><path d="M120 248l8-10l8 10z M184 248l8-10l8 10z" fill="#f59e0b" stroke="#78350f" stroke-width="2"/></g>' +
      '<g data-o="uterus"><path d="M146 292q14 16 28 0l-4 18h-20z" fill="#f472b6" stroke="#9d174d" stroke-width="2"/></g>' +
      '<g data-o="ovary"><ellipse cx="132" cy="292" rx="7" ry="5" fill="#fb7185" stroke="#9f1239" stroke-width="2"/><ellipse cx="188" cy="292" rx="7" ry="5" fill="#fb7185" stroke="#9f1239" stroke-width="2"/></g>' +
      '<g data-o="muscle"><ellipse cx="79" cy="170" rx="13" ry="30" fill="#f87171" stroke="#991b1b" stroke-width="2" opacity=".85"/><ellipse cx="241" cy="170" rx="13" ry="30" fill="#f87171" stroke="#991b1b" stroke-width="2" opacity=".85"/></g>' +
      '</svg>';
    function paint(note, cls) {
      var ask = ['Which <b>gland</b> releases the hormone? Click it on the body.', 'Which <b>hormone</b> does it release into the blood?', 'Which <b>target organ</b> has the receptors? Click it.', 'Where are the <b>receptors</b> for ' + job[2].toLowerCase() + '?'][step];
      stage.innerHTML = '<p class="small muted" style="margin-top:0">Signal ' + (q + 1) + ' of ' + list.length + ' · step ' + (step + 1) + ' of 4</p><p class="gm-q">📨 ' + E(job[0]) + '<br><span style="font-size:1rem">' + ask + '</span></p>' +
        '<div class="gm-hw"><div class="gm-bodyw">' + body + '<button type="button" class="gm-bin" data-o="cells" style="width:100%;margin-top:6px">🧫 All body cells</button></div><div class="gm-hside" id="gm-hs"></div></div><p class="gm-fb ' + (cls || '') + '" id="gm-fb" aria-live="polite">' + (note || '') + '</p>';
      var hs = stage.querySelector('#gm-hs'), path = (job.found || []).map(function (x) { return '<li>' + x + '</li>'; }).join('');
      hs.innerHTML = '<ol class="gm-path">' + path + '</ol>';
      if (step === 1) { var opts = shuffle([job[2]].concat(shuffle(HORMONES.filter(function (h) { return h !== job[2]; })).slice(0, 3))); hs.innerHTML += '<div class="gm-bins">' + opts.map(function (h, i) { return '<button type="button" class="gm-bin" data-h="' + E(h) + '"><kbd>' + (i + 1) + '</kbd> ' + E(h) + '</button>'; }).join('') + '</div>'; }
      if (step === 3) hs.innerHTML += '<div class="gm-bins"><button type="button" class="gm-bin" data-r="m"><kbd>1</kbd> In the cell membrane (transmembrane receptor)</button><button type="button" class="gm-bin" data-r="i"><kbd>2</kbd> Inside the cell (intracellular receptor)</button></div>';
      var parts = stage.querySelectorAll('[data-o]');
      parts.forEach(function (p, i) { if (p.tagName.toLowerCase() === 'g') { p.setAttribute('tabindex', '0'); p.setAttribute('role', 'button'); p.setAttribute('aria-label', 'Organ ' + (i + 1)); } p.onclick = function () { pickOrgan(p.getAttribute('data-o')); }; p.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickOrgan(p.getAttribute('data-o')); } }; });
      stage.querySelectorAll('[data-h]').forEach(function (b) { b.onclick = function () { pickH(b.getAttribute('data-h')); }; });
      stage.querySelectorAll('[data-r]').forEach(function (b) { b.onclick = function () { pickR(b.getAttribute('data-r')); }; });
      lock = false;
    }
    function good(txt, pts) { (job.found = job.found || []).push(txt); step++; if (step > 3) { q++; lock = true; paint('✓ ' + job[5] + ' +' + pts, 'ok'); setTimeout(next, 2300); } else paint('✓ +' + pts, 'ok'); }
    function bad(txt) { addScore(false); var fb = stage.querySelector('#gm-fb'); fb.className = 'gm-fb no'; fb.textContent = '✗ ' + txt; stage.classList.add('gm-shake'); setTimeout(function () { stage.classList.remove('gm-shake'); }, 400); }
    function pickOrgan(o) {
      if (lock) return;
      if (step === 0) { if (o === job[1]) good('Gland: ' + ORGNAME[o], addScore(true, 15)); else bad('That is the ' + ORGNAME[o] + '. Which gland makes the hormone for this job?'); }
      else if (step === 2) { if (job[3].indexOf(o) >= 0) good('Target: ' + ORGNAME[o], addScore(true, 15)); else bad('The ' + ORGNAME[o] + ' is not the main target here.'); }
    }
    function pickH(h) { if (lock || step !== 1) return; if (h === job[2]) good('Hormone: ' + h, addScore(true, 15)); else bad(h + ' does a different job.'); }
    function pickR(r) { if (lock || step !== 3) return; if (r === job[4]) good('Receptor: ' + (r === 'm' ? 'transmembrane (hydrophilic hormone)' : 'intracellular (hydrophobic hormone)'), addScore(true, 15)); else bad(job[4] === 'm' ? job[2] + ' is hydrophilic: it cannot cross the membrane, so its receptor is in the membrane.' : job[2] + ' is hydrophobic: it passes through the membrane to a receptor inside the cell.'); }
    function next() { if (!RUN) return; if (q >= list.length) return finish(); job = list[q].slice(); job.found = []; step = 0; paint(); }
    RUN.keys = function (e) { var n = +e.key; if (!n) return; var b = stage.querySelectorAll('[data-h],[data-r]')[n - 1]; if (b) b.click(); };
    next();
  }

  /* ------------------------------------------------------------------ the end of a game: stars, XP, badges */
  function finish() {
    if (!RUN || RUN.over) return; RUN.over = true; clearInterval(RUN.tick);
    var g = RUN.g, sc = RUN.score, stars = sc >= g.stars[2] ? 3 : sc >= g.stars[1] ? 2 : sc >= g.stars[0] ? 1 : 0, isDaily = g === daily();
    var xp = Math.round(sc / 10) + 5 + stars * 5; if (isDaily) xp *= 2;
    var before = P.badges.slice(), newBest = sc > (P.best[g.id] || 0);
    P.xp += xp; P.total = (P.total || 0) + 1; P.plays[g.id] = (P.plays[g.id] || 0) + 1; if (newBest) P.best[g.id] = sc; P.stars[g.id] = Math.max(P.stars[g.id] || 0, stars);
    P.subj[g.subj] = (P.subj[g.subj] || 0) + 1; if (P.days.indexOf(today()) < 0) P.days.push(today()); P.days = P.days.slice(-60);
    var give = function (k) { if (P.badges.indexOf(k) < 0) P.badges.push(k); }, st = streak();
    give('first'); if (P.total >= 10) give('ten'); if (P.total >= 50) give('fifty'); if (!RUN.wrong && RUN.right >= 3) give('perfect'); if (RUN.maxCombo >= 10) give('combo10'); if (stars === 3) give('star3');
    if (st >= 3) give('streak3'); if (st >= 7) give('streak7'); if (isDaily) give('daily'); if (Object.keys(SUBJ).every(function (k) { return P.subj[k]; })) give('allround');
    Object.keys(SUBJ).forEach(function (k) { if (GAMES.filter(function (x) { return x.subj === k; }).every(function (x) { return P.stars[x.id] >= 1; })) give(k); });
    if (P.xp >= 1000) give('xp1000'); if (P.xp >= 5000) give('xp5000'); if (GAMES.every(function (x) { return P.stars[x.id] === 3; })) give('collector');
    save(); cloudSave(g.id, sc, stars, xp);
    var nb = P.badges.filter(function (b) { return before.indexOf(b) < 0; }).map(function (k) { return BADGES.filter(function (b) { return b[0] === k; })[0]; });
    var L = level(P.xp), Lb = level(P.xp - xp), stage = app.querySelector('#gm-stage'), acc = RUN.right + RUN.wrong ? Math.round(RUN.right / (RUN.right + RUN.wrong) * 100) : 0;
    stage.innerHTML = '<div class="gm-end"><h2 style="margin:0">' + (stars === 3 ? 'Outstanding!' : stars === 2 ? 'Great work!' : stars === 1 ? 'Well done!' : 'Good try. Play again to earn a star!') + '</h2>' +
      '<div class="bigstars" aria-label="' + stars + ' of 3 stars">' + starsHtml(stars) + '</div><p style="font-size:1.3rem;margin:0"><b>' + sc + '</b> points' + (newBest ? ' · 🏆 new best!' : ' · best ' + (P.best[g.id] || 0)) + '</p>' +
      '<p class="small muted">' + RUN.right + ' right' + (g.type === 'memory' ? '' : ' · ' + RUN.wrong + ' wrong · ' + acc + '% accuracy') + ' · best combo ' + RUN.maxCombo + '</p>' +
      '<span class="xp">+' + xp + ' XP' + (isDaily ? ' (×2 daily challenge)' : '') + '</span>' + (L.n > Lb.n ? '<p style="font-size:1.2rem;font-weight:800;color:#7c3aed">⬆️ Level ' + L.n + ': ' + E(L.title) + '!</p>' : '<p class="small">' + (L.to - P.xp) + ' XP to level ' + (L.n + 1) + '</p>') +
      (nb.length ? '<p style="margin:10px 0 0"><b>New badge' + (nb.length > 1 ? 's' : '') + '</b></p><div class="newb">' + nb.map(function (b) { return '<span>' + b[1] + ' ' + E(b[2]) + '</span>'; }).join('') + '</div>' : '') +
      '<p class="small muted">To earn ' + (stars < 3 ? (stars + 1) + ' star' + (stars ? 's' : '') + ': score ' + g.stars[stars] : 'every badge: try the other games') + '.</p>' +
      '<div class="gm-acts"><button class="btn main" type="button" id="gm-again">↻ Play again</button><button class="btn" type="button" id="gm-hub">All games</button></div></div>';
    stage.querySelector('#gm-again').onclick = function () { play(g.id); }; stage.querySelector('#gm-hub').onclick = function () { location.hash = ''; };
    stage.querySelector('#gm-again').focus({ preventScroll: true });
    var tw = app.querySelector('#gm-tw'), tl = app.querySelector('#gm-tl'); if (tw) tw.hidden = true; if (tl) tl.hidden = true;
    sayLive('Game over. ' + sc + ' points, ' + stars + ' stars, ' + xp + ' XP.'); if (stars >= 2 || nb.length || L.n > Lb.n) confetti();
    RUN.keys = function () {};
  }

  /* ------------------------------------------------------------------ cloud save (signed-in players, migration 047) */
  function cloudSave(game, score, stars, xp) {
    if (!CLOUD) return;
    S.db.rpc('game_save', { p_game: game, p_score: score, p_stars: stars, p_xp: xp, p_badges: P.badges, p_days: P.days.slice(-14) }).then(function (r) { if (r.error) console.warn('game_save', r.error.message); });
  }
  function cloudLoad() {
    return S.db.rpc('game_me').then(function (r) {
      if (r.error) return; CLOUD = true; var d = r.data || {};
      (d.games || []).forEach(function (x) { P.best[x.game] = Math.max(P.best[x.game] || 0, x.best || 0); P.stars[x.game] = Math.max(P.stars[x.game] || 0, x.stars || 0); P.plays[x.game] = Math.max(P.plays[x.game] || 0, x.plays || 0); });
      P.xp = Math.max(P.xp, d.xp || 0); P.total = Math.max(P.total || 0, d.plays || 0);
      (d.badges || []).forEach(function (b) { if (P.badges.indexOf(b) < 0) P.badges.push(b); }); (d.days || []).forEach(function (x) { if (P.days.indexOf(x) < 0) P.days.push(x); }); P.days.sort();
      save();
      // anything earned on this device before signing in goes to the account once
      if ((P.xp || 0) > (d.xp || 0) || P.badges.length > (d.badges || []).length) S.db.rpc('game_merge', { p_xp: P.xp, p_badges: P.badges, p_days: P.days.slice(-14), p_best: P.best, p_stars: P.stars }).then(function () {}, function () {});
    }, function () {});
  }

  /* ------------------------------------------------------------------ routing */
  function route() { var h = location.hash.replace(/^#/, ''), m = /^play\/([\w-]+)$/.exec(h); if (m) play(m[1]); else hub(); }
  window.addEventListener('hashchange', route);
  window.BV_GAMES = { GAMES: GAMES, GEN: GEN, EQS: EQS, ELEMENTS: ELEMENTS, level: level, P: function () { return P; }, run: function () { return RUN; } };   // for tests
  route();
  if (S && S.on) S.me().then(function (me) { ME = me; if (!me) return; return cloudLoad().then(function () { if (!/^#play/.test(location.hash)) hub(); }); }).catch(function () {});
})();
