import {useEffect, useState} from 'react';
import {ArrowRight, ArrowUpRight, Check, Download, FileText, Lightbulb} from 'lucide-react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {briefFields, type EssayBrief} from '@/lib/brief';
import {safeURL} from '@/lib/radar-model';
import './writing-canvas.css';

type Props = {
  open:boolean;onOpenChange:(open:boolean)=>void;
  topic:{id:string;title:string;proposal:string;angles:string[];related:{id:string;title:string;url:string;source:string}[]};
  value:EssayBrief;onChange:(value:EssayBrief)=>void;saved:boolean;notes:string;
};
const steps = [
  {label:'Posição',title:'O que você vai defender?',description:'Delimite o problema e formule uma posição. Seu roteiro pode mudar enquanto você escreve.',fields:briefFields.slice(0,1)},
  {label:'Argumentos',title:'Conecte evidência e ideia.',description:'Explique como cada exemplo ou repertório ajuda a sustentar sua tese.',fields:briefFields.slice(1,3)},
  {label:'Intervenção',title:'Transforme o problema em ação.',description:'Proponha uma medida concreta. Detalhe sua execução e o efeito esperado.',fields:briefFields.slice(3)},
];
export function WritingCanvas({open,onOpenChange,topic,value,onChange,saved,notes}:Props){
  const [step,setStep]=useState(0),[handoffError,setHandoffError]=useState('');
  const count=briefFields.filter(f=>value[f.key].trim()).length;
  useEffect(()=>{if(open){setStep(0);setHandoffError('');const frame=requestAnimationFrame(()=>window.KaloreMotion?.enter(document.querySelector('.writing-canvas')));return()=>cancelAnimationFrame(frame)}},[open,topic.id]);
  function exportBrief(){
    const text='# Meu roteiro de redação · Kaloré\n\nTema: '+topic.proposal+'\n\n'+briefFields.map(f=>'## '+f.label+'\n\n'+(value[f.key]||'Ainda por escrever.')).join('\n\n')+'\n\n## Minhas anotações\n\n'+(notes||'Sem anotações.')+'\n\n## Fontes para conferir\n\n'+topic.related.map(e=>'- '+e.title+': '+e.url).join('\n')+'\n\nPlanejamento autoral. Os campos preenchidos não avaliam as competências nem estimam nota.';
    const u=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download='kalore-roteiro-'+topic.id+'.md';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
  }
  function transfer(){
    try{
      if(!count){setHandoffError('Escreva pelo menos uma ideia antes de levar seu roteiro ao Hub.');return;}
      localStorage.setItem('kalore-essay-brief-v1',JSON.stringify({version:1,topicId:topic.id,theme:topic.proposal,createdAt:new Date().toISOString(),blueprint:value}));
      location.href='./estudar.html?roteiro='+encodeURIComponent(topic.id)+'#redacao';
    }catch{setHandoffError('O navegador não permitiu preparar a transferência. Exporte o roteiro para guardar suas ideias.');}
  }
  const current=steps[step];
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="app-dialog writing-canvas">
    <DialogHeader><span className="eyebrow">IDEIAS COM UM CAMINHO</span><DialogTitle>Da ideia ao seu roteiro.</DialogTitle><DialogDescription>{topic.proposal}</DialogDescription></DialogHeader>
    <div className="canvas-progress"><div><span>{count} de 7 campos com ideias</span><span role="status">{saved?'Salvo neste navegador':'Sem salvar · exporte uma cópia'}</span></div><div className="canvas-track" role="img" aria-label={count+' de 7 campos preenchidos'}><span style={{width:count/7*100+'%'}}/></div></div>
    <div className="canvas-layout"><div className="canvas-editor">
      <div className="canvas-steps" role="group" aria-label="Etapas do planejamento">{steps.map((s,i)=><button key={s.label} onClick={()=>setStep(i)} aria-pressed={step===i}><span aria-hidden="true">{s.fields.every(f=>value[f.key].trim())?<Check size={13}/>:i+1}</span>{s.label}</button>)}</div>
      <div className="canvas-step-body" key={step}><h3>{current.title}</h3><p>{current.description}</p><div className={'canvas-fields '+(step===2?'canvas-fields-pair':'')}>{current.fields.map(f=><label key={f.key} htmlFor={'brief-'+f.key}><span>{f.label}</span><textarea id={'brief-'+f.key} value={value[f.key]} onChange={e=>onChange({...value,[f.key]:e.target.value})} maxLength={2000} rows={step===0?7:4} placeholder={f.hint}/><small>{value[f.key].length}/2.000 caracteres</small></label>)}</div></div>
      <div className="canvas-step-actions"><span>Etapa {step+1} de 3</span><div>{step>0&&<button className="button secondary" onClick={()=>setStep(step-1)}>Voltar</button>}{step<2?<button className="button primary" onClick={()=>setStep(step+1)}>Continuar<ArrowRight size={16}/></button>:<button className="button primary" onClick={transfer}>Levar para o Hub<ArrowUpRight size={16}/></button>}</div></div>
    </div><aside className="canvas-reference"><div><Lightbulb size={19}/><h3>Ângulos para investigar</h3><ul>{topic.angles.map(a=><li key={a}>{a}</li>)}</ul></div>{notes&&<div><h3>Seu caderno de repertórios</h3><p className="canvas-note">{notes}</p></div>}<div><h3>Confira as fontes</h3>{topic.related.length?topic.related.slice(0,4).map(e=><a key={e.id} href={safeURL(e.url)} target="_blank" rel="noreferrer">{e.title}<small>{e.source}<ArrowUpRight size={12}/></small></a>):<p>Este tema ainda não tem fontes nesta base. Pesquise e avalie evidências antes de escrever.</p>}</div><small>Esses campos organizam ideias. Preenchê-los não demonstra qualidade argumentativa nem atribui nota.</small></aside></div>
    {handoffError&&<p className="form-error" role="alert">{handoffError}</p>}
    <div className="canvas-footer"><button className="button secondary" onClick={exportBrief}><Download size={16}/>Exportar roteiro</button><p><FileText size={15}/>No Hub, você confere o roteiro e preenche os campos vazios. Seu rascunho permanece com você.</p></div>
  </DialogContent></Dialog>;
}
