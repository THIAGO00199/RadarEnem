import {useEffect,useRef} from 'react';
import type {EssayBrief} from '@/lib/brief';

type Props={topicId:string;theme:string;value:EssayBrief;onChange:(value:EssayBrief)=>void};
declare global {interface Window {KaloreEssayIdeasUI?:{mount:(host:HTMLElement,options:unknown)=>()=>void}}}
export function EssayIdeaExplorer({topicId,theme,value,onChange}:Props){
 const host=useRef<HTMLDivElement>(null),latest=useRef({value,onChange});latest.current={value,onChange};
 useEffect(()=>{
  const current=host.current,ui=window.KaloreEssayIdeasUI;if(!current||!ui)return;
  return ui.mount(current,{initialTopicId:topicId,initialTheme:theme,getBlueprint:()=>latest.current.value,onApply:(suggestion:Record<string,string>)=>{
   latest.current.onChange(window.KaloreBrief.sanitize(suggestion));
  }});
 },[topicId,theme]);
 return <div ref={host} className="radar-idea-explorer"/>;
}
