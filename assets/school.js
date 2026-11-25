/* VistaEd · School accounts (23 Nov 2026, roadmap phase 5; migration 087).
   /school/ for school coordinators (and the site admin): every class of the school with its teachers, students, activity this
   week, work set in the last 30 days and the average mark; the school's teachers and coordinators; every student, with their
   portfolio and CAS / Service as Action; the school licence (seats used, end date). The site admin sets the licence here. */
(function () {
  var S = window.BVS, app = document.getElementById('app'); if (!S || !app) return;
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var day = function (d) { return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '–'; };
  var ago = function (d) { if (!d) return 'never'; var n = Math.floor((Date.now() - new Date(d)) / 864e5); return n <= 0 ? 'today' : n === 1 ? 'yesterday' : n < 30 ? n + ' days ago' : day(d); };
  var load = function (src, name) { return window[name] ? Promise.resolve() : new Promise(function (ok, bad) { var x = document.createElement('script'); x.src = src + '?v=' + (window.BV_VER || '5'); x.onload = ok; x.onerror = bad; document.head.appendChild(x); }); };
  var csv = function (name, rows) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n')], { type: 'text/csv' })); a.download = name; a.click(); };
  var CSS = '<style>.sc-hero{border-radius:20px;padding:18px 20px;color:#fff;background:linear-gradient(120deg,#0f1f3d,#134e4a);margin:0 0 12px}.sc-hero h1{color:#fff;margin:2px 0 6px;font-size:clamp(1.4rem,3vw,2rem)}.sc-hero .lab{font-size:.75rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#99f6e4}' +
    '.sc-kpi{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.sc-kpi span{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3);border-radius:12px;padding:6px 12px;font-size:.88rem}.sc-kpi b{font-size:1.1rem}.sc-kpi .warn{background:#fef3c7;color:#92400e;border-color:#fde68a}' +
    '.sc-tabs{display:flex;gap:4px;border-bottom:2px solid #e2e8f0;margin:0 0 12px;overflow-x:auto}.sc-tabs button{flex:none;border:0;background:none;padding:9px 12px;font:inherit;font-weight:700;color:#475569;border-bottom:3px solid transparent;margin-bottom:-2px;cursor:pointer}.sc-tabs button.on{color:#0f1f3d;border-bottom-color:#0d9488}' +
    '.sc-t{width:100%;border-collapse:collapse;font-size:.9rem}.sc-t th,.sc-t td{text-align:left;padding:7px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top}.sc-t th{font-size:.78rem;text-transform:uppercase;letter-spacing:.04em;color:#64748b;cursor:pointer;white-space:nowrap}.sc-t tr.flag td:first-child{border-left:4px solid #f59e0b}' +
    '.sc-pill{display:inline-block;padding:1px 8px;border-radius:999px;font-size:.75rem;font-weight:700;background:#e0f2fe;color:#075985}.sc-pill.ok{background:#dcfce7;color:#166534}.sc-pill.w{background:#fef3c7;color:#92400e}.sc-pill.r{background:#fee2e2;color:#991b1b}' +
    '.sc-bar{display:inline-block;width:70px;height:7px;border-radius:9px;background:#e2e8f0;vertical-align:middle;margin-right:6px;overflow:hidden}.sc-bar i{display:block;height:100%;background:#0d9488}.sc-wrap{overflow-x:auto}</style>';

  S.guard(app, { anyone: true, school: true }).then(function (me) {
    return S.db.rpc('my_schools').then(function (r) {
      var L = (r && r.data) || [];
      if (r.error && /my_schools|schema cache|does not exist/.test(r.error.message || '')) { app.innerHTML = '<section class="panel"><h2>🏫 My school</h2><p>School accounts open soon.</p></section>'; return; }
      if (!L.length) { app.innerHTML = '<section class="panel"><h2>🏫 My school</h2><p>This page is for school coordinators. If you lead a department or coordinate a programme, ask a coordinator of your school, or VistaEd, to make you a coordinator.</p><p><a class="btn sm" href="/teach/">← My classes</a></p></section>'; return; }
      var pick = new URLSearchParams(location.search).get('id'); if (!L.some(function (s) { return s.id === pick; })) { try { pick = localStorage.getItem('bv-school-' + me.user.id); } catch (e) {} }
      if (!L.some(function (s) { return s.id === pick; })) pick = L[0].id;
      page(me, L, pick, 'classes');
    });
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  function page(me, L, sid, tab) {
    try { localStorage.setItem('bv-school-' + me.user.id, sid); } catch (e) {}
    app.innerHTML = CSS + '<p class="muted">Loading the school…</p>';
    S.db.rpc('school_overview', { sch: sid }).then(function (r) {
      if (r.error) { app.innerHTML = '<p class="msg">' + E(S.nice(r.error)) + '</p>'; return; }
      var O = r.data || {}, lic = O.licence, cls = O.classes || [], live = cls.filter(function (c) { return !c.archived; });
      var used = O.seats_used || 0, licOn = lic && new Date(lic.until) > new Date() && (!lic.starts_on || new Date(lic.starts_on + 'T00:00:00') <= new Date());
      var tot = live.reduce(function (a, c) { return a + (c.students || 0); }, 0), act = live.reduce(function (a, c) { return a + (c.active7 || 0); }, 0);
      app.innerHTML = CSS + '<section class="sc-hero"><span class="lab">School account' + (me.admin ? ' · site admin' : ' · coordinator') + '</span><h1>🏫 ' + E(O.school && O.school.name) + '</h1>' +
        (L.length > 1 ? '<label style="font-size:.85rem">School <select id="scpick" style="max-width:280px">' + L.map(function (s) { return '<option value="' + E(s.id) + '"' + (s.id === sid ? ' selected' : '') + '>' + E(s.name) + '</option>'; }).join('') + '</select></label>' : '') +
        '<div class="sc-kpi"><span><b>' + live.length + '</b> classes</span><span><b>' + (O.teachers || []).length + '</b> teachers</span><span><b>' + used + '</b> students</span><span><b>' + (tot ? Math.round(100 * act / tot) : 0) + '%</b> active this week</span>' +
        (licOn ? '<span' + (lic.seats && used > lic.seats ? ' class="warn"' : '') + '>⭐ Licence until <b>' + E(day(lic.until)) + '</b>' + (lic.seats ? ' · ' + used + ' / ' + lic.seats + ' seats' : '') + '</span>' : '<span class="warn">⭐ No school licence' + (lic ? ' (ended ' + E(day(lic.until)) + ')' : '') + '</span>') + '</div></section>' +
        '<nav class="sc-tabs" role="tablist">' + [['classes', '📚 Classes'], ['teachers', '👩‍🏫 Teachers'], ['students', '🎒 Students'], ['coord', '🧭 Coordinators'], ['licence', '⭐ Licence']].map(function (t) { return '<button type="button" role="tab" data-tab="' + t[0] + '"' + (t[0] === tab ? ' class="on" aria-selected="true"' : '') + '>' + t[1] + '</button>'; }).join('') + '</nav><div id="scbody"></div>';
      var pk = app.querySelector('#scpick'); if (pk) pk.onchange = function () { page(me, L, pk.value, tab); };
      app.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { tab = b.getAttribute('data-tab'); app.querySelectorAll('[data-tab]').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); }); draw(); }; });
      var body = app.querySelector('#scbody');
      function draw() { ({ classes: classesTab, teachers: teachersTab, students: studentsTab, coord: coordTab, licence: licenceTab })[tab](); }

      function classesTab() {
        var sortK = 'name', dir = 1, showOld = false;
        var row = function (c) { var pa = c.students ? Math.round(100 * c.active7 / c.students) : 0, flag = !c.archived && c.students > 0 && (c.set30 === 0 || pa < 30);
          return '<tr' + (flag ? ' class="flag"' : '') + '><td><b>' + E(c.name) + '</b>' + (c.archived ? ' <span class="sc-pill">archived</span>' : '') + '<div class="small muted">' + E([c.programme, c.subject, c.level, c.year].filter(Boolean).join(' · ')) + '</div></td>' +
            '<td>' + E(c.teacher || '–') + ((c.co || []).length ? '<div class="small muted">with ' + c.co.map(E).join(', ') + '</div>' : '') + '</td><td>' + c.students + '</td>' +
            '<td><span class="sc-bar"><i style="width:' + pa + '%"></i></span>' + c.active7 + ' <span class="small muted">(' + pa + '%)</span></td>' +
            '<td>' + (c.set30 ? c.set30 : '<span class="sc-pill w">none</span>') + '</td><td>' + (c.avg90 == null ? '–' : '<span class="sc-pill ' + (c.avg90 >= 70 ? 'ok' : c.avg90 >= 50 ? '' : 'r') + '">' + c.avg90 + '%</span>') + '</td></tr>'; };
        var paint = function () {
          var list = cls.filter(function (c) { return showOld || !c.archived; }).slice().sort(function (a, b) { var x = a[sortK], y = b[sortK]; return (typeof x === 'number' || typeof y === 'number' ? ((x == null ? -1 : x) - (y == null ? -1 : y)) : String(x || '').localeCompare(String(y || ''))) * dir; });
          body.innerHTML = '<div class="row2" style="flex-wrap:wrap;gap:8px;margin:0 0 8px"><p class="small muted" style="margin:0">Amber edge: no work set in 30 days, or fewer than 30% of students active this week. Average mark: the last 90 days.</p><span><label class="small"><input type="checkbox" id="scold"' + (showOld ? ' checked' : '') + '> Show archived</label> <button type="button" class="btn sm" id="sccsv">⬇ CSV</button></span></div>' +
            '<div class="sc-wrap"><table class="sc-t"><tr>' + [['name', 'Class'], ['teacher', 'Teacher'], ['students', 'Students'], ['active7', 'Active this week'], ['set30', 'Work set (30 days)'], ['avg90', 'Average mark']].map(function (h) { return '<th data-k="' + h[0] + '">' + h[1] + (sortK === h[0] ? (dir > 0 ? ' ▲' : ' ▼') : '') + '</th>'; }).join('') + '</tr>' +
            (list.length ? list.map(row).join('') : '<tr><td colspan="6" class="muted">No classes yet.</td></tr>') + '</table></div>';
          body.querySelectorAll('th[data-k]').forEach(function (th) { th.onclick = function () { var k = th.getAttribute('data-k'); dir = sortK === k ? -dir : (k === 'name' || k === 'teacher' ? 1 : -1); sortK = k; paint(); }; });
          body.querySelector('#scold').onchange = function () { showOld = this.checked; paint(); };
          body.querySelector('#sccsv').onclick = function () { csv((O.school.name || 'school') + ' classes.csv', [['Class', 'Programme', 'Subject', 'Level', 'Year', 'Teacher', 'Co-teachers', 'Students', 'Active this week', 'Work set (30 days)', 'Average mark % (90 days)', 'Archived']].concat(list.map(function (c) { return [c.name, c.programme, c.subject, c.level, c.year, c.teacher, (c.co || []).join('; '), c.students, c.active7, c.set30, c.avg90, c.archived ? 'yes' : '']; }))); };
        };
        paint();
      }
      function teachersTab() {
        var T = O.teachers || [];
        body.innerHTML = '<p class="small muted">Teachers of this school\'s classes, and teachers who registered with this school.</p><div class="sc-wrap"><table class="sc-t"><tr><th>Teacher</th><th>Classes</th><th>Account</th><th>Coordinator</th></tr>' + T.map(function (t) {
          return '<tr><td><b>' + E(t.name || 'Teacher') + '</b></td><td>' + (t.classes || 0) + '</td><td>' + (t.status === 'approved' ? '<span class="sc-pill ok">approved</span>' : t.status ? '<span class="sc-pill w">' + E(t.status) + '</span>' : '–') + '</td><td>' +
            (t.coordinator ? '<span class="sc-pill ok">🧭 coordinator</span>' : '<button type="button" class="btn sm" data-mk="' + E(t.id) + '">Make coordinator</button>') + '</td></tr>'; }).join('') + '</table></div>';
        body.querySelectorAll('[data-mk]').forEach(function (b) { b.onclick = function () { var t = T.filter(function (x) { return x.id === b.getAttribute('data-mk'); })[0];
          if (!confirm('Make ' + (t.name || 'this teacher') + ' a coordinator of ' + O.school.name + '? Coordinators see every class and student of the school, and can appoint other coordinators.')) return;
          b.disabled = true; S.db.rpc('school_add_coordinator', { sch: sid, uid: t.id }).then(function (x) { if (x.error) { b.disabled = false; alert(S.nice(x.error)); return; } page(me, L, sid, 'teachers'); }); }; });
      }
      function coordTab() {
        var K = O.coordinators || [];
        body.innerHTML = '<section class="panel"><h3 style="margin-top:0">🧭 Coordinators</h3><p class="small muted">Coordinators see every class and student of the school (marks, portfolios, CAS / Service as Action), and can appoint or remove other coordinators. A school keeps at least one. To appoint a teacher, use <b>Make coordinator</b> in the Teachers tab.</p>' +
          (K.length ? K.map(function (k) { return '<div class="row2" style="padding:6px 0;border-bottom:1px solid #e2e8f0"><span><b>' + E(k.name || 'Teacher') + '</b> <span class="small muted">since ' + E(day(k.added_at)) + '</span>' + (k.id === me.user.id ? ' <span class="sc-pill">you</span>' : '') + '</span><button type="button" class="btn sm" data-rm="' + E(k.id) + '">Remove</button></div>'; }).join('') : '<p class="muted">No coordinators yet.</p>') + '</section>';
        body.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-rm'), self = id === me.user.id;
          if (!confirm(self ? 'Stop being a coordinator of this school? You will no longer see this page.' : 'Remove this coordinator?')) return;
          b.disabled = true; S.db.rpc('school_remove_coordinator', { sch: sid, uid: id }).then(function (x) { if (x.error) { b.disabled = false; alert(S.nice(x.error)); return; } if (self && !me.admin) location.href = '/teach/'; else page(me, L, sid, 'coord'); }); }; });
      }
      function studentsTab() {
        body.innerHTML = '<p class="muted">Loading students…</p>';
        S.db.rpc('school_students', { sch: sid }).then(function (x) {
          if (x.error) { body.innerHTML = '<p class="msg">' + E(S.nice(x.error)) + '</p>'; return; }
          var A = x.data || [], q = '';
          var paint = function () {
            var list = A.filter(function (s) { return !q || (s.name + ' ' + (s.classes || []).join(' ')).toLowerCase().indexOf(q) >= 0; });
            body.querySelector('#scst').innerHTML = '<p class="small muted">' + list.length + ' of ' + A.length + ' students</p><div class="sc-wrap"><table class="sc-t"><tr><th>Student</th><th>Classes</th><th>Last active</th><th>Average (90 days)</th><th>Results</th><th></th></tr>' +
              list.slice(0, 400).map(function (s) { var old = !s.last || Date.now() - new Date(s.last) > 14 * 864e5;
                return '<tr' + (old ? ' class="flag"' : '') + '><td><b>' + E(s.name || 'Student') + '</b></td><td class="small">' + (s.classes || []).map(E).join(', ') + '</td><td>' + E(ago(s.last)) + '</td><td>' + (s.avg90 == null ? '–' : s.avg90 + '%') + '</td><td>' + (s.results || 0) + '</td>' +
                  '<td style="white-space:nowrap"><button type="button" class="btn sm" data-pf="' + E(s.id) + '">🗂 Portfolio</button> <button type="button" class="btn sm" data-sv="' + E(s.id) + '">🤝 CAS</button></td></tr><tr hidden data-box="' + E(s.id) + '"><td colspan="6"><section class="panel"></section></td></tr>'; }).join('') + '</table></div>' + (list.length > 400 ? '<p class="small muted">Showing the first 400: search to narrow.</p>' : '');
            body.querySelectorAll('[data-pf],[data-sv]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-pf') || b.getAttribute('data-sv'), pf = b.hasAttribute('data-pf'), tr = body.querySelector('tr[data-box="' + id + '"]'), st = A.filter(function (z) { return z.id === id; })[0], nm = {}; nm[id] = st.name;
              if (!tr.hidden && tr.getAttribute('data-k') === (pf ? 'pf' : 'sv')) { tr.hidden = true; return; } tr.hidden = false; tr.setAttribute('data-k', pf ? 'pf' : 'sv');
              var host = document.createElement('section'); host.className = 'panel'; var td = tr.firstElementChild; td.innerHTML = ''; td.appendChild(host); host.innerHTML = '<p class="small muted">Loading…</p>';
              (pf ? load('/assets/portfolio.js', 'BVPF').then(function () { BVPF.view(host, S, { ids: [id], names: nm, teacher: true }); }) : load('/assets/service.js', 'BVSVC').then(function () { BVSVC.view(host, S, { ids: [id], names: nm, teacher: true }); }))
                .then(function () { setTimeout(function () { if (!td.contains(host) || !host.parentNode) td.innerHTML = '<p class="small muted">Nothing ' + (pf ? 'in the portfolio' : 'logged') + ' yet.</p>'; }, 1500); }, function () { td.innerHTML = '<p class="msg">Could not load.</p>'; }); }; });
          };
          body.innerHTML = '<div class="row2" style="flex-wrap:wrap;gap:8px"><input id="scq" type="search" placeholder="Find a student or class…" style="flex:1;min-width:200px;max-width:380px"><button type="button" class="btn sm" id="sccsv">⬇ CSV</button></div><p class="small muted" style="margin:4px 0 0">Amber edge: not active for 14 days or more.</p><div id="scst"></div>';
          body.querySelector('#scq').oninput = function () { q = this.value.trim().toLowerCase(); paint(); };
          body.querySelector('#sccsv').onclick = function () { csv((O.school.name || 'school') + ' students.csv', [['Student', 'Classes', 'Last active', 'Average mark % (90 days)', 'Results']].concat(A.map(function (s) { return [s.name, (s.classes || []).join('; '), s.last ? new Date(s.last).toISOString().slice(0, 10) : '', s.avg90, s.results]; }))); };
          paint();
        });
      }
      function licenceTab() {
        body.innerHTML = '<section class="panel"><h3 style="margin-top:0">⭐ School licence</h3>' + (lic ? '<p>' + (licOn ? '<span class="sc-pill ok">active</span>' : '<span class="sc-pill r">not active</span>') + ' From <b>' + E(day(lic.starts_on)) + '</b> to <b>' + E(day(lic.until)) + '</b>' + (lic.seats ? ' · <b>' + lic.seats + '</b> seats, <b>' + used + '</b> in use' + (used > lic.seats ? ' <span class="sc-pill w">over by ' + (used - lic.seats) + '</span>' : '') : '') + '</p>' + (lic.note ? '<p class="small muted">' + E(lic.note) + '</p>' : '') : '<p>This school has no licence. Students and teachers each need their own premium access.</p>') +
          '<p class="small muted">With a licence, every approved student of the school\'s classes, their teachers and the coordinators have premium access, with no payment one by one. Seats count the students in the school\'s current classes. To start or renew a licence, contact VistaEd.</p>' +
          (me.admin ? '<form id="sclf" class="grp" style="border-top:1px solid #e2e8f0;padding-top:10px;margin-top:10px"><h4 style="margin:0">Site admin: set the licence</h4><div class="row2" style="flex-wrap:wrap;gap:10px;justify-content:flex-start">' +
            '<label class="f">Starts<input type="date" id="sls" value="' + E(lic ? lic.starts_on : new Date().toISOString().slice(0, 10)) + '"></label><label class="f">Ends<input type="date" id="slu" required value="' + E(lic ? String(lic.until).slice(0, 10) : '') + '"></label><label class="f">Seats<input type="number" id="sln" min="1" max="100000" value="' + E(lic && lic.seats || '') + '" style="width:110px"></label></div>' +
            '<label class="f">Note (invoice, contact)<input id="slt" maxlength="500" value="' + E(lic && lic.note || '') + '"></label><p><button class="btn main sm" type="submit">Save licence</button> ' + (licOn ? '<button type="button" class="btn sm" id="slend">End it today</button>' : '') + ' <span class="small" id="slm" role="status"></span></p></form>' : '') + '</section>';
        var f = body.querySelector('#sclf'); if (!f) return;
        var save = function (ends) { var m = body.querySelector('#slm'); S.db.rpc('set_school_licence', { sch: sid, starts: body.querySelector('#sls').value || null, ends: ends, n: +body.querySelector('#sln').value || null, why: body.querySelector('#slt').value.trim() || null }).then(function (x) { if (x.error) { m.textContent = S.nice(x.error); return; } page(me, L, sid, 'licence'); }); };
        f.onsubmit = function (e) { e.preventDefault(); var u = body.querySelector('#slu').value; if (!u) return; save(new Date(u + 'T23:59:59').toISOString()); };
        var en = body.querySelector('#slend'); if (en) en.onclick = function () { if (confirm('End this school\'s licence now? Its students lose premium access unless they have their own.')) save(new Date().toISOString()); };
      }
      draw();
    });
  }
})();
