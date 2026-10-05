/* Accessible, reusable theme and argument explorer for Radar and Hub. */
(function (root) {
  "use strict";
  const esc=(value)=>String(value??"").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const labels={tese:"tese",argumento1:"argumento 1",argumento2:"argumento 2",agente:"agente",acao:"ação",meio:"meio",finalidade:"finalidade"};
  function mount(host,options){
    const bank=root.KaloreEssayIdeas;if(!bank||!host)return()=>{};
    const conf=()=>typeof options.current==="function"?options.current():options;
    const start=conf(),initial=bank.findTheme(start.initialTheme);
    let topicId=(start.initialTopicId&&bank.get(start.initialTopicId)?.id)||initial?.id||bank.all()[0].id;
    let routeId=bank.get(topicId).routes[0].id,proposalIndex=Math.max(0,bank.get(topicId).proposals.findIndex((p)=>p===start.initialTheme));
    const unique=[...new Set(bank.all().map((t)=>t.axis))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    host.innerHTML='<section class="essay-ideas-shell" aria-label="Laboratório de ideias para redação"><div class="essay-ideas-heading"><div><span class="essay-ideas-kicker">LABORATÓRIO EDITORIAL · 17 EIXOS · 34 CAMINHOS</span><h3>Comece por uma direção. Escreva com a sua voz.</h3><p>Explore recortes, teses, argumentos e intervenções possíveis. As ideias são pontos de partida autorais; nenhum tema é previsão da prova.</p></div><button class="essay-ideas-export" type="button" data-idea-export>Baixar guia deste tema ↓</button></div><div class="essay-ideas-controls"><label><span>Buscar tema ou recorte</span><input type="search" autocomplete="off" placeholder="Ex.: inclusão digital, leitura, cuidado..." data-idea-search></label><label><span>Eixo</span><select data-idea-axis><option value="all">Todos os eixos</option>'+unique.map((axis)=>'<option>'+esc(axis)+'</option>').join("")+'</select></label><label><span>Tema para desenvolver</span><select data-idea-topic>'+bank.all().map((t)=>'<option value="'+esc(t.id)+'">'+esc(t.title)+'</option>').join("")+'</select></label></div><p class="essay-ideas-count" data-idea-count role="status" aria-live="polite"></p><div class="essay-ideas-main" data-idea-main></div><p class="essay-ideas-footnote">Planejamento educacional, sem nota automática. Exemplos sinalizados são hipotéticos, não repertório factual. Confira fontes e adapte a tese ao enunciado real.</p></section>';
    const $=(selector)=>host.querySelector(selector),search=$("[data-idea-search]"),axis=$("[data-idea-axis]"),topic=$("[data-idea-topic]"),main=$("[data-idea-main]"),count=$("[data-idea-count]");
    function setTopic(id){const selected=bank.get(id);if(!selected)return;topicId=id;proposalIndex=0;routeId=selected.routes[0].id;proposalIndex=Math.max(0,selected.proposals.findIndex((p)=>p===conf().initialTheme));topic.value=id;render();}
    function render(){
      const matching=bank.search(search.value,axis.value);
      count.textContent=matching.length+" de 17 temas · 2 caminhos argumentativos por tema.";
      for(const option of topic.options)option.hidden=!matching.some((t)=>t.id===option.value);
      if(!matching.some((t)=>t.id===topicId)){if(!matching.length){main.innerHTML='<div class="essay-ideas-empty"><strong>Nenhum tema com esses filtros.</strong><button type="button" data-idea-clear>Limpar busca e eixo</button></div>';return;}topicId=matching[0].id;proposalIndex=0;routeId=bank.get(topicId).routes[0].id;topic.value=topicId;}
      const t=bank.get(topicId),r=t.routes.find((item)=>item.id===routeId)||t.routes[0];routeId=r.id;proposalIndex=Math.min(proposalIndex,t.proposals.length-1);
      const proposal=t.proposals[proposalIndex],selected=r;
      const path=(arg,n,key)=>'<article class="idea-argument"><div><span>LINHA '+n+'</span><h4>'+esc(arg.claim)+'</h4></div><p>'+esc(arg.reason)+'</p><p><b>Exemplo de treino · hipotético</b> · '+esc(arg.example)+'</p><p class="idea-question"><b>Conecte ao tema</b> · '+esc(arg.question)+'</p><button type="button" data-idea-field="'+key+'">Usar como '+labels[key]+' ↗</button></article>';
      const routeMarkup=t.routes.map((item,i)=>'<button type="button" class="idea-route-tab" role="tab" id="idea-tab-'+esc(item.id)+'" aria-controls="idea-panel-'+esc(item.id)+'" aria-selected="'+(item.id===selected.id)+'" tabindex="'+(item.id===selected.id?'0':'-1')+'" data-idea-route="'+esc(item.id)+'"><span>0'+(i+1)+'</span>'+esc(item.label)+'</button>').join("");
      main.innerHTML='<div class="idea-proposal-card"><div><span>RECORTE PARA TREINAR</span><p>'+esc(proposal)+'</p></div>'+(conf().onTheme?'<button type="button" data-idea-theme>Usar este tema no editor</button>':'')+'</div><div class="idea-route-tabs" role="tablist" aria-label="Caminhos argumentativos">'+routeMarkup+'</div><section class="idea-route-panel" role="tabpanel" id="idea-panel-'+esc(selected.id)+'" aria-labelledby="idea-tab-'+esc(selected.id)+'"><div class="idea-thesis"><div><span>TESE POSSÍVEL</span><p>'+esc(selected.thesis)+'</p></div><button type="button" data-idea-field="tese">Usar como tese ↗</button></div><div class="idea-arguments">'+path(selected.arguments[0],1,"argumento1")+path(selected.arguments[1],2,"argumento2")+'</div><div class="idea-intervention"><div><span>INTERVENÇÃO POSSÍVEL · 4 ELEMENTOS</span><h4>Transforme o diagnóstico em ação.</h4></div><dl>'+Object.entries(selected.intervention).map(([field,value])=>'<div><dt>'+esc(labels[field])+'</dt><dd>'+esc(value)+'</dd></div>').join("")+'</dl><button type="button" data-idea-field="intervention">Preencher os campos de intervenção vazios ↗</button></div><details class="idea-refine"><summary>Teste se o argumento ficou consistente</summary><div><p><b>Conceito para estudar:</b> '+esc(t.concepts[proposalIndex%2].title)+' — '+esc(t.concepts[proposalIndex%2].text)+'</p><p><b>Perguntas para revisar</b></p><ul>'+t.questions.map((q)=>'<li>'+esc(q)+'</li>').join("")+'</ul><p class="idea-care"><b>Cuidado de escrita:</b> '+esc(selected.care)+'</p></div></details><button type="button" class="idea-apply-path" data-idea-apply>Preencher campos vazios deste caminho ↗</button><p class="idea-apply-status" data-idea-status role="status" aria-live="polite"></p><div class="idea-sources"><span>Leitura da cartilha do Inep</span>'+t.sources.map((s)=>'<a href="'+esc(s.url)+'" target="_blank" rel="noreferrer">'+esc(s.title)+' ↗</a>').join("")+'</div></section>';
      // When the user chooses among three practice prompts, all remain visible in an accessible selector.
      const previous=$("[data-idea-proposal]");
      if(previous)previous.remove();
      const proposals=document.createElement("label");proposals.className="idea-proposal-select";proposals.dataset.ideaProposal="true";proposals.innerHTML='<span>Varie o recorte de treino</span><select aria-label="Escolher recorte de treino">'+t.proposals.map((p,i)=>'<option value="'+i+'">'+esc(p)+'</option>').join("")+'</select>';
      proposals.querySelector("select").value=String(proposalIndex);$("[data-idea-main]").prepend(proposals);
    }
    search.addEventListener("input",render);axis.addEventListener("change",render);topic.addEventListener("change",()=>setTopic(topic.value));
    main.addEventListener("change",(event)=>{if(event.target.matches(".idea-proposal-select select")){proposalIndex=Number(event.target.value)||0;render();}});
    main.addEventListener("keydown",(event)=>{
      const tab=event.target.closest(".idea-route-tab");if(!tab)return;
      const choices=bank.get(topicId).routes,index=choices.findIndex((item)=>item.id===tab.dataset.ideaRoute);let next=index;
      if(event.key==="ArrowRight")next=(index+1)%choices.length;else if(event.key==="ArrowLeft")next=(index+choices.length-1)%choices.length;else if(event.key==="Home")next=0;else if(event.key==="End")next=choices.length-1;else return;
      event.preventDefault();routeId=choices[next].id;render();$("#idea-tab-"+CSS.escape(routeId))?.focus();
    });
    main.addEventListener("click",(event)=>{
      const button=event.target.closest("button");if(!button)return;
      if(button.dataset.ideaClear!==undefined){search.value="";axis.value="all";render();search.focus();return;}
      if(button.dataset.ideaRoute){routeId=button.dataset.ideaRoute;render();$("#idea-tab-"+CSS.escape(routeId))?.focus();return;}
      const current=conf(),blueprint=bank.blueprint(topicId,routeId);if(!blueprint)return;
      if(button.dataset.ideaTheme!==undefined){const selected=bank.get(topicId).proposals[proposalIndex];current.onTheme?.(selected);$('[data-idea-status]').textContent="Tema escolhido; seu texto continua salvo.";return;}
      if(button.dataset.ideaExport!==undefined)return;
      const fields=button.dataset.ideaField;
      if(fields){const names=fields==="intervention"?["agente","acao","meio","finalidade"]:[fields];const old=current.getBlueprint?.()||{};let added=0;const result={...old};for(const field of names){const suggestion=blueprint[field],value=typeof old[field]==="string"?old[field]:"";if(value.trim())continue;if(suggestion.length>2000)continue;result[field]=suggestion;added++;}if(added)current.onApply?.(result);$('[data-idea-status]').textContent=added?added+" campo(s) vazio(s) preenchido(s); suas ideias anteriores ficaram intactas.":"Os campos escolhidos já têm texto. Nada foi substituído.";return;}
      if(button.dataset.ideaApply!==undefined){const filled=bank.fillEmpty(current.getBlueprint?.()||{},blueprint);if(filled.added)current.onApply?.(filled.value);$('[data-idea-status]').textContent=filled.added?filled.added+" de 7 campos vazios preenchidos. Revise e adapte cada sugestão.":"Não havia campos vazios para preencher; suas ideias ficaram intactas.";}
    });
    $("[data-idea-export]").addEventListener("click",()=>{const blob=new Blob([bank.markdown(topicId,proposalIndex)],{type:"text/markdown;charset=utf-8"}),href=URL.createObjectURL(blob),link=document.createElement("a");link.href=href;link.download="kalore-ideias-"+topicId+".md";link.click();setTimeout(()=>URL.revokeObjectURL(href),2000);});
    setTopic(topicId);
    return()=>{URL.revokeObjectURL("");host.replaceChildren();};
  }
  root.KaloreEssayIdeasUI={mount};
})(globalThis);
