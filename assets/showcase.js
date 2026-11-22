/* Science Showcase · BioscienceVista · by BioscienceVista (phase 9, community; migration 066)
   Students publish an investigation, diagram, explanation, model or poster to their CLASS gallery. Nothing is public:
   classmates see a post only after a teacher approves it. Classmates cheer and comment; teachers approve, feature,
   return with a note, hide comments or remove a post. Files: pictures and PDFs in the private bucket showcase-files. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), ST = { tab: '' };
  var KINDS = [['investigation', '🔬 Investigation', '#0284C7'], ['diagram', '🖍️ Diagram', '#DB2777'], ['explanation', '💡 Explanation', '#D97706'], ['model', '🧩 Model', '#7C3AED'], ['poster', '🖼️ Poster', '#0D9488'], ['other', '✨ Other', '#475569']];
  var KIND = {}; KINDS.forEach(function (k) { KIND[k[0]] = k; });
  var STATUS = { draft: ['Draft', '#64748B'], submitted: ['With your teacher', '#D97706'], approved: ['In the class gallery', '#16A34A'], featured: ['⭐ Featured', '#7C3AED'], returned: ['Returned: see the note', '#DC2626'] };
  var CSS = '.sc-hero{margin:8px 0 16px;padding:24px;border-radius:22px;color:#fff;background:radial-gradient(380px 200px at 100% 0%,rgba(250,204,21,.55),transparent 70%),linear-gradient(125deg,#DB2777,#7C3AED 50%,#0284C7)}.sc-hero h1{margin:4px 0 6px;color:#fff}.sc-hero p{margin:0;color:#fff;max-width:760px}' +
    '.sc-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}.sc-tabs a{padding:8px 14px;border-radius:999px;font-weight:700;text-decoration:none;color:var(--c);background:color-mix(in srgb,var(--c) 11%,#fff);border:1px solid color-mix(in srgb,var(--c) 30%,#fff)}.sc-tabs a.on,.sc-tabs a:hover{background:var(--c);color:#fff}.sc-tabs a i{font-style:normal;background:#fff;color:var(--c);border-radius:999px;padding:0 7px;margin-left:4px;font-size:.78rem}' +
    '.sc-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:0 0 12px}.sc-bar select{padding:8px 10px;border-radius:10px;border:1px solid #CBD5E1;font:inherit}' +
    '.sc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}.sc-card{display:flex;flex-direction:column;border-radius:18px;overflow:hidden;background:#fff;border:1px solid #E2E8F0;text-decoration:none;color:#0F172A;box-shadow:0 4px 14px rgba(15,23,42,.06);border-top:5px solid var(--c)}.sc-card:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(15,23,42,.12)}' +
    '.sc-cover{height:140px;background:linear-gradient(135deg,color-mix(in srgb,var(--c) 22%,#fff),color-mix(in srgb,var(--c) 6%,#fff));display:grid;place-items:center;font-size:2.6rem;overflow:hidden}.sc-cover img{width:100%;height:100%;object-fit:cover}.sc-cb{padding:12px 14px;display:grid;gap:4px}.sc-cb b{font-size:1.02rem}.sc-meta{font-size:.82rem;color:#64748B}' +
    '.sc-chip{display:inline-block;padding:2px 9px;border-radius:999px;font-size:.76rem;font-weight:800;color:#fff;background:var(--c)}.sc-feat{outline:3px solid #FACC15}' +
    '.sc-card2{background:#fff;border:1px solid #E2E8F0;border-radius:18px;padding:16px 18px;margin:0 0 14px;border-top:5px solid var(--c,#7C3AED)}.sc-card2 h2{margin:0 0 6px}.sc-body{line-height:1.6}.sc-files{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin:10px 0}.sc-files figure{margin:0;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;background:#F8FAFC}.sc-files img{width:100%;display:block}.sc-files figcaption{font-size:.8rem;padding:4px 8px;color:#475569}' +
    '.sc-note{padding:10px 12px;border-radius:12px;background:#FEF3C7;border:1px solid #FDE68A;margin:8px 0}.sc-cm{padding:8px 0;border-bottom:1px solid #F1F5F9}.sc-cm.hid{opacity:.55}.sc-f{display:grid;gap:4px;margin:0 0 10px}.sc-f span{font-weight:700;font-size:.9rem}.sc-f input,.sc-f textarea,.sc-f select{padding:9px 10px;border-radius:10px;border:1px solid #CBD5E1;font:inherit}.sc-f textarea{min-height:90px}' +
    '.sc-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.sc-cheer{font-size:1rem}.sc-cheer.on{background:#FDF2F8;border-color:#DB2777;color:#9D174D}.sc-empty{padding:18px;border-radius:14px;background:#F8FAFC;border:1px dashed #CBD5E1;color:#475569}#sc-msg{font-weight:700;min-height:1.2em;margin:0 0 6px}';
  var IMG = /^image\//;

  function css() { if (!document.getElementById('sc-css')) { var s = document.createElement('style'); s.id = 'sc-css'; s.textContent = CSS; document.head.appendChild(s); } }
  function msg(t, bad) { var m = document.getElementById('sc-msg'); if (m) { m.textContent = t; m.style.color = bad ? '#B91C1C' : '#166534'; clearTimeout(msg.t); msg.t = setTimeout(function () { m.textContent = ''; }, 5000); } }
  function missing(r) { return r && r.error && /showcase_|schema cache|PGRST205|42P01/.test((r.error.message || '') + (r.error.code || '')); }
  function ok(r, t) { if (r && r.error) { msg(missing(r) ? 'The Science Showcase is being set up. Try again soon.' : S.nice(r.error), true); return false; } if (t) msg(t); return true; }
  function md(t) { return window.BV && BV.md ? BV.md(t || '') : '<p>' + E(t || '').replace(/\n/g, '<br>') + '</p>'; }
  function when(d) { return d ? new Date(d).toLocaleDateString() : ''; }
  function names(ids) { ids = ids.filter(function (v, i) { return v && ids.indexOf(v) === i; }); if (!ids.length) return Promise.resolve({});
    return S.db.rpc('sc_names', { ids: ids }).then(function (r) { var o = {}; (r.data || []).forEach(function (x) { o[x.id] = x.full_name; }); return o; }, function () { return {}; }); }
  function signed(path) { return S.db.storage.from('showcase-files').createSignedUrl(path, 3600).then(function (s) { return s.error ? '' : s.data.signedUrl; }, function () { return ''; }); }
  function classOpts(pick) { return ST.classes.map(function (c) { return '<option value="' + E(c.id) + '"' + (c.id === pick ? ' selected' : '') + '>' + E(c.name) + '</option>'; }).join(''); }

  S.guard(app, { anyone: true, allowPending: true, school: true }).then(function (me) {
    ST.me = me; ST.uid = me.user.id; ST.staff = !!(me.staff || me.school || me.admin); css();
    var load = ST.staff
      ? Promise.all([S.db.from('classes').select('id,name,owner_kind,archived_at').eq('teacher_id', ST.uid).is('deleted_at', null).order('name'), S.db.from('class_teachers').select('class_id,classes(id,name,owner_kind,archived_at)').eq('teacher_id', ST.uid)]).then(function (x) {
          var C = (x[0].data || []).concat((x[1].data || []).map(function (r) { return r.classes; }).filter(Boolean)).filter(function (c) { return !c.archived_at; });
          C.sort(function (a, b) { return ((a.owner_kind === 'main') - (b.owner_kind === 'main')) || a.name.localeCompare(b.name); }); return C; }, function () { return []; })
      : Promise.resolve((me.classes || []).filter(function (c) { return !c.status || c.status === 'approved'; }));
    load.then(function (C) { ST.classes = C; ST.cls = (C[0] || {}).id; window.addEventListener('hashchange', route); route(); });
  }, function () {});

  function shell(tab, inner) {
    var T = ST.staff ? [['review', '📥 To review', '#D97706', ST.nReview], ['gallery', '🖼️ Class gallery', '#7C3AED'], ['mine', '✏️ My posts', '#0284C7'], ['new', '➕ New post', '#DB2777']]
                     : [['gallery', '🖼️ Class gallery', '#7C3AED'], ['mine', '✏️ My posts', '#0284C7'], ['new', '➕ New post', '#DB2777']];
    app.innerHTML = '<section class="sc-hero"><p class="vx-eye" style="color:#FEF3C7">Community</p><h1>🌟 Science Showcase</h1><p>' + (ST.staff
        ? 'Your students share their best science with the class: investigations, diagrams, explanations, models and posters. Nothing is public: classmates see a post only after you approve it.'
        : 'Share your best science with your class: an investigation, a diagram, an explanation, a model or a poster. Your teacher checks each post before your classmates can see it.') + '</p></section>' +
      '<nav class="sc-tabs">' + T.map(function (t) { return '<a href="#/' + t[0] + '" style="--c:' + t[2] + '"' + (t[0] === tab ? ' class="on"' : '') + '>' + t[1] + (t[3] ? '<i>' + t[3] + '</i>' : '') + '</a>'; }).join('') + '</nav><p id="sc-msg" role="status"></p>' + inner;
  }
  function route() {
    var h = location.hash.replace(/^#\/?/, '').split('/');
    if (h[0] === 'post' && h[1]) return post(h[1]);
    if (h[0] === 'edit' && h[1]) return editor(h[1]);
    if (h[0] === 'new') return editor(null);
    if (h[0] === 'mine') return mine();
    if (h[0] === 'review' && ST.staff) return review();
    if (h[0] === 'gallery' || !ST.staff) return gallery();
    return review();
  }

  /* ---------- the class gallery ---------- */
  function cards(P, nm, cheers) {
    return '<div class="sc-grid">' + P.map(function (p) { var k = KIND[p.kind] || KIND.other, img = (p.files || []).filter(function (f) { return IMG.test(f.type || ''); })[0];
      return '<a class="sc-card' + (p.status === 'featured' ? ' sc-feat' : '') + '" style="--c:' + k[2] + '" href="#/post/' + p.id + '"><div class="sc-cover">' + (img ? '<img alt="" data-cover="' + E(img.path) + '">' : k[1].split(' ')[0]) + '</div>' +
        '<div class="sc-cb"><span><span class="sc-chip">' + E(k[1]) + '</span>' + (p.status === 'featured' ? ' <span class="sc-chip" style="--c:#7C3AED">⭐ Featured</span>' : '') + '</span><b>' + E(p.title) + '</b>' +
        (p.summary ? '<span style="font-size:.9rem;color:#334155">' + E(p.summary.slice(0, 140)) + (p.summary.length > 140 ? '…' : '') + '</span>' : '') +
        '<span class="sc-meta">' + E(nm[p.author_id] || '') + ' · ' + when(p.updated_at) + (cheers ? ' · 👏 ' + (cheers[p.id] || 0) : '') + (p.status !== 'approved' && p.status !== 'featured' ? ' · ' + E(STATUS[p.status][0]) : '') + '</span></div></a>'; }).join('') + '</div>';
  }
  function covers() { [].forEach.call(app.querySelectorAll('img[data-cover]'), function (im) { signed(im.getAttribute('data-cover')).then(function (u) { if (u) im.src = u; }); }); }
  function gallery() {
    if (!ST.classes.length) { shell('gallery', '<div class="sc-empty">' + (ST.staff ? 'You have no classes yet.' : 'Join a class from your dashboard to see its gallery.') + '</div>'); return; }
    shell('gallery', '<div class="sc-bar"><label>Class <select id="sc-c">' + classOpts(ST.cls) + '</select></label><label>Show <select id="sc-k"><option value="">Everything</option>' + KINDS.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select></label></div><div id="sc-g"><p class="sc-meta">Loading…</p></div>');
    var draw = function () {
      var k = app.querySelector('#sc-k').value, q = S.db.from('showcase_posts').select('id,author_id,kind,title,summary,files,status,updated_at').eq('class_id', ST.cls).in('status', ['approved', 'featured']).order('updated_at', { ascending: false }).limit(200);
      if (k) q = q.eq('kind', k);
      q.then(function (r) { if (!ok(r)) { app.querySelector('#sc-g').innerHTML = '<div class="sc-empty">The gallery opens soon.</div>'; return; }
        var P = (r.data || []).sort(function (a, b) { return (b.status === 'featured') - (a.status === 'featured'); });
        if (!P.length) { app.querySelector('#sc-g').innerHTML = '<div class="sc-empty">No posts in this gallery yet. ' + (ST.staff ? 'Approved student posts appear here.' : '<a href="#/new">Be the first to share your science →</a>') + '</div>'; return; }
        Promise.all([names(P.map(function (p) { return p.author_id; })), S.db.from('showcase_cheers').select('post_id').in('post_id', P.map(function (p) { return p.id; }))]).then(function (x) {
          var ch = {}; ((x[1] && x[1].data) || []).forEach(function (c) { ch[c.post_id] = (ch[c.post_id] || 0) + 1; });
          app.querySelector('#sc-g').innerHTML = cards(P, x[0], ch); covers(); });
      });
    };
    app.querySelector('#sc-c').onchange = function () { ST.cls = this.value; draw(); };
    app.querySelector('#sc-k').onchange = draw; draw();
  }

  /* ---------- my posts ---------- */
  function mine() {
    shell('mine', '<div id="sc-g"><p class="sc-meta">Loading…</p></div>');
    S.db.from('showcase_posts').select('id,author_id,kind,title,summary,files,status,teacher_note,updated_at,class_id').eq('author_id', ST.uid).order('updated_at', { ascending: false }).then(function (r) {
      var box = app.querySelector('#sc-g'); if (!ok(r)) { box.innerHTML = '<div class="sc-empty">The Showcase opens soon.</div>'; return; }
      var P = r.data || []; if (!P.length) { box.innerHTML = '<div class="sc-empty">You have not shared anything yet. <a href="#/new">Start a post →</a></div>'; return; }
      var nm = {}; nm[ST.uid] = 'You'; box.innerHTML = cards(P, nm, null); covers(); });
  }

  /* ---------- teacher: review queue ---------- */
  function review() {
    var ids = ST.classes.map(function (c) { return c.id; });
    shell('review', '<div id="sc-g"><p class="sc-meta">Loading…</p></div>');
    if (!ids.length) { app.querySelector('#sc-g').innerHTML = '<div class="sc-empty">You have no classes yet.</div>'; return; }
    S.db.from('showcase_posts').select('id,author_id,kind,title,summary,files,status,updated_at,class_id').in('class_id', ids).eq('status', 'submitted').order('updated_at').then(function (r) {
      var box = app.querySelector('#sc-g'); if (!ok(r)) { box.innerHTML = '<div class="sc-empty">The Showcase opens after the next database update (migration 066).</div>'; return; }
      var P = r.data || []; ST.nReview = P.length; var tab = app.querySelector('.sc-tabs a'); if (tab && P.length) tab.innerHTML = '📥 To review<i>' + P.length + '</i>';
      if (!P.length) { box.innerHTML = '<div class="sc-empty">Nothing to review. Student posts sent to you appear here. 🎉</div>'; return; }
      var cn = {}; ST.classes.forEach(function (c) { cn[c.id] = c.name; });
      names(P.map(function (p) { return p.author_id; })).then(function (nm) {
        P.forEach(function (p) { nm[p.author_id] = (nm[p.author_id] || 'Student') + ' · ' + (cn[p.class_id] || ''); });
        box.innerHTML = '<p class="sc-meta">Open a post to approve it, feature it or return it with a note.</p>' + cards(P, nm, null); covers(); });
    });
  }

  /* ---------- one post ---------- */
  function post(id) {
    shell('', '<div id="sc-p"><p class="sc-meta">Loading…</p></div>');
    S.db.from('showcase_posts').select('*').eq('id', id).maybeSingle().then(function (r) {
      var box = app.querySelector('#sc-p'); if (!ok(r)) return; var p = r.data;
      if (!p) { box.innerHTML = '<div class="sc-empty">This post is not available. It may be waiting for your teacher, or it was removed.</div>'; return; }
      var mineP = p.author_id === ST.uid, live = p.status === 'approved' || p.status === 'featured', k = KIND[p.kind] || KIND.other;
      var teach = ST.staff && !mineP;
      Promise.all([S.db.from('showcase_comments').select('*').eq('post_id', id).order('created_at'), S.db.from('showcase_cheers').select('user_id').eq('post_id', id)]).then(function (x) {
        var CM = x[0].data || [], CH = x[1].data || [], cheered = CH.some(function (c) { return c.user_id === ST.uid; });
        names([p.author_id].concat(CM.map(function (c) { return c.author_id; }))).then(function (nm) {
          var st = STATUS[p.status];
          box.innerHTML = '<p><a href="#/' + (teach && p.status === 'submitted' ? 'review' : mineP ? 'mine' : 'gallery') + '">← Back</a></p>' +
            '<article class="sc-card2" style="--c:' + k[2] + '"><p class="sc-row"><span class="sc-chip">' + E(k[1]) + '</span>' + ((mineP || teach) ? '<span class="sc-chip" style="--c:' + st[1] + '">' + E(st[0]) + '</span>' : (p.status === 'featured' ? '<span class="sc-chip" style="--c:#7C3AED">⭐ Featured</span>' : '')) + '</p>' +
            '<h2>' + E(p.title) + '</h2><p class="sc-meta">' + E(mineP ? 'You' : nm[p.author_id] || '') + ' · ' + when(p.updated_at) + '</p>' +
            (p.teacher_note && (mineP || teach) ? '<div class="sc-note"><b>Teacher note:</b> ' + E(p.teacher_note) + '</div>' : '') +
            (p.summary ? '<p style="font-size:1.05rem"><b>' + E(p.summary) + '</b></p>' : '') + '<div class="sc-body">' + md(p.body) + '</div>' +
            ((p.files || []).length ? '<div class="sc-files">' + p.files.map(function (f, i) { return IMG.test(f.type || '') ? '<figure><img alt="' + E(f.name) + '" data-f="' + i + '"><figcaption>' + E(f.name) + '</figcaption></figure>' : '<figure style="padding:12px">📄 <a href="#" data-pdf="' + i + '">' + E(f.name) + '</a><figcaption>PDF · opens in a new tab</figcaption></figure>'; }).join('') + '</div>' : '') +
            '<div class="sc-row" style="margin-top:10px">' + (live ? '<button type="button" class="btn sm sc-cheer' + (cheered ? ' on' : '') + '" id="sc-ch"' + (mineP ? ' disabled title="You cannot cheer your own post"' : '') + '>👏 ' + CH.length + (cheered ? ' · cheered' : ' · Cheer') + '</button>' : '') +
            (mineP ? '<a class="btn sm" href="#/edit/' + p.id + '">✏️ Edit</a><button type="button" class="btn sm" id="sc-del">🗑 Delete</button>' : '') + '</div></article>' +
            (teach ? '<section class="sc-card2" style="--c:#D97706"><h3 style="margin-top:0">🧑‍🏫 Review</h3><label class="sc-f"><span>Note to the student (optional; required to return)</span><textarea id="sc-tn" maxlength="2000">' + E(p.teacher_note || '') + '</textarea></label>' +
              '<div class="sc-row"><button type="button" class="btn sm main" data-st="approved">✓ Approve for the class gallery</button><button type="button" class="btn sm" data-st="featured">⭐ Feature</button><button type="button" class="btn sm" data-st="returned">↩ Return to the student</button><button type="button" class="btn sm" id="sc-rm" style="color:#B91C1C">🗑 Remove post</button></div></section>' : '') +
            '<section class="sc-card2" style="--c:#0284C7"><h3 style="margin-top:0">💬 Comments</h3>' + (CM.length ? CM.map(function (c) {
                return '<div class="sc-cm' + (c.hidden ? ' hid' : '') + '"><b>' + E(c.author_id === ST.uid ? 'You' : nm[c.author_id] || 'Classmate') + '</b> <span class="sc-meta">' + when(c.created_at) + (c.hidden ? ' · hidden by the teacher' : '') + '</span><div>' + E(c.body) + '</div>' +
                  '<div class="sc-row">' + (teach ? '<button type="button" class="btn sm" data-hide="' + c.id + '" data-v="' + (c.hidden ? '0' : '1') + '">' + (c.hidden ? 'Show' : 'Hide') + '</button>' : '') + (c.author_id === ST.uid ? '<button type="button" class="btn sm" data-dc="' + c.id + '">Delete</button>' : '') + '</div></div>'; }).join('') : '<p class="sc-meta">No comments yet.</p>') +
              ((live || mineP || teach) ? '<label class="sc-f" style="margin-top:10px"><span>' + (live ? 'Say what you liked or ask a question. Be kind and specific.' : 'Comment (only you and your teacher see comments until the post is approved)') + '</span><textarea id="sc-cm" maxlength="1000" style="min-height:60px"></textarea></label><button type="button" class="btn sm main" id="sc-cms">Post comment</button>' : '') + '</section>';
          [].forEach.call(box.querySelectorAll('img[data-f]'), function (im) { signed(p.files[+im.getAttribute('data-f')].path).then(function (u) { if (u) im.src = u; }); });
          [].forEach.call(box.querySelectorAll('[data-pdf]'), function (a) { a.onclick = function (e) { e.preventDefault(); var w = window.open('', '_blank'); signed(p.files[+a.getAttribute('data-pdf')].path).then(function (u) { if (u && w) w.location = u; else if (w) w.close(); }); }; });
          var ch = box.querySelector('#sc-ch'); if (ch && !mineP) ch.onclick = function () { ch.disabled = true;
            (cheered ? S.db.from('showcase_cheers').delete().eq('post_id', id).eq('user_id', ST.uid) : S.db.from('showcase_cheers').insert({ post_id: id })).then(function (z) { if (ok(z)) post(id); else ch.disabled = false; }); };
          var del = box.querySelector('#sc-del'); if (del) del.onclick = function () { if (!confirm('Delete this post and its pictures? This cannot be undone.')) return; remove(p, function () { location.hash = '#/mine'; }); };
          var rm = box.querySelector('#sc-rm'); if (rm) rm.onclick = function () { if (!confirm('Remove this post from the class gallery and delete it? This cannot be undone.')) return; remove(p, function () { location.hash = '#/review'; }); };
          [].forEach.call(box.querySelectorAll('[data-st]'), function (b) { b.onclick = function () { var note = box.querySelector('#sc-tn').value.trim(), stt = b.getAttribute('data-st');
            if (stt === 'returned' && !note) { msg('Write a note so the student knows what to change.', true); box.querySelector('#sc-tn').focus(); return; }
            S.db.from('showcase_posts').update({ status: stt, teacher_note: note || null }).eq('id', id).then(function (z) { if (ok(z, stt === 'returned' ? 'Returned to the student.' : stt === 'featured' ? 'Featured in the class gallery.' : 'Approved: the class can now see it.')) setTimeout(function () { post(id); }, 600); }); }; });
          [].forEach.call(box.querySelectorAll('[data-hide]'), function (b) { b.onclick = function () { S.db.from('showcase_comments').update({ hidden: b.getAttribute('data-v') === '1' }).eq('id', b.getAttribute('data-hide')).then(function (z) { if (ok(z)) post(id); }); }; });
          [].forEach.call(box.querySelectorAll('[data-dc]'), function (b) { b.onclick = function () { if (!confirm('Delete your comment?')) return; S.db.from('showcase_comments').delete().eq('id', b.getAttribute('data-dc')).then(function (z) { if (ok(z)) post(id); }); }; });
          var cms = box.querySelector('#sc-cms'); if (cms) cms.onclick = function () { var t = box.querySelector('#sc-cm').value.trim(); if (!t) return; cms.disabled = true;
            S.db.from('showcase_comments').insert({ post_id: id, body: t.slice(0, 1000) }).then(function (z) { cms.disabled = false; if (ok(z)) post(id); }); };
        });
      });
    });
  }
  function remove(p, then) {
    var paths = (p.files || []).map(function (f) { return f.path; });
    (paths.length && p.author_id === ST.uid ? S.db.storage.from('showcase-files').remove(paths) : Promise.resolve()).then(function () {
      S.db.from('showcase_posts').delete().eq('id', p.id).then(function (z) { if (ok(z, 'Deleted.')) then(); }); });
  }

  /* ---------- write or edit a post ---------- */
  function editor(id) {
    if (!ST.classes.length) { shell('new', '<div class="sc-empty">Join a class from your dashboard first: posts go to a class gallery.</div>'); return; }
    var go = id ? S.db.from('showcase_posts').select('*').eq('id', id).eq('author_id', ST.uid).maybeSingle() : Promise.resolve({ data: { kind: 'investigation', title: '', summary: '', body: '', files: [], status: 'draft', class_id: ST.cls } });
    go.then(function (r) {
      if (!ok(r)) { shell('new', '<div class="sc-empty">The Showcase opens soon.</div>'); return; }
      var p = r.data; if (!p) { shell('mine', '<div class="sc-empty">That post is not yours or no longer exists.</div>'); return; }
      p.files = p.files || [];
      var TPL = { investigation: '## Question\n\n## What I did\n\n## Results\n\n## What I found out\n\n## What I would change', diagram: '## What the diagram shows\n\n## How to read it', explanation: '## The idea\n\n## An example\n\n## A common mistake', model: '## What I built\n\n## How it works\n\n## Its limits', poster: '## What the poster is about\n\n## Key finding', other: '' };
      shell(id ? '' : 'new', '<section class="sc-card2" style="--c:#DB2777"><h2>' + (id ? '✏️ Edit your post' : '➕ Share your science') + '</h2>' +
        (p.teacher_note ? '<div class="sc-note"><b>Teacher note:</b> ' + E(p.teacher_note) + '</div>' : '') +
        (p.status === 'approved' || p.status === 'featured' ? '<div class="sc-note">This post is in the class gallery. If you change it, it goes back to your teacher before classmates see it again.</div>' : '') +
        '<div class="sc-row"><label class="sc-f" style="flex:1;min-width:200px"><span>Class gallery</span><select id="e-c">' + classOpts(p.class_id) + '</select></label>' +
        '<label class="sc-f" style="flex:1;min-width:200px"><span>Type</span><select id="e-k">' + KINDS.map(function (k) { return '<option value="' + k[0] + '"' + (p.kind === k[0] ? ' selected' : '') + '>' + k[1] + '</option>'; }).join('') + '</select></label></div>' +
        '<label class="sc-f"><span>Title</span><input id="e-t" maxlength="160" value="' + E(p.title) + '" placeholder="e.g. How temperature changes the rate of catalase"></label>' +
        '<label class="sc-f"><span>One-line summary (shown on the card)</span><input id="e-s" maxlength="600" value="' + E(p.summary) + '" placeholder="What did you find or show, in one sentence?"></label>' +
        '<label class="sc-f"><span>Your post <small style="font-weight:400">· use ## for headings, - for bullet points, **bold**</small></span><textarea id="e-b" maxlength="20000" style="min-height:220px">' + E(p.body || TPL[p.kind] || '') + '</textarea></label>' +
        '<div class="sc-f"><span>Pictures and PDFs <small style="font-weight:400">· up to 8 files, 15 MB each: graphs, photos of your model, diagrams, your poster. Only use pictures you made or may share, and do not show faces.</small></span>' +
        '<div class="sc-files" id="e-files">' + p.files.map(function (f, i) { return '<figure>' + (IMG.test(f.type || '') ? '<img alt="" data-f="' + i + '">' : '<div style="padding:14px">📄</div>') + '<figcaption>' + E(f.name) + ' <button type="button" class="btn sm" data-rmf="' + i + '">Remove</button></figcaption></figure>'; }).join('') + '</div>' +
        (p.files.length < 8 ? '<input type="file" id="e-up" accept="image/png,image/jpeg,image/gif,image/webp,application/pdf" multiple>' : '') + '</div>' +
        '<label style="display:flex;gap:8px;align-items:flex-start;margin:10px 0"><input type="checkbox" id="e-own"> <span>This is my own work. I have named any sources and anyone who helped me, and nothing in it shows a classmate\'s face or personal details.</span></label>' +
        '<div class="sc-row"><button type="button" class="btn sm" id="e-save">💾 Save draft</button><button type="button" class="btn sm main" id="e-send">📤 Send to my teacher</button>' + (id ? '<a class="btn sm" href="#/post/' + id + '">Preview</a>' : '') + '</div></section>');
      [].forEach.call(app.querySelectorAll('#e-files img[data-f]'), function (im) { signed(p.files[+im.getAttribute('data-f')].path).then(function (u) { if (u) im.src = u; }); });
      var kSel = app.querySelector('#e-k'), body = app.querySelector('#e-b');
      kSel.onchange = function () { var cur = body.value.trim(); if (!cur || Object.keys(TPL).some(function (k) { return TPL[k] && cur === TPL[k]; })) body.value = TPL[kSel.value] || ''; };
      var vals = function () { return { class_id: app.querySelector('#e-c').value, kind: kSel.value, title: app.querySelector('#e-t').value.trim(), summary: app.querySelector('#e-s').value.trim(), body: body.value, files: p.files }; };
      var save = function (status) {
        var v = vals(); if (v.title.length < 3) { msg('Give your post a title (at least 3 characters).', true); return Promise.resolve(null); }
        if (status === 'submitted' && !app.querySelector('#e-own').checked) { msg('Tick the box to confirm this is your own work.', true); return Promise.resolve(null); }
        if (status) v.status = status; else if (!p.id) v.status = 'draft';
        var q = p.id ? S.db.from('showcase_posts').update(v).eq('id', p.id).select().maybeSingle() : S.db.from('showcase_posts').insert(v).select().maybeSingle();
        return q.then(function (z) { if (!ok(z)) return null; p = Object.assign(p, z.data || {}); return p; });
      };
      app.querySelector('#e-save').onclick = function () { save(null).then(function (x) { if (x) { msg('Draft saved.'); if (!id) location.hash = '#/edit/' + x.id; } }); };
      app.querySelector('#e-send').onclick = function () { save('submitted').then(function (x) { if (x) { msg('Sent to your teacher.'); setTimeout(function () { location.hash = '#/post/' + x.id; }, 700); } }); };
      [].forEach.call(app.querySelectorAll('[data-rmf]'), function (b) { b.onclick = function () { var i = +b.getAttribute('data-rmf'), f = p.files[i];
        S.db.storage.from('showcase-files').remove([f.path]).then(function () { p.files.splice(i, 1); save(null).then(function (x) { if (x) editor(x.id); }); }); }; });
      var up = app.querySelector('#e-up'); if (up) up.onchange = function () {
        var fs = [].slice.call(up.files || []).slice(0, 8 - p.files.length); if (!fs.length) return;
        var bad = fs.filter(function (f) { return f.size > 15 * 1048576 || !/^(image\/(png|jpeg|gif|webp)|application\/pdf)$/.test(f.type); });
        if (bad.length) { msg('Only pictures (PNG, JPG, GIF, WebP) and PDFs up to 15 MB: ' + bad.map(function (f) { return f.name; }).join(', '), true); up.value = ''; return; }
        msg('Uploading…');
        save(null).then(function (x) { if (!x) return;
          fs.reduce(function (pr, f) { return pr.then(function () { var path = ST.uid + '/' + x.id + '/' + Date.now() + '-' + f.name.replace(/[^\w.-]+/g, '_').slice(-80);
            return S.db.storage.from('showcase-files').upload(path, f, { contentType: f.type }).then(function (u) { if (u.error) { msg(S.nice(u.error), true); return; } p.files.push({ path: path, name: f.name.slice(0, 120), type: f.type, size: f.size }); }); }); }, Promise.resolve())
            .then(function () { return save(null); }).then(function (y) { if (y) { msg('Uploaded.'); if (location.hash === '#/edit/' + y.id) editor(y.id); else location.hash = '#/edit/' + y.id; } }); });
      };
    });
  }
})();
