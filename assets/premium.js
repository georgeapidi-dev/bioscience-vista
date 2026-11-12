/* Learnova · premium access: pay with PayPal (USD) or M-Pesa (KES). Prices come from the database, never from this page. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  S.guard(app, { allowPending: true, school: true }).then(function (me) {
    if (me.staff) { app.innerHTML = '<section class="panel"><h2>Staff accounts have full access</h2><p>Set prices, the PayPal client ID and the M-Pesa number on the <a href="/admin/">Admin page</a>.</p></section>'; return; }
    return Promise.all([
      S.db.from('plans').select('*').eq('active', true).order('sort'),
      S.db.from('app_settings').select('k,v'),
      S.db.from('payments').select('reference,plan_code,method,amount,currency,status,created_at,mpesa_code').order('created_at', { ascending: false }).limit(20)
    ]).then(function (x) { draw(me, x[0].data || [], (x[1].data || []).reduce(function (o, r) { o[r.k] = r.v; return o; }, {}), x[2].data || []); });
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  function money(a, c) { return c + ' ' + Number(a).toLocaleString(undefined, { minimumFractionDigits: c === 'KES' ? 0 : 2, maximumFractionDigits: 2 }); }
  function draw(me, plans, set, pays) {
    var a = me.access || {}, who = me.school ? 'teacher' : 'student';
    plans = plans.filter(function (p) { return p.audience === who && (+p.amount > 0 || +p.amount_kes > 0); });
    var h = '<section class="panel tint"><h2>' + (a.premium ? '⭐ You have premium access' : 'Premium access') + '</h2><p>' +
      (a.premium ? (a.free ? 'Your access was given free by the admin.' : 'Your access runs until <b>' + E(new Date(a.until).toLocaleDateString()) + '</b>. Paying again adds time on to the end.') :
        (me.school ? 'Premium lets you run your own classes, add Learnova lessons to them and set quizzes for your students.' : 'Premium opens the lessons, quizzes and simulations of the classes your teacher approved you for.')) + '</p>' +
      (set.premium_note ? '<p class="small muted">' + E(set.premium_note) + '</p>' : '') + '</section>';
    if (!plans.length) h += '<p class="emptybox">Prices have not been set yet. Ask your teacher or the admin about access.</p>';
    else h += '<div class="grp"><h3 class="sec-h">1. Choose a plan</h3>' + plans.map(function (p, i) {
      return '<label class="panel" style="display:flex;gap:10px;align-items:center;cursor:pointer"><input type="radio" name="plan" value="' + E(p.code) + '"' + (i ? '' : ' checked') + '><span><b>' + E(p.name) + '</b><br><span class="small">' +
        [+p.amount > 0 ? money(p.amount, p.currency) + ' by PayPal or card' : '', +p.amount_kes > 0 ? money(p.amount_kes, 'KES') + ' by M-Pesa' : ''].filter(Boolean).join(' · ') + '</span></span></label>'; }).join('') +
      '<h3 class="sec-h">2. Pay</h3><div class="two"><section class="panel grp"><h3>💳 PayPal or card (USD)</h3><div id="ppbox"><p class="small muted">Loading PayPal…</p></div><p class="msg" id="ppm" role="alert"></p></section>' +
      '<section class="panel grp"><h3>📱 M-Pesa (KES)</h3><div id="mpbox"></div></section></div></div>';
    if (pays.length) h += '<section class="grp"><h3 class="sec-h">My payments</h3>' + pays.map(function (y) {
      return '<p class="small">' + E(new Date(y.created_at).toLocaleDateString()) + ' · ' + E(y.method === 'mpesa' ? 'M-Pesa ' + (y.mpesa_code || '') : 'PayPal') + ' · ' + E(money(y.amount, y.currency)) + ' · <b>' +
        E({ pending: y.method === 'mpesa' ? 'waiting for the admin to confirm' : 'not finished', paid: 'paid ✓', failed: 'not accepted' }[y.status] || y.status) + '</b></p>'; }).join('') + '</section>';
    app.innerHTML = h;
    if (!plans.length) return;
    var plan = function () { var r = app.querySelector('input[name=plan]:checked'); return plans.filter(function (p) { return p.code === (r && r.value); })[0]; };
    var mp = function () {
      var p = plan(), box = app.querySelector('#mpbox');
      if (!set.mpesa_number) { box.innerHTML = '<p class="small muted">M-Pesa is not set up yet.</p>'; return; }
      if (!p || !(+p.amount_kes > 0)) { box.innerHTML = '<p class="small muted">This plan cannot be paid by M-Pesa.</p>'; return; }
      box.innerHTML = '<ol class="small"><li>On your phone open <b>M-Pesa → Send Money</b>.</li><li>Send <b>' + E(money(p.amount_kes, 'KES')) + '</b> to <b>' + E(set.mpesa_number) + '</b>' + (set.mpesa_name ? ' (' + E(set.mpesa_name) + ')' : '') + '.</li><li>Type the M-Pesa code from the confirmation SMS below.</li></ol>' +
        '<form id="mpf" class="grp"><label class="f">M-Pesa code<input id="mc" required maxlength="12" placeholder="e.g. SKL4ABC12D" autocapitalize="characters" style="text-transform:uppercase"></label>' +
        '<label class="f">Phone number you paid from<input id="mph" required inputmode="tel" placeholder="07…"></label><label class="f">Name on the M-Pesa account<input id="mn" maxlength="80"></label>' +
        '<button class="btn main" type="submit">Send for confirmation</button><p class="msg" id="mpm" role="alert"></p><p class="small muted">The admin checks the payment and your premium starts as soon as it is confirmed, usually the same day.</p></form>';
      box.querySelector('#mpf').onsubmit = function (e) { e.preventDefault(); var m = box.querySelector('#mpm'), b = this.querySelector('button'); b.disabled = true; m.className = 'msg'; m.textContent = 'Sending…';
        S.db.rpc('submit_mpesa', { plan_id: p.code, mpesa: box.querySelector('#mc').value, phone: box.querySelector('#mph').value, payer: box.querySelector('#mn').value }).then(function (r) {
          b.disabled = false; if (r.error) { m.textContent = S.nice(r.error); return; }
          m.className = 'msg ok'; m.textContent = 'Received. You will get premium access as soon as the admin confirms it.'; setTimeout(function () { location.reload(); }, 2500); }); };
    };
    app.querySelectorAll('input[name=plan]').forEach(function (r) { r.onchange = function () { mp(); pp(); }; });
    mp();
    // PayPal Smart Buttons: the order is created and captured by the server (supabase/functions/paypal), so the price cannot be changed here
    var ppReady = false;
    function pp() {
      var p = plan(), box = app.querySelector('#ppbox'), m = app.querySelector('#ppm');
      if (!set.paypal_client_id) { box.innerHTML = '<p class="small muted">PayPal is not set up yet.</p>'; return; }
      if (!p || !(+p.amount > 0)) { box.innerHTML = '<p class="small muted">This plan cannot be paid by PayPal.</p>'; return; }
      if (!ppReady) return;
      box.innerHTML = '';
      window.paypal.Buttons({
        style: { layout: 'vertical', label: 'pay' },
        createOrder: function () { m.className = 'msg'; m.textContent = '';
          return S.db.functions.invoke('paypal', { body: { action: 'create', plan: p.code } }).then(function (r) { var d = r.data; if (r.error || !d || !d.id) throw new Error((d && d.error) || 'Could not start the payment.'); return d.id; }); },
        onApprove: function (d) { m.textContent = 'Confirming your payment…';
          return S.db.functions.invoke('paypal', { body: { action: 'capture', order: d.orderID } }).then(function (r) { var x = r.data || {};
            if (r.error || !x.ok) { m.textContent = x.error || 'The payment was not completed. You have not been charged twice; try again or contact the admin.'; return; }
            m.className = 'msg ok'; m.textContent = 'Payment received. Premium is on. Opening your dashboard…'; setTimeout(function () { location.href = me.school ? '/teach/' : '/dashboard/'; }, 1500); }); },
        onError: function (err) { m.className = 'msg'; m.textContent = (err && err.message) || 'PayPal could not finish. Try again.'; }
      }).render(box);
    }
    if (set.paypal_client_id) {
      var sc = document.createElement('script');
      sc.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(set.paypal_client_id) + '&currency=USD&intent=capture&components=buttons';
      sc.onload = function () { ppReady = true; pp(); };
      sc.onerror = function () { app.querySelector('#ppbox').innerHTML = '<p class="small muted">PayPal did not load. Check your connection, or pay by M-Pesa.</p>'; };
      document.head.appendChild(sc);
    } else pp();
  }
})();
