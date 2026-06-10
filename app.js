const $=id=>document.getElementById(id);let historyStack=[];let mode=localStorage.rw_mode||'road';
const catalog={cummins:{'4376357':{name:'Water Pump',engine:'ISX/X15'},'4309129':{name:'NOx Sensor',engine:'ISX'},'4954200':{name:'Fuel Injector',engine:'ISX'},'2881753':{name:'Turbocharger',engine:'ISX'}},detroit:{'A4722001601':{name:'Water Pump',engine:'DD15'},'A0091530628':{name:'NOx Sensor',engine:'DD15'},'EA4720700587':{name:'Fuel Injector',engine:'DD15'}},paccar:{'2293961':{name:'NOx Sensor',engine:'MX-13'},'1931652':{name:'Turbo Actuator',engine:'MX-13'},'1831541':{name:'Fan Clutch',engine:'MX-13'}},navistar:{'1876105C95':{name:'EGR Valve',engine:'MaxxForce 13'},'3007353C92':{name:'Oil Cooler',engine:'A26'},'1848410C94':{name:'ICP Sensor',engine:'DT466'}}};
function safe(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function money(n){return '$'+Number(n||0).toFixed(2)}function screen(){return document.querySelector('.screen.active')?.id||'home'}function show(id){if(screen()!==id)historyStack.push(screen());document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$(id)?.classList.add('active');$('menu')?.classList.remove('open');scrollTo(0,0);if(id==='clocks')renderClocks();if(id==='customers')renderCustomers();loadSettingsToFields()}function goBack(){let last=historyStack.pop();show(last||'home');historyStack.pop()}function toggleMenu(){$('menu').classList.toggle('open')}function setMode(m){mode=m;localStorage.rw_mode=m;document.querySelectorAll('.mode button').forEach(b=>b.classList.remove('active'));(m==='shop'?$('shopBtn'):$('roadBtn'))?.classList.add('active');$('serviceToggle')&&( $('serviceToggle').checked=m==='road');}
function defaults(){return JSON.parse(localStorage.rw_settings||'{}')}function settings(){return{shop:'Rolling Wrench Diesel LLC',phone:'260-502-6222',web:'www.rollingwrenchdiesel.com',labor:135,service:250,markup:15,tax:7,card:3.5,terms:'Payment due upon completion. Estimate may change if additional work, stuck/broken hardware, wrong parts, or hidden damage is found.',backend:'',...defaults()}}function saveSettings(){let s={shop:$('shopName').value,phone:$('shopPhone').value,web:$('shopWeb').value,labor:+$('setLabor').value,service:+$('setService').value,markup:+$('setMarkup').value,tax:+$('taxRate')?.value||7,card:+$('cardFee')?.value||3.5,terms:$('terms').value,backend:$('backendUrl').value};localStorage.rw_settings=JSON.stringify(s);$('settingsOut').textContent='Settings saved.';loadSettingsToFields()}function resetSettings(){localStorage.removeItem('rw_settings');loadSettingsToFields()}function loadSettingsToFields(){let s=settings();['shopName','shopPhone','shopWeb','setLabor','setService','setMarkup','backendUrl','terms'].forEach(id=>{if(!$(id))return});if($('shopName')){$('shopName').value=s.shop;$('shopPhone').value=s.phone;$('shopWeb').value=s.web;$('setLabor').value=s.labor;$('setService').value=s.service;$('setMarkup').value=s.markup;$('backendUrl').value=s.backend;$('terms').value=s.terms}if($('laborRate')&&!$('laborRate').value)$('laborRate').value=s.labor;if($('serviceCall')&&!$('serviceCall').value)$('serviceCall').value=s.service;if($('markup')&&!$('markup').value)$('markup').value=s.markup;if($('taxRate')&&!$('taxRate').value)$('taxRate').value=s.tax;if($('cardFee')&&!$('cardFee').value)$('cardFee').value=s.card}
async function decodeVin(){let vin=$('vinInput').value.trim().toUpperCase();if(!vin)return alert('Enter VIN or unit number.');$('vinOut').textContent='Decoding VIN...';try{let r=await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/'+encodeURIComponent(vin)+'?format=json');let j=await r.json();let d=j.Results?.[0]||{};let txt=`VIN/Unit: ${vin}\nYear: ${d.ModelYear||'Not returned'}\nMake: ${d.Make||'Not returned'}\nModel: ${d.Model||'Not returned'}\nEngine: ${d.EngineModel||d.EngineManufacturer||'Choose manually if blank'}\nNote: Heavy truck engine/trans may need manual confirmation.`;$('vinOut').textContent=txt;localStorage.rw_unit=JSON.stringify({vin,year:d.ModelYear||'',make:d.Make||'',model:d.Model||'',engine:d.EngineModel||''});updateUnitBar()}catch(e){$('vinOut').textContent='VIN decode failed. Saved as unit only. '+e.message;localStorage.rw_unit=JSON.stringify({vin});updateUnitBar()}}function saveUnit(){let vin=$('vinInput').value.trim().toUpperCase();localStorage.rw_unit=JSON.stringify({vin});updateUnitBar();$('vinOut').textContent='Unit saved.'}function clearVin(){$('vinInput').value='';$('vinOut').textContent='Cleared.';localStorage.removeItem('rw_unit');updateUnitBar()}function updateUnitBar(){let u=JSON.parse(localStorage.rw_unit||'{}');$('unitBar').textContent=u.vin?`${u.vin} ${u.year||''} ${u.make||''} ${u.model||''}`:'No truck selected';if($('iUnit'))$('iUnit').value=u.vin||''}
function lookupPart(){let q=$('partQ').value.trim();if(!q)return alert('Enter a part search.');let hits=[];let Q=q.toUpperCase();for(let brand in catalog){for(let num in catalog[brand]){let p=catalog[brand][num];if(Q.includes(num)||Q.includes(p.name.toUpperCase())||Q.includes((p.engine||'').toUpperCase().split('/')[0]))hits.push({brand,num,...p})}}let out=hits.length?hits.map(h=>`${h.brand.toUpperCase()}\nPart #: ${h.num}\nName: ${h.name}\nEngine: ${h.engine}\nConfidence: local match, verify by VIN/ESN/CPL`).join('\n\n'):'No local catalog hit. Use supplier web buttons and backend if connected.';let s=settings();if(s.backend)out+='\n\nBackend URL saved. Full backend search can be wired to: '+s.backend;$('partsOut').textContent=out;localStorage.rw_last_part=q}function supplierSearch(type){let q=encodeURIComponent($('partQ')?.value||$('supplierPart')?.value||localStorage.rw_last_part||'heavy duty truck parts');let urls={google:`https://www.google.com/search?q=${q}`,fleetpride:`https://www.google.com/search?q=site%3Afleetpride.com+${q}`,napa:`https://www.google.com/search?q=site%3Anapaonline.com+${q}`,truckpro:`https://www.google.com/search?q=site%3Atruckpro.com+${q}`};open(urls[type]||urls.google,'_blank')}function addPartToQuote(){let q=$('partQ').value.trim()||localStorage.rw_last_part||'Part';$('workDesc').value=($('workDesc').value+'\nParts lookup: '+q).trim();show('quote')}function clearParts(){$('partQ').value='';$('partsOut').textContent='Cleared.'}
function presetJob(){let v=$('jobPreset').value;let hrs={Diagnostic:1,'Aftertreatment Diagnosis':2,'Roadside Repair':2,'PM Service':2,'Brake Job':5,'Clutch Job':11,'Water Pump':3.5,Custom:1};$('laborHours').value=hrs[v]||1;$('workDesc').value=v==='Custom'?'':v+' labor and related repair work.'}function calcQuoteData(){let s=settings();let h=+$('laborHours').value||0,r=+$('laborRate').value||s.labor,svc=$('serviceToggle').checked?(+$('serviceCall').value||s.service):0,parts=+$('partsCost').value||0,markup=+$('markup').value||0,partsSell=parts*(1+markup/100),labor=h*r,tax=$('taxToggle').checked?partsSell*((+$('taxRate').value||0)/100):0,sub=labor+svc+partsSell+tax,card=$('cardToggle').checked?sub*((+$('cardFee').value||0)/100):0,total=sub+card;return{h,r,svc,parts,markup,partsSell,labor,tax,card,total}}function buildQuote(){let d=calcQuoteData(),s=settings();let txt=`${s.shop}\n${s.phone}\n${s.web}\n\nQUOTE FOR: ${$('qCustomer').value||'Customer'}\nMODE: ${mode.toUpperCase()}\n\nWORK:\n${$('workDesc').value||'Repair work as discussed.'}\n\nLabor: ${d.h} hrs x ${money(d.r)} = ${money(d.labor)}\nService Call: ${money(d.svc)}\nParts Cost: ${money(d.parts)}\nParts Markup: ${d.markup}%\nParts Sell: ${money(d.partsSell)}\nTax: ${money(d.tax)}\nCard Fee: ${money(d.card)}\n\nTOTAL ESTIMATE: ${money(d.total)}\n\nTerms: ${s.terms}`;$('quoteOut').textContent=txt;$('iCustomer').value=$('qCustomer').value;$('invoiceNotes').value=txt;localStorage.rw_last_quote=txt;return txt}function sendQuoteText(){let txt=buildQuote();location.href='sms:?&body='+encodeURIComponent(txt)}function clearQuote(){['qCustomer','laborHours','partsCost','workDesc'].forEach(id=>$(id).value='');$('quoteOut').textContent='Cleared.';loadSettingsToFields()}function proWrite(id){let el=$(id);let t=el.value.trim();if(!t)t='Repair work performed as requested.';el.value=`Customer requested service. Technician inspected the unit, verified the concern, performed diagnostic/repair steps as needed, and documented parts/labor required. Notes: ${t}`}
function buildInvoice(){let s=settings();let q=localStorage.rw_last_quote||$('invoiceNotes').value||buildQuote();let txt=`${s.shop}\n${s.phone}\n${s.web}\n\nINVOICE\nCustomer: ${$('iCustomer').value||$('qCustomer').value||''}\nPhone: ${$('iPhone').value||''}\nUnit: ${$('iUnit').value||JSON.parse(localStorage.rw_unit||'{}').vin||''}\n\n${q}\n\nCustomer approval/signature: ______________________\nDate: ${new Date().toLocaleDateString()}`;$('invoiceOut').textContent=txt;return txt}function textInvoice(){let txt=buildInvoice();location.href='sms:'+($('iPhone').value||'')+'?&body='+encodeURIComponent(txt)}function clearInvoice(){['iCustomer','iPhone','iUnit','invoiceNotes'].forEach(id=>$(id).value='');$('invoiceOut').textContent='Cleared.'}function copyText(id){navigator.clipboard?.writeText($(id).textContent||$(id).value||'');alert('Copied.')}
function calcFinance(){let rent=+$('rent').value||0,ins=+$('insurance').value||0,elec=+$('electric').value||0,other=+$('otherExpense').value||0,labor=+$('laborRevenue').value||0,partsRev=+$('partsRevenue').value||0,partsCost=+$('partsActualCost').value||0,over=rent+ins+elec+other,gross=labor+partsRev,partsProfit=partsRev-partsCost,net=gross-partsCost-over,rate=settings().labor||135,breakH=over/rate;$('financeOut').innerHTML=`Monthly Overhead: ${money(over)}\nGross Revenue: ${money(gross)}\nParts Profit: ${money(partsProfit)}\nNet After Overhead: ${money(net)}\nBreak-even labor hours/month at ${money(rate)}/hr: ${breakH.toFixed(1)} hrs\nBreak-even labor hours/week: ${(breakH/4.33).toFixed(1)} hrs`}
function clearFinance(){['otherExpense','laborRevenue','partsRevenue','partsActualCost'].forEach(id=>$(id).value=0);$('financeOut').textContent='Cleared.'}
function clocks(){return JSON.parse(localStorage.rw_clocks||'[{"name":"Job A","elapsed":0},{"name":"Job B","elapsed":0},{"name":"Job C","elapsed":0}]')}function saveClocks(c){localStorage.rw_clocks=JSON.stringify(c)}function startClock(i){let c=clocks();if(!c[i].running){c[i].running=true;c[i].paused=false;c[i].start=Date.now()}saveClocks(c);renderClocks()}function pauseClock(i){let c=clocks(),x=c[i];if(x.running&&!x.paused){x.elapsed+=(Date.now()-x.start);x.paused=true;x.running=false}saveClocks(c);renderClocks()}function resumeClock(i){startClock(i)}function stopClock(i){pauseClock(i)}function resetClock(i){let c=clocks();c[i]={name:c[i].name,elapsed:0};saveClocks(c);renderClocks()}function clockHours(i){let x=clocks()[i],ms=x.elapsed||0;if(x.running)ms+=Date.now()-x.start;return ms/36e5}function sendClock(i){$('laborHours').value=clockHours(i).toFixed(2);show('quote')}function renderClocks(){let c=clocks();$('clockCards').innerHTML=c.map((x,i)=>`<div class="clockCard"><div class="clockTop"><b>${x.name}</b><span>${clockHours(i).toFixed(2)} hrs</span></div><input value="${safe(x.name)}" onchange="let c=clocks();c[${i}].name=this.value;saveClocks(c);renderClocks()"><div class="clockBtns"><button onclick="startClock(${i})">Start</button><button onclick="pauseClock(${i})">Pause</button><button onclick="resumeClock(${i})">Resume</button><button onclick="stopClock(${i})">Stop</button><button onclick="sendClock(${i})">Invoice</button></div><button class="dark" onclick="resetClock(${i})">Reset</button></div>`).join('')}function resetAllClocks(){if(confirm('Reset all clocks?')){localStorage.removeItem('rw_clocks');renderClocks()}}setInterval(()=>{if(screen()==='clocks')renderClocks()},30000)
$('ocrFile')?.addEventListener('change',e=>{let f=e.target.files[0];if(!f)return;$('ocrPreview').src=URL.createObjectURL(f);$('ocrPreview').style.display='block'});async function scanOCR(){let f=$('ocrFile').files[0];if(!f)return alert('Add a photo first.');$('ocrOut').textContent='Reading photo...';try{if(!window.Tesseract)throw Error('OCR library not loaded');let r=await Tesseract.recognize(f,'eng');$('ocrRaw').value=r.data.text;$('ocrOut').textContent='OCR done. Tap PULL INFO.';parseOCR()}catch(e){$('ocrOut').textContent='OCR failed: '+e.message}}function parseOCR(){let t=$('ocrRaw').value.toUpperCase();let nums=[...(t.match(/\b[A-Z]{0,4}\d{4,8}[A-Z]{0,3}\b/g)||[])];let prices=[...(t.match(/\$?\s?\d+\.\d{2}/g)||[])].map(x=>x.replace(/[$\s]/g,''));$('ocrPart').value=nums[0]||'';$('ocrPrice').value=prices[prices.length-1]||'';$('ocrVendor').value=(t.match(/FLEETPRIDE|NAPA|TRUCKPRO|OREILLY|O'REILLY|CUMMINS|PETERBILT|KENWORTH|FREIGHTLINER/)||[''])[0];$('ocrOut').textContent=`Vendor: ${$('ocrVendor').value||'unknown'}\nPart: ${$('ocrPart').value||'not found'}\nPrice: ${$('ocrPrice').value||'not found'}\nVerify before adding to quote.`}function addOCRToQuote(){let part=$('ocrPart').value,price=+$('ocrPrice').value||0,v=$('ocrVendor').value;$('partQ').value=part;$('partsCost').value=((+$('partsCost').value||0)+price).toFixed(2);$('workDesc').value=($('workDesc').value+`\nPart ${part} from ${v}: ${money(price)}`).trim();show('quote')}function clearOCR(){['ocrRaw','ocrVendor','ocrPart','ocrPrice'].forEach(id=>$(id).value='');$('ocrOut').textContent='Cleared.';$('ocrPreview').style.display='none'}
function saveCustomer(){let list=JSON.parse(localStorage.rw_customers||'[]');list.unshift({name:$('cName').value,phone:$('cPhone').value,unit:$('cUnit').value,notes:$('cNotes').value,date:new Date().toLocaleString()});localStorage.rw_customers=JSON.stringify(list.slice(0,100));renderCustomers()}function renderCustomers(){let list=JSON.parse(localStorage.rw_customers||'[]');$('customersOut').innerHTML=list.length?list.map(c=>`${safe(c.name)} | ${safe(c.phone)} | ${safe(c.unit)}\n${safe(c.notes)}\n${safe(c.date)}`).join('\n\n---\n\n'):'No saved customers yet.'}function clearCustomerForm(){['cName','cPhone','cUnit','cNotes'].forEach(id=>$(id).value='')} 
if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});window.addEventListener('DOMContentLoaded',()=>{loadSettingsToFields();setMode(mode);updateUnitBar();renderClocks();});

/* =========================================================
   ROLLING WRENCH AI CONNECTED BACKEND PACK
   Render + Supabase wiring added after base app.
   ========================================================= */
const RW_RENDER_BACKEND_DEFAULT = "https://rolling-wrench-ai-backend.onrender.com";
const RW_SUPABASE_URL = "https://uxpkqwcmvtqvubibbrek.supabase.co";
const RW_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cGtxd2NtdnRxdnViaWJicmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMzk4NjQsImV4cCI6MjA5MjgxNTg2NH0.afiaSFqkRFEXW5nPQVRXKZcpKkS6iF3T_hTQC2P15HQ";
const rwSupabase = window.supabase ? window.supabase.createClient(RW_SUPABASE_URL, RW_SUPABASE_ANON_KEY) : null;

function settings(){
  return {
    shop:'Rolling Wrench Diesel LLC',
    phone:'260-502-6222',
    web:'www.rollingwrenchdiesel.com',
    labor:135,
    service:250,
    markup:15,
    tax:7,
    card:3.5,
    terms:'Payment due upon completion. Estimate may change if additional work, stuck/broken hardware, wrong parts, or hidden damage is found.',
    backend:RW_RENDER_BACKEND_DEFAULT,
    supabaseUrl:RW_SUPABASE_URL,
    ...defaults()
  };
}

function rwUnit(){try{return JSON.parse(localStorage.rw_unit||'{}')}catch(e){return {}}}
function rwVehicleContext(){
  const u=rwUnit();
  return `Active unit: ${u.vin||'none'} | Year: ${u.year||''} | Make: ${u.make||''} | Model: ${u.model||''} | Engine: ${u.engine||''} | Mode: ${mode}`;
}
function backendBase(){return (settings().backend||RW_RENDER_BACKEND_DEFAULT).replace(/\/+$/,'')}
function authHeaders(){return {"Content-Type":"application/json","apikey":RW_SUPABASE_ANON_KEY,"Authorization":"Bearer "+RW_SUPABASE_ANON_KEY}}
async function rwApiPost(path,payload){
  const url=backendBase()+path;
  const res=await fetch(url,{method:'POST',headers:authHeaders(),body:JSON.stringify(payload||{})});
  const text=await res.text();
  let data; try{data=JSON.parse(text)}catch(e){data={raw:text}}
  if(!res.ok) throw new Error((data&&data.error)||data.message||text||('HTTP '+res.status));
  return data;
}
async function rwApiGet(path){
  const res=await fetch(backendBase()+path,{headers:authHeaders()});
  const text=await res.text();
  let data; try{data=JSON.parse(text)}catch(e){data={raw:text}}
  if(!res.ok) throw new Error((data&&data.error)||data.message||text||('HTTP '+res.status));
  return data;
}
function humanJson(data){
  if(!data) return 'No data returned.';
  if(typeof data==='string') return data;
  if(data.answer) return data.answer;
  if(data.message) return data.message;
  if(data.result && typeof data.result==='string') return data.result;
  if(Array.isArray(data.results)) return data.results.map((x,i)=>`#${i+1}\n${humanJson(x)}`).join('\n\n');
  if(Array.isArray(data.items)) return data.items.map((x,i)=>`#${i+1}\n${humanJson(x)}`).join('\n\n');
  if(data.data && typeof data.data==='object') return humanJson(data.data);
  return JSON.stringify(data,null,2);
}
function localCatalogSearch(q){
  let hits=[],Q=String(q||'').toUpperCase();
  for(let brand in catalog){for(let num in catalog[brand]){let p=catalog[brand][num];
    if(Q.includes(num)||Q.includes(p.name.toUpperCase())||Q.includes((p.engine||'').toUpperCase().split('/')[0])) hits.push({brand,num,...p});
  }}
  return hits;
}

async function testBackendConnection(){
  const out=$('settingsOut')||$('homeHelp');
  out.textContent='Testing Render backend...';
  try{
    const root=await rwApiGet('/');
    let health='';
    try{health='\n\n/api/health:\n'+humanJson(await rwApiGet('/api/health'))}catch(e){health='\n\n/api/health not available: '+e.message}
    out.textContent='BACKEND CONNECTED ✅\n'+humanJson(root)+health;
  }catch(e){out.textContent='BACKEND FAILED ❌\n'+e.message+'\nCheck Render URL and CORS.';}
}
async function testSupabaseConnection(){
  const out=$('settingsOut')||$('homeHelp');
  out.textContent='Testing Supabase...';
  try{
    const res=await fetch(RW_SUPABASE_URL+'/rest/v1/',{headers:{apikey:RW_SUPABASE_ANON_KEY,Authorization:'Bearer '+RW_SUPABASE_ANON_KEY}});
    out.textContent=res.ok?'SUPABASE CONNECTED ✅\nProject: '+RW_SUPABASE_URL:'SUPABASE RESPONDED BUT FAILED ❌ HTTP '+res.status;
  }catch(e){out.textContent='SUPABASE FAILED ❌\n'+e.message;}
}
async function cloudInsert(table,row){
  if(!rwSupabase) throw new Error('Supabase JS not loaded.');
  const {data,error}=await rwSupabase.from(table).insert(row).select().limit(1);
  if(error) throw error;
  return data;
}
async function cloudSaveSafe(table,row){
  try{return await cloudInsert(table,row)}catch(e){console.warn('Cloud save skipped for '+table,e.message);return null;}
}

async function lookupPart(){
  let q=$('partQ').value.trim();
  if(!q) return alert('Enter a part search.');
  $('partsOut').textContent='Searching local catalog + Render backend...';
  const hits=localCatalogSearch(q);
  let local=hits.length?hits.map(h=>`${h.brand.toUpperCase()}\nPart #: ${h.num}\nName: ${h.name}\nEngine: ${h.engine}\nConfidence: local match, verify by VIN/ESN/CPL`).join('\n\n'):'No local catalog hit.';
  let backend='';
  const payload={query:q,part_query:q,question:q,vehicleContext:rwVehicleContext(),mode:'parts_lookup',source:'rolling_wrench_ai_frontend'};
  try{ backend='\n\nRENDER /api/parts ✅\n'+humanJson(await rwApiPost('/api/parts',payload)); }
  catch(e1){
    try{ backend='\n\nRENDER /api/search ✅\n'+humanJson(await rwApiPost('/api/search',payload)); }
    catch(e2){ backend=`\n\nBackend parts search failed. Local/supplier lookup still works.\n/api/parts: ${e1.message}\n/api/search: ${e2.message}`; }
  }
  $('partsOut').textContent=local+backend+'\n\nSupplier buttons open real-world web searches.';
  localStorage.rw_last_part=q;
}

async function askRWAI(){
  const q=$('aiQ').value.trim();
  const notes=$('aiNotes').value.trim();
  if(!q) return alert('Ask Rolling Wrench AI a question first.');
  $('aiOut').textContent='Sending to Render backend AI...';
  const payload={question:q,query:q,notes,vehicleContext:rwVehicleContext(),mode:'diesel_ai',source:'rolling_wrench_ai_frontend'};
  try{$('aiOut').textContent='RENDER /api/ai ✅\n'+humanJson(await rwApiPost('/api/ai',payload));}
  catch(e1){
    try{$('aiOut').textContent='RENDER /api/search ✅\n'+humanJson(await rwApiPost('/api/search',payload));}
    catch(e2){$('aiOut').textContent=`Backend AI failed.\n/api/ai: ${e1.message}\n/api/search: ${e2.message}\n\nFallback: Verify VIN/engine, search parts/suppliers, then build quote.`;}
  }
}
function sendAIToQuote(){
  const text=($('aiOut')?.textContent||'').trim();
  $('workDesc').value=($('workDesc').value+'\nAI notes: '+text.slice(0,1000)).trim();
  show('quote');
}
function clearAI(){['aiQ','aiNotes'].forEach(id=>$(id).value='');$('aiOut').textContent='Cleared.';}

const rwOriginalParseOCR=parseOCR;
async function parseOCRConnected(){
  rwOriginalParseOCR();
  const raw=$('ocrRaw').value||'';
  if(!raw.trim()) return;
  $('ocrOut').textContent += '\n\nSending OCR text to Render vision parser...';
  const payload={mode:'receipt_or_part_ocr',scan_type:$('ocrType').value,raw_text:raw,vehicleContext:rwVehicleContext(),local_extract:{vendor:$('ocrVendor').value,part_number:$('ocrPart').value,price:$('ocrPrice').value}};
  try{
    const data=await rwApiPost('/api/vision',payload);
    const d=data.data||data.result||data;
    const part=d.part_number||d.part||d.oem_part||d.partNumber;
    const price=d.price||d.cost||d.amount||d.unit_price;
    const vendor=d.vendor||d.supplier||d.store;
    if(part) $('ocrPart').value=part;
    if(price) $('ocrPrice').value=String(price).replace(/[^0-9.]/g,'');
    if(vendor) $('ocrVendor').value=vendor;
    $('ocrOut').textContent='OCR + BACKEND PARSE ✅\n'+humanJson(data)+'\n\nVerify vendor/part/price before adding to quote.';
    await cloudSaveSafe('ocr_results',{raw_text:raw,vendor:$('ocrVendor').value,part_number:$('ocrPart').value,price:Number($('ocrPrice').value||0),scan_type:$('ocrType').value,vehicle:rwUnit()});
  }catch(e){
    $('ocrOut').textContent += '\n\nBackend vision parser failed, local OCR values kept. '+e.message;
  }
}

const rwOriginalDecodeVin=decodeVin;
async function decodeVin(){
  await rwOriginalDecodeVin();
  const u=rwUnit();
  await cloudSaveSafe('trucks',{vin:u.vin||$('vinInput').value.trim().toUpperCase(),year:u.year||null,make:u.make||null,model:u.model||null,engine:u.engine||null,notes:'Saved from Rolling Wrench AI VIN screen'});
}

const rwOriginalBuildQuote=buildQuote;
function buildQuote(){
  const txt=rwOriginalBuildQuote();
  const d=calcQuoteData();
  cloudSaveSafe('quotes',{customer:$('qCustomer').value||null,unit:rwUnit(),mode,total:d.total,labor_hours:d.h,labor_rate:d.r,parts_cost:d.parts,parts_sell:d.partsSell,service_call:d.svc,quote_text:txt});
  rwApiPost('/api/quotes',{quote_text:txt,customer:$('qCustomer').value,unit:rwUnit(),totals:d,vehicleContext:rwVehicleContext()}).catch(e=>console.warn('Render quote save skipped',e.message));
  return txt;
}
const rwOriginalBuildInvoice=buildInvoice;
function buildInvoice(){
  const txt=rwOriginalBuildInvoice();
  cloudSaveSafe('invoices',{customer:$('iCustomer').value||$('qCustomer').value||null,phone:$('iPhone').value||null,unit:$('iUnit').value||rwUnit().vin||null,invoice_text:txt,total:calcQuoteData().total});
  rwApiPost('/api/invoices',{invoice_text:txt,customer:$('iCustomer').value,phone:$('iPhone').value,unit:$('iUnit').value,vehicleContext:rwVehicleContext()}).catch(e=>console.warn('Render invoice save skipped',e.message));
  return txt;
}
const rwOriginalSaveCustomer=saveCustomer;
function saveCustomer(){
  rwOriginalSaveCustomer();
  cloudSaveSafe('customers',{name:$('cName').value,phone:$('cPhone').value,notes:$('cNotes').value});
  cloudSaveSafe('trucks',{vin:$('cUnit').value,customer_name:$('cName').value,notes:$('cNotes').value});
}

// Keep backend setting filled with the real Render URL on fresh load.
window.addEventListener('DOMContentLoaded',()=>{
  if($('backendUrl') && !$('backendUrl').value) $('backendUrl').value=RW_RENDER_BACKEND_DEFAULT;
});
