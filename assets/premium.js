/* BioscienceVista · premium access: pay with PayPal (USD) or M-Pesa (KES). Prices come from the database, never from this page. */
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
  var PYR = false;   // Payoneer replaces PayPal when the admin has saved a Payoneer link
  function draw(me, plans, set, pays) {
    PYR = !!(set.payoneer_link || Object.keys(set).some(function (k) { return /^payoneer_/.test(k) && set[k]; }));
    var a = me.access || {}, who = me.school ? 'teacher' : 'student';
    plans = plans.filter(function (p) { return p.audience === who && (+p.amount > 0 || +p.amount_kes > 0); });
    var h = '<section class="panel tint"><h2>' + (a.premium ? '⭐ You have premium access' : 'Premium access') + '</h2><p>' +
      (a.premium ? (a.free ? 'Your access was given free by the admin.' : 'Your access runs until <b>' + E(new Date(a.until).toLocaleDateString()) + '</b>. Paying again adds time on to the end.') :
        (me.school ? 'Premium lets you run your own classes, add BioscienceVista lessons to them and set quizzes for your students.' : 'Premium opens the lessons, quizzes and simulations of the classes your teacher approved you for.')) + '</p>' +
      '<p class="small">💚 ' + E(set.charity_note || '70% of every subscription and donation goes to charity.') + ' <a href="/donate/">Donate</a></p>' +
      (set.premium_note ? '<p class="small muted">' + E(set.premium_note) + '</p>' : '') + '</section>';
    if (!plans.length) h += '<p class="emptybox">Prices have not been set yet. Ask your teacher or the admin about access.</p>';
    else h += '<div class="grp"><h3 class="sec-h">1. Choose a plan</h3>' + plans.map(function (p, i) {
      return '<label class="panel" style="display:flex;gap:10px;align-items:center;cursor:pointer"><input type="radio" name="plan" value="' + E(p.code) + '"' + (i ? '' : ' checked') + '><span><b>' + E(p.name) + '</b><br><span class="small">' +
        [+p.amount > 0 ? money(p.amount, p.currency) + (PYR ? ' by card or bank (Payoneer)' : ' by PayPal or card') : '', +p.amount_kes > 0 ? money(p.amount_kes, 'KES') + ' by M-Pesa' : ''].filter(Boolean).join(' · ') + '</span></span></label>'; }).join('') +
      '<h3 class="sec-h">2. Pay</h3><div class="two">' + (PYR ? '<section class="panel grp"><h3>💳 Card or bank (Payoneer, USD)</h3><div id="pybox"></div></section>' : '<section class="panel grp"><h3>💳 PayPal or card (USD)</h3><div id="ppbox"><p class="small muted">Loading PayPal…</p></div><p class="msg" id="ppm" role="alert"></p></section>') +
      '<section class="panel grp"><h3>📱 M-Pesa (KES)</h3><div id="mpbox"></div></section></div>' +
      (set.paypalme || set.bank_details || set.pay_link ? '<section class="panel grp"><h3>🔁 Other ways to pay</h3><p class="small muted">If PayPal checkout does not work for you, use one of these. Then type the transaction ID from your receipt so the admin can confirm it.</p><div id="otbox"></div></section>' : '') + '</div>';
    if (pays.length) h += '<section class="grp"><h3 class="sec-h">My payments</h3>' + pays.map(function (y) {
      return '<p class="small">' + E(new Date(y.created_at).toLocaleDateString()) + ' · ' + E(({ mpesa: 'M-Pesa ', payoneer: 'Payoneer ', paypalme: 'PayPal.Me ', bank: 'Bank transfer ', link: (set.pay_link_name || 'Online payment') + ' ' }[y.method] || 'PayPal ') + (y.method === 'paypal' ? '' : (y.mpesa_code || ''))) + ' · ' + E(money(y.amount, y.currency)) + ' · <b>' +
        E({ pending: y.method === 'paypal' ? 'not finished' : 'waiting for the admin to confirm', paid: 'paid ✓', failed: 'not accepted' }[y.status] || y.status) + '</b></p>'; }).join('') + '</section>';
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

    // other ways to pay (migration 056): PayPal.Me, bank transfer and the admin's own payment link; the admin confirms each one, like M-Pesa
    var ot = function () {
      var box = app.querySelector('#otbox'); if (!box) return;
      var p = plan(); if (!p) { box.innerHTML = ''; return; }
      var usd = +p.amount > 0 ? money(p.amount, p.currency || 'USD') : '', kes = +p.amount_kes > 0 ? money(p.amount_kes, 'KES') : '';
      var ways = [];
      if (set.paypalme && +p.amount > 0) { var u = /^https?:/i.test(set.paypalme) ? set.paypalme.replace(/\/+$/, '') : 'https://paypal.me/' + set.paypalme.replace(/^@/, '');
        ways.push(['paypalme', '💳 PayPal.Me', '<p class="small">Send <b>' + E(usd) + '</b> with PayPal (balance or card): <a class="btn main sm" href="' + E(u + '/' + (+p.amount).toFixed(2) + 'USD') + '" target="_blank" rel="noopener">Open PayPal.Me →</a></p><p class="small muted">In the note, write your name and "' + E(p.name) + '". Then copy the <b>transaction ID</b> from the PayPal receipt.</p>']); }
      if (set.bank_details) ways.push(['bank', '🏦 Bank transfer', '<p class="small">Pay <b>' + E(kes || usd) + '</b> to:</p><pre class="small" style="white-space:pre-wrap;background:var(--surface);padding:8px;border-radius:8px">' + E(set.bank_details) + '</pre><p class="small muted">Use your name as the reference, then type the bank reference below.</p>']);
      if (set.pay_link && +p.amount > 0) ways.push(['link', '🌐 ' + (set.pay_link_name || 'Pay online'), '<p class="small">Pay <b>' + E(usd) + '</b> (card or mobile money): <a class="btn main sm" href="' + E(set.pay_link) + '" target="_blank" rel="noopener">Open the payment page →</a></p><p class="small muted">Then type the receipt or transaction number below.</p>']);
      if (!ways.length) { box.innerHTML = '<p class="small muted">No other way to pay is set for this plan.</p>'; return; }
      box.innerHTML = '<div class="cta" role="tablist">' + ways.map(function (w, i) { return '<button type="button" class="btn sm' + (i ? '' : ' main') + '" data-way="' + w[0] + '">' + E(w[1]) + '</button>'; }).join('') + '</div><div id="otw"></div>' +
        '<form id="otf" class="grp"><label class="f">Transaction ID or reference<input id="oc" required maxlength="40" autocapitalize="characters"></label><label class="f">Name on the payment<input id="on" maxlength="80"></label>' +
        '<button class="btn main" type="submit">Send for confirmation</button><p class="msg" id="otm" role="alert"></p><p class="small muted">The admin checks the payment and your premium starts as soon as it is confirmed, usually the same day.</p></form>';
      var cur = ways[0][0], show = function () { box.querySelector('#otw').innerHTML = ways.filter(function (w) { return w[0] === cur; })[0][2];
        box.querySelectorAll('[data-way]').forEach(function (b) { b.classList.toggle('main', b.getAttribute('data-way') === cur); }); };
      box.querySelectorAll('[data-way]').forEach(function (b) { b.onclick = function () { cur = b.getAttribute('data-way'); show(); }; }); show();
      box.querySelector('#otf').onsubmit = function (e) { e.preventDefault(); var m = box.querySelector('#otm'), b = this.querySelector('button'); b.disabled = true; m.className = 'msg'; m.textContent = 'Sending…';
        S.db.rpc('submit_manual_payment', { plan_id: p.code, how: cur, code: box.querySelector('#oc').value, payer: box.querySelector('#on').value }).then(function (r) {
          b.disabled = false; if (r.error) { m.textContent = /submit_manual_payment|schema cache/i.test(r.error.message || '') ? 'This way of paying is being set up. Please pay by M-Pesa for now, or try again later.' : S.nice(r.error); return; }
          m.className = 'msg ok'; m.textContent = 'Received. You will get premium access as soon as the admin confirms it.'; setTimeout(function () { location.reload(); }, 2500); }); };
    };

    // Payoneer (migration 056): the payer pays the admin's Payoneer payment link, then types the transaction ID; the admin confirms it
    var py = function () {
      var box = app.querySelector('#pybox'); if (!box) return;
      var p = plan(); if (!p || !(+p.amount > 0)) { box.innerHTML = '<p class="small muted">This plan cannot be paid with Payoneer.</p>'; return; }
      var link = set['payoneer_' + p.code] || set.payoneer_link;
      if (!link) { box.innerHTML = '<p class="small muted">Payoneer is not set up for this plan yet. Please pay by M-Pesa.</p>'; return; }
      box.innerHTML = '<ol class="small"><li>Press the button and pay <b>' + E(money(p.amount, p.currency || 'USD')) + '</b> by card or bank transfer on Payoneer.</li><li>In the note, write your name and "' + E(p.name) + '".</li><li>Copy the <b>transaction or receipt ID</b> and type it below.</li></ol>' +
        '<p><a class="btn main" href="' + E(link) + '" target="_blank" rel="noopener">Pay with Payoneer →</a></p>' +
        '<form id="pyf" class="grp"><label class="f">Payoneer transaction or receipt ID<input id="pyc" required maxlength="40" autocapitalize="characters"></label><label class="f">Name on the card or account<input id="pyn" maxlength="80"></label>' +
        '<button class="btn main" type="submit">Send for confirmation</button><p class="msg" id="pym" role="alert"></p><p class="small muted">The admin checks the payment in Payoneer and your premium starts as soon as it is confirmed, usually the same day.</p></form>';
      box.querySelector('#pyf').onsubmit = function (e) { e.preventDefault(); var m = box.querySelector('#pym'), b = this.querySelector('button'); b.disabled = true; m.className = 'msg'; m.textContent = 'Sending…';
        S.db.rpc('submit_manual_payment', { plan_id: p.code, how: 'payoneer', code: box.querySelector('#pyc').value, payer: box.querySelector('#pyn').value }).then(function (r) {
          b.disabled = false; if (r.error) { m.textContent = /submit_manual_payment|schema cache/i.test(r.error.message || '') ? 'Payoneer payments are being set up. Please pay by M-Pesa for now.' : S.nice(r.error); return; }
          m.className = 'msg ok'; m.textContent = 'Received. You will get premium access as soon as the admin confirms it.'; setTimeout(function () { location.reload(); }, 2500); }); };
    };
    app.querySelectorAll('input[name=plan]').forEach(function (r) { r.onchange = function () { mp(); if (PYR) py(); else pp(); ot(); }; });
    mp(); ot(); if (PYR) { py(); return; }
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
      sc.onerror = function () { app.querySelector('#ppbox').innerHTML = '<p class="small muted">PayPal did not load. Pay by M-Pesa or one of the other ways below.</p>'; };
      document.head.appendChild(sc);
    } else pp();
  }
})();
