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
assert.doesNotMatch(JSON.stringify(topics),/\b\d{1,3}(?:[.,]\d+)?% de chance/i);
console.log('Essay ideas: 17 topics aligned with Radar, 34 routes, 68 explained arguments, 34 interventions, primary source link per theme, searchable topics, export and preservation of student text passed.');
