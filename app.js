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
    fetchSheetWithRows(CONFIG.SHEETS.finanzas,"Gastos"),
    fetchSheetWithRows(CONFIG.SHEETS.finanzas,"Tarjetas"),
    fetchSheetWithRows(CONFIG.SHEETS.finanzas,"MSIActivos"),
    fetchSheet(CONFIG.SHEETS.compras, "Articulos"),
    fetchSheet(CONFIG.SHEETS.hogar,   "MenuSemanal"),
    fetchSheet(CONFIG.SHEETS.hogar,   "Despensa"),
    fetchSheet(CONFIG.SHEETS.hogar,   "ListadeCompras"),
    fetchSheet(CONFIG.SHEETS.hogar,   "HistorialNutricional"),
    fetchSheetWithRows(CONFIG.SHEETS.finanzas,"Cuentas"),
    fetchSheetWithRows(CONFIG.SHEETS.finanzas,"Movimientos"),
    fetchSheetWithRows(CONFIG.SHEETS.finanzas,"AlertasFinancieras")
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

// ============================================================
// HOGAR — TREEVIEW DE TAREAS CON SUBTAREAS EXPANDIBLES
// ============================================================

// Estado de expansión global
var treeExpanded = {};

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

  // Renderizar treeview
  renderTareaTreeView();

  // Salir hoy
  var calleItems=tareas.filter(function(t){return(t["RequiereSalir"]==="Sí"||t["RequiereSalir"]==="Si")&&t["Estado"]&&t["Estado"].indexOf("Completo")===-1;}).concat(DATA.hogar.tramites.filter(function(t){return(t["RequiereSalir"]==="Sí"||t["RequiereSalir"]==="Si")&&t["Estado"]&&t["Estado"].indexOf("Completo")===-1;}));
  if(calleItems.length===0){document.getElementById("hogar-calle-content").innerHTML=ediv("Sin pendientes que requieran salir hoy");}
  else{var z={};calleItems.forEach(function(t){var zn=t["Zona"]||"Sin zona";if(!z[zn])z[zn]=[];z[zn].push(t);});document.getElementById("hogar-calle-content").innerHTML=Object.keys(z).map(function(zn){return'<div style="margin-bottom:14px"><div style="font-size:12px;font-weight:600;color:#60a5fa;margin-bottom:6px">📍 '+zn.toUpperCase()+'</div>'+z[zn].map(function(t){return'<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1e293b"><span>'+(t["Nombre"]||t["Descripción"]||t["Tipo Tramite"]||"—")+'</span>'+bdg(t["Prioridad"]||"Media",pc(t["Prioridad"]))+'</div>';}).join("")+'</div>';}).join("")+'<div style="padding:10px;background:#0f172a;border-radius:8px;font-size:13px;border:1px solid #334155">'+calleItems.length+' pendiente(s) en '+Object.keys(z).length+' zona(s)</div>';}

  document.getElementById("hogar-salud-tbody").innerHTML=DATA.hogar.salud.length===0?erow(6,"Sin registros"):DATA.hogar.salud.map(function(s){return'<tr><td>'+(s["Miembro Familia"]||"—")+'</td><td>'+(s["Tipo Registro"]||"—")+'</td><td>'+(s["Descripción"]||"—")+'</td><td style="color:#94a3b8">'+(s["Doctor / Centro"]||"—")+'</td><td>'+(s["Fecha"]||"—")+'</td><td style="color:#4ade80">'+(s["Próxima Cita"]||"—")+'</td></tr>';}).join("");
  document.getElementById("hogar-mascotas-tbody").innerHTML=DATA.hogar.mascotas.length===0?erow(6,"Sin registros"):DATA.hogar.mascotas.map(function(m){return'<tr><td>'+(m["Nombre Mascota"]||"—")+'</td><td>'+(m["Tipo Registro"]||"—")+'</td><td>'+(m["Descripción"]||"—")+'</td><td>'+(m["Veterinario"]||"—")+'</td><td>'+(m["Fecha"]||"—")+'</td><td style="color:#4ade80">'+(m["Fecha Próxima Vacuna"]||"—")+'</td></tr>';}).join("");
  document.getElementById("hogar-tramites-tbody").innerHTML=DATA.hogar.tramites.length===0?erow(6,"Sin tramites"):DATA.hogar.tramites.map(function(t){return'<tr><td>'+(t["Tipo Trámite"]||t["Tipo Tramite"]||"—")+'</td><td>'+(t["Descripción"]||"—")+'</td><td>'+(t["Responsable"]||"—")+'</td><td>'+bdg(t["Estado"]||"—",ec(t["Estado"]))+'</td><td style="color:#fbbf24">'+(t["Fecha Límite"]||t["Fecha Limite"]||"—")+'</td><td>'+(t["Institución"]||t["Institucion"]||"—")+'</td></tr>';}).join("");
}

function renderTareaTreeView(){
  var tareas=DATA.hogar.tareas, subs=DATA.hogar.subtareas;
  var hoyD=new Date();hoyD.setHours(0,0,0,0);
  var container=document.getElementById("hogar-tareas-tree");
  if(!container)return;
  if(tareas.length===0){container.innerHTML=ediv("Sin tareas");return;}

  var html="";
  tareas.forEach(function(t,i){
    var idTarea=t["ID Tarea"]||t["ID_Tarea"]||("t"+i);
    var misSubs=subs.filter(function(s){return s["ID Tarea Padre"]===idTarea;});
    var nombre=t["Nombre"]||t["Descripción"]||"—";
    var fls=t["Fecha Límite"]||t["Fecha Limite"]||"";
    var dias=0,nc="#64748b",dl="";
    if(fls&&t["Estado"]&&t["Estado"].indexOf("Completo")===-1){
      var fl=new Date(fls);fl.setHours(0,0,0,0);
      dias=Math.round((hoyD-fl)/(1000*60*60*24));
      if(dias>7){nc="#f87171";dl='<span style="color:#f87171;font-size:10px;margin-left:4px">🚨'+dias+'d</span>';}
      else if(dias>=3){nc="#f87171";dl='<span style="color:#f87171;font-size:10px;margin-left:4px">🔴'+dias+'d</span>';}
      else if(dias>=0){nc="#fb923c";dl='<span style="color:#fb923c;font-size:10px;margin-left:4px">🟠</span>';}
      else if(dias>=-3){nc="#fbbf24";dl='<span style="color:#fbbf24;font-size:10px;margin-left:4px">🟡'+Math.abs(dias)+'d</span>';}
    }
    var hasSubs=misSubs.length>0;
    var isExpanded=treeExpanded[idTarea]===true;
    var subsPend=misSubs.filter(function(s){return s["Estado"]&&s["Estado"].indexOf("Completo")===-1;}).length;
    var subsComp=misSubs.filter(function(s){return s["Estado"]&&s["Estado"].indexOf("Completo")!==-1;}).length;

    // Fila de tarea principal
    html+='<div class="tree-task-row" id="tree-row-'+i+'" style="border-left:'+(dias>0?'2px solid '+nc:'2px solid transparent')+'">'+
      '<div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0">'+
      (hasSubs
        ? '<button class="tree-toggle" onclick="toggleTree(\''+idTarea+'\','+i+')" title="'+(isExpanded?"Colapsar":"Expandir")+'">'+(isExpanded?'▼':'▶')+'</button>'
        : '<span class="tree-toggle-placeholder"></span>'
      )+
      '<div style="flex:1;min-width:0">'+
      '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'+
      '<span class="tree-task-name" onclick="showTareaDetail('+i+')" title="Ver detalle">'+nombre+'</span>'+
      dl+
      (hasSubs?'<span style="font-size:10px;color:#64748b;background:#0f172a;border:1px solid #334155;border-radius:99px;padding:1px 6px">'+subsComp+'/'+misSubs.length+'</span>':'')+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:5px;margin-top:3px;flex-wrap:wrap">'+
      '<span style="font-size:11px;color:#64748b">'+(t["Categoría"]||"—")+'</span>'+
      (fls?'<span style="font-size:11px;color:'+(dias>0?nc:"#64748b")+'">· '+fls+'</span>':'')+
      '</div>'+
      '</div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0">'+
      bdg(t["Prioridad"]||"Media",pc(t["Prioridad"]))+
      bdg(t["Estado"]||"—",ec(t["Estado"]))+
      '<button class="tree-edit-btn" onclick="editTarea('+i+')" title="Editar">✏️</button>'+
      '</div>'+
      '</div>';

    // Contenedor de subtareas (colapsable)
    html+='<div class="tree-subs-container" id="tree-subs-'+idTarea+'" style="display:'+(isExpanded?"block":"none")+';">';
    if(hasSubs){
      misSubs.forEach(function(s,si){
        var subIdx=subs.indexOf(s);
        html+=renderSubtareaRow(s,subIdx,idTarea,si);
      });
    }
    html+='</div>';
  });

  container.innerHTML=html;
}

function renderSubtareaRow(s,subIdx,idPadre,si){
  var nombre=s["Descripción Subtarea"]||s["Nombre"]||"—";
  var estado=s["Estado"]||"Pendiente";
  var isComp=estado.indexOf("Completo")!==-1;
  return '<div class="tree-sub-row" id="tree-sub-row-'+subIdx+'">'+
    '<div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0">'+
    '<span style="color:'+ec(estado)+';font-size:12px">'+(isComp?"✓":"○")+'</span>'+
    '<span class="tree-sub-name'+(isComp?' tree-sub-done':'')+'">'+nombre+'</span>'+
    (s["Asignado A"]?'<span style="font-size:10px;color:#64748b;flex-shrink:0">@'+s["Asignado A"]+'</span>':'')+
    '</div>'+
    '<div style="display:flex;align-items:center;gap:5px;flex-shrink:0">'+
    bdg(estado,ec(estado))+
    '<button class="tree-edit-btn" onclick="editSubtarea('+subIdx+')" title="Editar subtarea">✏️</button>'+
    '</div>'+
    '</div>';
}

function toggleTree(idTarea,rowIdx){
  treeExpanded[idTarea]=!treeExpanded[idTarea];
  var cont=document.getElementById("tree-subs-"+idTarea);
  var row=document.getElementById("tree-row-"+rowIdx);
  if(!cont)return;
  var isNowOpen=treeExpanded[idTarea];
  cont.style.display=isNowOpen?"block":"none";
  var btn=row?row.querySelector(".tree-toggle"):null;
  if(btn)btn.textContent=isNowOpen?"▼":"▶";
}

// ============================================================
// EDIT TAREA (modal inline)
// ============================================================
function editTarea(idx){
  var t=DATA.hogar.tareas[idx];
  if(!t)return;
  var nombre=t["Nombre"]||t["Descripción"]||"";
  var estado=t["Estado"]||"Pendiente";
  var prioridad=t["Prioridad"]||"Media";
  var fecha=t["Fecha Límite"]||t["Fecha Limite"]||"";
  var asignado=t["Asignado A"]||"";
  var notas=t["Notas"]||"";

  var ESTADOS=["Pendiente","Planeando","En Proceso","En Prueba","Completo","Bloqueado","Cancelado"];
  var PRIORIDADES=["Alta","Media","Baja"];

  var h='<div class="det-header"><div class="det-back" onclick="closeDetail()">← Hogar</div><div class="det-title">✏️ Editar Tarea</div></div>'+
    '<div class="edit-form">'+
    '<div class="edit-field"><label class="edit-label">Nombre</label><input class="edit-input" id="ef-nombre" type="text" value="'+escHtml(nombre)+'"/></div>'+
    '<div class="edit-row">'+
    '<div class="edit-field"><label class="edit-label">Estado</label><select class="edit-select" id="ef-estado">'+ESTADOS.map(function(e){return'<option'+(e===estado?' selected':'')+'>'+e+'</option>';}).join("")+'</select></div>'+
    '<div class="edit-field"><label class="edit-label">Prioridad</label><select class="edit-select" id="ef-prioridad">'+PRIORIDADES.map(function(p){return'<option'+(p===prioridad?' selected':'')+'>'+p+'</option>';}).join("")+'</select></div>'+
    '</div>'+
    '<div class="edit-row">'+
    '<div class="edit-field"><label class="edit-label">Fecha Límite</label><input class="edit-input" id="ef-fecha" type="date" value="'+fecha+'"/></div>'+
    '<div class="edit-field"><label class="edit-label">Asignado A</label><input class="edit-input" id="ef-asignado" type="text" value="'+escHtml(asignado)+'"/></div>'+
    '</div>'+
    '<div class="edit-field"><label class="edit-label">Notas</label><textarea class="edit-textarea" id="ef-notas" rows="3">'+escHtml(notas)+'</textarea></div>'+
    '<div class="edit-actions">'+
    '<button class="edit-cancel-btn" onclick="closeDetail()">Cancelar</button>'+
    '<button class="edit-save-btn" onclick="saveTarea('+idx+')">Guardar cambios</button>'+
    '</div>'+
    '<div class="edit-note">Los cambios se guardan localmente. Para persistir en el Sheet, usa el agente vía email.</div>'+
    '</div>';
  openDetail(h);
}

function saveTarea(idx){
  var t=DATA.hogar.tareas[idx];
  if(!t)return;
  var n=document.getElementById("ef-nombre").value.trim();
  var e=document.getElementById("ef-estado").value;
  var p=document.getElementById("ef-prioridad").value;
  var f=document.getElementById("ef-fecha").value;
  var a=document.getElementById("ef-asignado").value.trim();
  var nt=document.getElementById("ef-notas").value.trim();
  if(!n){alert("El nombre no puede estar vacío");return;}
  // Actualizar en DATA (en memoria)
  if(t["Nombre"]!==undefined)t["Nombre"]=n;
  else t["Descripción"]=n;
  t["Estado"]=e;
  t["Prioridad"]=p;
  if(t["Fecha Límite"]!==undefined)t["Fecha Límite"]=f;else t["Fecha Limite"]=f;
  t["Asignado A"]=a;
  t["Notas"]=nt;
  closeDetail();
  renderHogar();
  showToast("Tarea actualizada ✓");
}

// ============================================================
// EDIT SUBTAREA
// ============================================================
function editSubtarea(subIdx){
  var s=DATA.hogar.subtareas[subIdx];
  if(!s)return;
  var nombre=s["Descripción Subtarea"]||s["Nombre"]||"";
  var estado=s["Estado"]||"Pendiente";
  var asignado=s["Asignado A"]||"";
  var notas=s["Notas"]||s["Descripción"]||"";

  var ESTADOS=["Pendiente","En Proceso","Completo","Bloqueado","Cancelado"];

  var h='<div class="det-header"><div class="det-back" onclick="closeDetail()">← Subtareas</div><div class="det-title">✏️ Editar Subtarea</div></div>'+
    '<div class="edit-form">'+
    '<div class="edit-field"><label class="edit-label">Descripción</label><input class="edit-input" id="esf-nombre" type="text" value="'+escHtml(nombre)+'"/></div>'+
    '<div class="edit-row">'+
    '<div class="edit-field"><label class="edit-label">Estado</label><select class="edit-select" id="esf-estado">'+ESTADOS.map(function(e){return'<option'+(e===estado?' selected':'')+'>'+e+'</option>';}).join("")+'</select></div>'+
    '<div class="edit-field"><label class="edit-label">Asignado A</label><input class="edit-input" id="esf-asignado" type="text" value="'+escHtml(asignado)+'"/></div>'+
    '</div>'+
    '<div class="edit-field"><label class="edit-label">Notas</label><textarea class="edit-textarea" id="esf-notas" rows="3">'+escHtml(notas)+'</textarea></div>'+
    '<div class="edit-actions">'+
    '<button class="edit-cancel-btn" onclick="closeDetail()">Cancelar</button>'+
    '<button class="edit-save-btn" onclick="saveSubtarea('+subIdx+')">Guardar cambios</button>'+
    '</div>'+
    '<div class="edit-note">Los cambios se guardan localmente. Para persistir en el Sheet, usa el agente vía email.</div>'+
    '</div>';
  openDetail(h);
}

function saveSubtarea(subIdx){
  var s=DATA.hogar.subtareas[subIdx];
  if(!s)return;
  var n=document.getElementById("esf-nombre").value.trim();
  var e=document.getElementById("esf-estado").value;
  var a=document.getElementById("esf-asignado").value.trim();
  var nt=document.getElementById("esf-notas").value.trim();
  if(!n){alert("La descripción no puede estar vacía");return;}
  if(s["Descripción Subtarea"]!==undefined)s["Descripción Subtarea"]=n;
  else s["Nombre"]=n;
  s["Estado"]=e;
  s["Asignado A"]=a;
  s["Notas"]=nt;
  closeDetail();
  renderTareaTreeView();
  showToast("Subtarea actualizada ✓");
}

function showTareaDetail(idx){
  var t=DATA.hogar.tareas[idx];if(!t)return;
  var nombre=t["Nombre"]||t["Descripción"]||"—";
  var subs=DATA.hogar.subtareas.filter(function(s){return s["ID Tarea Padre"]===t["ID Tarea"]||s["ID Tarea Padre"]===t["ID_Tarea"];});
  var h='<div class="det-header">'+
    '<div class="det-back" onclick="closeDetail()">← Hogar</div>'+
    '<div style="display:flex;justify-content:space-between;align-items:flex-start">'+
    '<div class="det-title">'+nombre+'</div>'+
    '<button class="edit-save-btn" style="font-size:12px;padding:5px 10px" onclick="closeDetail();editTarea('+idx+')">✏️ Editar</button>'+
    '</div>'+
    '<div class="det-sub">'+(t["Categoría"]||"—")+(t["Subcategoría"]?" · "+t["Subcategoría"]:"")+'</div></div>';
  h+='<div class="det-badges">'+bdg(t["Estado"]||"Pendiente",ec(t["Estado"]))+' '+bdg(t["Prioridad"]||"Media",pc(t["Prioridad"]))+'</div>';
  h+='<div class="det-grid">'+fld("Asignado a",t["Asignado A"])+fld("Fecha Limite",t["Fecha Límite"]||t["Fecha Limite"])+fld("Recurrencia",t["Recurrencia"])+fld("Requiere Salir",t["RequiereSalir"])+fld("Zona",t["Zona"])+fld("Direccion",t["DireccionReferencia"])+'</div>';
  if(t["Notas"])h+='<div class="det-section"><div class="det-section-title">Notas</div><div class="det-notes">'+t["Notas"]+'</div></div>';
  if(t["Descripción"]&&t["Descripción"]!==nombre)h+='<div class="det-section"><div class="det-section-title">Descripcion</div><div class="det-notes">'+t["Descripción"]+'</div></div>';
  if(subs.length>0){
    h+='<div class="det-section"><div class="det-section-title" style="display:flex;justify-content:space-between">Subtareas ('+subs.length+')</div>';
    subs.forEach(function(s,si){
      var subIdx=DATA.hogar.subtareas.indexOf(s);
      h+='<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #1e293b">'+
        '<div style="font-size:13px">'+(s["Descripción Subtarea"]||s["Nombre"]||"—")+'</div>'+
        '<div style="display:flex;align-items:center;gap:6px">'+
        bdg(s["Estado"]||"Pendiente",ec(s["Estado"]))+
        '<button class="edit-save-btn" style="font-size:11px;padding:3px 8px" onclick="closeDetail();editSubtarea('+subIdx+')">✏️</button>'+
        '</div>'+
        '</div>';
    });
    h+='</div>';
  }
  openDetail(h);
}

// ============================================================
// UTILS
// ============================================================
function escHtml(s){return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}

function showToast(msg){
  var t=document.getElementById("toast-msg");
  if(!t){t=document.createElement("div");t.id="toast-msg";t.style.cssText="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1d4ed8;color:#fff;padding:10px 20px;border-radius:99px;font-size:13px;font-weight:600;z-index:999;box-shadow:0 4px 20px #0004;transition:opacity .3s";document.body.appendChild(t);}
  t.textContent=msg;t.style.opacity="1";
  clearTimeout(t._timer);
  t._timer=setTimeout(function(){t.style.opacity="0";},2500);
}

// ============================================================

// ============================================================
// FINANZAS — CRUD COMPLETO
// Cuentas (efectivo/débito/ahorro) + Tarjetas crédito
// Movimientos que afectan saldos + Conciliación en tiempo real
// Escribe a Google Sheets via OAuth (sheets.googleapis.com)
// ============================================================

// ── Estado OAuth ────────────────────────────────────────────
var FIN_TOKEN = null; // access_token OAuth para escritura

// Solicitar token OAuth con scope de escritura
function requestFinToken(onSuccess){
  if(FIN_TOKEN){onSuccess();return;}
  // Usar Google Identity Services (ya cargado para login)
  var client = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.GOOGLE_API_KEY ? undefined : null,
    // Reusar el client_id del login de la app
    client_id: "715701428085-ouqraaqrh6s4qb9ho7mtec3h57u08fhn.apps.googleusercontent.com",
    scope: "https://www.googleapis.com/auth/spreadsheets",
    callback: function(resp){
      if(resp.error){showToast("Error de autenticación: "+resp.error);return;}
      FIN_TOKEN = resp.access_token;
      onSuccess();
    }
  });
  client.requestAccessToken();
}

// ── Escritura a Sheets ───────────────────────────────────────

// Agrega una fila al final de un tab
function appendRow(sheetId, tab, values, cb){
  var url="https://sheets.googleapis.com/v4/spreadsheets/"+sheetId+"/values/"+encodeURIComponent(tab)+"!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS";
  fetch(url,{
    method:"POST",
    headers:{"Authorization":"Bearer "+FIN_TOKEN,"Content-Type":"application/json"},
    body:JSON.stringify({values:[values]})
  }).then(function(r){return r.json();}).then(function(d){
    if(d.error){showToast("Error al guardar: "+d.error.message);}
    else{if(cb)cb(d);}
  }).catch(function(e){showToast("Error de red: "+e.message);});
}

// Actualiza una fila específica (por número de fila Google Sheets, base 1 + 1 header = fila 2+)
function updateRow(sheetId, tab, rowNum, values, cb){
  var cols = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var endCol = cols[values.length-1] || "Z";
  var range = encodeURIComponent(tab)+"!A"+rowNum+":"+endCol+rowNum;
  var url="https://sheets.googleapis.com/v4/spreadsheets/"+sheetId+"/values/"+range+"?valueInputOption=USER_ENTERED";
  fetch(url,{
    method:"PUT",
    headers:{"Authorization":"Bearer "+FIN_TOKEN,"Content-Type":"application/json"},
    body:JSON.stringify({values:[values]})
  }).then(function(r){return r.json();}).then(function(d){
    if(d.error){showToast("Error al actualizar: "+d.error.message);}
    else{if(cb)cb(d);}
  }).catch(function(e){showToast("Error de red: "+e.message);});
}

// Borra contenido de una fila (la deja vacía — Sheets no elimina filas fácilmente via API básica)
function clearRow(sheetId, tab, rowNum, numCols, cb){
  var cols="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var endCol=cols[numCols-1]||"Z";
  var range=encodeURIComponent(tab)+"!A"+rowNum+":"+endCol+rowNum;
  fetch("https://sheets.googleapis.com/v4/spreadsheets/"+sheetId+"/values/"+range+":clear",{
    method:"POST",
    headers:{"Authorization":"Bearer "+FIN_TOKEN,"Content-Type":"application/json"}
  }).then(function(r){return r.json();}).then(function(d){
    if(d.error){showToast("Error al eliminar: "+d.error.message);}
    else{if(cb)cb(d);}
  }).catch(function(e){showToast("Error de red: "+e.message);});
}

// Leer con filas + índice para saber número de fila en Sheet
function fetchSheetWithRows(id, tab){
  var url="https://sheets.googleapis.com/v4/spreadsheets/"+id+"/values/"+encodeURIComponent(tab.trim())+"?key="+CONFIG.GOOGLE_API_KEY;
  return fetch(url).then(function(r){return r.json();}).then(function(d){
    if(d.error||!d.values||d.values.length<2)return[];
    var h=d.values[0];
    return d.values.slice(1).map(function(row,i){
      var o={_rowNum:i+2}; // fila 1=header, datos desde fila 2
      h.forEach(function(k,j){o[k.trim()]=(row[j]||"").trim();});
      return o;
    });
  }).catch(function(){return[];});
}

// ── Helpers ──────────────────────────────────────────────────
function getSaldo(obj){return +(obj["SaldoActual"]||obj["Saldo Actual"]||obj["saldo"]||obj["Saldo"]||0);}
function getLimite(obj){return +(obj["LimiteCredito"]||obj["Límite Crédito"]||obj["LimiteCredito"]||0);}
function getPago(obj){return obj["FechaLimitePago"]||obj["Fecha Limite Pago"]||obj["Fecha Límite Pago"]||"—";}
function getUltimos(obj){return obj["Ultimos4"]||obj["Últimos 4"]||obj["ultimos4"]||"";}
function getBanco(obj){return obj["Banco"]||obj["banco"]||obj["Nombre"]||obj["nombre"]||"Cuenta";}
function getTipo(obj){return obj["Tipo"]||obj["tipo"]||"";}
function hoy(){return new Date().toISOString().slice(0,10);}

// ── RENDER PRINCIPAL FINANZAS ────────────────────────────────
function renderFinanzas(){
  var gastos=DATA.fin.gastos||[];
  var tcs=DATA.fin.tcs||[];
  var cuentas=(DATA.fin.cuentas||[]).filter(function(c){var a=c["Activa"]||"";return a!=="No"&&a!=="no";});
  var tarjetas=tcs.filter(function(t){var a=t["Activa"]||"";return a!=="No"&&a!=="no";});
  var alertas=(DATA.fin.alertas||[]).filter(function(a){var at=a["Atendida"]||"";return at!=="Sí"&&at!=="Si";});
  var now=new Date();

  var totalC=cuentas.reduce(function(s,c){return s+getSaldo(c);},0);
  var totalT=tarjetas.reduce(function(s,t){return s+getSaldo(t);},0);
  var sc=totalC-totalT;
  var scc=sc>(totalT*2)||totalT===0?"#4ade80":sc>0?"#fbbf24":"#f87171";
  var sem=sc>(totalT*2)||totalT===0?"Saludable":sc>0?"Atención":"Crítico";

  var gM=gastos.filter(function(g){
    try{var f=new Date(g["Fecha"]||"");return f.getMonth()===now.getMonth()&&f.getFullYear()===now.getFullYear();}
    catch(e){return false;}
  });
  var totG=gM.reduce(function(s,g){return s+(+(g["Monto"]||0));},0);

  // Métricas
  document.getElementById("fin-metrics").innerHTML=
    '<div class="metric-card" style="--accent:#4ade80"><div class="metric-label">Total cuentas</div><div class="metric-val">'+fmt(totalC)+'</div><div class="metric-sub">'+cuentas.length+' activa(s)</div></div>'+
    '<div class="metric-card" style="--accent:#f87171"><div class="metric-label">Deuda tarjetas</div><div class="metric-val">'+fmt(totalT)+'</div><div class="metric-sub">'+tarjetas.length+' tarjeta(s)</div></div>'+
    '<div class="metric-card" style="--accent:'+scc+'"><div class="metric-label">Saldo conciliado</div><div class="metric-val">'+fmt(sc)+'</div><div class="metric-sub">'+sem+'</div></div>'+
    '<div class="metric-card" style="--accent:#fbbf24"><div class="metric-label">Gastos del mes</div><div class="metric-val">'+fmt(totG)+'</div><div class="metric-sub">'+gM.length+' mov.</div></div>'+
    (alertas.length>0?'<div class="metric-card" style="--accent:#f87171"><div class="metric-label">Alertas</div><div class="metric-val">'+alertas.length+'</div></div>':"");

  renderFinConciliacion(cuentas, tarjetas, sc, scc, sem, alertas);
  renderFinCuentas(cuentas);
  renderFinTarjetas(tarjetas);
  renderFinGastos(gastos);
}

// ── CONCILIACIÓN ─────────────────────────────────────────────
function renderFinConciliacion(cuentas, tarjetas, sc, scc, sem, alertas){
  var h='<div class="card" style="margin-bottom:10px">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">'+
    '<div class="sec" style="margin:0">Conciliación</div>'+
    '</div>';

  h+='<div style="background:#0f172a;border-radius:8px;padding:16px;border:1px solid #334155;font-size:13px">';

  // Cuentas
  h+='<div style="font-size:11px;font-weight:600;color:#4ade80;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">(+) Efectivo / Cuentas</div>';
  if(cuentas.length===0){
    h+='<div style="color:#475569;font-size:12px;padding:6px 0 10px">Sin cuentas. Agrega una con el botón de arriba.</div>';
  } else {
    cuentas.forEach(function(c){
      h+='<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0">'+
        '<span style="color:#94a3b8">'+getBanco(c)+' <span style="font-size:11px;color:#475569">['+getTipo(c)+']</span></span>'+
        '<span style="color:#4ade80;font-weight:600">'+fmt(getSaldo(c))+'</span>'+
        '</div>';
    });
  }

  h+='<div style="display:flex;justify-content:space-between;padding:7px 0;border-top:1px solid #334155;margin-top:4px">'+
    '<span style="color:#64748b;font-size:12px">Total disponible</span>'+
    '<span style="color:#4ade80;font-weight:700">'+fmt(cuentas.reduce(function(s,c){return s+getSaldo(c);},0))+'</span>'+
    '</div>';

  // Tarjetas
  h+='<div style="font-size:11px;font-weight:600;color:#f87171;text-transform:uppercase;letter-spacing:.06em;margin:10px 0 8px">(−) Tarjetas de crédito</div>';
  if(tarjetas.length===0){
    h+='<div style="color:#475569;font-size:12px;padding:4px 0">Sin tarjetas.</div>';
  } else {
    tarjetas.forEach(function(t){
      var sd=getSaldo(t);
      if(sd>0){
        h+='<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0">'+
          '<span style="color:#94a3b8">(−) '+getBanco(t)+(getUltimos(t)?' ···'+getUltimos(t):'')+
          ' <span style="font-size:11px;color:#475569">vence '+getPago(t)+'</span></span>'+
          '<span style="color:#f87171">'+fmt(sd)+'</span>'+
          '</div>';
      }
    });
  }

  h+='<div style="border-top:1px solid #60a5fa44;margin:10px 0 8px"></div>'+
    '<div style="display:flex;justify-content:space-between;align-items:center">'+
    '<span style="font-weight:700;font-size:14px">(=) Saldo Conciliado</span>'+
    '<span style="color:'+scc+';font-weight:800;font-size:22px">'+fmt(sc)+'</span>'+
    '</div>'+
    '<div style="text-align:right;font-size:12px;color:'+scc+';margin-top:3px">'+sem+'</div>';
  h+='</div>';

  // Alertas
  if(alertas.length>0){
    h+='<div style="margin-top:10px">';
    alertas.slice(0,4).forEach(function(a){
      var c=(a["Severidad"]||"").indexOf("Critica")!==-1?"#f87171":"#fbbf24";
      h+='<div style="background:'+c+'15;border:1px solid '+c+'33;border-radius:6px;padding:7px 12px;margin-bottom:5px;font-size:12px;color:'+c+'">'+
        '<strong>'+(a["TipoAlerta"]||"Alerta")+'</strong> — '+(a["Descripcion"]||a["Descripción"]||"—")+'</div>';
    });
    h+='</div>';
  }
  h+='</div>';
  document.getElementById("fin-conciliacion").innerHTML=h;
}

// ── PANEL CUENTAS (efectivo/débito/ahorro) ───────────────────
function renderFinCuentas(cuentas){
  var allCuentas=DATA.fin.cuentas||[];
  var h='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'+
    '<div class="sec" style="margin:0">Mis Cuentas</div>'+
    '<button class="fin-add-btn" onclick="openCuentaForm(null)">+ Agregar</button>'+
    '</div>';

  if(allCuentas.length===0){
    h+=ediv("Sin cuentas — agrega una con el botón");
  } else {
    allCuentas.forEach(function(c,i){
      var activa=(c["Activa"]||"")!=="No";
      h+='<div style="padding:10px 0;border-bottom:1px solid #1e293b;opacity:'+(activa?1:.5)+'" >'+
        '<div style="display:flex;justify-content:space-between;align-items:center">'+
        '<div>'+
        '<div style="font-weight:600;font-size:13px">'+getBanco(c)+'</div>'+
        '<div style="font-size:11px;color:#64748b">'+getTipo(c)+(c["Banco"]&&c["Nombre"]&&c["Banco"]!==c["Nombre"]?" · "+c["Banco"]:"")+'</div>'+
        '</div>'+
        '<div style="text-align:right">'+
        '<div style="color:#4ade80;font-weight:700;font-size:15px">'+fmt(getSaldo(c))+'</div>'+
        '<div style="display:flex;gap:5px;justify-content:flex-end;margin-top:4px">'+
        '<button class="fin-icon-btn" onclick="openMovimientoForm(\'cuenta\','+i+')" title="Registrar movimiento">💸</button>'+
        '<button class="fin-icon-btn" onclick="openCuentaForm('+i+')" title="Editar">✏️</button>'+
        '<button class="fin-icon-btn" onclick="deleteCuenta('+i+')" title="Eliminar" style="color:#f87171">🗑</button>'+
        '</div>'+
        '</div>'+
        '</div>'+
        '</div>';
    });
  }
  document.getElementById("fin-tcs").innerHTML=h;
}

// ── PANEL TARJETAS ───────────────────────────────────────────
function renderFinTarjetas(tarjetas){
  var allTcs=DATA.fin.tcs||[];
  var h='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'+
    '<div class="sec" style="margin:0">Tarjetas de Crédito</div>'+
    '<button class="fin-add-btn" onclick="openTarjetaForm(null)">+ Agregar</button>'+
    '</div>';

  if(allTcs.length===0){
    h+=ediv("Sin tarjetas — agrega una con el botón");
  } else {
    allTcs.forEach(function(t,i){
      var sd=getSaldo(t),lm=getLimite(t),u=lm>0?Math.round(sd/lm*100):0;
      var activa=(t["Activa"]||"")!=="No";
      var barColor=u>80?"#f87171":u>50?"#fbbf24":"#4ade80";
      h+='<div style="padding:10px 0;border-bottom:1px solid #1e293b;opacity:'+(activa?1:.5)+'">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start">'+
        '<div>'+
        '<div style="font-weight:600;font-size:13px">'+getBanco(t)+(getUltimos(t)?' <span style="font-size:11px;color:#64748b">···'+getUltimos(t)+'</span>':'')+' </div>'+
        '<div style="font-size:11px;color:#64748b">Pago: '+getPago(t)+(lm?' · Límite: '+fmt(lm):'')+'</div>'+
        '</div>'+
        '<div style="text-align:right">'+
        '<div style="color:#f87171;font-weight:700;font-size:15px">'+fmt(sd)+'</div>'+
        '<div style="display:flex;gap:5px;justify-content:flex-end;margin-top:4px">'+
        '<button class="fin-icon-btn" onclick="openMovimientoForm(\'tarjeta\','+i+')" title="Registrar cargo/pago">💳</button>'+
        '<button class="fin-icon-btn" onclick="openTarjetaForm('+i+')" title="Editar">✏️</button>'+
        '<button class="fin-icon-btn" onclick="deleteTarjeta('+i+')" title="Eliminar" style="color:#f87171">🗑</button>'+
        '</div>'+
        '</div>'+
        '</div>'+
        (lm>0?'<div style="height:3px;background:#0f172a;border-radius:99px;margin-top:6px">'+
        '<div style="height:3px;background:'+barColor+';border-radius:99px;width:'+Math.min(u,100)+'%"></div></div>'+
        '<div style="font-size:10px;color:#64748b;text-align:right;margin-top:2px">'+u+'% usado</div>':'')+
        '</div>';
    });
  }
  document.getElementById("fin-msi").innerHTML=h;
}

// ── GASTOS ───────────────────────────────────────────────────
function renderFinGastos(gastos){
  document.getElementById("fin-tbody").innerHTML=gastos.length===0?erow(6,"Sin gastos"):
    gastos.slice().reverse().slice(0,50).map(function(g,i){
      var ri=gastos.length-1-i;
      var comp=g["ComprobanteDrive"]||g["Comprobante Drive"]||"";
      return '<tr style="cursor:pointer" onclick="showGastoDetail('+ri+')">'+
        '<td style="color:#94a3b8">'+(g["Fecha"]||"—")+'</td>'+
        '<td style="font-weight:500">'+(g["Concepto"]||"—")+'</td>'+
        '<td style="color:#94a3b8">'+(g["Categoría"]||g["Categoria"]||"—")+'</td>'+
        '<td style="color:#fbbf24;font-weight:500">'+fmt(+(g["Monto"]||0))+'</td>'+
        '<td style="color:#64748b">'+(g["Método de pago"]||g["Metodo de pago"]||"—")+'</td>'+
        '<td>'+(comp?'<a href="'+comp+'" target="_blank" style="color:#60a5fa;font-size:11px">Ver</a>':"—")+'</td>'+
        '</tr>';
    }).join("");
}

// ════════════════════════════════════════════════════════════
// MODAL GENÉRICO (reutilizable)
// ════════════════════════════════════════════════════════════
function openFinModal(title, bodyHtml, onSave){
  var existing=document.getElementById("fin-modal");
  if(existing)existing.remove();

  var overlay=document.createElement("div");
  overlay.id="fin-modal";
  overlay.style.cssText="position:fixed;inset:0;background:#0f172acc;z-index:300;display:flex;align-items:center;justify-content:center;padding:16px";
  overlay.onclick=function(e){if(e.target===overlay)closeFinModal();};

  overlay.innerHTML=
    '<div style="background:#1e293b;border:1px solid #334155;border-radius:16px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;padding:24px">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">'+
    '<div style="font-size:17px;font-weight:700">'+title+'</div>'+
    '<button onclick="closeFinModal()" style="background:transparent;border:none;color:#64748b;font-size:20px;cursor:pointer;line-height:1">×</button>'+
    '</div>'+
    '<div id="fin-modal-body">'+bodyHtml+'</div>'+
    '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:18px">'+
    '<button class="edit-cancel-btn" onclick="closeFinModal()">Cancelar</button>'+
    '<button class="edit-save-btn" id="fin-modal-save">Guardar</button>'+
    '</div>'+
    '</div>';

  document.body.appendChild(overlay);
  document.getElementById("fin-modal-save").onclick=onSave;
}

function closeFinModal(){
  var m=document.getElementById("fin-modal");
  if(m)m.remove();
}

// ════════════════════════════════════════════════════════════
// CRUD CUENTAS (Efectivo / Débito / Ahorro / Inversión)
// ════════════════════════════════════════════════════════════
var TIPOS_CUENTA=["Efectivo","Débito","Ahorro","Inversión","Otro"];

function openCuentaForm(idx){
  var c = idx!==null ? (DATA.fin.cuentas||[])[idx] : null;
  var nombre=c?getBanco(c):"";
  var tipo=c?getTipo(c):"Efectivo";
  var saldo=c?getSaldo(c):0;
  var banco=c?(c["Banco"]||""):"";
  var activa=c?(c["Activa"]||"Sí"):"Sí";

  var body=
    '<div class="edit-form">'+
    '<div class="edit-row">'+
    '<div class="edit-field"><label class="edit-label">Nombre / Alias</label>'+
    '<input class="edit-input" id="fc-nombre" value="'+escHtml(nombre)+'" placeholder="Ej: BBVA Nómina"/></div>'+
    '<div class="edit-field"><label class="edit-label">Tipo</label>'+
    '<select class="edit-select" id="fc-tipo">'+TIPOS_CUENTA.map(function(t){return'<option'+(t===tipo?' selected':'')+'>'+t+'</option>';}).join("")+'</select></div>'+
    '</div>'+
    '<div class="edit-row">'+
    '<div class="edit-field"><label class="edit-label">Banco / Institución</label>'+
    '<input class="edit-input" id="fc-banco" value="'+escHtml(banco)+'" placeholder="Ej: BBVA, Banamex..."/></div>'+
    '<div class="edit-field"><label class="edit-label">Saldo actual (MXN)</label>'+
    '<input class="edit-input" id="fc-saldo" type="number" value="'+saldo+'" placeholder="0"/></div>'+
    '</div>'+
    '<div class="edit-field"><label class="edit-label">Activa</label>'+
    '<select class="edit-select" id="fc-activa"><option'+(activa!=="No"?' selected':'')+'>Sí</option><option'+(activa==="No"?' selected':'')+'>No</option></select></div>'+
    (idx!==null?'<div style="font-size:11px;color:#475569;margin-top:4px">Cambiar el saldo aquí edita el registro directamente. Para registrar un movimiento usa 💸.</div>':'')+
    '</div>';

  openFinModal(idx!==null?"✏️ Editar Cuenta":"➕ Nueva Cuenta", body, function(){
    var n=document.getElementById("fc-nombre").value.trim();
    var ti=document.getElementById("fc-tipo").value;
    var ba=document.getElementById("fc-banco").value.trim();
    var sa=+(document.getElementById("fc-saldo").value)||0;
    var ac=document.getElementById("fc-activa").value;
    if(!n){showToast("El nombre es requerido");return;}

    // Columnas: Nombre | Tipo | Banco | SaldoActual | Activa
    var row=[n, ti, ba, sa, ac];

    if(idx===null){
      // NUEVA — append al Sheet
      requestFinToken(function(){
        appendRow(CONFIG.SHEETS.finanzas, "Cuentas", row, function(){
          // Actualizar DATA local
          DATA.fin.cuentas.push({Nombre:n,Tipo:ti,Banco:ba,SaldoActual:sa,Activa:ac});
          closeFinModal();
          renderFinanzas();
          showToast("Cuenta agregada ✓");
        });
      });
    } else {
      // EDITAR — update fila en Sheet
      var c=DATA.fin.cuentas[idx];
      var rowNum=c._rowNum;
      if(!rowNum){
        // Sin _rowNum: actualizar solo en memoria con advertencia
        Object.assign(c,{Nombre:n,Tipo:ti,Banco:ba,SaldoActual:sa,Activa:ac});
        closeFinModal();renderFinanzas();
        showToast("Actualizado en memoria (recarga para sincronizar Sheet)");
        return;
      }
      requestFinToken(function(){
        updateRow(CONFIG.SHEETS.finanzas, "Cuentas", rowNum, row, function(){
          Object.assign(c,{Nombre:n,Tipo:ti,Banco:ba,SaldoActual:sa,Activa:ac});
          closeFinModal();renderFinanzas();
          showToast("Cuenta actualizada ✓");
        });
      });
    }
  });
}

function deleteCuenta(idx){
  var c=(DATA.fin.cuentas||[])[idx];
  if(!c)return;
  if(!confirm("¿Eliminar la cuenta '"+getBanco(c)+"'? Esta acción no se puede deshacer."))return;
  requestFinToken(function(){
    if(c._rowNum){
      clearRow(CONFIG.SHEETS.finanzas,"Cuentas",c._rowNum,5,function(){
        DATA.fin.cuentas.splice(idx,1);
        renderFinanzas();
        showToast("Cuenta eliminada ✓");
      });
    } else {
      DATA.fin.cuentas.splice(idx,1);
      renderFinanzas();
      showToast("Eliminado localmente");
    }
  });
}

// ════════════════════════════════════════════════════════════
// CRUD TARJETAS DE CRÉDITO
// ════════════════════════════════════════════════════════════
var BANCOS_COMUNES=["BBVA","Citibanamex","Santander","HSBC","Banorte","Scotiabank","Inbursa","American Express","Liverpool","Otro"];

function openTarjetaForm(idx){
  var t=idx!==null?(DATA.fin.tcs||[])[idx]:null;
  var banco=t?getBanco(t):"";
  var ultimos=t?getUltimos(t):"";
  var saldo=t?getSaldo(t):0;
  var limite=t?getLimite(t):0;
  var fechaPago=t?getPago(t):"";
  var activa=t?(t["Activa"]||"Sí"):"Sí";

  var body=
    '<div class="edit-form">'+
    '<div class="edit-row">'+
    '<div class="edit-field"><label class="edit-label">Banco</label>'+
    '<input class="edit-input" id="ft-banco" list="ft-bancos-list" value="'+escHtml(banco)+'" placeholder="BBVA, Santander..."/>'+
    '<datalist id="ft-bancos-list">'+BANCOS_COMUNES.map(function(b){return'<option value="'+b+'">';}).join("")+'</datalist></div>'+
    '<div class="edit-field"><label class="edit-label">Últimos 4 dígitos</label>'+
    '<input class="edit-input" id="ft-ultimos" type="text" maxlength="4" value="'+escHtml(ultimos)+'" placeholder="1234"/></div>'+
    '</div>'+
    '<div class="edit-row">'+
    '<div class="edit-field"><label class="edit-label">Saldo actual / Deuda (MXN)</label>'+
    '<input class="edit-input" id="ft-saldo" type="number" value="'+saldo+'" placeholder="0"/></div>'+
    '<div class="edit-field"><label class="edit-label">Límite de crédito (MXN)</label>'+
    '<input class="edit-input" id="ft-limite" type="number" value="'+limite+'" placeholder="0"/></div>'+
    '</div>'+
    '<div class="edit-row">'+
    '<div class="edit-field"><label class="edit-label">Fecha límite de pago</label>'+
    '<input class="edit-input" id="ft-fechapago" type="date" value="'+escHtml(fechaPago)+'"/></div>'+
    '<div class="edit-field"><label class="edit-label">Activa</label>'+
    '<select class="edit-select" id="ft-activa"><option'+(activa!=="No"?' selected':'')+'>Sí</option><option'+(activa==="No"?' selected':'')+'>No</option></select></div>'+
    '</div>'+
    '</div>';

  openFinModal(idx!==null?"✏️ Editar Tarjeta":"💳 Nueva Tarjeta de Crédito", body, function(){
    var ba=document.getElementById("ft-banco").value.trim();
    var ul=document.getElementById("ft-ultimos").value.trim();
    var sa=+(document.getElementById("ft-saldo").value)||0;
    var lm=+(document.getElementById("ft-limite").value)||0;
    var fp=document.getElementById("ft-fechapago").value;
    var ac=document.getElementById("ft-activa").value;
    if(!ba){showToast("El banco es requerido");return;}

    // Columnas: Banco | Ultimos4 | SaldoActual | LimiteCredito | FechaLimitePago | Activa
    var row=[ba, ul, sa, lm, fp, ac];

    if(idx===null){
      requestFinToken(function(){
        appendRow(CONFIG.SHEETS.finanzas,"Tarjetas",row,function(){
          DATA.fin.tcs.push({Banco:ba,Ultimos4:ul,SaldoActual:sa,LimiteCredito:lm,FechaLimitePago:fp,Activa:ac});
          closeFinModal();renderFinanzas();
          showToast("Tarjeta agregada ✓");
        });
      });
    } else {
      var tc=DATA.fin.tcs[idx];
      var rowNum=tc._rowNum;
      if(!rowNum){
        Object.assign(tc,{Banco:ba,Ultimos4:ul,SaldoActual:sa,LimiteCredito:lm,FechaLimitePago:fp,Activa:ac});
        closeFinModal();renderFinanzas();
        showToast("Actualizado en memoria");return;
      }
      requestFinToken(function(){
        updateRow(CONFIG.SHEETS.finanzas,"Tarjetas",rowNum,row,function(){
          Object.assign(tc,{Banco:ba,Ultimos4:ul,SaldoActual:sa,LimiteCredito:lm,FechaLimitePago:fp,Activa:ac});
          closeFinModal();renderFinanzas();
          showToast("Tarjeta actualizada ✓");
        });
      });
    }
  });
}

function deleteTarjeta(idx){
  var t=(DATA.fin.tcs||[])[idx];
  if(!t)return;
  if(!confirm("¿Eliminar tarjeta "+getBanco(t)+(getUltimos(t)?" ···"+getUltimos(t):"")+"?"))return;
  requestFinToken(function(){
    if(t._rowNum){
      clearRow(CONFIG.SHEETS.finanzas,"Tarjetas",t._rowNum,6,function(){
        DATA.fin.tcs.splice(idx,1);
        renderFinanzas();showToast("Tarjeta eliminada ✓");
      });
    } else {
      DATA.fin.tcs.splice(idx,1);
      renderFinanzas();showToast("Eliminado localmente");
    }
  });
}

// ════════════════════════════════════════════════════════════
// MOVIMIENTOS — afectan saldo y conciliación
// ════════════════════════════════════════════════════════════
// tipo: 'cuenta' | 'tarjeta'
// accountIdx: índice en DATA.fin.cuentas o DATA.fin.tcs

var CATEGORIAS_GASTO=["Alimentación","Transporte","Servicios","Salud","Educación","Entretenimiento","Ropa","Hogar","Remodelación","Viajes","Suscripciones","Otro"];
var TIPOS_MOV_CUENTA=["Ingreso","Retiro","Transferencia entrada","Transferencia salida","Ajuste"];
var TIPOS_MOV_TC=["Cargo","Pago de tarjeta","Abono parcial","Ajuste"];

function openMovimientoForm(tipo, accountIdx){
  var isCuenta = tipo==="cuenta";
  var cuenta = isCuenta ? (DATA.fin.cuentas||[])[accountIdx] : (DATA.fin.tcs||[])[accountIdx];
  if(!cuenta)return;
  var nombreCuenta = getBanco(cuenta)+(getUltimos(cuenta)?" ···"+getUltimos(cuenta):"");
  var saldoActual = getSaldo(cuenta);
  var tiposMovs = isCuenta ? TIPOS_MOV_CUENTA : TIPOS_MOV_TC;

  var body=
    '<div class="edit-form">'+
    '<div style="background:#0f172a;border-radius:8px;padding:10px 14px;margin-bottom:4px;border:1px solid #334155">'+
    '<div style="font-size:12px;color:#64748b">Cuenta</div>'+
    '<div style="font-weight:600;font-size:14px">'+nombreCuenta+'</div>'+
    '<div style="font-size:12px;color:'+(isCuenta?"#4ade80":"#f87171")+'">Saldo actual: '+fmt(saldoActual)+'</div>'+
    '</div>'+
    '<div class="edit-row">'+
    '<div class="edit-field"><label class="edit-label">Tipo de movimiento</label>'+
    '<select class="edit-select" id="fm-tipo" onchange="updateMovSign()">'+tiposMovs.map(function(t,i){return'<option value="'+t+'"'+(i===0?' selected':'')+'>'+t+'</option>';}).join("")+'</select></div>'+
    '<div class="edit-field"><label class="edit-label">Fecha</label>'+
    '<input class="edit-input" id="fm-fecha" type="date" value="'+hoy()+'"/></div>'+
    '</div>'+
    '<div class="edit-row">'+
    '<div class="edit-field"><label class="edit-label">Concepto / Descripción</label>'+
    '<input class="edit-input" id="fm-concepto" placeholder="Ej: Depósito nómina, Pago Netflix..."/></div>'+
    '<div class="edit-field"><label class="edit-label">Monto (MXN, positivo)</label>'+
    '<input class="edit-input" id="fm-monto" type="number" min="0" step="0.01" value="" placeholder="0.00"/></div>'+
    '</div>'+
    '<div class="edit-row">'+
    '<div class="edit-field"><label class="edit-label">Categoría</label>'+
    '<select class="edit-select" id="fm-cat">'+CATEGORIAS_GASTO.map(function(c){return'<option>'+c+'</option>';}).join("")+'</select></div>'+
    '<div class="edit-field"><label class="edit-label">Notas (opcional)</label>'+
    '<input class="edit-input" id="fm-notas" placeholder=""/></div>'+
    '</div>'+
    '<div id="fm-preview" style="background:#0f172a;border-radius:8px;padding:10px 14px;border:1px solid #334155;font-size:13px;display:none">'+
    '<div style="color:#64748b;font-size:11px;margin-bottom:3px">Nuevo saldo estimado</div>'+
    '<div id="fm-preview-val" style="font-weight:700;font-size:18px"></div>'+
    '</div>'+
    '</div>';

  openFinModal("💸 Registrar Movimiento", body, function(){
    var tipoMov=document.getElementById("fm-tipo").value;
    var fecha=document.getElementById("fm-fecha").value;
    var concepto=document.getElementById("fm-concepto").value.trim();
    var monto=Math.abs(+(document.getElementById("fm-monto").value)||0);
    var cat=document.getElementById("fm-cat").value;
    var notas=document.getElementById("fm-notas").value.trim();

    if(!concepto){showToast("El concepto es requerido");return;}
    if(monto<=0){showToast("El monto debe ser mayor a 0");return;}
    if(!fecha){showToast("La fecha es requerida");return;}

    // Calcular nuevo saldo
    var delta=calcDelta(tipoMov, monto, isCuenta);
    var nuevoSaldo=saldoActual+delta;

    // Fila de movimiento: Fecha | Concepto | Tipo | Monto | CuentaOrigen | Categoria | NuevoSaldo | Notas
    var movRow=[fecha, concepto, tipoMov, monto, nombreCuenta, cat, nuevoSaldo, notas];

    // Fila actualizada de la cuenta/tarjeta
    var updatedSaldoRow = buildSaldoUpdateRow(cuenta, nuevoSaldo, isCuenta);

    requestFinToken(function(){
      // 1. Guardar en Movimientos
      appendRow(CONFIG.SHEETS.finanzas,"Movimientos",movRow,function(){
        // 2. También guardar en Gastos si es un cargo/retiro
        if(isGasto(tipoMov)){
          var gastoRow=[fecha,concepto,cat,monto,tipoMov,nombreCuenta,"","",notas];
          appendRow(CONFIG.SHEETS.finanzas,"Gastos",gastoRow,function(){});
          DATA.fin.gastos.push({Fecha:fecha,Concepto:concepto,"Categoría":cat,Monto:monto,"Método de pago":tipoMov,"Banco/TC":nombreCuenta,Notas:notas});
        }
        // 3. Actualizar saldo en Sheet y en DATA local
        if(cuenta._rowNum&&updatedSaldoRow){
          var sheetTab=isCuenta?"Cuentas":"Tarjetas";
          updateRow(CONFIG.SHEETS.finanzas,sheetTab,cuenta._rowNum,updatedSaldoRow,function(){});
        }
        // Actualizar local
        if(isCuenta){DATA.fin.cuentas[accountIdx].SaldoActual=nuevoSaldo;}
        else{DATA.fin.tcs[accountIdx].SaldoActual=nuevoSaldo;}
        // Registrar en movimientos locales
        DATA.fin.movimientos=DATA.fin.movimientos||[];
        DATA.fin.movimientos.push({Fecha:fecha,Concepto:concepto,Tipo:tipoMov,Monto:monto,Cuenta:nombreCuenta,Categoria:cat,NuevoSaldo:nuevoSaldo,Notas:notas});

        closeFinModal();
        renderFinanzas();
        showToast("Movimiento registrado ✓  Nuevo saldo: "+fmt(nuevoSaldo));
      });
    });
  });

  // Actualizar preview de saldo en tiempo real
  setTimeout(function(){
    var montoInput=document.getElementById("fm-monto");
    var tipoSel=document.getElementById("fm-tipo");
    if(!montoInput||!tipoSel)return;
    function updatePreview(){
      var m=Math.abs(+(montoInput.value)||0);
      var ti=tipoSel.value;
      if(m>0){
        var d=calcDelta(ti,m,isCuenta);
        var ns=saldoActual+d;
        var preview=document.getElementById("fm-preview");
        var previewVal=document.getElementById("fm-preview-val");
        if(preview&&previewVal){
          preview.style.display="block";
          previewVal.textContent=fmt(ns);
          previewVal.style.color=isCuenta?(ns>=0?"#4ade80":"#f87171"):(ns<=saldoActual?"#4ade80":"#f87171");
        }
      }
    }
    montoInput.addEventListener("input",updatePreview);
    tipoSel.addEventListener("change",updatePreview);
  },100);
}

// Calcula cuánto cambia el saldo según el tipo de movimiento
function calcDelta(tipoMov, monto, isCuenta){
  if(isCuenta){
    // Para cuentas: ingresos suman, retiros/salidas restan
    var positivos=["Ingreso","Transferencia entrada"];
    return positivos.indexOf(tipoMov)!==-1 ? +monto : -monto;
  } else {
    // Para tarjetas: cargo aumenta deuda, pago/abono reduce deuda
    var pagos=["Pago de tarjeta","Abono parcial"];
    return pagos.indexOf(tipoMov)!==-1 ? -monto : +monto;
  }
}

function isGasto(tipoMov){
  return ["Retiro","Transferencia salida","Cargo","Ajuste"].indexOf(tipoMov)!==-1;
}

function buildSaldoUpdateRow(cuenta, nuevoSaldo, isCuenta){
  if(isCuenta){
    return [cuenta["Nombre"]||cuenta["Nombre"]||"", cuenta["Tipo"]||"", cuenta["Banco"]||"", nuevoSaldo, cuenta["Activa"]||"Sí"];
  } else {
    return [cuenta["Banco"]||"", cuenta["Ultimos4"]||"", nuevoSaldo, cuenta["LimiteCredito"]||0, cuenta["FechaLimitePago"]||"", cuenta["Activa"]||"Sí"];
  }
}

// ════════════════════════════════════════════════════════════
// RECARGAR datos de finanzas desde Sheets
// ════════════════════════════════════════════════════════════
function reloadFinanzas(){
  showToast("Recargando datos...");
  Promise.all([
    fetchSheetWithRows(CONFIG.SHEETS.finanzas,"Gastos"),
    fetchSheetWithRows(CONFIG.SHEETS.finanzas,"Tarjetas"),
    fetchSheetWithRows(CONFIG.SHEETS.finanzas,"MSIActivos"),
    fetchSheetWithRows(CONFIG.SHEETS.finanzas,"Cuentas"),
    fetchSheetWithRows(CONFIG.SHEETS.finanzas,"Movimientos"),
    fetchSheetWithRows(CONFIG.SHEETS.finanzas,"AlertasFinancieras")
  ]).then(function(res){
    DATA.fin={gastos:res[0],tcs:res[1],msi:res[2],cuentas:res[3],movimientos:res[4],alertas:res[5]};
    renderFinanzas();
    showToast("Finanzas actualizadas ✓");
  });
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
