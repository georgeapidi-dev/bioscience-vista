/* Learnova · Discussion forum on Learnova accounts (replaces the old personal-code forum).
   Boards: one per class you belong to (or teach) plus "All classes". Posts appear straight away; teachers can hide
   posts in their classes. Names come from checked database functions, so students never read each other's profiles. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), me, boards = [], cur = null;
  var when = function (t) { try { return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(t)); } catch (e) { return ''; } };
  var who = function (p) { return E(p.author) + (p.is_teacher ? ' <span class="pill t">Teacher</span>' : '') + (p.mine ? ' <span class="pill">you</span>' : ''); };
  S.guard(app, { school: true, anyone: true }).then(function (m) {
    me = m; var teach = m.admin || m.staff || m.roles.indexOf('teacher') >= 0 || m.roles.indexOf('school_teacher') >= 0;
    return (teach ? S.db.from('classes').select('id,name').eq('teacher_id', m.user.id).is('archived_at', null).order('name') : Promise.resolve({ data: m.classes || [] })).then(function (r) {
      var seen = {}; boards = [{ id: null, name: 'All classes' }].concat(((r.data || []).concat(m.classes || [])).filter(function (c) { if (!c || !c.id || seen[c.id]) return false; seen[c.id] = 1; return true; }));
      var q = new URLSearchParams(location.search).get('class'); cur = boards.filter(function (b) { return b.id === q; })[0] || boards[1] || boards[0];
      var t = /^#t\/([0-9a-f-]{36})$/.exec(location.hash); if (t) thread(t[1]); else list();
    });
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });
  window.addEventListener('hashchange', function () { if (!me) return; var t = /^#t\/([0-9a-f-]{36})$/.exec(location.hash); if (t) thread(t[1]); else list(); });

  function fail(e) { var m = String(e && e.message || e); app.innerHTML = '<section class="panel"><h2>💬 Discussion forum</h2><p>' + (/forum_|schema cache|does not exist/.test(m) ? 'The forum is being moved to your Learnova account and will open here shortly.' : E(S.nice(e))) + '</p></section>'; }
  function list() {
    app.innerHTML = '<p class="muted">Loading discussions…</p>';
    S.db.rpc('forum_threads', { cls: cur.id }).then(function (r) {
      if (r.error) return fail(r.error); var rows = r.data || [];
      app.innerHTML = '<nav class="tabs" role="tablist" aria-label="Boards">' + boards.map(function (b, i) { return '<a href="#" role="tab" data-b="' + i + '" aria-selected="' + (b === cur) + '">' + (b.id ? '🏫 ' : '🌍 ') + E(b.name) + '</a>'; }).join('') + '</nav>' +
        '<details class="panel" style="margin-top:12px"' + (rows.length ? '' : ' open') + '><summary><b>＋ Start a discussion in ' + E(cur.name) + '</b></summary><form class="form" id="nf" style="margin-top:8px"><label class="f">Title<input id="nt" minlength="3" maxlength="140" required placeholder="e.g. Why do enzymes denature?"></label>' +
        '<label class="f">Message<textarea id="nm" maxlength="3000" required rows="4" placeholder="Share your question or idea. Be kind and stay on science."></textarea></label><button class="btn main" type="submit">Post</button><p class="msg" id="fm" role="alert"></p></form></details>' +
        '<div class="grp">' + (rows.length ? rows.map(function (t) { return '<article class="item"' + (t.hidden ? ' style="opacity:.55"' : '') + '><span class="meta">' + who(t) + ' · ' + E(when(t.created_at)) + (t.hidden ? ' · <b>hidden by a teacher</b>' : '') + '</span><b><a href="#t/' + t.id + '">' + E(t.title) + '</a></b>' +
            '<span class="small muted">' + E(t.preview) + '</span><span class="small">💬 ' + t.replies + ' repl' + (t.replies === 1 ? 'y' : 'ies') + (t.replies ? ' · last ' + E(when(t.last_at)) : '') + '</span></article>'; }).join('') : '<p class="emptybox">No discussions here yet. Start the first one!</p>') + '</div>' +
        '<p class="small muted">Posts appear straight away under your name, and your teacher can see everything. Be respectful; posts that break class rules will be hidden.</p>';
      app.querySelectorAll('[data-b]').forEach(function (x) { x.onclick = function (e) { e.preventDefault(); cur = boards[+x.getAttribute('data-b')]; list(); }; });
      app.querySelector('#nf').onsubmit = function (e) { e.preventDefault(); var m = app.querySelector('#fm'), b = this.querySelector('button'); b.disabled = true; m.textContent = 'Posting…';
        S.db.from('forum_posts').insert({ class_id: cur.id, title: app.querySelector('#nt').value.trim(), body: app.querySelector('#nm').value.trim(), author_id: me.user.id }).select('id').single().then(function (x) {
          b.disabled = false; if (x.error) { m.textContent = S.nice(x.error); return; } location.hash = '#t/' + x.data.id; }); };
    });
  }
  function thread(id) {
    app.innerHTML = '<p class="muted">Loading…</p>';
    S.db.rpc('forum_thread', { tid: id }).then(function (r) {
      if (r.error) return fail(r.error); var ps = r.data || [], root = ps[0];
      if (!root) { app.innerHTML = '<section class="panel"><p>This discussion is not available.</p><a class="btn sm" href="#">← All discussions</a></section>'; return; }
      app.innerHTML = '<p class="crumb"><a href="#">← All discussions</a></p><h2>' + E(root.title) + '</h2>' + ps.map(function (p) {
          return '<article class="item" style="' + (p.is_teacher ? 'border-left:4px solid var(--accent);' : '') + (p.hidden ? 'opacity:.55' : '') + '"><span class="meta">' + who(p) + ' · ' + E(when(p.created_at)) + (p.hidden ? ' · <b>hidden</b>' : '') + '</span><div style="white-space:pre-wrap;overflow-wrap:anywhere">' + E(p.body) + '</div>' +
            '<span class="small">' + (p.can_moderate ? '<button class="btn sm" type="button" data-h="' + p.id + '" data-v="' + (!p.hidden) + '">' + (p.hidden ? 'Show again' : 'Hide') + '</button> ' : '') + (p.mine ? '<button class="btn sm" type="button" data-d="' + p.id + '" style="color:#b91c1c">Delete</button>' : '') + '</span></article>'; }).join('') +
        (root.hidden ? '<p class="msg">This discussion is hidden, so replies are closed.</p>' : '<form class="form" id="rf"><label class="f">Your reply<textarea id="rm" maxlength="3000" required rows="3"></textarea></label><button class="btn main" type="submit">Reply</button><p class="msg" id="rmsg" role="alert"></p></form>');
      app.querySelectorAll('[data-h]').forEach(function (b) { b.onclick = function () { b.disabled = true; S.db.rpc('forum_hide', { pid: b.getAttribute('data-h'), on_off: b.getAttribute('data-v') === 'true' }).then(function () { thread(id); }); }; });
      app.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Delete for good?'; return; }
        var pid = b.getAttribute('data-d'); S.db.from('forum_posts').delete().eq('id', pid).then(function () { if (pid === id) location.hash = '#'; else thread(id); }); }; });
      var f = app.querySelector('#rf'); if (f) f.onsubmit = function (e) { e.preventDefault(); var m = app.querySelector('#rmsg'), b = f.querySelector('button'); b.disabled = true; m.textContent = 'Posting…';
        S.db.from('forum_posts').insert({ parent_id: id, body: app.querySelector('#rm').value.trim(), author_id: me.user.id }).then(function (x) { b.disabled = false; if (x.error) { m.textContent = S.nice(x.error); return; } thread(id); }); };
    });
  }
})();
