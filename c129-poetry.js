/* C129 - Bibliothèque poétique (Passerelle Test) */
(function(){
'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let poems=[],links=[],works=[],selected=new Set(),active='';
const style=document.createElement('style');
style.textContent='.p129{padding:18px 12px}.p129 .tools{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}.p129 input,.p129 select,.p129 textarea{border:1px solid var(--line,#ddd);border-radius:9px;padding:10px;background:var(--card,#fff);color:var(--text,#333);font:inherit}.p129 table{width:100%;border-collapse:collapse}.p129 th,.p129 td{text-align:left;border-bottom:1px solid var(--line,#ddd);padding:12px}.p129 button{cursor:pointer}.p129 .poem-title{border:0;background:none;color:var(--accent,#8262c5);font:inherit;text-decoration:underline}.p129-panel{position:fixed;z-index:100000;right:0;top:0;bottom:0;width:min(540px,96vw);overflow:auto;background:var(--card,#fff);color:var(--text,#333);padding:24px;box-shadow:-8px 0 40px #0003}.p129-panel label{display:grid;gap:5px;margin:12px 0}.p129-panel input:not([type=checkbox]),.p129-panel textarea{width:100%;box-sizing:border-box}.p129-panel textarea{min-height:260px;white-space:pre-wrap;line-height:1.7}.p129-panel .associations{max-height:180px;overflow:auto}.p129-panel .associations label{display:block;margin:5px 0}.p129-panel button{margin:5px}';
document.head.append(style);
const api=()=>db(),user=()=>currentUser.id;
function notify(s){alert(s)}
function csvRows(t){
 t=t.replace(/^\uFEFF/,'');const head=t.split(/\r?\n/,1)[0];const sep=(head.match(/;/g)||[]).length>=(head.match(/,/g)||[]).length?';':',';
 const rows=[];let row=[],field='',quote=false;
 for(let i=0;i<t.length;i++){const c=t[i];if(c==='"'){if(quote&&t[i+1]==='"'){field+='"';i++}else quote=!quote}
 else if(c===sep&&!quote){row.push(field);field=''}
 else if((c==='\r'||c==='\n')&&!quote){if(c==='\r'&&t[i+1]==='\n')i++;row.push(field);if(row.some(v=>v.trim()))rows.push(row);row=[];field=''}
 else field+=c}
 row.push(field);if(row.some(v=>v.trim()))rows.push(row);
 const keys=(rows.shift()||[]).map(v=>v.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/’/g,"'"));
 return rows.map(r=>Object.fromEntries(keys.map((k,i)=>[k,r[i]||''])));
}
function saveBlob(content,name,type){const u=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000)}
window.poetryTemplate129=()=>{const quote=s=>'"'+String(s).replace(/"/g,'""')+'"';saveBlob('\uFEFFTitre;Texte;Recueil d’origine;Œuvre actuelle;Ordre;Date d’écriture;Thème\r\n'+['Exemple','Vers 1\nVers 2\n\nStrophe 2','Recueil initial','','1','',''].map(quote).join(';')+'\r\n','Modele_Import_Poemes_Passerelle.csv','text/csv;charset=utf-8')};
function filtered(){const q=(document.getElementById('p129-search')?.value||'').toLowerCase();const ids=active?new Set(links.filter(x=>x.oeuvre_id===active).map(x=>x.poeme_id)):null;return poems.filter(p=>(!ids||ids.has(p.id))&&(!q||(p.titre+' '+(p.recueil_origine||'')).toLowerCase().includes(q))).sort((a,b)=>active?(links.find(x=>x.oeuvre_id===active&&x.poeme_id===a.id)?.ordre||0)-(links.find(x=>x.oeuvre_id===active&&x.poeme_id===b.id)?.ordre||0):a.titre.localeCompare(b.titre,'fr'))}
window.poetryRefresh129=()=>{const b=document.getElementById('p129-rows');if(!b)return;const list=filtered();b.innerHTML=list.map(p=>'<tr><td><input type="checkbox" '+(selected.has(p.id)?'checked':'')+' onchange="poetrySelect129(\''+p.id+'\',this.checked)"></td><td><button class="poem-title" onclick="poetryOpen129(\''+p.id+'\')">'+E(p.titre)+'</button></td><td>'+E(p.recueil_origine||'')+'</td><td>'+links.filter(x=>x.poeme_id===p.id).map(x=>E(works.find(w=>w.id===x.oeuvre_id)?.titre||'')).join(', ')+'</td></tr>').join('')||'<tr><td colspan="4">Aucun poème.</td></tr>';document.getElementById('p129-count').textContent=list.length+' poème(s)'};
window.poetrySelect129=(id,yes)=>yes?selected.add(id):selected.delete(id);
window.poetryFilter129=v=>{active=v;poetryRefresh129()};
window.poetryClose129=()=>document.getElementById('p129-panel')?.remove();
window.poetryOpen129=id=>{
 const p=poems.find(x=>x.id===id)||{titre:'',texte:'',recueil_origine:'',theme:''};
 const linked=new Set(links.filter(x=>x.poeme_id===id).map(x=>x.oeuvre_id));
 poetryClose129();const panel=document.createElement('div');panel.id='p129-panel';panel.className='p129-panel';
 panel.innerHTML='<button class="btn-secondary" onclick="poetryClose129()">✕ Fermer</button><h2>'+(id?'Modifier le poème':'Nouveau poème')+'</h2><label>Titre<input id="p129-title" value="'+E(p.titre)+'"></label><label>Recueil d’origine<input id="p129-origin" value="'+E(p.recueil_origine||'')+'"></label><label>Thème<input id="p129-theme" value="'+E(p.theme||'')+'"></label><label>Texte (strophes conservées)<textarea id="p129-text"></textarea></label><strong>Recueils et anthologies associés</strong><div class="associations">'+works.map(w=>'<label><input type="checkbox" class="p129-link" value="'+E(w.id)+'" '+(linked.has(w.id)?'checked':'')+'> '+E(w.titre)+'</label>').join('')+'</div><button class="btn-primary" onclick="poetrySave129(\''+id+'\')">Enregistrer</button><button class="btn-secondary" onclick="navigator.clipboard.writeText(document.getElementById(\'p129-text\').value)">Copier le texte</button>';
 document.body.append(panel);document.getElementById('p129-text').value=p.texte||'';
};
window.poetrySave129=async id=>{
 const titre=document.getElementById('p129-title').value.trim();if(!titre)return notify('Titre requis.');
 const data={titre,texte:document.getElementById('p129-text').value,recueil_origine:document.getElementById('p129-origin').value||null,theme:document.getElementById('p129-theme').value||null,user_id:user()};
 const r=id?await api().from('poemes').update(data).eq('id',id).select('id').single():await api().from('poemes').insert(data).select('id').single();
 if(r.error)return notify(r.error.message);
 const pid=r.data.id;const wanted=new Set([...document.querySelectorAll('.p129-link:checked')].map(x=>x.value));
 const old=links.filter(x=>x.poeme_id===pid);const toRemove=old.filter(x=>!wanted.has(x.oeuvre_id));
 for(const l of toRemove){const d=await api().from('poemes_oeuvres').delete().eq('poeme_id',pid).eq('oeuvre_id',l.oeuvre_id);if(d.error)return notify(d.error.message)}
 const toAdd=[...wanted].filter(w=>!old.some(l=>l.oeuvre_id===w)).map(w=>({poeme_id:pid,oeuvre_id:w,user_id:user()}));
 if(toAdd.length){const a=await api().from('poemes_oeuvres').insert(toAdd);if(a.error)return notify(a.error.message)}
 poetryClose129();await renderPoetry129();
};
window.poetryImport129=async file=>{
 if(!file)return;const raw=csvRows(await file.text());
 const items=raw.map(r=>({titre:r.titre||'',texte:r.texte||'',origine:r["recueil d'origine"]||'',oeuvre:r['oeuvre actuelle']||'',ordre:Number(r.ordre)||0,theme:r.theme||'',date:r["date d'ecriture"]||''})).filter(r=>r.titre.trim());
 if(!items.length)return notify('Aucun poème reconnu dans le CSV.');
 const dup=items.filter(x=>poems.some(p=>p.titre.trim().toLowerCase()===x.titre.trim().toLowerCase()));
 const unknown=[...new Set(items.map(x=>x.oeuvre).filter(x=>x&&!works.some(w=>w.titre.toLowerCase()===x.toLowerCase())))];
 if(dup.length||unknown.length){notify('Import interrompu pour éviter les doublons ou les poèmes non rattachés.\nTitres déjà présents : '+dup.map(x=>x.titre).join(', ')+'\nŒuvres inconnues : '+unknown.join(', '));return}
 if(!confirm('Importer '+items.length+' poème(s) en conservant les strophes ?\nExemple : '+items[0].titre+'\n'+items[0].texte.slice(0,250)))return;
 let ok=0;const errs=[];
 for(const x of items){const d={titre:x.titre,texte:x.texte,recueil_origine:x.origine||null,theme:x.theme||null,user_id:user()};if(/^\d{4}-\d{2}-\d{2}$/.test(x.date))d.date_ecriture=x.date;
 const r=await api().from('poemes').insert(d).select('id').single();if(r.error){errs.push(x.titre+': '+r.error.message);continue}
 const w=works.find(w=>w.titre.toLowerCase()===x.oeuvre.toLowerCase());if(w){const a=await api().from('poemes_oeuvres').insert({poeme_id:r.data.id,oeuvre_id:w.id,user_id:user(),ordre:x.ordre});if(a.error)errs.push(x.titre+': association échouée '+a.error.message)}
 ok++}
 notify(ok+' poème(s) importé(s).'+(errs.length?'\n'+errs.join('\n'):''));await renderPoetry129();
};
window.renderPoetry129=async()=>{
 const root=document.getElementById('content');if(!root)return;
 root.innerHTML='<div class="panel">Chargement des poèmes…</div>';
 const [p,l,w]=await Promise.all([api().from('poemes').select('*').order('titre'),api().from('poemes_oeuvres').select('*'),api().from('oeuvres').select('id,titre').order('titre')]);
 const err=p.error||l.error||w.error;if(err){root.innerHTML='<div class="panel">Bibliothèque indisponible : '+E(err.message)+'</div>';return}
 poems=p.data||[];links=l.data||[];works=w.data||[];
 root.innerHTML='<section class="p129"><h1>📜 Bibliothèque poétique</h1><p>Un poème, plusieurs recueils possibles.</p><div class="tools"><button class="btn-primary" onclick="poetryOpen129(\'\')">+ Nouveau poème</button><button class="btn-secondary" onclick="poetryTemplate129()">Modèle CSV</button><label class="btn-secondary">Importer CSV <input type="file" accept=".csv" style="display:none" onchange="poetryImport129(this.files[0]);this.value=\'\'"></label><select onchange="poetryFilter129(this.value)"><option value="">Tous les recueils</option>'+works.map(w=>'<option value="'+E(w.id)+'" '+(active===w.id?'selected':'')+'>'+E(w.titre)+'</option>').join('')+'</select><input id="p129-search" placeholder="Rechercher…" oninput="poetryRefresh129()"><span id="p129-count"></span></div><div class="panel" style="overflow:auto"><table><thead><tr><th>✓</th><th>Poème</th><th>Recueil d’origine</th><th>Présent dans</th></tr></thead><tbody id="p129-rows"></tbody></table></div></section>';
 poetryRefresh129();
};
function mount(){if(document.getElementById('p129-nav'))return;const a=document.getElementById('c121-edl-sidebar');if(!a)return;const b=document.createElement('button');b.id='p129-nav';b.className=a.className;b.textContent='📜 Bibliothèque poétique';b.onclick=()=>navigate('poetry129');a.after(b)}
const previous=navigate;navigate=function(key){if(key==='poetry129'){renderPoetry129();return}return previous(key)};
mount();new MutationObserver(mount).observe(document.documentElement,{subtree:true,childList:true});
})();
