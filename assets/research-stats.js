/* BioscienceVista · VISTA Research Hub · statistics library (pure functions, no page code).
   Descriptive statistics, uncertainty, correlation, regression and significance tests with exact p-values from the
   regularised incomplete beta and gamma functions. Checked against SciPy 1.18 by tests/research_stats_check.js.
   Every test returns {name, stat, df, p, ...} and never decides biology for the student: it only reports numbers. */
(function (root) {
  'use strict';
  var R = {};
  var num = function (a) { return (a || []).map(Number).filter(function (x) { return isFinite(x); }); };
  R.clean = num;

  /* ---------- special functions ---------- */
  function lgamma(x) {   // Lanczos approximation, |error| < 1e-14 for x > 0
    var g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1; var a = c[0], t = x + g + 0.5;
    for (var i = 1; i < 9; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  R.lgamma = lgamma;
  function betacf(a, b, x) {   // continued fraction for the incomplete beta (Numerical Recipes, modified Lentz)
    var FPMIN = 1e-300, qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; var h = d;
    for (var m = 1; m <= 300; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d;
      var del = d * c; h *= del; if (Math.abs(del - 1) < 3e-16) break;
    }
    return h;
  }
  function ibeta(x, a, b) {   // regularised incomplete beta I_x(a, b)
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  R.ibeta = ibeta;
  function gammaP(a, x) {   // regularised lower incomplete gamma P(a, x)
    if (x <= 0) return 0;
    if (x < a + 1) { var ap = a, sum = 1 / a, del = sum; for (var n = 0; n < 1000; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-16) break; } return sum * Math.exp(-x + a * Math.log(x) - lgamma(a)); }
    return 1 - gammaQcf(a, x);
  }
  function gammaQcf(a, x) {
    var FPMIN = 1e-300, b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
    for (var i = 1; i < 1000; i++) { var an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN; c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; var del = d * c; h *= del; if (Math.abs(del - 1) < 3e-16) break; }
    return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
  }
  R.gammaP = gammaP;
  function erf(x) { var s = x < 0 ? -1 : 1; return s * gammaP(0.5, x * x); }
  R.normCdf = function (z) { return 0.5 * (1 + erf(z / Math.SQRT2)); };
  R.tCdf = function (t, df) { var x = df / (df + t * t), p = 0.5 * ibeta(x, df / 2, 0.5); return t > 0 ? 1 - p : p; };
  R.tTwo = function (t, df) { return ibeta(df / (df + t * t), df / 2, 0.5); };            // two-tailed p
  R.fSurv = function (f, d1, d2) { return f <= 0 ? 1 : ibeta(d2 / (d2 + d1 * f), d2 / 2, d1 / 2); };   // P(F > f)
  R.chiSurv = function (x, df) { return x <= 0 ? 1 : 1 - gammaP(df / 2, x / 2); };          // P(chi2 > x)
  function invert(cdf, p, lo, hi) { for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2; if (cdf(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
  R.tInv = function (p, df) { return invert(function (t) { return R.tCdf(t, df); }, p, -1e4, 1e4); };   // quantile, e.g. tInv(0.975, df)
  R.chiInv = function (p, df) { return invert(function (x) { return 1 - R.chiSurv(x, df); }, p, 0, 1e5); };

  /* ---------- descriptive ---------- */
  R.sum = function (a) { return num(a).reduce(function (s, x) { return s + x; }, 0); };
  R.mean = function (a) { a = num(a); return a.length ? R.sum(a) / a.length : NaN; };
  R.median = function (a) { a = num(a).sort(function (x, y) { return x - y; }); var n = a.length; return !n ? NaN : n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2; };
  R.modes = function (a) { var c = {}, best = 0; num(a).forEach(function (x) { c[x] = (c[x] || 0) + 1; best = Math.max(best, c[x]); }); if (best < 2) return []; return Object.keys(c).filter(function (k) { return c[k] === best; }).map(Number).sort(function (x, y) { return x - y; }); };
  R.variance = function (a) { a = num(a); var n = a.length; if (n < 2) return NaN; var m = R.mean(a); return a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (n - 1); };   // sample (n − 1)
  R.sd = function (a) { return Math.sqrt(R.variance(a)); };
  R.se = function (a) { a = num(a); return R.sd(a) / Math.sqrt(a.length); };
  R.quantile = function (a, q) { a = num(a).sort(function (x, y) { return x - y; }); if (!a.length) return NaN; var h = (a.length - 1) * q, lo = Math.floor(h); return a[lo] + (h - lo) * ((a[Math.min(lo + 1, a.length - 1)]) - a[lo]); };   // linear, as SciPy/NumPy default
  R.describe = function (a, conf) {
    a = num(a); conf = conf || 0.95; var n = a.length, m = R.mean(a), s = n > 1 ? R.sd(a) : NaN, se = n > 1 ? s / Math.sqrt(n) : NaN;
    var t = n > 1 ? R.tInv(1 - (1 - conf) / 2, n - 1) : NaN;
    return { n: n, mean: m, median: R.median(a), modes: R.modes(a), min: n ? Math.min.apply(null, a) : NaN, max: n ? Math.max.apply(null, a) : NaN,
      range: n ? Math.max.apply(null, a) - Math.min.apply(null, a) : NaN, sd: s, se: se, cv: s / m * 100, q1: R.quantile(a, 0.25), q3: R.quantile(a, 0.75),
      ci: [m - t * se, m + t * se], conf: conf };
  };
  R.pctChange = function (from, to) { return (to - from) / from * 100; };
  R.pctError = function (measured, accepted) { return Math.abs(measured - accepted) / Math.abs(accepted) * 100; };
  /* uncertainty: absolute (±), relative and percentage; a mean's uncertainty as half the range of the trials */
  R.unc = function (value, abs) { return { value: value, abs: Math.abs(abs), rel: Math.abs(abs / value), pct: Math.abs(abs / value) * 100 }; };
  R.halfRange = function (a) { a = num(a); return a.length ? (Math.max.apply(null, a) - Math.min.apply(null, a)) / 2 : NaN; };
  R.prop = {   // propagation of uncertainties as taught in the IB sciences: add absolute for + and −, add relative for × and ÷, multiply relative by n for powers
    add: function (u1, u2) { return Math.abs(u1) + Math.abs(u2); },
    mulRel: function (v1, u1, v2, u2) { return Math.abs(u1 / v1) + Math.abs(u2 / v2); },
    powRel: function (v, u, n) { return Math.abs(n) * Math.abs(u / v); }
  };

  /* ---------- ranks ---------- */
  function ranks(a) {   // average ranks for ties
    var idx = a.map(function (x, i) { return [x, i]; }).sort(function (p, q) { return p[0] - q[0]; }), r = new Array(a.length), i = 0;
    while (i < idx.length) { var j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; var avg = (i + j) / 2 + 1; for (var k = i; k <= j; k++) r[idx[k][1]] = avg; i = j + 1; }
    return r;
  }
  function tieSum(a) { var c = {}; a.forEach(function (x) { c[x] = (c[x] || 0) + 1; }); return Object.keys(c).reduce(function (s, k) { var t = c[k]; return s + t * t * t - t; }, 0); }
  R.ranks = ranks;

  /* ---------- correlation and regression ---------- */
  R.pearson = function (x, y) {
    var pr = pairs(x, y); x = pr[0]; y = pr[1]; var n = x.length; if (n < 3) return { name: 'Pearson correlation', error: 'At least three pairs are needed.' };
    var mx = R.mean(x), my = R.mean(y), sxy = 0, sxx = 0, syy = 0;
    for (var i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) * (x[i] - mx); syy += (y[i] - my) * (y[i] - my); }
    var r = sxy / Math.sqrt(sxx * syy); r = Math.max(-1, Math.min(1, r)); var df = n - 2, t = Math.abs(r) >= 1 ? Infinity : r * Math.sqrt(df / (1 - r * r));
    return { name: 'Pearson correlation', stat: r, statName: 'r', r2: r * r, t: t, df: df, n: n, p: isFinite(t) ? R.tTwo(t, df) : 0 };
  };
  R.spearman = function (x, y) {
    var pr = pairs(x, y); x = pr[0]; y = pr[1]; var n = x.length; if (n < 3) return { name: 'Spearman rank correlation', error: 'At least three pairs are needed.' };
    var res = R.pearson(ranks(x), ranks(y));   // with ties, Spearman's rho is Pearson's r on the ranks (as SciPy); p from the t approximation
    return { name: 'Spearman rank correlation', stat: res.stat, statName: 'rₛ', df: n - 2, n: n, p: res.p, t: res.t };
  };
  R.regression = function (x, y) {
    var pr = pairs(x, y); x = pr[0]; y = pr[1]; var n = x.length; if (n < 3) return { error: 'At least three points are needed.' };
    var mx = R.mean(x), my = R.mean(y), sxy = 0, sxx = 0, sst = 0;
    for (var i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) * (x[i] - mx); sst += (y[i] - my) * (y[i] - my); }
    var m = sxy / sxx, c = my - m * mx, sse = 0; for (i = 0; i < n; i++) { var e = y[i] - (m * x[i] + c); sse += e * e; }
    var df = n - 2, s2 = sse / df, seM = Math.sqrt(s2 / sxx), seC = Math.sqrt(s2 * (1 / n + mx * mx / sxx)), t = m / seM;
    return { name: 'Linear regression', slope: m, intercept: c, r2: sst ? 1 - sse / sst : 1, seSlope: seM, seIntercept: seC, df: df, n: n, t: t, p: R.tTwo(t, df), stat: m, statName: 'gradient' };
  };
  function pairs(x, y) { var a = [], b = []; for (var i = 0; i < Math.min(x.length, y.length); i++) { var p = Number(x[i]), q = Number(y[i]); if (x[i] !== '' && y[i] !== '' && x[i] != null && y[i] != null && isFinite(p) && isFinite(q)) { a.push(p); b.push(q); } } return [a, b]; }

  /* ---------- comparing groups ---------- */
  R.tTest = function (a, b, opts) {   // independent samples; equal:true for Student's, otherwise Welch's (the safer default)
    a = num(a); b = num(b); opts = opts || {}; var n1 = a.length, n2 = b.length;
    if (n1 < 2 || n2 < 2) return { name: 't-test', error: 'Each group needs at least two values.' };
    var v1 = R.variance(a), v2 = R.variance(b), m1 = R.mean(a), m2 = R.mean(b), t, df;
    if (opts.equal) { var sp = ((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2); t = (m1 - m2) / Math.sqrt(sp * (1 / n1 + 1 / n2)); df = n1 + n2 - 2; }
    else { var q1 = v1 / n1, q2 = v2 / n2; t = (m1 - m2) / Math.sqrt(q1 + q2); df = (q1 + q2) * (q1 + q2) / (q1 * q1 / (n1 - 1) + q2 * q2 / (n2 - 1)); }
    return { name: opts.equal ? "Student's t-test (independent, equal variances)" : "Welch's t-test (independent, unequal variances)", stat: t, statName: 't', df: df, p: R.tTwo(t, df), mean1: m1, mean2: m2, n1: n1, n2: n2 };
  };
  R.pairedT = function (a, b) {
    var pr = pairs(a, b), d = pr[0].map(function (x, i) { return x - pr[1][i]; }), n = d.length;
    if (n < 2) return { name: 'Paired t-test', error: 'At least two complete pairs are needed.' };
    var sd = R.sd(d); if (!sd) return { name: 'Paired t-test', error: 'Every difference is the same, so the test cannot be calculated.' };
    var t = R.mean(d) / (sd / Math.sqrt(n));
    return { name: 'Paired t-test', stat: t, statName: 't', df: n - 1, p: R.tTwo(t, n - 1), meanDiff: R.mean(d), n: n };
  };
  R.mannWhitney = function (a, b) {   // two-sided, normal approximation with tie and continuity correction (SciPy method='asymptotic')
    a = num(a); b = num(b); var n1 = a.length, n2 = b.length; if (!n1 || !n2) return { name: 'Mann–Whitney U test', error: 'Both groups need values.' };
    var all = a.concat(b), r = ranks(all), r1 = 0; for (var i = 0; i < n1; i++) r1 += r[i];
    var u1 = r1 - n1 * (n1 + 1) / 2, u2 = n1 * n2 - u1, n = n1 + n2, mu = n1 * n2 / 2;
    var sigma = Math.sqrt(n1 * n2 / 12 * ((n + 1) - tieSum(all) / (n * (n - 1))));
    var z = sigma ? (Math.max(u1, u2) - mu - 0.5) / sigma : 0;
    return { name: 'Mann–Whitney U test', stat: u1, statName: 'U', u2: u2, z: z, p: Math.min(1, 2 * (1 - R.normCdf(z))), n1: n1, n2: n2, approx: true };
  };
  R.wilcoxon = function (a, b) {   // signed-rank, zero differences dropped, normal approximation with tie correction (SciPy method='approx', no continuity correction)
    var pr = pairs(a, b), d = pr[0].map(function (x, i) { return x - pr[1][i]; }).filter(function (x) { return x !== 0; }), n = d.length;
    if (n < 1) return { name: 'Wilcoxon signed-rank test', error: 'Every pair is the same.' };
    var abs = d.map(Math.abs), r = ranks(abs), wp = 0, wm = 0; d.forEach(function (x, i) { if (x > 0) wp += r[i]; else wm += r[i]; });
    var w = Math.min(wp, wm), mu = n * (n + 1) / 4, sigma = Math.sqrt(n * (n + 1) * (2 * n + 1) / 24 - tieSum(abs) / 48), z = sigma ? (w - mu) / sigma : 0;
    return { name: 'Wilcoxon signed-rank test', stat: w, statName: 'W', z: z, p: Math.min(1, 2 * R.normCdf(-Math.abs(z))), n: n, approx: true };
  };
  R.anova = function (groups) {   // one-way ANOVA
    groups = groups.map(num).filter(function (g) { return g.length; }); var k = groups.length; if (k < 2) return { name: 'One-way ANOVA', error: 'At least two groups are needed.' };
    var all = [].concat.apply([], groups), N = all.length, gm = R.mean(all), ssb = 0, ssw = 0;
    groups.forEach(function (g) { var m = R.mean(g); ssb += g.length * (m - gm) * (m - gm); g.forEach(function (x) { ssw += (x - m) * (x - m); }); });
    var d1 = k - 1, d2 = N - k; if (d2 < 1) return { name: 'One-way ANOVA', error: 'Each group needs more than one value.' };
    var f = (ssb / d1) / (ssw / d2);
    return { name: 'One-way ANOVA', stat: f, statName: 'F', df: [d1, d2], p: R.fSurv(f, d1, d2), ssb: ssb, ssw: ssw, k: k, N: N };
  };
  R.kruskal = function (groups) {   // Kruskal–Wallis H, the non-parametric alternative to one-way ANOVA
    groups = groups.map(num).filter(function (g) { return g.length; }); var k = groups.length; if (k < 2) return { name: 'Kruskal–Wallis H test', error: 'At least two groups are needed.' };
    var all = [].concat.apply([], groups), N = all.length, r = ranks(all), h = 0, pos = 0;
    groups.forEach(function (g) { var s = 0; for (var i = 0; i < g.length; i++) s += r[pos + i]; pos += g.length; h += s * s / g.length; });
    h = 12 / (N * (N + 1)) * h - 3 * (N + 1); var c = 1 - tieSum(all) / (N * N * N - N); if (c > 0) h /= c;
    return { name: 'Kruskal–Wallis H test', stat: h, statName: 'H', df: k - 1, p: R.chiSurv(h, k - 1), approx: true };
  };
  R.chiSquare = function (table) {   // contingency table (r × c, r and c ≥ 2): test of independence; expected values from the margins
    var rows = table.map(function (r) { return r.map(Number); }), rs = rows.map(R.sum), cs = rows[0].map(function (_, j) { return R.sum(rows.map(function (r) { return r[j]; })); }), N = R.sum(rs);
    var x2 = 0, exp = [], small = 0;
    rows.forEach(function (r, i) { exp.push(r.map(function (o, j) { var e = rs[i] * cs[j] / N; if (e < 5) small++; x2 += (o - e) * (o - e) / e; return e; })); });
    var df = (rows.length - 1) * (cs.length - 1);
    return { name: 'Chi-squared test of independence', stat: x2, statName: 'χ²', df: df, p: R.chiSurv(x2, df), expected: exp, smallExpected: small };
  };
  R.chiGoodness = function (obs, expected) {   // goodness of fit; expected counts (or ratios scaled to the total)
    obs = num(obs); var tot = R.sum(obs), e = num(expected), es = R.sum(e); e = e.map(function (x) { return x * tot / es; });
    var x2 = obs.reduce(function (s, o, i) { return s + (o - e[i]) * (o - e[i]) / e[i]; }, 0), df = obs.length - 1;
    return { name: 'Chi-squared goodness of fit', stat: x2, statName: 'χ²', df: df, p: R.chiSurv(x2, df), expected: e, smallExpected: e.filter(function (x) { return x < 5; }).length };
  };
  R.shapiroHint = function (a) {   // not a formal test: skewness and the mean–median gap, as a prompt to look at the histogram
    a = num(a); var n = a.length; if (n < 3) return null; var m = R.mean(a), s = R.sd(a), sk = a.reduce(function (t, x) { return t + Math.pow((x - m) / s, 3); }, 0) * n / ((n - 1) * (n - 2));
    return { skew: sk, looksSkewed: Math.abs(sk) > 1 };
  };

  /* ---------- choosing a test: a decision, with the reasons, from the design (never from what is available) ---------- */
  R.chooseTest = function (d) {
    // d: {goal:'difference'|'relationship'|'association'|'fit', data:'continuous'|'ordinal'|'counts', groups:2|3, paired:true|false, normal:'yes'|'no'|'unsure', n: smallest group size}
    var why = [], test, alt, assume = [];
    if (d.data === 'counts' || d.goal === 'association' || d.goal === 'fit') {
      test = d.goal === 'fit' ? 'chiGoodness' : 'chiSquare';
      why.push('Your data are counts (frequencies) in categories, so a chi-squared test compares observed with expected counts.');
      assume = ['Observations are independent: each individual is counted once.', 'Every expected count should be 5 or more; merge categories or collect more data if not.', 'Use raw counts, never percentages or means.'];
    } else if (d.goal === 'relationship') {
      var par = d.data === 'continuous' && d.normal === 'yes';
      test = par ? 'pearson' : 'spearman'; alt = par ? 'spearman' : null;
      why.push('You are looking for a relationship between two measured variables, so you need a correlation.');
      why.push(par ? 'Both variables are continuous and roughly normal with a straight-line pattern, so Pearson\'s r fits.' : 'The data are ranked, skewed or the pattern is curved but consistently rising or falling, so Spearman\'s rank correlation fits.');
      assume = par ? ['Pairs are independent.', 'The relationship is linear (check the scatter graph).', 'Both variables are roughly normally distributed; no extreme outliers.'] : ['Pairs are independent.', 'The relationship is monotonic (always rising or always falling).'];
      if ((d.n || 0) < 5) why.push('With fewer than 5 pairs any correlation is unreliable; aim for at least 5, ideally 10 or more.');
    } else {
      var para = d.data === 'continuous' && d.normal === 'yes' && (d.n || 0) >= 5;
      if (d.groups >= 3) { test = para ? 'anova' : 'kruskal'; alt = para ? 'kruskal' : null; why.push('You are comparing three or more groups, so a single test across all groups avoids the false positives of many separate t-tests.'); }
      else if (d.paired) { test = para ? 'pairedT' : 'wilcoxon'; alt = para ? 'wilcoxon' : null; why.push('The same individuals or samples are measured twice (paired data), so the test works on the differences within each pair.'); }
      else { test = para ? 'tTest' : 'mannWhitney'; alt = para ? 'mannWhitney' : null; why.push('You are comparing two independent groups.'); }
      why.push(para ? 'The data are continuous, roughly normal, and each group has at least 5 values, so a parametric test fits.' : 'The data are ordinal, skewed, uncertain in distribution or the groups are small, so a non-parametric (rank) test is safer.');
      assume = para ? ['Observations are independent (except the pairing, for a paired test).', 'Data in each group are roughly normal; check a histogram or box plot.', test === 'anova' ? 'Group variances are similar (largest SD less than about twice the smallest).' : 'Welch\'s version does not need equal variances.'] : ['Observations are independent.', 'The groups have similar shaped distributions if you compare medians.'];
      if (test === 'anova' || test === 'kruskal') assume.push('A significant result says at least one group differs; it does not say which. Look at the means and error bars, or ask your teacher about a post-hoc test.');
    }
    return { test: test, alt: alt, why: why, assume: assume };
  };

  R.interpret = function (res, alpha) {   // careful words: significance is not importance and not proof of cause
    alpha = alpha || 0.05; if (!res || res.error) return res && res.error;
    var sig = res.p < alpha, ps = res.p < 0.001 ? 'p < 0.001' : 'p = ' + res.p.toFixed(3);
    var s = res.name + ': ' + (res.statName || 'statistic') + ' = ' + fmt(res.stat) + (res.df != null ? ', df = ' + (Array.isArray(res.df) ? res.df.map(fmt).join(', ') : fmt(res.df)) : '') + ', ' + ps + '. ';
    s += sig ? 'Because p is below ' + alpha + ', the null hypothesis can be rejected at the ' + Math.round(alpha * 100) + '% significance level: a result this extreme would be unlikely if there were no real difference or relationship. '
             : 'Because p is not below ' + alpha + ', the null hypothesis cannot be rejected: the data do not give strong enough evidence of a difference or relationship (this is not proof that there is none). ';
    s += 'Statistical significance does not show that the effect is large or biologically important, and it does not by itself prove cause and effect: look at the size of the difference, the uncertainties and the design.';
    if (res.approx) s += ' The p-value uses the normal approximation, which is less exact for very small samples.';
    if (res.smallExpected) s += ' Warning: ' + res.smallExpected + ' expected count(s) are below 5, so the chi-squared result is not reliable.';
    return s;
  };
  function fmt(x) { if (x == null || !isFinite(x)) return String(x); var a = Math.abs(x); return a !== 0 && (a < 0.001 || a >= 1e6) ? x.toExponential(3) : (Math.round(x * 1000) / 1000).toString(); }
  R.fmt = fmt;
  R.sig = function (x, s) { if (!isFinite(x) || x === 0) return String(x); return Number(x.toPrecision(s || 3)).toString(); };

  if (typeof module !== 'undefined' && module.exports) module.exports = R; else root.RStats = R;
})(this);
