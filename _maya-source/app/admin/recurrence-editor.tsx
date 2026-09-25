'use client';
import {DateField} from './date-field';
import {Switch} from '@/components/ui/switch';
import {Checkbox} from '@/components/ui/checkbox';
import {Repeat2,CalendarDays} from 'lucide-react';
import {classDates,weekdays,type Recurrence} from '@/lib/recurrence';
import {dateLabel} from '@/lib/content';
export function RecurrenceEditor({start,value,onChange}:{start:string;value?:Recurrence;onChange:(value?:Recurrence)=>void}){
  let dates:string[]=[];let error='';
  if(value){try{dates=classDates(start,value);}catch(e){error=(e as Error).message;}}
  function toggle(enabled:boolean){
    if(!enabled){onChange(undefined);return;}
    const first=new Date(start+'Z');const valid=Number.isFinite(first.getTime());
    const end=valid?new Date(first):null;end?.setUTCDate(end.getUTCDate()+27);
    onChange({weekdays:valid?[first.getUTCDay()]:[],until:end?.toISOString().slice(0,10)||''});
  }
  return <section className="recurrence-panel" aria-label="Upprepning"><div className="recurrence-heading"><Repeat2 size={20} aria-hidden="true"/><label htmlFor="recurring-pass"><strong>Återkommande pass</strong><span>Samma pass och klockslag, flera dagar i veckan.</span></label><Switch id="recurring-pass" checked={!!value} onCheckedChange={toggle}/></div>{value&&<div className="recurrence-options"><fieldset><legend>Upprepa varje vecka på</legend><div className="weekday-options">{weekdays.map(([day,label])=><label key={day} className={value.weekdays.includes(day)?'selected':''}><Checkbox aria-label={label} checked={value.weekdays.includes(day)} onCheckedChange={checked=>onChange({...value,weekdays:checked?[...new Set([...value.weekdays,day])]:value.weekdays.filter(d=>d!==day)})}/><span>{label}</span></label>)}</div></fieldset><DateField label="Till och med" value={value.until} min={start.slice(0,10)||undefined} onChange={until=>onChange({...value,until})}/><p className="recurrence-hint">Slutdatum ingår. Högst 183 dagar och 100 pass åt gången.</p><div className="recurrence-preview" aria-live="polite"><CalendarDays size={18} aria-hidden="true"/><div>{error?<p>{error}</p>:<><strong>{dates.length} pass skapas kl. {start.slice(11)}</strong><p>{dateLabel(dates[0])} – {dateLabel(dates[dates.length-1])}</p><p>{dates.slice(0,4).map(d=>dateLabel(d)).join(' · ')}{dates.length>4?' …':''}</p></>}</div></div><p className="recurrence-hint">Samma uppgifter och status används för alla tillfällen. Efteråt kan du redigera eller ställa in varje pass separat.</p></div>}</section>;
}
