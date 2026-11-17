/* Range of motion laboratory: goniometer · BioscienceVista · by BioscienceVista
   IB DP B3.3.7: measure joint angles with a goniometer (or image analysis) and compare the range of motion of the elbow, knee, shoulder and
   hip in different planes and for different people. */
(function () {
  var LABS = window.LABS = window.LABS || {};
  var MOV = {   // joint, movement: [min°, max°] for a typical young adult, type of joint, number of planes
    'elbow-flex': ['Elbow', 'flexion – extension', 0, 145, 'hinge (synovial)', 1],
    'knee-flex': ['Knee', 'flexion – extension', 0, 135, 'hinge (modified)', 1],
    'shoulder-flex': ['Shoulder', 'flexion – extension (front–back)', -50, 170, 'ball and socket', 3],
    'shoulder-abd': ['Shoulder', 'abduction – adduction (sideways)', 0, 175, 'ball and socket', 3],
    'shoulder-rot': ['Shoulder', 'internal – external rotation', -70, 90, 'ball and socket', 3],
    'hip-flex': ['Hip', 'flexion – extension', -20, 120, 'ball and socket', 3],
    'hip-abd': ['Hip', 'abduction – adduction', -25, 45, 'ball and socket', 3]
  };
  var ML = Object.keys(MOV).map(function (k) { return [k, MOV[k][0] + ': ' + MOV[k][1]]; });
  var WHO = [['young', 'Young adult (18 years)'], ['old', 'Older adult (70 years)'], ['gym', 'Gymnast'], ['inj', 'After a joint injury (stiff)']];
  var FAC = { young: 1, old: 0.82, gym: 1.12, inj: 0.6 };

  function model(o) { var M = MOV[o.mv], f = FAC[o.who], mid = 0, lo = M[2] * f, hi = M[3] * f; if (o.mv === 'elbow-flex' && o.who === 'gym') lo = -8; return { lo: lo, hi: hi, rom: hi - lo, M: M }; }

  LABS.joint = {
    id: 'joint', title: 'Range of motion laboratory: measuring joint angles',
    tags: ['Biology', 'Human physiology', 'IB DP B3.3.7 range of motion', 'IB DP B3.3 muscle and motility'],
    background: '<p><b>Synovial joints</b> allow movement between bones. The shape of the joint surfaces, ligaments, the joint capsule and the muscles and tendons around the joint limit how far it can move. A <b>hinge joint</b> (elbow, knee) moves in one plane: <b>flexion</b> (bending, angle decreases) and <b>extension</b> (straightening). A <b>ball-and-socket joint</b> (shoulder, hip) moves in three planes: flexion–extension, <b>abduction–adduction</b> (away from or towards the midline) and <b>rotation</b>.</p>' +
      '<p>The <b>range of motion (ROM)</b> is the angle between the two extreme positions, measured with a <b>goniometer</b> (a protractor with two arms: the axis over the joint, one arm along each bone) or by <b>computer analysis of photographs</b>. ROM falls with age (stiffer connective tissue, less cartilage), after injury, and is greater in people who train flexibility, such as gymnasts.</p>',
    objectives: ['Use a goniometer to measure joint angles.', 'Compare the range of motion of hinge and ball-and-socket joints in different planes.', 'Compare the range of motion of different people.', 'Evaluate goniometry and image analysis as measurement methods.'],
    rq: 'How does the range of motion in flexion–extension compare between the elbow (hinge joint) and the shoulder (ball-and-socket joint) in a young adult?',
    hypPrompt: 'Predict which joint has the larger range of motion, and in how many planes each joint can move.',
    hypothesis: { marks: 2, points: [
      { re: [/shoulder.*(larger|greater|more|wider)|(larger|greater).*shoulder/], marks: 1, ok: 'The shoulder has the larger range.', miss: 'Predict which joint has the larger range.' },
      { re: [/three|3|several|many planes|ball and socket|hinge.*one|one plane/], marks: 1, ok: 'You compare the planes of movement.', miss: 'Say how many planes each joint moves in.' }] },
    variables: { iv: 'joint and movement (plane)', dv: 'range of motion (°) = maximum angle − minimum angle', cv: ['same volunteer, warmed up the same way', 'goniometer axis placed on the same landmark', 'active movement (no pushing by another person)', 'posture (standing / lying)', 'repeat 3 times and take the mean'] },
    apparatus: ['Goniometer (or a protractor with two arms)', 'Camera or phone and image-analysis software with an angle tool', 'Skin marker for bony landmarks'],
    safety: ['Move only within a comfortable range; stop if there is pain. No forced stretching.', 'Volunteers give consent and can stop at any time; data kept private.'],
    method: ['Choose a joint and movement and a volunteer.', 'Press <b>▶ Measure</b>: the goniometer is placed, the joint moves to one extreme, then to the other; read both angles.', 'Range of motion = maximum − minimum. Press <b>➕ Record</b>. Repeat three times.', 'Compare joints, planes and volunteers.'],
    controls: [
      { id: 'mv', label: 'Joint and movement', type: 'select', value: 'elbow-flex', options: ML },
      { id: 'who', label: 'Volunteer', type: 'select', value: 'young', options: WHO }
    ],
    columns: [
      { key: 'joint', label: 'Joint', num: false, group: true }, { key: 'mv', label: 'Movement', num: false }, { key: 'who', label: 'Volunteer', num: false, group: true },
      { key: 'lo', label: 'Minimum angle', unit: '°', dp: 0 }, { key: 'hi', label: 'Maximum angle', unit: '°', dp: 0 }, { key: 'rom', label: 'Range of motion', unit: '°', dp: 0 }
    ],
    graph: { x: 'hi', y: 'rom', group: 'joint' },
    hints: ['ROM = maximum − minimum. A negative angle means movement past the zero (neutral) position.', 'The goniometer axis must stay on the joint centre.', 'A ball-and-socket joint has a range in each of three planes.'],
    analyse: [
      { id: 'rom', q: 'A shoulder moves from −50° (extension) to 170° (flexion). Calculate its range of motion.', marks: 1, lines: 1, number: { value: 220, tol: 0.001, unit: '°', dp: 0 } },
      { id: 'cmp', q: 'Compare the range of motion of the elbow and shoulder, and explain the difference using joint structure.', marks: 3, lines: 4, points: [
        { re: [/\d/], marks: 1, ok: 'You quote ranges.', miss: 'Quote the ranges.' }, { re: [/shoulder.*(larger|greater|more)/], marks: 1, ok: 'Shoulder larger.', miss: 'Say which is larger.' }, { re: [/ball|socket|hinge|plane|shape|ligament|capsule|bone/], marks: 1, ok: 'Ball-and-socket vs hinge structure.', miss: 'Explain with the joint shapes (ball and socket vs hinge).' }] },
      { id: 'age', q: 'Compare the young and older adult, and suggest a reason for the difference.', marks: 2, lines: 3, points: [
        { re: [/older.*(less|smaller|lower|reduced)|(less|smaller).*older/], marks: 1, ok: 'Older adult has a smaller range.', miss: 'Compare the ranges.' }, { re: [/stiff|cartilage|arthritis|elastic|collagen|ligament|muscle|tendon|synovial fluid/], marks: 1, ok: 'Stiffer tissues / less cartilage.', miss: 'Suggest a reason: stiffer ligaments and tendons, worn cartilage.' }] }
    ],
    evaluate: [
      { id: 'err', q: 'Suggest two sources of error with a goniometer and how image analysis could reduce one of them.', marks: 2, lines: 4, points: [
        { re: [/axis|landmark|place|align|position|parallax|read/], marks: 1, ok: 'Placing the axis / reading the scale.', miss: 'For example: placing the axis on the joint centre, reading the scale.' }, { re: [/photo|image|software|still|marker|record/], marks: 1, ok: 'Photos with markers can be measured precisely afterwards.', miss: 'For example: photos with skin markers let you measure the angle precisely afterwards.' }] }
    ],
    model: '<ul><li>Typical young adult ranges (°): elbow 0 to 145; knee 0 to 135; shoulder flexion −50 to 170, abduction 0 to 175, rotation −70 to 90; hip flexion −20 to 120, abduction −25 to 45.</li><li>Factors: older adult × 0.82, gymnast × 1.12 (elbow hyperextension to −8°), after injury × 0.6. Each measurement varies by about ±3° (placing and reading the goniometer).</li></ul>',
    setup: setup
  };

  function setup(api) {
    var fx = api.fx, raf = null, playing = false, t0 = 0, W = 640, H = 320, meas = null;
    api.stage.innerHTML = '<canvas id="jo-cv" width="640" height="320" style="width:100%;height:auto;background:#f8fafc;border-radius:12px" role="img" aria-label="A limb moving with a goniometer on the joint"></canvas><p class="small" id="jo-cap" style="margin:6px 0;font-weight:700" aria-live="polite"></p>';
    var cv = api.stage.querySelector('#jo-cv'), c = cv.getContext('2d'), cap = api.stage.querySelector('#jo-cap'), JX = 330, JY = 165;
    function draw(ang, lo, hi) {
      var v = api.vals(), M = MOV[v.mv], limb = /shoulder|hip/.test(v.mv), R = Math.PI / 180;
      var fixedA = limb ? Math.PI / 2 : Math.PI, dir = function (d) { return limb ? Math.PI / 2 - d * R : -d * R; }, moveA = dir(ang), L1 = limb ? 125 : 170, L2 = limb ? 120 : 160;
      JY = limb ? 150 : 165; c.clearRect(0, 0, W, H); c.lineCap = 'round';
      if (limb) { c.fillStyle = '#93c5fd'; c.fillRect(JX - 92, JY - 18, 80, 190); c.fillStyle = '#fde68a'; c.beginPath(); c.arc(JX - 52, JY - 58, 30, 0, 7); c.fill(); }
      [[fixedA, L1, limb], [moveA, L2, false]].forEach(function (b) { if (b[2]) return; c.strokeStyle = '#fcd34d'; c.lineWidth = 34; c.beginPath(); c.moveTo(JX, JY); c.lineTo(JX + Math.cos(b[0]) * b[1], JY + Math.sin(b[0]) * b[1]); c.stroke(); c.strokeStyle = '#e5e7eb'; c.lineWidth = 8; c.beginPath(); c.moveTo(JX, JY); c.lineTo(JX + Math.cos(b[0]) * (b[1] - 18), JY + Math.sin(b[0]) * (b[1] - 18)); c.stroke(); });
      c.fillStyle = 'rgba(14,165,233,.15)'; c.strokeStyle = '#0369a1'; c.lineWidth = 2; c.beginPath(); c.arc(JX, JY, 62, 0, 7); c.fill(); c.stroke();
      c.font = '9px system-ui'; c.textAlign = 'center';
      for (var d = -90; d <= 180; d += 15) { var ta = dir(d); c.strokeStyle = '#0369a1'; c.lineWidth = 1; c.beginPath(); c.moveTo(JX + Math.cos(ta) * 54, JY + Math.sin(ta) * 54); c.lineTo(JX + Math.cos(ta) * 62, JY + Math.sin(ta) * 62); c.stroke(); if (d % 30 === 0) { c.fillStyle = '#0369a1'; c.fillText(String(d), JX + Math.cos(ta) * 74, JY + Math.sin(ta) * 74 + 3); } }
      [lo, hi].forEach(function (e) { if (e == null) return; var ea = dir(e); c.strokeStyle = '#16a34a'; c.setLineDash([4, 3]); c.lineWidth = 1.5; c.beginPath(); c.moveTo(JX, JY); c.lineTo(JX + Math.cos(ea) * 150, JY + Math.sin(ea) * 150); c.stroke(); c.setLineDash([]); });
      c.strokeStyle = '#dc2626'; c.lineWidth = 3; c.beginPath(); c.moveTo(JX, JY); c.lineTo(JX + Math.cos(moveA) * 62, JY + Math.sin(moveA) * 62); c.stroke(); c.fillStyle = '#1e293b'; c.beginPath(); c.arc(JX, JY, 6, 0, 7); c.fill();
      c.fillStyle = '#0f172a'; c.font = 'bold 15px system-ui'; c.textAlign = 'left'; c.fillText(M[0] + ' · ' + M[1] + ' · ' + fx(ang, 0) + '°', 14, 24); c.font = '12px system-ui'; c.fillText(M[4] + ' joint: moves in ' + M[5] + (M[5] > 1 ? ' planes' : ' plane'), 14, 44);
      if (lo != null) c.fillText('Minimum ' + fx(lo, 0) + '°   Maximum ' + (hi != null ? fx(hi, 0) + '°   Range ' + fx(hi - lo, 0) + '°' : '…'), 14, 306);
    }
    function readings() { var m = meas || model(api.vals()); api.readings([['Minimum angle', meas ? fx(meas.lo, 0) + '°' : '—'], ['Maximum angle', meas ? fx(meas.hi, 0) + '°' : '—'], ['Range of motion', meas ? fx(meas.hi - meas.lo, 0) + '°' : '—'], ['Joint type', MOV[api.vals().mv][4]]]); }
    function frame() { var el = Math.min(1, (performance.now() - t0) / 6000), lo = meas.lo, hi = meas.hi, a;
      if (el < 0.4) a = lo * Math.sin(el / 0.4 * Math.PI / 2); else if (el < 0.5) a = lo; else a = lo + (hi - lo) * Math.sin(Math.min(1, (el - 0.5) / 0.4) * Math.PI / 2);
      draw(a, el > 0.4 ? lo : null, el > 0.95 ? hi : null); cap.textContent = el < 0.45 ? 'Move to one extreme and read the minimum angle…' : 'Now to the other extreme: read the maximum angle.';
      if (el >= 1) { playing = false; api.label('run', '▶ Measure'); readings(); cap.textContent = 'Range of motion = ' + fx(hi, 0) + ' − (' + fx(lo, 0) + ') = ' + fx(hi - lo, 0) + '°.'; api.status('➕ Record, then repeat or change the joint.'); return; } if (playing) raf = requestAnimationFrame(frame); }
    api.actions([
      { id: 'run', label: '▶ Measure', main: true, fn: function () { if (playing) return; var m = model(api.vals()); meas = { lo: Math.round(m.lo + (Math.random() - 0.5) * 6), hi: Math.round(m.hi + (Math.random() - 0.5) * 6) }; playing = true; t0 = performance.now(); api.label('run', '⏳ Moving…'); frame(); } },
      { id: 'rec', label: '➕ Record', fn: function () { if (!meas) return api.status('Measure first.'); var v = api.vals(), M = MOV[v.mv]; api.record({ joint: M[0], mv: M[1], who: WHO.filter(function (w) { return w[0] === v.who; })[0][1], lo: meas.lo, hi: meas.hi, rom: meas.hi - meas.lo }); } }
    ]);
    api.onChange = function () { meas = null; readings(); draw(0); cap.textContent = ''; };
    api.onChange();
    api.status('Press ▶ Measure.');
    window.BV_JO = { model: model };
  }
})();
