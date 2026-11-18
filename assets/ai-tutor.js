/* AI Science Tutor · BioscienceVista · by BioscienceVista (phase 4)
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
  var q = new URLSearchParams(location.search); if (q.get('topic')) st.topic = q.get('topic').slice(0, 120); if (q.get('mode') && MODES.some(function (m) { return m[0] === q.get('mode'); })) st.mode = q.get('mode');
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
    '<div class="ait-topic"><label for="ait-topic">Topic (optional)</label><input id="ait-topic" maxlength="120" placeholder="e.g. enzymes, titration, forces, statistics"></div>' +
    '<div class="ait-log" id="ait-log" aria-live="polite"></div>' +
    '<form class="ait-form" id="ait-form"><label for="ait-in" class="sr-only">Your message</label><textarea id="ait-in" rows="2" maxlength="1500" placeholder="Ask a question, give an answer or describe what you are stuck on…"></textarea>' +
    '<div class="ait-act"><button type="submit" class="vx-btn">Send</button><button type="button" class="vx-btn ghost" id="ait-new">New chat</button><span class="vx-muted" id="ait-left" role="status"></span></div></form>' +
    '<p class="ait-note">Your tutor helps you learn; it will not write assessed work (IA, EE, reports, homework to hand in) for you. AI can make mistakes: check important facts with your notes or your teacher.</p>';
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
  box.querySelector('#ait-new').onclick = function () { st.log = []; save(); paint(); inp.focus(); };
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); box.querySelector('#ait-form').requestSubmit(); } });

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
    st.log.push({ who: 'me', text: text }); inp.value = ''; save(); paint();
    busy = true; log.insertAdjacentHTML('beforeend', '<div class="ait-msg tut wait"><span class="who">🤖 Tutor</span><p>Thinking…</p></div>'); log.scrollTop = log.scrollHeight;
    call({ mode: st.mode, message: text, topic: st.topic, history: hist }).then(function (d) {
      busy = false;
      if (d && d.ok) { st.log.push({ who: 'tutor', text: d.text }); if (typeof d.left === 'number') left.textContent = d.left + ' free messages left today'; }
      else st.log.push({ who: 'err', text: (d && d.error) || 'The tutor could not answer. Try again.' });
      save(); paint();
      if (d && d.signin) log.insertAdjacentHTML('beforeend', '<p class="ait-in"><a class="vx-btn" href="/login/?next=/tutor/">Sign in</a> <a class="vx-btn ghost" href="/register/">Create a free account</a></p>');
    }, function () { busy = false; st.log.push({ who: 'err', text: 'The tutor could not be reached. Check your connection and try again.' }); save(); paint(); });
  };
  paint();
})();
