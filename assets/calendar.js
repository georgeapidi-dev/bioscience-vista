/* BioscienceVista month calendar (23 Nov 2026, roadmap phase 2). One component for teachers (inside each class), students (dashboard)
   and parents. BVCAL.month(host, { items: [{ d: Date|string, t: title, href, k: kind, c: colour, sub: small label, st: 'done'|'started'|'todo' }],
   title, empty, note }). Shows a month grid on wide screens and a list of days on phones; ◀ ▶ change month; "Today" returns. */
(function () {
  var C = window.BVCAL = {};
  var ICO = { lesson: '🧪', quiz: '📝', exam: '📝', resource: '📄', sim: '🔬', link: '🔗', task: '✏️', test: '🧾' };
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  var CSS = '<style>.bvc{font-size:.86rem}.bvc-h{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin:0 0 8px}.bvc-h h3{margin:0;font-size:1.05rem}' +
    '.bvc-h button{border:1px solid #cbd5e1;background:#fff;border-radius:9px;padding:5px 10px;font-weight:700;cursor:pointer}.bvc-h button.on{background:#0f1f3d;color:#fff;border-color:#0f1f3d}' +
    '.bvc-g{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}.bvc-wd{font-size:.72rem;font-weight:800;color:#64748b;text-align:center;padding:2px 0}' +
    '.bvc-d{background:#fff;border:1px solid #e2e8f0;border-radius:10px;min-height:92px;padding:4px 5px;overflow:hidden}.bvc-d.out{background:#f8fafc;opacity:.6}.bvc-d.today{border-color:#0d9488;box-shadow:0 0 0 2px #99f6e4 inset}' +
    '.bvc-n{font-size:.75rem;font-weight:800;color:#0f1f3d}.bvc-i{display:block;border-left:3px solid var(--k,#4f46e5);background:#f8fafc;border-radius:6px;padding:2px 5px;margin:3px 0 0;font-size:.74rem;line-height:1.2;color:#0f1f3d;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.bvc-i.done{opacity:.55;text-decoration:line-through}.bvc-i small{color:#64748b}.bvc-more{font-size:.7rem;color:#475569;font-weight:700}' +
    '.bvc-l{display:none}.bvc-l .day{border:1px solid #e2e8f0;border-radius:10px;padding:6px 9px;margin:0 0 6px;background:#fff}.bvc-l .day b{display:block;font-size:.8rem;margin-bottom:2px}.bvc-l .bvc-i{white-space:normal}' +
    '@media (max-width:760px){.bvc-g,.bvc-wd{display:none}.bvc-l{display:block}}</style>';
  C.month = function (host, o) {
    o = o || {}; var items = (o.items || []).filter(function (x) { return x && x.d; }).map(function (x) { var d = x.d instanceof Date ? x.d : new Date(x.d); return isNaN(d) ? null : Object.assign({}, x, { d: d }); }).filter(Boolean);
    var by = {}; items.forEach(function (x) { (by[ymd(x.d)] = by[ymd(x.d)] || []).push(x); });
    var now = new Date(), cur = new Date(now.getFullYear(), now.getMonth(), 1);
    function it(x) { return '<a class="bvc-i' + (x.st === 'done' ? ' done' : '') + '" style="--k:' + E(x.c || '#4f46e5') + '"' + (x.href ? ' href="' + E(x.href) + '"' : '') + ' title="' + E((x.sub ? x.sub + ' · ' : '') + x.t + (x.st === 'done' ? ' (done)' : '')) + '">' + (ICO[x.k] || '📌') + ' ' + E(x.t) + (x.sub ? ' <small>' + E(x.sub) + '</small>' : '') + '</a>'; }
    function draw() {
      var y = cur.getFullYear(), m = cur.getMonth(), first = new Date(y, m, 1), start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
      var cells = [], today = ymd(now), inMonth = 0;
      for (var i = 0; i < 42; i++) { var d = new Date(start); d.setDate(start.getDate() + i); if (i >= 35 && d.getMonth() !== m) break; cells.push(d); }
      var list = [];
      cells.forEach(function (d) { if (d.getMonth() === m && by[ymd(d)]) { inMonth += by[ymd(d)].length; list.push(d); } });
      host.innerHTML = CSS + '<div class="bvc"><div class="bvc-h"><h3>' + E(o.title || '📅 Calendar') + ' · ' + first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) + '</h3>' +
        '<span><button type="button" data-v="-1" aria-label="Previous month">◀</button> <button type="button" data-v="0" class="' + (y === now.getFullYear() && m === now.getMonth() ? 'on' : '') + '">Today</button> <button type="button" data-v="1" aria-label="Next month">▶</button></span></div>' +
        '<div class="bvc-g">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (w) { return '<div class="bvc-wd">' + w + '</div>'; }).join('') +
        cells.map(function (d) { var k = ymd(d), xs = by[k] || [];
          return '<div class="bvc-d' + (d.getMonth() !== m ? ' out' : '') + (k === today ? ' today' : '') + '"><div class="bvc-n">' + d.getDate() + '</div>' + xs.slice(0, 3).map(it).join('') + (xs.length > 3 ? '<div class="bvc-more">+' + (xs.length - 3) + ' more</div>' : '') + '</div>'; }).join('') + '</div>' +
        '<div class="bvc-l">' + (list.length ? list.map(function (d) { return '<div class="day"><b>' + d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' }) + (ymd(d) === today ? ' · today' : '') + '</b>' + by[ymd(d)].map(it).join('') + '</div>'; }).join('') : '') + '</div>' +
        (inMonth ? '' : '<p class="small muted" style="margin-top:8px">' + E(o.empty || 'Nothing due this month.') + '</p>') + (o.note ? '<p class="small muted" style="margin-top:6px">' + o.note + '</p>' : '') + '</div>';
      host.querySelectorAll('[data-v]').forEach(function (b) { b.onclick = function () { var v = +b.getAttribute('data-v'); cur = v ? new Date(cur.getFullYear(), cur.getMonth() + v, 1) : new Date(now.getFullYear(), now.getMonth(), 1); draw(); }; });
    }
    draw();
  };
  C.ICO = ICO;
})();
