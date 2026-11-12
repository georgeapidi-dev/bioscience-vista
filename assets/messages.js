/* Learnova · Messages: private conversations between students, teachers and admin.
   Students and parents write to their teachers and admins; teachers and admins can write to anyone. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), ME, PEOPLE = {}, MSGS = [], who = null, poll = null;
  var css = document.createElement('style');
  css.textContent = '.mx{display:grid;grid-template-columns:minmax(0,300px) minmax(0,1fr);gap:14px;min-height:60vh}' +
    '.mx-list{display:grid;gap:6px;align-content:start;max-height:72vh;overflow:auto}.mx-list button{display:grid;gap:2px;text-align:left;width:100%;border:1px solid var(--line);background:var(--raised);border-radius:12px;padding:10px 12px;cursor:pointer;color:var(--ink);font:inherit}' +
    '.mx-list button[aria-current=true]{border-color:var(--violet);box-shadow:0 0 0 2px color-mix(in srgb,var(--violet) 30%,transparent)}.mx-list b{display:flex;gap:6px;align-items:center}.mx-list .u{background:#ef4444;color:#fff;border-radius:999px;font-size:.72rem;padding:1px 7px}' +
    '.mx-list small{color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mx-th{display:flex;flex-direction:column;gap:8px;border:1px solid var(--line);border-radius:14px;background:var(--surface);padding:12px;min-height:50vh}' +
    '.mx-msgs{flex:1;overflow:auto;display:flex;flex-direction:column;gap:8px;max-height:56vh;padding:4px}.mx-b{max-width:78%;padding:9px 12px;border-radius:14px;background:var(--raised);border:1px solid var(--line);white-space:pre-wrap;word-wrap:break-word}' +
    '.mx-b.me{align-self:flex-end;background:linear-gradient(120deg,#7c3aed,#2563eb);color:#fff;border:0}.mx-b time{display:block;font-size:.72rem;opacity:.75;margin-top:3px}' +
    '.mx-form{display:flex;gap:8px;align-items:flex-end}.mx-form textarea{flex:1;min-height:52px;resize:vertical;border:1px solid var(--line);border-radius:12px;padding:10px;font:inherit;background:var(--raised);color:var(--ink)}' +
    '.mx-new{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.mx-new select{flex:1;min-width:200px;padding:9px;border-radius:10px;border:1px solid var(--line);background:var(--raised);color:var(--ink);font:inherit}' +
    '@media(max-width:720px){.mx{grid-template-columns:minmax(0,1fr)}.mx.thread .mx-list{display:none}.mx:not(.thread) .mx-th{display:none}.mx-b{max-width:90%}}';
  document.head.appendChild(css);

  S.guard(app, { allowPending: true, anyone: true }).then(function (me) { ME = me; load(); }).catch(function () {});

  function load() {
    Promise.all([S.db.rpc('message_contacts'), S.db.from('messages').select('*').or('sender.eq.' + ME.user.id + ',recipient.eq.' + ME.user.id).order('created_at', { ascending: true }).limit(2000)]).then(function (x) {
      if (x[0].error) { app.innerHTML = '<section class="panel"><p class="msg">' + E(S.nice(x[0].error)) + '</p></section>'; return; }
      (x[0].data || []).forEach(function (p) { PEOPLE[p.id] = p; });
      MSGS = x[1].data || [];
      var h = new URLSearchParams(location.search).get('to'); if (h && PEOPLE[h]) who = h;
      draw();
      if (!poll) poll = setInterval(refresh, 15000);
    });
  }
  function refresh() {
    S.db.from('messages').select('*').or('sender.eq.' + ME.user.id + ',recipient.eq.' + ME.user.id).order('created_at', { ascending: true }).limit(2000).then(function (r) {
      if (r.error || !r.data) return; var changed = r.data.length !== MSGS.length || r.data.some(function (m, i) { return !MSGS[i] || MSGS[i].read_at !== m.read_at; });
      MSGS = r.data; if (changed) draw(true);
    });
  }
  function other(m) { return m.sender === ME.user.id ? m.recipient : m.sender; }
  function name(id) { var p = PEOPLE[id]; return p ? p.name : 'Someone'; }
  function tag(id) { var p = PEOPLE[id]; return p ? p.role + (p.class_name ? ' · ' + p.class_name : '') : ''; }
  function when(t) { var d = new Date(t), now = new Date(); return d.toDateString() === now.toDateString() ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); }

  function draw(keep) {
    var convo = {};
    MSGS.forEach(function (m) { var o = other(m), c = convo[o] = convo[o] || { id: o, last: m, unread: 0 }; c.last = m; if (m.recipient === ME.user.id && !m.read_at) c.unread++; });
    var list = Object.keys(convo).map(function (k) { return convo[k]; }).sort(function (a, b) { return a.last.created_at < b.last.created_at ? 1 : -1; });
    var opts = Object.keys(PEOPLE).map(function (k) { return PEOPLE[k]; });
    var staffOnly = !ME.staff;
    var ta = app.querySelector('#mxt'), draft = ta ? ta.value : '';
    app.innerHTML = '<section class="panel"><div class="row2"><div><p class="label">Private messages</p><h2 style="margin:0">Messages</h2></div></div>' +
      '<div class="mx-new"><select id="mxp" aria-label="Write to"><option value="">✏️ New message to…</option>' + groups(opts) + '</select></div>' +
      (staffOnly ? '<p class="small muted">Write to your teachers here. Only you and the person you write to can read a conversation.</p>' : '<p class="small muted">Write to any student, parent, teacher or admin. Only the two people in a conversation can read it.</p>') +
      '<div class="mx' + (who ? ' thread' : '') + '"><div class="mx-list" role="list">' + (list.length ? list.map(function (c) {
        return '<button type="button" data-who="' + c.id + '" aria-current="' + (c.id === who) + '"><b>' + E(name(c.id)) + (c.unread ? '<span class="u">' + c.unread + ' new</span>' : '') + '</b><small>' + E(tag(c.id)) + '</small><small>' + (c.last.sender === ME.user.id ? 'You: ' : '') + E(c.last.body) + '</small></button>';
      }).join('') : '<p class="emptybox">No messages yet. Choose someone above to start a conversation.</p>') + '</div>' +
      '<div class="mx-th">' + (who ? thread(who) : '<p class="muted">Choose a conversation, or start a new message.</p>') + '</div></div></section>';
    app.querySelector('#mxp').onchange = function () { if (this.value) { who = this.value; draw(); } };
    app.querySelectorAll('[data-who]').forEach(function (b) { b.onclick = function () { who = b.getAttribute('data-who'); draw(); }; });
    var back = app.querySelector('#mxback'); if (back) back.onclick = function () { who = null; draw(); };
    var f = app.querySelector('#mxf');
    if (f) {
      var t = f.querySelector('textarea'); if (keep && draft) t.value = draft;
      var box = app.querySelector('.mx-msgs'); box.scrollTop = box.scrollHeight;
      t.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) f.requestSubmit(); });
      f.onsubmit = function (e) {
        e.preventDefault(); var body = t.value.trim(); if (!body) return; var btn = f.querySelector('button'); btn.disabled = true;
        S.db.from('messages').insert({ sender: ME.user.id, recipient: who, body: body }).select('*').single().then(function (r) {
          btn.disabled = false; if (r.error) { f.querySelector('.msg').textContent = S.nice(r.error); return; }
          MSGS.push(r.data); t.value = ''; draw();
        });
      };
      var unread = MSGS.filter(function (m) { return m.sender === who && m.recipient === ME.user.id && !m.read_at; }).map(function (m) { return m.id; });
      if (unread.length) S.db.from('messages').update({ read_at: new Date().toISOString() }).in('id', unread).then(function () {
        MSGS.forEach(function (m) { if (unread.indexOf(m.id) >= 0) m.read_at = new Date().toISOString(); });
        app.querySelectorAll('[data-who="' + who + '"] .u').forEach(function (u) { u.remove(); });
      });
    }
  }
  function groups(opts) {
    var by = {}; opts.forEach(function (p) { var g = p.role === 'Student' ? 'Students' + (p.class_name ? ' · ' + p.class_name : '') : p.role + 's'; (by[g] = by[g] || []).push(p); });
    return Object.keys(by).sort(function (a, b) { var r = function (g) { return /^Admin/.test(g) ? 0 : /^Teacher/.test(g) ? 1 : /^Student/.test(g) ? 2 : 3; }; return r(a) - r(b) || a.localeCompare(b); }).map(function (g) {
      return '<optgroup label="' + E(g) + '">' + by[g].map(function (p) { return '<option value="' + p.id + '">' + E(p.name) + '</option>'; }).join('') + '</optgroup>';
    }).join('');
  }
  function thread(id) {
    var ms = MSGS.filter(function (m) { return other(m) === id; });
    return '<div class="row2"><div><b>' + E(name(id)) + '</b> <span class="small muted">' + E(tag(id)) + '</span></div><button type="button" class="btn sm" id="mxback">← All conversations</button></div>' +
      '<div class="mx-msgs" aria-live="polite">' + (ms.length ? ms.map(function (m) {
        var mine = m.sender === ME.user.id;
        return '<div class="mx-b' + (mine ? ' me' : '') + '">' + E(m.body) + '<time>' + when(m.created_at) + (mine && m.read_at ? ' · seen' : '') + '</time></div>';
      }).join('') : '<p class="muted small">No messages yet. Say hello!</p>') + '</div>' +
      '<form class="mx-form" id="mxf"><textarea placeholder="Write a message… (Ctrl + Enter to send)" aria-label="Your message" maxlength="4000" required></textarea><button class="btn main sm" type="submit">Send</button></form><p class="msg small" role="alert"></p>';
  }
})();
