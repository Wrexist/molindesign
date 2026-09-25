import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classDates} from '../lib/recurrence.ts';
test('Monday and Wednesday, inclusive dates and Swedish time across DST',()=>{
 assert.deepEqual(classDates('2026-10-19T18:30',{weekdays:[1,3],until:'2026-10-28'}),['2026-10-19T18:30','2026-10-21T18:30','2026-10-26T18:30','2026-10-28T18:30']);
});
test('starts with the first selected day, deduplicates and handles year boundary',()=>{
 assert.deepEqual(classDates('2026-12-29T09:00',{weekdays:[3,1,3],until:'2027-01-04'}),['2026-12-30T09:00','2027-01-04T09:00']);
});
test('single and legacy weekly requests still work',()=>{
 assert.deepEqual(classDates('2026-09-28T18:00'),['2026-09-28T18:00']);
 assert.deepEqual(classDates('2026-09-28T18:00',undefined,2),['2026-09-28T18:00','2026-10-05T18:00']);
});
test('rejects invalid, empty and excessive recurrence ranges',()=>{
 for(const recurrence of [{weekdays:[],until:'2026-10-01'},{weekdays:[1],until:'2026-09-27'},{weekdays:[1],until:'2026-02-30'},{weekdays:[3],until:'2026-09-28'},{weekdays:[1],until:'2027-09-28'},{weekdays:[0,1,2,3,4,5,6],until:'2027-01-28'}])assert.throws(()=>classDates('2026-09-28T18:00',recurrence));
 assert.throws(()=>classDates('2026-02-30T18:00'));
});
