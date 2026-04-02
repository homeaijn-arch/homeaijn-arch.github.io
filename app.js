// ============================================================
// CONFIG — IDs DEFINITIVOS — NO CAMBIAR
// remo=1fKh hogar=1B47 finanzas=1eI4 compras=1kNi
// ============================================================
const CONFIG={
  ALLOWED_EMAILS:["gusjsierra@gmail.com","gabynacoud@gmail.com"],
  GOOGLE_API_KEY:"AIzaSyDu0YLxIpEopSoD9fEL3ykqDVslfEj_1X8",
  SHEETS:{
    remo:    "1fKhYBwGe0moSmVordD6iTSeQ9VmNN-sOS7QExgQ1aks",
    hogar:   "1B47HwmB8-tlvCx4SHcqQosmHuJNBlVmcOzMH0RJv1UY",
    finanzas:"1eI4sE2R9cGt8M7UyHXvNge7v2JxQQFokoCNDJ5ivvbI",
    compras: "1kNiQRb6HDHWOfORPcSVMCZ1GR7sKPJh_Kw72k_-fv9Y"
  }
};

// AUTH
function handleGoogleLogin(r){
  var p=JSON.parse(atob(r.credential.split('.')[1]));
  var email=p.email.toLowerCase();
  if(CONFIG.ALLOWED_EMAILS.indexOf(email)===-1){document.getElementById("auth-err").style.display="block";return;}
  sessionStorage.setItem("homeai_user",email);
  sessionStorage.setItem("homeai_name",p.name||email);
  sessionStorage.setItem("homeai_pic",p.picture||"");
  initApp(email,p.name,p.picture);
}
function checkSession(){
  var e=sessionStorage.getItem("homeai_user");
  if(e&&CONFIG.ALLOWED_EMAILS.indexOf(e)!==-1)initApp(e,sessionStorage.getItem("homeai_name"),sessionStorage.getItem("homeai_pic"));
}
function initApp(email,name,pic){
  document.getElementById("auth-screen").style.display="none";
  document.getElementById("app").style.display="block";
  document.getElementById("nav-user").textContent=name||email;
  if(pic){var av=document.getElementById("nav-avatar");av.src=pic;av.style.display="block";}
  document.getElementById("dash-date").textContent=new Date().toLocaleDateString("es-MX",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  loadAllData();
}
function logout(){sessionStorage.clear();document.getElementById("app").style.display="none";document.getElementById("auth-screen").style.display="flex";}

// NAV
function showPage(id,btn){
  document.querySelectorAll(".page").forEach(function(p){p.classList.remove("active");});
  document.querySelectorAll(".nav-btn").forEach(function(b){b.classList.remove("active");});
  document.getElementById("page-"+id).classList.add("active");
  if(btn)btn.classList.add("active");
}
function showHogarTab(id,btn){
  ["tareas","calle","salud","mascotas","tramites"].forEach(function(t){var el=document.getElementById("hogar-"+t);if(el)el.style.display="none";});
  document.querySelectorAll("#page-hogar .tab-btn").forEach(function(b){b.classList.remove("active");});
  var el=document.getElementById("hogar-"+id);if(el)el.style.display="block";
  if(btn)btn.classList.add("active");
}
function showNutTab(id,btn){
  ["menu","despensa","compras","historial"].forEach(function(t){var el=document.getElementById("nut-"+t);if(el)el.style.display="none";});
  document.querySelectorAll("#page-nutricion .tab-btn").forEach(function(b){b.classList.remove("active");});
  var el=document.getElementById("nut-"+id);if(el)el.style.display="block";
  if(btn)btn.classList.add("active");
}

// SHEETS
function fetchSheet(id,tab){
  var url="https://sheets.googleapis.com/v4/spreadsheets/"+id+"/values/"+encodeURIComponent(tab.trim())+"?key="+CONFIG.GOOGLE_API_KEY;
  return fetch(url).then(function(r){return r.json();}).then(function(d){
    if(d.error||!d.values||d.values.length<2)return[];
    var h=d.values[0];
    return d.values.slice(1).map(function(row){var o={};h.forEach(function(k,i){o[k.trim()]=(row[i]||"").trim();});return o;});
  }).catch(function(){return[];});
}

// HELPERS
function fmt(n){return(isNaN(+n)||n===""||n===undefined)?"—":"$"+Number(n).toLocaleString("es-MX",{minimumFractionDigits:0,maximumFractionDigits:0});}
function bdg(l,c){return'<span class="badge" style="background:'+c+'22;color:'+c+';border:1px solid '+c+'44">'+(l||"—")+'</span>';}
function ec(e){if(!e)return"#64748b";if(e.indexOf("Completo")!==-1)return"#4ade80";if(e.indexOf("En Proceso")!==-1)return"#fbbf24";if(e.indexOf("Bloqueado")!==-1)return"#f87171";if(e.indexOf("Planeando")!==-1)return"#60a5fa";if(e.indexOf("Prueba")!==-1)return"#a78bfa";return"#64748b";}
function pc(p){return p==="Alta"?"#f87171":p==="Baja"?"#4ade80":"#60a5fa";}
function erow(c,m){return'<tr><td colspan="'+c+'" class="empty">'+m+'</td></tr>';}
function ediv(m){return'<div class="empty">'+m+'</div>';}
function fld(label,val,color){return'<div class="det-field"><div class="det-label">'+label+'</div><div class="det-val"'+(color?' style="color:'+color+'"':'')+'>'+( val||"—")+'</div></div>';}

// DATA
var DATA={remo:[],hogar:{tareas:[],subtareas:[],salud:[],mascotas:[],tramites:[]},fin:{gastos:[],tcs:[],msi:[],cuentas:[],movimientos:[],alertas:[]},comp:[],nut:{menu:[],despensa:[],compras:[],historial:[]}};

function loadAllData(){
  Promise.all([
    fetchSheet(CONFIG.SHEETS.remo,    "ProyectosMaestro"),
    fetchSheet(CONFIG.SHEETS.hogar,   "Tareas"),
    fetchSheet(CONFIG.SHEETS.hogar,   "Subtareas"),
    fetchSheet(CONFIG.SHEETS.hogar,   "Salud"),
    fetchSheet(CONFIG.SHEETS.hogar,   "Mascotas"),
    fetchSheet(CONFIG.SHEETS.hogar,   "Tramites"),
    fetchSheet(CONFIG.SHEETS.finanzas,"Gastos"),
    fetchSheet(CONFIG.SHEETS.finanzas,"Tarjetas"),
    fetchSheet(CONFIG.SHEETS.finanzas,"MSIActivos"),
    fetchSheet(CONFIG.SHEETS.compras, "Articulos"),
    fetchSheet(CONFIG.SHEETS.hogar,   "MenuSemanal"),
    fetchSheet(CONFIG.SHEETS.hogar,   "Despensa"),
    fetchSheet(CONFIG.SHEETS.hogar,   "ListadeCompras"),
    fetchSheet(CONFIG.SHEETS.hogar,   "HistorialNutricional"),
    fetchSheet(CONFIG.SHEETS.finanzas,"Cuentas"),
    fetchSheet(CONFIG.SHEETS.finanzas,"Movimientos"),
    fetchSheet(CONFIG.SHEETS.finanzas,"AlertasFinancieras")
  ]).then(function(res){
    DATA={
      remo:res[0],
      hogar:{tareas:res[1],subtareas:res[2],salud:res[3],mascotas:res[4],tramites:res[5]},
      fin:{gastos:res[6],tcs:res[7],msi:res[8],cuentas:res[14],movimientos:res[15],alertas:res[16]},
      comp:res[9],
      nut:{menu:res[10],despensa:res[11],compras:res[12],historial:res[13]}
    };
    renderDashboard();renderRemo();renderHogar();renderFinanzas();renderCompras();renderNutricion();
  });
}

// DETAIL PANEL
function openDetail(html){document.getElementById("detail-content").innerHTML=html;document.getElementById("detail-panel").style.display="flex";document.body.style.overflow="hidden";}
function closeDetail(){document.getElementById("detail-panel").style.display="none";document.body.style.overflow="";}

function showProyectoDetail(idx){
  var p=DATA.remo[idx];if(!p)return;
  var ET=["Descripcion","Diseno","How-To","Mano de Obra","Materiales","Precios","Programacion","Pruebas","Seguimiento","Cierre"];
  var CL=["#f472b6","#a78bfa","#818cf8","#fb923c","#fbbf24","#34d399","#60a5fa","#2dd4bf","#f87171","#4ade80"];
  var ei=+(p["Etapa Actual"]||1)-1;
  var h='<div class="det-header"><div class="det-back" onclick="closeDetail()">← Remodelacion</div><div class="det-title">'+(p["Nombre del Proyecto"]||"—")+'</div><div class="det-sub">'+(p["Área"]||"—")+' · Etapa '+(p["Etapa Actual"]||"1")+'</div></div>';
  h+='<div class="det-badges">'+bdg(p["Estado"]||"Pendiente",ec(p["Estado"]))+' '+bdg(p["Prioridad"]||"Media",pc(p["Prioridad"]))+'</div>';
  h+='<div class="det-grid">'+fld("Presupuesto",fmt(p["Presupuesto MXN"]),"#fbbf24")+fld("Costo Real",fmt(p["Costo Real MXN"]),"#fb923c")+fld("Total Pagado",fmt(p["Total Pagado MXN"]),"#4ade80")+fld("Saldo",fmt(p["Saldo MXN"]),"#60a5fa")+fld("Contratista",p["Contratista"])+fld("Fecha Inicio",p["Fecha Inicio"])+fld("Fecha Fin Est.",p["Fecha Fin Estimada"])+fld("Activo",p["Activo"])+'</div>';
  h+='<div class="det-section"><div class="det-section-title">Etapas</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px">';
  ET.forEach(function(e,i){h+='<div style="padding:4px 10px;border-radius:99px;font-size:11px;background:'+(i===ei?CL[i]+"33":"#0f172a")+';color:'+(i===ei?CL[i]:"#64748b")+';border:1px solid '+(i===ei?CL[i]:"#334155")+'">'+(i+1)+'. '+e+'</div>';});
  h+='</div></div>';
  if(p["Notas / Dependencias"])h+='<div class="det-section"><div class="det-section-title">Notas</div><div class="det-notes">'+p["Notas / Dependencias"]+'</div></div>';
  openDetail(h);
}

function showTareaDetail(idx){
  var t=DATA.hogar.tareas[idx];if(!t)return;
  var nombre=t["Nombre"]||t["Descripción"]||"—";
  var subs=DATA.hogar.subtareas.filter(function(s){return s["ID Tarea Padre"]===t["ID Tarea"]||s["ID Tarea Padre"]===t["ID_Tarea"];});
  var h='<div class="det-header"><div class="det-back" onclick="closeDetail()">← Hogar</div><div class="det-title">'+nombre+'</div><div class="det-sub">'+(t["Categoría"]||"—")+(t["Subcategoría"]?" · "+t["Subcategoría"]:"")+'</div></div>';
  h+='<div class="det-badges">'+bdg(t["Estado"]||"Pendiente",ec(t["Estado"]))+' '+bdg(t["Prioridad"]||"Media",pc(t["Prioridad"]))+'</div>';
  h+='<div class="det-grid">'+fld("Asignado a",t["Asignado A"])+fld("Fecha Limite",t["Fecha Límite"]||t["Fecha Limite"])+fld("Recurrencia",t["Recurrencia"])+fld("Requiere Salir",t["RequiereSalir"])+fld("Zona",t["Zona"])+fld("Direccion",t["DireccionReferencia"])+'</div>';
  if(t["Notas"])h+='<div class="det-section"><div class="det-section-title">Notas</div><div class="det-notes">'+t["Notas"]+'</div></div>';
  if(t["Descripción"]&&t["Descripción"]!==nombre)h+='<div class="det-section"><div class="det-section-title">Descripcion</div><div class="det-notes">'+t["Descripción"]+'</div></div>';
  if(subs.length>0){
    h+='<div class="det-section"><div class="det-section-title">Subtareas ('+subs.length+')</div>';
    subs.forEach(function(s){h+='<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #1e293b"><div style="font-size:13px">'+(s["Descripción Subtarea"]||s["Nombre"]||"—")+'</div>'+bdg(s["Estado"]||"Pendiente",ec(s["Estado"]))+'</div>';});
    h+='</div>';
  }
  openDetail(h);
}

function showGastoDetail(idx){
  var g=DATA.fin.gastos[idx];if(!g)return;
  var h='<div class="det-header"><div class="det-back" onclick="closeDetail()">← Finanzas</div><div class="det-title">'+(g["Concepto"]||"—")+'</div><div class="det-sub">'+(g["Fecha"]||"—")+'</div></div>';
  h+='<div class="det-grid">'+fld("Monto",fmt(g["Monto"]),"#fbbf24")+fld("Categoria",g["Categoría"]||g["Categoria"])+fld("Metodo pago",g["Método de pago"]||g["Metodo de pago"])+fld("Banco/TC",g["Banco/TC"])+fld("MSI",g["MSI"])+fld("Meses",g["Meses"])+'</div>';
  if(g["ComprobanteDrive"]||g["Comprobante Drive"])h+='<div class="det-section"><a href="'+(g["ComprobanteDrive"]||g["Comprobante Drive"])+'" target="_blank" style="color:#60a5fa">Ver comprobante</a></div>';
  if(g["Notas"])h+='<div class="det-section"><div class="det-section-title">Notas</div><div class="det-notes">'+g["Notas"]+'</div></div>';
  openDetail(h);
}

function showArticuloDetail(idx){
  var a=DATA.comp[idx];if(!a)return;
  var ET=["Necesidad","Investigacion","Cotizaciones","Eval.Tecnica","Decision","Comprado","En Transito","Recibido","En Uso","Evaluacion","Garantia","Cerrado"];
  var ei=+(a["Etapa"]||0);
  var h='<div class="det-header"><div class="det-back" onclick="closeDetail()">← Compras</div><div class="det-title">'+(a["Artículo"]||a["Articulo"]||"—")+'</div><div class="det-sub">'+(a["Descripción"]||"—")+'</div></div>';
  h+='<div class="det-badges">'+bdg(a["Estado"]||"—",ec(a["Estado"]))+' '+bdg(a["Prioridad"]||"Media",pc(a["Prioridad"]))+'</div>';
  h+='<div class="det-section"><div class="det-section-title">Pipeline</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px">';
  ET.forEach(function(e,i){h+='<div style="padding:3px 8px;border-radius:99px;font-size:11px;background:'+(i===ei?"#60a5fa33":"#0f172a")+';color:'+(i===ei?"#60a5fa":"#64748b")+';border:1px solid '+(i===ei?"#60a5fa":"#334155")+'">'+i+'. '+e+'</div>';});
  h+='</div></div>';
  h+='<div class="det-grid">'+fld("Precio Est.",fmt(a["Precio Estimado"]),"#fbbf24")+fld("Precio Real",fmt(a["Precio Real"]),"#4ade80")+fld("Tienda",a["Tienda Compra"])+fld("Fecha Compra",a["Fecha Compra"])+fld("Garantia",a["Fecha Vencimiento Garantia"]||a["Fecha Vencimiento Garantía"])+'</div>';
  if(a["Notas"])h+='<div class="det-section"><div class="det-section-title">Notas</div><div class="det-notes">'+a["Notas"]+'</div></div>';
  openDetail(h);
}

// DASHBOARD
function renderDashboard(){
  var r=DATA.remo,tot=r.length;
  var comp=r.filter(function(p){return p["Estado"]&&p["Estado"].indexOf("Completo")!==-1;}).length;
  var pct=tot?Math.round(comp/tot*100):0;
  var presup=r.reduce(function(s,p){return s+(+p["Presupuesto MXN"]||0);},0);
  var pagado=r.reduce(function(s,p){return s+(+p["Total Pagado MXN"]||0);},0);
  var bloq=r.filter(function(p){return p["Estado"]&&p["Estado"].indexOf("Bloqueado")!==-1;});
  var tareas=DATA.hogar.tareas;
  var hoyD=new Date();hoyD.setHours(0,0,0,0);
  var tPend=tareas.filter(function(t){return t["Estado"]&&t["Estado"].indexOf("Completo")===-1&&t["Estado"].indexOf("Cancelado")===-1;});
  var tVenc=tPend.filter(function(t){var f=t["Fecha Límite"]||t["Fecha Limite"];if(!f)return false;var fl=new Date(f);fl.setHours(0,0,0,0);return fl<=hoyD;});
  var cuentas=(DATA.fin.cuentas||[]).filter(function(c){return c["Activa"]!=="No";});
  var tarjetas=(DATA.fin.tcs||[]).filter(function(t){return t["Activa"]!=="No";});
  var totalC=cuentas.reduce(function(s,c){return s+(+c["SaldoActual"]||0);},0);
  var totalT=tarjetas.reduce(function(s,t){return s+(+t["SaldoActual"]||0);},0);
  var sc=totalC-totalT;
  var scc=sc>totalT*2?"#4ade80":sc>0?"#fbbf24":"#f87171";
  var now=new Date();
  var gM=DATA.fin.gastos.filter(function(g){try{var f=new Date(g["Fecha"]);return f.getMonth()===now.getMonth()&&f.getFullYear()===now.getFullYear();}catch(e){return false;}});
  var totG=gM.reduce(function(s,g){return s+(+g["Monto"]||0);},0);
  var cAct=DATA.comp.filter(function(a){return a["Estado"]&&a["Estado"].indexOf("Cerrado")===-1;}).length;

  document.getElementById("dash-metrics").innerHTML=
    '<div class="metric-card" style="--accent:#fb923c"><div class="metric-label">Remodelacion</div><div class="metric-val">'+pct+'%</div><div class="metric-sub">'+comp+' de '+tot+'</div><div class="metric-bar"><div class="metric-bar-fill" style="width:'+pct+'%"></div></div></div>'+
    '<div class="metric-card" style="--accent:#a78bfa"><div class="metric-label">Tareas Hogar</div><div class="metric-val">'+tPend.length+'</div><div class="metric-sub">'+(tVenc.length>0?'<span style="color:#f87171">'+tVenc.length+' vencidas</span>':'Al dia')+'</div></div>'+
    '<div class="metric-card" style="--accent:'+scc+'"><div class="metric-label">Saldo conciliado</div><div class="metric-val">'+fmt(sc)+'</div></div>'+
    '<div class="metric-card" style="--accent:#fbbf24"><div class="metric-label">Gastos del mes</div><div class="metric-val">'+fmt(totG)+'</div><div class="metric-sub">'+gM.length+' mov.</div></div>'+
    '<div class="metric-card" style="--accent:#34d399"><div class="metric-label">Compras activas</div><div class="metric-val">'+cAct+'</div></div>'+
    '<div class="metric-card" style="--accent:#fbbf24"><div class="metric-label">Presupuesto remo</div><div class="metric-val">'+fmt(presup)+'</div></div>'+
    '<div class="metric-card" style="--accent:#4ade80"><div class="metric-label">Pagado remo</div><div class="metric-val">'+fmt(pagado)+'</div></div>'+
    '<div class="metric-card" style="--accent:#f87171"><div class="metric-label">Bloqueados</div><div class="metric-val">'+bloq.length+'</div></div>';

  var al="";
  if(bloq.length>0)al+='<div class="alert danger">🔴 '+bloq.length+' bloqueado(s)</div>';
  if(tVenc.length>0)al+='<div class="alert danger">🚨 '+tVenc.length+' tarea(s) vencida(s)</div>';
  if(sc<0)al+='<div class="alert danger">🔴 Saldo conciliado negativo</div>';
  document.getElementById("dash-alerts").innerHTML=al?'<div class="sec">Alertas</div>'+al:"";

  var ests=["Pendiente","Planeando","En Proceso","En Prueba","Completo","Bloqueado"];
  document.getElementById("dash-estados").innerHTML='<div class="sec">Avance por estado</div>'+(tot===0?ediv("Sin proyectos"):ests.map(function(e){var n=r.filter(function(p){return p["Estado"]&&p["Estado"].indexOf(e)!==-1;}).length;var w=tot?Math.round(n/tot*100):0;return'<div class="prog-row"><div class="prog-label">'+e+'</div><div class="prog-bar"><div class="prog-fill" style="width:'+w+'%;background:'+ec(e)+'"></div></div><div class="prog-val">'+n+'</div></div>';}).join(""));

  var areas=[];r.forEach(function(p){if(p["Área"]&&areas.indexOf(p["Área"])===-1)areas.push(p["Área"]);});
  var aS=areas.map(function(a){var ps=r.filter(function(p){return p["Área"]===a;});var c=ps.filter(function(p){return p["Estado"]&&p["Estado"].indexOf("Completo")!==-1;}).length;return{a:a,p:ps.length?Math.round(c/ps.length*100):0};}).sort(function(x,y){return y.p-x.p;}).slice(0,7);
  document.getElementById("dash-areas").innerHTML='<div class="sec">Top areas</div>'+(aS.length===0?ediv("Sin datos"):aS.map(function(x){return'<div class="prog-row"><div class="prog-label">'+x.a+'</div><div class="prog-bar"><div class="prog-fill" style="width:'+x.p+'%;background:'+(x.p===100?"#4ade80":"#3b82f6")+'"></div></div><div class="prog-val">'+x.p+'%</div></div>';}).join(""));

  var aP=r.filter(function(p){return p["Prioridad"]==="Alta"&&p["Estado"]&&p["Estado"].indexOf("Completo")===-1;}).concat(tareas.filter(function(t){return t["Prioridad"]==="Alta"&&t["Estado"]&&t["Estado"].indexOf("Completo")===-1;}));
  document.getElementById("dash-prioridad").innerHTML='<div class="sec">Prioridad alta</div>'+(aP.length===0?ediv("Sin items"):aP.slice(0,10).map(function(p){var n=p["Nombre del Proyecto"]||p["Nombre"]||"—";var z=p["Área"]||p["Categoría"]||"Hogar";var ir=!!p["Área"];return'<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #1e293b;cursor:pointer" onclick="'+(ir?"showProyectoDetail("+DATA.remo.indexOf(p)+")":"showTareaDetail("+DATA.hogar.tareas.indexOf(p)+")")+'"><div style="font-size:13px">'+n+'</div>'+bdg(z,"#f87171")+'</div>';}).join(""));
}

// REMO
var remoData=[];
function renderRemo(){
  remoData=DATA.remo;
  var areas=[];remoData.forEach(function(p){if(p["Área"]&&areas.indexOf(p["Área"])===-1)areas.push(p["Área"]);});
  var sel=document.getElementById("f-area");
  sel.innerHTML='<option value="">Todas las areas</option>';
  areas.forEach(function(a){sel.innerHTML+='<option value="'+a+'">'+a+'</option>';});
  var tot=remoData.length,comp=remoData.filter(function(p){return p["Estado"]&&p["Estado"].indexOf("Completo")!==-1;}).length;
  var pct=tot?Math.round(comp/tot*100):0;
  var presup=remoData.reduce(function(s,p){return s+(+p["Presupuesto MXN"]||0);},0);
  var pagado=remoData.reduce(function(s,p){return s+(+p["Total Pagado MXN"]||0);},0);
  document.getElementById("remo-metrics").innerHTML=
    '<div class="metric-card" style="--accent:#fb923c"><div class="metric-label">Proyectos</div><div class="metric-val">'+comp+'/'+tot+'</div><div class="metric-bar"><div class="metric-bar-fill" style="width:'+pct+'%"></div></div></div>'+
    '<div class="metric-card" style="--accent:#fbbf24"><div class="metric-label">Presupuesto</div><div class="metric-val">'+fmt(presup)+'</div></div>'+
    '<div class="metric-card" style="--accent:#4ade80"><div class="metric-label">Pagado</div><div class="metric-val">'+fmt(pagado)+'</div></div>'+
    '<div class="metric-card" style="--accent:#60a5fa"><div class="metric-label">Saldo</div><div class="metric-val">'+fmt(presup-pagado)+'</div></div>';
  filterRemo();
}
function filterRemo(){
  var fA=document.getElementById("f-area").value;
  var fE=document.getElementById("f-estado").value;
  var fP=document.getElementById("f-pri").value;
  var f=remoData.filter(function(p){return(!fA||p["Área"]===fA)&&(!fE||!p["Estado"]||(p["Estado"].indexOf(fE)!==-1))&&(!fP||p["Prioridad"]===fP);});
  document.getElementById("remo-tbody").innerHTML=f.length===0?erow(8,"Sin resultados"):
    f.map(function(p){var ri=DATA.remo.indexOf(p);return'<tr style="cursor:pointer" onclick="showProyectoDetail('+ri+')"><td style="color:#94a3b8">'+(p["Área"]||"—")+'</td><td style="font-weight:500">'+(p["Nombre del Proyecto"]||"—")+'</td><td style="color:#64748b">'+(p["Etapa Actual"]||"1")+'</td><td>'+bdg(p["Estado"]||"Pendiente",ec(p["Estado"]))+'</td><td>'+bdg(p["Prioridad"]||"Media",pc(p["Prioridad"]))+'</td><td style="color:#94a3b8">'+fmt(p["Presupuesto MXN"])+'</td><td style="color:#4ade80">'+fmt(p["Total Pagado MXN"])+'</td><td style="color:#64748b">'+(p["Contratista"]||"—")+'</td></tr>';}).join("");
}

// HOGAR
function renderHogar(){
  var tareas=DATA.hogar.tareas,subs=DATA.hogar.subtareas;
  var hoyD=new Date();hoyD.setHours(0,0,0,0);
  var pend=tareas.filter(function(t){return t["Estado"]&&t["Estado"].indexOf("Completo")===-1&&t["Estado"].indexOf("Cancelado")===-1;});
  var subPend=subs.filter(function(s){return s["Estado"]&&s["Estado"].indexOf("Completo")===-1;});
  var vencidas=pend.filter(function(t){var f=t["Fecha Límite"]||t["Fecha Limite"];if(!f)return false;var fl=new Date(f);fl.setHours(0,0,0,0);return fl<=hoyD;});
  var criticas=vencidas.filter(function(t){var fl=new Date(t["Fecha Límite"]||t["Fecha Limite"]);fl.setHours(0,0,0,0);return Math.round((hoyD-fl)/(1000*60*60*24))>7;});
  var proximas=pend.filter(function(t){var f=t["Fecha Límite"]||t["Fecha Limite"];if(!f)return false;var fl=new Date(f);fl.setHours(0,0,0,0);var d=Math.round((fl-hoyD)/(1000*60*60*24));return d>=0&&d<=3;});
  document.getElementById("hogar-metrics").innerHTML=
    '<div class="metric-card" style="--accent:#a78bfa"><div class="metric-label">Pendientes</div><div class="metric-val">'+pend.length+'</div></div>'+
    '<div class="metric-card" style="--accent:#f87171"><div class="metric-label">Vencidas</div><div class="metric-val">'+vencidas.length+'</div><div class="metric-sub">'+(criticas.length>0?criticas.length+' criticas':'Sin criticas')+'</div></div>'+
    '<div class="metric-card" style="--accent:#fbbf24"><div class="metric-label">Vencen pronto</div><div class="metric-val">'+proximas.length+'</div></div>'+
    '<div class="metric-card" style="--accent:#4ade80"><div class="metric-label">Completadas</div><div class="metric-val">'+tareas.filter(function(t){return t["Estado"]&&t["Estado"].indexOf("Completo")!==-1;}).length+'</div></div>'+
    '<div class="metric-card" style="--accent:#60a5fa"><div class="metric-label">Subtareas pend.</div><div class="metric-val">'+subPend.length+'</div></div>';

  document.getElementById("hogar-tareas-tbody").innerHTML=tareas.length===0?erow(6,"Sin tareas"):
    tareas.map(function(t,i){
      var nombre=t["Nombre"]||t["Descripción"]||"—";
      var fls=t["Fecha Límite"]||t["Fecha Limite"]||"";
      var dias=0;var nc="#64748b";var dl="";
      if(fls&&t["Estado"]&&t["Estado"].indexOf("Completo")===-1){
        var fl=new Date(fls);fl.setHours(0,0,0,0);
        dias=Math.round((hoyD-fl)/(1000*60*60*24));
        if(dias>7){nc="#f87171";dl=' <span style="color:#f87171;font-size:10px">🚨'+dias+'d</span>';}
        else if(dias>=3){nc="#f87171";dl=' <span style="color:#f87171;font-size:10px">🔴'+dias+'d</span>';}
        else if(dias>=0){nc="#fb923c";dl=' <span style="color:#fb923c;font-size:10px">🟠</span>';}
        else if(dias>=-3){nc="#fbbf24";dl=' <span style="color:#fbbf24;font-size:10px">🟡'+Math.abs(dias)+'d</span>';}
      }
      return'<tr style="cursor:pointer'+(dias>0?';border-left:2px solid '+nc:'')+'" onclick="showTareaDetail('+i+')"><td style="color:#94a3b8">'+(t["Categoría"]||"—")+'</td><td style="font-weight:500">'+nombre+dl+'</td><td>'+bdg(t["Prioridad"]||"Media",pc(t["Prioridad"]))+'</td><td>'+bdg(t["Estado"]||"—",ec(t["Estado"]))+'</td><td style="color:#94a3b8">'+(t["Asignado A"]||"—")+'</td><td style="color:'+(dias>0?nc:"#64748b")+'">'+(fls||"—")+'</td></tr>';
    }).join("");

  var grouped={};
  subPend.forEach(function(s){var k=s["ID Tarea Padre"]||"x";if(!grouped[k])grouped[k]=[];grouped[k].push(s);});
  document.getElementById("hogar-subtareas-list").innerHTML=Object.keys(grouped).length===0?ediv("Sin subtareas pendientes"):
    Object.keys(grouped).map(function(k){
      var t=tareas.filter(function(x){return x["ID Tarea"]===k||x["ID_Tarea"]===k;})[0];
      var nombre=t?(t["Nombre"]||t["Descripción"]):(grouped[k][0]["Nombre Tarea Padre"]||k);
      return'<div style="margin-bottom:10px"><div style="font-size:13px;font-weight:500;color:#f1f5f9;margin-bottom:4px">'+nombre+'</div>'+grouped[k].map(function(s){return'<div class="sub-row"><span>'+(s["Descripción Subtarea"]||s["Nombre"]||"—")+'</span>'+bdg(s["Estado"]||"Pendiente",ec(s["Estado"]))+'</div>';}).join("")+'</div>';
    }).join("");

  var calleItems=tareas.filter(function(t){return(t["RequiereSalir"]==="Sí"||t["RequiereSalir"]==="Si")&&t["Estado"]&&t["Estado"].indexOf("Completo")===-1;}).concat(DATA.hogar.tramites.filter(function(t){return(t["RequiereSalir"]==="Sí"||t["RequiereSalir"]==="Si")&&t["Estado"]&&t["Estado"].indexOf("Completo")===-1;}));
  if(calleItems.length===0){document.getElementById("hogar-calle-content").innerHTML=ediv("Sin pendientes que requieran salir hoy");}
  else{var z={};calleItems.forEach(function(t){var zn=t["Zona"]||"Sin zona";if(!z[zn])z[zn]=[];z[zn].push(t);});document.getElementById("hogar-calle-content").innerHTML=Object.keys(z).map(function(zn){return'<div style="margin-bottom:14px"><div style="font-size:12px;font-weight:600;color:#60a5fa;margin-bottom:6px">📍 '+zn.toUpperCase()+'</div>'+z[zn].map(function(t){return'<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1e293b"><span>'+(t["Nombre"]||t["Descripción"]||t["Tipo Tramite"]||"—")+'</span>'+bdg(t["Prioridad"]||"Media",pc(t["Prioridad"]))+'</div>';}).join("")+'</div>';}).join("")+'<div style="padding:10px;background:#0f172a;border-radius:8px;font-size:13px;border:1px solid #334155">'+calleItems.length+' pendiente(s) en '+Object.keys(z).length+' zona(s)</div>';}

  document.getElementById("hogar-salud-tbody").innerHTML=DATA.hogar.salud.length===0?erow(6,"Sin registros"):DATA.hogar.salud.map(function(s){return'<tr><td>'+(s["Miembro Familia"]||"—")+'</td><td>'+(s["Tipo Registro"]||"—")+'</td><td>'+(s["Descripción"]||"—")+'</td><td style="color:#94a3b8">'+(s["Doctor / Centro"]||"—")+'</td><td>'+(s["Fecha"]||"—")+'</td><td style="color:#4ade80">'+(s["Próxima Cita"]||"—")+'</td></tr>';}).join("");
  document.getElementById("hogar-mascotas-tbody").innerHTML=DATA.hogar.mascotas.length===0?erow(6,"Sin registros"):DATA.hogar.mascotas.map(function(m){return'<tr><td>'+(m["Nombre Mascota"]||"—")+'</td><td>'+(m["Tipo Registro"]||"—")+'</td><td>'+(m["Descripción"]||"—")+'</td><td>'+(m["Veterinario"]||"—")+'</td><td>'+(m["Fecha"]||"—")+'</td><td style="color:#4ade80">'+(m["Fecha Próxima Vacuna"]||"—")+'</td></tr>';}).join("");
  document.getElementById("hogar-tramites-tbody").innerHTML=DATA.hogar.tramites.length===0?erow(6,"Sin tramites"):DATA.hogar.tramites.map(function(t){return'<tr><td>'+(t["Tipo Trámite"]||t["Tipo Tramite"]||"—")+'</td><td>'+(t["Descripción"]||"—")+'</td><td>'+(t["Responsable"]||"—")+'</td><td>'+bdg(t["Estado"]||"—",ec(t["Estado"]))+'</td><td style="color:#fbbf24">'+(t["Fecha Límite"]||t["Fecha Limite"]||"—")+'</td><td>'+(t["Institución"]||t["Institucion"]||"—")+'</td></tr>';}).join("");
}

// FINANZAS
function renderFinanzas(){
  var gastos=DATA.fin.gastos||[],tcs=DATA.fin.tcs||[],msi=DATA.fin.msi||[];
  var cuentas=(DATA.fin.cuentas||[]).filter(function(c){return c["Activa"]!=="No";});
  var tarjetas=tcs.filter(function(t){return t["Activa"]!=="No";});
  var alertas=(DATA.fin.alertas||[]).filter(function(a){return a["Atendida"]!=="Sí";});
  var now=new Date();
  var totalC=cuentas.reduce(function(s,c){return s+(+c["SaldoActual"]||0);},0);
  var totalT=tarjetas.reduce(function(s,t){return s+(+t["SaldoActual"]||0);},0);
  var sc=totalC-totalT;
  var scc=sc>totalT*2?"#4ade80":sc>0?"#fbbf24":"#f87171";
  var sem=sc>totalT*2?"Saludable":sc>0?"Atencion":"Critico";
  var gM=gastos.filter(function(g){try{var f=new Date(g["Fecha"]);return f.getMonth()===now.getMonth()&&f.getFullYear()===now.getFullYear();}catch(e){return false;}});
  var totG=gM.reduce(function(s,g){return s+(+g["Monto"]||0);},0);
  var msiAct=msi.filter(function(m){return m["Estado"]!=="Cerrado";});

  document.getElementById("fin-metrics").innerHTML=
    '<div class="metric-card" style="--accent:#4ade80"><div class="metric-label">Total cuentas</div><div class="metric-val">'+fmt(totalC)+'</div><div class="metric-sub">'+cuentas.length+' activa(s)</div></div>'+
    '<div class="metric-card" style="--accent:#f87171"><div class="metric-label">Total deuda TCs</div><div class="metric-val">'+fmt(totalT)+'</div></div>'+
    '<div class="metric-card" style="--accent:'+scc+'"><div class="metric-label">Saldo conciliado</div><div class="metric-val">'+fmt(sc)+'</div><div class="metric-sub">'+sem+'</div></div>'+
    '<div class="metric-card" style="--accent:#fbbf24"><div class="metric-label">Gastos del mes</div><div class="metric-val">'+fmt(totG)+'</div><div class="metric-sub">'+gM.length+' mov.</div></div>'+
    (alertas.length>0?'<div class="metric-card" style="--accent:#f87171"><div class="metric-label">Alertas</div><div class="metric-val">'+alertas.length+'</div></div>':"");

  var h='<div class="card" style="margin-bottom:10px"><div class="sec">Conciliacion</div><div style="background:#0f172a;border-radius:8px;padding:16px;font-size:13px;border:1px solid #334155">';
  if(cuentas.length===0){h+=ediv("Sin cuentas — dile al agente: agrega cuenta efectivo con saldo $X,XXX");}
  else{cuentas.forEach(function(c){h+='<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:#94a3b8">'+(c["Nombre"]||"Cuenta")+' <span style="font-size:11px">['+( c["Tipo"]||"")+']</span></span><span style="color:#4ade80;font-weight:600">'+fmt(c["SaldoActual"])+'</span></div>';});}
  h+='<div style="border-top:1px solid #334155;margin:6px 0;display:flex;justify-content:space-between"><span style="color:#94a3b8;font-size:12px">Total disponible</span><span style="color:#4ade80;font-weight:600">'+fmt(totalC)+'</span></div>';
  h+='<div style="margin:10px 0 6px;color:#64748b;font-size:12px">(-) Tarjetas:</div>';
  if(tarjetas.length===0){h+='<div style="color:#64748b;font-size:12px">Sin tarjetas activas</div>';}
  else{tarjetas.forEach(function(t){if((+t["SaldoActual"]||0)>0)h+='<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:#94a3b8">(-) '+(t["Banco"]||"TC")+' ...'+(t["Ultimos4"]||"")+' <span style="font-size:11px;color:#64748b">vence '+(t["FechaLimitePago"]||"—")+'</span></span><span style="color:#f87171">'+fmt(t["SaldoActual"])+'</span></div>';});}
  h+='<div style="border-top:1px solid #60a5fa44;margin:8px 0"></div><div style="display:flex;justify-content:space-between"><span style="font-weight:700">(=) Saldo Conciliado:</span><span style="color:'+scc+';font-weight:700;font-size:18px">'+fmt(sc)+'</span></div><div style="text-align:right;font-size:12px;color:'+scc+'">'+sem+'</div></div>';
  if(alertas.length>0){h+='<div class="sec" style="margin-top:12px">Alertas</div>';alertas.slice(0,3).forEach(function(a){var c=a["Severidad"]==="Critica"?"#f87171":"#fbbf24";h+='<div style="background:'+c+'15;border:1px solid '+c+'33;border-radius:6px;padding:8px 12px;margin-bottom:6px;font-size:12px;color:'+c+'">'+(a["TipoAlerta"]||"Alerta")+' — '+(a["Descripcion"]||"—")+'</div>';});}
  h+='</div>';
  document.getElementById("fin-conciliacion").innerHTML=h;

  document.getElementById("fin-tcs").innerHTML='<div class="sec">Mis cuentas</div>'+(cuentas.length===0?ediv("Sin cuentas"):cuentas.map(function(c){return'<div style="padding:10px 0;border-bottom:1px solid #1e293b"><div style="display:flex;justify-content:space-between"><span style="font-weight:500">'+(c["Nombre"]||"Cuenta")+'</span><span style="color:#4ade80;font-weight:700">'+fmt(c["SaldoActual"])+'</span></div><div style="font-size:11px;color:#64748b">'+(c["Tipo"]||"")+(c["Banco"]?" · "+c["Banco"]:"")+'</div></div>';}).join(""));
  document.getElementById("fin-msi").innerHTML='<div class="sec">Tarjetas</div>'+(tarjetas.length===0?ediv("Sin tarjetas"):tarjetas.map(function(t){var s=+(t["SaldoActual"]||0),l=+(t["LimiteCredito"]||0),u=l>0?Math.round(s/l*100):0;return'<div style="padding:10px 0;border-bottom:1px solid #1e293b"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-weight:500">'+(t["Banco"]||"TC")+' ...'+(t["Ultimos4"]||"")+'</span><span style="color:#f87171;font-weight:600">'+fmt(s)+'</span></div><div style="font-size:11px;color:#64748b;margin-bottom:5px">Pago: '+(t["FechaLimitePago"]||"—")+'</div><div style="height:3px;background:#0f172a;border-radius:99px"><div style="height:3px;background:'+(u>80?"#f87171":u>50?"#fbbf24":"#4ade80")+';border-radius:99px;width:'+Math.min(u,100)+'%"></div></div></div>';}).join(""));
  document.getElementById("fin-tbody").innerHTML=gastos.length===0?erow(6,"Sin gastos"):
    gastos.slice().reverse().slice(0,30).map(function(g,i){var ri=gastos.length-1-i;var cp=(g["ComprobanteDrive"]||g["Comprobante Drive"])?'<a href="'+(g["ComprobanteDrive"]||g["Comprobante Drive"])+'" target="_blank" style="color:#60a5fa;font-size:11px">Ver</a>':"—";return'<tr style="cursor:pointer" onclick="showGastoDetail('+ri+')"><td style="color:#94a3b8">'+(g["Fecha"]||"—")+'</td><td style="font-weight:500">'+(g["Concepto"]||"—")+'</td><td style="color:#94a3b8">'+(g["Categoría"]||g["Categoria"]||"—")+'</td><td style="color:#fbbf24;font-weight:500">'+fmt(g["Monto"])+'</td><td style="color:#64748b">'+(g["Método de pago"]||g["Metodo de pago"]||"—")+'</td><td>'+cp+'</td></tr>';}).join("");
}

// COMPRAS
function renderCompras(){
  var c=DATA.comp||[];
  var act=c.filter(function(a){return a["Estado"]&&a["Estado"].indexOf("Cerrado")===-1;});
  document.getElementById("comp-metrics").innerHTML=
    '<div class="metric-card" style="--accent:#34d399"><div class="metric-label">Activos</div><div class="metric-val">'+act.length+'</div></div>'+
    '<div class="metric-card" style="--accent:#fbbf24"><div class="metric-label">Presupuesto</div><div class="metric-val">'+fmt(act.reduce(function(s,a){return s+(+a["Precio Estimado"]||0);},0))+'</div></div>'+
    '<div class="metric-card" style="--accent:#4ade80"><div class="metric-label">Completados</div><div class="metric-val">'+c.filter(function(a){return a["Estado"]&&a["Estado"].indexOf("Cerrado")!==-1;}).length+'</div></div>';
  document.getElementById("comp-tbody").innerHTML=c.length===0?erow(7,"Sin articulos"):
    c.map(function(a,i){return'<tr style="cursor:pointer" onclick="showArticuloDetail('+i+')"><td style="font-weight:500">'+(a["Artículo"]||a["Articulo"]||"—")+'</td><td>'+bdg(a["Prioridad"]||"Media",pc(a["Prioridad"]))+'</td><td style="color:#64748b">'+(a["Etapa"]||"0")+'</td><td>'+bdg(a["Estado"]||"—",ec(a["Estado"]))+'</td><td style="color:#94a3b8">'+fmt(a["Precio Estimado"])+'</td><td style="color:#4ade80">'+fmt(a["Precio Real"])+'</td><td style="color:#64748b">'+(a["Tienda Compra"]||"—")+'</td></tr>';}).join("");
}

// NUTRICION
function renderNutricion(){
  var menu=DATA.nut.menu||[],despensa=DATA.nut.despensa||[],compras=DATA.nut.compras||[],historial=DATA.nut.historial||[];
  var tCal=menu.reduce(function(s,m){return s+(+m["Calorias"]||+m["Calorías"]||0);},0);
  var tProt=menu.reduce(function(s,m){return s+(+m["Proteina (g)"]||+m["Proteína (g)"]||0);},0);
  var dias=menu.length>0?Math.max(1,Math.ceil(menu.length/3)):1;
  document.getElementById("nut-metrics").innerHTML=
    '<div class="metric-card" style="--accent:#34d399"><div class="metric-label">Platillos</div><div class="metric-val">'+menu.length+'</div></div>'+
    '<div class="metric-card" style="--accent:#fbbf24"><div class="metric-label">Cal/dia</div><div class="metric-val">'+(menu.length>0?Math.round(tCal/dias):"—")+'</div></div>'+
    '<div class="metric-card" style="--accent:#60a5fa"><div class="metric-label">Prot/dia</div><div class="metric-val">'+(menu.length>0?Math.round(tProt/dias)+"g":"—")+'</div></div>'+
    '<div class="metric-card" style="--accent:#a78bfa"><div class="metric-label">En despensa</div><div class="metric-val">'+despensa.filter(function(d){return d["Disponible"]!=="No";}).length+'</div></div>';
  document.getElementById("nut-menu-tbody").innerHTML=menu.length===0?erow(7,"El agente generara el menu este domingo"):menu.map(function(m){var rec=m["Receta URL"]?'<a href="'+m["Receta URL"]+'" target="_blank" style="color:#60a5fa;font-size:11px">Ver</a>':"—";return'<tr><td style="color:#94a3b8">'+(m["Dia"]||m["Día"]||"—")+'</td><td>'+(m["Tiempo"]||"—")+'</td><td style="font-weight:500">'+(m["Platillo"]||"—")+'</td><td style="color:#fbbf24">'+(m["Calorias"]||m["Calorías"]||"—")+'</td><td style="color:#4ade80">'+(m["Proteina (g)"]||m["Proteína (g)"]||"—")+'</td><td style="color:#f87171">'+(m["Carbohidratos (g)"]||"—")+'</td><td>'+rec+'</td></tr>';}).join("");
  document.getElementById("nut-despensa-tbody").innerHTML=despensa.length===0?erow(6,"Sin inventario"):despensa.map(function(d){return'<tr><td style="font-weight:500">'+(d["Ingrediente"]||"—")+'</td><td style="color:#94a3b8">'+(d["Categoria"]||"—")+'</td><td>'+(d["Cantidad"]||"—")+'</td><td style="color:#64748b">'+(d["Unidad"]||"—")+'</td><td style="color:#f87171">'+(d["Fecha Caducidad"]||"—")+'</td><td>'+bdg(d["Disponible"]||"Si",d["Disponible"]==="No"?"#f87171":"#4ade80")+'</td></tr>';}).join("");
  document.getElementById("nut-compras-tbody").innerHTML=compras.length===0?erow(4,"Sin lista"):compras.map(function(c){return'<tr><td style="font-weight:500">'+(c["Ingrediente"]||"—")+'</td><td style="color:#94a3b8">'+(c["Categoria"]||"—")+'</td><td>'+(c["Cantidad"]||"—")+'</td><td>'+bdg(c["Comprado"]||"No",c["Comprado"]==="Si"?"#4ade80":"#f87171")+'</td></tr>';}).join("");
  document.getElementById("nut-hist-tbody").innerHTML=historial.length===0?erow(6,"Sin historial"):historial.slice().reverse().slice(0,30).map(function(h){return'<tr><td style="color:#94a3b8">'+(h["Fecha"]||"—")+'</td><td>'+(h["Tiempo"]||"—")+'</td><td style="font-weight:500">'+(h["Platillo"]||"—")+'</td><td style="color:#fbbf24">'+(h["Calorias"]||h["Calorías"]||"—")+'</td><td style="color:#4ade80">'+(h["Proteina (g)"]||"—")+'</td><td style="color:#f87171">'+(h["Carbohidratos (g)"]||"—")+'</td></tr>';}).join("");
}

checkSession();