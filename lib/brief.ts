export type EssayBrief = Record<'tese'|'argumento1'|'argumento2'|'agente'|'acao'|'meio'|'finalidade', string>;
export const briefFields: {key:keyof EssayBrief;label:string;hint:string}[] = [
  {key:'tese',label:'Minha tese',hint:'Qual problema você vai defender e quais causas pretende discutir?'},
  {key:'argumento1',label:'Primeiro argumento',hint:'Causa → exemplo ou repertório → ligação com a tese.'},
  {key:'argumento2',label:'Segundo argumento',hint:'Outro aspecto do problema. Mostre a consequência e explique seu repertório.'},
  {key:'agente',label:'Quem pode agir?',hint:'Nomeie um agente com atribuição para a medida.'},
  {key:'acao',label:'O que deve ser feito?',hint:'Proponha uma ação concreta ligada ao problema discutido.'},
  {key:'meio',label:'Como fazer?',hint:'Indique um meio e detalhe como a medida funcionaria.'},
  {key:'finalidade',label:'Para quê?',hint:'Mostre o efeito esperado e respeite os direitos humanos.'},
];
export const emptyBrief = ():EssayBrief => Object.fromEntries(briefFields.map(x=>[x.key,''])) as EssayBrief;
declare global { interface Window {KaloreBrief: {
  fields:(keyof EssayBrief)[];
  sanitize:(input:unknown)=>EssayBrief;
  map:(input:unknown,ids:string[])=>Record<string,EssayBrief>;
  handoff:(input:unknown,now?:Date)=>null|{version:number;topicId:string;theme:string;createdAt:string;blueprint:EssayBrief};
}}}
