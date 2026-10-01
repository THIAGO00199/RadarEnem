/* Deterministic recommendations from local progress; no invented score or remote profile. */
(function(root){
 "use strict";
 const names={ling:"Linguagens",hum:"Humanas",nat:"Natureza",mat:"Matemática",red:"Redação"};
 const dayKey=(date)=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo"}).format(date);
 function choose(s,now=new Date(),exams=[]){
  const pending=(s.errors||[]).filter(e=>!e.reviewed).length;
  if(pending)return{key:"errors",tab:"erros",title:"Transforme um erro em acerto.",why:pending+" questão"+(pending===1?"":"ões")+" no caderno de erros ainda precisa"+(pending===1?"":"m")+" de revisão.",action:"Revisar meus erros",minutes:5};
  const due=Object.values(s.flash||{}).filter(f=>f&&typeof f.due==="string"&&f.due<=dayKey(now)&&(f.stage>0||f.reps>0||Boolean(f.last))).length;
  if(due)return{key:"flash",tab:"flashcards",title:"Sua memória pediu uma revisão.",why:due+" cartão"+(due===1?" está":"ões estão")+" no dia de revisar. Tente lembrar antes de virar.",action:"Revisar cartões",minutes:5};
  const draft=String(s.draft||"").trim();
  const saved=(s.essays||[]).some(e=>String(e.text||"").trim()===draft);
  if(draft.length>40&&!saved)return{key:"draft",tab:"redacao",title:"Sua redação está esperando você.",why:"Há um rascunho salvo neste navegador. Continue de onde parou.",action:"Continuar meu texto",minutes:15};
  const recent=(s.officialHistory||[]).find(x=>Number.isInteger(x.first)&&Number.isInteger(x.second)&&exams.some(e=>e.id===x.examId));
  if(recent){const exam=exams.find(e=>e.id===recent.examId),areas=exam.day===1?["ling","hum"]:["nat","mat"],index=recent.first<=recent.second?0:1,area=areas[index],score=index===0?recent.first:recent.second;if(score<30)return{key:"official",tab:"trilhas",area,title: names[area]+" merece o próximo bloco.",why:"No seu último treino oficial, essa área teve "+score+" de 45 acertos. Comece por uma lição curta.",action:"Praticar "+names[area],minutes:10};}
  const areas=Object.keys(names),profile=s.profile||{},progress=s.area||{};
  const area=areas.sort((a,b)=>(Number(profile["d_"+b])||2)-(Number(profile["d_"+a])||2)||(Number(progress[a])||0)-(Number(progress[b])||0))[0];
  const done=Object.keys(s.course?.done||{}).filter(k=>s.course.done[k]).length;
  return{key:done?"continue":"start",tab:"trilhas",area,title:done?"Seu ritmo continua por aqui.":"Uma lição. Seu primeiro avanço.",why:Number(profile["d_"+area])===3?"Você marcou "+names[area]+" como uma área que pede reforço. Vamos começar por ela.":done?"Sua próxima lição prioriza "+names[area]+" pelo progresso registrado.":"Comece por "+names[area]+" em uma lição curta. O próximo passo muda conforme você pratica.",action:done?"Continuar em "+names[area]:"Começar em "+names[area],minutes:10};
 }
 const api={choose};if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.KaloreRecommend=api;
})(typeof window!=="undefined"?window:globalThis);
