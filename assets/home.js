/* BioScience Vista · discovery-led homepage (phase 2, 18 Nov 2026).
   1. Enzyme explorer in the hero: a simplified model of enzyme activity (rate = optimum × pH factor × temperature factor),
      a prediction to make first, then the explanation. Clearly labelled as a simplified model.
   2. Today's investigation: one of the virtual labs, chosen by the date, with a prediction to write before opening it.
   3. Science Challenge of the Week: one question a week, answer revealed with the reasoning.
   4. Signed in: continue learning and progress from real records; teachers get their teaching shortcuts.
   Respects prefers-reduced-motion: the particles then stay still and only the numbers change. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    var W = 640, H = 360, parts = [], prods = [], enz = [];
    function size() { var r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0); }
    for (var i = 0; i < 5; i++) enz.push({ x: 90 + i * 115, y: 190 + (i % 2 ? -50 : 50), a: 0 });
    for (var j = 0; j < 34; j++) parts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * 1.6, vy: (Math.random() - .5) * 1.6 });
    function draw() {
      var r = rate(), shape = pHf(+pH.value) * (+T.value > 45 ? Math.max(0, 1 - (+T.value - 45) / 20) : 1);
      ctx.clearRect(0, 0, W, H);
      // enzymes: the active site gap closes as the shape is lost
      enz.forEach(function (e) {
        var gap = 0.35 + 0.45 * shape;
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.a);
        ctx.fillStyle = 'rgba(47,158,116,.85)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 30, gap, Math.PI * 2 - gap); ctx.closePath(); ctx.fill();
        ctx.restore();
        if (!reduce) e.a += 0.003;
      });
      // substrate particles move faster when hot; near an enzyme they react with a probability set by the rate
      var speed = 0.6 + (+T.value) / 40;
      parts.forEach(function (p) {
        if (!reduce) { p.x += p.vx * speed; p.y += p.vy * speed; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
        enz.forEach(function (e) { var dx = p.x - e.x, dy = p.y - e.y; if (dx * dx + dy * dy < 1300 && Math.random() < r / 2500) { prods.push({ x: e.x + 34, y: e.y, l: 60 }); p.x = Math.random() * W; p.y = Math.random() < .5 ? 0 : H; } });
        ctx.fillStyle = '#F2A93B'; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 7); ctx.fill();
      });
      prods = prods.filter(function (q) { q.l--; if (!reduce) { q.x += 1.2; q.y -= .4; } ctx.fillStyle = 'rgba(34,211,238,' + (q.l / 60) + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, 4, 0, 7); ctx.arc(q.x + 7, q.y, 4, 0, 7); ctx.fill(); return q.l > 0; });
      // mini graph: rate against pH, with the current point
      var gx = 18, gy = H - 18, gw = 170, gh = 70;
      ctx.fillStyle = 'rgba(11,20,38,.7)'; ctx.fillRect(gx - 8, gy - gh - 22, gw + 16, gh + 30);
      ctx.strokeStyle = 'rgba(159,231,242,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, gy - gh); ctx.lineTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.stroke();
      ctx.strokeStyle = '#22D3EE'; ctx.lineWidth = 2; ctx.beginPath();
      for (var k = 0; k <= 60; k++) { var ph = 1 + k * 13 / 60, y = gy - gh * pHf(ph) * Tf(+T.value) / Tf(40); if (k) ctx.lineTo(gx + k * gw / 60, y); else ctx.moveTo(gx, y); }
      ctx.stroke();
      var cx = gx + (+pH.value - 1) / 13 * gw, cy = gy - gh * r / 100; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 7); ctx.fill();
      ctx.fillStyle = '#A9B6C9'; ctx.font = '11px Inter, sans-serif'; ctx.fillText('rate against pH', gx, gy - gh - 8);
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
      ]).then(function (x) {
        var P = x[0].data || [], ids = P.slice(0, 40).map(function (p) { return p.lesson_id; });
        return (ids.length ? S.db.from('lessons').select('id,title,url').in('id', ids) : Promise.resolve({ data: [] })).then(function (r) { var map = {}; (r.data || []).forEach(function (l) { if (l.url) map[l.id] = [l.url, l.title]; }); x.push(map); return x; });
      }).then(function (x) {
        var P = x[0].data || [], map = x[3] || {}, done = P.filter(function (p) { return p.status === 'completed' || p.percent >= 100; }).length;
        var last = P.filter(function (p) { return map[p.lesson_id] && !(p.status === 'completed' || p.percent >= 100); })[0] || P.filter(function (p) { return map[p.lesson_id]; })[0];
        me.innerHTML = '<header><div><p class="vx-eye">Your learning</p><h2>Welcome back' + (name ? ', ' + E(name) : '') + '</h2></div><a class="vx-btn ghost" href="/dashboard/">My dashboard →</a></header><div class="dx-me">' +
          (last ? '<a href="' + E(map[last.lesson_id][0]) + '"><span class="lbl">Continue where you left off</span><b>▶</b><span>' + E(map[last.lesson_id][1]) + (last.percent ? ' · ' + Math.round(last.percent) + ' %' : '') + '</span></a>' : '<a href="/learn/"><span class="lbl">Start learning</span><b>▶</b><span>Choose your first lesson</span></a>') +
          '<div><span class="lbl">Lessons completed</span><b>' + done + '</b><span>of ' + P.length + ' started</span></div>' +
          '<div><span class="lbl">Assessments submitted</span><b>' + (x[1].count || 0) + '</b><span>marked work and quizzes</span></div>' +
          '<div><span class="lbl">Lab investigations</span><b>' + (x[2].count || 0) + '</b><span>recorded in the Virtual Lab</span></div></div>';
        me.hidden = false;
      });
    }, function () {});
  }, 250);
})();
