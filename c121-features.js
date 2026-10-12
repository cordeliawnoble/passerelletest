/* Passerelle C121 · EDL, Chantier/Documents, Manuscrit et personnages */
(function(){
  const esc=v=>safeText(v==null?'':String(v)),filled=v=>Array.isArray(v)?v.length>0:!!String(v??'').trim();
  const states=['Non renseigné','À qualifier','Sommaire','Complet','Non nécessaire'];
  const criteria=[['resume','Résumé'],['informations','Informations clés'],['mots_cles','Mots-clés'],['personnages','Personnages'],['plan','Plan']];
  const styles=document.createElement('style');styles.textContent=
  '.c121-tabs{display:flex;gap:8px;margin:10px 0 18px;flex-wrap:wrap}.c121-tabs button{border:1px solid var(--line);background:var(--card);border-radius:9px;padding:9px 15px;color:var(--text);cursor:pointer}.c121-tabs button.active{background:var(--accent);color:white}.c121-editor{display:grid;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:15px;padding:18px}.c121-editor input,.c121-editor textarea,.c121-editor select{width:100%;padding:11px;border:1px solid var(--line);border-radius:9px;background:var(--bg);color:var(--text);font:inherit}.c121-editor textarea{min-height:280px;resize:vertical;line-height:1.6}.c121-doc{border-bottom:1px solid var(--line);padding:14px 0;display:flex;justify-content:space-between;align-items:center;gap:10px}.c121-overflow{overflow:auto}.c121-table{border-collapse:collapse;width:100%}.c121-table td,.c121-table th{padding:12px 10px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}.c121-table select{border:1px solid var(--line);background:var(--card);color:var(--text);padding:7px;border-radius:8px;max-width:160px}';
  document.head.append(styles);
  // Navigation C121 : l'EDL est une page autonome, avec son entree visible
  // meme si la navigation principale utilise des elements non standards.
  function mountEDLC121(){
    if(!document.body)return;
    // Le Catalogue contient deja l'entree Personnages : s'ancrer a son noeud visible.
    const candidates=[...document.querySelectorAll('button,a,[role="button"],.nav-item,.sidebar-item')];
    const anchor=candidates.find(el=>/personnages/i.test(el.textContent||'') && (el.textContent||'').trim().length<100);
    if(anchor && !document.getElementById('c121-edl-sidebar')){
      const button=document.createElement('button');
      button.id='c121-edl-sidebar';button.type='button';button.textContent='🌱 État des lieux';
      button.className=anchor.className||'';button.style.cssText=anchor.getAttribute('style')||'';
      button.style.cssText='';
      button.onclick=()=>navigate('edl');
      anchor.insertAdjacentElement('afterend',button);
    }
    // Secours : conserver l'acces flottant tant que le menu n'est pas valide.
    if(!document.getElementById('c121-edl-sidebar')&&!document.getElementById('c121-edl-nav')){
      const button=document.createElement('button');
      button.id='c121-edl-nav';button.type='button';button.textContent='🌱 État des lieux';
      button.style.cssText='position:fixed;right:22px;bottom:22px;z-index:2147483000;padding:13px 19px;border:0;border-radius:14px;background:#7752a3;color:white;font:600 15px system-ui;box-shadow:0 4px 18px #0004;cursor:pointer';
      button.onclick=()=>navigate('edl');document.body.appendChild(button);
    }
    if(document.getElementById('c121-edl-sidebar'))document.getElementById('c121-edl-nav')?.remove();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountEDLC121,{once:true});
  else mountEDLC121();
  const c121NavObserver=new MutationObserver(()=>{if(!document.getElementById('c121-edl-sidebar'))mountEDLC121()});
  c121NavObserver.observe(document.documentElement,{childList:true,subtree:true});
  const nav0=navigate;
  navigate=function(key){if(key==='edl'){resetTheme();setActiveNav(key);renderEDLC121();return;}return nav0(key)};
  let edlRows=[],overrides={},sagaNames={},sousNames={};
  const code=(id,k)=>id+'::'+k;
  const auto=(w,p,l,kw)=>{
    const infos=[w.genre,w.format_cible||w.format,w.statut,w.tonalite,w.temporalite,w.lieu_principal,w.public_cible];
    const keywords=Array.isArray(w.mots_cles)?w.mots_cles:typeof w.mots_cles==='string'?w.mots_cles.split(',').filter(filled):[];
    const n=infos.filter(filled).length;
    return {resume:filled(w.resume)?'Complet':'Non renseigné',informations:n===0?'Non renseigné':n===infos.length?'Complet':'À qualifier',mots_cles:(keywords.length||kw)?'Complet':'Non renseigné',personnages:p?'À qualifier':'Non renseigné',plan:l?'À qualifier':'Non renseigné'};
  };
  window.renderEDLC121=async()=>{
    const root=document.getElementById('content');
    root.innerHTML='<div class="status-line">Chargement de l’État des lieux…</div>';
    const [w,p,l,e,k]=await Promise.all([db().from('oeuvres').select('*').order('titre'),db().from('personnages_oeuvres').select('oeuvre_id'),db().from('plans').select('oeuvre_id'),db().from('edl_evaluations').select('*'),db().from('keyword_links').select('entity_id').eq('entity_type','oeuvre')]);
    const error=w.error||p.error||l.error||e.error;
    if(error){root.innerHTML='<div class="panel">EDL indisponible : '+esc(error.message)+'</div>';return;}
    const pCount={},lCount={},kCount={};
    (k.data||[]).forEach(x=>kCount[x.entity_id]=(kCount[x.entity_id]||0)+1);
    (p.data||[]).forEach(x=>pCount[x.oeuvre_id]=(pCount[x.oeuvre_id]||0)+1);
    (l.data||[]).forEach(x=>lCount[x.oeuvre_id]=(lCount[x.oeuvre_id]||0)+1);
    edlRows=(w.data||[]).filter(x=>!x.archive).map(x=>({w:x,defaults:auto(x,pCount[x.id]||0,lCount[x.id]||0,kCount[x.id]||0)}));
    overrides=Object.fromEntries((e.data||[]).map(x=>[code(x.oeuvre_id,x.critere),x.etat]));
    root.innerHTML='<style>.c121-edl{font-size:13px}.c121-edl .c121-edl-head{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px}.c121-edl h1{margin:0;font-size:27px}.c121-edl p{margin:4px 0;color:var(--muted,#756c86)}.c121-edl-filters{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.c121-edl-filters input{width:240px;max-width:100%;padding:9px 12px;border:1px solid var(--line,#ddd);border-radius:9px;background:var(--card,#fff);color:var(--text,#302638)}.c121-edl-filters select{max-width:150px;padding:9px;border:1px solid var(--line,#ddd);border-radius:9px;background:var(--card,#fff);color:var(--text,#302638)}.c121-edl .c121-overflow{overflow-x:auto}.c121-edl .c121-table{table-layout:fixed;min-width:780px;width:100%;font-size:12px}.c121-edl .c121-table th,.c121-edl .c121-table td{padding:9px 7px;white-space:normal;vertical-align:middle}.c121-edl .c121-table th:first-child{width:25%}.c121-edl .c121-table th:not(:first-child){width:15%}.c121-edl .c121-table select{width:100%;max-width:100%;font-size:11px;padding:6px 3px;min-width:0}.c121-edl .c121-work-link{border:0;background:transparent;color:var(--text,#302638);text-align:left;cursor:pointer;font:600 13px inherit;overflow-wrap:anywhere}.c121-edl .c121-work-link:hover{text-decoration:underline} .c121-edl .c121-edl-note{font-size:12px;margin-top:12px}.c121-edl .c121-state-field{display:flex;align-items:center;gap:5px;min-width:0;padding:3px 5px;border:1px solid var(--line,#e5ddec);border-radius:9px}.c121-edl .c121-state-dot{width:10px;height:10px;min-width:10px;border-radius:50%;box-shadow:0 0 0 2px #fff8}.c121-edl .c121-state-field select{border:0;background:transparent;padding:4px 0;flex:1;min-width:0;outline-offset:2px}</style>'+
    '<section class="c121-edl"><div class="c121-edl-head"><div><h1>🌱 État des lieux</h1><p>Diagnostic automatique, appréciations modifiables.</p></div><div class="c121-edl-filters"><input id="c121-q" placeholder="Rechercher une œuvre…" oninput="filterEDLC121()"><select id="c121-state" onchange="filterEDLC121()"><option value="">Tous les états</option>'+states.map(x=>'<option>'+x+'</option>').join('')+'</select><select id="c121-criterion" onchange="filterEDLC121()"><option value="">Tous les critères</option>'+criteria.map(([k,t])=>'<option value="'+k+'">'+t+'</option>').join('')+'</select></div></div>'+
    '<div class="panel c121-overflow"><table class="c121-table"><thead><tr><th>Œuvre</th>'+criteria.map(x=>'<th>'+x[1]+'</th>').join('')+'</tr></thead><tbody id="c121-edl-body"></tbody></table></div><p class="c121-edl-note">Les valeurs « Auto » proviennent des fiches. Tu peux les corriger à tout moment ; ton choix enregistré prime sur le diagnostic automatique. « À qualifier » ne signifie pas urgent.</p></section>';
    filterEDLC121();
  };
  window.filterEDLC121=()=>{
    const q=(document.getElementById('c121-q')?.value||'').toLowerCase(),s=document.getElementById('c121-state')?.value||'',c=document.getElementById('c121-criterion')?.value||'',b=document.getElementById('c121-edl-body');if(!b)return;
    const filtered=edlRows.filter(({w,defaults})=>String([w.titre,w.genre,w.statut].join(' ')).toLowerCase().includes(q)&&(!s||(c?[c]:criteria.map(x=>x[0])).some(k=>(overrides[code(w.id,k)]||defaults[k])===s)));
    const colors={'Complet':'#45a878','À qualifier':'#f3b23d','Sommaire':'#ee9c43','Non renseigné':'#ec477a','Non nécessaire':'#9b82d6'};
    const stateSelect=(id,k,title,defaults)=>{
      const current=overrides[code(id,k)]||defaults,manual=!!overrides[code(id,k)];
      const dot='<span class="c121-state-dot" style="background:'+colors[current]+'"></span>';
      return '<div class="c121-state-field">'+dot+'<select aria-label="'+esc(k)+' pour '+esc(title)+'" title="'+(manual?'Appréciation manuelle':'Diagnostic automatique')+' : '+esc(current)+'" onchange="saveEDLC121(\''+id+'\',\''+k+'\',this.value,this)"><option value="">Auto : '+esc(defaults)+'</option>'+states.map(st=>'<option value="'+st+'"'+(overrides[code(id,k)]===st?' selected':'')+'>'+st+'</option>').join('')+'</select></div>';
    };
    b.innerHTML=filtered.map(({w,defaults})=>'<tr><td><button class="c121-work-link" onclick="openOeuvreDetail(\''+w.id+'\')">'+esc(w.titre)+'</button></td>'+criteria.map(([k])=>'<td>'+stateSelect(w.id,k,w.titre,defaults[k])+'</td>').join('')+'</tr>').join('')||'<tr><td colspan="6">Aucune œuvre pour ces filtres.</td></tr>';
  };
  window.saveEDLC121=async(id,k,etat,select)=>{
    select.disabled=true;
    const r=etat?await db().from('edl_evaluations').upsert({oeuvre_id:id,critere:k,etat,user_id:currentUser.id,updated_at:new Date().toISOString()},{onConflict:'oeuvre_id,critere'}):await db().from('edl_evaluations').delete().eq('oeuvre_id',id).eq('critere',k);
    if(r.error){alert('EDL : '+r.error.message);select.disabled=false;return;}
    if(etat)overrides[code(id,k)]=etat;else delete overrides[code(id,k)];filterEDLC121();
  };
  window.downloadArchiveTemplateC121=()=>{
    const csv='\uFEFFTitre;Univers / Saga;Genre;État;Résumé;Notes\n';
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');
    a.href=url;a.download='Modele_Archives_Notion_Passerelle.csv';a.click();URL.revokeObjectURL(url);
  };
  const oldArchive=renderArchivesNotionC112;
  renderArchivesNotionC112=async function(){await oldArchive();const bar=document.querySelector('.archive-actions-c112');if(bar&&!bar.querySelector('.c121-template')){const btn=document.createElement('button');btn.className='btn-secondary c121-template';btn.textContent='📄 Télécharger le modèle CSV';btn.onclick=downloadArchiveTemplateC121;bar.prepend(btn)}};
  const oldPeople=renderOeuvrePersonnages;
  renderOeuvrePersonnages=async function(zone){
    await oldPeople(zone);
    const items=opoLinks.filter(r=>personnageFilter==='tous'||String(r.importance||'').toLowerCase()===personnageFilter);
    zone.querySelectorAll('.work-character-card-c92').forEach((card,i)=>{
      const r=items[i];if(!r)return;
      const box=document.createElement('div');box.style.marginTop='12px';
      const label=document.createElement('label');label.textContent='Importance par œuvre : ';
      const select=document.createElement('select');for(const v of ['Principal','Secondaire']){let o=document.createElement('option');o.value=v;o.textContent=v;select.append(o)}
      select.value=normalizeCharacterImportanceC114(r.importance)||'Principal';select.onclick=ev=>ev.stopPropagation();
      select.onchange=async ev=>{ev.stopPropagation();select.disabled=true;const out=await db().from('personnages_oeuvres').update({importance:select.value}).eq('personnage_id',r.personnage_id).eq('oeuvre_id',currentOeuvreId);if(out.error){alert(out.error.message);select.disabled=false;return;}await renderOeuvrePersonnages(zone)};
      box.append(label,select);card.querySelector('.work-character-copy-c92')?.append(box);
    });
  };
  // Les archives sont des personnages masques dans les fiches oeuvres,
  // sans supprimer leurs associations en base.
  const oldPeopleC121=renderOeuvrePersonnages;
  renderOeuvrePersonnages=async function(zone){
    await oldPeopleC121(zone);
    const links=opoLinks.filter(r=>personnageFilter==='tous'||String(r.importance||'').toLowerCase()===personnageFilter);
    const ids=[...new Set(links.map(r=>r.personnage_id).filter(Boolean))];
    if(!ids.length)return;
    const response=await db().from('personnages').select('*').in('id',ids);
    if(response.error){console.warn('Archives personnages C121 :',response.error.message);return;}
    const archived=new Set((response.data||[]).filter(p=>p.archive===true||p.archive===1||p.archive==='true'||p.archived===true||p.est_archive===true||p.statut_archive===true).map(p=>String(p.id)));
    [...zone.querySelectorAll('.work-character-card-c92')].forEach((card,i)=>{
      if(archived.has(String(links[i]?.personnage_id)))card.remove();
    });
  };
  const oldManuscript=renderOeuvreManuscrit;
  renderOeuvreManuscrit=async function(zone){
    await oldManuscript(zone);
    if(!zone.querySelector('#c121-chapter-picker')){const picker=document.createElement('button');picker.id='c121-chapter-picker';picker.className='btn-secondary';picker.textContent='✏️ Modifier un chapitre';picker.style.cssText='margin:10px 0';picker.onclick=()=>openChapterPickerC121();zone.prepend(picker)}
    const trs=[...zone.querySelectorAll('.manuscript-table tbody tr')].filter(tr=>!tr.classList.contains('manuscript-summary-row'));if(!trs.length)return;
    const r=await db().from('chapitres').select('id,numero,ordre,nb_mots,etat,statut').eq('oeuvre_id',currentOeuvreId).order('ordre');if(r.error)return;
    const rows=(r.data||[]).filter(c=>Number(c.nb_mots)>0||/écrit|ecrit|rédig|redig|relu|termin/i.test(String(c.etat||c.statut||'')));
    trs.forEach((tr,i)=>{if(!rows[i])return;const b=document.createElement('button');b.className='btn-secondary';b.textContent='✏️ Modifier';b.style.marginLeft='6px';b.onclick=()=>openManuscriptEditC121(rows[i].id);tr.lastElementChild.append(b)});
  };
  // Point d'entree explicite, independant de la structure du tableau manuscrit.
  window.openChapterPickerC121=async()=>{
    const r=await db().from('chapitres').select('id,titre,numero,ordre').eq('oeuvre_id',currentOeuvreId).order('ordre');
    if(r.error)return alert('Chapitres : '+r.error.message);
    const list=r.data||[];
    openDrawer('Modifier un chapitre','<div class="c121-editor"><p>Choisis le chapitre à modifier individuellement, sans réimporter le manuscrit.</p>'+list.map(c=>'<button class="btn-secondary" style="display:block;width:100%;margin:5px 0;text-align:left" onclick="openManuscriptEditC121(\''+c.id+'\')">'+esc((c.numero??c.ordre??'')+' · '+(c.titre||'Chapitre'))+'</button>').join('')+'</div>');
  };
  window.openManuscriptEditC121=async id=>{
    const r=await db().from('chapitres').select('*').eq('id',id).single();if(r.error)return alert(r.error.message);const c=r.data;
    openDrawer('Modifier le chapitre '+esc(c.numero??c.ordre??''),'<div class="c121-editor">'+
      '<label>Titre<input id="c121-title" value="'+esc(c.titre)+'"></label>'+
      '<label>Mots<input id="c121-words" type="number" min="0" value="'+Number(c.nb_mots||0)+'"></label>'+
      '<label>État<select id="c121-etat">'+['À écrire','En cours','Rédigé','Révisé'].map(s=>'<option'+(s===(c.etat||c.statut)?' selected':'')+'>'+s+'</option>').join('')+'</select></label>'+
      '<label>Date d’écriture<input id="c121-date" type="date" value="'+esc(String(c.date_ecriture||'').slice(0,10))+'"></label>'+
      '<label>Résumé réellement écrit<textarea id="c121-resume">'+esc(c.resume||'')+'</textarea></label>'+
      '<p class="status-line">Après enregistrement, les champs de ce chapitre ne seront plus écrasés par Atelier. Tu peux lever cette protection.</p>'+
      '<button class="btn-primary" onclick="saveManuscriptEditC121(\''+id+'\')">Enregistrer ce chapitre</button>'+
      '<button class="btn-secondary" onclick="unlockManuscriptC121(\''+id+'\')">↺ Réautoriser la synchro Atelier</button></div>');
  };
  window.saveManuscriptEditC121=async id=>{
    const fields={titre:document.getElementById('c121-title').value.trim(),nb_mots:Math.max(0,Number(document.getElementById('c121-words').value)||0),etat:document.getElementById('c121-etat').value,date_ecriture:document.getElementById('c121-date').value||null,resume:document.getElementById('c121-resume').value.trim()||null};
    if(!fields.titre)return alert('Le titre est obligatoire.');
    const r=await db().from('chapitres').update(fields).eq('id',id);if(r.error)return alert(r.error.message);
    const l=await db().from('chapitres_manuels').upsert({chapitre_id:id,oeuvre_id:currentOeuvreId,user_id:currentUser.id,champs:Object.keys(fields),updated_at:new Date().toISOString()},{onConflict:'chapitre_id'});
    if(l.error)return alert('Changements enregistrés, mais protection Atelier indisponible : '+l.error.message);
    closeDrawer();await renderOeuvreManuscrit(document.getElementById('oeuvre-tab-content'));
  };
  window.unlockManuscriptC121=async id=>{
    if(!confirm('Autoriser à nouveau Atelier à remplacer les champs de ce chapitre ?'))return;
    const r=await db().from('chapitres_manuels').delete().eq('chapitre_id',id);if(r.error)return alert(r.error.message);
    closeDrawer();alert('Protection retirée.');
  };
  let mode='postits',docs=[];
  const oldChantier=renderOeuvreChantierC97;
  renderOeuvreChantierC97=async function(zone){
    await oldChantier(zone);
    const html=zone.innerHTML;
    zone.innerHTML='<div class="c121-tabs"><button id="c121-postit-btn" onclick="showChantierModeC121(\'postits\')">🗒️ Post-it</button><button id="c121-doc-btn" onclick="showChantierModeC121(\'documents\')">📄 Documents</button></div><div id="c121-postits">'+html+'</div><div id="c121-documents" style="display:none"></div>';
    showChantierModeC121(mode);
  };
  window.showChantierModeC121=next=>{
    mode=next;document.getElementById('c121-postits').style.display=next==='postits'?'':'none';document.getElementById('c121-documents').style.display=next==='documents'?'':'none';
    document.getElementById('c121-postit-btn').classList.toggle('active',next==='postits');document.getElementById('c121-doc-btn').classList.toggle('active',next==='documents');
    if(next==='documents')renderChantierDocsC121();
  };
  window.renderChantierDocsC121=async()=>{
    const z=document.getElementById('c121-documents');if(!z)return;z.innerHTML='<div class="status-line">Chargement…</div>';
    const r=await db().from('documents_chantier').select('*').eq('oeuvre_id',currentOeuvreId).order('updated_at',{ascending:false});
    if(r.error){z.innerHTML='<div class="panel">Documents indisponibles : '+esc(r.error.message)+'<p>Migration SQL C121 nécessaire.</p></div>';return;}
    docs=r.data||[];
    z.innerHTML='<section class="panel"><div class="work-toolbar"><div><h2>📄 Documents de travail</h2><p>Plans provisoires et brouillons longs. Le Plan officiel reste intact.</p></div><button class="btn-primary" onclick="editChantierDocC121()">+ Nouveau document</button></div><div class="c121-tabs"><button onclick="listChantierDocsC121(false)">Actifs</button><button onclick="listChantierDocsC121(true)">Archivés</button></div><div id="c121-doc-list"></div><div id="c121-doc-editor"></div></section>';
    listChantierDocsC121(false);
  };
  window.listChantierDocsC121=archived=>{
    const z=document.getElementById('c121-doc-list');if(!z)return;
    z.innerHTML=docs.filter(x=>!!x.archive===!!archived).map(x=>'<div class="c121-doc"><div><strong>'+esc(x.titre)+'</strong><div class="status-line">'+(x.contenu||'').length+' caractères · '+esc(x.updated_at?.slice(0,10)||'')+'</div></div><button class="btn-secondary" onclick="viewChantierDocC121(\''+x.id+'\')">👁️ Consulter</button></div>').join('')||'<p class="empty">Aucun document ici.</p>';
  };
    window.viewChantierDocC121=id=>{
    const d=docs.find(x=>x.id===id),z=document.getElementById('c121-doc-editor');
    if(!d||!z)return;
    const safeContent=esc(d.contenu||'').replace(/\r\n?/g,'\n');
    z.innerHTML='<article class="c121-editor"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><h3>'+esc(d.titre)+'</h3><button class="btn-secondary" onclick="editChantierDocC121(\''+id+'\')">✏️ Modifier</button></div><div style="white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.75;max-height:70vh;overflow:auto">'+(safeContent||'<em>Document vide.</em>')+'</div><button class="btn-secondary" onclick="document.getElementById(\'c121-doc-editor\').innerHTML=\'\'">Fermer</button></article>';
    z.scrollIntoView({block:'nearest'});
  };
  window.editChantierDocC121=(id='')=>{
    const d=docs.find(x=>x.id===id)||{},z=document.getElementById('c121-doc-editor');
    z.innerHTML='<div class="c121-editor"><h3>'+(id?'Modifier':'Nouveau document')+'</h3><label>Titre<input id="c121-doc-title" value="'+esc(d.titre||'')+'" placeholder="Plan provisoire V0"></label><label>Contenu<textarea id="c121-doc-text" placeholder="Colle ton texte ici…">'+esc(d.contenu||'')+'</textarea></label><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn-primary" onclick="saveChantierDocC121(\''+id+'\')">Enregistrer</button><button class="btn-secondary" onclick="document.getElementById(\'c121-doc-editor\').innerHTML=\'\'">Annuler</button>'+
      (id?'<button class="btn-secondary" onclick="archiveChantierDocC121(\''+id+'\','+(!d.archive)+')">'+(d.archive?'Restaurer':'Archiver')+'</button><button class="btn-secondary" onclick="deleteChantierDocC121(\''+id+'\')">Supprimer</button>':'')+'</div></div>';
    z.scrollIntoView({block:'nearest'});
  };
  window.saveChantierDocC121=async id=>{
    const titre=document.getElementById('c121-doc-title').value.trim(),contenu=document.getElementById('c121-doc-text').value;if(!titre)return alert('Titre obligatoire.');
    const changes={titre,contenu,updated_at:new Date().toISOString()};
    const r=id?await db().from('documents_chantier').update(changes).eq('id',id):await db().from('documents_chantier').insert({...changes,oeuvre_id:currentOeuvreId,user_id:currentUser.id});
    if(r.error)return alert(r.error.message);await renderChantierDocsC121();
  };
  window.archiveChantierDocC121=async(id,archive)=>{const r=await db().from('documents_chantier').update({archive,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)return alert(r.error.message);await renderChantierDocsC121();};
  window.deleteChantierDocC121=async id=>{if(!confirm('Supprimer définitivement ce document ?'))return;const r=await db().from('documents_chantier').delete().eq('id',id);if(r.error)return alert(r.error.message);await renderChantierDocsC121();};
  // C122 · Livraison groupee. Aucune migration de donnees.
  const c122Style=document.createElement('style');
  c122Style.textContent='.c122-actions{display:flex;gap:6px;flex-wrap:wrap;margin:9px 0}.c122-actions button{font-size:12px}.c122-importance{min-width:105px;max-width:145px;font-size:12px;padding:5px}.c122-media-row{display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--line);padding:9px 0}.c122-media-row img{width:56px;height:66px;object-fit:cover;border-radius:7px}.c122-media-row>div{flex:1;min-width:0}';
  document.head.append(c122Style);
  const norm122=v=>String(v??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const c122Role=v=>{const n=norm122(v);return n==='principal'||n==='principaux'?'principal':n==='secondaire'||n==='secondaires'?'secondaire':n};
  const c122Active=p=>!(p?.archive===true||p?.archive===1||p?.archive==='true'||p?.archived===true||p?.est_archive===true||p?.statut_archive===true);
  // 1. Import en masse : etiquettes distinctives par oeuvre, valeur = ID personnage.
  const import122=renderCharacterMediaImportV65;
  renderCharacterMediaImportV65=async function(zone){
    await import122(zone);
    const ids=characterMediaImportV65.characters.map(x=>x.id);
    if(!ids.length)return;
    const [relations,works]=await Promise.all([db().from('personnages_oeuvres').select('personnage_id,oeuvre_id').in('personnage_id',ids),db().from('oeuvres').select('id,titre')]);
    if(relations.error||works.error){console.warn('C122 etiquettes œuvres',relations.error||works.error);return}
    const titles=new Map((works.data||[]).map(x=>[x.id,x.titre]));
    const byPerson=new Map();
    (relations.data||[]).forEach(x=>{const t=titles.get(x.oeuvre_id);if(t){if(!byPerson.has(x.personnage_id))byPerson.set(x.personnage_id,new Set());byPerson.get(x.personnage_id).add(t)}});
    characterMediaImportV65.characters.forEach(p=>p.c122Label=p.nom+' · '+([...byPerson.get(p.id)||[]].join(' / ')||'Sans œuvre liée'));
    c122LabelImport();
  };
  function c122LabelImport(){
    const labels=new Map(characterMediaImportV65.characters.map(p=>[p.id,p.c122Label||p.nom]));
    document.querySelectorAll('#character-media-import-zone-v65 select option, #cm-bulk-character-v65 option').forEach(o=>{if(labels.has(o.value))o.textContent=labels.get(o.value)});
  }
  const preview122=renderCharacterMediaPreviewV65;
  renderCharacterMediaPreviewV65=function(){preview122();c122LabelImport()};
  // 2. Filtre : lire les associations, pas les libelles ni la position des cartes.
  // Le moteur original sait deja filtrer les valeurs canoniques principal/secondaire.
  // Le correctif C121 compare a tort des valeurs au pluriel et perd les correspondances.
  const people122=renderOeuvrePersonnages;
  renderOeuvrePersonnages=async function(zone){
    const wanted=c122Role(personnageFilter);
    personnageFilter='tous';
    try{await people122(zone)}finally{personnageFilter=wanted}
    const links=opoLinks||[];
    const cards=[...zone.querySelectorAll('.work-character-card-c92')];
    const all=links.filter(x=>c122Active(x.personnages));
    const visible=new Set(all.filter(x=>wanted==='tous'||c122Role(x.importance||'principal')===wanted).map(x=>String(x.personnage_id)));
    cards.forEach((card,i)=>{
      // L'ancien rendu suit l'ordre des associations (avant le masquage des archives).
      const onclick=card.getAttribute('onclick')||'';
      const match=onclick.match(/openCharacterFromWorkV575\(['\"]([^'\"]+)/);
      const id=match?.[1]||links[i]?.personnage_id;
      if(!id||!visible.has(String(id)))card.remove();
    });
    zone.querySelectorAll('.work-toolbar .segmented button').forEach(btn=>{
      const label=norm122(btn.textContent);
      btn.classList.toggle('active',label==='tous'?wanted==='tous':label==='principaux'?wanted==='principal':label==='secondaires'?wanted==='secondaire':false);
    });
    const grid=zone.querySelector('#work-character-gallery');
    if(grid&&!grid.querySelector('.work-character-card-c92'))grid.insertAdjacentHTML('beforeend','<p class="empty c122-empty">Aucun personnage dans cette catégorie.</p>');
  };
  // 3. Table complete : aucune description, importance editable par oeuvre.
  const catalog122=renderCharacterCatalogResultsV572;
  renderCharacterCatalogResultsV572=function(){
    catalog122();
    if(characterCatalogV572.view!=='table')return;
    const table=document.querySelector('#character-results table');if(!table)return;
    const th=table.querySelector('thead tr');if(!th||th.querySelector('.c122-col'))return;
    const heading=document.createElement('th');heading.className='c122-col';heading.textContent='Importance';th.insertBefore(heading,th.children[3]);
    const people=filteredCharactersV572();
    [...table.querySelectorAll('tbody tr')].forEach((tr,i)=>{
      const p=people[i];if(!p)return;
      const nameCell=tr.children[1];if(nameCell){nameCell.querySelectorAll('br,span').forEach(el=>el.remove())}
      const cell=document.createElement('td');cell.className='c122-col';
      const links=characterRelationsV572(p.id);
      links.forEach(link=>{
        const row=document.createElement('div');row.style.cssText='display:flex;gap:5px;align-items:center;margin:3px 0;flex-wrap:wrap';
        const label=document.createElement('small');label.textContent=link.work?.titre||'Œuvre';label.style.maxWidth='125px';
        const select=document.createElement('select');select.className='c122-importance';
        for(const [v,t] of [['principal','Principal'],['secondaire','Secondaire']]){const o=document.createElement('option');o.value=v;o.textContent=t;select.append(o)}
        select.value=c122Role(link.importance)==='secondaire'?'secondaire':'principal';
        select.onchange=async()=>{
          select.disabled=true;
          const r=await db().from('personnages_oeuvres').update({importance:select.value}).eq('personnage_id',p.id).eq('oeuvre_id',link.oeuvre_id);
          if(r.error){alert('Importance non enregistrée : '+r.error.message);select.value=c122Role(link.importance)==='secondaire'?'secondaire':'principal'}
          else link.importance=select.value;
          select.disabled=false;
        };
        row.append(label,select);cell.append(row);
      });
      if(!links.length)cell.textContent='—';
      tr.insertBefore(cell,tr.children[3]);
    });
    const empty=table.querySelector('td[colspan="5"]');if(empty)empty.colSpan=6;
  };
  // C122 : remplacer les colonnes CSS (lecture verticale) par une grille (lecture horizontale).
  // Les illustrations suivent maintenant l'ordre gauche -> droite, puis ligne suivante.
  const mediaRowsStyle122=document.createElement('style');
  mediaRowsStyle122.textContent='.media-grid{columns:auto!important;display:grid!important;grid-template-columns:repeat(auto-fill,minmax(min(100%,210px),1fr));gap:14px;align-items:start}.media-grid>.media-card{margin:0!important;min-width:0}';
  document.head.append(mediaRowsStyle122);
  // 4. Ordre de lecture : chaque carte est identifiee par son media_id.
  const workMedia122=renderOeuvreMedias;
  renderOeuvreMedias=async function(zone){
    await workMedia122(zone);
    const grid=zone.querySelector('.media-grid');
    if(!grid)return;
    const cards=[...grid.querySelectorAll('.media-card')];
    if(cards.length<2)return;
    const ids=cards.map(card=>{
      const call=card.getAttribute('onclick')||'';
      const m=call.match(/openMediaDrawer\\(['\"]([^'\"]+)['\"]\\)/);
      return m?.[1]||null;
    });
    if(ids.some(id=>!id))return console.warn('C122 : ID de media non reconnu');
    const [mediaResult,chapterResult]=await Promise.all([
      db().from('medias').select('id,type,chapitre_id').in('id',ids),
      db().from('chapitres').select('id,numero,ordre,titre').eq('oeuvre_id',currentOeuvreId)
    ]);
    if(mediaResult.error||chapterResult.error)return console.warn('C122 tri : lecture impossible',mediaResult.error||chapterResult.error);
    const medias=new Map((mediaResult.data||[]).map(m=>[String(m.id),m]));
    const chapters=chapterResult.data||[];
    const num=v=>{if(v==null||String(v).trim()==='')return Infinity;const m=String(v).match(/\\d+(?:[.,]\\d+)?/);return m?Number(m[0].replace(',','.')):Infinity};
    const chapterMap=new Map(chapters.map((c,i)=>[String(c.id),{order:Number.isFinite(num(c.numero))?num(c.numero):Number.isFinite(num(c.ordre))?num(c.ordre):i+1,title:c.titre||''}]));
    const ordered=cards.map((card,i)=>({card,i,media:medias.get(String(ids[i]))}));
    // La galerie Illustration est ordonnee par chapitre, puis ordre stable des images.
    if(mediaFilter==='Illustration'||ordered.every(x=>x.media?.type==='Illustration')){
      ordered.sort((a,b)=>{
        const ca=chapterMap.get(String(a.media?.chapitre_id));
        const cb=chapterMap.get(String(b.media?.chapitre_id));
        return (ca?.order??Infinity)-(cb?.order??Infinity)||a.i-b.i;
      });
      ordered.forEach(({card,media})=>{
        card.querySelector('.c122-chapter-label')?.remove();
        const ch=chapterMap.get(String(media?.chapitre_id));
        const label=document.createElement('small');label.className='c122-chapter-label';
        label.style.cssText='display:block;font-weight:600;margin-top:5px;color:var(--accent)';
        label.textContent=ch?'Chapitre '+ch.order:'Sans chapitre';
        card.querySelector('.media-meta')?.append(label);
        grid.appendChild(card);
      });
    }
  };
  // 5. Mediatheque personnage : remplacer le fichier sans changer la fiche ni l'ID media.
  const detail122=openCharacterDetailV573;
  openCharacterDetailV573=async function(id,tab='apercu',contextWorkId=null){
    await detail122(id,tab,contextWorkId);
    const container=document.querySelector('.character-detail');if(!container)return;
    const actions=container.querySelector('.character-hero-actions');
    if(actions&&!actions.querySelector('.c122-open-media')){
      const btn=document.createElement('button');btn.className='btn-secondary c122-open-media';btn.textContent='🖼 Gérer les images';
      btn.onclick=()=>c122OpenCharacterMedia(id);
      actions.append(btn);
    }
  };
  window.c122OpenCharacterMedia=async function(id){
    const r=await db().from('medias').select('id,url,titre,type').eq('personnage_id',id).order('created_at',{ascending:false});
    if(r.error)return alert(r.error.message);
    const rows=r.data||[];
    openDrawer('Images du personnage',rows.length?rows.map(m=>'<div class="c122-media-row">'+(m.url?'<img src="'+esc(m.url)+'" alt="">':'')+'<div><strong>'+esc(m.titre||m.type||'Visuel')+'</strong><small style="display:block">'+esc(m.type||'')+'</small><div class="c122-actions"><label class="btn-secondary" style="cursor:pointer">🔄 Remplacer<input type="file" accept="image/png,image/jpeg,image/webp" hidden onchange="c122ReplaceMedia(\''+m.id+'\',\''+id+'\',this)"></label><button class="btn-secondary" onclick="c122DeleteMedia(\''+m.id+'\',\''+id+'\')">🗑 Supprimer</button></div></div></div>').join(''):'<p>Aucun média lié à ce personnage.</p>');
  };
  window.c122ReplaceMedia=async function(mediaId,characterId,input){
    const file=input.files?.[0];if(!file)return;
    if(!/^image\/(png|jpeg|webp)$/.test(file.type))return alert('Choisis une image PNG, JPG ou WebP.');
    input.disabled=true;
    try{
      const old=await db().from('medias').select('url').eq('id',mediaId).eq('personnage_id',characterId).single();
      if(old.error)throw old.error;
      const url=await uploadAssetFile(file,'personnages/c122',{throwOnError:true});
      if(!url)throw Error('Import du fichier impossible');
      const update=await db().from('medias').update({url}).eq('id',mediaId).eq('personnage_id',characterId);
      if(update.error)throw update.error;
      const p=await db().from('personnages').select('portrait_url,banniere_url,avatar_site_url').eq('id',characterId).single();
      if(!p.error&&p.data){
        const fields={};for(const k of ['portrait_url','banniere_url','avatar_site_url'])if(p.data[k]===old.data.url)fields[k]=url;
        if(Object.keys(fields).length){const u=await db().from('personnages').update(fields).eq('id',characterId);if(u.error)alert('Image remplacée, mais la fiche nécessite une actualisation : '+u.error.message)}
      }
      await c122OpenCharacterMedia(characterId);
    }catch(e){alert('Remplacement annulé : '+(e.message||e));input.disabled=false}
  };
  window.c122DeleteMedia=async function(mediaId,characterId){
    if(!confirm('Supprimer cette image de la médiathèque du personnage ? Cette action ne supprime pas le personnage.'))return;
    const old=await db().from('medias').select('url').eq('id',mediaId).eq('personnage_id',characterId).single();
    if(old.error)return alert(old.error.message);
    const del=await db().from('medias').delete().eq('id',mediaId).eq('personnage_id',characterId);
    if(del.error)return alert(del.error.message);
    const p=await db().from('personnages').select('portrait_url,banniere_url,avatar_site_url').eq('id',characterId).single();
    if(!p.error&&p.data){const fields={};for(const k of ['portrait_url','banniere_url','avatar_site_url'])if(p.data[k]===old.data.url)fields[k]=null;if(Object.keys(fields).length){const u=await db().from('personnages').update(fields).eq('id',characterId);if(u.error)alert('Image supprimée, mais référence fiche non nettoyée : '+u.error.message)}}
    await c122OpenCharacterMedia(characterId);
  };



  // C123 : filtres et selection stable du catalogue.
  const filtered123=filteredCharactersV572;
  filteredCharactersV572=function(){
    const st=characterCatalogV572,empty=st.work==='__c123_empty__';
    if(empty)st.work='';
    let rows;
    try{rows=filtered123()}finally{if(empty)st.work='__c123_empty__'}
    if(st.view!=='archives')rows=rows.filter(p=>!p.archive);
    if(empty)rows=rows.filter(p=>!st.links.some(l=>l.personnage_id===p.id));
    return rows;
  };
  const body123=renderCharacterCatalogBodyV572;
  renderCharacterCatalogBodyV572=function(){
    body123();
    const select=document.querySelectorAll('#personnages-zone .character-filterbar select')[2];
    if(select){
      select.add(new Option('Sans œuvre associée','__c123_empty__'),1);
      if(characterCatalogV572.work==='__c123_empty__')select.value='__c123_empty__';
    }
  };
  const css123=document.createElement('style');
  css123.textContent='#character-bulk-zone .character-bulkbar{position:fixed;bottom:15px;left:50%;transform:translateX(-50%);z-index:1100;max-width:calc(100vw - 24px);box-shadow:0 7px 25px #0002}';
  document.head.append(css123);

  // C123 Codex image sans degradé.
  const codexStyle123=document.createElement('style');
  codexStyle123.textContent='.codex-card-shell-v39b .entity-card{background:var(--card)!important}';
  document.head.append(codexStyle123);


  // C123 Codex : couverture entiere, legende distincte, aucun voile degrade.
  const coverCss123=document.createElement('style');
  coverCss123.textContent='.c123-codex .entity-card{height:auto!important;min-height:0!important;display:flex!important;flex-direction:column!important;background:var(--card)!important;overflow:hidden}.c123-codex .entity-card::before,.c123-codex .entity-card::after{display:none!important}.c123-codex .entity-card-bg{position:relative!important;inset:auto!important;display:block!important;height:215px!important;flex:none!important;background-size:contain!important;background-repeat:no-repeat!important;background-position:center!important;opacity:1!important;filter:none!important;background-color:var(--bg-2)!important}.c123-codex .entity-card-body{position:relative!important;inset:auto!important;display:block!important;min-height:75px!important;padding:13px 15px!important;background:var(--card)!important;color:var(--text)!important}.c123-codex .entity-card-body h3{color:var(--text)!important;font-size:20px!important}.c123-codex .entity-card-top{position:absolute!important;top:6px;left:7px;z-index:4}.c123-codex .c123-heading{grid-column:1/-1;font-weight:700;padding:10px 0;border-bottom:1px solid var(--line)}.c123-filter{margin:12px 0}.c123-filter select{padding:9px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--text)}';
  document.head.append(coverCss123);


  async function applyCodexCategories123(zone,context){
    const gallery=zone?.querySelector('.entity-gallery');if(!gallery)return;
    const r=await db().from('codex_pages').select('*').eq(context==='saga'?'saga_id':'sous_saga_id',context==='saga'?currentSagaId:currentSousSagaId).order('ordre');
    if(r.error)return;
    const pages=(r.data||[]).filter(p=>codexPageIsArchivedV39b(p)===!!codexArchiveViewV39b[context]);
    const cards=[...gallery.querySelectorAll('.codex-card-shell-v39b')];
    if(cards.length!==pages.length)return;
    const cats=[...new Set(pages.flatMap(p=>codexCategoryTagsV39(p.categorie)))].sort();
    const select=document.createElement('select');select.append(new Option('Toutes les catégories',''));
    cats.forEach(c=>select.append(new Option(c,c)));
    const bar=document.createElement('div');bar.className='c123-filter';bar.append('Catégorie : ',select);gallery.before(bar);
    gallery.classList.add('c123-codex');
    select.onchange=()=>{
      const chosen=select.value;
      const sorted=pages.map((p,i)=>({p,card:cards[i]})).filter(x=>!chosen||codexCategoryTagsV39(x.p.categorie).includes(chosen));
      sorted.sort((a,b)=>(chosen?'':codexCategoryTagsV39(a.p.categorie)[0]||'').localeCompare(chosen?'':codexCategoryTagsV39(b.p.categorie)[0]||'')||(Date.parse(a.p.created_at)||0)-(Date.parse(b.p.created_at)||0));
      sorted.forEach(x=>gallery.append(x.card));
      cards.forEach(card=>card.hidden=!sorted.some(x=>x.card===card));
    };
    select.onchange();
  }


  const originalSagaCodex123=renderSagaCodexV56;
  renderSagaCodexV56=async function(zone){await originalSagaCodex123(zone);await applyCodexCategories123(zone,'saga')};
  const originalSubCodex123=renderSousSagaCodex;
  renderSousSagaCodex=async function(zone){await originalSubCodex123(zone);await applyCodexCategories123(zone,'sous-saga')};


  // C123+ : consultation rapide d'un personnage sans perdre la selection multiple.
  const previewCss123=document.createElement('style');
  previewCss123.textContent='.c123-name-preview{cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:4px}.c123-name-preview:hover{color:var(--accent)}';
  document.head.append(previewCss123);
  const originalTablePreview123=renderCharacterCatalogResultsV572;
  renderCharacterCatalogResultsV572=function(){
    originalTablePreview123();
    if(characterCatalogV572.view!=='table')return;
    const rows=[...document.querySelectorAll('#character-results table tbody tr')];
    const people=filteredCharactersV572();
    rows.forEach((row,i)=>{
      const person=people[i],cell=row.children[1];
      if(!person||!cell)return;
      const label=cell.querySelector('strong,a')||cell;
      label.classList.add('c123-name-preview');
      label.setAttribute('role','button');label.setAttribute('tabindex','0');
      label.setAttribute('title','Ouvrir la fiche de '+(person.nom||'ce personnage'));
      const open=ev=>{
        ev.stopPropagation();
        const y=window.scrollY;
        const selection=new Set(characterCatalogV572.selected||[]);
        Promise.resolve(openCharacterDetailV573(person.id)).finally(()=>{
          if(characterCatalogV572.selected instanceof Set)characterCatalogV572.selected=selection;
          window.scrollTo(0,y);
        });
      };
      label.addEventListener('click',open);
      label.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();open(ev)}});
    });
  };


  // C123+ : relier les personnages dans une fenetre compacte, fermee apres succes.
  const linkerStyle123=document.createElement('style');
  linkerStyle123.textContent='#character-linker-host-c58:has(.character-linker-c58){position:fixed!important;inset:0!important;z-index:1200!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important;background:rgba(25,19,35,.25)!important;overflow:auto!important}#character-linker-host-c58 .character-linker-c58{width:min(720px,calc(100vw - 36px))!important;max-height:min(76vh,650px)!important;overflow:auto!important;margin:0!important;box-shadow:0 18px 55px rgba(20,10,30,.2)!important;background:var(--card)!important}#character-linker-host-c58 .character-linker-works-c58{max-height:210px!important}';
  document.head.append(linkerStyle123);
  const linkOriginal123=bulkLinkCharactersToWorksC58;
  bulkLinkCharactersToWorksC58=async function(remove=false){
    const status=document.getElementById('c58-link-status');
    const checked=document.querySelectorAll('[data-c58-work]:checked').length;
    if(!checked)return linkOriginal123(remove);
    await linkOriginal123(remove);
    const message=status?.textContent||'';
    if(message.includes('erreur')||message.includes('Choisis'))return;
    characterBulkLinkerOpenC58=false;
    characterLinkerSearchC91='';
    characterLinkerWorkC91='';
    const host=document.getElementById('character-linker-host-c58');
    if(host)host.replaceChildren();
    if(document.getElementById('character-bulk-zone'))renderCharacterBulkBarV572();
  };


  // C123 : la barre de selection est une barre compacte, pas une modale plein ecran.
  const bulkCompact123=document.createElement('style');
  bulkCompact123.textContent='#character-bulk-zone{position:fixed!important;inset:auto 16px 16px auto!important;top:auto!important;left:auto!important;right:16px!important;bottom:16px!important;width:max-content!important;max-width:calc(100vw - 32px)!important;height:auto!important;min-height:0!important;max-height:110px!important;overflow:visible!important;display:block!important;background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;pointer-events:none!important;z-index:1050!important}#character-bulk-zone .character-bulkbar{position:relative!important;inset:auto!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important;transform:none!important;width:max-content!important;max-width:100%!important;height:auto!important;min-height:0!important;padding:10px 14px!important;border-radius:12px!important;pointer-events:auto!important;background:var(--card)!important;box-shadow:0 6px 24px #0002!important}#character-bulk-zone .character-linker-c58{pointer-events:auto!important}';
  document.head.append(bulkCompact123);

  // C123 : consultation rapide en panneau lateral droit, sans navigation.
  const quickStyle123=document.createElement('style');
  quickStyle123.textContent='.c123-quick-backdrop{position:fixed;inset:0;background:rgba(20,15,30,.24);z-index:2000}.c123-quick-panel{position:fixed;right:0;top:0;bottom:0;width:min(440px,95vw);background:var(--card);z-index:2001;box-shadow:-12px 0 40px #0002;overflow:auto;padding:22px}.c123-quick-header{display:flex;justify-content:space-between;gap:12px;align-items:center}.c123-quick-portrait{width:100%;max-height:300px;object-fit:contain;background:var(--bg-2);border-radius:12px;margin:14px 0}.c123-quick-section{margin-top:18px;border-top:1px solid var(--line);padding-top:12px}.c123-quick-panel .tag{display:inline-block;margin:3px}';
  document.head.append(quickStyle123);
  window.closeCharacterQuickPanel123=function(){
    document.getElementById('c123-quick-backdrop')?.remove();
    document.getElementById('c123-quick-panel')?.remove();
  };

  window.openCharacterQuickPanel123=async function(id){
    closeCharacterQuickPanel123();
    const back=document.createElement('div');back.id='c123-quick-backdrop';back.className='c123-quick-backdrop';back.onclick=closeCharacterQuickPanel123;
    const panel=document.createElement('aside');panel.id='c123-quick-panel';panel.className='c123-quick-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Aperçu du personnage');
    const header=document.createElement('div');header.className='c123-quick-header';
    const title=document.createElement('h2');title.textContent='Chargement…';
    const close=document.createElement('button');close.className='btn-secondary';close.textContent='✕ Fermer';close.onclick=closeCharacterQuickPanel123;
    header.append(title,close);panel.append(header);document.body.append(back,panel);
    const [pr,lr,wr,mr]=await Promise.all([
      db().from('personnages').select('*').eq('id',id).single(),
      db().from('personnages_oeuvres').select('*').eq('personnage_id',id),
      db().from('oeuvres').select('id,titre'),
      db().from('medias').select('*').eq('personnage_id',id).limit(30)
    ]);
    if(!panel.isConnected)return;
    if(pr.error){title.textContent='Fiche indisponible';const err=document.createElement('p');err.textContent=pr.error.message;panel.append(err);return}
    const p=pr.data,d=characterDataV573(p);
    title.textContent=p.nom||'Personnage';
    const portrait=p.portrait_url||d.portrait_url||(mr.data||[]).find(m=>m.type==='Portrait')?.url;
    if(portrait){const img=document.createElement('img');img.className='c123-quick-portrait';img.src=portrait;img.alt=p.nom||'';panel.append(img)}
    const addSection=(heading,value)=>{
      if(value==null||String(value).trim()==='')return;
      const sec=document.createElement('section');sec.className='c123-quick-section';
      const h=document.createElement('h3');h.textContent=heading;
      const body=document.createElement('p');body.textContent=String(value);
      body.style.whiteSpace='pre-wrap';sec.append(h,body);panel.append(sec);
    };
    addSection('Résumé',p.resume||d.resume||d.presentation||d.description);
    const fields=[['Nom complet',d.nom_complet],['Surnom',d.surnom],['Âge',d.age],['Espèce',d.espece],['Profession',d.profession],['Affiliation',d.affiliation],['Personnalité',d.personnalite],['Rôle',d.role]];
    fields.forEach(([label,value])=>addSection(label,value));
    const links=lr.data||[],works=new Map((wr.data||[]).map(w=>[w.id,w.titre]));
    addSection('Œuvres associées',links.map(l=>(works.get(l.oeuvre_id)||'Œuvre inconnue')+(l.importance?' · '+l.importance:'')).join('\n')||'Aucune œuvre associée.');
    addSection('État',p.archive?'Personnage archivé':'Personnage actif');
    const more=document.createElement('button');more.className='btn-secondary';more.textContent='Ouvrir la fiche complète';
    more.onclick=()=>{closeCharacterQuickPanel123();openCharacterDetailV573(id)};
    panel.append(more);
  };
  const quickTable123=renderCharacterCatalogResultsV572;
  renderCharacterCatalogResultsV572=function(){
    quickTable123();
    if(characterCatalogV572.view!=='table')return;
    const people=filteredCharactersV572();
    document.querySelectorAll('#character-results table tbody tr').forEach((row,i)=>{
      const p=people[i],cell=row.children[1];
      if(!p||!cell)return;
      cell.addEventListener('click',ev=>{ev.preventDefault();ev.stopImmediatePropagation();openCharacterQuickPanel123(p.id)},true);
      cell.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();ev.stopImmediatePropagation();openCharacterQuickPanel123(p.id)}},true);
      cell.style.cursor='pointer';
    });
  };


  // C123 : ordre des tomes pour les oeuvres directement rattachees a une saga.
  const sagaOrderOriginal123=renderAdminSagaEditorV56;
  renderAdminSagaEditorV56=async function(){
    await sagaOrderOriginal123();
    if(adminSagaTabV56!=='information')return;
    const zone=document.getElementById('admin-saga-tab-v56');
    if(!zone)return;
    const r=await db().from('oeuvres').select('id,titre,numero_sous_saga,ordre_sous_saga').eq('saga_id',adminSagaIdV56).is('sous_saga_id',null);
    if(r.error)return console.warn('C123 ordre saga',r.error);
    const works=(r.data||[]).sort((a,b)=>(a.ordre_sous_saga??9999)-(b.ordre_sous_saga??9999)||(a.numero_sous_saga??9999)-(b.numero_sous_saga??9999));
    const section=document.createElement('section');section.className='admin-section';
    const heading=document.createElement('div');heading.className='admin-section-head';
    const intro=document.createElement('div');intro.innerHTML='<h2>Ordre des tomes</h2><p class="admin-section-sub">Œuvres directement rattachées à la saga, hors sous-sagas. Numéro de tome et ordre d’affichage indépendants.</p>';
    const save=document.createElement('button');save.className='btn-primary';save.textContent='Enregistrer l’ordre';save.onclick=async()=>{
      save.disabled=true;
      const rows=[...section.querySelectorAll('.ss-work-order-row')];
      for(const row of rows){
        const id=row.dataset.workId;
        const num=row.querySelector('[data-role="num"]').value;
        const ord=row.querySelector('[data-role="order"]').value;
        const payload={numero_sous_saga:num===''?null:Number(num),ordre_sous_saga:ord===''?null:Number(ord)};
        const result=await db().from('oeuvres').update(payload).eq('id',id).eq('saga_id',adminSagaIdV56).is('sous_saga_id',null);
        if(result.error){alert('Ordre non enregistré : '+result.error.message);save.disabled=false;return}
      }
      save.disabled=false;alert('Ordre des tomes enregistré ✓');
      await renderAdminSagaEditorV56();
    };
    heading.append(intro,save);section.append(heading);
    const list=document.createElement('div');list.className='ss-work-order-list';
    works.forEach((w,i)=>{
      const row=document.createElement('div');row.className='ss-work-order-row';row.dataset.workId=w.id;
      const title=document.createElement('div');title.className='ss-work-order-title';
      const strong=document.createElement('strong');strong.textContent=w.titre;title.append(strong);
      const numLabel=document.createElement('label');numLabel.textContent='Numéro du tome';
      const num=document.createElement('input');num.type='number';num.min='0';num.step='1';num.dataset.role='num';num.value=w.numero_sous_saga??'';numLabel.append(num);
      const ordLabel=document.createElement('label');ordLabel.textContent='Ordre d’affichage';
      const ord=document.createElement('input');ord.type='number';ord.min='0';ord.step='1';ord.dataset.role='order';ord.value=w.ordre_sous_saga??i+1;ordLabel.append(ord);
      row.append(title,numLabel,ordLabel);list.append(row);
    });
    if(!works.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='Aucune œuvre directement rattachée à cette saga.';list.append(empty)}
    section.append(list);zone.append(section);
  };

})();