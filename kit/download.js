/* "Download my work": saves a read-only HTML copy of this lesson with the student's
   typed answers, ticks, marks, feedback and graphs filled in. Added to every lesson by the hub. */
(function () {
  if (window.__dlkit) return; window.__dlkit = 1;
  var css = document.createElement("style");
  css.textContent = "#dlkit-btn{width:auto!important;max-width:max-content!important;left:auto!important;margin:0!important;position:fixed;right:calc(16px + env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9999;" +
    "border:0;border-radius:999px;padding:11px 18px;background:#1b6b3a;color:#fff;font:700 14px/1 system-ui,'Segoe UI',Arial,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}" +
    "#dlkit-pdf{width:auto!important;max-width:max-content!important;left:auto!important;margin:0!important;position:fixed;right:calc(16px + env(safe-area-inset-right,0px));bottom:calc(66px + env(safe-area-inset-bottom,0px));z-index:9999;border:0;border-radius:999px;padding:11px 18px;background:#7c3aed;color:#fff;font:700 14px/1 system-ui,'Segoe UI',Arial,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}" +
    "#dlkit-btn:hover{background:#14522c}#dlkit-btn:focus-visible{outline:3px solid #f4a261;outline-offset:2px}" +
    "#dlkit-toast{position:fixed;right:calc(16px + env(safe-area-inset-right,0px));bottom:calc(116px + env(safe-area-inset-bottom,0px));z-index:9999;max-width:300px;" +
    "background:#1f2a24;color:#fff;border-radius:10px;padding:10px 14px;font:14px/1.4 system-ui,Arial,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25)}" +
    "@media print{#dlkit-btn,#dlkit-pdf,#dlkit-toast{display:none}}";
  document.head.appendChild(css);
  var btn = document.createElement("button");
  btn.id = "dlkit-btn"; btn.type = "button"; btn.textContent = "⤓ Save my work"; btn.title = "Save my work (download a copy)";
  btn.title = "Save a copy of this lesson with your answers, marks and feedback";
  var pdf = document.createElement("button");
  pdf.id = "dlkit-pdf"; pdf.type = "button"; pdf.textContent = "⤓ PDF"; pdf.title = "Download this lesson as a PDF";
  pdf.title = "Download my answers, marks and feedback as a PDF";
  document.body.appendChild(btn); document.body.appendChild(pdf);

  function toast(t) {
    var el = document.getElementById("dlkit-toast");
    if (!el) { el = document.createElement("div"); el.id = "dlkit-toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = t; clearTimeout(toast.t); toast.t = setTimeout(function () { el.remove(); }, 6000);
  }
  function studentName() {
    var ids = ["sname", "stuName", "studentName", "name"];
    for (var i = 0; i < ids.length; i++) { var e = document.getElementById(ids[i]); if (e && e.value && e.value.trim()) return e.value.trim(); }
    var g = document.querySelector('input[id*="name" i], input[name*="name" i]');
    return g && g.value ? g.value.trim() : "";
  }
  function snapshot() {
    var live = document.querySelectorAll("input, textarea, select");
    var root = document.documentElement.cloneNode(true);
    var copy = root.querySelectorAll("input, textarea, select");
    for (var i = 0; i < live.length && i < copy.length; i++) {
      var el = live[i], c = copy[i];
      if (el.tagName === "TEXTAREA") c.textContent = el.value;
      else if (el.tagName === "SELECT") {
        for (var j = 0; j < c.options.length; j++) { if (el.options[j] && el.options[j].selected) c.options[j].setAttribute("selected", ""); else c.options[j].removeAttribute("selected"); }
        c.setAttribute("disabled", "");
      } else if (el.type === "checkbox" || el.type === "radio") {
        if (el.checked) c.setAttribute("checked", ""); else c.removeAttribute("checked");
        c.setAttribute("disabled", "");
      } else if (el.type !== "file" && el.type !== "button" && el.type !== "submit") c.setAttribute("value", el.value);
      c.setAttribute("readonly", "");
    }
    var lc = document.querySelectorAll("canvas"), cc = root.querySelectorAll("canvas");
    for (var k = 0; k < lc.length && k < cc.length; k++) {
      try { var img = document.createElement("img"); img.src = lc[k].toDataURL("image/png"); img.alt = "Graph"; img.style.cssText = "max-width:100%;height:auto"; img.width = lc[k].width; cc[k].parentNode.replaceChild(img, cc[k]); } catch (e) {}
    }
    var ld = document.querySelectorAll("details"), cd = root.querySelectorAll("details");
    for (var d = 0; d < ld.length && d < cd.length; d++) if (ld[d].open) cd[d].setAttribute("open", "");
    var drop = root.querySelectorAll("script, iframe, #dlkit-btn, #dlkit-pdf, #dlkit-toast");
    for (var r = 0; r < drop.length; r++) drop[r].remove();
    var body = root.querySelector("body"), when = new Date(), name = studentName();
    var ban = document.createElement("div");
    ban.style.cssText = "background:#fff4dc;color:#3a2a00;border-bottom:2px solid #e0b84f;padding:10px 16px;font:600 14px/1.45 system-ui,Arial,sans-serif";
    ban.textContent = "Saved copy of " + (name || "my") + (name ? "'s" : "") + " work · " + document.title + " · " + when.toLocaleString() + ". This copy is read-only: open the lesson online to change or submit answers.";
    body.insertBefore(ban, body.firstChild);
    return { html: "<!DOCTYPE html>\n" + root.outerHTML, name: name, when: when };
  }
  btn.addEventListener("click", function () {
    try {
      var s = snapshot();
      var file = (document.title + " - " + (s.name || "my work") + " - " + s.when.toISOString().slice(0, 10)).replace(/[\\/:*?"<>|]+/g, "").slice(0, 120) + ".html";
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([s.html], { type: "text/html" }));
      a.download = file; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      toast("Saved “" + file + "” to your downloads. Open it any time, or upload it to Google Classroom.");
    } catch (e) { toast("Sorry, the download did not work in this browser. Try Chrome or Edge."); }
  });
  /* PDF: short pages are saved straight to a PDF file; very long pages use the browser's "Save as PDF" print option */
  function fileBase() { return (document.title + " - " + (studentName() || "my work") + " - " + new Date().toISOString().slice(0, 10)).replace(/[\\/:*?"<>|]+/g, "").slice(0, 120); }
  function printPdf() { document.querySelectorAll("details").forEach(function (d) { d.setAttribute("data-was", d.open ? 1 : 0); d.open = true; });
    toast("In the print window choose \"Save as PDF\" as the printer, then Save."); setTimeout(function () { window.print(); document.querySelectorAll("details[data-was]").forEach(function (d) { d.open = d.getAttribute("data-was") === "1"; }); }, 400); }
  function withLib(cb) { if (window.html2pdf) return cb(); var s = document.createElement("script"); s.src = "/assets/html2pdf.min.js"; s.onload = cb; s.onerror = printPdf; document.head.appendChild(s); }
  pdf.addEventListener("click", function () {
    var tall = document.body.scrollHeight > 9000;
    if (tall) return printPdf();
    pdf.disabled = true; pdf.textContent = "Making PDF…";
    withLib(function () {
      try {
        var s = snapshot(), box = document.createElement("div");
        box.style.cssText = "position:absolute;left:-10000px;top:0;width:820px;background:#fff;color:#111";
        box.innerHTML = s.html.replace(/^[\s\S]*?<body[^>]*>/i, "").replace(/<\/body>[\s\S]*$/i, "");
        document.body.appendChild(box);
        html2pdf().set({ margin: 8, filename: fileBase() + ".pdf", image: { type: "jpeg", quality: 0.92 }, html2canvas: { scale: 1.6, useCORS: true, windowWidth: 840 }, jsPDF: { unit: "mm", format: "a4" }, pagebreak: { mode: ["css", "legacy"] } })
          .from(box).save().then(function () { box.remove(); pdf.disabled = false; pdf.textContent = "⤓ PDF"; toast("PDF saved to your downloads."); })
          .catch(function () { box.remove(); pdf.disabled = false; pdf.textContent = "⤓ PDF"; printPdf(); });
      } catch (e) { pdf.disabled = false; pdf.textContent = "⤓ PDF"; printPdf(); }
    });
  });
})();
