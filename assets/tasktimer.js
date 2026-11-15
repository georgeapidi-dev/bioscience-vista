/* Learnova · task timer. Every task (interactive lesson, exam-style set, examination) has a time allowance.
   The timer starts by itself when a signed-in student opens the task, and the time spent is recorded for the teacher.
   - Lessons and exam-style sets: only the time with the page in view counts. At zero the student is told and can carry on;
     the extra time is recorded.
   - Examinations: the clock runs from the moment the examination is started, even with the page closed, and at zero the
     page hands the examination in (the caller passes auto: true and onZero).
   A teacher sets the allowance for a class on /time/. Teachers are never timed.
   Needs migration 037 (task_open, task_tick). Without it the timer still counts on this device, but nothing is recorded. */
(function () {
  if (window.BVTimer) return;
  var CSS = '.bvt{position:fixed;top:calc(8px + env(safe-area-inset-top,0px));right:calc(8px + env(safe-area-inset-right,0px));z-index:2147482000;font:700 14px/1.2 system-ui,-apple-system,"Segoe UI",Arial,sans-serif}' +
    '.bvt-b{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:8px;cursor:pointer;color:#fff;background:linear-gradient(120deg,#4f46e5,#0ea5e9);border-radius:999px;padding:7px 14px 7px 10px;box-shadow:0 6px 18px rgba(30,41,59,.28)}' +
    '.bvt-b:focus-visible{outline:3px solid #fde047;outline-offset:2px}.bvt-i{font-size:18px}.bvt-t{font-size:17px;font-variant-numeric:tabular-nums;letter-spacing:.02em}.bvt-l{display:block;font-weight:600;font-size:11px;opacity:.92}' +
    '.bvt.min .bvt-l{display:none}.bvt.warn .bvt-b{background:linear-gradient(120deg,#f59e0b,#ea580c)}.bvt.over .bvt-b{background:linear-gradient(120deg,#dc2626,#be123c)}.bvt.staff .bvt-b{background:linear-gradient(120deg,#7c3aed,#db2777)}' +
    '.bvt a{color:#fff;text-decoration:underline}' +
    '.bvt-say{position:fixed;left:50%;top:calc(56px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:2147482001;max-width:min(92vw,520px);background:#1e1b4b;color:#fff;border-left:6px solid #f59e0b;border-radius:14px;padding:12px 16px;font:600 15px/1.45 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;box-shadow:0 10px 30px rgba(15,23,42,.35)}' +
    '.bvt-say button{all:unset;cursor:pointer;float:right;margin-left:10px;font-weight:800;padding:0 4px}.bvt-say.red{border-left-color:#f43f5e}' +
    '.timer.over{background:#b91c1c;color:#fff}.timer.warn{background:#b45309;color:#fff}' +
    '@media print{.bvt,.bvt-say{display:none!important}}';
  var styled = false;
  function style() { if (styled) return; styled = true; var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); }
  function fmt(s) { s = Math.max(0, Math.floor(s)); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + ('0' + m).slice(-2) : m) + ':' + ('0' + x).slice(-2); }
  function mins(n) { return n + ' minute' + (n === 1 ? '' : 's'); }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
  function num(v) { v = parseFloat(v); return isFinite(v) && v >= 0 ? v : null; }

  var live = document.createElement('div');   // read out by screen readers at the key moments only
  live.setAttribute('aria-live', 'polite'); live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)';
  function say(text, red, quiet) {
    live.textContent = text; if (!live.parentNode && document.body) document.body.appendChild(live);
    if (quiet) return;
    style(); var old = document.querySelector('.bvt-say'); if (old) old.remove();
    var n = document.createElement('div'); n.className = 'bvt-say' + (red ? ' red' : ''); n.setAttribute('role', 'status');
    var b = document.createElement('button'); b.type = 'button'; b.textContent = '✕'; b.setAttribute('aria-label', 'Close this message'); b.onclick = function () { n.remove(); };
    n.appendChild(b); n.appendChild(document.createTextNode(text)); document.body.appendChild(n);
    setTimeout(function () { if (n.parentNode) n.remove(); }, red ? 20000 : 9000);
  }

  /* o: { db, kind: 'lesson'|'quiz', ref, mount (element, or none for the floating timer), auto (hand in at zero), onZero, attempt (id or number),
          fallbackSeconds (seconds left as the old server function gave them), minutes (allowance to use when the server cannot say), noun } */
  function start(o) {
    style();
    var own = !o.mount, el = o.mount, box = null, total = null, used = 0, pending = 0, endAt = null, serverOn = false, stopped = false, zero = false, staff = false, told = {};
    var last = Date.now(), iv = null, hb = null, noun = o.noun || (o.kind === 'lesson' ? 'lesson' : 'task'), LK = 'bvt:' + o.kind + ':' + o.ref + ':' + (o.attempt || 1);
    if (own) {
      box = document.createElement('div'); box.className = 'bvt' + (get('bvt-min') === '1' ? ' min' : ''); box.setAttribute('role', 'timer'); box.setAttribute('aria-label', 'Time for this ' + noun);
      box.innerHTML = '<button type="button" class="bvt-b" title="Show or hide the details"><span class="bvt-i" aria-hidden="true">⏱</span><span><b class="bvt-t">…</b><small class="bvt-l"></small></span></button>';
      box.querySelector('button').onclick = function () { box.classList.toggle('min'); put('bvt-min', box.classList.contains('min') ? '1' : '0'); };
      document.body.appendChild(box); el = box.querySelector('.bvt-t');
      var bar = document.querySelector('body > [role=status]'); if (bar) bar.style.paddingRight = '168px';   // keep the sign-in line clear of the timer
    }
    function label(t) { if (box) box.querySelector('.bvt-l').textContent = t; }
    function cls(name) { var n = own ? box : el; ['warn', 'over', 'low'].forEach(function (c) { n.classList.toggle(c, c === name); }); }
    function paint() {
      if (stopped) return;
      if (staff) return;
      if (total == null) { el.textContent = (own ? '' : '⏱ ') + fmt(used); label('time on this ' + noun); return; }   // no allowance known: show the time spent
      var left = endAt != null ? (endAt - Date.now()) / 1000 : total - used;
      if (left > 0) {
        el.textContent = (own ? '' : '⏱ ') + fmt(left); label('left of ' + mins(Math.round(total / 60)));
        cls(left <= 60 ? (own ? 'warn' : 'low') : left <= 300 ? 'warn' : '');
        if (left <= 300 && !told.five && total > 600) { told.five = true; say('5 minutes left for this ' + noun + '.', false, false); }
        if (left <= 60 && !told.one && total > 120) { told.one = true; say('1 minute left for this ' + noun + '.', false, !o.auto); }
      } else if (o.auto) {
        el.textContent = (own ? '' : '⏱ ') + '0:00'; cls('over');
        if (!zero) { zero = true; say('Time is up. Your ' + noun + ' is being handed in.', true); if (o.onZero) o.onZero(); }
      } else {
        el.textContent = (own ? '' : '⏱ ') + '+' + fmt(-left); label('extra time · ' + mins(Math.round(total / 60)) + ' used'); cls('over');
        if (!zero) { zero = true; say('Your time for this ' + noun + ' is used up. You can keep working and finish it: the extra time is recorded for your teacher.', true); if (o.onZero) o.onZero(); }
      }
    }
    function tick() {
      var now = Date.now(), dt = (now - last) / 1000; last = now;
      if (document.visibilityState === 'hidden' || dt > 5 || dt < 0) dt = 0;   // only time with the page in view counts; a sleeping device adds nothing
      if (!staff) { used += dt; pending += dt; }
      if (!serverOn && !staff && Math.floor(used) % 10 === 0) put(LK, Math.floor(used));
      paint();
    }
    function flush() {
      var n = Math.floor(pending); if (!serverOn || staff || n < 1) return; pending -= n;
      try { o.db.rpc('task_tick', { k: o.kind, r: o.ref, secs: n }).then(function () {}, function () {}); } catch (e) {}
    }
    function vis() { if (document.visibilityState === 'hidden') flush(); else last = Date.now(); }
    function go() {
      if (stopped) return;
      last = Date.now(); paint(); iv = setInterval(tick, 1000); hb = setInterval(flush, 30000);
      document.addEventListener('visibilitychange', vis); window.addEventListener('pagehide', flush);
    }
    function local() {   // the server cannot say (migration 037 not run yet, or no connection): count on this device only
      serverOn = false; used = num(get(LK)) || 0;
      if (o.auto) { if (o.fallbackSeconds != null) { total = o.fallbackSeconds; endAt = Date.now() + o.fallbackSeconds * 1000; } else total = null; }
      else if (o.fallbackSeconds != null) total = used + o.fallbackSeconds;
      else total = o.minutes ? o.minutes * 60 : null;
      go();
    }
    var call; try { call = o.db.rpc('task_open', { k: o.kind, r: o.ref, peek: false }); } catch (e) { call = Promise.resolve({ error: e }); }
    Promise.resolve(call).then(function (r) {
      if (stopped) return;
      var d = r && r.data; if (!r || r.error || !d || typeof d !== 'object' || d.minutes == null) return local();
      serverOn = true; total = d.minutes * 60;
      if (d.staff) {   // a teacher looking at the task: show the allowance, time nothing
        staff = true;
        if (own) { box.classList.add('staff'); el.textContent = mins(d.minutes); box.querySelector('.bvt-l').innerHTML = 'for students · <a href="/time/">change the time</a>'; box.querySelector('a').onclick = function (e) { e.stopPropagation(); }; }
        else el.textContent = '⏱ ' + mins(d.minutes) + ' for students';
        return;
      }
      if (o.auto) {   // examination: the clock runs from the start, whether or not the page is open
        var gone = d.elapsed != null ? d.elapsed : (o.fallbackSeconds != null ? total - o.fallbackSeconds : 0);
        endAt = Date.now() + (total - gone) * 1000;
      } else {
        // the time already used on THIS attempt: all recorded time, less what was recorded before the attempt began
        var all = d.seconds || 0, base = num(get(LK + ':base'));
        if (base == null || base > all) {
          base = d.elapsed != null ? Math.max(0, all - d.elapsed) : ((+o.attempt || 1) > 1 && o.kind === 'lesson' ? all : 0);
          put(LK + ':base', base);
        }
        used = all - base;
      }
      go();
    }, local);
    return {
      stop: function () { if (stopped) return; flush(); stopped = true; clearInterval(iv); clearInterval(hb); document.removeEventListener('visibilitychange', vis); window.removeEventListener('pagehide', flush); if (box && box.parentNode) box.remove(); var s = document.querySelector('.bvt-say'); if (s) s.remove(); },
      spent: function () { return Math.floor(used); }
    };
  }

  /* the times for a task without opening it (the start page of a quiz) */
  function peek(db, kind, ref) {
    try { return Promise.resolve(db.rpc('task_open', { k: kind, r: ref, peek: true })).then(function (r) { return r && !r.error && r.data && r.data.minutes != null ? r.data : null; }, function () { return null; }); }
    catch (e) { return Promise.resolve(null); }
  }
  window.BVTimer = { start: start, peek: peek, fmt: fmt };

  /* Interactive lesson pages: start by itself once the student's sign-in is known (site_assets/sb-lesson.js says when). */
  var me = document.currentScript;
  if (me && me.getAttribute('data-auto') === 'lesson') {
    var begun = false, begin = function () {
      if (begun || !window.BV_DB) return; begun = true;
      var db = window.BV_DB, id = new URLSearchParams(location.search).get('lid') || window.LESSON_ID || (window.SPEC && window.SPEC.id) || '';
      var attempt = 1; try { attempt = Math.max(1, parseInt(localStorage.getItem('lv-attempt:' + location.pathname) || '1', 10) || 1); } catch (e) {}
      var run = function (ref) { if (ref) window.BV_TASK_TIMER = start({ db: db, kind: 'lesson', ref: String(ref).slice(0, 80), attempt: attempt, minutes: 45, noun: 'lesson' }); };
      if (id) return run(id);
      db.from('materials').select('lesson_id').eq('path', location.pathname).maybeSingle().then(function (r) { run(r.data && r.data.lesson_id); }, function () {});
    };
    document.addEventListener('bv-signed-in', begin); document.addEventListener('bv-teacher', begin);
    if (window.BV_STUDENT || window.BV_TEACHER) begin();
  }
})();
