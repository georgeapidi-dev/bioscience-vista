/* VistaEd · Class files (23 Nov 2026, migration 092; table class_files, private bucket class-files). By George Apidi.
   Students keep lesson notes and other work and share them with their teacher; teachers share notes and materials with a
   whole class or with one student. Files open through short-lived signed links, so nothing is public.
   BVFILES.student(host, S, me)                 a student's files, across their classes
   BVFILES.teacher(host, S, cls, kids, me)      one class: what students shared, and what the teacher shared */
(function () {
  var F = window.BVFILES = {};
  var BUCKET = 'class-files', MAX = 25 * 1024 * 1024;
  var ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.odp,.ods,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.mp3,.m4a,.wav,.webm,.mp4,.mov';
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function kb(n) { return n == null ? '' : n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }
  function when(d) { var t = new Date(d); return t.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ', ' + t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  function icon(m, p) {
    var x = (String(p || '').split('.').pop() || '').toLowerCase();
    return /^image\//.test(m) ? '🖼' : /pdf/.test(m) || x === 'pdf' ? '📕' : /presentation|powerpoint/.test(m) || /pptx?|odp/.test(x) ? '📊' : /sheet|excel|csv/.test(m) || /xlsx?|ods|csv/.test(x) ? '📗' : /^audio\//.test(m) ? '🎧' : /^video\//.test(m) ? '🎬' : '📄';
  }
  function safeName(n) { return String(n || 'file').normalize('NFKD').replace(/[^\w.\-]+/g, '_').replace(/_+/g, '_').slice(-80); }
  var CSS = '<style>.fl-up{border:2px dashed #a5b4fc;border-radius:16px;padding:14px;background:#f5f7ff;margin:0 0 12px}.fl-up.drag{background:#e0e7ff;border-color:#6366f1}' +
    '.fl-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));gap:10px;align-items:end}.fl-up label{display:block;font-weight:700;font-size:.88rem;margin:0}' +
    '.fl-up input[type=text],.fl-up select,.fl-up textarea{width:100%;box-sizing:border-box;margin-top:4px}.fl-pick{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:10px 0 0}' +
    '.fl-pick .fl-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 14px;border-radius:11px;background:#fff;border:1px solid #c7d2fe;font-weight:800;cursor:pointer;color:#3730a3}.fl-pick .fl-btn:focus-within{outline:3px solid #a5b4fc}' +
    '.fl-pick input[type=file]{position:absolute;opacity:0;width:1px;height:1px}.fl-go{padding:9px 16px;border-radius:11px;border:0;background:linear-gradient(120deg,#4f46e5,#7c3aed);color:#fff;font-weight:800;cursor:pointer}.fl-go:disabled{opacity:.55;cursor:default}' +
    '.fl-msg{min-height:1.2em;margin:8px 0 0;font-weight:700;font-size:.9rem}.fl-msg.bad{color:#b91c1c}.fl-msg.ok{color:#15803d}.fl-bar{height:6px;border-radius:6px;background:#e0e7ff;overflow:hidden;margin-top:8px}.fl-bar i{display:block;height:100%;width:0;background:#6366f1;transition:width .3s}' +
    '.fl-h{margin:14px 0 6px;font-size:1rem}.fl-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}.fl-it{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid #e2e8f0;border-radius:14px;background:#fff}' +
    '.fl-it.new{border-color:#a5b4fc;box-shadow:0 0 0 3px #eef2ff}.fl-i{font-size:1.5rem;line-height:1}.fl-b{flex:1;min-width:0}.fl-b b{display:block;overflow-wrap:anywhere}.fl-m{font-size:.8rem;color:#64748b}.fl-n{font-size:.88rem;margin:4px 0 0;white-space:pre-wrap}' +
    '.fl-a{display:flex;gap:6px;flex-wrap:wrap}.fl-a button{padding:6px 10px;border-radius:9px;border:1px solid #cbd5e1;background:#fff;font-weight:700;cursor:pointer;font-size:.84rem}.fl-a button.pri{background:#4f46e5;border-color:#4f46e5;color:#fff}' +
    '.fl-tag{display:inline-block;padding:0 7px;border-radius:999px;font-size:.72rem;font-weight:800;background:#ede9fe;color:#5b21b6;margin-left:6px;vertical-align:1px}.fl-tag.me{background:#ccfbf1;color:#115e59}' +
    '.fl-empty{color:#64748b;font-size:.9rem;margin:4px 0}.fl-f{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 8px}.fl-f button{padding:5px 11px;border-radius:999px;border:1px solid #cbd5e1;background:#fff;font-weight:700;font-size:.84rem;cursor:pointer}.fl-f button[aria-pressed=true]{background:#1e1b4b;color:#fff;border-color:#1e1b4b}</style>';

  function seenKey(S, k) { return 'bv-files-seen-' + k; }
  function lastSeen(k) { try { return +localStorage.getItem(k) || 0; } catch (e) { return 0; } }
  function markSeen(k) { try { localStorage.setItem(k, String(Date.now())); } catch (e) {} }

  // the upload box; opts: { classes:[{id,name}], students:[{id,full_name}] (teacher), teacher:bool, onDone() }
  function uploader(S, me, opts) {
    var id = 'fl' + Math.random().toString(36).slice(2, 7);
    var cls = opts.classes, one = cls.length === 1;
    var h = '<form class="fl-up" id="' + id + '" novalidate><div class="fl-g">' +
      (one ? '' : '<label>Class<select name="c">' + cls.map(function (c) { return '<option value="' + E(c.id) + '">' + E(c.name) + '</option>'; }).join('') + '</select></label>') +
      (opts.teacher ? '<label>Share with<select name="to"><option value="">The whole class</option>' + (opts.students || []).map(function (k) { return '<option value="' + E(k.id) + '">' + E(k.full_name || 'Student') + ' only</option>'; }).join('') + '</select></label>' : '') +
      '<label>Title<input type="text" name="t" maxlength="200" placeholder="' + (opts.teacher ? 'e.g. Enzymes notes, Topic C1.1' : 'e.g. My notes on enzymes') + '"></label></div>' +
      '<label style="margin-top:10px">Note <span class="fl-m">(optional)</span><textarea name="n" rows="2" maxlength="1000" placeholder="' + (opts.teacher ? 'What students should do with it' : 'Anything your teacher should know') + '"></textarea></label>' +
      '<div class="fl-pick"><label class="fl-btn">📎 Choose a file<input type="file" name="f" accept="' + ACCEPT + '"></label><span class="fl-m" data-fn>No file chosen. You can also drop a file here. Up to 25 MB.</span>' +
      '<button type="submit" class="fl-go" disabled>' + (opts.teacher ? '⬆ Share file' : '⬆ Send to my teacher') + '</button></div>' +
      '<div class="fl-bar" hidden><i></i></div><p class="fl-msg" role="status" aria-live="polite"></p></form>';
    return { html: h, bind: function (root) {
      var f = root.querySelector('#' + id), inp = f.querySelector('input[type=file]'), go = f.querySelector('.fl-go'), msg = f.querySelector('.fl-msg'), fn = f.querySelector('[data-fn]'), bar = f.querySelector('.fl-bar'), file = null;
      function say(t, k) { msg.textContent = t; msg.className = 'fl-msg ' + (k || ''); }
      function pick(x) {
        file = x || null; say('');
        if (!file) { fn.textContent = 'No file chosen.'; go.disabled = true; return; }
        if (file.size > MAX) { file = null; go.disabled = true; fn.textContent = 'No file chosen.'; return say('That file is ' + kb(x.size) + '. The limit is 25 MB: compress it or share a link instead.', 'bad'); }
        fn.textContent = x.name + ' · ' + kb(x.size); go.disabled = false;
        var t = f.querySelector('[name=t]'); if (!t.value.trim()) t.value = x.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 200);
      }
      inp.onchange = function () { pick(inp.files && inp.files[0]); };
      ['dragenter', 'dragover'].forEach(function (ev) { f.addEventListener(ev, function (e) { e.preventDefault(); f.classList.add('drag'); }); });
      ['dragleave', 'drop'].forEach(function (ev) { f.addEventListener(ev, function (e) { e.preventDefault(); f.classList.remove('drag'); }); });
      f.addEventListener('drop', function (e) { var x = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (x) pick(x); });
      f.onsubmit = function (e) {
        e.preventDefault(); if (!file) return;
        var cid = one ? cls[0].id : f.querySelector('[name=c]').value, to = opts.teacher ? f.querySelector('[name=to]').value : '';
        var title = f.querySelector('[name=t]').value.trim() || file.name, note = f.querySelector('[name=n]').value.trim();
        var path = cid + '/' + (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2)) + '-' + safeName(file.name);
        go.disabled = true; bar.hidden = false; bar.firstChild.style.width = '35%'; say('Uploading…');
        S.db.storage.from(BUCKET).upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false }).then(function (r) {
          if (r.error) throw r.error; bar.firstChild.style.width = '80%';
          return S.db.from('class_files').insert({ class_id: cid, owner_id: me.user.id, title: title.slice(0, 200), note: note || null, path: path, size: file.size, mime: file.type || null,
            direction: opts.teacher ? (to ? 'to_student' : 'to_class') : 'to_teacher', student_id: opts.teacher ? (to || null) : me.user.id }).then(function (q) {
            if (q.error) { S.db.storage.from(BUCKET).remove([path]); throw q.error; }
          });
        }).then(function () {
          bar.firstChild.style.width = '100%'; say(opts.teacher ? 'Shared.' : 'Sent to your teacher.', 'ok');
          f.reset(); pick(null); setTimeout(function () { bar.hidden = true; bar.firstChild.style.width = '0'; }, 800);
          if (opts.onDone) opts.onDone();
        }, function (err) {
          bar.hidden = true; go.disabled = false;
          var m = (err && (err.message || err.error)) || String(err);
          say(/mime|type/i.test(m) ? 'This kind of file cannot be uploaded. Use PDF, Word, PowerPoint, Excel, text, an image, audio or video.' :
              /size|large|413/i.test(m) ? 'That file is too large. The limit is 25 MB.' :
              /row-level|policy|permission|403/i.test(m) ? (opts.teacher && to ? 'This student has not been approved in the class yet, so they cannot receive a file.' : 'You cannot add files to this class.') :
              /bucket|class_files|schema cache|does not exist/i.test(m) ? 'File sharing needs a database update (migration 092) before it can be used.' : m, 'bad');
        });
      };
    } };
  }

  function rowHtml(x, me, names, isNew, canDel, tag) {
    return '<li class="fl-it' + (isNew ? ' new' : '') + '"><span class="fl-i" aria-hidden="true">' + icon(x.mime, x.path) + '</span><div class="fl-b"><b>' + E(x.title) + (tag ? '<span class="fl-tag' + (x.owner_id === me.user.id ? ' me' : '') + '">' + E(tag) + '</span>' : '') + (isNew ? '<span class="fl-tag">New</span>' : '') + '</b>' +
      '<span class="fl-m">' + E(names) + ' · ' + when(x.created_at) + (x.size ? ' · ' + kb(x.size) : '') + '</span>' + (x.note ? '<p class="fl-n">' + E(x.note) + '</p>' : '') + '</div>' +
      '<div class="fl-a"><button type="button" class="pri" data-open="' + E(x.path) + '">Open</button>' + (canDel ? '<button type="button" data-del="' + E(x.id) + '" data-path="' + E(x.path) + '" aria-label="Delete ' + E(x.title) + '">Delete</button>' : '') + '</div></li>';
  }
  function actions(host, S, reload) {
    host.addEventListener('click', function (e) {
      var o = e.target.closest('[data-open]'), d = e.target.closest('[data-del]');
      if (o) {
        var w = window.open('', '_blank'); if (w) w.document.write('<p style="font-family:sans-serif">Opening the file…</p>');
        S.db.storage.from(BUCKET).createSignedUrl(o.getAttribute('data-open'), 300).then(function (r) {
          if (r.error || !r.data) { if (w) w.close(); alertBox(host, 'This file could not be opened. It may have been deleted.'); return; }
          if (w) w.location = r.data.signedUrl; else location.href = r.data.signedUrl;
        });
      }
      if (d) {
        if (!confirmInline(d)) return;
        S.db.from('class_files').delete().eq('id', d.getAttribute('data-del')).then(function (r) {
          if (r.error) return alertBox(host, 'Could not delete: ' + r.error.message);
          S.db.storage.from(BUCKET).remove([d.getAttribute('data-path')]).then(function () {}, function () {}); reload();
        });
      }
    });
  }
  // two-press delete instead of a browser dialog
  function confirmInline(b) { if (b.dataset.sure) return true; b.dataset.sure = '1'; b.textContent = 'Press again to delete'; setTimeout(function () { delete b.dataset.sure; b.textContent = 'Delete'; }, 4000); return false; }
  function alertBox(host, t) { var p = host.querySelector('.fl-alert'); if (!p) { p = document.createElement('p'); p.className = 'fl-msg bad fl-alert'; p.setAttribute('role', 'alert'); host.prepend(p); } p.textContent = t; }

  function profileNames(S, ids) {
    ids = ids.filter(function (v, i, a) { return v && a.indexOf(v) === i; });
    if (!ids.length) return Promise.resolve({});
    return S.db.from('profiles').select('id,full_name').in('id', ids).then(function (r) { var o = {}; (r.data || []).forEach(function (p) { o[p.id] = p.full_name; }); return o; }, function () { return {}; });
  }

  F.student = function (host, S, me) {
    var cls = (me.classes || []).map(function (c) { return { id: c.id, name: c.name || 'My class', self: c.self }; }).filter(function (c) { return c.id && !c.self; });
    var key = seenKey(S, me.user.id), seen = lastSeen(key);
    if (!cls.length) { host.innerHTML = CSS + '<h3>📁 My files</h3><p class="fl-empty">Join a class to share files with your teacher. <a href="/join/">Join a class</a></p>'; return; }
    var up = uploader(S, me, { classes: cls, onDone: draw });
    host.innerHTML = CSS + '<h3>📁 My files</h3><p class="fl-m" style="margin:0 0 10px">Keep your lesson notes and other work here and send them to your teacher. Your teacher\'s notes and materials appear below.</p>' + up.html + '<div data-list><p class="fl-empty">Loading files…</p></div>';
    up.bind(host); actions(host, S, draw);
    var cname = {}; cls.forEach(function (c) { cname[c.id] = c.name; });
    function draw() {
      var box = host.querySelector('[data-list]');
      S.db.from('class_files').select('*').in('class_id', cls.map(function (c) { return c.id; })).order('created_at', { ascending: false }).limit(200).then(function (r) {
        if (r.error) { box.innerHTML = '<p class="fl-empty">' + (/class_files|schema cache|does not exist/i.test(r.error.message) ? 'File sharing will be ready soon.' : E(r.error.message)) + '</p>'; return; }
        var rows = r.data || [], from = rows.filter(function (x) { return x.owner_id !== me.user.id; }), mine = rows.filter(function (x) { return x.owner_id === me.user.id; });
        return profileNames(S, from.map(function (x) { return x.owner_id; })).then(function (nm) {
          box.innerHTML = '<h4 class="fl-h">From my teachers</h4>' + (from.length ? '<ul class="fl-list">' + from.map(function (x) {
              return rowHtml(x, me, (nm[x.owner_id] || 'Teacher') + ' · ' + (cname[x.class_id] || ''), new Date(x.created_at).getTime() > seen, false, x.direction === 'to_student' ? 'Just for you' : '');
            }).join('') + '</ul>' : '<p class="fl-empty">Nothing shared yet. When your teacher shares notes or materials they appear here.</p>') +
            '<h4 class="fl-h">Sent to my teacher</h4>' + (mine.length ? '<ul class="fl-list">' + mine.map(function (x) { return rowHtml(x, me, cname[x.class_id] || '', false, true, ''); }).join('') + '</ul>' : '<p class="fl-empty">You have not sent any files yet.</p>');
          markSeen(key);
        });
      });
    }
    draw();
  };

  F.teacher = function (host, S, cls, kids, me) {
    if (!me || !me.user) { host.innerHTML = '<p class="fl-empty">Sign in again to share files.</p>'; return; }
    var names = {}; (kids || []).forEach(function (k) { names[k.id] = k.full_name; });
    var key = seenKey(S, me.user.id + '-' + cls.id), seen = lastSeen(key), mode = 'all';
    var up = uploader(S, me, { classes: [{ id: cls.id, name: cls.name }], teacher: true, students: kids || [], onDone: draw });
    host.innerHTML = CSS + '<h3>📁 Class files</h3><p class="fl-m" style="margin:0 0 10px">Share notes and materials with the whole class or with one student. Files students send you appear here too. Every file is private to this class.</p>' + up.html +
      '<div class="fl-f" role="group" aria-label="Show"><button type="button" data-m="all" aria-pressed="true">All</button><button type="button" data-m="in" aria-pressed="false">From students</button><button type="button" data-m="out" aria-pressed="false">Shared by me</button></div><div data-list><p class="fl-empty">Loading files…</p></div>';
    up.bind(host); actions(host, S, draw);
    host.querySelector('.fl-f').onclick = function (e) { var b = e.target.closest('[data-m]'); if (!b) return; mode = b.getAttribute('data-m'); host.querySelectorAll('.fl-f [data-m]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); draw(true); };
    var rows = null;
    function draw(local) {
      var box = host.querySelector('[data-list]');
      (local && rows ? Promise.resolve({ data: rows }) : S.db.from('class_files').select('*').eq('class_id', cls.id).order('created_at', { ascending: false }).limit(300)).then(function (r) {
        if (r.error) { box.innerHTML = '<p class="fl-empty">' + (/class_files|schema cache|does not exist/i.test(r.error.message) ? 'File sharing needs a database update (migration 092) before it can be used.' : E(r.error.message)) + '</p>'; return; }
        rows = r.data || [];
        var list = rows.filter(function (x) { return mode === 'all' || (mode === 'in' ? x.direction === 'to_teacher' : x.direction !== 'to_teacher'); });
        return profileNames(S, rows.map(function (x) { return x.owner_id; }).filter(function (id) { return !names[id]; })).then(function (nm) {
          var who = function (id) { return id === me.user.id ? 'You' : names[id] || nm[id] || 'Someone'; };
          box.innerHTML = list.length ? '<ul class="fl-list">' + list.map(function (x) {
            var tag = x.direction === 'to_teacher' ? 'From ' + who(x.owner_id) : x.direction === 'to_student' ? 'To ' + (names[x.student_id] || 'one student') : 'Whole class';
            return rowHtml(x, me, who(x.owner_id), x.direction === 'to_teacher' && new Date(x.created_at).getTime() > seen, true, tag);
          }).join('') + '</ul>' : '<p class="fl-empty">' + (mode === 'in' ? 'No files from students yet.' : mode === 'out' ? 'You have not shared any files with this class yet.' : 'No files yet. Share your first one above.') + '</p>';
          markSeen(key);
        });
      });
    }
    draw();
  };
})();
