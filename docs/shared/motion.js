/* Native, optional motion. No hidden content and no animation dependency. */
(function(root){
 "use strict";
 const reduced=()=>matchMedia("(prefers-reduced-motion: reduce)").matches||!!document.querySelector(".motion-off");
 function enter(element){if(!element||reduced()||!element.animate)return;for(const a of element.getAnimations())if(a.id==="kalore-enter")a.cancel();const a=element.animate([{transform:"translateY(9px)"},{transform:"translateY(0)"}],{duration:280,easing:"cubic-bezier(.22,1,.36,1)"});a.id="kalore-enter";}
 function feedback(target,correct,detail){
  if(!target)return;target.querySelector(".feedback-chip")?.remove();
  const box=document.createElement("div");box.className="feedback-chip"+(reduced()?"":" glow-feedback-enter");box.dataset.kind=correct?"success":"retry";box.setAttribute("role","status");
  const symbol=document.createElement("span");symbol.className="feedback-symbol";symbol.setAttribute("aria-hidden","true");symbol.textContent=correct?"✓":"↻";
  const copy=document.createElement("div");copy.className="feedback-copy";const title=document.createElement("strong");title.textContent=correct?"Mandou bem!":"Vamos entender juntos.";const sub=document.createElement("small");sub.textContent=detail||(correct?"Mais uma ideia que agora é sua.":"O erro indica o próximo ponto para revisar.");copy.append(title,sub);box.append(symbol,copy);target.append(box);
  if(!correct||reduced()||!box.animate)return;
  for(let i=0;i<8;i++){const p=document.createElement("i");p.className="feedback-particle";p.style.background=i%2?"var(--kalore-violet)":"var(--glow-action)";p.setAttribute("aria-hidden","true");box.append(p);const angle=(i/8)*Math.PI*2,dx=Math.cos(angle)*55,dy=Math.sin(angle)*32;const a=p.animate([{transform:"translate(0,0) rotate(0deg)",opacity:1},{transform:"translate("+dx+"px,"+dy+"px) rotate(110deg)",opacity:0}],{duration:650+i*25,easing:"cubic-bezier(.2,.7,.4,1)"});a.onfinish=()=>p.remove();setTimeout(()=>p.remove(),1100);}
 }
 function init(scope=document){
  const progress=document.createElement("div");progress.className="glow-scroll-progress";progress.setAttribute("aria-hidden","true");document.body.append(progress);
  const seen=new WeakSet(),pending=new Set();let scanFrame=0,scrollFrame=0;
  const io=typeof IntersectionObserver==="undefined"?null:new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){if(!reduced())entry.target.classList.add("glow-arrived");pending.delete(entry.target);io.unobserve(entry.target);}},{threshold:.08});
  function scan(){scanFrame=0;if(!io||reduced())return;for(const el of scope.querySelectorAll(".panel,.glow-card,.pdf-resource,.metric")){if(seen.has(el))continue;const r=el.getBoundingClientRect();if(!r.height)continue;seen.add(el);if(r.top<innerHeight)continue;pending.add(el);io.observe(el);}for(const el of pending)if(!el.isConnected){io.unobserve(el);pending.delete(el);}}
  const observer=new MutationObserver(records=>{const relevant=records.some(r=>r.type==="attributes"?r.target.matches(".tab"):Array.from(r.addedNodes).some(n=>n.nodeType===1));if(relevant&&!scanFrame)scanFrame=requestAnimationFrame(scan);});observer.observe(scope,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});scan();
  const update=()=>{scrollFrame=0;const max=document.documentElement.scrollHeight-innerHeight;progress.style.setProperty("--scroll-progress",max>0?String(Math.min(1,Math.max(0,scrollY/max))):"0");};
  const scroll=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(update);};addEventListener("scroll",scroll,{passive:true});update();
  return()=>{observer.disconnect();io?.disconnect();removeEventListener("scroll",scroll);cancelAnimationFrame(scanFrame);cancelAnimationFrame(scrollFrame);progress.remove();};
 }
 root.KaloreMotion={enter,feedback,init,reduced};
})(window);
