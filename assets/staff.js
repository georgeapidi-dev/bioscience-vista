/* Teacher dashboard · BioscienceVista
   Everything here runs with the teacher's own login. Row Level Security decides what each teacher can read or change;
   no service-role key or admin password is ever used in the browser. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), ME, TOPICS = [], CLASSES = [];
  var TABS = [['overview', 'Overview'], ['work', 'Lesson work'], ['questions', '❓ Student questions'], ['labs', '🔬 Lab work'], ['approvals', 'Approvals'], ['classes', 'Classes'], ['students', 'Students & results'], ['quizzes', 'Quizzes & exams'], ['lessons', 'Lesson builder'], ['marking', 'Marking'], ['grading', '🎯 Grade boundaries'], ['bin', '🗑 Bin'], ['content', 'Site data'], ['bookings', 'Bookings'], ['roles', 'People & roles'], ['activity', 'Activity']];
  var ADMIN_TABS = ['bookings', 'roles', 'activity', 'content'];   // Content (topics, link lists): admin only since 16 Nov 2026; teachers add lessons from the main site instead
  // the sections in four colourful groups (16 Nov 2026, admin: too many buttons): Students' work, Build and set, Classes and people, Site
  var TGROUPS = [['📥 Students\' work', '#ea580c', ['overview', 'marking', 'work', 'questions', 'labs', 'approvals']], ['🛠️ Build and set', '#2563eb', ['quizzes', 'lessons', 'grading']],
    ['👥 Classes and people', '#059669', ['classes', 'students', 'roles', 'bookings']], ['⚙️ Site', '#7c3aed', ['activity', 'content', 'bin']]];
  function tabGroups(tab) {
    var name = {}; TABS.forEach(function (t) { name[t[0]] = t[1]; });
    var shown = function (k) { return name[k] && (ADMIN_TABS.indexOf(k) < 0 || (ME.admin && !TEACH)); };
    return '<style>.tg{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin:12px 0}.tg>div{border-radius:16px;padding:10px 12px;background:#fff;border:1px solid #e2e8f0;border-top:5px solid var(--g)}.tg h4{margin:0 0 6px;font-size:.85rem;color:var(--g);text-transform:uppercase;letter-spacing:.04em}' +
      '.tg nav{display:flex;flex-wrap:wrap;gap:6px}.tg a{font-size:.86rem;font-weight:700;padding:5px 10px;border-radius:999px;text-decoration:none;color:var(--g);background:color-mix(in srgb,var(--g) 10%,#fff);border:1px solid color-mix(in srgb,var(--g) 30%,#fff)}.tg a[aria-selected=true]{background:var(--g);color:#fff}</style>' +
      '<div class="tg" aria-label="Teacher sections">' + TGROUPS.map(function (G) { var ks = G[2].filter(shown); if (!ks.length) return '';
        return '<div style="--g:' + G[1] + '"><h4>' + G[0] + '</h4><nav class="tabs-g">' + ks.map(function (k) { return '<a href="#' + k + '" aria-selected="' + (k === tab) + '">' + String(name[k]).replace(/^(❓|🔬|🎯|🗑) /, '') + '</a>'; }).join('') + '</nav></div>'; }).join('') + '</div>';
  }
  // /teach/ is "My classes": the same dashboard, limited to the classes this teacher owns (any teacher, and the admin's own classes)
  var TEACH = location.pathname.indexOf('/teach/') === 0, MINE = {}, CLASS_OF = {};
  // Grade 6 to 10 science is kept in its three subjects everywhere (Biology, Chemistry, Physics): QSUBJ is true when quizzes.subject exists (migration 036)
  var QSUBJ = false;
  function topicName(tid) { for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i].id === tid) return TOPICS[i].name; return ''; }
  function quizSubj(q) { return BV.subj.of(q.subject, topicName(q.topic_id), q.title); }
  function mypQuiz(q) {   // a question set or exam for a Grade 6 to 10 science class
    return (q.quiz_classes || []).some(function (x) { return CLASSES.some(function (c) { return c.id === x.class_id && BV.subj.isMyp(c); }); }) || /^MYP/.test(progOf(q.topic_id)) || /\bgrade (6|7|8|9|10)\b/i.test(q.title || '');
  }
  function mine(sid) { return !TEACH || !!MINE[sid]; }
  /* Admin only, on My classes (/teach/): look into another teacher's classroom. The database already lets the admin read and edit every class
     (policy classes_admin); this only chooses whose classes the page lists. Nothing changes for teachers. */
  var AS = null, TEACHERS = [], TNAME = {};
  try { AS = new URLSearchParams(location.search).get('as') || sessionStorage.getItem('bv-as-teacher') || null; } catch (e) {}
  function OWNER() { return TEACH && ME && ME.admin && AS ? AS : ME.user.id; }
  function dashLink(id) { return ME && ME.admin ? ' <a class="small" href="/dashboard/?as=' + id + '" target="_blank" rel="noopener" title="Open this student\'s dashboard as they see it (view only)">📊 dashboard</a>' : ''; }
  // My classes is colourful: every class has its own colour, used on its buttons, cards and page banner
  var HUES = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#ea580c', '#db2777', '#ca8a04', '#dc2626', '#4f46e5', '#0d9488'];
  function hue(id) { var i = CLASSES.map(function (c) { return c.id; }).indexOf(id); if (i < 0) { i = 0; for (var k = 0; k < String(id).length; k++) i = (i * 31 + String(id).charCodeAt(k)) >>> 0; } return HUES[i % HUES.length]; }
  (function () { if (document.getElementById('teach-css')) return; var st = document.createElement('style'); st.id = 'teach-css'; st.textContent = [
    '.teach-ui nav.tabs{gap:8px;border:0}',
    '.teach-ui nav.tabs a{--k:#2563eb;border:2px solid color-mix(in srgb,var(--k) 35%,transparent);background:color-mix(in srgb,var(--k) 10%,transparent);color:var(--k);font-weight:700;border-radius:999px;transition:transform .15s,box-shadow .15s}',
    '.teach-ui nav.tabs a:hover{transform:translateY(-2px);box-shadow:0 6px 16px color-mix(in srgb,var(--k) 30%,transparent)}',
    '.teach-ui nav.tabs a[aria-selected=true]{background:linear-gradient(135deg,var(--k),color-mix(in srgb,var(--k) 72%,#fff))!important;color:#fff!important;border-color:transparent!important;box-shadow:0 6px 18px color-mix(in srgb,var(--k) 40%,transparent)}',
    '.teach-ui .stats .stat{color:#fff;border:0;background:linear-gradient(135deg,var(--k,#7c3aed),color-mix(in srgb,var(--k,#7c3aed) 70%,#fff));box-shadow:0 8px 20px color-mix(in srgb,var(--k,#7c3aed) 30%,transparent)}',
    '.teach-ui .stats .stat .muted,.teach-ui .stats .stat a,.teach-ui .stats .stat b{color:#fff!important;opacity:.97}',
    '.cband .btn{color:#fff!important;border-color:rgba(255,255,255,.75)!important;background:rgba(255,255,255,.16)!important}',
    '.regb{--k:#16a34a;border:2px solid color-mix(in srgb,var(--k) 45%,transparent)!important;background:color-mix(in srgb,var(--k) 10%,transparent)!important;color:var(--k)!important;font-weight:700}',
    '.regb[aria-pressed=true]{background:var(--k)!important;color:#fff!important;border-color:var(--k)!important}',
    '.teach-ui .stats .stat:nth-child(1){--k:#7c3aed}.teach-ui .stats .stat:nth-child(2){--k:#2563eb}.teach-ui .stats .stat:nth-child(3){--k:#ea580c}.teach-ui .stats .stat:nth-child(4){--k:#059669}',
    '.cband{border-radius:18px;padding:18px 20px;color:#fff;background:linear-gradient(120deg,var(--k),color-mix(in srgb,var(--k) 75%,#fff));box-shadow:0 10px 26px color-mix(in srgb,var(--k) 35%,transparent);margin:0 0 14px}',
    '.cband h2,.cband h3,.cband .label,.cband .muted,.cband a,.cband .small{color:#fff!important}.cband .code{background:rgba(255,255,255,.2);color:#fff}',
    '.cchips{display:flex;flex-wrap:wrap;gap:8px}.cchip{--k:#2563eb;border:2px solid var(--k);background:color-mix(in srgb,var(--k) 12%,transparent);color:var(--k);font-weight:800;border-radius:14px;padding:8px 14px;cursor:pointer;font:inherit;font-weight:800}',
    '.cchip.on{background:linear-gradient(135deg,var(--k),color-mix(in srgb,var(--k) 72%,#fff));color:#fff;border-color:transparent;box-shadow:0 6px 16px color-mix(in srgb,var(--k) 35%,transparent)}',
    '.qlinks{display:flex;flex-wrap:wrap;gap:8px}.qlinks a{--k:#2563eb;text-decoration:none;font-weight:700;border-radius:12px;padding:8px 12px;color:#fff;background:linear-gradient(135deg,var(--k),color-mix(in srgb,var(--k) 60%,#000 0%));box-shadow:0 4px 12px color-mix(in srgb,var(--k) 30%,transparent)}.qlinks a:hover{filter:brightness(1.1)}',
    '.ccards{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}.ccard2{--k:#2563eb;border-radius:16px;padding:14px;color:#fff;text-decoration:none;background:linear-gradient(135deg,var(--k),color-mix(in srgb,var(--k) 72%,#fff));box-shadow:0 8px 20px color-mix(in srgb,var(--k) 30%,transparent);display:flex;flex-direction:column;gap:6px}',
    '.cc-main{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.cc-main a{background:rgba(255,255,255,.95);color:var(--k)!important;border-radius:999px;padding:4px 12px;font-size:.85rem;text-decoration:none}.cc-more summary{cursor:pointer;font-size:.82rem;opacity:.9;margin-top:4px}.cc-more span{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:.85rem;margin-top:4px}',
    '.ccard2 b{font-size:1.1rem}.ccard2 a{color:#fff;font-weight:700}.ccard2 .small{opacity:.95}.ccard2:hover{transform:translateY(-2px)}'
  ].join('\n'); document.head.appendChild(st); })();
  var TABHUE = { overview: '#7c3aed', work: '#2563eb', questions: '#db2777', labs: '#0891b2', approvals: '#ea580c', classes: '#059669', students: '#4f46e5', quizzes: '#ca8a04', lessons: '#0d9488', marking: '#dc2626', grading: '#7c3aed', bin: '#64748b', content: '#9333ea' };

  S.guard(app, TEACH ? { school: true, allowPending: true } : { staff: true }).then(function (me) { ME = me; return TEACH ? courseRequests() : null; }).then(function () { if (TEACH && !teachGate(ME)) throw 'gate'; return Promise.all([refs(), loadScript('/assets/quiz-import.js?v=' + (window.BV_VER || '5'))]); }).then(firstClasses).then(function () { window.addEventListener('hashchange', route); route(); })
    .catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  function teachGate(me) {   // teachers from other schools: approved account + premium; the admin and main-site teachers always
    if (me.admin || me.roles.indexOf('teacher') >= 0) return true;
    var st = me.profile.teacher_status, a = me.access || {};
    var top = '<p class="label">My classes</p><h2>Hello, ' + E((me.profile.full_name || '').split(' ')[0] || 'teacher') + '</h2>';
    if (!me.school) { app.innerHTML = '<section class="panel"><h2>Teachers only</h2><p>This page is for teacher accounts. <a href="/dashboard/">Go to your dashboard</a>.</p></section>'; return false; }
    if (st !== 'approved' || me.roles.indexOf('school_teacher') < 0) { app.innerHTML = top + '<section class="panel tint"><h3>' + (st === 'rejected' ? 'Your teacher account was not approved' : '⏳ Waiting for approval') + '</h3><p>' + (st === 'rejected' ? 'Contact the BioscienceVista admin through Messages if you think this is a mistake.' : 'The BioscienceVista admin checks every new teacher account. You can buy premium now; your classes open as soon as you are approved.') + '</p><p><a class="btn sm" href="/messages/">Messages</a> <a class="btn sm" href="/premium/">Premium</a></p></section><div id="mycbox"></div>'; coursePanel(app.querySelector('#mycbox')); return false; }
    if (!a.premium) { app.innerHTML = top + '<section class="panel tint"><h3>Premium is needed to run classes</h3><p>Your teacher account is approved. Get premium to create classes, add BioscienceVista lessons and quizzes, and see your students\' results.</p><a class="btn main" href="/premium/">Get premium</a></section>'; return false; }
    return true;
  }
  function loadScript(src) { return new Promise(function (ok, bad) { var x = document.createElement('script'); x.src = src; x.onload = ok; x.onerror = function () { bad(new Error('Could not load ' + src)); }; document.head.appendChild(x); }); }
  var ARCHIVED = [];
  function refs() {
    return Promise.all([S.db.from('topics').select('id,name,code,programme,parent_id,sort_order, subjects(name,sort_order)').order('sort_order'), S.db.from('classes').select('*').order('name'), S.quizSubjectCol()])
      .then(function (x) { TOPICS = x[0].data || []; QSUBJ = x[2] === true;
        var all = (x[1].data || []).filter(function (c) { return TEACH ? c.owner_kind !== 'main' && c.teacher_id === OWNER() : c.owner_kind === 'main' && (ME.admin || c.teacher_id === ME.user.id); });   /* main site (/staff/) and My classes (/teach/) are kept apart */
        all = all.filter(function (c) { return !c.deleted_at; });   // removed classes are in the 🗑 Bin (migration 042)
        CLASSES = all.filter(function (c) { return !c.archived_at; }); ARCHIVED = all.filter(function (c) { return c.archived_at; });
        var others = {}; if (TEACH && ME.admin) (x[1].data || []).forEach(function (c) { if (c.owner_kind !== 'main' && c.teacher_id && c.teacher_id !== ME.user.id) others[c.teacher_id] = (others[c.teacher_id] || 0) + 1; });
        TEACHERS = Object.keys(others).map(function (id) { return { id: id, n: others[id] }; });
        var want = TEACHERS.map(function (t) { return t.id; }).concat(TEACH && ME.admin && AS ? [AS] : []);
        var names = want.length ? S.db.from('profiles').select('id,full_name,school_name').in('id', want).then(function (r) { (r.data || []).forEach(function (q) { TNAME[q.id] = (q.full_name || 'Teacher') + (q.school_name ? ' · ' + q.school_name : ''); }); TEACHERS.sort(function (a, b) { return (TNAME[a.id] || '').localeCompare(TNAME[b.id] || ''); }); }) : Promise.resolve();
        var ids = CLASSES.map(function (c) { return c.id; }); MINE = {}; CLASS_OF = {};
        if (!ids.length) return names;
        return Promise.all([S.db.from('enrolments').select('student_id,class_id,status').in('class_id', ids), S.db.from('profiles').select('id,class_id').in('class_id', ids), names]).then(function (y) {
          (y[0].data || []).forEach(function (e) { if (e.status === 'approved') { MINE[e.student_id] = 1; CLASS_OF[e.student_id] = CLASS_OF[e.student_id] || e.class_id; } });
          (y[1].data || []).forEach(function (r) { MINE[r.id] = 1; CLASS_OF[r.id] = CLASS_OF[r.id] || r.class_id; });
        });
      });
  }
  function topicOpts(sel) {   // grouped by subject; subtopics indented under their main topic
    var subj = {}, order = [];
    TOPICS.forEach(function (t) { var n = t.subjects ? t.subjects.name : 'Other'; if (!subj[n]) { subj[n] = []; order.push(n); } subj[n].push(t); });
    var so = {}; TOPICS.forEach(function (t) { if (t.subjects) so[t.subjects.name] = t.subjects.sort_order; }); order.sort(function (a, b) { return (so[a] || 99) - (so[b] || 99); });
    return '<option value="">(none)</option>' + order.map(function (n) {
      var ts = subj[n], tops = ts.filter(function (t) { return !t.parent_id; }).sort(function (a, b) { return a.sort_order - b.sort_order; });
      var opt = function (t, pad) { return '<option value="' + t.id + '"' + (t.id === sel ? ' selected' : '') + '>' + pad + E(t.name) + '</option>'; };
      return '<optgroup label="' + E(n) + '">' + tops.map(function (t) { return opt(t, '') + ts.filter(function (c) { return c.parent_id === t.id; }).sort(function (a, b) { return a.sort_order - b.sort_order; }).map(function (c) { return opt(c, '\u00a0\u00a0\u00a0— '); }).join(''); }).join('') + '</optgroup>';
    }).join('');
  }
  function classOpts(sel, blank) { return (blank ? '<option value="">' + blank + '</option>' : '') + CLASSES.map(function (c) { return '<option value="' + c.id + '"' + (c.id === sel ? ' selected' : '') + '>' + E(c.name) + '</option>'; }).join(''); }
  function toast(m, bad) { if (BV.toast) BV.toast(m, bad); }
  function ok(r, msg) { if (r.error) { toast(S.nice(r.error), true); return false; } if (msg) toast(msg); return true; }
  function code6() { var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = ''; var b = new Uint8Array(6); crypto.getRandomValues(b); for (var i = 0; i < 6; i++) s += a[b[i] % a.length]; return s; }
  function dt(v) { if (!v) return ''; var d = new Date(v); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
  function iso(v) { return v ? new Date(v).toISOString() : null; }

  function route() {
    clearInterval(LIVE);
    var h = location.hash.slice(1).split('/'), tab = h[0] || 'overview';
    if (ADMIN_TABS.indexOf(tab) >= 0 && (!ME.admin || TEACH)) tab = 'overview';
    var head = '<div class="row2 cband" style="--k:' + (TEACH ? '#059669' : '#2563eb') + '"><div><p class="label">' + (TEACH ? 'My classes' + (ME.profile.school_name ? ' · ' + E(ME.profile.school_name) : '') : 'Main site · courses and their classes') + '</p><h2>' + (TEACH && ME.admin && AS ? 'Classroom of ' + E(TNAME[AS] || 'this teacher') : E(ME.profile.full_name || ME.user.email)) + (ME.admin ? ' <span class="pill">Admin</span>' : '') + '</h2></div><div class="cta">' + '<a class="btn sm" href="/board/">🖊 Whiteboard</a><a class="btn sm" href="/live/">🎥 Live Classroom</a>' + (TEACH ? '<a class="btn sm" href="/messages/">Messages</a>' + (ME.admin ? '' : '<a class="btn sm" href="/premium/">Premium</a>') : ME.admin ? '<a class="btn main sm" href="/admin/">Admin: join requests, members, payments</a>' : '') + '<button class="btn sm" type="button" id="so">Log out</button></div></div>' +
      (TEACH && ME.admin ? '<div class="panel tint row2" id="asbar" style="align-items:center">' + (AS ? '<span>👁 <b>Admin view.</b> You are in <b>' + E(TNAME[AS] || 'this teacher') + '</b>\'s classroom: their dashboard, classes and students. Changes you make here are saved to their classes.</span>'
        : '<span>👁 <b>Admin:</b> open another teacher\'s classroom to see and edit their classes, their dashboard and their students.</span>') +
        '<label class="f" style="margin:0;min-width:240px">Whose classroom<select id="aspick"><option value="">My own classes</option>' + TEACHERS.map(function (t) { return '<option value="' + t.id + '"' + (t.id === AS ? ' selected' : '') + '>' + E(TNAME[t.id] || 'Teacher') + ' (' + t.n + ' class' + (t.n === 1 ? '' : 'es') + ')</option>'; }).join('') + '</select></label></div>' : '') +
      tabGroups(tab) + '<div id="pane"><p class="muted">Loading…</p></div>';
    app.innerHTML = head; app.querySelector('#so').onclick = S.signOut;
    (function () {   // switch between the admin, teacher and student views of the site
      var va = document.createElement('div'); va.className = 'panel row2'; va.id = 'viewas'; va.style.alignItems = 'center';
      va.innerHTML = '<span><b>👁 View the site as:</b> ' + (ME.admin ? '<a class="btn sm' + (TEACH ? '' : ' main') + '" href="/staff/">🛠 Admin</a> ' : '') + '<a class="btn sm' + (TEACH ? ' main' : '') + '" href="/teach/">🧑‍🏫 Teacher</a></span>' +
        '<label class="f" style="margin:0;min-width:240px">🎒 Student preview<select id="vas"><option value="">Choose a class…</option>' + CLASSES.map(function (c) { return '<option value="' + c.id + '">' + E(c.name) + '</option>'; }).join('') + '</select></label>';
      var nav = app.querySelector('.tg') || app.querySelector('nav.tabs'); if (nav) nav.parentNode.insertBefore(va, nav);
      va.querySelector('#vas').onchange = function () { if (this.value) location.href = '/dashboard/?preview=' + encodeURIComponent(this.value) + '&from=' + (TEACH ? 'teach' : 'staff'); };
    })();
    var pk = app.querySelector('#aspick'); if (pk) pk.onchange = function () { AS = pk.value || null; try { if (AS) sessionStorage.setItem('bv-as-teacher', AS); else sessionStorage.removeItem('bv-as-teacher'); } catch (e) {}
      TC.cur = null; if (history.replaceState) history.replaceState(null, '', location.pathname + '#overview'); refs().then(route); };
    app.classList.add('teach-ui');
    app.querySelectorAll('nav.tabs a').forEach(function (a) { var k = TABHUE[a.getAttribute('href').slice(1)]; if (k) a.style.setProperty('--k', k); });
    var pane = app.querySelector('#pane');
    ({ overview: TEACH ? teachOverview : overview, work: lessonWork, questions: helpDesk, labs: labWork, approvals: TEACH ? teachApprovals : approvals, activity: activity, lessons: lessons, classes: TEACH ? teachClasses : classes, students: students, quizzes: quizzes, marking: marking, grading: gradeBounds, bin: binTab, content: content, roles: roles, bookings: bookings }[tab] || overview)(pane, h.slice(1));
  }

  /* ---------- 🗑 Bin: removed classes, deleted quizzes and lessons stay here for 30 days (migration 042) ---------- */
  function binTab(p) {
    p.innerHTML = '<p class="muted">Loading the bin…</p>';
    S.db.rpc('bin_list').then(function (r) {
      if (r.error) { p.innerHTML = '<p class="emptybox">The bin needs database update 042 (' + E(r.error.message) + ').</p>'; return; }
      var rows = r.data || [], KIND = { quiz: '📝 Quiz or lesson', lesson: '📘 Lesson', 'class': '🏫 Class' };
      var left = function (d) { var n = 30 - Math.floor((Date.now() - new Date(d).getTime()) / 864e5); return n > 0 ? n + ' day' + (n === 1 ? '' : 's') : 'due for deletion'; };
      p.innerHTML = '<section class="panel tint"><h3 style="margin-top:0">🗑 Bin</h3><p>Deleted quizzes, interactive lessons' + (ME.admin ? ' and removed classes' : '') + ' stay here for 30 days. <b>Restore</b> brings an item back (unpublished, so you can check it before students see it again).' +
        (ME.admin ? ' As the admin you can also <b>delete permanently</b>; this cannot be undone.' : ' After 30 days the admin can delete it permanently.') + '</p>' +
        (ME.admin ? '<div class="acts"><button type="button" class="btn sm" id="empty" style="--c:#b91c1c">Delete everything older than 30 days</button></div>' : '') + '</section>' +
        (rows.length ? '<div class="tablewrap"><table class="marks"><tr><th>Item</th><th>Type</th>' + (ME.admin ? '<th>Owner</th>' : '') + '<th>Deleted</th><th>Kept for</th><th></th></tr>' + rows.map(function (x) {
          return '<tr><td>' + E(x.title || 'Untitled') + '</td><td class="small">' + E(KIND[x.kind] || x.kind) + '</td>' + (ME.admin ? '<td class="small">' + E(x.owner_name || '–') + '</td>' : '') +
            '<td class="small">' + E(S.when(x.deleted_at)) + (x.deleted_by_name ? ' by ' + E(x.deleted_by_name) : '') + '</td><td class="small">' + E(left(x.deleted_at)) + '</td>' +
            '<td><button type="button" class="btn sm" data-rs="' + x.kind + '|' + x.id + '">↩ Restore</button>' + (ME.admin ? ' <button type="button" class="btn sm" data-pg="' + x.kind + '|' + x.id + '" style="--c:#b91c1c">Delete permanently</button>' : '') + '</td></tr>';
        }).join('') + '</table></div>' : '<p class="emptybox">The bin is empty.</p>');
      p.querySelectorAll('[data-rs]').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-rs').split('|');
        S.db.rpc('restore_item', { kind: k[0], item: k[1] }).then(function (x) { if (ok(x, 'Restored')) refs().then(function () { binTab(p); }); }); }; });
      p.querySelectorAll('[data-pg]').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-pg').split('|');
        if (prompt('Delete permanently? This cannot be undone' + (k[0] === 'class' ? ': its students are taken out of the class' : k[0] === 'quiz' ? ': students\' answers and marks for it are deleted too' : '') + '.\n\nType DELETE to confirm.') !== 'DELETE') return;
        S.db.rpc('purge_item', { kind: k[0], item: k[1] }).then(function (x) { if (ok(x, 'Deleted permanently')) binTab(p); }); }; });
      var em = p.querySelector('#empty'); if (em) em.onclick = function () {
        if (prompt('Permanently delete everything that has been in the bin for more than 30 days? Type DELETE to confirm.') !== 'DELETE') return;
        S.db.rpc('empty_bin', { days: 30 }).then(function (x) { if (ok(x, (x.data || 0) + ' item' + (x.data === 1 ? '' : 's') + ' deleted permanently')) binTab(p); }); };
    });
  }

  /* ---------- grade boundaries: each teacher sets the % needed for each IB grade (HL, SL) and MYP level (migration 041) ---------- */
  function gradeBounds(p) {
    var D = BVT.DEFAULT_BOUNDS, KIND = [['HL', 'IB Diploma · Higher Level (HL)', 'Grade', 2], ['SL', 'IB Diploma · Standard Level (SL)', 'Grade', 2], ['MYP', 'MYP (Grades 6–10)', 'Level', 1]];
    p.innerHTML = '<p class="muted">Loading your boundaries…</p>';
    S.db.from('grade_boundaries').select('scale,bounds,updated_at').eq('teacher_id', ME.user.id).then(function (r) {
      if (r.error) { p.innerHTML = '<p class="emptybox">Grade boundaries are not available yet (' + E(r.error.message) + ').</p>'; return; }
      var mine = {}; (r.data || []).forEach(function (x) { mine[x.scale] = x; });
      p.innerHTML = '<section class="panel tint"><h3 style="margin-top:0">🎯 Grade boundaries</h3><p>Set the percentage a student needs for each grade. Your students\' quizzes, exam-style questions and interactive lessons are graded with <b>your</b> boundaries: '
        + 'IB grades 1–7 for HL and SL classes, and MYP levels 1–8 for Grade 6–10 classes. Below the lowest boundary a student gets grade 1 (IB) or level 0 (MYP). Each boundary must be higher than the one before.</p>'
        + (TEACH && ME.admin && AS ? '<p class="small"><b>Note:</b> these are your own boundaries, not those of the classroom you are viewing.</p>' : '') + '</section>'
        + KIND.map(function (k) {
          var b = (mine[k[0]] && mine[k[0]].bounds) || D[k[0]];
          return '<section class="panel" data-scale="' + k[0] + '"><h3 style="margin-top:0">' + E(k[1]) + '</h3>'
            + '<p class="small muted">' + (mine[k[0]] ? 'Your boundaries, saved ' + E(S.when ? S.when(mine[k[0]].updated_at) : mine[k[0]].updated_at) + '.' : 'Using the default boundaries. Change them and save to use your own.') + '</p>'
            + '<div class="tablewrap"><table><tr>' + b.map(function (_, i) { return '<th>' + k[2] + ' ' + (i + k[3]) + '</th>'; }).join('') + '</tr><tr>'
            + b.map(function (v, i) { return '<td><input type="number" min="0" max="100" step="0.5" value="' + E(v) + '" data-i="' + i + '" style="width:5.2em" aria-label="' + k[2] + ' ' + (i + k[3]) + ' minimum percentage"> %</td>'; }).join('') + '</tr></table></div>'
            + '<p class="small" data-try></p><div class="acts"><button type="button" class="btn main sm" data-save>Save ' + k[0] + ' boundaries</button> <button type="button" class="btn sm" data-reset>Back to defaults</button> <span class="small" data-msg></span></div></section>';
        }).join('');
      p.querySelectorAll('section[data-scale]').forEach(function (sec) {
        var sc = sec.getAttribute('data-scale'), msg = sec.querySelector('[data-msg]'), ins = [].slice.call(sec.querySelectorAll('input[data-i]'));
        function vals() { return ins.map(function (x) { return +x.value; }); }
        function ok(v) { return v.every(function (x, i) { return isFinite(x) && x >= 0 && x <= 100 && (i === 0 || x > v[i - 1]); }); }
        function preview() {
          var v = vals(), t = sec.querySelector('[data-try]');
          if (!ok(v)) { t.innerHTML = '<span style="color:#b91c1c">Each boundary must be between 0 and 100 and higher than the one before.</span>'; return; }
          var keep = BVT.BOUNDS[sc]; BVT.BOUNDS[sc] = v;
          t.textContent = 'Example: ' + [25, 50, 75].map(function (pc) { var l = BVT.level(pc, 100, sc); return pc + ' % → ' + l.name + ' ' + l.n; }).join(' · ');
          BVT.BOUNDS[sc] = keep;
        }
        ins.forEach(function (x) { x.oninput = preview; }); preview();
        sec.querySelector('[data-save]').onclick = function () {
          var v = vals(); if (!ok(v)) { msg.textContent = 'Please fix the boundaries first.'; return; }
          msg.textContent = 'Saving…';
          S.db.from('grade_boundaries').upsert({ teacher_id: ME.user.id, scale: sc, bounds: v, updated_at: new Date().toISOString() }).then(function (x) {
            if (x.error) { msg.textContent = 'Could not save: ' + x.error.message; return; }
            try { sessionStorage.removeItem('bv-bounds'); } catch (e) {} BVT.loadBounds(true); msg.textContent = '✓ Saved. Your students now see grades with these boundaries.';
          });
        };
        sec.querySelector('[data-reset]').onclick = function () {
          msg.textContent = 'Resetting…';
          S.db.from('grade_boundaries').delete().eq('teacher_id', ME.user.id).eq('scale', sc).then(function (x) {
            if (x.error) { msg.textContent = 'Could not reset: ' + x.error.message; return; }
            D[sc].forEach(function (v, i) { ins[i].value = v; }); preview();
            try { sessionStorage.removeItem('bv-bounds'); } catch (e) {} BVT.loadBounds(true); msg.textContent = '✓ Back to the default boundaries.';
          });
        };
      });
    });
  }

  /* ---------- lesson work: each student's completed interactive lesson, shown as a finished document ---------- */
  var LW = null;   // cache: {rows, steps, specs}
  function lwParse(line) {
    var head = (String(line).match(/^\[AUTO[^\]]*\]\s*/) || [''])[0], rest = String(line).slice(head.length), out = { answers: [], fb: {}, total: null, max: null, this: null };
    var t = head.match(/TOTAL=([\d.]+)\/([\d.]+)/), th = head.match(/THIS=([\d.]+)\/([\d.]+)/);
    if (t) { out.total = +t[1]; out.max = +t[2]; } if (th) out.this = [+th[1], +th[2]];
    rest.split(/\s*‖\s*/).forEach(function (seg) {
      if (/^Feedback:/.test(seg)) { seg.replace(/^Feedback:\s*/, '').split(/\s+\|\s+(?=Step \d+ \()/).forEach(function (f) { var m = f.match(/^Step (\d+) \(([\d.]+)\/([\d.]+)\):\s*(.*)$/); if (m) out.fb[m[1]] = { score: +m[2], max: +m[3], text: m[4] }; }); return; }
      seg = seg.trim(); if (/^[^:]{1,60}:$/.test(seg)) { out.answers.push([seg.slice(0, -1).trim(), '']); return; }
      var i = seg.indexOf(': '); out.answers.push(i > 0 && i < 60 ? [seg.slice(0, i).trim(), seg.slice(i + 2).trim()] : ['', seg]);
    });
    return out;
  }
  function lwLoad(force) {
    if (LW && !force) return Promise.resolve(LW);
    var all = [], page = function (from) { return S.db.from('lesson_work').select('*').order('saved_at', { ascending: false }).range(from, from + 999).then(function (r) { if (r.error) throw r.error; all = all.concat(r.data || []); return (r.data || []).length === 1000 && from < 4000 ? page(from + 1000) : all; }); };
    return Promise.all([page(0), fetch('/assets/lesson-steps.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
      S.db.from('lesson_specs').select('lesson,title,spec').then(function (r) { var o = {}; (r.data || []).forEach(function (x) { o[x.lesson] = x; }); return o; }, function () { return {}; })])
      .then(function (x) { LW = { rows: x[0], steps: x[1], specs: x[2] }; return lwPlaces(); });
  }
  // Which class each piece of work belongs to: the student's real classes (enrolments, or their profile class),
  // preferring the class whose lesson list contains that lesson. Typed class names are not trusted.
  function lwPlaces() {
    var ids = CLASSES.map(function (c) { return c.id; });
    if (!ids.length) { LW.places = {}; return LW; }
    return Promise.all([
      S.db.from('enrolments').select('student_id,class_id').eq('status', 'approved').in('class_id', ids),
      S.db.from('profiles').select('id,class_id').in('class_id', ids),
      S.db.from('class_materials').select('class_id,path').in('class_id', ids),
      S.db.from('lessons').select('url,external_id')]).then(function (x) {
      var mem = {}, has = {}, url = {};
      (x[0].data || []).concat((x[1].data || []).map(function (r) { return { student_id: r.id, class_id: r.class_id }; })).forEach(function (r) {
        (mem[r.student_id] = mem[r.student_id] || []); if (mem[r.student_id].indexOf(r.class_id) < 0) mem[r.student_id].push(r.class_id); });
      (x[3].data || []).forEach(function (l) { if (l.external_id) url[l.external_id] = l.url; });
      (x[2].data || []).forEach(function (r) { has[r.class_id + '|' + r.path] = 1; });
      LW.places = { mem: mem, has: has, url: url };
      return LW;
    });
  }
  function lwClassesOf(g) {
    var P = LW.places || {}, mine = (P.mem || {})[g.sid] || [];
    if (!mine.length) return [];
    var u = (P.url || {})[g.lesson], fit = u ? mine.filter(function (cid) { return (P.has || {})[cid + '|' + u]; }) : [];
    return fit.length ? fit : mine;
  }
  function lwGroups(rows) {   // one group per student + class + lesson, keeping the latest save of each step
    var g = {}, order = [];
    rows.forEach(function (r) {
      var k = (r.student_id || ((r.student_name || '').trim().toLowerCase() + '|' + (r.class_name || '').trim().toLowerCase())) + '|' + r.lesson;
      if (!g[k]) { g[k] = { key: k, sid: r.student_id, student: r.student_name, cls: r.class_name || '', lesson: r.lesson, steps: {}, last: r.saved_at, latest: r }; order.push(k); }
      if (!g[k].steps[r.step]) g[k].steps[r.step] = r;
    });
    return order.map(function (k) { var x = g[k], p = lwParse(x.latest.answers); x.total = p.total; x.max = p.max; x.fb = p.fb; return x; });
  }
  function lwDraw(g) {   // graphs and drawings the student made inside the lesson's questions (migration 035; before it the list is empty)
    if (g.drawLoaded) return Promise.resolve(); var done = function (rows) { g.draw = rows || []; g.drawLoaded = true; };
    if (!g.sid) { done([]); return Promise.resolve(); }
    return S.db.from('lesson_drawings').select('qkey,kind,label,image,updated_at').eq('student_id', g.sid).eq('lesson', g.lesson).order('qkey').then(function (r) { done(r.error ? [] : r.data); }, function () { done([]); });
  }
  function lwDoc(x) {
    var info = (LW.steps || {})[x.lesson] || { title: x.lesson, steps: {} }, spec = ((LW.specs || {})[x.lesson] || {}).spec || {}, models = spec.models || {};
    var nums = Object.keys(info.steps).length ? Object.keys(info.steps) : Object.keys(x.steps); nums = nums.map(Number).sort(function (a, b) { return a - b; });
    var done = Object.keys(x.steps).length, pc = x.max ? Math.round(100 * x.total / x.max) : null;
    var css = 'body{font:15px/1.55 system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#0f172a;background:#f6f8fb;margin:0}.wrap{max-width:880px;margin:0 auto;padding:22px 18px 40px}' +
      'header{background:linear-gradient(135deg,#0f766e,#1d4ed8);color:#fff;border-radius:18px;padding:20px 22px;margin-bottom:16px}header h1{margin:.1em 0 .3em;font-size:1.5rem}header .meta{opacity:.92;font-size:.92rem}' +
      '.score{display:flex;align-items:center;gap:12px;margin-top:12px}.bar{flex:1;height:10px;border-radius:99px;background:rgba(255,255,255,.3);overflow:hidden}.bar i{display:block;height:100%;background:#fde68a}.score b{font-size:1.3rem}' +
      '.step{background:#fff;border:1px solid #dde3ea;border-radius:16px;padding:16px 18px;margin:12px 0}.step.miss{opacity:.6;border-style:dashed}.sh{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.ph{font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;color:#0f766e;font-weight:700}' +
      '.step h2{margin:.1em 0 .4em;font-size:1.12rem}.mk{white-space:nowrap;border-radius:99px;padding:4px 12px;font-weight:700;font-size:.9rem;background:#e2e8f0}.mk.full{background:#dcfce7;color:#166534}.mk.part{background:#fef3c7;color:#92400e}.mk.low{background:#fee2e2;color:#991b1b}' +
      '.qa{border-top:1px solid #eef2f6;padding:10px 0}.q{font-weight:600;margin-bottom:4px}.a{background:#f1f5f9;border-radius:10px;padding:8px 12px;white-space:pre-wrap}.a.blank{color:#94a3b8;font-style:italic}' +
      '.mdl{margin-top:6px;font-size:.9rem}.mdl summary{cursor:pointer;color:#166534}.mdl div{background:#f0fdf4;border-radius:10px;padding:8px 12px;margin-top:4px}.fb{background:#eff6ff;border-left:4px solid #1d4ed8;border-radius:8px;padding:8px 12px;margin-top:10px;font-size:.92rem}' +
      '.tbl{display:flex;flex-wrap:wrap;gap:6px}.tbl span{background:#e0f2fe;border-radius:8px;padding:3px 9px}.foot{color:#64748b;font-size:.82rem;margin-top:20px}@media print{body{background:#fff}.step{break-inside:avoid}.mdl{display:none}header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}';
    var h = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + E(info.title) + ' · ' + E(x.student) + '</title><style>' + css + '</style></head><body><div class="wrap">' +
      '<header><div class="meta">Completed interactive lesson · BioscienceVista</div><h1>' + E(info.title) + '</h1><div class="meta"><b>' + E(x.student) + '</b> · ' + E(x.cls) + ' · ' + done + ' of ' + nums.length + ' steps saved · last saved ' + E(new Date(x.last).toLocaleString()) + '</div>' +
      (pc != null ? '<div class="score"><b>' + x.total + ' / ' + x.max + '</b><div class="bar"><i style="width:' + pc + '%"></i></div><b>' + pc + '%</b></div>' : '') + '</header>';
    nums.forEach(function (n) {
      var st = info.steps[n] || { title: '', phase: 'Step ' + n, q: {} }, row = x.steps[n], fb = x.fb[n], mdl = {};
      (models[n] || []).forEach(function (m) { mdl[m[0]] = m[1]; });
      var cls = fb ? (fb.score >= fb.max ? 'full' : fb.score >= fb.max / 2 ? 'part' : 'low') : '';
      h += '<section class="step' + (row ? '' : ' miss') + '"><div class="sh"><div><div class="ph">' + E(st.phase || 'Step ' + n) + '</div><h2>' + E(st.title || 'Step ' + n) + '</h2></div>' +
        (fb ? '<span class="mk ' + cls + '">' + fb.score + ' / ' + fb.max + '</span>' : row ? '<span class="mk">not marked</span>' : '<span class="mk">not saved</span>') + '</div>';
      if (!row) { h += '<p class="a blank">The student has not saved this step yet.</p></section>'; return; }
      lwParse(row.answers).answers.forEach(function (qa) {
        var lab = qa[0], ans = qa[1], q = st.q[lab] || (lab ? lab : ''), blank = !ans || ans === '-';
        var body = lab === 'Table' && !blank ? '<div class="tbl">' + ans.split(/;\s*/).map(function (v) { return '<span>' + E(v) + '</span>'; }).join('') + '</div>' : E(blank ? (lab === 'Table' ? 'The choices in this table were not included in the saved work (the mark above includes them).' : 'No answer') : ans.replace(/ \/ /g, '\n'));
        h += '<div class="qa">' + (q ? '<div class="q">' + E(q) + '</div>' : '') + '<div class="a' + (blank ? ' blank' : '') + '">' + body + '</div>' +
          (mdl[lab] || mdl[q] ? '<details class="mdl"><summary>Model answer</summary><div>' + E(mdl[lab] || mdl[q]) + '</div></details>' : '') + '</div>';
      });
      if (fb && fb.text) h += '<div class="fb"><b>Feedback:</b> ' + E(fb.text) + '</div>';
      h += '</section>';
    });
    if (x.draw && x.draw.length) h += '<section class="step"><div class="sh"><div><div class="ph">Made with the tools inside the questions</div><h2>Graphs and drawings</h2></div></div>' + x.draw.map(function (d) {
      return '<div class="qa"><div class="q">' + E((d.kind === 'graph' ? 'Graph' : 'Drawing') + ' · ' + (d.label || d.qkey)) + '</div><img src="' + E(d.image) + '" alt="' + (d.kind === 'graph' ? 'Student graph' : 'Student drawing') + '" style="max-width:100%;border:1px solid #cbd5e1;border-radius:8px;background:#fff"><div class="small" style="color:#64748b">Last changed ' + E(S.when(d.updated_at)) + '</div></div>'; }).join('') + '</section>';
    return h + '<p class="foot">Lesson by BioscienceVista · biosciencevista.com · printed ' + E(new Date().toLocaleString()) + '</p></div></body></html>';
  }
  function lessonWork(p, args) {
    p.innerHTML = '<p class="muted">Loading students\' lessons…</p>';
    lwLoad(args && args[0] === 'refresh').then(function () {
      var groups = lwGroups(LW.rows), cname = {}, count = {}, NONE = '_none';
      CLASSES.forEach(function (c) { cname[c.id] = c.name; });
      groups.forEach(function (g) { g.cids = lwClassesOf(g); if (!g.cids.length) g.cids = [NONE]; g.cids.forEach(function (cid) { count[cid] = (count[cid] || 0) + 1; }); if (g.cids[0] !== NONE) g.cls = g.cids.map(function (cid) { return cname[cid]; }).join(', '); });
      var classes = CLASSES.filter(function (c) { return count[c.id]; }).map(function (c) { return [c.id, c.name + ' (' + count[c.id] + ')']; });
      if (count[NONE] && ME.admin) classes.push([NONE, 'Not in any of your classes (' + count[NONE] + ')']);
      var pick = (args && args[0] && args[0] !== 'refresh' && count[args[0]]) ? args[0] : (classes[0] || [''])[0];
      p.innerHTML = '<section class="panel"><div class="row2"><div><h3 style="margin:0">Lesson work</h3><p class="small muted" style="margin:.3em 0 0">Each card is one student\'s interactive lesson, put together from every step they saved.</p></div><a class="btn sm" href="#work/refresh">↻ Refresh</a></div>' +
        '<div class="row2" style="justify-content:flex-start;flex-wrap:wrap;margin-top:10px"><label class="f">Class<select id="lwc">' + (classes.length ? classes.map(function (c) { return '<option value="' + E(c[0]) + '"' + (c[0] === pick ? ' selected' : '') + '>' + E(c[1]) + '</option>'; }).join('') : '<option value="">No lesson work in your classes yet</option>') + '</select></label>' +
        '<label class="f" style="min-width:240px">Lesson<select id="lwl"></select></label>' +
        '<label class="f">Student<input id="lws" type="search" placeholder="Name"></label><span class="small muted" id="lwn"></span></div></section>' +
        '<div id="lwgrid" class="lwgrid"></div><div id="lwdoc"></div>' +
        '<style>.lwgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px;margin:12px 0}.lwc{border:1px solid var(--line,#dde3ea);border-radius:14px;padding:12px 14px;background:var(--card,#fff);display:grid;gap:6px}' +
        '.lwc .t{font-weight:700}.lwc .s{font-size:.85rem;color:var(--muted,#64748b)}.lwc .bar{height:8px;border-radius:99px;background:#e2e8f0;overflow:hidden}.lwc .bar i{display:block;height:100%;background:#0f766e}.lwframe{width:100%;height:80vh;border:1px solid var(--line,#dde3ea);border-radius:14px;background:#fff}</style>';
      function lessonsFor(c) {   // the lesson list follows the chosen class
        var ls = []; groups.forEach(function (g) { if (g.cids.indexOf(c) >= 0 && ls.indexOf(g.lesson) < 0) ls.push(g.lesson); });
        ls.sort(function (a, b) { return ((LW.steps[a] || {}).title || a).localeCompare((LW.steps[b] || {}).title || b); });
        p.querySelector('#lwl').innerHTML = '<option value="">All lessons in this class</option>' + ls.map(function (l) { return '<option value="' + E(l) + '">' + E((LW.steps[l] || {}).title || l) + '</option>'; }).join('');
      }
      p.querySelector('#lwc').addEventListener('change', function () { lessonsFor(this.value); draw(); });
      lessonsFor(pick);
      function draw() {
        var c = p.querySelector('#lwc').value, l = p.querySelector('#lwl').value, q = p.querySelector('#lws').value.trim().toLowerCase();
        var list = c ? groups.filter(function (g) { return g.cids.indexOf(c) >= 0 && (!l || g.lesson === l) && (!q || (g.student || '').toLowerCase().indexOf(q) >= 0); }) : [];
        list.sort(function (a, b) { return ((LW.steps[a.lesson] || {}).title || a.lesson).localeCompare((LW.steps[b.lesson] || {}).title || b.lesson) || (a.student || '').localeCompare(b.student || ''); });
        p.querySelector('#lwn').textContent = list.length + ' lesson' + (list.length === 1 ? '' : 's') + (c ? ' in ' + (c === NONE ? 'no class' : cname[c]) : '');
        p.querySelector('#lwgrid').innerHTML = list.length ? list.slice(0, 300).map(function (g, i) {
          var info = LW.steps[g.lesson] || {}, nSteps = Object.keys(info.steps || {}).length || Object.keys(g.steps).length, done = Object.keys(g.steps).length, pc = g.max ? Math.round(100 * g.total / g.max) : null;
          return '<div class="lwc"><div class="t">' + E(g.student) + '</div><div class="s">' + E(g.cls) + '</div><div>' + E(info.title || g.lesson) + '</div>' +
            '<div class="s">' + done + ' of ' + nSteps + ' steps · ' + (pc != null ? '<b>' + g.total + ' / ' + g.max + '</b> (' + pc + '%)' : 'no marks yet') + ' · ' + E(S.when(g.last)) + '</div>' +
            (pc != null ? '<div class="bar"><i style="width:' + pc + '%"></i></div>' : '') +
            '<div class="acts"><button type="button" class="btn sm main" data-v="' + E(g.key) + '">📄 View completed lesson</button><button type="button" class="btn sm" data-d="' + E(g.key) + '" title="Download as an HTML file">⬇ HTML</button></div></div>';
        }).join('') : '<p class="emptybox">No lesson work matches.</p>';
        var byKey = {}; groups.forEach(function (g) { byKey[g.key] = g; });
        p.querySelectorAll('[data-v]').forEach(function (b) { b.onclick = function () { var g = byKey[b.getAttribute('data-v')]; if (!g.drawLoaded) lwDraw(g).then(function () { if (g.draw.length) b.onclick(); });   /* the student's graphs and drawings arrive a moment later and are added to the document */
          var d = p.querySelector('#lwdoc'), html = lwDoc(g);
          d.innerHTML = '<section class="panel"><div class="row2"><h3 style="margin:0">' + E(g.student) + ' · ' + E((LW.steps[g.lesson] || {}).title || g.lesson) + '</h3><div class="acts"><button type="button" class="btn sm" id="lwopen">↗ Open in a new tab / print</button><button type="button" class="btn sm" id="lwdl">⬇ Download HTML</button><button type="button" class="btn sm" id="lwx">Close</button></div></div><iframe class="lwframe" title="Completed lesson"></iframe></section>';
          d.querySelector('iframe').srcdoc = html;
          d.querySelector('#lwx').onclick = function () { d.innerHTML = ''; };
          d.querySelector('#lwdl').onclick = function () { lwSave(g, html); };
          d.querySelector('#lwopen').onclick = function () { var w = window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank'); if (!w) toast('Allow pop-ups to open the lesson.', true); };
          d.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
        p.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { var g = byKey[b.getAttribute('data-d')]; lwDraw(g).then(function () { lwSave(g, lwDoc(g)); }); }; });
      }
      ['#lwl', '#lws'].forEach(function (s) { p.querySelector(s).addEventListener('input', draw); });
      draw();
    }).catch(function (e) { p.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });
  }
  function lwSave(g, html) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    a.download = (g.student || 'student').replace(/[^\w]+/g, '-') + '_' + g.lesson + '.html'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }

  /* ---------- overview ---------- */
  function overview(p) {
    Promise.all([
      S.db.from('class_overview').select('*'),
      S.db.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('status', 'needs_marking'),
      S.db.from('student_results').select('title,score,max_score,recorded_at,student_id').order('recorded_at', { ascending: false }).limit(12),
      S.db.from('quizzes').select('id', { count: 'exact', head: true }).eq('published', true),
      S.db.from('pending_accounts').select('student_id', { count: 'exact', head: true }),
      ME.admin ? S.db.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'new') : Promise.resolve({ count: 0 })
    ]).then(function (x) {
      var nPend = x[4].count || 0;
      var st = (x[0].data || []).filter(function (s) { return s.student_id !== ME.user.id && s.class_id; }), names = {}; st.forEach(function (s) { names[s.student_id] = s.full_name; });
      var pcs = st.filter(function (s) { return s.percent != null; }), avg = pcs.length ? Math.round(pcs.reduce(function (a, s) { return a + +s.percent; }, 0) / pcs.length) : null;
      var waiting = st.filter(function (s) { return !s.approved; }).length;
      p.innerHTML = '<div class="stats"><div class="stat"><span class="small muted">Students</span><b>' + st.length + '</b></div><div class="stat"><span class="small muted">Classes</span><b>' + CLASSES.length + '</b></div>' +
        '<div class="stat"><span class="small muted">Class average</span><b>' + (avg == null ? '–' : avg + '%') + '</b></div><div class="stat"><span class="small muted">Answers to mark</span><b><a href="#marking">' + (x[1].count || 0) + '</a></b></div></div>' +
        (x[5] && x[5].count ? '<p class="panel tint"><b>' + x[5].count + ' new lesson booking' + (x[5].count > 1 ? 's' : '') + '.</b> <a class="btn main sm" href="#bookings">Reply to bookings</a></p>' : '') +
        (nPend ? '<p class="panel tint"><b>' + nPend + ' new account' + (nPend > 1 ? 's are' : ' is') + ' waiting for approval.</b> <a class="btn main sm" href="' + (ME.admin ? '/admin/#approvals' : '#approvals') + '">Review and approve</a></p>' : '') +
        (!CLASSES.length ? '<p class="panel tint">Start by <a href="#classes">creating a class</a>. Each class gets a join code that students type when they register.</p>' : '') +
        '<section class="panel"><h3>Latest results</h3>' + ((x[2].data || []).length ? '<div class="tablewrap"><table class="marks"><tr><th>Student</th><th>Task</th><th>Score</th><th>When</th></tr>' + x[2].data.map(function (r) { return '<tr><td>' + E(names[r.student_id] || '–') + '</td><td>' + E(r.title) + '</td><td>' + (r.score == null ? '–' : E(r.score) + '/' + E(r.max_score)) + '</td><td class="small">' + E(S.when(r.recorded_at)) + '</td></tr>'; }).join('') + '</table></div>' : '<p class="muted">No results yet.</p>') +
        '<p class="small muted">' + (x[3].count || 0) + ' published quizzes · <a href="/teacher/">Classic teacher console (Google Sheets)</a></p></section>';
    });
  }

  /* ---------- classes ---------- */
  /* archive, restore or remove a class (admin). Lessons, quizzes, notes and simulations always stay. */
  function archivedPanel() {
    return '<section class="panel"><h3 style="margin:0">Archived classes</h3><p class="small muted">Archive a class when it ends or when you change school. Its students can no longer sign in to lessons or materials, and it disappears from your lists. ' +
      'All your lessons, quizzes, notes and simulations stay, ready for new classes. Students\' past results are kept. <b>Remove</b> moves the class to the 🗑 Bin for 30 days; deleting it permanently from the bin takes its students out of it.</p>' +
      (ARCHIVED.length ? '<div class="tablewrap"><table class="marks"><tr><th>Class</th><th>Programme</th><th>Archived</th><th></th></tr>' + ARCHIVED.map(function (c) {
        return '<tr><td>' + E(c.name) + '</td><td>' + E(c.programme || '') + '</td><td>' + E(S.when(c.archived_at)) + '</td><td><button type="button" class="btn sm" data-restore="' + c.id + '">↩ Restore</button> <button type="button" class="btn sm" data-rmold="' + c.id + '" style="--c:#b91c1c">Remove</button></td></tr>'; }).join('') + '</table></div>'
        : '<p class="emptybox">No archived classes.</p>') + '</section>';
  }
  function archive(p, id, on) {
    var c = CLASSES.concat(ARCHIVED).filter(function (x) { return x.id === id; })[0] || {};
    if (on && !confirm('Archive ' + (c.name || 'this class') + '?\n\nIts students lose access to lessons and materials until you restore it. Your lessons, quizzes, notes and simulations are kept.')) return;
    S.db.rpc('archive_class', { cid: id, archive: on }).then(function (r) { if (ok(r, on ? 'Class archived' : 'Class restored')) classes(p); });
  }
  function removeClass(p, id) {
    var c = CLASSES.concat(ARCHIVED).filter(function (x) { return x.id === id; })[0] || {};
    if (!confirm('Remove ' + (c.name || 'this class') + '?\n\nIt goes to the 🗑 Bin for 30 days and can be restored from there. Deleting it permanently from the bin takes its students out of it.')) return;
    S.db.rpc('bin_item', { kind: 'class', item: id }).then(function (r) { if (ok(r, 'Class moved to the 🗑 Bin')) refs().then(function () { (TEACH ? teachClasses : classes)(p); }); });
  }
  function classes(p, args) {
    if (args && args[0] && args[1] === 'add') { TC.cur = args[0]; TC.tab = 'materials'; TC.madd = true; }
    else if (args && args[0] && args[1] === 'manage') { TC.cur = args[0]; TC.tab = 'students'; }   // #classes/<id>/add: straight to "Add from main site"
    else if (args && args[0]) return refs().then(function () { classPage(p, args[0], args[1]); });
    refs().then(function () {
      p.innerHTML = '<section class="panel"><h3>Class pages</h3><p class="small muted">Open a class to see its quizzes, exams and interactive lessons, and who has and has not submitted. The page updates itself while you watch.</p>' +
        (CLASSES.length ? '<div class="cgrid">' + CLASSES.map(function (c) { return '<div class="ccard" style="display:flex;flex-direction:column;gap:4px"><a href="#classes/' + c.id + '" style="text-decoration:none;color:inherit;display:flex;flex-direction:column"><b>' + E(c.name) + '</b><span class="small muted">' + E(c.programme || '') + '</span><span class="small" data-n="' + c.id + '">…</span></a><a class="btn sm" href="#classes/' + c.id + '/status" style="align-self:flex-start">🟢 Live work status</a></div>'; }).join('') + '</div>' : '<p class="emptybox">No classes yet.</p>') + '</section>' +
        '<form class="panel row2" id="nc"><input id="cn" placeholder="Class name, e.g. Grade 9 Science" required><input id="cp" placeholder="Programme, e.g. MYP 4" style="max-width:180px"><button class="btn main sm" type="submit">Create class</button></form>' +
        (CLASSES.length ? '<div class="tablewrap"><table class="marks"><tr><th>Class</th><th>Programme</th><th>Join code</th><th>Open for joining</th><th></th>' + (ME.admin ? '<th>Archive / remove</th>' : '') + '</tr>' + CLASSES.map(function (c) {
          return '<tr data-id="' + c.id + '"><td><input data-k="name" value="' + E(c.name) + '"></td><td><input data-k="programme" value="' + E(c.programme || '') + '"></td><td><b class="code">' + E(c.join_code) + '</b> <button type="button" class="btn sm" data-a="new">New code</button></td>' +
            '<td><input type="checkbox" data-k="active"' + (c.active ? ' checked' : '') + '></td><td><button type="button" class="btn sm" data-a="save">Save</button></td>' +
            (ME.admin ? '<td><button type="button" class="btn sm" data-a="arch">🗄 Archive</button> <button type="button" class="btn sm" data-a="rm" style="--c:#b91c1c">Remove</button></td>' : '') + '</tr>'; }).join('') + '</table></div>' : '<p class="emptybox">No classes yet.</p>') +
        (ME.admin ? archivedPanel() : '') +
        '<p class="small muted">Give students the join code. They type it on the <a href="/register/">registration page</a>. Untick "Open for joining" to stop new sign-ups; make a new code if a code was shared too widely.</p>';
      S.db.from('profiles').select('class_id').in('class_id', CLASSES.map(function (c) { return c.id; })).then(function (r) {
        var n = {}; (r.data || []).forEach(function (x) { n[x.class_id] = (n[x.class_id] || 0) + 1; });
        p.querySelectorAll('[data-n]').forEach(function (el) { var k = n[el.getAttribute('data-n')] || 0; el.textContent = k + ' student' + (k === 1 ? '' : 's'); });
        // a long list of empty classes hides the ones in use: classes with students stay on top, the rest fold away
        var grid = p.querySelector('.cgrid'), empty = [];
        if (grid) { grid.querySelectorAll('.ccard').forEach(function (card) { var el = card.querySelector('[data-n]'); if (el && !(n[el.getAttribute('data-n')] || 0)) empty.push(card); });
          if (empty.length > 6 && !p.querySelector('#emptycls')) {
            var d = document.createElement('details'); d.id = 'emptycls'; d.style.marginTop = '12px';
            d.innerHTML = '<summary style="cursor:pointer;font-weight:700;padding:10px 0">Classes with no students yet (' + empty.length + ')</summary><p class="small muted">These classes are ready for students to join: one teacher-led class and one Independent learners class for each course. They stay out of the way until someone joins.</p><div class="cgrid"></div>';
            var g2 = d.querySelector('.cgrid'); empty.forEach(function (card) { g2.appendChild(card); });
            if (!grid.children.length) grid.insertAdjacentHTML('beforeend', '<p class="emptybox" style="grid-column:1/-1">No class has students yet. Share a join code, or approve students as they register.</p>');
            grid.parentNode.insertBefore(d, grid.nextSibling);
          } }
      });
      p.querySelector('#nc').onsubmit = function (e) { e.preventDefault();
        S.db.from('classes').insert({ name: p.querySelector('#cn').value.trim(), programme: p.querySelector('#cp').value.trim() || null, teacher_id: ME.user.id, join_code: code6() }).then(function (r) { if (ok(r, 'Class created')) classes(p); }); };
      p.querySelectorAll('tr[data-id]').forEach(function (tr) { var id = tr.getAttribute('data-id');
        tr.querySelector('[data-a=save]').onclick = function () { S.db.from('classes').update({ name: tr.querySelector('[data-k=name]').value.trim(), programme: tr.querySelector('[data-k=programme]').value.trim() || null, active: tr.querySelector('[data-k=active]').checked }).eq('id', id).then(function (r) { ok(r, 'Saved'); }); };
        tr.querySelector('[data-a=new]').onclick = function () { S.db.from('classes').update({ join_code: code6() }).eq('id', id).then(function (r) { if (ok(r, 'New code made')) classes(p); }); };
        var ar = tr.querySelector('[data-a=arch]'); if (ar) ar.onclick = function () { archive(p, id, true); };
        var rm = tr.querySelector('[data-a=rm]'); if (rm) rm.onclick = function () { removeClass(p, id); };
      });
      p.querySelectorAll('[data-restore]').forEach(function (b) { b.onclick = function () { archive(p, b.getAttribute('data-restore'), false); }; });
      p.querySelectorAll('[data-rmold]').forEach(function (b) { b.onclick = function () { removeClass(p, b.getAttribute('data-rmold')); }; });
    });
  }


  /* ---------- class pages: each class has its own page for quizzes, exams and interactive lessons ---------- */
  var LIVE = null;
  function ago(t) { if (!t) return ''; var s = Math.max(0, (Date.now() - new Date(t)) / 1000); return s < 45 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : S.when(t); }
  function mmss(s) { return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function sameProg(a, b) { a = (a || '').toLowerCase(); b = (b || '').toLowerCase(); return !!a && !!b && (a === b || (a.indexOf('ib dp') === 0 && b.indexOf('ib dp') === 0)); }
  function roster(cid) {   // students of a class: approved enrolments, plus anyone whose profile points at it
    return Promise.all([S.db.from('enrolments').select('student_id').eq('class_id', cid).eq('status', 'approved'), S.db.from('profiles').select('id').eq('class_id', cid)]).then(function (y) {
      var ids = {}; (y[0].data || []).forEach(function (e) { ids[e.student_id] = 1; }); (y[1].data || []).forEach(function (r) { ids[r.id] = 1; }); delete ids[ME.user.id];
      ids = Object.keys(ids); if (!ids.length) return [];
      return Promise.all([S.db.from('profiles').select('id,full_name,approved').in('id', ids).order('full_name'), S.db.from('user_roles').select('user_id,role').in('user_id', ids).in('role', ['teacher', 'admin', 'school_teacher'])]).then(function (q) {
        var staff = {}; (q[1].data || []).forEach(function (x) { staff[x.user_id] = 1; });
        return (q[0].data || []).filter(function (x) { return !staff[x.id]; });
      });
    });
  }
  function bar(parts, total) {   // parts: [[count, colour, label]]
    return '<div class="sbar" role="img" aria-label="' + parts.map(function (x) { return x[0] + ' ' + x[2]; }).join(', ') + '">' + parts.map(function (x) { return x[0] ? '<span style="flex:' + x[0] + ';background:' + x[1] + '"></span>' : ''; }).join('') + (total ? '' : '<span style="flex:1;background:var(--line)"></span>') + '</div>';
  }
  function classPage(p, cid, sub) {
    var c = CLASSES.filter(function (x) { return x.id === cid; })[0];
    if (!c) { p.innerHTML = '<p class="emptybox">This class was not found, or it is not one of your classes. <a href="#classes">All classes</a></p>'; return; }
    sub = ['lessons', 'todo', 'analysis', 'register', 'activity', 'news', 'status'].indexOf(sub) >= 0 ? sub : 'quizzes';
    var state = { filter: 'all', open: {}, lesson: null, live: true };
    try { state.lesson = sessionStorage.getItem('bv-cl-' + cid) || null; } catch (e) {}
    p.innerHTML = '<p class="small"><a href="#classes">← All classes</a></p><div class="row2' + ' cband" style="--k:' + hue(c.id) + '"><div><p class="label">' + E(c.programme || 'Class') + '</p><h2 style="margin:0">' + E(c.name) + '</h2></div>' +
      '<a class="btn main sm" href="#classes/' + c.id + '/status" style="--c:#16a34a" title="See what every student is working on right now. Updates every 10 seconds.">🟢 Live work status</a>' + '<a class="btn main sm" href="/check/?class=' + c.id + '&n=' + encodeURIComponent(c.name) + '" style="--c:#7c3aed" title="Send one question to this class and watch the answers arrive">⚡ Live Check</a>' + '<a class="btn main sm" href="/time/?class=' + c.id + '&n=' + encodeURIComponent(c.name) + '" style="--c:#0ea5e9;background:#0284c7;border-color:#0284c7" title="The time each student spent on each task, and the time allowed">⏱ Time on tasks</a>' + '<div class="small muted" style="text-align:right">' + (TEACH ? '' : 'Join code <b class="code">' + E(c.join_code) + '</b><br>') + '<label class="chk" style="display:inline-flex"><input type="checkbox" id="lv" checked> Live: update every 15 seconds</label> <span id="stamp"></span></div></div>' +
      '<nav class="tabs" aria-label="Class sections"' + ' data-cnav' + '><a href="#classes/' + cid + '/add" style="--k:#0d9488;font-weight:800">➕ Add lessons from main site</a><a href="#classes/' + cid + '/manage" style="--k:#4f46e5">👥 Students &amp; settings</a><a href="#classes/' + cid + '/status" aria-selected="' + (sub === 'status') + '" style="--k:#16a34a;font-weight:800">🟢 Live work status</a><a href="#classes/' + cid + '/quizzes" aria-selected="' + (sub === 'quizzes') + '">📝 Quizzes and exams</a><a href="#classes/' + cid + '/lessons" aria-selected="' + (sub === 'lessons') + '">🧪 Interactive lessons</a><a href="#classes/' + cid + '/todo" aria-selected="' + (sub === 'todo') + '">📌 To-do list</a><a href="#classes/' + cid + '/register" aria-selected="' + (sub === 'register') + '">🗒 Register</a><a href="#classes/' + cid + '/activity" aria-selected="' + (sub === 'activity') + '">👀 Activity</a><a href="' + '/board/?class=' + cid + '&n=' + encodeURIComponent(c.name) + '">🖊 Whiteboard</a><a href="/live/?class=' + cid + '">🎥 Live lessons</a><a href="#classes/' + cid + '/analysis" aria-selected="' + (sub === 'analysis') + '">📊 Analysis</a><a href="#classes/' + cid + '/news" aria-selected="' + (sub === 'news') + '">📣 Announcements</a></nav>' +
      '<div id="cbody"><p class="muted">Loading…</p></div>';
    var body = p.querySelector('#cbody'), busy = false;
    { var CH = { status: '#16a34a', quizzes: '#ca8a04', lessons: '#0d9488', todo: '#7c3aed', register: '#059669', activity: '#db2777', analysis: '#2563eb', news: '#ea580c' };
      p.querySelectorAll('[data-cnav] a').forEach(function (a) { var k = CH[a.getAttribute('href').split('/')[2]]; if (k) a.style.setProperty('--k', k); }); }
    function load() {
      if (busy) return; busy = true;
      (sub === 'status' ? statusBoard : sub === 'lessons' ? lessonBoard : sub === 'todo' ? todoBoard : sub === 'analysis' ? analysisBoard : sub === 'news' ? newsBoard : sub === 'register' ? registerBoard : sub === 'activity' ? activityBoard : quizBoard)(body, c, state).then(function () { busy = false; var st = p.querySelector('#stamp'); if (st) st.textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }, function (e) { busy = false;
        var miss = /class_(quiz|lesson)_board|class_todo|assign_work|class_analysis|announcements|schema cache|does not exist/i.test((e && (e.message || e.details)) || String(e));
        body.innerHTML = miss ? '<p class="emptybox">This part of the class page needs a database update (' + (sub === 'todo' ? 'migration 015' : sub === 'analysis' ? 'migration 016' : sub === 'news' ? 'migration 044' : 'migration 011') + ') before it can show results. Run it once in the Supabase SQL editor, then reload this page.</p>' : '<p class="msg">' + E(S.nice(e)) + '</p>'; });
    }
    state.reload = load;
    var EVERY = sub === 'status' ? 10000 : 15000;
    p.querySelector('#lv').onchange = function () { state.live = this.checked; clearInterval(LIVE); if (state.live) { LIVE = setInterval(load, EVERY); load(); } };
    clearInterval(LIVE); LIVE = setInterval(load, EVERY); load();
  }
  /* ---------- to-do lists: work set for the whole class or for chosen students ---------- */
  var ICON = { lesson: '🧪', quiz: '📝', resource: '📄', sim: '🔬', link: '🔗', task: '✏️' };
  var PICK = null;   // lessons, quizzes, resources and simulations to choose from (loaded once)
  function pickLists() {
    if (PICK) return Promise.resolve(PICK);
    return Promise.all([S.db.from('lessons').select('id,title,url,external_id,topic_id').eq('published', true).order('sort_order'),
      S.db.from('quizzes').select('id,title,category,published, quiz_classes(class_id,published)').is('deleted_at', null).order('created_at', { ascending: false }),
      S.db.from('resources').select('id,title,url,topic_id').eq('published', true).order('sort_order'),
      S.db.from('simulations').select('id,title,url,topic_id').eq('published', true).order('sort_order')]).then(function (x) {
      PICK = { lesson: x[0].data || [], quiz: x[1].data || [], resource: x[2].data || [], sim: x[3].data || [] }; return PICK; });
  }
  function progOf(tid) { var tp = {}; TOPICS.forEach(function (t) { tp[t.id] = t; }); var t = tp[tid]; return t ? (t.programme || (tp[t.parent_id] || {}).programme || '') : ''; }
  // What a class teaches: programme (IB DP, MYP 1-5, IGCSE…) and subject, read from its course, programme and name.
  function classKey(c) {
    var t = ((c.course || '') + ' ' + (c.programme || '') + ' ' + (c.name || '')).toLowerCase(), k = { prog: '', subj: '' };
    var g = t.match(/\bgrade[- ]?(6|7|8|9|10)\b/), m = t.match(/\bmyp ?([1-5])\b/);
    if (m) k.prog = 'MYP ' + m[1]; else if (g) k.prog = 'MYP ' + (+g[1] - 5);
    else if (/\bigcse\b/.test(t)) k.prog = 'IGCSE'; else if (/\ba[ -]?level|\bas level/.test(t)) k.prog = 'A Level';
    else if (/\bib\b|\bdp ?\d?\b|diploma|\b(bio|chem|phys|ess)-(hl|sl)\b/.test(t)) k.prog = 'IB DP';
    k.subj = /math/.test(t) ? 'mathematics' : /\bess\b|environmental/.test(t) ? 'environmental' : /chem/.test(t) ? 'chemistry' : /phys/.test(t) ? 'physics' : /\bbio/.test(t) ? 'biology' : '';
    if (!k.prog && k.subj) k.prog = 'IB DP';   // "Chemistry", "PHYSICS": the site's subject classes are IB DP
    k.level = /\bhl\b|-hl\b|higher/.test(t) ? 'HL' : /\bsl\b|-sl\b|standard/.test(t) ? 'SL' : '';
    k.any = !k.prog;
    k.label = k.any ? '' : (k.prog === 'IB DP' && k.subj ? 'IB DP ' + k.subj.replace('environmental', 'ESS').replace(/^./, function (x) { return x.toUpperCase(); }) : k.prog);
    return k;
  }
  function topicKey(tid) {
    var tp = {}; TOPICS.forEach(function (t) { tp[t.id] = t; }); var t = tp[tid] || {}, p = tp[t.parent_id] || {};
    var subj = ((t.subjects || p.subjects || {}).name || '').toLowerCase();
    return { prog: t.programme || p.programme || '', subj: subj, sname: (t.subjects || p.subjects || {}).name || '' };
  }
  function guessKey(it) {   // simulations and links with no topic: read the subject from the title
    var t = (it.title || '') + ' ' + (it.url || '');
    if (/titration|acid|chromatograph|separating|mixture|enthalpy|redox/i.test(t)) return { prog: /chromatograph|separating|mixture/i.test(t) ? 'MYP 1' : 'IB DP', subj: 'chemistry' };
    if (/circuit|force|wave|motion|projectile/i.test(t)) return { prog: 'IB DP', subj: 'physics' };
    return { prog: 'IB DP', subj: 'biology', loose: true };
  }
  function keyFits(k, want) {
    if (k.loose && want.subj !== 'chemistry' && want.subj !== 'physics' && want.subj !== 'mathematics') return true;   // biology labs suit any biology or science class
    if (want.any) return true;
    if (!sameProg(k.prog, want.prog)) return false;
    return !want.subj || !k.subj || k.subj.indexOf(want.subj) >= 0 || (k.subj.indexOf('science') >= 0 && want.prog.indexOf('MYP') === 0);
  }
  function topicLabel(tid, foreign) {
    var tp = {}; TOPICS.forEach(function (t) { tp[t.id] = t; }); var t = tp[tid], p = t && tp[t.parent_id], k = topicKey(tid);
    var name = t ? (p ? p.name + ' › ' : '') + t.name : 'Other';
    return foreign ? ((k.sname || k.prog || 'Other') + ' · ' + name) : name;
  }
  function urlFor(kind, it) { return kind === 'quiz' ? ({ exam: '/exams/', lesson: '/lesson/' }[it.category] || '/quizzes/') + '#' + it.id : it.url || ''; }
  // The "Set work" form. kids: the class roster; pre: students ticked to start with (empty = whole class).
  var MATS = {};
  function classMats(cid) {
    if (MATS[cid]) return Promise.resolve(MATS[cid]);
    return S.db.from('class_materials').select('path,sort').eq('class_id', cid).order('sort').then(function (r) { MATS[cid] = (r.data || []).map(function (x) { return x.path; }); return MATS[cid]; });
  }
  function assignForm(host, c, kids, pre, done) {
    Promise.all([pickLists(), classMats(c.id)]).then(function (x) { return x[0]; }).then(function (L) {
      // Only this class's lessons by default (its programme and subject), grouped by topic; "other classes" is opt-in.
      // Only this class's materials: its own lessons (class_materials), quizzes and exams set for it, and notes,
      // files and simulations for its programme, subject and level (SL classes do not get HL-only items).
      var want = classKey(c), q = '', own = MATS[c.id] || [];
      var hlOnly = function (t) { return /\(HL\)|\bAHL\b|HL only/i.test(t || ''); };
      var levelOk = function (t) { return want.level !== 'SL' || !hlOnly(t); };
      var fits = function (it) {
        if (!levelOk(it.title)) return false;
        if (it.topic_id) return keyFits(topicKey(it.topic_id), want);
        return keyFits(guessKey(it), want);
      };
      var opts = function (kind) {
        var match = function (t) { return !q || (t || '').toLowerCase().indexOf(q) >= 0; };
        if (kind === 'quiz') {
          var qs = L.quiz.filter(function (x) { return match(x.title) && (x.quiz_classes || []).some(function (r) { return r.class_id === c.id; }); });
          return qs.map(function (x) { return '<option value="' + x.id + '">' + (x.category === 'exam' ? '🧪 Exam · ' : x.category === 'lesson' ? '📘 ' : '📝 ') + E(x.title) + ((x.quiz_classes || []).some(function (r) { return r.class_id === c.id && r.published; }) ? '' : ' (not published yet: setting it for the whole class publishes it)') + '</option>'; }).join('');
        }
        var list = (L[kind] || []).filter(function (it) {
          if (!match(it.title)) return false;
          if (kind === 'lesson' && own.length) return own.indexOf(it.url) >= 0;
          return want.any || fits(it);
        });
        if (kind === 'lesson' && own.length) list.sort(function (a, b) { return own.indexOf(a.url) - own.indexOf(b.url); });
        var groups = [], by = {};
        list.forEach(function (it) { var g = topicLabel(it.topic_id, false); if (!by[g]) { by[g] = []; groups.push(g); } by[g].push(it); });
        return groups.map(function (g) { return '<optgroup label="' + E(g) + '">' + by[g].map(function (it) { return '<option value="' + it.id + '">' + E(it.title) + '</option>'; }).join('') + '</optgroup>'; }).join('');
      };
      host.innerHTML = '<section class="panel tint"><h3 style="margin-top:0">📌 Set work' + (pre.length === 1 ? ' for ' + E((kids.filter(function (k) { return k.id === pre[0]; })[0] || {}).full_name || 'this student') : ' for ' + E(c.name)) + '</h3>' +
        '<div class="row2" style="flex-wrap:wrap;justify-content:flex-start;align-items:flex-end">' +
        '<label class="f">What<select id="ak"><option value="lesson">🧪 Lesson (interactive or Learning centre)</option><option value="quiz">📝 Quiz or exam</option><option value="resource">📄 Notes or file</option><option value="sim">🔬 Simulation</option><option value="link">🔗 Web link</option><option value="task">✏️ Other task (book, homework…)</option></select></label>' +
        '<label class="f" id="aiw" style="min-width:280px;flex:1">Which <span class="small muted" id="aif"></span><input id="aq" type="search" placeholder="Search…" style="margin-bottom:6px"><select id="ai"></select></label><label class="f" id="auw" hidden style="flex:1">Link<input id="au" type="url" placeholder="https://"></label></div>' +
        '<div class="row2" style="flex-wrap:wrap;justify-content:flex-start"><label class="f" style="flex:1;min-width:240px">Title<input id="at" maxlength="160"></label><label class="f">Due<input id="ad" type="datetime-local"></label></div>' +
        '<label class="f">Instructions for students (optional)<textarea id="ain" rows="2" placeholder="e.g. Finish steps 1–3 and correct your answers in your book."></textarea></label>' +
        '<fieldset style="border:1px solid var(--line);border-radius:10px;padding:8px 12px"><legend class="small"><b>Who</b></legend>' +
        '<label class="chk"><input type="radio" name="aw" value="all"' + (pre.length ? '' : ' checked') + '> The whole class (' + kids.length + ')</label> <label class="chk"><input type="radio" name="aw" value="some"' + (pre.length ? ' checked' : '') + '> Chosen students</label>' +
        '<div id="asl" style="columns:3 180px;margin-top:6px"' + (pre.length ? '' : ' hidden') + '>' + (kids.length ? kids.map(function (k) { return '<label class="chk small" style="display:flex"><input type="checkbox" value="' + k.id + '"' + (pre.indexOf(k.id) >= 0 ? ' checked' : '') + '> ' + E(k.full_name || '(no name)') + '</label>'; }).join('') : '<span class="small muted">No students in this class yet.</span>') +
        '<div class="small" style="column-span:all"><a href="#" id="aall">Tick all</a> · <a href="#" id="anone">Clear</a></div></div></fieldset>' +
        '<div class="acts"><button type="button" class="btn main sm" id="ago">📌 Add to the to-do list</button><button type="button" class="btn sm" id="ax">Cancel</button><span class="small" id="am"></span></div></section>';
      var $ = function (q) { return host.querySelector(q); };
      function fill() { var k = $('#ak').value, picks = ['lesson', 'quiz', 'resource', 'sim'].indexOf(k) >= 0;
        $('#aiw').hidden = !picks; $('#auw').hidden = k !== 'link';
        if (picks) { var o = opts(k), n = (o.match(/<option /g) || []).length;
          $('#ai').innerHTML = '<option value="">' + (n ? 'Choose… (' + n + ' for ' + E(c.name) + ')' : q ? 'Nothing matches your search' : k === 'quiz' ? 'No quizzes or exams set for this class yet' : 'Nothing for this class yet') + '</option>' + o;
          $('#aif').textContent = '· ' + c.name + (want.label ? ' (' + want.label + (want.level ? ' ' + want.level : '') + ')' : ''); } }
      $('#aq').oninput = function () { q = this.value.trim().toLowerCase(); fill(); };
      $('#ak').onchange = function () { fill(); $('#at').value = ''; };
      $('#ai').onchange = function () { var k = $('#ak').value, it = (L[k] || []).filter(function (x) { return x.id === $('#ai').value; })[0]; if (it) $('#at').value = it.title; };
      host.querySelectorAll('[name=aw]').forEach(function (r) { r.onchange = function () { $('#asl').hidden = host.querySelector('[name=aw]:checked').value !== 'some'; }; });
      $('#aall').onclick = function (e) { e.preventDefault(); host.querySelectorAll('#asl input').forEach(function (x) { x.checked = true; }); };
      $('#anone').onclick = function (e) { e.preventDefault(); host.querySelectorAll('#asl input').forEach(function (x) { x.checked = false; }); };
      $('#ax').onclick = function () { host.innerHTML = ''; };
      fill();
      $('#ago').onclick = function () {
        var k = $('#ak').value, it = (L[k] || []).filter(function (x) { return x.id === $('#ai').value; })[0], m = $('#am');
        var some = host.querySelector('[name=aw]:checked').value === 'some', who = Array.prototype.map.call(host.querySelectorAll('#asl input:checked'), function (x) { return x.value; });
        var title = $('#at').value.trim() || (it && it.title) || '';
        if (['lesson', 'quiz', 'resource', 'sim'].indexOf(k) >= 0 && !it) { m.textContent = 'Choose which ' + ({ lesson: 'lesson', quiz: 'quiz or exam', resource: 'file', sim: 'simulation' }[k]) + '.'; return; }
        if (k === 'link' && !/^https?:\/\//.test($('#au').value.trim())) { m.textContent = 'Paste the web address (starting https://).'; return; }
        if (!title) { m.textContent = 'Give the work a title.'; $('#at').focus(); return; }
        if (some && !who.length) { m.textContent = 'Tick at least one student, or choose the whole class.'; return; }
        var ref = !it ? null : k === 'lesson' ? (it.external_id || it.id) : it.id, url = k === 'link' ? $('#au').value.trim() : it ? urlFor(k, it) : null;
        $('#ago').disabled = true; m.textContent = 'Saving…';
        S.db.rpc('assign_work', { cls: c.id, title: title, kind: k, ref: ref, url: url, instructions: $('#ain').value.trim(), due: iso($('#ad').value), students: some ? who : null }).then(function (r) {
          $('#ago').disabled = false;
          if (r.error) { m.textContent = S.nice(r.error); return; }
          toast('Added to the to-do list of ' + (some ? who.length + ' student' + (who.length === 1 ? '' : 's') : 'everyone in ' + c.name) + (false ? '. This quiz is still a draft: publish it so students can open it.' : ''));
          host.innerHTML = ''; if (done) done();
        });
      };
    });
  }
  function todoBoard(body, c, state) {
    if (body.querySelector('#aform') && body.querySelector('#aform').innerHTML) return Promise.resolve();   // do not refresh while the teacher is filling in the form
    return Promise.all([roster(c.id), S.db.from('assignments').select('*').eq('class_id', c.id).order('created_at', { ascending: false }), S.db.rpc('class_todo', { cls: c.id }),
      S.db.from('assignment_students').select('assignment_id,student_id'), S.db.from('quiz_classes').select('quiz_id, quizzes(category)').eq('class_id', c.id)]).then(function (x) {
      var QCAT = {}; ((x[4] && x[4].data) || []).forEach(function (r) { if (r.quizzes) QCAT[r.quiz_id] = r.quizzes.category; });
      if (x[1].error) throw x[1].error; if (x[2].error) throw x[2].error;
      var kids = x[0], list = x[1].data || [], st = {}, names = {}; kids.forEach(function (k) { names[k.id] = k.full_name; });
      (x[2].data || []).forEach(function (r) { (st[r.assignment_id] = st[r.assignment_id] || {})[r.student_id] = r.state; });
      var progs = (c.content_programmes && c.content_programmes.length) ? c.content_programmes : null;
      var allProgs = []; TOPICS.forEach(function (t) { if (t.programme && allProgs.indexOf(t.programme) < 0) allProgs.push(t.programme); }); allProgs.sort();
      var html = '<div class="row2"><p class="small muted" style="margin:0">Work you set appears on each student\'s dashboard under <b>To do</b>. Lessons and quizzes tick themselves off when the student finishes; other work is ticked off by the student.</p><button type="button" class="btn main sm" id="anew">＋ Set work</button></div><div id="aform"></div>' +
        (list.length ? (function () {   // set work grouped by type (16 Nov 2026): interactive lessons, examinations, exam-style questions, other work
          var tOf = function (a) { var cat = QCAT[a.ref]; return a.kind === 'lesson' || cat === 'lesson' ? 0 : cat === 'exam' ? 1 : a.kind === 'quiz' ? 2 : 3; };
          var TY = [['📘 Interactive lessons', '#2563eb'], ['🧪 Examinations', '#7c3aed'], ['📝 Exam-style questions', '#ea580c'], ['📎 Files, simulations, links and tasks', '#0d9488']];
          return TY.map(function (T, i) { var g = list.filter(function (a) { return tOf(a) === i; }); if (!g.length) return '';
            return '<div style="border-left:5px solid ' + T[1] + ';padding-left:12px;margin:14px 0"><h4 style="margin:0 0 6px;color:' + T[1] + '">' + T[0] + ' <span class="pill">' + g.length + '</span></h4>' + g.map(oneA).join('') + '</div>'; }).join(''); })() : '') +
        (list.length ? '' : '<p class="emptybox">Nothing set yet. Use <b>＋ Set work</b> to add a lesson, quiz, file, simulation, link or task for the whole class or for chosen students.</p>') + '';
      function oneA(a) {
          var m = st[a.id] || {}, ids = Object.keys(m), nd = ids.filter(function (i) { return m[i] === 'done'; }).length, ns = ids.filter(function (i) { return m[i] === 'started'; }).length, nt = ids.length - nd - ns;
          var late = a.due_at && new Date(a.due_at) < new Date();
          var who = a.everyone ? 'Whole class' : ids.length + ' chosen student' + (ids.length === 1 ? '' : 's');
          var open = state.open['a' + a.id];
          return '<details class="panel" data-k="a' + a.id + '"' + (open ? ' open' : '') + '><summary><b>' + (ICON[a.kind] || '📌') + ' ' + E(a.title) + '</b> <span class="pill">' + E(who) + '</span>' +
            (a.due_at ? ' <span class="small ' + (late ? '' : 'muted') + '" style="' + (late ? 'color:#b91c1c' : '') + '">' + (late ? 'was due ' : 'due ') + E(S.when(a.due_at)) + '</span>' : '') +
            '<div class="small"><b style="color:var(--ok)">✓ ' + nd + ' done</b> · <b style="color:#b45309">✎ ' + ns + ' started</b> · <b style="color:#b91c1c">○ ' + nt + ' not started</b></div>' +
            bar([[nd, 'var(--ok)', 'done'], [ns, '#f59e0b', 'started'], [nt, '#fca5a5', 'not started']], ids.length) + '</summary>' +
            (a.instructions ? '<p class="small">' + E(a.instructions) + '</p>' : '') + (a.url ? '<p class="small"><a href="' + E(a.url) + '" target="_blank" rel="noopener">Open the work ↗</a></p>' : '') +
            '<div class="small">' + ['todo', 'started', 'done'].map(function (k) { var who2 = ids.filter(function (i) { return m[i] === k; }).map(function (i) { return E(names[i] || 'student'); });
              return who2.length ? '<p style="margin:3px 0"><b>' + { todo: '○ Not started', started: '✎ Started', done: '✓ Done' }[k] + ':</b> ' + who2.join(', ') + '</p>' : ''; }).join('') + '</div>' +
            '<div class="acts"><button type="button" class="btn sm" data-adel="' + a.id + '">Remove from the to-do list</button></div></details>';
      }
      html += '<section class="panel"><h3 style="margin-top:0">📚 Materials this class sees</h3><p class="small muted">Students in ' + E(c.name) + ' see only these programmes in the Learning centre and simulation library, plus anything you set for them.</p>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' + allProgs.map(function (pg) { var on = progs ? progs.indexOf(pg) >= 0 : sameProg(pg, c.programme) || defaultProg(c.programme).indexOf(pg) >= 0;
          return '<label class="chk"><input type="checkbox" data-pg="' + E(pg) + '"' + (on ? ' checked' : '') + '> ' + E(pg) + '</label>'; }).join('') + '</div>' +
        '<div class="acts"><button type="button" class="btn sm" id="pgsave">Save</button></div></section>';
      body.innerHTML = html; wireFilters(body, state);
      if (BV.findBox && list.length > 3) BV.findBox(body, 'details.panel[data-k]', 'div[style*="border-left:5px"]', 'Find work you set…');
      body.querySelector('#anew').onclick = function () { assignForm(body.querySelector('#aform'), c, kids, [], function () { state.reload(); }); };
      body.querySelectorAll('[data-adel]').forEach(function (b) { b.onclick = function () {
        if (!confirm('Remove this work from every student\'s to-do list?')) return;
        S.db.from('assignments').delete().eq('id', b.getAttribute('data-adel')).then(function (r) { if (ok(r, 'Removed from the to-do list')) state.reload(); }); }; });
      body.querySelector('#pgsave').onclick = function () {
        var pick = Array.prototype.map.call(body.querySelectorAll('[data-pg]:checked'), function (x) { return x.getAttribute('data-pg'); });
        S.db.from('classes').update({ content_programmes: pick }).eq('id', c.id).then(function (r) { if (ok(r, 'Saved: ' + c.name + ' sees ' + (pick.join(', ') || 'only work you set'))) c.content_programmes = pick; }); };
    });
  }
  /* ---------- class announcements (table announcements, migration 044) ---------- */
  function newsBoard(body, c, state) {
    if (body.getAttribute('data-news') === c.id && !state.newsDirty) return Promise.resolve();   // no auto-refresh while writing
    state.newsDirty = false;
    return S.db.from('announcements').select('*').or('class_id.eq.' + c.id + ',class_id.is.null').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(40).then(function (r) {
      if (r.error) throw r.error;
      var rows = r.data || [], now = Date.now();
      body.setAttribute('data-news', c.id);
      body.innerHTML = '<section class="panel"><h3 style="margin-top:0">📣 New announcement for ' + E(c.name) + '</h3>' +
        '<p class="small muted">Students in this class see it at the top of their dashboard. Keep it short; add a link to a lesson, quiz or page if it helps.</p>' +
        '<label class="f">Title<input id="an-t" maxlength="140" placeholder="e.g. Test on enzymes next Tuesday"></label>' +
        '<label class="f">Message<textarea id="an-b" rows="4" maxlength="4000" placeholder="What students need to know or do"></textarea></label>' +
        '<div class="row2" style="flex-wrap:wrap;justify-content:flex-start;gap:8px"><label class="f">Link (optional)<input id="an-l" placeholder="/quizzes/ or https://…"></label>' +
        '<label class="f">Show until (optional)<input id="an-x" type="date"></label></div>' +
        '<label class="chk"><input type="checkbox" id="an-p"> Pin to the top</label>' +
        (ME.admin ? '<label class="chk"><input type="checkbox" id="an-all"> Send to everyone (all classes), not only this class</label><label class="chk"><input type="checkbox" id="an-pub"> Also show it on the home page to visitors (needs “everyone”)</label>' : '') +
        '<div class="acts"><button type="button" class="btn sm main" id="an-go">📣 Post</button></div></section>' +
        '<section class="panel"><h3 style="margin-top:0">Posted</h3>' + (rows.length ? rows.map(function (a) {
          var old = a.expires_at && new Date(a.expires_at).getTime() < now, mine = a.author_id === ME.user.id || ME.admin;
          return '<div class="ba-sug"' + (old ? ' style="opacity:.6"' : '') + '><b>' + (a.pinned ? '📌 ' : '') + E(a.title) + '</b> <span class="pill">' + (a.class_id ? 'This class' : a.is_public ? 'Everyone + home page' : 'Everyone') + '</span>' + (old ? ' <span class="pill">Ended</span>' : '') +
            '<div style="white-space:pre-wrap">' + E(a.body) + '</div>' + (a.link ? '<div class="small"><a href="' + E(a.link) + '">' + E(a.link) + '</a></div>' : '') +
            '<div class="small muted">' + E(S.when(a.created_at)) + (a.expires_at ? ' · until ' + E(new Date(a.expires_at).toLocaleDateString()) : '') + '</div>' +
            (mine ? '<div class="acts"><button type="button" class="btn sm" data-anpin="' + a.id + '" data-v="' + (a.pinned ? '0' : '1') + '">' + (a.pinned ? 'Unpin' : '📌 Pin') + '</button><button type="button" class="btn sm" data-andel="' + a.id + '">Remove</button></div>' : '') + '</div>';
        }).join('') : '<p class="small muted">No announcements yet.</p>') + '</section>';
      var $ = function (q) { return body.querySelector(q); }, again = function () { state.newsDirty = true; state.reload(); };
      $('#an-go').onclick = function () {
        var t = $('#an-t').value.trim(), b = $('#an-b').value.trim(), l = $('#an-l').value.trim(), x = $('#an-x').value, all = $('#an-all') && $('#an-all').checked;
        if (!t) { toast('Give the announcement a title.', true); return; }
        if (l && !/^(\/|https:\/\/)/.test(l)) { toast('A link starts with / (a page on this site) or https://', true); return; }
        var row = { class_id: all ? null : c.id, title: t, body: b, link: l || null, pinned: $('#an-p').checked, is_public: !!(all && $('#an-pub') && $('#an-pub').checked),
          expires_at: x ? new Date(x + 'T23:59:59').toISOString() : null, author_id: ME.user.id };
        this.disabled = true; var btn = this;
        S.db.from('announcements').insert(row).then(function (r) { btn.disabled = false; if (ok(r, 'Announcement posted')) again(); });
      };
      body.querySelectorAll('[data-andel]').forEach(function (b) { b.onclick = function () { if (!confirm('Remove this announcement? Students will no longer see it.')) return;
        S.db.from('announcements').delete().eq('id', b.getAttribute('data-andel')).then(function (r) { if (ok(r, 'Removed')) again(); }); }; });
      body.querySelectorAll('[data-anpin]').forEach(function (b) { b.onclick = function () {
        S.db.from('announcements').update({ pinned: b.getAttribute('data-v') === '1' }).eq('id', b.getAttribute('data-anpin')).then(function (r) { if (ok(r)) again(); }); }; });
    });
  }
  /* ---------- class analysis (Student Work Analysis Engine) ---------- */
  function analysisBoard(body, c, state) {
    if (body.getAttribute('data-ana') === c.id && !state.anaDirty) return Promise.resolve();   // no auto-refresh while reading or filtering
    state.anaDirty = false; state.af = state.af || { topic: '', ref: '', from: '', to: '' };
    var f = state.af, A = window.BVA;
    return Promise.all([S.db.rpc('class_analysis', { cls: c.id, p_from: iso(f.from), p_to: f.to ? new Date(new Date(f.to).getTime() + 864e5).toISOString() : null, p_topic: f.topic || null, p_ref: f.ref || null }),
      S.db.from('interventions').select('*').eq('class_id', c.id).order('at', { ascending: false }), S.db.from('analysis_settings').select('*').eq('teacher_id', ME.user.id).maybeSingle(),
      S.db.rpc('class_wrong_answers', { cls: c.id, p_from: iso(f.from), p_to: f.to ? new Date(new Date(f.to).getTime() + 864e5).toISOString() : null }).then(function (r) { return r; }, function () { return {}; })]).then(function (x) {
      if (x[0].error) throw x[0].error;
      var d = x[0].data || {}; d.wrong = (x[3] && !x[3].error && x[3].data) || []; var ivs = x[1].data || [], cfg = x[2].data || { thresholds: { secure: 85, developing: 70, practice: 50 }, min_items: 3, min_assessments: 2 }, th = cfg.thresholds;
      body.setAttribute('data-ana', c.id);
      body.innerHTML = '<div class="row2" style="flex-wrap:wrap;justify-content:flex-start;align-items:flex-end;gap:8px">' +
        '<label class="f">Topic<select id="ft"><option value="">All topics</option>' + (d.all_topics || []).map(function (t) { return '<option' + (t === f.topic ? ' selected' : '') + '>' + E(t) + '</option>'; }).join('') + '</select></label>' +
        '<label class="f">Assessment<select id="fa"><option value="">All work</option>' + (d.assessments || []).map(function (a) { return '<option value="' + E(a.ref) + '"' + (a.ref === f.ref ? ' selected' : '') + '>' + E(a.title) + '</option>'; }).join('') + '</select></label>' +
        '<label class="f">From<input id="ff" type="date" value="' + E(f.from) + '"></label><label class="f">To<input id="fto" type="date" value="' + E(f.to) + '"></label>' +
        '<button type="button" class="btn sm" id="fx">Clear filters</button><button type="button" class="btn sm" id="crep">⬇ Class report</button></div>' +
        A.classHtml(d, { save: true, link: function (id) { return '#students/' + id; } }) +
        '<section class="panel"><h3 style="margin-top:0">🗂 My intervention plan</h3>' + (ivs.length ? ivs.map(function (v) {
          return '<div class="ba-sug"><b>' + E(v.title) + '</b> <span class="pill">' + E({ planned: 'Planned', done: 'Done', dropped: 'Dropped' }[v.status]) + '</span><div class="small"><b>Evidence:</b> ' + E(v.evidence || '') + '</div><div class="small"><b>Action:</b> ' + E(v.action || '') + '</div><div class="small muted">' + E(S.when(v.at)) + '</div>' +
            '<div class="acts">' + (v.status !== 'done' ? '<button type="button" class="btn sm" data-ivs="' + v.id + '" data-v="done">✓ Done</button>' : '') + (v.status === 'planned' ? '<button type="button" class="btn sm" data-ivs="' + v.id + '" data-v="dropped">Drop</button>' : '') + '</div></div>'; }).join('') :
          '<p class="small muted">Add teaching suggestions above to keep track of what you plan to do.</p>') + '</section>' +
        '<details class="panel"><summary><b>⚙ Mastery levels and evidence rules</b> <span class="small muted">(used for all your classes)</span></summary><div class="row2" style="flex-wrap:wrap;justify-content:flex-start;gap:8px;margin-top:8px">' +
        '<label class="f">Secure from %<input id="t1" type="number" min="1" max="100" value="' + th.secure + '" style="max-width:90px"></label><label class="f">Developing from %<input id="t2" type="number" min="1" max="100" value="' + th.developing + '" style="max-width:90px"></label>' +
        '<label class="f">Needs practice from %<input id="t3" type="number" min="1" max="100" value="' + th.practice + '" style="max-width:90px"></label><span class="small muted" style="align-self:center">Below that: requires intervention.</span></div>' +
        '<div class="row2" style="flex-wrap:wrap;justify-content:flex-start;gap:8px"><label class="f">Questions needed before a topic is labelled<input id="t4" type="number" min="1" max="50" value="' + cfg.min_items + '" style="max-width:90px"></label><label class="f">Pieces of work needed<input id="t5" type="number" min="1" max="20" value="' + cfg.min_assessments + '" style="max-width:90px"></label></div>' +
        '<div class="acts"><button type="button" class="btn sm main" id="tsave">Save levels</button></div></details>';
      var $ = function (q) { return body.querySelector(q); }, again = function () { state.anaDirty = true; body.removeAttribute('data-ana'); state.reload(); };
      $('#ft').onchange = function () { f.topic = this.value; again(); }; $('#fa').onchange = function () { f.ref = this.value; again(); };
      $('#ff').onchange = function () { f.from = this.value; again(); }; $('#fto').onchange = function () { f.to = this.value; again(); };
      $('#fx').onclick = function () { state.af = { topic: '', ref: '', from: '', to: '' }; again(); };
      $('#crep').onclick = function () {
        var filt = [f.topic && 'topic: ' + f.topic, f.ref && 'assessment: ' + ((d.assessments || []).filter(function (a) { return a.ref === f.ref; })[0] || {}).title, f.from && 'from ' + f.from, f.to && 'to ' + f.to].filter(Boolean).join(' · ');
        A.openDoc(A.reportDoc('Class analysis: ' + c.name, E(c.programme || '') + (filt ? ' · ' + E(filt) : '') + ' · ' + E(new Date().toLocaleDateString()), A.classHtml(d, {}) +
          (ivs.length ? '<h2>Intervention plan</h2>' + ivs.map(function (v) { return '<p><b>' + E(v.title) + '</b> (' + E(v.status) + ')<br><b>Evidence:</b> ' + E(v.evidence) + '<br><b>Action:</b> ' + E(v.action) + '</p>'; }).join('') : '') +
          '<h2>Teacher notes</h2><div class="note"></div>'), 'class-analysis-' + c.name.replace(/\W+/g, '-'));
      };
      body.querySelectorAll('[data-iv]').forEach(function (b) { b.onclick = function () { var g = d.suggestions[+b.getAttribute('data-iv')];
        S.db.from('interventions').insert({ class_id: c.id, title: g.title, evidence: g.evidence, action: g.action }).then(function (r) { if (ok(r, 'Added to your intervention plan')) again(); }); }; });
      body.querySelectorAll('[data-ivst]').forEach(function (b) { b.onclick = function () { var g = (d.studentSupport || [])[+b.getAttribute('data-ivst')]; if (!g) return;
        S.db.from('interventions').insert({ class_id: c.id, student_id: g.student_id, title: g.title, evidence: g.evidence, action: g.action }).then(function (r) { if (ok(r, 'Added to your intervention plan')) again(); }); }; });
      body.querySelectorAll('[data-ivs]').forEach(function (b) { b.onclick = function () {
        S.db.from('interventions').update({ status: b.getAttribute('data-v') }).eq('id', b.getAttribute('data-ivs')).then(function (r) { if (ok(r)) again(); }); }; });
      $('#tsave').onclick = function () {
        var t = { secure: +$('#t1').value, developing: +$('#t2').value, practice: +$('#t3').value };
        if (!(t.secure > t.developing && t.developing > t.practice && t.practice > 0 && t.secure <= 100)) { toast('Each level must be lower than the one above it.', true); return; }
        S.db.from('analysis_settings').upsert({ teacher_id: ME.user.id, thresholds: t, min_items: +$('#t4').value || 3, min_assessments: +$('#t5').value || 2, updated_at: new Date().toISOString() }).then(function (r) { if (ok(r, 'Mastery levels saved')) again(); });
      };
    });
  }
  /* A student's learning profile, their analysed work and printable reports (teacher view) */
  function studentAnalysis(p, sid, pr) {
    var box = p.querySelector('#anbox'); if (!box || !window.BVA) return;
    var A = window.BVA;
    Promise.all([S.db.rpc('student_profile', { sid: sid }), S.db.from('submission_analysis').select('*').eq('student_id', sid).order('at', { ascending: false })]).then(function (x) {
      if (x[0].error) { box.innerHTML = '<p class="small muted">' + (/student_profile|schema cache/.test(x[0].error.message) ? 'The learning profile needs database update 016.' : E(S.nice(x[0].error))) + '</p>'; return; }
      var prof = x[0].data, subs = x[1].data || [];
      box.innerHTML = '<div class="row2"><h3 style="margin:0">📊 Learning profile</h3><div class="acts"><button type="button" class="btn sm" id="aip">🤖 AI summary</button><button type="button" class="btn sm main" id="prep">⬇ Profile report</button></div></div>' +
        A.profileHtml(prof, { staff: true }) +
        '<h5>Analysed work</h5>' + (subs.length ? subs.map(function (sa) { return '<details class="panel" data-sk="' + E(sa.sub_key) + '"><summary><b>' + E(sa.title) + '</b> <span class="small muted">' + E(S.when(sa.at)) + '</span> · ' + (sa.pct == null ? '–' : sa.pct + '%') + ' ' + A.pill(A.levelOf(sa.pct, (prof.settings || {}).thresholds)) + (sa.ai && !sa.ai.none ? ' <span class="pill">🤖</span>' : '') + '</summary><div class="sbody small muted">Loading…</div></details>'; }).join('') : '<p class="small muted">No analysed work yet.</p>') +
        '<h5>Add a comment for the student</h5><textarea id="acm" rows="2" placeholder="Shown to the student on their profile and in reports"></textarea><div class="acts"><button type="button" class="btn sm" id="acs">Save comment</button></div>';
      box.querySelectorAll('details[data-sk]').forEach(function (dd) { dd.ontoggle = function () { if (!dd.open || dd.getAttribute('data-l')) return; dd.setAttribute('data-l', 1);
        var sk = dd.getAttribute('data-sk'), sa = subs.filter(function (z) { return z.sub_key === sk; })[0];
        S.db.from('item_results').select('*').eq('sub_key', sk).order('id').then(function (r) {
          dd.querySelector('.sbody').className = 'sbody'; dd.querySelector('.sbody').innerHTML = A.submissionHtml(sa, r.data || [], { settings: prof.settings, open: true }) +
            '<div class="acts"><button type="button" class="btn sm" data-ai1>🤖 ' + (sa.ai && !sa.ai.none ? 'Redo' : 'Add') + ' AI analysis</button><button type="button" class="btn sm" data-rep1>⬇ Report for this work</button></div>';
          dd.querySelector('[data-rep1]').onclick = function () { A.openDoc(A.reportDoc('Assessment analysis: ' + sa.title, E(pr.full_name) + ' · ' + E((CLASSES.filter(function (k) { return k.id === pr.class_id; })[0] || {}).name || '') + ' · ' + E(S.when(sa.at)),
            A.submissionHtml(sa, r.data || [], { settings: prof.settings, open: true }) + commentsFor(prof, sk) + '<h2>Teacher comments</h2><div class="note"></div>'), 'analysis-' + (pr.full_name || 'student').replace(/\W+/g, '-')); };
          dd.querySelector('[data-ai1]').onclick = function () { var b = this; b.disabled = true; b.textContent = 'Analysing…';
            var body = sk.indexOf('L:') === 0 ? { lesson: sa.ref, student: sid } : { attempt: sk };
            S.db.functions.invoke('analyse', { body: body }).then(function (res) { var dta = res.data; if (typeof dta === 'string') { try { dta = JSON.parse(dta); } catch (e) { dta = null; } }
              if (res.error || !dta || !dta.ok) { b.disabled = false; b.textContent = '🤖 Add AI analysis'; toast((dta && dta.error) || 'AI analysis is not available right now.', true); return; }
              toast(dta.ai ? 'AI analysis added' : 'Re-analysed (no written answers for AI to read)'); studentAnalysis(p, sid, pr); }); };
        }); }; });
      box.querySelector('#prep').onclick = function () {
        S.db.from('item_results').select('*').eq('student_id', sid).order('at').then(function (r) {
          var items = r.data || [], by = {}; items.forEach(function (i) { (by[i.sub_key] = by[i.sub_key] || []).push(i); });
          A.openDoc(A.reportDoc('Learning profile: ' + (pr.full_name || 'Student'), E((CLASSES.filter(function (k) { return k.id === pr.class_id; })[0] || {}).name || '') + ' · ' + subs.length + ' pieces of analysed work',
            '<h2>Overview and topic mastery</h2>' + A.profileHtml(prof, { staff: true }) + '<h2>Assessment history</h2>' +
            subs.slice().reverse().map(function (sa) { return '<h3 style="margin-bottom:2px">' + E(sa.title) + '</h3>' + A.submissionHtml(sa, by[sa.sub_key] || [], { settings: prof.settings, open: true }); }).join('') +
            '<h2>Teacher comments and intervention</h2><div class="note"></div>'), 'profile-' + (pr.full_name || 'student').replace(/\W+/g, '-'));
        });
      };
      box.querySelector('#aip').onclick = function () { var b = this; b.disabled = true; b.textContent = 'Summarising…';
        S.db.functions.invoke('analyse', { body: { profile: sid } }).then(function (res) { var dta = res.data; if (typeof dta === 'string') { try { dta = JSON.parse(dta); } catch (e) { dta = null; } }
          if (res.error || !dta || !dta.ok) { b.disabled = false; b.textContent = '🤖 AI summary'; toast((dta && dta.error) || 'AI summary is not available right now.', true); return; }
          studentAnalysis(p, sid, pr); }); };
      box.querySelector('#acs').onclick = function () { var t = box.querySelector('#acm').value.trim(); if (!t) return;
        S.db.from('analysis_comments').insert({ student_id: sid, comment: t }).then(function (r) { if (ok(r, 'Comment saved')) studentAnalysis(p, sid, pr); }); };
    });
  }
  function commentsFor(prof, sk) { var cs = (prof.comments || []).filter(function (c) { return c.sub_key === sk || !c.sub_key; });
    return cs.length ? '<h2>Comments</h2>' + cs.map(function (c) { return '<p>' + E(c.comment) + ' <span class="small">(' + E(S.when(c.at)) + ')</span></p>'; }).join('') : ''; }
  function defaultProg(p) { p = (p || '').toLowerCase(); return /^grade 11/.test(p) ? ['IGCSE', 'AS Level'] : /^grade 12/.test(p) ? ['AS Level', 'A Level'] : []; }
  function filters(state) {
    return '<div class="row2" style="justify-content:flex-start"><span class="small muted">Show:</span>' + [['all', 'Everyone'], ['not', 'Not submitted'], ['done', 'Submitted']].map(function (f) {
      return '<button type="button" class="btn sm' + (state.filter === f[0] ? ' main' : '') + '" data-f="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div>';
  }
  function wireFilters(host, state) {
    host.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { state.filter = b.getAttribute('data-f'); state.reload(); }; });
    host.querySelectorAll('details[data-k]').forEach(function (d) { d.ontoggle = function () { state.open[d.getAttribute('data-k')] = d.open; }; });
  }
  function quizBoard(body, c, state) {
    return Promise.all([roster(c.id),
      S.db.from('quiz_classes').select('published, quizzes(id,title,category,published,due_at,opens_at,time_limit_minutes,show_results,created_at,topic_id' + (QSUBJ ? ',subject' : '') + ', quiz_questions(question_id))').eq('class_id', c.id),
      S.db.rpc('class_quiz_board', { cls: c.id })]).then(function (x) {
      if (x[1].error) throw x[1].error; if (x[2].error) throw x[2].error;
      var kids = x[0], qs = (x[1].data || []).filter(function (r) { return r.quizzes; }).map(function (r) { return Object.assign({}, r.quizzes, { live: !!r.published }); }), by = {}, extra = {};
      qs.sort(function (a, b) { return (b.live - a.live) || (new Date(b.created_at) - new Date(a.created_at)); });
      (x[2].data || []).forEach(function (r) { (by[r.quiz_id] = by[r.quiz_id] || {})[r.student_id] = r; });
      if (!qs.length) { body.innerHTML = '<p class="emptybox">No quizzes or exams are linked to ' + E(c.name) + ' yet. In <a href="#quizzes">Quizzes and exams</a>, open a quiz and tick this class; then publish it here.</p>'; return; }
      if (!kids.length) { body.innerHTML = '<p class="emptybox">No students have joined ' + E(c.name) + ' yet. Give them the join code <b class="code">' + E(c.join_code) + '</b> to type on the registration page.</p>'; return; }
      var one = function (q, qi) {
        var nq = (q.quiz_questions || []).length, rows = kids.map(function (k) {
          var a = (by[q.id] || {})[k.id], st = !a ? 'none' : a.status === 'in_progress' ? 'prog' : 'done';
          return { k: k, a: a, st: st };
        });
        var nDone = rows.filter(function (r) { return r.st === 'done'; }).length, nProg = rows.filter(function (r) { return r.st === 'prog'; }).length, nNone = rows.length - nDone - nProg;
        var notList = rows.filter(function (r) { return r.st !== 'done'; }).map(function (r) { return E(r.k.full_name || '(no name)'); });
        var show = rows.filter(function (r) { return state.filter === 'all' || (state.filter === 'done' ? r.st === 'done' : r.st !== 'done'); });
        var order = { prog: 0, none: 1, done: 2 }; show.sort(function (a, b) { return order[a.st] - order[b.st] || (a.k.full_name || '').localeCompare(b.k.full_name || ''); });
        var key = 'q' + q.id, open = state.open[key] != null ? state.open[key] : qi === 0;
        return '<details class="panel" data-k="' + key + '"' + (open ? ' open' : '') + '><summary><b>' + (q.category === 'exam' ? '🧪 ' : '📝 ') + E(q.title) + '</b> ' + (q.live ? '<span class="pill ok">Published for ' + E(c.name) + '</span>' : '<span class="pill">Not published: students in ' + E(c.name) + ' cannot see it</span>') +
          '<div class="small muted">' + [nq + ' questions', q.time_limit_minutes ? '⏱ ' + q.time_limit_minutes + ' min' : '', q.due_at ? 'Due ' + S.when(q.due_at) : ''].filter(Boolean).join(' · ') + '</div>' +
          '<div class="small"><b style="color:var(--ok)">✓ ' + nDone + ' submitted</b> · <b style="color:#b45309">✎ ' + nProg + ' working now</b> · <b style="color:#b91c1c">○ ' + nNone + ' not started</b> · of ' + rows.length + '</div>' +
          bar([[nDone, 'var(--ok)', 'submitted'], [nProg, '#f59e0b', 'working'], [nNone, '#fca5a5', 'not started']], rows.length) + '</summary>' +
          (notList.length ? '<p class="small"><b>Not submitted (' + notList.length + '):</b> ' + notList.join(', ') + '</p>' : '<p class="small"><b>Everyone has submitted.</b></p>') +
          '<div class="acts"><button type="button" class="btn sm' + (q.live ? '' : ' main') + '" data-pub="' + q.id + '" data-on="' + (q.live ? '0' : '1') + '">' + (q.live ? '⏸ Unpublish for this class' : '📢 Publish for ' + E(c.name)) + '</button><button type="button" class="btn sm" data-rep="' + q.id + '">⬇ Report (marks and feedback)</button><button type="button" class="btn sm" data-ms="' + q.id + '">📄 Mark scheme</button>' +
            (nDone ? '<button type="button" class="btn sm" data-remark="' + q.id + '" title="Re-mark every handed-in attempt with the current rules and refresh the feedback. Marks you confirmed are kept.">🔁 Re-mark and refresh feedback</button>' : '') + '</div>' +
          '<div class="tablewrap"><table class="marks"><tr><th>Student</th><th>Status</th><th>Progress</th><th>Last active</th><th>Result</th></tr>' + show.map(function (r) {
            var a = r.a, idle = a && r.st === 'prog' && (Date.now() - new Date(a.last_seen)) > 180000, gone = a && r.st === 'prog' && a.away_now;
            var stat = r.st === 'done' ? '<span class="pill ok">✓ Submitted</span>' : r.st === 'prog' ? (gone ? '<span class="pill" style="background:#fee2e2;color:#b91c1c">🚩 Left the page now</span>' : idle ? '<span class="pill new">⚠ Idle</span>' : '<span class="pill t">✎ Working</span>') : '<span class="pill" style="color:#b91c1c">Not started</span>';
            var flag = a && a.away_count ? ' <span class="pill" style="background:#fee2e2;color:#b91c1c" title="Times the student left the page, and total time away">🚩 Left ' + a.away_count + '× · ' + mmss(a.away_seconds || 0) + '</span>' : '';
            var prog = !a ? '' : r.st === 'prog' ? a.answered + ' of ' + nq + ' answered' + (a.seconds_left != null ? ' · ⏱ ' + mmss(a.seconds_left) + ' left' : '') : 'Handed in ' + S.when(a.submitted_at);
            var res = !a || r.st !== 'done' ? '' : a.status === 'needs_marking' ? '<a class="btn sm" href="#marking/' + a.attempt_id + '">Mark</a>' : (a.score != null ? a.score + ' / ' + a.max_score : '') + (a.released || q.show_results ? '' : ' <span class="small muted">(not released)</span>');
            return '<tr><td><a href="#students/' + r.k.id + '">' + E(r.k.full_name || '(no name)') + '</a>' + dashLink(r.k.id) + (r.k.approved ? '' : ' <span class="pill new">not approved</span>') + '</td><td>' + stat + '</td><td class="small">' + prog + (a && a.attempts > 1 ? ' · attempt ' + a.attempts : '') + flag + '</td><td class="small">' + (a ? ago(r.st === 'done' ? a.submitted_at : a.last_seen) : '–') + '</td><td>' + res + '</td></tr>';
          }).join('') + '</table></div></details>';
      };
      // Grade 6 to 10 science: Biology, Chemistry and Physics sets are kept apart, one tab per subject
      var html = filters(state) + (BV.subj.isMyp(c) ? BV.subj.split(qs, quizSubj, function (list) { return list.map(one).join(''); }) : qs.map(one).join(''));
      body.innerHTML = html; wireFilters(body, state);
      wireMS(body);
      body.querySelectorAll('[data-remark]').forEach(function (b) { b.onclick = function () {
        var qid = b.getAttribute('data-remark'), qz = qs.filter(function (z) { return z.id === qid; })[0] || {};
        b.disabled = true; b.textContent = 'Re-marking…';
        S.db.rpc('remark_quiz', { qid: qid }).then(function (r) {
          if (r.error) { b.disabled = false; b.textContent = '🔁 Re-mark and refresh feedback'; toast(S.nice(r.error), true); return; }
          var d = r.data || {}, ai = (d.need_ai || []);
          var done = function (n) { b.disabled = false; b.textContent = '🔁 Re-mark and refresh feedback';
            toast('Re-marked ' + d.attempts + ' attempt' + (d.attempts === 1 ? '' : 's') + ': ' + d.changed + ' mark' + (d.changed === 1 ? '' : 's') + ' changed, feedback refreshed' + (n ? ', AI suggestions for ' + n + ' attempt' + (n === 1 ? '' : 's') : '') + '. Marks you confirmed were kept.'); state.reload(); };
          if (!ai.length || (qz.feedback_mode || 'hybrid') === 'rule' || !S.db.functions) return done(0);
          b.textContent = 'Getting AI suggestions…';
          var n = 0; ai.reduce(function (pr, aid) { return pr.then(function () { return S.db.functions.invoke('ai-mark', { body: { attempt: aid } }).then(function () { n++; }, function () {}); }); }, Promise.resolve()).then(function () { done(n); });
        });
      }; });
      body.querySelectorAll('[data-pub]').forEach(function (b) { b.onclick = function () {
        var on = b.getAttribute('data-on') === '1'; b.disabled = true;
        S.db.rpc('set_quiz_published', { qid: b.getAttribute('data-pub'), cid: c.id, on_off: on }).then(function (r) {
          b.disabled = false; if (r.error) return toast(S.nice(r.error));
          toast(on ? 'Published for ' + c.name + ': its students can open it now.' : 'Unpublished for ' + c.name + '.'); state.reload(); }); }; });
      body.querySelectorAll('[data-rep]').forEach(function (b) { b.onclick = function () { var qz = qs.filter(function (z) { return z.id === b.getAttribute('data-rep'); })[0];
        b.disabled = true; b.textContent = 'Making the report…';
        quizReport(qz, c, kids, by[qz.id] || {}).then(function () { b.disabled = false; b.textContent = '⬇ Report (marks and feedback)'; }, function (e) { b.disabled = false; b.textContent = '⬇ Report (marks and feedback)'; toast(S.nice(e), true); }); }; });
    });
  }
  /* Feedback on one saved lesson step (rules, AI or teacher), as the student sees it */
  function lfHtml(f) {
    var src = f.source === 'ai' ? '🤖 AI suggestion' : f.source === 'teacher' ? '👩‍🏫 Teacher' : '⚙ Re-marked by rules';
    var li = function (i, t) { return '<li>' + i + ' ' + E(t) + '</li>'; };
    return '<div class="small" style="margin-top:4px"><b>' + src + '</b> · ' + E(S.when(f.at)) + ' · students see this on the lesson page</div>' + (f.items || []).map(function (a) {
      return '<div style="border-left:4px solid ' + (a.mark >= a.max ? '#16a34a' : a.mark > 0 ? '#f59e0b' : '#dc2626') + ';padding:4px 10px;margin:4px 0;background:#fff"><b>' + E(a.q) + ' · ' + E(a.mark) + '/' + E(a.max) + (f.source === 'ai' ? ' suggested' + (a.confidence ? ' (' + E(a.confidence) + ' confidence)' : '') : '') + '</b><ul style="margin:2px 0;padding-left:0;list-style:none">' +
        (a.understood || []).map(function (t) { return li('✓', t); }).join('') + (a.missing || []).map(function (t) { return li('✗', t); }).join('') + (a.why || []).map(function (t) { return li('💡', t); }).join('') +
        (a.improve ? li('↗', a.improve) : '') + (a.next ? li('📚', a.next) : '') + '</ul></div>'; }).join('');
  }
  /* Printable mark scheme for a quiz or exam, built from the answers and mark scheme stored with each question */
  function wireMS(host) {
    host.querySelectorAll('[data-ms]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); var t = b.textContent; b.disabled = true; b.textContent = 'Making…';
      markScheme(b.getAttribute('data-ms')).then(function () { b.disabled = false; b.textContent = t; }, function (er) { b.disabled = false; b.textContent = t; toast(S.nice(er), true); }); }; });
  }
  function markScheme(qid) {
    return Promise.all([S.db.from('quizzes').select('title,category,instructions,time_limit_minutes').eq('id', qid).maybeSingle(), loadQuiz(qid)]).then(function (x) {
      var qz = x[0].data || { title: 'Quiz' }, qs = x[1].filter(function (q) { return q.kind !== 'info'; }), total = 0, n = 0;
      var L = 'ABCDEFGHIJ', md = function (t) { return BV.md ? BV.md(String(t || '')) : E(t); };
      var body = qs.map(function (q) {
        n++; total += q.marks || 0; var a = q.ans || {}, opts = q.options || [], h = '';
        var prompt = String(q.prompt || '').replace(/\[\[answer:[^\]]*\]\]/g, '_____');
        if ((q.kind === 'mcq' || q.kind === 'tf') && opts.length) {
          h += '<ol class="opts" type="A">' + opts.map(function (o, i) { var right = i === a.correct_option, fb = (a.option_feedback || [])[i];
            return '<li class="' + (right ? 'right' : '') + '">' + (BVT.opt ? BVT.opt(o) : E(o)) + (right ? ' <b>✓ correct</b>' : '') + (fb ? '<div class="why">' + E(fb) + '</div>' : '') + '</li>'; }).join('') + '</ol>';
          h += '<p class="ans"><b>Answer:</b> ' + (a.correct_option != null ? L[a.correct_option] + ' (' + E(BVT.optText ? BVT.optText(opts[a.correct_option]) : opts[a.correct_option]) + ')' : '<i>not set</i>') + ' [1]</p>';
        }
        var pts = Array.isArray(a.points) ? a.points : [];
        if (pts.length) h += '<p class="ans"><b>Mark points</b> (one mark each unless shown):</p><ul>' + pts.map(function (p) {
          var any = (p.any || []).map(function (w) { return String(w).replace(/\s*\+\s*/g, ' + '); }).join(' / ');
          var t = p.text || p.point; return '<li>' + E(t || any) + (p.marks && p.marks > 1 ? ' [' + p.marks + ']' : ' [1]') + (any && t ? ' <span class="kw">key words: ' + E(any) + '</span>' : '') + '</li>'; }).join('') + '</ul>';
        if (a.mark_scheme) h += '<div class="ms"><b>Mark scheme</b>' + md(a.mark_scheme) + '</div>';
        if (a.model_answer) h += '<div class="model"><b>Model answer</b>' + md(a.model_answer) + '</div>';
        if (a.rubric) h += '<div class="ms"><b>Level descriptors</b>' + md(a.rubric) + '</div>';
        if (Array.isArray(a.accepted) && a.accepted.length) h += '<p class="small"><b>Also accept:</b> ' + E(a.accepted.join('; ')) + '</p>';
        var mis = Array.isArray(a.misconceptions) ? a.misconceptions : [];
        if (mis.length) h += '<p class="small"><b>Do not accept / common errors:</b></p><ul class="small">' + mis.map(function (m) { return '<li>' + (m.any ? '<i>' + E(m.any.slice(0, 4).join(' / ')) + '</i>: ' : '') + E(typeof m === 'string' ? m : (m.say || JSON.stringify(m))) + '</li>'; }).join('') + '</ul>';
        if (a.explanation && String(a.mark_scheme || '').indexOf(a.explanation) < 0) h += '<p class="small"><b>Why:</b> ' + E(a.explanation) + '</p>';
        if (!h) h = '<p class="ans"><i>No mark scheme entered for this question yet.</i></p>';
        return '<section class="q"><div class="qh"><b>Question ' + n + '</b><span>[' + (q.marks || 0) + ' mark' + (q.marks === 1 ? '' : 's') + ']</span></div><div class="prompt">' + md(prompt) + '</div>' +
          (q.image_url ? BVT.fig(q.image_url, '') : '') + h + '</section>';
      }).join('');
      var css = 'body{font:15px/1.5 Arial,Helvetica,sans-serif;color:#111;max-width:860px;margin:24px auto;padding:0 16px}h1{font-size:1.5em;margin:0}.meta{color:#555;margin:4px 0 18px}' +
        '.q{border:1px solid #ccc;border-radius:8px;padding:10px 14px;margin:12px 0;page-break-inside:avoid}.qh{display:flex;justify-content:space-between;border-bottom:1px solid #eee;margin-bottom:6px}' +
        '.prompt{color:#333}.prompt p{margin:4px 0}img{max-width:100%;max-height:320px;display:block;margin:6px 0}.opts li{margin:2px 0}.opts li.right{font-weight:600;color:#065f46}.why{font-weight:400;color:#555;font-size:.9em}' +
        '.ans{background:#ecfdf5;padding:4px 8px;border-radius:6px}.ms,.model{background:#f8fafc;border-left:4px solid #2563eb;padding:6px 10px;margin:6px 0}.model{border-left-color:#16a34a}.kw{color:#555;font-size:.88em}.small{font-size:.9em}' +
        '.bar{position:sticky;top:0;background:#fff;padding:8px 0;border-bottom:1px solid #ddd;margin-bottom:10px}@media print{.bar{display:none}}';
      var html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mark scheme · ' + E(qz.title) + '</title><style>' + css + '</style></head><body>' +
        '<div class="bar"><button onclick="print()">🖨 Print or save as PDF</button></div><h1>Mark scheme: ' + E(qz.title) + '</h1>' +
        '<p class="meta">' + (qz.category === 'exam' ? 'Exam' : 'Quiz') + ' · ' + n + ' questions · ' + total + ' marks' + (qz.time_limit_minutes ? ' · ' + qz.time_limit_minutes + ' minutes' : '') + ' · Prepared by BioscienceVista · Confidential: for teachers</p>' + body + '</body></html>';
      var w = window.open('', '_blank');
      if (w) { w.document.open(); w.document.write(html); w.document.close(); }
      else { var a2 = document.createElement('a'); a2.href = URL.createObjectURL(new Blob([html], { type: 'text/html' })); a2.download = 'mark-scheme-' + qz.title.replace(/[^\w]+/g, '-').slice(0, 60) + '.html'; a2.click(); }
    });
  }
  /* A self-contained HTML report for one quiz and one class: marks, answers and feedback, with where each piece of feedback came from */
  function quizReport(qz, c, kids, latest) {
    var ids = Object.keys(latest).map(function (k) { return latest[k].attempt_id; });
    return Promise.all([loadQuiz(qz.id), ids.length ? S.db.from('quiz_attempts').select('id,student_id,answers,detail,score,max_score,status,submitted_at,released,away_count,away_seconds').in('id', ids) : Promise.resolve({ data: [] }),
      ids.length ? S.db.from('attempt_feedback').select('*').in('attempt_id', ids).then(function (f) { return f; }, function () { return { data: [] }; }) : Promise.resolve({ data: [] })]).then(function (x) {
      var qs = x[0].filter(function (q) { return q.kind !== 'info'; }), at = {}, fb = {}, src = { rule: 0, ai: 0, teacher: 0 };
      (x[1].data || []).forEach(function (a) { at[a.student_id] = a; });
      ((x[2] && x[2].data) || []).forEach(function (f) { (fb[f.attempt_id] = fb[f.attempt_id] || {})[f.question_id] = f; src[f.source] = (src[f.source] || 0) + 1; });
      var T = window.BVT, h = function (v) { return E(v == null ? '' : v); }, lbl = { rule: '⚙️ Rule-based', ai: '🤖 AI', teacher: '🧑‍🏫 Teacher' };
      var done = kids.filter(function (k) { return at[k.id] && at[k.id].status !== 'in_progress'; }), mean = done.length ? Math.round(done.reduce(function (t, k) { return t + 100 * (+at[k.id].score || 0) / (+at[k.id].max_score || 1); }, 0) / done.length) : null;
      var rows = kids.map(function (k) { var a = at[k.id], st = !a ? 'Not started' : a.status === 'in_progress' ? 'Working' : a.status === 'needs_marking' ? 'Needs marking' : 'Marked';
        return '<tr><td>' + h(k.full_name) + '</td><td>' + st + '</td><td>' + (a && a.status !== 'in_progress' ? h(a.score) + ' / ' + h(a.max_score) : '–') + '</td><td>' + (a && a.away_count ? a.away_count + '×' : '') + '</td></tr>'; }).join('');
      var per = done.map(function (k) { var a = at[k.id], f = fb[a.id] || {}, det = {}; (a.detail || []).forEach(function (d) { det[d.question_id] = d; });
        return '<section class="stu"><h2>' + h(k.full_name) + ' <small>' + h(a.score) + ' / ' + h(a.max_score) + ' · handed in ' + h(S.when(a.submitted_at)) + (a.released ? ' · released' : '') + '</small></h2>' + qs.map(function (q, i) {
          var d = det[q.id] || {}, g = (a.answers || {})[q.id], row = f[q.id], ans = g == null || g === '' ? '<i>no answer</i>' : /^data:image/.test(g) ? '<img src="' + h(g) + '" alt="Drawing" style="max-width:320px">' : q.kind === 'short' ? (window.BVT && BVT.answerHtml ? BVT.answerHtml(g) : '<span style="white-space:pre-wrap">' + h(g) + '</span>') : h('ABCDEFGH'.charAt(g) + '. ' + ((q.options || [])[g] || ''));
          return '<div class="q"><p><b>' + (i + 1) + '.</b> ' + h(String(q.prompt || '').replace(/\[\[answer:[^\]]*\]\]/g, '').slice(0, 400)) + ' <span class="pill">' + (d.got == null ? 'to be marked' : h(d.got) + ' / ' + h(d.max)) + '</span>' + (row ? ' <span class="src ' + row.source + '">' + lbl[row.source] + (row.reviewed ? ' · teacher-reviewed' : '') + '</span>' : '') + '</p>' +
            '<p class="ans"><b>Answer:</b> ' + ans + '</p>' + (row && T && T.feedback ? T.feedback(row) : d.comment ? '<p><b>Teacher comment:</b> ' + h(d.comment) + '</p>' : '') + '</div>'; }).join('') + '</section>'; }).join('');
      var css = 'body{font:15px/1.5 system-ui,Arial,sans-serif;max-width:960px;margin:24px auto;padding:0 16px;color:#1e293b}h1{margin:0}table{border-collapse:collapse;width:100%;margin:12px 0}td,th{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}th{background:#f1f5f9}' +
        '.stu{border-top:3px solid #e2e8f0;margin-top:24px;page-break-before:always}.stu small{color:#64748b;font-weight:400}.q{border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px;margin:10px 0}.pill{background:#f1f5f9;border-radius:99px;padding:1px 8px;font-size:.8em}' +
        '.src{font-size:.8em;border-radius:99px;padding:1px 8px}.src.rule{background:#e0f2fe}.src.ai{background:#ede9fe}.src.teacher{background:#dcfce7}.ans{background:#f8fafc;padding:6px 8px;border-radius:6px}' +
        '.fbbox{display:grid;gap:6px}.fbp{border-left:4px solid #cbd5e1;padding:4px 10px}.fbp b{display:block}.fbp ul{margin:0;padding-left:20px}.fbp p{margin:2px 0}.fbp.good{border-color:#16a34a}.fbp.miss{border-color:#dc2626}.fbp.why{border-color:#2563eb}.fbp.imp{border-color:#d97706}.fbp.next{border-color:#7c3aed}.fbp.tc{border-color:#0f766e}.fbsrc{font-size:.8em;color:#64748b;margin:0}' +
        '@media print{.stu{page-break-before:always}}';
      var html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + h(qz.title) + ' · ' + h(c.name) + '</title><style>' + css + '</style></head><body>' +
        '<p style="color:#64748b">BioscienceVista · teacher report · ' + h(new Date().toLocaleString()) + '</p><h1>' + h(qz.title) + '</h1><p><b>' + h(c.name) + '</b> · ' + done.length + ' of ' + kids.length + ' handed in' + (mean != null ? ' · class average ' + mean + '%' : '') + '</p>' +
        '<p>Feedback sources: ⚙️ rule-based ' + src.rule + ' · 🤖 AI ' + src.ai + ' · 🧑‍🏫 teacher ' + src.teacher + '. AI marks are suggestions until a teacher confirms them.</p>' +
        '<table><tr><th>Student</th><th>Status</th><th>Mark</th><th>Left the page</th></tr>' + rows + '</table>' + per + '</body></html>';
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      a.download = (qz.title + ' ' + c.name).replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-').slice(0, 80) + '-report.html'; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    });
  }

  /* ---------- live work status: every student of the class, what they are doing now (refreshes every 10 seconds) ---------- */
  function statusBoard(body, c, state) {
    var days = state.sdays || 1, since = new Date(); since.setHours(0, 0, 0, 0); since.setDate(since.getDate() - (days - 1));
    return roster(c.id).then(function (kids) {
      var ids = kids.map(function (k) { return k.id; });
      if (!ids.length) { body.innerHTML = '<p class="emptybox">No students have joined ' + E(c.name) + ' yet (join code <b class="code">' + E(c.join_code || '') + '</b>).</p>'; return; }
      return Promise.all([S.db.from('lesson_work').select('lesson,student_id,step,saved_at,answers').in('student_id', ids).gte('saved_at', since.toISOString()).order('saved_at', { ascending: false }).limit(3000),
        S.db.from('quiz_attempts').select('student_id,status,started_at,submitted_at,last_seen,away_now,score,max_score,quizzes(title)').in('student_id', ids).gte('started_at', since.toISOString()).order('started_at', { ascending: false }).limit(1000)]).then(function (x) {
        if (x[0].error) throw x[0].error;
        var work = x[0].data || [], att = (x[1] && !x[1].error && x[1].data) || [], need = {};
        work.forEach(function (w) { need[w.lesson] = 1; });
        var ln = Object.keys(need);
        return (ln.length ? S.db.from('lessons').select('external_id,title').in('external_id', ln) : Promise.resolve({ data: [] })).then(function (lr) {
          var title = {}; (lr.data || []).forEach(function (l) { title[l.external_id] = l.title; });
          var now = Date.now(), per = {};
          kids.forEach(function (k) { per[k.id] = { k: k, lessons: {}, order: [], last: null, quiz: null }; });
          work.forEach(function (w) { var P = per[w.student_id]; if (!P) return; var L = P.lessons[w.lesson];
            if (!L) { L = P.lessons[w.lesson] = { id: w.lesson, steps: {}, last: w.saved_at, total: null }; P.order.push(w.lesson); }
            L.steps[w.step] = 1; if (!L.total) { var m = /TOTAL=([0-9.]+ ?\/ ?[0-9.]+)/.exec(w.answers || ''); if (m) L.total = m[1].replace(/\s/g, ''); }
            if (!P.last || w.saved_at > P.last) P.last = w.saved_at; });
          att.forEach(function (a) { var P = per[a.student_id]; if (!P || P.quiz) return; P.quiz = a; var t = a.last_seen || a.submitted_at || a.started_at; if (t && (!P.last || t > P.last)) P.last = t; });
          var chips = function (L) { var o = ''; for (var i = 1; i <= 6; i++) o += '<span class="stp' + (L && L.steps[i] ? ' on' : '') + '">' + i + '</span>'; return o; };
          var rows = kids.map(function (k) { var P = per[k.id], qz = P.quiz, cur = P.order[0] ? P.lessons[P.order[0]] : null;
            var qt = qz ? (qz.last_seen || qz.submitted_at || qz.started_at) : null, onQuiz = !!(qz && qz.status === 'in_progress' && (!cur || qt > cur.last));
            var age = P.last ? (now - new Date(P.last)) / 60000 : 1e9, st;
            if (onQuiz && qz.away_now) st = ['away', '<span class="pill new">🔴 Left the quiz page</span>'];
            else if (age < 3) st = ['now', '<span class="pill ok">🟢 Working now</span>'];
            else if (age < 15) st = ['pause', '<span class="pill t">🟡 Paused ' + Math.round(age) + ' min</span>'];
            else if (P.last) st = ['earlier', '<span class="pill">⚪ Active ' + ago(P.last) + '</span>'];
            else st = ['none', '<span class="pill" style="opacity:.7">○ No work ' + (days === 1 ? 'today' : 'in ' + days + ' days') + '</span>'];
            var lastQuiz = qz && !onQuiz && (!cur || qt > cur.last);
            var what = onQuiz ? '📝 ' + E((qz.quizzes || {}).title || 'Quiz') + ' <span class="small muted">in progress</span>' : lastQuiz ? '📝 ' + E((qz.quizzes || {}).title || 'Quiz') + ' <span class="small muted">handed in</span>' : cur ? '🧪 ' + E(title[cur.id] || cur.id) : '<span class="muted">–</span>';
            var stepsCell = onQuiz || lastQuiz ? '' : cur ? chips(cur) + (cur.steps[6] || Object.keys(cur.steps).length >= 6 ? ' <span class="pill ok">✓ done</span>' : '') : '';
            var marks = lastQuiz && qz.max_score ? E(qz.score + '/' + qz.max_score) : !onQuiz && cur && cur.total ? E(cur.total) : '';
            var rest = P.order.filter(function (id) { return !cur || id !== cur.id || lastQuiz || onQuiz; });
            var more = rest.map(function (id) { var L = P.lessons[id]; return '<div class="small">🧪 ' + E(title[id] || id) + ' ' + chips(L) + (L.total ? ' · ' + E(L.total) : '') + ' · ' + ago(L.last) + '</div>'; }).join('');
            return { k: k, st: st, age: age, html: '<tr><td><b>' + E(k.full_name || '(no name)') + '</b></td><td>' + st[1] + '</td><td>' + what + (more ? '<details><summary class="small">' + rest.length + ' other lesson' + (rest.length === 1 ? '' : 's') + '</summary>' + more + '</details>' : '') + '</td><td>' + stepsCell + '</td><td>' + marks + '</td><td class="small">' + (P.last ? ago(P.last) : '–') + '</td></tr>' }; });
          var rank = { now: 0, away: 1, pause: 2, earlier: 3, none: 4 }; rows.sort(function (a, b) { return rank[a.st[0]] - rank[b.st[0]] || a.age - b.age || (a.k.full_name || '').localeCompare(b.k.full_name || ''); });
          var cnt = function (k) { return rows.filter(function (r) { return r.st[0] === k; }).length; };
          body.innerHTML = '<div class="row2"><p style="margin:0"><b>🟢 ' + cnt('now') + ' working now</b> · <b style="color:#b45309">🟡 ' + cnt('pause') + ' paused</b>' + (cnt('away') ? ' · <b style="color:#b91c1c">🔴 ' + cnt('away') + ' left a quiz page</b>' : '') + ' · ⚪ ' + cnt('earlier') + ' active earlier · ○ ' + cnt('none') + ' no work</p>' +
              '<label class="small">Show <select id="sdays"><option value="1"' + (days === 1 ? ' selected' : '') + '>Today</option><option value="7"' + (days === 7 ? ' selected' : '') + '>Last 7 days</option><option value="30"' + (days === 30 ? ' selected' : '') + '>Last 30 days</option></select></label></div>' +
            bar([[cnt('now'), 'var(--ok)', 'working now'], [cnt('pause') + cnt('away'), '#f59e0b', 'paused'], [cnt('earlier'), '#94a3b8', 'active earlier'], [cnt('none'), '#e2e8f0', 'no work']], rows.length) +
            '<p class="small muted">Updates by itself every 10 seconds (last update ' + new Date().toLocaleTimeString() + '). Steps light up as each student saves them; "Marks so far" counts the marked questions in the steps saved. Open <a href="#classes/' + c.id + '/lessons">🧪 Interactive lessons</a> to read a student\'s answers.</p>' +
            '<div class="tablewrap"><table class="marks"><tr><th>Student</th><th>Now</th><th>Working on</th><th>Steps saved</th><th>Marks so far</th><th>Last activity</th></tr>' + rows.map(function (r) { return r.html; }).join('') + '</table></div>';
          body.querySelector('#sdays').onchange = function () { state.sdays = +this.value; state.reload(); };
        });
      });
    });
  }
  function lessonBoard(body, c, state) {
    var since = new Date(Date.now() - 60 * 864e5).toISOString();
    return Promise.all([roster(c.id), S.db.rpc('class_lesson_board', { cls: c.id }), classMats(c.id), S.db.from('lessons').select('external_id,title,topic_id,sort_order,url').order('sort_order'),
      S.db.from('lesson_work').select('lesson,student_name,class_name,step,saved_at').is('student_id', null).gte('saved_at', since).order('saved_at', { ascending: false }).limit(1000)]).then(function (x) {
      if (x[1].error) throw x[1].error;
      x.splice(2, 1);
      var kids = x[0], board = x[1].data || [], lessons = x[2].data || [], tp = {}; TOPICS.forEach(function (t) { tp[t.id] = t; });
      var title = {}, subjOfLesson = {}; lessons.forEach(function (l) { title[l.external_id] = l.title; subjOfLesson[l.external_id] = (tp[l.topic_id] || {}).name || ''; });
      var last = {}; board.forEach(function (r) { if (!last[r.lesson] || r.last_saved > last[r.lesson]) last[r.lesson] = r.last_saved; });
      var active = Object.keys(last).sort(function (a, b) { return last[b] < last[a] ? -1 : 1; });
      var own = MATS[c.id] || [];   // only this class's own lessons (its lesson list); otherwise its programme
      var prog = lessons.filter(function (l) { if (active.indexOf(l.external_id) >= 0) return false; if (own.length) return own.indexOf(l.url) >= 0; var t = tp[l.topic_id], pr = t && (t.programme || (tp[t.parent_id] || {}).programme); return sameProg(pr, c.programme); });
      if (own.length) prog.sort(function (a, b) { return own.indexOf(a.url) - own.indexOf(b.url); });
      if (!state.lesson || (active.indexOf(state.lesson) < 0 && !prog.some(function (l) { return l.external_id === state.lesson; }))) state.lesson = active[0] || (prog[0] && prog[0].external_id) || null;
      if (!state.lesson) { body.innerHTML = '<p class="emptybox">No interactive lessons for ' + E(c.name) + ' yet. When students in this class save a step on a lesson page while signed in, the lesson appears here.</p>'; return; }
      var L = state.lesson, rows = {}; board.filter(function (r) { return r.lesson === L; }).forEach(function (r) { rows[r.student_id] = r; });
      var list = kids.map(function (k) { return { k: k, r: rows[k.id] }; });
      Object.keys(rows).forEach(function (sid) { if (!kids.some(function (k) { return k.id === sid; })) list.push({ k: { id: sid, full_name: rows[sid].student_name, approved: true, moved: true }, r: rows[sid] }); });
      list.forEach(function (x) { var st = x.r ? x.r.steps : []; x.st = !x.r ? 'none' : (st.indexOf(6) >= 0 || st.length >= 6) ? 'done' : 'prog'; });
      var nDone = list.filter(function (x) { return x.st === 'done'; }).length, nProg = list.filter(function (x) { return x.st === 'prog'; }).length, nNone = list.length - nDone - nProg;
      var notList = list.filter(function (x) { return x.st !== 'done'; }).map(function (x) { return E(x.k.full_name || '(no name)'); });
      var show = list.filter(function (x) { return state.filter === 'all' || (state.filter === 'done' ? x.st === 'done' : x.st !== 'done'); });
      var order = { prog: 0, none: 1, done: 2 }; show.sort(function (a, b) { return order[a.st] - order[b.st] || (a.k.full_name || '').localeCompare(b.k.full_name || ''); });
      var num = (c.name.match(/\d+/) || [''])[0], anon = (x[3].data || []).filter(function (w) { var cn = (w.class_name || '').toLowerCase(); return w.lesson === L && num && (cn.match(/\d+/) || [''])[0] === num; });
      var anonBy = {}; anon.forEach(function (w) { var k = w.student_name.trim().toLowerCase(); (anonBy[k] = anonBy[k] || { n: w.student_name, c: w.class_name, steps: {}, t: w.saved_at }).steps[w.step] = 1; });
      var chips = function (st) { var out = ''; for (var i = 1; i <= 6; i++) out += '<span class="stp' + (st.indexOf(i) >= 0 ? ' on' : '') + '" title="Step ' + i + (st.indexOf(i) >= 0 ? ' saved' : ' not saved') + '">' + i + '</span>'; return out; };
      body.innerHTML = '<div class="row2"><label class="small">Lesson <select id="lsel" style="max-width:520px">' +
          (active.length ? '<optgroup label="Lessons this class has worked on">' + active.map(function (id) { var sj = BV.subj.isMyp(c) ? BV.subj.of(subjOfLesson[id], title[id]) : '';
            return '<option value="' + E(id) + '"' + (id === L ? ' selected' : '') + '>' + (sj ? E(sj) + ' · ' : '') + E(title[id] || id) + ' · ' + ago(last[id]) + '</option>'; }).join('') + '</optgroup>' : '') +
          (function () { var opt = function (l) { return '<option value="' + E(l.external_id) + '"' + (l.external_id === L ? ' selected' : '') + '>' + E(l.title) + '</option>'; };
            if (!prog.length) return '';
            if (!BV.subj.isMyp(c)) return '<optgroup label="Other lessons for ' + E(c.programme || 'this class') + '">' + prog.map(opt).join('') + '</optgroup>';
            var G = BV.subj.groups(prog, function (l) { return BV.subj.of((tp[l.topic_id] || {}).name, l.title); });   // Grade 6 to 10: one group per subject
            return G.names.map(function (n) { return '<optgroup label="' + E(BV.subj.info(n)[0]) + ' lessons">' + G.by[n].map(opt).join('') + '</optgroup>'; }).join(''); })() +
        '</select></label></div>' + filters(state) +
        '<section class="panel"><b>' + E(title[L] || L) + '</b><div class="small"><b style="color:var(--ok)">✓ ' + nDone + ' finished all six steps</b> · <b style="color:#b45309">✎ ' + nProg + ' part-way</b> · <b style="color:#b91c1c">○ ' + nNone + ' not started</b> · of ' + list.length + '</div>' +
        bar([[nDone, 'var(--ok)', 'finished'], [nProg, '#f59e0b', 'part-way'], [nNone, '#fca5a5', 'not started']], list.length) +
        (notList.length ? '<p class="small"><b>Not submitted (' + notList.length + '):</b> ' + notList.join(', ') + '</p>' : '<p class="small"><b>Everyone has finished.</b></p>') +
        (kids.length ? '' : '<p class="small muted">No students have joined this class yet (join code <b class="code">' + E(c.join_code) + '</b>).</p>') +
        '<div class="tablewrap"><table class="marks"><tr><th>Student</th><th>Status</th><th>Steps saved</th><th>Marks so far</th><th>Last saved</th><th></th></tr>' + show.map(function (x) {
          var r = x.r, idle = r && x.st === 'prog' && (Date.now() - new Date(r.last_saved)) > 600000;
          var stat = x.st === 'done' ? '<span class="pill ok">✓ Finished</span>' : x.st === 'prog' ? (idle ? '<span class="pill new">⚠ No save for ' + ago(r.last_saved).replace(' ago', '') + '</span>' : '<span class="pill t">✎ Working</span>') : '<span class="pill" style="color:#b91c1c">Not started</span>';
          return '<tr><td>' + E(x.k.full_name || '(no name)') + (x.k.moved ? ' <span class="pill">now in another class</span>' : '') + '</td><td>' + stat + '</td><td>' + chips(r ? r.steps : []) + '</td><td>' + (r && r.total ? E(r.total.replace(/\s/g, '')) : '–') + '</td><td class="small">' + (r ? ago(r.last_saved) : '–') + '</td><td>' + (r ? '<button type="button" class="btn sm" data-w="' + x.k.id + '">View work</button>' : '') + '</td></tr>' +
            '<tr hidden data-wr="' + x.k.id + '"><td colspan="6"></td></tr>';
        }).join('') + '</table></div></section>' +
        (Object.keys(anonBy).length ? '<section class="panel tint"><b>Saved without signing in (' + Object.keys(anonBy).length + ')</b><p class="small muted">These students typed a class like "' + E(num) + '" but were not signed in, so their work is not linked to an account. Ask them to sign in before they save. Their work is still in <a href="#work">Lesson work</a>.</p><ul class="small">' +
          Object.keys(anonBy).map(function (k) { var a = anonBy[k]; return '<li><b>' + E(a.n) + '</b> (typed "' + E(a.c) + '") · steps ' + Object.keys(a.steps).sort().join(', ') + ' · ' + ago(a.t) + '</li>'; }).join('') + '</ul></section>' : '');
      body.querySelector('#lsel').onchange = function () { state.lesson = this.value; try { sessionStorage.setItem('bv-cl-' + c.id, state.lesson); } catch (e) {} state.reload(); };
      wireFilters(body, state);
      body.querySelectorAll('[data-w]').forEach(function (b) { b.onclick = function () {
        var sid = b.getAttribute('data-w'), tr = body.querySelector('[data-wr="' + sid + '"]'); if (!tr.hidden) { tr.hidden = true; return; }
        tr.hidden = false; tr.firstChild.innerHTML = '<span class="muted">Loading…</span>';
        Promise.all([S.db.from('lesson_work').select('id,step,answers,saved_at').eq('student_id', sid).eq('lesson', L).order('saved_at'),
          S.db.from('lesson_feedback').select('work_id,step,source,items,at').eq('student_id', sid).eq('lesson', L).order('at', { ascending: false })]).then(function (x) {
          var fbs = x[1].data || [];
          tr.firstChild.innerHTML = (x[0].data || []).map(function (s) {
            var f = fbs.filter(function (z) { return z.work_id === s.id; })[0] || fbs.filter(function (z) { return z.step === s.step; })[0];
            var written = /\bQ?\d+[a-z()]*\s*:/i.test(s.answers.replace(/^\[AUTO[^\]]*\]/, ''));
            return '<div style="margin:6px 0;border-bottom:1px solid var(--line,#e2e8f0);padding-bottom:6px"><b>Step ' + s.step + '</b> <span class="small muted">' + E(S.when(s.saved_at)) + '</span><pre style="white-space:pre-wrap;margin:2px 0;font-size:.85em">' + E(s.answers) + '</pre>' +
              (written ? '<div class="acts"><button type="button" class="btn sm" data-lf="' + s.id + '" data-m="rule">🔁 Re-mark (rules)</button><button type="button" class="btn sm" data-lf="' + s.id + '" data-m="ai">🤖 AI feedback</button></div>' : '') +
              '<div data-lfo="' + s.id + '">' + (f ? lfHtml(f) : '') + '</div></div>'; }).join('') || '<span class="muted">Nothing saved.</span>';
          tr.querySelectorAll('[data-lf]').forEach(function (bb) { bb.onclick = function () {
            var wid = bb.getAttribute('data-lf'), m = bb.getAttribute('data-m'), out = tr.querySelector('[data-lfo="' + wid + '"]'), t = bb.textContent;
            bb.disabled = true; bb.textContent = m === 'ai' ? 'Asking AI…' : 'Re-marking…';
            S.db.functions.invoke('lesson-feedback', { body: { work_id: wid, mode: m } }).then(function (r) {
              bb.disabled = false; bb.textContent = t; var d = r.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
              if (r.error || !d || !d.ok) { toast((d && d.error) || 'Feedback is not available right now.', true); return; }
              out.innerHTML = lfHtml({ source: d.source, items: d.items, at: new Date().toISOString() }) + (d.note ? '<p class="small muted">' + E(d.note) + '</p>' : '');
            }, function () { bb.disabled = false; bb.textContent = t; toast('Feedback is not available right now.', true); });
          }; });
        });
      }; });
    });
  }

  /* ---------- students & results ---------- */
  function students(p, args) {
    if (args[0]) return student(p, args[0]);
    var cls = sessionStorage.getItem('bv-cls') || '';
    S.db.from('class_overview').select('*').order('full_name').then(function (r) {
      var all = (r.data || []).filter(function (s) { return s.student_id !== ME.user.id && mine(s.student_id); });
      if (TEACH) { var cn0 = {}; CLASSES.forEach(function (c) { cn0[c.id] = c.name; }); all.forEach(function (s) { s.class_id = CLASS_OF[s.student_id] || s.class_id; s.class_name = cn0[s.class_id] || s.class_name; }); }
      function draw() {
        var list = all.filter(function (s) { return !cls || s.class_id === cls || (cls === 'none' && !s.class_id); });
        p.innerHTML = '<div class="row2"><select id="cf" aria-label="Class">' + classOpts(cls, 'All my students') + '<option value="none"' + (cls === 'none' ? ' selected' : '') + '>Not in a class</option></select><button class="btn sm" type="button" id="csv">Download CSV</button></div>' +
          (list.length ? '<div class="tablewrap"><table class="marks"><tr><th>Student</th><th>Class</th><th>Results</th><th>Average</th><th>Last activity</th><th>Access</th><th>Remove</th></tr>' + list.map(function (s) {
            return '<tr><td><a href="#students/' + s.student_id + '">' + E(s.full_name || '(no name)') + '</a>' + dashLink(s.student_id) + '</td><td>' + E(s.class_name || '–') + '</td><td>' + s.results + '</td><td>' + (s.percent == null ? '–' : s.percent + '%') + '</td><td class="small">' + E(S.when(s.last_result)) + '</td>' +
              '<td><button class="btn sm' + (s.approved ? '' : ' main') + '" type="button" data-ap="' + s.student_id + '" data-v="' + (!s.approved) + '">' + (s.approved ? 'Block' : '✓ Approve') + '</button></td>' +
              '<td>' + removeButtons(s.student_id, !!s.class_id) + '</td></tr>'; }).join('') + '</table></div>' : '<p class="emptybox">No students here yet.</p>');
        p.querySelector('#cf').onchange = function () { cls = this.value; try { sessionStorage.setItem('bv-cls', cls); } catch (e) {} draw(); };
        p.querySelectorAll('[data-ap]').forEach(function (b) { b.onclick = function () { var v = b.getAttribute('data-v') === 'true';
          S.db.from('profiles').update({ approved: v }).eq('id', b.getAttribute('data-ap')).then(function (r) { if (ok(r, v ? 'Access allowed' : 'Access blocked')) { all.forEach(function (s) { if (s.student_id === b.getAttribute('data-ap')) s.approved = v; }); draw(); } }); }; });
        wireRemove(p, function () { students(p, []); });
        p.querySelector('#csv').onclick = function () { var rows = [['Student', 'Class', 'Results', 'Average %', 'Last activity']].concat(list.map(function (s) { return [s.full_name, s.class_name || '', s.results, s.percent == null ? '' : s.percent, s.last_result || '']; }));
          var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n')], { type: 'text/csv' })); a.download = 'students.csv'; a.click(); };
      }
      draw();
    });
  }
  function student(p, sid) {
    Promise.all([S.db.from('profiles').select('*').eq('id', sid).maybeSingle(), S.db.from('student_results').select('*').eq('student_id', sid).order('recorded_at', { ascending: false }),
      S.db.from('learning_progress').select('percent,status, lessons(title)').eq('student_id', sid)]).then(function (x) {
      var pr = x[0].data; if (!pr) { p.innerHTML = '<p class="msg">Student not found, or not in one of your classes.</p>'; return; }
      p.innerHTML = '<p><a href="#students">← All students</a></p><section class="panel"><div class="row2"><h3>' + E(pr.full_name) + '</h3><span class="pill">' + (pr.approved ? 'Active' : 'Blocked') + '</span></div>' +
        '<div class="row2"><label class="f">Name<input id="sn" value="' + E(pr.full_name) + '"></label><label class="f">Class<select id="sc">' + classOpts(pr.class_id, '(no class)') + '</select></label><label class="f">Student number<input id="snum" value="' + E(pr.student_number || '') + '"></label><button class="btn sm" id="ss" type="button">Save</button></div></section>' +
        '<section class="panel"><h3>Lesson progress</h3>' + ((x[2].data || []).length ? x[2].data.map(function (l) { return '<div class="row2"><span class="small">' + E(l.lessons ? l.lessons.title : '') + '</span><span class="small muted">' + l.percent + '%</span></div><div class="bar"><i style="width:' + l.percent + '%"></i></div>'; }).join('') : '<p class="muted">No lessons opened yet.</p>') + '</section>' +
        '<section class="panel"><div class="row2"><h3 style="margin:0">📌 To-do list</h3>' + (pr.class_id ? '<button type="button" class="btn sm main" id="stw">＋ Set work for ' + E((pr.full_name || 'this student').split(' ')[0]) + '</button>' : '') + '</div><div id="stform"></div><div id="stlist" class="small muted">' + (pr.class_id ? 'Loading…' : 'Put this student in a class first.') + '</div></section>' +
        '<section class="panel" id="anbox"><p class="muted">Loading learning profile…</p></section>' + '<section class="panel" id="labbox"><p class="muted">Loading lab work…</p></section>' +
        '<section class="panel" id="pbox"><p class="muted">Loading parents…</p></section>' +
        '<section class="grp"><h3 class="sec-h">Results and feedback</h3>' + ((x[1].data || []).length ? x[1].data.map(function (r) {
          return '<article class="task" data-r="' + r.id + '"><div class="top2"><b>' + E(r.title) + '</b><span class="small muted">' + E(S.when(r.recorded_at)) + '</span></div>' +
            '<div class="row2"><label class="f">Score<input type="number" step="0.5" data-k="score" value="' + E(r.score == null ? '' : r.score) + '" style="max-width:90px"></label><span>/ ' + E(r.max_score) + '</span></div>' +
            '<label class="f">Teacher feedback<textarea rows="3" data-k="teacher_feedback">' + E(r.teacher_feedback || '') + '</textarea></label>' + (r.ai_feedback ? '<div class="fb ai"><h4>Automatic feedback</h4>' + BV.md(r.ai_feedback) + '</div>' : '') +
            '<div class="acts"><button class="btn sm main" type="button" data-a="save">Save feedback</button><button class="btn sm" type="button" data-a="auto" title="Write the automatic feedback again from the marks on each question">🔁 Refresh automatic feedback</button>' + (r.attempt_id ? '<a class="btn sm" href="#marking/' + r.attempt_id + '">Open answers</a>' : '') + '</div></article>'; }).join('') : '<p class="emptybox">No results yet.</p>') + '</section>';
      parentsBox(p, sid); studentTodo(p, sid, pr); studentAnalysis(p, sid, pr); labList(p.querySelector('#labbox'), { sid: sid }, true);
      p.querySelector('#ss').onclick = function () { S.db.from('profiles').update({ full_name: p.querySelector('#sn').value.trim(), class_id: p.querySelector('#sc').value || null, student_number: p.querySelector('#snum').value.trim() || null }).eq('id', sid).then(function (r) { ok(r, 'Student saved'); }); };
      p.querySelectorAll('[data-r]').forEach(function (a) { a.querySelector('[data-a=auto]').onclick = function () { var b = this; b.disabled = true; b.textContent = 'Writing feedback…';
        S.db.functions.invoke('result-feedback', { body: { result_id: a.getAttribute('data-r') } }).then(function (r) { var d = r.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
          if (r.error || !d || !d.ok) { b.disabled = false; b.textContent = '🔁 Refresh automatic feedback'; toast((d && d.error) || 'Could not write feedback right now.', true); return; }
          toast('Feedback written'); student(p, sid); }); }; });
      p.querySelectorAll('[data-r]').forEach(function (a) { a.querySelector('[data-a=save]').onclick = function () { var sc = a.querySelector('[data-k=score]').value;
        S.db.from('student_results').update({ score: sc === '' ? null : +sc, teacher_feedback: a.querySelector('[data-k=teacher_feedback]').value.trim() || null, updated_at: new Date().toISOString() }).eq('id', a.getAttribute('data-r')).then(function (r) { ok(r, 'Feedback saved'); }); }; });
    });
  }

  function studentTodo(p, sid, pr) {
    if (!pr.class_id) return;
    var c = CLASSES.filter(function (x) { return x.id === pr.class_id; })[0] || { id: pr.class_id, name: 'their class', programme: '' };
    var listBox = p.querySelector('#stlist');
    function load() {
      S.db.rpc('class_todo', { cls: pr.class_id }).then(function (r) {
        if (r.error) { listBox.textContent = /class_todo|schema cache/.test(r.error.message) ? 'To-do lists need database update 015.' : S.nice(r.error); return; }
        var mine = (r.data || []).filter(function (x) { return x.student_id === sid; }), ids = mine.map(function (x) { return x.assignment_id; });
        if (!ids.length) { listBox.textContent = 'Nothing set yet.'; return; }
        S.db.from('assignments').select('id,title,kind,due_at,everyone').in('id', ids).order('created_at', { ascending: false }).then(function (a) {
          var stt = {}; mine.forEach(function (x) { stt[x.assignment_id] = x.state; });
          listBox.className = 'small'; listBox.innerHTML = (a.data || []).map(function (w) { return '<div>' + { done: '✓', started: '✎', todo: '○' }[stt[w.id]] + ' ' + (ICON[w.kind] || '') + ' ' + E(w.title) + (w.everyone ? ' <span class="muted">(whole class)</span>' : '') + (w.due_at ? ' <span class="muted">· due ' + E(S.when(w.due_at)) + '</span>' : '') + '</div>'; }).join('');
        });
      });
    }
    load();
    var b = p.querySelector('#stw'); if (b) b.onclick = function () { roster(pr.class_id).then(function (kids) { assignForm(p.querySelector('#stform'), c, kids, [sid], load); }); };
  }
  /* parents linked to this student: the private parent code, new codes, and removing a link */
  function parentsBox(p, sid) {
    var box = p.querySelector('#pbox'); if (!box) return;
    Promise.all([
      S.db.from('parent_links').select('parent_id, profiles!parent_id(full_name)').eq('student_id', sid),
      S.db.from('student_parent_codes').select('code').eq('student_id', sid).maybeSingle()
    ]).then(function (x) {
      if (x[0].error) throw x[0].error;
      var links = x[0].data || [], code = x[1].data && x[1].data.code;
      box.innerHTML = '<h3>Parents</h3>' +
        '<p class="small muted">A parent signs up with this code (Create a parent account) or adds it on their dashboard. They can see this student\'s marks, lesson progress and your feedback, and cannot change anything. Making a new code stops the old one working.</p>' +
        '<div class="row2"><span class="small">Parent code</span><b style="font-size:1.3rem;letter-spacing:.15em">' + E(code || '–') + '</b><button class="btn sm" type="button" id="pcr">New code</button></div>' +
        (links.length ? '<div class="tablewrap"><table class="marks"><tr><th>Linked parent</th><th></th></tr>' + links.map(function (l) {
          return '<tr><td>' + E(l.profiles ? l.profiles.full_name : 'Parent') + '</td><td><button class="btn sm" type="button" data-pu="' + E(l.parent_id) + '">Remove link</button></td></tr>';
        }).join('') + '</table></div>' : '<p class="muted">No parent linked yet.</p>');
      box.querySelector('#pcr').onclick = function () {
        if (!this.dataset.sure) { this.dataset.sure = 1; this.textContent = 'Click again to replace the code'; return; }
        S.db.rpc('reset_parent_code', { sid: sid }).then(function (r) { if (ok(r, 'New parent code made')) parentsBox(p, sid); });
      };
      box.querySelectorAll('[data-pu]').forEach(function (b) {
        b.onclick = function () {
          if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Click again to remove'; return; }
          S.db.from('parent_links').delete().eq('parent_id', b.getAttribute('data-pu')).eq('student_id', sid).then(function (r) { if (ok(r, 'Link removed')) parentsBox(p, sid); });
        };
      });
    }).catch(function (e) { box.innerHTML = '<h3>Parents</h3><p class="msg">' + E(S.nice(e)) + '</p>'; });
  }

  /* ---------- quizzes ---------- */
  function quizzes(p, args) {
    if (args[0] === 'import') return quizImport(p);
    if (args[0] && args[1] === 'preview') return quizPreview(p, args[0]);
    if (args[0]) return quizEdit(p, args[0]);
    S.db.from('quizzes').select('id,title,published,due_at,show_results,category,created_by,topic_id' + (QSUBJ ? ',subject' : '') + ', quiz_classes(class_id), quiz_questions(question_id)').is('deleted_at', null).neq('category', 'lesson').order('created_at', { ascending: false }).then(function (r) {
      if (TEACH) r.data = (r.data || []).filter(function (q) { return (!ME.admin && q.created_by === ME.user.id) || q.quiz_classes.some(function (x) { return CLASSES.some(function (c) { return c.id === x.class_id; }); }); });
      r.data = (r.data || []).filter(function (q) { return !(/^Practice: /.test(q.title || '') && !(q.quiz_classes || []).length && q.created_by !== ME.user.id); });   // students' own practice sets (migration 039) stay out of this list
      var cn = {}; CLASSES.forEach(function (c) { cn[c.id] = c.name; });
      // Grades 6 to 10: every quiz and exam belongs to Biology, Chemistry or Physics; the buttons show one subject at a time
      var rows = r.data || [], sOf = function (q) { return mypQuiz(q) ? quizSubj(q) : ''; }, any = rows.some(mypQuiz), pick = any ? (quizzes.pick || '') : '';
      var shown = rows.filter(function (q) { return !pick || sOf(q) === pick; });
      p.innerHTML = '<div class="acts"><a class="btn main sm" href="/build/#new/quiz">🧰 Build exam-style questions</a><a class="btn main sm" href="/build/#new/exam" style="background:#db2777;border-color:#db2777">🎓 Build an examination</a><a class="btn sm" href="#quizzes/import">⬆ Import from PDF or Word</a><a class="btn sm" href="/build/">📚 My assessments and lessons</a></div>' +
        '<p class="small muted">📄 <b>Mark scheme</b> opens a printable mark scheme for that quiz or exam: correct answers, mark points, model answers and level descriptors. Use Print → Save as PDF to keep or share it.</p>' +
        (any ? '<div class="row2" style="justify-content:flex-start"><span class="small muted">Grades 6 to 10 by subject:</span><button type="button" class="btn sm' + (pick ? '' : ' main') + '" data-qs="">All quizzes and exams</button>' +
          BV.subj.list.map(function (x) { return '<button type="button" class="btn sm' + (pick === x[0] ? ' main' : '') + '" data-qs="' + x[0] + '"' + (pick === x[0] ? ' style="background:' + x[1] + ';border-color:' + x[1] + ';color:#fff"' : '') + '>' + x[2] + ' ' + x[0] + ' (' + rows.filter(function (q) { return sOf(q) === x[0]; }).length + ')</button>'; }).join('') + '</div>' : '') +
        (shown.length ? '<div class="tablewrap"><table class="marks"><tr><th>Title</th>' + (any ? '<th>Subject</th>' : '') + '<th>Type</th><th>Questions</th><th>Classes</th><th>Due</th><th>Results</th><th>Status</th><th></th></tr>' + shown.map(function (q) {
          return '<tr><td><a href="/build/#edit/' + q.id + '" title="Edit the questions in the builder">' + E(q.title) + '</a> <a class="small" href="#quizzes/' + q.id + '" title="Dates, classes, results and exam security">⚙</a></td>' + (any ? '<td>' + (sOf(q) ? BV.subj.tag(sOf(q)) : mypQuiz(q) ? '<span class="small muted">not set</span>' : '') + '</td>' : '') + '<td>' + (q.category === 'exam' ? '🧪 Exam' : '📝 Quiz') + '</td><td>' + q.quiz_questions.length + '</td><td class="small">' + E(q.quiz_classes.map(function (c) { return cn[c.class_id] || '…'; }).join(', ') || '–') + '</td><td class="small">' + E(S.when(q.due_at) || '–') + '</td><td class="small">' + (q.show_results ? 'shown at once' : 'after you release') + '</td><td>' + (q.published ? '<span class="pill">Published</span>' : 'Draft') + '</td><td><a class="btn sm" href="#quizzes/' + q.id + '/preview">👁 Preview</a> <button type="button" class="btn sm" data-ms="' + q.id + '">📄 Mark scheme</button>' + (ME.admin ? S.del('quiz', q.id, q.title) : '') + '</td></tr>'; }).join('') + '</table></div>' : '<p class="emptybox">' + (pick ? 'No ' + E(pick) + ' quizzes or exams yet.' : 'No quizzes yet. Import a question paper or make one from scratch.') + '</p>');
      wireMS(p);
      p.querySelectorAll('[data-qs]').forEach(function (b) { b.onclick = function () { quizzes.pick = b.getAttribute('data-qs'); quizzes(p, args); }; });
      if (BV.findBox) BV.findBox(p, 'table.marks tr:not(:first-child)', null, 'Find a quiz or exam…');
    });
  }

  /* import a question paper (and its mark scheme) from PDF or Word */
  function quizImport(p) {
    var Q = window.BVQ, list = [];
    p.innerHTML = '<p><a href="#quizzes">← All quizzes</a></p><section class="panel grp"><h3>Import a question paper</h3>' +
      '<p class="small muted">Upload a PDF or Word (.docx) file. The questions are read in your browser and turned into an interactive quiz: lettered options become click-to-choose answers, everything else becomes a typed answer. You check and fix everything before saving. Files are not uploaded anywhere.</p>' +
      '<div class="row2"><label class="f" style="flex:1">Title<input id="it" placeholder="e.g. Grade 9 DNA test"></label><label class="f">Make it a<select id="ic"><option value="quiz">Quiz (Quiz centre)</option><option value="exam">Exam (Online exams page)</option></select></label></div>' +
      '<div class="two"><label class="f">Question paper (PDF or .docx)<input id="if" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"></label>' +
      '<label class="f">Mark scheme or rubric (optional, PDF or .docx)<input id="im" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"></label></div>' +
      '<details><summary class="small">No file? Paste the questions (and mark scheme) instead</summary><div class="two"><label class="f">Questions<textarea id="ip" rows="8" placeholder="1. Which base pairs with adenine?\nA. Guanine\nB. Thymine\nC. Uracil\nD. Cytosine\n2. (a) State the monomer of DNA. [1]"></textarea></label>' +
      '<label class="f">Mark scheme<textarea id="ips" rows="8" placeholder="1 B\n2 (a) nucleotide"></textarea></label></div></details>' +
      '<div class="acts"><button class="btn main sm" type="button" id="ir">Read questions</button></div><p class="msg" id="imsg" role="status"></p></section><div id="iout" class="grp"></div>';
    var msg = p.querySelector('#imsg'), out = p.querySelector('#iout');
    p.querySelector('#if').onchange = function () { var f = this.files[0]; if (f && !p.querySelector('#it').value) p.querySelector('#it').value = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '); };
    p.querySelector('#ir').onclick = function () {
      var f = p.querySelector('#if').files[0], m = p.querySelector('#im').files[0], pasted = p.querySelector('#ip').value.trim(), pastedMs = p.querySelector('#ips').value.trim();
      if (!f && !pasted) { msg.className = 'msg'; msg.textContent = 'Choose the question paper file first (or paste the questions).'; return; }
      msg.className = 'msg ok'; msg.textContent = 'Reading…';
      Promise.all([f ? Q.readFile(f) : Promise.resolve(pasted.split('\n')), m ? Q.readFile(m) : Promise.resolve(pastedMs ? pastedMs.split('\n') : null)]).then(function (x) {
        list = Q.parsePaper(x[0]);
        if (!list.length) throw new Error('No numbered questions were found. Questions should start with a number such as "1." or "Question 1". You can paste the text and fix the numbering.');
        var matched = x[1] ? Q.applyScheme(list, Q.parseScheme(x[1])) : 0;
        var mc = list.filter(function (q) { return q.kind !== 'short'; }).length;
        msg.className = 'msg ok'; msg.textContent = 'Found ' + list.length + ' questions (' + mc + ' multiple choice, ' + (list.length - mc) + ' written)' + (x[1] ? '; mark scheme matched ' + matched + ' of them' : '') + (list.filter(function (q) { return q.image; }).length ? '; ' + list.filter(function (q) { return q.image; }).length + ' with a picture from your file' : '') + '. Check them below (📷 adds a picture or diagram to any question), then save.';
        draw();
      }).catch(function (e) { msg.className = 'msg'; msg.textContent = S.nice(e); });
    };
    function sync() { list = [].map.call(out.querySelectorAll('.qe'), Q.readCard); }
    function draw() {
      var need = list.filter(function (q) { return q.kind !== 'short' && q.correct < 0; }).length, noScheme = list.filter(function (q) { return q.kind === 'short' && !q.scheme && !q.rubric; }).length;
      out.innerHTML = '<div class="row2 sticky-top"><b>' + list.length + ' questions · ' + list.reduce(function (a, q) { return a + q.marks; }, 0) + ' marks</b><div class="acts"><button class="btn sm" type="button" id="iadd">＋ Add a question</button><button class="btn main sm" type="button" id="isave">Save as a draft quiz</button></div></div>' +
        (need ? '<p class="panel tint small">⚠ ' + need + ' multiple-choice question' + (need > 1 ? 's need' : ' needs') + ' the correct answer ticked (A, B, C or D). Attach the mark scheme above to fill them in automatically.</p>' : '') +
        (noScheme ? '<p class="panel tint small">' + noScheme + ' written question' + (noScheme > 1 ? 's have' : ' has') + ' no mark scheme yet. Add marking points or a rubric for automatic marking, or leave blank and mark by hand.</p>' : '') +
        list.map(function (q, i) { return Q.card(q, i, { join: i > 0 }); }).join('');
      out.querySelectorAll('.qe').forEach(function (el) {
        Q.wireCard(el);
        el.querySelector('[data-act=del]').onclick = function () { sync(); list.splice(+el.dataset.i, 1); draw(); };
        var j = el.querySelector('[data-act=join]'); if (j) j.onclick = function () { sync(); var i = +el.dataset.i, a = list[i - 1], b = list[i]; a.prompt += '\n' + b.prompt; if (b.options.length) { a.options = a.options.concat(b.options); a.kind = a.kind === 'short' ? 'mcq' : a.kind; } a.scheme = [a.scheme, b.scheme].filter(Boolean).join('\n'); if (!a.image) a.image = b.image; list.splice(i, 1); draw(); };
      });
      out.querySelector('#iadd').onclick = function () { sync(); list.push({ ref: String(list.length + 1), kind: 'mcq', prompt: '', options: [], correct: -1, marks: 1, scheme: '', rubric: '', explanation: '', image: '' }); draw(); out.lastElementChild.scrollIntoView({ behavior: 'smooth' }); };
      out.querySelector('#isave').onclick = function () {
        sync(); var bad = list.map(Q.check).filter(Boolean)[0]; if (bad) { toast(bad, true); return; }
        var title = p.querySelector('#it').value.trim() || 'Imported quiz', btn = this; btn.disabled = true; btn.textContent = 'Saving…';
        S.db.from('quizzes').insert({ title: title, category: p.querySelector('#ic').value, show_results: false, published: false, max_attempts: 1, time_limit_minutes: p.querySelector('#ic').value === 'exam' ? 60 : null }).select('id').single().then(function (r) {
          if (r.error) throw r.error; var qid = r.data.id;
          return Q.save(S.db, list).then(function (ids) { return S.db.from('quiz_questions').insert(ids.map(function (id, k) { return { quiz_id: qid, question_id: id, position: k + 1 }; })); })
            .then(function (r2) { if (r2.error) throw r2.error; toast((p.querySelector('#ic').value === 'exam' ? 'Exam' : 'Quiz') + ' saved as a draft. Set the classes and time, then publish.'); location.hash = 'quizzes/' + qid; });
        }).catch(function (e) { btn.disabled = false; btn.textContent = 'Save as a draft quiz'; toast(S.nice(e), true); });
      };
    }
  }

  function quizEdit(p, id) {
    var Q = window.BVQ, isNew = id === 'new';
    Promise.all([isNew ? Promise.resolve({ data: { title: '', max_attempts: 1, show_results: false, published: false } }) : S.db.from('quizzes').select('*').eq('id', id).maybeSingle(),
      isNew ? Promise.resolve({ data: [] }) : S.db.from('quiz_classes').select('class_id').eq('quiz_id', id),
      isNew ? Promise.resolve({ data: [] }) : S.db.from('quiz_questions').select('position, questions(*, question_answers(*))').eq('quiz_id', id).order('position')]).then(function (x) {
      var q = x[0].data || {}, set = (x[1].data || []).map(function (c) { return c.class_id; }), qq = x[2].data || [];
      var lastN = 0, qs = qq.map(function (z, k) { var o = z.questions || {}, an = o.question_answers || {}; if (Array.isArray(an)) an = an[0] || {};
        var pm = /^(\d+)\s*(\([a-h]\)(?:\s*\([ivx]+\))?)/i.exec(o.prompt || ''), ref = pm ? pm[1] + pm[2].replace(/\s/g, '') : String(lastN + 1); lastN = pm ? +pm[1] : lastN + 1;
        return { id: o.id, ref: ref, kind: o.kind, prompt: o.prompt, options: o.options || [], correct: an.correct_option == null ? -1 : an.correct_option, marks: o.marks, scheme: an.mark_scheme || an.model_answer || '', rubric: an.rubric || '', explanation: an.explanation || '', image: o.image_url || '', fb: an }; });
      p.innerHTML = '<p><a href="#quizzes">← All quizzes and exams</a></p><form class="panel grp" id="qf"><h3>' + (isNew ? 'New quiz or exam' : 'Settings') + '</h3>' +
        '<div class="row2"><label class="f" style="flex:1">Title<input id="t" required value="' + E(q.title) + '"></label><label class="f">Type<select id="cat"><option value="quiz"' + (q.category !== 'exam' ? ' selected' : '') + '>Quiz (Quiz centre)</option><option value="exam"' + (q.category === 'exam' ? ' selected' : '') + '>Exam (Online exams page)</option></select></label></div><label class="f">Instructions<textarea id="ins" rows="2">' + E(q.instructions || '') + '</textarea></label>' +
        '<div class="row2"><label class="f">Topic<select id="tp">' + topicOpts(q.topic_id) + '</select></label>' +
          (QSUBJ ? '<label class="f">Subject (Grades 6 to 10)<select id="sj" title="Grade 6 to 10 science is kept in three subjects. Students see this quiz or exam only under the subject chosen here."><option value="">Work it out from the topic and title</option>' +
            BV.subj.list.map(function (x) { return '<option value="' + x[0] + '"' + (q.subject === x[0] ? ' selected' : '') + '>' + x[2] + ' ' + x[0] + '</option>'; }).join('') + '</select></label>' : '') + '<label class="f">Time limit (minutes, blank = none)<input id="tl" type="number" min="1" value="' + E(q.time_limit_minutes || '') + '"></label><label class="f">Attempts<input id="ma" type="number" min="1" value="' + E(q.max_attempts || 1) + '"></label></div>' +
        '<div class="row2"><label class="f">Opens<input id="op" type="datetime-local" value="' + dt(q.opens_at) + '"></label><label class="f">Due<input id="du" type="datetime-local" value="' + dt(q.due_at) + '"></label></div>' +
        '<fieldset><legend>Set for classes</legend>' + (CLASSES.length ? CLASSES.map(function (c) { return '<label class="chk"><input type="checkbox" name="cl" value="' + c.id + '"' + (set.indexOf(c.id) >= 0 ? ' checked' : '') + '> ' + E(c.name) + '</label>'; }).join('') : '<p class="small">Create a class first.</p>') + '</fieldset>' +
        '<fieldset><legend>Results</legend><label class="chk"><input type="radio" name="sr" value="hold"' + (q.show_results ? '' : ' checked') + '> I check and release results (recommended for written answers)</label>' +
        '<label class="chk"><input type="radio" name="sr" value="show"' + (q.show_results ? ' checked' : '') + '> Show multiple-choice scores straight after submitting</label></fieldset>' +
        '<fieldset><legend>Marking and feedback</legend><label class="f">How written answers are marked and given feedback<select id="fm">' +
          [['hybrid', 'Hybrid (recommended): rules first, AI only when the rules cannot decide'], ['rule', 'Rules only: no AI (your mark scheme, keywords and explanations)'], ['ai', 'AI for every written answer (rules still mark multiple choice)']]
            .map(function (o) { return '<option value="' + o[0] + '"' + ((q.feedback_mode || 'hybrid') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
          '<p class="small muted">Multiple-choice and true/false questions are always marked by the rules, never by AI. AI marks are suggestions: you confirm them when marking. Everything still works if AI is unavailable. You can change the setting for single questions in each question\'s Feedback section.</p></fieldset>' +
        (function () { var g = q.integrity || {}, ex = q.category === 'exam', m = g.mode || (ex ? 'autosubmit' : 'warn');
          return '<fieldset><legend>Exam security</legend><p class="small muted">A website cannot fully stop students switching tabs or apps, but it can see every switch. Each one is recorded and shown on the class page and in marking.</p>' +
          '<div class="row2"><label class="f">When a student leaves the page<select id="xm">' + [['record', 'Just record it'], ['warn', 'Warn the student and record it'], ['autosubmit', 'Warn, then hand it in automatically']].map(function (o) { return '<option value="' + o[0] + '"' + (m === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
          '<label class="f">Hand in after this many switches<input id="xn" type="number" min="1" max="20" value="' + E(g.max || 3) + '"></label></div>' +
          '<label class="chk"><input type="checkbox" id="xf"' + (g.fullscreen === false ? '' : ' checked') + '> Full screen: questions are hidden whenever the student leaves full screen (computers; phones cannot do full screen)</label>' +
          '<label class="chk"><input type="checkbox" id="xs"' + (g.seb ? ' checked' : '') + '> Safe Exam Browser only (lockdown): it will not open in an ordinary browser. Students cannot switch to other apps, websites or screenshots until they hand in.</label>' +
          '<div class="xseb" style="display:grid;gap:8px;padding-left:26px">' +
          '<div class="row2"><label class="f">Quit password (only you can close Safe Exam Browser early; leave blank for none)<input id="xq" type="password" autocomplete="new-password" placeholder="' + (g.quit_hash ? 'Password set: type a new one to change it' : 'e.g. a word only you know') + '"></label>' +
          (g.quit_hash ? '<label class="chk"><input type="checkbox" id="xqc"> Remove the quit password</label>' : '') + '</div>' +
          '<label class="chk"><input type="checkbox" id="xb"' + (g.block_web === false ? '' : ' checked') + '> Block all other websites inside Safe Exam Browser</label>' +
          (isNew ? '<p class="small muted">Save first; then you can download the Safe Exam Browser file for this ' + (ex ? 'exam' : 'quiz') + '.</p>' :
            '<ol class="small" style="margin:0;padding-left:18px"><li>Save, then <button type="button" class="btn sm" id="xsf">⬇ Download the Safe Exam Browser file</button> and share it with the class (e.g. on Google Classroom). Students install <a href="https://safeexambrowser.org/download_en.html" target="_blank" rel="noopener">Safe Exam Browser</a> (free) and double-click the file.</li>' +
            '<li>Open the same file yourself, sign in, and press <b>Register this set-up</b>. From then on only that file is accepted. <span class="muted">Registered set-ups: ' + ((g.seb_keys || []).length) + '</span>' + ((g.seb_keys || []).length ? ' <button type="button" class="btn sm" id="xsr">Clear registered set-ups</button>' : '') + '</li>' +
            '<li>Try it on one student computer before the real exam.</li></ol>') + '</div></fieldset>'; })() +
        '<label class="chk"><input type="checkbox" id="pb"' + (q.published ? ' checked' : '') + '> Published (students in the chosen classes can see it)</label>' +
        '<div class="acts"><button class="btn main sm" type="submit">Save quiz</button>' + (isNew ? '' : '<a class="btn sm" href="#quizzes/' + id + '/preview">👁 Preview as a student</a><a class="btn sm" href="#marking">Marking</a><button class="btn sm" type="button" id="del">Delete quiz</button>') + '</div></form>' +
        (isNew ? '' : '<section class="panel grp" id="msbox"><h3>Mark scheme</h3><p class="small muted">Attach the mark scheme and the answers are filled in for you: the correct letter (A, B, C, D) for each multiple-choice question, and the marking points for written questions. Check the question numbers match, then press Save question changes.</p>' +
          '<div class="row2"><label class="f" style="flex:1">Mark scheme (PDF, Word or text)<input id="msf" type="file" accept=".pdf,.docx,.txt,.xlsx,.csv,application/pdf"></label><button class="btn main sm" type="button" id="msa">Apply mark scheme</button></div>' +
          '<details><summary class="small">No file? Paste it instead</summary><textarea id="msp" rows="6" placeholder="1 B\n2 D\n3 C\n4 (a) nucleotide\n4 (b) hydrogen bonds; complementary base pairing"></textarea></details><p class="msg" id="msm" role="status"></p></section>') +
        (isNew ? '<p class="small muted">Save the quiz first, then add questions.</p>' : '<section class="grp"><div class="row2"><h3 class="sec-h">Questions (' + qs.length + ', ' + qs.reduce(function (a, z) { return a + (z.marks || 0); }, 0) + ' marks)</h3><button class="btn main sm" type="button" id="qsave">Save question changes</button></div>' +
          '<div id="qlist" class="grp">' + qs.map(function (z, i) { return Q.card(z, i, { delLabel: 'Remove' }); }).join('') + '</div>' +
          '<div class="acts"><button class="btn sm" type="button" id="qadd">＋ Add a question</button></div></section>');
      var xsr = p.querySelector('#xsr');
      if (xsr) xsr.onclick = function () { var ng = Object.assign({}, q.integrity || {}, { seb_keys: [] });
        S.db.from('quizzes').update({ integrity: ng }).eq('id', id).then(function (r) { if (ok(r, 'Registered set-ups cleared. Open the new settings file in Safe Exam Browser and register it.')) { q.integrity = ng; xsr.remove(); } }); };
      var xsf = p.querySelector('#xsf');
      if (xsf) xsf.onclick = function () {   // a Safe Exam Browser settings file that opens this quiz or exam directly
        var url = location.origin + (p.querySelector('#cat').value === 'exam' ? '/exams/' : '/quizzes/') + '#' + id, gi = q.integrity || {};
        var hosts = ['biosciencevista.com', '*.biosciencevista.com', '*.supabase.co', 'commons.wikimedia.org', 'upload.wikimedia.org', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'];
        var filt = gi.block_web === false ? '<key>URLFilterEnable</key><false/>' : '<key>URLFilterEnable</key><true/><key>URLFilterEnableContentFilter</key><false/><key>URLFilterRules</key><array>' +
          hosts.map(function (h) { return '<dict><key>active</key><true/><key>regex</key><false/><key>expression</key><string>' + h + '</string><key>action</key><integer>1</integer></dict>'; }).join('') + '</array>';
        var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict>' +
          '<key>originatorVersion</key><string>BioscienceVista</string><key>startURL</key><string>' + E(url) + '</string><key>sendBrowserExamKey</key><true/>' +
          (gi.quit_hash ? '<key>hashedQuitPassword</key><string>' + gi.quit_hash + '</string>' : '') +
          '<key>allowQuit</key><true/><key>quitURL</key><string>' + E(location.origin) + '/?seb=quit</string><key>quitURLConfirm</key><true/><key>browserViewMode</key><integer>1</integer>' +
          '<key>enableBrowserWindowToolbar</key><true/><key>browserWindowAllowReload</key><true/><key>newBrowserWindowByLinkPolicy</key><integer>1</integer><key>newBrowserWindowByScriptPolicy</key><integer>1</integer>' +
          '<key>allowDownUploads</key><false/><key>allowPreferencesWindow</key><false/><key>allowSpellCheck</key><false/><key>enableZoomPage</key><true/><key>enableZoomText</key><true/>' +
          '<key>allowedDisplaysMaxNumber</key><integer>1</integer><key>allowScreenSharing</key><false/><key>enablePrintScreen</key><false/>' + filt + '</dict></plist>\n';
        var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([xml], { type: 'application/seb' }));
        a.download = (p.querySelector('#t').value.trim() || 'exam').replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-').slice(0, 60) + '.seb'; document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      };
      p.querySelector('#qf').onsubmit = function (e) { e.preventDefault();
        var row = { title: p.querySelector('#t').value.trim(), category: p.querySelector('#cat').value, instructions: p.querySelector('#ins').value.trim() || null, topic_id: p.querySelector('#tp').value || null, time_limit_minutes: +p.querySelector('#tl').value || null,
          max_attempts: Math.max(1, +p.querySelector('#ma').value || 1), opens_at: iso(p.querySelector('#op').value), due_at: iso(p.querySelector('#du').value), show_results: (p.querySelector('[name=sr]:checked') || {}).value === 'show', published: p.querySelector('#pb').checked,
          feedback_mode: p.querySelector('#fm').value,
          integrity: Object.assign({}, q.integrity || {}, { mode: p.querySelector('#xm').value, max: Math.max(1, +p.querySelector('#xn').value || 3), fullscreen: p.querySelector('#xf').checked, seb: p.querySelector('#xs').checked, block_web: p.querySelector('#xb').checked }) };
        var cls = [].map.call(p.querySelectorAll('[name=cl]:checked'), function (c) { return c.value; });
        if (p.querySelector('#sj')) row.subject = p.querySelector('#sj').value || null;   // Grades 6 to 10: Biology, Chemistry or Physics (migration 036)
        if (row.published && !cls.length) { toast('Choose at least one class before publishing.', true); return; }
        if (row.published && !isNew && !qs.length) { toast('Add questions before publishing.', true); return; }
        var qpw = p.querySelector('#xq').value, qclr = p.querySelector('#xqc') && p.querySelector('#xqc').checked;
        if (qclr) delete row.integrity.quit_hash;
        var hashed = qpw ? crypto.subtle.digest('SHA-256', new TextEncoder().encode(qpw)).then(function (b) { row.integrity.quit_hash = Array.from(new Uint8Array(b)).map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }) : Promise.resolve();
        var put = function (rw) { return isNew ? S.db.from('quizzes').insert(rw).select('id').single() : S.db.from('quizzes').update(rw).eq('id', id).select('id').single(); };
        hashed.then(function () { return put(row); }).then(function (r) {   // before database update 012 there is no integrity column: save the rest and say so
          if (r.error && /feedback_mode/.test(r.error.message || '')) { delete row.feedback_mode; toast('The feedback setting needs database update 013; the other settings were saved.', true); return put(row); }
          if (r.error && /integrity/.test(r.error.message || '')) { delete row.integrity; toast('Exam security settings need database update 012; the other settings were saved.', true); return put(row); }
          return r;
        }).then(function (r) {
          if (!ok(r)) return; var qid = r.data.id;
          S.db.from('quiz_classes').delete().eq('quiz_id', qid).then(function () { return cls.length ? S.db.from('quiz_classes').insert(cls.map(function (c) { return { quiz_id: qid, class_id: c }; })) : { error: null }; })
            .then(function (r2) { if (ok(r2, 'Quiz saved')) { if (isNew) location.hash = 'quizzes/' + qid; else quizEdit(p, qid); } });
        }); };
      var del = p.querySelector('#del'); if (del) del.onclick = function () { if (del.dataset.sure) { S.db.rpc('bin_item', { kind: 'quiz', item: id }).then(function (r) { if (ok(r, 'Quiz moved to the 🗑 Bin (restore it within 30 days)')) location.hash = 'quizzes'; }); } else { del.dataset.sure = 1; del.textContent = 'Click again to move it to the bin'; } };
      apLayout(p, isNew);
      if (isNew) return;
      var listEl = p.querySelector('#qlist'), removed = [];
      function wire(el) { Q.wireCard(el); el.querySelector('[data-act=del]').onclick = function () { if (el.dataset.id) removed.push(el.dataset.id); el.remove(); }; }
      listEl.querySelectorAll('.qe').forEach(wire);
      p.querySelector('#msa').onclick = function () {   // fill answers from an attached or pasted mark scheme
        var f = p.querySelector('#msf').files[0], pasted = p.querySelector('#msp').value.trim(), m = p.querySelector('#msm');
        if (!f && !pasted) { m.className = 'msg'; m.textContent = 'Choose the mark scheme file first, or paste it.'; return; }
        m.className = 'msg ok'; m.textContent = 'Reading the mark scheme…';
        (f ? Q.readFile(f) : Promise.resolve(pasted.split('\n'))).then(function (lines) {
          var cards = [].map.call(listEl.querySelectorAll('.qe'), Q.readCard);
          cards.forEach(function (c, k) { if (!c.ref) c.ref = String(k + 1); });
          var used = Q.applyScheme(cards, Q.parseScheme(lines)), mc = cards.filter(function (c) { return c.kind !== 'short' && c.kind !== 'info'; }), set = mc.filter(function (c) { return c.correct >= 0; }).length;
          listEl.innerHTML = cards.map(function (c, k) { return Q.card(c, k, { delLabel: 'Remove' }); }).join(''); listEl.querySelectorAll('.qe').forEach(wire);
          m.className = used ? 'msg ok' : 'msg'; m.textContent = used ? 'Matched ' + used + ' of ' + cards.length + ' questions. Multiple choice with an answer ticked: ' + set + ' of ' + mc.length + '. Check them, then press Save question changes.' : 'No question numbers in the mark scheme matched these questions. Check the Number box on each question (for example 1, 2, 3(a)).';
        }).catch(function (e) { m.className = 'msg'; m.textContent = S.nice(e); });
      };
      p.querySelector('#qadd').onclick = function () { var d = document.createElement('div'); d.innerHTML = Q.card({ kind: 'mcq', prompt: '', options: [], correct: -1, marks: 1 }, listEl.children.length); var el = d.firstChild; listEl.appendChild(el); wire(el); el.querySelector('[data-f=prompt]').focus(); };
      p.querySelector('#qsave').onclick = function () {
        var cards = [].map.call(listEl.querySelectorAll('.qe'), Q.readCard), bad = cards.map(Q.check).filter(Boolean)[0]; if (bad) { toast(bad, true); return; }
        var btn = this; btn.disabled = true; Q.fbError = null;
        Q.save(S.db, cards).then(function (ids) {
          return S.db.from('quiz_questions').delete().eq('quiz_id', id).then(function () { return S.db.from('quiz_questions').insert(ids.map(function (qid, k) { return { quiz_id: id, question_id: qid, position: k + 1 }; })); });
        }).then(function (r) { if (r.error) throw r.error; toast(Q.fbError ? 'Questions saved. ' + Q.fbError : 'Questions saved', !!Q.fbError); quizEdit(p, id); }).catch(function (e) { btn.disabled = false; toast(S.nice(e), true); });
      };
    });
  }

  /* ---------- lesson builder: a built lesson as one HTML file (the teacher's own lesson; opens in any browser, works offline) ---------- */
  function lessonHtmlFile(id) {
    return Promise.all([S.db.from('quizzes').select('id,title,instructions').eq('id', id).maybeSingle(),
      S.db.from('quiz_questions').select('position, questions(id,kind,prompt,options,marks,image_url,section, question_answers(correct_option,model_answer,mark_scheme,explanation))').eq('quiz_id', id).order('position')]).then(function (x) {
      var q = x[0].data; if (!q) throw new Error('That lesson was not found.');
      var STEPS = ['Question', 'Explore', 'Test', 'Explain', 'Challenge', 'Reflect'], by = {}, keys = {};
      (x[1].data || []).forEach(function (z) { var o = z.questions || {}, a = o.question_answers || {}; if (Array.isArray(a)) a = a[0] || {}; var sec = STEPS.indexOf(o.section) >= 0 ? o.section : 'Explore'; (by[sec] = by[sec] || []).push(o);
        keys[o.id] = { c: a.correct_option, m: a.model_answer || a.mark_scheme || '', e: a.explanation || '' }; });
      var author = (ME.profile && ME.profile.full_name) || 'the teacher', n = 0;
      var body = STEPS.filter(function (st) { return by[st]; }).map(function (st, si) {
        return '<section class="step" data-step="' + si + '"><h2><span>STEP ' + (si + 1) + '</span> ' + E(st) + '</h2>' + by[st].map(function (o) {
          var pic = o.image_url ? '<img src="' + E(o.image_url) + '" alt="Picture for this part of the lesson">' : '', txt = BVT.rich(o.prompt, false);
          if (o.kind === 'info') return '<div class="note">' + txt + pic + '</div>';
          n++; var marks = o.marks ? ' <em>[' + o.marks + ']</em>' : '';
          return '<div class="q" data-q="' + o.id + '" data-kind="' + E(o.kind) + '"><div class="ql"><b>' + n + '.</b> ' + txt + marks + '</div>' + pic +
            (o.kind === 'short' ? '<textarea rows="' + (o.marks >= 3 ? 6 : 3) + '" placeholder="Type your answer"></textarea>' :
              (o.options || []).map(function (op, j) { return '<label class="opt"><input type="radio" name="q' + o.id + '" value="' + j + '"> <b>' + 'ABCDEFGH'.charAt(j) + '.</b> ' + E(op) + '</label>'; }).join('')) + '<div class="fb" hidden></div></div>'; }).join('') +
          '<p><button type="button" class="check">Check this step</button> <span class="score"></span></p></section>'; }).join('');
      var data = btoa(unescape(encodeURIComponent(JSON.stringify(keys))));
      var css = 'body{font:17px/1.6 system-ui,Segoe UI,Arial,sans-serif;margin:0;background:#f5f3ff;color:#172033}main{max-width:860px;margin:0 auto;padding:16px}header{background:linear-gradient(135deg,#4338ca,#c026d3 60%,#f97316);color:#fff;padding:26px 16px;border-radius:0 0 18px 18px}header h1{margin:.2em 0}header p{margin:.2em 0;opacity:.95}' +
        '.step{background:#fff;border-radius:14px;padding:16px 18px;margin:16px 0;box-shadow:0 2px 10px rgba(30,27,75,.08)}.step h2{margin:0 0 10px;color:#4338ca}.step h2 span{font-size:.7em;background:#ede9fe;color:#5b21b6;border-radius:99px;padding:2px 10px;margin-right:6px;vertical-align:middle}' +
        '.note{background:#f8fafc;border-left:5px solid #7c3aed;border-radius:8px;padding:10px 14px;margin:10px 0}.q{border-top:1px solid #e2e8f0;padding:12px 0}img{max-width:100%;max-height:420px;border-radius:8px;display:block;margin:8px 0}textarea{width:100%;box-sizing:border-box;font:inherit;padding:8px;border:1px solid #94a3b8;border-radius:8px}' +
        '.opt{display:block;padding:6px 8px;border:1px solid #e2e8f0;border-radius:8px;margin:4px 0}.fb{margin-top:8px;padding:8px 12px;border-radius:8px;background:#ecfdf5;border:1px solid #6ee7b7}.fb.bad{background:#fef2f2;border-color:#fca5a5}button{font:inherit;font-weight:700;background:#4338ca;color:#fff;border:0;border-radius:10px;padding:9px 16px;cursor:pointer}' +
        'table{border-collapse:collapse}td,th{border:1px solid #cbd5e1;padding:4px 8px}.score{font-weight:700;color:#5b21b6}footer{text-align:center;color:#64748b;font-size:.85em;padding:20px}.qp{display:block;margin:.3em 0}@media print{button{display:none}}';
      var js = "var K=JSON.parse(decodeURIComponent(escape(atob('" + data + "'))));function esc(s){return String(s).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}" +
        "try{var S0=JSON.parse(localStorage.getItem(location.pathname+'#lesson')||'{}')}catch(e){var S0={}}" +
        "document.querySelectorAll('.q').forEach(function(q){var id=q.getAttribute('data-q'),t=q.querySelector('textarea');if(t){t.value=S0[id]||'';t.oninput=save}else q.querySelectorAll('input').forEach(function(r){if(String(S0[id])===r.value)r.checked=true;r.onchange=save})});" +
        "function val(q){var t=q.querySelector('textarea');if(t)return t.value.trim();var r=q.querySelector('input:checked');return r?r.value:''}" +
        "function save(){var o={};document.querySelectorAll('.q').forEach(function(q){o[q.getAttribute('data-q')]=val(q)});try{localStorage.setItem(location.pathname+'#lesson',JSON.stringify(o))}catch(e){}}" +
        "document.querySelectorAll('.check').forEach(function(b){b.onclick=function(){var st=b.closest('.step'),qs=st.querySelectorAll('.q'),todo=0,got=0,max=0;qs.forEach(function(q){if(!val(q))todo++});" +
        "if(todo){st.querySelector('.score').textContent='Answer every question in this step first ('+todo+' left).';return}" +
        "qs.forEach(function(q){var k=K[q.getAttribute('data-q')]||{},f=q.querySelector('.fb'),v=val(q);f.hidden=false;if(q.getAttribute('data-kind')==='short'){f.className='fb';f.innerHTML='<b>Model answer:</b> '+esc(k.m||'Ask your teacher.')+(k.e?'<br>'+esc(k.e):'')+'<br><i>Compare it with your answer and correct your work.</i>'}" +
        "else{max++;var ok=String(k.c)===v;if(ok)got++;f.className='fb'+(ok?'':' bad');f.innerHTML=(ok?'✓ Correct.':'✗ The correct answer is '+'ABCDEFGH'.charAt(k.c)+'.')+(k.e?' '+esc(k.e):'')}});" +
        "st.querySelector('.score').textContent=max?'Multiple choice in this step: '+got+' / '+max:'Compare your answers with the model answers.'}});";
      var html = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + E(q.title) + '</title><style>' + css + '</style></head><body><header><main style="padding:0 16px"><p>Interactive lesson</p><h1>' + E(q.title) + '</h1><p>Prepared by ' + E(author) + ' · BioscienceVista</p></main></header><main>' +
        (q.instructions ? '<section class="step"><h2>Learning objectives</h2><ul>' + String(q.instructions).split('\n').filter(function (l) { return l.trim(); }).map(function (l) { return '<li>' + E(l.trim()) + '</li>'; }).join('') + '</ul></section>' : '') +
        body + '</main><footer>' + E(q.title) + ' · Prepared by ' + E(author) + ' · made with the BioscienceVista lesson builder · answers are kept on this device</footer><script>' + js + '<\/script></body></html>';
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      a.download = (q.title || 'lesson').replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-').slice(0, 70) + '.html'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    });
  }

  /* ---------- assessment builder layout, in the style of AssessPrep: a top bar, a numbered question navigator on the left,
     one question at a time in the middle, and the settings and mark scheme on their own tabs. Only the layout changes:
     every field and button keeps working exactly as before. ---------- */
  function apLayout(p, isNew) {
    var f = p.querySelector('#qf'); if (!f || p.querySelector('.ap-top')) return;
    if (!document.getElementById('ap-css')) { var st = document.createElement('style'); st.id = 'ap-css';
      st.textContent = '.ap-top{position:sticky;top:0;z-index:20;display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:linear-gradient(90deg,#1e1b4b,#4338ca);color:#fff;border-radius:12px;padding:10px 14px;margin:0 0 10px}.ap-top a{color:#c7d2fe}.ap-top b.t{font-size:1.1rem;flex:1;min-width:160px}.ap-top .pill{background:rgba(255,255,255,.18);color:#fff}' +
        '.ap-tabs{display:flex;gap:6px;margin:0 0 10px;flex-wrap:wrap}.ap-tabs button{border:0;border-radius:10px 10px 0 0;padding:9px 16px;font:inherit;font-weight:700;background:#e0e7ff;color:#3730a3;cursor:pointer}.ap-tabs button[aria-selected=true]{background:#4338ca;color:#fff}' +
        '.ap-grid{display:grid;grid-template-columns:150px minmax(0,1fr);gap:12px;align-items:start}.ap-nav{position:sticky;top:64px;display:grid;gap:6px;max-height:calc(100vh - 90px);overflow:auto;padding:8px;background:#eef2ff;border-radius:12px}' +
        '.ap-nav button{display:flex;justify-content:space-between;gap:6px;align-items:center;border:2px solid transparent;border-radius:10px;padding:7px 9px;background:#fff;font:inherit;cursor:pointer;text-align:left}.ap-nav button.on{border-color:#4338ca;background:#e0e7ff;font-weight:700}.ap-nav button small{color:#64748b}.ap-nav .add{background:#4338ca;color:#fff;justify-content:center;font-weight:700}' +
        '.ap-one .qe{display:none}.ap-one .qe.ap-cur{display:block}.ap-step{display:flex;justify-content:space-between;gap:8px;margin-top:10px}@media (max-width:760px){.ap-grid{grid-template-columns:1fr}.ap-nav{position:static;display:flex;flex-wrap:wrap;max-height:none}}';
      document.head.appendChild(st); }
    var D = function (c, h) { var d = document.createElement('div'); d.className = c; if (h) d.innerHTML = h; return d; };
    var ms = p.querySelector('#msbox'), list = p.querySelector('#qlist'), qsec = list ? list.parentNode : null, back = p.querySelector('p'), pv = f.querySelector('a[href*="/preview"]');
    var top = D('ap-top', '<a href="#quizzes">← All</a><b class="t"></b><span class="pill" data-tot></span><span class="pill" data-pub></span>' + (qsec ? '<button type="button" class="btn main sm" data-save>💾 Save questions</button>' : '') + (pv ? '<a class="btn sm" href="' + pv.getAttribute('href') + '" style="color:#1e1b4b">👁 Preview</a>' : ''));
    var tabs = D('ap-tabs'), panes = {};
    [['questions', '① Questions', qsec], ['scheme', '② Mark scheme', ms], ['settings', '⚙ Settings', f]].forEach(function (t) { if (!t[2]) return;
      var b = document.createElement('button'); b.type = 'button'; b.textContent = t[1]; b.setAttribute('data-tab', t[0]); tabs.appendChild(b); panes[t[0]] = t[2];
      b.onclick = function () { show(t[0]); }; });
    function show(k) { Object.keys(panes).forEach(function (n) { (n === 'questions' ? grid : panes[n]).hidden = n !== k; }); tabs.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === k)); }); try { sessionStorage.setItem('ap-tab', k); } catch (e) {} }
    var grid = D('ap-grid'), nav = D('ap-nav'), main = D('ap-main');
    if (back) back.remove();
    p.insertBefore(top, p.firstChild); p.insertBefore(tabs, top.nextSibling);
    if (qsec) { p.insertBefore(grid, qsec); grid.appendChild(nav); grid.appendChild(main); main.appendChild(qsec); list.classList.add('ap-one');
      var stepper = D('ap-step', '<button type="button" class="btn sm" data-prev>‹ Previous question</button><button type="button" class="btn sm" data-next>Next question ›</button>'); main.appendChild(stepper); }
    /* settings made simpler: the rarely changed parts fold away */
    var more = document.createElement('details'), sum = document.createElement('summary'); sum.innerHTML = '<b>More options</b>: how written answers are marked, and exam security'; more.appendChild(sum);
    [].slice.call(f.querySelectorAll('fieldset')).forEach(function (fs) { var lg = fs.querySelector('legend'); if (lg && /Marking and feedback|Exam security/.test(lg.textContent)) { if (!more.parentNode) fs.parentNode.insertBefore(more, fs); more.appendChild(fs); } });
    var cur = 0;
    function cards() { return list ? [].slice.call(list.querySelectorAll('.qe')) : []; }
    function paint() {
      var cs = cards(), tot = 0; if (cur >= cs.length) cur = Math.max(0, cs.length - 1);
      nav.innerHTML = cs.map(function (c, i) { var m = +((c.querySelector('[data-f=marks]') || {}).value || 0), k = (c.querySelector('[data-f=kind]') || {}).value || ''; tot += k === 'info' ? 0 : m;
        return '<button type="button" data-i="' + i + '"' + (i === cur ? ' class="on"' : '') + '><span>' + (k === 'info' ? 'ℹ️' : k === 'short' ? '✍️' : '🔘') + ' Q' + (i + 1) + '</span><small>' + (k === 'info' ? 'text' : m + ' mk') + '</small></button>'; }).join('') + '<button type="button" class="add" data-add>＋ Add question</button>';
      cs.forEach(function (c, i) { c.classList.toggle('ap-cur', i === cur); });
      nav.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { cur = +b.getAttribute('data-i'); paint(); }; });
      nav.querySelector('[data-add]').onclick = function () { p.querySelector('#qadd').click(); cur = cards().length - 1; paint(); };
      top.querySelector('[data-tot]').textContent = cs.length + ' question' + (cs.length === 1 ? '' : 's') + ' · ' + tot + ' marks';
    }
    function head() { top.querySelector('.t').textContent = f.querySelector('#t').value || (isNew ? 'New quiz or exam' : 'Untitled'); var pb = f.querySelector('#pb'); top.querySelector('[data-pub]').textContent = pb && pb.checked ? 'Published' : 'Draft'; }
    f.addEventListener('input', head); f.addEventListener('change', head); head();
    if (qsec) {
      var qa = p.querySelector('#qadd'); if (qa) qa.parentNode.hidden = true;
      top.querySelector('[data-save]').onclick = function () { p.querySelector('#qsave').click(); };
      stepper.querySelector('[data-prev]').onclick = function () { cur = Math.max(0, cur - 1); paint(); };
      stepper.querySelector('[data-next]').onclick = function () { cur = Math.min(cards().length - 1, cur + 1); paint(); };
      new MutationObserver(function () { clearTimeout(paint.t); paint.t = setTimeout(paint, 30); }).observe(list, { childList: true });
      list.addEventListener('change', function (e) { if (e.target.matches && e.target.matches('[data-f=marks],[data-f=kind]')) paint(); });
      paint();
    }
    var want = 'questions'; try { want = sessionStorage.getItem('ap-tab') || 'questions'; } catch (e) {}
    show(panes[want] ? want : qsec ? 'questions' : 'settings');
  }

  /* ---------- teacher preview: the quiz or exam as students see it; nothing is saved ---------- */
  function quizPreview(p, id) {
    var Q = window.BVQ, L = 'ABCDEFGH';
    Promise.all([S.db.from('quizzes').select('*').eq('id', id).maybeSingle(), loadQuiz(id)]).then(function (x) {
      var q = x[0].data, qs = x[1]; if (!q) { p.innerHTML = '<p class="msg">Quiz not found.</p>'; return; }
      var exam = q.category === 'exam', total = qs.reduce(function (a, z) { return a + (z.marks || 0); }, 0);
      p.innerHTML = '<p><a href="#quizzes/' + id + '">← Back to editing</a></p>' +
        '<p class="panel tint small"><b>👁 Teacher preview.</b> This is what students see when they open this ' + (exam ? 'exam' : 'quiz') + '. Try it: nothing is saved and no marks are recorded. Press <b>Check my answers</b> to see how it would be marked.</p>' +
        '<section class="panel"><p class="label">' + (exam ? 'Exam' : 'Quiz') + '</p><h2>' + E(q.title) + '</h2>' + (q.instructions ? '<p>' + E(q.instructions) + '</p>' : '') +
        '<p class="small muted">' + [qs.length + ' questions', total + ' marks', q.time_limit_minutes ? '⏱ ' + q.time_limit_minutes + ' minutes' : 'No time limit', (q.max_attempts || 1) + ' attempt' + (q.max_attempts > 1 ? 's' : ''), q.published ? 'Published' : 'Draft: students cannot see it yet'].join(' · ') + '</p></section>' +
        (qs.length ? '' : '<p class="emptybox">No questions yet.</p>') +
        '<form id="pvf" class="grp">' + qs.map(function (z, i) {
          var name = 'pv-' + z.id, opts = z.options || [], md = BVT.parse(z.prompt).mode, drawn = z.kind === 'short' && /^(graph|draw|annotate)$/.test(md);
          return '<fieldset class="q" data-id="' + z.id + '"><legend>' + num(z.prompt, i) + BVT.rich(z.prompt, true) + ' <span class="pill">' + z.marks + ' mark' + (z.marks > 1 ? 's' : '') + '</span>' + (md ? ' <span class="pill">' + E(BVT.MODES[md]) + '</span>' : '') + '</legend>' +
            (z.image_url && md !== 'annotate' ? BVT.fig(z.image_url, '') : '') +
            (drawn ? '<div data-pad="' + z.id + '"></div>' :
             z.kind !== 'short' && md === 'dropdown' ? '<select class="qdrop" name="' + name + '"><option value="">Choose an answer…</option>' + opts.map(function (o, j) { return '<option value="' + j + '">' + L.charAt(j) + '. ' + E(o) + '</option>'; }).join('') + '</select>' :
             z.kind === 'short' ? '<textarea name="' + name + '" rows="' + (z.marks >= 6 ? 10 : z.marks >= 3 ? 6 : 3) + '" placeholder="Type an answer to test the marking"></textarea>'
              : opts.map(function (o, j) { return '<label class="opt"><input type="radio" name="' + name + '" value="' + j + '"> <b>' + L.charAt(j) + '.</b> ' + (BVT.opt ? BVT.opt(o) : E(o)) + '</label>'; }).join('')) +
            '<div class="pvres" hidden></div></fieldset>';
        }).join('') +
        '<div class="acts"><button class="btn main" type="submit">Check my answers</button><a class="btn" href="#quizzes/' + id + '">Back to editing</a></div><p class="msg ok" id="pvm" role="status"></p></form>';
      qs.forEach(function (z) { var h = p.querySelector('[data-pad="' + z.id + '"]'); if (h) { var pr = BVT.parse(z.prompt); BVT.pad(h, { mode: pr.mode, x: pr.x, y: pr.y, image: z.image_url }); } });
      p.querySelector('#pvf').onsubmit = function (e) {
        e.preventDefault(); var got = 0;
        qs.forEach(function (z) {
          var fs = p.querySelector('[data-id="' + z.id + '"]'), res = fs.querySelector('.pvres'), an = z.ans || {}, g = 0;
          if (z.kind === 'short') {
            var v = fs.querySelector('textarea') ? fs.querySelector('textarea').value : '', sc = an.mark_scheme || an.model_answer || '', s = Q.suggest(v, sc, z.marks); g = s.got || 0;
            res.innerHTML = '<p class="small"><b>Suggested mark: ' + (s.got == null ? '–' : s.got) + ' / ' + z.marks + '</b> (you confirm written marks in Marking)</p>' +
              (sc ? '<p class="small"><b>Mark scheme:</b><br>' + E(sc).replace(/\n/g, '<br>') + '</p>' : '<p class="small bad-t">No mark scheme for this question yet: it will be marked by hand.</p>');
          } else {
            var c = fs.querySelector('input:checked') || (fs.querySelector('select.qdrop') && fs.querySelector('select.qdrop').value !== '' ? fs.querySelector('select.qdrop') : null), right = an.correct_option; g = c && right != null && +c.value === +right ? z.marks : 0;
            res.innerHTML = right == null || right < 0 ? '<p class="small bad-t">No correct answer is ticked for this question yet.</p>'
              : '<p class="small ' + (g ? 'ok-t' : 'bad-t') + '"><b>' + (g ? '✓ Correct' : c ? '✗ Not correct' : 'Not answered') + '.</b> Answer: ' + L.charAt(right) + '. ' + E((z.options || [])[right] || '') + '</p>' + (an.explanation ? '<p class="small">' + E(an.explanation) + '</p>' : '');
          }
          got += g; res.hidden = false;
        });
        p.querySelector('#pvm').textContent = 'Preview score: ' + got + ' / ' + total + '. Nothing was saved.';
      };
    });
  }

  /* ---------- marking: automatic suggestions, teacher confirms and releases ---------- */
  function num(prompt, i) { return /^\d+\s*(\([a-z]\)|\.\s)/i.test(prompt || '') ? '' : '<b>' + (i + 1) + '.</b> '; }
  function loadQuiz(quizId) {
    return S.db.from('quiz_questions').select('position, questions(*, question_answers(*))').eq('quiz_id', quizId).order('position').then(function (r) {
      return (r.data || []).map(function (z) { var o = z.questions || {}, an = o.question_answers || {}; if (Array.isArray(an)) an = an[0] || {}; o.ans = an; return o; });
    });
  }
  function autoMarks(a, qs) {   // suggested marks for unmarked written answers
    var by = {}, out = []; (a.detail || []).forEach(function (d) { by[d.question_id] = d; });
    qs.forEach(function (q) { var d = by[q.id] || {}; if (q.kind !== 'short' || d.got != null) return;
      var ansv = (a.answers || {})[q.id] || ''; if (/^data:image\//.test(ansv) || q.marks === 0) return; if (!String(ansv).trim()) { out.push({ qid: q.id, got: 0 }); return; }   // no answer: 0
      var s = window.BVQ.suggest(ansv, q.ans.mark_scheme || q.ans.model_answer || '', q.marks); if (s.got != null) out.push({ qid: q.id, got: s.got }); });
    return out;
  }
  function marking(p, args) {
    if (args[0]) return markOne(p, args[0]);
    S.db.from('quiz_attempts').select('id,quiz_id,student_id,submitted_at,score,max_score,status,released, quizzes(title,show_results)').neq('status', 'in_progress').eq('released', false).order('submitted_at').then(function (r) {
      var rows = (r.data || []).filter(function (a) { return mine(a.student_id) && (a.status === 'needs_marking' || (a.quizzes && !a.quizzes.show_results)); });
      if (!rows.length) { p.innerHTML = '<p class="emptybox">Nothing to mark or release. 🎉</p>'; return; }
      S.db.from('profiles').select('id,full_name').in('id', rows.map(function (a) { return a.student_id; })).then(function (pr) { var n = {}; (pr.data || []).forEach(function (x) { n[x.id] = x.full_name; });
        var ready = rows.filter(function (a) { return a.status === 'marked'; });
        p.innerHTML = '<div class="row2"><p><b>' + rows.length + '</b> to check · ' + ready.length + ' fully marked</p><div class="acts"><button class="btn sm" type="button" id="auto">⚡ Auto-mark written answers</button>' +
          '<button class="btn main sm" type="button" id="relall"' + (ready.length ? '' : ' disabled') + '>✓ Release ' + ready.length + ' checked result' + (ready.length === 1 ? '' : 's') + '</button></div></div>' +
          '<p class="small muted">Auto-mark fills in suggested marks from your mark scheme. Nothing reaches students until you open each one, check it and release it (or use Release for those you have checked).</p>' +
          '<div class="tablewrap"><table class="marks"><tr><th>Student</th><th>Quiz</th><th>Submitted</th><th>Marks so far</th><th>Status</th></tr>' + rows.map(function (a) {
            return '<tr><td><a href="#marking/' + a.id + '">' + E(n[a.student_id] || '–') + '</a></td><td>' + E(a.quizzes ? a.quizzes.title : '') + '</td><td class="small">' + E(S.when(a.submitted_at)) + '</td><td>' + E(a.score) + ' / ' + E(a.max_score) + '</td><td>' +
              (a.status === 'needs_marking' ? '<span class="pill">needs marks</span>' : '<span class="pill">ready to release</span>') + '</td></tr>'; }).join('') + '</table></div>';
        p.querySelector('#auto').onclick = function () {
          var btn = this, quizIds = rows.filter(function (a) { return a.status === 'needs_marking'; }).map(function (a) { return a.quiz_id; }).filter(function (v, i, s) { return s.indexOf(v) === i; }), done = 0; btn.disabled = true; btn.textContent = 'Marking…';
          Promise.all(quizIds.map(function (qid) { return loadQuiz(qid).then(function (qs) { return [qid, qs]; }); })).then(function (all) {
            var Qs = {}; all.forEach(function (x) { Qs[x[0]] = x[1]; });
            return S.db.from('quiz_attempts').select('id,quiz_id,answers,detail').in('id', rows.filter(function (a) { return a.status === 'needs_marking'; }).map(function (a) { return a.id; })).then(function (ar) {
              var jobs = []; (ar.data || []).forEach(function (a) { autoMarks(a, Qs[a.quiz_id] || []).forEach(function (m) { jobs.push({ attempt: a.id, qid: m.qid, marks_given: m.got, comment: null }); }); });
              return jobs.reduce(function (pr, j) { return pr.then(function () { return S.db.rpc('mark_answer', j).then(function () { done++; }); }); }, Promise.resolve());
            });
          }).then(function () { toast(done + ' written answer' + (done === 1 ? '' : 's') + ' marked automatically. Check them, then release.'); marking(p, []); });
        };
        p.querySelector('#relall').onclick = function () { var btn = this; btn.disabled = true;
          ready.reduce(function (pr, a) { return pr.then(function () { return S.db.rpc('release_attempt', { attempt: a.id }).then(function (x) { return S.db.functions.invoke('result-feedback', { body: { attempt: a.id } }).then(function () { return x; }, function () { return x; }); }); }); }, Promise.resolve()).then(function () { toast(ready.length + ' result' + (ready.length === 1 ? '' : 's') + ' released to students'); marking(p, []); }); };
      });
    });
  }
  function repeatsOf(a, q) {   // a student's repeats of a lesson step, labelled, never counted in the mark
    var reps = (a.repeats || []).filter(function (r) { return r.answers && r.answers[q.id] != null && r.answers[q.id] !== ''; });
    if (!reps.length) return '';
    return '<div class="fb rep"><h4>↻ Repeats (practice after seeing the answers, not marked)</h4>' + reps.map(function (r) { var g = r.answers[q.id];
      return '<div class="small"><b>Repeat ' + E(r.n) + '</b> · ' + E(S.when(r.at)) + ': ' + (/^data:image\//.test(g) ? '<img class="hw" alt="Handwritten repeat" src="' + E(g) + '">' : q.kind === 'short' ? (window.BVT && BVT.answerHtml ? BVT.answerHtml(g) : '<span style="white-space:pre-wrap">' + E(g) + '</span>') : E((q.options || [])[g]) + (q.ans && String(g) === String(q.ans.correct_option) ? ' ✓' : ' ✗')) + '</div>'; }).join('') + '</div>';
  }
  function markOne(p, aid) {
    var Q = window.BVQ;
    S.db.from('quiz_attempts').select('*, quizzes(title,show_results)').eq('id', aid).maybeSingle().then(function (r) {
      var a = r.data; if (!a) { p.innerHTML = '<p class="msg">Attempt not found.</p>'; return; }
      Promise.all([loadQuiz(a.quiz_id), S.db.from('profiles').select('full_name').eq('id', a.student_id).maybeSingle(),
        S.db.from('attempt_feedback').select('*').eq('attempt_id', aid).then(function (f) { return f; }, function () { return { data: [] }; })]).then(function (x) {
        var qs = x[0], by = {}, FB = {}; (a.detail || []).forEach(function (d) { by[d.question_id] = d; }); ((x[2] && x[2].data) || []).forEach(function (f) { FB[f.question_id] = f; });
        var waitAI = Object.keys(FB).filter(function (k) { return FB[k].need_ai && !FB[k].ai && !FB[k].reviewed; }).length;
        var held = a.quizzes && !a.quizzes.show_results;
        p.innerHTML = '<p><a href="#marking">← Marking list</a></p><section class="panel row2"><div><h3>' + E(x[1].data ? x[1].data.full_name : '') + ' · ' + E(a.quizzes ? a.quizzes.title : '') + '</h3><p class="small muted">Submitted ' + E(S.when(a.submitted_at)) + '</p>' + (a.away_count ? '<p class="small" style="color:#b91c1c"><b>🚩 Left the page ' + a.away_count + ' time' + (a.away_count > 1 ? 's' : '') + '</b>, ' + Math.round((a.away_seconds || 0) / 60 * 10) / 10 + ' min away in total.</p>' : '') + '</div>' +
          '<div><b style="font-size:1.6rem" id="tot">' + E(a.score) + '</b> / ' + E(a.max_score) + (BVT.levelPill ? BVT.levelPill(a.score, a.max_score, a.quizzes ? a.quizzes.title : '') : '') + ((a.repeats || []).length ? ' <span class="pill">↻ ' + a.repeats.length + ' repeat' + (a.repeats.length > 1 ? 's' : '') + '</span>' : '') + ' <span class="pill">' + (a.released ? 'released' : held ? 'not released yet' : 'student sees MCQ score') + '</span></div></section>' +
          qs.filter(function (q) { return q.kind !== 'info'; }).map(function (q, i) { var d = by[q.id] || {}, g = (a.answers || {})[q.id], an = q.ans || {}, written = q.kind === 'short';
            var pic = /^data:image\//.test(g || ''), sug = written ? (pic ? { got: null, hits: [] } : Q.suggest(window.BVT && BVT.answerText ? BVT.answerText(g || '') : g || '', an.mark_scheme || an.model_answer || '', q.marks)) : null, pts = written ? Q.points(an.mark_scheme || an.model_answer || '') : [], lv = written ? Q.levels(an.rubric) : [];
            var fr = FB[q.id], val = d.got != null ? d.got : fr && fr.ai && fr.ai.got != null ? fr.ai.got : fr && fr.rule && fr.rule.got != null ? fr.rule.got : sug && sug.got != null ? sug.got : (g == null || g === '') && q.marks ? 0 : '';   // no answer: 0 ready to save
            return '<article class="q ' + (d.got == null ? (q.marks ? 'unmarked' : '') : +d.got === +d.max ? 'good' : +d.got > 0 ? 'part' : 'bad') + '" data-q="' + q.id + '"><div>' + num(q.prompt, i) + BVT.rich(q.prompt, true) + ' <span class="pill">' + (q.marks ? q.marks + ' mark' + (q.marks > 1 ? 's' : '') : 'not graded') + '</span>' + (d.got == null && q.marks ? ' <span class="pill unmarked-pill">Not marked yet</span>' : '') + '</div>' + (q.image_url && !pic ? '<img src="' + E(q.image_url) + '" alt="" style="max-width:320px;max-height:200px;border-radius:8px">' : '') +
              '<div class="fb"><h4>Student answer</h4>' + (g == null || g === '' ? '<i>no answer</i>' : pic ? '<img class="hw" alt="Student drawing or handwriting" src="' + E(g) + '" style="max-width:100%;border:1px solid var(--line);border-radius:8px">' : written ? (window.BVT && BVT.answerHtml ? BVT.answerHtml(g) : '<p style="white-space:pre-wrap">' + E(g) + '</p>') : E((q.options || [])[g]) + (g === an.correct_option ? ' ✓' : ' ✗ (correct: ' + E((q.options || [])[an.correct_option]) + ')')) + '</div>' +
              (pts.length ? '<div class="small"><b>Mark scheme</b>' + pts.map(function (t, k) { return '<div>' + (pic ? '• ' : sug.hits[k] ? '<span class="ok-t">✓</span> ' : '<span class="bad-t">✗</span> ') + E(t) + '</div>'; }).join('') + (d.got == null && sug.got != null ? '<p class="muted">Suggested: ' + sug.got + ' / ' + q.marks + ' (check it)</p>' : '') + '</div>' : '') +
              (lv.length ? '<div class="small"><b>Rubric</b> (click a level)' + lv.map(function (l) { return '<div><button type="button" class="btn sm" data-lv="' + l.hi + '">' + (l.lo === l.hi ? l.lo : l.lo + '–' + l.hi) + '</button> ' + E(l.text) + '</div>'; }).join('') + '</div>' : '') +
              repeatsOf(a, q) + (fr && BVT.feedback ? BVT.feedback(fr, { staff: true }) : '') +
              '<div class="row2"><label class="f">Marks<input type="number" min="0" max="' + q.marks + '" step="0.5" data-k="m" value="' + E(val) + '" style="max-width:90px"></label>' + (q.marks ? '<span class="f" style="align-self:flex-end;display:flex;gap:6px"><button type="button" class="btn sm" data-set="0" title="Not correct: record 0">✗ 0</button><button type="button" class="btn sm" data-set="' + q.marks + '" title="Full marks">✓ ' + q.marks + '</button></span>' : '') + '<label class="f" style="flex:1">Comment for the student<input data-k="c" value="' + E(d.comment || '') + '"></label></div></article>'; }).join('') +
          '<div class="acts panel">' + (waitAI ? '<button class="btn sm" type="button" id="askai">🤖 Get AI suggestions (' + waitAI + ')</button>' : '') + '<button class="btn sm" type="button" id="savem">Save marks</button><button class="btn main sm" type="button" id="rel">✓ Confirm grade and release to student</button></div>';
        p.querySelectorAll('[data-lv]').forEach(function (b) { b.onclick = function () { b.closest('[data-q]').querySelector('[data-k=m]').value = b.getAttribute('data-lv'); }; });
        p.querySelectorAll('[data-set]').forEach(function (b) { b.onclick = function () { b.closest('[data-q]').querySelector('[data-k=m]').value = b.getAttribute('data-set'); }; });
        p.querySelectorAll('[data-useai]').forEach(function (b) { b.onclick = function () { b.closest('[data-q]').querySelector('[data-k=m]').value = b.getAttribute('data-useai'); toast('AI mark copied in: press Save marks to confirm it.'); }; });
        var ask = p.querySelector('#askai');
        if (ask) ask.onclick = function () { ask.disabled = true; ask.textContent = '🤖 Asking AI…';
          S.db.functions.invoke('ai-mark', { body: { attempt: aid } }).then(function (res) {
            var d = res && res.data; if (res.error || !d || d.ok === false) { toast((d && d.error) || 'AI marking is unavailable right now. You can mark these answers yourself.', true); ask.disabled = false; ask.textContent = '🤖 Try AI again'; return; }
            toast(d.marked ? 'AI suggestions added for ' + d.marked + ' answer' + (d.marked > 1 ? 's' : '') + '. Check each one.' + (d.waiting ? ' ' + d.waiting + ' more ' + (d.waiting > 1 ? 'are' : 'is') + ' waiting: press Ask AI again in a minute.' : '') : 'Nothing needed AI marking.'); markOne(p, aid);
          }, function () { toast('AI marking is unavailable right now. You can mark these answers yourself.', true); ask.disabled = false; });
        };
        function saveAll() {
          var jobs = [].map.call(p.querySelectorAll('[data-q]'), function (art) { var m = art.querySelector('[data-k=m]').value, d = by[art.getAttribute('data-q')] || {}, c = art.querySelector('[data-k=c]').value.trim();
            if (m === '' || (d.got != null && +m === +d.got && c === (d.comment || ''))) return null;   /* 0 is a real mark: an unmarked answer given 0 is saved */ return { attempt: aid, qid: art.getAttribute('data-q'), marks_given: +m, comment: c || null }; }).filter(Boolean);
          return jobs.reduce(function (pr, j) { return pr.then(function () { return S.db.rpc('mark_answer', j).then(function (res) { if (res.error) throw res.error; p.querySelector('#tot').textContent = res.data; }); }); }, Promise.resolve());
        }
        p.querySelector('#savem').onclick = function () { saveAll().then(function () { toast('Marks saved'); markOne(p, aid); }, function (e) { toast(S.nice(e), true); }); };
        p.querySelector('#rel').onclick = function () {
          var empty = [].filter.call(p.querySelectorAll('[data-k=m]'), function (i) { return i.value === ''; }).length; if (empty) { toast('Give a mark for every question first (' + empty + ' empty).', true); return; }
          saveAll().then(function () { return S.db.rpc('release_attempt', { attempt: aid }); }).then(function (res) { if (res.error) throw res.error; S.db.functions.invoke('result-feedback', { body: { attempt: aid } }).then(function () {}, function () {}); toast('Released: the student can now see ' + res.data + ' / ' + a.max_score); location.hash = 'marking'; })
            .catch(function (e) { toast(S.nice(e), true); });
        };
      });
    });
  }

  /* ---------- lesson builder: objectives or a file → interactive six-step lesson ---------- */
  function lessons(p, args) {
    if (args[0]) { location.replace('/build/#' + (args[0] === 'new' ? 'new/lesson' : 'edit/' + args[0])); return; }   // the new builder replaces the old lesson maker
    S.db.from('quizzes').select('id,title,published,created_at,created_by, quiz_classes(class_id), quiz_questions(question_id)').eq('category', 'lesson').is('deleted_at', null).order('created_at', { ascending: false }).then(function (r) {
      if (TEACH) r.data = (r.data || []).filter(function (q) { return (!ME.admin && q.created_by === ME.user.id) || q.quiz_classes.some(function (x) { return CLASSES.some(function (c) { return c.id === x.class_id; }); }); });
      var cn = {}; CLASSES.forEach(function (c) { cn[c.id] = c.name; });
      p.innerHTML = '<div class="acts"><a class="btn main sm" href="/build/#new/lesson">✨ Build a lesson from a file or objectives</a><a class="btn sm" href="/build/">📚 My assessments and lessons</a></div>' +
        '<p class="small muted">Type your lesson objectives, upload any file (PDF, Word, PowerPoint, Excel, web page, text or pictures), or both. The site turns them into a six-step inquiry lesson (question, explore, test, explain, challenge, reflect) where students type or handwrite their answers. You can change everything before publishing.</p>' +
        ((r.data || []).length ? '<div class="tablewrap"><table class="marks"><tr><th>Lesson</th><th>Items</th><th>Classes</th><th>Status</th><th></th></tr>' + r.data.map(function (q) {
          return '<tr><td><a href="/build/#edit/' + q.id + '">' + E(q.title) + '</a></td><td>' + q.quiz_questions.length + '</td><td class="small">' + E(q.quiz_classes.map(function (c) { return cn[c.class_id] || '…'; }).join(', ') || '–') + '</td><td>' + (q.published ? '<span class="pill">Published</span>' : 'Draft') + '</td>' +
            '<td><a class="small" href="/lesson/#' + q.id + '" target="_blank" rel="noopener">Preview ↗</a> <button type="button" class="btn sm" data-html="' + q.id + '" title="Save this lesson as one HTML file that opens in any browser">⬇ HTML file</button>' + (ME.admin ? S.del('quiz', q.id, q.title) : '') + '</td></tr>'; }).join('') + '</table></div>' : '<p class="emptybox">No interactive lessons yet.</p>');
      if (BV.findBox) BV.findBox(p, 'table.marks tr:not(:first-child)', null, 'Find a lesson…');
      p.querySelectorAll('[data-html]').forEach(function (b) { b.onclick = function () { b.disabled = true; lessonHtmlFile(b.getAttribute('data-html')).then(function () { b.disabled = false; toast('HTML file saved to your downloads'); }, function (e) { b.disabled = false; toast(S.nice(e), true); }); }; });
    });
  }
  function lessonEdit(p, id, topicId) {
    var Q = window.BVQ, isNew = id === 'new';
    if (isNew) {
      p.innerHTML = '<p><a href="#lessons">← All lessons</a></p><section class="panel grp"><h3>Create an interactive lesson</h3>' +
        '<label class="f">Lesson title<input id="lt" placeholder="e.g. Osmosis in plant cells"></label>' +
        '<label class="f">Lesson objectives, one per line<textarea id="lo" rows="4" placeholder="Define osmosis\nExplain why plant cells become turgid in water\nCompare osmosis and diffusion"></textarea></label>' +
        (topicId ? '<p class="small">This lesson will be filed under <b>' + E((TOPICS.filter(function (t) { return t.id === topicId; })[0] || {}).name || 'the chosen topic') + '</b> in the Learning centre.</p>' : '') +
        '<div class="two"><label class="f">Upload any file: worksheet, notes, slides, spreadsheet, web page or pictures (optional, you can choose several)<input id="lf" type="file" multiple></label>' +
        '<label class="f">Mark scheme (optional)<input id="lm" type="file" accept=".pdf,.docx,.dotx,.pptx,.ppsx,.xlsx,.csv,.tsv,.odt,.odp,.ods,.rtf,.txt,.md,.html,.htm,.doc,.ppt,.xls,image/*"></label></div>' +
        '<p class="small muted">Works with PDF, Word, PowerPoint, Excel or CSV, OpenDocument, RTF, web pages, text files and pictures. Text becomes the reading, slides become one card each with their picture, numbered questions become interactive questions, and pictures appear in the lesson. With objectives only, you get a complete lesson outline. You can change everything before publishing.</p>' +
        '<div class="acts"><button class="btn main sm" type="button" id="lb">Build the lesson</button></div><p class="msg" id="lmsg" role="status"></p></section>';
      p.querySelector('#lf').onchange = function () { var f = this.files[0]; if (f && !p.querySelector('#lt').value) p.querySelector('#lt').value = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim(); };
      p.querySelector('#lb').onclick = function () {
        var title = p.querySelector('#lt').value.trim(), obj = p.querySelector('#lo').value.trim(), fs = [].slice.call(p.querySelector('#lf').files), f = fs[0], m = p.querySelector('#lm').files[0], msg = p.querySelector('#lmsg');
        if (!obj && !f) { msg.className = 'msg'; msg.textContent = 'Type at least one objective or choose a file.'; return; }
        if (!title) { msg.className = 'msg'; msg.textContent = 'Give the lesson a title.'; return; }
        msg.className = 'msg ok'; msg.textContent = 'Reading ' + (fs.length > 1 ? fs.length + ' files' : 'your file') + ' and building the lesson…';
        Q.IMGS = [];
        var readAll = Promise.all(fs.map(function (x) { return Q.readFile(x).catch(function (e) { throw new Error(x.name + ': ' + S.nice(e)); }); })).then(function (all) {
          return all.length ? all.reduce(function (a, l, i) { return a.concat(all.length > 1 && !/^\*\*/.test(l[0] || '') ? ['**' + fs[i].name.replace(/\.[^.]+$/, '') + '**'] : [], l); }, []) : null; });
        Promise.all([readAll, m ? Q.readFile(m) : null]).then(function (x) {
          var items = Q.buildLesson(title, obj, x[0], x[1]);
          editor({ title: title, instructions: obj, published: false, topic_id: topicId || null }, items, []);
        }).catch(function (e) { msg.className = 'msg'; msg.textContent = S.nice(e); });
      };
      return;
    }
    Promise.all([S.db.from('quizzes').select('*').eq('id', id).maybeSingle(), S.db.from('quiz_classes').select('class_id').eq('quiz_id', id),
      S.db.from('quiz_questions').select('position, questions(*, question_answers(*))').eq('quiz_id', id).order('position')]).then(function (x) {
      var q = x[0].data; if (!q) { p.innerHTML = '<p class="msg">Lesson not found.</p>'; return; }
      var items = (x[2].data || []).map(function (z) { var o = z.questions || {}, an = o.question_answers || {}; if (Array.isArray(an)) an = an[0] || {};
        return { id: o.id, section: o.section || 'Explore', kind: o.kind, prompt: o.prompt, options: o.options || [], correct: an.correct_option == null ? -1 : an.correct_option, marks: o.marks, scheme: an.mark_scheme || '', rubric: an.rubric || '', explanation: an.explanation || '', image: o.image_url || '' }; });
      editor(q, items, (x[1].data || []).map(function (c) { return c.class_id; }));
    });

    function editor(meta, items, set) {
      var removed = [];
      p.innerHTML = '<p><a href="#lessons">← All lessons</a></p><form class="panel grp" id="lf2"><div class="row2"><h3>' + (meta.id ? 'Edit lesson' : 'Check your new lesson') + '</h3>' + (meta.id ? '<a class="btn sm" href="/lesson/#' + meta.id + '" target="_blank" rel="noopener">Preview as a student ↗</a>' : '') + '</div>' +
        '<label class="f">Title<input id="t" required value="' + E(meta.title) + '"></label><label class="f">Objectives (shown at the start of the lesson)<textarea id="ob" rows="3">' + E(meta.instructions || '') + '</textarea></label>' +
        '<div class="row2"><label class="f">Topic (shows it in the Learning centre)<select id="tp">' + topicOpts(meta.topic_id) + '</select></label><label class="f">Due (optional)<input id="du" type="datetime-local" value="' + dt(meta.due_at) + '"></label></div>' +
        '<fieldset><legend>Set for classes</legend>' + (CLASSES.length ? CLASSES.map(function (c) { return '<label class="chk"><input type="checkbox" name="cl" value="' + c.id + '"' + (set.indexOf(c.id) >= 0 ? ' checked' : '') + '> ' + E(c.name) + '</label>'; }).join('') : '<p class="small">Create a class first.</p>') + '</fieldset>' +
        '<label class="chk"><input type="checkbox" id="pb"' + (meta.published ? ' checked' : '') + '> Published (students in the chosen classes can open it)</label>' +
        '<p class="small muted">Written answers are suggested a mark from your mark scheme and wait for you to check them in Marking before students see their result. 0-mark questions (like the reflection) are recorded but not graded.</p></form>' +
        '<div id="steps" class="grp"></div><div class="acts panel"><button class="btn main" type="button" id="ls">' + (meta.id ? 'Save lesson' : 'Save lesson') + '</button>' + (meta.id ? '<button class="btn sm" type="button" id="ldel">Delete lesson</button>' : '') + '</div>';
      var stepsEl = p.querySelector('#steps');
      function sync() { items = [].map.call(stepsEl.querySelectorAll('.qe'), Q.readCard); }
      function draw() {
        stepsEl.innerHTML = Q.STEPS.map(function (st, k) {
          var mine = items.map(function (q, i) { return [q, i]; }).filter(function (x) { return (x[0].section || 'Explore') === st; });
          return '<section class="grp step-ed" data-step="' + st + '"><h3 class="sec-h">' + (k + 1) + '. ' + st + ' <span class="small muted">' + mine.length + ' item' + (mine.length === 1 ? '' : 's') + '</span></h3>' +
            mine.map(function (x) { return Q.card(x[0], x[1], { lesson: true }); }).join('') +
            '<div class="acts"><button class="btn sm" type="button" data-add="info" data-st="' + st + '">＋ Reading, notes or video</button><button class="btn sm" type="button" data-add="short" data-st="' + st + '">＋ Written question</button><button class="btn sm" type="button" data-add="mcq" data-st="' + st + '">＋ Multiple choice</button></div></section>';
        }).join('');
        stepsEl.querySelectorAll('.qe').forEach(function (el) {
          Q.wireCard(el); var i = +el.dataset.i;
          el.querySelector('[data-f=section]').onchange = function () { sync(); draw(); };
          el.querySelector('[data-act=del]').onclick = function () { sync(); if (items[i].id) removed.push(items[i].id); items.splice(i, 1); draw(); };
          el.querySelector('[data-act=up]').onclick = function () { sync(); var j = i - 1; while (j >= 0 && items[j].section !== items[i].section) j--; if (j >= 0) { var t = items[j]; items[j] = items[i]; items[i] = t; } draw(); };
          el.querySelector('[data-act=down]').onclick = function () { sync(); var j = i + 1; while (j < items.length && items[j].section !== items[i].section) j++; if (j < items.length) { var t = items[j]; items[j] = items[i]; items[i] = t; } draw(); };
        });
        stepsEl.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () {
          sync(); var st = b.getAttribute('data-st'), kind = b.getAttribute('data-add'), last = -1;
          items.forEach(function (q, k) { if (q.section === st) last = k; });
          items.splice(last + 1, 0, { section: st, kind: kind, prompt: '', options: [], correct: -1, marks: kind === 'info' ? 0 : kind === 'mcq' ? 1 : 2, scheme: '', rubric: '', explanation: '', image: '' });
          draw(); var el = stepsEl.querySelector('[data-i="' + (last + 1) + '"] [data-f=prompt]'); if (el) el.focus(); }; });
      }
      draw();
      var del = p.querySelector('#ldel'); if (del) del.onclick = function () { if (!del.dataset.sure) { del.dataset.sure = 1; del.textContent = 'Click again to move the lesson to the bin'; return; }
        S.db.rpc('bin_item', { kind: 'quiz', item: meta.id }).then(function (r) { if (ok(r, 'Lesson moved to the 🗑 Bin (restore it within 30 days)')) location.hash = 'lessons'; }); };
      p.querySelector('#ls').onclick = function () {
        sync(); var bad = items.map(Q.check).filter(Boolean)[0]; if (bad) { toast(bad, true); return; }
        var title = p.querySelector('#t').value.trim(); if (!title) { toast('Give the lesson a title.', true); return; }
        var cls = [].map.call(p.querySelectorAll('[name=cl]:checked'), function (c) { return c.value; }), pub = p.querySelector('#pb').checked;
        if (pub && !cls.length) { toast('Choose at least one class before publishing.', true); return; }
        var row = { title: title, instructions: p.querySelector('#ob').value.trim() || null, topic_id: p.querySelector('#tp').value || null, due_at: iso(p.querySelector('#du').value), published: pub, category: 'lesson', show_results: false, max_attempts: 1, time_limit_minutes: null };
        var btn = this; btn.disabled = true; btn.textContent = 'Saving…'; var qid;
        (meta.id ? S.db.from('quizzes').update(row).eq('id', meta.id).select('id').single() : S.db.from('quizzes').insert(row).select('id').single()).then(function (r) {
          if (r.error) throw r.error; qid = r.data.id;
          return Q.save(S.db, items);
        }).then(function (ids) {
          return S.db.from('quiz_questions').delete().eq('quiz_id', qid).then(function () { return S.db.from('quiz_questions').insert(ids.map(function (x, k) { return { quiz_id: qid, question_id: x, position: k + 1 }; })); });
        }).then(function (r) {
          if (r.error) throw r.error;
          return removed.length ? S.db.from('questions').delete().in('id', removed) : null;
        }).then(function () {
          return S.db.from('quiz_classes').delete().eq('quiz_id', qid).then(function () { return cls.length ? S.db.from('quiz_classes').insert(cls.map(function (c) { return { quiz_id: qid, class_id: c }; })) : { error: null }; });
        }).then(function (r) {
          if (r.error) throw r.error;
          // a matching entry in the Learning centre (and lesson progress) for students
          var marks = items.reduce(function (a, q) { return a + (q.marks || 0); }, 0);
          return S.db.from('lessons').upsert({ external_id: 'IL-' + qid, title: title, summary: (row.instructions || '').split('\n')[0] || 'Interactive lesson', url: '/lesson/#' + qid, topic_id: row.topic_id, max_marks: marks, published: pub }, { onConflict: 'external_id' });
        }).then(function (r) {
          if (r && r.error) throw r.error; toast('Lesson saved' + (pub ? ' and published' : ' as a draft')); location.hash = 'lessons/' + qid; if (meta.id) lessonEdit(p, qid);
        }).catch(function (e) { btn.disabled = false; btn.textContent = 'Save lesson'; toast(S.nice(e), true); });
      };
    }
  }

  /* ---------- content manager ---------- */
  var KINDS = ['file', 'folder', 'video', 'link', 'slides', 'worksheet', 'past paper'];
  var CONTENT = {
    topics: { label: 'Topics', order: 'sort_order', sel: '*, subjects(name)', show: function (r) { var par = TOPICS.filter(function (t) { return t.id === r.parent_id; })[0]; return (r.subjects ? r.subjects.name + ' · ' : '') + (par ? par.name + ' › ' : '') + r.name; },
      f: [['subject_id', 'Subject', 'subject'], ['parent_id', 'Main topic (choose one to make this a subtopic)', 'topic'], ['name', 'Topic or subtopic name', 'text'], ['programme', 'Programme (e.g. MYP 4, IB DP)', 'text'], ['code', 'Syllabus code', 'text'], ['summary', 'Summary', 'area'], ['sort_order', 'Order', 'num'], ['published', 'Published', 'bool']] },
    lessons: { label: 'Lessons', order: 'sort_order', sel: '*, topics(name)', show: function (r) { return r.title + (r.topics ? ' · ' + r.topics.name : ''); },
      f: [['topic_id', 'Topic', 'topic'], ['title', 'Title', 'text'], ['summary', 'Summary', 'area'], ['url', 'Lesson address (e.g. /lessons/g9-dna-rna/)', 'text'], ['external_id', 'Lesson ID (must match the lesson page, e.g. G9-DNA-RNA)', 'text'], ['max_marks', 'Total marks', 'num'], ['minutes', 'Minutes', 'num'], ['sort_order', 'Order', 'num'], ['published', 'Published', 'bool']] },
    resources: { label: 'Resources', order: 'sort_order', sel: '*, topics(name)', show: function (r) { return r.title + ' (' + r.kind + ')' + (r.topics ? ' · ' + r.topics.name : ''); },
      f: [['topic_id', 'Topic', 'topic'], ['title', 'Title', 'text'], ['kind', 'Type', 'kind'], ['url', 'Link', 'text'], ['download_url', 'Download link (optional)', 'text'], ['sort_order', 'Order', 'num'], ['published', 'Published', 'bool']] },
    simulations: { label: 'Simulations', order: 'sort_order', sel: '*, topics(name)', show: function (r) { return r.title + (r.topics ? ' · ' + r.topics.name : ''); },
      f: [['topic_id', 'Topic', 'topic'], ['title', 'Title', 'text'], ['description', 'Description', 'area'], ['url', 'Address', 'text'], ['thumbnail_url', 'Picture address (optional)', 'text'], ['source', 'Source (e.g. PhET)', 'text'], ['is_internal', 'Made on this site', 'bool'], ['sort_order', 'Order', 'num'], ['published', 'Published', 'bool']] }
  };
  var SUBJ = null;
  function content(p, args) {
    var KEYS = TEACH ? ['lessons', 'resources', 'simulations'] : Object.keys(CONTENT);
    var t = KEYS.indexOf(args[0]) >= 0 ? args[0] : 'lessons', c = CONTENT[t];
    if (TEACH) c = { label: c.label, order: c.order, sel: c.sel, show: c.show, f: [['class_id', 'Class that sees it', 'class']].concat(c.f.filter(function (f) { return f[0] !== 'external_id' && f[0] !== 'is_internal'; })) };
    (SUBJ ? Promise.resolve() : S.db.from('subjects').select('id,name').order('sort_order').then(function (r) { SUBJ = r.data || []; })).then(function () {
      return S.db.from(t).select(c.sel).order(c.order);
    }).then(function (r) {
      var rows = (r.data || []).filter(function (x) { return !TEACH || x.owner_id === OWNER(); }), q = '';
      function field(f, v) { var k = f[0], ty = f[2], lab = '<label class="f">' + E(f[1]);
        if (ty === 'bool') return '<label class="chk"><input type="checkbox" data-k="' + k + '"' + (v || v == null && k === 'published' ? ' checked' : '') + '> ' + E(f[1]) + '</label>';
        if (ty === 'area') return lab + '<textarea data-k="' + k + '" rows="2">' + E(v || '') + '</textarea></label>';
        if (ty === 'topic') return lab + '<select data-k="' + k + '">' + topicOpts(v) + '</select></label>';
        if (ty === 'class') return lab + '<select data-k="' + k + '" required>' + classOpts(v, 'Choose your class…') + '</select></label>';
        if (ty === 'subject') return lab + '<select data-k="' + k + '" required>' + SUBJ.map(function (s) { return '<option value="' + s.id + '"' + (s.id === v ? ' selected' : '') + '>' + E(s.name) + '</option>'; }).join('') + '</select></label>';
        if (ty === 'kind') return lab + '<select data-k="' + k + '">' + KINDS.map(function (s) { return '<option' + (s === v ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label>';
        return lab + '<input data-k="' + k + '"' + (ty === 'num' ? ' type="number"' : '') + ' value="' + E(v == null ? '' : v) + '"></label>'; }
      function read(form) { var o = {}; c.f.forEach(function (f) { var el = form.querySelector('[data-k="' + f[0] + '"]'); o[f[0]] = f[2] === 'bool' ? el.checked : f[2] === 'num' ? (el.value === '' ? (f[0] === 'sort_order' ? 0 : null) : +el.value) : (el.value.trim() || null); }); return o; }
      function draw() {
        var list = rows.filter(function (x) { return !q || c.show(x).toLowerCase().indexOf(q) >= 0; });
        p.innerHTML = (TEACH ? '<p class="small muted">Your own lessons, links, files and simulations. Each one is seen only by the class you choose (or students you set it for on the 📌 To-do list). BioscienceVista\'s main-site lessons are already in your classes.</p>' : '') + '<nav class="tabs">' + KEYS.map(function (k) { return '<a href="#content/' + k + '" aria-selected="' + (k === t) + '">' + CONTENT[k].label + '</a>'; }).join('') + '</nav>' +
          '<details class="panel tint"' + (rows.length ? '' : ' open') + '><summary><b>＋ Add to ' + c.label.toLowerCase() + '</b></summary><form class="grp" id="nf" style="margin-top:10px">' + c.f.map(function (f) { return field(f, null); }).join('') + '<button class="btn main sm" type="submit">Add</button></form></details>' +
          '<input type="search" id="q" placeholder="Search ' + c.label.toLowerCase() + '" value="' + E(q) + '" aria-label="Search">' +
          (list.length ? list.map(function (x) { return '<details class="panel" data-id="' + x.id + '"><summary>' + (x.published === false ? '<span class="pill">Hidden</span> ' : '') + E(c.show(x)) + '</summary><form class="grp" style="margin-top:10px">' + c.f.map(function (f) { return field(f, x[f[0]]); }).join('') +
            '<div class="acts"><button class="btn main sm" type="submit">Save</button><button class="btn sm" type="button" data-a="del">Delete</button></div></form></details>'; }).join('') : '<p class="emptybox">Nothing here yet.</p>');
        p.querySelector('#nf').onsubmit = function (e) { e.preventDefault(); S.db.from(t).insert(Object.assign(read(this), TEACH ? { owner_id: ME.user.id } : {})).then(function (r2) { if (ok(r2, 'Added')) { if (t === 'topics') refs(); content(p, [t]); } }); };
        p.querySelectorAll('details[data-id]').forEach(function (d) { var id = d.getAttribute('data-id'), f = d.querySelector('form');
          f.onsubmit = function (e) { e.preventDefault(); S.db.from(t).update(read(f)).eq('id', id).then(function (r2) { if (ok(r2, 'Saved')) { if (t === 'topics') refs(); } }); };
          var b = f.querySelector('[data-a=del]'); b.onclick = function () { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Click again to delete'; return; } S.db.from(t).delete().eq('id', id).then(function (r2) { if (ok(r2, 'Deleted')) content(p, [t]); }); }; });
        var qi = p.querySelector('#q'); qi.oninput = function () { q = qi.value.toLowerCase().trim(); draw(); var n = p.querySelector('#q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
      }
      draw();
    });
  }

  /* ---------- roles (admins only; RLS also enforces this on the server) ---------- */
  function roles(p) {
    Promise.all([S.db.from('profiles').select('id,full_name,class_id').order('full_name'), S.db.from('user_roles').select('user_id,role')]).then(function (x) {
      var rs = {}, q = ''; (x[1].data || []).forEach(function (r) { (rs[r.user_id] = rs[r.user_id] || []).push(r.role); });
      var people = x[0].data || [];
      function draw() {
        var list = people.filter(function (u) { return (q ? (u.full_name || '').toLowerCase().indexOf(q) >= 0 : (rs[u.id] || []).some(function (r) { return r !== 'student'; })); });
        p.innerHTML = '<p class="small muted">Staff are listed below. Search for a person to give them teacher or admin rights. Teachers see only students in classes they own; admins see everything.</p><input type="search" id="q" placeholder="Search people by name" value="' + E(q) + '" aria-label="Search people">' +
          '<div class="tablewrap"><table class="marks"><tr><th>Name</th><th>Roles</th><th>Teacher</th><th>Admin</th><th>Account</th></tr>' + list.map(function (u) { var r = rs[u.id] || [];
            return '<tr><td>' + E(u.full_name || '(no name)') + '</td><td class="small">' + E(r.join(', ')) + '</td>' + ['teacher', 'admin'].map(function (role) { var has = r.indexOf(role) >= 0;
              return '<td><button type="button" class="btn sm" data-u="' + u.id + '" data-r="' + role + '" data-h="' + has + '"' + (u.id === ME.user.id && role === 'admin' ? ' disabled title="You cannot remove your own admin rights"' : '') + '>' + (has ? 'Remove' : 'Give') + '</button></td>'; }).join('') +
              '<td>' + (u.id === ME.user.id ? '<span class="small muted">you</span>' : '<button type="button" class="btn sm" data-del="' + u.id + '">Delete account</button>') + '</td></tr>'; }).join('') + '</table></div>';
        p.querySelectorAll('[data-u]').forEach(function (b) { b.onclick = function () { var u = b.getAttribute('data-u'), role = b.getAttribute('data-r'), has = b.getAttribute('data-h') === 'true';
          (has ? S.db.from('user_roles').delete().eq('user_id', u).eq('role', role) : S.db.from('user_roles').insert({ user_id: u, role: role, granted_by: ME.user.id })).then(function (r) {
            if (!ok(r, has ? 'Role removed' : 'Role given')) return; rs[u] = rs[u] || []; if (has) rs[u] = rs[u].filter(function (z) { return z !== role; }); else rs[u].push(role); draw(); }); }; });
        wireRemove(p, function () { roles(p); });
        var qi = p.querySelector('#q'); qi.oninput = function () { q = qi.value.toLowerCase().trim(); draw(); var n = p.querySelector('#q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
      }
      draw();
    });
  }

  /* ---------- removing people ---------- */
  function removeButtons(id, inClass) {
    return (inClass ? '<button type="button" class="btn sm" data-out="' + id + '">Remove from class</button> ' : '') +
      (ME.admin ? '<button type="button" class="btn sm" data-del="' + id + '">Delete account</button>' : '');
  }
  function twice(b, label, fn) {   // first click asks, second click does it
    if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = label; b.classList.add('main'); setTimeout(function () { if (b.isConnected && b.dataset.sure) { delete b.dataset.sure; b.textContent = b.dataset.was; b.classList.remove('main'); } }, 5000); return; }
    b.disabled = true; fn();
  }
  function wireRemove(p, after) {
    p.querySelectorAll('[data-out]').forEach(function (b) { b.dataset.was = b.textContent; b.onclick = function () {
      twice(b, 'Click again to remove', function () { S.db.from('profiles').update({ class_id: null, approved: false }).eq('id', b.getAttribute('data-out')).then(function (r) { if (ok(r, 'Removed from class')) after(); else b.disabled = false; }); }); }; });
    p.querySelectorAll('[data-del]').forEach(function (b) { b.dataset.was = b.textContent; b.onclick = function () {
      twice(b, 'Click again: delete forever', function () { S.db.rpc('delete_account', { uid: b.getAttribute('data-del') }).then(function (r) { if (ok(r, 'Account deleted')) after(); else b.disabled = false; }); }); }; });
  }

  /* ---------- approvals: one click ---------- */
  function approvals(p) {
    if (ME.admin) { p.innerHTML = '<div class="panel tint"><p><b>All approvals are now in one place.</b> Teachers, students asking to join your classes and other teachers\' classes, and new accounts, with approve, free access, premium and delete on each row.</p><a class="btn main" href="/admin/#approvals">✅ Open all approvals</a></div>'; return; }
    Promise.all([S.db.from('pending_accounts').select('*').order('created_at'), S.db.rpc('account_emails')]).then(function (x) {
      var rows = x[0].data || [], em = {}; (x[1].data || []).forEach(function (u) { em[u.user_id] = u.email; });
      if (!rows.length) { p.innerHTML = '<p class="emptybox">Nobody is waiting for approval. New sign-ups appear here.</p>'; return; }
      p.innerHTML = '<div class="row2"><p><b>' + rows.length + '</b> waiting for approval</p><button class="btn main sm" type="button" id="all">✓ Approve all ' + rows.length + '</button></div>' +
        '<div class="tablewrap"><table class="marks"><tr><th>Name</th><th>Email</th><th>Account</th><th>Class</th><th>Signed up</th><th></th></tr>' + rows.map(function (r) {
          return '<tr data-row="' + r.student_id + '"><td><b>' + E(r.full_name || '(no name)') + '</b></td><td class="small">' + E(em[r.student_id] || '') + '</td><td>' + E(r.account_type || 'student') + (r.admin_ok === false ? ' <span class="pill">needs site admin</span>' : '') + '</td><td>' + E(r.class_name || 'no class') + '</td><td class="small">' + E(S.when(r.created_at)) + '</td>' +
            '<td><button class="btn main sm" type="button" data-ok="' + r.student_id + '"' + (r.class_id || ME.admin ? '' : ' disabled title="Not in a class yet"') + '>✓ Approve</button> ' + removeButtons(r.student_id, !!r.class_id) + '</td></tr>'; }).join('') + '</table></div>' +
        '<p class="small muted">Only accounts approved by the site admin can open materials (visitors see the catalogue only). Approve gives the person their lessons, quizzes and simulations straight away. "Remove from class" sends them back to the join-a-class screen; "Delete account" removes them completely.</p>';
      function approve(ids) { return S.db.from('profiles').update(ME.admin ? { approved: true, admin_ok: true } : { approved: true }).in('id', ids); }
      p.querySelectorAll('[data-ok]').forEach(function (b) { b.onclick = function () { b.disabled = true; approve([b.getAttribute('data-ok')]).then(function (r) {
        if (!ok(r, 'Approved')) { b.disabled = false; return; } var tr = p.querySelector('[data-row="' + b.getAttribute('data-ok') + '"]'); tr.style.opacity = .5; b.textContent = '✓ Approved'; }); }; });
      p.querySelector('#all').onclick = function () { var ids = rows.filter(function (r) { return r.class_id || ME.admin; }).map(function (r) { return r.student_id; }); approve(ids).then(function (r) { if (ok(r, ids.length + ' approved')) approvals(p); }); };
      wireRemove(p, function () { approvals(p); });
    });
  }

  /* ---------- activity log (admins): visits, sign-ups and logins ---------- */
  function activity(p, args) {
    var kind = args[0] || 'all', since = new Date(Date.now() - 7 * 864e5).toISOString();
    var q = S.db.from('site_events').select('*').gte('at', since).order('at', { ascending: false }).limit(1000);
    Promise.all([q, S.db.from('profiles').select('id,full_name')]).then(function (x) {
      var ev = x[0].data || [], nm = {}; (x[1].data || []).forEach(function (u) { nm[u.id] = u.full_name; });
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var visits = ev.filter(function (e) { return e.kind === 'visit'; }), uniq = {}; visits.forEach(function (e) { uniq[e.visitor || e.id] = 1; });
      var pages = {}; visits.forEach(function (e) { pages[e.path] = (pages[e.path] || 0) + 1; });
      var top = Object.keys(pages).sort(function (a, b) { return pages[b] - pages[a]; }).slice(0, 8);
      var list = ev.filter(function (e) { return kind === 'all' || e.kind === kind; }).slice(0, 300);
      var label = { visit: '👁 Visit', signup: '🆕 Sign-up', login: '🔑 Login' };
      p.innerHTML = '<div class="stats"><div class="stat"><span class="small muted">Visits today</span><b>' + visits.filter(function (e) { return new Date(e.at) >= today; }).length + '</b></div>' +
        '<div class="stat"><span class="small muted">Visitors (7 days)</span><b>' + Object.keys(uniq).length + '</b></div>' +
        '<div class="stat"><span class="small muted">Sign-ups (7 days)</span><b>' + ev.filter(function (e) { return e.kind === 'signup'; }).length + '</b></div>' +
        '<div class="stat"><span class="small muted">Logins (7 days)</span><b>' + ev.filter(function (e) { return e.kind === 'login'; }).length + '</b></div></div>' +
        (top.length ? '<section class="panel"><h3>Most visited pages (7 days)</h3>' + top.map(function (k) { return '<div class="row2"><span class="small">' + E(k) + '</span><span class="small muted">' + pages[k] + '</span></div>'; }).join('') + '</section>' : '') +
        '<nav class="tabs">' + [['all', 'Everything'], ['signup', 'Sign-ups'], ['login', 'Logins'], ['visit', 'Visits']].map(function (t) { return '<a href="#activity/' + t[0] + '" aria-selected="' + (t[0] === kind) + '">' + t[1] + '</a>'; }).join('') + '</nav>' +
        (list.length ? '<div class="tablewrap"><table class="marks"><tr><th>When</th><th>What</th><th>Who</th><th>Page / class</th><th>Device</th><th>Came from</th></tr>' + list.map(function (e) {
          return '<tr><td class="small">' + E(S.when(e.at)) + '</td><td>' + (label[e.kind] || E(e.kind)) + '</td><td>' + (e.user_id ? E(nm[e.user_id] || 'account') : '<span class="muted">visitor</span>') + '</td><td class="small">' + E(e.path || '') + '</td><td class="small">' + E(e.kind === 'login' ? (/Mobi|Android|iPhone/i.test(e.device || '') ? 'phone' : 'computer') : (e.device || '')) + '</td><td class="small">' + E(e.referrer || '') + '</td></tr>'; }).join('') + '</table></div>' : '<p class="emptybox">Nothing in the last 7 days yet.</p>') +
        '<p class="small muted">Visits record the page, time, device type and the site a visitor came from. No IP addresses are stored. Showing the last 7 days.</p>';
    });
  }



  /* ---------- virtual laboratory work (Simulations & Virtual Laboratories centre; table sim_attempts, migration 019) ---------- */
  var LABNAMES = { enzyme: 'Enzyme activity', osmosis: 'Osmosis', dna: 'DNA replication', heart: 'Heart and circulation', titration: 'Acid–base titration' };
  function labWork(p, args) {
    var cls = args[0] || '', which = args[1] || '';
    p.innerHTML = '<section class="panel"><div class="row2"><h3 style="margin:0">🔬 Lab work</h3><a class="btn sm" href="/simulations/" target="_blank">Open the Simulations centre</a></div>' +
      '<p class="small muted">Work students do in the virtual laboratories: their results tables, graphs, answers and marks. To set a lab for a class, use the class <b>📌 To-do list</b> and choose <b>🔬 Simulation</b>.</p>' +
      '<div class="row2" style="justify-content:flex-start;flex-wrap:wrap"><label class="f">Class<select id="lwc">' + classOpts(cls, 'All my classes') + '</select></label>' +
      '<label class="f">Laboratory<select id="lwl"><option value="">All laboratories</option>' + Object.keys(LABNAMES).map(function (k) { return '<option value="' + k + '"' + (k === which ? ' selected' : '') + '>' + E(LABNAMES[k]) + '</option>'; }).join('') + '</select></label></div>' +
      '<div id="lwsum"></div><div id="lwlist"><p class="muted">Loading…</p></div></section>';
    var go = function () { location.hash = 'labs/' + p.querySelector('#lwc').value + '/' + p.querySelector('#lwl').value; };
    p.querySelector('#lwc').onchange = go; p.querySelector('#lwl').onchange = go;
    labList(p.querySelector('#lwlist'), { cls: cls || null, which: which || null }, false, p.querySelector('#lwsum'));
  }
  function labList(box, f, compact, sumBox) {
    S.db.rpc('sim_work', { cls: f.cls || null, which: f.which || null, sid: f.sid || null }).then(function (r) {
      if (r.error) { box.innerHTML = (compact ? '<h3>🔬 Lab work</h3>' : '') + '<p class="small muted">' + (/sim_work|does not exist/i.test(r.error.message) ? 'Lab work appears here once migration 019 has been run.' : E(S.nice(r.error))) + '</p>'; return; }
      var rows = (r.data || []).filter(function (x) { return mine(x.student_id); });
      if (sumBox) {
        var by = {}; rows.forEach(function (x) { var b = by[x.sim] = by[x.sim] || { n: 0, sub: 0, pc: [], st: {} }; b.n++; b.st[x.student_id] = 1; if (x.submitted_at) b.sub++; if (x.max_score) b.pc.push(100 * x.score / x.max_score); });
        sumBox.innerHTML = Object.keys(by).length ? '<div class="tablewrap"><table class="marks"><tr><th>Laboratory</th><th>Students</th><th>Handed in</th><th>Mean mark</th></tr>' + Object.keys(by).map(function (k) { var b = by[k], m = b.pc.length ? Math.round(b.pc.reduce(function (s, v) { return s + v; }, 0) / b.pc.length) : null;
          return '<tr><td>' + E(LABNAMES[k] || k) + '</td><td>' + Object.keys(b.st).length + '</td><td>' + b.sub + ' / ' + b.n + '</td><td>' + (m == null ? '—' : m + ' %') + '</td></tr>'; }).join('') + '</table></div>' : '';
      }
      box.innerHTML = (compact ? '<h3>🔬 Lab work</h3>' : '') + (rows.length ? '<div class="tablewrap"><table class="marks"><tr>' + (compact ? '' : '<th>Student</th><th>Class</th>') + '<th>Laboratory</th><th>Trials</th><th>Hints</th><th>Mark</th><th>Status</th><th></th></tr>' +
        rows.map(function (x) { return '<tr>' + (compact ? '' : '<td>' + E(x.student || '') + '</td><td>' + E(x.class_name || '') + '</td>') + '<td>' + E(x.sim_title || LABNAMES[x.sim] || x.sim) + '</td><td>' + x.trials + '</td><td>' + x.hints + '</td><td>' + (+x.max_score ? (+x.score) + ' / ' + (+x.max_score) : 'not marked') + '</td>' +
          '<td class="small">' + (x.submitted_at ? '✓ handed in ' + E(S.when(x.submitted_at)) : 'in progress · ' + E(S.when(x.updated_at))) + '</td><td><button type="button" class="btn sm" data-lw="' + x.id + '">View</button></td></tr>'; }).join('') + '</table></div>'
        : '<p class="small muted">No laboratory work yet.</p>') + '<div id="lwview"></div>';
      box.querySelectorAll('[data-lw]').forEach(function (b) { b.onclick = function () { labView(box.querySelector('#lwview'), b.getAttribute('data-lw'), rows.filter(function (x) { return x.id === b.getAttribute('data-lw'); })[0]); }; });
    });
  }
  function labDoc(a, who) {
    var rows = a.data || [], cols = rows.length ? Object.keys(rows[0]).filter(function (k) { return k[0] !== '_'; }) : [], ans = a.answers || {}, sc = a.scores || {};
    var vars = {}; (a.variables || []).forEach(function (v) { vars[v[1]] = (vars[v[1]] || 0) + 1; });
    return '<h2 style="margin-top:0">' + E(a.sim_title || a.sim) + '</h2><p class="small">' + E(who) + ' · started ' + E(new Date(a.started_at).toLocaleString()) + (a.submitted_at ? ' · handed in ' + E(new Date(a.submitted_at).toLocaleString()) : ' · not handed in yet') +
      (+a.max_score ? ' · mark <b>' + (+a.score) + ' / ' + (+a.max_score) + '</b>' : '') + ' · ' + a.trials + ' trials' + (/^sim:/.test(a.sim) ? ' · simulation in ' + E((a.answers || {}).Page || 'a lesson') : ' · ' + a.hints + ' hints') + '</p>' +
      '<p class="small"><b>Controls changed:</b> ' + (Object.keys(vars).length ? Object.keys(vars).map(function (k) { return E(k) + ' (' + vars[k] + '×)'; }).join(', ') : 'none recorded') + '</p>' +
      (/^sim:/.test(a.sim) ? '' : '<h3>Hypothesis</h3><p style="white-space:pre-wrap">' + E(ans._hypothesis || '—') + '</p>' + (sc._hyp != null ? '<p class="small">Mark: ' + sc._hyp + '</p>' : '')) +
      '<h3>Results</h3>' + (rows.length ? '<div class="tablewrap"><table class="marks"><tr><th>#</th>' + cols.map(function (c) { return '<th>' + E(c) + '</th>'; }).join('') + '</tr>' + rows.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td>' + cols.map(function (c) { var v = r[c]; return '<td>' + E(typeof v === 'number' ? +v.toFixed(3) : v) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>' : '<p class="small muted">No results recorded.</p>') +
      (/^sim:/.test(a.sim) ? '' : '<h3>Answers</h3>') + (Object.keys(ans).filter(function (k) { return k !== '_hypothesis' && !(/^sim:/.test(a.sim)); }).map(function (k) { return '<p><b>' + E(k) + '</b> <span class="small">(' + (sc[k] == null ? 'not checked' : 'mark ' + sc[k]) + ')</span><br><span style="white-space:pre-wrap">' + E(ans[k] || '—') + '</span></p>'; }).join('') || (/^sim:/.test(a.sim) ? '' : '<p class="small muted">No answers yet.</p>'));
  }
  function labView(box, id, meta) {
    box.innerHTML = '<p class="muted">Loading…</p>';
    S.db.from('sim_attempts').select('*').eq('id', id).maybeSingle().then(function (r) {
      if (r.error || !r.data) { box.innerHTML = '<p class="msg">Could not open this lab work.</p>'; return; }
      var a = r.data, who = (meta && meta.student) || 'Student';
      box.innerHTML = '<section class="panel tint">' + labDoc(a, who) + '<label class="f">Comment for the student<textarea id="lwcm" rows="3">' + E(a.teacher_comment || '') + '</textarea></label>' +
        '<div class="acts"><button type="button" class="btn sm main" id="lwsave">Save comment</button><button type="button" class="btn sm" id="lwrep">📄 HTML report</button><button type="button" class="btn sm" id="lwx">Close</button></div></section>';
      box.querySelector('#lwx').onclick = function () { box.innerHTML = ''; };
      box.querySelector('#lwsave').onclick = function () { S.db.from('sim_attempts').update({ teacher_comment: box.querySelector('#lwcm').value.trim() || null }).eq('id', id).then(function (x) { ok(x, 'Comment saved'); }); };
      box.querySelector('#lwrep').onclick = function () {
        var w = window.open('', '_blank'); if (!w) { toast('Allow pop-ups to open the report.', true); return; }
        w.document.write('<!doctype html><meta charset="utf-8"><title>' + E(a.sim_title || a.sim) + ' · ' + E(who) + '</title><style>body{font:15px/1.5 system-ui,Arial;max-width:900px;margin:24px auto;padding:0 16px}table{border-collapse:collapse;width:100%;font-size:.9em}td,th{border:1px solid #ccc;padding:4px 6px;text-align:center}.tablewrap{overflow-x:auto}</style>' +
          labDoc(a, who) + (a.teacher_comment ? '<h3>Teacher\'s comment</h3><p style="white-space:pre-wrap">' + E(a.teacher_comment) + '</p>' : '') + '<p style="color:#666;font-size:.85em">BioscienceVista virtual laboratory report · BioscienceVista · biosciencevista.com</p>');
        w.document.close();
      };
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ---------- Science Help Desk: questions students send from /tutor/ (no AI) ---------- */
  var HD_NOTES = null;
  function hdWords(t) { return (String(t || '').toLowerCase().match(/[a-z0-9]+/g) || []).filter(function (w) { return w.length > 3; }); }
  function hdSuggest(q) {
    var qw = hdWords(q); if (!HD_NOTES || !qw.length) return [];
    return HD_NOTES.map(function (r) {
      var n = r.notes || {}, tt = hdWords(n.title + ' ' + (n.terms || []).map(function (x) { return x.term; }).join(' ')), bb = hdWords([n.intro, (n.points || []).join(' ')].join(' ')), sc = 0;
      qw.forEach(function (w) { if (tt.indexOf(w) >= 0) sc += 3; else if (bb.indexOf(w) >= 0) sc += 1; });
      return { r: r, sc: sc };
    }).filter(function (o) { return o.sc >= 3; }).sort(function (a, b) { return b.sc - a.sc; }).slice(0, 3).map(function (o) { return o.r; });
  }
  function helpDesk(p, args) {
    var show = args[0] || 'open';
    p.innerHTML = '<p class="muted">Loading…</p>';
    Promise.all([S.db.rpc('help_inbox', { only_open: show === 'open' }), HD_NOTES ? null : S.db.from('lesson_notes').select('lesson,step,notes').limit(2000)]).then(function (x) {
      if (x[1] && x[1].data) HD_NOTES = x[1].data;
      var r = x[0];
      if (r.error) { p.innerHTML = '<section class="panel"><h3>Student questions</h3><p class="msg">' + E(S.nice(r.error)) + '</p><p class="small muted">If this says the function does not exist, migration 018 has not been run yet.</p></section>'; return; }
      var rows = (r.data || []).filter(function (q) { return mine(q.student_id); });
      p.innerHTML = '<section class="panel"><div class="row2"><h3>Student questions</h3><span class="small muted">From the <a href="/tutor/" target="_blank">Science Help Desk</a>. Students see your answer there.</span></div>' +
        '<nav class="tabs"><a href="#questions/open" aria-selected="' + (show === 'open') + '">Waiting for an answer</a><a href="#questions/all" aria-selected="' + (show === 'all') + '">All questions</a></nav>' +
        (rows.length ? rows.map(function (q) {
          var sug = q.status === 'open' ? hdSuggest(q.question + ' ' + (q.topic || '')) : [];
          return '<article class="bkcard ' + (q.status === 'open' ? 'new' : 'done') + '" data-id="' + q.id + '"><div class="row2"><span><b>' + E(q.student || 'Student') + '</b>' + (q.class_name ? ' · ' + E(q.class_name) : '') +
            (q.course ? ' · ' + E(q.course) : '') + (q.topic ? ' · ' + E(q.topic) : '') + '</span><span class="small muted">' + E(S.when ? S.when(q.created_at) : new Date(q.created_at).toLocaleString()) + '</span></div>' +
            '<p style="white-space:pre-wrap"><b>Question:</b> ' + E(q.question) + '</p>' +
            (sug.length ? '<p class="small muted">From your notes: ' + sug.map(function (n, i) { return '<button type="button" class="btn sm" data-sug="' + i + '">＋ ' + E((n.notes || {}).title || n.lesson) + '</button>'; }).join(' ') + '</p>' : '') +
            '<label class="f">Your answer<textarea class="hda" rows="4">' + E(q.answer || '') + '</textarea></label>' +
            '<label class="small"><input type="checkbox" class="hdf"' + (q.public_faq ? ' checked' : '') + '> Share this question and answer with all students (their name is not shown)</label>' +
            '<div class="cta"><button class="btn main sm" data-act="answer" type="button">' + (q.answer ? 'Update answer' : 'Send answer') + '</button>' +
            (q.status !== 'closed' ? '<button class="btn sm" data-act="close" type="button">Close without answer</button>' : '') + '<button class="btn sm" data-act="delete" type="button">Delete</button></div></article>';
        }).join('') : '<p class="emptybox">' + (show === 'open' ? 'No questions are waiting. 🎉' : 'No questions yet.') + '</p>') + '</section>';
      p.querySelectorAll('article[data-id]').forEach(function (card) {
        var q = rows.filter(function (x) { return x.id === card.getAttribute('data-id'); })[0], ta = card.querySelector('.hda');
        var sug = q.status === 'open' ? hdSuggest(q.question + ' ' + (q.topic || '')) : [];
        card.querySelectorAll('[data-sug]').forEach(function (b) { b.onclick = function () {
          var n = sug[+b.getAttribute('data-sug')].notes || {};
          var qw = hdWords(q.question + ' ' + (q.topic || '')), rel = function (x) { var w = hdWords(x); return qw.filter(function (v) { return w.indexOf(v) >= 0; }).length; };
          var pts = (n.points || []).map(function (x) { return [x, rel(x)]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 3).filter(function (x, i) { return x[1] > 0 || i < 2; }).map(function (x) { return x[0]; });
          var t = (n.intro && rel(n.intro) ? n.intro + '\n' : '') + pts.map(function (x) { return '• ' + x; }).join('\n');
          ta.value = (ta.value.trim() ? ta.value.trim() + '\n\n' : '') + t; ta.focus(); }; });
        card.querySelectorAll('[data-act]').forEach(function (b) { b.onclick = function () {
          var act = b.getAttribute('data-act');
          if (act === 'delete') { if (!confirm('Delete this question for good?')) return; S.db.from('help_questions').delete().eq('id', q.id).then(function (r) { if (ok(r, 'Question deleted')) helpDesk(p, args); }); return; }
          if (act === 'close') { S.db.from('help_questions').update({ status: 'closed' }).eq('id', q.id).then(function (r) { if (ok(r, 'Closed')) helpDesk(p, args); }); return; }
          var a = ta.value.trim(); if (!a) { toast('Write the answer first.', true); return; }
          S.db.from('help_questions').update({ answer: a.slice(0, 8000), public_faq: card.querySelector('.hdf').checked }).eq('id', q.id).then(function (r) { if (ok(r, 'Answer sent to the student')) helpDesk(p, args); });
        }; });
      });
    });
  }

  /* ---------- private lesson bookings (admin) ---------- */
  function bookings(p, args) {
    var show = args[0] || 'new', LBL = { new: 'New', confirmed: 'Confirmed', done: 'Completed', declined: 'Declined', cancelled: 'Cancelled' };
    var PLAN = { single: 'One lesson', weekly: 'Weekly lessons', exam_prep: 'Exam preparation' };
    var nice = function (v) { try { return new Date(v).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return v; } };
    S.db.from('bookings').select('*').order('created_at', { ascending: false }).limit(300).then(function (r) {
      if (!ok(r)) return;
      var all = r.data || [], cnt = {}; all.forEach(function (b) { cnt[b.status] = (cnt[b.status] || 0) + 1; });
      var list = all.filter(function (b) { return show === 'all' || b.status === show; });
      p.innerHTML = '<div class="row2"><p class="muted">Requests from the <a href="/book/" target="_blank">Book a lesson</a> page. Only admins can see them.</p></div>' +
        '<nav class="tabs">' + ['new', 'confirmed', 'done', 'declined', 'all'].map(function (k) { return '<a href="#bookings/' + k + '" aria-selected="' + (k === show) + '">' + (k === 'all' ? 'All' : LBL[k]) + ' (' + (k === 'all' ? all.length : cnt[k] || 0) + ')</a>'; }).join('') + '</nav>' +
        (list.length ? list.map(function (b) {
          var slots = (b.slots || []).map(function (s) { return s.at || s; });
          var phone = (b.phone || '').replace(/[^\d+]/g, '').replace(/^\+/, '').replace(/^0/, '254');
          return '<article class="bkcard ' + b.status + '" data-id="' + b.id + '"><div class="row2"><span><b>' + E(b.subject) + '</b>' + (b.level ? ' · ' + E(b.level) : '') + ' <span class="pill">' + (b.mode === 'virtual' ? '💻 Virtual' : '🏫 Face to face') + '</span></span><span class="pill">' + E(LBL[b.status] || b.status) + '</span></div>' +
            '<div class="small"><b>' + E(b.contact_name) + '</b>' + (b.booker === 'parent' ? ' (parent of ' + E(b.student_name || 'student') + ')' : '') + ' · <a href="mailto:' + E(b.email) + '">' + E(b.email) + '</a>' + (b.phone ? ' · ' + E(b.phone) : '') + '</div>' +
            '<div class="small muted">' + E(PLAN[b.plan] || b.plan) + ' · ' + b.duration_min + ' min' + (b.location ? ' · ' + E(b.location) : '') + ' · sent ' + E(S.when(b.created_at)) + (b.timezone ? ' · their time zone ' + E(b.timezone) : '') + '</div>' +
            (b.message ? '<p class="small" style="white-space:pre-wrap">' + E(b.message) + '</p>' : '') +
            '<div class="two"><label class="f">Lesson time<select class="bslot">' + slots.map(function (s) { return '<option value="' + E(s) + '"' + (s === b.confirmed_slot ? ' selected' : '') + '>' + E(nice(s)) + '</option>'; }).join('') +
              '<option value="other"' + (b.confirmed_slot && slots.indexOf(b.confirmed_slot) < 0 ? ' selected' : '') + '>Another time…</option></select><input class="bother" type="datetime-local" value="' + (b.confirmed_slot && slots.indexOf(b.confirmed_slot) < 0 ? dt(b.confirmed_slot) : '') + '"' + (b.confirmed_slot && slots.indexOf(b.confirmed_slot) < 0 ? '' : ' hidden') + '></label>' +
            (b.mode === 'virtual' ? '<label class="f">Meeting link<input class="blink" type="url" placeholder="https://meet.google.com/…" value="' + E(b.meeting_link || '') + '"></label>' : '<span></span>') + '</div>' +
            '<label class="f">Private note (fee agreed, topics…)<textarea class="bnote" rows="2">' + E(b.teacher_note || '') + '</textarea></label>' +
            '<div class="cta"><button class="btn main sm" data-act="confirmed" type="button">Confirm</button><button class="btn sm" data-act="done" type="button">Mark completed</button><button class="btn sm" data-act="declined" type="button">Decline</button><button class="btn sm" data-act="save" type="button">Save note</button>' +
            '<a class="btn sm" data-reply="mail" href="#">✉ Email reply</a>' + (phone ? '<a class="btn sm" data-reply="wa" href="#" data-phone="' + E(phone) + '">WhatsApp</a>' : '') + '<button class="btn sm" data-act="delete" type="button">Delete</button></div></article>';
        }).join('') : '<p class="emptybox">No ' + (show === 'all' ? '' : (LBL[show] || '').toLowerCase() + ' ') + 'bookings.</p>');
      p.querySelectorAll('.bslot').forEach(function (sel) { sel.onchange = function () { sel.parentNode.querySelector('.bother').hidden = sel.value !== 'other'; }; });
      p.querySelectorAll('.bkcard').forEach(function (card) {
        var b = all.filter(function (x) { return x.id === card.getAttribute('data-id'); })[0];
        var slot = function () { var v = card.querySelector('.bslot').value; return v === 'other' ? iso(card.querySelector('.bother').value) : v; };
        var link = function () { var l = card.querySelector('.blink'); return l ? l.value.trim() : null; };
        var text = function (st) {
          var first = (b.booker === 'parent' ? b.contact_name : b.contact_name).split(' ')[0], when = slot() ? nice(slot()) : '';
          if (st === 'declined') return 'Dear ' + first + ',\n\nThank you for your request for ' + b.subject + ' lessons. Unfortunately I am not available at the times you suggested. Could you send me a few other times that suit you?\n\nBest wishes,\nBioscienceVista';
          return 'Dear ' + first + ',\n\nThank you for booking ' + b.subject + ' lessons' + (b.student_name ? ' for ' + b.student_name : '') + '. I am happy to confirm your lesson on ' + when + ' (' + b.duration_min + ' minutes).\n\n' +
            (b.mode === 'virtual' ? 'Join here: ' + (link() || '[meeting link]') + '\n\n' : 'Venue: ' + (b.location || '[venue]') + '\n\n') + 'Fee: [fee]\n\nPlease reply if you need to change anything.\n\nBest wishes,\nBioscienceVista';
        };
        card.querySelectorAll('[data-reply]').forEach(function (a) { a.onclick = function (e) { e.preventDefault();
          var st = b.status === 'declined' ? 'declined' : 'confirmed', t = text(st);
          if (a.getAttribute('data-reply') === 'mail') location.href = 'mailto:' + encodeURIComponent(b.email) + '?subject=' + encodeURIComponent((st === 'declined' ? 'Your lesson request: ' : 'Lesson confirmed: ') + b.subject) + '&body=' + encodeURIComponent(t);
          else window.open('https://wa.me/' + a.getAttribute('data-phone') + '?text=' + encodeURIComponent(t), '_blank', 'noopener'); }; });
        card.querySelectorAll('[data-act]').forEach(function (btn) { btn.onclick = function () {
          var act = btn.getAttribute('data-act'), note = card.querySelector('.bnote').value.trim() || null;
          if (act === 'delete') { if (!confirm('Delete this booking request for good?')) return; S.db.from('bookings').delete().eq('id', b.id).then(function (r) { if (ok(r, 'Booking deleted')) bookings(p, args); }); return; }
          var upd = { teacher_note: note, confirmed_slot: slot() || null, meeting_link: link() || null };
          if (act !== 'save') upd.status = act;
          if (act === 'confirmed' && !upd.confirmed_slot) { toast('Choose the lesson time first.', true); return; }
          S.db.from('bookings').update(upd).eq('id', b.id).then(function (r) {
            if (!ok(r, act === 'save' ? 'Saved' : 'Marked ' + (LBL[act] || act).toLowerCase() + (act === 'confirmed' ? ' — now send the reply' : ''))) return;
            if (act === 'confirmed' || act === 'declined') { b.status = act; b.confirmed_slot = upd.confirmed_slot; b.meeting_link = upd.meeting_link; card.className = 'bkcard ' + act; card.querySelector('.row2 > .pill:last-child').textContent = LBL[act]; var em = card.querySelector('[data-reply=mail]'); if (em) em.focus(); }
            else bookings(p, args);
          });
        }; });
      });
    });
  }
  /* ================= My classes (/teach/): the teacher's own classes ================= */
  function teachOverview(p) {
    var ids = CLASSES.map(function (c) { return c.id; });
    Promise.all([
      ids.length ? S.db.from('enrolments').select('class_id,status').in('class_id', ids) : Promise.resolve({ data: [] }),
      S.db.from('quiz_attempts').select('id,student_id,status,released, quizzes(show_results)').neq('status', 'in_progress').eq('released', false),
      S.db.from('student_results').select('title,score,max_score,recorded_at,student_id').order('recorded_at', { ascending: false }).limit(200)
    ]).then(function (x) {
      var en = x[0].data || [], per = {}; en.forEach(function (e) { per[e.class_id] = per[e.class_id] || { ok: 0, wait: 0 }; if (e.status === 'approved') per[e.class_id].ok++; else if (e.status === 'pending') per[e.class_id].wait++; });
      var nWait = en.filter(function (e) { return e.status === 'pending'; }).length;
      var toMark = (x[1].data || []).filter(function (a) { return mine(a.student_id) && (a.status === 'needs_marking' || (a.quizzes && !a.quizzes.show_results)); }).length;
      var res = (x[2].data || []).filter(function (r) { return mine(r.student_id); }).slice(0, 12);
      var nm = {}; return (res.length ? S.db.from('profiles').select('id,full_name').in('id', res.map(function (r) { return r.student_id; })) : Promise.resolve({ data: [] })).then(function (pr) {
        (pr.data || []).forEach(function (q) { nm[q.id] = q.full_name; });
        p.innerHTML = '<div class="stats"><div class="stat"><span class="small muted">Classes</span><b>' + CLASSES.length + '</b></div><div class="stat"><span class="small muted">Students</span><b>' + Object.keys(MINE).length + '</b></div>' +
          '<div class="stat"><span class="small muted">Asking to join</span><b><a href="#approvals">' + nWait + '</a></b></div><div class="stat"><span class="small muted">Answers to mark</span><b><a href="#marking">' + toMark + '</a></b></div></div>' +
          (!CLASSES.length ? '<p class="panel tint">Start by <a href="#classes">creating a class</a>: choose the course you teach and its BioscienceVista lessons and quizzes are added for you.</p>' : '') +
          (nWait ? '<p class="panel tint"><b>' + nWait + ' student' + (nWait > 1 ? 's are' : ' is') + ' asking to join your classes.</b> <a class="btn main sm" href="#approvals">Review requests</a></p>' : '') +
          (CLASSES.length ? '<h3>🏫 My classes</h3><div class="ccards">' + CLASSES.map(function (c) { var k = per[c.id] || { ok: 0, wait: 0 };
            return '<div class="ccard2" style="--k:' + hue(c.id) + '"><a href="#classes/' + c.id + '"><b>' + E(c.name) + '</b></a><span class="small">👥 ' + k.ok + ' student' + (k.ok === 1 ? '' : 's') + (k.wait ? ' · 🙋 ' + k.wait + ' waiting' : '') + '</span><span class="cc-main"><a href="#classes/' + c.id + '">Open class →</a><a href="#classes/' + c.id + '/status">🟢 Live work status</a><a href="#classes/' + c.id + '/todo">📌 Set work</a><a href="#classes/' + c.id + '/add">➕ Add lessons</a></span>' +
              '<details class="cc-more"><summary>More</summary><span><a href="#classes/' + c.id + '/lessons">🧪 Lessons</a><a href="#classes/' + c.id + '/quizzes">📝 Quizzes</a><a href="#classes/' + c.id + '/register">🗒 Register</a><a href="#classes/' + c.id + '/activity">👀 Activity</a><a href="' + '/board/?class=' + c.id + '&n=' + encodeURIComponent(c.name) + '">🖊 Whiteboard</a><a href="/live/?class=' + c.id + '">🎥 Live</a></span></details></div>'; }).join('') + '</div>' : '') +
                    '<section class="panel"><h3>Latest results</h3>' + (res.length ? '<div class="tablewrap"><table class="marks"><tr><th>Student</th><th>Task</th><th>Score</th></tr>' + res.map(function (r) { return '<tr><td>' + E(nm[r.student_id] || '–') + '</td><td>' + E(r.title) + '</td><td>' + E(r.score) + '/' + E(r.max_score) + '</td></tr>'; }).join('') + '</table></div>' : '<p class="small muted">No results yet.</p>') + '</section>' + (ME.admin ? '' : '<section class="panel" id="rvbox"></section>');
        if (!ME.admin) reviewBox(p.querySelector('#rvbox'));
      });
    });
  }
  function reviewBox(sec) {
    S.db.from('reviews').select('rating,body,status').eq('user_id', ME.user.id).maybeSingle().then(function (r) {
      var m0 = r.data;
      sec.innerHTML = '<h3>⭐ Review BioscienceVista</h3><p class="small muted">' + (m0 ? 'Your review is ' + (m0.status === 'approved' ? 'published' : 'waiting for approval') + '. You can change it.' : 'Tell other teachers how BioscienceVista helps your classes. Reviews appear on the home page after a check.') + '</p>' +
        '<form id="rvf" class="grp"><select id="rvs">' + [5, 4, 3, 2, 1].map(function (n) { return '<option value="' + n + '"' + (m0 && m0.rating === n ? ' selected' : '') + '>' + '★'.repeat(n) + '</option>'; }).join('') + '</select>' +
        '<textarea id="rvt" maxlength="600" rows="3" placeholder="What works well for you and your students?">' + E(m0 ? m0.body : '') + '</textarea><label class="chk"><input type="checkbox" id="rvn" checked> Show my full name</label><button class="btn main sm">Send review</button></form>';
      sec.querySelector('#rvf').onsubmit = function (e) { e.preventDefault(); S.db.rpc('submit_review', { stars: +sec.querySelector('#rvs').value, words: sec.querySelector('#rvt').value, show_full_name: sec.querySelector('#rvn').checked }).then(function (x) { ok(x, 'Thank you: your review will appear after a check.'); }); };
    });
  }
  function teachApprovals(p) {
    var ids = CLASSES.map(function (c) { return c.id; }), cn = {}; CLASSES.forEach(function (c) { cn[c.id] = c.name; });
    if (!ids.length) { p.innerHTML = '<p class="emptybox">Create a class first. Students then find it under your school and ask to join; their requests appear here.</p>'; return; }
    S.db.from('enrolments').select('id,student_id,class_id,status,requested_at').in('class_id', ids).in('status', ['pending', 'teacher_ok']).order('requested_at').then(function (r) {
      var rows = r.data || [];
      if (!rows.length) { p.innerHTML = '<p class="emptybox">Nobody is asking to join your classes right now.</p>'; return; }
      S.db.from('profiles').select('id,full_name').in('id', rows.map(function (x) { return x.student_id; })).then(function (pr) {
        var nm = {}; (pr.data || []).forEach(function (q) { nm[q.id] = q.full_name; });
        p.innerHTML = '<p><b>' + rows.length + '</b> request' + (rows.length === 1 ? '' : 's') + ' to join your classes</p><div class="tablewrap"><table class="marks"><tr><th>Student</th><th>Class</th><th>Asked</th><th></th></tr>' + rows.map(function (x) {
          return '<tr><td><b>' + E(nm[x.student_id] || 'Student') + '</b></td><td>' + E(cn[x.class_id] || '') + '</td><td class="small">' + E(S.when(x.requested_at)) + '</td><td>' +
            (x.status === 'teacher_ok' ? '<span class="pill">waiting for BioscienceVista to confirm</span>' : '<button class="btn main sm" type="button" data-ok="' + x.id + '">✓ Accept</button> <button class="btn sm" type="button" data-no="' + x.id + '">Decline</button>') + '</td></tr>'; }).join('') + '</table></div>' +
          '<p class="small muted">Students also need premium access to open lessons. BioscienceVista confirms every student a school teacher accepts.</p>';
        p.querySelectorAll('[data-ok],[data-no]').forEach(function (b) { b.onclick = function () { var yes = b.hasAttribute('data-ok'); b.disabled = true;
          S.db.rpc('decide_enrolment', { eid: b.getAttribute(yes ? 'data-ok' : 'data-no'), approve: yes }).then(function (q) { if (!ok(q, yes ? (q.data === 'teacher_ok' ? 'Accepted: sent to BioscienceVista to confirm' : 'Accepted') : 'Declined')) { b.disabled = false; return; } refs().then(function () { teachApprovals(p); }); }); }; });
      });
    });
  }
  var COURSES = null, TC = { cur: null, tab: 'students' };
  /* A teacher's courses. The BioscienceVista admin approves each one (migration 034); approving a course makes the teacher's class for it.
     MYC is null while the database has no course table yet: then everything works as before. */
  var MYC = null;
  function myCourses() {
    if (!TEACH) return Promise.resolve();
    return S.db.from('teacher_courses').select('course,status').eq('teacher_id', OWNER()).then(function (r) { MYC = r.error ? null : (r.data || []); }, function () { MYC = null; });
  }
  function courseRequests() {   // the courses ticked at sign-up are sent to the admin (once), in case the sign-up itself could not record them
    var none = function () {};
    return myCourses().then(function () {
      var md = (ME.user && ME.user.user_metadata) || {};
      if (MYC === null || ME.admin || !md.courses || !md.courses.length || md.courses_applied) return;
      var have = MYC.map(function (c) { return c.course; });
      return md.courses.filter(function (c) { return have.indexOf(c) < 0; }).reduce(function (p, c) { return p.then(function () { return S.db.rpc('request_course', { course_slug: c }).then(none, none); }); }, Promise.resolve())
        .then(function () { return S.db.auth.updateUser({ data: { courses_applied: true } }).then(none, none); }).then(myCourses);
    }).then(none, none);
  }
  function coursePanel(el) {
    if (!el) return;
    if (MYC === null || (ME.admin && !AS)) { el.innerHTML = ''; return; }
    var viewing = ME.admin;   // the admin looking at a teacher's classroom: decisions are made in Admin → Teachers
    courseList().then(function (cs) {
      var nm = {}; cs.forEach(function (k) { nm[k.slug] = k.name; });
      var lab = { approved: '<span class="pill ok">✓ Approved</span>', pending: '<span class="pill t">⏳ Waiting for the admin</span>', declined: '<span class="pill">Not approved</span>' };
      el.innerHTML = '<section class="panel grp"><h3 style="margin:0 0 6px">📚 My courses</h3><p class="small muted">These are the courses you chose when you signed up. The BioscienceVista admin approves each one; when a course is approved, your class for it is made and you can add more classes for that course. ' +
        (viewing ? '' : 'Only the admin can add a course for you: <a href="/messages/">send a message</a> to ask.') + '</p>' +
        (MYC.length ? MYC.slice().sort(function (a, b) { return (nm[a.course] || a.course).localeCompare(nm[b.course] || b.course); }).map(function (c) {
          return '<div class="row2" style="padding:5px 0;border-bottom:1px solid var(--line)"><span><b>' + E(nm[c.course] || c.course) + '</b></span><span class="cta">' + (lab[c.status] || '') + '</span></div>'; }).join('') : '<p class="small">No course yet.</p>') + '</section>';
    });
  }
  function firstClasses() {
    var md = (ME.user && ME.user.user_metadata) || {}, tried = false; try { tried = sessionStorage.getItem('bv-classes-tried') === '1'; } catch (e) {}
    if (MYC !== null || !TEACH || ME.admin || CLASSES.length || ARCHIVED.length || !md.courses || !md.courses.length || md.courses_applied || tried) return;   // since migration 034 the admin approves each course, and approval makes the class
    try { sessionStorage.setItem('bv-classes-tried', '1'); } catch (e) {}
    return courseList().then(function (cs) { var name = {}; cs.forEach(function (k) { name[k.slug] = k.name; });
      return md.courses.filter(function (c) { return name[c]; }).reduce(function (p, c) { return p.then(function () { return S.db.rpc('create_school_class', { nm: name[c], course_slug: c, descr: null, is_listed: true }).then(function () {}, function () {}); }); }, Promise.resolve());
    }).then(function () { return S.db.auth.updateUser({ data: { courses_applied: true } }).then(function () {}, function () {}); }).then(refs).then(function () { if (CLASSES.length) toast('Your classes are ready: ' + CLASSES.map(function (c) { return c.name; }).join(', ')); }, function () {});
  }
  function courseList() { return COURSES ? Promise.resolve(COURSES) : S.db.rpc('course_list').then(function (r) { COURSES = r.data || []; return COURSES; }); }
  function teachClasses(p, args) {
    if (args && args[0] && args[1] === 'add') { TC.cur = args[0]; TC.tab = 'materials'; TC.madd = true; }
    else if (args && args[0] && args[1] === 'manage') { TC.cur = args[0]; TC.tab = 'students'; }   // #classes/<id>/add: straight to "Add from main site"
    else if (args && args[0]) return refs().then(function () { classPage(p, args[0], args[1]); });
    refs().then(function () {
      if (!TC.cur || !CLASSES.some(function (c) { return c.id === TC.cur; })) TC.cur = CLASSES[0] ? CLASSES[0].id : null;
      var c = CLASSES.filter(function (x) { return x.id === TC.cur; })[0];
      p.innerHTML = '<section class="panel grp"><div class="row2"><h3 style="margin:0">🏫 My classes</h3><span class="cta"><button class="btn sm" type="button" id="chs">🏫 ' + E(ME.profile.school_name || 'Set your school') + '</button>' + (ME.admin && AS ? '' : '<button class="btn main sm" type="button" id="newc">＋ New class</button>') + '</span></div>' +
        (CLASSES.length ? '<div class="cchips">' + CLASSES.map(function (x) { return '<button type="button" class="cchip' + (x.id === TC.cur ? ' on' : '') + '" style="--k:' + hue(x.id) + '" data-c="' + x.id + '">' + E(x.name) + (x.active ? '' : ' (closed)') + '</button>'; }).join('') + '</div>' : '<p class="small muted">' + (MYC !== null && !ME.admin ? 'No classes yet. Your class for a course is made when the BioscienceVista admin approves the course (see My courses below).' : 'No classes yet. Press ＋ New class and choose the course you teach.') + '</p>') +
        '<div id="newbox"></div></section><div id="mycbox"></div><div id="cbox"></div>';
      myCourses().then(function () { coursePanel(p.querySelector('#mycbox')); });
      if (ARCHIVED.length) {   // the teacher's archived classes: restore any of them (the admin can also remove them to the bin)
        var ad = document.createElement('details'); ad.className = 'panel'; ad.innerHTML = '<summary style="cursor:pointer;font-weight:700">🗄 Archived classes (' + ARCHIVED.length + ')</summary><p class="small muted">Archived classes keep their students\' results. Restore a class to use it again.</p>' +
          ARCHIVED.map(function (x) { return '<div class="row2" style="padding:6px 0;border-bottom:1px solid var(--line)"><span><b>' + E(x.name) + '</b> <span class="small muted">archived ' + E(S.when(x.archived_at)) + '</span></span><span class="cta"><button type="button" class="btn sm" data-unarc="' + x.id + '">↩ Restore</button>' + (ME.admin ? ' <button type="button" class="btn sm" data-binc="' + x.id + '" style="--c:#b91c1c">Remove</button>' : '') + '</span></div>'; }).join('');
        p.querySelector('#mycbox').before(ad);
        ad.querySelectorAll('[data-unarc]').forEach(function (b) { b.onclick = function () { S.db.rpc('archive_class', { cid: b.getAttribute('data-unarc'), archive: false }).then(function (r) { if (ok(r, 'Class restored')) refs().then(function () { teachClasses(p); }); }); }; });
        ad.querySelectorAll('[data-binc]').forEach(function (b) { b.onclick = function () { removeClass(p, b.getAttribute('data-binc')); }; });
      }
      if (p.querySelector('#newc')) p.querySelector('#newc').onclick = function () { classForm(p.querySelector('#newbox'), null, p); };
      p.querySelector('#chs').onclick = function () { changeSchool(p); };
      p.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { TC.cur = b.getAttribute('data-c'); TC.tab = 'students'; teachClasses(p); }; });
      if (c) { classBox(p.querySelector('#cbox'), c, p); lessonRequests(c, p); if (args && (args[1] === 'add' || args[1] === 'manage')) setTimeout(function () { var tb = p.querySelector('#tab'); if (tb) tb.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 400); }
    });
  }
  function changeSchool(p) {
    S.db.from('schools').select('name').order('name').then(function (r) {
      var box = p.querySelector('#newbox');
      box.innerHTML = '<div class="grp" style="margin-top:10px"><label class="f">Your school (choose from the list, or type a new one)<input id="scn" list="scl" maxlength="120" value="' + E(ME.profile.school_name || '') + '"><datalist id="scl">' + (r.data || []).map(function (x) { return '<option value="' + E(x.name) + '">'; }).join('') + '</datalist></label>' +
        '<div class="cta"><button class="btn main sm" type="button" id="scs">Save</button><button class="btn sm" type="button" id="scx">Cancel</button></div><p class="small muted">Students find your classes under this school name.</p></div>';
      box.querySelector('#scx').onclick = function () { box.innerHTML = ''; };
      box.querySelector('#scs').onclick = function () { S.db.rpc('set_my_school', { nm: box.querySelector('#scn').value }).then(function (x) { if (!ok(x, 'School saved')) return; ME.profile.school_name = x.data; teachClasses(p); }); };
    });
  }
  function classForm(box, c, p) {
    courseList().then(function (cs) {
      if (MYC !== null && !ME.admin) {   // only the courses the admin has approved for this teacher
        var yes = MYC.filter(function (x) { return x.status === 'approved'; }).map(function (x) { return x.course; });
        cs = cs.filter(function (k) { return yes.indexOf(k.slug) >= 0 || (c && c.course === k.slug); });
        if (!cs.length) { box.innerHTML = '<p class="msg" style="margin-top:10px">None of your courses is approved yet. You can make classes as soon as the BioscienceVista admin approves a course (see <b>My courses</b>).</p>'; return; }
      }
      box.innerHTML = '<form class="grp" id="cf" style="margin-top:10px"><label class="f">What do you teach in this class?<select id="cc" required><option value="">Choose the course…</option>' +
        cs.map(function (k) { return '<option value="' + E(k.slug) + '"' + (c && c.course === k.slug ? ' selected' : '') + '>' + E(k.name) + ' (' + k.lessons + ' lessons' + (k.quizzes ? ', ' + k.quizzes + ' quizzes' : '') + ')</option>'; }).join('') + '</select></label>' +
        '<p class="small muted">Only that course\'s BioscienceVista lessons and quizzes are added to the class. You can untick any you don\'t need under 📘 Lessons, and add your own in Lesson builder and Content.</p>' +
        '<label class="f">Class name (students search for it)<input id="cn" required maxlength="80" value="' + E(c ? c.name : '') + '" placeholder="e.g. DP1 Biology HL 2026"></label>' +
        '<label class="f">Short description (optional)<input id="cd" maxlength="160" value="' + E(c && c.description || '') + '"></label>' +
        '<label class="chk"><input type="checkbox" id="cli"' + (!c || c.listed ? ' checked' : '') + '> Students can find this class and ask to join</label>' +
        '<div class="cta"><button class="btn main sm" type="submit">' + (c ? 'Save' : 'Create class') + '</button>' + (c ? '<button class="btn sm" type="button" id="carch">' + (c.active ? 'Close class' : 'Reopen class') + '</button>' : '') + '<button class="btn sm" type="button" id="cx">Cancel</button></div></form>';
      box.querySelector('#cx').onclick = function () { box.innerHTML = ''; };
      box.querySelector('#cf').onsubmit = function (e) { e.preventDefault(); var course = box.querySelector('#cc').value;
        var row = { name: box.querySelector('#cn').value.trim(), description: box.querySelector('#cd').value.trim() || null, listed: box.querySelector('#cli').checked };
        if (!course) return toast('Choose the course you teach.', true); if (row.name.length < 3) return toast('Give the class a name.', true);
        if (!c) return S.db.rpc('create_school_class', { nm: row.name, course_slug: course, descr: row.description, is_listed: row.listed }).then(function (r) { if (!ok(r, 'Class created')) return; TC.cur = r.data; TC.tab = 'materials'; teachClasses(p); });
        S.db.from('classes').update(row).eq('id', c.id).then(function (r) { if (!ok(r)) return;
          (course !== c.course ? S.db.rpc('set_class_course', { cid: c.id, course_slug: course }) : Promise.resolve({})).then(function (x) { if (ok(x, 'Saved')) teachClasses(p); }); }); };
      var ar = box.querySelector('#carch'); if (ar) ar.onclick = function () { S.db.from('classes').update({ active: !c.active }).eq('id', c.id).then(function (r) { if (ok(r, c.active ? 'Class closed' : 'Class reopened')) teachClasses(p); }); };
      if (c) transferBox(box, c, p);
    });
  }
  /* Edit class → transfer students to another of the teacher's classes (17 Nov 2026, admin). Results stay with each student. */
  function transferBox(box, c, p) {
    var others = CLASSES.filter(function (o) { return o.id !== c.id && o.owner_kind !== 'main'; }), d = document.createElement('section');
    d.className = 'panel grp'; d.style.marginTop = '12px'; box.appendChild(d);
    if (!others.length) { d.innerHTML = '<h4 style="margin:0">🔀 Transfer students</h4><p class="small muted">Make another class first; then you can move students into it here.</p>'; return; }
    d.innerHTML = '<p class="small muted">Loading students…</p>';
    S.db.from('enrolments').select('student_id').eq('class_id', c.id).eq('status', 'approved').then(function (r) {
      var ids = (r.data || []).map(function (e) { return e.student_id; });
      if (!ids.length) { d.innerHTML = '<h4 style="margin:0">🔀 Transfer students</h4><p class="small muted">No students in this class yet.</p>'; return; }
      S.db.from('profiles').select('id,full_name').in('id', ids).then(function (pr) {
        var nm = {}; (pr.data || []).forEach(function (x) { nm[x.id] = x.full_name || 'Student'; }); ids.sort(function (a, b) { return (nm[a] || '').localeCompare(nm[b] || ''); });
        d.innerHTML = '<h4 style="margin:0 0 6px">🔀 Transfer students to another class</h4><p class="small muted">Tick the students, choose the class and press Transfer. Their past results and work stay with them.</p>' +
          '<div class="row2" style="gap:8px;align-items:center;flex-wrap:wrap"><label class="chk" style="margin:0"><input type="checkbox" id="tr-all"> Select all (' + ids.length + ')</label>' +
          '<select id="tr-to" aria-label="Move to class"><option value="">Move to…</option>' + others.map(function (o) { return '<option value="' + o.id + '">' + E(o.name) + '</option>'; }).join('') + '</select>' +
          '<button type="button" class="btn main sm" id="tr-go">🔀 Transfer</button><span class="small muted" id="tr-n"></span></div>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr));gap:4px;margin-top:8px;max-height:280px;overflow:auto">' + ids.map(function (id) { return '<label class="chk" style="margin:0"><input type="checkbox" data-tr="' + id + '"> ' + E(nm[id] || 'Student') + '</label>'; }).join('') + '</div>';
        var boxes = function () { return [].slice.call(d.querySelectorAll('[data-tr]')); }, count = function () { var n = boxes().filter(function (x) { return x.checked; }).length; d.querySelector('#tr-n').textContent = n ? n + ' selected' : ''; };
        d.querySelector('#tr-all').onchange = function () { var on = this.checked; boxes().forEach(function (x) { x.checked = on; }); count(); };
        boxes().forEach(function (x) { x.onchange = count; });
        d.querySelector('#tr-go').onclick = function () {
          var to = d.querySelector('#tr-to').value, sel = boxes().filter(function (x) { return x.checked; }).map(function (x) { return x.getAttribute('data-tr'); }), btn = this;
          if (!sel.length) return toast('Tick at least one student.', true); if (!to) return toast('Choose the class to move them to.', true);
          var name = d.querySelector('#tr-to').selectedOptions[0].text;
          if (!confirm('Move ' + sel.length + ' student' + (sel.length > 1 ? 's' : '') + ' from ' + c.name + ' to ' + name + '?')) return;
          btn.disabled = true; var done = 0, fail = 0;
          sel.reduce(function (pr, sid) { return pr.then(function () { return S.db.rpc('teacher_move_student', { sid: sid, from_cid: c.id, to_cid: to }).then(function (x) { if (x.error) fail++; else done++; }); }); }, Promise.resolve())
            .then(function () { toast(done + ' moved to ' + name + (fail ? ' · ' + fail + ' could not be moved' : ''), !!fail); refs().then(function () { teachClasses(p); }); });
        };
      });
    });
  }
  /* Students in a teacher's class see only the lessons added to the class. They can ask for another BioscienceVista lesson; the teacher decides here.
     Approving adds the lesson to the class for everyone in it. (Needs migration 031; before that the list is simply empty.) */
  function lessonRequests(c, p) {
    var old = p.querySelector('#lreq'); if (old) old.remove();
    var ask = function (cols) { return S.db.from('material_requests').select(cols).eq('class_id', c.id).eq('status', 'pending').order('created_at'); };
    ask('id,note,created_at,student_id,lessons(title),quizzes(title),profiles(full_name)').then(function (r) { return r.error ? ask('id,note,created_at,student_id,lessons(title),profiles(full_name)') : r; }).then(function (r) {
      var rows = r.data || []; if (r.error || !rows.length) return;
      var d = document.createElement('section'); d.id = 'lreq'; d.className = 'panel tint grp';
      d.innerHTML = '<h3 style="margin:0">🙋 Lesson requests for ' + E(c.name) + ' (' + rows.length + ')</h3><p class="small muted">Approving opens the lesson or question set for all the students of this class.</p>' + rows.map(function (x) {
        return '<div class="row2" style="padding:8px 0;border-bottom:1px solid var(--line)"><span><b>' + E((x.profiles || {}).full_name || 'A student') + '</b> asks for ' + (x.quizzes ? 'the exam-style questions ' : 'the lesson ') + '<b>' + E((x.quizzes || x.lessons || {}).title || 'an item') + '</b>' + (x.note ? '<br><span class="small muted">“' + E(x.note) + '”</span>' : '') + '</span>' +
          '<span class="cta"><button type="button" class="btn main sm" data-yes="' + x.id + '">Approve</button><button type="button" class="btn sm" data-no="' + x.id + '">Decline</button></span></div>'; }).join('');
      var cb = p.querySelector('#cbox'); if (!cb) return; cb.parentNode.insertBefore(d, cb);
      d.querySelectorAll('[data-yes],[data-no]').forEach(function (b) { b.onclick = function () { var yes = b.hasAttribute('data-yes'); b.disabled = true;
        S.db.rpc('decide_material_request', { rid: b.getAttribute(yes ? 'data-yes' : 'data-no'), yes: yes }).then(function (x) { if (ok(x, yes ? 'Opened for the class' : 'Request declined')) { MATS = {}; classBox(p.querySelector('#cbox'), c, p); lessonRequests(c, p); } else b.disabled = false; }); }; });
    }, function () {});
  }
  function classBox(box, c, p) {
    var tabs = [['students', '👥 Students'], ['materials', '📘 Lessons'], ['qz', '📝 Quizzes'], ['team', '🤝 Co-teachers']];
    box.innerHTML = '<section class="panel grp"><div class="row2 cband" style="--k:' + hue(c.id) + '"><div><h3 style="margin:0">' + E(c.name) + '</h3><p class="small muted">' + E([c.subject, c.level].filter(Boolean).join(' · ')) +
      (c.listed ? ' · students find it under <b>' + E(c.school_name || ME.profile.school_name || 'your name') + '</b>' : ' · hidden from the join list') + '</p></div>' +
      '<span class="cta"><button class="btn sm" type="button" id="sync" title="Add any new BioscienceVista lessons and quizzes for this course">⟳ Add new course lessons</button><button class="btn sm" type="button" id="edc">Edit</button><button class="btn sm" type="button" id="carc" title="Archive this class: students keep their results; you can restore it later">🗄 Archive</button></span></div><div id="edbox"></div>' +
      '<p class="qlinks"><a style="--k:#16a34a" href="#classes/' + c.id + '/status">🟢 Live work status: what each student is doing now →</a><a style="--k:#0d9488" href="#classes/' + c.id + '">📂 Open the class page: to-do list, register, results, whiteboard, live lessons →</a></p>' +
      '<div class="cchips" role="tablist">' + tabs.map(function (t, i) { return '<button type="button" class="cchip' + (TC.tab === t[0] ? ' on' : '') + '" style="--k:' + ['#4f46e5', '#0d9488', '#ca8a04', '#ea580c'][i] + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div id="tab"></div></section>';
    box.querySelector('#edc').onclick = function () { classForm(box.querySelector('#edbox'), c, p); };
    box.querySelector('#carc').onclick = function () {
      if (!confirm('Archive ' + c.name + '?\n\nIt leaves your class list and its students lose access to its lessons and quizzes. Their results are kept, and you can restore the class at any time under Archived classes.')) return;
      S.db.rpc('archive_class', { cid: c.id, archive: true }).then(function (r) { if (!ok(r, 'Class archived')) return; TC.cur = null; refs().then(function () { teachClasses(p); }); }); };
    box.querySelector('#sync').onclick = function () { var b = this; b.disabled = true; S.db.rpc('set_class_course', { cid: c.id, course_slug: null }).then(function (x) { b.disabled = false; if (!ok(x)) return;
      toast(c.course ? 'Added ' + x.data.lessons + ' new lessons and ' + x.data.quizzes + ' new quizzes.' : 'Choose the course first: press Edit.'); MATS = {}; classBox(box, c, p); }); };
    box.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { TC.tab = b.getAttribute('data-t'); classBox(box, c, p); }; });
    ({ students: tcStudents, materials: tcMaterials, qz: tcQuizzes, team: tcTeam })[TC.tab](box.querySelector('#tab'), c);
  }
  function tcNames(ids) { return ids.length ? S.db.from('profiles').select('id,full_name').in('id', ids).then(function (r) { var o = {}; (r.data || []).forEach(function (q) { o[q.id] = q.full_name; }); return o; }) : Promise.resolve({}); }
  function tcStudents(t, c) {
    S.db.from('enrolments').select('id,student_id,status,requested_at').eq('class_id', c.id).order('requested_at').then(function (r) {
      var en = r.data || [];
      tcNames(en.map(function (e) { return e.student_id; })).then(function (nm) {
        var wait = en.filter(function (e) { return e.status === 'pending'; }), held = en.filter(function (e) { return e.status === 'teacher_ok'; }), okk = en.filter(function (e) { return e.status === 'approved'; });
        var others = CLASSES.filter(function (o) { return o.id !== c.id && o.owner_kind !== 'main'; });   // the teacher's other open classes
        okk.sort(function (a, b) { return (nm[a.student_id] || '').localeCompare(nm[b.student_id] || ''); });
        t.innerHTML = '<h4>Requests to join (' + wait.length + ')</h4>' + (wait.length ? wait.map(function (e) { return '<div class="row2" style="padding:6px 0;border-bottom:1px solid var(--line)"><span><b>' + E(nm[e.student_id] || 'Student') + '</b> <span class="small muted">asked ' + E(S.when(e.requested_at)) + '</span></span><span class="cta"><button class="btn main sm" data-ok="' + e.id + '">Accept</button><button class="btn sm" data-no="' + e.id + '">Decline</button></span></div>'; }).join('') : '<p class="small muted">None.</p>') +
          (held.length ? '<h4>Waiting for BioscienceVista to confirm (' + held.length + ')</h4>' + held.map(function (e) { return '<p>' + E(nm[e.student_id] || 'Student') + '</p>'; }).join('') : '') +
          '<h4>Students in this class (' + okk.length + ')</h4>' + (okk.length ? okk.map(function (e) { return '<div class="row2" style="padding:6px 0;border-bottom:1px solid var(--line)"><span><a href="#students/' + e.student_id + '">' + E(nm[e.student_id] || 'Student') + '</a></span><span class="cta">' + (others.length ? '<select class="btn sm" data-mv="' + e.student_id + '" aria-label="Move to another class"><option value="">Move to…</option>' + others.map(function (o) { return '<option value="' + o.id + '">' + E(o.name) + '</option>'; }).join('') + '</select>' : '') + '<a class="btn sm" href="/messages/">Message</a><button class="btn sm" data-no="' + e.id + '">Remove</button></span></div>'; }).join('') : '<p class="small muted">No students yet. They find your class under your school and ask to join, or add them below.</p>') +
          '<h4>➕ Add existing students</h4><p class="small muted">Search for students of your school or of your other classes by name, student number or email, and add them to <b>' + E(c.name) + '</b>.</p>' +
          '<div class="row2"><input id="sfind" placeholder="Name, student number or email" style="flex:1"><button type="button" class="btn sm" id="sgo">Search</button></div><div id="sres"></div>';
        t.querySelectorAll('[data-ok],[data-no]').forEach(function (b) { b.onclick = function () { var yes = b.hasAttribute('data-ok');
          if (!yes && !b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Click again to confirm'; return; }
          S.db.rpc('decide_enrolment', { eid: b.getAttribute(yes ? 'data-ok' : 'data-no'), approve: yes }).then(function (x) { if (ok(x, yes ? 'Accepted' : 'Done')) refs().then(function () { tcStudents(t, c); }); }); }; });
        t.querySelectorAll('[data-mv]').forEach(function (sel) { sel.onchange = function () { var to = sel.value; if (!to) return; var name = sel.options[sel.selectedIndex].text;
          if (!confirm('Move ' + (nm[sel.getAttribute('data-mv')] || 'this student') + ' to ' + name + '? Their past results stay with them.')) { sel.value = ''; return; }
          S.db.rpc('teacher_move_student', { sid: sel.getAttribute('data-mv'), from_cid: c.id, to_cid: to }).then(function (x) { if (ok(x, 'Moved to ' + name)) refs().then(function () { tcStudents(t, c); }); }); }; });
        var find = function () { var q = t.querySelector('#sfind').value.trim(), out = t.querySelector('#sres'); if (q.length < 2) { out.innerHTML = '<p class="small muted">Type at least 2 letters.</p>'; return; }
          out.innerHTML = '<p class="small muted">Searching…</p>';
          S.db.rpc('teacher_find_students', { q: q }).then(function (x) {
            if (x.error) { out.innerHTML = '<p class="small">' + E(S.nice(x.error)) + '</p>'; return; }
            var rows = (x.data || []).filter(function (s2) { return !okk.some(function (e) { return e.student_id === s2.id; }); });
            out.innerHTML = rows.length ? rows.map(function (s2) { return '<div class="row2" style="padding:6px 0;border-bottom:1px solid var(--line)"><span><b>' + E(s2.full_name || 'Student') + '</b> <span class="small muted">' + E([s2.student_number, s2.school_name, s2.classes ? 'in ' + s2.classes : 'no class'].filter(Boolean).join(' · ')) + '</span></span><button type="button" class="btn main sm" data-add="' + s2.id + '">Add to class</button></div>'; }).join('')
              : '<p class="small muted">No students found who are not already in this class.</p>';
            out.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () { b.disabled = true;
              S.db.rpc('teacher_add_student', { sid: b.getAttribute('data-add'), cid: c.id }).then(function (y) { if (!ok(y, y.data === 'approved' ? 'Added to the class' : 'Added: waiting for BioscienceVista to confirm')) { b.disabled = false; return; } refs().then(function () { tcStudents(t, c); }); }); }; });
          }); };
        t.querySelector('#sgo').onclick = find; t.querySelector('#sfind').onkeydown = function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); find(); } };
      });
    });
  }
  var CAT = null;
  function tcMaterials(t, c) {
    Promise.all([CAT ? Promise.resolve({ data: CAT }) : S.db.from('materials').select('*').order('sort'), S.db.from('class_materials').select('path,sort').eq('class_id', c.id)]).then(function (x) {
      CAT = x[0].data || []; var have = {}; (x[1].data || []).forEach(function (m) { have[m.path] = 1; });
      // main-site courses: an IB subject splits into HL (SL and HL + HL only) and SL (SL and HL); others go by subject and grade
      var coursesOf = function (m) { return m.level === 'HL only' ? [m.subject + ' HL'] : m.level === 'SL and HL' ? [m.subject + ' HL', m.subject + ' SL'] : [m.subject + (m.level ? ' · ' + m.level : '')]; };
      var courses = []; CAT.forEach(function (m) { coursesOf(m).forEach(function (k) { if (courses.indexOf(k) < 0) courses.push(k); }); }); courses.sort();
      var mine = [c.subject, (c.level || '').toUpperCase()].filter(Boolean).join(' '), mode = TC.madd ? 'out' : 'in';
      if (!document.getElementById('tcm-css')) { var st = document.createElement('style'); st.id = 'tcm-css';
        st.textContent = '.tcm-seg{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px}.tcm-seg button{border:2px solid #e2e8f0;background:#fff;border-radius:999px;padding:7px 14px;font:700 14px Outfit,system-ui,sans-serif;cursor:pointer;color:#334155}.tcm-seg button.on{background:#0d9488;border-color:#0d9488;color:#fff}' +
          '.tcm-bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}.tcm-bar select,.tcm-bar input{flex:1 1 200px;min-width:0}.tcm-row{display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid var(--line)}.tcm-row span{flex:1;min-width:0}.tcm-row a{color:inherit;text-decoration:none}.tcm-row a:hover{text-decoration:underline}' +
          '.tcm-add{background:#0d9488;color:#fff;border:0;border-radius:8px;padding:5px 12px;font-weight:700;cursor:pointer}.tcm-rm{background:none;border:1px solid #e2e8f0;border-radius:8px;padding:4px 9px;cursor:pointer;color:#64748b}.tcm-top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:4px 0}'; document.head.appendChild(st); }
      t.innerHTML = '<div class="tcm-seg"><button type="button" data-m="in">📘 In this class (<b id="mn">' + Object.keys(have).length + '</b>)</button><button type="button" data-m="out">➕ Add from main site</button></div>' +
        '<div class="tcm-bar"><select id="mcourse" aria-label="Main-site course"><option value="">All courses</option>' + courses.map(function (k) { return '<option' + (k === mine && mode === 'out' ? ' selected' : '') + '>' + E(k) + '</option>'; }).join('') + '</select><input id="mq" placeholder="🔍 Search" aria-label="Search"></div>' +
        '<div class="tcm-top" id="mtop"></div><div id="mlist"></div>';
      var save = function (pth, add) { return (add ? S.db.from('class_materials').insert({ class_id: c.id, path: pth, added_by: ME.user.id, sort: Object.keys(have).length }) : S.db.from('class_materials').delete().eq('class_id', c.id).eq('path', pth)).then(function (r) {
        if (r.error) { toast(S.nice(r.error), true); return false; } if (add) have[pth] = 1; else delete have[pth]; delete MATS[c.id]; t.querySelector('#mn').textContent = Object.keys(have).length; return true; }); };
      var list = function () {
        t.querySelectorAll('[data-m]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-m') === mode); });
        var q = t.querySelector('#mq').value.trim().toLowerCase(), crs = t.querySelector('#mcourse').value;
        var all = CAT.filter(function (m) { return (mode === 'in') === !!have[m.path] && (!crs || coursesOf(m).indexOf(crs) >= 0) && (!q || (m.title + ' ' + (m.unit || '')).toLowerCase().indexOf(q) >= 0); }), rows = all.slice(0, 400);
        t.querySelector('#mtop').innerHTML = mode === 'out' && all.length ? '<span class="small muted">' + all.length + ' to add</span><button type="button" class="tcm-add" id="maddall">➕ Add all ' + all.length + '</button>' : '';
        var mrows = function (list) { var last = ''; return list.map(function (m) { var u = /^MYP /.test(m.subject || '') && m.unit ? m.unit : (m.unit || m.subject), hd = u !== last ? '<p class="label" style="margin-top:10px">' + E(u) + '</p>' : ''; last = u;
          return hd + '<div class="tcm-row"><span><a href="' + E(m.path) + '" target="_blank" rel="noopener">' + E(m.title) + '</a>' + (m.level === 'HL only' ? ' <span class="pill">HL</span>' : '') + '</span>' +
            (mode === 'out' ? '<button type="button" class="tcm-add" data-a="' + E(m.path) + '">+ Add</button>' : '<button type="button" class="tcm-rm" data-r="' + E(m.path) + '" title="Remove from this class">✕</button>') + '</div>'; }).join(''); };
        t.querySelector('#mlist').innerHTML = rows.length ? BV.subj.split(rows, function (m) { return /^MYP /.test(m.subject || '') ? BV.subj.of(m.subject) : ''; }, mrows) : '<p class="small muted">' + (mode === 'out' ? '✓ Everything here is already in the class.' : 'Nothing here yet: press ➕ Add from main site.') + '</p>';
      };
      t.addEventListener('click', function (ev) {
        var sg = ev.target.closest('[data-m]'); if (sg) { mode = sg.getAttribute('data-m'); TC.madd = mode === 'out'; var cs = t.querySelector('#mcourse'); cs.value = mode === 'out' && courses.indexOf(mine) >= 0 ? mine : ''; list(); return; }
        var a = ev.target.closest('[data-a],[data-r]'); if (a) { a.disabled = true; var add = a.hasAttribute('data-a');
          save(a.getAttribute(add ? 'data-a' : 'data-r'), add).then(function (okk) { if (okk) { var row = a.closest('.tcm-row'); row.style.opacity = .4; setTimeout(list, 250); } else a.disabled = false; }); return; }
        var b = ev.target.closest('#maddall'); if (!b) return; var paths = [].map.call(t.querySelectorAll('#mlist [data-a]'), function (x) { return x.getAttribute('data-a'); });
        if (!paths.length) return; b.disabled = true; var n0 = Object.keys(have).length;
        S.db.from('class_materials').upsert(paths.map(function (pth, i) { return { class_id: c.id, path: pth, added_by: ME.user.id, sort: n0 + i }; }), { onConflict: 'class_id,path', ignoreDuplicates: true }).then(function (r) {
          if (r.error) { b.disabled = false; return toast(S.nice(r.error), true); } paths.forEach(function (pth) { have[pth] = 1; }); delete MATS[c.id]; t.querySelector('#mn').textContent = Object.keys(have).length; toast('Added ' + paths.length); list(); }); });
      t.querySelector('#mq').oninput = list; t.querySelector('#mcourse').onchange = list;
      list();
    });
  }
  function tcQuizzes(t, c) {
    Promise.all([S.db.from('quizzes').select('id,title,category,published,created_by,topic_id' + (QSUBJ ? ',subject' : '')).is('deleted_at', null).order('title'), S.db.from('quiz_classes').select('quiz_id,published').eq('class_id', c.id)]).then(function (x) {
      var set = {}; (x[1].data || []).forEach(function (r) { set[r.quiz_id] = r.published ? 'live' : 'wait'; });
      var all = (x[0].data || []).filter(function (z) { return set[z.id] || z.published || z.created_by === ME.user.id; }).sort(function (a, b) { return (set[b.id] ? 1 : 0) - (set[a.id] ? 1 : 0) || a.title.localeCompare(b.title); });
      t.innerHTML = '<p class="small">Quizzes and exams linked to this class. Students see one only after you press <b>Publish</b>. Add more from the list, or make your own in <a href="#quizzes">Quizzes &amp; exams</a>.</p><label class="f">Search<input id="qq" placeholder="quiz title"></label><label class="chk"><input type="checkbox" id="qonly" checked> Only quizzes in this class</label><div id="ql"></div>';
      var list = function () { var q = t.querySelector('#qq').value.trim().toLowerCase(), only = t.querySelector('#qonly').checked;
        var rowsOf = function (zs) { return zs.map(function (z) { var st = set[z.id];
          return '<div class="row2" style="justify-content:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid var(--line)"><span style="flex:1">' + (z.category === 'exam' ? '🧪 ' : '📝 ') + E(z.title) + (z.created_by === ME.user.id ? ' <span class="pill">mine</span>' : '') +
            (st === 'live' ? ' <span class="pill ok">Published</span>' : st === 'wait' ? ' <span class="pill">Not published</span>' : '') + '</span>' +
            (st === 'live' ? '<button type="button" class="btn sm" data-p="' + z.id + '" data-on="0">⏸ Unpublish</button>' : '<button type="button" class="btn sm main" data-p="' + z.id + '" data-on="1">📢 Publish</button>') +
            (st ? '<button type="button" class="btn sm" data-rm="' + z.id + '" title="Remove from this class">✕</button>' : '') + '</div>'; }).join(''); };
        var found = all.filter(function (z) { return (!only || set[z.id]) && (!q || z.title.toLowerCase().indexOf(q) >= 0); }).slice(0, 300);
        // a Grade 6 to 10 science class: one tab per subject (Biology, Chemistry, Physics)
        t.querySelector('#ql').innerHTML = !found.length ? '<p class="small muted">No quizzes here yet.</p>' : BV.subj.isMyp(c) ? BV.subj.split(found, quizSubj, rowsOf) : rowsOf(found);
        t.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-p'), on = b.getAttribute('data-on') === '1'; b.disabled = true;
          S.db.rpc('set_quiz_published', { qid: id, cid: c.id, on_off: on }).then(function (r) { b.disabled = false; if (!ok(r)) return; set[id] = on ? 'live' : 'wait'; list(); }); }; });
        t.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-rm'); b.disabled = true;
          S.db.from('quiz_classes').delete().eq('quiz_id', id).eq('class_id', c.id).then(function (r) { b.disabled = false; if (!ok(r)) return; delete set[id]; list(); }); }; });
      };
      t.querySelector('#qq').oninput = list; t.querySelector('#qonly').onchange = list; list();
    });
  }
  function tcTeam(t, c) {
    S.db.rpc('class_coteachers', { cid: c.id }).then(function (r) {
      var rows = r.data || [];
      t.innerHTML = '<p class="small">Add a colleague who also teaches this class. They can <b>see</b> the class, its students, lessons, quizzes and results, but cannot change anything. They need an approved BioscienceVista teacher account.</p>' +
        (rows.length ? rows.map(function (x) { return '<div class="row2" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>🤝 <b>' + E(x.full_name || 'Teacher') + '</b> <span class="small muted">' + E(x.school || '') + '</span></span><button class="btn sm" data-rm="' + E(x.teacher_id) + '">Remove</button></div>'; }).join('') : '<p class="small muted">No co-teachers yet.</p>') +
        '<form id="cof" class="row2" style="margin-top:10px"><input id="coe" type="email" required placeholder="Colleague\'s email (their BioscienceVista teacher account)" style="flex:1"><button class="btn main sm" type="submit">Add co-teacher</button></form>';
      t.querySelector('#cof').onsubmit = function (e) { e.preventDefault(); S.db.rpc('add_coteacher', { cid: c.id, teacher_email: t.querySelector('#coe').value }).then(function (x) { if (ok(x, 'Co-teacher added')) tcTeam(t, c); }); };
      t.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Click again to remove'; return; }
        S.db.rpc('remove_coteacher', { cid: c.id, tid: b.getAttribute('data-rm') }).then(function (x) { if (ok(x, 'Removed')) tcTeam(t, c); }); }; });
    });
  }

  /* ---------- class register: one register for every lesson, each student present / late / absent / excused ---------- */
  var REG = { P: ['present', '✓ Present', '#16a34a'], L: ['late', '⏰ Late', '#d97706'], A: ['absent', '✗ Absent', '#dc2626'], X: ['excused', '◌ Excused', '#64748b'] };
  function registerBoard(body, c, state) {
    state.live = false; clearInterval(LIVE);
    return Promise.all([roster(c.id), S.db.from('class_sessions').select('id,held_on,title,lesson_path,created_at').eq('class_id', c.id).order('held_on', { ascending: false }).order('created_at', { ascending: false }).limit(200), classMats(c.id),
      S.db.from('materials').select('path,title')]).then(function (x) {
      if (x[1].error) { body.innerHTML = '<p class="emptybox">The class register needs a database update (migration 026) before it can be used.</p>'; return; }
      var kids = x[0], sess = x[1].data || [], own = x[2] || [], mt = {}; (x[3].data || []).forEach(function (m) { mt[m.path] = m.title; });
      var ids = sess.map(function (s2) { return s2.id; });
      return (ids.length ? S.db.from('attendance').select('session_id,student_id,status,note').in('session_id', ids) : Promise.resolve({ data: [] })).then(function (a) {
        var marks = {}; (a.data || []).forEach(function (r) { (marks[r.session_id] = marks[r.session_id] || {})[r.student_id] = r; });
        // registers fill themselves in: today's register is made automatically with every student in the class (marked present),
        // and anyone who joins the class later is added to today's register as soon as it is opened
        var today = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10), T0 = sess.filter(function (s2) { return s2.held_on === today; })[0];
        if (kids.length && !T0 && !state.autoDone) { state.autoDone = true;
          return S.db.from('class_sessions').insert({ class_id: c.id, held_on: today, title: 'Lesson · ' + new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' }) }).select('id').single().then(function (r) {
            if (r.error) { toast(S.nice(r.error), true); return; } state.session = r.data.id;
            return S.db.from('attendance').insert(kids.map(function (k) { return { session_id: r.data.id, student_id: k.id, status: 'present' }; })).then(function () { toast('Today\'s register is ready with ' + kids.length + ' students'); return registerBoard(body, c, state); }); }); }
        if (T0) { var missing = kids.filter(function (k) { return !(marks[T0.id] || {})[k.id]; });
          if (missing.length && !state.autoAdd) { state.autoAdd = true;
            return S.db.from('attendance').insert(missing.map(function (k) { return { session_id: T0.id, student_id: k.id, status: 'present' }; })).then(function () { return registerBoard(body, c, state); }); } }
        var pick = state.session && sess.some(function (s2) { return s2.id === state.session; }) ? state.session : (sess[0] && sess[0].id);
        var S0 = sess.filter(function (s2) { return s2.id === pick; })[0];
        // attendance % per student over all registers
        var pct = {}; kids.forEach(function (k) { var n = 0, here = 0; sess.forEach(function (s2) { var m = (marks[s2.id] || {})[k.id]; if (m) { n++; if (m.status === 'present' || m.status === 'late') here++; } }); pct[k.id] = n ? Math.round(100 * here / n) : null; });
        body.innerHTML = '<section class="panel tint"><form id="nreg" class="row2" style="flex-wrap:wrap;justify-content:flex-start;gap:8px"><b>＋ New register</b><input type="date" id="rd" value="' + new Date().toISOString().slice(0, 10) + '" aria-label="Date">' +
          '<select id="rl" aria-label="Lesson" style="min-width:240px"><option value="">Lesson taught (optional)…</option>' + own.map(function (pth) { return '<option value="' + E(pth) + '">' + E(mt[pth] || pth) + '</option>'; }).join('') + '</select>' +
          '<input id="rt" placeholder="Title, e.g. Period 3 · Osmosis practical" maxlength="160" style="flex:1;min-width:200px"><button class="btn main sm" type="submit">Create register</button></form>' +
          '<p class="small muted">Today\'s register is made for you automatically with every student\'s name, and students who join the class are added straight away. Everyone starts as present: tap Late, Absent or Excused to change it. Marks save straight away. Add another register here for a second lesson on the same day.</p></section>' +
          (sess.length ? '<div class="row2" style="justify-content:flex-start;gap:8px;flex-wrap:wrap"><label class="f">Register<select id="rs">' + sess.map(function (s2) { var n = Object.keys(marks[s2.id] || {}).length;
            return '<option value="' + s2.id + '"' + (s2.id === pick ? ' selected' : '') + '>' + E(s2.held_on) + ' · ' + E(s2.title) + ' (' + n + '/' + kids.length + ')</option>'; }).join('') + '</select></label>' +
            '<button class="btn sm" type="button" id="rall">✓ Mark everyone not yet marked present</button><button class="btn sm" type="button" id="rdel">Delete this register</button></div>' : '<p class="emptybox">No registers yet. Create one above for today\'s lesson.</p>') +
          (S0 ? '<div class="tablewrap"><table class="marks"><tr><th>Student</th><th>Today</th><th>Note</th><th>Attendance (all registers)</th></tr>' + kids.map(function (k) { var m = (marks[S0.id] || {})[k.id], st = m ? m.status : '';
              return '<tr data-s="' + k.id + '"><td><b>' + E(k.full_name || 'Student') + '</b></td><td><span class="cta" style="flex-wrap:wrap">' + Object.keys(REG).map(function (key) { var R = REG[key], on = st === R[0];
                return '<button type="button" class="btn sm regb" data-st="' + R[0] + '" aria-pressed="' + on + '" style="--k:' + R[2] + '">' + R[1] + '</button>'; }).join('') + '</span></td>' +
                '<td><input data-note value="' + E(m && m.note || '') + '" maxlength="200" placeholder="optional"></td><td>' + (pct[k.id] == null ? '–' : pct[k.id] + '%') + '</td></tr>'; }).join('') + '</table></div>' +
            (S0.lesson_path ? '<p class="small">Lesson: <a href="' + E(S0.lesson_path) + '" target="_blank" rel="noopener">' + E(mt[S0.lesson_path] || S0.lesson_path) + '</a></p>' : '') : '');
        body.querySelector('#rl').onchange = function () { var ti = body.querySelector('#rt'); if (!ti.value && this.value) ti.value = mt[this.value] || ''; };
        body.querySelector('#nreg').onsubmit = function (e) { e.preventDefault();
          var row = { class_id: c.id, held_on: body.querySelector('#rd').value || null, title: body.querySelector('#rt').value.trim() || (mt[body.querySelector('#rl').value] || 'Lesson'), lesson_path: body.querySelector('#rl').value || null };
          S.db.from('class_sessions').insert(row).select('id').single().then(function (r) { if (!ok(r, 'Register created')) return; state.session = r.data.id;
            S.db.from('attendance').insert(kids.map(function (k) { return { session_id: r.data.id, student_id: k.id, status: 'present' }; })).then(function () { state.reload(); }); }); };
        if (!S0) return;
        var rs = body.querySelector('#rs'); rs.onchange = function () { state.session = rs.value; state.reload(); };
        body.querySelector('#rdel').onclick = function () { var b = this; if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Click again to delete this register'; return; }
          S.db.from('class_sessions').delete().eq('id', S0.id).then(function (r) { if (ok(r, 'Register deleted')) { state.session = null; state.reload(); } }); };
        body.querySelector('#rall').onclick = function () { var rows = kids.filter(function (k) { return !(marks[S0.id] || {})[k.id]; }).map(function (k) { return { session_id: S0.id, student_id: k.id, status: 'present' }; });
          if (!rows.length) return toast('Everyone is already marked.'); S.db.from('attendance').insert(rows).then(function (r) { if (ok(r, rows.length + ' marked present')) state.reload(); }); };
        body.querySelectorAll('tr[data-s]').forEach(function (tr) { var sid = tr.getAttribute('data-s');
          var save = function (patch) { var m = (marks[S0.id] || {})[sid] || {}, row = { session_id: S0.id, student_id: sid, status: patch.status || m.status || 'present', note: patch.note !== undefined ? (patch.note || null) : (m.note || null), marked_at: new Date().toISOString() };
            return S.db.from('attendance').upsert(row, { onConflict: 'session_id,student_id' }).then(function (r) { if (ok(r)) { (marks[S0.id] = marks[S0.id] || {})[sid] = row; } return r; }); };
          tr.querySelectorAll('[data-st]').forEach(function (b) { b.onclick = function () { var st = b.getAttribute('data-st'); save({ status: st }).then(function (r) { if (r.error) return;
            tr.querySelectorAll('[data-st]').forEach(function (o) { o.setAttribute('aria-pressed', o === b); }); }); }; });
          var ni = tr.querySelector('[data-note]'); ni.onchange = function () { save({ note: ni.value.trim() }).then(function (r) { if (!r.error) toast('Note saved'); }); };
        });
      });
    });
  }
  /* ---------- class activity: who is online, what each student opened and did ---------- */
  var ACT_ICON = { visit: '👁', login: '🔑', lesson: '🧪', quiz_start: '📝', quiz_done: '✅', lab: '🔬', question: '❓' };
  var ACT_WORD = { visit: 'opened', login: 'logged in', lesson: 'saved a lesson step', quiz_start: 'started a quiz', quiz_done: 'handed in a quiz', lab: 'worked in a lab', question: 'asked a question' };
  function activityBoard(body, c, state) {
    state.days = state.days || 7;
    var since = new Date(Date.now() - state.days * 864e5).toISOString();
    return Promise.all([roster(c.id), S.db.rpc('class_activity', { cls: c.id, since: since })]).then(function (x) {
      if (x[1].error) { body.innerHTML = '<p class="emptybox">' + (/class_activity|does not exist|schema cache/i.test(x[1].error.message) ? 'Class activity needs a database update (migration 026) before it can show anything.' : E(S.nice(x[1].error))) + '</p>'; return; }
      var kids = x[0], rows = x[1].data || [], by = {};
      kids.forEach(function (k) { by[k.id] = { k: k, last: null, n: 0, pages: 0, lessons: {}, quizzes: 0, labs: 0, qs: 0, days: {} }; });
      rows.forEach(function (r) { var b = by[r.student_id]; if (!b) return; b.n++; if (!b.last || r.at > b.last) b.last = r.at; b.days[String(r.at).slice(0, 10)] = 1;
        if (r.kind === 'visit') b.pages++; if (r.kind === 'lesson') b.lessons[r.title] = 1; if (r.kind === 'quiz_done') b.quizzes++; if (r.kind === 'lab') b.labs++; if (r.kind === 'question') b.qs++; });
      var list = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return (b.last || '').localeCompare(a.last || '') || (a.k.full_name || '').localeCompare(b.k.full_name || ''); });
      var now = Date.now(), online = list.filter(function (b) { return b.last && now - new Date(b.last) < 10 * 60e3; }), idle = list.filter(function (b) { return !b.last; });
      var dot = function (b) { var t = b.last ? now - new Date(b.last) : Infinity; return '<span title="' + (t < 10 * 60e3 ? 'active in the last 10 minutes' : t < 864e5 ? 'active today' : b.last ? 'active this period' : 'no activity') + '" style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;background:' + (t < 10 * 60e3 ? '#16a34a' : t < 864e5 ? '#f59e0b' : b.last ? '#94a3b8' : '#ef4444') + '"></span>'; };
      var sel = state.student && by[state.student] ? state.student : null;
      var feed = rows.filter(function (r) { return by[r.student_id] && (!sel || r.student_id === sel); }).slice(0, sel ? 400 : 120);
      body.innerHTML = '<div class="row2" style="flex-wrap:wrap;gap:8px"><div class="stats" style="margin:0"><div class="stat"><span class="small muted">Active now</span><b>' + online.length + '</b></div><div class="stat"><span class="small muted">Active this period</span><b>' + (list.length - idle.length) + ' / ' + list.length + '</b></div><div class="stat"><span class="small muted">No activity</span><b>' + idle.length + '</b></div></div>' +
        '<label class="f">Period<select id="ad">' + [[1, 'Today and last 24 h'], [7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === state.days ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label></div>' +
        (idle.length ? '<p class="panel tint small"><b>No activity in this period:</b> ' + idle.map(function (b) { return E(b.k.full_name || 'Student'); }).join(', ') + '</p>' : '') +
        '<div class="tablewrap"><table class="marks"><tr><th>Student</th><th>Last active</th><th>Days active</th><th>Pages opened</th><th>Lessons worked on</th><th>Quizzes handed in</th><th>Lab work</th><th>Questions</th></tr>' + list.map(function (b) {
          return '<tr' + (b.k.id === sel ? ' style="background:var(--tint,#eef6ff)"' : '') + '><td>' + dot(b) + '<a href="#" data-who="' + b.k.id + '">' + E(b.k.full_name || 'Student') + '</a></td><td class="small">' + (b.last ? E(ago(b.last)) : '—') + '</td><td>' + Object.keys(b.days).length + '</td><td>' + b.pages + '</td><td>' + Object.keys(b.lessons).length + '</td><td>' + b.quizzes + '</td><td>' + b.labs + '</td><td>' + b.qs + '</td></tr>'; }).join('') + '</table></div>' +
        '<section class="panel"><div class="row2"><h3 style="margin:0">' + (sel ? 'Timeline: ' + E(by[sel].k.full_name || 'Student') : 'Latest activity in ' + E(c.name)) + '</h3>' + (sel ? '<button class="btn sm" type="button" id="aall">Show everyone</button>' : '') + '</div>' +
        (feed.length ? '<div class="tablewrap"><table class="marks"><tr><th>When</th>' + (sel ? '' : '<th>Student</th>') + '<th>What</th><th>Details</th></tr>' + feed.map(function (r) {
          var t = r.kind === 'login' ? 'Logged in' : r.path ? '<a href="' + E(r.path) + '" target="_blank" rel="noopener">' + E(r.title || r.path) + '</a>' : E(r.title || '');
          return '<tr><td class="small">' + E(S.when(r.at)) + '</td>' + (sel ? '' : '<td>' + E(by[r.student_id].k.full_name || 'Student') + '</td>') + '<td>' + (ACT_ICON[r.kind] || '•') + ' ' + E(ACT_WORD[r.kind] || r.kind) + (r.kind === 'login' ? '' : ': ' + t) + '</td><td class="small">' + E(r.detail || '') + '</td></tr>'; }).join('') + '</table></div>' : '<p class="small muted">Nothing in this period.</p>') + '</section>' +
        '<p class="small muted">🟢 active in the last 10 minutes · 🟠 today · ⚪ earlier in this period · 🔴 no activity. Activity counts pages opened while signed in, logins, lesson steps saved, quizzes, laboratory work and Help Desk questions.</p>';
      body.querySelector('#ad').onchange = function () { state.days = +this.value; state.reload(); };
      body.querySelectorAll('[data-who]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); state.student = a.getAttribute('data-who'); state.reload(); }; });
      var aa = body.querySelector('#aall'); if (aa) aa.onclick = function () { state.student = null; state.reload(); };
    });
  }
})();
