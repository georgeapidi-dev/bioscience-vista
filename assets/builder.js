/* VistaEd Assessment Studio (/build/). Create, edit, preview, publish and analyse assessments and interactive lessons.
   Dashboard: My assessments, drafts, published, archived, shared with me, the assessment library; search, filters, sorting,
     duplicate (studio_duplicate), archive / restore, delete (to the Bin), import (PDF / Word question papers, or a .json export).
   Create: a four-step wizard (details · marking: points, MYP criteria, MYP levels, IB DP, Cambridge · delivery · save and open).
   Editor, three panels: navigation (sections, 1 · 1(a) · 1(a)(i) numbering, marks, drag-and-drop order, add question / section /
     content) · the question workspace (rich-text toolbar, pictures, VistaEd diagrams, media, answer key and mark scheme)
     · settings (question: type, marks or marks per MYP criterion, difficulty, numbering, command term, topic, subtopic,
     curriculum alignment, tags, teacher explanation, student feedback, AI; assessment; live preview). Autosave to this device at
     once and to the account every 20 seconds; manual save; preview as a student, as a timed examination, or as a printable paper
     (with or without the mark scheme); 🚀 publish to classes and individual students with opening and closing dates and a link;
     📊 results: students, questions, topics, criteria and MYP levels, CSV.
   Question kinds: mcq, tf, short (written; also essay with a rubric, graph, drawing, annotate, and the recorded / uploaded answers
   audio, video and file: answer styles of a written question, marked by the teacher), info (content; a "group" is an info item
   that carries a number and is followed by its sub-questions), and the kinds in site_assets/qtypes.js (multi, match, order,
   classify, gaps, cloze, number, table, label, labelfill, hotspot) marked by the server (migrations 038 and 049).
   Science tools (site_assets/scitools.js): magnification, statistics, chi-squared, enzyme data, variables, error bars,
   percentage change, scientific notation and balancing equations; the VistaEd diagram library. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), QT = window.BVQT, T = window.BVT;
  var ME, IS_ADMIN = false, HAS_MAIN = true, MYCLASSES = [], ST = null, SEL = 0;
  var STEPS = ['Question', 'Explore', 'Test', 'Explain', 'Challenge', 'Reflect'];
  var CAT = { quiz: ['📝', 'Exam-style questions', '#7c3aed'], exam: ['🎓', 'Examination', '#db2777'], lesson: ['🧪', 'Interactive lesson', '#0d9488'] };
  // the builder's kinds; several are the same database kind with an answer style
  var KINDS = [
    ['Choice', [['mcq', '🔘', 'Multiple choice'], ['tf', '✅', 'True or false'], ['multi', '☑️', 'Several correct answers'], ['match', '🔗', 'Match the pairs'], ['order', '🔢', 'Put in order'], ['classify', '🗂️', 'Sort into groups']]],
    ['Fill in', [['gaps', '✍️', 'Fill in the gaps'], ['cloze', '🔽', 'Drop-down in a sentence'], ['number', '🔟', 'Number with unit'], ['table', '▦', 'Complete a table']]],
    ['Written', [['short', '📝', 'Written answer'], ['essay', '📜', 'Extended answer with rubric'], ['graph', '📈', 'Draw a graph'], ['draw', '✏️', 'Draw a diagram'], ['annotate', '🖊️', 'Annotate a picture']]],
    ['Diagram', [['label', '🏷️', 'Drag labels onto a diagram'], ['labelfill', '⌨️', 'Type labels on a diagram'], ['hotspot', '🎯', 'Click the correct part']]],
    ['Response', [['audio', '🎙️', 'Spoken (audio) answer'], ['video', '🎬', 'Video answer'], ['upload', '📎', 'File upload']]],
    ['Content', [['group', '🧩', 'Group: passage, diagram or data with sub-questions'], ['info', '📖', 'Text, picture or video']]]];
  var RESP = { audio: 'audio', video: 'video', upload: 'file' };   // builder kind → answer style of a written question (marked by the teacher)
  var PROGS = ['IB MYP', 'IB DP', 'Cambridge IGCSE', 'Cambridge A Level'];
  var GRADES = { 'IB MYP': ['MYP 1 (Grade 6)', 'MYP 2 (Grade 7)', 'MYP 3 (Grade 8)', 'MYP 4 (Grade 9)', 'MYP 5 (Grade 10)'], 'IB DP': ['DP 1 (Grade 11)', 'DP 2 (Grade 12)'], 'Cambridge IGCSE': ['Year 10', 'Year 11'], 'Cambridge A Level': ['AS (Year 12)', 'A2 (Year 13)'] };
  var SUBJECTS = ['Biology', 'Chemistry', 'Physics', 'Sciences (integrated)', 'Environmental Systems and Societies', 'Mathematics'];
  var MARKING = [['points', 'Points-based marking'], ['myp_criteria', 'MYP criteria A–D (marks per criterion)'], ['myp_levels', 'MYP achievement levels (0–8 per criterion)'], ['dp', 'IB DP examination-style (mark scheme)'], ['cambridge', 'Cambridge examination marking (mark scheme)']];
  var PURPOSE = [['practice', 'Practice'], ['formative', 'Formative'], ['summative', 'Summative']];
  var COMMANDS = ['Analyse', 'Annotate', 'Apply', 'Calculate', 'Classify', 'Comment', 'Compare', 'Compare and contrast', 'Construct', 'Contrast', 'Deduce', 'Define', 'Demonstrate', 'Describe', 'Design', 'Determine', 'Discuss', 'Distinguish', 'Draw', 'Estimate', 'Evaluate', 'Explain', 'Formulate', 'Identify', 'Interpret', 'Investigate', 'Justify', 'Label', 'List', 'Measure', 'Outline', 'Predict', 'Present', 'Sketch', 'Solve', 'State', 'Suggest', 'Summarize', 'To what extent'];
  var CRIT = { A: 'Knowing and understanding', B: 'Inquiring and designing', C: 'Processing and evaluating', D: 'Reflecting on the impacts of science' };
  var KN = {}; KINDS.forEach(function (g) { g[1].forEach(function (k) { KN[k[0]] = k; }); });
  var CSS = '.bd{display:grid;grid-template-columns:250px minmax(0,1fr) 360px;gap:14px;align-items:start}@media (max-width:1100px){.bd{grid-template-columns:1fr}}' +
    '.bd-col{background:var(--card,#fff);border:1px solid var(--line,#dde3ea);border-radius:16px;padding:12px;min-width:0}.bd-col h3{margin:2px 0 10px;font-size:1rem}' +
    '.bd-list{display:grid;grid-template-columns:minmax(0,1fr);gap:6px;max-height:62vh;overflow-y:auto;overflow-x:hidden}.bd-it{all:unset;box-sizing:border-box;cursor:pointer;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:6px;align-items:center;padding:8px;border-radius:12px;border:2px solid transparent;background:#f8fafc;font-size:.88rem;min-width:0}.bd-it>span:nth-child(2){min-width:0;overflow:hidden}' +
    '.bd-it[aria-current=true]{border-color:#4f46e5;background:#eef2ff}.bd-it:focus-visible{outline:3px solid #a5b4fc}.bd-it .n{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#4f46e5;color:#fff;font-weight:800;font-size:.8rem}.bd-it .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bd-it .m{color:#64748b;font-size:.78rem}' +
    '.bd-step{font:800 .72rem system-ui;letter-spacing:.06em;text-transform:uppercase;color:#0d9488;margin:8px 2px 0}' +
    '.bd-pal{display:grid;gap:6px}.bd-pal details{border:1px solid var(--line,#dde3ea);border-radius:12px;padding:6px 8px}.bd-pal summary{cursor:pointer;font-weight:700}.bd-pal button{all:unset;cursor:pointer;display:block;padding:5px 6px;border-radius:8px;font-size:.88rem}.bd-pal button:hover,.bd-pal button:focus-visible{background:#eef2ff}' +
    '.bd-f{display:grid;grid-template-columns:minmax(0,1fr);gap:4px;margin:0 0 10px;min-width:0}.bd-f>span{font-weight:700;font-size:.88rem}.bd-f input,.bd-f select,.bd-f textarea{font:inherit;padding:8px 10px;border:1px solid #cbd5e1;border-radius:10px;width:100%;box-sizing:border-box;background:#fff;color:#172033}.bd-f textarea{min-height:90px}.bd-f small{color:#64748b}' +
    '.bd-row{display:flex;gap:10px;flex-wrap:wrap}.bd-row>.bd-f{flex:1;min-width:120px}.bd-opt{display:flex;gap:6px;align-items:center;margin:4px 0}.bd-opt input[type=text]{flex:1;font:inherit;padding:7px 9px;border:1px solid #cbd5e1;border-radius:10px}' +
    '.bd-x{all:unset;cursor:pointer;color:#b91c1c;font-weight:800;padding:0 6px}.bd-add{all:unset;cursor:pointer;color:#4338ca;font-weight:700}.bd-warn{background:#fffbeb;border-left:5px solid #f59e0b;border-radius:10px;padding:8px 10px;font-size:.88rem;color:#78350f}' +
    '.bd-pv{border:2px dashed #c7d2fe;border-radius:14px;padding:12px;background:linear-gradient(160deg,#f8fafc,#eef2ff)}.bd-pv .q{margin:0}.bd-pv label.opt{display:block;padding:7px 10px;border:1px solid #dde3ea;border-radius:10px;margin:5px 0;background:#fff}' +
    '.bd-top{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:space-between;margin:0 0 12px}.bd-top h2{margin:0}' +
    '.bk-list{display:flex;flex-direction:column;gap:8px;margin:8px 0}.bk-card{display:flex;gap:10px;align-items:flex-start;border:1px solid var(--line,#e2e8f0);border-radius:14px;padding:10px 12px;background:var(--card,#fff);cursor:pointer}.bk-card:hover{border-color:#0ea5e9;box-shadow:0 4px 14px rgba(14,165,233,.12)}.bk-card:has(input:checked){border-color:#16a34a;background:#f0fdf4}.bk-card input{margin-top:4px;transform:scale(1.25)}.bk-body{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}.bk-meta{font-size:.82rem;color:var(--muted,#64748b)}.bk-q p{margin:2px 0}' +
    '.bk-topics{border:1px solid var(--line,#e2e8f0);border-radius:12px;padding:8px 12px;margin:8px 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:2px 12px}.bk-topics legend{font-weight:700}.bd-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2200;background:#14532d;color:#fff;padding:12px 18px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);max-width:92vw}' +
    '.bd-ov{position:fixed;inset:0;z-index:2000;background:rgba(15,23,42,.6);display:grid;place-items:start center;overflow:auto;padding:24px 12px}.bd-ov>div{background:var(--bg,#fff);color:inherit;border-radius:18px;max-width:860px;width:100%;padding:18px 20px;box-shadow:0 20px 60px rgba(0,0,0,.35)}' +
    '.bd-ov .q{border:1px solid var(--line,#dde3ea);border-radius:14px;padding:12px;margin:10px 0;background:var(--card,#fff)}.bd-ov .res{font-weight:800;margin:6px 0 0}.bd-ov .res.good{color:#15803d}.bd-ov .res.bad{color:#b91c1c}' +
    '.bd-start{display:grid;gap:14px;margin:14px 0 16px}.bd-start h3{margin:0 0 8px;font-size:.8rem;letter-spacing:.06em;text-transform:uppercase;color:#64748b}.bd-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}@media (max-width:760px){.bd-tiles{grid-template-columns:1fr}}' +
    '.bd-tile{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:12px;align-items:center;padding:12px 14px;border:1px solid var(--line,#dde3ea);border-left:5px solid var(--k);border-radius:14px;background:var(--card,#fff);color:inherit;text-decoration:none;min-width:0}.bd-tile:hover,.bd-tile:focus-visible{border-color:var(--k);box-shadow:0 6px 18px rgba(15,23,42,.08);outline:none}.bd-tile .ic{grid-row:span 2;font-size:1.6rem;width:44px;height:44px;display:grid;place-items:center;border-radius:12px;background:color-mix(in srgb,var(--k) 12%,transparent)}.bd-tile b{font-size:1rem}.bd-tile>span:last-child{color:#64748b;font-size:.85rem}' +
    '.bd-kinds{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 12px}.bd-kinds button{all:unset;box-sizing:border-box;cursor:pointer;display:grid;gap:2px;place-items:center;text-align:center;padding:10px;border:2px solid #e2e8f0;border-radius:14px;background:var(--card,#fff);font-weight:700}.bd-kinds button span{font-size:1.5rem}.bd-kinds button[aria-checked=true]{border-color:#4f46e5;background:#eef2ff;color:#312e81}.bd-kinds button:focus-visible{outline:3px solid #a5b4fc}@media (max-width:520px){.bd-kinds{grid-template-columns:1fr}}' +
    '.bd-more{border:1px dashed #cbd5e1;border-radius:12px;padding:6px 10px;margin:8px 0;background:#fafbff}.bd-more>summary{cursor:pointer;font-size:.86rem;color:#475569;font-weight:600}.bd-more[open]>summary{margin-bottom:8px}' +
    '.bd-lib{display:grid;gap:10px}.bd-card{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;border:1px solid var(--line,#dde3ea);border-left:6px solid var(--k);border-radius:14px;padding:10px 12px;background:var(--card,#fff)}.bd-card h4{margin:0}.bd-card .acts{display:flex;gap:6px;flex-wrap:wrap}@media (max-width:640px){.bd-card{grid-template-columns:1fr}}';
  /* Assessment Studio look: dashboard, wizard, tabs, numbering, print */
  var CSS2 = '.as-band{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:0 0 14px}.as-band h2{margin:0;font-size:1.5rem}.as-band .lab{font:800 .72rem system-ui;letter-spacing:.08em;text-transform:uppercase;color:#0e7490}' +
    '.as-shell{display:grid;grid-template-columns:210px minmax(0,1fr);gap:16px}@media (max-width:900px){.as-shell{grid-template-columns:1fr}}.as-side{display:grid;gap:2px;align-content:start}.as-side a{display:flex;gap:8px;align-items:center;padding:8px 10px;border-radius:10px;color:inherit;text-decoration:none;font-weight:600}.as-side a[aria-current=true]{background:#ecfeff;color:#0e7490}.as-side a:hover{background:#f1f5f9}.as-side .n{margin-left:auto;font-size:.78rem;color:#64748b}' +
    '.as-create{position:relative;display:inline-block}.as-menu{position:absolute;z-index:50;top:100%;left:0;margin-top:6px;background:var(--card,#fff);border:1px solid var(--line,#dde3ea);border-radius:12px;box-shadow:0 12px 30px rgba(15,23,42,.18);padding:6px;min-width:250px;display:grid}.as-menu[hidden]{display:none}.as-menu a,.as-menu button{all:unset;cursor:pointer;display:flex;gap:8px;padding:9px 10px;border-radius:8px}.as-menu a:hover,.as-menu button:hover,.as-menu a:focus-visible,.as-menu button:focus-visible{background:#ecfeff}' +
    '.as-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 10px}.as-tools input[type=search],.as-tools select{font:inherit;padding:8px 10px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#172033}.as-tools input[type=search]{flex:1;min-width:200px}' +
    '.as-tbl{width:100%;border-collapse:separate;border-spacing:0 6px}.as-tbl th{font:700 .75rem system-ui;text-transform:uppercase;letter-spacing:.05em;color:#64748b;text-align:left;padding:4px 8px;cursor:pointer;white-space:nowrap}.as-tbl td{background:var(--card,#fff);padding:10px 8px;border-top:1px solid var(--line,#e2e8f0);border-bottom:1px solid var(--line,#e2e8f0);vertical-align:middle;font-size:.9rem}.as-tbl td:first-child{border-left:1px solid var(--line,#e2e8f0);border-radius:12px 0 0 12px}.as-tbl td:last-child{border-right:1px solid var(--line,#e2e8f0);border-radius:0 12px 12px 0}' +
    '.as-tbl td b{display:block}.as-st{display:inline-block;padding:2px 9px;border-radius:999px;font:700 .75rem system-ui}.as-st.pub{background:#dcfce7;color:#166534}.as-st.dr{background:#fef9c3;color:#854d0e}.as-st.ar{background:#e2e8f0;color:#334155}.as-st.sh{background:#e0e7ff;color:#3730a3}@media (max-width:900px){.as-tbl thead{display:none}.as-tbl tr{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--line,#e2e8f0);border-radius:12px;margin:8px 0;padding:6px;background:var(--card,#fff)}.as-tbl td{border:0!important;border-radius:0!important;padding:4px 6px}.as-tbl td:first-child{grid-column:1/-1}.as-tbl td[data-l]::before{content:attr(data-l) ": ";color:#64748b;font-size:.75rem;text-transform:capitalize}}' +
    '.as-kebab{position:relative}.as-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:0 0 14px}.as-stat{border:1px solid var(--line,#e2e8f0);border-radius:14px;padding:10px 12px;background:var(--card,#fff)}.as-stat b{display:block;font-size:1.4rem}.as-stat span{font-size:.8rem;color:#64748b}' +
    '.wz{max-width:880px;margin:0 auto}.wz-steps{display:flex;gap:6px;margin:0 0 16px;flex-wrap:wrap}.wz-steps span{flex:1;min-width:130px;padding:8px 10px;border-radius:10px;background:#f1f5f9;font-weight:700;font-size:.85rem;color:#64748b}.wz-steps span[aria-current=step]{background:#0e7490;color:#fff}.wz-steps span.done{background:#cffafe;color:#155e75}' +
    '.wz-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;margin:4px 0 12px}.wz-cards label{display:flex;gap:8px;align-items:flex-start;border:2px solid #e2e8f0;border-radius:12px;padding:10px;cursor:pointer;background:var(--card,#fff)}.wz-cards label:has(input:checked){border-color:#0e7490;background:#ecfeff}.wz-cards small{display:block;color:#64748b}' +
    '.as-rtabs{display:flex;gap:4px;margin:-2px 0 10px;border-bottom:1px solid var(--line,#e2e8f0)}.as-rtabs button{all:unset;cursor:pointer;padding:7px 10px;font-weight:700;font-size:.88rem;color:#64748b;border-bottom:3px solid transparent}.as-rtabs button[aria-selected=true]{color:#0e7490;border-color:#0e7490}' +
    '.bd-sec{display:flex;justify-content:space-between;align-items:center;gap:6px;font:800 .75rem system-ui;letter-spacing:.05em;text-transform:uppercase;color:#0e7490;margin:10px 2px 2px;cursor:pointer}.bd-sec .m{color:#64748b;font-weight:700;text-transform:none;letter-spacing:0}' +
    '.bd-it.l1{margin-left:16px}.bd-it.l2{margin-left:32px}.bd-it .n.lab{width:auto;min-width:24px;padding:0 6px;border-radius:12px}.bd-it.grp .n{background:#0e7490}.bd-it.drop-before{box-shadow:0 -3px 0 #0e7490}.bd-it[draggable=true]{cursor:grab}' +
    '.as-save{font-size:.82rem;color:#64748b}.as-save.dirty{color:#b45309}.as-save.ok{color:#15803d}.as-chips{display:flex;gap:4px;flex-wrap:wrap}.as-chips span{background:#ecfeff;color:#155e75;border-radius:999px;padding:2px 8px;font-size:.8rem}.as-chips button{all:unset;cursor:pointer;margin-left:4px;color:#b91c1c}' +
    '.as-crit{display:flex;gap:6px;flex-wrap:wrap}.as-crit label{display:flex;gap:4px;align-items:center;border:1px solid #cbd5e1;border-radius:10px;padding:4px 6px}.as-crit input[type=number]{width:52px;font:inherit;padding:3px 5px;border:1px solid #cbd5e1;border-radius:8px}' +
    '.as-sw{display:flex;gap:10px;align-items:flex-start;justify-content:space-between;padding:8px 0;border-top:1px solid var(--line,#eef2f7)}.as-sw b{display:block;font-size:.9rem}.as-sw small{color:#64748b}.as-sw input{width:40px;height:22px;accent-color:#0e7490}' +
    '.ex-paper{max-width:820px;margin:0 auto;background:#fff;color:#111;font-family:Georgia,"Times New Roman",serif;padding:28px 34px;border-radius:6px}.ex-paper h1{font-size:1.35rem;text-align:center;margin:0}.ex-paper .meta{text-align:center;margin:4px 0 14px;font-size:.95rem}.ex-paper .ins{border:1px solid #111;padding:8px 12px;margin:0 0 14px;font-size:.92rem}' +
    '.ex-q{display:grid;grid-template-columns:56px 1fr 46px;gap:6px;margin:10px 0;break-inside:avoid}.ex-q .no{font-weight:700}.ex-q .mk{text-align:right;font-weight:700}.ex-lines div{border-bottom:1px dotted #555;height:26px}.ex-sec{font-weight:700;font-size:1.05rem;margin:18px 0 6px;border-bottom:2px solid #111;padding-bottom:3px}.ex-opt{margin:2px 0 2px 6px}.ex-box{border:1px solid #555;height:180px;margin:6px 0}.ex-ms{background:#f1f5f9;border-left:4px solid #0e7490;padding:6px 10px;margin:4px 0 0;font-family:system-ui;font-size:.85rem}' +
    '@media print{body *{visibility:hidden!important}.ex-print,.ex-print *{visibility:visible!important}.ex-print{position:absolute;left:0;top:0;width:100%}.ex-print .noprint{display:none!important}.ex-paper{padding:0}}' +
    '.ex-run{max-width:900px;margin:0 auto}.ex-nav{display:flex;gap:4px;flex-wrap:wrap;margin:8px 0}.ex-nav button{all:unset;cursor:pointer;min-width:28px;text-align:center;padding:4px 6px;border-radius:8px;border:1px solid #cbd5e1;font-size:.82rem}.ex-nav button[aria-current=true]{background:#0e7490;color:#fff;border-color:#0e7490}.ex-nav button.ans{background:#dcfce7}' +
    '.rs-bar{height:10px;border-radius:6px;background:#e2e8f0;overflow:hidden;min-width:80px}.rs-bar i{display:block;height:100%;background:#0e7490}' +
    'main.wrap,.wrap{max-width:min(1480px,100%)}.as-tools select,.as-tools input[type=search]{width:auto;min-width:0;padding:8px 10px}.as-tools select{flex:0 1 auto;max-width:200px}.as-side a{font-size:.92rem}.as-tblw{overflow-x:auto}.as-tbl td:first-child{min-width:230px}.as-tbl td{line-height:1.35}' +
    '.bd-f input,.bd-f select,.bd-f textarea{padding:8px 10px}.as-crit input[type=number]{width:58px!important}.as-chips+input{margin-top:4px}.as-rtabs+div .bd-row>.bd-f{min-width:110px}';
  var st = document.createElement('style'); st.textContent = CSS + CSS2; document.head.appendChild(st);
  document.title = 'Assessment Studio · VistaEd';
  if (!window.BVSCI && !document.querySelector('script[src*="scitools.js"]')) { var sci = document.createElement('script'); sci.src = '/assets/scitools.js?v=' + (window.BV_VER || '1'); sci.defer = true; document.head.appendChild(sci); }   // pages built before the studio do not list it
  var missing038 = function (e) { return /main_site|questions_kind_check|violates check constraint|answers_teacher|row-level security/.test(String(e && (e.message || e.details) || e)); };

  S.guard(app, { school: true, anyone: true }).then(function (m) {
    ME = m; IS_ADMIN = !!m.admin; window.BVM_UID = m.user.id;
    var teach = m.admin || m.staff || m.roles.indexOf('teacher') >= 0 || m.roles.indexOf('school_teacher') >= 0;
    if (!teach) { app.innerHTML = '<section class="panel"><h2>🧰 Builder</h2><p>The builder is for teachers.</p><p><a class="btn main" href="/dashboard/">Go to my dashboard</a></p></section>'; return; }
    S.db.from('classes').select('id,name,teacher_id').eq('teacher_id', m.user.id).is('archived_at', null).order('name').then(function (r) { MYCLASSES = r.data || []; window.addEventListener('hashchange', route); route(); });
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  function route() {
    var h = location.hash.replace(/^#/, '').split('/');
    if (h[0] === 'new' && h[2] === 'blank') return start(CAT[h[1]] ? h[1] : 'quiz', true);
    if (h[0] === 'new' && h[2] === 'ai') return start(CAT[h[1]] ? h[1] : 'quiz');
    if (h[0] === 'new' && h[2] === 'bank') { start(CAT[h[1]] ? h[1] : 'quiz', true); return bankDialog(); }
    if (h[0] === 'new') return wizard(CAT[h[1]] ? h[1] : 'exam');
    if (h[0] === 'import') { start('exam', true); return quick(false, 'import'); }
    if (h[0] === 'edit' && /^[0-9a-f-]{36}$/.test(h[1] || '')) return load(h[1]);
    if (h[0] === 'results' && /^[0-9a-f-]{36}$/.test(h[1] || '')) return results(h[1]);
    studio(VIEWS[h[0]] ? h[0] : 'my');
  }

  /* ================================================================ Assessment Studio dashboard
     My assessments · Drafts · Published · Archived · Shared (other teachers' assessments set for my classes) · Library (the main site)
     Each row: title, programme, subject, grade, total marks, questions, created, last modified, status, classes; search, filters,
     sorting, duplicate (studio_duplicate, migration 049), archive / restore, delete (to the Bin for 30 days: bin_item). */
  var VIEWS = { my: ['🗂️', 'My assessments'], drafts: ['📝', 'Draft assessments'], published: ['✅', 'Published assessments'], archived: ['🗄️', 'Archived assessments'], shared: ['🤝', 'Shared with me'], library: ['🏛️', 'Assessment library'] };
  var DF = { q: '', prog: '', subj: '', grade: '', cat: '', purpose: '', sort: 'mod' };
  function statusOf(x) { var m = x.meta || {}; if (m.archived) return 'archived'; if (x.published || (x.quiz_classes || []).some(function (c) { return c.published !== false; })) return 'published'; return 'draft'; }
  function marksOf(x) { return (x.quiz_questions || []).reduce(function (a, r) { return a + (r.questions && r.questions.kind !== 'info' ? +r.questions.marks || 0 : 0); }, 0); }
  function countOf(x) { return (x.quiz_questions || []).filter(function (r) { return r.questions && r.questions.kind !== 'info'; }).length; }
  function day(t) { if (!t) return '–'; var d = new Date(t); return isNaN(d) ? '–' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); }
  function studio(view) {
    app.innerHTML = '<p class="muted">Loading the Assessment Studio…</p>';
    var cols = 'id,title,category,published,created_at,created_by,main_site,meta,opens_at,due_at,time_limit_minutes,subject,deleted_at, quiz_classes(class_id,published), quiz_questions(question_id, questions(marks,kind))';
    var mineQ = S.db.from('quizzes').select(cols).eq('created_by', ME.user.id).is('deleted_at', null).order('created_at', { ascending: false });
    var libQ = view === 'library' ? S.db.from('quizzes').select(cols).eq('main_site', true).eq('published', true).is('deleted_at', null).order('created_at', { ascending: false }).limit(300) : Promise.resolve({ data: [] });
    var sharedQ = view === 'shared' && MYCLASSES.length ? S.db.from('quiz_classes').select('quiz_id').in('class_id', MYCLASSES.map(function (c) { return c.id; })).then(function (r) {
      var ids = (r.data || []).map(function (x) { return x.quiz_id; }); return ids.length ? S.db.from('quizzes').select(cols).in('id', ids.slice(0, 300)).neq('created_by', ME.user.id).is('deleted_at', null) : { data: [] }; }) : Promise.resolve({ data: [] });
    Promise.all([mineQ, libQ, sharedQ]).then(function (rr) {
      if (rr[0].error && /meta/.test(rr[0].error.message || '')) { app.innerHTML = '<p class="msg">The Assessment Studio needs the database update 049. Ask the admin to run supabase/migrations/049_assessment_studio.sql.</p>'; return; }
      var mine = (rr[0].data || []).filter(function (x) { return CAT[x.category] && !(/^Practice: /.test(x.title || '') && !(x.quiz_classes || []).length); });
      var counts = { my: 0, drafts: 0, published: 0, archived: 0 }; mine.forEach(function (x) { var s = statusOf(x); if (s !== 'archived') counts.my++; counts[s === 'draft' ? 'drafts' : s]++; });
      var rows = view === 'library' ? (rr[1].data || []) : view === 'shared' ? (rr[2].data || []) : mine.filter(function (x) { var s = statusOf(x); return view === 'my' ? s !== 'archived' : view === 'drafts' ? s === 'draft' : view === 'published' ? s === 'published' : s === 'archived'; });
      var cn = {}; MYCLASSES.forEach(function (c) { cn[c.id] = c.name; });
      var t = DF.q.trim().toLowerCase(), list = rows.filter(function (x) { var m = x.meta || {};
        return (!t || [x.title, m.description, m.unit, m.subject || x.subject, m.programme, m.grade].join(' ').toLowerCase().indexOf(t) >= 0) && (!DF.prog || m.programme === DF.prog) && (!DF.subj || (m.subject || x.subject) === DF.subj) && (!DF.grade || m.grade === DF.grade) && (!DF.cat || x.category === DF.cat) && (!DF.purpose || (m.delivery || {}).purpose === DF.purpose); });
      var key = { mod: function (x) { return -(Date.parse((x.meta || {}).updated_at || x.created_at) || 0); }, created: function (x) { return -(Date.parse(x.created_at) || 0); }, title: function (x) { return String(x.title || '').toLowerCase(); }, marks: function (x) { return -marksOf(x); }, qs: function (x) { return -countOf(x); } }[DF.sort] || function () { return 0; };
      list.sort(function (a, b) { var ka = key(a), kb = key(b); return ka < kb ? -1 : ka > kb ? 1 : 0; });
      var opt = function (arr, cur, all) { return '<option value="">' + all + '</option>' + arr.map(function (v) { var val = Array.isArray(v) ? v[0] : v, lab = Array.isArray(v) ? v[1] : v; return '<option value="' + E(val) + '"' + (cur === val ? ' selected' : '') + '>' + E(lab) + '</option>'; }).join(''); };
      var allGrades = []; PROGS.forEach(function (p) { allGrades = allGrades.concat(GRADES[p]); });
      app.innerHTML = '<div class="as-band"><div><p class="lab">VistaEd</p><h2>🧬 Assessment Studio</h2></div><div class="acts" style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<div class="as-create"><button class="btn main" type="button" id="cr" aria-haspopup="true" aria-expanded="false">＋ Create assessment ▾</button><div class="as-menu" id="crm" hidden role="menu">' +
            '<a role="menuitem" href="#new/exam">📄 Create from scratch <span class="small muted">(step-by-step)</span></a><a role="menuitem" href="#new/exam/ai">✨ Generate with AI</a><a role="menuitem" href="#import">📥 Import a question paper (PDF / Word)</a>' +
            '<button role="menuitem" type="button" id="cr-json">🧾 Import a VistaEd file (.json)</button><a role="menuitem" href="#library">🏛️ Use from the library</a><a role="menuitem" href="#new/lesson/blank">🧪 Interactive lesson</a></div></div>' +
          '<a class="btn" href="#new/quiz/bank">📚 Question bank</a><a class="btn" href="/teach/#quizzes">🖊 Marking</a></div></div>' +
        '<div class="as-stats"><div class="as-stat"><b>' + counts.my + '</b><span>Active assessments</span></div><div class="as-stat"><b>' + counts.drafts + '</b><span>Drafts</span></div><div class="as-stat"><b>' + counts.published + '</b><span>Published</span></div><div class="as-stat"><b>' + mine.reduce(function (a, x) { return a + countOf(x); }, 0) + '</b><span>Questions written</span></div></div>' +
        '<div class="as-shell"><nav class="as-side" aria-label="Assessments">' + Object.keys(VIEWS).map(function (k) { return '<a href="#' + k + '" aria-current="' + (k === view) + '"><span aria-hidden="true">' + VIEWS[k][0] + '</span>' + VIEWS[k][1] + (counts[k] != null ? '<span class="n">' + counts[k] + '</span>' : '') + '</a>'; }).join('') +
          '<a href="#new/quiz/bank"><span aria-hidden="true">📚</span>Question bank</a><a href="#import"><span aria-hidden="true">📥</span>Import assessment</a></nav>' +
        '<section aria-label="' + E(VIEWS[view][1]) + '"><h3 style="margin:0 0 8px">' + VIEWS[view][0] + ' ' + VIEWS[view][1] + ' <span class="small muted">(' + list.length + ')</span></h3>' +
          '<div class="as-tools"><input type="search" id="fq" placeholder="Search titles, units, subjects…" aria-label="Search" value="' + E(DF.q) + '">' +
          '<select id="fp" aria-label="Programme">' + opt(PROGS, DF.prog, 'All programmes') + '</select><select id="fs" aria-label="Subject">' + opt(SUBJECTS, DF.subj, 'All subjects') + '</select><select id="fg" aria-label="Grade">' + opt(DF.prog ? GRADES[DF.prog] : allGrades, DF.grade, 'All grades') + '</select>' +
          '<select id="fc" aria-label="Type">' + opt(Object.keys(CAT).map(function (c) { return [c, CAT[c][1]]; }), DF.cat, 'All types') + '</select><select id="fu" aria-label="Purpose">' + opt(PURPOSE, DF.purpose, 'Any purpose') + '</select>' +
          '<select id="fo" aria-label="Sort by">' + [['mod', 'Last modified'], ['created', 'Newest'], ['title', 'Title A–Z'], ['marks', 'Most marks'], ['qs', 'Most questions']].map(function (o) { return '<option value="' + o[0] + '"' + (DF.sort === o[0] ? ' selected' : '') + '>Sort: ' + o[1] + '</option>'; }).join('') + '</select></div>' +
          (list.length ? '<div class="as-tblw"><table class="as-tbl"><thead><tr><th data-s="title">Assessment</th><th>Programme</th><th>Subject</th><th>Grade</th><th data-s="marks">Marks</th><th data-s="qs">Questions</th><th data-s="created">Created</th><th data-s="mod">Modified</th><th>Status</th><th>Classes</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
            list.map(function (x) { var m = x.meta || {}, K = CAT[x.category] || CAT.quiz, st = statusOf(x), own = x.created_by === ME.user.id, cls = (x.quiz_classes || []).map(function (c) { return cn[c.class_id]; }).filter(Boolean);
              var url = (x.category === 'lesson' ? '/lesson/#' : x.category === 'exam' ? '/exams/#' : '/quizzes/#') + x.id;
              return '<tr><td><b>' + K[0] + ' ' + E(x.title) + '</b><span class="small muted">' + E(K[1]) + (m.unit ? ' · ' + E(m.unit) : '') + ((m.delivery || {}).purpose ? ' · ' + E((m.delivery || {}).purpose) : '') + (x.main_site ? ' · 🌐 main site' : '') + '</span></td>' +
                '<td>' + E(m.programme || '–') + '</td><td>' + E(m.subject || x.subject || '–') + '</td><td>' + E(m.grade || '–') + '</td><td>' + marksOf(x) + '</td><td>' + countOf(x) + '</td><td>' + day(x.created_at) + '</td><td>' + day(m.updated_at || x.created_at) + '</td>' +
                '<td><span class="as-st ' + ({ published: 'pub', draft: 'dr', archived: 'ar' }[st]) + '">' + ({ published: 'Published', draft: 'Draft', archived: 'Archived' }[st]) + '</span>' + (view === 'shared' || view === 'library' && !own ? ' <span class="as-st sh">Shared</span>' : '') + '</td>' +
                '<td>' + (cls.length ? E(cls.join(', ')) : x.quiz_classes && x.quiz_classes.length ? x.quiz_classes.length + ' class' + (x.quiz_classes.length > 1 ? 'es' : '') : '–') + '</td>' +
                '<td style="white-space:nowrap">' + (own || IS_ADMIN ? '<a class="btn sm main" href="#edit/' + x.id + '">✏️ Edit</a> ' : '') + '<details class="as-kebab" style="display:inline-block"><summary class="btn sm" aria-label="More actions for ' + E(x.title) + '">⋯</summary><div class="as-menu">' +
                  '<a href="' + url + '" target="_blank" rel="noopener">👁 Student view ↗</a>' + (own || IS_ADMIN ? '<a href="#results/' + x.id + '">📊 Results and analytics</a>' : '') + '<button type="button" data-dup="' + x.id + '">⧉ Duplicate' + (own ? '' : ' to my assessments') + '</button>' +
                  (own ? (st === 'archived' ? '<button type="button" data-arch="' + x.id + '" data-on="0">♻️ Restore</button>' : '<button type="button" data-arch="' + x.id + '" data-on="1">🗄️ Archive</button>') + '<button type="button" data-del="' + x.id + '" style="color:#b91c1c">🗑 Delete</button>' : '') +
                  (IS_ADMIN && HAS_MAIN ? '<button type="button" data-main="' + x.id + '" data-on="' + (x.main_site ? 0 : 1) + '">' + (x.main_site ? '🌐 Remove from the main site' : '🌐 Put on the main site') + '</button>' : '') + '</div></details></td></tr>'; }).join('') + '</tbody></table></div>' :
            '<p class="emptybox">' + (view === 'library' ? 'Nothing in the library matches.' : view === 'shared' ? 'No other teacher has set an assessment for your classes.' : 'Nothing here yet. Use <b>＋ Create assessment</b> to build your first one.') + '</p>') +
        '</section></div><input type="file" id="jsonf" accept=".json,application/json" hidden>';
      app.querySelectorAll('.as-tbl').forEach(function (t) { var hs = [].map.call(t.querySelectorAll('thead th'), function (th) { return th.textContent; }); t.querySelectorAll('tbody tr').forEach(function (tr) { [].forEach.call(tr.children, function (td, i) { if (i > 0 && hs[i]) td.setAttribute('data-l', hs[i]); }); }); });   // labels for the phone layout
      var cr = app.querySelector('#cr'), crm = app.querySelector('#crm');
      cr.onclick = function (e) { e.stopPropagation(); crm.hidden = !crm.hidden; cr.setAttribute('aria-expanded', !crm.hidden); };
      document.addEventListener('click', function off() { crm.hidden = true; document.removeEventListener('click', off); });
      app.querySelector('#cr-json').onclick = function () { app.querySelector('#jsonf').click(); };
      app.querySelector('#jsonf').onchange = function () { var f = this.files[0]; if (f) importJson(f); };
      var refilter = function () { DF.q = app.querySelector('#fq').value; DF.prog = app.querySelector('#fp').value; DF.subj = app.querySelector('#fs').value; DF.grade = app.querySelector('#fg').value; DF.cat = app.querySelector('#fc').value; DF.purpose = app.querySelector('#fu').value; DF.sort = app.querySelector('#fo').value; studio(view); };
      ['#fp', '#fs', '#fg', '#fc', '#fu', '#fo'].forEach(function (sel) { app.querySelector(sel).onchange = refilter; });
      var fq = app.querySelector('#fq'); fq.oninput = function () { clearTimeout(fq.t); fq.t = setTimeout(function () { var pos = fq.selectionStart; refilter(); var n = app.querySelector('#fq'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} }, 350); };
      app.querySelectorAll('th[data-s]').forEach(function (th) { th.onclick = function () { DF.sort = th.getAttribute('data-s'); studio(view); }; });
      app.querySelectorAll('[data-dup]').forEach(function (b) { b.onclick = function () { b.disabled = true; S.db.rpc('studio_duplicate', { qid: b.getAttribute('data-dup') }).then(function (r) { if (r.error) { toast('⚠ ' + S.nice(r.error)); b.disabled = false; return; } toast('Copied. Opening the copy…'); location.hash = 'edit/' + r.data; }); }; });
      app.querySelectorAll('[data-arch]').forEach(function (b) { b.onclick = function () { var x = rows.filter(function (y) { return y.id === b.getAttribute('data-arch'); })[0], on = b.getAttribute('data-on') === '1', m = Object.assign({}, x.meta || {}); if (on) { m.archived = true; m.archived_at = new Date().toISOString(); } else { delete m.archived; delete m.archived_at; }
        S.db.from('quizzes').update({ meta: m }).eq('id', x.id).then(function (r) { if (r.error) return toast('⚠ ' + S.nice(r.error)); toast(on ? 'Archived. Find it under 🗄️ Archived assessments.' : 'Restored.'); studio(view); }); }; });
      app.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = '🗑 Click again to delete'; return; }
        S.db.rpc('bin_item', { kind: 'quiz', item: b.getAttribute('data-del') }).then(function (r) { if (r.error) return toast('⚠ ' + S.nice(r.error)); toast('Moved to the 🗑 Bin: restore it from My classes → Bin within 30 days.'); studio(view); }); }; });
      app.querySelectorAll('[data-main]').forEach(function (b) { b.onclick = function () { var on = b.getAttribute('data-on') === '1'; S.db.from('quizzes').update({ main_site: on, published: on ? true : undefined }).eq('id', b.getAttribute('data-main')).then(function (r) { if (r.error) return toast('⚠ ' + S.nice(r.error)); toast(on ? 'On the main site.' : 'Taken off the main site.'); studio(view); }); }; });
    });
  }
  function toast(msg) { var t = document.createElement('div'); t.className = 'bd-toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3800); }

  /* ================================================================ Create assessment: a four-step wizard
     1 details · 2 marking (rubric) · 3 delivery · 4 save and open the editor */
  function wizard(cat) {
    var W = { cat: cat === 'lesson' ? 'lesson' : cat, title: '', meta: { description: '', programme: '', subject: '', grade: '', unit: '', marking: 'points', delivery: { mode: 'online', timed: cat === 'exam', purpose: cat === 'exam' ? 'summative' : 'formative' } }, instructions: '', time: cat === 'exam' ? 60 : '', step: 1 };
    try { var last = JSON.parse(localStorage.getItem('bv-studio-last') || 'null'); if (last) { W.meta.programme = last.programme || ''; W.meta.subject = last.subject || ''; W.meta.grade = last.grade || ''; } } catch (e) {}
    function draw() {
      var m = W.meta, d = m.delivery, steps = ['Assessment details', 'Marking', 'Delivery', 'Save and open'];
      var body = '';
      if (W.step === 1) body = field('Assessment title', '<input id="w-t" value="' + E(W.title) + '" placeholder="e.g. Grade 10 Biology · Enzymes · Unit test" required>') +
        field('Description (for you and other teachers)', '<textarea id="w-d" rows="2">' + E(m.description) + '</textarea>') + field('Instructions for students', '<textarea id="w-i" rows="3" placeholder="Answer all questions. Write your answers in the spaces provided. Calculators may be used.">' + E(W.instructions) + '</textarea>') +
        '<div class="bd-row">' + field('Programme', '<select id="w-p"><option value="">Choose…</option>' + PROGS.map(function (p) { return '<option' + (m.programme === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select>') +
          field('Subject', '<select id="w-s"><option value="">Choose…</option>' + SUBJECTS.map(function (p) { return '<option' + (m.subject === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select>') +
          field('Grade / year', '<select id="w-g"><option value="">Choose…</option>' + (GRADES[m.programme] || []).map(function (p) { return '<option' + (m.grade === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select>') + '</div>' +
        '<div class="bd-row">' + field('Unit / topic', '<input id="w-u" value="' + E(m.unit) + '" placeholder="e.g. Enzymes and metabolism">') + field('Duration (minutes)', '<input id="w-m" type="number" min="1" max="600" value="' + E(W.time) + '" placeholder="no limit">') +
          field('Type', '<select id="w-c">' + ['exam', 'quiz', 'lesson'].map(function (c) { return '<option value="' + c + '"' + (W.cat === c ? ' selected' : '') + '>' + CAT[c][0] + ' ' + CAT[c][1] + '</option>'; }).join('') + '</select>') + '</div>';
      if (W.step === 2) body = '<p class="small muted">How the assessment is marked. You can change this later in the editor.</p><div class="wz-cards" role="radiogroup">' + MARKING.map(function (k) {
          var about = { points: 'Each question has a number of marks; scores add up to a total.', myp_criteria: 'Each question earns marks against MYP criteria A, B, C and D; totals are shown per criterion.', myp_levels: 'Criterion totals are converted to MYP achievement levels 0–8 for each criterion.', dp: 'Paper-style marks with a mark scheme for every question (M1, A1, OWTTE…).', cambridge: 'Cambridge-style marks with a mark scheme and accepted alternatives.' }[k[0]];
          return '<label><input type="radio" name="w-k" value="' + k[0] + '"' + (m.marking === k[0] ? ' checked' : '') + '><span><b>' + k[1] + '</b><small>' + about + '</small></span></label>'; }).join('') + '</div>' +
        (/^myp_/.test(m.marking) ? '<fieldset><legend>Criteria assessed</legend>' + Object.keys(CRIT).map(function (c) { return '<label class="chk"><input type="checkbox" name="w-cr" value="' + c + '"' + ((m.criteria || ['A', 'B', 'C', 'D']).indexOf(c) >= 0 ? ' checked' : '') + '> ' + c + ': ' + CRIT[c] + '</label>'; }).join('') + '</fieldset>' : '');
      if (W.step === 3) body = '<fieldset><legend>How students take it</legend><div class="wz-cards">' + [['online', '💻 Online assessment', 'Students answer on VistaEd; objective questions are marked automatically.'], ['paper', '🖨 Printable examination', 'A clean paper with numbering, marks and answer lines; enter marks afterwards.']].map(function (o) { return '<label><input type="radio" name="w-mode" value="' + o[0] + '"' + (d.mode === o[0] ? ' checked' : '') + '><span><b>' + o[1] + '</b><small>' + o[2] + '</small></span></label>'; }).join('') + '</div></fieldset>' +
        '<fieldset><legend>Purpose</legend><div class="wz-cards">' + PURPOSE.map(function (o) { return '<label><input type="radio" name="w-pu" value="' + o[0] + '"' + (d.purpose === o[0] ? ' checked' : '') + '><span><b>' + o[1] + '</b><small>' + { practice: 'Unlimited tries, answers shown straight away.', formative: 'Feedback to guide learning; scores shown after handing in.', summative: 'One attempt, you release the results.' }[o[0]] + '</small></span></label>'; }).join('') + '</div></fieldset>' +
        '<label class="chk"><input type="checkbox" id="w-tm"' + (d.timed ? ' checked' : '') + '> ⏱ Timed assessment' + (W.time ? ' (' + E(W.time) + ' minutes)' : ' (set the duration in step 1)') + '</label>';
      if (W.step === 4) body = '<div class="panel tint"><p><b>' + E(W.title || 'Untitled') + '</b></p><p class="small">' + [m.programme, m.subject, m.grade, m.unit].filter(Boolean).map(E).join(' · ') + '</p><p class="small">' + E((MARKING.filter(function (k) { return k[0] === m.marking; })[0] || [])[1]) + ' · ' + (d.mode === 'paper' ? 'Printable examination' : 'Online assessment') + ' · ' + E(d.purpose) + (d.timed && W.time ? ' · timed, ' + E(W.time) + ' min' : '') + '</p></div>' +
        '<p>How do you want to start?</p><div class="wz-cards"><label><input type="radio" name="w-go" value="blank" checked><span><b>✏️ Blank: build it myself</b><small>Opens the three-panel editor with Section A ready.</small></span></label><label><input type="radio" name="w-go" value="ai"><span><b>✨ Generate questions with AI</b><small>From a topic, notes, a PDF or images; edit everything before saving.</small></span></label><label><input type="radio" name="w-go" value="bank"><span><b>📚 From the question bank</b><small>Pick questions from the VistaEd bank and your own.</small></span></label><label><input type="radio" name="w-go" value="sci"><span><b>🔬 Science data tools</b><small>Chi-squared, statistics, microscopy, enzyme data, variables…</small></span></label></div>';
      app.innerHTML = '<div class="wz"><p class="label"><a href="#">← Assessment Studio</a></p><h2>Create assessment</h2><div class="wz-steps">' + steps.map(function (s, i) { return '<span' + (W.step === i + 1 ? ' aria-current="step"' : W.step > i + 1 ? ' class="done"' : '') + '>' + (i + 1) + '. ' + s + '</span>'; }).join('') + '</div>' +
        '<form id="wf" class="panel">' + body + '<p class="msg" id="wm" role="alert"></p><div class="acts" style="display:flex;justify-content:space-between;gap:8px"><button class="btn" type="button" id="wb"' + (W.step === 1 ? ' disabled' : '') + '>← Back</button><button class="btn main" type="submit">' + (W.step === 4 ? 'Save and open the editor →' : 'Next →') + '</button></div></form></div>';
      var f = app.querySelector('#wf'), val = function (id) { var el = f.querySelector(id); return el ? el.value : null; };
      if (W.step === 1) { f.querySelector('#w-p').onchange = function () { read(); m.grade = ''; draw(); }; f.querySelector('#w-t').focus(); }
      if (W.step === 2) f.querySelectorAll('[name=w-k]').forEach(function (r) { r.onchange = function () { read(); draw(); }; });
      function read() {
        if (W.step === 1) { W.title = val('#w-t'); m.description = val('#w-d'); W.instructions = val('#w-i'); m.programme = val('#w-p'); m.subject = val('#w-s'); m.grade = val('#w-g') || ''; m.unit = val('#w-u'); W.time = val('#w-m'); W.cat = val('#w-c'); }
        if (W.step === 2) { var k = f.querySelector('[name=w-k]:checked'); if (k) m.marking = k.value; var cr = f.querySelectorAll('[name=w-cr]'); if (cr.length) m.criteria = [].filter.call(cr, function (c) { return c.checked; }).map(function (c) { return c.value; }); }
        if (W.step === 3) { d.mode = (f.querySelector('[name=w-mode]:checked') || {}).value || 'online'; d.purpose = (f.querySelector('[name=w-pu]:checked') || {}).value || 'formative'; d.timed = f.querySelector('#w-tm').checked; }
      }
      f.querySelector('#wb').onclick = function () { read(); W.step--; draw(); };
      f.onsubmit = function (e) { e.preventDefault(); read();
        if (W.step === 1 && !W.title.trim()) { f.querySelector('#wm').textContent = 'Give the assessment a title.'; return; }
        if (W.step < 4) { W.step++; draw(); return; }
        var go = (f.querySelector('[name=w-go]:checked') || {}).value || 'blank';
        try { localStorage.setItem('bv-studio-last', JSON.stringify({ programme: m.programme, subject: m.subject, grade: m.grade })); } catch (x) {}
        start(W.cat, true);
        ST.title = W.title.trim(); ST.instructions = W.instructions || ''; ST.time = d.timed ? W.time : ''; ST.meta = JSON.parse(JSON.stringify(m)); ST.subject = /^(Biology|Chemistry|Physics)$/.test(m.subject) && m.programme === 'IB MYP' ? m.subject : '';
        ST.attempts = d.purpose === 'practice' ? 5 : d.purpose === 'summative' ? 1 : 2; ST.show = d.purpose !== 'summative';
        if (W.cat !== 'lesson') ST.questions.forEach(function (q) { q.section = 'Section A'; });
        GEN.objectives = [m.unit, m.description].filter(Boolean).join('. '); var lv = levelFor(m); if (lv) GEN.level = lv;
        ST.changed = true; draw0();
        if (go === 'ai') quick(false); else if (go === 'bank') bankDialog(); else if (go === 'sci') sciDialog();
        save(true).then(function (id) { history.replaceState(null, '', '#edit/' + id); stamp('ok', 'Saved as a draft · questions save as you write them'); }, function (e) { stamp('dirty', 'Not saved yet: ' + S.nice(e)); });
      };
    }
    draw();
  }
  function levelFor(m) { var g = m.grade || ''; if (m.programme === 'IB MYP') { var n = /MYP (\d)/.exec(g); return n ? LEVELS[+n[1] - 1] : ''; } if (m.programme === 'IB DP') return 'IB Diploma HL'; if (m.programme === 'Cambridge IGCSE') return 'IGCSE Extended'; if (m.programme === 'Cambridge A Level') return /AS/.test(g) ? 'AS Level' : 'A Level'; return ''; }

  /* ================================================================ the item being built */
  function newQ(kind, section) {
    var grp = kind === 'group', k = grp ? 'info' : kind;
    var q = { id: null, kind: k, prompt: '', marks: k === 'info' ? 0 : k === 'essay' ? 6 : RESP[k] ? 4 : 1, section: section || (ST && ST.cat === 'lesson' ? 'Explore' : 'Section A'), image: '', options: k === 'tf' ? ['True', 'False'] : k === 'mcq' ? ['', '', '', ''] : [], correct: k === 'tf' ? 0 : -1,
      model: '', points: '', rubric: '', explanation: '', feedback: '', axes: 'x,y', media: [], crit: '', diff: '', qm: { topic: '', subtopic: '', command: '', curriculum: '', tags: [], level: 0, crit: {} } };
    if (grp) { q.qm.group = true; q.prompt = ''; }
    if (QT && QT.has(k)) q.draft = QT.blank(k);
    return q;
  }
  function start(cat, quiet) {
    ST = { id: null, cat: cat, title: '', instructions: '', subject: '', time: '', attempts: cat === 'lesson' ? 3 : cat === 'exam' ? 1 : 2, show: cat !== 'exam', main: false, classes: [], pub: {}, students: [], opens: '', due: '', meta: { marking: 'points', delivery: { mode: 'online', purpose: cat === 'exam' ? 'summative' : 'formative' } }, questions: [], changed: false, ver: 0 };
    ST.questions = [newQ(cat === 'lesson' ? 'info' : 'mcq', cat === 'lesson' ? 'Question' : 'Section A')];
    SEL = 0; draw(); if (!quiet) quick();   // a new item starts with "Build it for me" (or a blank page)
  }
  function draw0() { draw(); }
  function local(id) { return 'bv-studio-draft-' + (id || 'new'); }
  function load(id) {
    app.innerHTML = '<p class="muted">Opening…</p>';
    Promise.all([S.db.from('quizzes').select('*').eq('id', id).maybeSingle(), S.db.from('quiz_classes').select('class_id,published').eq('quiz_id', id),
      S.db.from('quiz_questions').select('position, questions(*, question_answers(*))').eq('quiz_id', id).order('position'), S.db.from('quiz_students').select('student_id').eq('quiz_id', id)]).then(function (x) {
      var q = x[0].data; if (!q) { app.innerHTML = '<p class="msg">This assessment was not found, or it is not yours to edit.</p><p><a class="btn" href="#">Back to the Assessment Studio</a></p>'; return; }
      if (q.created_by !== ME.user.id && !IS_ADMIN) { app.innerHTML = '<p class="msg">Only the teacher who made this assessment can edit it. Use ⧉ Duplicate in the Assessment Studio to make your own copy.</p><p><a class="btn" href="#">Back to the Assessment Studio</a></p>'; return; }
      HAS_MAIN = 'main_site' in q;
      var pub = {}; (x[1].data || []).forEach(function (c) { pub[c.class_id] = c.published !== false; });
      ST = { id: q.id, cat: CAT[q.category] ? q.category : 'quiz', title: q.title || '', instructions: q.instructions || '', subject: q.subject || '', time: q.time_limit_minutes || '', attempts: q.max_attempts || 1, show: !!q.show_results, main: !!q.main_site,
        classes: (x[1].data || []).map(function (c) { return c.class_id; }), pub: pub, students: ((x[3] && x[3].data) || []).map(function (s) { return s.student_id; }), opens: q.opens_at || '', due: q.due_at || '', published: !!q.published,
        meta: q.meta || {}, questions: [], changed: false, removed: [], ver: 0 };
      if (!ST.meta.delivery) ST.meta.delivery = { mode: 'online', purpose: ST.cat === 'exam' ? 'summative' : 'formative' }; if (!ST.meta.marking) ST.meta.marking = 'points';
      ST.questions = (x[2].data || []).map(function (z) { return fromRow(z.questions || {}); });
      if (!ST.questions.length) ST.questions.push(newQ(ST.cat === 'lesson' ? 'info' : 'mcq', ST.cat === 'lesson' ? 'Question' : 'Section A'));
      SEL = 0; draw(); stamp('ok', 'All changes saved');
      var dr = null; try { dr = JSON.parse(localStorage.getItem(local(id)) || 'null'); } catch (e) {}
      if (dr && dr.at && dr.st && Date.parse(dr.at) > Date.parse((ST.meta.updated_at || 0)) + 2000) {
        var bar = document.createElement('div'); bar.className = 'bd-warn'; bar.style.margin = '0 0 10px'; bar.innerHTML = '💾 There are changes on this device from ' + E(new Date(dr.at).toLocaleString()) + ' that were not saved to your account. <button class="btn sm" type="button" data-r>Restore them</button> <button class="btn sm" type="button" data-d>Discard</button>';
        app.insertBefore(bar, app.firstChild.nextSibling);
        bar.querySelector('[data-r]').onclick = function () { var keepId = ST.id; ST = dr.st; ST.id = keepId; ST.changed = true; SEL = 0; draw(); stamp('dirty', 'Restored: saving…'); autosave(true); };
        bar.querySelector('[data-d]').onclick = function () { try { localStorage.removeItem(local(id)); } catch (e) {} bar.remove(); };
      }
      var tu = null; try { tu = JSON.parse(sessionStorage.getItem('bv-topup') || 'null'); sessionStorage.removeItem('bv-topup'); } catch (e) {}
      if (tu && tu.id === ST.id && tu.n > 0) { GEN.count = tu.n; GEN.types = tu.types; if (tu.crit) GEN.criteria = [tu.crit]; GEN.objectives = 'Questions on: ' + tu.title; genDialog(true, 'The question bank had ' + tu.n + ' fewer questions than you asked for. Build the rest with ✨ AI on the same topics?'); }
    });
  }

  /* ================================================================ numbering: 1 · 1(a) · 1(a)(i); a group (shared passage, diagram or data) takes the number */
  var ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'];
  function numbering() {
    var n = 0, a = 0, r = 0, out = [], top = [];
    ST.questions.forEach(function (q, i) {
      var lv = ST.cat === 'lesson' ? 0 : +((q.qm || {}).level) || 0;
      if (q.kind === 'info') { if ((q.qm || {}).group && ST.cat !== 'lesson') { n++; a = 0; r = 0; out[i] = String(n); top[i] = n; } else { out[i] = ''; top[i] = n; } return; }
      if (lv <= 0) { n++; a = 0; r = 0; out[i] = String(n); }
      else if (lv === 1) { if (!n) n = 1; a++; r = 0; out[i] = n + '(' + String.fromCharCode(96 + Math.min(a, 26)) + ')'; }
      else { if (!n) n = 1; if (!a) a = 1; r++; out[i] = n + '(' + String.fromCharCode(96 + Math.min(a, 26)) + ')(' + (ROMAN[r - 1] || r) + ')'; }
      top[i] = n;
    });
    return { label: out, top: top };
  }
  function totals() {
    var nb = numbering(), byTop = {}, bySec = {}, crit = { A: 0, B: 0, C: 0, D: 0 }, all = 0;
    ST.questions.forEach(function (q, i) { if (q.kind === 'info') return; var m = +q.marks || 0; all += m; byTop[nb.top[i]] = (byTop[nb.top[i]] || 0) + m; bySec[q.section || ''] = (bySec[q.section || ''] || 0) + m;
      var c = (q.qm || {}).crit || {}; if (Object.keys(c).length) Object.keys(c).forEach(function (k) { crit[k] = (crit[k] || 0) + (+c[k] || 0); }); else if (q.crit) crit[q.crit] += m; });
    return { nb: nb, byTop: byTop, bySec: bySec, crit: crit, all: all };
  }

  /* ================================================================ the three panels */
  var RT = 'q';   // right panel tab: q question settings · a assessment settings · p live preview
  function draw() {
    var K = CAT[ST.cat];
    app.innerHTML = '<div class="bd-top"><div style="min-width:0"><p class="label"><a href="#">← Assessment Studio</a> · <span id="stamp" class="as-save">' + (ST.id ? '' : 'Not saved yet') + '</span></p><h2 style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + K[0] + ' ' + E(ST.title || (ST.id ? 'Edit' : 'New') + ' ' + K[1].toLowerCase()) + '</h2>' +
        '<p class="small muted" style="margin:2px 0 0">' + E([ST.meta.programme, ST.meta.subject, ST.meta.grade, ST.meta.unit].filter(Boolean).join(' · ')) + '</p></div>' +
      '<div class="acts" style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" type="button" id="gen" style="background:linear-gradient(120deg,#7c3aed,#db2777);color:#fff;border-color:transparent">✨ AI questions</button><button class="btn" type="button" id="bank">📚 Bank</button><button class="btn" type="button" id="sci">🔬 Science tools</button>' +
        '<div class="as-create"><button class="btn" type="button" id="pvb" aria-haspopup="true">👁 Preview ▾</button><div class="as-menu" id="pvm" hidden role="menu"><button type="button" role="menuitem" data-pv="student">🎒 Student view (check answers)</button><button type="button" role="menuitem" data-pv="exam">⏱ Examination preview</button><button type="button" role="menuitem" data-pv="print">🖨 Printable view</button><button type="button" role="menuitem" data-pv="ms">🖨 Printable with mark scheme</button><button type="button" role="menuitem" data-pv="json">🧾 Export questions (.json)</button></div></div>' +
        (ST.id ? '<a class="btn" href="#results/' + ST.id + '">📊 Results</a>' : '') + '<button class="btn" type="button" id="pub">🚀 Publish</button><button class="btn main" type="button" id="save">💾 Save</button></div></div>' +
      '<div class="bd"><aside class="bd-col" aria-label="Assessment navigation"><h3>Questions <span class="small muted" id="tot"></span></h3><div class="bd-list" id="list"></div>' +
      '<div class="acts" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px"><button class="btn sm" type="button" id="addq">＋ Question</button>' + (ST.cat === 'lesson' ? '' : '<button class="btn sm" type="button" id="adds">＋ Section</button>') + '<button class="btn sm" type="button" id="addc">＋ Content</button></div>' +
      '<h3 style="margin-top:14px">＋ Question types</h3><div class="bd-pal" id="pal">' + KINDS.map(function (g, gi) { return '<details' + (gi === 0 ? ' open' : '') + '><summary>' + g[0] + '</summary>' + g[1].map(function (k) { return '<button type="button" data-add="' + k[0] + '">' + k[1] + ' ' + k[2] + '</button>'; }).join('') + '</details>'; }).join('') + '</div></aside>' +
      '<section class="bd-col" aria-label="Question workspace" id="ed"></section>' +
      '<aside class="bd-col" aria-label="Settings"><div class="as-rtabs" role="tablist">' + [['q', '⚙️ Question'], ['a', '📋 Assessment'], ['p', '👁 Preview']].map(function (t) { return '<button type="button" role="tab" data-rt="' + t[0] + '" aria-selected="' + (RT === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div><div id="rt"></div></aside></div>';
    app.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () { addKind(b.getAttribute('data-add')); }; });
    app.querySelector('#addq').onclick = function () { var p = app.querySelector('#pal details'); p.open = true; p.scrollIntoView({ block: 'nearest' }); p.querySelector('button').focus(); };
    app.querySelector('#addc').onclick = function () { addKind('info'); };
    var as = app.querySelector('#adds'); if (as) as.onclick = function () { var used = {}; ST.questions.forEach(function (q) { used[q.section] = 1; }); var next = 'Section ' + 'ABCDEFGHIJ'.charAt(Object.keys(used).filter(function (s) { return /^Section [A-J]/.test(s); }).length);
      var name = prompt('Name of the new section (e.g. "Section B: Structured questions")', next); if (!name) return; var q = newQ('short', name.trim()); ST.questions.push(q); SEL = ST.questions.length - 1; touch(true); };
    var pvb = app.querySelector('#pvb'), pvm = app.querySelector('#pvm'); pvb.onclick = function (e) { e.stopPropagation(); pvm.hidden = !pvm.hidden; };
    document.addEventListener('click', function off() { if (pvm) pvm.hidden = true; document.removeEventListener('click', off); });
    app.querySelectorAll('[data-pv]').forEach(function (b) { b.onclick = function () { var m = b.getAttribute('data-pv'); pvm.hidden = true; if (m === 'student') overlay(false); else if (m === 'exam') examPreview(); else if (m === 'json') exportJson(); else printView(m === 'ms'); }; });
    app.querySelector('#gen').onclick = function () { quick(!blankItems()); }; app.querySelector('#bank').onclick = bankDialog; app.querySelector('#sci').onclick = sciDialog;
    app.querySelector('#save').onclick = function () { saveNow(); };
    app.querySelector('#pub').onclick = publishDialog;
    app.querySelectorAll('[data-rt]').forEach(function (b) { b.onclick = function () { RT = b.getAttribute('data-rt'); app.querySelectorAll('[data-rt]').forEach(function (x) { x.setAttribute('aria-selected', x === b); }); right(); }; });
    list(); editor(); right();
  }
  function right() { var box = app.querySelector('#rt'); if (!box) return; if (RT === 'a') { box.innerHTML = '<div id="set"></div>'; settings(); } else if (RT === 'p') { box.innerHTML = '<p class="small muted">What the student sees for this question:</p><div class="bd-pv" id="pv"></div><p style="margin-top:10px"><button class="btn sm" type="button" id="pvall">👁 Preview the whole assessment</button></p>'; preview(); box.querySelector('#pvall').onclick = function () { overlay(false); }; } else qsettings(box); }
  function addKind(kind) {
    var cur = ST.questions[SEL] || {}, sec = cur.section || (ST.cat === 'lesson' ? 'Explore' : 'Section A'), lv = cur.qm ? (cur.kind === 'info' && cur.qm.group ? 1 : +cur.qm.level || 0) : 0;
    var q = newQ(kind, sec); if (q.kind !== 'info') q.qm.level = lv; var add = [q];
    if (kind === 'group') { var s = newQ('short', sec); s.qm.level = 1; s.marks = 2; add.push(s); }
    ST.questions.splice.apply(ST.questions, [SEL + 1, 0].concat(add)); SEL++; touch(true);
  }
  function label(q) { var t = q.kind === 'info' ? (q.prompt || ((q.qm || {}).group ? 'Shared passage, diagram or data' : 'Text, picture or video')) : (q.prompt || ''); t = T ? T.text(t) : t; return t.replace(/\s+/g, ' ').trim().slice(0, 60) || '(no question yet)'; }
  function list() {
    var box = app.querySelector('#list'); if (!box) return; var h = '', last = null, tt = totals(), nb = tt.nb;
    ST.questions.forEach(function (q, i) {
      if (q.section !== last) { last = q.section; h += ST.cat === 'lesson' ? '<p class="bd-step">' + E(q.section || 'Explore') + '</p>' : '<p class="bd-sec" data-sec="' + E(q.section || '') + '" title="Click to rename this section"><span>' + E(q.section || 'No section') + '</span><span class="m">' + (tt.bySec[q.section || ''] || 0) + ' marks</span></p>'; }
      var lv = q.kind === 'info' ? 0 : +((q.qm || {}).level) || 0, grp = q.kind === 'info' && (q.qm || {}).group, kn = grp ? KN.group : KN[q.kind] || KN.short, lab = nb.label[i];
      h += '<button type="button" draggable="true" class="bd-it l' + Math.min(lv, 2) + (grp ? ' grp' : '') + '" data-i="' + i + '" aria-current="' + (i === SEL) + '"><span class="n' + (lab.length > 2 ? ' lab' : '') + '">' + (lab || 'i') + '</span><span><span class="t">' + kn[1] + ' ' + E(label(q)) + '</span><br><span class="m">' +
        (q.kind === 'info' ? (grp ? 'Group · ' + (tt.byTop[nb.top[i]] || 0) + ' marks' : 'Content') : (q.marks || 0) + ' mark' + (+q.marks === 1 ? '' : 's') + critLine(q) + ((q.qm || {}).command ? ' · ' + E(q.qm.command) : '')) + (q.ai ? ' · 🔎 check' : '') + '</span></span><span class="m" aria-hidden="true">⠿</span></button>';
    });
    box.innerHTML = h;
    var t = app.querySelector('#tot'); if (t) t.textContent = '(' + ST.questions.filter(function (q) { return q.kind !== 'info'; }).length + ' · ' + tt.all + ' marks' + (/^myp_/.test(ST.meta.marking) && ['A', 'B', 'C', 'D'].some(function (c) { return tt.crit[c]; }) ? ' · ' + ['A', 'B', 'C', 'D'].filter(function (c) { return tt.crit[c]; }).map(function (c) { return c + ' ' + tt.crit[c]; }).join(' ') : '') + ')';
    box.querySelectorAll('[data-i]').forEach(function (b) {
      b.onclick = function () { SEL = +b.getAttribute('data-i'); if (ST.questions[SEL]) ST.questions[SEL].ai = false; list(); editor(); right(); };
      b.addEventListener('dragstart', function (e) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', b.getAttribute('data-i')); });
      b.addEventListener('dragover', function (e) { e.preventDefault(); b.classList.add('drop-before'); });
      b.addEventListener('dragleave', function () { b.classList.remove('drop-before'); });
      b.addEventListener('drop', function (e) { e.preventDefault(); b.classList.remove('drop-before'); var from = +e.dataTransfer.getData('text/plain'), to = +b.getAttribute('data-i'); if (isNaN(from) || from === to) return;
        var q = ST.questions.splice(from, 1)[0]; if (from < to) to--; q.section = ST.questions[to] ? ST.questions[to].section : q.section; ST.questions.splice(to, 0, q); SEL = to; touch(true); });
    });
    box.querySelectorAll('[data-sec]').forEach(function (p) { p.onclick = function () { var old = p.getAttribute('data-sec'), name = prompt('Rename the section', old); if (name == null || !name.trim()) return; ST.questions.forEach(function (q) { if ((q.section || '') === old) q.section = name.trim(); }); touch(true); }; });
  }
  function critLine(q) { var c = (q.qm || {}).crit || {}, ks = Object.keys(c).filter(function (k) { return +c[k] > 0; }); return ks.length ? ' · ' + ks.map(function (k) { return k + c[k]; }).join(' ') : q.crit ? ' · ' + q.crit : ''; }
  /* every change: redraw the list and preview soon; keep a copy on this device at once; autosave to the account every few seconds */
  function touch(all) { ST.changed = true; ST.ver = (ST.ver || 0) + 1; stamp('dirty', 'Unsaved changes…'); clearTimeout(touch.t); if (all) { list(); editor(); right(); } else touch.t = setTimeout(function () { list(); if (RT === 'p') preview(); }, 250);
    clearTimeout(touch.l); touch.l = setTimeout(keepLocal, 600); }
  function keepLocal() { if (!ST) return; try { localStorage.setItem(local(ST.id), JSON.stringify({ at: new Date().toISOString(), st: ST })); } catch (e) {} }
  function stamp(cls, text) { var s = document.getElementById('stamp'); if (s) { s.className = 'as-save ' + (cls || ''); s.textContent = (cls === 'ok' ? '✓ ' : cls === 'dirty' ? '● ' : '') + text; } }
  var SAVING = false;
  function autosave(force) {
    if (!ST || SAVING || !ST.changed || !ME) return;
    if (!ST.title.trim() || check().length) { if (force) stamp('dirty', 'Not saved: ' + (check()[0] || '')); else stamp('dirty', 'Unsaved: finish the question to autosave'); return; }
    SAVING = true; var ver = ST.ver; stamp('', 'Saving…');
    save().then(function (id) { SAVING = false; if (ST.ver === ver) ST.changed = false; try { localStorage.removeItem(local(null)); localStorage.removeItem(local(id)); } catch (e) {} if (location.hash !== '#edit/' + id && /^#?(new|import)/.test(location.hash)) history.replaceState(null, '', '#edit/' + id); stamp('ok', 'All changes saved ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })); },
      function (e) { SAVING = false; stamp('dirty', 'Autosave failed: ' + S.nice(e) + ' (kept on this device)'); });
  }
  setInterval(function () { if (ST && ST.changed && /^#?(edit|new)/.test(location.hash || '#new')) autosave(false); }, 20000);
  function saveNow() {
    autoFix(); list(); editor(); right(); var p = check();
    if (p.length) { overlay(true); return; }   // something is missing: the preview lists what to fix
    ST.changed = true; SAVING = false; autosave(true);
  }

  function pic(o) { return T && T.optPic ? T.optPic(o) : null; }
  function field(lab, html, hint) { return '<label class="bd-f"><span>' + lab + '</span>' + html + (hint ? '<small>' + hint + '</small>' : '') + '</label>'; }
  /* simple view: the boxes most teachers never need are folded under "More options" (filled automatically); open stays open */
  var OPEN = {};
  function tuck(box, sels, label, key) {
    var parts = sels.filter(Boolean).map(function (q) { var el = box.querySelector(q); return el && (el.closest('.bd-f') || el.closest('label') || el); }).filter(Boolean);
    if (!parts.length) return;
    var d = document.createElement('details'); d.className = 'bd-more'; d.open = !!OPEN[key]; d.innerHTML = '<summary>⚙️ ' + label + '</summary>'; d.ontoggle = function () { OPEN[key] = d.open; };
    var holder = document.createElement('div'); holder.className = 'bd-row'; d.appendChild(holder);
    var last = parts[parts.length - 1]; last.parentNode.insertBefore(d, last.nextSibling);
    parts.forEach(function (el) { (el.querySelector && el.querySelector('#e-media, #e-ex, #s-i') ? d : holder).appendChild(el); });
    var empty = [].slice.call(box.querySelectorAll('.bd-row')).filter(function (r) { return !r.children.length && r !== holder; }); empty.forEach(function (r) { r.remove(); });
  }
  function settings() {
    var box = app.querySelector('#set'); if (!box) return; var m = ST.meta, d = m.delivery || (m.delivery = {});
    box.innerHTML = field('Title', '<input id="s-t" value="' + E(ST.title) + '" placeholder="' + (ST.cat === 'lesson' ? 'e.g. Photosynthesis: how plants make food' : 'e.g. Grade 10 · Biology · Enzymes') + '">') +
      field('Description', '<textarea id="s-d" rows="2">' + E(m.description || '') + '</textarea>') +
      field('Instructions for students', '<textarea id="s-i" rows="3">' + E(ST.instructions) + '</textarea>') +
      '<div class="bd-row">' + field('Programme', '<select id="s-p"><option value="">—</option>' + PROGS.map(function (p) { return '<option' + (m.programme === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select>') +
        field('Subject', '<select id="s-su"><option value="">—</option>' + SUBJECTS.map(function (p) { return '<option' + (m.subject === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select>') + '</div>' +
      '<div class="bd-row">' + field('Grade / year', '<select id="s-g"><option value="">—</option>' + (GRADES[m.programme] || []).map(function (p) { return '<option' + (m.grade === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select>') + field('Unit / topic', '<input id="s-u" value="' + E(m.unit || '') + '">') + '</div>' +
      '<div class="bd-row">' + field('Type', '<select id="s-c">' + Object.keys(CAT).map(function (c) { return '<option value="' + c + '"' + (ST.cat === c ? ' selected' : '') + '>' + CAT[c][0] + ' ' + CAT[c][1] + '</option>'; }).join('') + '</select>') +
        field('Marking', '<select id="s-k">' + MARKING.map(function (k) { return '<option value="' + k[0] + '"' + (m.marking === k[0] ? ' selected' : '') + '>' + k[1] + '</option>'; }).join('') + '</select>') + '</div>' +
      '<div class="bd-row">' + field('Delivery', '<select id="s-dm"><option value="online"' + (d.mode !== 'paper' ? ' selected' : '') + '>💻 Online</option><option value="paper"' + (d.mode === 'paper' ? ' selected' : '') + '>🖨 Printable examination</option></select>') +
        field('Purpose', '<select id="s-pu">' + PURPOSE.map(function (p) { return '<option value="' + p[0] + '"' + (d.purpose === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') + '</select>') + '</div>' +
      '<div class="bd-row">' + field('Time limit (minutes)', '<input id="s-m" type="number" min="1" max="600" value="' + E(ST.time) + '" placeholder="none">', ST.cat === 'exam' ? 'Handed in at zero.' : 'Warns at zero; extra time is recorded.') + field('Attempts', '<input id="s-a" type="number" min="1" max="20" value="' + E(ST.attempts) + '">') + '</div>' +
      (ST.cat === 'lesson' ? '' : '<label class="chk"><input type="checkbox" id="s-r"' + (ST.show ? ' checked' : '') + '> Show scores straight after handing in (otherwise you release them)</label>') +
      field('Subject for Grades 6 to 10 science lists (MYP)', '<select id="s-s"><option value="">Not Grade 6 to 10 science</option>' + ['Biology', 'Chemistry', 'Physics'].map(function (x) { return '<option' + (ST.subject === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select>') +
      (/^myp_/.test(m.marking) ? critSummary() : '') +
      '<p class="small" style="margin-top:10px"><button class="btn sm" type="button" id="s-pub">🚀 Classes, dates and access link…</button></p>' +
      (IS_ADMIN && HAS_MAIN ? '<label class="chk" style="margin-top:8px"><input type="checkbox" id="s-main"' + (ST.main ? ' checked' : '') + '> 🌐 On the main site (admin only): every teacher can find it and add it to their classes</label>' : '');
    var on = function (sel, fn) { var el = box.querySelector(sel); if (el) el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', function () { fn(el); touch(); }); };
    on('#s-t', function (el) { ST.title = el.value; }); on('#s-i', function (el) { ST.instructions = el.value; }); on('#s-s', function (el) { ST.subject = el.value; }); on('#s-d', function (el) { m.description = el.value; });
    on('#s-p', function (el) { m.programme = el.value; m.grade = ''; settings(); }); on('#s-su', function (el) { m.subject = el.value; }); on('#s-g', function (el) { m.grade = el.value; }); on('#s-u', function (el) { m.unit = el.value; });
    on('#s-k', function (el) { m.marking = el.value; list(); settings(); if (RT === 'q') right(); }); on('#s-dm', function (el) { d.mode = el.value; }); on('#s-pu', function (el) { d.purpose = el.value; });
    on('#s-m', function (el) { ST.time = el.value; d.timed = !!+el.value; }); on('#s-a', function (el) { ST.attempts = el.value; }); on('#s-r', function (el) { ST.show = el.checked; }); on('#s-main', function (el) { ST.main = el.checked; });
    on('#s-c', function (el) { var was = ST.cat; ST.cat = el.value; if ((was === 'lesson') !== (ST.cat === 'lesson')) ST.questions.forEach(function (q) { q.section = ST.cat === 'lesson' ? (STEPS.indexOf(q.section) >= 0 ? q.section : 'Explore') : 'Section A'; }); draw(); });
    box.querySelector('#s-pub').onclick = publishDialog;
  }
  function critSummary() { var t = totals().crit; return '<div class="panel tint small" style="margin-top:8px"><b>Criterion totals</b><br>' + ['A', 'B', 'C', 'D'].map(function (c) { return c + ' (' + CRIT[c] + '): <b>' + (t[c] || 0) + '</b>'; }).join('<br>') + (ST.meta.marking === 'myp_levels' ? '<br><span class="muted">Each criterion total is converted to an achievement level 0–8 in the results.</span>' : '') + '</div>'; }

  /* ================================================================ right panel: the selected question's settings */
  function qsettings(box) {
    var q = ST.questions[SEL]; if (!q) { box.innerHTML = '<p class="muted">Choose a question on the left.</p>'; return; }
    var qm = q.qm = q.qm || { tags: [], crit: {} }; qm.tags = qm.tags || []; qm.crit = qm.crit || {};
    var critMode = /^myp_/.test(ST.meta.marking), info = q.kind === 'info', curKind = info && qm.group ? 'group' : q.kind;
    var h = field('Question type', '<select id="r-k">' + KINDS.map(function (g) { return '<optgroup label="' + g[0] + '">' + g[1].map(function (k) { return '<option value="' + k[0] + '"' + (curKind === k[0] ? ' selected' : '') + '>' + k[1] + ' ' + k[2] + '</option>'; }).join('') + '</optgroup>'; }).join('') + '</select>');
    if (!info) {
      h += critMode ? '<div class="bd-f"><span>Marks per criterion</span><div class="as-crit">' + ['A', 'B', 'C', 'D'].map(function (c) { var v = qm.crit[c]; return '<label title="' + CRIT[c] + '"><input type="checkbox" data-cc="' + c + '"' + (v != null ? ' checked' : '') + '> ' + c + ' <input type="number" min="0" max="20" step="0.5" data-cv="' + c + '" value="' + (v == null ? '' : v) + '" placeholder="pts"' + (v == null ? ' disabled' : '') + '></label>'; }).join('') + '</div><small>Total: ' + (q.marks || 0) + ' marks</small></div>'
        : '<div class="bd-row">' + field('Marks', '<input id="r-mk" type="number" min="0" max="50" step="0.5" value="' + E(q.marks) + '">') + field('MYP criterion', '<select id="r-cr"><option value="">—</option>' + ['A', 'B', 'C', 'D'].map(function (c) { return '<option' + (q.crit === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select>') + '</div>';
      h += '<div class="bd-row">' + field('Difficulty', '<select id="r-df"><option value="">—</option>' + DIFF.map(function (d, i) { return '<option value="' + (i + 1) + '"' + (+q.diff === i + 1 ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select>') +
        (ST.cat === 'lesson' ? '' : field('Numbering', '<select id="r-lv">' + [['0', 'Main question (1)'], ['1', 'Sub-question (a)'], ['2', 'Sub-part (i)']].map(function (o) { return '<option value="' + o[0] + '"' + (String(+qm.level || 0) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>')) + '</div>' +
        field('Command term', '<input id="r-ct" list="r-cts" value="' + E(qm.command || '') + '" placeholder="e.g. Explain"><datalist id="r-cts">' + COMMANDS.map(function (c) { return '<option value="' + c + '">'; }).join('') + '</datalist>');
    }
    h += '<div class="bd-row">' + field('Topic', '<input id="r-tp" value="' + E(qm.topic || '') + '" placeholder="e.g. Enzymes">') + field('Subtopic', '<input id="r-st" value="' + E(qm.subtopic || '') + '" placeholder="e.g. Denaturation">') + '</div>' +
      field('Curriculum alignment', '<input id="r-cu" value="' + E(qm.curriculum || '') + '" placeholder="e.g. IB DP C1.1.10 · MYP criterion A · IGCSE 5.1">') +
      (ST.cat === 'lesson' ? field('Lesson step', '<select id="r-sec">' + STEPS.map(function (s) { return '<option' + (q.section === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>') : field('Section', '<input id="r-sec" list="r-secs" value="' + E(q.section || '') + '"><datalist id="r-secs">' + uniq(ST.questions.map(function (x) { return x.section; }).concat(['Section A: Multiple choice', 'Section B: Structured questions', 'Section C: Data-based questions', 'Section D: Extended response'])).map(function (s) { return '<option value="' + E(s) + '">'; }).join('') + '</datalist>')) +
      '<div class="bd-f"><span>Tags</span><div class="as-chips" id="r-tags">' + qm.tags.map(function (t, i) { return '<span>' + E(t) + '<button type="button" data-tx="' + i + '" aria-label="Remove tag ' + E(t) + '">✕</button></span>'; }).join('') + '</div><input id="r-tag" placeholder="Type a tag and press Enter"></div>';
    if (!info) h += '<div class="as-sw"><span><b>Teacher explanation</b><small>Shown to students after grading</small></span><input type="checkbox" id="r-exs"' + (q.explanation ? ' checked' : '') + ' aria-label="Include a teacher explanation"></div><div id="r-exw"' + (q.explanation ? '' : ' hidden') + '>' + field('', '<textarea id="r-ex" rows="3" aria-label="Teacher explanation">' + E(q.explanation) + '</textarea>') + '</div>' +
      '<div class="as-sw"><span><b>Student feedback</b><small>How to improve: shown with the student\'s marked answer</small></span><input type="checkbox" id="r-fbs"' + (q.feedback ? ' checked' : '') + ' aria-label="Include student feedback"></div><div id="r-fbw"' + (q.feedback ? '' : ' hidden') + '>' + field('', '<textarea id="r-fb" rows="2" aria-label="Student feedback">' + E(q.feedback) + '</textarea>') + '</div>' +
      '<div class="as-sw"><span><b>Mark scheme</b><small>Only visible to teachers</small></span><button class="btn sm" type="button" id="r-ms">Edit in the workspace ↓</button></div>' +
      '<div class="as-sw"><span><b>✨ AI for this question</b><small>Rewrite, change difficulty, write the mark scheme…</small></span><button class="btn sm" type="button" id="r-ai">Open</button></div>';
    h += '<p class="small" style="margin-top:10px"><button class="btn sm" type="button" id="r-sub">＋ Sub-question</button> <button class="btn sm" type="button" id="r-bank">💾 Saved to your question bank on save</button></p>';
    box.innerHTML = h;
    var bind = function (sel, fn, ev) { var el = box.querySelector(sel); if (el) el.addEventListener(ev || (el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input'), function () { fn(el.type === 'checkbox' ? el.checked : el.value, el); touch(); }); };
    bind('#r-k', function (v) { changeKind(q, v); touch(true); });
    bind('#r-mk', function (v) { q.marks = Math.max(0, +v || 0); }); bind('#r-cr', function (v) { q.crit = v; }); bind('#r-df', function (v) { q.diff = v; });
    bind('#r-lv', function (v) { qm.level = +v || 0; list(); }); bind('#r-ct', function (v) { qm.command = v.trim(); }); bind('#r-tp', function (v) { qm.topic = v; }); bind('#r-st', function (v) { qm.subtopic = v; }); bind('#r-cu', function (v) { qm.curriculum = v; });
    bind('#r-sec', function (v) { q.section = v; }, 'change'); bind('#r-ex', function (v) { q.explanation = v; }); bind('#r-fb', function (v) { q.feedback = v; });
    bind('#r-exs', function (v) { box.querySelector('#r-exw').hidden = !v; if (!v) q.explanation = ''; else box.querySelector('#r-ex').focus(); });
    bind('#r-fbs', function (v) { box.querySelector('#r-fbw').hidden = !v; if (!v) q.feedback = ''; else box.querySelector('#r-fb').focus(); });
    box.querySelectorAll('[data-cc]').forEach(function (c) { c.onchange = function () { var k = c.getAttribute('data-cc'), inp = box.querySelector('[data-cv="' + k + '"]'); inp.disabled = !c.checked; if (c.checked) { qm.crit[k] = +inp.value || 1; inp.value = qm.crit[k]; } else delete qm.crit[k]; critSync(q); touch(); right(); }; });
    box.querySelectorAll('[data-cv]').forEach(function (inp) { inp.oninput = function () { qm.crit[inp.getAttribute('data-cv')] = Math.max(0, +inp.value || 0); critSync(q); touch(); }; });
    var tg = box.querySelector('#r-tag'); tg.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); var v = tg.value.trim().replace(/,$/, ''); if (v && qm.tags.indexOf(v) < 0) qm.tags.push(v); tg.value = ''; touch(); qsettings(box); box.querySelector('#r-tag').focus(); } };
    box.querySelectorAll('[data-tx]').forEach(function (b) { b.onclick = function () { qm.tags.splice(+b.getAttribute('data-tx'), 1); touch(); qsettings(box); }; });
    var ms = box.querySelector('#r-ms'); if (ms) ms.onclick = function () { var t = app.querySelector('#e-mo, #e-pt, #e-auto, #e-opts'); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); var f = t.querySelector ? t.querySelector('input,textarea') || t : t; if (f.focus) f.focus(); } };
    var ai = box.querySelector('#r-ai'); if (ai) ai.onclick = function () { aiOne(q); };
    box.querySelector('#r-sub').onclick = function () { var s = newQ('short', q.section); s.marks = 2; s.qm.level = Math.min(2, (q.kind === 'info' ? 0 : +qm.level || 0) + 1); var at = SEL + 1; while (ST.questions[at] && ST.questions[at].kind !== 'info' && (+((ST.questions[at].qm || {}).level) || 0) > (q.kind === 'info' ? 0 : +qm.level || 0)) at++; ST.questions.splice(at, 0, s); SEL = at; touch(true); };
    box.querySelector('#r-bank').onclick = function () { toast('Every question you save is in your question bank (📚 Bank → My questions), ready to reuse in any assessment.'); };
  }
  function uniq(a) { var o = []; a.forEach(function (x) { if (x && o.indexOf(x) < 0) o.push(x); }); return o; }
  function critSync(q) { var c = q.qm.crit, ks = Object.keys(c); if (!ks.length) return; q.marks = ks.reduce(function (a, k) { return a + (+c[k] || 0); }, 0); q.crit = ks.sort(function (a, b) { return c[b] - c[a]; })[0]; }
  /* change the type of a question, keeping what still fits */
  function changeKind(q, kind) {
    var n = newQ(kind, q.section); n.prompt = q.prompt; n.image = q.image; n.media = q.media; n.explanation = q.explanation; n.feedback = q.feedback; n.qm = q.qm; n.id = q.id; n.crit = q.crit; n.diff = q.diff;
    if (n.kind !== 'info' && q.kind !== 'info') n.marks = q.marks; if (kind === 'group') n.qm.group = true; else if (n.qm) delete n.qm.group;
    if ((kind === 'mcq' || kind === 'tf') && (q.kind === 'mcq' || q.kind === 'tf') && kind === q.kind) { n.options = q.options; n.correct = q.correct; }
    if (/^(short|essay|graph|draw|annotate|audio|video|upload)$/.test(kind)) { n.model = q.model; n.points = q.points; n.rubric = q.rubric; }
    ST.questions[SEL] = n;
  }

  function settingsLine() {
    return (ST.time ? ST.time + ' min' : 'no time limit') + ' · ' + (ST.attempts || 1) + ' attempt' + (+ST.attempts > 1 ? 's' : '') + (ST.cat === 'lesson' ? '' : ' · ' + (ST.show ? 'scores shown at once' : 'you release the scores')) + (ST.subject ? ' · ' + ST.subject : '');
  }
  function editor() {
    var box = app.querySelector('#ed'), q = ST.questions[SEL]; if (!q) { box.innerHTML = '<p class="muted">Add an item from the list on the left.</p>'; return; }
    var K = q.kind === 'info' && (q.qm || {}).group ? KN.group : KN[q.kind] || KN.short, auto = QT && QT.has(q.kind), lab = numbering().label[SEL];
    var h = '<div class="bd-top"><h3 style="margin:0">' + (lab ? '<span class="pill">' + E(lab) + '</span> ' : '') + K[1] + ' ' + K[2] + (q.kind === 'info' ? '' : ' <span class="small muted">[' + (q.marks || 0) + ']</span>') + '</h3><div class="acts"><button type="button" class="btn sm" id="up" ' + (SEL ? '' : 'disabled') + ' aria-label="Move up">▲</button><button type="button" class="btn sm" id="dn" ' + (SEL < ST.questions.length - 1 ? '' : 'disabled') + ' aria-label="Move down">▼</button>' +
      (ST.cat === 'lesson' || q.kind === 'info' ? '' : '<button type="button" class="btn sm" id="out" aria-label="Less indented (outdent)" title="Outdent">⇤</button><button type="button" class="btn sm" id="in" aria-label="More indented: make it a sub-question" title="Indent: sub-question">⇥</button>') + '<button type="button" class="btn sm" id="dup">⧉ Copy</button><button type="button" class="btn sm" id="del" style="color:#b91c1c">🗑 Remove</button></div></div>';
    if (auto && !HAS_MAIN) h += '<p class="bd-warn">This kind of question can be built and previewed now. It can be saved once the database update for the new question types is run.</p>';
    h += '<p class="small muted" style="margin:0 0 6px">Marks, criteria, command term, topic and tags are in ⚙️ Question on the right.</p>' +
      field(q.kind === 'info' ? ((q.qm || {}).group ? '🧩 Shared passage, data or instructions (students see it above the sub-questions that follow; add the diagram or graph below)' : 'Content (text; a YouTube link on its own line shows the video)') : 'Question content', '<textarea id="e-p" rows="' + (q.kind === 'info' ? 7 : 4) + '" placeholder="Write here. Tables: | a | b | rows. Formatting from the toolbar.">' + E(q.prompt) + '</textarea>') +
      (q.kind === 'label' || q.kind === 'labelfill' || q.kind === 'hotspot' ? '' : window.BVM ? '<div class="bd-f"><span>' + (q.kind === 'annotate' ? 'Picture students draw and write on' : 'Picture or diagram (optional)') + ' <button type="button" class="btn sm" id="e-lib">🧬 VistaEd diagrams</button></span><div id="e-img"></div></div>' : field('Picture (optional)', '<input id="e-img" type="url" value="' + E(q.image) + '" placeholder="https://… link to a picture">')) + (window.BVM ? '<div class="bd-f"><span>More pictures, video, sound, graphs from data and drawings (optional)</span><div id="e-media"></div></div>' : '');
    if (q.kind === 'mcq' || q.kind === 'tf') h += '<fieldset><legend>Choices: tick the correct one</legend><div id="e-opts"></div>' + (q.kind === 'mcq' ? '<button type="button" class="bd-add" id="e-oadd">＋ Add a choice</button>' : '') + '</fieldset>';
    if (RESP[q.kind]) h += '<p class="bd-warn">' + { audio: '🎙 Students record a spoken answer in the browser (or upload a sound file).', video: '🎬 Students record a short video (or upload a video file).', upload: '📎 Students upload a document, PDF, spreadsheet, photo, sound or video file (up to 50 MB).' }[q.kind] + ' Answers are private: only the student, their teachers and parents can open them. You mark them in Marking.</p>';
    if (/^(short|essay|graph|draw|annotate|audio|video|upload)$/.test(q.kind)) {
      if (q.kind === 'graph') h += field('Axis labels (x, y)', '<input id="e-ax" value="' + E(q.axes) + '" placeholder="Time / s, Distance / m">');
      h += '<h4 style="margin:12px 0 4px">📋 Mark scheme <span class="small muted">(teachers only)</span></h4>' + field('Model answer', '<textarea id="e-mo" rows="3">' + E(q.model) + '</textarea>', 'Students see it after they finish (lessons: after each step).') +
        field('Marking points, one per line', '<textarea id="e-pt" rows="4" placeholder="Releases carbon dioxide: carbon dioxide / CO2\nIt is a greenhouse gas: greenhouse">' + E(q.points) + '</textarea>', 'Write what earns the mark, then a colon and the words that show it, separated by /. Each line is one mark. Answers the rules cannot decide go to you to mark.');
      if (q.kind === 'essay') h += field('Rubric (levels and what each needs)', '<textarea id="e-ru" rows="5" placeholder="1–2: states one relevant point\n3–4: explains with an example\n5–6: evaluates with evidence and a conclusion">' + E(q.rubric) + '</textarea>', 'You mark extended answers with this rubric; the rules only suggest a mark.');
    }
    if (auto) h += '<fieldset><legend>Answer</legend><div id="e-auto"></div><div id="e-prob" class="small" style="color:#b45309;margin-top:6px"></div></fieldset>';
    box.innerHTML = h;
    tuck(box, ['#e-media'], 'Video, sound, more pictures, graphs from data and drawings', 'ed');
    var bind = function (sel, fn) { var el = box.querySelector(sel); if (el) el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () { fn(el.value); touch(); }); };
    bind('#e-sec', function (v) { q.section = v; }); bind('#e-cr', function (v) { q.crit = v; }); bind('#e-df', function (v) { q.diff = v; }); bind('#e-mk', function (v) { q.marks = Math.max(0, +v || 0); }); bind('#e-p', function (v) { q.prompt = v; }); bind('input#e-img', function (v) { q.image = String(v || '').trim(); if (q.kind === 'label' || q.kind === 'labelfill' || q.kind === 'hotspot') { q.draft.image = q.image; editor(); } });
    bind('#e-ex', function (v) { q.explanation = v; }); bind('#e-mo', function (v) { q.model = v; }); bind('#e-pt', function (v) { q.points = v; }); bind('#e-ru', function (v) { q.rubric = v; }); bind('#e-ax', function (v) { q.axes = v; });
    var opts = box.querySelector('#e-opts');
    if (opts) { var drawOpts = function () { opts.innerHTML = q.options.map(function (o, j) { return '<div class="bd-opt"><input type="radio" name="e-ok" value="' + j + '"' + (q.correct === j ? ' checked' : '') + ' aria-label="Choice ' + 'ABCDEFGH'.charAt(j) + ' is correct"><b>' + 'ABCDEFGH'.charAt(j) + '</b>' + (pic(o) ? '<img src="' + E(pic(o).src) + '" alt="" style="height:44px;max-width:80px;object-fit:contain;border-radius:6px;border:1px solid #e2e8f0">' : '') + '<input type="text" data-o="' + j + '" value="' + E(pic(o) ? pic(o).text : o) + '"' + (q.kind === 'tf' ? ' readonly' : '') + ' placeholder="' + (pic(o) ? 'Words under the picture (optional)' : '') + '" aria-label="Choice ' + 'ABCDEFGH'.charAt(j) + '">' +
        (q.kind === 'mcq' && window.BVM ? '<button type="button" class="bd-x" data-op="' + j + '" title="' + (pic(o) ? 'Change the picture' : 'Make this choice a picture') + '" aria-label="Picture for choice ' + 'ABCDEFGH'.charAt(j) + '">🖼</button>' + (pic(o) ? '<button type="button" class="bd-x" data-onp="' + j + '" title="Remove the picture" aria-label="Remove the picture from choice ' + 'ABCDEFGH'.charAt(j) + '">⊘</button>' : '') : '') +
        (q.kind === 'mcq' ? '<button type="button" class="bd-x" data-ox="' + j + '" aria-label="Remove choice ' + 'ABCDEFGH'.charAt(j) + '">✕</button>' : '') + '</div>'; }).join('');
        opts.querySelectorAll('[data-op]').forEach(function (b) { b.onclick = function () { var j = +b.getAttribute('data-op'), cur = pic(q.options[j]); BVM.open.image(cur ? { t: 'image', src: cur.src, cap: cur.text } : null, ME.user.id, function (m) { q.options[j] = '[[img:' + m.src + ']] ' + (m.cap || (cur ? cur.text : '')); drawOpts(); touch(); }); }; });
        opts.querySelectorAll('[data-onp]').forEach(function (b) { b.onclick = function () { var j = +b.getAttribute('data-onp'); q.options[j] = pic(q.options[j]).text; drawOpts(); touch(); }; });
        opts.querySelectorAll('[name=e-ok]').forEach(function (r) { r.onchange = function () { q.correct = +r.value; touch(); }; });
        opts.querySelectorAll('[data-o]').forEach(function (t) { t.oninput = function () { var j = +t.getAttribute('data-o'), pc = pic(q.options[j]); q.options[j] = pc ? '[[img:' + pc.src + ']] ' + t.value : t.value; touch(); }; });
        opts.querySelectorAll('[data-ox]').forEach(function (b) { b.onclick = function () { var j = +b.getAttribute('data-ox'); q.options.splice(j, 1); if (q.correct === j) q.correct = -1; else if (q.correct > j) q.correct--; drawOpts(); touch(); }; }); };
      drawOpts(); var oa = box.querySelector('#e-oadd'); if (oa) oa.onclick = function () { if (q.options.length < 8) { q.options.push(''); drawOpts(); } }; }
    if (auto) { if ((q.kind === 'label' || q.kind === 'labelfill' || q.kind === 'hotspot') && !q.draft.image) q.draft.image = q.image;
      var prob = function () { var p = QT.problems(q.kind, q.draft); box.querySelector('#e-prob').textContent = p.length ? '⚠ ' + p.join(' ') : ''; };
      box.querySelector('#e-auto').appendChild(QT.editor(q.kind, q.draft, function () { if (q.draft.image && (q.kind === 'label' || q.kind === 'labelfill' || q.kind === 'hotspot')) q.image = q.draft.image; prob(); touch(); })); prob(); }
    if (window.BVM) BVM.editor(box.querySelector('#e-media'), q.media = q.media || [], function () { touch(); }, { uid: ME.user.id });
    var pfh = box.querySelector('div#e-img'); if (pfh && window.BVM) BVM.picField(pfh, { value: q.image || '', uid: ME.user.id, onChange: function (src) { q.image = src; touch(); } });
    var pta = box.querySelector('#e-p'); if (pta && window.BVT) { if (BVT.richBar) BVT.richBar(pta); else if (BVT.writeBar) BVT.writeBar(pta, { table: true }); }
    var lib = box.querySelector('#e-lib'); if (lib) lib.onclick = function () { if (!window.BVSCI) return toast('The diagram library did not load. Refresh the page.'); BVSCI.pickResource(function (src) { q.image = src; touch(true); }); };
    var ib = box.querySelector('#in'), ob = box.querySelector('#out'); if (ib) ib.onclick = function () { q.qm = q.qm || {}; q.qm.level = Math.min(2, (+q.qm.level || 0) + 1); touch(true); }; if (ob) ob.onclick = function () { q.qm = q.qm || {}; q.qm.level = Math.max(0, (+q.qm.level || 0) - 1); touch(true); };
    box.querySelector('#up').onclick = function () { move(-1); }; box.querySelector('#dn').onclick = function () { move(1); };
    box.querySelector('#dup').onclick = function () { var c = JSON.parse(JSON.stringify(q)); c.id = null; ST.questions.splice(SEL + 1, 0, c); SEL++; touch(true); };
    box.querySelector('#del').onclick = function () { if (q.id) (ST.removed = ST.removed || []).push(q.id); ST.questions.splice(SEL, 1); if (!ST.questions.length) ST.questions.push(newQ('short', 'Section A')); SEL = Math.max(0, SEL - 1); touch(true); };
  }
  function move(d) { var j = SEL + d; if (j < 0 || j >= ST.questions.length) return; var q = ST.questions.splice(SEL, 1)[0]; ST.questions.splice(j, 0, q); SEL = j; touch(true); return; preview(); }

  /* ================================================================ how the student sees an item */
  function rich(t) { return T && T.rich ? T.rich(t || '') : '<p>' + E(t || '').replace(/\n/g, '<br>') + '</p>'; }
  function promptOf(q) { if (!T) return q.prompt; var md = q.media || []; if (RESP[q.kind]) return T.join(q.prompt, RESP[q.kind], '', '', md); if (q.kind === 'graph') { var a = String(q.axes || '').split(','); return T.join(q.prompt, 'graph', (a[0] || 'x').trim(), (a[1] || 'y').trim(), md); } if (q.kind === 'draw' || q.kind === 'annotate') return T.join(q.prompt, q.kind, '', '', md); var pr = T.parse(q.prompt); return T.join(q.prompt, pr.mode, pr.x, pr.y, md); }
  function studentView(q, n, onAns) {
    var wrap = document.createElement('div'); wrap.className = 'q';
    if (q.kind === 'info') { if ((q.qm || {}).group) wrap.style.cssText = 'border-left:5px solid #0e7490;padding-left:10px'; wrap.innerHTML = (n ? '<p><b>' + E(n) + '</b></p>' : '') + rich(promptOf(q)) + ((q.media || []).length && T.mediaHtml ? T.mediaHtml(q.media) : '') + (q.image ? '<img src="' + E(q.image) + '" alt="" style="max-width:100%;border-radius:10px">' : ''); return wrap; }
    var lv = +((q.qm || {}).level) || 0; if (lv && ST.cat !== 'lesson') wrap.style.marginLeft = (lv * 18) + 'px';
    wrap.innerHTML = '<p>' + (/^\d+\s*(\([a-z]\)|\.\s)/i.test(q.prompt || '') || !n ? '' : '<b>' + E(n) + (/\)$/.test(String(n)) ? '' : '.') + '</b> ') + rich(T ? T.text(q.prompt) : q.prompt).replace(/^<p>|<\/p>$/g, '') + ' <span class="pill">' + q.marks + ' mark' + (q.marks === 1 ? '' : 's') + '</span></p>' + ((q.media || []).length && T.mediaHtml ? T.mediaHtml(q.media) : '') + (q.image && q.kind !== 'annotate' && q.kind !== 'label' && q.kind !== 'hotspot' ? '<img src="' + E(q.image) + '" alt="" style="max-width:100%;max-height:320px;border-radius:10px">' : '');
    if (q.kind === 'mcq' || q.kind === 'tf') { q.options.forEach(function (o, j) { var l = document.createElement('label'); l.className = 'opt'; l.innerHTML = '<input type="radio" name="pv' + n + Math.random().toString(36).slice(2, 6) + '" value="' + j + '"> ' + (o ? (T && T.opt ? T.opt(o) : E(o)) : '(empty choice)'); l.querySelector('input').onchange = function () { onAns(j); }; wrap.appendChild(l); }); }
    else if ((q.kind === 'label' || q.kind === 'labelfill' || q.kind === 'hotspot') && !q.draft.image) { var no = document.createElement('p'); no.className = 'small muted'; no.textContent = '🖼 The picture appears here once you add it.'; wrap.appendChild(no); }
    else if (QT && QT.has(q.kind)) { var p = QT.pack(q.kind, q.draft); wrap.appendChild(QT.student(q.kind, p.options, '', onAns)); }
    else if (RESP[q.kind]) { var rp = document.createElement('div'); rp.className = 'bv-resp'; rp.style.cssText = 'border:1px dashed #94a3b8;border-radius:12px;padding:10px'; rp.innerHTML = '<p class="small muted" style="margin:0 0 6px">' + { audio: '🎙 Record your spoken answer (or upload a sound file).', video: '🎬 Record a short video answer (or upload a video file).', upload: '📎 Upload your work: a document, PDF, spreadsheet, photo, sound or video file.' }[q.kind] + '</p><span class="btn sm" aria-disabled="true">' + (q.kind === 'upload' ? '⬆ Upload a file' : '⏺ Record') + '</span> <span class="small muted">(preview: nothing is recorded or uploaded)</span>'; wrap.appendChild(rp); }
    else if (/^(graph|draw|annotate)$/.test(q.kind) && T && T.pad) { var hp = document.createElement('div'); wrap.appendChild(hp); var a = String(q.axes || '').split(','); try { T.pad(hp, { mode: q.kind, x: (a[0] || 'x').trim(), y: (a[1] || 'y').trim(), image: q.image, onchange: function () { onAns('drawn'); } }); } catch (e) {} }
    else { var ta = document.createElement('textarea'); ta.rows = q.kind === 'essay' ? 8 : q.marks >= 3 ? 5 : 3; ta.placeholder = 'Type your answer'; ta.style.cssText = 'width:100%;box-sizing:border-box;font:inherit;padding:8px;border-radius:10px;border:1px solid #cbd5e1'; ta.oninput = function () { onAns(ta.value); }; wrap.appendChild(ta); }
    return wrap;
  }
  function preview() {
    var box = app.querySelector('#pv'), q = ST.questions[SEL]; if (!box) return; box.innerHTML = ''; if (!q) return;
    box.appendChild(studentView(q, numbering().label[SEL], function () {}));
  }
  function mark(q, a) {   // the same marking the server does for the automatic kinds; written answers are marked after handing in
    if (a == null || a === '') return { got: 0, max: q.marks, text: 'No answer.' };
    if (q.kind === 'mcq' || q.kind === 'tf') return { got: a === q.correct ? q.marks : 0, max: q.marks, text: a === q.correct ? 'Correct.' : 'The correct answer is ' + (q.options[q.correct] || '(no correct choice ticked!)') + '.' };
    if (QT && QT.has(q.kind)) { var p = QT.pack(q.kind, q.draft), s = QT.score(q.kind, p.options, p.accepted, a, q.marks); return { got: s.got, max: q.marks, text: (s.of > 1 ? s.hit + ' of ' + s.of + ' correct. ' : '') + (s.hit < s.of ? 'Correct answer: ' + p.model : 'Correct.') }; }
    return { got: null, max: q.marks, text: 'Written answers are marked by your marking points after handing in' + (q.model ? '. Model answer: ' + q.model : '.') };
  }
  function overlay(saving) {
    var ov = document.createElement('div'); ov.className = 'bd-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Preview');
    autoFix(); list(); editor(); right();
    var inner = document.createElement('div'), K = CAT[ST.cat], answers = {}, probs = check(), NB = numbering().label; ov.appendChild(inner);
    inner.innerHTML = '<div class="bd-top"><div><p class="label">Preview: this is what a student sees</p><h2>' + K[0] + ' ' + E(ST.title || '(no title yet)') + '</h2></div><button class="btn" type="button" data-close>✕ Close</button></div>' + (ST.instructions ? '<p>' + E(ST.instructions) + '</p>' : '') +
      (ST.questions.some(function (q) { return q.ai; }) ? '<div class="bd-warn">🔎 ' + ST.questions.filter(function (q) { return q.ai; }).length + ' automatically built items have not been opened yet. You can save, but please check them first.</div>' : '') + (probs.length ? '<div class="bd-warn"><b>Fix these before saving:</b><ul>' + probs.map(function (p) { return '<li>' + E(p) + '</li>'; }).join('') + '</ul></div>' : '') + '<div id="ovq"></div>' +
      '<div class="acts" style="position:sticky;bottom:0;background:inherit;padding:10px 0"><button class="btn" type="button" id="ovchk">✔ Check my answers</button>' + (saving ? '<button class="btn main" type="button" id="ovsave"' + (probs.length ? ' disabled' : '') + '>💾 Looks right: save</button>' : '') + '<button class="btn" type="button" data-close>Back to editing</button><span class="msg" id="ovm" role="status"></span></div>';
    var qbox = inner.querySelector('#ovq'), n = 0, last = null;
    ST.questions.forEach(function (q, i) {
      if (q.section !== last && (ST.cat === 'lesson' || q.section)) { last = q.section; var hh = document.createElement('h3'); hh.textContent = ST.cat === 'lesson' ? (STEPS.indexOf(q.section) + 1) + '. ' + q.section : q.section; hh.style.color = '#0e7490'; qbox.appendChild(hh); }
      var v = studentView(q, NB[i], function (a) { answers[i] = a; }); v.setAttribute('data-i', i); qbox.appendChild(v); });
    inner.querySelector('#ovchk').onclick = function () { var got = 0, max = 0;
      qbox.querySelectorAll('[data-i]').forEach(function (el) { var i = +el.getAttribute('data-i'), q = ST.questions[i]; if (q.kind === 'info') return; var r = mark(q, answers[i]), old = el.querySelector('.res'); if (old) old.remove();
        var p = document.createElement('p'); p.className = 'res ' + (r.got == null ? '' : r.got === r.max ? 'good' : 'bad'); p.textContent = (r.got == null ? '✍ ' : r.got === r.max ? '✔ ' : '✘ ') + (r.got == null ? '' : r.got + ' / ' + r.max + ' · ') + r.text; el.appendChild(p); if (r.got != null) { got += r.got; max += r.max; } });
      inner.querySelector('#ovm').textContent = 'Automatic marks: ' + got + ' / ' + max + '.'; };
    inner.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { ov.remove(); }; });
    var sv = inner.querySelector('#ovsave'); if (sv) sv.onclick = function () { sv.disabled = true; inner.querySelector('#ovm').textContent = 'Saving…'; save().then(function (id) { ov.remove(); ST.changed = false; done(id); }, function (e) { sv.disabled = false; inner.querySelector('#ovm').textContent = missing038(e) ? 'Not saved: the new question types and teachers\' answer keys switch on when the database update for the builder is run. Ask the admin.' : 'Not saved: ' + S.nice(e); }); };
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') ov.remove(); });
    document.body.appendChild(ov); inner.querySelector('[data-close]').focus();
  }
  function autoFix() {   // tidy what can be tidied without asking: empty items and choices, missing marks, criteria, difficulty, title
    var keep = ST.questions.filter(function (q) { var empty = !String(q.prompt || '').trim() && !q.image && !(q.media || []).length && !(q.options || []).some(function (o) { return String(o).trim() && !/^(true|false)$/i.test(o); }) && !(q.draft && JSON.stringify(q.draft).replace(/[^A-Za-z0-9]|choices|ok|true|false|pairs|items|groups|text|value|tol|unit|cols|rows|image|spots|extra|ratio/g, '').length);
      if (empty && q.id) (ST.removed = ST.removed || []).push(q.id); return !empty; });
    if (keep.length && keep.length !== ST.questions.length) { ST.questions = keep; SEL = Math.min(SEL, keep.length - 1); }
    ST.questions.forEach(function (q) { if (q.kind !== 'mcq') return; var c = q.options[q.correct], o = q.options.filter(function (x, j) { return String(x).trim() || j === q.correct; }); q.options = o; q.correct = c == null ? -1 : o.indexOf(c); });
    autoFill();
    if (!ST.title.trim()) { var f = ST.questions.filter(function (q) { return q.kind !== 'info'; })[0]; ST.title = f ? (T ? T.text(f.prompt) : f.prompt).replace(/^\d+[\.(a-z)\s]*/, '').split(/[.?!\n]/)[0].slice(0, 70) : 'Untitled'; }
  }
  function check() {
    var out = []; if (!ST.title.trim()) out.push('Give it a title (Settings).');
    if (!ST.questions.some(function (q) { return q.kind !== 'info'; })) out.push('Add at least one question.');
    ST.questions.forEach(function (q, i) { var n = 'Item ' + (i + 1) + ': ';
      if (q.kind !== 'info' && !String(q.prompt).trim() && !(QT && QT.has(q.kind) && /gaps|cloze|table/.test(q.kind))) out.push(n + 'type the question.');
      if (q.kind === 'info' && !String(q.prompt).trim() && !q.image) out.push(n + 'add text or a picture.');
      if (q.kind === 'mcq' && (q.options.filter(function (o) { return String(o).trim(); }).length < 2 || q.correct < 0 || !String(q.options[q.correct] || '').trim())) out.push(n + 'give at least two choices and tick the correct one.');
      if (q.kind === 'tf' && q.correct < 0) out.push(n + 'tick True or False.');
      if (q.kind === 'annotate' && !q.image) out.push(n + 'add the picture to annotate.');
      if (QT && QT.has(q.kind)) QT.problems(q.kind, q.draft).forEach(function (p) { out.push(n + p); });
      if (q.kind !== 'info' && !(+q.marks > 0)) out.push(n + 'give it at least 1 mark.'); });
    return out;
  }

  /* ================================================================ ✨ Build it for me
     The teacher uploads files and/or types objectives; the files are read in the browser (site_assets/quiz-import.js);
     the server function build-draft asks the AI in small steps (plan, then a few items at a time, then pictures);
     every item lands here marked "check me" for the teacher to read, edit, preview and save.
     If the AI cannot help, the lesson is laid out from the files by fixed rules instead (the old lesson maker). */
  var LEVELS = ['Grade 6 (MYP 1)', 'Grade 7 (MYP 2)', 'Grade 8 (MYP 3)', 'Grade 9 (MYP 4)', 'Grade 10 (MYP 5)', 'IGCSE Core', 'IGCSE Extended', 'AS Level', 'A Level', 'IB Diploma SL', 'IB Diploma HL'];
  var GEN_TYPES = [['mcq', 'Multiple choice'], ['tf', 'True or false'], ['multi', 'Several correct'], ['match', 'Match'], ['order', 'Put in order'], ['classify', 'Sort into groups'], ['gaps', 'Fill in the gaps'], ['cloze', 'Drop-down sentence'], ['number', 'Calculation'], ['table', 'Complete a table'], ['short', 'Written answer'], ['essay', 'Extended answer'], ['graph', 'Draw a graph'], ['draw', 'Draw a diagram']];
  var GEN = { level: '', files: [], objectives: '', count: 0, types: null, criteria: ['A', 'C', 'D'], pics: true, mode: 'replace' };
  try { GEN.level = localStorage.getItem('bv-gen-level') || ''; } catch (e) {}
  function blankItems() { return ST.questions.every(function (q) { return !String(q.prompt || '').trim() && !(q.draft && JSON.stringify(q.draft).replace(/["\[\]{}:,]|choices|ok|true|false|t|pairs|l|r|items|groups|g|text|value|tol|unit|cols|rows|image|spots|extra|x|y|ratio/g, '').trim()); }); }
  /* ================================================================ ✨ Quick build: one screen, everything else automatic
     The teacher picks what to make, types the topic and/or drops any files, and presses Build. The builder decides:
       · a file that is a question paper → its questions are imported (diagrams cut out), with the mark scheme if one is dropped too;
       · otherwise (examinations and practice) → questions come from the site's checked question bank for the matching topics,
         and only the shortfall is written new by AI; lessons are written by AI from the topic and files;
     then marks, criteria, difficulty, title, time, attempts, results and the class are all set automatically. */
  var SIZES = { exam: [12, 20, 30], quiz: [8, 12, 20], lesson: [12, 16, 22] };
  function guessLevel(text) {
    var t = String(text || '');
    if (/\b(IB|DP\s?[12]?|diploma)\b[^\n]{0,40}\bHL\b|\bHL\b[^\n]{0,40}\b(IB|DP|biology|chemistry|physics)\b/i.test(t)) return 'IB Diploma HL';
    if (/\b(IB|DP\s?[12]?|diploma)\b[^\n]{0,40}\bSL\b|\bSL\b[^\n]{0,40}\b(IB|DP|biology|chemistry|physics)\b/i.test(t)) return 'IB Diploma SL';
    if (/\b(IB|DP\s?[12]|diploma)\b|\b[A-D][1-4]\.[1-4]\b|\bpaper 1A\b/i.test(t)) return 'IB Diploma HL';
    if (/\bA2\b|\bA Level\b|\bA-level\b/i.test(t)) return 'A Level';
    if (/\bAS\b(?: Level)?/.test(t)) return 'AS Level';
    if (/IGCSE/i.test(t)) return /\bcore\b/i.test(t) ? 'IGCSE Core' : 'IGCSE Extended';
    var g = /\b(?:grade|year|gr\.?)\s*(6|7|8|9|10)\b/i.exec(t) || /\bG(6|7|8|9|10)\b/.exec(t); if (g) return LEVELS[+g[1] - 6];
    var m = /\bMYP\s*([1-5])\b/i.exec(t); if (m) return LEVELS[+m[1] - 1];
    return '';
  }
  var STOP = /^(the|and|with|from|that|this|their|about|into|for|how|what|which|why|when|where|questions?|exam|examination|test|quiz|practice|paper|lesson|grade|level|unit|topic|year|biology|chemistry|physics|science|myp|igcse|diploma|students?|describe|explain|state|outline)$/i;
  function words(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(function (w) { return w.length >= 4 && !STOP.test(w); }); }
  function matchTopics(rows, text, level) {
    var ws = words(text); if (!ws.length) return [];
    var want = /IB/.test(level) ? /IB/ : /AS|A Level/.test(level) ? /AS|A Level/ : /Grade|MYP/.test(level) ? /MYP/ : null;
    return rows.map(function (r) { var name = (r.topic + ' ' + r.course).toLowerCase(), sc = 0; ws.forEach(function (w) { if (name.indexOf(w) >= 0) sc += 2; else if (name.indexOf(w.slice(0, 5)) >= 0) sc += 1; });
        if (want && !want.test(r.course + ' ' + r.level)) sc = 0; return { r: r, sc: sc }; })
      .filter(function (x) { return x.sc > 0 && x.r.n > 0; }).sort(function (a, b) { return b.sc - a.sc; })
      .filter(function (x, i, a) { return x.sc >= a[0].sc - 1; }).slice(0, 4).map(function (x) { return x.r; });
  }
  function isScheme(name, lines) { return /mark|\bms\b|scheme|answer|key/i.test(name || '') || lines.slice(0, 40).some(function (l) { return /mark ?scheme|marking (guide|key)|answer key|^answers?$/i.test(l); }); }
  function autoFill() {   // marks, criterion and difficulty for every question that has none
    var myp = /Grade|MYP/.test(GEN.level || '') || ST.subject;
    ST.questions.forEach(function (q) {
      if (q.kind === 'info') return; var t = (T ? T.text(q.prompt) : q.prompt) || '', mk = /\[\s*(\d{1,2})\s*\]\s*$/.exec(t);
      if (!(+q.marks > 0)) q.marks = mk ? +mk[1] : q.kind === 'essay' ? 6 : /^(short|graph|draw|annotate|table)$/.test(q.kind) ? 2 : 1;
      if (!q.diff) q.diff = q.kind === 'essay' || +q.marks >= 5 || /\b(evaluate|discuss|justify|to what extent)\b/i.test(t) ? 3 : +q.marks >= 3 || /\b(explain|analy[sz]e|calculate|suggest|predict|compare)\b/i.test(t) ? 2 : 1;
      if (myp && !q.crit) q.crit = /\b(hypothes|variable|method|plan|design|fair test|predict)/i.test(t) ? 'B' : /\b(table|graph|plot|calculate|data|results|conclusion|trend|anomal|reliab|valid)/i.test(t) ? 'C' : /\b(impact|implication|society|ethic|environment|econom|advantage|disadvantage|benefit|risk)/i.test(t) ? 'D' : 'A';
    });
  }
  function autoSettings(o) {
    var marks = ST.questions.reduce(function (a, q) { return a + (q.kind === 'info' ? 0 : +q.marks || 0); }, 0);
    if (!ST.title.trim()) ST.title = o.title || 'Untitled';
    if (!ST.instructions.trim() && ST.cat !== 'lesson') ST.instructions = ST.cat === 'exam' ? 'Answer all questions. The marks for each question are shown in brackets. Use the tools under each answer box for graphs, tables, drawings and symbols.' : 'Answer every question, then hand in to see your results and feedback.';
    if (ST.cat === 'exam' && !ST.time) ST.time = Math.max(15, Math.ceil(marks * (/IB|A Level|AS/.test(GEN.level || '') ? 1.3 : 1.1) / 5) * 5);
    if (ST.cat === 'quiz' && !ST.time) ST.time = '';
    ST.attempts = ST.cat === 'exam' ? 1 : ST.cat === 'lesson' ? 3 : 2; ST.show = ST.cat !== 'exam';
    if (!ST.subject && /Grade|MYP/.test(GEN.level || '')) { var t = (ST.title + ' ' + (o.text || '')).toLowerCase(); ST.subject = /cell|organ|plant|animal|gene|dna|ecolog|evolution|enzyme|photosynth|respirat|digest|blood|disease|species|classification/.test(t) ? 'Biology' : /atom|bond|reaction|acid|salt|element|compound|mole|metal|organic|equilibri|electroly|periodic|redox/.test(t) ? 'Chemistry' : /force|motion|energy|wave|electric|magnet|circuit|light|sound|pressure|radioact|space|gravity/.test(t) ? 'Physics' : ''; }
    if (o.cls && ST.classes.indexOf(o.cls) < 0) ST.classes.push(o.cls);
    autoFill();
  }
  function quick(addMode, focus) {
    var ov = document.createElement('div'); ov.className = 'bd-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Build');
    var inner = document.createElement('div'); ov.appendChild(inner); var files = [], cat = ST.cat, size = 1, stop = false;
    var guess = guessLevel(MYCLASSES.map(function (c) { return c.name; }).join('\n')); if (!GEN.level) { try { GEN.level = localStorage.getItem('bv-gen-level') || guess; } catch (e) { GEN.level = guess; } }
    inner.innerHTML = '<div class="bd-top"><div><p class="label">' + (addMode ? 'Add questions' : 'New') + '</p><h2>✨ ' + (addMode ? 'Add questions' : 'Build it for me') + '</h2></div><button class="btn" type="button" data-close aria-label="Close">✕</button></div>' +
      (addMode ? '' : '<div class="bd-kinds" role="radiogroup" aria-label="What to make">' + ['exam', 'quiz', 'lesson'].map(function (c) { return '<button type="button" role="radio" data-cat="' + c + '" aria-checked="' + (c === cat) + '"><span>' + CAT[c][0] + '</span>' + ({ exam: 'Examination', quiz: 'Practice questions', lesson: 'Interactive lesson' })[c] + '</button>'; }).join('') + '</div>') +
      field('What is it about?', '<textarea id="q-t" rows="2" placeholder="A topic, e.g. Enzymes and digestion · or paste your objectives">' + E(ST.title) + '</textarea>') +
      '<div class="bvm-drop" id="q-drop" tabindex="0" role="button" aria-label="Add files"><b>📎 ' + (focus === 'import' ? 'Drop the question paper and its mark scheme here' : 'Add files (optional): a question paper and mark scheme, notes or slides') + '</b><span class="small muted">PDF, Word, PowerPoint, Excel, text or photos · drop them here or click to choose</span><span class="small" id="q-fl"></span><input type="file" multiple hidden id="q-f" accept=".pdf,.docx,.dotx,.pptx,.potx,.ppsx,.xlsx,.xlsm,.odt,.odp,.ods,.csv,.tsv,.html,.htm,.rtf,.txt,.md,image/*"></div>' +
      '<div class="bd-row" style="margin-top:10px">' + field('Level', '<select id="q-l"><option value="">Choose…</option>' + LEVELS.map(function (l) { return '<option' + (GEN.level === l ? ' selected' : '') + '>' + l + '</option>'; }).join('') + '</select>') +
        field('Size', '<select id="q-n"><option value="0">Short</option><option value="1" selected>Standard</option><option value="2">Long</option></select>') +
        (addMode || !MYCLASSES.length ? '' : field('Set it for', '<select id="q-c"><option value="">Not yet (keep it in my library)</option>' + MYCLASSES.map(function (c) { return '<option value="' + c.id + '">' + E(c.name) + '</option>'; }).join('') + '</select>')) + '</div>' +
      '<p class="small muted" id="q-how"></p>' +
      '<div id="q-run" hidden><ol id="q-steps" class="small" style="line-height:1.9;margin:6px 0"></ol><div style="height:10px;border-radius:6px;background:#e2e8f0;overflow:hidden"><i id="q-bar" style="display:block;height:100%;width:0;background:linear-gradient(90deg,#4f46e5,#0ea5e9);transition:width .4s"></i></div></div>' +
      '<p class="msg" id="q-m" role="alert"></p>' +
      '<div class="acts"><button class="btn main" type="button" id="q-go">✨ Build</button><button class="btn" type="button" data-close>' + (addMode || ST.id || !blankItems() ? 'Cancel' : 'Start with a blank page') + '</button>' +
      '<button class="btn sm" type="button" id="q-adv" style="margin-left:auto">More choices (question types, criteria)…</button></div>';
    var $ = function (x) { return inner.querySelector(x); };
    var how = function () { var lesson = cat === 'lesson'; $('#q-how').textContent = files.length ? 'A question paper is imported question by question (with its diagrams and mark scheme). Notes and slides are used to ' + (lesson ? 'write the lesson.' : 'write any questions the question bank does not have.') :
      lesson ? 'A complete six-step lesson is written for the topic, with reading, real pictures and questions.' : 'Checked questions come from the site\'s question bank for this topic first; anything missing is written new and marked 🔎 for you to check.'; };
    inner.querySelectorAll('[data-cat]').forEach(function (b) { b.onclick = function () { cat = b.getAttribute('data-cat'); inner.querySelectorAll('[data-cat]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); }); how(); }; });
    var dz = $('#q-drop'), fi = $('#q-f'), showFiles = function () { $('#q-fl').textContent = files.length ? '✓ ' + files.map(function (f) { return f.name; }).join(' · ') : ''; dz.classList.toggle('on', !!files.length); how();
      if (!$('#q-t').value.trim() && files[0]) $('#q-t').value = files[0].name.replace(/\.[a-z0-9]+$/i, '').replace(/[_]+/g, ' ').trim();
      var g = guessLevel(files.map(function (f) { return f.name; }).join(' ')); if (g && !$('#q-l').value) $('#q-l').value = g; };
    dz.onclick = function (e) { if (e.target !== fi) fi.click(); }; dz.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fi.click(); } };
    fi.onchange = function () { files = files.concat([].slice.call(this.files || [])); this.value = ''; showFiles(); };
    dz.addEventListener('dragover', function (e) { e.preventDefault(); dz.classList.add('on'); }); dz.addEventListener('drop', function (e) { e.preventDefault(); files = files.concat([].slice.call(e.dataTransfer.files || [])); showFiles(); });
    $('#q-t').oninput = function () { var g = guessLevel(this.value); if (g) $('#q-l').value = g; };
    $('#q-adv').onclick = function () { stop = true; ov.remove(); if (!addMode) { ST.cat = cat; ST.title = $('#q-t').value.trim() || ST.title; } GEN.level = $('#q-l').value || GEN.level; genDialog(addMode); };
    inner.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { stop = true; ov.remove(); }; });
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#q-run').hidden) { stop = true; ov.remove(); } });
    var step = function (text, state) { var ol = $('#q-steps'), li = ol.lastElementChild; if (!li || li.dataset.done) { li = document.createElement('li'); ol.appendChild(li); } li.textContent = (state === 'ok' ? '✅ ' : state === 'warn' ? '⚠️ ' : '⏳ ') + text; if (state) li.dataset.done = 1; };
    var ui = { step: step, bar: function (f) { $('#q-bar').style.width = Math.round(f * 100) + '%'; }, stopped: function () { return stop; } };
    $('#q-go').onclick = function () {
      var text = $('#q-t').value.trim(), level = $('#q-l').value, m = $('#q-m');
      if (!text && !files.length) { m.textContent = 'Type the topic or add a file.'; $('#q-t').focus(); return; }
      if (!level) level = guessLevel(text);
      if (!level && !files.length) { m.textContent = 'Choose the level, so the questions suit your students.'; $('#q-l').focus(); return; }
      GEN.level = level; try { if (level) localStorage.setItem('bv-gen-level', level); } catch (e) {}
      if (!addMode && ST.cat !== cat) { ST.cat = cat; ST.questions.forEach(function (q) { q.section = cat === 'lesson' ? 'Explore' : ''; }); }
      var target = addMode ? SIZES[ST.cat][0] : SIZES[ST.cat][+$('#q-n').value || 0], cls = $('#q-c') ? $('#q-c').value : '', title = text.split('\n')[0].slice(0, 120);
      m.textContent = ''; inner.querySelectorAll('input,select,textarea,button:not([data-close])').forEach(function (x) { x.disabled = true; }); $('#q-run').hidden = false;
      var before = addMode ? ST.questions.slice() : [], got = { paper: 0, bank: 0, ai: 0, matched: 0, pics: 0 };
      if (!addMode) { (ST.removed = ST.removed || []).push.apply(ST.removed, ST.questions.filter(function (q) { return q.id; }).map(function (q) { return q.id; })); ST.questions = []; }
      var keep = function (items) { ST.questions = ST.questions.concat(items); };
      if (!addMode && title && !files.length) ST.title = title.charAt(0).toUpperCase() + title.slice(1);
      var Q = window.BVQ, read = [], chain = Promise.resolve();
      if (files.length && Q) { Q.IMGS.length = 0; files.forEach(function (f) { chain = chain.then(function () { step('Reading ' + f.name, ''); return Q.readFile(f).then(function (ls) { read.push({ f: f, lines: ls }); step('Read ' + f.name, 'ok'); }, function (e) { step(f.name + ': ' + (e.message || e), 'warn'); }); }); }); }
      chain.then(function () {
        ui.bar(0.15);
        // 1 · question papers in the files
        var schemes = read.filter(function (r) { return isScheme(r.f.name, r.lines); }), others = read.filter(function (r) { return schemes.indexOf(r) < 0; }), notes = [];
        others.forEach(function (r) {
          var qs = Q.parsePaper(r.lines);
          if (qs.length >= 3 && ST.cat !== 'lesson') {
            var n = 0; if (schemes.length) { n = Q.applyScheme(qs, Q.parseScheme(schemes[0].lines)); got.matched += n; }
            var items = qs.map(function (x) { var q = fromRule(x, ''); if (x.ref) q.prompt = (/^\d+$/.test(x.ref) ? x.ref + '. ' : x.ref + ' ') + q.prompt; q.ai = true; return q; });
            got.paper += items.length; got.pics += items.filter(function (q) { return q.image; }).length; keep(items);
            step(r.f.name + ': ' + items.length + ' questions imported' + (schemes.length ? ', ' + n + ' answers from the mark scheme' : '') + (got.pics ? ', ' + got.pics + ' with diagrams' : ''), 'ok');
          } else notes.push(r);
        });
        if (got.paper) return;   // a paper was dropped: that is the examination
        var noteText = notes.map(function (r) { return r.lines.filter(function (l) { return !/^\[\[img:\d+\]\]$/.test(l); }).join('\n'); }).join('\n').slice(0, 60000);
        // 2 · examinations and practice: the checked question bank first
        var bank = ST.cat === 'lesson' ? Promise.resolve() : S.db.rpc('practice_topics').then(function (r) {
          if (r.error) { step('The question bank is not available just now', 'warn'); return; }
          var tops = matchTopics(r.data || [], text + ' ' + noteText.slice(0, 400), level);
          if (!tops.length) { step('No matching topic in the question bank: new questions will be written', 'warn'); return; }
          step('Question bank: ' + tops.map(function (t) { return t.topic; }).join(', '), '');
          return S.db.rpc('bank_pick', { topic_ids: tops.map(function (t) { return t.topic_id; }), n: target, kinds: null, crit: '', diff: null }).then(function (p) {
            if (p.error || !(p.data || []).length) { step('No questions found in those topics', 'warn'); return; }
            return S.db.rpc('bank_copy', { ids: p.data }).then(function (c) { if (c.error) throw c.error;
              return S.db.from('questions').select('*, question_answers(*)').in('id', c.data || []).then(function (x) {
                var by = {}; (x.data || []).forEach(function (o) { by[o.id] = o; });
                var items = (c.data || []).map(function (id) { return by[id]; }).filter(Boolean).map(fromRow);
                if (ST.cat === 'exam') items.sort(function (a, b) { return (/^(mcq|tf)$/.test(a.kind) ? 0 : 1) - (/^(mcq|tf)$/.test(b.kind) ? 0 : 1) || (+a.marks || 0) - (+b.marks || 0); });
                got.bank = items.length; keep(items); step(items.length + ' checked questions from the question bank', 'ok'); }); });
          });
        }).catch(function (e) { step('Question bank: ' + S.nice(e), 'warn'); });
        // 3 · whatever is still missing is written new
        return bank.then(function () {
          ui.bar(0.35); var need = ST.cat === 'lesson' ? target : target - got.bank; if (need <= 0 || stop) return;
          if (ST.cat !== 'lesson' && got.bank) step('Writing ' + need + ' more question' + (need === 1 ? '' : 's') + ' with AI', '');
          GEN.count = need; GEN.types = null; GEN.objectives = text.indexOf('\n') > 0 ? text : ''; GEN.criteria = ['A', 'B', 'C', 'D']; GEN.pics = ST.cat === 'lesson'; GEN.mode = 'add';
          var have = ST.questions.slice();
          return runBuildLines({ title: title, lines: [].concat.apply([], notes.map(function (r) { return r.lines; })), ui: ui }).then(function (r) { got.ai = r.ai; }, function (e) {
            ST.questions = have; step('New questions could not be written: ' + (e.message || e), 'warn');
            if (ST.cat === 'lesson' && notes.length) { ruleBuild(title, [].concat.apply([], notes.map(function (r) { return r.lines; })), true); got.ai = ST.questions.length; }
          });
        });
      }).then(function () {
        if (stop) return;
        if (addMode) { var made = ST.questions.filter(function (q) { return before.indexOf(q) < 0; }); ST.questions = before.concat(made); SEL = before.length; } else SEL = 0;
        if (!ST.questions.length) { inner.querySelectorAll('input,select,textarea,button').forEach(function (x) { x.disabled = false; }); m.textContent = 'Nothing could be built. Add a file with questions or notes, or try a different topic.'; return; }
        if (!addMode) autoSettings({ title: title, text: text, cls: cls }); else autoFill();
        ST.changed = true; ui.bar(1); ov.remove(); draw(); quickDone(got);
      }).catch(function (e) { inner.querySelectorAll('input,select,textarea,button').forEach(function (x) { x.disabled = false; }); m.textContent = '⚠ ' + (e.message || e); });
    };
    how(); document.body.appendChild(ov); setTimeout(function () { $('#q-t').focus(); }, 30);
  }
  function runBuildLines(o) {   // runBuild with files already read (lines), adding to the items already built
    var Q = window.BVQ, imgs = [], text = (o.lines || []).map(function (l) { var m = /^\[\[img:(\d+)\]\]$/.exec(l); if (m) { if (Q && Q.IMGS[+m[1]] && Q.IMGS[+m[1]].length > 9000) imgs.push(Q.IMGS[+m[1]]); return ''; } return l; }).filter(Boolean).join('\n');
    return runBuild({ title: o.title, files: [], pre: { text: text, lines: o.lines || [], images: imgs }, ui: o.ui });
  }
  function quickDone(g) {
    var marks = ST.questions.reduce(function (a, q) { return a + (q.kind === 'info' ? 0 : +q.marks || 0); }, 0), check = ST.questions.filter(function (q) { return q.ai; }).length;
    var parts = []; if (g.paper) parts.push(g.paper + ' imported from your paper' + (g.matched ? ' (' + g.matched + ' with answers from the mark scheme)' : '')); if (g.bank) parts.push(g.bank + ' checked questions from the question bank'); if (g.ai) parts.push(g.ai + ' written new with AI');
    var cls = ST.classes.map(function (id) { return (MYCLASSES.filter(function (c) { return c.id === id; })[0] || {}).name; }).filter(Boolean);
    var n = document.createElement('div'); n.className = 'bd-ov'; n.innerHTML = '<div role="status"><h2>✅ Ready to check</h2><p><b>' + ST.questions.length + ' items, ' + marks + ' marks</b>: ' + E(parts.join(', ') || 'built') + '.</p>' +
      '<p class="small">Set automatically: ' + E(settingsLine()) + (cls.length ? ' · for ' + E(cls.join(', ')) : '') + '. Change anything under Settings.</p>' +
      (check ? '<p class="small">' + check + ' item' + (check === 1 ? ' is' : 's are') + ' marked <b>🔎 check me</b>: read ' + (check === 1 ? 'it' : 'them') + ' (new or imported questions can contain mistakes). Questions from the question bank are already checked.</p>' : '') +
      '<p class="small">When it looks right, press <b>💾 Preview and save</b>.</p><div class="acts"><button class="btn main" type="button">Start checking</button></div></div>';
    n.querySelector('button').onclick = function () { n.remove(); }; document.body.appendChild(n); n.querySelector('button').focus();
  }
  function genDialog(addMode, note) {
    var ov = document.createElement('div'); ov.className = 'bd-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Build it for me');
    var K = CAT[ST.cat], lesson = ST.cat === 'lesson', myp = function () { return /MYP/.test(GEN.level); };
    if (!GEN.count) GEN.count = lesson ? 16 : ST.cat === 'exam' ? 20 : 10;
    var inner = document.createElement('div'); ov.appendChild(inner);
    inner.innerHTML = '<div class="bd-top"><div><p class="label">' + K[0] + ' ' + K[1] + '</p><h2>✨ Build it for me</h2></div><button class="btn" type="button" data-close>✕</button></div>' +
      (note ? '<p class="bd-warn">' + E(note) + '</p>' : '') + '<p>Upload your notes, slides, worksheet or past paper, or type the objectives, or both. ' + (lesson ? 'You get a complete six-step inquiry lesson (question, explore, test, explain, challenge, reflect) with reading text, real pictures and a mix of question types.' : 'You get a complete set of questions with answer keys, marking points and model answers.') + ' Every item is marked <b>check me</b> until you have opened it. Nothing is saved until you preview and save.</p>' +
      '<div class="bd-row">' + field('Title or topic', '<input id="g-t" value="' + E(ST.title) + '" placeholder="e.g. Photosynthesis">') + field('Level', '<select id="g-l"><option value="">Choose…</option>' + LEVELS.map(function (l) { return '<option' + (GEN.level === l ? ' selected' : '') + '>' + l + '</option>'; }).join('') + '</select>') + '</div>' +
      field('Objectives or what to cover (optional)', '<textarea id="g-o" rows="3" placeholder="One per line, e.g.\nDescribe how plants make glucose\nExplain how light intensity affects the rate of photosynthesis">' + E(GEN.objectives) + '</textarea>') +
      field('Files (optional): PDF, Word, PowerPoint, Excel, web page, text or pictures', '<input id="g-f" type="file" multiple accept=".pdf,.docx,.dotx,.pptx,.potx,.ppsx,.xlsx,.xlsm,.odt,.odp,.ods,.csv,.tsv,.html,.htm,.rtf,.txt,.md,image/*">', 'Pictures in your files are used in the lesson. The files stay on your device: only their text is sent to the AI.') +
      '<div class="bd-row">' + field(lesson ? 'Length' : 'Number of questions', lesson ? '<select id="g-n"><option value="12">Short (about 12 items, 40 min)</option><option value="16">Standard (about 16 items, 60 min)</option><option value="22">Long (about 22 items, 80 min)</option></select>' : '<input id="g-n" type="number" min="3" max="40" value="' + GEN.count + '">') +
        field('If the builder already has items', '<select id="g-m"><option value="replace">Replace them</option><option value="add">Add after them</option></select>') + '</div>' +
      '<details' + (lesson ? '' : ' open') + '><summary><b>Question types</b> <span class="small muted">(all ticked = a good mix)</span></summary><div class="bd-row" style="gap:4px 14px;margin:8px 0">' + GEN_TYPES.map(function (t) { return '<label class="chk"><input type="checkbox" name="g-ty" value="' + t[0] + '"' + (!GEN.types || GEN.types.indexOf(t[0]) >= 0 ? ' checked' : '') + '> ' + KN[t[0]][1] + ' ' + t[1] + '</label>'; }).join('') + '</div><p class="small muted">Labelling and click-the-picture questions need a picture you choose, so add those by hand.</p></details>' +
      '<div id="g-crit" style="margin:8px 0"><b>MYP criteria</b> ' + ['A', 'B', 'C', 'D'].map(function (c) { return '<label class="chk" style="display:inline-flex;margin-right:10px"><input type="checkbox" name="g-cr" value="' + c + '"' + (GEN.criteria.indexOf(c) >= 0 ? ' checked' : '') + '> ' + c + '</label>'; }).join('') + '</div>' +
      (lesson ? '<label class="chk"><input type="checkbox" id="g-p"' + (GEN.pics ? ' checked' : '') + '> Find real pictures (diagrams and photos from Wikimedia Commons, with their credits) where my files have none</label>' : '') +
      '<div id="g-run" hidden><h3>Building…</h3><ol id="g-steps" class="small" style="line-height:1.9"></ol><div style="height:10px;border-radius:6px;background:#e2e8f0;overflow:hidden"><i id="g-bar" style="display:block;height:100%;width:0;background:linear-gradient(90deg,#4f46e5,#0ea5e9);transition:width .4s"></i></div><p class="small muted">The free AI service answers a few requests a minute, so a full ' + (lesson ? 'lesson' : 'set') + ' takes a few minutes. You can leave this page open and do something else.</p></div>' +
      '<p class="msg" id="g-msg" role="status"></p>' +
      '<div class="acts"><button class="btn main" type="button" id="g-go">✨ Build</button><button class="btn" type="button" data-close>' + (ST.id || !blankItems() ? 'Cancel' : 'Start with a blank page') + '</button></div>';
    var $ = function (s) { return inner.querySelector(s); };
    if (lesson) $('#g-n').value = String(GEN.count);
    if (blankItems()) $('#g-m').closest('.bd-f').hidden = true; else if (addMode) $('#g-m').value = 'add';
    var showCrit = function () { $('#g-crit').hidden = !myp(); }; showCrit();
    $('#g-l').onchange = function () { GEN.level = this.value; try { localStorage.setItem('bv-gen-level', GEN.level); } catch (e) {} showCrit(); };
    var stop = false;
    inner.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { stop = true; ov.remove(); }; });
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#g-run').hidden) ov.remove(); });
    $('#g-go').onclick = function () {
      GEN.objectives = $('#g-o').value; GEN.count = +$('#g-n').value || GEN.count; GEN.mode = $('#g-m').value; GEN.level = $('#g-l').value;
      GEN.types = [].map.call(inner.querySelectorAll('[name=g-ty]:checked'), function (c) { return c.value; }); if (GEN.types.length === GEN_TYPES.length) GEN.types = null;
      GEN.criteria = [].map.call(inner.querySelectorAll('[name=g-cr]:checked'), function (c) { return c.value; }); GEN.pics = lesson && $('#g-p').checked;
      var title = $('#g-t').value.trim(), files = [].slice.call($('#g-f').files || []);
      if (!title && !GEN.objectives.trim() && !files.length) { $('#g-msg').textContent = 'Give a title, some objectives or a file to build from.'; return; }
      if (!GEN.level) { $('#g-msg').textContent = 'Choose the level, so the language and questions suit your students.'; $('#g-l').focus(); return; }
      if (GEN.types && !GEN.types.length) { $('#g-msg').textContent = 'Tick at least one question type.'; return; }
      inner.querySelectorAll('input,select,textarea,#g-go').forEach(function (x) { x.disabled = true; }); $('#g-run').hidden = false; $('#g-msg').textContent = '';
      runBuild({ title: title, files: files, ui: { step: stepUI, bar: function (f) { $('#g-bar').style.width = Math.round(f * 100) + '%'; }, stopped: function () { return stop; } } }).then(function (res) {
        if (stop) return; ov.remove(); toastDone(res);
      }, function (e) {
        if (stop) return;
        $('#g-msg').innerHTML = '⚠ ' + E(e.message || e) + (e.fallback ? ' <button class="btn sm" type="button" id="g-rule">Lay it out from my files without AI</button>' : '');
        inner.querySelectorAll('input,select,textarea,#g-go').forEach(function (x) { x.disabled = false; });
        var rb = $('#g-rule'); if (rb) rb.onclick = function () { ruleBuild(title, e.lines || []); ov.remove(); };
      });
    };
    function stepUI(text, state) {   // state: '' running, 'ok', 'warn'
      var ol = $('#g-steps'), li = ol.lastElementChild; if (!li || li.dataset.done) { li = document.createElement('li'); ol.appendChild(li); }
      li.textContent = (state === 'ok' ? '✅ ' : state === 'warn' ? '⚠️ ' : '⏳ ') + text; if (state) li.dataset.done = 1;
    }
    document.body.appendChild(ov); $('#g-t').focus();
  }
  function call(body) {
    return S.db.functions.invoke('build-draft', { body: body }).then(function (res) {
      var d = res.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
      if ((!d || !d.ok) && res.error && res.error.context && res.error.context.json) return res.error.context.json().then(function (j) { throw Object.assign(new Error((j && j.error) || 'The AI could not be reached.'), { code: j && j.code }); }, function () { throw new Error('The AI could not be reached.'); });
      if (!d || !d.ok) throw Object.assign(new Error((d && d.error) || 'The AI could not be reached.'), { code: d && d.code });
      return d;
    });
  }
  function patient(body, ui, label) {   // the free AI allowance is per minute: wait and try again a few times
    var tries = 0;
    function go() { return call(body).catch(function (e) { if (ui.stopped()) throw e; if ((e.code === 'busy' || e.code === 'down' || !e.code) && tries++ < 3) { ui.step(label + ' (the AI is busy: waiting ' + (20 * tries) + ' seconds)', ''); return new Promise(function (r) { setTimeout(r, 20000 * tries); }).then(go); } throw e; }); }
    return go();
  }
  function readAll(files, ui) {
    var Q = window.BVQ; if (!files.length) return Promise.resolve({ text: '', lines: [], images: [] });
    if (!Q || !Q.readFile) return Promise.reject(new Error('The file reader did not load. Refresh the page and try again.'));
    Q.IMGS.length = 0; var lines = [], chain = Promise.resolve();
    files.forEach(function (f) { chain = chain.then(function () { ui.step('Reading ' + f.name, ''); return Q.readFile(f).then(function (ls) { lines = lines.concat(ls); ui.step('Read ' + f.name, 'ok'); }, function (e) { ui.step(f.name + ': ' + (e.message || e), 'warn'); }); }); });
    return chain.then(function () {
      var imgs = [], text = lines.map(function (l) { var m = /^\[\[img:(\d+)\]\]$/.exec(l); if (m) { if (Q.IMGS[+m[1]] && Q.IMGS[+m[1]].length > 9000) imgs.push(Q.IMGS[+m[1]]); /* tiny pictures are logos and icons */ return ''; } return l; }).filter(Boolean).join('\n');
      return { text: text, lines: lines, images: imgs };
    });
  }
  function fromAI(it) {   // an item written by the AI -> a builder item
    var q = newQ(it.kind, it.section || ''); q.ai = true; var cm = /criterion\s*([ABCD])\b/i.exec(it.focus || ''); if (cm) q.crit = cm[1].toUpperCase(); q.diff = it.kind === 'info' ? '' : it.kind === 'essay' || (it.marks || 1) >= 5 ? 3 : (it.marks || 1) >= 3 || /^(short|number|graph|draw|table)$/.test(it.kind) ? 2 : 1; q.section = ST.cat === 'lesson' ? (STEPS.indexOf(it.section) >= 0 ? it.section : 'Explore') : it.section || '';
    var pts = function (p) { return (p || []).map(function (x) { return x.text + (x.keywords && x.keywords.length ? ': ' + x.keywords.join(' / ') : ''); }).join('\n'); };
    var noComma = function (t) { return String(t || '').replace(/,/g, ' /'); };
    q.prompt = it.kind === 'info' ? it.text : it.prompt || ''; q.explanation = it.explanation || ''; q.marks = it.kind === 'info' ? 0 : it.marks || 1; q.imageQuery = it.image_query || '';
    if (it.kind === 'mcq') { var ord = it.options.map(function (_, i) { return i; }).sort(function () { return Math.random() - 0.5; }); q.options = ord.map(function (i) { return it.options[i]; }); q.correct = ord.indexOf(it.correct); }   /* the AI tends to put the answer first */
    else if (it.kind === 'tf') { q.options = ['True', 'False']; q.correct = it.answer ? 0 : 1; }
    else if (it.kind === 'multi') q.draft = { choices: it.choices.map(function (c) { return { t: c.text, ok: !!c.correct }; }) };
    else if (it.kind === 'match') q.draft = { pairs: it.pairs.map(function (p) { return { l: p[0], r: p[1] }; }) };
    else if (it.kind === 'order') q.draft = { items: it.items.slice() };
    else if (it.kind === 'classify') q.draft = { groups: it.groups.slice(), items: it.items.map(function (x) { return { t: x[0], g: +x[1] || 0 }; }) };
    else if (it.kind === 'gaps' || it.kind === 'cloze') q.draft = { text: it.text };
    else if (it.kind === 'number') { q.draft = { value: String(it.value), tol: it.tolerance ? String(it.tolerance) : '', unit: it.unit || '' }; q.model = it.model_answer || ''; }
    else if (it.kind === 'table') q.draft = { cols: it.columns.map(noComma).join(', '), rows: it.rows.map(function (r) { return r.map(function (c) { return /^\[[^\[\]]+\]$/.test(c) ? c : String(c).replace(/\|/g, '/'); }).join(' | '); }).join('\n') };
    else { q.model = it.model_answer || ''; q.points = pts(it.points); q.rubric = it.rubric || ''; if (it.kind === 'graph') q.axes = noComma(it.x || 'x') + ',' + noComma(it.y || 'y'); }
    if (QT && QT.has(q.kind) && QT.problems(q.kind, q.draft).length) return null;
    return q;
  }
  function runBuild(o) {
    var ui = o.ui, lesson = ST.cat === 'lesson', src, plan, made = [], total = 1;
    if (!o.pre) ui.step('Reading your files', '');
    return (o.pre ? Promise.resolve(o.pre) : readAll(o.files, ui)).then(function (r) {
      src = r; if (!o.pre) ui.step(o.files.length ? 'Files read: ' + Math.round(r.text.length / 1000) + ' thousand characters, ' + r.images.length + ' picture' + (r.images.length === 1 ? '' : 's') : 'No files: building from your title and objectives', 'ok');
      if (ui.stopped()) throw new Error('Stopped.');
      ui.step('Planning the ' + (lesson ? 'six steps' : 'sections'), ''); ui.bar(0.05);
      return patient({ mode: 'plan', kind: ST.cat, title: o.title, level: GEN.level, objectives: GEN.objectives, source: src.text, count: GEN.count, types: GEN.types || [], criteria: /MYP/.test(GEN.level) ? GEN.criteria : [] }, ui, 'Planning');
    }).then(function (d) {
      plan = d.plan; var n = 0; plan.sections.forEach(function (s) { n += s.items.length; }); total = n;
      ui.step('Plan ready: ' + plan.sections.length + (lesson ? ' steps, ' : ' sections, ') + n + ' items', 'ok');
      var batches = []; plan.sections.forEach(function (sec) { for (var i = 0; i < sec.items.length; i += 4) batches.push(sec.items.slice(i, i + 4).map(function (it) { return Object.assign({ section: sec.name }, it); })); });
      var chain = Promise.resolve(), k = 0;
      batches.forEach(function (b) { chain = chain.then(function () {
        if (ui.stopped()) throw new Error('Stopped.');
        k++; ui.step('Writing ' + (lesson ? b[0].section.toLowerCase() + ' items' : b[0].section) + ' (' + k + ' of ' + batches.length + ')', '');
        return patient({ mode: 'items', kind: ST.cat, title: plan.title || o.title, level: GEN.level, objectives: (plan.objectives || []).join('\n') || GEN.objectives, source: src.text, items: b, done: made.map(function (q) { return String(q.prompt).slice(0, 120); }) }, ui, 'Writing').then(function (r) {
          var good = 0; r.items.forEach(function (it, i) { var q = it && fromAI(Object.assign({ section: b[i].section, focus: b[i].focus }, it)); if (q) { made.push(q); good++; } });
          ui.step('Wrote ' + good + ' of ' + b.length + ' ' + (lesson ? b[0].section.toLowerCase() + ' items' : 'items in ' + b[0].section) + (good < b.length ? ' (the rest did not pass the quality checks and were left out)' : ''), good < b.length ? 'warn' : 'ok');
          ui.bar(0.1 + 0.7 * k / batches.length);
        }, function (e) { if (ui.stopped()) throw e; ui.step('A batch could not be written: ' + (e.message || e), 'warn'); });
      }); });
      return chain;
    }).then(function () {
      if (!made.some(function (q) { return q.kind !== 'info'; })) throw Object.assign(new Error('The AI could not build usable questions this time.'), { fallback: lesson, lines: src.lines });
      // lessons: the objectives open the lesson, pictures from the files go into the reading cards, then real pictures where none
      if (lesson) {
        var objs = plan.objectives || [], first = made.filter(function (q) { return q.kind === 'info' && q.section === 'Question'; })[0];
        if (objs.length) { var txt = 'By the end of this lesson you will be able to:\n' + objs.map(function (x) { return '• ' + x; }).join('\n'); if (first) first.prompt = first.prompt + '\n\n' + txt; else made.unshift(Object.assign(newQ('info', 'Question'), { prompt: '**' + (plan.title || o.title) + '**\n\n' + txt, ai: true })); }
        if (!made.some(function (q) { return q.section === 'Reflect'; })) { var rq = newQ('short', 'Reflect'); rq.prompt = 'Reflect: what is the most important idea you learned today, and what are you still unsure about? You can type, write by hand or draw.'; rq.marks = 1; rq.ai = true; made.push(rq); }
        var cards = made.filter(function (q) { return q.kind === 'info' && !q.image; }), order = ['Explore', 'Explain', 'Question', 'Challenge', 'Test', 'Reflect'];
        cards.sort(function (a, b) { return order.indexOf(a.section) - order.indexOf(b.section); });
        src.images.slice(0, 6).forEach(function (img, i) { if (cards[i]) cards[i].image = img; });
        var need = cards.filter(function (q) { return !q.image && q.imageQuery; }).slice(0, GEN.pics ? 3 : 0), chain = Promise.resolve(), j = 0;
        need.forEach(function (q) { chain = chain.then(function () {
          if (ui.stopped()) return; j++; ui.step('Finding a real picture (' + j + ' of ' + need.length + '): ' + q.imageQuery, '');
          return call({ mode: 'image', query: q.imageQuery, level: GEN.level, context: String(q.prompt).slice(0, 300) }).then(function (r) {
            if (r.image) { q.image = r.image.src; q.prompt += '\n\nPicture: ' + (r.image.caption || r.image.title) + ' Credit: ' + (r.image.artist || 'Wikimedia Commons') + ', ' + r.image.license + ', via Wikimedia Commons (' + r.image.page + ').'; ui.step('Picture found: ' + r.image.title, 'ok'); }
            else ui.step('No suitable picture found for "' + q.imageQuery + '"', 'warn');
            ui.bar(0.8 + 0.18 * j / need.length);
          }, function () { ui.step('No picture this time for "' + q.imageQuery + '"', 'warn'); });
        }); });
        return chain;
      }
    }).then(function () {
      if (ui.stopped()) throw new Error('Stopped.');
      lesson && made.sort(function (a, b) { return STEPS.indexOf(a.section) - STEPS.indexOf(b.section); });
      if (GEN.mode === 'add' && !blankItems()) ST.questions = ST.questions.concat(made); else { (ST.removed = ST.removed || []).push.apply(ST.removed, ST.questions.filter(function (q) { return q.id; }).map(function (q) { return q.id; })); ST.questions = made; }
      if (!ST.title.trim()) ST.title = plan.title || o.title;
      if (!ST.instructions.trim() && !lesson) ST.instructions = 'Answer every question. The marks for each question are shown in brackets.';
      if (/MYP|Grade/.test(GEN.level) && !ST.subject) { var t = (ST.title + ' ' + GEN.objectives).toLowerCase(); ST.subject = /cell|organ|plant|animal|gene|dna|ecolog|evolution|enzyme|photosynth|respirat|digest|blood|disease|species/.test(t) ? 'Biology' : /atom|bond|reaction|acid|salt|element|compound|mole|metal|organic|equilibri|electroly|periodic/.test(t) ? 'Chemistry' : /force|motion|energy|wave|electric|magnet|light|sound|pressure|heat|radioact|star|planet|circuit/.test(t) ? 'Physics' : ''; }
      ST.changed = true; SEL = 0; ui.bar(1); draw();
      return { n: made.length, ai: made.filter(function (q) { return q.ai; }).length, pics: made.filter(function (q) { return q.image; }).length, marks: made.reduce(function (a, q) { return a + (+q.marks || 0); }, 0) };
    }).catch(function (e) { if (!e.fallback && lesson && !made.length && src) { e.fallback = true; e.lines = src.lines; } throw e; });
  }
  function ruleBuild(title, lines, quiet) {   // no AI: lay the lesson out from the files by fixed rules (as the old lesson maker did)
    var Q = window.BVQ; if (!Q || !Q.buildLesson) return;
    var items = Q.buildLesson(title || ST.title || 'This lesson', GEN.objectives, lines.length ? lines : null, null);
    ST.questions = items.map(function (x) { var k = x.kind === 'mcq' || x.kind === 'tf' || x.kind === 'info' ? x.kind : 'short', q = newQ(k, x.section || 'Explore');
      q.prompt = x.prompt || ''; q.marks = k === 'info' ? 0 : x.marks || 1; q.image = x.image || ''; q.model = x.scheme || ''; q.explanation = x.explanation || ''; q.rubric = x.rubric || ''; q.ai = true;
      if (k === 'mcq' || k === 'tf') { q.options = (x.options || []).slice(); q.correct = x.correct == null ? -1 : x.correct; } return q; });
    if (!ST.title.trim()) ST.title = title; ST.changed = true; SEL = 0; draw();
    if (!quiet) toastDone({ n: ST.questions.length, rule: true });
  }
  function toastDone(r) {
    var n = document.createElement('div'); n.className = 'bd-ov'; n.innerHTML = '<div role="status"><h2>✨ ' + (r.rule ? 'Laid out from your files' : 'Built') + '</h2><p>' + r.n + ' items' + (r.marks ? ', ' + r.marks + ' marks' : '') + (r.pics ? ', ' + r.pics + ' with pictures' : '') + '.</p>' +
      '<p>Each item is marked <b>🔎 check me</b> until you open it. Read every question, answer key and picture: ' + (r.rule ? 'the questions are general prompts and need your own wording and marking points.' : 'AI drafts can contain mistakes.') + ' Then press <b>Preview and save</b>.</p><div class="acts"><button class="btn main" type="button">Start checking</button></div></div>';
    n.querySelector('button').onclick = function () { n.remove(); }; document.body.appendChild(n); n.querySelector('button').focus();
  }

  /* ================================================================ 📚 Question bank
     Site courses: every question in the courses on the main site (and the teacher's own), searched and filtered, copied with answer keys (bank_search, bank_copy).
     By topic: a random choice from chosen topics (practice_topics, bank_pick).
     From outside: a question paper, worksheet or pasted text read in the browser (quiz-import.js).
     With AI: "Build it for me" adding after the current items. */
  var DIFF = ['Easier', 'Medium', 'Harder'];
  var BANKKINDS = [['', 'All types'], ['mcq', '🔘 Multiple choice'], ['tf', '✅ True or false'], ['multi', '☑️ Several correct'], ['match', '🔗 Match'], ['order', '🔢 Order'], ['classify', '🗂️ Sort'], ['gaps', '✍️ Gaps'], ['cloze', '🔽 Drop-down'], ['number', '🔟 Calculation'], ['table', '▦ Table'], ['short', '✏️ Written'], ['essay', '📄 Extended'], ['graph', '📈 Graph or drawing'], ['label', '🏷️ Label'], ['hotspot', '🎯 Click the part']];
  function fromRow(o) {   // a saved question (with its answer key) -> a builder item
    var an = o.question_answers || {}; if (Array.isArray(an)) an = an[0] || {};
    var kind = o.kind, pr = T ? T.parse(o.prompt || '') : { text: o.prompt || '', mode: '', media: [] }, md = pr.mode;
    if (kind === 'short' && /^(graph|draw|annotate)$/.test(md)) kind = md; else if (kind === 'short' && /^(audio|video|file)$/.test(md)) kind = md === 'file' ? 'upload' : md; else if (kind === 'short' && an.rubric) kind = 'essay';
    if (!KN[kind]) kind = 'short';
    var out = { id: o.id, kind: kind, prompt: pr.text, media: pr.media || [], crit: o.criterion || '', diff: o.difficulty || '', marks: o.marks || 0, section: o.section || '', image: o.image_url || '', options: Array.isArray(o.options) ? o.options : [], correct: an.correct_option == null ? -1 : an.correct_option,
      model: an.model_answer || an.mark_scheme || '', rubric: an.rubric || '', explanation: an.explanation || '', axes: [pr.x || 'x', pr.y || 'y'].join(','), mode: md,
      points: (Array.isArray(an.points) ? an.points : []).map(function (p) { return (p.text || '') + ((p.any || []).length ? ': ' + p.any.join(' / ') : ''); }).join('\n'), feedback: an.improve || '' };
    var om = o.meta || {}; out.qm = { topic: om.topic || '', subtopic: om.subtopic || '', command: om.command || '', curriculum: om.curriculum || '', tags: om.tags || [], level: +om.level || 0, crit: om.crit || {} }; if (om.group) out.qm.group = true;
    if (QT && QT.has(kind)) out.draft = QT.unpack(kind, o.options, an.accepted);
    if (kind === 'short' && md === 'dropdown') out.prompt = T.join(pr.text, 'dropdown', '', '', []);
    return out;
  }
  function fromRule(x, section) {   // a question read from a file (quiz-import.js) -> a builder item
    var k = x.kind === 'mcq' || x.kind === 'tf' || x.kind === 'info' ? x.kind : 'short', q = newQ(k, section);
    q.prompt = x.prompt || ''; q.marks = k === 'info' ? 0 : x.marks || 1; q.image = x.image || ''; q.model = x.scheme || ''; q.explanation = x.explanation || ''; q.rubric = x.rubric || '';
    if (k === 'mcq' || k === 'tf') { q.options = (x.options || []).slice(); q.correct = x.correct == null ? -1 : x.correct; }
    (x.images || []).forEach(function (src) { if (src && src !== q.image) q.media.push({ t: 'image', src: src }); });
    if (k === 'short') {
      var txt = T ? T.text(q.prompt) : q.prompt, only = T && T.detect ? T.detect(txt) : '';
      if (only === 'graph') { q.kind = 'graph'; var ax = /\bgraph of (.+?) against (.+?)(?:[.,;:]|\s*\[|$)/i.exec(txt); q.axes = ax ? cap(ax[2]) + ',' + cap(ax[1]) : 'x,y'; }
      else if (only === 'draw') q.kind = q.image && /\b(label|annotate)\b/i.test(txt) ? 'annotate' : 'draw';
      else if (q.marks >= 6 && /\b(discuss|evaluate|to what extent|justify)\b/i.test(txt)) q.kind = 'essay';
      if (x.scheme) q.points = String(x.scheme).split(/\n|;\s*/).map(function (l) { return l.replace(/^[\-•*]\s*/, '').trim(); }).filter(function (l) { return l.length > 1 && !/^(accept|award|do not|allow|reject|OWTTE)\b/i.test(l); }).slice(0, 12).join('\n');
      if (q.kind === 'essay' && x.scheme) q.rubric = x.rubric || '';
    }
    return q;
  }
  function cap(t) { t = String(t || '').trim(); return t.charAt(0).toUpperCase() + t.slice(1); }

  /* ================================================================ 📄 Import a question paper (and its mark scheme)
     Like AssessPrep: the teacher drops the question paper and the mark scheme; the questions are found, the diagrams on each page are cut
     out automatically and placed with their questions, the answers come from the mark scheme, and each question gets its answer tool
     (graph, drawing, table, symbols). Everything is read in the teacher's browser; the pictures are uploaded when the item is saved. */
  function importDialog() {
    var ov = document.createElement('div'); ov.className = 'bd-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Import a question paper');
    var inner = document.createElement('div'); ov.appendChild(inner);
    var files = { paper: null, scheme: null };
    inner.innerHTML = '<div class="bd-top"><div><p class="label">Import</p><h2>📄 Import a question paper</h2></div><button class="btn" type="button" data-close aria-label="Close">✕</button></div>' +
      '<p class="small muted" style="margin-top:0">Drop the question paper and its mark scheme. The questions are found, numbered or not, every diagram, graph and table on the pages is cut out and put with its question, the answers come from the mark scheme, and each question gets its answer tools (📈 graph, ✏️ drawing, ▦ table, ⌨️ symbols). You check everything before saving.</p>' +
      '<div class="bd-row"><div class="bd-f"><span>1 · Question paper</span><div class="bvm-drop" data-z="paper" tabindex="0" role="button" aria-label="Choose or drop the question paper"><b>📄 Drop the question paper here</b><span class="small muted">or click to choose · PDF, Word, PowerPoint or a photo</span><span class="small" data-zn="paper"></span><input type="file" hidden data-zf="paper" accept=".pdf,.docx,.pptx,.odt,.txt,.md,.html,.htm,.rtf,image/*"></div></div>' +
      '<div class="bd-f"><span>2 · Mark scheme (recommended)</span><div class="bvm-drop" data-z="scheme" tabindex="0" role="button" aria-label="Choose or drop the mark scheme"><b>✅ Drop the mark scheme here</b><span class="small muted">or click to choose · PDF, Word or text</span><span class="small" data-zn="scheme"></span><input type="file" hidden data-zf="scheme" accept=".pdf,.docx,.pptx,.odt,.txt,.md,.html,.htm,.rtf"></div></div></div>' +
      '<div class="bd-row">' + field('Title', '<input id="im-t" placeholder="Taken from the file name">') + field('Make it', '<select id="im-c"><option value="exam">🎓 an examination (timed, one attempt)</option><option value="quiz">📝 exam-style questions (practice)</option></select>') + '</div>' +
      '<details><summary class="small">…or paste the questions and mark scheme as text</summary><div class="bd-row"><label class="bd-f"><span>Questions</span><textarea id="im-p" rows="6" placeholder="1. Which base pairs with adenine?\nA. Guanine\nB. Thymine\n2. Explain why enzymes denature at high temperature. [3]"></textarea></label><label class="bd-f"><span>Mark scheme</span><textarea id="im-s" rows="6" placeholder="1 B\n2 active site changes shape; substrate no longer fits"></textarea></label></div></details>' +
      '<ol class="small" id="im-log" style="margin:8px 0;padding-left:20px"></ol><p class="msg" id="im-m" role="alert"></p>' +
      '<div class="acts"><button class="btn main" type="button" id="im-go">📄 Build the ' + (ST.cat === 'quiz' ? 'questions' : 'examination') + '</button><button class="btn" type="button" data-close>Cancel</button></div>';
    var close = function () { ov.remove(); }; inner.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = close; });
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    inner.querySelector('#im-c').value = ST.cat === 'quiz' ? 'quiz' : 'exam';
    ['paper', 'scheme'].forEach(function (k) {
      var z = inner.querySelector('[data-z="' + k + '"]'), inp = inner.querySelector('[data-zf="' + k + '"]'), set = function (f) { if (!f) return; files[k] = f; inner.querySelector('[data-zn="' + k + '"]').textContent = '✓ ' + f.name; z.classList.add('on');
        if (k === 'paper' && !inner.querySelector('#im-t').value) inner.querySelector('#im-t').value = f.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim(); };
      z.onclick = function (e) { if (e.target !== inp) inp.click(); }; z.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } };
      inp.onchange = function () { set(this.files[0]); };
      z.addEventListener('dragover', function (e) { e.preventDefault(); }); z.addEventListener('drop', function (e) { e.preventDefault(); set((e.dataTransfer.files || [])[0]); });
    });
    var log = function (t) { var li = document.createElement('li'); li.textContent = t; inner.querySelector('#im-log').appendChild(li); };
    inner.querySelector('#im-go').onclick = function () {
      var Q = window.BVQ, b = this, m = inner.querySelector('#im-m'), p = inner.querySelector('#im-p').value.trim(), ps = inner.querySelector('#im-s').value.trim();
      if (!Q) { m.textContent = 'The file reader did not load. Refresh the page.'; return; }
      if (!files.paper && !p) { m.textContent = 'Drop the question paper first (or paste the questions).'; return; }
      m.textContent = ''; inner.querySelector('#im-log').innerHTML = ''; b.disabled = true; b.textContent = 'Reading…'; Q.IMGS.length = 0;
      log('Reading the question paper and cutting out its diagrams…');
      (files.paper ? Q.readFile(files.paper) : Promise.resolve(p.split('\n'))).then(function (lines) {
        var pics = lines.filter(function (l) { return /^\[\[img:\d+\]\]$/.test(l); }).length;
        log('Question paper read: ' + lines.length + ' lines, ' + pics + ' diagram' + (pics === 1 ? '' : 's') + ' and picture' + (pics === 1 ? '' : 's') + ' found.');
        var found = Q.parsePaper(lines); if (!found.length) throw new Error('No questions were found. Check that the file has text (not only pictures of pages), or paste the questions below.');
        log(found.length + ' questions found (' + found.filter(function (q) { return q.kind !== 'short'; }).length + ' multiple choice, ' + found.filter(function (q) { return q.kind === 'short'; }).length + ' written).');
        if (!files.scheme && !ps) return { found: found, matched: 0 };
        log('Reading the mark scheme…');
        return (files.scheme ? Q.readFile(files.scheme) : Promise.resolve(ps.split('\n'))).then(function (sl) { var n = Q.applyScheme(found, Q.parseScheme(sl)); log('Mark scheme: answers found for ' + n + ' of ' + found.length + ' questions.'); return { found: found, matched: n }; });
      }).then(function (r) {
        var cat = inner.querySelector('#im-c').value, items = r.found.map(function (x) { return fromRule(x, ''); });
        items.forEach(function (q, i) { var x = r.found[i]; if (x.ref) q.prompt = (/^\d+$/.test(x.ref) ? x.ref + '. ' : x.ref + ' ') + q.prompt; });   // the paper's own numbering: 1., 2(a), 2(b)(i)
        var tools = { graph: 0, draw: 0, annotate: 0 }; items.forEach(function (q) { if (tools[q.kind] != null) tools[q.kind]++; });
        log('Answer tools: ' + tools.graph + ' graph, ' + (tools.draw + tools.annotate) + ' drawing; every written answer also has ⌨️ symbols, ▦ table, 📈 graph and ✏️ drawing tools.');
        if (ST.cat !== cat) { ST.cat = cat; ST.attempts = cat === 'exam' ? 1 : 2; ST.show = cat !== 'exam'; }
        ST.title = ST.title || inner.querySelector('#im-t').value.trim() || 'Imported paper';
        if (!ST.instructions) ST.instructions = 'Answer all questions. Use the tools under each answer box for graphs, tables, drawings and symbols.';
        var marks = items.reduce(function (a, q) { return a + (+q.marks || 0); }, 0);
        if (!ST.time && cat === 'exam') ST.time = Math.max(15, Math.round(marks * 1.2 / 5) * 5);
        addItems(items, 'from the question paper' + (r.matched ? ' with ' + r.matched + ' answers from the mark scheme' : ''));
        close();
      }).catch(function (e) { b.disabled = false; b.textContent = '📄 Try again'; m.textContent = '⚠ ' + (e.message || e); });
    };
    document.body.appendChild(ov); setTimeout(function () { inner.querySelector('[data-z="paper"]').focus(); }, 30);
  }
  function addItems(items, how) {
    var sec = ST.cat === 'lesson' ? 'Test' : '';
    items.forEach(function (q) { if (ST.cat === 'lesson') q.section = STEPS.indexOf(q.section) >= 0 ? q.section : sec; else if (STEPS.indexOf(q.section) >= 0) q.section = ''; q.ai = true; });
    if (blankItems()) { (ST.removed = ST.removed || []).push.apply(ST.removed, ST.questions.filter(function (q) { return q.id; }).map(function (q) { return q.id; })); ST.questions = items; SEL = 0; }
    else { ST.questions = ST.questions.concat(items); SEL = ST.questions.length - items.length; }
    ST.changed = true; draw();
    var n = document.createElement('div'); n.className = 'bd-toast'; n.setAttribute('role', 'status'); n.textContent = '✅ ' + items.length + ' question' + (items.length === 1 ? '' : 's') + ' added ' + how + '. Check each one (🔎), then preview and save.';
    document.body.appendChild(n); setTimeout(function () { n.remove(); }, 5000);
  }
  function copyIn(ids, how) {
    return S.db.rpc('bank_copy', { ids: ids }).then(function (r) {
      if (r.error) throw r.error;
      var nid = r.data || [];
      return S.db.from('questions').select('*, question_answers(*)').in('id', nid).then(function (x) {
        if (x.error) throw x.error;
        var by = {}; (x.data || []).forEach(function (o) { by[o.id] = o; });
        addItems(nid.map(function (id) { return by[id]; }).filter(Boolean).map(fromRow), how);
      });
    });
  }
  function bankDialog() {
    var ov = document.createElement('div'); ov.className = 'bd-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Question bank');
    var inner = document.createElement('div'); inner.style.maxWidth = '980px'; ov.appendChild(inner);
    inner.innerHTML = '<div class="bd-top"><div><p class="label">Add questions</p><h2>📚 Question bank</h2></div><button class="btn" type="button" data-close>✕</button></div>' +
      '<nav class="tabs" role="tablist" aria-label="Where the questions come from"><a href="#" data-bt="site" aria-selected="true">🏫 Site courses</a><a href="#" data-bt="topic" aria-selected="false">🎯 Random by topic</a><a href="#" data-bt="out" aria-selected="false">📄 From a file or text</a><a href="#" data-bt="ai" aria-selected="false">✨ Write new with AI</a></nav><div id="bk"></div>';
    var box = inner.querySelector('#bk'), close = function () { ov.remove(); };
    inner.querySelector('[data-close]').onclick = close; ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    inner.querySelectorAll('[data-bt]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); inner.querySelectorAll('[data-bt]').forEach(function (b) { b.setAttribute('aria-selected', b === a); }); show(a.getAttribute('data-bt')); }; });
    function need039(e) { return /bank_|practice_|function .* does not exist|schema cache/i.test((e && e.message) || ''); }
    function fail(e) { return '<p class="msg">' + (need039(e) ? 'The question bank switches on when the admin runs the database update 039.' : E(S.nice(e))) + '</p>'; }
    function show(t) {
      if (t === 'ai') { close(); genDialog(true); return; }
      if (t === 'out') return outside();
      if (t === 'topic') return byTopic();
      site();
    }
    // ---- site courses
    var F = { term: '', crs: '', kind: '', crit: '', diff: '', mine: false, off: 0 }, picked = {}, cache = {};
    function site() {
      box.innerHTML = '<div class="bd-row" style="align-items:end"><label class="bd-f" style="flex:3"><span>Search</span><input id="b-q" type="search" value="' + E(F.term) + '" placeholder="e.g. enzymes, osmosis, half-life, titration"></label>' +
        '<label class="bd-f"><span>Course</span><select id="b-c"><option value="">All courses</option></select></label><label class="bd-f"><span>Type</span><select id="b-k">' + BANKKINDS.map(function (k) { return '<option value="' + k[0] + '"' + (F.kind === k[0] ? ' selected' : '') + '>' + k[1] + '</option>'; }).join('') + '</select></label>' +
        '<label class="bd-f"><span>Criterion</span>' + critSel('b-cr', F.crit) + '</label><label class="bd-f"><span>Difficulty</span>' + diffSel('b-d', F.diff) + '</label></div>' +
        '<label class="chk small"><input type="checkbox" id="b-m"' + (F.mine ? ' checked' : '') + '> Only questions I wrote</label><p class="small muted" id="b-n" role="status"></p><div id="b-r" class="bk-list"></div><div class="acts" style="position:sticky;bottom:-24px;background:var(--bg,#fff);padding:10px 0;border-top:1px solid var(--line,#e2e8f0)"><button class="btn main" type="button" id="b-add" disabled>＋ Add the chosen questions</button><button class="btn" type="button" id="b-more" hidden>Show more</button></div>';
      S.db.rpc('bank_courses').then(function (r) { var sel = box.querySelector('#b-c'); if (!sel) return; (r.data || []).forEach(function (c) { var o = document.createElement('option'); o.value = c.course; o.textContent = c.course + ' (' + c.n + ')'; if (c.course === F.crs) o.selected = true; sel.appendChild(o); }); });
      var timer, go = function () { F.term = box.querySelector('#b-q').value.trim(); F.crs = box.querySelector('#b-c').value; F.kind = box.querySelector('#b-k').value; F.crit = box.querySelector('#b-cr').value; F.diff = box.querySelector('#b-d').value; F.mine = box.querySelector('#b-m').checked; F.off = 0; run(false); };
      box.querySelector('#b-q').oninput = function () { clearTimeout(timer); timer = setTimeout(go, 350); };
      box.querySelector('#b-c').onchange = go; box.querySelector('#b-k').onchange = go; box.querySelector('#b-cr').onchange = go; box.querySelector('#b-d').onchange = go; box.querySelector('#b-m').onchange = go;
      box.querySelector('#b-more').onclick = function () { F.off += 30; run(true); };
      box.querySelector('#b-add').onclick = function () { var ids = Object.keys(picked), b = this; if (!ids.length) return; b.disabled = true; b.textContent = 'Copying…';
        copyIn(ids, 'from the question bank').then(function () { picked = {}; close(); }, function (e) { b.disabled = false; b.textContent = '＋ Add the chosen questions'; box.querySelector('#b-n').innerHTML = fail(e); }); };
      run(false);
    }
    function kindsOf(k) { return !k ? null : k === 'graph' ? ['graph', 'draw', 'annotate'] : [k]; }
    function run(more) {
      var res = box.querySelector('#b-r'), nn = box.querySelector('#b-n'); if (!more) res.innerHTML = '<p class="muted">Searching…</p>';
      S.db.rpc('bank_search', { term: F.term, crs: F.crs, kinds: kindsOf(F.kind), mine: F.mine, lim: 30, off: F.off, crit: F.crit, diff: F.diff ? +F.diff : null }).then(function (r) {
        if (!box.querySelector('#b-r')) return;
        if (r.error) { res.innerHTML = fail(r.error); return; }
        var rows = r.data || [], total = rows.length ? rows[0].total : 0; if (!more) res.innerHTML = '';
        nn.textContent = total ? total + ' question' + (total === 1 ? '' : 's') + ' found. Tick the ones you want.' : 'No questions found. Try other words or another course.';
        rows.forEach(function (o) { cache[o.id] = o; res.insertAdjacentHTML('beforeend', card(o)); });
        box.querySelector('#b-more').hidden = F.off + 30 >= total;
        res.querySelectorAll('input[data-pick]').forEach(function (c) { c.onchange = function () { if (c.checked) picked[c.value] = 1; else delete picked[c.value]; var n = Object.keys(picked).length, b = box.querySelector('#b-add'); b.disabled = !n; b.textContent = n ? '＋ Add ' + n + ' question' + (n === 1 ? '' : 's') : '＋ Add the chosen questions'; }; });
      });
    }
    function card(o) {
      var pr = T ? T.parse(o.prompt) : { text: o.prompt, mode: '' }, k = o.kind === 'short' && /^(graph|draw|annotate)$/.test(pr.mode) ? pr.mode : o.kind, kn = KN[k] || KN.short;
      var opts = Array.isArray(o.options) && o.options.length && (o.kind === 'mcq' || o.kind === 'tf') ? '<ol type="A" class="small" style="margin:4px 0 0 18px">' + o.options.slice(0, 6).map(function (x) { return '<li>' + E(String(x).slice(0, 120)) + '</li>'; }).join('') + '</ol>' : '';
      return '<label class="bk-card"><input type="checkbox" data-pick value="' + o.id + '"' + (picked[o.id] ? ' checked' : '') + '><span class="bk-body"><span class="bk-meta">' + kn[1] + ' ' + kn[2] + ' · ' + o.marks + ' mark' + (o.marks === 1 ? '' : 's') + ' · <b>' + E(o.course) + '</b>' + (o.topic ? ' · ' + E(o.topic) : '') + (o.criterion ? ' · Criterion ' + o.criterion : '') + (o.difficulty ? ' · ' + DIFF[o.difficulty - 1] : '') + (o.own ? ' · <span class="pill">mine</span>' : '') + '</span>' +
        '<span class="bk-q">' + rich(String(pr.text).slice(0, 700)) + '</span>' + (o.image_url ? '<img src="' + E(o.image_url) + '" alt="" loading="lazy" style="max-height:110px;max-width:220px;border-radius:8px">' : '') + opts + '<span class="bk-src small muted">From: ' + E(o.source || '') + '</span></span></label>';
    }
    // ---- random by topic
    function byTopic() {
      box.innerHTML = '<p class="muted">Loading the topics…</p>';
      S.db.rpc('practice_topics').then(function (r) {
        if (r.error) { box.innerHTML = fail(r.error); return; }
        box.innerHTML = topicPicker(r.data || [], 'bt') + '<div class="bd-row" style="align-items:end"><label class="bd-f"><span>How many questions</span><input id="t-n" type="number" min="1" max="60" value="10"></label><label class="bd-f"><span>Type</span><select id="t-k">' + BANKKINDS.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select></label><label class="bd-f"><span>Criterion</span>' + critSel('t-cr', '') + '</label><label class="bd-f"><span>Difficulty</span>' + diffSel('t-d', '') + '</label></div>' +
          '<p class="msg" id="t-m" role="status"></p><div class="acts"><button class="btn main" type="button" id="t-go">🎲 Pick and add the questions</button></div>';
        wirePicker(box, 'bt');
        box.querySelector('#t-go').onclick = function () {
          var ids = chosenTopics(box, 'bt'), b = this, m = box.querySelector('#t-m'); if (!ids.length) { m.textContent = 'Tick at least one topic.'; return; }
          b.disabled = true; b.textContent = 'Picking…';
          S.db.rpc('bank_pick', { topic_ids: ids, n: +box.querySelector('#t-n').value || 10, kinds: kindsOf(box.querySelector('#t-k').value), crit: box.querySelector('#t-cr').value, diff: +box.querySelector('#t-d').value || null }).then(function (r) {
            if (r.error) throw r.error; if (!(r.data || []).length) throw new Error('No questions of that type in these topics. Choose another type or more topics.');
            return copyIn(r.data, 'from the chosen topics');
          }).then(close, function (e) { b.disabled = false; b.textContent = '🎲 Pick and add the questions'; m.innerHTML = fail(e); });
        };
      });
    }
    // ---- from a file or text
    function outside() {
      box.innerHTML = '<p class="small muted">Questions from a paper, worksheet, textbook or another website. Questions are found automatically, numbered or not: lettered choices become multiple choice, the rest written answers. Add the mark scheme to fill in the answers.</p>' +
        '<div class="bd-row"><label class="bd-f"><span>Question paper or worksheet (PDF, Word, PowerPoint, text, picture)</span><input id="o-f" type="file" accept=".pdf,.docx,.pptx,.txt,.md,.html,.htm,.rtf,.odt,image/*"></label><label class="bd-f"><span>Mark scheme (optional)</span><input id="o-s" type="file" accept=".pdf,.docx,.pptx,.txt,.md,.html,.htm,.rtf,.odt"></label></div>' +
        '<details><summary class="small">…or paste the questions</summary><div class="bd-row"><label class="bd-f"><span>Questions</span><textarea id="o-p" rows="7" placeholder="1. Which base pairs with adenine?\nA. Guanine\nB. Thymine\nC. Uracil\nD. Cytosine\n2. Explain why enzymes denature at high temperature. [3]"></textarea></label><label class="bd-f"><span>Mark scheme</span><textarea id="o-ps" rows="7" placeholder="1 B\n2 active site changes shape; substrate no longer fits; bonds break"></textarea></label></div></details>' +
        '<p class="msg" id="o-m" role="status"></p><div class="acts"><button class="btn main" type="button" id="o-go">Read the questions</button></div><div id="o-r" class="bk-list"></div>';
      var found = [];
      box.querySelector('#o-go').onclick = function () {
        var Q = window.BVQ, f = box.querySelector('#o-f').files[0], sf = box.querySelector('#o-s').files[0], p = box.querySelector('#o-p').value.trim(), ps = box.querySelector('#o-ps').value.trim(), m = box.querySelector('#o-m');
        if (!Q) { m.textContent = 'The file reader did not load. Refresh the page.'; return; }
        if (!f && !p) { m.textContent = 'Choose a file or paste the questions.'; return; }
        m.textContent = 'Reading…'; Q.IMGS.length = 0;
        Promise.all([f ? Q.readFile(f) : Promise.resolve(p.split('\n')), sf ? Q.readFile(sf) : Promise.resolve(ps ? ps.split('\n') : null)]).then(function (x) {
          found = Q.parsePaper(x[0]); if (!found.length) throw new Error('No questions were found. Check that the file has text (not only pictures of pages), or paste the questions below.');
          var matched = x[1] ? Q.applyScheme(found, Q.parseScheme(x[1])) : 0;
          m.textContent = found.length + ' questions found' + (x[1] ? ', ' + matched + ' matched to the mark scheme' : '') + '. Untick any you do not want.';
          box.querySelector('#o-r').innerHTML = found.map(function (q, i) { return '<label class="bk-card"><input type="checkbox" data-o="' + i + '" checked><span class="bk-body"><span class="bk-meta">' + (q.kind === 'short' ? '✏️ Written' : q.kind === 'tf' ? '✅ True or false' : '🔘 Multiple choice') + ' · ' + q.marks + ' mark' + (q.marks === 1 ? '' : 's') + (q.scheme || q.correct >= 0 ? ' · answer found' : ' · <b style="color:#b45309">add the answer</b>') + '</span><span class="bk-q">' + rich(String(q.prompt).slice(0, 600)) + '</span>' + (q.image ? '<img src="' + E(q.image) + '" alt="" style="max-height:110px;border-radius:8px">' : '') + '</span></label>'; }).join('') +
            '<div class="acts"><button class="btn main" type="button" id="o-add">＋ Add the ticked questions</button></div>';
          box.querySelector('#o-add').onclick = function () { var items = found.filter(function (q, i) { var c = box.querySelector('[data-o="' + i + '"]'); return c && c.checked; }).map(function (q) { return fromRule(q, ''); }); if (!items.length) return; addItems(items, 'from your file'); close(); };
        }).catch(function (e) { m.textContent = '⚠ ' + (e.message || e); });
      };
    }
    document.body.appendChild(ov); site(); setTimeout(function () { var q = box.querySelector('#b-q'); if (q) q.focus(); }, 30);
  }
  // topics grouped by course and level, with a tick box each (also used by "Generate from topics")
  function topicPicker(rows, key) {
    var by = {}, order = []; rows.forEach(function (t) { var g = t.course + (t.level ? ' · ' + t.level : ''); if (!by[g]) { by[g] = []; order.push(g); } by[g].push(t); });
    if (!order.length) return '<p class="emptybox">No topics with questions yet.</p>';
    return '<label class="bd-f"><span>Course and level</span><select data-tg="' + key + '">' + order.map(function (g, i) { return '<option value="' + i + '">' + E(g) + ' (' + by[g].length + ' topics)</option>'; }).join('') + '</select></label>' +
      order.map(function (g, i) { return '<fieldset class="bk-topics" data-tset="' + key + '-' + i + '"' + (i ? ' hidden' : '') + '><legend>Topics <button type="button" class="btn sm" data-tall>Tick all</button></legend>' + by[g].map(function (t) { return '<label class="chk"><input type="checkbox" data-topic="' + key + '" value="' + t.topic_id + '"> ' + E(t.topic) + ' <span class="small muted">(' + t.n + ')</span></label>'; }).join('') + '</fieldset>'; }).join('');
  }
  function wirePicker(root, key) {
    var sel = root.querySelector('[data-tg="' + key + '"]'); if (!sel) return;
    sel.onchange = function () { root.querySelectorAll('[data-tset^="' + key + '-"]').forEach(function (f) { var on = f.getAttribute('data-tset') === key + '-' + sel.value; f.hidden = !on; if (!on) f.querySelectorAll('input').forEach(function (c) { c.checked = false; }); }); };
    root.querySelectorAll('[data-tall]').forEach(function (b) { b.onclick = function () { var cs = b.closest('fieldset').querySelectorAll('input'), all = [].every.call(cs, function (c) { return c.checked; }); cs.forEach(function (c) { c.checked = !all; }); b.textContent = all ? 'Tick all' : 'Untick all'; }; });
  }
  function chosenNames(root, key) { return [].map.call(root.querySelectorAll('[data-topic="' + key + '"]:checked'), function (c) { return c.parentNode.textContent.replace(/\(\d+\)\s*$/, '').trim(); }); }
  function critSel(id, v) { return '<select id="' + id + '"><option value="">Any</option>' + ['A', 'B', 'C', 'D'].map(function (c) { return '<option' + (v === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select>'; }
  function diffSel(id, v) { return '<select id="' + id + '"><option value="">Any</option>' + DIFF.map(function (d, i) { return '<option value="' + (i + 1) + '"' + (String(v) === String(i + 1) ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select>'; }
  function chosenTopics(root, key) { return [].map.call(root.querySelectorAll('[data-topic="' + key + '"]:checked'), function (c) { return c.value; }); }
  // library: a whole new draft generated from topics (practice_make, teacher mode) and opened in the builder
  function generateDialog() {
    var ov = document.createElement('div'); ov.className = 'bd-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Generate from topics');
    var inner = document.createElement('div'); ov.appendChild(inner); inner.innerHTML = '<div class="bd-top"><div><p class="label">Question bank</p><h2>🎯 Generate questions from topics</h2></div><button class="btn" type="button" data-close>✕</button></div><div id="gt"><p class="muted">Loading the topics…</p></div>';
    inner.querySelector('[data-close]').onclick = function () { ov.remove(); }; document.body.appendChild(ov);
    var box = inner.querySelector('#gt');
    S.db.rpc('practice_topics').then(function (r) {
      if (r.error) { box.innerHTML = '<p class="msg">' + (/practice_|schema cache|does not exist/.test(r.error.message || '') ? 'This switches on when the admin runs the database update 039.' : E(S.nice(r.error))) + '</p>'; return; }
      box.innerHTML = '<p class="small muted">The questions are copied into a new draft in your library with their answer keys. Edit anything, then preview, save and set it for your classes.</p>' + topicPicker(r.data || [], 'gd') +
        '<div class="bd-row" style="align-items:end"><label class="bd-f" style="flex:2"><span>Title (optional)</span><input id="g2-t" placeholder="e.g. Cells and transport: revision questions"></label><label class="bd-f"><span>How many questions</span><input id="g2-n" type="number" min="3" max="40" value="12"></label><label class="bd-f"><span>Type</span><select id="g2-k">' + BANKKINDS.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select></label><label class="bd-f"><span>Criterion</span>' + critSel('g2-cr', '') + '</label><label class="bd-f"><span>Difficulty</span>' + diffSel('g2-d', '') + '</label></div>' +
        '<label class="chk small"><input type="checkbox" id="g2-ai" checked> If the bank has too few questions, top up with ✨ new AI questions on the same topics (you check them before saving)</label>' +
        '<p class="msg" id="g2-m" role="status"></p><div class="acts"><button class="btn main" type="button" id="g2-go">🎲 Generate</button></div>';
      wirePicker(box, 'gd');
      box.querySelector('#g2-go').onclick = function () {
        var ids = chosenTopics(box, 'gd'), b = this, m = box.querySelector('#g2-m'); if (!ids.length) { m.textContent = 'Tick at least one topic.'; return; }
        var k = box.querySelector('#g2-k').value; b.disabled = true; b.textContent = 'Generating…';
        var want = +box.querySelector('#g2-n').value || 12, crit = box.querySelector('#g2-cr').value, diff = +box.querySelector('#g2-d').value || null, names = chosenNames(box, 'gd');
        S.db.rpc('practice_make', { topic_ids: ids, n: want, kinds: k === 'graph' ? ['short'] : k ? [k] : null, set_title: box.querySelector('#g2-t').value.trim() || null, crit: crit, diff: diff }).then(function (r) {
          if (r.error) throw r.error;
          return S.db.from('quiz_questions').select('question_id', { count: 'exact', head: true }).eq('quiz_id', r.data).then(function (c) {
            var got = c && c.count != null ? c.count : c && Array.isArray(c.data) ? c.data.length : want;
            if (got < want && box.querySelector('#g2-ai').checked) { try { sessionStorage.setItem('bv-topup', JSON.stringify({ id: r.data, n: want - got, title: names.join(', '), types: k ? [k === 'graph' ? 'graph' : k] : null, crit: crit })); } catch (e) {} }
            ov.remove(); location.hash = 'edit/' + r.data; });
        }).catch(function (e) { b.disabled = false; b.textContent = '🎲 Generate'; m.textContent = '⚠ ' + S.nice(e); });
      };
    });
  }

  /* ================================================================ saving */
  function points(text) { return String(text || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) { var i = l.indexOf(':'), t = i > 0 ? l.slice(0, i).trim() : l, w = i > 0 ? l.slice(i + 1).split('/').map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean) : [t.toLowerCase()]; return { text: t, any: w, all: [], marks: 1 }; }); }
  function rowOf(q, lab) {
    var dbKind = /^(essay|graph|draw|annotate|audio|video|upload)$/.test(q.kind) ? 'short' : q.kind, r = { kind: dbKind, prompt: promptOf(q), marks: q.kind === 'info' ? 0 : +q.marks || 0, section: q.section || null, image_url: q.image || null, options: [], criterion: q.kind === 'info' ? null : q.crit || null, difficulty: q.kind === 'info' ? null : +q.diff || null },
      a = { correct_option: null, model_answer: q.model || null, mark_scheme: q.model || null, explanation: q.explanation || null, rubric: q.rubric || null, points: null, accepted: null, improve: q.feedback || null };
    var qm = q.qm || {}; r.meta = { topic: qm.topic || '', subtopic: qm.subtopic || '', command: qm.command || '', curriculum: qm.curriculum || '', tags: qm.tags || [], level: +qm.level || 0, crit: qm.crit || {}, label: lab == null ? '' : lab }; if (qm.group) r.meta.group = true; if (ST.cat === 'lesson') delete r.meta.label;
    if (q.kind === 'mcq' || q.kind === 'tf') { r.options = q.options.map(function (o) { return String(o).trim(); }).filter(function (o, j) { return o || j === q.correct; }); a.correct_option = q.correct; a.model_answer = r.options[q.correct] || null; a.mark_scheme = null; }
    else if (QT && QT.has(q.kind)) { var p = QT.pack(q.kind, q.draft); r.options = p.options; a.accepted = p.accepted; a.model_answer = p.model; a.mark_scheme = p.model; }
    else if (dbKind === 'short') { var pts = points(q.points); a.points = pts.length ? pts : null; }
    return { q: r, a: a };
  }
  function must(r) { if (r && r.error) throw r.error; return r; }
  /* pictures kept inside the page (pasted, dropped, read from a PDF, or kept when an upload was refused) are uploaded before saving;
     if an upload is refused the picture stays inside the question, so saving never fails because of a picture */
  function uploadPics() {
    if (!window.BVM || !BVM.persist) return Promise.resolve();
    var jobs = [], uid = ME.user.id, isData = function (v) { return /^data:image\//.test(String(v || '')); };
    ST.questions.forEach(function (q) {
      if (isData(q.image)) jobs.push(BVM.persist(q.image, uid).then(function (u) { q.image = u; }));
      (q.media || []).forEach(function (m) { if (isData(m.src)) jobs.push(BVM.persist(m.src, uid).then(function (u) { m.src = u; })); });
      if (q.draft && isData(q.draft.image)) jobs.push(BVM.persist(q.draft.image, uid).then(function (u) { q.draft.image = u; if (q.kind === 'label' || q.kind === 'labelfill' || q.kind === 'hotspot') q.image = u; }));
      (q.options || []).forEach(function (o, j) { var m = /^\[\[img:(data:image\/[^\]]+)\]\]\s*([\s\S]*)$/.exec(String(o)); if (m) jobs.push(BVM.persist(m[1], uid).then(function (u) { q.options[j] = '[[img:' + u + ']] ' + m[2]; })); });
    });
    return Promise.all(jobs);
  }
  function save(shell) { return shell ? saveRows(true) : uploadPics().then(function () { return saveRows(false); }); }
  function saveRows(shell) {
    var row = { title: ST.title.trim(), category: ST.cat, instructions: ST.instructions.trim() || null, time_limit_minutes: +ST.time || null, max_attempts: Math.max(1, +ST.attempts || 1), show_results: ST.cat === 'lesson' ? true : !!ST.show, feedback_mode: 'hybrid',
      meta: Object.assign({}, ST.meta || {}, { updated_at: new Date().toISOString() }), opens_at: ST.opens || null, due_at: ST.due || null };
    var NB = numbering().label;
    if (ST.subject) row.subject = ST.subject; else if (ST.id) row.subject = null;
    if (IS_ADMIN && HAS_MAIN) { row.main_site = !!ST.main; row.published = !!ST.main; } else if (!ST.id) row.published = false;
    var qid = ST.id;
    return Promise.resolve(ST.id ? S.db.from('quizzes').update(row).eq('id', ST.id).select('id').single() : S.db.from('quizzes').insert(row).select('id').single()).then(must).then(function (r) {
      qid = r.data.id; ST.id = qid; if (shell) return qid;   // the wizard: the assessment exists at once; its questions are saved as they are written
      var ids = [], chain = Promise.resolve();
      ST.questions.forEach(function (q, i) { chain = chain.then(function () { var x = rowOf(q, NB[i]);
        return Promise.resolve(q.id ? S.db.from('questions').update(x.q).eq('id', q.id).select('id').single() : S.db.from('questions').insert(x.q).select('id').single()).then(must).then(function (r2) {
          q.id = r2.data.id; ids[i] = q.id; x.a.question_id = q.id; return S.db.from('question_answers').upsert(x.a, { onConflict: 'question_id' }).then(must); }); }); });
      return chain.then(function () { return S.db.from('quiz_questions').delete().eq('quiz_id', qid).then(must); })
        .then(function () { return ids.length ? S.db.from('quiz_questions').insert(ids.map(function (id, k) { return { quiz_id: qid, question_id: id, position: k + 1 }; })).then(must) : null; })
        .then(function () { var gone = (ST.removed || []).filter(function (id) { return ids.indexOf(id) < 0; }); ST.removed = []; return gone.length ? S.db.from('questions').delete().in('id', gone) : null; })
        .then(function () { return S.db.from('quiz_classes').select('class_id,published').eq('quiz_id', qid); })
        .then(function (r3) { var have = {}, mine = MYCLASSES.map(function (c) { return c.id; }), now = new Date().toISOString(), pubOf = function (c) { return !ST.pub || ST.pub[c] !== false; }; (r3.data || []).forEach(function (c) { have[c.class_id] = c.published !== false; });
            var add = ST.classes.filter(function (c) { return !(c in have); }), drop = Object.keys(have).filter(function (c) { return mine.indexOf(c) >= 0 && ST.classes.indexOf(c) < 0; }), flip = ST.classes.filter(function (c) { return c in have && have[c] !== pubOf(c); });
          return Promise.all([add.length ? S.db.from('quiz_classes').insert(add.map(function (c) { return { quiz_id: qid, class_id: c, published: pubOf(c), published_at: pubOf(c) ? now : null, published_by: ME.user.id }; })).then(must) : null,
            drop.length ? S.db.from('quiz_classes').delete().eq('quiz_id', qid).in('class_id', drop).then(must) : null].concat(flip.map(function (c) { return S.db.from('quiz_classes').update({ published: pubOf(c), published_at: pubOf(c) ? now : null, published_by: ME.user.id }).eq('quiz_id', qid).eq('class_id', c).then(must); }))); })
        .then(function () { if (!ST.studentsTouched) return null; ST.studentsTouched = false; return S.db.from('quiz_students').select('student_id').eq('quiz_id', qid).then(function (r4) { var have = (r4.data || []).map(function (x) { return x.student_id; }), add = (ST.students || []).filter(function (x) { return have.indexOf(x) < 0; }), drop = have.filter(function (x) { return (ST.students || []).indexOf(x) < 0; });
            return Promise.all([add.length ? S.db.from('quiz_students').insert(add.map(function (x) { return { quiz_id: qid, student_id: x }; })).then(must) : null, drop.length ? S.db.from('quiz_students').delete().eq('quiz_id', qid).in('student_id', drop).then(must) : null]); }); })
        .then(function () {   // admin lessons on the main site also get an entry in the Learning centre (as the old lesson maker did)
          if (!(IS_ADMIN && ST.cat === 'lesson')) return qid;
          var marks = ST.questions.reduce(function (a, q) { return a + (q.kind === 'info' ? 0 : +q.marks || 0); }, 0);
          return S.db.from('lessons').upsert({ external_id: 'IL-' + qid, title: row.title, summary: (row.instructions || '').split('\n')[0] || 'Interactive lesson', url: '/lesson/#' + qid, max_marks: marks, published: HAS_MAIN ? !!ST.main : false }, { onConflict: 'external_id' }).then(function () { return qid; }, function () { return qid; });
        });
    });
  }
  function done(id) {
    var url = (ST.cat === 'lesson' ? '/lesson/#' : ST.cat === 'exam' ? '/exams/#' : '/quizzes/#') + id;
    location.hash = 'edit/' + id;
    var n = document.createElement('div'); n.className = 'bd-ov'; n.innerHTML = '<div role="status"><h2>✅ Saved</h2><p>"' + E(ST.title) + '" is in <b>My assessments and lessons</b>' + (ST.classes.length ? ' and in ' + ST.classes.length + ' of your classes' : '') + (ST.main ? ', and on the main site' : '') + '.</p>' +
      (ST.cat === 'lesson' ? '<p>It is already a live interactive lesson: six steps, read-aloud, the timer, and answers shown after each step.</p>' : '') +
      '<div class="acts"><a class="btn main" href="' + url + '" target="_blank" rel="noopener">👁 Open it ↗</a><a class="btn" href="#">My assessments and lessons</a><button class="btn" type="button" data-x>Keep editing</button></div></div>';
    n.querySelector('[data-x]').onclick = function () { n.remove(); }; n.querySelectorAll('a[href="#"]').forEach(function (a) { a.onclick = function () { n.remove(); }; });
    document.body.appendChild(n);
  }

  /* ================================================================ 🚀 Publish and deliver
     classes (published or not, per class), individual students, opening and closing dates, time limit, attempts, results,
     the student access link. Saved straight away. */
  function dl(v) { if (!v) return ''; var d = new Date(v); if (isNaN(d)) return ''; var z = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + 'T' + z(d.getHours()) + ':' + z(d.getMinutes()); }
  function accessUrl() { return location.origin + (ST.cat === 'lesson' ? '/lesson/#' : ST.cat === 'exam' ? '/exams/#' : '/quizzes/#') + (ST.id || ''); }
  function publishDialog() {
    var ov = document.createElement('div'); ov.className = 'bd-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Publish and deliver');
    var inner = document.createElement('div'); ov.appendChild(inner); var sel = {}, pub = {}, studs = (ST.students || []).slice();
    ST.classes.forEach(function (c) { sel[c] = true; pub[c] = !ST.pub || ST.pub[c] !== false; });
    inner.innerHTML = '<div class="bd-top"><div><p class="label">Publishing and delivery</p><h2>🚀 ' + E(ST.title || 'Untitled') + '</h2></div><button class="btn" type="button" data-x>✕ Close</button></div>' +
      '<fieldset><legend>Classes</legend>' + (MYCLASSES.length ? MYCLASSES.map(function (c) { return '<div class="as-sw"><label class="chk" style="margin:0"><input type="checkbox" data-c="' + c.id + '"' + (sel[c.id] ? ' checked' : '') + '> ' + E(c.name) + '</label><label class="chk small" style="margin:0"><input type="checkbox" data-p="' + c.id + '"' + (pub[c.id] ? ' checked' : '') + (sel[c.id] ? '' : ' disabled') + '> Published (students see it)</label></div>'; }).join('') : '<p class="small muted">You have no classes yet. Make one in My classes.</p>') + '</fieldset>' +
      '<fieldset><legend>Individual students <span class="small muted" id="nst"></span></legend><input type="search" id="sq" placeholder="Find a student in your classes" aria-label="Find a student" style="width:100%;box-sizing:border-box;padding:7px 9px;border:1px solid #cbd5e1;border-radius:10px;font:inherit"><div id="sl" style="max-height:180px;overflow:auto;margin-top:6px" class="small muted">Loading your students…</div></fieldset>' +
      '<div class="bd-row">' + field('Opens', '<input type="datetime-local" id="po" value="' + dl(ST.opens) + '">', 'Empty: open as soon as it is published.') + field('Closes / submission deadline', '<input type="datetime-local" id="pd" value="' + dl(ST.due) + '">', 'Empty: no deadline.') + '</div>' +
      '<div class="bd-row">' + field('Time limit (minutes)', '<input type="number" id="pt" min="1" max="600" value="' + E(ST.time) + '" placeholder="none">') + field('Attempts allowed', '<input type="number" id="pa" min="1" max="20" value="' + E(ST.attempts) + '">') + '</div>' +
      (ST.cat === 'lesson' ? '' : '<label class="chk"><input type="checkbox" id="pr"' + (ST.show ? ' checked' : '') + '> Show scores straight after handing in (otherwise release them from Marking)</label>') +
      '<div class="bd-f"><span>Student access link</span><div style="display:flex;gap:6px"><input id="pl" readonly value="' + E(ST.id ? accessUrl() : 'Save first to get the link') + '"><button class="btn sm" type="button" id="pc"' + (ST.id ? '' : ' disabled') + '>📋 Copy</button></div><small>Students sign in and see it if it is published for their class or set for them.' + (ST.cat === 'exam' && ST.id ? ' Exam security (full screen, Safe Exam Browser) is set in <a href="/teach/#quizzes/' + ST.id + '" target="_blank" rel="noopener">My classes ↗</a>.' : '') + '</small></div>' +
      '<p class="msg" id="pm" role="alert"></p><div class="acts" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn main" type="button" id="pgo">🚀 Publish to the ticked classes</button><button class="btn" type="button" id="psave">💾 Save settings</button><button class="btn" type="button" id="poff">⏸ Unpublish everywhere</button></div>';
    var $ = function (s) { return inner.querySelector(s); }, close = function () { ov.remove(); };
    inner.querySelectorAll('[data-c]').forEach(function (c) { c.onchange = function () { var id = c.getAttribute('data-c'), p = inner.querySelector('[data-p="' + id + '"]'); sel[id] = c.checked; p.disabled = !c.checked; if (c.checked && !(id in pub)) { pub[id] = true; p.checked = true; } }; });
    inner.querySelectorAll('[data-p]').forEach(function (c) { c.onchange = function () { pub[c.getAttribute('data-p')] = c.checked; }; });
    $('[data-x]').onclick = close; ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    var pc = $('#pc'); if (pc) pc.onclick = function () { var i = $('#pl'); i.select(); try { navigator.clipboard.writeText(i.value).then(function () { pc.textContent = '✓ Copied'; }, function () { document.execCommand('copy'); pc.textContent = '✓ Copied'; }); } catch (e) { document.execCommand('copy'); } };
    var ALL = [];
    var ids = MYCLASSES.map(function (c) { return c.id; });
    (ids.length ? Promise.all([S.db.from('enrolments').select('student_id,class_id').in('class_id', ids).eq('status', 'approved'), S.db.from('profiles').select('id,full_name,class_id').in('class_id', ids)]) : Promise.resolve([{ data: [] }, { data: [] }])).then(function (r) {
      var who = {}, cn = {}; MYCLASSES.forEach(function (c) { cn[c.id] = c.name; });
      (r[1].data || []).forEach(function (p) { who[p.id] = { id: p.id, name: p.full_name || 'Student', cls: cn[p.class_id] || '' }; });
      var miss = (r[0].data || []).filter(function (e) { return !who[e.student_id]; }).map(function (e) { who[e.student_id] = { id: e.student_id, name: '', cls: cn[e.class_id] || '' }; return e.student_id; });
      return (miss.length ? S.db.from('profiles').select('id,full_name').in('id', miss.slice(0, 500)) : Promise.resolve({ data: [] })).then(function (p2) { (p2.data || []).forEach(function (p) { who[p.id].name = p.full_name || 'Student'; }); ALL = Object.keys(who).map(function (k) { who[k].name = who[k].name || 'Student'; return who[k]; }).sort(function (a, b) { return a.name.localeCompare(b.name); }); drawS(); });
    }, function () { $('#sl').textContent = 'Your students could not be loaded.'; });
    function drawS() { var t = $('#sq').value.trim().toLowerCase(), l = ALL.filter(function (x) { return !t || (x.name + ' ' + x.cls).toLowerCase().indexOf(t) >= 0; });
      $('#nst').textContent = studs.length ? '(' + studs.length + ' chosen)' : '';
      $('#sl').innerHTML = l.length ? l.map(function (x) { return '<label class="chk" style="margin:2px 0"><input type="checkbox" data-s="' + x.id + '"' + (studs.indexOf(x.id) >= 0 ? ' checked' : '') + '> ' + E(x.name) + ' <span class="muted">' + E(x.cls) + '</span></label>'; }).join('') : 'No students found.';
      $('#sl').querySelectorAll('[data-s]').forEach(function (c) { c.onchange = function () { var id = c.getAttribute('data-s'), k = studs.indexOf(id); if (c.checked && k < 0) studs.push(id); else if (!c.checked && k >= 0) studs.splice(k, 1); $('#nst').textContent = studs.length ? '(' + studs.length + ' chosen)' : ''; }; }); }
    $('#sq').oninput = drawS;
    function apply(mode) {
      var o = $('#po').value, d = $('#pd').value; if (o && d && new Date(d) <= new Date(o)) { $('#pm').textContent = 'The closing date must be after the opening date.'; return; }
      ST.classes = Object.keys(sel).filter(function (k) { return sel[k]; }); ST.pub = {}; ST.classes.forEach(function (c) { ST.pub[c] = mode === 'go' ? true : mode === 'off' ? false : pub[c] !== false; });
      ST.students = studs.slice(); ST.studentsTouched = true; ST.opens = o ? new Date(o).toISOString() : ''; ST.due = d ? new Date(d).toISOString() : '';
      ST.time = $('#pt').value; ST.attempts = $('#pa').value; var pr = $('#pr'); if (pr) ST.show = pr.checked;
      if (mode === 'off') { ST.students = []; if (IS_ADMIN) ST.main = false; }
      ST.changed = true; ST.ver = (ST.ver || 0) + 1; autoFix();
      var p = check(); if (p.length) { $('#pm').textContent = 'Fix these first: ' + p.slice(0, 3).join(' · '); return; }
      $('#pm').className = 'msg'; $('#pm').textContent = 'Saving…'; SAVING = false;
      save().then(function (id) { ST.changed = false; $('#pm').className = 'msg ok'; $('#pm').textContent = mode === 'go' ? '✅ Published to ' + ST.classes.length + ' class' + (ST.classes.length === 1 ? '' : 'es') + (ST.students.length ? ' and ' + ST.students.length + ' student' + (ST.students.length === 1 ? '' : 's') : '') + '.' : mode === 'off' ? '⏸ Unpublished: students no longer see it.' : '✓ Saved.';
        $('#pl').value = accessUrl(); $('#pc').disabled = false; stamp('ok', 'All changes saved'); if (location.hash !== '#edit/' + id) history.replaceState(null, '', '#edit/' + id); }, function (e) { $('#pm').textContent = S.nice(e); });
    }
    $('#pgo').onclick = function () { apply('go'); }; $('#psave').onclick = function () { apply('save'); }; $('#poff').onclick = function () { apply('off'); };
    document.body.appendChild(ov); $('[data-x]').focus();
  }

  /* ================================================================ ⏱ Examination preview: one question at a time, timer, navigator */
  function examPreview() {
    autoFix(); var ov = document.createElement('div'); ov.className = 'bd-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Examination preview');
    var inner = document.createElement('div'); inner.className = 'ex-run'; inner.style.maxWidth = '960px'; ov.appendChild(inner);
    var NB = numbering().label, pages = [], answers = {}, cur = 0, left = (+ST.time || 0) * 60, tm = null;
    ST.questions.forEach(function (q, i) {   // a page per main question; sub-questions stay with their question or group, a content block stays with the question after it
      var lv = q.kind === 'info' ? 0 : +((q.qm || {}).level) || 0, lp = pages[pages.length - 1], loneInfo = lp && lp.items.length === 1 && ST.questions[lp.items[0]].kind === 'info' && !(ST.questions[lp.items[0]].qm || {}).group;
      if (!lp || (lv === 0 && !(loneInfo && q.kind !== 'info'))) pages.push({ items: [] }); pages[pages.length - 1].items.push(i); });
    function show() {
      var pg = pages[cur], tot = totals();
      inner.innerHTML = '<div class="bd-top"><div><p class="label">Examination preview · as students see it</p><h2>' + E(ST.title || 'Untitled') + '</h2><p class="small muted">' + tot.all + ' marks' + (ST.time ? ' · ' + E(ST.time) + ' minutes' : '') + '</p></div><div style="display:flex;gap:8px;align-items:center"><b id="tm" style="font-size:1.2rem;font-variant-numeric:tabular-nums"></b><button class="btn" type="button" data-x>✕ Close</button></div></div>' +
        '<nav class="ex-nav" aria-label="Questions">' + pages.map(function (p, k) { var l = NB[p.items.filter(function (i) { return ST.questions[i].kind !== 'info' || NB[i]; })[0]] || (k + 1); var done = p.items.some(function (i) { return answers[i] != null && answers[i] !== ''; }); return '<button type="button" data-g="' + k + '" aria-current="' + (k === cur) + '"' + (done ? ' class="ans"' : '') + '>' + E(String(l).replace(/\(.*$/, '')) + '</button>'; }).join('') + '</nav>' +
        (cur === 0 && ST.instructions ? '<div class="panel tint small">' + E(ST.instructions) + '</div>' : '') + '<div id="pg"></div>' +
        '<div class="acts" style="display:flex;justify-content:space-between;margin-top:12px"><button class="btn" type="button" id="pv"' + (cur ? '' : ' disabled') + '>← Previous</button><span class="small muted">' + (cur + 1) + ' of ' + pages.length + '</span>' + (cur < pages.length - 1 ? '<button class="btn main" type="button" id="nx">Next →</button>' : '<button class="btn main" type="button" id="fin">✔ Finish and see marks</button>') + '</div>';
      var box = inner.querySelector('#pg'); pg.items.forEach(function (i) { var q = ST.questions[i]; if (q.section && (i === 0 || ST.questions[i - 1].section !== q.section) && ST.cat !== 'lesson') { var h = document.createElement('h3'); h.textContent = q.section; h.style.color = '#0e7490'; box.appendChild(h); } box.appendChild(studentView(q, NB[i], function (a) { answers[i] = a; })); });
      inner.querySelector('[data-x]').onclick = closeIt; inner.querySelectorAll('[data-g]').forEach(function (b) { b.onclick = function () { cur = +b.getAttribute('data-g'); show(); }; });
      var pv = inner.querySelector('#pv'); if (pv) pv.onclick = function () { cur--; show(); }; var nx = inner.querySelector('#nx'); if (nx) nx.onclick = function () { cur++; show(); };
      var fin = inner.querySelector('#fin'); if (fin) fin.onclick = finish; tick();
    }
    function tick() { var t = inner.querySelector('#tm'); if (!t) return; if (!ST.time) { t.textContent = ''; return; } var m = Math.floor(Math.max(0, left) / 60), s = Math.max(0, left) % 60; t.textContent = '⏱ ' + m + ':' + (s < 10 ? '0' : '') + s; t.style.color = left < 300 ? '#b91c1c' : ''; }
    function finish() { clearInterval(tm); var got = 0, max = 0, rows = ST.questions.map(function (q, i) { if (q.kind === 'info') return ''; var r = mark(q, answers[i]); max += +q.marks || 0; if (r.got != null) got += r.got; return '<tr><td><b>' + E(NB[i]) + '</b></td><td>' + E(label(q)) + '</td><td>' + (r.got == null ? '✍ teacher' : r.got + ' / ' + r.max) + '</td></tr>'; }).join('');
      inner.innerHTML = '<div class="bd-top"><h2>Preview finished</h2><button class="btn" type="button" data-x>✕ Close</button></div><p><b>Automatic marks: ' + got + ' / ' + max + '</b> (written, drawn and recorded answers are marked by the teacher).</p><table class="as-tbl"><tbody>' + rows + '</tbody></table>';
      inner.querySelector('[data-x]').onclick = closeIt; }
    function closeIt() { clearInterval(tm); ov.remove(); }
    if (ST.time) tm = setInterval(function () { left--; tick(); if (left <= 0) { clearInterval(tm); finish(); } }, 1000);
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeIt(); });
    document.body.appendChild(ov); show(); inner.querySelector('[data-x]').focus();
  }

  /* ================================================================ 🖨 Printable examination (optionally with the mark scheme) */
  function printView(withMs) {
    autoFix(); var NB = numbering().label, tot = totals(), m = ST.meta || {}, last = null, h = '';
    var lines = function (n) { var o = '<div class="ex-lines">'; for (var i = 0; i < n; i++) o += '<div></div>'; return o + '</div>'; };
    var keyOf = function (q) { if (q.kind === 'mcq' || q.kind === 'tf') return q.correct >= 0 ? 'ABCDEFGH'.charAt(q.correct) + ': ' + (q.options[q.correct] || '') : ''; if (QT && QT.has(q.kind)) return QT.pack(q.kind, q.draft).model; return [q.model, q.points ? 'Marking points: ' + q.points.split('\n').map(function (p) { return '• ' + p.split(':')[0]; }).join(' ') : '', q.rubric ? 'Rubric: ' + q.rubric.replace(/\n/g, '; ') : ''].filter(Boolean).join('\n'); };
    ST.questions.forEach(function (q, i) {
      if (q.section && q.section !== last && ST.cat !== 'lesson') { last = q.section; h += '<div class="ex-sec">' + E(q.section) + ' <span style="float:right;font-weight:400">[' + (tot.bySec[q.section] || 0) + ' marks]</span></div>'; }
      var body = rich(T ? T.text(q.prompt) : q.prompt) + ((q.media || []).filter(function (x) { return x.t === 'image'; }).map(function (x) { return '<img src="' + E(x.src) + '" alt="" style="max-width:100%;max-height:300px">'; }).join(''));
      if (q.image && !/^(label|labelfill|hotspot)$/.test(q.kind)) body += '<img src="' + E(q.image) + '" alt="" style="max-width:100%;max-height:320px">';
      var p = QT && QT.has(q.kind) ? QT.pack(q.kind, q.draft).options : null, a = '';
      if (q.kind === 'mcq' || q.kind === 'tf') a = q.options.map(function (o, j) { return '<div class="ex-opt"><b>' + 'ABCDEFGH'.charAt(j) + '</b>&nbsp; ' + (T && T.opt ? T.opt(o) : E(o)) + '</div>'; }).join('');
      else if (q.kind === 'multi') a = p.choices.map(function (c) { return '<div class="ex-opt">☐ ' + E(c) + '</div>'; }).join('') + '<p style="font-size:.85rem">Tick every correct answer.</p>';
      else if (q.kind === 'match') a = '<table style="width:100%"><tr><td style="width:50%;vertical-align:top">' + p.left.map(function (l, k) { return (k + 1) + '. ' + E(l) + ' &nbsp;→ ______'; }).join('<br>') + '</td><td style="vertical-align:top">' + p.right.map(function (r, k) { return String.fromCharCode(65 + k) + '. ' + E(r); }).join('<br>') + '</td></tr></table>';
      else if (q.kind === 'order') a = p.items.map(function (t) { return '<div class="ex-opt">☐ ' + E(t) + '</div>'; }).join('') + '<p style="font-size:.85rem">Number the boxes 1 to ' + p.items.length + ' in the correct order.</p>';
      else if (q.kind === 'classify') a = '<p>Groups: <b>' + p.groups.map(E).join('</b> · <b>') + '</b></p>' + p.items.map(function (t) { return '<div class="ex-opt">' + E(t) + ' → ____________</div>'; }).join('');
      else if (q.kind === 'gaps') a = '<p style="line-height:2">' + E(p.text).replace(/\[\[\d+\]\]/g, '______________') + '</p>';
      else if (q.kind === 'cloze') a = '<p style="line-height:2">' + E(p.text).replace(/\[\[(\d+)\]\]/g, function (z, n) { return '( ' + (p.choices[n - 1] || []).map(E).join(' / ') + ' )'; }) + '</p>';
      else if (q.kind === 'number') a = '<p>Answer: ____________________ ' + E(p.unit || '') + '</p>' + lines(2);
      else if (q.kind === 'table') a = '<table class="qtable" style="width:100%;border-collapse:collapse"><tr>' + p.cols.map(function (c) { return '<th style="border:1px solid #111;padding:4px">' + E(c) + '</th>'; }).join('') + '</tr>' + p.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td style="border:1px solid #111;padding:4px;height:26px">' + (c == null ? '' : E(c)) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>';
      else if (/^(label|labelfill|hotspot)$/.test(q.kind)) a = '<div style="position:relative;display:inline-block;max-width:100%"><img src="' + E(p.image || q.image) + '" alt="" style="max-width:100%;max-height:360px;display:block">' + (p.spots || []).map(function (sp, k) { return '<span style="position:absolute;left:' + sp.x + '%;top:' + sp.y + '%;transform:translate(-50%,-50%);background:#fff;border:2px solid #111;border-radius:50%;width:22px;height:22px;display:grid;place-items:center;font:700 12px system-ui">' + (k + 1) + '</span>'; }).join('') + '</div>' +
        (q.kind === 'hotspot' ? '<p style="font-size:.85rem">Draw a circle round the correct part.</p>' : (p.spots || []).map(function (sp, k) { return '<div>' + (k + 1) + '. ____________________</div>'; }).join('') + (q.kind === 'label' ? '<p style="font-size:.85rem">Choose from: ' + p.labels.map(E).join(', ') + '</p>' : ''));
      else if (q.kind === 'graph' || q.kind === 'draw' || q.kind === 'annotate') a = q.kind === 'annotate' && q.image ? '<img src="' + E(q.image) + '" alt="" style="max-width:100%;max-height:340px">' : '<div class="ex-box" style="' + (q.kind === 'graph' ? 'background-image:linear-gradient(#ccc 1px,transparent 1px),linear-gradient(90deg,#ccc 1px,transparent 1px);background-size:12px 12px;height:260px' : '') + '"></div>';
      else if (RESP[q.kind]) a = '<p style="font-size:.85rem"><i>' + { audio: 'Spoken answer: recorded online.', video: 'Video answer: recorded online.', upload: 'Hand in your work as a file online or attach it to this paper.' }[q.kind] + '</i></p>';
      else if (q.kind !== 'info') a = lines(Math.max(2, Math.round((+q.marks || 1) * (q.kind === 'essay' ? 3 : 2))));
      var ms = withMs && q.kind !== 'info' ? keyOf(q) : '';
      h += q.kind === 'info' ? '<div class="ex-q" style="grid-template-columns:56px 1fr 46px"><div class="no">' + E(NB[i] || '') + '</div><div>' + body + '</div><div></div></div>'
        : '<div class="ex-q" style="padding-left:' + (Math.min(2, +((q.qm || {}).level) || 0) * 18) + 'px"><div class="no">' + E(NB[i] || '') + '</div><div>' + body + a + (ms ? '<div class="ex-ms"><b>Mark scheme:</b> ' + E(ms).replace(/\n/g, '<br>') + (q.explanation ? '<br><b>Explanation:</b> ' + E(q.explanation) : '') + '</div>' : '') + '</div><div class="mk">[' + (+q.marks || 0) + ']</div></div>';
    });
    var ov = document.createElement('div'); ov.className = 'bd-ov ex-print'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Printable view');
    ov.innerHTML = '<div style="max-width:880px;background:transparent;box-shadow:none;padding:0"><div class="acts noprint" style="display:flex;gap:8px;justify-content:flex-end;margin:0 0 10px"><button class="btn main" type="button" data-p>🖨 Print or save as PDF</button><button class="btn" type="button" data-x style="background:#fff">✕ Close</button></div>' +
      '<div class="ex-paper"><p style="text-align:center;font-size:.8rem;letter-spacing:.1em;margin:0">VISTA EDUCATION' + (m.programme ? ' · ' + E(m.programme.toUpperCase()) : '') + '</p><h1>' + E(ST.title || 'Untitled') + (withMs ? ' · MARK SCHEME' : '') + '</h1><p class="meta">' + E([m.subject, m.grade, m.unit].filter(Boolean).join(' · ')) + '<br>' + (ST.time ? E(ST.time) + ' minutes · ' : '') + tot.all + ' marks</p>' +
      (withMs ? '' : '<p>Name: ______________________________ &nbsp; Class: ____________ &nbsp; Date: ____________</p>') + (ST.instructions ? '<div class="ins"><b>Instructions</b><br>' + E(ST.instructions).replace(/\n/g, '<br>') + '</div>' : '') + h +
      '<p style="text-align:center;margin-top:24px;font-size:.85rem">End of ' + (withMs ? 'mark scheme' : 'examination') + '</p></div></div>';
    ov.querySelector('[data-p]').onclick = function () { window.print(); }; ov.querySelector('[data-x]').onclick = function () { ov.remove(); };
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') ov.remove(); });
    document.body.appendChild(ov); ov.querySelector('[data-p]').focus();
  }

  /* ================================================================ export and import (.json) */
  function exportJson() {
    var data = { format: 'bioscience-vista-assessment', version: 1, exported: new Date().toISOString(), title: ST.title, category: ST.cat, instructions: ST.instructions, time: ST.time, meta: ST.meta,
      questions: ST.questions.map(function (q) { var c = JSON.parse(JSON.stringify(q)); c.id = null; delete c.ai; return c; }) };
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' })); a.download = (ST.title || 'assessment').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 60) + '.bsv.json';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); toast('Exported: open it in any VistaEd account with Create → Import a VistaEd file.');
  }
  function importJson(file) {
    var r = new FileReader(); r.onload = function () { var d; try { d = JSON.parse(r.result); } catch (e) { return toast('⚠ That file is not a VistaEd assessment file.'); }
      if (!d || d.format !== 'bioscience-vista-assessment' || !Array.isArray(d.questions)) return toast('⚠ That file is not a VistaEd assessment file.');
      start(CAT[d.category] ? d.category : 'exam', true); ST.title = String(d.title || 'Imported assessment').slice(0, 160) + ' (imported)'; ST.instructions = String(d.instructions || ''); ST.time = d.time || ''; ST.meta = d.meta && typeof d.meta === 'object' ? d.meta : ST.meta; delete ST.meta.archived;
      ST.questions = d.questions.filter(function (q) { return q && KN[q.kind] || (q && q.kind === 'info'); }).map(function (q) { var n = newQ(q.kind, q.section); Object.keys(n).forEach(function (k) { if (q[k] != null) n[k] = q[k]; }); n.id = null; return n; });
      if (!ST.questions.length) ST.questions = [newQ('short', 'Section A')]; SEL = 0; ST.changed = true; draw(); toast('Imported ' + ST.questions.length + ' items. Check them, then 💾 Save.'); };
    r.readAsText(file);
  }

  /* ================================================================ 🔬 science tools */
  function sciDialog() {
    if (!window.BVSCI) return toast('The science tools did not load. Refresh the page.');
    var ov = document.createElement('div'); ov.className = 'bd-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Science tools');
    ov.innerHTML = '<div><div class="bd-top"><div><p class="label">Assessment Studio</p><h2>🔬 Science tools</h2><p class="small muted">Type your data: the tool works out the answers and writes the questions, ready to edit. Pictures: use 🧬 VistaEd diagrams in any question.</p></div><button class="btn" type="button" data-x>✕ Close</button></div>' +
      '<div class="bd-lib">' + BVSCI.TOOLS.map(function (t) { return '<button type="button" class="bd-card" data-t="' + t.id + '" style="--k:#0e7490;text-align:left;cursor:pointer;font:inherit;color:inherit"><span style="font-size:1.4rem" aria-hidden="true">' + t.icon + '</span><div><h4>' + E(t.name) + '</h4><span class="small muted">' + E(t.about) + '</span></div><span aria-hidden="true">→</span></button>'; }).join('') + '</div></div>';
    ov.querySelector('[data-x]').onclick = function () { ov.remove(); };
    ov.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { ov.remove(); BVSCI.open(b.getAttribute('data-t'), insertItems); }; });
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') ov.remove(); });
    document.body.appendChild(ov); ov.querySelector('[data-t]').focus();
  }
  function insertItems(items) {
    var cur = ST.questions[SEL] || {}, sec = cur.section || (ST.cat === 'lesson' ? 'Challenge' : 'Section A'), made = items.map(function (it) {
      var q = newQ(it.kind, sec); ['prompt', 'marks', 'model', 'points', 'rubric', 'explanation', 'axes', 'options', 'correct', 'image'].forEach(function (k) { if (it[k] != null) q[k] = it[k]; });
      if (it.draft) q.draft = JSON.parse(JSON.stringify(it.draft)); q.qm = Object.assign(q.qm, it.qm || {}); if (it.qm && it.qm.group) q.qm.group = true; return q; });
    var blank = ST.questions.length === 1 && !String(ST.questions[0].prompt || '').trim() && !ST.questions[0].id;
    if (blank) { ST.questions = made; SEL = 0; } else { ST.questions.splice.apply(ST.questions, [SEL + 1, 0].concat(made)); SEL++; }
    touch(true); toast('Added ' + made.length + ' item' + (made.length === 1 ? '' : 's') + '. Check the wording and marks.');
  }

  /* ================================================================ ✨ AI for one question: rewrite, harder / easier, command term, mark scheme,
     explanation, differentiated versions. Nothing changes until the teacher accepts the AI's version. */
  function aiShape(q) {
    var o = { kind: /^(audio|video|upload)$/.test(q.kind) ? 'short' : q.kind, prompt: T ? T.text(q.prompt) : q.prompt, marks: +q.marks || 1, explanation: q.explanation || '' };
    if (q.kind === 'mcq') { o.options = q.options; o.correct = q.correct; } else if (q.kind === 'tf') o.answer = q.correct === 0;
    else if (QT && QT.has(q.kind)) { o.key = QT.pack(q.kind, q.draft).model; o.draft = q.draft; }
    else { o.model_answer = q.model; o.points = String(q.points || '').split('\n').filter(Boolean).map(function (l) { var i = l.indexOf(':'); return { text: i > 0 ? l.slice(0, i) : l, keywords: i > 0 ? l.slice(i + 1).split('/').map(function (x) { return x.trim(); }) : [] }; }); o.rubric = q.rubric; if (q.kind === 'graph') { var a = String(q.axes || '').split(','); o.x = a[0]; o.y = a[1]; } }
    return o;
  }
  function aiOne(q) {
    if (q.kind === 'info') return toast('Choose a question (not a content block) to use AI on it.');
    var ov = document.createElement('div'); ov.className = 'bd-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'AI for this question');
    var inner = document.createElement('div'); ov.appendChild(inner); var lab = numbering().label[SEL];
    var ACTS = [['harder', '⬆ Make it harder'], ['easier', '⬇ Make it easier'], ['command', '🧭 Rewrite with an IB command term'], ['scheme', '📋 Write the mark scheme and model answer'], ['explain', '💡 Write the explanation for students'], ['differentiate', '🪜 Differentiated versions (support and extension)'], ['rewrite', '✍ Rewrite more clearly']];
    if (/^(label|labelfill|hotspot|annotate)$/.test(q.kind)) ACTS = ACTS.filter(function (x) { return x[0] === 'scheme' || x[0] === 'explain'; });   // picture-based kinds: the AI cannot see the picture, so it only writes the mark scheme and explanation
    inner.innerHTML = '<div class="bd-top"><div><p class="label">✨ VistaEd AI</p><h2>Question ' + E(lab || '') + '</h2><p class="small muted">' + E(label(q)) + '</p></div><button class="btn" type="button" data-x>✕ Close</button></div>' +
      '<div class="wz-cards">' + ACTS.map(function (a, i) { return '<label><input type="radio" name="ai-a" value="' + a[0] + '"' + (i === 0 ? ' checked' : '') + '><span><b>' + a[1] + '</b></span></label>'; }).join('') + '</div>' +
      '<div class="bd-row">' + field('Command term', '<select id="ai-c">' + COMMANDS.map(function (c) { return '<option' + (((q.qm || {}).command || 'Explain') === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select>') + field('Level', '<select id="ai-l"><option value="">' + E(GEN.level || 'as the assessment') + '</option>' + LEVELS.map(function (l) { return '<option>' + l + '</option>'; }).join('') + '</select>') + '</div>' +
      '<div class="acts"><button class="btn main" type="button" id="ai-go">✨ Ask the AI</button></div><div id="ai-out" style="margin-top:12px"></div>';
    var close = function () { ov.remove(); }; inner.querySelector('[data-x]').onclick = close; ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    inner.querySelector('#ai-go').onclick = function () {
      var act = inner.querySelector('[name=ai-a]:checked').value, out = inner.querySelector('#ai-out'), go = inner.querySelector('#ai-go'); go.disabled = true; out.innerHTML = '<p class="muted">The AI is working… (10–40 seconds)</p>';
      var body = { mode: 'modify', kind: ST.cat, level: inner.querySelector('#ai-l').value || GEN.level || levelFor(ST.meta) || '', title: ST.title, objectives: [ST.meta.unit, (q.qm || {}).topic].filter(Boolean).join('. '), action: act, command: inner.querySelector('#ai-c').value, item: aiShape(q), section: q.section };
      patient(body, { stopped: function () { return !ov.isConnected; }, step: function (t) { out.innerHTML = '<p class="muted">' + E(t) + '</p>'; } }, 'Asking the AI').then(function (d) {
        go.disabled = false; var items = (d.items || []).filter(Boolean).map(function (it) { var n = fromAI(Object.assign({ section: q.section }, it)); if (n) { n.ai = false; n.qm = Object.assign({}, q.qm || {}, { command: act === 'command' ? inner.querySelector('#ai-c').value : (q.qm || {}).command }); if (n.qm.level == null) n.qm.level = 0; } return n; }).filter(Boolean);
        if (!items.length) { out.innerHTML = '<p class="msg">The AI did not return a usable question. Try again or choose another action.</p>'; return; }
        out.innerHTML = '<p><b>The AI\'s version' + (items.length > 1 ? 's' : '') + '</b> (nothing has changed yet):</p>';
        items.forEach(function (n, k) { var card = document.createElement('div'); card.className = 'panel'; card.appendChild(studentView(n, lab, function () {}));
          var ms = document.createElement('p'); ms.className = 'small'; ms.innerHTML = '<b>Mark scheme:</b> ' + E(n.kind === 'mcq' ? 'ABCDEFGH'.charAt(n.correct) + ': ' + (n.options[n.correct] || '') : QT && QT.has(n.kind) ? QT.pack(n.kind, n.draft).model : (n.model || '') + (n.points ? ' · ' + n.points.replace(/\n/g, ' · ') : '')) + (n.explanation ? '<br><b>Explanation:</b> ' + E(n.explanation) : ''); card.appendChild(ms);
          var acts = document.createElement('div'); acts.className = 'acts'; acts.innerHTML = (act === 'scheme' || act === 'explain' ? '<button class="btn main sm" type="button" data-k>✓ Use this ' + (act === 'scheme' ? 'mark scheme' : 'explanation') + '</button>' : '<button class="btn main sm" type="button" data-r>✓ Replace question ' + E(lab || '') + '</button>') + ' <button class="btn sm" type="button" data-n>＋ Insert as a new question</button>'; card.appendChild(acts);
          var r = acts.querySelector('[data-r]'); if (r) r.onclick = function () { if (RESP[q.kind] && n.kind === 'short') n.kind = q.kind; n.image = n.image || q.image; n.media = (n.media || []).length ? n.media : q.media; n.id = q.id; n.section = q.section; ST.questions[ST.questions.indexOf(q)] = n; close(); touch(true); toast('Question replaced. Check it before saving.'); };
          var kk = acts.querySelector('[data-k]'); if (kk) kk.onclick = function () { if (act === 'scheme') { if (n.model) q.model = n.model; if (n.points) q.points = n.points; if (n.rubric) q.rubric = n.rubric; if (n.kind === q.kind && n.draft && QT && QT.has(q.kind)) q.draft = n.draft; if (n.kind === 'mcq' && q.kind === 'mcq' && n.options.length === q.options.length) q.correct = n.correct; } if (n.explanation) q.explanation = n.explanation; close(); touch(true); toast('Added to the question.'); };
          acts.querySelector('[data-n]').onclick = function () { var at = ST.questions.indexOf(q) + 1; ST.questions.splice(at, 0, n); SEL = at; close(); touch(true); };
          out.appendChild(card); });
      }, function (e) { go.disabled = false; out.innerHTML = '<p class="msg">' + E(e.message || e) + '</p>'; });
    };
    document.body.appendChild(ov); inner.querySelector('#ai-go').focus();
  }

  /* ================================================================ 📊 Results and analytics */
  function results(id) {
    app.innerHTML = '<p class="muted">Loading results…</p>';
    Promise.all([S.db.from('quizzes').select('id,title,category,meta,created_by').eq('id', id).maybeSingle(), S.db.from('quiz_questions').select('position, questions(id,kind,prompt,marks,criterion,meta)').eq('quiz_id', id).order('position'),
      S.db.from('quiz_attempts').select('id,student_id,status,score,max_score,submitted_at,detail,released').eq('quiz_id', id).order('submitted_at', { ascending: false })]).then(function (x) {
      var qz = x[0].data; if (!qz) { app.innerHTML = '<p class="msg">This assessment was not found.</p><p><a class="btn" href="#">Back</a></p>'; return; }
      var qs = (x[1].data || []).map(function (r) { return r.questions; }).filter(function (q) { return q && q.kind !== 'info'; }), atts = (x[2].data || []).filter(function (a) { return a.submitted_at; });
      var ids = uniq(atts.map(function (a) { return a.student_id; }));
      return (ids.length ? S.db.from('profiles').select('id,full_name').in('id', ids) : Promise.resolve({ data: [] })).then(function (p) {
        var nm = {}; (p.data || []).forEach(function (r) { nm[r.id] = r.full_name || 'Student'; });
        var best = {}; atts.forEach(function (a) { var b = best[a.student_id]; if (!b || (+a.score || 0) > (+b.score || 0)) best[a.student_id] = a; });   // each student's best attempt
        var rows = Object.keys(best).map(function (k) { return best[k]; }), pc = function (g, m) { return m > 0 ? Math.round(100 * g / m) : 0; };
        var qstat = {}; qs.forEach(function (q) { qstat[q.id] = { got: 0, max: 0, n: 0, pending: 0 }; });
        var topic = {}, crit = { A: [0, 0], B: [0, 0], C: [0, 0], D: [0, 0] };
        rows.forEach(function (a) { (a.detail || []).forEach(function (d) { var s = qstat[d.question_id]; if (!s) return; if (d.got == null) { s.pending++; return; } s.got += +d.got || 0; s.max += +d.max || 0; s.n++;
          var q = qs.filter(function (z) { return z.id === d.question_id; })[0], m = (q && q.meta) || {}, tp = m.topic || 'No topic set'; topic[tp] = topic[tp] || [0, 0]; topic[tp][0] += +d.got || 0; topic[tp][1] += +d.max || 0;
          var cm = m.crit || {}, ks = Object.keys(cm).filter(function (k) { return +cm[k] > 0; }); if (!ks.length && q && q.criterion) { cm = {}; cm[q.criterion] = +d.max || 1; ks = [q.criterion]; }
          var tw = ks.reduce(function (t, k) { return t + (+cm[k] || 0); }, 0); ks.forEach(function (k) { if (!crit[k]) return; crit[k][0] += (+d.got || 0) * (+cm[k] || 0) / (tw || 1); crit[k][1] += (+d.max || 0) * (+cm[k] || 0) / (tw || 1); }); }); });
        var avg = rows.length ? Math.round(rows.reduce(function (t, a) { return t + pc(+a.score || 0, +a.max_score || 0); }, 0) / rows.length) : 0, need = rows.filter(function (a) { return a.status === 'needs_marking'; }).length;
        var lab = {}; qs.forEach(function (q, i) { lab[q.id] = ((q.meta || {}).label) || String(i + 1); });
        var bar = function (p) { return '<div class="rs-bar" title="' + p + '%"><i style="width:' + Math.max(0, Math.min(100, p)) + '%"></i></div>'; };
        var myp = /^myp_/.test((qz.meta || {}).marking || '');
        app.innerHTML = '<div class="as-band"><div><p class="label"><a href="#">← Assessment Studio</a> · <a href="#edit/' + id + '">✏️ Edit</a></p><h2>📊 ' + E(qz.title) + '</h2></div><div class="acts" style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn main" href="/teach/#quizzes/' + id + '" target="_blank" rel="noopener">🖊 Mark answers and release results ↗</a><button class="btn" type="button" id="csv">⬇ Download CSV</button></div></div>' +
          '<div class="as-stats"><div class="as-stat"><b>' + rows.length + '</b><span>Students handed in</span></div><div class="as-stat"><b>' + avg + '%</b><span>Class average (best attempt)</span></div><div class="as-stat"><b>' + need + '</b><span>Waiting for your marking</span></div><div class="as-stat"><b>' + atts.length + '</b><span>Attempts in all</span></div></div>' +
          (rows.length ? '' : '<p class="emptybox">No student has handed this in yet. Publish it from the editor (🚀 Publish) and share the access link.</p>') +
          '<div class="bd" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)"><section class="bd-col"><h3>🎓 Students</h3><table class="as-tbl"><thead><tr><th>Student</th><th>Score</th><th>%</th>' + (myp ? '<th>MYP level</th>' : '') + '<th>Status</th><th>Handed in</th></tr></thead><tbody>' +
            rows.sort(function (a, b) { return (nm[a.student_id] || '').localeCompare(nm[b.student_id] || ''); }).map(function (a) { var p2 = pc(+a.score || 0, +a.max_score || 0), lv = T && T.level ? T.level(+a.score || 0, +a.max_score || 0, 'MYP') : null;
              return '<tr><td><b>' + E(nm[a.student_id] || 'Student') + '</b></td><td>' + E(a.score == null ? '–' : a.score) + ' / ' + E(a.max_score || '–') + '</td><td>' + bar(p2) + ' ' + p2 + '%</td>' + (myp ? '<td>' + (lv ? lv.n + ' / 8' : '–') + '</td>' : '') + '<td>' + E({ needs_marking: '🖊 needs marking', marked: '✓ marked', submitted: 'handed in' }[a.status] || a.status) + (a.released ? ' · released' : '') + '</td><td>' + day(a.submitted_at) + '</td></tr>'; }).join('') + '</tbody></table></section>' +
          '<section class="bd-col"><h3>🧩 Questions</h3><table class="as-tbl"><tbody>' + qs.map(function (q) { var s2 = qstat[q.id], p3 = pc(s2.got, s2.max); return '<tr><td><b>' + E(lab[q.id]) + '</b></td><td>' + E((T ? T.text(q.prompt) : q.prompt).replace(/\s+/g, ' ').slice(0, 70)) + '</td><td style="min-width:120px">' + (s2.n ? bar(p3) + ' ' + p3 + '%' : '–') + (s2.pending ? '<br><span class="small muted">' + s2.pending + ' to mark</span>' : '') + '</td></tr>'; }).join('') + '</tbody></table>' +
            '<h3 style="margin-top:14px">🧭 Topics</h3>' + (Object.keys(topic).length ? '<table class="as-tbl"><tbody>' + Object.keys(topic).sort().map(function (k) { var p4 = pc(topic[k][0], topic[k][1]); return '<tr><td>' + E(k) + '</td><td style="min-width:140px">' + bar(p4) + ' ' + p4 + '%</td></tr>'; }).join('') + '</tbody></table>' : '<p class="small muted">Add a topic to each question (⚙️ Question) to see topic performance.</p>') +
            '<h3 style="margin-top:14px">🅰 Criteria</h3><table class="as-tbl"><tbody>' + ['A', 'B', 'C', 'D'].filter(function (k) { return crit[k][1] > 0; }).map(function (k) { var p5 = pc(crit[k][0], crit[k][1]), lv = T && T.level ? T.level(crit[k][0], crit[k][1], 'MYP') : null; return '<tr><td><b>' + k + '</b> ' + CRIT[k] + '</td><td style="min-width:140px">' + bar(p5) + ' ' + p5 + '%' + (myp && lv ? ' · level ' + lv.n : '') + '</td></tr>'; }).join('') + '</tbody></table>' +
            '<p class="small muted" style="margin-top:10px">✨ AI-assisted feedback for written answers is prepared after students hand in and appears with each answer in 🖊 Marking, where you accept or change it.</p></section></div>';
        app.querySelector('#csv').onclick = function () {
          var head = ['Student', 'Score', 'Max', 'Percent', 'Status', 'Handed in'].concat(qs.map(function (q) { return 'Q' + lab[q.id]; })), lines = [head];
          rows.forEach(function (a) { var dd = {}; (a.detail || []).forEach(function (d) { dd[d.question_id] = d.got; }); lines.push([nm[a.student_id] || 'Student', a.score, a.max_score, pc(+a.score || 0, +a.max_score || 0), a.status, a.submitted_at].concat(qs.map(function (q) { return dd[q.id] == null ? '' : dd[q.id]; }))); });
          var csv = lines.map(function (l) { return l.map(function (c) { c = String(c == null ? '' : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
          var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = (qz.title || 'results').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') + '-results.csv'; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500); };
      });
    });
  }
  window.addEventListener('beforeunload', function (e) { if (ST && ST.changed) { keepLocal(); e.preventDefault(); e.returnValue = ''; } });
})();
