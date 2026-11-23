/* AI Science Tutor · BioscienceVista · by George Apidi (phase 4)
   A chat with seven learning modes. Answers come from the ai-tutor server function (keys stay on the server, daily free limit).
   It teaches and questions; it never does assessed work. The Help Desk (teacher's notes, send to teacher) stays below on the page. */
(function () {
  var box = document.getElementById('ait'); if (!box) return;
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var MODES = [
    ['teach', '📖', 'Teach me', 'Explains the idea simply, then builds up.', 'Teach me how enzymes work'],
    ['test', '✅', 'Test me', 'One question at a time, with feedback.', 'Test me on osmosis'],
    ['guide', '🧭', 'Guide me', 'Hints and questions, no straight answers.', 'Why does a plant cell not burst in water?'],
    ['challenge', '🏔️', 'Challenge me', 'A hard exam-style or data question.', 'Challenge me on photosynthesis'],
    ['connect', '🔗', 'Connect ideas', 'Links across topics and subjects.', 'How is respiration linked to chemistry and physics?'],
    ['mistake', '🩹', 'Explain my mistake', 'Finds the misconception and fixes it.', 'I think plants respire only at night. Is that right?'],
    ['realworld', '🌍', 'Real-world science', 'Everyday life, health, technology, careers.', 'Where is pH important in real life?']
  ];
  var KEY = 'bv-ait-v1', st = { mode: 'teach', topic: '', log: [] };
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv && sv.log) st = sv; } catch (e) { }
  var q = new URLSearchParams(location.search); if (q.get('topic')) { var nt = q.get('topic').slice(0, 120); if (nt !== st.topic) { st.log = []; st.sid = null; st.flag = false; } st.topic = nt; } if (q.get('mode') && MODES.some(function (m) { return m[0] === q.get('mode'); })) st.mode = q.get('mode');
  function save() { try { st.log = st.log.slice(-40); localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } }
  function md(t) {   // safe minimal formatting: escape first, then **bold**, line breaks and simple lists
    var h = E(t).replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>').replace(/(^|\s)\*([^*\n]+)\*(?=\s|$|[.,;:!?])/g, '$1<i>$2</i>');
    var out = [], para = [], list = null, BUL = /^\s*([-•*]|\d+[.)])\s+/;
    function flush() { if (para.length) { out.push('<p>' + para.join('<br>') + '</p>'); para = []; } if (list) { out.push('<' + list.t + '>' + list.i.join('') + '</' + list.t + '>'); list = null; } }
    h.split('\n').forEach(function (l) {   // consecutive bullet or numbered lines become a list, the rest paragraphs
      if (!l.trim()) { flush(); return; }
      if (BUL.test(l)) { var t = /^\s*\d/.test(l) ? 'ol' : 'ul'; if (para.length) { var keep = list; list = null; flush(); list = keep; } if (list && list.t !== t) flush(); if (!list) list = { t: t, i: [] }; list.i.push('<li>' + l.replace(BUL, '') + '</li>'); return; }
      if (list) flush(); para.push(l.replace(/^#{1,4}\s+(.*)$/, '<b>$1</b>'));
    });
    flush(); return out.join('');
  }
  var mode = function () { return MODES.filter(function (m) { return m[0] === st.mode; })[0] || MODES[0]; };

  box.innerHTML =
    '<div class="ait-modes" role="tablist" aria-label="Learning mode">' + MODES.map(function (m) {
      return '<button type="button" role="tab" data-m="' + m[0] + '" aria-selected="' + (m[0] === st.mode) + '"><span aria-hidden="true">' + m[1] + '</span> ' + m[2] + '</button>'; }).join('') + '</div>' +
    '<p class="ait-desc" id="ait-desc"></p>' +
    '<div id="ait-mine" class="ait-mine" hidden></div>' +
    '<div class="ait-topic"><label for="ait-topic">Topic (optional)</label><input id="ait-topic" maxlength="120" placeholder="e.g. enzymes, titration, forces, statistics"></div>' +
    '<div class="ait-log" id="ait-log" aria-live="polite"></div>' +
    '<form class="ait-form" id="ait-form"><label for="ait-in" class="sr-only">Your message</label><textarea id="ait-in" rows="2" maxlength="1500" placeholder="Ask a question, give an answer or describe what you are stuck on…"></textarea>' +
    '<div class="ait-act"><button type="submit" class="vx-btn">Send</button><button type="button" class="vx-btn ghost" id="ait-new">New chat</button><span class="vx-muted" id="ait-left" role="status"></span></div></form>' +
    '<details class="ait-past" id="ait-past" hidden><summary>🗂️ Your saved chats</summary><div id="ait-plist"></div></details>' +
    '<p class="ait-note">Your chats are saved to your account so you can come back to them on any device; your teachers can read them too. Your tutor helps you learn; it will not write assessed work (IA, EE, reports, homework to hand in) for you. AI can make mistakes: check important facts with your notes or your teacher.</p>';
  var log = box.querySelector('#ait-log'), inp = box.querySelector('#ait-in'), tp = box.querySelector('#ait-topic'), left = box.querySelector('#ait-left'), busy = false;
  tp.value = st.topic || '';
  function paint() {
    var m = mode();
    box.querySelector('#ait-desc').innerHTML = '<b>' + m[1] + ' ' + E(m[2]) + ':</b> ' + E(m[3]);
    [].forEach.call(box.querySelectorAll('.ait-modes button'), function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-m') === st.mode)); });
    if (!st.log.length) {
      log.innerHTML = '<div class="ait-empty"><p>Try one of these:</p>' + MODES.map(function (x) { return '<button type="button" data-try="' + x[0] + '">' + x[1] + ' ' + E(x[4]) + '</button>'; }).join('') + '</div>';
      [].forEach.call(log.querySelectorAll('[data-try]'), function (b) { b.onclick = function () { st.mode = b.getAttribute('data-try'); inp.value = MODES.filter(function (x) { return x[0] === st.mode; })[0][4]; paint(); inp.focus(); }; });
      return;
    }
    log.innerHTML = st.log.map(function (h) { return '<div class="ait-msg ' + (h.who === 'tutor' ? 'tut' : h.who === 'err' ? 'err' : 'me') + '">' + (h.who === 'tutor' ? '<span class="who">🤖 Tutor</span>' : '') + (h.who === 'tutor' ? md(h.text) : '<p>' + E(h.text) + '</p>') + '</div>'; }).join('');
    log.scrollTop = log.scrollHeight;
  }
  [].forEach.call(box.querySelectorAll('.ait-modes button'), function (b) { b.onclick = function () { st.mode = b.getAttribute('data-m'); save(); paint(); }; });
  tp.oninput = function () { st.topic = tp.value; save(); };
  box.querySelector('#ait-new').onclick = function () { st.log = []; st.sid = null; st.flag = false; save(); paint(); past(); inp.focus(); };
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); box.querySelector('#ait-form').requestSubmit(); } });

  /* saved chats (tutor_sessions, migration 063). If that table is not there yet, chats stay on this device only. */
  var INTEG = /\b(write|do|complete|finish|rewrite|paraphrase|make|give me)\b.{0,40}\b(my|the|an?|this)\b.{0,25}\b(ia|internal assessment|extended essay|ee|lab report|essay|homework|assignment|coursework|personal project|report|conclusion|evaluation|research question)\b/i;
  var SAVE = true;
  function db() { var S = window.BVS; return S && S.db ? S.db : null; }
  function persist() {
    var D = db(); if (!SAVE || !D || !st.log.some(function (h) { return h.who === 'tutor'; })) return;
    var msgs = st.log.filter(function (h) { return h.who !== 'err'; }).slice(-60), first = (msgs.filter(function (h) { return h.who === 'me'; })[0] || {}).text || 'Tutor chat';
    var row = { mode: st.mode, topic: (st.topic || '').slice(0, 120) || null, title: first.slice(0, 160), messages: msgs, flagged: !!st.flag };
    var p = st.sid ? D.from('tutor_sessions').update(row).eq('id', st.sid).select('id') : D.from('tutor_sessions').insert(row).select('id');
    p.then(function (r) {
      if (r.error) { if (/tutor_sessions|PGRST205|42P01|schema cache/i.test((r.error.code || '') + ' ' + (r.error.message || ''))) SAVE = false; return; }
      var id = r.data && r.data[0] && r.data[0].id; if (id && !st.sid) { st.sid = id; save(); }
    }, function () { });
  }
  function past() {
    var D = db(); if (!D) return;
    D.auth.getSession().then(function (s) {
      if (!s || !s.data || !s.data.session) return;
      D.from('tutor_sessions').select('id,mode,topic,title,messages,updated_at').eq('user_id', s.data.session.user.id).order('updated_at', { ascending: false }).limit(12).then(function (r) {
        if (r.error) { SAVE = !/tutor_sessions|PGRST205|42P01|schema cache/i.test((r.error.code || '') + ' ' + (r.error.message || '')); return; }
        var rows = r.data || [], box2 = box.querySelector('#ait-past'), list = box.querySelector('#ait-plist'); if (!rows.length) return;
        list.innerHTML = rows.map(function (x, i) { var m = MODES.filter(function (y) { return y[0] === x.mode; })[0] || MODES[0];
          return '<button type="button" data-i="' + i + '"><span aria-hidden="true">' + m[1] + '</span> <b>' + E(x.title || 'Tutor chat') + '</b><span class="vx-muted"> · ' + E(m[2]) + ' · ' + new Date(x.updated_at).toLocaleDateString() + '</span></button>'; }).join('');
        [].forEach.call(list.querySelectorAll('button'), function (b) { b.onclick = function () { var x = rows[+b.getAttribute('data-i')];
          st = { mode: x.mode, topic: x.topic || '', log: x.messages || [], sid: x.id, flag: false }; tp.value = st.topic; save(); paint(); box2.open = false; inp.focus(); }; });
        box2.hidden = false;
      });
    });
  }
  function call(body) {
    var S = window.BVS;
    if (!S || !S.db) return Promise.resolve({ ok: false, error: 'The site is still loading. Try again in a moment.' });
    return S.db.auth.getSession().then(function (s) {
      if (!s || !s.data || !s.data.session) return { ok: false, signin: true, error: 'Sign in to talk to your AI Science Tutor.' };
      return S.db.functions.invoke('ai-tutor', { body: body }).then(function (r) {
        var d = r && r.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
        if (d) return d;
        var ctx = r && r.error && r.error.context;
        if (ctx && typeof ctx.json === 'function') return ctx.json().catch(function () { return null; }).then(function (x) { return x || { ok: false, error: 'The tutor did not answer. Try again.' }; });
        return { ok: false, error: 'The tutor did not answer. Try again.' };
      });
    });
  }
  box.querySelector('#ait-form').onsubmit = function (e) {
    e.preventDefault(); if (busy) return;
    var text = inp.value.trim(); if (!text) { inp.focus(); return; }
    var hist = st.log.filter(function (h) { return h.who !== 'err'; }).slice(-8).map(function (h) { return { who: h.who, text: h.text }; });
    st.log.push({ who: 'me', text: text }); if (INTEG.test(text)) st.flag = true; inp.value = ''; save(); paint();
    busy = true; log.insertAdjacentHTML('beforeend', '<div class="ait-msg tut wait"><span class="who">🤖 Tutor</span><p>Thinking…</p></div>'); log.scrollTop = log.scrollHeight;
    call({ mode: st.mode, message: text, topic: st.topic, history: hist }).then(function (d) {
      busy = false;
      if (d && d.ok) { st.log.push({ who: 'tutor', text: d.text }); if (typeof d.left === 'number') left.textContent = d.left + ' free messages left today'; persist(); }
      else st.log.push({ who: 'err', text: (d && d.error) || 'The tutor could not answer. Try again.' });
      save(); paint();
      if (d && d.signin) log.insertAdjacentHTML('beforeend', '<p class="ait-in"><a class="vx-btn" href="/login/?next=/tutor/">Sign in</a> <a class="vx-btn ghost" href="/register/">Create a free account</a></p>');
    }, function () { busy = false; st.log.push({ who: 'err', text: 'The tutor could not be reached. Check your connection and try again.' }); save(); paint(); });
  };
  /* Student Learning Centre phase 5: suggestions from your own learning records (marked answers, wrong ideas, work your teacher set).
     A chip only fills in the mode, topic and a first message; you choose whether to send it. */
  function mine() {
    var D = db(); if (!D) return;
    D.auth.getSession().then(function (s) {
      if (!s || !s.data || !s.data.session) return;
      var uid = s.data.session.user.id, since = new Date(Date.now() - 180 * 864e5).toISOString();
      Promise.all([D.from('item_results').select('topic,got,max,at,misconceptions').eq('student_id', uid).gte('at', since).order('at', { ascending: false }).limit(2000).then(function (r) { return r.data || []; }, function () { return []; }),
        D.rpc('my_todo').then(function (r) { return r.data || []; }, function () { return []; })]).then(function (x) {
        var T = {}, mis = [];
        x[0].forEach(function (r) { if (!r.topic || !(+r.max > 0) || r.got == null) return; var m = T[r.topic] || (T[r.topic] = { k: r.topic, g: 0, m: 0 }); m.g += Math.min(+r.got, +r.max); m.m += +r.max;
          (Array.isArray(r.misconceptions) ? r.misconceptions : []).forEach(function (t) { if (typeof t === 'string' && t.trim() && mis.length < 40) mis.push([r.topic, t.trim()]); }); });
        var tops = Object.keys(T).map(function (k) { var m = T[k]; m.pct = Math.round(100 * m.g / m.m); return m; }).filter(function (m) { return m.m >= 5; });
        var weak = tops.filter(function (m) { return m.pct < 70; }).sort(function (a, b) { return a.pct - b.pct; }).slice(0, 3);
        var strong = tops.filter(function (m) { return m.pct >= 80; }).sort(function (a, b) { return b.pct - a.pct; })[0];
        var seen = {}, wrong = mis.filter(function (z) { var k = z[1].toLowerCase(); if (seen[k]) return false; seen[k] = 1; return true; }).slice(0, 2);
        var now = Date.now(), work = x[1].filter(function (t) { return t.state !== 'done' && (t.kind === 'lesson' || t.kind === 'quiz') && (!t.due_at || new Date(t.due_at) > now - 864e5); })
          .sort(function (a, b) { return (a.due_at ? +new Date(a.due_at) : 9e15) - (b.due_at ? +new Date(b.due_at) : 9e15); }).slice(0, 2);
        var C = [];
        weak.forEach(function (m) { C.push(['guide', m.k, 'Help me understand ' + m.k + '. I scored ' + m.pct + '% on it in my marked work. Start with what I am most likely missing.', '🧭 ' + m.k + ' · ' + m.pct + '%', 'weak']); });
        wrong.forEach(function (z) { C.push(['mistake', z[0], 'My marked work showed this wrong idea about ' + z[0] + ': "' + z[1].slice(0, 200) + '". Help me see why it is wrong and what the right idea is.', '🩹 ' + (z[1].length > 46 ? z[1].slice(0, 44) + '…' : z[1]), 'mis']); });
        work.forEach(function (t) { C.push(['teach', String(t.title).slice(0, 120), 'I need to get ready for "' + t.title + '", which my teacher set' + (t.due_at ? ' for ' + new Date(t.due_at).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' }) : '') + '. Teach me the key ideas first. Do not do the work for me.', '📌 ' + (t.title.length > 40 ? t.title.slice(0, 38) + '…' : t.title), 'set']); });
        if (strong) C.push(['challenge', strong.k, 'Challenge me with a hard exam-style question on ' + strong.k + '.', '🏔️ Challenge: ' + strong.k, 'strong']);
        if (!C.length) return;
        var el = box.querySelector('#ait-mine'); el.hidden = false;
        el.innerHTML = '<p><b>From my learning</b> <span class="vx-muted">Suggestions from your marked work and the work your teacher set. Pick one, read the message, then send it.</span></p><div class="ait-chips">' +
          C.map(function (c, i) { return '<button type="button" class="ait-chip ' + c[4] + '" data-c="' + i + '">' + E(c[3]) + '</button>'; }).join('') + '</div>';
        [].forEach.call(el.querySelectorAll('[data-c]'), function (b) { b.onclick = function () { var c = C[+b.getAttribute('data-c')];
          if (st.log.length && (st.mode !== c[0] || st.topic !== c[1])) { st.log = []; st.sid = null; st.flag = false; }
          st.mode = c[0]; st.topic = c[1]; tp.value = c[1]; save();
          [].forEach.call(box.querySelectorAll('[data-m]'), function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-m') === st.mode)); });
          paint(); inp.value = c[2]; inp.focus(); }; });
        if (!document.getElementById('ait-mine-css')) { var cs = document.createElement('style'); cs.id = 'ait-mine-css';
          cs.textContent = '.ait-mine{background:linear-gradient(120deg,#eef2ff,#fdf2f8);border:1px solid #c7d2fe;border-radius:14px;padding:10px 12px;margin:8px 0}.ait-mine p{margin:0 0 6px}.ait-chips{display:flex;flex-wrap:wrap;gap:6px}' +
            '.ait-chip{font:inherit;font-size:.88rem;font-weight:700;border-radius:999px;padding:6px 12px;cursor:pointer;border:2px solid #c7d2fe;background:#fff;color:#3730a3;max-width:100%;overflow-wrap:anywhere;text-align:left}.ait-chip.weak{border-color:#fdba74;color:#9a3412}.ait-chip.mis{border-color:#fca5a5;color:#991b1b}.ait-chip.set{border-color:#fcd34d;color:#92400e}.ait-chip.strong{border-color:#86efac;color:#166534}.ait-chip:hover{background:#f8fafc}';
          document.head.appendChild(cs); }
      });
    });
  }
  paint(); setTimeout(past, 800); setTimeout(mine, 900);
})();
