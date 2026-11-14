/* Learnova · Live lesson room (/live/room/?s=ID) and guest joining (/live/join/?t=TOKEN).
   Video, audio, screen sharing, gallery, chat and the participant list come from Daily Prebuilt (daily-js), joined with a
   one-room, short-lived token from the live-join or live-guest Edge Function. Beside the video sit the lesson's whiteboard
   (the teacher writes; everyone else watches live) and its resources. Teachers can record, see raised hands and end the
   lesson for everyone. Guests never sign in and only ever see this one session. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  var QS = new URLSearchParams(location.search), GUEST = /^\/live\/join\//.test(location.pathname);
  var SID = /^[0-9a-f-]{36}$/.test(QS.get('s') || '') ? QS.get('s') : null, TOKEN = QS.get('t') || '';
  var DAILY_JS = 'https://unpkg.com/@daily-co/daily-js@0.89.1/dist/daily-iframe.js';
  var frame = null, info = null, sess = null, hands = {}, recOn = false, waitT = null, myHand = false;

  var CSS = '.lr{display:grid;gap:10px}.lr-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:var(--raised,#fff);border:1px solid var(--line,#e5e7eb);border-radius:16px;padding:8px 12px;box-shadow:0 2px 10px rgba(15,23,42,.06)}' +
    '.lr-top h2{margin:0;font-size:1.1rem;flex:1;min-width:160px}.lr-pill{font:800 .75rem system-ui;border-radius:999px;padding:5px 10px;background:#f1f5f9;color:#334155;white-space:nowrap}.lr-pill.ok{background:#dcfce7;color:#166534}.lr-pill.warn{background:#fef3c7;color:#92400e}.lr-pill.bad{background:#fee2e2;color:#991b1b}' +
    '.lr-rec{display:none;background:#dc2626;color:#fff;font:800 .8rem system-ui;border-radius:999px;padding:6px 12px;animation:lrp 1.4s infinite}.lr-rec.on{display:inline-block}@keyframes lrp{50%{opacity:.6}}' +
    '.lr button.k{font:700 .85rem system-ui;border:2px solid var(--k,#cbd5e1);background:color-mix(in srgb,var(--k,#64748b) 10%,transparent);color:var(--k,#334155);border-radius:11px;padding:7px 11px;cursor:pointer;min-height:38px}.lr button.k[aria-pressed=true]{background:var(--k);color:#fff}.lr button.k:disabled{opacity:.5}' +
    '.lr-main{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:10px;min-height:70vh}.lr-main.solo{grid-template-columns:1fr}.lr-vid{position:relative;border-radius:16px;overflow:hidden;background:#0f172a;min-height:62vh}' +
    '.lr-side{display:flex;flex-direction:column;gap:8px;min-width:0}.lr-side[hidden]{display:none}.lr-tabs{display:flex;gap:6px}.lr-pane{flex:1;border-radius:16px;overflow:hidden;background:var(--raised,#fff);border:1px solid var(--line,#e5e7eb);min-height:60vh}.lr-pane iframe{width:100%;height:100%;min-height:60vh;border:0;display:block}' +
    '.lr-res{padding:10px;overflow:auto;max-height:70vh}.lr-res .r{display:flex;gap:8px;align-items:center;padding:8px 0;border-top:1px solid var(--line,#eef2f7)}.lr-res .r b{flex:1}' +
    '.lr-hands{position:absolute;left:10px;top:10px;z-index:3;display:flex;flex-direction:column;gap:4px}.lr-hands span{background:#fde68a;color:#78350f;font:800 .8rem system-ui;border-radius:999px;padding:4px 10px;box-shadow:0 2px 6px rgba(0,0,0,.2)}' +
    '.lr-pre{max-width:620px;margin:0 auto}.lr-pre .panel{display:grid;gap:10px}.lr-consent{background:#fef2f2;border:2px solid #fecaca;border-radius:12px;padding:10px;display:flex;gap:8px;align-items:flex-start}.lr-consent input{margin-top:4px}' +
    '@media (max-width:900px){.lr-main{grid-template-columns:1fr}.lr-vid{min-height:50vh}}';
  if (!document.getElementById('lr-css')) { var st = document.createElement('style'); st.id = 'lr-css'; st.textContent = CSS; document.head.appendChild(st); }

  function fn(name, body) {
    return S.db.functions.invoke(name, { body: body }).then(function (r) { var d = r.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } } if (d) return d;
      var c = r.error && r.error.context; if (c && typeof c.json === 'function') return c.json().catch(function () { return null; }).then(function (x) { return x || { ok: false, error: 'The service did not answer.' }; });
      return { ok: false, error: navigator.onLine === false ? 'You are offline. Check your internet connection.' : 'The service did not answer.' }; });
  }
  function msg(t, back) { app.innerHTML = '<section class="panel lr-pre"><h2>🎥 Live lesson</h2><p>' + t + '</p>' + (back === false ? '' : '<a class="btn sm" href="' + (GUEST ? '/' : '/live/') + '">' + (GUEST ? 'Home' : '← Live Classroom') + '</a>') + '</section>'; }
  function loadDaily() { if (window.Daily) return Promise.resolve(window.Daily); return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = DAILY_JS; s.crossOrigin = 'anonymous';
    s.onload = function () { window.Daily ? res(window.Daily) : rej(new Error('The video library did not load.')); }; s.onerror = function () { rej(new Error('The video library could not be downloaded. Check your connection.')); }; document.head.appendChild(s); }); }
  var fmt = function (d, o) { try { return new Intl.DateTimeFormat(undefined, o).format(new Date(d)); } catch (e) { return String(d); } };

  if (navigator.onLine === false) { msg('You are offline. Live lessons need an internet connection.'); return; }
  if (GUEST) guestStart(); else S.guard(app, { school: true, allowPending: true, anyone: true }).then(memberStart).catch(function (e) { if (typeof e !== 'string') msg(E(S.nice(e))); });

  // ---------------------------------------------------------------- signed-in teachers and students
  function memberStart() {
    if (!SID) { msg('This lesson link is incomplete.'); return; }
    S.db.from('live_sessions').select('*,classes(name)').eq('id', SID).maybeSingle().then(function (r) {
      sess = r.data; if (!sess) { msg('This lesson does not exist, or you are not on its list.'); return; }
      if (sess.status === 'cancelled') { msg('This lesson was cancelled.' + (sess.cancel_reason ? ' ' + E(sess.cancel_reason) : '')); return; }
      if (sess.status === 'completed') { msg('This lesson has ended. Its resources and recordings are on the <a href="/live/#s/' + sess.id + '">lesson page</a>.'); return; }
      ask();
    });
  }
  function ask() {
    fn('live-join', { session: SID }).then(function (d) {
      if (d.waiting) { prejoin(null, d); clearTimeout(waitT); waitT = setTimeout(ask, 15000); return; }
      if (!d.ok) { msg(E(d.error || 'Could not join.')); return; }
      info = d; prejoin(d);
    });
  }
  function prejoin(d, wait) {
    var title = sess ? sess.title : (info && info.session && info.session.title) || 'Live lesson';
    var rec = d ? d.recording : sess && sess.recording_pref === 'allowed';
    app.innerHTML = '<div class="lr-pre"><section class="panel"><p class="label">BioScience Vista Live</p><h2 style="margin:0">🎥 ' + E(title) + '</h2>' +
      (sess ? '<p class="small" style="margin:0">' + E(fmt(sess.starts_at, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })) + ' · ' + sess.duration_min + ' min' + (sess.classes ? ' · ' + E(sess.classes.name) : '') + '</p>' : '') +
      (wait ? '<p class="lr-pill warn" style="justify-self:start">⏳ ' + E(wait.error) + '</p>' :
        (rec ? '<label class="lr-consent"><input type="checkbox" id="cs"> <span><b>⏺ This lesson may be recorded.</b> ' + E(d.consent || '') + ' You will see a red "Recording" sign whenever it is.</span></label>' : '') +
        '<p class="small">Your browser will ask to use your camera and microphone. ' + (d.manager ? 'You join as the <b>host</b>: you can mute, remove and admit people, share your screen, record and end the lesson.' : 'Your camera and microphone start off; switch them on when your teacher asks.') + '</p>' +
        '<div class="cta"><button class="btn main" id="go"' + (rec ? ' disabled' : '') + '>Join the lesson</button><a class="btn" href="' + (GUEST ? '/' : '/live/') + '">Not now</a></div>') + '</section></div>';
    var cs = app.querySelector('#cs'), go = app.querySelector('#go');
    if (cs) cs.onchange = function () { go.disabled = !cs.checked; };
    if (go) go.onclick = function () { go.disabled = true; go.textContent = 'Joining…'; room(d); };
  }

  // ---------------------------------------------------------------- guests
  function guestStart() {
    if (!/^[A-Za-z0-9_-]{30,60}$/.test(TOKEN)) { msg('This invitation link is not complete. Ask the teacher to send it again.', false); return; }
    fn('live-guest', { action: 'check', token: TOKEN }).then(function (d) {
      if (!d.ok) { msg(E(d.error || 'This invitation cannot be used.'), false); return; }
      var s = d.session;
      app.innerHTML = '<div class="lr-pre"><section class="panel"><p class="label">You are invited to a BioScience Vista Live session</p><h2 style="margin:0">🎥 ' + E(s.title) + '</h2>' +
        '<p class="small" style="margin:0">' + E(fmt(s.starts_at, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })) + ' (your time) · ' + s.duration_min + ' min' + (s.teacher ? ' · with ' + E(s.teacher) : '') + '</p>' +
        '<form id="gj" class="lr-form" style="display:grid;gap:10px"><label><b>Your name</b> (as others will see it)<input name="name" maxlength="40" required autocomplete="name" style="width:100%"></label>' +
        (s.recording ? '<label class="lr-consent"><input type="checkbox" name="cs" required> <span><b>⏺ This session may be recorded.</b> You will see a red "Recording" sign whenever it is.</span></label>' : '') +
        '<p class="small">As a guest you join this session only: your camera and microphone start off, and screen sharing and recording are for the host. No account is needed.</p>' +
        '<p class="msg" id="gm" role="alert"></p><div><button class="btn main">Join as a guest</button></div></form></section></div>';
      var f = app.querySelector('#gj');
      f.onsubmit = function (e) { e.preventDefault(); var b = f.querySelector('button'), m = f.querySelector('#gm'); b.disabled = true; b.textContent = 'Joining…';
        var tryJoin = function () { fn('live-guest', { action: 'join', token: TOKEN, name: f.elements.name.value }).then(function (x) {
          if (x.waiting) { m.className = 'msg ok'; m.textContent = '⏳ ' + x.error; clearTimeout(waitT); waitT = setTimeout(tryJoin, 15000); return; }
          if (!x.ok) { m.className = 'msg'; m.textContent = x.error || 'Could not join.'; b.disabled = false; b.textContent = 'Join as a guest'; return; }
          info = { url: x.url, token: x.token, manager: false, canRecord: false, name: f.elements.name.value, guest: true }; sess = { id: x.session.id, title: x.session.title }; room(info); }); };
        tryJoin(); };
    });
  }

  // ---------------------------------------------------------------- the room
  function room(d) {
    var M = !!d.manager;
    app.innerHTML = '<div class="lr"><div class="lr-top"><h2>🎥 ' + E(sess.title) + '</h2><span class="lr-rec" id="rec">● Recording</span><span class="lr-pill" id="net">Connecting…</span><span class="lr-pill" id="cnt"></span>' +
      (M ? '' : '<button type="button" class="k" id="hand" style="--k:#ca8a04" aria-pressed="false">✋ Raise hand</button>') +
      (d.canRecord ? '<button type="button" class="k" id="rbtn" style="--k:#dc2626">⏺ Record</button>' : '') +
      '<button type="button" class="k" id="tb" style="--k:#0d9488" aria-pressed="true">🖊 Whiteboard</button>' + (GUEST ? '' : '<button type="button" class="k" id="tr" style="--k:#2563eb" aria-pressed="false">📚 Resources</button>') +
      (M ? '<button type="button" class="k" id="end" style="--k:#b91c1c">⏹ End for everyone</button>' : '') + '<button type="button" class="k" id="leave" style="--k:#475569">Leave</button></div>' +
      '<div class="lr-main" id="main"><div class="lr-vid" id="vid"><div class="lr-hands" id="hands"></div></div><div class="lr-side" id="side"><div class="lr-pane" id="pane"></div></div></div>' +
      '<p class="small muted" id="hint">' + (M ? 'Tip: the whiteboard beside the video is shared live with everyone in the lesson. Use "Project" on it for full screen.' : 'The whiteboard beside the video shows what your teacher writes, live.') + '</p></div>';
    var pane = app.querySelector('#pane'), side = app.querySelector('#side'), main = app.querySelector('#main');
    var board = function () { pane.innerHTML = '<iframe title="Lesson whiteboard" allow="fullscreen" src="' + (M ? '/board/?' + (sess.class_id ? 'class=' + sess.class_id + '&n=' + encodeURIComponent((sess.classes && sess.classes.name) || '') + '&' : '') + 'ls=' + sess.id + '&embed=1' : '/board/?watch=' + sess.id + '&embed=1') + '"></iframe>'; };
    board();
    var tb = app.querySelector('#tb'), tr = app.querySelector('#tr');
    tb.onclick = function () { var on = tb.getAttribute('aria-pressed') !== 'true' || (tr && tr.getAttribute('aria-pressed') === 'true');
      if (tr) tr.setAttribute('aria-pressed', 'false'); tb.setAttribute('aria-pressed', on); side.hidden = !on; main.classList.toggle('solo', !on); if (on) board(); };
    if (tr) tr.onclick = function () { var on = tr.getAttribute('aria-pressed') !== 'true'; tr.setAttribute('aria-pressed', on); tb.setAttribute('aria-pressed', 'false'); side.hidden = !on; main.classList.toggle('solo', !on); if (on) resourcesPane(pane); };

    loadDaily().then(function (Daily) {
      frame = Daily.createFrame(app.querySelector('#vid'), { showLeaveButton: true, showFullscreenButton: true, iframeStyle: { position: 'absolute', inset: '0', width: '100%', height: '100%', border: '0' } });
      var net = app.querySelector('#net'), cnt = app.querySelector('#cnt');
      var setNet = function (t, k) { net.textContent = t; net.className = 'lr-pill ' + (k || ''); };
      frame.on('joined-meeting', function () { setNet('🟢 Connected', 'ok'); count(); })
        .on('left-meeting', function () { left('You left the lesson.'); })
        .on('participant-joined', count).on('participant-left', function (e) { if (e && e.participant) { delete hands[e.participant.session_id]; drawHands(); } count(); })
        .on('network-quality-change', function (e) { var q = e && e.threshold; setNet(q === 'good' ? '🟢 Connected' : q === 'low' ? '🟡 Weak connection' : '🔴 Very weak connection', q === 'good' ? 'ok' : q === 'low' ? 'warn' : 'bad'); })
        .on('network-connection', function (e) { if (e && e.event === 'interrupted') setNet('🔴 Reconnecting…', 'bad'); if (e && e.event === 'connected') setNet('🟢 Connected', 'ok'); })
        .on('recording-started', function () { setRec(true); }).on('recording-stopped', function () { setRec(false); }).on('recording-error', function () { setRec(false); note('Recording stopped because of an error.'); })
        .on('app-message', function (e) { var m = e && e.data; if (!m) return;
          if (m.t === 'hand') { if (m.up) hands[e.fromId] = m.name || 'Someone'; else delete hands[e.fromId]; drawHands(); }
          if (m.t === 'lower' && m.to === 'all') { hands = {}; drawHands(); if (myHand) toggleHand(false); }
          if (m.t === 'end') left('Your teacher ended the lesson. Thank you for joining!'); })
        .on('error', function (e) { left('The video connection failed: ' + E((e && (e.errorMsg || (e.error && e.error.msg))) || 'unknown error') + '.'); });
      function count() { try { var n = Object.keys(frame.participants()).length; cnt.textContent = '👥 ' + n; } catch (x) {} }
      frame.join({ url: d.url, token: d.token, userName: d.name || undefined }).catch(function (e) { left('Could not join the video: ' + E((e && e.errorMsg) || String(e)) + '.'); });
    }, function (e) { app.querySelector('#vid').innerHTML = '<p class="msg" style="margin:16px">' + E(e.message) + '</p>'; });

    var hand = app.querySelector('#hand'); if (hand) hand.onclick = function () { toggleHand(!myHand); };
    var rb = app.querySelector('#rbtn'); if (rb) rb.onclick = function () { rb.disabled = true; var start = !recOn;
      fn('live-recording', { action: start ? 'start' : 'stop', session: sess.id }).then(function (x) { rb.disabled = false; if (!x.ok) { note(x.error); return; } setRec(start); note(start ? 'Recording started. Everyone sees the red sign.' : 'Recording stopped. It will be ready on the lesson page in a few minutes.'); }); };
    var end = app.querySelector('#end'); if (end) end.onclick = function () { if (!end.dataset.sure) { end.dataset.sure = 1; end.textContent = 'Really end for everyone?'; setTimeout(function () { delete end.dataset.sure; end.textContent = '⏹ End for everyone'; }, 4000); return; }
      end.disabled = true; try { frame.sendAppMessage({ t: 'end' }, '*'); } catch (x) {}
      fn('live-session', { action: 'end', session: sess.id }).then(function (x) { if (!x.ok) note(x.error); try { frame.leave(); } catch (y) {} left('The lesson has ended for everyone.' + (x.register ? ' The class register was filled in.' : '')); }); };
    app.querySelector('#leave').onclick = function () { try { frame.leave(); } catch (x) { left('You left the lesson.'); } };
  }
  function toggleHand(up) { myHand = up; var h = app.querySelector('#hand'); if (h) { h.setAttribute('aria-pressed', up); h.textContent = up ? '✋ Lower hand' : '✋ Raise hand'; }
    try { frame.sendAppMessage({ t: 'hand', up: up, name: (info && info.name) || 'Student' }, '*'); } catch (x) {} }
  function drawHands() { var el = app.querySelector('#hands'); if (!el) return; var ks = Object.keys(hands);
    el.innerHTML = ks.map(function (k) { return '<span>✋ ' + E(hands[k]) + '</span>'; }).join('') + (ks.length && info && info.manager ? '<span style="cursor:pointer;background:#fff" id="lowall">Lower all hands</span>' : '');
    var la = el.querySelector('#lowall'); if (la) la.onclick = function () { hands = {}; drawHands(); try { frame.sendAppMessage({ t: 'lower', to: 'all' }, '*'); } catch (x) {} }; }
  function setRec(on) { recOn = on; var r = app.querySelector('#rec'); if (r) r.classList.toggle('on', on); var b = app.querySelector('#rbtn'); if (b) { b.textContent = on ? '⏹ Stop recording' : '⏺ Record'; b.setAttribute('aria-pressed', on); } }
  function note(t) { var h = app.querySelector('#hint'); if (h) { h.textContent = t; h.className = 'small'; } }
  function left(t) { try { if (frame) frame.destroy(); } catch (x) {} frame = null;
    app.innerHTML = '<section class="panel lr-pre"><h2>👋 ' + t + '</h2>' + (GUEST ? '<p>You can close this page.</p>' : '<div class="cta"><a class="btn main" href="/live/room/?s=' + sess.id + '">Join again</a><a class="btn" href="/live/#s/' + sess.id + '">Lesson page</a><a class="btn" href="/live/">Live Classroom</a></div>') + '</section>'; }

  function resourcesPane(pane) {
    pane.innerHTML = '<div class="lr-res"><b>📚 Lesson resources</b><p class="small muted">Loading…</p></div>';
    S.db.from('live_session_resources').select('*').eq('session_id', sess.id).order('created_at').then(function (r) { var rows = r.data || [], box = pane.querySelector('.lr-res');
      box.innerHTML = '<b>📚 Lesson resources</b>' + (rows.length ? rows.map(function (x) { return '<div class="r"><b>' + ({ file: '📄', link: '🔗', simulation: '🧪', note: '📝', material: '📘' }[x.kind]) + ' ' + E(x.title) + '</b><button class="btn sm" type="button" data-o="' + x.id + '">Open</button></div>' + (x.kind === 'note' ? '<div class="small" style="white-space:pre-wrap" hidden id="n' + x.id + '">' + E(x.note_text || '') + '</div>' : ''); }).join('') : '<p class="small muted">No resources for this lesson.</p>') + '<div id="rv"></div>';
      box.querySelectorAll('[data-o]').forEach(function (b) { b.onclick = function () { var x = rows.filter(function (y) { return y.id === b.getAttribute('data-o'); })[0], rv = box.querySelector('#rv');
        if (x.kind === 'note') { var n = box.querySelector('#n' + x.id); n.hidden = !n.hidden; return; }
        if (x.url) { window.open(x.url, '_blank', 'noopener'); return; }
        S.db.storage.from('live-resources').createSignedUrl(x.storage_path, 600).then(function (u) { if (u.error) { rv.innerHTML = '<p class="msg">' + E(S.nice(u.error)) + '</p>'; return; }
          var url = u.data.signedUrl; rv.innerHTML = /image\//.test(x.mime || '') ? '<img src="' + E(url) + '" alt="' + E(x.title) + '" style="max-width:100%;border-radius:10px;margin-top:8px">' : /pdf/.test(x.mime || '') ? '<iframe src="' + E(url) + '#toolbar=0" title="' + E(x.title) + '" style="width:100%;height:60vh;border:0;margin-top:8px"></iframe>' : (x.downloadable || (info && info.manager) ? '<p><a class="btn sm" href="' + E(url) + '" download>Download ' + E(x.title) + '</a></p>' : '<p class="small">Your teacher will share this file on screen.</p>'); }); }; });
    });
  }
})();
