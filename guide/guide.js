(() => {
  "use strict";
  const sections = window.HANYOUNG_GUIDE || [];
  const deck = window.DECK || [];
  const slideRange = (id) => {
    const numbers = deck.flatMap((s,i)=>s.guide===id||s.relatedGuides?.includes(id)?[i+1]:[]);
    const ranges=[];
    for(let i=0;i<numbers.length;i++){const start=numbers[i];let end=start;while(numbers[i+1]===end+1)end=numbers[++i];ranges.push(start===end?String(start):start+"–"+end);}
    return ranges.join(", ");
  };
  const toc = document.querySelector("#toc");
  const content = document.querySelector("#guide-content");
  const dialog = document.querySelector("#image-dialog");
  const imageLarge = document.querySelector("#image-large");
  const imageCaption = document.querySelector("#image-caption");
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
  const image = ([path, caption]) => { const wizard = path.endsWith("/agent-prompt.png"); return `<figure class="guide-image"><button type="button" data-image="../assets/${escapeHtml(path)}" data-caption="${escapeHtml(caption)}" aria-label="${escapeHtml(caption)} 확대"><span class="${wizard ? "guide-wizard-shot" : "guide-image-wrap"}"><img src="../assets/${escapeHtml(path)}" alt="${escapeHtml(caption)}">${wizard ? '<span class="guide-wizard-marker" aria-hidden="true"></span>' : ""}</span></button><figcaption>${escapeHtml(caption)} · 눌러서 확대</figcaption></figure>`; };
  const links = (pairs) => pairs?.length ? `<div class="resource-actions">${pairs.map(([href,label],index) => `<a class="${index ? "secondary" : ""}" href="${escapeHtml(href)}" target="${href.startsWith("http") ? "_blank" : "_self"}" rel="noopener">${escapeHtml(label)} ↗</a>`).join("")}</div>` : "";
  const copyBlocks = (items) => { if (!items?.length) return ""; let out=""; for(let i=0;i<items.length;i+=2){out+=`<div class="copy-block"><strong>${escapeHtml(items[i])}</strong><pre>${escapeHtml(items[i+1])}</pre><button type="button" data-copy="${escapeHtml(items[i+1])}">문구 복사</button></div>`;} return out; };
  const guideStep = (num, title, html) => `<div class="guide-step"><h3><span class="step-index">${num}</span>${title}</h3>${html}</div>`;

  toc.innerHTML = `<strong>참가자 교재 · G01–G${sections.length}</strong>${sections.map(s=>`<a href="#${s.id}" data-nav="${s.id}">${s.id} ${escapeHtml(s.title)}</a>`).join("")}`;
  content.innerHTML = `<h1>SEN스쿨 × 구글 클래스룸(Education Plus)</h1><p class="section-lead">SenGPT로 수업자료를 만들고 검토·수정하기</p><p>예일여자고등학교 · 2026.10.6. 14:00–16:00 · 아가페실. SenGPT의 수업자료 생성·검토와 수정·에이전트 재사용이 현장 필수 실습입니다. Gemini 상세 내용은 강사 시연과 연수 후 참고 경로에 보존합니다.</p>` + sections.map((s,index)=>{
    const prev = sections[index-1], next=sections[index+1];
    const slides = slideRange(s.id);
    const firstSlide = deck.findIndex(item=>item.guide===s.id||item.relatedGuides?.includes(s.id))+1;
    const images = s.images?.length ? s.images.map(image).join("") : `<p>이 절에는 별도 조작 화면이 없습니다. 아래 자료 설명과 발표 슬라이드를 함께 봅니다.</p>`;
    return `<section class="section-view" id="${s.id}" aria-labelledby="${s.id}-title"><span class="section-code">${s.id} / ${sections.length}</span><h2 id="${s.id}-title">${escapeHtml(s.title)}</h2><p class="section-lead">${escapeHtml(s.lead)}</p><a class="slide-jump" href="../slides/index.html#slide=${firstSlide}" target="_blank" rel="noopener">연결 슬라이드 ${slides} ↗</a>
      ${guideStep("01", "현재 위치", `<p>교재 ${s.id} · 발표 슬라이드 ${slides}</p>`)}
      ${guideStep("02", "할 일", `<ol>${s.tasks.map(t=>`<li>${t}</li>`).join("")}</ol>`)}
      ${guideStep("03", "화면과 참고 자료", images)}
      ${guideStep("04", "복사 문구와 원문 링크", `${links(s.links)}${copyBlocks(s.copy)}${!s.links?.length&&!s.copy?.length?"<p>이 절에서 복사할 문구나 새 URL은 없습니다.</p>":""}`)}
      ${s.extra||""}
      ${guideStep("05", "여기까지 하면 성공", `<div class="success-box">${escapeHtml(s.success)}</div>`)}
      ${guideStep("06", "안 되면", `<details><summary>접속·화면·근거 확인 방법</summary><div class="details-body"><ul>${s.fail.map(t=>`<li>${escapeHtml(t)}</li>`).join("")}</ul></div></details>`)}
      <nav class="section-nav" aria-label="이전·다음 절">${prev?`<a href="#${prev.id}">← ${prev.id} 이전</a>`:"<span></span>"}${next?`<a href="#${next.id}">다음 ${next.id} →</a>`:"<span></span>"}</nav></section>`;
  }).join("");

  document.addEventListener("click", async (event) => {
    const copy = event.target.closest("[data-copy]");
    if (copy) {
      try { await navigator.clipboard.writeText(copy.dataset.copy); copy.textContent="복사됨"; setTimeout(()=>copy.textContent="문구 복사",1600); }
      catch { copy.textContent="복사 실패 · 직접 선택해 복사"; }
    }
    const zoom = event.target.closest("[data-image]");
    if (zoom) { imageLarge.src=zoom.dataset.image; imageLarge.alt=zoom.dataset.caption; imageCaption.textContent=zoom.dataset.caption; dialog.showModal(); }
  });
  document.querySelector("#image-close").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("click",(event)=>{if(event.target===dialog)dialog.close();});
  const menu = document.querySelector("#menu-toggle");
  menu.addEventListener("click",()=>{const open=toc.classList.toggle("open");menu.setAttribute("aria-expanded",String(open));});
  toc.addEventListener("click",(event)=>{if(event.target.closest("a")){toc.classList.remove("open");menu.setAttribute("aria-expanded","false");}});
  const setCurrent = (id) => toc.querySelectorAll("[data-nav]").forEach(a=>a.classList.toggle("current",a.dataset.nav===id));
  const observer = new IntersectionObserver((entries)=>{const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0]; if(visible)setCurrent(visible.target.id);},{rootMargin:"-15% 0px -70% 0px"});
  document.querySelectorAll(".section-view").forEach(s=>observer.observe(s));
  addEventListener("hashchange",()=>setCurrent(location.hash.slice(1)));
  setCurrent(location.hash.slice(1)||"G01");
  const back=document.querySelector("#back-to-top");
  back.addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));
  addEventListener("scroll",()=>back.classList.toggle("visible",scrollY>700),{passive:true});
})();
