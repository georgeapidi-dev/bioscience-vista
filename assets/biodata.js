/* BioData Lab · BioscienceVista · by BioscienceVista (phase 8)
   Explore real, published biological datasets: read the source, look at the data, graph it and run the right statistical test.
   Every dataset is a real, citable dataset (files in /assets/biodata/, exported unchanged from the sources named below).
   Statistics come from the VISTA Research Hub library (research-stats.js, checked against SciPy). Nothing here is invented. */
(function () {
  var app = document.getElementById('app'), R = window.RStats; if (!app) return;
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var PAL = ['#0D9488', '#E11D48', '#7C3AED', '#F59E0B', '#0284C7', '#16A34A', '#DB2777', '#EA580C', '#475569', '#65A30D'];
  var SETS = [
    { key: 'penguins', name: 'Palmer penguins', icon: '🐧', topic: 'Ecology · Evolution · Variation', lv: 'MYP 3–5 · IGCSE · IB DP',
      blurb: 'Bill, flipper and body measurements of 344 adult Adélie, Chinstrap and Gentoo penguins on three islands near Palmer Station, Antarctica (2007–2009).',
      source: 'Gorman, K. B., Williams, T. D. and Fraser, W. R. (2014). Ecological sexual dimorphism and environmental variability within a community of Antarctic penguins (genus Pygoscelis). PLoS ONE 9(3): e90081. Data packaged by Horst, A. M., Hill, A. P. and Gorman, K. B. (2020), palmerpenguins.',
      licence: 'CC0 (public domain)', link: 'https://allisonhorst.github.io/palmerpenguins/',
      vars: { species: ['Species', '', 'cat'], island: ['Island', '', 'cat'], bill_length_mm: ['Bill length', 'mm'], bill_depth_mm: ['Bill depth', 'mm'], flipper_length_mm: ['Flipper length', 'mm'], body_mass_g: ['Body mass', 'g'], sex: ['Sex', '', 'cat'], year: ['Year of study', '', 'cat'] },
      q: [['Do the three species differ in flipper length?', { chart: 'box', y: 'flipper_length_mm', g: 'species' }], ['Is body mass correlated with flipper length?', { chart: 'scatter', x: 'flipper_length_mm', y: 'body_mass_g', g: 'species' }],
        ['Are males heavier than females (sexual dimorphism)?', { chart: 'bar', y: 'body_mass_g', g: 'sex' }], ['Is species independent of island?', { chart: 'count', x: 'species', g: 'island' }], ['Simpson\'s paradox: bill length against bill depth, with and without species', { chart: 'scatter', x: 'bill_length_mm', y: 'bill_depth_mm', g: 'species' }]] },
    { key: 'iris', name: 'Iris flowers', icon: '🌸', topic: 'Classification · Variation', lv: 'MYP 3–5 · IGCSE · IB DP',
      blurb: 'Sepal and petal measurements of 50 flowers from each of three iris species, collected in the Gaspé Peninsula and used by Fisher to develop discriminant analysis.',
      source: 'Anderson, E. (1935). The irises of the Gaspé Peninsula. Bulletin of the American Iris Society 59: 2–5. Fisher, R. A. (1936). The use of multiple measurements in taxonomic problems. Annals of Eugenics 7(2): 179–188.',
      licence: 'Public domain', link: 'https://archive.ics.uci.edu/dataset/53/iris',
      vars: { sepal_length_cm: ['Sepal length', 'cm'], sepal_width_cm: ['Sepal width', 'cm'], petal_length_cm: ['Petal length', 'cm'], petal_width_cm: ['Petal width', 'cm'], species: ['Species', '', 'cat'] },
      q: [['Which measurement best separates the species?', { chart: 'box', y: 'petal_length_cm', g: 'species' }], ['How are petal length and width related?', { chart: 'scatter', x: 'petal_length_cm', y: 'petal_width_cm', g: 'species' }], ['Is sepal width normally distributed?', { chart: 'hist', y: 'sepal_width_cm' }]] },
    { key: 'toothgrowth', name: 'Vitamin C and tooth growth', icon: '🦷', topic: 'Nutrition · Experimental design', lv: 'MYP 4–5 · IGCSE · IB DP',
      blurb: 'Length of odontoblasts (cells that make dentine) in 60 guinea pigs given one of three doses of vitamin C, as orange juice or as ascorbic acid.',
      source: 'Crampton, E. W. (1947). The growth of the odontoblast of the incisor teeth as a criterion of vitamin C intake of the guinea pig. Journal of Nutrition 33(5): 491–504. Distributed with R (datasets: ToothGrowth).',
      licence: 'Public domain (R datasets)', link: 'https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/ToothGrowth.html',
      vars: { len: ['Odontoblast length', 'µm (scaled)'], supp: ['Supplement', '', 'cat', { VC: 'ascorbic acid', OJ: 'orange juice' }], dose: ['Dose', 'mg/day', 'cat'] },
      q: [['Does a higher dose of vitamin C give longer odontoblasts?', { chart: 'bar', y: 'len', g: 'dose' }], ['Is orange juice better than ascorbic acid at 0.5 mg/day?', { chart: 'box', y: 'len', g: 'supp', where: ['dose', '0.5'] }], ['At 2 mg/day, does the supplement still matter?', { chart: 'box', y: 'len', g: 'supp', where: ['dose', '2'] }]] },
    { key: 'plantgrowth', name: 'Plant growth treatments', icon: '🌱', topic: 'Plants · Experimental design', lv: 'MYP 3–5 · IGCSE · IB DP',
      blurb: 'Dried weight of 30 plants: a control group and two different treatment conditions, 10 plants each.',
      source: 'Dobson, A. J. (1983). An Introduction to Statistical Modelling. London: Chapman and Hall. Distributed with R (datasets: PlantGrowth).',
      licence: 'Public domain (R datasets)', link: 'https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/PlantGrowth.html',
      vars: { weight: ['Dried weight', 'g'], group: ['Group', '', 'cat', { ctrl: 'control', trt1: 'treatment 1', trt2: 'treatment 2' }] },
      q: [['Do the treatments change plant mass compared with the control?', { chart: 'bar', y: 'weight', g: 'group' }], ['Compare only treatment 1 and treatment 2', { chart: 'box', y: 'weight', g: 'group', where: ['group', '!ctrl'] }]] },
    { key: 'chickwts', name: 'Chick feed supplements', icon: '🐥', topic: 'Nutrition · Agriculture', lv: 'MYP 3–5 · IGCSE · IB DP',
      blurb: 'Weights of 71 newly hatched chicks after six weeks on one of six feed supplements.',
      source: 'Anonymous (1948). Biometrika 35: 214. Distributed with R (datasets: chickwts).',
      licence: 'Public domain (R datasets)', link: 'https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/chickwts.html',
      vars: { weight: ['Weight after 6 weeks', 'g'], feed: ['Feed supplement', '', 'cat'] },
      q: [['Which feed supplement gives the heaviest chicks?', { chart: 'bar', y: 'weight', g: 'feed' }], ['Casein or horsebean?', { chart: 'box', y: 'weight', g: 'feed', where: ['feed', 'casein|horsebean'] }]] },
    { key: 'insectsprays', name: 'Insecticide field trial', icon: '🦟', topic: 'Ecology · Agriculture', lv: 'MYP 3–5 · IGCSE · IB DP',
      blurb: 'Counts of insects in 72 agricultural experimental units treated with six different insecticides (A–F), 12 units each.',
      source: 'Beall, G. (1942). The transformation of data from entomological field experiments. Biometrika 29: 243–262. Distributed with R (datasets: InsectSprays).',
      licence: 'Public domain (R datasets)', link: 'https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/InsectSprays.html',
      vars: { count: ['Insects counted', ''], spray: ['Insecticide', '', 'cat'] },
      q: [['Which insecticide is most effective?', { chart: 'box', y: 'count', g: 'spray' }], ['Are counts normally distributed? (try a non-parametric test)', { chart: 'hist', y: 'count' }]] },
    { key: 'puromycin', name: 'Enzyme kinetics: puromycin', icon: '🧪', topic: 'Enzymes · Molecular biology', lv: 'IB DP · A Level',
      blurb: 'Initial rate of an enzyme reaction (galactosyltransferase in Golgi membranes) at different substrate concentrations, in cells treated or not treated with puromycin.',
      source: 'Treloar, M. A. (1974). Effects of Puromycin on Galactosyltransferase in Golgi Membranes. M.Sc. Thesis, University of Toronto. Data from Bates, D. M. and Watts, D. G. (1988), Nonlinear Regression Analysis and Its Applications; distributed with R (datasets: Puromycin).',
      licence: 'Public domain (R datasets)', link: 'https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/Puromycin.html',
      vars: { conc: ['Substrate concentration', 'ppm'], rate: ['Initial rate', 'counts/min/min'], state: ['Cells', '', 'cat'] }, mm: true,
      q: [['How does rate change with substrate concentration?', { chart: 'scatter', x: 'conc', y: 'rate', g: 'state' }], ['Find Vmax and Km (Lineweaver–Burk)', { chart: 'mm', x: 'conc', y: 'rate', g: 'state' }]] },
    { key: 'maunaloa', name: 'Mauna Loa carbon dioxide', icon: '🌍', topic: 'Climate change · Carbon cycle', lv: 'MYP 3–5 · IGCSE · IB DP · ESS',
      blurb: 'Monthly atmospheric CO₂ concentration measured at Mauna Loa Observatory, Hawaii, 1959–1997 (the Keeling curve).',
      source: 'Keeling, C. D. and Whorf, T. P., Scripps Institution of Oceanography (SIO), University of California. Monthly values 1959–1997 distributed with R (datasets: co2). Current data: NOAA Global Monitoring Laboratory.',
      licence: 'Public domain (R datasets)', link: 'https://gml.noaa.gov/ccgg/trends/',
      vars: { decimal_year: ['Date', 'year'], year: ['Year', ''], month: ['Month', '', 'cat'], co2_ppm: ['CO₂ concentration', 'ppm'] },
      q: [['How fast has CO₂ risen?', { chart: 'line', x: 'decimal_year', y: 'co2_ppm' }], ['The yearly cycle: which months have the most CO₂ and why?', { chart: 'bar', y: 'co2_ppm', g: 'month', where: ['year', '1990|1991|1992|1993|1994|1995|1996|1997'] }]] },
    { key: 'burtin', name: 'Antibiotics and bacteria', icon: '💊', topic: 'Microbiology · Medicine', lv: 'IGCSE · IB DP · A Level',
      blurb: 'Minimum inhibitory concentration (MIC) of penicillin, streptomycin and neomycin needed to stop the growth of 16 bacteria, with their Gram stain. The lower the MIC, the more effective the antibiotic.',
      source: 'Data behind Will Burtin\'s 1951 antibiotics graphic (Scope magazine, Upjohn). Redistributed in the Vega datasets collection (burtin.json).',
      licence: 'Public (Vega datasets, BSD-3)', link: 'https://github.com/vega/vega-datasets',
      vars: { Bacteria: ['Bacterium', '', 'cat'], Penicillin: ['Penicillin MIC', 'µg/ml'], Streptomycin: ['Streptomycin MIC', 'µg/ml'], Neomycin: ['Neomycin MIC', 'µg/ml'], Gram_Staining: ['Gram stain', '', 'cat'], Genus: ['Genus', '', 'cat'] }, logy: true,
      q: [['Does penicillin work better on Gram-positive bacteria?', { chart: 'box', y: 'Penicillin', g: 'Gram_Staining' }], ['Does neomycin work on both Gram-positive and Gram-negative bacteria?', { chart: 'box', y: 'Neomycin', g: 'Gram_Staining' }], ['Does streptomycin resistance go with penicillin resistance?', { chart: 'scatter', x: 'Penicillin', y: 'Streptomycin', g: 'Gram_Staining' }]] },
    { key: 'barley', name: 'Barley varieties and sites', icon: '🌾', topic: 'Agriculture · Genetics and environment', lv: 'MYP 4–5 · IGCSE · IB DP',
      blurb: 'Yields of 10 barley varieties grown at 6 sites in Minnesota in 1931 and 1932.',
      source: 'Immer, F. R., Hayes, H. K. and Powers, L. (1934). Statistical determination of barley varietal adaptation. Journal of the American Society of Agronomy 26: 403–419. Redistributed in the Vega datasets collection.',
      licence: 'Public (Vega datasets, BSD-3)', link: 'https://github.com/vega/vega-datasets',
      vars: { yield: ['Yield', 'bushels/acre'], variety: ['Variety', '', 'cat'], year: ['Year', '', 'cat'], site: ['Site', '', 'cat'] },
      q: [['Does the site (environment) affect yield more than the variety (genes)?', { chart: 'bar', y: 'yield', g: 'site' }], ['Which variety has the highest yield?', { chart: 'bar', y: 'yield', g: 'variety' }], ['Did yield change between 1931 and 1932?', { chart: 'box', y: 'yield', g: 'year' }]] }
  ];
  var ST = { set: null, data: null, cfg: { chart: 'box', x: '', y: '', g: '' }, where: null };

  var CSS = '.bd-hero{margin:8px 0 16px;padding:24px;border-radius:20px;color:#fff;background:linear-gradient(130deg,#0D9488,#0284C7 50%,#7C3AED)}.bd-hero h1{margin:4px 0 6px;color:#fff}.bd-hero p{margin:0;color:#fff;max-width:70ch}' +
    '.bd-sets{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}.bd-set{display:grid;gap:4px;text-align:left;padding:14px;border-radius:16px;border:2px solid #CCFBF1;background:#fff;cursor:pointer;color:inherit;font:inherit}.bd-set:hover,.bd-set[aria-pressed=true]{border-color:#0D9488;box-shadow:0 6px 18px rgba(13,148,136,.15)}.bd-set .ic{font-size:1.8rem}.bd-set small{color:#64748b}' +
    '.bd-card{background:var(--card,#fff);border:1px solid var(--line,#e5e7eb);border-radius:16px;padding:16px;margin:14px 0}.bd-card h3{margin:0 0 8px}.bd-row{display:flex;gap:10px;flex-wrap:wrap;align-items:end}.bd-row label{display:grid;gap:3px;font-size:.88rem}.bd-row select{padding:7px 9px;border-radius:9px;border:1px solid #cbd5e1;font:inherit}' +
    '.bd-q{display:flex;flex-wrap:wrap;gap:8px}.bd-q button{border:1px solid #C7D2FE;background:#EEF2FF;color:#3730A3;border-radius:999px;padding:6px 12px;cursor:pointer;font:inherit;font-size:.9rem;text-align:left}.bd-q button:hover{background:#E0E7FF}' +
    '.bd-two{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(260px,1fr);gap:14px}@media(max-width:900px){.bd-two{grid-template-columns:1fr}}.bd-svg{width:100%;height:auto;background:#fff;border-radius:12px}' +
    '.bd-tbl{border-collapse:collapse;font-size:.85rem;width:100%}.bd-tbl th,.bd-tbl td{border:1px solid #e2e8f0;padding:4px 7px;text-align:left}.bd-tbl th{background:#F0FDFA}.bd-tw{max-height:360px;overflow:auto}' +
    '.bd-res{padding:10px 12px;border-radius:12px;background:#F0FDFA;border:1px solid #99F6E4;margin:8px 0}.bd-res.no{background:#FFF7ED;border-color:#FED7AA}.bd-muted{color:#64748b;font-size:.88rem}';

  function css() { if (!document.getElementById('bd-css')) { var s = document.createElement('style'); s.id = 'bd-css'; s.textContent = CSS; document.head.appendChild(s); } }
  function V(k) { return (ST.set.vars[k] || [k, '']); } function isCat(k) { return (V(k)[2] === 'cat'); } function lab(k) { var v = V(k); return v[0] + (v[1] ? ' / ' + v[1] : ''); }
  function nice(k, val) { var m = V(k)[3]; return m && m[val] ? m[val] + ' (' + val + ')' : String(val); }
  function fmt(x, s) { return isFinite(x) ? R.sig(x, s || 3) : '–'; }
  function pval(p) { return p < 0.001 ? 'p < 0.001' : 'p = ' + R.sig(p, 2); }

  function home() {
    css();
    app.innerHTML = '<section class="bd-hero"><p class="vx-eye" style="color:#FDE68A">Data science for biology</p><h1>📊 BioData Lab</h1><p>Explore real, published biological data. Choose a dataset, ask a question, draw the graph and run the right statistical test, then use what you find in your own investigation.</p></section>' +
      '<div class="bd-sets" role="group" aria-label="Datasets">' + SETS.map(function (s) { return '<button class="bd-set" data-k="' + s.key + '" aria-pressed="' + (ST.set && ST.set.key === s.key) + '"><span class="ic" aria-hidden="true">' + s.icon + '</span><b>' + E(s.name) + '</b><small>' + E(s.topic) + '</small><small>' + E(s.lv) + '</small></button>'; }).join('') + '</div><div id="bd-ws"></div>';
    [].forEach.call(app.querySelectorAll('.bd-set'), function (b) { b.onclick = function () { open(b.getAttribute('data-k')); }; });
    var k = new URLSearchParams(location.search).get('d') || (location.hash.slice(1) || ''); if (k && SETS.some(function (s) { return s.key === k; })) open(k);
  }

  function open(key) {
    ST.set = SETS.filter(function (s) { return s.key === key; })[0]; ST.where = null;
    [].forEach.call(app.querySelectorAll('.bd-set'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-k') === key)); });
    history.replaceState(null, '', '#' + key);
    var ws = document.getElementById('bd-ws'); ws.innerHTML = '<p class="bd-muted">Loading the data…</p>';
    fetch('/assets/biodata/' + key + '.json').then(function (r) { return r.json(); }).then(function (d) {
      ST.data = d.rows.map(function (r) { var o = {}; d.columns.forEach(function (c, i) { o[c] = r[i]; }); return o; }); ST.cols = d.columns;
      var nums = ST.cols.filter(function (c) { return !isCat(c); }), cats = ST.cols.filter(isCat);
      ST.cfg = { chart: cats.length ? 'box' : 'line', x: nums[0], y: nums[nums.length - 1], g: cats[0] || '' };
      if (ST.set.q.length) apply(ST.set.q[0][1], true);
      workspace(); ws.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, function () { ws.innerHTML = '<p class="bd-res no">Could not load this dataset. Check your connection and try again.</p>'; });
  }
  function apply(c, quiet) { ST.cfg = { chart: c.chart, x: c.x || ST.cfg.x, y: c.y || ST.cfg.y, g: c.g === undefined ? '' : c.g }; ST.where = c.where || null; if (!quiet) workspace(); }

  function rows() {
    if (!ST.where) return ST.data;
    var k = ST.where[0], v = ST.where[1], neg = v[0] === '!', opts = (neg ? v.slice(1) : v).split('|');
    return ST.data.filter(function (r) { var hit = opts.indexOf(String(r[k])) >= 0; return neg ? !hit : hit; });
  }

  function workspace() {
    var s = ST.set, c = ST.cfg, nums = ST.cols.filter(function (k) { return !isCat(k); }), cats = ST.cols.filter(isCat), ws = document.getElementById('bd-ws');
    var opt = function (list, sel, none) { return (none ? '<option value="">' + none + '</option>' : '') + list.map(function (k) { return '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + E(lab(k)) + '</option>'; }).join(''); };
    var charts = [['box', 'Box plot by group'], ['bar', 'Mean ± SD by group'], ['scatter', 'Scatter graph'], ['line', 'Line graph'], ['hist', 'Histogram'], ['count', 'Counts (two categories)']].concat(s.mm ? [['mm', 'Michaelis–Menten (Lineweaver–Burk)']] : []);
    var R2 = rows();
    ws.innerHTML = '<section class="bd-card"><h3>' + s.icon + ' ' + E(s.name) + ' <small class="bd-muted">· ' + ST.data.length + ' records</small></h3><p>' + E(s.blurb) + '</p>' +
      '<details><summary><b>Source, licence and variables</b></summary><p class="bd-muted" style="margin:8px 0">' + E(s.source) + '<br>Licence: ' + E(s.licence) + ' · <a href="' + E(s.link) + '" target="_blank" rel="noopener">about the data</a></p><ul>' + ST.cols.map(function (k) { var v = V(k); return '<li><b>' + E(v[0]) + '</b>' + (v[1] ? ' (' + E(v[1]) + ')' : '') + (v[2] === 'cat' ? ' · category' : ' · number') + ' <code>' + E(k) + '</code></li>'; }).join('') + '</ul></details></section>' +
      '<section class="bd-card"><h3>Questions to investigate</h3><div class="bd-q">' + s.q.map(function (q, i) { return '<button data-q="' + i + '">❓ ' + E(q[0]) + '</button>'; }).join('') + '</div></section>' +
      '<section class="bd-card"><h3>Explore</h3><div class="bd-row"><label>Graph<select id="bd-c">' + charts.map(function (x) { return '<option value="' + x[0] + '"' + (c.chart === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></label>' +
      '<label id="bd-xw">x-axis<select id="bd-x">' + opt(c.chart === 'count' ? cats : nums, c.x) + '</select></label><label id="bd-yw">y-axis (measured)<select id="bd-y">' + opt(nums, c.y) + '</select></label>' +
      '<label>Group by<select id="bd-g">' + opt(cats, c.g, '(no groups)') + '</select></label>' +
      (ST.where ? '<span class="bd-muted">Showing ' + R2.length + ' of ' + ST.data.length + ' records (' + E(V(ST.where[0])[0]) + ': ' + E(ST.where[1].replace(/\|/g, ', ').replace('!', 'not ')) + ') <a href="#" id="bd-all">show all</a></span>' : '') + '</div>' +
      '<div class="bd-two" style="margin-top:12px"><div><svg class="bd-svg" id="bd-svg" viewBox="0 0 640 400" role="img"></svg><div id="bd-leg" class="bd-muted"></div></div><div id="bd-stats"></div></div></section>' +
      '<section class="bd-card"><h3>The data</h3><div class="bd-tw"><table class="bd-tbl"><tr>' + ST.cols.map(function (k) { return '<th>' + E(V(k)[0]) + (V(k)[1] ? ' / ' + E(V(k)[1]) : '') + '</th>'; }).join('') + '</tr>' +
      R2.slice(0, 400).map(function (r) { return '<tr>' + ST.cols.map(function (k) { return '<td>' + (r[k] == null ? '<span class="bd-muted">missing</span>' : E(r[k])) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>' +
      '<div class="bd-row" style="margin-top:10px"><button class="btn sm" id="bd-csv">⬇ Download CSV</button><a class="btn sm" href="/research/#/lab">🧮 Open the Statistics lab</a><a class="btn sm" id="bd-ai" href="#">🤖 Discuss my findings with the AI tutor</a></div></section>';
    var $ = function (q) { return ws.querySelector(q); };
    $('#bd-c').onchange = function () { ST.cfg.chart = this.value; if (this.value === 'count') { ST.cfg.x = cats[0]; ST.cfg.g = cats[1] || cats[0]; } else if (isCat(ST.cfg.x)) ST.cfg.x = nums[0]; workspace(); };
    $('#bd-x').onchange = function () { ST.cfg.x = this.value; workspace(); }; $('#bd-y').onchange = function () { ST.cfg.y = this.value; workspace(); }; $('#bd-g').onchange = function () { ST.cfg.g = this.value; workspace(); };
    if ($('#bd-all')) $('#bd-all').onclick = function (e) { e.preventDefault(); ST.where = null; workspace(); };
    [].forEach.call(ws.querySelectorAll('[data-q]'), function (b) { b.onclick = function () { apply(s.q[+b.getAttribute('data-q')][1]); }; });
    $('#bd-csv').onclick = function () { var lines = [ST.cols.join(',')].concat(R2.map(function (r) { return ST.cols.map(function (k) { var v = r[k] == null ? '' : String(r[k]); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }));
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv' })); a.download = s.key + '.csv'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
    $('#bd-xw').hidden = ['box', 'bar', 'hist'].indexOf(c.chart) >= 0; $('#bd-yw').hidden = c.chart === 'count';
    var res = draw(R2); $('#bd-ai').href = '/tutor/?mode=guide&topic=' + encodeURIComponent('Interpreting real data: ' + s.name + (res ? ' — ' + res : ''));
  }

  /* ---------- graphs and the matching statistics ---------- */
  function groupsOf(R2, g, y) { var out = {}, order = []; R2.forEach(function (r) { if (g && r[g] == null) return; var k = g ? String(r[g]) : 'all', v = r[y]; if (v == null || !isFinite(+v)) return; if (!out[k]) { out[k] = []; order.push(k); } out[k].push(+v); });
    order.sort(function (a, b) { return isFinite(+a) && isFinite(+b) ? +a - +b : a.localeCompare(b); }); return { G: out, order: order }; }
  function axes(svg, x0, x1, y0, y1, xl, yl, catX, logy) {
    var L = 64, Rr = 16, T = 16, B = 52, W = 640 - L - Rr, H = 400 - T - B, h = '';
    function X(v) { return L + (v - x0) / (x1 - x0 || 1) * W; } function Y(v) { if (logy) { v = Math.log10(v); } return T + H - (v - (logy ? Math.log10(y0) : y0)) / ((logy ? Math.log10(y1) - Math.log10(y0) : y1 - y0) || 1) * H; }
    var ty = logy ? (function () { var a = []; for (var e = Math.floor(Math.log10(y0)); e <= Math.ceil(Math.log10(y1)); e++) a.push(Math.pow(10, e)); return a; })() : ticks(y0, y1);
    ty.forEach(function (v) { if (v < y0 - 1e-9 || v > y1 + 1e-9) return; h += '<line x1="' + L + '" x2="' + (L + W) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#E2E8F0"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4) + '" font-size="11" text-anchor="end">' + R.sig(v, 4) + '</text>'; });
    if (!catX) ticks(x0, x1).forEach(function (v) { h += '<line y1="' + T + '" y2="' + (T + H) + '" x1="' + X(v) + '" x2="' + X(v) + '" stroke="#F1F5F9"/><text x="' + X(v) + '" y="' + (T + H + 16) + '" font-size="11" text-anchor="middle">' + R.sig(v, 5) + '</text>'; });
    h += '<line x1="' + L + '" y1="' + (T + H) + '" x2="' + (L + W) + '" y2="' + (T + H) + '" stroke="#334155"/><line x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + (T + H) + '" stroke="#334155"/>' +
      '<text x="' + (L + W / 2) + '" y="394" font-size="12.5" text-anchor="middle" font-weight="600">' + E(xl) + '</text><text x="16" y="' + (T + H / 2) + '" font-size="12.5" text-anchor="middle" font-weight="600" transform="rotate(-90 16 ' + (T + H / 2) + ')">' + E(yl) + (logy ? ' (log scale)' : '') + '</text>';
    return { h: h, X: X, Y: Y, L: L, W: W, T: T, H: H };
  }
  function ticks(a, b) { var r = b - a || 1, p = Math.pow(10, Math.floor(Math.log10(r / 5))), st = [1, 2, 5, 10].map(function (k) { return k * p; }).filter(function (s) { return r / s <= 7; })[0] || p * 10, out = []; for (var v = Math.ceil(a / st) * st; v <= b + st * 1e-9; v += st) out.push(+v.toFixed(10)); return out; }
  function pad(lo, hi, zero) { var r = hi - lo || Math.abs(hi) || 1; lo = zero && lo >= 0 ? 0 : lo - r * 0.06; return [lo, hi + r * 0.08]; }

  function draw(R2) {
    var c = ST.cfg, svg = document.getElementById('bd-svg'), st = document.getElementById('bd-stats'), leg = document.getElementById('bd-leg'), h = '', out = '', summary = '', logy = ST.set.logy && (c.chart === 'box' || c.chart === 'bar' || c.chart === 'scatter');
    var res = function (r, extra) { if (!r || r.error) return '<div class="bd-res no">' + E((r && r.error) || 'Not enough data for this test.') + '</div>'; var sig = r.p < 0.05;
      return '<div class="bd-res' + (sig ? '' : ' no') + '"><b>' + E(r.name) + '</b><br>' + E(r.statName || '') + ' = ' + fmt(r.stat) + (r.df != null ? ', df = ' + (Array.isArray(r.df) ? r.df.join(', ') : fmt(r.df, 4)) : '') + ', ' + pval(r.p) + (extra || '') +
        '<br><small>' + (sig ? 'p < 0.05: the difference or relationship is statistically significant at the 5 % level.' : 'p ≥ 0.05: no statistically significant difference or relationship at the 5 % level.') + '</small></div>'; };
    if (c.chart === 'box' || c.chart === 'bar') {
      var gr = groupsOf(R2, c.g, c.y), ks = gr.order, all = [].concat.apply([], ks.map(function (k) { return gr.G[k]; }));
      if (!all.length) { svg.innerHTML = ''; st.innerHTML = '<p class="bd-res no">No numbers to plot.</p>'; return ''; }
      var D = ks.map(function (k) { return R.describe(gr.G[k]); }), lo = logy ? Math.min.apply(null, all) / 1.5 : Math.min.apply(null, c.chart === 'bar' ? D.map(function (d) { return d.mean - (d.sd || 0); }).concat([0]) : all),
        hi = Math.max.apply(null, c.chart === 'bar' ? D.map(function (d) { return d.mean + (d.sd || 0); }) : all) * (logy ? 1.5 : 1), pr = logy ? [lo, hi] : pad(lo, hi, c.chart === 'bar');
      var A = axes(svg, 0, ks.length, pr[0], pr[1], c.g ? V(c.g)[0] : '', lab(c.y), true, logy), bw = A.W / ks.length; h = A.h;
      ks.forEach(function (k, i) { var d = D[i], cx = A.L + bw * (i + 0.5), col = PAL[i % PAL.length], w = Math.min(60, bw * 0.55);
        if (c.chart === 'box') { h += '<line x1="' + cx + '" x2="' + cx + '" y1="' + A.Y(d.min) + '" y2="' + A.Y(d.max) + '" stroke="' + col + '" stroke-width="2"/><rect x="' + (cx - w / 2) + '" y="' + A.Y(d.q3) + '" width="' + w + '" height="' + Math.max(1, A.Y(d.q1) - A.Y(d.q3)) + '" fill="' + col + '" fill-opacity=".25" stroke="' + col + '" stroke-width="2" rx="4"/><line x1="' + (cx - w / 2) + '" x2="' + (cx + w / 2) + '" y1="' + A.Y(d.median) + '" y2="' + A.Y(d.median) + '" stroke="' + col + '" stroke-width="3"/>';
          gr.G[k].forEach(function (v, j) { h += '<circle cx="' + (cx + ((j * 37) % 21 - 10) * w / 50) + '" cy="' + A.Y(v) + '" r="2.4" fill="' + col + '" fill-opacity=".6"/>'; }); }
        else { var y0 = logy ? A.Y(pr[0]) : A.Y(Math.max(pr[0], 0)); h += '<rect x="' + (cx - w / 2) + '" y="' + A.Y(d.mean) + '" width="' + w + '" height="' + Math.max(0, y0 - A.Y(d.mean)) + '" fill="' + col + '" rx="4"/>';
          if (d.sd) h += '<line x1="' + cx + '" x2="' + cx + '" y1="' + A.Y(d.mean + d.sd) + '" y2="' + A.Y(Math.max(logy ? pr[0] : -Infinity, d.mean - d.sd)) + '" stroke="#0F172A" stroke-width="2"/><line x1="' + (cx - 8) + '" x2="' + (cx + 8) + '" y1="' + A.Y(d.mean + d.sd) + '" y2="' + A.Y(d.mean + d.sd) + '" stroke="#0F172A" stroke-width="2"/>'; }
        h += '<text x="' + cx + '" y="' + (A.T + A.H + 16) + '" font-size="11" text-anchor="middle">' + E(String(nice(c.g, k)).slice(0, 18)) + '</text>'; });
      svg.innerHTML = h; svg.setAttribute('aria-label', (c.chart === 'box' ? 'Box plot' : 'Bar chart of means') + ' of ' + lab(c.y) + (c.g ? ' by ' + V(c.g)[0] : ''));
      leg.textContent = c.chart === 'box' ? 'Boxes show the median and the middle 50 % of values (quartiles); whiskers show the range; dots are individual records.' : 'Bars show the mean; error bars show ± 1 standard deviation.';
      out = '<h4 style="margin:0 0 6px">Descriptive statistics</h4><table class="bd-tbl"><tr><th>' + E(c.g ? V(c.g)[0] : '') + '</th><th>n</th><th>Mean</th><th>SD</th><th>Median</th></tr>' + ks.map(function (k, i) { var d = D[i]; return '<tr><td>' + E(nice(c.g, k)) + '</td><td>' + d.n + '</td><td>' + fmt(d.mean) + '</td><td>' + fmt(d.sd) + '</td><td>' + fmt(d.median) + '</td></tr>'; }).join('') + '</table>';
      var arr = ks.map(function (k) { return gr.G[k]; });
      if (ks.length === 2) { var t = R.tTest(arr[0], arr[1]), mw = R.mannWhitney(arr[0], arr[1]); out += '<h4 style="margin:12px 0 4px">Is the difference significant?</h4>' + res(t) + res(mw) + '<p class="bd-muted">Use the t-test if each group is roughly normally distributed; otherwise use the Mann–Whitney U test.</p>'; summary = ks.join(' vs ') + ': ' + t.name + ' ' + pval(t.p); }
      else if (ks.length > 2) { var an = R.anova(arr), kw = R.kruskal(arr); out += '<h4 style="margin:12px 0 4px">Do the groups differ?</h4>' + res(an) + res(kw) + '<p class="bd-muted">ANOVA assumes normal data with similar spread; Kruskal–Wallis does not. A significant result says at least one group differs: compare pairs to find which (choose two groups with a question, or use the Statistics lab).</p>'; summary = ks.length + ' groups: ANOVA ' + pval(an.p); }
    } else if (c.chart === 'scatter' || c.chart === 'line' || c.chart === 'mm') {
      var mm = c.chart === 'mm', gk = c.g, grp = {}, ord = [];
      R2.forEach(function (r) { var x = +r[c.x], y = +r[c.y]; if (r[c.x] == null || r[c.y] == null || !isFinite(x) || !isFinite(y)) return; if (mm) { if (!x || !y) return; x = 1 / x; y = 1 / y; } if (gk && r[gk] == null) return; var k = gk ? String(r[gk]) : 'all'; if (!grp[k]) { grp[k] = []; ord.push(k); } grp[k].push([x, y]); });
      var pts = [].concat.apply([], ord.map(function (k) { return grp[k]; })); if (!pts.length) { svg.innerHTML = ''; st.innerHTML = '<p class="bd-res no">No numbers to plot.</p>'; return ''; }
      var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; }), px = pad(Math.min.apply(null, xs), Math.max.apply(null, xs), mm), py = logy ? [Math.min.apply(null, ys) / 1.5, Math.max.apply(null, ys) * 1.5] : pad(Math.min.apply(null, ys), Math.max.apply(null, ys), mm);
      var A2 = axes(svg, px[0], px[1], py[0], py[1], mm ? '1 / substrate concentration (1/ppm)' : lab(c.x), mm ? '1 / initial rate' : lab(c.y), false, logy); h = A2.h;
      out = '';
      ord.forEach(function (k, i) { var col = PAL[i % PAL.length], P = grp[k].slice().sort(function (a, b) { return a[0] - b[0]; });
        if (c.chart === 'line') h += '<polyline fill="none" stroke="' + col + '" stroke-width="1.6" points="' + P.map(function (p) { return A2.X(p[0]).toFixed(1) + ',' + A2.Y(p[1]).toFixed(1); }).join(' ') + '"/>';
        else P.forEach(function (p) { h += '<circle cx="' + A2.X(p[0]).toFixed(1) + '" cy="' + A2.Y(p[1]).toFixed(1) + '" r="3.6" fill="' + col + '" fill-opacity=".75"/>'; });
        var x = P.map(function (p) { return p[0]; }), y = P.map(function (p) { return p[1]; }), reg = R.regression(x, y);
        if (!reg.error && !logy) { var xa = px[0], xb = px[1]; h += '<line x1="' + A2.X(xa) + '" y1="' + A2.Y(reg.slope * xa + reg.intercept) + '" x2="' + A2.X(xb) + '" y2="' + A2.Y(reg.slope * xb + reg.intercept) + '" stroke="' + col + '" stroke-width="2" stroke-dasharray="' + (c.chart === 'line' ? '6 4' : '0') + '" opacity=".9"/>'; }
        if (mm && !reg.error) { var vmax = 1 / reg.intercept, km = reg.slope * vmax; out += '<div class="bd-res"><b>' + E(nice(gk, k)) + '</b>: 1/rate = ' + fmt(reg.slope) + ' × (1/[S]) + ' + fmt(reg.intercept) + ' (r² = ' + fmt(reg.r2) + ')<br>V<sub>max</sub> = 1 / intercept ≈ <b>' + fmt(vmax) + '</b> counts/min/min · K<sub>m</sub> = gradient × V<sub>max</sub> ≈ <b>' + fmt(km) + '</b> ppm</div>'; }
        else if (!mm && c.chart === 'scatter') { var pe = R.pearson(x, y), sp = R.spearman(x, y); out += '<h4 style="margin:10px 0 4px">' + E(gk ? nice(gk, k) : 'All records') + ' <small class="bd-muted">(n = ' + x.length + ')</small></h4>' + res(pe, ', r² = ' + fmt(pe.r2)) + res(sp) + (!reg.error ? '<p class="bd-muted">Line of best fit: y = ' + fmt(reg.slope) + 'x + ' + fmt(reg.intercept) + '</p>' : ''); if (!summary) summary = 'Pearson r = ' + fmt(pe.stat) + ', ' + pval(pe.p); }
        else if (c.chart === 'line' && !reg.error) { out += '<div class="bd-res"><b>' + E(gk ? nice(gk, k) : 'Trend') + '</b>: average change ' + fmt(reg.slope) + ' ' + E(V(c.y)[1]) + ' per ' + E(V(c.x)[1] || 'unit') + ' (linear fit, r² = ' + fmt(reg.r2) + ')</div>'; summary = 'trend ' + fmt(reg.slope) + ' per ' + (V(c.x)[1] || 'unit'); }
      });
      if (mm) out = '<h4 style="margin:0 0 6px">Lineweaver–Burk plot</h4><p class="bd-muted">Plotting 1/rate against 1/[S] turns the Michaelis–Menten curve into a straight line: intercept = 1/V<sub>max</sub>, gradient = K<sub>m</sub>/V<sub>max</sub>.</p>' + out + '<p class="bd-muted">Lineweaver–Burk gives extra weight to the lowest concentrations (the points far right), so it differs from a non-linear fit of the Michaelis–Menten equation to the same data: about V<sub>max</sub> 213 and K<sub>m</sub> 0.064 ppm for treated cells, and 160 and 0.048 ppm for untreated cells (Bates and Watts, 1988). Discuss which method is more reliable.</p><p class="bd-muted">Puromycin-treated cells: compare V<sub>max</sub> and K<sub>m</sub> with untreated cells. Which changes more? What might that tell you?</p>';
      if (c.chart === 'scatter' && gk && ord.length > 1) out += '<p class="bd-muted">Correlation does not show cause. Look for a different pattern within groups than across all records (Simpson\'s paradox).</p>';
      svg.innerHTML = h; svg.setAttribute('aria-label', (mm ? 'Lineweaver–Burk plot' : c.chart === 'line' ? 'Line graph' : 'Scatter graph') + ' of ' + lab(c.y) + ' against ' + lab(c.x));
      leg.innerHTML = ord.length > 1 ? ord.map(function (k, i) { return '<span style="color:' + PAL[i % PAL.length] + '">●</span> ' + E(nice(gk, k)); }).join(' &nbsp; ') : '';
    } else if (c.chart === 'hist') {
      var vals = R2.map(function (r) { return +r[c.y]; }).filter(function (v, i) { return R2[i][c.y] != null && isFinite(v); }), d = R.describe(vals), nb = Math.max(5, Math.min(20, Math.round(Math.sqrt(vals.length)) + 1)), lo2 = d.min, w2 = (d.max - d.min) / nb || 1, bins = [];
      for (var i = 0; i < nb; i++) bins.push(0); vals.forEach(function (v) { bins[Math.min(nb - 1, Math.floor((v - lo2) / w2))]++; });
      var A3 = axes(svg, lo2, d.max, 0, Math.max.apply(null, bins) * 1.1, lab(c.y), 'Frequency', false); h = A3.h;
      bins.forEach(function (b, j) { h += '<rect x="' + A3.X(lo2 + j * w2) + '" y="' + A3.Y(b) + '" width="' + Math.max(1, A3.X(lo2 + (j + 1) * w2) - A3.X(lo2 + j * w2) - 1) + '" height="' + (A3.Y(0) - A3.Y(b)) + '" fill="#0D9488" fill-opacity=".8"/>'; });
      svg.innerHTML = h; svg.setAttribute('aria-label', 'Histogram of ' + lab(c.y)); leg.textContent = '';
      var skew = d.sd ? 3 * (d.mean - d.median) / d.sd : 0;
      out = '<h4 style="margin:0 0 6px">Distribution</h4><table class="bd-tbl"><tr><td>n</td><td>' + d.n + '</td></tr><tr><td>Mean</td><td>' + fmt(d.mean) + '</td></tr><tr><td>Median</td><td>' + fmt(d.median) + '</td></tr><tr><td>Standard deviation</td><td>' + fmt(d.sd) + '</td></tr><tr><td>Range</td><td>' + fmt(d.min) + ' – ' + fmt(d.max) + '</td></tr><tr><td>Skew (Pearson, median)</td><td>' + fmt(skew, 2) + '</td></tr></table>' +
        '<p class="bd-muted">' + (Math.abs(skew) < 0.5 ? 'Roughly symmetrical: a parametric test (t-test, ANOVA, Pearson) is reasonable.' : 'Skewed: consider a non-parametric test (Mann–Whitney, Kruskal–Wallis, Spearman).') + '</p>'; summary = 'mean ' + fmt(d.mean) + ', SD ' + fmt(d.sd);
    } else if (c.chart === 'count') {
      var a = c.x, b = c.g || c.x, ra = [], rb = [], T = {};
      R2.forEach(function (r) { if (r[a] == null || r[b] == null) return; var p = String(r[a]), q = String(r[b]); if (ra.indexOf(p) < 0) ra.push(p); if (rb.indexOf(q) < 0) rb.push(q); T[p + '|' + q] = (T[p + '|' + q] || 0) + 1; });
      var tab = ra.map(function (p) { return rb.map(function (q) { return T[p + '|' + q] || 0; }); }), mx = Math.max.apply(null, [].concat.apply([1], tab));
      var A4 = axes(svg, 0, ra.length, 0, mx * 1.1, V(a)[0], 'Count', true); h = A4.h; var bw2 = A4.W / ra.length;
      ra.forEach(function (p, i) { rb.forEach(function (q, j) { var v = tab[i][j], w = bw2 * 0.8 / rb.length, x = A4.L + bw2 * i + bw2 * 0.1 + j * w; h += '<rect x="' + x + '" y="' + A4.Y(v) + '" width="' + (w - 2) + '" height="' + (A4.Y(0) - A4.Y(v)) + '" fill="' + PAL[j % PAL.length] + '" rx="3"/>'; });
        h += '<text x="' + (A4.L + bw2 * (i + 0.5)) + '" y="' + (A4.T + A4.H + 16) + '" font-size="11" text-anchor="middle">' + E(String(nice(a, p)).slice(0, 18)) + '</text>'; });
      svg.innerHTML = h; svg.setAttribute('aria-label', 'Counts of ' + V(a)[0] + ' by ' + V(b)[0]); leg.innerHTML = rb.map(function (q, j) { return '<span style="color:' + PAL[j % PAL.length] + '">■</span> ' + E(nice(b, q)); }).join(' &nbsp; ');
      out = '<h4 style="margin:0 0 6px">Contingency table</h4><table class="bd-tbl"><tr><th></th>' + rb.map(function (q) { return '<th>' + E(nice(b, q)) + '</th>'; }).join('') + '</tr>' + ra.map(function (p, i) { return '<tr><th>' + E(nice(a, p)) + '</th>' + tab[i].map(function (v) { return '<td>' + v + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>';
      if (ra.length > 1 && rb.length > 1 && a !== b) { var cs = R.chiSquare(tab); out += res(cs) + (cs.smallExpected ? '<p class="bd-muted">⚠ ' + cs.smallExpected + ' expected count(s) are below 5, so the chi-squared result is less reliable.</p>' : ''); summary = 'chi-squared ' + pval(cs.p); }
      else out += '<p class="bd-muted">Choose two different categories (x-axis and Group by) to test whether they are independent.</p>';
    }
    st.innerHTML = out + '<p class="bd-muted" style="margin-top:10px">Statistics show patterns, not causes. Think about how the data were collected, the sample size and other variables before you conclude.</p>';
    return summary;
  }
  home();
})();
