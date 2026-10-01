import { readFile, writeFile, mkdir } from "node:fs/promises";
import vm from "node:vm";
const root = new URL("../portable/public/", import.meta.url);
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(await readFile(new URL("hub/library-data.js", root), "utf8"), sandbox);
const { resources } = sandbox.KaloreLibrary;
const site = "https://thiago00199.github.io/RadarEnem/";
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const subjects = { redacao: "Redação", matematica: "Matemática", natureza: "Ciências da Natureza", humanas: "Ciências Humanas", linguagens: "Linguagens", revisao: "Revisão e exercícios", planejamento: "Planejamento", provas: "Provas e gabaritos do ENEM" };
const content = {
  redacao: {
    title: "Redação do ENEM: planejar, escrever e revisar",
    lead: "Pratique a construção da tese, conecte seus argumentos e revise a intervenção. Um caderno autoral de seis páginas para transformar o planejamento em uma redação completa.",
    sections: [
      ["Comece pelo recorte", "Identifique o problema e a situação que será discutida. Escreva uma tese que mostre a relação entre uma causa e um efeito, em vez de apenas dizer que o problema existe."],
      ["Mostre o mecanismo do argumento", "Organize o parágrafo em quatro passos: ideia central, explicação, exemplo ou repertório e ligação com a tese. Explique como a referência ajuda a entender o problema."],
      ["Proponha uma intervenção específica", "Indique quem pode agir, o que será feito, por qual meio e com qual finalidade. Detalhe um elemento e confira se a proposta responde às causas que você analisou."],
      ["Revise em duas passagens", "Primeiro, confira a lógica e o atendimento ao tema. Depois, revise coesão, referências, pontuação, concordância e ortografia. Escolha uma melhoria concreta para a próxima escrita."],
    ],
    included: ["Roteiro com tese, dois argumentos e intervenção", "Proposta autoral sobre acesso à leitura", "Folha numerada de 30 linhas para imprimir", "Checklist para comparar duas versões do texto"],
    action: "redacao", label: "Abrir o laboratório de redação", cat: "redacao",
  },
  matematica: {
    title: "Matemática para o ENEM: problemas e soluções",
    lead: "12 questões autorais em seis páginas, com espaço de resolução e comentários. Treine porcentagem, escala, estatística, funções, probabilidade, geometria e unidades.",
    sections: [
      ["Leia o pedido antes de calcular", "Identifique a incógnita e as unidades. Separe os dados necessários. Um cálculo correto para uma pergunta diferente também leva a uma resposta errada."],
      ["Cuidado com a base da porcentagem", "Um aumento de 20% e uma redução de 20% não se anulam quando são sucessivos. Em 500 unidades, os fatores 1,20 e 0,80 produzem 480 unidades."],
      ["Confira as conversões", "Uma hora e meia corresponde a 1,5 hora. Um litro corresponde a 1.000 cm³. Ao calcular área ou volume, observe se todas as medidas usam unidades compatíveis."],
      ["Corrija a causa do erro", "Classifique o erro como leitura, conceito, cálculo, unidade ou tempo. Refaça o problema sem consultar a solução antes de passar para o próximo bloco."],
    ],
    included: ["Três blocos de quatro questões", "Quatro alternativas por questão autoral", "Espaço para contas e raciocínio", "Resolução comentada dos 12 problemas"],
    action: "questoes", label: "Praticar questões no Hub", cat: "matematica",
  },
  revisao: {
    title: "Revisão de Humanas e Natureza para o ENEM",
    lead: "Recupere ideias, explique mecanismos e use evidências. Um caderno de cinco páginas com seis desafios discursivos autorais, respostas orientadoras e uma rota de revisão.",
    sections: [
      ["Recupere antes de reler", "Leia um trecho curto, feche o material e escreva três ideias. Confira as lacunas e faça uma questão relacionada. Na revisão seguinte, tente recuperar as relações antes de consultar o capítulo."],
      ["Em Natureza, explique a relação", "Conecte as grandezas e as unidades. Em uma transformação química, observe a conservação. Em Biologia, descreva o mecanismo e considere os limites de um modelo simplificado."],
      ["Em Humanas, contextualize a fonte", "Pergunte quem produziu o documento, quando, para qual público e com qual intenção. Compare as informações com outras evidências antes de interpretar o fenômeno."],
      ["Escolha a próxima lacuna", "Depois da correção, selecione uma relação que ainda não consegue explicar. Resolva um exemplo menor, refaça o desafio e registre o que mudou no raciocínio."],
    ],
    included: ["Ficha de recuperação ativa", "Três desafios de Natureza e três de Humanas", "Respostas com os mecanismos explicados", "Plano de revisão de sete dias"],
    action: "revisao", label: "Abrir o guia de revisão", cat: "revisao",
  },
  planejamento: {
    title: "Plano de estudo para o ENEM e caderno de erros",
    lead: "Planeje as horas que cabem na sua semana e escolha uma entrega concreta por sessão. Quatro páginas para organizar a agenda, entender os erros e acompanhar a revisão.",
    sections: [
      ["Planeje o tempo disponível", "Considere descanso, escola, trabalho e deslocamento. Defina metas que possam ser conferidas: exercícios corrigidos, um argumento reescrito ou um problema explicado sem consulta."],
      ["Priorize com evidência", "Use os últimos treinos para identificar duas dificuldades. Combine estudo do conceito, exercícios, correção e uma nova tentativa. Ajuste o plano semanal quando o tempo ou as necessidades mudarem."],
      ["Registre a causa do erro", "Anote o pedido da questão, seu raciocínio, o ponto em que ele falhou e a resolução adequada. Indique um sinal que ajude a reconhecer esse tipo de problema no futuro."],
      ["Retome sem punição", "Se uma sessão não acontecer, ajuste a agenda e retome com uma ação menor. Os intervalos do caderno são sugestões de treino; adapte-os ao conteúdo e à sua recuperação."],
    ],
    included: ["Estrutura de um ciclo de quatro semanas", "Agenda semanal preenchível à mão", "Ficha detalhada de registro de erros", "Quadro para revisões em intervalos"],
    action: "plano", label: "Gerar meu plano no Hub", cat: "planejamento",
  },
};
const layout = (name, description, path, body, schema) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(name)} | Kaloré</title><meta name="description" content="${escape(description)}"><meta name="theme-color" content="#0c1115"><link rel="canonical" href="${site}materiais/${path}"><link rel="icon" href="../favicon.svg"><link rel="stylesheet" href="../shared/tokens.css"><link rel="stylesheet" href="./materials.css"><meta property="og:title" content="${escape(name)}"><meta property="og:description" content="${escape(description)}"><meta property="og:type" content="article"><meta property="og:url" content="${site}materiais/${path}"><script type="application/ld+json">${JSON.stringify(schema).replaceAll("<", "\\u003c")}</script></head><body><a class="skip" href="#conteudo">Pular para o conteúdo</a><header><a class="brand" href="../">kaloré <span>ENEM / MATERIAIS</span></a><nav aria-label="Produtos"><a href="../">Radar</a><a href="../estudar.html">ENEM Hub</a></nav></header><main id="conteudo">${body}</main><footer><b>Feito por Kaloré, para todos.</b><p>Projeto independente e gratuito. Materiais externos pertencem aos autores e instituições indicados. Os cadernos Kaloré são autorais de prática.</p><a href="../estudar.html#biblioteca">Biblioteca interativa</a> · <a href="./index.html">Todos os materiais</a> · <a href="https://github.com/THIAGO00199/RadarEnem">Código no GitHub</a></footer></body></html>`;
await mkdir(new URL("materiais/", root), { recursive: true });
for (const [slug, c] of Object.entries(content)) {
  const related = resources.filter((r) => r.cat === c.cat && !r.local && r.kind !== "gabarito").slice(0, 5);
  const body = `<a class="back" href="./index.html">← Todos os materiais</a><div class="hero"><span class="eyebrow">CADERNOS KALORÉ / PDF GRATUITO</span><h1>${escape(c.title)}</h1><p>${escape(c.lead)}</p><div class="actions"><a class="button primary" href="./pdfs/${slug}.pdf" download>Baixar caderno PDF ↓</a><a class="button" href="../estudar.html#${c.action}">${escape(c.label)} →</a></div><div class="trust"><span>Sem cadastro</span><span>PDF para imprimir</span><span>Material autoral</span></div></div><div class="article-layout"><article>${c.sections.map(([t,p]) => `<section><h2>${escape(t)}</h2><p>${escape(p)}</p></section>`).join("")}<section><h2>Materiais para continuar</h2>${related.map((r) => `<p class="related"><a href="${escape(r.url)}" target="_blank" rel="noopener noreferrer">${escape(r.title)} ↗</a><small>${escape(r.source)} · ${r.year} · <a href="${escape(r.sourceUrl)}" target="_blank" rel="noopener noreferrer">ver fonte</a></small></p>`).join("")}</section></article><aside><div class="note"><span class="eyebrow">DENTRO DO CADERNO</span><h2>Prática, com espaço para pensar.</h2><ul>${c.included.map((s) => `<li>${escape(s)}</li>`).join("")}</ul><a class="button primary" href="./pdfs/${slug}.pdf" download>Baixar PDF ↓</a></div><p class="small">As regras e os critérios de avaliação do exame devem ser consultados nos documentos da edição atual do Inep. Este material serve para treino.</p></aside></div>`;
  await writeFile(new URL(`materiais/${slug}.html`, root), layout(c.title,c.lead,slug+".html",body,{"@context":"https://schema.org","@type":"LearningResource",name:c.title,description:c.lead,inLanguage:"pt-BR",isAccessibleForFree:true,educationalLevel:"Ensino Médio",learningResourceType:"Guia de estudo",url:site+"materiais/"+slug+".html",author:{"@type":"Organization",name:"Kaloré"},encoding:{"@type":"MediaObject",encodingFormat:"application/pdf",contentUrl:site+"materiais/pdfs/"+slug+".pdf"}}));
}
const cards = resources.filter((r) => r.local).map((r) => `<a class="guide-card" href="${r.sourceUrl.replace("./materiais/", "./")}"><span class="eyebrow">PDF / ${escape(subjects[r.cat])}</span><h2>${escape(r.title)}</h2><p>${escape(r.desc)}</p><span class="read-more">Ver guia e baixar →</span></a>`).join("");
const lists = Object.entries(subjects).map(([cat, title]) => `<section class="catalog-section" id="${cat}"><h2>${title}</h2><div class="catalog-list">${resources.filter((r) => r.cat === cat && !r.local).map((r) => `<article><div><h3><a href="${escape(r.url)}" target="_blank" rel="noopener noreferrer">${escape(r.title)} ↗</a></h3><p>${escape(r.desc)}</p><small>${escape(r.source)} · ${r.year}${r.size ? " · " + escape(r.size) : ""}</small></div><a class="source" href="${escape(r.sourceUrl)}" target="_blank" rel="noopener noreferrer">Fonte ↗</a></article>`).join("")}</div></section>`).join("");
const indexBody=`<div class="hero"><span class="eyebrow">BIBLIOTECA / ENEM</span><h1>PDFs para estudar.<br>Um próximo passo para cada dúvida.</h1><p>${resources.length} PDFs: cartilhas de redação, apostilas por matéria, provas de 2017 a 2025 e quatro cadernos próprios. Um catálogo gratuito com fonte identificada.</p><div class="actions"><a class="button primary" href="../estudar.html#biblioteca">Abrir biblioteca com favoritos →</a><a class="button" href="../estudar.html#provas-oficiais">Treinar uma prova oficial</a></div></div><section><h2>Cadernos Kaloré para baixar</h2><div class="guide-grid">${cards}</div></section><nav class="subject-nav" aria-label="Matérias">${Object.entries(subjects).map(([key,title])=>`<a href="#${key}">${title}</a>`).join("")}</nav>${lists}<p class="small">Links extraídos de páginas institucionais em 01/10/2026. A disponibilidade dos arquivos depende da instituição. Se o PDF não abrir, use “Fonte”. Os PDFs externos exigem internet; os quatro cadernos próprios também ficam disponíveis no Hub offline após uma visita com internet.</p>`;
await writeFile(new URL("materiais/index.html", root), layout("PDFs gratuitos para o ENEM: redação, provas e apostilas","Biblioteca com 68 PDFs para estudar para o ENEM: cartilhas, provas e gabaritos, apostilas gratuitas e cadernos autorais de prática.","index.html",indexBody,{"@context":"https://schema.org","@type":"CollectionPage",name:"Biblioteca Kaloré de PDFs para o ENEM",url:site+"materiais/index.html",inLanguage:"pt-BR",isAccessibleForFree:true}));
await writeFile(new URL("sitemap.xml", root),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${["","estudar.html","materiais/index.html",...Object.keys(content).map((s)=>"materiais/"+s+".html")].map((p)=>`<url><loc>${site+p}</loc></url>`).join("")}</urlset>\n`);
console.log("Materiais:", resources.length, "PDFs e cinco páginas HTML com conteúdo acessível sem JavaScript.");
