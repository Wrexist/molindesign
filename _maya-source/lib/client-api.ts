// GitHub Pages serves the site under /molindesign/maya-haglund/ and calls the API on Netlify;
// on Netlify itself (mayahaglund.com, the netlify.app address) the site and API share one origin.
export const base=location.pathname.startsWith('/molindesign/maya-haglund')?'/molindesign/maya-haglund/':'/';
export const server=location.hostname.endsWith('.github.io')?'https://maya-haglund-admin.netlify.app':'';
 
export function setToken(value:string){if(value)localStorage.setItem('maya-session',value);else localStorage.removeItem('maya-session');}
export function apiFetch(path:string,options:RequestInit={}){const token=localStorage.getItem('maya-session')||'';const headers=new Headers(options.headers);if(token)headers.set('Authorization','Bearer '+token);return fetch(server+path,{...options,headers,credentials:'omit'});}
export function assetUrl(path:string){return path.startsWith('/api/media/')?server+path:path.startsWith('/assets/')?base+path.slice(1):path;}
