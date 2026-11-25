/* VistaEd · VISTA Research Hub · automatic checks (loaded before research.js).
   1. Reads an uploaded DOCX or PDF in the browser (mammoth, pdf.js) and checks it against the requirements of the IA or EE:
      word count, structure, research question, method detail, data, uncertainty, statistics, conclusion, evaluation,
      citations against the reference list, over-claiming and integrity signals. Rule-based: it flags, it never marks.
   2. Builds an IA report (DOCX, with tables and graphs) from the student's own Studio stages, for checking or as a first draft.
   Reports are saved in the project (data.auto_checks) so the supervisor sees them with the submission. */
(function () {
  'use strict';
  var RH = window.RH = window.RH || {}, K = RH.check = {};
  var E = function (s) { return RH.E(s); };
  var need = function (src) { return new Promise(function (ok, bad) { if (document.querySelector('script[src="' + src + '"]')) { var t = setInterval(function () { if ((src.indexOf('pdf') >= 0 ? window.pdfjsLib : window.mammoth)) { clearInterval(t); ok(); } }, 50); return; } var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { bad(new Error('The file reader did not load.')); }; document.head.appendChild(s); }); };

  /* ---------- reading files into {text, headings[], tables, figures} ---------- */
  K.read = function (file) {
    if (/\.docx$/i.test(file.name)) return need('/assets/mammoth.browser.min.js').then(function () { return file.arrayBuffer(); }).then(function (buf) { return window.mammoth.convertToHtml({ arrayBuffer: buf }); }).then(function (r) {
      var d = new DOMParser().parseFromString('<div>' + r.value + '</div>', 'text/html'), heads = [], tables = d.querySelectorAll('table').length, imgs = d.querySelectorAll('img').length;
      d.querySelectorAll('h1,h2,h3,h4,p strong:only-child').forEach(function (h) { var t = h.textContent.trim(); if (t && t.length < 90) heads.push(t); });
      var tableText = Array.prototype.map.call(d.querySelectorAll('table'), function (t) { return t.textContent; }).join(' ');
      d.querySelectorAll('table').forEach(function (t) { t.remove(); });
      var paras = Array.prototype.map.call(d.querySelectorAll('h1,h2,h3,h4,p,li'), function (p) { return p.textContent.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
      return { name: file.name, paras: paras, headings: heads, tables: tables, images: imgs, tableText: tableText };
    });
    if (/\.pdf$/i.test(file.name)) return need('/assets/pdf.min.js').then(function () { var lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.js'; return file.arrayBuffer().then(function (b) { return lib.getDocument({ data: b }).promise; }); }).then(function (pdf) {
      var lines = [], ps = []; for (var i = 1; i <= pdf.numPages; i++) ps.push(i);
      return ps.reduce(function (ch, n) { return ch.then(function () { return pdf.getPage(n).then(function (p) { return p.getTextContent().then(function (tc) { var rows = {}; tc.items.forEach(function (it) { if (!it.str.trim()) return; var y = Math.round(it.transform[5] / 3); (rows[y] = rows[y] || []).push([it.transform[4], it.str, it.height || 0]); }); Object.keys(rows).sort(function (a, b) { return b - a; }).forEach(function (y) { var r = rows[y].sort(function (a, b) { return a[0] - b[0]; }); lines.push({ t: r.map(function (x) { return x[1]; }).join(' ').replace(/\s+/g, ' ').trim(), h: Math.max.apply(null, r.map(function (x) { return x[2]; })) }); }); }); }); }); }, Promise.resolve()).then(function () {
        var hs = lines.map(function (l) { return l.h; }).sort(function (a, b) { return a - b; }), body = hs[Math.floor(hs.length / 2)] || 10;
        var heads = lines.filter(function (l) { return l.t.length < 80 && (l.h > body * 1.15 || /^(\d+(\.\d+)*\.?\s+)?[A-Z][A-Za-z ,&'’()-]{2,60}$/.test(l.t) && !/[.;:]$/.test(l.t) && RH.words(l.t) <= 8); }).map(function (l) { return l.t; });
        var paras = [], cur = ''; lines.forEach(function (l) { if (heads.indexOf(l.t) >= 0) { if (cur) paras.push(cur); paras.push(l.t); cur = ''; } else { cur += (cur ? ' ' : '') + l.t; if (/[.?!]$/.test(l.t)) { paras.push(cur); cur = ''; } } }); if (cur) paras.push(cur);
        var all = lines.map(function (l) { return l.t; }).join(' ');
        return { name: 'pdf', paras: paras, headings: heads, tables: (all.match(/\bTable\s+\d+/gi) || []).length, images: (all.match(/\b(Figure|Fig\.)\s+\d+/gi) || []).length, tableText: '', pages: pdf.numPages };
      });
    });
    return Promise.reject(new Error('Upload a Word (.docx) or PDF file.'));
  };

  /* ---------- helpers ---------- */
  var w = function (s) { return RH.words(s); };
  function sectionText(doc, re, stopRe) {   // text under the first heading matching re, up to the next main heading
    var out = [], on = false;
    doc.paras.forEach(function (p) { var isHead = doc.headings.indexOf(p) >= 0; if (isHead && re.test(p)) { on = true; return; } if (on && isHead && (!stopRe || stopRe.test(p)) && !re.test(p)) on = false; if (on) out.push(p); });
    return out.join('\n');
  }
  var HEADS_MAIN = /^(\d+(\.\d+)*\.?\s*)?(introduction|background|research question|hypothes|variables|research design|method|methodology|procedure|apparatus|materials|risk|safety|ethic|environment|data|results|raw data|processed|analysis|discussion|conclusion|evaluation|limitation|improvement|references?|bibliography|works cited|appendi|contents|table of contents|scientific context|uncertaint)/i;
  function citations(text) {   // author–date and numbered citations in the body
    var ad = [], m, re = /\(([^()]*?(?:[A-Z][A-Za-z'’-]+)[^()]*?),?\s+(\d{4}[a-z]?|n\.d\.)(?:[,;][^()]*)?\)/g;
    while ((m = re.exec(text))) { m[0].slice(1, -1).split(';').forEach(function (part) { var mm = part.match(/([A-Z][A-Za-z'’-]+)[^,]*?,?\s*(\d{4}[a-z]?|n\.d\.)/); if (mm) ad.push({ name: mm[1], year: mm[2] }); }); }
    var re2 = /\b([A-Z][A-Za-z'’-]+)(?: et al\.| and [A-Z][A-Za-z'’-]+| & [A-Z][A-Za-z'’-]+)? \((\d{4}[a-z]?)\)/g; while ((m = re2.exec(text))) ad.push({ name: m[1], year: m[2] });
    var num = (text.match(/\[\d+(?:[,–-]\s*\d+)*\]/g) || []).length;
    return { ad: ad, num: num };
  }
  function refEntries(refText) { return refText.split(/\n+/).map(function (s) { return s.trim(); }).filter(function (s) { return w(s) >= 4 && /(\d{4}|n\.d\.)/.test(s); }); }

  /* ---------- the analysis ---------- */
  K.analyse = function (doc, kind) {
    var ee = kind === 'ee', items = [], full = doc.paras.join('\n'), low = full.toLowerCase();
    var add = function (crit, level, msg, ev) { items.push({ c: crit, l: level, m: msg, e: ev ? String(ev).slice(0, 220) : '' }); };
    var refs = sectionText(doc, /^(\d+\.?\s*)?(references?|bibliography|works cited|reference list)\b/i), refWords = w(refs);
    var appx = sectionText(doc, /^(\d+\.?\s*)?appendi/i);
    var bodyText = full.replace(refs, ' ').replace(appx, ' ').replace(/\((?:[^()]*?,\s*)?(?:\d{4}[a-z]?|n\.d\.)(?:[^()]*)\)/g, ' ').replace(/\[\d+(?:[,–-]\s*\d+)*\]/g, ' ');
    var words = w(bodyText), lim = ee ? 4000 : 3000;
    var G = 'general', A = ee ? 'A' : 'rd', B = ee ? 'B' : 'rd', C = ee ? 'C' : 'da', CO = ee ? 'C' : 'co', D = ee ? 'D' : 'ev';
    // length and structure
    add(G, words > lim ? 'no' : words < lim * 0.5 ? 'mid' : 'ok', words > lim ? 'About ' + words + ' words in the body: over the ' + lim + '-word limit by about ' + (words - lim) + '. Examiners do not read beyond the limit.' : words < lim * 0.5 ? 'About ' + words + ' words: much shorter than the ' + lim + '-word maximum. Check nothing important is missing.' : 'About ' + words + ' words in the body (limit ' + lim + '). Estimate: tables, headings, citations and references are left out.');
    var want = ee ? [['Contents page', /contents/i], ['Introduction', /introduc/i], ['Conclusion', /conclusion/i], ['References or bibliography', /reference|bibliograph|works cited/i]]
      : [['Research question', /research question/i], ['Background', /background|introduc/i], ['Hypothesis', /hypothes/i], ['Variables', /variable/i], ['Method or procedure', /method|procedure/i], ['Safety, ethics or environment', /safety|risk|ethic|environment/i], ['Data or results', /data|results/i], ['Conclusion', /conclusion/i], ['Evaluation or limitations', /evaluation|limitation/i], ['References', /reference|bibliograph|works cited/i]];
    var missing = want.filter(function (x) { return !doc.headings.some(function (h) { return x[1].test(h); }) && !(x[0] === 'Research question' && /research question\s*:/i.test(full)); }).map(function (x) { return x[0]; });
    add(G, missing.length ? (missing.length > 2 ? 'no' : 'mid') : 'ok', missing.length ? 'No heading found for: ' + missing.join(', ') + '. Headings help the reader (and the examiner) find each part.' : 'All the expected parts have headings.');
    // research question
    var rqLine = (full.match(/(?:research question\s*[:\-–]?\s*)([^\n?]{15,400}\?)/i) || [])[1] || (doc.paras.filter(function (p) { return /\?$/.test(p.trim()) && w(p) >= 10 && w(p) <= 60; })[0]) || '';
    if (!rqLine) add(A, 'no', 'No research question found. State it clearly, as a question, near the start (e.g. after a "Research question" heading).');
    else { var rc = ee ? RH.ee.rqCheck(rqLine, {}) : RH.ia.rqCheck(rqLine, {}), weak = rc.rows.filter(function (r) { return r[0] !== 'ok'; }); add(A, rc.score >= rc.max - 1 ? 'ok' : rc.score >= rc.max / 2 ? 'mid' : 'no', 'Research question found: ' + rc.level[0] + ' (' + rc.score + ' of ' + rc.max + ' checks).' + (weak.length ? ' To improve: ' + weak.map(function (r) { return r[1].replace(/<[^>]+>/g, ''); }).join(' ') : ''), rqLine); }
    // citations and references
    var cit = citations(bodyText.length ? full.replace(refs, ' ') : full), entries = refEntries(refs);
    if (!refWords) add(B, 'no', 'No reference list or bibliography found. Every source must be listed, in one consistent style.');
    else {
      add(B, entries.length >= (ee ? 10 : 3) ? 'ok' : 'mid', entries.length + ' reference(s) listed.' + (entries.length < (ee ? 10 : 3) ? (ee ? ' A strong essay usually draws on a wide, relevant range of sources.' : ' Aim for at least three sources to support the background and the scientific context.') : ''));
      var low2 = refs.toLowerCase(), notListed = cit.ad.filter(function (c) { return low2.indexOf(c.name.toLowerCase()) < 0; }).map(function (c) { return c.name + ' (' + c.year + ')'; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
      if (notListed.length) add(B, 'no', notListed.length + ' in-text citation(s) not found in the reference list: ' + notListed.slice(0, 8).join(', ') + '.');
      var bodyLow = full.replace(refs, ' ').toLowerCase(), uncited = entries.filter(function (r) { var a = (r.match(/^[^,(]+/) || [''])[0].trim().split(/\s+/)[0].replace(/[^A-Za-z'’-]/g, '').toLowerCase(); return a.length > 2 && bodyLow.indexOf(a) < 0; });
      if (uncited.length && !cit.num) add(B, 'mid', uncited.length + ' reference(s) never cited in the text, e.g. "' + uncited[0].slice(0, 80) + '…". Cite each source where you use it, or remove it.');
      var noAccess = entries.filter(function (r) { return /https?:\/\//.test(r) && !/doi\.org/.test(r) && !/(accessed|retrieved|viewed)/i.test(r); });
      if (noAccess.length) add(B, 'mid', noAccess.length + ' web reference(s) without the date you accessed them.');
      if (cit.ad.length && cit.num) add(B, 'mid', 'Both author–date (Name, year) and numbered [1] citations are used: choose one style.');
    }
    if (!cit.ad.length && !cit.num) add(B, 'no', 'No in-text citations found. Cite sources at the point you use their ideas, data or images.');
    var quotes = (full.match(/[“"][^”"]{25,}[”"](?!\s*\(|\s*\[)/g) || []).length; if (quotes) add(G, 'mid', quotes + ' quotation(s) not followed by a citation. Every quotation needs its source (and a page number where possible).');
    // over-claiming and causation
    var prove = full.match(/[^.]*\b(prove[sd]?|proof|definitely|certainly)\b[^.]*\./i); if (prove) add(CO, 'no', 'Over-claiming: data support or do not support a conclusion; they do not prove it.', prove[0]);
    if (/correlat|spearman|pearson|regression/i.test(full) && /\b(causes?|caused|leads? to|results? in)\b/i.test(full)) add(CO, 'mid', 'You report a correlation and also use cause-and-effect wording. A correlation alone does not show causation: check your wording.');
    if (!ee) {
      // IA: research design
      var method = sectionText(doc, /method|procedure/i, HEADS_MAIN), mw = w(method);
      if (mw) { var steps = method.split(/\n|(?<=\.)\s+(?=\d+[.)]\s)/).filter(function (s) { return w(s) > 3; }), withUnits = steps.filter(function (s) { return /\d\s*(°\s?C|cm³|cm3|ml|mL|dm³|mm|cm|\bm\b|g\b|mg|%|mol|M\b|s\b|min|h\b|lux|ppm)/i.test(s); }).length;
        add('rd', steps.length && withUnits / steps.length >= 0.4 ? 'ok' : 'mid', withUnits + ' of ' + steps.length + ' method steps give measured quantities with units. A reproducible method states quantities, times and temperatures.');
        if (!/(repeat|trial|replicat|times)/i.test(method)) add('rd', 'no', 'The method does not say how many times each measurement was repeated.');
        var vague = method.match(/[^.]*\b(some|a bit of|a little|a few drops|enough|an amount of)\b[^.]*\./i); if (vague) add('rd', 'mid', 'Vague quantity in the method: replace it with a measured amount.', vague[0]); }
      if (!/(independent variable)/i.test(full) || !/(dependent variable)/i.test(full)) add('rd', 'mid', 'Independent and dependent variables are not both named explicitly.');
      if (!/(control(led)? variable)/i.test(full)) add('rd', 'mid', 'No controlled variables are identified.');
      if (!/(safety|risk)/i.test(full) || !/ethic/i.test(full) || !/environment/i.test(full)) add('rd', 'mid', 'Safety, ethical and environmental considerations are not all addressed (part of the methodological considerations).');
      // IA: data analysis
      var tabs = doc.tables || (full.match(/\bTable\s+\d+/gi) || []).length; add('da', tabs ? 'ok' : 'no', tabs ? tabs + ' table(s) found.' : 'No data tables found. Raw and processed data are normally presented in titled tables.');
      add('da', /±|\+\/-|uncertaint/i.test(full + doc.tableText) ? 'ok' : 'no', /±|\+\/-|uncertaint/i.test(full + doc.tableText) ? 'Uncertainties are mentioned.' : 'No uncertainties (±) found. Record instrument uncertainties and show how they affect your results.');
      add('da', /(standard deviation|\bSD\b|standard error|range)/i.test(full + doc.tableText) ? 'ok' : 'mid', 'Spread of the repeats (standard deviation, standard error or range) is ' + (/(standard deviation|\bSD\b|standard error|range)/i.test(full + doc.tableText) ? 'reported.' : 'not reported.'));
      var test = /(t-test|t test|anova|chi[- ]squared|χ²|spearman|pearson|mann|wilcoxon|kruskal|regression)/i.test(full), pval = /\bp\s*[<=>≤]\s*0?\.\d+|p-value|p value/i.test(full);
      add('da', test && pval ? 'ok' : test ? 'mid' : 'mid', test ? (pval ? 'A statistical test and its p-value are reported.' : 'A statistical test is named but no p-value was found.') : 'No statistical test found. Choose one from your design (correlation, difference between groups, or counts) and report its result.');
      var figs = doc.images || (full.match(/\b(Figure|Fig\.)\s+\d+/gi) || []).length; add('da', figs ? 'ok' : 'mid', figs ? figs + ' figure(s)/graph(s) found.' : 'No graphs found. A graph usually shows the trend that answers the question.');
      if (figs && !/error bar/i.test(full)) add('da', 'mid', 'Graphs found, but the text never says what the error bars show (e.g. ± 1 SD).');
      if (!/(observ|qualitative|colour|color|bubbl|photograph)/i.test(full)) add('da', 'mid', 'No qualitative observations found (descriptions or photographs of what you saw).');
      if (!/(sample calculation|example calculation|worked example|calculated using|=\s*\(?\s*\d)/i.test(full)) add('da', 'mid', 'No sample calculation found. Show one worked example of each processing step.');
      var dps = {}; (doc.tableText.match(/\b\d+\.\d+\b/g) || []).forEach(function (n) { var k = n.split('.')[1].length; dps[k] = (dps[k] || 0) + 1; }); if (Object.keys(dps).length > 2) add('da', 'mid', 'Numbers in the tables use ' + Object.keys(dps).length + ' different numbers of decimal places. Within a column, record values to the same precision as the instrument.');
      // IA: conclusion
      var con = sectionText(doc, /conclusion/i, HEADS_MAIN);
      if (con) { add('co', /\d/.test(con) ? 'ok' : 'no', /\d/.test(con) ? 'The conclusion uses numbers from the data.' : 'The conclusion has no numbers: refer to your processed results.'); add('co', /(±|uncertaint|SD|standard deviation|error bar|overlap)/i.test(con) ? 'ok' : 'mid', 'Uncertainties are ' + (/(±|uncertaint|SD|standard deviation|error bar|overlap)/i.test(con) ? '' : 'not ') + 'interpreted in the conclusion (needed for a fully consistent conclusion).'); var cc = citations(con); add('co', cc.ad.length + cc.num ? 'ok' : 'no', cc.ad.length + cc.num ? 'The conclusion is compared with cited scientific context.' : 'The conclusion cites no published values or studies: compare your results with the accepted scientific context.'); if (!/(null hypothesis|hypothesis (is|was) (supported|rejected|accepted|not supported))/i.test(full)) add('co', 'mid', 'It is not clear whether the null hypothesis is rejected or the hypothesis is supported.'); }
      else add('co', 'no', 'No conclusion section found.');
      // IA: evaluation
      var ev = sectionText(doc, /evaluation|limitation|weakness/i, HEADS_MAIN);
      if (ev) { var gen = ev.match(/[^.]*\b(human error|more repeats|more trials|be more careful|not enough time|equipment was faulty)\b[^.]*\./i); if (gen) add('ev', 'mid', 'Possibly generic weakness: say exactly which step or instrument, how it affected the results, and why.', gen[0]); add('ev', /(improv|could be|should be|use a|instead)/i.test(ev) ? 'ok' : 'no', /(improv|could be|should be|use a|instead)/i.test(ev) ? 'Improvements are suggested.' : 'No improvements found. Give a realistic improvement for each weakness.'); add('ev', /(systematic|random)/i.test(ev) ? 'ok' : 'mid', 'Random and systematic errors are ' + (/(systematic|random)/i.test(ev) ? '' : 'not ') + 'distinguished.'); add('ev', /(impact|significant|major|minor|greatest|most important|relative)/i.test(ev) ? 'ok' : 'mid', 'The relative impact of the weaknesses is ' + (/(impact|significant|major|minor|greatest|most important|relative)/i.test(ev) ? '' : 'not ') + 'judged (the top band asks for it).'); }
      else add('ev', 'no', 'No evaluation section found.');
    } else {
      // EE: analysis, argument and evaluation signals
      var conn = (bodyText.match(/\b(therefore|thus|this suggests|this indicates|because|however|whereas|consequently|in contrast|this implies|it follows)\b/gi) || []).length, per = words ? conn / words * 1000 : 0;
      add('C', per >= 8 ? 'ok' : per >= 4 ? 'mid' : 'no', 'Analytical signposting: ' + conn + ' linking words such as "therefore", "however", "this suggests" (' + per.toFixed(1) + ' per 1,000 words). ' + (per < 8 ? 'Few links between evidence and claims can mean the essay is descriptive rather than analytical.' : 'The writing links evidence to claims.'));
      var concl = sectionText(doc, /conclusion/i, HEADS_MAIN);
      if (concl) { var rqW = (rqLine.toLowerCase().match(/[a-z]{5,}/g) || []).filter(function (x) { return ['which', 'there', 'their', 'these', 'extent', 'affect', 'effect', 'between'].indexOf(x) < 0; }), back = rqW.filter(function (x) { return concl.toLowerCase().indexOf(x) >= 0; }).length; add('C', rqW.length && back / rqW.length >= 0.4 ? 'ok' : 'mid', 'The conclusion ' + (rqW.length && back / rqW.length >= 0.4 ? 'returns to the key terms of the research question.' : 'does not clearly return to the research question: link the conclusion back to it.')); add('D', /(limitation|weakness|strength|unresolved|further research|could not|did not)/i.test(concl + sectionText(doc, /evaluation|limitation/i, HEADS_MAIN)) ? 'ok' : 'no', 'An evaluation of the essay (strengths and limitations of the research) is ' + (/(limitation|weakness|strength|unresolved|further research|could not|did not)/i.test(concl) ? 'present.' : 'not found. Criterion D asks you to evaluate the effectiveness of the essay.')); }
      else add('C', 'no', 'No conclusion section found.');
      add('D', /(significan|implication|important because|matters because)/i.test(bodyText) ? 'ok' : 'mid', 'The significance of the findings is ' + (/(significan|implication|important because|matters because)/i.test(bodyText) ? '' : 'not obviously ') + 'discussed.');
      if (/(reflective statement|reflection and progress|viva voce|in my reflection)/i.test(full)) add('E', 'mid', 'The essay seems to include reflection or RPF text. The reflective statement goes on the RPF, not in the essay.');
      add('A', doc.headings.length >= 4 ? 'ok' : 'mid', doc.headings.length + ' headings found. Structural conventions (headings, numbered figures and tables) help communicate the research.');
    }
    // writing hygiene
    var rep = full.match(/\b(\w{2,})\s+\1\b/i); if (rep) add(G, 'mid', 'Repeated word: "' + rep[0] + '".');
    var longS = (bodyText.match(/[^.!?]{300,}[.!?]/g) || []).length; if (longS) add(G, 'mid', longS + ' very long sentence(s) (over about 50 words). Split them for clarity.');
    var tn = (full.match(/\bTable\s+(\d+)/gi) || []).map(function (t) { return +t.match(/\d+/)[0]; }), fn = (full.match(/\bFigure\s+(\d+)/gi) || []).map(function (t) { return +t.match(/\d+/)[0]; });
    [['Table', tn], ['Figure', fn]].forEach(function (x) { var u = x[1].filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; }); if (u.length && u[u.length - 1] !== u.length) add(G, 'mid', x[0] + ' numbering has a gap (' + u.join(', ') + ').'); });
    if (/\b(chatgpt|gemini|copilot|claude|ai tool|artificial intelligence)\b/i.test(full) && !/(acknowledg|declar|used .* to|with the help of)/i.test(full)) add(G, 'mid', 'AI is mentioned. If you used an AI tool, acknowledge how, as your school and the IB require.');
    var count = { no: 0, mid: 0, ok: 0 }; items.forEach(function (i) { count[i.l]++; });
    return { at: new Date().toISOString(), file: doc.name, kind: kind, words: words, counts: count, items: items, rq: rqLine };
  };

  K.reportHtml = function (r, opts) {
    opts = opts || {}; var crit = (RH.cur && RH.cur.criteria) || [], groups = [['general', 'General: length, structure and writing']].concat(crit.map(function (c) { return [c.key, (r.kind === 'ee' ? 'Criterion ' + c.key + ': ' : '') + c.name]; }));
    var icon = { no: ['✘', 'no', 'Fix before submitting'], mid: ['◐', 'mid', 'Check'], ok: ['✔', 'ok', 'Fine'] };
    return '<div class="rh-card fadein"><div class="rh-head"><div><h3>Automatic check' + (r.file ? ': ' + E(r.file) : '') + '</h3><span class="small muted">' + RH.date(r.at, true) + ' · about ' + r.words + ' words</span></div><div class="btns"><span class="rh-badge warn">' + r.counts.no + ' to fix</span><span class="rh-badge info">' + r.counts.mid + ' to check</span><span class="rh-badge ok">' + r.counts.ok + ' fine</span></div></div>' +
      groups.map(function (g) { var its = r.items.filter(function (i) { return i.c === g[0]; }).sort(function (a, b) { return 'nomidok'.indexOf(a.l) - 'nomidok'.indexOf(b.l); }); if (!its.length) return ''; return '<details class="rh-item"' + (its.some(function (i) { return i.l === 'no'; }) || opts.open ? ' open' : '') + '><summary><b class="small">' + E(g[1]) + '</b> ' + (its.filter(function (i) { return i.l === 'no'; }).length ? '<span class="rh-badge warn">' + its.filter(function (i) { return i.l === 'no'; }).length + '</span>' : '') + '</summary><div class="rh-meter">' + its.map(function (i) { return '<div class="mrow"><span class="' + icon[i.l][1] + '" title="' + icon[i.l][2] + '">' + icon[i.l][0] + '</span><span class="small">' + E(i.m) + (i.e ? '<br><span class="muted">“' + E(i.e) + '”</span>' : '') + '</span></div>'; }).join('') + '</div></details>'; }).join('') +
      '<p class="small muted">Rule-based checks of the text, structure and references. They flag likely problems; they cannot judge quality or give a mark. Your supervisor and the criteria decide.</p></div>';
  };
  K.save = function (r) {   // keep the 10 most recent reports in the project
    if (!RH.owner) return; var list = RH.get('auto_checks', []).slice(-9); list.push({ at: r.at, file: r.file, kind: r.kind, words: r.words, counts: r.counts, items: r.items.filter(function (i) { return i.l !== 'ok'; }).slice(0, 40) }); RH.set('auto_checks', list);
  };

  /* ---------- the student's Studio work as a document (for checking, and for the IA report builder) ---------- */
  K.studioDoc = function () {
    var d = RH.p.data || {}, paras = [], heads = [], H = function (t) { heads.push(t); paras.push(t); }, Pp = function (t) { if (t && String(t).trim()) String(t).split(/\n+/).forEach(function (x) { if (x.trim()) paras.push(x.trim()); }); };
    if (RH.p.kind === 'ee') {
      var x = d.ee_write || {}; H('Research question'); Pp(RH.get('ee_rq.text', ''));
      (x.sections || []).forEach(function (s) { H(s.heading); Pp(s.text); });
      return { name: 'Writing studio', paras: paras, headings: heads, tables: 0, images: 0, tableText: '' };
    }
    var v = d.variables || {}, me = d.method || {}, c = d.conclusion || {}, h = d.hypothesis || {};
    H('Research question'); Pp((d.rq || {}).text); Pp((d.rq || {}).context); H('Background'); Pp((d.topic || {}).background); H('Hypothesis'); Pp(h.null && 'Null hypothesis: ' + h.null); Pp(h.alt && 'Alternative hypothesis: ' + h.alt); Pp(h.prediction); Pp(h.explanation); Pp(h.theory);
    H('Variables'); Pp(v.iv && 'Independent variable: ' + (v.iv.name || '') + '. Values: ' + (v.iv.levels || '') + '. ' + (v.iv.how || '')); Pp(v.dv && 'Dependent variable: ' + (v.dv.name || '') + '. ' + (v.dv.measure || '')); (v.controls || []).forEach(function (r) { Pp('Controlled variable: ' + (r.name || '') + ': ' + (r.how || '')); });
    H('Method'); Pp(me.materials); Pp(me.apparatus); (me.procedure || []).forEach(function (s, i) { Pp((i + 1) + '. ' + s); }); H('Safety, ethics and environment'); Pp(me.safety); Pp(me.ethics); Pp(me.environment);
    H('Data analysis'); ((d.analysis || {}).saved || []).forEach(function (a) { Pp(a.summary); }); Pp((d.analysis || {}).notes); (d.graphs || []).forEach(function (g) { Pp('Figure ' + g.fig + ': ' + (g.title || '') + '. ' + (g.caption || '')); });
    H('Conclusion'); ['answer', 'quant', 'pattern', 'stats', 'mechanism', 'literature', 'hypothesis'].forEach(function (k) { Pp(c[k]); });
    H('Evaluation'); ((d.evaluation || {}).rows || []).forEach(function (r) { Pp([r.what, r.effect, r.why, r.improve, r.strengthen].filter(Boolean).join(' ')); });
    H('References'); Pp(c.references);
    var dsTxt = (RH.extra && RH.extra.datasets) ? '± uncertainty table' : '';
    return { name: 'My Studio work', paras: paras, headings: heads, tables: RH.extra && RH.extra.datasets ? 1 : 0, images: (d.graphs || []).length, tableText: dsTxt };
  };

  /* ---------- IA report builder: DOCX from the Studio stages (text, tables, graphs) ---------- */
  K.buildIA = function () {
    if (!window.JSZip) return Promise.reject(new Error('The export tool did not load.'));
    var d = RH.p.data || {}, esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
    var body = [], media = [];
    var para = function (t, st) { if (t == null || !String(t).trim()) return; String(t).split(/\n+/).forEach(function (line) { if (line.trim()) body.push('<w:p>' + (st ? '<w:pPr><w:pStyle w:val="' + st + '"/></w:pPr>' : '') + '<w:r><w:t xml:space="preserve">' + esc(line.trim()) + '</w:t></w:r></w:p>'); }); };
    var cellX = function (t, b) { return '<w:tc><w:tcPr><w:tcBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/></w:tcBorders></w:tcPr><w:p><w:r>' + (b ? '<w:rPr><w:b/></w:rPr>' : '') + '<w:t xml:space="preserve">' + esc(t) + '</w:t></w:r></w:p></w:tc>'; };
    var table = function (head, rows) { body.push('<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/></w:tblPr>' + '<w:tr>' + head.map(function (h) { return cellX(h, true); }).join('') + '</w:tr>' + rows.map(function (r) { return '<w:tr>' + r.map(function (c) { return cellX(c); }).join('') + '</w:tr>'; }).join('') + '</w:tbl><w:p/>'); };
    var image = function (png, cx, cy) { var id = media.length + 1; media.push(png); body.push('<w:p><w:r><w:drawing><wp:inline><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:docPr id="' + id + '" name="Figure ' + id + '"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="' + id + '" name="figure' + id + '.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rImg' + id + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'); };
    var v = d.variables || {}, me = d.method || {}, c = d.conclusion || {}, h = d.hypothesis || {}, rq = d.rq || {};
    para(RH.p.title, 'Title'); para(rq.text, 'Subtitle');
    para('Introduction', 'Heading1'); para('Research question', 'Heading2'); para(rq.text); para(rq.context); para((d.topic || {}).interests); para((d.topic || {}).pilot);
    para('Background information', 'Heading2'); para((d.topic || {}).background);
    para('Hypothesis', 'Heading2'); para(h.null && 'Null hypothesis (H₀): ' + h.null); para(h.alt && 'Alternative hypothesis (H₁): ' + h.alt); para(h.prediction); para(h.explanation); para(h.theory);
    para('Research design', 'Heading1'); para('Variables', 'Heading2');
    table(['Variable', 'Type', 'How it is changed, measured or controlled', 'Why / equipment'], [[(v.iv || {}).name || '', 'Independent', ((v.iv || {}).levels ? 'Values: ' + v.iv.levels + '. ' : '') + ((v.iv || {}).how || ''), (v.iv || {}).equip || ''], [(v.dv || {}).name || '', 'Dependent', (v.dv || {}).measure || '', ((v.dv || {}).why || '') + ' ' + ((v.dv || {}).equip || '')]].concat((v.controls || []).map(function (r) { return [r.name || '', 'Controlled', r.how || '', (r.why || '') + ' ' + (r.equip || '')]; })));
    var dz = v.design || {}; if (Object.keys(dz).length) table(['Design feature', 'Plan'], [['Experimental groups', dz.groups || ''], ['Control group', dz.control || ''], ['Repeats per level', dz.trials || ''], ['Sample size', dz.sample || ''], ['Range', dz.range || ''], ['Interval', dz.interval || ''], ['Precision', dz.precision || ''], ['Reliability', dz.reliability || '']].filter(function (r) { return r[1]; }));
    para('Apparatus and materials', 'Heading2'); para(me.materials); para(me.apparatus); para(me.setup);
    para('Method', 'Heading2'); (me.procedure || []).filter(Boolean).forEach(function (s, i) { para((i + 1) + '. ' + s); }); para(me.collection);
    para('Risk assessment', 'Heading2'); para(me.safety && 'Safety: ' + me.safety); para(me.ethics && 'Ethics: ' + me.ethics); para(me.environment && 'Environment: ' + me.environment); para((d.safety || {}).risks);
    para('Data analysis', 'Heading1');
    return RH.S.db.from('research_datasets').select('*').eq('project_id', RH.p.id).then(function (r) {
      (r.data || []).forEach(function (ds, k) {
        para('Raw data: ' + (ds.name || 'data set ' + (k + 1)), 'Heading2'); var rows = ds.raw_locked && (ds.raw || []).length ? ds.raw : ds.rows || [];
        para('Table ' + (k * 2 + 1) + ': ' + (ds.name || 'Raw data') + (ds.raw_locked ? ' (original raw data)' : ''));
        table((ds.columns || []).map(function (c) { return c.name + (c.unit ? ' / ' + c.unit : '') + (c.unc ? ' (±' + c.unc + ')' : ''); }), rows.map(function (rw) { return rw.map(function (x) { return x == null ? '' : String(x); }); }));
        para(ds.observations && 'Qualitative observations: ' + ds.observations);
        var pr = RH.data.processed(ds); if (pr && pr.rows.length) { var u = pr.dvc.unit ? ' / ' + pr.dvc.unit : ''; para('Table ' + (k * 2 + 2) + ': Processed data'); table([(pr.iv.name || 'IV') + (pr.iv.unit ? ' / ' + pr.iv.unit : ''), 'n', 'Mean' + u, 'SD' + u, 'SE' + u, '± half range' + u], pr.rows.map(function (q) { var f = function (x) { return isFinite(x) ? RStats.sig(x, 3) : ''; }; return [String(q.x), String(q.n), f(q.mean), f(q.sd), f(q.se), f(q.half)]; })); }
      });
      para('Statistical analysis', 'Heading2'); ((d.analysis || {}).saved || []).forEach(function (a) { para(a.summary); }); para((d.analysis || {}).notes);
      var gs = d.graphs || [], first = (r.data || [])[0];
      var chain = Promise.resolve();
      gs.forEach(function (g) { chain = chain.then(function () { if (!first) return; var svg = RH.data.render(g, RH.data.graphData(Object.assign({}, g, { type: g.trend ? 'scatter' : g.type }), first)); return new Promise(function (ok) { var img = new Image(), cv = document.createElement('canvas'); cv.width = 1520; cv.height = 960; img.onload = function () { var x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height); x.drawImage(img, 0, 0, cv.width, cv.height); cv.toBlob(function (b) { b.arrayBuffer().then(function (ab) { image(ab, 5486400, 3465000); para('Figure ' + g.fig + ': ' + (g.title || '') + (g.caption ? '. ' + g.caption : '')); ok(); }); }); }; img.onerror = function () { ok(); }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }); }); });
      return chain;
    }).then(function () {
      para('Conclusion', 'Heading1'); ['answer', 'quant', 'pattern', 'stats', 'mechanism', 'hypothesis'].forEach(function (k) { para(c[k]); }); para('Scientific context', 'Heading2'); para(c.literature);
      para('Evaluation', 'Heading1'); var ev = ((d.evaluation || {}).rows || []).filter(function (r) { return r.what; });
      if (ev.length) table(['Limitation', 'Type and impact', 'Effect on the results', 'Why it occurred', 'Improvement', 'How it strengthens the investigation'], ev.map(function (r) { return [r.what || '', [r.type, r.impact].filter(Boolean).join(', '), r.effect || '', r.why || '', r.improve || '', r.strengthen || '']; }));
      para('References', 'Heading1'); para(c.references || 'Add your reference list here.');
      var z = new window.JSZip(), rels = media.map(function (_, i) { return '<Relationship Id="rImg' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/figure' + (i + 1) + '.png"/>'; }).join('');
      media.forEach(function (m, i) { z.file('word/media/figure' + (i + 1) + '.png', m); });
      z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>');
      z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
      z.file('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' + rels + '</Relationships>');
      z.file('word/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:rPr><w:i/><w:sz w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="0F766E"/><w:sz w:val="30"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style></w:styles>');
      z.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>' + body.join('') + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>');
      return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    }).then(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (RH.p.title || 'biology-ia').replace(/\W+/g, '-') + '-draft.docx'; a.click(); return b; });
  };

  /* ---------- the pre-submission check page ---------- */
  K.page = function () {
    var p = RH.p, ee = p.kind === 'ee', last = RH.get('auto_checks', []).slice(-1)[0];
    var m = RH.shell('check', '<div class="rh-card"><div class="rh-head"><div><p class="label">' + E(p.title) + '</p><h2>✅ Pre-submission check</h2></div>' + RH.badge(p.status) + '</div><p class="small">Check your work automatically before you submit: upload your draft (Word or PDF), or check what you have written in the ' + (ee ? 'Writing studio' : 'IA Studio') + '. The check looks at length, structure, the research question, ' + (ee ? 'analysis, discussion and evaluation signals' : 'method detail, data, uncertainty, statistics, conclusion and evaluation') + ', and whether every citation is in your reference list.</p>' +
      (RH.owner ? '<div class="btns"><label class="btn main sm">📄 Check a file<input type="file" id="ck-file" accept=".docx,.pdf" hidden></label><button class="btn sm" id="ck-studio" type="button">🧩 Check my ' + (ee ? 'Writing studio' : 'Studio') + ' work</button>' + (ee ? '' : '<button class="btn sm" id="ck-build" type="button">🛠️ Build my IA report (Word) from my stages</button>') + '<a class="btn sm" href="#/p/' + p.id + '/submit">📤 Submission centre</a></div>' : '') + '<div id="ck-msg" class="small muted" aria-live="polite"></div></div>' +
      '<div class="rh-card"><h3>Readiness from your Studio stages</h3><div id="ck-ready"></div></div><div id="ck-out">' + (last ? '<p class="small muted">Your last check:</p>' + K.reportHtml(Object.assign({ items: last.items }, last)) : '') + '</div><div id="ck-ai"></div>' +
      '<div class="rh-card"><h3>Earlier checks</h3><div id="ck-hist"></div></div>');
    var ready = ee ? RH.ee.readiness(p) : (function () { var r = RH.ia.readiness(p), out = []; Object.keys(r).forEach(function (k) { r[k].forEach(function (x) { out.push(x); }); }); return out; })();
    m.querySelector('#ck-ready').innerHTML = RH.ia.meter(ready);
    var hist = RH.get('auto_checks', []); m.querySelector('#ck-hist').innerHTML = hist.length ? '<table class="dt"><thead><tr><th>When</th><th>What</th><th>Words</th><th>To fix</th><th>To check</th></tr></thead><tbody>' + hist.slice().reverse().map(function (h) { return '<tr><td>' + RH.date(h.at, true) + '</td><td>' + E(h.file) + '</td><td class="num">' + h.words + '</td><td class="num">' + h.counts.no + '</td><td class="num">' + h.counts.mid + '</td></tr>'; }).join('') + '</tbody></table><p class="small muted">Fewer issues each time shows your draft improving. Your supervisor sees these checks too.</p>' : '<p class="small muted">No checks yet.</p>';
    var show = function (r, text) {
      m.querySelector('#ck-out').innerHTML = K.reportHtml(r); K.save(r);
      m.querySelector('#ck-ai').innerHTML = RH.owner ? '<div class="rh-card"><h3>Indicative feedback from the Research Mentor</h3><p class="small">The mentor reads this draft against the criteria and suggests what to improve. It will not rewrite it.' + (ee ? ' Your reflective statement is never sent.' : '') + '</p>' + RH.mentorBox('draft', 'Ask the mentor about this draft', function () { return text.slice(0, 12000); }) + '</div>' : '';
    };
    var f = m.querySelector('#ck-file'); if (f) f.onchange = function () { var file = f.files[0]; if (!file) return; m.querySelector('#ck-msg').textContent = 'Reading ' + file.name + '…'; K.read(file).then(function (doc) { var r = K.analyse(doc, p.kind); m.querySelector('#ck-msg').textContent = ''; show(r, doc.paras.join('\n')); }).catch(function (e) { m.querySelector('#ck-msg').textContent = RH.S.nice(e); }); };
    var st = m.querySelector('#ck-studio'); if (st) st.onclick = function () { var doc = K.studioDoc(); if (doc.paras.join(' ').length < 50) return RH.toast('There is not enough in your Studio yet'); var r = K.analyse(doc, p.kind); show(r, doc.paras.join('\n')); };
    var bd = m.querySelector('#ck-build'); if (bd) bd.onclick = function () { bd.disabled = true; m.querySelector('#ck-msg').textContent = 'Building your report from your stages…'; K.buildIA().then(function () { m.querySelector('#ck-msg').textContent = 'Downloaded. It is built only from what you wrote in the Studio: edit it in Word, then check and submit it.'; }).catch(function (e) { m.querySelector('#ck-msg').textContent = RH.S.nice(e); }).then(function () { bd.disabled = false; }); };
  };
})();
