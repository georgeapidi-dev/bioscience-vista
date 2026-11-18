/* BioscienceVista · premium access, short and simple: choose a plan, then pay by M-Pesa or card (Paystack, KES).
   Prices come from the database, never from this page. Paystack checkouts (supabase/functions/paystack) and PayPal orders are created and captured by the server (supabase/functions/paypal);
   M-Pesa payments are confirmed by the admin (Admin → Payments). */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  S.guard(app, { allowPending: true, school: true }).then(function (me) {
    if (me.staff) { app.innerHTML = '<section class="panel"><h2>Staff accounts have full access</h2><p>Set prices, the PayPal client ID and the M-Pesa number on the <a href="/admin/">Admin page</a>.</p></section>'; return; }
    return Promise.all([
      S.db.from('plans').select('*').eq('active', true).order('sort'),
      S.db.from('app_settings').select('k,v'),
      S.db.from('payments').select('reference,plan_code,method,amount,currency,status,created_at,mpesa_code').order('created_at', { ascending: false }).limit(10)
    ]).then(function (x) { draw(me, x[0].data || [], (x[1].data || []).reduce(function (o, r) { o[r.k] = r.v; return o; }, {}), x[2].data || []); });
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  function money(a, c) { return c + ' ' + Number(a).toLocaleString(undefined, { minimumFractionDigits: c === 'KES' ? 0 : 2, maximumFractionDigits: 2 }); }
  function draw(me, plans, set, pays) {
    var a = me.access || {}, who = me.school ? 'teacher' : 'student', way = 'mpesa', cur = 0;
    plans = plans.filter(function (p) { return p.audience === who && (+p.amount > 0 || +p.amount_kes > 0); });
    var head = '<section class="panel tint"><h2 style="margin:0 0 4px">' + (a.premium ? '⭐ You have premium' : '⭐ Get premium') + '</h2><p class="small" style="margin:0">' +
      (a.premium ? (a.free ? 'Your access was given free by the admin.' : 'Active until <b>' + E(new Date(a.until).toLocaleDateString()) + '</b>. Paying again adds time.') :
        (me.school ? 'Run your own classes with BioscienceVista lessons and quizzes.' : 'Opens the lessons, quizzes and simulations of your class.')) + ' 💚 ' + E(set.charity_note || '70% goes to charity.') + '</p></section>';
    if (!plans.length) { app.innerHTML = head + '<p class="emptybox">Prices have not been set yet. Ask the admin.</p>'; return; }
    var hist = pays.length ? '<details class="panel" style="margin-top:12px"><summary class="small" style="cursor:pointer"><b>My payments</b> (' + pays.length + ')</summary>' + pays.map(function (y) {
      return '<p class="small" style="margin:4px 0">' + E(new Date(y.created_at).toLocaleDateString()) + ' · ' + E(y.method === 'mpesa' ? 'M-Pesa ' + (y.mpesa_code || '') : y.method === 'paypal' ? 'PayPal' : y.method === 'paystack' ? 'Card' : y.method) + ' · ' + E(money(y.amount, y.currency)) + ' · <b>' +
        E({ pending: (y.method === 'paypal' || y.method === 'paystack') ? 'not finished' : 'waiting for confirmation', paid: 'paid ✓', failed: 'not accepted' }[y.status] || y.status) + '</b></p>'; }).join('') + '</details>' : '';
    app.innerHTML = head +
      '<section class="panel grp"><h3 style="margin:0 0 8px">1 · Choose a plan</h3><div class="cta" id="plans" role="radiogroup">' + plans.map(function (p, i) {
        return '<button type="button" class="btn' + (i ? '' : ' main') + '" role="radio" aria-checked="' + (i ? 'false' : 'true') + '" data-i="' + i + '" style="display:flex;flex-direction:column;align-items:flex-start;gap:2px"><b>' + E(p.name.replace(/^(Student|Teacher) · /, '')) + '</b><span class="small">' +
          [+p.amount_kes > 0 ? money(p.amount_kes, 'KES') : '', +p.amount > 0 ? money(p.amount, p.currency || 'USD') : ''].filter(Boolean).join(' · ') + '</span></button>'; }).join('') + '</div>' +
      '<h3 style="margin:14px 0 8px">2 · Pay</h3><div class="cta" role="tablist"><button type="button" class="btn main" data-w="mpesa">📱 M-Pesa</button>' + (set.paystack_on === 'yes' ? '<button type="button" class="btn" data-w="card">💳 Card</button>' : set.paypal_client_id ? '<button type="button" class="btn" data-w="paypal">💳 PayPal or card</button>' : '') + '</div><div id="pay" style="margin-top:10px"></div></section>' + hist;
    var plan = function () { return plans[cur]; };
    var show = function () {
      app.querySelectorAll('[data-w]').forEach(function (b) { b.classList.toggle('main', b.getAttribute('data-w') === way); });
      (way === 'paypal' ? paypal : way === 'card' ? card : mpesa)(app.querySelector('#pay'), plan());
    };
    app.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { cur = +b.getAttribute('data-i');
      app.querySelectorAll('[data-i]').forEach(function (x) { var on = x === b; x.classList.toggle('main', on); x.setAttribute('aria-checked', on); }); show(); }; });
    app.querySelectorAll('[data-w]').forEach(function (b) { b.onclick = function () { way = b.getAttribute('data-w'); show(); }; });
    show();
    // back from Paystack checkout: ?reference=LV-… → check the payment with the server
    var back = new URLSearchParams(location.search).get('reference');
    if (back && /^LV-[a-f0-9]{32}$/.test(back)) {
      var bx = app.querySelector('#pay'); way = 'card'; app.querySelectorAll('[data-w]').forEach(function (b) { b.classList.toggle('main', b.getAttribute('data-w') === way); });
      bx.innerHTML = '<p class="msg" role="alert">Checking your card payment…</p>';
      S.db.functions.invoke('paystack', { body: { action: 'verify', reference: back } }).then(function (r) { var x = r.data || {}; if (typeof x === 'string') { try { x = JSON.parse(x); } catch (e) { x = {}; } }
        history.replaceState(null, '', '/premium/');
        if (r.error || !x.ok) { bx.innerHTML = '<p class="msg" role="alert">' + E(x.error || 'The payment was not completed. You were not charged for premium. Try again or pay by M-Pesa.') + '</p>'; return; }
        bx.innerHTML = '<p class="msg ok" role="alert">Payment received ✓ Premium is on.</p>'; setTimeout(function () { location.href = me.school ? '/teach/' : '/dashboard/'; }, 1800); });
    }

    // Paystack: card (Visa, Mastercard), M-Pesa or Apple Pay on Paystack's own secure page; the server sets the price and confirms it
    function card(box, p) {
      if (!(+p.amount_kes > 0)) { box.innerHTML = '<p class="small muted">Card payment is not available for this plan. Use M-Pesa.</p>'; return; }
      box.innerHTML = '<p style="margin:0 0 8px">Pay <b>' + E(money(p.amount_kes, 'KES')) + '</b> with a Visa or Mastercard (any country) on Paystack\'s secure page. Premium starts straight away.</p>' +
        '<button type="button" class="btn main" id="psb">💳 Pay ' + E(money(p.amount_kes, 'KES')) + '</button><p class="msg" id="psm" role="alert"></p>' +
        '<p class="small muted" style="margin:4px 0 0">Cards from outside Kenya are charged in shillings; your bank converts it.</p>';
      box.querySelector('#psb').onclick = function () { var b = this, m = box.querySelector('#psm'); b.disabled = true; m.className = 'msg'; m.textContent = 'Opening secure checkout…';
        S.db.functions.invoke('paystack', { body: { action: 'init', plan: p.code } }).then(function (r) { var d = r.data || {}; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = {}; } }
          if (r.error || !d.url) { b.disabled = false; m.textContent = d.error || 'Card payment could not start. Try again or pay by M-Pesa.'; return; }
          location.href = d.url; }); };
    }

    function mpesa(box, p) {
      if (!set.mpesa_number || !(+p.amount_kes > 0)) { box.innerHTML = '<p class="small muted">M-Pesa is not available for this plan.</p>'; return; }
      box.innerHTML = '<p style="margin:0 0 8px">Send <b>' + E(money(p.amount_kes, 'KES')) + '</b> to <b>' + E(set.mpesa_number) + '</b>' + (set.mpesa_name ? ' (' + E(set.mpesa_name) + ')' : '') + ', then enter the code from your M-Pesa message:</p>' +
        '<form id="mpf" class="two" style="align-items:end"><label class="f">M-Pesa code<input id="mc" required maxlength="12" placeholder="e.g. SKL4ABC12D" autocapitalize="characters" style="text-transform:uppercase"></label>' +
        '<label class="f">Phone you paid from<input id="mph" required inputmode="tel" placeholder="07…"></label><button class="btn main" type="submit">✓ Confirm payment</button></form><p class="msg" id="mpm" role="alert"></p>' +
        '<p class="small muted" style="margin:4px 0 0">Premium starts as soon as the admin sees the payment, usually the same day.</p>';
      box.querySelector('#mpf').onsubmit = function (e) { e.preventDefault(); var m = box.querySelector('#mpm'), b = this.querySelector('button'); b.disabled = true; m.className = 'msg'; m.textContent = 'Sending…';
        S.db.rpc('submit_mpesa', { plan_id: p.code, mpesa: box.querySelector('#mc').value, phone: box.querySelector('#mph').value, payer: null }).then(function (r) {
          b.disabled = false; if (r.error) { m.textContent = S.nice(r.error); return; }
          m.className = 'msg ok'; m.textContent = 'Received ✓ Your premium starts as soon as the admin confirms it.'; setTimeout(function () { location.reload(); }, 2500); }); };
    }

    // PayPal Smart Buttons: the order is created and captured by the server, so the price cannot be changed here
    var sdk = null, lastRender = null;
    function paypal(box, p) {
      if (!set.paypal_client_id || !(+p.amount > 0)) { box.innerHTML = '<p class="small muted">PayPal is not available for this plan. Use M-Pesa.</p>'; return; }
      box.innerHTML = '<p style="margin:0 0 8px">Pay <b>' + E(money(p.amount, p.currency || 'USD')) + '</b> with PayPal or a debit/credit card. Premium starts straight away.</p><div id="ppb" style="max-width:420px"><p class="small muted">Loading PayPal…</p></div><p class="msg" id="ppm" role="alert"></p>';
      var m = box.querySelector('#ppm'), slot = box.querySelector('#ppb');
      var render = function () {
        if (!window.paypal || !slot.isConnected) return; slot.innerHTML = '';
        window.paypal.Buttons({
          style: { layout: 'vertical', label: 'pay' },
          createOrder: function () { m.className = 'msg'; m.textContent = '';
            return S.db.functions.invoke('paypal', { body: { action: 'create', plan: p.code } }).then(function (r) { var d = r.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
              if (r.error || !d || !d.id) throw new Error((d && d.error) || 'PayPal could not start the payment.'); return d.id; }); },
          onApprove: function (d) { m.textContent = 'Confirming your payment…';
            return S.db.functions.invoke('paypal', { body: { action: 'capture', order: d.orderID } }).then(function (r) { var x = r.data || {}; if (typeof x === 'string') { try { x = JSON.parse(x); } catch (e) { x = {}; } }
              if (r.error || !x.ok) { m.textContent = x.error || 'The payment was not completed. You have not been charged twice; try again or pay by M-Pesa.'; return; }
              m.className = 'msg ok'; m.textContent = 'Payment received ✓ Premium is on.'; setTimeout(function () { location.href = me.school ? '/teach/' : '/dashboard/'; }, 1500); }); },
          onError: function () { m.className = 'msg'; m.textContent = 'PayPal is not working right now. Please pay by M-Pesa, or try again later.'; }
        }).render(slot);
      };
      lastRender = render;
      if (window.paypal) return render();
      if (sdk) return; sdk = document.createElement('script');
      sdk.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(set.paypal_client_id) + '&currency=USD&intent=capture&components=buttons';
      sdk.onload = function () { if (lastRender) lastRender(); };
      sdk.onerror = function () { slot.innerHTML = '<p class="small muted">PayPal did not load. Please pay by M-Pesa.</p>'; };
      document.head.appendChild(sdk);
    }
  }
})();
