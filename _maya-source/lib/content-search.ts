import {fieldGroups, type SiteContent} from './content';
export type ContentField={id:string;tab:'content'|'packages'|'images';section:string;label:string;value:string;hidden?:boolean};
export function contentFields(c:SiteContent):ContentField[]{
 const fields:ContentField[]=Object.entries(fieldGroups).flatMap(([section,group])=>Object.entries(group).map(([key,label])=>({id:'text-'+key,tab:'content' as const,section,label,value:c.text[key]||''})));
 for(const s of c.services)for(const [key,label] of Object.entries({title:'Rubrik',text:'Beskrivning',tag:'Etikett',cta:'Länktext',alt:'Bildbeskrivning'}))fields.push({id:'service-'+s.id+'-'+key,tab:key==='alt'?'images':'content',section:'Träningsformer · '+s.title,label,value:s[key as keyof typeof s]});
 c.steps.forEach((s,i)=>{for(const key of ['title','text'] as const)fields.push({id:'step-'+i+'-'+key,tab:'content',section:'Så går det till · Steg '+(i+1),label:key==='title'?'Rubrik':'Beskrivning',value:s[key]});});
 for(const p of c.packages)for(const [key,label] of Object.entries({title:'Paketets namn',category:'Träningsform',price:'Pris',unit:'Priset gäller',description:'Vad ingår?'}))fields.push({id:'package-'+p.id+'-'+key,tab:'packages',section:'Paket & priser · '+p.category+' · '+p.title,label,value:String(p[key as keyof typeof p]),hidden:!p.published});
 fields.push({id:'image-hero-alt',tab:'images',section:'Startsida · Stor bild',label:'Bildbeskrivning',value:c.images.heroAlt});
 return fields;
}
export function normalizeSearch(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/(\d)[ \u00a0](?=\d{3}\b)/g,'$1').replace(/[^a-z0-9@]+/g,' ').trim();}
function distance(a:string,b:string){const d=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i===0?j:j===0?i:0));for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+Number(a[i-1]!==b[j-1]));if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);}return d[a.length][b.length];}
const synonyms:Record<string,string[]>={mail:['epost','e post','email'],mejl:['epost','e post','email'],telefon:['telefonnummer','ring'],kostnad:['pris'],kostar:['pris'],start:['startsida'],hero:['startsida'],knapp:['lanktext','huvudknapp','knapp'],online:['online'],om:['presentation','om']};
export function searchContent(fields:ContentField[],query:string){
 const q=normalizeSearch(query).slice(0,160);if(!q)return [];
 const tokens=q.split(' ').filter(Boolean).slice(0,12);
 return fields.flatMap(field=>{
  const value=normalizeSearch(field.value),label=normalizeSearch(field.label),section=normalizeSearch(field.section),all=[value,label,section].join(' '),words=all.split(' ');let score=0,similar=false;
  for(const token of tokens){if(all.includes(token)){score+=value.includes(token)?30:label.includes(token)?20:10;continue;}
   if(synonyms[token]?.some(s=>all.includes(s))){score+=7;similar=true;continue;}
   if(token.length>=4){const best=Math.min(...words.filter(w=>Math.abs(w.length-token.length)<=2).map(w=>distance(w,token)));if(best<=(token.length>=7?2:1)){score+=12-best*4;if(distance(value,token)===best)score+=35;similar=true;continue;}}
   return [];
  }
  if(value===q)score+=150;else if(value.includes(q))score+=80;
  if(label===q)score+=40;
  return [{...field,score,similar}];
 }).sort((a,b)=>b.score-a.score||a.section.localeCompare(b.section,'sv'));
}
