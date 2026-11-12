/* Learnova · lesson feedback: the same five-part feedback on every interactive lesson, worksheet and simulation question.
   Instant and rule-based: what you did well, what is missing, why (misconceptions), how to improve, and what to study next.
   Signed-in students also get detailed feedback on their written answers from the server function "lesson-feedback". */
(function () {
  if (typeof window.SPEC !== 'object' || typeof window.show !== 'function' || typeof window.mark !== 'function') return;
  var SP = window.SPEC, esc = window.esc || function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var norm = window.norm, hit = window.hit, val = window.val;

  // Common science misconceptions: shown only when the student's own words contain them.
  var MISC = [
    [/\b(because|so) (it|they|the \w+) (need|needed|wanted|want)(s|ed)? to\b|\bin order to survive\b.*\b(develop|grew|evolv)/, 'Organisms do not change because they need to. Variation already exists (from mutation); individuals that happen to be better suited survive and pass on their alleles.'],
    [/\b(stretch|stretched|stretching|used|exercis)\w*\b.*\b(pass|inherit|offspring|babies|children)/, 'Changes gained during a lifetime (stretching, exercise, injury) do not change DNA, so they are not inherited.'],
    [/\b(individual|animal|it) (evolve|evolves|evolved|adapts? to)\b/, 'Individuals do not evolve. Populations evolve over many generations.'],
    [/\b(energy|heat) (is|was|are|gets|got) (made|created|produced|destroyed|used up|lost forever)\b|\bcreates? energy\b|\bmakes? energy\b/, 'Energy is never created or destroyed. It is transferred or converted (for example, respiration releases energy stored in glucose).'],
    [/\brespiration (is|means) breathing\b|\bbreathing is respiration\b/, 'Respiration is a chemical reaction in every living cell that releases energy from glucose. Breathing only moves air in and out of the lungs.'],
    [/\bplants? (get|gets|take|takes) (their )?food from the soil\b|\bplants? eat\b/, 'Plants make their own food (glucose) by photosynthesis. From the soil they take water and mineral ions, not food.'],
    [/\bplants? (do not|don t|dont|never) respire\b|\bplants? only photosynthes/, 'Plants respire all the time, day and night, like every living cell. In daylight photosynthesis is usually faster than respiration.'],
    [/\benzymes? (is|are|get|gets|was|were) killed\b|\bkills? the enzyme/, 'Enzymes are proteins, not living things, so they cannot be killed. High temperature or the wrong pH denatures them: the active site changes shape.'],
    [/\bparticles? (expand|expands|get bigger|grow|melt|melts)\b/, 'Particles themselves do not expand or melt. When heated, particles move faster and spread further apart.'],
    [/\bheavier objects? fall faster\b/, 'Without air resistance, all objects fall with the same acceleration whatever their mass.'],
    [/\bcold (enters|gets in|flows)\b/, 'Cold does not flow. Thermal energy moves from the hotter object to the colder one.'],
    [/\bantibiotics? (kill|kills|treat|cure|work on|works on) (a |the )?(virus|viruses|cold|flu)\b/, 'Antibiotics only work against bacteria. They have no effect on viruses such as colds and flu.'],
    [/\bbacteria (become|becomes|get|gets) (immune|resistant)\b/, 'Bacteria are not immune; a population becomes resistant. Resistant bacteria that already existed survive the antibiotic and reproduce.'],
    [/\bblood is blue\b|\bblue blood\b/, 'Blood is always red. Deoxygenated blood is darker red; veins only look blue through the skin.'],
    [/\b(arteries|artery) carr(y|ies) (only )?oxygenated blood\b.*\balways\b|\bveins? always carr(y|ies) deoxygenated\b/, 'Arteries carry blood away from the heart and veins carry it to the heart. The pulmonary artery carries deoxygenated blood.'],
    [/\bdiffusion\b.*\b(needs?|uses?|requires?) energy\b/, 'Diffusion is passive: it needs no energy from respiration. Active transport is the process that uses energy.'],
    [/\bosmosis\b.*\b(salt|sugar|solute|glucose) (moves|move|diffus)/, 'In osmosis it is water that moves across a partially permeable membrane, not the solute.'],
    [/\bmitochondria (make|makes|produce|produces|create|creates) energy\b/, 'Mitochondria release energy from glucose by aerobic respiration; they do not make energy.'],
    [/\bgenes? (is|are) (made of )?(protein|proteins)\b/, 'Genes are sections of DNA. A gene codes for a protein; it is not made of protein.'],
    [/\bdominant (means|is|alleles? (is|are)) (more common|better|stronger)\b/, 'Dominant does not mean more common or better. It means the allele is expressed when only one copy is present.']
  ];
  function misconceptions(text) {
    var t = ' ' + String(text || '').toLowerCase().replace(/[’']/g, ' ').replace(/\s+/g, ' ') + ' ', out = [];
    MISC.forEach(function (m) { if (m[0].test(t) && out.indexOf(m[1]) < 0) out.push(m[1]); });
    return out;
  }
  function stepName(n) { var h = document.querySelector('#step' + n + ' .stephead h2'); return h ? h.textContent.trim() : 'Step ' + n; }
  function question(id) {
    var el = document.querySelector('[data-save="' + id + '"]') || document.querySelector('[data-save^="' + id + '_"]');
    var q = el && el.closest('.q'), l = q && q.querySelector('.ql');
    return l ? l.textContent.replace(/\s+/g, ' ').trim() : '';
  }
  function model(n, label) { var md = (SP.models || {})[n] || []; for (var i = 0; i < md.length; i++) if (md[i][0] === label) return md[i][1]; return ''; }
  function nice(alt) { return alt.split('+').map(function (p) { return p.trim(); }).join(' + '); }

  // Per-question detail: which mark points were found, which are missing, and misconceptions in the student's words.
  function detail(n) {
    var items = SP.marks[n] || [], out = [];
    items.forEach(function (it) {
      var d = { id: it.id, q: it.q, kind: it.kind, max: it.max, good: [], miss: [], why: [], need: [], got: 0 };
      if (it.kind === 'text') {
        var raw = val(it.id), t = norm(raw); d.text = raw;
        it.pts.forEach(function (alts, i) {
          var a = alts.filter(function (x) { return hit(t, x); })[0];
          if (a) d.good.push('You included the idea of “' + nice(a) + '”.');
          else { d.need.push(alts.slice(0, 2).map(nice).join(' / ')); d.miss.push(it.tips && it.tips[i] ? it.tips[i] : 'A mark point is missing: think about ' + alts.slice(0, 2).map(nice).join(' / ') + '.'); }
        });
        d.got = Math.min(d.good.length, it.max);
        if (d.got >= it.max) { d.miss = []; d.need = []; }
        d.miss = d.miss.filter(function (x, i, a) { return a.indexOf(x) === i; });
        d.why = misconceptions(raw);
        if (raw.trim().split(/\s+/).length < 6 && d.got < it.max) d.miss.push('Your answer is very short. Write in full sentences and use the command word (describe, explain, suggest).');
      } else if (it.kind === 'mcq') {
        var v = val(it.id); d.got = v === it.ans ? 1 : 0;
        if (d.got) d.good.push('Correct choice.'); else d.miss.push('You chose “' + (v || 'nothing') + '”. Read why the correct answer fits better in the model answer.');
      } else if (it.kind === 'choice') {
        var right = 0, wrong = [];
        for (var c = 0; c < it.n; c++) { var cv = val(it.id + '_' + c); if (cv === it.ans[c]) right++; else wrong.push(c + 1); }
        d.got = right === it.n ? it.max : Math.min(it.max - 1, Math.floor(right * it.max / it.n));
        if (right) d.good.push(right + ' of ' + it.n + ' correct.');
        if (wrong.length) d.miss.push((it.n > 1 ? 'Check item' + (wrong.length > 1 ? 's ' : ' ') + wrong.join(', ') + '. ' : '') + (it.tip || ''));
      } else if (it.kind === 'rows') {
        d.got = 0; (it.rows || []).forEach(function (row, ri) {
          var ok = true; (row.sel || []).forEach(function (ans, si) { if (val(it.id + '_r' + ri + '_s' + si) !== ans) ok = false; });
          if (row.pts && row.pts.length) { var tt = norm(val(it.id + '_r' + ri + '_t')); row.pts.forEach(function (alts) { if (!alts.some(function (a) { return hit(tt, a); })) ok = false; }); }
          if (ok) d.got++; else d.miss.push('Check “' + row.label + '”. ' + (it.tip || ''));
        });
        d.max = (it.rows || []).length; if (d.got) d.good.push(d.got + ' of ' + d.max + ' rows correct.');
      } else if (it.kind === 'sort') {
        d.q = 'Table'; d.max = it.rows; var wr = [];
        for (var r = 0; r < it.rows; r++) { var all = true; for (var cc = 0; cc < it.cols; cc++) if (it.ans[r][cc].indexOf(val('sort' + r + '_' + cc)) < 0) all = false; if (all) d.got++; else wr.push(r + 1); }
        if (d.got) d.good.push(d.got + ' of ' + it.rows + ' rows correct.');
        if (wr.length) d.miss.push('Check row' + (wr.length > 1 ? 's ' : ' ') + wr.join(', ') + ' against the notes.');
      }
      out.push(d);
    });
    return out;
  }
  function improveLine(n, d) {
    if (d.got >= d.max && !d.why.length) return '';
    if (d.kind === 'text') {
      var md = model(n, d.q);
      if (!d.need.length) return d.why.length ? 'Rewrite ' + d.q + ' in your book without the mistaken idea above.' : '';
      return 'Rewrite ' + d.q + ' in your book and add the missing idea' + (d.need.length > 1 ? 's' : '') + ': ' + d.need.join('; ') + '. Link each idea to the next with “so” or “because”.' + (md ? ' Tick off the [1] mark points in the model answer as you go.' : '');
    }
    return 'Correct ' + d.q + ' in your book and write one sentence saying why the right answer is right.';
  }

  var CSS = '.lfb{margin-top:10px;display:grid;gap:8px}.lfb .lq{border:1px solid #e2e8f0;border-left:4px solid #94a3b8;border-radius:10px;padding:8px 12px;background:#fff}' +
    '.lfb .lq.full{border-left-color:#16a34a}.lfb .lq.part{border-left-color:#f59e0b}.lfb .lq.zero{border-left-color:#dc2626}' +
    '.lfb .lh{font-weight:700;display:flex;justify-content:space-between;gap:8px}.lfb ul{margin:4px 0 0;padding-left:0;list-style:none}.lfb li{margin:3px 0;padding-left:1.6em;text-indent:-1.6em}' +
    '.lfb .src{font-size:.78em;font-weight:600;border-radius:99px;padding:1px 8px;background:#f1f5f9;color:#475569;white-space:nowrap}.lfb .src.ai{background:#f5f3ff;color:#6d28d9}' +
    '.lfai{margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.lfai button{font:inherit;border:1px solid #c4b5fd;background:#f5f3ff;color:#5b21b6;border-radius:8px;padding:6px 12px;cursor:pointer}' +
    '.lfb li.lhead{font-weight:600;padding-left:0;text-indent:0;margin-bottom:4px}.lfai button[disabled]{opacity:.6;cursor:wait}.lfb .aibox{border:1px dashed #c4b5fd;background:#faf5ff}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  // What the score on one question means, in words.
  function headline(d) {
    var p = d.max ? d.got / d.max : 0, left = d.max - d.got;
    if (p >= 1) return d.kind === 'text' ? 'Full marks: every mark point is there.' : 'Full marks.';
    if (d.kind === 'text') {
      if (p >= 0.5) return 'Nearly there: ' + d.got + ' of ' + d.max + ' mark points. ' + left + ' more to add.';
      if (p > 0) return 'A start: ' + d.got + ' of ' + d.max + ' mark points. Build the answer up step by step.';
      return 'Not yet: none of the ' + d.max + ' mark points are there. Start again from the notes.';
    }
    if (p >= 0.5) return 'Mostly right: ' + d.got + ' of ' + d.max + '. Fix the ones marked below.';
    if (p > 0) return d.got + ' of ' + d.max + ' right. Go back to the notes before you correct it.';
    return 'Not right yet. Read the model answer and why it is correct.';
  }
  function li(icon, text) { return '<li>' + icon + ' ' + esc(text) + '</li>'; }
  function block(n, d, ai, src) {
    var cls = d.got >= d.max ? 'full' : d.got > 0 ? 'part' : 'zero', h = '';
    var good = ai ? (ai.understood || []) : d.good, miss = ai ? (ai.missing || []) : d.miss, why = ai ? (ai.why || []) : d.why;
    good.forEach(function (x) { h += li('✓', x); });
    miss.forEach(function (x) { h += li('✗', x); });
    why.forEach(function (x) { h += li('💡', x); });
    var imp = ai ? ai.improve : improveLine(n, d); if (imp) h += li('↗', imp);
    if (ai && ai.next) h += li('📚', ai.next);
    if (!h) h = li('✓', 'Well done.');
    if (!ai) h = '<li class="lhead">' + esc(headline(d)) + '</li>' + h;
    var mk = ai ? (ai.mark != null ? ai.mark + '/' + d.max + ' suggested' : '') : d.got + '/' + d.max;
    return '<div class="lq ' + (ai ? 'aibox ' : '') + cls + '"><div class="lh"><span>' + esc(d.q) + (mk ? ' · ' + esc(mk) : '') + '</span><span class="src' + (ai && src !== 'rule' ? ' ai' : '') + '">' + (!ai ? '⚙ Instant check' : src === 'teacher' ? '👩‍🏫 Teacher' : src === 'rule' ? '⚙ Re-marked' : '📝 Detailed feedback') + '</span></div><ul>' + h + '</ul></div>';
  }
  function render(n, m) {
    var box = document.getElementById('fb' + n); if (!box || !m) return;
    var old = box.querySelector('.lfb-wrap'); if (old) old.remove();
    var ds = detail(n); if (!ds.length) return;
    var weakest = ds.filter(function (d) { return d.got < d.max; });
    var wrap = document.createElement('div'); wrap.className = 'lfb-wrap';
    wrap.innerHTML = '<div class="lfb">' + ds.map(function (d) { return block(n, d); }).join('') + '</div>' +
      (weakest.length ? '<div class="small" style="margin-top:6px">📚 <b>Study next:</b> re-read the notes in “' + esc(stepName(n)) + '”, then check ' + esc(weakest.map(function (d) { return d.q; }).join(', ')) + ' against the model answers below.</div>' : '');
    var texts = ds.filter(function (d) { return d.kind === 'text' && d.text && d.text.trim(); });
    if (texts.length) {
      var ai = document.createElement('div'); ai.className = 'lfai';
      ai.innerHTML = '<button type="button">📝 Get detailed feedback on my written answers</button><span class="small muted"></span>';
      wrap.appendChild(ai);
      var btn = ai.querySelector('button'), note = ai.querySelector('span');
      if (!window.BV_DB) { btn.disabled = true; btn.style.cursor = 'default'; note.textContent = 'Log in to Learnova to get detailed feedback.'; }
      btn.onclick = function () { askAI(n, texts, wrap, btn, note); };
    }
    var models = box.querySelector('details.model'); box.insertBefore(wrap, models || null);
    loadSaved(n, ds, wrap);
  }
  function aiBlocks(n, ds, items, wrap, when, src) {
    var old = wrap.querySelector('.lfb-ai'); if (old) old.remove();
    var div = document.createElement('div'); div.className = 'lfb lfb-ai';
    div.innerHTML = '<div class="small"><b>' + (src === 'rule' ? '⚙ Re-marked by your teacher' : src === 'teacher' ? '👩‍🏫 Teacher feedback' : '📝 Detailed feedback') + '</b>' + (when ? ' · ' + esc(new Date(when).toLocaleString()) : '') + ' · to help you improve; your teacher’s mark is the one that counts.</div>' +
      items.map(function (a) { var d = ds.filter(function (x) { return x.q === a.q; })[0]; return d ? block(n, d, a, src) : ''; }).join('');
    wrap.insertBefore(div, wrap.querySelector('.lfai'));
  }
  function loadSaved(n, ds, wrap) {
    var db = window.BV_DB, u = window.BV_STUDENT; if (!db || !u) return;
    db.from('lesson_feedback').select('items,at,source').eq('student_id', u.id).eq('lesson', SP.id).eq('step', n).order('at', { ascending: false }).limit(1).then(function (r) {
      var row = r.data && r.data[0]; if (row && row.items && row.items.length) aiBlocks(n, ds, row.items, wrap, row.at, row.source);
    }, function () {});
  }
  function askAI(n, texts, wrap, btn, note) {
    var answers = {}; texts.forEach(function (d) { answers[d.q] = d.text; });
    btn.disabled = true; note.textContent = 'Reading your answers… (about 10 seconds)';
    window.BV_DB.functions.invoke('lesson-feedback', { body: { lesson: SP.id, step: n, answers: answers } }).then(function (r) {
      var data = r.data; if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { data = null; } }
      btn.disabled = false;
      if (r.error || !data || !data.ok) {
        var msg = (data && data.error && !/\bAI\b/.test(data.error) && data.error) || 'Detailed feedback is not available right now. Use the instant feedback and the model answers.';
        if (r.error && r.error.context && r.error.context.json) { r.error.context.json().then(function (j) { note.textContent = (j && j.error && !/\bAI\b/.test(j.error)) ? j.error : msg; }, function () { note.textContent = msg; }); } else note.textContent = msg;
        return;
      }
      if (data.source !== 'ai') { note.textContent = 'Detailed feedback is not available right now.' + ' Use the instant feedback above.'; return; }
      note.textContent = 'Done. Improve your answers in your book using these points.';
      aiBlocks(n, detail(n), data.items || [], wrap, new Date().toISOString(), 'ai');
    }, function () { btn.disabled = false; note.textContent = 'Detailed feedback is not available right now. Use the instant feedback and the model answers.'; });
  }

  // Whole-lesson feedback: built from every marked step so far, updated after each save.
  var BANDS = [[0.85, 'Excellent', '#15803d', 'You have a secure understanding of this lesson. Try the Challenge step and help a classmate.'],
    [0.65, 'Secure', '#2563eb', 'Good understanding. Fix the questions listed below to reach the top band.'],
    [0.4, 'Developing', '#b45309', 'You have some of the key ideas. Redo the questions listed below in your book, using the notes and model answers.'],
    [0, 'Beginning', '#b91c1c', 'This lesson needs another look. Work through the notes and model answers for each step, then ask your teacher for help.']];
  function summary() {
    var mk = window.marks || {}, steps = Object.keys(mk).map(Number).sort(function (a, b) { return a - b; });
    var host = document.getElementById('lesson-summary');
    if (!steps.length) { if (host) host.remove(); return; }
    if (!host) { host = document.createElement('section'); host.id = 'lesson-summary'; host.className = 'card';
      host.style.cssText = 'margin:14px 0;padding:14px 16px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc';
      var tb = document.getElementById('totalbar'); if (tb && tb.parentNode) tb.parentNode.insertBefore(host, tb.nextSibling); else document.body.appendChild(host); }
    var got = 0, max = 0, full = [], redo = [], weakStep = [], textQ = 0, textGot = 0, textMax = 0, objGot = 0, objMax = 0, misc = [];
    steps.forEach(function (n) {
      got += mk[n].score; max += mk[n].max;
      if (mk[n].max && mk[n].score / mk[n].max < 0.6) weakStep.push(n);
      detail(n).forEach(function (d) {
        if (d.got >= d.max) full.push(d.q); else redo.push({ q: d.q, got: d.got, max: d.max, n: n });
        if (d.kind === 'text') { textQ++; textGot += d.got; textMax += d.max; } else { objGot += d.got; objMax += d.max; }
        d.why.forEach(function (w) { if (misc.indexOf(w) < 0) misc.push(w); });
      });
    });
    var p = max ? got / max : 0, b = BANDS.filter(function (x) { return p >= x[0]; })[0], all = Object.keys(SP.marks || {}).length;
    var skill = '';
    if (textMax && objMax) {
      var tp = textGot / textMax, op = objGot / objMax;
      if (op - tp >= 0.25) skill = 'You do better on choice questions (' + Math.round(op * 100) + '%) than on written answers (' + Math.round(tp * 100) + '%). Practise explaining: name the idea, then say what it causes, using “so” or “because”.';
      else if (tp - op >= 0.25) skill = 'Your written explanations (' + Math.round(tp * 100) + '%) are stronger than your choice answers (' + Math.round(op * 100) + '%). Read every option carefully before you choose.';
    }
    redo.sort(function (a, b) { return a.got / a.max - b.got / b.max; });
    var h = '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline"><h3 style="margin:0">📊 Your lesson feedback</h3>' +
      '<span style="font-weight:700;color:' + b[2] + '">' + b[1] + ' · ' + got + ' / ' + max + ' (' + Math.round(p * 100) + '%)</span></div>' +
      '<div class="small muted">' + steps.length + ' of ' + all + ' marked steps done · updates each time you save a step</div>' +
      '<div style="height:8px;background:#e2e8f0;border-radius:99px;margin:8px 0;overflow:hidden"><i style="display:block;height:100%;width:' + Math.round(p * 100) + '%;background:' + b[2] + '"></i></div>' +
      '<p style="margin:6px 0">' + esc(b[3]) + '</p><ul style="margin:0;padding-left:0;list-style:none">' +
      (full.length ? li('✓', 'Full marks on ' + full.join(', ') + '.') : '') +
      (redo.length ? li('✗', 'Improve: ' + redo.slice(0, 6).map(function (r) { return r.q + ' (' + r.got + '/' + r.max + ')'; }).join(', ') + '.') : '') +
      misc.slice(0, 2).map(function (w) { return li('💡', w); }).join('') +
      (skill ? li('↗', skill) : '') +
      (weakStep.length ? li('📚', 'Study next: ' + weakStep.map(function (n) { return '“' + stepName(n) + '”'; }).join(', ') + '. Re-read the notes, then redo those questions in your book.') :
        redo.length ? li('📚', 'Study next: correct ' + redo[0].q + ' using the model answer in “' + stepName(redo[0].n) + '”.') : li('📚', 'Study next: move on to the next lesson.')) +
      (steps.length < all ? li('→', 'Keep going: ' + (all - steps.length) + ' marked step' + (all - steps.length > 1 ? 's' : '') + ' still to do.') : '') + '</ul>';
    host.innerHTML = h;
  }

  // AI feedback starts by itself the first time a step with written answers is marked (signed-in students only).
  function autoAI(n) {
    var key = 'lfb-auto:' + SP.id + ':' + n, done = false;
    try { done = localStorage.getItem(key) === '1'; } catch (e) {}
    if (done || !window.BV_DB || !window.BV_STUDENT) return;
    var box = document.getElementById('fb' + n), btn = box && box.querySelector('.lfai button');
    if (!btn || btn.disabled) return;
    var ds = detail(n).filter(function (d) { return d.kind === 'text' && d.text && d.text.trim(); });
    if (!ds.length) return;
    try { localStorage.setItem(key, '1'); } catch (e) {}
    btn.click();
  }

  // Concept notes before the questions of steps that start straight with questions (written by "lesson-notes", stored in lesson_notes)
  function conceptNotes() {
    if (!window.SB_URL || !window.SB_KEY || !window.fetch) return;
    fetch(window.SB_URL + '/rest/v1/lesson_notes?select=step,notes&lesson=eq.' + encodeURIComponent(SP.id), { headers: { apikey: window.SB_KEY, Authorization: 'Bearer ' + window.SB_KEY } })
      .then(function (r) { return r.ok ? r.json() : []; }).then(function (rows) {
        (rows || []).forEach(function (r) {
          var sec = document.getElementById('step' + r.step), n = r.notes || {}; if (!sec || sec.querySelector('.bv-cnotes')) return;
          var q = sec.querySelector('.card.task, .q'); if (!q) return;
          var before = true; sec.querySelectorAll('.notes').forEach(function (x) { if (x.compareDocumentPosition(q) & Node.DOCUMENT_POSITION_FOLLOWING) before = false; });
          if (!before) return;   // this step already has notes before its questions
          var box = document.createElement('div'); box.className = 'card notes bv-cnotes';
          box.innerHTML = '<h3>📘 ' + esc(n.title || 'Key ideas') + '</h3>' + (n.intro ? '<p>' + esc(n.intro) + '</p>' : '') +
            ((n.points || []).length ? '<ul>' + n.points.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
            ((n.terms || []).length ? '<p><b>Key words</b></p><ul>' + n.terms.map(function (t) { return '<li><b>' + esc(t.term) + '</b>: ' + esc(t.meaning) + '</li>'; }).join('') + '</ul>' : '') +
            (n.example ? '<p><b>Example:</b> ' + esc(n.example) + '</p>' : '') +
            (n.image && n.image.src ? '<figure style="margin:10px 0 0;text-align:center"><img src="' + esc(n.image.src) + '" alt="' + esc(n.image.caption || n.image.title || '') + '" loading="lazy" style="max-width:100%;max-height:360px;border-radius:8px;background:#fff">' +
              '<figcaption class="small">' + esc(n.image.caption || '') + '<br><span style="opacity:.75">Image: <a href="' + esc(n.image.page || '#') + '" target="_blank" rel="noopener">' + esc(n.image.title || 'source') + '</a>' + (n.image.artist ? ' · ' + esc(n.image.artist) : '') + ', ' + esc(n.image.license || '') + ', via Wikimedia Commons</span></figcaption></figure>' :
             n.drawn && n.drawn.svg ? '<figure style="margin:10px 0 0;text-align:center"><img src="data:image/svg+xml;charset=utf-8,' + encodeURIComponent(n.drawn.svg) + '" alt="' + esc(n.drawn.caption || 'Diagram') + '" style="width:100%;max-width:640px;border-radius:8px;background:#fff;border:1px solid #e2e8f0">' +
              '<figcaption class="small">' + esc(n.drawn.caption || '') + '<br><span style="opacity:.75">Diagram drawn for Learnova</span></figcaption></figure>' : '');
          var card = q.closest('.card') || q; card.parentNode.insertBefore(box, card);
        });
      }, function () {});
  }
  conceptNotes();

  var orig = window.show;
  var ready = false;
  window.show = function (n, m) {
    orig(n, m);
    try { render(n, m); summary(); if (ready && m) autoAI(n); } catch (e) { if (window.console) console.warn('lesson feedback', e); }
  };
  function redraw() { var mk = window.marks || {}; Object.keys(mk).forEach(function (n) { try { render(Number(n), mk[n]); } catch (e) {} }); try { summary(); } catch (e) {} }
  redraw(); ready = true;
  document.addEventListener('bv-signed-in', redraw);
})();
