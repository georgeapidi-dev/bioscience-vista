/* Discussion forum for students · BioScience Vista */
(function () {
  var app = document.getElementById('app'), E = BV.esc, board = null;
  function start() { if (!BV.me()) { BV.loginForm(app, function () { boards(); }); return; } boards(); }
  function boards(b) {
    app.innerHTML = '<p class="muted">Loading discussions…</p>';
    BV.as('forum', { board: b || board }).then(function (r) {
      if (!r.ok) { if (r.auth === false) return BV.signout(); app.innerHTML = '<p class="msg">' + E(r.error) + '</p>'; return; }
      board = r.board;
      app.innerHTML = '<div class="row2"><div class="tabs" role="tablist">' + r.boards.map(function (x) { return '<button role="tab" aria-selected="' + (x === board) + '" data-b="' + E(x) + '">' + E(x) + '</button>'; }).join('') + '</div>' +
        '<button class="btn sm" type="button" id="so">Sign out</button></div>' +
        '<form class="form" id="nf"><h3>Start a discussion in ' + E(board) + '</h3><label class="f">Title<input id="nt" maxlength="140" required placeholder="e.g. Why do enzymes denature?"></label>' +
        '<label class="f">Message<textarea id="nm" maxlength="3000" required placeholder="Share your question or idea. Be kind and stay on science."></textarea></label><button class="btn main" type="submit">Post</button><p class="msg" id="fm"></p></form>' +
        '<div class="grp">' + (r.threads.length ? r.threads.map(function (t) {
          return '<article class="item"><span class="meta">' + E(t.author) + (t.role === 'teacher' ? ' <span class="pill t">Teacher</span>' : t.cls ? ' · ' + E(t.cls) : '') + ' · ' + E(BV.when(t.date)) + '</span><b><a href="#" data-t="' + E(t.id) + '">' + E(t.title) + '</a></b>' +
            '<span class="small muted">' + E(t.preview) + '</span><span class="small">💬 ' + t.replies + ' repl' + (t.replies === 1 ? 'y' : 'ies') + '</span></article>';
        }).join('') : '<p class="emptybox">No discussions yet. Start the first one!</p>') + '</div><p class="small muted">Posts appear straight away and your teacher can see everything. Be respectful; posts that break class rules will be removed.</p>';
      app.querySelector('#so').onclick = BV.signout;
      app.querySelectorAll('[data-b]').forEach(function (x) { x.onclick = function () { boards(x.getAttribute('data-b')); }; });
      app.querySelectorAll('[data-t]').forEach(function (x) { x.onclick = function (e) { e.preventDefault(); thread(x.getAttribute('data-t')); }; });
      app.querySelector('#nf').onsubmit = function (e) {
        e.preventDefault(); var m = app.querySelector('#fm'); m.textContent = 'Posting…';
        BV.as('post', { board: board, title: app.querySelector('#nt').value, message: app.querySelector('#nm').value }).then(function (x) { if (!x.ok) { m.textContent = x.error; return; } thread(x.id); });
      };
    });
  }
  function thread(id) {
    app.innerHTML = '<p class="muted">Loading…</p>';
    BV.as('thread', { id: id }).then(function (r) {
      if (!r.ok) { BV.toast(r.error); boards(); return; }
      app.innerHTML = '<p class="crumb"><a href="#" id="bk">← ' + E(r.board) + ' discussions</a></p><h2>' + E(r.title) + '</h2>' +
        r.posts.map(function (p, i) { return '<article class="item"' + (p.role === 'teacher' ? ' style="border-left:4px solid var(--accent)"' : '') + '><span class="meta">' + E(p.author) + (p.role === 'teacher' ? ' <span class="pill t">Teacher</span>' : ' · ' + E(p.cls)) + ' · ' + E(BV.when(p.date)) + (i === 0 ? '' : '') + '</span><div>' + BV.md(p.message) + '</div></article>'; }).join('') +
        '<form class="form" id="rf"><label class="f">Your reply<textarea id="rm" maxlength="3000" required></textarea></label><button class="btn main" type="submit">Reply</button><p class="msg" id="rmsg"></p></form>';
      app.querySelector('#bk').onclick = function (e) { e.preventDefault(); boards(); };
      app.querySelector('#rf').onsubmit = function (e) {
        e.preventDefault(); var m = app.querySelector('#rmsg'); m.textContent = 'Posting…';
        BV.as('post', { thread: id, message: app.querySelector('#rm').value }).then(function (x) { if (!x.ok) { m.textContent = x.error; return; } thread(id); });
      };
    });
  }
  start();
})();
