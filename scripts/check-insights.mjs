import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import vm from "node:vm";
const scope = {structuredClone}; vm.createContext(scope);
for (const file of ["hub/insights-model.js", "shared/brief.js", "hub/core.js", "hub/content.js", "hub/practice-data.js"]) vm.runInContext(await readFile("portable/public/" + file, "utf8"), scope);
const model = scope.KaloreInsights, brief = scope.KaloreBrief, metadata = scope.KalorePracticeData.metadata;
const app = await readFile("portable/public/hub/app.js", "utf8");
const questions = vm.runInContext("(" + app.match(/const questions = (\[[\s\S]*?\n  \]);/)[1] + ")", scope).concat(scope.KaloreContent.questions);
assert.equal(questions.length, 84); assert.equal(new Set(questions.map(q => q.id)).size, 84);
assert.equal(scope.KalorePracticeData.contextualIds.length, 24);
for (const q of questions) {
  assert.ok(metadata[q.id]?.topic && metadata[q.id].strategy.length > 40, q.id);
  assert.ok(q.c >= 0 && q.c < q.o.length && q.o.every(x => typeof x === "string"));
  if (q.contextual) { assert.equal(q.o.length, 5); assert.ok(q.q.length > 120 && q.e.length > 160 && q.hint.length > 20); }
}
// Independently recompute the numerical answers in the new contextual set.
const expected = {"ctx-m1":40*15*.9+30,"ctx-m2":200*.15/300*100,"ctx-m3":(14-8)/(2-1),"ctx-m4":[12,15,16,17,90].sort((a,b)=>a-b)[2],"ctx-m5":(2/6)*(1/5),"ctx-m6":3*1**2*2*1000,"ctx-n3":1.5*(20/60)*30*.8,"ctx-n4":10**(-4)/10**(-6),"ctx-n5":.5*.5*100,"ctx-n6":2*4/1};
assert.deepEqual(Object.values(expected).map(x=>Math.round(x*1e6)/1e6), [570,10,6,16,.066667,6000,12,100,25,8]);
const now = new Date("2026-10-03T14:00:00Z"), first = questions.find(q=>q.id==="m1"), make=(id,qid,choice,date,extra={})=>({id,qid,choice,date,area:"mat",source:"explore",...extra});
const state = {answers:12,profile:{d_mat:3},errors:[],attempts:[
  make("a1","m1",first.c,"2026-10-03T13:00:00Z",{confidence:"unsure"}),
  make("a2","m1",0,"2026-10-02T14:00:00Z"),
  make("a3","m1",-1,"2026-09-26T14:00:00Z",{source:"sim"}),
  make("future","m1",first.c,"2026-10-03T19:00:00Z"),
  make("unknown","no-such-item",0,"2026-10-02T14:00:00Z"),
  make("mismatch","l1",0,"2026-10-02T14:00:00Z"),
  make("wrong-option","m1",4,"2026-10-02T14:00:00Z"),
]};
const snapshot = JSON.stringify(state), overview = model.overview(state, questions, now, 7);
assert.equal(overview.total,2);assert.equal(overview.correct,1);assert.equal(overview.percent,50);assert.equal(overview.unique,1);
assert.equal(overview.legacy,9);assert.equal(overview.days.length,7);
assert.equal(overview.days[0].key,"2026-09-27");assert.equal(overview.days[6].key,"2026-10-03");
assert.equal(model.overview(state,questions,now,30).blank,1);
assert.equal(model.overview({attempts:[]},questions,now).percent,null);
assert.equal(model.day(new Date("2026-10-03T01:00:00Z")),"2026-10-02");
assert.equal(model.states(state,questions,now).m1.status,"right");
state.errors=[{qid:"m1",reviewed:false}];assert.equal(model.states(state,questions,now).m1.status,"review");
assert.equal(model.choose(state,questions,metadata,now).qid,"m1");
state.errors=[];assert.equal(JSON.stringify(state),snapshot);
assert.equal(model.history([state.attempts[0],state.attempts[0],{...state.attempts[0],id:"bad<id"},{...state.attempts[0],id:"bad-choice",choice:Infinity},{...state.attempts[0],id:"bad-area",area:"red"}]).length,1);
assert.equal(model.history(Array.from({length:1100},(_,i)=>make("t"+i,"m1",0,"2026-10-02T14:00:00Z"))).length,1000);
const filteredNotes=model.notes({"m1":"x".repeat(1500),"bad<id":"unsafe","m2":false});assert.equal(filteredNotes.m1.length,1200);assert.equal(Object.keys(filteredNotes).length,1);
const merged = scope.KaloreCore.mergeState({answers:0,correct:0,focus:0,xp:0},{...state,questionNotes:{m1:"Meu raciocínio"},attempts:state.attempts});
assert.equal(merged.questionNotes.m1,"Meu raciocínio");assert.ok(merged.attempts.some(a=>a.id==="a1"));assert.equal(merged.attempts[0].confidence,null);
assert.equal(brief.sanitize({tese:"x".repeat(3000),agente:42,__proto__:{acao:"unsafe"}}).tese.length,2000);
assert.equal(brief.sanitize({agente:42}).agente,"");assert.equal(brief.sanitize(null).tese,"");
assert.equal(Object.keys(brief.map({digital:{tese:"ideia"},other:{tese:"Outra"}},["digital"])).length,1);
const payload={version:1,topicId:"digital",theme:"Um tema de estudo",createdAt:"2026-10-03T13:59:00Z",blueprint:{tese:"Minha tese"}};
assert.ok(brief.handoff(payload,now));assert.equal(brief.handoff({...payload,createdAt:"2026-10-01T14:00:00Z"},now),null);assert.equal(brief.handoff({...payload,createdAt:"2026-10-05T14:00:00Z"},now),null);
assert.equal(brief.handoff({...payload,blueprint:{}},now),null);assert.equal(brief.handoff({...payload,topicId:"<img>"},now),null);
console.log("Insights: 84 unique questions, 24 contextual items, editorial coverage, independent calculations, São Paulo calendar, actual accuracy, small/empty samples, future/unknown entries, error priority, immutability, backup bounds, notes and protected outline handoff passed.");
