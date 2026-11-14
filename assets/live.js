/* Learnova · Live Classroom dashboard (/live/).
   Teachers schedule, edit, cancel and start live lessons, add resources, invite guests, see attendance and recordings.
   Students see their classes' lessons, join them, open resources and released recordings, and see their own attendance.
   Admins also see every session, the guest and recording policies, the video set-up and the audit log.
   Times are stored in UTC and shown in this device's time zone. Daily.co keys never reach the browser: anything that
   touches video goes through the live-* Edge Functions, which check the database rules again. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  var QS = new URLSearchParams(location.search), UUID = /^[0-9a-f-]{36}$/, CLS0 = UUID.test(QS.get('class') || '') ? QS.get('class') : null;
  var me, T = false, ADMIN = false, MAYTEACH = true, myClasses = [], sessions = [], settings = {};
  var KINDS = { lesson: 'Lesson', staff_meeting: 'Staff meeting', pd: 'Professional development', mentoring: 'Mentoring', discussion: 'Group discussion' };
  var ZONES = ['Africa/Nairobi', 'Africa/Lagos', 'Africa/Johannesburg', 'Africa/Cairo', 'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Australia/Sydney', 'UTC'];
  var HERE = (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return 'UTC'; } })();
  var FILE_MAX = 25 * 1024 * 1024, FILE_TYPES = /^(application\/pdf|image\/(png|jpeg|gif|webp)|application\/vnd\.openxmlformats-officedocument\.(presentationml\.presentation|wordprocessingml\.document|spreadsheetml\.sheet)|application\/(vnd\.ms-powerpoint|msword|vnd\.ms-excel)|text\/plain)$/;

  var CSS = '.lv-grid{display:grid;gap:12px}.lv-card{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;border:1px solid var(--line,#e5e7eb);border-left:6px solid var(--k,#0d9488);border-radius:14px;padding:12px 14px;background:var(--raised,#fff)}' +
    '.lv-when{text-align:center;min-width:64px;border-radius:12px;background:color-mix(in srgb,var(--k,#0d9488) 12%,transparent);padding:6px 8px;font-weight:800;color:var(--k,#0d9488)}.lv-when b{display:block;font-size:1.5rem;line-height:1}.lv-when span{font-size:.75rem;text-transform:uppercase}' +
    '.lv-card h3{margin:0 0 2px;font-size:1.05rem}.lv-card .meta{font-size:.85rem;color:var(--muted,#64748b)}.lv-acts{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}' +
    '.lv-st{display:inline-block;font:800 .72rem system-ui;border-radius:999px;padding:3px 9px;text-transform:uppercase;letter-spacing:.04em;margin-left:6px;vertical-align:middle}' +
    '.lv-st.active{background:#dcfce7;color:#166534}.lv-st.scheduled{background:#e0f2fe;color:#075985}.lv-st.completed{background:#f1f5f9;color:#334155}.lv-st.cancelled{background:#fee2e2;color:#991b1b}.lv-st.expired{background:#fef3c7;color:#92400e}' +
    '.lv-live{animation:lvp 1.6s infinite}@keyframes lvp{50%{opacity:.55}}.lv-form{display:grid;gap:10px}.lv-form .g2{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.lv-form label>span{display:block;font-weight:700;font-size:.85rem;margin-bottom:3px}' +
    '.lv-form input,.lv-form select,.lv-form textarea{width:100%;box-sizing:border-box}.lv-checks{display:grid;gap:6px}.lv-checks label{display:flex;gap:8px;align-items:flex-start;font-weight:500}.lv-checks input{width:auto;margin-top:3px}' +
    '.lv-sec{border:1px solid var(--line,#e5e7eb);border-radius:14px;padding:12px 14px;background:var(--raised,#fff)}.lv-sec h3{margin:0 0 8px}.lv-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 0;border-top:1px solid var(--line,#eef2f7)}.lv-row:first-of-type{border-top:0}.lv-row b{flex:1;min-width:160px}' +
    '.lv-empty{text-align:center;padding:26px 12px;color:var(--muted,#64748b)}.lv-empty b{display:block;font-size:2rem}.lv-link{font:600 .85rem ui-monospace,monospace;background:#f1f5f9;border-radius:8px;padding:8px;word-break:break-all;margin:6px 0}' +
    '@media (max-width:640px){.lv-card{grid-template-columns:auto 1fr}.lv-acts{grid-column:1/-1;justify-content:flex-start}}';

  S.guard(app, { school: true, allowPending: true, anyone: true }).then(function (m) {
    me = m; ADMIN = !!m.admin; T = ADMIN || m.staff || m.roles.indexOf('teacher') >= 0 || m.roles.indexOf('school_teacher') >= 0;
    if (!document.getElementById('lv-css')) { var s = document.createElement('style'); s.id = 'lv-css'; s.textContent = CSS; document.head.appendChild(s); }
    return (T ? loadMyClasses().then(function () { return ADMIN ? true : Promise.resolve(S.db.rpc('live_may_teach')).then(function (r) { return r && r.error ? true : r.data !== false; }, function () { return true; }); }).then(function (ok) { MAYTEACH = ok; }) : Promise.resolve()).then(loadSettings).then(route);
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });
  window.addEventListener('hashchange', function () { if (me) route(); });

  function loadMyClasses() {
    return Promise.all([S.db.from('classes').select('id,name,owner_kind,archived_at').eq('teacher_id', me.user.id), S.db.from('class_teachers').select('class_id,classes(id,name,archived_at)').eq('teacher_id', me.user.id)])
      .then(function (r) { var a = (r[0].data || []).concat((r[1].data || []).map(function (x) { return x.classes; }).filter(Boolean)), seen = {};
        myClasses = a.filter(function (c) { if (!c || c.archived_at || seen[c.id]) return false; seen[c.id] = 1; return true; }).sort(function (x, y) { return x.name.localeCompare(y.name); }); });
  }
  function loadSettings() { return Promise.resolve(S.db.from('app_settings').select('k,v').like('k', 'live\\_%')).then(function (r) { (r.data || []).forEach(function (x) { settings[x.k] = x.v; }); }, function () {}); }
  function loadSessions() {
    var q = S.db.from('live_sessions').select('*,classes(name)').order('starts_at', { ascending: true }).limit(400);
    if (CLS0) q = q.eq('class_id', CLS0);
    return Promise.resolve(q).then(function (r) { if (r.error) throw r.error; sessions = r.data || []; return sessions; });
  }
  function fn(name, body) {   // an Edge Function's JSON answer, including its error message on a failure status
    return S.db.functions.invoke(name, { body: body }).then(function (r) { var d = r.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } } if (d) return d;
      var c = r.error && r.error.context; if (c && typeof c.json === 'function') return c.json().catch(function () { return null; }).then(function (x) { return x || { ok: false, error: 'The service did not answer.' }; });
      return { ok: false, error: 'The service did not answer.' }; });
  }

  // ---------------------------------------------------------------- time
  function endOf(s) { return new Date(new Date(s.starts_at).getTime() + s.duration_min * 60000); }
  function status(s) { return s.status === 'scheduled' && Date.now() > endOf(s).getTime() + 30 * 60000 ? 'expired' : s.status; }
  function fmt(d, o) { try { return new Intl.DateTimeFormat(undefined, o).format(new Date(d)); } catch (e) { return new Date(d).toString(); } }
  function when(s) { var t = fmt(s.starts_at, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '–' + fmt(endOf(s), { hour: '2-digit', minute: '2-digit' });
    if (s.time_zone && s.time_zone !== HERE) t += ' (your time; ' + fmt(s.starts_at, { hour: '2-digit', minute: '2-digit', timeZone: s.time_zone }) + ' in ' + s.time_zone.split('/').pop().replace(/_/g, ' ') + ')';
    return t; }
  function tzParts(ms, tz) { var p = {}; new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; }); return p; }
  function toUtc(date, time, tz) {   // "2026-11-20" + "14:30" in tz → ISO UTC
    var a = date.split('-').map(Number), b = time.split(':').map(Number), guess = Date.UTC(a[0], a[1] - 1, a[2], b[0], b[1]);
    for (var i = 0; i < 2; i++) { var p = tzParts(guess, tz), asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute); guess -= asUtc - Date.UTC(a[0], a[1] - 1, a[2], b[0], b[1]); }
    return new Date(guess).toISOString();
  }
  function inZone(iso, tz) { var p = tzParts(new Date(iso).getTime(), tz); return { date: p.year + '-' + p.month + '-' + p.day, time: (p.hour % 24 < 10 ? '0' : '') + (+p.hour % 24) + ':' + p.minute }; }
  function rel(s) { var ms = new Date(s.starts_at).getTime() - Date.now(), mn = Math.round(ms / 60000);
    if (ms < 0) return 'started'; if (mn < 60) return 'in ' + mn + ' min'; if (mn < 1440) return 'in ' + Math.round(mn / 60) + ' h'; return 'in ' + Math.round(mn / 1440) + ' days'; }
  var hue = function (id) { var h = 0; for (var i = 0; i < (id || '').length; i++) h = (h * 31 + id.charCodeAt(i)) % 360; return 'hsl(' + h + ' 70% 38%)'; };

  // ---------------------------------------------------------------- page
  function shell(inner, active) {
    var tabs = [['#', '📅 Upcoming and live'], ['#past', '🗂 Past'], ['#mine', '🧾 My attendance']];
    if (T && MAYTEACH) tabs = [['#', '📅 Upcoming and live'], ['#past', '🗂 Past'], ['#new', '＋ Schedule']];
    if (ADMIN) tabs.push(['#admin', '🛡 Admin']);
    app.innerHTML = '<div class="row2 cband" style="--k:#7c3aed"><div><p class="label">BioScience Vista Live</p><h2 style="margin:0">🎥 Live Classroom</h2><p class="small" style="margin:4px 0 0">' +
      (T ? 'Schedule live lessons and meetings, teach with video, the whiteboard and your resources, and see who attended.' : 'Your live lessons: join when your teacher starts, open the lesson\'s resources, and watch recordings your teacher shares.') +
      (T && !MAYTEACH ? ' <b>The administrator has not switched on live lessons for your account yet.</b>' : '') + (CLS0 ? ' <b>Showing one class.</b> <a href="/live/" style="color:inherit">Show all</a>' : '') + '</p></div><div class="cta">' + (T && MAYTEACH ? '<a class="btn main sm" href="#new">＋ Schedule a lesson</a><a class="btn sm" href="/teach/">🏫 My classes</a>' : '<a class="btn sm" href="/dashboard/">← My dashboard</a>') + '</div></div>' +
      '<nav class="tabs" aria-label="Live Classroom">' + tabs.map(function (t) { return '<a href="' + t[0] + '" aria-selected="' + (t[0] === active) + '">' + t[1] + '</a>'; }).join('') + '</nav><div id="lvb" style="margin-top:12px">' + inner + '</div>';
    return app.querySelector('#lvb');
  }
  function loading(active) { return shell('<p class="small muted">Loading…</p>', active); }
  function route() {
    var h = location.hash || '#', m;
    if ((m = /^#s\/([0-9a-f-]{36})/.exec(h))) return detail(m[1]);
    if ((m = /^#edit\/([0-9a-f-]{36})/.exec(h)) && T && MAYTEACH) return form(m[1]);
    if (h === '#new' && T && MAYTEACH) return form(null);
    if (h === '#admin' && ADMIN) return adminView();
    if (h === '#mine') return myAttendance();
    return list(h === '#past');
  }
  function setupMissing(e) { return /live_sessions|schema cache|does not exist|PGRST20/.test(String(e && (e.message || e.code) || e)); }
  function notReady(box) { box.innerHTML = '<div class="lv-sec"><h3>🛠 Live Classroom is almost ready</h3><p>The database update for live lessons (migration 028) has not been run yet. Once it has, lessons can be scheduled here.</p></div>'; }

  function list(past) {
    var box = loading(past ? '#past' : '#');
    loadSessions().then(function (all) {
      var now = Date.now(), rows = all.filter(function (s) { var st = status(s); return past ? (st === 'completed' || st === 'cancelled' || st === 'expired') : (st === 'active' || st === 'scheduled'); });
      if (past) rows.reverse();
      var live = rows.filter(function (s) { return status(s) === 'active'; });
      box.innerHTML = (!past && live.length ? '<h3 style="margin:0 0 8px">🔴 Live now</h3><div class="lv-grid" style="margin-bottom:16px">' + live.map(card).join('') + '</div>' : '') +
        (rows.length - (past ? 0 : live.length) ? (!past ? '<h3 style="margin:0 0 8px">📅 Coming up</h3>' : '') + '<div class="lv-grid">' + rows.filter(function (s) { return past || status(s) !== 'active'; }).map(card).join('') + '</div>'
          : (!past && live.length ? '' : '<div class="lv-empty"><b>' + (past ? '🗂' : '📅') + '</b>' + (past ? 'No past lessons yet.' : T && MAYTEACH ? 'No lessons scheduled. <a href="#new">Schedule your first live lesson</a>.' : 'No live lessons scheduled for your classes yet.') + '</div>'));
      wireCards(box);
      clearTimeout(list.t); if (!past) list.t = setTimeout(function () { if ((location.hash || '#') === '#') list(false); }, 60000);
    }).catch(function (e) { if (setupMissing(e)) notReady(box); else box.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });
  }
  function card(s) {
    var st = status(s), d = new Date(s.starts_at), k = st === 'cancelled' ? '#b91c1c' : st === 'active' ? '#16a34a' : hue(s.class_id || s.id), mine = T && canManage(s);
    var soon = new Date(s.starts_at).getTime() - Date.now() < 3600000;
    var acts = '';
    if (st === 'active') acts += '<a class="btn main sm lv-live" href="/live/room/?s=' + s.id + '">🎥 Join now</a>';
    else if (st === 'scheduled' && mine && soon) acts += '<a class="btn main sm" href="/live/room/?s=' + s.id + '">▶ Start lesson</a>';
    else if (st === 'scheduled') acts += '<span class="small muted">Starts ' + rel(s) + '</span>';
    acts += '<a class="btn sm" href="#s/' + s.id + '">' + (mine ? 'Manage' : 'Details') + '</a>';
    if (mine && st === 'scheduled') acts += '<a class="btn sm" href="#edit/' + s.id + '">Edit</a>';
    return '<div class="lv-card" style="--k:' + k + '"><div class="lv-when"><b>' + d.getDate() + '</b><span>' + E(fmt(d, { month: 'short' })) + '</span></div><div><h3>' + E(s.title) + '<span class="lv-st ' + st + '">' + (st === 'active' ? '● live' : st) + '</span></h3>' +
      '<div class="meta">' + E(when(s)) + ' · ' + s.duration_min + ' min</div><div class="meta">' + E([KINDS[s.kind], s.classes && s.classes.name, s.subject].filter(Boolean).join(' · ')) + (s.recording_pref === 'allowed' ? ' · ⏺ may be recorded' : '') + (s.guests_allowed ? ' · 👤 guests invited' : '') + '</div></div><div class="lv-acts">' + acts + '</div></div>';
  }
  function canManage(s) { return ADMIN || MAYTEACH && (s.teacher_id === me.user.id || myClasses.some(function (c) { return c.id === s.class_id; })); }
  function wireCards() {}

  // ---------------------------------------------------------------- schedule / edit
  function form(id) {
    var box = loading(id ? '' : '#new');
    (id ? Promise.resolve(S.db.from('live_sessions').select('*').eq('id', id).maybeSingle()).then(function (r) { return r.data; }) : Promise.resolve(null)).then(function (s) {
      if (id && !s) { box.innerHTML = '<p class="msg">Lesson not found.</p>'; return; }
      var tz = (s && s.time_zone) || 'Africa/Nairobi', at = s ? inZone(s.starts_at, tz) : inZone(new Date(Math.ceil(Date.now() / 1800000) * 1800000 + 3600000).toISOString(), tz);
      var zones = ZONES.indexOf(tz) < 0 ? [tz].concat(ZONES) : ZONES; if (zones.indexOf(HERE) < 0) zones = zones.concat(HERE);
      var cls = s ? s.class_id : CLS0;
      box.innerHTML = '<form class="lv-sec lv-form" id="lvf"><h3>' + (s ? '✏️ Edit lesson' : '＋ Schedule a live lesson or meeting') + '</h3>' +
        '<div class="g2"><label><span>Title</span><input name="title" required maxlength="140" value="' + E(s ? s.title : '') + '" placeholder="e.g. Cell division: mitosis"></label>' +
        '<label><span>Type</span><select name="kind">' + Object.keys(KINDS).map(function (k) { return '<option value="' + k + '"' + ((s ? s.kind : 'lesson') === k ? ' selected' : '') + '>' + KINDS[k] + '</option>'; }).join('') + '</select></label></div>' +
        '<div class="g2"><label><span>Class or group</span><select name="class_id"><option value="">No class (staff meeting, PD, mentoring…)</option>' + myClasses.map(function (c) { return '<option value="' + c.id + '"' + (cls === c.id ? ' selected' : '') + '>' + E(c.name) + '</option>'; }).join('') + '</select></label>' +
        '<label><span>Subject</span><input name="subject" maxlength="80" value="' + E(s && s.subject || '') + '" placeholder="e.g. Biology"></label></div>' +
        '<label><span>Description (what students should bring or prepare)</span><textarea name="description" rows="3" maxlength="4000">' + E(s && s.description || '') + '</textarea></label>' +
        '<div class="g2"><label><span>Date</span><input type="date" name="date" required value="' + at.date + '"></label><label><span>Start time</span><input type="time" name="time" required value="' + at.time + '"></label>' +
        '<label><span>Duration</span><select name="duration_min">' + [20, 30, 40, 45, 60, 80, 90, 120, 180].map(function (n) { return '<option value="' + n + '"' + ((s ? s.duration_min : 60) === n ? ' selected' : '') + '>' + n + ' minutes</option>'; }).join('') + '</select></label>' +
        '<label><span>Time zone</span><select name="time_zone">' + zones.map(function (z) { return '<option' + (z === tz ? ' selected' : '') + '>' + E(z) + '</option>'; }).join('') + '</select></label></div>' +
        '<div class="lv-checks"><label><input type="checkbox" name="recording_pref"' + (s && s.recording_pref === 'allowed' ? ' checked' : '') + (settings.live_recording_on === 'no' ? ' disabled' : '') + '> <span><b>Allow recording</b>: you can start and stop it during the lesson; everyone sees a recording notice. Off by default.' + (settings.live_recording_on === 'no' ? ' (Turned off by the administrator.)' : '') + '</span></label>' +
        '<label><input type="checkbox" name="recordings_for_students"' + (s && s.recordings_for_students ? ' checked' : '') + '> <span><b>Students may watch the recording</b> afterwards (only students of this lesson).</span></label>' +
        '<label><input type="checkbox" name="guests_allowed"' + (s && s.guests_allowed ? ' checked' : '') + (settings.live_guests_on === 'no' ? ' disabled' : '') + '> <span><b>Allow invited guests</b> (people without a Learnova account) with a private link you create.</span></label></div>' +
        '<p class="msg" id="lvm" role="alert"></p><div class="cta"><button class="btn main" type="submit">' + (s ? 'Save changes' : 'Schedule lesson') + '</button><a class="btn" href="' + (s ? '#s/' + s.id : '#') + '">Cancel</a></div></form>';
      var f = box.querySelector('#lvf'), msg = box.querySelector('#lvm');
      f.onsubmit = function (e) { e.preventDefault(); var v = function (n) { return f.elements[n].value.trim(); };
        var starts; try { starts = toUtc(v('date'), v('time'), v('time_zone')); } catch (x) { msg.textContent = 'Please check the date and time.'; return; }
        if (!s && new Date(starts).getTime() < Date.now() - 5 * 60000) { msg.textContent = 'That time has already passed. Choose a time in the future.'; return; }
        var row = { title: v('title'), kind: v('kind'), class_id: v('class_id') || null, subject: v('subject') || null, description: v('description') || null, starts_at: starts,
          duration_min: +v('duration_min'), time_zone: v('time_zone'), recording_pref: f.elements.recording_pref.checked ? 'allowed' : 'off', recordings_for_students: f.elements.recordings_for_students.checked, guests_allowed: f.elements.guests_allowed.checked };
        msg.className = 'msg'; msg.textContent = 'Saving…'; f.querySelector('button[type=submit]').disabled = true;
        var q = s ? S.db.from('live_sessions').update(row).eq('id', s.id).select('id').single() : S.db.from('live_sessions').insert(Object.assign({ teacher_id: me.user.id }, row)).select('id').single();
        q.then(function (r) { f.querySelector('button[type=submit]').disabled = false;
          if (r.error) { msg.textContent = setupMissing(r.error) ? 'Live lessons need the database update (migration 028) first.' : S.nice(r.error); return; }
          location.hash = '#s/' + r.data.id; });
      };
    });
  }

  // ---------------------------------------------------------------- one lesson
  function detail(id) {
    var box = loading('');
    Promise.resolve(S.db.from('live_sessions').select('*,classes(name)').eq('id', id).maybeSingle()).then(function (r) {
      var s = r.data; if (!s) { box.innerHTML = '<div class="lv-empty"><b>🔒</b>This lesson does not exist, or it is not one of yours.</div>'; return; }
      var st = status(s), mine = T && canManage(s);
      var head = '<div class="lv-sec" style="border-left:6px solid ' + hue(s.class_id || s.id) + '"><div class="row2"><div><h3 style="margin:0">' + E(s.title) + '<span class="lv-st ' + st + '">' + (st === 'active' ? '● live' : st) + '</span></h3>' +
        '<p class="small" style="margin:4px 0">' + E(when(s)) + ' · ' + s.duration_min + ' min · ' + E([KINDS[s.kind], s.classes && s.classes.name, s.subject].filter(Boolean).join(' · ')) + '</p>' + (s.description ? '<p style="white-space:pre-wrap;margin:6px 0 0">' + E(s.description) + '</p>' : '') +
        (s.recording_pref === 'allowed' ? '<p class="small" style="margin:6px 0 0">⏺ This lesson may be recorded. ' + E(settings.live_consent_text || '') + '</p>' : '') + (st === 'cancelled' && s.cancel_reason ? '<p class="msg">Cancelled: ' + E(s.cancel_reason) + '</p>' : '') + '</div><div class="cta">' +
        (st === 'active' ? '<a class="btn main lv-live" href="/live/room/?s=' + s.id + '">🎥 Join now</a>' : st === 'scheduled' ? (mine ? '<a class="btn main" href="/live/room/?s=' + s.id + '">▶ Start lesson</a>' : '<a class="btn main" href="/live/room/?s=' + s.id + '">🎥 Open the lesson room</a>') : '') +
        (mine && st === 'scheduled' ? '<a class="btn sm" href="#edit/' + s.id + '">Edit</a><button class="btn sm" type="button" id="lvcx" style="color:#b91c1c">Cancel lesson</button>' : '') +
        (mine && st === 'cancelled' ? '<button class="btn sm" type="button" id="lvrs">Restore lesson</button>' : '') + (mine && st === 'active' ? '<button class="btn sm" type="button" id="lvend" style="color:#b91c1c">End for everyone</button>' : '') +
        '</div></div><div id="lvcxb"></div></div>';
      box.innerHTML = '<p><a href="#">← All lessons</a></p>' + head + '<div class="lv-grid" style="margin-top:12px"><div class="lv-sec" id="sres"><h3>📚 Resources</h3><p class="small muted">Loading…</p></div>' +
        (mine && s.guests_allowed ? '<div class="lv-sec" id="sgst"><h3>👤 Guest invitations</h3><p class="small muted">Loading…</p></div>' : '') +
        (mine ? '<div class="lv-sec" id="sppl"><h3>👥 People</h3><p class="small muted">Loading…</p></div>' : '') +
        '<div class="lv-sec" id="satt"><h3>🧾 Attendance</h3><p class="small muted">Loading…</p></div><div class="lv-sec" id="srec"><h3>⏺ Recordings</h3><p class="small muted">Loading…</p></div>' + (mine ? '<div class="lv-sec" id="saud"><h3>🔍 Activity log</h3><p class="small muted">Loading…</p></div>' : '') + '</div>';
      var cx = box.querySelector('#lvcx'); if (cx) cx.onclick = function () { var b = box.querySelector('#lvcxb');
        b.innerHTML = '<form id="lvcf" class="row2" style="gap:8px;margin-top:10px"><input name="why" maxlength="300" placeholder="Reason students will see (optional)" style="flex:1;min-width:200px"><button class="btn sm" style="background:#b91c1c;color:#fff;border-color:#b91c1c">Yes, cancel this lesson</button><button class="btn sm" type="button" id="lvcn">Keep it</button></form>';
        b.querySelector('#lvcn').onclick = function () { b.innerHTML = ''; };
        b.querySelector('#lvcf').onsubmit = function (e) { e.preventDefault(); S.db.from('live_sessions').update({ status: 'cancelled', cancel_reason: this.elements.why.value.trim() || null }).eq('id', s.id).then(function (x) { if (x.error) alertBox(b, x.error); else detail(s.id); }); }; };
      var rs = box.querySelector('#lvrs'); if (rs) rs.onclick = function () { S.db.from('live_sessions').update({ status: 'scheduled' }).eq('id', s.id).then(function (x) { if (x.error) alertBox(box.querySelector('#lvcxb'), x.error); else detail(s.id); }); };
      var en = box.querySelector('#lvend'); if (en) en.onclick = function () { if (!en.dataset.sure) { en.dataset.sure = 1; en.textContent = 'End for everyone?'; return; }
        en.disabled = true; fn('live-session', { action: 'end', session: s.id }).then(function (d) { if (!d.ok) alertBox(box.querySelector('#lvcxb'), d.error); else detail(s.id); }); };
      resources(box.querySelector('#sres'), s, mine);
      if (mine && s.guests_allowed) guests(box.querySelector('#sgst'), s);
      if (mine) people(box.querySelector('#sppl'), s);
      attendance(box.querySelector('#satt'), s, mine);
      recordings(box.querySelector('#srec'), s, mine);
      if (mine) auditLog(box.querySelector('#saud'), s.id);
    });
  }
  function alertBox(el, e) { if (el) el.innerHTML = '<p class="msg" role="alert">' + E(typeof e === 'string' ? e : S.nice(e)) + '</p>'; }

  // resources: private files (Supabase Storage), links, simulations and notes
  function resources(el, s, mine) {
    Promise.resolve(S.db.from('live_session_resources').select('*').eq('session_id', s.id).order('created_at')).then(function (r) {
      var rows = r.data || [];
      el.innerHTML = '<h3>📚 Resources</h3>' + (rows.length ? rows.map(function (x) { var ic = { file: '📄', link: '🔗', simulation: '🧪', note: '📝', material: '📘' }[x.kind];
          return '<div class="lv-row"><b>' + ic + ' ' + E(x.title) + '</b>' + (x.size_bytes ? '<span class="small muted">' + Math.max(1, Math.round(x.size_bytes / 1024)) + ' KB</span>' : '') +
            '<button class="btn sm" type="button" data-open="' + x.id + '">Open</button>' + (mine ? '<button class="btn sm" type="button" data-del="' + x.id + '" style="color:#b91c1c">Remove</button>' : '') + '</div>' + (x.kind === 'note' ? '<div class="small" style="white-space:pre-wrap;margin:-4px 0 8px 26px" hidden id="nt' + x.id + '">' + E(x.note_text || '') + '</div>' : ''); }).join('')
        : '<p class="small muted">' + (mine ? 'Nothing yet. Add worksheets, slides, links, simulations or notes for this lesson.' : 'Your teacher has not added resources yet.') + '</p>') +
        (mine ? '<details style="margin-top:8px"><summary><b>＋ Add a resource</b></summary><form id="rf" class="lv-form" style="margin-top:8px"><div class="g2"><label><span>Type</span><select name="kind"><option value="file">File (PDF, slides, document, image; up to 25 MB)</option><option value="link">Web link</option><option value="simulation">Simulation link</option><option value="note">Lesson note</option></select></label>' +
          '<label><span>Title</span><input name="title" maxlength="160" required></label></div><label data-k="file"><span>File</span><input type="file" name="file" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.txt"></label>' +
          '<label data-k="link" hidden><span>Address (starts with https://, or a page on this site such as /simulations/…)</span><input name="url" maxlength="1000" placeholder="https://"></label><label data-k="note" hidden><span>Note</span><textarea name="note" rows="4" maxlength="8000"></textarea></label>' +
          '<label class="lv-checks" data-k="file"><label><input type="checkbox" name="dl"> <span>Students may download this file (otherwise it opens inside the site only)</span></label></label><p class="msg" id="rfm" role="alert"></p><div><button class="btn main sm">Add</button></div></form></details>' : '');
      el.querySelectorAll('[data-open]').forEach(function (b) { b.onclick = function () { openRes(rows.filter(function (x) { return x.id === b.getAttribute('data-open'); })[0], mine, el); }; });
      el.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Remove?'; return; }
        var x = rows.filter(function (y) { return y.id === b.getAttribute('data-del'); })[0];
        (x.storage_path ? S.db.storage.from('live-resources').remove([x.storage_path]) : Promise.resolve()).then(function () { return S.db.from('live_session_resources').delete().eq('id', x.id); }).then(function () { resources(el, s, mine); }); }; });
      var f = el.querySelector('#rf'); if (!f) return;
      var show = function () { var k = f.elements.kind.value, g = k === 'simulation' ? 'link' : k; f.querySelectorAll('[data-k]').forEach(function (x) { x.hidden = x.getAttribute('data-k') !== g; }); };
      f.elements.kind.onchange = show; show();
      f.onsubmit = function (e) { e.preventDefault(); var m = f.querySelector('#rfm'), k = f.elements.kind.value, title = f.elements.title.value.trim(), row = { session_id: s.id, kind: k, title: title, created_by: me.user.id };
        m.className = 'msg'; m.textContent = '';
        var go = function () { S.db.from('live_session_resources').insert(row).then(function (x) { if (x.error) { m.textContent = S.nice(x.error); return; } resources(el, s, mine); }); };
        if (k === 'file') { var file = f.elements.file.files[0]; if (!file) { m.textContent = 'Choose a file.'; return; }
          if (file.size > FILE_MAX) { m.textContent = 'That file is ' + Math.round(file.size / 1048576) + ' MB. The limit is 25 MB.'; return; }
          if (!FILE_TYPES.test(file.type)) { m.textContent = 'That type of file is not accepted. Use PDF, PowerPoint, Word, Excel, plain text or an image.'; return; }
          var path = s.id + '/' + (crypto.randomUUID ? crypto.randomUUID() : Date.now()) + '-' + file.name.replace(/[^\w.\-]+/g, '_').slice(-80);
          m.className = 'msg ok'; m.textContent = 'Uploading…';
          S.db.storage.from('live-resources').upload(path, file, { contentType: file.type, upsert: false }).then(function (u) {
            if (u.error) { m.className = 'msg'; m.textContent = /bucket|not found/i.test(u.error.message) ? 'File storage is not set up yet (migration 028).' : S.nice(u.error); return; }
            row.storage_path = path; row.mime = file.type; row.size_bytes = file.size; row.downloadable = f.elements.dl.checked; go(); });
          return; }
        if (k === 'link' || k === 'simulation') { var u = f.elements.url.value.trim(); if (!/^(https:\/\/|\/)/.test(u)) { m.textContent = 'The address must start with https:// or be a page on this site.'; return; } row.url = u; }
        if (k === 'note') { row.note_text = f.elements.note.value.trim(); if (!row.note_text) { m.textContent = 'Write the note.'; return; } }
        go(); };
    });
  }
  function openRes(x, mine, el) {
    if (!x) return;
    if (x.kind === 'note') { var n = el.querySelector('#nt' + x.id); if (n) n.hidden = !n.hidden; return; }
    if (x.url) { window.open(x.url, '_blank', 'noopener'); return; }
    S.db.storage.from('live-resources').createSignedUrl(x.storage_path, 600).then(function (r) {
      if (r.error) { alertBox(el, r.error); return; }
      var url = r.data.signedUrl, view = /pdf|image\//.test(x.mime || '');
      if (!view && !(x.downloadable || mine)) { alertBox(el, 'This file can only be opened by your teacher. Ask them to share it on screen.'); return; }
      var w = document.createElement('div'); w.className = 'lv-sec'; w.style.marginTop = '8px';
      w.innerHTML = '<div class="row2"><b>' + E(x.title) + '</b><span>' + ((x.downloadable || mine) ? '<a class="btn sm" href="' + E(url) + '" download>Download</a>' : '') + '<button class="btn sm" type="button">Close</button></span></div>' +
        (view ? (/image\//.test(x.mime) ? '<img src="' + E(url) + '" alt="' + E(x.title) + '" style="max-width:100%;border-radius:10px;margin-top:8px">' : '<iframe src="' + E(url) + '#toolbar=0" title="' + E(x.title) + '" style="width:100%;height:70vh;border:0;border-radius:10px;margin-top:8px"></iframe>') : '<p class="small">This file type cannot be shown inside the page; use Download.</p>');
      w.querySelector('button').onclick = function () { w.remove(); }; el.appendChild(w); w.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  function guests(el, s) {
    Promise.resolve(S.db.from('live_session_invitations').select('id,label,expires_at,max_uses,uses,revoked_at,created_at').eq('session_id', s.id).order('created_at', { ascending: false })).then(function (r) {
      var rows = r.data || [], maxd = +(settings.live_guest_max_days || 7);
      el.innerHTML = '<h3>👤 Guest invitations</h3><p class="small">Guests join with a private link, without an account. They only see this session, with their camera and microphone off at the start, no screen sharing and no recordings. Withdraw a link at any time.</p>' +
        '<form id="gf" class="row2" style="gap:8px;justify-content:flex-start"><input name="label" maxlength="80" placeholder="Who is it for? (e.g. Dr Wanjiku, guest speaker)" style="flex:1;min-width:200px"><select name="days">' + [1, 2, 3, 7, 14, 30].filter(function (d) { return d <= maxd; }).map(function (d) { return '<option value="' + d + '"' + (d === Math.min(7, maxd) ? ' selected' : '') + '>Expires in ' + d + ' day' + (d > 1 ? 's' : '') + '</option>'; }).join('') + '</select><button class="btn main sm">Create link</button></form><div id="gnew"></div>' +
        (rows.length ? rows.map(function (g) { var dead = g.revoked_at || new Date(g.expires_at) < new Date();
          return '<div class="lv-row"><b>' + E(g.label || 'Guest link') + '</b><span class="small muted">' + (g.revoked_at ? 'withdrawn' : dead ? 'expired' : 'until ' + E(fmt(g.expires_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))) + ' · used ' + g.uses + '/' + g.max_uses + '</span>' + (dead ? '' : '<button class="btn sm" type="button" data-rv="' + g.id + '" style="color:#b91c1c">Withdraw</button>') + '</div>'; }).join('') : '<p class="small muted">No invitations yet.</p>');
      el.querySelector('#gf').onsubmit = function (e) { e.preventDefault(); var f = this, out = el.querySelector('#gnew'); out.innerHTML = '<p class="small muted">Creating…</p>';
        fn('live-guest', { action: 'create', session: s.id, label: f.elements.label.value, days: +f.elements.days.value }).then(function (d) {
          if (!d.ok) { alertBox(out, d.error); return; }
          out.innerHTML = '<div class="panel tint"><b>Copy this link now.</b> It is shown only once; anyone with it can join this session as a guest until ' + E(fmt(d.expires_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + '.<div class="lv-link">' + E(d.link) + '</div><button class="btn sm" type="button" id="gcp">Copy link</button></div>';
          out.querySelector('#gcp').onclick = function () { try { navigator.clipboard.writeText(d.link); this.textContent = 'Copied'; } catch (x) {} };
          f.reset(); setTimeout(function () { var keep = out.innerHTML; guests(el, s); setTimeout(function () { var o2 = el.querySelector('#gnew'); if (o2) { o2.innerHTML = keep; var b = o2.querySelector('#gcp'); if (b) b.onclick = function () { try { navigator.clipboard.writeText(d.link); b.textContent = 'Copied'; } catch (x) {} }; } }, 300); }, 50); }); };
      el.querySelectorAll('[data-rv]').forEach(function (b) { b.onclick = function () { b.disabled = true; fn('live-guest', { action: 'revoke', invitation: b.getAttribute('data-rv') }).then(function (d) { if (!d.ok) alertBox(el.querySelector('#gnew'), d.error); else guests(el, s); }); }; });
    });
  }

  function people(el, s) {
    Promise.all([S.db.rpc('live_people', { sid: s.id }), S.db.from('live_session_participants').select('user_id,role').eq('session_id', s.id)]).then(function (r) {
      var ppl = r[0].data || [], extra = r[1].data || [];
      var kids = ppl.filter(function (p) { return p.role === 'student'; }), added = ppl.filter(function (p) { return p.role !== 'student'; });
      el.innerHTML = '<h3>👥 People</h3><p class="small">' + (s.class_id ? '<b>' + kids.length + '</b> student' + (kids.length === 1 ? '' : 's') + ' of ' + E(s.classes && s.classes.name || 'the class') + ' can join. ' : '') + 'Add a colleague who has a Learnova account (e.g. for a staff meeting); co-hosts can run the meeting with you.</p>' +
        (added.length ? added.map(function (p) { return '<div class="lv-row"><b>' + E(p.full_name || 'Member') + '</b><span class="lv-st scheduled">' + E(p.role) + '</span><button class="btn sm" type="button" data-rm="' + p.user_id + '">Remove</button></div>'; }).join('') : '') +
        '<form id="pf" class="row2" style="gap:8px;justify-content:flex-start;margin-top:6px"><input name="email" type="email" required placeholder="Their Learnova email" style="flex:1;min-width:200px" aria-label="Email"><select name="role"><option value="participant">Participant</option><option value="cohost">Co-host</option></select><button class="btn sm">Add</button></form><p class="msg" id="pfm" role="alert"></p>';
      el.querySelector('#pf').onsubmit = function (e) { e.preventDefault(); var f = this, m = el.querySelector('#pfm');
        S.db.rpc('live_add_person', { sid: s.id, email: f.elements.email.value, as_role: f.elements.role.value }).then(function (x) { if (x.error) { m.className = 'msg'; m.textContent = S.nice(x.error); return; } people(el, s); }); };
      el.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { S.db.from('live_session_participants').delete().eq('session_id', s.id).eq('user_id', b.getAttribute('data-rm')).then(function () { people(el, s); }); }; });
    });
  }

  function mins(sec) { return sec ? Math.max(1, Math.round(sec / 60)) + ' min' : '–'; }
  function attendance(el, s, mine) {
    Promise.all([S.db.from('live_session_attendance').select('*').eq('session_id', s.id).order('first_join'), mine ? S.db.rpc('live_people', { sid: s.id }) : Promise.resolve({ data: [] })]).then(function (r) {
      var rows = r[0].data || [], ppl = r[1].data || [], seen = {};
      rows.forEach(function (a) { if (a.user_id) seen[a.user_id] = 1; });
      var absent = mine && status(s) === 'completed' ? ppl.filter(function (p) { return p.role === 'student' && !seen[p.user_id]; }) : [];
      if (!rows.length && !absent.length) { el.innerHTML = '<h3>🧾 Attendance</h3><p class="small muted">' + (status(s) === 'scheduled' ? 'Attendance is taken automatically when people join the live lesson.' : 'No one joined.') + '</p>'; return; }
      el.innerHTML = '<h3>🧾 Attendance</h3><p class="small">Taken automatically from the video service' + (s.class_id ? '; the class register for that day is filled in when the lesson ends' : '') + '. A reconnect counts as the same person.</p><div style="overflow:auto"><table class="tbl"><thead><tr><th>Name</th><th>Role</th><th>Joined</th><th>Left</th><th>Time in lesson</th><th>Joins</th></tr></thead><tbody>' +
        rows.map(function (a) { return '<tr><td>' + E(a.display_name || (a.user_id === me.user.id ? 'You' : 'Member')) + '</td><td>' + E(a.role) + '</td><td>' + (a.first_join ? E(fmt(a.first_join, { hour: '2-digit', minute: '2-digit' })) : '–') + '</td><td>' + (a.status === 'in' ? '<span class="lv-st active">in the room</span>' : a.last_leave ? E(fmt(a.last_leave, { hour: '2-digit', minute: '2-digit' })) : '–') + '</td><td>' + mins(a.total_seconds) + (a.source === 'client' ? ' <span class="small muted" title="Exact times arrive from the video service; this row so far comes from the browser">*</span>' : '') + '</td><td>' + (a.joins || 1) + '</td></tr>'; }).join('') +
        absent.map(function (p) { return '<tr><td>' + E(p.full_name || 'Student') + '</td><td>student</td><td colspan="4"><span class="lv-st cancelled">absent</span></td></tr>'; }).join('') + '</tbody></table></div>';
    });
  }

  function recordings(el, s, mine) {
    Promise.resolve(S.db.from('live_session_recordings').select('*').eq('session_id', s.id).neq('status', 'deleted').order('started_at')).then(function (r) {
      var rows = r.data || [];
      var label = { starting: 'starting', recording: '● recording', processing: 'processing (can take a few minutes)', ready: 'ready', error: 'failed' };
      el.innerHTML = '<h3>⏺ Recordings</h3>' + (s.recording_pref !== 'allowed' ? '<p class="small muted">Recording is off for this lesson.</p>' : '') +
        (rows.length ? rows.map(function (x) { return '<div class="lv-row"><b>Recording · ' + E(fmt(x.started_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + (x.duration_s ? ' · ' + mins(x.duration_s) : '') + '</b><span class="lv-st ' + (x.status === 'ready' ? 'active' : x.status === 'error' ? 'cancelled' : 'scheduled') + '">' + E(label[x.status] || x.status) + '</span>' +
            (x.status === 'ready' ? '<button class="btn sm" type="button" data-play="' + x.id + '">▶ Watch</button>' : '') + (mine && /ready|error/.test(x.status) ? '<button class="btn sm" type="button" data-rd="' + x.id + '" style="color:#b91c1c">Delete</button>' : '') +
            (x.delete_after ? '<span class="small muted">kept until ' + E(fmt(x.delete_after, { day: 'numeric', month: 'short', year: 'numeric' })) + '</span>' : '') + (x.error ? '<span class="small" style="color:#b91c1c">' + E(x.error) + '</span>' : '') + '</div>'; }).join('')
          : (s.recording_pref === 'allowed' ? '<p class="small muted">' + (mine ? 'No recordings yet. Start one from the lesson room.' : s.recordings_for_students ? 'No recordings have been shared yet.' : 'Your teacher has not shared recordings of this lesson.') + '</p>' : '')) + (mine && s.recording_pref === 'allowed' ? '<p class="small">' + (s.recordings_for_students ? '👀 Students of this lesson can watch ready recordings.' : '🔒 Only you can watch these. Edit the lesson to let students watch.') + '</p>' : '') + '<div id="rplay"></div>';
      el.querySelectorAll('[data-play]').forEach(function (b) { b.onclick = function () { var out = el.querySelector('#rplay'); out.innerHTML = '<p class="small muted">Opening a private link…</p>';
        fn('live-recording', { action: 'access', recording: b.getAttribute('data-play') }).then(function (d) { if (!d.ok) { alertBox(out, d.error); return; }
          out.innerHTML = '<video src="' + E(d.link) + '" controls controlsList="nodownload" style="width:100%;border-radius:12px;margin-top:8px;background:#000"></video><p class="small muted">This private link works for about an hour.</p>'; }); }; });
      el.querySelectorAll('[data-rd]').forEach(function (b) { b.onclick = function () { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Delete for good?'; return; } b.disabled = true;
        fn('live-recording', { action: 'delete', recording: b.getAttribute('data-rd') }).then(function (d) { if (!d.ok) alertBox(el.querySelector('#rplay'), d.error); else recordings(el, s, mine); }); }; });
    });
  }

  function auditLog(el, sid) {
    var q = S.db.from('live_session_audit_logs').select('at,actor_kind,action,detail').order('at', { ascending: false }).limit(sid ? 60 : 150);
    if (sid) q = q.eq('session_id', sid);
    Promise.resolve(q).then(function (r) { var rows = r.data || [];
      el.innerHTML = '<h3>🔍 ' + (sid ? 'Activity log' : 'Audit log') + '</h3>' + (rows.length ? '<div style="overflow:auto;max-height:340px"><table class="tbl"><thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead><tbody>' + rows.map(function (a) {
        return '<tr><td>' + E(fmt(a.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + '</td><td>' + E(a.actor_kind) + '</td><td>' + E(a.action.replace(/_/g, ' ')) + (a.detail && (a.detail.title || a.detail.name || a.detail.label) ? ' · ' + E(a.detail.title || a.detail.name || a.detail.label) : '') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="small muted">Nothing logged yet.</p>'); });
  }

  // ---------------------------------------------------------------- student: my attendance
  function myAttendance() {
    var box = loading('#mine');
    Promise.resolve(S.db.from('live_session_attendance').select('total_seconds,first_join,joins,live_sessions(title,starts_at,duration_min)').eq('user_id', me.user.id).order('first_join', { ascending: false }).limit(200)).then(function (r) {
      if (r.error) { if (setupMissing(r.error)) notReady(box); else alertBox(box, r.error); return; }
      var rows = r.data || [];
      box.innerHTML = rows.length ? '<div class="lv-sec"><h3>🧾 My live-lesson attendance</h3><table class="tbl"><thead><tr><th>Lesson</th><th>Date</th><th>Time in lesson</th></tr></thead><tbody>' + rows.map(function (a) { var s = a.live_sessions || {};
        return '<tr><td>' + E(s.title || 'Lesson') + '</td><td>' + (a.first_join ? E(fmt(a.first_join, { day: 'numeric', month: 'short', year: 'numeric' })) : '–') + '</td><td>' + mins(a.total_seconds) + (s.duration_min ? ' of ' + s.duration_min + ' min' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>'
        : '<div class="lv-empty"><b>🧾</b>You have not joined a live lesson yet.</div>';
    });
  }

  // ---------------------------------------------------------------- admin
  function teachersAccess(el) {
    Promise.all([S.db.from('user_roles').select('user_id,role').in('role', ['teacher', 'school_teacher']), S.db.from('live_teacher_access').select('user_id,allowed')]).then(function (r) {
      if (r[1].error) { if (setupMissing(r[1].error) || /live_teacher_access/.test(r[1].error.message || '')) notReady(el); else alertBox(el, r[1].error); return; }
      var ids = {}; (r[0].data || []).forEach(function (x) { if (x.user_id !== me.user.id) ids[x.user_id] = x.role; });
      var acc = {}; (r[1].data || []).forEach(function (x) { acc[x.user_id] = x.allowed; });
      var mode = settings.live_teachers_mode || 'all', list = Object.keys(ids);
      return (list.length ? S.db.from('profiles').select('id,full_name,school_name').in('id', list) : Promise.resolve({ data: [] })).then(function (p) {
        var ppl = (p.data || []).sort(function (a, b) { return (a.full_name || '').localeCompare(b.full_name || ''); });
        var on = function (id) { return id in acc ? acc[id] : mode === 'all'; };
        el.innerHTML = '<h3>👩‍🏫 Who may run live lessons</h3><p class="small">You (admin) can always run, join, end and cancel any live lesson. Choose which other teachers may schedule and run them.</p>' +
          '<label class="row2" style="gap:8px;justify-content:flex-start"><b>Default:</b><select id="tmode"><option value="all"' + (mode === 'all' ? ' selected' : '') + '>Every teacher, except those I block</option><option value="approved"' + (mode === 'approved' ? ' selected' : '') + '>Only teachers I approve</option></select></label>' +
          (ppl.length ? ppl.map(function (x) { var ok = on(x.id); return '<div class="lv-row"><b>' + E(x.full_name || 'Teacher') + '</b><span class="small muted">' + E([ids[x.id] === 'school_teacher' ? 'school teacher' : 'teacher', x.school_name].filter(Boolean).join(' · ')) + '</span><span class="lv-st ' + (ok ? 'active' : 'cancelled') + '">' + (ok ? 'can run live lessons' : 'switched off') + '</span><button class="btn sm" type="button" data-tt="' + x.id + '" data-v="' + (!ok) + '">' + (ok ? 'Switch off' : 'Allow') + '</button></div>'; }).join('') : '<p class="small muted">No other teachers yet.</p>') + '<p class="msg" id="tam"></p>';
        el.querySelector('#tmode').onchange = function () { var v = this.value; S.db.from('app_settings').upsert({ k: 'live_teachers_mode', v: v }).then(function (x) { if (x.error) { el.querySelector('#tam').textContent = S.nice(x.error); return; } settings.live_teachers_mode = v; teachersAccess(el); }); };
        el.querySelectorAll('[data-tt]').forEach(function (b) { b.onclick = function () { b.disabled = true;
          S.db.from('live_teacher_access').upsert({ user_id: b.getAttribute('data-tt'), allowed: b.getAttribute('data-v') === 'true', set_by: me.user.id, set_at: new Date().toISOString() }).then(function (x) { if (x.error) { el.querySelector('#tam').textContent = S.nice(x.error); b.disabled = false; return; } teachersAccess(el); }); }; });
      });
    });
  }
  function adminView() {
    var box = shell('<div class="lv-grid"><div class="lv-sec" id="anow"><h3>🔴 Live now</h3><p class="small muted">Loading…</p></div><div class="lv-sec" id="atch"><h3>👩‍🏫 Who may run live lessons</h3><p class="small muted">Loading…</p></div><div class="lv-sec" id="aset"><h3>🛠 Video set-up</h3><p class="small muted">Checking…</p></div><div class="lv-sec" id="apol"></div><div class="lv-sec" id="aall"><h3>📋 All sessions</h3><p class="small muted">Loading…</p></div><div class="lv-sec" id="aaud"></div></div>', '#admin');
    fn('live-session', { action: 'status' }).then(function (d) { var el = box.querySelector('#aset'), ok = function (b) { return b ? '✅' : '❌'; };
      if (!d.ok) { el.innerHTML = '<h3>🛠 Video set-up</h3><p class="msg">' + E(d.error || 'The live-session function is not reachable.') + '</p>'; return; }
      var hookOk = (d.hooks || []).some(function (h) { return /daily-webhook/.test(h.url || '') && h.state === 'ACTIVE'; });
      el.innerHTML = '<h3>🛠 Video set-up</h3><table class="tbl"><tbody><tr><td>' + ok(d.daily) + '</td><td>Daily API key and domain' + (d.domain ? ' (' + E(d.domain) + '.daily.co)' : '') + '</td></tr><tr><td>' + ok(d.pepper) + '</td><td>Guest invitation secret</td></tr><tr><td>' + ok(d.webhookSecret) + '</td><td>Webhook signing secret</td></tr><tr><td>' + ok(hookOk) + '</td><td>Daily sends signed events (attendance, recordings)</td></tr></tbody></table>' +
        (d.daily && d.webhookSecret && !hookOk ? '<button class="btn main sm" type="button" id="hk">Connect Daily events now</button>' : '') + '<p class="msg" id="hkm"></p>';
      var hk = el.querySelector('#hk'); if (hk) hk.onclick = function () { hk.disabled = true; fn('live-session', { action: 'setup-webhook' }).then(function (x) { var m = el.querySelector('#hkm'); if (!x.ok) { m.textContent = x.error; hk.disabled = false; } else { m.className = 'msg ok'; m.textContent = 'Connected.'; } }); };
    });
    var pol = box.querySelector('#apol');
    pol.innerHTML = '<h3>⚖️ Policies</h3><form id="pf" class="lv-form"><div class="g2"><label><span>Guest invitations</span><select name="live_guests_on"><option value="yes">Allowed</option><option value="no">Turned off everywhere</option></select></label><label><span>Longest guest link (days)</span><input type="number" min="1" max="60" name="live_guest_max_days"></label>' +
      '<label><span>Recording</span><select name="live_recording_on"><option value="yes">Teachers may record</option><option value="no">Turned off everywhere</option></select></label><label><span>Keep recordings for (days)</span><input type="number" min="1" max="3650" name="live_retention_days"></label></div>' +
      '<label><span>Recording notice shown before joining</span><textarea name="live_consent_text" rows="2" maxlength="600"></textarea></label><div class="cta"><button class="btn main sm">Save policies</button><button class="btn sm" type="button" id="sweep">Delete recordings past their date now</button></div><p class="msg" id="pfm"></p></form>';
    var f = pol.querySelector('#pf'); ['live_guests_on', 'live_guest_max_days', 'live_recording_on', 'live_retention_days', 'live_consent_text'].forEach(function (k) { if (settings[k] != null) f.elements[k].value = settings[k]; });
    f.onsubmit = function (e) { e.preventDefault(); var m = f.querySelector('#pfm'), rows = ['live_guests_on', 'live_guest_max_days', 'live_recording_on', 'live_retention_days', 'live_consent_text'].map(function (k) { return { k: k, v: String(f.elements[k].value).trim() }; });
      S.db.from('app_settings').upsert(rows).then(function (r) { if (r.error) { m.className = 'msg'; m.textContent = S.nice(r.error); return; } rows.forEach(function (x) { settings[x.k] = x.v; }); m.className = 'msg ok'; m.textContent = 'Saved.'; }); };
    pol.querySelector('#sweep').onclick = function () { var b = this, m = f.querySelector('#pfm'); b.disabled = true; fn('live-recording', { action: 'sweep' }).then(function (d) { b.disabled = false; m.className = d.ok ? 'msg ok' : 'msg'; m.textContent = d.ok ? d.deleted + ' recording(s) deleted.' : d.error; }); };
    loadSessions().then(function (all) { var el = box.querySelector('#aall');
      var c = { active: 0, scheduled: 0, completed: 0, cancelled: 0, expired: 0 }; all.forEach(function (s) { c[status(s)]++; });
      var now = box.querySelector('#anow'), act = all.filter(function (s) { return status(s) === 'active'; });
      now.innerHTML = '<h3>🔴 Live now</h3>' + (act.length ? act.map(function (s) { return '<div class="lv-row"><b>' + E(s.title) + '</b><span class="small muted">' + E(s.classes && s.classes.name || KINDS[s.kind]) + ' · started ' + E(fmt(s.started_at || s.starts_at, { hour: '2-digit', minute: '2-digit' })) + '</span><a class="btn main sm" href="/live/room/?s=' + s.id + '">🎥 Join as host</a><button class="btn sm" type="button" data-aend="' + s.id + '" style="color:#b91c1c">⏹ End for everyone</button></div>'; }).join('') : '<p class="small muted">No lesson is live right now.</p>') + '<p class="msg" id="anm"></p>';
      now.querySelectorAll('[data-aend]').forEach(function (b) { b.onclick = function () { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'End it now?'; return; } b.disabled = true;
        fn('live-session', { action: 'end', session: b.getAttribute('data-aend') }).then(function (d) { if (!d.ok) { now.querySelector('#anm').textContent = d.error; b.disabled = false; } else adminView(); }); }; });
      el.innerHTML = '<h3>📋 All sessions</h3><div class="stats">' + Object.keys(c).map(function (k) { return '<div class="stat"><span class="small muted">' + k + '</span><b>' + c[k] + '</b></div>'; }).join('') + '</div>' +
        '<div style="overflow:auto;max-height:420px;margin-top:8px"><table class="tbl"><thead><tr><th>When</th><th>Session</th><th>Class</th><th>Status</th><th></th></tr></thead><tbody>' + all.slice().reverse().map(function (s) {
          return '<tr><td>' + E(fmt(s.starts_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + '</td><td><a href="#s/' + s.id + '">' + E(s.title) + '</a></td><td>' + E(s.classes && s.classes.name || KINDS[s.kind]) + '</td><td><span class="lv-st ' + status(s) + '">' + status(s) + '</span></td><td>' + (status(s) === 'scheduled' ? '<button class="btn sm" type="button" data-acx="' + s.id + '" style="color:#b91c1c">Cancel</button>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>';
      el.querySelectorAll('[data-acx]').forEach(function (b) { b.onclick = function () { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Cancel it?'; return; }
        S.db.from('live_sessions').update({ status: 'cancelled', cancel_reason: 'Cancelled by the administrator' }).eq('id', b.getAttribute('data-acx')).then(function () { adminView(); }); }; });
    }).catch(function (e) { if (setupMissing(e)) notReady(box.querySelector('#aall')); });
    auditLog(box.querySelector('#aaud'), null);
    teachersAccess(box.querySelector('#atch'));
  }
})();
