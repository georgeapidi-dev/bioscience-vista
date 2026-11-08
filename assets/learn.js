/* My learning: student dashboard · Learnova */
(function () {
  var app = document.getElementById('app'), E = BV.esc, D = null, tab = 'overview';
  function start() {
    var me = BV.me();
    if (!me) { BV.loginForm(app, function (d) { D = d; draw(); }); return; }
    app.innerHTML = '<p class="muted">Loading your learning…</p>';
    BV.as('student').then(function (d) { if (!d.ok) { if (d.auth === false) { BV.signout(); return; } app.innerHTML = '<p class="msg">' + E(d.error) + '</p>'; return; } D = d; draw(); });
  }
  function tabs() {
    var nq = D.questions.filter(function (q) { return q.reply && q.status === 'Answered'; }).length;
    var T = [['overview', 'Overview'], ['marks', 'Marks & feedback'], ['messages', 'Messages' + (D.messages.length ? '<span class="n">' + D.messages.length + '</span>' : '')], ['ask', 'Ask a question' + (nq ? '<span class="n">' + nq + '</span>' : '')]];
    return '<div class="tabs" role="tablist">' + T.map(function (t) { return '<button role="tab" aria-selected="' + (tab === t[0]) + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
  }
  function fbFor(id) { return D.feedback.filter(function (f) { return f.task === id; })[0]; }
  function taskCard(t, i) {
    var s = D.marks[i], a = D.classAvg[i], pc = s == null ? 0 : Math.round(100 * s / t.max), ap = a == null ? null : Math.round(100 * a / t.max), link = BV.link(t.id), f = fbFor(t.id);
    return '<article class="task"><div class="top2"><div><b>' + E(BV.title(t.id)) + '</b><br><span class="small muted">Class average ' + (a == null ? '–' : a + ' / ' + t.max) + '</span></div>' +
      (s == null ? '<span class="nd">Not done' + (link ? ' · <a href="' + link + '">Start it</a>' : '') + '</span>' : '<span class="score">' + s + ' / ' + t.max + ' (' + pc + '%)</span>') + '</div>' +
      '<div class="bar" aria-hidden="true"><i style="width:' + pc + '%"></i>' + (ap == null ? '' : '<u style="left:' + ap + '%"></u>') + '</div>' +
      (f && f.teacher ? '<div class="fb tch"><h4>Teacher feedback</h4>' + BV.md(f.teacher) + '</div>' : '') +
      (f && f.ai ? '<div class="fb ai"><h4>AI feedback</h4>' + BV.md(f.ai) + '</div>' : '') +
      (s != null && D.aiOn ? '<div class="acts"><button type="button" data-ai="' + E(t.id) + '">' + (f && f.ai ? 'Refresh AI feedback' : 'Get AI feedback') + '</button>' + (link ? '<a href="' + link + '">Open lesson</a>' : '') + '</div>' : '') + '</article>';
  }
  function draw() {
    var done = 0, got = 0, max = 0; D.tasks.forEach(function (t, i) { var s = D.marks[i]; if (s != null) { done++; got += s; max += t.max; } });
    var head = '<div class="row2"><div><p class="label">My learning</p><h2>Hello, ' + E(D.name.split(' ')[0]) + ' 👋</h2><p class="muted small">' + E(D.cls) + '</p></div>' +
      '<div class="cta"><a class="btn sm" href="/exams/">My exams</a><a class="btn sm" href="/forum/">Forum</a><button class="btn sm" type="button" id="so">Sign out</button></div></div>';
    var body = '';
    if (tab === 'overview') {
      body = '<div class="stats"><div class="stat"><span class="small muted">Tasks done</span><b>' + done + ' / ' + D.tasks.length + '</b></div><div class="stat"><span class="small muted">Overall score</span><b>' + (max ? Math.round(100 * got / max) + '%' : '–') + '</b></div>' +
        '<div class="stat"><span class="small muted">Feedback received</span><b>' + D.feedback.length + '</b></div><div class="stat"><span class="small muted">Messages</span><b>' + D.messages.length + '</b></div></div>' +
        '<div class="two"><section class="panel"><h3>To do</h3>' + (D.tasks.filter(function (t, i) { return D.marks[i] == null; }).map(function (t) { var l = BV.link(t.id); return '<p>• ' + (l ? '<a href="' + l + '">' + E(BV.title(t.id)) + '</a>' : E(BV.title(t.id))) + '</p>'; }).join('') || '<p class="muted">All tasks done. Great work!</p>') +
        '<div id="exlist" class="small muted">Checking exams…</div></section>' +
        '<section class="panel"><h3>Latest message</h3>' + (D.messages[0] ? '<b>' + E(D.messages[0].subject) + '</b><p class="small muted">' + E(BV.when(D.messages[0].date)) + '</p><p>' + E(D.messages[0].message).slice(0, 300) + '</p>' : '<p class="muted">No messages yet.</p>') + '</section></div>';
    } else if (tab === 'marks') {
      body = (D.tasks.length ? '<p class="small muted">The dark line on each bar is your class average.' + (D.aiOn ? ' AI feedback suggests how to improve; your teacher\'s feedback appears in green.' : '') + '</p>' + D.tasks.map(taskCard).join('') : '<p class="emptybox">No tasks have been marked for your class yet.</p>');
    } else if (tab === 'messages') {
      body = D.messages.length ? D.messages.map(function (m) { return '<article class="item"><span class="meta">' + E(BV.when(m.date)) + '</span><b>' + E(m.subject) + '</b><div>' + BV.md(m.message) + '</div></article>'; }).join('') : '<p class="emptybox">No messages from your teacher yet.</p>';
    } else if (tab === 'ask') {
      body = '<form class="form" id="askf"><h3>Ask your teacher</h3><label class="f">Your question<textarea id="aq" required maxlength="1500" placeholder="What would you like help with?"></textarea></label>' +
        (D.aiOn ? '<label class="chk"><input type="checkbox" id="aai" checked> Also get an instant hint from the AI helper</label>' : '') +
        '<button class="btn main" type="submit">Send question</button><p class="msg" id="am" role="alert"></p><div id="aiout"></div></form>' +
        '<h3>My questions</h3>' + (D.questions.length ? D.questions.map(function (q) {
          return '<article class="item"><span class="meta">' + E(BV.when(q.date)) + ' · <span class="pill ' + (q.status === 'Answered' ? 'ok' : 'new') + '">' + E(q.status || 'New') + '</span></span><b>' + E(q.question) + '</b>' +
            (q.ai ? '<div class="fb ai"><h4>AI helper</h4>' + BV.md(q.ai) + '</div>' : '') + (q.reply ? '<div class="fb tch"><h4>Teacher reply</h4>' + BV.md(q.reply) + '</div>' : '') + '</article>';
        }).join('') : '<p class="muted">You have not asked anything yet.</p>');
    }
    app.innerHTML = head + tabs() + '<div class="grp">' + body + '</div>';
    app.querySelector('#so').onclick = BV.signout;
    app.querySelectorAll('.tabs button').forEach(function (b) { b.onclick = function () { tab = b.getAttribute('data-t'); draw(); }; });
    app.querySelectorAll('[data-ai]').forEach(function (b) { b.onclick = function () {
      var id = b.getAttribute('data-ai'); b.disabled = true; b.textContent = 'Thinking…';
      BV.as('aiFeedback', { task: id, title: BV.title(id) }).then(function (r) {
        if (!r.ok) { BV.toast(r.error); b.disabled = false; b.textContent = 'Get AI feedback'; return; }
        var f = fbFor(id); if (f) f.ai = r.feedback; else D.feedback.push({ task: id, ai: r.feedback }); draw();
      }); }; });
    var af = app.querySelector('#askf');
    if (af) af.onsubmit = function (e) {
      e.preventDefault(); var m = af.querySelector('#am'), ai = af.querySelector('#aai'); m.className = 'msg'; m.textContent = 'Sending…';
      BV.as('ask', { question: af.querySelector('#aq').value, ai: ai && ai.checked }).then(function (r) {
        if (!r.ok) { m.textContent = r.error; return; }
        m.className = 'msg ok'; m.textContent = 'Sent. Your teacher will reply here.';
        D.questions.unshift({ date: new Date().toISOString(), question: af.querySelector('#aq').value, ai: r.ai, status: 'New' });
        setTimeout(draw, 1200);
      });
    };
    var ex = app.querySelector('#exlist');
    if (ex) BV.as('myExams').then(function (r) {
      if (!r.ok) { ex.textContent = ''; return; }
      var open = r.exams.filter(function (e) { return e.state === 'open' || e.state === 'started'; });
      ex.innerHTML = open.length ? '<p><b>Exams to take:</b></p>' + open.map(function (e) { return '<p>• <a href="/exams/#' + E(e.id) + '">' + E(e.title) + '</a>' + (e.due ? ' (due ' + E(BV.when(e.due)) + ')' : '') + '</p>'; }).join('') : '<p>No exams waiting.</p>';
    });
  }
  start();
})();
