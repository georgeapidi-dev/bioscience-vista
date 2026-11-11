/* AI Science Tutor · Learnova · by George Apidi
   Runs inside the site with the student's Learnova sign-in. Questions go to the "science-tutor" server function;
   the AI key stays on the server. The chat is kept only in this browser tab. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), ME = null;
  var COURSES = ['IB MYP', 'IB Diploma Biology SL', 'IB Diploma Biology HL', 'IB Diploma Chemistry SL', 'IB Diploma Chemistry HL', 'IB Environmental Systems and Societies',
    'Cambridge IGCSE Biology', 'Cambridge IGCSE Chemistry', 'Cambridge A-Level Biology', 'Cambridge A-Level Chemistry', 'General Science'];
  var STARTERS = [['💡', 'Explain it simply', 'Explain this to me simply, step by step, with an everyday example: '],
    ['📝', 'Practice questions', 'Give me 3 practice questions on my topic, from easy to hard. Let me try them first; give the answers only when I ask.'],
    ['✅', 'Check my answer', 'Here is my answer. Tell me what is right, what is missing and how to improve it:\n\nQuestion: \n\nMy answer: '],
    ['🧭', 'Help me revise', 'Make me a short revision summary of my topic: the key terms, the key ideas and one common mistake to avoid.'],
    ['🖼', 'Explain a diagram', 'Explain what this diagram shows and the science behind it.']];
  var KEY = 'bv-tutor-chat', history = [], pic = null, busy = false;
  try { history = JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (e) { history = []; }
  function keep() { try { sessionStorage.setItem(KEY, JSON.stringify(history.slice(-20))); } catch (e) {} }
  function pref(k, v) { try { if (v === undefined) return localStorage.getItem('bv-tutor-' + k); localStorage.setItem('bv-tutor-' + k, v); } catch (e) { return null; } }

  function guessCourse(me) {   // from the student's class, e.g. "MYP 4" → IB MYP, "IB DP year 1" → IB Diploma Biology HL
    var p = ((me.cls && (me.cls.programme + ' ' + me.cls.name)) || '').toLowerCase();
    if (/myp|grade [6-9]|grade 10/.test(p)) return 'IB MYP';
    if (/ib dp|dp[12]|diploma/.test(p)) return /chem/.test(p) ? 'IB Diploma Chemistry HL' : /ess|environment/.test(p) ? 'IB Environmental Systems and Societies' : 'IB Diploma Biology HL';
    if (/igcse/.test(p)) return /chem/.test(p) ? 'Cambridge IGCSE Chemistry' : 'Cambridge IGCSE Biology';
    if (/a.?level|as level|grade 1[12]/.test(p)) return /chem/.test(p) ? 'Cambridge A-Level Chemistry' : 'Cambridge A-Level Biology';
    return 'General Science';
  }
  // Safe formatting of the tutor's answers: text is escaped first, then simple markdown is applied.
  function fmt(t) {
    var lines = E(String(t || '')).split('\n'), out = [], list = null;
    function close() { if (list) { out.push('</' + list + '>'); list = null; } }
    lines.forEach(function (l) {
      var m;
      if ((m = /^\s*#{1,4}\s+(.*)$/.exec(l))) { close(); out.push('<p class="th">' + inl(m[1]) + '</p>'); }
      else if ((m = /^\s*[-*•]\s+(.*)$/.exec(l))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push('<li>' + inl(m[1]) + '</li>'); }
      else if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(l))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; } out.push('<li>' + inl(m[1]) + '</li>'); }
      else if (!l.trim()) { close(); out.push('<div class="gap"></div>'); }
      else { close(); out.push('<p>' + inl(l) + '</p>'); }
    });
    close(); return out.join('');
  }
  function inl(s) {
    return s.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>')
      .replace(/\^([^^\s]{1,8})\^/g, '<sup>$1</sup>').replace(/~([^~\s]{1,8})~/g, '<sub>$1</sub>');
  }
  function bubble(m, i) {
    if (m.role === 'user') return '<div class="tmsg me"><div class="tb">' + E(m.content).replace(/\n/g, '<br>') + (m.pic ? '<div class="small muted">🖼 diagram attached</div>' : '') + '</div></div>';
    return '<div class="tmsg ai"><span class="tav" aria-hidden="true">🤖</span><div class="tb">' + fmt(m.content) +
      '<div class="tacts"><button type="button" class="btn sm" data-copy="' + i + '">Copy</button><button type="button" class="btn sm" data-say="' + i + '">🔊 Listen</button></div></div></div>';
  }
  function draw() {
    var box = app.querySelector('#tchat');
    box.innerHTML = history.length ? history.map(bubble).join('') :
      '<div class="tempty"><span style="font-size:2.4rem" aria-hidden="true">🔬</span><h3>Ask me anything about science</h3><p class="muted">I explain step by step, set practice questions, check your answers and explain diagrams. I will ask you questions too, so you learn it yourself.</p></div>';
    if (busy) box.insertAdjacentHTML('beforeend', '<div class="tmsg ai"><span class="tav" aria-hidden="true">🤖</span><div class="tb"><span class="tdots"><i></i><i></i><i></i></span> Thinking…</div></div>');
    box.scrollTop = box.scrollHeight;
    box.querySelectorAll('[data-copy]').forEach(function (b) { b.onclick = function () { var t = history[+b.getAttribute('data-copy')].content; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { b.textContent = 'Copied ✓'; }, function () { b.textContent = 'Copy failed'; }); }; });
    box.querySelectorAll('[data-say]').forEach(function (b) { b.onclick = function () {
      if (!window.speechSynthesis) return; if (speechSynthesis.speaking) { speechSynthesis.cancel(); b.textContent = '🔊 Listen'; return; }
      var u = new SpeechSynthesisUtterance(history[+b.getAttribute('data-say')].content.replace(/[#*`^~]/g, '')); u.lang = 'en-GB'; u.onend = function () { b.textContent = '🔊 Listen'; };
      speechSynthesis.speak(u); b.textContent = '⏹ Stop'; }; });
  }
  function setPic(file) {
    var st = app.querySelector('#tst');
    if (!file) { pic = null; app.querySelector('#tpic').hidden = true; return; }
    if (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].indexOf(file.type) < 0 || file.size > 3 * 1024 * 1024) { st.textContent = 'Choose a JPEG, PNG, GIF or WebP picture under 3 MB.'; return; }
    var r = new FileReader();
    r.onload = function () { var d = String(r.result); pic = { mediaType: file.type, data: d.split(',')[1] }; app.querySelector('#tpicimg').src = d; app.querySelector('#tpic').hidden = false; st.textContent = ''; };
    r.readAsDataURL(file);
  }
  function errorText(err) {
    return Promise.resolve(err && err.context && err.context.json ? err.context.json().catch(function () { return null; }) : null).then(function (j) {
      return (j && j.error) || (err && err.message && !/non-2xx/i.test(err.message) ? err.message : 'The tutor could not answer just now. Please try again in a moment.');
    });
  }
  function send(text) {
    var st = app.querySelector('#tst'), q = (text || '').trim();
    if (!q || busy) return;
    if (q.length > 8000) { st.textContent = 'Please keep your question under 8000 characters.'; return; }
    var msgs = history.map(function (m) { return { role: m.role, content: m.content }; }).concat([{ role: 'user', content: q }]).slice(-20);
    while (msgs.length && msgs[0].role !== 'user') msgs.shift();
    var body = { curriculum: app.querySelector('#tcourse').value, topic: app.querySelector('#ttopic').value.trim().slice(0, 120), messages: msgs }, hadPic = !!pic;
    if (pic) body.image = pic;
    history.push({ role: 'user', content: q, pic: hadPic }); busy = true; st.textContent = ''; app.querySelector('#tq').value = ''; setPic(null); draw();
    app.querySelector('#tsend').disabled = true;
    S.db.functions.invoke('science-tutor', { body: body }).then(function (r) {
      if (r && typeof r.data === 'string') { try { r.data = JSON.parse(r.data); } catch (e) {} }   // the function's reply may arrive as plain text
      if (r.error || !r.data || !r.data.answer) return errorText(r.error).then(function (m) { throw new Error(m); });
      history.push({ role: 'assistant', content: r.data.answer }); keep();
    }).catch(function (e) {
      history.pop(); app.querySelector('#tq').value = q; st.textContent = (e && e.message) || 'The tutor could not answer just now.';
    }).then(function () { busy = false; app.querySelector('#tsend').disabled = false; draw(); app.querySelector('#tq').focus(); });
  }

  S.guard(app).then(function (me) {
    ME = me;
    var course = pref('course') || guessCourse(me), topic = pref('topic') || '';
    app.innerHTML = '<div class="tutor">' +
      '<aside class="panel tside"><label class="f">Course<select id="tcourse">' + COURSES.map(function (c) { return '<option' + (c === course ? ' selected' : '') + '>' + E(c) + '</option>'; }).join('') + '</select></label>' +
      '<label class="f">Topic (optional)<input id="ttopic" maxlength="120" value="' + E(topic) + '" placeholder="e.g. cell respiration"></label>' +
      '<div class="tstart"><p class="label">Try</p>' + STARTERS.map(function (s, i) { return '<button type="button" class="btn sm" data-st="' + i + '"><span aria-hidden="true">' + s[0] + '</span> ' + E(s[1]) + '</button>'; }).join('') + '</div>' +
      '<button type="button" class="btn sm" id="tnew">↺ New chat</button>' +
      '<p class="small muted">The tutor is an AI. It can make mistakes: check important facts with your notes or your teacher. Do not share personal information. Your chat is not saved after you close this tab.</p></aside>' +
      '<section class="panel tmain"><div id="tchat" class="tchat" aria-live="polite"></div>' +
      '<form id="tform" class="tform"><div id="tpic" class="tpic" hidden><img id="tpicimg" alt="Attached diagram"><button type="button" class="btn sm" id="tunpic">Remove</button></div>' +
      '<label class="sr-only" for="tq">Your question</label><textarea id="tq" rows="3" maxlength="8000" placeholder="Ask a science question, paste a question you are stuck on, or attach a diagram…"></textarea>' +
      '<div class="row2"><label class="btn sm" style="cursor:pointer">📎 Attach a diagram<input type="file" id="tfile" accept="image/jpeg,image/png,image/gif,image/webp" hidden></label>' +
      '<span class="small muted">Enter to send · Shift+Enter for a new line</span><button class="btn main" id="tsend" type="submit">Ask the tutor ➜</button></div><p class="msg" id="tst" role="status"></p></form></section></div>';
    draw();
    var tq = app.querySelector('#tq');
    app.querySelector('#tform').onsubmit = function (e) { e.preventDefault(); send(tq.value); };
    tq.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(tq.value); } });
    tq.addEventListener('paste', function (e) { var it = [].filter.call((e.clipboardData || {}).items || [], function (x) { return /^image\//.test(x.type); })[0]; if (it) { e.preventDefault(); setPic(it.getAsFile()); } });
    app.querySelector('#tfile').onchange = function () { setPic(this.files[0]); this.value = ''; };
    app.querySelector('#tunpic').onclick = function () { setPic(null); };
    app.querySelector('#tcourse').onchange = function () { pref('course', this.value); };
    app.querySelector('#ttopic').onchange = function () { pref('topic', this.value.trim()); };
    app.querySelector('#tnew').onclick = function () { history = []; keep(); app.querySelector('#tst').textContent = ''; draw(); tq.focus(); };
    app.querySelectorAll('[data-st]').forEach(function (b) { b.onclick = function () { var s = STARTERS[+b.getAttribute('data-st')][2], t = app.querySelector('#ttopic').value.trim();
      if (+b.getAttribute('data-st') === 4) { app.querySelector('#tfile').click(); tq.value = s; return; }
      tq.value = s + (/: $/.test(s) && t ? t : ''); tq.focus(); tq.setSelectionRange(tq.value.length, tq.value.length); }; });
    var ask = new URLSearchParams(location.search).get('q'); if (ask) { tq.value = ask.slice(0, 2000); window.history.replaceState(null, '', location.pathname); }
  }).catch(function () {});
})();
