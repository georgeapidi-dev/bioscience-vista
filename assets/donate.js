/* Learnova · donations by PayPal (USD) or M-Pesa (KES). Anyone can give, signed in or not. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  if (!S.on) return S.notReady(app);
  S.db.from('app_settings').select('k,v').then(function (r) {
    var set = {}; (r.data || []).forEach(function (x) { set[x.k] = x.v; });
    draw(set);
  });
  function draw(set) {
    var note = set.charity_note || '70% of every subscription and donation goes to charity.';
    app.innerHTML = '<section class="panel tint"><h2>💚 ' + E(note) + '</h2><p>Your gift keeps Learnova\'s lessons, quizzes and simulations growing for students everywhere, and most of it goes straight to charity.</p></section>' +
      '<section class="panel grp"><label class="f">Your name (optional)<input id="dn" maxlength="80" autocomplete="name"></label><label class="f">Message (optional)<input id="dm" maxlength="300"></label></section>' +
      '<div class="two"><section class="panel grp"><h3>💳 PayPal or card (US dollars)</h3><div class="cta" id="amts">' + [5, 10, 25, 50, 100].map(function (a, i) { return '<button type="button" class="btn sm' + (i === 1 ? ' main' : '') + '" data-a="' + a + '">$' + a + '</button>'; }).join('') + '</div>' +
      '<label class="f">Or another amount (USD)<input id="da" type="number" min="1" max="5000" step="1" value="10" inputmode="decimal"></label><div id="ppbox"><p class="small muted">Loading PayPal…</p></div><p class="msg" id="ppm" role="alert"></p></section>' +
      '<section class="panel grp"><h3>📱 M-Pesa (Kenya shillings)</h3>' + (set.mpesa_number ?
        '<ol class="small"><li>Open <b>M-Pesa → Send Money</b>.</li><li>Send any amount to <b>' + E(set.mpesa_number) + '</b>' + (set.mpesa_name ? ' (' + E(set.mpesa_name) + ')' : '') + '.</li><li>Type the details below so we can thank you.</li></ol>' +
        '<form id="mpf" class="grp"><label class="f">Amount sent (KES)<input id="mk" type="number" min="10" required inputmode="numeric"></label><label class="f">M-Pesa code<input id="mc" required maxlength="12" placeholder="e.g. SKL4ABC12D" autocapitalize="characters" style="text-transform:uppercase"></label>' +
        '<label class="f">Phone number you paid from<input id="mph" required inputmode="tel"></label><button class="btn main" type="submit">Send</button><p class="msg" id="mpm" role="alert"></p></form>' : '<p class="small muted">M-Pesa is not set up yet.</p>') + '</section></div>';
    var amt = app.querySelector('#da');
    app.querySelectorAll('[data-a]').forEach(function (b) { b.onclick = function () { amt.value = b.getAttribute('data-a'); app.querySelectorAll('[data-a]').forEach(function (x) { x.classList.toggle('main', x === b); }); }; });
    var f = app.querySelector('#mpf');
    if (f) f.onsubmit = function (e) { e.preventDefault(); var m = app.querySelector('#mpm'), b = f.querySelector('button'); b.disabled = true; m.className = 'msg'; m.textContent = 'Sending…';
      S.db.rpc('submit_mpesa_donation', { amt: +app.querySelector('#mk').value, mpesa: app.querySelector('#mc').value, phone: app.querySelector('#mph').value, donor: app.querySelector('#dn').value, note: app.querySelector('#dm').value }).then(function (r) {
        b.disabled = false; if (r.error) { m.textContent = S.nice(r.error); return; }
        f.innerHTML = '<p class="msg ok">Thank you! We will confirm your donation as soon as we see it on M-Pesa.</p>'; }); };
    if (!set.paypal_client_id) { app.querySelector('#ppbox').innerHTML = '<p class="small muted">PayPal is not set up yet.</p>'; return; }
    var sc = document.createElement('script');
    sc.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(set.paypal_client_id) + '&currency=USD&intent=capture&components=buttons';
    sc.onerror = function () { app.querySelector('#ppbox').innerHTML = '<p class="small muted">PayPal did not load. Check your connection, or give by M-Pesa.</p>'; };
    sc.onload = function () {
      var box = app.querySelector('#ppbox'), m = app.querySelector('#ppm'); box.innerHTML = '';
      window.paypal.Buttons({
        style: { layout: 'vertical', label: 'donate' },
        createOrder: function () { m.className = 'msg'; m.textContent = ''; var a = Math.round(+amt.value);
          if (!(a >= 1 && a <= 5000)) { m.textContent = 'Choose an amount between 1 and 5,000 US dollars.'; throw new Error('amount'); }
          return S.db.functions.invoke('paypal', { body: { action: 'donate', amount: a, name: app.querySelector('#dn').value, note: app.querySelector('#dm').value } }).then(function (r) { var d = r.data; if (r.error || !d || !d.id) throw new Error((d && d.error) || 'Could not start the donation.'); return d.id; }); },
        onApprove: function (d) { m.textContent = 'Confirming…';
          return S.db.functions.invoke('paypal', { body: { action: 'capture_donation', order: d.orderID } }).then(function (r) { var x = r.data || {};
            if (r.error || !x.ok) { m.textContent = x.error || 'The donation was not completed. Please try again.'; return; }
            app.innerHTML = '<section class="panel tint"><h2>💚 Thank you!</h2><p>Your donation was received. ' + E(note) + '</p><a class="btn main" href="/">Back to Learnova</a></section>'; }); },
        onError: function (err) { if (err && err.message === 'amount') return; m.className = 'msg'; m.textContent = 'PayPal could not finish. Please try again.'; }
      }).render(box);
    };
    document.head.appendChild(sc);
  }
})();
