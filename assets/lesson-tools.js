/* BioScience Vista · lesson add-on for the six-step lesson pages
   1. Teacher view: a signed-in teacher sees the model answers in every step, all the time.
   2. Repeat: after a step is saved (and its model answers shown), a student can repeat it. Each repeat is marked,
      labelled "Repeat 1", "Repeat 2"… and sent to the teacher, but the first mark stays the one that counts. */
(function () {
  if (typeof window.SPEC !== 'object' || typeof window.modelsHtml !== 'function' || typeof window.mark !== 'function') return;
  var ORIG_MODELS = window.modelsHtml, REP = {}, counts = store.get('repeats') || {};
  var css = document.createElement('style');
  css.textContent = '.bv-tans{margin:14px 0;border:2px solid #7c3aed;border-radius:14px;background:#f5f3ff;padding:10px 14px;color:#2e1065}.bv-tans>h4{margin:0 0 6px;color:#5b21b6}' +
    '.bv-rep{margin:12px 0;border:2px solid #c2410c;border-left-width:6px;border-radius:12px;background:#fff7ed;padding:10px 14px;color:#431407}.bv-rep h4{margin:0 0 4px;color:#9a3412}' +
    '.bv-repbtn{margin-top:10px;border:2px solid #c2410c;background:#fff;color:#9a3412;border-radius:999px;padding:8px 16px;font:700 .95rem inherit;cursor:pointer}.bv-repbtn:hover{background:#ffedd5}' +
    '.bv-repres{margin-top:12px}';
  document.head.appendChild(css);

  /* ---------- 1. teacher view ---------- */
  function teacherView() {
    if (window.__bvTeacherShown) return; window.__bvTeacherShown = true;
    Object.keys(SPEC.models || {}).forEach(function (n) {
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
  function fields(sec) { return [].slice.call(sec.querySelectorAll('[data-save]')).filter(function (e) { return !e.closest('.bv-rep'); }); }
  function snapshot(sec) { return fields(sec).map(function (e) { return { k: e.getAttribute('data-save'), v: e.type === 'checkbox' || e.type === 'radio' ? (e.checked ? e.value || 'on' : '') : e.value, label: e.getAttribute('data-label') || '' }; }); }
  function clear(sec) {
    fields(sec).forEach(function (e) {
      if (e.type === 'checkbox' || e.type === 'radio') e.checked = false; else e.value = '';
      e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  function addButton(n) {
    var box = document.getElementById('fb' + n); if (!box || box.classList.contains('hidden') || box.querySelector('.bv-repbtn')) return;
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
    var m = marks[n], ban = document.createElement('div'); ban.className = 'bv-rep banner';
    ban.innerHTML = '<h4>↻ Repeat ' + k + ' of this step</h4><div>Answer again without looking at the model answers. ' +
      (m ? 'Your first mark (<b>' + m.score + ' / ' + m.max + '</b>) still counts; ' : '') + 'this repeat is marked and sent to your teacher labelled <b>Repeat ' + k + '</b>.</div>' +
      '<details class="small"><summary>See my first answers</summary><ul>' + first.filter(function (f) { return f.v; }).map(function (f) { return '<li>' + esc((f.label ? f.label + ': ' : '') + f.v) + '</li>'; }).join('') + '</ul></details>';
    sec.insertBefore(ban, sec.children[1] || null);
    var box = document.getElementById('fb' + n); if (box) box.classList.add('hidden');
    var res = document.getElementById('rep' + n); if (res) res.remove();
    var st = document.getElementById('st' + n); if (st) { st.className = 'status'; st.textContent = 'Repeat ' + k + ': answer every question, then press Save step.'; }
    ban.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function finishRepeat(n, btn) {
    var k = REP[n], sec = document.getElementById('step' + n), st = document.getElementById('st' + n);
    var name = nameEl.value.trim(), cls = clsEl.value.trim();
    if (!name || !cls) { st.className = 'status err'; st.textContent = 'Type your name and class at the top first.'; nameEl.focus(); return; }
    var m = mark(n);
    if (m && m.missing) { st.className = 'status err'; st.textContent = 'Repeat ' + k + ': answer every question first (' + m.missing + ' still empty).'; return; }
    counts[n] = k; store.set('repeats', counts); delete REP[n];
    var ban = sec.querySelector('.bv-rep.banner'); if (ban) ban.remove();
    var res = document.createElement('div'); res.className = 'bv-rep bv-repres'; res.id = 'rep' + n;
    var tips = m ? tipsOf(m) : [];
    res.innerHTML = '<h4>↻ Repeat ' + k + (m ? ': ' + m.score + ' / ' + m.max : '') + '</h4>' + (m ? '<div>' + esc(lead(m)) + '</div>' : '<div>Repeat saved.</div>') +
      (tips.length ? '<ul>' + tips.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') + ORIG_MODELS(n) +
      '<div class="small">Practice only: your first mark' + (marks[n] ? ' (' + marks[n].score + ' / ' + marks[n].max + ')' : '') + ' is the one that counts.</div>';
    var fb = document.getElementById('fb' + n); if (fb) { fb.classList.remove('hidden'); fb.parentNode.insertBefore(res, fb.nextSibling); } else sec.appendChild(res);
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
      setTimeout(function () { addButton(n); }, 0);   // first save: offer a repeat once the model answers are showing
    }, true);
  });
  var origShow = window.show;
  if (typeof origShow === 'function') window.show = function (n, m) { origShow(n, m); addButton(n); };
  Object.keys(marks).forEach(function (n) { addButton(Number(n)); });
  Object.keys(store.get('saved') || {}).forEach(function (n) { addButton(Number(n)); });
})();
