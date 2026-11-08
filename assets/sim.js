/* Simulations inside interactive lessons · Learnova (by George Apidi)
   Each <div class="card sim" data-sim="NAME"> is filled with a small model students can change.
   Every control has a label, and every result is also written as text, so it works with a keyboard and screen reader. */
(function () {
  var M = {}, CSS = false;
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function css() {
    if (CSS) return; CSS = true;
    var s = document.createElement('style');
    s.textContent = '.sim{display:grid;gap:10px}.sim .sim-h{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.sim .sim-h b{font-size:1rem}' +
      '.sim .sim-val{font-weight:700;font-size:.85rem;color:#0f766e;justify-self:start}.sim.sim-busy .sim-out{opacity:.85}.sim.sim-flash .sim-out,.sim.sim-flash svg{animation:simflash 1.2s ease-out}@keyframes simflash{0%{box-shadow:0 0 0 4px #fbbf24;background-color:#fef3c7}100%{box-shadow:0 0 0 0 transparent}}.sim .sim-run[disabled]{opacity:.7;cursor:wait}' +
      '.sim .sim-c{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));align-items:end}' +
      '.sim label{display:grid;gap:4px;font-size:.9rem}.sim select,.sim input[type=text]{padding:6px;border-radius:8px;border:1px solid #cbd5e1;font:inherit}' +
      '.sim .sim-out{background:#f1f5f9;border-radius:10px;padding:10px;font-size:.95rem}.sim svg{width:100%;height:auto;max-height:340px}.sim .sim-cap{font-size:.85rem;color:#475569;margin:0}.sim .sim-run-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.sim .sim-run{background:#0f766e;color:#fff;border:0;border-radius:999px;padding:9px 18px;font:inherit;font-weight:700;cursor:pointer}.sim .sim-run:focus-visible{outline:3px solid #1d4ed8;outline-offset:2px}.sim .sim-hint{font-size:.85rem;color:#475569}';
    document.head.appendChild(s);
  }
  function ctl(id, label, html) { return '<label for="' + id + '">' + label + html + '</label>'; }
  function slider(id, label, min, max, v, step) { return ctl(id, label, '<input id="' + id + '" type="range" min="' + min + '" max="' + max + '" step="' + (step || 1) + '" value="' + v + '">'); }
  function select(id, label, opts) { return ctl(id, label, '<select id="' + id + '">' + opts.map(function (o) { return '<option value="' + E(o[0]) + '">' + E(o[1]) + '</option>'; }).join('') + '</select>'); }
  function $(root, id) { return root.querySelector('#' + id); }

  /* 1 · Enzyme activity: temperature, pH, substrate and inhibitor */
  M.enzyme = {
    title: 'Enzyme rate: temperature, pH, substrate and inhibitor',
    html: function () { return '<div class="sim-c">' + slider('t', 'Temperature (°C)', 5, 70, 37) + slider('ph', 'pH', 2, 12, 7, 0.1) + slider('s', 'Substrate concentration', 0, 100, 40) +
      select('inh', 'Inhibitor', [['none', 'None'], ['comp', 'Competitive'], ['non', 'Non-competitive']]) + slider('i', 'Inhibitor strength', 0, 100, 50) + '</div>' +
      '<svg viewBox="0 0 400 220" role="img" aria-label="Graph of reaction rate against substrate concentration"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var T = +$(r, 't').value, pH = +$(r, 'ph').value, S = +$(r, 's').value, inh = $(r, 'inh').value, I = +$(r, 'i').value / 100;
      var fT = Math.exp(-Math.pow((T - 37) / 10, 2)) * (T > 45 ? Math.exp(-(T - 45) / 3) : 1), fpH = Math.exp(-Math.pow((pH - 7) / 1.8, 2));
      var Vmax = 100 * fT * fpH, Km = 20, Km2 = Km, V2 = Vmax;
      if (inh === 'comp') Km2 = Km * (1 + 3 * I); else if (inh === 'non') V2 = Vmax / (1 + 2 * I);
      function rate(x, vm, km) { return vm * x / (km + x); }
      var pts = [], base = [];
      for (var x = 0; x <= 100; x += 2) { pts.push((40 + x * 3.4).toFixed(1) + ',' + (200 - rate(x, V2, Km2) * 1.6).toFixed(1)); base.push((40 + x * 3.4).toFixed(1) + ',' + (200 - rate(x, Vmax, Km) * 1.6).toFixed(1)); }
      var cur = rate(S, V2, Km2);
      $(r, 't') && r.querySelector('svg').setAttribute('aria-label', 'Rate against substrate. Current rate ' + cur.toFixed(0) + ' units per minute.');
      r.querySelector('svg').innerHTML = '<line x1="40" y1="200" x2="380" y2="200" stroke="#334155"/><line x1="40" y1="20" x2="40" y2="200" stroke="#334155"/>' +
        '<text x="210" y="216" text-anchor="middle" font-size="12">Substrate concentration</text><text x="12" y="110" font-size="12" transform="rotate(-90 12 110)" text-anchor="middle">Rate</text>' +
        (inh !== 'none' ? '<polyline points="' + base.join(' ') + '" fill="none" stroke="#94a3b8" stroke-dasharray="5 4" stroke-width="2"/>' : '') +
        '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#0f766e" stroke-width="3"/>' +
        '<circle cx="' + (40 + S * 3.4).toFixed(1) + '" cy="' + (200 - cur * 1.6).toFixed(1) + '" r="5" fill="#e4572e"/>';
      var note = T > 45 ? 'Above about 45 °C the enzyme begins to denature: its shape changes, so the active site no longer fits.' : 'Rate rises with temperature until about 37 °C, because molecules collide more often.';
      r.querySelector('.sim-out').innerHTML = '<b>Rate now: ' + cur.toFixed(0) + ' units/min</b> (maximum possible here: ' + V2.toFixed(0) + '). pH effect: ' + (fpH > .8 ? 'near the optimum (pH 7).' : 'the active site is less suited to this pH.') +
        '<br>' + E(note) + (inh === 'comp' ? ' A competitive inhibitor blocks the active site, so more substrate is needed to reach the same rate.' : inh === 'non' ? ' A non-competitive inhibitor binds elsewhere and lowers the maximum rate, even at high substrate.' : '');
    }
  };

  /* 2 · Monomers and polymers (condensation and hydrolysis) */
  M.polymer = {
    title: 'Building a polymer from monomers',
    html: function () { return '<div class="sim-c">' + slider('n', 'Number of monomers', 2, 8, 4) + select('mode', 'Reaction', [['cond', 'Condensation (build a polymer)'], ['hyd', 'Hydrolysis (break it down)']]) + '</div>' +
      '<svg viewBox="0 0 400 120" role="img" aria-label="Monomers joined into a chain"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var n = +$(r, 'n').value, mode = $(r, 'mode').value, svg = '', x0 = 30, gap = 380 / Math.max(n, 2);
      var bonds = n - 1;
      for (var i = 0; i < n; i++) {
        var cx = x0 + i * (gap * 0.95 * (n > 1 ? 1 : 0)) + 20;
        svg += '<circle cx="' + cx.toFixed(0) + '" cy="60" r="18" fill="#fde68a" stroke="#b7791f" stroke-width="2"/><text x="' + cx.toFixed(0) + '" y="65" text-anchor="middle" font-size="11">M' + (i + 1) + '</text>';
        if (i < n - 1) { var cx2 = x0 + (i + 1) * (gap * 0.95) + 20; svg += '<line x1="' + (cx + 18) + '" y1="60" x2="' + (cx2 - 18) + '" y2="60" stroke="#334155" stroke-width="3"/>'; }
      }
      r.querySelector('svg').innerHTML = svg;
      r.querySelector('.sim-out').innerHTML = mode === 'cond'
        ? '<b>' + n + ' monomers → 1 polymer</b>. ' + bonds + ' glycosidic bonds form, and ' + bonds + ' water molecules are released (one for each bond).'
        : '<b>1 polymer + ' + bonds + ' water → ' + n + ' monomers</b>. Hydrolysis adds water to break each of the ' + bonds + ' bonds between monomers.';
    }
  };

  /* 3 · Saturated and unsaturated fats: how the chains pack */
  M.fat = {
    title: 'Saturated and unsaturated fat chains',
    html: function () { return '<div class="sim-c">' + select('type', 'Fatty acid', [['sat', 'Saturated (no C=C)'], ['mono', 'Monounsaturated (one C=C)'], ['poly', 'Polyunsaturated (two or more C=C)']]) + '</div>' +
      '<svg viewBox="0 0 400 170" role="img" aria-label="Fatty acid chains drawn side by side"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var t = $(r, 'type').value, kinks = t === 'sat' ? 0 : t === 'mono' ? 1 : 2, svg = '';
      for (var c = 0; c < 4; c++) {
        var pts = [], x = 20 + c * 95, y = 30;
        for (var k = 0; k < 9; k++) {
          var bend = (k === 3 && kinks >= 1) || (k === 6 && kinks >= 2) ? 1 : 0;
          if (bend) y = y === 30 ? 60 : 30;
          pts.push((x + k * 9).toFixed(1) + ',' + (y + (k % 2) * 12 + 0).toFixed(1));
        }
        svg += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#2563eb" stroke-width="3" stroke-linejoin="round"/>';
      }
      r.querySelector('svg').innerHTML = svg + '<text x="200" y="165" text-anchor="middle" font-size="12">Four neighbouring chains (drawn schematically)</text>';
      r.querySelector('.sim-out').innerHTML = t === 'sat'
        ? '<b>Saturated:</b> straight chains pack closely, so the fat is usually a solid at room temperature (e.g. butter).'
        : '<b>' + (t === 'mono' ? 'Monounsaturated' : 'Polyunsaturated') + ':</b> each C=C double bond creates a kink. Kinked chains pack less tightly, so the fat is more likely to be a liquid oil.';
    }
  };

  /* 4 · Protein denaturation */
  M.denature = {
    title: 'Protein shape and denaturation',
    html: function () { return '<div class="sim-c">' + slider('t', 'Temperature (°C)', 20, 100, 37) + slider('ph', 'pH', 1, 13, 7, 0.5) + '</div>' +
      '<svg viewBox="0 0 400 130" role="img" aria-label="Protein chain, folded or unfolded"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var T = +$(r, 't').value, pH = +$(r, 'ph').value;
      var stab = (1 / (1 + Math.exp((T - 60) / 4))) * (1 / (1 + Math.exp((Math.abs(pH - 7) - 3) / 0.5)));
      var folded = stab > 0.5, svg = '';
      for (var i = 0; i < 12; i++) {
        var cx, cy;
        if (folded) { var a = i / 12 * 2 * Math.PI; cx = 200 + 70 * Math.cos(a); cy = 65 + 45 * Math.sin(a); }
        else { cx = 30 + i * 31; cy = 65 + (i % 2 ? 14 : -14); }
        svg += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="11" fill="' + (i % 3 === 0 ? '#e4572e' : i % 3 === 1 ? '#0f766e' : '#7c3aed') + '"/>';
      }
      r.querySelector('svg').innerHTML = svg;
      r.querySelector('.sim-out').innerHTML = '<b>' + (folded ? 'Folded: the active site is intact.' : 'Denatured: the bonds holding the shape have broken.') + '</b> Estimated activity: ' + Math.round(stab * 100) + '%.' +
        '<br>High temperature and extreme pH break hydrogen and ionic bonds, so the shape changes. The change is usually permanent.';
    }
  };

  /* 5 · DNA base pairing, transcription and translation with mutations */
  var CODON = {};
  ('UUU F UUC F UUA L UUG L UCU S UCC S UCA S UCG S UAU Y UAC Y UAA * UAG * UGU C UGC C UGA * UGG W CUU L CUC L CUA L CUG L CCU P CCC P CCA P CCG P CAU H CAC H CAA Q CAG Q CGU R CGC R CGA R CGG R ' +
    'AUU I AUC I AUA I AUG M ACU T ACC T ACA T ACG T AAU N AAC N AAA K AAG K AGU S AGC S AGA R AGG R GUU V GUC V GUA V GUG V GCU A GCC A GCA A GCG A GAU D GAC D GAA E GAG E GGU G GGC G GGA G GGG G').split(' ')
    .reduce(function (acc, v, i, a) { if (i % 2 === 0) acc[v] = a[i + 1]; return acc; }, CODON);
  M.codon = {
    title: 'From DNA to protein, and what a mutation does',
    html: function () { return '<label for="seq">DNA coding strand (use A, C, G and T)<input id="seq" type="text" value="TACAAAGGGCCCTTTTAA" maxlength="60" autocomplete="off"></label>' +
      '<div class="sim-c">' + select('pos', 'Change base number', [['1', '1'], ['4', '4'], ['7', '7'], ['10', '10'], ['13', '13']]) + select('nb', 'to base', [['A', 'A'], ['C', 'C'], ['G', 'G'], ['T', 'T']]) + '</div>' +
      '<div class="sim-out" aria-live="polite"></div>'; },
    run: function (r, first) {
      var seqEl = $(r, 'seq'), seq = seqEl.value.toUpperCase().replace(/[^ACGT]/g, '');
      if (first) seq = seqEl.value.toUpperCase().replace(/[^ACGT]/g, '') || 'TACAAAGGGCCCTTTTAA';
      function translate(s) {
        var mrna = s.replace(/T/g, 'U'), out = [], codons = [];
        for (var i = 0; i + 3 <= mrna.length; i += 3) { var c = mrna.substr(i, 3), aa = CODON[c] || '?'; codons.push(c + ' → ' + aa); if (aa === '*') break; out.push(aa); }
        return { mrna: mrna, protein: out.join(''), codons: codons, stop: codons.length && /→ \*$/.test(codons[codons.length - 1]) };
      }
      var orig = translate(seq), pos = +$(r, 'pos').value - 1, nb = $(r, 'nb').value, mut = null, verdict = '';
      if (pos < seq.length && seq[pos] !== nb) {
        var m2 = seq.substr(0, pos) + nb + seq.substr(pos + 1); mut = translate(m2);
        var cmp = orig.protein.length, same = mut.protein === orig.protein;
        if (same) verdict = 'Silent mutation: the new codon codes for the same amino acid, so the protein is unchanged.';
        else if (mut.protein.indexOf('*') >= 0 || /\*/.test(mut.codons.join(' ')) || mut.protein.length < orig.protein.length) verdict = 'Nonsense or frameshift-type change: a stop codon appears early, so the protein is shorter.';
        else verdict = 'Missense mutation: one amino acid changes, so the protein may fold or work differently.';
        verdict += ' (Original length ' + cmp + ' amino acids; mutated ' + mut.protein.length + '.)';
      }
      r.querySelector('.sim-out').innerHTML = '<b>mRNA:</b> ' + E(orig.mrna) + '<br><b>Codons:</b> ' + E(orig.codons.join(', ')) + '<br><b>Protein:</b> ' + E(orig.protein || '(none)') +
        (mut ? '<hr><b>After the change</b> at base ' + (pos + 1) + ' (' + seq[pos] + ' → ' + nb + '): protein ' + E(mut.protein || '(none)') + '<br>' + E(verdict) : '<br><i>Choose a base that is different from the original to see a mutation.</i>') +
        '<br><span class="sim-cap">Only the first 6 codons or up to a stop codon are shown. Codons are read in threes from the start of the sequence.</span>';
    }
  };

  /* 6 · Gel electrophoresis: DNA fragments move through the gel and separate by size */
  var PEOPLE = { 'A': [5000, 2000, 1000, 250], 'B': [5000, 2000, 800, 500], 'C': [6000, 2000, 1000, 500], 'D': [4000, 1500, 800, 250] };
  var LADDER = [10000, 5000, 2000, 1000, 500, 250];
  M.gel = {
    title: 'Gel electrophoresis: DNA bands separate by size',
    html: function () { return '<div class="sim-c">' +
      select('a', 'Sample 1 (person)', [['A', 'Person A'], ['B', 'Person B'], ['C', 'Person C'], ['D', 'Person D']]) +
      select('b', 'Sample 2 (person)', [['A', 'Person A'], ['B', 'Person B'], ['C', 'Person C'], ['D', 'Person D']]) +
      slider('time', 'Time the gel runs (minutes)', 0, 60, 60) + '</div>' +
      '<svg viewBox="0 0 400 330" role="img" aria-label="Gel with a ladder and two samples"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var t = +$(r, 'time').value, f = t / 60, A = $(r, 'a').value, B = $(r, 'b').value;
      var top = 40, H = 220;
      function y(bp) { return top + 10 + f * (Math.log10(20000) - Math.log10(bp)) / (Math.log10(20000) - Math.log10(250)) * (H - 20); }
      var lanes = [['Ladder', LADDER, '#e2e8f0'], ['Person ' + A, PEOPLE[A], '#fbbf24'], ['Person ' + B, PEOPLE[B], '#fbbf24']];
      var svg = '<rect x="10" y="' + top + '" width="380" height="' + (H + 50) + '" rx="8" fill="#0f172a"/>';
      lanes.forEach(function (ln, i) {
        var x = 70 + i * 120;
        svg += '<rect x="' + (x - 26) + '" y="' + (top + 4) + '" width="52" height="7" fill="#64748b"/>';
        svg += '<text x="' + x + '" y="312" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a">' + E(ln[0]) + '</text>';
        ln[1].forEach(function (bp) { svg += '<rect x="' + (x - 22) + '" y="' + (y(bp) - 3).toFixed(1) + '" width="44" height="6" fill="' + ln[2] + '"/>'; });
      });
      svg += '<text x="200" y="30" text-anchor="middle" font-size="12" fill="#0f172a">Wells (−)  ·  moves towards +</text>';
      r.querySelector('svg').innerHTML = svg;
      var same = A === B, shared = PEOPLE[A].filter(function (bp) { return PEOPLE[B].indexOf(bp) >= 0; }).length;
      var msg;
      if (t < 60) msg = 'The gel is still running. Bands closer to the wells are the bigger pieces. Set the time to 60 minutes to compare the final pattern.';
      else if (same) msg = 'The two samples are from the same person: every band lines up.';
      else msg = 'The two samples are different people. They share ' + shared + ' of ' + PEOPLE[A].length + ' bands; a difference in any band shows the DNA is not from the same person.';
      r.querySelector('.sim-out').innerHTML = '<b>' + E(msg) + '</b><br>Smaller pieces travel further down the gel. Compare each sample with the ladder to read the sizes.';
    }
  };

  /* 7 · Cell size: surface area to volume ratio */
  M.cellsize = {
    title: 'Surface area to volume in a cube-shaped cell',
    html: function () { return '<div class="sim-c">' + slider('s', 'Side length of the cell (cm)', 1, 10, 2) + '</div>' +
      '<svg viewBox="0 0 400 200" role="img" aria-label="Cube drawn to scale"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var s = +$(r, 's').value, SA = 6 * s * s, V = s * s * s, ratio = SA / V, px = Math.min(s * 16, 160);
      r.querySelector('svg').innerHTML = '<rect x="60" y="' + (180 - px) + '" width="' + px + '" height="' + px + '" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>' +
        '<text x="' + (60 + px / 2) + '" y="196" text-anchor="middle" font-size="12">' + s + ' cm</text>';
      r.querySelector('.sim-out').innerHTML = '<b>Surface area</b> = 6 × ' + s + '² = ' + SA + ' cm² · <b>Volume</b> = ' + s + '³ = ' + V + ' cm³ · <b>Ratio</b> = ' + ratio.toFixed(2) + ' : 1.' +
        '<br>As the cell gets bigger, volume grows faster than surface area, so the ratio falls. Less surface is left per unit of cell to take in food and oxygen and to get rid of waste.';
    }
  };

  /* 8 · Hormones across the menstrual cycle (illustrative shapes, not to scale) */
  M.hormones = {
    title: 'Hormone levels across a 28-day cycle (illustrative)',
    html: function () { return '<fieldset style="border:0;padding:0;display:flex;gap:10px;flex-wrap:wrap"><legend class="small">Show hormones</legend>' +
      ['fsh', 'lh', 'oe', 'pr'].map(function (h, i) { return '<label class="small"><input type="checkbox" id="h' + h + '" checked> ' + ['FSH', 'LH', 'Oestrogen', 'Progesterone'][i] + '</label>'; }).join('') + '</fieldset>' +
      '<div class="sim-c">' + slider('d', 'Day of the cycle', 1, 28, 14) + '</div>' +
      '<svg viewBox="0 0 400 220" role="img" aria-label="Hormone curves across the cycle"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var d = +$(r, 'd').value, g = function (x, c, w) { return Math.exp(-Math.pow((x - c) / w, 2)); };
      var F = {
        fsh: { col: '#2563eb', f: function (x) { return 0.45 * g(x, 3, 2.5) + 0.25 * g(x, 14, 2) + 0.1; } },
        lh: { col: '#e4572e', f: function (x) { return 0.9 * g(x, 14, 1.4) + 0.12; } },
        oe: { col: '#15803d', f: function (x) { return 0.55 * g(x, 4, 3) + 0.85 * g(x, 13, 1.8) + 0.45 * g(x, 24, 3.5) + 0.15 * g(x, 27, 3); } },
        pr: { col: '#7c3aed', f: function (x) { return 0.85 * g(x, 22, 3.2) + 0.05; } }
      };
      var svg = '<line x1="40" y1="200" x2="380" y2="200" stroke="#334155"/><line x1="40" y1="20" x2="40" y2="200" stroke="#334155"/><text x="210" y="216" text-anchor="middle" font-size="12">Day</text>';
      Object.keys(F).forEach(function (k) {
        if (!$(r, 'h' + k).checked) return;
        var pts = []; for (var x = 1; x <= 28; x += 0.5) pts.push((40 + (x - 1) * 12.5).toFixed(1) + ',' + (200 - F[k].f(x) * 170).toFixed(1));
        svg += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + F[k].col + '" stroke-width="3"/>';
      });
      svg += '<line x1="' + (40 + (d - 1) * 12.5) + '" y1="20" x2="' + (40 + (d - 1) * 12.5) + '" y2="200" stroke="#94a3b8" stroke-dasharray="4 3"/>';
      r.querySelector('svg').innerHTML = svg;
      var phase = d <= 5 ? 'Bleeding: the lining of the uterus is shed.' : d <= 13 ? 'Follicle growth: FSH and oestrogen rise; the lining rebuilds.' : d <= 15 ? 'Ovulation: an LH surge releases the egg.' : 'Luteal phase: progesterone maintains the lining.';
      r.querySelector('.sim-out').innerHTML = '<b>Day ' + d + '.</b> ' + E(phase) + ' Shapes are simplified; compare the timing of the peaks, not the exact heights.';
    }
  };

  /* 9 · Mitosis and meiosis: one chromosome pair per cell, stage by stage */
  M.division = {
    title: 'Mitosis and meiosis: chromosome number at each stage',
    html: function () { return '<div class="sim-c">' + select('kind', 'Division', [['mit', 'Mitosis'], ['mei', 'Meiosis']]) + select('n', 'Chromosomes in the parent cell (2n)', [['2', '2'], ['4', '4'], ['6', '6']]) +
      slider('st', 'Stage (1 = start)', 1, 4, 1) + '</div><svg viewBox="0 0 400 170" role="img" aria-label="Cells at this stage of division"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var kind = $(r, 'kind').value, n2 = +$(r, 'n').value, st = +$(r, 'st').value, svg = '', cells = 1, per = n2, label = '';
      if (kind === 'mit') {
        label = ['Interphase: chromosomes copied (each has two identical sister chromatids)', 'Prophase → metaphase: chromosomes line up in the middle', 'Anaphase: sister chromatids pulled apart', 'Telophase: two daughter cells, each with 2n chromosomes'][st - 1];
        cells = st < 4 ? 1 : 2; per = n2;
      } else {
        label = ['Interphase: chromosomes copied', 'Meiosis I: homologous pairs separate; two cells each with n chromosomes (doubled)', 'Meiosis II: sister chromatids separate', 'Four haploid cells, each with n chromosomes'][st - 1];
        cells = st < 2 ? 1 : st < 4 ? 2 : 4; per = st < 2 ? n2 : (st < 4 ? n2 / 2 : n2 / 2);
      }
      var cx = [200], cy = [85];
      if (cells === 2) { cx = [110, 290]; cy = [85, 85]; } if (cells === 4) { cx = [110, 290, 110, 290]; cy = [50, 50, 120, 120]; }
      for (var c = 0; c < cells; c++) {
        svg += '<circle cx="' + cx[c] + '" cy="' + cy[c] + '" r="' + (cells === 4 ? 30 : 42) + '" fill="#f1f5f9" stroke="#334155"/>';
        for (var k = 0; k < per; k++) { var ang = k / Math.max(per, 1) * 2 * Math.PI; svg += '<rect x="' + (cx[c] + Math.cos(ang) * 14 - 2) + '" y="' + (cy[c] + Math.sin(ang) * 14 - 8) + '" width="4" height="16" fill="#e4572e" transform="rotate(' + (ang * 57.3) + ' ' + (cx[c] + Math.cos(ang) * 14) + ' ' + (cy[c] + Math.sin(ang) * 14) + ')"/>'; }
      }
      r.querySelector('svg').innerHTML = svg;
      var total = cells * per;
      r.querySelector('.sim-out').innerHTML = '<b>' + (kind === 'mit' ? 'Mitosis' : 'Meiosis') + ' stage ' + st + ':</b> ' + E(label) + '<br>Cells: ' + cells + '. Chromosomes in each cell: ' + per + ' (' + (per === n2 ? 'diploid, 2n' : 'haploid, n') + ').' +
        (st === 4 ? '<br>Mitosis gives genetically identical cells; meiosis gives four genetically different haploid cells, which are gametes.' : '');
    }
  };

  /* 10 · Microscope magnification and real size */
  M.microscope = {
    title: 'Microscope magnification and the size of a cell',
    html: function () { return '<div class="sim-c">' + select('ob', 'Objective lens (×)', [['4', '4'], ['10', '10'], ['40', '40'], ['100', '100']]) + select('ey', 'Eyepiece lens (×)', [['10', '10'], ['15', '15']]) +
      slider('cs', 'Real size of the cell (µm)', 5, 50, 20) + '</div><svg viewBox="0 0 400 140" role="img" aria-label="Cell at this magnification"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var mag = (+$(r, 'ob').value) * (+$(r, 'ey').value), cs = +$(r, 'cs').value, imgUm = cs * mag, imgMm = imgUm / 1000;
      var px = Math.min(Math.max(imgMm * 40, 6), 120);
      r.querySelector('svg').innerHTML = '<circle cx="200" cy="70" r="' + (px / 2).toFixed(1) + '" fill="#bbf7d0" stroke="#15803d" stroke-width="2"/>' +
        '<text x="200" y="130" text-anchor="middle" font-size="12">Drawn at this magnification (cells larger than the view are cut off)</text>';
      r.querySelector('.sim-out').innerHTML = '<b>Magnification</b> = ' + $(r, 'ob').value + ' × ' + $(r, 'ey').value + ' = ' + mag + '×.' +
        '<br><b>Image size</b> = real size × magnification = ' + cs + ' µm × ' + mag + ' = ' + imgUm.toLocaleString() + ' µm (' + imgMm.toFixed(2) + ' mm).' +
        '<br>Rearranged: real size = image size ÷ magnification. Always check the units you need in the answer.';
    }
  };

  /* 11 · Lock and key: does the substrate fit the active site? */
  var FITS = { amylase: ['starch', 'glycogen'], lactase: ['lactose'], sucrase: ['sucrose'] };
  var SHAPE = { starch: 'Starch', glycogen: 'Glycogen', lactose: 'Lactose', sucrose: 'Sucrose' };
  M.lockkey = {
    title: 'Enzyme and substrate: lock and key',
    html: function () { return '<div class="sim-c">' + select('en', 'Enzyme', [['amylase', 'Amylase'], ['lactase', 'Lactase'], ['sucrase', 'Sucrase']]) +
      select('su', 'Substrate', [['starch', 'Starch'], ['glycogen', 'Glycogen'], ['lactose', 'Lactose'], ['sucrose', 'Sucrose']]) +
      '<label class="small"><input id="dn" type="checkbox"> Enzyme has been heated to 80 °C (denatured)</label></div>' +
      '<svg viewBox="0 0 400 170" role="img" aria-label="Enzyme active site and substrate"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var en = $(r, 'en').value, su = $(r, 'su').value, dn = $(r, 'dn').checked;
      var fits = !dn && FITS[en].indexOf(su) >= 0;
      var svg = '<rect x="30" y="50" width="150" height="100" rx="18" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="3"/>' +
        '<path d="' + (dn ? 'M 120 50 Q 150 80 120 100 Q 160 120 120 150' : 'M 120 50 L 150 90 L 120 150') + '" fill="none" stroke="#f8fafc" stroke-width="18" stroke-linecap="round"/>' +
        '<text x="105" y="168" text-anchor="middle" font-size="12">Enzyme: ' + E(en) + (dn ? ' (denatured)' : '') + '</text>';
      svg += fits
        ? '<circle cx="250" cy="100" r="34" fill="#fde68a" stroke="#b7791f" stroke-width="3"/><text x="250" y="104" text-anchor="middle" font-size="12">' + SHAPE[su] + '</text>'
        : '<circle cx="290" cy="100" r="34" fill="#fde68a" stroke="#b7791f" stroke-width="3" stroke-dasharray="6 4"/><text x="290" y="104" text-anchor="middle" font-size="12">' + SHAPE[su] + '</text>';
      r.querySelector('svg').innerHTML = svg;
      r.querySelector('svg').setAttribute('aria-label', fits ? 'The substrate fits the active site.' : 'The substrate does not fit the active site.');
      r.querySelector('.sim-out').innerHTML = fits
        ? '<b>Fits:</b> the shape of the ' + E(su) + ' matches the active site of ' + E(en) + ', so an enzyme-substrate complex forms and the reaction happens.'
        : '<b>No fit:</b> ' + (dn ? 'heating has changed the shape of the active site, so even the right substrate cannot bind.' : E(en) + ' is specific: its active site only fits ' + E(FITS[en].map(function (x) { return SHAPE[x]; }).join(' or ')) + ', so ' + E(SHAPE[su]) + ' cannot bind.') +
          ' <br>Enzymes are specific because only the substrate with the complementary shape can bind.';
    }
  };

  /* 12 · Diffusion across a membrane: concentration gradient, size and temperature */
  M.diffusion = {
    title: 'Diffusion: moving down a concentration gradient',
    html: function () { return '<div class="sim-c">' + slider('c1', 'Concentration on the left', 1, 10, 9) + slider('c2', 'Concentration on the right', 0, 10, 1) +
      slider('t', 'Time (minutes)', 0, 20, 2) + select('sz', 'Molecule size', [['small', 'Small (e.g. oxygen)'], ['large', 'Large (e.g. glucose)']]) + slider('tc', 'Temperature (°C)', 5, 45, 25) + '</div>' +
      '<svg viewBox="0 0 400 180" role="img" aria-label="Two compartments with particles"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var c1 = +$(r, 'c1').value, c2 = +$(r, 'c2').value, t = +$(r, 't').value, sz = $(r, 'sz').value, T = +$(r, 'tc').value;
      var k = (sz === 'small' ? 0.35 : 0.12) * (1 + (T - 25) / 40);
      var moved = (c1 - c2) / 2 * (1 - Math.exp(-k * t));
      var L = c1 - moved, R = c2 + moved, svg = '<rect x="20" y="20" width="170" height="140" fill="#e0f2fe" stroke="#334155"/><rect x="210" y="20" width="170" height="140" fill="#e0f2fe" stroke="#334155"/>' +
        '<line x1="200" y1="20" x2="200" y2="160" stroke="#334155" stroke-width="3" stroke-dasharray="6 4"/><text x="200" y="176" text-anchor="middle" font-size="12">Partially permeable membrane</text>';
      function dots(n, x0) { var out = '', m = Math.round(n * 2); for (var i = 0; i < m; i++) { var cx = x0 + 15 + ((i * 37) % 140), cy = 35 + ((i * 53) % 110); out += '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="#0f766e"/>'; } return out; }
      svg += dots(L, 20) + dots(R, 210);
      r.querySelector('svg').innerHTML = svg;
      var eq = Math.abs(L - R) < 0.5;
      r.querySelector('.sim-out').innerHTML = '<b>Left: ' + L.toFixed(1) + ' · Right: ' + R.toFixed(1) + '</b> (relative concentration, after ' + t + ' min at ' + T + ' °C).' +
        '<br>' + (eq ? 'Equilibrium: the concentrations are equal. Particles still move both ways, but there is no net movement.' :
          'Net movement is from the higher to the lower concentration, down the gradient. It needs no energy.') +
        '<br>' + (sz === 'small' ? 'Small molecules diffuse faster.' : 'Large molecules diffuse more slowly.') + ' Warmer particles move faster, so diffusion is faster at higher temperature.';
    }
  };

  /* 13 · Osmosis: water moves from a dilute to a concentrated solution */
  M.osmosis = {
    title: 'Osmosis: which way does water move?',
    html: function () { return '<div class="sim-c">' + slider('sol', 'Concentration of the solution (mol dm⁻³ sugar)', 0, 1, 0.3, 0.05) + '</div>' +
      '<svg viewBox="0 0 400 180" role="img" aria-label="A plant cell in a solution"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var c = +$(r, 'sol').value, inside = 0.3, diff = inside - c, change = Math.max(-30, Math.min(30, diff * 60));
      var R = 50 * (1 + change / 100);
      r.querySelector('svg').innerHTML = '<rect x="20" y="10" width="360" height="160" fill="' + (c > inside ? '#fef3c7' : c < inside ? '#e0f2fe' : '#f1f5f9') + '" rx="8"/>' +
        '<circle cx="200" cy="90" r="' + R.toFixed(1) + '" fill="#bbf7d0" stroke="#15803d" stroke-width="3"/>' +
        '<text x="200" y="95" text-anchor="middle" font-size="12">Cell</text>' +
        '<text x="200" y="172" text-anchor="middle" font-size="12">Solution: ' + c.toFixed(2) + ' mol dm⁻³ (cell interior about ' + inside + ')</text>';
      var move = Math.abs(diff) < 0.02 ? 'No net movement: the solution and the cell have the same water potential (isotonic).'
        : diff > 0 ? 'Water moves INTO the cell by osmosis: the cell swells and becomes turgid.'
        : 'Water moves OUT of the cell by osmosis: the cell shrinks and becomes flaccid' + (c >= 0.8 ? ', and at this strength it may plasmolyse (the membrane pulls away from the wall).' : '.');
      r.querySelector('.sim-out').innerHTML = '<b>' + E(move) + '</b><br>Water always moves from the dilute solution (high water potential) to the concentrated one (low water potential), across a partially permeable membrane. The cell interior concentration of 0.3 mol dm⁻³ is an illustrative value.';
    }
  };

  /* 14 · Photosynthesis: light, carbon dioxide and temperature as limiting factors */
  M.photosynth = {
    title: 'Photosynthesis: which factor is limiting?',
    html: function () { return '<div class="sim-c">' + slider('li', 'Light intensity (arbitrary units)', 0, 100, 60) + slider('co', 'Carbon dioxide (%)', 0, 0.1, 0.04, 0.01) + slider('tp', 'Temperature (°C)', 5, 50, 30) + '</div>' +
      '<svg viewBox="0 0 400 220" role="img" aria-label="Rate of photosynthesis against light intensity"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var I = +$(r, 'li').value, C = +$(r, 'co').value, T = +$(r, 'tp').value;
      var fT = Math.exp(-Math.pow((T - 35) / 12, 2));
      var Pmax = 100 * fT;
      function lightLim(x) { return Pmax * x / (x + 25); }
      var cLim = Pmax * C / (C + 0.03);
      var rate = Math.min(lightLim(I), cLim);
      var pts = [], curve = [];
      for (var x = 0; x <= 100; x += 2) { pts.push((40 + x * 3.4).toFixed(1) + ',' + (200 - Math.min(lightLim(x), cLim) * 1.7).toFixed(1)); }
      r.querySelector('svg').innerHTML = '<line x1="40" y1="200" x2="380" y2="200" stroke="#334155"/><line x1="40" y1="20" x2="40" y2="200" stroke="#334155"/>' +
        '<text x="210" y="216" text-anchor="middle" font-size="12">Light intensity</text><text x="12" y="110" font-size="12" transform="rotate(-90 12 110)" text-anchor="middle">Rate</text>' +
        '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#0f766e" stroke-width="3"/>' +
        '<circle cx="' + (40 + I * 3.4).toFixed(1) + '" cy="' + (200 - rate * 1.7).toFixed(1) + '" r="5" fill="#e4572e"/>';
      var limiting = fT < 0.3 ? 'Temperature is too far from the optimum (about 35 °C): enzymes are working poorly or have denatured.'
        : lightLim(I) <= cLim ? 'Light is the limiting factor: more light would increase the rate, but more carbon dioxide would not.'
        : 'Carbon dioxide is the limiting factor: more light would not increase the rate; more carbon dioxide would.';
      r.querySelector('.sim-out').innerHTML = '<b>Rate now: ' + rate.toFixed(0) + ' units.</b> ' + E(limiting) + '<br>The rate is limited by whichever factor is in shortest supply. Temperature changes the maximum rate, because the enzymes that drive the reactions are affected by it.';
    }
  };

  /* 15 · DNA replication: template, new strand and the two copies */
  M.replication = {
    title: 'DNA replication: two identical copies',
    html: function () { return '<label for="tpl">Template strand (use A, C, G and T)<input id="tpl" type="text" value="ATGCCGTAAT" maxlength="16" autocomplete="off"></label>' +
      '<div class="sim-c">' + slider('stg', 'Stage (1 to 4)', 1, 4, 1) + '</div><svg viewBox="0 0 400 130" role="img" aria-label="Template and new strands"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var PAIR = { A: 'T', T: 'A', G: 'C', C: 'G' };
      var tpl = ($(r, 'tpl').value || '').toUpperCase().replace(/[^ACGT]/g, '').slice(0, 16) || 'ATGCCGTAAT';
      var stg = +$(r, 'stg').value, n = tpl.length, new1 = '', svg = '';
      for (var i = 0; i < n; i++) new1 += PAIR[tpl[i]];
      var shown = stg >= 2 ? new1 : '', open = stg === 1 ? Math.min(n, 4) : n;
      for (var j = 0; j < n; j++) {
        var x = 30 + j * 22;
        svg += '<text x="' + x + '" y="38" text-anchor="middle" font-size="14" font-weight="700" fill="#1d4ed8">' + tpl[j] + '</text>';
        svg += j < open && stg >= 2 ? '<text x="' + x + '" y="88" text-anchor="middle" font-size="14" font-weight="700" fill="#b91c1c">' + shown[j] + '</text>' : '';
        svg += '<line x1="' + x + '" y1="46" x2="' + x + '" y2="78" stroke="#94a3b8" stroke-width="1.5"/>';
      }
      if (stg === 1) svg += '<text x="30" y="110" font-size="12">Helicase unwinds and separates the two strands, starting here.</text>';
      r.querySelector('svg').innerHTML = svg + '<text x="30" y="125" font-size="12" fill="#475569">Top: template strand. Bottom: new strand (built base by base).</text>';
      var msg = [
        'Helicase breaks the hydrogen bonds between the base pairs, so the double helix unwinds into two single strands.',
        'DNA polymerase adds free nucleotides to the new strand, pairing A with T and G with C. It builds the new strand in the 5′ to 3′ direction.',
        'The leading strand is made continuously. The lagging strand is made in short fragments, which are joined together later.',
        'Two identical double helices form. Each one has one original strand and one new strand, so replication is described as semi-conservative.'
      ][stg - 1];
      r.querySelector('.sim-out').innerHTML = '<b>Stage ' + stg + ':</b> ' + E(msg) + '<br><b>New strand:</b> ' + E(new1) + ' (complementary to ' + E(tpl) + ').';
    }
  };

  /* ===== Grade 6 (MYP 1) simulators ===== */
  function noise(p) { return 1 + (Math.random() * 2 - 1) * p; }
  function fx(v, d) { return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); }
  /* trial history kept on the sim element; reset when the settings change */
  function trials(r, key) { if (r._tkey !== key) { r._tkey = key; r._t = []; } return r._t; }
  function trialText(list, unit, d) {
    if (!list.length) return 'Press <b>▶ Run simulation</b> to do a trial.';
    var mean = list.reduce(function (a, b) { return a + b; }, 0) / list.length;
    return 'Trials so far: ' + list.map(function (t, i) { return 'Trial ' + (i + 1) + ' = ' + fx(t, d) + ' ' + unit; }).join(' · ') +
      (list.length > 1 ? '<br><b>Mean of ' + list.length + ' trials = ' + fx(mean, d) + ' ' + unit + '</b> (add them, then divide by ' + list.length + ').' : '');
  }

  /* G6 · Reading a measuring cylinder: meniscus and eye level */
  M.cylinder = {
    title: 'Reading a measuring cylinder',
    html: function () { return '<div class="sim-c">' + slider('cv', 'Volume of water (mL)', 12, 94, 46) +
      select('eye', 'Where is your eye?', [['level', 'Level with the water'], ['above', 'Above the water (looking down)'], ['below', 'Below the water (looking up)']]) + '</div>' +
      '<svg viewBox="0 0 400 300" role="img" aria-label="A 100 mL measuring cylinder with water"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var v = +$(r, 'cv').value, eye = $(r, 'eye').value, top = 30, bot = 270, x = 150, w = 70;
      function y(ml) { return bot - (ml / 100) * (bot - top); }
      var s = '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + (bot - top) + '" fill="#f8fafc" stroke="#334155" stroke-width="2"/>';
      var yw = y(v);
      s += '<path d="M' + x + ' ' + (yw - 5) + ' Q ' + (x + w / 2) + ' ' + (yw + 6) + ' ' + (x + w) + ' ' + (yw - 5) + ' L ' + (x + w) + ' ' + bot + ' L ' + x + ' ' + bot + ' Z" fill="#93c5fd" stroke="#1d4ed8"/>';
      for (var m = 0; m <= 100; m += 2) {
        var ym = y(m), big = m % 10 === 0;
        s += '<line x1="' + x + '" y1="' + ym + '" x2="' + (x + (big ? 22 : 12)) + '" y2="' + ym + '" stroke="#334155" stroke-width="' + (big ? 1.6 : 0.8) + '"/>';
        if (big) s += '<text x="' + (x - 6) + '" y="' + (ym + 4) + '" text-anchor="end" font-size="11">' + m + '</text>';
      }
      var ey = eye === 'level' ? yw : eye === 'above' ? yw - 70 : yw + 70;
      var read = eye === 'level' ? v : eye === 'above' ? v + 2 : v - 2;
      s += '<circle cx="330" cy="' + ey + '" r="9" fill="#fff" stroke="#0f172a" stroke-width="2"/><circle cx="326" cy="' + ey + '" r="3.5" fill="#0f172a"/>';
      s += '<line x1="320" y1="' + ey + '" x2="' + (x + w / 2) + '" y2="' + yw + '" stroke="' + (eye === 'level' ? '#15803d' : '#b91c1c') + '" stroke-dasharray="5 4" stroke-width="2"/>';
      s += '<text x="200" y="292" text-anchor="middle" font-size="12">mL · each small line is 2 mL</text>';
      r.querySelector('svg').innerHTML = s;
      r.querySelector('.sim-out').innerHTML = '<b>True volume: ' + v + ' mL. Your reading: ' + read + ' mL' + (read === v ? ' ✓' : (read > v ? ' (too big)' : ' (too small)')) + '.</b><br>' +
        (eye === 'level' ? 'Correct: your eye is level with the bottom of the meniscus (the curve).' :
          eye === 'above' ? 'Looking down from above, your line of sight crosses the scale higher up, so you read too much. Bend down until your eye is level.' :
          'Looking up from below, your line of sight crosses the scale lower down, so you read too little.');
    }
  };

  /* G6 · Displacement: the volume of an odd-shaped object */
  var OBJ = { marble: ['Marble', 6], pebble: ['Pebble', 12], stone: ['Stone', 22], key: ['Metal key', 3], toy: ['Small plastic toy', 9] };
  M.displace = {
    title: 'Displacement: finding the volume of an odd shape',
    html: function () { return '<div class="sim-c">' + select('ob', 'Object', Object.keys(OBJ).map(function (k) { return [k, OBJ[k][0]]; })) +
      slider('sv', 'Starting volume of water (mL)', 30, 70, 50, 2) + select('st', 'Show', [['before', 'Before: water only'], ['after', 'After: object slid in']]) + '</div>' +
      '<svg viewBox="0 0 400 260" role="img" aria-label="Measuring cylinder before and after the object goes in"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var o = OBJ[$(r, 'ob').value], sv = +$(r, 'sv').value, after = $(r, 'st').value === 'after', ev = sv + o[1];
      var top = 20, bot = 240, x = 165, w = 70;
      function y(ml) { return bot - (ml / 100) * (bot - top); }
      var lv = after ? ev : sv, s = '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + (bot - top) + '" fill="#f8fafc" stroke="#334155" stroke-width="2"/>';
      s += '<rect x="' + (x + 1) + '" y="' + y(lv) + '" width="' + (w - 2) + '" height="' + (bot - y(lv)) + '" fill="#93c5fd"/>';
      for (var m = 0; m <= 100; m += 10) s += '<line x1="' + x + '" y1="' + y(m) + '" x2="' + (x + 18) + '" y2="' + y(m) + '" stroke="#334155"/><text x="' + (x - 6) + '" y="' + (y(m) + 4) + '" text-anchor="end" font-size="11">' + m + '</text>';
      if (after) s += '<ellipse cx="' + (x + w / 2) + '" cy="' + (bot - 14) + '" rx="' + (8 + o[1] * 0.6) + '" ry="' + (6 + o[1] * 0.35) + '" fill="#78716c"/>';
      r.querySelector('svg').innerHTML = s;
      r.querySelector('.sim-out').innerHTML = after ? '<b>Start volume: ' + sv + ' mL · End volume: ' + ev + ' mL.</b><br>Volume of the ' + E(o[0].toLowerCase()) + ' = end − start = ' + ev + ' − ' + sv + ' = <b>' + o[1] + ' cm³</b> (1 mL = 1 cm³). The object pushed the water up by its own volume.'
        : '<b>Start volume: ' + sv + ' mL.</b> Read the bottom of the meniscus at eye level, then choose "After" to slide the ' + E(o[0].toLowerCase()) + ' in gently. Predict the new reading first.';
    }
  };

  /* G6 · Mass and weight: W = m × g */
  var PLACES = { earth: ['Earth', 10], moon: ['the Moon', 1.6], mars: ['Mars', 3.7], jupiter: ['Jupiter', 25] };
  M.weight = {
    title: 'Mass and weight in different places',
    html: function () { return '<div class="sim-c">' + slider('wm', 'Mass (kg)', 0.1, 150, 0.3, 0.1) +
      select('pl', 'Place', Object.keys(PLACES).map(function (k) { return [k, PLACES[k][0].replace('the ', '')]; })) + '</div>' +
      '<svg viewBox="0 0 400 200" role="img" aria-label="A newton meter and a balance"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var m = +$(r, 'wm').value, p = PLACES[$(r, 'pl').value], W = m * p[1];
      var stretch = Math.min(110, W * 2.2), s = '<rect x="60" y="10" width="40" height="8" fill="#334155"/><line x1="80" y1="18" x2="80" y2="30" stroke="#334155" stroke-width="3"/>';
      s += '<rect x="66" y="30" width="28" height="' + (40 + stretch) + '" rx="6" fill="#fde68a" stroke="#b45309"/>';
      s += '<line x1="80" y1="' + (70 + stretch) + '" x2="80" y2="' + (90 + stretch) + '" stroke="#334155" stroke-width="3"/><rect x="62" y="' + (90 + stretch) + '" width="36" height="22" fill="#64748b"/>';
      s += '<text x="120" y="' + (60 + stretch / 2) + '" font-size="14" font-weight="700" fill="#b45309">' + fx(W, 1) + ' N</text><text x="120" y="' + (78 + stretch / 2) + '" font-size="11">newton meter (weight)</text>';
      s += '<rect x="250" y="140" width="110" height="34" rx="6" fill="#e2e8f0" stroke="#334155"/><rect x="262" y="148" width="86" height="18" fill="#0f172a"/><text x="305" y="161" text-anchor="middle" font-size="12" fill="#86efac">' + fx(m, 1) + ' kg</text>';
      s += '<text x="305" y="190" text-anchor="middle" font-size="11">balance (mass)</text><rect x="285" y="118" width="40" height="22" fill="#64748b"/>';
      r.querySelector('svg').innerHTML = s;
      r.querySelector('.sim-out').innerHTML = '<b>On ' + E(p[0]) + ': weight = mass × g = ' + fx(m, 1) + ' kg × ' + p[1] + ' N/kg = ' + fx(W, 1) + ' N.</b><br>The mass is still ' + fx(m, 1) + ' kg: the object has the same amount of matter everywhere. ' +
        'Only the weight changes, because gravity pulls ' + (p[1] > 10 ? 'harder' : p[1] < 10 ? 'less' : 'with 10 N on every kilogram') + (p[1] !== 10 ? ' than on Earth (10 N/kg).' : '.');
    }
  };

  /* G6 · Density: float or sink in water */
  M.density = {
    title: 'Density: will it float or sink?',
    html: function () { return '<div class="sim-c">' + slider('dm', 'Mass (g)', 1, 200, 48) + slider('dv', 'Volume (cm³)', 1, 200, 80) + '</div>' +
      '<svg viewBox="0 0 400 220" role="img" aria-label="A block in a tank of water"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var m = +$(r, 'dm').value, v = +$(r, 'dv').value, d = m / v, side = 18 + Math.cbrt(v) * 8, water = 70;
      var s = '<rect x="60" y="' + water + '" width="280" height="130" fill="#bfdbfe"/><rect x="60" y="20" width="280" height="180" fill="none" stroke="#334155" stroke-width="2"/>';
      var yTop = Math.abs(d - 1) < 0.02 ? water + 40 : d < 1 ? water - side * (1 - d) : 200 - side;
      s += '<rect x="' + (200 - side / 2) + '" y="' + yTop + '" width="' + side + '" height="' + side + '" fill="' + (d < 1 ? '#d97706' : '#64748b') + '" stroke="#1f2937"/>';
      s += '<text x="200" y="214" text-anchor="middle" font-size="11">water: 1 g/cm³</text>';
      r.querySelector('svg').innerHTML = s;
      var v2 = Math.abs(d - 1) < 0.02 ? 'Its density equals water\'s, so it neither rises nor sinks: it stays where it is put.' : d < 1 ? 'Less dense than water (less than 1 g/cm³), so it FLOATS. The fraction under the water is about ' + Math.round(d * 100) + '%.' : 'Denser than water (more than 1 g/cm³), so it SINKS.';
      r.querySelector('.sim-out').innerHTML = '<b>Density = mass ÷ volume = ' + m + ' g ÷ ' + v + ' cm³ = ' + fx(d, 2) + ' g/cm³.</b><br>' + v2 + ' Being heavy is not what decides it: density is.';
    }
  };

  /* G6 · Dissolving time: temperature, grain size and stirring (fits the class data: 100 s at 20 °C, 31 s at 60 °C) */
  var GRAIN = { granulated: ['Granulated sugar', 1], cubes: ['Sugar cubes', 3.5], icing: ['Icing sugar', 0.3] };
  M.dissolve = {
    title: 'How fast does sugar dissolve?',
    html: function () { return '<div class="sim-c">' + slider('tt', 'Water temperature (°C)', 20, 60, 20, 10) +
      select('gr', 'Type of sugar (5 g)', Object.keys(GRAIN).map(function (k) { return [k, GRAIN[k][0]]; })) + select('sr', 'Stirring', [['no', 'No stirring'], ['yes', 'Stirred']]) + '</div>' +
      '<svg viewBox="0 0 400 120" role="img" aria-label="Time bar"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r, first, clicked) {
      var T = +$(r, 'tt').value, g = $(r, 'gr').value, st = $(r, 'sr').value, key = T + g + st;
      var base = 100 * Math.exp(-0.0293 * (T - 20)) * GRAIN[g][1] * (st === 'yes' ? 0.4 : 1), list = trials(r, key);
      if (clicked) list.push(Math.round(base * noise(0.04)));
      var last = list.length ? list[list.length - 1] : 0;
      r.querySelector('svg').innerHTML = '<rect x="20" y="40" width="360" height="30" fill="#f1f5f9" stroke="#cbd5e1"/><rect x="20" y="40" width="' + Math.min(360, last * 1.2) + '" height="30" fill="#0f766e"/>' +
        '<text x="20" y="30" font-size="12">Time for 5 g of sugar to dissolve in 50 cm³ of water</text><text x="20" y="92" font-size="12">' + (last ? last + ' s' : '') + '</text>';
      r.querySelector('.sim-out').innerHTML = '<b>' + T + ' °C · ' + E(GRAIN[g][0]) + ' · ' + (st === 'yes' ? 'stirred' : 'not stirred') + '</b><br>' + trialText(list, 's', 0) +
        '<br>Each trial is slightly different, like a real experiment. Change ONE thing at a time to keep the test fair.';
    }
  };

  /* G6 · Draining time from a burette (not proportional: 5 × the volume takes about 2 × the time) */
  M.drain = {
    title: 'Draining time from a burette',
    html: function () { return '<div class="sim-c">' + select('dvol', 'Volume of coloured water (cm³)', [['10', '10'], ['20', '20'], ['30', '30'], ['40', '40'], ['50', '50']]) + '</div>' +
      '<svg viewBox="0 0 400 230" role="img" aria-label="A burette with coloured water"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r, first, clicked) {
      var V = +$(r, 'dvol').value, list = trials(r, 'v' + V), note = '';
      if (clicked) {
        var t = 6.5 * Math.sqrt(V + 5) * noise(0.025);
        if (list.length && Math.random() < 0.12) { t *= 1.25; note = '<br><b>This trial is far from the others: an anomalous result?</b> Perhaps the stopwatch was stopped late. Do that trial again.'; }
        list.push(Math.round(t * 10) / 10);
      }
      var h = 20 + (V / 50) * 150, s = '<rect x="185" y="20" width="30" height="170" fill="#f8fafc" stroke="#334155"/><rect x="186" y="' + (190 - h + 20) + '" width="28" height="' + (h - 20) + '" fill="#f9a8d4"/>';
      s += '<rect x="190" y="190" width="20" height="10" fill="#d97706"/><line x1="200" y1="200" x2="200" y2="222" stroke="#334155" stroke-width="3"/>';
      r.querySelector('svg').innerHTML = s;
      r.querySelector('.sim-out').innerHTML = '<b>' + V + ' cm³, tap fully open.</b><br>' + trialText(list, 's', 1) + note;
    }
  };

  /* G6 · Mass of a volume of water, with and without TARE */
  M.watermass = {
    title: 'The mass of water on a balance',
    html: function () { return '<div class="sim-c">' + slider('wv', 'Volume of water (cm³)', 0, 50, 20, 5) + select('tare', 'Before adding the water…', [['yes', 'I pressed TARE with the empty cylinder'], ['no', 'I forgot to press TARE']]) + '</div>' +
      '<svg viewBox="0 0 400 200" role="img" aria-label="A measuring cylinder on a balance"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r, first, clicked) {
      var V = +$(r, 'wv').value, tared = $(r, 'tare').value === 'yes', list = trials(r, V + '' + tared);
      if (clicked) list.push(Math.round((V * 0.998 + (tared ? 0 : 64.3)) * noise(0.003) * 10) / 10);
      var last = list.length ? list[list.length - 1] : (tared ? 0 : 64.3);
      var s = '<rect x="120" y="150" width="160" height="40" rx="6" fill="#e2e8f0" stroke="#334155"/><rect x="150" y="160" width="100" height="20" fill="#0f172a"/>';
      s += '<text x="200" y="175" text-anchor="middle" font-size="13" fill="#86efac">' + fx(last, 1) + ' g</text><rect x="185" y="30" width="30" height="118" fill="#f8fafc" stroke="#334155"/>';
      s += '<rect x="186" y="' + (148 - V * 2.2) + '" width="28" height="' + (V * 2.2) + '" fill="#93c5fd"/>';
      r.querySelector('svg').innerHTML = s;
      r.querySelector('.sim-out').innerHTML = '<b>' + V + ' cm³ of water.</b> ' + trialText(list, 'g', 1) +
        '<br>' + (tared ? 'Tared: the reading is the mass of the water alone, about 1 g for every cm³.' : 'Not tared: every reading also includes the 64.3 g cylinder, so it is too big.');
    }
  };

  /* G6 · The squash test: air and water in a sealed syringe */
  M.syringe = {
    title: 'The squash test: air or water?',
    html: function () { return '<div class="sim-c">' + select('fill', 'Inside the sealed syringe', [['air', 'Air (a gas)'], ['water', 'Water (a liquid)']]) + slider('push', 'How hard you push', 0, 10, 0) + '</div>' +
      '<svg viewBox="0 0 400 140" role="img" aria-label="A sealed syringe with particles"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var air = $(r, 'fill').value === 'air', F = +$(r, 'push').value, vol = air ? 20 / (1 + F / 10) : 20, len = vol / 20 * 260;
      var s = '<rect x="40" y="40" width="270" height="60" fill="#f8fafc" stroke="#334155" stroke-width="2"/><circle cx="34" cy="70" r="8" fill="#b45309"/>';
      s += '<rect x="' + (40 + len) + '" y="42" width="10" height="56" fill="#475569"/><rect x="' + (50 + len) + '" y="64" width="' + (330 - len) + '" height="12" fill="#94a3b8"/>';
      var n = 24, cols = air ? 6 : 12, rows = air ? 4 : 2;
      for (var i = 0; i < n; i++) {
        var cx = 48 + ((i % cols) + 0.5) * (len - 10) / cols, cy = 48 + (Math.floor(i / cols) + 0.5) * 46 / rows;
        s += '<circle cx="' + fx(cx + (air ? ((i * 7) % 5) - 2 : 0), 1) + '" cy="' + fx(cy, 1) + '" r="' + (air ? 4 : 5.5) + '" fill="' + (air ? '#7c3aed' : '#2563eb') + '"/>';
      }
      s += '<text x="40" y="125" font-size="12">Volume: ' + fx(vol, 1) + ' cm³ (started at 20 cm³)</text>';
      r.querySelector('svg').innerHTML = s;
      r.querySelector('.sim-out').innerHTML = air ? '<b>Air: ' + fx(vol, 1) + ' cm³.</b> ' + (F ? 'It squashed. There are big gaps between gas particles, so they can be pushed closer together. The particles did not get smaller, and there are still 24 of them: only the gaps shrank.' : 'Push the plunger.')
        : '<b>Water: still 20.0 cm³.</b> ' + (F ? 'It will not squash however hard you push. The water particles are already touching, so there is no space left.' : 'Push the plunger.');
    }
  };

  /* G6 · Particle model of solid, liquid and gas (animated) */
  M.states = {
    title: 'The particle model: solid, liquid and gas',
    html: function () { return '<div class="sim-c">' + slider('tw', 'Temperature of water (°C)', -20, 120, 20) + '</div>' +
      '<svg viewBox="0 0 400 220" role="img" aria-label="Particles of water"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var T = +$(r, 'tw').value, st = T < 0 ? 'solid' : T > 100 ? 'gas' : (T === 0 || T === 100) ? 'change' : 'liquid';
      r._st = st; r._T = T;
      if (!r._anim) {
        r._anim = true; var t0 = 0;
        var tick = function () {
          if (!r.isConnected) return;
          t0 += 1; var svg = r.querySelector('svg'), s = '<rect x="20" y="10" width="360" height="190" fill="#f8fafc" stroke="#334155"/>', k = r._st, n = 24;
          for (var i = 0; i < n; i++) {
            var cx, cy, j = Math.sin(t0 / 3 + i) * 2;
            if (k === 'solid') { cx = 140 + (i % 6) * 24 + j; cy = 95 + Math.floor(i / 6) * 24 + Math.cos(t0 / 3 + i) * 2; }
            else if (k === 'liquid' || k === 'change') { cx = 60 + ((i * 53 + t0 * (1 + i % 3)) % 280); cy = 120 + ((i * 29) % 70) + j * 1.5; }
            else { cx = 30 + ((i * 97 + t0 * (4 + i % 5)) % 340); cy = 20 + ((i * 61 + t0 * (3 + i % 4)) % 170); }
            s += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="9" fill="#38bdf8" stroke="#0369a1"/>';
          }
          svg.innerHTML = s + '<text x="30" y="214" font-size="12">24 particles at ' + r._T + ' °C</text>';
          setTimeout(function () { window.requestAnimationFrame(tick); }, 90);
        };
        tick();
      }
      var msg = { solid: 'SOLID (ice): particles packed tightly in neat rows. They only vibrate on the spot, so a solid keeps its own shape.',
        liquid: 'LIQUID (water): particles still touch but are jumbled, and slide past each other, so a liquid flows and takes the shape of its container.',
        gas: 'GAS (steam): particles far apart with big gaps, moving fast in all directions, so a gas spreads out and fills its container and can be squashed.',
        change: 'CHANGING STATE at ' + T + ' °C: the temperature stays here until all of it has ' + (T === 0 ? 'melted' : 'boiled') + '.' }[st];
      r.querySelector('.sim-out').innerHTML = '<b>' + E(msg) + '</b><br>There are always 24 particles and they stay the same size: only their arrangement and movement change.';
    }
  };

  /* G6 · Heating curve of ice (pure water, or salt water) */
  var HEAT = { pure: [-6, -1, 0, 0, 0, 0, 1, 18, 36, 54, 72, 89, 99, 100, 100], salt: [-10, -6, -4, -3.5, -3, -2.5, -1, 16, 34, 52, 70, 87, 100, 102, 102.5] };
  M.heating = {
    title: 'Heating ice: the heating curve',
    html: function () { return '<div class="sim-c">' + select('hs', 'Substance', [['pure', 'Pure water (ice)'], ['salt', 'Salt water (ice from sea water)']]) + slider('hm', 'Time heating (minutes)', 0, 14, 14) + '</div>' +
      '<svg viewBox="0 0 400 240" role="img" aria-label="Temperature against time"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var k = $(r, 'hs').value, tm = +$(r, 'hm').value, d = HEAT[k], X = function (t) { return 50 + t * 22; }, Y = function (c) { return 200 - (c + 15) * 1.5; };
      var s = '<line x1="50" y1="200" x2="370" y2="200" stroke="#334155"/><line x1="50" y1="20" x2="50" y2="200" stroke="#334155"/>';
      [0, 50, 100].forEach(function (c) { s += '<line x1="46" y1="' + Y(c) + '" x2="370" y2="' + Y(c) + '" stroke="#e2e8f0"/><text x="42" y="' + (Y(c) + 4) + '" text-anchor="end" font-size="11">' + c + '</text>'; });
      s += '<text x="210" y="226" text-anchor="middle" font-size="12">Time (minutes)</text><text x="14" y="110" font-size="12" transform="rotate(-90 14 110)" text-anchor="middle">Temperature (°C)</text>';
      var pts = []; for (var i = 0; i <= tm; i++) pts.push(X(i) + ',' + Y(d[i]));
      s += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#e4572e" stroke-width="3"/>';
      for (var j = 0; j <= tm; j++) s += '<circle cx="' + X(j) + '" cy="' + Y(d[j]) + '" r="3" fill="#e4572e"/>';
      r.querySelector('svg').innerHTML = s;
      var c = d[tm], st;
      if (k === 'pure') st = tm <= 1 ? 'ice warming up' : tm <= 5 ? 'ice melting: the temperature stays at 0 °C' : tm <= 11 ? 'liquid water warming up' : 'water boiling: the temperature stays at 100 °C';
      else st = tm <= 1 ? 'salty ice warming up' : tm <= 6 ? 'salty ice melting over a RANGE, below 0 °C' : tm <= 11 ? 'salt water warming up' : 'salt water boiling ABOVE 100 °C, and still creeping up';
      r.querySelector('.sim-out').innerHTML = '<b>' + tm + ' min: ' + c + ' °C · ' + E(st) + '.</b><br>' + (k === 'pure' ? 'The flat parts are changes of state: the heat pulls particles apart instead of making them hotter. A pure substance melts and boils at one fixed temperature.'
        : 'Impurities lower the melting point, raise the boiling point, and make the substance change state over a range instead of at one fixed temperature.');
    }
  };

  /* G6 · Build a molecule: element or compound? */
  var ATOM = { C: ['#111827', 'carbon'], H: ['#ffffff', 'hydrogen'], N: ['#2563eb', 'nitrogen'], O: ['#dc2626', 'oxygen'] };
  var KNOWN = { H2: 'hydrogen', O2: 'oxygen', N2: 'nitrogen', O3: 'ozone', H2O: 'water', CO2: 'carbon dioxide', CO: 'carbon monoxide', CH4: 'methane', NH3: 'ammonia', H2O2: 'hydrogen peroxide' };
  M.molecule = {
    title: 'Build a molecule: element or compound?',
    html: function () { return '<div class="sim-c">' + slider('aC', 'Carbon atoms (black)', 0, 2, 0) + slider('aH', 'Hydrogen atoms (white)', 0, 4, 2) + slider('aN', 'Nitrogen atoms (blue)', 0, 2, 0) + slider('aO', 'Oxygen atoms (red)', 0, 3, 1) + '</div>' +
      '<svg viewBox="0 0 400 130" role="img" aria-label="Model atoms joined together"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var n = { C: +$(r, 'aC').value, H: +$(r, 'aH').value, N: +$(r, 'aN').value, O: +$(r, 'aO').value }, f = '', types = 0, total = 0, s = '', x = 40;
      ['C', 'H', 'N', 'O'].forEach(function (a) { if (n[a]) { types++; total += n[a]; f += a + (n[a] > 1 ? n[a] : ''); }
        for (var i = 0; i < n[a]; i++) { s += (x > 40 ? '<line x1="' + (x - 34) + '" y1="65" x2="' + x + '" y2="65" stroke="#64748b" stroke-width="4"/>' : '') + '<circle cx="' + x + '" cy="65" r="' + (a === 'H' ? 13 : 18) + '" fill="' + ATOM[a][0] + '" stroke="#334155" stroke-width="2"/>'; x += 34; } });
      r.querySelector('svg').innerHTML = s || '<text x="200" y="70" text-anchor="middle" font-size="13">Add some atoms</text>';
      var sub = f.replace(/(\d)/g, function (d) { return '₀₁₂₃₄₅₆₇₈₉'[d]; }), name = KNOWN[f];
      r.querySelector('.sim-out').innerHTML = !total ? 'Use the sliders to add atoms.' : total === 1 ? '<b>' + sub + ': a single atom of an element.</b>' :
        '<b>Formula: ' + sub + ' · ' + total + ' atoms · ' + types + ' type' + (types > 1 ? 's' : '') + ' of atom → ' + (types === 1 ? 'an ELEMENT' : 'a COMPOUND') + '.</b><br>' +
        (name ? 'This is ' + name + '. ' : 'This combination is not a real molecule, but the rule still works. ') + 'Count the TYPES of atom, not the number: one type is an element; two or more different types joined is a compound.';
    }
  };

  /* G6 · Particle diagrams: elements, compounds, mixtures, solutions */
  M.particles = {
    title: 'Particles: element, compound or mixture?',
    html: function () { return '<div class="sim-c">' + select('pk', 'Substance', [['el', 'Element: single atoms (helium)'], ['elm', 'Element: molecules (oxygen, O₂)'], ['co', 'Compound (water, H₂O)'],
      ['mix', 'Mixture of two elements (air: N₂ and O₂)'], ['mix2', 'Mixture of an element and a compound'], ['sol', 'Solution (sugar dissolved in water)']]) + '</div>' +
      '<svg viewBox="0 0 400 200" role="img" aria-label="Particle diagram"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var k = $(r, 'pk').value, s = '<rect x="100" y="10" width="200" height="180" rx="10" fill="#f8fafc" stroke="#334155"/>';
      function at(x, y, c, rr) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (rr || 9) + '" fill="' + c + '" stroke="#334155"/>'; }
      for (var i = 0; i < 12; i++) {
        var x = 125 + (i % 4) * 48, y = 40 + Math.floor(i / 4) * 55;
        if (k === 'el') s += at(x, y, '#facc15');
        else if (k === 'elm') s += at(x - 7, y, '#dc2626') + at(x + 7, y, '#dc2626');
        else if (k === 'co') s += at(x, y, '#dc2626', 10) + at(x - 11, y + 8, '#fff', 6) + at(x + 11, y + 8, '#fff', 6);
        else if (k === 'mix') s += i % 3 ? at(x - 7, y, '#2563eb') + at(x + 7, y, '#2563eb') : at(x - 7, y, '#dc2626') + at(x + 7, y, '#dc2626');
        else if (k === 'mix2') s += i % 2 ? at(x - 7, y, '#dc2626') + at(x + 7, y, '#dc2626') : at(x, y, '#111827', 9) + at(x - 15, y, '#dc2626', 7) + at(x + 15, y, '#dc2626', 7);
        else s += i % 4 === 1 ? at(x, y, '#22d3ee', 12) : at(x, y, '#cbd5e1', 8);
      }
      r.querySelector('svg').innerHTML = s;
      var t = { el: 'PURE · ELEMENT: only one type of atom.', elm: 'PURE · ELEMENT: the molecules are made of only one type of atom (O₂), so it is still an element.',
        co: 'PURE · COMPOUND: every particle is the same, and each has two different types of atom chemically joined.', mix: 'MIXTURE (impure): two different substances, not joined to each other.',
        mix2: 'MIXTURE (impure): an element (O₂) and a compound (CO₂) mixed, not joined.', sol: 'MIXTURE (a solution, homogeneous): solute particles (blue) spread evenly between solvent particles (grey).' }[k];
      r.querySelector('.sim-out').innerHTML = '<b>' + E(t) + '</b><br>A pure substance has only one kind of particle. A mixture has two or more kinds, not chemically joined, so it can be separated by physical methods.';
    }
  };

  /* G6 · Drop test for purity: does a residue form? */
  M.droptest = {
    title: 'The drop test: is the water pure?',
    html: function () { return '<div class="sim-c">' + slider('dt', 'Drying time under the lamp (minutes)', 0, 15, 0) + '</div>' +
      '<svg viewBox="0 0 400 160" role="img" aria-label="Three drops on a black tile"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var t = +$(r, 'dt').value, f = Math.max(0, 1 - t / 12), names = ['A · distilled', 'B · tap', 'C · salt'], s = '<rect x="20" y="20" width="360" height="110" rx="8" fill="#111827"/>';
      for (var i = 0; i < 3; i++) {
        var cx = 80 + i * 120;
        if (f > 0) s += '<ellipse cx="' + cx + '" cy="70" rx="' + (6 + 26 * f) + '" ry="' + (4 + 16 * f) + '" fill="#93c5fd" opacity="0.8"/>';
        if (t >= 12 && i === 1) s += '<ellipse cx="' + cx + '" cy="70" rx="26" ry="16" fill="none" stroke="#e5e7eb" stroke-width="1.5" opacity="0.6"/>';
        if (t >= 12 && i === 2) s += '<ellipse cx="' + cx + '" cy="70" rx="24" ry="14" fill="#f8fafc" opacity="0.9"/>';
        s += '<text x="' + cx + '" y="150" text-anchor="middle" font-size="12">' + names[i] + '</text>';
      }
      r.querySelector('svg').innerHTML = s;
      r.querySelector('.sim-out').innerHTML = t < 12 ? '<b>Still drying (' + t + ' of about 12 minutes).</b> Predict which drops will leave a mark.' :
        '<b>Dry. A: no residue (pure). B: a faint ring of minerals (impure). C: a white crust of salt (impure).</b><br>Dissolved solids cannot evaporate, so they are left behind as a residue. Pure water leaves nothing.';
    }
  };

  /* G6 · Elephant toothpaste: a catalyst makes the foam */
  M.foam = {
    title: 'Elephant toothpaste: what makes more foam, faster?',
    html: function () { return '<div class="sim-c">' + select('yst', 'Yeast (the catalyst)', [['yes', '1 tablespoon of yeast'], ['no', 'No yeast']]) + slider('yt', 'Temperature of the yeast water (°C)', 10, 60, 35, 5) +
      slider('hp', 'Hydrogen peroxide (mL of 3%)', 30, 120, 120, 10) + slider('fs', 'Time after mixing (seconds)', 0, 60, 30, 5) + '</div>' +
      '<svg viewBox="0 0 400 230" role="img" aria-label="Foam rising from a bottle"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var y = $(r, 'yst').value === 'yes', T = +$(r, 'yt').value, V = +$(r, 'hp').value, t = +$(r, 'fs').value;
      var act = y ? Math.max(0.05, Math.exp(-Math.pow((T - 37) / 14, 2))) : 0.01, k = 0.12 * act, H = (V / 120) * 150 * (1 - Math.exp(-k * t));
      var s = '<rect x="170" y="140" width="60" height="80" rx="8" fill="#e0f2fe" stroke="#334155"/><rect x="188" y="118" width="24" height="24" fill="#e0f2fe" stroke="#334155"/>';
      for (var i = 0; i < Math.min(19, Math.round(H / 8)); i++) s += '<circle cx="' + (200 + Math.sin(i * 1.7) * 14) + '" cy="' + (118 - i * 6) + '" r="' + (11 + (i % 3) * 2) + '" fill="#fbcfe8" stroke="#db2777" stroke-width="0.6"/>';
      r.querySelector('svg').innerHTML = s;
      r.querySelector('.sim-out').innerHTML = '<b>Foam height after ' + t + ' s: about ' + Math.round(H) + ' mm.</b><br>' +
        (y ? 'Yeast is a catalyst: it speeds up the breakdown of hydrogen peroxide into water and oxygen without being used up. ' + (T > 50 ? 'Too hot: the yeast\'s enzyme is damaged, so it slows down. ' : T < 25 ? 'Cold yeast works slowly. ' : 'Warm yeast works fast. ') : 'Without the catalyst, hydrogen peroxide breaks down very slowly, so almost no foam forms. ') +
        'More hydrogen peroxide makes more oxygen, so more foam. The washing-up liquid traps the oxygen in bubbles: the foam is a heterogeneous mixture of gas in liquid.';
    }
  };

  /* G6 · Solubility and saturation (per 100 g of water) */
  var SOLY = { sugar: [204, 220, 238, 260, 287, 320, 362], salt: [36.0, 36.3, 36.6, 37.0, 37.3, 37.8, 38.4] };
  M.solubility = {
    title: 'Dissolving: concentrated, dilute or saturated?',
    html: function () { return '<div class="sim-c">' + select('sl', 'Solute', [['salt', 'Salt'], ['sugar', 'Sugar']]) + slider('sp', 'Spoons added (5 g each)', 0, 60, 4) + slider('stp', 'Water temperature (°C)', 20, 80, 20, 10) + '</div>' +
      '<svg viewBox="0 0 400 200" role="img" aria-label="A beaker of solution"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var k = $(r, 'sl').value, g = +$(r, 'sp').value * 5, T = +$(r, 'stp').value, max = SOLY[k][(T - 20) / 10], dis = Math.min(g, max), und = g - dis, frac = dis / max;
      var s = '<path d="M130 30 L130 180 L270 180 L270 30" fill="none" stroke="#334155" stroke-width="2"/><rect x="131" y="60" width="138" height="119" fill="' + (k === 'salt' ? 'rgba(59,130,246,' : 'rgba(234,179,8,') + (0.12 + 0.5 * frac).toFixed(2) + ')"/>';
      for (var i = 0; i < Math.min(40, Math.ceil(und / 4)); i++) s += '<rect x="' + (136 + (i * 13) % 126) + '" y="' + (172 - Math.floor(i / 10) * 5) + '" width="6" height="5" fill="#f8fafc" stroke="#94a3b8"/>';
      r.querySelector('svg').innerHTML = s;
      var label = und > 0 ? 'SATURATED: no more can dissolve; ' + fx(und, 0) + ' g stays at the bottom.' : frac > 0.5 ? 'CONCENTRATED: a lot of solute.' : g === 0 ? 'Just water: add some solute.' : 'DILUTE: only a little solute.';
      r.querySelector('.sim-out').innerHTML = '<b>' + E(label) + '</b><br>Dissolved: ' + fx(dis, 0) + ' g of ' + k + ' in 100 g of water at ' + T + ' °C (at most ' + fx(max, 1) + ' g can dissolve).' +
        '<br><b>Mass check: 100 g water + ' + g + ' g ' + k + ' = ' + (100 + g) + ' g.</b> Mass is not lost when a solid dissolves: its particles spread out between the water particles.' + (k === 'sugar' ? ' Warmer water dissolves much more sugar.' : ' Warmer water dissolves only a little more salt.');
    }
  };

  /* G6 · Choosing a separation method */
  var MIXES = { stones: 'Sand + small stones', grain: 'Grain + husks', iron: 'Sand + iron filings', muddy: 'Muddy water', salt: 'Salt water', oil: 'Oil + water' };
  var SEP = {
    stones: { sieve: [3, 'The small sand falls through the holes; the stones stay in the sieve.'], magnet: [0, 'Neither sand nor stone is magnetic.'], filter: [1, 'The water-free solids just sit on the paper: use a sieve.'] },
    grain: { winnow: [3, 'The wind blows the light husks away; the heavy grain falls straight down.'], sieve: [1, 'Husks and grain are similar in size, so a sieve does not separate them well.'] },
    iron: { magnet: [3, 'Iron is magnetic, so the magnet pulls the filings out; sand is not.'], sieve: [1, 'Fine sand and filings are a similar size.'] },
    muddy: { decant: [2, 'The heavy soil settles and you pour off the water, but the finest particles stay in it.'], filter: [3, 'The filter paper holds back the soil (residue); clear water passes through (filtrate).'], sieve: [0, 'The holes in a sieve are far too big for soil particles.'] },
    salt: { filter: [0, 'Salt is DISSOLVED: its particles are too small and pass through the filter paper with the water.'], decant: [0, 'Nothing settles: dissolved salt stays spread out.'], evap: [3, 'Evaporating the water leaves the salt behind (Part 2 of this topic).'] },
    oil: { sawdust: [3, 'The oil sticks to the surface of the sawdust (adsorption); the oily sawdust floats and is scooped off.'], decant: [2, 'Oil floats on water, so you can pour the oil off carefully, but some is left.'], filter: [0, 'Oil and water both pass through filter paper.'] }
  };
  M.separate = {
    title: 'Separating mixtures: choose a method',
    html: function () { return '<div class="sim-c">' + select('mx', 'Mixture', Object.keys(MIXES).map(function (k) { return [k, MIXES[k]]; })) +
      select('md', 'Method', [['sieve', 'Sieving'], ['winnow', 'Winnowing'], ['magnet', 'Magnetic separation'], ['decant', 'Decantation'], ['filter', 'Filtration'], ['sawdust', 'Oil adsorption (sawdust)'], ['evap', 'Evaporation']]) + '</div>' +
      '<div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var mx = $(r, 'mx').value, md = $(r, 'md').value, o = (SEP[mx] || {})[md] || [0, 'This method does not use a property that is different between the parts of this mixture.'];
      r.querySelector('.sim-out').innerHTML = '<b>' + ['✗ Does not work', '★ Works poorly', '★★ Works quite well', '★★★ Works very well'][o[0]] + '.</b> ' + E(o[1]) +
        '<br>Every method uses a DIFFERENCE in a property: size (sieving, filtration), weight (winnowing, decantation), magnetism, or sticking to a surface (adsorption).';
    }
  };

  /* ===== DP1 HL · A2.3 Viruses simulators ===== */
  /* B2.2.2 · Nuclear and cytoplasmic separation: gene expression with and without a nucleus */
  M.compart = {
    title: 'Transcription and translation: prokaryote or eukaryote?',
    html: function () { return '<div class="sim-c">' + select('cpt', 'Cell', [['pro', 'Prokaryote (no nucleus)'], ['eu', 'Eukaryote (nucleus)']]) + slider('cps', 'Time (stage 1 to 4)', 1, 4, 1) + '</div><svg viewBox="0 0 400 170" role="img" aria-label="Gene expression"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var eu = $(r, 'cpt').value === 'eu', s = +$(r, 'cps').value, g = '<rect x="10" y="10" width="380" height="150" rx="40" fill="#f0f9ff" stroke="#0369a1" stroke-width="3"/>';
      if (eu) g += '<circle cx="110" cy="85" r="60" fill="#ede5ff" stroke="#6d28d9" stroke-width="3"/><circle cx="110" cy="85" r="66" fill="none" stroke="#6d28d9" stroke-width="2"/>' + [[110, 19], [170, 70], [150, 140], [55, 125]].map(function (p) { return '<rect x="' + (p[0] - 4) + '" y="' + (p[1] - 4) + '" width="8" height="8" fill="#fff" stroke="#6d28d9"/>'; }).join('') + '<text x="190" y="150" font-size="11">← nucleus (pores in envelope)</text>';
      g += '<path d="M60 85 h100" stroke="#1e3a8a" stroke-width="6"/><text x="110" y="78" text-anchor="middle" font-size="10">gene (DNA)</text>';
      function mrna(x, y, len, col) { return '<path d="M' + x + ' ' + y + ' h' + len + '" stroke="' + (col || '#db2777') + '" stroke-width="4"/>'; }
      function ribo(x, y) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="10" ry="7" fill="#f59e0b" stroke="#92400e"/><path d="M' + x + ' ' + (y - 8) + ' q8 -14 18 -16" stroke="#15803d" stroke-width="3" fill="none"/>'; }
      var msg;
      if (!eu) {
        if (s >= 1) g += mrna(60, 100, s === 1 ? 40 : 100);
        if (s >= 2) g += ribo(75, 100) + (s >= 3 ? ribo(100, 100) + ribo(125, 100) : '');
        if (s === 4) g += '<path d="M250 60 q20 10 40 0 t40 5" stroke="#15803d" stroke-width="4" fill="none"/><text x="290" y="85" text-anchor="middle" font-size="11">finished proteins</text>';
        msg = ['Transcription starts: mRNA is made in the cytoplasm, next to the DNA.', 'Ribosomes attach to the mRNA and start translation BEFORE transcription has finished: the two happen at the same time, in the same place.', 'Several ribosomes translate the same mRNA at once.', 'Proteins are released. Fast, but no chance to modify the mRNA first.'][s - 1];
      } else {
        if (s >= 1 && s <= 2) g += mrna(60, 100, 100, s === 1 ? '#f9a8d4' : '#db2777');
        if (s === 2) g += '<text x="110" y="118" text-anchor="middle" font-size="10">introns removed</text>';
        if (s >= 3) g += mrna(200, 100, 110) + ribo(230, 100) + ribo(265, 100);
        if (s === 4) g += '<path d="M300 50 q20 10 40 0 t30 5" stroke="#15803d" stroke-width="4" fill="none"/><text x="320" y="40" text-anchor="middle" font-size="11">finished proteins</text>';
        msg = ['Transcription happens INSIDE the nucleus: a pre-mRNA is made.', 'Post-transcriptional modification: introns are removed (splicing) and the mRNA is processed while it is still in the nucleus, away from ribosomes.', 'The mature mRNA leaves through a nuclear pore. Translation by ribosomes happens only in the cytoplasm.', 'Proteins are released. Separating transcription from translation lets the cell check and edit mRNA before it is used.'][s - 1];
      }
      r.querySelector('svg').innerHTML = g; r.querySelector('.sim-out').innerHTML = '<b>Stage ' + s + '.</b> ' + msg;
    }
  };

  /* B2.2.4–B2.2.5 · Folded membranes: cristae and thylakoids increase surface area */
  M.cristae = {
    title: 'Folding a membrane: cristae and thylakoids',
    html: function () { return '<div class="sim-c">' + select('crt', 'Organelle', [['mito', 'Mitochondrion: cristae'], ['chl', 'Chloroplast: thylakoids']]) + slider('crn', 'Number of folds or thylakoids', 0, 12, 4) + '</div><svg viewBox="0 0 400 180" role="img" aria-label="Organelle"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var mito = $(r, 'crt').value === 'mito', n = +$(r, 'crn').value, g = '', base = 2 * 300 + 2 * 120, add = 0;
      if (mito) {
        g += '<rect x="40" y="25" width="320" height="130" rx="65" fill="#fee2e2" stroke="#991b1b" stroke-width="3"/><rect x="50" y="35" width="300" height="110" rx="55" fill="#fef2f2" stroke="#b91c1c" stroke-width="2"/>';
        for (var i = 0; i < n; i++) { var x = 80 + i * (240 / Math.max(n, 1)), up = i % 2 === 0; g += '<path d="M' + x + ' ' + (up ? 36 : 144) + ' v' + (up ? 70 : -70) + ' h8 v' + (up ? -70 : 70) + '" fill="none" stroke="#b91c1c" stroke-width="2"/>'; add += 140; }
        g += '<text x="200" y="172" text-anchor="middle" font-size="10">matrix inside; intermembrane space between the two membranes</text>';
      } else {
        g += '<ellipse cx="200" cy="90" rx="170" ry="72" fill="#dcfce7" stroke="#166534" stroke-width="3"/><ellipse cx="200" cy="90" rx="162" ry="64" fill="none" stroke="#166534" stroke-width="2"/>';
        for (var j = 0; j < n; j++) { var cx = 90 + (j % 6) * 44, cy = j < 6 ? 70 : 115; for (var k = 0; k < 4; k++) g += '<rect x="' + (cx - 16) + '" y="' + (cy - 14 + k * 7) + '" width="32" height="6" rx="3" fill="#4ade80" stroke="#166534"/>'; add += 4 * 76; }
        g += '<text x="200" y="174" text-anchor="middle" font-size="11">grana (stacks of thylakoids) in the stroma</text>';
      }
      var total = base + add, ratio = total / base;
      r.querySelector('svg').innerHTML = g;
      r.querySelector('.sim-out').innerHTML = '<b>' + (mito ? 'Inner membrane' : 'Thylakoid membrane') + ' area: ' + ratio.toFixed(1) + ' × that of an unfolded organelle.</b><br>' +
        (mito ? 'ATP synthase and the electron transport chain are IN the inner membrane, so more cristae = more sites for oxidative phosphorylation = more ATP. Protons are pumped into the small intermembrane space, building a steep gradient quickly. Very active cells (muscle, liver, sperm) have mitochondria with many cristae.'
              : 'Photosystems, electron carriers and ATP synthase are IN the thylakoid membranes, so more thylakoids = more light absorbed and more ATP and NADPH made. Protons build up in the small thylakoid lumen; the Calvin cycle enzymes are in the stroma.');
    }
  };

  /* B2.2.7–B2.2.9 · Following a protein to its destination */
  var PATH = {
    sec: ['Secreted protein (e.g. insulin, digestive enzymes)', ['Nucleus: the gene is transcribed into mRNA.', 'mRNA leaves through a nuclear pore; a ribosome starts translating. A signal sequence at the start of the protein makes the ribosome BIND to the rough ER.', 'The growing polypeptide is fed into the lumen of the rough ER, where it folds and may be modified (e.g. sugars added).', 'The protein buds off the ER in a transport vesicle and moves to the CIS face of the Golgi.', 'In the Golgi it is modified further, sorted and packaged. It leaves the TRANS face in a secretory vesicle.', 'The vesicle fuses with the plasma membrane: EXOCYTOSIS releases the protein outside the cell.']],
    mem: ['Membrane protein (e.g. a channel or receptor)', ['Nucleus: transcription.', 'Translation begins; the signal sequence directs the ribosome to the rough ER.', 'The protein is inserted INTO the ER membrane rather than released into the lumen.', 'It travels in the membrane of a transport vesicle to the Golgi.', 'The Golgi modifies and sorts it into a vesicle heading for the plasma membrane.', 'When the vesicle fuses with the plasma membrane, the protein becomes part of the plasma membrane.']],
    lys: ['Lysosome enzyme (hydrolase)', ['Nucleus: transcription.', 'Translation on a ribosome bound to the rough ER.', 'The enzyme enters the ER lumen and folds.', 'Transport vesicle to the Golgi.', 'The Golgi tags it (with a phosphate on a sugar) and packages it into a CLATHRIN-coated vesicle.', 'The vesicle loses its coat and fuses with a lysosome: the enzyme now works at low pH inside it.']],
    cyt: ['Protein used in the cytosol (e.g. glycolysis enzymes)', ['Nucleus: transcription.', 'There is no ER signal sequence, so translation is completed by a FREE ribosome in the cytosol.', 'The protein folds in the cytosol.', 'It stays in the cytosol, or is imported into the nucleus, a mitochondrion or a chloroplast.', 'No vesicles or Golgi are needed.', 'Done: free ribosomes make proteins that are used inside the cell.']]
  };
  M.proteinpath = {
    title: 'Where does the protein go? Ribosomes, rough ER, Golgi and vesicles',
    html: function () { return '<div class="sim-c">' + select('ppd', 'Protein', Object.keys(PATH).map(function (k) { return [k, PATH[k][0]]; })) + slider('pps', 'Step (1 to 6)', 1, 6, 1) + '</div><svg viewBox="0 0 400 180" role="img" aria-label="Protein pathway"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var d = $(r, 'ppd').value, s = +$(r, 'pps').value, free = d === 'cyt', g = '';
      g += '<rect x="5" y="5" width="390" height="170" rx="30" fill="#fff7ed" stroke="#9a3412" stroke-width="3"/>';
      g += '<circle cx="55" cy="90" r="38" fill="#ede5ff" stroke="#6d28d9" stroke-width="3"/><text x="55" y="94" text-anchor="middle" font-size="10">nucleus</text>';
      g += '<path d="M105 50 q15 40 0 80 M120 50 q15 40 0 80 M135 50 q15 40 0 80" stroke="#0369a1" stroke-width="5" fill="none"/>' + [60, 80, 100, 120].map(function (y) { return '<circle cx="' + (102 + (y % 40) / 4) + '" cy="' + y + '" r="3" fill="#f59e0b"/>'; }).join('') + '<text x="122" y="145" text-anchor="middle" font-size="10">rough ER</text>';
      g += '<path d="M220 55 q25 -8 50 0 M215 72 q30 -8 60 0 M215 90 q30 -8 60 0 M220 108 q25 -8 50 0" stroke="#15803d" stroke-width="5" fill="none"/><text x="245" y="128" text-anchor="middle" font-size="10">Golgi: cis (left) → trans (right)</text>';
      g += '<circle cx="330" cy="140" r="16" fill="#fecaca" stroke="#991b1b"/><text x="330" y="168" text-anchor="middle" font-size="9">lysosome</text>';
      var X = free ? [55, 150, 170, 180, 180, 180] : [55, 110, 125, 185, 285, d === 'lys' ? 330 : 385], Y = free ? [90, 40, 40, 40, 40, 40] : [90, 70, 100, 80, 80, d === 'lys' ? 140 : 90];
      var x = X[s - 1], y = Y[s - 1], col = '#db2777';
      if (s === 4 && !free || s === 6 && !free && d !== 'sec') g += '<circle cx="' + x + '" cy="' + y + '" r="11" fill="#fef3c7" stroke="#b45309" stroke-width="2"' + (d === 'lys' && s >= 5 ? ' stroke-dasharray="3 2"' : '') + '/>';
      if (s === 5 && !free) g += '<circle cx="' + x + '" cy="' + y + '" r="11" fill="#fef3c7" stroke="#b45309" stroke-width="' + (d === 'lys' ? 4 : 2) + '"' + (d === 'lys' ? ' stroke-dasharray="3 2"' : '') + '/>';
      if (free && s >= 2) g += '<ellipse cx="150" cy="40" rx="9" ry="6" fill="#f59e0b"/>';
      g += '<circle cx="' + x + '" cy="' + y + '" r="5" fill="' + col + '"/>';
      if (d === 'sec' && s === 6) g += '<path d="M392 90 l-14 -6 v12 z" fill="' + col + '"/>';
      r.querySelector('svg').innerHTML = g;
      r.querySelector('.sim-out').innerHTML = '<b>' + E(PATH[d][0]) + ' · step ' + s + ':</b> ' + E(PATH[d][1][s - 1]) + '<br><span class="small">Pink dot = the protein. ' + (free ? 'Free ribosome shown top left of the ER.' : 'Dashed vesicle = clathrin coat.') + '</span>';
    }
  };

  /* A1.2.6–A1.2.12 · Base pairing: complementary strand, antiparallel ends, RNA copy, purines and pyrimidines */
  var PAIR = { A: 'T', T: 'A', C: 'G', G: 'C' }, PUR = { A: 1, G: 1 };
  M.basepair = {
    title: 'Complementary base pairing and antiparallel strands',
    html: function () { return '<label for="bp">DNA strand, written 5′ → 3′ (A, C, G, T)<input id="bp" type="text" value="ATGCGTACCTAG" maxlength="20" autocomplete="off"></label>' +
      '<div class="sim-c">' + select('bv', 'Show', [['dna', 'The complementary DNA strand'], ['rna', 'The mRNA made using this strand as the template']]) + '</div><svg viewBox="0 0 400 150" role="img" aria-label="Two paired strands"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var raw = ($(r, 'bp').value || '').toUpperCase(), s = raw.replace(/[^ACGT]/g, '').slice(0, 20), rna = $(r, 'bv').value === 'rna', g = '', n = s.length, w = Math.min(28, 340 / Math.max(n, 1)), x0 = 40;
      if (!n) { r.querySelector('svg').innerHTML = ''; r.querySelector('.sim-out').textContent = 'Type a strand using only A, C, G and T.'; return; }
      var comp = s.split('').map(function (b) { return rna && b === 'A' ? 'U' : PAIR[b]; }), hb = 0, pur = 0;
      g += '<text x="4" y="40" font-size="12" font-weight="700">5′</text><text x="' + (x0 + n * w + 4) + '" y="40" font-size="12" font-weight="700">3′</text>';
      g += '<text x="4" y="118" font-size="12" font-weight="700">3′</text><text x="' + (x0 + n * w + 4) + '" y="118" font-size="12" font-weight="700">5′</text>';
      g += '<line x1="' + x0 + '" y1="20" x2="' + (x0 + n * w) + '" y2="20" stroke="#64748b" stroke-width="4"/><line x1="' + x0 + '" y1="132" x2="' + (x0 + n * w) + '" y2="132" stroke="' + (rna ? '#db2777' : '#64748b') + '" stroke-width="4"/>';
      s.split('').forEach(function (b, i) {
        var x = x0 + i * w + w / 2, c = comp[i], h = (b === 'C' || b === 'G') ? 3 : 2; hb += h; if (PUR[b]) pur++;
        var col = function (k) { return ({ A: '#2563eb', T: '#dc2626', U: '#ea580c', C: '#15803d', G: '#7c3aed' })[k]; };
        g += '<rect x="' + (x - w / 2 + 2) + '" y="22" width="' + (w - 4) + '" height="' + (PUR[b] ? 44 : 30) + '" fill="' + col(b) + '" opacity=".85"/><text x="' + x + '" y="36" text-anchor="middle" font-size="12" fill="#fff" font-weight="700">' + b + '</text>';
        g += '<rect x="' + (x - w / 2 + 2) + '" y="' + (PUR[b] ? 100 : 86) + '" width="' + (w - 4) + '" height="' + (PUR[b] ? 30 : 44) + '" fill="' + col(c) + '" opacity=".85"/><text x="' + x + '" y="124" text-anchor="middle" font-size="12" fill="#fff" font-weight="700">' + c + '</text>';
        for (var k = 0; k < h; k++) g += '<line x1="' + (x - 6 + k * 6) + '" y1="' + (PUR[b] ? 68 : 54) + '" x2="' + (x - 6 + k * 6) + '" y2="' + (PUR[b] ? 98 : 84) + '" stroke="#0f172a" stroke-dasharray="2 2"/>';
      });
      r.querySelector('svg').innerHTML = g;
      r.querySelector('.sim-out').innerHTML = '<b>' + (rna ? 'mRNA' : 'Complementary strand') + ', written 5′ → 3′:</b> ' + comp.slice().reverse().join('') + ' &nbsp; (read right to left in the diagram)' +
        '<br>Hydrogen bonds: <b>' + hb + '</b> (A–T 2, C–G 3' + (rna ? ', A–U 2' : '') + '). Purines on the top strand: ' + pur + ' of ' + n + '.' +
        '<br>Long bars are PURINES (A, G: two rings); short bars are PYRIMIDINES (C, T, U: one ring). Every pair is one long + one short bar, so the helix keeps the same width.' + (raw.replace(/[^A-Z]/g, '') !== s ? '<br><i>Letters other than A, C, G and T were ignored.</i>' : '');
    }
  };

  /* A1.2.9 · How much information four bases can hold */
  M.seqdiv = {
    title: 'DNA sequence diversity: 4ⁿ possible sequences',
    html: function () { return '<div class="sim-c">' + slider('sn', 'Length of the sequence (n nucleotides)', 1, 40, 10) + '</div><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var n = +$(r, 'sn').value, big = Math.pow(4, n), txt = n <= 20 ? big.toLocaleString() : big.toExponential(2).replace('e+', ' × 10^');
      var cmp = n <= 5 ? 'fewer than the number of students in a school' : n <= 10 ? 'about the population of a large city' : n <= 16 ? 'more than the number of people on Earth' : n <= 27 ? 'more than the number of stars in our galaxy' : 'more than the number of grains of sand on all the beaches on Earth';
      r.querySelector('.sim-out').innerHTML = 'Possible sequences = 4<sup>' + n + '</sup> = <b>' + txt + '</b> (' + cmp + ').' +
        '<br>Each extra nucleotide multiplies the number of possibilities by 4. A gene of 1000 nucleotides could have 4<sup>1000</sup> sequences: in practice limitless. The human genome is about 3.2 × 10⁹ base pairs long.';
    }
  };

  /* A1.2.14 · Hershey and Chase (1952) */
  var HC = ['Phages are grown in bacteria given a radioactive isotope, so the isotope is built into the new phages.',
    'Labelled phages infect unlabelled E. coli and inject their genetic material.',
    'A blender shakes the empty protein coats off the outside of the bacteria.',
    'A centrifuge spins the mixture: the heavy bacteria form a PELLET at the bottom; the light phage coats stay in the liquid SUPERNATANT.',
    'Radioactivity is measured in the pellet and in the supernatant.'];
  M.hershey = {
    title: 'The Hershey–Chase experiment',
    html: function () { return '<div class="sim-c">' + select('hl', 'Radioactive label', [['p', 'Phosphorus-32 (labels DNA)'], ['s', 'Sulfur-35 (labels protein)']]) + slider('hs', 'Stage (1 to 5)', 1, 5, 1) + '</div><svg viewBox="0 0 400 170" role="img" aria-label="Experiment stage"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var p = $(r, 'hl').value === 'p', s = +$(r, 'hs').value, hot = '#f59e0b', g = '';
      function phage(x, y, coat, dna) { return '<polygon points="' + x + ',' + (y - 14) + ' ' + (x + 12) + ',' + (y - 7) + ' ' + (x + 12) + ',' + (y + 7) + ' ' + x + ',' + (y + 14) + ' ' + (x - 12) + ',' + (y + 7) + ' ' + (x - 12) + ',' + (y - 7) + '" fill="' + (dna ? '#fde68a' : '#fff') + '" stroke="' + coat + '" stroke-width="3"/><line x1="' + x + '" y1="' + (y + 14) + '" x2="' + x + '" y2="' + (y + 30) + '" stroke="' + coat + '" stroke-width="3"/>'; }
      var coat = p ? '#334155' : hot, dnaCol = p ? hot : '#94a3b8';
      if (s <= 2) { g += '<rect x="120" y="70" width="160" height="70" rx="35" fill="#e0f2fe" stroke="#0369a1" stroke-width="2"/>'; g += phage(160, s === 1 ? 30 : 40, coat, s === 1) + phage(240, s === 1 ? 30 : 40, coat, s === 1); if (s === 2) g += '<path d="M160 80 q10 20 30 15 M240 80 q-10 25 -30 20" stroke="' + dnaCol + '" stroke-width="4" fill="none"/>'; }
      if (s === 3) { g += '<rect x="120" y="70" width="160" height="70" rx="35" fill="#e0f2fe" stroke="#0369a1" stroke-width="2"/><path d="M160 90 q10 20 30 15 M240 90 q-10 25 -30 20" stroke="' + dnaCol + '" stroke-width="4" fill="none"/>' + phage(60, 40, coat, false) + phage(340, 50, coat, false) + '<text x="200" y="20" text-anchor="middle" font-size="12">Blender: coats knocked off</text>'; }
      if (s >= 4) { g += '<path d="M150 10 v120 q50 40 100 0 v-120" fill="#f8fafc" stroke="#334155" stroke-width="3"/><text x="75" y="60" text-anchor="middle" font-size="11">supernatant</text><text x="75" y="74" text-anchor="middle" font-size="11">(phage coats)</text><line x1="110" y1="64" x2="150" y2="64" stroke="#64748b"/>' + phage(180, 35, coat, false) + phage(220, 85, coat, false);
        g += '<ellipse cx="200" cy="140" rx="34" ry="12" fill="#bae6fd" stroke="#0369a1"/><text x="200" y="168" text-anchor="middle" font-size="11">pellet (bacteria)</text>';
        if (p) g += '<ellipse cx="200" cy="140" rx="34" ry="12" fill="' + hot + '" opacity=".7"/>'; }
      r.querySelector('svg').innerHTML = g;
      var res = s === 5 ? (p ? '<br><b>Result:</b> most radioactivity (P-32) is in the PELLET, inside the bacteria. DNA entered the cells. New phages made inside also contained some P-32.' : '<br><b>Result:</b> most radioactivity (S-35) is in the SUPERNATANT, with the empty coats. Protein did not enter the cells.') +
        '<br><b>Conclusion:</b> DNA, not protein, enters the bacterium and directs the making of new phages, so DNA is the genetic material. (P is in DNA but not protein; S is in protein (cysteine, methionine) but not DNA.)' : '';
      r.querySelector('.sim-out').innerHTML = '<b>Stage ' + s + '.</b> ' + HC[s - 1] + res + '<br><span class="small">Orange = radioactive.</span>';
    }
  };

  /* A1.2.15 · Chargaff's rules */
  M.chargaff = {
    title: "Chargaff's rules: base composition of DNA",
    html: function () { return '<div class="sim-c">' + slider('ca', 'Adenine (% of all bases)', 10, 40, 30) + select('cs', 'Type of DNA', [['ds', 'Double-stranded (most organisms)'], ['ss', 'Single-stranded (a few viruses, e.g. phage φX174)']]) + '</div><svg viewBox="0 0 400 120" role="img" aria-label="Base percentages"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var A = +$(r, 'ca').value, ds = $(r, 'cs').value === 'ds', T = ds ? A : 33 - A / 2, G = ds ? (100 - 2 * A) / 2 : 24, C = 100 - A - T - G;
      if (!ds) { T = Math.max(5, Math.round(33 - A / 3)); G = Math.round((100 - A - T) * 0.55); C = 100 - A - T - G; }
      var d = [['A', A, '#2563eb'], ['T', T, '#dc2626'], ['G', G, '#7c3aed'], ['C', C, '#15803d']], g = '';
      d.forEach(function (b, i) { var h = b[1] * 2; g += '<rect x="' + (40 + i * 90) + '" y="' + (100 - h) + '" width="60" height="' + h + '" fill="' + b[2] + '"/><text x="' + (70 + i * 90) + '" y="' + (95 - h) + '" text-anchor="middle" font-size="12">' + b[0] + ' ' + Math.round(b[1]) + '%</text>'; });
      r.querySelector('svg').innerHTML = g + '<line x1="30" y1="100" x2="390" y2="100" stroke="#334155"/>';
      var pu = A + G, py = T + C;
      r.querySelector('.sim-out').innerHTML = ds ? '<b>Double-stranded DNA:</b> A = T = ' + A + '%, G = C = ' + G + '%. Purines (A + G) = ' + pu + '% = pyrimidines (T + C) = ' + py + '%. The ratio A+G : T+C = 1.' +
        '<br>Why: every A is paired with a T and every G with a C, so the amounts must match. Chargaff measured this before the structure of DNA was known; it became key evidence for Watson and Crick\'s base pairing.'
        : '<b>Single-stranded DNA:</b> A ' + A + '%, T ' + T + '%, G ' + G + '%, C ' + C + '%. A ≠ T and G ≠ C, because the bases are not paired. Chargaff\'s rules apply only to double-stranded DNA.';
    }
  };

  /* A2.2.4–A2.2.9 · Compare cell types, including atypical eukaryotic cells */
  var CT = {
    // name, size, [cell wall, nucleus, mitochondria, chloroplasts, large permanent vacuole, centrioles, ribosomes, DNA form, nuclei per cell], note, drawing
    pro: ['Prokaryote (bacterium)', '1–5 µm', ['yes: peptidoglycan', 'no: nucleoid region, naked DNA', 'no', 'no', 'no', 'no', '70S', 'circular, naked + plasmids', '0'], 'No membrane-bound organelles. Some have a capsule, pili and flagella.', 'pro'],
    animal: ['Animal cell', '10–30 µm', ['no', 'yes', 'yes', 'no', 'no (small temporary vacuoles)', 'yes', '80S (70S in mitochondria)', 'linear, with histones', '1'], 'Irregular shape; stores glycogen; may have cilia or flagella.', 'animal'],
    plant: ['Plant cell', '10–100 µm', ['yes: cellulose', 'yes', 'yes', 'yes (in green tissues)', 'yes', 'no', '80S (70S in mitochondria and chloroplasts)', 'linear, with histones', '1'], 'Fixed, often box shape; stores starch.', 'plant'],
    fungus: ['Fungal cell (yeast)', '3–10 µm', ['yes: chitin', 'yes', 'yes', 'no', 'yes (often)', 'no', '80S', 'linear, with histones', '1'], 'Heterotroph; stores glycogen; no chloroplasts.', 'fungus'],
    muscle: ['Skeletal muscle fibre (atypical)', 'up to 300 mm long', ['no', 'yes: MANY', 'yes: very many', 'no', 'no', 'yes', '80S', 'linear, with histones', 'many (multinucleate)'], 'Formed when many cells FUSE; one long fibre with many nuclei and continuous cytoplasm. Challenges the idea that a cell has one nucleus.', 'muscle'],
    hypha: ['Aseptate fungal hypha (atypical)', 'long tubes, can be metres', ['yes: chitin', 'yes: MANY', 'yes', 'no', 'yes', 'no', '80S', 'linear, with histones', 'many'], 'No cross-walls (septa): a continuous tube of cytoplasm with many nuclei.', 'hypha'],
    rbc: ['Red blood cell, mammal (atypical)', '7–8 µm', ['no', 'no: lost as it matures', 'no', 'no', 'no', 'no', 'none when mature', 'none', '0'], 'Biconcave disc packed with haemoglobin; no nucleus gives more room for haemoglobin, but it cannot divide or repair itself (lives about 120 days).', 'rbc'],
    sieve: ['Phloem sieve tube element (atypical)', 'about 20 µm wide', ['yes: cellulose', 'no: lost as it matures', 'few', 'no', 'no', 'no', 'few', 'none', '0'], 'Very little cytoplasm; sieve plates join elements end to end. Depends on a companion cell next to it to stay alive.', 'sieve']
  };
  function drawCell(k) {
    var s = '';
    if (k === 'pro') s = '<rect x="110" y="40" width="180" height="90" rx="45" fill="#fef3c7" stroke="#92400e" stroke-width="5"/><rect x="104" y="34" width="192" height="102" rx="51" fill="none" stroke="#d97706" stroke-dasharray="4 4"/><path d="M150 85 q20 -25 40 0 t40 0 t20 -10" fill="none" stroke="#7c3aed" stroke-width="3"/><circle cx="250" cy="105" r="8" fill="none" stroke="#db2777" stroke-width="2.5"/><path d="M290 85 q30 -10 50 10 t40 5" fill="none" stroke="#475569" stroke-width="2"/>' + dots(140, 60, 120, 60);
    else if (k === 'animal') s = '<path d="M120 50 q80 -30 160 0 q30 40 0 80 q-80 30 -160 0 q-30 -40 0 -80z" fill="#fde4f1" stroke="#be185d" stroke-width="2.5"/><circle cx="200" cy="88" r="22" fill="#ede5ff" stroke="#6d28d9" stroke-width="2"/><ellipse cx="150" cy="70" rx="14" ry="7" fill="#fecaca" stroke="#b91c1c"/><ellipse cx="250" cy="110" rx="14" ry="7" fill="#fecaca" stroke="#b91c1c"/>' + dots(130, 60, 140, 60);
    else if (k === 'plant') s = '<rect x="110" y="30" width="180" height="110" fill="#dcfce7" stroke="#166534" stroke-width="6"/><rect x="150" y="50" width="100" height="70" rx="12" fill="#e0f2fe" stroke="#0369a1" stroke-width="1.5"/><circle cx="130" cy="60" r="14" fill="#ede5ff" stroke="#6d28d9" stroke-width="2"/>' + [[270, 55], [270, 115], [135, 120]].map(function (p) { return '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="11" ry="6" fill="#4ade80" stroke="#166534"/>'; }).join('');
    else if (k === 'fungus') s = '<ellipse cx="200" cy="85" rx="80" ry="55" fill="#fef9c3" stroke="#854d0e" stroke-width="5"/><circle cx="185" cy="80" r="16" fill="#ede5ff" stroke="#6d28d9" stroke-width="2"/><circle cx="225" cy="98" r="14" fill="#e0f2fe" stroke="#0369a1"/><ellipse cx="270" cy="60" rx="22" ry="16" fill="#fef9c3" stroke="#854d0e" stroke-width="4"/>';
    else if (k === 'muscle') { s = '<rect x="20" y="55" width="360" height="60" rx="12" fill="#fecdd3" stroke="#9f1239" stroke-width="2.5"/>'; for (var i = 30; i < 380; i += 8) s += '<line x1="' + i + '" y1="58" x2="' + i + '" y2="112" stroke="#f43f5e" stroke-width="' + (i % 16 ? 1 : 2.5) + '"/>'; [60, 140, 220, 300].forEach(function (x) { s += '<ellipse cx="' + x + '" cy="60" rx="14" ry="5" fill="#6d28d9"/>'; }); }
    else if (k === 'hypha') { s = '<path d="M20 85 h300 q40 0 60 -40" fill="none" stroke="#854d0e" stroke-width="40" stroke-linecap="round"/><path d="M20 85 h300 q40 0 60 -40" fill="none" stroke="#fef9c3" stroke-width="32" stroke-linecap="round"/>'; [50, 110, 170, 230, 290].forEach(function (x) { s += '<circle cx="' + x + '" cy="85" r="7" fill="#6d28d9"/>'; }); }
    else if (k === 'rbc') s = '<ellipse cx="200" cy="85" rx="70" ry="60" fill="#ef4444" stroke="#991b1b" stroke-width="3"/><ellipse cx="200" cy="85" rx="32" ry="27" fill="#fca5a5"/><text x="200" y="160" text-anchor="middle" font-size="12">biconcave disc, no nucleus</text>';
    else if (k === 'sieve') s = '<rect x="80" y="20" width="110" height="140" fill="#ecfccb" stroke="#3f6212" stroke-width="5"/><rect x="190" y="20" width="60" height="140" fill="#dcfce7" stroke="#3f6212" stroke-width="3"/><circle cx="220" cy="90" r="12" fill="#ede5ff" stroke="#6d28d9" stroke-width="2"/>' + [92, 112, 132, 152, 172].map(function (x) { return '<circle cx="' + x + '" cy="20" r="4" fill="#fff" stroke="#3f6212"/>'; }).join('') + '<text x="135" y="178" text-anchor="middle" font-size="11">sieve tube element</text><text x="220" y="178" text-anchor="middle" font-size="11">companion cell</text>';
    return s;
    function dots(x, y, w, h) { var d = ''; for (var j = 0; j < 14; j++) d += '<circle cx="' + (x + (j * 37) % w) + '" cy="' + (y + (j * 23) % h) + '" r="2" fill="#334155"/>'; return d; }
  }
  M.cellcompare = {
    title: 'Compare cells: prokaryote, plant, animal, fungus and atypical cells',
    html: function () { var o = Object.keys(CT).map(function (k) { return [k, CT[k][0]]; });
      return '<div class="sim-c">' + select('ca', 'Cell A', o) + select('cb', 'Cell B', o) + '</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><svg class="sa" viewBox="0 0 400 185" role="img" aria-label="Cell A"></svg><svg class="sb" viewBox="0 0 400 185" role="img" aria-label="Cell B"></svg></div><div class="sim-out" aria-live="polite" style="overflow-x:auto"></div>'; },
    run: function (r, first) {
      if (first) $(r, 'cb').value = 'plant';
      var ka = $(r, 'ca').value, kb = $(r, 'cb').value, a = CT[ka], b = CT[kb], rows = ['Cell wall', 'Nucleus', 'Mitochondria', 'Chloroplasts', 'Large permanent vacuole', 'Centrioles', 'Ribosomes', 'DNA', 'Nuclei per cell'];
      r.querySelector('.sa').innerHTML = drawCell(a[4]); r.querySelector('.sb').innerHTML = drawCell(b[4]);
      var h = '<table style="border-collapse:collapse;width:100%;font-size:.9rem"><tr><th></th><th style="text-align:left;padding:4px">' + E(a[0]) + '</th><th style="text-align:left;padding:4px">' + E(b[0]) + '</th></tr><tr style="border-top:1px solid #cbd5e1"><th style="text-align:left;padding:4px">Typical size</th><td style="padding:4px">' + E(a[1]) + '</td><td style="padding:4px">' + E(b[1]) + '</td></tr>';
      rows.forEach(function (n, i) { var x = a[2][i], y = b[2][i], diff = x !== y; h += '<tr style="border-top:1px solid #cbd5e1"><th style="text-align:left;padding:4px">' + n + '</th><td style="padding:4px' + (diff ? ';background:#fef9c3' : '') + '">' + E(x) + '</td><td style="padding:4px' + (diff ? ';background:#fef9c3' : '') + '">' + E(y) + '</td></tr>'; });
      r.querySelector('.sim-out').innerHTML = h + '</table><p style="margin:6px 0 0"><b>' + E(a[0]) + ':</b> ' + E(a[3]) + '<br><b>' + E(b[0]) + ':</b> ' + E(b[3]) + '</p><p class="small" style="margin:4px 0 0">Yellow = a difference. Drawings are simplified and not to scale.</p>';
    }
  };

  /* A2.2.12 · Endosymbiosis, step by step */
  var ENDO = ['A large anaerobic cell (an archaean-like host) with a nucleus and endomembranes, living alongside aerobic bacteria.',
    'Endocytosis: the host engulfs an aerobic bacterium in a vesicle, but does not digest it.',
    'The bacterium survives and respires aerobically inside the host, supplying ATP; the host supplies food and protection. Both benefit (mutualism).',
    'Over many generations, most of the bacterium\'s genes move to the host nucleus. It becomes a MITOCHONDRION: double membrane, own circular DNA, 70S ribosomes, divides by binary fission. All eukaryotes descend from this cell.',
    'Later, in one lineage, a cell with mitochondria engulfs a photosynthetic cyanobacterium.',
    'The cyanobacterium becomes a CHLOROPLAST with the same evidence: double membrane, circular DNA, 70S ribosomes, binary fission. This lineage gave rise to algae and plants.'];
  M.endosym = {
    title: 'Endosymbiosis: the origin of mitochondria and chloroplasts',
    html: function () { return '<div class="sim-c">' + slider('es', 'Stage (1 to 6)', 1, 6, 1) + '</div><svg viewBox="0 0 400 200" role="img" aria-label="Endosymbiosis stage"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var s = +$(r, 'es').value, g = '';
      g += '<ellipse cx="190" cy="105" rx="130" ry="85" fill="#fff7ed" stroke="#9a3412" stroke-width="3"/><circle cx="150" cy="100" r="28" fill="#ede5ff" stroke="#6d28d9" stroke-width="2"/><text x="150" y="104" text-anchor="middle" font-size="11">nucleus</text>';
      function bact(x, y, col, inside, label) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="26" ry="13" fill="' + col + '" stroke="#334155" stroke-width="2"/>' + (inside ? '<ellipse cx="' + x + '" cy="' + y + '" rx="31" ry="18" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="' + (inside === 2 ? '0' : '4 3') + '"/>' : '') + '<circle cx="' + (x - 6) + '" cy="' + y + '" r="5" fill="none" stroke="#dc2626" stroke-width="1.5"/>' + (label ? '<text x="' + x + '" y="' + (y + 32) + '" text-anchor="middle" font-size="11">' + label + '</text>' : ''); }
      if (s === 1) g += bact(355, 40, '#fecaca', 0, 'aerobic bacterium');
      if (s === 2) g += bact(290, 70, '#fecaca', 1, 'in a vesicle');
      if (s >= 3) g += bact(230, 65, '#fecaca', s >= 4 ? 2 : 1, s >= 4 ? 'mitochondrion' : 'respires: ATP');
      if (s >= 4) g += bact(240, 150, '#fecaca', 2, '');
      if (s === 5) g += bact(355, 160, '#86efac', 0, 'cyanobacterium');
      if (s === 6) g += bact(110, 160, '#86efac', 2, 'chloroplast');
      r.querySelector('svg').innerHTML = g;
      r.querySelector('.sim-out').innerHTML = '<b>Stage ' + s + '.</b> ' + E(ENDO[s - 1]) + (s >= 4 ? '<br><b>Evidence:</b> double membrane (the inner one from the bacterium, the outer from the vesicle) · own circular, naked DNA · 70S ribosomes · binary fission · DNA sequences most similar to bacteria.' : '') + '<br><span class="small">Red circle = circular DNA.</span>';
    }
  };

  /* A2.2.13 · Differentiation: same genome, different genes expressed */
  var GENES = ['Respiration enzymes', 'Ribosome proteins', 'Haemoglobin', 'Insulin', 'Myosin and actin', 'Keratin', 'Rhodopsin', 'Neurotransmitter enzymes', 'Antibody', 'Digestive enzymes'];
  var DIFF = { rbc: ['Red blood cell (as it develops)', [0, 1, 2]], beta: ['Beta cell, pancreas', [0, 1, 3]], muscle: ['Muscle cell', [0, 1, 4]], skin: ['Skin cell', [0, 1, 5]], rod: ['Rod cell, retina', [0, 1, 6]], neuron: ['Neurone', [0, 1, 7]], plasma: ['Plasma B cell', [0, 1, 8]], gut: ['Gland cell, stomach', [0, 1, 9]] };
  M.express = {
    title: 'Differentiation: same genome, different genes switched on',
    html: function () { return '<div class="sim-c">' + select('dc', 'Specialised cell', Object.keys(DIFF).map(function (k) { return [k, DIFF[k][0]]; })) + '</div><svg viewBox="0 0 400 72" role="img" aria-label="Genes in the genome"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var d = DIFF[$(r, 'dc').value], on = d[1], g = '<text x="4" y="14" font-size="12">The same DNA in every cell of the body:</text>';
      GENES.forEach(function (n, i) { var x = 4 + i * 39, yes = on.indexOf(i) >= 0; g += '<rect x="' + x + '" y="24" width="36" height="40" rx="5" fill="' + (yes ? '#22c55e' : '#e2e8f0') + '" stroke="#334155"/><text x="' + (x + 18) + '" y="50" text-anchor="middle" font-size="13" font-weight="700">' + (i + 1) + '</text>'; });

      r.querySelector('svg').innerHTML = g;
      r.querySelector('.sim-out').innerHTML = '<span style="color:#15803d">■</span> green = switched ON (expressed) in a ' + E(d[0].toLowerCase()) + '; grey = present but switched off.<br><b>Expressed:</b> ' + on.map(function (i) { return (i + 1) + '. ' + GENES[i]; }).join('; ') + '.<br>Genes 1 and 2 are "housekeeping" genes, needed by every cell. The specialised gene gives the cell its structure and function. ' +
        'Every cell has all ten genes: differentiation changes which genes are EXPRESSED, not which genes the cell has. Signals (for example its position in the embryo) decide the pattern.';
    }
  };

  /* A2.3.2 · Compare viruses: genome, capsid, envelope and host */
  var VIR = {
    lambda: ['Bacteriophage lambda', 'DNA', 'double-stranded', 'linear in the virion (closes into a circle in the host)', 'about 48 500 base pairs', 'icosahedral head and a long tail', 'not enveloped', 'the bacterium E. coli', 'about 60 nm head', 'Lytic or lysogenic: its DNA can join the bacterial chromosome as a prophage.'],
    sars2: ['SARS-CoV-2 (a coronavirus)', 'RNA', 'single-stranded, positive sense (can be read directly by ribosomes)', 'linear', 'about 30 000 bases, one of the largest RNA genomes', 'helical nucleocapsid', 'enveloped, with spike (S) glycoproteins', 'human cells with the ACE2 receptor', 'about 100 nm', 'Its RNA is translated straight away by host ribosomes to make viral proteins.'],
    hiv: ['HIV-1 (a retrovirus)', 'RNA', 'single-stranded, positive sense, two copies', 'linear', 'about 9 700 bases', 'cone-shaped capsid', 'enveloped, with gp120 and gp41 glycoproteins', 'CD4 (helper T) cells', 'about 120 nm', 'Reverse transcriptase copies its RNA into DNA, which integrase inserts into the host genome.'],
    flu: ['Influenza A virus', 'RNA', 'single-stranded, negative sense (must be copied to make mRNA)', 'segmented: 8 separate pieces', 'about 13 500 bases in total', 'helical nucleocapsids', 'enveloped, with haemagglutinin (H) and neuraminidase (N)', 'birds, pigs and humans', 'about 100 nm', 'Segments from two strains can be swapped in one cell (reassortment).'],
    tmv: ['Tobacco mosaic virus', 'RNA', 'single-stranded, positive sense', 'linear', 'about 6 400 bases', 'rigid helical rod', 'not enveloped', 'tobacco and other plants', '300 nm long, 18 nm wide', 'The first virus to be discovered (1890s).'],
    phix: ['Phage phiX174', 'DNA', 'single-stranded', 'circular', 'about 5 400 bases', 'icosahedral', 'not enveloped', 'the bacterium E. coli', 'about 30 nm', 'The first DNA genome ever sequenced (1977).'],
    adeno: ['Adenovirus', 'DNA', 'double-stranded', 'linear', 'about 36 000 base pairs', 'icosahedral, with fibres at the corners', 'not enveloped', 'human airway and eye cells', 'about 90 nm', 'A cause of colds; also used as a vector in some vaccines.']
  };
  M.viruscompare = {
    title: 'Compare viruses: genome, capsid and envelope',
    html: function () { return '<div class="sim-c">' + select('va', 'Virus A', Object.keys(VIR).map(function (k) { return [k, VIR[k][0]]; })) +
      select('vb', 'Virus B', Object.keys(VIR).map(function (k) { return [k, VIR[k][0]]; })) + '</div><div class="sim-out" aria-live="polite" style="overflow-x:auto"></div>'; },
    run: function (r, first) {
      if (first) $(r, 'vb').value = 'hiv';
      var a = VIR[$(r, 'va').value], b = VIR[$(r, 'vb').value], rows = ['Nucleic acid', 'Strands', 'Shape of genome', 'Genome size', 'Capsid', 'Envelope', 'Host', 'Size', 'Notable'];
      var h = '<table style="border-collapse:collapse;width:100%;font-size:.9rem"><tr><th style="text-align:left;padding:4px"></th><th style="text-align:left;padding:4px">' + E(a[0]) + '</th><th style="text-align:left;padding:4px">' + E(b[0]) + '</th></tr>';
      rows.forEach(function (n, i) { var same = a[i + 1] === b[i + 1]; h += '<tr style="border-top:1px solid #cbd5e1"><th style="text-align:left;padding:4px;vertical-align:top">' + n + '</th><td style="padding:4px' + (same ? '' : ';background:#fef9c3') + '">' + E(a[i + 1]) + '</td><td style="padding:4px' + (same ? '' : ';background:#fef9c3') + '">' + E(b[i + 1]) + '</td></tr>'; });
      r.querySelector('.sim-out').innerHTML = h + '</table><p style="margin:6px 0 0">Yellow cells are differences. What do ALL viruses share? A protein capsid, DNA or RNA, no cytoplasm and few or no enzymes of their own.</p>';
    }
  };

  /* A2.3.3 and A2.3.4 · Bacteriophage lambda: lytic and lysogenic cycles, step by step */
  var LYTIC = ['Attachment: the tail fibre binds a receptor protein on the outer membrane of E. coli.',
    'Injection: the phage injects its DNA through the tail. The empty capsid stays outside. The linear DNA closes into a circle.',
    'Replication and protein synthesis: the host\'s nucleotides, ATP, ribosomes and amino acids are used to copy the viral DNA and make capsid and tail proteins.',
    'Assembly: new heads are filled with copies of the viral DNA and tails are attached.',
    'Lysis: viral enzymes break down the cell wall; the cell bursts and releases about 100 new phages, which infect other cells. The host cell dies.'];
  var LYSO = ['Attachment: the tail fibre binds a receptor protein on the outer membrane of E. coli.',
    'Injection: the phage DNA enters the cell and closes into a circle.',
    'Integration: a viral enzyme (integrase) inserts the lambda DNA into the bacterial chromosome. It is now a PROPHAGE. A repressor protein keeps the lytic genes switched off.',
    'Cell division: whenever the bacterium divides, the prophage is copied with the chromosome, so every daughter cell carries it. No new phages are made and the cells live.',
    'Stays lysogenic: while conditions are good, the prophage is passed on silently, generation after generation.'];
  M.phage = {
    title: 'Bacteriophage lambda: lytic or lysogenic?',
    html: function () { return '<div class="sim-c">' + select('pp', 'Pathway after injection', [['lytic', 'Lytic cycle'], ['lyso', 'Lysogenic cycle']]) + slider('ps', 'Stage (1 to 5)', 1, 5, 1) +
      select('pc', 'Conditions for the host cell', [['good', 'Good conditions'], ['uv', 'Stress: UV light damages DNA']]) + '</div>' +
      '<svg viewBox="0 0 400 210" role="img" aria-label="Phage and bacterial cell"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var path = $(r, 'pp').value, s = +$(r, 'ps').value, uv = $(r, 'pc').value === 'uv', induced = path === 'lyso' && s === 5 && uv;
      function hexa(x, y, k) { var p = []; for (var i = 0; i < 6; i++) { var a = Math.PI / 3 * i - Math.PI / 2; p.push((x + k * Math.cos(a)).toFixed(1) + ',' + (y + k * Math.sin(a)).toFixed(1)); } return '<polygon points="' + p.join(' ') + '" fill="#fde68a" stroke="#b45309" stroke-width="1.5"/>'; }
      var burst = path === 'lytic' && s === 5, svg = '';
      svg += '<rect x="70" y="60" width="260" height="120" rx="60" fill="#e0f2fe" stroke="#0369a1" stroke-width="3"' + (burst ? ' stroke-dasharray="14 10"' : '') + '/>';
      svg += '<path d="M120 120 C 160 80, 240 160, 280 120" fill="none" stroke="#334155" stroke-width="4"/>';
      if (s <= 2) svg += hexa(200, 22, 16) + '<rect x="196" y="38" width="8" height="22" fill="#94a3b8"/>' + (s === 2 ? '<path d="M200 70 q 10 15 0 30" fill="none" stroke="#dc2626" stroke-width="3"/>' : '');
      if (path === 'lytic' && s === 3) for (var i = 0; i < 4; i++) svg += '<circle cx="' + (130 + i * 45) + '" cy="' + (95 + (i % 2) * 40) + '" r="10" fill="none" stroke="#dc2626" stroke-width="3"/>';
      if (path === 'lytic' && s >= 4) for (var j = 0; j < 7; j++) svg += hexa(s === 5 ? 40 + j * 54 : 110 + j * 30, s === 5 ? (j % 2 ? 30 : 195) : 100 + (j % 2) * 30, 10);
      if (path === 'lyso' && s >= 3 && !induced) svg += '<path d="M190 112 l 26 8" stroke="#dc2626" stroke-width="7"/>';
      if (induced) svg += '<circle cx="200" cy="150" r="12" fill="none" stroke="#dc2626" stroke-width="3"/>';
      if (path === 'lyso' && s >= 4 && !induced) svg += '<line x1="200" y1="62" x2="200" y2="178" stroke="#0369a1" stroke-width="3" stroke-dasharray="6 5"/>';
      if (induced) for (var k = 0; k < 4; k++) svg += hexa(120 + k * 50, 95 + (k % 2) * 35, 10);
      r.querySelector('svg').innerHTML = svg;
      var msg = path === 'lytic' ? LYTIC[s - 1] : induced ? 'INDUCTION: DNA damage (here from UV light) inactivates the repressor. The prophage is cut out of the chromosome and the lytic cycle begins: replication, assembly and lysis follow.' : LYSO[s - 1];
      r.querySelector('.sim-out').innerHTML = '<b>' + (path === 'lytic' ? 'Lytic' : 'Lysogenic') + ' cycle · stage ' + s + '.</b> ' + E(msg) +
        (path === 'lyso' && s === 5 && !uv ? '<br>Change the conditions to "Stress" to see induction.' : '') + '<br>A virus has no metabolism of its own: every stage after injection depends on the host cell.';
    }
  };

  /* A2.3.6 · Rapid evolution: drug resistance in a virus population */
  M.virevo = {
    title: 'Why do some viruses become drug resistant so quickly?',
    html: function () { return '<div class="sim-c">' + select('vt', 'Virus', [['rna', 'RNA virus, e.g. HIV (no proofreading)'], ['dna', 'DNA virus (proofreading)']]) +
      select('tx', 'Treatment', [['none', 'No treatment'], ['one', 'One antiviral drug'], ['three', 'Three drugs together (combination therapy)']]) + slider('dy', 'Days of treatment', 0, 60, 60) + '</div>' +
      '<svg viewBox="0 0 400 220" role="img" aria-label="Viral load against time"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var rna = $(r, 'vt').value === 'rna', tx = $(r, 'tx').value, d = +$(r, 'dy').value, N = 1e10, p = rna ? 3e-5 : 1e-11, k = tx === 'three' ? 3 : tx === 'one' ? 1 : 0;
      var expected = k ? N * Math.pow(p, k) : 0, prob = k ? 1 - Math.exp(-expected) : 0, escape = prob > 0.5;
      function load(t) { if (!k) return 6; var sens = 6 - t * 0.2; if (!escape) return Math.max(1, sens); var res = 1 + Math.max(0, t - 8) * 0.35; return Math.max(Math.max(1, sens), Math.min(6, res)); }
      var X = function (t) { return 45 + t * 5.6; }, Y = function (v) { return 190 - v * 28; }, pts = [];
      for (var t = 0; t <= d; t++) pts.push(X(t).toFixed(1) + ',' + Y(load(t)).toFixed(1));
      var s = '<line x1="45" y1="190" x2="385" y2="190" stroke="#334155"/><line x1="45" y1="20" x2="45" y2="190" stroke="#334155"/>' +
        '<text x="215" y="212" text-anchor="middle" font-size="12">Days of treatment</text><text x="14" y="105" font-size="12" transform="rotate(-90 14 105)" text-anchor="middle">Viral load (log scale)</text>' +
        (pts.length > 1 ? '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#e4572e" stroke-width="3"/>' : '');
      r.querySelector('svg').innerHTML = s;
      var fmt = function (v) { return v >= 1 ? Math.round(v).toLocaleString() : v.toExponential(1); };
      r.querySelector('.sim-out').innerHTML = !k ? '<b>No treatment: the viral load stays high.</b> About 10 billion new virus particles are made each day, ' + (rna ? 'and an error-prone polymerase makes about one mistake per genome copy, so a huge range of mutants already exists.' : 'with very few copying mistakes.')
        : '<b>Resistant mutants expected before treatment starts: about ' + fmt(expected) + '.</b> ' + (escape ? 'Resistance is almost certain: the drug kills the sensitive virus, the resistant mutants survive and multiply, and the viral load rises again (natural selection).'
          : 'Resistance is very unlikely: a single virus would need ' + (k === 3 ? 'three resistance mutations at once' : 'a rare resistance mutation') + ', and the drugs keep the viral load low.') +
        '<br>Reasons for rapid evolution: a high mutation rate (no proofreading in RNA polymerases and reverse transcriptase), a short generation time and enormous population sizes. This is why HIV is treated with three drugs at once.';
    }
  };

  /* A2.3.6 · Influenza: antigenic drift and shift against this year's vaccine */
  M.drift = {
    title: 'Influenza: does last year\'s vaccine still work?',
    html: function () { return '<div class="sim-c">' + slider('yr', 'Years since the vaccine was made', 0, 6, 1) + select('up', 'Vaccine policy', [['no', 'Keep the same vaccine'], ['yes', 'Update the vaccine every year']]) +
      select('sh', 'Event', [['drift', 'Normal year: antigenic drift'], ['shift', 'Antigenic shift: a new H subtype appears']]) + '</div>' +
      '<svg viewBox="0 0 400 120" role="img" aria-label="Vaccine match"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var y = +$(r, 'yr').value, up = $(r, 'up').value === 'yes', shift = $(r, 'sh').value === 'shift';
      var age = up ? Math.min(y, 1) * 0.5 : y, match = shift ? 5 : Math.round(100 * Math.exp(-0.32 * age)), aa = Math.round((up ? 0 : y) * 4 + (y ? 2 : 0));
      r.querySelector('svg').innerHTML = '<rect x="20" y="40" width="360" height="30" fill="#f1f5f9" stroke="#cbd5e1"/><rect x="20" y="40" width="' + (3.6 * match) + '" height="30" fill="' + (match > 60 ? '#15803d' : match > 30 ? '#d97706' : '#b91c1c') + '"/>' +
        '<text x="20" y="30" font-size="12">How well antibodies from the vaccine match the virus</text><text x="20" y="92" font-size="13" font-weight="700">' + match + '% match</text>';
      r.querySelector('.sim-out').innerHTML = shift ? '<b>Antigenic shift:</b> two different strains infected the same cell (for example in a pig) and swapped RNA segments (reassortment). The new virus has a haemagglutinin the population has never met, so old vaccines and immunity barely work. This is how flu pandemics start.'
        : '<b>Antigenic drift:</b> about ' + aa + ' amino acids in haemagglutinin and neuraminidase have changed by point mutation. ' + (up ? 'Because the vaccine is updated every year to match the strains in circulation, the match stays high.' : 'Without an update, antibodies fit the changed surface proteins less well each year, so the vaccine protects less.') +
          '<br>That is why the WHO recommends new flu vaccine strains twice a year (once for each hemisphere).';
    }
  };

  function mount(el) {
    if (el.getAttribute('data-mounted')) return;
    var name = el.getAttribute('data-sim'), m = M[name]; if (!m) return;
    css(); el.setAttribute('data-mounted', '1');
    var cap = el.getAttribute('data-caption') || '';
    el.innerHTML = '<div class="sim-h"><b>🧪 Simulation: ' + E(m.title) + '</b></div>' + (cap ? '<p class="sim-cap">' + E(cap) + '</p>' : '') + m.html() +
      '<div class="sim-run-row"><button type="button" class="sim-run">▶ Run simulation</button><span class="sim-hint">Change a control, or press Run to run it again.</span></div>';
    var first = true, upd = function (why) { try { m.run(el, first, why === 'run'); } finally { first = false; } };
    // each slider shows its current value next to it
    el.querySelectorAll('input[type=range]').forEach(function (s) {
      var v = document.createElement('output'); v.className = 'sim-val'; s.insertAdjacentElement('afterend', v);
      var show = function () { v.textContent = s.value; }; s.addEventListener('input', show); s.addEventListener('change', show); s._show = show; show();
    });
    el.querySelectorAll('input,select').forEach(function (c) { c.addEventListener('input', upd); c.addEventListener('change', upd); });
    var btn = el.querySelector('.sim-run'), hint = el.querySelector('.sim-hint'), busy = false, runs = 0;
    function flash() {   // show clearly that the model has just run
      runs++; el.classList.remove('sim-flash'); void el.offsetWidth; el.classList.add('sim-flash');
      var out = el.querySelector('.sim-out'); if (out) { out.setAttribute('tabindex', '-1'); }
      hint.textContent = '✓ Ran ' + (runs === 1 ? 'once' : runs + ' times') + '. Change a control and press Run again to compare.';
    }
    btn.addEventListener('click', function () {
      if (busy) return;
      var sl = el.querySelector('input[type=range]');
      // models that take a new measurement on each run (they use the third argument) just run once
      if (m.run.length >= 3 || !sl) { upd('run'); flash(); return; }
      // otherwise animate: sweep the first slider from its lowest value up to the chosen one, step by step
      var min = +sl.min, max = +sl.max, st = +sl.step || 1, target = +sl.value, end = target > min ? target : max;
      var n = Math.round((end - min) / st), stride = Math.max(1, Math.ceil(n / 24)), vals = [];
      for (var k = 0; k <= n; k += stride) vals.push(Math.round((min + k * st) * 1e6) / 1e6);
      if (vals[vals.length - 1] !== end) vals.push(end);
      if (end !== target) vals.push(target);
      busy = true; btn.disabled = true; btn.textContent = '⏳ Running…'; el.classList.add('sim-busy');
      var i = 0, tick = function () {
        sl.value = vals[i]; if (sl._show) sl._show();
        try { m.run(el, false, false); } catch (e) {}
        i++;
        if (i < vals.length) setTimeout(tick, vals.length > 12 ? 90 : 220);
        else { busy = false; btn.disabled = false; btn.textContent = '▶ Run simulation'; el.classList.remove('sim-busy'); upd('run'); flash(); }
      };
      tick();
    });
    upd();
  }
  function all() { document.querySelectorAll('[data-sim]').forEach(mount); }
  window.BVSim = { mount: mount, models: Object.keys(M) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all); else all();
  window.addEventListener('load', all);
  setInterval(all, 1500);   // lesson pages are re-written after the password unlocks; re-mount their simulations
})();
