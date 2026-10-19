import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const page={};vm.createContext(page);
for(const file of ['essay-ideas-data.js','essay-ideas-model.js'])vm.runInContext(await readFile('portable/public/shared/'+file,'utf8'),page,{filename:file});
const model=page.KaloreEssayIdeas,topics=model.all();
assert.equal(topics.length,17);
assert.equal(new Set(topics.map((topic)=>topic.id)).size,17);
assert.equal(topics.reduce((sum,topic)=>sum+topic.routes.length,0),34);
for(const topic of topics){
 assert.ok(topic.title&&topic.axis&&topic.proposals.length===3,topic.id);
 assert.equal(topic.routes.length,2,topic.id);
 assert.equal(topic.routes[0].arguments.length,2,topic.id);
 assert.ok(topic.concepts.length>=2&&topic.questions.length>=3&&topic.sources.length,topic.id);
 assert.equal(topic.repertoire?.length,3,topic.id+': three cultural references expected');
 assert.deepEqual([...topic.repertoire.map(item=>item.kind)].sort(),['Cinema','Livro','Música brasileira'].sort(),topic.id);
 for(const item of topic.repertoire){assert.equal(new URL(item.source).protocol,'https:',topic.id+': reference source');assert.ok(item.work.length>3&&item.creator.length>5&&item.connection.length>35&&item.application.length>50,topic.id+': '+item.work);}
 assert.ok(/^https:\/\/www\.gov\.br\/inep\//.test(topic.sources[0].url),topic.id);
 for(const route of topic.routes){
  assert.ok(route.thesis.length>110&&route.care.length>35,route.id);
  for(const argument of route.arguments)assert.ok(argument.claim.length>45&&argument.reason.length>75&&argument.example.length>65&&argument.question.length>35,route.id);
  assert.ok(route.intervention.agente.length>10,route.id+': agente');
  for(const field of ['acao','meio','finalidade'])assert.ok(route.intervention[field].length>25,route.id+': '+field);
 }
}
const allIds=topics.map((topic)=>topic.id);
const source=await readFile('lib/radar-data.ts','utf8'),radar=source.match(/export const topics: Topic\[\] = (\[[\s\S]*?\n\]);/);
assert.ok(radar,'Radar topics are available');
const radarTopics=new Function('return '+radar[1])();
assert.deepEqual([...radarTopics.map((topic)=>topic.id)].sort(),[...allIds].sort());
for(const topic of radarTopics)assert.equal(model.get(topic.id).proposals[0],topic.proposal,topic.id+' prompt should match Radar');
assert.equal(model.search('BIBLIOTECAS','Educação e cultura')[0].id,'leitura');
assert.ok(model.search('acesso digital').some((topic)=>topic.id==='acesso'));
assert.equal(model.findTheme(radarTopics.find((topic)=>topic.id==='ia').proposal).id,'ia');
const id='digital',route=topics.find((topic)=>topic.id===id).routes[1],seed=model.blueprint(id,route.id);
assert.deepEqual(Object.keys(seed).sort(),[...model.fields].sort());
const older=Object.fromEntries(model.fields.map((field)=>[field,field==='tese'?'Tese que escrevi eu':'']));
const merged=model.fillEmpty(older,seed);
assert.equal(merged.value.tese,older.tese);assert.equal(merged.added,6);
const oversized={...seed,tese:'x'.repeat(2001)};assert.equal(model.fillEmpty({},oversized).value.tese,'');
assert.match(model.markdown(id,1),/Exemplo hipotético/);assert.match(model.markdown(id,1),/Intervenção possível/);
assert.match(model.markdown(id,1),/Repertório sociocultural/);
assert.ok(model.search('Quanta').some(topic=>topic.id==='ciencia'),'Works should be searchable');
assert.ok(model.search('Caetano Veloso').some(topic=>topic.id==='leitura'),'Creators should be searchable');
assert.equal(new Set(topics.flatMap(topic=>topic.repertoire.map(item=>topic.id+':'+item.work))).size,51);
assert.doesNotMatch(JSON.stringify(topics),/\b\d{1,3}(?:[.,]\d+)?% de chance/i);

// Separate intensive-training themes must never be confused with the 17 Radar axes.
const special={};vm.createContext(special);
for(const file of ['guia-mapas-01.js','guia-mapas-02.js','guia-mapas-03.js'])
 vm.runInContext(await readFile('portable/public/'+file,'utf8'),special,{filename:file});
const maps=special.AtenaWarMaps;
assert.equal(maps.length,18,'18 requested essay training prompts');
assert.equal(new Set(maps.map(map=>map.id)).size,18,'training prompts must be unique');
assert.equal(maps.reduce((sum,map)=>sum+map.cause.refs.length+map.impact.refs.length,0),72,'two relevant references per argument');
for(const map of maps){
 assert.ok(map.title.length>35&&map.thesis.length>100,map.id+': title and thesis');
 assert.ok(map.cause.claim.length>65&&map.cause.why.length>75,map.id+': structural cause');
 assert.ok(map.impact.claim.length>65&&map.impact.why.length>75,map.id+': consequence');
 for(const argument of [map.cause,map.impact]){
  assert.equal(argument.refs.length,2,map.id+': two reference options');
  for(const ref of argument.refs){assert.equal(new URL(ref[2]).protocol,'https:',map.id+': reference source');assert.ok(ref[0].length>8&&ref[1].length>75,map.id+': developed reference');}
 }
 assert.ok(map.words.length>=5&&map.words.length<=8,map.id+': topical vocabulary');
 for(const key of ['who','what','how','why','detail'])assert.ok(map.pi[key].length>35,map.id+': intervention '+key);
}
const guide=await readFile('portable/public/guia-estrategico.html','utf8');
assert.ok(guide.includes('guia-mapas-01.js')&&guide.includes('guia-mapas-03.js'),'all data bundles included');
const guideUi=await readFile('portable/public/shared/argument-library-ui.js','utf8');
assert.ok(guideUi.includes('data-copy')&&guideUi.includes('data-export'),'copy and export actions available');
const explorer=await readFile('portable/public/shared/essay-ideas-ui.js','utf8');
assert.ok(explorer.includes('guia-estrategico.html'),'guide discoverable from Radar and essay editor');
console.log('18 advanced practice maps: 72 developed references, topical vocabulary, five intervention elements, search, copy, export and discoverability passed.');

console.log('Essay ideas: 17 topics aligned with Radar, 34 routes, 68 explained arguments, 34 interventions, 51 contextual cultural references, primary source link per theme, searchable topics, export and preservation of student text passed.');
