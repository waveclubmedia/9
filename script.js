/* ==========================================
   WAVECLUBMEDIA — script.js
   ========================================== */
(function(){
'use strict';

const $  = (s,c=document) => c.querySelector(s);
const $$ = (s,c=document) => [...c.querySelectorAll(s)];

/* ── COOKIE ── */
(function(){
  const b = $('#cookieBanner');
  if(!b) return;
  if(!localStorage.getItem('wcm_cc')) setTimeout(()=>b.classList.add('show'),900);
  function dismiss(v){ b.style.transform='translateY(100%)'; setTimeout(()=>b.style.display='none',500); localStorage.setItem('wcm_cc',v); }
  $('#cookieAccept')  && $('#cookieAccept').addEventListener('click',()=>dismiss('all'));
  $('#cookieDecline') && $('#cookieDecline').addEventListener('click',()=>dismiss('ess'));
  $('#cookiePolicyLink') && $('#cookiePolicyLink').addEventListener('click',e=>{ e.preventDefault(); dismiss('pending'); openPriv(); });
})();

/* ── NAVBAR SCROLL ── */
(function(){
  const nav=$('#navbar');
  if(!nav) return;
  const run=()=>nav.classList.toggle('scrolled',scrollY>60);
  window.addEventListener('scroll',run,{passive:true});
  run();
})();

/* ── BURGER / MOBILE MENU ── */
(function(){
  const burger=$('#burger'), menu=$('#mobMenu');
  if(!burger||!menu) return;
  burger.addEventListener('click',()=>{
    const o=menu.classList.toggle('open');
    burger.classList.toggle('open',o);
    document.body.classList.toggle('locked',o);
  });
  $$('.mob-link',menu).forEach(l=>l.addEventListener('click',()=>{
    menu.classList.remove('open'); burger.classList.remove('open'); document.body.classList.remove('locked');
  }));
})();

/* ── SMOOTH SCROLL ── */
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"],button[href^="#"]');
  if(!a) return;
  const href=a.getAttribute('href');
  if(!href||!href.startsWith('#')) return;
  const target=document.querySelector(href);
  if(!target) return;
  e.preventDefault();
  const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav'))||68;
  window.scrollTo({top:target.getBoundingClientRect().top+scrollY-navH-16,behavior:'smooth'});
  // close mobile menu
  const m=$('#mobMenu'),bg=$('#burger');
  if(m&&m.classList.contains('open')){m.classList.remove('open');bg&&bg.classList.remove('open');document.body.classList.remove('locked');}
});

/* ── SCROLL ANIMATIONS (safe — content visible by default, animated when JS runs) ── */
(function(){
  const els=$$('.anim,.anim-fade');
  if(!els.length) return;
  if(!('IntersectionObserver' in window)){
    els.forEach(el=>{el.classList.add('in');});
    return;
  }
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const d=parseFloat(e.target.dataset.delay||0)*1000;
        setTimeout(()=>e.target.classList.add('in'),d);
        obs.unobserve(e.target);
      }
    });
  },{threshold:.12,rootMargin:'0px 0px -36px 0px'});
  els.forEach(el=>obs.observe(el));
})();

/* ── COUNTERS ── */
(function(){
  const els=$$('[data-count]');
  if(!els.length) return;
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      const el=e.target, end=+el.dataset.count, dur=1500, step=16;
      const inc=end/(dur/step); let cur=0;
      const t=setInterval(()=>{ cur=Math.min(cur+inc,end); el.textContent=Math.floor(cur); if(cur>=end) clearInterval(t); },step);
      obs.unobserve(el);
    });
  },{threshold:.5});
  els.forEach(el=>obs.observe(el));
})();

/* ── FAQ ── */
$$('.faq-q').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const item=btn.closest('.faq-item'), open=item.classList.contains('open');
    $$('.faq-item.open').forEach(i=>i.classList.remove('open'));
    if(!open) item.classList.add('open');
  });
});

/* ── REVIEWS SLIDER ── */
(function(){
  const track=$('#revTrack'), dotsWrap=$('#revDots');
  const cards=$$('.rev-card');
  const prev=$('#revPrev'), next=$('#revNext');
  if(!track||!cards.length) return;
  let cur=0, perV=getPV(), maxI=Math.max(0,cards.length-perV), auto;

  function getPV(){ return innerWidth<680?1:innerWidth<900?2:3; }

  function buildDots(){
    if(!dotsWrap) return;
    dotsWrap.innerHTML='';
    const n=Math.ceil(cards.length/perV);
    for(let i=0;i<n;i++){
      const d=document.createElement('button');
      d.className='rdot'+(i===0?' active':'');
      d.addEventListener('click',()=>go(i));
      dotsWrap.appendChild(d);
    }
  }
  function updDots(){
    if(!dotsWrap) return;
    $$('.rdot',dotsWrap).forEach((d,i)=>d.classList.toggle('active',i===Math.floor(cur/perV)));
  }
  function go(page){
    perV=getPV(); maxI=Math.max(0,cards.length-perV);
    cur=Math.min(page*perV,maxI);
    const gap=20, w=(track.parentElement.offsetWidth-gap*(perV-1))/perV;
    track.style.transform=`translateX(-${cur*(w+gap)}px)`;
    updDots();
  }
  function goNext(){ const p=Math.floor(cur/perV)+1; go(p>=Math.ceil(cards.length/perV)?0:p); }
  function goPrev(){ const p=Math.floor(cur/perV)-1; go(p<0?Math.ceil(cards.length/perV)-1:p); }
  function startAuto(){ clearInterval(auto); auto=setInterval(goNext,5000); }

  next&&next.addEventListener('click',()=>{ goNext(); startAuto(); });
  prev&&prev.addEventListener('click',()=>{ goPrev(); startAuto(); });
  window.addEventListener('resize',()=>{ perV=getPV(); maxI=Math.max(0,cards.length-perV); cur=0; track.style.transform='translateX(0)'; buildDots(); });

  buildDots(); startAuto();
})();

/* ── RADIO PLAYER ── */
(function(){
  const playBtn=$('#rPlay'), pIco=$('#rPlayIco'), paIco=$('#rPauseIco');
  const trackEl=$('#rTrack'), volEl=$('#rVol'), bars=$('#rBars'), liveBadge=$('#liveRadioBadge');
  if(!playBtn) return;
  let playing=false;
  const tracks=['WCM — Exclusive Mix Vol.1','WAVECLUBMEDIA — Live Session','WCM Radio — Independent Hits','WCM — New Releases Stream','WAVECLUB RADIO — Label Mix'];
  let ti=0;
  if(trackEl) trackEl.textContent='В эфире: '+tracks[0];

  playBtn.addEventListener('click',()=>{
    playing=!playing;
    if(pIco) pIco.style.display=playing?'none':'block';
    if(paIco) paIco.style.display=playing?'block':'none';
    if(bars) bars.classList.toggle('playing',playing);
    if(playing){ ti=(ti+1)%tracks.length; if(trackEl) trackEl.textContent='В эфире: '+tracks[ti]; }
  });

  liveBadge&&liveBadge.addEventListener('click',()=>{
    const s=$('#radio-section');
    if(s){ const nav=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav'))||68; window.scrollTo({top:s.offsetTop-nav-16,behavior:'smooth'}); }
  });
  volEl&&volEl.addEventListener('input',()=>{/* attach to real audio when stream URL ready */});
})();

/* ── GALLERY LIGHTBOX ── */
$$('.gal-item').forEach(item=>{
  item.addEventListener('click',()=>{
    const img=item.querySelector('img'); if(!img) return;
    const lb=document.createElement('div');
    lb.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.93);z-index:20000;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(8px);animation:lbfade .2s ease;';
    const st=document.createElement('style'); st.textContent='@keyframes lbfade{from{opacity:0}to{opacity:1}}'; document.head.appendChild(st);
    const im=document.createElement('img');
    im.src=img.src; im.style.cssText='max-width:90vw;max-height:90vh;object-fit:contain;border-radius:6px;box-shadow:0 20px 80px rgba(0,0,0,.8);';
    lb.appendChild(im); document.body.appendChild(lb);
    lb.addEventListener('click',()=>lb.remove());
    document.addEventListener('keydown',function esc(e){ if(e.key==='Escape'){lb.remove();document.removeEventListener('keydown',esc);} });
  });
});

/* ── MODALS ── */
function openModal(id){
  const m=$('#'+id); if(!m) return;
  m.classList.add('open'); document.body.classList.add('locked');
}
function closeModal(id){
  const m=$('#'+id); if(!m) return;
  m.classList.remove('open');
  if(!$('.modal.open')) document.body.classList.remove('locked');
}
function openPriv(){
  const o=$('#privOverlay'); if(!o) return;
  o.classList.add('open'); document.body.classList.add('locked');
}
function closePriv(){
  const o=$('#privOverlay'); if(!o) return;
  o.classList.remove('open'); document.body.classList.remove('locked');
}

// Booking triggers
['heroBook','aboutBook','footerBook'].forEach(id=>{
  const el=$(id?'#'+id:null); el&&el.addEventListener('click',()=>openModal('modal-booking'));
});
// Radio order
const rob=$('#radioOrderBtn'); rob&&rob.addEventListener('click',()=>{ openModal('modal-booking'); preselect('Ротация на радио'); });
// Service buttons
$$('[data-service]').forEach(btn=>{
  btn.addEventListener('click',()=>{ openModal('modal-booking'); preselect(btn.dataset.service); });
});
function preselect(val){
  const sel=$('#bService'); if(!sel) return;
  for(let i=0;i<sel.options.length;i++){ if(sel.options[i].text===val){ sel.selectedIndex=i; break; } }
}

// Detail modals
const details={
  recording:{t:'Запись на студии',c:'<p>Студийная сессия включает:</p><ul><li>Запись вокала/инструментов;</li><li>Профессиональный звукорежиссёр;</li><li>Помощь и советы по ходу записи;</li><li>Детальная проработка и финальный звук.</li></ul><p><strong>Цены:</strong> от 1 500 ₽/час. Минимум 1 час.</p>'},
  mixing:{t:'Сведение и мастеринг',c:'<p>Включает:</p><ul><li>Сведение дорожек (голос + бит);</li><li>Тональная коррекция (auto-tune);</li><li>Частотная, динамическая обработка;</li><li>Саунд-дизайн, эффекты на голосе;</li><li>Мастеринг финального материала.</li></ul><p><strong>Цены:</strong> Сведение+Мастеринг — 7 990 ₽ | Только сведение — 5 990 ₽ | Только мастеринг — 2 990 ₽.<br>Сроки: до 5 дней.</p>'},
  beats:{t:'Создание бита',c:'<p>Профессиональный бит под ваш стиль:</p><ul><li>Анализ референсов и стиля;</li><li>Оригинальный бит;</li><li>До 3 итераций правок;</li><li>Финальный микс.</li></ul><p><strong>Цены:</strong> от 4 990 ₽.</p>'},
  writing:{t:'Текст на заказ',c:'<p>Команда гострайтеров создаст текст:</p><ul><li>Полное погружение в стиль клиента;</li><li>Куплеты, припевы, бридж;</li><li>Демо-запись;</li><li>Правки по необходимости.</li></ul><p><strong>Цены:</strong> от 9 990 ₽/трек.</p>'},
  promo:{t:'Продвижение артиста',c:'<p>Комплексное продвижение:</p><ul><li>Таргетированная реклама;</li><li>Поиск и анализ ЦА;</li><li>Размещение в плейлистах;</li><li>Личный менеджер + ежедневные отчёты.</li></ul><p><strong>Цены:</strong> Таргет — от 14 990 ₽/мес | Плейлисты — от 4 990 ₽.</p>'},
  dist:{t:'Дистрибуция трека',c:'<p>Официальный релиз на все платформы:</p><ul><li>Spotify, Apple Music, YouTube Music;</li><li>ВК Музыка, Яндекс Музыка, SberZvuk;</li><li>100+ других сервисов;</li><li>Роялти-выплаты и отчёты.</li></ul><p><strong>Цены:</strong> от 1 990 ₽. Сроки: 5–14 дней.</p>'},
  radio:{t:'Ротация на радио',c:'<p>Твой трек на WAVECLUB RADIO:</p><ul><li>Эфир 24/7;</li><li>Возможность прямых эфиров;</li><li>Статистика прослушиваний;</li><li>Упоминание в соцсетях лейбла.</li></ul><p><strong>Цены:</strong> от 4 990 ₽/неделю.</p>'}
};
$$('[data-detail]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const d=details[btn.dataset.detail]; if(!d) return;
    let ex=$('#detModal'); if(ex) ex.remove();
    const m=document.createElement('div');
    m.id='detModal'; m.className='modal open';
    m.innerHTML=`<div class="modal-bg" id="detBg"></div><div class="modal-box"><button class="modal-x" id="detX">✕</button><img src="https://raw.githubusercontent.com/mrgrayyooo/wcm/refs/heads/main/logo.png" width="44" style="margin:0 auto 14px;display:block;border-radius:50%;"><h3 class="modal-title">${d.t}</h3><div style="font-size:.86rem;color:#aaa;line-height:1.75;margin-bottom:20px;">${d.c}</div><button class="btn-red btn-full" id="detBook">Заказать</button></div>`;
    // inject list styles
    const s=document.createElement('style'); s.textContent='#detModal ul{padding-left:18px;margin:10px 0}#detModal li{margin-bottom:4px}#detModal strong{color:#fff}';
    document.head.appendChild(s);
    document.body.appendChild(m); document.body.classList.add('locked');
    $('#detX').addEventListener('click',()=>{ m.remove(); document.body.classList.remove('locked'); });
    $('#detBg').addEventListener('click',()=>{ m.remove(); document.body.classList.remove('locked'); });
    $('#detBook').addEventListener('click',()=>{ m.remove(); document.body.classList.remove('locked'); openModal('modal-booking'); preselect(d.t); });
  });
});

// Coop
['openCoop','openCoopMob'].forEach(id=>{ const el=$('#'+id); el&&el.addEventListener('click',()=>openModal('modal-coop')); });
$('#closeCoop')&&$('#closeCoop').addEventListener('click',()=>closeModal('modal-coop'));
$('#cbg')&&$('#cbg').addEventListener('click',()=>closeModal('modal-coop'));

// Close booking
$('#closeBooking')&&$('#closeBooking').addEventListener('click',()=>closeModal('modal-booking'));
$('#mbg')&&$('#mbg').addEventListener('click',()=>closeModal('modal-booking'));

// Privacy
['openPrivacy','mPrivLink','cPrivLink'].forEach(id=>{ const el=$('#'+id); el&&el.addEventListener('click',e=>{ e.preventDefault(); openPriv(); }); });
$('#closePriv')&&$('#closePriv').addEventListener('click',closePriv);
$('#openPayments')&&$('#openPayments').addEventListener('click',e=>{ e.preventDefault(); showToast('Оплата: банковский перевод, карта, СБП. Детали уточните у менеджера.'); });

// Escape key
document.addEventListener('keydown',e=>{ if(e.key!=='Escape') return; $$('.modal.open').forEach(m=>m.classList.remove('open')); closePriv(); document.body.classList.remove('locked'); });

/* ── FORMS ── */
function showToast(msg){
  const t=$('#toast'); if(!t) return;
  if(msg) t.querySelector('svg').nextSibling.textContent=' '+msg;
  t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),4000);
}
function shake(el){ el.style.borderColor='#b01030'; el.style.animation='none'; setTimeout(()=>{ el.style.animation='shk .4s ease'; setTimeout(()=>el.style.animation='',400); },10); }
const shkS=document.createElement('style'); shkS.textContent='@keyframes shk{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}60%{transform:translateX(5px)}}'; document.head.appendChild(shkS);

$('#submitBooking')&&$('#submitBooking').addEventListener('click',()=>{
  const n=$('#bName'), c=$('#bContact'), s=$('#bService');
  if(!n.value.trim()){ shake(n); return; }
  if(!c.value.trim()){ shake(c); return; }
  if(!s.value){ shake(s); return; }
  closeModal('modal-booking'); showToast('Заявка отправлена! Мы свяжемся с вами.');
  setTimeout(()=>{ n.value=''; c.value=''; s.selectedIndex=0; const cm=$('#bComment'); if(cm) cm.value=''; },400);
});
$('#submitCoop')&&$('#submitCoop').addEventListener('click',()=>{
  const n=$('#cName'), c=$('#cContact'), m=$('#cMsg');
  if(!n.value.trim()){ shake(n); return; }
  if(!c.value.trim()){ shake(c); return; }
  if(!m.value.trim()){ shake(m); return; }
  closeModal('modal-coop'); showToast('Заявка отправлена! Мы свяжемся с вами.');
  setTimeout(()=>{ n.value=''; c.value=''; m.value=''; },400);
});

// Reset input error on type
$$('.minput').forEach(i=>i.addEventListener('input',function(){ this.style.borderColor=''; }));

/* ── PARALLAX HERO ── */
(function(){
  const img=$('.hero-img'); if(!img) return;
  let tick=false;
  window.addEventListener('scroll',()=>{
    if(tick) return;
    requestAnimationFrame(()=>{ const y=scrollY; if(y<innerHeight) img.style.transform=`scale(1.05) translateY(${y*.22}px)`; tick=false; }); tick=true;
  },{passive:true});
})();

console.log('%cWAVECLUBMEDIA','color:#b01030;font-family:monospace;font-size:18px;font-weight:bold;');
console.log('%cMusic Brand • Recording Studio • Independent Label • Radio','color:#555;font-family:monospace;font-size:11px;');

})();
