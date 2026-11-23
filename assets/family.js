/* Parents · BioscienceVista · by George Apidi (21 Nov 2026, migration 073)
   A parent types their child's 8-character website code and sees a read-only summary: classes, work set and done, results,
   teacher feedback, topic progress and labs. No account, no sign-in, nothing can be changed. The code stops working when it expires. */
(function () {
  var S = window.BVS, app = document.getElementById('app'); if (!app || !S) return;
  var E = S.E, KEY = 'bv-family-codes';
  var CSS = '.fm{max-width:900px;margin:0 auto}.fm-card{background:#fff;border-radius:20px;padding:20px;border:1px solid #e2e8f0;box-shadow:0 8px 24px rgba(15,23,42,.06);margin:0 0 14px}' +
    '.fm-hero{background:linear-gradient(120deg,#0d9488,#2563eb 55%,#7c3aed);color:#fff;border-radius:22px;padding:20px 22px;margin:0 0 14px}.fm-hero h1,.fm-hero h2{color:#fff;margin:2px 0 6px}.fm-hero p{margin:0;color:#e0f2fe}' +
    '.fm-code{font:800 1.8rem ui-monospace,Menlo,monospace;letter-spacing:.3em;text-transform:uppercase;text-align:center;width:100%;padding:14px;border:3px solid #99f6e4;border-radius:16px;background:#f0fdfa}' +
    '.fm-go{display:block;width:100%;margin-top:12px;font-size:1.1rem;padding:14px;border-radius:14px;background:linear-gradient(120deg,#0d9488,#2563eb);border:0;color:#fff;font-weight:800;cursor:pointer}.fm-go:disabled{opacity:.6}' +
    '.fm-msg{min-height:1.4em;margin:10px 0 0;font-weight:700;color:#b91c1c}.fm h3{margin:0 0 8px}.fm-li{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid #f1f5f9}.fm-li>div{min-width:0;flex:1 1 220px}' +
    '.fm-pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:.8rem;font-weight:700}.ok{background:#dcfce7;color:#166534}.due{background:#fef3c7;color:#92400e}.late{background:#fee2e2;color:#991b1b}.muted{color:#64748b;font-size:.88rem}' +
    '.fm-q{font-style:italic;color:#334155;margin-top:3px}.fm-bar{height:10px;border-radius:9px;background:#f1f5f9;overflow:hidden;margin-top:4px}.fm-bar i{display:block;height:100%}.fm-kids{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 0}.fm-kids button{font:inherit;font-weight:700;padding:6px 12px;border-radius:999px;border:2px solid #99f6e4;background:#fff;cursor:pointer}' +
    '.fm-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:14px}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  function clean(v) { return String(v || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase(); }
  function saved() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function keep(list) { try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 6))); } catch (e) {} }
  function call(code) {
    return S.db.functions.invoke('class-join', { body: { action: 'parent', code: code } }).then(function (r) {
      if (!r.error) return r.data || {};
      var c = r.error.context; return c && typeof c.json === 'function' ? c.json().catch(function () { return { error: 'Something went wrong. Try again.' }; }) : { error: 'Could not reach BioscienceVista. Check your internet connection.' };
    }, function () { return { error: 'Could not reach BioscienceVista. Check your internet connection.' }; });
  }
  function dt(x) { return x ? new Date(x).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''; }

  function ask(pre, err) {
    var kids = saved();
    app.innerHTML = '<div class="fm"><section class="fm-hero"><h1>👪 My child\'s progress</h1><p>Type your child\'s 8-character website code (the one on their BioscienceVista card). You see their classes, work, results and feedback. You cannot change anything.</p></section>' +
      '<section class="fm-card"><form id="ff"><label for="fc" style="font-weight:700">Your child\'s website code</label><input id="fc" class="fm-code" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" value="' + E(pre || '') + '">' +
      '<button class="fm-go" type="submit">Show progress ▶</button><p class="fm-msg" role="alert">' + E(err || '') + '</p></form>' +
      (kids.length ? '<p class="muted" style="margin:12px 0 0">Saved on this device:</p><div class="fm-kids">' + kids.map(function (k, i) { return '<button type="button" data-k="' + i + '">' + E(k.name) + '</button>'; }).join('') + '<button type="button" id="fclr" title="Forget the saved codes on this device">🗑 Forget</button></div>' : '') +
      '<p class="muted" style="margin:12px 0 0">Keep the code private: it is your child\'s sign-in code too (they also need their PIN). It stops working when it expires; the school or BioscienceVista renews it.</p></section></div>';
    var f = app.querySelector('#ff'), inp = app.querySelector('#fc'); inp.focus();
    f.onsubmit = function (e) { e.preventDefault(); var c = clean(inp.value); if (c.length !== 8) { app.querySelector('.fm-msg').textContent = 'The website code has 8 letters and numbers.'; return; } show(c, f.querySelector('button')); };
    app.querySelectorAll('[data-k]').forEach(function (b) { b.onclick = function () { show(kids[+b.getAttribute('data-k')].code, b); }; });
    var cl = app.querySelector('#fclr'); if (cl) cl.onclick = function () { keep([]); ask(); };
  }
  function show(code, btn) {
    if (btn) { btn.disabled = true; }
    call(code).then(function (d) {
      if (btn) btn.disabled = false;
      if (d.error) { var k = saved().filter(function (x) { return x.code !== code; }); if (/expired|not recognised/i.test(d.error)) keep(k); return ask(code, d.error); }
      var k2 = saved().filter(function (x) { return x.code !== code; }); k2.unshift({ code: code, name: (d.name || 'My child').split(' ')[0] }); keep(k2);
      draw(d);
    });
  }
  function draw(d) {
    var now = Date.now(), W = d.work || [], R = d.results || [], T = d.topics || [], L = d.labs || [], C = d.classes || [];
    var open = W.filter(function (w) { return w.state !== 'done'; }), late = open.filter(function (w) { return w.due && new Date(w.due) < now; });
    var fb = R.filter(function (r) { return r.feedback; });
    app.innerHTML = '<div class="fm"><section class="fm-hero"><p>👪 Read-only view</p><h2>' + E(d.name || '') + '</h2><p>' + (C.length ? C.map(function (c) { return E(c.name) + (c.teacher ? ' (' + E(c.teacher) + ')' : ''); }).join(' · ') : 'No class yet') + '</p>' +
      '<p style="margin-top:8px">📝 ' + open.length + ' to do' + (late.length ? ' · ⚠️ ' + late.length + ' overdue' : '') + ' · ✅ ' + (W.length - open.length) + ' done · 💬 ' + fb.length + ' with teacher feedback</p></section>' +
      '<div class="fm-two"><section class="fm-card"><h3>📌 Work set by the teacher</h3>' + (W.length ? W.map(function (w) { var lt = w.state !== 'done' && w.due && new Date(w.due) < now;
          return '<div class="fm-li"><div><b>' + E(w.title) + '</b><div class="muted">' + E(w['class'] || '') + (w.due ? ' · due ' + dt(w.due) : '') + '</div></div><span class="fm-pill ' + (w.state === 'done' ? 'ok">✓ done' : lt ? 'late">overdue' : 'due">to do') + '</span></div>'; }).join('') : '<p class="muted">No work set in the last two months.</p>') + '</section>' +
      '<section class="fm-card"><h3>📊 Results and feedback</h3>' + (R.length ? R.map(function (r) { var pc = r.max ? Math.round(100 * r.score / r.max) : null;
          return '<div class="fm-li"><div><b>' + E(r.title || 'Result') + '</b> <span class="muted">' + dt(r.at) + '</span>' + (r.feedback ? '<div class="fm-q">💬 “' + E(String(r.feedback).replace(/[#*_>`]/g, '').slice(0, 260)) + '”</div>' : '') + '</div>' + (pc != null ? '<b>' + r.score + ' / ' + r.max + ' · ' + pc + '%</b>' : '') + '</div>'; }).join('') : '<p class="muted">No results yet.</p>') + '</section></div>' +
      (T.length ? '<section class="fm-card"><h3>🧠 Progress by topic</h3><p class="muted">Share of marks gained in each topic over the last year. 70% or more is strong; under 40% needs support.</p>' + T.map(function (t) { var c = t.pct >= 70 ? '#22c55e' : t.pct >= 40 ? '#f59e0b' : '#ef4444';
          return '<div class="fm-li"><div><b>' + E(t.topic) + '</b> <span class="muted">' + t.marks + ' marks</span><div class="fm-bar"><i style="width:' + t.pct + '%;background:' + c + '"></i></div></div><b>' + t.pct + '%</b></div>'; }).join('') + '</section>' : '') +
      (L.length ? '<section class="fm-card"><h3>🔬 Virtual labs</h3>' + L.map(function (l) { return '<div class="fm-li"><div><b>' + E(l.title || 'Lab') + '</b>' + (l.comment ? '<div class="fm-q">💬 “' + E(String(l.comment).slice(0, 200)) + '”</div>' : '') + '</div><span class="fm-pill ' + (l.handed_in ? 'ok">handed in ' + dt(l.handed_in) : 'due">in progress') + '</span></div>'; }).join('') + '</section>' : '') +
      '<p class="muted">Code valid until ' + dt(d.until) + '. <a href="#" id="fb">← Another child or code</a></p></div>';
    app.querySelector('#fb').onclick = function (e) { e.preventDefault(); ask(); };
  }
  if (!S.on) return S.notReady(app);
  var q = clean(new URLSearchParams(location.search).get('code') || '');
  if (q.length === 8) show(q); else ask();
})();
