// ============================================================
// CONFIG
// ============================================================
const CFG = {
  ALLOWED: ["gusjsierra@gmail.com","gabynacoud@gmail.com"],
  KEY: "AIzaSyDu0YLxIpEopSoD9fEL3ykqDVslfEj_1X8",
  CLIENT_ID: "715701428085-ouqraaqrh6s4qb9ho7mtec3h57u08fhn.apps.googleusercontent.com",
  SCOPE: "https://www.googleapis.com/auth/spreadsheets",
  SHEETS: {
    remo:     "1fKhYBwGe0moSmVordD6iTSeQ9VmNN-sOS7QExgQ1aks",
    hogar:    "1B47HwmB8-tlvCx4SHcqQosmHuJNBlVmcOzMH0RJv1UY",
    finanzas: "1eI4sE2R9cGt8M7UyHXvNge7v2JxQQFokoCNDJ5ivvbI",
    compras:  "1kNiQRb6HDHWOfORPcSVMCZ1GR7sKPJh_Kw72k_-fv9Y"
  }
};

// ============================================================
// STATE
// ============================================================
var USER = null, ACCESS_TOKEN = null;
var DATA = {remo:[],tareas:[],gastos:[],tcs:[],comp:[],desp:[]};
var EDIT = {sheetId:null,tab:null,rowIndex:null,fields:null,isNew:false,headers:null};

// ============================================================
// AUTH — Google Identity Services (id_token + OAuth popup)
// ============================================================
function handleGoogleLogin(r) {
  var p = JSON.parse(atob(r.credential.split('.')[1]));
  if (!CFG.ALLOWED.includes(p.email)) {
    document.getElementById('auth-err').style.display = 'block';
    document.getElementById('auth-err').textContent = 'Acceso denegado: ' + p.email;
    return;
  }
  USER = p;
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  var av = document.getElementById('nav-avatar');
  if (p.picture) { av.src = p.picture; av.style.display = 'block'; }
  document.getElementById('nav-user').textContent = p.given_name || p.email;
  // Request OAuth token for write access
  requestOAuthToken();
}

function requestOAuthToken() {
  var client = google.accounts.oauth2.initTokenClient({
    client_id: CFG.CLIENT_ID,
    scope: CFG.SCOPE,
    callback: function(res) {
      if (res.access_token) {
        ACCESS_TOKEN = res.access_token;
        loadAllData();
      }
    }
  });
  client.requestAccessToken({prompt: ''});
}

function logout() {
  USER = null; ACCESS_TOKEN = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
}

// ============================================================
// NAV
// ============================================================
function showPage(id) {
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
  document.querySelectorAll('.nav-btn').forEach(function(b){b.classList.remove('active')});
  document.getElementById('page-'+id).classList.add('active');
  event.currentTarget.classList.add('active');
}

// ============================================================
// SHEETS READ
// ============================================================
function fetchSheet(sheetId, tab) {
  var url = 'https://sheets.googleapis.com/v4/spreadsheets/'+sheetId+'/values/'+encodeURIComponent(tab)+'?key='+CFG.KEY;
  return fetch(url).then(function(r){return r.json();}).then(function(d){
    var rows = d.values || [];
    if (rows.length < 2) return [];
    var headers = rows[0];
    return rows.slice(1).map(function(row, i) {
      var obj = {_row: i + 2}; // 1-indexed, +1 for header row
      headers.forEach(function(h, j){ obj[h] = row[j] || ''; });
      return obj;
    });
  }).catch(function(){ return []; });
}

function loadAllData() {
  Promise.all([
    fetchSheet(CFG.SHEETS.remo,     'Proyectos_Maestro'),
    fetchSheet(CFG.SHEETS.hogar,    'Tareas'),
    fetchSheet(CFG.SHEETS.finanzas, 'Gastos'),
    fetchSheet(CFG.SHEETS.finanzas, 'Tarjetas_de_Credito'),
    fetchSheet(CFG.SHEETS.compras,  'Articulos'),
    fetchSheet(CFG.SHEETS.hogar,    'Despensa')
  ]).then(function(res){
    DATA.remo   = res[0];
    DATA.tareas = res[1];
    DATA.gastos = res[2];
    DATA.tcs    = res[3];
    DATA.comp   = res[4];
    DATA.desp   = res[5];
    renderAll();
  });
}

// ============================================================
// SHEETS WRITE
// ============================================================
function writeRow(sheetId, tab, rowIndex, headers, values) {
  if (!ACCESS_TOKEN) { toast('Sin token de escritura. Recarga e inicia sesión.', 'err'); return Promise.reject(); }
  var range = encodeURIComponent(tab + '!' + rowIndex + ':' + rowIndex);
  var url = 'https://sheets.googleapis.com/v4/spreadsheets/' + sheetId + '/values/' + range + '?valueInputOption=USER_ENTERED&access_token=' + ACCESS_TOKEN;
  var body = { values: [headers.map(function(h){ return values[h] || ''; })] };
  return fetch(url, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
    .then(function(r){ return r.json(); });
}

function appendRow(sheetId, tab, headers, values) {
  if (!ACCESS_TOKEN) { toast('Sin token de escritura. Recarga e inicia sesión.', 'err'); return Promise.reject(); }
  var range = encodeURIComponent(tab + '!A1');
  var url = 'https://sheets.googleapis.com/v4/spreadsheets/' + sheetId + '/values/' + range + ':append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS&access_token=' + ACCESS_TOKEN;
  var body = { values: [headers.map(function(h){ return values[h] || ''; })] };
  return fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
    .then(function(r){ return r.json(); });
}

// ============================================================
// RENDER HELPERS
// ============================================================
function fmt(v) {
  var n = parseFloat((v||'').toString().replace(/[^0-9.\-]/g,''));
  return isNaN(n) ? (v||'—') : '$'+n.toLocaleString('es-MX',{minimumFractionDigits:0,maximumFractionDigits:0});
}
function bdg(txt, color) {
  return '<span class="badge" style="background:'+color+'22;color:'+color+'">'+(txt||'—')+'</span>';
}
function ec(s) { return (s||'').includes('Completo')||s==='✅'?'#4ade80':(s||'').includes('Proceso')||s==='🔄'?'#fbbf24':'#94a3b8'; }
function pc(p) { return p==='Alta'?'#f87171':p==='Baja'?'#4ade80':'#60a5fa'; }

// ============================================================
// RENDER ALL
// ============================================================
function renderAll() {
  renderDashboard();
  renderRemo();
  renderFamiliar();
  renderFinanzas();
  renderCompras();
  renderNutricion();
}

function renderDashboard() {
  var tot = DATA.remo.length;
  var comp = DATA.remo.filter(function(r){return (r['Estado']||'').includes('Completo');}).length;
  var pend = DATA.tareas.filter(function(t){return !(t['Estado']||'').includes('Completo');}).length;
  var gasto = DATA.gastos.reduce(function(s,g){return s+(parseFloat((g['Monto MXN']||'0').replace(/[^0-9.]/g,''))||0);},0);
  var deuda = DATA.tcs.reduce(function(s,t){return s+(parseFloat((t['Saldo Actual']||'0').replace(/[^0-9.]/g,''))||0);},0);
  document.getElementById('dash-metrics').innerHTML = [
    ['🔨 Proyectos Remo', tot + ' total', '#60a5fa'],
    ['✅ Completados', comp + ' / ' + tot, '#4ade80'],
    ['📋 Tareas Pendientes', pend, '#fbbf24'],
    ['💸 Gastos Mes', fmt(gasto), '#f87171'],
    ['💳 Deuda TCs', fmt(deuda), '#f87171'],
    ['🛒 Artículos Pipeline', DATA.comp.length, '#a78bfa']
  ].map(function(m){
    return '<div class="metric"><div class="metric-label">'+m[0]+'</div><div class="metric-val" style="color:'+m[2]+'">'+m[1]+'</div></div>';
  }).join('');
}

function renderRemo() {
  var rows = DATA.remo;
  var hdrs = ['Área','Proyecto','Etapa Actual','Estado','Prioridad','Presupuesto MXN','Real MXN'];
  document.getElementById('remo-tbody').innerHTML = rows.length === 0
    ? '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:20px">Sin proyectos registrados</td></tr>'
    : rows.map(function(r, i){
      return '<tr>'
        + td(r,'Área',i,'remo','Proyectos_Maestro',CFG.SHEETS.remo,rows)
        + td(r,'Proyecto',i,'remo','Proyectos_Maestro',CFG.SHEETS.remo,rows)
        + td(r,'Etapa Actual',i,'remo','Proyectos_Maestro',CFG.SHEETS.remo,rows)
        + '<td>'+bdg(r['Estado'],ec(r['Estado']))+'</td>'
        + '<td>'+bdg(r['Prioridad'],pc(r['Prioridad']))+'</td>'
        + '<td style="color:#94a3b8">'+fmt(r['Presupuesto MXN'])+'</td>'
        + '<td style="color:#4ade80">'+fmt(r['Real MXN'])+'</td>'
        + '<td><button class="btn-sm btn-edit" onclick="openEditModal(\'remo\','+i+')">✏️</button></td>'
        + '</tr>';
    }).join('');
}

function renderFamiliar() {
  var rows = DATA.tareas;
  document.getElementById('fam-tbody').innerHTML = rows.length === 0
    ? '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:20px">Sin tareas registradas</td></tr>'
    : rows.map(function(r, i){
      return '<tr>'
        + td(r,'Tarea',i,'tareas','Tareas',CFG.SHEETS.hogar,rows)
        + td(r,'Responsable',i,'tareas','Tareas',CFG.SHEETS.hogar,rows)
        + '<td>'+bdg(r['Estado'],ec(r['Estado']))+'</td>'
        + '<td>'+bdg(r['Prioridad'],pc(r['Prioridad']))+'</td>'
        + '<td style="color:#94a3b8">'+(r['Fecha Límite']||'—')+'</td>'
        + td(r,'Notas',i,'tareas','Tareas',CFG.SHEETS.hogar,rows)
        + '<td><button class="btn-sm btn-edit" onclick="openEditModal(\'tareas\','+i+')">✏️</button></td>'
        + '</tr>';
    }).join('');
}

function renderFinanzas() {
  var gastos = DATA.gastos, tcs = DATA.tcs;
  var totalGasto = gastos.reduce(function(s,g){return s+(parseFloat((g['Monto MXN']||'').replace(/[^0-9.]/g,''))||0);},0);
  var totalTC = tcs.reduce(function(s,t){return s+(parseFloat((t['Saldo Actual']||'').replace(/[^0-9.]/g,''))||0);},0);
  document.getElementById('fin-metrics').innerHTML = [
    ['Total Gastos',fmt(totalGasto),'#f87171'],
    ['Deuda Total TCs',fmt(totalTC),'#fbbf24'],
    ['# Tarjetas',tcs.length,'#60a5fa']
  ].map(function(m){
    return '<div class="metric"><div class="metric-label">'+m[0]+'</div><div class="metric-val" style="color:'+m[2]+'">'+m[1]+'</div></div>';
  }).join('');

  document.getElementById('fin-tbody').innerHTML = gastos.length === 0
    ? '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:20px">Sin gastos registrados</td></tr>'
    : gastos.map(function(r, i){
      return '<tr>'
        + td(r,'Fecha',i,'gastos','Gastos',CFG.SHEETS.finanzas,gastos)
        + td(r,'Concepto',i,'gastos','Gastos',CFG.SHEETS.finanzas,gastos)
        + td(r,'Categoría',i,'gastos','Gastos',CFG.SHEETS.finanzas,gastos)
        + '<td style="color:#fbbf24;font-weight:500">'+fmt(r['Monto MXN'])+'</td>'
        + td(r,'Forma de Pago',i,'gastos','Gastos',CFG.SHEETS.finanzas,gastos)
        + td(r,'Notas',i,'gastos','Gastos',CFG.SHEETS.finanzas,gastos)
        + '<td><button class="btn-sm btn-edit" onclick="openEditModal(\'gastos\','+i+')">✏️</button></td>'
        + '</tr>';
    }).join('');

  document.getElementById('tc-tbody').innerHTML = tcs.length === 0
    ? '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:20px">Sin tarjetas registradas</td></tr>'
    : tcs.map(function(r, i){
      return '<tr>'
        + td(r,'Banco',i,'tcs','Tarjetas_de_Credito',CFG.SHEETS.finanzas,tcs)
        + td(r,'Tarjeta',i,'tcs','Tarjetas_de_Credito',CFG.SHEETS.finanzas,tcs)
        + '<td style="color:#94a3b8">'+fmt(r['Límite'])+'</td>'
        + '<td style="color:#f87171;font-weight:500">'+fmt(r['Saldo Actual'])+'</td>'
        + td(r,'Fecha Corte',i,'tcs','Tarjetas_de_Credito',CFG.SHEETS.finanzas,tcs)
        + '<td style="color:#fbbf24">'+fmt(r['Pago Mínimo'])+'</td>'
        + '<td><button class="btn-sm btn-edit" onclick="openEditModal(\'tcs\','+i+')">✏️</button></td>'
        + '</tr>';
    }).join('');
}

function renderCompras() {
  var rows = DATA.comp;
  document.getElementById('comp-tbody').innerHTML = rows.length === 0
    ? '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:20px">Sin artículos registrados</td></tr>'
    : rows.map(function(r, i){
      return '<tr>'
        + td(r,'Artículo',i,'comp','Articulos',CFG.SHEETS.compras,rows)
        + td(r,'Categoría',i,'comp','Articulos',CFG.SHEETS.compras,rows)
        + '<td style="color:#64748b">'+(r['Etapa']||'1')+'</td>'
        + '<td>'+bdg(r['Estado'],ec(r['Estado']))+'</td>'
        + '<td>'+bdg(r['Prioridad'],pc(r['Prioridad']))+'</td>'
        + '<td style="color:#94a3b8">'+fmt(r['Precio Estimado'])+'</td>'
        + '<td style="color:#4ade80">'+fmt(r['Precio Real'])+'</td>'
        + '<td><button class="btn-sm btn-edit" onclick="openEditModal(\'comp\','+i+')">✏️</button></td>'
        + '</tr>';
    }).join('');
}

function renderNutricion() {
  var rows = DATA.desp;
  document.getElementById('desp-tbody').innerHTML = rows.length === 0
    ? '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:20px">Sin ítems en despensa</td></tr>'
    : rows.map(function(r, i){
      return '<tr>'
        + td(r,'Ítem',i,'desp','Despensa',CFG.SHEETS.hogar,rows)
        + td(r,'Categoría',i,'desp','Despensa',CFG.SHEETS.hogar,rows)
        + td(r,'Cantidad',i,'desp','Despensa',CFG.SHEETS.hogar,rows)
        + td(r,'Unidad',i,'desp','Despensa',CFG.SHEETS.hogar,rows)
        + td(r,'Caducidad',i,'desp','Despensa',CFG.SHEETS.hogar,rows)
        + '<td>'+bdg(r['Estado'],ec(r['Estado']))+'</td>'
        + '<td><button class="btn-sm btn-edit" onclick="openEditModal(\'desp\','+i+')">✏️</button></td>'
        + '</tr>';
    }).join('');
}

// ============================================================
// INLINE EDIT (click cell to edit)
// ============================================================
function td(row, field, rowIdx, dataKey, tab, sheetId, dataArr) {
  var val = row[field] || '';
  return '<td><span class="editable-cell" onclick="startInlineEdit(this,\''+dataKey+'\','+rowIdx+',\''+field+'\',\''+tab+'\',\''+sheetId+'\')">'+escHtml(val)+'</span></td>';
}

function escHtml(s) {
  return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function startInlineEdit(el, dataKey, rowIdx, field, tab, sheetId) {
  if (el.querySelector('input')) return;
  var oldVal = el.textContent;
  el.innerHTML = '<input class="inline-input" value="'+escHtml(oldVal)+'" />';
  var inp = el.querySelector('input');
  inp.focus(); inp.select();
  function commit() {
    var newVal = inp.value.trim();
    el.textContent = newVal || '—';
    if (newVal === oldVal) return;
    DATA[dataKey][rowIdx][field] = newVal;
    var row = DATA[dataKey][rowIdx];
    var headers = Object.keys(row).filter(function(k){return k!=='_row';});
    el.textContent = newVal + ' ⏳';
    writeRow(sheetId, tab, row._row, headers, row).then(function(){
      el.textContent = newVal;
      toast('✅ Guardado', 'ok');
      renderAll();
    }).catch(function(){
      el.textContent = oldVal;
      toast('Error al guardar', 'err');
    });
  }
  inp.addEventListener('blur', commit);
  inp.addEventListener('keydown', function(e){
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { el.textContent = oldVal; }
  });
}

// ============================================================
// MODAL EDIT (full row editor)
// ============================================================
var MODAL_MAP = {
  remo:   { sheetId: CFG.SHEETS.remo,     tab:'Proyectos_Maestro',     dataKey:'remo',   fields:['Área','Proyecto','ID Proyecto','Etapa Actual','Estado','Prioridad','Presupuesto MXN','Real MXN','Contratista','Notas'] },
  tareas: { sheetId: CFG.SHEETS.hogar,    tab:'Tareas',                dataKey:'tareas', fields:['Tarea','Responsable','Estado','Prioridad','Fecha Límite','Notas'] },
  gastos: { sheetId: CFG.SHEETS.finanzas, tab:'Gastos',                dataKey:'gastos', fields:['Fecha','Concepto','Categoría','Monto MXN','Forma de Pago','Notas'] },
  tcs:    { sheetId: CFG.SHEETS.finanzas, tab:'Tarjetas_de_Credito',   dataKey:'tcs',    fields:['Banco','Tarjeta','Límite','Saldo Actual','Fecha Corte','Pago Mínimo','Notas'] },
  comp:   { sheetId: CFG.SHEETS.compras,  tab:'Articulos',             dataKey:'comp',   fields:['Artículo','Categoría','Etapa','Estado','Prioridad','Precio Estimado','Precio Real','Tienda Compra','Notas'] },
  despensa:{ sheetId: CFG.SHEETS.hogar,   tab:'Despensa',              dataKey:'desp',   fields:['Ítem','Categoría','Cantidad','Unidad','Caducidad','Estado','Notas'] }
};

var SELECT_OPTS = {
  'Estado': ['Pendiente','En Proceso','Completado','Cancelado','Activo','Inactivo','✅','🔄','⬜'],
  'Prioridad': ['Alta','Media','Baja'],
  'Forma de Pago': ['Efectivo','Tarjeta de Débito','Tarjeta de Crédito','Transferencia','OXXO Pay','PayPal']
};

function openEditModal(key, idx) {
  var cfg = MODAL_MAP[key];
  var row = DATA[cfg.dataKey][idx];
  EDIT = { sheetId: cfg.sheetId, tab: cfg.tab, dataKey: cfg.dataKey, rowIndex: row._row, rowLocalIdx: idx, fields: cfg.fields, isNew: false };
  document.getElementById('modal-title').textContent = '✏️ Editar — ' + (row[cfg.fields[0]] || 'Registro');
  renderModalFields(cfg.fields, row);
  document.getElementById('modal-overlay').classList.add('open');
}

function openAddModal(key) {
  var cfg = MODAL_MAP[key];
  EDIT = { sheetId: cfg.sheetId, tab: cfg.tab, dataKey: cfg.dataKey, rowIndex: null, fields: cfg.fields, isNew: true };
  document.getElementById('modal-title').textContent = '➕ Nuevo registro';
  renderModalFields(cfg.fields, {});
  document.getElementById('modal-overlay').classList.add('open');
}

function renderModalFields(fields, row) {
  document.getElementById('modal-fields').innerHTML = fields.map(function(f){
    var val = row[f] || '';
    var opts = SELECT_OPTS[f];
    var input = opts
      ? '<select class="field-input" id="mf-'+f+'"><option value="">—</option>'
          + opts.map(function(o){return '<option value="'+o+'"'+(o===val?' selected':'')+'>'+o+'</option>';}).join('')
          + '</select>'
      : f.toLowerCase().includes('nota') || f.toLowerCase().includes('descripcion')
        ? '<textarea class="field-input" id="mf-'+f+'" rows="2">'+escHtml(val)+'</textarea>'
        : '<input class="field-input" id="mf-'+f+'" value="'+escHtml(val)+'"/>';
    return '<div class="field-group"><label class="field-label">'+f+'</label>'+input+'</div>';
  }).join('');
}

function saveModal() {
  var values = {};
  EDIT.fields.forEach(function(f){
    var el = document.getElementById('mf-'+f);
    values[f] = el ? el.value : '';
  });
  var headers = EDIT.fields;
  var p = EDIT.isNew
    ? appendRow(EDIT.sheetId, EDIT.tab, headers, values)
    : writeRow(EDIT.sheetId, EDIT.tab, EDIT.rowIndex, headers, values);
  p.then(function(){
    toast('✅ Guardado correctamente', 'ok');
    closeModalDirect();
    loadAllData();
  }).catch(function(){
    toast('Error al guardar. Verifica permisos.', 'err');
  });
}

function closeModal(e) { if (e.target === document.getElementById('modal-overlay')) closeModalDirect(); }
function closeModalDirect() { document.getElementById('modal-overlay').classList.remove('open'); }

// ============================================================
// TOAST
// ============================================================
function toast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' '+type : '');
  setTimeout(function(){ t.className = 'toast'; }, 2800);
}

// ============================================================
// INIT
// ============================================================
// checkAuth called on Google button callback (handleGoogleLogin)