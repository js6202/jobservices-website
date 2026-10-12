/* Job Services – Website-Logik (ohne Bibliotheken)
   - Navigation (Handy-Menü)
   - Stellen laden und anzeigen (Startseite, Stellenliste, Stellendetail)
   - Formulare: Bewerbung (mit Dateien) und Kontakt/Stellenmeldung */
(function () {
  "use strict";

  var CFG = window.JOBSERVICES_CONFIG || {};
  var LANG = CFG.lang || "de";
  var T = (window.JOBSERVICES_I18N || {})[LANG] || (window.JOBSERVICES_I18N || {}).de || {};
  var PREVIEW = !CFG.apiUrl;

  function t(key, vars) {
    var s = T[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split("{" + k + "}").join(vars[k]); });
    return s;
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function slugParam(name) {
    var m = new RegExp("[?&]" + name + "=([^&#]*)").exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : "";
  }

  /* ---------------- Navigation ---------------- */
  function initNav() {
    var header = $(".site-header");
    var btn = $(".nav-toggle");
    if (!header || !btn) return;
    function setOpen(open) {
      header.classList.toggle("nav-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    btn.addEventListener("click", function () { setOpen(!header.classList.contains("nav-open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
    $all(".site-nav a").forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1024) setOpen(false); });
  }

  /* ---------------- Stellen ---------------- */
  var DEMO_JOBS = [
    { id: "beispiel-1", titel: "Automobil-Mechatroniker/in EFZ", beruf: "Automobil-Mechatroniker/in", region: "Region Zürich", pensum: "100 %", lohn: "CHF 70'000 – 82'000", antritt: "nach Vereinbarung",
      kurz: "Markengarage mit moderner Werkstatt sucht eine erfahrene Fachkraft für Diagnose, Service und Reparatur.",
      aufgaben: ["Diagnose und Behebung elektronischer und mechanischer Störungen", "Service- und Reparaturarbeiten nach Herstellervorgaben", "MFK-Bereitstellungen"],
      profil: ["Abgeschlossene Lehre als Automobil-Mechatroniker/in EFZ", "Erfahrung mit Diagnosegeräten", "Führerausweis Kat. B"],
      angebot: ["Festanstellung in einem eingespielten Team", "Moderne Infrastruktur", "Weiterbildung zum/zur Diagnostiker/in möglich"] },
    { id: "beispiel-2", titel: "Kundendienstberater/in", beruf: "Kundendienstberater/in", region: "Limmattal", pensum: "80–100 %", lohn: "", antritt: "sofort",
      kurz: "Erste Ansprechperson für Werkstattkunden: Termine, Offerten, Übergabe und Beratung.",
      aufgaben: ["Kundenempfang, Fahrzeugannahme und -übergabe", "Erstellen von Offerten und Rechnungen", "Planung der Werkstattaufträge"],
      profil: ["Technische Grundausbildung im Autogewerbe", "Freude am Kundenkontakt", "Gute Deutschkenntnisse"],
      angebot: ["Abwechslungsreiche Stelle an der Schnittstelle Kunde–Werkstatt", "Geregelte Arbeitszeiten"] },
    { id: "beispiel-3", titel: "Automobil-Fachmann/-frau EFZ", beruf: "Automobil-Fachmann/-frau", region: "Zürcher Unterland", pensum: "100 %", lohn: "CHF 58'000 – 66'000", antritt: "nach Vereinbarung",
      kurz: "Freie Mehrmarkengarage sucht Verstärkung für Service, Reifen und Reparaturen.",
      aufgaben: ["Service- und Wartungsarbeiten an Personenwagen", "Reifen- und Bremsenservice", "Unterstützung bei Diagnosen"],
      profil: ["Abgeschlossene Lehre als Automobil-Fachmann/-frau EFZ", "Selbstständige, saubere Arbeitsweise"],
      angebot: ["Familiäres Team", "Vielseitige Fahrzeugpalette"] },
    { id: "beispiel-4", titel: "Automobil-Verkaufsberater/in", beruf: "Automobil-Verkaufsberater/in", region: "Stadt Zürich", pensum: "100 %", lohn: "", antritt: "nach Vereinbarung",
      kurz: "Verkauf von Neu- und Occasionsfahrzeugen in einem etablierten Autohaus.",
      aufgaben: ["Beratung und Verkauf von Neu- und Occasionsfahrzeugen", "Probefahrten, Offerten und Finanzierungsgespräche", "Pflege des Kundenstamms"],
      profil: ["Erfahrung im Automobilverkauf", "Verkaufstalent und gepflegtes Auftreten"],
      angebot: ["Attraktive Provisionsregelung", "Moderner Showroom"] }
  ];

  var jobsPromise = null;
  function getJobs() {
    if (jobsPromise) return jobsPromise;
    if (PREVIEW) {
      jobsPromise = Promise.resolve(DEMO_JOBS.map(function (j) { j.demo = true; return j; }));
      return jobsPromise;
    }
    var cacheKey = "js_jobs_" + LANG;
    try {
      var cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
      if (cached && Date.now() - cached.at < 5 * 60 * 1000) { jobsPromise = Promise.resolve(cached.jobs); return jobsPromise; }
    } catch (e) { /* Speicher nicht verfügbar */ }
    jobsPromise = fetch(CFG.apiUrl + "?action=jobs&lang=" + encodeURIComponent(LANG), { method: "GET" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (data) {
        if (!data || !data.ok) throw new Error("API");
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), jobs: data.jobs })); } catch (e) {}
        return data.jobs || [];
      });
    return jobsPromise;
  }

  function jobUrl(job) { return "stelle.html?id=" + encodeURIComponent(job.id); }

  function jobCard(job) {
    var meta = [job.region, job.pensum].filter(Boolean).map(function (m) { return "<span>" + esc(m) + "</span>"; }).join("");
    return '<article class="job-card">' +
      '<div class="job-card__meta">' + meta + (job.demo ? '<span>Beispiel</span>' : "") + "</div>" +
      '<h3><a href="' + esc(jobUrl(job)) + '">' + esc(job.titel) + "</a></h3>" +
      (job.kurz ? "<p>" + esc(job.kurz) + "</p>" : "") +
      '<div class="job-card__foot"><span class="job-card__salary">' + esc(job.lohn || "") + '</span><span class="job-card__go" aria-hidden="true">' + esc(t("details")) + " →</span></div>" +
      "</article>";
  }
  function spontanCard() {
    return '<article class="job-card job-card--spontan">' +
      '<div class="job-card__meta"><span>' + esc(t("spontanTitle")) + "</span></div>" +
      '<h3><a href="stelle.html?id=spontan">' + esc(t("spontanCta")) + "</a></h3>" +
      "<p>" + esc(t("spontanText")) + "</p>" +
      '<div class="job-card__foot"><span></span><span class="job-card__go" aria-hidden="true">→</span></div></article>';
  }
  function skeletons(n) { var s = ""; for (var i = 0; i < n; i++) s += '<div class="job-card job-card--skeleton" aria-hidden="true"></div>'; return s; }

  function previewNotice() {
    return PREVIEW ? '<p class="notice notice--info">Vorschau: Diese Stellen sind Beispiele. Echte Stellen erscheinen, sobald die Website mit deiner Google-Tabelle verbunden ist.</p>' : "";
  }

  /* Startseite: neueste Stellen */
  function initHomeJobs() {
    var box = $("#home-jobs");
    if (!box) return;
    box.innerHTML = skeletons(3);
    box.setAttribute("aria-busy", "true");
    getJobs().then(function (jobs) {
      box.removeAttribute("aria-busy");
      if (!jobs.length) { box.innerHTML = '<div class="empty"><p>' + esc(t("noJobs")) + "</p></div>"; return; }
      box.innerHTML = jobs.slice(0, 3).map(jobCard).join("");
    }).catch(function () {
      box.removeAttribute("aria-busy");
      box.innerHTML = '<p class="notice notice--error">' + esc(t("loadError")) + "</p>";
    });
  }

  /* Stellenliste mit Filtern */
  function initJobList() {
    var list = $("#job-list");
    if (!list) return;
    var q = $("#filter-q"), beruf = $("#filter-beruf"), region = $("#filter-region"), count = $("#job-count"), note = $("#job-note");
    list.innerHTML = skeletons(4);
    list.setAttribute("aria-busy", "true");

    getJobs().then(function (jobs) {
      list.removeAttribute("aria-busy");
      if (note) note.innerHTML = previewNotice();
      fillSelect(beruf, uniq(jobs.map(function (j) { return j.beruf; })), t("allTrades"));
      fillSelect(region, uniq(jobs.map(function (j) { return j.region; })), t("allRegions"));
      var initial = slugParam("beruf");
      if (initial && beruf) beruf.value = initial;

      function render() {
        var term = (q && q.value || "").trim().toLowerCase();
        var b = beruf ? beruf.value : "", r = region ? region.value : "";
        var shown = jobs.filter(function (j) {
          if (b && j.beruf !== b) return false;
          if (r && j.region !== r) return false;
          if (!term) return true;
          return [j.titel, j.beruf, j.region, j.kurz].join(" ").toLowerCase().indexOf(term) !== -1;
        });
        if (count) count.textContent = shown.length === 1 ? t("countOne") : t("countMany", { n: shown.length });
        if (!jobs.length) {
          list.innerHTML = '<div class="empty"><p>' + esc(t("noJobs")) + "</p></div>" + spontanCard();
        } else if (!shown.length) {
          list.innerHTML = '<div class="empty"><p>' + esc(t("noMatch")) + '</p><button type="button" class="btn btn--ghost" id="reset-filters">' + esc(t("resetFilters")) + "</button></div>" + spontanCard();
          var reset = $("#reset-filters");
          if (reset) reset.addEventListener("click", function () { if (q) q.value = ""; if (beruf) beruf.value = ""; if (region) region.value = ""; render(); });
        } else {
          list.innerHTML = shown.map(jobCard).join("") + spontanCard();
        }
      }
      [q, beruf, region].forEach(function (el) { if (el) el.addEventListener(el.tagName === "INPUT" ? "input" : "change", render); });
      render();
    }).catch(function () {
      list.removeAttribute("aria-busy");
      list.innerHTML = '<p class="notice notice--error">' + esc(t("loadError")) + "</p>" + spontanCard();
    });
  }
  function uniq(arr) { return arr.filter(function (v, i) { return v && arr.indexOf(v) === i; }).sort(function (a, b) { return a.localeCompare(b, "de"); }); }
  function fillSelect(sel, values, allLabel) {
    if (!sel) return;
    sel.innerHTML = '<option value="">' + esc(allLabel) + "</option>" + values.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + "</option>"; }).join("");
  }

  /* Stellendetail */
  function listHtml(items) {
    if (!items || !items.length) return "";
    return "<ul>" + items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>";
  }
  function initJobDetail() {
    var box = $("#job-detail");
    if (!box) return;
    var id = slugParam("id");
    var form = $("#apply-form");
    var jobIdInput = form ? $('input[name="jobId"]', form) : null;
    var jobTitleInput = form ? $('input[name="jobTitle"]', form) : null;

    if (!id || id === "spontan") {
      setJobHeader({ titel: "Spontanbewerbung", kurz: "Du hast keine passende Stelle gefunden? Schick uns deine Unterlagen. Wir melden uns, sobald eine Stelle zu dir passt." }, true);
      box.innerHTML = '<div class="job-body"><section><h2>So geht es weiter</h2><ul><li>Wir prüfen deine Unterlagen persönlich.</li><li>Passt eine Stelle, rufen wir dich an und besprechen sie mit dir.</li><li>Dein Dossier geht nur mit deinem OK an einen Betrieb.</li></ul></section></div>';
      if (jobIdInput) jobIdInput.value = "spontan";
      if (jobTitleInput) jobTitleInput.value = "Spontanbewerbung";
      return;
    }

    box.innerHTML = '<div class="job-card job-card--skeleton" aria-hidden="true"></div>';
    getJobs().then(function (jobs) {
      var job = jobs.filter(function (j) { return String(j.id) === id; })[0];
      if (!job) {
        setJobHeader({ titel: t("jobNotFound") }, true);
        box.innerHTML = '<div class="empty"><p>' + esc(t("spontanText")) + '</p><div class="btn-row"><a class="btn btn--petrol" href="stellen.html">' + esc(t("backToJobs")) + '</a><a class="btn btn--ghost" href="stelle.html?id=spontan">' + esc(t("spontanCta")) + "</a></div></div>";
        var formWrap = $("#apply"); if (formWrap) formWrap.hidden = true;
        var sticky = $(".sticky-apply"); if (sticky) sticky.hidden = true;
        return;
      }
      setJobHeader(job, false);
      if (jobIdInput) jobIdInput.value = job.id;
      if (jobTitleInput) jobTitleInput.value = job.titel;
      var facts = [[t("region"), job.region], [t("workload"), job.pensum], [t("salary"), job.lohn || t("onRequest")], [t("start"), job.antritt || "–"]];
      box.innerHTML =
        (job.demo ? previewNotice() : "") +
        '<dl class="job-facts">' + facts.map(function (f) { return "<div><dt>" + esc(f[0]) + "</dt><dd>" + esc(f[1] || "–") + "</dd></div>"; }).join("") + "</dl>" +
        '<div class="job-body">' +
        (job.aufgaben && job.aufgaben.length ? "<section><h2>" + esc(t("tasks")) + "</h2>" + listHtml(job.aufgaben) + "</section>" : "") +
        (job.profil && job.profil.length ? "<section><h2>" + esc(t("profile")) + "</h2>" + listHtml(job.profil) + "</section>" : "") +
        (job.angebot && job.angebot.length ? "<section><h2>" + esc(t("offer")) + "</h2>" + listHtml(job.angebot) + "</section>" : "") +
        "</div>";
      addJobPostingSchema(job);
    }).catch(function () {
      box.innerHTML = '<p class="notice notice--error">' + esc(t("loadError")) + "</p>";
    });
  }
  function setJobHeader(job, isSpontan) {
    var h1 = $("#job-title"), lead = $("#job-lead"), crumb = $("#job-crumb");
    if (h1) h1.textContent = job.titel;
    if (lead) { lead.textContent = job.kurz || ""; lead.hidden = !job.kurz; }
    if (crumb) crumb.textContent = job.titel;
    document.title = job.titel + " – Job Services";
    var desc = document.querySelector('meta[name="description"]');
    if (desc && job.kurz) desc.setAttribute("content", job.kurz);
  }
  function addJobPostingSchema(job) {
    if (job.demo) return;
    var text = [job.kurz].concat(job.aufgaben || [], job.profil || [], job.angebot || []).filter(Boolean).join(" ");
    var data = {
      "@context": "https://schema.org/", "@type": "JobPosting",
      title: job.titel, description: text,
      datePosted: job.datum || new Date().toISOString().slice(0, 10),
      employmentType: /100/.test(job.pensum || "") ? "FULL_TIME" : "PART_TIME",
      hiringOrganization: { "@type": "Organization", name: "Job Services", sameAs: "https://jobservices.ch" },
      jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressRegion: job.region || "Zürich", addressCountry: "CH" } },
      directApply: true
    };
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  /* Klebender «Jetzt bewerben»-Knopf auf dem Handy */
  function initStickyApply() {
    var bar = $(".sticky-apply"), target = $("#apply");
    if (!bar || !target) return;
    document.body.classList.add("has-sticky-apply");
    if (!("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { bar.classList.toggle("is-hidden", e.isIntersecting); });
    }, { rootMargin: "0px 0px -30% 0px" }).observe(target);
  }

  /* ---------------- Formulare ---------------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(field, msg) {
    if (!field) return;
    field.classList.toggle("is-invalid", !!msg);
    var out = $(".field__error", field);
    if (out) out.textContent = msg || "";
    var input = $("input, select, textarea", field);
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function fileExt(name) { var m = /\.([a-z0-9]+)$/i.exec(name || ""); return m ? m[1].toLowerCase() : ""; }
  function fmtSize(bytes) { return bytes > 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB"; }

  function checkFiles(input) {
    var max = (CFG.maxFileMB || 5) * 1024 * 1024;
    var allowed = CFG.allowedExt || [];
    var limit = parseInt(input.getAttribute("data-max-files") || "1", 10);
    var files = Array.prototype.slice.call(input.files || []);
    if (files.length > limit) return t("tooMany", { n: limit });
    for (var i = 0; i < files.length; i++) {
      if (allowed.indexOf(fileExt(files[i].name)) === -1) return t("fileType", { name: files[i].name });
      if (files[i].size > max) return t("fileSize", { name: files[i].name, mb: CFG.maxFileMB || 5 });
    }
    return "";
  }

  function initFileInputs(form) {
    $all('input[type="file"]', form).forEach(function (input) {
      var list = $(".file__list", input.closest(".file"));
      input.addEventListener("change", function () {
        var field = input.closest(".field");
        var err = checkFiles(input);
        setError(field, err);
        if (!list) return;
        var files = Array.prototype.slice.call(input.files || []);
        list.innerHTML = files.map(function (f) { return "<li>" + esc(f.name) + " <small>(" + esc(fmtSize(f.size)) + ")</small></li>"; }).join("");
      });
    });
  }

  function validate(form) {
    var firstBad = null;
    $all(".field", form).forEach(function (field) {
      var el = $("input:not([type=checkbox]):not([type=radio]), select, textarea", field);
      var msg = "";
      if (el && el.type === "file") {
        if (el.required && (!el.files || !el.files.length)) msg = t(el.getAttribute("data-required-msg") || "fileRequired");
        else msg = checkFiles(el);
      } else if (el) {
        var v = (el.value || "").trim();
        if (el.required && !v) msg = t("required");
        else if (v && el.type === "email" && !EMAIL_RE.test(v)) msg = t("invalidEmail");
        else if (v && el.type === "tel" && v.replace(/[^\d]/g, "").length < 9) msg = t("invalidPhone");
        else if (v && el.getAttribute("data-type") === "chf" && !/^\d{4,7}$/.test(v.replace(/['’\s.,]/g, ""))) msg = t("invalidSalary");
      }
      var check = $('input[type="checkbox"][required]', field);
      if (check && !check.checked) msg = t("consentRequired");
      var radios = $all('input[type="radio"]', field);
      if (radios.length && radios[0].required && !radios.some(function (r) { return r.checked; })) msg = t("required");
      setError(field, msg);
      if (msg && !firstBad) firstBad = field;
    });
    // Gesamtgrösse der Dateien
    var total = 0;
    $all('input[type="file"]', form).forEach(function (i) { Array.prototype.forEach.call(i.files || [], function (f) { total += f.size; }); });
    if (total > (CFG.maxTotalMB || 15) * 1024 * 1024) {
      var lastFile = $all('input[type="file"]', form).pop();
      var f = lastFile && lastFile.closest(".field");
      setError(f, t("totalSize", { mb: CFG.maxTotalMB || 15 }));
      if (!firstBad) firstBad = f;
    }
    return firstBad;
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () {
        var s = String(r.result || "");
        resolve({ name: file.name, type: file.type || "application/octet-stream", data: s.slice(s.indexOf(",") + 1) });
      };
      r.onerror = function () { reject(r.error); };
      r.readAsDataURL(file);
    });
  }

  function collect(form) {
    var data = {};
    $all("input, select, textarea", form).forEach(function (el) {
      if (!el.name || el.type === "file" || el.type === "submit") return;
      if (el.type === "checkbox") { data[el.name] = el.checked; return; }
      if (el.type === "radio") { if (el.checked) data[el.name] = el.value; return; }
      data[el.name] = (el.value || "").trim();
    });
    var fileInputs = $all('input[type="file"]', form);
    var jobs = [];
    fileInputs.forEach(function (input) {
      Array.prototype.forEach.call(input.files || [], function (f) { jobs.push({ key: input.name, file: f }); });
    });
    return Promise.all(jobs.map(function (j) { return readFile(j.file).then(function (r) { r.key = j.key; return r; }); }))
      .then(function (files) {
        data.files = {};
        files.forEach(function (f) { (data.files[f.key] = data.files[f.key] || []).push({ name: f.name, type: f.type, data: f.data }); });
        return data;
      });
  }

  function showStatus(form, kind, title, text) {
    var box = $(".form-status", form.parentNode) || document.createElement("div");
    box.className = "form-status form-status--" + kind;
    box.setAttribute("role", kind === "ok" ? "status" : "alert");
    box.setAttribute("tabindex", "-1");
    box.innerHTML = (title ? "<h3>" + esc(title) + "</h3>" : "") + "<p>" + esc(text) + "</p>";
    if (!box.parentNode) form.parentNode.insertBefore(box, form);
    box.hidden = false;
    box.focus({ preventScroll: true });
    box.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function initForm(form) {
    var action = form.getAttribute("data-action");
    var startedAt = Date.now();
    var submit = $('button[type="submit"]', form);
    var submitLabel = submit ? submit.textContent : "";
    var formError = $(".form-error", form);
    initFileInputs(form);

    // Fehler beim Tippen wieder entfernen
    form.addEventListener("input", function (e) { var f = e.target.closest && e.target.closest(".field"); if (f && f.classList.contains("is-invalid") && e.target.type !== "file") setError(f, ""); });
    form.addEventListener("change", function (e) { var f = e.target.closest && e.target.closest(".field"); if (f && (e.target.type === "checkbox" || e.target.type === "radio")) setError(f, ""); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (formError) formError.hidden = true;
      var bad = validate(form);
      if (bad) {
        if (formError) { formError.textContent = t("fixErrors"); formError.hidden = false; }
        var el = $("input, select, textarea", bad);
        bad.scrollIntoView({ behavior: "smooth", block: "center" });
        if (el) setTimeout(function () { el.focus({ preventScroll: true }); }, 300);
        return;
      }
      submit.disabled = true;
      submit.setAttribute("aria-busy", "true");
      submit.textContent = $('input[type="file"]', form) ? t("uploading") : t("sending");

      collect(form).then(function (data) {
        data.action = action;
        data.lang = LANG;
        data.elapsed = Date.now() - startedAt;
        data.page = location.pathname;
        if (PREVIEW) return new Promise(function (res) { setTimeout(function () { res({ ok: true, preview: true }); }, 900); });
        return fetch(CFG.apiUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" }, // vermeidet CORS-Vorabanfrage
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      }).then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || "send");
        var isApply = action === "apply";
        form.hidden = true;
        var intro = form.closest(".form-card") && $(".form-intro", form.closest(".form-card")); if (intro) intro.hidden = true;
        showStatus(form, "ok", t(isApply ? "applyOkTitle" : "contactOkTitle"),
          t(isApply ? "applyOkText" : "contactOkText") + (res.preview ? " " + t("previewMode") : ""));
        var sticky = $(".sticky-apply"); if (sticky) sticky.hidden = true;
      }).catch(function (err) {
        var msg = err && err.message && err.message !== "send" && err.message.indexOf("Failed") === -1 && err.message.length < 200 ? err.message : t("sendError");
        if (formError) { formError.textContent = msg; formError.hidden = false; formError.scrollIntoView({ behavior: "smooth", block: "center" }); }
      }).then(function () {
        submit.disabled = false;
        submit.removeAttribute("aria-busy");
        submit.textContent = submitLabel;
      });
    });
  }

  /* ---------------- Start ---------------- */
  function init() {
    initNav();
    initHomeJobs();
    initJobList();
    initJobDetail();
    initStickyApply();
    $all("form[data-action]").forEach(initForm);
    var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
