/* BioscienceVista · Six-Step Lesson Framework (Nov 2026)
   One layer over every six-step lesson page (pages with var SPEC and sections #step1 to #step6). It keeps all existing content,
   marking, saving and model answers, and adds:
     - a journey bar: the six stages with their purpose, progress and the stage you are on; one stage at a time (Focus) or all;
     - three pathways a student can switch between at any time: Support (vocabulary bank, sentence starters, hints and worked
       examples open), Core, Extension (extension tasks in Explore, Explain and Challenge);
     - QUESTION: driving question, prediction, "I already know" and "I want to find out" (sent to the teacher with step 1);
     - EXPLORE: the lesson's videos inside the stage;
     - EXPLAIN: a misconception check when the lesson provides one;
     - CHALLENGE: Developing / Secure / Advanced levels on the questions;
     - REFLECT: revisit the prediction with evidence, choose the next step;
     - MYP lessons: global context, key concept, statement of inquiry and inquiry questions when the lesson provides them.
   Optional lesson data comes from <script type="application/json" id="sx-data"> (written by lessongen/gen.py). */
(function () {
  if ([1, 2, 3, 4, 5, 6].some(function (n) { return !document.getElementById('step' + n); })) return;   // only pages with all six stages (hand-built lessons too, 21 Nov 2026)
  var SPEC = (typeof window.SPEC === 'object' && window.SPEC) || {};
  var STAGES = [
    ['Question', 'Spark curiosity', 'Predict, and say what you already know and want to find out.', '❓'],
    ['Explore', 'Discover and investigate', 'Look for patterns and relationships in the models, images and videos.', '🔍'],
    ['Test', 'Gather evidence', 'Use data and investigations to test ideas.', '🧪'],
    ['Explain', 'Build understanding', 'Explain what you found using evidence and scientific terms.', '💡'],
    ['Challenge', 'Apply and transfer', 'Use what you know on new problems: developing, secure, advanced.', '🚀'],
    ['Reflect', 'Evaluate and improve', 'What do you understand, how do you know, and what next?', '🪞']];
  var LS = { get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
             set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  var KEY = 'sx:' + (SPEC.id || location.pathname), STATE = LS.get(KEY, {}) || {};
  function keep() { LS.set(KEY, STATE); }
  function E(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  var DATA = {}; try { var dj = document.getElementById('sx-data'); if (dj) DATA = JSON.parse(dj.textContent) || {}; } catch (e) {}
  var MYP = !!window.BV_MYP || /MYP/.test(($('.hero .meta') || {}).textContent || '');
  var steps = [1, 2, 3, 4, 5, 6].map(function (n) { return document.getElementById('step' + n); });
  var terms = (function () {   // the lesson's key terms, from its "Key terms" line
    var wb = $$('.bv-wb .bv-term'); if (wb.length) return wb.map(function (x) { return x.textContent.trim(); });   // word bank buttons (23 Nov 2026)
    var el = $$('.small, .muted').filter(function (x) { return /Key terms/.test(x.textContent); })[0];
    if (!el) return [];
    return el.textContent.replace(/^[^:]*:\s*/, '').split('·').map(function (t) { return t.trim(); }).filter(Boolean);
  })();
  var guiding = (function () { var b = $('.hero .big'); return b ? b.textContent.replace(/^Guiding question:\s*/, '') : ''; })();

  /* ---------- an answer box that is kept on this device and sent to the teacher with the step ---------- */
  function box(id, label, prompt, rows, extraCls) {
    var v = STATE[id] || '';
    return '<div class="q sx-q ' + (extraCls || '') + '"><label class="ql" for="sx-' + id + '">' + prompt + '</label>' +
      '<textarea id="sx-' + id + '" data-sx="' + id + '" data-label="' + E(label) + '" rows="' + (rows || 2) + '">' + E(v) + '</textarea></div>';
  }
  function putBefore(sec, ref, node) {   // insert node into a stage, before the stage's child that contains ref (or at the end)
    while (ref && ref.parentNode !== sec) ref = ref.parentNode;
    if (ref) sec.insertBefore(node, ref); else sec.appendChild(node);
  }
  document.addEventListener('input', function (e) { var k = e.target && e.target.getAttribute && e.target.getAttribute('data-sx'); if (k) { STATE[k] = e.target.value; keep(); } });

  /* ---------- journey bar ---------- */
  var bar = document.createElement('nav'); bar.className = 'sx-bar'; bar.setAttribute('aria-label', 'Lesson stages');
  bar.innerHTML = '<div class="sx-stages">' + STAGES.map(function (s, i) {
      return '<button type="button" class="sx-st" data-n="' + (i + 1) + '" aria-label="Stage ' + (i + 1) + ': ' + s[0] + ', ' + s[1] + '"><span class="sx-ic" aria-hidden="true">' + s[3] + '</span><b>' + (i + 1) + ' ' + s[0] + '</b><small>' + s[1] + '</small></button>'; }).join('') + '</div>' +
    '<div class="sx-tools"><div class="sx-path" role="radiogroup" aria-label="Choose your pathway (change at any time)"><span>Pathway:</span>' +
      ['Support', 'Core', 'Extension'].map(function (p) { return '<button type="button" role="radio" data-path="' + p.toLowerCase() + '">' + p + '</button>'; }).join('') + '</div>' +
      '<label class="sx-focus"><input type="checkbox" id="sx-focus"> One stage at a time</label><span class="sx-pct" aria-live="polite"></span></div>';
  var oldProg = $('.progress'); var anchor = oldProg || steps[0];
  anchor.parentNode.insertBefore(bar, anchor); if (oldProg) oldProg.style.display = 'none';

  /* ---------- pathways ---------- */
  var PATH_HELP = { support: 'Support: vocabulary bank, sentence starters, hints and worked examples are open.', core: 'Core: work independently; open hints only if you need them.', extension: 'Extension: extra tasks appear in Explore, Explain and Challenge.' };
  function setPath(p) {
    STATE.path = p; keep();
    document.body.classList.toggle('sx-support', p === 'support'); document.body.classList.toggle('sx-ext', p === 'extension');
    $$('.sx-path button').forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-path') === p ? 'true' : 'false'); });
    $$('details.hint, details.worked').forEach(function (d) { if (p === 'support') d.open = true; });
    var h = $('.sx-pathhelp'); if (h) h.textContent = PATH_HELP[p];
  }
  $$('.sx-path button').forEach(function (b) { b.addEventListener('click', function () { setPath(b.getAttribute('data-path')); }); });

  /* ---------- tidy the long lesson opening into one overview ---------- */
  (function () {
    var where = $('.where'), udl = $('.udl'), objectives = $$('.card.notes').filter(function (c) { return /By the end of this lesson/.test(c.textContent); })[0];
    var whereCard = where && where.closest('.card'), udlCard = udl && udl.closest('.card');
    var over = document.createElement('details'); over.className = 'card sx-over';
    over.innerHTML = '<summary><b>Lesson overview</b> <span class="muted small">big idea, key terms, marks and how this lesson works</span></summary><div class="sx-overbody"></div>';
    var body = $('.sx-overbody', over);
    body.insertAdjacentHTML('beforeend', '<p class="sx-pathhelp small"></p>');
    if (whereCard) body.appendChild(whereCard);
    if (udlCard) {   // keep the key-term line; the fixed "choose how you learn" text is replaced by the pathways
      var kt = $$('.small', udlCard).filter(function (x) { return /Key terms|Word bank/.test(x.textContent); })[0];
      if (kt) body.appendChild(kt);
      var vids = $('.videos', udlCard); if (vids) { vids.classList.add('sx-videos'); STATE._v = 1; window.__sxVideos = vids; }
      udlCard.style.display = 'none';
    }
    (objectives || bar).parentNode.insertBefore(over, objectives ? objectives.nextSibling : bar);
  })();

  /* ---------- stage purposes ---------- */
  steps.forEach(function (sec, i) {
    sec.classList.add('sx-stage'); sec.setAttribute('data-stage', i + 1);
    var head = $('.stephead', sec); if (!head) return;
    head.insertAdjacentHTML('afterend', '<p class="sx-purpose"><b>' + STAGES[i][1] + '.</b> ' + STAGES[i][2] + '</p>');
  });

  /* ---------- 1 QUESTION ---------- */
  (function () {
    var s = steps[0], after = $('.sx-purpose', s);
    var h = '<div class="card sx-inquiry"><div class="sx-dq"><span>Driving question</span><b>' + E(guiding) + '</b></div>';
    var iq = DATA.inquiry || (DATA.myp && DATA.myp.iq);
    if (iq) h += '<ul class="sx-iq">' + [['Factual', iq.f || iq.factual], ['Conceptual', iq.c || iq.conceptual], ['Debatable', iq.d || iq.debatable]].filter(function (x) { return x[1]; })
      .map(function (x) { return '<li><b>' + x[0] + ':</b> ' + E(x[1]) + '</li>'; }).join('') + '</ul>';
    h += '<div class="sx-kwl">' + box('pred', 'Prediction', '<b>Predict.</b> Answer the driving question now, before you learn more.', 2) +
      box('know', 'I already know', '<b>I already know…</b>', 2) + box('want', 'I want to find out', '<b>I want to find out…</b>', 2) + '</div></div>';
    if (DATA.myp) {
      var m = DATA.myp;
      h += '<details class="card sx-myp" open><summary><b>MYP inquiry</b></summary><dl>' +
        [['Global context', m.gc], ['Key concept', m.key], ['Related concepts', m.related], ['Statement of inquiry', m.soi], ['ATL skills', m.atl]].filter(function (x) { return x[1]; })
          .map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + E(Array.isArray(x[1]) ? x[1].join(', ') : x[1]) + '</dd>'; }).join('') + '</dl></details>';
    }
    if (DATA.dp) h += '<div class="card sx-myp"><b>Connections</b><p>' + E(DATA.dp) + '</p></div>';
    after.insertAdjacentHTML('afterend', h);
  })();

  /* ---------- 2 EXPLORE: videos inside the stage ---------- */
  if (window.__sxVideos) {
    var w = document.createElement('div'); w.className = 'card sx-watch'; w.innerHTML = '<h3>Watch and explore</h3><p class="small muted">Watch one, then look for a pattern or relationship you can test in the next stage.</p>';
    w.appendChild(window.__sxVideos); putBefore(steps[1], $('.card.task', steps[1]) || $('.savecard', steps[1]), w);
  }

  /* ---------- Support: vocabulary bank and sentence starters ---------- */
  if (terms.length) steps.slice(0, 5).forEach(function (sec) {
    var t = $('.card.task:not(.savecard)', sec); if (!t) return;
    t.insertAdjacentHTML('afterbegin', '<div class="sx-only-support sx-vocab"><b>Vocabulary bank</b> ' + terms.map(function (x) { return '<button type="button" class="bv-term">' + E(x) + '</button>'; }).join('') + '</div>');
  });
  var STARTERS = [
    [/\bcalculate|work out|determine\b/i, 'Write the equation → put in the numbers with units → give the answer with its unit.'],
    [/\bcompare|distinguish|contrast\b/i, 'Both… However, … whereas … . The main difference is …'],
    [/\bevaluate|discuss|to what extent|justify\b/i, 'One strength is … because … . One weakness is … because … . Overall, … because …'],
    [/\bexplain\b/i, '… happens because … . This means that … , so …'],
    [/\bdescribe|outline\b/i, 'First … . Then … . This results in …'],
    [/\bsuggest|predict\b/i, 'I think … because … (link to what you learned about …).'],
    [/\bdesign|plan\b/i, 'I will change … (independent variable), measure … (dependent variable) and keep … the same.'],
    [/\bdefine|state\b/i, 'Use the key term in a full sentence: … is …']];
  $$('.step textarea[data-label]').forEach(function (ta) {
    if (ta.hasAttribute('data-sx')) return;
    var ql = ta.closest('.q') && $('.ql', ta.closest('.q')); if (!ql) return;
    var m = STARTERS.filter(function (s) { return s[0].test(ql.textContent); })[0];
    if (m) ta.insertAdjacentHTML('beforebegin', '<div class="sx-only-support sx-starter"><b>Sentence starter:</b> ' + E(m[1]) + '</div>');
  });

  /* ---------- Extension tasks ---------- */
  var EXT = DATA.ext || {};
  [[2, EXT[2] || 'Find a second source (a video, article or data set) on this topic. Note one thing it adds that these notes do not, and one way you could test it.'],
   [4, EXT[4] || 'Explain the big idea to a younger student in three sentences. Then state one limitation of the model or explanation you used.'],
   [5, EXT[5] || 'Write your own exam-style question on this lesson, with marks and a mark scheme, then answer it.']].forEach(function (x) {
    var sec = steps[x[0] - 1], save = $('.savecard', sec) || $('[data-step]', sec);
    var card = document.createElement('div'); card.className = 'card sx-only-ext sx-extcard';
    card.innerHTML = '<h3>🚀 Extension</h3>' + box('ext' + x[0], 'Extension (stage ' + x[0] + ')', E(x[1]), 3);
    putBefore(sec, save, card);
  });

  /* ---------- hand-built lessons: real images (Explore) and a worked example (Explain) from the lesson data (21 Nov 2026) ---------- */
  if (DATA.figs && DATA.figs.length) {
    var fg = document.createElement('div'); fg.className = 'card sx-figs';
    fg.innerHTML = '<h3>Look closely</h3><p class="small muted">Study each image. What does it show about the big idea?</p>' + DATA.figs.map(function (f) {
      return '<figure class="wide"><img alt="' + E(f[1]) + '" src="https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(f[0]) + '?width=900" loading="lazy" style="max-height:420px;object-fit:contain" onerror="this.closest(\'figure\').remove()">' +
        '<figcaption>' + E(f[1]) + '</figcaption><div class="credit">Image: ' + E(f[2] || '') + ', via <a href="https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(f[0]) + '" target="_blank" rel="noopener">Wikimedia Commons</a></div></figure>'; }).join('');
    putBefore(steps[1], $('.card.task', steps[1]) || $('.savecard', steps[1]), fg);
  }
  if (DATA.worked && DATA.worked.length) {
    var wk = document.createElement('div'); wk.className = 'card sx-worked';
    wk.innerHTML = DATA.worked.map(function (w) { return '<details class="worked" open><summary>✏️ Worked example: ' + E(w[0]) + '</summary><ol>' + w[1].map(function (x) { return '<li>' + E(x) + '</li>'; }).join('') + '</ol></details>'; }).join('');
    putBefore(steps[3], $('.card.task', steps[3]) || $('.savecard', steps[3]), wk);
  }

  /* ---------- 4 EXPLAIN: misconception check ---------- */
  if (DATA.misc && DATA.misc.length) {
    var mc = document.createElement('div'); mc.className = 'card sx-misc';
    mc.innerHTML = '<h3>Misconception check</h3><p class="small muted">True or false? Choose, then read why.</p>' + DATA.misc.map(function (r, i) {
      return '<div class="sx-mrow" data-i="' + i + '"><span>' + E(r[0]) + '</span><span class="sx-tf"><button type="button" data-v="1">True</button><button type="button" data-v="0">False</button></span><div class="sx-why" hidden></div></div>'; }).join('');
    putBefore(steps[3], $('.card.task', steps[3]) || $('.savecard', steps[3]), mc);
    $$('.sx-mrow', mc).forEach(function (row) {
      var r = DATA.misc[+row.getAttribute('data-i')];
      $$('button', row).forEach(function (b) { b.addEventListener('click', function () {
        var ok = (b.getAttribute('data-v') === '1') === !!r[1], why = $('.sx-why', row);
        why.hidden = false; why.className = 'sx-why ' + (ok ? 'ok' : 'no'); why.textContent = (ok ? '✓ Correct. ' : '✗ Not quite. ') + (r[2] || '');
        $$('button', row).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      }); });
    });
  }

  /* ---------- 5 CHALLENGE: levels ---------- */
  var LV = { D: 'Developing', S: 'Secure', A: 'Advanced' };
  (function () {
    var qs = $$('.card.task .q', steps[4]).filter(function (q) { return !q.classList.contains('sx-q'); });
    qs.forEach(function (q, i) {
      var lv = q.getAttribute('data-lv') || (qs.length === 1 ? 'A' : i === 0 ? 'S' : 'A');
      var ql = $('.ql', q); if (ql && !$('.sx-lv', ql)) ql.insertAdjacentHTML('afterbegin', '<span class="sx-lv sx-lv-' + lv + '">' + LV[lv] + '</span> ');
    });
    $$('.q[data-lv]').forEach(function (q) { var ql = $('.ql', q), lv = q.getAttribute('data-lv'); if (ql && !$('.sx-lv', ql)) ql.insertAdjacentHTML('afterbegin', '<span class="sx-lv sx-lv-' + lv + '">' + LV[lv] + '</span> '); });
  })();

  /* ---------- 6 REFLECT ---------- */
  (function () {
    var t6 = $('.card.task', steps[5]); if (!t6) return;
    var exam = document.getElementById('lv-exam') || document.getElementById('lv-dpexam');
    var h = '<div class="sx-revisit"><h3>Revisit your prediction</h3><p class="sx-yourpred"></p>' +
      box('predcheck', 'Prediction revisited', '<b>Was your prediction right?</b> What evidence from this lesson supports or changes it?', 3) +
      box('howknow', 'How I know', '<b>How do I know?</b> Name the step, data or diagram that convinced you.', 2) +
      '<div class="q"><div class="ql"><b>My next step</b></div><div class="sx-next">' +
      ['Revise a stage I am unsure of', 'Do the exam-style questions', 'Try the Extension pathway'].map(function (t, i) {
        return '<label><input type="radio" name="sx-next" value="' + i + '"' + (STATE.next === String(i) ? ' checked' : '') + '> ' + t + '</label>'; }).join('') + '</div></div></div>';
    t6.insertAdjacentHTML('afterbegin', h);
    var yp = $('.sx-yourpred', t6); function showPred() { yp.innerHTML = STATE.pred ? '<b>You predicted:</b> ' + E(STATE.pred) : '<span class="muted">You did not make a prediction in the Question stage. Write one now from memory, then compare.</span>'; }
    showPred(); document.addEventListener('input', function (e) { if (e.target.getAttribute && e.target.getAttribute('data-sx') === 'pred') showPred(); });
    $$('input[name=sx-next]', t6).forEach(function (r) { r.addEventListener('change', function () {
      STATE.next = r.value; keep();
      if (r.value === '1' && exam) exam.scrollIntoView({ behavior: 'smooth' });
      if (r.value === '2') { setPath('extension'); go(2); }
    }); });
  })();

  /* ---------- progress and focus mode ---------- */
  function saved(n) { var d = document.getElementById('dot' + n), f = document.getElementById('fb' + n); return (d && d.classList.contains('done')) || !!(f && !f.classList.contains('hidden')); }
  var cur = 1;
  function paint() {
    var done = 0;
    $$('.sx-st').forEach(function (b) { var n = +b.getAttribute('data-n'); var s = saved(n); if (s) done++;
      b.classList.toggle('done', s); b.classList.toggle('cur', n === cur); b.setAttribute('aria-current', n === cur ? 'step' : 'false'); });
    $('.sx-pct').textContent = done + ' of 6 stages done';
  }
  function focusOn() { return document.body.classList.contains('sx-focusmode'); }
  function show() { steps.forEach(function (s, i) { s.classList.toggle('sx-hide', focusOn() && i + 1 !== cur); });
    $$('#lv-exam, #lv-dpexam, [id^="lv-exam"]').forEach(function (ex) { ex.classList.toggle('sx-hide', focusOn() && cur !== 6); }); paint(); }
  function go(n, noscroll) {
    cur = Math.max(1, Math.min(6, n)); STATE.cur = cur; keep(); show();
    if (!noscroll) { var h2 = $('h2', steps[cur - 1]); bar.scrollIntoView({ behavior: 'smooth', block: 'start' }); if (h2) { h2.setAttribute('tabindex', '-1'); setTimeout(function () { h2.focus({ preventScroll: true }); }, 350); } }
  }
  $$('.sx-st').forEach(function (b) { b.addEventListener('click', function () { if (focusOn()) go(+b.getAttribute('data-n')); else steps[+b.getAttribute('data-n') - 1].scrollIntoView({ behavior: 'smooth' }); }); });
  steps.forEach(function (sec, i) {   // previous / next at the end of each stage
    var nav = document.createElement('div'); nav.className = 'sx-nav';
    nav.innerHTML = (i ? '<button type="button" data-go="' + i + '">← ' + STAGES[i - 1][0] + '</button>' : '<span></span>') +
      (i < 5 ? '<button type="button" class="sx-nextb" data-go="' + (i + 2) + '">Next: ' + STAGES[i + 1][0] + ' →</button>' : '<span></span>');
    sec.appendChild(nav);
  });
  $$('[data-go]').forEach(function (b) { b.addEventListener('click', function () { var n = +b.getAttribute('data-go'); if (focusOn()) go(n); else steps[n - 1].scrollIntoView({ behavior: 'smooth' }); }); });
  var fx = document.getElementById('sx-focus');
  fx.checked = LS.get('sx-focus', true) !== false; document.body.classList.toggle('sx-focusmode', fx.checked);
  fx.addEventListener('change', function () { LS.set('sx-focus', fx.checked); document.body.classList.toggle('sx-focusmode', fx.checked); show(); });
  if ('IntersectionObserver' in window) {   // all-stages mode: the bar follows the stage on screen
    var io = new IntersectionObserver(function (es) { if (focusOn()) return; es.forEach(function (e) { if (e.isIntersecting) { cur = +e.target.getAttribute('data-stage'); paint(); } }); }, { rootMargin: '-40% 0px -55% 0px' });
    steps.forEach(function (s) { io.observe(s); });
  }
  $$('button[data-step]').forEach(function (b) { b.addEventListener('click', function () { setTimeout(paint, 300); }); });
  window.addEventListener('hashchange', function () { var m = /#step(\d)/.exec(location.hash); if (m) go(+m[1], true); });
  var hm = /#step(\d)/.exec(location.hash);
  setPath(STATE.path || 'core');
  go(hm ? +hm[1] : (STATE.cur || 1), true);
})();
