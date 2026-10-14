/* C130 · Planning QC : ajout de sessions à une série existante */
(function(){
'use strict';
// Correctif racine : la fenêtre « Nouvelle session » passe null à sessionPlanNumber.
// L'ancienne fonction lisait s.chapitre_id sans vérifier s, ce qui interrompait l'ouverture.
const originalSessionPlanNumber130=sessionPlanNumber;
sessionPlanNumber=function(s){return s?originalSessionPlanNumber130(s):null};
const esc130=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function sessions130(s){if(s.serie_id)return planningSessions.filter(x=>x.serie_id===s.serie_id).sort((a,b)=>a.date.localeCompare(b.date)||(a.ordre||0)-(b.ordre||0));return [s]}
function last130(s){return sessions130(s).at(-1)}
function after130(date,days){const d=new Date(date+'T12:00:00');do{d.setDate(d.getDate()+1)}while(!days.includes(d.getDay()));return isoLocal(d)}
window.openExtendPlanningSeries130=id=>{
 const s=planningSessions.find(x=>x.id===id);if(!s)return alert('Session introuvable. Recharge le planning.');
 const members=sessions130(s),last=last130(s),max=Math.max(...members.map(x=>Number(x.serie_numero)||0));
 const n=max?max+1:(Number(String(last.titre||'').match(/(\d+)(?!.*\d)/)?.[0])||members.length)+1;
 const host=document.getElementById('planning-modal-host')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'planning-modal-host'}));
 host.innerHTML='<div class="modal-overlay open" onclick="if(event.target===this)closePlanningModal()"><div class="modal-box"><div class="modal-head"><h2>➕ Prolonger la série</h2><button onclick="closePlanningModal()">✕</button></div><div class="modal-body"><p>Œuvre : <strong>'+esc130(workById(s.oeuvre_id)?.titre||'')+'</strong></p><p>Dernière session : '+esc130(last.titre||'')+' ('+esc130(last.date)+')</p><div class="planning-modal-grid"><div><label>Sessions à ajouter</label><input type="number" id="extend-count130" min="1" max="100" value="4"></div><div><label>Premier numéro</label><input type="number" id="extend-first130" min="1" value="'+n+'"></div><div class="full"><small>Les sessions existantes et leurs dates ne seront pas modifiées. Les nouvelles suivront les jours autorisés de la série.</small></div></div></div><div class="modal-foot"><button class="btn-secondary" onclick="closePlanningModal()">Annuler</button><button class="btn-primary" onclick="saveExtendPlanningSeries130(\''+s.id+'\')">Ajouter les sessions</button></div></div></div>';
};
window.saveExtendPlanningSeries130=async id=>{
 const s=planningSessions.find(x=>x.id===id);if(!s)return;
 const members=sessions130(s),last=members.at(-1),count=Number(document.getElementById('extend-count130')?.value),first=Number(document.getElementById('extend-first130')?.value);
 if(!Number.isInteger(count)||count<1||count>100||!Number.isInteger(first)||first<1)return alert('Indique un nombre de sessions entre 1 et 100 et un numéro de départ valide.');
 const days=Array.isArray(last.serie_jours)&&last.serie_jours.length?last.serie_jours.map(Number):[...new Set(members.map(x=>new Date(x.date+'T12:00:00').getDay()))];
 if(!days.length)return alert('Aucun jour de série identifié.');
 const pattern=String(last.titre||'').match(/^(.*?)(\d+)([^\d]*)$/);
 const template=last.serie_template|| (pattern?pattern[1]+'{n}'+pattern[3]:'Session ({n})');
 const seriesId=last.serie_id||crypto.randomUUID(),rows=[];let date=last.date;
 const existing=new Set(members.map(x=>Number(x.serie_numero)).filter(Boolean));
 for(let i=0;i<count;i++){
   const n=first+i;if(existing.has(n))return alert('La session n° '+n+' existe déjà. Rien n’a été ajouté.');
   date=after130(date,days);
   const chapter=planningChapters.find(c=>c.oeuvre_id===s.oeuvre_id&&Number(c.numero)===n&&isWrittenChapterC96(c));
   rows.push({user_id:currentUser.id,oeuvre_id:s.oeuvre_id,chapitre_id:chapter?.id||null,type_session:s.type_session,titre:template.replaceAll('{n}',String(n)),date,couleur:last.couleur,statut:'planifiée',note:null,ordre:(Number(last.ordre)||0)+i+1,serie_id:seriesId,serie_template:template,serie_numero:n,serie_jours:days});
 }
 if(!confirm('Ajouter '+count+' session(s), du n° '+first+' au n° '+(first+count-1)+' ?\nLes sessions existantes ne seront pas modifiées.'))return;
 const result=await db().from('planning_sessions').insert(rows);
 if(result.error)return alert('Erreur : '+result.error.message);
 closePlanningModal();await renderPlanning();
};
function mount130(){
 const root=document.getElementById('content');if(!root||!root.querySelector('.planning-head'))return;
 root.querySelectorAll('button[onclick^="openManageSeriesV576"]').forEach(btn=>{
   if(btn.dataset.extend130)return;btn.dataset.extend130='1';
   const id=btn.getAttribute('onclick').match(/'([^']+)'/)?.[1];if(!id)return;
   const add=document.createElement('button');add.className='btn-secondary';add.textContent='➕ Ajouter des sessions';add.onclick=()=>openExtendPlanningSeries130(id);btn.after(add);
 });
 // Bouton d'accès depuis chaque session du calendrier ou de la liste.
 root.querySelectorAll('.planning-event[data-id]').forEach(el=>{
   if(el.dataset.extend130)return;el.dataset.extend130='1';
   const id=el.dataset.id;
   const btn=document.createElement('button');btn.type='button';btn.title='Prolonger la série';btn.textContent='+';btn.style.cssText='position:absolute;right:2px;top:2px;border-radius:50%;font-weight:bold;cursor:pointer;z-index:2';
   btn.onclick=e=>{e.stopPropagation();e.preventDefault();openExtendPlanningSeries130(id)};
   el.style.position='relative';el.append(btn);
 });
 root.querySelectorAll('.planning-list button[onclick^="duplicatePlanningSession"]').forEach(btn=>{
   if(btn.dataset.extend130)return;btn.dataset.extend130='1';const id=btn.getAttribute('onclick').match(/'([^']+)'/)?.[1];if(!id)return;
   const add=document.createElement('button');add.className='tiny-btn';add.textContent='+ Sessions';add.onclick=()=>openExtendPlanningSeries130(id);btn.after(add);
 });
}
let busy=false;const obs=new MutationObserver(()=>{if(busy)return;busy=true;queueMicrotask(()=>{try{mount130()}finally{busy=false}})});
obs.observe(document.documentElement,{subtree:true,childList:true});mount130();
})();
