const CONFIG = {
  ALLOWED_EMAILS: ["gusjsierra@gmail.com","gabynacoud@gmail.com"],
  GOOGLE_API_KEY: "AIzaSyDu0YLxIpEopSoD9fEL3ykqDVslfEj_1X8",
  SHEETS: {
    remo:     "1kNiQRb6HDHWOfORPcSVMCZ1GR7sKPJh_Kw72k_-fv9Y",
    hogar:    "1eI4sE2R9cGt8M7UyHXvNge7v2JxQQFokoCNDJ5ivvbI",
    finanzas: "1B47HwmB8-tlvCx4SHcqQosmHuJNBlVmcOzMH0RJv1UY",
    compras:  "1fKhYBwGe0moSmVordD6iTSeQ9VmNN-sOS7QExgQ1aks"
  }
};

function handleGoogleLogin(r) {
  var p = JSON.parse(atob(r.credential.split('.')[1]));
  var email = p.email.toLowerCase();
  if (CONFIG.ALLOWED_EMAILS.indexOf(email) === -1) {
    document.getElementById("auth-err").style.display = "block";
    return;
  }
  sessionStorage.setItem("homeai_user", email);
  sessionStorage.setItem("homeai_name", p.name || email);
  sessionStorage.setItem("homeai_pic", p.picture || "");
  initApp(email, p.name, p.picture);
}

function checkSession() {
  var e = sessionStorage.getItem("homeai_user");
  if (e && CONFIG.ALLOWED_EMAILS.indexOf(e) !== -1)
    initApp(e, sessionStorage.getItem("homeai_name"), sessionStorage.getItem("homeai_pic"));
}

function initApp(email, name, pic) {
  document.getElementById("auth-screen").style.display = "none";
  document.getElementById("app").style.display = "block";
  document.getElementById("nav-user").textContent = name || email;
  if (pic) { var av = document.getElementById("nav-avatar"); av.src = pic; av.style.display = "block"; }
  document.getElementById("dash-date").textContent = new Date().toLocaleDateString("es-MX",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  loadAllData();
}

function logout() {
  sessionStorage.clear();
  document.getElementById("app").style.display = "none";
  document.getElementById("auth-screen").style.display = "flex";
}

function showPage(id, btn) {
  document.querySelectorAll(".page").forEach(function(p){p.classList.remove("active");});
  document.querySelectorAll(".nav-btn").forEach(function(b){b.classList.remove("active");});
  document.getElementById("page-"+id).classList.add("active");
  if(btn) btn.classList.add("active");
}

function showFamTab(id, btn) {
  ["tareas","salud","mascotas","tramites"].forEach(function(t){
    var el=document.getElementById("fam-"+t); if(el) el.style.display="none";
  });
  document.querySelectorAll("#page-familiar .tab-btn").forEach(function(b){b.classList.remove("active");});
  var t=document.getElementById("fam-"+id); if(t) t.style.display="block";
  if(btn) btn.classList.add("active");
}

function showNutTab(id, btn) {
  ["menu","despensa","compras","historial"].forEach(function(t){
    var el=document.getElementById("nut-"+t); if(el) el.style.display="none";
  });
  document.querySelectorAll("#page-nutricion .tab-btn").forEach(function(b){b.classList.remove("active");});
  var t=document.getElementById("nut-"+id); if(t) t.style.display="block";
  if(btn) btn.classList.add("active");
}

function fetchSheet(id, tab) {
  var url = "https://sheets.googleapis.com/v4/spreadsheets/" + id + "/values/" + tab + "?key=" + CONFIG.GOOGLE_API_KEY;
  return fetch(url)
    .then(function(r){return r.json();})
    .then(function(d){
      if(d.error||!d.values||d.values.length<2) return [];
      var h=d.values[0];
      return d.values.slice(1).map(function(row){
        var o={}; h.forEach(function(k,i){o[k.trim()]=(row[i]||"").trim();}); return o;
      });
    }).catch(function(){return [];});
}

function fmt(n){return(isNaN(+n)||n==="")?"\u2014":"$"+Number(n).toLocaleString("es-MX",{minimumFractionDigits:0,maximumFractionDigits:0});}
function bdg(l,c){return'<span class="badge" style="background:'+c+'22;color:'+c+';border:1px solid '+c+'44">'+(l||"\u2014")+'</span>';}
function ec(e){if(!e)return"#64748b";if(e.indexOf("Completo")!==-1)return"#4ade80";if(e.indexOf("En Proceso")!==-1)return"#fbbf24";if(e.indexOf("Bloqueado")!==-1)return"#f87171";if(e.indexOf("Planeando")!==-1)return"#60a5fa";if(e.indexOf("Prueba")!==-1)return"#a78bfa";return"#64748b";}
function pc(p){return p==="Alta"?"#f87171":p==="Baja"?"#4ade80":"#60a5fa";}
function erow(c,m){return'<tr><td colspan="'+c+'" class="empty">'+m+'</td></tr>';}

var DATA={remo:[],fam:{tareas:[],subtareas:[],salud:[],mascotas:[],tramites:[]},fin:{gastos:[],tcs:[],msi:[]},comp:[],nut:{menu:[],despensa:[],compras:[],historial:[]}};

function loadAllData(){
  Promise.all([
    fetchSheet(CONFIG.SHEETS.remo,    "ProyectosMaestro"),
    fetchSheet(CONFIG.SHEETS.hogar,   "Tareas"),
    fetchSheet(CONFIG.SHEETS.hogar,   "Subtareas"),
    fetchSheet(CONFIG.SHEETS.hogar,   "Salud"),
    fetchSheet(CONFIG.SHEETS.hogar,   "Mascotas"),
    fetchSheet(CONFIG.SHEETS.hogar,   "Tramites"),
    fetchSheet(CONFIG.SHEETS.finanzas,"Gastos"),
    fetchSheet(CONFIG.SHEETS.finanzas,"TarjetasdeCredito"),
    fetchSheet(CONFIG.SHEETS.finanzas,"MSIActivos"),
    fetchSheet(CONFIG.SHEETS.compras, "Articulos"),
    fetchSheet(CONFIG.SHEETS.hogar,   "MenuSemanal"),
    fetchSheet(CONFIG.SHEETS.hogar,   "Despensa"),
    fetchSheet(CONFIG.SHEETS.hogar,   "ListadeCompras"),
    fetchSheet(CONFIG.SHEETS.hogar,   "HistorialNutricional")
  ]).then(function(res){
    DATA={
      remo:res[0],
      fam:{tareas:res[1],subtareas:res[2],salud:res[3],mascotas:res[4],tramites:res[5]},
      fin:{gastos:res[6],tcs:res[7],msi:res[8]},
      comp:res[9],
      nut:{menu:res[10],despensa:res[11],compras:res[12],historial:res[13]}
    };
    renderDashboard();renderRemo();renderFamiliar();renderFinanzas();renderCompras();renderNutricion();
  });
}

function renderDashboard(){
  var r=DATA.remo,tot=r.length;
  var comp=r.filter(function(p){return p["Estado"]&&p["Estado"].indexOf("Completo")!==-1;}).length;
  var pct=tot?Math.round(comp/tot*100):0;
  var presup=r.reduce(function(s,p){return s+(+p["Presupuesto MXN"]||0);},0);
  var pagado=r.reduce(function(s,p){return s+(+p["Total Pagado MXN"]||0);},0);
  var bloq=r.filter(function(p){return p["Estado"]&&p["Estado"].indexOf("Bloqueado")!==-1;});
  var tPend=DATA.fam.tareas.filter(function(t){return t["Estado"]&&t["Estado"].indexOf("Completo")===-1&&t["Estado"].indexOf("Cancelado")===-1;});
  var tAlta=tPend.filter(function(t){return t["Prioridad"]==="Alta";});
  var subPend=DATA.fam.subtareas.filter(function(s){return s["Estado"]&&s["Estado"].indexOf("Completo")===-1;});
  var now=new Date();
  var gMes=DATA.fin.gastos.filter(function(g){try{var f=new Date(g["Fecha"]);return f.getMonth()===now.getMonth()&&f.getFullYear()===now.getFullYear();}catch(e){return false;}});
  var totG=gMes.reduce(function(s,g){return s+(+g["Monto MXN"]||0);},0);
  var cAct=DATA.comp.filter(function(a){return a["Estado"]&&a["Estado"].indexOf("Cerrado")===-1;}).length;

  document.getElementById("dash-metrics").innerHTML=
    '<div class="metric-card" style="--accent:#fb923c"><div class="metric-label">Remodelacion</div><div class="metric-val">'+pct+'%</div><div class="metric-sub">'+comp+' de '+tot+' proyectos</div><div class="metric-bar"><div class="metric-bar-fill" style="width:'+pct+'%"></div></div></div>'+
    '<div class="metric-card" style="--accent:#a78bfa"><div class="metric-label">Tareas pendientes</div><div class="metric-val">'+tPend.length+'</div><div class="metric-sub">'+subPend.length+' subtareas'+(tAlta.length>0?' &middot; <span style="color:#f87171">'+tAlta.length+' alta</span>':'')+'</div></div>'+
    '<div class="metric-card" style="--accent:#fbbf24"><div class="metric-label">Gastos del mes</div><div class="metric-val">'+fmt(totG)+'</div><div class="metric-sub">'+gMes.length+' transacciones</div></div>'+
    '<div class="metric-card" style="--accent:#34d399"><div class="metric-label">Compras activas</div><div class="metric-val">'+cAct+'</div></div>'+
    '<div class="metric-card" style="--accent:#fbbf24"><div class="metric-label">Presupuesto remo</div><div class="metric-val">'+fmt(presup)+'</div></div>'+
    '<div class="metric-card" style="--accent:#4ade80"><div class="metric-label">Total pagado</div><div class="metric-val">'+fmt(pagado)+'</div></div>'+
    '<div class="metric-card" style="--accent:#60a5fa"><div class="metric-label">Saldo pendiente</div><div class="metric-val">'+fmt(presup-pagado)+'</div></div>'+
    '<div class="metric-card" style="--accent:#f87171"><div class="metric-label">Bloqueados</div><div class="metric-val">'+bloq.length+'</div></div>';

  var al="";
  if(bloq.length>0) al+='<div class="alert danger">🔴 '+bloq.length+' proyecto(s) bloqueado(s)</div>';
  if(tAlta.length>0) al+='<div class="alert warning">⚠️ '+tAlta.length+' tarea(s) de prioridad alta</div>';
  document.getElementById("dash-alerts").innerHTML=al?'<div class="sec">Alertas</div>'+al:"";

  var ests=["Pendiente","Planeando","En Proceso","En Prueba","Completo","Bloqueado"];
  document.getElementById("dash-estados").innerHTML='<div class="sec">Avance por estado</div>'+(tot===0?'<div class="empty">Sin datos</div>':
    ests.map(function(e){
      var n=r.filter(function(p){return p["Estado"]&&p["Estado"].indexOf(e)!==-1;}).length;
      var w=tot?Math.round(n/tot*100):0;
      return'<div class="prog-row"><div class="prog-label">'+e+'</div><div class="prog-bar"><div class="prog-fill" style="width:'+w+'%;background:'+ec(e)+'"></div></div><div class="prog-val">'+n+'</div></div>';
    }).join(""));

  var areas=[];
  r.forEach(function(p){if(p["Área"]&&areas.indexOf(p["Área"])===-1)areas.push(p["Área"]);});
  var aS=areas.map(function(a){
    var ps=r.filter(function(p){return p["Area"]===a;});
    var c=ps.filter(function(p){return p["Estado"]&&p["Estado"].indexOf("Completo")!==-1;}).length;
    return{a:a,p:ps.length?Math.round(c/ps.length*100):0};
  }).sort(function(x,y){return y.p-x.p;}).slice(0,7);
  document.getElementById("dash-areas").innerHTML='<div class="sec">Top areas por avance</div>'+(aS.length===0?'<div class="empty">Sin datos</div>':
    aS.map(function(x){return'<div class="prog-row"><div class="prog-label">'+x.a+'</div><div class="prog-bar"><div class="prog-fill" style="width:'+x.p+'%;background:'+(x.p===100?"#4ade80":"#3b82f6")+'"></div></div><div class="prog-val">'+x.p+'%</div></div>';}).join(""));

  var aP=r.filter(function(p){return p["Prioridad"]==="Alta"&&p["Estado"]&&p["Estado"].indexOf("Completo")===-1;})
    .concat(DATA.fam.tareas.filter(function(t){return t["Prioridad"]==="Alta"&&t["Estado"]&&t["Estado"].indexOf("Completo")===-1;}));
  document.getElementById("dash-prioridad").innerHTML='<div class="sec">Prioridad alta</div>'+(aP.length===0?'<div class="empty">Sin items de prioridad alta 🎉</div>':
    aP.slice(0,10).map(function(p){
      return'<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #1e293b"><div style="font-size:13px">'+(p["Proyecto"]||p["Nombre"]||p["Descripcion"]||"—")+'</div>'+bdg(p["Área"]||p["Categoria"]||"Familiar","#f87171")+'</div>';
    }).join(""));
}

var remoData=[];
function renderRemo(){
  remoData=DATA.remo;
  var areas=[];
  remoData.forEach(function(p){if(p["Área"]&&areas.indexOf(p["Área"])===-1)areas.push(p["Área"]);});
  var sel=document.getElementById("f-area");
  sel.innerHTML='<option value="">Todas las areas</option>';
  areas.forEach(function(a){sel.innerHTML+='<option value="'+a+'">'+a+'</option>';});
  var tot=remoData.length,comp=remoData.filter(function(p){return p["Estado"]&&p["Estado"].indexOf("Completo")!==-1;}).length;
  var pct=tot?Math.round(comp/tot*100):0;
  var presup=remoData.reduce(function(s,p){return s+(+p["Presupuesto MXN"]||0);},0);
  var pagado=remoData.reduce(function(s,p){return s+(+p["Pagado MXN"]||0);},0);
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
  var f=remoData.filter(function(p){
    return(!fA||p["Área"]===fA)&&(!fE||!p["Estado"]||(p["Estado"].indexOf(fE)!==-1))&&(!fP||p["Prioridad"]===fP);
  });
  document.getElementById("remo-tbody").innerHTML=f.length===0?erow(8,"Sin resultados"):
    f.map(function(p){
      return'<tr><td style="color:#94a3b8">'+(p["Área"]||"—")+'</td><td style="font-weight:500">'+(p["Proyecto"]||"—")+'</td><td style="color:#64748b">'+(p["Etapa Actual"]||"1")+'</td><td>'+bdg(p["Estado"]||"Pendiente",ec(p["Estado"]))+'</td><td>'+bdg(p["Prioridad"]||"Media",pc(p["Prioridad"]))+'</td><td style="color:#94a3b8">'+fmt(p["Presupuesto MXN"])+'</td><td style="color:#4ade80">'+fmt(p["Pagado MXN"])+'</td><td style="color:#64748b">'+(p["Contratista"]||"—")+'</td></tr>';
    }).join("");
}

function renderFamiliar(){
  var tareas=DATA.fam.tareas,subs=DATA.fam.subtareas;
  var pend=tareas.filter(function(t){return t["Estado"]&&t["Estado"].indexOf("Completo")===-1&&t["Estado"].indexOf("Cancelado")===-1;});
  var subPend=subs.filter(function(s){return s["Estado"]&&s["Estado"].indexOf("Completo")===-1;});
  document.getElementById("fam-metrics").innerHTML=
    '<div class="metric-card" style="--accent:#a78bfa"><div class="metric-label">Tareas pendientes</div><div class="metric-val">'+pend.length+'</div></div>'+
    '<div class="metric-card" style="--accent:#f87171"><div class="metric-label">Subtareas pendientes</div><div class="metric-val">'+subPend.length+'</div></div>'+
    '<div class="metric-card" style="--accent:#4ade80"><div class="metric-label">Completadas</div><div class="metric-val">'+tareas.filter(function(t){return t["Estado"]&&t["Estado"].indexOf("Completo")!==-1;}).length+'</div></div>'+
    '<div class="metric-card" style="--accent:#fbbf24"><div class="metric-label">Prioridad alta</div><div class="metric-val">'+pend.filter(function(t){return t["Prioridad"]==="Alta";}).length+'</div></div>';

  document.getElementById("fam-tareas-tbody").innerHTML=tareas.length===0?erow(6,"Sin tareas"):
    tareas.map(function(t){
      return'<tr><td style="color:#94a3b8">'+(t["Categoría"]||"—")+'</td><td style="font-weight:500">'+(t["Descripción"]||"—")+'</td><td>'+bdg(t["Prioridad"]||"Media",pc(t["Prioridad"]))+'</td><td>'+bdg(t["Estado"]||"—",ec(t["Estado"]))+'</td><td style="color:#94a3b8">'+(t["Asignado A"]||"—")+'</td><td style="color:#64748b">'+(t["Fecha Límite"]||"—")+'</td></tr>';
    }).join("");

  var grouped={};
  subPend.forEach(function(s){var k=s["ID Tarea Padre"]||"Sin tarea";if(!grouped[k])grouped[k]=[];grouped[k].push(s);});
  var keys=Object.keys(grouped);
  document.getElementById("fam-subtareas-list").innerHTML=keys.length===0?'<div class="empty">Sin subtareas pendientes 🎉</div>':
    keys.map(function(k){
      var t=tareas.filter(function(x){return x["ID_Tarea"]===k;})[0];
      var nombre=t?t["Descripción"]:(grouped[k][0]["Nombre Tarea Padre"]||k);
      return'<div style="margin-bottom:10px"><div style="font-size:13px;font-weight:500;color:#f1f5f9;margin-bottom:4px">'+nombre+'</div>'+
        grouped[k].map(function(s){return'<div class="sub-row"><span>'+(s["Descripción Subtarea"]||"—")+'</span>'+bdg(s["Estado"]||"Pendiente",ec(s["Estado"]))+'</div>';}).join("")+'</div>';
    }).join("");

  document.getElementById("fam-salud-tbody").innerHTML=DATA.fam.salud.length===0?erow(6,"Sin registros"):
    DATA.fam.salud.map(function(s){return'<tr><td>'+(s["Miembro Familia"]||"—")+'</td><td>'+(s["Tipo Registro"]||"—")+'</td><td>'+(s["Descripcion"]||"—")+'</td><td style="color:#94a3b8">'+(s["Doctor / Centro"]||"—")+'</td><td>'+(s["Fecha"]||"—")+'</td><td style="color:#4ade80">'+(s["Proxima Cita"]||"—")+'</td></tr>';}).join("");

  document.getElementById("fam-mascotas-tbody").innerHTML=DATA.fam.mascotas.length===0?erow(6,"Sin registros"):
    DATA.fam.mascotas.map(function(m){return'<tr><td style="font-weight:500">'+(m["Nombre Mascota"]||"—")+'</td><td>'+(m["Tipo Registro"]||"—")+'</td><td>'+(m["Descripcion"]||"—")+'</td><td style="color:#94a3b8">'+(m["Veterinario"]||"—")+'</td><td>'+(m["Fecha"]||"—")+'</td><td style="color:#4ade80">'+(m["Fecha Proxima Vacuna"]||"—")+'</td></tr>';}).join("");

  document.getElementById("fam-tramites-tbody").innerHTML=DATA.fam.tramites.length===0?erow(6,"Sin tramites"):
    DATA.fam.tramites.map(function(t){return'<tr><td>'+(t["Tipo Tramite"]||"—")+'</td><td>'+(t["Descripcion"]||"—")+'</td><td style="color:#94a3b8">'+(t["Responsable"]||"—")+'</td><td>'+bdg(t["Estado"]||"—",ec(t["Estado"]))+'</td><td style="color:#fbbf24">'+(t["Fecha Limite"]||"—")+'</td><td style="color:#64748b">'+(t["Institucion"]||"—")+'</td></tr>';}).join("");
}

function renderFinanzas(){
  var gastos=DATA.fin.gastos,tcs=DATA.fin.tcs,msi=DATA.fin.msi;
  var now=new Date();
  var gM=gastos.filter(function(g){try{var f=new Date(g["Fecha"]);return f.getMonth()===now.getMonth()&&f.getFullYear()===now.getFullYear();}catch(e){return false;}});
  var totG=gM.reduce(function(s,g){return s+(+g["Monto MXN"]||0);},0);
  var totTC=tcs.reduce(function(s,t){return s+(+t["Saldo actual MXN"]||0);},0);
  var msiAct=msi.filter(function(m){return m["Estado"]!=="Cerrado";});
  var totMSI=msiAct.reduce(function(s,m){return s+(+m["Saldo Pendiente MXN"]||0);},0);
  document.getElementById("fin-metrics").innerHTML=
    '<div class="metric-card" style="--accent:#fbbf24"><div class="metric-label">Gastos del mes</div><div class="metric-val">'+fmt(totG)+'</div><div class="metric-sub">'+gM.length+' transacciones</div></div>'+
    '<div class="metric-card" style="--accent:#f87171"><div class="metric-label">Saldo TCs</div><div class="metric-val">'+fmt(totTC)+'</div></div>'+
    '<div class="metric-card" style="--accent:#fb923c"><div class="metric-label">MSI pendiente</div><div class="metric-val">'+fmt(totMSI)+'</div></div>';

  document.getElementById("fin-tcs").innerHTML=tcs.length===0?'<div class="empty">Sin tarjetas registradas</div>':
    tcs.map(function(t){
      return'<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #1e293b"><div><div style="font-size:13px;font-weight:500">'+(t["Banco"]||"TC")+' &middot;&middot;&middot;'+(t["Últimos 4 dígitos"]||"")+'</div><div style="font-size:11px;color:#64748b">Corte: '+(t["Fecha corte"]||"—")+' &middot; Pago: '+(t["Fecha límite pago"]||"—")+'</div></div><div style="text-align:right"><div style="color:#f87171;font-weight:600">'+fmt(t["Saldo actual"])+'</div><div style="font-size:11px;color:#64748b">Limite '+fmt(t["Límite de crédito"])+'</div></div></div>';
    }).join("");

  document.getElementById("fin-msi").innerHTML=msiAct.length===0?'<div class="empty">Sin MSI activos</div>':
    msiAct.map(function(m){
      return'<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #1e293b"><div><div style="font-size:13px;font-weight:500">'+(m["Concepto"]||"MSI")+'</div><div style="font-size:11px;color:#64748b">'+(m["Meses Restantes"]||"—")+' meses &middot; '+(m["Banco"]||"")+'</div></div><div style="text-align:right"><div style="color:#fbbf24;font-weight:600">'+fmt(m["Pago Mensual MXN"])+'/mes</div></div></div>';
    }).join("");

  document.getElementById("fin-tbody").innerHTML=gastos.length===0?erow(6,"Sin gastos registrados"):
    gastos.slice().reverse().slice(0,30).map(function(g){
      var comp=g["Comprobante Drive"]?'<a href="'+g["Comprobante Drive"]+'" target="_blank" style="color:#60a5fa;font-size:11px">Ver</a>':"—";
      return'<tr><td style="color:#94a3b8">'+(g["Fecha"]||"—")+'</td><td style="font-weight:500">'+(g["Concepto"]||"—")+'</td><td style="color:#94a3b8">'+(g["Categoría"]||"—")+'</td><td style="color:#fbbf24;font-weight:500">'+fmt(g["Monto"])+'</td><td style="color:#64748b">'+(g["Método de pago"]||"—")+'</td><td>'+comp+'</td></tr>';
    }).join("");
}

function renderCompras(){
  var c=DATA.comp;
  var act=c.filter(function(a){return a["Estado"]&&a["Estado"].indexOf("Cerrado")===-1;});
  document.getElementById("comp-metrics").innerHTML=
    '<div class="metric-card" style="--accent:#34d399"><div class="metric-label">Activos</div><div class="metric-val">'+act.length+'</div></div>'+
    '<div class="metric-card" style="--accent:#fbbf24"><div class="metric-label">Presupuesto</div><div class="metric-val">'+fmt(act.reduce(function(s,a){return s+(+a["Precio Estimado"]||0);},0))+'</div></div>'+
    '<div class="metric-card" style="--accent:#4ade80"><div class="metric-label">Completados</div><div class="metric-val">'+c.filter(function(a){return a["Estado"]&&a["Estado"].indexOf("Cerrado")!==-1;}).length+'</div></div>';

  document.getElementById("comp-tbody").innerHTML=c.length===0?erow(7,"Sin articulos registrados"):
    c.map(function(a){
      return'<tr><td style="font-weight:500">'+(a["Artículo"]||"—")+'</td><td>'+bdg(a["Prioridad"]||"Media",pc(a["Prioridad"]))+'</td><td style="color:#64748b">'+(a["Etapa"]||"0")+'</td><td>'+bdg(a["Estado"]||"—",ec(a["Estado"]))+'</td><td style="color:#94a3b8">'+fmt(a["Precio Estimado"])+'</td><td style="color:#4ade80">'+fmt(a["Precio Real"])+'</td><td style="color:#64748b">'+(a["Tienda Compra"]||"—")+'</td></tr>';
    }).join("");
}

function renderNutricion(){
  var menu=DATA.nut.menu,despensa=DATA.nut.despensa,compras=DATA.nut.compras,historial=DATA.nut.historial;
  var totalCal=menu.reduce(function(s,m){return s+(+m["Calorias"]||+m["Calorías"]||0);},0);
  var totalProt=menu.reduce(function(s,m){return s+(+m["Proteina (g)"]||+m["Proteína (g)"]||0);},0);
  var dias=menu.length>0?Math.max(1,Math.ceil(menu.length/3)):1;
  document.getElementById("nut-metrics").innerHTML=
    '<div class="metric-card" style="--accent:#34d399"><div class="metric-label">Platillos esta semana</div><div class="metric-val">'+menu.length+'</div></div>'+
    '<div class="metric-card" style="--accent:#fbbf24"><div class="metric-label">Prom. calorias/dia</div><div class="metric-val">'+(menu.length>0?Math.round(totalCal/dias):"—")+'</div></div>'+
    '<div class="metric-card" style="--accent:#60a5fa"><div class="metric-label">Prom. proteina/dia</div><div class="metric-val">'+(menu.length>0?Math.round(totalProt/dias)+"g":"—")+'</div></div>'+
    '<div class="metric-card" style="--accent:#a78bfa"><div class="metric-label">En despensa</div><div class="metric-val">'+despensa.filter(function(d){return d["Disponible"]!=="No";}).length+'</div></div>';

  document.getElementById("nut-menu-tbody").innerHTML=menu.length===0?erow(7,"El agente generara el menu este domingo"):
    menu.map(function(m){
      var rec=m["Receta URL"]?'<a href="'+m["Receta URL"]+'" target="_blank" style="color:#60a5fa;font-size:11px">Ver</a>':"—";
      return'<tr><td style="color:#94a3b8">'+(m["Dia"]||m["Día"]||"—")+'</td><td>'+(m["Tiempo"]||"—")+'</td><td style="font-weight:500">'+(m["Platillo"]||"—")+'</td><td style="color:#fbbf24">'+(m["Calorias"]||m["Calorías"]||"—")+'</td><td style="color:#4ade80">'+(m["Proteina (g)"]||m["Proteína (g)"]||"—")+'</td><td style="color:#f87171">'+(m["Carbohidratos (g)"]||"—")+'</td><td>'+rec+'</td></tr>';
    }).join("");

  document.getElementById("nut-despensa-tbody").innerHTML=despensa.length===0?erow(6,"Sin inventario"):
    despensa.map(function(d){
      return'<tr><td style="font-weight:500">'+(d["Ingrediente"]||"—")+'</td><td style="color:#94a3b8">'+(d["Categoria"]||"—")+'</td><td>'+(d["Cantidad"]||"—")+'</td><td style="color:#64748b">'+(d["Unidad"]||"—")+'</td><td style="color:#f87171">'+(d["Fecha Caducidad"]||"—")+'</td><td>'+bdg(d["Disponible"]||"Si",d["Disponible"]==="No"?"#f87171":"#4ade80")+'</td></tr>';
    }).join("");

  document.getElementById("nut-compras-tbody").innerHTML=compras.length===0?erow(4,"Sin lista de compras"):
    compras.map(function(c){
      return'<tr><td style="font-weight:500">'+(c["Ingrediente"]||"—")+'</td><td style="color:#94a3b8">'+(c["Categoria"]||"—")+'</td><td>'+(c["Cantidad"]||"—")+'</td><td>'+bdg(c["Comprado"]||"No",c["Comprado"]==="Si"?"#4ade80":"#f87171")+'</td></tr>';
    }).join("");

  document.getElementById("nut-hist-tbody").innerHTML=historial.length===0?erow(6,"Sin historial"):
    historial.slice().reverse().slice(0,30).map(function(h){
      return'<tr><td style="color:#94a3b8">'+(h["Fecha"]||"—")+'</td><td>'+(h["Tiempo"]||"—")+'</td><td style="font-weight:500">'+(h["Platillo"]||"—")+'</td><td style="color:#fbbf24">'+(h["Calorias"]||h["Calorías"]||"—")+'</td><td style="color:#4ade80">'+(h["Proteina (g)"]||"—")+'</td><td style="color:#f87171">'+(h["Carbohidratos (g)"]||"—")+'</td></tr>';
    }).join("");
}

checkSession();