/* Simulations inside interactive lessons · BioScience Vista (by George Apidi)
   Each <div class="card sim" data-sim="NAME"> is filled with a small model students can change.
   Every control has a label, and every result is also written as text, so it works with a keyboard and screen reader. */
(function () {
  var M = {}, CSS = false;
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function css() {
    if (CSS) return; CSS = true;
    var s = document.createElement('style');
    s.textContent = '.sim{display:grid;gap:10px}.sim .sim-h{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.sim .sim-h b{font-size:1rem}' +
      '.sim .sim-c{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));align-items:end}' +
      '.sim label{display:grid;gap:4px;font-size:.9rem}.sim select,.sim input[type=text]{padding:6px;border-radius:8px;border:1px solid #cbd5e1;font:inherit}' +
      '.sim .sim-out{background:#f1f5f9;border-radius:10px;padding:10px;font-size:.95rem}.sim svg{width:100%;height:auto;max-height:340px}.sim .sim-cap{font-size:.85rem;color:#475569;margin:0}';
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

  /* 6 · DNA fragments on a gel */
  M.gel = {
    title: 'Gel electrophoresis: fragments separate by size',
    html: function () { return '<label for="l1">Ladder (bp, comma separated)<input id="l1" type="text" value="10000, 5000, 2000, 1000, 500, 250" autocomplete="off"></label>' +
      '<label for="l2">Sample A (bp)<input id="l2" type="text" value="4000, 1500, 600" autocomplete="off"></label>' +
      '<label for="l3">Sample B (bp)<input id="l3" type="text" value="4000, 2000, 250" autocomplete="off"></label>' +
      '<svg viewBox="0 0 400 260" role="img" aria-label="Gel with DNA bands"></svg><div class="sim-out" aria-live="polite"></div>'; },
    run: function (r) {
      var lanes = [$(r, 'l1').value, $(r, 'l2').value, $(r, 'l3').value].map(function (t) { return t.split(',').map(function (x) { return +x.trim(); }).filter(function (x) { return x > 0; }); });
      var names = ['Ladder', 'Sample A', 'Sample B'], svg = '<rect x="20" y="20" width="360" height="220" fill="#0f172a" rx="6"/>';
      function y(bp) { return 30 + (4 - Math.log10(Math.max(bp, 10))) * 55; }   // log scale: bigger fragments stay near the wells
      lanes.forEach(function (bands, li) {
        var x = 70 + li * 110;
        svg += '<text x="' + x + '" y="252" text-anchor="middle" font-size="12">' + names[li] + '</text><rect x="' + (x - 22) + '" y="22" width="44" height="6" fill="#64748b"/>';
        bands.forEach(function (bp) { svg += '<rect x="' + (x - 20) + '" y="' + (y(bp) - 3).toFixed(1) + '" width="40" height="6" fill="' + (li === 0 ? '#e2e8f0' : '#fbbf24') + '"/><text x="' + (x + 26) + '" y="' + (y(bp) + 4).toFixed(1) + '" font-size="9" fill="#cbd5e1">' + bp + '</text>'; });
      });
      r.querySelector('svg').innerHTML = svg;
      r.querySelector('.sim-out').innerHTML = 'Smaller fragments move further down the gel, because they pass through the gel more easily. Compare Sample A and Sample B with the ladder: the bands that line up have the same length. A band in Sample A that does not line up with Sample B shows the two people differ at that position.';
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

  function mount(el) {
    if (el.getAttribute('data-mounted')) return;
    var name = el.getAttribute('data-sim'), m = M[name]; if (!m) return;
    css(); el.setAttribute('data-mounted', '1');
    var cap = el.getAttribute('data-caption') || '';
    el.innerHTML = '<div class="sim-h"><b>🧪 Simulation: ' + E(m.title) + '</b></div>' + (cap ? '<p class="sim-cap">' + E(cap) + '</p>' : '') + m.html();
    var first = true, upd = function () { try { m.run(el, first); } finally { first = false; } };
    el.querySelectorAll('input,select').forEach(function (c) { c.addEventListener('input', upd); c.addEventListener('change', upd); });
    upd();
  }
  function all() { document.querySelectorAll('[data-sim]').forEach(mount); }
  window.BVSim = { mount: mount, models: Object.keys(M) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all); else all();
  window.addEventListener('load', all);
  setInterval(all, 1500);   // lesson pages are re-written after the password unlocks; re-mount their simulations
})();
