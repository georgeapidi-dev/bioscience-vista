/* Heart and circulation laboratory · Learnova · by Learnova */
(function () {
  var M = window.LABM, LABS = window.LABS = window.LABS || {};
  var CONDS = [['normal', 'Healthy heart'], ['stenosis', 'Aortic valve stenosis (narrow valve)'], ['regurg', 'Mitral valve regurgitation (leaky valve)'], ['weak', 'Weakened heart muscle (heart failure)']];
  LABS.heart = {
    id: 'heart', title: 'Heart and circulation laboratory',
    tags: ['Biology', 'Human physiology', 'MYP 3–5', 'IB DP B3.2', 'IGCSE', 'A Level'],
    background: '<p>The heart is a double pump. The <b>left ventricle</b> pumps oxygenated blood into the <b>aorta</b> and round the body; the right ventricle pumps deoxygenated blood to the lungs. This lab models the <b>left side</b>.</p>' +
      '<p><b>Valves open and close because of pressure differences.</b> The <b>mitral (atrioventricular) valve</b> is open when atrial pressure is higher than ventricular pressure. The <b>aortic (semilunar) valve</b> opens when ventricular pressure rises above aortic pressure, and closes when it falls below. This keeps blood flowing one way.</p>' +
      '<p>One heartbeat is the <b>cardiac cycle</b>: <b>atrial systole</b> (atria contract, topping up the ventricles) → <b>ventricular systole</b> (ventricles contract; first all valves are shut, then blood is ejected) → <b>diastole</b> (muscle relaxes and the chambers refill).</p>' +
      '<p><b>Stroke volume</b> (SV) is the volume pumped per beat; <b>cardiac output</b> = heart rate × stroke volume. A healthy adult at rest: about 70 beats per minute × 70 cm³ ≈ 5 dm³ per minute, with blood pressure about 120/80 mmHg.</p>',
    objectives: ['Explain the opening and closing of heart valves from pressure changes in the cardiac cycle.', 'Calculate cardiac output from heart rate and stroke volume.', 'Investigate how heart rate affects stroke volume and cardiac output.', 'Describe how valve disease or weak heart muscle changes pressures and output.'],
    rq: 'How does heart rate (40 to 200 beats per minute) affect stroke volume and cardiac output?',
    hypPrompt: 'Predict what happens to cardiac output as heart rate rises from rest to a very high rate, and explain your prediction.',
    hypothesis: { marks: 3, points: [
      { re: [/(cardiac output|co).*(increase|rise)|(increase|rise).*(cardiac output)/], marks: 1, ok: 'You predict output rises at first.', miss: 'Predict how cardiac output changes as heart rate rises.' },
      { re: [/(stroke volume|sv).*(decrease|fall|smaller|less)|fill|filling time|less time/], marks: 1, ok: 'You link high rates to less filling.', miss: 'Think about filling time: at very high rates the ventricles have less time to fill.' },
      { re: [/hr ?× ?sv|heart rate (×|x|times) stroke volume|rate.*stroke volume/], marks: 1, ok: 'You use CO = HR × SV.', miss: 'Use cardiac output = heart rate × stroke volume.' }] },
    variables: { iv: 'heart rate (beats per minute)', dv: 'stroke volume (cm³) and cardiac output (dm³ per minute)',
      cv: ['heart condition (healthy)', 'contractility of the heart muscle', 'resistance of the blood vessels', 'pressure of blood returning from the lungs'] },
    apparatus: ['Model left heart: left atrium, left ventricle, mitral and aortic valves, aorta', 'Pressure sensors in the atrium, ventricle and aorta (mmHg)', 'Volume sensor in the ventricle (cm³)', 'In a real lab: pulse sensor or stethoscope, sphygmomanometer (blood-pressure cuff), stopwatch'],
    safety: ['Virtual lab. In a real exercise investigation: warm up, stop if anyone feels dizzy or unwell, and check medical conditions first.'],
    method: ['Keep the condition <b>Healthy heart</b> and contractility at 1.0.', 'Set a heart rate and press <b>Run</b>. Watch the valves and the pressure graph. Use <b>Slow motion</b> to follow one beat.', 'Press <b>Record trial</b> to save stroke volume, cardiac output and blood pressure.', 'Repeat for heart rates from 40 to 200 bpm in steps of 20.', 'Then choose a heart condition and compare it with the healthy heart at 75 bpm.'],
    controls: [
      { id: 'hr', label: 'Heart rate', min: 40, max: 200, step: 5, value: 75, unit: 'bpm' },
      { id: 'cond', label: 'Heart condition', type: 'select', value: 'normal', options: CONDS },
      { id: 'con', label: 'Contractility of heart muscle (relative; adrenaline raises it)', min: 0.6, max: 1.6, step: 0.1, value: 1, dp: 1 },
      { id: 'speed', label: 'Playback speed', type: 'select', value: '0.5', options: [['1', 'Real time'], ['0.5', 'Half speed'], ['0.2', 'Slow motion (×0.2)']] }
    ],
    columns: [
      { key: 'cond', label: 'Condition', num: false, group: true }, { key: 'hr', label: 'Heart rate', unit: 'bpm', dp: 0 }, { key: 'con', label: 'Contractility', dp: 1 },
      { key: 'EDV', label: 'End-diastolic volume', unit: 'cm³', dp: 0 }, { key: 'ESV', label: 'End-systolic volume', unit: 'cm³', dp: 0 }, { key: 'SV', label: 'Stroke volume', unit: 'cm³', dp: 0 },
      { key: 'CO', label: 'Cardiac output', unit: 'dm³/min', dp: 2 }, { key: 'sys', label: 'Systolic BP', unit: 'mmHg', dp: 0 }, { key: 'dia', label: 'Diastolic BP', unit: 'mmHg', dp: 0 },
      { key: 'lv', label: 'Peak LV pressure', unit: 'mmHg', dp: 0 }, { key: 'EF', label: 'Ejection fraction', unit: '%', dp: 0 }, { key: 'back', label: 'Backflow per beat', unit: 'cm³', dp: 0 }
    ],
    graph: { x: 'hr', y: 'CO', group: 'cond' },
    hints: ['Look at the pressure graph: a valve is open only while the pressure behind it is higher than the pressure in front of it.', 'Stroke volume = end-diastolic volume − end-systolic volume (for a heart with no leaking valve).', 'Cardiac output (dm³/min) = heart rate × stroke volume (cm³) ÷ 1000.', 'At very high heart rates diastole becomes very short. What does that do to filling?'],
    analyse: [
      { id: 'co', q: 'Use one of your trials: show that cardiac output = heart rate × stroke volume. Give the heart rate, stroke volume and your calculated output in dm³ per minute.', marks: 2, lines: 2,
        check: function (ans, c) {
          var t = c.trials.filter(function (r) { return r.cond === 'Healthy heart'; }); if (!t.length) return { score: 0, fb: 'Record a trial first.' };
          var nums = (String(ans).match(/\d+(\.\d+)?/g) || []).map(Number), ok = t.some(function (r) { return nums.some(function (v) { return Math.abs(v - r.hr * r.SV / 1000) <= 0.06 * r.hr * r.SV / 1000; }) && nums.indexOf(Math.round(r.hr)) >= 0; });
          return ok ? { score: 2, fb: '✓ Correct use of CO = HR × SV ÷ 1000.' } : { score: nums.length >= 3 ? 1 : 0, fb: '➜ Multiply heart rate by stroke volume (cm³), then divide by 1000 to get dm³/min. Use numbers from one row of your table.' };
        } },
      { id: 'peak', q: 'From your graph, at about what heart rate is cardiac output highest?', marks: 1, lines: 1,
        number: { value: function (c) { return peakHR(c.trials); }, abs: 25, tol: 0, unit: 'bpm', dp: 0, missing: 'Record healthy-heart trials across 40–200 bpm first.' } },
      { id: 'why', q: 'Explain why stroke volume falls at very high heart rates, and why cardiac output finally falls too.', marks: 3, lines: 4, points: [
        { re: [/diastole|filling|fill|relax/], marks: 1, ok: 'You use filling / diastole.', miss: 'Mention diastole (filling time) getting shorter.' },
        { re: [/(less|shorter|not enough) time|time.*(short|less)/], marks: 1, ok: 'Less time to fill.', miss: 'Say there is less time for blood to enter the ventricle.' },
        { re: [/(stroke volume|sv).*(fall|decrease|drop|less|smaller).*(more|faster|than).*|output.*(fall|decrease|drop)|(fall|decrease|drop).*(faster|more) than.*(rate|hr)|outweigh|multiplied/], marks: 1, ok: 'You compare SV fall with HR rise.', miss: 'Explain that eventually stroke volume falls faster than heart rate rises, so HR × SV decreases.' }] },
      { id: 'valve', q: 'Use the pressure graph to explain when the aortic valve opens and closes.', marks: 2, lines: 3, points: [
        { re: [/(ventric|lv).*(higher|greater|exceed|above|more).*(aort)|(aort).*(lower|less|below).*(ventric)/], marks: 1, ok: 'Opens when ventricular pressure exceeds aortic pressure.', miss: 'It opens when pressure in the left ventricle rises above pressure in the aorta.' },
        { re: [/(ventric|lv).*(lower|less|below|falls? below).*(aort)|(aort).*(higher|greater|above).*(ventric)|back.?flow|prevent/], marks: 1, ok: 'Closes when ventricular pressure falls below aortic pressure.', miss: 'It closes when ventricular pressure falls below aortic pressure, stopping backflow.' }] },
      { id: 'dis', q: 'Compare one heart condition with the healthy heart at 75 bpm. Use figures, and explain the difference.', marks: 3, lines: 4, points: [
        { re: [/\d/], marks: 1, ok: 'You quote figures.', miss: 'Quote values from both rows.' },
        { re: [/stenosis|narrow|regurg|leak|weak|failure/], marks: 1, ok: 'You name the condition.', miss: 'Name the condition you compared.' },
        { re: [/higher pressure|harder|resistance|backflow|back into|flows? back|less (blood )?(pumped|forward)|weaker|contract/], marks: 1, ok: 'You explain the cause.', miss: 'Explain why: e.g. a narrow valve needs a higher pressure; a leaking valve lets blood flow back into the atrium.' }] }
    ],
    evaluate: [
      { id: 'lim', q: 'In real exercise, stroke volume usually rises at first rather than falling. Which control in the model could you change to show this, and why does it rise in real life?', marks: 2, lines: 3, points: [
        { re: [/contractility|adrenaline|sympathetic|stronger contraction/], marks: 1, ok: 'Contractility (adrenaline).', miss: 'Increase contractility: adrenaline and sympathetic nerves make the muscle contract more strongly.' },
        { re: [/venous return|more blood (returns|back)|muscle pump|starling|stretch/], marks: 1, ok: 'Increased venous return / Starling.', miss: 'More blood returns to the heart during exercise (venous return), stretching the ventricle so it contracts harder (Starling\'s law).' }] },
      { id: 'model', q: 'State one simplification of this model compared with a real heart.', marks: 1, lines: 2, points: [
        { re: [/left|right side|lungs|one side|only/, /nerv|hormone|adrenaline|reflex|baroreceptor|control/, /vessel|resistance|constant|fixed/, /blood (is|as) a|viscos|elastic|shape|3d/], marks: 1, ok: 'A valid simplification.', miss: 'For example: only the left side is modelled; body resistance and venous pressure are fixed; no nerve or hormone control.' }] }
    ],
    model: '<ul><li><b>Time-varying elastance</b>: ventricular pressure = E(t) × (V − V₀). E(t) rises smoothly during systole and falls in early diastole (E<sub>max</sub> = 3.0 mmHg/cm³ × contractility, E<sub>min</sub> = 0.08, V₀ = 10 cm³). Systole lasts about 0.16 s + 12 % of the cycle, so diastole shortens most as heart rate rises.</li>' +
      '<li>The atrium is a weaker pump that contracts just before the ventricle and fills from the pulmonary veins (12 mmHg).</li>' +
      '<li>The aorta and arteries are a <b>two-element Windkessel</b>: compliance 1.3 cm³/mmHg and systemic resistance 1.0 mmHg·s/cm³ draining to the veins (5 mmHg).</li>' +
      '<li>Valves are one-way with small resistances. Aortic stenosis raises the aortic valve resistance 30-fold; mitral regurgitation lets blood leak back through the mitral valve; heart failure lowers E<sub>max</sub> to 1.2.</li>' +
      '<li>The equations are solved step by step every 0.5 ms. There is no nervous or hormonal control: in a real body baroreceptor reflexes would change heart rate, contractility and vessel resistance. Values are typical for an adult at rest, not for a particular person.</li></ul>',
    setup: setup
  };

  function peakHR(trials) {
    var by = {}; trials.filter(function (t) { return t.cond === 'Healthy heart'; }).forEach(function (t) { (by[t.hr] = by[t.hr] || []).push(t.CO); });
    var ks = Object.keys(by); if (ks.length < 4) return null;
    var best = null, bv = -1; ks.forEach(function (k) { var m = by[k].reduce(function (s, v) { return s + v; }, 0) / by[k].length; if (m > bv) { bv = m; best = +k; } }); return best;
  }

  function setup(api) {
    var fx = api.fx, sim = null, raf = null, playing = false, t0 = 0, tPlay = 0, spd = 0.5;
    api.stage.innerHTML = '<svg id="ht-sv" viewBox="0 0 520 300" style="width:100%;height:auto;background:#f4f7fb;border-radius:12px" role="img" aria-label="Heart chambers and valves"></svg>' +
      '<canvas class="vl-chart" id="ht-ch" style="height:240px"></canvas><div id="ht-lg"></div>';
    var sv = api.stage.querySelector('#ht-sv'), ch = api.stage.querySelector('#ht-ch');
    function compute() { var v = api.vals(); sim = M.heart({ hr: v.hr, cond: v.cond, contract: (v.cond === 'weak' ? 1.2 : 3.0) * v.con, beats: 6 }); sim.v = v; sim.t0 = 4 * sim.T; }
    function sample(t) {   // t within the last two beats
      var s = sim.series, i = Math.min(s.length - 1, Math.max(0, Math.round(t / 0.005)));
      return s[i];
    }
    function drawHeart(p) {
      var rLV = 34 + 0.22 * p.Vlv, rLA = 46, open1 = p.mitral || p.regurg, open2 = p.aortic, h = '';
      // right side (viewer's left), drawn smaller and marked as not modelled
      h += '<text x="110" y="22" text-anchor="middle" font-size="12" fill="#475569">Right side (to the lungs)</text><text x="370" y="22" text-anchor="middle" font-size="12" fill="#475569">Left side (to the body) · modelled</text>';
      h += '<ellipse cx="110" cy="95" rx="42" ry="34" fill="#a5b4fc" stroke="#3730a3" stroke-width="2"/><text x="110" y="99" text-anchor="middle" font-size="12">right atrium</text>';
      h += '<ellipse cx="115" cy="200" rx="' + (rLV * 0.9) + '" ry="' + (rLV * 0.95) + '" fill="#a5b4fc" stroke="#3730a3" stroke-width="3"/><text x="115" y="204" text-anchor="middle" font-size="12">right ventricle</text><text x="115" y="262" text-anchor="middle" font-size="10" fill="#64748b">(pumps in step; not calculated)</text>';
      // left atrium
      h += '<ellipse cx="330" cy="80" rx="' + rLA + '" ry="32" fill="#fca5a5" stroke="#991b1b" stroke-width="2"/><text x="330" y="77" text-anchor="middle" font-size="12">left atrium</text><text x="330" y="93" text-anchor="middle" font-size="11">' + fx(p.Pla, 0) + ' mmHg</text>';
      // left ventricle size follows volume
      h += '<ellipse cx="330" cy="200" rx="' + rLV + '" ry="' + (rLV * 0.95) + '" fill="#f87171" stroke="#7f1d1d" stroke-width="' + (p.Plv > 30 ? 6 : 3) + '"/><text x="330" y="194" text-anchor="middle" font-size="12" fill="#fff" font-weight="700">left ventricle</text><text x="330" y="209" text-anchor="middle" font-size="11" fill="#fff">' + fx(p.Plv, 0) + ' mmHg</text><text x="330" y="223" text-anchor="middle" font-size="11" fill="#fff">' + fx(p.Vlv, 0) + ' cm³</text>';
      // mitral valve
      h += valve(330, 128, open1, p.regurg ? 'mitral valve: LEAKING' : 'mitral valve ' + (open1 ? 'open' : 'closed'), p.regurg);
      // aorta
      h += '<path d="M' + (330 + rLV - 4) + ',200 L440,200 q40,0 40,-50 l0,-110" stroke="#dc2626" stroke-width="22" fill="none" opacity=".75"/><text x="462" y="62" font-size="12" text-anchor="end">aorta ' + fx(p.Pao, 0) + ' mmHg</text>';
      h += valve(445, 200, open2, 'aortic valve ' + (open2 ? 'open' : 'closed'), false, true);
      if (open1 && !p.regurg) h += arrow(318, 108, 318, 150, '#7f1d1d');
      if (p.regurg) h += arrow(342, 150, 342, 108, '#d00000');
      if (open2) h += arrow(462, 185, 476, 110, '#7f1d1d');
      var phase = p.aortic ? 'Ventricular systole: ejection' : (p.Plv > p.Pla + 1 && !p.aortic ? ((p.t % sim.T) < sim.Ts * 0.6 ? 'Isovolumetric contraction: all valves shut' : 'Isovolumetric relaxation: all valves shut') : 'Diastole: ventricle filling');
      h += '<rect x="10" y="268" width="500" height="26" rx="8" fill="#fff"/><text x="260" y="286" text-anchor="middle" font-size="13" font-weight="700">' + phase + '</text>';
      sv.innerHTML = h;
      function valve(x, y, open, label, leak, vert) {
        var col = leak ? '#d00000' : open ? '#16a34a' : '#334155';
        var g = vert ? (open ? '<line x1="' + x + '" y1="' + (y - 12) + '" x2="' + (x + 10) + '" y2="' + (y - 16) + '" stroke="' + col + '" stroke-width="4"/><line x1="' + x + '" y1="' + (y + 12) + '" x2="' + (x + 10) + '" y2="' + (y + 16) + '" stroke="' + col + '" stroke-width="4"/>' : '<line x1="' + x + '" y1="' + (y - 12) + '" x2="' + x + '" y2="' + (y + 12) + '" stroke="' + col + '" stroke-width="4"/>')
          : (open ? '<line x1="' + (x - 22) + '" y1="' + y + '" x2="' + (x - 18) + '" y2="' + (y + 16) + '" stroke="' + col + '" stroke-width="4"/><line x1="' + (x + 22) + '" y1="' + y + '" x2="' + (x + 18) + '" y2="' + (y + 16) + '" stroke="' + col + '" stroke-width="4"/>' : '<line x1="' + (x - 22) + '" y1="' + y + '" x2="' + (x + 22) + '" y2="' + y + '" stroke="' + col + '" stroke-width="4"/>');
        return g + '<text x="' + (vert ? x : x - 30) + '" y="' + (vert ? y + 34 : y + 4) + '" font-size="11" fill="' + col + '" text-anchor="' + (vert ? 'middle' : 'end') + '">' + label + '</text>';
      }
      function arrow(x1, y1, x2, y2, c) { return '<defs><marker id="hm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" fill="' + c + '"/></marker></defs><line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + c + '" stroke-width="4" marker-end="url(#hm)"/>'; }
    }
    function drawChart(tNow) {
      var s = sim.series.filter(function (p) { return p.t >= sim.t0; }), off = sim.t0, step = Math.max(1, Math.round(s.length / 400));
      var pick = function (k) { var o = []; for (var i = 0; i < s.length; i += step) o.push([+(s[i].t - off).toFixed(3), s[i][k]]); return o; };
      var series = [{ name: 'aorta', pts: pick('Pao'), color: '#D55E00' }, { name: 'left ventricle', pts: pick('Plv'), color: '#0072B2' }, { name: 'left atrium', pts: pick('Pla'), color: '#009E73' }];
      api.chart(ch, { xLabel: 'Time / s (two heartbeats)', yLabel: 'Pressure / mmHg', xmin: 0, xmax: +(2 * sim.T).toFixed(3), ymin: 0, ymax: Math.max(140, sim.lvMax + 10), series: series, marks: tNow != null ? [{ x: tNow, label: '' }] : [] });
      api.stage.querySelector('#ht-lg').innerHTML = api.legend(series);
    }
    function readings() {
      api.readings([['Heart rate', sim.v.hr + ' bpm'], ['Stroke volume', fx(sim.SV, 0) + ' cm³'], ['Cardiac output', fx(sim.CO, 2) + ' dm³/min'], ['Blood pressure', fx(sim.sys, 0) + '/' + fx(sim.dia, 0) + ' mmHg'], ['EDV / ESV', fx(sim.EDV, 0) + ' / ' + fx(sim.ESV, 0) + ' cm³'], ['Ejection fraction', fx(sim.EF, 0) + ' %'], ['Cycle length', fx(sim.T, 2) + ' s']].concat(sim.regurgVol > 1 ? [['Backflow per beat', fx(sim.regurgVol, 0) + ' cm³']] : []));
    }
    function frame() {
      var el = ((performance.now() - t0) / 1000 * spd + tPlay) % (2 * sim.T);
      drawHeart(sample(sim.t0 + el)); drawChart(el);
      if (playing) raf = requestAnimationFrame(frame); else tPlay = el;
    }
    function play() { spd = +api.vals().speed; compute(); readings(); playing = true; t0 = performance.now(); cancelAnimationFrame(raf); frame(); api.label('run', '⏸ Pause'); api.enable('rec', true); api.status('Running. Record the trial when you are ready.'); }
    function pause() { playing = false; tPlay = ((performance.now() - t0) / 1000 * spd + tPlay) % (2 * sim.T); cancelAnimationFrame(raf); api.label('run', '▶ Run'); }
    api.actions([
      { id: 'run', label: '▶ Run', main: true, fn: function () { if (playing) pause(); else play(); } },
      { id: 'step', label: '⏭ Step 0.02 s', fn: function () { if (playing) pause(); tPlay = (tPlay + 0.02) % (2 * sim.T); drawHeart(sample(sim.t0 + tPlay)); drawChart(tPlay); } },
      { id: 'rec', label: '➕ Record trial', fn: function () {
        var v = sim.v; api.record({ cond: CONDS.filter(function (c) { return c[0] === v.cond; })[0][1].split(' (')[0], hr: v.hr, con: v.con, EDV: sim.EDV, ESV: sim.ESV, SV: sim.SV, CO: sim.CO, sys: sim.sys, dia: sim.dia, lv: sim.lvMax, EF: sim.EF, back: sim.regurgVol });
      } }
    ]);
    api.onChange = function (v, id) {
      if (id === 'speed') { if (playing) { tPlay = ((performance.now() - t0) / 1000 * spd + tPlay) % (2 * sim.T); t0 = performance.now(); } spd = +v.speed; return; }
      compute(); readings(); tPlay = 0; t0 = performance.now(); if (!playing) { drawHeart(sample(sim.t0)); drawChart(0); }
    };
    compute(); readings(); drawHeart(sample(sim.t0)); drawChart(0);
    api.status('Press Run to watch the heart beat.');
  }
})();
