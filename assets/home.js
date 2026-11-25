/* VistaEd · discovery-led homepage (phase 2, 18 Nov 2026).
   1. Enzyme explorer in the hero: a simplified model of enzyme activity (rate = optimum × pH factor × temperature factor),
      a prediction to make first, then the explanation. Clearly labelled as a simplified model.
   2. Today's investigation: one of the virtual labs, chosen by the date, with a prediction to write before opening it.
   3. Science Challenge of the Week: one question a week, answer revealed with the reasoning.
   4. Signed in: continue learning and progress from real records; teachers get their teaching shortcuts.
   Respects prefers-reduced-motion: the particles then stay still and only the numbers change. */
(function () {
  'use strict';
  var reduce = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || document.documentElement.classList.contains('a11y-calm');
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ---------- 1. enzyme explorer ---------- */
  var box = document.getElementById('dx-lab');
  if (box) {
    var cv = box.querySelector('canvas'), ctx = cv.getContext('2d'), pH = box.querySelector('#dx-ph'), T = box.querySelector('#dx-t'), oPH = box.querySelector('#dx-ph-o'), oT = box.querySelector('#dx-t-o'), meter = box.querySelector('#dx-rate');
    // simplified model (same shape as the Virtual Lab's enzyme model): bell-shaped pH factor around 7; temperature raises
    // collisions (Q10 about 2) until about 40 °C, then the enzyme denatures
    var pHf = function (p) { return Math.exp(-Math.pow((p - 7) / 1.6, 2)); };
    var Tf = function (t) { var q = Math.pow(2, (t - 37) / 10); return t <= 40 ? q : q * Math.exp(-Math.pow((t - 40) / 6, 2)); };
    var rate = function () { return 100 * pHf(+pH.value) * Tf(+T.value) / Tf(40) * 1; };
    /* colourful version (23 Nov 2026): a cell-like background, enzymes in five colours with shading, glowing substrate,
       product pairs that sparkle away, a ring at each reaction, and a filled graph. The canvas keeps the shape of its box. */
    var W = 640, H = 360, parts = [], prods = [], rings = [], enz = [], blobs = [];
    var HUES = [[34, 197, 94], [139, 92, 246], [6, 182, 212], [244, 63, 94], [59, 130, 246]];
    function place() {
      var SP = [[.27, .42], [.73, .4], [.2, .6], [.8, .6], [.5, .53]];   // clear of the graph (top) and the rate box (bottom centre)
      enz = SP.map(function (q, i) { return { x: W * q[0], y: H * q[1], a: i, c: HUES[i] }; });
      blobs = []; for (var b = 0; b < 7; b++) blobs.push({ x: Math.random() * W, y: Math.random() * H, rx: 30 + Math.random() * 50, ry: 20 + Math.random() * 35, h: [190, 260, 320, 150, 40][b % 5] });
    }
    function size() { var r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; if (!r.width) return; W = r.height / r.width > .8 ? 420 : 640; H = Math.round(W * r.height / r.width); cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0); place(); }
    place();
    for (var j = 0; j < 36; j++) parts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * 1.6, vy: (Math.random() - .5) * 1.6, t: [] });
    var mix = function (c, g, k) { return [0, 1, 2].map(function (n) { return Math.round(c[n] * k + g * (1 - k)); }); };
    var rgba = function (c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };
    function draw() {
      var r = rate(), shape = pHf(+pH.value) * (+T.value > 45 ? Math.max(0, 1 - (+T.value - 45) / 20) : 1), hot = Math.min(1, Math.max(0, (+T.value - 20) / 50));
      // the cell: cool at low temperature, warmer when hot, with faint organelles
      var bg = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * .7);
      bg.addColorStop(0, 'rgb(' + Math.round(236 + 19 * hot) + ',' + Math.round(253 - 10 * hot) + ',' + Math.round(250 - 20 * hot) + ')');
      bg.addColorStop(.6, 'rgb(' + Math.round(224 + 20 * hot) + ',' + Math.round(231 - 10 * hot) + ',255)'); bg.addColorStop(1, 'rgb(' + Math.round(250) + ',' + Math.round(220 - 20 * hot) + ',' + Math.round(240 - 10 * hot) + ')');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      blobs.forEach(function (b) { ctx.fillStyle = 'hsla(' + b.h + ',80%,70%,.16)'; ctx.beginPath(); ctx.ellipse(b.x, b.y, b.rx, b.ry, b.x / 90, 0, 7); ctx.fill(); });
      // enzymes: shaded, coloured; the active site closes and the colour fades as the shape is lost
      enz.forEach(function (e) {
        var gap = 0.35 + 0.45 * shape, c = mix(e.c, 160, .35 + .65 * shape), wob = shape < .5 && !reduce ? Math.sin(Date.now() / 90 + e.a) * (1 - shape) * 3 : 0;
        ctx.save(); ctx.translate(e.x + wob, e.y); ctx.rotate(e.a);
        ctx.shadowColor = rgba(c, .45); ctx.shadowBlur = 16;
        var g = ctx.createRadialGradient(-10, -10, 4, 0, 0, 36); g.addColorStop(0, rgba(mix(c, 255, .55), 1)); g.addColorStop(.7, rgba(c, 1)); g.addColorStop(1, rgba(mix(c, 0, .7), 1));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 32, gap, Math.PI * 2 - gap); ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0; ctx.strokeStyle = rgba(mix(c, 0, .6), .8); ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-12, -14, 8, 4, -.6, 0, 7); ctx.fill();
        ctx.restore();
        if (!reduce) e.a += 0.004;
      });
      // substrate: glowing orange beads, faster (with short trails) when hot
      var speed = 0.6 + (+T.value) / 40;
      parts.forEach(function (p) {
        if (!reduce) { p.t.push([p.x, p.y]); if (p.t.length > 2 + Math.round(6 * hot)) p.t.shift(); p.x += p.vx * speed; p.y += p.vy * speed; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
        enz.forEach(function (e) { var dx = p.x - e.x, dy = p.y - e.y; if (dx * dx + dy * dy < 1400 && Math.random() < r / 2500) { prods.push({ x: e.x + 34, y: e.y, l: 70, c: e.c }); rings.push({ x: e.x, y: e.y, l: 24, c: e.c }); p.x = Math.random() * W; p.y = Math.random() < .5 ? 0 : H; p.t = []; } });
        p.t.forEach(function (q, k) { ctx.fillStyle = 'rgba(251,146,60,' + (k / p.t.length) * .25 + ')'; ctx.beginPath(); ctx.arc(q[0], q[1], 4, 0, 7); ctx.fill(); });
        var g = ctx.createRadialGradient(p.x - 2, p.y - 2, 1, p.x, p.y, 8); g.addColorStop(0, '#fff7c2'); g.addColorStop(.45, '#fbbf24'); g.addColorStop(1, '#ea580c');
        ctx.shadowColor = 'rgba(251,146,60,.7)'; ctx.shadowBlur = 10; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      });
      // a ring of the enzyme's colour at each reaction
      rings = rings.filter(function (o) { o.l--; ctx.strokeStyle = rgba(o.c, o.l / 24); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(o.x, o.y, 34 + (24 - o.l) * 1.6, 0, 7); ctx.stroke(); return o.l > 0; });
      // product: pairs of blue beads drifting away, with a sparkle
      prods = prods.filter(function (q) {
        q.l--; if (!reduce) { q.x += 1.3; q.y -= .5; } var a = q.l / 70;
        ctx.fillStyle = 'rgba(14,165,233,' + a + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, 5, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(99,102,241,' + a + ')'; ctx.beginPath(); ctx.arc(q.x + 9, q.y + 2, 5, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,' + a + ')'; ctx.beginPath(); ctx.arc(q.x - 1.5, q.y - 1.5, 1.6, 0, 7); ctx.arc(q.x + 7.5, q.y + .5, 1.6, 0, 7); ctx.fill();
        return q.l > 0; });
      // mini graph, top centre so a round frame does not cut it: rate against pH, filled, with the current point
      var gw = 170, gh = 58, gx = W / 2 - gw / 2, gy = H * .1 + gh + 20;
      ctx.fillStyle = 'rgba(255,255,255,.82)'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(gx - 10, gy - gh - 22, gw + 20, gh + 32, 10); else ctx.rect(gx - 10, gy - gh - 22, gw + 20, gh + 32); ctx.fill();
      var top = function (k) { var ph = 1 + k * 13 / 60; return gy - gh * pHf(ph) * Tf(+T.value) / Tf(40); };
      var fg = ctx.createLinearGradient(gx, 0, gx + gw, 0); fg.addColorStop(0, 'rgba(236,72,153,.35)'); fg.addColorStop(.5, 'rgba(139,92,246,.35)'); fg.addColorStop(1, 'rgba(6,182,212,.35)');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(gx, gy); for (var k = 0; k <= 60; k++) ctx.lineTo(gx + k * gw / 60, top(k)); ctx.lineTo(gx + gw, gy); ctx.closePath(); ctx.fill();
      var lg = ctx.createLinearGradient(gx, 0, gx + gw, 0); lg.addColorStop(0, '#ec4899'); lg.addColorStop(.5, '#8b5cf6'); lg.addColorStop(1, '#06b6d4');
      ctx.strokeStyle = lg; ctx.lineWidth = 2.5; ctx.beginPath(); for (k = 0; k <= 60; k++) { if (k) ctx.lineTo(gx + k * gw / 60, top(k)); else ctx.moveTo(gx, top(0)); } ctx.stroke();
      ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, gy - gh); ctx.lineTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.stroke();
      var cx = gx + (+pH.value - 1) / 13 * gw, cy = gy - gh * r / 100;
      ctx.shadowColor = '#db2777'; ctx.shadowBlur = 10; ctx.fillStyle = '#DB2777'; ctx.beginPath(); ctx.arc(cx, cy, 5.5, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#334155'; ctx.font = '600 11px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('rate against pH', gx + gw / 2, gy - gh - 8); ctx.textAlign = 'left';
      meter.textContent = Math.round(r) + ' %';
      if (!reduce) requestAnimationFrame(draw);
    }
    function upd() { oPH.textContent = 'pH ' + (+pH.value).toFixed(1); oT.textContent = (+T.value) + ' °C'; if (reduce) draw(); }
    pH.addEventListener('input', upd); T.addEventListener('input', upd);
    window.addEventListener('resize', size); size(); upd(); draw();
    // the prediction
    var said = null, reveal = box.querySelector('.dx-reveal');
    box.querySelectorAll('.dx-choices button').forEach(function (b) {
      b.onclick = function () {
        said = b.dataset.v; box.querySelectorAll('.dx-choices button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        pH.value = 3; T.value = 37; upd();
        var at3 = Math.round(100 * pHf(3) * Tf(37) / Tf(40)), at7 = Math.round(100 * pHf(7) * Tf(37) / Tf(40));
        reveal.innerHTML = (said === 'slower' ? '<b>Yes.</b> ' : '<b>Look again.</b> ') + 'At pH 3 the rate falls from about ' + at7 + ' % to ' + at3 + ' % of the maximum. Extra H⁺ ions change the charges on amino acids in the active site, so the substrate no longer fits well, and at extremes the enzyme denatures. Now try the temperature: where is the optimum, and why does the rate crash above it? <a href="/simulations/enzyme/">Run the full enzyme lab →</a>';
        try { localStorage.setItem('dx-pred', said); } catch (e) {}
      };
    });
  }

  /* ---------- 2. today's investigation ---------- */
  var today = document.getElementById('dx-today'), LABS = window.DX_LABS || [];
  var day = Math.floor((Date.now() + 3 * 3600e3) / 864e5);   // changes at midnight, East Africa Time
  if (today && LABS.length) {
    var L = LABS[day % LABS.length];
    today.querySelector('[data-t]').textContent = L.t;
    today.querySelector('[data-d]').textContent = L.d;
    today.querySelector('[data-p]').textContent = L.p;
    var ta = today.querySelector('textarea'), go = today.querySelector('[data-go]'), key = 'dx-today-' + day;
    go.href = '/simulations/' + L.k + '/';
    try { ta.value = localStorage.getItem(key) || ''; } catch (e) {}
    ta.addEventListener('input', function () { try { localStorage.setItem(key, ta.value); } catch (e) {} });
  }

  /* ---------- 3. Science Challenge of the Week ---------- */
  var CH = [
    { q: 'A plant cell is placed in pure water. Why does it not burst, when a red blood cell in the same water does?', o: ['Plant cells have no aquaporins', 'The cell wall resists expansion, building up turgor pressure', 'Water cannot enter plant cells by osmosis', 'Plant cells pump water out as fast as it enters'], a: 1, w: 'Water enters both cells by osmosis. In the plant cell the wall pushes back, so pressure potential rises until there is no net movement. A red blood cell has no wall, so it swells and bursts (haemolysis).', l: '/simulations/osmosis/' },
    { q: 'Doubling the substrate concentration does not change the rate of an enzyme reaction. What is the most likely reason?', o: ['The enzyme is denatured', 'All active sites are already occupied: the enzyme is saturated', 'The substrate has run out', 'The temperature is too low for any reaction'], a: 1, w: 'At high substrate concentration every active site is busy, so the rate is at its maximum (Vmax). Only more enzyme, or a change in conditions, can raise it.', l: '/simulations/enzyme/' },
    { q: 'Moving a lamp from 10 cm to 20 cm from a pondweed cuts the bubbles to about a quarter. Why a quarter, not a half?', o: ['Light intensity follows an inverse square law: 1/d²', 'Bubbles get bigger further from the lamp', 'Temperature falls by half', 'The plant stops making chlorophyll'], a: 0, w: 'Light spreads out from a point source, so intensity ∝ 1/d². Doubling the distance gives a quarter of the light, and while light is the limiting factor the rate follows it.', l: '/simulations/photosynthesis/' },
    { q: 'Equal volumes of 0.1 mol dm⁻³ hydrochloric acid and 0.1 mol dm⁻³ ethanoic acid are titrated with the same NaOH. Which needs more alkali to reach the equivalence point?', o: ['Hydrochloric acid, because it is stronger', 'Ethanoic acid, because it is weaker', 'They need the same volume', 'It depends on the indicator'], a: 2, w: 'Both contain the same number of moles of acid, and each mole reacts with one mole of NaOH. Strength changes the pH curve and the pH at equivalence, not the volume needed.', l: '/simulations/titration/' },
    { q: 'Why does a dihybrid cross of two heterozygotes sometimes give a ratio far from 9:3:3:1?', o: ['Mutations happen in every generation', 'The two genes may be linked on the same chromosome', 'Chi-squared tests are unreliable', 'Dominant alleles are always more common'], a: 1, w: 'The 9:3:3:1 ratio assumes independent assortment. Genes close together on one chromosome are inherited together unless crossing over separates them, so recombinant phenotypes are rarer.', l: '/simulations/crosses/' },
    { q: 'In a sealed jar with pondweed and snails, the oxygen level stays steady in the light but falls in the dark. What does that tell you?', o: ['Snails photosynthesise', 'In the light, photosynthesis balances respiration; in the dark only respiration continues', 'Oxygen leaks out in the dark', 'Pondweed stops respiring in the light'], a: 1, w: 'All the organisms respire all the time. Only in the light does photosynthesis add oxygen. A stable level in the light means production and use are balanced.', l: '/simulations/mesocosm/' },
    { q: 'A nerve impulse is "all or nothing". What happens if a stimulus is twice as strong as the threshold?', o: ['The action potential is twice as tall', 'The action potentials are the same size, but they fire more often', 'The impulse travels twice as fast', 'No action potential: the stimulus is too strong'], a: 1, w: 'Once the threshold is reached, voltage-gated Na⁺ channels open fully and every action potential reaches the same peak. Stronger stimuli are coded by frequency, not size.', l: '/simulations/neural/' },
    { q: 'Guppies in streams with predators are drab; without predators, males become brightly coloured within a few generations. Which force makes them colourful?', o: ['Mutation caused by clear water', 'Sexual selection by female choice', 'Males deciding to change colour', 'Genetic drift alone'], a: 1, w: 'Females prefer brighter males, so brighter males have more offspring. Where predators are present, natural selection against conspicuous males outweighs this. Endler showed both forces in experiments.', l: '/simulations/guppies/' }];
  var ch = document.getElementById('dx-chal');
  if (ch) {
    var wk = Math.floor(day / 7), C = CH[wk % CH.length];
    ch.querySelector('[data-q]').textContent = C.q;
    var opts = ch.querySelector('.opts'), why = ch.querySelector('[data-why]');
    opts.innerHTML = C.o.map(function (o, i) { return '<button type="button" data-i="' + i + '">' + E(o) + '</button>'; }).join('');
    opts.querySelectorAll('button').forEach(function (b) { b.onclick = function () {
      var ok = +b.dataset.i === C.a; opts.querySelectorAll('button').forEach(function (x) { x.disabled = true; if (+x.dataset.i === C.a) x.classList.add('ok'); }); if (!ok) b.classList.add('no');
      why.innerHTML = '<b>' + (ok ? 'Correct.' : 'Not quite.') + '</b> ' + E(C.w) + ' <a href="' + C.l + '">Test it in the Virtual Lab →</a>'; why.hidden = false; }; });
  }

  /* For you: links chosen from the learner's own profile (learner_preferences, set on My dashboard). Nothing is guessed. */
  var FOR = {
    ib_myp: [['/myp/', '📘', 'MYP science lessons'], ['/quizzes/', '📝', 'Criterion-based assessments'], ['/simulations/', '🔬', 'Virtual Lab investigations']],
    ib_dp: [['/biology/', '🧬', 'DP Biology course'], ['/research/', '🧪', 'Research Hub: IA and EE'], ['/exams/', '📝', 'Exam-style practice']],
    cambridge_ks3: [['/cambridge/', '📗', 'Cambridge Lower Secondary'], ['/simulations/', '🔬', 'Virtual Lab investigations'], ['/practice/', '🃏', 'Practice and revision']],
    igcse: [['/cambridge/', '📗', 'IGCSE courses'], ['/exams/', '📝', 'Exam-style practice'], ['/practice/', '🃏', 'Flashcards and practice']],
    a_level: [['/a-level/', '📕', 'AS and A Level courses'], ['/exams/', '📝', 'Exam-style practice'], ['/research/', '🧪', 'Research and practical skills']],
    other: [['/explore/', '🌍', 'Explore every topic'], ['/simulations/', '🔬', 'Virtual Lab'], ['/practice/', '🃏', 'Practice and revision']]
  };
  var TOPIC = { cells: 'Cells', molecular: 'Enzymes and molecules', genetics: 'Genetics', evolution: 'Evolution', ecology: 'Ecology', physiology: 'The human body', plants: 'Plants', biotech: 'Biotechnology', reactions: 'Chemical reactions', acids: 'Acids and bases', organic: 'Organic chemistry', 'ess-climate': 'Climate change', 'ess-biodiversity': 'Conservation', 'phys-motion': 'Forces and motion', 'phys-electric': 'Electricity', 'math-stats': 'Statistics', 'math-algebra': 'Algebra', 'general-investigation': 'Experiments and data' };
  function forYou(p) {
    if (!p || !p.programme) return '<p class="dx-fy-set">✨ <a href="/dashboard/">Set up your learning profile</a> (programme, subjects and interests) and this page will suggest what to do next.</p>';
    var links = (FOR[p.programme] || FOR.other).map(function (l) { return '<a href="' + l[0] + '"><span aria-hidden="true">' + l[1] + '</span> ' + E(l[2]) + '</a>'; }).join('');
    var ints = (p.interests || []).filter(function (k) { return TOPIC[k]; }).slice(0, 6).map(function (k) { return '<a class="chip" href="/explore/#' + k + '">' + E(TOPIC[k]) + '</a>'; }).join('');
    return '<div class="dx-fy"><h3>For you</h3><div class="dx-fy-l">' + links + '</div>' + (ints ? '<p class="vx-muted">Your interests</p><div class="dx-fy-i">' + ints + '<a class="chip ask" href="/tutor/">🤖 Ask the tutor</a></div>' : '<p class="vx-muted"><a href="/dashboard/">Add your interests</a> to see topic shortcuts here.</p>') + '</div>';
  }

  /* ---------- 4. signed in: continue learning, progress, teaching shortcuts (real records only) ---------- */
  var me = document.getElementById('dx-me');
  if (!me) return;
  var tries = 0, t = setInterval(function () {
    var S = window.BVS; if (++tries > 60) clearInterval(t); if (!S || !S.db || !S.me) return; clearInterval(t);
    S.me().then(function (u) {
      if (!u) return;
      var staff = u.staff || u.school || (u.roles || []).indexOf('teacher') >= 0;
      var name = ((u.profile && u.profile.full_name) || '').split(' ')[0];
      if (staff) {
        me.innerHTML = '<header><div><p class="vx-eye">Your teaching</p><h2>Welcome back' + (name ? ', ' + E(name) : '') + '</h2></div></header><div class="dx-me">' +
          '<a href="' + (u.admin ? '/teach/' : u.staff ? '/staff/' : '/teach/') + '"><span class="lbl">Classes and marking</span><b>🏫</b><span>Open your teacher dashboard</span></a>' +
          '<a href="/research/#/teacher"><span class="lbl">Research supervision</span><b>🧪</b><span>IA and EE projects in your classes</span></a>' +
          '<a href="/quizzes/"><span class="lbl">Assessment</span><b>📝</b><span>Set and review assessments</span></a>' +
          '<a href="/simulations/"><span class="lbl">Virtual Lab</span><b>🔬</b><span>Labs to set as classwork</span></a></div>';
        me.hidden = false; return;
      }
      Promise.all([
        S.db.from('learning_progress').select('lesson_id,status,percent,updated_at').eq('student_id', u.user.id).order('updated_at', { ascending: false }).limit(200),
        S.db.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('student_id', u.user.id).not('submitted_at', 'is', null),
        S.db.from('sim_attempts').select('id', { count: 'exact', head: true }).eq('student_id', u.user.id),
        S.db.from('learner_preferences').select('programme,interests').eq('user_id', u.user.id).maybeSingle().then(function (r) { return r; }, function () { return { data: null }; }),
      ]).then(function (x) {
        var P = x[0].data || [], ids = P.slice(0, 40).map(function (p) { return p.lesson_id; });
        return (ids.length ? S.db.from('lessons').select('id,title,url').in('id', ids) : Promise.resolve({ data: [] })).then(function (r) { var map = {}; (r.data || []).forEach(function (l) { if (l.url) map[l.id] = [l.url, l.title]; }); x[4] = map; return x; });
      }).then(function (x) {
        var P = x[0].data || [], map = x[4] || {}, done = P.filter(function (p) { return p.status === 'completed' || p.percent >= 100; }).length;
        var last = P.filter(function (p) { return map[p.lesson_id] && !(p.status === 'completed' || p.percent >= 100); })[0] || P.filter(function (p) { return map[p.lesson_id]; })[0];
        me.innerHTML = '<header><div><p class="vx-eye">Your learning</p><h2>Welcome back' + (name ? ', ' + E(name) : '') + '</h2></div><a class="vx-btn ghost" href="/dashboard/">My dashboard →</a></header><div class="dx-me">' +
          (last ? '<a href="' + E(map[last.lesson_id][0]) + '"><span class="lbl">Continue where you left off</span><b>▶</b><span>' + E(map[last.lesson_id][1]) + (last.percent ? ' · ' + Math.round(last.percent) + ' %' : '') + '</span></a>' : '<a href="/learn/"><span class="lbl">Start learning</span><b>▶</b><span>Choose your first lesson</span></a>') +
          '<div><span class="lbl">Lessons completed</span><b>' + done + '</b><span>of ' + P.length + ' started</span></div>' +
          '<div><span class="lbl">Assessments submitted</span><b>' + (x[1].count || 0) + '</b><span>marked work and quizzes</span></div>' +
          '<div><span class="lbl">Lab investigations</span><b>' + (x[2].count || 0) + '</b><span>recorded in the Virtual Lab</span></div></div>' + forYou((x[3] && x[3].data) || null);
        me.hidden = false;
      });
    }, function () {});
  }, 250);
})();
