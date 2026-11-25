/* VistaEd · media for questions: pictures, video, audio (upload or record), graphs from data, drawn diagrams · by George Apidi
   BVM.editor(host, list, onChange, {uid}) shows the media of one question with buttons to add more.
   Files go to the public storage bucket "question-media" in the person's own folder (migration 039).
   Pictures and drawings fall back to a small embedded picture if the bucket is not there yet. */
(function () {
  var S = window.BVS, T = window.BVT, E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var BUCKET = 'question-media', MAXMB = 25;
  var TYPES = [['image', '🖼️', 'Picture'], ['video', '🎬', 'Video'], ['audio', '🔊', 'Audio'], ['graph', '📈', 'Graph'], ['drawing', '✏️', 'Draw a diagram']];
  var css = document.createElement('style');
  css.textContent = '.bvm{display:flex;flex-direction:column;gap:8px}.bvm-add{display:flex;flex-wrap:wrap;gap:6px}.bvm-add button{border:1px solid var(--line,#d6dbe4);background:var(--card,#fff);border-radius:999px;padding:6px 12px;font:inherit;font-size:.9rem;cursor:pointer}.bvm-add button:hover{border-color:#7c3aed;background:#f5f3ff}' +
    '.bvm-it{display:flex;gap:10px;align-items:center;border:1px solid var(--line,#e2e8f0);border-radius:12px;padding:6px 8px;background:var(--card,#fff)}.bvm-it .th{width:72px;height:48px;border-radius:8px;background:#f1f5f9 center/cover no-repeat;display:grid;place-items:center;font-size:1.5rem;flex:none;overflow:hidden}.bvm-it .th svg{width:72px;height:48px}.bvm-it .tx{flex:1;min-width:0;font-size:.88rem}.bvm-it .tx b{display:block}.bvm-it .tx span{color:var(--muted,#64748b);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}.bvm-it button{border:0;background:none;cursor:pointer;font-size:1rem;padding:4px 6px;border-radius:6px}.bvm-it button:hover{background:#f1f5f9}' +
    '.bvm-ov{position:fixed;inset:0;z-index:2100;background:rgba(15,23,42,.6);display:grid;place-items:start center;overflow:auto;padding:24px 12px}.bvm-ov>div{background:var(--bg,#fff);border-radius:18px;max-width:820px;width:100%;padding:18px 20px;box-shadow:0 20px 60px rgba(0,0,0,.35)}.bvm-ov h2{margin:0 0 10px}.bvm-ov label{display:block;margin:8px 0}.bvm-ov label>span{display:block;font-weight:700;font-size:.9rem;margin-bottom:4px}.bvm-ov input[type=text],.bvm-ov input[type=url],.bvm-ov input[type=number],.bvm-ov select,.bvm-ov textarea{width:100%;box-sizing:border-box}.bvm-row{display:flex;gap:10px;flex-wrap:wrap}.bvm-row>*{flex:1;min-width:160px}.bvm-tabs{display:flex;gap:6px;margin:6px 0 10px}.bvm-tabs button{border:1px solid var(--line,#d6dbe4);background:var(--card,#fff);border-radius:999px;padding:5px 12px;cursor:pointer;font:inherit}.bvm-tabs button[aria-pressed=true]{background:#4f46e5;color:#fff;border-color:#4f46e5}.bvm-pv{margin:10px 0;padding:10px;border:1px dashed #c7d2fe;border-radius:12px;background:#f8fafc}.bvm-rec{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.bvm-dot{width:12px;height:12px;border-radius:50%;background:#dc2626;animation:bvmp 1s infinite}@keyframes bvmp{50%{opacity:.25}}.bvm-msg{color:#b91c1c;font-weight:600;min-height:1.2em}.bvm-drop{display:grid;gap:2px;place-items:center;text-align:center;border:2px dashed #a5b4fc;border-radius:14px;padding:14px;background:#f8faff;cursor:pointer;color:#312e81}.bvm-drop:hover,.bvm-drop:focus-visible,.bvm-drop.on{background:#eef2ff;border-color:#4f46e5;outline:none}.bvm-pf{display:grid;gap:6px}.bvm-pfimg{max-width:100%;max-height:220px;object-fit:contain;border-radius:10px;border:1px solid #e2e8f0;background:#fff;justify-self:start}.bvm-pfacts{display:flex;gap:6px;flex-wrap:wrap}';
  document.head.appendChild(css);

  function label(m) { return m.t === 'graph' ? (m.title || (m.y || 'y') + ' against ' + (m.x || 'x')) : m.cap || (m.t === 'video' && T.ytId(m.src) ? 'YouTube video' : String(m.src || '').split('/').pop().slice(0, 50)); }
  function thumb(m) {
    if ((m.t === 'image' || m.t === 'drawing') && m.src) return '<span class="th" style="background-image:url(\'' + E(m.src).replace(/'/g, '%27') + '\')"></span>';
    if (m.t === 'video' && T.ytId(m.src)) return '<span class="th" style="background-image:url(\'https://i.ytimg.com/vi/' + T.ytId(m.src) + '/mqdefault.jpg\')"></span>';
    if (m.t === 'graph') return '<span class="th">' + T.graphSvg(m).replace(/<text[^>]*>[^<]*<\/text>/g, '') + '</span>';
    return '<span class="th">' + ((TYPES.filter(function (t) { return t[0] === m.t; })[0] || [])[1] || '📎') + '</span>';
  }

  /* ---------------------------------------------------------------- uploads */
  function ext(type) { return ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp', 'image/svg+xml': '.svg', 'audio/mpeg': '.mp3', 'audio/mp4': '.m4a', 'audio/x-m4a': '.m4a', 'audio/ogg': '.ogg', 'audio/wav': '.wav', 'audio/webm': '.webm', 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov' })[type] || ''; }
  function upload(blob, uid) {
    var type = String(blob.type || '').split(';')[0];
    if (blob.size > MAXMB * 1048576) return Promise.reject(new Error('That file is larger than ' + MAXMB + ' MB. Use a shorter clip, or a YouTube link for long videos.'));
    if (!uid || !S || !S.db || !S.db.storage) return Promise.reject(new Error('Sign in again to upload files.'));
    var path = uid + '/' + new Date().toISOString().slice(0, 10) + '-' + Math.random().toString(36).slice(2, 10) + ext(type);
    return S.db.storage.from(BUCKET).upload(path, blob, { contentType: type, upsert: false, cacheControl: '31536000' }).then(function (r) {
      if (r.error) throw new Error(/bucket not found|not found/i.test(r.error.message || '') ? 'File uploads switch on when the admin runs the database update 039.' : /row-level security|violates|unauthori[sz]ed|403/i.test(r.error.message || '') ? 'Your space for uploaded files is full (teachers 500 MB, students 50 MB), or your account is not approved yet. Use a link (for example YouTube or Wikimedia Commons) instead, or ask the admin.' : /exceeded|too large|payload/i.test(r.error.message || '') ? 'That file is too large. Files can be up to ' + MAXMB + ' MB.' : r.error.message || 'Upload failed.');
      return S.db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    });
  }
  function shrink(file, max, q) {   // a big photo → a JPEG no wider than max (keeps pages fast); small or PNG/GIF/SVG pictures stay as they are
    return new Promise(function (ok) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type) || (file.size < 450000 && file.type !== 'image/webp')) return ok(file);
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () { var k = Math.min(1, max / Math.max(im.width, im.height)); if (k === 1 && file.size < 900000) { URL.revokeObjectURL(u); return ok(file); }
        var c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        c.toBlob(function (b) { ok(b || file); }, 'image/jpeg', q || 0.85); };
      im.onerror = function () { URL.revokeObjectURL(u); ok(file); }; im.src = u;
    });
  }
  function dataUrl(blob) { return new Promise(function (ok, bad) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = bad; r.readAsDataURL(blob); }); }
  function picUpload(blob, uid) {   // pictures: upload; if the upload is refused for any reason, keep a small copy inside the question so it always works
    return upload(blob, uid).catch(function (e) {
      if (/larger than/.test(e.message)) throw e;
      return shrink(blob, 1000, 0.78).then(function (b) { return b.size > 420000 ? shrink(b, 760, 0.7) : b; }).then(function (b) { if (b.size > 520000) throw e; return dataUrl(b); });
    });
  }
  function persist(src, uid) {   // a picture kept inside the page (data: address) → uploaded; anything else unchanged; never fails
    if (!/^data:image\//.test(String(src || ''))) return Promise.resolve(src);
    return upload(dataToBlob(src), uid).then(function (u) { return u; }, function () { return src; });
  }
  function dataToBlob(d) { var m = /^data:([^;]+);base64,(.*)$/.exec(d), b = atob(m[2]), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return new Blob([a], { type: m[1] }); }

  /* ---------------------------------------------------------------- dialogs */
  function dialog(title, body, onOk, okText) {
    var ov = document.createElement('div'); ov.className = 'bvm-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', title);
    ov.innerHTML = '<div><div class="bvm-row" style="align-items:center"><h2 style="flex:3">' + title + '</h2><div style="flex:none;min-width:0"><button class="btn" type="button" data-close aria-label="Close">✕</button></div></div><div data-b></div><p class="bvm-msg" role="status" data-m></p><div class="acts"><button class="btn main" type="button" data-ok>' + (okText || 'Add to the question') + '</button><button class="btn" type="button" data-close>Cancel</button></div></div>';
    ov.querySelector('[data-b]').appendChild(body);
    var close = function () { ov.remove(); if (ov._stop) ov._stop(); };
    ov.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = close; });
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    var ok = ov.querySelector('[data-ok]'), msg = ov.querySelector('[data-m]');
    ok.onclick = function () { msg.textContent = ''; ok.disabled = true; var t = ok.textContent; ok.textContent = 'Working…';
      Promise.resolve().then(onOk).then(function (r) { if (r === false) { ok.disabled = false; ok.textContent = t; return; } close(); }, function (e) { ok.disabled = false; ok.textContent = t; msg.textContent = '⚠ ' + (e.message || e); }); };
    document.body.appendChild(ov); var f = ov.querySelector('input,textarea,select,button[data-tab]'); if (f) f.focus();
    return { ov: ov, msg: function (t) { msg.textContent = t; } };
  }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d; }
  function field(lab, html, hint) { return '<label><span>' + lab + '</span>' + html + (hint ? '<small class="muted">' + hint + '</small>' : '') + '</label>'; }
  function tabs(names, pick) { return '<div class="bvm-tabs" role="group">' + names.map(function (n, i) { return '<button type="button" data-tab="' + i + '" aria-pressed="' + (i === pick) + '">' + n + '</button>'; }).join('') + '</div>'; }
  function wireTabs(b, onPick) { b.querySelectorAll('[data-tab]').forEach(function (t) { t.onclick = function () { b.querySelectorAll('[data-tab]').forEach(function (x) { x.setAttribute('aria-pressed', x === t); }); onPick(+t.getAttribute('data-tab')); }; }); }

  function picture(m, uid, done) {
    m = m || { t: 'image', src: '', cap: '', alt: '' };
    var b = el('<div data-drop class="bvm-drop" tabindex="0" role="button" aria-label="Choose, drop or paste a picture">' +
      '<b>🖼️ Drop a picture here, paste it (Ctrl+V) or click to choose</b><span class="small muted">PNG, JPG, GIF, WebP or SVG · big photos are made smaller automatically</span><input type="file" accept="image/*" data-f hidden></div>' +
      field('Caption (optional)', '<input type="text" data-c value="' + E(m.cap) + '" placeholder="e.g. Figure 1: a plant cell seen with a light microscope">') +
      field('Description for screen readers', '<input type="text" data-a value="' + E(m.alt) + '" placeholder="What the picture shows">') + '<div class="bvm-pv" data-v>' + (m.src ? '<img src="' + E(m.src) + '" alt="" style="max-width:100%;max-height:260px">' : '<span class="muted small">The picture appears here.</span>') + '</div>');
    var file = null, show = function (src) { b.querySelector('[data-v]').innerHTML = '<img src="' + E(src) + '" alt="" style="max-width:100%;max-height:260px">'; };
    dropZone(b.querySelector('[data-drop]'), b.querySelector('[data-f]'), function (f) { file = f; show(URL.createObjectURL(f)); }, b);
    dialog('🖼️ Picture', b, function () {
      var cap = b.querySelector('[data-c]').value.trim(), alt = b.querySelector('[data-a]').value.trim();
      if (file) return shrink(file, 1600).then(function (f) { return picUpload(f, uid); }).then(function (src) { done({ t: 'image', src: src, cap: cap, alt: alt }); });
      if (m.src) { done({ t: 'image', src: m.src, cap: cap, alt: alt }); return; }
      throw new Error('Choose, drop or paste a picture first.');
    });
  }
  /* click, drop or paste a picture file; pasteRoot gets the paste listener (default: the zone) */
  function isPic(f) { return f && (/^image\//.test(f.type || '') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(f.name || '')); }
  function dropZone(zone, input, take, pasteRoot) {
    zone.onclick = function (e) { if (e.target !== input) input.click(); };
    zone.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } };
    input.onchange = function () { if (isPic(this.files[0])) take(this.files[0]); this.value = ''; };
    ['dragenter', 'dragover'].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('on'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { zone.addEventListener(ev, function () { zone.classList.remove('on'); }); });
    zone.addEventListener('drop', function (e) { e.preventDefault(); var f = [].filter.call((e.dataTransfer || {}).files || [], isPic)[0]; if (f) take(f); });
    (pasteRoot || zone).addEventListener('paste', function (e) { var it = [].filter.call((e.clipboardData || {}).items || [], function (x) { return x.kind === 'file' && /^image\//.test(x.type); })[0]; if (it) { e.preventDefault(); take(it.getAsFile()); } });
  }
  /* BVM.picField(host, {value, uid, onChange, label, hint}): the picture of a question, with no link to type.
     Choose, drop or paste a picture (it uploads at once), draw one, or remove it. onChange(src) gets the new address ('' when removed). */
  function picField(host, o) {
    o = o || {}; var val = o.value || '';
    function render(msg) {
      host.innerHTML = '<div class="bvm-pf">' + (val ? '<img src="' + E(val) + '" alt="" class="bvm-pfimg">' : '') +
        '<div data-drop class="bvm-drop" tabindex="0" role="button" aria-label="' + (val ? 'Change the picture' : 'Add a picture') + ': choose, drop or paste"><b>' + (val ? '🔁 Change the picture' : '🖼️ ' + (o.label || 'Add a picture or diagram')) + '</b><span class="small muted">Drop it here, paste it (Ctrl+V) or click to choose' + (o.hint ? ' · ' + E(o.hint) : '') + '</span><input type="file" accept="image/*" data-f hidden></div>' +
        '<div class="bvm-pfacts"><button type="button" class="btn sm" data-draw>✏️ Draw it instead</button>' + (val ? '<button type="button" class="btn sm" data-rm style="color:#b91c1c">✕ Remove</button>' : '') + '</div>' +
        '<p class="small" data-pm role="status" style="margin:2px 0 0">' + (msg || '') + '</p></div>';
      dropZone(host.querySelector('[data-drop]'), host.querySelector('[data-f]'), take, host);
      host.querySelector('[data-draw]').onclick = function () { drawing(val && /^data:/.test(val) ? { src: val } : null, o.uid, function (m) { set(m.src, ''); }); };
      var rm = host.querySelector('[data-rm]'); if (rm) rm.onclick = function () { set('', ''); };
    }
    function set(src, msg) { val = src; render(msg); if (o.onChange) o.onChange(src); }
    function take(f) {
      host.querySelector('[data-pm]').textContent = 'Adding the picture…';
      shrink(f, 1600).then(function (x) { return picUpload(x, o.uid); }).then(function (src) { set(src, /^data:/.test(src) ? '✓ Added (kept inside the question; it is uploaded when you save).' : '✓ Added.'); },
        function (e) { host.querySelector('[data-pm]').textContent = '⚠ ' + (e.message || e); });
    }
    render(); return { get: function () { return val; }, set: function (v) { val = v || ''; render(); } };
  }
  function video(m, uid, done) {
    m = m || { t: 'video', src: '', cap: '' };
    var b = el(tabs(['▶️ YouTube link', '⬆️ Upload a short clip'], m.src && !T.ytId(m.src) ? 1 : 0) +
      '<div data-p="0">' + field('YouTube link', '<input type="url" data-u value="' + E(T.ytId(m.src) ? m.src : '') + '" placeholder="https://www.youtube.com/watch?v=…">', 'It plays inside the question.') + field('Start at (seconds, optional)', '<input type="number" min="0" data-s value="' + E(m.start || '') + '">') + '</div>' +
      '<div data-p="1" hidden>' + field('Video file (MP4 or WebM, up to ' + MAXMB + ' MB)', '<input type="file" accept="video/mp4,video/webm,video/quicktime" data-f>', 'For long videos use YouTube instead.') + '</div>' +
      field('Caption (optional)', '<input type="text" data-c value="' + E(m.cap) + '" placeholder="e.g. Watch the reaction, then answer">') + '<div class="bvm-pv" data-v></div>');
    var file = null, pv = b.querySelector('[data-v]'), pane = function (i) { b.querySelectorAll('[data-p]').forEach(function (p) { p.hidden = +p.getAttribute('data-p') !== i; }); };
    var show = function (mm) { pv.innerHTML = T.mediaHtml([mm]); };
    if (m.src) show(m); wireTabs(b, pane); pane(m.src && !T.ytId(m.src) ? 1 : 0);
    b.querySelector('[data-u]').oninput = function () { if (T.ytId(this.value)) show({ t: 'video', src: this.value.trim() }); };
    b.querySelector('[data-f]').onchange = function () { file = this.files[0] || null; if (file) pv.innerHTML = '<video controls style="max-width:100%;max-height:240px" src="' + URL.createObjectURL(file) + '"></video>'; };
    dialog('🎬 Video', b, function () {
      var cap = b.querySelector('[data-c]').value.trim(), link = b.querySelector('[data-u]').value.trim(), st = +b.querySelector('[data-s]').value || 0;
      if (file) { pv.insertAdjacentHTML('beforeend', '<p class="small muted">Uploading…</p>'); return upload(file, uid).then(function (src) { done({ t: 'video', src: src, cap: cap }); }); }
      if (T.ytId(link)) { done({ t: 'video', src: link, cap: cap, start: st || undefined }); return; }
      if (m.src) { done({ t: 'video', src: m.src, cap: cap, start: st || m.start }); return; }
      throw new Error('Give a YouTube link or choose a video file.');
    });
  }

  function audio(m, uid, done) {
    m = m || { t: 'audio', src: '', cap: '' };
    var canRec = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
    var b = el(tabs(['🎙️ Record', '⬆️ Upload a file'], canRec ? 0 : 1) +
      '<div data-p="0"><div class="bvm-rec"><button class="btn main" type="button" data-r>🎙️ Start recording</button><span data-t class="small muted">' + (canRec ? 'Up to 5 minutes. Your browser asks to use the microphone.' : 'Recording is not available in this browser: upload a file instead.') + '</span></div></div>' +
      '<div data-p="1" hidden>' + field('Audio file (MP3, M4A, OGG, WAV or WebM)', '<input type="file" accept="audio/*" data-f>') + '</div>' +
      field('Caption (optional)', '<input type="text" data-c value="' + E(m.cap) + '" placeholder="e.g. Listen to the heartbeat, then answer">') + '<div class="bvm-pv" data-v>' + (m.src ? '<audio controls src="' + E(m.src) + '"></audio>' : '<span class="muted small">Your recording appears here.</span>') + '</div>');
    var blob = null, rec = null, stream = null, timer = null, pv = b.querySelector('[data-v]'), pane = function (i) { b.querySelectorAll('[data-p]').forEach(function (p) { p.hidden = +p.getAttribute('data-p') !== i; }); };
    wireTabs(b, pane); pane(canRec ? 0 : 1);
    var rb = b.querySelector('[data-r]'), tl = b.querySelector('[data-t]');
    function stop() { if (rec && rec.state === 'recording') rec.stop(); if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); clearInterval(timer); }
    rb.onclick = function () {
      if (!canRec) return;
      if (rec && rec.state === 'recording') { stop(); return; }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (st) {
        stream = st; var parts = [], t0 = Date.now(); rec = new MediaRecorder(st);
        rec.ondataavailable = function (e) { if (e.data.size) parts.push(e.data); };
        rec.onstop = function () { blob = new Blob(parts, { type: (rec.mimeType || 'audio/webm').split(';')[0] }); pv.innerHTML = '<audio controls src="' + URL.createObjectURL(blob) + '"></audio>'; rb.textContent = '🎙️ Record again'; tl.textContent = 'Recorded ' + Math.round((Date.now() - t0) / 1000) + ' s. Listen, then add it.'; };
        rec.start(); rb.textContent = '⏹ Stop'; tl.innerHTML = '<span class="bvm-dot"></span> Recording… 0 s';
        timer = setInterval(function () { var s = Math.round((Date.now() - t0) / 1000); tl.innerHTML = '<span class="bvm-dot"></span> Recording… ' + s + ' s'; if (s >= 300) stop(); }, 500);
      }, function () { tl.textContent = 'The microphone could not be used. Allow it in the browser, or upload a file.'; });
    };
    b.querySelector('[data-f]').onchange = function () { blob = this.files[0] || null; if (blob) pv.innerHTML = '<audio controls src="' + URL.createObjectURL(blob) + '"></audio>'; };
    var d = dialog('🔊 Audio', b, function () {
      stop(); var cap = b.querySelector('[data-c]').value.trim();
      if (blob) return upload(blob, uid).then(function (src) { done({ t: 'audio', src: src, cap: cap }); });
      if (m.src) { done({ t: 'audio', src: m.src, cap: cap }); return; }
      throw new Error('Record something or choose an audio file first.');
    });
    d.ov._stop = stop;
  }

  function graph(m, uid, done) {
    m = m || { t: 'graph', kind: 'line', title: '', x: 'Time / s', y: 'Distance / m', series: [''], rows: [['0', '0'], ['1', '2'], ['2', '4'], ['3', '6']] };
    var b = el('<div class="bvm-row">' + field('Type', '<select data-k><option value="line">Line graph</option><option value="scatter">Scatter graph (points)</option><option value="bar">Bar chart</option></select>') + field('Title (optional)', '<input type="text" data-ti value="' + E(m.title) + '">') + '</div>' +
      '<div class="bvm-row">' + field('x-axis label with unit', '<input type="text" data-gx value="' + E(m.x) + '">') + field('y-axis label with unit', '<input type="text" data-gy value="' + E(m.y) + '">') + '</div>' +
      field('Names of the data series (optional, separated by commas)', '<input type="text" data-s value="' + E((m.series || []).join(', ')) + '" placeholder="e.g. 20 °C, 30 °C">', 'Leave empty for one set of data.') +
      field('Data: one row per line, the x value first, then the y value(s), separated by commas or tabs', '<textarea rows="7" data-d style="font-family:ui-monospace,monospace">' + E((m.rows || []).map(function (r) { return r.join(', '); }).join('\n')) + '</textarea>', 'You can paste two or more columns from Excel or Google Sheets.') +
      '<label class="chk"><input type="checkbox" data-z' + (m.zero === false ? '' : ' checked') + '> Start the x-axis at zero</label>' +
      field('Caption (optional)', '<input type="text" data-c value="' + E(m.cap) + '" placeholder="e.g. Figure 2: the rate of reaction at two temperatures">') + '<div class="bvm-pv" data-v></div>');
    b.querySelector('[data-k]').value = m.kind || 'line';
    function read() {
      var rows = b.querySelector('[data-d]').value.split('\n').map(function (l) { return l.split(/\t|;|,/).map(function (c) { return c.trim(); }); }).filter(function (r) { return r.length > 1 && r[0] !== ''; });
      var ser = b.querySelector('[data-s]').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean), cols = Math.max.apply(null, rows.map(function (r) { return r.length - 1; }).concat([1]));
      if (ser.length < cols) for (var i = ser.length; i < cols; i++) ser.push(cols > 1 ? 'Series ' + (i + 1) : '');
      return { t: 'graph', kind: b.querySelector('[data-k]').value, title: b.querySelector('[data-ti]').value.trim(), x: b.querySelector('[data-gx]').value.trim(), y: b.querySelector('[data-gy]').value.trim(), series: ser.slice(0, cols), rows: rows.slice(0, 60), zero: b.querySelector('[data-z]').checked, cap: b.querySelector('[data-c]').value.trim() };
    }
    var draw = function () { b.querySelector('[data-v]').innerHTML = T.graphSvg(read()); };
    b.addEventListener('input', draw); b.addEventListener('change', draw); draw();
    dialog('📈 Graph from data', b, function () { var g = read(); if (!g.rows.length) throw new Error('Add at least one row of data.'); done(g); });
  }

  function drawing(m, uid, done) {
    var b = el('<p class="small muted" style="margin:0 0 6px">Draw the diagram with the pen and ruler, add labels with Aa and label lines. It is added to the question as a picture.</p><div data-pad></div>' + field('Caption (optional)', '<input type="text" data-c value="' + E(m && m.cap) + '" placeholder="e.g. Figure 3: a series circuit">'));
    var pad = T.pad(b.querySelector('[data-pad]'), { mode: 'draw', value: m && /^data:image/.test(m.src) ? m.src : '' });
    if (m && m.src && !/^data:/.test(m.src)) b.insertAdjacentHTML('afterbegin', '<p class="small">Drawing again replaces the old drawing.</p>');
    dialog('✏️ Draw a diagram', b, function () {
      var d = pad.get(), cap = b.querySelector('[data-c]').value.trim();
      if (!d) { if (m && m.src) { done({ t: 'drawing', src: m.src, cap: cap }); return; } throw new Error('Draw something first.'); }
      return picUpload(dataToBlob(d), uid).then(function (src) { done({ t: 'drawing', src: src, cap: cap }); });
    });
  }

  var OPEN = { image: picture, video: video, audio: audio, graph: graph, drawing: drawing };
  function editor(host, list, onChange, opts) {
    opts = opts || {}; list = list || [];
    function render() {
      host.innerHTML = '<div class="bvm">' + list.map(function (m, i) {
        return '<div class="bvm-it">' + thumb(m) + '<span class="tx"><b>' + ((TYPES.filter(function (t) { return t[0] === m.t; })[0] || [])[2] || 'Media') + '</b><span>' + E(label(m)) + '</span></span>' +
          '<button type="button" data-ed="' + i + '" aria-label="Change this ' + m.t + '">✎</button>' + (i ? '<button type="button" data-up="' + i + '" aria-label="Move up">▲</button>' : '') + '<button type="button" data-rm="' + i + '" aria-label="Remove this ' + m.t + '">✕</button></div>';
      }).join('') + '<div class="bvm-add">' + TYPES.filter(function (t) { return !opts.only || opts.only.indexOf(t[0]) >= 0; }).map(function (t) { return '<button type="button" data-new="' + t[0] + '">' + t[1] + ' ' + t[2] + '</button>'; }).join('') + '</div></div>';
      host.querySelectorAll('[data-new]').forEach(function (b) { b.onclick = function () { OPEN[b.getAttribute('data-new')](null, opts.uid, function (m) { list.push(m); changed(); }); }; });
      host.querySelectorAll('[data-ed]').forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-ed'); OPEN[list[i].t === 'drawing' ? 'drawing' : list[i].t](JSON.parse(JSON.stringify(list[i])), opts.uid, function (m) { list[i] = m; changed(); }); }; });
      host.querySelectorAll('[data-up]').forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-up'), t = list[i]; list[i] = list[i - 1]; list[i - 1] = t; changed(); }; });
      host.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { list.splice(+b.getAttribute('data-rm'), 1); changed(); }; });
    }
    function changed() { render(); onChange(list); }
    render();
    return { list: list };
  }
  window.BVM = { editor: editor, upload: upload, picUpload: picUpload, persist: persist, picField: picField, dropZone: dropZone, dataToBlob: dataToBlob, shrink: shrink, open: OPEN, TYPES: TYPES };
})();
