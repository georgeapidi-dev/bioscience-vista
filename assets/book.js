/* Book a private lesson · Learnova
   Requests go to the database through book_lesson(); only the site admin can read them. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  var SUBJECTS = ['IB Diploma Biology', 'IB Environmental Systems & Societies', 'IB Biology IA or Extended Essay support', 'IGCSE Biology', 'IGCSE Chemistry',
    'AS & A Level Biology', 'AS & A Level Chemistry', 'MYP Science', 'Other (tell me in the message)'];
  var TZ = ''; try { TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  var me = null;

  function minDate() { var d = new Date(Date.now() + 864e5); d.setMinutes(0, 0, 0); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
  function nice(v) { try { return new Date(v).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return v; } }
  var STATUS = { new: ['Waiting for reply', ''], confirmed: ['Confirmed', 'ok-t'], declined: ['Not available', 'bad-t'], done: ['Completed', 'ok-t'], cancelled: ['Cancelled', 'bad-t'] };

  function form() {
    var p = me && me.profile ? me.profile : {}, email = me && me.user ? me.user.email : '';
    app.innerHTML =
      '<form id="bk" class="panel grp" novalidate>' +
      '<fieldset class="bk-mode"><legend><b>1. How would you like to learn?</b></legend>' +
      '<label class="bk-opt"><input type="radio" name="mode" value="face_to_face" required><span><b>🏫 Face to face</b><span class="small muted">In Mombasa, at your home or an agreed place. Practical work and past papers on paper.</span></span></label>' +
      '<label class="bk-opt"><input type="radio" name="mode" value="virtual" checked><span><b>💻 Virtual</b><span class="small muted">Live on Google Meet or Zoom from anywhere, with a shared whiteboard, simulations and the site’s tools.</span></span></label></fieldset>' +
      '<label class="f" id="locw" hidden>Area or venue in Mombasa<input name="location" maxlength="200" placeholder="e.g. Nyali, at home"></label>' +
      '<fieldset><legend><b>2. What do you need?</b></legend>' +
      '<label class="f">Subject<select name="subject" required><option value="">Choose a subject</option>' + SUBJECTS.map(function (s) { return '<option>' + E(s) + '</option>'; }).join('') + '</select></label>' +
      '<label class="f">Level or year<input name="level" maxlength="80" placeholder="e.g. DP1 HL, Year 11, AS Level"></label>' +
      '<div class="two"><label class="f">Type of booking<select name="plan"><option value="single">One lesson</option><option value="weekly">Weekly lessons</option><option value="exam_prep">Exam preparation course</option></select></label>' +
      '<label class="f">Lesson length<select name="duration_min"><option value="45">45 minutes</option><option value="60" selected>1 hour</option><option value="90">1 hour 30 minutes</option><option value="120">2 hours</option></select></label></div>' +
      '<label class="f">What would you like to work on?<textarea name="message" rows="3" maxlength="2000" placeholder="Topics, an upcoming test, IA feedback, past paper practice…"></textarea></label></fieldset>' +
      '<fieldset><legend><b>3. When suits you?</b> <span class="small muted">Give up to three times' + (TZ ? ' (your time zone: ' + E(TZ) + ')' : '') + '</span></legend>' +
      '<div class="bk-slots">' + [1, 2, 3].map(function (i) { return '<label class="f">Choice ' + i + (i === 1 ? '' : ' (optional)') + '<input type="datetime-local" name="slot' + i + '" min="' + minDate() + '"' + (i === 1 ? ' required' : '') + '></label>'; }).join('') + '</div></fieldset>' +
      '<fieldset><legend><b>4. Your details</b></legend>' +
      '<div class="mode" role="radiogroup" aria-label="Who is booking"><label class="chk"><input type="radio" name="booker" value="student" checked> I am the student</label><label class="chk"><input type="radio" name="booker" value="parent"> I am a parent or guardian</label></div>' +
      '<div class="two"><label class="f">Your name<input name="contact_name" required maxlength="120" autocomplete="name" value="' + E(p.full_name || '') + '"></label>' +
      '<label class="f" id="stw" hidden>Student’s name<input name="student_name" maxlength="120"></label></div>' +
      '<div class="two"><label class="f">Email<input name="email" type="email" required maxlength="200" autocomplete="email" value="' + E(email) + '"></label>' +
      '<label class="f">Phone or WhatsApp (optional)<input name="phone" type="tel" maxlength="40" autocomplete="tel" placeholder="+254 …"></label></div>' +
      '<p class="small muted" id="u18">Under 18? Please ask a parent or guardian to book, or add their phone number so they can agree the lessons too.</p>' +
      '<label class="bk-hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>' +
      '<label class="chk"><input type="checkbox" name="agree" required> I agree that Learnova may contact me by email or phone about this booking.</label></fieldset>' +
      '<p class="small muted">This is a request, not a payment. You will get a reply to confirm the time, the fee and, for virtual lessons, the meeting link.</p>' +
      '<p id="bkmsg" class="small" aria-live="polite"></p><div class="cta"><button class="btn main" type="submit">Send booking request</button></div></form>' +
      '<div id="mine"></div>';
    var f = app.querySelector('#bk');
    function sync() {
      var face = f.mode.value === 'face_to_face', par = f.booker.value === 'parent';
      app.querySelector('#locw').hidden = !face; app.querySelector('#stw').hidden = !par; app.querySelector('#u18').hidden = par;
      f.contact_name.previousSibling.textContent = par ? 'Parent or guardian’s name' : 'Your name';
    }
    f.addEventListener('change', sync); sync();
    f.addEventListener('submit', function (e) { e.preventDefault(); send(f); });
    mine();
  }

  function send(f) {
    var msg = app.querySelector('#bkmsg'), say = function (t, bad) { msg.textContent = t; msg.className = 'small ' + (bad ? 'bad-t' : 'muted'); };
    var slots = ['slot1', 'slot2', 'slot3'].map(function (n) { return f[n].value; }).filter(Boolean);
    if (!f.mode.value) return say('Choose face to face or virtual.', true);
    if (!f.subject.value) { f.subject.focus(); return say('Choose a subject.', true); }
    if (!slots.length) { f.slot1.focus(); return say('Give at least one day and time that suits you.', true); }
    if (slots.some(function (s) { return new Date(s) < new Date(); })) return say('Please choose times in the future.', true);
    if (f.contact_name.value.trim().length < 2) { f.contact_name.focus(); return say('Please enter your name.', true); }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.value.trim())) { f.email.focus(); return say('Please enter a valid email address.', true); }
    if (f.booker.value === 'parent' && !f.student_name.value.trim()) { f.student_name.focus(); return say('Please enter the student’s name.', true); }
    if (f.mode.value === 'face_to_face' && !f.location.value.trim()) { f.location.focus(); return say('Tell me the area or venue for face-to-face lessons.', true); }
    if (!f.agree.checked) return say('Please tick the box so I can contact you about the booking.', true);
    var p = { mode: f.mode.value, location: f.mode.value === 'face_to_face' ? f.location.value : '', subject: f.subject.value, level: f.level.value, plan: f.plan.value,
      duration_min: +f.duration_min.value, message: f.message.value, slots: slots.map(function (s) { return { at: new Date(s).toISOString(), local: s }; }), timezone: TZ,
      booker: f.booker.value, contact_name: f.contact_name.value, student_name: f.booker.value === 'parent' ? f.student_name.value : '', email: f.email.value, phone: f.phone.value, website: f.website.value };
    var btn = f.querySelector('[type=submit]'); btn.disabled = true; say('Sending…');
    if (!S.on) return fallback(p, say, btn);
    S.db.rpc('book_lesson', { p: p }).then(function (r) {
      btn.disabled = false;
      if (r.error) { say(S.nice(r.error), true); return; }
      done(p);
    }, function () { fallback(p, say, btn); });
  }
  function summary(p) {
    return '<ul class="small"><li><b>' + E(p.subject) + '</b>' + (p.level ? ' · ' + E(p.level) : '') + '</li><li>' + (p.mode === 'virtual' ? '💻 Virtual' : '🏫 Face to face · ' + E(p.location)) + ' · ' + p.duration_min + ' minutes · ' +
      ({ single: 'one lesson', weekly: 'weekly lessons', exam_prep: 'exam preparation' }[p.plan]) + '</li>' + p.slots.map(function (s, i) { return '<li>Choice ' + (i + 1) + ': ' + E(nice(s.local)) + '</li>'; }).join('') + '</ul>';
  }
  function done(p) {
    app.innerHTML = '<section class="panel tint grp"><h2>✅ Request sent</h2><p>Thank you, ' + E(p.contact_name.split(' ')[0]) + '. Learnova will reply to <b>' + E(p.email) + '</b>' + (p.phone ? ' or on ' + E(p.phone) : '') +
      ' to confirm the time and the fee' + (p.mode === 'virtual' ? ', and send the meeting link' : '') + '.</p>' + summary(p) +
      '<div class="cta"><a class="btn sm" href="/book/">Make another request</a><a class="btn sm" href="/learn/">Go to the Learning centre</a></div></section><div id="mine"></div>';
    mine();
  }
  function fallback(p, say, btn) {   // if the booking service cannot be reached, open an email with the same details
    btn.disabled = false;
    var body = ['Subject: ' + p.subject, 'Level: ' + p.level, 'Mode: ' + (p.mode === 'virtual' ? 'Virtual' : 'Face to face, ' + p.location), 'Plan: ' + p.plan + ', ' + p.duration_min + ' minutes',
      'Times: ' + p.slots.map(function (s) { return nice(s.local); }).join('; ') + (p.timezone ? ' (' + p.timezone + ')' : ''), 'Name: ' + p.contact_name + (p.student_name ? ' (parent of ' + p.student_name + ')' : ''),
      'Email: ' + p.email, 'Phone: ' + p.phone, '', p.message].join('\n');
    say('The booking service is not reachable right now. Please check your internet connection and press Send again in a few minutes.', true); return body;
  }
  function mine() {   // requests sent while logged in
    var box = app.querySelector('#mine'); if (!box || !me || !S.on) return;
    S.db.rpc('my_bookings').then(function (r) {
      var rows = r.data || []; if (!rows.length) return;
      box.innerHTML = '<section class="panel"><h3>Your booking requests</h3>' + rows.map(function (b) {
        var st = STATUS[b.status] || [b.status, ''];
        return '<div class="row2 bk-row"><span><b>' + E(b.subject) + '</b> <span class="small muted">' + (b.mode === 'virtual' ? 'Virtual' : 'Face to face') + ' · sent ' + E(S.when(b.created_at)) + '</span>' +
          (b.confirmed_slot ? '<br><span class="small">Booked for <b>' + E(nice(b.confirmed_slot)) + '</b></span>' : '') + (b.meeting_link && b.status === 'confirmed' ? '<br><a class="small" href="' + E(b.meeting_link) + '" target="_blank" rel="noopener">Join the lesson ↗</a>' : '') +
          '</span><span class="pill ' + st[1] + '">' + E(st[0]) + '</span></div>';
      }).join('') + '</section>';
    });
  }

  (S.on ? S.me().catch(function () { return null; }) : Promise.resolve(null)).then(function (m) { me = m && m.user ? m : null; form(); }, function () { form(); });
})();
