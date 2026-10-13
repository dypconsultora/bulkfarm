/* =====================================================================
   BULK PRINT FARM — main.js
   1. Render desde js/config.js (catálogo, selector, cinta, materiales)
   2. Navegación
   3. Cotizador: estado, ticket, archivos, validación y envío
   4. Animaciones GSAP (se saltean con prefers-reduced-motion o sin CDN)
   ===================================================================== */
(function () {
  "use strict";

  const CFG = window.BPF_CONFIG;
  const root = document.documentElement;
  if (!CFG) { root.classList.remove("anim"); return; }

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const HAS_GSAP = !!(gsap && ScrollTrigger);
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MOTION = HAS_GSAP && !REDUCED;
  if (!MOTION) root.classList.remove("anim");

  const money = new Intl.NumberFormat(CFG.LOCALE, { style: "currency", currency: CFG.CURRENCY, maximumFractionDigits: 0 });
  const decimal = new Intl.NumberFormat(CFG.LOCALE, { maximumFractionDigits: 1 });
  const integer = new Intl.NumberFormat(CFG.LOCALE);
  const fmt = (v) => money.format(Math.round(v));

  const PRINTERS = CFG.PRINTERS;
  const byId = (id) => PRINTERS.find((p) => p.id === id) || null;

  const ICON = {
    arrow: '<svg class="btn__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  /* ------------------------------------------------------------------
     1. Render desde config
  ------------------------------------------------------------------ */
  const catalog = $("#catalog");
  if (catalog) {
    catalog.innerHTML = PRINTERS.map((p, i) => `
      <article class="pcard" data-reveal data-printer="${p.id}">
        <header class="pcard__top">
          <span class="pcard__idx">${String(i + 1).padStart(2, "0")}</span>
          <span class="pcard__tag">${p.tag}</span>
        </header>
        <div class="pcard__media">
          <img src="${p.img}" width="1000" height="1000" loading="lazy" decoding="async" alt="Impresora 3D Bambu Lab ${p.model}" style="--s:${p.scale}">
        </div>
        <h3 class="pcard__model">${p.model}</h3>
        <p class="pcard__desc">${p.desc}</p>
        <dl class="pcard__specs">
          ${p.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}
        </dl>
        <div class="pcard__foot">
          <p class="pcard__price">
            <span class="pcard__amount">${fmt(p.pricePerHour)}</span>
            <span class="pcard__unit">por hora · filamento incluido</span>
          </p>
          <button type="button" class="btn btn--solid pcard__btn" data-choose="${p.id}" aria-pressed="false"><span>Elegir</span>${ICON.arrow}</button>
        </div>
      </article>`).join("");
  }

  const pick = $("#printerPick");
  if (pick) {
    pick.innerHTML = PRINTERS.map((p) => `
      <label class="pick__opt">
        <input class="sr-only" type="radio" name="printer" value="${p.id}" required>
        <span class="pick__thumb"><img src="${p.img}" width="1000" height="1000" loading="lazy" decoding="async" alt="" style="--s:${p.scale}"></span>
        <span class="pick__info">
          <span class="pick__model">${p.model}</span>
          <span class="pick__vol">${p.volume}</span>
        </span>
        <span class="pick__price">${fmt(p.pricePerHour)}<small>/h</small></span>
        <span class="pick__check" aria-hidden="true">${ICON.check}</span>
      </label>`).join("");
  }

  const materialPick = $("#materialPick");
  if (materialPick) {
    materialPick.innerHTML = CFG.MATERIALS.map((m, i) => `
      <label class="chip"><input class="sr-only" type="radio" name="material" value="${m}"${i === 0 ? " checked" : ""}>${m}</label>`).join("");
  }

  // Cinta del hero: tres carriles con las 6 máquinas en distinto orden.
  const LANES = [[2, 5, 0, 3, 1, 4], [4, 1, 3, 0, 5, 2], [0, 3, 5, 1, 4, 2]];
  const HOT = [1, 4, 2];
  $$(".lane__track").forEach((track, lane) => {
    const order = LANES[lane % LANES.length];
    const set = order.map((idx, i) => {
      const p = PRINTERS[idx % PRINTERS.length];
      return `<div class="tile${i === HOT[lane % HOT.length] ? " tile--hot" : ""}">
        <span class="tile__code">${p.model}</span><span class="tile__led"></span>
        <img src="${p.img}" width="1000" height="1000" decoding="async" alt="" style="--s:${p.scale}">
        <span class="tile__bar"><i></i></span>
      </div>`;
    }).join("");
    track.innerHTML = set + set; // duplicado para el loop sin corte
  });

  // "Desde $X/h" en el hero
  const fromPrice = $("[data-from-price]");
  if (fromPrice && PRINTERS.length) {
    fromPrice.textContent = fmt(Math.min(...PRINTERS.map((p) => p.pricePerHour))) + "/h";
    $("[data-from-label]").textContent = "Tarifa desde";
  }

  // Contacto desde config (el HTML trae los mismos valores como respaldo)
  const waLink = (text) => "https://wa.me/" + CFG.CONTACT.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
  const contactHref = { whatsapp: waLink(), email: "mailto:" + CFG.CONTACT.email, instagram: "https://instagram.com/" + CFG.CONTACT.instagram };
  const contactLabel = { whatsapp: CFG.CONTACT.whatsappLabel, email: CFG.CONTACT.email, instagram: "@" + CFG.CONTACT.instagram };
  $$("[data-contact]").forEach((a) => { a.href = contactHref[a.dataset.contact]; });
  $$("[data-contact-label]").forEach((el) => { el.textContent = contactLabel[el.dataset.contactLabel]; });

  // Aviso de demo: visible mientras falten tarifas reales o el endpoint
  const pending = [];
  if (CFG.PRICES_ARE_PLACEHOLDER) pending.push("precios de ejemplo");
  if (!CFG.FORM_ENDPOINT) pending.push("envío sin conectar");
  if (pending.length) {
    const demo = document.createElement("div");
    demo.className = "demo";
    demo.setAttribute("role", "note");
    demo.innerHTML = `<span><b>DEMO</b> · ${pending.join(" · ")} · editá js/config.js</span><button type="button" aria-label="Cerrar aviso">${ICON.close}</button>`;
    $("button", demo).addEventListener("click", () => demo.remove());
    document.body.appendChild(demo);
  }

  /* ------------------------------------------------------------------
     2. Navegación
  ------------------------------------------------------------------ */
  const header = $("#siteHeader");
  const navToggle = $("#navToggle");
  const mobileMenu = $("#mobileMenu");

  const onScrollHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  const setMenu = (open) => {
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    mobileMenu.hidden = !open;
    header.classList.toggle("is-open", open);
    root.classList.toggle("menu-open", open);
    // el menú cuelga del header: si venía escondiéndose por el scroll, lo bajamos
    if (open && MOTION) gsap.set(header, { yPercent: 0, overwrite: true });
  };
  navToggle.addEventListener("click", () => setMenu(navToggle.getAttribute("aria-expanded") !== "true"));
  $$("a", mobileMenu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !mobileMenu.hidden) { setMenu(false); navToggle.focus(); }
  });
  matchMedia("(min-width: 1200px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

  // Scroll suave de los links internos. Va por JS y no por CSS: con
  // scroll-behavior:smooth en el <html>, ScrollTrigger mide mal al refrescar.
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const hash = link.getAttribute("href");
    const target = hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
    history.pushState(null, "", hash);
    // mismo efecto que la navegación nativa: el foco sigue al destino
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });

  /* ------------------------------------------------------------------
     2.5 Modo día / noche. El tema inicial ya lo aplicó el script del <head>;
     acá se sincronizan los botones y se guarda la elección.
  ------------------------------------------------------------------ */
  const THEME_KEY = "bpf-theme";
  const themeMeta = $('meta[name="theme-color"]');
  const getTheme = () => (root.getAttribute("data-theme") === "light" ? "light" : "dark");
  const syncTheme = () => {
    const theme = getTheme();
    $$("[data-theme-set]").forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.themeSet === theme)));
    if (themeMeta) themeMeta.content = theme === "light" ? "#F2EEE6" : "#100D08";
  };
  const setTheme = (theme) => {
    if (theme === getTheme()) return;
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* modo privado: no se guarda */ }
    const apply = () => {
      if (theme === "light") root.setAttribute("data-theme", "light");
      else root.removeAttribute("data-theme");
      syncTheme();
    };
    // Fundido entre temas donde el navegador lo soporta; si no, cambio directo
    if (!REDUCED && document.startViewTransition) document.startViewTransition(apply);
    else apply();
  };
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-theme-set]");
    if (btn) setTheme(btn.dataset.themeSet);
  });
  syncTheme();

  /* ------------------------------------------------------------------
     3. Cotizador
  ------------------------------------------------------------------ */
  const form = $("#quoteForm");
  const state = { printer: null, units: 1, hours: null, material: CFG.MATERIALS[0], files: [] };

  const tk = {
    printer: $("#tkPrinter"), rate: $("#tkRate"), units: $("#tkUnits"), hours: $("#tkHours"),
    material: $("#tkMaterial"), files: $("#tkFiles"),
    label: $("#tkLabel"), amount: $("#tkAmount"), sub: $("#tkSub"), live: $("#ticketLive")
  };

  const pulse = (el) => { if (MOTION && el) gsap.fromTo(el, { scale: 0.96 }, { scale: 1, duration: 0.45, ease: "back.out(2.6)", overwrite: true }); };

  // Cambia el texto de una fila del ticket y la resalta si cambió
  const setRow = (el, text) => {
    if (el.textContent === text) return;
    el.textContent = text;
    if (MOTION) gsap.fromTo(el.parentNode, { backgroundColor: "rgba(232,93,28,.38)" }, { backgroundColor: "rgba(232,93,28,0)", duration: 0.8, ease: "power2.out", overwrite: true });
  };

  const amount = { v: 0 };
  const setAmount = (target) => {
    if (target == null) {
      if (HAS_GSAP) gsap.killTweensOf(amount);
      amount.v = 0;
      tk.amount.textContent = "—";
      return;
    }
    if (!MOTION) { amount.v = target; tk.amount.textContent = fmt(target); return; }
    gsap.to(amount, { v: target, duration: 0.55, ease: "power3.out", overwrite: true, onUpdate: () => { tk.amount.textContent = fmt(amount.v); } });
  };

  function updateTicket() {
    const p = state.printer;
    setRow(tk.printer, p ? p.model : "—");
    setRow(tk.rate, p ? fmt(p.pricePerHour) + "/h" : "—");
    setRow(tk.units, "× " + state.units);
    setRow(tk.hours, state.hours ? decimal.format(state.hours) + " h" : "A confirmar");
    setRow(tk.material, state.material);
    setRow(tk.files, String(state.files.length));

    let target = null;
    let label = "Por hora";
    let sub = "Elegí una impresora para ver la tarifa.";
    if (p) {
      const perHour = p.pricePerHour * state.units;
      if (state.hours) {
        target = perHour * state.hours;
        label = "Total estimado";
        sub = `${fmt(perHour)}/h × ${decimal.format(state.hours)} h. Se confirma al revisar tu archivo.`;
      } else {
        target = perHour;
        sub = `${state.units} × ${fmt(p.pricePerHour)}/h. El total depende de las horas de impresión.`;
      }
    }
    tk.label.textContent = label;
    tk.sub.textContent = sub;
    setAmount(target);
    tk.live.textContent = p ? `${label}: ${fmt(target)}. ${sub}` : "";
  }

  /* --- Errores por campo --- */
  const ERR_TARGET = { printer: null, units: "#units", hours: "#hours", files: "#files", name: "#name", email: "#email", phone: "#phone" };
  function setError(key, msg) {
    const box = $("#err-" + key);
    if (box) box.textContent = msg || "";
    const input = ERR_TARGET[key] && $(ERR_TARGET[key]);
    if (input) { if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid"); }
    if (key === "units") $(".stepper").toggleAttribute("data-invalid", !!msg);
    if (key === "files") $("#dropzone").toggleAttribute("data-invalid", !!msg);
  }

  /* --- Impresora --- */
  function syncMaterials() {
    const p = state.printer;
    $$('input[name="material"]').forEach((input, i) => {
      const allowed = i === 0 || !p || p.materials.includes(input.value);
      input.disabled = !allowed;
      input.parentNode.title = allowed ? "" : `No disponible en ${p.model}`;
      if (!allowed && input.checked) {
        const first = $('input[name="material"]');
        first.checked = true;
        state.material = first.value;
      }
    });
  }

  function selectPrinter(id) {
    const p = byId(id);
    if (!p) return;
    state.printer = p;
    const input = $(`input[name="printer"][value="${id}"]`);
    if (input) { input.checked = true; pulse(input.parentNode); }
    $$(".pcard").forEach((card) => {
      const on = card.dataset.printer === id;
      card.classList.toggle("is-chosen", on);
      const btn = $(".pcard__btn", card);
      btn.setAttribute("aria-pressed", String(on));
      $("span", btn).textContent = on ? "Elegida" : "Elegir";
    });
    syncMaterials();
    setError("printer", "");
    updateTicket();
  }

  if (pick) pick.addEventListener("change", (e) => { if (e.target.name === "printer") selectPrinter(e.target.value); });

  if (catalog) catalog.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-choose]");
    if (!btn) return;
    selectPrinter(btn.dataset.choose);
    $("#cotizar").scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
  });

  if (materialPick) materialPick.addEventListener("change", (e) => {
    if (e.target.name !== "material") return;
    state.material = e.target.value;
    pulse(e.target.parentNode);
    updateTicket();
  });

  /* --- Cantidad de impresoras --- */
  const unitsInput = $("#units");
  const stepBtns = $$(".stepper__btn");
  unitsInput.max = CFG.MAX_UNITS;
  const setUnits = (n, dir) => {
    const v = Math.min(CFG.MAX_UNITS, Math.max(1, Math.round(n) || 1));
    state.units = v;
    unitsInput.value = v;
    stepBtns[0].disabled = v <= 1;
    stepBtns[1].disabled = v >= CFG.MAX_UNITS;
    setError("units", "");
    if (MOTION && dir) gsap.fromTo(unitsInput, { yPercent: dir * 35, opacity: 0.2 }, { yPercent: 0, opacity: 1, duration: 0.28, ease: "power3.out", overwrite: true });
    updateTicket();
  };
  stepBtns.forEach((btn) => btn.addEventListener("click", () => {
    const dir = Number(btn.dataset.step);
    setUnits(state.units + dir, dir);
  }));
  unitsInput.addEventListener("change", () => setUnits(Number(unitsInput.value)));

  /* --- Horas estimadas (opcional) --- */
  const hoursInput = $("#hours");
  const readHours = () => {
    const raw = hoursInput.value.trim();
    if (raw === "") { state.hours = null; setError("hours", ""); return true; }
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0 || n > 5000) {
      state.hours = null;
      setError("hours", "Poné las horas como un número mayor a 0 (por ejemplo 12 o 7,5), o dejalo vacío.");
      return false;
    }
    state.hours = n;
    setError("hours", "");
    return true;
  };
  hoursInput.addEventListener("input", () => { readHours(); updateTicket(); });

  /* --- Archivos --- */
  const dropzone = $("#dropzone");
  const fileInput = $("#files");
  const fileList = $("#fileList");
  const MAX_BYTES = CFG.MAX_FILE_MB * 1024 * 1024;
  $("#help-files").textContent = `Hasta ${CFG.MAX_FILES} archivos, máximo ${CFG.MAX_FILE_MB} MB cada uno.`;
  fileInput.accept = CFG.ACCEPT.join(",");

  const extOf = (name) => { const m = name.match(/\.[^.]+$/); return m ? m[0].toLowerCase() : ""; };
  const sizeOf = (bytes) => bytes >= 1048576 ? decimal.format(bytes / 1048576) + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB";

  // STL binario: los bytes 80–83 traen la cantidad de triángulos. Sirve como
  // primera señal de complejidad; solo se muestra si el tamaño coincide.
  function readTriangles(entry) {
    const f = entry.file;
    if (f.size < 84) return;
    f.slice(80, 84).arrayBuffer().then((buf) => {
      const n = new DataView(buf).getUint32(0, true);
      if (n > 0 && 84 + n * 50 === f.size) { entry.tris = n; renderFiles(); }
    }).catch(() => {});
  }

  function renderFiles(added) {
    fileList.textContent = "";
    state.files.forEach((entry, i) => {
      const li = document.createElement("li");
      li.className = "file";
      const ext = document.createElement("span");
      ext.className = "file__ext";
      ext.textContent = extOf(entry.file.name).slice(1).toUpperCase();
      const body = document.createElement("span");
      body.className = "file__body";
      const name = document.createElement("span");
      name.className = "file__name";
      name.textContent = entry.file.name;
      name.title = entry.file.name;
      const meta = document.createElement("span");
      meta.className = "file__meta";
      meta.textContent = sizeOf(entry.file.size) + (entry.tris ? " · " + integer.format(entry.tris) + " triángulos" : "");
      body.append(name, meta);
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "file__rm";
      rm.setAttribute("aria-label", "Quitar " + entry.file.name);
      rm.innerHTML = ICON.close;
      rm.addEventListener("click", () => { state.files.splice(i, 1); renderFiles(); updateTicket(); fileInput.focus(); });
      li.append(ext, body, rm);
      fileList.appendChild(li);
      if (MOTION && added && added.includes(entry)) gsap.fromTo(li, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.4, ease: "power3.out", delay: added.indexOf(entry) * 0.06 });
    });
  }

  function addFiles(list) {
    const errors = [];
    const added = [];
    for (const f of Array.from(list)) {
      const ext = extOf(f.name);
      if (!CFG.ACCEPT.includes(ext)) { errors.push(`“${f.name}” no es un .STL ni un .3MF.`); continue; }
      if (f.size === 0) { errors.push(`“${f.name}” está vacío.`); continue; }
      if (f.size > MAX_BYTES) { errors.push(`“${f.name}” pesa más de ${CFG.MAX_FILE_MB} MB. Comprimilo o mandalo por WhatsApp.`); continue; }
      if (state.files.some((x) => x.file.name === f.name && x.file.size === f.size)) continue;
      if (state.files.length >= CFG.MAX_FILES) { errors.push(`Podés subir hasta ${CFG.MAX_FILES} archivos por pedido.`); break; }
      const entry = { file: f, tris: null };
      state.files.push(entry);
      added.push(entry);
      if (ext === ".stl") readTriangles(entry);
    }
    renderFiles(added);
    setError("files", errors.join(" "));
    updateTicket();
  }

  fileInput.addEventListener("change", () => { addFiles(fileInput.files); fileInput.value = ""; });
  ["dragenter", "dragover"].forEach((ev) => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add("is-over"); }));
  ["dragleave", "dragend"].forEach((ev) => dropzone.addEventListener(ev, () => dropzone.classList.remove("is-over")));
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("is-over");
    if (e.dataTransfer && e.dataTransfer.files.length) { addFiles(e.dataTransfer.files); pulse($(".drop__ic", dropzone)); }
  });
  // Si sueltan el archivo fuera de la zona, que el navegador no lo abra y pise la página
  ["dragover", "drop"].forEach((ev) => window.addEventListener(ev, (e) => {
    if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes("Files")) e.preventDefault();
  }));

  /* --- Datos de contacto --- */
  const VALIDATORS = {
    name: (v) => v.trim().length >= 2 ? "" : "Decinos tu nombre.",
    phone: (v) => v.replace(/\D/g, "").length >= 8 ? "" : "Poné tu WhatsApp con código de área (al menos 8 dígitos).",
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Revisá el email: tiene que ser del tipo nombre@dominio.com."
  };
  Object.keys(VALIDATORS).forEach((key) => {
    const input = $("#" + key);
    input.addEventListener("blur", () => { if (input.value.trim()) setError(key, VALIDATORS[key](input.value)); });
    input.addEventListener("input", () => { if (input.hasAttribute("aria-invalid")) setError(key, VALIDATORS[key](input.value)); });
  });

  // Valida todo y devuelve el primer control con error (o null)
  function validateAll() {
    let first = null;
    const fail = (key, msg, el) => { setError(key, msg); if (msg && !first) first = el; };
    fail("printer", state.printer ? "" : "Elegí una impresora para continuar.", $('input[name="printer"]'));
    if (!readHours()) first = first || hoursInput;
    fail("files", state.files.length ? "" : "Subí al menos un archivo .STL o .3MF.", fileInput);
    Object.keys(VALIDATORS).forEach((key) => { const input = $("#" + key); fail(key, VALIDATORS[key](input.value), input); });
    return first;
  }

  /* --- Estado del envío --- */
  const statusBox = $("#formStatus");
  const submitBtn = $("#submitBtn");
  const submitLabel = $(".ticket__submit-label", submitBtn);
  const submitBar = $(".ticket__submit-bar", submitBtn);

  function orderText() {
    const p = state.printer;
    const lines = ["Hola BULK PRINT FARM, quiero pedir horas de impresión:"];
    if (p) lines.push(`• Impresora: ${p.model} (${fmt(p.pricePerHour)}/h)`);
    lines.push(`• Máquinas: ${state.units}`);
    lines.push(`• Horas estimadas por máquina: ${state.hours ? decimal.format(state.hours) + " h" : "a confirmar"}`);
    lines.push(`• Material: ${state.material}`);
    if (state.files.length) lines.push(`• Archivos: ${state.files.map((x) => x.file.name).join(", ")}`);
    lines.push("Te adjunto el archivo por acá.");
    return lines.join("\n");
  }

  function setStatus(type, message, withWhatsApp) {
    statusBox.textContent = "";
    statusBox.className = "ticket__status" + (type === "error" ? " is-error" : "");
    if (!message) { statusBox.hidden = true; return; }
    const p = document.createElement("p");
    p.textContent = message;
    statusBox.appendChild(p);
    if (withWhatsApp) {
      const a = document.createElement("a");
      a.className = "btn btn--primary btn--sm btn--block";
      a.href = waLink(orderText());
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "Mandar el pedido por WhatsApp";
      statusBox.appendChild(a);
    }
    statusBox.hidden = false;
    if (MOTION) gsap.fromTo(statusBox, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35 });
  }

  function setSending(on, progress) {
    submitBtn.disabled = on;
    submitBtn.classList.toggle("is-sending", on);
    submitBtn.setAttribute("aria-busy", String(on));
    if (!on) { submitLabel.textContent = "Enviar pedido"; submitBar.style.transform = ""; return; }
    const pct = Math.round((progress || 0) * 100);
    submitLabel.textContent = pct >= 100 ? "Procesando…" : `Subiendo… ${pct} %`;
    submitBar.style.transform = `scaleX(${progress || 0})`;
  }

  function buildPayload() {
    const p = state.printer;
    const perHour = p.pricePerHour * state.units;
    const fd = new FormData();
    fd.append("subject", `Pedido de horas — ${p.model} × ${state.units}`);
    fd.append("printer_id", p.id);
    fd.append("printer", p.model);
    fd.append("price_per_hour", p.pricePerHour);
    fd.append("units", state.units);
    fd.append("hours_per_unit", state.hours == null ? "" : state.hours);
    fd.append("material", state.material);
    fd.append("rate_per_hour_total", perHour);
    fd.append("estimate_total", state.hours ? perHour * state.hours : "");
    fd.append("currency", CFG.CURRENCY);
    ["name", "email", "phone", "notes"].forEach((key) => fd.append(key, $("#" + key).value.trim()));
    state.files.forEach((entry) => fd.append("files[]", entry.file, entry.file.name));
    return fd;
  }

  // XHR (no fetch) para poder mostrar el progreso de subida del archivo
  const send = (fd, onProgress) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", CFG.FORM_ENDPOINT);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.upload.addEventListener("progress", (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); });
    xhr.addEventListener("load", () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("HTTP " + xhr.status))));
    xhr.addEventListener("error", () => reject(new Error("network")));
    xhr.addEventListener("abort", () => reject(new Error("abort")));
    xhr.send(fd);
  });

  const sentPanel = $("#sentPanel");
  function showSent() {
    const firstName = $("#name").value.trim().split(/\s+/)[0];
    $("#sentText").textContent = `Listo, ${firstName}. Ya tenemos tu archivo: lo revisamos y te escribimos a ${$("#email").value.trim()} con las horas y el total.`;
    form.hidden = true;
    sentPanel.hidden = false;
    sentPanel.focus({ preventScroll: true });
    sentPanel.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" });
    if (MOTION) {
      const check = $(".sent__check", sentPanel);
      const len = check.getTotalLength();
      gsap.timeline()
        .fromTo(sentPanel, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" })
        .fromTo(check, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.out" }, 0.25);
      ScrollTrigger.refresh();
    }
  }

  function resetForm() {
    form.reset();
    state.printer = null; state.units = 1; state.hours = null; state.material = CFG.MATERIALS[0]; state.files = [];
    $$(".pcard").forEach((card) => {
      card.classList.remove("is-chosen");
      const btn = $(".pcard__btn", card);
      btn.setAttribute("aria-pressed", "false");
      $("span", btn).textContent = "Elegir";
    });
    Object.keys(ERR_TARGET).forEach((key) => setError(key, ""));
    setStatus();
    syncMaterials();
    renderFiles();
    setUnits(1);
    sentPanel.hidden = true;
    form.hidden = false;
    if (MOTION) ScrollTrigger.refresh();
    $("#cotizar").scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
  }
  $("#sentReset").addEventListener("click", resetForm);

  let sending = false;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (sending) return;
    if ($("#website").value) return; // honeypot

    const firstInvalid = validateAll();
    if (firstInvalid) {
      setStatus("error", "Faltan datos para enviar el pedido. Revisá los campos marcados.");
      firstInvalid.focus({ preventScroll: true });
      (firstInvalid.closest(".field, .fs") || firstInvalid).scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" });
      return;
    }

    if (!CFG.FORM_ENDPOINT) {
      setStatus("info", "El envío online todavía no está conectado. Mandanos este pedido por WhatsApp y adjuntá el archivo en el chat.", true);
      return;
    }

    sending = true;
    setStatus();
    setSending(true, 0);
    send(buildPayload(), (p) => setSending(true, p))
      .then(() => { showSent(); })
      .catch(() => {
        setStatus("error", "No pudimos enviar el pedido. Revisá tu conexión y probá de nuevo, o mandalo por WhatsApp.", true);
      })
      .then(() => { sending = false; setSending(false); });
  });

  // Estado inicial (+ preselección por link: ?impresora=p1s)
  setUnits(1);
  const preset = new URLSearchParams(location.search).get("impresora");
  if (preset && byId(preset)) selectPrinter(preset);

  /* ------------------------------------------------------------------
     FAQ: acordeón (con GSAP anima la altura; sin GSAP es <details> nativo)
  ------------------------------------------------------------------ */
  if (MOTION) {
    $$(".faq__item").forEach((item) => {
      const body = $(".faq__a", item);
      item.classList.add("acc");
      $("summary", item).addEventListener("click", (e) => {
        e.preventDefault();
        const opening = !item.classList.contains("is-open");
        item.classList.toggle("is-open", opening);
        gsap.killTweensOf(body);
        if (opening) {
          item.open = true;
          gsap.fromTo(body, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.45, ease: "power3.out", clearProps: "height,opacity", onComplete: () => ScrollTrigger.refresh() });
        } else {
          gsap.to(body, { height: 0, opacity: 0, duration: 0.3, ease: "power2.in", onComplete: () => { item.open = false; gsap.set(body, { clearProps: "height,opacity" }); ScrollTrigger.refresh(); } });
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     4. Animaciones GSAP
  ------------------------------------------------------------------ */
  if (HAS_GSAP) {
    gsap.registerPlugin(ScrollTrigger);

    // Barra de progreso y link activo del menú: responden al scroll del usuario
    gsap.to(".progress span", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
    $$(".nav__link").forEach((link) => {
      const section = $(link.getAttribute("href"));
      if (section) ScrollTrigger.create({ trigger: section, start: "top 50%", end: "bottom 50%", onToggle: (self) => link.classList.toggle("is-active", self.isActive) });
    });
  }

  if (MOTION) initMotion();
  window.__bpfReady = true;

  function initMotion() {
    const SplitText = window.SplitText;
    if (SplitText) gsap.registerPlugin(SplitText);
    gsap.defaults({ ease: "power3.out" });

    /* --- Entrada del hero ---
       Se saca .anim ANTES de crear los tweens: si no, GSAP lee el transform
       del CSS como píxeles y el título/header quedan corridos al terminar.
       No hay parpadeo: fromTo() aplica el estado inicial en este mismo tick. */
    root.classList.remove("anim");
    gsap.timeline({ defaults: { ease: "power4.out" } })
      .fromTo(header, { yPercent: -100 }, { yPercent: 0, duration: 0.9 }, 0)
      .fromTo('[data-hero="kicker"]', { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: 0.7 }, 0.15)
      .fromTo(".h-line > span", { yPercent: 112 }, { yPercent: 0, duration: 1.15, stagger: 0.12 }, 0.2)
      .fromTo('[data-hero="lead"]', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.9 }, 0.75)
      .fromTo('[data-hero="cta"]', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.9 }, 0.87)
      .fromTo(".hero__facts li", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.07 }, 1)
      .fromTo(".conveyor .lane", { opacity: 0 }, { opacity: 1, duration: 1.4, stagger: 0.14, ease: "power2.out" }, 0.35);

    /* --- Header: se esconde al bajar, vuelve al subir --- */
    let headerHidden = false;
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate(self) {
        if (root.classList.contains("menu-open")) return;
        const hide = self.direction === 1 && self.scroll() > 600;
        if (hide === headerHidden) return;
        headerHidden = hide;
        gsap.to(header, { yPercent: hide ? -100 : 0, duration: 0.45, ease: "power3.out", overwrite: true });
      }
    });

    /* --- Cinta de máquinas: loop infinito, se acelera con el scroll --- */
    const mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 1024px)", mobile: "(max-width: 1023.98px)" }, (ctx) => {
      const prop = ctx.conditions.desktop ? "yPercent" : "xPercent";
      const lanes = $$(".lane__track").map((track, i) => {
        const back = i % 2 === 1;
        return gsap.fromTo(track, { [prop]: back ? -50 : 0 }, { [prop]: back ? 0 : -50, duration: 44 + i * 10, ease: "none", repeat: -1 });
      });
      const bars = $$(".tile__bar i").map((bar) =>
        gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: gsap.utils.random(5, 13), ease: "none", repeat: -1, repeatDelay: gsap.utils.random(0.4, 1.6) }).progress(Math.random())
      );
      const leds = gsap.to(".tile__led, .lab__dot", { opacity: 0.2, duration: 0.7, ease: "steps(1)", repeat: -1, yoyo: true, stagger: { each: 0.17, from: "random" } });
      const loops = lanes.concat(bars, leds);

      let settle;
      ScrollTrigger.create({
        trigger: ".hero", start: "top bottom", end: "bottom top",
        onToggle: (self) => loops.forEach((t) => (self.isActive ? t.resume() : t.pause())),
        onUpdate(self) {
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 350, 5);
          gsap.to(lanes, { timeScale: boost, duration: 0.2, overwrite: true });
          if (settle) settle.kill();
          settle = gsap.delayedCall(0.25, () => gsap.to(lanes, { timeScale: 1, duration: 1.2, overwrite: true }));
        }
      });

      if (ctx.conditions.desktop) {
        gsap.to(".hero__copy", { yPercent: -10, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
        gsap.to(".conveyor", { yPercent: -5, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      }
    });

    /* --- Títulos: líneas que suben desde una máscara --- */
    if (SplitText) {
      $$("[data-split]").forEach((el) => {
        let played = false;
        SplitText.create(el, {
          type: "lines", mask: "lines", linesClass: "split-line", autoSplit: true,
          onSplit(self) {
            if (played) return;
            return gsap.from(self.lines, {
              yPercent: 110, duration: 1, stagger: 0.1, ease: "power4.out",
              onComplete: () => { played = true; },
              scrollTrigger: { trigger: el, start: "top 88%", once: true }
            });
          }
        });
      });
    }

    /* --- Reveals genéricos por tandas --- */
    gsap.set("[data-reveal]", { opacity: 0, y: 30 });
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 90%", once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, overwrite: true })
    });

    /* --- Pasos: la barra de cada paso se llena con el scroll --- */
    const steps = $$(".step");
    if (steps.length) {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ".steps", start: "top 82%", end: () => (window.innerWidth >= 900 ? "top 30%" : "bottom 65%"), scrub: 0.5 }
      });
      steps.forEach((step, i) => {
        tl.fromTo($(".step__fill", step), { scaleX: 0 }, { scaleX: 1, duration: 1, ease: "none" }, i)
          .fromTo($(".step__n", step), { opacity: 0.25 }, { opacity: 1, duration: 0.35, ease: "none" }, i);
      });
    }

    /* --- Ecuación de la tarifa --- */
    gsap.timeline({ scrollTrigger: { trigger: ".eq", start: "top 82%", once: true } })
      .fromTo(".eq__big", { yPercent: 115 }, { yPercent: 0, duration: 1, stagger: 0.16, ease: "power4.out" }, 0)
      .fromTo(".eq__op", { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.55, stagger: 0.16, ease: "back.out(2.2)" }, 0.3)
      .fromTo(".eq__cap", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12 }, 0.5)
      .fromTo(".eq__rule", { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power3.inOut" }, 1);

    /* --- Footer: wordmark gigante con parallax --- */
    gsap.fromTo(".footer__giant span", { xPercent: -9 }, { xPercent: 0, ease: "none", scrollTrigger: { trigger: ".site-footer", start: "top bottom", end: "bottom bottom", scrub: true } });

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
