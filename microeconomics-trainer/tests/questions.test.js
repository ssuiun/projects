import test from "node:test";
import assert from "node:assert/strict";
import {QUESTIONS,CHOICES,TOPICS} from "../questions.js";
test("source exam contains 30 multiple-choice and 10 true/false questions",()=>{
  assert.equal(QUESTIONS.length,40);
  assert.equal(QUESTIONS.filter(q=>q.type==="mc").length,30);
  assert.equal(QUESTIONS.filter(q=>q.type==="tf").length,10);
});
test("question IDs are unique, sequential, and answer keys are valid",()=>{
 assert.equal(new Set(QUESTIONS.map(q=>q.id)).size,40);
 QUESTIONS.forEach((q,i)=>{
   assert.equal(q.id,(i<30?"mc":"tf")+String(i<30?i+1:i+1).padStart(2,"0"));
   assert.ok(q.question?.trim()&&q.explanation?.trim());
   assert.ok(TOPICS.includes(q.topic));
   if(q.type==="mc"){assert.equal(q.options.length,4);assert.ok(CHOICES.includes(q.answer))}
   else assert.ok(["T","F"].includes(q.answer));
 })
});
test("question bank preserves two flagged source ambiguities",()=>{
 assert.equal(QUESTIONS.find(q=>q.id==="mc27").flag,"ambiguous");
 assert.equal(QUESTIONS.find(q=>q.id==="tf34").flag,"nuance");
});
test("answer key matches independently worked examples",()=>{
 assert.equal(QUESTIONS.find(q=>q.id==="mc03").answer,"A");
 assert.equal(QUESTIONS.find(q=>q.id==="mc04").answer,"B");
 assert.equal(QUESTIONS.find(q=>q.id==="mc07").answer,"B");
 assert.equal(QUESTIONS.find(q=>q.id==="mc09").answer,"A");
 assert.equal(QUESTIONS.find(q=>q.id==="tf40").answer,"F");
});