/* Pulse rate laboratory · VistaEd · by George Apidi
   IB DP B3.2.4: measure heart rate by feeling the radial or carotid pulse, and compare with a digital pulse oximeter. Investigate the effect
   of exercise and the recovery time of fitter and less fit people. */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var METH = [['radial', 'Radial pulse (wrist), count 15 s × 4'], ['carotid', 'Carotid pulse (neck), count 30 s × 2'], ['digital', 'Digital pulse oximeter (finger)']];
  var ACTL = [['rest', 'At rest (sitting 5 min)'], ['step', '2 min step-ups'], ['run', '2 min running on the spot']];
  var FIT = [['fit', 'Fitter volunteer (trains 4× a week)'], ['unfit', 'Less fit volunteer']];

  function hr(o, tmin) {   // heart rate (bpm) tmin minutes after exercise
    var rest = o.fit === 'fit' ? 60 : 76, peak = o.act === 'rest' ? rest : o.act === 'step' ? (o.fit === 'fit' ? 108 : 124) : (o.fit === 'fit' ? 142 : 162), tau = o.fit === 'fit' ? 0.9 : 1.9;
    return rest + (peak - rest) * Math.exp(-tmin / tau);
  }
  function measure(o, tmin, r) {   // what the method reads
    var h = hr(o, tmin), rr = r == null ? Math.random() : r;
    if (o.meth === 'digital') return { val: Math.round(h + (rr - 0.5) * 2), counted: null, secs: null };
    var secs = o.meth === 'radial' ? 15 : 30, beats = Math.round(h * secs / 60 + (rr - 0.5) * 2.2);   // miscount ± 1 beat
    return { val: beats * 60 / secs, counted: beats, secs: secs };
  }

  LABS.pulse = {
    id: 'pulse', title: 'Pulse rate laboratory: exercise and recovery',
    tags: ['Biology', 'Human physiology', 'IB DP B3.2.4 pulse rates', 'IGCSE', 'MYP 3–5'],
    background: '<p>Each heartbeat pushes blood into the arteries, which stretch and recoil: a <b>pulse</b>. The <b>pulse rate</b> equals the <b>heart rate</b> in beats per minute (bpm). It can be felt where an artery passes over a bone near the skin: the <b>radial artery</b> at the wrist or the <b>carotid artery</b> in the neck, using two fingertips (not the thumb, which has its own pulse). Count the beats for 15 s and multiply by 4, or for 30 s and multiply by 2.</p>' +
      '<p>A <b>digital pulse oximeter</b> clipped on a finger detects each pulse of blood with light, and also shows blood oxygen saturation. Digital readings are quick and precise, but can be affected by movement, cold fingers or nail varnish.</p>' +
      '<p>During exercise muscles respire faster and need more oxygen and glucose and must remove more CO₂, so <b>heart rate rises</b>. After exercise it falls back to the resting rate; the <b>recovery time</b> is usually shorter in fitter people, whose larger, stronger hearts pump a larger stroke volume.</p>',
    objectives: ['Measure heart rate by palpation of the radial and carotid pulse.', 'Compare palpation with a digital method for precision.', 'Investigate the effect of exercise on heart rate.', 'Compare recovery times of fitter and less fit volunteers.'],
    rq: 'How does the heart rate of a fitter and a less fit volunteer change in the 5 minutes after 2 minutes of running?',
    hypPrompt: 'Predict how heart rate changes after exercise, and how fitness affects the recovery time.',
    hypothesis: { marks: 3, points: [
      { re: [/(increase|rise|higher|faster).*(exercise|running)|after (exercise|running).*(high|increase)/], marks: 1, ok: 'Heart rate rises after exercise.', miss: 'Predict what exercise does to heart rate.' },
      { re: [/fit.*(faster|quick|shorter|sooner).*(recover|return)|recover.*(faster|quick).*fit/], marks: 1, ok: 'The fitter volunteer recovers faster.', miss: 'Predict how fitness affects recovery.' },
      { re: [/oxygen|respir|stroke volume|stronger heart|co2|co₂/], marks: 1, ok: 'You explain with respiration / stroke volume.', miss: 'Explain using oxygen demand or stroke volume.' }] },
    variables: { iv: 'time after exercise (min) and fitness of the volunteer', dv: 'heart rate (bpm)', cv: ['type and duration of exercise', 'same method of measuring', 'volunteer sitting during recovery', 'room temperature', 'no caffeine before the test'] },
    apparatus: ['Stopwatch', 'Digital pulse oximeter', 'Step (30 cm) or space to run on the spot', 'Recording sheet or spreadsheet'],
    safety: ['Volunteers must be healthy and can stop at any time; no exercise for anyone with a heart or breathing condition.', 'Never press both carotid arteries at once; press gently.', 'Keep personal data private.'],
    method: ['Choose the volunteer, <b>At rest</b>, and a method. Press <b>▶ Measure</b> and count the beats you see (or read the oximeter).', 'Record the resting rate. Then choose <b>2 min running</b>.', 'Press <b>▶ Measure</b> again: readings are taken at 0, 1, 2, 3, 4 and 5 minutes after the exercise. Press <b>➕ Record</b>.', 'Repeat with the other volunteer and with the other methods. Compare the precision of the methods.'],
    controls: [
      { id: 'fit', label: 'Volunteer', type: 'select', value: 'unfit', options: FIT },
      { id: 'act', label: 'Activity', type: 'select', value: 'rest', options: ACTL },
      { id: 'meth', label: 'Method', type: 'select', value: 'radial', options: METH }
    ],
    columns: [
      { key: 'fit', label: 'Volunteer', num: false, group: true }, { key: 'act', label: 'Activity', num: false, group: true }, { key: 'meth', label: 'Method', num: false },
      { key: 't', label: 'Time after exercise', unit: 'min', dp: 0 }, { key: 'beats', label: 'Beats counted', dp: 0 }, { key: 'hr', label: 'Heart rate', unit: 'bpm', dp: 0 }
    ],
    graph: { x: 't', y: 'hr', group: 'fit' },
    hints: ['Counting for 15 s and × 4 means every miscounted beat is an error of 4 bpm.', 'Recovery time: minutes until the rate is back to within 5 bpm of the resting rate.', 'Why should the volunteer stay seated during recovery?'],
    analyse: [
      { id: 'calc', q: 'You count 23 beats at the radial pulse in 15 s. Calculate the heart rate.', marks: 1, lines: 1, number: { value: 92, tol: 0.001, unit: 'bpm', dp: 0 } },
      { id: 'rec', q: 'Compare the recovery of the two volunteers after running. Use your data.', marks: 3, lines: 4, points: [
        { re: [/\d/], marks: 1, ok: 'You quote heart rates.', miss: 'Quote heart rates from your table.' }, { re: [/fit.*(faster|quicker|sooner|shorter|lower)|less fit.*(slower|longer|higher)/], marks: 1, ok: 'The fitter volunteer recovers faster.', miss: 'Compare the speed of recovery.' },
        { re: [/stroke volume|stronger|larger heart|more blood per beat|cardiac/], marks: 1, ok: 'Larger stroke volume.', miss: 'Explain: a trained heart pumps more blood per beat (larger stroke volume).' }] },
      { id: 'why', q: 'Explain why heart rate increases during exercise.', marks: 2, lines: 3, points: [
        { re: [/oxygen|glucose|respir/], marks: 1, ok: 'Muscles need more O₂ and glucose for respiration.', miss: 'Explain the extra need for O₂ / glucose for respiration.' }, { re: [/co2|co₂|carbon dioxide|lactate|heat|waste|remove/], marks: 1, ok: 'And more CO₂ to remove.', miss: 'Mention removing more CO₂ (and heat).' }] }
    ],
    evaluate: [
      { id: 'meth', q: 'Compare the precision of counting for 15 s, for 30 s and the digital oximeter.', marks: 2, lines: 3, points: [
        { re: [/digital.*(precise|exact|accura|1 bpm)|oximeter.*(precise|better)/], marks: 1, ok: 'The oximeter is most precise.', miss: 'Say which method is most precise.' }, { re: [/15.*(×|x|times) ?4|error of 4|4 bpm|miscount|longer count|30 s.*better|multipl/], marks: 1, ok: 'A 15 s count multiplies any miscount by 4.', miss: 'Explain: a 15 s count multiplies a miscounted beat by 4 (30 s by 2).' }] },
      { id: 'ctrl', q: 'Suggest two variables to control when comparing volunteers, and why.', marks: 2, lines: 3, points: [
        { re: [/same (exercise|duration|intensity|step)|exercise.*same/], marks: 1, ok: 'Same exercise.', miss: 'For example: the same exercise for the same time.' }, { re: [/age|sex|caffeine|posture|sitting|temperature|time of day|food|stress/], marks: 1, ok: 'A second valid variable.', miss: 'For example: age, caffeine, posture during recovery, room temperature.' }] }
    ],
    model: '<ul><li>Resting rate: fitter 60 bpm, less fit 76 bpm. Peak after step-ups 108/124 bpm, after running 142/162 bpm. Recovery HR = rest + (peak − rest) e<sup>−t/τ</sup>, τ = 0.9 min (fitter) or 1.9 min.</li>' +
      '<li>Palpation: the true number of beats in 15 s or 30 s ± up to 1 miscounted beat, then × 4 or × 2. Oximeter: ± 1 bpm.</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, raf = null, playing = false, t0 = 0, W = 680, H = 280, rows = [];
    api.stage.innerHTML = '<canvas id="pu-cv" width="680" height="280" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="Fingers on the wrist feeling the pulse, with a stopwatch"></canvas><p class="small" id="pu-cap" style="margin:6px 0;font-weight:700" aria-live="polite"></p><canvas class="vl-chart" id="pu-ch" style="height:200px"></canvas>';
    var cv = api.stage.querySelector('#pu-cv'), c = cv.getContext('2d'), ch = api.stage.querySelector('#pu-ch'), cap = api.stage.querySelector('#pu-cap');
    function draw(tmin, sec, beats, pulseOn) {
      var v = api.vals(); c.clearRect(0, 0, W, H);
      // arm / neck and fingers
      if (v.meth === 'carotid') { c.fillStyle = '#fcd34d'; c.beginPath(); c.arc(150, 80, 50, 0, 7); c.fill(); c.fillRect(120, 120, 60, 110); c.strokeStyle = pulseOn ? '#dc2626' : '#fca5a5'; c.lineWidth = pulseOn ? 7 : 4; c.beginPath(); c.moveTo(165, 125); c.lineTo(170, 225); c.stroke(); c.fillStyle = '#f59e0b'; c.fillRect(176, 160, 46, 12); c.fillRect(176, 176, 46, 12); }
      else { c.fillStyle = '#fcd34d'; c.beginPath(); c.roundRect ? c.roundRect(40, 130, 300, 70, 30) : c.rect(40, 130, 300, 70); c.fill(); c.strokeStyle = pulseOn ? '#dc2626' : '#fca5a5'; c.lineWidth = pulseOn ? 7 : 4; c.beginPath(); c.moveTo(60, 180); c.lineTo(320, 180); c.stroke();
        if (v.meth === 'radial') { c.fillStyle = '#f59e0b'; c.fillRect(240, 160, 14, 50); c.fillRect(258, 160, 14, 50); } else { c.fillStyle = '#334155'; c.fillRect(300, 140, 60, 50); c.fillStyle = '#22c55e'; c.font = 'bold 18px monospace'; c.textAlign = 'center'; c.fillText(String(Math.round(hr(v, tmin))), 330, 172); c.font = '9px monospace'; c.fillText('bpm', 330, 184); } }
      if (pulseOn) { c.strokeStyle = 'rgba(220,38,38,.4)'; c.lineWidth = 2; c.beginPath(); c.arc(v.meth === 'carotid' ? 168 : 250, v.meth === 'carotid' ? 175 : 180, 22, 0, 7); c.stroke(); }
      // stopwatch
      c.fillStyle = '#e2e8f0'; c.beginPath(); c.arc(520, 120, 70, 0, 7); c.fill(); c.strokeStyle = '#334155'; c.lineWidth = 4; c.stroke(); var lim = v.meth === 'carotid' ? 30 : 15;
      c.strokeStyle = '#dc2626'; c.lineWidth = 3; c.beginPath(); c.moveTo(520, 120); c.lineTo(520 + Math.sin(sec / 60 * 6.283) * 58, 120 - Math.cos(sec / 60 * 6.283) * 58); c.stroke();
      c.fillStyle = '#0f172a'; c.font = 'bold 14px system-ui'; c.textAlign = 'center'; c.fillText(fx(sec, 1) + ' s', 520, 220); if (v.meth !== 'digital') c.fillText('Beats counted: ' + beats, 520, 246);
      c.textAlign = 'left'; c.font = 'bold 15px system-ui'; c.fillText(v.act === 'rest' ? 'At rest' : fx(tmin, 0) + ' min after exercise', 16, 26);
    }
    function drawChart() { var v = api.vals(), series = [];
      [['fit', '#009E73'], ['unfit', '#D55E00']].forEach(function (f) { var pts = []; for (var t = 0; t <= 5.001; t += 0.1) pts.push([t, hr({ fit: f[0], act: v.act === 'rest' ? 'run' : v.act }, t)]); series.push({ name: FIT.filter(function (x) { return x[0] === f[0]; })[0][1], pts: pts, color: f[1], dash: f[0] !== v.fit }); });
      series.push({ name: 'Your measurements', pts: rows.map(function (r) { return [r.t, r.hr]; }), color: '#000', dots: true });
      api.chart(ch, { xLabel: 'Time after exercise / min', yLabel: 'Heart rate / bpm', xmin: 0, xmax: 5, ymin: 40, ymax: 180, series: series }); }
    function readings() { var last = rows[rows.length - 1]; api.readings([['Heart rate', last ? last.hr + ' bpm' : '—'], ['Beats counted', last && last.beats !== '' ? last.beats + ' in ' + (api.vals().meth === 'radial' ? 15 : 30) + ' s' : '—'], ['Resting rate (true)', Math.round(hr({ fit: api.vals().fit, act: 'rest' }, 0)) + ' bpm']]); }
    var schedule = [];
    function frame() {
      var v = api.vals(), lim = v.meth === 'digital' ? 5 : v.meth === 'carotid' ? 30 : 15, el = (performance.now() - t0) / 1000 * (v.meth === 'digital' ? 1 : lim / 6), cur = schedule[0];
      if (cur == null) { playing = false; api.label('run', '▶ Measure'); readings(); drawChart(); api.status('Done. ➕ Record to save the measurements.'); return; }
      var h = hr(v, cur), sec = Math.min(lim, el), beats = Math.floor(sec * h / 60), pulseOn = (sec * h / 60) % 1 < 0.25;
      draw(cur, sec, beats, pulseOn); cap.textContent = v.meth === 'digital' ? 'The oximeter reads the pulse directly.' : 'Count each throb you see in the artery for ' + lim + ' s.';
      if (sec >= lim) { var m = measure(v, cur); rows.push({ t: cur, hr: Math.round(m.val), beats: m.counted == null ? '' : m.counted }); schedule.shift(); t0 = performance.now(); readings(); drawChart(); }
      if (playing) raf = requestAnimationFrame(frame);
    }
    api.actions([
      { id: 'run', label: '▶ Measure', main: true, fn: function () { if (playing) return; var v = api.vals(); rows = []; schedule = v.act === 'rest' ? [0] : [0, 1, 2, 3, 4, 5]; playing = true; t0 = performance.now(); api.label('run', '⏳ Counting…'); frame(); } },
      { id: 'rec', label: '➕ Record', fn: function () { if (!rows.length) return api.status('Measure first.'); var v = api.vals(); rows.forEach(function (r) { api.record({ fit: v.fit === 'fit' ? 'Fitter' : 'Less fit', act: ACTL.filter(function (a) { return a[0] === v.act; })[0][1], meth: METH.filter(function (m) { return m[0] === v.meth; })[0][1].split(',')[0], t: v.act === 'rest' ? 0 : r.t, beats: r.beats, hr: r.hr }); }); } }
    ]);
    api.onChange = function () { rows = []; readings(); drawChart(); draw(0, 0, 0, false); cap.textContent = ''; };
    api.onChange();
    api.status('Press ▶ Measure.');
    window.BV_PU = { hr: hr, measure: measure };
  }
})();
