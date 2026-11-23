/* BioscienceVista exam room (23 Nov 2026, roadmap phase 3). Adds eAssessment-style tools to the quiz and exam player
   (site_assets/quizzes.js) without changing how answers are saved or marked:
   - a question navigator (numbered buttons: answered, not answered, flagged, current),
   - 🚩 flag for review on every question,
   - one question per screen (default for examinations) or all questions on one page, with ◀ Previous / Next ▶,
   - a highlighter for question text and source passages (select text, press 🖍; press again on a highlight to remove it),
   - a review screen before handing in: what is unanswered and what is flagged, with links back.
   Flags, highlights and the view are kept on this device for the attempt only.
   BVER.attach(form, { attempt, exam, answered() → array of answered question ids, submit() }) */
(function () {
  var R = window.BVER = {};
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var CSS = '<style id="er-css">.er-bar{position:sticky;top:0;z-index:30;background:#0f1f3d;color:#fff;border-radius:12px;padding:8px 10px;margin:0 0 12px;box-shadow:0 4px 14px rgba(15,31,61,.18)}' +
    '.er-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:space-between}.er-nav{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}' +
    '.er-nav button{min-width:34px;height:32px;border-radius:8px;border:2px solid #475569;background:#1e293b;color:#e2e8f0;font-weight:800;cursor:pointer;position:relative}' +
    '.er-nav button.ans{background:#0d9488;border-color:#0d9488;color:#fff}.er-nav button.cur{outline:3px solid #fde047;outline-offset:1px}.er-nav button.flag::after{content:"🚩";position:absolute;top:-9px;right:-6px;font-size:.7rem}' +
    '.er-tools button{border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.1);color:#fff;border-radius:8px;padding:5px 9px;font-weight:700;cursor:pointer;margin-left:4px}.er-tools button.on{background:#fde047;color:#0f1f3d;border-color:#fde047}' +
    '.er-key{font-size:.72rem;color:#cbd5e1;margin-top:4px}.er-flag{float:right;border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:3px 8px;font-weight:700;cursor:pointer;font-size:.8rem}.er-flag.on{background:#fee2e2;border-color:#ef4444;color:#991b1b}' +
    '.er-step{display:flex;justify-content:space-between;gap:8px;margin:10px 0}.er-hide{display:none!important}mark.er-hl{background:#fde047;color:inherit;padding:0 1px;border-radius:2px;cursor:pointer}' +
    '.er-rev{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:60;display:flex;align-items:center;justify-content:center;padding:16px}.er-rev>div{background:#fff;color:#0f1f3d;border-radius:14px;max-width:560px;width:100%;max-height:85vh;overflow:auto;padding:16px 18px}' +
    '.er-rev a{cursor:pointer;color:#0d9488;font-weight:700}</style>';

  R.attach = function (f, o) {
    if (!f || f.__er) return; f.__er = 1; o = o || {};
    if (!document.getElementById('er-css')) document.head.insertAdjacentHTML('beforeend', CSS);
    var qs = [].slice.call(f.querySelectorAll('fieldset.q[data-id]')); if (qs.length < 2) return;
    var K = 'bver-' + o.attempt, st = { flags: {}, one: !!o.exam, cur: 0, hl: false };
    try { var s = JSON.parse(localStorage.getItem(K) || 'null'); if (s) { st.flags = s.flags || {}; if (typeof s.one === 'boolean') st.one = s.one; st.cur = Math.min(s.cur || 0, qs.length - 1); } } catch (e) {}
    function save() { try { localStorage.setItem(K, JSON.stringify({ flags: st.flags, one: st.one, cur: st.cur })); } catch (e) {} }
    var ids = qs.map(function (q) { return q.getAttribute('data-id'); });
    // each question with the section heading and shared passages just before it (they show with the question in one-at-a-time view)
    // a section heading and a shared source passage stay with every question after them, until the next heading or passage block
    var groups = [], shared = [], lastWasQ = false;
    [].slice.call(f.children).forEach(function (el) {
      if (el.matches('.sec-h')) { shared = [el]; lastWasQ = false; }
      else if (el.matches('[data-info]')) { if (lastWasQ) shared = shared.filter(function (x) { return x.matches('.sec-h'); }); shared.push(el); lastWasQ = false; }
      else if (el.matches('fieldset.q[data-id]')) { groups.push(shared.concat([el])); lastWasQ = true; }
    });
    if (groups.length !== qs.length) groups = qs.map(function (q) { return [q]; });
    var extras = []; groups.forEach(function (g) { g.forEach(function (el) { if (extras.indexOf(el) < 0 && !el.matches('fieldset.q')) extras.push(el); }); });
    var bar = document.createElement('div'); bar.className = 'er-bar';
    bar.innerHTML = '<div class="er-row"><b style="font-size:.9rem">Exam room</b><span class="er-tools"><button type="button" data-t="view" title="Switch between one question per screen and all questions">' + '</button><button type="button" data-t="hl" title="Highlighter: select text in a question, then press">🖍 Highlight</button><button type="button" data-t="rev">✅ Review and submit</button></span></div>' +
      '<div class="er-nav" role="navigation" aria-label="Questions">' + qs.map(function (q, i) { return '<button type="button" data-i="' + i + '" aria-label="Question ' + (i + 1) + '">' + (i + 1) + '</button>'; }).join('') + '</div>' +
      '<div class="er-key">Green = answered · 🚩 = flagged for review · yellow ring = this question</div>';
    var head = f.querySelector('.sticky-top'); f.insertBefore(bar, head ? head.nextSibling : f.firstChild);
    qs.forEach(function (q, i) { var b = document.createElement('button'); b.type = 'button'; b.className = 'er-flag'; b.setAttribute('data-flag', i); b.textContent = '🚩 Flag'; var lg = q.querySelector('legend'); (lg || q).insertBefore(b, (lg || q).firstChild); });
    var step = document.createElement('div'); step.className = 'er-step'; step.innerHTML = '<button type="button" class="btn sm" data-s="-1">◀ Previous</button><span class="small muted" data-pos></span><button type="button" class="btn sm main" data-s="1">Next ▶</button>';
    var acts = f.querySelector('.acts'); f.insertBefore(step, acts || null);

    function answered() { var a = {}; try { (o.answered ? o.answered() : []).forEach(function (k) { a[k] = 1; }); } catch (e) {} return a; }
    function paint() {
      var a = answered();
      bar.querySelectorAll('[data-i]').forEach(function (b, i) { b.className = (a[ids[i]] ? 'ans ' : '') + (st.flags[ids[i]] ? 'flag ' : '') + (st.one && i === st.cur ? 'cur' : ''); b.setAttribute('aria-label', 'Question ' + (i + 1) + (a[ids[i]] ? ', answered' : ', not answered') + (st.flags[ids[i]] ? ', flagged' : '')); });
      f.querySelectorAll('[data-flag]').forEach(function (b) { var on = !!st.flags[ids[+b.getAttribute('data-flag')]]; b.classList.toggle('on', on); b.textContent = on ? '🚩 Flagged' : '🚩 Flag'; });
      bar.querySelector('[data-t="view"]').textContent = st.one ? '☰ All questions' : '① One at a time';
      bar.querySelector('[data-t="hl"]').classList.toggle('on', st.hl);
    }
    function show() {
      extras.forEach(function (el) { el.classList.toggle('er-hide', st.one && groups[st.cur].indexOf(el) < 0); });
      qs.forEach(function (q, i) { q.classList.toggle('er-hide', st.one && i !== st.cur); });
      step.classList.toggle('er-hide', !st.one);
      if (acts) acts.classList.toggle('er-hide', st.one && st.cur !== qs.length - 1);
      step.querySelector('[data-pos]').textContent = 'Question ' + (st.cur + 1) + ' of ' + qs.length;
      step.querySelector('[data-s="-1"]').disabled = st.cur === 0; step.querySelector('[data-s="1"]').disabled = st.cur === qs.length - 1;
      paint(); save();
    }
    function go(i) { st.cur = Math.max(0, Math.min(qs.length - 1, i)); show(); var t = st.one ? groups[st.cur][0] : qs[i]; if (t && t.scrollIntoView) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    bar.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { go(+b.getAttribute('data-i')); }; });
    step.querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () { go(st.cur + +b.getAttribute('data-s')); }; });
    f.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-flag]'); if (!b) return; e.preventDefault(); var id = ids[+b.getAttribute('data-flag')]; if (st.flags[id]) delete st.flags[id]; else st.flags[id] = 1; paint(); save(); });
    ['input', 'change'].forEach(function (ev) { f.addEventListener(ev, function () { setTimeout(paint, 450); }); });
    bar.querySelector('[data-t="view"]').onclick = function () { st.one = !st.one; show(); };

    // highlighter: only inside question text and shared passages, never inside an answer box
    function inPrompt(n) { var el = n && (n.nodeType === 1 ? n : n.parentNode); return el && el.closest && el.closest('legend, [data-info], .sec-h') && !el.closest('textarea, input, select, [contenteditable], .er-flag'); }
    bar.querySelector('[data-t="hl"]').onclick = function () {
      var sel = window.getSelection && window.getSelection();
      if (sel && !sel.isCollapsed && sel.rangeCount && inPrompt(sel.anchorNode) && inPrompt(sel.focusNode)) {
        try { var r = sel.getRangeAt(0), m = document.createElement('mark'); m.className = 'er-hl'; m.title = 'Click to remove the highlight'; m.appendChild(r.extractContents()); r.insertNode(m); sel.removeAllRanges(); } catch (e) {}
        st.hl = false; paint(); return;
      }
      st.hl = !st.hl; paint();
    };
    f.addEventListener('mouseup', function () { if (!st.hl) return; var sel = window.getSelection(); if (sel && !sel.isCollapsed && inPrompt(sel.anchorNode) && inPrompt(sel.focusNode)) bar.querySelector('[data-t="hl"]').onclick(); });
    f.addEventListener('click', function (e) { var m = e.target.closest && e.target.closest('mark.er-hl'); if (!m) return; var p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); p.normalize(); });

    // review screen
    bar.querySelector('[data-t="rev"]').onclick = function () {
      var a = answered(), un = [], fl = []; ids.forEach(function (id, i) { if (!a[id]) un.push(i); if (st.flags[id]) fl.push(i); });
      var link = function (i) { return '<a data-go="' + i + '">Q' + (i + 1) + '</a>'; };
      var d = document.createElement('div'); d.className = 'er-rev';
      d.innerHTML = '<div role="dialog" aria-label="Review your answers"><h3 style="margin-top:0">Review before you submit</h3><p><b>' + (ids.length - un.length) + ' of ' + ids.length + '</b> questions answered.</p>' +
        (un.length ? '<p>Not answered: ' + un.map(link).join(', ') + '</p>' : '<p>✓ Every question has an answer.</p>') + (fl.length ? '<p>🚩 Flagged for review: ' + fl.map(link).join(', ') + '</p>' : '') +
        '<div class="acts" style="margin-top:12px"><button type="button" class="btn sm" data-x>Back to the questions</button> <button type="button" class="btn main sm" data-sub>Submit answers</button></div></div>';
      document.body.appendChild(d);
      d.addEventListener('click', function (e) { var g = e.target.closest('[data-go]'); if (g) { d.remove(); go(+g.getAttribute('data-go')); } if (e.target === d || e.target.closest('[data-x]')) d.remove(); if (e.target.closest('[data-sub]')) { d.remove(); if (o.submit) o.submit(); } });
    };
    show();
  };
})();
