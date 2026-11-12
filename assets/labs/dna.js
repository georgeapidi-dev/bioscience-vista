/* DNA replication laboratory · Learnova · by Learnova */
(function () {
  var M = window.LABM, LABS = window.LABS = window.LABS || {};
  LABS.dna = {
    id: 'dna', title: 'DNA replication laboratory',
    tags: ['Biology', 'Molecular biology', 'MYP 5', 'IB DP D1.1', 'IGCSE', 'A Level'],
    background: '<p>Before a cell divides, its DNA is copied by <b>semi-conservative replication</b>: each new double helix has one old (template) strand and one new strand.</p>' +
      '<ol><li><b>Helicase</b> unwinds the double helix and breaks the hydrogen bonds between bases, opening a <b>replication fork</b>.</li>' +
      '<li><b>Primase</b> adds a short RNA <b>primer</b>. DNA polymerase cannot start a new strand on its own; it can only add to an existing 3′ end.</li>' +
      '<li><b>DNA polymerase III</b> adds free nucleotides by <b>complementary base pairing</b> (A with T, C with G), always building the new strand in the <b>5′ → 3′</b> direction.</li>' +
      '<li>Because the two strands are <b>antiparallel</b>, one new strand (the <b>leading strand</b>) is built continuously towards the fork; the other (the <b>lagging strand</b>) is built in short <b>Okazaki fragments</b> away from the fork.</li>' +
      '<li><b>DNA polymerase I</b> replaces the RNA primers with DNA, and <b>DNA ligase</b> joins the fragments by sealing the sugar–phosphate backbone.</li></ol>' +
      '<p>DNA polymerase III also <b>proofreads</b>: if it adds a wrong base it removes it (3′ → 5′ exonuclease activity). Mismatch-repair enzymes fix most of the errors that remain.</p>',
    objectives: ['Carry out the steps of DNA replication in the correct order, using each enzyme.', 'Explain why the leading strand is continuous and the lagging strand is made in fragments.', 'Apply complementary base pairing.', 'Measure how proofreading and mismatch repair reduce the number of replication errors.'],
    rq: 'How do proofreading and mismatch repair affect the number of errors left after DNA is copied?',
    hypPrompt: 'Predict how many errors will be left with and without proofreading, and explain why.',
    hypothesis: { marks: 3, points: [
      { re: [/\bif\b.*\bthen\b|fewer|less|reduce|lower/], marks: 1, ok: 'Clear prediction.', miss: 'Predict the direction of the effect (fewer errors with proofreading).' },
      { re: [/proofread|exonuclease|remove|correct|check/], marks: 1, ok: 'You mention proofreading removing wrong bases.', miss: 'Explain that DNA polymerase removes wrongly paired nucleotides.' },
      { re: [/complementary|base pair|mismatch|wrong base|a.?t|c.?g/], marks: 1, ok: 'You link errors to base pairing.', miss: 'Mention complementary base pairing (A–T, C–G) and mismatched bases.' }] },
    variables: { iv: 'error-checking: none, proofreading, or proofreading + mismatch repair', dv: 'number of errors left per million bases copied',
      cv: ['the DNA polymerase base-selection error rate', 'the number of bases copied', 'the same random template sequence'] },
    apparatus: ['Model template DNA strand (24 base pairs for building, up to 1 million for the copying experiment)', 'Enzymes: helicase, primase, DNA polymerase III, DNA polymerase I, DNA ligase', 'Free nucleotides: A, T, C, G (and U in RNA primers)'],
    safety: ['This is a virtual lab. In a real molecular-biology lab: wear gloves, and treat DNA stains such as ethidium bromide as hazardous.'],
    method: ['<b>Part A, build it:</b> use <b>Helicase</b> to open the fork. Add a primer with <b>Primase</b>, then add nucleotides with <b>DNA pol III</b> by choosing the complementary base.', 'Work on the leading strand and the lagging strand. On the lagging strand each Okazaki fragment needs its own primer.', 'Use <b>DNA pol I</b> to replace the RNA primers, then <b>Ligase</b> to seal the gaps. Press <b>Check my copy</b>.', '<b>Part B, measure it:</b> choose the number of bases and the polymerase error rate. Turn proofreading and mismatch repair on or off, then press <b>Copy the DNA</b> and <b>Record trial</b>.', 'Repeat each setting three times and compare errors per million bases.'],
    controls: [
      { id: 'n', label: 'Part B: bases to copy', type: 'select', value: '100000', options: [['10000', '10 000'], ['100000', '100 000'], ['1000000', '1 000 000']] },
      { id: 'err', label: 'Part B: polymerase base-selection error rate', type: 'select', value: '0.001', options: [['0.01', '1 in 100 (exaggerated)'], ['0.001', '1 in 1 000 (exaggerated)'], ['0.0001', '1 in 10 000'], ['0.00001', '1 in 100 000 (realistic)']] },
      { id: 'proof', label: 'Proofreading by DNA polymerase', type: 'check', value: true },
      { id: 'mmr', label: 'Mismatch repair after copying', type: 'check', value: false }
    ],
    columns: [
      { key: 'n', label: 'Bases copied', dp: 0 }, { key: 'err', label: 'Polymerase errors per million', dp: 0 }, { key: 'checks', label: 'Error checking', num: false, group: true },
      { key: 'made', label: 'Wrong bases added', dp: 0 }, { key: 'caught', label: 'Removed by proofreading', dp: 0 }, { key: 'fixed', label: 'Fixed by mismatch repair', dp: 0 },
      { key: 'left', label: 'Errors left', dp: 0 }, { key: 'perM', label: 'Errors left per million', dp: 2 }
    ],
    graph: { x: 'err', y: 'perM', group: 'checks' },
    hints: ['Helicase first: polymerase needs single-stranded template.', 'Polymerase cannot start a strand: it needs a primer with a free 3′ end. Use Primase first.', 'The new strand is antiparallel to its template, and always grows 5′ → 3′. On the lagging strand that means growing away from the fork.', 'A pairs with T, C pairs with G. In an RNA primer, A pairs with U.', 'Part B: keep the error rate and number of bases the same; change only the error checking.'],
    analyse: [
      { id: 'fold', q: 'From Part B, about how many times fewer errors are left with proofreading than without it (same error rate)?', marks: 2, lines: 1,
        number: { value: function (c) { return fold(c.trials); }, tol: 0.5, unit: 'times', dp: 0, missing: 'Record Part B trials with and without proofreading at the same error rate.', hint: 'Divide the mean errors per million without proofreading by the mean with proofreading.' } },
      { id: 'lag', q: 'Explain why the lagging strand is made in fragments but the leading strand is made continuously.', marks: 4, lines: 5, points: [
        { re: [/antiparallel|opposite direction/], marks: 1, ok: 'You use antiparallel strands.', miss: 'Mention that the two strands are antiparallel.' },
        { re: [/5.{0,3}(→|to|-|–).{0,3}3|five prime to three prime/], marks: 1, ok: '5′ → 3′ direction.', miss: 'DNA polymerase can only build in the 5′ → 3′ direction.' },
        { re: [/towards? the fork|same direction as the fork|follows the fork|continuous/], marks: 1, ok: 'Leading strand grows towards the fork.', miss: 'The leading strand grows towards the fork, so it can be continuous.' },
        { re: [/away from the fork|okazaki|new primer|each fragment|primers?/], marks: 1, ok: 'Lagging strand needs repeated primers.', miss: 'The lagging strand grows away from the fork, so new Okazaki fragments, each with a primer, must be started as the fork opens.' }] },
      { id: 'semi', q: 'Explain why DNA replication is called semi-conservative.', marks: 2, lines: 3, points: [
        { re: [/(one|1) (old|original|parent|template)/], marks: 1, ok: 'One old strand.', miss: 'Each new molecule keeps one original (template) strand.' },
        { re: [/(one|1) new|newly (made|synthesi[sz]ed)/], marks: 1, ok: 'One new strand.', miss: '…and one newly made strand.' }] },
      { id: 'concl', q: 'Write a conclusion that answers the research question, using numbers from your table.', marks: 3, lines: 4, points: [
        { re: [/\d/], marks: 1, ok: 'You quote data.', miss: 'Quote errors per million from your table.' },
        { re: [/proofread.*(fewer|less|reduc|lower)|(fewer|less|reduc|lower).*proofread/], marks: 1, ok: 'Effect of proofreading stated.', miss: 'State the effect of proofreading.' },
        { re: [/mismatch.*(fewer|less|reduc|further|even)|(fewer|less|reduc|further).*mismatch/], marks: 1, ok: 'Effect of mismatch repair stated.', miss: 'State the extra effect of mismatch repair.' }] }
    ],
    evaluate: [
      { id: 'real', q: 'The model lets you set error rates of 1 in 100. Real DNA polymerase makes about 1 error in 100 000 bases before checking. Why does the model allow exaggerated rates?', marks: 2, lines: 3, points: [
        { re: [/see|visible|count|enough|measur|too few|rare|zero/], marks: 1, ok: 'So errors are frequent enough to count.', miss: 'Real errors are so rare you would see almost none in a small sample.' },
        { re: [/proportion|ratio|same (effect|pattern)|fold|percentage|relative/], marks: 1, ok: 'The relative effect of checking stays the same.', miss: 'The proportion removed by proofreading is the same, so the comparison is still valid.' }] },
      { id: 'mut', q: 'An error that is not repaired becomes a mutation. Explain why a cell that copies 6 billion bases still has a few new mutations each time it divides.', marks: 2, lines: 3, points: [
        { re: [/billion|6 ?000 ?000 ?000|large number|so many bases|huge/], marks: 1, ok: 'The genome is very large.', miss: 'The genome is huge (6 × 10⁹ bases).' },
        { re: [/1 in|per billion|10.?9|rate|small (chance|probability)|not 100|never perfect/], marks: 1, ok: 'Even a tiny error rate gives a few errors.', miss: 'Even after checking, about 1 in 10⁹ errors remain, so a few slip through.' }] }
    ],
    model: '<ul><li>Part A uses a 24-base-pair model with Okazaki fragments of 6 nucleotides (real fragments are about 1000–2000 nucleotides in bacteria and 100–200 in eukaryotes). Primers are 2 nucleotides here (about 10 in reality).</li>' +
      '<li>Part B copies a random template. Each base is wrong with the probability you choose. Proofreading removes 99 % of wrong bases; mismatch repair fixes 99.9 % of what is left. These are typical textbook values (overall about 1 error in 10⁹–10¹⁰ bases in real cells).</li>' +
      '<li>Real polymerases work at hundreds of bases per second; in the model the enzymes act when you click. The model does not show topoisomerase, single-strand binding proteins or the sliding clamp.</li></ul>',
    setup: setup
  };

  function fold(trials) {
    function mean(f) { var a = trials.filter(f).map(function (t) { return t.perM; }); return a.length ? a.reduce(function (s, v) { return s + v; }, 0) / a.length : null; }
    var rates = {}; trials.forEach(function (t) { rates[t.err] = 1; });
    var best = null;
    Object.keys(rates).forEach(function (r) {
      var off = mean(function (t) { return t.err == r && t.checks === 'none'; }), on = mean(function (t) { return t.err == r && t.checks === 'proofreading'; });
      if (off != null && on != null && on > 0) best = off / on;
    });
    return best;
  }

  function setup(api) {
    var N = 24, FR = 6, tpl = M.randomDNA(N, 11 + Math.floor(Math.random() * 1000)), PAIR = M.PAIR, RNAPAIR = { A: 'U', T: 'A', C: 'G', G: 'C' };
    var top = tpl.split(''), bot = top.map(function (b) { return PAIR[b]; });
    // leading strand pairs with the TOP template (3'→5' left to right) and grows left → right (towards the fork)
    // lagging strand pairs with the BOTTOM template (5'→3' left to right) and grows right → left (away from the fork)
    var S;
    function reset() { S = { fork: 0, lead: new Array(N).fill(null), lag: new Array(N).fill(null), nicks: {}, errors: 0, caught: 0, msg: '' }; }
    reset();
    var tool = 'helicase', strand = 'lead';
    api.stage.innerHTML = '<div class="vl-btns" id="dn-tools" role="group" aria-label="Enzymes"></div>' +
      '<div class="vl-btns" style="margin:6px 0"><label><input type="radio" name="dn-s" value="lead" checked> Leading strand</label><label><input type="radio" name="dn-s" value="lag"> Lagging strand</label></div>' +
      '<div class="vl-btns" id="dn-bases" role="group" aria-label="Nucleotides"></div>' +
      '<div style="overflow-x:auto"><svg id="dn-sv" viewBox="0 0 760 300" style="min-width:620px;width:100%;height:auto;background:#f4f7fb;border-radius:12px" role="img" aria-label="Replication fork"></svg></div>' +
      '<p class="vl-note" id="dn-msg" role="status" style="min-height:2.6em"></p>' +
      '<div class="vl-btns"><button type="button" class="vl-btn" id="dn-check">✔ Check my copy</button><button type="button" class="vl-btn" id="dn-new">↺ New DNA</button></div>' +
      '<hr style="border:0;border-top:1px solid #d6dde6;margin:14px 0"><h3 style="margin:.2em 0">Part B: copying a whole genome</h3><p class="vl-note">Set the Part B options in <b>Controls</b>, then press <b>Copy the DNA</b>.</p><canvas class="vl-chart" id="dn-ch" style="height:200px"></canvas>';
    var $ = function (q) { return api.stage.querySelector(q); };
    var TOOLS = [['helicase', 'Helicase'], ['primase', 'Primase'], ['pol3', 'DNA pol III'], ['pol1', 'DNA pol I'], ['ligase', 'Ligase']];
    $('#dn-tools').innerHTML = TOOLS.map(function (t) { return '<button type="button" class="vl-btn" data-t="' + t[0] + '" aria-pressed="' + (t[0] === tool) + '">' + t[1] + '</button>'; }).join('');
    $('#dn-bases').innerHTML = ['A', 'T', 'C', 'G'].map(function (b) { return '<button type="button" class="vl-btn" data-b="' + b + '" title="Add ' + b + ' with DNA polymerase III">+ ' + b + '</button>'; }).join('') + '<span class="vl-note">Nucleotides for DNA pol III</span>';
    api.stage.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { tool = b.getAttribute('data-t'); api.stage.querySelectorAll('[data-t]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); x.classList.toggle('main', x === b); }); act(); }; });
    api.stage.querySelector('[data-t=helicase]').classList.add('main');
    api.stage.querySelectorAll('[data-b]').forEach(function (b) { b.onclick = function () { tool = 'pol3'; api.stage.querySelectorAll('[data-t]').forEach(function (x) { x.classList.toggle('main', x.getAttribute('data-t') === 'pol3'); }); addBase(b.getAttribute('data-b')); }; });
    api.stage.querySelectorAll('[name=dn-s]').forEach(function (r) { r.onchange = function () { strand = r.value; draw(); }; });
    $('#dn-new').onclick = function () { tpl = M.randomDNA(N, Math.floor(Math.random() * 1e6)); top = tpl.split(''); bot = top.map(function (b) { return PAIR[b]; }); reset(); say('New template. Start with helicase.'); draw(); };
    $('#dn-check').onclick = check;
    function say(t) { S.msg = t; $('#dn-msg').innerHTML = t; }
    // next position for each strand
    function nextLead() { for (var i = 0; i < N; i++) if (!S.lead[i]) return i; return -1; }
    function fragOf(i) { return Math.floor(i / FR); }
    function lagTarget() {   // the lagging-strand position pol III should fill next: right to left inside the newest primed fragment
      for (var f = Math.floor(N / FR) - 1; f >= 0; f--) {
        var hi = f * FR + FR - 1; if (!S.lag[hi] || S.lag[hi].k !== 'rna') continue;
        for (var i = hi - 2; i >= f * FR; i--) if (!S.lag[i]) return i;
      }
      return -1;
    }
    function act() {
      if (tool === 'helicase') {
        if (S.fork >= N) return say('The whole template is already unwound.');
        S.fork = Math.min(N, S.fork + 3); say('Helicase broke the hydrogen bonds between ' + (S.fork >= N ? 'the last' : 'three more') + ' base pairs. The fork is now at base ' + S.fork + '.');
      } else if (tool === 'primase') {
        if (strand === 'lead') {
          if (S.lead[0]) return say('The leading strand already has its primer. It only needs one, because it grows continuously towards the fork.');
          if (S.fork < 2) return say('Unwind the DNA first: primase needs single-stranded template.');
          S.lead[0] = { b: RNAPAIR[top[0]], k: 'rna' }; S.lead[1] = { b: RNAPAIR[top[1]], k: 'rna' }; say('Primase made an RNA primer (pink) on the leading strand. Note the U instead of T.');
        } else {
          var f = -1; for (var k = 0; k < N / FR; k++) { var hi = k * FR + FR - 1; if (S.fork > hi && !S.lag[hi]) { f = k; } }
          if (f < 0) return say(S.fork < FR ? 'Unwind at least ' + FR + ' base pairs: the lagging-strand primer is placed near the fork.' : 'Every unwound section already has a primer. Unwind more with helicase.');
          var h = f * FR + FR - 1; S.lag[h] = { b: RNAPAIR[bot[h]], k: 'rna' }; S.lag[h - 1] = { b: RNAPAIR[bot[h - 1]], k: 'rna' };
          say('Primase made an RNA primer near the fork for Okazaki fragment ' + (f + 1) + '. DNA pol III will extend it AWAY from the fork (5′ → 3′).');
        }
      } else if (tool === 'pol1') {
        var n = 0;
        [['lead', top], ['lag', bot]].forEach(function (p) { var arr = S[p[0]]; arr.forEach(function (x, i) {
          if (x && x.k === 'rna') { var done = p[0] === 'lead' ? nextLead() === -1 || nextLead() > 3 : (function () { var f = fragOf(i); for (var j = f * FR; j < f * FR + FR - 2; j++) if (!arr[j]) return false; return true; })();
            if (done) { arr[i] = { b: PAIR[p[1][i]], k: 'dna1' }; n++; if (p[0] === 'lag' && i % FR === FR - 1 && i + 1 < N) S.nicks[i] = true; } } }); });
        Object.keys(S.nicks).length;
        say(n ? 'DNA polymerase I replaced ' + n + ' RNA nucleotides with DNA. Gaps (nicks) in the backbone remain between fragments: use ligase.' : 'No primers ready to replace. Pol I replaces a primer once DNA has been built after it.');
      } else if (tool === 'ligase') {
        var keys = Object.keys(S.nicks).filter(function (k) { return S.nicks[k] && S.lag[+k + 1] && S.lag[+k + 1].k !== 'rna'; });
        if (!keys.length) return say('Nothing to seal yet. Ligase joins neighbouring DNA fragments after DNA pol I has replaced the primer between them.');
        keys.forEach(function (k) { S.nicks[k] = 'sealed'; }); say('DNA ligase sealed ' + keys.length + ' gap(s) in the sugar–phosphate backbone.');
      } else say('Choose a nucleotide (A, T, C or G) for DNA pol III to add.');
      draw();
    }
    function addBase(b) {
      var proof = api.vals().proof, i, tb;
      if (strand === 'lead') {
        if (!S.lead[0]) return say('DNA polymerase III cannot start a new strand. It needs a primer with a free 3′ end: use Primase first.');
        i = nextLead(); if (i < 0) return say('The leading strand is complete.');
        if (i >= S.fork) return say('DNA polymerase has reached the fork. Unwind more with helicase.');
        tb = top[i];
      } else {
        i = lagTarget(); if (i < 0) return say(S.lag.some(function (x) { return x; }) ? 'This fragment is finished. Unwind further, then add a new primer for the next Okazaki fragment.' : 'Add a primer to the lagging strand first (Primase).');
        tb = bot[i];
      }
      var right = PAIR[tb], arr = S[strand];
      if (b !== right) {
        if (proof) { S.caught++; say('✗ ' + b + ' does not pair with ' + tb + '. <b>Proofreading:</b> DNA polymerase III removed the wrong nucleotide (3′ → 5′ exonuclease). Try again.'); draw(); return; }
        S.errors++; arr[i] = { b: b, k: 'dna', bad: true }; say('✗ ' + b + ' was added opposite ' + tb + '. Proofreading is off, so the mismatch stays (red).');
      } else { arr[i] = { b: b, k: 'dna' }; say('✓ ' + b + ' pairs with ' + tb + ' (' + ((b === 'C' || b === 'G') ? '3' : '2') + ' hydrogen bonds).'); }
      draw();
    }
    function check() {
      var leadDone = S.lead.every(function (x) { return x && x.k !== 'rna'; }), lagDone = S.lag.every(function (x) { return x && x.k !== 'rna'; });
      var nicks = Object.keys(S.nicks).filter(function (k) { return S.nicks[k] === true; }).length, bad = S.lead.concat(S.lag).filter(function (x) { return x && x.bad; }).length;
      var t = [];
      t.push(leadDone ? '✓ Leading strand complete.' : '✗ Leading strand unfinished' + (S.lead.some(function (x) { return x && x.k === 'rna'; }) ? ' or its primer is still RNA.' : '.'));
      t.push(lagDone ? '✓ Lagging strand complete.' : '✗ Lagging strand unfinished or still has RNA primers.');
      t.push(nicks ? '✗ ' + nicks + ' gap(s) between Okazaki fragments not sealed: use ligase.' : (lagDone ? '✓ All fragments joined by ligase.' : ''));
      t.push(bad ? '⚠ ' + bad + ' mismatched base(s) left: these would become mutations.' : '✓ No mismatches.');
      if (leadDone && lagDone && !nicks) t.push('<b>Two identical double helices, each with one old and one new strand: semi-conservative replication.</b>');
      say(t.filter(Boolean).join('<br>'));
    }
    function draw() {
      var x0 = 20, dx = 30, h = '', fork = S.fork;
      function nt(x, y, b, col, txt) { return '<rect x="' + (x - 11) + '" y="' + (y - 11) + '" width="22" height="22" rx="4" fill="' + col + '" stroke="#334155" stroke-width="1"/><text x="' + x + '" y="' + (y + 5) + '" font-size="13" text-anchor="middle" font-weight="700" fill="' + (txt || '#111') + '">' + b + '</text>'; }
      var C = { A: '#ffd8a8', T: '#b2f2bb', C: '#a5d8ff', G: '#ffc9c9', U: '#fcc2d7' };
      h += '<text x="6" y="24" font-size="11" fill="#475569">3′</text><text x="6" y="284" font-size="11" fill="#475569">5′</text>';
      for (var i = 0; i < N; i++) {
        var x = x0 + 12 + i * dx, open = i < fork;
        var yt = open ? 40 : 125, yb = open ? 260 : 175;
        if (!open) h += '<line x1="' + x + '" y1="' + (yt + 11) + '" x2="' + x + '" y2="' + (yb - 11) + '" stroke="#94a3b8" stroke-dasharray="3 3"/>';
        h += nt(x, yt, top[i], C[top[i]]) + nt(x, yb, bot[i], C[bot[i]]);
        var L = S.lead[i], G = S.lag[i];
        if (L) h += nt(x, 80, L.b, L.k === 'rna' ? '#f783ac' : L.bad ? '#e03131' : C[L.b], L.bad ? '#fff' : '#111');
        if (G) h += nt(x, 220, G.b, G.k === 'rna' ? '#f783ac' : G.bad ? '#e03131' : C[G.b], G.bad ? '#fff' : '#111');
        if (S.nicks[i]) h += '<text x="' + (x + 15) + '" y="' + 247 + '" font-size="12" text-anchor="middle" fill="' + (S.nicks[i] === 'sealed' ? '#2f9e44' : '#e03131') + '">' + (S.nicks[i] === 'sealed' ? '⌒' : '|') + '</text>';
      }
      h += '<line x1="' + x0 + '" y1="27" x2="' + (x0 + N * dx) + '" y2="27" stroke="#334155" stroke-width="2"/><line x1="' + x0 + '" y1="273" x2="' + (x0 + N * dx) + '" y2="273" stroke="#334155" stroke-width="2"/>';
      if (fork > 0 && fork < N) { var fx_ = x0 + fork * dx; h += '<ellipse cx="' + fx_ + '" cy="150" rx="9" ry="40" fill="#ffe066" stroke="#e67700" stroke-width="2" opacity=".9"/><text x="' + fx_ + '" y="104" font-size="10" text-anchor="middle" fill="#e67700">helicase</text>'; }
      var nl = nextLead(); if (S.lead[0] && nl >= 0 && nl < fork) h += '<text x="' + (x0 + 12 + nl * dx) + '" y="104" font-size="10" text-anchor="middle" fill="#1971c2">pol III →</text>';
      var lt = lagTarget(); if (lt >= 0) h += '<text x="' + (x0 + 12 + lt * dx) + '" y="204" font-size="10" text-anchor="middle" fill="#1971c2">← pol III</text>';
      h += '<text x="' + (x0 + N * dx - 4) + '" y="98" font-size="11" text-anchor="end" fill="#1971c2" font-weight="700">leading strand 5′ → 3′ (towards fork)</text>';
      h += '<text x="' + (x0 + N * dx - 4) + '" y="244" font-size="11" text-anchor="end" fill="#1971c2" font-weight="700">lagging strand: Okazaki fragments, 5′ → 3′ away from fork</text>';
      $('#dn-sv').innerHTML = h;
      var made = S.lead.concat(S.lag).filter(function (x) { return x; }).length;
      api.readings([['Fork position', fork + ' / ' + N + ' bp'], ['Nucleotides added', made + ' / ' + 2 * N], ['RNA primer bases', S.lead.concat(S.lag).filter(function (x) { return x && x.k === 'rna'; }).length], ['Removed by proofreading', S.caught], ['Mismatches left', S.errors], ['Unsealed gaps', Object.keys(S.nicks).filter(function (k) { return S.nicks[k] === true; }).length]]);
    }
    var lastB = null;
    function copy() {
      var v = api.vals(), n = +v.n, err = +v.err, rng = Math.random, r = M.replicate(M.randomDNA(n, Math.floor(Math.random() * 1e6)), err, v.proof, v.mmr, rng);
      var made = r.errors.length + r.proofread + r.repaired;
      lastB = { n: n, err: err * 1e6, checks: v.proof && v.mmr ? 'proofreading + mismatch repair' : v.proof ? 'proofreading' : v.mmr ? 'mismatch repair only' : 'none', made: made, caught: r.proofread, fixed: r.repaired, left: r.errors.length, perM: r.errors.length / n * 1e6 };
      api.enable('rec', true);
      api.status('Copied ' + n.toLocaleString() + ' bases: ' + made + ' wrong bases added, ' + r.proofread + ' removed by proofreading, ' + r.repaired + ' fixed by mismatch repair, ' + r.errors.length + ' left.');
      var bars = [['added', made], ['proofread', r.proofread], ['repaired', r.repaired], ['left', r.errors.length]];
      api.chart($('#dn-ch'), { xLabel: '1 = wrong bases added · 2 = removed by proofreading · 3 = fixed by mismatch repair · 4 = left', yLabel: 'Number of bases', xmin: 0.5, xmax: 4.5, ymin: 0, series: bars.map(function (b, i) { return { pts: [[i + 1, b[1]]], bar: true, color: api.COL[i] }; }) });
    }
    api.actions([{ id: 'copy', label: '🧬 Copy the DNA (Part B)', main: true, fn: copy }, { id: 'rec', label: '➕ Record trial', fn: function () { if (lastB) { api.record(lastB); lastB = null; api.enable('rec', false); } } }]);
    api.enable('rec', false);
    say('Start with <b>Helicase</b>: click it to unwind the double helix.');
    draw();
    api.onChange = function () {};
  }
})();
