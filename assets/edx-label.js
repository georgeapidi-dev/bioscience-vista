/* Pearson Edexcel label for lessons opened from an Edexcel course (?edx=<course page>&t=<topic code>).
   Lessons borrowed from IB, Cambridge or CBE courses are named and labelled by the Edexcel course and topic
   (George Apidi, 25 Nov 2026). Text produced later by the lesson's own scripts is relabelled too. */
(function () {
  var q = new URLSearchParams(location.search), c = q.get('edx'), t = q.get('t');
  if (!c) return;
  var PROG = /\b(?:the )?(?:Cambridge International AS (?:&|and) A Level|Cambridge International A Level|Cambridge AS (?:&|and) A Level|Cambridge IGCSE|Cambridge Lower Secondary|Cambridge International|Cambridge|IB Diploma Programme|IB Diploma|IB DP|IB MYP|IB)(?: (?:Biology|Chemistry|Physics|Mathematics|Maths|Science|Computer Science))?(?: (?:Analysis and Approaches|AA|AI))?(?: \(?\d{4}\)?)?(?: (?:guide|syllabus|specification))?(?: \d{4}\s*[-–]\s*\d{4})?(?: \(first assessment \d{4}\))?/g;
  fetch('/assets/edx-labels.json').then(function (r) { return r.json(); }).then(function (L) {
    var x = L[c]; if (!x) return;
    var tp = (t && x.topics[t]) ? (t + ' ' + x.topics[t]) : '', name = 'Pearson Edexcel ' + x.name;
    var path = location.pathname.replace(/^\/|\/$/g, ''), nt = x.titles && x.titles[path];
    var fix = function (v) {
      return v.replace(/\b(IB|Cambridge)-style\b/g, 'Edexcel-style')
        .replace(PROG, function (m) { return (/^the /.test(m) ? 'the ' : '') + name; })
        .replace(/\s*\((?:SL\/HL|SL and HL|AHL|HL)\)/g, '').replace(/\s*·\s*(?:SL and HL|HL only|AHL)\b/g, '');
    };
    function walk(root) {
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, todo = [];
      while ((n = w.nextNode())) { var p = n.parentNode; if (!p || p.closest('script,style,.edx-badge')) continue; todo.push(n); }
      todo.forEach(function (n) {
        var a = n.parentNode.closest('a'), v = n.nodeValue, nv;
        if (a && /youtube|youtu\.be/.test(a.getAttribute('href') || '')) nv = v.replace(/^(\s*▶?\s*)(?:IB|Cambridge|IGCSE|A Level|AS)[^:]*:\s*/, '$1');   // video titles: drop the other programme's prefix only
        else if (a) return;
        else nv = fix(v);
        if (nv !== v) n.nodeValue = nv;
      });
    }
    var m = document.querySelector('.hero .meta'); if (m) m.textContent = x.code + (tp ? ' · ' + tp : '') + ' · Prepared by VistaEd';
    document.querySelectorAll('.stephead .mins').forEach(function (s) { s.textContent = s.textContent.split(' · ')[0]; });
    var h = document.querySelector('h1');
    if (h && nt) h.textContent = (t ? t + ' · ' : '') + nt;
    if (h && !document.querySelector('.edx-badge')) {
      var b = document.createElement('p'); b.className = 'edx-badge'; b.textContent = '📘 ' + name + (tp ? ' · ' + tp : '');
      b.style.cssText = 'display:inline-block;margin:0 0 8px;padding:4px 12px;border-radius:999px;background:#1d4ed8;color:#fff;font-weight:700;font-size:.9rem';
      h.parentNode.insertBefore(b, h);
    }
    document.querySelectorAll('.pill').forEach(function (p) { if (/^(HL|SL|AHL)$/.test(p.textContent.trim())) p.remove(); });
    walk(document.body);
    document.title = (nt || document.title.replace(/ · [^·]*$/, '')) + ' · Edexcel ' + x.name;
    // the lesson's own scripts add content later (quiz feedback, exam questions): keep relabelling
    var busy = false;
    new MutationObserver(function (recs) { if (busy) return; busy = true;
      recs.forEach(function (r) { r.addedNodes.forEach(function (k) { if (k.nodeType === 1) walk(k); else if (k.nodeType === 3 && k.parentNode && !k.parentNode.closest('a,script,style')) { var v = fix(k.nodeValue); if (v !== k.nodeValue) k.nodeValue = v; } }); });
      busy = false; }).observe(document.body, { childList: true, subtree: true });
    // links to other lessons inside this one keep the Edexcel context
    document.querySelectorAll('a[href^="/"]').forEach(function (a) { var hr = a.getAttribute('href'); if (/^\/[a-z0-9-]+\/$/.test(hr) && x.titles && x.titles[hr.slice(1, -1)]) a.setAttribute('href', hr + '?edx=' + encodeURIComponent(c)); });
  }).catch(function () {});
})();
