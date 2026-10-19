/* Personal argument practice. Sources describe works; applications remain readings to develop. */
(function(root){
  'use strict';
  const key='atena-arguments-v1',fields=['tese','argumento1','argumento2','agente','acao','meio','finalidade'];
  const tabs=['argumentos','repertorios','intervencao','roteiro'];
  const all=()=>root.AtenaWarMaps||[];
  const get=id=>all().find(map=>map.id===id)||null;
  const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  function sanitize(raw){
    const value=raw&&typeof raw==='object'&&!Array.isArray(raw)&&raw.version===1?raw:{};
    const text=(v,max)=>typeof v==='string'?v.slice(0,max):'';
    const state={version:1,active:get(value.active)?.id||all()[0]?.id||'',tab:tabs.includes(value.tab)?value.tab:'argumentos',query:text(value.query,120),axis:text(value.axis,80),onlyFavorites:value.onlyFavorites===true,favorites:[],drafts:{}};
    state.favorites=[...new Set(Array.isArray(value.favorites)?value.favorites.filter(id=>get(id)):[])].slice(0,all().length);
    if(value.drafts&&typeof value.drafts==='object'&&!Array.isArray(value.drafts))for(const [id,draft] of Object.entries(value.drafts))if(get(id)&&draft&&typeof draft==='object'&&!Array.isArray(draft))state.drafts[id]=Object.fromEntries(fields.map(field=>[field,text(draft[field],2000)]));
    return state;
  }
  function search(state){
    const terms=normalize(state.query).split(/\s+/).filter(Boolean);
    return all().filter(map=>(!state.axis||map.axis===state.axis)&&(!state.onlyFavorites||state.favorites.includes(map.id))&&terms.every(term=>normalize([map.title,map.axis,map.thesis,...map.words,...map.cause.refs.flat(),...map.impact.refs.flat()].join(' ')).includes(term)));
  }
  function outline(map){return {tese:map.thesis,argumento1:map.cause.claim+'\n\nMecanismo a explicar: '+map.cause.why,argumento2:map.impact.claim+'\n\nConsequência a desenvolver: '+map.impact.why,agente:map.pi.who,acao:map.pi.what,meio:map.pi.how,finalidade:map.pi.why+'\n\nDetalhamento: '+map.pi.detail};}
  function fillEmpty(current,suggestion){const value={...current};let added=0;for(const field of fields)if(!String(current?.[field]||'').trim()&&typeof suggestion[field]==='string'&&suggestion[field].length<=2000){value[field]=suggestion[field];added++;}return {value,added};}
  function markdown(map,draft={}){
    const section=(label,item)=>['## '+label,item.claim,item.why,...item.refs.map(ref=>'### '+ref[0]+'\n\nAplicação possível: '+ref[1]+(ref[2]?'\n\nFonte: '+ref[2]:''))].join('\n\n');
    return ['# ATENA · Argumentos e repertórios',map.title,'Proposta autoral de treino, não previsão do ENEM. Aplicações são leituras possíveis: confira a obra e adapte ao recorte.','## Tese possível',map.thesis,section('Causa e mecanismo',map.cause),section('Consequência e alcance',map.impact),'## Intervenção possível',...Object.entries(map.pi).map(([k,v])=>k+': '+v),'## Meu roteiro',...fields.map(field=>'### '+field+'\n\n'+(draft[field]||'(a desenvolver)'))].join('\n\n');
  }
  root.AtenaArguments={key,fields,tabs,all,get,normalize,sanitize,search,outline,fillEmpty,markdown};
})(globalThis);
