/* BioScience Vista Assessment Studio · science tools (window.BVSCI)
   Teachers type the data; the tool works out the answer and writes ready-to-edit questions in the builder's own shape
   (the same items the builder makes by hand: number questions with a tolerance and unit, tables, graphs, sorting, gaps, groups).
   Every calculation is done here in the browser and is shown to the teacher before the questions are added.
     BVSCI.TOOLS                      the list of tools [{id, icon, name, about}]
     BVSCI.open(id, done)             opens the tool's form in a dialog; done(items) receives the builder items
     BVSCI.calc                       the pure calculations (mean, sd, chi-squared, magnification…) used by the tools and the tests
     BVSCI.resources()                the BioScience Vista diagram library (Promise of [{src, title, group}]) */
(function () {
  if (window.BVSCI) return;
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var nums = function (t) { return String(t || '').split(/[\s,;]+/).map(function (x) { return parseFloat(x); }).filter(function (x) { return isFinite(x); }); };
  var round = function (x, dp) { var f = Math.pow(10, dp); return Math.round(x * f) / f; };
  var sig = function (x, n) { if (!x) return 0; var d = Math.ceil(Math.log10(Math.abs(x))), p = n - d, f = Math.pow(10, p); return Math.round(x * f) / f; };

  /* chi-squared critical values at p = 0.05 for 1 to 15 degrees of freedom */
  var CHI05 = [3.84, 5.99, 7.81, 9.49, 11.07, 12.59, 14.07, 15.51, 16.92, 18.31, 19.68, 21.03, 22.36, 23.68, 25.0];
  var UNIT = { m: 1, mm: 1e-3, 'μm': 1e-6, um: 1e-6, nm: 1e-9, cm: 1e-2 };
  var calc = {
    mean: function (a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; },
    sd: function (a) { var m = calc.mean(a); return Math.sqrt(a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (a.length - 1)); },   // sample SD (n − 1), as in IB and A Level
    pct: function (a, b) { return (b - a) / a * 100; },
    chi: function (obs, exp) { return obs.reduce(function (s, o, i) { return s + (o - exp[i]) * (o - exp[i]) / exp[i]; }, 0); },
    expected: function (obs, ratio) { var tot = obs.reduce(function (s, x) { return s + x; }, 0), r = ratio.reduce(function (s, x) { return s + x; }, 0); return ratio.map(function (x) { return tot * x / r; }); },
    crit: function (df) { return CHI05[Math.max(1, Math.min(15, df)) - 1]; },
    mag: function (image, iu, actual, au) { return image * UNIT[iu] / (actual * UNIT[au]); },
    actual: function (image, iu, mag, au) { return image * UNIT[iu] / mag / UNIT[au]; },
    sci: function (x) { if (!x) return '0'; var e = Math.floor(Math.log10(Math.abs(x))), m = x / Math.pow(10, e); return String(sig(m, 3)) + ' × 10' + String(e).split('').map(function (c) { return { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }[c]; }).join(''); },
    slope: function (x1, y1, x2, y2) { return (y2 - y1) / (x2 - x1); }
  };

  /* builder items */
  function num(prompt, value, tol, unit, marks, model, qm) { return { kind: 'number', prompt: prompt, marks: marks || 2, draft: { value: String(value), tol: String(tol), unit: unit || '' }, model: model || '', qm: qm || {} }; }
  function written(prompt, marks, model, points, qm) { return { kind: 'short', prompt: prompt, marks: marks, model: model, points: points.join('\n'), qm: qm || {} }; }
  function group(text, qm) { return { kind: 'info', prompt: text, marks: 0, qm: Object.assign({ group: true }, qm || {}) }; }
  function mdTable(cols, rows) { return '| ' + cols.join(' | ') + ' |\n|' + cols.map(function () { return '---'; }).join('|') + '|\n' + rows.map(function (r) { return '| ' + r.join(' | ') + ' |'; }).join('\n'); }
  var sub = { level: 1 };

  var TOOLS = [
    { id: 'mag', icon: '🔬', name: 'Magnification and actual size', about: 'Microscopy calculations with unit conversion (mm, μm, nm).',
      form: [['what', 'Students calculate', 'select', ['magnification', 'actual size']], ['image', 'Image size (as measured on the picture)', 'number', '45'], ['iu', 'Unit of the image size', 'select', ['mm', 'cm', 'μm']],
        ['other', 'Actual size (for magnification) or magnification (for actual size)', 'number', '15'], ['au', 'Unit of the actual size', 'select', ['μm', 'nm', 'mm']], ['spec', 'What the picture shows', 'text', 'a cheek cell']],
      build: function (v) {
        var im = +v.image, other = +v.other; if (!(im > 0 && other > 0)) throw new Error('Type the two sizes (numbers above zero).');
        if (v.what === 'magnification') { var m = calc.mag(im, v.iu, other, v.au), mr = sig(m, 3);
          return [num('The image of ' + v.spec + ' is ' + im + ' ' + v.iu + ' long. Its actual length is ' + other + ' ' + v.au + '. Calculate the magnification of the image. Show your working. [2]', mr, round(mr * 0.02, 3), '×', 2,
            'magnification = image size ÷ actual size = ' + (im * UNIT[v.iu] / UNIT[v.au]) + ' ' + v.au + ' ÷ ' + other + ' ' + v.au + ' = ×' + mr + ' (convert to the same unit first)', { topic: 'Microscopy', subtopic: 'Magnification', command: 'Calculate', tags: ['microscopy', 'magnification'] })]; }
        var a = calc.actual(im, v.iu, other, v.au), ar = sig(a, 3);
        return [num('The image of ' + v.spec + ' is ' + im + ' ' + v.iu + ' long and the magnification is ×' + other + '. Calculate the actual length in ' + v.au + '. Show your working. [2]', ar, round(ar * 0.02, 4), v.au, 2,
          'actual size = image size ÷ magnification = ' + im + ' ' + v.iu + ' ÷ ' + other + ' = ' + ar + ' ' + v.au, { topic: 'Microscopy', subtopic: 'Actual size', command: 'Calculate', tags: ['microscopy', 'actual size'] })];
      } },
    { id: 'stats', icon: '📊', name: 'Mean and standard deviation', about: 'From a set of repeat readings: mean, standard deviation and what the spread shows.',
      form: [['label', 'What was measured (with unit)', 'text', 'Rate of oxygen production / cm³ min⁻¹'], ['data', 'Readings (separate with commas or spaces)', 'textarea', '4.2, 4.8, 5.1, 4.5, 4.9'], ['dp', 'Decimal places in answers', 'number', '2']],
      build: function (v) {
        var a = nums(v.data), dp = Math.max(0, Math.min(4, +v.dp || 2)); if (a.length < 3) throw new Error('Type at least three readings.');
        var m = round(calc.mean(a), dp), s = round(calc.sd(a), dp), unit = (/\/\s*(.+)$/.exec(v.label) || [])[1] || '', tol = Math.pow(10, -dp);
        return [group('**Data.** A student made ' + a.length + ' repeat measurements.\n' + mdTable(['Trial', v.label], a.map(function (x, i) { return [String(i + 1), String(x)]; })), { topic: 'Statistics', tags: ['data analysis'] }),
          num('Calculate the mean. Give your answer to ' + dp + ' decimal places. [1]', m, tol, unit, 1, 'mean = sum ÷ n = ' + round(a.reduce(function (x, y) { return x + y; }, 0), 4) + ' ÷ ' + a.length + ' = ' + m, Object.assign({ topic: 'Statistics', subtopic: 'Mean', command: 'Calculate' }, sub)),
          num('Calculate the standard deviation of the readings. Give your answer to ' + dp + ' decimal places. [2]', s, tol, unit, 2, 'sample standard deviation (n − 1) = ' + s, Object.assign({ topic: 'Statistics', subtopic: 'Standard deviation', command: 'Calculate' }, sub)),
          written('Suggest what the standard deviation shows about the reliability of these readings. [2]', 2, 'A small standard deviation (' + s + ', about ' + Math.round(s / m * 100) + '% of the mean) shows the readings are close to the mean, so the data are reliable / repeatable.',
            ['small standard deviation compared with the mean: small / low', 'readings close to the mean / little spread: close / spread / clustered', 'reliable / repeatable / precise: reliable / repeatable / precise'], Object.assign({ topic: 'Statistics', subtopic: 'Reliability', command: 'Suggest' }, sub))];
      } },
    { id: 'chi', icon: 'χ²', name: 'Chi-squared test', about: 'Observed counts against an expected ratio: χ², degrees of freedom, critical value and conclusion.',
      form: [['cats', 'Categories (separate with commas)', 'text', 'purple smooth, purple wrinkled, yellow smooth, yellow wrinkled'], ['obs', 'Observed counts (same order)', 'text', '315, 101, 108, 32'], ['ratio', 'Expected ratio (same order)', 'text', '9, 3, 3, 1'], ['context', 'Context', 'text', 'a dihybrid cross of maize']],
      build: function (v) {
        var cats = String(v.cats).split(',').map(function (x) { return x.trim(); }).filter(Boolean), o = nums(v.obs), r = nums(v.ratio);
        if (cats.length < 2 || o.length !== cats.length || r.length !== cats.length) throw new Error('Give the same number of categories, observed counts and ratio numbers (at least two).');
        var e = calc.expected(o, r), x2 = round(calc.chi(o, e), 2), df = cats.length - 1, cv = calc.crit(df), sigd = x2 > cv;
        return [group('**Data.** In ' + v.context + ', the expected ratio was ' + r.join(' : ') + '. The results were:\n' + mdTable(['Phenotype', 'Observed (O)'], cats.map(function (c, i) { return [c, String(o[i])]; })) + '\nCritical values of χ² at p = 0.05: 1 df 3.84 · 2 df 5.99 · 3 df 7.81 · 4 df 9.49', { topic: 'Genetics', tags: ['chi-squared', 'statistics'] }),
          { kind: 'table', prompt: 'Complete the expected (E) column of the table. [' + cats.length + ']', marks: cats.length, draft: { cols: 'Phenotype, Observed (O), Expected (E)', rows: cats.map(function (c, i) { return c.replace(/\|/g, '/') + ' | ' + o[i] + ' | [' + round(e[i], 2) + '|' + round(e[i], 1) + '|' + Math.round(e[i]) + ']'; }).join('\n') }, qm: Object.assign({ topic: 'Genetics', subtopic: 'Chi-squared', command: 'Calculate' }, sub) },
          num('Calculate the value of χ² = Σ (O − E)² ⁄ E. [2]', x2, round(Math.max(0.05, x2 * 0.02), 2), '', 2, 'χ² = ' + cats.map(function (c, i) { return '(' + o[i] + ' − ' + round(e[i], 2) + ')²/' + round(e[i], 2); }).join(' + ') + ' = ' + x2, Object.assign({ topic: 'Genetics', subtopic: 'Chi-squared', command: 'Calculate' }, sub)),
          num('State the number of degrees of freedom. [1]', df, 0, '', 1, 'degrees of freedom = number of categories − 1 = ' + df, Object.assign({ topic: 'Genetics', subtopic: 'Chi-squared', command: 'State' }, sub)),
          { kind: 'mcq', prompt: 'The critical value at p = 0.05 is ' + cv + '. Which conclusion is correct?', marks: 1, options: ['The difference is significant: reject the null hypothesis; the results do not fit the expected ratio.', 'The difference is not significant: accept the null hypothesis; the results fit the expected ratio.', 'The test cannot be used because the counts are too large.', 'The ratio is proved to be exactly ' + r.join(' : ') + '.'], correct: sigd ? 0 : 1,
            explanation: 'χ² = ' + x2 + (sigd ? ' is greater than ' : ' is less than ') + cv + ' (' + df + ' df, p = 0.05), so the difference ' + (sigd ? 'is' : 'is not') + ' significant.', qm: Object.assign({ topic: 'Genetics', subtopic: 'Chi-squared', command: 'Deduce' }, sub) }];
      } },
    { id: 'enzyme', icon: '🧪', name: 'Enzyme activity data', about: 'A data table, a graph to plot, the optimum to read off and an explanation to write.',
      form: [['iv', 'Independent variable (with unit)', 'text', 'Temperature / °C'], ['dv', 'Dependent variable (with unit)', 'text', 'Rate of reaction / cm³ O₂ min⁻¹'], ['x', 'Values of the independent variable', 'text', '10, 20, 30, 40, 50, 60'], ['y', 'Matching results', 'text', '1.2, 2.5, 4.1, 5.6, 3.0, 0.4'], ['enzyme', 'Enzyme', 'text', 'catalase']],
      build: function (v) {
        var x = nums(v.x), y = nums(v.y); if (x.length < 3 || x.length !== y.length) throw new Error('Give at least three values and the same number of results.');
        var best = y.indexOf(Math.max.apply(null, y)), unitX = (/\/\s*(.+)$/.exec(v.iv) || [])[1] || '', step = Math.abs(x[1] - x[0]) || 1;
        var isT = /temp/i.test(v.iv), isPh = /\bph\b/i.test(v.iv);
        return [group('**Investigation.** A student measured the activity of ' + v.enzyme + ' at different values of ' + v.iv.split('/')[0].trim().toLowerCase() + '.\n' + mdTable([v.iv, v.dv], x.map(function (a, i) { return [String(a), String(y[i])]; })), { topic: 'Enzymes', tags: ['enzymes', 'data analysis', 'practical'] }),
          { kind: 'graph', prompt: 'Plot a graph of the results. Label the axes and join the points with straight lines or a smooth curve. [3]', marks: 3, axes: v.iv.replace(/,/g, ' /') + ',' + v.dv.replace(/,/g, ' /'), model: 'Independent variable on the x-axis, suitable linear scales, all points plotted accurately, line through the points.', points: 'axes labelled with quantity and unit: label / unit\nsuitable scale using most of the grid: scale\npoints plotted accurately and joined: plotted / points', qm: Object.assign({ topic: 'Enzymes', subtopic: 'Graph construction', command: 'Construct' }, sub) },
          num('Using your graph, state the optimum ' + v.iv.split('/')[0].trim().toLowerCase() + ' for ' + v.enzyme + '. [1]', x[best], step / 2, unitX, 1, 'The highest rate (' + y[best] + ') is at ' + x[best] + ' ' + unitX + '; accept ± ' + step / 2, Object.assign({ topic: 'Enzymes', subtopic: 'Graph interpretation', command: 'State' }, sub)),
          written('Explain the change in rate above the optimum. [3]', 3, isT ? 'Above the optimum the enzyme denatures: bonds holding the tertiary structure break, the active site changes shape, so fewer enzyme–substrate complexes form and the rate falls.' : isPh ? 'Away from the optimum pH, ionic and hydrogen bonds in the enzyme are broken, the active site changes shape (denatures), so the substrate no longer fits and fewer enzyme–substrate complexes form.' : 'Describe the trend after the highest point and explain it using enzyme–substrate collisions and the shape of the active site.',
            isT || isPh ? ['enzyme denatured: denature', 'active site changes shape: active site / shape', 'fewer enzyme–substrate complexes / substrate no longer fits: complex / fit'] : ['describes the trend: decrease / falls', 'explains with collisions or active site: active site / collision', 'refers to the data: ' + x[best]], Object.assign({ topic: 'Enzymes', subtopic: 'Factors affecting enzyme activity', command: 'Explain' }, sub))];
      } },
    { id: 'vars', icon: '🧭', name: 'Experimental design: variables', about: 'Students sort the variables of an investigation into independent, dependent and controlled, then write a hypothesis.',
      form: [['aim', 'The investigation', 'text', 'the effect of light intensity on the rate of photosynthesis in pondweed'], ['iv', 'Independent variable', 'text', 'distance of the lamp from the pondweed'], ['dv', 'Dependent variable', 'text', 'number of bubbles released per minute'], ['cv', 'Controlled variables (separate with commas)', 'text', 'temperature of the water, mass of pondweed, concentration of hydrogencarbonate, type of lamp']],
      build: function (v) {
        var cv = String(v.cv).split(',').map(function (x) { return x.trim(); }).filter(Boolean); if (!v.iv || !v.dv || !cv.length) throw new Error('Type the independent, dependent and at least one controlled variable.');
        return [group('**Investigation.** A student investigated ' + v.aim + '.', { topic: 'Practical skills', tags: ['experimental design', 'variables', 'practical'] }),
          { kind: 'classify', prompt: 'Sort the variables of this investigation. [' + (cv.length + 2) + ']', marks: cv.length + 2, draft: { groups: ['Independent variable', 'Dependent variable', 'Controlled variable'], items: [{ t: v.iv, g: 0 }, { t: v.dv, g: 1 }].concat(cv.map(function (c) { return { t: c, g: 2 }; })) }, qm: Object.assign({ topic: 'Practical skills', subtopic: 'Variables', command: 'Identify', curriculum: 'MYP criterion B / IB DP skills' }, sub) },
          written('Formulate a testable hypothesis for this investigation, with a scientific reason. [3]', 3, 'If the ' + v.iv + ' changes, then the ' + v.dv + ' will change (state the direction), because … (scientific explanation).',
            ['names the independent variable: ' + v.iv.split(' ').slice(-2).join(' '), 'predicts the effect on the dependent variable: increase / decrease / more / less', 'gives a scientific reason: because'], Object.assign({ topic: 'Practical skills', subtopic: 'Hypothesis', command: 'Formulate', curriculum: 'MYP criterion B' }, sub)),
          written('Explain why the controlled variables must be kept the same. [2]', 2, 'So that only the independent variable affects the dependent variable; this makes it a fair test and the results valid.', ['only the independent variable changes: only / independent', 'fair test / valid results: fair / valid'], Object.assign({ topic: 'Practical skills', subtopic: 'Control of variables', command: 'Explain' }, sub))];
      } },
    { id: 'error', icon: '📉', name: 'Error bars and overlap', about: 'Means with standard deviations: students judge whether a difference is likely to be significant.',
      form: [['groups', 'Groups compared (separate with commas)', 'text', 'Shaded leaves, Sunny leaves'], ['means', 'Means (same order)', 'text', '12.4, 18.9'], ['sds', 'Standard deviations (same order)', 'text', '1.8, 2.1'], ['dv', 'What was measured (with unit)', 'text', 'Leaf area / cm²']],
      build: function (v) {
        var g = String(v.groups).split(',').map(function (x) { return x.trim(); }).filter(Boolean), m = nums(v.means), s = nums(v.sds);
        if (g.length !== 2 || m.length !== 2 || s.length !== 2) throw new Error('Compare exactly two groups: two names, two means and two standard deviations.');
        var overlap = Math.abs(m[0] - m[1]) < s[0] + s[1];
        return [group('**Data.** ' + mdTable(['Group', 'Mean ' + v.dv, 'Standard deviation'], g.map(function (x, i) { return [x, String(m[i]), '± ' + s[i]]; })) + '\nError bars on a bar chart show ± 1 standard deviation.', { topic: 'Statistics', tags: ['error bars', 'statistics', 'data analysis'] }),
          { kind: 'tf', prompt: 'The error bars (± 1 standard deviation) of the two groups overlap.', marks: 1, options: ['True', 'False'], correct: overlap ? 0 : 1, explanation: g[0] + ': ' + round(m[0] - s[0], 2) + ' to ' + round(m[0] + s[0], 2) + '; ' + g[1] + ': ' + round(m[1] - s[1], 2) + ' to ' + round(m[1] + s[1], 2) + '.', qm: Object.assign({ topic: 'Statistics', subtopic: 'Error bars', command: 'Deduce' }, sub) },
          written('Discuss whether the difference between the means is likely to be significant. [3]', 3, overlap ? 'The error bars overlap, so the difference may not be significant; a statistical test (e.g. t-test) is needed before drawing a conclusion.' : 'The error bars do not overlap, so the difference is likely to be significant; a statistical test (e.g. t-test) would confirm it.',
            [overlap ? 'error bars overlap: overlap' : 'error bars do not overlap: not overlap / no overlap', overlap ? 'difference may not be significant: not significant / may not' : 'difference likely significant: significant', 'a statistical test is needed to be sure: t-test / statistical test'], Object.assign({ topic: 'Statistics', subtopic: 'Significance', command: 'Discuss' }, sub))];
      } },
    { id: 'pct', icon: '％', name: 'Percentage change and rate', about: 'Percentage change between two readings, and a rate from a change over time.',
      form: [['what', 'Quantity (with unit)', 'text', 'Mass of potato cylinder / g'], ['a', 'Starting value', 'number', '2.50'], ['b', 'Final value', 'number', '2.15'], ['t', 'Time taken (leave empty for no rate question)', 'number', '30'], ['tu', 'Unit of time', 'select', ['min', 's', 'h']]],
      build: function (v) {
        var a = +v.a, b = +v.b; if (!isFinite(a) || !isFinite(b) || !a) throw new Error('Type the starting and final values.');
        var p = round(calc.pct(a, b), 1), unit = (/\/\s*(.+)$/.exec(v.what) || [])[1] || '', name = v.what.split('/')[0].trim().toLowerCase();
        var out = [num('The ' + name + ' changed from ' + a + ' ' + unit + ' to ' + b + ' ' + unit + '. Calculate the percentage change. [2]', p, 0.2, '%', 2, 'percentage change = (final − start) ÷ start × 100 = (' + b + ' − ' + a + ') ÷ ' + a + ' × 100 = ' + p + '%', { topic: 'Mathematical skills', subtopic: 'Percentage change', command: 'Calculate' })];
        if (+v.t > 0) { var r = round((b - a) / +v.t, 4); out.push(num('Calculate the mean rate of change of ' + name + ' over ' + v.t + ' ' + v.tu + '. [2]', r, Math.abs(r * 0.02) || 0.001, unit + ' ' + v.tu + '⁻¹', 2, 'rate = change ÷ time = ' + round(b - a, 4) + ' ÷ ' + v.t + ' = ' + r, { topic: 'Mathematical skills', subtopic: 'Rate', command: 'Calculate' })); }
        return out;
      } },
    { id: 'sci', icon: '×10ⁿ', name: 'Scientific notation', about: 'Write very large or very small numbers in standard form.',
      form: [['vals', 'Numbers to convert (separate with commas)', 'text', '0.000 25, 6 020 000, 0.0072'], ['unit', 'Unit (optional)', 'text', 'm']],
      build: function (v) {
        var vals = String(v.vals).split(',').map(function (x) { return parseFloat(x.replace(/\s+/g, '')); }).filter(isFinite); if (!vals.length) throw new Error('Type at least one number.');
        return [{ kind: 'table', prompt: 'Write each number in scientific notation (standard form), to 3 significant figures. Type the answer as, for example, 2.5 × 10⁻⁴. [' + vals.length + ']', marks: vals.length,
          draft: { cols: 'Number, Scientific notation', rows: vals.map(function (x) { var s = calc.sci(x), e = Math.floor(Math.log10(Math.abs(x))), m = String(sig(x / Math.pow(10, e), 3)); return x + (v.unit ? ' ' + v.unit : '') + ' | [' + [s, s.replace(/ /g, ''), m + 'x10^' + e, m + ' x 10^' + e, m + 'e' + e, m + '×10^' + e].join('|') + ']'; }).join('\n') }, qm: { topic: 'Mathematical skills', subtopic: 'Scientific notation', command: 'Calculate' } }];
      } },
    { id: 'equation', icon: '⚗', name: 'Balance a chemical equation', about: 'Students type the missing coefficients of an equation you give, balanced.',
      form: [['eq', 'Balanced equation (with coefficients; 1 may be left out)', 'text', '2H2 + O2 -> 2H2O'], ['ctx', 'Context (optional)', 'text', 'the combustion of hydrogen']],
      build: function (v) {
        var T = window.BVT, eq = String(v.eq || '').trim(); if (!/->|→|=/.test(eq)) throw new Error('Write the equation with an arrow, for example 2H2 + O2 -> 2H2O.');
        var parts = eq.split(/\s+(\+|->|→|=|<=>|⇌)\s+/), n = 0, out = parts.map(function (p) { if (/^(\+|->|→|=|<=>|⇌)$/.test(p)) return T && T.chem ? T.chem(p) : p; var m = /^(\d*)\s*(.+)$/.exec(p.trim()); n++; var c = m[1] || '1', f = T && T.chem ? T.chem(m[2]) : m[2]; return '[' + c + (c === '1' ? '|one' : '') + '] ' + f; }).join(' ');
        if (n < 2) throw new Error('The equation needs at least two substances.');
        return [{ kind: 'gaps', prompt: 'Balance the equation' + (v.ctx ? ' for ' + v.ctx : '') + ' by typing the missing numbers (type 1 where only one is needed). [' + n + ']', marks: n, draft: { text: out }, qm: { topic: 'Chemical equations', subtopic: 'Balancing equations', command: 'Deduce', tags: ['chemical equations'] } }];
      } }
  ];

  /* ---------------------------------------------------------------- dialog */
  function open(id, done) {
    var t = TOOLS.filter(function (x) { return x.id === id; })[0]; if (!t) return;
    var ov = document.createElement('div'); ov.className = 'bd-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', t.name);
    ov.innerHTML = '<div><div class="bd-top"><div><p class="label">🔬 Science tools</p><h2>' + t.icon + ' ' + E(t.name) + '</h2><p class="small muted">' + E(t.about) + '</p></div><button class="btn" type="button" data-x>✕ Close</button></div>' +
      '<form>' + t.form.map(function (f) { var inp = f[2] === 'select' ? '<select name="' + f[0] + '">' + f[3].map(function (o) { return '<option>' + E(o) + '</option>'; }).join('') + '</select>' : f[2] === 'textarea' ? '<textarea name="' + f[0] + '" rows="3">' + E(f[3]) + '</textarea>' : '<input name="' + f[0] + '" type="' + (f[2] === 'number' ? 'text' : 'text') + '"' + (f[2] === 'number' ? ' inputmode="decimal"' : '') + ' value="' + E(f[3]) + '">';
        return '<label class="bd-f"><span>' + E(f[1]) + '</span>' + inp + '</label>'; }).join('') +
      '<div class="acts"><button class="btn" type="button" data-try>👁 Work it out</button><button class="btn main" type="submit">＋ Add these questions</button></div><div data-out class="small" style="margin-top:10px"></div></form></div>';
    var form = ov.querySelector('form'), out = ov.querySelector('[data-out]');
    function vals() { var v = {}; t.form.forEach(function (f) { v[f[0]] = form.elements[f[0]].value; }); return v; }
    function show() { try { var items = t.build(vals()); out.innerHTML = '<p><b>' + items.length + ' item' + (items.length === 1 ? '' : 's') + ' will be added</b> (you can edit them all afterwards):</p><ol>' + items.map(function (it) { return '<li>' + E(it.kind === 'info' ? 'Shared data / passage' : String(it.prompt).split('\n')[0].slice(0, 140)) + (it.kind === 'number' ? ' <b>→ ' + E(it.draft.value) + ' ' + E(it.draft.unit) + ' (± ' + E(it.draft.tol) + ')</b>' : '') + '</li>'; }).join('') + '</ol>'; return items; }
      catch (e) { out.innerHTML = '<p class="bd-warn">' + E(e.message) + '</p>'; return null; } }
    ov.querySelector('[data-try]').onclick = show;
    form.onsubmit = function (e) { e.preventDefault(); var items = show(); if (!items) return; ov.remove(); done(items); };
    ov.querySelector('[data-x]').onclick = function () { ov.remove(); };
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') ov.remove(); });
    document.body.appendChild(ov); show(); var f0 = form.querySelector('input,select,textarea'); if (f0) f0.focus();
  }
  var RES = null;
  function resources() { if (!RES) RES = fetch('/assets/resources.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; }, function () { return []; }); return RES; }
  /* picture picker over the BioScience Vista diagram library */
  function pickResource(done) {
    var ov = document.createElement('div'); ov.className = 'bd-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'BioScience Vista diagrams');
    ov.innerHTML = '<div><div class="bd-top"><div><p class="label">Resources</p><h2>🧬 BioScience Vista diagrams</h2></div><button class="btn" type="button" data-x>✕ Close</button></div><input type="search" placeholder="Search: enzyme, neurone, classification…" aria-label="Search diagrams" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:10px;border:1px solid #cbd5e1;font:inherit"><div data-g style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:12px"><p class="muted">Loading…</p></div></div>';
    var g = ov.querySelector('[data-g]'), q = ov.querySelector('input');
    resources().then(function (list) { function draw() { var t = q.value.trim().toLowerCase(), l = list.filter(function (r) { return !t || (r.title + ' ' + r.group).toLowerCase().indexOf(t) >= 0; });
      g.innerHTML = l.length ? l.map(function (r, i) { return '<button type="button" data-i="' + list.indexOf(r) + '" style="all:unset;cursor:pointer;border:1px solid #dde3ea;border-radius:12px;padding:6px;background:#fff;display:grid;gap:4px"><img src="' + E(r.src) + '" alt="" loading="lazy" style="width:100%;height:110px;object-fit:contain"><span class="small">' + E(r.title) + '</span></button>'; }).join('') : '<p class="muted">No diagrams match.</p>';
      g.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { var r = list[+b.getAttribute('data-i')]; ov.remove(); done(location.origin + r.src, r.title); }; }); }
      q.oninput = draw; draw(); });
    ov.querySelector('[data-x]').onclick = function () { ov.remove(); };
    document.body.appendChild(ov); q.focus();
  }
  window.BVSCI = { TOOLS: TOOLS.map(function (t) { return { id: t.id, icon: t.icon, name: t.name, about: t.about }; }), open: open, calc: calc, build: function (id, v) { return TOOLS.filter(function (x) { return x.id === id; })[0].build(v); }, defaults: function (id) { var v = {}; TOOLS.filter(function (x) { return x.id === id; })[0].form.forEach(function (f) { v[f[0]] = f[2] === 'select' ? f[3][0] : f[3]; }); return v; }, resources: resources, pickResource: pickResource };
})();
