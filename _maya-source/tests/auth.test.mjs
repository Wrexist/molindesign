import {test} from 'node:test';
import assert from 'node:assert/strict';
import {issue,valid,cors} from '../netlify/auth.ts';
test('signed sessions reject tampering, wrong keys and expiry',()=>{const token=issue('test-secret',1000);assert.equal(valid(token,'test-secret',2000),true);assert.equal(valid(token+'x','test-secret',2000),false);assert.equal(valid(token,'other',2000),false);assert.equal(valid(token,'test-secret',28801000),false);assert.equal(valid('bad','test-secret'),false);});
test('only the authorised website origins can read responses',()=>{assert.ok(cors(new Request('https://example.test',{headers:{Origin:'https://wrexist.github.io'}})));assert.equal(cors(new Request('https://example.test',{headers:{Origin:'https://unrelated.test'}})),null);});
