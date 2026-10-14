/* C133 · Export Word des poèmes. Ne modifie aucune donnée. */
(function(){
'use strict';
const xml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&apos;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
const safe=s=>String(s||'Recueil').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,90);
function loadZip(){
 if(window.JSZip)return Promise.resolve(window.JSZip);
 return new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
  script.onload=()=>window.JSZip?resolve(window.JSZip):reject(Error('Bibliothèque ZIP indisponible'));
  script.onerror=()=>reject(Error('Chargement de JSZip impossible. Vérifie la connexion Internet.'));
  document.head.append(script);
 });
}
function paragraph(text,style='Verse',page=false){
 const props='<w:pPr><w:pStyle w:val="'+style+'"/>'+(page?'<w:pageBreakBefore/>':'')+'</w:pPr>';
 return '<w:p>'+props+'<w:r><w:t xml:space="preserve">'+xml(text)+'</w:t></w:r></w:p>';
}
function documentXml(poems,opts){
 let body='';
 if(opts.cover&&opts.work)body+=paragraph(opts.work,'Title');
 poems.forEach((p,i)=>{
  const firstPage=opts.page&&i>0;
  if(opts.titles)body+=paragraph(p.titre,'Heading1',firstPage);
  if(opts.origins&&p.recueil_origine)body+=paragraph('Recueil d’origine : '+p.recueil_origine,'Origin',firstPage&&!opts.titles);
  const lines=String(p.texte||'').replace(/\r\n?/g,'\n').split('\n');
  lines.forEach((line,j)=>{body+=paragraph(line,'Verse',firstPage&&!opts.titles&&!(opts.origins&&p.recueil_origine)&&j===0)});
  if(!opts.page&&i<poems.length-1)body+=paragraph('','Verse');
 });
 return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
 '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+
 '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>';
}
async function createDocx(poems,opts){
 const Zip=await loadZip();const z=new Zip();
 z.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>');
 z.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 z.file('word/_rels/document.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
 z.file('word/document.xml',documentXml(poems,opts));
 z.file('word/styles.xml','<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Garamond" w:hAnsi="Garamond"/><w:sz w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Verse"><w:name w:val="Vers"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="0" w:after="0" w:line="300" w:lineRule="auto"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Titre de poème"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="360" w:after="240"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Titre du recueil"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="480"/></w:pPr><w:rPr><w:b/><w:sz w:val="42"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Origin"><w:name w:val="Recueil origine"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:i/><w:color w:val="777777"/></w:rPr></w:style></w:styles>');
 const blob=await z.generateAsync({type:'blob',compression:'DEFLATE'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=safe(opts.work||'Selection_poemes')+'.docx';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function dialog(){
 const current=document.getElementById('p129-export');current?.remove();
 const el=document.createElement('div');el.id='p129-export';el.className='p129-panel';
 const works=window.poetryExportWorks133||[],active=window.poetryExportActive133||'';
 el.innerHTML='<button class="btn-secondary" onclick="document.getElementById(\'p129-export\').remove()">✕ Fermer</button><h2>📄 Exporter en Word</h2><p>Prépare un manuscrit .docx éditable.</p>'+
 '<label>Recueil<select id="p133-work"><option value="">Tous les poèmes</option>'+works.map(w=>'<option value="'+xml(w.id)+'" '+(w.id===active?'selected':'')+'>'+xml(w.titre)+'</option>').join('')+'</select></label>'+
 '<label>Contenu<select id="p133-scope"><option value="recueil">Tous les poèmes du recueil</option><option value="selection">Uniquement les poèmes cochés</option></select></label>'+
 '<label><input type="checkbox" id="p133-cover" checked> Titre du recueil en première page</label>'+
 '<label><input type="checkbox" id="p133-titles" checked> Afficher les titres des poèmes</label>'+
 '<label><input type="checkbox" id="p133-origins"> Afficher les recueils d’origine</label>'+
 '<label><input type="checkbox" id="p133-page" checked> Commencer chaque poème sur une nouvelle page</label>'+
 '<button class="btn-primary" id="p133-generate">📥 Télécharger le document Word</button><p id="p133-message" role="status"></p>';
 document.body.append(el);el.querySelector('#p133-generate').onclick=generate;
}
async function generate(){
 const el=document.getElementById('p129-export'),btn=el.querySelector('#p133-generate'),msg=el.querySelector('#p133-message');
 const workId=el.querySelector('#p133-work').value,scope=el.querySelector('#p133-scope').value;
 const all=window.poetryExportPoems133||[],links=window.poetryExportLinks133||[],selected=window.poetryExportSelected133||new Set(),works=window.poetryExportWorks133||[];
 if(scope==='recueil'&&!workId){msg.textContent='Sélectionne un recueil pour exporter son contenu complet.';return}
 let chosen=all.filter(p=>scope==='selection'?selected.has(p.id):links.some(l=>l.recueil_id===workId&&l.poeme_id===p.id));
 if(!chosen.length){msg.textContent='Aucun poème à exporter. Vérifie le recueil ou les cases cochées.';return}
 const order=new Map(links.filter(l=>l.recueil_id===workId).map(l=>[l.poeme_id,Number(l.ordre)||0]));
 chosen.sort((a,b)=>workId?((order.get(a.id)||0)-(order.get(b.id)||0)||a.titre.localeCompare(b.titre,'fr')):a.titre.localeCompare(b.titre,'fr'));
 const opts={work:works.find(w=>w.id===workId)?.titre||'',cover:el.querySelector('#p133-cover').checked,titles:el.querySelector('#p133-titles').checked,origins:el.querySelector('#p133-origins').checked,page:el.querySelector('#p133-page').checked};
 btn.disabled=true;msg.textContent='Création du document de '+chosen.length+' poème(s)…';
 try{await createDocx(chosen,opts);msg.textContent=chosen.length+' poème(s) exporté(s).'}catch(e){msg.textContent='Export impossible : '+e.message}finally{btn.disabled=false}
}
window.poetryExport133=dialog;
window.poetryExportSet133=(poems,links,works,selected,active)=>{
 window.poetryExportPoems133=poems;window.poetryExportLinks133=links;window.poetryExportWorks133=works;window.poetryExportSelected133=selected;window.poetryExportActive133=active;
};
})();