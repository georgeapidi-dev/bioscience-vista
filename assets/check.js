/* Learnova · Live Check (/check/).
   Teacher (/check/?class=ID&n=NAME): type one question (options or an open answer), send it to the class, and watch the
   answers arrive as a live chart with names; close it to reveal the answer to students. Past checks stay listed.
   Student (/check/): the page waits for a check from any of their classes, shows it at once, and after the teacher
   closes it shows the correct answer and how the class answered (no names). The answer key never reaches students
   while a check is open: it is read only by database functions (migration 030). */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  var QS = new URLSearchParams(location.search), CLS = /^[0-9a-f-]{36}$/.test(QS.get('class') || '') ? QS.get('class') : null, CNAME = (QS.get('n') || '').slice(0, 80);
  var me, timer = null, chans = {}, L = 'ABCDEF';
  var CSS = '.ck-bar{display:grid;grid-template-columns:minmax(120px,34%) 1fr auto;gap:8px;align-items:center;margin:6px 0}.ck-bar .t{font-weight:700;overflow-wrap:anywhere}.ck-bar .b{height:26px;border-radius:8px;background:#e2e8f0;overflow:hidden}.ck-bar .b i{display:block;height:100%;background:var(--k,#6366f1);transition:width .4s}' +
    '.ck-bar.ok .b i{background:#16a34a}.ck-opt{display:block;width:100%;text-align:left;font:700 1.05rem inherit;border:2px solid #c7d2fe;background:#fff;color:#1e1b4b;border-radius:14px;padding:14px 16px;margin:8px 0;cursor:pointer}.ck-opt[aria-pressed=true]{background:#4f46e5;color:#fff;border-color:#4f46e5}' +
    '.ck-opt.ok{border-color:#16a34a;background:#dcfce7;color:#14532d}.ck-opt.no{border-color:#fecaca;background:#fef2f2;color:#7f1d1d}.ck-q{font:800 1.35rem var(--head,inherit);margin:6px 0 10px}.ck-names{display:flex;flex-wrap:wrap;gap:6px}.ck-names span{font:600 .8rem system-ui;border-radius:999px;padding:3px 9px;background:#f1f5f9}' +
    '.ck-names span.y{background:#dcfce7;color:#166534}.ck-names span.n{background:#fee2e2;color:#991b1b}.ck-names span.w{background:#fef3c7;color:#92400e}.ck-big{font:800 2.2rem var(--head,inherit)}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  var missing = function (e) { return /live_check|schema cache|does not exist|PGRST20/.test(String(e && (e.message || e.code) || e)); };
  var notReady = function () { app.innerHTML = '<section class="panel"><h2>⚡ Live Check</h2><p>Live Check is being switched on and will be ready here shortly.</p></section>'; };
  function chan(cid) { if (!S.db.channel) return null; if (!chans[cid]) { chans[cid] = S.db.channel('check-class-' + cid, { config: { broadcast: { self: false } } }); } return chans[cid]; }

  S.guard(app, { school: true, anyone: true }).then(function (m) {
    me = m; var teach = m.admin || m.staff || m.roles.indexOf('teacher') >= 0 || m.roles.indexOf('school_teacher') >= 0;
    if (teach && CLS) teacher(); else if (teach) pickClass(); else student();
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  // ------------------------------------------------------------ teacher
  function pickClass() {
    S.db.from('classes').select('id,name').eq('teacher_id', me.user.id).is('archived_at', null).order('name').then(function (r) { var cs = r.data || [];
      app.innerHTML = '<div class="row2 cband" style="--k:#4f46e5"><div><p class="label">Live Check</p><h2 style="margin:0">⚡ Ask your class one question, see every answer</h2></div></div><section class="panel"><h3>Choose a class</h3>' +
        (cs.length ? '<div class="cta" style="justify-content:flex-start">' + cs.map(function (c) { return '<a class="btn" href="/check/?class=' + c.id + '&n=' + encodeURIComponent(c.name) + '">' + E(c.name) + '</a>'; }).join('') + '</div>' : '<p class="muted">You have no classes yet. Create one in My classes.</p>') + '</section>'; });
  }
  function teacher() {
    clearInterval(timer);
    app.innerHTML = '<div class="row2 cband" style="--k:#4f46e5"><div><p class="label">Live Check' + (CNAME ? ' · ' + E(CNAME) : '') + '</p><h2 style="margin:0">⚡ Ask one question, see every answer</h2><p class="small" style="margin:4px 0 0">Students open <b>⚡ Live check</b> on their dashboard. The question appears on their screens the moment you send it.</p></div><div class="cta"><a class="btn sm" href="/teach/#classes/' + CLS + '">← Back to the class</a></div></div>' +
      '<section class="panel" id="ckf"></section><section class="panel" id="ckl"><p class="small muted">Loading…</p></section>';
    form(); history();
  }
  function form() {
    var el = app.querySelector('#ckf');
    el.innerHTML = '<h3>New check</h3><form id="nf" class="form"><label class="f">Question<textarea id="q" rows="2" maxlength="600" required placeholder="e.g. Where does the Krebs cycle take place?"></textarea></label>' +
      '<div id="opts">' + [0, 1, 2, 3].map(function (i) { return '<label class="row2" style="gap:8px;justify-content:flex-start;margin:4px 0"><input type="radio" name="ok" value="' + i + '" title="Mark as the correct answer" aria-label="Option ' + L[i] + ' is correct"><b>' + L[i] + '</b><input class="o" maxlength="160" placeholder="Option ' + L[i] + (i > 1 ? ' (optional)' : '') + '" style="flex:1" aria-label="Option ' + L[i] + '"></label>'; }).join('') + '</div>' +
      '<p class="small muted">Tick the circle beside the correct option (optional). Leave all options empty to ask for a typed answer.</p><p class="msg" id="nm" role="alert"></p><button class="btn main" type="submit">⚡ Send to the class</button></form>';
    el.querySelector('#nf').onsubmit = function (e) { e.preventDefault(); var m = el.querySelector('#nm'), opts = [].map.call(el.querySelectorAll('.o'), function (x) { return x.value.trim(); }), pick = el.querySelector('[name=ok]:checked');
      var used = opts.filter(Boolean); if (used.length === 1) { m.textContent = 'Give at least two options, or none for a typed answer.'; return; }
      var correct = null; if (pick && used.length) { var txt = opts[+pick.value]; if (!txt) { m.textContent = 'The option you marked as correct is empty.'; return; } correct = used.indexOf(txt); }
      m.textContent = 'Sending…';
      S.db.rpc('live_check_send', { cls: CLS, question: el.querySelector('#q').value.trim(), opts: used.length ? used : null, correct_option: correct }).then(function (r) {
        if (r.error) { if (missing(r.error)) return notReady(); m.textContent = S.nice(r.error); return; }
        var c = chan(CLS); if (c) { var send = function () { c.send({ type: 'broadcast', event: 'check', payload: { id: r.data } }); }; c.subscribe(function (s) { if (s === 'SUBSCRIBED') send(); }); send(); }
        form(); history(r.data); }); };
  }
  function history(openId) {
    S.db.from('live_checks').select('*').eq('class_id', CLS).order('created_at', { ascending: false }).limit(30).then(function (r) {
      var el = app.querySelector('#ckl'); if (r.error) { if (missing(r.error)) return notReady(); el.innerHTML = '<p class="msg">' + E(S.nice(r.error)) + '</p>'; return; }
      var rows = r.data || [], live = rows.filter(function (c) { return c.status === 'open'; })[0];
      el.innerHTML = (live ? '<div id="live"></div>' : '') + '<h3>' + (rows.length ? 'Earlier checks' : 'No checks sent yet') + '</h3>' + rows.filter(function (c) { return c !== live; }).map(function (c) {
        return '<details class="item" data-c="' + c.id + '"><summary><b>' + E(c.prompt) + '</b> <span class="small muted">· ' + E(new Date(c.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })) + '</span></summary><div class="res small muted">Open to see the results.</div></details>'; }).join('');
      el.querySelectorAll('details[data-c]').forEach(function (d) { d.ontoggle = function () { if (d.open) results(rows.filter(function (c) { return c.id === d.getAttribute('data-c'); })[0], d.querySelector('.res')); }; });
      clearInterval(timer);
      if (live) { var box = el.querySelector('#live'), tick = function () { results(live, box, true); }; tick(); timer = setInterval(tick, 2500);
        var c = chan(CLS); if (c) c.on('broadcast', { event: 'answered' }, tick).subscribe(); }
    });
  }
  function results(c, el, live) {
    S.db.rpc('live_check_results', { cid: c.id }).then(function (r) { if (r.error || !el.isConnected) return; var rs = r.data || [], opts = c.options, key = rs[0] ? rs[0].correct : null;
      var done = rs.filter(function (x) { return x.choice != null || x.answer; }), wait = rs.filter(function (x) { return x.choice == null && !x.answer; });
      var h = live ? '<p class="label" style="color:#16a34a">● Live now</p><p class="ck-q">' + E(c.prompt) + '</p>' : '';
      h += '<p><span class="ck-big">' + done.length + '</span> of ' + rs.length + ' answered' + (key != null && done.length ? ' · <b>' + Math.round(100 * done.filter(function (x) { return x.choice === key; }).length / done.length) + '%</b> correct' : '') + '</p>';
      if (opts) h += opts.map(function (o, i) { var n = done.filter(function (x) { return x.choice === i; }), pc = done.length ? Math.round(100 * n.length / done.length) : 0;
          return '<div class="ck-bar' + (i === key ? ' ok' : '') + '"><span class="t">' + L[i] + '. ' + E(o) + (i === key ? ' ✓' : '') + '</span><span class="b"><i style="width:' + pc + '%"></i></span><b>' + n.length + '</b></div>' +
            (n.length ? '<div class="ck-names" style="margin:0 0 6px">' + n.map(function (x) { return '<span class="' + (key == null ? '' : i === key ? 'y' : 'n') + '">' + E(x.full_name || 'Student') + '</span>'; }).join('') + '</div>' : ''); }).join('');
      else h += done.map(function (x) { return '<div class="item"><span class="meta">' + E(x.full_name || 'Student') + '</span>' + E(x.answer) + '</div>'; }).join('');
      if (wait.length) h += '<p class="small" style="margin:8px 0 4px"><b>Not answered yet</b></p><div class="ck-names">' + wait.map(function (x) { return '<span class="w">' + E(x.full_name || 'Student') + '</span>'; }).join('') + '</div>';
      if (live) h += '<div class="cta" style="justify-content:flex-start;margin-top:12px"><button class="btn main" type="button" id="cls">Close and show the answer to students</button></div>';
      el.innerHTML = h;
      var b = el.querySelector('#cls'); if (b) b.onclick = function () { b.disabled = true; clearInterval(timer); S.db.rpc('live_check_close', { cid: c.id }).then(function () { var ch = chan(CLS); if (ch) ch.send({ type: 'broadcast', event: 'closed', payload: { id: c.id } }); history(); }); };
    });
  }

  // ------------------------------------------------------------ student
  var shown = null;
  function student() {
    var ids = (me.classes || []).map(function (c) { return c.id; });
    app.innerHTML = '<div class="row2 cband" style="--k:#4f46e5"><div><p class="label">Live Check</p><h2 style="margin:0">⚡ Questions from your teacher, live</h2></div><div class="cta"><a class="btn sm" href="/dashboard/">← My dashboard</a></div></div><section class="panel" id="ck"><p class="muted">Looking for a question…</p></section>';
    if (!ids.length) { app.querySelector('#ck').innerHTML = '<p>Join a class first; your teacher\'s questions will then appear here.</p>'; return; }
    var look = function () { S.db.from('live_checks').select('*').in('class_id', ids).order('created_at', { ascending: false }).limit(1).then(function (r) {
      if (r.error) { if (missing(r.error)) { clearInterval(timer); notReady(); } return; } var c = (r.data || [])[0];
      if (!c || (c.status === 'closed' && Date.now() - new Date(c.closed_at || c.created_at).getTime() > 20 * 60000)) { if (shown !== 'wait') { shown = 'wait'; app.querySelector('#ck').innerHTML = '<p class="ck-q">⏳ Waiting for your teacher\'s next question…</p><p class="small muted">Keep this page open. The question appears here by itself.</p>'; } return; }
      var key = c.id + c.status; if (shown === key) return; shown = key; if (c.status === 'open') ask(c); else reveal(c); }); };
    look(); timer = setInterval(look, 4000);
    ids.forEach(function (id) { var ch = chan(id); if (ch) ch.on('broadcast', { event: 'check' }, look).on('broadcast', { event: 'closed' }, look).subscribe(); });
  }
  function ask(c) {
    var el = app.querySelector('#ck'), cname = ((me.classes || []).filter(function (x) { return x.id === c.class_id; })[0] || {}).name || '';
    S.db.from('live_check_answers').select('choice,answer').eq('check_id', c.id).eq('student_id', me.user.id).maybeSingle().then(function (r) { var mine = r.data || {};
      el.innerHTML = '<p class="label" style="color:#16a34a">● Live question' + (cname ? ' · ' + E(cname) : '') + '</p><p class="ck-q">' + E(c.prompt) + '</p>' +
        (c.options ? c.options.map(function (o, i) { return '<button type="button" class="ck-opt" data-i="' + i + '" aria-pressed="' + (mine.choice === i) + '">' + L[i] + '. ' + E(o) + '</button>'; }).join('')
          : '<form id="af"><textarea id="at" rows="3" maxlength="400" required style="width:100%" aria-label="Your answer">' + E(mine.answer || '') + '</textarea><button class="btn main" style="margin-top:8px">Send my answer</button></form>') +
        '<p class="msg ok" id="am" role="status">' + (mine.choice != null || mine.answer ? '✔ Answer sent. You can change it until your teacher closes the question.' : '') + '</p>';
      var save = function (row) { var m = el.querySelector('#am'); m.className = 'msg ok'; m.textContent = 'Sending…';
        S.db.from('live_check_answers').upsert(Object.assign({ check_id: c.id, student_id: me.user.id, at: new Date().toISOString() }, row), { onConflict: 'check_id,student_id' }).then(function (x) {
          if (x.error) { m.className = 'msg'; m.textContent = /row-level|policy/.test(x.error.message || '') ? 'This question has just closed.' : S.nice(x.error); return; }
          m.textContent = '✔ Answer sent. You can change it until your teacher closes the question.'; var ch = chan(c.class_id); if (ch) ch.send({ type: 'broadcast', event: 'answered', payload: {} }); }); };
      el.querySelectorAll('.ck-opt').forEach(function (b) { b.onclick = function () { el.querySelectorAll('.ck-opt').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); save({ choice: +b.getAttribute('data-i'), answer: null }); }; });
      var f = el.querySelector('#af'); if (f) f.onsubmit = function (e) { e.preventDefault(); save({ choice: null, answer: el.querySelector('#at').value.trim() }); };
    });
  }
  function reveal(c) {
    var el = app.querySelector('#ck');
    Promise.all([S.db.rpc('live_check_reveal', { cid: c.id }), S.db.from('live_check_answers').select('choice,answer').eq('check_id', c.id).eq('student_id', me.user.id).maybeSingle()]).then(function (x) {
      var rows = x[0].data || [], mine = x[1].data || {}, key = rows[0] ? rows[0].correct : null, total = rows.reduce(function (a, r) { return a + (r.choice != null ? +r.n : 0); }, 0);
      var h = '<p class="label">Question closed</p><p class="ck-q">' + E(c.prompt) + '</p>';
      if (c.options) { h += c.options.map(function (o, i) { var n = +((rows.filter(function (r) { return r.choice === i; })[0] || {}).n || 0);
          return '<div class="ck-opt ' + (key === i ? 'ok' : mine.choice === i && key != null ? 'no' : '') + '" style="cursor:default">' + L[i] + '. ' + E(o) + (key === i ? ' ✓' : '') + (mine.choice === i ? ' · <b>your answer</b>' : '') + '<span class="small" style="float:right">' + (total ? Math.round(100 * n / total) : 0) + '% of the class</span></div>'; }).join('');
        h += '<p class="ck-q">' + (mine.choice == null ? 'You did not answer this one.' : key == null ? 'Thanks for answering.' : mine.choice === key ? '🎉 Correct!' : 'Not this time. Look at the correct answer and ask your teacher why.') + '</p>'; }
      else h += '<div class="item"><span class="meta">Your answer</span>' + E(mine.answer || 'You did not answer this one.') + '</div><p class="small muted">Your teacher will go through the answers with the class.</p>';
      el.innerHTML = h + '<p class="small muted">The next question will appear here by itself.</p>';
    });
  }
})();
