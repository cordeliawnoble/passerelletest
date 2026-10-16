/* Passe-Ailes · Phase 1 : fondations de la vie éditoriale.
   Additif non destructif : aucune suppression ni réécriture des dossiers existants.
   Les parcours archivés sont des instantanés immuables (copie JSON). */
(function(){
'use strict';
const TYPES={online:'Publication en ligne',selfpub:'Autoédition',publisher:'Maison d’édition',contest:'Concours'};
const clean=v=>String(v??'');
const clone=v=>JSON.parse(JSON.stringify(v));
const uid=()=>('crypto' in window&&crypto.randomUUID?crypto.randomUUID():'life-'+Date.now()+'-'+Math.random().toString(36).slice(2));
const now=()=>new Date().toISOString();
function dossier(){return dossierState(currentDossier)}
function findWork(){return proWorks.find(w=>clean(w.oeuvre_id)===clean(currentDossier))}
function routeType(label){const s=clean(label).toLowerCase();if(s.includes('abonnement'))return 'online';if(s.includes('auto'))return 'selfpub';if(s.includes('maison')||s.includes('éditeur'))return 'publisher';if(s.includes('concours'))return 'contest';return 'online'}
function ensureLife(d,w){
 if(!d.editorialLife || !Array.isArray(d.editorialLife.routes)){
  // Reprendre le template du dossier existant, pas la destination finale Passerelle.
  const template=d.template||destinationTemplateV10(w);
  const label=TYPES[template]||TYPES.online;
  d.editorialLife={version:1,activeRouteId:uid(),routes:[],archives:[],createdAt:now()};
  d.editorialLife.routes.push({id:d.editorialLife.activeRouteId,label,type:template,status:'active',createdAt:now()});
 }
 const l=d.editorialLife;
 l.archives=Array.isArray(l.archives)?l.archives:[];
 const active=l.routes.find(r=>r.id===l.activeRouteId);
 if(!active && l.routes.length){l.activeRouteId=l.routes[0].id;l.routes[0].status='active'}
 return l;
}
const previousDossierState=dossierState;
dossierState=function(id){
 const d=previousDossierState(id);
 const w=proWorks.find(x=>clean(x.oeuvre_id)===clean(id));
 ensureLife(d,w);
 return d;
};
// La destination finale Passerelle ne doit plus remplacer le parcours actif.
// L'ancien dossierState change automatiquement de template à chaque ouverture.
// On rétablit ici l'état existant avant son appel, puis on garde les templates indépendants.
dossierState=function(id){
 const key=clean(id), existing=state.professionalDossiers?.[key];
 const snapshot=existing?{template:existing.template,trajectory:clone(existing.trajectory||[]),diffusions:clone(existing.diffusions||[]),templateHistory:clone(existing.templateHistory||[])}:null;
 const d=previousDossierState(id);
 if(snapshot && snapshot.template && d.template!==snapshot.template){
  d.template=snapshot.template;d.trajectory=snapshot.trajectory;d.diffusions=snapshot.diffusions;d.templateHistory=snapshot.templateHistory;
 }
 ensureLife(d,proWorks.find(w=>clean(w.oeuvre_id)===key));
 return d;
};
function labelSafe(v){return esc(v)}
function lifeHtml(){
 const d=dossier(),l=ensureLife(d,findWork());
 return `<div class="card pa-life1" style="margin-top:16px"><div class="dossier-section-title"><div><h3>🧭 Vie éditoriale de l’œuvre</h3><p class="note">La destination finale vient de Passerelle. Le parcours actif est choisi ici.</p></div><button class="btn sm" onclick="paLifeAdd()">+ Ajouter un parcours</button></div><div class="pa-life-list">${l.routes.map((r,i)=>`<div class="pa-life-row"><span class="pa-life-icon">${r.id===l.activeRouteId?'🟣':r.status==='archived'?'📦':'◯'}</span><div><b>${labelSafe(r.label)}</b><small>${r.id===l.activeRouteId?'Trajectoire actuelle':r.status==='archived'?'Archivée':'À venir'}</small></div>${r.id===l.activeRouteId?'<span class="pill">Active</span>':r.status==='archived'?'<span class="pill">Archivée</span>':`<button class="btn sm" onclick="paLifeSwitch('${r.id}')">Activer</button>`}${r.status==='planned'?`<button class="btn sm" title="Monter" onclick="paLifeMove('${r.id}',-1)" ${i===0?'disabled':''}>↑</button><button class="btn sm" title="Descendre" onclick="paLifeMove('${r.id}',1)" ${i===l.routes.length-1?'disabled':''}>↓</button>`:''}</div>`).join('')}</div><p class="note">${l.archives.length} trajectoire(s) archivée(s). Les anciennes données restent consultables dans Trajectoire.</p></div>`;
}
function insertLife(){const zone=document.getElementById('dossier-page-zone');if(zone && !zone.querySelector('.pa-life1'))zone.insertAdjacentHTML('beforeend',lifeHtml())}
const previousRender=renderDossierTab;
renderDossierTab=function(tab){const r=previousRender(tab);if(tab==='overview')insertLife();if(tab==='trajectory')insertArchives();return r};
function save(){persist()}
window.paLifeAdd=function(){
 const d=dossier(),l=ensureLife(d,findWork());
 const name=prompt('Nom de la prochaine trajectoire (ex. Abonnement, Autoédition) :');
 if(!name||!name.trim())return;
 const type=routeType(name);
 l.routes.push({id:uid(),label:name.trim(),type,status:'planned',createdAt:now()});
 save();renderDossierTab('overview');
};
window.paLifeMove=function(id,delta){
 const l=dossier().editorialLife, i=l.routes.findIndex(r=>r.id===id),j=i+delta;
 if(i<0||j<0||j>=l.routes.length)return;
 if(l.routes[i].status!=='planned'||l.routes[j].status==='archived')return;
 [l.routes[i],l.routes[j]]=[l.routes[j],l.routes[i]];
 save();renderDossierTab('overview');
};
window.paLifeSwitch=function(id){
 const d=dossier(),l=d.editorialLife,target=l.routes.find(r=>r.id===id),current=l.routes.find(r=>r.id===l.activeRouteId);
 if(!target||!current||target.id===current.id||target.status==='archived')return;
 const sameType=target.type===current.type;
 const message=`Passer de « ${current.label} » à « ${target.label} » ?\n\nLa trajectoire actuelle sera archivée avec ses étapes, ses dates, ses tâches et ses informations de diffusion. Aucune donnée ne sera effacée.\n\n${sameType?'Le modèle de publication restera identique.':'Les étapes et tâches du nouveau parcours seront initialisées à partir de son modèle.'}`;
 if(!confirm(message))return;
 const stamp=now();
 const archive={id:uid(),routeId:current.id,label:current.label,type:current.type,startedAt:current.activatedAt||current.createdAt,archivedAt:stamp,trajectory:clone(d.trajectory||[]),diffusions:clone(d.diffusions||[]),trajectoryNotes:clone(d.trajectoryNotes||[]),notes:clean(d.notes),submissions:clone(d.submissions||[]),campaigns:clone((state.campaigns||[]).filter(c=>clean(c.workId)===clean(currentDossier))),promotions:clone((state.promotions||[]).filter(p=>clean(p.workId)===clean(currentDossier))),events:clone((state.events||[]).filter(e=>clean(e.workId)===clean(currentDossier)))};
 l.archives.push(archive);
 current.status='archived';current.archivedAt=stamp;
 target.status='active';target.activatedAt=stamp;l.activeRouteId=target.id;
 d.template=target.type;
 d.trajectory=(TRV10[target.type]||TRV10.online).map((s,i)=>({id:'LIFE-'+uid()+'-'+i,name:s[0],status:s[1],date:'',channel:'',description:'',objectives:'',links:'',notes:''}));
 d.diffusions=(DFV10[target.type]||DFV10.online).map((s,i)=>({id:'LIFEDF-'+uid()+'-'+i,name:s[0],status:s[1],value:'',date:''}));
 d.trajectoryNotes=[];
 // Notes professionnelles globales et documents restent sur la fiche ; les campagnes ne sont jamais effacées.
 save();renderDossierTab('overview');
};
function insertArchives(){
 const zone=document.getElementById('dossier-page-zone'),l=dossier().editorialLife;
 if(!zone||zone.querySelector('.pa-life-archives'))return;
 zone.insertAdjacentHTML('beforeend',`<div class="card pa-life-archives"><h3>📦 Historique des trajectoires</h3><p class="note">Instantanés archivés, en lecture seule.</p>${l.archives.length?l.archives.map((a,i)=>`<details><summary><b>${labelSafe(a.label)}</b> · ${labelSafe(a.archivedAt.slice(0,10))}</summary><div class="pa-life-archive-detail"><p><b>Étapes</b></p>${a.trajectory.map(x=>`<p>• ${labelSafe(x.name)} · ${labelSafe(x.status)} · ${labelSafe(x.date)}</p>`).join('')}<p><b>Diffusion</b></p>${a.diffusions.map(x=>`<p>• ${labelSafe(x.name)} : ${labelSafe(x.value||x.date||'—')}</p>`).join('')}<p><b>Notes de trajectoire</b></p>${a.trajectoryNotes.map(n=>`<p>${labelSafe(n.date||'')} : ${labelSafe(n.text||'')}</p>`).join('')||'<p>—</p>'}<p><b>Campagnes conservées : </b>${a.campaigns.length}</p><p><b>Promotions conservées : </b>${a.promotions.length}</p><p><b>Publications associées : </b>${a.events.length}</p></div></details>`).join(''):'<p class="note">Aucune trajectoire archivée pour le moment.</p>'}</div>`);
}
// Enrichissement facultatif des métadonnées littéraires : pas de mise à blanc, pas de création d'ID.
const previousRefresh=refreshPasserelleWorksV5;
refreshPasserelleWorksV5=async function(){
 await previousRefresh();
 try{
  const ids=proWorks.map(w=>w.oeuvre_id).filter(Boolean);if(!ids.length)return;
  const result=await db().from('oeuvres').select('*').in('id',ids);
  if(result.error)throw result.error;
  const byId=new Map((result.data||[]).map(o=>[clean(o.id),o]));
  proWorks=proWorks.map(w=>{
   const o=byId.get(clean(w.oeuvre_id));if(!o)return w;
   const patch={};
   const mapping={genres:['genres','genre','genre_principal'],keywords:['mots_cles','keywords'],nb_mots:['nb_mots','word_count','nombre_mots'],resume:['resume','résumé','synopsis'],saga:['saga','nom_saga'],avertissements:['avertissements','content_warnings']};
   for(const [field,keys] of Object.entries(mapping)){
    const value=keys.map(k=>o[k]).find(v=>v!==undefined&&v!==null&&v!==''&&(!Array.isArray(v)||v.length));
    if(value!==undefined)patch[field]=value;
   }
   return {...w,...patch,passerelle_id:o.id};
  });
 }catch(e){console.warn('Phase 1 : métadonnées Passerelle indisponibles ; valeurs existantes préservées.',e)}
};
})();
