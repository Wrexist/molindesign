import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const contentUrl=moduleUrl(readFileSync(new URL('../lib/content.ts',import.meta.url),'utf8'));
const {defaultContent}=await import(contentUrl);
const {contentFields,searchContent}=await import(moduleUrl(readFileSync(new URL('../lib/content-search.ts',import.meta.url),'utf8').replace("'./content'",JSON.stringify(contentUrl))));
const fields=contentFields(defaultContent);
test('finds exact text first, insensitive to accents and case',()=>{
 assert.equal(searchContent(fields,'STARKARE')[0].id,'text-heroLine1');
 assert.ok(searchContent(fields,'traning pa dina villkor').some(x=>x.id==='text-principle1'));
});
test('recognises small typos, transpositions and mail synonym',()=>{
 assert.equal(searchContent(fields,'strakare')[0].id,'text-heroLine1');
 assert.ok(searchContent(fields,'kostnadsfir').some(x=>x.id==='text-contactText'));
 assert.ok(searchContent(fields,'mejl').some(x=>x.id==='text-email'));
});
test('searches package drafts, services and steps with unique edit targets',()=>{
 assert.equal(new Set(fields.map(f=>f.id)).size,fields.length);
 assert.ok(searchContent(fields,'online').some(x=>x.tab==='packages'&&x.hidden));
 assert.ok(searchContent(fields,'vi lar kanna dig').some(x=>x.id==='step-0-title'));
 assert.ok(searchContent(fields,'ta med en van').some(x=>x.id==='service-duo-text'));
});
test('requires all query words and handles empty and unmatched input',()=>{
 assert.deepEqual(searchContent(fields,''),[]);
 assert.deepEqual(searchContent(fields,'zxqvty okandtext'),[]);
 assert.ok(searchContent(fields,'duo 2250').some(x=>x.id==='package-duo-5-price'));
 assert.ok(searchContent(fields,'duo 2 250').some(x=>x.id==='package-duo-5-price'));
});
