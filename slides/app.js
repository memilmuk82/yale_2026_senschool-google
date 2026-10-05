(() => {
  "use strict";
  const deck = Array.isArray(window.DECK) ? window.DECK : [];
  const stage = document.querySelector("#stage");
  const counter = document.querySelector("#counter");
  const progress = document.querySelector("#progress span");
  const notes = document.querySelector("#notes");
  const overview = document.querySelector("#overview");
  const notesToggle = document.querySelector("#notes-toggle");
  const overviewToggle = document.querySelector("#overview-toggle");
  const stageWidth = 1600;
  const stageHeight = 900;
  let current = 0;
  let revealStep = 0;
  let touchStart = null;
  let printMode = false;
  let modal = null;
  let modalReturnFocus = null;

  const clamp = (value) => Math.min(Math.max(value, 0), Math.max(deck.length - 1, 0));
  const fromHash = () => {
    const match = location.hash.match(/slide=(\d+)/);
    return match ? clamp(Number(match[1]) - 1) : 0;
  };

  function slideMarkup(item, index, extra = "") {
    const anchor = item.guide ? `#${item.guide}` : "";
    return `<article class="slide ${item.layout || ""} ${extra}" data-section="${item.section || ""}">
      ${item.html}
      <a class="page-link" href="./index.html#slide=${index+1}" target="_blank" rel="noopener">이 페이지 ↗</a>
      <nav class="screen-links" aria-label="실제 화면 바로 열기">${(item.liveLinks||[]).map(link=>`<a href="${link.url}" target="_blank" rel="noopener">${link.label} ↗</a>`).join("")}</nav>
      <span class="slide-number">${String(index + 1).padStart(2, "0")} / ${String(deck.length).padStart(2, "0")}</span>
      <a class="guide-link" href="../guide/index.html${anchor}" target="_blank" rel="noopener">상세 교안 ↗</a>
    </article>`;
  }

  function render() {
    closeMediaModal();
    const item = deck[current];
    if (!item) return;
    stage.innerHTML = slideMarkup(item, current);
    showReveal();
    counter.textContent = `${current + 1} / ${deck.length}`;
    progress.style.width = `${((current + 1) / deck.length) * 100}%`;
    notes.innerHTML = `<header><strong>강사 노트</strong><button type="button" aria-label="노트 닫기">×</button></header><p>${item.notes || "이 화면의 명령과 실제 결과를 연결해 설명합니다."}</p>`;
    document.title = `${current + 1} · ${item.title}`;
    history.replaceState(null, "", `#slide=${current + 1}`);
    overview.querySelectorAll("[data-index]").forEach((button) => button.classList.toggle("current", Number(button.dataset.index) === current));
    document.querySelector("#prev").disabled = current === 0 && revealStep === 0;
    document.querySelector("#next").disabled = current === deck.length - 1 && revealStep >= revealTotal();
  }

  function closeMediaModal() {
    if (!modal) return;
    modal.remove();
    modal = null;
    document.body.classList.remove("media-modal-open");
    modalReturnFocus?.focus();
    modalReturnFocus = null;
  }

  function openMediaModal(button) {
    const src = button.dataset.modalSrc;
    if (!src) return;
    closeMediaModal();
    modalReturnFocus = button;
    modal = document.createElement("div");
    modal.className = "media-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", button.dataset.modalTitle || "실제 화면 확대");
    const panel = document.createElement("div");
    panel.className = "media-modal-panel";
    const header = document.createElement("header");
    const title = document.createElement("strong");
    title.textContent = button.dataset.modalTitle || "실제 화면";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "media-modal-close";
    close.setAttribute("aria-label", "실제 화면 닫기");
    close.textContent = "×";
    header.append(title, close);
    const img = document.createElement("img");
    img.src = src;
    img.alt = button.dataset.modalTitle || "실제 화면";
    panel.append(header, img);
    modal.append(panel);
    modal.addEventListener("click", (event) => { if (event.target === modal || event.target === close) closeMediaModal(); });
    document.body.append(modal);
    document.body.classList.add("media-modal-open");
    close.focus();
  }

  function revealTotal() { return Math.max(0, ...[...stage.querySelectorAll("[data-step]")].map(el => Number(el.dataset.step) || 0)); }
  function showReveal() {
    stage.querySelectorAll("[data-step]").forEach(el => {
      const n = Number(el.dataset.step);
      el.classList.toggle("revealed", n <= revealStep);
      el.classList.toggle("active-step", n === revealStep);
    });
    stage.querySelectorAll("[data-step-count]").forEach(el => { el.textContent = `${revealStep} / ${revealTotal()}`; });
  }
  function next() {
    if (revealStep < revealTotal()) { revealStep++; render(); }
    else go(current + 1);
  }
  function previous() {
    if (revealStep > 0) { revealStep--; render(); }
    else go(current - 1, true);
  }
  function go(index, end = false) {
    current = clamp(index);
    revealStep = 0;
    render();
    if (end) { revealStep = revealTotal(); render(); }
  }

  function scale() {
    if (printMode) return;
    const width = Math.max(innerWidth - 34, 320);
    const height = Math.max(innerHeight - 34, 180);
    stage.style.transform = `translate(-50%, -50%) scale(${Math.min(width / stageWidth, height / stageHeight)})`;
  }

  function togglePanel(panel, button, force) {
    const open = typeof force === "boolean" ? force : !panel.classList.contains("open");
    panel.classList.toggle("open", open);
    button.setAttribute("aria-expanded", String(open));
  }

  function buildOverview() {
    overview.innerHTML = `<div class="overview-panel"><header><div><span>전체 ${deck.length}장</span><h2>슬라이드 개요</h2></div><button type="button" aria-label="개요 닫기">×</button></header><div class="overview-grid">${deck.map((item, index) => `<button type="button" data-index="${index}"><span>${String(index + 1).padStart(2, "0")}</span><strong>${item.title}</strong></button>`).join("")}</div></div>`;
    overview.addEventListener("click", (event) => {
      if (event.target === overview || event.target.closest("header button")) return togglePanel(overview, overviewToggle, false);
      const button = event.target.closest("[data-index]");
      if (!button) return;
      togglePanel(overview, overviewToggle, false);
      go(Number(button.dataset.index));
    });
  }

  function preparePrint() {
    if (printMode) return;
    printMode = true;
    document.body.classList.add("print-mode");
    stage.style.transform = "none";
    stage.innerHTML = deck.map((item, index) => slideMarkup(item, index, "print-slide reveal-all")).join("");
  }

  function restorePrint() {
    if (!printMode) return;
    printMode = false;
    document.body.classList.remove("print-mode");
    render();
    scale();
  }

  document.querySelector("#prev").addEventListener("click", previous);
  document.querySelector("#next").addEventListener("click", next);
  stage.addEventListener("click", (event) => {
    const mediaCard = event.target.closest("[data-modal-src]");
    if (mediaCard) { openMediaModal(mediaCard); return; }
    if (event.target.closest("a,button")) return;
    next();
  });
  overviewToggle.addEventListener("click", () => togglePanel(overview, overviewToggle));
  notesToggle.addEventListener("click", () => togglePanel(notes, notesToggle));
  notes.addEventListener("click", (event) => { if (event.target.closest("button")) togglePanel(notes, notesToggle, false); });
  document.querySelector("#fullscreen").addEventListener("click", async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  });
  document.querySelector("#print").addEventListener("click", () => { preparePrint(); requestAnimationFrame(() => print()); });
  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (modal) {
      if (key === "escape") { event.preventDefault(); closeMediaModal(); }
      else if (["arrowright", "arrowleft", "pagedown", "pageup", " ", "home", "end"].includes(key)) event.preventDefault();
      return;
    }
    if (["arrowright", "pagedown", " "].includes(key)) { event.preventDefault(); next(); }
    else if (["arrowleft", "pageup"].includes(key)) { event.preventDefault(); previous(); }
    else if (key === "home") go(0);
    else if (key === "end") go(deck.length - 1);
    else if (key === "o") togglePanel(overview, overviewToggle);
    else if (key === "n") togglePanel(notes, notesToggle);
    else if (key === "f") document.querySelector("#fullscreen").click();
    else if (key === "p") document.querySelector("#print").click();
    else if (key === "escape") { togglePanel(overview, overviewToggle, false); togglePanel(notes, notesToggle, false); }
  });
  stage.addEventListener("touchstart", (event) => { touchStart = event.changedTouches[0]; }, { passive: true });
  stage.addEventListener("touchend", (event) => {
    if (modal) return;
    if (!touchStart) return;
    const end = event.changedTouches[0];
    const dx = end.clientX - touchStart.clientX;
    const dy = end.clientY - touchStart.clientY;
    touchStart = null;
    if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : previous)();
  }, { passive: true });
  addEventListener("resize", scale);
  addEventListener("hashchange", () => { const next = fromHash(); if (next !== current) go(next); });
  addEventListener("beforeprint", preparePrint);
  addEventListener("afterprint", restorePrint);
  buildOverview();
  current = fromHash();
  render();
  scale();
  if (new URLSearchParams(location.search).has("print")) preparePrint();
})();
