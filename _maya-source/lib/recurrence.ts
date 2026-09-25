export type Recurrence = {weekdays:number[];until:string};
export const weekdays = [[1,'Måndag'],[2,'Tisdag'],[3,'Onsdag'],[4,'Torsdag'],[5,'Fredag'],[6,'Lördag'],[0,'Söndag']] as const;

// Stored values are Swedish wall-clock times. UTC is used only for calendar arithmetic.
export function classDates(start:string, recurrence?:Recurrence, repeat=1):string[] {
  const first=new Date(start+'Z');
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(start)||!Number.isFinite(first.getTime())||first.toISOString().slice(0,16)!==start||start<'2026-01-01'||start>='2100-01-01')throw Error('Välj ett giltigt startdatum och klockslag.');
  if(!recurrence){
    if(!Number.isInteger(repeat)||repeat<1||repeat>12)throw Error('Välj 1–12 tillfällen.');
    return Array.from({length:repeat},(_,i)=>{const d=new Date(first);d.setUTCDate(d.getUTCDate()+7*i);return d.toISOString().slice(0,16);});
  }
  const {until,weekdays:days}=recurrence;
  if(!days.length||days.some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('Välj minst en veckodag.');
  const last=new Date(until+'T00:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(until)||!Number.isFinite(last.getTime())||last.toISOString().slice(0,10)!==until||until>='2100-01-01')throw Error('Välj ett giltigt slutdatum.');
  const begin=new Date(start.slice(0,10)+'T00:00:00Z');
  const length=(last.getTime()-begin.getTime())/86400000;
  if(length<0)throw Error('Slutdatum måste vara samma dag som eller efter startdatum.');
  if(length>183)throw Error('Välj en period på högst 183 dagar.');
  const dates:string[]=[];
  for(let day=0;day<=length;day++){
    const date=new Date(begin);date.setUTCDate(date.getUTCDate()+day);
    if(days.includes(date.getUTCDay()))dates.push(date.toISOString().slice(0,10)+start.slice(10));
  }
  if(!dates.length)throw Error('Ingen vald veckodag finns i perioden. Ändra dagarna eller slutdatum.');
  if(dates.length>100)throw Error('Perioden ger fler än 100 pass. Välj en kortare period.');
  return dates;
}
