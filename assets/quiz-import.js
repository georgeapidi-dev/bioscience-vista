/* BioScience Vista · quiz tools: read PDF / Word files, find questions, read mark schemes, suggest marks, question editor cards.
   Everything runs in the teacher's browser; files are never uploaded anywhere. */
(function () {
  var Q = window.BVQ = {};
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var loading = {};
  function need(src) {   // one shared promise per library, so two files read at once both wait for it
    return loading[src] || (loading[src] = new Promise(function (ok, bad) {
      var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { delete loading[src]; bad(new Error('Could not load ' + src)); }; document.head.appendChild(s);
    }));
  }

  /* ---------- 1. read a file into lines of text ---------- */
  /* pictures found in files are kept here; the text holds a [[img:N]] marker where each one belongs */
  Q.IMGS = [];
  function keepImg(url) { Q.IMGS.push(url); return '[[img:' + (Q.IMGS.length - 1) + ']]'; }
  function shrink(blob, max) {   // any picture → JPEG data URL no wider than max px (keeps lessons small)
    return new Promise(function (ok, bad) {
      var u = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { var k = Math.min(1, (max || 1000) / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); ok(c.toDataURL('image/jpeg', 0.82)); };
      im.onerror = function () { URL.revokeObjectURL(u); bad(new Error('This picture could not be opened. Try saving it as JPG or PNG.')); };
      im.src = u;
    });
  }
  function zip(file) { return need('/assets/jszip.min.js').then(function () { return file.arrayBuffer(); }).then(function (b) { return window.JSZip.loadAsync(b); }); }
  function xml(t) { return new DOMParser().parseFromString(t, 'application/xml'); }
  function byTag(doc, tag) { var all = doc.getElementsByTagName('*'), out = []; for (var i = 0; i < all.length; i++) if (all[i].localName === tag) out.push(all[i]); return out; }
  function num(a, b) { return (+(/(\d+)\.xml$/.exec(a) || [0, 0])[1]) - (+(/(\d+)\.xml$/.exec(b) || [0, 0])[1]); }

  /* ---------- 1. read a file into lines of text (pictures become [[img:N]] lines) ---------- */
  Q.readFile = function (file) {
    var name = (file.name || '').toLowerCase(), ext = (/\.([a-z0-9]+)$/.exec(name) || [0, ''])[1], type = file.type || '';
    if (ext === 'pdf' || type === 'application/pdf') return readPdf(file);
    if (ext === 'docx' || ext === 'dotx') return readDocx(file);
    if (ext === 'pptx' || ext === 'potx' || ext === 'ppsx') return readPptx(file);
    if (ext === 'xlsx' || ext === 'xlsm') return readXlsx(file);
    if (ext === 'odt' || ext === 'odp' || ext === 'ods') return readOdf(file);
    if (ext === 'csv' || ext === 'tsv') return file.text().then(function (t) { return clean(t.split(/\r?\n/).map(function (l) { return l.split(ext === 'tsv' ? '\t' : /,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(function (c) { return c.replace(/^"|"$/g, '').trim(); }).filter(Boolean).join(' | '); })); });
    if (ext === 'html' || ext === 'htm') return file.text().then(readHtml);
    if (ext === 'rtf') return file.text().then(function (t) { return clean(t.replace(/\\par[d]?/g, '\n').replace(/\{\\\*[^{}]*\}|\\[a-z]+-?\d* ?|[{}]/gi, '').split(/\r?\n/)); });
    if (/^image\//.test(type) || /^(png|jpe?g|gif|webp|bmp|svg|heic|avif)$/.test(ext))
      return shrink(file, 1200).then(function (u) { return [keepImg(u)]; });
    if (/^(video|audio)\//.test(type) || /^(mp4|mov|avi|mkv|webm|mp3|wav|m4a|ogg)$/.test(ext))
      return Promise.reject(new Error('Videos and sound files cannot be turned into text. Upload the video to YouTube and paste its link into the objectives box (or into the Explore step after building); it will play inside the lesson.'));
    if (ext === 'doc' || ext === 'ppt' || ext === 'xls')
      return Promise.reject(new Error('Old .' + ext + ' files cannot be read. Open it and choose File → Save As → ' + ({ doc: 'Word Document (.docx)', ppt: 'PowerPoint Presentation (.pptx)', xls: 'Excel Workbook (.xlsx)' })[ext] + ', then upload that.'));
    if (/\.(zip|exe|dmg|apk|iso|rar|7z)$/.test(name)) return Promise.reject(new Error('This kind of file cannot be turned into a lesson. Upload a document, presentation, spreadsheet, web page, text file or picture.'));
    return file.text().then(function (t) {   // anything else: use it if it is readable text
      var bad = (t.slice(0, 4000).match(/[\u0000-\u0008\u000e-\u001f�]/g) || []).length;
      if (bad > 20 || !t.trim()) throw new Error('This file is not a document the site can read. Upload a PDF, Word, PowerPoint, Excel, web page, text file or picture.');
      return clean(t.split(/\r?\n/));
    });
  };
  function readHtml(t) {
    var d = new DOMParser().parseFromString(t, 'text/html'), out = [];
    d.querySelectorAll('script,style,nav,footer,noscript').forEach(function (e) { e.remove(); });
    d.body && d.body.querySelectorAll('h1,h2,h3,h4,p,li,td,th,img,pre,blockquote').forEach(function (e) {
      if (e.tagName === 'IMG') { var src = e.getAttribute('src') || ''; if (/^(https?:|data:image)/.test(src)) out.push(keepImg(src)); return; }
      if (e.closest('li,td,th,p') && e.closest('li,td,th,p') !== e) return;
      var tx = e.textContent.replace(/\s+/g, ' ').trim(); if (!tx) return;
      out.push(/^H[1-4]$/.test(e.tagName) ? '**' + tx + '**' : (e.tagName === 'LI' ? '• ' : '') + tx);
    });
    return clean(out.length ? out : (d.body ? d.body.textContent : t).split(/\n/));
  }
  function readPptx(file) {   // one block per slide: title in bold, bullet text, then the slide's first picture
    return zip(file).then(function (z) {
      var slides = Object.keys(z.files).filter(function (n) { return /^ppt\/slides\/slide\d+\.xml$/.test(n); }).sort(num);
      if (!slides.length) throw new Error('No slides found in this presentation.');
      return Promise.all(slides.map(function (n) {
        var rel = n.replace('slides/', 'slides/_rels/') + '.rels';
        return Promise.all([z.file(n).async('string'), z.file(rel) ? z.file(rel).async('string') : '']).then(function (x) {
          var doc = xml(x[0]), paras = byTag(doc, 'p').map(function (p) { return byTag(p, 't').map(function (t) { return t.textContent; }).join('').trim(); }).filter(Boolean);
          var pic = byTag(doc, 'blip')[0], rid = pic && (pic.getAttribute('r:embed') || pic.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed')), target = null;
          if (rid && x[1]) { var r = byTag(xml(x[1]), 'Relationship').filter(function (e) { return e.getAttribute('Id') === rid; })[0]; if (r) target = 'ppt/' + r.getAttribute('Target').replace(/^\.\.\//, ''); }
          var media = target && z.file(target) && /\.(png|jpe?g|gif|bmp|webp)$/i.test(target) ? z.file(target).async('blob').then(function (b) { return shrink(b, 1000).catch(function () { return null; }); }) : Promise.resolve(null);
          var nr = x[1] ? byTag(xml(x[1]), 'Relationship').filter(function (e) { return /notesSlide$/.test(e.getAttribute('Type') || ''); })[0] : null, np = nr && 'ppt/' + nr.getAttribute('Target').replace(/^\.\.\//, '');
          var notes = np && z.file(np) ? z.file(np).async('string').then(function (t) { return byTag(xml(t), 'p').map(function (p) { return byTag(p, 't').map(function (e) { return e.textContent; }).join('').trim(); }).filter(function (t) { return t && !/^\d+$/.test(t); }); }) : Promise.resolve([]);   // speaker notes
          return Promise.all([media, notes]).then(function (y) { return { paras: paras, img: y[0], notes: y[1] }; });
        });
      })).then(function (all) {
        var lines = [];
        all.forEach(function (sl, i) {
          if (!sl.paras.length && !sl.img && !(sl.notes || []).length) return;
          lines.push('**Slide ' + (i + 1) + (sl.paras[0] ? ': ' + sl.paras[0] : '') + '**');
          sl.paras.slice(1).forEach(function (t) { lines.push(/^[•\-–]/.test(t) || /^\d+[\.\)]\s/.test(t) ? t : '• ' + t); });
          if (sl.img) lines.push(keepImg(sl.img));
          (sl.notes || []).forEach(function (t) { lines.push('Note: ' + t); });
        });
        return clean(lines);
      });
    });
  }
  function readXlsx(file) {
    return zip(file).then(function (z) {
      var sheets = Object.keys(z.files).filter(function (n) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(n); }).sort(num);
      return Promise.all([z.file('xl/sharedStrings.xml') ? z.file('xl/sharedStrings.xml').async('string') : ''].concat(sheets.map(function (n) { return z.file(n).async('string'); }))).then(function (x) {
        var shared = x[0] ? byTag(xml(x[0]), 'si').map(function (si) { return byTag(si, 't').map(function (t) { return t.textContent; }).join(''); }) : [], lines = [];
        x.slice(1).forEach(function (sx, k) {
          if (sheets.length > 1) lines.push('**Sheet ' + (k + 1) + '**');
          byTag(xml(sx), 'row').forEach(function (row) {
            var cells = byTag(row, 'c').map(function (c) { var v = byTag(c, 'v')[0], is = byTag(c, 't')[0], t = c.getAttribute('t');
              return t === 's' && v ? shared[+v.textContent] || '' : t === 'inlineStr' && is ? is.textContent : v ? v.textContent : ''; }).filter(function (v) { return String(v).trim(); });
            if (cells.length) lines.push(cells.join(' | '));
          });
        });
        return clean(lines);
      });
    });
  }
  function readOdf(file) {
    return zip(file).then(function (z) { if (!z.file('content.xml')) throw new Error('This OpenDocument file could not be read.'); return z.file('content.xml').async('string'); }).then(function (t) {
      var d = xml(t), out = [];
      byTag(d, 'h').concat(byTag(d, 'p')).sort(function (a, b) { return a.compareDocumentPosition(b) & 2 ? 1 : -1; }).forEach(function (e) {
        if (e.parentNode && e.parentNode.localName === 'p') return; var tx = e.textContent.replace(/\s+/g, ' ').trim(); if (tx) out.push(e.localName === 'h' ? '**' + tx + '**' : tx); });
      return clean(out);
    });
  }
  function readPdf(file) {
    return need('/assets/pdf.min.js').then(function () {
      var lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.js';
      return file.arrayBuffer().then(function (buf) { return lib.getDocument({ data: buf }).promise; });
    }).then(function (pdf) {
      var pages = []; for (var i = 1; i <= pdf.numPages; i++) pages.push(i);
      return Promise.all(pages.map(function (n) { return pdf.getPage(n).then(function (p) { return p.getTextContent(); }); })).then(function (contents) {
        var lines = [];
        contents.forEach(function (c) {
          // group text pieces that share a baseline into one line, top to bottom, left to right
          var rows = [];
          c.items.forEach(function (it) { if (!it.str || !it.str.trim()) return; var y = it.transform[5], x = it.transform[4];
            var row = rows.filter(function (r) { return Math.abs(r.y - y) < 3; })[0]; if (!row) { row = { y: y, bits: [] }; rows.push(row); } row.bits.push({ x: x, s: it.str }); });
          rows.sort(function (a, b) { return b.y - a.y; }).forEach(function (r) { lines.push(r.bits.sort(function (a, b) { return a.x - b.x; }).map(function (b) { return b.s; }).join(' ')); });
        });
        var out = clean(lines);
        if (out.join('').length >= 40) return out;
        // scanned PDF (pictures only): show the first pages as pictures in the lesson
        var pg = []; for (var j = 1; j <= Math.min(pdf.numPages, 8); j++) pg.push(j);
        return Promise.all(pg.map(function (n) { return pdf.getPage(n).then(function (page) { var vp = page.getViewport({ scale: 1.4 }), c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
          return page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(function () { return new Promise(function (ok) { c.toBlob(ok, 'image/jpeg', 0.85); }); }).then(function (b) { return shrink(b, 1100); }); }); }))
          .then(function (urls) { return urls.map(function (u, i) { return ['**Page ' + (i + 1) + '**', keepImg(u)]; }).reduce(function (a, b) { return a.concat(b); }, []); });
      });
    });
  }
  function readDocx(file) {
    // Word's automatic numbering is not part of the text, so rebuild it from each paragraph's list level and style
    var paras = [];
    function text(el) { return (el.children || []).map(function (c) { return c.type === 'text' ? c.value : c.type === 'tab' ? ' ' : c.type === 'break' ? ' ' : text(c); }).join(''); }
    function collect(el) { (el.children || []).forEach(function (c) { if (c.type === 'paragraph') paras.push({ text: text(c), style: c.styleName || '', num: c.numbering }); else collect(c); }); }
    return need('/assets/mammoth.browser.min.js').then(function () { return file.arrayBuffer(); })
      .then(function (buf) { return window.mammoth.convertToHtml({ arrayBuffer: buf }, { transformDocument: function (d) { collect(d); return d; } }); })
      .then(function () {
        var lines = [], qn = 0, sub = 0, roman = 0, ROM = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii'];
        paras.forEach(function (p) {
          var t = p.text.replace(/\s+/g, ' ').trim(); if (!t) return;
          var typedQ = /^(?:(?:question|q)\s*)?(\d{1,3})\s*[\.\):]?\s/i.exec(t), typedItem = /^\(?[a-hA-H][\.\)]\s/.test(t);
          if (typedQ) { qn = +typedQ[1]; sub = 0; roman = 0; lines.push(t); return; }
          if (typedItem) { lines.push(t); return; }
          if (!p.num) { lines.push(t); return; }
          var lvl = parseInt(p.num.level, 10) || 0;
          if (lvl === 0 && /\b2$|\b3$/.test(p.style)) lvl = /3$/.test(p.style) ? 2 : 1;      // "List Number 2" styles
          if (!p.num.isOrdered) { lines.push(t); return; }
          if (lvl === 0) { qn++; sub = 0; roman = 0; lines.push(qn + '. ' + t); }
          else if (lvl === 1) { lines.push('(' + 'abcdefghij'[sub++] + ') ' + t); roman = 0; }
          else lines.push('(' + ROM[roman++] + ') ' + t);
        });
        return clean(lines);
      });
  }
  function clean(lines) {
    return lines.map(function (l) { return String(l).replace(/[ \t]+/g, ' ').replace(/\s{2,}/g, ' ').trim(); })
      .filter(function (l) {
        return l && !/^[\._…\-–—\s]{3,}$/.test(l) && !/^(page \d+( of \d+)?|\d+ ?\/ ?\d+|turn over|\[?turn over\]?|blank page|end of (question )?paper|©.*|\d{1,3})$/i.test(l);
      })
      .map(function (l) { return l.replace(/\s*[\._…]{4,}\s*/g, ' ').trim(); }).filter(Boolean);
  }

  /* ---------- 2. find questions in the paper ---------- */
  var MARKS = /\s*[\[\(]\s*(\d{1,2})\s*(?:marks?)?\s*[\]\)]\s*\.?\s*$/i;
  var QSTART = /^(?:(?:question|q)\s*)?(\d{1,3})\s*(?:[\.\):]\s+|\s+(?=\(?[a-hA-H][\.\)]\s)|\s*$)(.*)$/i;
  var ITEM = /^\(?([a-hA-H]|i{1,3}|iv|v|vi{1,3}|ix|x)[\.\)]\s+(.*)$/;
  var ANSWER = /^(?:answer|ans|correct answer|key)\s*[:\-–]\s*(.+)$/i;
  var ROMAN = /^(i{1,3}|iv|v|vi{1,3}|ix|x)$/;
  Q.clean = clean;
  Q.parsePaper = function (lines) {
    lines = clean(lines); var qs = [], cur = null, last = 0;
    lines.forEach(function (line) {
      var m = QSTART.exec(line);
      if (m && (+m[1] === last + 1 || (!cur && +m[1] <= 3)) && !/^\d+\s*(cm|mm|m|g|kg|s|%|°)/i.test(line.slice(m[1].length).trim())) {
        cur = { num: +m[1], stem: [], items: [], answer: null }; qs.push(cur); last = +m[1];
        var first = m[2] && ITEM.exec(m[2]); if (first) cur.items.push({ label: first[1], text: [first[2]] }); else if (m[2]) cur.stem.push(m[2]);
        return;
      }
      if (!cur) return;   // cover page, instructions
      var a = ANSWER.exec(line); if (a) { (cur.items.length ? cur.items[cur.items.length - 1] : cur).answer = a[1].trim(); return; }
      var o = ITEM.exec(line);
      if (o) { cur.items.push({ label: o[1], text: [o[2]] }); return; }
      if (cur.items.length) cur.items[cur.items.length - 1].text.push(line); else cur.stem.push(line);
    });
    var out = [];
    qs.forEach(function (q) {
      var stem = q.stem.join(' ').trim(), sm = MARKS.exec(stem), items = q.items.map(function (it) { var t = it.text.join(' ').trim(), mm = MARKS.exec(t); return { label: it.label, text: mm ? t.replace(MARKS, '') : t, marks: mm ? +mm[1] : null, answer: it.answer }; });
      if (sm) stem = stem.replace(MARKS, '');
      var letters = items.filter(function (it) { return !ROMAN.test(it.label) || it.label === 'i' && items.length < 9; });
      var looksLikeOptions = items.length >= 2 && items.length <= 6 && items.every(function (it) { return it.marks == null && it.text.length < 160; }) &&
        items.every(function (it, k) { return it.label.toLowerCase() === 'abcdef'[k]; }) && (/[A-E]/.test(items[0].label) || items.every(function (it) { return it.text.length < 70 && !/\?$/.test(it.text); }));
      if (!items.length || looksLikeOptions) {
        var opts = items.map(function (it) { return it.text; }), correct = -1, ans = q.answer;
        if (ans) { var L = /^\(?([A-Fa-f])\)?\b/.exec(ans); if (L && opts.length) correct = 'abcdef'.indexOf(L[1].toLowerCase()); }
        var tf = opts.length === 2 && /^true$/i.test(opts[0]) && /^false$/i.test(opts[1]);
        out.push({ ref: String(q.num), kind: opts.length ? (tf ? 'tf' : 'mcq') : 'short', prompt: stem, options: opts, correct: correct, marks: sm ? +sm[1] : opts.length ? 1 : 2,
          scheme: !opts.length && ans ? ans : '', rubric: '', explanation: '', image: '' });
        return;
      }
      // structured question: each lettered part (and roman sub-part) becomes its own question
      var parent = '', first = true;
      items.forEach(function (it) {
        var roman = ROMAN.test(it.label) && parent && !(it.label === 'i' && parent === 'h');
        if (!roman) parent = it.label.toLowerCase();
        var ref = q.num + '(' + parent + ')' + (roman ? '(' + it.label + ')' : '');
        if (!roman && items.some(function (x) { return x !== it && ROMAN.test(x.label); }) && it.marks == null && items[items.indexOf(it) + 1] && ROMAN.test(items[items.indexOf(it) + 1].label)) { stem = (stem ? stem + '\n' : '') + '(' + parent + ') ' + it.text; return; }
        out.push({ ref: ref, kind: 'short', prompt: (first && stem ? stem + '\n\n' : '') + it.text, options: [], correct: -1, marks: it.marks || 1, scheme: it.answer || '', rubric: '', explanation: '', image: '' });
        first = false;
      });
    });
    return out;
  };

  /* ---------- 3. read a mark scheme and attach it ---------- */
  function key(num, part, sub) { return String(+num) + (part ? '(' + part.toLowerCase() + ')' : '') + (sub ? '(' + sub.toLowerCase() + ')' : ''); }
  Q.parseScheme = function (lines) {
    var map = {}, curKey = null;
    var joined = [];   // table cells read one per line: "1", "B" → "1 B" (before clean() drops lone numbers)
    lines.forEach(function (l, i) { var prev = joined[joined.length - 1]; if (prev != null && /^\d{1,3}\s*[\.\)]?$/.test(prev) && /^\(?[A-Fa-f]\)?\.?$/.test(l.trim())) joined[joined.length - 1] = prev.replace(/[\.\)]$/, '') + ' ' + l.trim().replace(/[()\.]/g, '').toUpperCase(); else joined.push(l); });
    lines = clean(joined.map(function (l) { return String(l).trim(); }).filter(Boolean));
    var REF = /^(?:(?:question|q)\s*)?(\d{1,3})\s*[\.\)]?\s*(?:\(?([a-h])\))?\s*(?:\(?((?:i{1,3}|iv|v|vi{1,3}))\))?\s*[\.\):\-–]?\s+(.*)$/i;
    var SUB = /^\(?([a-h])\)\s+(.*)$|^\(?((?:i{1,3}|iv|v|vi{1,3}))\)\s+(.*)$/i;
    var lastNum = null, lastPart = null;
    lines.forEach(function (line) {
      // answer grids such as "1 B 2 C 3 A" or "1. B  2. D"
      if (/^(\s*\d{1,3}\s*[\.\)]?\s*[A-E]\b[\s,;]*){2,}$/.test(line)) {
        line.replace(/(\d{1,3})\s*[\.\)]?\s*([A-E])\b/g, function (_, n, l) { map[key(n)] = (map[key(n)] || []).concat([l]); });
        curKey = null; return;
      }
      var m = REF.exec(line);
      if (m && (lastNum === null || Math.abs(+m[1] - lastNum) <= 3)) { lastNum = +m[1]; lastPart = m[2] || null; curKey = key(m[1], m[2], m[3]); map[curKey] = (map[curKey] || []).concat(m[4] ? [m[4]] : []); return; }
      var s = SUB.exec(line);
      if (s && lastNum !== null) {
        if (s[1]) { lastPart = s[1]; curKey = key(lastNum, s[1]); map[curKey] = (map[curKey] || []).concat([s[2]]); }
        else { curKey = key(lastNum, lastPart, s[3]); map[curKey] = (map[curKey] || []).concat([s[4]]); }
        return;
      }
      if (curKey) map[curKey].push(line);
    });
    return map;
  };
  function normRef(ref) { var m = /^(\d+)\s*\(?([a-h])?\)?\s*\(?((?:i{1,3}|iv|v|vi{1,3}))?\)?$/i.exec(String(ref).replace(/\s/g, '')); return m ? key(m[1], m[2], m[3]) : String(ref).toLowerCase(); }
  var LEVEL = /^\s*(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?\s*(?:marks?)?\s*[:.)\-–]\s*(.+)$/i;
  Q.applyScheme = function (qs, map) {
    var used = 0;
    qs.forEach(function (q) {
      var got = map[normRef(q.ref)]; if (!got || !got.length) return; used++;
      var text = got.join('\n').trim();
      if (q.kind === 'mcq' || q.kind === 'tf') {
        var L = /^\(?([A-Fa-f])\)?(?:\b|$)/.exec(text); if (L) q.correct = 'abcdef'.indexOf(L[1].toLowerCase());
        var rest = text.replace(/^\(?[A-Fa-f]\)?[\s\.:\-–]*/, '').trim(); if (rest) q.explanation = rest;
      } else {
        var pts = text.split(/\n|;\s+|\s+•\s*|^\s*[•\-–]\s*/m).map(function (s) { return s.replace(/^[•\-–✓\*]\s*/, '').replace(/\s*[\[\(]\s*\d\s*(?:marks?)?[\]\)]\s*$/i, '').replace(/\s*✓\s*$/, '').replace(/[;,]\s*$/, '').trim(); }).filter(Boolean);
        var levels = pts.filter(function (p) { return LEVEL.test(p); });
        if (levels.length >= 2 && levels.length >= pts.length / 2) q.rubric = levels.join('\n'); else q.scheme = pts.join('\n');
      }
    });
    return used;
  };

  /* ---------- 4. suggest marks for a written answer ---------- */
  var STOP = ' a an the of to in on at by for and or but is are was were be been being it its this that these those as with from into than then so such which who whom what when where why how do does did can could may might will would should must not no more less most least each other also there their they them we you your our has have had any all some one two use used using give state explain describe outline suggest discuss evaluate compare contrast reason reasons answer marks mark e.g eg i.e ie '.split(' ');
  var STOPSET = {}; STOP.forEach(function (w) { STOPSET[w] = 1; });
  function words(s) { return (' ' + String(s).toLowerCase().replace(/[^a-z0-9%]+/g, ' ') + ' ').split(' ').filter(Boolean); }
  function stem(w) { return w.length <= 5 ? w : w.slice(0, Math.max(5, w.length - 3)); }
  function has(ansWords, w) { var st = stem(w); return ansWords.some(function (a) { return a === w || (st.length >= 4 && a.indexOf(st) === 0) || (a.length >= 5 && w.indexOf(a) === 0 && a.length >= w.length - 2); }); }
  function altMet(ansWords, ansJoined, alt) {
    alt = alt.trim(); if (!alt) return false;
    if (alt.indexOf('+') >= 0) return alt.split('+').every(function (p) { return altMet(ansWords, ansJoined, p); });
    var ks = words(alt).filter(function (w) { return !STOPSET[w] && (w.length >= 3 || /\d/.test(w)); });
    if (!ks.length) return ansJoined.indexOf(' ' + words(alt).join(' ') + ' ') >= 0;
    var n = ks.filter(function (w) { return has(ansWords, w); }).length;
    return ks.length <= 2 ? n === ks.length : n / ks.length >= 0.6;
  }
  Q.points = function (scheme) {
    return String(scheme || '').split('\n').map(function (s) { return s.trim(); })
      .filter(function (s) { return s && !/^(accept|do not accept|don't accept|reject|award|note|ignore|allow|ora|owtte|max|\[max)/i.test(s); });
  };
  Q.suggest = function (answer, scheme, max) {
    var aw = words(answer), joined = ' ' + aw.join(' ') + ' ', pts = Q.points(scheme), hits = [];
    if (!aw.length || !pts.length) return { got: aw.length ? null : 0, hits: pts.map(function () { return false; }) };
    pts.forEach(function (p) { hits.push(p.split(/\s+\/\s+|\s+OR\s+|\s*\/\s*(?=[a-z])/i).some(function (alt) { return altMet(aw, joined, alt); })); });
    return { got: Math.min(max, hits.filter(Boolean).length), hits: hits };
  };
  Q.levels = function (rubric) {
    return String(rubric || '').split('\n').map(function (l) { var m = LEVEL.exec(l); return m ? { lo: +m[1], hi: m[2] ? +m[2] : +m[1], text: m[3] } : null; }).filter(Boolean);
  };

  /* ---------- 5. editor card (import preview, quiz editor, lesson builder) ---------- */
  Q.STEPS = ['Question', 'Explore', 'Test', 'Explain', 'Challenge', 'Reflect'];
  var RADIO = 0;
  function abcd(options, correct) {   // one tick box per option, lettered A, B, C, D …
    var name = 'ok' + (++RADIO);
    if (!options.length) return '<span class="small muted">Type the options above first.</span>';
    return options.map(function (o, k) { var L = 'ABCDEFGH'.charAt(k);
      return '<label class="chk" style="border:1px solid var(--line);border-radius:8px;padding:6px 12px;font-weight:700" title="' + E(o) + '"><input type="radio" name="' + name + '" value="' + k + '" data-ok' + (k === correct ? ' checked' : '') + '> ' + L + '</label>'; }).join('');
  }
  Q.abcd = abcd;
  Q.card = function (q, i, opts) {
    opts = opts || {};
    var optsText = (q.options || []).join('\n');
    var kind = q.kind || 'short', written = kind === 'short', info = kind === 'info', choice = kind === 'mcq' || kind === 'tf';
    var sel = function (v, t) { return '<option value="' + v + '"' + (kind === v ? ' selected' : '') + '>' + t + '</option>'; };
    return '<article class="q qe' + (info ? ' qinfo' : '') + '" data-i="' + i + '"' + (q.id ? ' data-id="' + q.id + '"' : '') + '>' +
      '<div class="row2"><div class="row2" style="justify-content:flex-start">' +
      (opts.lesson ? '<label class="f">Step<select data-f="section">' + Q.STEPS.map(function (st, k) { return '<option value="' + st + '"' + ((q.section || 'Explore') === st ? ' selected' : '') + '>' + (k + 1) + '. ' + st + '</option>'; }).join('') + '</select></label>'
        : '<label class="f" style="width:90px">Number<input data-f="ref" value="' + E(q.ref || '') + '"></label>') +
      '<label class="f">Type<select data-f="kind">' + (opts.lesson ? sel('info', 'Reading, notes or video') : '') + sel('short', 'Written answer (type or handwrite)') + sel('mcq', 'Multiple choice') + sel('tf', 'True / false') + '</select></label>' +
      '<label class="f" style="width:80px" data-show="marks"' + (info ? ' hidden' : '') + '>Marks<input data-f="marks" type="number" min="' + (opts.lesson ? 0 : 1) + '" value="' + E(q.marks == null ? 1 : q.marks) + '"></label></div>' +
      '<div class="acts">' + (opts.join ? '<button type="button" class="btn sm" data-act="join" title="Add this text to the item above">Join with above</button>' : '') +
      (opts.lesson ? '<button type="button" class="btn sm" data-act="up" title="Move up">↑</button><button type="button" class="btn sm" data-act="down" title="Move down">↓</button>' : '') +
      '<button type="button" class="btn sm" data-act="del">' + (opts.delLabel || 'Delete') + '</button></div></div>' +
      (choice && q.correct < 0 && (q.options || []).length ? '<p class="small bad-t" data-need>Tick the correct answer (A, B, C, D) below the options.</p>' : '') +
      '<label class="f"><span data-show="qlabel"' + (info ? ' hidden' : '') + '>Question</span><span data-show="ilabel"' + (info ? '' : ' hidden') + '>Text students read (use **bold**; paste a YouTube or simulation link on its own line to embed it)</span>' +
      '<textarea data-f="prompt" rows="' + Math.min(10, 2 + Math.ceil((q.prompt || '').length / 90)) + '">' + E(q.prompt) + '</textarea></label>' +
      '<label class="f" data-show="choice"' + (choice ? '' : ' hidden') + '>Options, one per line, in order A, B, C, D<textarea data-f="options" rows="' + Math.max(3, (q.options || []).length + 1) + '">' + E(optsText) + '</textarea></label>' +
      '<div class="f" data-show="choice"' + (choice ? '' : ' hidden') + '><span>Correct answer: tick one</span><div class="abcd" data-abcd style="display:flex;flex-wrap:wrap;gap:8px">' + abcd(q.options || [], q.correct) + '</div></div>' +
      '<label class="f" data-show="written"' + (written ? '' : ' hidden') + '>Mark scheme: one marking point per line (each line = 1 mark). Use / between alternatives and + when all words are needed. Students never see this.<textarea data-f="scheme" rows="' + Math.max(3, String(q.scheme || '').split('\n').length + 1) + '" placeholder="sugar-phosphate backbone\nbases pair A+T / C+G\nhydrogen bonds between bases">' + E(q.scheme || '') + '</textarea></label>' +
      '<label class="f" data-show="written"' + (written ? '' : ' hidden') + '>Rubric / level descriptors (optional, for long answers), e.g. "3-4: clear explanation with examples"<textarea data-f="rubric" rows="' + Math.max(2, String(q.rubric || '').split('\n').length + 1) + '" placeholder="1-2: identifies a relevant factor\n3-4: explains with scientific terms\n5-6: detailed, linked explanation with evidence">' + E(q.rubric || '') + '</textarea></label>' +
      '<details' + (info && q.image ? ' open' : '') + '><summary class="small">' + (info ? 'Picture (optional)' : 'Explanation and picture (optional)') + '</summary><label class="f" data-show="explain"' + (info ? ' hidden' : '') + '>Explanation shown to students after marking<textarea data-f="explanation" rows="2">' + E(q.explanation || '') + '</textarea></label>' +
      (/^data:image/.test(q.image || '') ? '<div class="row2 small" data-pic><img src="' + E(q.image) + '" alt="" style="max-height:110px;max-width:60%;border-radius:8px;border:1px solid var(--line)"><span>Picture from your file <button type="button" class="btn sm" data-unpic>Remove</button></span><input data-f="image" type="hidden" value="' + E(q.image) + '"></div>'
        : '<label class="f">Picture address (for example from Wikimedia Commons)<input data-f="image" type="url" value="' + E(q.image || '') + '"></label>') + '</details></article>';
  };
  Q.wireCard = function (el) {
    var opt = el.querySelector('[data-f=options]'), box = el.querySelector('[data-abcd]');
    function redraw() {   // keep the ticks in step with the option lines; a line starting with * is ticked
      var lines = opt.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean), cur = el.querySelector('[data-ok]:checked'), c = cur ? +cur.value : -1;
      lines.forEach(function (s, k) { if (s.charAt(0) === '*') c = k; });
      box.innerHTML = abcd(lines.map(function (s) { return s.replace(/^\*\s*/, ''); }), c < lines.length ? c : -1);
      var need = el.querySelector('[data-need]'); if (need) need.hidden = c >= 0;
    }
    if (opt && box) { opt.addEventListener('input', redraw); box.addEventListener('change', function () { var need = el.querySelector('[data-need]'); if (need) need.hidden = true; }); }
    var up = el.querySelector('[data-unpic]'); if (up) up.onclick = function () { var w = el.querySelector('[data-pic]'); w.innerHTML = '<label class="f">Picture address (for example from Wikimedia Commons)<input data-f="image" type="url" value=""></label>'; };
    var k = el.querySelector('[data-f=kind]');
    k.onchange = function () {
      var v = k.value, show = { choice: v === 'mcq' || v === 'tf', written: v === 'short', marks: v !== 'info', qlabel: v !== 'info', ilabel: v === 'info', explain: v !== 'info' };
      Object.keys(show).forEach(function (n) { el.querySelectorAll('[data-show=' + n + ']').forEach(function (x) { x.hidden = !show[n]; }); });
      el.classList.toggle('qinfo', v === 'info');
      if (v === 'tf' && !el.querySelector('[data-f=options]').value.trim()) { el.querySelector('[data-f=options]').value = 'True\nFalse'; redraw(); }
    };
  };
  Q.readCard = function (el) {
    var v = function (f) { var x = el.querySelector('[data-f=' + f + ']'); return x ? x.value.trim() : ''; };
    var kind = v('kind'), correct = -1, lesson = !!el.querySelector('[data-f=section]');
    var ticked = el.querySelector('[data-ok]:checked'); if (ticked) correct = +ticked.value;
    var options = kind === 'mcq' || kind === 'tf' ? v('options').split('\n').map(function (s) { return s.trim(); }).filter(Boolean).map(function (s, k) { if (s.charAt(0) === '*') { correct = k; return s.slice(1).trim(); } return s; }) : [];
    if (correct >= options.length) correct = -1;
    var marks = parseInt(v('marks'), 10); marks = kind === 'info' ? 0 : isNaN(marks) ? 1 : Math.max(lesson ? 0 : 1, marks);
    return { id: el.dataset.id || null, ref: v('ref'), section: v('section') || null, kind: kind, prompt: v('prompt'), options: options, correct: correct, marks: marks,
      scheme: kind === 'short' ? v('scheme') : '', rubric: kind === 'short' ? v('rubric') : '', explanation: kind === 'info' ? '' : v('explanation'), image: v('image') };
  };
  Q.check = function (q) {
    var name = q.kind === 'info' ? 'A reading block' + (q.section ? ' in ' + q.section : '') : 'Question ' + (q.ref || (q.section ? 'in ' + q.section : ''));
    if (!q.prompt && !(q.kind === 'info' && q.image)) return name + ' has no text.';
    if ((q.kind === 'mcq' || q.kind === 'tf') && q.options.length < 2) return name + ' needs at least two options.';
    if ((q.kind === 'mcq' || q.kind === 'tf') && q.correct < 0) return name + ': tick the correct answer (A, B, C or D).';
    return null;
  };
  /* save questions (new or edited) and their hidden answers; returns ids in order */
  Q.save = function (db, list) {
    var ids = [];
    return list.reduce(function (p, q) {
      return p.then(function () {
        // sub-parts keep their label, e.g. "1(a)(ii) State ..."; whole questions are numbered by the quiz itself
        var row = { kind: q.kind, prompt: (!q.id && /\(/.test(q.ref || '') ? q.ref + ' ' : '') + q.prompt, options: q.options, marks: q.kind === 'info' ? 0 : q.marks, image_url: q.image || null, section: q.section || null };
        var go = q.id ? db.from('questions').update(row).eq('id', q.id).select('id').single() : db.from('questions').insert(row).select('id').single();
        return go.then(function (r) {
          if (r.error) throw r.error; ids.push(r.data.id);
          if (q.kind === 'info') return;
          return db.from('question_answers').upsert({ question_id: r.data.id, correct_option: q.kind === 'short' ? null : q.correct, mark_scheme: q.scheme || null, rubric: q.rubric || null, explanation: q.explanation || null }).then(function (r2) { if (r2.error) throw r2.error; });
        });
      });
    }, Promise.resolve()).then(function () { return ids; });
  };

  /* ---------- 6. lesson builder: objectives and/or a file → six-step inquiry lesson ---------- */
  var VERB = /^(state|name|list|identify|define|describe|outline|explain|compare|contrast|distinguish|calculate|draw|label|suggest|discuss|evaluate|analyse|analyze|predict|investigate|design|apply|use|interpret|deduce|determine|recall|recognise|recognize|understand|know|be able to)\b/i;
  function tidyObjective(o) { return o.replace(/^\s*(?:[-•*\d]+[\.\)]?\s+|(?:students|learners|i|you|we)\s+(?:will|can|should)\s+(?:be able to\s+)?|to\s+)/i, '').replace(/[\.\s]+$/, '').trim(); }
  function asTask(o) {
    var t = tidyObjective(o); if (!t) return '';
    t = t.replace(/^(understand|know|recall|be able to)\s+(that\s+|how\s+|what\s+|why\s+)?/i, function (m, v, w) { return w ? 'Explain ' + w : 'Explain '; });
    return VERB.test(t) ? t.charAt(0).toUpperCase() + t.slice(1) + '.' : 'Show that you can: ' + t + '.';
  }
  Q.buildLesson = function (title, objectivesText, fileLines, schemeLines) {
    var objs = String(objectivesText || '').split('\n').map(tidyObjective).filter(Boolean), items = [], add = function (o) { items.push(Object.assign({ kind: 'short', prompt: '', options: [], correct: -1, marks: 1, scheme: '', rubric: '', explanation: '', image: '' }, o)); };
    var topic = title || 'this topic', low = function (t) { return /^[A-Z][a-z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t; };
    // pull questions and reading text out of an uploaded worksheet or notes
    var fileQs = [], intro = [];
    if (fileLines && fileLines.length) {
      var lines = Q.clean(fileLines), IMG = /^\[\[img:(\d+)\]\]$/; fileQs = Q.parsePaper(lines.filter(function (l) { return !IMG.test(l); }));
      if (schemeLines && schemeLines.length) Q.applyScheme(fileQs, Q.parseScheme(schemeLines));
      var firstQ = lines.findIndex(function (l) { return /^(?:(?:question|q)\s*)?1\s*[\.\):]\s/i.test(l); });
      intro = (firstQ < 0 ? lines : lines.slice(0, firstQ)).filter(function (l) { return !/^(name|class|date)\s*[:_]/i.test(l); });
      if (!objs.length) {   // objectives written in the file itself
        var k = intro.findIndex(function (l) { return /objective|learning (goal|intention)|success criteria|by the end/i.test(l); });
        if (k >= 0) { for (var j = k + 1; j < intro.length && j < k + 8 && intro[j].length < 110 && !/\.\s+\S/.test(intro[j]) && !/^(starter|activity|task|part|section|step|introduction|background)\b/i.test(intro[j]); j++) objs.push(tidyObjective(intro[j])); intro.splice(k, j - k); }
      }
    }
    objs = objs.filter(Boolean);
    // 1. Question: hook, objectives, prior knowledge
    add({ section: 'Question', kind: 'info', marks: 0, prompt: '**' + topic + '**\n\n' + (objs.length ? 'By the end of this lesson you will be able to:\n' + objs.map(function (o) { return '• ' + o.charAt(0).toUpperCase() + o.slice(1); }).join('\n') : 'Read each step, then answer in your own words. You can type or write by hand.') });
    add({ section: 'Question', marks: 0, prompt: 'What do you already know about ' + low(topic) + '? Write one thing you know and one question you want answered today.' });
    // 2. Explore: material from the file, or a space for the teacher's notes / video / simulation
    if (intro.length) {
      var buf = [];
      var flush = function (img) {   // one reading card per slide or ~700 characters; a picture joins the card it belongs to
        if (buf.length) { add({ section: 'Explore', kind: 'info', marks: 0, prompt: buf.join('\n'), image: img || '' }); buf = []; return; }
        if (!img) return; var last = items[items.length - 1];
        if (last && last.kind === 'info' && last.section === 'Explore' && !last.image) last.image = img; else add({ section: 'Explore', kind: 'info', marks: 0, prompt: 'Study this picture carefully.', image: img });
      };
      intro.forEach(function (l) { var m = IMG.exec(l); if (m) return flush(Q.IMGS[+m[1]]); if (/^\*\*/.test(l) && buf.length) flush(); buf.push(l); if (buf.join(' ').length > 700) flush(); });
      flush();
    } else add({ section: 'Explore', kind: 'info', marks: 0, prompt: 'Explore: read the notes, watch the video or try the simulation below.\n\n(Teacher: replace this with your notes, and paste a YouTube or simulation link on its own line to embed it.)' });
    add({ section: 'Explore', marks: 3, prompt: items.some(function (q) { return q.image; }) ? 'Look at the pictures and notes above. Write down three key facts or ideas they show.' : 'Write down three key facts or ideas you found while exploring.', scheme: '' });
    // 3–5. questions from the file, sorted into Test / Explain / Challenge by their marks
    fileQs.forEach(function (q) { q.section = q.kind !== 'short' || q.marks <= 2 ? 'Test' : q.marks <= 4 ? 'Explain' : 'Challenge'; add(q); });
    // objective-based questions where the file did not supply them
    if (!fileQs.some(function (q) { return q.section === 'Test'; })) objs.forEach(function (o) { var t = asTask(o); if (t) add({ section: 'Test', marks: 2, prompt: t }); });
    if (!fileQs.some(function (q) { return q.section === 'Explain'; })) add({ section: 'Explain', marks: 4, prompt: 'Explain in your own words what you have learned about ' + low(topic) + '. Use the key scientific words from this lesson and link the ideas together.' });
    if (!fileQs.some(function (q) { return q.section === 'Challenge'; })) add({ section: 'Challenge', marks: 3, prompt: 'Challenge: apply what you learned to a new situation. ' + (objs.length ? 'Think of a real-life example where you would need to ' + tidyObjective(objs[objs.length - 1]).replace(/^(state|describe|explain|outline)\s+/i, '') + ', and explain it.' : 'Describe a real-life example linked to ' + low(topic) + ' and explain the science behind it.') });
    // 6. Reflect
    add({ section: 'Reflect', marks: 0, prompt: (objs.length ? 'How confident are you with each objective? Give each a score from 1 (not yet) to 5 (I could teach it):\n' + objs.map(function (o, k) { return (k + 1) + '. ' + o; }).join('\n') + '\n\n' : '') + 'What is one thing you will revise, and what is one question you still have?' });
    return items.map(function (q, k) { q._k = k; return q; }).sort(function (a, b) { return Q.STEPS.indexOf(a.section) - Q.STEPS.indexOf(b.section) || a._k - b._k; })
      .map(function (q) { delete q._k; return q; });
  };
})();
