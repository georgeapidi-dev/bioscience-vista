/* BioscienceVista · "Stuck?" help inside every interactive lesson step.
   For each step with written questions: a button that opens a small tutor box. The student picks the question, may write
   what they think so far, and gets one hint and one guiding question, never the answer (server function "step-help").
   Signed out, or when the AI is busy, the hint comes from the step's own mark scheme on the server or, offline, on the page. */
(function () {
  if (typeof window.SPEC !== 'object' || !window.SPEC || !window.SPEC.marks) return;
  var SP = window.SPEC;
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function css() {
    if (document.getElementById('bv-stuck-css')) return;
    var s = document.createElement('style'); s.id = 'bv-stuck-css';
    s.textContent = '.bv-stuck{margin:12px 0;border:2px dashed #f59e0b;border-radius:12px;background:#fffbeb;padding:8px 12px}.bv-stuck>summary{cursor:pointer;font-weight:700;color:#92400e}' +
      '.bv-stuck label{display:grid;gap:4px;margin:8px 0;font-size:.95rem}.bv-stuck select,.bv-stuck textarea{font:inherit;padding:6px;border:1px solid #d6d3d1;border-radius:8px;max-width:100%}' +
      '.bv-stuck .bv-sbtn{background:#d97706;color:#fff;border:0;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer}.bv-stuck .bv-sbtn[disabled]{opacity:.6;cursor:default}' +
      '.bv-stuck .bv-hint{background:#fff;border-left:5px solid #d97706;border-radius:8px;padding:8px 10px;margin:8px 0}.bv-stuck .bv-hint p{margin:4px 0}.bv-stuck .bv-small{font-size:.85rem;color:#57534e}';
    document.head.appendChild(s);
  }
  function textItems(n) { return (SP.marks[n] || []).filter(function (it) { return it.kind === 'text'; }); }
  function label(it) {
    var el = document.querySelector('[data-save="' + it.id + '"]'), q = el && el.closest('.q'), l = q && q.querySelector('.ql');
    return (l ? l.textContent : it.q).replace(/\s+/g, ' ').replace(/\[\d+\]\s*$/, '').trim().slice(0, 120);
  }
  function notes(sec) {   // what the student can already read in this step (not the questions)
    var c = sec.cloneNode(true); c.querySelectorAll('.q,button,script,style,details.bv-stuck,.feedback').forEach(function (x) { x.remove(); });
    return c.textContent.replace(/\s+/g, ' ').trim().slice(0, 2500);
  }
  // offline hint: count the ideas already there and point back to the notes, without giving keywords away
  function localHint(it, text) {
    var t = window.norm ? window.norm(text) : ' ' + String(text).toLowerCase() + ' ', got = 0, first = -1;
    (it.pts || []).forEach(function (alts, i) { var ok = alts.some(function (a) { return window.hit ? window.hit(t, a) : t.indexOf(a.toLowerCase()) >= 0; }); if (ok) got++; else if (first < 0) first = i; });
    if (first < 0) return { hint: 'Your answer already has every idea the mark scheme looks for. Check each sentence is clear and uses the scientific words from the notes.', question: 'Does it answer exactly what the question asks?' };
    return { hint: (got ? 'You have ' + got + ' of the ' + it.max + ' ideas already. ' : '') + ((it.tips && it.tips[first]) || 'Go back to the notes at the top of this step and find the sentence that links to this question.'),
      question: it.max > 1 ? 'The question is worth ' + it.max + ' marks: what ' + (got ? 'other ' : '') + 'idea could you add?' : 'Which key idea from the notes answers this question directly?' };
  }
  function mount(sec) {
    if (sec.getAttribute('data-stuck')) return;
    var n = +(sec.id || '').replace('step', ''), items = textItems(n); if (!n || !items.length) return;
    sec.setAttribute('data-stuck', '1'); css();
    var box = document.createElement('details'); box.className = 'bv-stuck';
    box.innerHTML = '<summary>🤔 Stuck? Get a hint</summary>' +
      '<p class="bv-small">Pick the question. Write what you think so far (even a guess): the hint builds on it. You get a nudge and a question to think about, never the answer.</p>' +
      '<label>Question<select class="bv-sq">' + items.map(function (it, i) { return '<option value="' + i + '">' + E(label(it)) + '</option>'; }).join('') + '</select></label>' +
      '<label>What I think so far, or what confuses me (optional)<textarea class="bv-st" rows="2"></textarea></label>' +
      '<button type="button" class="bv-sbtn">Give me a hint</button> <span class="bv-small bv-sstat" aria-live="polite"></span><div class="bv-sout"></div>';
    var btn = sec.querySelector('button[data-step]'); if (btn && btn.parentNode) btn.parentNode.insertBefore(box, btn); else sec.appendChild(box);
    var sel = box.querySelector('.bv-sq'), ta = box.querySelector('.bv-st'), go = box.querySelector('.bv-sbtn'), stat = box.querySelector('.bv-sstat'), out = box.querySelector('.bv-sout'), hist = {};
    sel.onchange = function () {   // start from the student's own answer in the lesson, if they have written one
      var it = items[+sel.value], a = document.querySelector('[data-save="' + it.id + '"]'); if (a && a.value && !ta.value) ta.value = a.value.slice(0, 600);
    };
    sel.onchange();
    function show(h, src) {
      out.insertAdjacentHTML('beforeend', '<div class="bv-hint"><p>💡 ' + E(h.hint) + '</p>' + (h.question ? '<p><b>Think:</b> ' + E(h.question) + '</p>' : '') +
        '<p class="bv-small">' + (src === 'ai' ? 'Hint from the tutor.' : 'Hint from the mark scheme.') + ' Try again in the question box, then ask for another hint if you need one.</p></div>');
    }
    go.onclick = function () {
      var i = +sel.value, it = items[i], text = ta.value.trim(), h = hist[i] = hist[i] || [];
      var db = window.BV_DB || window.BV_LDB;
      if (!db || !db.functions) { show(localHint(it, text), 'rule'); return; }
      go.disabled = true; stat.textContent = 'Thinking…';
      db.functions.invoke('step-help', { body: { lesson: SP.id, step: n, q: it.id, attempt: text, notes: notes(sec), history: h } }).then(function (r) {
        var d = r.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
        if (!d || !d.ok) { show(localHint(it, text), 'rule'); stat.textContent = d && d.error && /sign in/i.test(d.error) ? 'Sign in for hints from the tutor.' : ''; return; }
        h.push({ who: 'student', text: text }, { who: 'tutor', text: d.hint + ' ' + (d.question || '') });
        show(d, d.source); stat.textContent = '';
      }, function () { show(localHint(it, text), 'rule'); stat.textContent = ''; }).then(function () { go.disabled = false; });
    };
  }
  function all() { document.querySelectorAll('section.step[id^="step"]').forEach(mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all); else all();
  setInterval(all, 2000);   // lesson pages are written again after the password unlocks
})();
