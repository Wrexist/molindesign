'use strict';
// Menu content is static HTML. JavaScript only enhances category navigation.
const container = document.getElementById('menu-categories');
const nav = document.getElementById('category-nav');
const sections = [...container.querySelectorAll('details')];
function setActive(id) {
  nav.querySelectorAll('a').forEach(link => { const selected = link.hash === `#${id}`; link.classList.toggle('active',selected); if(selected) link.setAttribute('aria-current','true'); else link.removeAttribute('aria-current'); });
}
function openCategory(id,shouldScroll) {
  const selected = sections.find(section => section.id === id);
  if (!selected) return;
  sections.forEach(section => { section.open = section === selected; });
  setActive(id);
  if(shouldScroll) requestAnimationFrame(() => selected.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}));
}
nav.addEventListener('click',event => { const link = event.target.closest('a'); if(!link) return; event.preventDefault(); const id = link.hash.slice(1); try { history.replaceState(null,'',`#${id}`); } catch {} openCategory(id,true); });
sections.forEach(section => section.addEventListener('toggle',() => { if(section.open) setActive(section.id); }));
window.addEventListener('hashchange',() => openCategory(location.hash.slice(1),true));
const initialCategory = location.hash.slice(1);
openCategory(sections.some(section => section.id === initialCategory) ? initialCategory : 'kyckling', false);
let printState;
window.addEventListener('beforeprint',() => { printState = sections.map(section => section.open); sections.forEach(section => { section.open = true; }); });
window.addEventListener('afterprint',() => { sections.forEach((section,index) => { section.open = printState[index]; }); });
