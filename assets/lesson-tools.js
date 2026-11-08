/* BioScience Vista · lesson add-on for the six-step lesson pages
   1. Teacher view: a signed-in teacher sees the model answers in every step, all the time.
   2. Repeat: after a step is saved (and its model answers shown), a student can repeat it. Each repeat is marked,
      labelled "Repeat 1", "Repeat 2"… and sent to the teacher, but the first mark stays the one that counts. */
(function () {
  var TEMPLATE = typeof window.SPEC === 'object' && typeof window.modelsHtml === 'function';
  var MARK0 = window.mark || window.markStep, DATA = window.BV_MODELS;
  function MARK(n) { var m = MARK0(n); if (Array.isArray(m)) { var sc = 0, mx = 0; m.forEach(function (i) { sc += +i.got || 0; mx += +i.max || 0; }); m = { items: m, score: sc, max: mx }; } return m; }
  if (!(TEMPLATE || DATA) || typeof MARK0 !== 'function' || typeof window.store !== 'object') return;
  var REP = {}, counts = store.get('repeats') || {};
  function E2(t) { return typeof window.esc === 'function' ? esc(t) : String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function MODELS(n) {   // model answers for a step, in the template's own style
    if (TEMPLATE) return window.__bvOrigModels(n);
    var md = DATA[n]; if (!md || !md.length) return '';
    return '<details class="model bv-model" open><summary><b>Model answers: check your work and correct it in your book</b></summary><ul>' +
      md.map(function (x) { return '<li><b>' + E2(x[0]) + '</b> ' + E2(x[1]) + '</li>'; }).join('') + '</ul></details>';
  }
  if (TEMPLATE) window.__bvOrigModels = window.modelsHtml;
  var ORIG_MODELS = MODELS;
  function TIPS(m) { if (typeof window.tipsOf === 'function') try { return tipsOf(m); } catch (e) {} return (m.items || []).filter(function (i) { return i.tip || (i.tips && i.tips.length); }).map(function (i) { return (i.q ? i.q + ': ' : '') + (i.tip || i.tips.join(' ')); }); }
  function LEAD(m) { if (typeof window.lead === 'function') try { return lead(m); } catch (e) {} var p = m.max ? m.score / m.max : 0; return p === 1 ? 'Excellent: full marks.' : p >= 0.6 ? 'Good work. To reach full marks:' : p > 0 ? 'A start. To improve:' : 'Not there yet. Use these to improve:'; }
  function stepEl(n) { return document.getElementById('step' + n); }
  function complete(n) {   // every answer box in the step is filled in
    var sec = stepEl(n); if (!sec) return true;
    return [].slice.call(sec.querySelectorAll('textarea, select')).filter(function (e) { return !e.closest('.bv-rep, .bv-tans') && !e.disabled && e.offsetParent !== null; })
      .every(function (e) { return String(e.value || '').trim().length > 1; });
  }
  function ensureModels(n) {   // older lessons: show the model answers once the step is complete and saved
    if (TEMPLATE || !DATA || !DATA[n]) return;
    var fb = document.getElementById('fb' + n), host = fb && !fb.classList.contains('hidden') ? fb : null;
    if (!host) { host = document.getElementById('bvm' + n); if (!host) { host = document.createElement('div'); host.id = 'bvm' + n; host.className = 'bv-mbox'; var st = document.getElementById('st' + n), btn = document.querySelector('button[data-step="' + n + '"]'); var at = st || btn; if (at) at.insertAdjacentElement('afterend', host); else if (stepEl(n)) stepEl(n).appendChild(host); else return; } }
    var old = host.querySelector('.bv-model, .bv-lock'); if (old) old.remove();
    var div = document.createElement('div'), done = complete(n) || (store.get('shown') || {})[n];
    div.innerHTML = done ? MODELS(n) : '<p class="bv-lock small">🔒 Model answers appear when you have answered every question in this step. Fill in the empty boxes and press Save again.</p>';
    if (done) { var sh = store.get('shown') || {}; sh[n] = 1; store.set('shown', sh); }
    host.appendChild(div.firstChild); if (done) addButton(n);
  }
  var css = document.createElement('style');
  css.textContent = '.bv-tans{margin:14px 0;border:2px solid #7c3aed;border-radius:14px;background:#f5f3ff;padding:10px 14px;color:#2e1065}.bv-tans>h4{margin:0 0 6px;color:#5b21b6}' +
    '.bv-rep{margin:12px 0;border:2px solid #c2410c;border-left-width:6px;border-radius:12px;background:#fff7ed;padding:10px 14px;color:#431407}.bv-rep h4{margin:0 0 4px;color:#9a3412}' +
    '.bv-repbtn{width:auto!important;max-width:max-content!important;display:inline-block!important;margin-top:10px;border:2px solid #c2410c;background:#fff;color:#9a3412;border-radius:999px;padding:8px 16px;font:700 .95rem inherit;cursor:pointer}.bv-repbtn:hover{background:#ffedd5}' +
    '.bv-repres{margin-top:12px}.bv-mbox{margin-top:10px}.bv-model{background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:10px 14px;margin-top:10px}.bv-lock{color:#9a3412}';
  document.head.appendChild(css);

  /* ---------- 1. teacher view ---------- */
  function teacherView() {
    if (window.__bvTeacherShown) return; window.__bvTeacherShown = true;
    Object.keys(TEMPLATE ? SPEC.models || {} : DATA).forEach(function (n) {
      var sec = document.getElementById('step' + n), html = ORIG_MODELS(Number(n)); if (!sec || !html) return;
      var box = document.createElement('div'); box.className = 'bv-tans';
      box.innerHTML = '<h4>👩‍🏫 Teacher view: model answers for this step</h4><p class="small">Students see these after they answer every question and press Save step.</p>' + html.replace(/<summary>[\s\S]*?<\/summary>/, '<summary><b>Model answers and marking points</b></summary>');
      var btn = sec.querySelector('button[data-step]'), anchor = btn ? (btn.closest('.savecard') || btn.parentNode) : null;
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor); else sec.appendChild(box);
    });
  }
  document.addEventListener('bv-teacher', teacherView);
  if (window.BV_TEACHER) teacherView();

  /* ---------- 2. repeat a step ---------- */
  function fields(sec) { return [].slice.call(sec.querySelectorAll(TEMPLATE ? '[data-save]' : 'textarea, select, input[type=text], input[type=number], input:not([type])')).filter(function (e) { return !e.closest('.bv-rep, .bv-tans'); }); }
  function snapshot(sec) { return fields(sec).map(function (e) { return { k: e.getAttribute('data-save'), v: e.type === 'checkbox' || e.type === 'radio' ? (e.checked ? e.value || 'on' : '') : e.value, label: e.getAttribute('data-label') || '' }; }); }
  function clear(sec) {
    fields(sec).forEach(function (e) {
      if (e.type === 'checkbox' || e.type === 'radio') e.checked = false; else e.value = '';
      e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  function addButton(n) {
    var box = document.getElementById('fb' + n); if (!box || box.classList.contains('hidden') || !TEMPLATE) box = document.getElementById('bvm' + n) || box;
    if (!box || box.querySelector('.bv-repbtn')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'bv-repbtn';
    b.textContent = '↻ Repeat this step' + (counts[n] ? ' again (done ' + counts[n] + ')' : '');
    b.onclick = function () { start(n); }; box.appendChild(b);
  }
  function start(n) {
    var sec = document.getElementById('step' + n); if (!sec) return;
    var k = (counts[n] || 0) + 1, first = store.get('first' + n);
    if (!first) { first = snapshot(sec); store.set('first' + n, first); }   // keep the student's first answers
    REP[n] = k; clear(sec);
    var old = sec.querySelector('.bv-rep.banner'); if (old) old.remove();
    var m = (window.marks || {})[n], ban = document.createElement('div'); ban.className = 'bv-rep banner';
    ban.innerHTML = '<h4>↻ Repeat ' + k + ' of this step</h4><div>Answer again without looking at the model answers. ' +
      (m && m.max ? 'Your first mark (<b>' + m.score + ' / ' + m.max + '</b>) still counts; ' : 'Your first answers still count; ') + 'this repeat is marked and sent to your teacher labelled <b>Repeat ' + k + '</b>.</div>' +
      '<details class="small"><summary>See my first answers</summary><ul>' + first.filter(function (f) { return f.v; }).map(function (f) { return '<li>' + E2((f.label ? f.label + ': ' : '') + f.v) + '</li>'; }).join('') + '</ul></details>';
    sec.insertBefore(ban, sec.children[1] || null);
    var box = document.getElementById('fb' + n); if (box) box.classList.add('hidden');
    var bm = document.getElementById('bvm' + n); if (bm) bm.hidden = true;
    var res = document.getElementById('rep' + n); if (res) res.remove();
    var st = document.getElementById('st' + n); if (st) { st.className = 'status'; st.textContent = 'Repeat ' + k + ': answer every question, then press Save step.'; }
    ban.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function finishRepeat(n, btn) {
    var k = REP[n], sec = document.getElementById('step' + n), st = document.getElementById('st' + n);
    var name = nameEl.value.trim(), cls = clsEl.value.trim();
    if (!name || !cls) { st.className = 'status err'; st.textContent = 'Type your name and class at the top first.'; nameEl.focus(); return; }
    var m = MARK(n);
    if (m && m.missing || (!TEMPLATE && !complete(n))) { st.className = 'status err'; st.textContent = 'Repeat ' + k + ': answer every question first' + (m && m.missing ? ' (' + m.missing + ' still empty).' : '.'); return; }
    counts[n] = k; store.set('repeats', counts); delete REP[n];
    var ban = sec.querySelector('.bv-rep.banner'); if (ban) ban.remove();
    var res = document.createElement('div'); res.className = 'bv-rep bv-repres'; res.id = 'rep' + n;
    var tips = m ? TIPS(m) : [];
    res.innerHTML = '<h4>↻ Repeat ' + k + (m ? ': ' + m.score + ' / ' + m.max : '') + '</h4>' + (m ? '<div>' + E2(LEAD(m)) + '</div>' : '<div>Repeat saved.</div>') +
      (tips.length ? '<ul>' + tips.map(function (x) { return '<li>' + E2(x) + '</li>'; }).join('') + '</ul>' : '') + ORIG_MODELS(n) +
      '<div class="small">Practice only: your first mark' + ((window.marks || {})[n] && marks[n].max ? ' (' + marks[n].score + ' / ' + marks[n].max + ')' : '') + ' is the one that counts.</div>';
    var fb = document.getElementById('fb' + n), bm2 = document.getElementById('bvm' + n);
    if (bm2) { bm2.hidden = false; if (fb && !fb.innerHTML.trim()) fb.classList.add('hidden'); else if (fb) fb.classList.remove('hidden'); bm2.insertAdjacentElement('afterend', res); }
    else if (fb) { fb.classList.remove('hidden'); fb.parentNode.insertBefore(res, fb.nextSibling); } else sec.appendChild(res);
    var again = document.createElement('button'); again.type = 'button'; again.className = 'bv-repbtn'; again.textContent = '↻ Repeat again'; again.onclick = function () { start(n); }; res.appendChild(again);
    var parts = snapshot(sec).filter(function (f) { return f.v; }).map(function (f) { return (f.label || f.k) + ': ' + String(f.v).replace(/\s*\n\s*/g, ' / '); });
    var line = '[REPEAT ' + k + ' · practice, not counted' + (m ? ' · ' + m.score + '/' + m.max : '') + '] ' + parts.join('  ‖  ');
    var body = new URLSearchParams();
    body.append(FORM.lesson, LESSON_ID); body.append(FORM.name, name); body.append(FORM.cls, cls); body.append(FORM.step, n + ' · Repeat ' + k); body.append(FORM.answers, line);
    btn.disabled = true; st.className = 'status'; st.textContent = 'Sending Repeat ' + k + '...';
    var time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    fetch(FORM.url, { method: 'POST', mode: 'no-cors', body: body })
      .then(function () { btn.disabled = false; st.className = 'status ok'; st.textContent = 'Repeat ' + k + ' marked and sent to your teacher at ' + time + '.'; })
      .catch(function () { btn.disabled = false; st.className = 'status err'; st.textContent = 'Repeat ' + k + ' not sent. Check your internet and press Save step again.'; counts[n] = k - 1; store.set('repeats', counts); REP[n] = k; });
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  // during a repeat, Save step marks the repeat instead of the (locked) first attempt
  document.querySelectorAll('button[data-step]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var n = Number(btn.getAttribute('data-step'));
      if (REP[n]) { e.stopImmediatePropagation(); e.preventDefault(); finishRepeat(n, btn); return; }
      setTimeout(function () { if (TEMPLATE) addButton(n); else ensureModels(n); }, 30);   // first save: show answers (older lessons) and offer a repeat
    }, true);
  });
  var origShow = window.show;
  if (TEMPLATE && typeof origShow === 'function') window.show = function (n, m) { origShow(n, m); addButton(n); };
  var savedSteps = Object.keys(window.marks || {}).concat(Object.keys(store.get('saved') || {}), Object.keys(store.get('shown') || {}));
  setTimeout(function () { savedSteps.forEach(function (n) { if (TEMPLATE) addButton(Number(n)); else ensureModels(Number(n)); }); }, 600);
})();
