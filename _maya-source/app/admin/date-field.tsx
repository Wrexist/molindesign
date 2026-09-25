'use client';
import {useState} from 'react';
import {CalendarDays} from 'lucide-react';
import {sv} from 'date-fns/locale';
import {Calendar} from '@/components/ui/calendar';
import {Popover,PopoverContent,PopoverTrigger} from '@/components/ui/popover';
import {stockholmNow} from '@/lib/content';
function parse(value:string){return value?new Date(value+'T12:00:00'):undefined;}
function format(date:Date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function DateField({label,value,onChange,min}:{label:string;value:string;onChange:(value:string)=>void;min?:string}){
 const [open,setOpen]=useState(false);const selected=parse(value);const today=parse(stockholmNow().slice(0,10))!;
 function choose(date:Date|undefined){if(date){onChange(format(date));setOpen(false);}}
 return <div className="field date-field"><span>{label}</span><Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><button type="button" className="date-trigger" aria-label={label+(selected?': '+selected.toLocaleDateString('sv-SE',{day:'numeric',month:'long',year:'numeric'}):': Välj datum')}><CalendarDays size={18} aria-hidden="true"/><span>{selected?selected.toLocaleDateString('sv-SE',{day:'numeric',month:'long',year:'numeric'}):'Välj datum'}</span></button></PopoverTrigger><PopoverContent className="maya-calendar" align="start" collisionPadding={12}><Calendar mode="single" required locale={sv} weekStartsOn={1} labels={{labelNext:()=>"Nästa månad",labelPrevious:()=>"Föregående månad",labelNav:()=>"Välj månad"}} selected={selected} defaultMonth={selected||today} onSelect={choose} disabled={min?{before:parse(min)!}:undefined}/><div className="date-shortcuts"><button type="button" disabled={!!min&&format(today)<min} onClick={()=>choose(today)}>Idag</button><button type="button" disabled={!!min&&format(new Date(today.getFullYear(),today.getMonth(),today.getDate()+1))<min} onClick={()=>choose(new Date(today.getFullYear(),today.getMonth(),today.getDate()+1))}>Imorgon</button></div></PopoverContent></Popover></div>;
}
export function StartDateField({value,onChange,recurring}:{value:string;onChange:(value:string)=>void;recurring:boolean}){
 const date=value.slice(0,10);const time=value.slice(11)||'18:00';
 const [pendingTime,setPendingTime]=useState(time);
 return <div className="class-date-fields"><DateField label={recurring?'Från datum':'Datum'} value={date} onChange={next=>onChange(next+'T'+(pendingTime||'18:00'))}/><label className="field"><span>Klockslag</span><input type="time" required value={date?time:pendingTime} onChange={e=>{setPendingTime(e.target.value);if(date)onChange(date+'T'+e.target.value);}}/><small>Svensk tid, 24-timmarsformat.</small></label></div>;
}
