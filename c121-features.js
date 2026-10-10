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
})();
