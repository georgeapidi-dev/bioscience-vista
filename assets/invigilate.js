/* VistaEd invigilation view (23 Nov 2026, roadmap phase 3). From a class's Assessments tab → 🛡 Invigilate.
   A full-screen board of one tile per student for one quiz or exam, refreshed every 10 seconds from class_quiz_board:
   not started, working (answered count, time left), idle, left the page now, times away, submitted.
   A short beep and a red banner when someone leaves the exam page (sound can be turned off). Links to a Live Classroom
   video room for the class, for remote invigilation. Read only: it changes nothing.
   BVINV.open({ S, cls, quiz: {id, title}, kids: [{id, full_name}], nq }) */
(function () {
  var V = window.BVINV = {};
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function mmss(s) { s = Math.max(0, Math.round(+s || 0)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  V.open = function (o) {
    var S = o.S, wrap = document.createElement('div'), timer = null, sound = true, prevAway = {}, ctx = null;
    wrap.style.cssText = 'position:fixed;inset:0;z-index:80;background:#0b1220;color:#e2e8f0;overflow:auto;padding:14px 18px;font-family:inherit';
    wrap.innerHTML = '<style>.iv-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}.iv-t{border-radius:12px;padding:10px 12px;background:#1e293b;border:2px solid #334155;min-height:92px}' +
      '.iv-t b{display:block;font-size:.95rem;color:#fff;margin-bottom:4px}.iv-t .s{font-size:.8rem}.iv-t.prog{border-color:#f59e0b}.iv-t.done{border-color:#16a34a;opacity:.75}.iv-t.away{border-color:#ef4444;background:#450a0a;animation:ivp 1s ease-in-out infinite alternate}.iv-t.idle{border-color:#eab308}' +
      '@keyframes ivp{from{box-shadow:0 0 0 0 rgba(239,68,68,.6)}to{box-shadow:0 0 0 6px rgba(239,68,68,0)}}.iv-h{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:12px}' +
      '.iv-h a,.iv-h button{border:1px solid #475569;background:#1e293b;color:#fff;border-radius:9px;padding:6px 11px;font-weight:700;text-decoration:none;cursor:pointer}.iv-al{background:#991b1b;color:#fff;border-radius:10px;padding:8px 12px;margin:0 0 10px;font-weight:700}</style>' +
      '<div class="iv-h"><div><div style="font-size:.8rem;color:#94a3b8">🛡 Invigilating · ' + E(o.cls.name) + '</div><b style="font-size:1.15rem;color:#fff">' + E(o.quiz.title) + '</b></div>' +
      '<div><span id="ivsum" style="margin-right:10px"></span><button type="button" id="ivsnd">🔔 Sound on</button> <a href="/live/?class=' + E(o.cls.id) + '" target="_blank" rel="noopener" title="Open the Live Classroom for this class to invigilate on video">🎥 Video room</a> <button type="button" id="ivx">✕ Close</button></div></div>' +
      '<div id="ival"></div><div class="iv-g" id="ivg"><p>Loading…</p></div><p style="font-size:.75rem;color:#94a3b8;margin-top:12px">Refreshes every 10 seconds. "Left the page" means the exam tab is hidden, out of focus or out of full screen. Idle = no activity for 3 minutes.</p>';
    document.body.appendChild(wrap);
    function beep() { if (!sound) return; try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); var os = ctx.createOscillator(), g = ctx.createGain(); os.frequency.value = 880; g.gain.value = 0.08; os.connect(g); g.connect(ctx.destination); os.start(); os.stop(ctx.currentTime + 0.25); } catch (e) {} }
    function close() { clearInterval(timer); wrap.remove(); document.removeEventListener('keydown', esc); }
    function esc(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', esc);
    wrap.querySelector('#ivx').onclick = close;
    wrap.querySelector('#ivsnd').onclick = function () { sound = !sound; this.textContent = sound ? '🔔 Sound on' : '🔕 Sound off'; };
    function load() {
      S.db.rpc('class_quiz_board', { cls: o.cls.id }).then(function (r) {
        if (r.error) { wrap.querySelector('#ivg').innerHTML = '<p>' + E(r.error.message) + '</p>'; return; }
        var by = {}; (r.data || []).forEach(function (x) { if (x.quiz_id === o.quiz.id) by[x.student_id] = x; });
        var n = { none: 0, prog: 0, done: 0, away: 0 }, newAway = [];
        var tiles = o.kids.slice().sort(function (a, b) { return (a.full_name || '').localeCompare(b.full_name || ''); }).map(function (k) {
          var a = by[k.id], st = !a ? 'none' : a.status === 'in_progress' ? 'prog' : 'done', away = a && st === 'prog' && a.away_now, idle = a && st === 'prog' && !away && (Date.now() - new Date(a.last_seen)) > 180000;
          n[st]++; if (away) { n.away++; if (!prevAway[k.id]) newAway.push(k.full_name || 'A student'); } prevAway[k.id] = !!away;
          var line = !a ? 'Not started' : st === 'done' ? '✓ Submitted ' + new Date(a.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (away ? '🚩 Left the page now' : idle ? '⚠ Idle' : '✎ Working') + ' · ' + a.answered + '/' + o.nq + (a.seconds_left != null ? ' · ⏱ ' + mmss(a.seconds_left) : '');
          return '<div class="iv-t ' + (away ? 'away' : idle ? 'idle' : st) + '"><b>' + E(k.full_name || '(no name)') + '</b><div class="s">' + line + '</div>' + (a && a.away_count ? '<div class="s" style="color:#fca5a5">Left ' + a.away_count + '× · ' + mmss(a.away_seconds || 0) + ' away</div>' : '') + '</div>';
        });
        wrap.querySelector('#ivg').innerHTML = tiles.join('');
        wrap.querySelector('#ivsum').textContent = n.prog + ' working · ' + n.done + ' submitted · ' + n.none + ' not started' + (n.away ? ' · ' + n.away + ' away' : '');
        var al = wrap.querySelector('#ival');
        if (newAway.length) { beep(); al.innerHTML = '<div class="iv-al">🚩 Left the exam page: ' + newAway.map(E).join(', ') + ' (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')</div>' + al.innerHTML; }
      }, function () {});
    }
    load(); timer = setInterval(function () { if (!document.body.contains(wrap)) { clearInterval(timer); return; } load(); }, 10000);
  };
})();
