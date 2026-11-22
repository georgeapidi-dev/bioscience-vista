/* IB Biology lesson header: topic code, lesson n of N, duration, SL/HL and teaching hours · by BioscienceVista (22 Nov 2026)
   Data from window.BV_IBL (written by build_site.py from data/ib_bio_plan.json). */
(function () {
  var d = window.BV_IBL; if (!d) return;
  function E(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function go() {
    if (document.getElementById('ib-badge')) return;
    var hl = d.level === 'HL', b = document.createElement('div'); b.id = 'ib-badge';
    b.setAttribute('style', 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:10px auto;max-width:1100px;padding:8px 12px;border-radius:14px;background:#F0F9FF;border:1px solid #BAE6FD;font:600 .88rem/1.3 system-ui,Arial,sans-serif;color:#0C4A6E');
    var pill = function (t, bg, fg) { return '<span style="padding:3px 10px;border-radius:999px;background:' + bg + ';color:' + fg + '">' + t + '</span>'; };
    b.innerHTML = pill('IB Biology ' + E(d.code), '#0369A1', '#fff') + pill('Lesson ' + d.n + ' of ' + d.of, '#E0F2FE', '#075985') + pill('⏱ ' + d.minutes + ' min' + (d.minutes > 75 ? ' · 2 sessions' : ''), '#E0F2FE', '#075985') +
      (hl ? pill('HL only', '#FDE68A', '#78350F') : pill('SL &amp; HL', '#DCFCE7', '#166534')) + pill(E(d.hour) + ' of ' + (hl || d.hl_only ? d.hl_h + ' h (HL)' : d.sl_h + ' h (SL)'), '#F1F5F9', '#334155') +
      '<span style="color:#475569;font-weight:500">' + E(d.range) + '</span><a href="/ib-biology-plan/" style="margin-left:auto;color:#0369A1">📅 Course plan</a>';
    var h = document.querySelector('main h1, h1'), host = h && h.closest('header, .hero, section') || h;
    if (host) {   // the lesson's own header gives its old length: show the planned one
      var w = document.createTreeWalker(host, NodeFilter.SHOW_TEXT), n;
      while ((n = w.nextNode())) if (/\b\d+ minutes\b/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/\b\d+ minutes\b/, d.minutes + ' minutes');
    }
    if (host && host.parentNode) host.parentNode.insertBefore(b, host); else document.body.insertBefore(b, document.body.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
